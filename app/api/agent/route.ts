// Agentic Petal endpoint. POST { message, history? } → a Server-Sent Event stream.
// Runs the tool-use agent: it reads firm state freely and STAGES writes as proposedActions
// for the preparer to confirm (nothing mutates here). Auth-gated; §7216-real under the flag.
//
// EVENT CONTRACT (text/event-stream — do NOT change shape):
//   event: step\n  data: {"label":"<present-tense human action>"}\n\n   — per phase/tool
//   event: text\n  data: {"delta":"<token text>","turn":<n>}\n\n         — live answer streaming
//   event: done\n  data: {"reply":"<text>","proposedActions":[...]}\n\n   — terminal result
//   event: error\n data: {"error":"<short>"}\n\n                          — terminal on failure

import { NextResponse } from "next/server";
import { getFirmContext } from "@/lib/auth/context";
import { withFirm } from "@/lib/auth/tenant";
import { runAgent, type AgentTurn } from "@/lib/agent/runner";
import { stageConversationalProposals } from "@/lib/agent/stage-proposals";
import { appendMessage, updateMessage } from "@/lib/repository/chat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sanitizeHistory(raw: unknown): AgentTurn[] {
  if (!Array.isArray(raw)) return [];
  const out: AgentTurn[] = [];
  for (const t of raw) {
    const role = (t as { role?: unknown })?.role;
    const content = (t as { content?: unknown })?.content;
    if ((role === "user" || role === "assistant") && typeof content === "string" && content.trim()) {
      out.push({ role, content: content.slice(0, 8000) });
    }
  }
  return out.slice(-8);
}

export async function POST(req: Request) {
  const ctx = await getFirmContext().catch(() => null);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }
  const message = (body as { message?: unknown }).message;
  if (typeof message !== "string" || !message.trim()) return NextResponse.json({ error: "message_required" }, { status: 400 });
  if (message.length > 8000) return NextResponse.json({ error: "message_too_long" }, { status: 413 });

  const history = sanitizeHistory((body as { history?: unknown }).history);
  const text = message; // narrowed string
  // DURABLE RUNS (opt-in): when the client passes its threadId, the run is persisted SERVER-SIDE as it
  // streams, so it survives a navigation / tab close (the server keeps executing after the client
  // disconnects) and reconnects to where it is. Absent ⇒ unchanged behavior. All persistence below is
  // best-effort and wrapped: it can NEVER break the SSE stream.
  const rawThread = (body as { threadId?: unknown }).threadId;
  const threadId = typeof rawThread === "string" && rawThread.trim() ? rawThread.trim() : null;

  // Stream the run as SSE: `step` frames as the agent reasons/dispatches tools, then a terminal
  // `done` (or `error`) frame. The agent loop's safety contract is unchanged — reads auto-run,
  // writes are STAGED into proposedActions, nothing mutates here.
  const encoder = new TextEncoder();
  const frame = (event: string, data: unknown) =>
    encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // Durable-run state (server-side, opt-in via threadId). Created lazily; every persist is best-effort.
      let runMsgId: string | null = null;
      const traceSteps: Array<{ label: string; phase?: string; chips?: string[]; chipKind?: string }> = [];
      let partialText = "";
      let lastPersist = 0;
      let persistInFlight = false;
      const persistProgress = () => {
        if (!runMsgId || persistInFlight || Date.now() - lastPersist < 1500) return;
        lastPersist = Date.now();
        persistInFlight = true;
        void withFirm((db, c) => updateMessage(db, c, { messageId: runMsgId!, metadata: { status: "running", trace: traceSteps, partialText } }))
          .catch(() => {})
          .finally(() => { persistInFlight = false; });
      };
      try {
        if (threadId) {
          try {
            runMsgId = (await withFirm((db, c) => appendMessage(db, c, { threadId, role: "assistant", content: "", metadata: { status: "running", trace: [] } }))) ?? null;
          } catch { runMsgId = null; }
        }
        const { reply, proposedActions, citations, calibration, ungroundedFigures } = await runAgent(text, history, {
          scope: "real",
          onEvent: (e) => {
            // Best-effort: if the client already disconnected, enqueue throws — swallow it.
            try {
              if (e.type === "text") { partialText += e.delta; controller.enqueue(frame("text", { delta: e.delta, turn: e.turn })); }
              else {
                traceSteps.push({ label: e.label, phase: e.phase, chips: e.chips, chipKind: e.chipKind });
                controller.enqueue(frame("step", { label: e.label, phase: e.phase, chips: e.chips, chipKind: e.chipKind }));
                persistProgress();
              }
            } catch { /* closed */ }
          },
        });
        // FINALIZE the durable run: the settled answer + status=final, so a reconnect shows it complete.
        // Citations are mapped to the SAME { cite, url, authority } shape restoreAnswer reads, so a reopened
        // server-persisted turn restores its clickable sources exactly like a client-persisted one.
        if (runMsgId) {
          try {
            const restorable = (citations ?? []).map((x) => ({ cite: x.cite, url: x.sourceUrl, authority: x.authority }));
            await withFirm((db, c) => updateMessage(db, c, { messageId: runMsgId!, content: reply, metadata: { status: "final", citations: restorable, calibration, ungroundedFigures } }));
          } catch { /* best-effort */ }
        }
        // DRAFT-EVERYTHING / HUMAN-COMMITS: persist any staged write into the durable, approvable
        // queue (action_proposals) so it does not vanish with the stream (RULE 1). It becomes resolvable
        // via resolveProposalAction with all its guards. HONEST DEGRADATION: a persistence failure is
        // surfaced as proposalsPersisted:false — never silently dropped.
        let stagedProposals: { id: string; toolName: string; title: string; riskLane: string | null }[] = [];
        let proposalsPersisted = true;
        if (proposedActions.length > 0) {
          try {
            const staged = await withFirm((db, ctx) => stageConversationalProposals(db, ctx, { message: text, proposedActions }));
            if (staged) stagedProposals = staged.proposals;
            else proposalsPersisted = false; // not signed in (ctx was checked above; defensive)
          } catch (e) {
            proposalsPersisted = false;
            console.error("[/api/agent] proposal persistence failed:", e instanceof Error ? e.name : "unknown");
          }
        }
        controller.enqueue(frame("done", { reply, proposedActions, citations, calibration, ungroundedFigures, stagedProposals, proposalsPersisted, runPersisted: !!runMsgId }));
      } catch (err) {
        const name = err instanceof Error ? err.name : "unknown";
        const msg = err instanceof Error ? err.message : "";
        const error = /§7216|7216 gate/.test(msg) ? "gated_7216" : name;
        if (error !== "gated_7216") console.error("[/api/agent] failed:", name);
        // Mark a persisted run errored (not forever "running") so a reconnect shows the failure. Best-effort.
        if (runMsgId) {
          try { await withFirm((db, c) => updateMessage(db, c, { messageId: runMsgId!, content: "", metadata: { status: "error", error } })); } catch { /* best-effort */ }
        }
        try { controller.enqueue(frame("error", { error })); } catch { /* closed */ }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
    },
  });
}

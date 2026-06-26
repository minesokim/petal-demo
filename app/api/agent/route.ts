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

  // Stream the run as SSE: `step` frames as the agent reasons/dispatches tools, then a terminal
  // `done` (or `error`) frame. The agent loop's safety contract is unchanged — reads auto-run,
  // writes are STAGED into proposedActions, nothing mutates here.
  const encoder = new TextEncoder();
  const frame = (event: string, data: unknown) =>
    encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const { reply, proposedActions, citations, calibration, ungroundedFigures } = await runAgent(text, history, {
          scope: "real",
          onEvent: (e) => {
            // Best-effort: if the client already disconnected, enqueue throws — swallow it.
            try {
              if (e.type === "text") controller.enqueue(frame("text", { delta: e.delta, turn: e.turn }));
              else controller.enqueue(frame("step", { label: e.label }));
            } catch { /* closed */ }
          },
        });
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
        controller.enqueue(frame("done", { reply, proposedActions, citations, calibration, ungroundedFigures, stagedProposals, proposalsPersisted }));
      } catch (err) {
        const name = err instanceof Error ? err.name : "unknown";
        const msg = err instanceof Error ? err.message : "";
        const error = /§7216|7216 gate/.test(msg) ? "gated_7216" : name;
        if (error !== "gated_7216") console.error("[/api/agent] failed:", name);
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

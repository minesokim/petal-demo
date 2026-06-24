// Agentic Petal endpoint. POST { message, history? } → { reply, proposedActions }.
// Runs the tool-use agent: it reads firm state freely and STAGES writes as proposedActions
// for the preparer to confirm (nothing mutates here). Auth-gated; §7216-real under the flag.

import { NextResponse } from "next/server";
import { getFirmContext } from "@/lib/auth/context";
import { runAgent, type AgentTurn } from "@/lib/agent/runner";

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

  try {
    const { reply, proposedActions } = await runAgent(message, sanitizeHistory((body as { history?: unknown }).history), { scope: "real" });
    return NextResponse.json({ reply, proposedActions }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (/§7216|7216 gate/.test(msg)) return NextResponse.json({ error: "gated_7216", detail: msg }, { status: 403 });
    console.error("[/api/agent] failed:", err instanceof Error ? err.name : "unknown");
    return NextResponse.json({ error: "agent_error" }, { status: 502 });
  }
}

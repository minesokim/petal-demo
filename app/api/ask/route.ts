// Ask Petal — the real assistant. POST { message, history? } → { reply }.
// This is the GENERAL tax/app Q&A endpoint: it answers questions about returns,
// the app, deadlines, and firm workflow in the abstract. It does NOT read client
// records and must NOT be sent real taxpayer PII.
//
// §7216 SAFETY (non-negotiable):
//  - We redact the user's message AND every prior turn (redactText) before they
//    leave the process. SSN/ITIN/EIN/card runs are masked.
//  - We do NOT auto-inject any client record into the prompt — no names, returns,
//    or balances are added server-side. Only what the user typed is sent.
//  - A system note tells the model to refuse to surface or request specific client
//    PII and to keep answers general until the §7216 attorney opinion ships.
// Running the assistant OVER real taxpayer data stays gated on that opinion; see
// docs/superpowers/specs/2026-06-23-tax-ai-master-spec.md.

import { NextResponse } from "next/server";
import { AnthropicProvider } from "@/lib/ai/anthropic";
import { PETAL_ASSISTANT_SYSTEM } from "@/lib/ai/prompts";
import { redactText } from "@/lib/ai/redact";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ZDR-eligible chat model. Fast tier for conversational latency; override per-request
// with { model } if a heavier answer is needed. Both Opus and Haiku are ZDR.
const CHAT_MODEL = "claude-haiku-4-5";

// One-line §7216 guard appended to the persona prompt. General answers only;
// never request or expose a specific client's PII.
const PII_GUARDRAIL =
  "\n\nSafety: Answer general tax and product questions only. You do not have access " +
  "to specific client records here. Never request, infer, or expose a specific client's " +
  "private data (names tied to SSNs, SSNs/EINs, account or return contents). If asked for " +
  "a specific client's private details, say that lives in their record and offer general help instead.";

type Turn = { role: "user" | "assistant"; content: string };

function sanitizeHistory(raw: unknown): Turn[] {
  if (!Array.isArray(raw)) return [];
  const out: Turn[] = [];
  for (const t of raw) {
    if (!t || typeof t !== "object") continue;
    const role = (t as { role?: unknown }).role;
    const content = (t as { content?: unknown }).content;
    if ((role === "user" || role === "assistant") && typeof content === "string" && content.trim()) {
      // redact at the boundary too; the provider redacts again before send (defense in depth)
      out.push({ role, content: redactText(content).slice(0, 8000) });
    }
  }
  // keep context bounded — last 10 turns
  return out.slice(-10);
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const message = (body as { message?: unknown }).message;
  if (typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "message_required" }, { status: 400 });
  }

  const history = sanitizeHistory((body as { history?: unknown }).history);

  let provider: AnthropicProvider;
  try {
    provider = new AnthropicProvider();
  } catch {
    // ANTHROPIC_API_KEY missing — surface a clean 503 so the UI can fall back.
    return NextResponse.json({ error: "ai_unavailable" }, { status: 503 });
  }

  try {
    const { text, model } = await provider.generateText({
      system: PETAL_ASSISTANT_SYSTEM + PII_GUARDRAIL,
      // redactText is also applied inside the provider; doing it here keeps the
      // raw message from ever being held un-redacted past this boundary.
      prompt: redactText(message.slice(0, 8000)),
      history,
      model: CHAT_MODEL,
    });

    if (!text) {
      return NextResponse.json({ error: "empty_reply" }, { status: 502 });
    }

    return NextResponse.json(
      { reply: text, model },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("[/api/ask] generateText failed", err);
    return NextResponse.json({ error: "ai_error" }, { status: 502 });
  }
}

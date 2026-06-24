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
import { getFirmContext } from "@/lib/auth/context";

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

// Tax-law abstention guardrail. THIS path is the fallback assistant — it has NO access to Petal's
// grounded, cited research engine, and its training knowledge of tax law may be stale (major
// changes such as the 2025 OBBBA can post-date it). It must therefore NEVER assert a specific tax
// figure or "current law" from memory; a confident stale number is the worst failure for a tax tool.
const TAX_LAW_GUARDRAIL =
  "\n\nTax-law accuracy (critical): You do NOT have Petal's grounded, cited tax-research engine in " +
  "this conversation, and your own knowledge of tax law may be out of date — major legislation " +
  "(e.g. the 2025 One Big Beautiful Bill Act / OBBBA, P.L. 119-21) can post-date your training and " +
  "change caps, thresholds, rates, and deadlines. So NEVER state a specific tax figure, dollar cap, " +
  "threshold, rate, phase-out, or 'the current law for tax year X' from memory, and never claim a " +
  "rule is 'scheduled to sunset' or that a change was merely 'proposed/floated' — you may be " +
  "confidently wrong. Instead: explain the general mechanics if helpful, then say the specific " +
  "current figure must be confirmed through Petal's cited research, and offer to look it up. " +
  "Abstaining is always better than a confident stale number.";

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
  // Auth: not a public endpoint. A signed-in firm only — stops anonymous abuse of the model
  // and ties every call to a tenant. (The demo chat falls back to the scripted bank on 401.)
  const ctx = await getFirmContext().catch(() => null);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

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
  if (message.length > 8000) {
    return NextResponse.json({ error: "message_too_long" }, { status: 413 });
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
      system: PETAL_ASSISTANT_SYSTEM + PII_GUARDRAIL + TAX_LAW_GUARDRAIL,
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
    // Never log the raw error: on a real-data path a ZodError/SDK error can embed the
    // model's echoed taxpayer figures, and Vercel logs are a 30-day sink outside ZDR.
    console.error("[/api/ask] generateText failed:", err instanceof Error ? err.name : "unknown");
    return NextResponse.json({ error: "ai_error" }, { status: 502 });
  }
}

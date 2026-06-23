// ④ Tax-AI compute endpoint. POST { question, scope? } → a tiered, cited TaxAnswer.
// The defensible path: Sonnet PROPOSES the worksheet + inputs (extracted from the question),
// the deterministic lib/tax core COMPUTES the figure, and Opus (a DIFFERENT model) judges the
// proposal's fidelity — the tier is derived from those signals, never self-reported.
//
// §7216: the question may carry taxpayer data, so this is real-data AI. It is auth-gated
// (a signed-in firm) and runs under assertCleared("real") — which passes only because
// PETAL_7216_CLEARED is set (David's explicit, recorded decision). Drop the flag to re-gate.

import { NextResponse } from "next/server";
import { AnthropicProvider } from "@/lib/ai/anthropic";
import { getFirmContext } from "@/lib/auth/context";
import { answerComputation } from "@/lib/tax-ai/orchestrator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ctx = await getFirmContext().catch(() => null);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const question = (body as { question?: unknown }).question;
  if (typeof question !== "string" || !question.trim()) {
    return NextResponse.json({ error: "question_required" }, { status: 400 });
  }
  const taxYear = Number((body as { taxYear?: unknown }).taxYear) || 2025;

  // Proposer = Sonnet (routine grounded generation); judge = Opus (hard reasoning). Both ZDR.
  let proposer: AnthropicProvider;
  let judge: AnthropicProvider;
  try {
    proposer = new AnthropicProvider(undefined, "claude-sonnet-4-6");
    judge = new AnthropicProvider(undefined, "claude-opus-4-8");
  } catch {
    return NextResponse.json({ error: "ai_unavailable" }, { status: 503 });
  }

  try {
    const answer = await answerComputation(proposer, question, question, {
      taxYear,
      scope: "real", // taxpayer data → the model; gated by PETAL_7216_CLEARED
      judge,
    });
    return NextResponse.json({ answer }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "compute_failed";
    // assertCleared throws if the §7216 flag is off → surface a clean 403 the UI can explain.
    if (/§7216|7216 gate/.test(msg)) return NextResponse.json({ error: "gated_7216", detail: msg }, { status: 403 });
    console.error("[/api/tax/compute] failed", err);
    return NextResponse.json({ error: "compute_failed" }, { status: 502 });
  }
}

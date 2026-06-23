// ④ Tax-AI orchestrator (L3 → L2 → L5). This is the bridge layer that connects the MODEL
// (lib/ai) to the DETERMINISTIC core (lib/tax):
//   1. L3 — the model proposes a ComputeRequest (which worksheet + the structured inputs).
//      It does NOT compute the credit; the schema validates its proposal at the tool boundary.
//   2. L2 — lib/tax computes the filed number (cited, validated). The model's arithmetic
//      never lands on a return.
//   3. L5 — the confidence tier is DERIVED from the deterministic result's signals (its
//      flags), not the model's self-report. A review-tier flag (e.g. an FTB-3514 estimate)
//      caps the tier; a reject flag is surfaced as a determination the preparer confirms.
//
// §7216: the model sees the taxpayer's return facts, so the caller declares the data scope
// (assertCleared). Tests run on synthetic facts (scope "synthetic", always passes);
// production callers pass "real" (gated by PETAL_7216_CLEARED).

import type { AIProvider } from "../ai/provider";
import { assertCleared, type DataScope } from "../ai/guard";
import type { Citation, Flag } from "../tax/types";
import { ComputeRequest, compute, type ComputeResult } from "./compute";

const PROPOSE_SYSTEM = `You route a tax question to the correct deterministic worksheet.
Given a question and a taxpayer's return facts, choose exactly ONE worksheet and emit its
structured inputs precisely. You do NOT compute the credit or deduction — a deterministic
engine computes the number from the inputs you propose. Map the facts faithfully; do not
invent values not present in the facts.`;

export type Tier = "high" | "medium" | "low" | "abstain";

export type TaxAnswer = {
  worksheet: ComputeResult["worksheet"];
  taxYear: number;
  value: number; // computed by lib/tax — the authoritative figure
  citations: Citation[];
  flags: Flag[];
  tier: Tier;
  reviewNotes: string[]; // what the preparer must check before adopting (never auto-filed)
};

export type AnswerOpts = { taxYear?: number; scope?: DataScope };

// L3: the model proposes the request; lib/tax computes. Returns the deterministic result.
export async function proposeAndCompute(
  provider: AIProvider,
  question: string,
  facts: unknown,
  opts: AnswerOpts = {},
): Promise<ComputeResult> {
  assertCleared(opts.scope ?? "synthetic");
  const { object } = await provider.generateObject({
    system: PROPOSE_SYSTEM,
    prompt: `Question:\n${question}\n\nReturn facts (JSON):\n${JSON.stringify(facts)}`,
    schema: ComputeRequest,
    maxTokens: 800,
  });
  return compute(object, opts.taxYear ?? 2025);
}

// L5: derive the confidence tier from the deterministic result's signals.
//  - a "review" flag (e.g. a bounded estimate pending the exact authority) → cap at medium;
//  - a "reject" flag is a determination ("no credit, because …") surfaced for confirmation,
//    not a low-confidence guess, so it does not lower the tier;
//  - otherwise → high. The model never sets this.
function deriveTier(flags: Flag[]): Tier {
  if (flags.some((f) => f.severity === "review")) return "medium";
  return "high";
}

// Full path: propose → compute → tier. The value + citations + tier are all from code; the
// model only chose the worksheet + mapped the inputs (schema-validated). Output is a
// PROPOSAL for the preparer to adopt — never a filed figure.
export async function answerComputation(
  provider: AIProvider,
  question: string,
  facts: unknown,
  opts: AnswerOpts = {},
): Promise<TaxAnswer> {
  const { worksheet, taxYear, result } = await proposeAndCompute(provider, question, facts, opts);
  const reviewNotes = result.flags
    .filter((f) => f.severity === "review" || f.severity === "reject")
    .map((f) => f.message);
  return {
    worksheet,
    taxYear,
    value: result.value,
    citations: result.citations,
    flags: result.flags,
    tier: deriveTier(result.flags),
    reviewNotes,
  };
}

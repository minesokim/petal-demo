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

import { z } from "zod";
import type { AIProvider } from "../ai/provider";
import { assertCleared, type DataScope } from "../ai/guard";
import type { Citation, Flag } from "../tax/types";
import { ComputeRequest, compute, type ComputeResult } from "./compute";
import { verifyProposal, type ProposalVerdict } from "./verify";

// Anthropic tool input_schema must be a top-level object; a Zod discriminated union compiles
// to `{anyOf:[…]}` (no top-level "type"), so we nest the union under `request`.
const ProposeSchema = z.object({ request: ComputeRequest });

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
  verdict?: ProposalVerdict; // the adversarial judge's fidelity verdict, when a judge is supplied
};

// `judge` is a SEPARATE provider (a different model than `provider`, per the spec) that
// adversarially checks the proposal's fidelity. Omit it to skip L4 (tier then rests on the
// deterministic flags alone).
export type AnswerOpts = { taxYear?: number; scope?: DataScope; judge?: AIProvider };

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
    schema: ProposeSchema,
    maxTokens: 800,
  });
  return compute(object.request, opts.taxYear ?? 2025);
}

// L5: derive the confidence tier from the deterministic signals + the adversarial verdict.
//  - judge says the inputs are NOT faithful (or citations off-point) → "low": the model may
//    have mis-mapped the facts, so the preparer must scrutinize before adopting;
//  - a "review" flag (e.g. a bounded estimate pending the exact authority) → "medium";
//  - a "reject" flag is a determination ("no credit, because …") surfaced for confirmation,
//    not a low-confidence guess, so it does not by itself lower the tier;
//  - otherwise → "high". The model never sets this.
function deriveTier(flags: Flag[], verdict?: ProposalVerdict): Tier {
  if (verdict && (!verdict.faithful || !verdict.citationsOnPoint)) return "low";
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
  const computed = await proposeAndCompute(provider, question, facts, opts);
  const { worksheet, taxYear, result } = computed;

  // L4 — adversarial fidelity check by a separate model, when a judge is supplied.
  const verdict = opts.judge
    ? await verifyProposal(opts.judge, question, facts, computed, opts.scope ?? "synthetic")
    : undefined;

  const reviewNotes = [
    ...result.flags.filter((f) => f.severity === "review" || f.severity === "reject").map((f) => f.message),
    ...(verdict?.issues ?? []),
  ];
  return {
    worksheet,
    taxYear,
    value: result.value,
    citations: result.citations,
    flags: result.flags,
    tier: deriveTier(result.flags, verdict),
    reviewNotes,
    verdict,
  };
}

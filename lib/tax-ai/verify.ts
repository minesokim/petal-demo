// ④ L4 — adversarial verification of the model's PROPOSAL. The proposer chose a worksheet
// and mapped the taxpayer's facts into its inputs; a SEPARATE model (the judge — a different
// model than the proposer, per the spec) checks, adversarially, whether that mapping is
// faithful to the stated facts and whether the result's citations resolve to real authority.
// The judge does NOT recompute the number (lib/tax already did) — it polices fidelity, which
// is where a model-proposed input set can silently go wrong (e.g. swapping AGI for earned
// income, miscounting children). Binary rubric → high judge accuracy.

import { z } from "zod";
import type { AIProvider } from "../ai/provider";
import { assertCleared, type DataScope } from "../ai/guard";
import type { ComputeResult } from "./compute";

const VERIFY_SYSTEM = `You are an adversarial reviewer of a tax computation's INPUTS. You are
given a taxpayer's facts and the inputs another system proposed for a specific IRS worksheet.
Your only job: decide whether each proposed input faithfully reflects the facts. Be strict —
flag every mismatch (wrong filing status, AGI vs earned income swapped, miscounted children/
dependents, an amount not present in the facts). Do NOT recompute the credit; a deterministic
engine already did. Judge ONLY the fidelity of the inputs and whether the cited authorities are
on-point. Default to faithful=false if anything is ambiguous or unsupported.`;

export const ProposalVerdict = z.object({
  faithful: z.boolean(), // do the proposed inputs match the stated facts?
  citationsOnPoint: z.boolean(), // do the result's citations point to relevant authority?
  issues: z.array(z.string()), // specific mismatches the preparer must check
});
export type ProposalVerdict = z.infer<typeof ProposalVerdict>;

export async function verifyProposal(
  judge: AIProvider,
  question: string,
  facts: unknown,
  computed: ComputeResult,
  scope: DataScope = "synthetic",
): Promise<ProposalVerdict> {
  assertCleared(scope);
  const { object } = await judge.generateObject({
    system: VERIFY_SYSTEM,
    prompt:
      `Question:\n${question}\n\n` +
      `Taxpayer facts (JSON):\n${JSON.stringify(facts)}\n\n` +
      `Worksheet chosen: ${computed.worksheet}\n` +
      `Proposed inputs (JSON):\n${JSON.stringify(computed.request.facts)}\n\n` +
      `Deterministic result: ${computed.result.value}\n` +
      `Citations: ${computed.result.citations.map((c) => c.cite).join("; ")}`,
    schema: ProposalVerdict,
    maxTokens: 800,
  });
  return object;
}

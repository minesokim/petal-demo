// ④ L3↔L2 compute bridge. THE mechanism that makes the tax AI defensible: the MODEL
// proposes structured inputs (a ComputeRequest), and the DETERMINISTIC core (lib/tax)
// computes the filed number. The model never does the arithmetic — `compute()` calls the
// verified worksheet. This module imports lib/tax (deterministic) but NOT lib/ai (model):
// it is the pure, testable dispatch the orchestrator runs after the model proposes inputs.

import { z } from "zod";
import { getFigures } from "../tax/figures";
import type { WorksheetResult } from "../tax/types";
import { eitc } from "../tax/worksheets/eitc";
import { childTaxCredit } from "../tax/worksheets/ctc";
import { aotc } from "../tax/worksheets/aotc";
import { qbi } from "../tax/worksheets/qbi";
import { standardDeduction } from "../tax/worksheets/standard-deduction";

const filingStatus = z.enum(["single", "mfj", "mfs", "hoh", "qss"]);

// Zod mirrors of each worksheet's facts type — the model emits exactly these shapes, so a
// malformed proposal is rejected at the tool-call boundary before it can reach lib/tax.
const eitcFacts = z.object({
  earnedIncome: z.number(),
  agi: z.number(),
  investmentIncome: z.number(),
  qualifyingChildren: z.number().int().min(0),
  filingStatus,
  taxpayerSsnValidForWork: z.boolean(),
  age: z.number().int().optional(),
});

const ctcFacts = z.object({
  qualifyingChildren: z.number().int().min(0),
  otherDependents: z.number().int().min(0),
  agi: z.number(),
  filingStatus,
  earnedIncome: z.number(),
  taxLiabilityBeforeCredits: z.number(),
});

const aotcStudent = z.object({
  qualifiedExpenses: z.number(),
  yearsAOTCClaimed: z.number().int().min(0),
  halfTimeOneAcademicPeriod: z.boolean(),
  felonyDrugConviction: z.boolean(),
});
const aotcFacts = z.object({
  students: z.array(aotcStudent),
  magi: z.number(),
  filingStatus,
});

const qbiFacts = z.object({
  qbi: z.number(),
  taxableIncomeBeforeQBI: z.number(),
  filingStatus,
  isSSTB: z.boolean(),
  w2Wages: z.number().optional(),
  ubia: z.number().optional(),
  netCapitalGain: z.number().optional(),
});

const stdFacts = z.object({
  filingStatus,
  age65OrOlder: z.number().int().min(0).max(2).optional(),
  blind: z.number().int().min(0).max(2).optional(),
  canBeClaimedAsDependent: z.boolean().optional(),
  earnedIncome: z.number().optional(),
});

// The discriminated union the model proposes. `worksheet` selects the deterministic
// function; `facts` is that function's validated input. Phase-1 federal scope.
export const ComputeRequest = z.discriminatedUnion("worksheet", [
  z.object({ worksheet: z.literal("eitc"), facts: eitcFacts }),
  z.object({ worksheet: z.literal("ctc"), facts: ctcFacts }),
  z.object({ worksheet: z.literal("aotc"), facts: aotcFacts }),
  z.object({ worksheet: z.literal("qbi"), facts: qbiFacts }),
  z.object({ worksheet: z.literal("standardDeduction"), facts: stdFacts }),
]);
export type ComputeRequest = z.infer<typeof ComputeRequest>;

export type ComputeResult = {
  worksheet: ComputeRequest["worksheet"];
  taxYear: number;
  request: ComputeRequest; // the model's proposal — carried so a judge can check its fidelity
  result: WorksheetResult; // value + auditable lines + citations + flags — straight from lib/tax
};

// Run a model-proposed request through the DETERMINISTIC core. The returned value is
// computed by lib/tax (cited, validated), never by the model. Throws if the request is
// malformed (defense-in-depth: the schema already guards the tool-call boundary).
export function compute(request: ComputeRequest, taxYear = 2025): ComputeResult {
  const fed = getFigures(taxYear, "federal");
  const result: WorksheetResult = (() => {
    switch (request.worksheet) {
      case "eitc": return eitc(request.facts, fed);
      case "ctc": return childTaxCredit(request.facts, fed);
      case "aotc": return aotc(request.facts, fed);
      case "qbi": return qbi(request.facts, fed);
      case "standardDeduction": return standardDeduction(request.facts, fed);
    }
  })();
  return { worksheet: request.worksheet, taxYear, request, result };
}

// Worksheets barrel + the Form 1040 orchestrator (Task 12).
//
// runFederal1040(facts) is the deterministic, model-free assembler: it calls the
// individual worksheet functions (standard deduction, EITC, CTC/ACTC, AOTC, QBI, and the
// §2(b) head-of-household determination) in dependency order and collects their results,
// flags, and citations into a single ReturnComputation. It performs NO tax arithmetic of
// its own beyond routing facts to the right worksheet — every filed number is produced by a
// worksheet, which in turn pulls every dollar amount from getFigures(...). Nothing here
// imports from lib/ai/*: the model never lands a number on a filed line.
//
// "No citation, no claim": ReturnComputation.citations aggregates the (deduped) citations of
// every worksheet that ran, so the assembled return is always backed by primary authority.

import { getFigures } from "../figures";
import type { FederalFigureSet } from "../figures/federal-2025";
import type { Citation, FilingStatus, Flag, WorksheetLine, WorksheetResult } from "../types";

import { standardDeduction } from "./standard-deduction";
import { eitc } from "./eitc";
import { childTaxCredit } from "./ctc";
import { aotc, type AotcStudent } from "./aotc";
import { qbi } from "./qbi";
import { headOfHousehold, type HohResult } from "./hoh";

// Re-export the worksheets so callers have one import surface.
export { standardDeduction } from "./standard-deduction";
export { eitc } from "./eitc";
export { childTaxCredit } from "./ctc";
export { aotc } from "./aotc";
export { qbi } from "./qbi";
export { headOfHousehold } from "./hoh";

export type { StandardDeductionFacts } from "./standard-deduction";
export type { EitcFacts } from "./eitc";
export type { ChildTaxCreditFacts } from "./ctc";
export type { AotcFacts, AotcStudent } from "./aotc";
export type { QbiFacts } from "./qbi";
export type { HohFacts, HohResult } from "./hoh";

// The single fact bundle the orchestrator consumes. It is a superset of every worksheet's
// facts; the orchestrator slices the relevant subset for each call. Optional sub-objects
// (`students`, `qbi`, `hoh`) gate whether that worksheet runs at all — a return with no
// students gets no AOTC line, etc.
export type Federal1040Facts = {
  filingStatus: FilingStatus;

  // Income / status shared across worksheets.
  earnedIncome: number;
  agi: number;
  taxableIncomeBeforeQBI: number;
  taxLiabilityBeforeCredits: number;

  // EITC inputs.
  investmentIncome: number;
  qualifyingChildren: number;
  taxpayerSsnValidForWork: boolean;
  age?: number; // childless EITC 25-64 test

  // CTC inputs.
  otherDependents: number;

  // AOTC inputs (per-student). MAGI defaults to AGI when not supplied.
  magi?: number;
  students?: AotcStudent[];

  // QBI inputs. Present only for a return with qualified business income.
  qbi?: {
    qbi: number;
    isSSTB: boolean;
    w2Wages?: number;
    ubia?: number;
    netCapitalGain?: number;
  };

  // Standard-deduction-for-dependents path (rarely used in golden seed; kept for parity).
  canBeClaimedAsDependent?: boolean;
  age65OrOlder?: number;
  blind?: number;

  // Head-of-household §2(b) determination, when the return claims HoH.
  hoh?: {
    unmarriedOrConsideredUnmarried: boolean;
    paidMoreThanHalfHomeCost: boolean;
    qualifyingPerson: boolean;
  };
};

// The assembled output of a deterministic 1040 run. `credits` keeps each worksheet's full
// WorksheetResult (value + auditable lines + its own citations + its own flags). `lines` is
// the flattened 1040-style trace across all worksheets. `flags` and `citations` are the
// deduped unions across every worksheet that ran. `headOfHousehold`, when present, carries
// the §2(b) qualification determination (a boolean conclusion, not a dollar amount).
export type ReturnComputation = {
  credits: {
    standardDeduction: WorksheetResult;
    eitc: WorksheetResult;
    childTaxCredit: WorksheetResult;
    aotc: WorksheetResult;
    qbi: WorksheetResult;
  };
  headOfHousehold?: HohResult;
  lines: WorksheetLine[];
  flags: Flag[];
  citations: Citation[];
};

// An empty, schema-valid WorksheetResult for a worksheet that did not run for this return
// (e.g. no students → AOTC is $0). It still carries the figure-set's authority so the
// "no citation, no claim" invariant holds even for a not-applicable line.
function notApplicable(value: number, label: string, citation: Citation): WorksheetResult {
  return {
    value,
    lines: [{ line: "N/A", label, amount: value }],
    citations: [citation],
    flags: [],
  };
}

// Dedupe citations by their resolvable identity (authority + cite + sourceUrl).
function dedupeCitations(citations: Citation[]): Citation[] {
  const seen = new Set<string>();
  const out: Citation[] = [];
  for (const c of citations) {
    const k = `${c.authority}|${c.cite}|${c.sourceUrl}`;
    if (!seen.has(k)) {
      seen.add(k);
      out.push(c);
    }
  }
  return out;
}

/**
 * runFederal1040 — assemble a deterministic Form 1040 computation from the worksheets,
 * in dependency order. TY2025 federal figures are resolved once via getFigures and passed
 * to every worksheet, so the whole return computes against a single, cited figure set.
 */
export function runFederal1040(
  facts: Federal1040Facts,
  taxYear = 2025,
): ReturnComputation {
  const figures: FederalFigureSet = getFigures(taxYear, "federal");

  // ── 1. Standard deduction (no dependencies; feeds the taxable-income concept) ──
  const standardDeductionResult = standardDeduction(
    {
      filingStatus: facts.filingStatus,
      age65OrOlder: facts.age65OrOlder,
      blind: facts.blind,
      canBeClaimedAsDependent: facts.canBeClaimedAsDependent,
      earnedIncome: facts.earnedIncome,
    },
    figures,
  );

  // ── 2. EITC (refundable; depends on earned income + AGI + filing status) ──
  const eitcResult = eitc(
    {
      earnedIncome: facts.earnedIncome,
      agi: facts.agi,
      investmentIncome: facts.investmentIncome,
      qualifyingChildren: facts.qualifyingChildren,
      filingStatus: facts.filingStatus,
      taxpayerSsnValidForWork: facts.taxpayerSsnValidForWork,
      age: facts.age,
    },
    figures,
  );

  // ── 3. CTC / ACTC (depends on tax liability before credits) ──
  const ctcResult = childTaxCredit(
    {
      qualifyingChildren: facts.qualifyingChildren,
      otherDependents: facts.otherDependents,
      agi: facts.agi,
      filingStatus: facts.filingStatus,
      earnedIncome: facts.earnedIncome,
      taxLiabilityBeforeCredits: facts.taxLiabilityBeforeCredits,
    },
    figures,
  );

  // ── 4. AOTC (per-student; runs only when the return has students) ──
  const aotcResult: WorksheetResult = facts.students && facts.students.length > 0
    ? aotc(
        {
          students: facts.students,
          magi: facts.magi ?? facts.agi,
          filingStatus: facts.filingStatus,
        },
        figures,
      )
    : notApplicable(
        0,
        "American Opportunity Tax Credit — no students on this return (Form 8863 N/A)",
        figures.aotc.maxCredit.citation,
      );

  // ── 5. QBI (runs only when the return has qualified business income) ──
  const qbiResult: WorksheetResult = facts.qbi
    ? qbi(
        {
          qbi: facts.qbi.qbi,
          taxableIncomeBeforeQBI: facts.taxableIncomeBeforeQBI,
          filingStatus: facts.filingStatus,
          isSSTB: facts.qbi.isSSTB,
          w2Wages: facts.qbi.w2Wages,
          ubia: facts.qbi.ubia,
          netCapitalGain: facts.qbi.netCapitalGain,
        },
        figures,
      )
    : notApplicable(
        0,
        "Qualified business income deduction — no QBI on this return (§199A N/A)",
        figures.qbi.rate.citation,
      );

  // ── 6. Head-of-household §2(b) determination (only when HoH facts supplied) ──
  const hohResult: HohResult | undefined =
    facts.hoh && facts.filingStatus === "hoh" ? headOfHousehold(facts.hoh) : undefined;

  const credits = {
    standardDeduction: standardDeductionResult,
    eitc: eitcResult,
    childTaxCredit: ctcResult,
    aotc: aotcResult,
    qbi: qbiResult,
  };

  // Flatten the per-worksheet traces into a single 1040-style line list, prefixing each
  // worksheet's lines so the assembled trace stays unambiguous.
  const lines: WorksheetLine[] = [];
  const pushLines = (prefix: string, result: WorksheetResult) => {
    for (const l of result.lines) {
      lines.push({ line: `${prefix}.${l.line}`, label: l.label, amount: l.amount });
    }
  };
  pushLines("StdDed", standardDeductionResult);
  pushLines("EITC", eitcResult);
  pushLines("CTC", ctcResult);
  pushLines("AOTC", aotcResult);
  pushLines("QBI", qbiResult);

  // Union of every worksheet's flags + HoH flags.
  const flags: Flag[] = [
    ...standardDeductionResult.flags,
    ...eitcResult.flags,
    ...ctcResult.flags,
    ...aotcResult.flags,
    ...qbiResult.flags,
    ...(hohResult?.flags ?? []),
  ];

  // Deduped union of every worksheet's citations ("no citation, no claim" at the return level).
  const citations = dedupeCitations([
    ...standardDeductionResult.citations,
    ...eitcResult.citations,
    ...ctcResult.citations,
    ...aotcResult.citations,
    ...qbiResult.citations,
  ]);

  return { credits, headOfHousehold: hohResult, lines, flags, citations };
}

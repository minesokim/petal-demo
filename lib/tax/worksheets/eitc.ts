// Earned Income Tax Credit (EITC) — deterministic worksheet.
// Transcribed from IRC §32 and Pub 596 "EIC Worksheet A" (the worksheet a preparer
// completes when not using the EIC Table). Model-free: every dollar amount comes from
// getFigures(...) — this file hardcodes NO tax figure. "No citation, no claim": the
// result always carries the §32 authority the params rest on.
//
// Pub 596 Worksheet A structure:
//   Part 1 (lines 1-6): credit on earned income = min(rate * earnedIncome, maxCredit).
//   Part 2 (lines 7-11): if AGI (or, more precisely, the greater of AGI and earned
//     income) exceeds the applicable phase-out threshold, reduce by
//     phaseoutRate * (greaterOf - threshold); otherwise the Part-1 amount stands.
//   The smaller of the two is the EIC.
// Disqualifiers (IRC §32(c)/(i)/(m)) zero the credit before the arithmetic:
//   - investment income over the limit (§32(i)) — MeF-reject-style,
//   - MFS filing status (§32(d); the OBBBA-era separated-spouse exception is not modeled here),
//   - no SSN valid for work (§32(m)),
//   - childless taxpayer outside age 25-64 (§32(c)(1)(A)(ii)(II)).

import type { FilingStatus, Flag, WorksheetLine, WorksheetResult } from "../types";
import type { FederalFigureSet, EitcParams } from "../figures";

export type EitcFacts = {
  earnedIncome: number;
  agi: number;
  investmentIncome: number;
  qualifyingChildren: number;
  filingStatus: FilingStatus;
  taxpayerSsnValidForWork: boolean;
  age?: number; // required to test the childless 25-64 rule; ignored when children > 0
};

const round = (n: number) => Math.round(n * 100) / 100;

export function eitc(facts: EitcFacts, figures: FederalFigureSet): WorksheetResult {
  const {
    earnedIncome,
    agi,
    investmentIncome,
    qualifyingChildren,
    filingStatus,
    taxpayerSsnValidForWork,
    age,
  } = facts;

  // byChildren is keyed 0..3; 3 covers "3 or more" (IRC §32(b)(1)).
  const childIndex = Math.min(Math.max(qualifyingChildren, 0), 3) as 0 | 1 | 2 | 3;
  const params: EitcParams = figures.eitc.byChildren[childIndex];

  // The §32 authority for the credit itself (the params carry it on every Figure).
  const eitcCitation = params.maxCredit.citation;
  const citations = [eitcCitation];

  const lines: WorksheetLine[] = [];
  const flags: Flag[] = [];

  const disqualified = (code: string, message: string, citation = eitcCitation): WorksheetResult => {
    flags.push({ code, severity: "reject", message, citation });
    lines.push({ line: "EIC", label: "Earned income credit (disqualified)", amount: 0 });
    return { value: 0, lines, citations, flags };
  };

  // ── Disqualifiers (zero the credit; MeF-reject-style) ──

  // Filing status MFS is not allowed to claim the EIC (IRC §32(d)).
  if (filingStatus === "mfs") {
    return disqualified("EITC_MFS", "Married filing separately is not eligible for the EITC (IRC §32(d)).");
  }

  // SSN valid for work is required (IRC §32(m); §32(c)(1)(F)).
  if (!taxpayerSsnValidForWork) {
    return disqualified(
      "EITC_SSN_INVALID",
      "Taxpayer must have an SSN valid for work to claim the EITC (IRC §32(m)).",
    );
  }

  // Investment income cap (IRC §32(i)). Strictly greater than the limit disqualifies.
  const investmentLimit = figures.eitc.investmentIncomeLimit.value;
  if (investmentIncome > investmentLimit) {
    return disqualified(
      "EITC_INVESTMENT_INCOME",
      `Investment income (${investmentIncome}) exceeds the EITC limit (${investmentLimit}); no credit (IRC §32(i)).`,
      figures.eitc.investmentIncomeLimit.citation,
    );
  }

  // Childless taxpayers must be at least 25 and under 65 (IRC §32(c)(1)(A)(ii)(II)).
  if (qualifyingChildren === 0) {
    if (age === undefined || age < 25 || age > 64) {
      return disqualified(
        "EITC_CHILDLESS_AGE",
        `A taxpayer with no qualifying children must be age 25-64 to claim the EITC (age=${age ?? "unknown"}; IRC §32(c)(1)(A)(ii)(II)).`,
      );
    }
  }

  // ── Part 1: credit on earned income (phase-in, capped at the plateau max) ──
  const maxCredit = params.maxCredit.value;
  const phaseInCredit = Math.min(params.rate * earnedIncome, maxCredit);
  lines.push({ line: "1", label: "Earned income", amount: round(earnedIncome) });
  lines.push({
    line: "2",
    label: `Credit on earned income (${params.rate} × earned income, capped at max)`,
    amount: round(phaseInCredit),
  });

  // ── Part 2: phase-out on the GREATER of AGI and earned income (IRC §32(a)(2)/(b)) ──
  const isMfj = filingStatus === "mfj" || filingStatus === "qss";
  const threshold = isMfj ? params.phaseoutThresholdMFJ.value : params.phaseoutThreshold.value;
  if (isMfj) citations.push(params.phaseoutThresholdMFJ.citation);
  else citations.push(params.phaseoutThreshold.citation);

  const phaseoutBase = Math.max(agi, earnedIncome);
  lines.push({ line: "3", label: "Greater of AGI and earned income", amount: round(phaseoutBase) });
  lines.push({ line: "4", label: `Phase-out threshold (${isMfj ? "MFJ" : "single/HoH"})`, amount: threshold });

  let reduction = 0;
  if (phaseoutBase > threshold) {
    reduction = params.phaseoutRate * (phaseoutBase - threshold);
    lines.push({
      line: "5",
      label: `Phase-out reduction (${params.phaseoutRate} × excess over threshold)`,
      amount: round(reduction),
    });
  }

  const value = round(Math.max(0, phaseInCredit - reduction));
  lines.push({ line: "EIC", label: "Earned income credit (smaller of Part 1 and phased-out amount)", amount: value });

  return { value, lines, citations, flags };
}

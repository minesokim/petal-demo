// Child Tax Credit + Credit for Other Dependents + Additional (refundable) Child Tax
// Credit — transcribed from IRS Schedule 8812 (Form 1040), "Credits for Qualifying
// Children and Other Dependents" (TY2025). Pure function; model-free.
//
// Every dollar amount is read from the figures set (getFigures) — nothing tax-related
// is hardcoded here. "No citation, no claim": the result always carries §24 authority.
//
// Schedule 8812 logic implemented:
//   Part I-A
//     Line 4  = qualifying children × CTC per child            (figures.ctc.perChild)
//     Line 6  = other dependents   × ODC per dependent         (figures.ctc.odcPerDependent)
//     Line 8  = line 4 + line 6  (total potential credit)
//     Line 9  = phaseout threshold ($200k non-joint / $400k joint)
//     Line 10 = (AGI − line 9), rounded UP to next $1,000      (not below 0)
//     Line 11 = line 10 × 5%  ($50 per $1,000)                 (figures.ctc.phaseoutPer1000)
//     Line 12 = line 8 − line 11                               (not below 0)
//     Line 13 = tax liability available to absorb the credit   (facts.taxLiabilityBeforeCredits)
//     Line 14 = min(line 12, line 13) = NON-REFUNDABLE CTC+ODC → this is `value`
//   Part II-A (Additional Child Tax Credit — refundable, CTC portion only)
//     Refundable = min(
//        refundableCap × qualifyingChildren,                   (figures.ctc.refundableCap)
//        actcRate × (earnedIncome − earnedIncomeFloor),        (15% over $2,500)
//        remaining CTC after the non-refundable amount         (CTC-only, ODC excluded)
//     )                                                        → carried on line "27"

import type { FederalFigureSet } from "../figures/federal-2025";
import type { Citation, FilingStatus, WorksheetLine, WorksheetResult } from "../types";

export type ChildTaxCreditFacts = {
  qualifyingChildren: number;
  otherDependents: number;
  agi: number;
  filingStatus: FilingStatus;
  earnedIncome: number;
  taxLiabilityBeforeCredits: number;
};

// Schedule 8812 uses one threshold for MFJ and one for everyone else. Map the
// five filing statuses onto the two figure keys the figures set exposes.
function thresholdKey(status: FilingStatus): "single" | "mfj" {
  return status === "mfj" || status === "qss" ? "mfj" : "single";
}

const SCH8812: Citation = {
  authority: "IRS Schedule 8812",
  cite: "Schedule 8812 (Form 1040), Credits for Qualifying Children and Other Dependents (2025)",
  sourceUrl: "https://www.irs.gov/instructions/i1040s8",
};

export function childTaxCredit(facts: ChildTaxCreditFacts, figures: FederalFigureSet): WorksheetResult {
  const perChild = figures.ctc.perChild.value;
  const odc = figures.ctc.odcPerDependent.value;
  const refundableCap = figures.ctc.refundableCap.value;
  const per1000 = figures.ctc.phaseoutPer1000.value;
  const floor = figures.ctc.earnedIncomeFloor.value;
  const actcRate = figures.ctc.actcRate.value;
  const threshold = figures.ctc.phaseoutThreshold[thresholdKey(facts.filingStatus)].value;

  const children = Math.max(0, Math.trunc(facts.qualifyingChildren));
  const others = Math.max(0, Math.trunc(facts.otherDependents));

  // Line 4 / Line 6 / Line 8
  const ctcGross = children * perChild;
  const odcGross = others * odc;
  const potential = ctcGross + odcGross; // line 8

  // Lines 9–11: phaseout. Excess rounded UP to the next $1,000, then $50 per $1,000.
  const excess = Math.max(0, facts.agi - threshold); // line 10 (pre-rounding)
  const steps = Math.ceil(excess / 1000); // round up to whole $1,000s
  const reduction = steps * per1000; // line 11

  // Line 12: potential credit after phaseout (not below 0).
  const afterPhaseout = Math.max(0, potential - reduction);

  // The phaseout reduces the CTC portion first (the ODC and CTC are reduced together
  // on Sch 8812 line 11, but only the CTC portion can become refundable). Track how
  // much of the surviving credit is attributable to qualifying children.
  const ctcAfterPhaseout = Math.max(0, Math.min(afterPhaseout, ctcGross > 0 ? ctcGross - Math.max(0, reduction - odcGross) : 0));

  // Lines 13–14: limit by tax liability → NON-REFUNDABLE credit (the function's `value`).
  const taxLimit = Math.max(0, facts.taxLiabilityBeforeCredits); // line 13
  const nonRefundable = Math.min(afterPhaseout, taxLimit); // line 14

  // Part II-A: Additional Child Tax Credit (refundable). Only the CTC portion qualifies.
  // Remaining CTC after the non-refundable credit was applied (ODC is consumed first
  // against tax since it is never refundable, so the refundable base is the CTC that
  // survived phaseout minus whatever CTC the non-refundable amount already used).
  const nonRefundableCtcUsed = Math.max(0, nonRefundable - odcGross); // ODC absorbed first
  const remainingCtc = Math.max(0, ctcAfterPhaseout - nonRefundableCtcUsed);
  const fifteenPctMethod = Math.max(0, actcRate * (facts.earnedIncome - floor));
  const perChildCap = refundableCap * children;
  const actc = Math.min(remainingCtc, fifteenPctMethod, perChildCap);

  const lines: WorksheetLine[] = [
    { line: "4", label: "Qualifying children × CTC per child", amount: ctcGross },
    { line: "6", label: "Other dependents × ODC ($500)", amount: odcGross },
    { line: "8", label: "Total potential credit (CTC + ODC)", amount: potential },
    { line: "11", label: "Phaseout reduction ($50 per $1,000 over threshold)", amount: reduction },
    { line: "12", label: "Credit after phaseout", amount: afterPhaseout },
    { line: "13", label: "Tax liability available", amount: taxLimit },
    { line: "14", label: "Nonrefundable CTC + ODC (claimed on Form 1040)", amount: nonRefundable },
    { line: "27", label: "Additional Child Tax Credit (refundable)", amount: actc },
  ];

  return {
    value: nonRefundable,
    lines,
    citations: [SCH8812, figures.ctc.perChild.citation, figures.ctc.refundableCap.citation],
    flags: [],
  };
}

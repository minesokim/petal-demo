// Qualified-tips deduction worksheet (deterministic, model-free) — OBBBA §70201 / IRC §224.
//
// New above-the-line deduction (also allowed to non-itemizers) for qualified tips. The
// deduction is the LESSER of the tips received or the $25,000 cap, then PHASED OUT by $100
// for each $1,000 (whole increments) by which modified adjusted gross income exceeds $150,000
// ($300,000 on a joint return). Operative for tax years 2025-2028. MFS is ineligible (the
// statute requires married taxpayers to file jointly), and the occupation must be one that
// customarily received tips on or before Dec 31, 2024 (per the IRS-published list) — the
// caller asserts that with `occupationEligible`.
//
// Every dollar amount comes from getObbbaFigures(taxYear); nothing is hardcoded.

import { getObbbaFigures, JOINT_RETURN_STATUSES, OBBBA_DEDUCTION_YEARS } from "../figures/obbba-2025";
import type { Citation, FilingStatus, Flag, WorksheetLine, WorksheetResult } from "../types";

export type TipsDeductionFacts = {
  tips: number;
  magi: number;
  filingStatus: FilingStatus;
  /** True if the occupation customarily received tips on or before Dec 31, 2024 (IRS list). */
  occupationEligible: boolean;
  taxYear: number;
};

export function tipsDeduction(facts: TipsDeductionFacts): WorksheetResult {
  const { tips, magi, filingStatus, occupationEligible, taxYear } = facts;
  const f = getObbbaFigures(taxYear).tips;

  const lines: WorksheetLine[] = [];
  const citations: Citation[] = [];
  const flags: Flag[] = [];
  const seen = new Set<string>();
  const cite = (c: Citation) => {
    const k = `${c.authority}|${c.cite}|${c.sourceUrl}`;
    if (!seen.has(k)) {
      seen.add(k);
      citations.push(c);
    }
  };

  cite(f.cap.citation);

  // ── Eligibility gates (return value:0 + a reject flag) ──
  if (!OBBBA_DEDUCTION_YEARS.has(taxYear)) {
    flags.push({
      code: "TIPS_YEAR_INELIGIBLE",
      severity: "reject",
      message: `The §224 qualified-tips deduction is allowed only for tax years 2025-2028; ${taxYear} is out of range.`,
      citation: f.cap.citation,
    });
    lines.push({ line: "1", label: "Tips deduction (year out of range)", amount: 0 });
    return { value: 0, lines, citations, flags };
  }
  if (filingStatus === "mfs") {
    flags.push({
      code: "TIPS_MFS",
      severity: "reject",
      message: "A married taxpayer must file jointly to claim the §224 qualified-tips deduction; MFS is ineligible.",
      citation: f.cap.citation,
    });
    lines.push({ line: "1", label: "Tips deduction (MFS ineligible)", amount: 0 });
    return { value: 0, lines, citations, flags };
  }
  if (!occupationEligible) {
    flags.push({
      code: "TIPS_OCCUPATION_INELIGIBLE",
      severity: "reject",
      message: "Tips qualify only if the occupation customarily received tips on or before Dec 31, 2024 (per the IRS-published list); this occupation is not eligible.",
      citation: f.cap.citation,
    });
    lines.push({ line: "1", label: "Tips deduction (occupation not eligible)", amount: 0 });
    return { value: 0, lines, citations, flags };
  }

  // ── Computation ──
  const cap = f.cap.value;
  // Line 1: lesser of tips or the cap.
  const beforePhaseOut = Math.min(Math.max(0, tips), cap);
  lines.push({ line: "1", label: `Lesser of tips (${tips}) or cap (${cap})`, amount: beforePhaseOut });

  // Phase-out threshold: joint vs everyone else.
  const isJoint = JOINT_RETURN_STATUSES.has(filingStatus);
  const thresholdFig = isJoint ? f.phaseOutThreshold.mfj : f.phaseOutThreshold.default;
  cite(thresholdFig.citation);
  cite(f.phaseOutPer1000.citation);
  const threshold = thresholdFig.value;
  lines.push({ line: "2", label: "Modified adjusted gross income", amount: magi });
  lines.push({ line: "3", label: `Phase-out threshold (${isJoint ? "joint" : "non-joint"})`, amount: threshold });

  // Line 4: excess over threshold; reduction is $100 per WHOLE $1,000 of excess.
  const excess = Math.max(0, magi - threshold);
  const wholeThousands = Math.floor(excess / 1000);
  const reduction = wholeThousands * f.phaseOutPer1000.value;
  lines.push({ line: "4", label: "Excess of MAGI over threshold (not < 0)", amount: excess });
  lines.push({
    line: "5",
    label: `Phase-out reduction (${f.phaseOutPer1000.value} × ${wholeThousands} whole $1,000s over threshold)`,
    amount: reduction,
  });

  // Line 6: deduction after phase-out, not below zero.
  const value = Math.max(0, beforePhaseOut - reduction);
  lines.push({ line: "6", label: "Tips deduction (line 1 - line 5, not < 0)", amount: value });

  if (reduction > 0) {
    flags.push({
      code: "TIPS_PHASE_OUT",
      severity: "info",
      message: `MAGI of ${magi} exceeds the ${threshold} threshold; the tips deduction is reduced by ${reduction}.`,
      citation: thresholdFig.citation,
    });
  }
  if (value === 0 && beforePhaseOut > 0) {
    flags.push({
      code: "TIPS_FULLY_PHASED_OUT",
      severity: "info",
      message: `MAGI of ${magi} is high enough that the entire ${beforePhaseOut} tips deduction is phased out.`,
      citation: thresholdFig.citation,
    });
  }

  return { value, lines, citations, flags };
}

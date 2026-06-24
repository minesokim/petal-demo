// Qualified-overtime deduction worksheet (deterministic, model-free) — OBBBA §70202 / IRC §225.
//
// New above-the-line deduction (allowed to non-itemizers) for qualified overtime compensation —
// the half-time PREMIUM portion required under section 7 of the FLSA (the amount IN EXCESS of
// the regular rate). The deduction is the LESSER of that premium or the cap ($12,500; $25,000
// on a joint return), then PHASED OUT by $100 for each whole $1,000 by which modified adjusted
// gross income exceeds $150,000 ($300,000 joint). Operative for tax years 2025-2028; MFS is
// ineligible (the statute requires married taxpayers to file jointly).
//
// `overtimePremium` is the FLSA premium portion only (caller computes it); this worksheet does
// not derive it from gross overtime pay. Every dollar amount comes from getObbbaFigures(taxYear).

import { getObbbaFigures, JOINT_RETURN_STATUSES, OBBBA_DEDUCTION_YEARS } from "../figures/obbba-2025";
import type { Citation, FilingStatus, Flag, WorksheetLine, WorksheetResult } from "../types";

export type OvertimeDeductionFacts = {
  /** The FLSA half-time premium portion (the amount in excess of the regular rate). */
  overtimePremium: number;
  magi: number;
  filingStatus: FilingStatus;
  taxYear: number;
};

export function overtimeDeduction(facts: OvertimeDeductionFacts): WorksheetResult {
  const { overtimePremium, magi, filingStatus, taxYear } = facts;
  const f = getObbbaFigures(taxYear).overtime;

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

  // Cap: joint return gets $25,000, everyone else $12,500.
  const isJoint = JOINT_RETURN_STATUSES.has(filingStatus);
  const capFig = isJoint ? f.capMFJ : f.cap;
  cite(capFig.citation);

  // ── Eligibility gates ──
  if (!OBBBA_DEDUCTION_YEARS.has(taxYear)) {
    flags.push({
      code: "OVERTIME_YEAR_INELIGIBLE",
      severity: "reject",
      message: `The §225 qualified-overtime deduction is allowed only for tax years 2025-2028; ${taxYear} is out of range.`,
      citation: capFig.citation,
    });
    lines.push({ line: "1", label: "Overtime deduction (year out of range)", amount: 0 });
    return { value: 0, lines, citations, flags };
  }
  if (filingStatus === "mfs") {
    flags.push({
      code: "OVERTIME_MFS",
      severity: "reject",
      message: "A married taxpayer must file jointly to claim the §225 qualified-overtime deduction; MFS is ineligible.",
      citation: capFig.citation,
    });
    lines.push({ line: "1", label: "Overtime deduction (MFS ineligible)", amount: 0 });
    return { value: 0, lines, citations, flags };
  }

  // ── Computation ──
  const cap = capFig.value;
  // Line 1: lesser of the FLSA premium or the cap.
  const beforePhaseOut = Math.min(Math.max(0, overtimePremium), cap);
  lines.push({
    line: "1",
    label: `Lesser of FLSA overtime premium (${overtimePremium}) or cap (${cap}${isJoint ? ", joint" : ""})`,
    amount: beforePhaseOut,
  });

  const thresholdFig = isJoint ? f.phaseOutThreshold.mfj : f.phaseOutThreshold.default;
  cite(thresholdFig.citation);
  cite(f.phaseOutPer1000.citation);
  const threshold = thresholdFig.value;
  lines.push({ line: "2", label: "Modified adjusted gross income", amount: magi });
  lines.push({ line: "3", label: `Phase-out threshold (${isJoint ? "joint" : "non-joint"})`, amount: threshold });

  const excess = Math.max(0, magi - threshold);
  const wholeThousands = Math.floor(excess / 1000);
  const reduction = wholeThousands * f.phaseOutPer1000.value;
  lines.push({ line: "4", label: "Excess of MAGI over threshold (not < 0)", amount: excess });
  lines.push({
    line: "5",
    label: `Phase-out reduction (${f.phaseOutPer1000.value} × ${wholeThousands} whole $1,000s over threshold)`,
    amount: reduction,
  });

  const value = Math.max(0, beforePhaseOut - reduction);
  lines.push({ line: "6", label: "Overtime deduction (line 1 - line 5, not < 0)", amount: value });

  if (reduction > 0) {
    flags.push({
      code: "OVERTIME_PHASE_OUT",
      severity: "info",
      message: `MAGI of ${magi} exceeds the ${threshold} threshold; the overtime deduction is reduced by ${reduction}.`,
      citation: thresholdFig.citation,
    });
  }
  if (value === 0 && beforePhaseOut > 0) {
    flags.push({
      code: "OVERTIME_FULLY_PHASED_OUT",
      severity: "info",
      message: `MAGI of ${magi} is high enough that the entire ${beforePhaseOut} overtime deduction is phased out.`,
      citation: thresholdFig.citation,
    });
  }

  return { value, lines, citations, flags };
}

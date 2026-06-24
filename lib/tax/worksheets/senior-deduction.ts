// Senior additional deduction worksheet (deterministic, model-free) —
// OBBBA §70103 / IRC §151(d)(5)(C).
//
// Temporary additional deduction of $6,000 for EACH qualified individual — the taxpayer (and,
// on a joint return, the spouse) who attained age 65 before the close of the taxable year. The
// total is PHASED OUT (but not below zero) by 6% of the excess of modified adjusted gross
// income over $75,000 ($150,000 on a joint return). Operative for tax years 2025-2028; MFS is
// ineligible (the statute requires married taxpayers to file jointly).
//
// `age` here is the taxpayer-unit's count of qualifying individuals age 65+ at year-end (0, 1,
// or 2 on a joint return) — the caller resolves "age 65 before year-end" into that count. Every
// dollar amount comes from getObbbaFigures(taxYear).

import { getObbbaFigures, JOINT_RETURN_STATUSES, OBBBA_DEDUCTION_YEARS } from "../figures/obbba-2025";
import type { Citation, FilingStatus, Flag, WorksheetLine, WorksheetResult } from "../types";

export type SeniorDeductionFacts = {
  /** Count of qualifying individuals age 65+ at year-end (0–2; 2 only on a joint return). */
  age: number;
  magi: number;
  filingStatus: FilingStatus;
  taxYear: number;
};

export function seniorDeduction(facts: SeniorDeductionFacts): WorksheetResult {
  const { age, magi, filingStatus, taxYear } = facts;
  const f = getObbbaFigures(taxYear).senior;

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

  cite(f.perIndividual.citation);

  // ── Eligibility gates ──
  if (!OBBBA_DEDUCTION_YEARS.has(taxYear)) {
    flags.push({
      code: "SENIOR_YEAR_INELIGIBLE",
      severity: "reject",
      message: `The §151(d)(5)(C) senior deduction is allowed only for tax years 2025-2028; ${taxYear} is out of range.`,
      citation: f.perIndividual.citation,
    });
    lines.push({ line: "1", label: "Senior deduction (year out of range)", amount: 0 });
    return { value: 0, lines, citations, flags };
  }
  if (filingStatus === "mfs") {
    flags.push({
      code: "SENIOR_MFS",
      severity: "reject",
      message: "A married taxpayer must file jointly to claim the §151(d)(5)(C) senior deduction; MFS is ineligible.",
      citation: f.perIndividual.citation,
    });
    lines.push({ line: "1", label: "Senior deduction (MFS ineligible)", amount: 0 });
    return { value: 0, lines, citations, flags };
  }

  // Count of qualifying individuals: clamp to a non-joint max of 1, joint max of 2.
  const isJoint = JOINT_RETURN_STATUSES.has(filingStatus);
  const maxIndividuals = isJoint ? 2 : 1;
  const qualifying = Math.max(0, Math.min(Math.floor(age), maxIndividuals));

  if (qualifying === 0) {
    flags.push({
      code: "SENIOR_NO_QUALIFYING_INDIVIDUAL",
      severity: "review",
      message: "No qualifying individual age 65+ at year-end; the senior deduction is $0.",
      citation: f.perIndividual.citation,
    });
    lines.push({ line: "1", label: "Qualifying individuals age 65+", amount: 0 });
    lines.push({ line: "Total", label: "Senior deduction", amount: 0 });
    return { value: 0, lines, citations, flags };
  }

  // ── Computation ──
  const perIndividual = f.perIndividual.value;
  const gross = qualifying * perIndividual;
  lines.push({ line: "1", label: "Qualifying individuals age 65+", amount: qualifying });
  lines.push({ line: "2", label: `Gross deduction (${qualifying} × ${perIndividual})`, amount: gross });

  const thresholdFig = isJoint ? f.phaseOutThreshold.mfj : f.phaseOutThreshold.default;
  cite(thresholdFig.citation);
  cite(f.phaseOutRate.citation);
  const threshold = thresholdFig.value;
  const rate = f.phaseOutRate.value;
  lines.push({ line: "3", label: "Modified adjusted gross income", amount: magi });
  lines.push({ line: "4", label: `Phase-out threshold (${isJoint ? "joint" : "non-joint"})`, amount: threshold });

  const excess = Math.max(0, magi - threshold);
  const reduction = rate * excess;
  lines.push({ line: "5", label: "Excess of MAGI over threshold (not < 0)", amount: excess });
  lines.push({ line: "6", label: `Phase-out reduction (${rate * 100}% of line 5)`, amount: reduction });

  const value = Math.max(0, gross - reduction);
  lines.push({ line: "Total", label: "Senior deduction (line 2 - line 6, not < 0)", amount: value });

  if (reduction > 0 && value > 0) {
    flags.push({
      code: "SENIOR_PHASE_OUT",
      severity: "info",
      message: `MAGI of ${magi} exceeds the ${threshold} threshold; the senior deduction is reduced from ${gross} to ${value}.`,
      citation: thresholdFig.citation,
    });
  }
  if (value === 0) {
    flags.push({
      code: "SENIOR_FULLY_PHASED_OUT",
      severity: "info",
      message: `MAGI of ${magi} is high enough that the entire ${gross} senior deduction is phased out.`,
      citation: thresholdFig.citation,
    });
  }

  return { value, lines, citations, flags };
}

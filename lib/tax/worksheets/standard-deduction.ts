// Standard deduction worksheet (deterministic, model-free).
//
// Transcribes two IRS Form 1040 instruction artifacts:
//   1. "Standard Deduction Chart for People Born Before January 2, 1961, or Who Are
//      Blind" — the regular standard deduction for the filing status, plus an extra
//      amount per checked age-65/blind box (the single/HoH rate, or the married rate
//      for MFJ/MFS/QSS).
//   2. "Standard Deduction Worksheet for Dependents" — for a person who can be claimed
//      as a dependent on another return, the base standard deduction is the GREATER of
//      a fixed minimum (floor) or (earned income + a fixed add-on), but never more than
//      the regular standard deduction for the filing status. The age-65/blind additional
//      amounts are then added on top.
//
// Every dollar amount comes from `figures` (getFigures(...)). Nothing is hardcoded here.
// "No citation, no claim": the result always carries the citations of the figures used.

import type { FederalFigureSet } from "../figures";
import type { Citation, FilingStatus, WorksheetLine, WorksheetResult } from "../types";

export type StandardDeductionFacts = {
  filingStatus: FilingStatus;
  /** Number of "born before Jan 2 / 65 or older" boxes checked (0–2). */
  age65OrOlder?: number;
  /** Number of "blind" boxes checked (0–2). */
  blind?: number;
  /** True if this person can be claimed as a dependent on another taxpayer's return. */
  canBeClaimedAsDependent?: boolean;
  /** The dependent's earned income (wages, salaries, tips, etc.). */
  earnedIncome?: number;
};

// MFJ / MFS / QSS use the lower "married" additional-standard-deduction rate; single and
// HoH use the higher rate. (IRS Form 1040 instructions, Standard Deduction Chart.)
const MARRIED_STATUSES: ReadonlySet<FilingStatus> = new Set(["mfj", "mfs", "qss"]);

export function standardDeduction(facts: StandardDeductionFacts, figures: FederalFigureSet): WorksheetResult {
  const { filingStatus } = facts;
  const age65Boxes = Math.max(0, facts.age65OrOlder ?? 0);
  const blindBoxes = Math.max(0, facts.blind ?? 0);
  const additionalBoxes = age65Boxes + blindBoxes;

  const lines: WorksheetLine[] = [];
  const citations: Citation[] = [];
  const seen = new Set<string>();
  const cite = (c: Citation) => {
    const k = `${c.authority}|${c.cite}|${c.sourceUrl}`;
    if (!seen.has(k)) {
      seen.add(k);
      citations.push(c);
    }
  };

  // ── Regular standard deduction for the filing status ──
  const regularFig = figures.standardDeduction[filingStatus];
  const regular = regularFig.value;
  cite(regularFig.citation);

  // ── Base standard deduction: regular, OR the dependent worksheet result ──
  let base: number;
  if (facts.canBeClaimedAsDependent) {
    // Standard Deduction Worksheet for Dependents.
    const floorFig = figures.dependentStandardDeduction.floor;
    const addOnFig = figures.dependentStandardDeduction.earnedIncomeAddOn;
    cite(floorFig.citation);
    cite(addOnFig.citation);

    const earnedIncome = Math.max(0, facts.earnedIncome ?? 0);
    // Worksheet line 1: earned income + add-on.
    const line1 = earnedIncome + addOnFig.value;
    lines.push({ line: "1", label: "Earned income + add-on", amount: line1 });
    // Worksheet line 2: the minimum.
    lines.push({ line: "2", label: "Minimum dependent standard deduction", amount: floorFig.value });
    // Worksheet line 3: larger of line 1 or line 2.
    const line3 = Math.max(line1, floorFig.value);
    lines.push({ line: "3", label: "Larger of line 1 or line 2", amount: line3 });
    // Worksheet line 4: regular standard deduction for the filing status.
    lines.push({ line: "4", label: `Regular standard deduction (${filingStatus})`, amount: regular });
    // Worksheet line 5: smaller of line 3 or line 4 — the dependent's base deduction.
    base = Math.min(line3, regular);
    lines.push({ line: "5", label: "Dependent base standard deduction (smaller of line 3 or 4)", amount: base });
  } else {
    base = regular;
    lines.push({ line: "1", label: `Regular standard deduction (${filingStatus})`, amount: base });
  }

  // ── Additional standard deduction for age 65+/blind ──
  let additional = 0;
  if (additionalBoxes > 0) {
    const addFig = MARRIED_STATUSES.has(filingStatus)
      ? figures.additionalStandardDeduction.age65OrBlindMarried
      : figures.additionalStandardDeduction.age65OrBlind;
    cite(addFig.citation);
    additional = additionalBoxes * addFig.value;
    lines.push({
      line: "6",
      label: `Additional standard deduction (${additionalBoxes} box${additionalBoxes === 1 ? "" : "es"} × ${addFig.value})`,
      amount: additional,
    });
  }

  const value = base + additional;
  lines.push({ line: "Total", label: "Standard deduction", amount: value });

  return { value, lines, citations, flags: [] };
}

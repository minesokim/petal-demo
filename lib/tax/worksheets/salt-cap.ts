// SALT cap worksheet (deterministic, model-free) — OBBBA §70120 / IRC §164(b)(6),(7).
//
// Computes the "applicable limitation amount" on the state-and-local-tax itemized deduction.
// OBBBA replaced the flat $10,000 TCJA cap with a year-specific base ($40,000 for 2025,
// $40,400 for 2026) that PHASES DOWN for high earners: it is reduced by 30% of the excess of
// modified adjusted gross income (MAGI) over a threshold ($500,000 in 2025; $505,000 in 2026),
// but the reduction can NEVER push the cap below a $10,000 floor ($5,000 MFS).
//
// `value` is the applicable cap (the most SALT the taxpayer may deduct), NOT the deduction
// itself — the engine applies it against actual SALT paid elsewhere. Every dollar amount comes
// from getObbbaFigures(taxYear); nothing is hardcoded. "No citation, no claim."

import { getObbbaFigures } from "../figures/obbba-2025";
import type { Citation, FilingStatus, Flag, WorksheetLine, WorksheetResult } from "../types";

export type SaltCapFacts = {
  magi: number;
  filingStatus: FilingStatus;
  taxYear: number;
};

export function saltCap(facts: SaltCapFacts): WorksheetResult {
  const { magi, filingStatus, taxYear } = facts;
  const f = getObbbaFigures(taxYear).saltCap;

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

  cite(f.applicableLimitation.citation);
  cite(f.phaseDownThreshold.citation);

  // MFS uses half the floor ($5,000); everyone else the full $10,000.
  const floorFig = filingStatus === "mfs" ? f.floorMFS : f.floor;
  cite(floorFig.citation);

  const base = f.applicableLimitation.value;
  const threshold = f.phaseDownThreshold.value;
  const rate = f.phaseDownRate.value;
  const floor = floorFig.value;

  // Line 1: base applicable limitation amount for the year.
  lines.push({ line: "1", label: `Applicable limitation amount (${taxYear})`, amount: base });
  // Line 2: MAGI.
  lines.push({ line: "2", label: "Modified adjusted gross income", amount: magi });
  // Line 3: MAGI threshold.
  lines.push({ line: "3", label: "Phase-down threshold", amount: threshold });

  // Line 4: excess of MAGI over threshold (not below zero).
  const excess = Math.max(0, magi - threshold);
  lines.push({ line: "4", label: "Excess of MAGI over threshold (line 2 - line 3, not < 0)", amount: excess });

  // Line 5: reduction = 30% of the excess.
  const reduction = rate * excess;
  lines.push({ line: "5", label: `Reduction (${rate * 100}% of line 4)`, amount: reduction });

  // Line 6: base less reduction, but never below the floor.
  const beforeFloor = base - reduction;
  const value = Math.max(floor, beforeFloor);
  lines.push({ line: "6", label: "Base less reduction (line 1 - line 5)", amount: beforeFloor });
  lines.push({ line: "7", label: `Applicable SALT cap (greater of line 6 or floor ${floor})`, amount: value });

  // ── Flags ──
  if (excess > 0 && value > floor) {
    flags.push({
      code: "SALT_PHASE_DOWN",
      severity: "info",
      message: `MAGI of ${magi} exceeds the ${threshold} threshold; the SALT cap is reduced from ${base} to ${value} (30% of the ${excess} excess).`,
      citation: f.phaseDownThreshold.citation,
    });
  }
  if (beforeFloor <= floor && excess > 0) {
    flags.push({
      code: "SALT_FLOOR",
      severity: "info",
      message: `The 30% phase-down would reduce the cap below the ${floor} floor; the cap is held at the ${floor} floor.`,
      citation: floorFig.citation,
    });
  }

  return { value, lines, citations, flags };
}

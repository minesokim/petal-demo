// Internal tie-outs + prior-year delta anomaly detection (deterministic, model-free).
//
// These are NOT MeF business rules; they are the internal consistency checks a careful
// preparer runs before a return is built into MeF XML: (1) a non-refundable credit can
// never exceed the tax it offsets (IRC §26(a) limits the aggregate of the nonrefundable
// personal credits to the taxpayer's tax liability), and (2) a 1040 summary line must
// equal the sum of the schedule subtotals it aggregates (an arithmetic tie-out — if they
// disagree, a number was transcribed wrong). A third check flags an anomalous
// year-over-year swing for human review (never a hard reject — large legitimate swings
// happen; the preparer decides).
//
// Model-free by construction: nothing here imports from lib/ai/*. Every reject-style flag
// carries a citation ("no citation, no claim"); the review-only anomaly flag carries the
// §6695(g) due-diligence citation because chasing anomalies IS the due-diligence duty.

import type { Citation, Flag } from "../types";
import type { ReturnComputation, ValidationFacts } from "./mef";

// IRC §26(a) — limitation based on tax liability (the aggregate nonrefundable personal
// credits may not exceed the taxpayer's regular-tax + AMT liability).
const SEC_26A: Citation = {
  authority: "IRC",
  cite: "IRC §26(a) — nonrefundable personal credits limited to tax liability",
  sourceUrl:
    "https://www.govinfo.gov/app/details/USCODE-2024-title26/USCODE-2024-title26-subtitleA-chap1-subchapA-partIV-subpartA-sec26",
};

// The arithmetic tie-out has no single statute; it is the Form 1040 instruction that the
// total line equals the sum of its components. Cite the 1040 instructions.
const F1040_TOTALS: Citation = {
  authority: "IRS Form 1040 Inst.",
  cite: "Form 1040 — total credits line equals the sum of the schedule subtotals it aggregates",
  sourceUrl: "https://www.irs.gov/instructions/i1040gi",
};

// §6695(g) — the paid-preparer due-diligence duty. An unexplained year-over-year swing in
// a due-diligence credit is exactly what the preparer must investigate, so the review flag
// rests on the penalty statute that makes the investigation mandatory.
const SEC_6695G: Citation = {
  authority: "IRC",
  cite: "IRC §6695(g) — paid-preparer due-diligence (investigate anomalous year-over-year swings)",
  sourceUrl:
    "https://www.govinfo.gov/app/details/USCODE-2024-title26/USCODE-2024-title26-subtitleA-chap1-subchapA-partIV-subpartA-sec6695",
};

// A year-over-year change at or above this fraction of the larger value is "anomalous"
// enough to surface for review. Not a tax figure — a review heuristic — so it lives here
// as a named constant, not in the figures store.
const PRIOR_YEAR_ANOMALY_FRACTION = 0.5;

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Sum of every non-refundable credit on the computation. */
function totalNonRefundable(c: ReturnComputation): number {
  const nr = c.nonRefundableCredits ?? {};
  return Object.values(nr).reduce((sum, v) => sum + (v ?? 0), 0);
}

/**
 * Tie-out checks + the prior-year anomaly review flag.
 * Returns reject flags for arithmetic/limit violations and a review flag for swings.
 */
export function tieOutFlags(computation: ReturnComputation, facts: ValidationFacts): Flag[] {
  const flags: Flag[] = [];

  // ── Tie-out 1: non-refundable credits ≤ tax before credits (IRC §26(a)). ──
  const nonRefundable = round2(totalNonRefundable(computation));
  const tax = round2(computation.taxBeforeCredits ?? 0);
  if (nonRefundable > tax) {
    flags.push({
      code: "NONREFUNDABLE_EXCEEDS_TAX",
      severity: "reject",
      message: `Total nonrefundable credits (${nonRefundable}) exceed tax before credits (${tax}); nonrefundable personal credits cannot exceed tax liability (IRC §26(a)). A credit was not properly limited.`,
      citation: SEC_26A,
    });
  }

  // ── Tie-out 2: the 1040 total-credits line equals the sum of its schedule subtotals. ──
  if (computation.totals) {
    const computed = round2(computation.totals.totalCredits);
    const reported = round2(computation.totals.reportedTotalCredits);
    if (computed !== reported) {
      flags.push({
        code: "TOTAL_CREDITS_MISMATCH",
        severity: "reject",
        message: `Form 1040 total credits (${reported}) does not tie to the sum of the schedule subtotals (${computed}). The summary line and its components disagree — a transcription error.`,
        citation: F1040_TOTALS,
      });
    }
  }

  // ── Prior-year delta anomaly (review-only; never a hard reject). ──
  flags.push(...priorYearDeltaFlags(computation, facts));

  return flags;
}

/**
 * Flag an anomalous year-over-year swing in any tracked field for human review.
 * Compares `computation.priorYearDeltaInputs[field]` (this year) against
 * `facts.priorYear[field]` (last year); a swing ≥ PRIOR_YEAR_ANOMALY_FRACTION of the
 * larger magnitude is surfaced. No prior-year data → no flag (nothing to compare).
 */
export function priorYearDeltaFlags(computation: ReturnComputation, facts: ValidationFacts): Flag[] {
  const prior = facts.priorYear;
  const current = computation.priorYearDeltaInputs;
  if (!prior || !current) return [];

  const flags: Flag[] = [];
  const fields = new Set<string>([...Object.keys(prior), ...Object.keys(current)]);

  for (const field of fields) {
    const last = prior[field];
    const now = current[field];
    if (last === undefined || now === undefined) continue;

    const denom = Math.max(Math.abs(last), Math.abs(now));
    if (denom === 0) continue; // both zero — no swing

    const swing = Math.abs(now - last) / denom;
    if (swing >= PRIOR_YEAR_ANOMALY_FRACTION) {
      flags.push({
        code: "PRIOR_YEAR_DELTA_ANOMALY",
        severity: "review",
        message: `"${field}" changed from ${round2(last)} (prior year) to ${round2(now)} (this year) — a ${Math.round(swing * 100)}% swing. Verify the change is supported before filing (IRC §6695(g) due diligence).`,
        citation: SEC_6695G,
      });
    }
  }

  return flags;
}

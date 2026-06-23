// QBI deduction — IRC §199A, transcribed from Form 8995 (simplified) and
// Form 8995-A (with the W-2 wage / UBIA limitation and the SSTB phase-out).
//
// Model-free by construction: this imports nothing from lib/ai/*. Every dollar
// threshold and rate comes from the figures argument (getFigures(...)) — no tax
// figure is hardcoded here ("no citation, no claim").
//
// Sources transcribed:
//   • IRC §199A(a),(b),(d),(e) — 20% deduction, W-2/UBIA limit, SSTB rule, thresholds.
//   • Form 8995 (Qualified Business Income Deduction Simplified Computation) — the
//     below-threshold path: line 5 (20% × QBI), line 11 (20% × (TI − net cap gain)),
//     deduction = lesser of the two.
//   • Form 8995-A (incl. Schedule A) — the above-threshold path: the W-2/UBIA limit
//     (greater of 50% W-2 wages, or 25% W-2 wages + 2.5% UBIA), the within-range
//     reduction for non-SSTB businesses, and the SSTB applicable-percentage haircut.

import type { FilingStatus, WorksheetLine, WorksheetResult } from "../types";
import type { FederalFigureSet } from "../figures/federal-2025";

export type QbiFacts = {
  qbi: number; // qualified business income (net) for the trade or business
  taxableIncomeBeforeQBI: number; // taxable income figured WITHOUT the QBI deduction
  filingStatus: FilingStatus;
  isSSTB: boolean; // specified service trade or business (§199A(d)(2))
  w2Wages?: number; // W-2 wages of the business (Form 8995-A line)
  ubia?: number; // unadjusted basis immediately after acquisition of qualified property
  netCapitalGain?: number; // net capital gain incl. qualified dividends (reduces the overall limit)
};

// §199A uses two threshold buckets: "joint" (MFJ + QSS) and "non-joint" (everyone else).
// The non-joint phase-in band is figures.qbi.phaseInRange; the joint band is 2× that
// (per IRC §199A(e)(2) / the figure's own citation: "$50,000 phase-in band (×2 for MFJ)").
function isJoint(status: FilingStatus): boolean {
  return status === "mfj" || status === "qss";
}

const round = (n: number) => Math.round(n);

export function qbi(facts: QbiFacts, figures: FederalFigureSet): WorksheetResult {
  const qf = figures.qbi;
  const rate = qf.rate.value; // 20%
  const threshold = isJoint(facts.filingStatus)
    ? qf.threshold.mfj.value
    : qf.threshold.single.value;
  const band = isJoint(facts.filingStatus)
    ? qf.phaseInRange.value * 2
    : qf.phaseInRange.value;

  const qbiAmount = Math.max(0, facts.qbi); // a net QBI loss carries forward; it is not a current deduction
  const ti = facts.taxableIncomeBeforeQBI;
  const netCapGain = Math.max(0, facts.netCapitalGain ?? 0);
  const w2 = Math.max(0, facts.w2Wages ?? 0);
  const ubia = Math.max(0, facts.ubia ?? 0);

  // Citations: every result rests on §199A + the controlling form figure(s).
  const citations = [
    qf.rate.citation,
    isJoint(facts.filingStatus) ? qf.threshold.mfj.citation : qf.threshold.single.citation,
    qf.phaseInRange.citation,
  ];
  const flags: WorksheetResult["flags"] = [];
  const lines: WorksheetLine[] = [];

  // Overall limitation (applies on every path): 20% × (taxable income − net capital gain).
  const incomeLimit = Math.max(0, rate * (ti - netCapGain));

  // ── Path A: taxable income at or below the threshold → Form 8995 (simplified). ──
  if (ti <= threshold) {
    const qbiComponent = rate * qbiAmount; // Form 8995 line 5
    const value = Math.max(0, round(Math.min(qbiComponent, incomeLimit)));
    lines.push(
      { line: "8995-1", label: "Qualified business income", amount: round(qbiAmount) },
      { line: "8995-5", label: "QBI component (20% × QBI)", amount: round(qbiComponent) },
      { line: "8995-11", label: "20% × (taxable income − net capital gain)", amount: round(incomeLimit) },
      { line: "8995-15", label: "Qualified business income deduction", amount: value },
    );
    return { value, lines, citations, flags };
  }

  // ── Above the threshold → Form 8995-A (W-2/UBIA limit + SSTB rule). ──
  // Reduction ratio = how far into the phase-in band the taxable income sits (0→1).
  const ratio = Math.min(1, Math.max(0, (ti - threshold) / band));
  const aboveRange = ti >= threshold + band;

  // SSTB applicable percentage (§199A(d)(3)): 100% at the bottom of the band, 0% at/above
  // the top. The QBI, W-2 wages, and UBIA that count are reduced to this percentage.
  const sstbApplicablePct = facts.isSSTB ? Math.max(0, 1 - ratio) : 1;

  if (facts.isSSTB && aboveRange) {
    // SSTB fully above the range: no QBI deduction at all (§199A(d)(1)).
    flags.push({
      code: "QBI_SSTB_DISALLOWED",
      severity: "info",
      message:
        "Specified service trade or business (SSTB) with taxable income above the §199A phase-out range — no QBI deduction is allowed.",
      citation: qf.threshold[isJoint(facts.filingStatus) ? "mfj" : "single"].citation,
    });
    lines.push(
      { line: "8995A-SSTB", label: "SSTB above phase-out range — disallowed", amount: 0 },
      { line: "8995A-deduction", label: "Qualified business income deduction", amount: 0 },
    );
    return { value: 0, lines, citations, flags };
  }

  // Apply the SSTB applicable percentage to QBI / W-2 wages / UBIA (no-op for non-SSTB).
  const effQbi = qbiAmount * sstbApplicablePct;
  const effW2 = w2 * sstbApplicablePct;
  const effUbia = ubia * sstbApplicablePct;

  const tentative = rate * effQbi; // 20% × QBI (after any SSTB haircut)

  // W-2/UBIA limit: greater of 50% of W-2 wages, or 25% of W-2 wages + 2.5% of UBIA.
  const wageLimit = Math.max(0.5 * effW2, 0.25 * effW2 + 0.025 * effUbia);

  let qbiComponent: number;
  if (aboveRange) {
    // Fully above the range: the wage/UBIA limit applies in full.
    qbiComponent = Math.min(tentative, wageLimit);
  } else if (tentative <= wageLimit) {
    // Within the range but the wage limit doesn't bind → no reduction.
    qbiComponent = tentative;
  } else {
    // Within the range and the wage limit binds → phase in the reduction (8995-A Part III).
    // Reduction = (tentative − wageLimit) × ratio; the deduction loses only that fraction.
    const reduction = (tentative - wageLimit) * ratio;
    qbiComponent = tentative - reduction;
  }

  qbiComponent = Math.max(0, qbiComponent);
  const value = Math.max(0, round(Math.min(qbiComponent, incomeLimit)));

  if (facts.isSSTB && !aboveRange) {
    flags.push({
      code: "QBI_SSTB_PHASE_IN",
      severity: "info",
      message:
        "Specified service trade or business (SSTB) within the §199A phase-out range — QBI, W-2 wages, and UBIA reduced to the applicable percentage before applying the deduction.",
      citation: qf.threshold[isJoint(facts.filingStatus) ? "mfj" : "single"].citation,
    });
  }

  lines.push(
    { line: "8995A-QBI", label: "Qualified business income (after SSTB %)", amount: round(effQbi) },
    { line: "8995A-tentative", label: "Tentative QBI component (20% × QBI)", amount: round(tentative) },
    { line: "8995A-wagelimit", label: "W-2/UBIA limit (greater of 50% W-2, or 25% W-2 + 2.5% UBIA)", amount: round(wageLimit) },
    { line: "8995A-component", label: "QBI component after limitation", amount: round(qbiComponent) },
    { line: "8995A-incomelimit", label: "20% × (taxable income − net capital gain)", amount: round(incomeLimit) },
    { line: "8995A-deduction", label: "Qualified business income deduction", amount: value },
  );

  return { value, lines, citations, flags };
}

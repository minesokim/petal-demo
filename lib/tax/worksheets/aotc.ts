// AOTC — American Opportunity Tax Credit (§25A(i)), transcribed from Form 8863.
//
// Model-free, pure function. Every dollar amount comes from `figures` (getFigures);
// no tax figure is hardcoded here. Returns a cited WorksheetResult ("no citation,
// no claim"). The auditable `lines` mirror Form 8863's Part I + per-student Part III.
//
// Per-student tentative credit (Form 8863 Part III, lines 27-30):
//   line 27  qualified expenses, capped at firstTierCap + secondTier band ($4,000)
//   line 28  expenses over firstTierCap (max one more firstTierCap band, i.e. "next $2,000")
//   line 29  secondTierRate × line 28        (25% of the next $2,000)
//   line 30  100% of first firstTierCap      (the first $2,000)
//   → tentative = min(line 30 + line 29, maxCredit)  [$2,500 ceiling per student]
//
// Eligibility gates (Form 8863 Part III, lines 23-26): a student who has CLAIMED the
// AOTC for 4 prior tax years (line 23) is NOT eligible; the student must have been at
// least half-time for one academic period (line 24); a felony drug conviction (line 26)
// disqualifies. Disqualified students are excluded from the credit and flagged.
//
// Part I phaseout (lines 2-7): if MAGI ≥ phaseout end → credit is $0; within the band the
// tentative credit is multiplied by (end − MAGI)/(end − start). Then 40% (refundablePct)
// is refundable (line 8) and the remainder is nonrefundable (line 9).

import type { FederalFigureSet } from "../figures/federal-2025";
import type { Citation, FilingStatus, Flag, WorksheetLine, WorksheetResult } from "../types";

export type AotcStudent = {
  qualifiedExpenses: number;
  yearsAOTCClaimed: number;
  halfTimeOneAcademicPeriod: boolean;
  felonyDrugConviction: boolean;
};

export type AotcFacts = {
  students: AotcStudent[];
  magi: number;
  filingStatus: FilingStatus;
};

// AOTC phaseout uses two bands: MFJ vs. everyone else (Form 8863 line 5/3). MFS may not
// claim education credits, but the figures only define single/mfj bands, so any non-MFJ
// status (single/hoh/qss/mfs) maps to the "single" band here.
function phaseoutBand(figures: FederalFigureSet, filingStatus: FilingStatus) {
  return filingStatus === "mfj" ? figures.aotc.phaseoutMagi.mfj : figures.aotc.phaseoutMagi.single;
}

export function aotc(facts: AotcFacts, figures: FederalFigureSet): WorksheetResult {
  const { firstTierCap, secondTierRate, maxCredit, refundablePct } = figures.aotc;
  const lines: WorksheetLine[] = [];
  const flags: Flag[] = [];

  // Citations — every claimed number rests on Form 8863 / §25A. Always non-empty.
  const citations: Citation[] = [
    firstTierCap.citation,
    secondTierRate.citation,
    maxCredit.citation,
    refundablePct.citation,
  ];

  // ── Part III: per-student tentative AOTC, applying the eligibility gates ──
  let lineNo = 27;
  let summed = 0;
  facts.students.forEach((s, i) => {
    const label = `Student ${i + 1}`;

    // Gate: 4+ prior AOTC years claimed → not eligible (Form 8863 line 23). Exclude + reject.
    if (s.yearsAOTCClaimed >= 4) {
      flags.push({
        code: "AOTC_YEARS_EXCEEDED",
        severity: "reject",
        message: `${label}: AOTC already claimed for ${s.yearsAOTCClaimed} prior years; the American Opportunity Credit is allowed for at most 4 tax years per student (Form 8863, Part III, line 23). Student excluded.`,
        citation: maxCredit.citation,
      });
      lines.push({ line: String(lineNo++), label: `${label} — excluded (4-year limit, Form 8863 line 23)`, amount: 0 });
      return;
    }

    // Gate: must be at least half-time for one academic period (Form 8863 line 24). Exclude.
    if (!s.halfTimeOneAcademicPeriod) {
      flags.push({
        code: "AOTC_NOT_HALF_TIME",
        severity: "review",
        message: `${label}: not enrolled at least half-time for at least one academic period (Form 8863, Part III, line 24); AOTC not allowed (Lifetime Learning Credit may apply). Student excluded.`,
        citation: maxCredit.citation,
      });
      lines.push({ line: String(lineNo++), label: `${label} — excluded (not at least half-time, Form 8863 line 24)`, amount: 0 });
      return;
    }

    // Gate: felony drug conviction (Form 8863 line 26) disqualifies the AOTC. Exclude + reject.
    if (s.felonyDrugConviction) {
      flags.push({
        code: "AOTC_FELONY_DRUG_CONVICTION",
        severity: "reject",
        message: `${label}: had a federal or state felony drug conviction by the end of the tax year (Form 8863, Part III, line 26); AOTC not allowed. Student excluded.`,
        citation: maxCredit.citation,
      });
      lines.push({ line: String(lineNo++), label: `${label} — excluded (felony drug conviction, Form 8863 line 26)`, amount: 0 });
      return;
    }

    // Tentative credit: 100% of first firstTierCap + secondTierRate of the next firstTierCap band.
    const expenses = Math.max(s.qualifiedExpenses, 0);
    const firstTier = Math.min(expenses, firstTierCap.value); // line 30: 100% of first $2,000
    const secondTierBase = Math.min(Math.max(expenses - firstTierCap.value, 0), firstTierCap.value); // line 28: next $2,000
    const secondTier = secondTierBase * secondTierRate.value; // line 29: 25% of that
    const tentative = Math.min(firstTier + secondTier, maxCredit.value); // line 31 cap at $2,500

    summed += tentative;
    lines.push({ line: String(lineNo++), label: `${label} — tentative AOTC (Form 8863 lines 27-31)`, amount: tentative });
  });

  // ── Part I: aggregate + MAGI phaseout (Form 8863 lines 1-7) ──
  lines.push({ line: "1", label: "Total tentative AOTC, all students (Form 8863 line 1)", amount: round(summed) });

  const band = phaseoutBand(figures, facts.filingStatus);
  const start = band.start.value;
  const end = band.end.value;
  citations.push(band.start.citation, band.end.citation);

  let credit: number;
  if (summed <= 0) {
    credit = 0;
  } else if (facts.magi >= end) {
    // Line 7: MAGI at/above the ceiling → no credit.
    credit = 0;
    lines.push({ line: "7", label: `MAGI ${facts.magi} ≥ phaseout ceiling ${end} → AOTC phased out (Form 8863 line 7)`, amount: 0 });
  } else if (facts.magi > start) {
    // Lines 4-6: ratio = (end − MAGI) / (end − start), then line 7 = line 1 × ratio.
    const ratio = (end - facts.magi) / (end - start);
    credit = round(summed * ratio);
    lines.push({ line: "6", label: "Phaseout ratio (Form 8863 line 6)", amount: ratio });
    lines.push({ line: "7", label: "AOTC after MAGI phaseout (Form 8863 line 7)", amount: credit });
  } else {
    // Below the phaseout floor → full tentative credit.
    credit = round(summed);
    lines.push({ line: "7", label: "AOTC after MAGI phaseout (full, Form 8863 line 7)", amount: credit });
  }

  // ── Lines 8-9: split refundable / nonrefundable ──
  const refundable = round(credit * refundablePct.value); // line 8: 40% refundable
  const nonrefundable = credit - refundable; // line 9: remainder, nonrefundable (to Sch. 3)
  lines.push({ line: "8", label: `Refundable AOTC (${pct(refundablePct.value)} of line 7, Form 8863 line 8)`, amount: refundable });
  lines.push({ line: "9", label: "Nonrefundable AOTC (line 7 − line 8, Form 8863 line 9)", amount: nonrefundable });

  return { value: credit, lines, citations, flags };
}

// AOTC is computed and reported in whole dollars on Form 8863.
function round(n: number): number {
  return Math.round(n);
}

function pct(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

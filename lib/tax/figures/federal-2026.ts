// Federal structured figures for TY2026, as typed Figure<T> records carrying their authority cite.
// Values were confirmed against PRIMARY authority — Rev. Proc. 2025-32 (the IRS TY2026 inflation
// adjustments, read verbatim from the official PDF) and the OBBBA enrolled text (P.L. 119-21) — NOT
// recalled by a model. `verified:true` = the value was read off the cited primary source. Two items
// are `verified:false` pending a confirming source (the §24(d) 15% ACTC rate, not on the fetched IRS
// pages; and the §6695(g) penalty, whose filing-year semantics for a TY2026 return need the TY2027
// Rev. Proc.) — they are intentionally excluded from golden scenarios until confirmed.
//
// CORRECTION captured here: OBBBA expanded the §199A QBI phase-in band to $75,000 / $150,000 for tax
// years beginning after 2025 (NOT the pre-OBBBA $50,000 / $100,000). Confirmed from Rev. Proc.
// 2025-32 §4.26 + the amended §199A text — a figure that a naive 2025→2026 tag-extension would get wrong.

import type { Citation, Figure, FilingStatus, Jurisdiction } from "../types";
import type { FederalFigureSet, EitcParams } from "./federal-2025";

const YEAR = 2026;
const J: Jurisdiction = "federal";

const RP2532_URL = "https://www.irs.gov/pub/irs-drop/rp-25-32.pdf";
const USCODE26 = "https://www.govinfo.gov/app/details/USCODE-2024-title26";
const RP2532 = (cite: string): Citation => ({ authority: "Rev. Proc. 2025-32", cite, sourceUrl: RP2532_URL });
const IRC = (cite: string, url = USCODE26): Citation => ({ authority: "IRC", cite, sourceUrl: url });
const OBBB = (cite: string): Citation => ({ authority: "OBBBA / IRS", cite, sourceUrl: "https://www.irs.gov/newsroom/one-big-beautiful-bill-provisions-individuals-and-workers" });
const F8863 = (cite: string): Citation => ({ authority: "Form 8863 Inst.", cite, sourceUrl: "https://www.irs.gov/instructions/i8863" });

function f<T>(value: T, citation: Citation, verified = true): Figure<T> {
  return { value, taxYear: YEAR, jurisdiction: J, citation, verified };
}

// EITC: statutory phase-in/phase-out rates (IRC §32(b)) are fixed; the dollar amounts below are the
// TY2026 inflation figures from Rev. Proc. 2025-32 §3.06(1).
const EITC_RATES: Record<0 | 1 | 2 | 3, { rate: number; phaseoutRate: number }> = {
  0: { rate: 0.0765, phaseoutRate: 0.0765 },
  1: { rate: 0.34, phaseoutRate: 0.1598 },
  2: { rate: 0.40, phaseoutRate: 0.2106 },
  3: { rate: 0.45, phaseoutRate: 0.2106 },
};
const eitcCite = (n: string): Citation => ({ authority: "IRC §32 / Rev. Proc. 2025-32", cite: n, sourceUrl: RP2532_URL });
function eitc(children: 0 | 1 | 2 | 3, earnedIncomeAmount: number, maxCredit: number, phaseoutThreshold: number, phaseoutThresholdMFJ: number): EitcParams {
  const r = EITC_RATES[children];
  return {
    rate: r.rate,
    phaseoutRate: r.phaseoutRate,
    earnedIncomeAmount: f(earnedIncomeAmount, eitcCite(`Rev. Proc. 2025-32 §3.06(1) — EITC earned-income amount, ${children} child(ren)`)),
    maxCredit: f(maxCredit, eitcCite(`Rev. Proc. 2025-32 §3.06(1) — EITC max credit, ${children} child(ren)`)),
    phaseoutThreshold: f(phaseoutThreshold, eitcCite(`Rev. Proc. 2025-32 §3.06(1) — EITC phaseout begins (single/HoH), ${children} child(ren)`)),
    phaseoutThresholdMFJ: f(phaseoutThresholdMFJ, eitcCite(`Rev. Proc. 2025-32 §3.06(1) — EITC phaseout begins (MFJ), ${children} child(ren)`)),
  };
}

export const FEDERAL_2026: FederalFigureSet = {
  taxYear: YEAR,
  jurisdiction: J,
  // Rev. Proc. 2025-32 §3.14(1). QSS shares the MFJ/surviving-spouse line (§1(j)(2)(A)).
  standardDeduction: {
    single: f(16100, RP2532("Rev. Proc. 2025-32 §3.14(1) — TY2026 std deduction, single")),
    mfj: f(32200, RP2532("Rev. Proc. 2025-32 §3.14(1) — TY2026 std deduction, MFJ")),
    mfs: f(16100, RP2532("Rev. Proc. 2025-32 §3.14(1) — TY2026 std deduction, MFS")),
    hoh: f(24150, RP2532("Rev. Proc. 2025-32 §3.14(1) — TY2026 std deduction, HoH")),
    qss: f(32200, RP2532("Rev. Proc. 2025-32 §3.14(1) — TY2026 std deduction, QSS")),
  },
  // Rev. Proc. 2025-32 §3.14(3): per box (age 65+, blind). $2,050 unmarried (single/HoH); $1,650 married/QSS.
  additionalStandardDeduction: {
    age65OrBlind: f(2050, RP2532("Rev. Proc. 2025-32 §3.14(3) — §63(f) additional std deduction (single/HoH), 2026")),
    age65OrBlindMarried: f(1650, RP2532("Rev. Proc. 2025-32 §3.14(3) — §63(f) additional std deduction (mfj/mfs/qss), 2026")),
  },
  // Rev. Proc. 2025-32 §3.14(2): greater of $1,350 floor or (earned income + $450).
  dependentStandardDeduction: {
    floor: f(1350, RP2532("Rev. Proc. 2025-32 §3.14(2) — dependent std deduction minimum, 2026")),
    earnedIncomeAddOn: f(450, RP2532("Rev. Proc. 2025-32 §3.14(2) — dependent std deduction earned-income add-on, 2026")),
  },
  ctc: {
    // OBBBA set CTC $2,200 / ACTC $1,700 for 2025 and indexes after; the 2026 indexed values round
    // (nearest $100) back to the same $2,200 / $1,700 — confirmed in Rev. Proc. 2025-32 §3.05.
    perChild: f(2200, RP2532("Rev. Proc. 2025-32 §3.05(1) (IRC §24(a), OBBBA §70104) — CTC $2,200 per qualifying child, 2026")),
    odcPerDependent: f(500, IRC("IRC §24(h)(4) — $500 credit for other dependents (OBBBA §70104, permanent)")),
    refundableCap: f(1700, RP2532("Rev. Proc. 2025-32 §3.05(2) (IRC §24(d)(1)(A)) — ACTC refundable cap $1,700/child, 2026")),
    phaseoutThreshold: {
      single: f(200000, IRC("IRC §24(b)(2) — $200,000 (non-joint), fixed")),
      mfj: f(400000, IRC("IRC §24(b)(2) — $400,000 (joint), fixed")),
    },
    phaseoutPer1000: f(50, IRC("IRC §24(b)(1) — $50 per $1,000 over threshold")),
    earnedIncomeFloor: f(2500, IRC("IRC §24(d)(1)(B)(i) — ACTC earned-income floor $2,500")),
    // NOT on the fetched IRS pages / not in Rev. Proc. 2025-32 — established §24(d) statutory rate but
    // flagged for confirmation against the 2026 Schedule 8812 instructions before golden use.
    actcRate: f(0.15, IRC("IRC §24(d)(1)(B)(i) — 15% of earned income over floor"), false),
  },
  // Rev. Proc. 2025-32 §3.06(1)/(2).
  eitc: {
    byChildren: {
      0: eitc(0, 8680, 664, 10860, 18140),
      1: eitc(1, 13020, 4427, 23890, 31160),
      2: eitc(2, 18290, 7316, 23890, 31160),
      3: eitc(3, 18290, 8231, 23890, 31160),
    },
    investmentIncomeLimit: f(12200, RP2532("Rev. Proc. 2025-32 §3.06(2) (IRC §32(i)) — EITC investment-income limit, 2026")),
  },
  // AOTC (§25A) is NOT inflation-indexed — fixed amounts, unchanged for 2026.
  aotc: {
    maxCredit: f(2500, F8863("AOTC max $2,500 per student (§25A, not indexed)")),
    refundablePct: f(0.40, F8863("AOTC 40% refundable (up to $1,000)")),
    firstTierCap: f(2000, F8863("AOTC 100% of first $2,000 of qualified expenses")),
    secondTierRate: f(0.25, F8863("AOTC 25% of next $2,000")),
    phaseoutMagi: {
      single: { start: f(80000, F8863("AOTC MAGI phaseout start, single $80,000")), end: f(90000, F8863("AOTC MAGI phaseout end, single $90,000")) },
      mfj: { start: f(160000, F8863("AOTC MAGI phaseout start, MFJ $160,000")), end: f(180000, F8863("AOTC MAGI phaseout end, MFJ $180,000")) },
    },
  },
  qbi: {
    rate: f(0.20, IRC("IRC §199A(a) — 20%")),
    threshold: {
      single: f(201750, RP2532("Rev. Proc. 2025-32 §4.26 (§199A(e)(2)) — taxable-income threshold 2026, non-joint $201,750")),
      mfj: f(403500, RP2532("Rev. Proc. 2025-32 §4.26 (§199A(e)(2)) — taxable-income threshold 2026, MFJ $403,500")),
    },
    // OBBBA EXPANDED the phase-in band to $75,000 (×2 = $150,000 MFJ) for years after 2025 —
    // NOT the pre-OBBBA $50,000. Confirmed: Rev. Proc. 2025-32 §4.26 + amended §199A (P.L. 119-21).
    phaseInRange: f(75000, RP2532("Rev. Proc. 2025-32 §4.26 / IRC §199A (OBBBA P.L. 119-21) — $75,000 phase-in band (×2 MFJ), 2026")),
  },
  // §6695(g): the existing 2025 file carries $650 for "returns filed 2026"; a TY2026 return is filed
  // in 2027, so the correct filing-year figure is the (not-yet-published) TY2027 Rev. Proc. Carried as
  // $650 verified:false pending that source, so the param hedges rather than asserting a wrong year.
  dueDiligencePenaltyPerFailure: f(650, RP2532("§6695(g) due-diligence penalty — confirm TY2027 filing-year amount"), false),
};

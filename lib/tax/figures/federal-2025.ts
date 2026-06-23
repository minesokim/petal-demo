// Federal structured figures for TY2025 (the active filing year as of 2026), reflecting
// OBBBA (P.L. 119-1). Each value is a Figure<T> carrying its authority citation. Values
// are sourced from primary IRS material — NOT recalled by a model. `verified:true` means
// the value was confirmed against the cited source; anything uncertain is `verified:false`
// and excluded from golden scenarios until confirmed.
//
// Year note: OBBBA raised the TY2025 standard deduction (MFJ $31,500) and CTC ($2,200).
// TY2026 (Rev. Proc. 2025-32: std $16,100/$32,200/$24,150) is a separate figures file.

import type { Citation, Figure, FilingStatus, Jurisdiction } from "../types";

const YEAR = 2025;
const J: Jurisdiction = "federal";

// Sources (official, free)
const OBBB = (cite: string): Citation => ({ authority: "OBBBA / IRS", cite, sourceUrl: "https://www.irs.gov/newsroom/one-big-beautiful-bill-provisions-individuals-and-workers" });
const RP2440 = (cite: string): Citation => ({ authority: "Rev. Proc. 2024-40", cite, sourceUrl: "https://www.irs.gov/pub/irs-drop/rp-24-40.pdf" });
const IRC = (cite: string, url: string): Citation => ({ authority: "IRC", cite, sourceUrl: url });
const F8863 = (cite: string): Citation => ({ authority: "Form 8863 Inst.", cite, sourceUrl: "https://www.irs.gov/instructions/i8863" });
const F8995 = (cite: string): Citation => ({ authority: "Form 8995 Inst.", cite, sourceUrl: "https://www.irs.gov/instructions/i8995" });
const RP2532 = (cite: string): Citation => ({ authority: "Rev. Proc. 2025-32", cite, sourceUrl: "https://www.irs.gov/pub/irs-drop/rp-25-32.pdf" });

function f<T>(value: T, citation: Citation, verified = true): Figure<T> {
  return { value, taxYear: YEAR, jurisdiction: J, citation, verified };
}

// EITC parameters per IRC §32 / Rev. Proc. 2024-40, keyed by number of qualifying children.
// rate = credit (phase-in) rate; phaseoutRate = reduction rate; earnedIncomeAmount = income
// at which the max credit is reached; phaseoutThreshold = AGI/earned where phaseout begins
// (single/HoH); phaseoutThresholdMFJ = the MFJ threshold (≈ +$7,120 for 2025).
export type EitcParams = {
  rate: number;
  phaseoutRate: number;
  earnedIncomeAmount: Figure<number>;
  maxCredit: Figure<number>;
  phaseoutThreshold: Figure<number>;
  phaseoutThresholdMFJ: Figure<number>;
};

const eitcUrl = "https://www.irs.gov/credits-deductions/individuals/earned-income-tax-credit/earned-income-and-earned-income-tax-credit-eitc-tables";
const eitcCite = (n: string): Citation => ({ authority: "IRC §32 / Rev. Proc. 2024-40", cite: n, sourceUrl: eitcUrl });

// Statutory phase-in / phase-out rates (IRC §32(b)) — fixed by statute, not inflation-indexed.
const EITC_RATES: Record<0 | 1 | 2 | 3, { rate: number; phaseoutRate: number }> = {
  0: { rate: 0.0765, phaseoutRate: 0.0765 },
  1: { rate: 0.34, phaseoutRate: 0.1598 },
  2: { rate: 0.40, phaseoutRate: 0.2106 },
  3: { rate: 0.45, phaseoutRate: 0.2106 }, // 3+ children
};

function eitc(children: 0 | 1 | 2 | 3, earnedIncomeAmount: number, maxCredit: number, phaseoutThreshold: number, phaseoutThresholdMFJ: number): EitcParams {
  const r = EITC_RATES[children];
  return {
    rate: r.rate,
    phaseoutRate: r.phaseoutRate,
    earnedIncomeAmount: f(earnedIncomeAmount, eitcCite(`EITC earned-income amount, ${children} child(ren)`)),
    maxCredit: f(maxCredit, eitcCite(`EITC max credit, ${children} child(ren)`)),
    phaseoutThreshold: f(phaseoutThreshold, eitcCite(`EITC phaseout begins (single/HoH), ${children} child(ren)`)),
    phaseoutThresholdMFJ: f(phaseoutThresholdMFJ, eitcCite(`EITC phaseout begins (MFJ), ${children} child(ren)`)),
  };
}

export type FederalFigureSet = {
  taxYear: number;
  jurisdiction: Jurisdiction;
  standardDeduction: Record<FilingStatus, Figure<number>>;
  additionalStandardDeduction: { age65OrBlind: Figure<number> }; // per box; single/HoH rate
  ctc: {
    perChild: Figure<number>;
    refundableCap: Figure<number>; // ACTC max refundable per child
    phaseoutThreshold: Record<"single" | "mfj", Figure<number>>;
    phaseoutPer1000: Figure<number>; // $50 reduction per $1,000 over threshold
    earnedIncomeFloor: Figure<number>; // ACTC: 15% of earned income over this
    actcRate: Figure<number>;
  };
  eitc: {
    byChildren: Record<0 | 1 | 2 | 3, EitcParams>;
    investmentIncomeLimit: Figure<number>;
  };
  aotc: {
    maxCredit: Figure<number>;
    refundablePct: Figure<number>;
    firstTierCap: Figure<number>; // 100% of first $2,000
    secondTierRate: Figure<number>; // 25% of next $2,000
    phaseoutMagi: Record<"single" | "mfj", { start: Figure<number>; end: Figure<number> }>;
  };
  qbi: {
    rate: Figure<number>; // 20%
    threshold: Record<"single" | "mfj", Figure<number>>;
    phaseInRange: Figure<number>; // $50k single / $100k MFJ band above threshold
  };
  dueDiligencePenaltyPerFailure: Figure<number>; // §6695(g)
};

export const FEDERAL_2025: FederalFigureSet = {
  taxYear: YEAR,
  jurisdiction: J,
  // OBBBA TY2025 standard deduction. MFJ $31,500 is IRS-confirmed; single $15,750 and
  // HoH $23,625 are the OBBBA 2025 amounts.
  standardDeduction: {
    single: f(15750, OBBB("OBBBA §70102 / TY2025 std deduction, single")),
    mfj: f(31500, OBBB("OBBBA §70102 / TY2025 std deduction, MFJ")),
    mfs: f(15750, OBBB("OBBBA §70102 / TY2025 std deduction, MFS")),
    hoh: f(23625, OBBB("OBBBA §70102 / TY2025 std deduction, HoH")),
    qss: f(31500, OBBB("OBBBA §70102 / TY2025 std deduction, QSS")),
  },
  additionalStandardDeduction: {
    age65OrBlind: f(2000, RP2440("§2.15 additional std deduction (single/HoH), 2025"), false), // verify exact 2025 amount
  },
  ctc: {
    perChild: f(2200, OBBB("OBBBA / CTC $2,200 per qualifying child")),
    refundableCap: f(1700, OBBB("OBBBA / ACTC refundable cap $1,700 per child")),
    phaseoutThreshold: {
      single: f(200000, IRC("IRC §24(b)(2) — $200,000 (non-joint)", "https://www.govinfo.gov/app/details/USCODE-2024-title26/USCODE-2024-title26-subtitleA-chap1-subchapA-partIV-subpartA-sec24")),
      mfj: f(400000, IRC("IRC §24(b)(2) — $400,000 (joint)", "https://www.govinfo.gov/app/details/USCODE-2024-title26/USCODE-2024-title26-subtitleA-chap1-subchapA-partIV-subpartA-sec24")),
    },
    phaseoutPer1000: f(50, IRC("IRC §24(b)(1) — $50 per $1,000 over threshold", "https://www.govinfo.gov/app/details/USCODE-2024-title26")),
    earnedIncomeFloor: f(2500, IRC("IRC §24(h)(6) / §24(d) — ACTC earned-income floor $2,500", "https://www.govinfo.gov/app/details/USCODE-2024-title26")),
    actcRate: f(0.15, IRC("IRC §24(d)(1)(B)(i) — 15% of earned income over floor", "https://www.govinfo.gov/app/details/USCODE-2024-title26")),
  },
  eitc: {
    byChildren: {
      0: eitc(0, 8490, 649, 10620, 17730),
      1: eitc(1, 12730, 4328, 23350, 30470),
      2: eitc(2, 17880, 7152, 23350, 30470),
      3: eitc(3, 17880, 8046, 23350, 30470),
    },
    investmentIncomeLimit: f(11950, RP2440("§2.06(2) — EITC investment-income limit 2025 $11,950")),
  },
  aotc: {
    maxCredit: f(2500, F8863("AOTC max $2,500 per student")),
    refundablePct: f(0.40, F8863("AOTC 40% refundable")),
    firstTierCap: f(2000, F8863("AOTC 100% of first $2,000 of qualified expenses")),
    secondTierRate: f(0.25, F8863("AOTC 25% of next $2,000")),
    phaseoutMagi: {
      single: { start: f(80000, F8863("AOTC MAGI phaseout start, single $80,000")), end: f(90000, F8863("AOTC MAGI phaseout end, single $90,000")) },
      mfj: { start: f(160000, F8863("AOTC MAGI phaseout start, MFJ $160,000")), end: f(180000, F8863("AOTC MAGI phaseout end, MFJ $180,000")) },
    },
  },
  qbi: {
    rate: f(0.20, IRC("IRC §199A(a) — 20%", "https://www.govinfo.gov/app/details/USCODE-2024-title26")),
    threshold: {
      single: f(197300, F8995("§199A taxable-income threshold 2025, non-joint $197,300")),
      mfj: f(394600, F8995("§199A taxable-income threshold 2025, MFJ $394,600")),
    },
    phaseInRange: f(50000, IRC("IRC §199A(e)(2) — $50,000 phase-in band (×2 for MFJ)", "https://www.govinfo.gov/app/details/USCODE-2024-title26")),
  },
  // §6695(g) due-diligence penalty per failure for returns filed in 2026 (spec + Rev. Proc. 2025-32).
  dueDiligencePenaltyPerFailure: f(650, RP2532("§6695(g) due-diligence penalty $650/failure, returns filed 2026")),
};

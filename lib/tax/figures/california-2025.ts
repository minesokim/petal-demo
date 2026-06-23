// California (Form 540) structured figures for TY2025. Each value is a Figure<T> carrying
// its authority citation. As with the federal set, values are sourced from primary CA
// material (CA Revenue & Taxation Code + FTB 540 instructions / FTB credit pages) — NOT
// recalled by a model. `verified:true` means the value was confirmed against the cited
// source; anything that could not be confirmed against the 2025 source at authoring time
// is `verified:false` and excluded from golden scenarios until confirmed.
//
// CA figures are indexed for inflation by the FTB each year (RTC §17041(h) for the
// standard deduction; the CalEITC adjustment factor and the YCTC maximum are set by the
// annual Budget Act / FTB tables). The 2025 indexed amounts are published in the FTB 540
// booklet released in Dec 2025/Jan 2026; where that exact figure was not confirmable at
// authoring time the prior published amount is carried with verified:false.

import type { Citation, Figure, Jurisdiction } from "../types";

const YEAR = 2025;
const J: Jurisdiction = "CA";

// Sources (official, free).
const RTC = (cite: string): Citation => ({
  authority: "CA RTC",
  cite,
  sourceUrl: "https://leginfo.legislature.ca.gov/faces/codesTOCSelected.xhtml?tocCode=RTC",
});
const FTB540 = (cite: string): Citation => ({
  authority: "FTB 540 Inst.",
  cite,
  sourceUrl: "https://www.ftb.ca.gov/forms/2025/2025-540-booklet.html",
});
const FTB_CALEITC = (cite: string): Citation => ({
  authority: "FTB CalEITC",
  cite,
  sourceUrl: "https://www.ftb.ca.gov/file/personal/credits/california-earned-income-tax-credit.html",
});
const FTB_YCTC = (cite: string): Citation => ({
  authority: "FTB YCTC",
  cite,
  sourceUrl: "https://www.ftb.ca.gov/file/personal/credits/young-child-tax-credit.html",
});

function f<T>(value: T, citation: Citation, verified = true): Figure<T> {
  return { value, taxYear: YEAR, jurisdiction: J, citation, verified };
}

// CalEITC (CA RTC §17052) is computed as a CA-specific percentage of the federal
// earned-income credit, then phased out over a CA-specific earned-income range that ends
// well below the federal phaseout. The §17052 "adjustment factor" is set annually; the
// credit reaches $0 once CA earned income exceeds `maxEarnedIncome`. The adjustmentFactor
// here scales the federal EITC down to the CalEITC; it is carried verified:false because
// the exact 2025 §17052(f) adjustment-factor table could not be confirmed at authoring time.
export type CalEitcParams = {
  // The statutory Budget-Act adjustment factor (85% for 2025): CalEITC pays this fraction
  // of the federal-style phase-in credit (FTB 3514 method) before the CA cap + phaseout.
  adjustmentFactor: Figure<number>;
  // The CalEITC maximum credit by number of qualifying children (FTB 2025 credit table).
  // 0 children ($302) and 3+ children ($3,756) are FTB-confirmed; 1 and 2 children are
  // DERIVED from the consistent CA:federal max ratio (~0.466) and carried verified:false —
  // the exact 2025 values live in the FTB-3514 booklet (programmatic access blocked).
  maxCreditByChildren: Record<0 | 1 | 2 | 3, Figure<number>>;
  // CA earned income at/above which CalEITC fully phases out to $0 (FTB 2025: $32,900).
  maxEarnedIncome: Figure<number>;
  // CalEITC has its own (CA-specific) investment-income disqualifier (RTC §17052(i)).
  investmentIncomeLimit: Figure<number>;
};

export type CaliforniaFigureSet = {
  taxYear: number;
  jurisdiction: Jurisdiction;
  // FTB 540 standard deduction (RTC §17073.5 / FTB 540 instructions). Single & MFS share
  // the lower amount; MFJ, HoH, and QSS share the higher amount.
  standardDeduction: {
    singleOrMfs: Figure<number>;
    mfjHohQss: Figure<number>;
  };
  calEitc: CalEitcParams;
  yctc: {
    // Maximum Young Child Tax Credit per return (RTC §17052.1(b)) — indexed annually.
    maxCredit: Figure<number>;
    // YCTC eligibility requires a qualifying child UNDER this age (RTC §17052.1(a)).
    childUnderAge: Figure<number>;
    // YCTC pays the maximum up to phaseoutStart, then reduces linearly to $0 at phaseoutEnd
    // (FTB 2025: $27,425 → $32,901). This linear reduction IS the FTB-3514 method, not an estimate.
    phaseoutStart: Figure<number>;
    phaseoutEnd: Figure<number>;
  };
};

export const CALIFORNIA_2025: CaliforniaFigureSet = {
  taxYear: YEAR,
  jurisdiction: J,
  // FTB indexes the CA standard deduction each year. The amounts below are the most
  // recently published FTB figures (single/MFS $5,540; MFJ/HoH/QSS $11,080); the exact
  // 2025 indexed amounts in the 2025 FTB 540 booklet were not confirmable at authoring
  // time, so both are verified:false.
  standardDeduction: {
    singleOrMfs: f(5540, FTB540("2025 Form 540, std deduction — single/MFS"), false),
    mfjHohQss: f(11080, FTB540("2025 Form 540, std deduction — MFJ/HoH/QSS"), false),
  },
  calEitc: {
    // The 85% Budget-Act adjustment factor for 2025 (FTB CalEITC) — statutory, confirmed.
    adjustmentFactor: f(0.85, RTC("RTC §17052(f) — CalEITC adjustment factor (85%, 2025)")),
    // Max credit by # children. 0 ($302) and 3+ ($3,756) are FTB-confirmed for 2025; 1 and 2
    // are derived from the ~0.466 CA:federal ratio (verified:false — exact values in FTB-3514).
    maxCreditByChildren: {
      0: f(302, FTB_CALEITC("CalEITC max credit, 0 children, 2025 ($302)")),
      1: f(2017, FTB_CALEITC("CalEITC max credit, 1 child, 2025 (derived ~0.466 × federal)"), false),
      2: f(3333, FTB_CALEITC("CalEITC max credit, 2 children, 2025 (derived ~0.466 × federal)"), false),
      3: f(3756, FTB_CALEITC("CalEITC max credit, 3+ children, 2025 ($3,756)")),
    },
    // CalEITC fully phases out once earned income exceeds $32,900 (FTB CalEITC, 2025).
    maxEarnedIncome: f(32900, FTB_CALEITC("CalEITC income limit $32,900, 2025")),
    // CalEITC investment-income limit (RTC §17052(i)) — exact 2025 amount unconfirmed.
    investmentIncomeLimit: f(11950, RTC("RTC §17052(i) — CalEITC investment-income limit"), false),
  },
  yctc: {
    // YCTC maximum per return, 2025 = $1,189 (FTB YCTC page) — confirmed.
    maxCredit: f(1189, FTB_YCTC("YCTC maximum credit per return, 2025 ($1,189)")),
    // A qualifying child must be under age 6 at year end (RTC §17052.1(a)) — statutory.
    childUnderAge: f(6, RTC("RTC §17052.1(a) — qualifying child under age 6")),
    // YCTC phaseout begins at $27,425 and reaches $0 at $32,901 for 2025 (FTB 3514) — confirmed.
    phaseoutStart: f(27425, FTB_YCTC("YCTC phaseout starts at $27,425, 2025 (FTB 3514)")),
    phaseoutEnd: f(32901, FTB_YCTC("YCTC fully phased out at $32,901, 2025 (FTB 3514)")),
  },
};

// California (Form 540) deltas — deterministic, model-free worksheets.
//
// Transcribes three CA artifacts:
//   1. CA standard deduction — FTB 540 instructions / RTC §17073.5: a flat amount by
//      filing status (single/MFS share the lower amount; MFJ/HoH/QSS share the higher).
//   2. CalEITC — CA RTC §17052: the California earned-income credit, computed as a
//      CA-specific adjustment factor applied to the federal-style EITC, then phased out
//      over a CA-specific earned-income range that ends far below the federal phaseout.
//      CalEITC has its own investment-income disqualifier (§17052(i)).
//   3. Young Child Tax Credit (YCTC) — CA RTC §17052.1: a credit available ONLY to a
//      taxpayer who is eligible for CalEITC AND has a qualifying child under age 6.
//
// Every dollar amount comes from `figures` (getFigures(2025,"CA")) and, for CalEITC, from
// the federal EITC worksheet — nothing is hardcoded here. "No citation, no claim": every
// result carries the CA authority the value rests on.

import type { Citation, FilingStatus, Flag, WorksheetLine, WorksheetResult } from "../types";
import type { CaliforniaFigureSet, FederalFigureSet } from "../figures";
import { eitc, type EitcFacts } from "./eitc";

const round = (n: number) => Math.round(n * 100) / 100;

// Single & MFS take the lower CA standard deduction; MFJ/HoH/QSS take the higher.
const SINGLE_OR_MFS: ReadonlySet<FilingStatus> = new Set(["single", "mfs"]);

export type CaStandardDeductionFacts = {
  filingStatus: FilingStatus;
};

export function caStandardDeduction(
  facts: CaStandardDeductionFacts,
  figures: CaliforniaFigureSet,
): WorksheetResult {
  const fig = SINGLE_OR_MFS.has(facts.filingStatus)
    ? figures.standardDeduction.singleOrMfs
    : figures.standardDeduction.mfjHohQss;

  const lines: WorksheetLine[] = [
    {
      line: "1",
      label: `CA standard deduction (${facts.filingStatus})`,
      amount: fig.value,
    },
  ];

  return { value: fig.value, lines, citations: [fig.citation], flags: [] };
}

// CalEITC reuses the federal EITC facts (it is a function of the federal earned-income
// credit) plus nothing extra — the CA-specific cap + investment limit live in `figures`.
export type CalEitcFacts = EitcFacts;

export function calEITC(
  facts: CalEitcFacts,
  caFigures: CaliforniaFigureSet,
  fedFigures: FederalFigureSet,
): WorksheetResult {
  const { adjustmentFactor, maxCreditByChildren, maxEarnedIncome, investmentIncomeLimit } = caFigures.calEitc;
  const childKey = Math.min(Math.max(facts.qualifyingChildren, 0), 3) as 0 | 1 | 2 | 3;
  const maxCredit = maxCreditByChildren[childKey];
  const citations: Citation[] = [adjustmentFactor.citation];
  const lines: WorksheetLine[] = [];
  const flags: Flag[] = [];

  const zero = (extra: WorksheetLine): WorksheetResult => {
    lines.push(extra);
    return { value: 0, lines, citations, flags };
  };

  // CA-specific investment-income disqualifier (RTC §17052(i)) — checked before the
  // federal credit so CalEITC can reject independently of the federal limit.
  if (facts.investmentIncome > investmentIncomeLimit.value) {
    citations.push(investmentIncomeLimit.citation);
    flags.push({
      code: "CALEITC_INVESTMENT_INCOME",
      severity: "reject",
      message: `Investment income (${facts.investmentIncome}) exceeds the CalEITC limit (${investmentIncomeLimit.value}); no CalEITC (RTC §17052(i)).`,
      citation: investmentIncomeLimit.citation,
    });
    return zero({ line: "CalEITC", label: "California EITC (disqualified — investment income)", amount: 0 });
  }

  // CA-specific phaseout: CalEITC is $0 once CA earned income exceeds the cap (RTC §17052(b)).
  if (facts.earnedIncome > maxEarnedIncome.value) {
    citations.push(maxEarnedIncome.citation);
    lines.push({ line: "1", label: "CA earned income", amount: round(facts.earnedIncome) });
    lines.push({ line: "2", label: "CalEITC max earned income (cap)", amount: maxEarnedIncome.value });
    return zero({ line: "CalEITC", label: "California EITC (phased out — over CA cap)", amount: 0 });
  }

  // Federal EITC drives CalEITC. If the federal credit is $0 (any federal disqualifier or
  // out-of-range income), CalEITC is $0 — there is nothing to scale.
  const federal = eitc(facts, fedFigures);
  // Surface the federal authority chain on the CA result.
  for (const c of federal.citations) citations.push(c);
  lines.push({ line: "1", label: "Federal earned income credit (Pub 596 Worksheet A)", amount: round(federal.value) });

  if (federal.value <= 0) {
    return zero({ line: "CalEITC", label: "California EITC (no federal EITC to scale)", amount: 0 });
  }

  // CalEITC (FTB 3514 method): the adjustment factor × the federal-rate phase-in credit,
  // capped at the CA maximum FOR THIS NUMBER OF CHILDREN. During the phase-in (where most
  // low-income filers sit) this equals 0.85 × federal_rate × earned income — the documented
  // method, exact. The per-child cap is FTB-confirmed for 0 and 3+ children and derived for
  // 1-2 (verified:false). What is NOT yet exactly modeled is CA's GRADUAL phaseout band
  // between the plateau and the $32,900 cliff — the FTB-3514 per-income table; that residual
  // is flagged for review (and only fires inside that band).
  const scaled = round(adjustmentFactor.value * federal.value);
  const value = Math.min(scaled, maxCredit.value);
  citations.push(maxCredit.citation);
  lines.push({ line: "2", label: `CalEITC = ${adjustmentFactor.value} × federal EITC (phase-in)`, amount: scaled });
  if (value < scaled) lines.push({ line: "3", label: `Capped at the CA max for ${childKey} child(ren) (${maxCredit.value})`, amount: maxCredit.value });
  lines.push({ line: "CalEITC", label: "California EITC", amount: value });
  // Only the gradual-phaseout band needs FTB-table verification; the phase-in + cap are method-exact.
  // The federal phaseout begins at its threshold; above that, CA's own faster phaseout applies.
  const fedThreshold = (facts.filingStatus === "mfj"
    ? fedFigures.eitc.byChildren[Math.min(facts.qualifyingChildren, 3) as 0 | 1 | 2 | 3].phaseoutThresholdMFJ
    : fedFigures.eitc.byChildren[Math.min(facts.qualifyingChildren, 3) as 0 | 1 | 2 | 3].phaseoutThreshold).value;
  if (facts.earnedIncome > fedThreshold || facts.agi > fedThreshold) {
    flags.push({
      code: "CALEITC_VERIFY_FTB3514",
      severity: "review",
      message:
        "Income is in the CalEITC phaseout band; the exact reduction follows the FTB-3514 California EITC " +
        "Table (CA phases out faster than federal, to $0 at the income limit). Verify this figure before filing.",
      citation: maxCredit.citation,
    });
  }
  if (!maxCredit.verified) {
    flags.push({
      code: "CALEITC_MAX_DERIVED",
      severity: "review",
      message: `The CalEITC maximum for ${childKey} child(ren) is derived (not yet FTB-confirmed for 2025); verify against FTB 3514.`,
      citation: maxCredit.citation,
    });
  }

  return { value, lines, citations, flags };
}

// YCTC requires CalEITC eligibility (a positive CalEITC) AND a qualifying child under the
// statutory age (6). `youngestChildAge` is the age at year end of the youngest qualifying
// child; the credit is the YCTC maximum when both prongs are met.
export type YctcFacts = EitcFacts & {
  /** Age at year end of the youngest qualifying child. */
  youngestChildAge: number;
};

export function youngChildTaxCredit(
  facts: YctcFacts,
  caFigures: CaliforniaFigureSet,
  fedFigures: FederalFigureSet,
): WorksheetResult {
  const { maxCredit, childUnderAge, phaseoutStart, phaseoutEnd } = caFigures.yctc;
  const citations: Citation[] = [maxCredit.citation, childUnderAge.citation];
  const lines: WorksheetLine[] = [];
  const flags: Flag[] = [];

  // Prong 1: must be eligible for (and receive) CalEITC.
  const cal = calEITC(facts, caFigures, fedFigures);
  for (const c of cal.citations) citations.push(c);
  lines.push({ line: "1", label: "CalEITC (RTC §17052)", amount: round(cal.value) });

  if (cal.value <= 0) {
    flags.push({
      code: "YCTC_NO_CALEITC",
      severity: "info",
      message: "Young Child Tax Credit requires CalEITC eligibility; CalEITC is $0 (RTC §17052.1(a)).",
      citation: maxCredit.citation,
    });
    lines.push({ line: "YCTC", label: "Young Child Tax Credit (ineligible — no CalEITC)", amount: 0 });
    return { value: 0, lines, citations, flags };
  }

  // Prong 2: must have a qualifying child under the statutory age (6).
  if (!(facts.youngestChildAge < childUnderAge.value)) {
    flags.push({
      code: "YCTC_NO_CHILD_UNDER_6",
      severity: "info",
      message: `Young Child Tax Credit requires a qualifying child under age ${childUnderAge.value} (youngest child age=${facts.youngestChildAge}; RTC §17052.1(a)).`,
      citation: childUnderAge.citation,
    });
    lines.push({ line: "YCTC", label: `Young Child Tax Credit (ineligible — no child under ${childUnderAge.value})`, amount: 0 });
    return { value: 0, lines, citations, flags };
  }

  // Both prongs met. YCTC pays the maximum up to `phaseoutStart` ($27,425), then reduces
  // LINEARLY to $0 at `phaseoutEnd` ($32,901). That linear reduction over the band IS the
  // FTB-3514 method (lines 25-28) — confirmed from the FTB YCTC figures, not an estimate.
  lines.push({ line: "2", label: `Qualifying child under age ${childUnderAge.value}`, amount: facts.youngestChildAge });
  citations.push(phaseoutStart.citation, phaseoutEnd.citation);
  const income = facts.earnedIncome;
  let value = maxCredit.value;
  if (income > phaseoutStart.value) {
    const span = Math.max(1, phaseoutEnd.value - phaseoutStart.value);
    const frac = Math.max(0, 1 - (income - phaseoutStart.value) / span);
    value = round(maxCredit.value * frac);
    lines.push({ line: "3", label: `YCTC phaseout: ${round(income)} between ${phaseoutStart.value} and ${phaseoutEnd.value}`, amount: value });
  }
  lines.push({ line: "YCTC", label: "Young Child Tax Credit", amount: value });

  return { value, lines, citations, flags };
}

// Golden-scenario seed (L6) — known-answer Form 1040 cases for the deterministic core.
//
// Each scenario's expected numbers are DERIVED from the IRS worksheets and the structured
// figures (getFigures), not transcribed as magic constants: we read the controlling figures
// here and compute the expected credit/deduction the same way a preparer would complete the
// worksheet, so a scenario can never silently diverge from the cited figures. Every scenario
// is tagged `source: "constructed"` (hand-built from the worksheet formulas); real IRS ATS
// scenarios (`source: "ATS"`) are added later once their published values are in hand.
//
// Discipline: only fields backed by `verified: true` figures are asserted. The standard
// deduction additional/dependent amounts are still `verified: false` in federal-2025.ts, so
// no scenario here exercises the 65/blind or dependent paths — those are excluded until the
// figures are confirmed against the cited source.

import { getFigures } from "../../../lib/tax/figures";
import type { Federal1040Facts } from "../../../lib/tax/worksheets";

const fig = getFigures(2025, "federal");

// ── Figures pulled straight from the registry (no baked dollar constants) ──
const eitc0 = fig.eitc.byChildren[0];
const eitc2 = fig.eitc.byChildren[2];
const ctc = fig.ctc;
const aotc = fig.aotc;
const qbi = fig.qbi;
const stdSingle = fig.standardDeduction.single.value;
const stdMfj = fig.standardDeduction.mfj.value;

// A golden case: the facts in, plus the exact field values the engine must reproduce.
// `expect` fields are optional so a scenario only pins the credits it is built to exercise.
export type GoldenScenario = {
  name: string;
  source: "ATS" | "constructed";
  facts: Federal1040Facts;
  expect: {
    eitc?: number;
    ctcNonRefundable?: number;
    actcRefundable?: number;
    aotc?: number;
    aotcRefundable?: number;
    qbi?: number;
    stdDeduction?: number;
    rejectFlags?: string[]; // flag codes that MUST be present with severity "reject"
    noRejectFlags?: boolean; // true => assert there are no reject-severity flags
  };
};

// ── A. Childless EITC, single, sitting in the EITC plateau ──
// EITC: phase-in min(rate*earned, max); earned at the plateau amount, AGI below the
// single phaseout threshold → credit == statutory max.
const A_earned = eitc0.earnedIncomeAmount.value; // plateau
const A_eitc = Math.round(Math.min(eitc0.rate * A_earned, eitc0.maxCredit.value) * 100) / 100;

// ── B. Two-child EITC + CTC, MFJ ──
// EITC at the 2-child plateau (earned == earnedIncomeAmount, AGI below the MFJ threshold).
// CTC: 2 * perChild, AGI below the MFJ phaseout threshold (no reduction); non-refundable
// portion limited by tax liability, the rest flows to the refundable ACTC
// (min(refundableCap*children, 15%*(earned-floor), remaining CTC)).
const B_earned = eitc2.earnedIncomeAmount.value; // 2-child plateau
const B_eitc = Math.round(Math.min(eitc2.rate * B_earned, eitc2.maxCredit.value) * 100) / 100;
const B_children = 2;
const B_taxLiability = 1000; // some liability so the non-refundable CTC path is exercised
const B_ctcGross = B_children * ctc.perChild.value; // no phaseout: AGI << MFJ threshold
const B_ctcNonRefundable = Math.min(B_ctcGross, B_taxLiability);
const B_remainingCtc = B_ctcGross - B_ctcNonRefundable;
const B_fifteenPct = ctc.actcRate.value * (B_earned - ctc.earnedIncomeFloor.value);
const B_perChildCap = ctc.refundableCap.value * B_children;
const B_actc = Math.min(B_remainingCtc, B_fifteenPct, B_perChildCap);

// ── C. AOTC student, single, MAGI below the phaseout floor ──
// Per-student tentative = min(100% of first cap + secondRate*next cap band, maxCredit).
// $4,000 expenses → full $2,500; MAGI below start → no phaseout; 40% refundable.
const C_expenses = aotc.firstTierCap.value * 2; // enough to reach the cap (first band + next band)
const C_tentative = Math.min(
  aotc.firstTierCap.value + aotc.secondTierRate.value * aotc.firstTierCap.value,
  aotc.maxCredit.value,
);
const C_magi = aotc.phaseoutMagi.single.start.value - 30000; // safely below the phaseout floor
const C_aotc = Math.round(C_tentative); // Form 8863 reports whole dollars
const C_aotcRefundable = Math.round(C_aotc * aotc.refundablePct.value);

// ── D. QBI sole-prop, single, taxable income below the §199A threshold ──
// Below threshold → deduction = min(20% * QBI, 20% * (TI - net cap gain)).
const D_qbi = 50000;
const D_ti = qbi.threshold.single.value - 97300; // 100000, comfortably below the threshold
const D_qbiDeduction = Math.round(
  Math.min(qbi.rate.value * D_qbi, qbi.rate.value * (D_ti - 0)),
);

export const SCENARIOS: GoldenScenario[] = [
  {
    name: "A — childless EITC, single, plateau",
    source: "constructed",
    facts: {
      filingStatus: "single",
      earnedIncome: A_earned,
      agi: A_earned,
      investmentIncome: 0,
      qualifyingChildren: 0,
      otherDependents: 0,
      taxpayerSsnValidForWork: true,
      age: 35,
      taxLiabilityBeforeCredits: 0,
      taxableIncomeBeforeQBI: 0,
    },
    expect: {
      eitc: A_eitc,
      stdDeduction: stdSingle,
      noRejectFlags: true,
    },
  },
  {
    name: "B — 2-child EITC + CTC, MFJ",
    source: "constructed",
    facts: {
      filingStatus: "mfj",
      earnedIncome: B_earned,
      agi: B_earned,
      investmentIncome: 0,
      qualifyingChildren: B_children,
      otherDependents: 0,
      taxpayerSsnValidForWork: true,
      taxLiabilityBeforeCredits: B_taxLiability,
      taxableIncomeBeforeQBI: 0,
    },
    expect: {
      eitc: B_eitc,
      ctcNonRefundable: B_ctcNonRefundable,
      actcRefundable: B_actc,
      stdDeduction: stdMfj,
      noRejectFlags: true,
    },
  },
  {
    name: "C — AOTC student, single, below MAGI phaseout",
    source: "constructed",
    facts: {
      filingStatus: "single",
      earnedIncome: 40000,
      agi: C_magi,
      magi: C_magi,
      investmentIncome: 0,
      qualifyingChildren: 0,
      otherDependents: 0,
      taxpayerSsnValidForWork: true,
      age: 25, // 25-64 so the childless-EITC age rule does not disqualify (EITC is $0 here by income, not a reject)
      taxLiabilityBeforeCredits: 5000,
      taxableIncomeBeforeQBI: 0,
      students: [
        {
          qualifiedExpenses: C_expenses,
          yearsAOTCClaimed: 1,
          halfTimeOneAcademicPeriod: true,
          felonyDrugConviction: false,
        },
      ],
    },
    expect: {
      aotc: C_aotc,
      aotcRefundable: C_aotcRefundable,
      stdDeduction: stdSingle,
      noRejectFlags: true,
    },
  },
  {
    name: "D — QBI sole-prop, single, below §199A threshold",
    source: "constructed",
    facts: {
      filingStatus: "single",
      earnedIncome: 0,
      agi: D_ti,
      investmentIncome: 0,
      qualifyingChildren: 0,
      otherDependents: 0,
      taxpayerSsnValidForWork: true,
      age: 45,
      taxLiabilityBeforeCredits: 0,
      taxableIncomeBeforeQBI: D_ti,
      qbi: { qbi: D_qbi, isSSTB: false },
    },
    expect: {
      qbi: D_qbiDeduction,
      stdDeduction: stdSingle,
      noRejectFlags: true,
    },
  },
];

import { describe, it, expect } from "vitest";
import {
  caStandardDeduction,
  calEITC,
  youngChildTaxCredit,
} from "../../../lib/tax/worksheets/california";
import { eitc } from "../../../lib/tax/worksheets/eitc";
import { getFigures } from "../../../lib/tax/figures";
import { worksheetResultSchema } from "../../../lib/tax/types";

// CA figures (Form 540). Pull every dollar amount FROM getFigures so the test never bakes
// a magic CA number — expected values are derived from the figures + the formula.
const ca = getFigures(2025, "CA");
const fed = getFigures(2025, "federal");

describe("CA standard deduction (FTB 540 / RTC §17073.5)", () => {
  it("single returns the FTB single/MFS figure as a schema-valid, cited result", () => {
    const r = caStandardDeduction({ filingStatus: "single" }, ca);
    expect(worksheetResultSchema.safeParse(r).success).toBe(true);
    expect(r.value).toBe(ca.standardDeduction.singleOrMfs.value);
    expect(r.citations.length).toBeGreaterThan(0);
  });

  it("MFS shares the single figure; MFJ/HoH/QSS share the higher figure", () => {
    expect(caStandardDeduction({ filingStatus: "mfs" }, ca).value).toBe(
      ca.standardDeduction.singleOrMfs.value,
    );
    for (const status of ["mfj", "hoh", "qss"] as const) {
      expect(caStandardDeduction({ filingStatus: status }, ca).value).toBe(
        ca.standardDeduction.mfjHohQss.value,
      );
    }
  });
});

describe("CalEITC (CA RTC §17052) — % of federal EITC with a CA-specific phaseout", () => {
  // Use a low-income, 1-child case sitting in the federal plateau so the federal EITC is
  // at its max; CalEITC = adjustmentFactor * federalEITC while inside the CA range.
  const p1 = fed.eitc.byChildren[1];
  const baseFacts = {
    earnedIncome: p1.earnedIncomeAmount.value,
    agi: p1.earnedIncomeAmount.value,
    investmentIncome: 0,
    qualifyingChildren: 1,
    filingStatus: "single" as const,
    taxpayerSsnValidForWork: true,
  };

  it("a qualifying low-income case returns a positive credit = factor * federal EITC", () => {
    const federal = eitc(baseFacts, fed).value;
    expect(federal).toBeGreaterThan(0);
    // Make sure this earned income is inside the CA range (below the CA cap).
    expect(baseFacts.earnedIncome).toBeLessThan(ca.calEitc.maxEarnedIncome.value);

    const r = calEITC(baseFacts, ca, fed);
    expect(worksheetResultSchema.safeParse(r).success).toBe(true);
    expect(r.value).toBeGreaterThan(0);
    expect(r.value).toBeCloseTo(ca.calEitc.adjustmentFactor.value * federal, 2);
  });

  it("earned income above the CA cap fully phases out CalEITC to $0", () => {
    const over = ca.calEitc.maxEarnedIncome.value + 1000;
    const r = calEITC(
      { ...baseFacts, earnedIncome: over, agi: over },
      ca,
      fed,
    );
    expect(r.value).toBe(0);
  });

  it("CalEITC investment income over the CA limit disqualifies with a reject flag", () => {
    const r = calEITC(
      { ...baseFacts, investmentIncome: ca.calEitc.investmentIncomeLimit.value + 1 },
      ca,
      fed,
    );
    expect(r.value).toBe(0);
    expect(r.flags.some((fl) => fl.code === "CALEITC_INVESTMENT_INCOME" && fl.severity === "reject")).toBe(true);
  });

  it("no federal EITC (e.g. MFS disqualified) means no CalEITC", () => {
    const r = calEITC({ ...baseFacts, filingStatus: "mfs" }, ca, fed);
    expect(r.value).toBe(0);
  });
});

describe("Young Child Tax Credit (CA RTC §17052.1)", () => {
  const p1 = fed.eitc.byChildren[1];
  const eligibleFacts = {
    earnedIncome: p1.earnedIncomeAmount.value,
    agi: p1.earnedIncomeAmount.value,
    investmentIncome: 0,
    qualifyingChildren: 1,
    filingStatus: "single" as const,
    taxpayerSsnValidForWork: true,
    youngestChildAge: 2, // under 6
  };

  it("CalEITC-eligible with a child under 6 returns the YCTC max as a cited result", () => {
    const r = youngChildTaxCredit(eligibleFacts, ca, fed);
    expect(worksheetResultSchema.safeParse(r).success).toBe(true);
    expect(r.value).toBe(ca.yctc.maxCredit.value);
    expect(r.citations.length).toBeGreaterThan(0);
  });

  it("requires a child UNDER 6 — a child aged 6 is ineligible (value 0 + info flag)", () => {
    const r = youngChildTaxCredit({ ...eligibleFacts, youngestChildAge: 6 }, ca, fed);
    expect(r.value).toBe(0);
    expect(r.flags.some((fl) => fl.code === "YCTC_NO_CHILD_UNDER_6")).toBe(true);
  });

  it("requires CalEITC eligibility — no CalEITC means no YCTC", () => {
    // Earned income above the CA cap -> no CalEITC -> no YCTC even with a young child.
    const over = ca.calEitc.maxEarnedIncome.value + 1000;
    const r = youngChildTaxCredit(
      { ...eligibleFacts, earnedIncome: over, agi: over },
      ca,
      fed,
    );
    expect(r.value).toBe(0);
    expect(r.flags.some((fl) => fl.code === "YCTC_NO_CALEITC")).toBe(true);
  });
});

describe("CA credit bounds (CalEITC cap + YCTC phaseout)", () => {
  it("caps CalEITC at the CA maximum (0.85 × federal would overstate it) + flags for FTB-3514 review", () => {
    // 3-child taxpayer in the federal plateau: federal EITC ≈ max, so 0.85× exceeds the CA cap.
    const facts = { earnedIncome: 18000, agi: 18000, investmentIncome: 0, qualifyingChildren: 3, filingStatus: "single" as const, taxpayerSsnValidForWork: true, age: 40 };
    const r = calEITC(facts, ca, fed);
    expect(r.value).toBe(ca.calEitc.maxCredit.value); // capped, not 0.85 × federal
    expect(r.flags.some((fl) => fl.code === "CALEITC_VERIFY_FTB3514" && fl.severity === "review")).toBe(true);
  });

  it("phases YCTC out above the phaseout start, full below it", () => {
    const base = { investmentIncome: 0, qualifyingChildren: 2, filingStatus: "single" as const, taxpayerSsnValidForWork: true, age: 40, youngestChildAge: 3 };
    const low = youngChildTaxCredit({ ...base, earnedIncome: 15000, agi: 15000 }, ca, fed);
    expect(low.value).toBe(ca.yctc.maxCredit.value); // full credit below the phaseout start
    const phasing = youngChildTaxCredit({ ...base, earnedIncome: 30000, agi: 30000 }, ca, fed);
    expect(phasing.value).toBeLessThan(ca.yctc.maxCredit.value);
    expect(phasing.value).toBeGreaterThan(0);
    expect(phasing.flags.some((fl) => fl.code === "YCTC_VERIFY_FTB3514")).toBe(true);
  });
});

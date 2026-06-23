import { describe, it, expect } from "vitest";
import { eitc } from "../../../lib/tax/worksheets/eitc";
import { getFigures } from "../../../lib/tax/figures";
import { worksheetResultSchema } from "../../../lib/tax/types";

const fig = getFigures(2025, "federal");

// Pull every dollar figure FROM getFigures so the test never bakes a magic number.
const p1 = fig.eitc.byChildren[1]; // 1 qualifying child
const p0 = fig.eitc.byChildren[0]; // childless
const investmentLimit = fig.eitc.investmentIncomeLimit.value;

describe("EITC worksheet (IRC §32 / Pub 596 EIC Worksheet A)", () => {
  it("returns a schema-valid WorksheetResult with at least one citation", () => {
    const r = eitc(
      {
        earnedIncome: p1.earnedIncomeAmount.value,
        agi: p1.earnedIncomeAmount.value,
        investmentIncome: 0,
        qualifyingChildren: 1,
        filingStatus: "single",
        taxpayerSsnValidForWork: true,
      },
      fig,
    );
    expect(worksheetResultSchema.safeParse(r).success).toBe(true);
    expect(r.citations.length).toBeGreaterThan(0);
  });

  it("(a) a 1-child case sitting in the plateau returns exactly maxCredit", () => {
    // At earnedIncomeAmount the phase-in has topped out; AGI below the phaseout
    // threshold means no reduction -> the credit equals the statutory max.
    const earned = p1.earnedIncomeAmount.value;
    expect(p1.rate * earned).toBeGreaterThanOrEqual(p1.maxCredit.value); // we are in the plateau
    expect(earned).toBeLessThan(p1.phaseoutThreshold.value); // and below phaseout

    const r = eitc(
      {
        earnedIncome: earned,
        agi: earned,
        investmentIncome: 0,
        qualifyingChildren: 1,
        filingStatus: "single",
        taxpayerSsnValidForWork: true,
      },
      fig,
    );
    expect(r.value).toBe(p1.maxCredit.value);
    expect(r.flags.some((f) => f.severity === "reject")).toBe(false);
  });

  it("(a2) below the plateau the credit is rate*earnedIncome (phase-in)", () => {
    const earned = Math.floor(p1.earnedIncomeAmount.value / 2); // safely in the phase-in
    const expected = Math.min(p1.rate * earned, p1.maxCredit.value);
    const r = eitc(
      {
        earnedIncome: earned,
        agi: earned,
        investmentIncome: 0,
        qualifyingChildren: 1,
        filingStatus: "single",
        taxpayerSsnValidForWork: true,
      },
      fig,
    );
    expect(r.value).toBeCloseTo(expected, 2);
  });

  it("(b) AGI above the phaseout threshold returns a correctly reduced amount", () => {
    // Sit earned income in the plateau (credit = maxCredit), push AGI a known
    // amount past the single/HoH phaseout threshold, expect a formula reduction.
    const earned = p1.earnedIncomeAmount.value;
    const threshold = p1.phaseoutThreshold.value;
    const over = 1000;
    const agi = threshold + over;
    const expected = Math.max(0, p1.maxCredit.value - p1.phaseoutRate * over);

    const r = eitc(
      {
        earnedIncome: earned,
        agi,
        investmentIncome: 0,
        qualifyingChildren: 1,
        filingStatus: "single",
        taxpayerSsnValidForWork: true,
      },
      fig,
    );
    expect(r.value).toBeCloseTo(expected, 2);
    expect(r.value).toBeLessThan(p1.maxCredit.value);
    expect(r.value).toBeGreaterThan(0);
  });

  it("(b2) MFJ uses the higher MFJ phaseout threshold", () => {
    const earned = p1.earnedIncomeAmount.value;
    const over = 1000;
    const agiMfj = p1.phaseoutThresholdMFJ.value + over;
    const expected = Math.max(0, p1.maxCredit.value - p1.phaseoutRate * over);

    const r = eitc(
      {
        earnedIncome: earned,
        agi: agiMfj,
        investmentIncome: 0,
        qualifyingChildren: 1,
        filingStatus: "mfj",
        taxpayerSsnValidForWork: true,
      },
      fig,
    );
    // The same AGI under the single threshold would phase out far more; MFJ must reduce less.
    expect(r.value).toBeCloseTo(expected, 2);
  });

  it("(b3) the larger of AGI and earned income drives the phaseout", () => {
    // Earned income in the plateau but ABOVE the threshold while AGI is at the
    // threshold: §32(a)(2)/Pub 596 uses the greater of the two.
    const threshold = p1.phaseoutThreshold.value;
    const earned = threshold + 1500; // greater driver
    const expected = Math.max(0, p1.maxCredit.value - p1.phaseoutRate * (earned - threshold));

    const r = eitc(
      {
        earnedIncome: earned,
        agi: threshold, // smaller — must NOT be the driver
        investmentIncome: 0,
        qualifyingChildren: 1,
        filingStatus: "single",
        taxpayerSsnValidForWork: true,
      },
      fig,
    );
    expect(r.value).toBeCloseTo(expected, 2);
  });

  it("(c) investment income one dollar over the limit returns value:0 + a reject flag", () => {
    const r = eitc(
      {
        earnedIncome: p1.earnedIncomeAmount.value,
        agi: p1.earnedIncomeAmount.value,
        investmentIncome: investmentLimit + 1,
        qualifyingChildren: 1,
        filingStatus: "single",
        taxpayerSsnValidForWork: true,
      },
      fig,
    );
    expect(r.value).toBe(0);
    const reject = r.flags.find((f) => f.code === "EITC_INVESTMENT_INCOME");
    expect(reject).toBeDefined();
    expect(reject?.severity).toBe("reject");
    expect(reject?.citation).toBeDefined();
  });

  it("(c2) investment income exactly AT the limit is still allowed", () => {
    const r = eitc(
      {
        earnedIncome: p1.earnedIncomeAmount.value,
        agi: p1.earnedIncomeAmount.value,
        investmentIncome: investmentLimit, // not over
        qualifyingChildren: 1,
        filingStatus: "single",
        taxpayerSsnValidForWork: true,
      },
      fig,
    );
    expect(r.value).toBe(p1.maxCredit.value);
    expect(r.flags.some((f) => f.code === "EITC_INVESTMENT_INCOME")).toBe(false);
  });

  it("(d) a childless taxpayer aged 24 (under 25) is ineligible -> value:0 + reject", () => {
    const earned = p0.earnedIncomeAmount.value;
    const r = eitc(
      {
        earnedIncome: earned,
        agi: earned,
        investmentIncome: 0,
        qualifyingChildren: 0,
        filingStatus: "single",
        taxpayerSsnValidForWork: true,
        age: 24,
      },
      fig,
    );
    expect(r.value).toBe(0);
    expect(r.flags.some((f) => f.code === "EITC_CHILDLESS_AGE" && f.severity === "reject")).toBe(true);
  });

  it("(d2) a childless taxpayer aged 65 (over 64) is ineligible -> value:0 + reject", () => {
    const earned = p0.earnedIncomeAmount.value;
    const r = eitc(
      {
        earnedIncome: earned,
        agi: earned,
        investmentIncome: 0,
        qualifyingChildren: 0,
        filingStatus: "single",
        taxpayerSsnValidForWork: true,
        age: 65,
      },
      fig,
    );
    expect(r.value).toBe(0);
    expect(r.flags.some((f) => f.code === "EITC_CHILDLESS_AGE")).toBe(true);
  });

  it("(d3) a childless taxpayer aged 30 (within 25-64) gets the childless credit", () => {
    const earned = p0.earnedIncomeAmount.value; // plateau for childless
    const r = eitc(
      {
        earnedIncome: earned,
        agi: earned,
        investmentIncome: 0,
        qualifyingChildren: 0,
        filingStatus: "single",
        taxpayerSsnValidForWork: true,
        age: 30,
      },
      fig,
    );
    expect(r.value).toBe(p0.maxCredit.value);
    expect(r.flags.some((f) => f.code === "EITC_CHILDLESS_AGE")).toBe(false);
  });

  it("(e) no SSN valid for work -> ineligible regardless of income (IRC §32(m))", () => {
    const r = eitc(
      {
        earnedIncome: p1.earnedIncomeAmount.value,
        agi: p1.earnedIncomeAmount.value,
        investmentIncome: 0,
        qualifyingChildren: 1,
        filingStatus: "single",
        taxpayerSsnValidForWork: false,
      },
      fig,
    );
    expect(r.value).toBe(0);
    expect(r.flags.some((f) => f.code === "EITC_SSN_INVALID" && f.severity === "reject")).toBe(true);
  });

  it("(f) MFS is ineligible for the EITC", () => {
    const r = eitc(
      {
        earnedIncome: p1.earnedIncomeAmount.value,
        agi: p1.earnedIncomeAmount.value,
        investmentIncome: 0,
        qualifyingChildren: 1,
        filingStatus: "mfs",
        taxpayerSsnValidForWork: true,
      },
      fig,
    );
    expect(r.value).toBe(0);
    expect(r.flags.some((f) => f.code === "EITC_MFS")).toBe(true);
  });

  it("(g) 3+ children clamps to the byChildren[3] params (min(children,3))", () => {
    const p3 = fig.eitc.byChildren[3];
    const earned = p3.earnedIncomeAmount.value;
    const r = eitc(
      {
        earnedIncome: earned,
        agi: earned,
        investmentIncome: 0,
        qualifyingChildren: 5, // more than 3 -> same params as 3
        filingStatus: "single",
        taxpayerSsnValidForWork: true,
      },
      fig,
    );
    expect(r.value).toBe(p3.maxCredit.value);
  });
});

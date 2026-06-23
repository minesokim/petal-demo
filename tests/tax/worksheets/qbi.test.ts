import { describe, it, expect } from "vitest";
import { qbi } from "../../../lib/tax/worksheets/qbi";
import { getFigures } from "../../../lib/tax/figures";
import { worksheetResultSchema } from "../../../lib/tax/types";

// All expected values are derived FROM the figures (read via getFigures) and the
// §199A / Form 8995 + 8995-A formulas — no magic tax dollars baked into the test.
const fig = getFigures(2025, "federal");
const RATE = fig.qbi.rate.value; // 0.20 — IRC §199A(a)
const THRESH_SINGLE = fig.qbi.threshold.single.value; // §199A(e)(2) taxable-income threshold
const THRESH_MFJ = fig.qbi.threshold.mfj.value;
const BAND_SINGLE = fig.qbi.phaseInRange.value; // non-joint phase-in band
const BAND_MFJ = fig.qbi.phaseInRange.value * 2; // joint band is 2× the non-joint band

describe("qbi (§199A / Form 8995 + 8995-A)", () => {
  it("returns a valid, cited WorksheetResult", () => {
    const r = qbi(
      { qbi: 50_000, taxableIncomeBeforeQBI: 100_000, filingStatus: "single", isSSTB: false },
      fig,
    );
    expect(worksheetResultSchema.safeParse(r).success).toBe(true);
    expect(r.citations.length).toBeGreaterThan(0);
  });

  describe("below the taxable-income threshold (Form 8995 simplified path)", () => {
    it("simple case: deduction = rate × QBI when QBI < taxable income", () => {
      const facts = {
        qbi: 50_000,
        taxableIncomeBeforeQBI: 120_000, // < THRESH_SINGLE
        filingStatus: "single" as const,
        isSSTB: false,
      };
      const r = qbi(facts, fig);
      expect(r.value).toBe(RATE * facts.qbi); // 20% × 50,000
    });

    it("SSTB status is irrelevant below the threshold (full 20% still allowed)", () => {
      const facts = {
        qbi: 50_000,
        taxableIncomeBeforeQBI: 120_000, // < THRESH_SINGLE
        filingStatus: "single" as const,
        isSSTB: true,
      };
      const r = qbi(facts, fig);
      expect(r.value).toBe(RATE * facts.qbi);
    });

    it("overall limit caps at 20% of taxable income (minus net cap gain) when income is the binding number", () => {
      const facts = {
        qbi: 50_000,
        taxableIncomeBeforeQBI: 40_000, // below QBI → income is the binding limit
        filingStatus: "single" as const,
        isSSTB: false,
        netCapitalGain: 0,
      };
      const r = qbi(facts, fig);
      // min(20%×QBI, 20%×(TI − netCapGain)) = 20% × 40,000
      expect(r.value).toBe(RATE * facts.taxableIncomeBeforeQBI);
    });

    it("net capital gain reduces the overall (income) limit", () => {
      const facts = {
        qbi: 50_000,
        taxableIncomeBeforeQBI: 60_000,
        filingStatus: "single" as const,
        isSSTB: false,
        netCapitalGain: 30_000,
      };
      const r = qbi(facts, fig);
      // overall limit = 20% × (60,000 − 30,000) = 6,000 < 20% × 50,000 = 10,000
      expect(r.value).toBe(RATE * (facts.taxableIncomeBeforeQBI - facts.netCapitalGain));
    });
  });

  describe("above the phase-in range — full W-2/UBIA limitation (8995-A)", () => {
    it("non-SSTB: deduction is limited to the greater of 50% W-2 or 25% W-2 + 2.5% UBIA", () => {
      const facts = {
        qbi: 200_000,
        taxableIncomeBeforeQBI: THRESH_SINGLE + BAND_SINGLE + 50_000, // fully above range
        filingStatus: "single" as const,
        isSSTB: false,
        w2Wages: 50_000,
        ubia: 0,
      };
      const r = qbi(facts, fig);
      const tentative = RATE * facts.qbi; // 40,000
      const wageLimit = Math.max(0.5 * facts.w2Wages, 0.25 * facts.w2Wages + 0.025 * facts.ubia); // 25,000
      // QBI component is the lesser of the tentative and the wage/UBIA limit
      expect(r.value).toBe(Math.min(tentative, wageLimit));
    });

    it("SSTB fully above the phase-out range yields $0 (no QBI deduction)", () => {
      const facts = {
        qbi: 200_000,
        taxableIncomeBeforeQBI: THRESH_SINGLE + BAND_SINGLE + 1, // just past the top of the range
        filingStatus: "single" as const,
        isSSTB: true,
        w2Wages: 500_000,
        ubia: 1_000_000,
      };
      const r = qbi(facts, fig);
      expect(r.value).toBe(0);
      expect(r.flags.some((f) => f.code === "QBI_SSTB_DISALLOWED")).toBe(true);
    });

    it("MFJ uses a 2× phase-in band: SSTB above THRESH_MFJ + 2×band is $0", () => {
      const facts = {
        qbi: 200_000,
        taxableIncomeBeforeQBI: THRESH_MFJ + BAND_MFJ + 1,
        filingStatus: "mfj" as const,
        isSSTB: true,
        w2Wages: 500_000,
        ubia: 0,
      };
      const r = qbi(facts, fig);
      expect(r.value).toBe(0);
    });
  });

  describe("within the phase-in range (8995-A partial limitation)", () => {
    it("non-SSTB: reduces the excess of tentative over the wage limit by the phased-in %", () => {
      // Put taxable income at the midpoint of the band (50% through the phase-in).
      const ti = THRESH_SINGLE + BAND_SINGLE / 2;
      const facts = {
        qbi: 200_000,
        taxableIncomeBeforeQBI: ti,
        filingStatus: "single" as const,
        isSSTB: false,
        w2Wages: 50_000,
        ubia: 0,
      };
      const r = qbi(facts, fig);
      const tentative = RATE * facts.qbi; // 40,000
      const wageLimit = Math.max(0.5 * facts.w2Wages, 0.25 * facts.w2Wages + 0.025 * facts.ubia); // 25,000
      const pct = (ti - THRESH_SINGLE) / BAND_SINGLE; // 0.5
      const reduction = (tentative - wageLimit) * pct; // (40k − 25k) × 0.5 = 7,500
      const expected = tentative - reduction; // 32,500
      expect(r.value).toBeCloseTo(expected, 2);
    });

    it("SSTB: applies the applicable percentage to QBI/wages before computing (partial credit)", () => {
      // At the midpoint, applicable % of the QBI counted is (1 − pct) = 0.5.
      const ti = THRESH_SINGLE + BAND_SINGLE / 2;
      const facts = {
        qbi: 100_000,
        taxableIncomeBeforeQBI: ti,
        filingStatus: "single" as const,
        isSSTB: true,
        w2Wages: 1_000_000, // huge → wage limit never binds, isolates the SSTB haircut
        ubia: 0,
      };
      const r = qbi(facts, fig);
      const pct = (ti - THRESH_SINGLE) / BAND_SINGLE; // 0.5
      const applicablePct = 1 - pct; // 0.5
      // SSTB: QBI is reduced to applicablePct × QBI, then 20% applied (wage limit non-binding here)
      const expected = RATE * (applicablePct * facts.qbi); // 20% × (0.5 × 100k) = 10,000
      expect(r.value).toBeCloseTo(expected, 2);
    });
  });

  it("never returns a negative deduction", () => {
    const r = qbi(
      { qbi: -10_000, taxableIncomeBeforeQBI: 50_000, filingStatus: "single", isSSTB: false },
      fig,
    );
    expect(r.value).toBeGreaterThanOrEqual(0);
  });
});

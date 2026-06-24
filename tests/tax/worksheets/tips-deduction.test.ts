import { describe, it, expect } from "vitest";
import { tipsDeduction } from "../../../lib/tax/worksheets/tips-deduction";
import { worksheetResultSchema } from "../../../lib/tax/types";

const base = { occupationEligible: true, taxYear: 2025 as const };

describe("Tips deduction worksheet (OBBBA §70201 / IRC §224)", () => {
  it("returns a schema-valid WorksheetResult with at least one citation", () => {
    const r = tipsDeduction({ tips: 5000, magi: 50000, filingStatus: "single", ...base });
    expect(worksheetResultSchema.safeParse(r).success).toBe(true);
    expect(r.citations.length).toBeGreaterThan(0);
  });

  it("(a) tips below cap, MAGI below threshold -> full tips deducted", () => {
    // min(10,000, 25,000) = 10,000; MAGI 130,000 < 150,000 -> no phase-out -> 10,000.
    const r = tipsDeduction({ tips: 10000, magi: 130000, filingStatus: "single", ...base });
    expect(r.value).toBe(10000);
    expect(r.flags.some((f) => f.code === "TIPS_PHASE_OUT")).toBe(false);
  });

  it("(b) tips above the $25,000 cap are capped at $25,000", () => {
    // min(40,000, 25,000) = 25,000; MAGI 100,000 -> no phase-out.
    const r = tipsDeduction({ tips: 40000, magi: 100000, filingStatus: "single", ...base });
    expect(r.value).toBe(25000);
  });

  it("(c) single, tips $30,000, MAGI $160,000 -> $24,000", () => {
    // min(30,000, 25,000) = 25,000; excess = 160,000 - 150,000 = 10,000;
    // whole $1,000s = 10; reduction = 10 * 100 = 1,000; 25,000 - 1,000 = 24,000.
    const r = tipsDeduction({ tips: 30000, magi: 160000, filingStatus: "single", ...base });
    expect(r.value).toBe(24000);
    expect(r.flags.some((f) => f.code === "TIPS_PHASE_OUT")).toBe(true);
  });

  it("(d) phase-out counts only WHOLE $1,000 increments", () => {
    // MAGI 160,900: excess = 10,900; floor(10,900/1000) = 10 -> reduction 1,000 (the 900 ignored).
    const r = tipsDeduction({ tips: 25000, magi: 160900, filingStatus: "single", ...base });
    expect(r.value).toBe(24000);
  });

  it("(e) single, tips $25,000, MAGI $300,000 -> $10,000", () => {
    // excess = 300,000 - 150,000 = 150,000; reduction = 150 * 100 = 15,000; 25,000 - 15,000 = 10,000.
    const r = tipsDeduction({ tips: 25000, magi: 300000, filingStatus: "single", ...base });
    expect(r.value).toBe(10000);
  });

  it("(f) MFJ uses the $300,000 threshold: tips $25,000, MAGI $310,000 -> $24,000", () => {
    // excess = 310,000 - 300,000 = 10,000; reduction = 1,000; 25,000 - 1,000 = 24,000.
    const r = tipsDeduction({ tips: 25000, magi: 310000, filingStatus: "mfj", ...base });
    expect(r.value).toBe(24000);
  });

  it("(g) MAGI high enough fully phases out the deduction to $0", () => {
    // single, MAGI 600,000: excess = 450,000; reduction = 450 * 100 = 45,000 > 25,000 -> 0.
    const r = tipsDeduction({ tips: 25000, magi: 600000, filingStatus: "single", ...base });
    expect(r.value).toBe(0);
    expect(r.flags.some((f) => f.code === "TIPS_FULLY_PHASED_OUT")).toBe(true);
  });

  it("(h) MFS is ineligible -> value 0 + reject flag", () => {
    const r = tipsDeduction({ tips: 25000, magi: 100000, filingStatus: "mfs", ...base });
    expect(r.value).toBe(0);
    expect(r.flags.some((f) => f.code === "TIPS_MFS" && f.severity === "reject")).toBe(true);
  });

  it("(i) ineligible occupation -> value 0 + reject flag", () => {
    const r = tipsDeduction({ tips: 25000, magi: 100000, filingStatus: "single", occupationEligible: false, taxYear: 2025 });
    expect(r.value).toBe(0);
    expect(r.flags.some((f) => f.code === "TIPS_OCCUPATION_INELIGIBLE" && f.severity === "reject")).toBe(true);
  });

  it("(j) a year with no OBBBA figures (2029) throws (no silent fallback)", () => {
    // The deduction terminates after 2028 and we only carry 2025/2026 figures; getObbbaFigures
    // throws for an unregistered year rather than computing against the wrong constants.
    expect(() => tipsDeduction({ tips: 25000, magi: 100000, filingStatus: "single", occupationEligible: true, taxYear: 2029 })).toThrow();
  });
});

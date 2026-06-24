import { describe, it, expect } from "vitest";
import { overtimeDeduction } from "../../../lib/tax/worksheets/overtime-deduction";
import { worksheetResultSchema } from "../../../lib/tax/types";

describe("Overtime deduction worksheet (OBBBA §70202 / IRC §225)", () => {
  it("returns a schema-valid WorksheetResult with at least one citation", () => {
    const r = overtimeDeduction({ overtimePremium: 5000, magi: 50000, filingStatus: "single", taxYear: 2025 });
    expect(worksheetResultSchema.safeParse(r).success).toBe(true);
    expect(r.citations.length).toBeGreaterThan(0);
  });

  it("(a) premium below cap, MAGI below threshold -> full premium", () => {
    // min(10,000, 12,500) = 10,000; MAGI 100,000 < 150,000 -> no phase-out.
    const r = overtimeDeduction({ overtimePremium: 10000, magi: 100000, filingStatus: "single", taxYear: 2025 });
    expect(r.value).toBe(10000);
  });

  it("(b) single cap is $12,500", () => {
    // min(15,000, 12,500) = 12,500; no phase-out.
    const r = overtimeDeduction({ overtimePremium: 15000, magi: 100000, filingStatus: "single", taxYear: 2025 });
    expect(r.value).toBe(12500);
  });

  it("(c) single, premium $12,500, MAGI $160,000 -> $11,500", () => {
    // excess = 160,000 - 150,000 = 10,000; reduction = 10 * 100 = 1,000; 12,500 - 1,000 = 11,500.
    const r = overtimeDeduction({ overtimePremium: 12500, magi: 160000, filingStatus: "single", taxYear: 2025 });
    expect(r.value).toBe(11500);
    expect(r.flags.some((f) => f.code === "OVERTIME_PHASE_OUT")).toBe(true);
  });

  it("(d) MFJ cap is $25,000 (double the single cap)", () => {
    // min(30,000, 25,000) = 25,000; MAGI 100,000 -> no phase-out.
    const r = overtimeDeduction({ overtimePremium: 30000, magi: 100000, filingStatus: "mfj", taxYear: 2025 });
    expect(r.value).toBe(25000);
  });

  it("(e) MFJ, premium $25,000, MAGI $310,000 -> $24,000", () => {
    // joint threshold 300,000; excess = 10,000; reduction = 1,000; 25,000 - 1,000 = 24,000.
    const r = overtimeDeduction({ overtimePremium: 25000, magi: 310000, filingStatus: "mfj", taxYear: 2025 });
    expect(r.value).toBe(24000);
  });

  it("(f) high MAGI fully phases out the deduction to $0", () => {
    // single, MAGI 300,000: excess = 150,000; reduction = 150 * 100 = 15,000 > 12,500 -> 0.
    const r = overtimeDeduction({ overtimePremium: 12500, magi: 300000, filingStatus: "single", taxYear: 2025 });
    expect(r.value).toBe(0);
    expect(r.flags.some((f) => f.code === "OVERTIME_FULLY_PHASED_OUT")).toBe(true);
  });

  it("(g) MFS is ineligible -> value 0 + reject flag", () => {
    const r = overtimeDeduction({ overtimePremium: 12500, magi: 100000, filingStatus: "mfs", taxYear: 2025 });
    expect(r.value).toBe(0);
    expect(r.flags.some((f) => f.code === "OVERTIME_MFS" && f.severity === "reject")).toBe(true);
  });

  it("(h) 2026 figures resolve (same statutory caps as 2025)", () => {
    const r = overtimeDeduction({ overtimePremium: 12500, magi: 100000, filingStatus: "single", taxYear: 2026 });
    expect(r.value).toBe(12500);
  });
});

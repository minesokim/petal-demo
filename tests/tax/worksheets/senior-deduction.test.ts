import { describe, it, expect } from "vitest";
import { seniorDeduction } from "../../../lib/tax/worksheets/senior-deduction";
import { worksheetResultSchema } from "../../../lib/tax/types";

describe("Senior deduction worksheet (OBBBA §70103 / IRC §151(d)(5)(C))", () => {
  it("returns a schema-valid WorksheetResult with at least one citation", () => {
    const r = seniorDeduction({ age: 1, magi: 50000, filingStatus: "single", taxYear: 2025 });
    expect(worksheetResultSchema.safeParse(r).success).toBe(true);
    expect(r.citations.length).toBeGreaterThan(0);
  });

  it("(a) one qualifying individual, MAGI below threshold -> full $6,000", () => {
    // gross = 1 * 6,000 = 6,000; MAGI 50,000 < 75,000 -> no phase-out.
    const r = seniorDeduction({ age: 1, magi: 50000, filingStatus: "single", taxYear: 2025 });
    expect(r.value).toBe(6000);
    expect(r.flags.some((f) => f.code === "SENIOR_PHASE_OUT")).toBe(false);
  });

  it("(b) single, one individual, MAGI $80,000 -> $5,700", () => {
    // excess = 80,000 - 75,000 = 5,000; reduction = 0.06 * 5,000 = 300; 6,000 - 300 = 5,700.
    const r = seniorDeduction({ age: 1, magi: 80000, filingStatus: "single", taxYear: 2025 });
    expect(r.value).toBe(5700);
    expect(r.flags.some((f) => f.code === "SENIOR_PHASE_OUT")).toBe(true);
  });

  it("(c) MFJ, both spouses 65+ ($12,000 gross), MAGI $160,000 -> $11,400", () => {
    // gross = 2 * 6,000 = 12,000; excess = 160,000 - 150,000 = 10,000;
    // reduction = 0.06 * 10,000 = 600; 12,000 - 600 = 11,400.
    const r = seniorDeduction({ age: 2, magi: 160000, filingStatus: "mfj", taxYear: 2025 });
    expect(r.value).toBe(11400);
  });

  it("(d) single, one individual, MAGI $175,000 -> fully phased out to $0", () => {
    // excess = 175,000 - 75,000 = 100,000; reduction = 0.06 * 100,000 = 6,000; 6,000 - 6,000 = 0.
    const r = seniorDeduction({ age: 1, magi: 175000, filingStatus: "single", taxYear: 2025 });
    expect(r.value).toBe(0);
    expect(r.flags.some((f) => f.code === "SENIOR_FULLY_PHASED_OUT")).toBe(true);
  });

  it("(e) no qualifying individual -> $0 + review flag", () => {
    const r = seniorDeduction({ age: 0, magi: 50000, filingStatus: "single", taxYear: 2025 });
    expect(r.value).toBe(0);
    expect(r.flags.some((f) => f.code === "SENIOR_NO_QUALIFYING_INDIVIDUAL" && f.severity === "review")).toBe(true);
  });

  it("(f) non-joint status clamps the count to 1 individual", () => {
    // age=2 passed on a single return clamps to 1 -> gross 6,000 (not 12,000).
    const r = seniorDeduction({ age: 2, magi: 50000, filingStatus: "single", taxYear: 2025 });
    expect(r.value).toBe(6000);
  });

  it("(g) MFS is ineligible -> value 0 + reject flag", () => {
    const r = seniorDeduction({ age: 1, magi: 50000, filingStatus: "mfs", taxYear: 2025 });
    expect(r.value).toBe(0);
    expect(r.flags.some((f) => f.code === "SENIOR_MFS" && f.severity === "reject")).toBe(true);
  });

  it("(h) MAGI exactly at the threshold is not phased down", () => {
    // single at 75,000: excess 0 -> full 6,000.
    const r = seniorDeduction({ age: 1, magi: 75000, filingStatus: "single", taxYear: 2025 });
    expect(r.value).toBe(6000);
  });
});

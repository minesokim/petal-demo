import { describe, it, expect } from "vitest";
import { compute, ComputeRequest } from "../../lib/tax-ai/compute";
import { saltCap } from "../../lib/tax/worksheets/salt-cap";
import { tipsDeduction } from "../../lib/tax/worksheets/tips-deduction";
import { overtimeDeduction } from "../../lib/tax/worksheets/overtime-deduction";
import { seniorDeduction } from "../../lib/tax/worksheets/senior-deduction";

// The compute bridge must dispatch the OBBBA variants to the deterministic worksheet and
// return the IDENTICAL result — the model proposes structured facts, lib/tax owns the number.
describe("compute bridge — OBBBA worksheet variants", () => {
  it("saltCap dispatches identically to calling the worksheet directly", () => {
    const facts = { magi: 520000, filingStatus: "mfj" as const, taxYear: 2025 };
    const viaBridge = compute({ worksheet: "saltCap", facts });
    expect(viaBridge.worksheet).toBe("saltCap");
    expect(viaBridge.result.value).toBe(saltCap(facts).value); // 34,000
    expect(viaBridge.result.value).toBe(34000);
    expect(viaBridge.result.citations.length).toBeGreaterThan(0);
  });

  it("tipsDeduction dispatches identically", () => {
    const facts = { tips: 30000, magi: 160000, filingStatus: "single" as const, occupationEligible: true, taxYear: 2025 };
    const viaBridge = compute({ worksheet: "tipsDeduction", facts });
    expect(viaBridge.result.value).toBe(tipsDeduction(facts).value); // 24,000
    expect(viaBridge.result.value).toBe(24000);
  });

  it("overtimeDeduction dispatches identically", () => {
    const facts = { overtimePremium: 25000, magi: 310000, filingStatus: "mfj" as const, taxYear: 2025 };
    const viaBridge = compute({ worksheet: "overtimeDeduction", facts });
    expect(viaBridge.result.value).toBe(overtimeDeduction(facts).value); // 24,000
    expect(viaBridge.result.value).toBe(24000);
  });

  it("seniorDeduction dispatches identically", () => {
    const facts = { age: 2, magi: 160000, filingStatus: "mfj" as const, taxYear: 2025 };
    const viaBridge = compute({ worksheet: "seniorDeduction", facts });
    expect(viaBridge.result.value).toBe(seniorDeduction(facts).value); // 11,400
    expect(viaBridge.result.value).toBe(11400);
  });

  it("malformed OBBBA proposals are rejected at the schema boundary", () => {
    // missing taxYear
    expect(ComputeRequest.safeParse({ worksheet: "saltCap", facts: { magi: 100000, filingStatus: "mfj" } }).success).toBe(false);
    // wrong filing status enum
    expect(ComputeRequest.safeParse({ worksheet: "seniorDeduction", facts: { age: 1, magi: 1, filingStatus: "qw", taxYear: 2025 } }).success).toBe(false);
    // a well-formed proposal passes
    expect(
      ComputeRequest.safeParse({ worksheet: "tipsDeduction", facts: { tips: 1000, magi: 50000, filingStatus: "single", occupationEligible: true, taxYear: 2025 } }).success,
    ).toBe(true);
  });
});

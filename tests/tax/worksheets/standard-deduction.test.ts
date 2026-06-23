import { describe, it, expect } from "vitest";
import { standardDeduction } from "../../../lib/tax/worksheets/standard-deduction";
import { getFigures } from "../../../lib/tax/figures";
import { worksheetResultSchema } from "../../../lib/tax/types";

// Expected values are DERIVED from the figures (read here from getFigures), never
// hardcoded as magic dollar amounts. The worksheet under test transcribes the IRS
// Form 1040 "Standard Deduction Chart"/"Worksheet for Dependents".
const fig = getFigures(2025, "federal");

describe("standard-deduction worksheet — base (non-dependent)", () => {
  it("MFJ, both under 65, not blind → base MFJ figure", () => {
    const r = standardDeduction({ filingStatus: "mfj" }, fig);
    expect(r.value).toBe(fig.standardDeduction.mfj.value);
  });

  it("single under 65, not blind → base single figure", () => {
    const r = standardDeduction({ filingStatus: "single" }, fig);
    expect(r.value).toBe(fig.standardDeduction.single.value);
  });

  it("HoH under 65 → base HoH figure", () => {
    const r = standardDeduction({ filingStatus: "hoh" }, fig);
    expect(r.value).toBe(fig.standardDeduction.hoh.value);
  });

  it("returns a schema-valid WorksheetResult with at least one citation", () => {
    const r = standardDeduction({ filingStatus: "single" }, fig);
    expect(worksheetResultSchema.safeParse(r).success).toBe(true);
    expect(r.citations.length).toBeGreaterThan(0);
  });

  it("emits an auditable trace line carrying the final value", () => {
    const r = standardDeduction({ filingStatus: "mfj" }, fig);
    const last = r.lines[r.lines.length - 1];
    expect(last.amount).toBe(r.value);
  });
});

describe("standard-deduction worksheet — age 65+/blind additional amounts", () => {
  it("single, one 65+ box → base + single/HoH additional amount", () => {
    const add = fig.additionalStandardDeduction.age65OrBlind.value;
    const r = standardDeduction({ filingStatus: "single", age65OrOlder: 1 }, fig);
    expect(r.value).toBe(fig.standardDeduction.single.value + add);
  });

  it("single, 65+ AND blind (two boxes) → base + 2× single/HoH additional amount", () => {
    const add = fig.additionalStandardDeduction.age65OrBlind.value;
    const r = standardDeduction({ filingStatus: "single", age65OrOlder: 1, blind: 1 }, fig);
    expect(r.value).toBe(fig.standardDeduction.single.value + 2 * add);
  });

  it("MFJ, both spouses 65+ AND both blind (four boxes) → base + 4× married additional amount", () => {
    const add = fig.additionalStandardDeduction.age65OrBlindMarried.value;
    const r = standardDeduction({ filingStatus: "mfj", age65OrOlder: 2, blind: 2 }, fig);
    expect(r.value).toBe(fig.standardDeduction.mfj.value + 4 * add);
  });

  it("married uses the married additional rate, not the single/HoH rate", () => {
    const single = fig.additionalStandardDeduction.age65OrBlind.value;
    const married = fig.additionalStandardDeduction.age65OrBlindMarried.value;
    const r = standardDeduction({ filingStatus: "mfj", age65OrOlder: 1 }, fig);
    expect(r.value).toBe(fig.standardDeduction.mfj.value + married);
    expect(r.value).not.toBe(fig.standardDeduction.mfj.value + single);
  });
});

describe("standard-deduction worksheet — dependent worksheet", () => {
  const floor = fig.dependentStandardDeduction.floor.value;
  const addOn = fig.dependentStandardDeduction.earnedIncomeAddOn.value;

  it("dependent with little/no earned income → the minimum floor", () => {
    const r = standardDeduction(
      { filingStatus: "single", canBeClaimedAsDependent: true, earnedIncome: 200 },
      fig,
    );
    // earned income + addOn (650) < floor (1350) → floor wins
    expect(r.value).toBe(floor);
  });

  it("dependent with mid earned income → earnedIncome + addOn", () => {
    const earnedIncome = 5000;
    const r = standardDeduction(
      { filingStatus: "single", canBeClaimedAsDependent: true, earnedIncome },
      fig,
    );
    // earnedIncome + addOn (5450) is > floor and < the regular single std deduction
    expect(r.value).toBe(earnedIncome + addOn);
  });

  it("dependent with high earned income → capped at the regular standard deduction", () => {
    const base = fig.standardDeduction.single.value;
    const earnedIncome = base + 100000; // way over the regular std deduction
    const r = standardDeduction(
      { filingStatus: "single", canBeClaimedAsDependent: true, earnedIncome },
      fig,
    );
    expect(r.value).toBe(base);
  });

  it("dependent who is also 65+ → dependent base + the additional amount", () => {
    const add = fig.additionalStandardDeduction.age65OrBlind.value;
    const r = standardDeduction(
      { filingStatus: "single", canBeClaimedAsDependent: true, earnedIncome: 200, age65OrOlder: 1 },
      fig,
    );
    expect(r.value).toBe(floor + add);
  });

  it("dependent with no earnedIncome provided → treats earned income as 0 → floor", () => {
    const r = standardDeduction(
      { filingStatus: "single", canBeClaimedAsDependent: true },
      fig,
    );
    expect(r.value).toBe(floor);
  });
});

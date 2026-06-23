import { describe, it, expect } from "vitest";
import { childTaxCredit } from "../../../lib/tax/worksheets/ctc";
import { getFigures } from "../../../lib/tax/figures";
import { worksheetResultSchema } from "../../../lib/tax/types";

// All expected values are DERIVED from the figures (read here from getFigures),
// never baked as magic dollar numbers. Transcribed from Schedule 8812.
const fig = getFigures(2025, "federal");
const perChild = fig.ctc.perChild.value; // 2200
const odc = fig.ctc.odcPerDependent.value; // 500
const refundableCap = fig.ctc.refundableCap.value; // 1700
const per1000 = fig.ctc.phaseoutPer1000.value; // 50
const floor = fig.ctc.earnedIncomeFloor.value; // 2500
const actcRate = fig.ctc.actcRate.value; // 0.15
const mfjThreshold = fig.ctc.phaseoutThreshold.mfj.value; // 400000
const singleThreshold = fig.ctc.phaseoutThreshold.single.value; // 200000

describe("childTaxCredit (Schedule 8812)", () => {
  it("returns a schema-valid WorksheetResult with non-empty citations", () => {
    const r = childTaxCredit(
      { qualifyingChildren: 2, otherDependents: 0, agi: 50000, filingStatus: "mfj", earnedIncome: 50000, taxLiabilityBeforeCredits: 6000 },
      fig,
    );
    expect(worksheetResultSchema.safeParse(r).success).toBe(true);
    expect(r.citations.length).toBeGreaterThan(0);
  });

  it("2 children, ample tax liability, under threshold → full non-refundable CTC, no ACTC", () => {
    // potential = 2 * perChild = 4400; tax liability 10000 fully absorbs it.
    const r = childTaxCredit(
      { qualifyingChildren: 2, otherDependents: 0, agi: 60000, filingStatus: "mfj", earnedIncome: 60000, taxLiabilityBeforeCredits: 10000 },
      fig,
    );
    expect(r.value).toBe(2 * perChild);
    const actc = r.lines.find((l) => l.line === "27")!;
    expect(actc.amount).toBe(0); // nothing left over to refund
  });

  it("low tax liability → non-refundable limited by tax, remainder flows to ACTC (capped)", () => {
    // 2 children: potential 4400. Tax liability only 1000 → non-refundable = 1000.
    // Remaining CTC = 3400. ACTC = min(refundableCap*children, actcRate*(earned-floor), remainingCTC).
    const earnedIncome = 30000;
    const r = childTaxCredit(
      { qualifyingChildren: 2, otherDependents: 0, agi: 30000, filingStatus: "single", earnedIncome, taxLiabilityBeforeCredits: 1000 },
      fig,
    );
    expect(r.value).toBe(1000);
    const potential = 2 * perChild;
    const remainingCtc = potential - 1000;
    const fifteenPct = actcRate * (earnedIncome - floor);
    const capByChildren = refundableCap * 2;
    const expectedActc = Math.min(capByChildren, fifteenPct, remainingCtc);
    const actc = r.lines.find((l) => l.line === "27")!;
    expect(actc.amount).toBe(expectedActc);
  });

  it("ACTC is capped at refundableCap per child when 15% earned-income method is larger", () => {
    // 1 child, zero tax, high earned income so 15% method exceeds the per-child cap.
    const earnedIncome = 80000; // 15% of (80000-2500)=11625 >> 1700 cap
    const r = childTaxCredit(
      { qualifyingChildren: 1, otherDependents: 0, agi: 80000, filingStatus: "single", earnedIncome, taxLiabilityBeforeCredits: 0 },
      fig,
    );
    expect(r.value).toBe(0);
    const actc = r.lines.find((l) => l.line === "27")!;
    expect(actc.amount).toBe(refundableCap * 1); // capped at 1700
  });

  it("ACTC limited by the 15% earned-income method when earned income is low", () => {
    // 2 children, zero tax, low earned income → 15% method binds below the per-child cap.
    const earnedIncome = 10000; // 15% of 7500 = 1125 < 2*1700
    const r = childTaxCredit(
      { qualifyingChildren: 2, otherDependents: 0, agi: 10000, filingStatus: "single", earnedIncome, taxLiabilityBeforeCredits: 0 },
      fig,
    );
    const expectedActc = actcRate * (earnedIncome - floor); // 1125
    const actc = r.lines.find((l) => l.line === "27")!;
    expect(actc.amount).toBe(expectedActc);
    expect(expectedActc).toBeLessThan(refundableCap * 2);
  });

  it("no ACTC when earned income is at or below the floor", () => {
    const r = childTaxCredit(
      { qualifyingChildren: 1, otherDependents: 0, agi: 2000, filingStatus: "single", earnedIncome: 2000, taxLiabilityBeforeCredits: 0 },
      fig,
    );
    const actc = r.lines.find((l) => l.line === "27")!;
    expect(actc.amount).toBe(0); // 15% of a negative is floored at 0
  });

  it("phases out $50 per $1,000 over the MFJ threshold (rounded up)", () => {
    // MFJ AGI exactly $30,000 over threshold → reduction = 50 * 30 = 1500.
    const over = 30000;
    const r = childTaxCredit(
      { qualifyingChildren: 3, otherDependents: 0, agi: mfjThreshold + over, filingStatus: "mfj", earnedIncome: mfjThreshold + over, taxLiabilityBeforeCredits: 50000 },
      fig,
    );
    const potential = 3 * perChild;
    const reduction = per1000 * (over / 1000);
    expect(r.value).toBe(potential - reduction);
  });

  it("rounds the excess UP to the next $1,000 before applying the $50 step", () => {
    // $1 over threshold still counts as one full $1,000 step → $50 reduction (Sch 8812 line 10).
    const r = childTaxCredit(
      { qualifyingChildren: 2, otherDependents: 0, agi: singleThreshold + 1, filingStatus: "single", earnedIncome: singleThreshold + 1, taxLiabilityBeforeCredits: 50000 },
      fig,
    );
    const potential = 2 * perChild;
    expect(r.value).toBe(potential - per1000); // one $1,000 step
  });

  it("includes the $500 ODC for other dependents in the potential credit", () => {
    // 1 qualifying child + 2 other dependents, under threshold, ample tax.
    const r = childTaxCredit(
      { qualifyingChildren: 1, otherDependents: 2, agi: 40000, filingStatus: "single", earnedIncome: 40000, taxLiabilityBeforeCredits: 10000 },
      fig,
    );
    expect(r.value).toBe(1 * perChild + 2 * odc);
  });

  it("ODC is non-refundable: it never flows into ACTC", () => {
    // Only other dependents (no qualifying children), zero tax → no refundable amount.
    const r = childTaxCredit(
      { qualifyingChildren: 0, otherDependents: 3, agi: 40000, filingStatus: "single", earnedIncome: 40000, taxLiabilityBeforeCredits: 0 },
      fig,
    );
    expect(r.value).toBe(0); // limited by zero tax
    const actc = r.lines.find((l) => l.line === "27")!;
    expect(actc.amount).toBe(0); // ODC is never refundable
  });

  it("phaseout can wipe out the entire credit", () => {
    // 1 child, AGI far above threshold → potential fully phased out to 0.
    const r = childTaxCredit(
      { qualifyingChildren: 1, otherDependents: 0, agi: singleThreshold + 1000000, filingStatus: "single", earnedIncome: 50000, taxLiabilityBeforeCredits: 50000 },
      fig,
    );
    expect(r.value).toBe(0);
    const actc = r.lines.find((l) => l.line === "27")!;
    expect(actc.amount).toBe(0);
  });
});

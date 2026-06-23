import { describe, it, expect } from "vitest";
import { getFigures } from "../../lib/tax/figures";
import { eitc } from "../../lib/tax/worksheets/eitc";
import { childTaxCredit } from "../../lib/tax/worksheets/ctc";
import { validateReturn } from "../../lib/tax/validators/mef";
import type { ReturnComputation, ValidationFacts } from "../../lib/tax/validators/mef";

const fig = getFigures(2025, "federal");

// ── Helpers: build a ReturnComputation by actually running the worksheets, so the
// validator is tested against real result shapes, and derive every dollar from getFigures. ──

const p1 = fig.eitc.byChildren[1];
const investmentLimit = fig.eitc.investmentIncomeLimit.value;

/** A clean, fully-eligible 1-child EITC + 2-child CTC computation that must produce no flags. */
function cleanComputation(): { computation: ReturnComputation; facts: ValidationFacts } {
  const earned = p1.earnedIncomeAmount.value;
  const eitcResult = eitc(
    { earnedIncome: earned, agi: earned, investmentIncome: 0, qualifyingChildren: 1, filingStatus: "single", taxpayerSsnValidForWork: true },
    fig,
  );
  // Tax liability large enough to fully absorb the non-refundable CTC.
  const ctcResult = childTaxCredit(
    { qualifyingChildren: 2, otherDependents: 0, agi: earned, filingStatus: "single", earnedIncome: earned, taxLiabilityBeforeCredits: 10000 },
    fig,
  );
  const computation: ReturnComputation = {
    taxYear: 2025,
    jurisdiction: "federal",
    taxBeforeCredits: 10000,
    nonRefundableCredits: { ctc: ctcResult.value, aotcNonRefundable: 0 },
    credits: { eitc: eitcResult, ctc: ctcResult },
    totals: {
      // 1040 total credits line = sum of the credit subtotals it claims to aggregate.
      totalCredits: eitcResult.value + ctcResult.value,
      reportedTotalCredits: eitcResult.value + ctcResult.value,
    },
  };
  const facts: ValidationFacts = {
    eitc: { investmentIncome: 0, taxpayerSsnValidForWork: true, qualifyingChildren: 1 },
    ctcChildren: [{ ssnValidForWork: true }, { ssnValidForWork: true }],
    aotcStudents: [],
  };
  return { computation, facts };
}

describe("validateReturn — MeF reject-style rules", () => {
  it("a clean, fully-eligible computation yields NO reject flags", () => {
    const { computation, facts } = cleanComputation();
    const flags = validateReturn(computation, facts);
    expect(flags.some((f) => f.severity === "reject")).toBe(false);
  });

  it("EITC investment income over the cap yields a reject flag WITH a citation", () => {
    const { computation, facts } = cleanComputation();
    facts.eitc!.investmentIncome = investmentLimit + 1;
    const flags = validateReturn(computation, facts);
    const reject = flags.find((f) => f.code === "EITC_INVESTMENT_INCOME");
    expect(reject).toBeDefined();
    expect(reject?.severity).toBe("reject");
    expect(reject?.citation).toBeDefined();
    expect(reject?.citation?.sourceUrl).toMatch(/\.gov/);
  });

  it("EITC investment income exactly AT the cap does NOT reject", () => {
    const { computation, facts } = cleanComputation();
    facts.eitc!.investmentIncome = investmentLimit;
    const flags = validateReturn(computation, facts);
    expect(flags.some((f) => f.code === "EITC_INVESTMENT_INCOME")).toBe(false);
  });

  it("a claimed EITC with no SSN valid for work yields a reject flag with a citation", () => {
    const { computation, facts } = cleanComputation();
    facts.eitc!.taxpayerSsnValidForWork = false;
    const flags = validateReturn(computation, facts);
    const reject = flags.find((f) => f.code === "EITC_SSN_INVALID");
    expect(reject?.severity).toBe("reject");
    expect(reject?.citation).toBeDefined();
  });

  it("a CTC child without an SSN valid for work yields a reject flag (IRC §24(h)(7))", () => {
    const { computation, facts } = cleanComputation();
    facts.ctcChildren = [{ ssnValidForWork: true }, { ssnValidForWork: false }];
    const flags = validateReturn(computation, facts);
    const reject = flags.find((f) => f.code === "CTC_CHILD_SSN_REQUIRED");
    expect(reject?.severity).toBe("reject");
    expect(reject?.citation).toBeDefined();
    expect(reject?.citation?.cite).toMatch(/24/);
  });

  it("a CTC claimed with no children at all is fine (no child-SSN rule fires)", () => {
    const { computation, facts } = cleanComputation();
    facts.ctcChildren = [];
    const flags = validateReturn(computation, facts);
    expect(flags.some((f) => f.code === "CTC_CHILD_SSN_REQUIRED")).toBe(false);
  });

  it("an AOTC student claimed for a 4th+ prior year yields a reject flag (4-year cap)", () => {
    const { computation, facts } = cleanComputation();
    facts.aotcStudents = [{ yearsAOTCClaimed: 4 }];
    const flags = validateReturn(computation, facts);
    const reject = flags.find((f) => f.code === "AOTC_YEARS_EXCEEDED");
    expect(reject?.severity).toBe("reject");
    expect(reject?.citation).toBeDefined();
  });

  it("an AOTC student with 3 prior years is allowed (boundary: 3 < 4)", () => {
    const { computation, facts } = cleanComputation();
    facts.aotcStudents = [{ yearsAOTCClaimed: 3 }];
    const flags = validateReturn(computation, facts);
    expect(flags.some((f) => f.code === "AOTC_YEARS_EXCEEDED")).toBe(false);
  });

  it("a credit claimant with an ITIN (not an SSN) yields a reject for SSN-required credits", () => {
    const { computation, facts } = cleanComputation();
    facts.eitc!.taxpayerSsnValidForWork = false; // ITIN holders never have a work-valid SSN
    const flags = validateReturn(computation, facts);
    expect(flags.some((f) => f.code === "EITC_SSN_INVALID" && f.severity === "reject")).toBe(true);
  });
});

describe("validateReturn — internal tie-outs", () => {
  it("non-refundable credits exceeding tax before credits yields a tie-out reject (IRC §26(a))", () => {
    const { computation, facts } = cleanComputation();
    // Force the non-refundable credits to exceed the tax they can offset.
    computation.taxBeforeCredits = 100;
    computation.nonRefundableCredits = { ctc: 5000, aotcNonRefundable: 0 };
    const flags = validateReturn(computation, facts);
    const reject = flags.find((f) => f.code === "NONREFUNDABLE_EXCEEDS_TAX");
    expect(reject?.severity).toBe("reject");
    expect(reject?.citation).toBeDefined();
  });

  it("non-refundable credits equal to tax before credits is fine (boundary)", () => {
    const { computation, facts } = cleanComputation();
    computation.taxBeforeCredits = 1000;
    computation.nonRefundableCredits = { ctc: 1000, aotcNonRefundable: 0 };
    const flags = validateReturn(computation, facts);
    expect(flags.some((f) => f.code === "NONREFUNDABLE_EXCEEDS_TAX")).toBe(false);
  });

  it("a 1040 total-credits line that does NOT match the sum of its schedule subtotals rejects", () => {
    const { computation, facts } = cleanComputation();
    // Corrupt the reported total so it no longer ties to the component sum.
    computation.totals!.reportedTotalCredits = computation.totals!.totalCredits + 1;
    const flags = validateReturn(computation, facts);
    const reject = flags.find((f) => f.code === "TOTAL_CREDITS_MISMATCH");
    expect(reject?.severity).toBe("reject");
    expect(reject?.citation).toBeDefined();
  });

  it("a 1040 total-credits line that matches the subtotal sum ties out cleanly", () => {
    const { computation, facts } = cleanComputation();
    const flags = validateReturn(computation, facts);
    expect(flags.some((f) => f.code === "TOTAL_CREDITS_MISMATCH")).toBe(false);
  });
});

describe("validateReturn — prior-year delta anomaly", () => {
  it("a large year-over-year swing in a tracked field flags a REVIEW anomaly (not a reject)", () => {
    const { computation, facts } = cleanComputation();
    facts.priorYear = {
      // EITC jumped from 0 last year to its current value -> anomalous swing.
      eitc: 0,
      agi: 1_000_000, // AGI fell off a cliff vs this year -> anomalous.
    };
    computation.priorYearDeltaInputs = {
      eitc: computation.credits.eitc?.value ?? 0,
      agi: 20000,
    };
    const flags = validateReturn(computation, facts);
    const anomaly = flags.find((f) => f.code === "PRIOR_YEAR_DELTA_ANOMALY");
    expect(anomaly).toBeDefined();
    expect(anomaly?.severity).toBe("review");
  });

  it("a small, in-line year-over-year change does NOT flag an anomaly", () => {
    const { computation, facts } = cleanComputation();
    facts.priorYear = { eitc: (computation.credits.eitc?.value ?? 0) * 0.98, agi: 19800 };
    computation.priorYearDeltaInputs = { eitc: computation.credits.eitc?.value ?? 0, agi: 20000 };
    const flags = validateReturn(computation, facts);
    expect(flags.some((f) => f.code === "PRIOR_YEAR_DELTA_ANOMALY")).toBe(false);
  });

  it("no prior-year data provided -> no anomaly flag at all (nothing to compare)", () => {
    const { computation, facts } = cleanComputation();
    delete facts.priorYear;
    const flags = validateReturn(computation, facts);
    expect(flags.some((f) => f.code === "PRIOR_YEAR_DELTA_ANOMALY")).toBe(false);
  });
});

describe("validateReturn — every reject flag is cited (no citation, no claim)", () => {
  it("all reject flags returned carry a resolvable citation", () => {
    const { computation, facts } = cleanComputation();
    // Trip several rules at once.
    facts.eitc!.investmentIncome = investmentLimit + 1;
    facts.ctcChildren = [{ ssnValidForWork: false }];
    facts.aotcStudents = [{ yearsAOTCClaimed: 5 }];
    computation.taxBeforeCredits = 0;
    computation.nonRefundableCredits = { ctc: 1, aotcNonRefundable: 0 };
    const flags = validateReturn(computation, facts);
    const rejects = flags.filter((f) => f.severity === "reject");
    expect(rejects.length).toBeGreaterThan(0);
    for (const r of rejects) {
      expect(r.citation).toBeDefined();
      expect(r.citation?.sourceUrl).toMatch(/^https?:\/\//);
    }
  });
});

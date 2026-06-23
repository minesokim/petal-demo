import { describe, it, expect } from "vitest";
import { MockProvider } from "../../lib/ai/provider";
import { compute, ComputeRequest } from "../../lib/tax-ai/compute";
import { answerComputation } from "../../lib/tax-ai/orchestrator";
import { eitc } from "../../lib/tax/worksheets/eitc";
import { getFigures } from "../../lib/tax/figures";

const fed = getFigures(2025, "federal");
const eitcFacts = {
  earnedIncome: 15000, agi: 15000, investmentIncome: 0,
  qualifyingChildren: 2, filingStatus: "single" as const, taxpayerSsnValidForWork: true,
};

describe("compute bridge — model proposes, lib/tax computes", () => {
  it("compute() dispatches to the deterministic worksheet (identical to calling it directly)", () => {
    const viaBridge = compute({ worksheet: "eitc", facts: eitcFacts }, 2025);
    expect(viaBridge.result.value).toBe(eitc(eitcFacts, fed).value);
    expect(viaBridge.worksheet).toBe("eitc");
    expect(viaBridge.result.citations.length).toBeGreaterThan(0);
  });

  it("answerComputation: the model only proposes inputs — the VALUE comes from lib/tax", async () => {
    // The "model" proposes the worksheet + inputs. There is NO value field it could spoof.
    const provider = new MockProvider(() => ({ worksheet: "eitc", facts: eitcFacts }));
    const ans = await answerComputation(provider, "What's their EITC?", eitcFacts);
    expect(ans.value).toBe(eitc(eitcFacts, fed).value); // authoritative number is deterministic
    expect(ans.tier).toBe("high");
    expect(ans.citations.length).toBeGreaterThan(0);
  });

  it("a reject rule (EITC investment income over the limit) → $0 determination in reviewNotes", async () => {
    const facts = { ...eitcFacts, investmentIncome: 999_999 };
    const provider = new MockProvider(() => ({ worksheet: "eitc", facts }));
    const ans = await answerComputation(provider, "EITC?", facts);
    expect(ans.value).toBe(0);
    expect(ans.reviewNotes.some((n) => /investment income/i.test(n))).toBe(true);
  });

  it("a malformed proposal is rejected at the schema boundary (no silent bad compute)", () => {
    expect(ComputeRequest.safeParse({ worksheet: "eitc", facts: { earnedIncome: 1 } }).success).toBe(false);
    expect(ComputeRequest.safeParse({ worksheet: "not-a-worksheet", facts: {} }).success).toBe(false);
    expect(ComputeRequest.safeParse({ worksheet: "eitc", facts: eitcFacts }).success).toBe(true);
  });

  it("a malformed model proposal makes the provider boundary throw (schema-validated)", async () => {
    const provider = new MockProvider(() => ({ worksheet: "eitc", facts: { earnedIncome: 1 } }));
    await expect(answerComputation(provider, "EITC?", eitcFacts)).rejects.toThrow();
  });
});

describe("L4 adversarial judge — fidelity drives the tier", () => {
  it("an unfaithful proposal drops the tier to low + surfaces the issues", async () => {
    const provider = new MockProvider(() => ({ worksheet: "eitc", facts: eitcFacts }));
    // a DIFFERENT model judges; here it finds a fact-mapping mismatch.
    const judge = new MockProvider(() => ({ faithful: false, citationsOnPoint: true, issues: ["Proposed filing status does not match the facts"] }));
    const ans = await answerComputation(provider, "EITC?", eitcFacts, { judge });
    expect(ans.tier).toBe("low");
    expect(ans.verdict?.faithful).toBe(false);
    expect(ans.reviewNotes.some((n) => /filing status/i.test(n))).toBe(true);
    // the value is STILL the deterministic figure — the judge polices fidelity, not the math.
    expect(ans.value).toBe(eitc(eitcFacts, fed).value);
  });

  it("a faithful proposal with on-point citations keeps the high tier", async () => {
    const provider = new MockProvider(() => ({ worksheet: "eitc", facts: eitcFacts }));
    const judge = new MockProvider(() => ({ faithful: true, citationsOnPoint: true, issues: [] }));
    const ans = await answerComputation(provider, "EITC?", eitcFacts, { judge });
    expect(ans.tier).toBe("high");
    expect(ans.verdict?.faithful).toBe(true);
  });
});

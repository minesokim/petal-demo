import { describe, it, expect } from "vitest";
import { ReasoningOutput, VerifierOutput, FaithfulnessOutput, DocClassification } from "../../lib/ai/schema";

describe("AI structured-output contract (slice ④)", () => {
  it("parses a grounded position with citations + derived signals", () => {
    const out = ReasoningOutput.parse({
      positions: [{
        claim: "The QBI deduction is limited to 20% of qualified business income.",
        citations: [{ chunkId: "irc-199a-b-2", citation: "IRC §199A(b)(2)", taxYear: 2026 }],
        computedValueRefs: ["calc-qbi-1"],
        confidenceSignals: { retrieval: "on_point", computation: "validated", agreement: "high", edgeCase: false },
        reviewNotes: { verify: ["Confirm the W-2 wage base"], factAssumptions: ["Single trade or business"], disclosureFlag: false },
        tier: "high",
      }],
    });
    expect(out.positions[0].citations[0].taxYear).toBe(2026);
    expect(out.abstained).toBe(false); // default applied
  });

  it("supports an abstention (no on-point authority)", () => {
    const out = ReasoningOutput.parse({ positions: [], abstained: true });
    expect(out.abstained).toBe(true);
  });

  it("rejects an invalid confidence signal (contract is strict)", () => {
    expect(() => ReasoningOutput.parse({
      positions: [{
        claim: "x", citations: [], computedValueRefs: [],
        confidenceSignals: { retrieval: "maybe", computation: "validated", agreement: "high", edgeCase: false },
        reviewNotes: { verify: [], factAssumptions: [], disclosureFlag: false },
      }],
    })).toThrow();
  });

  it("verifier is strict binary; faithfulness is 0..1; classifier types a known doc", () => {
    expect(VerifierOutput.parse({ overall: "FAIL", checks: [{ name: "citation", verdict: "FAIL", reason: "missing" }], blockingFailures: ["citation"] }).overall).toBe("FAIL");
    expect(FaithfulnessOutput.parse({ claims: [{ claim: "c", label: "SUPPORTED", chunkId: "x" }], faithfulnessScore: 1 }).faithfulnessScore).toBe(1);
    expect(DocClassification.parse({ docType: "W-2", taxYear: 2026, taxpayerName: "A", fields: { box1: "58000" }, confidence: "high", unreadableFields: [] }).docType).toBe("W-2");
  });
});

import { describe, it, expect } from "vitest";
import { deriveTier } from "../../lib/ai/tier";
import { checkFaithfulness } from "../../lib/ai/faithfulness";
import { reasonAndScore } from "../../lib/ai/reasoning";
import { MockProvider } from "../../lib/ai/provider";
import { retrieve } from "../../lib/ai/authority";
import type { ConfidenceSignals } from "../../lib/ai/schema";

const base: ConfidenceSignals = { retrieval: "on_point", computation: "validated", agreement: "high", edgeCase: false };

describe("④ deriveTier — confidence is derived, not declared", () => {
  it("abstains on any hard failure", () => {
    expect(deriveTier({ signals: base, faithfulnessScore: 1, verifierPass: false })).toBe("abstain");
    expect(deriveTier({ signals: { ...base, retrieval: "none" }, faithfulnessScore: 1, verifierPass: true })).toBe("abstain");
    expect(deriveTier({ signals: base, faithfulnessScore: 0.3, verifierPass: true })).toBe("abstain");
  });

  it("caps at low on computation disagreement or weak retrieval", () => {
    expect(deriveTier({ signals: { ...base, computation: "disagreed" }, faithfulnessScore: 1, verifierPass: true })).toBe("low");
    expect(deriveTier({ signals: { ...base, retrieval: "weak" }, faithfulnessScore: 1, verifierPass: true })).toBe("low");
  });

  it("medium on edge case or low agreement", () => {
    expect(deriveTier({ signals: { ...base, edgeCase: true }, faithfulnessScore: 1, verifierPass: true })).toBe("medium");
    expect(deriveTier({ signals: { ...base, agreement: "low" }, faithfulnessScore: 1, verifierPass: true })).toBe("medium");
  });

  it("high only with on-point authority + strong grounding", () => {
    expect(deriveTier({ signals: base, faithfulnessScore: 0.9, verifierPass: true })).toBe("high");
    expect(deriveTier({ signals: base, faithfulnessScore: 0.6, verifierPass: true })).toBe("medium"); // grounded but not strongly
  });
});

describe("④ checkFaithfulness — grounding via the provider seam", () => {
  it("returns a validated faithfulness result", async () => {
    const chunks = retrieve("dependent standard deduction");
    const provider = new MockProvider(() => ({
      claims: [{ claim: "Dependent standard deduction is limited.", label: "SUPPORTED", chunkId: "irc-63-c-5" }],
      faithfulnessScore: 1,
    }));
    const out = await checkFaithfulness(provider, "A dependent's standard deduction is limited.", chunks);
    expect(out.faithfulnessScore).toBe(1);
    expect(out.claims[0].label).toBe("SUPPORTED");
  });
});

describe("④ reasonAndScore — full pipeline stamps a DERIVED tier", () => {
  it("a grounded, faithful position resolves to tier=high", async () => {
    const chunks = retrieve("dependent standard deduction");
    // one mock, branched by system prompt: faithfulness (GROUNDED) vs reasoning
    const provider = new MockProvider(({ system }) =>
      system.includes("GROUNDED")
        ? { claims: [{ claim: "limited", label: "SUPPORTED", chunkId: "irc-63-c-5" }], faithfulnessScore: 1 }
        : {
            positions: [{
              claim: "A dependent's standard deduction is limited under §63(c)(5).",
              citations: [{ chunkId: "irc-63-c-5", citation: "IRC §63(c)(5)", taxYear: 2025 }],
              computedValueRefs: [],
              confidenceSignals: { retrieval: "on_point", computation: "na", agreement: "high", edgeCase: false },
              reviewNotes: { verify: [], factAssumptions: [], disclosureFlag: false },
            }],
            abstained: false,
          },
    );
    const out = await reasonAndScore(provider, "dependent standard deduction", chunks);
    expect(out.positions).toHaveLength(1);
    expect(out.positions[0].tier).toBe("high"); // derived in code, not declared
  });
});

import { describe, it, expect } from "vitest";
import { Position, FaithfulnessOutput } from "@/lib/ai/schema";

// The reasoning + faithfulness models occasionally drift in shape (a bare-array reviewNotes; an omitted
// faithfulnessScore). These used to fail Zod validation → a retry, then a SPURIOUS abstention/service
// error on a question the engine actually answered. The schemas now self-heal. (Two real failures
// observed in the Blue J benchmark run.)

const SIGNALS = { retrieval: "on_point", computation: "na", agreement: "high", edgeCase: false } as const;

describe("schema self-healing — model shape-drift no longer fails the run", () => {
  it("Position.reviewNotes coerces a bare array of strings into the object shape", () => {
    const p = Position.parse({
      claim: "The 2026 SALT cap is $40,000.",
      citations: [],
      computedValueRefs: [],
      confidenceSignals: SIGNALS,
      reviewNotes: ["confirm MFJ", "check the phase-down threshold"],
    });
    expect(p.reviewNotes.verify).toEqual(["confirm MFJ", "check the phase-down threshold"]);
    expect(p.reviewNotes.factAssumptions).toEqual([]);
    expect(p.reviewNotes.disclosureFlag).toBe(false);
  });

  it("Position.reviewNotes still accepts the proper object shape unchanged", () => {
    const p = Position.parse({
      claim: "x",
      citations: [],
      computedValueRefs: [],
      confidenceSignals: SIGNALS,
      reviewNotes: { verify: ["a"], factAssumptions: ["b"], disclosureFlag: true },
    });
    expect(p.reviewNotes).toEqual({ verify: ["a"], factAssumptions: ["b"], disclosureFlag: true });
  });

  it("FaithfulnessOutput derives the score from claim labels when the model omits it", () => {
    const f = FaithfulnessOutput.parse({
      claims: [
        { claim: "a", label: "SUPPORTED", chunkId: "c1" },
        { claim: "b", label: "UNSUPPORTED", chunkId: null },
      ],
    });
    expect(f.faithfulnessScore).toBe(0.5);
  });

  it("FaithfulnessOutput keeps an explicit score untouched", () => {
    const f = FaithfulnessOutput.parse({ faithfulnessScore: 0.9, claims: [] });
    expect(f.faithfulnessScore).toBe(0.9);
  });
});

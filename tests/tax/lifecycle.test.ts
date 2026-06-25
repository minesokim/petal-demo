import { describe, it, expect } from "vitest";
import { retrieveLifecycle } from "@/lib/tax/authority/store";

describe("retrieveLifecycle — point-in-time fallback for EXPLICITLY-sunset provisions", () => {
  it("answers an expired-sunset query (OBBBA tips deduction for 2029; sunsetAfter 2028)", () => {
    const hit = retrieveLifecycle(
      "Will the federal no tax on tips deduction still be available in 2029?",
      { taxYear: 2029, jurisdiction: "federal" },
    );
    expect(hit).not.toBeNull();
    expect(hit!.boundaryYear).toBe(2028);
    expect(hit!.firstYear).toBe(2025);
    expect(hit!.chunk.citation).toMatch(/70201|224/);
  });

  it("does NOT fire for a year the sunset provision still governs (2026 ≤ 2028)", () => {
    expect(retrieveLifecycle("no tax on tips deduction", { taxYear: 2026, jurisdiction: "federal" })).toBeNull();
  });

  it("does NOT fire for a PERMANENT provision under-loaded in the corpus (the std-deduction regression)", () => {
    // The standard deduction (§63) carries no sunsetAfter — its chunk only LISTS 2024/2025, but it did
    // not expire. A 2028 query must NOT get a false "expired after 2025" answer; it stays a coverage gap.
    expect(retrieveLifecycle("what is the standard deduction", { taxYear: 2028, jurisdiction: "federal" })).toBeNull();
  });

  it("returns null on a weak/irrelevant match (confidence-gated — an honest abstain stays an abstain)", () => {
    expect(retrieveLifecycle("what is the meaning of life", { taxYear: 2029, jurisdiction: "federal" })).toBeNull();
  });
});

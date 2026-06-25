import { describe, it, expect } from "vitest";
import { retrieveLifecycle } from "@/lib/tax/authority/store";

describe("retrieveLifecycle — point-in-time fallback for expired / not-yet-effective provisions", () => {
  it("answers an EXPIRED-provision query (OBBBA tips deduction for 2029, sunset after 2028)", () => {
    const hit = retrieveLifecycle(
      "Will the federal no tax on tips deduction still be available in 2029?",
      { taxYear: 2029, jurisdiction: "federal" },
    );
    expect(hit).not.toBeNull();
    expect(hit!.relation).toBe("expired");
    expect(hit!.boundaryYear).toBe(2028);
    expect(hit!.firstYear).toBe(2025);
    expect(hit!.chunk.citation).toMatch(/70201|224/);
  });

  it("returns null when the provision DOES govern the asked year (no spurious lifecycle answer)", () => {
    // The tips deduction governs 2026 → the normal year-filtered path handles it; lifecycle must not fire.
    expect(retrieveLifecycle("no tax on tips deduction", { taxYear: 2026, jurisdiction: "federal" })).toBeNull();
  });

  it("returns null on a weak/irrelevant match (confidence-gated — an honest abstain stays an abstain)", () => {
    expect(retrieveLifecycle("what is the meaning of life", { taxYear: 2029, jurisdiction: "federal" })).toBeNull();
  });
});

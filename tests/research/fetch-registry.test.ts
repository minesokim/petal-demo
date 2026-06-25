import { describe, it, expect } from "vitest";
import { pickSources } from "@/lib/research/fetch/registry";

// Routing only (pure, no network): the right primary source for the question shape, authority-first.
describe("fetch-source registry routing", () => {
  it("routes a statute/section question to GovInfo", () => {
    const ids = pickSources("what does IRC section 4475 say about the remittance transfer tax").map((s) => s.id);
    expect(ids).toContain("govinfo");
    expect(ids[0]).toBe("govinfo"); // statute is the top axis
  });

  it("routes a case-law question to the Tax Court", () => {
    const ids = pickSources("did the Tax Court hold for the petitioner in that memo opinion").map((s) => s.id);
    expect(ids).toContain("tax-court");
  });

  it("when both fit, statute (GovInfo) ranks before the case source", () => {
    const ids = pickSources("which Code section did the Tax Court opinion rely on").map((s) => s.id);
    expect(ids).toEqual(["govinfo", "tax-court"]);
  });

  it("returns nothing when no source fits (→ honest abstain, no fetch)", () => {
    expect(pickSources("what color should the dashboard header be")).toEqual([]);
  });
});

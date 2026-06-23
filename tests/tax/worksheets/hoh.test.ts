import { describe, it, expect } from "vitest";
import { headOfHousehold } from "../../../lib/tax/worksheets/hoh";
import type { Flag } from "../../../lib/tax/types";

// §2(b) Head-of-Household qualification — the §6695(g) due-diligence determination.
// Three statutory prongs (IRC §2(b)(1)): (i) unmarried/considered-unmarried at year-end,
// (ii) furnished over half the cost of maintaining the household, (iii) a qualifying
// person had that household as their principal place of abode. All three must hold.

const ALL_TRUE = {
  unmarriedOrConsideredUnmarried: true,
  paidMoreThanHalfHomeCost: true,
  qualifyingPerson: true,
};

const codes = (flags: Flag[]) => flags.map((f) => f.code);

describe("headOfHousehold — §2(b) qualification (§6695(g) due diligence)", () => {
  it("qualifies when all three §2(b) prongs are satisfied, with no failure flags", () => {
    const r = headOfHousehold(ALL_TRUE);
    expect(r.qualifies).toBe(true);
    // No prong failed → no failure flags (an info 'qualifies' flag is allowed).
    expect(codes(r.flags)).not.toContain("HOH_NOT_UNMARRIED");
    expect(codes(r.flags)).not.toContain("HOH_NOT_HALF_COST");
    expect(codes(r.flags)).not.toContain("HOH_NO_QUALIFYING_PERSON");
  });

  it("does NOT qualify when the marital prong fails, and names that prong in an info flag", () => {
    const r = headOfHousehold({ ...ALL_TRUE, unmarriedOrConsideredUnmarried: false });
    expect(r.qualifies).toBe(false);
    expect(codes(r.flags)).toContain("HOH_NOT_UNMARRIED");
    const flag = r.flags.find((f) => f.code === "HOH_NOT_UNMARRIED")!;
    expect(flag.severity).toBe("info");
    // No-citation-no-claim: a flag that asserts a legal conclusion carries the §2(b) cite.
    expect(flag.citation?.cite).toMatch(/§\s?2\(b\)/);
    expect(flag.citation?.sourceUrl).toMatch(/\.gov/);
  });

  it("does NOT qualify when the half-cost-of-home prong fails", () => {
    const r = headOfHousehold({ ...ALL_TRUE, paidMoreThanHalfHomeCost: false });
    expect(r.qualifies).toBe(false);
    expect(codes(r.flags)).toContain("HOH_NOT_HALF_COST");
  });

  it("does NOT qualify when there is no qualifying person", () => {
    const r = headOfHousehold({ ...ALL_TRUE, qualifyingPerson: false });
    expect(r.qualifies).toBe(false);
    expect(codes(r.flags)).toContain("HOH_NO_QUALIFYING_PERSON");
  });

  it("names every failed prong when more than one fails", () => {
    const r = headOfHousehold({
      unmarriedOrConsideredUnmarried: false,
      paidMoreThanHalfHomeCost: false,
      qualifyingPerson: false,
    });
    expect(r.qualifies).toBe(false);
    expect(codes(r.flags)).toEqual(
      expect.arrayContaining(["HOH_NOT_UNMARRIED", "HOH_NOT_HALF_COST", "HOH_NO_QUALIFYING_PERSON"]),
    );
  });

  it("every emitted flag carries a resolvable §2(b) citation (no citation, no claim)", () => {
    const r = headOfHousehold({
      unmarriedOrConsideredUnmarried: false,
      paidMoreThanHalfHomeCost: false,
      qualifyingPerson: false,
    });
    for (const f of r.flags) {
      expect(f.citation).toBeDefined();
      expect(f.citation!.sourceUrl).toMatch(/\.gov/);
    }
  });
});

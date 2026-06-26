import { describe, it, expect } from "vitest";
import { fetchPrimary } from "@/lib/research/fetch/fetch-primary";
import type { FetchSource } from "@/lib/research/fetch/registry";

// A fetched source must carry its real authority KIND into the chunk so the §6662 weighting applies the
// right rule: a "case" gets the contrary-controlling-in-circuit-holding invariant + court level; a
// "regulation" gets the delegation factor; "irs_guidance" weighs below. The old default mislabeled
// everything "statute", silently overweighting regs, cases, and PLRs.

const GROUNDABLE =
  "This is the operative rule text, long enough to ground a position in for the test, padded well past the eighty character minimum the bridge requires.";

const mockSource = (id: string, precedential?: boolean): FetchSource => ({
  id,
  label: id,
  matches: () => true,
  search: async () => [
    { source: id, title: "X", citation: `cite-${id}`, sourceUrl: "u", authorityTier: 3, precedential, getText: async () => GROUNDABLE },
  ],
});

// No provider → fetchPrimary returns the RAW mapped chunks (skips the model distill), so this is a pure
// unit test of the source→authorityType mapping.
async function kind(id: string, precedential?: boolean) {
  const out = await fetchPrimary("q", 2025, "federal", { sources: [mockSource(id, precedential)] });
  return out[0];
}

describe("fetch-primary — authority KIND mapping (feeds the §6662 weighting)", () => {
  it("tags court sources 'case' and carries the precedential flag", async () => {
    expect((await kind("courtlistener", false)).authorityType).toBe("case");
    expect((await kind("cap-caselaw", false)).precedential).toBe(false);
    expect((await kind("tax-court", true)).authorityType).toBe("case");
  });

  it("tags regulations, IRS guidance, statute/treaty correctly", async () => {
    expect((await kind("ecfr")).authorityType).toBe("regulation");
    expect((await kind("federal-register")).authorityType).toBe("regulation");
    expect((await kind("irs-wd", false)).authorityType).toBe("irs_guidance");
    expect((await kind("irs-drop")).authorityType).toBe("irs_guidance");
    expect((await kind("treaty")).authorityType).toBe("statute");
    expect((await kind("congress-gov")).authorityType).toBe("statute");
  });
});

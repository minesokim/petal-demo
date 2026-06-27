import { describe, it, expect } from "vitest";
import { findContraAuthorities } from "@/lib/research/contra-finder";
import { assessAuthorityWeight } from "@/lib/research/authority-assess";
import { MockProvider } from "@/lib/ai/provider";
import type { AuthorityChunk, AuthorityType } from "@/lib/tax/authority/store";

const chunk = (id: string, kw: string, authorityType: AuthorityType = "statute"): AuthorityChunk => ({
  chunkId: id, authorityType, citation: id, jurisdiction: "federal", taxYear: [2025],
  effectiveDate: "2025-01-01", sourceUrl: "https://example.gov", ingestedAt: "2025-01-01",
  text: `rule about ${kw}`, keywords: [kw],
});

const support = [chunk("SUP", "widget")];
const corpus = [chunk("SUP", "widget"), chunk("CON", "widget")]; // both retrievable for a "widget" query

describe("contra-authority finder", () => {
  it("runs a real search and classifies a candidate as contrary (searched=true)", async () => {
    const provider = new MockProvider(() => ({ contraChunkIds: ["CON"] }));
    const r = await findContraAuthorities(provider, "the widget question", "widgets are deductible", support, { taxYear: 2025, jurisdiction: "federal", corpus });
    expect(r.searched).toBe(true);
    expect(r.contra.map((c) => c.chunkId)).toEqual(["CON"]);
  });

  it("an EMPTY candidate pool returns searched=FALSE — don't lift the §6662 cap on corpus-emptiness (and no model call)", async () => {
    const provider = new MockProvider(() => { throw new Error("model must not be called when there are no candidates"); });
    const r = await findContraAuthorities(provider, "zzz unrelated query", "x", support, { taxYear: 2025, jurisdiction: "federal", corpus: support });
    // No candidate to weigh ⇒ not a real for-vs-against weighing ⇒ the MLTN cap must NOT lift (honest).
    expect(r.searched).toBe(false);
    expect(r.contra).toEqual([]);
  });

  it("a FAILED search returns searched=false — an outage is NEVER laundered into 'searched, no contra'", async () => {
    const provider = new MockProvider(() => { throw new Error("model down"); });
    const r = await findContraAuthorities(provider, "the widget question", "x", support, { taxYear: 2025, jurisdiction: "federal", corpus });
    expect(r.searched).toBe(false);
    expect(r.contra).toEqual([]);
  });

  it("contraSearched honestly lifts the §6662 cap: strong support + a real search + no contra → MLTN", () => {
    const strong = [chunk("S1", "x"), chunk("S2", "x")]; // two statutes supporting, none against
    expect(assessAuthorityWeight(strong, [], { contraSearched: false }).standard).toBe("substantial-authority"); // capped without a search
    expect(assessAuthorityWeight(strong, [], { contraSearched: true }).standard).toBe("more-likely-than-not"); // lifted after a real search
  });
});

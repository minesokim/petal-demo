import { describe, it, expect } from "vitest";
import { assessAuthorityWeight } from "@/lib/research/authority-assess";
import type { AuthorityChunk } from "@/lib/tax/authority/store";

function chunk(p: Partial<AuthorityChunk>): AuthorityChunk {
  return {
    chunkId: p.chunkId ?? "c1",
    authorityType: p.authorityType ?? "statute",
    citation: p.citation ?? "IRC §1",
    jurisdiction: "federal",
    taxYear: [2025],
    effectiveDate: "2025-01-01",
    sourceUrl: "https://example.gov",
    ingestedAt: "2025-01-01T00:00:00Z",
    text: "authority text",
    keywords: [],
    ...p,
  };
}

describe("assessAuthorityWeight (the live §6662 consumer)", () => {
  it("CAPS at substantial-authority — never more-likely-than-not — when no contra search was run", () => {
    const a = assessAuthorityWeight([
      chunk({ authorityType: "statute" }),
      chunk({ chunkId: "c2", authorityType: "regulation", delegationBasis: "express" }),
    ]);
    expect(a.standard).toBe("substantial-authority"); // uncapped this would be MLTN (no contra)
    expect(a.disclosureRecommended).toBe(false);
    expect(a.scopeNote).toMatch(/capped/i);
  });

  it("fires Form 8275 disclosure when support is ONLY non-precedential (INVARIANT 2)", () => {
    const a = assessAuthorityWeight([
      chunk({ authorityType: "irs_guidance", precedential: false, citation: "PLR 202501001" }),
    ]);
    expect(a.standard).toBe("reasonable-basis");
    expect(a.disclosureRecommended).toBe(true);
  });

  it("drops the standard + flags controllingContra when a contrary controlling in-circuit holding is found", () => {
    const support = [chunk({ authorityType: "regulation", delegationBasis: "general_7805" })];
    const contra = [chunk({ chunkId: "k", authorityType: "case", courtLevel: "circuit", circuit: "9", precedential: true, citation: "X v. Comm'r (9th Cir.)" })];
    const a = assessAuthorityWeight(support, contra, { circuit: "9", contraSearched: true });
    expect(a.controllingContra).toBe(true);
    expect(["reasonable-basis", "no-substantial-authority"]).toContain(a.standard);
    expect(a.disclosureRecommended).toBe(true);
  });

  it("a real contra search that found support-only CAN reach MLTN (cap lifts when contraSearched)", () => {
    const a = assessAuthorityWeight([chunk({ authorityType: "statute" })], [], { contraSearched: true });
    expect(a.standard).toBe("more-likely-than-not");
    expect(a.scopeNote).not.toMatch(/capped/i);
  });
});

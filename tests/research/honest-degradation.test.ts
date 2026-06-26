import { describe, it, expect } from "vitest";
import { researchAnswer } from "@/lib/research/engine";
import { MockProvider } from "@/lib/ai/provider";

// HONEST DEGRADATION (spec: no silent fallbacks). When the authority graph is requested but unavailable,
// the engine falls back to the in-memory corpus — and must SURFACE that the answer is degraded, never
// hide it. We force the graph to be unavailable by unsetting DATABASE_URL (graphRetrieve throws on it),
// then assert the degraded note rides on the answer.

describe("research engine — honest degradation on graph fallback", () => {
  it("surfaces a degraded note when the authority graph is unavailable", async () => {
    const saved = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL; // graphRetrieve's db() throws → fallback to in-memory corpus
    try {
      const provider = new MockProvider(() => ({})); // a nonsense question coverage-gaps; the model is never called
      const r = await researchAnswer(provider, undefined, "what is the zorblax credit for tax year 2099", {
        taxYear: 2099, jurisdiction: "federal", useGraph: true,
      });
      expect(r.bucket).toBe("coverage_gap"); // nothing on-point in the corpus
      expect(r.reviewNotes.some((n) => /degraded retrieval/i.test(n))).toBe(true); // and it SAYS so
    } finally {
      if (saved !== undefined) process.env.DATABASE_URL = saved;
    }
  });

  it("does NOT add a degraded note when the graph is not requested (in-memory is the chosen path, not a fallback)", async () => {
    const provider = new MockProvider(() => ({}));
    const r = await researchAnswer(provider, undefined, "what is the zorblax credit for tax year 2099", {
      taxYear: 2099, jurisdiction: "federal", useGraph: false,
    });
    expect(r.reviewNotes.some((n) => /degraded retrieval/i.test(n))).toBe(false);
  });
});

import { describe, it, expect } from "vitest";
import { fetchPrimary } from "@/lib/research/fetch/fetch-primary";
import type { FetchSource } from "@/lib/research/fetch/registry";

const stubSource = (
  id: string,
  text: string,
  o: { throwSearch?: boolean; throwText?: boolean } = {},
): FetchSource => ({
  id,
  label: id,
  matches: () => true,
  search: async () => {
    if (o.throwSearch) throw new Error("search failed");
    return [
      {
        source: id,
        title: `${id} hit`,
        citation: `${id} cite`,
        sourceUrl: "https://example.gov/doc",
        authorityTier: 1,
        getText: async () => {
          if (o.throwText) throw new Error("getText failed");
          return text;
        },
      },
    ];
  },
});

const LONG = "Section 4475 imposes a 1 percent excise tax on remittance transfers for transfers made after December 31, 2025.";

describe("fetchPrimary — wrap live primary authority as chunks (honest degradation)", () => {
  it("wraps a fetched hit's text as a year/jurisdiction-tagged AuthorityChunk", async () => {
    const chunks = await fetchPrimary("remittance tax", 2026, "federal", {
      sources: [stubSource("govinfo", LONG)],
      nowIso: "2026-06-24T00:00:00Z",
    });
    expect(chunks).toHaveLength(1);
    expect(chunks[0].text).toContain("1 percent");
    expect(chunks[0].taxYear).toEqual([2026]);
    expect(chunks[0].authorityType).toBe("statute");
    expect(chunks[0].sourceUrl).toMatch(/^https/);
  });

  it("returns [] when no source fits → the engine abstains honestly", async () => {
    expect(await fetchPrimary("q", 2026, "federal", { sources: [] })).toEqual([]);
  });

  it("skips a hit whose getText fails (degrades honestly, never throws out)", async () => {
    const chunks = await fetchPrimary("q", 2026, "federal", { sources: [stubSource("tax-court", LONG, { throwText: true })] });
    expect(chunks).toEqual([]);
  });

  it("swallows a source whose search throws", async () => {
    const chunks = await fetchPrimary("q", 2026, "federal", { sources: [stubSource("govinfo", LONG, { throwSearch: true })] });
    expect(chunks).toEqual([]);
  });

  it("drops text too thin to ground in (< 80 chars)", async () => {
    const chunks = await fetchPrimary("q", 2026, "federal", { sources: [stubSource("govinfo", "short")] });
    expect(chunks).toEqual([]);
  });
});

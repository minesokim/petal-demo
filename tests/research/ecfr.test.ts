// eCFR fetch client (tests/research/ecfr.test.ts) — keyless Treasury-reg source. Shape verified
// against the live search API (2026-06-24): results carry hierarchy.section, hierarchy_headings,
// full_text_excerpt (with <strong> highlights), and reserved/removed flags.

import { describe, it, expect } from "vitest";
import { searchEcfr, hasReservedSection, type EcfrSection } from "../../lib/research/fetch/ecfr";

const RESULTS = {
  results: [
    {
      hierarchy: { part: "1", section: "1.199A-3" },
      hierarchy_headings: { section: "§ 1.199A-3" },
      full_text_excerpt: "determination of a trade or <strong>business's</strong> qualified income",
      reserved: false,
      removed: false,
    },
    {
      hierarchy: { part: "1", section: "1.128-1" },
      hierarchy_headings: { section: "§ 1.128-1" },
      full_text_excerpt: "[Reserved]",
      reserved: true,
      removed: false,
    },
  ],
};

function mockFetch(payload: unknown, ok = true, status = 200): typeof fetch {
  return (async () => ({ ok, status, json: async () => payload })) as unknown as typeof fetch;
}

const sec = (reserved: boolean): EcfrSection => ({ section: "x", heading: "", excerpt: "", reserved, removed: false, sourceUrl: "" });

describe("eCFR fetch client (Treasury regs)", () => {
  it("normalizes sections, strips highlight tags, builds a resolvable cite URL", async () => {
    const out = await searchEcfr("qualified business income", { fetchImpl: mockFetch(RESULTS) });
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ section: "1.199A-3", heading: "§ 1.199A-3", reserved: false });
    expect(out[0].excerpt).toBe("determination of a trade or business's qualified income"); // <strong> stripped
    expect(out[0].sourceUrl).toBe("https://www.ecfr.gov/current/title-26/section-1.199A-3");
  });

  it("surfaces the RESERVED flag (the open-regulatory-gap / unsettled signal)", async () => {
    const out = await searchEcfr("section 128", { fetchImpl: mockFetch(RESULTS) });
    expect(out[1].reserved).toBe(true);
    expect(hasReservedSection(out)).toBe(true);
    expect(hasReservedSection([sec(false)])).toBe(false);
  });

  it("throws on a non-OK response (honest degradation)", async () => {
    await expect(searchEcfr("x", { fetchImpl: mockFetch({}, false, 503) })).rejects.toThrow(/eCFR API 503/);
  });
});

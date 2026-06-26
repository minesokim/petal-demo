// eCFR fetch client (tests/research/ecfr.test.ts) — keyless Treasury-reg source. Shape verified
// against the live search API (2026-06-24): results carry hierarchy.section, hierarchy_headings,
// full_text_excerpt (with <strong> highlights), and reserved/removed flags.

import { describe, it, expect } from "vitest";
import { searchEcfr, hasReservedSection, cfrRefsFromQuery, stripCfrXml, type EcfrSection } from "../../lib/research/fetch/ecfr";

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

// CITE-VERIFICATION path: a model reg citation ("§1.199A-5") must resolve to (title, part, section) so
// the Versioner can pull its real text and ground it — the direct fix for a correct cited reg answer
// being stamped "not grounded".
describe("cfrRefsFromQuery — extract CFR section references", () => {
  it("extracts a Treasury reg cited with the § glyph (defaults to Title 26)", () => {
    expect(cfrRefsFromQuery("Does §1.199A-5 narrow the SSTB clause?")).toEqual([
      { title: 26, part: "1", section: "1.199A-5" },
    ]);
  });

  it("handles 'Treas. Reg.' and a lettered/hyphenated section", () => {
    expect(cfrRefsFromQuery("What does Treas. Reg. 1.45V-4 require?")).toEqual([
      { title: 26, part: "1", section: "1.45V-4" },
    ]);
  });

  it("reads an explicit non-26 CFR title", () => {
    expect(cfrRefsFromQuery("the 17 CFR 240.10b-5 antifraud rule")).toEqual([
      { title: 17, part: "240", section: "240.10b-5" },
    ]);
  });

  it("does NOT treat a bare statute cite (no part.section dot) as a reg", () => {
    expect(cfrRefsFromQuery("Does California conform to federal §1202 for QSBS?")).toEqual([]);
  });

  it("dedupes a section named twice", () => {
    expect(cfrRefsFromQuery("§1.199A-5 ... see also Treas. Reg. 1.199A-5")).toHaveLength(1);
  });
});

describe("stripCfrXml", () => {
  it("strips tags, decodes the section symbol, and keeps the heading", () => {
    const xml = `<DIV8 N="1.199A-5"><HEAD>&#xa7; 1.199A-5 Specified service trades</HEAD><P>(a) <I>Scope.</I> text here</P></DIV8>`;
    const out = stripCfrXml(xml);
    expect(out).toContain("§ 1.199A-5 Specified service trades");
    expect(out).toContain("(a) Scope. text here");
    expect(out).not.toMatch(/<[^>]+>/);
  });
});

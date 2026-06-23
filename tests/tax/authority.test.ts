import { describe, it, expect } from "vitest";
import { z } from "zod";
import { retrieve, authorityChunkSchema, CORPUS_2025 } from "../../lib/tax/authority/store";

// Task 11 — authority store. The store year+jurisdiction-FILTERS before ranking and
// never returns a superseded chunk. Every chunk carries the mandatory metadata
// (authorityType, citation, taxYear[], jurisdiction, effectiveDate, supersededBy?,
// sourceUrl, ingestedAt) so "no citation, no claim" is structurally enforceable.

describe("authority store — metadata invariants", () => {
  it("every corpus chunk has all mandatory metadata and a resolvable .gov source", () => {
    expect(CORPUS_2025.length).toBeGreaterThan(0);
    for (const c of CORPUS_2025) {
      // schema enforces every mandatory field exists with the right type
      expect(authorityChunkSchema.safeParse(c).success).toBe(true);
      // sourceUrl is an official, free primary source
      expect(c.sourceUrl).toMatch(/\.gov/);
      // taxYear is a non-empty list (a chunk applies to one or more years)
      expect(c.taxYear.length).toBeGreaterThan(0);
    }
  });

  it("the corpus covers the legal structure named in the plan", () => {
    const cites = CORPUS_2025.map((c) => c.citation);
    // federal primary authority, chunked on legal structure
    expect(cites.some((c) => /§\s?63/.test(c))).toBe(true); // standard deduction
    expect(cites.some((c) => /§\s?24/.test(c))).toBe(true); // CTC
    expect(cites.some((c) => /§\s?32/.test(c))).toBe(true); // EITC
    expect(cites.some((c) => /§\s?25A/.test(c))).toBe(true); // AOTC
    expect(cites.some((c) => /§\s?199A/.test(c))).toBe(true); // QBI
    expect(cites.some((c) => /§\s?2\(b\)/.test(c))).toBe(true); // HoH
    expect(cites.some((c) => /§\s?6695\(g\)/.test(c))).toBe(true); // due-diligence penalty
    // California primary authority
    expect(cites.some((c) => /RTC\s?§\s?17052\b/.test(c))).toBe(true); // CalEITC
    expect(cites.some((c) => /RTC\s?§\s?17052\.1/.test(c))).toBe(true); // YCTC
  });
});

describe("authority store — retrieve()", () => {
  it("retrieves an on-point federal §24 chunk for a child-tax-credit query", () => {
    const hits = retrieve("child tax credit", { taxYear: 2025, jurisdiction: "federal" });
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((c) => /§\s?24/.test(c.citation))).toBe(true);
    // every returned chunk actually applies to the requested year + jurisdiction
    for (const c of hits) {
      expect(c.taxYear).toContain(2025);
      expect(c.jurisdiction).toBe("federal");
    }
  });

  it("filters by JURISDICTION before ranking — a CA query never returns federal-only chunks", () => {
    const hits = retrieve("earned income credit", { taxYear: 2025, jurisdiction: "CA" });
    expect(hits.length).toBeGreaterThan(0);
    for (const c of hits) expect(c.jurisdiction).toBe("CA");
    // and it surfaces the CA RTC §17052 CalEITC chunk, not the federal §32 one
    expect(hits.some((c) => /RTC\s?§\s?17052\b/.test(c.citation))).toBe(true);
    expect(hits.some((c) => c.jurisdiction === "federal")).toBe(false);
  });

  it("filters by YEAR before ranking — a chunk that doesn't list the year is excluded", () => {
    // 1999 has no authority in the corpus → empty, never a wrong-year chunk
    const hits = retrieve("standard deduction", { taxYear: 1999, jurisdiction: "federal" });
    expect(hits).toHaveLength(0);
  });

  it("never returns a superseded chunk for its superseding year", () => {
    // a 2024-only chunk marked supersededBy must not surface for 2025
    const hits2025 = retrieve("OBBBA standard deduction superseding probe", { taxYear: 2025, jurisdiction: "federal" });
    expect(hits2025.every((c) => c.supersededBy === undefined)).toBe(true);
    // it is also absent specifically: no chunk both lists 2025 and is superseded
    expect(CORPUS_2025.some((c) => c.taxYear.includes(2025) && c.supersededBy && retrieveContains(hits2025, c))).toBe(false);
  });

  it("honors k and ranks by keyword overlap", () => {
    const hits = retrieve("qualified business income deduction 199A", { taxYear: 2025, jurisdiction: "federal", k: 1 });
    expect(hits).toHaveLength(1);
    expect(/§\s?199A/.test(hits[0].citation)).toBe(true);
  });

  it("returns chunks shaped for the reasoning layer (chunkId/citation/text/taxYear)", () => {
    const hits = retrieve("american opportunity credit education", { taxYear: 2025, jurisdiction: "federal" });
    const c = hits[0];
    expect(typeof c.chunkId).toBe("string");
    expect(typeof c.citation).toBe("string");
    expect(typeof c.text).toBe("string");
    expect(Array.isArray(c.taxYear)).toBe(true);
  });
});

function retrieveContains(hits: { chunkId: string }[], c: { chunkId: string }) {
  return hits.some((h) => h.chunkId === c.chunkId);
}

// A WorksheetResult-style discipline check is out of scope here; this file owns the
// authority store only. Keep the zod import meaningful so tsc stays clean.
void z;

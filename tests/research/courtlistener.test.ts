import { describe, it, expect } from "vitest";
import { courtListenerMatches, caseQuery, searchCourtListener, caseGroundText } from "@/lib/research/fetch/courtlistener";

// CourtListener grounds case law across all courts and verifies a model case cite (resolves to a real
// opinion ⇒ verified; no match ⇒ likely fabricated), carrying the court/precedential tags.

describe("courtListenerMatches", () => {
  it("matches a reporter cite, a v.-caption, and a named court", () => {
    expect(courtListenerMatches("Rauenhorst v. Commissioner, 119 T.C. 157")).toBe(true);
    expect(courtListenerMatches("the Ninth Circuit held in ...")).toBe(true);
    expect(courtListenerMatches("Loper Bright Enterprises v. Raimondo")).toBe(true);
  });
  it("does not match a plain figure question", () => {
    expect(courtListenerMatches("What is the 2025 SALT cap?")).toBe(false);
  });
});

describe("caseQuery", () => {
  it("prefers the X v. Y caption over the bare reporter cite", () => {
    expect(caseQuery("What did Rauenhorst v. Commissioner, 119 T.C. 157 hold?")).toBe("Rauenhorst v. Commissioner");
  });
  it("quotes a bare reporter cite when there is no caption", () => {
    expect(caseQuery("Find 119 T.C. 157")).toBe('"119 T.C. 157"');
  });
});

const mockFetch = (payload: unknown, ok = true, status = 200): typeof fetch =>
  (async () => ({ ok, status, json: async () => payload })) as unknown as typeof fetch;

describe("searchCourtListener + caseGroundText", () => {
  it("normalizes a result and grounds on verified metadata + snippet when full text is absent", async () => {
    const results = {
      results: [
        {
          caseName: "Rauenhorst v. Comm'r",
          citation: ["119 T.C. No. 9", "119 T.C. 157"],
          court: "United States Tax Court",
          court_id: "tax",
          status: "Published",
          dateFiled: "2002-10-07",
          absolute_url: "/opinion/x/",
          opinions: [{ id: 4595964, snippet: "the Commissioner is bound by his concessions" }],
        },
      ],
    };
    const [c] = await searchCourtListener("Rauenhorst v. Commissioner", { fetchImpl: mockFetch(results) });
    expect(c).toMatchObject({ caseName: "Rauenhorst v. Comm'r", court: "United States Tax Court", precedential: true });
    expect(c.citations).toContain("119 T.C. 157");
    // opinionId present but the opinion fetch has no text → fall back to verified metadata + snippet.
    const text = await caseGroundText(c, { fetchImpl: mockFetch({ plain_text: "", html: "" }) });
    expect(text).toContain("119 T.C. 157");
    expect(text).toContain("Published (precedential)");
    expect(text).toContain("bound by his concessions");
  });

  it("flags an Unpublished opinion as non-precedential", async () => {
    const results = {
      results: [{ caseName: "X v. Y", citation: ["1 F.3d 1"], court: "CA9", court_id: "ca9", status: "Unpublished", dateFiled: "2020-01-01", opinions: [{ id: 1, snippet: "" }] }],
    };
    const [c] = await searchCourtListener("X v. Y", { fetchImpl: mockFetch(results) });
    expect(c.precedential).toBe(false);
  });
});

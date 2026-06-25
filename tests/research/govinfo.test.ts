// GovInfo fetch client (tests/research/govinfo.test.ts) — the key-gated retrieve-on-demand source
// (US Code + public laws). Shape verified against the live API with a real key (2026-06-24): a
// search returns results with collectionCode/packageId/resultLink/download.txtLink, and txtLink
// serves the section text HTML-wrapped. These pin the normalization + the HTML->text strip.

import { describe, it, expect } from "vitest";
import { searchGovInfo, fetchGovInfoText, stripHtml } from "../../lib/research/fetch/govinfo";

const SEARCH = {
  results: [
    {
      title: "Clean vehicle credit",
      collectionCode: "USCODE",
      dateIssued: "2024-12-31",
      packageId: "USCODE-2024-title26",
      resultLink: "https://api.govinfo.gov/packages/USCODE-2024-title26/granules/USCODE-2024-title26-section30D",
      download: { txtLink: "https://api.govinfo.gov/packages/USCODE-2024-title26/granules/USCODE-2024-title26-section30D/htm" },
    },
  ],
};

function mockFetch(payload: unknown, kind: "json" | "text" = "json", ok = true, status = 200): typeof fetch {
  return (async () => ({
    ok,
    status,
    json: async () => payload,
    text: async () => String(payload),
  })) as unknown as typeof fetch;
}

describe("GovInfo fetch client", () => {
  it("normalizes a USCODE search result (collection / packageId / textUrl)", async () => {
    const out = await searchGovInfo("clean vehicle credit", { collections: ["USCODE"], apiKey: "test", fetchImpl: mockFetch(SEARCH) });
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ title: "Clean vehicle credit", collection: "USCODE", packageId: "USCODE-2024-title26" });
    expect(out[0].textUrl).toMatch(/section30D/);
  });

  it("throws a clear error when the API key is absent", async () => {
    const prev = process.env.GOVINFO_API_KEY;
    delete process.env.GOVINFO_API_KEY;
    await expect(searchGovInfo("x", { fetchImpl: mockFetch(SEARCH) })).rejects.toThrow(/GOVINFO_API_KEY is not set/);
    if (prev !== undefined) process.env.GOVINFO_API_KEY = prev;
  });

  it("throws on a non-OK response (honest degradation)", async () => {
    await expect(searchGovInfo("x", { apiKey: "test", fetchImpl: mockFetch({}, "json", false, 401) })).rejects.toThrow(/GovInfo API 401/);
  });

  it("fetchGovInfoText strips the HTML wrapper to plain authority text", async () => {
    const html = "<html><head><style>x{}</style></head><body><span>26 U.S.C. </span> &amp; <b>30D.</b>&nbsp;Clean vehicle credit</body></html>";
    const text = await fetchGovInfoText("https://api.govinfo.gov/.../htm", { apiKey: "test", fetchImpl: mockFetch(html, "text") });
    expect(text).toBe("26 U.S.C. & 30D. Clean vehicle credit");
  });

  it("stripHtml drops tags, scripts/styles, and collapses whitespace", () => {
    expect(stripHtml("<p>a</p>\n\n<p>b</p><script>bad()</script>")).toBe("a b");
  });
});

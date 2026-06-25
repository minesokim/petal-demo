// Federal Register fetch client (tests/research/federal-register.test.ts) — the keyless
// retrieve-on-demand source. Shape verified against the live API (2026-06-24); these pin the
// normalization + the Proposed-vs-final "unsettled" signal with a mocked fetch.

import { describe, it, expect } from "vitest";
import { searchFederalRegister, hasOpenProposedRule, type FederalRegisterDoc } from "../../lib/research/fetch/federal-register";

const CANNED = {
  results: [
    { title: "QBI Proposed Rule", type: "Proposed Rule", publication_date: "2026-06-24", html_url: "https://fr/1", abstract: "abc", agencies: [{ name: "Treasury Department" }] },
    { title: "A Notice", type: "Notice", publication_date: "2026-06-20", html_url: "https://fr/2", agencies: [{ name: "Internal Revenue Service" }] },
  ],
};

function mockFetch(payload: unknown, ok = true, status = 200): typeof fetch {
  return (async () => ({ ok, status, json: async () => payload })) as unknown as typeof fetch;
}

const doc = (type: string): FederalRegisterDoc => ({ title: "", type, agency: "", publicationDate: "", htmlUrl: "" });

describe("Federal Register fetch (retrieve-on-demand source)", () => {
  it("normalizes documents (title/type/agency/date/url)", async () => {
    const docs = await searchFederalRegister("qbi", { fetchImpl: mockFetch(CANNED) });
    expect(docs).toHaveLength(2);
    expect(docs[0]).toMatchObject({ title: "QBI Proposed Rule", type: "Proposed Rule", agency: "Treasury Department", htmlUrl: "https://fr/1" });
    expect(docs[1].agency).toBe("Internal Revenue Service");
  });

  it("throws on a non-OK response (honest degradation, no silent empty)", async () => {
    await expect(searchFederalRegister("x", { fetchImpl: mockFetch({}, false, 500) })).rejects.toThrow(/Federal Register API 500/);
  });

  it("hasOpenProposedRule: a proposed rule with NO final rule is the unsettled signal", () => {
    expect(hasOpenProposedRule([doc("Proposed Rule")])).toBe(true);
    expect(hasOpenProposedRule([doc("Proposed Rule"), doc("Rule")])).toBe(false); // final rule => settled
    expect(hasOpenProposedRule([doc("Notice")])).toBe(false);
  });
});

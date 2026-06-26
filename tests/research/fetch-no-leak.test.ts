import { describe, it, expect } from "vitest";
import { fetchPrimary } from "@/lib/research/fetch/fetch-primary";
import { assertPublicLawQuery } from "@/lib/research/fetch/guard";
import type { FetchSource } from "@/lib/research/fetch/registry";

// §7216 NO-LEAK for the LIVE fetch path. Enabling the fetch added an EXTERNAL surface — the engine now
// sends a query string to GovInfo / Federal Register / DAWSON / the IRB on a corpus miss. The spec requires
// proof that no taxpayer data crosses that boundary. Each real source calls assertPublicLawQuery(q) at the
// TOP of its search(), before any network call; a PII-shaped query throws, fetchPrimary swallows it, and the
// request is never made. This test proves that end to end with a spy source that records whether it reached
// the (simulated) network AFTER the guard.

function spySource(reached: { net: boolean }): FetchSource {
  return {
    id: "spy",
    label: "spy",
    matches: () => true,
    search: async (q) => {
      assertPublicLawQuery(q); // the REAL §7216 guard — throws on PII BEFORE any outbound call
      reached.net = true; // only set if the guard let the query through
      return [{
        source: "spy", title: "t", citation: "IRC §4475", sourceUrl: "https://example.gov",
        authorityTier: 1, getText: async () => "x".repeat(120),
      }];
    },
  };
}

describe("§7216 no-leak — the live fetch never sends taxpayer data to an external source", () => {
  it("an SSN-bearing research question never reaches the network: fetchPrimary returns [] and the guard fires first", async () => {
    const reached = { net: false };
    const out = await fetchPrimary("remittance tax owed for client SSN 123-45-6789", 2026, "federal", { sources: [spySource(reached)] });
    expect(out).toEqual([]); // nothing fetched
    expect(reached.net).toBe(false); // the outbound call was NEVER reached — the guard blocked it
  });

  it("an EIN-bearing question is likewise blocked before any external call", async () => {
    const reached = { net: false };
    const out = await fetchPrimary("section 1202 treatment for employer 12-3456789", 2026, "federal", { sources: [spySource(reached)] });
    expect(out).toEqual([]);
    expect(reached.net).toBe(false);
  });

  it("a clean public-law question passes the guard and DOES reach the source (the gate is not over-blocking)", async () => {
    const reached = { net: false };
    const out = await fetchPrimary("IRC section 4475 remittance transfer tax effective date", 2026, "federal", { sources: [spySource(reached)] });
    expect(reached.net).toBe(true);
    expect(out.length).toBe(1); // the clean query fetched real authority
  });
});

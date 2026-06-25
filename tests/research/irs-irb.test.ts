import { describe, it, expect } from "vitest";
import { parseIrbIndex, searchIrb } from "@/lib/research/fetch/irs-irb";

describe("IRS Internal Revenue Bulletin source", () => {
  it("parseIrbIndex extracts issues newest-first and builds the predictable URLs", () => {
    const idx = "Internal Revenue Bulletin: 2026-26 Internal Revenue Bulletin: 2026-18 Internal Revenue Bulletin: 2025-52";
    const b = parseIrbIndex(idx);
    expect(b.map((x) => x.issue)).toEqual(["2026-26", "2026-18", "2025-52"]); // newest first
    expect(b[0].url).toBe("https://www.irs.gov/irb/2026-26_IRB");
  });

  it("searchIrb finds a bulletin via the distinctive term and returns a focused excerpt", async () => {
    const index = "Internal Revenue Bulletin: 2026-18";
    const item = "The remittance transfer excise tax applies at a rate of 1 percent to transfers made after December 31, 2025.";
    const bulletin = `<html>${"filler ".repeat(300)} ${item} ${"filler ".repeat(300)}</html>`;
    const stub = (async (url: string) => ({
      ok: true,
      status: 200,
      text: async () => (url.endsWith("/irb") ? index : bulletin),
    })) as unknown as typeof fetch;

    const hits = await searchIrb("remittance transfer excise tax rate effective date", { fetchImpl: stub });
    expect(hits).toHaveLength(1);
    expect(hits[0].issue).toBe("2026-18");
    expect(hits[0].text).toContain("remittance transfer excise tax");
    expect(hits[0].text).toContain("1 percent");
  });

  it("returns nothing when no bulletin carries the distinctive term (→ honest abstain)", async () => {
    const stub = (async (url: string) => ({
      ok: true,
      status: 200,
      text: async () => (url.endsWith("/irb") ? "Internal Revenue Bulletin: 2026-18" : "<html>unrelated cafeteria plan guidance</html>"),
    })) as unknown as typeof fetch;
    expect(await searchIrb("remittance transfer excise tax rate", { fetchImpl: stub })).toEqual([]);
  });
});

import { describe, it, expect } from "vitest";
import { searchTaxCourt, isCitableAsPrecedent, taxCourtDownloadUrl } from "@/lib/research/fetch/tax-court";

// Canned DAWSON shape (mirrors the live API): a Division Opinion, a Memo, a Summary Opinion, and a
// stricken Memo that must be dropped. fetchImpl is injected so the test never touches the network.
const CANNED = {
  results: [
    { eventCode: "TCOP", caseCaption: "Acme Corp., Petitioner", docketNumber: "1234-25", docketNumberWithSuffix: "1234-25", documentTitle: "Division Opinion 161 T.C. No. 5", documentType: "T.C. Opinion", judge: "Smith", filingDate: "2026-03-01T10:00:00.000Z", docketEntryId: "id-tcop", numberOfPages: 40, isStricken: false },
    { eventCode: "MOP", caseCaption: "James D. Sullivan & Colleen M. Sullivan, Petitioners", docketNumber: "15625-22", docketNumberWithSuffix: "15625-22", documentTitle: "Memorandum Opinion Judge Jones Opinion - T.C. Memo. 2026-13 (An appropriate order will be issued.)", documentType: "Memorandum Opinion", judge: "Jones", filingDate: "2026-02-05T19:31:36.052Z", docketEntryId: "id-mop", numberOfPages: 27, isStricken: false },
    { eventCode: "SOP", caseCaption: "Doe, Petitioner", docketNumber: "999-24", docketNumberWithSuffix: "999-24S", documentTitle: "Summary Opinion T.C. Summary Opinion 2026-7", documentType: "Summary Opinion", judge: "Lee", filingDate: "2026-01-15T00:00:00.000Z", docketEntryId: "id-sop", numberOfPages: 12, isStricken: false },
    { eventCode: "MOP", caseCaption: "Stricken Co.", documentTitle: "T.C. Memo. 2026-99", docketEntryId: "id-stricken", isStricken: true },
  ],
};

const stubFetch = (async () => ({ ok: true, status: 200, json: async () => CANNED })) as unknown as typeof fetch;

describe("Tax Court (DAWSON) fetch client", () => {
  it("normalizes opinions, maps precedential weight, extracts citations, drops stricken", async () => {
    const ops = await searchTaxCourt("qualified small business stock", { fetchImpl: stubFetch });
    expect(ops).toHaveLength(3); // the stricken Memo is dropped

    const tcop = ops.find((o) => o.opinionType === "T.C. Opinion")!;
    expect(tcop.precedential).toBe(true);
    expect(tcop.citation).toBe("161 T.C. No. 5");

    const memo = ops.find((o) => o.opinionType === "T.C. Memo.")!;
    expect(memo.precedential).toBe(true);
    expect(memo.citation).toBe("T.C. Memo. 2026-13");
    expect(memo.filingDate).toBe("2026-02-05"); // sliced to YYYY-MM-DD

    const sop = ops.find((o) => o.opinionType === "Summary Opinion")!;
    expect(sop.precedential).toBe(false); // IRC §7463(b) — never cite as precedent
    expect(isCitableAsPrecedent(sop)).toBe(false);
    expect(sop.docketNumber).toBe("999-24S");
    expect(sop.citation).toBe("T.C. Summary Opinion 2026-7");
  });

  it("throws on a non-OK response (honest degradation, no silent empty)", async () => {
    const bad = (async () => ({ ok: false, status: 503 })) as unknown as typeof fetch;
    await expect(searchTaxCourt("x", { fetchImpl: bad })).rejects.toThrow(/DAWSON|503/);
  });

  it("builds the public download-resolver URL from public identifiers (no PII)", () => {
    expect(taxCourtDownloadUrl("15625-22", "abc-def")).toBe(
      "https://public-api.dawson.ustaxcourt.gov/public-api/15625-22/abc-def/public-document-download-url",
    );
  });
});

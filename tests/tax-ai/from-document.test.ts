import { describe, it, expect } from "vitest";
import { MockProvider } from "../../lib/ai/provider";
import { computeFromDocument } from "../../lib/tax-ai/from-document";
import { eitc } from "../../lib/tax/worksheets/eitc";
import { getFigures } from "../../lib/tax/figures";

const fed = getFigures(2025, "federal");

describe("document-facts → engine bridge", () => {
  it("extracted document fields flow into a deterministic, cited computation", async () => {
    // A W-2-shaped document: the classifier extracted these fields.
    const doc = {
      docType: "W-2",
      taxYear: 2025,
      fields: { wages: "15000", qualifyingChildren: "2", filingStatus: "single", investmentIncome: "0" },
    };
    // The proposer maps the document fields → the eitc worksheet's inputs (here, the mock
    // stands in for that mapping). The VALUE still comes from lib/tax, not the model.
    const mappedFacts = {
      earnedIncome: 15000, agi: 15000, investmentIncome: 0,
      qualifyingChildren: 2, filingStatus: "single" as const, taxpayerSsnValidForWork: true,
    };
    const provider = new MockProvider(() => ({ request: { worksheet: "eitc", facts: mappedFacts } }));

    const ans = await computeFromDocument(provider, "What is their EITC?", doc);
    expect(ans.worksheet).toBe("eitc");
    expect(ans.value).toBe(eitc(mappedFacts, fed).value); // deterministic, from lib/tax
    expect(ans.taxYear).toBe(2025); // the document's year drove it
    expect(ans.citations.length).toBeGreaterThan(0);
  });

  it("a judge that finds the document mapping unfaithful drops the tier to low", async () => {
    const doc = { docType: "W-2", taxYear: 2025, fields: { wages: "15000" } };
    const mappedFacts = {
      earnedIncome: 15000, agi: 15000, investmentIncome: 0,
      qualifyingChildren: 2, filingStatus: "single" as const, taxpayerSsnValidForWork: true,
    };
    const provider = new MockProvider(() => ({ request: { worksheet: "eitc", facts: mappedFacts } }));
    const judge = new MockProvider(() => ({ faithful: false, citationsOnPoint: true, issues: ["Document shows no dependents; 2 children were assumed"] }));
    const ans = await computeFromDocument(provider, "EITC?", doc, { judge });
    expect(ans.tier).toBe("low");
    expect(ans.reviewNotes.some((n) => /dependents|children/i.test(n))).toBe(true);
  });
});

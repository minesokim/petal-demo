import { describe, it, expect } from "vitest";
import { assertPublicLawQuery, isPublicLawQuery } from "@/lib/research/fetch/guard";

// The §7216 line for the fetch path: a query that leaves for a public API must be public-law-shaped
// and carry no taxpayer PII. The guard fails CLOSED so a PII-shaped query becomes an abstain, never
// an outbound leak.
describe("§7216 fetch-query guard", () => {
  it("passes a public-law-shaped query and returns it", () => {
    expect(assertPublicLawQuery("IRC section 4475 remittance transfer tax effective date")).toContain("4475");
    expect(assertPublicLawQuery("section 1202 qualified small business stock holding period")).toContain("1202");
  });

  it("blocks an SSN-shaped query (fails closed)", () => {
    expect(() => assertPublicLawQuery("remittance tax for client 123-45-6789")).toThrow(/§7216|SSN/);
  });

  it("blocks an EIN-shaped query", () => {
    expect(() => assertPublicLawQuery("employer 12-3456789 information reporting")).toThrow(/§7216|EIN/);
  });

  it("blocks an email address", () => {
    expect(() => assertPublicLawQuery("email jane.doe@example.com re section 170")).toThrow(/§7216|email/);
  });

  it("blocks a long account/id number", () => {
    expect(() => assertPublicLawQuery("account 123456789012 wire transfer")).toThrow(/§7216/);
  });

  it("isPublicLawQuery: true for clean law queries, false for PII", () => {
    expect(isPublicLawQuery("Trump Account election availability 2026")).toBe(true);
    expect(isPublicLawQuery("ssn 123-45-6789")).toBe(false);
  });
});

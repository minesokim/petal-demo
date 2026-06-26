import { describe, it, expect } from "vitest";
import { isCaConformityQuestion, rtcUrl, ftbPub1001Url } from "@/lib/research/fetch/ca-conformity";

// The California conformity source grounds "does CA conform to federal §X" (the §1202 QSBS / §199A
// nonconformity the capstone faulted). The routing gate must fire on a CA + conformity question and
// NOT on a purely-federal one.

describe("isCaConformityQuestion", () => {
  it("matches a California + federal-provision conformity question", () => {
    expect(isCaConformityQuestion("Does California conform to federal §1202 for QSBS?")).toBe(true);
    expect(isCaConformityQuestion("Does CA conform to the §199A QBI deduction?")).toBe(true);
    expect(isCaConformityQuestion("Has the FTB issued conformity guidance on bonus depreciation?")).toBe(true);
  });

  it("does NOT match a purely federal question (no California)", () => {
    expect(isCaConformityQuestion("What is the federal §1202 exclusion cap?")).toBe(false);
  });

  it("does NOT match a California mention with no tax-conformity context", () => {
    expect(isCaConformityQuestion("What is the weather in California?")).toBe(false);
  });
});

describe("CA source URLs", () => {
  it("builds the deterministic leginfo R&TC section URL", () => {
    expect(rtcUrl("17024.5")).toBe(
      "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=RTC&sectionNum=17024.5.",
    );
  });

  it("builds the FTB Pub 1001 PDF URL for a year", () => {
    expect(ftbPub1001Url(2025)).toBe("https://www.ftb.ca.gov/forms/2025/2025-1001-publication.pdf");
  });
});

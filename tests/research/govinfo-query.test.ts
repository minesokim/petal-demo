import { describe, it, expect } from "vitest";
import { statuteQuery } from "@/lib/research/fetch/govinfo";

// GovInfo's keyword search returns 0 hits for a full natural-language question but the right granule for
// targeted terms. statuteQuery reduces the question to those terms (Code section + content nouns).

describe("statuteQuery — reduce a question to GovInfo search terms", () => {
  it("extracts the Code section + content nouns and drops the question framing", () => {
    const out = statuteQuery("What are the like-kind exchange requirements under IRC section 1031 for real property?");
    expect(out).toContain("section 1031");
    expect(out).toMatch(/like-kind|exchange|property/);
    expect(out).not.toMatch(/\bwhat\b|\bthe\b|\brequirements\b/); // framing + stopwords removed
  });

  it("handles the § symbol and a bare 'section N' reference", () => {
    expect(statuteQuery("§ 461(l) excess business loss threshold")).toContain("section 461");
    expect(statuteQuery("section 1202 qualified small business stock holding period")).toContain("section 1202");
  });

  it("never returns empty (falls back to the question when nothing is extractable)", () => {
    expect(statuteQuery("hi").length).toBeGreaterThan(0);
  });
});

import { describe, it, expect } from "vitest";
import { treatyCountry, matchesTreaty } from "@/lib/research/fetch/treaty";

// The treaty source must (a) detect the partner country and (b) fire ONLY on a cross-border/treaty
// question — and the live source's title-filter guarantees the RIGHT country's treaty or nothing.

describe("treaty — country detection + matcher", () => {
  it("detects the partner by name, adjective, and multi-word (longest wins); null for a domestic question", () => {
    expect(treatyCountry("under the US-Spain tax treaty")).toBe("Spain");
    expect(treatyCountry("the United Kingdom treaty residency rule")).toBe("United Kingdom");
    expect(treatyCountry("a German withholding question")).toBe("Germany");
    expect(treatyCountry("a purely domestic §1202 QSBS question")).toBeNull();
  });

  it("fires only on a cross-border/treaty question that NAMES a partner", () => {
    expect(matchesTreaty("withholding rate on dividends under the US-Spain tax treaty")).toBe(true);
    expect(matchesTreaty("permanent establishment under the Canada tax treaty")).toBe(true);
    expect(matchesTreaty("what is the population of Spain")).toBe(false); // names a country, not a treaty question
    expect(matchesTreaty("US permanent establishment rules generally")).toBe(false); // treaty cue, no partner
  });
});

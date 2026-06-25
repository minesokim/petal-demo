// COVERAGE MANIFEST (tests/research/coverage-manifest.test.ts)
//
// The manifest is Petal's model of its own competence boundary, DERIVED from the live corpus so it
// can never lie about coverage. These tests encode the held-out diagnostic's findings as automated
// assertions: the provisions Petal grounded correctly are present; the provisions that produced
// confident-WRONG answers (the OBBBA information-reporting family) are reported as honestly NOT
// LOADED — which is the signal the calibration layer needs to stop calling a coverage gap "unsettled".

import { describe, it, expect } from "vitest";
import { COVERAGE_MANIFEST, coverageFor, normalizeSection, identifyProvisions, namedCoverageGaps } from "../../lib/research/coverage-manifest";

describe("coverage manifest — derived from the real corpus", () => {
  it("catalogs the loaded provisions (non-trivial, section-keyed)", () => {
    expect(COVERAGE_MANIFEST.size).toBeGreaterThanOrEqual(15);
    expect(COVERAGE_MANIFEST.has("OBBBA §70120")).toBe(true); // SALT change — graded A this round
    expect(COVERAGE_MANIFEST.has("IRC §199A")).toBe(true);
    expect(COVERAGE_MANIFEST.has("IRC §164")).toBe(true);
  });

  it("reports LOADED provisions as covered for the right year/jurisdiction", () => {
    expect(coverageFor("OBBBA §70120", 2025, "federal").covered).toBe(true); // the SALT fix landed here
    expect(coverageFor("IRC §199A", 2025, "federal").covered).toBe(true);
    const salt = coverageFor("OBBBA §70120", 2025, "federal");
    if (salt.covered) expect(salt.entry.sourceCount).toBeGreaterThan(0);
  });

  it("reports the still-open diagnostic GAPS as honestly not_loaded (the confident-wrong root cause)", () => {
    // Genuinely not in the corpus (the 1099-K rule §6050W was ingested to close that one):
    for (const gap of ["IRC §30D", "IRC §25D", "IRC §6041"]) {
      const s = coverageFor(gap, 2026, "federal");
      expect(s.covered, `${gap} should be not_loaded`).toBe(false);
      if (!s.covered) expect(s.reason).toBe("not_loaded");
    }
  });

  it("a gap CLOSED by ingest (1099-K / IRC §6050W) now reports covered", () => {
    expect(coverageFor("IRC §6050W", 2026, "federal").covered).toBe(true);
  });

  it("distinguishes 'loaded but not this year' (wrong_year) from 'not loaded at all'", () => {
    const old = coverageFor("IRC §63", 1999, "federal"); // §63 IS loaded, but not for 1999
    expect(old.covered).toBe(false);
    if (!old.covered) expect(old.reason).toBe("wrong_year");
    const missing = coverageFor("OBBBA §70432", 2025, "federal"); // not loaded at all
    if (!missing.covered) expect(missing.reason).toBe("not_loaded");
  });

  it("normalizeSection resolves raw cites, incl. a bare 5-digit OBBBA section", () => {
    expect(normalizeSection("§70432")).toBe("OBBBA §70432"); // bare 5-digit -> OBBBA, not IRC
    expect(normalizeSection("IRC §164(b)(6)")).toBe("IRC §164"); // subsection -> section grain
    expect(normalizeSection("30D")).toBe("IRC §30D");
    expect(normalizeSection("R&TC §17052.1")).toBe("Cal. R&TC §17052.1");
  });
});

describe("identifyProvisions + namedCoverageGaps — naming a gap from a question", () => {
  it("maps a 1099-K question to IRC §6050W — now ingested, so NOT flagged as a gap", () => {
    const q = "Will my client get a 1099-K for $9,000 across 15 transactions?";
    expect(identifyProvisions(q)).toContain("IRC §6050W");
    expect(namedCoverageGaps(q, 2026, "federal")).not.toContain("IRC §6050W"); // closed by the ingest
  });

  it("maps an EV clean-vehicle question to IRC §30D (a still-open not-loaded gap)", () => {
    expect(namedCoverageGaps("Walk me through the clean vehicle credit for a new EV", 2026, "federal")).toContain("IRC §30D");
  });

  it("a LOADED provision (QBI / §199A) is identified but NOT flagged as a gap", () => {
    expect(identifyProvisions("how does the QBI deduction work")).toContain("IRC §199A");
    expect(namedCoverageGaps("how does the QBI deduction work", 2025, "federal")).not.toContain("IRC §199A");
  });

  it("picks up an explicit section cite from the question text", () => {
    expect(identifyProvisions("the definition of qualified production property under section 168(n)")).toContain("IRC §168");
  });
});

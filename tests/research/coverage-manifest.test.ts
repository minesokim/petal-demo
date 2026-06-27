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

describe("entity law — Subchapter S core (the audit's #1 binding gap; first batch ingested)", () => {
  // Subchapter S was 100% UNGROUNDED before this ingest (the re-audit grep-verified zero S/K/C coverage).
  // These assert the new chunks are present + registered + retrievable by the coverage system, so the entity
  // corpus cannot silently regress on a PR (model-free). Answer CORRECTNESS is measured by the live
  // benchmark, not here — the engine probe confirmed it grounds an S-corp answer in §1361.
  for (const sec of ["IRC §1361", "IRC §1366", "IRC §1367", "IRC §1368", "IRC §1374"]) {
    it(`${sec} is now LOADED for 2026`, () => {
      const s = coverageFor(sec, 2026, "federal");
      expect(s.covered, `${sec} should be loaded after the Subchapter S ingest`).toBe(true);
      if (s.covered) expect(s.entry.sourceCount).toBeGreaterThan(0);
    });
  }
});

describe("entity law — Subchapter K core (partnerships; audit gap #1 continued)", () => {
  // Partnerships were 100% UNGROUNDED before this batch. §704 (distributive share / substantial economic
  // effect), §752 (liabilities → outside basis) and §754 (basis-adjustment election) are the exact sections
  // the re-audit named. Model-free presence guards so the partnership corpus can't silently regress.
  for (const sec of ["IRC §704", "IRC §705", "IRC §722", "IRC §731", "IRC §752", "IRC §754"]) {
    it(`${sec} is now LOADED for 2026`, () => {
      const s = coverageFor(sec, 2026, "federal");
      expect(s.covered, `${sec} should be loaded after the Subchapter K ingest`).toBe(true);
      if (s.covered) expect(s.entry.sourceCount).toBeGreaterThan(0);
    });
  }
});

describe("entity law — Subchapter C core (C corporations; audit gap #1 continued)", () => {
  // C corporations were 100% UNGROUNDED before this batch — distributions (§301/311/316) and incorporation
  // (§351/357). Model-free presence guards so the C-corp corpus can't silently regress.
  for (const sec of ["IRC §301", "IRC §311", "IRC §316", "IRC §351", "IRC §357"]) {
    it(`${sec} is now LOADED for 2026`, () => {
      const s = coverageFor(sec, 2026, "federal");
      expect(s.covered, `${sec} should be loaded after the Subchapter C ingest`).toBe(true);
      if (s.covered) expect(s.entry.sourceCount).toBeGreaterThan(0);
    });
  }
});

describe("capital gains / property spine (the audit's biggest hole; incl. §1061 carried interest)", () => {
  // The capital-gains/property regime was the largest gap — foundational to almost every property
  // transaction. §1061 is the carried-interest rule a PE/hedge-fund question turns on (it was a literal
  // zero-coverage gap when first asked). Model-free presence guards so this spine can't silently regress.
  for (const sec of ["IRC §1061", "IRC §1221", "IRC §1222", "IRC §1231", "IRC §1245", "IRC §1250", "IRC §1014", "IRC §1015"]) {
    it(`${sec} is now LOADED for 2026`, () => {
      const s = coverageFor(sec, 2026, "federal");
      expect(s.covered, `${sec} should be loaded after the capital-gains ingest`).toBe(true);
      if (s.covered) expect(s.entry.sourceCount).toBeGreaterThan(0);
    });
  }
});

// COVERAGE MANIFEST (tests/research/coverage-manifest.test.ts)
//
// The manifest is Petal's model of its own competence boundary, DERIVED from the live corpus so it
// can never lie about coverage. These tests encode the held-out diagnostic's findings as automated
// assertions: the provisions Petal grounded correctly are present; the provisions that produced
// confident-WRONG answers (the OBBBA information-reporting family) are reported as honestly NOT
// LOADED — which is the signal the calibration layer needs to stop calling a coverage gap "unsettled".

import { describe, it, expect } from "vitest";
import { COVERAGE_MANIFEST, coverageFor, normalizeSection, identifyProvisions, namedCoverageGaps } from "../../lib/research/coverage-manifest";
import { CORPUS_CASELAW } from "../../lib/research/corpus-caselaw";

describe("Wave 3 batch 1 — landmark case law (the §6662 authority-weighting lever)", () => {
  // Web-verified holdings (cites checked against LII; Loper Bright via Justia). These give the weighting
  // engine REAL court authority across levels — incl. Loper Bright (post-Chevron, the delegation hinge).
  const ids = CORPUS_CASELAW.map((c) => c.chunkId);
  for (const id of [
    "case-crane-v-commissioner", "case-commissioner-v-tufts", "case-indopco-v-commissioner",
    "case-knetsch-v-united-states", "case-cottage-savings-v-commissioner", "case-commissioner-v-banks",
    "case-frank-lyon-v-united-states", "case-loper-bright-v-raimondo",
  ]) {
    it(`${id} is loaded as a precedential Supreme Court authority`, () => {
      const c = CORPUS_CASELAW.find((x) => x.chunkId === id);
      expect(c, `${id} should be in the case corpus`).toBeTruthy();
      expect(c!.authorityType).toBe("case");
      expect(c!.precedential).toBe(true);
      expect(c!.courtLevel).toBe("supreme");
    });
  }
  it("the case corpus has no duplicate chunkIds", () => {
    expect(new Set(ids).size).toBe(ids.length);
  });
  // Circuit-split / unsettled-issue cases (batch 2): tagged at their real court level, text carries the
  // 'unsettled' signal the calibration layer reads (so it can hedge, not over-answer, on contested issues).
  it("Aragona (trust material participation) is a precedential Tax Court authority flagged unsettled", () => {
    const c = CORPUS_CASELAW.find((x) => x.chunkId === "case-frank-aragona-trust-v-commissioner");
    expect(c, "Aragona should be loaded").toBeTruthy();
    expect(c!.courtLevel).toBe("tax");
    expect(c!.precedential).toBe(true);
    expect(c!.keywords).toContain("unsettled");
  });
  it("Chai (§6751(b) approval timing) is a precedential 2d-Circuit authority flagged unsettled", () => {
    const c = CORPUS_CASELAW.find((x) => x.chunkId === "case-chai-v-commissioner");
    expect(c, "Chai should be loaded").toBeTruthy();
    expect(c!.courtLevel).toBe("circuit");
    expect(c!.circuit).toBe("2");
    expect(c!.keywords).toContain("unsettled");
  });
});

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

describe("high-frequency individual / SMB provisions (next-ranked coverage)", () => {
  // Spousal transfers, home office, bad debts, constructive ownership, and passive-activity losses — common in
  // real return prep. Model-free presence guards so the batch can't silently regress.
  for (const sec of ["IRC §1041", "IRC §280A", "IRC §166", "IRC §318", "IRC §469"]) {
    it(`${sec} is now LOADED for 2026`, () => {
      const s = coverageFor(sec, 2026, "federal");
      expect(s.covered, `${sec} should be loaded after the high-frequency ingest`).toBe(true);
      if (s.covered) expect(s.entry.sourceCount).toBeGreaterThan(0);
    });
  }
});

describe("core depreciation / deduction provisions", () => {
  // §168 MACRS + §168(k) bonus, §179 expensing, §453 installment sales, §165 losses, §170 charitable —
  // very high frequency in real returns. Model-free presence guards.
  for (const sec of ["IRC §168", "IRC §179", "IRC §453", "IRC §165", "IRC §170"]) {
    it(`${sec} is now LOADED for 2026`, () => {
      const s = coverageFor(sec, 2026, "federal");
      expect(s.covered, `${sec} should be loaded after the depreciation/deduction ingest`).toBe(true);
      if (s.covered) expect(s.entry.sourceCount).toBeGreaterThan(0);
    });
  }
});

describe("equity compensation (§409A / ISOs / ESPP / restricted stock — the live-surfaced gap)", () => {
  // The §409A discounted-option question was a literal coverage gap (honestly hedged). Now grounded.
  for (const sec of ["IRC §83", "IRC §409A", "IRC §421", "IRC §422", "IRC §423", "IRC §424"]) {
    it(`${sec} is now LOADED for 2026`, () => {
      const s = coverageFor(sec, 2026, "federal");
      expect(s.covered, `${sec} should be loaded after the equity-comp ingest`).toBe(true);
      if (s.covered) expect(s.entry.sourceCount).toBeGreaterThan(0);
    });
  }
});

describe("Wave 1 batch 1 — high-frequency statute breadth (the bulk-ingest shift)", () => {
  // §162 business expenses, §195 startup, §212, §132 fringe, §274 meals, §267 related-party, §312 E&P,
  // §721/§751 partnership, §358 incorporation basis. (§312 ingested without colliding with §3121 — filter fix.)
  for (const sec of ["IRC §162", "IRC §195", "IRC §212", "IRC §132", "IRC §274", "IRC §267", "IRC §312", "IRC §721", "IRC §751", "IRC §358"]) {
    it(`${sec} is now LOADED for 2026`, () => {
      const s = coverageFor(sec, 2026, "federal");
      expect(s.covered, `${sec} should be loaded after the Wave 1 ingest`).toBe(true);
      if (s.covered) expect(s.entry.sourceCount).toBeGreaterThan(0);
    });
  }
});

describe("Wave 1 batch 2 — individual + SMB breadth", () => {
  // §152 dependents, §172 NOL, §1211/§1212 capital-loss limits, §72 distributions, §408 IRAs, §6695 preparer
  // penalties, §7701 definitions/economic-substance, §243 DRD, §305 stock dividends. (§72 ≠ §722/§752.)
  for (const sec of ["IRC §152", "IRC §172", "IRC §1211", "IRC §1212", "IRC §72", "IRC §408", "IRC §6695", "IRC §7701", "IRC §243", "IRC §305"]) {
    it(`${sec} is now LOADED for 2026`, () => {
      const s = coverageFor(sec, 2026, "federal");
      expect(s.covered, `${sec} should be loaded after the Wave 1 batch 2 ingest`).toBe(true);
      if (s.covered) expect(s.entry.sourceCount).toBeGreaterThan(0);
    });
  }
});

describe("Wave 1 batch 3 — basis fundamentals, retirement, benefits, entity basis", () => {
  // §1001 realization, §1012 cost basis, §1016 basis adjustments, §401 qualified plans, §125 cafeteria,
  // §105/§106 health benefits, §332 subsidiary liquidation, §362 corp basis, §723 partnership basis.
  for (const sec of ["IRC §1001", "IRC §1012", "IRC §1016", "IRC §401", "IRC §125", "IRC §105", "IRC §106", "IRC §332", "IRC §362", "IRC §723"]) {
    it(`${sec} is now LOADED for 2026`, () => {
      const s = coverageFor(sec, 2026, "federal");
      expect(s.covered, `${sec} should be loaded after the Wave 1 batch 3 ingest`).toBe(true);
      if (s.covered) expect(s.entry.sourceCount).toBeGreaterThan(0);
    });
  }
});

describe("Wave 2 — Treasury Regulations (the §6662 authority-weighting fuel)", () => {
  // Regs register under their OWN key (Treas. Reg. §x), NOT collapsed into IRC §1 (provisionKey fix).
  // §1.6662-4 (substantial-authority standard), §1.6664-4 (reasonable cause), §1.199A-1 (QBI),
  // §1.469-5T (material participation), §1.704-1 (SEE), §301.7701-3 (check-the-box), §1.83-7 (NQ options),
  // §1.162-1 / §1.61-1, and §1.409A-1 (the discounted-option BRIDGE that closed the live-surfaced gap).
  for (const sec of [
    "Treas. Reg. §1.6662-4", "Treas. Reg. §1.6664-4", "Treas. Reg. §1.199A-1", "Treas. Reg. §1.469-5T",
    "Treas. Reg. §1.704-1", "Treas. Reg. §301.7701-3", "Treas. Reg. §1.83-7", "Treas. Reg. §1.162-1",
    "Treas. Reg. §1.61-1", "Treas. Reg. §1.409A-1",
  ]) {
    it(`${sec} is LOADED as a regulation for 2026`, () => {
      const s = coverageFor(sec, 2026, "federal");
      expect(s.covered, `${sec} should be loaded after the Wave 2 reg ingest`).toBe(true);
      if (s.covered) {
        expect(s.entry.sourceCount).toBeGreaterThan(0);
        expect(s.entry.tiers, `${sec} should register as a regulation, not a statute`).toContain("regulation");
      }
    });
  }
});

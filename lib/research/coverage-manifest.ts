import { REGISTERED_CORPUS, type AuthorityChunk, type AuthorityType } from "../tax/authority/store";
import type { Jurisdiction } from "../tax/types";

// THE COVERAGE MANIFEST — Petal's model of its own competence boundary (the metacognitive layer).
//
// The research engine's failure mode across diagnostics is the SAME root cause every round: when
// retrieval comes up empty the system has no way to know WHY, so "I have no authority loaded" and
// "the authority says this is open" collapse into one indistinct hedge — and the agent layer fills
// the gap from the model's stale training weights. The fix is a queryable catalog of what primary
// authority is actually loaded, so "not retrieved" becomes a KNOWABLE, distinct state.
//
// Crucially this is DERIVED from the live corpus, never hand-maintained. A hand-kept manifest drifts
// from the chunks it describes and starts lying about coverage; a derived one cannot — if a chunk
// isn't loaded, the manifest says so by construction. Absence from this manifest IS the coverage gap.

export type CoverageEntry = {
  provision: string; // normalized section key, e.g. "IRC §163", "OBBBA §70432", "Cal. R&TC §17052"
  jurisdictions: Jurisdiction[];
  taxYears: number[]; // union of every tax year any loaded chunk for this provision covers
  tiers: AuthorityType[]; // the authority tiers loaded (statute, reg, ruling, …)
  sourceCount: number; // how many chunks back this provision
  freshestIngestedAt: string; // most recent ingest timestamp (staleness signal)
};

// Derive the section-level provision key from a chunk. Section granularity (e.g. §163, §70432) is
// the right grain for coverage: subsections of a loaded section are still "covered". Prefer the
// human citation; fall back to the chunkId. Returns null if no section can be parsed.
export function provisionKey(chunk: AuthorityChunk): string | null {
  const cite = chunk.citation ?? "";
  const id = chunk.chunkId ?? "";
  const obbba = cite.match(/OBBBA\s*§?\s*(\d{4,5})/i) ?? id.match(/obbba-(\d{4,5})/i);
  if (obbba) return `OBBBA §${obbba[1]}`;
  const rtc = cite.match(/R&TC\s*§?\s*([\d.]+)/i) ?? id.match(/rtc-?([\d.]+)/i);
  if (rtc) return `Cal. R&TC §${rtc[1].replace(/\.$/, "")}`;
  const irc = cite.match(/§\s*(\d+[A-Za-z]?)/) ?? id.match(/irc-?(\d+[a-z]?)/i);
  if (irc) return `IRC §${irc[1].toUpperCase()}`;
  return null;
}

export function buildCoverageManifest(corpus: AuthorityChunk[] = REGISTERED_CORPUS): Map<string, CoverageEntry> {
  const m = new Map<string, CoverageEntry>();
  for (const chunk of corpus) {
    const key = provisionKey(chunk);
    if (!key) continue;
    const e = m.get(key) ?? {
      provision: key,
      jurisdictions: [] as Jurisdiction[],
      taxYears: [] as number[],
      tiers: [] as AuthorityType[],
      sourceCount: 0,
      freshestIngestedAt: "",
    };
    if (!e.jurisdictions.includes(chunk.jurisdiction)) e.jurisdictions.push(chunk.jurisdiction);
    for (const y of chunk.taxYear) if (!e.taxYears.includes(y)) e.taxYears.push(y);
    if (!e.tiers.includes(chunk.authorityType)) e.tiers.push(chunk.authorityType);
    e.sourceCount += 1;
    if ((chunk.ingestedAt ?? "") > e.freshestIngestedAt) e.freshestIngestedAt = chunk.ingestedAt ?? "";
    m.set(key, e);
  }
  for (const e of m.values()) e.taxYears.sort((a, b) => a - b);
  return m;
}

export const COVERAGE_MANIFEST = buildCoverageManifest();

export type CoverageStatus =
  | { covered: true; entry: CoverageEntry }
  // not_loaded: nothing in the corpus for this provision — an HONEST gap, NOT "the law is unsettled".
  | { covered: false; reason: "not_loaded" }
  // wrong_year: the provision is loaded but not for the asked tax year (a freshness/year-boundary gap).
  | { covered: false; reason: "wrong_year"; entry: CoverageEntry };

/**
 * Is this provision actually loaded for the asked year + jurisdiction? This is the lookup the
 * calibration layer consults so "I could not retrieve it" stops masquerading as "this is unsettled".
 * `section` is a normalized key or a raw cite (it is re-normalized here).
 */
export function coverageFor(
  section: string,
  taxYear: number,
  jurisdiction: Jurisdiction,
  manifest: Map<string, CoverageEntry> = COVERAGE_MANIFEST,
): CoverageStatus {
  const key = normalizeSection(section);
  const entry = key ? manifest.get(key) : undefined;
  if (!entry || !entry.jurisdictions.includes(jurisdiction)) return { covered: false, reason: "not_loaded" };
  if (!entry.taxYears.includes(taxYear)) return { covered: false, reason: "wrong_year", entry };
  return { covered: true, entry };
}

// Normalize a raw section string ("§70432", "IRC 163(j)", "OBBBA §70432") to a manifest key.
export function normalizeSection(section: string): string | null {
  const s = section.trim();
  const rtc = s.match(/R&TC\s*§?\s*([\d.]+)/i);
  if (rtc) return `Cal. R&TC §${rtc[1].replace(/\.$/, "")}`;
  // OBBBA sections are 5-digit (70xxx); IRC tops out in the 9000s. A bare ≥10000 number, or an
  // explicit OBBBA prefix, is OBBBA — so "§70432" alone still resolves correctly.
  const big = s.match(/(?:OBBBA\s*)?§?\s*(\d{4,5})\b/i);
  if (big && (/OBBBA/i.test(s) || Number(big[1]) >= 10000)) return `OBBBA §${big[1]}`;
  const irc = s.match(/§?\s*(\d+[A-Za-z]?)/);
  if (irc) return `IRC §${irc[1].toUpperCase()}`;
  return null;
}

// Fetch-source registry: routes a coverage-gap question to the right primary-source API(s), in
// authority order, and returns hits with a uniform shape plus a getText() that pulls the PRIMARY
// text to ground in. Every outbound query passes the §7216 guard first. HONEST DEGRADATION: a
// source whose getText isn't wired yet (or fails) throws → the engine abstains, never guesses.

import { assertPublicLawQuery } from "./guard";
import { searchGovInfo, fetchGovInfoText, type GovInfoResult } from "./govinfo";
import { searchTaxCourt, taxCourtDownloadUrl } from "./tax-court";

export type FetchHit = {
  source: string; // "govinfo" | "tax-court" | ...
  title: string;
  citation: string;
  sourceUrl: string;
  authorityTier: number; // 1 statute, 2 reg, 3 case, 4 agency-guidance (rank for the 3-axis model)
  precedential?: boolean; // false ⇒ never cite as precedent (Summary Opinion / PLR / TAM)
  getText: () => Promise<string>; // pulls the PRIMARY text to ground in (throws ⇒ honest abstain)
};

export type FetchSource = {
  id: string;
  label: string;
  matches: (q: string) => boolean; // does this source fit the question shape?
  search: (q: string, opts?: { signal?: AbortSignal }) => Promise<FetchHit[]>;
};

// ── GovInfo: federal statute (USCODE) + enacted public laws (PLAW). Full primary text available. ──
const govinfoStatute: FetchSource = {
  id: "govinfo",
  label: "GovInfo (U.S. Code / Public Laws)",
  matches: (q) => /\b(section|§|irc|u\.?\s?s\.?\s?c|public law|pub\.?\s?l|statute|enacted|act of|obbba)\b/i.test(q),
  search: async (q, opts) => {
    const safe = assertPublicLawQuery(q);
    const results = await searchGovInfo(safe, { collections: ["USCODE", "PLAW"], pageSize: 5, signal: opts?.signal });
    return results
      .filter((r): r is GovInfoResult & { textUrl: string } => !!r.textUrl)
      .map((r) => ({
        source: "govinfo",
        title: r.title,
        citation: r.title,
        sourceUrl: r.granuleUrl ?? r.textUrl,
        authorityTier: 1, // statute is the top axis
        getText: () => fetchGovInfoText(r.textUrl, { signal: opts?.signal }),
      }));
  },
};

// ── US Tax Court (DAWSON): case law. Search works today; full-text PDF extraction is a follow-up,
// so getText fails closed for now → a case-law fetch abstains honestly rather than returning text it
// hasn't actually read. ──
const taxCourt: FetchSource = {
  id: "tax-court",
  label: "U.S. Tax Court (DAWSON)",
  matches: (q) => /\b(tax court|t\.?\s?c\.?|opinion|held|holding|case law|memo\.?|petitioner)\b/i.test(q),
  search: async (q, opts) => {
    const safe = assertPublicLawQuery(q);
    const ops = await searchTaxCourt(safe, { signal: opts?.signal });
    return ops.map((o) => ({
      source: "tax-court",
      title: o.caseCaption,
      citation: o.citation,
      sourceUrl: taxCourtDownloadUrl(o.docketNumber, o.docketEntryId),
      authorityTier: 3,
      precedential: o.precedential,
      getText: async () => {
        throw new Error("tax-court full-text extraction not yet wired (PDF) — fail closed → abstain");
      },
    }));
  },
};

const SOURCES: FetchSource[] = [govinfoStatute, taxCourt];

const TIER_ORDER: Record<string, number> = { govinfo: 0, "tax-court": 1 };

/** Sources that fit the question, highest-authority first. Empty ⇒ no fetch source applies → abstain. */
export function pickSources(question: string): FetchSource[] {
  return SOURCES.filter((s) => s.matches(question)).sort(
    (a, b) => (TIER_ORDER[a.id] ?? 9) - (TIER_ORDER[b.id] ?? 9),
  );
}

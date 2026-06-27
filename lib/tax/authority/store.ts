// Authority store (L4 retrieval substrate). Replaces the 6-entry toy lib/ai/authority.ts.
//
// An AuthorityChunk is a unit of PRIMARY authority (statute / regulation / IRS guidance)
// carrying MANDATORY provenance metadata. retrieve() is the single deterministic lookup
// the reasoning layer uses: it FILTERS by tax year and jurisdiction FIRST, drops any
// superseded chunk, and only THEN ranks the survivors by keyword overlap — so a query
// can never surface a wrong-year, wrong-jurisdiction, or stale-law chunk. Retrieval
// returns ONLY corpus chunks, so the model can never invent authority ("no citation,
// no claim" is enforced downstream in lib/ai/reasoning.ts against these chunkIds).
//
// Model-free by construction: nothing here imports from lib/ai/*. Pure functions only.

import { z } from "zod";
import { type Jurisdiction, jurisdictionSchema } from "../types";
import { CORPUS_2025 } from "./corpus-2025";
import { CORPUS_OBBBA } from "../../research/corpus-obbba";
import { CORPUS_INGESTED } from "../../research/corpus-ingested";
import { CORPUS_CASELAW } from "../../research/corpus-caselaw";
import { CORPUS_MULTISTATE } from "../../research/corpus-multistate";
import { CORPUS_SUBSECTIONS } from "../../research/corpus-subsections";
import { CORPUS_FULLTEXT } from "../../research/corpus-fulltext";

export type AuthorityType = "statute" | "regulation" | "irs_guidance" | "case" | "form_instruction";

// One operative rule of primary authority + its provenance. The fields the reasoning /
// verifier / faithfulness layers read (chunkId, citation, text, taxYear) are kept so this
// type is a drop-in superset of the old toy AuthorityChunk; the remaining fields are the
// mandatory metadata the store filters and ranks on and an auditor would demand.
export type AuthorityChunk = {
  chunkId: string; // stable, resolvable id the model may cite
  authorityType: AuthorityType; // what KIND of authority this is
  citation: string; // the legal cite string a preparer writes on a workpaper
  jurisdiction: Jurisdiction; // "federal" | "CA"
  taxYear: number[]; // every tax year this chunk's rule applies to (non-empty)
  effectiveDate: string; // ISO date the rule took effect
  supersededBy?: string; // cite of the authority that replaced this one (audit metadata; absent ⇒ no known successor)
  // The FIRST tax year the successor rule governs. A chunk is correct for years BEFORE this and
  // dropped from this year on. Absent ⇒ fall back to supersededBy as an absolute supersession
  // flag (no year-aware override). Example: the pre-OBBBA flat $10k SALT cap was correct through
  // 2024 and only superseded FROM 2025, so it carries supersededFrom: 2025.
  supersededFrom?: number;
  // The LAST tax year a genuine STATUTORY SUNSET provision applies (it terminates for years after this).
  // EXPLICIT — never inferred from taxYear (a permanent provision whose corpus only loaded 2024-2025 is
  // NOT expired). Only a real sunset (e.g. the OBBBA tips/overtime deductions terminate after 2028) sets
  // it. Drives the point-in-time lifecycle answer ("X applied through <sunsetAfter>, gone after").
  sunsetAfter?: number;
  sourceUrl: string; // official, free primary source (uscode.house.gov / irs.gov / leginfo…)
  ingestedAt: string; // ISO timestamp the chunk entered the store (audit trail)
  text: string; // concise public-domain paraphrase of the operative rule
  keywords: string[]; // retrieval terms (lowercase)
  // ── §6662 weighting metadata (the spine's authority-weighting inputs). OPTIONAL so legacy chunks
  // and thin paraphrases still validate; populated by the fetch path + ingest, read by the future
  // weight-of-authorities engine. Absent ⇒ derive a coarse class from authorityType. ──
  precedential?: boolean; // false ⇒ never SOLE substantial authority (PLR/TAM/Tax Court Summary Opinion)
  authorityClass?: number; // §6662 substantial-authority rank (lower = stronger: statute < reg < case < guidance)
  delegationBasis?: "express" | "general_7805" | "skidmore"; // post-Loper-Bright reg delegation strength
  courtLevel?: "tax" | "district" | "circuit" | "supreme"; // for case authority
  circuit?: string; // controlling circuit for a holding (e.g. "9", "DC", "Fed")
  // NON-FINAL / CONTESTED authority: a live circuit split, a holding the IRS has NOT acquiesced to, or a
  // proposed/reserved reg. When the engine GROUNDS an answer in a contested chunk, the law on that point is
  // genuinely open → the answer must HEDGE (bucket "hedge", calibration "unsettled"), not assert. This is the
  // ONLY honest source of "unsettled" — it comes from retrieved non-final authority, never the asker's wording.
  contested?: boolean;
};

// Mandatory-metadata schema. A chunk missing any required field fails validation, so a
// half-populated chunk can never silently enter the corpus.
export const authorityChunkSchema = z.object({
  chunkId: z.string().min(1),
  authorityType: z.enum(["statute", "regulation", "irs_guidance", "case", "form_instruction"]),
  citation: z.string().min(1),
  jurisdiction: jurisdictionSchema,
  taxYear: z.array(z.number().int()).min(1, "a chunk must apply to at least one tax year"),
  effectiveDate: z.string().min(1),
  supersededBy: z.string().optional(),
  supersededFrom: z.number().int().optional(),
  sunsetAfter: z.number().int().optional(),
  sourceUrl: z.string().url(),
  ingestedAt: z.string().min(1),
  text: z.string().min(1),
  keywords: z.array(z.string()),
  // §6662 weighting metadata — optional (see the type); a chunk without them stays valid.
  precedential: z.boolean().optional(),
  authorityClass: z.number().int().optional(),
  delegationBasis: z.enum(["express", "general_7805", "skidmore"]).optional(),
  courtLevel: z.enum(["tax", "district", "circuit", "supreme"]).optional(),
  circuit: z.string().optional(),
  contested: z.boolean().optional(), // non-final authority (circuit split / non-acquiescence) ⇒ engine hedges
});

export type RetrieveOpts = {
  taxYear: number;
  jurisdiction: Jurisdiction;
  k?: number;
};

// The registered default corpus retrieve() searches: the TY2025 starter corpus PLUS the
// OBBBA-era corpus that carries the post-OBBBA figures (and their superseded pre-OBBBA
// probes). Combining them here is what "registers" the OBBBA chunks — a caller that does
// retrieve(query, opts) with no explicit corpus now sees the OBBBA rules, and the year +
// supersession filter still guarantees a stale pre-OBBBA chunk can never surface for an
// in-scope year. (CORPUS_OBBBA's ObbbaAuthorityChunk is a structural superset of
// AuthorityChunk, so it slots in without widening the type.)
export const REGISTERED_CORPUS: AuthorityChunk[] = [...CORPUS_2025, ...CORPUS_OBBBA, ...CORPUS_INGESTED, ...CORPUS_CASELAW, ...CORPUS_MULTISTATE, ...CORPUS_SUBSECTIONS, ...CORPUS_FULLTEXT];

// retrieve(query, {taxYear, jurisdiction, k}). Order is load-bearing:
//   1. FILTER: keep only chunks whose taxYear list includes the requested year AND whose
//      jurisdiction matches AND which are eligible for the year (YEAR-AWARE supersession —
//      see isEligibleForYear). (Filter BEFORE ranking so a high-keyword-overlap wrong-year/stale
//      chunk can never crowd out a correct one.)
//   2. RANK: score the survivors by SPECIFICITY-WEIGHTED keyword overlap (a rare/long or
//      section-number keyword outweighs a common one like "deduction"), drop zero-score chunks
//      (no spurious authority), sort, and take the top k.

// Year-aware supersession (BUG 2). A chunk that carries supersededFrom is correct for years
// BEFORE that year and dropped from that year on — so the pre-OBBBA $10k SALT rule (supersededFrom:
// 2025) is eligible for ≤2024 and dropped for ≥2025. supersededBy alone is AUDIT METADATA and does
// NOT gate eligibility; only supersededFrom does. A chunk with neither is always eligible (its
// taxYear list already bounds it). This replaces the old absolute "supersededBy !== undefined ⇒
// drop", which wrongly excluded a rule that was correct for its own pre-supersession years.
function isEligibleForYear(c: AuthorityChunk, year: number): boolean {
  return c.supersededFrom === undefined ? true : year < c.supersededFrom;
}

// Specificity-weighted keyword score (BUG 3). A keyword hit is worth more when the keyword is
// rare/long (a section number like "164", a distinctive phrase like "state and local tax")
// than when it is a common tax word ("deduction", "limitation") that many tangential chunks
// share. score = Σ over matched keywords of (1 + (kw.length ≥ 5 ? 1 : 0)), plus +2 if the query
// contains the chunk's governing section number — so an on-point §164 SALT chunk ranks above a
// tangential "deduction limitation" chunk that merely ties on common-word hits.
const SECTION_RE = /§?\s?(\d{1,4}[A-Za-z]?)/g;
function sectionNumbersOf(chunk: AuthorityChunk): string[] {
  const out = new Set<string>();
  for (const m of chunk.citation.matchAll(SECTION_RE)) out.add(m[1].toLowerCase());
  for (const kw of chunk.keywords) if (/^\d{2,4}[a-z]?$/.test(kw)) out.add(kw.toLowerCase());
  return [...out];
}
// Corpus-wide document frequency per keyword (memoized per corpus reference) — an IDF-style signal so a
// COMMON keyword ("deduction", "income", in many chunks) contributes LESS than a DISTINCTIVE one ("sham",
// "economic substance", "carryforward"). This stops tangential common-word matches (e.g. §6694/§165 on
// "deduction") from out-ranking on-point doctrine/authority for conceptual (no-section-number) queries.
const _docFreqCache = new WeakMap<AuthorityChunk[], Map<string, number>>();
function docFreq(corpus: AuthorityChunk[]): Map<string, number> {
  const cached = _docFreqCache.get(corpus);
  if (cached) return cached;
  const m = new Map<string, number>();
  for (const c of corpus) {
    for (const kw of new Set(c.keywords.map((k) => k.toLowerCase()))) m.set(kw, (m.get(kw) ?? 0) + 1);
  }
  _docFreqCache.set(corpus, m);
  return m;
}
// Gentle rarity multiplier: distinctive keywords keep full weight; genuinely common ones are damped. The
// section-number bonus below is NOT damped (a named §-cite is always a strong, intended signal).
function rarityFactor(df: number): number {
  return df >= 10 ? 0.4 : df >= 5 ? 0.7 : 1.0;
}
// FULL-TEXT overlap (Phase-1: raw statute chunks have only sparse auto-keywords, so keyword-list matching can't
// find them for a conceptual query — but their TEXT contains the query's terms). Count distinct significant query
// terms appearing in the chunk's body, weighted below a keyword hit and capped so a long raw window can't bury a
// section-named match. Lowercased text is cached per chunk (computed once, reused across queries).
const _lcText = new WeakMap<AuthorityChunk, string>();
function lcText(c: AuthorityChunk): string {
  let t = _lcText.get(c);
  if (t === undefined) { t = c.text.toLowerCase(); _lcText.set(c, t); }
  return t;
}
const STOP_Q = new Set("about above after again against because before being between both during each first found from have here into more most much only other over same shall should some such than that their them then there these they this those through under until very what when where which while will with would your".split(" "));
export function queryTerms(q: string): string[] {
  return [...new Set(q.match(/[a-z][a-z-]{4,}/g) ?? [])].filter((t) => !STOP_Q.has(t));
}
function specificityScore(chunk: AuthorityChunk, q: string, df: Map<string, number>, qTerms: string[]): number {
  let score = chunk.keywords.reduce((s, kw) => {
    if (!q.includes(kw)) return s;
    const base = 1 + (kw.length >= 5 ? 1 : 0);
    return s + base * rarityFactor(df.get(kw.toLowerCase()) ?? 1);
  }, 0);
  // +2 when the query NAMES this chunk's section number (e.g. a "§164" query → the §164 chunk).
  if (sectionNumbersOf(chunk).some((sec) => q.includes(sec))) score += 2;
  // FULL-TEXT chunks ONLY: a body-term-overlap signal (raw statute chunks have sparse keywords, so they can't be
  // found by keyword matching) PLUS a fallback discount. Gating both on the full-text tier leaves the curated
  // corpus (OBBBA / cases / distilled) ranking EXACTLY as before — so full-text fills genuine gaps without
  // crowding out a precise curated chunk (the §70201 tips chunk, the Cohan case) that also matches.
  // BODY-TEXT overlap for EVERY chunk: count distinct query terms present in the chunk's text (a BM25-like signal
  // — the answer lives in the body, not the sparse keyword list). A modest per-hit weight + a cap keeps it from
  // overwhelming the section bonus, while letting the on-point distilled chunk (whose body matches the question's
  // terms) surface over a tangential keyword match. (Tiering still puts the full-text tier below curated.)
  if (qTerms.length) {
    const body = lcText(chunk);
    let hits = 0;
    for (const t of qTerms) if (body.includes(t)) hits++;
    score += Math.min(hits, 6) * 0.4;
  }
  return score;
}

export function retrieve(
  query: string,
  opts: RetrieveOpts,
  corpus: AuthorityChunk[] = REGISTERED_CORPUS,
): AuthorityChunk[] {
  const { taxYear, jurisdiction, k = 3 } = opts;
  const q = query.toLowerCase();

  // 1 — year + jurisdiction + YEAR-AWARE supersession filter (BEFORE any ranking).
  const eligible = corpus.filter(
    (c) =>
      c.jurisdiction === jurisdiction &&
      c.taxYear.includes(taxYear) &&
      isEligibleForYear(c, taxYear),
  );

  // 2 — specificity-weighted keyword-overlap rank over the eligible set only. Document frequency is computed
  //     over the FULL corpus (not the year-filtered subset) so a keyword's rarity is stable across years.
  const df = docFreq(corpus);
  const qTerms = queryTerms(q);
  const scored = eligible
    .map((c) => ({ c, score: specificityScore(c, q, df, qTerms) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  // TIERED retrieval: high-precision CURATED authority first (its ranking is exactly as before the full-text
  // corpus existed), then raw FULL-TEXT chunks ONLY to fill the remaining slots. So the full-text corpus adds
  // COVERAGE for empty areas without ever crowding out a curated chunk that matches (the §70201 tips chunk, the
  // Cohan case, the entity §-chunks). When a curated chunk exists, the full-text is invisible.
  const curated = scored.filter((x) => !x.c.chunkId.startsWith("fulltext-"));
  const fulltext = scored.filter((x) => x.c.chunkId.startsWith("fulltext-"));
  return [...curated, ...fulltext].slice(0, k).map((x) => x.c);
}

export type LifecycleHit = { chunk: AuthorityChunk; boundaryYear: number; firstYear: number };

// LIFECYCLE / point-in-time fallback. retrieve() is correctly year-filtered, so for a year past a genuine
// statutory SUNSET it returns nothing and the engine abstains — yet "is X available in <year>?" past X's
// sunset is DETERMINABLE ("no — it terminated after <sunsetAfter>"). This finds a STRONGLY-matching SUNSET
// provision (explicit sunsetAfter, NEVER inferred from taxYear — a permanent rule whose corpus only loaded
// a couple years has no sunsetAfter and is left to honestly abstain) whose sunset is before the asked year.
// Used ONLY when normal retrieval came back empty, so it can never alter an in-year answer; confidence-gated.
const LIFECYCLE_MIN_SCORE = 3;
export function retrieveLifecycle(
  query: string,
  opts: { taxYear: number; jurisdiction: Jurisdiction },
  corpus: AuthorityChunk[] = REGISTERED_CORPUS,
): LifecycleHit | null {
  const { taxYear, jurisdiction } = opts;
  const q = query.toLowerCase();
  const df = docFreq(corpus);
  const qTerms = queryTerms(q);
  const top = corpus
    .filter(
      (c) =>
        c.jurisdiction === jurisdiction &&
        c.sunsetAfter !== undefined && // EXPLICIT statutory sunset only — never inferred from taxYear
        taxYear > c.sunsetAfter && // the asked year is past the sunset
        c.supersededFrom === undefined, // a REPLACED rule is amended, not expired
    )
    .map((c) => ({ c, score: specificityScore(c, q, df, qTerms) }))
    .filter((x) => x.score >= LIFECYCLE_MIN_SCORE)
    .sort((a, b) => b.score - a.score)[0];
  if (!top) return null;
  return { chunk: top.c, boundaryYear: top.c.sunsetAfter!, firstYear: Math.min(...top.c.taxYear) };
}

// FABRICATION GUARD (named forms). A question that asks to DESCRIBE a specifically-named form/schedule
// ("what goes on the new Schedule TIP?", "what's on Form 1099-OBBBA?") must be grounded in authority that
// actually NAMES that form. Semantically-adjacent authority — e.g. the tips-DEDUCTION statute (§224) for
// a "Schedule TIP" query — does NOT establish a FORM, and narrating boxes onto it is fabrication, the
// single worst failure for a cited-and-abstaining engine (measured: graph dense recall does this ~40% of
// the time on the Schedule-TIP probe). Returns the unestablished form name to DECLINE on (force a
// coverage_gap), or null. The name is checked against the retrieved AUTHORITY text ONLY — never the
// question, which is where the suspect name comes from. Common real forms are allowlisted so ordinary
// "what goes on Form 1040 / Schedule C" questions still answer.
const FORM_NAME_RE = /\b(?:Schedule|Form)\s+[0-9A-Z][0-9A-Za-z-]*\b/g;
const FORM_DESCRIBE_INTENT = /what\s+(?:information|data|boxes|line)|how\s+(?:do|to)\b[^.?]*\bfill|the\s+new\s+(?:schedule|form)\b/i;
const KNOWN_REAL_FORMS = new Set([
  "form 1040", "form 1040-sr", "form 1040-x", "form 1040-es", "form 1040-nr",
  "schedule a", "schedule b", "schedule c", "schedule d", "schedule e", "schedule f", "schedule se",
  "schedule 1", "schedule 2", "schedule 3", "schedule 8812",
  "form w-2", "form w-4", "form w-9", "form 1098", "form 1116", "form 2441", "form 4562", "form 4797",
  "form 1099", "form 1099-misc", "form 1099-nec", "form 1099-int", "form 1099-div", "form 1099-r",
  "form 1099-g", "form 1099-k", "form 1099-b", "form 1099-s", "form 8949", "form 8863", "form 8889",
  "form 8995", "form 8995-a", "form 6251", "form 8275",
]);
export function unestablishedNamedForm(question: string, retrieved: { text: string }[]): string | null {
  if (!FORM_DESCRIBE_INTENT.test(question)) return null;
  const names = question.match(FORM_NAME_RE);
  if (!names) return null;
  const haystack = retrieved.map((c) => c.text.toLowerCase()).join("\n");
  for (const name of names) {
    const lc = name.toLowerCase().replace(/\s+/g, " ");
    if (KNOWN_REAL_FORMS.has(lc)) continue; // a real form — not a fabrication candidate
    if (!haystack.includes(lc)) return name; // a named form no retrieved authority establishes → decline
  }
  return null;
}

export { CORPUS_2025 } from "./corpus-2025";
export { CORPUS_OBBBA } from "../../research/corpus-obbba";

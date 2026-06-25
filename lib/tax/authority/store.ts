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
export const REGISTERED_CORPUS: AuthorityChunk[] = [...CORPUS_2025, ...CORPUS_OBBBA, ...CORPUS_INGESTED];

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
function specificityScore(chunk: AuthorityChunk, q: string): number {
  let score = chunk.keywords.reduce(
    (s, kw) => s + (q.includes(kw) ? 1 + (kw.length >= 5 ? 1 : 0) : 0),
    0,
  );
  // +2 when the query names this chunk's section number (e.g. a "§164" query → the §164 chunk).
  if (sectionNumbersOf(chunk).some((sec) => q.includes(sec))) score += 2;
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

  // 2 — specificity-weighted keyword-overlap rank over the eligible set only.
  return eligible
    .map((c) => ({ c, score: specificityScore(c, q) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((x) => x.c);
}

export { CORPUS_2025 } from "./corpus-2025";
export { CORPUS_OBBBA } from "../../research/corpus-obbba";

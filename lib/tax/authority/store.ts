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
import type { Jurisdiction } from "../types";
import { CORPUS_2025 } from "./corpus-2025";

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
  supersededBy?: string; // cite of the authority that replaced this one (absent ⇒ current)
  sourceUrl: string; // official, free primary source (uscode.house.gov / irs.gov / leginfo…)
  ingestedAt: string; // ISO timestamp the chunk entered the store (audit trail)
  text: string; // concise public-domain paraphrase of the operative rule
  keywords: string[]; // retrieval terms (lowercase)
};

// Mandatory-metadata schema. A chunk missing any required field fails validation, so a
// half-populated chunk can never silently enter the corpus.
export const authorityChunkSchema = z.object({
  chunkId: z.string().min(1),
  authorityType: z.enum(["statute", "regulation", "irs_guidance", "case", "form_instruction"]),
  citation: z.string().min(1),
  jurisdiction: z.enum(["federal", "CA"]),
  taxYear: z.array(z.number().int()).min(1, "a chunk must apply to at least one tax year"),
  effectiveDate: z.string().min(1),
  supersededBy: z.string().optional(),
  sourceUrl: z.string().url(),
  ingestedAt: z.string().min(1),
  text: z.string().min(1),
  keywords: z.array(z.string()),
});

export type RetrieveOpts = {
  taxYear: number;
  jurisdiction: Jurisdiction;
  k?: number;
};

// retrieve(query, {taxYear, jurisdiction, k}). Order is load-bearing:
//   1. FILTER: keep only chunks whose taxYear list includes the requested year AND whose
//      jurisdiction matches AND which are not superseded. (Filter BEFORE ranking so a
//      high-keyword-overlap wrong-year/stale chunk can never crowd out a correct one.)
//   2. RANK: score the survivors by keyword overlap with the query, drop zero-score
//      chunks (no spurious authority), sort, and take the top k.
export function retrieve(
  query: string,
  opts: RetrieveOpts,
  corpus: AuthorityChunk[] = CORPUS_2025,
): AuthorityChunk[] {
  const { taxYear, jurisdiction, k = 3 } = opts;
  const q = query.toLowerCase();

  // 1 — year + jurisdiction + supersession filter (BEFORE any ranking).
  const eligible = corpus.filter(
    (c) =>
      c.jurisdiction === jurisdiction &&
      c.taxYear.includes(taxYear) &&
      c.supersededBy === undefined,
  );

  // 2 — keyword-overlap rank over the eligible set only.
  return eligible
    .map((c) => ({ c, score: c.keywords.reduce((s, kw) => s + (q.includes(kw) ? 1 : 0), 0) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((x) => x.c);
}

export { CORPUS_2025 } from "./corpus-2025";

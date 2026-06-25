import type { AuthorityChunk } from "@/lib/tax/authority/store";
import { pickSources, type FetchSource } from "./registry";

// Map a fetch source to the authority KIND for the synthetic chunk (drives display + tiering).
const TYPE_BY_SOURCE: Record<string, AuthorityChunk["authorityType"]> = {
  govinfo: "statute",
  "tax-court": "case",
};

/**
 * Retrieve-on-demand: fetch PRIMARY authority for a coverage gap and wrap it as AuthorityChunks the
 * engine reasons + grounds over exactly like corpus chunks (so a fetched answer is verified by the
 * same citation/figure gate). §7216 is enforced inside each source's search(); HONEST DEGRADATION —
 * any source or getText failure is swallowed (skip that hit), and an EMPTY return tells the engine to
 * abstain rather than guess. `sources` is injectable for tests (no network).
 */
export async function fetchPrimary(
  question: string,
  taxYear: number,
  jurisdiction: AuthorityChunk["jurisdiction"],
  opts: { sources?: FetchSource[]; signal?: AbortSignal; maxChunks?: number; nowIso?: string } = {},
): Promise<AuthorityChunk[]> {
  const sources = opts.sources ?? pickSources(question);
  if (!sources.length) return [];
  const max = opts.maxChunks ?? 3;
  const nowIso = opts.nowIso ?? new Date().toISOString();
  const chunks: AuthorityChunk[] = [];
  for (const src of sources) {
    let hits;
    try {
      hits = await src.search(question, { signal: opts.signal });
    } catch {
      continue; // a source failure (network, or a §7216-rejected query) → try the next, never throw out
    }
    for (const hit of hits) {
      if (chunks.length >= max) break;
      let text: string;
      try {
        text = await hit.getText();
      } catch {
        continue; // getText not wired / the document fetch failed → skip this hit honestly
      }
      const clean = text.trim();
      if (clean.length < 80) continue; // too thin to ground a position in
      chunks.push({
        chunkId: `fetched-${hit.source}-${chunks.length}`,
        authorityType: TYPE_BY_SOURCE[hit.source] ?? "statute",
        citation: hit.citation || hit.title,
        jurisdiction,
        taxYear: [taxYear],
        effectiveDate: `${taxYear}-01-01`,
        sourceUrl: hit.sourceUrl,
        ingestedAt: nowIso,
        text: clean.slice(0, 8000),
        keywords: [],
      });
    }
    if (chunks.length) break; // grounded from the top-authority source; don't pull lower tiers too
  }
  return chunks;
}

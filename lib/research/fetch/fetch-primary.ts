import type { AuthorityChunk } from "@/lib/tax/authority/store";
import type { AIProvider } from "@/lib/ai/provider";
import { pickSources, type FetchSource } from "./registry";

// Map a fetch source to the authority KIND for the synthetic chunk. This drives the §6662 weighting's
// kind-specific logic: a "case" gets the court-level + contrary-controlling-in-circuit-holding invariant;
// a "regulation" gets the post-Loper-Bright delegation factor; "irs_guidance" weighs below statute/reg/
// case. Mislabeling everything "statute" (the old default) silently overweighted regs, cases, and PLRs.
const TYPE_BY_SOURCE: Record<string, AuthorityChunk["authorityType"]> = {
  // statute (+ treaty, on par with statute under §7852(d); + enacted state law)
  govinfo: "statute",
  "congress-gov": "statute",
  treaty: "statute",
  openstates: "statute",
  "ca-conformity": "statute",
  // regulations
  ecfr: "regulation",
  "federal-register": "regulation",
  // courts — MUST be "case" so the contrary-controlling-in-circuit-holding invariant + court-level apply
  courtlistener: "case",
  "cap-caselaw": "case",
  "tax-court": "case",
  // IRS agency guidance (weighs below statute/reg/case; PLR/TAM carry precedential=false → never sole authority)
  "irs-irb": "irs_guidance",
  "irs-drop": "irs_guidance",
  "irs-wd": "irs_guidance",
  "irs-pub": "irs_guidance",
  irm: "irs_guidance",
  // accounting CONTEXT, not tax authority — weakest kind so it can never outrank a real tax source
  "sec-edgar": "form_instruction",
};

// ── DISTILL: the model abstains over raw statute (dense legalese); it grounds clean PARAPHRASES.
// So before the engine reasons, boil each fetched primary text down to a concise operative-rule
// paraphrase RELEVANT to the question — using ONLY facts in the source — and figure-gate it (mirrors
// the ingest pipeline). A paraphrase that invents a figure not in the source, or that the model marks
// not-relevant, is dropped. ──
const DISTILL_SYS =
  "You distill US tax PRIMARY AUTHORITY for a research engine. You are given a QUESTION and the SOURCE " +
  "TEXT of ONE statute, regulation, or case. Write a concise operative-rule paraphrase (2-4 plain-English " +
  "sentences) stating what the source provides ON THE QUESTION'S TOPIC, the way a tax preparer would note " +
  "it. The source IS relevant whenever it is the Code section / provision the question is about — set " +
  "relevant:false ONLY if the text is a COMPLETELY UNRELATED provision. Use ONLY facts and figures that " +
  "appear in the SOURCE TEXT — never add a number, threshold, rate, or year from your own knowledge; if " +
  "the source states the rule but not a specific figure the question asks for, paraphrase the rule and " +
  'omit the figure. Output STRICT JSON only: {"relevant": boolean, "text": string}.';

// Every $/%/year figure's numeric core in the paraphrase must appear in the source (same gate as ingest).
function figureCores(text: string): string[] {
  return [...text.matchAll(/\$?\d[\d,]*(?:\.\d+)?\s?%?|\b(?:19|20)\d{2}\b/g)]
    .map((m) => m[0].replace(/[^\d.]/g, ""))
    .filter((n) => n.length >= 2 && n !== ".");
}
const digitsOf = (s: string) => s.replace(/[^\d.]/g, "");

// When a question cites a SUBSECTION (e.g. §163(j)), the operative rule can live DEEP in a huge statute —
// §163 is 107k chars and subsection (j)'s 30%-of-ATI limit starts at ~char 31k, past a naive head-slice, so
// the engine never sees it (the §163(j) settled-law miss). Re-center the window on the cited subsection when
// it begins beyond the head-slice; otherwise keep the head (the section opener wins for an early subsection).
function sliceForQuestion(text: string, question: string, max: number): string {
  if (text.length <= max) return text;
  const m = question.match(/(?:§\s*\d+|\bsection\s+\d+|\birc\s+\d+)\s*\(([a-z])\)/i);
  if (m) {
    const sub = m[1].toLowerCase();
    // subsection HEADER pattern "(j) Limitation..." — the letter then a Capitalized title. USC text is
    // SPACE-separated (no newlines before subsections), and the capital avoids matching cross-references
    // like "subsection (j) shall".
    const idx = text.search(new RegExp(`\\(${sub}\\)\\s+[A-Z]`));
    if (idx > max - 2000) {
      const start = Math.max(0, idx - 300);
      return text.slice(start, start + max);
    }
  }
  return text.slice(0, max);
}

async function distill(provider: AIProvider, question: string, chunks: AuthorityChunk[]): Promise<AuthorityChunk[]> {
  // PARALLEL: each chunk's distill is an INDEPENDENT model call. Run them concurrently (Promise.all
  // preserves array order) instead of one-at-a-time — same paraphrases, same relevance + figure-leak
  // gates, same surviving chunks in the same order; only the wall-clock collapses from N serial
  // round-trips to one. Quality is byte-identical; this is pure latency.
  const distilled = await Promise.all(
    chunks.map(async (c): Promise<AuthorityChunk | null> => {
      let parsed: { relevant?: unknown; text?: unknown };
      try {
        const { text } = await provider.generateText({
          system: DISTILL_SYS,
          prompt: `QUESTION: ${question}\n\nSOURCE TEXT (${c.citation}):\n${c.text}`,
          maxTokens: 600,
        });
        parsed = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
      } catch {
        return null; // non-JSON / model failure → skip this chunk honestly
      }
      const para = typeof parsed.text === "string" ? parsed.text.trim() : "";
      if (parsed.relevant === false || para.length < 30) return null;
      const src = digitsOf(c.text);
      const leaks = figureCores(para).filter((f) => !src.includes(f));
      if (leaks.length) return null; // the paraphrase invented a figure not in the source → drop (honest)
      return { ...c, text: para };
    }),
  );
  return distilled.filter((c): c is AuthorityChunk => c !== null);
}

/**
 * Retrieve-on-demand: fetch PRIMARY authority for a coverage gap and (when a `provider` is given)
 * distill it into clean, figure-grounded chunks the engine can reason over — exactly like corpus
 * chunks, so a fetched answer is verified by the same gates. §7216 is enforced inside each source's
 * search(); HONEST DEGRADATION — any source/getText/distill failure is swallowed (skip that hit), and
 * an EMPTY return tells the engine to abstain rather than guess. `sources`/`provider` are injectable.
 */
export async function fetchPrimary(
  question: string,
  taxYear: number,
  jurisdiction: AuthorityChunk["jurisdiction"],
  opts: { sources?: FetchSource[]; provider?: AIProvider; signal?: AbortSignal; maxChunks?: number; nowIso?: string } = {},
): Promise<AuthorityChunk[]> {
  const sources = opts.sources ?? pickSources(question);
  if (!sources.length) return [];
  const max = opts.maxChunks ?? 3;
  const nowIso = opts.nowIso ?? new Date().toISOString();
  // PARALLEL search: the per-source HTTP searches are independent, so fire them CONCURRENTLY instead of
  // one-at-a-time. Each result stays PAIRED with its source and Promise.all preserves array order, so the
  // authority-priority semantics are UNCHANGED — we still process sources in rank order below and the
  // first (highest-authority) source whose content distills on-topic wins. Sources are already pre-
  // filtered by pickSources (only matchers that fire), so this is a handful of concurrent calls, not 16.
  const searched = await Promise.all(
    sources.map(async (src) => {
      try {
        return await src.search(question, { signal: opts.signal });
      } catch {
        return []; // a source failure (network, or a §7216-rejected query) → empty, never throw out
      }
    }),
  );
  // Walk the searched sources in authority order; the first that yields relevant, distilled authority wins.
  for (const hits of searched) {
    if (!hits.length) continue;
    // PARALLEL getText for the top candidates (a small over-fetch covers thin/failed docs), then keep the
    // first `max` that pass the length gate IN ORDER — byte-identical to the chunks the serial loop built,
    // including the positional chunkIds, just fetched concurrently.
    const fetched = await Promise.all(
      hits.slice(0, max + 2).map(async (hit) => {
        try {
          const clean = (await hit.getText()).trim();
          return clean.length >= 80 ? { hit, clean } : null; // too thin to ground a position in
        } catch {
          return null; // getText not wired / the document fetch failed → skip this hit honestly
        }
      }),
    );
    const raw: AuthorityChunk[] = [];
    for (const f of fetched) {
      if (!f || raw.length >= max) continue;
      raw.push({
        chunkId: `fetched-${f.hit.source}-${raw.length}`,
        authorityType: TYPE_BY_SOURCE[f.hit.source] ?? "statute",
        citation: f.hit.citation || f.hit.title,
        jurisdiction,
        taxYear: [taxYear],
        effectiveDate: `${taxYear}-01-01`,
        sourceUrl: f.hit.sourceUrl,
        ingestedAt: nowIso,
        text: sliceForQuestion(f.clean, question, 8000),
        keywords: [],
        // Preserve the weighting signal the source already computed (was discarded before): the
        // §6662 authority rank and whether it may stand as sole authority (a proposed rule / PLR /
        // non-precedential opinion = false). The future weight-of-authorities engine reads these.
        authorityClass: f.hit.authorityTier,
        precedential: f.hit.precedential,
      });
    }
    if (!raw.length) continue;
    const out = opts.provider ? await distill(opts.provider, question, raw) : raw;
    if (out.length) return out; // on-topic, distilled authority from the highest-authority source that has it
  }
  return [];
}

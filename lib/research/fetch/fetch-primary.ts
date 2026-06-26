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

async function distill(provider: AIProvider, question: string, chunks: AuthorityChunk[]): Promise<AuthorityChunk[]> {
  const out: AuthorityChunk[] = [];
  for (const c of chunks) {
    let parsed: { relevant?: unknown; text?: unknown };
    try {
      const { text } = await provider.generateText({
        system: DISTILL_SYS,
        prompt: `QUESTION: ${question}\n\nSOURCE TEXT (${c.citation}):\n${c.text}`,
        maxTokens: 600,
      });
      parsed = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
    } catch {
      continue; // non-JSON / model failure → skip this chunk honestly
    }
    const para = typeof parsed.text === "string" ? parsed.text.trim() : "";
    if (parsed.relevant === false || para.length < 30) continue;
    const src = digitsOf(c.text);
    const leaks = figureCores(para).filter((f) => !src.includes(f));
    if (leaks.length) continue; // the paraphrase invented a figure not in the source → drop (honest)
    out.push({ ...c, text: para });
  }
  return out;
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
  // Try sources in authority order. A source that returns RAW chunks but whose content doesn't
  // DISTILL to anything on-topic (e.g. GovInfo's tangential 2024-edition §224 for a brand-new OBBBA
  // §224 question) must fall through to the next source — not stop the search. The first source that
  // yields relevant, distilled authority wins.
  for (const src of sources) {
    let hits;
    try {
      hits = await src.search(question, { signal: opts.signal });
    } catch {
      continue; // a source failure (network, or a §7216-rejected query) → try the next, never throw out
    }
    const raw: AuthorityChunk[] = [];
    for (const hit of hits) {
      if (raw.length >= max) break;
      let text: string;
      try {
        text = await hit.getText();
      } catch {
        continue; // getText not wired / the document fetch failed → skip this hit honestly
      }
      const clean = text.trim();
      if (clean.length < 80) continue; // too thin to ground a position in
      raw.push({
        chunkId: `fetched-${hit.source}-${raw.length}`,
        authorityType: TYPE_BY_SOURCE[hit.source] ?? "statute",
        citation: hit.citation || hit.title,
        jurisdiction,
        taxYear: [taxYear],
        effectiveDate: `${taxYear}-01-01`,
        sourceUrl: hit.sourceUrl,
        ingestedAt: nowIso,
        text: clean.slice(0, 8000),
        keywords: [],
        // Preserve the weighting signal the source already computed (was discarded before): the
        // §6662 authority rank and whether it may stand as sole authority (a proposed rule / PLR /
        // non-precedential opinion = false). The future weight-of-authorities engine reads these.
        authorityClass: hit.authorityTier,
        precedential: hit.precedential,
      });
    }
    if (!raw.length) continue;
    const out = opts.provider ? await distill(opts.provider, question, raw) : raw;
    if (out.length) return out; // on-topic, distilled authority from the highest-authority source that has it
  }
  return [];
}

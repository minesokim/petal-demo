// Retrieve-on-demand source (keyless): the Internal Revenue Manual (IRM) — the IRS's internal
// procedural handbook (examination, collection, penalty, appeals procedures). HTML scrape of irs.gov:
// the per-part index at /irm/part{N} lists every section's {number, title, URL}; each section lives at
// /irm/part{N}/irm_{NN-NNN-NNN} (zero-padded part-chapter-section, sometimes with an "r" revised
// suffix). stripHtml the article body to ground in.
//
// AUTHORITY SIGNAL: the IRM is INTERNAL PROCEDURE, not substantive authority for a taxpayer position —
// it binds IRS employees, not taxpayers or courts, and confers no rights a taxpayer can rely on
// (see IRM 4.10.1 / Fargo v. Commissioner line). So every hit is tagged authorityTier 4 (agency
// guidance) AND precedential=false: the engine may cite it to explain HOW the IRS proceeds, never as
// the basis for a position. Public IRS data only — queries are topic terms / IRM citations, never
// taxpayer PII, so §7216-clean.
//
// The IRM has no topic-search API (irs.gov's site search 403s bots), so — like the IRB source — we
// fetch the per-part INDEX and scan its section TITLES for the topic terms, or resolve a specific IRM
// citation directly via that same index (which carries the exact URL, including the "r" suffix the
// bare guessed form 404s without). Bounded by design (default 3 section fetches).

import { stripHtml } from "./govinfo";

const IRM_HOST = "https://www.irs.gov";

const UA = { "user-agent": "PetalResearch/1.0 (tax-research)" } as const;

export type Hit = {
  source: string;
  title: string;
  citation: string;
  sourceUrl: string;
  authorityTier: number;
  precedential?: boolean;
  getText: () => Promise<string>;
};

// A parsed entry from a part index: the IRM section number ("4.10.1"), its title, and its real URL
// (carries the "r" revised suffix when present — the bare form 404s, so we must use the index URL).
export type IrmIndexEntry = { number: string; title: string; url: string };

// A normalized IRM citation pulled from a question: part / chapter / section, plus the original text.
export type IrmRef = { part: number; chapter: number; section: number; cite: string };

// Does this question fit the IRM? An explicit IRM citation ("IRM 4.10.1", "I.R.M. 20.1.5"), the
// manual's name, or — paired with a procedure word — a topic the IRM governs: how the IRS examines,
// audits, assesses penalties, collects, or runs Appeals. These are "how does the IRS handle X
// procedurally" questions, which the substantive sources (statute/reg/case) don't answer.
export function matchesIrm(q: string): boolean {
  if (irmRefsFromQuery(q).length > 0) return true;
  if (/\b(internal revenue manual|i\.?\s?r\.?\s?m\.?)\b/i.test(q)) return true;
  // procedural-shape: a "how does the IRS do X" / examination-process question.
  return (
    /\b(examination|examiner|audit procedure|audit process|how (does|do) the irs|irs procedure|reasonable cause|penalty (abatement|relief)|collection (procedure|process)|appeals (procedure|process|conference)|revenue (officer|agent)|field exam|correspondence exam|statute of limitations procedure|first[-\s]?time abate)\b/i.test(
      q,
    )
  );
}

// Extract IRM section citations from a question. The IRM is cited as a dotted number "4.10.1" (part.
// chapter.section), usually prefixed "IRM" / "I.R.M." — we require that prefix so a bare dotted number
// (which could be a reg cite "1.199A-3" or a dollar amount) is NOT mis-read as IRM. Deeper subsection
// digits ("4.10.1.2.1") are tolerated but only the leading three address the section page.
export function irmRefsFromQuery(question: string): IrmRef[] {
  const refs: IrmRef[] = [];
  const seen = new Set<string>();
  const re = /\b(?:i\.?\s?r\.?\s?m\.?|internal revenue manual)\s*(?:section\s*)?(\d{1,2})\.(\d{1,3})\.(\d{1,3})(?:\.\d{1,3})*/gi;
  for (const m of question.matchAll(re)) {
    const part = Number(m[1]);
    const chapter = Number(m[2]);
    const section = Number(m[3]);
    if (part < 1 || part > 39) continue; // IRM parts run 1–39
    const cite = `IRM ${part}.${chapter}.${section}`;
    if (!seen.has(cite)) {
      seen.add(cite);
      refs.push({ part, chapter, section, cite });
    }
  }
  return refs;
}

// Build the per-part index URL.
export function irmPartIndexUrl(part: number): string {
  return `${IRM_HOST}/irm/part${part}`;
}

// Build the canonical (no-suffix) section URL from a ref. Note: REVISED sections live at a "...r"
// URL and the bare form 404s, so prefer the URL the index carries; this is the fallback/initial guess.
export function irmSectionUrl(ref: { part: number; chapter: number; section: number }): string {
  const p2 = String(ref.part).padStart(2, "0");
  const c3 = String(ref.chapter).padStart(3, "0");
  const s3 = String(ref.section).padStart(3, "0");
  return `${IRM_HOST}/irm/part${ref.part}/irm_${p2}-${c3}-${s3}`;
}

// Parse a part-index page (HTML) → its section entries {number, title, url}, in document order. The
// index renders each section as an anchor `<a href=".../irm_NN-NNN-NNN[r]">N.N.N Title</a>`; we read
// the dotted number + title out of the anchor text and keep the href verbatim (so the "r" suffix is
// preserved). Deduped by URL.
export function parseIrmPartIndex(indexHtml: string): IrmIndexEntry[] {
  const out: IrmIndexEntry[] = [];
  const seen = new Set<string>();
  const re = /<a[^>]+href="([^"]*\/irm_\d{2}-\d{3}-\d{3}[a-z]?)"[^>]*>([\s\S]*?)<\/a>/gi;
  for (const m of indexHtml.matchAll(re)) {
    const href = m[1].startsWith("http") ? m[1] : `${IRM_HOST}${m[1]}`;
    if (seen.has(href)) continue;
    const text = stripHtml(m[2]);
    const nm = text.match(/^(\d{1,2}(?:\.\d{1,3})+)\s+(.*)$/);
    const number = nm ? nm[1] : "";
    const title = nm ? nm[2].trim() : text.trim();
    if (!title) continue;
    seen.add(href);
    out.push({ number, title, url: href });
  }
  return out;
}

// Strip an IRM section page to just its article body (the IRS site wraps the manual text in ~160KB of
// nav/footer chrome). We isolate the `<article about="/irm/...">` block and cut at the IRS footer
// boilerplate ("Page Last Reviewed"), then tag-strip. Falls back to a whole-page strip if the article
// markers aren't found (so a markup change degrades, not breaks).
export function extractIrmBody(html: string): string {
  let region = html;
  const a = html.search(/<article\b[^>]*about="\/irm\//i);
  if (a >= 0) {
    region = html.slice(a);
    const foot = region.search(/Page Last Reviewed|More Internal Revenue Manual/i);
    if (foot > 0) region = region.slice(0, foot);
  }
  return stripHtml(region);
}

// Fetch + strip a single IRM section's body text. Throws on a non-OK response or text too short to
// ground (→ honest abstain upstream).
export async function fetchIrmSectionText(url: string, opts: { signal?: AbortSignal; fetchImpl?: typeof fetch } = {}): Promise<string> {
  const f = opts.fetchImpl ?? fetch;
  const res = await f(url, { signal: opts.signal, headers: { accept: "text/html", ...UA } });
  if (!res.ok) throw new Error(`IRM section ${res.status} for ${url}`);
  const text = extractIrmBody(await res.text());
  if (text.length < 200) throw new Error(`IRM section text too short to ground: ${url}`);
  return text;
}

// Fetch and parse a part index, returning its section entries (newest URL form preserved). Throws on a
// non-OK response so a part-fetch failure abstains honestly rather than silently returning nothing.
export async function fetchIrmPartIndex(part: number, opts: { signal?: AbortSignal; fetchImpl?: typeof fetch } = {}): Promise<IrmIndexEntry[]> {
  const f = opts.fetchImpl ?? fetch;
  const res = await f(irmPartIndexUrl(part), { signal: opts.signal, headers: { accept: "text/html", ...UA } });
  if (!res.ok) throw new Error(`IRM part ${part} index ${res.status}`);
  return parseIrmPartIndex(await res.text());
}

// Map a question's topic words to IRM parts to scan. The IRM is 39 parts; scanning all of them per
// question is wasteful, so we route by the procedure topic to the part(s) that house it. Unknown
// topics fall back to Part 4 (Examining Process) + Part 20 (Penalty & Interest) — the two parts a
// preparer-research question most often needs.
const TOPIC_PARTS: { test: RegExp; parts: number[] }[] = [
  { test: /\b(penalt|abat|reasonable cause|first[-\s]?time|accuracy[-\s]?related|interest)\b/i, parts: [20] },
  { test: /\b(collect|levy|lien|installment agreement|offer in compromise|revenue officer|seizure)\b/i, parts: [5] },
  { test: /\b(appeal|appeals|conference|settlement|protest)\b/i, parts: [8] },
  { test: /\b(exam|examin|audit|revenue agent|field exam|correspondence exam)\b/i, parts: [4] },
  { test: /\b(account|transcript|adjustment|refund|processing)\b/i, parts: [21] },
];
export function irmPartsForQuery(question: string): number[] {
  const parts = new Set<number>();
  for (const { test, parts: ps } of TOPIC_PARTS) if (test.test(question)) ps.forEach((p) => parts.add(p));
  if (parts.size === 0) {
    parts.add(4);
    parts.add(20);
  }
  return [...parts];
}

// Reduce a question to the distinctive topic terms used to score a section TITLE — drop the procedure
// framing/stopwords so "how does the IRS abate the accuracy-related penalty" scores section titles on
// "abate"/"accuracy"/"penalty", not "does"/"the"/"irs".
const STOP = new Set(
  ("how does do did the a an is are was what when which who irm internal revenue manual section irs taxpayer client " +
    "procedure procedures process for of to in on under with and or about regarding handle does")
    .split(/\s+/),
);
export function irmQueryTerms(question: string): string[] {
  return [
    ...new Set(
      question
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length >= 4 && !STOP.has(w)),
    ),
  ];
}

// Score an index entry's title against the query terms: count of distinct terms present, with a small
// bonus for the longest (most distinctive) term so a precise topic word outranks a generic one.
function scoreTitle(title: string, terms: string[], distinctive: string[]): number {
  const lower = title.toLowerCase();
  let s = terms.filter((t) => lower.includes(t)).length;
  if (distinctive.some((d) => lower.includes(d))) s += 1;
  return s;
}

/**
 * Search the IRM for the procedure on a topic, or resolve a specific IRM citation, returning grounded
 * hits. Two paths:
 *  1) The question names a section ("IRM 4.10.1") → resolve its EXACT URL from the part index (so the
 *     "r" revised suffix is right) and ground in that section's full body.
 *  2) Topic question → fetch the routed part index(es), score section TITLES by the topic terms, and
 *     ground in the top sections' bodies.
 * Every hit is tier 4 + precedential=false (internal procedure, never substantive authority).
 * Bounded by `maxSections` (default 3). `fetchImpl` injectable for tests.
 */
export async function searchIrm(query: string, opts: { signal?: AbortSignal; fetchImpl?: typeof fetch; maxSections?: number } = {}): Promise<Hit[]> {
  const f = opts.fetchImpl ?? fetch;
  const max = opts.maxSections ?? 3;

  // ── Path 1: explicit IRM citation(s) → resolve exact URL via the part index, ground full section.
  const refs = irmRefsFromQuery(query);
  if (refs.length) {
    const hits: Hit[] = [];
    for (const ref of refs.slice(0, max)) {
      let entry: IrmIndexEntry | undefined;
      try {
        const index = await fetchIrmPartIndex(ref.part, { signal: opts.signal, fetchImpl: f });
        entry = index.find((e) => e.number === `${ref.part}.${ref.chapter}.${ref.section}`);
      } catch {
        /* index unavailable → fall back to the guessed canonical URL below */
      }
      const url = entry?.url ?? irmSectionUrl(ref);
      const title = entry?.title ? `${ref.cite} ${entry.title}` : ref.cite;
      hits.push(makeHit(ref.cite, title, url, f, opts.signal));
    }
    return hits;
  }

  // ── Path 2: topic search → scan routed part index(es), score TITLES, ground top sections.
  const terms = irmQueryTerms(query);
  const distinctive = [...terms].sort((a, b) => b.length - a.length).slice(0, 2);
  const scored: { entry: IrmIndexEntry; score: number }[] = [];
  for (const part of irmPartsForQuery(query)) {
    let index: IrmIndexEntry[];
    try {
      index = await fetchIrmPartIndex(part, { signal: opts.signal, fetchImpl: f });
    } catch {
      continue; // a part-index fetch failure → skip it honestly
    }
    for (const entry of index) {
      const score = scoreTitle(entry.title, terms, distinctive);
      if (score > 0) scored.push({ entry, score });
    }
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, max).map(({ entry }) => {
    const cite = entry.number ? `IRM ${entry.number}` : "Internal Revenue Manual";
    return makeHit(cite, entry.number ? `${cite} ${entry.title}` : entry.title, entry.url, f, opts.signal);
  });
}

// Build a Hit for an IRM section. Tier 4 + precedential=false: the IRM is internal procedure that
// binds IRS employees only — it is NOT authority for a taxpayer position and must never be cited as
// precedent. getText pulls the full section body (throws if too short → honest abstain).
function makeHit(citation: string, title: string, url: string, f: typeof fetch, signal?: AbortSignal): Hit {
  return {
    source: "irm",
    title,
    citation,
    sourceUrl: url,
    authorityTier: 4, // agency procedural guidance — below statute/reg/case
    precedential: false, // internal procedure: never citable as authority for a position
    getText: () => fetchIrmSectionText(url, { signal, fetchImpl: f }),
  };
}

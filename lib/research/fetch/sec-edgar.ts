// Retrieve-on-demand source (keyless): SEC EDGAR — public-company filings (10-K / 10-Q / 8-K) and
// the structured XBRL financial facts behind them. A company name or ticker resolves to a CIK via the
// official company_tickers.json map; submissions/CIK##########.json lists that filer's recent filings;
// each filing's primary document is plain public HTML we strip to text to ground in.
//
// AUTHORITY NOTE: an SEC filing is NOT tax authority. It is the company's own disclosure prepared
// under US GAAP / SEC rules — so the tag it carries is ACCOUNTING-STANDARD CONTEXT (tier 4, secondary),
// and precedential=false (a 10-K is never citable as legal precedent the way a statute/reg/case is).
// It answers "what did Company X report / how did they account for Y", not "what does the Code require".
//
// Public US-government data only — queries are company names / form types / topic keywords, never
// taxpayer PII — so this is §7216-clean (public scope). SEC asks every client to send a descriptive
// User-Agent identifying the requester; we do (PetalResearch/1.0 + contact). No API key required.

import { stripHtml } from "./govinfo";

const SEC_TICKERS = "https://www.sec.gov/files/company_tickers.json";
const SEC_SUBMISSIONS = "https://data.sec.gov/submissions";
const SEC_ARCHIVES = "https://www.sec.gov/Archives/edgar/data";

// SEC requires a descriptive UA (a contact). Anonymous/library-default UAs get 403'd.
const SEC_UA = "PetalResearch/1.0 (tax-research; contact: research@petal.tax)";
function secHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return { accept: "application/json", "user-agent": SEC_UA, ...extra };
}

// The filing forms we surface. 10-K = annual report, 10-Q = quarterly, 8-K = material-event report.
// (EDGAR carries hundreds of form types — Forms 3/4/5 insider trades, SC 13D, etc. — but the periodic
// reports are where the financial-statement / accounting-treatment text a tax question wants lives.)
const TARGET_FORMS = new Set(["10-K", "10-K/A", "10-Q", "10-Q/A", "8-K", "8-K/A"]);

export type SecFiling = {
  company: string; // entity name, e.g. "Apple Inc."
  cik: number; // numeric CIK (un-padded)
  ticker: string; // primary ticker if known, else ""
  form: string; // "10-K" | "10-Q" | "8-K" | ...
  filingDate: string; // YYYY-MM-DD
  reportDate: string; // period of report, YYYY-MM-DD
  accession: string; // "0000320193-25-000079"
  primaryDoc: string; // primary document filename within the filing folder
  description: string; // primaryDocDescription, e.g. "10-K"
  sourceUrl: string; // resolvable URL to the primary filing document
};

// ── name → CIK resolution ──────────────────────────────────────────────────────────────────────
// company_tickers.json is a small (~1MB) object keyed by index: { "0": {cik_str, ticker, title}, ... }.
// We cache it per-process; it changes rarely and one fetch serves every company lookup in a session.
type TickerRow = { cik_str: number; ticker: string; title: string };
let tickerCache: TickerRow[] | null = null;

async function loadTickers(f: typeof fetch, signal?: AbortSignal): Promise<TickerRow[]> {
  if (tickerCache) return tickerCache;
  const res = await f(SEC_TICKERS, { signal, headers: secHeaders() });
  if (!res.ok) throw new Error(`SEC company_tickers HTTP ${res.status}`);
  const data = (await res.json()) as Record<string, TickerRow>;
  tickerCache = Object.values(data);
  return tickerCache;
}

// Zero-pad a numeric CIK to the 10-digit form the submissions/XBRL endpoints require.
export function padCik(cik: number | string): string {
  return String(cik).replace(/\D/g, "").padStart(10, "0");
}

// Resolve a company name OR ticker to its EDGAR row. Exact ticker match wins (unambiguous); else an
// exact title match; else the first title that contains the candidate (so "Apple" → "Apple Inc.").
// Returns null when nothing resembles a known filer (→ caller returns no hits, honest no-source).
export async function resolveCik(
  candidate: string,
  opts: { signal?: AbortSignal; fetchImpl?: typeof fetch } = {},
): Promise<TickerRow | null> {
  const f = opts.fetchImpl ?? fetch;
  const rows = await loadTickers(f, opts.signal);
  const q = candidate.trim().toLowerCase();
  if (!q) return null;
  const byTicker = rows.find((r) => r.ticker.toLowerCase() === q);
  if (byTicker) return byTicker;
  const byTitle = rows.find((r) => r.title.toLowerCase() === q);
  if (byTitle) return byTitle;
  // Loose contains, preferring the shortest title (closest to the bare company name).
  const contains = rows
    .filter((r) => r.title.toLowerCase().includes(q) && q.length >= 3)
    .sort((a, b) => a.title.length - b.title.length);
  return contains[0] ?? null;
}

// ── query reduction ────────────────────────────────────────────────────────────────────────────
// Don't search the raw question. Pull out (a) the COMPANY (a $TICKER, a quoted "Name", or a
// Capitalized name immediately before a filing/financial cue) and (b) the FORM type. Mirrors the way
// statuteQuery/caseQuery reduce to the precise key instead of the sentence.

// Known equity tickers people actually ask about — used to recognize a bare-uppercase token as a
// ticker (so "AAPL revenue" resolves) without treating every capitalized word as one. The full
// universe is resolved live against company_tickers.json; this is just the cheap recognizer.
const FORM_RE = /\b(10[-\s]?k|10[-\s]?q|8[-\s]?k|annual report|quarterly report|current report)\b/i;

function normalizeForm(token: string): string | null {
  const t = token.toLowerCase().replace(/[\s-]+/g, ""); // drop spaces AND dashes: "10-K" → "10k"
  if (t.includes("10k") || t.includes("annual")) return "10-K";
  if (t.includes("10q") || t.includes("quarterly")) return "10-Q";
  if (t.includes("8k") || t.includes("current")) return "8-K";
  return null;
}

// Leading filler words a Capitalized-phrase capture can grab before the real company name ("Show me
// Microsoft ..." → "Show me Microsoft"). Strip them off the FRONT so only the company token(s) remain.
const CUE_FILLER = new Set([
  "show", "me", "get", "find", "what", "whats", "what's", "tell", "give", "the", "latest", "recent",
  "most", "view", "see", "read", "pull", "fetch", "look", "up", "in", "did", "does", "report", "reports",
]);
function stripCueFiller(phrase: string): string {
  const words = phrase.trim().split(/\s+/);
  while (words.length > 1 && CUE_FILLER.has(words[0].toLowerCase())) words.shift();
  return words.join(" ");
}

export type SecQuery = { company: string; form: string | null };

// Reduce a question to { company, form }. company is the best name/ticker candidate; form is the
// requested filing type (null ⇒ no form filter, return the most recent target filings).
export function secEdgarQuery(question: string): SecQuery {
  // 1) explicit $TICKER (e.g. "$AAPL")
  const dollar = question.match(/\$([A-Za-z]{1,5})\b/);
  // 2) a quoted company name ("Berkshire Hathaway")
  const quoted = question.match(/["“]([^"”]{2,60})["”]/);
  // 3) a Capitalized name right before a corporate suffix (Inc/Corp/Co/LLC/Ltd/PLC/Holdings/Group)
  const suffixed = question.match(
    /\b([A-Z][A-Za-z.&'-]+(?:\s+[A-Z][A-Za-z.&'-]+){0,4}\s+(?:Inc|Corp|Co|Company|Corporation|LLC|L\.L\.C|Ltd|PLC|Holdings|Group|Technologies|Systems|Motors)\.?)\b/,
  );
  // 4) a bare uppercase token that looks like a ticker (2–5 letters, not a common word)
  const bareTicker = question.match(/\b([A-Z]{2,5})\b/);
  // 5) a Capitalized word/phrase sitting just before a filing/financial cue ("Apple's 10-K",
  //    "Tesla quarterly report") — resolved live against company_tickers.json's contains-match. The
  //    company group stays CASE-SENSITIVE (no /i — otherwise the [A-Z][a-z]+ run greedily eats a
  //    lowercase filler word like "latest"); the cue alternation is matched against a pre-lowercased
  //    copy via its own group. We capture the trailing Capitalized run immediately before any
  //    latest/recent/annual filler + the cue, so leading words ("Show me ...") aren't pulled in.
  const nearCue = question.match(
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})(?:['’]s)?\s+(?:(?:the\s+)?(?:latest|recent|most recent|annual|quarterly)\s+)?(?:10[-\s]?[kqKQ]|8[-\s]?[kK]|annual report|quarterly report|filing|filed|sec filing|earnings|revenue)\b/,
  );

  let company = "";
  if (dollar) company = dollar[1];
  else if (quoted) company = quoted[1];
  else if (suffixed) company = suffixed[1].replace(/\.$/, "");
  else if (bareTicker && !COMMON_CAPS.has(bareTicker[1])) company = bareTicker[1];
  else if (nearCue) company = stripCueFiller(nearCue[1]);

  const formMatch = question.match(FORM_RE);
  const form = formMatch ? normalizeForm(formMatch[1]) : null;
  // Fallback: a filing question that named a company NOT adjacent to the cue ("What did Apple disclose in
  // its 10-K") would otherwise lose it. Grab the first non-filler Capitalized word so it still resolves.
  if (!company && (formMatch || /\b(filing|filed|disclos\w*|earnings|revenue|sec)\b/i.test(question))) {
    for (const m of question.matchAll(/\b([A-Z][a-z]{2,})\b/g)) {
      const w = m[1];
      if (!CUE_FILLER.has(w.toLowerCase()) && !COMMON_CAPS.has(w.toUpperCase())) { company = w; break; }
    }
  }
  return { company: company.trim(), form };
}

// Uppercase tokens that are words, not tickers — so "SEC", "GAAP", "EDGAR", "USA" don't get resolved
// as a company. (A real ticker collision like "ALL" or "KEY" still resolves live against the map; this
// only blocks obvious English/acronym false positives the cheap recognizer would otherwise grab.)
const COMMON_CAPS = new Set([
  "SEC", "EDGAR", "GAAP", "IFRS", "FASB", "IRS", "IRC", "USA", "US", "CIK", "XBRL", "EPS", "EBITDA",
  "CEO", "CFO", "FY", "Q1", "Q2", "Q3", "Q4", "AND", "THE", "FOR", "A", "AN", "K", "Q",
]);

// ── matcher ────────────────────────────────────────────────────────────────────────────────────
// Fits when the question is about a PUBLIC COMPANY's SEC disclosures: a form type (10-K/10-Q/8-K),
// an EDGAR/SEC-filing cue, a $TICKER, or a company-financials phrasing (annual/quarterly report,
// "filed with the SEC", a named corp + a financial-statement noun). This is the accounting-standard /
// company-disclosure axis — distinct from the tax-authority sources.
export function matchesSecEdgar(q: string): boolean {
  if (/\b(sec filing|edgar|10[-\s]?k|10[-\s]?q|8[-\s]?k|annual report|quarterly report|form 10|companyfacts|xbrl)\b/i.test(q))
    return true;
  if (/\$[A-Za-z]{1,5}\b/.test(q)) return true; // a $TICKER
  // a named corporation + a disclosure/financial cue
  if (
    /\b(Inc|Corp|Corporation|Company|LLC|Ltd|PLC|Holdings)\b/.test(q) &&
    /\b(filed?|filing|report|disclos\w+|revenue|earnings|balance sheet|income statement|cash flow|10[-\s]?k|annual|quarterly|sec)\b/i.test(q)
  )
    return true;
  return false;
}

// ── search ─────────────────────────────────────────────────────────────────────────────────────
// Resolve the company → CIK, pull its recent submissions, filter to the periodic-report forms (and
// the requested form if the question named one), and return the most recent as Hits. The submissions
// `recent` block stores filings as PARALLEL ARRAYS (form[i], accessionNumber[i], ...), so we zip by index.
type RecentFilings = {
  accessionNumber?: string[];
  filingDate?: string[];
  reportDate?: string[];
  form?: string[];
  primaryDocument?: string[];
  primaryDocDescription?: string[];
};

export async function searchSecEdgar(
  query: string,
  opts: { limit?: number; signal?: AbortSignal; fetchImpl?: typeof fetch } = {},
): Promise<
  {
    source: string;
    title: string;
    citation: string;
    sourceUrl: string;
    authorityTier: number;
    precedential?: boolean;
    getText: () => Promise<string>;
  }[]
> {
  const f = opts.fetchImpl ?? fetch;
  const { company, form } = secEdgarQuery(query);
  if (!company) return []; // no resolvable company → no hits (honest: this source doesn't fit)

  const row = await resolveCik(company, { signal: opts.signal, fetchImpl: f });
  if (!row) return [];

  const padded = padCik(row.cik_str);
  const subRes = await f(`${SEC_SUBMISSIONS}/CIK${padded}.json`, { signal: opts.signal, headers: secHeaders() });
  if (!subRes.ok) throw new Error(`SEC submissions HTTP ${subRes.status}`);
  const sub = (await subRes.json()) as {
    name?: string;
    tickers?: string[];
    filings?: { recent?: RecentFilings };
  };
  const recent = sub.filings?.recent ?? {};
  const forms = recent.form ?? [];
  const company_name = sub.name ?? row.title;
  const ticker = sub.tickers?.[0] ?? row.ticker ?? "";

  const filings: SecFiling[] = [];
  for (let i = 0; i < forms.length; i++) {
    const fm = forms[i];
    if (!TARGET_FORMS.has(fm)) continue;
    if (form && !fm.startsWith(form)) continue; // requested form filter (10-K matches "10-K" and "10-K/A")
    const accession = recent.accessionNumber?.[i] ?? "";
    const primaryDoc = recent.primaryDocument?.[i] ?? "";
    if (!accession || !primaryDoc) continue;
    const accNoDash = accession.replace(/-/g, "");
    filings.push({
      company: company_name,
      cik: row.cik_str,
      ticker,
      form: fm,
      filingDate: recent.filingDate?.[i] ?? "",
      reportDate: recent.reportDate?.[i] ?? "",
      accession,
      primaryDoc,
      description: recent.primaryDocDescription?.[i] ?? fm,
      sourceUrl: `${SEC_ARCHIVES}/${row.cik_str}/${accNoDash}/${primaryDoc}`,
    });
    if (filings.length >= (opts.limit ?? 4)) break;
  }

  return filings.map((flg) => ({
    source: "sec-edgar",
    title: `${flg.company} — ${flg.form} (${flg.reportDate || flg.filingDate})`,
    citation: `${flg.company} ${flg.form}${flg.ticker ? ` (${flg.ticker})` : ""}, filed ${flg.filingDate} (SEC EDGAR, accession ${flg.accession})`,
    sourceUrl: flg.sourceUrl,
    authorityTier: 4, // company disclosure under GAAP/SEC rules — accounting-standard CONTEXT, not tax authority
    precedential: false, // an SEC filing is never citable as legal precedent
    getText: () => fetchFilingText(flg.sourceUrl, { signal: opts.signal, fetchImpl: f }),
  }));
}

// ── primary text ───────────────────────────────────────────────────────────────────────────────
// Fetch the primary filing document and return readable text. Modern primary docs are inline-XBRL
// HTML (10-K/10-Q/8-K), which stripHtml flattens to plain text; older or alternate filings can be
// PDFs, which we extract via unpdf (same path as tax-court.ts). Throws on empty/too-short text so the
// engine abstains honestly rather than grounding on nothing.
export async function fetchFilingText(
  url: string,
  opts: { signal?: AbortSignal; fetchImpl?: typeof fetch } = {},
): Promise<string> {
  const f = opts.fetchImpl ?? fetch;
  const res = await f(url, { signal: opts.signal, headers: { "user-agent": SEC_UA } });
  if (!res.ok) throw new Error(`SEC filing HTTP ${res.status} for ${url}`);

  if (/\.pdf(\?|$)/i.test(url)) {
    const bytes = new Uint8Array(await res.arrayBuffer());
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(bytes);
    const { text } = await extractText(pdf, { mergePages: true });
    const joined = (typeof text === "string" ? text : (text as string[]).join("\n")).trim();
    if (joined.length < 200) throw new Error("SEC filing PDF text too short to ground → abstain");
    return joined;
  }

  const text = stripHtml(await res.text());
  if (text.length < 200) throw new Error("SEC filing text too short to ground → abstain");
  return text;
}

// ── XBRL companyfacts: structured financial facts (optional, accounting-standard context) ────────
// data.sec.gov/api/xbrl/companyfacts/CIK##########.json returns the company's tagged facts keyed by
// taxonomy (us-gaap, dei) → concept → units → array of period values. Useful to GROUND a specific
// reported figure ("Apple's FY2025 revenue") in the exact XBRL-tagged value, with its accession +
// fiscal period. Returns the matched concept's most recent values; throws if the concept isn't tagged.
export type XbrlFact = { concept: string; label: string; unit: string; value: number; start?: string; end: string; form: string; fy?: number; fp?: string; accn: string };

export async function fetchXbrlConcept(
  cik: number | string,
  concept: string,
  opts: { signal?: AbortSignal; fetchImpl?: typeof fetch; limit?: number } = {},
): Promise<XbrlFact[]> {
  const f = opts.fetchImpl ?? fetch;
  const padded = padCik(cik);
  const res = await f(`https://data.sec.gov/api/xbrl/companyfacts/CIK${padded}.json`, {
    signal: opts.signal,
    headers: secHeaders(),
  });
  if (!res.ok) throw new Error(`SEC companyfacts HTTP ${res.status}`);
  const data = (await res.json()) as {
    facts?: Record<string, Record<string, { label?: string; units?: Record<string, { val: number; start?: string; end: string; form: string; fy?: number; fp?: string; accn: string }[]> }>>;
  };
  const facts = data.facts ?? {};
  for (const taxonomy of Object.keys(facts)) {
    const node = facts[taxonomy]?.[concept];
    if (!node?.units) continue;
    const out: XbrlFact[] = [];
    for (const unit of Object.keys(node.units)) {
      for (const v of node.units[unit]) {
        out.push({ concept, label: node.label ?? concept, unit, value: v.val, start: v.start, end: v.end, form: v.form, fy: v.fy, fp: v.fp, accn: v.accn });
      }
    }
    out.sort((a, b) => (a.end < b.end ? 1 : -1)); // most recent first
    return out.slice(0, opts.limit ?? 8);
  }
  throw new Error(`SEC XBRL concept "${concept}" not tagged for CIK ${padded}`);
}

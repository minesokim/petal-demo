// Retrieve-on-demand source (key-gated): Congress.gov + GovInfo — the LEGISLATIVE-HISTORY axis.
// Committee & conference reports (CRPT: H./S. Rept.), enacted-bill text + status, and the JCT
// references those reports carry. This is the "why Congress wrote it this way" layer: a committee
// report or the JCT explanation is the controlling legislative history a court reaches for when a
// Code section is ambiguous (e.g. the OBBBA-2025 provisions whose statutory text is terse but whose
// committee report spells out intent).
//
// THE SEARCH NUANCE (verified live): Congress.gov's /v3/committee-report endpoint has NO usable
// full-text search — its `q=` param is ignored (the unfiltered 20k-report list comes back identical
// with or without it). The working full-text path for reports is GovInfo's /search with
// `collection:(CRPT)`, which IS relevancy-ranked and returns the on-topic report granule (reused from
// ./govinfo). So: TOPIC questions full-text-search CRPT via GovInfo; a question naming a SPECIFIC bill
// ("H.R. 1", "S. 123") or report ("H. Rept. 119-1") is resolved by its identifier via the Congress.gov
// REST detail endpoints (which DO work by id). Both grounding paths pull real primary text.
//
// Public US-government data only — the query is a Code section / topic / bill number, never taxpayer
// PII, so this is §7216-clean. Requires the free api.data.gov key in GOVINFO_API_KEY (shared by
// GovInfo + Congress.gov). fetch is injectable for tests.

import { searchGovInfo, statuteQuery, stripHtml, type GovInfoResult } from "./govinfo";

const CONGRESS_BASE = "https://api.congress.gov/v3";

// The plain Hit shape the registry expects (do NOT import FetchHit from ./registry — avoid the cycle).
export type Hit = {
  source: string;
  title: string;
  citation: string;
  sourceUrl: string;
  authorityTier: number;
  precedential?: boolean;
  getText: () => Promise<string>;
};

function apiKey(explicit?: string): string {
  const k = explicit ?? process.env.GOVINFO_API_KEY;
  if (!k) throw new Error("GOVINFO_API_KEY is not set"); // shared api.data.gov key (GovInfo + Congress.gov)
  return k;
}

const UA = "PetalResearch/1.0 (tax-research)";

// ── Matcher: does this question want legislative history? ──────────────────────────────────────────
// Signals: an explicit committee/conference report cite ("H. Rept. 119-1", "conference report"), a
// bill number ("H.R. 1", "S. 123"), the JCT / Bluebook (the Joint Committee on Taxation's General
// Explanation — the canonical post-enactment legislative history for tax), or the words "legislative
// history" / "committee report" / "enacted". Bill numbers are required to look like real cites
// (chamber prefix + digits) so a bare "1" never trips it.
export function congressGovMatches(q: string): boolean {
  return (
    /\b(h\.?\s?r\.?\s?rept|s\.?\s?rept|h\.?\s?rept|house report|senate report|committee report|conference report|conf\.?\s?rept)\b/i.test(q) ||
    /\b(legislative history|legislative intent|joint committee on taxation|jct|bluebook|blue book|general explanation)\b/i.test(q) ||
    /\b(h\.?\s?r\.?|s\.?|h\.?\s?j\.?\s?res\.?|s\.?\s?j\.?\s?res\.?)\s?\d{1,5}\b/i.test(q) // a real bill number
  );
}

// ── A specific bill reference: congress + type + number. ────────────────────────────────────────
// Extract "H.R. 1", "S. 123", "H.J.Res. 7" (case/space/dot insensitive). Congress defaults to the
// current one (119th, the OBBBA Congress) unless the question names it ("116th Congress", "in the
// 119th"). The Congress.gov REST path wants a lowercased type slug (hr, s, hjres, sjres, hconres,
// sconres, hres, sres).
export type BillRef = { congress: number; type: string; number: number };

export function billRefFromQuery(question: string): BillRef | null {
  // Order matters: match the longer joint-resolution / concurrent forms before the bare H.R./S.
  const m = question.match(
    /\b(h\.?\s?j\.?\s?res\.?|s\.?\s?j\.?\s?res\.?|h\.?\s?con\.?\s?res\.?|s\.?\s?con\.?\s?res\.?|h\.?\s?res\.?|s\.?\s?res\.?|h\.?\s?r\.?|s\.?)\s?(\d{1,5})\b/i,
  );
  if (!m) return null;
  const raw = m[1].toLowerCase().replace(/[.\s]/g, ""); // "h.r." → "hr", "s.j.res." → "sjres"
  const typeMap: Record<string, string> = {
    hr: "hr",
    s: "s",
    hjres: "hjres",
    sjres: "sjres",
    hconres: "hconres",
    sconres: "sconres",
    hres: "hres",
    sres: "sres",
  };
  const type = typeMap[raw];
  if (!type) return null;
  const number = Number(m[2]);
  if (!Number.isFinite(number) || number < 1) return null;
  const cm = question.match(/\b(\d{2,3})(?:st|nd|rd|th)\s+congress\b/i);
  const congress = cm ? Number(cm[1]) : 119; // default: the current (OBBBA) Congress
  return { congress, type, number };
}

// ── A specific committee-report citation: "H. Rept. 119-1", "S. Rept. 118-22". ─────────────────────
// The Congress.gov detail path wants congress + reportType (HRPT|SRPT) + number.
export type ReportRef = { congress: number; reportType: "HRPT" | "SRPT"; number: number };

export function reportRefFromQuery(question: string): ReportRef | null {
  const m = question.match(/\b(h|s)\.?\s?rept\.?\s?(?:no\.?\s?)?(\d{2,3})[-–](\d{1,4})\b/i);
  if (!m) return null;
  const reportType = m[1].toLowerCase() === "h" ? "HRPT" : "SRPT";
  return { congress: Number(m[2]), reportType, number: Number(m[3]) };
}

// ── Bill type → human reporter prefix for the citation line. ───────────────────────────────────────
const BILL_LABEL: Record<string, string> = {
  hr: "H.R.",
  s: "S.",
  hjres: "H.J.Res.",
  sjres: "S.J.Res.",
  hconres: "H.Con.Res.",
  sconres: "S.Con.Res.",
  hres: "H.Res.",
  sres: "S.Res.",
};

type BillDetail = {
  title?: string;
  type?: string;
  number?: string | number;
  congress?: number;
  latestAction?: { actionDate?: string; text?: string };
  laws?: { number?: string; type?: string }[];
  textVersions?: { url?: string };
};

// Fetch a specific bill's metadata + status from the Congress.gov REST API, then resolve its primary
// text (the latest enacted/formatted version) for grounding. Status carries the legislative-history
// payload: latestAction ("Became Public Law No: 119-21") and the laws[] linkage (bill → P.L.).
async function fetchBillHit(ref: BillRef, opts: { signal?: AbortSignal; fetchImpl?: typeof fetch; apiKey?: string }): Promise<Hit | null> {
  const f = opts.fetchImpl ?? fetch;
  const key = apiKey(opts.apiKey);
  const url = `${CONGRESS_BASE}/bill/${ref.congress}/${ref.type}/${ref.number}?api_key=${encodeURIComponent(key)}&format=json`;
  const res = await f(url, { signal: opts.signal, headers: { accept: "application/json", "user-agent": UA } });
  if (!res.ok) {
    if (res.status === 404) return null; // bill doesn't exist (e.g. a fabricated number) → no hit, honest
    throw new Error(`Congress.gov bill ${ref.congress}/${ref.type}/${ref.number} HTTP ${res.status}`);
  }
  const bill = ((await res.json()) as { bill?: BillDetail }).bill;
  if (!bill) return null;

  const label = BILL_LABEL[ref.type] ?? ref.type.toUpperCase();
  const law = bill.laws?.find((l) => l.number);
  const status = bill.latestAction?.text ? ` — ${bill.latestAction.text}` : "";
  const citation = law
    ? `${label} ${ref.number} (${ref.congress}th Cong.), Pub. L. No. ${law.number}`
    : `${label} ${ref.number} (${ref.congress}th Cong.)${status}`;
  const sourceUrl = `https://www.congress.gov/bill/${ref.congress}th-congress/${ref.type === "hr" ? "house-bill" : ref.type === "s" ? "senate-bill" : ref.type}/${ref.number}`;

  return {
    source: "congress-gov",
    title: bill.title ?? `${label} ${ref.number}`,
    citation,
    sourceUrl,
    authorityTier: 1, // a bill that became law is enacted statute; legislative-history weight
    precedential: true,
    getText: async () => {
      const text = await fetchBillText(ref, { signal: opts.signal, fetchImpl: f, apiKey: key });
      if (text.length < 200) throw new Error(`Congress.gov bill ${label} ${ref.number} text too short to ground → abstain`);
      return text;
    },
  };
}

// Resolve a bill's primary text: GET the /text subresource → the latest "Formatted Text" (.htm) URL →
// strip to plain text. Prefers the most recent version (enrolled/enacted ranks last in the list). The
// .htm files are public (no key needed) but we send the UA. Throws when no text version exists.
export async function fetchBillText(
  ref: BillRef,
  opts: { signal?: AbortSignal; fetchImpl?: typeof fetch; apiKey?: string } = {},
): Promise<string> {
  const f = opts.fetchImpl ?? fetch;
  const key = apiKey(opts.apiKey);
  const tv = `${CONGRESS_BASE}/bill/${ref.congress}/${ref.type}/${ref.number}/text?api_key=${encodeURIComponent(key)}&format=json`;
  const res = await f(tv, { signal: opts.signal, headers: { accept: "application/json", "user-agent": UA } });
  if (!res.ok) throw new Error(`Congress.gov bill text ${ref.congress}/${ref.type}/${ref.number} HTTP ${res.status}`);
  const versions = ((await res.json()) as { textVersions?: { formats?: { type?: string; url?: string }[] }[] }).textVersions ?? [];
  // Last version = most recent (enrolled/enacted); prefer its "Formatted Text" (.htm) URL.
  for (const v of [...versions].reverse()) {
    const fmt = v.formats?.find((x) => /formatted text/i.test(x.type ?? "") && /\.htm?$/i.test(x.url ?? ""));
    if (fmt?.url) {
      const html = await f(fmt.url, { signal: opts.signal, headers: { "user-agent": UA } });
      if (!html.ok) continue;
      const text = stripHtml(await html.text());
      if (text.length >= 200) return text.slice(0, 60000); // cap: enacted bills can be 800k+ chars
    }
  }
  throw new Error(`Congress.gov bill ${ref.congress}/${ref.type}/${ref.number} has no usable text version`);
}

// Fetch a specific committee report's primary text via the Congress.gov detail → /text subresource →
// the "Formatted Text" (.htm) URL. Clean, addressable, public.
async function fetchReportHit(ref: ReportRef, opts: { signal?: AbortSignal; fetchImpl?: typeof fetch; apiKey?: string }): Promise<Hit | null> {
  const f = opts.fetchImpl ?? fetch;
  const key = apiKey(opts.apiKey);
  const url = `${CONGRESS_BASE}/committee-report/${ref.congress}/${ref.reportType}/${ref.number}?api_key=${encodeURIComponent(key)}&format=json`;
  const res = await f(url, { signal: opts.signal, headers: { accept: "application/json", "user-agent": UA } });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Congress.gov committee-report ${ref.congress}/${ref.reportType}/${ref.number} HTTP ${res.status}`);
  }
  const rpt = ((await res.json()) as { committeeReports?: Record<string, unknown>[] }).committeeReports?.[0];
  if (!rpt) return null;
  const citation = String(rpt.citation ?? `${ref.reportType === "HRPT" ? "H." : "S."} Rept. ${ref.congress}-${ref.number}`);
  const isConf = Boolean(rpt.isConferenceReport);
  return {
    source: "congress-gov",
    title: `${citation}: ${String(rpt.title ?? "")}`.trim(),
    citation: isConf ? `${citation} (Conf. Rept.)` : citation,
    sourceUrl: `https://www.congress.gov/congressional-report/${ref.congress}th-congress/${ref.reportType === "HRPT" ? "house-report" : "senate-report"}/${ref.number}`,
    authorityTier: 4, // committee report = legislative history (secondary to statute/reg/case)
    precedential: true, // legislative history IS citable (unlike a PLR) — it just isn't binding law
    getText: async () => {
      const text = await fetchReportText(ref, { signal: opts.signal, fetchImpl: f, apiKey: key });
      if (text.length < 200) throw new Error(`Congress.gov ${citation} text too short to ground → abstain`);
      return text;
    },
  };
}

// Resolve a committee report's primary text via its /text subresource (Formatted Text .htm).
export async function fetchReportText(
  ref: ReportRef,
  opts: { signal?: AbortSignal; fetchImpl?: typeof fetch; apiKey?: string } = {},
): Promise<string> {
  const f = opts.fetchImpl ?? fetch;
  const key = apiKey(opts.apiKey);
  const url = `${CONGRESS_BASE}/committee-report/${ref.congress}/${ref.reportType}/${ref.number}/text?api_key=${encodeURIComponent(key)}&format=json`;
  const res = await f(url, { signal: opts.signal, headers: { accept: "application/json", "user-agent": UA } });
  if (!res.ok) throw new Error(`Congress.gov committee-report text ${ref.congress}/${ref.reportType}/${ref.number} HTTP ${res.status}`);
  const items = ((await res.json()) as { text?: { formats?: { type?: string; url?: string }[] }[] }).text ?? [];
  for (const item of items) {
    const fmt = item.formats?.find((x) => /formatted text/i.test(x.type ?? "") && /\.htm?$/i.test(x.url ?? ""));
    if (fmt?.url) {
      const html = await f(fmt.url, { signal: opts.signal, headers: { "user-agent": UA } });
      if (!html.ok) continue;
      const text = stripHtml(await html.text());
      if (text.length >= 200) return text.slice(0, 60000);
    }
  }
  throw new Error(`Congress.gov committee-report ${ref.congress}/${ref.reportType}/${ref.number} has no usable text version`);
}

// ── Topic full-text search for committee/conference reports via GovInfo's CRPT collection. ─────────
// Congress.gov's own report endpoint can't full-text search (its q= is ignored), so we reach for
// GovInfo /search (reused), constrained to collection:(CRPT) and modern packages (publishdate range,
// so we only get reports that actually carry a `txtLink` granule). Query is statute-reduced — the same
// fix as GovInfo/Federal Register: a raw natural-language question returns nothing; "section 168
// bonus depreciation" returns the on-topic report.
const CRPT_SINCE = "2001-01-01"; // modern CRPT packages reliably expose a text granule

async function searchCommitteeReports(
  query: string,
  opts: { pageSize?: number; signal?: AbortSignal; fetchImpl?: typeof fetch; apiKey?: string } = {},
): Promise<Hit[]> {
  const reduced = statuteQuery(query);
  const results: GovInfoResult[] = await searchGovInfo(`publishdate:range(${CRPT_SINCE},) ${reduced}`, {
    collections: ["CRPT"],
    pageSize: opts.pageSize ?? 5,
    apiKey: opts.apiKey,
    fetchImpl: opts.fetchImpl,
    signal: opts.signal,
  });
  return results
    .filter((r): r is GovInfoResult & { textUrl: string } => !!r.textUrl)
    .map((r) => {
      const citation = reportCitationFromPackageId(r.packageId) ?? r.packageId.replace(/^CRPT-/, "").toUpperCase();
      const isConf = /conference report|committee of conference/i.test(r.title);
      return {
        source: "congress-gov",
        title: r.title,
        citation: isConf ? `${citation} (Conf. Rept.)` : citation,
        sourceUrl: r.granuleUrl ?? r.textUrl,
        authorityTier: 4, // legislative history (committee report)
        precedential: true,
        getText: async () => {
          const text = await fetchGovInfoGranuleText(r.textUrl!, { signal: opts.signal, fetchImpl: opts.fetchImpl, apiKey: opts.apiKey });
          if (text.length < 200) throw new Error(`Congress.gov CRPT ${citation} text too short to ground → abstain`);
          return text;
        },
      };
    });
}

// Derive the reporter cite from a GovInfo CRPT package id ("CRPT-114hrpt476" → "H. Rept. 114-476",
// "CRPT-118srpt22" → "S. Rept. 118-22"). The package id is the reliable key — CRPT titles are the
// bill's subject line and never carry the report number, so this is the source of truth for the cite.
export function reportCitationFromPackageId(packageId: string): string | null {
  const m = packageId.match(/^CRPT-(\d{2,3})([hs])rpt(\d{1,4})$/i);
  if (!m) return null;
  return `${m[2].toLowerCase() === "h" ? "H." : "S."} Rept. ${m[1]}-${m[3]}`;
}

// Fetch + strip a GovInfo granule's HTML text (the CRPT `txtLink` is the /htm granule endpoint). The
// api_key is appended (it's an API URL). Mirrors fetchGovInfoText but kept local so the cap applies.
export async function fetchGovInfoGranuleText(
  textUrl: string,
  opts: { signal?: AbortSignal; fetchImpl?: typeof fetch; apiKey?: string } = {},
): Promise<string> {
  const f = opts.fetchImpl ?? fetch;
  const key = apiKey(opts.apiKey);
  const sep = textUrl.includes("?") ? "&" : "?";
  const res = await f(`${textUrl}${sep}api_key=${encodeURIComponent(key)}`, { signal: opts.signal, headers: { "user-agent": UA } });
  if (!res.ok) throw new Error(`GovInfo CRPT granule text ${res.status}`);
  return stripHtml(await res.text()).slice(0, 60000);
}

/**
 * Search Congress.gov / GovInfo for the legislative-history axis. Three routes, in precision order:
 *   1. a SPECIFIC bill ("H.R. 1") → resolve the bill detail + text by id (carries P.L. linkage);
 *   2. a SPECIFIC committee report ("H. Rept. 119-1") → resolve the report detail + text by id;
 *   3. a TOPIC → full-text-search CRPT (committee + conference reports) via GovInfo's collection.
 * Routes 1 and 2 also run their topic search so a "H. Rept. 119-1 on §199A" question still surfaces
 * adjacent reports. Empty/failed text fails closed upstream (honest abstain). fetch + apiKey injectable.
 */
export async function searchCongressGov(
  query: string,
  opts: { signal?: AbortSignal; fetchImpl?: typeof fetch; apiKey?: string } = {},
): Promise<Hit[]> {
  const hits: Hit[] = [];
  const billRef = billRefFromQuery(query);
  if (billRef) {
    try {
      const h = await fetchBillHit(billRef, opts);
      if (h) hits.push(h);
    } catch {
      /* fall through to topic search — don't lose the whole source on one bad id */
    }
  }
  const reportRef = reportRefFromQuery(query);
  if (reportRef) {
    try {
      const h = await fetchReportHit(reportRef, opts);
      if (h) hits.push(h);
    } catch {
      /* fall through to topic search */
    }
  }
  try {
    const topic = await searchCommitteeReports(query, { pageSize: hits.length ? 3 : 5, ...opts });
    hits.push(...topic);
  } catch {
    /* topic search is best-effort; a resolved bill/report still stands */
  }
  return hits;
}

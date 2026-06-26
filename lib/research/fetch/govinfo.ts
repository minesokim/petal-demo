// Retrieve-on-demand source (key-gated): GovInfo (GPO) — the official US Code (USCODE) and public
// laws (PLAW, e.g. OBBBA = P.L. 119-21). This is the highest-value gap-filler: the diagnostic's
// misses (§30D, §25D, OBBBA §70432/§70433) are US Code / public-law text that lives here.
//
// Public US-government data only — no taxpayer PII leaves with the query, so §7216-clean. Requires
// the free api.data.gov key in GOVINFO_API_KEY. fetch is injectable for tests.

const GOVINFO_SEARCH = "https://api.govinfo.gov/search";

// GovInfo's search is relevancy/keyword-based: a full natural-language question ("What are the like-kind
// exchange requirements under IRC section 1031 for real property?") returns ZERO hits, while the targeted
// terms ("section 1031 like-kind exchange real property") return the right granule. So reduce a question to
// statute search terms before querying: pull out the Code section refs, keep the content nouns, drop the
// question framing + stopwords. Verified live: the reduced form returns the §1031 granule; the raw question
// returns nothing.
const QUERY_STOP = new Set(
  ("what whats is are was were the a an how does do did for of to in on under over with and or explain describe " +
    "define when which who whom that this these those my our your their its client clients taxpayer please tell me " +
    "requirement requirements rule rules provide provides apply applies treatment about regarding concerning under " +
    // status/temporal framing — common in "has X been issued / current guidance" questions. Dropping these
    // keeps the query to the section + topic nouns so it matches, instead of pulling noise on "final"/"issued".
    "today issued issue final proposed regulation regulations guidance current currently status been have date " +
    "recent recently latest published updated effective")
    .split(/\s+/),
);
export function statuteQuery(question: string): string {
  const secs = [...question.matchAll(/(?:§+\s*|\bsection\s+|\birc\s+|\b26\s+u\.?\s?s\.?\s?c\.?\s*)(\d+[A-Za-z]?)/gi)]
    .map((m) => `section ${m[1]}`);
  const words = question
    .toLowerCase()
    .replace(/[^a-z0-9§\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !QUERY_STOP.has(w) && !/^\d+$/.test(w) && !w.startsWith("§"));
  const terms = [...new Set([...secs, ...words])];
  return terms.length ? terms.slice(0, 8).join(" ") : question;
}

export type GovInfoResult = {
  title: string;
  collection: string; // USCODE | PLAW | CFR | FR | ...
  dateIssued: string;
  packageId: string;
  granuleUrl?: string; // resultLink — the granule API URL (cite anchor)
  textUrl?: string; // download.txtLink — the authority text (HTML-wrapped)
};

function apiKey(explicit?: string): string {
  const k = explicit ?? process.env.GOVINFO_API_KEY;
  if (!k) throw new Error("GOVINFO_API_KEY is not set");
  return k;
}

export async function searchGovInfo(
  query: string,
  opts: { collections?: string[]; pageSize?: number; apiKey?: string; fetchImpl?: typeof fetch; signal?: AbortSignal } = {},
): Promise<GovInfoResult[]> {
  const f = opts.fetchImpl ?? fetch;
  const collFilter = opts.collections?.length ? `collection:(${opts.collections.join(" ")}) ` : "";
  const res = await f(`${GOVINFO_SEARCH}?api_key=${encodeURIComponent(apiKey(opts.apiKey))}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", accept: "application/json" },
    signal: opts.signal,
    body: JSON.stringify({
      query: `${collFilter}${query}`,
      pageSize: opts.pageSize ?? 5,
      offsetMark: "*",
      sorts: [{ field: "relevancy", sortOrder: "DESC" }],
    }),
  });
  if (!res.ok) throw new Error(`GovInfo API ${res.status}`);
  const data = (await res.json()) as { results?: unknown[] };
  return (data.results ?? []).map(normalizeResult);
}

function normalizeResult(r: unknown): GovInfoResult {
  const o = (r ?? {}) as Record<string, unknown>;
  const dl = (o.download as Record<string, unknown> | undefined) ?? {};
  return {
    title: String(o.title ?? ""),
    collection: String(o.collectionCode ?? ""),
    dateIssued: String(o.dateIssued ?? ""),
    packageId: String(o.packageId ?? ""),
    granuleUrl: o.resultLink ? String(o.resultLink) : undefined,
    textUrl: dl.txtLink ? String(dl.txtLink) : undefined,
  };
}

// Fetch a result's authority text (the txtLink) as PLAIN TEXT for ingestion — GovInfo serves it
// HTML-wrapped, so we strip tags + collapse whitespace. The api_key is appended (the link is an API URL).
export async function fetchGovInfoText(
  textUrl: string,
  opts: { apiKey?: string; fetchImpl?: typeof fetch; signal?: AbortSignal } = {},
): Promise<string> {
  const f = opts.fetchImpl ?? fetch;
  const sep = textUrl.includes("?") ? "&" : "?";
  const res = await f(`${textUrl}${sep}api_key=${encodeURIComponent(apiKey(opts.apiKey))}`, { signal: opts.signal });
  if (!res.ok) throw new Error(`GovInfo text ${res.status}`);
  return stripHtml(await res.text());
}

export function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

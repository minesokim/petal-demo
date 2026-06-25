// Retrieve-on-demand source (key-gated): GovInfo (GPO) — the official US Code (USCODE) and public
// laws (PLAW, e.g. OBBBA = P.L. 119-21). This is the highest-value gap-filler: the diagnostic's
// misses (§30D, §25D, OBBBA §70432/§70433) are US Code / public-law text that lives here.
//
// Public US-government data only — no taxpayer PII leaves with the query, so §7216-clean. Requires
// the free api.data.gov key in GOVINFO_API_KEY. fetch is injectable for tests.

const GOVINFO_SEARCH = "https://api.govinfo.gov/search";

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

// Retrieve-on-demand source (keyless): the US Tax Court via the DAWSON public API — the courts axis.
//
// Closes the single biggest research gap: zero case law. DAWSON is the issuing court's own opinion
// feed (Division "T.C." Opinions, Memorandum Opinions, Summary Opinions) — the densest body of
// tax-specific holdings. For the 3-axis authority model this IS the courts axis, and the
// opinionType + `precedential` flag let the engine rank a T.C. Opinion above a Memo and NEVER cite a
// Summary Opinion as precedent (non-precedential by statute, IRC §7463(b)).
//
// Public US-government data only — queries are topic keywords / docket numbers, never taxpayer PII,
// so this is §7216-clean (public scope). No API key required.

import { extractText, getDocumentProxy } from "unpdf";

const DAWSON_API = "https://public-api.dawson.ustaxcourt.gov/public-api/opinion-search";
const DAWSON_BASE = "https://public-api.dawson.ustaxcourt.gov/public-api";

// eventCode → human opinion type + precedential weight. Summary Opinions are non-precedential by
// IRC §7463(b); Division ("T.C.") Opinions are the court's highest authority; Memorandum Opinions
// apply settled law to facts and are citable but weaker than Division Opinions.
const OPINION_TYPE: Record<string, { label: string; precedential: boolean }> = {
  TCOP: { label: "T.C. Opinion", precedential: true },
  MOP: { label: "T.C. Memo.", precedential: true },
  SOP: { label: "Summary Opinion", precedential: false },
};

export type TaxCourtOpinion = {
  caseCaption: string;
  docketNumber: string;
  opinionType: string; // "T.C. Opinion" | "T.C. Memo." | "Summary Opinion"
  citation: string; // reporter cite pulled from the title, e.g. "T.C. Memo. 2026-13"
  precedential: boolean; // false for Summary Opinions (IRC §7463(b)) — never cite as precedent
  judge: string;
  filingDate: string; // YYYY-MM-DD
  docketEntryId: string;
  numberOfPages?: number;
};

// Pull the reporter citation out of the document title (DAWSON embeds it), handling the three forms:
// "T.C. Memo. 2026-13", a Division cite "157 T.C. No. 4", or "T.C. Summary Opinion 2026-7". Falls
// back to the opinion-type label when the title carries no recognizable cite.
function extractCitation(title: string, typeLabel: string): string {
  const memo = title.match(/T\.C\.\s*Memo\.\s*\d{4}-\d+/i);
  if (memo) return memo[0].replace(/\s+/g, " ");
  const summary = title.match(/T\.C\.\s*Summary\s*Opinion\s*\d{4}-\d+/i);
  if (summary) return summary[0].replace(/\s+/g, " ");
  const division = title.match(/\d+\s*T\.C\.\s*(?:No\.\s*)?\d+/i);
  if (division) return division[0].replace(/\s+/g, " ");
  return typeLabel;
}

type RawResult = {
  caseCaption?: string;
  docketNumber?: string;
  docketNumberWithSuffix?: string;
  documentTitle?: string;
  documentType?: string;
  eventCode?: string;
  judge?: string;
  filingDate?: string;
  docketEntryId?: string;
  numberOfPages?: number;
  isStricken?: boolean;
};

/**
 * Search Tax Court opinions by topic. Returns the opinions tagged with their type and precedential
 * weight; stricken opinions are dropped (a stricken opinion is not authority). Defaults to all three
 * opinion types. `fetchImpl` is injectable for tests.
 */
export async function searchTaxCourt(
  query: string,
  opts: { opinionTypes?: string[]; signal?: AbortSignal; fetchImpl?: typeof fetch } = {},
): Promise<TaxCourtOpinion[]> {
  const f = opts.fetchImpl ?? fetch;
  const params = new URLSearchParams();
  params.set("keyword", query);
  params.set("opinionTypes", (opts.opinionTypes ?? ["MOP", "TCOP", "SOP"]).join(","));
  const res = await f(`${DAWSON_API}?${params.toString()}`, {
    signal: opts.signal,
    headers: { accept: "application/json", "user-agent": "PetalResearch/1.0 (tax-research)" },
  });
  if (!res.ok) throw new Error(`Tax Court (DAWSON) API ${res.status}`);
  const data = (await res.json()) as { results?: RawResult[] };
  const out: TaxCourtOpinion[] = [];
  for (const r of data.results ?? []) {
    if (r.isStricken) continue;
    const code = (r.eventCode ?? "").toUpperCase();
    const t = OPINION_TYPE[code] ?? { label: r.documentType ?? "Opinion", precedential: true };
    out.push({
      caseCaption: r.caseCaption ?? "",
      docketNumber: r.docketNumberWithSuffix ?? r.docketNumber ?? "",
      opinionType: t.label,
      citation: extractCitation(r.documentTitle ?? "", t.label),
      precedential: t.precedential,
      judge: r.judge ?? "",
      filingDate: (r.filingDate ?? "").slice(0, 10),
      docketEntryId: r.docketEntryId ?? "",
      numberOfPages: r.numberOfPages,
    });
  }
  return out;
}

// DAWSON resolves a docket entry to a (short-lived presigned) opinion-PDF URL via this endpoint.
// Two-step by design: GET this → the file URL → the PDF, when the engine needs the full text to
// ground in. Docket number / entry id are public identifiers — no PII.
export function taxCourtDownloadUrl(docketNumber: string, docketEntryId: string): string {
  return `${DAWSON_BASE}/${encodeURIComponent(docketNumber)}/${encodeURIComponent(docketEntryId)}/public-document-download-url`;
}

/**
 * Fetch + extract the FULL TEXT of a Tax Court opinion so a holding can actually GROUND an answer
 * (closes the "case law searches but always abstains" gap). Two public DAWSON hops: GET the
 * download-url endpoint → the short-lived presigned PDF URL → the PDF bytes → text via unpdf/pdfjs.
 * All public US-government data (docket ids, not PII) → §7216-clean. `fetchImpl`/`extractImpl` are
 * injectable so tests round-trip a generated PDF with no network.
 */
export async function fetchTaxCourtText(
  downloadUrlEndpoint: string,
  opts: { signal?: AbortSignal; fetchImpl?: typeof fetch; extractImpl?: (bytes: Uint8Array) => Promise<string> } = {},
): Promise<string> {
  const f = opts.fetchImpl ?? fetch;
  const ua = { "user-agent": "PetalResearch/1.0 (tax-research)" };
  // 1) resolve the presigned URL (DAWSON returns { url })
  const meta = await f(downloadUrlEndpoint, { signal: opts.signal, headers: { accept: "application/json", ...ua } });
  if (!meta.ok) throw new Error(`DAWSON download-url ${meta.status}`);
  const j = (await meta.json()) as { url?: string };
  const pdfUrl = typeof j.url === "string" ? j.url : "";
  if (!pdfUrl) throw new Error("DAWSON download-url returned no presigned url");
  // 2) fetch the PDF bytes
  const pdfRes = await f(pdfUrl, { signal: opts.signal, headers: ua });
  if (!pdfRes.ok) throw new Error(`DAWSON PDF ${pdfRes.status}`);
  const bytes = new Uint8Array(await pdfRes.arrayBuffer());
  // 3) extract text (real text layer — DAWSON opinions are digitally generated, not scans)
  if (opts.extractImpl) return (await opts.extractImpl(bytes)).trim();
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: true });
  const joined = typeof text === "string" ? text : (text as string[]).join("\n");
  return joined.trim();
}

// True when an opinion may be cited as precedent. Summary Opinions cannot be (IRC §7463(b)); the
// engine must surface this so a Summary Opinion never outranks — or stands in for — a real holding.
export function isCitableAsPrecedent(o: TaxCourtOpinion): boolean {
  return o.precedential;
}

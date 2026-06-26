// CourtListener (Free Law Project) — federal + state case law across ALL courts (the non-Tax-Court
// courts axis DAWSON never reaches: District, Court of Federal Claims, Courts of Appeals by circuit,
// Supreme Court). Anonymous v4 search works; the dedicated batch Citation-Lookup endpoint needs a free
// token (a credential). Primary value here: CITE VERIFICATION + the 3-axis tags (court, circuit,
// precedential status) — a model case cite that resolves to a real opinion is verified (and a fabricated
// one is caught), and we ground on the verified metadata + snippet. Full opinion text is INCONSISTENTLY
// available via the API (e.g. Rauenhorst returns none), so we never assume it. Public data, §7216-clean.

import { stripHtml } from "./govinfo";

const CL_BASE = "https://www.courtlistener.com/api/rest/v4";

export type CourtListenerCase = {
  caseName: string;
  citations: string[];
  court: string; // full court name, e.g. "United States Tax Court"
  courtId: string; // "tax", "ca9", "scotus", "cofc", ...
  precedential: boolean; // status === "Published"
  dateFiled: string;
  opinionId: number | null;
  snippet: string;
  absoluteUrl: string;
};

// Case-law signals in a question: a reporter citation, a "v. <party>" caption, or a named court. Tax
// Court is also covered, but DAWSON (the official source) stays wired alongside this.
export function courtListenerMatches(q: string): boolean {
  return (
    /\b\d+\s+(t\.?\s?c\.?|u\.?\s?s\.?|f\.?\s?\d?d|s\.?\s?ct\.?|b\.?\s?t\.?\s?a\.?|fed\.?\s?cl\.?|f\.?\s?supp\.?)\b/i.test(q) ||
    /[A-Z][A-Za-z.'’-]+\s+v\.\s+[A-Z][A-Za-z.'’-]+/.test(q) || // a case caption "X v. Y"
    /\b(supreme court|[a-z]+\s+circuit|court of appeals|court of federal claims|d\.?c\.?\s+circuit)\b/i.test(q)
  );
}

// Reduce a question to the most precise case key so search returns the NAMED case, not topic-similar
// ones. A reporter citation ("119 T.C. 157") is most precise; else the "X v. Y" caption; else the
// question. (Searching the full sentence ranks topic matches over the cited case — e.g. a Rauenhorst
// query returned unrelated CDP cases.)
export function caseQuery(question: string): string {
  // The "X v. Y" caption is the most reliable key — a bare reporter cite ("119 T.C. 157") gets
  // mis-parsed (CourtListener read "T.C." as a party name "In re T.C.").
  const cap = question.match(/([A-Z][A-Za-z.'’-]+(?:\s+[A-Z][A-Za-z.'’-]+){0,3})\s+v\.\s+([A-Z][A-Za-z.'’-]+(?:\s+[A-Z][A-Za-z.'’-]+){0,3})/);
  if (cap) return cap[0].trim();
  const cite = question.match(/\d+\s+(?:t\.?\s?c\.?|u\.?\s?s\.?|f\.?\s?\d?d|s\.?\s?ct\.?|f\.?\s?supp\.?)\s?(?:no\.?\s?)?\d+/i);
  if (cite) return `"${cite[0].replace(/\s+/g, " ").trim()}"`;
  return question;
}

function normalize(r: Record<string, unknown>): CourtListenerCase {
  const ops = (r.opinions as { id?: number; snippet?: string }[] | undefined) ?? [];
  return {
    caseName: String(r.caseName ?? ""),
    citations: Array.isArray(r.citation) ? (r.citation as unknown[]).map(String) : [],
    court: String(r.court ?? ""),
    courtId: String(r.court_id ?? ""),
    precedential: String(r.status ?? "").toLowerCase() === "published",
    dateFiled: String(r.dateFiled ?? ""),
    opinionId: ops[0]?.id ?? null,
    snippet: stripHtml(String(ops[0]?.snippet ?? "")),
    absoluteUrl: r.absolute_url ? `https://www.courtlistener.com${r.absolute_url}` : "https://www.courtlistener.com",
  };
}

export async function searchCourtListener(
  query: string,
  opts: { limit?: number; signal?: AbortSignal; fetchImpl?: typeof fetch } = {},
): Promise<CourtListenerCase[]> {
  const f = opts.fetchImpl ?? fetch;
  const params = new URLSearchParams({ q: query, type: "o", order_by: "score desc" });
  const res = await f(`${CL_BASE}/search/?${params.toString()}`, {
    signal: opts.signal,
    headers: { accept: "application/json", "user-agent": "PetalResearch/1.0" },
  });
  if (!res.ok) throw new Error(`CourtListener search HTTP ${res.status}`);
  const data = (await res.json()) as { results?: Record<string, unknown>[] };
  return (data.results ?? []).slice(0, opts.limit ?? 4).map(normalize);
}

// Full opinion text when the API has it (often it does not). Throws when unavailable → caller falls back
// to the verified metadata + snippet.
export async function fetchOpinionText(
  opinionId: number,
  opts: { signal?: AbortSignal; fetchImpl?: typeof fetch } = {},
): Promise<string> {
  const f = opts.fetchImpl ?? fetch;
  const res = await f(`${CL_BASE}/opinions/${opinionId}/`, {
    signal: opts.signal,
    headers: { accept: "application/json", "user-agent": "PetalResearch/1.0" },
  });
  if (!res.ok) throw new Error(`CourtListener opinion ${opinionId} HTTP ${res.status}`);
  const o = (await res.json()) as Record<string, string>;
  const plain = o.plain_text && o.plain_text.length > 200 ? o.plain_text : "";
  const text = plain || stripHtml(o.html || o.html_lawbox || o.html_columbia || o.html_with_citations || "");
  if (text.length < 200) throw new Error(`CourtListener opinion ${opinionId} text unavailable`);
  return text;
}

// The groundable text for a case: the FULL opinion when the API has it, otherwise the VERIFIED metadata
// (cite + court + precedential status + date) plus the search snippet. Either way the cite is confirmed
// real, with its court/circuit/precedential tags.
export async function caseGroundText(c: CourtListenerCase, opts: { signal?: AbortSignal; fetchImpl?: typeof fetch } = {}): Promise<string> {
  if (c.opinionId) {
    try {
      return await fetchOpinionText(c.opinionId, opts);
    } catch {
      /* fall back to verified metadata + snippet */
    }
  }
  const meta = `${c.caseName}, ${c.citations.join(", ")}. ${c.court} (${c.dateFiled}). ${c.precedential ? "Published (precedential)" : "Unpublished (non-precedential)"}.`;
  return c.snippet ? `${meta} ${c.snippet}` : meta;
}

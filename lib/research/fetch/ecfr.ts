// Retrieve-on-demand source (keyless): the eCFR — the continuously-updated Code of Federal
// Regulations, i.e. the Treasury Regulations (26 CFR §1.xxx). Complements GovInfo (statute) and the
// Federal Register (rulemaking activity) with the current REG text.
//
// Like the other sources it carries a non-final-authority signal: a section marked `reserved` is a
// regulatory placeholder with no rule yet — a legitimate "the regs are open here" basis for an
// `unsettled` calibration (e.g. §128 Trump-Account contributions). Public data, §7216-clean.

import { stripHtml } from "./govinfo";

const ECFR_SEARCH = "https://www.ecfr.gov/api/search/v1/results";

export type EcfrSection = {
  section: string; // "1.199A-3"
  heading: string; // "§ 1.199A-3"
  excerpt: string; // plain-text snippet (highlight tags stripped)
  reserved: boolean; // a RESERVED section = no rule issued yet (an open regulatory gap)
  removed: boolean;
  sourceUrl: string; // resolvable eCFR citation URL
};

export async function searchEcfr(
  query: string,
  opts: { perPage?: number; fetchImpl?: typeof fetch; signal?: AbortSignal } = {},
): Promise<EcfrSection[]> {
  const f = opts.fetchImpl ?? fetch;
  const params = new URLSearchParams({ query, per_page: String(opts.perPage ?? 5) });
  const res = await f(`${ECFR_SEARCH}?${params.toString()}`, { signal: opts.signal, headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`eCFR API ${res.status}`);
  const data = (await res.json()) as { results?: unknown[] };
  return (data.results ?? []).map(normalizeSection);
}

function normalizeSection(r: unknown): EcfrSection {
  const o = (r ?? {}) as Record<string, unknown>;
  const h = (o.hierarchy as Record<string, unknown> | undefined) ?? {};
  const headings = (o.hierarchy_headings as Record<string, unknown> | undefined) ?? {};
  const section = String(h.section ?? "");
  return {
    section,
    heading: String(headings.section ?? (section ? `§ ${section}` : "")),
    excerpt: stripHtml(String(o.full_text_excerpt ?? "")),
    reserved: Boolean(o.reserved),
    removed: Boolean(o.removed),
    sourceUrl: section ? `https://www.ecfr.gov/current/title-26/section-${section}` : "https://www.ecfr.gov/current/title-26",
  };
}

// The non-final-authority signal for regs: any matched section is RESERVED (a placeholder with no
// rule). That is the evidence-based basis for "unsettled" — the regs on point are genuinely open.
export function hasReservedSection(sections: EcfrSection[]): boolean {
  return sections.some((s) => s.reserved);
}

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

// ── CITE-VERIFICATION path: fetch the FULL text of a SPECIFIC reg section by citation ──────────────
// The search API above returns topic snippets; this pulls a named section's complete current text via
// the Versioner API, so a model citation like "§1.199A-5" can be fetch-VERIFIED and grounded (the
// direct fix for a correct cited reg answer being stamped "not grounded").

const ECFR_VERSIONER = "https://www.ecfr.gov/api/versioner/v1";

export type CfrRef = { title: number; part: string; section: string };

// Extract CFR section references from a question. Treasury (tax) regs are Title 26, cited as
// "§1.199A-5", "Treas. Reg. 1.199A-5", "26 CFR 1.199A-5", "1.45V-4". The part is the integer before the
// first dot; the Versioner `section` param is the full "part.section" string. Title defaults to 26
// (tax) unless the question names another CFR title ("12 CFR 217.2", "17 C.F.R. 240.10b-5").
export function cfrRefsFromQuery(question: string): CfrRef[] {
  const refs: CfrRef[] = [];
  const seen = new Set<string>();
  const re =
    /(?:(\d{1,2})\s*c\.?\s?f\.?\s?r\.?\s*(?:§\s*)?|treas\.?\s*reg\.?\s*(?:§\s*)?|reg\.?\s*§\s*|§\s*)(\d{1,3})\.(\d+[A-Za-z]{0,3}(?:-\d+[A-Za-z]?)?)/gi;
  for (const m of question.matchAll(re)) {
    const title = m[1] ? Number(m[1]) : 26;
    if (title < 1 || title > 50) continue;
    const section = `${m[2]}.${m[3]}`;
    const key = `${title}|${section}`;
    if (!seen.has(key)) {
      seen.add(key);
      refs.push({ title, part: m[2], section });
    }
  }
  return refs;
}

// Strip eCFR section XML to readable text, keeping the section HEAD as a lead line.
export function stripCfrXml(xml: string): string {
  return xml
    .replace(/<HEAD>/gi, "\n")
    .replace(/<\/HEAD>/gi, ": ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#xa7;|&sect;/gi, "§")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// The Versioner only serves dates up to a title's LATEST ISSUE DATE — asking for "today" 404s when the
// latest amendment is older. Resolve (and cache) the real latest issue date per title from titles.json.
const titleDateCache: Record<number, string> = {};
async function latestIssueDate(title: number, f: typeof fetch, signal?: AbortSignal): Promise<string> {
  if (titleDateCache[title]) return titleDateCache[title];
  try {
    const res = await f(`${ECFR_VERSIONER}/titles.json`, { signal, headers: { accept: "application/json" } });
    if (res.ok) {
      const data = (await res.json()) as { titles?: { number?: number | string; latest_issue_date?: string }[] };
      const t = data.titles?.find((x) => Number(x.number) === title);
      if (t?.latest_issue_date) {
        titleDateCache[title] = t.latest_issue_date;
        return t.latest_issue_date;
      }
    }
  } catch {
    /* fall through to the dated fallback */
  }
  return "2025-01-01"; // safe recent fallback if titles.json is unavailable
}

// Fetch one CFR section's current full text. `date` is the "content as of" date the Versioner resolves
// to the version in effect then (defaults to the title's latest issued version → current law). Throws
// on a non-OK response or text too short to ground (→ honest abstain upstream).
export async function fetchEcfrSection(
  ref: CfrRef,
  opts: { date?: string; signal?: AbortSignal; fetchImpl?: typeof fetch } = {},
): Promise<{ citation: string; text: string; sourceUrl: string }> {
  const f = opts.fetchImpl ?? fetch;
  const date = opts.date ?? (await latestIssueDate(ref.title, f, opts.signal));
  const url = `${ECFR_VERSIONER}/full/${date}/title-${ref.title}.xml?part=${encodeURIComponent(ref.part)}&section=${encodeURIComponent(ref.section)}`;
  const res = await f(url, { signal: opts.signal, headers: { accept: "application/xml" } });
  if (!res.ok) throw new Error(`eCFR ${res.status} for ${ref.title} CFR ${ref.section}`);
  const text = stripCfrXml(await res.text());
  if (text.length < 80) throw new Error(`eCFR ${ref.title} CFR ${ref.section} text too short to ground`);
  return {
    citation: `${ref.title} CFR §${ref.section}`,
    text,
    sourceUrl: `https://www.ecfr.gov/current/title-${ref.title}/section-${ref.section}`,
  };
}

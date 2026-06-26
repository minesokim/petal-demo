// Retrieve-on-demand source (keyless): the Caselaw Access Project (Harvard) static bulk export at
// static.case.law — historical US case law, 1658-2020. This is the HISTORICAL/OLDER-CASE axis and a
// FALLBACK to CourtListener: CourtListener's free search is the primary cite-verifier, but when a
// reporter cite resolves to an old opinion whose FULL TEXT the CourtListener API doesn't serve (it
// often doesn't), CAP carries the complete digitized opinion text so a holding can actually GROUND an
// answer. CAP is cite-addressable by construction — a reporter citation maps deterministically to a
// reporter slug + volume + per-case JSON, so "301 U.S. 619" is a 2-hop static fetch (no key, no search
// index). Coverage stops ~2020 (most reporters earlier — `us` to 2014, `f3d` to 2019), so for a recent
// case this returns nothing and the engine stays on CourtListener/DAWSON. Public data, §7216-clean.
//
// Layout (verified live):
//   https://static.case.law/<slug>/<volume>/CasesMetadata.json   → [{ citations:[{cite}], file_name, ... }]
//   https://static.case.law/<slug>/<volume>/cases/<file_name>.json → { casebody:{ opinions:[{text}], head_matter } }
// The per-case JSON carries PLAIN-TEXT opinions directly (no PDF, no HTML) — so getText needs no
// unpdf/stripHtml, just a join of the opinion bodies.

const CAP_BASE = "https://static.case.law";

// Reporter short-name → CAP slug, for the federal reporters a tax answer cites. CAP slugs are a
// slugify of the short name (lowercase, dots dropped, spaces→hyphens) EXCEPT the Federal Reporter
// series collapse the space ("F. 2d" → "f2d"), so a hardcoded map is the reliable resolver and also
// scopes us to federal/tax reporters (a "1 Cal. 2d 1" state cite simply won't match → no CAP fetch).
// Verified against ReportersMetadata.json on 2026-06-26.
const REPORTER_SLUGS: Record<string, string> = {
  "u.s.": "us", // U.S. Reports (SCOTUS), 1754-2014
  "s. ct.": "s-ct", // Supreme Court Reporter
  "l. ed.": "l-ed", // Lawyers' Edition
  "l. ed. 2d": "l-ed-2d",
  f: "f", // Federal Reporter, 1802-1932
  "f.2d": "f2d", // Federal Reporter 2d, 1910-1993
  "f.3d": "f3d", // Federal Reporter 3d, 1990-2019
  "f. supp.": "f-supp", // Federal Supplement, 1839-1998
  "f. supp. 2d": "f-supp-2d",
  "f. supp. 3d": "f-supp-3d",
  "t.c.": "tc", // U.S. Tax Court Reports, 1942-2015
  "b.t.a.": "bta", // Board of Tax Appeals, 1920-1942
  "fed. cl.": "fed-cl", // Federal Claims, 1991-2018
  "ct. cl.": "us-ct-cl", // Court of Claims (federal), 1853-1982
};

// One parsed reporter citation: the numeric volume, the canonical reporter short-name, the page, and
// the resolved CAP slug. `raw` is the original cite text for the title/citation line.
export type CapCite = { volume: number; reporter: string; page: number; slug: string; raw: string };

// Canonicalize a matched reporter token to the REPORTER_SLUGS key form: lowercase, single-spaced, with
// the conventional trailing dots ("US"/"u s" → "u.s.", "F 2d"/"f.2d" → "f.2d", "F Supp 2d" → "f. supp. 2d").
function canonReporter(token: string): string {
  const t = token.toLowerCase().replace(/\./g, "").replace(/\s+/g, " ").trim();
  switch (t) {
    case "us":
    case "u s":
      return "u.s.";
    case "s ct":
      return "s. ct.";
    case "l ed":
      return "l. ed.";
    case "l ed 2d":
      return "l. ed. 2d";
    case "f":
      return "f.";
    case "f 2d":
    case "f2d":
      return "f.2d";
    case "f 3d":
    case "f3d":
      return "f.3d";
    case "f supp":
      return "f. supp.";
    case "f supp 2d":
      return "f. supp. 2d";
    case "f supp 3d":
      return "f. supp. 3d";
    case "tc":
    case "t c":
      return "t.c.";
    case "bta":
    case "b t a":
      return "b.t.a.";
    case "fed cl":
      return "fed. cl.";
    case "ct cl":
      return "ct. cl.";
    default:
      return t;
  }
}

// The reporter alternation, ordered longest-first so "F. Supp. 2d" wins over "F. Supp." and "F." — a
// shorter alternative listed first would otherwise short-match. Each token is the human reporter form.
// NON-capturing (?:…) on purpose: it is embedded inside the cite regex below, where the volume/reporter/
// page must stay at fixed group indices 1/2/3 (a capturing group here would shift the page to index 4).
const REPORTER_RE =
  /(?:F\.?\s?Supp\.?\s?(?:2d|3d)|F\.?\s?Supp\.?|L\.?\s?Ed\.?\s?2d|L\.?\s?Ed\.?|F\.?\s?2d|F\.?\s?3d|U\.?\s?S\.?|S\.?\s?Ct\.?|Fed\.?\s?Cl\.?|Ct\.?\s?Cl\.?|B\.?\s?T\.?\s?A\.?|T\.?\s?C\.?|F\.)/;

// Extract reporter citations CAP can resolve from a question. A cite is "<vol> <reporter> <page>" — e.g.
// "301 U.S. 619", "159 F.3d 1217", "100 T.C. 1". Only cites whose reporter is in REPORTER_SLUGS are
// returned (a state cite, or "T.C. Memo." which has no static reporter volume, is dropped → no CAP
// fetch). Like statuteQuery/caseQuery: we reduce the QUESTION to the precise IDENTIFIER, never search
// the raw sentence (CAP has no full-text search index — it is purely cite-addressable).
export function capCitesFromQuery(question: string): CapCite[] {
  const out: CapCite[] = [];
  const seen = new Set<string>();
  // <volume> <reporter> [No.] <page>. The optional "No." guards Tax Court "157 T.C. No. 4" forms.
  const re = new RegExp(`\\b(\\d{1,3})\\s+(${REPORTER_RE.source})\\s+(?:No\\.?\\s*)?(\\d{1,4})\\b`, "gi");
  for (const m of question.matchAll(re)) {
    const reporter = canonReporter(m[2]);
    const slug = REPORTER_SLUGS[reporter];
    if (!slug) continue; // reporter not in CAP's federal set → skip (e.g. a state reporter)
    const volume = Number(m[1]);
    const page = Number(m[3]);
    const key = `${slug}|${volume}|${page}`;
    if (seen.has(key)) continue;
    seen.add(key);
    // `raw` is the cite EXACTLY as the question wrote it (m[0]), normalized to single spaces — the
    // honest display form, no re-casing guesswork.
    out.push({ volume, reporter, page, slug, raw: m[0].replace(/\s+/g, " ").trim() });
  }
  return out;
}

// Does this source fit the question? Only when the question carries a reporter citation CAP can resolve
// (a federal reporter in REPORTER_SLUGS). A bare topic question, a statute cite, or a "T.C. Memo." cite
// (no static volume) yields nothing → the engine never routes a question CAP can't answer here.
export function matchesCapCaselaw(q: string): boolean {
  return capCitesFromQuery(q).length > 0;
}

// One resolved CAP case: the matched cite, the case name, all parallel citations, court, decision date,
// and the per-case JSON URL to pull full text from. precedential defaults true (a published reporter
// opinion is precedent; CAP carries no unpublished-table opinions).
export type CapCase = {
  caseName: string;
  citations: string[];
  court: string;
  decisionDate: string;
  caseUrl: string; // the per-case JSON (also the groundable-text source)
  cite: CapCite;
};

type CasesMetaEntry = {
  name?: string;
  name_abbreviation?: string;
  decision_date?: string;
  file_name?: string;
  citations?: { type?: string; cite?: string }[];
  court?: { name?: string };
};

// Normalize a CAP citation to a comparable key: lowercase, collapse whitespace, drop a trailing period.
// "301 U. S. 619" and "301 U.S. 619" both → "301 u.s. 619".
function citeKey(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").replace(/\.\s/g, ". ").trim();
}

// Resolve ONE reporter citation to its CAP case via the 2-hop static layout: fetch the volume's
// CasesMetadata.json, find the entry whose citations include "<vol> <reporter> <page>", and build the
// per-case JSON URL from its file_name. Returns null when the volume isn't in CAP (e.g. a post-2020
// volume → 404) or the cite isn't in that volume — the caller then simply yields no hit (honest: CAP
// is a fallback, so a miss just leaves the question on CourtListener/DAWSON).
async function resolveCapCase(
  c: CapCite,
  opts: { signal?: AbortSignal; fetchImpl?: typeof fetch } = {},
): Promise<CapCase | null> {
  const f = opts.fetchImpl ?? fetch;
  const metaUrl = `${CAP_BASE}/${c.slug}/${c.volume}/CasesMetadata.json`;
  const res = await f(metaUrl, { signal: opts.signal, headers: { accept: "application/json", "user-agent": "PetalResearch/1.0 (tax-research)" } });
  if (!res.ok) return null; // volume not in CAP (e.g. post-2020) → no hit
  const entries = (await res.json()) as CasesMetaEntry[];
  const wantOfficial = citeKey(`${c.volume} ${c.reporter} ${c.page}`);
  const wantLoose = `${c.volume} ${c.slug.replace(/-/g, " ")} ${c.page}`; // tolerant fallback compare
  const hit = entries.find((e) =>
    (e.citations ?? []).some((x) => {
      const k = citeKey(x.cite ?? "");
      return k === wantOfficial || k.replace(/[.\s]/g, "") === wantOfficial.replace(/[.\s]/g, "") || k.replace(/[.\s]/g, "") === wantLoose.replace(/[.\s]/g, "");
    }),
  );
  if (!hit || !hit.file_name) return null;
  return {
    caseName: hit.name_abbreviation || hit.name || c.raw,
    citations: (hit.citations ?? []).map((x) => x.cite ?? "").filter(Boolean),
    court: hit.court?.name ?? "",
    decisionDate: hit.decision_date ?? "",
    caseUrl: `${CAP_BASE}/${c.slug}/${c.volume}/cases/${hit.file_name}.json`,
    cite: c,
  };
}

type CaseBodyJson = {
  name?: string;
  casebody?: {
    opinions?: { text?: string; type?: string; author?: string }[];
    head_matter?: string;
  };
};

// Fetch the FULL opinion text of a resolved CAP case (the groundable primary text). CAP serves the
// opinion bodies as PLAIN TEXT inside the per-case JSON, so this is just a fetch + join of the opinion
// `text` fields (head_matter — the reporter's syllabus/parties block — is appended as lead context).
// Throws when the JSON is unreachable or the joined text is too short to ground → honest abstain upstream.
export async function fetchCapCaseText(
  caseUrl: string,
  opts: { signal?: AbortSignal; fetchImpl?: typeof fetch } = {},
): Promise<string> {
  const f = opts.fetchImpl ?? fetch;
  const res = await f(caseUrl, { signal: opts.signal, headers: { accept: "application/json", "user-agent": "PetalResearch/1.0 (tax-research)" } });
  if (!res.ok) throw new Error(`CAP case JSON ${res.status} for ${caseUrl}`);
  const data = (await res.json()) as CaseBodyJson;
  const cb = data.casebody ?? {};
  const opinions = (cb.opinions ?? []).map((o) => (o.text ?? "").trim()).filter(Boolean);
  const head = (cb.head_matter ?? "").trim();
  const body = opinions.join("\n\n").trim();
  const text = head && body ? `${head}\n\n${body}` : body || head;
  if (text.length < 200) throw new Error(`CAP case text too short to ground (${text.length} chars) → abstain`);
  return text;
}

// The plain Hit shape (NOT imported from ./registry — avoids the import cycle).
export type Hit = {
  source: string;
  title: string;
  citation: string;
  sourceUrl: string;
  authorityTier: number;
  precedential?: boolean;
  getText: () => Promise<string>;
};

// Search CAP for the reporter citation(s) in the question and return a grounded hit per resolved case.
// Each hit's getText pulls the FULL opinion text from the per-case JSON. authorityTier=3 (case law);
// precedential=true (a published reporter opinion is precedent — CAP carries no unpublished tables).
// A cite that doesn't resolve (post-2020 volume, or not in CAP) is simply dropped → no fabricated hit.
export async function searchCapCaselaw(query: string, opts: { signal?: AbortSignal; fetchImpl?: typeof fetch } = {}): Promise<Hit[]> {
  const cites = capCitesFromQuery(query).slice(0, 4);
  const resolved = await Promise.all(cites.map((c) => resolveCapCase(c, opts).catch(() => null)));
  const hits: Hit[] = [];
  for (const c of resolved) {
    if (!c) continue;
    const official = c.citations.find((x) => citeKey(x).includes(citeKey(c.cite.reporter))) ?? c.cite.raw;
    hits.push({
      source: "cap-caselaw",
      title: c.caseName,
      citation: c.court ? `${c.caseName}, ${official} (${c.court}${c.decisionDate ? ` ${c.decisionDate}` : ""})` : `${c.caseName}, ${official}`,
      sourceUrl: c.caseUrl,
      authorityTier: 3, // case law
      precedential: true, // a published reporter opinion is citable precedent
      getText: () => fetchCapCaseText(c.caseUrl, opts),
    });
  }
  return hits;
}

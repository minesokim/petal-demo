// Retrieve-on-demand source (keyless): IRS Publications + Form Instructions, served as PUBLIC PDFs at
// https://www.irs.gov/pub/irs-pdf/p{n}.pdf (publications, e.g. p17.pdf "Your Federal Income Tax") and
// i{form}.pdf (instructions, e.g. i1040.pdf, i1040sc.pdf "Schedule C instructions").
//
// AUTHORITY: tier 4. IRS pubs + instructions are RESPECTED, plain-English guidance — but they are NOT
// substantial authority (they can't be cited to defend a position; only the Code/regs/cases can). So
// every hit is precedential=false: the engine may ground an explanation in a pub, but must not present
// it as binding authority. This is the "what does the IRS itself say in plain English" axis, complementing
// the statute (GovInfo), reg (eCFR), case (DAWSON/CourtListener), and bulletin (IRB) sources.
//
// No search API exists — pubs/instructions are addressed by EXACT id (p17, i1040, i1040sc). So the query
// layer resolves the question to publication ids two ways: an EXPLICIT reference in the question
// ("Pub 502", "Form 1040 instructions", "Schedule C", "i1040") and a TOPIC→pub map (medical → p502,
// mortgage interest → p936, …), mirroring how statuteQuery reduces a question to a section. getText pulls
// the PDF, extracts the text layer via unpdf, and WINDOWS it to the topic terms (the pubs are large —
// p17 is 3MB / ~300 pages — so an un-windowed dump would bury the relevant rule).
//
// Public US-government data only — queries are pub ids / topic terms, never taxpayer PII, so §7216-clean.
// No API key required. fetch + extract are injectable for tests.

import { extractText, getDocumentProxy } from "unpdf";

const PDF_BASE = "https://www.irs.gov/pub/irs-pdf";
const UA = { "user-agent": "PetalResearch/1.0 (tax-research)" };

// A resolved IRS pub/instruction reference. `id` is the bare PDF stem ("p502", "i1040sc"); `topicTerms`
// are the question's distinctive nouns used to WINDOW the extracted text onto the relevant rule.
export type IrsPubRef = {
  id: string; // "p502" | "i1040" | "i1040sc"
  kind: "publication" | "instructions";
  title: string; // human label, e.g. "IRS Pub. 502 (Medical and Dental Expenses)"
  citation: string; // e.g. "IRS Pub. 502" | "Instructions for Schedule C (Form 1040)"
  topicTerms: string[]; // distinctive terms to window the PDF text around
};

// ── TOPIC → publication map. The canonical IRS pub for a common topic, so a plain "are medical expenses
// deductible" question (no explicit "Pub 502") still resolves to the right pub. Keyed by a matcher RegExp;
// ordered most-specific-first. Every id here was live-verified to serve a real application/pdf (discontinued
// pubs that now redirect to an HTML landing page — e.g. the old Pub 535 — are deliberately excluded; their
// content moved to a still-live pub or the form instructions). ──
const TOPIC_PUBS: { re: RegExp; id: string; title: string }[] = [
  { re: /\b(medical|dental|doctor|hospital|prescription|health expense)\b/i, id: "p502", title: "Medical and Dental Expenses" },
  { re: /\b(child|dependent)\s+(and\s+dependent\s+)?care\b|\bday\s?care\b/i, id: "p503", title: "Child and Dependent Care Expenses" },
  { re: /\b(divorce|separated|alimony|separate maintenance)\b/i, id: "p504", title: "Divorced or Separated Individuals" },
  { re: /\b(charitable|charity|donation|donat\w+|noncash contribution)\b/i, id: "p526", title: "Charitable Contributions" },
  { re: /\b(rental|rent(al)? property|residential rental|passive activity)\b/i, id: "p527", title: "Residential Rental Property" },
  { re: /\b(home\s+mortgage|mortgage interest)\b/i, id: "p936", title: "Home Mortgage Interest Deduction" },
  { re: /\b(depreciat\w+|macrs|section 179|bonus depreciation|placed in service)\b/i, id: "p946", title: "How To Depreciate Property" },
  { re: /\b(sell\w*|sale|disposition)\s+(of\s+)?(your\s+)?(home|residence)\b|\bsection 121\b/i, id: "p523", title: "Selling Your Home" },
  { re: /\b(basis|adjusted basis|cost basis)\b/i, id: "p551", title: "Basis of Assets" },
  { re: /\b(sales?\s+(and|&)?\s*other dispositions|capital asset|section 1231|like-kind)\b/i, id: "p544", title: "Sales and Other Dispositions of Assets" },
  { re: /\b(investment income|dividend|interest income|capital gain|bond|stock)\b/i, id: "p550", title: "Investment Income and Expenses" },
  { re: /\b(ira|roth|traditional ira|contribution limit)\b/i, id: "p590a", title: "Contributions to IRAs" },
  { re: /\b(required minimum distribution|rmd|ira distribution|early withdrawal)\b/i, id: "p590b", title: "Distributions from IRAs" },
  { re: /\b(education credit|american opportunity|lifetime learning|tuition|529|student loan interest)\b/i, id: "p970", title: "Tax Benefits for Education" },
  { re: /\b(estate|decedent|survivor|inherited|final return)\b/i, id: "p559", title: "Survivors, Executors, and Administrators" },
  { re: /\b(travel|meals?|entertainment|business gift|car expense|mileage)\b/i, id: "p463", title: "Travel, Gift, and Car Expenses" },
  { re: /\b(taxable\s+income|fringe benefit|wage|what income is)\b/i, id: "p525", title: "Taxable and Nontaxable Income" },
  { re: /\b(dependent|qualifying child|qualifying relative|filing status|standard deduction)\b/i, id: "p501", title: "Dependents, Standard Deduction, and Filing Information" },
  { re: /\b(small business|sole proprietor|self-employed|schedule c business)\b/i, id: "p334", title: "Tax Guide for Small Business" },
];

// ── FORM → instructions filename. The instructions PDF stem for a named form/schedule. Schedules of Form
// 1040 use the "i1040s{letter}" stem (i1040sc = Schedule C); the bare form uses "i{form}". Note: i1040.pdf
// 301-redirects to i1040gi.pdf (the general-instructions filename) — we follow redirects, so either works. ──
const FORM_INSTRUCTIONS: { re: RegExp; id: string; label: string }[] = [
  { re: /\bschedule\s*c\b|\b1040[\s-]?sc\b/i, id: "i1040sc", label: "Schedule C (Form 1040)" },
  { re: /\bschedule\s*d\b|\b1040[\s-]?sd\b/i, id: "i1040sd", label: "Schedule D (Form 1040)" },
  { re: /\bschedule\s*e\b|\b1040[\s-]?se\b/i, id: "i1040se", label: "Schedule E (Form 1040)" },
  { re: /\bschedule\s*se\b\s*(?:self-employment)?\b/i, id: "i1040sse", label: "Schedule SE (Form 1040)" },
  { re: /\bschedule\s*a\b|\bitemized deduction/i, id: "i1040sca", label: "Schedule A (Form 1040)" },
  { re: /\bform\s*8949\b/i, id: "i8949", label: "Form 8949" },
  { re: /\bform\s*4562\b|\bdepreciation form\b/i, id: "i4562", label: "Form 4562" },
  { re: /\bform\s*2106\b/i, id: "i2106", label: "Form 2106" },
  { re: /\bform\s*7203\b|\bs corporation (basis|shareholder)/i, id: "i7203", label: "Form 7203" },
  { re: /\bform\s*5695\b|\bresidential (energy|clean energy) credit/i, id: "i5695", label: "Form 5695" },
  { re: /\bform\s*8863\b/i, id: "i8863", label: "Form 8863" },
  { re: /\bform\s*1040\b|\b1040 instructions\b/i, id: "i1040", label: "Form 1040" },
];

// Distinctive topic terms (≥4 chars, not framing/stopwords) used to WINDOW the extracted PDF text onto the
// relevant rule. Mirrors statuteQuery's reduction but keeps the bag of nouns (no section synthesis needed).
const STOP = new Set(
  ("what whats does this that with from your their about under into when which would could should there here have " +
    "deductible deduct taxpayer client clients please form schedule instructions instruction publication pub the and " +
    "for are can how does include included including expense expenses amount amounts pay paid")
    .split(/\s+/),
);
export function pubTopicTerms(question: string): string[] {
  const words = question
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOP.has(w) && !/^\d+$/.test(w));
  // longest (most distinctive) terms first — these land the window on the right item, not a common word.
  return [...new Set(words)].sort((a, b) => b.length - a.length).slice(0, 6);
}

// Does this source fit the question? Fires on an EXPLICIT pub/form reference ("Pub 502", "Form 1040
// instructions", "Schedule C", "i1040"), the literal words "IRS publication"/"form instructions", or a
// TOPIC the pub map covers (so a plain "are medical expenses deductible" resolves to Pub 502).
export function matchesIrsPub(q: string): boolean {
  if (/\b(pub(lication)?\.?\s*\d{1,4}\b|\bp\d{2,4}\b)/i.test(q)) return true; // "Pub 502", "publication 17", "p502"
  if (/\b(form|schedule)\b[^.]*\binstructions?\b|\binstructions?\s+for\s+(form|schedule)\b/i.test(q)) return true;
  if (/\birs\s+(publication|pub|guidance pub|booklet)\b/i.test(q)) return true;
  if (/\bi\d{3,4}[a-z]{0,3}\b/i.test(q)) return true; // a literal instructions stem "i1040sc"
  if (FORM_INSTRUCTIONS.some((f) => f.re.test(q))) return true;
  return TOPIC_PUBS.some((t) => t.re.test(q));
}

// Resolve a question to the IRS pub/instruction refs that fit it, most-specific-first, deduped by id.
// Order: an EXPLICIT "Pub N" / "pN" id → that publication; an explicit instructions stem / named form →
// those instructions; otherwise the topic map. Caps at `limit` (default 3) so a broad question doesn't
// fan out to every loosely-related pub.
export function irsPubRefsFromQuery(question: string, limit = 3): IrsPubRef[] {
  const refs: IrsPubRef[] = [];
  const seen = new Set<string>();
  const terms = pubTopicTerms(question);
  const add = (id: string, kind: IrsPubRef["kind"], title: string, citation: string) => {
    const key = id.toLowerCase();
    if (seen.has(key) || refs.length >= limit) return;
    seen.add(key);
    refs.push({ id: key, kind, title, citation, topicTerms: terms });
  };

  // 1) Explicit publication id: "Pub 502", "publication 17", "p17".
  for (const m of question.matchAll(/\b(?:pub(?:lication)?\.?\s*|p)(\d{1,4}[ab]?)\b/gi)) {
    const id = `p${m[1].toLowerCase()}`;
    add(id, "publication", `IRS Pub. ${m[1]} (${pubTitle(id)})`, `IRS Pub. ${m[1]}`);
  }
  // 2) Explicit instructions stem typed literally: "i1040sc".
  for (const m of question.matchAll(/\bi(\d{3,4}[a-z]{0,3})\b/gi)) {
    const id = `i${m[1].toLowerCase()}`;
    add(id, "instructions", `Instructions for Form ${m[1]}`, `Instructions for Form ${m[1]}`);
  }
  // 3) Named form / schedule → its instructions PDF.
  for (const f of FORM_INSTRUCTIONS) {
    if (f.re.test(question)) add(f.id, "instructions", `Instructions for ${f.label}`, `Instructions for ${f.label}`);
  }
  // 4) Topic → canonical publication.
  for (const t of TOPIC_PUBS) {
    if (t.re.test(question)) add(t.id, "publication", `IRS Pub. ${t.id.slice(1)} (${t.title})`, `IRS Pub. ${t.id.slice(1)}`);
  }
  return refs.slice(0, limit);
}

// Title for a known publication id (used when only the bare "Pub N" was typed). Falls back to a generic
// label — the pub still fetches; only the human title is generic.
function pubTitle(id: string): string {
  const known: Record<string, string> = {
    p17: "Your Federal Income Tax",
    ...Object.fromEntries(TOPIC_PUBS.map((t) => [t.id, t.title])),
  };
  return known[id] ?? "IRS Publication";
}

export function irsPubUrl(id: string): string {
  return `${PDF_BASE}/${id}.pdf`;
}

/**
 * Fetch an IRS pub/instructions PDF and return its text WINDOWED to the topic. The PDFs are large
 * (p17 ≈ 300 pages), so an un-windowed dump buries the rule; we locate the most distinctive topic term
 * and return a window around it. Fails CLOSED (throws → honest abstain upstream) when: the fetch is not
 * OK, the response is NOT a real PDF (a discontinued pub redirects to an HTML landing page — that must
 * not be extracted as garbage), or the extracted text is too short to ground. `fetchImpl`/`extractImpl`
 * are injectable so tests round-trip a generated PDF with no network.
 */
export async function fetchIrsPubText(
  ref: IrsPubRef,
  opts: { signal?: AbortSignal; fetchImpl?: typeof fetch; extractImpl?: (bytes: Uint8Array) => Promise<string> } = {},
): Promise<string> {
  const f = opts.fetchImpl ?? fetch;
  // follow redirects: i1040.pdf 301→i1040gi.pdf (live general-instructions filename) is legitimate.
  const res = await f(irsPubUrl(ref.id), { signal: opts.signal, redirect: "follow", headers: UA });
  if (!res.ok) throw new Error(`IRS pub ${ref.id} HTTP ${res.status}`);
  // A discontinued pub redirects to an HTML landing page (content-type text/html) instead of a PDF —
  // fail closed rather than feed HTML through the PDF parser and ground on garbage.
  const ct = res.headers.get("content-type") ?? "";
  if (ct && !/pdf|octet-stream/i.test(ct)) {
    throw new Error(`IRS pub ${ref.id} is not a PDF (content-type ${ct}) — likely discontinued/redirected`);
  }
  const bytes = new Uint8Array(await res.arrayBuffer());
  const full = (opts.extractImpl ? await opts.extractImpl(bytes) : await extractPdf(bytes)).trim();
  if (full.length < 200) throw new Error(`IRS pub ${ref.id} text too short to ground (${full.length} chars)`);
  return windowToTopic(full, ref.topicTerms);
}

async function extractPdf(bytes: Uint8Array): Promise<string> {
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: true });
  return typeof text === "string" ? text : (text as string[]).join("\n");
}

// Window a large pub's text onto the topic: find the most distinctive term that appears, and return a
// generous slice around its FIRST occurrence (the pubs are alphabetical/sectioned, so the first hit is
// the defining passage). No term found ⇒ return the document head (still the pub's own framing, grounded).
export function windowToTopic(text: string, topicTerms: string[], radiusBefore = 800, radiusAfter = 5000): string {
  const lower = text.toLowerCase();
  for (const term of topicTerms) {
    const pos = lower.indexOf(term.toLowerCase());
    if (pos >= 0) return text.slice(Math.max(0, pos - radiusBefore), pos + radiusAfter).trim();
  }
  return text.slice(0, radiusBefore + radiusAfter).trim();
}

// ── Hit shape (the plain shape the registry consumes; NOT imported from ./registry to avoid the cycle). ──
export type Hit = {
  source: string;
  title: string;
  citation: string;
  sourceUrl: string;
  authorityTier: number;
  precedential?: boolean;
  getText: () => Promise<string>;
};

/**
 * Search IRS Publications + Form Instructions for a question. Resolves the question to the pub/instruction
 * ids that fit it (explicit reference or topic map), and returns a Hit per id whose getText fetches +
 * extracts + windows the PDF. Every hit is tier 4 and precedential=false: IRS pubs/instructions are
 * respected guidance but NOT substantial authority (cannot be cited to defend a position). getText fails
 * closed on a non-PDF / too-short body → honest abstain.
 */
export async function searchIrsPub(
  query: string,
  opts: { signal?: AbortSignal; fetchImpl?: typeof fetch } = {},
): Promise<Hit[]> {
  const refs = irsPubRefsFromQuery(query);
  return refs.map((ref) => ({
    source: "irs-pub",
    title: ref.title,
    citation: ref.citation,
    sourceUrl: irsPubUrl(ref.id),
    authorityTier: 4, // respected IRS guidance — NOT substantial authority
    precedential: false, // a pub/instruction may never be cited as the authority for a position
    getText: () => fetchIrsPubText(ref, { signal: opts.signal, fetchImpl: opts.fetchImpl }),
  }));
}

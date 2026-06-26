// Retrieve-on-demand source (keyless): the Federal Register — proposed/final rules + notices.
//
// Two roles in the metacognitive layer:
//   1. fills a coverage gap with current regulatory activity when the corpus has nothing loaded;
//   2. its `type` field ("Proposed Rule" vs "Rule") is the NON-FINAL-AUTHORITY signal the
//      calibration layer needs to legitimately say "unsettled" — a live Proposed Rule with no
//      superseding final Rule means the regulatory position is genuinely OPEN, vs a settled gap.
//
// Public US-government data only — no taxpayer PII ever leaves with the query, so this is
// §7216-clean (synthetic/public scope). No API key required.

const FR_API = "https://www.federalregister.gov/api/v1/documents.json";

export type FederalRegisterDoc = {
  title: string;
  type: string; // "Proposed Rule" | "Rule" | "Notice" | "Presidential Document"
  agency: string;
  publicationDate: string; // YYYY-MM-DD
  htmlUrl: string;
  abstract?: string;
};

export async function searchFederalRegister(
  query: string,
  opts: { perPage?: number; signal?: AbortSignal; fetchImpl?: typeof fetch; agencies?: string[] } = {},
): Promise<FederalRegisterDoc[]> {
  const f = opts.fetchImpl ?? fetch;
  const params = new URLSearchParams();
  params.set("per_page", String(opts.perPage ?? 5));
  params.set("order", "newest");
  params.append("conditions[term]", query);
  // Scope to the tax rule-writers (Treasury + IRS). Without this, a tax-reg search returns NOISE — any
  // agency's "final rule" matching the query terms (Homeland Security, FTC, Transportation, …). A
  // tax-research engine only wants Treasury/IRS rulemaking from the Federal Register.
  for (const slug of opts.agencies ?? ["internal-revenue-service", "treasury-department"]) {
    params.append("conditions[agencies][]", slug);
  }
  for (const field of ["title", "type", "publication_date", "html_url", "abstract", "agencies"]) {
    params.append("fields[]", field);
  }
  const res = await f(`${FR_API}?${params.toString()}`, { signal: opts.signal, headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Federal Register API ${res.status}`);
  const data = (await res.json()) as { results?: unknown[] };
  return (data.results ?? []).map(normalizeDoc);
}

function normalizeDoc(r: unknown): FederalRegisterDoc {
  const o = (r ?? {}) as Record<string, unknown>;
  const agencies = (o.agencies as { name?: string }[] | undefined) ?? [];
  return {
    title: String(o.title ?? ""),
    type: String(o.type ?? ""),
    agency: String(agencies[0]?.name ?? ""),
    publicationDate: String(o.publication_date ?? ""),
    htmlUrl: String(o.html_url ?? ""),
    abstract: o.abstract ? String(o.abstract) : undefined,
  };
}

// The NON-FINAL-AUTHORITY signal: a live Proposed Rule with no superseding final Rule means the
// regulatory position is genuinely OPEN — the evidence-based basis for an "unsettled" calibration
// (replacing the discredited wording heuristic). Final Rule present ⇒ settled, not unsettled.
export function hasOpenProposedRule(docs: FederalRegisterDoc[]): boolean {
  const proposed = docs.some((d) => /proposed rule/i.test(d.type));
  const final = docs.some((d) => /^rule$/i.test(d.type.trim()));
  return proposed && !final;
}

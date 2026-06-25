// Hybrid retrieval over the authority graph (Phase 1b): sparse (tsvector) + dense (pgvector) fused by
// Reciprocal Rank Fusion, with the point-in-time year/jurisdiction filter applied as a hard WHERE so a
// version that does not govern the asked year never enters ranking (supersession is native to the
// data — a superseded version's tax_years simply don't include the later year). Returns the SAME
// AuthorityChunk shape the engine's reason()/verifyPositions already consume, so wiring this into
// retrieve() is a data-source swap, not a rewrite. Public reference data → read on a service connection.
import postgres from "postgres";
import { pipeline } from "@xenova/transformers";
import type { AuthorityChunk, AuthorityType } from "@/lib/tax/authority/store";
import type { Jurisdiction } from "@/lib/tax/types";

const EMBED_MODEL = "Xenova/all-MiniLM-L6-v2";
const RRF_K = 60; // standard reciprocal-rank-fusion constant

let _sql: ReturnType<typeof postgres> | null = null;
function db() {
  if (!_sql) {
    const cs = process.env.DATABASE_URL;
    if (!cs) throw new Error("DATABASE_URL is not set");
    _sql = postgres(cs, { prepare: false });
  }
  return _sql;
}

// `any` — the transformers.js pipeline() return is a wide union (image/text/token pipelines); the
// feature-extraction call shape + Tensor.data aren't expressible without the concrete pipeline type.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _extractor: any = null;
async function embedQuery(q: string): Promise<string> {
  _extractor ??= await pipeline("feature-extraction", EMBED_MODEL);
  const out = await _extractor(q, { pooling: "mean", normalize: true });
  return `[${Array.from(out.data as Float32Array).join(",")}]`;
}

// node kind → the engine's authorityType (inverse of the backfill map).
const TYPE_BY_KIND: Record<string, AuthorityType> = {
  statute: "statute", regulation: "regulation", case: "case",
  ruling: "irs_guidance", procedure: "irs_guidance", notice: "irs_guidance",
  form_instruction: "form_instruction", state: "statute",
};

type Row = {
  id: string; citation: string; jurisdiction: string; kind: string; court_level: string | null;
  circuit: string | null; tax_years: number[]; text: string; source_url: string; valid_from: string | null;
  authority_class: number | null; delegation_basis: AuthorityChunk["delegationBasis"] | null; precedential: boolean | null;
};

function toChunk(r: Row): AuthorityChunk {
  return {
    chunkId: `graph-${r.id}`,
    authorityType: TYPE_BY_KIND[r.kind] ?? "statute",
    citation: r.citation,
    jurisdiction: r.jurisdiction as Jurisdiction,
    taxYear: r.tax_years,
    effectiveDate: r.valid_from ?? `${r.tax_years[0] ?? ""}-01-01`,
    sourceUrl: r.source_url,
    ingestedAt: new Date().toISOString(),
    text: r.text,
    keywords: [],
    authorityClass: r.authority_class ?? undefined,
    delegationBasis: r.delegation_basis ?? undefined,
    courtLevel: (r.court_level as AuthorityChunk["courtLevel"]) ?? undefined,
    circuit: r.circuit ?? undefined,
    precedential: r.precedential ?? undefined,
  };
}

/**
 * Retrieve the top-k authority versions for a question via RRF-fused sparse+dense search, filtered to
 * the version that governs the question's tax year + jurisdiction. Returns AuthorityChunk[] (highest
 * fused score first). Empty ⇒ nothing on-point in the graph (the engine then abstains / fetches).
 */
export async function graphRetrieve(
  query: string,
  opts: { taxYear: number; jurisdiction: Jurisdiction; k?: number },
): Promise<AuthorityChunk[]> {
  const sql = db();
  const k = opts.k ?? 8;
  const emb = await embedQuery(query);

  const sparse = await sql<{ id: string; rk: number }[]>`
    select v.id, row_number() over (order by ts_rank_cd(v.search, plainto_tsquery('english', ${query})) desc) as rk
    from authority_versions v join authority_nodes n on n.id = v.node_id
    where v.search @@ plainto_tsquery('english', ${query})
      and n.jurisdiction = ${opts.jurisdiction} and ${opts.taxYear} = any(v.tax_years)
    limit 30`;
  const dense = await sql<{ id: string; rk: number }[]>`
    select e.version_id as id, row_number() over (order by e.embedding <=> ${emb}::vector) as rk
    from authority_embedding e
    join authority_versions v on v.id = e.version_id join authority_nodes n on n.id = v.node_id
    where n.jurisdiction = ${opts.jurisdiction} and ${opts.taxYear} = any(v.tax_years)
    limit 30`;

  const score = new Map<string, number>();
  for (const r of sparse) score.set(r.id, (score.get(r.id) ?? 0) + 1 / (RRF_K + Number(r.rk)));
  for (const r of dense) score.set(r.id, (score.get(r.id) ?? 0) + 1 / (RRF_K + Number(r.rk)));
  const topIds = [...score.entries()].sort((a, b) => b[1] - a[1]).slice(0, k).map(([id]) => id);
  if (!topIds.length) return [];

  const rows = await sql<Row[]>`
    select v.id, n.citation, n.jurisdiction, n.kind, n.court_level, n.circuit,
           v.tax_years, v."text", v.source_url, v.valid_from, v.authority_class, v.delegation_basis, v.precedential
    from authority_versions v join authority_nodes n on n.id = v.node_id
    where v.id = any(${topIds})`;
  const byId = new Map(rows.map((r) => [r.id, r]));
  return topIds.map((id) => byId.get(id)).filter((r): r is Row => !!r).map(toChunk);
}

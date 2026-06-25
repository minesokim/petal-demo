// Backfill the in-memory REGISTERED_CORPUS into the authority graph (Phase 1a). Idempotent:
// nodes upsert on (citation, jurisdiction); versions dedup on (node_id, content_hash). Runs on the
// service connection (DATABASE_URL bypasses RLS — public reference data, service-only writes).
//   node --env-file=.env.local --import tsx scripts/backfill-authority-graph.mts
import postgres from "postgres";
import { createHash } from "node:crypto";
import { REGISTERED_CORPUS } from "../lib/tax/authority/store";

// old authorityType → node kind enum (irs_guidance covers Rev Ruls/Procs/Notices → "ruling")
const KIND: Record<string, string> = {
  statute: "statute", regulation: "regulation", case: "case", irs_guidance: "ruling", form_instruction: "form_instruction",
};

const sql = postgres(process.env.DATABASE_URL!, { prepare: false });
let nodeUpserts = 0, versionsInserted = 0, skipped = 0;
try {
  for (const c of REGISTERED_CORPUS) {
    const kind = KIND[c.authorityType] ?? "statute";
    const hash = createHash("sha256").update(c.text).digest("hex").slice(0, 16);
    const node = await sql`
      insert into authority_nodes (kind, citation, jurisdiction, court_level, circuit)
      values (${kind}, ${c.citation}, ${c.jurisdiction}, ${c.courtLevel ?? null}, ${c.circuit ?? null})
      on conflict (citation, jurisdiction) do update set kind = excluded.kind
      returning id`;
    const nodeId = node[0].id as string;
    nodeUpserts++;
    const exists = await sql`select 1 from authority_versions where node_id = ${nodeId} and content_hash = ${hash} limit 1`;
    if (exists.length) { skipped++; continue; }
    const validTo = c.supersededFrom ? `${c.supersededFrom}-01-01` : null;
    await sql`
      insert into authority_versions
        (node_id, valid_from, valid_to, tax_years, "text", source_url, content_hash, authority_class, delegation_basis, precedential)
      values
        (${nodeId}, ${c.effectiveDate}, ${validTo}, ${c.taxYear as number[]}, ${c.text}, ${c.sourceUrl}, ${hash},
         ${c.authorityClass ?? null}, ${c.delegationBasis ?? null}, ${c.precedential ?? null})`;
    versionsInserted++;
  }
  console.log(`backfill: ${nodeUpserts} node upserts, ${versionsInserted} versions inserted, ${skipped} already present (of ${REGISTERED_CORPUS.length} chunks)`);
} finally {
  await sql.end();
}

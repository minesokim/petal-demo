import postgres from "postgres";
import { pipeline } from "@xenova/transformers";
const sql = postgres(process.env.DATABASE_URL!, { prepare: false });
try {
  const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  // Deliberately VOCABULARY-MISMATCHED queries (no exact term overlap with the chunk text) — the cases
  // sparse tsvector misses. Dense semantic recall should still surface the right authority.
  for (const q of ["gambling losses", "writing off a vehicle for my small business", "money servers make from customers"]) {
    const out = await extractor(q, { pooling: "mean", normalize: true });
    const lit = `[${Array.from(out.data as Float32Array).join(",")}]`;
    const hits = await sql`
      select n.citation, 1 - (e.embedding <=> ${lit}::vector) as sim
      from authority_embedding e
      join authority_versions v on v.id = e.version_id
      join authority_nodes n on n.id = v.node_id
      order by e.embedding <=> ${lit}::vector limit 3`;
    console.log(`Q: "${q}"`);
    for (const h of hits) console.log("   →", h.citation, `(sim ${Number(h.sim).toFixed(3)})`);
  }
} finally {
  await sql.end();
}

// Embed every authority_version's text with a FREE, LOCAL model (all-MiniLM-L6-v2, 384d) into
// authority_embedding — the dense recall layer. Idempotent: only embeds versions without an embedding.
// $0 (no API key); the model downloads once to the transformers.js cache.
//   node --env-file=.env.local --import tsx scripts/embed-authority-graph.mts
import postgres from "postgres";
import { pipeline } from "@xenova/transformers";

const MODEL = "Xenova/all-MiniLM-L6-v2";
const sql = postgres(process.env.DATABASE_URL!, { prepare: false });
try {
  const extractor = await pipeline("feature-extraction", MODEL);
  const rows = await sql<{ id: string; text: string }[]>`
    select v.id, v."text" from authority_versions v
    left join authority_embedding e on e.version_id = v.id
    where e.version_id is null`;
  console.log(`embedding ${rows.length} versions with ${MODEL}...`);
  let n = 0;
  for (const r of rows) {
    const out = await extractor(r.text, { pooling: "mean", normalize: true });
    const lit = `[${Array.from(out.data as Float32Array).join(",")}]`;
    await sql`
      insert into authority_embedding (version_id, embedding, model) values (${r.id}, ${lit}, ${MODEL})
      on conflict (version_id) do update set embedding = excluded.embedding, model = excluded.model`;
    n++;
  }
  console.log(`embedded ${n} versions`);
} finally {
  await sql.end();
}

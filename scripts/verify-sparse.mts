import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL!, { prepare: false });
try {
  for (const q of ["qualified business income deduction", "state and local tax cap", "gambling losses", "tip income deduction"]) {
    const hits = await sql`
      select n.citation, ts_rank_cd(v.search, plainto_tsquery('english', ${q})) as rank
      from authority_versions v join authority_nodes n on n.id = v.node_id
      where v.search @@ plainto_tsquery('english', ${q})
      order by rank desc limit 3`;
    console.log(`Q: "${q}"`);
    for (const h of hits) console.log("   →", h.citation, `(rank ${Number(h.rank).toFixed(3)})`);
    if (!hits.length) console.log("   → (no match)");
  }
} finally {
  await sql.end();
}

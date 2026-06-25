// Apply ONE hand-written migration file transactionally (rolls back on any error). The repo's
// migrations 0006+ are hand-written (drizzle's journal predates them), so this applies a single named
// file via the same DATABASE_URL the app uses. Usage:
//   node --env-file=.env.local --import tsx scripts/apply-migration.mts supabase/migrations/0035_authority_graph.sql
import postgres from "postgres";
import { readFileSync } from "node:fs";

const file = process.argv[2];
if (!file) throw new Error("usage: apply-migration.mts <path-to-sql>");
const cs = process.env.DATABASE_URL;
if (!cs) throw new Error("DATABASE_URL is not set");

const sql = postgres(cs, { prepare: false });
const content = readFileSync(file, "utf8");
try {
  await sql.begin(async (tx) => {
    await tx.unsafe(content);
  });
  console.log(`applied (transactional): ${file}`);
} catch (e) {
  console.error(`FAILED (rolled back): ${file}\n`, e instanceof Error ? e.message : e);
  process.exitCode = 1;
} finally {
  await sql.end();
}

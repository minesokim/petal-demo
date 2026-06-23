import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import { readFileSync } from "fs";
import * as schema from "../lib/db/schema";
import { seedFirm } from "../lib/db/seed";

// Load .env.local (no dotenv dep).
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i < 0) continue;
  const k = t.slice(0, i).trim();
  if (!process.env[k]) process.env[k] = t.slice(i + 1).trim();
}

// Fixed dev firm. clerk_org_id can be overridden once the real Clerk org exists:
//   npx tsx scripts/seed-cloud.ts org_xxx
const FIRM_ID = "000000a1-0000-4000-8000-0000000000a1";
const CLERK_ORG = process.argv[2] ?? "org_dev_vazant";

(async () => {
  const client = postgres(process.env.DATABASE_URL!, { prepare: false });
  const db = drizzle(client, { schema });
  // Idempotent: delete the firm (cascades to every child row), then reseed.
  await db.execute(sql`delete from firms where id = ${FIRM_ID}`);
  await db.insert(schema.firms).values({ id: FIRM_ID, clerkOrgId: CLERK_ORG, name: "Vazant EA" });
  await seedFirm(db as never, FIRM_ID);

  const r = await db.execute(sql`select
    (select count(*) from households) households,
    (select count(*) from engagements) engagements,
    (select count(*) from expected_docs) docs,
    (select count(*) from tasks) tasks,
    (select count(*) from notices) notices,
    (select count(*) from positions) positions,
    (select count(*) from skill_runs) skill_runs,
    (select count(*) from activity) activity,
    (select count(*) from threads) threads,
    (select count(*) from firm_files) files`);
  console.log("FIRM_ID =", FIRM_ID, "clerk_org =", CLERK_ORG);
  console.log("seeded counts:", r[0] ?? r);
  await client.end();
})();

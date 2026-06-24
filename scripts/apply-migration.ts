// One-off migration applier: runs a single supabase/migrations/*.sql file against the
// cloud DB over DATABASE_URL (read from .env.local; the credential never leaves the file).
// Usage: node --env-file=.env.local --import tsx scripts/apply-migration.ts 0030_sms_idempotency.sql
import postgres from "postgres";
import { readFileSync } from "fs";
import path from "path";

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error("usage: apply-migration.ts <migration-file.sql>");
  const sqlText = readFileSync(path.join(process.cwd(), "supabase/migrations", file), "utf8");

  const client = postgres(process.env.DATABASE_URL!, { prepare: false });
  try {
    await client.unsafe(sqlText);
    console.log(`applied ${file}`);
    // Confirm the index exists.
    const rows = await client`select indexname from pg_indexes where indexname = 'sms_messages_firm_twilio_sid_uniq'`;
    console.log(rows.length ? "index present: sms_messages_firm_twilio_sid_uniq" : "WARN: index not found");
  } finally {
    await client.end();
  }
}

main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });

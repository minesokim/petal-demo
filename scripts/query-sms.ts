// Diagnostic: recent sms_messages rows (David's firm). Confirms whether a duplicate bubble is
// a real double-write or just an optimistic UI artifact. Run:
// node --env-file=.env.local --import tsx scripts/query-sms.ts
import postgres from "postgres";

async function main() {
  const client = postgres(process.env.DATABASE_URL!, { prepare: false });
  try {
    const rows = await client`
      select direction, body, phone, twilio_sid, created_at
      from sms_messages
      order by created_at desc
      limit 20`;
    for (const r of rows) {
      console.log(`${r.created_at.toISOString()}  ${r.direction.padEnd(8)}  sid=${r.twilio_sid ?? "(none)"}  body=${JSON.stringify(r.body)}`);
    }
    console.log(`\n${rows.length} rows.`);
  } finally {
    await client.end();
  }
}
main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });

import { describe, it, expect, beforeAll } from "vitest";
import { randomBytes } from "crypto";
import { drizzle } from "drizzle-orm/pglite";
import type { PGlite } from "@electric-sql/pglite";
import { makeTestDb } from "../helpers/db";
import * as schema from "../../lib/db/schema";
import { startSession, setDeposit } from "../../lib/repository/intake";

const A = "11111111-1111-1111-1111-111111111111";
let pg: PGlite;
let linkId: string;
const service = () => drizzle(pg, { schema });

beforeAll(async () => {
  process.env.DATA_ENCRYPTION_KEY = randomBytes(32).toString("base64");
  pg = await makeTestDb();
  await pg.exec(`insert into firms (id, clerk_org_id, name) values ('${A}','org_dep','A');`);
  const r = await pg.query(`insert into intake_links (firm_id, token) values ('${A}','tok_dep') returning id`);
  linkId = (r.rows[0] as { id: string }).id;
});

async function depositRows(sessionId: string) {
  const r = await pg.query(
    "select count(*)::int as n from audit_log where resource_id=$1 and action='intake.session.deposit'",
    [sessionId],
  );
  return (r.rows[0] as { n: number }).n;
}

describe("⑦ setDeposit — idempotent paid-marking (no double-write)", () => {
  it("marking an already-paid session paid again is a no-op", async () => {
    const s = await startSession(service() as never, linkId, A);

    const first = await setDeposit(service() as never, s.id, "paid", "cs_1");
    expect(first.changed).toBe(true);

    // Re-delivered webhook → same call again. Must not write again.
    const second = await setDeposit(service() as never, s.id, "paid", "cs_1");
    expect(second.changed).toBe(false);

    // Exactly one audit row was written for the deposit (no double-write).
    expect(await depositRows(s.id)).toBe(1);

    // The stored Stripe session id is the FIRST one — a later event can't overwrite it.
    const row = await pg.query("select deposit_status, deposit_session_id from intake_sessions where id=$1", [s.id]);
    const got = row.rows[0] as { deposit_status: string; deposit_session_id: string };
    expect(got.deposit_status).toBe("paid");
    expect(got.deposit_session_id).toBe("cs_1");
  });

  it("a stale event cannot downgrade a paid session back to session_created/unpaid", async () => {
    const r = await pg.query(`insert into intake_links (firm_id, token) values ('${A}','tok_dep2') returning id`);
    const link2 = (r.rows[0] as { id: string }).id;
    const s = await startSession(service() as never, link2, A);

    await setDeposit(service() as never, s.id, "paid", "cs_9");
    // A late/duplicate "session_created" (or even "unpaid") event arrives — refused.
    const res = await setDeposit(service() as never, s.id, "session_created", "cs_old");
    expect(res.changed).toBe(false);

    const row = await pg.query("select deposit_status from intake_sessions where id=$1", [s.id]);
    expect((row.rows[0] as { deposit_status: string }).deposit_status).toBe("paid");
  });
});

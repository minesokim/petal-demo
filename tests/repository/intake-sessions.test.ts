import { describe, it, expect, beforeAll } from "vitest";
import { randomBytes } from "crypto";
import { drizzle } from "drizzle-orm/pglite";
import type { PGlite } from "@electric-sql/pglite";
import { makeTestDb, type Claims } from "../helpers/db";
import * as schema from "../../lib/db/schema";
import { startSession, markEmailVerified, saveAnswers, getAnswers, listIntakeSessions } from "../../lib/repository/intake";
import { isEncrypted } from "../../lib/crypto/envelope";

const A = "11111111-1111-1111-1111-111111111111";
const B = "22222222-2222-2222-2222-222222222222";
let pg: PGlite;
let linkId: string;
const service = () => drizzle(pg, { schema }); // superuser path = service db (RLS bypass)

beforeAll(async () => {
  process.env.DATA_ENCRYPTION_KEY = randomBytes(32).toString("base64");
  pg = await makeTestDb();
  await pg.exec(`insert into firms (id, clerk_org_id, name) values ('${A}','org_a','A'),('${B}','org_b','B');`);
  const r = await pg.query(`insert into intake_links (firm_id, token) values ('${A}','tok_s') returning id`);
  linkId = (r.rows[0] as { id: string }).id;
});

async function asTenant<T>(claims: Claims, fn: (db: ReturnType<typeof drizzle>) => Promise<T>): Promise<T> {
  await pg.exec("begin");
  try {
    await pg.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify(claims)]);
    await pg.exec("set local role authenticated");
    const out = await fn(drizzle(pg, { schema }));
    await pg.exec("rollback");
    return out;
  } catch (e) { try { await pg.exec("rollback"); } catch {} throw e; }
}

describe("⑧ intake_sessions — encrypted PII + OTP gate + RLS", () => {
  it("startSession is idempotent per invite", async () => {
    const s1 = await startSession(service() as never, linkId, A);
    const s2 = await startSession(service() as never, linkId, A);
    expect(s1.id).toBe(s2.id);
  });

  it("REFUSES to store PII before email is OTP-verified", async () => {
    const s = await startSession(service() as never, linkId, A);
    await expect(saveAnswers(service() as never, s.id, { ssn: "123-45-6789" })).rejects.toThrow(/not verified/);
  });

  it("after OTP, answers are stored ENCRYPTED (no plaintext) and round-trip", async () => {
    const s = await startSession(service() as never, linkId, A);
    await markEmailVerified(service() as never, s.id);
    await saveAnswers(service() as never, s.id, { ssn: "123-45-6789", income: 58000 });

    const raw = await pg.query("select answers_ciphertext from intake_sessions where id=$1", [s.id]);
    const ct = (raw.rows[0] as { answers_ciphertext: string }).answers_ciphertext;
    expect(isEncrypted(ct)).toBe(true);
    expect(ct).not.toContain("123-45-6789"); // SSN never sits in plaintext

    const got = (await getAnswers(service() as never, s.id)) as { ssn: string; income: number };
    expect(got.ssn).toBe("123-45-6789");
    expect(got.income).toBe(58000);
  });

  it("preparer in the firm sees the session (RLS); another firm sees none", async () => {
    const mine = await asTenant({ firm_id: A, role: "owner", user_type: "preparer" }, (db) => listIntakeSessions(db as never));
    const others = await asTenant({ firm_id: B, role: "owner", user_type: "preparer" }, (db) => listIntakeSessions(db as never));
    expect(mine.length).toBeGreaterThanOrEqual(1);
    expect(others.length).toBe(0);
  });
});

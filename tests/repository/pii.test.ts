import { describe, it, expect, beforeAll } from "vitest";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import type { PGlite } from "@electric-sql/pglite";
import { makeTestDb, type Claims } from "../helpers/db";
import * as schema from "../../lib/db/schema";
import { setPersonSsn, getPersonSsn } from "../../lib/repository/pii";
import { peopleOf } from "../../lib/repository/practice";
import { isEncrypted } from "../../lib/crypto/envelope";

const A = "11111111-1111-1111-1111-111111111111";
let pg: PGlite;

beforeAll(async () => {
  process.env.DATA_ENCRYPTION_KEY = randomBytes(32).toString("base64");
  pg = await makeTestDb();
  await pg.exec(`
    insert into firms (id, clerk_org_id, name) values ('${A}','org_a','A');
    insert into households (id, firm_id, name, kind, service_tier, since) values ('hA','${A}','Chen','individual','Premium',2019);
    insert into people (id, firm_id, household_id, name, role) values ('pA','${A}','hA','Mia Chen','Taxpayer');
  `);
});

const claims: Claims = { firm_id: A, role: "owner", user_type: "preparer" };
async function asTenant<T>(fn: (db: ReturnType<typeof drizzle>) => Promise<T>): Promise<T> {
  await pg.exec("begin");
  try {
    await pg.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify(claims)]);
    await pg.exec("set local role authenticated");
    const r = await fn(drizzle(pg, { schema }));
    await pg.exec("rollback");
    return r;
  } catch (e) { try { await pg.exec("rollback"); } catch {} throw e; }
}
const ctx = { firmId: A, actorId: "u1", actorType: "preparer" as const };

describe("PII envelope encryption end-to-end", () => {
  it("stores SSN encrypted, decrypts for read, keeps it out of default projection + audit", async () => {
    const out = await asTenant(async (db) => {
      await setPersonSsn(db as never, ctx, "pA", "123-45-6789");
      const rawSsn = (await db.select({ ssn: schema.people.ssn }).from(schema.people).where(eq(schema.people.id, "pA")))[0].ssn;
      const decrypted = await getPersonSsn(db as never, ctx, "pA");
      const listed = await peopleOf(db as never, "hA");
      const audits = await db.select().from(schema.auditLog);
      return {
        rawSsn,
        decrypted,
        listedKeys: Object.keys(listed[0]),
        auditActions: audits.map((a) => a.action).sort(),
        auditBlob: JSON.stringify(audits),
      };
    });
    expect(isEncrypted(out.rawSsn)).toBe(true);       // ciphertext at rest
    expect(out.rawSsn).not.toContain("123-45-6789");
    expect(out.decrypted).toBe("123-45-6789");        // authorized read decrypts
    expect(out.listedKeys).not.toContain("ssn");      // never in the default people projection
    expect(out.auditActions).toEqual(["person.ssn.read", "person.ssn.set"]);
    expect(out.auditBlob).not.toContain("123-45-6789"); // never in audit
  });
});

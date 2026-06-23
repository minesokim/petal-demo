import { describe, it, expect, beforeAll } from "vitest";
import { drizzle } from "drizzle-orm/pglite";
import type { PGlite } from "@electric-sql/pglite";
import { makeTestDb, type Claims } from "../helpers/db";
import * as schema from "../../lib/db/schema";
import { listConnections, upsertConnection } from "../../lib/repository/connections";

const A = "11111111-1111-1111-1111-111111111111";
const B = "22222222-2222-2222-2222-222222222222";
let pg: PGlite;

beforeAll(async () => {
  pg = await makeTestDb();
  await pg.exec(`insert into firms (id, clerk_org_id, name) values ('${A}','org_a','A'),('${B}','org_b','B');`);
});

async function asTenant<T>(claims: Claims, fn: (db: ReturnType<typeof drizzle>) => Promise<T>): Promise<T> {
  await pg.exec("begin");
  try {
    await pg.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify(claims)]);
    await pg.exec("set local role authenticated");
    const r = await fn(drizzle(pg, { schema }));
    await pg.exec("rollback");
    return r;
  } catch (e) { try { await pg.exec("rollback"); } catch {} throw e; }
}

const ctxA = { firmId: A, actorId: "u1", actorType: "preparer" as const };

describe("connectors repository (firm-scoped + audited)", () => {
  it("upsert is idempotent per firm+toolkit and reads back scoped", async () => {
    const out = await asTenant({ firm_id: A, role: "owner", user_type: "preparer" }, async (db) => {
      await upsertConnection(db as never, ctxA, { toolkit: "gmail", status: "pending" });
      await upsertConnection(db as never, ctxA, { toolkit: "gmail", status: "connected", accountLabel: "antonio@firm.com" });
      const rows = await listConnections(db as never);
      const audits = await db.select().from(schema.auditLog);
      return { count: rows.length, status: rows[0]?.status, label: rows[0]?.accountLabel, audited: audits.length >= 2 };
    });
    expect(out.count).toBe(1); // upsert, not duplicate
    expect(out.status).toBe("connected");
    expect(out.label).toBe("antonio@firm.com");
    expect(out.audited).toBe(true);
  });

  it("another firm sees none and cannot write across firms", async () => {
    const others = await asTenant({ firm_id: B, role: "owner", user_type: "preparer" }, (db) => listConnections(db as never));
    expect(others.length).toBe(0);
    await expect(
      asTenant({ firm_id: A, role: "owner", user_type: "preparer" }, async (db) => {
        await db.insert(schema.connections).values({ firmId: B, toolkit: "quickbooks", status: "pending" });
      }),
    ).rejects.toThrow();
  });
});

import { describe, it, expect, beforeAll } from "vitest";
import { drizzle } from "drizzle-orm/pglite";
import type { PGlite } from "@electric-sql/pglite";
import { makeTestDb, type Claims } from "../helpers/db";
import * as schema from "../../lib/db/schema";
import { createClient, listClients } from "../../lib/repository/clients";

const A = "11111111-1111-1111-1111-111111111111";
const B = "22222222-2222-2222-2222-222222222222";
let pg: PGlite;

beforeAll(async () => {
  pg = await makeTestDb();
  await pg.exec(`insert into firms (id, clerk_org_id, name) values ('${A}','org_a','A'),('${B}','org_b','B');`);
});

// Run a repository call against a Drizzle handle bound to a tenant transaction.
async function asTenant<T>(claims: Claims, fn: (db: ReturnType<typeof drizzle>) => Promise<T>): Promise<T> {
  await pg.exec("begin");
  try {
    await pg.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify(claims)]);
    await pg.exec("set local role authenticated");
    const result = await fn(drizzle(pg, { schema }));
    await pg.exec("rollback");
    return result;
  } catch (e) {
    try { await pg.exec("rollback"); } catch { /* aborted */ }
    throw e;
  }
}

describe("clients repository (tenant-scoped + audited)", () => {
  it("createClient inserts scoped to the firm and writes an audit row", async () => {
    const out = await asTenant({ firm_id: A, role: "owner", user_type: "preparer" }, async (db) => {
      const ctx = { firmId: A, actorId: "user_1", actorType: "preparer" as const };
      const row = await createClient(db as never, ctx, { name: "Alice" });
      const list = await listClients(db as never);
      const audits = await db.select().from(schema.auditLog);
      return { rowFirm: row.firmId, rowId: row.id, count: list.length, name: list[0]?.name, auditAction: audits[0]?.action, auditResource: audits[0]?.resourceId };
    });
    expect(out.rowFirm).toBe(A);
    expect(out.count).toBe(1);
    expect(out.name).toBe("Alice");
    expect(out.auditAction).toBe("client.create");
    expect(out.auditResource).toBe(out.rowId);
  });

  it("the repository never returns another firm's clients", async () => {
    await pg.exec(`insert into clients (firm_id, name) values ('${B}','Bob');`); // persisted, firm B
    const namesForA = await asTenant({ firm_id: A, role: "owner", user_type: "preparer" }, async (db) => {
      const list = await listClients(db as never);
      return list.map((c) => c.name);
    });
    expect(namesForA).not.toContain("Bob");
  });
});

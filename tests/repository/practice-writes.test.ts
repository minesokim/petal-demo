import { describe, it, expect, beforeAll } from "vitest";
import { drizzle } from "drizzle-orm/pglite";
import type { PGlite } from "@electric-sql/pglite";
import { makeTestDb, type Claims } from "../helpers/db";
import * as schema from "../../lib/db/schema";
import { createEngagement, setEngagementStage, createTask, setTaskStatus, createHousehold, createPerson } from "../../lib/repository/practice-writes";
import { listHouseholds, peopleOf } from "../../lib/repository/practice";

const A = "11111111-1111-1111-1111-111111111111";
const B = "22222222-2222-2222-2222-222222222222";
let pg: PGlite;

beforeAll(async () => {
  pg = await makeTestDb();
  await pg.exec(`
    insert into firms (id, clerk_org_id, name) values ('${A}','org_a','A'),('${B}','org_b','B');
    insert into households (id, firm_id, name, kind, service_tier, since) values ('hA','${A}','Chen','individual','Premium',2019);
    insert into entities (id, firm_id, household_id, name, type, form) values ('eA','${A}','hA','Chen','individual','1040');
  `);
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

const claimsA: Claims = { firm_id: A, role: "owner", user_type: "preparer" };

describe("practice write-path (audited, RLS-scoped)", () => {
  it("creates + updates and writes one audit row per mutation", async () => {
    const out = await asTenant(claimsA, async (db) => {
      const ctx = { firmId: A, actorId: "u1", actorType: "preparer" as const };
      const gid = await createEngagement(db as never, ctx, {
        entityId: "eA", householdId: "hA", form: "1040", taxYear: 2025,
        stage: "ready_to_prep", statutoryDeadline: "2026-04-15", fee: 1000,
      });
      await setEngagementStage(db as never, ctx, gid, "in_preparation");
      const tid = await createTask(db as never, ctx, { householdId: "hA", status: "todo", kind: "chase", title: "T" });
      await setTaskStatus(db as never, ctx, tid, "done");
      const audits = await db.select().from(schema.auditLog);
      const eng = (await db.select().from(schema.engagements))[0];
      return { actions: audits.map((a) => a.action).sort(), stage: eng.stage };
    });
    expect(out.actions).toEqual(["engagement.create", "engagement.stage", "task.create", "task.status"]);
    expect(out.stage).toBe("in_preparation");
  });

  it("creates a client (household + contact) that reads back firm-scoped", async () => {
    const out = await asTenant(claimsA, async (db) => {
      const ctx = { firmId: A, actorId: "u1", actorType: "preparer" as const };
      const hid = await createHousehold(db as never, ctx, { name: "Acme LLC", kind: "business", serviceTier: "Standard", since: 2026 });
      await createPerson(db as never, ctx, { householdId: hid, name: "Dana Reed", email: "dana@acme.com", role: "Owner" });
      const names = (await listHouseholds(db as never)).map((h) => h.name);
      const contacts = (await peopleOf(db as never, hid)).map((p) => p.name);
      return { hasAcme: names.includes("Acme LLC"), contacts };
    });
    expect(out.hasAcme).toBe(true);
    expect(out.contacts).toEqual(["Dana Reed"]);
  });

  it("cannot write a row into another firm (RLS WITH CHECK)", async () => {
    await expect(
      asTenant(claimsA, async (db) => {
        await createTask(db as never, { firmId: B, actorId: "u1", actorType: "preparer" }, {
          householdId: "hA", status: "todo", kind: "chase", title: "Evil",
        });
      }),
    ).rejects.toThrow();
  });
});

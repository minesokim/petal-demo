import { describe, it, expect, beforeAll } from "vitest";
import { drizzle } from "drizzle-orm/pglite";
import { makeTestDb, type Claims } from "../helpers/db";
import * as schema from "../../lib/db/schema";
import * as fx from "../../lib/fixtures/firm";
import { seedFirm } from "../../lib/db/seed";
import { listHouseholds, tasksOf, engagementsOf } from "../../lib/repository/practice";

const FIRM = "11111111-1111-1111-1111-111111111111";
let pg: Awaited<ReturnType<typeof makeTestDb>>;
let db: ReturnType<typeof drizzle>;

beforeAll(async () => {
  pg = await makeTestDb();
  db = drizzle(pg, { schema });
  await pg.exec(`insert into firms (id, clerk_org_id, name) values ('${FIRM}','org_a','Vazquez');`);
  await seedFirm(db as never, FIRM); // service context (superuser bypasses RLS)
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

describe("seedFirm loads the fixture world 1:1", () => {
  it("row counts match every fixture array", async () => {
    const count = async (t: any) => (await db.select().from(t)).length;
    expect(await count(schema.households)).toBe(fx.households.length);
    expect(await count(schema.people)).toBe(fx.people.length);
    expect(await count(schema.entities)).toBe(fx.entities.length);
    expect(await count(schema.engagements)).toBe(fx.engagements.length);
    expect(await count(schema.expectedDocs)).toBe(fx.expectedDocs.length);
    expect(await count(schema.skills)).toBe(fx.skills.length);
    expect(await count(schema.notices)).toBe(fx.notices.length);
    expect(await count(schema.tasks)).toBe(fx.tasks.length);
  });

  it("the repository returns the seeded world under RLS, ids preserved", async () => {
    const out = await asTenant({ firm_id: FIRM, role: "owner", user_type: "preparer" }, async (d) => {
      const hh = await listHouseholds(d as never);
      const first = fx.households[0];
      const tOf = await tasksOf(d as never, first.id);
      const eOf = await engagementsOf(d as never, first.id);
      return { count: hh.length, ids: hh.map((h) => h.id), firstTasks: tOf.length, firstEng: eOf.length };
    });
    expect(out.count).toBe(fx.households.length);
    expect(out.ids).toContain(fx.households[0].id); // fixture text id preserved
    expect(out.firstTasks).toBe(fx.tasks.filter((t) => t.householdId === fx.households[0].id).length);
    expect(out.firstEng).toBe(fx.engagements.filter((e) => e.householdId === fx.households[0].id).length);
  });
});

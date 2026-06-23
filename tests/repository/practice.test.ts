import { describe, it, expect, beforeAll } from "vitest";
import { drizzle } from "drizzle-orm/pglite";
import type { PGlite } from "@electric-sql/pglite";
import { makeTestDb, type Claims } from "../helpers/db";
import * as schema from "../../lib/db/schema";
import * as repo from "../../lib/repository/practice";

const A = "11111111-1111-1111-1111-111111111111";
const B = "22222222-2222-2222-2222-222222222222";
let pg: PGlite;

beforeAll(async () => {
  pg = await makeTestDb();
  await pg.exec(`
    insert into firms (id, clerk_org_id, name) values ('${A}','org_a','A'),('${B}','org_b','B');
    insert into households (id, firm_id, name, kind, service_tier, since, has_8821, has_books, catch_up) values
      ('h-chen','${A}','Chen','individual','Premium',2019,true,false,'none'),
      ('h-b','${B}','Other','individual','Basic',2021,false,false,'none');
    insert into people (id, firm_id, household_id, name, email, phone, role) values
      ('p-chen','${A}','h-chen','Mia Chen','mia@x.com','555','Taxpayer');
    insert into entities (id, firm_id, household_id, name, type, form, ein, owners) values
      ('e-chen','${A}','h-chen','Mia Chen','individual','1040',null,null);
    insert into engagements (id, firm_id, entity_id, household_id, form, tax_year, stage, statutory_deadline, fee, deposit_paid, preparer) values
      ('g-chen','${A}','e-chen','h-chen','1040',2025,'in_preparation','2026-04-15',1200,true,'u-antonio');
    insert into expected_docs (id, firm_id, engagement_id, type, status) values
      ('d-chen-w2','${A}','g-chen','W-2','have');
    insert into tasks (id, firm_id, household_id, engagement_id, status, kind, title, skill_id, estimated_min) values
      ('t-chen','${A}','h-chen','g-chen','needs_decision','Variance flag','Wage variance','sk-variance',15);
    insert into notices (id, firm_id, type, household_id, tax_year, status) values
      ('n-chen','${A}','CP2000','h-chen',2024,'response_drafted');
    insert into skills (id, firm_id, name, category, trust) values
      ('sk-variance','${A}','Variance check','prep_filing',1);
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

describe("practice repository selectors", () => {
  it("returns households in the exact fixture shape (no firm_id / timestamps)", async () => {
    const out = await asTenant(claimsA, (db) => repo.householdById(db as never, "h-chen"));
    expect(Object.keys(out!).sort()).toEqual(
      ["catchUp", "has8821", "hasBooks", "id", "kind", "name", "serviceTier", "since"].sort(),
    );
    expect(out).toMatchObject({ id: "h-chen", name: "Chen", serviceTier: "Premium", since: 2019, has8821: true });
  });

  it("hydrates the client graph via the fixture seams", async () => {
    const out = await asTenant(claimsA, async (db) => ({
      people: await repo.peopleOf(db as never, "h-chen"),
      entities: await repo.entitiesOf(db as never, "h-chen"),
      engagements: await repo.engagementsOf(db as never, "h-chen"),
      docs: await repo.docsOfEngagement(db as never, "g-chen"),
      tasks: await repo.tasksOf(db as never, "h-chen"),
      notices: await repo.noticesOf(db as never, "h-chen"),
      skills: await repo.listSkills(db as never),
    }));
    expect(out.people.map((p) => p.name)).toEqual(["Mia Chen"]);
    expect(out.entities[0]).toMatchObject({ id: "e-chen", form: "1040" });
    expect(out.engagements[0]).toMatchObject({ id: "g-chen", stage: "in_preparation", fee: 1200, depositPaid: true });
    expect(typeof out.engagements[0].fee).toBe("number"); // integer money, not numeric-string
    expect(out.docs.map((d) => d.type)).toEqual(["W-2"]);
    expect(out.tasks[0]).toMatchObject({ id: "t-chen", status: "needs_decision", skillId: "sk-variance" });
    expect(out.notices[0]).toMatchObject({ id: "n-chen", type: "CP2000" });
    expect(out.skills.map((s) => s.id)).toEqual(["sk-variance"]);
  });

  it("never returns another firm's rows", async () => {
    const names = await asTenant(claimsA, (db) => repo.listHouseholds(db as never));
    expect(names.map((h) => h.name)).toEqual(["Chen"]); // 'Other' (firm B) hidden
  });
});

import { describe, it, expect, beforeAll } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { makeTestDb, asTenant } from "../helpers/db";

const A = "11111111-1111-1111-1111-111111111111";
const CHEN = "99999999-9999-9999-9999-999999999999"; // Chen's portal client id
let db: PGlite;

beforeAll(async () => {
  db = await makeTestDb();
  await db.exec(`
    insert into firms (id, clerk_org_id, name) values ('${A}','org_a','A');
    insert into households (id, firm_id, name, kind, service_tier, since) values
      ('hChen','${A}','Chen','individual','Premium',2019),
      ('hLee','${A}','Lee','individual','Basic',2020);
    insert into entities (id, firm_id, household_id, name, type, form) values
      ('eChen','${A}','hChen','Chen','individual','1040'),
      ('eLee','${A}','hLee','Lee','individual','1040');
    insert into engagements (id, firm_id, entity_id, household_id, form, tax_year, stage, statutory_deadline, fee) values
      ('gChen','${A}','eChen','hChen','1040',2025,'in_preparation','2026-04-15',1000),
      ('gLee','${A}','eLee','hLee','1040',2025,'in_preparation','2026-04-15',1000);
    insert into expected_docs (id, firm_id, engagement_id, type, status) values
      ('dChen','${A}','gChen','W-2','have'),
      ('dLee','${A}','gLee','W-2','have');
    insert into tasks (id, firm_id, household_id, status, kind, title) values ('tChen','${A}','hChen','todo','chase','internal');
    insert into clients (id, firm_id, household_id, supabase_user_id, name) values
      ('${CHEN}','${A}','hChen','33333333-3333-3333-3333-333333333333','Mia');
  `);
});

const clientClaims = { firm_id: A, user_type: "client", client_id: CHEN, household_id: "hChen" };
const prepClaims = { firm_id: A, role: "owner", user_type: "preparer" };

describe("⑧ portal client isolation (RLS by household)", () => {
  it("a client sees ONLY their own household's returns, docs, and client row", async () => {
    const out = await asTenant(db, clientClaims, async (d) => ({
      engagements: (await d.query<{ id: string }>("select id from engagements order by id")).rows.map((r) => r.id),
      docs: (await d.query<{ id: string }>("select id from expected_docs order by id")).rows.map((r) => r.id),
      clients: (await d.query<{ id: string }>("select id from clients")).rows.map((r) => r.id),
      tasks: (await d.query<{ n: number }>("select count(*)::int as n from tasks")).rows[0].n,
      households: (await d.query<{ n: number }>("select count(*)::int as n from households")).rows[0].n,
    }));
    expect(out.engagements).toEqual(["gChen"]); // not gLee
    expect(out.docs).toEqual(["dChen"]); // not dLee
    expect(out.clients).toEqual([CHEN]); // only own row
    expect(out.tasks).toBe(0); // internal — invisible to clients
    expect(out.households).toBe(0); // firm-wide tables excluded for clients
  });

  it("a preparer still sees the whole firm (regression on the firm-wide policies)", async () => {
    const out = await asTenant(db, prepClaims, async (d) => ({
      engagements: (await d.query<{ id: string }>("select id from engagements order by id")).rows.map((r) => r.id),
      tasks: (await d.query<{ n: number }>("select count(*)::int as n from tasks")).rows[0].n,
    }));
    expect(out.engagements).toEqual(["gChen", "gLee"]);
    expect(out.tasks).toBe(1);
  });
});

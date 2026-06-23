import { describe, it, expect, beforeAll } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { makeTestDb, asTenant } from "../helpers/db";

const A = "11111111-1111-1111-1111-111111111111";
const B = "22222222-2222-2222-2222-222222222222";
let db: PGlite;

beforeAll(async () => {
  db = await makeTestDb();
  await db.exec(`
    insert into firms (id, clerk_org_id, name) values ('${A}','org_a','A'),('${B}','org_b','B');
    insert into households (id, firm_id, name, kind, service_tier, since) values
      ('hA','${A}','HH A','individual','Basic',2020),('hB','${B}','HH B','individual','Basic',2020);
    insert into entities (id, firm_id, household_id, name, type, form) values ('eA','${A}','hA','E A','individual','1040');
    insert into engagements (id, firm_id, entity_id, household_id, form, tax_year, stage, statutory_deadline, fee, deposit_paid)
      values ('gA','${A}','eA','hA','1040',2025,'in_preparation','2026-04-15',1000,true);
    insert into positions (id, firm_id, engagement_id, household_id, issue, status) values ('posA','${A}','gA','hA','QBI threshold','open');
    insert into skill_runs (id, firm_id, household_id, status) values ('srA','${A}','hA','done');
    insert into activity (id, firm_id, day, kind, label, actor, household_id) values
      ('actA','${A}',23,'extraction','Extracted W-2','Petal','hA'),
      ('actB','${B}',23,'extraction','Other firm event','Petal','hB');
    insert into threads (id, firm_id, household_id, channel, status) values ('thA','${A}','hA','email','open');
  `);
});

describe("RLS isolation on provenance/activity/inbox tables", () => {
  it("a firm sees only its own activity, positions, skill runs, threads", async () => {
    const out = await asTenant(db, { firm_id: A, role: "owner", user_type: "preparer" }, async (d) => ({
      activity: (await d.query<{ label: string }>("select label from activity order by label")).rows.map((r) => r.label),
      positions: (await d.query<{ id: string }>("select id from positions")).rows.length,
      runs: (await d.query<{ id: string }>("select id from skill_runs")).rows.length,
      threads: (await d.query<{ id: string }>("select id from threads")).rows.length,
    }));
    expect(out.activity).toEqual(["Extracted W-2"]); // firm B's event hidden
    expect(out.positions).toBe(1);
    expect(out.runs).toBe(1);
    expect(out.threads).toBe(1);
  });

  it("a firm cannot insert activity into another firm", async () => {
    await expect(
      asTenant(db, { firm_id: A, role: "owner", user_type: "preparer" }, async (d) => {
        await d.query(
          "insert into activity (id, firm_id, day, kind, label, actor) values ($1,$2,$3,$4,$5,$6)",
          ["actX", B, 23, "extraction", "Evil", "Petal"],
        );
      }),
    ).rejects.toThrow();
  });
});

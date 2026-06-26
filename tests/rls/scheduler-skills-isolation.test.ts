import { describe, it, expect, beforeAll } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { makeTestDb, asTenant } from "../helpers/db";

// Cross-tenant RLS isolation for the tables added this session:
//   agent_schedules (0038) — firm-scoped recurring templates.
//   skill_versions  (0039) — immutable skill snapshots; GLOBAL (firm_id NULL) versions are readable by
//                            every firm, a firm's own only by it, and a firm writes only its own.
// Mirrors agent-layer-isolation.test.ts.

const A = "11111111-1111-1111-1111-111111111111";
const B = "22222222-2222-2222-2222-222222222222";
const SCHED_A = "a5a5a5a5-a5a5-a5a5-a5a5-a5a5a5a5a5a5";
const SCHED_B = "b5b5b5b5-b5b5-b5b5-b5b5-b5b5b5b5b5b5";
const SV_A = "a6a6a6a6-a6a6-a6a6-a6a6-a6a6a6a6a6a6";
const SV_B = "b6b6b6b6-b6b6-b6b6-b6b6-b6b6b6b6b6b6";
const SV_G = "c7c7c7c7-c7c7-c7c7-c7c7-c7c7c7c7c7c7";

const OWNER_A = { firm_id: A, role: "owner", user_type: "preparer" };

let db: PGlite;

beforeAll(async () => {
  db = await makeTestDb();
  await db.exec(`
    insert into firms (id, clerk_org_id, name) values ('${A}','org_a','Firm A'), ('${B}','org_b','Firm B');

    insert into agent_schedules (id, firm_id, kind, tier, interval_minutes, next_run_at) values
      ('${SCHED_A}','${A}','weekly_digest',2,1440, now()),
      ('${SCHED_B}','${B}','weekly_digest',2,1440, now());

    insert into skills (id, firm_id, name, category, trust, version) values
      ('sk-a','${A}','A skill','briefs',1,1),
      ('sk-b','${B}','B skill','briefs',1,1),
      ('sk-global',null,'Global skill','briefs',2,1);

    insert into skill_versions (id, skill_id, firm_id, version, definition) values
      ('${SV_A}','sk-a','${A}',1,'{"steps":["a"]}'::jsonb),
      ('${SV_B}','sk-b','${B}',1,'{"steps":["b"]}'::jsonb),
      ('${SV_G}','sk-global',null,1,'{"steps":["g"]}'::jsonb);
  `);
});

describe("RLS isolation — scheduler (0038)", () => {
  it("a firm reads ONLY its own agent_schedules", async () => {
    const ids = await asTenant(db, OWNER_A, async (d) =>
      (await d.query<{ id: string }>("select id from agent_schedules")).rows.map((r) => r.id),
    );
    expect(ids).toEqual([SCHED_A]); // B's schedule hidden
  });

  it("a firm cannot read another firm's schedule even by its exact id", async () => {
    const rows = await asTenant(db, OWNER_A, async (d) =>
      (await d.query("select id from agent_schedules where id = $1", [SCHED_B])).rows,
    );
    expect(rows).toEqual([]);
  });

  it("a firm cannot insert a schedule stamped with another firm's id (WITH CHECK)", async () => {
    await expect(
      asTenant(db, OWNER_A, async (d) => {
        await d.query("insert into agent_schedules (firm_id, kind, tier, interval_minutes, next_run_at) values ($1,$2,$3,$4, now())", [B, "evil", 1, 60]);
      }),
    ).rejects.toThrow();
  });
});

describe("RLS isolation — versioned skills (0039)", () => {
  it("a firm reads its OWN skill versions AND global ones, but never another firm's", async () => {
    const ids = await asTenant(db, OWNER_A, async (d) =>
      (await d.query<{ id: string }>("select id from skill_versions")).rows.map((r) => r.id),
    );
    expect([...ids].sort()).toEqual([SV_A, SV_G].sort()); // own + global; B's firm-owned version hidden
  });

  it("a firm cannot read another firm's skill_version by id", async () => {
    const rows = await asTenant(db, OWNER_A, async (d) =>
      (await d.query("select id from skill_versions where id = $1", [SV_B])).rows,
    );
    expect(rows).toEqual([]);
  });

  it("a firm cannot insert a skill_version stamped with another firm's id (WITH CHECK)", async () => {
    await expect(
      asTenant(db, OWNER_A, async (d) => {
        await d.query("insert into skill_versions (skill_id, firm_id, version, definition) values ($1,$2,$3,$4)", ["sk-b", B, 2, "{}"]);
      }),
    ).rejects.toThrow();
  });
});

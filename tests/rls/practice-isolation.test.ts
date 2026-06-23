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
      ('hA','${A}','HH A','individual','Basic',2020),
      ('hB','${B}','HH B','individual','Basic',2020);
    insert into tasks (id, firm_id, household_id, status, kind, title, estimated_min) values
      ('tA','${A}','hA','todo','chase','Task A',10),
      ('tB','${B}','hB','todo','chase','Task B',10);
  `);
});

describe("RLS isolation on practice tables", () => {
  it("a firm sees only its own households and tasks", async () => {
    const out = await asTenant(db, { firm_id: A, role: "owner", user_type: "preparer" }, async (d) => {
      const hh = await d.query<{ name: string }>("select name from households order by name");
      const tk = await d.query<{ title: string }>("select title from tasks order by title");
      return { households: hh.rows.map((r) => r.name), tasks: tk.rows.map((r) => r.title) };
    });
    expect(out.households).toEqual(["HH A"]);
    expect(out.tasks).toEqual(["Task A"]);
  });

  it("a firm cannot insert a task into another firm", async () => {
    await expect(
      asTenant(db, { firm_id: A, role: "owner", user_type: "preparer" }, async (d) => {
        await d.query(
          "insert into tasks (id, firm_id, household_id, status, kind, title, estimated_min) values ($1,$2,$3,$4,$5,$6,$7)",
          ["tX", B, "hB", "todo", "chase", "Evil", 10],
        );
      }),
    ).rejects.toThrow();
  });
});

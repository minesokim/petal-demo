import { describe, it, expect, beforeAll } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { makeTestDb, asTenant } from "../helpers/db";

const A = "11111111-1111-1111-1111-111111111111";
const B = "22222222-2222-2222-2222-222222222222";
let db: PGlite;

beforeAll(async () => {
  db = await makeTestDb();
  // seed as superuser (bypasses RLS) — two firms, one usage row each
  await db.exec(`
    insert into firms (id, clerk_org_id, name) values
      ('${A}','org_a','Firm A'), ('${B}','org_b','Firm B');
    insert into ai_usage (firm_id, operation, model, input_tokens, output_tokens, cost_usd) values
      ('${A}','research:reason','claude-opus-4-8',1000,200,0.030000),
      ('${B}','agent:turn','claude-opus-4-8',2000,400,0.060000);
  `);
});

describe("RLS ai_usage firm isolation", () => {
  it("a firm reads only its own usage rows", async () => {
    const ops = await asTenant(db, { firm_id: A, role: "owner", user_type: "preparer" }, async (d) => {
      const r = await d.query<{ operation: string }>("select operation from ai_usage");
      return r.rows.map((x) => x.operation);
    });
    expect(ops).toEqual(["research:reason"]); // never sees firm B's agent:turn row
  });

  it("a request with no firm claim sees no usage", async () => {
    const count = await asTenant(db, {}, async (d) => {
      const r = await d.query("select * from ai_usage");
      return r.rows.length;
    });
    expect(count).toBe(0);
  });

  it("usage is system-written: an authenticated tenant cannot insert (no insert grant)", async () => {
    await expect(
      asTenant(db, { firm_id: A, role: "owner", user_type: "preparer" }, async (d) => {
        await d.query("insert into ai_usage (firm_id, operation, model) values ($1,$2,$3)", [A, "spoof", "opus"]);
      }),
    ).rejects.toThrow();
  });
});

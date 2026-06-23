import { describe, it, expect, beforeAll } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { makeTestDb, asTenant } from "../helpers/db";

const A = "11111111-1111-1111-1111-111111111111";
const B = "22222222-2222-2222-2222-222222222222";
let db: PGlite;

beforeAll(async () => {
  db = await makeTestDb();
  // seed as superuser (bypasses RLS)
  await db.exec(`
    insert into firms (id, clerk_org_id, name) values
      ('${A}','org_a','Firm A'), ('${B}','org_b','Firm B');
    insert into clients (firm_id, name) values
      ('${A}','Alice'), ('${B}','Bob');
  `);
});

describe("RLS firm_id isolation", () => {
  it("a preparer sees only their own firm's clients", async () => {
    const names = await asTenant(db, { firm_id: A, role: "owner", user_type: "preparer" }, async (d) => {
      const r = await d.query<{ name: string }>("select name from clients order by name");
      return r.rows.map((x) => x.name);
    });
    expect(names).toEqual(["Alice"]);
  });

  it("a preparer cannot insert a row into another firm", async () => {
    await expect(
      asTenant(db, { firm_id: A, role: "owner", user_type: "preparer" }, async (d) => {
        await d.query("insert into clients (firm_id, name) values ($1,$2)", [B, "Mallory"]);
      }),
    ).rejects.toThrow();
  });

  it("a request with no firm claim sees nothing", async () => {
    const names = await asTenant(db, {}, async (d) => {
      const r = await d.query<{ name: string }>("select name from clients");
      return r.rows.map((x) => x.name);
    });
    expect(names).toEqual([]);
  });

  it("a non-owner/admin cannot change firm settings (0 rows affected)", async () => {
    const updated = await asTenant(db, { firm_id: A, role: "preparer", user_type: "preparer" }, async (d) => {
      const r = await d.query("update firms set name = 'Hacked' where id = $1 returning id", [A]);
      return r.rows.length;
    });
    expect(updated).toBe(0);
  });
});

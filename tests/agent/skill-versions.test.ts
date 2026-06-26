import { describe, it, expect, beforeAll } from "vitest";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";
import type { PGlite } from "@electric-sql/pglite";
import { makeTestDb, type Claims } from "../helpers/db";
import * as schema from "../../lib/db/schema";
import { skills } from "../../lib/db/schema";
import type { Ctx } from "../../lib/repository/types";
import { publishSkillVersion, listSkillVersions, getSkillVersion } from "../../lib/repository/skills";

// Versioned skills: publishing freezes the current definition as an immutable version (traceability + no
// history rewrite). A firm versions only its own skills; a global product skill cannot be versioned via RLS.

const A = "11111111-1111-1111-1111-111111111111";
let pg: PGlite;

beforeAll(async () => {
  pg = await makeTestDb();
  await pg.exec(`
    insert into firms (id, clerk_org_id, name) values ('${A}','org_a','Firm A');
    insert into skills (id, firm_id, name, category, trust, steps, version) values
      ('sk-firm','${A}','Chase W-2','signatures_chase',1,'["step a"]'::jsonb,1),
      ('sk-global',null,'Global Brief','briefs',2,'["g1"]'::jsonb,1);
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

const CLAIMS: Claims = { firm_id: A, role: "owner", user_type: "preparer" };
const CTX: Ctx = { firmId: A, actorId: "alice", actorType: "preparer", role: "owner" };

describe("versioned skills", () => {
  it("publishing freezes the current definition; editing + re-publishing adds an immutable v2 (history preserved)", async () => {
    await asTenant(CLAIMS, async (db) => {
      const v1 = await publishSkillVersion(db as never, CTX, "sk-firm");
      expect(v1.version).toBe(1);

      // edit the working skill, then publish again
      await db.update(skills).set({ steps: ["step a", "step b"] }).where(eq(skills.id, "sk-firm"));
      const v2 = await publishSkillVersion(db as never, CTX, "sk-firm");
      expect(v2.version).toBe(2);

      // v1 is immutable (still the original steps); v2 has the new steps
      const snap1 = await getSkillVersion(db as never, "sk-firm", 1);
      const snap2 = await getSkillVersion(db as never, "sk-firm", 2);
      expect((snap1!.definition as { steps: string[] }).steps).toEqual(["step a"]);
      expect((snap2!.definition as { steps: string[] }).steps).toEqual(["step a", "step b"]);

      // skills.version tracks the latest published; history lists newest-first
      const [skill] = await db.select().from(skills).where(eq(skills.id, "sk-firm"));
      expect(skill.version).toBe(2);
      const history = await listSkillVersions(db as never, "sk-firm");
      expect(history.map((h) => h.version)).toEqual([2, 1]);
      expect(snap1!.firmId).toBe(A); // version inherits the skill's firm scope
    });
  });

  it("RLS: a firm cannot version a GLOBAL product skill (firm_id NULL)", async () => {
    await expect(asTenant(CLAIMS, (db) => publishSkillVersion(db as never, CTX, "sk-global"))).rejects.toThrow();
  });
});

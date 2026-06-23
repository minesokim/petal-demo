import { describe, it, expect, beforeAll } from "vitest";
import { drizzle } from "drizzle-orm/pglite";
import type { PGlite } from "@electric-sql/pglite";
import { makeTestDb, type Claims } from "../helpers/db";
import * as schema from "../../lib/db/schema";
import { createIntakeLink, listIntakeLinks, resolveLinkByToken } from "../../lib/repository/intake";

const A = "11111111-1111-1111-1111-111111111111";
const B = "22222222-2222-2222-2222-222222222222";
let pg: PGlite;

beforeAll(async () => {
  pg = await makeTestDb();
  await pg.exec(`insert into firms (id, clerk_org_id, name) values ('${A}','org_a','A'),('${B}','org_b','B');`);
  // committed seed (survives the per-test rollback) so RLS + capability paths see real data
  await pg.exec(`insert into intake_links (firm_id, token, prospect_name, prospect_email) values ('${A}','tok_seed','Dana','dana@x.com');`);
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

const ctxA = { firmId: A, actorId: "u1", actorType: "preparer" as const };
const claimsA: Claims = { firm_id: A, role: "owner", user_type: "preparer" };
const claimsB: Claims = { firm_id: B, role: "owner", user_type: "preparer" };

describe("⑧ intake invites — firm-scoped RLS + capability-token resolve", () => {
  it("createIntakeLink writes (audited) and is visible to its own firm in-tx", async () => {
    const out = await asTenant(claimsA, async (db) => {
      await createIntakeLink(db as never, ctxA, { token: "tok_new", prospectName: "Eli", prospectEmail: "eli@x.com" });
      const mine = await listIntakeLinks(db as never);
      const audits = await db.select().from(schema.auditLog);
      return { tokens: mine.map((r) => r.token).sort(), audited: audits.some((a) => a.action === "intake.invite") };
    });
    expect(out.tokens).toEqual(["tok_new", "tok_seed"]); // sees committed seed + its own new row
    expect(out.audited).toBe(true);
  });

  it("another firm sees none of A's invites (RLS) and cannot insert into A", async () => {
    const others = await asTenant(claimsB, (db) => listIntakeLinks(db as never));
    expect(others.length).toBe(0); // B is isolated from A's committed seed
    await expect(
      asTenant(claimsB, async (db) => { await db.insert(schema.intakeLinks).values({ firmId: A, token: "tok_evil" }); }),
    ).rejects.toThrow();
  });

  it("the capability token resolves the invite (service path) to the right firm", async () => {
    const serviceDb = drizzle(pg, { schema }); // superuser path = service db (RLS bypassed)
    const row = await resolveLinkByToken(serviceDb as never, "tok_seed");
    expect(row?.firmId).toBe(A);
    expect(await resolveLinkByToken(serviceDb as never, "tok_nonexistent")).toBeNull();
  });
});

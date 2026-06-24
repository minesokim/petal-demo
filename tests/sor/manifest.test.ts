import { describe, it, expect, beforeAll } from "vitest";
import { drizzle } from "drizzle-orm/pglite";
import type { PGlite } from "@electric-sql/pglite";
import { makeTestDb, type Claims } from "../helpers/db";
import * as schema from "../../lib/db/schema";
import {
  seedManifestFromTemplate,
  completionFor,
  advanceRequirement,
  matchRequirement,
  canTransition,
  assertTransition,
  ManifestTransitionError,
  TEMPLATE_1040_INDIVIDUAL,
  TEMPLATE_MONTHLY_CLOSE,
} from "../../lib/sor/manifest";

const A = "11111111-1111-1111-1111-111111111111";
let pg: PGlite;

beforeAll(async () => {
  pg = await makeTestDb();
  await pg.exec(`
    insert into firms (id, clerk_org_id, name) values ('${A}','org_a','A');
    insert into households (id, firm_id, name, kind, service_tier, since)
      values ('hA','${A}','Vazquez','individual','Premium',2019);
  `);
});

const claims: Claims = { firm_id: A, role: "owner", user_type: "preparer" };
async function asTenant<T>(fn: (db: ReturnType<typeof drizzle>) => Promise<T>): Promise<T> {
  await pg.exec("begin");
  try {
    await pg.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify(claims)]);
    await pg.exec("set local role authenticated");
    const r = await fn(drizzle(pg, { schema }));
    await pg.exec("rollback");
    return r;
  } catch (e) { try { await pg.exec("rollback"); } catch {} throw e; }
}

const ctx = { firmId: A, actorId: "u1", actorType: "preparer" as const };

describe("manifest — status machine guards (pure)", () => {
  it("allows only forward hops, plus na from any non-terminal state", () => {
    expect(canTransition("pending", "requested")).toBe(true);
    expect(canTransition("requested", "received")).toBe(true);
    expect(canTransition("received", "verified")).toBe(true);
    expect(canTransition("pending", "na")).toBe(true);
    expect(canTransition("requested", "na")).toBe(true);
    expect(canTransition("received", "na")).toBe(true);
  });

  it("refuses skips and any move out of a terminal state", () => {
    expect(canTransition("pending", "verified")).toBe(false); // can't verify without a doc
    expect(canTransition("pending", "received")).toBe(true);  // a doc can arrive unprompted
    expect(canTransition("requested", "verified")).toBe(false);
    expect(canTransition("verified", "received")).toBe(false); // terminal
    expect(canTransition("na", "pending")).toBe(false);        // terminal
    expect(canTransition("received", "received")).toBe(false); // no self-loop
    expect(() => assertTransition("pending", "verified")).toThrow(ManifestTransitionError);
  });
});

describe("manifest — seed + completion rollup math", () => {
  it("seeds a 1040 template as all-pending and reports 0% with everything missing", async () => {
    const out = await asTenant(async (db) => {
      const seed = await seedManifestFromTemplate(db as never, ctx, "hA", "2025", TEMPLATE_1040_INDIVIDUAL);
      const roll = await completionFor(db as never, "hA", "2025");
      return { seed, roll };
    });
    expect(out.seed.seeded).toBe(TEMPLATE_1040_INDIVIDUAL.items.length);
    expect(out.roll.required).toBe(TEMPLATE_1040_INDIVIDUAL.items.length);
    expect(out.roll.received).toBe(0);
    expect(out.roll.verified).toBe(0);
    expect(out.roll.pct).toBe(0);
    expect(out.roll.missing.length).toBe(TEMPLATE_1040_INDIVIDUAL.items.length);
  });

  it("counts received+verified toward completion and excludes na from the denominator", async () => {
    const out = await asTenant(async (db) => {
      const seed = await seedManifestFromTemplate(db as never, ctx, "hA", "2025", TEMPLATE_MONTHLY_CLOSE);
      const byItem = new Map(seed.items.map((i) => [i.item, i.id]));
      const total = seed.items.length; // 7

      // advance: 2 received, 1 received->verified, 1 -> na. The rest stay pending.
      const bank = byItem.get("Bank statements (all accounts)")!;
      const cc = byItem.get("Credit-card statements")!;
      const payroll = byItem.get("Payroll register")!;
      const ar = byItem.get("Outstanding invoices (A/R)")!;

      await advanceRequirement(db as never, ctx, bank, "received");
      await advanceRequirement(db as never, ctx, cc, "received");
      await advanceRequirement(db as never, ctx, payroll, "received");
      await advanceRequirement(db as never, ctx, payroll, "verified");
      await advanceRequirement(db as never, ctx, ar, "na");

      const roll = await completionFor(db as never, "hA", "2025");
      return { roll, total };
    });

    // denominator = total - na = 7 - 1 = 6; received (in-hand: bank, cc, payroll) = 3; verified = 1
    expect(out.roll.na).toBe(1);
    expect(out.roll.required).toBe(out.total - 1);
    expect(out.roll.received).toBe(3);
    expect(out.roll.verified).toBe(1);
    expect(out.roll.pct).toBe(50); // 3/6
  });

  it("advanceRequirement enforces the machine against the DB's current status", async () => {
    await expect(
      asTenant(async (db) => {
        const seed = await seedManifestFromTemplate(db as never, ctx, "hA", "2025", TEMPLATE_1040_INDIVIDUAL);
        // pending -> verified is illegal; the guard reads current status first and refuses.
        await advanceRequirement(db as never, ctx, seed.items[0].id, "verified");
      }),
    ).rejects.toThrow(ManifestTransitionError);
  });

  it("matchRequirement finds a non-terminal slot by docType hint and skips verified/na", async () => {
    const out = await asTenant(async (db) => {
      const seed = await seedManifestFromTemplate(db as never, ctx, "hA", "2025", TEMPLATE_1040_INDIVIDUAL);
      const byItem = new Map(seed.items.map((i) => [i.item, i.id]));
      // verify the W-2 slot so a later match must NOT pick it.
      const w2 = byItem.get("W-2 (wages)")!;
      await advanceRequirement(db as never, ctx, w2, "received");
      await advanceRequirement(db as never, ctx, w2, "verified");

      const matchW2 = await matchRequirement(db as never, "hA", "2025", "W-2");
      const match1098 = await matchRequirement(db as never, "hA", "2025", "1098 mortgage");
      return { matchW2, match1098 };
    });
    expect(out.matchW2).toBeNull(); // W-2 already verified — not re-opened
    expect(out.match1098?.item).toContain("1098");
  });
});

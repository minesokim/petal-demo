import { describe, it, expect, beforeAll } from "vitest";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { PGlite } from "@electric-sql/pglite";
import { makeTestDb, type Claims } from "../helpers/db";
import * as schema from "../../lib/db/schema";
import { MockProvider } from "../../lib/ai/provider";
import { createSuggestion, promoteSuggestion, rejectSuggestion } from "../../lib/repository/ai";

const A = "11111111-1111-1111-1111-111111111111";
let pg: PGlite;

beforeAll(async () => {
  pg = await makeTestDb();
  await pg.exec(`
    insert into firms (id, clerk_org_id, name) values ('${A}','org_a','A');
    insert into households (id, firm_id, name, kind, service_tier, since) values ('hA','${A}','Chen','individual','Premium',2019);
    insert into tasks (id, firm_id, household_id, status, kind, title) values ('tA','${A}','hA','waiting_client','chase','Chase W-2');
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

const DraftSchema = z.object({ draftText: z.string() });
const provider = new MockProvider(() => ({ draftText: "Hi Mia, please upload your W-2." }));
const baseCtx = { firmId: A, actorId: "u1", actorType: "preparer" as const };

describe("AI quarantine (output never touches prod until a human promotes)", () => {
  it("created pending; not applied; reviewer promote applies + audits", async () => {
    const out = await asTenant(async (db) => {
      const { object } = await provider.generateObject({ system: "", prompt: "draft a reply", schema: DraftSchema });
      const sid = await createSuggestion(db as never, baseCtx, {
        targetType: "task", targetId: "tA", kind: "draft_reply", payload: object, model: "mock", confidence: 90,
      });
      const draftAfterCreate = (await db.select({ d: schema.tasks.draftText }).from(schema.tasks).where(eq(schema.tasks.id, "tA")))[0].d;
      const promoted = await promoteSuggestion(db as never, { ...baseCtx, role: "reviewer" }, sid, async (s) => {
        await db.update(schema.tasks).set({ draftText: (s.payload as { draftText: string }).draftText }).where(eq(schema.tasks.id, s.targetId!));
      });
      const draftAfterPromote = (await db.select({ d: schema.tasks.draftText }).from(schema.tasks).where(eq(schema.tasks.id, "tA")))[0].d;
      const sugg = (await db.select().from(schema.aiSuggestions).where(eq(schema.aiSuggestions.id, sid)))[0];
      const audits = (await db.select().from(schema.auditLog)).map((a) => a.action).sort();
      return { draftAfterCreate, promoted, draftAfterPromote, status: sugg.status, audits };
    });
    expect(out.draftAfterCreate).toBeNull(); // quarantined — NOT applied on create
    expect(out.promoted).toBe(true);
    expect(out.draftAfterPromote).toBe("Hi Mia, please upload your W-2.");
    expect(out.status).toBe("approved");
    expect(out.audits).toEqual(["ai.promote", "ai.suggest"]);
  });

  it("a preparer cannot promote (role gate)", async () => {
    await expect(
      asTenant(async (db) => {
        const sid = await createSuggestion(db as never, baseCtx, { targetType: "task", targetId: "tA", kind: "draft_reply", payload: { draftText: "x" } });
        await promoteSuggestion(db as never, { ...baseCtx, role: "preparer" }, sid, async () => {});
      }),
    ).rejects.toThrow("forbidden");
  });

  it("reject marks rejected + audits", async () => {
    const out = await asTenant(async (db) => {
      const sid = await createSuggestion(db as never, baseCtx, { targetType: "task", targetId: "tA", kind: "draft_reply", payload: { draftText: "x" } });
      const ok = await rejectSuggestion(db as never, { ...baseCtx, role: "reviewer" }, sid, "not needed");
      const s = (await db.select().from(schema.aiSuggestions).where(eq(schema.aiSuggestions.id, sid)))[0];
      return { ok, status: s.status };
    });
    expect(out.ok).toBe(true);
    expect(out.status).toBe("rejected");
  });
});

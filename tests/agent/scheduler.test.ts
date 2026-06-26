import { describe, it, expect, beforeAll } from "vitest";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";
import type { PGlite } from "@electric-sql/pglite";
import { makeTestDb, type Claims } from "../helpers/db";
import * as schema from "../../lib/db/schema";
import { agentSchedules, agentTasks } from "../../lib/db/schema";
import type { Ctx } from "../../lib/repository/types";
import { createSchedule, dueSchedules, fireSchedule, fireDueSchedules, nextRunAfter } from "../../lib/repository/schedules";

// The agentic-OS SCHEDULER: durable recurring runs that spawn agent_tasks when due. Tested RLS-first
// (PGlite, JWT-scoped), with `now` injected so the recurrence math is deterministic.

const A = "11111111-1111-1111-1111-111111111111";
const B = "22222222-2222-2222-2222-222222222222";
let pg: PGlite;

beforeAll(async () => {
  pg = await makeTestDb();
  await pg.exec(`
    insert into firms (id, clerk_org_id, name) values ('${A}','org_a','Firm A'),('${B}','org_b','Firm B');
    insert into households (id, firm_id, name, kind, service_tier, since) values
      ('h-a','${A}','HH A','individual','Standard',2024);
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

const CLAIMS_A: Claims = { firm_id: A, role: "owner", user_type: "preparer" };
const CLAIMS_B: Claims = { firm_id: B, role: "owner", user_type: "preparer" };
const CTX_A: Ctx = { firmId: A, actorId: "alice", actorType: "preparer", role: "owner" };

describe("nextRunAfter — deterministic interval recurrence", () => {
  it("advances by one interval when current", () => {
    const prev = new Date("2026-06-25T08:00:00Z");
    const next = nextRunAfter(prev, 1440, new Date("2026-06-25T09:00:00Z")); // daily, 1h later
    expect(next.toISOString()).toBe("2026-06-26T08:00:00.000Z");
  });
  it("jumps past a multi-interval backlog in one catch-up (no firing storm)", () => {
    const prev = new Date("2026-06-20T08:00:00Z");
    const next = nextRunAfter(prev, 1440, new Date("2026-06-25T09:00:00Z")); // ~5 days down
    expect(next.toISOString()).toBe("2026-06-26T08:00:00.000Z"); // smallest prev+k*day strictly after now
  });
});

describe("scheduler repository (RLS-scoped)", () => {
  it("creates a firm-stamped schedule; dueSchedules returns only those past next_run_at", async () => {
    await asTenant(CLAIMS_A, async (db) => {
      const due = await createSchedule(db as never, CTX_A, { kind: "weekly_digest", tier: 2, clientId: "h-a", intervalMinutes: 1440, nextRunAt: new Date("2026-06-25T00:00:00Z") });
      const notDue = await createSchedule(db as never, CTX_A, { kind: "reminder", tier: 3, intervalMinutes: 60, nextRunAt: new Date("2026-12-31T00:00:00Z") });
      expect(due.firmId).toBe(A); // stamped from ctx, never the caller

      const list = await dueSchedules(db as never, new Date("2026-06-25T09:00:00Z"));
      const ids = list.map((s) => s.id);
      expect(ids).toContain(due.id);
      expect(ids).not.toContain(notDue.id);
    });
  });

  it("firing a schedule spawns its agent_task and advances next_run_at", async () => {
    await asTenant(CLAIMS_A, async (db) => {
      const s = await createSchedule(db as never, CTX_A, { kind: "weekly_digest", tier: 2, clientId: "h-a", input: { topic: "filing status" }, intervalMinutes: 1440, nextRunAt: new Date("2026-06-25T08:00:00Z") });
      const now = new Date("2026-06-25T09:00:00Z");
      const fired = await fireSchedule(db as never, CTX_A, s, now);

      const [task] = await db.select().from(agentTasks).where(eq(agentTasks.id, fired.taskId));
      expect(task.kind).toBe("weekly_digest");
      expect(task.tier).toBe(2);
      expect((task.input as { scheduleId?: string }).scheduleId).toBe(s.id); // traceable to its schedule

      const [after] = await db.select().from(agentSchedules).where(eq(agentSchedules.id, s.id));
      expect(after.nextRunAt!.toISOString()).toBe("2026-06-26T08:00:00.000Z"); // advanced one interval
      expect(after.lastRunAt!.toISOString()).toBe(now.toISOString());
    });
  });

  it("fireDueSchedules fires every due schedule for the firm and returns the spawned task ids", async () => {
    await asTenant(CLAIMS_A, async (db) => {
      await createSchedule(db as never, CTX_A, { kind: "k1", tier: 2, intervalMinutes: 60, nextRunAt: new Date("2026-06-25T07:00:00Z") });
      await createSchedule(db as never, CTX_A, { kind: "k2", tier: 2, intervalMinutes: 60, nextRunAt: new Date("2026-06-25T07:30:00Z") });
      const fired = await fireDueSchedules(db as never, CTX_A, new Date("2026-06-25T09:00:00Z"));
      expect(fired.length).toBe(2);
      for (const f of fired) {
        const [t] = await db.select().from(agentTasks).where(eq(agentTasks.id, f.taskId));
        expect(t).toBeTruthy();
      }
    });
  });

  it("RLS: a schedule cannot be written for another firm than the caller's", async () => {
    // Under firm B's JWT, staging a firm-A schedule (ctx firmId=A) violates the WITH CHECK policy.
    await expect(
      asTenant(CLAIMS_B, (db) => createSchedule(db as never, CTX_A, { kind: "x", tier: 2, intervalMinutes: 60, nextRunAt: new Date("2026-06-25T00:00:00Z") })),
    ).rejects.toThrow();
  });
});

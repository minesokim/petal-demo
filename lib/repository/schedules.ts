import { and, eq, lte } from "drizzle-orm";
import { agentSchedules } from "@/lib/db/schema";
import type { Db, Ctx } from "./types";
import { writeAudit } from "./audit";
import { createTask } from "./agent";

// SCHEDULER repository — durable recurring runs. A schedule spawns an agent_task when due; firing advances
// next_run_at by the interval. Every query runs under the caller's JWT so RLS narrows to the firm; firm_id
// is stamped from ctx on writes (never trusted from the caller). INV-7: schedule create/fire is audited.
// `now` is always injected (never Date.now() here) so the recurrence math is deterministic and testable.

export type CreateScheduleInput = {
  clientId?: string;
  createdByUserId?: string;
  kind: string;
  tier: 1 | 2 | 3 | 4; // INV-3
  input?: Record<string, unknown>;
  intervalMinutes: number;
  nextRunAt: Date;
};

export async function createSchedule(db: Db, ctx: Ctx, input: CreateScheduleInput) {
  const [row] = await db
    .insert(agentSchedules)
    .values({
      firmId: ctx.firmId,
      clientId: input.clientId ?? null,
      createdByUserId: input.createdByUserId ?? null,
      kind: input.kind,
      tier: input.tier,
      input: input.input ?? {},
      intervalMinutes: input.intervalMinutes,
      nextRunAt: input.nextRunAt,
    })
    .returning();
  await writeAudit(db, ctx, {
    action: "agent.schedule.create",
    resourceType: "agent_schedule",
    resourceId: row.id,
    metadata: { kind: input.kind, intervalMinutes: input.intervalMinutes },
  });
  return row;
}

// Active schedules whose next_run_at has passed (firm-scoped via the caller's RLS db).
export async function dueSchedules(db: Db, now: Date) {
  return db
    .select()
    .from(agentSchedules)
    .where(and(eq(agentSchedules.active, true), lte(agentSchedules.nextRunAt, now)));
}

// The smallest prev + k*interval STRICTLY after now. When the scheduler was down for many intervals this
// jumps straight past the backlog (one catch-up run, not a storm of missed firings). Pure + deterministic.
export function nextRunAfter(prev: Date, intervalMinutes: number, now: Date): Date {
  const stepMs = intervalMinutes * 60_000;
  const prevMs = prev.getTime();
  let next = prevMs + stepMs;
  if (next <= now.getTime()) {
    const steps = Math.floor((now.getTime() - prevMs) / stepMs) + 1;
    next = prevMs + steps * stepMs;
  }
  return new Date(next);
}

type ScheduleRow = typeof agentSchedules.$inferSelect;

// Fire one schedule: spawn its agent_task and advance next_run_at. Does NOT run the task — it stages the
// unit of work on the durable runtime (the same draft-everything path), so a recurring run is still gated
// by the risk gate + human approval. Audited.
export async function fireSchedule(db: Db, ctx: Ctx, schedule: ScheduleRow, now: Date) {
  const task = await createTask(db, ctx, {
    kind: schedule.kind,
    tier: schedule.tier as 1 | 2 | 3 | 4,
    clientId: schedule.clientId ?? undefined,
    createdByUserId: schedule.createdByUserId ?? undefined,
    input: { ...((schedule.input as Record<string, unknown>) ?? {}), scheduleId: schedule.id, source: "scheduler" },
  });
  const next = nextRunAfter(schedule.nextRunAt, schedule.intervalMinutes, now);
  await db.update(agentSchedules).set({ lastRunAt: now, nextRunAt: next }).where(eq(agentSchedules.id, schedule.id));
  await writeAudit(db, ctx, {
    action: "agent.schedule.fire",
    resourceType: "agent_schedule",
    resourceId: schedule.id,
    metadata: { taskId: task.id, nextRunAt: next.toISOString() },
  });
  return { taskId: task.id, nextRunAt: next };
}

// Fire every due schedule for the caller's firm. The cross-firm cron orchestrates one call per firm.
export async function fireDueSchedules(db: Db, ctx: Ctx, now: Date) {
  const due = await dueSchedules(db, now);
  const fired: { scheduleId: string; taskId: string; nextRunAt: Date }[] = [];
  for (const s of due) fired.push({ scheduleId: s.id, ...(await fireSchedule(db, ctx, s, now)) });
  return fired;
}

export async function setScheduleActive(db: Db, ctx: Ctx, id: string, active: boolean) {
  await db.update(agentSchedules).set({ active }).where(eq(agentSchedules.id, id));
  await writeAudit(db, ctx, {
    action: active ? "agent.schedule.resume" : "agent.schedule.pause",
    resourceType: "agent_schedule",
    resourceId: id,
    metadata: {},
  });
}

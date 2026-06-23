import { eq } from "drizzle-orm";
import { households, engagements, expectedDocs, tasks } from "../db/schema";
import { writeAudit } from "./audit";
import type { Db, Ctx } from "./types";

// Audited write-path for the practice entities. Every mutation runs RLS-scoped
// (the handle carries the caller's claims) and appends one audit_log row. No
// crown-jewel PII in audit metadata — ids and status only.

function newId(prefix: string) {
  return `${prefix}_${globalThis.crypto.randomUUID()}`;
}

export type HouseholdInput = {
  id?: string; name: string; kind: string; serviceTier: string; since: number;
  has8821?: boolean; hasBooks?: boolean; catchUp?: string;
};
export async function createHousehold(db: Db, ctx: Ctx, input: HouseholdInput) {
  const id = input.id ?? newId("h");
  await db.insert(households).values({
    id, firmId: ctx.firmId, name: input.name, kind: input.kind, serviceTier: input.serviceTier,
    since: input.since, has8821: input.has8821 ?? false, hasBooks: input.hasBooks ?? false, catchUp: input.catchUp,
  });
  await writeAudit(db, ctx, { action: "household.create", resourceType: "household", resourceId: id });
  return id;
}

export type EngagementInput = {
  id?: string; entityId: string; householdId: string; form: string; taxYear: number;
  stage: string; statutoryDeadline: string; fee: number; depositPaid?: boolean; preparer?: string;
};
export async function createEngagement(db: Db, ctx: Ctx, input: EngagementInput) {
  const id = input.id ?? newId("g");
  await db.insert(engagements).values({
    id, firmId: ctx.firmId, entityId: input.entityId, householdId: input.householdId, form: input.form,
    taxYear: input.taxYear, stage: input.stage, statutoryDeadline: input.statutoryDeadline,
    fee: input.fee, depositPaid: input.depositPaid ?? false, preparer: input.preparer,
  });
  await writeAudit(db, ctx, { action: "engagement.create", resourceType: "engagement", resourceId: id });
  return id;
}

export async function setEngagementStage(db: Db, ctx: Ctx, id: string, stage: string) {
  const rows = await db.update(engagements).set({ stage, updatedAt: new Date() })
    .where(eq(engagements.id, id)).returning({ id: engagements.id });
  if (rows.length) {
    await writeAudit(db, ctx, { action: "engagement.stage", resourceType: "engagement", resourceId: id, metadata: { stage } });
  }
  return rows.length > 0;
}

export type TaskInput = {
  id?: string; householdId: string; engagementId?: string; status: string; kind: string;
  title: string; why?: string; skillId?: string; estimatedMin?: number; origin?: string; assigneeId?: string;
};
export async function createTask(db: Db, ctx: Ctx, input: TaskInput) {
  const id = input.id ?? newId("t");
  await db.insert(tasks).values({
    id, firmId: ctx.firmId, householdId: input.householdId, engagementId: input.engagementId,
    status: input.status, kind: input.kind, title: input.title, why: input.why, skillId: input.skillId,
    estimatedMin: input.estimatedMin, origin: input.origin, assigneeId: input.assigneeId,
  });
  await writeAudit(db, ctx, { action: "task.create", resourceType: "task", resourceId: id });
  return id;
}

export async function setTaskStatus(db: Db, ctx: Ctx, id: string, status: string) {
  const rows = await db.update(tasks).set({ status, updatedAt: new Date() })
    .where(eq(tasks.id, id)).returning({ id: tasks.id });
  if (rows.length) {
    await writeAudit(db, ctx, { action: "task.status", resourceType: "task", resourceId: id, metadata: { status } });
  }
  return rows.length > 0;
}

export async function setDocStatus(db: Db, ctx: Ctx, id: string, status: string) {
  const rows = await db.update(expectedDocs).set({ status, updatedAt: new Date() })
    .where(eq(expectedDocs.id, id)).returning({ id: expectedDocs.id });
  if (rows.length) {
    await writeAudit(db, ctx, { action: "doc.status", resourceType: "expected_doc", resourceId: id, metadata: { status } });
  }
  return rows.length > 0;
}

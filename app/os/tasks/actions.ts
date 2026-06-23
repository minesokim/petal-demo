"use server";

import { revalidatePath } from "next/cache";
import { withFirm } from "@/lib/auth/tenant";
import { createTask, setTaskStatus } from "@/lib/repository/practice-writes";

export type NewTaskInput = {
  householdId: string; // required — tasks.household_id is NOT NULL w/ FK to households
  engagementId?: string;
  title: string;
  why?: string;
  assigneeId?: string; // omit to leave Petal-owned
  origin?: "petal" | "human";
};

// Persists a real human-created task to the firm's DB, audited + RLS-scoped via
// withFirm. Mirrors createClientAction: withFirm → repo writer (createTask, which
// already appends one audit_log row) → revalidatePath. Returns the new id so the
// UI can refresh. Note: a task must belong to a household (FK), so the caller must
// pass a non-empty householdId — a "None" client cannot be persisted this way.
export async function createTaskAction(input: NewTaskInput): Promise<{ id: string } | null> {
  if (!input.householdId.trim() || !input.title.trim()) return null;
  const result = await withFirm(async (db, ctx) => {
    const id = await createTask(db, ctx, {
      householdId: input.householdId,
      engagementId: input.engagementId,
      status: "todo",
      kind: "Task",
      title: input.title.trim(),
      why: input.why?.trim() || undefined,
      skillId: "",
      origin: input.origin ?? "human",
      assigneeId: input.assigneeId,
    });
    return { id };
  });
  if (result) revalidatePath("/os/tasks");
  return result;
}

// Moves a task to a new status (audited + RLS-scoped). setTaskStatus already
// appends one audit_log row with the new status. Returns whether a row changed.
export async function setTaskStatusAction(id: string, status: string): Promise<boolean> {
  const result = await withFirm(async (db, ctx) => setTaskStatus(db, ctx, id, status));
  if (result) revalidatePath("/os/tasks");
  return result ?? false;
}

// Approve a Petal task: the verb is "Approve" / "Approve & send", which resolves
// the task to done. Maps to setTaskStatus(id, "done").
export async function approveTaskAction(id: string): Promise<boolean> {
  return setTaskStatusAction(id, "done");
}

// Mark a human to-do done. Maps to setTaskStatus(id, "done").
export async function markTaskDoneAction(id: string): Promise<boolean> {
  return setTaskStatusAction(id, "done");
}

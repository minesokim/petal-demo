"use server";

import { sql, eq } from "drizzle-orm";
import { withFirm } from "@/lib/auth/tenant";
import { firms } from "@/lib/db/schema";
import { writeAudit } from "@/lib/repository/audit";
import { createTask } from "@/lib/repository/practice-writes";
import { listHouseholds } from "@/lib/repository/practice";

// Onboarding writes to the signed-in user's real firm (audited, RLS-scoped).
// settings is merged (jsonb ||) so each step keeps the prior keys.

export async function setFirmName(name: string, settingsPatch: Record<string, unknown> = {}) {
  return withFirm(async (db, ctx) => {
    await db
      .update(firms)
      .set({
        name: name.trim() || "My Firm",
        settings: sql`coalesce(${firms.settings}, '{}'::jsonb) || ${JSON.stringify(settingsPatch)}::jsonb`,
        updatedAt: new Date(),
      })
      .where(eq(firms.id, ctx.firmId));
    await writeAudit(db, ctx, { action: "firm.update", resourceType: "firm", resourceId: ctx.firmId });
    return { ok: true };
  });
}

export async function patchFirmSettings(patch: Record<string, unknown>) {
  return withFirm(async (db, ctx) => {
    await db
      .update(firms)
      .set({
        settings: sql`coalesce(${firms.settings}, '{}'::jsonb) || ${JSON.stringify(patch)}::jsonb`,
        updatedAt: new Date(),
      })
      .where(eq(firms.id, ctx.firmId));
    await writeAudit(db, ctx, { action: "firm.update", resourceType: "firm", resourceId: ctx.firmId });
    return { ok: true };
  });
}

// Seeds 2-3 real getting-started tasks so step 5's promise ("Petal's set up a few
// getting-started tasks for you inside") is actually true. Tasks are NOT NULL on
// householdId, so we attach them to the client just created in onboarding (or, when
// the preparer skipped that step, the firm's first household). With no household yet,
// there's nothing to attach to — we no-op rather than fail. Audited via createTask.
export async function seedGettingStartedTasksAction(householdId?: string): Promise<{ seeded: number } | null> {
  return withFirm(async (db, ctx) => {
    let target = householdId?.trim() || undefined;
    if (!target) {
      const households = await listHouseholds(db);
      target = households[0]?.id;
    }
    if (!target) return { seeded: 0 };

    const starters: { kind: string; title: string; why: string; estimatedMin: number }[] = [
      {
        kind: "Getting started",
        title: "Finish your firm profile",
        why: "Add your EFIN, PTIN, and credential so filings and 8879 authorizations show the right details.",
        estimatedMin: 3,
      },
      {
        kind: "Getting started",
        title: "Connect your accounting and email",
        why: "Link QuickBooks and Gmail from Integrations so Petal can read from your stack to draft work.",
        estimatedMin: 5,
      },
      {
        kind: "Getting started",
        title: "Review your trust & autonomy settings",
        why: "Set what Petal may do on its own per skill before you start working. Writes stay gated until you decide.",
        estimatedMin: 4,
      },
    ];

    for (const s of starters) {
      await createTask(db, ctx, {
        householdId: target,
        status: "todo",
        kind: s.kind,
        title: s.title,
        why: s.why,
        estimatedMin: s.estimatedMin,
        origin: "petal",
      });
    }
    return { seeded: starters.length };
  });
}

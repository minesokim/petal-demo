"use server";

import { sql, eq } from "drizzle-orm";
import { withFirm } from "@/lib/auth/tenant";
import { firms } from "@/lib/db/schema";
import { writeAudit } from "@/lib/repository/audit";

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
    return { ok: true };
  });
}

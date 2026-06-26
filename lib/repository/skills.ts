import { and, desc, eq, max } from "drizzle-orm";
import { skills, skillVersions } from "@/lib/db/schema";
import type { Db, Ctx } from "./types";
import { writeAudit } from "./audit";

// VERSIONED SKILLS. Publishing freezes a skill's current definition as the next immutable version, so a
// skill_run is traceable to the exact playbook it executed and editing a skill never rewrites history.
// RLS: a firm versions only its OWN skills — publishing a global product skill (firm_id NULL) is rejected by
// the skill_versions WITH CHECK policy (those are product-managed via the service role).

const DEFINITION_FIELDS = [
  "name", "category", "trust", "description", "trigger", "steps", "channels", "tone", "escalation", "variants", "graduation",
] as const;

export async function publishSkillVersion(db: Db, ctx: Ctx, skillId: string): Promise<{ version: number; id: string }> {
  const [skill] = await db.select().from(skills).where(eq(skills.id, skillId));
  if (!skill) throw new Error("skill not found");

  const [{ m }] = await db.select({ m: max(skillVersions.version) }).from(skillVersions).where(eq(skillVersions.skillId, skillId));
  const version = (m ?? 0) + 1;
  const definition = Object.fromEntries(DEFINITION_FIELDS.map((f) => [f, (skill as Record<string, unknown>)[f]]));

  const [row] = await db
    .insert(skillVersions)
    .values({ skillId, firmId: skill.firmId, version, definition, publishedByUserId: ctx.actorId ?? null })
    .returning();
  await db.update(skills).set({ version, updatedAt: new Date() }).where(eq(skills.id, skillId));
  await writeAudit(db, ctx, {
    action: "agent.skill.publish",
    resourceType: "skill",
    resourceId: skillId,
    metadata: { version },
  });
  return { version, id: row.id };
}

export async function listSkillVersions(db: Db, skillId: string) {
  return db.select().from(skillVersions).where(eq(skillVersions.skillId, skillId)).orderBy(desc(skillVersions.version));
}

export async function getSkillVersion(db: Db, skillId: string, version: number) {
  const [r] = await db.select().from(skillVersions).where(and(eq(skillVersions.skillId, skillId), eq(skillVersions.version, version)));
  return r ?? null;
}

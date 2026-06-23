import { and, eq } from "drizzle-orm";
import { firms, firmMembers } from "../db/schema";
import { writeAudit } from "./audit";
import type { Ctx, Db } from "./types";
import type { Role } from "../auth/roles";

// These run in the trusted service context (Clerk webhook / migrations), which
// bypasses RLS — they are the one place writes cross firm boundaries by design.
// Every mutation still leaves an audit row, attributed to the system actor and
// scoped to the affected firm. Metadata carries only ids/role — never PII.
function systemCtx(firmId: string): Ctx {
  return { firmId, actorId: "system", actorType: "system" };
}

export async function resolveFirmIdByClerkOrg(db: Db, clerkOrgId: string): Promise<string | null> {
  const [row] = await db.select({ id: firms.id }).from(firms).where(eq(firms.clerkOrgId, clerkOrgId));
  return row?.id ?? null;
}

// Resolve the firm for this org, creating it EMPTY on first sign-in (real-data
// onboarding — never the seed fixtures). The signed-in user becomes its owner.
export async function ensureFirm(
  db: Db,
  clerkOrgId: string,
  clerkUserId: string,
  role: Role,
  name = "My Firm",
): Promise<string> {
  const existing = await resolveFirmIdByClerkOrg(db, clerkOrgId);
  const firmId = existing
    ?? (await db.insert(firms).values({ clerkOrgId, name }).onConflictDoNothing({ target: firms.clerkOrgId }).returning())[0]?.id
    ?? (await resolveFirmIdByClerkOrg(db, clerkOrgId))!; // lost an insert race — re-resolve
  await writeAudit(db, systemCtx(firmId), {
    action: "firm.ensure",
    resourceType: "firm",
    resourceId: firmId,
    metadata: { clerkOrgId, created: existing == null },
  });
  await upsertMemberFromClerk(db, { firmId, clerkUserId, role });
  return firmId;
}

export async function upsertFirmFromClerk(db: Db, input: { clerkOrgId: string; name: string }) {
  const [row] = await db
    .insert(firms)
    .values({ clerkOrgId: input.clerkOrgId, name: input.name })
    .onConflictDoUpdate({ target: firms.clerkOrgId, set: { name: input.name, updatedAt: new Date() } })
    .returning();
  await writeAudit(db, systemCtx(row.id), {
    action: "firm.upsert",
    resourceType: "firm",
    resourceId: row.id,
    metadata: { clerkOrgId: input.clerkOrgId },
  });
  return row;
}

export async function upsertMemberFromClerk(
  db: Db,
  input: { firmId: string; clerkUserId: string; role: Role; name?: string; email?: string },
) {
  const [row] = await db
    .insert(firmMembers)
    .values({
      firmId: input.firmId,
      clerkUserId: input.clerkUserId,
      role: input.role,
      name: input.name,
      email: input.email,
      active: true,
    })
    .onConflictDoUpdate({
      target: [firmMembers.firmId, firmMembers.clerkUserId],
      set: { role: input.role, name: input.name, email: input.email, active: true, updatedAt: new Date() },
    })
    .returning();
  await writeAudit(db, systemCtx(input.firmId), {
    action: "member.upsert",
    resourceType: "firm_member",
    resourceId: row.id,
    // ids/role only — name/email are PII and stay out of the audit row.
    metadata: { clerkUserId: input.clerkUserId, role: input.role },
  });
  return row;
}

export async function deactivateMember(db: Db, firmId: string, clerkUserId: string) {
  await db
    .update(firmMembers)
    .set({ active: false, updatedAt: new Date() })
    .where(and(eq(firmMembers.firmId, firmId), eq(firmMembers.clerkUserId, clerkUserId)));
  await writeAudit(db, systemCtx(firmId), {
    action: "member.deactivate",
    resourceType: "firm_member",
    resourceId: clerkUserId,
    metadata: { clerkUserId },
  });
}

import { and, eq } from "drizzle-orm";
import { firms, firmMembers } from "../db/schema";
import type { Db } from "./types";
import type { Role } from "../auth/roles";

// These run in the trusted service context (Clerk webhook / migrations), which
// bypasses RLS — they are the one place writes cross firm boundaries by design.

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
  await upsertMemberFromClerk(db, { firmId, clerkUserId, role });
  return firmId;
}

export async function upsertFirmFromClerk(db: Db, input: { clerkOrgId: string; name: string }) {
  const [row] = await db
    .insert(firms)
    .values({ clerkOrgId: input.clerkOrgId, name: input.name })
    .onConflictDoUpdate({ target: firms.clerkOrgId, set: { name: input.name, updatedAt: new Date() } })
    .returning();
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
  return row;
}

export async function deactivateMember(db: Db, firmId: string, clerkUserId: string) {
  await db
    .update(firmMembers)
    .set({ active: false, updatedAt: new Date() })
    .where(and(eq(firmMembers.firmId, firmId), eq(firmMembers.clerkUserId, clerkUserId)));
}

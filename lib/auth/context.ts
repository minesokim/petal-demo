import { auth } from "@clerk/nextjs/server";
import { mapClerkRole, type Role } from "./roles";

export type FirmContext = { clerkOrgId: string; role: Role; userId: string };

// Reads the active Clerk org from the request session. Returns null if not
// signed in or no active org selected. The internal firm_id (uuid) is resolved
// from clerkOrgId in the data layer (see lib/auth/supabase-token.ts, Task 5).
export async function getFirmContext(): Promise<FirmContext | null> {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) return null;
  return { clerkOrgId: orgId, role: mapClerkRole(orgRole), userId };
}

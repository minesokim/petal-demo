import { auth } from "@clerk/nextjs/server";
import { mapClerkRole, type Role } from "./roles";

export type FirmContext = { clerkOrgId: string; role: Role; userId: string };

// Reads the active Clerk org from the request session. Returns null if Clerk
// isn't configured yet, the user isn't signed in, or no active org is selected —
// so the app degrades gracefully to fixtures until credentials land. The internal
// firm_id (uuid) is resolved from clerkOrgId in the data layer.
export async function getFirmContext(): Promise<FirmContext | null> {
  if (!process.env.CLERK_SECRET_KEY) return null;
  try {
    const { userId, orgId, orgRole } = await auth();
    if (!userId || !orgId) return null;
    return { clerkOrgId: orgId, role: mapClerkRole(orgRole), userId };
  } catch {
    return null;
  }
}

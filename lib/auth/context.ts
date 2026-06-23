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
    if (!userId) return null;
    if (orgId) return { clerkOrgId: orgId, role: mapClerkRole(orgRole), userId };
    // No active org: give this user their OWN firm (a stable per-user key). The
    // data layer provisions it empty on first use — real data only, never the
    // seed fixtures. Real production firms come from Clerk orgs (org path above).
    return { clerkOrgId: `user_${userId}`, role: "owner", userId };
  } catch {
    return null;
  }
}

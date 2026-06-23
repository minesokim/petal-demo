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
    // Dev/demo only (DEMO_CLERK_ORG unset in production): a signed-in user with no
    // active org maps to the seeded demo firm, so real data shows without org setup.
    // RLS isolation is unaffected — it's still keyed on the resolved firm_id.
    if (process.env.DEMO_CLERK_ORG) return { clerkOrgId: process.env.DEMO_CLERK_ORG, role: "owner", userId };
    return null;
  } catch {
    return null;
  }
}

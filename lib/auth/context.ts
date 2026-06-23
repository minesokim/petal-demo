import { auth } from "@clerk/nextjs/server";
import { mapClerkRole, type Role } from "./roles";

export type FirmContext = { clerkOrgId: string; role: Role; userId: string };

// TEST-ONLY auth bypass for verification without a real login. Active ONLY when
// PETAL_TEST_BYPASS (a target clerk_org_id) is set AND the deploy is NOT production
// (Vercel sets VERCEL_ENV="production" on the prod deploy). This double gate makes it
// IMPOSSIBLE to bypass auth on petal-prod even if the env var were set there. Used to
// drive Playwright through the signed-in /os surfaces on a preview deploy.
function testBypassFirm(): FirmContext | null {
  const org = process.env.PETAL_TEST_BYPASS;
  if (org && process.env.VERCEL_ENV !== "production") {
    return { clerkOrgId: org, role: "owner", userId: "test_bypass" };
  }
  return null;
}

// Reads the active Clerk org from the request session. Returns null if Clerk
// isn't configured yet, the user isn't signed in, or no active org is selected —
// so the app degrades gracefully to fixtures until credentials land. The internal
// firm_id (uuid) is resolved from clerkOrgId in the data layer.
export async function getFirmContext(): Promise<FirmContext | null> {
  if (!process.env.CLERK_SECRET_KEY) return testBypassFirm();
  try {
    const { userId, orgId, orgRole } = await auth();
    if (!userId) return testBypassFirm(); // not signed in — test bypass on non-prod only
    if (orgId) return { clerkOrgId: orgId, role: mapClerkRole(orgRole), userId };
    // No active org: give this user their OWN firm (a stable per-user key). The
    // data layer provisions it empty on first use — real data only, never the
    // seed fixtures. Real production firms come from Clerk orgs (org path above).
    return { clerkOrgId: `user_${userId}`, role: "owner", userId };
  } catch {
    return testBypassFirm();
  }
}

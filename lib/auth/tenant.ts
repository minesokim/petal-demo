import { getFirmContext } from "./context";
import { getServiceDb, withTenant, type TenantClaims } from "../db/client";
import { resolveFirmIdByClerkOrg } from "../repository/firms";
import type { Db } from "../repository/types";
import type { Ctx } from "../repository/types";

// Resolve the signed-in preparer's firm and run fn under RLS. Returns null if not
// authenticated or the firm hasn't synced from Clerk yet (caller renders signed-out
// / onboarding). This is the single entry point the UI's server actions use.
export async function withFirm<T>(fn: (db: Db, ctx: Ctx) => Promise<T>): Promise<T | null> {
  const fc = await getFirmContext();
  if (!fc) return null;
  const firmId = await resolveFirmIdByClerkOrg(getServiceDb(), fc.clerkOrgId);
  if (!firmId) return null;
  const claims: TenantClaims = { firm_id: firmId, role: fc.role, user_type: "preparer" };
  const ctx: Ctx = { firmId, actorId: fc.userId, actorType: "preparer" };
  return withTenant(claims, (db) => fn(db, ctx));
}

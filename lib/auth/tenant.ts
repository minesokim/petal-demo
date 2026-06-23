import { getFirmContext } from "./context";
import { getServiceDb, withTenant, type TenantClaims } from "../db/client";
import { ensureFirm } from "../repository/firms";
import type { Db } from "../repository/types";
import type { Ctx } from "../repository/types";

// Resolve the signed-in preparer's firm (provisioning it EMPTY on first sign-in)
// and run fn under RLS. Returns null only if not authenticated — a signed-in user
// always has a real firm. This is the single entry point the UI's server actions use.
export async function withFirm<T>(fn: (db: Db, ctx: Ctx) => Promise<T>): Promise<T | null> {
  const fc = await getFirmContext();
  if (!fc) return null;
  const firmId = await ensureFirm(getServiceDb(), fc.clerkOrgId, fc.userId, fc.role);
  const claims: TenantClaims = { firm_id: firmId, role: fc.role, user_type: "preparer" };
  const ctx: Ctx = { firmId, actorId: fc.userId, actorType: "preparer" };
  return withTenant(claims, (db) => fn(db, ctx));
}

import type { Db } from "../repository/types";
import { mapClerkRole } from "./roles";
import {
  upsertFirmFromClerk,
  upsertMemberFromClerk,
  deactivateMember,
  resolveFirmIdByClerkOrg,
} from "../repository/firms";

// The subset of Clerk webhook payloads we act on. Kept structural so it's
// unit-testable without the Clerk SDK.
export type ClerkEvent = {
  type: string;
  data: {
    id?: string;
    name?: string;
    role?: string;
    organization?: { id: string; name: string };
    public_user_data?: { user_id: string; first_name?: string; last_name?: string; identifier?: string };
  };
};

function memberName(d: NonNullable<ClerkEvent["data"]["public_user_data"]>): string | undefined {
  return [d.first_name, d.last_name].filter(Boolean).join(" ") || undefined;
}

// Apply a verified Clerk org/membership event to the firm + member tables.
// Runs in the service context (RLS-bypassing db handle).
export async function handleClerkEvent(db: Db, evt: ClerkEvent): Promise<void> {
  switch (evt.type) {
    case "organization.created":
    case "organization.updated": {
      if (evt.data.id && evt.data.name) {
        await upsertFirmFromClerk(db, { clerkOrgId: evt.data.id, name: evt.data.name });
      }
      return;
    }
    case "organizationMembership.created":
    case "organizationMembership.updated": {
      const org = evt.data.organization;
      const u = evt.data.public_user_data;
      if (!org || !u) return;
      const firmId =
        (await resolveFirmIdByClerkOrg(db, org.id)) ??
        (await upsertFirmFromClerk(db, { clerkOrgId: org.id, name: org.name })).id;
      await upsertMemberFromClerk(db, {
        firmId,
        clerkUserId: u.user_id,
        role: mapClerkRole(evt.data.role),
        name: memberName(u),
        email: u.identifier,
      });
      return;
    }
    case "organizationMembership.deleted": {
      const org = evt.data.organization;
      const u = evt.data.public_user_data;
      if (!org || !u) return;
      const firmId = await resolveFirmIdByClerkOrg(db, org.id);
      if (firmId) await deactivateMember(db, firmId, u.user_id);
      return;
    }
  }
}

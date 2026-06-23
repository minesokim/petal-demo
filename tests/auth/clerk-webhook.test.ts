import { describe, it, expect, beforeAll } from "vitest";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";
import { makeTestDb } from "../helpers/db";
import * as schema from "../../lib/db/schema";
import { handleClerkEvent } from "../../lib/auth/clerk-webhook";
import { resolveFirmIdByClerkOrg } from "../../lib/repository/firms";

let db: ReturnType<typeof drizzle>;

beforeAll(async () => {
  const pg = await makeTestDb();
  db = drizzle(pg, { schema });
});

describe("handleClerkEvent (service context)", () => {
  it("organization.created creates a firm; .updated renames it idempotently", async () => {
    await handleClerkEvent(db as never, { type: "organization.created", data: { id: "org_1", name: "Vazquez Tax" } });
    await handleClerkEvent(db as never, { type: "organization.updated", data: { id: "org_1", name: "Vazquez Tax & Co" } });
    const rows = await db.select().from(schema.firms).where(eq(schema.firms.clerkOrgId, "org_1"));
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe("Vazquez Tax & Co");
  });

  it("membership.created adds a member with mapped role; .deleted deactivates", async () => {
    await handleClerkEvent(db as never, {
      type: "organizationMembership.created",
      data: {
        role: "org:admin",
        organization: { id: "org_2", name: "Firm Two" },
        public_user_data: { user_id: "user_9", first_name: "Sam", last_name: "Lee", identifier: "sam@firm.com" },
      },
    });
    const firmId = await resolveFirmIdByClerkOrg(db as never, "org_2");
    expect(firmId).not.toBeNull();
    let m = (await db.select().from(schema.firmMembers).where(eq(schema.firmMembers.clerkUserId, "user_9")))[0];
    expect(m.role).toBe("admin");
    expect(m.name).toBe("Sam Lee");
    expect(m.active).toBe(true);

    await handleClerkEvent(db as never, {
      type: "organizationMembership.deleted",
      data: { organization: { id: "org_2", name: "Firm Two" }, public_user_data: { user_id: "user_9" } },
    });
    m = (await db.select().from(schema.firmMembers).where(eq(schema.firmMembers.clerkUserId, "user_9")))[0];
    expect(m.active).toBe(false);
  });
});

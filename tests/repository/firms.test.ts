import { describe, it, expect, beforeAll } from "vitest";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";
import { makeTestDb } from "../helpers/db";
import * as schema from "../../lib/db/schema";
import { ensureFirm } from "../../lib/repository/firms";

let db: ReturnType<typeof drizzle>;

beforeAll(async () => {
  const pg = await makeTestDb();
  db = drizzle(pg, { schema });
});

describe("ensureFirm (real-data onboarding)", () => {
  it("creates an EMPTY firm on first sign-in, idempotent, owner added", async () => {
    const a = await ensureFirm(db as never, "org_new", "user_1", "owner");
    const b = await ensureFirm(db as never, "org_new", "user_1", "owner");
    expect(a).toBe(b); // idempotent — one firm per org

    // the new firm has NO data — real onboarding, never the seed fixtures
    const hh = await db.select().from(schema.households).where(eq(schema.households.firmId, a));
    expect(hh.length).toBe(0);

    // the signed-in user is its owner
    const m = (await db.select().from(schema.firmMembers).where(eq(schema.firmMembers.clerkUserId, "user_1")))[0];
    expect(m.firmId).toBe(a);
    expect(m.role).toBe("owner");
  });
});

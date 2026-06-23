import { eq } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { withFirm } from "../auth/tenant";
import { firms } from "../db/schema";
import * as repo from "../repository/practice";
import { fixtureFirmData, type FirmData } from "./fixture-data";

// The single data seam the dashboard reads from. When a signed-in firm resolves
// (Clerk + DB configured + seeded), returns its real RLS-scoped data; otherwise
// falls back to the fixture world so the UI renders identically to the mockup.
// Wiring a surface = importing loadFirmData here instead of the fixture arrays;
// the presentational components never change.
export async function loadFirmData(): Promise<FirmData> {
  const real = await withFirm(async (db, ctx) => {
    const [firmRow] = await db.select({ name: firms.name }).from(firms).where(eq(firms.id, ctx.firmId));
    return {
      households: await repo.listHouseholds(db),
      people: await repo.listPeople(db),
      entities: await repo.listEntities(db),
      engagements: await repo.activeEngagements(db),
      expectedDocs: await repo.listExpectedDocs(db),
      tasks: await repo.listTasks(db),
      notices: await repo.listNotices(db),
      skills: await repo.listSkills(db),
      positions: await repo.listPositions(db),
      skillRuns: await repo.listSkillRuns(db),
      activity: await repo.listActivity(db),
      threads: await repo.listThreads(db),
      firm: { name: firmRow?.name ?? "My Firm" },
    };
  });
  if (!real) return fixtureFirmData();

  // The signed-in preparer's REAL name (Clerk), so the greeting isn't the demo owner.
  const u = await currentUser().catch(() => null);
  const firstName = u?.firstName ?? u?.fullName?.split(" ")[0] ?? "there";
  const fullName = u?.fullName ?? ([u?.firstName, u?.lastName].filter(Boolean).join(" ") || firstName);
  return { ...real, viewer: { firstName, fullName } } as FirmData;
}

import { withFirm } from "../auth/tenant";
import * as repo from "../repository/practice";
import { fixtureFirmData, type FirmData } from "./fixture-data";

// The single data seam the dashboard reads from. When a signed-in firm resolves
// (Clerk + DB configured + seeded), returns its real RLS-scoped data; otherwise
// falls back to the fixture world so the UI renders identically to the mockup.
// Wiring a surface = importing loadFirmData here instead of the fixture arrays;
// the presentational components never change.
export async function loadFirmData(): Promise<FirmData> {
  const real = await withFirm(async (db) => ({
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
  }));
  return (real as FirmData | null) ?? fixtureFirmData();
}

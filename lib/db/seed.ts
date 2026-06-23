import * as fx from "../fixtures/firm";
import { firmFolders as fxFolders } from "../fixtures/firm-files";
import { households, people, entities, engagements, expectedDocs, tasks, notices, skills, firmFolders, firmFiles } from "./schema";
import type { Db } from "../repository/types";

// Loads the fixture world into a firm. Runs in the service context (RLS-bypassing)
// — it stamps firm_id on every row. Insert order respects FKs. Fixture text ids
// are preserved so the seeded data is 1:1 with the mockup.
export async function seedFirm(db: Db, firmId: string): Promise<void> {
  const stamp = <T>(arr: readonly T[]) => arr.map((x) => ({ ...x, firmId })) as never;

  await db.insert(households).values(stamp(fx.households));
  await db.insert(people).values(stamp(fx.people));
  await db.insert(entities).values(stamp(fx.entities));
  await db.insert(engagements).values(stamp(fx.engagements));
  await db.insert(expectedDocs).values(stamp(fx.expectedDocs));
  await db.insert(skills).values(stamp(fx.skills));
  await db.insert(notices).values(stamp(fx.notices));
  await db.insert(tasks).values(stamp(fx.tasks));

  // ③ document library (folders, then files)
  await db.insert(firmFolders).values(
    fxFolders.map((f) => ({ id: f.id, firmId, name: f.name, description: f.description })) as never,
  );
  await db.insert(firmFiles).values(
    fxFolders.flatMap((f) => f.files.map((file) => ({ ...file, firmId, folderId: f.id }))) as never,
  );
}

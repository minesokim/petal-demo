import * as fx from "../fixtures/firm";
import { households, people, entities, engagements, expectedDocs, tasks, notices, skills } from "./schema";
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
}

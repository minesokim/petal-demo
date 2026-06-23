import { readFileSync } from "fs";
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i < 0) continue;
  const k = t.slice(0, i).trim();
  if (!process.env[k]) process.env[k] = t.slice(i + 1).trim();
}

import { withTenant } from "../lib/db/client";
import * as repo from "../lib/repository/practice";
import { makeDerive } from "../lib/fixtures/derive";

const FIRM = "000000a1-0000-4000-8000-0000000000a1";
const OTHER = "000000b2-0000-4000-8000-0000000000b2";

function loadFor(firmId: string) {
  return withTenant({ firm_id: firmId, role: "owner", user_type: "preparer" }, async (db) => ({
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
}

(async () => {
  // 1. Real firm: data hydrates and the canonical tie-out numbers all hold.
  const real = await loadFor(FIRM);
  const d = makeDerive(real as never);
  const failed = d.tieOutChecks().filter((c) => !c.ok);
  console.log("REAL FIRM (live cloud, RLS-scoped):");
  console.log("  households:", real.households.length, "| engagements:", real.engagements.length, "| tasks:", real.tasks.length);
  console.log("  needsYouCount:", d.needsYouCount(), "| feesInPipeline:", d.feesInPipeline(), "| roiWeek.actions:", d.roiWeek().actions);
  console.log("  Park balance:", d.invoiceOf("h-park").balance, "| Park docs:", d.docsOfHousehold("h-park").label);
  console.log("  tie-out failures:", failed.length === 0 ? "NONE ✓" : failed.map((f) => f.label));

  // 2. Cross-tenant isolation through the full stack: another firm sees nothing.
  const other = await loadFor(OTHER);
  console.log("OTHER FIRM (no rows):", "households:", other.households.length, other.households.length === 0 ? "✓ isolated" : "✗ LEAK");

  process.exit(failed.length === 0 && other.households.length === 0 ? 0 : 1);
})();

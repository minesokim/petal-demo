import { eq } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { withFirm } from "../auth/tenant";
import { firms } from "../db/schema";
import * as repo from "../repository/practice";
import { listFirmSmsThreads } from "../repository/sms";
import { listProposals } from "../repository/agent";
import { fixtureFirmData, type FirmData } from "./fixture-data";
import type { QueuedProposal } from "../agent/proposal-types";

// The single data seam the dashboard reads from. When a signed-in firm resolves
// (Clerk + DB configured + seeded), returns its real RLS-scoped data; otherwise
// falls back to the fixture world so the UI renders identically to the mockup.
// Wiring a surface = importing loadFirmData here instead of the fixture arrays;
// the presentational components never change.
export async function loadFirmData(): Promise<FirmData> {
  const real = await withFirm(async (db, ctx) => {
    const [firmRow] = await db.select({ name: firms.name }).from(firms).where(eq(firms.id, ctx.firmId));
    // The richer fixture-seeded inbox threads (email/portal/call + any seeded SMS demo)…
    const fixtureThreads = await repo.listThreads(db);
    // …and the REAL two-way SMS conversations from sms_messages (sendClientSmsAction +
    // the inbound webhook both land here). One Thread per client, same Inbox shape.
    const smsThreads = await listFirmSmsThreads(db, ctx);
    // Real SMS leads. A fixture SMS thread is kept ONLY when that client has no real texts
    // yet — so a real conversation is never shadowed by a seeded placeholder, but the seeded
    // demo SMS threads (clients you haven't texted) don't vanish from the inbox either.
    const realSmsHouseholds = new Set(smsThreads.map((t) => t.householdId).filter(Boolean));
    const keptFixtures = fixtureThreads.filter(
      (t) => t.channel !== "sms" || !realSmsHouseholds.has(t.householdId),
    );
    const threads = [...smsThreads, ...keptFixtures];
    // Pending agent action_proposals (the human-commit gate) — surfaced in Tasks as "needs your
    // approval". PII is already decrypted by listProposals; map to the serializable view shape.
    const proposalRows = await listProposals(db, "pending");
    const proposals: QueuedProposal[] = proposalRows.map((r) => ({
      id: r.id,
      toolName: r.toolName,
      rationale: r.rationale,
      riskLane: r.riskLane,
      riskLevel: r.riskLevel,
      riskFactors: (r.riskFactors as QueuedProposal["riskFactors"]) ?? [],
      humanMustSubmit: r.humanMustSubmit,
      reviewArtifact: (r.reviewArtifact as QueuedProposal["reviewArtifact"]) ?? null,
      confidence: r.confidence,
      createdAt: (r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt as string)).toISOString(),
    }));
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
      threads,
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

// SCHEDULER trigger (cron -> recurring runs). The platform cron calls this on a fixed cadence; it fires
// every firm's DUE schedules onto the durable runtime. Cross-firm by necessity: the service role finds all
// due schedules (bypassing RLS), then each firm's set is fired under that firm's OWN tenant scope so RLS +
// the append-only audit stay firm-scoped. A schedule fire only STAGES an agent_task — it stays behind the
// risk gate + human approval, so the scheduler never autonomously commits a side effect.

import { NextResponse } from "next/server";
import { and, eq, lte } from "drizzle-orm";
import { getServiceDb, withTenant } from "@/lib/db/client";
import { agentSchedules } from "@/lib/db/schema";
import { fireDueSchedules } from "@/lib/repository/schedules";
import type { Ctx } from "@/lib/repository/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // CRON auth: Vercel cron sends Authorization: Bearer ${CRON_SECRET} when CRON_SECRET is configured.
  // Reject anything else — this endpoint stages work across every firm and must not be publicly callable.
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  // Service role: which firms have due schedules right now (RLS bypassed for this discovery query only).
  const due = await getServiceDb()
    .select({ firmId: agentSchedules.firmId })
    .from(agentSchedules)
    .where(and(eq(agentSchedules.active, true), lte(agentSchedules.nextRunAt, now)));
  const firmIds = [...new Set(due.map((d) => d.firmId))];

  const results: { firmId: string; fired: number }[] = [];
  let totalFired = 0;
  for (const firmId of firmIds) {
    const ctx: Ctx = { firmId, actorId: "system", actorType: "system", role: "owner" };
    try {
      const fired = await withTenant({ firm_id: firmId, role: "owner", user_type: "preparer" }, (db) => fireDueSchedules(db, ctx, now));
      totalFired += fired.length;
      results.push({ firmId, fired: fired.length });
    } catch (e) {
      // HONEST DEGRADATION: one firm's failure must not abort the rest; surface it (fired:-1), keep going.
      console.error("[/api/cron/schedules] firm fire failed:", firmId, e instanceof Error ? e.name : "unknown");
      results.push({ firmId, fired: -1 });
    }
  }
  return NextResponse.json({ ok: true, firms: firmIds.length, fired: totalFired, results });
}

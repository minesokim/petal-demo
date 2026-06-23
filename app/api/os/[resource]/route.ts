// Petal OS — read-only resource API (mock).
// Demonstrates the "your firm OS is readable via API & MCP" capability.
// READS ONLY. Writes are never exposed here — writes are gated by each skill's trust tier in-product.
// Backed by mock data; contains no real client PII.
//
// AUTH: requires a signed-in session. It serves fixtures today, but the audit
// flagged that this becomes a cross-firm exfil endpoint the moment real data is
// wired in — so it must never be hittable anonymously. getFirmContext() wraps
// Clerk auth() (no userId → null → 401) and resolves the firm. When this route
// graduates to real data, scope the read to ctx.firmId via withFirm so a signed-in
// preparer can only ever read their OWN firm.

import { NextResponse } from "next/server";
import { tasks, households, entities, engagements, people, skills, skillRuns } from "@/lib/fixtures/firm";
import { getFirmContext } from "@/lib/auth/context";

const RESOURCES = {
  tasks: () => tasks,
  clients: () => households,
  households: () => households,
  entities: () => entities,
  returns: () => engagements,
  people: () => people,
  contacts: () => people,
  skills: () => skills,
  runs: () => skillRuns,
} as const;

type ResourceKey = keyof typeof RESOURCES;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ resource: string }> },
) {
  // Require a signed-in session — no anonymous reads. Returns null when Clerk
  // isn't configured / no userId, which we map to 401.
  const fc = await getFirmContext();
  if (!fc) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { resource } = await params;
  const key = resource as ResourceKey;
  const loader = RESOURCES[key];

  if (!loader) {
    return NextResponse.json(
      {
        error: "unknown_resource",
        message: `No such resource "${resource}".`,
        available: Object.keys(RESOURCES),
      },
      { status: 404 },
    );
  }

  const data = loader();
  return NextResponse.json(
    {
      resource: key,
      access: "read",
      note: "Reads are open to authorized keys. Writes are gated by each skill's trust tier in-product.",
      count: data.length,
      data,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

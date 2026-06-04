// Petal OS — read-only resource API (mock).
// Demonstrates the "your firm OS is readable via API & MCP" capability.
// READS ONLY. Writes are never exposed here — agent writes are gated by trust tiers in-product.
// Backed by mock data; contains no real client PII.

import { NextResponse } from "next/server";
import { triage } from "@/lib/os-triage";
import { households, entities, returns, people } from "@/lib/os-entities";

const RESOURCES = {
  tasks: () => triage,
  clients: () => households,
  households: () => households,
  entities: () => entities,
  returns: () => returns,
  people: () => people,
  contacts: () => people,
} as const;

type ResourceKey = keyof typeof RESOURCES;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ resource: string }> },
) {
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
      note: "Reads are open to authorized keys. Writes are gated by each agent's trust tier in-product.",
      count: data.length,
      data,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

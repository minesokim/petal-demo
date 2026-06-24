// MODULE 7 tools — System of Record reads (tier 1, INV-5). The manifest IS the
// fetch_requirements ledger (0028 schema): the firm's source of truth for "what does this
// return require, and where does each item stand?". These tools let a sub-agent READ it.
// They never write — seeding/advancing a requirement is a human/admin action (or a tier-3
// connector pull staged as a proposal), implemented in lib/sor/manifest.ts, not run inline.
//
// Each tool runs under withFirm so RLS scopes the read to the caller's firm — the agent loop
// never gets a raw DB handle. requiredScopes is ["sor:read"]: a sub-agent must hold it to even
// SEE these tools (filterTools), and runTool re-checks it at dispatch (INV-4 least-privilege).
//
// (External connector pulls — UltraTax / Drake / a bank API — are Phase 3 tier-3 writes; when
// added here they MUST declare requiredScopes and are staged as action_proposals, never run.)

import { z } from "zod";
import type { AgentTool } from "../registry";
import { withFirm } from "@/lib/auth/tenant";
import { listFetchRequirements } from "@/lib/repository/agent";
import { completionFor, manifestSummary, isManifestStatus } from "@/lib/sor/manifest";

const ClientPeriod = z.object({
  clientId: z.string().min(1),
  period: z.string().min(1), // e.g. "2025" (annual return) or "2026-05" (monthly close)
});

const SOR_TOOLS: AgentTool[] = [
  {
    name: "list_fetch_requirements",
    description:
      "List the document-collection ledger (manifest) for a client + period: each required item, " +
      "its status (pending|requested|received|verified|na), who it's assigned to, and whether " +
      "evidence is attached. Use to see exactly what a return still needs.",
    tier: 1,
    access: "read",
    requiredScopes: ["sor:read"],
    schema: ClientPeriod,
    run: async (a) => {
      const args = ClientPeriod.parse(a);
      const rows = await withFirm(async (db) => {
        const list = await listFetchRequirements(db, args.clientId, args.period);
        return list.map((r) => ({
          id: r.id,
          item: r.item,
          status: isManifestStatus(r.status) ? r.status : "pending",
          assignedTo: r.assignedTo,
          sourceType: r.sourceType,
          fetchMethod: r.fetchMethod,
          hasEvidence: Boolean(r.evidenceR2Key),
        }));
      });
      return rows ?? [];
    },
    describe: (a) => `List manifest for client ${a.clientId} (${a.period})`,
  },
  {
    name: "manifest_summary",
    description:
      "Summarize a client+period manifest: the completion rollup (required/received/verified, " +
      "percent complete, what's still missing) plus a one-line status per item. Use to answer " +
      "'how complete is this return's document collection?' without reading every row.",
    tier: 1,
    access: "read",
    requiredScopes: ["sor:read"],
    schema: ClientPeriod,
    run: async (a) => {
      const args = ClientPeriod.parse(a);
      const out = await withFirm((db) => manifestSummary(db, args.clientId, args.period));
      if (!out) return { rollup: null, lines: [] };
      return out;
    },
    describe: (a) => `Summarize manifest for client ${a.clientId} (${a.period})`,
  },
  {
    name: "manifest_completion",
    description:
      "Return just the completion rollup for a client+period: {required, received, verified, " +
      "pct, missing[]}. Cheapest manifest read — use when you only need the headline percentage " +
      "and the list of outstanding items.",
    tier: 1,
    access: "read",
    requiredScopes: ["sor:read"],
    schema: ClientPeriod,
    run: async (a) => {
      const args = ClientPeriod.parse(a);
      const out = await withFirm((db) => completionFor(db, args.clientId, args.period));
      return out ?? null;
    },
    describe: (a) => `Completion rollup for client ${a.clientId} (${a.period})`,
  },
];

export default SOR_TOOLS;

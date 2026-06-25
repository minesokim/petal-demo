// Agentic Petal — THE tool registry (Phase 0). This module owns the AgentTool type
// (the SHARED CONTRACT shape) and the registry index that concatenates the per-domain
// tool modules into one dispatch surface. Tiers + scopes are first-class so the
// runtime can filter what a sub-agent may even see (least-privilege, INV-4) and
// runTool can RE-CHECK access + scopes at dispatch time (defense in depth — refusing a
// write or an unscoped call even if a filtered toolset somehow leaked it, INV-3).
//
// Read | write is expressed as a (tier, access) pair:
//   tier 1 read  — auto-executes during the agent loop.
//   tier 2       — propose-only; writes NOTHING external (staged as proposals).
//   tier 3 write — governed write; executes ONLY after a recorded human approval.
//   tier 4       — scheduled.
// Write tools (tier >= 3) NEVER execute inside the agent loop — runSubAgent stages them
// as action_proposals; they run only from the approval gate (resolveProposalAction).

import { z } from "zod";
import type { Stakes, ConnectorReliability } from "./risk";
import CORE_TOOLS from "./tools/core";
import INTENT_TOOLS from "./tools/intent";
import SOR_TOOLS from "./tools/sor";
import INTAKE_TOOLS from "./tools/intake";
import CHECKLIST_TOOLS from "./tools/checklist";
import RECON_TOOLS from "./tools/recon";
import OLT_TOOLS from "./tools/olt";

export type AgentToolTier = 1 | 2 | 3 | 4;
export type AgentToolAccess = "read" | "write";

export type AgentTool = {
  name: string;
  description: string;
  tier: AgentToolTier;
  access: AgentToolAccess;
  requiredScopes: string[];
  schema: z.ZodTypeAny;
  run: (args: Record<string, unknown>) => Promise<unknown>;
  /** one-line human description for the approval card / audit metadata. */
  describe: (args: Record<string, unknown>) => string;
  // ── risk-gate metadata (lib/agent/risk.ts) — optional; sensible defaults apply when omitted.
  /** money / IRS / official-record exposure. Default: tier<=2 none, tier-3 internal low, else high. */
  stakes?: Stakes;
  /** easily undone? Default: tier<=2 true, tier-3 false. */
  reversible?: boolean;
  /** how the action reaches the world. Default "internal". browser = least reliable. */
  connector?: ConnectorReliability;
  /** an irreversible external commit (e-file, post journal) — Petal never performs it. */
  irreversibleSubmit?: boolean;
};

// The assembled registry — one flat array the runtime + dispatch read from. Per-domain
// modules import the AgentTool type from THIS file (the type lives here, the registry
// index lives here; the tool DEFINITIONS live in ./tools/*).
export const ALL_TOOLS: AgentTool[] = [
  ...CORE_TOOLS,
  ...INTENT_TOOLS,
  ...SOR_TOOLS,
  ...INTAKE_TOOLS,
  ...CHECKLIST_TOOLS,
  ...RECON_TOOLS,
  ...OLT_TOOLS,
];

export const TOOL_BY_NAME = new Map(ALL_TOOLS.map((t) => [t.name, t] as const));

// MEDIUM-2: the union of every registered tool's requiredScopes — the full-privilege
// scope set. v1 posture: every active firm member holds all firm scopes, so authorized
// server-action call sites pass ALL_SCOPES as callerScopes (per-role narrowing is a
// follow-up once a role->scope model exists).
export const ALL_SCOPES: string[] = [
  ...new Set(ALL_TOOLS.flatMap((t) => t.requiredScopes)),
];

// HIGH-STAKES EXTERNAL scopes: filing OLT, posting Xero — money/official-record writes. Per the
// risk-gate policy these are owner/admin only (and even then DRAFT-ONLY — the human does the final
// submit). Reviewers approve in-app work but do not hold the external-submit scopes.
const HIGH_STAKES_SCOPES: ReadonlySet<string> = new Set(["olt:write", "xero:write"]);

// SCOPES_BY_ROLE — least-privilege grant per firm role (replaces v1's everyone-holds-ALL_SCOPES).
// `Role` is imported as a type only (no runtime cycle; lib/auth/roles stays dependency-free).
export const SCOPES_BY_ROLE: Record<import("@/lib/auth/roles").Role, string[]> = {
  owner: ALL_SCOPES,
  admin: ALL_SCOPES,
  // Reviewer: full reads + every in-app write, but NOT the high-stakes external connector submits.
  reviewer: ALL_SCOPES.filter((s) => !HIGH_STAKES_SCOPES.has(s)),
  // Preparer: drafts/stages only — never reaches the approval-execution gate (canApprove blocks it),
  // so granted reads + the low-stakes in-app writes a preparer legitimately initiates.
  preparer: ALL_SCOPES.filter((s) => s.endsWith(":read") || s === "tasks:write" || s === "documents:write"),
};

/** Least-privilege scope set for the acting role; a missing role floors to preparer (least privilege). */
export function scopesForRole(role: import("@/lib/auth/roles").Role | undefined | null): string[] {
  return role ? (SCOPES_BY_ROLE[role] ?? SCOPES_BY_ROLE.preparer) : SCOPES_BY_ROLE.preparer;
}

// Write tools whose underlying connector is LIVE in v1 (the in-app core writes, which
// wrap existing audited server actions). The approval gate executes one of these on
// approve; a write tool NOT in this set is an external connector that is Phase 3 — the
// gate records execution_result {deferred:true} instead of running anything. Reads are
// never gated, so this is a write-only allowlist.
export const ENABLED_WRITE_TOOLS: ReadonlySet<string> = new Set(CORE_TOOLS.map((t) => t.name));

export function isToolEnabled(name: string): boolean {
  const tool = TOOL_BY_NAME.get(name);
  if (!tool) return false;
  if (tool.access === "read") return true;
  return ENABLED_WRITE_TOOLS.has(name);
}

// Filter the registry to the tools a given context may use. The runtime passes the
// result as the sub-agent's visible toolset, so a read-only sub-agent never even sees
// a write tool. (Visibility is the first line; runTool's re-check is the second.)
export type ToolFilter = {
  /** the highest tier the caller may invoke inline (reads are tier<=2). */
  maxTier?: AgentToolTier;
  /** restrict to a set of access kinds (e.g. ["read"] for a read-only sub-agent). */
  access?: AgentToolAccess[];
  /** scopes the caller holds; a tool whose requiredScopes aren't all held is dropped. */
  callerScopes?: string[];
  /** explicit allowlist of tool names (intersected with everything else). */
  names?: string[];
};

export function filterTools(filter: ToolFilter = {}): AgentTool[] {
  const scopes = new Set(filter.callerScopes ?? []);
  return ALL_TOOLS.filter((t) => {
    if (filter.maxTier !== undefined && t.tier > filter.maxTier) return false;
    if (filter.access && !filter.access.includes(t.access)) return false;
    if (filter.names && !filter.names.includes(t.name)) return false;
    if (filter.callerScopes && !t.requiredScopes.every((s) => scopes.has(s))) return false;
    return true;
  });
}

export class ToolAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ToolAccessError";
  }
}

// Validate + execute a single tool by name. RE-CHECKS access + scopes at dispatch
// (not just relying on the caller having filtered the toolset): a write tool (tier>=3)
// is REFUSED here unless allowWrite is set (the approval gate sets it after a recorded
// human approval); a tool whose requiredScopes the caller lacks is REFUSED here too.
// Throws ToolAccessError on a policy refusal, Error on an unknown tool / invalid args.
export async function runTool(
  name: string,
  rawArgs: unknown,
  callerScopes?: string[],
  opts: { allowWrite?: boolean } = {},
): Promise<unknown> {
  const tool = TOOL_BY_NAME.get(name);
  if (!tool) throw new Error(`unknown tool: ${name}`);

  // Defense in depth: a write tool only ever executes from the approval gate, which
  // opts in explicitly. Inside the agent loop allowWrite is false, so a write is
  // refused at dispatch even if it somehow reached here.
  if (tool.access === "write" && !opts.allowWrite) {
    throw new ToolAccessError(
      `tool "${name}" is a tier-${tool.tier} write and may not be executed inline; ` +
        `it must be staged as a proposal and approved.`,
    );
  }

  // Scope re-check at dispatch — least privilege enforced here, not just by omission.
  // MEDIUM-2: FAIL-CLOSED. The check ALWAYS evaluates: an undefined callerScopes is
  // treated as the EMPTY granted set, so any tool with a non-empty requiredScopes is
  // refused unless the granted set covers them. (Previously the whole check was skipped
  // when callerScopes was undefined — dead code that let unscoped calls through.)
  const held = new Set(callerScopes ?? []);
  const missing = tool.requiredScopes.filter((s) => !held.has(s));
  if (missing.length) {
    throw new ToolAccessError(
      `caller lacks required scope(s) for "${name}": ${missing.join(", ")}`,
    );
  }

  const args = tool.schema.parse(rawArgs ?? {});
  return tool.run(args as Record<string, unknown>);
}

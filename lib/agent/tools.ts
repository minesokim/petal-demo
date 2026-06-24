// BACK-COMPAT SHIM. The tool registry moved to lib/agent/registry.ts (which owns the
// AgentTool type from the shared contract) + the per-domain modules under
// lib/agent/tools/*. This file re-exports the assembled registry under the old names so
// any remaining importer keeps working. New code should import from "./registry".
//
// The old AgentTool carried a `kind: "read" | "write"`; the contract replaced it with
// (tier, access). `kind` is derived from `access` here for the legacy runner.

import { ALL_TOOLS, TOOL_BY_NAME as REGISTRY_BY_NAME, runTool as registryRunTool } from "./registry";
import type { AgentTool as RegistryTool } from "./registry";

export type { AgentTool } from "./registry";
export type ToolKind = "read" | "write";

export const TOOLS = ALL_TOOLS;
export const TOOL_BY_NAME = REGISTRY_BY_NAME;

// Legacy helper: read | write derived from access (the runner's existing branch).
export function toolKind(t: RegistryTool): ToolKind {
  return t.access;
}

// Legacy runTool: validate + execute by name. A write is allowed here because the only
// legacy caller is the confirm gate, which has already verified the tool is a write and
// the human confirmed it. New code uses registry.runTool with an explicit
// allowWrite + scope policy.
export async function runTool(name: string, rawArgs: unknown): Promise<unknown> {
  return registryRunTool(name, rawArgs, undefined, { allowWrite: true });
}

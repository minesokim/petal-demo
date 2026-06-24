"use server";

// The confirm-gate. A staged write from the agent only runs when the preparer confirms it
// here. We re-validate that the named tool is a WRITE tool and re-parse its args (the agent
// can't smuggle an arbitrary action), then execute via the same registry. The underlying
// server action enforces auth + RLS + audit, so this is a thin, safe execution shim.

import { getFirmContext } from "@/lib/auth/context";
import { TOOL_BY_NAME, runTool } from "@/lib/agent/registry";

export async function confirmAgentAction(
  tool: string,
  args: Record<string, unknown>,
): Promise<{ ok: boolean; error?: string }> {
  const ctx = await getFirmContext().catch(() => null);
  if (!ctx) return { ok: false, error: "unauthorized" };

  const t = TOOL_BY_NAME.get(tool);
  if (!t || t.access !== "write") return { ok: false, error: "not a confirmable action" };

  try {
    // re-validates args + executes the underlying audited action. allowWrite is set
    // because this IS the confirm gate — the preparer has confirmed this staged write.
    await runTool(tool, args, undefined, { allowWrite: true });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.name : "failed" };
  }
}

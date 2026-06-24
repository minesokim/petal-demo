"use server";

// The confirm-gate. A staged write from the agent only runs when the preparer confirms it
// here. We re-validate that the named tool is a WRITE tool and re-parse its args (the agent
// can't smuggle an arbitrary action), then execute via the same registry. The underlying
// server action enforces auth + RLS + audit, so this is a thin, safe execution shim.

import { withFirm } from "@/lib/auth/tenant";
import { writeAudit } from "@/lib/repository/audit";
import { TOOL_BY_NAME, runTool, ALL_SCOPES } from "@/lib/agent/registry";

export async function confirmAgentAction(
  tool: string,
  args: Record<string, unknown>,
): Promise<{ ok: boolean; error?: string }> {
  const result = await withFirm(async (db, ctx) => {
    const t = TOOL_BY_NAME.get(tool);
    if (!t || t.access !== "write") return { ok: false, error: "not a confirmable action" };

    // LOW-4: leave an approval trail for the in-memory confirm path, mirroring the DB
    // proposal path. metadata carries ONLY the tool name — never the args body (which can
    // carry client free-text / PII).
    await writeAudit(db, ctx, {
      action: "agent.confirm",
      resourceType: "agent_tool",
      metadata: { tool },
    });

    try {
      // re-validates args + executes the underlying audited action. allowWrite is set
      // because this IS the confirm gate — the preparer has confirmed this staged write.
      // MEDIUM-2: pass ALL_SCOPES — v1: every active firm member holds all firm scopes.
      const r = await runTool(tool, args, ALL_SCOPES, { allowWrite: true });
      // CRITICAL: action wrappers (sendClientSmsAction/sendClientEmailAction) RETURN
      // { ok:false, error } on failure rather than throwing — so we must inspect the result,
      // not assume success. Surfacing the real error (e.g. the Twilio/Gmail reason) to the
      // preparer who triggered this is intended; it is their own authenticated action.
      if (r && typeof r === "object" && "ok" in r && (r as { ok: unknown }).ok === false) {
        return { ok: false, error: (r as { error?: string }).error || "action failed" };
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message.slice(0, 200) : "failed" };
    }
  });
  return result ?? { ok: false, error: "unauthorized" };
}

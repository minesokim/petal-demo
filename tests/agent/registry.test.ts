import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  runTool,
  filterTools,
  ToolAccessError,
  ALL_TOOLS,
  TOOL_BY_NAME,
  type AgentTool,
} from "../../lib/agent/registry";

// (a) runTool refuses a write tool inline / a tool whose requiredScopes the caller lacks
//     — dispatch-time enforcement (defense in depth), not just omission from the toolset.
// (b) a filtered read-only toolset never exposes a write tool.

describe("registry dispatch enforcement", () => {
  it("(a) refuses to execute a WRITE tool inline (no allowWrite)", async () => {
    // send_sms is a tier-3 write; the agent loop must never run it inline.
    const writeTool = ALL_TOOLS.find((t) => t.access === "write");
    expect(writeTool).toBeTruthy();
    await expect(
      runTool(writeTool!.name, {}, writeTool!.requiredScopes),
    ).rejects.toBeInstanceOf(ToolAccessError);
  });

  it("(a) refuses a tool whose requiredScopes the caller lacks (dispatch-time)", async () => {
    // A read tool that declares a scope — caller holds none, so dispatch refuses it even
    // though the tool exists and the call isn't a write.
    const scopedRead: AgentTool = {
      name: "__test_scoped_read",
      description: "scoped read",
      tier: 1,
      access: "read",
      requiredScopes: ["secret:read"],
      schema: z.object({}),
      run: async () => "ran",
      describe: () => "scoped read",
    };
    // Temporarily register it.
    TOOL_BY_NAME.set(scopedRead.name, scopedRead);
    try {
      await expect(runTool(scopedRead.name, {}, [] /* no scopes */)).rejects.toBeInstanceOf(ToolAccessError);
      // …and it runs when the caller DOES hold the scope.
      await expect(runTool(scopedRead.name, {}, ["secret:read"])).resolves.toBe("ran");
    } finally {
      TOOL_BY_NAME.delete(scopedRead.name);
    }
  });

  it("(a) a write tool CAN execute only with allowWrite (the approval gate's opt-in)", async () => {
    const probe: AgentTool = {
      name: "__test_write",
      description: "write probe",
      tier: 3,
      access: "write",
      requiredScopes: [],
      schema: z.object({}),
      run: async () => "wrote",
      describe: () => "write probe",
    };
    TOOL_BY_NAME.set(probe.name, probe);
    try {
      await expect(runTool(probe.name, {})).rejects.toBeInstanceOf(ToolAccessError); // inline refused
      await expect(runTool(probe.name, {}, undefined, { allowWrite: true })).resolves.toBe("wrote");
    } finally {
      TOOL_BY_NAME.delete(probe.name);
    }
  });

  it("(b) a read-only filtered toolset never exposes a write tool", () => {
    const readOnly = filterTools({ access: ["read"] });
    expect(readOnly.length).toBeGreaterThan(0);
    expect(readOnly.every((t) => t.access === "read")).toBe(true);
    expect(readOnly.some((t) => t.access === "write")).toBe(false);
    // And a maxTier=1 filter drops tier-2/3 tools entirely.
    const tier1 = filterTools({ maxTier: 1 });
    expect(tier1.every((t) => t.tier === 1)).toBe(true);
  });

  it("(b) filterTools drops a tool whose requiredScopes aren't all held", () => {
    const withSms = filterTools({ callerScopes: ["sms:send", "clients:write", "tasks:write", "documents:write", "notices:write", "sor:read", "intake:read", "checklist:read", "research:read", "xero:read", "xero:write"] });
    const withoutSms = filterTools({ callerScopes: [] });
    expect(withSms.some((t) => t.name === "send_sms")).toBe(true);
    expect(withoutSms.some((t) => t.name === "send_sms")).toBe(false);
  });
});

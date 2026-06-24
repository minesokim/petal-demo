import { describe, it, expect } from "vitest";
import {
  runTool,
  ToolAccessError,
  ALL_SCOPES,
  ALL_TOOLS,
  ENABLED_WRITE_TOOLS,
  TOOL_BY_NAME,
  isToolEnabled,
} from "../../lib/agent/registry";
import {
  oltSession,
  loginOlt,
  navigateToReturn,
  stageReturnFromIntake,
  verifyOltState,
  readReturnStatus,
  isStubConnection,
  type OltStagePlan,
} from "../../lib/integrations/olt";
import { assertCleared } from "../../lib/ai/guard";

// Slice ⑥ — OLT browser-automation tier, NON-LIVE / stub-parity (exactly the Xero
// connector's state). These tests prove, with NO network and NO browser:
//   • the read tool is tier-1 and returns synthetic status;
//   • the two write tools are tier-3 + access:"write", NOT in ENABLED_WRITE_TOOLS, so
//     runTool refuses them inline and even with allowWrite the stub throws
//     ("external connector not enabled in v1") — never an external write in v1;
//   • a live (non-stub) connection throws notLive ("OLT automation not enabled in v1");
//   • the integration write surface stages (RETURNS) the would-be entries, never executes;
//   • the §7216 gate + scope checks hold.

const STUB = "stub:olt-1";
const LIVE = "olt-prod-9"; // a non-stub connection id

const READ_TOOL = "olt_list_return_status";
const STAGE_TOOL = "olt_stage_return";
const SUBMIT_TOOL = "olt_submit_return";

describe("slice ⑥ OLT tools — registry shape (tiers, access, scopes, allowlist)", () => {
  it("the read tool is tier-1 read with scope olt:read", () => {
    const t = TOOL_BY_NAME.get(READ_TOOL);
    expect(t).toBeTruthy();
    expect(t!.tier).toBe(1);
    expect(t!.access).toBe("read");
    expect(t!.requiredScopes).toEqual(["olt:read"]);
  });

  it("both write tools are tier-3 access:write with scope olt:write", () => {
    for (const name of [STAGE_TOOL, SUBMIT_TOOL]) {
      const t = TOOL_BY_NAME.get(name);
      expect(t, name).toBeTruthy();
      expect(t!.tier, name).toBe(3);
      expect(t!.access, name).toBe("write");
      expect(t!.requiredScopes, name).toEqual(["olt:write"]);
    }
  });

  it("the write tools are EXCLUDED from ENABLED_WRITE_TOOLS (connector non-live) — isToolEnabled=false", () => {
    expect(ENABLED_WRITE_TOOLS.has(STAGE_TOOL)).toBe(false);
    expect(ENABLED_WRITE_TOOLS.has(SUBMIT_TOOL)).toBe(false);
    // isToolEnabled gates the approval gate's execute-vs-defer branch: a write NOT in the
    // allowlist is recorded deferred, never executed (INV-3).
    expect(isToolEnabled(STAGE_TOOL)).toBe(false);
    expect(isToolEnabled(SUBMIT_TOOL)).toBe(false);
    // …while the read tool is always enabled (reads aren't gated).
    expect(isToolEnabled(READ_TOOL)).toBe(true);
  });

  it("olt:read and olt:write are part of ALL_SCOPES (registered via the tools)", () => {
    expect(ALL_SCOPES).toContain("olt:read");
    expect(ALL_SCOPES).toContain("olt:write");
  });

  it("the OLT tools are registered exactly once each", () => {
    for (const name of [READ_TOOL, STAGE_TOOL, SUBMIT_TOOL]) {
      expect(ALL_TOOLS.filter((t) => t.name === name).length, name).toBe(1);
    }
  });
});

describe("slice ⑥ OLT tools — dispatch enforcement (INV-3, INV-4 scope check)", () => {
  it("runTool REFUSES a write tool inline (no allowWrite) — staged as a proposal, never run", async () => {
    await expect(
      runTool(STAGE_TOOL, { connectionId: STUB, clientId: "h-a", taxYear: 2025, entries: [] }, ["olt:write"]),
    ).rejects.toBeInstanceOf(ToolAccessError);
    await expect(
      runTool(SUBMIT_TOOL, { connectionId: STUB, clientId: "h-a", taxYear: 2025 }, ["olt:write"]),
    ).rejects.toBeInstanceOf(ToolAccessError);
  });

  it("even WITH allowWrite (the gate's opt-in), the stub write THROWS — never an external write in v1", async () => {
    // This is the post-approval path the gate would only ever reach if the tool were in
    // ENABLED_WRITE_TOOLS (it is NOT). Proven here for defense in depth: the run() itself
    // refuses, so a live OLT write is impossible in v1 even if the allowlist were wrong.
    await expect(
      runTool(
        STAGE_TOOL,
        { connectionId: STUB, clientId: "h-a", taxYear: 2025, entries: [] },
        ["olt:write"],
        { allowWrite: true },
      ),
    ).rejects.toThrow("external connector not enabled in v1");
    await expect(
      runTool(SUBMIT_TOOL, { connectionId: STUB, clientId: "h-a", taxYear: 2025 }, ["olt:write"], {
        allowWrite: true,
      }),
    ).rejects.toThrow("external connector not enabled in v1");
  });

  it("the read tool RUNS inline and returns synthetic status when scoped", async () => {
    const out = (await runTool(
      READ_TOOL,
      { connectionId: STUB, clientId: "h-a", taxYear: 2025 },
      ["olt:read"],
    )) as { clientId: string; taxYear: number; state: string; efileErrors: number };
    expect(out.clientId).toBe("h-a");
    expect(out.taxYear).toBe(2025);
    expect(typeof out.state).toBe("string");
    expect(out.efileErrors).toBe(0);
  });

  it("the read tool is REFUSED without the olt:read scope (fail-closed) and when granted nothing", async () => {
    await expect(
      runTool(READ_TOOL, { connectionId: STUB, clientId: "h-a", taxYear: 2025 }, []),
    ).rejects.toBeInstanceOf(ToolAccessError);
    // undefined callerScopes is treated as the empty granted set (MEDIUM-2 fail-closed).
    await expect(
      runTool(READ_TOOL, { connectionId: STUB, clientId: "h-a", taxYear: 2025 }),
    ).rejects.toBeInstanceOf(ToolAccessError);
  });

  it("the write tools are refused inline regardless of scope (write > read gate)", async () => {
    // Even holding olt:write, an inline write is refused (it must be staged + approved).
    await expect(
      runTool(STAGE_TOOL, { connectionId: STUB, clientId: "h-a", taxYear: 2025, entries: [] }, ALL_SCOPES),
    ).rejects.toBeInstanceOf(ToolAccessError);
  });
});

describe("slice ⑥ OLT integration client — stub vs live, planner-not-executor", () => {
  it("isStubConnection: absent / stub: → true; a real id → false", () => {
    expect(isStubConnection(undefined)).toBe(true);
    expect(isStubConnection(null)).toBe(true);
    expect(isStubConnection(STUB)).toBe(true);
    expect(isStubConnection(LIVE)).toBe(false);
  });

  it("a stub session logs in / navigates without touching a browser or a credential", async () => {
    const session = await oltSession(STUB, { secretRef: "vault://olt/login-1" });
    expect(session.isStub).toBe(true);
    // INV-4: the secretRef is a pointer only; it is never resolved in the stub.
    expect(session.secretRef).toBe("vault://olt/login-1");
    await expect(loginOlt(session)).resolves.toEqual({ loggedIn: true });
    await expect(navigateToReturn(session, { clientId: "h-a", taxYear: 2025 })).resolves.toMatchObject({
      navigated: true,
    });
  });

  it("stageReturnFromIntake is a PURE planner — it RETURNS the would-be entries, never executes", async () => {
    const session = await oltSession(STUB);
    const plan: OltStagePlan = {
      ref: { clientId: "h-a", taxYear: 2025 },
      entries: [
        { screen: "1040 / Income / W-2", field: "wages_box1", value: "84000.00", source: "extracted:W-2 box 1" },
        { screen: "1040 / Income / W-2", field: "fed_wh_box2", value: "9200.00", source: "extracted:W-2 box 2" },
      ],
    };
    const staged = stageReturnFromIntake(session, plan);
    // The planner echoes the entries verbatim — these are the action_proposal payload, not
    // a side effect. Nothing was typed into OLT.
    expect(staged).toEqual(plan.entries);
  });

  it("verifyOltState (verification-after-action seam) is ok for a stub session", async () => {
    const session = await oltSession(STUB);
    const res = await verifyOltState(session, {
      ref: { clientId: "h-a", taxYear: 2025 },
      expectState: "ready_to_efile",
    });
    expect(res.ok).toBe(true);
    expect(res.mismatches).toEqual([]);
  });

  it("a LIVE (non-stub) connection throws notLive on EVERY entry point — fails loudly", async () => {
    // Session open is the first trap.
    await expect(oltSession(LIVE)).rejects.toThrow("OLT automation not enabled in v1");
    // The read surface too (the read tool would route here for a live connection).
    await expect(readReturnStatus(LIVE, { clientId: "h-a", taxYear: 2025 })).rejects.toThrow(
      "OLT automation not enabled in v1",
    );
    // And the post-login surface, exercised against a hand-built "live" session object.
    const liveSession = { connectionId: LIVE, isStub: false, secretRef: "vault://olt/login-x" };
    await expect(loginOlt(liveSession)).rejects.toThrow("OLT automation not enabled in v1");
    await expect(navigateToReturn(liveSession, { clientId: "h-a", taxYear: 2025 })).rejects.toThrow(
      "OLT automation not enabled in v1",
    );
    expect(() =>
      stageReturnFromIntake(liveSession, { ref: { clientId: "h-a", taxYear: 2025 }, entries: [] }),
    ).toThrow("OLT automation not enabled in v1");
    await expect(verifyOltState(liveSession, { ref: { clientId: "h-a", taxYear: 2025 } })).rejects.toThrow(
      "OLT automation not enabled in v1",
    );
  });
});

describe("slice ⑥ OLT — §7216 gate holds for the synthetic posture", () => {
  it("assertCleared('synthetic') passes (OLT staging runs on synthetic data in v1)", () => {
    expect(() => assertCleared("synthetic")).not.toThrow();
  });

  it("assertCleared('real') THROWS unless counsel has cleared real-data AI", () => {
    const prev = process.env.PETAL_7216_CLEARED;
    delete process.env.PETAL_7216_CLEARED;
    try {
      expect(() => assertCleared("real")).toThrow(/§7216/);
    } finally {
      if (prev !== undefined) process.env.PETAL_7216_CLEARED = prev;
    }
  });
});

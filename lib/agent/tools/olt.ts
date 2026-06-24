// OLT browser-automation tools (slice ⑥ — the brief's Module 4b). OLT (OnLine Taxes)
// is a *web* tax platform: the agentic layer drives it through a real browser to stage a
// return. This module is the tool INTERFACE over lib/integrations/olt.ts — same stubbed-
// connector shape as recon.ts/xero.ts.
//
// One tier-1 READ tool (olt:read) surfaces a return's status. Two tier-3 WRITE tools
// (olt:write) exist ONLY to be staged as action_proposals — their run() throws
// "external connector not enabled in v1", because v1 terminates at proposals and makes NO
// external write into OLT. They are EXCLUDED from ENABLED_WRITE_TOOLS, so even after a
// recorded human approval the gate records a deferred result instead of driving a browser.
// When a real Stagehand+Playwright impl lands, those handlers swap in behind this same
// interface and the callers (the staging task, the approval gate) do not change.
//
// INV-3: the write tools are tier 3 + access "write" → runTool refuses them inline; they
//        run only from the approval gate, and only once the connector is live (it is not).
// INV-4: a connection is referenced by id only; the OLT login behind it never enters model
//        context. The tools take a connectionId, never a credential.

import { z } from "zod";
import type { AgentTool } from "../registry";
import { readReturnStatus, type OltReturnStatus } from "@/lib/integrations/olt";

const returnRefArg = z.object({
  connectionId: z.string().describe("the agent_connections id for the OLT login (a stub: id in v1)"),
  clientId: z.string().describe("the household/client id whose return to act on"),
  taxYear: z.number().int().describe("the tax year of the return, e.g. 2025"),
});

// The would-be field entries the agent intends to type into OLT (staged, never executed).
const fieldEntryArg = z.object({
  screen: z.string(),
  field: z.string(),
  value: z.string(), // decimal STRING for money; never a float
  source: z.string(),
});

const OLT_TOOLS: AgentTool[] = [
  {
    name: "olt_list_return_status",
    description:
      "Read the status of a client's return inside OLT (OnLine Taxes): pipeline state, " +
      "outstanding e-file validation errors, and last-updated date. Read-only; used to " +
      "decide whether a return is ready to stage or e-file. Returns synthetic status in v1.",
    tier: 1,
    access: "read",
    requiredScopes: ["olt:read"],
    schema: returnRefArg,
    run: async (a): Promise<OltReturnStatus> =>
      readReturnStatus(a.connectionId as string, {
        clientId: a.clientId as string,
        taxYear: a.taxYear as number,
      }),
    describe: (a) => `Read OLT return status for client ${a.clientId} (TY ${a.taxYear})`,
  },
  {
    name: "olt_stage_return",
    description:
      "Stage a client's return inside OLT by transcribing intake-derived field entries " +
      "(a governed browser write). NOT enabled in v1 — staged as a proposal and executed " +
      "only after a recorded human approval, and even then deferred until the OLT browser " +
      "connector is live. Driving OLT is never done inside the agent loop.",
    tier: 3,
    access: "write",
    requiredScopes: ["olt:write"],
    // Browser-driven write touching the return — high stakes, least-reliable connector -> review lane.
    stakes: "high",
    connector: "browser",
    reversible: false,
    schema: z.object({
      connectionId: z.string(),
      clientId: z.string(),
      taxYear: z.number().int(),
      entries: z.array(fieldEntryArg),
    }),
    run: async () => {
      throw new Error("external connector not enabled in v1");
    },
    describe: (a) =>
      `Stage OLT return for client ${a.clientId} (TY ${a.taxYear}): ` +
      `${Array.isArray(a.entries) ? a.entries.length : 0} field entries`,
  },
  {
    name: "olt_submit_return",
    description:
      "Submit (e-file) a staged return through OLT (a governed browser write). NOT enabled " +
      "in v1 — staged as a proposal and executed only after a recorded human approval, and " +
      "even then deferred until the OLT browser connector is live. Never runs in the loop.",
    tier: 3,
    access: "write",
    requiredScopes: ["olt:write"],
    // E-filing is the irreversible external commit — Petal NEVER performs it; a human submits.
    stakes: "high",
    connector: "browser",
    reversible: false,
    irreversibleSubmit: true,
    schema: z.object({
      connectionId: z.string(),
      clientId: z.string(),
      taxYear: z.number().int(),
    }),
    run: async () => {
      throw new Error("external connector not enabled in v1");
    },
    describe: (a) => `Submit (e-file) OLT return for client ${a.clientId} (TY ${a.taxYear})`,
  },
];

export default OLT_TOOLS;

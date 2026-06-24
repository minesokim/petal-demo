// Reconciliation connector tools (CAPABILITY 3) — the Xero MCP-client tool INTERFACE.
//
// Two tier-1 READ tools (xero:read) surface the bank feed + the ledger; the deterministic
// matcher (lib/recon/match) ties them out in CODE, never the model (INV-1). Two tier-3
// WRITE tools exist ONLY to be staged as action_proposals — their run() throws
// "external connector not enabled in v1", because v1 terminates at proposals and makes NO
// external write. When a real Xero MCP lands, those handlers swap in behind the same
// interface and the callers (the recon task, the approval gate) do not change.
//
// INV-4: a connection is referenced by id only; the secret behind it never enters model
// context. INV-3: the write tools are tier 3 + access "write", so the registry's runTool
// refuses to execute them inline — they are proposed and run only after a human approval.

import { z } from "zod";
import type { AgentTool } from "../registry";
import {
  readBankTransactions,
  readLedgerItems,
  type XeroBankTransaction,
  type XeroLedgerItem,
} from "@/lib/integrations/xero";

const connectionArg = z.object({
  connectionId: z.string().describe("the agent_connections id for the Xero org (a stub: id in v1)"),
});

const RECON_TOOLS: AgentTool[] = [
  {
    name: "xero_list_bank_transactions",
    description:
      "Read the bank-feed transactions for a connected Xero org. Returns dated, signed, decimal-string amounts with payee/memo/reference. Read-only; used to gather one side of a reconciliation.",
    tier: 1,
    access: "read",
    requiredScopes: ["xero:read"],
    schema: connectionArg,
    run: async (a): Promise<XeroBankTransaction[]> => readBankTransactions(a.connectionId as string),
    describe: (a) => `List Xero bank transactions for connection ${a.connectionId}`,
  },
  {
    name: "xero_list_ledger_items",
    description:
      "Read the general-ledger items (invoices/bills/journal lines) for a connected Xero org. Returns dated, signed, decimal-string amounts with contact/description/reference/account. Read-only; the other side of a reconciliation.",
    tier: 1,
    access: "read",
    requiredScopes: ["xero:read"],
    schema: connectionArg,
    run: async (a): Promise<XeroLedgerItem[]> => readLedgerItems(a.connectionId as string),
    describe: (a) => `List Xero ledger items for connection ${a.connectionId}`,
  },
  {
    name: "create_xero_bank_transaction",
    description:
      "Reconcile a bank-feed line against a ledger item in Xero (a governed external write). NOT enabled in v1 — staged as a proposal and executed only after a recorded human approval.",
    tier: 3,
    access: "write",
    requiredScopes: ["xero:write"],
    // Posts money to the books via an external API -> high stakes, review lane.
    stakes: "high",
    connector: "api",
    reversible: false,
    schema: z.object({
      connectionId: z.string(),
      bankTransactionId: z.string(),
      ledgerItemId: z.string(),
      amount: z.string(),
      date: z.string(),
      reference: z.string().nullable().optional(),
    }),
    run: async () => {
      throw new Error("external connector not enabled in v1");
    },
    describe: (a) =>
      `Reconcile Xero bank txn ${a.bankTransactionId} ↔ ledger ${a.ledgerItemId} (${a.amount})`,
  },
  {
    name: "create_xero_manual_journal",
    description:
      "Post a manual journal in Xero (a governed external write), e.g. a month-end accrual. NOT enabled in v1 — staged as a proposal and executed only after a recorded human approval.",
    tier: 3,
    access: "write",
    requiredScopes: ["xero:write"],
    // Posts money to the books via an external API -> high stakes, review lane.
    stakes: "high",
    connector: "api",
    reversible: false,
    schema: z.object({
      connectionId: z.string(),
      date: z.string(),
      narration: z.string(),
      lines: z.array(z.object({ account: z.string(), amount: z.string(), description: z.string() })),
    }),
    run: async () => {
      throw new Error("external connector not enabled in v1");
    },
    describe: (a) => `Post Xero manual journal "${a.narration}" dated ${a.date}`,
  },
];

export default RECON_TOOLS;

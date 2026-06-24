// Stubbed Xero connector — behind the MCP-client tool INTERFACE so a real Xero MCP
// drops in later WITHOUT changing any caller. v1 ships read-only synthetic data and a
// pair of NON-executing propose* functions that only RETURN the would-be args (they
// never touch Xero). The agent stages those args as action_proposals; nothing external
// is ever written from here (INV-3 tier-3 = governed write only after human approval;
// the actual external write is out of scope for v1 — these throw if ever called live).
//
// INV-4: a connection is referenced by id only. The secret behind it lives OUTSIDE the
// model context (agent_connections.secret_ref → secret store); this module never sees a
// token. A connectionId beginning with "stub:" resolves to the bundled fixture so the
// recon pipeline is fully exercisable in tests + preview without a real Xero org.

import { RECON_FIXTURE, type FixtureBankTxn, type FixtureLedgerItem } from "@/lib/recon/fixture";

// ── The shapes the rest of the app speaks (provider-neutral) ──────────────────

// A bank-feed line as Xero exposes it: a dated, signed amount with a payee/memo and
// an optional reference. amount is a decimal STRING (money is never a float here).
export type XeroBankTransaction = {
  id: string;
  date: string; // ISO yyyy-mm-dd
  amount: string; // signed decimal string; negative = money out
  payee: string;
  memo: string;
  reference: string | null;
};

// A general-ledger line (an invoice/bill/journal item) we reconcile the feed against.
export type XeroLedgerItem = {
  id: string;
  date: string; // ISO yyyy-mm-dd
  amount: string; // signed decimal string
  contact: string;
  description: string;
  reference: string | null;
  account: string; // GL account code/name
};

// The would-be argument payloads for the two WRITE operations. These are what the
// agent stages into action_proposals.args — they are NEVER executed in v1.
export type ProposeBankTransactionArgs = {
  connectionId: string;
  bankTransactionId: string; // the feed line being reconciled
  ledgerItemId: string; // the GL line it matches
  amount: string;
  date: string;
  reference: string | null;
};

export type ProposeManualJournalArgs = {
  connectionId: string;
  date: string; // the month-end date
  narration: string;
  lines: Array<{ account: string; amount: string; description: string }>;
};

// ── Connection resolution (stub vs real) ──────────────────────────────────────

// A connectionId is a stub iff it is missing or prefixed "stub:". The real path is a
// deliberate, explicit not-implemented in v1 so a misconfigured live connection fails
// LOUDLY instead of silently hitting a non-existent Xero client.
export function isStubConnection(connectionId: string | null | undefined): boolean {
  return !connectionId || connectionId.startsWith("stub:");
}

function notLive(): never {
  throw new Error("external connector not enabled in v1");
}

// ── READ surface (tier-1, scope xero:read) ────────────────────────────────────

export async function readBankTransactions(connectionId: string): Promise<XeroBankTransaction[]> {
  if (isStubConnection(connectionId)) {
    return RECON_FIXTURE.bankTransactions.map(toBankTxn);
  }
  // Real Xero MCP read would go here (read-only, scoped credential resolved from
  // secret_ref OUTSIDE model context). Not wired in v1.
  return notLive();
}

export async function readLedgerItems(connectionId: string): Promise<XeroLedgerItem[]> {
  if (isStubConnection(connectionId)) {
    return RECON_FIXTURE.ledgerItems.map(toLedgerItem);
  }
  return notLive();
}

// ── WRITE surface — NON-executing. Returns the would-be args ONLY ─────────────
// These exist so a caller can build an exact, validatable proposal payload without
// any side effect. They DO NOT call Xero. The live execution path (post-approval) is
// intentionally not implemented in v1.

export function proposeBankTransaction(args: ProposeBankTransactionArgs): ProposeBankTransactionArgs {
  return args; // pure: the proposal payload, nothing more
}

export function proposeManualJournal(args: ProposeManualJournalArgs): ProposeManualJournalArgs {
  return args;
}

// ── fixture → public shape adapters ───────────────────────────────────────────

function toBankTxn(b: FixtureBankTxn): XeroBankTransaction {
  return { id: b.id, date: b.date, amount: b.amount, payee: b.payee, memo: b.memo, reference: b.reference };
}

function toLedgerItem(l: FixtureLedgerItem): XeroLedgerItem {
  return {
    id: l.id,
    date: l.date,
    amount: l.amount,
    contact: l.contact,
    description: l.description,
    reference: l.reference,
    account: l.account,
  };
}

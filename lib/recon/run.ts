// THE recon task (CAPABILITY 3) — tier 2, terminates at proposals, writes NOTHING
// external. It:
//   1. READS the two sides via the stubbed Xero read tools (through the registry's runTool
//      so the xero:read scope is re-checked at dispatch — INV-4).
//   2. Runs the DETERMINISTIC matcher (lib/recon/match) — the match + the math are CODE,
//      never the model (INV-1).
//   3. For each CLEAN match and each month-end manual journal, stages an action_proposals
//      row whose tool_name is the tier-3 Xero WRITE tool, args are the EXACT would-be args,
//      with rationale + evidence (the matched source records + the tie-out trace) + a
//      confidence. The proposals are the ONLY outputs; nothing external is written (INV-3).
//   4. Flags exceptions (unmatched / ambiguous) with a reason for a human — never
//      auto-resolved.
//
// The model is used ONLY (optionally) to draft a human-readable rationale or to categorize
// an ambiguous exception as a SUGGESTION inside the proposal/flag — NEVER to decide a match
// or a number. Default behavior is fully deterministic (no model, no key needed), so the
// golden test runs offline and proves zero external writes.

import { createTask, createProposal, setTaskResult } from "@/lib/repository/agent";
import type { Db, Ctx } from "@/lib/repository/types";
import { assertCleared, type DataScope } from "@/lib/ai/guard";
import { redactValue } from "@/lib/ai/redact";
import { runTool } from "@/lib/agent/registry";
import { classifyRisk, type ClassifiableTool } from "@/lib/agent/risk";
import { artifactFromReconMatch, artifactGeneric } from "@/lib/agent/review-artifact";
import { proposeBankTransaction, proposeManualJournal } from "@/lib/integrations/xero";
import { reconcile, type BankTxn, type LedgerItem, type ReconResult, type Match } from "./match";

// Risk-gate metadata for the two recon write tools (mirrors their registry annotations): both
// post money to the books via the Xero API → high stakes, review lane.
const RECON_BANK_TOOL: ClassifiableTool = { name: "create_xero_bank_transaction", tier: 3, access: "write", connector: "api", stakes: "high" };
const RECON_JOURNAL_TOOL: ClassifiableTool = { name: "create_xero_manual_journal", tier: 3, access: "write", connector: "api", stakes: "high" };

// Turn a match into human-readable reasons + any mismatches (the confidence signal the gate uses).
function matchEvidence(m: Match, bankAmount: string, ledgerAmount: string): { reasons: string[]; mismatches: string[] } {
  const reasons: string[] = [];
  const mismatches: string[] = [];
  if (m.basis === "exact") {
    reasons.push("exact match on amount and date");
  } else {
    reasons.push(`memo similarity ${Math.round(m.detail.memoSimilarity * 100)}%`);
    if (m.detail.dayGap > 0) mismatches.push(`dated ${m.detail.dayGap} day${m.detail.dayGap === 1 ? "" : "s"} apart`);
    if (m.detail.memoSimilarity < 1) mismatches.push("memo is a fuzzy match");
  }
  if (bankAmount !== ledgerAmount) mismatches.push(`amount differs: bank ${bankAmount} vs ledger ${ledgerAmount}`);
  return { reasons, mismatches };
}

// An optional rationale drafter — injected so a model can phrase the human-readable
// rationale / suggest a category. It receives ONLY non-PII structured facts (ids, amounts,
// dates, a basis) and returns a short string. Default: deterministic, model-free.
export type RationaleDrafter = (facts: {
  kind: "match" | "journal" | "exception";
  detail: Record<string, unknown>;
}) => string | Promise<string>;

const deterministicRationale: RationaleDrafter = ({ kind, detail }) => {
  if (kind === "match") {
    return `${detail.basis === "exact" ? "Exact" : "Fuzzy"} match: bank ${detail.bankId} ↔ ledger ${detail.ledgerId} for ${detail.amount} on ${detail.bankDate}.`;
  }
  if (kind === "journal") {
    return `Month-end accrual journal for ${detail.period} totalling ${detail.amount} (${detail.lineCount} line(s)).`;
  }
  return `Exception (${detail.side}): ${detail.amount} on ${detail.date} — ${detail.reason}.`;
};

export type ReconExceptionFlag = {
  side: "bank" | "ledger";
  id: string;
  amount: string;
  date: string;
  label: string;
  reason: string;
  suggestion: string; // human-readable; a SUGGESTION only, never an auto-resolution
};

export type RunReconciliationResult = {
  taskId: string;
  status: "awaiting_approval" | "completed";
  proposalIds: string[];
  matchedCount: number;
  proposedJournalCount: number;
  exceptions: ReconExceptionFlag[];
  tieOut: ReconResult["tieOut"];
  /** invariant: this task performs ZERO external writes. Always 0. */
  externalWrites: 0;
};

export type RunReconciliationOpts = {
  /** scopes the caller holds — must include xero:read for the read tools to dispatch. */
  callerScopes?: string[];
  /** optional model-backed rationale/suggestion drafter (default deterministic). */
  draftRationale?: RationaleDrafter;
  period?: string; // yyyy-mm label for the task input (cosmetic)
  /** §7216 data scope; 'synthetic' until counsel clears real-data AI (MEDIUM-7). */
  taxScope?: DataScope;
};

export async function runReconciliation(
  db: Db,
  ctx: Ctx,
  clientId: string,
  connectionId: string,
  opts: RunReconciliationOpts = {},
): Promise<RunReconciliationResult> {
  // MEDIUM-7: §7216 parity. A real-data caller must trip the same HARD gate the model
  // pipeline does — enforced in code at entry, not in a comment. 'synthetic' (the default)
  // passes; 'real' THROWS until counsel clears real-data AI (PETAL_7216_CLEARED).
  assertCleared(opts.taxScope ?? "synthetic");

  const callerScopes = opts.callerScopes ?? ["xero:read"];
  const baseDraft = opts.draftRationale ?? deterministicRationale;
  // MEDIUM-7: every fact reaching the drafter is routed through redactValue as a second
  // pass — so even if a future MODEL-backed drafter is wired in, no PII-shaped string in
  // the (already free-text-free) facts can reach it verbatim.
  // DEFER LOW-8: the default drafter is deterministic (no model turn). When a MODEL-backed
  // drafter is introduced here, each draft(...) call becomes a model turn and MUST be wired
  // to recordRun (agent_runs) for the §7216 model-turn audit trail (and assertCleared above
  // must gate on the real tax scope). That needs a RationaleDrafter interface change, so it
  // is deferred until a model drafter exists.
  const draft: RationaleDrafter = (facts) =>
    baseDraft({ kind: facts.kind, detail: redactValue(facts.detail) as Record<string, unknown> });

  // 1. durable task row (tier 2 — propose-only). INV-3.
  const task = await createTask(db, ctx, {
    clientId,
    createdByUserId: ctx.actorId ?? undefined,
    kind: "reconciliation",
    tier: 2,
    input: { connectionId, period: opts.period ?? null },
  });

  try {
    // 2. READ both sides via the registry (scope re-checked at dispatch — INV-4). The
    //    read tools are tier-1; runTool runs them and returns the synthetic stub data.
    const bankTxns = (await runTool("xero_list_bank_transactions", { connectionId }, callerScopes)) as BankTxn[];
    const ledgerItems = (await runTool("xero_list_ledger_items", { connectionId }, callerScopes)) as LedgerItem[];

    // 3. DETERMINISTIC match + math (INV-1). No model, no I/O.
    const recon = reconcile(bankTxns, ledgerItems);

    const proposalIds: string[] = [];

    // 4a. one proposal per CLEAN match — staged as the tier-3 Xero bank-transaction write.
    //     args = the EXACT would-be args (built by the NON-executing propose* helper).
    for (const m of recon.matched) {
      const bank = bankTxns.find((b) => b.id === m.bankId)!;
      const ledger = ledgerItems.find((l) => l.id === m.ledgerId)!;
      const args = proposeBankTransaction({
        connectionId,
        bankTransactionId: m.bankId,
        ledgerItemId: m.ledgerId,
        amount: bank.amount,
        date: bank.date,
        reference: bank.reference ?? ledger.reference,
      });
      const rationale = await draft({
        kind: "match",
        detail: { basis: m.basis, bankId: m.bankId, ledgerId: m.ledgerId, amount: bank.amount, bankDate: bank.date },
      });
      // Risk gate: classify with the match's real confidence + mismatches, and ship the
      // evidenced artifact (bank ↔ ledger, each with its amount + the match reasons/mismatches).
      const conf = confidenceFor(m);
      const { reasons, mismatches } = matchEvidence(m, bank.amount, ledger.amount);
      const risk = classifyRisk(RECON_BANK_TOOL, args as unknown as Record<string, unknown>, { confidence: conf, reconMismatches: mismatches });
      const reviewArtifact = artifactFromReconMatch({
        matchType: "bank_to_ledger",
        bankTxnId: m.bankId,
        ledgerItemId: m.ledgerId,
        bankAmount: bank.amount,
        ledgerAmount: ledger.amount,
        matchScore: conf,
        matchReasons: reasons,
        mismatches,
      });
      const row = await createProposal(db, ctx, {
        taskId: task.id,
        clientId,
        toolName: "create_xero_bank_transaction",
        args: args as unknown as Record<string, unknown>,
        rationale,
        evidence: {
          basis: m.basis,
          bank,
          ledger,
          matchDetail: m.detail,
          tieOut: recon.tieOut, // the tie-out trace travels with every proposal
        },
        confidence: conf,
        risk,
        reviewArtifact,
      });
      proposalIds.push(row.id);
    }

    // 4b. one proposal per month-end MANUAL JOURNAL — staged as the tier-3 Xero journal write.
    for (const j of recon.proposedJournals) {
      const args = proposeManualJournal({
        connectionId,
        date: j.date,
        narration: j.narration,
        lines: j.lines,
      });
      const rationale = await draft({
        kind: "journal",
        detail: { period: j.period, amount: j.amount, lineCount: j.lines.length },
      });
      const journalRisk = classifyRisk(RECON_JOURNAL_TOOL, args as unknown as Record<string, unknown>, { confidence: 0.8 });
      const row = await createProposal(db, ctx, {
        taskId: task.id,
        clientId,
        toolName: "create_xero_manual_journal",
        args: args as unknown as Record<string, unknown>,
        rationale,
        evidence: {
          kind: "month_end_journal",
          journal: j,
          sourceBankIds: j.sourceBankIds,
          tieOut: recon.tieOut,
        },
        confidence: 0.8,
        risk: journalRisk,
        reviewArtifact: artifactGeneric("create_xero_manual_journal", rationale, args as unknown as Record<string, unknown>),
      });
      proposalIds.push(row.id);
    }

    // 4c. EXCEPTIONS — flagged for a human with a reason + a SUGGESTION. NOT auto-resolved,
    //     NOT staged as a write. They travel back in the result for the review surface.
    const exceptions: ReconExceptionFlag[] = [];
    for (const e of [...recon.unmatched.bank, ...recon.unmatched.ledger]) {
      // MEDIUM-7: pass only side, amount, date, and the coded reason — STOP passing the
      // free-text party/label so a (future) model drafter never sees a party name.
      const suggestion = await draft({
        kind: "exception",
        detail: { side: e.side, amount: e.amount, date: e.date, reason: e.reason },
      });
      exceptions.push({ ...e, suggestion });
    }

    // 5. terminate. tier-2 with staged writes -> awaiting_approval; nothing external written.
    const status: RunReconciliationResult["status"] = proposalIds.length ? "awaiting_approval" : "completed";
    await setTaskResult(db, ctx, task.id, status, {
      proposals: proposalIds,
      matched: recon.matched.length,
      proposedJournals: recon.proposedJournals.length,
      exceptions: exceptions.length,
      tieOut: recon.tieOut,
      externalWrites: 0,
    });

    return {
      taskId: task.id,
      status,
      proposalIds,
      matchedCount: recon.matched.length,
      proposedJournalCount: recon.proposedJournals.length,
      exceptions,
      tieOut: recon.tieOut,
      externalWrites: 0,
    };
  } catch (e) {
    await setTaskResult(db, ctx, task.id, "failed", { error: e instanceof Error ? e.message : "unknown" });
    throw e;
  }
}

// A code-derived confidence (never a model number): exact matches are near-certain;
// fuzzy matches scale with memo similarity and date proximity.
function confidenceFor(m: Match): number {
  if (m.basis === "exact") return 0.99;
  const dateFactor = Math.max(0, 1 - m.detail.dayGap / 10);
  return Math.round((0.6 + 0.3 * m.detail.memoSimilarity + 0.1 * dateFactor) * 100) / 100;
}

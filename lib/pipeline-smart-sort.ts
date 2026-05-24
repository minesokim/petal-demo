"use client";

/**
 * Smart per-stage sorting + AI-suggest helpers for the pipeline Kanban.
 *
 * The Smart sort is stage-aware: each column has its own ranking signal
 * (% docs for Collecting Docs, deadline proximity for In Preparation, etc.).
 * Cross-stage boosts (urgency, unread messages, unread insights) apply to all
 * stages on top of the per-stage score.
 *
 * The three alternate sort modes (Stale, Recent, Name) are stage-agnostic.
 */

import type { Client, ReturnStage } from "@/lib/mock-data";
import { getUnreadCountForClient } from "@/lib/comms-mock-data";
import { getInsightForClient } from "@/lib/insights-mock-data";

export type SortMode = "smart" | "stale" | "recent" | "name";
export type Density = "comfortable" | "compact";

function daysSince(iso: string | undefined): number {
  if (!iso) return 999;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

/**
 * Per-stage Smart score. Higher = ranks higher in the column.
 *
 * Cross-stage boosts (always applied):
 *   +1000 if urgency = high
 *   +500  per unread client message
 *   +100  if unread AI insight
 *
 * Per-stage signals — see comments inline.
 */
export function smartScore(client: Client, stage: ReturnStage): number {
  let score = 0;

  // ─── Cross-stage boosts ───
  if (client.urgency === "high") score += 1000;
  const unread = getUnreadCountForClient(client.id);
  score += unread * 500;
  // Boost slightly if there's any AI insight for this client (rough proxy for "needs attention")
  if (getInsightForClient(client.id)) score += 100;

  // ─── Per-stage signals ───
  switch (stage) {
    case "new_intake": {
      // Older intakes first — you've been sitting on this, get back to them
      score += daysSince(client.lastActivity) * 10;
      break;
    }
    case "collecting_docs": {
      // Almost-done clients float up; staler ones get an extra nudge
      const pct = client.documentsRequired > 0
        ? client.documentsSubmitted / client.documentsRequired
        : 0;
      score += pct * 200;
      score += daysSince(client.lastActivity) * 8;
      break;
    }
    case "ready_to_prep":
    case "in_preparation": {
      // Deadline proximity — soonest first (negative because lower days = higher score)
      // Without a real deadline field, use lastActivity staleness as a proxy
      score += daysSince(client.lastActivity) * 15;
      // High-fee clients get a small boost (revenue priority during crunch)
      score += (client.feeAmount ?? 0) / 100;
      break;
    }
    case "client_review": {
      // Days awaiting client response — longest waits at top
      const sentDays = client.returnSentDate ? daysSince(client.returnSentDate) : 0;
      score += sentDays * 25;
      break;
    }
    case "pay_and_sign": {
      // Days since payment requested — past due at top
      score += daysSince(client.lastActivity) * 20;
      // ERO signing required → bump
      if (!client.depositPaid) score += 200;
      break;
    }
    case "filed": {
      // Most recently filed first — reverse chronological
      score -= daysSince(client.returnSentDate ?? client.lastActivity);
      break;
    }
    default: {
      score += daysSince(client.lastActivity);
    }
  }

  return score;
}

/**
 * Sort a column's clients according to the selected mode.
 * For Smart, uses the per-stage `smartScore` function.
 */
export function sortClients(
  clients: Client[],
  mode: SortMode,
  stage: ReturnStage | "pending"
): Client[] {
  const arr = [...clients];
  switch (mode) {
    case "smart": {
      if (stage === "pending") {
        // Pending column — newest intakes first (most fresh leads on top)
        arr.sort((a, b) => daysSince(a.lastActivity) - daysSince(b.lastActivity));
      } else {
        arr.sort((a, b) => smartScore(b, stage as ReturnStage) - smartScore(a, stage as ReturnStage));
      }
      break;
    }
    case "stale": {
      // Oldest activity first (longest gap = most stale)
      arr.sort((a, b) => daysSince(b.lastActivity) - daysSince(a.lastActivity));
      break;
    }
    case "recent": {
      // Newest activity first
      arr.sort((a, b) => daysSince(a.lastActivity) - daysSince(b.lastActivity));
      break;
    }
    case "name": {
      arr.sort((a, b) => a.fullName.localeCompare(b.fullName));
      break;
    }
  }
  return arr;
}

/**
 * Heuristic: which stage (if any) should the AI suggest advancing this client to?
 * Returns null if the client is fine where they are.
 *
 * Distinct from auto-advance: this returns "almost ready" suggestions; the UI
 * surfaces them as a 1-click chip on the card. Auto-advance is reserved for
 * 100% deterministic transitions.
 */
export function suggestedAdvanceStage(
  client: Client,
  effectiveStage: ReturnStage
): ReturnStage | null {
  switch (effectiveStage) {
    case "collecting_docs": {
      const pct = client.documentsRequired > 0
        ? client.documentsSubmitted / client.documentsRequired
        : 0;
      // 85%+ docs in and deposit paid → suggest advance to ready_to_prep
      if (pct >= 0.85 && client.depositPaid) return "ready_to_prep";
      return null;
    }
    case "ready_to_prep": {
      // If all checks pass, AI should auto-advance; nothing to suggest
      return null;
    }
    default:
      return null;
  }
}

/**
 * Returns true if the AI should *auto-advance* this client right now (criteria
 * are 100% deterministic and met). Callers should also call setClientStage
 * with by="ai" and show the Undo toast.
 */
export function shouldAutoAdvance(
  client: Client,
  effectiveStage: ReturnStage
): { next: ReturnStage; reason: string } | null {
  if (effectiveStage === "collecting_docs") {
    const allDocs = client.documentsRequired > 0 && client.documentsSubmitted >= client.documentsRequired;
    if (allDocs && client.depositPaid) {
      return { next: "ready_to_prep", reason: "All documents received and deposit paid" };
    }
  }
  return null;
}

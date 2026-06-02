"use client";

/**
 * Per-issue assignment store (session-only).
 *
 * Distinct from `client-assignment-store`, which reassigns a client's ENTIRE
 * book to a different preparer. This store delegates a SINGLE triage issue to
 * a teammate — "Elena, handle this one card" — without touching who owns the
 * rest of the client relationship.
 *
 * Each assignment carries:
 *   - assigneeId   who's doing it (firm member id)
 *   - assignedBy   who delegated it (for the audit trail / "assigned by you")
 *   - dueAt        ISO datetime the work is expected by
 *   - note         free-text context for the assignee
 *   - approvalGate when true, the assignee must route the drafted reply back
 *                  to the assigner before it can send (temporarily downgrades
 *                  this one issue's autonomy from auto → drafts)
 *
 * Pattern mirrors the other runtime stores: cached snapshot +
 * useSyncExternalStore so the "getSnapshot should be cached" guard is happy.
 */

import * as React from "react";

export interface IssueAssignment {
  issueId: string;
  assigneeId: string;
  assignedBy: string;
  dueAt: string; // ISO
  note: string;
  approvalGate: boolean;
  assignedAt: string; // ISO, for the audit trail
}

const assignments: Record<string, IssueAssignment> = {};
const listeners = new Set<() => void>();

// Cached snapshot — stable reference until a mutation bumps it.
let cached: Record<string, IssueAssignment> = { ...assignments };

function bump() {
  cached = { ...assignments };
}

function notify() {
  bump();
  listeners.forEach((fn) => fn());
}

export function subscribeIssueAssignments(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return cached;
}

/** Assign (or re-assign) a single triage issue. */
export function setIssueAssignment(input: {
  issueId: string;
  assigneeId: string;
  assignedBy: string;
  dueAt: string;
  note: string;
  approvalGate: boolean;
}): void {
  assignments[input.issueId] = {
    ...input,
    assignedAt: new Date().toISOString(),
  };
  notify();
}

/** Clear a single issue's assignment (un-delegate). */
export function clearIssueAssignment(issueId: string): void {
  delete assignments[issueId];
  notify();
}

/** React hook: full assignment map. Re-renders on any change. */
export function useIssueAssignments(): Record<string, IssueAssignment> {
  return React.useSyncExternalStore(subscribeIssueAssignments, getSnapshot, getSnapshot);
}

/** Non-reactive read of a single issue's assignment. */
export function getIssueAssignment(issueId: string): IssueAssignment | undefined {
  return cached[issueId];
}

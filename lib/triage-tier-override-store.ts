"use client";

/**
 * Per-issue tier override store (session-only).
 *
 * Powers "Bump priority" in the triage 3-dot menu. Re-tiering moves a card
 * between the queue's status sections (Blocks filing · Needs client · Later
 * today · Needs review). The page maps each issue's tier through this store
 * before grouping.
 *
 * Same cached-snapshot pattern as the other runtime stores.
 */

import * as React from "react";
import type { TriageTier } from "@/lib/triage-mock-data";

const overrides: Record<string, TriageTier> = {};
const listeners = new Set<() => void>();

let cached: Record<string, TriageTier> = { ...overrides };

function notify() {
  cached = { ...overrides };
  listeners.forEach((fn) => fn());
}

export function setTierOverride(issueId: string, tier: TriageTier): void {
  overrides[issueId] = tier;
  notify();
}

export function clearTierOverride(issueId: string): void {
  delete overrides[issueId];
  notify();
}

export function subscribeTierOverrides(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return cached;
}

export function useTierOverrides(): Record<string, TriageTier> {
  return React.useSyncExternalStore(subscribeTierOverrides, getSnapshot, getSnapshot);
}

export function getAllTierOverrides(): Record<string, TriageTier> {
  return cached;
}

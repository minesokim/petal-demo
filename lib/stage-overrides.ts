/**
 * Legacy stage-overrides API — now a thin shim over `pipeline-stage-store.ts`.
 *
 * Why: there were two competing override stores (this one + the new pipeline
 * store). Popup stage-advancement buttons wrote here; Kanban drag-and-drop
 * wrote to the new store. The two never synced, so dragging a card back to
 * an earlier stage didn't reset the popup's color/badge.
 *
 * Fix: route every stage mutation through the single source of truth
 * (`pipeline-stage-store`). This module keeps its export signature intact so
 * existing call sites (popup, overview page) keep working unchanged.
 */

import {
  setClientStage,
  getClientStage,
  clearClientStage,
  getAllStageOverrides,
} from "@/lib/pipeline-stage-store";
import type { ReturnStage } from "@/lib/mock-data";

export function setStageOverride(clientId: string, stage: string) {
  // The legacy API doesn't pass `from`. Use the current effective override (or
  // the new stage as a self-fallback) so the move-log entry doesn't lose its
  // anchor — exact `from` accuracy is best-effort here.
  const current = getAllStageOverrides()[clientId];
  setClientStage(
    clientId,
    stage as ReturnStage,
    "manual",
    (current ?? (stage as ReturnStage))
  );
}

export function getStageOverride(clientId: string): string | undefined {
  return getAllStageOverrides()[clientId];
}

export function getEffectiveStage(clientId: string, defaultStage: string): string {
  return getClientStage(clientId, defaultStage as ReturnStage);
}

export function clearStageOverride(clientId: string) {
  clearClientStage(clientId);
}

export function applyStageOverrides<T extends { id: string; returnStage: string }>(clients: T[]): T[] {
  const o = getAllStageOverrides();
  if (Object.keys(o).length === 0) return clients;
  return clients.map(c => {
    const override = o[c.id];
    return override ? { ...c, returnStage: override as ReturnStage } : c;
  });
}

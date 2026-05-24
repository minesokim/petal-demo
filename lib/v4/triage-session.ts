/**
 * Cross-page triage session state.
 *
 * Primary consumer of this module is the Phase 4 round-trip: when
 * Antonio presses Enter on triage item N, opens the workspace, then
 * presses ⌘T to return, he should land on item N+1 in the queue.
 *
 * sessionStorage was chosen over React Context because the triage
 * and workspace pages live in separate route segments — a context
 * provider that survives navigation would need to live above both
 * routes and then re-mount its subtree on every push (which is what
 * React is supposed to do). Keeping a tiny serializable record out
 * of the component tree sidesteps all of that.
 *
 * SSR-safe: every read/write is guarded because sessionStorage
 * doesn't exist on the server.
 */

const KEY = "petal.v4.triage";

export type TriageSession = {
  /** 0-based index of the item Antonio opened into the workspace. */
  lastIndex: number;
  /** Where to land when ⌘T returns to triage. Usually lastIndex + 1. */
  landIndex: number;
  /** Timestamp for future staleness heuristics. */
  updatedAt: number;
};

export function readTriageSession(): TriageSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TriageSession;
    if (
      typeof parsed?.lastIndex === "number" &&
      typeof parsed?.landIndex === "number"
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function writeTriageSession(session: TriageSession): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    /* quota or disabled — safe to ignore, round-trip degrades to "same item" */
  }
}

export function clearTriageSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

/**
 * Record that the user opened triage item `index` into the workspace.
 * The workspace will use `landIndex = index + 1` for the return trip,
 * capped at the queue length.
 */
export function recordOpen(index: number, total: number): void {
  const landIndex = Math.min(index + 1, Math.max(total - 1, 0));
  writeTriageSession({
    lastIndex: index,
    landIndex,
    updatedAt: Date.now()
  });
}

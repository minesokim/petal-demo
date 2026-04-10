// Session-level stage overrides
// Persists across Next.js client-side navigations, resets on full page reload
// Uses sessionStorage with a "generation" key that resets on each full page load

const STORAGE_KEY = "docket-stage-overrides";
const GEN_KEY = "docket-stage-gen";

// Generate a unique ID for this page load — changes on every full reload
const pageLoadId = typeof window !== "undefined" ? Math.random().toString(36).slice(2) : "";

// On first load, clear any stale overrides from previous sessions
if (typeof window !== "undefined") {
  const storedGen = sessionStorage.getItem(GEN_KEY);
  if (storedGen !== pageLoadId) {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.setItem(GEN_KEY, pageLoadId);
  }
}

function getOverrides(): Record<string, string> {
  if (typeof window === "undefined") return {};
  // Only return overrides from this page load generation
  const storedGen = sessionStorage.getItem(GEN_KEY);
  if (storedGen !== pageLoadId) return {};
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}");
  } catch { return {}; }
}

function saveOverrides(overrides: Record<string, string>) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  sessionStorage.setItem(GEN_KEY, pageLoadId);
}

export function setStageOverride(clientId: string, stage: string) {
  const o = getOverrides();
  o[clientId] = stage;
  saveOverrides(o);
}

export function getStageOverride(clientId: string): string | undefined {
  return getOverrides()[clientId];
}

export function getEffectiveStage(clientId: string, defaultStage: string): string {
  return getOverrides()[clientId] || defaultStage;
}

export function clearStageOverride(clientId: string) {
  const o = getOverrides();
  delete o[clientId];
  saveOverrides(o);
}

export function applyStageOverrides<T extends { id: string; returnStage: string }>(clients: T[]): T[] {
  const o = getOverrides();
  if (Object.keys(o).length === 0) return clients;
  return clients.map(c => {
    const override = o[c.id];
    return override ? { ...c, returnStage: override as any } : c;
  });
}

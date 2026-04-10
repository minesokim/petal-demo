// Session-level stage overrides using sessionStorage
// Persists across Next.js client-side navigations, resets on tab close

const STORAGE_KEY = "docket-stage-overrides";

function getOverrides(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}");
  } catch { return {}; }
}

function saveOverrides(overrides: Record<string, string>) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
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

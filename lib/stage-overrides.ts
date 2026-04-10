// Session-level stage overrides — persists across page navigations but resets on refresh
// This allows the ERO signing demo to update the pipeline view without changing mock data

const overrides = new Map<string, string>();

export function setStageOverride(clientId: string, stage: string) {
  overrides.set(clientId, stage);
}

export function getStageOverride(clientId: string): string | undefined {
  return overrides.get(clientId);
}

export function getEffectiveStage(clientId: string, defaultStage: string): string {
  return overrides.get(clientId) || defaultStage;
}

export function clearStageOverride(clientId: string) {
  overrides.delete(clientId);
}

// Apply overrides to a clients array — returns new array with returnStage updated
export function applyStageOverrides<T extends { id: string; returnStage: string }>(clients: T[]): T[] {
  if (overrides.size === 0) return clients;
  return clients.map(c => {
    const override = overrides.get(c.id);
    return override ? { ...c, returnStage: override } : c;
  });
}

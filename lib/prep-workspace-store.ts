// Cross-component open-state for the Prep Workspace modal.
//
// The button lives in the client command bar (every section); the modal lives in
// the Overview page. Holding the open flag in a module store lets the button open
// it INSTANTLY via local subscription (no route navigation = no dev-compile
// latency) when already on Overview. From another section the layout navigates to
// Overview first, then this flag (already true) opens the modal on mount.

let open = false;
const listeners = new Set<() => void>();

export function setPrepWorkspaceOpen(value: boolean) {
  if (open === value) return;
  open = value;
  listeners.forEach(l => l());
}

export function getPrepWorkspaceOpen(): boolean {
  return open;
}

export function subscribePrepWorkspace(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

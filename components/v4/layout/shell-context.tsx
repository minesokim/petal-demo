"use client";

import * as React from "react";

/**
 * ShellContext — lets pages inject content into the layout's Header
 * middle slot and the StatusBar's return hint, without having to
 * re-render the whole shell themselves.
 *
 * Triage: mounts its ProgressStrip via <HeaderSlot/>
 * Client workspace (Phase 3): mounts "← Triage N/M ⌘T" via <HeaderSlot/>
 *                              and sets status bar returnHint
 */

type ReturnHint = { remaining: number } | null;

type ShellState = {
  headerContent: React.ReactNode;
  setHeaderContent: React.Dispatch<React.SetStateAction<React.ReactNode>>;
  returnHint: ReturnHint;
  setReturnHint: React.Dispatch<React.SetStateAction<ReturnHint>>;
};

const ShellCtx = React.createContext<ShellState | null>(null);

export function ShellProvider({ children }: { children: React.ReactNode }) {
  const [headerContent, setHeaderContent] = React.useState<React.ReactNode>(null);
  const [returnHint, setReturnHint] = React.useState<ReturnHint>(null);

  const value = React.useMemo(
    () => ({ headerContent, setHeaderContent, returnHint, setReturnHint }),
    [headerContent, returnHint]
  );

  return <ShellCtx.Provider value={value}>{children}</ShellCtx.Provider>;
}

export function useShell() {
  const ctx = React.useContext(ShellCtx);
  if (!ctx) {
    throw new Error("useShell must be used inside (auth-v4) layout");
  }
  return ctx;
}

/** Mount React children into the Header's middle slot for the lifetime of this component. */
export function HeaderSlot({ children }: { children: React.ReactNode }) {
  const { setHeaderContent } = useShell();

  React.useEffect(() => {
    setHeaderContent(children);
    return () => setHeaderContent(null);
  }, [children, setHeaderContent]);

  return null;
}

/** Set the StatusBar return hint (⌘T back to triage · N remaining) while mounted. */
export function useReturnHint(hint: ReturnHint) {
  const { setReturnHint } = useShell();
  React.useEffect(() => {
    setReturnHint(hint);
    return () => setReturnHint(null);
  }, [hint, setReturnHint]);
}

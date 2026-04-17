"use client";

import * as React from "react";
import type { Shortcut } from "./status-bar";

/**
 * ShellContext — lets pages inject content into the layout's Header
 * middle slot and customize the StatusBar (return hint + shortcut row)
 * without having to re-render the whole shell themselves.
 *
 * Triage:            HeaderSlot = <ProgressStrip />, shortcuts = J/K/⏎/R/S/⌫
 * Client workspace:  HeaderSlot = <WorkspaceBreadcrumb />,
 *                    returnHint = { remaining: N }, shortcuts = M/C/R/Tab
 */

type ReturnHint = { remaining: number } | null;

type ShellState = {
  headerContent: React.ReactNode;
  setHeaderContent: React.Dispatch<React.SetStateAction<React.ReactNode>>;
  returnHint: ReturnHint;
  setReturnHint: React.Dispatch<React.SetStateAction<ReturnHint>>;
  shortcuts: Shortcut[] | null;
  setShortcuts: React.Dispatch<React.SetStateAction<Shortcut[] | null>>;
};

const ShellCtx = React.createContext<ShellState | null>(null);

export function ShellProvider({ children }: { children: React.ReactNode }) {
  const [headerContent, setHeaderContent] = React.useState<React.ReactNode>(null);
  const [returnHint, setReturnHint] = React.useState<ReturnHint>(null);
  const [shortcuts, setShortcuts] = React.useState<Shortcut[] | null>(null);

  const value = React.useMemo(
    () => ({
      headerContent,
      setHeaderContent,
      returnHint,
      setReturnHint,
      shortcuts,
      setShortcuts
    }),
    [headerContent, returnHint, shortcuts]
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

/** Override the StatusBar shortcut row for the lifetime of the calling component. */
export function useStatusShortcuts(shortcuts: Shortcut[]) {
  const { setShortcuts } = useShell();
  const key = JSON.stringify(shortcuts);
  React.useEffect(() => {
    setShortcuts(shortcuts);
    return () => setShortcuts(null);
    // key captures identity of the shortcuts array so callers can pass inline arrays safely
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, setShortcuts]);
}

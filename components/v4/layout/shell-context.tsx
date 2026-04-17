"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import type { Shortcut } from "./status-bar";

/**
 * ShellContext — lets pages customize the StatusBar (return hint +
 * shortcut row) without re-rendering the whole shell themselves.
 *
 * Header middle-slot content flows through a DOM portal (see
 * <HeaderSlot>), NOT through context state — passing JSX through
 * useState triggers infinite loops because children is a fresh
 * element reference on every render.
 *
 * Triage:            HeaderSlot = <ProgressStrip />, shortcuts = J/K/⏎/R/S/⌫
 * Client workspace:  HeaderSlot = <WorkspaceBreadcrumb />,
 *                    returnHint = N remaining, shortcuts = M/C/R/Tab
 */

type ReturnHint = { remaining: number } | null;

type ShellState = {
  returnHint: ReturnHint;
  setReturnHint: React.Dispatch<React.SetStateAction<ReturnHint>>;
  shortcuts: Shortcut[] | null;
  setShortcuts: React.Dispatch<React.SetStateAction<Shortcut[] | null>>;
};

const ShellCtx = React.createContext<ShellState | null>(null);

/** DOM attribute identifying the header middle-slot portal target. */
export const HEADER_SLOT_ATTR = "data-header-slot";

export function ShellProvider({ children }: { children: React.ReactNode }) {
  const [returnHint, setReturnHint] = React.useState<ReturnHint>(null);
  const [shortcuts, setShortcuts] = React.useState<Shortcut[] | null>(null);

  const value = React.useMemo(
    () => ({ returnHint, setReturnHint, shortcuts, setShortcuts }),
    [returnHint, shortcuts]
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

/**
 * Portal React children into the Header's middle slot (the element
 * with data-header-slot="" in the AppShell header). Portal means we
 * don't store JSX in state, which avoids the "children is a fresh
 * reference every render" infinite loop.
 */
export function HeaderSlot({ children }: { children: React.ReactNode }) {
  const [target, setTarget] = React.useState<HTMLElement | null>(null);
  React.useEffect(() => {
    const el = document.querySelector(`[${HEADER_SLOT_ATTR}]`) as HTMLElement | null;
    setTarget(el);
  }, []);
  return target ? createPortal(children, target) : null;
}

/** Set the StatusBar return hint (⌘T back to triage · N remaining) while mounted.
 *  Pass a primitive number (or null to clear) to avoid creating a fresh object
 *  reference on every render — the hook re-fires only when the remaining count
 *  actually changes. */
export function useReturnHint(remaining: number | null) {
  const { setReturnHint } = useShell();
  React.useEffect(() => {
    setReturnHint(remaining == null ? null : { remaining });
    return () => setReturnHint(null);
  }, [remaining, setReturnHint]);
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

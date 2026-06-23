"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { FirmData } from "../server/fixture-data";
import { makeDerive } from "../fixtures/derive";

// Carries the firm's real (RLS-scoped) data to client components. A surface's
// server page loads FirmData via loadFirmData() and wraps its view in
// <FirmDataProvider>; components then read useFirmData()/useDerive() instead of
// importing the fixture arrays + named derive exports. Same shapes, same numbers —
// only the source changes, so the JSX stays byte-identical.
const FirmDataContext = createContext<FirmData | null>(null);

export function FirmDataProvider({ data, children }: { data: FirmData; children: ReactNode }) {
  return <FirmDataContext.Provider value={data}>{children}</FirmDataContext.Provider>;
}

export function useFirmData(): FirmData {
  const d = useContext(FirmDataContext);
  if (!d) throw new Error("useFirmData must be used within a FirmDataProvider");
  return d;
}

/** makeDerive bound to the firm's data — the drop-in for the fixture-bound named exports. */
export function useDerive() {
  const data = useFirmData();
  return useMemo(() => makeDerive(data), [data]);
}

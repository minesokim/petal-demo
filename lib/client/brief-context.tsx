"use client";

import { createContext, useContext, type ReactNode } from "react";
import { brief as FIXTURE_BRIEF, type BriefItem } from "@/lib/fixtures/firm";

// Carries the real, server-generated Today's Brief to the (frozen) TodayBrief component.
// Falls back to the curated fixture brief if rendered without a provider.
const BriefCtx = createContext<BriefItem[] | null>(null);

export function BriefProvider({ brief, children }: { brief: BriefItem[]; children: ReactNode }) {
  return <BriefCtx.Provider value={brief}>{children}</BriefCtx.Provider>;
}

export function useBrief(): BriefItem[] {
  return useContext(BriefCtx) ?? FIXTURE_BRIEF;
}

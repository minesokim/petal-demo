"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * WorkspaceBreadcrumb — content for the Header middle slot while on
 * a client workspace surface.
 *
 * Structure per docket-synthesis.html:
 *   [ ← 1 / 14  ⌘T ]  /  Priya Sharma  /  Overview
 *
 * The back chip is a clickable pill that returns to /dashboard/triage
 * (Phase 4 will add the animated transition). Position is optional —
 * deep-linking into a workspace without a triage context hides it.
 */
export interface WorkspaceBreadcrumbProps {
  /** "Overview", "Documents", etc. Shown as the rightmost chip. */
  tabLabel: string;
  clientName: string;
  /** Position context from triage, e.g. { index: 1, total: 14 }. Optional. */
  triagePosition?: { index: number; total: number } | null;
}

export function WorkspaceBreadcrumb({
  tabLabel,
  clientName,
  triagePosition
}: WorkspaceBreadcrumbProps) {
  return (
    <div className="flex h-full items-center gap-3 border-r border-hairline px-5 text-[12px]">
      <Link
        href="/dashboard/triage"
        className={cn(
          "flex items-center gap-2 rounded-[12px] border border-hairline bg-surface py-[3px] pr-2 pl-[9px] text-[12px] font-medium text-ink transition-colors hover:bg-surface-2"
        )}>
        <span className="text-ink-3">←</span>
        <span className="font-medium">Triage</span>
        {triagePosition ? (
          <span className="font-mono text-[11px] tracking-[0.02em] text-ink-3">
            <span className="text-ink">{triagePosition.index}</span> / {triagePosition.total}
          </span>
        ) : null}
        <kbd
          className="inline-flex items-center rounded-[3px] border border-hairline bg-bg px-[5px] font-mono text-[10px] tracking-[0.02em] text-ink-3"
          style={{ lineHeight: "14px" }}>
          ⌘T
        </kbd>
      </Link>

      <BcSep />

      <span className="font-medium text-ink">{clientName}</span>

      <BcSep />

      <span className="text-ink-3">{tabLabel}</span>
    </div>
  );
}

function BcSep() {
  return <span className="text-ink-5">/</span>;
}

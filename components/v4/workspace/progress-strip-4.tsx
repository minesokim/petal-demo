import * as React from "react";
import { cn } from "@/lib/utils";
import type { ProgressCell } from "@/lib/v4/clients";

/**
 * ProgressStrip4 — 4 equal cells in a bordered grid (synthesis.html).
 *
 * Each cell: mono eyebrow label, primary metric (can be rust/positive),
 * 3px track with fill (default ink, override with rust/positive), sub-val
 * in ink-4 that can optionally render in rust for urgent states.
 */
export function ProgressStrip4({ cells }: { cells: ProgressCell[] }) {
  return (
    <div className="grid grid-cols-4 overflow-hidden rounded-[5px] border border-hairline bg-surface">
      {cells.map((c, i) => (
        <Cell key={c.label} cell={c} last={i === cells.length - 1} />
      ))}
    </div>
  );
}

function Cell({ cell, last }: { cell: ProgressCell; last: boolean }) {
  const hasDigits = /^[\$~\d]/.test(cell.mainVal);
  return (
    <div className={cn("px-[18px] py-[14px]", !last && "border-r border-hairline")}>
      <div className="mb-[5px] font-mono text-[9.5px] font-medium tracking-[0.12em] text-ink-4 uppercase">
        {cell.label}
      </div>
      <div
        className={cn(
          "mb-[2px] text-[16px] font-semibold tracking-[-0.01em] text-ink",
          cell.mainTone === "rust" && "text-rust",
          cell.mainTone === "positive" && "text-positive"
        )}>
        <span className={cn(hasDigits && "font-mono tabular-nums")}>{cell.mainVal}</span>
      </div>
      <div className="mt-[7px] mb-[6px] h-[3px] overflow-hidden rounded-[2px] bg-surface-3">
        <div
          className={cn(
            "h-full rounded-[2px] bg-ink",
            cell.fillTone === "rust" && "bg-rust",
            cell.fillTone === "positive" && "bg-positive"
          )}
          style={{ width: `${Math.max(0, Math.min(100, cell.fillPct))}%` }}
        />
      </div>
      {cell.subVal ? (
        <div
          className={cn(
            "text-[11.5px] leading-[1.4] text-ink-4",
            cell.subUrgent && "text-rust"
          )}>
          {cell.subVal}
        </div>
      ) : null}
    </div>
  );
}

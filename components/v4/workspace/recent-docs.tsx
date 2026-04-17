import * as React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DocRow } from "@/lib/v4/clients";

/**
 * RecentDocs — compact 5-row document table.
 *
 * Columns: type chip · name + size · timestamp · status pill · arrow
 * Status pill tones:
 *   extracted → positive green
 *   pending   → warning amber
 *   flagged   → rust
 */
export function RecentDocs({ rows }: { rows: DocRow[] }) {
  return (
    <div className="overflow-hidden rounded-[5px] border border-hairline bg-surface">
      {rows.map((row, i) => (
        <Row key={i} row={row} last={i === rows.length - 1} />
      ))}
    </div>
  );
}

const STATUS_TONE: Record<NonNullable<DocRow["status"]>, string> = {
  extracted: "bg-positive-bg text-positive",
  pending: "bg-warning-bg text-warning",
  flagged: "bg-rust-bg text-rust"
};

function Row({ row, last }: { row: DocRow; last: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "grid w-full cursor-pointer grid-cols-[36px_minmax(0,1fr)_130px_100px_40px] items-center gap-3.5 px-4 py-2.5 text-left text-[12.5px] transition-colors hover:bg-surface-2",
        !last && "border-b border-hairline"
      )}>
      <span className="inline-flex items-center justify-center rounded-[3px] border border-hairline bg-surface-2 px-[6px] py-[2px] font-mono text-[9.5px] font-semibold tracking-[0.05em] text-ink-3">
        {row.type}
      </span>
      <div className="min-w-0 truncate">
        <span className="font-medium text-ink">{row.name}</span>
        <span className="ml-2 font-mono text-[11px] text-ink-4">{row.size}</span>
      </div>
      <span className="font-mono text-[10.5px] tracking-[0.01em] text-ink-4">{row.when}</span>
      {row.status ? (
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-[3px] px-[7px] py-[2px] font-mono text-[9.5px] font-medium tracking-[0.08em] uppercase",
            STATUS_TONE[row.status]
          )}>
          {row.status}
        </span>
      ) : (
        <span />
      )}
      <ChevronRight className="size-3 justify-self-end stroke-[1.5] text-ink-4" aria-hidden />
    </button>
  );
}

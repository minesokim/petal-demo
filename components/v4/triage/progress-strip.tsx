import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * ProgressStrip — header middle slot for the Triage surface.
 *
 * Design intent: a single disciplined line. The 48px header can't
 * accommodate four competing type treatments (segmented bar +
 * fraction + italic serif + mono pace). Earlier iterations rendered
 * 20 thin segments that became visual noise, plus italic Fraunces at
 * SOFT=60 which caused digit glyph artifacts. This version is:
 *
 *   [── continuous track with rust position marker ──]   6 done · 14 left   →   4 pm
 *
 * The editorial "inbox zero by 4 pm · est 2h 20m at pace" line
 * moves to the QueueList subtitle (there it has room to breathe
 * and can render with SOFT=0 for clean digits).
 *
 * Numbers use Geist Mono tabular-nums so they don't reflow as counts
 * tick up during the day. The arrow + goal time is the only rust
 * accent other than the bar marker — keeps the aesthetic restrained.
 */
export interface ProgressStripProps {
  done: number;
  total: number;
  /** Compact goal time, e.g. "4 pm". Shown after the arrow on the right. */
  goalTime: string;
  className?: string;
}

export function ProgressStrip({
  done,
  total,
  goalTime,
  className
}: ProgressStripProps) {
  const remaining = Math.max(total - done, 0);
  const pct = total > 0 ? Math.min(Math.max((done / total) * 100, 0), 100) : 0;
  const markerLeft = `calc(${pct}% - 4px)`; // center the 8px marker on the boundary

  return (
    <div
      className={cn(
        "flex h-full min-w-0 items-center gap-5 border-r border-hairline px-5",
        className
      )}>
      {/* Continuous track with boundary marker */}
      <div className="relative h-[3px] w-[200px] overflow-visible rounded-full bg-hairline">
        <div
          className="h-full rounded-full bg-positive transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
        {remaining > 0 && done > 0 ? (
          <span
            aria-hidden
            className="absolute top-1/2 size-2 -translate-y-1/2 rounded-full bg-rust shadow-[0_0_0_3px_var(--rust-bg),0_0_0_4px_var(--hairline)]"
            style={{ left: markerLeft }}
          />
        ) : null}
      </div>

      {/* Count — two halves, done in ink, remaining in rust */}
      <div className="flex items-baseline gap-1.5 whitespace-nowrap text-[11.5px] text-ink-3">
        <span className="font-mono text-[13px] font-medium tabular-nums text-ink">
          {done}
        </span>
        <span>done</span>
        <span className="text-ink-5">·</span>
        <span className="font-mono text-[13px] font-medium tabular-nums text-rust">
          {remaining}
        </span>
        <span>left</span>
      </div>

      {/* Goal arrow — sans, muted arrow, rust time */}
      <div className="ml-auto flex items-center gap-1.5 whitespace-nowrap text-[11.5px] text-ink-4">
        <span aria-hidden className="text-[13px] leading-none">
          →
        </span>
        <span className="font-medium text-rust">{goalTime}</span>
      </div>
    </div>
  );
}

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * ProgressStrip — header middle slot for the Triage surface.
 *
 * Structure per docket-direction-b-v2.html:
 *   [ segmented progress bar ] [ N done · M remaining ] | [ editorial goal · est pace ]
 *
 * One segment per total item. The segment at index `done` is the
 * "active" (current) item, rendered in rust with a subtle glow.
 * Earlier segments are positive green, later segments are hairline.
 */
export interface ProgressStripProps {
  done: number;
  total: number;
  goalCopy: string;
  paceEstimate: string;
  className?: string;
}

export function ProgressStrip({
  done,
  total,
  goalCopy,
  paceEstimate,
  className
}: ProgressStripProps) {
  const remaining = Math.max(total - done, 0);
  const segs = Array.from({ length: total }, (_, i) => i);

  return (
    <div
      className={cn(
        "flex h-full w-full items-center gap-5 border-r border-hairline px-5",
        className
      )}>
      <div className="flex items-center gap-3.5">
        <div className="flex items-center gap-[2px]">
          {segs.map((i) => {
            const state = i < done ? "done" : i === done ? "active" : "empty";
            return (
              <span
                key={i}
                aria-hidden
                className={cn(
                  "w-4 rounded-[1px] transition-colors",
                  state === "done" && "h-1 bg-positive",
                  state === "empty" && "h-1 bg-hairline-2",
                  state === "active" &&
                    "h-[6px] bg-rust shadow-[0_0_0_2px_var(--rust-bg)]"
                )}
              />
            );
          })}
        </div>

        <div className="flex items-baseline gap-[3px] text-[12px] text-ink-3">
          <span className="font-mono text-[13px] font-medium text-ink">{done}</span>
          <span>done</span>
          <span className="mx-[2px] text-ink-5">·</span>
          <span className="font-mono text-[13px] font-medium text-rust">{remaining}</span>
          <span>remaining</span>
        </div>
      </div>

      <div className="flex items-baseline gap-2 text-[12px] text-ink-3">
        <span className="font-serif text-[13px] italic text-rust" style={{ fontVariationSettings: '"opsz" 14, "SOFT" 60' }}>
          {goalCopy}
        </span>
        <span className="font-mono text-[11px] text-ink-4">· {paceEstimate}</span>
      </div>
    </div>
  );
}

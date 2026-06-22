import { Fragment } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Stage } from "@/lib/fixtures/vocab";

// An Amazon-style horizontal stage tracker. The 7 pipeline stages collapse to
// 5 milestones so the nodes + labels fit a narrow detail rail.
const MILESTONES = ["Docs", "Prep", "Review", "Sign", "Filed"] as const;

/** map a pipeline Stage onto a 0-based milestone index */
export function stageMilestone(stage: Stage): number {
  switch (stage) {
    case "collecting_docs": return 0;
    case "ready_to_prep":
    case "in_preparation": return 1;
    case "in_review": return 2;
    case "pay_and_sign": return 3;
    case "e_filed":
    case "accepted": return 4;
    default: return 0;
  }
}

export function StageTracker({ stage, className }: { stage: Stage; className?: string }) {
  const current = stageMilestone(stage);
  const last = MILESTONES.length - 1;
  const fillPct = (current / last) * 100;

  return (
    <div className={cn("relative px-1 pb-0.5 pt-1", className)}>
      {/* the track behind the nodes (inset half a node so it meets node centers) */}
      <div className="absolute left-[15px] right-[15px] top-[12px] h-[2px] rounded-full bg-[var(--os-border)]" />
      <div
        className="absolute left-[15px] top-[12px] h-[2px] rounded-full bg-[var(--os-brand)] transition-[width] duration-500"
        style={{ width: `calc((100% - 30px) * ${fillPct / 100})` }}
      />

      <div className="relative flex justify-between">
        {MILESTONES.map((m, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <Fragment key={m}>
              <div className="flex w-[20%] flex-col items-center gap-1.5">
                <span
                  className={cn(
                    "grid size-[22px] place-items-center rounded-full border-2 bg-[var(--os-canvas)] transition-colors",
                    done && "border-[var(--os-brand)] bg-[var(--os-brand)] text-white",
                    active && "border-[var(--os-brand)] text-[var(--os-brand)]",
                    !done && !active && "border-[var(--os-border-strong)]",
                  )}
                >
                  {done ? (
                    <Check className="size-3.5" strokeWidth={3} />
                  ) : active ? (
                    <span className="size-2 rounded-full bg-[var(--os-brand)]" />
                  ) : (
                    <span className="size-2 rounded-full bg-[var(--os-border-strong)]" />
                  )}
                </span>
                <span
                  className={cn(
                    "text-[10px] leading-none",
                    active ? "font-medium text-[var(--os-ink)]" : done ? "text-[var(--os-ink-muted)]" : "text-[var(--os-ink-subtle)]",
                  )}
                >
                  {m}
                </span>
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

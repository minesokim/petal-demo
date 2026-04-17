import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NextStep } from "@/lib/v4/clients";

/**
 * NextSteps — numbered list of outstanding + completed tasks.
 *
 * States:
 *   current: dark ring step num (ink bg + bg text)
 *   pending: hairline outlined step num
 *   done:    positive green step num with check glyph, line-through title
 */
export function NextSteps({ steps }: { steps: NextStep[] }) {
  return (
    <div className="overflow-hidden rounded-[5px] border border-hairline bg-surface">
      {steps.map((step, i) => (
        <Row key={i} step={step} index={i + 1} last={i === steps.length - 1} />
      ))}
    </div>
  );
}

function Row({
  step,
  index,
  last
}: {
  step: NextStep;
  index: number;
  last: boolean;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[30px_minmax(0,1fr)_auto] items-center gap-3.5 px-[18px] py-3",
        !last && "border-b border-hairline"
      )}>
      <StepNum state={step.state} index={index} />
      <div className="min-w-0">
        <div
          className={cn(
            "text-[13px] font-[550] text-ink",
            step.state === "done" && "text-ink-4 line-through"
          )}>
          {step.title}
        </div>
        <div className="mt-[2px] font-mono text-[11px] tracking-[0.01em] text-ink-4">
          {step.meta}
        </div>
      </div>
    </div>
  );
}

function StepNum({ state, index }: { state: NextStep["state"]; index: number }) {
  if (state === "done") {
    return (
      <span className="grid size-[22px] place-items-center rounded-full bg-positive text-bg">
        <Check className="size-3 stroke-[2.5]" aria-hidden />
      </span>
    );
  }
  if (state === "current") {
    return (
      <span className="grid size-[22px] place-items-center rounded-full border border-ink bg-ink font-mono text-[10px] font-semibold text-bg">
        {index}
      </span>
    );
  }
  return (
    <span className="grid size-[22px] place-items-center rounded-full border border-hairline-2 bg-bg font-mono text-[10px] font-semibold text-ink-3">
      {index}
    </span>
  );
}

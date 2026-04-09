"use client";

import { cn } from "@/lib/utils";
import { getBinderSummary, type BinderSummaryItem } from "@/lib/binder-categories";

interface BinderSummaryBarProps {
  clientId: string;
}

function CategoryPill({ item }: { item: BinderSummaryItem }) {
  const isComplete = item.received >= item.expected && item.expected > 0;
  const hasPartial = item.received > 0 && item.received < item.expected;
  const fillPercent = item.expected > 0 ? Math.round((item.received / item.expected) * 100) : 0;

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          "flex items-center gap-1 rounded-md border px-1.5 py-0.5",
          isComplete ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/20" :
          hasPartial ? "border-amber-200 bg-amber-50/30 dark:border-amber-900 dark:bg-amber-950/20" :
          "border-border/50 bg-muted/30"
        )}
      >
        <span className={cn(
          "text-[9px] font-medium",
          isComplete ? "text-emerald-700 dark:text-emerald-400" :
          hasPartial ? "text-amber-700 dark:text-amber-400" :
          "text-muted-foreground"
        )}>
          {item.config.shortLabel}
        </span>
        <span className={cn(
          "text-[8px] tabular-nums",
          isComplete ? "text-emerald-600/70" :
          hasPartial ? "text-amber-600/70" :
          "text-muted-foreground/60"
        )}>
          {item.received}/{item.expected}
        </span>
      </div>
      {/* Micro progress bar */}
      <div className="h-0.5 w-full max-w-[40px] overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            isComplete ? "bg-emerald-500" : hasPartial ? "bg-amber-500" : "bg-muted-foreground/20"
          )}
          style={{ width: `${fillPercent}%` }}
        />
      </div>
    </div>
  );
}

export function BinderSummaryBar({ clientId }: BinderSummaryBarProps) {
  const summary = getBinderSummary(clientId);

  if (summary.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-border/30 px-3 py-2">
      {summary.map((item) => (
        <CategoryPill key={item.category} item={item} />
      ))}
    </div>
  );
}

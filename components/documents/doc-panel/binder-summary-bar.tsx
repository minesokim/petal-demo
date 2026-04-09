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
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-md border px-2 py-1",
        isComplete
          ? "border-emerald-200/60 bg-emerald-50/30 dark:border-emerald-800/40 dark:bg-emerald-950/20"
          : hasPartial
            ? "border-amber-200/60 bg-amber-50/20 dark:border-amber-800/40 dark:bg-amber-950/20"
            : "border-border/40 bg-muted/20"
      )}
    >
      <span
        className={cn(
          "text-[10px] font-medium",
          isComplete
            ? "text-emerald-700 dark:text-emerald-400"
            : hasPartial
              ? "text-amber-700 dark:text-amber-400"
              : "text-muted-foreground"
        )}
      >
        {item.config.label}
      </span>
      <span
        className={cn(
          "text-[9px] tabular-nums",
          isComplete ? "text-emerald-600/60" : hasPartial ? "text-amber-600/60" : "text-muted-foreground/50"
        )}
      >
        {item.received}/{item.expected}
      </span>
      {/* Tiny completion dot */}
      <div
        className={cn(
          "size-1 rounded-full",
          isComplete ? "bg-emerald-500" : hasPartial ? "bg-amber-500" : "bg-muted-foreground/20"
        )}
      />
    </div>
  );
}

export function BinderSummaryBar({ clientId }: BinderSummaryBarProps) {
  const summary = getBinderSummary(clientId);

  if (summary.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border bg-card px-3 py-2">
      <span className="mr-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Binder
      </span>
      {summary.map((item) => (
        <CategoryPill key={item.category} item={item} />
      ))}
    </div>
  );
}

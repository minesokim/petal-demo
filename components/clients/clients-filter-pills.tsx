"use client";

import { cn } from "@/lib/utils";

export type BucketFilter = "all" | "pending" | "need_you" | "waiting" | "in_progress" | "done";

interface FilterOption {
  key: BucketFilter;
  label: string;
  dot?: string;
  count: number;
}

interface ClientsFilterPillsProps {
  value: BucketFilter;
  onChange: (filter: BucketFilter) => void;
  counts: Record<BucketFilter, number>;
}

const filterOptions: Omit<FilterOption, "count">[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending", dot: "bg-zinc-400" },
  { key: "need_you", label: "Need You", dot: "bg-red-500" },
  { key: "waiting", label: "Waiting", dot: "bg-amber-500" },
  { key: "in_progress", label: "In Progress", dot: "bg-blue-500" },
  { key: "done", label: "Done", dot: "bg-emerald-500" },
];

export function ClientsFilterPills({ value, onChange, counts }: ClientsFilterPillsProps) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
      {filterOptions.map((opt) => {
        const count = opt.key === "all"
          ? Object.values(counts).reduce((sum, c) => sum + c, 0) - (counts.all || 0)
          : counts[opt.key];
        const isActive = value === opt.key;

        // Hide filters with 0 clients (except "All")
        if (opt.key !== "all" && count === 0) return null;

        return (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
              isActive
                ? "bg-foreground text-background shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {opt.dot && (
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  isActive ? "bg-background/70" : opt.dot
                )}
              />
            )}
            {opt.label}
            <span
              className={cn(
                "font-mono tabular-nums text-[10px]",
                isActive ? "text-background/60" : "text-muted-foreground/60"
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

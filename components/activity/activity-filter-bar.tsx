"use client";

import { cn } from "@/lib/utils";
import type { ActivityActor } from "@/lib/mock-data";

type FilterOption = "all" | ActivityActor;

interface FilterConfig {
  value: FilterOption;
  label: string;
}

const filters: FilterConfig[] = [
  { value: "all", label: "All" },
  { value: "antonio", label: "Antonio" },
  { value: "client", label: "Client" },
  { value: "ai", label: "AI" },
  { value: "system", label: "System" },
];

interface ActivityFilterBarProps {
  active: FilterOption;
  onChange: (filter: FilterOption) => void;
  counts: Record<FilterOption, number>;
}

export function ActivityFilterBar({ active, onChange, counts }: ActivityFilterBarProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border bg-muted/30 p-1">
      {filters.map((filter) => {
        const count = counts[filter.value];
        const isActive = active === filter.value;

        return (
          <button
            key={filter.value}
            onClick={() => onChange(filter.value)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground/70"
            )}
          >
            {filter.label}
            <span
              className={cn(
                "min-w-[1.25rem] rounded-full px-1 py-0 text-center text-[9px] tabular-nums leading-tight",
                isActive
                  ? "bg-foreground/10 text-foreground/70"
                  : "text-muted-foreground/60"
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

export type { FilterOption };

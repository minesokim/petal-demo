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

/**
 * Shared pill style used by both ClientsFilterPills and PipelineFilterPills.
 *
 * Design principles (Linear / Notion / Attio):
 * - Inactive: borderless, transparent — minimal visual weight
 * - Hover: subtle bg shift
 * - Active: muted bg + thin ring (not a solid inversion) — preserves the
 *   stage dot's brand color so identity isn't lost
 * - Count: same font as label (no font-mono — looks out of place), tabular-nums
 *   for numeric alignment, slightly subdued color
 */
function PillButton({
  isActive,
  onClick,
  dot,
  label,
  count,
}: {
  isActive: boolean;
  onClick: () => void;
  dot?: string;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-[12.5px] font-medium transition-all duration-150",
        // Active pill — pops forward: white bg + soft shadow (segmented-control style)
        // Unselected — flat / recessed, blends into the muted container behind it
        isActive
          ? "bg-background text-foreground shadow-sm ring-1 ring-foreground/[0.06]"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {dot && (
        // Keep the brand dot color in BOTH states — preserves stage identity
        // even when the pill is selected. Slight size bump in active state.
        <span
          className={cn(
            "rounded-full transition-all",
            dot,
            isActive ? "size-1.5 ring-2 ring-background" : "size-1.5"
          )}
        />
      )}
      <span className="leading-none">{label}</span>
      {count > 0 && (
        <span
          className={cn(
            "tabular-nums leading-none transition-colors",
            isActive ? "text-foreground/55" : "text-muted-foreground/45"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

/**
 * Outer container — wraps the row of pills like a segmented control.
 * Muted bg makes unselected pills look recessed and the active pill
 * (background-colored + shadow) read as "raised forward."
 */
const SEGMENTED_CONTAINER =
  "inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-lg border border-border/60 bg-muted/50 p-1 scrollbar-none";

export function ClientsFilterPills({ value, onChange, counts }: ClientsFilterPillsProps) {
  return (
    <div className={SEGMENTED_CONTAINER}>
      {filterOptions.map((opt) => {
        const count = opt.key === "all"
          ? Object.values(counts).reduce((sum, c) => sum + c, 0) - (counts.all || 0)
          : counts[opt.key];

        // Hide filters with 0 clients (except "All")
        if (opt.key !== "all" && count === 0) return null;

        return (
          <PillButton
            key={opt.key}
            isActive={value === opt.key}
            onClick={() => onChange(opt.key)}
            dot={opt.dot}
            label={opt.label}
            count={opt.key === "all" ? count : count}
          />
        );
      })}
    </div>
  );
}

// ── Pipeline filter pills ──

export type PipelineFilter = "all" | "pending" | "new_intake" | "collecting_docs" | "in_preparation" | "client_review" | "pay_and_sign" | "filed";

const pipelineFilterOptions: { key: PipelineFilter; label: string; dot: string }[] = [
  { key: "all", label: "All", dot: "" },
  { key: "pending", label: "Pending Review", dot: "bg-rose-400" },
  { key: "new_intake", label: "New Intake", dot: "bg-sky-400" },
  { key: "collecting_docs", label: "Collecting Docs", dot: "bg-amber-500" },
  { key: "in_preparation", label: "In Preparation", dot: "bg-blue-500" },
  { key: "client_review", label: "Client Review", dot: "bg-purple-500" },
  { key: "pay_and_sign", label: "Pay & Sign", dot: "bg-orange-500" },
  { key: "filed", label: "Filed", dot: "bg-emerald-500" },
];

interface PipelineFilterPillsProps {
  value: PipelineFilter;
  onChange: (filter: PipelineFilter) => void;
  counts: Record<PipelineFilter, number>;
}

export function PipelineFilterPills({ value, onChange, counts }: PipelineFilterPillsProps) {
  return (
    <div className={SEGMENTED_CONTAINER}>
      {pipelineFilterOptions.map((opt) => {
        const count = opt.key === "all"
          ? Object.values(counts).reduce((sum, c) => sum + c, 0) - (counts.all || 0)
          : counts[opt.key];

        if (opt.key !== "all" && count === 0) return null;

        return (
          <PillButton
            key={opt.key}
            isActive={value === opt.key}
            onClick={() => onChange(opt.key)}
            dot={opt.dot || undefined}
            label={opt.label}
            count={count}
          />
        );
      })}
    </div>
  );
}

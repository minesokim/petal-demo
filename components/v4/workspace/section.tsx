import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * WorkspaceSection — shared "label · action" header for the four
 * overview sections (Needs attention, Return snapshot, Next steps,
 * Recent documents).
 *
 * The label gets a leading rust ● (disable via `noDot`). The action
 * slot renders on the right in small mono ink-4.
 */
export function WorkspaceSection({
  label,
  noDot,
  action,
  children,
  className
}: {
  label: string;
  noDot?: boolean;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("mb-6", className)}>
      <div className="mb-2.5 flex items-baseline justify-between">
        <div
          className={cn(
            "flex items-center gap-[7px] font-mono text-[10px] font-[550] tracking-[0.13em] text-ink-3 uppercase",
            !noDot && "before:block before:size-[5px] before:rounded-full before:bg-rust"
          )}>
          {label}
        </div>
        {action ? (
          <span className="text-[11.5px] text-ink-4 transition-colors hover:text-ink-2">
            {action}
          </span>
        ) : null}
      </div>
      {children}
    </section>
  );
}

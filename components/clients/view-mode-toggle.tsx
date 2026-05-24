"use client";

import { Table2, Columns3 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "table" | "pipeline";

interface ViewModeToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const modes: { value: ViewMode; icon: typeof Table2; label: string }[] = [
  { value: "pipeline", icon: Columns3, label: "Pipeline" },
  { value: "table", icon: Table2, label: "Table" },
];

export function ViewModeToggle({ value, onChange }: ViewModeToggleProps) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border bg-white p-0.5">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = value === mode.value;
        return (
          <button
            key={mode.value}
            onClick={() => onChange(mode.value)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label={`${mode.label} view`}
            title={mode.label}
          >
            <Icon className="size-3.5" />
            <span className="hidden sm:inline">{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
}

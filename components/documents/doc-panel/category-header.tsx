"use client";

import { cn } from "@/lib/utils";
import { ChevronRight, Briefcase, DollarSign, CreditCard, FileText, FolderOpen, ShieldCheck } from "lucide-react";

const categoryConfig: Record<string, { icon: React.ElementType; label: string }> = {
  income: { icon: DollarSign, label: "Income" },
  business: { icon: Briefcase, label: "Business" },
  deductions: { icon: CreditCard, label: "Deductions" },
  identity: { icon: ShieldCheck, label: "Identity" },
  returns: { icon: FileText, label: "Returns" },
  agreements: { icon: FolderOpen, label: "Agreements" },
};

interface CategoryHeaderProps {
  category: string;
  label?: string;
  received: number;
  total: number;
  isOpen: boolean;
  onToggle: () => void;
}

export function CategoryHeader({ category, label, received, total, isOpen, onToggle }: CategoryHeaderProps) {
  const config = categoryConfig[category] || { icon: FolderOpen, label: category };
  const Icon = config.icon;
  const displayLabel = label || config.label;
  const isComplete = received > 0 && received >= total;
  const hasItems = total > 0;

  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted/60"
    >
      <ChevronRight
        className={cn(
          "size-3.5 text-muted-foreground/60 transition-transform duration-150",
          isOpen && "rotate-90"
        )}
      />
      <Icon className="size-3.5 text-muted-foreground" />
      <span className="flex-1 font-medium text-foreground/90">{displayLabel}</span>
      {hasItems && (
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] tabular-nums text-muted-foreground">
            {received}/{total}
          </span>
          <div
            className={cn(
              "size-1.5 rounded-full",
              isComplete
                ? "bg-emerald-500"
                : received > 0
                  ? "bg-amber-500"
                  : "bg-muted-foreground/30"
            )}
          />
        </div>
      )}
    </button>
  );
}

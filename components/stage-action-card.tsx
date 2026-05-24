"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Shield, CheckCircle, FileText, Check, Clock, AlertTriangle,
} from "lucide-react";

/**
 * Shared "what to do next" card used across the client overview surfaces.
 *
 * One consistent design language for all three primary stage actions:
 *   - Sign & e-file       (stage: pay_and_sign)
 *   - Begin Preparation   (stage: ready_to_prep)
 *   - Complete Preparation (stage: in_preparation)
 *
 * The card is intentionally compact (~120-150px) so it can lead the
 * Snapshot tab and sit at the top of the compact-mode sidebar without
 * dominating other content. Icon tints communicate state at a glance:
 *
 *   pay_and_sign    → emerald (almost done, last signature)
 *   ready_to_prep   → emerald (everything checked, ready to start)
 *   in_preparation  → blue    (in progress)
 */
export type StageActionDescriptor = {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  statusItems?: { icon: React.ElementType; label: string; color: string }[];
  actionLabel: string;
  actionIcon: React.ElementType;
  actionVariant?: "default" | "outline";
  onAction: () => void;
};

interface StageActionCardProps extends StageActionDescriptor {
  className?: string;
}

export function StageActionCard({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  description,
  statusItems,
  actionLabel,
  actionIcon: ActionIcon,
  actionVariant = "default",
  onAction,
  className,
}: StageActionCardProps) {
  return (
    <div className={cn("rounded-xl border bg-card p-4 shadow-sm/0", className)}>
      <div className="flex items-start gap-3">
        <div className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg", iconBg)}>
          <Icon className={cn("size-4", iconColor)} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold leading-snug">{title}</div>
          <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</div>
          {statusItems && statusItems.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1">
              {statusItems.map((s, i) => {
                const SI = s.icon;
                return (
                  <div key={i} className={cn("flex items-center gap-1 text-[10px]", s.color)}>
                    <SI className="size-3" /> {s.label}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Button
        variant={actionVariant}
        className="mt-3 w-full h-9 gap-1.5 text-[13px]"
        onClick={onAction}
      >
        <ActionIcon className="size-3.5" /> {actionLabel}
      </Button>
    </div>
  );
}

// ─── Descriptor builders — one source of truth for each stage's CTA ───

export function getStageActionDescriptor(args: {
  stage: string;
  client: { fullName: string; documentsRequired: number; documentsSubmitted: number };
  transitioning?: boolean;
  stageOverride?: string | null;
  hasOpenFlags?: boolean;
  onSignEFile: () => void;
  onBeginPrep: () => void;
  onCompletePrep: () => void;
}): StageActionDescriptor | null {
  const { stage, client, transitioning, stageOverride, hasOpenFlags } = args;
  const firstName = client.fullName.split(" ")[0];

  if (stage === "pay_and_sign") {
    return {
      icon: Shield,
      iconBg: "bg-emerald-50 dark:bg-emerald-950/30",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      title: "8879 ready for ERO signature",
      description: "Client has paid and signed. Your countersignature is needed to file.",
      statusItems: [
        { icon: Check, label: "Paid", color: "text-emerald-600" },
        { icon: Check, label: "Client signed", color: "text-emerald-600" },
        { icon: Clock, label: "ERO pending", color: "text-amber-600" },
      ],
      actionLabel: "Sign & e-file",
      actionIcon: Shield,
      onAction: args.onSignEFile,
    };
  }

  if (stage === "ready_to_prep" && !transitioning && !stageOverride) {
    return {
      icon: CheckCircle,
      iconBg: "bg-emerald-50 dark:bg-emerald-950/30",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      title: "Ready to begin preparation",
      description: `All ${client.documentsRequired} documents received. Confirm to move ${firstName} into preparation.`,
      statusItems: [
        { icon: Check, label: `${client.documentsSubmitted}/${client.documentsRequired} docs`, color: "text-emerald-600" },
        { icon: Check, label: "Deposit paid", color: "text-emerald-600" },
        { icon: Check, label: "Engagement signed", color: "text-emerald-600" },
      ],
      actionLabel: "Begin Preparation",
      actionIcon: FileText,
      onAction: args.onBeginPrep,
    };
  }

  if (stage === "in_preparation" && !transitioning) {
    return {
      icon: FileText,
      iconBg: "bg-blue-50 dark:bg-blue-950/30",
      iconColor: "text-blue-600 dark:text-blue-400",
      title: "In preparation",
      description: `Resolve all flags, then complete preparation to send ${firstName} their return for review.`,
      statusItems: hasOpenFlags
        ? [{ icon: AlertTriangle, label: "Open flags need resolution", color: "text-amber-600" }]
        : [{ icon: Check, label: "All flags resolved", color: "text-emerald-600" }],
      actionLabel: "Complete Preparation",
      actionIcon: CheckCircle,
      onAction: args.onCompletePrep,
    };
  }

  return null;
}

"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { TrackingBadgeData } from "@/lib/mock-data"

// Soft-fill chips — solid pale background, no stroke, no inner dot.
// Severity is carried entirely by the fill color, matching the chip
// system used across the detail surfaces.
const variantStyles: Record<TrackingBadgeData["variant"], string> = {
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400",
  danger: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
  info: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
  neutral: "bg-muted text-muted-foreground",
}

interface TrackingBadgeProps {
  badge: TrackingBadgeData
  className?: string
}

export function TrackingBadge({ badge, className }: TrackingBadgeProps) {
  const badgeContent = (
    <span
      data-slot="tracking-badge"
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap",
        variantStyles[badge.variant],
        className
      )}
    >
      {badge.label}
    </span>
  )

  if (badge.tooltip) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            {badgeContent}
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {badge.tooltip}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return badgeContent
}

interface TrackingBadgeGroupProps {
  badges: TrackingBadgeData[]
  maxVisible?: number
  className?: string
}

export function TrackingBadgeGroup({ badges, maxVisible = 4, className }: TrackingBadgeGroupProps) {
  const visibleBadges = badges.slice(0, maxVisible)
  const hiddenCount = badges.length - maxVisible

  return (
    <div
      data-slot="tracking-badge-group"
      className={cn("flex flex-wrap items-center gap-1.5", className)}
    >
      {visibleBadges.map((badge) => (
        <TrackingBadge key={badge.id} badge={badge} />
      ))}
      {hiddenCount > 0 && (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground cursor-help">
                +{hiddenCount}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <div className="flex flex-col gap-1">
                {badges.slice(maxVisible).map((badge) => (
                  <span key={badge.id}>{badge.label}</span>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// Attention chip — collapses every actionable signal (priority +
// danger/warning tracking badges) into ONE summary chip with a count.
// Reassuring/info badges are intentionally excluded: a header should
// flag what needs action, not enumerate healthy status. The full list
// is revealed on hover. Fill color = the worst severity present.
// ────────────────────────────────────────────────────────────
export type AttentionItem = { label: string; severity: "danger" | "warning" }

export function buildAttentionItems(opts: {
  urgency?: string
  badges?: TrackingBadgeData[]
}): AttentionItem[] {
  const items: AttentionItem[] = []
  if (opts.urgency === "urgent") items.push({ label: "Urgent", severity: "danger" })
  else if (opts.urgency === "high") items.push({ label: "High priority", severity: "warning" })
  for (const b of opts.badges ?? []) {
    if (b.variant === "danger") items.push({ label: b.label, severity: "danger" })
    else if (b.variant === "warning") items.push({ label: b.label, severity: "warning" })
  }
  return items
}

export function AttentionChip({
  items,
  size = "sm",
  className,
}: {
  items: AttentionItem[]
  size?: "sm" | "md"
  className?: string
}) {
  if (items.length === 0) return null
  const hasDanger = items.some((i) => i.severity === "danger")
  const fill = hasDanger
    ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
    : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
  const pad = size === "md" ? "px-2.5 py-1 text-[11px]" : "px-2 py-0.5 text-[10px]"

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            data-slot="attention-chip"
            className={cn(
              "inline-flex items-center gap-1 rounded-full font-medium cursor-default whitespace-nowrap",
              pad,
              fill,
              // leading-none AFTER pad so tailwind-merge doesn't drop it
              // (the text-[size] in pad is treated as line-height-bearing).
              "leading-none",
              className
            )}
          >
            Needs attention
            <span className="tabular-nums opacity-60">· {items.length}</span>
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="start" className="max-w-[240px]">
          <div className="flex flex-col gap-1.5">
            {items.map((it, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span
                  className={cn(
                    "size-1.5 rounded-full shrink-0",
                    it.severity === "danger" ? "bg-red-500" : "bg-amber-500"
                  )}
                />
                {it.label}
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Helper function to generate tracking badges from client data
export function generateClientTrackingBadges(client: {
  lastPortalLogin: string | null
  documentsSubmitted: number
  documentsRequired: number
  depositPaid: boolean
  returnStage: string
}): TrackingBadgeData[] {
  const badges: TrackingBadgeData[] = []
  const now = new Date()

  // Portal login status
  if (!client.lastPortalLogin) {
    badges.push({
      id: "never-logged-in",
      label: "Never logged in",
      variant: "danger",
      tooltip: "Client has never accessed the portal",
    })
  } else {
    const lastLogin = new Date(client.lastPortalLogin)
    const daysSince = Math.floor((now.getTime() - lastLogin.getTime()) / 86400000)

    if (daysSince === 0) {
      badges.push({
        id: "active-today",
        label: "Active today",
        variant: "success",
        tooltip: `Last portal visit: ${lastLogin.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`,
      })
    } else if (daysSince <= 3) {
      badges.push({
        id: "recent-activity",
        label: `Active ${daysSince}d ago`,
        variant: "success",
        tooltip: `Last portal visit: ${lastLogin.toLocaleDateString()}`,
      })
    } else if (daysSince > 14) {
      badges.push({
        id: "inactive",
        label: `No login ${daysSince}d`,
        variant: "danger",
        tooltip: `Last portal visit: ${lastLogin.toLocaleDateString()}`,
      })
    } else if (daysSince > 7) {
      badges.push({
        id: "low-activity",
        label: `No login ${daysSince}d`,
        variant: "warning",
        tooltip: `Last portal visit: ${lastLogin.toLocaleDateString()}`,
      })
    }
  }

  // Document status
  if (client.documentsSubmitted >= client.documentsRequired && client.documentsRequired > 0) {
    badges.push({
      id: "all-docs",
      label: "All docs \u2713",
      variant: "success",
      tooltip: `${client.documentsSubmitted} of ${client.documentsRequired} documents received`,
    })
  } else if (client.documentsSubmitted > 0) {
    const remaining = client.documentsRequired - client.documentsSubmitted
    badges.push({
      id: "partial-docs",
      label: `${remaining} docs needed`,
      variant: "warning",
      tooltip: `${client.documentsSubmitted} of ${client.documentsRequired} documents received`,
    })
  }

  // Deposit status
  if (!client.depositPaid && client.returnStage !== "filed") {
    badges.push({
      id: "deposit-unpaid",
      label: "Deposit due",
      variant: "danger",
      tooltip: "Deposit payment has not been received",
    })
  }

  // Signature status (for pay_and_sign stage)
  if (client.returnStage === "pay_and_sign") {
    badges.push({
      id: "awaiting-signature",
      label: "Awaiting signature",
      variant: "info",
      tooltip: "8879 e-signature pending",
    })
  }

  // Filed status
  if (client.returnStage === "filed") {
    badges.push({
      id: "filed",
      label: "Filed \u2713",
      variant: "success",
      tooltip: "Return has been e-filed",
    })
  }

  return badges
}

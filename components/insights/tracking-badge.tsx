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

const variantStyles: Record<TrackingBadgeData["variant"], {
  bg: string
  text: string
  border: string
}> = {
  success: {
    bg: "bg-emerald-50 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  warning: {
    bg: "bg-amber-50 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
  },
  danger: {
    bg: "bg-red-50 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-200 dark:border-red-800",
  },
  info: {
    bg: "bg-blue-50 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
  },
  neutral: {
    bg: "bg-muted/50",
    text: "text-muted-foreground",
    border: "border-border",
  },
}

interface TrackingBadgeProps {
  badge: TrackingBadgeData
  className?: string
}

export function TrackingBadge({ badge, className }: TrackingBadgeProps) {
  const styles = variantStyles[badge.variant]

  const badgeContent = (
    <span
      data-slot="tracking-badge"
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium",
        "border whitespace-nowrap",
        styles.bg,
        styles.text,
        styles.border,
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
      className={cn("flex flex-wrap items-center gap-1", className)}
    >
      {visibleBadges.map((badge) => (
        <TrackingBadge key={badge.id} badge={badge} />
      ))}
      {hiddenCount > 0 && (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-muted text-muted-foreground border border-border cursor-help">
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

"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { MorningBriefingData, InsightAction } from "@/lib/mock-data"

interface MorningBriefingProps {
  briefing: MorningBriefingData
  preparerName?: string
  onAction?: (action: InsightAction) => void
  className?: string
}

export function MorningBriefing({
  briefing,
  preparerName = "Antonio",
  onAction,
  className,
}: MorningBriefingProps) {
  return (
    <div
      data-slot="morning-briefing"
      className={cn("space-y-4", className)}
    >
      {/* Overnight — what happened while you were away */}
      {briefing.overnight && (
        <div className="space-y-1">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Overnight
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {briefing.overnight}
          </p>
        </div>
      )}

      {/* Today — what matters right now */}
      <div className="space-y-1">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Today
        </p>
        <p className="text-sm text-foreground/90 leading-relaxed">
          {briefing.today}
        </p>
      </div>

      {/* Concern — proactive AI judgment */}
      {briefing.concern && (
        <div className="flex gap-2.5 items-start">
          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-500" />
          <p className="text-sm text-foreground/80 leading-relaxed">
            {briefing.concern}
          </p>
        </div>
      )}

      {/* Priority actions */}
      {briefing.priorityActions.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {briefing.priorityActions.map((action, index) => (
            <Button
              key={action.id}
              variant={index === 0 ? "default" : "outline"}
              size="sm"
              onClick={() => onAction?.(action)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}

// Compact briefing card for smaller spaces
interface CompactBriefingProps {
  headline: string
  stats: {
    label: string
    value: string | number
    trend?: "up" | "down" | "neutral"
  }[]
  onExpand?: () => void
  className?: string
}

export function CompactBriefingCard({ headline, stats, onExpand, className }: CompactBriefingProps) {
  return (
    <button
      type="button"
      onClick={onExpand}
      className={cn(
        "w-full text-left p-4 rounded-lg border bg-card",
        "hover:bg-muted/30 transition-colors",
        className
      )}
    >
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
        Today's Briefing
      </p>
      <p className="text-sm text-foreground/80 line-clamp-2 mb-3">
        {headline}
      </p>
      <div className="flex items-center gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="flex items-baseline gap-1">
            <span className="text-lg font-semibold tabular-nums text-foreground">
              {stat.value}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </button>
  )
}

// SeasonProgress kept for backward compatibility but simplified
interface SeasonProgressProps {
  daysToDeadline: number
  filedCount: number
  totalClients: number
  lastYearPace?: number
  className?: string
}

export function SeasonProgress({
  daysToDeadline,
  filedCount,
  totalClients,
  lastYearPace,
  className,
}: SeasonProgressProps) {
  const isAheadOfPace = lastYearPace !== undefined && filedCount > lastYearPace

  return (
    <div
      data-slot="season-progress"
      className={cn("p-4 rounded-lg border bg-card", className)}
    >
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          <span className="tabular-nums">{filedCount}</span>/{totalClients} filed
        </span>
        <span className={cn(
          "text-xs",
          daysToDeadline <= 7 ? "text-red-600" :
          daysToDeadline <= 21 ? "text-amber-600" :
          "text-muted-foreground"
        )}>
          {daysToDeadline} days left
        </span>
      </div>
    </div>
  )
}

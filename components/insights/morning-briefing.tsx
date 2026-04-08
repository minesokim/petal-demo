"use client"

import * as React from "react"
import { motion } from "motion/react"
import { Sparkles, Calendar, TrendingUp, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { MorningBriefingData, InsightAction } from "@/lib/mock-data"

function formatBriefingDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
}

function formatBriefingTime(): string {
  return new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      data-slot="morning-briefing"
      className={cn(
        "relative overflow-hidden rounded-xl border",
        "bg-gradient-to-br from-primary/5 via-primary/3 to-transparent",
        "border-primary/20",
        className
      )}
    >
      {/* Decorative gradient orb */}
      <div className="absolute -top-20 -right-20 size-40 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10">
              <Sparkles className="size-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Docket Morning Briefing
              </h2>
              <p className="text-[10px] text-muted-foreground">
                {formatBriefingDate(briefing.date)} · {formatBriefingTime()}
              </p>
            </div>
          </div>
        </div>

        {/* Greeting and content */}
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-foreground/90">
            <span className="font-medium">{briefing.greeting}, {preparerName}.</span>{" "}
            <span className="text-foreground/80">
              <strong className="font-medium text-foreground/90">Overnight:</strong>{" "}
              {briefing.overnight}
            </span>
          </p>

          <p className="text-sm leading-relaxed text-foreground/80">
            <strong className="font-medium text-foreground/90">Today:</strong>{" "}
            {briefing.today}
          </p>

          {briefing.concern && (
            <p className="text-sm leading-relaxed">
              <span className="inline-flex items-center gap-1 font-medium text-amber-700 dark:text-amber-400">
                <AlertTriangle className="size-3" />
                Concern:
              </span>{" "}
              <span className="text-foreground/80">{briefing.concern}</span>
            </p>
          )}

          <p className="text-sm leading-relaxed text-foreground/80">
            <strong className="font-medium text-foreground/90">Pacing:</strong>{" "}
            {briefing.pacing}
          </p>
        </div>

        {/* Priority actions */}
        {briefing.priorityActions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/40">
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
    </motion.div>
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
        "w-full text-left p-4 rounded-lg border",
        "bg-gradient-to-r from-primary/5 to-transparent",
        "border-primary/20 hover:border-primary/30 transition-colors",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="size-4 text-primary" />
        <span className="text-xs font-medium text-primary uppercase tracking-wide">
          Today's Briefing
        </span>
      </div>
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

// Season progress indicator
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
  const percentComplete = Math.round((filedCount / totalClients) * 100)
  const isAheadOfPace = lastYearPace !== undefined && filedCount > lastYearPace

  return (
    <div
      data-slot="season-progress"
      className={cn("p-4 rounded-lg border bg-card", className)}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Season Progress</span>
        </div>
        <span className={cn(
          "text-xs font-medium px-2 py-0.5 rounded-full",
          daysToDeadline <= 7
            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            : daysToDeadline <= 21
              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
              : "bg-muted text-muted-foreground"
        )}>
          {daysToDeadline} days to deadline
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-muted rounded-full overflow-hidden mb-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentComplete}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="absolute inset-y-0 left-0 bg-primary rounded-full"
        />
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          <span className="font-semibold text-foreground">{filedCount}</span> of {totalClients} filed
        </span>
        {lastYearPace !== undefined && (
          <span className={cn(
            "flex items-center gap-1",
            isAheadOfPace ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
          )}>
            <TrendingUp className={cn("size-3", !isAheadOfPace && "rotate-180")} />
            {isAheadOfPace ? "Ahead" : "Behind"} vs last year ({lastYearPace})
          </span>
        )}
      </div>
    </div>
  )
}

"use client"

import { cn } from "@/lib/utils"
import type { InsightSeverity } from "@/lib/mock-data"

const severityStyles: Record<InsightSeverity, {
  dot: string
  text: string
}> = {
  insight: {
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  concern: {
    dot: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-400",
  },
  alert: {
    dot: "bg-red-500",
    text: "text-red-700 dark:text-red-400",
  },
}

interface InlineInsightProps {
  title: string
  severity: InsightSeverity
  className?: string
}

export function InlineInsight({ title, severity, className }: InlineInsightProps) {
  const styles = severityStyles[severity]

  return (
    <div className={cn("flex items-start gap-2", className)}>
      <span
        className={cn(
          "size-1.5 rounded-full shrink-0 mt-1.5",
          styles.dot
        )}
      />
      <p className={cn(
        "text-xs leading-relaxed line-clamp-2",
        styles.text
      )}>
        {title}
      </p>
    </div>
  )
}

// Variant for table cells - more compact
interface CompactInsightIndicatorProps {
  title: string
  severity: InsightSeverity
  className?: string
}

export function CompactInsightIndicator({ title, severity, className }: CompactInsightIndicatorProps) {
  const styles = severityStyles[severity]

  return (
    <div
      className={cn("flex items-center gap-1.5 group cursor-default", className)}
      title={title}
    >
      <span className={cn("size-2 rounded-full shrink-0", styles.dot)} />
      <span className={cn(
        "text-[11px] truncate max-w-[180px]",
        "text-muted-foreground group-hover:text-foreground transition-colors"
      )}>
        {title}
      </span>
    </div>
  )
}

// Just the dot for pipeline cards
interface InsightDotProps {
  severity: InsightSeverity
  title?: string
  className?: string
}

export function InsightDot({ severity, title, className }: InsightDotProps) {
  const styles = severityStyles[severity]

  return (
    <span
      className={cn("size-2 rounded-full shrink-0", styles.dot, className)}
      title={title}
    />
  )
}

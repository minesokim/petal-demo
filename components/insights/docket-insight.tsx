"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { ChevronDown, Sparkles, AlertTriangle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { DocketInsight, InsightSeverity, InsightAction } from "@/lib/mock-data"
import { DraftMessageCard } from "./draft-message"
import { ActivityTimeline } from "./activity-timeline"

const severityConfig: Record<InsightSeverity, {
  label: string
  icon: React.ElementType
  borderClass: string
  bgClass: string
  iconClass: string
  labelClass: string
}> = {
  insight: {
    label: "Docket Insight",
    icon: Sparkles,
    borderClass: "border-l-emerald-400",
    bgClass: "bg-emerald-50/50 dark:bg-emerald-950/20",
    iconClass: "text-emerald-600 dark:text-emerald-400",
    labelClass: "text-emerald-700 dark:text-emerald-400",
  },
  concern: {
    label: "Docket Concern",
    icon: AlertTriangle,
    borderClass: "border-l-amber-400",
    bgClass: "bg-amber-50/50 dark:bg-amber-950/20",
    iconClass: "text-amber-600 dark:text-amber-400",
    labelClass: "text-amber-700 dark:text-amber-400",
  },
  alert: {
    label: "Docket Alert",
    icon: AlertCircle,
    borderClass: "border-l-red-400",
    bgClass: "bg-red-50/50 dark:bg-red-950/20",
    iconClass: "text-red-600 dark:text-red-400",
    labelClass: "text-red-700 dark:text-red-400",
  },
}

function formatRelativeTime(timestamp: string): string {
  const now = new Date()
  const date = new Date(timestamp)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

interface InsightActionButtonProps {
  action: InsightAction
  onAction?: (action: InsightAction) => void
}

function InsightActionButton({ action, onAction }: InsightActionButtonProps) {
  return (
    <Button
      variant={action.variant === "primary" ? "default" : action.variant === "secondary" ? "outline" : "ghost"}
      size="xs"
      onClick={() => onAction?.(action)}
      className={cn(
        action.variant === "primary" && "bg-primary hover:bg-primary/90"
      )}
    >
      {action.label}
    </Button>
  )
}

interface DocketInsightProps {
  insight: DocketInsight
  defaultExpanded?: boolean
  onAction?: (action: InsightAction) => void
  onSendMessage?: (messageId: string, channel: string) => void
  onEditMessage?: (messageId: string) => void
  className?: string
}

export function DocketInsightCard({
  insight,
  defaultExpanded = true,
  onAction,
  onSendMessage,
  onEditMessage,
  className,
}: DocketInsightProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded)
  const [showTimeline, setShowTimeline] = React.useState(false)

  const config = severityConfig[insight.severity]
  const Icon = config.icon

  return (
    <div
      data-slot="docket-insight"
      data-severity={insight.severity}
      className={cn(
        "border-l-2 rounded-r-lg transition-all duration-200",
        config.borderClass,
        config.bgClass,
        className
      )}
    >
      {/* Header - Always visible */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <Icon className={cn("size-3.5", config.iconClass)} />
          <span className={cn(
            "text-[10px] font-semibold uppercase tracking-wide",
            config.labelClass
          )}>
            {config.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">
            {formatRelativeTime(insight.timestamp)}
          </span>
          <ChevronDown
            className={cn(
              "size-3.5 text-muted-foreground transition-transform duration-200",
              isExpanded && "rotate-180"
            )}
          />
        </div>
      </button>

      {/* Expandable content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-3">
              {/* AI Commentary */}
              <p className="text-sm text-foreground/90 leading-relaxed">
                {insight.content}
              </p>

              {/* Action buttons */}
              {insight.actions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {insight.actions.map((action) => (
                    <InsightActionButton
                      key={action.id}
                      action={action}
                      onAction={onAction}
                    />
                  ))}
                </div>
              )}

              {/* Draft message */}
              {insight.draftMessage && (
                <DraftMessageCard
                  draft={insight.draftMessage}
                  onSend={(channel) => onSendMessage?.(insight.draftMessage!.id, channel)}
                  onEdit={() => onEditMessage?.(insight.draftMessage!.id)}
                />
              )}

              {/* Activity timeline toggle */}
              {insight.activityTrail && insight.activityTrail.length > 0 && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowTimeline(!showTimeline)}
                    className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronDown
                      className={cn(
                        "size-3 transition-transform duration-150",
                        showTimeline ? "rotate-180" : "-rotate-90"
                      )}
                    />
                    Activity trail · {insight.activityTrail.length} events
                  </button>

                  <AnimatePresence>
                    {showTimeline && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <ActivityTimeline
                          events={insight.activityTrail}
                          className="mt-2"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Compact variant for client cards - shows minimal info until expanded
interface CompactInsightProps {
  insight: DocketInsight
  onExpand?: () => void
  className?: string
}

export function CompactInsight({ insight, onExpand, className }: CompactInsightProps) {
  const config = severityConfig[insight.severity]
  const Icon = config.icon

  return (
    <button
      type="button"
      onClick={onExpand}
      className={cn(
        "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left transition-colors",
        "border-l-2",
        config.borderClass,
        config.bgClass,
        "hover:bg-black/[0.03] dark:hover:bg-white/[0.03]",
        className
      )}
    >
      <Icon className={cn("size-3.5 shrink-0", config.iconClass)} />
      <span className="text-xs text-foreground/80 line-clamp-1 flex-1">
        {insight.title || insight.content.slice(0, 60) + "..."}
      </span>
      <ChevronDown className="size-3 text-muted-foreground shrink-0" />
    </button>
  )
}

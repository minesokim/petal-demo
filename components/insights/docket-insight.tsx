"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import * as RechartsPrimitive from "recharts"
import type { DocketInsight, InsightSeverity, InsightAction, InsightSupplementary } from "@/lib/mock-data"
import { DraftMessageCard } from "./draft-message"
import { ActivityTimeline } from "./activity-timeline"

const severityDot: Record<InsightSeverity, string> = {
  insight: "bg-emerald-500",
  concern: "bg-amber-500",
  alert: "bg-red-500",
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

// ── Supplementary renderers (using stats-cards-with-links pattern) ──

function SupplementaryCards({ items, onFlag }: { items: InsightSupplementary[]; onFlag?: (label: string, detail: string) => void }) {
  if (!items.length) return null

  // Split into visual types
  const trends = items.filter(s => s.type === "trend")
  const extensions = items.filter(s => s.type === "extension")
  const cards = items.filter(s => s.type === "kpi" || s.type === "highlight")
  const stats = items.filter(s => s.type === "stat" || s.type === "note")
  const quarterly = items.filter(s => s.type === "quarterly")
  const comparisons = items.filter(s => s.type === "comparison")

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.25 }}
      className="space-y-3"
    >
      {/* Trend sparklines — Stats-4 pattern */}
      {trends.map((item) => {
        if (!item.trendData) return null
        const isDown = (item.changeValue || 0) < 0
        const color = isDown ? "hsl(0 72.2% 50.6%)" : "hsl(142.1 76.2% 36.3%)"
        const gradientId = `trend-${item.label.replace(/\s+/g, "-").toLowerCase()}`

        return (
          <div key={item.label} className="rounded-xl border bg-card p-4 pb-0">
            <div>
              <dt className="text-sm font-medium text-foreground">
                {item.label}
              </dt>
              <div className="flex items-baseline justify-between">
                <dd className={cn(isDown ? "text-red-600 dark:text-red-500" : "text-green-600 dark:text-green-500", "text-lg font-semibold")}>
                  {item.value}
                </dd>
                <dd className="flex items-center space-x-1 text-sm">
                  <span className={cn(isDown ? "text-red-600 dark:text-red-500" : "text-green-600 dark:text-green-500")}>
                    ({isDown ? "" : "+"}{item.changeValue}%)
                  </span>
                </dd>
              </div>
            </div>
            <div className="mt-2 h-16 overflow-hidden">
              <RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
                <RechartsPrimitive.AreaChart data={item.trendData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <RechartsPrimitive.XAxis dataKey="label" hide={true} />
                  <RechartsPrimitive.Area
                    dataKey="value"
                    stroke={color}
                    fill={`url(#${gradientId})`}
                    fillOpacity={0.4}
                    strokeWidth={1.5}
                    type="monotone"
                  />
                </RechartsPrimitive.AreaChart>
              </RechartsPrimitive.ResponsiveContainer>
            </div>
          </div>
        )
      })}

      {/* Extension likelihood — progress bar + factors */}
      {extensions.map((item) => (
        <div key={item.label} className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">{item.label}</span>
            </div>
            <span className="font-display text-2xl tabular-nums tracking-tight text-foreground">{item.probability}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", (item.probability || 0) >= 80 ? "bg-red-500" : "bg-amber-500")}
              style={{ width: `${item.probability || 0}%` }}
            />
          </div>
          {item.factors && item.factors.length > 0 && (
            <div className="mt-3 space-y-1">
              {item.factors.map((f, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground" /> {f}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* KPI / Highlight cards — stats-cards-with-links pattern */}
      {cards.length > 0 && (
        <div className={cn("grid gap-3", cards.length === 1 ? "grid-cols-1" : "grid-cols-2")}>
          {cards.map((item) => {
            const valueColorMap: Record<string, string> = {
              emerald: "text-emerald-600 dark:text-emerald-500",
              blue: "text-blue-600 dark:text-blue-500",
              amber: "text-amber-600 dark:text-amber-500",
              red: "text-red-600 dark:text-red-500",
            }
            const valueColor = valueColorMap[item.highlightColor || "blue"] || "text-foreground"
            const changeColor = (item.changeValue || 0) > 0
              ? "text-emerald-700 dark:text-emerald-500"
              : (item.changeValue || 0) < 0
              ? "text-red-700 dark:text-red-500"
              : ""

            return (
              <div key={item.label} className="rounded-xl border bg-card text-card-foreground shadow-sm p-5">
                <dd className="flex items-start justify-between space-x-2">
                  <span className="truncate text-sm text-muted-foreground">{item.label}</span>
                  {item.changeValue != null && (
                    <span className={cn("text-sm font-medium", changeColor)}>
                      {item.changeValue > 0 ? "+" : ""}{item.changeValue}%
                    </span>
                  )}
                </dd>
                <dd className={cn("mt-1 text-2xl font-display font-semibold tabular-nums", valueColor)}>
                  {item.value}
                </dd>
                {item.detail && (
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{item.detail}</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Comparison — colored prior/current display */}
      {comparisons.length > 0 && comparisons.map((item) => {
        const isDown = (item.changePercent || 0) < 0
        const currentColor = isDown ? "text-red-500 dark:text-red-400" : "text-emerald-600 dark:text-emerald-500"
        return (
          <div key={item.label} className="rounded-xl border bg-card p-4">
            <div className="flex items-start justify-between mb-3">
              <span className="text-sm font-medium text-foreground">{item.label}</span>
              <span className={cn("text-sm font-semibold", currentColor)}>
                {(item.changePercent || 0) > 0 ? "+" : ""}{item.changePercent}%
              </span>
            </div>
            <div className="flex items-baseline gap-6">
              <div>
                <span className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground block mb-1">{item.priorLabel}</span>
                <span className="text-xl font-semibold text-foreground/40 tabular-nums">${((item.priorValue || 0) / 1000).toFixed(0)}K</span>
              </div>
              <div className="text-muted-foreground/30">→</div>
              <div>
                <span className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground block mb-1">{item.currentLabel}</span>
                <span className={cn("text-2xl font-bold tabular-nums", currentColor)}>${((item.currentValue || 0) / 1000).toFixed(0)}K</span>
              </div>
            </div>
            {onFlag && (
              <div className="mt-3 pt-3 border-t border-border/20">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground px-2 -ml-2"
                  onClick={() => onFlag(item.label, `${item.changePercent}% change: ${item.priorLabel} $${((item.priorValue || 0) / 1000).toFixed(0)}K → ${item.currentLabel} $${((item.currentValue || 0) / 1000).toFixed(0)}K`)}
                >
                  Flag for review
                </Button>
              </div>
            )}
          </div>
        )
      })}

      {/* Stat rows — clean label/value pairs */}
      {stats.length > 0 && (
        <div className="rounded-xl border bg-card divide-y divide-border">
          {stats.map((item) => (
            <div key={item.label} className="flex items-start justify-between px-4 py-3">
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <div className="text-right">
                <span className="text-sm font-semibold text-foreground tabular-nums">{item.value}</span>
                {item.detail && (
                  <p className="text-xs text-muted-foreground mt-0.5 max-w-[220px] leading-relaxed">{item.detail}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quarterly — stats-cards-with-links pattern */}
      {quarterly.map(item => (
        <div key={item.label} className="rounded-xl border bg-card text-card-foreground shadow-sm p-5">
          <dd className="flex items-start justify-between space-x-2">
            <span className="text-sm text-muted-foreground">{item.label}</span>
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-500">{item.value}</span>
          </dd>
          {item.quarterlyAmounts && (
            <div className="mt-3 flex items-baseline gap-7">
              {(["q1", "q2", "q3", "q4"] as const).map(q => (
                <div key={q}>
                  <span className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground block mb-1">{q}</span>
                  <span className="text-[15px] font-display font-semibold text-foreground tabular-nums">${item.quarterlyAmounts![q].toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
          {item.detail && (
            <p className="mt-3 text-xs text-muted-foreground leading-relaxed">{item.detail}</p>
          )}
        </div>
      ))}
    </motion.div>
  )
}

// ── Main component ──

interface DocketInsightProps {
  insight: DocketInsight
  defaultExpanded?: boolean
  onAction?: (action: InsightAction) => void
  onSendMessage?: (messageId: string, channel: string) => void
  onEditMessage?: (messageId: string) => void
  onFlag?: (title: string, description: string) => void
  className?: string
}

export function DocketInsightCard({
  insight,
  defaultExpanded = true,
  onAction,
  onSendMessage,
  onEditMessage,
  onFlag,
  className,
}: DocketInsightProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded)
  const [showTimeline, setShowTimeline] = React.useState(false)

  const dot = severityDot[insight.severity]

  // Button logic: primary action + always Ask Docket
  const primaryAction = insight.actions.find(a => a.variant === "primary")
  const hasDocketAction = insight.actions.some(a => a.action === "ask_docket")
  const docketAction: InsightAction = hasDocketAction
    ? insight.actions.find(a => a.action === "ask_docket")!
    : { id: "ask-docket-auto", label: "Ask Docket", variant: "secondary", action: "ask_docket" }

  const hasSupplementary = (insight.supplementary?.length || 0) > 0

  return (
    <motion.div
      data-slot="docket-insight"
      data-severity={insight.severity}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn(
        "rounded-[20px_20px_20px_6px] bg-card border border-border/40 shadow-sm",
        className
      )}
    >
      {/* Timestamp */}
      <div className="px-7 pt-5 pb-0">
        <span className="text-[10px] uppercase tracking-[0.12em] text-foreground/30">
          {formatRelativeTime(insight.timestamp)}
        </span>
      </div>

      {/* Title */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left px-7 pt-3 pb-4 flex items-center gap-2.5 group/title"
      >
        <span className={cn("size-[7px] rounded-full shrink-0", dot)} />
        <span className="flex-1 text-[17px] font-semibold text-foreground group-hover/title:text-foreground/70 transition-colors font-display leading-snug">
          {insight.title}
        </span>
        <svg
          width={10} height={10} viewBox="0 0 10 10"
          className={cn(
            "shrink-0 text-muted-foreground/30 transition-all duration-200 group-hover/title:text-muted-foreground/60",
            isExpanded && "rotate-90"
          )}
        >
          <path d="M3 1.5L7 5L3 8.5" stroke="currentColor" fill="none" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      </button>

      {/* Expandable body */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="px-7 pb-7">
              {/* Narrative */}
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="text-[14px] leading-[1.8] text-foreground/75"
              >
                {insight.content}
              </motion.p>

              {/* Supplementary data */}
              {hasSupplementary && (
                <div className="mt-5">
                  <SupplementaryCards items={insight.supplementary!} onFlag={onFlag} />
                </div>
              )}

              {/* Draft message */}
              {insight.draftMessage && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  className="mt-5"
                >
                  <DraftMessageCard
                    draft={insight.draftMessage}
                    onSend={(channel) => onSendMessage?.(insight.draftMessage!.id, channel)}
                    onEdit={() => onEditMessage?.(insight.draftMessage!.id)}
                  />
                </motion.div>
              )}

              {/* Action buttons */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="mt-5 flex items-center gap-3"
              >
                {primaryAction && !insight.draftMessage && (
                  <Button
                    size="sm"
                    className="h-8 text-xs px-4"
                    onClick={() => onAction?.(primaryAction)}
                  >
                    {primaryAction.label}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs px-4 gap-1.5"
                  onClick={() => onAction?.(docketAction)}
                >
                  Ask Docket
                  <svg width={10} height={10} viewBox="0 0 12 12" className="text-muted-foreground">
                    <path d="M3.5 2L8.5 2L8.5 7" stroke="currentColor" fill="none" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M8.5 2L3 7.5" stroke="currentColor" fill="none" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                </Button>
              </motion.div>

              {/* Activity timeline */}
              {insight.activityTrail && insight.activityTrail.length > 0 && (
                <div className="mt-5 pt-3 border-t border-border/20">
                  <button
                    type="button"
                    onClick={() => setShowTimeline(!showTimeline)}
                    className="flex items-center gap-1.5 text-[10px] text-foreground/40 hover:text-foreground/60 transition-colors"
                  >
                    <svg
                      width={8} height={8} viewBox="0 0 10 10"
                      className={cn("transition-transform duration-150", showTimeline && "rotate-90")}
                    >
                      <path d="M3 1.5L7 5L3 8.5" stroke="currentColor" fill="none" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
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
                        <ActivityTimeline events={insight.activityTrail} className="mt-2" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Compact variant for client cards
interface CompactInsightProps {
  insight: DocketInsight
  onExpand?: () => void
  className?: string
}

export function CompactInsight({ insight, onExpand, className }: CompactInsightProps) {
  const dot = severityDot[insight.severity]
  return (
    <button
      type="button"
      onClick={onExpand}
      className={cn(
        "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left transition-colors hover:bg-muted/30",
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full shrink-0", dot)} />
      <span className="text-xs text-foreground/80 line-clamp-1 flex-1">
        {insight.title || insight.content.slice(0, 60) + "..."}
      </span>
      <svg width={8} height={8} viewBox="0 0 10 10" className="shrink-0 text-muted-foreground/30">
        <path d="M3 1.5L7 5L3 8.5" stroke="currentColor" fill="none" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    </button>
  )
}

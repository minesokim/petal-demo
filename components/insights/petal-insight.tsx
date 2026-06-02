"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronRight, Flag } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { PetalMark } from "@/components/petal-mark"
import * as RechartsPrimitive from "recharts"
import type { PetalInsight, InsightSeverity, InsightAction, InsightSupplementary } from "@/lib/mock-data"
import { clients } from "@/lib/mock-data"
import { DraftMessageCard } from "./draft-message"
import { ActivityTimeline } from "./activity-timeline"

const severityDot: Record<InsightSeverity, string> = {
  insight: "bg-emerald-500",
  concern: "bg-amber-500",
  alert: "bg-red-500",
}

// Escape user-supplied strings before embedding them in a RegExp.
function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Auto-highlights key tokens in AI-generated prose (dollar amounts, percentages,
// form names, dates, tax acronyms, client/business names) plus markdown-style
// **bold** segments so the insight source can also opt-in proper nouns.
function highlightInsightText(text: string, opts?: { client?: { fullName: string; businessName?: string } }): React.ReactNode[] {
  const patterns: RegExp[] = [
    /\*\*[^*]+\*\*/g,                                                                 // markdown bold
    /\$[\d,]+(?:\.\d+)?[KM]?/g,                                                       // $238,000 / $14K
    /\d+(?:\.\d+)?%/g,                                                                // 40%
    /\b(?:\d{4}-[A-Z][A-Z0-9]*|W-\d+|Form\s+\d+[A-Z]?|Schedule\s+[A-Z]|Section\s+\d+(?:[a-zA-Z])?)\b/g,
    /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)(?:[a-z]+)?\s+\d{1,2}(?:,?\s+\d{4})?/g,
    /\b\d+\s+(?:days?|weeks?|months?|years?)(?:\s+ago)?\b/g,
    /\b\d{1,2}:\d{2}\s*(?:AM|PM)\b/g,
    /\b(?:EITC|CTC|AOTC|HOH|MFJ|MFS|QBI|ERO|EA|PTIN|IRS|SSN|ITIN|NEC|MISC|TIN)\b/g,
    /\b[A-Z][A-Za-z&]+(?:\s+[A-Z][A-Za-z&.]+)*\s+(?:LLC|Inc\.?|Corp\.?|Co\.?|Ltd\.?|Group|Holdings)\b/g, // business entities
  ];

  // Add client name + business name patterns dynamically.
  if (opts?.client) {
    const fullName = opts.client.fullName;
    const firstName = fullName.split(" ")[0];
    if (fullName) patterns.unshift(new RegExp(`\\b${escapeRegex(fullName)}\\b`, "g"));
    if (firstName && firstName !== fullName) patterns.push(new RegExp(`\\b${escapeRegex(firstName)}\\b`, "g"));
    if (opts.client.businessName) patterns.unshift(new RegExp(`\\b${escapeRegex(opts.client.businessName)}\\b`, "g"));
  }

  type Match = { start: number; end: number; text: string };
  const matches: Match[] = [];
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(text)) !== null) {
      const isMarkdown = m[0].startsWith("**");
      matches.push({
        start: m.index,
        end: m.index + m[0].length,
        text: isMarkdown ? m[0].slice(2, -2) : m[0],
      });
    }
  }

  // Sort by position; when two matches tie on start, prefer the longer one
  // so "Marcus Chen" wins over "Marcus".
  matches.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
  const filtered: Match[] = [];
  let lastEnd = 0;
  for (const m of matches) {
    if (m.start >= lastEnd) {
      filtered.push(m);
      lastEnd = m.end;
    }
  }

  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  filtered.forEach((m, i) => {
    if (m.start > cursor) nodes.push(<React.Fragment key={`t-${i}`}>{text.slice(cursor, m.start)}</React.Fragment>);
    nodes.push(
      <span key={`h-${i}`} className="rounded bg-muted px-1 py-px font-medium text-foreground">
        {m.text}
      </span>
    );
    cursor = m.end;
  });
  if (cursor < text.length) nodes.push(<React.Fragment key="t-tail">{text.slice(cursor)}</React.Fragment>);
  return nodes;
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

function SupplementaryCards({ items, onFlag, clientId }: { items: InsightSupplementary[]; onFlag?: (label: string, detail: string) => void; clientId?: string }) {
  if (!items.length) return null
  const client = clientId ? clients.find(c => c.id === clientId) : undefined

  // Split into visual types
  const trends = items.filter(s => s.type === "trend")
  const extensions = items.filter(s => s.type === "extension")
  const barCharts = items.filter(s => s.type === "barChart")
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
          <div key={item.label} className="rounded-lg border border-border/60 bg-card p-3 pb-0">
            <div>
              <dt className="text-xs font-medium text-muted-foreground">
                {item.label}
              </dt>
              <div className="flex items-baseline justify-between">
                <dd className={cn(isDown ? "text-red-600 dark:text-red-500" : "text-green-600 dark:text-green-500", "text-base font-semibold tabular-nums")}>
                  {item.value}
                </dd>
                <dd className="flex items-center space-x-1 text-[11px]">
                  <span className={cn(isDown ? "text-red-600 dark:text-red-500" : "text-green-600 dark:text-green-500")}>
                    ({isDown ? "" : "+"}{item.changeValue}%)
                  </span>
                </dd>
              </div>
            </div>
            <div className="mt-2 h-12 overflow-hidden">
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
        <div key={item.label} className="rounded-lg border border-border/60 bg-card p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
            <span className="text-base font-semibold tabular-nums text-foreground">{item.probability}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full transition-all", (item.probability || 0) >= 80 ? "bg-red-500" : "bg-amber-500")}
              style={{ width: `${item.probability || 0}%` }}
            />
          </div>
          {item.factors && item.factors.length > 0 && (
            <div className="mt-2.5 space-y-1">
              {item.factors.map((f, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/60" /> {f}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Bar charts — compact inline using our design language */}
      {barCharts.map((item) => {
        if (!item.barChartData) return null
        const isUp = (item.barChangeValue || 0) > 0
        const changeColor = isUp ? "text-emerald-600 dark:text-emerald-500" : "text-red-600 dark:text-red-500"
        const maxVal = Math.max(...item.barChartData.flatMap(d => [d.currentValue, d.previousValue]))

        return (
          <div key={item.label} className="rounded-lg border border-border/60 bg-card p-3.5">
            <dd className="flex items-start justify-between space-x-2">
              <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
              <span className={cn("text-[11px] font-medium", changeColor)}>
                {isUp ? "+" : ""}{item.barChangeValue}% {item.barChangeDescription}
              </span>
            </dd>
            <dd className="mt-1 text-lg font-semibold text-foreground tabular-nums">
              {item.value}
            </dd>
            <div className="mt-3 flex items-end gap-2 h-12">
              {item.barChartData.map((point) => {
                const curH = maxVal > 0 ? (point.currentValue / maxVal) * 100 : 0
                const prevH = maxVal > 0 ? (point.previousValue / maxVal) * 100 : 0
                return (
                  <div key={point.label} className="flex-1 flex flex-col items-center gap-1">
                    <div className="flex items-end gap-0.5 w-full h-12">
                      <div className={cn("flex-1 rounded-sm transition-all", item.barPrimaryColor || "bg-primary")} style={{ height: `${curH}%` }} />
                      <div className={cn("flex-1 rounded-sm transition-all", item.barSecondaryColor || "bg-muted")} style={{ height: `${prevH}%` }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{point.label}</span>
                  </div>
                )
              })}
            </div>
            <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1"><span className={cn("size-2 rounded-sm", item.barPrimaryColor || "bg-primary")} /> 2025</div>
              <div className="flex items-center gap-1"><span className={cn("size-2 rounded-sm", item.barSecondaryColor || "bg-muted")} /> 2024</div>
            </div>
          </div>
        )
      })}

      {/* KPI / Highlight cards — stats-cards-with-links pattern */}
      {cards.length > 0 && (
        <div className={cn("grid gap-3 grid-cols-1", cards.length > 1 && "md:grid-cols-2")}>
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

            // Detect "X of Y" pattern → render the same Documents tracker UI used in the Snapshot tab.
            // When clientId is provided, override the mock counts with live client data so the AI
            // insight and the right-sidebar tracker can never drift.
            const docMatch = typeof item.value === "string" && /^(\d+)\s*of\s*(\d+)/i.exec(item.value)
            if (docMatch) {
              const submitted = client ? client.documentsSubmitted : parseInt(docMatch[1], 10)
              const required = client ? client.documentsRequired : parseInt(docMatch[2], 10)
              const percent = required > 0 ? Math.round((submitted / required) * 100) : 0
              const barColor = percent >= 100 ? "bg-emerald-500" : percent >= 50 ? "bg-foreground/70" : "bg-amber-500"
              return (
                <div key={item.label} className="rounded-lg border border-border/60 bg-card p-3.5">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-foreground">{item.label}</div>
                    {clientId && (
                      <Link
                        href={`/dashboard/clients/${clientId}/documents`}
                        className="inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                      >
                        View checklist <ChevronRight className="size-3" />
                      </Link>
                    )}
                  </div>
                  <div className="mt-2.5 flex items-baseline justify-between">
                    <span className="text-sm">
                      <span className="text-xl tabular-nums">{submitted}</span>
                      <span className="text-muted-foreground"> of {required} received</span>
                    </span>
                    <span className="text-xs tabular-nums text-muted-foreground">{percent}%</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className={cn("h-full transition-all", barColor)} style={{ width: `${percent}%` }} />
                  </div>
                  {item.detail && (
                    <p className="mt-3 border-t border-border/40 pt-2.5 text-[11px] leading-relaxed text-muted-foreground">
                      {item.detail}
                    </p>
                  )}
                </div>
              )
            }

            return (
              <div key={item.label} className="rounded-lg border border-border/60 bg-card p-3">
                <dd className="flex items-start justify-between gap-2">
                  <span className="truncate text-xs font-medium text-muted-foreground">{item.label}</span>
                  {item.changeValue != null && (
                    <span className={cn("text-[11px] font-medium", changeColor)}>
                      {item.changeValue > 0 ? "+" : ""}{item.changeValue}%
                    </span>
                  )}
                </dd>
                <dd className={cn("mt-0.5 text-base font-semibold tabular-nums", valueColor)}>
                  {item.value}
                </dd>
                {item.detail && (
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{item.detail}</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Comparison — colored prior/current display */}
      {comparisons.length > 0 && comparisons.map((item) => (
        <ComparisonCard key={item.label} item={item} onFlag={onFlag} />
      ))}

      {/* Stat rows — clean label/value pairs */}
      {stats.length > 0 && (
        <div className="divide-y divide-border/60 rounded-lg border border-border/60 bg-card">
          {stats.map((item) => (
            <div key={item.label} className="flex items-start justify-between px-3 py-2.5">
              <span className="text-xs text-muted-foreground">{item.label}</span>
              <div className="text-right">
                <span className="text-xs font-semibold text-foreground tabular-nums">{item.value}</span>
                {item.detail && (
                  <p className="mt-0.5 max-w-[220px] text-[11px] leading-relaxed text-muted-foreground">{item.detail}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quarterly — stats-cards-with-links pattern */}
      {quarterly.map(item => (
        <div key={item.label} className="rounded-lg border border-border/60 bg-card p-3.5">
          <dd className="flex items-start justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
            <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-500">{item.value}</span>
          </dd>
          {item.quarterlyAmounts && (
            <div className="mt-2.5 flex items-baseline gap-5">
              {(["q1", "q2", "q3", "q4"] as const).map(q => (
                <div key={q}>
                  <span className="mb-0.5 block text-[10px] uppercase tracking-[0.08em] text-muted-foreground/70">{q}</span>
                  <span className="text-[13px] font-semibold tabular-nums text-foreground">${item.quarterlyAmounts![q].toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
          {item.detail && (
            <p className="mt-2.5 text-[11px] leading-relaxed text-muted-foreground">{item.detail}</p>
          )}
        </div>
      ))}
    </motion.div>
  )
}

// Comparison card — own component so it can manage its own "flagged" exit animation.
function ComparisonCard({
  item,
  onFlag,
}: {
  item: InsightSupplementary
  onFlag?: (label: string, detail: string) => void
}) {
  const [flagged, setFlagged] = React.useState(false)
  const isDown = (item.changePercent || 0) < 0
  const currentColor = isDown ? "text-red-500 dark:text-red-400" : "text-emerald-600 dark:text-emerald-500"

  const handleFlag = () => {
    if (flagged) return
    onFlag?.(item.label, `${item.changePercent}% change: ${item.priorLabel} $${((item.priorValue || 0) / 1000).toFixed(0)}K → ${item.currentLabel} $${((item.currentValue || 0) / 1000).toFixed(0)}K`)
    setFlagged(true)
  }

  return (
    <AnimatePresence initial={false}>
      {!flagged && (
        <motion.div
          key={item.label}
          initial={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40, transition: { duration: 0.35, ease: [0.32, 0.72, 0, 1] } }}
          className="rounded-lg border border-border/60 bg-card p-3"
        >
          <div className="mb-2 flex items-start justify-between">
            <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
            <span className={cn("text-[11px] font-semibold", currentColor)}>
              {(item.changePercent || 0) > 0 ? "+" : ""}{item.changePercent}%
            </span>
          </div>
          <div className="flex items-baseline gap-4">
            <div>
              <span className="mb-0.5 block text-[10px] uppercase tracking-[0.08em] text-muted-foreground/70">{item.priorLabel}</span>
              <span className="text-sm font-semibold tabular-nums text-foreground/40">${((item.priorValue || 0) / 1000).toFixed(0)}K</span>
            </div>
            <div className="text-muted-foreground/30">→</div>
            <div>
              <span className="mb-0.5 block text-[10px] uppercase tracking-[0.08em] text-muted-foreground/70">{item.currentLabel}</span>
              <span className={cn("text-base font-semibold tabular-nums", currentColor)}>${((item.currentValue || 0) / 1000).toFixed(0)}K</span>
            </div>
          </div>
          {onFlag && (
            <div className="mt-2.5 border-t border-border/30 pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="-ml-2 h-6 gap-1 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                onClick={handleFlag}
              >
                <Flag className="size-3" /> Flag for review
              </Button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Main component ──

interface PetalInsightProps {
  insight: PetalInsight
  defaultExpanded?: boolean
  onAction?: (action: InsightAction) => void
  onSendMessage?: (messageId: string, channel: string) => void
  onEditMessage?: (messageId: string) => void
  onFlag?: (title: string, description: string) => void
  hideAskPetal?: boolean
  className?: string
}

export function PetalInsightCard({
  insight,
  defaultExpanded = false,
  onAction,
  onSendMessage,
  onEditMessage,
  onFlag,
  hideAskPetal = false,
  className,
}: PetalInsightProps) {
  // Collapsed by default — the Petal bar is a one-line read; tap to expand the
  // reasoning.
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [showTimeline, setShowTimeline] = React.useState(false)

  const dot = severityDot[insight.severity]

  // Button logic: primary action + always Ask Petal
  const primaryAction = insight.actions.find(a => a.variant === "primary")
  const hasPetalAction = insight.actions.some(a => a.action === "ask_petal")
  const petalAction: InsightAction = hasPetalAction
    ? insight.actions.find(a => a.action === "ask_petal")!
    : { id: "ask-petal-auto", label: "Ask Petal", variant: "secondary", action: "ask_petal" }

  const hasSupplementary = (insight.supplementary?.length || 0) > 0

  return (
    <motion.div
      data-slot="petal-insight"
      data-severity={insight.severity}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn(
        // ONE connected unit: bar + reasoning + draft/action share a single
        // border with internal dividers, so it reads as a single object
        // instead of three floating cards.
        "overflow-hidden rounded-xl border border-border/60 bg-card transition-colors hover:border-border",
        className
      )}
    >
      {/* Petal bar — a calm one-line read, on theme with the Ask Petal bar.
          Collapsed by default; tap to reveal the reasoning (+ stat cards),
          with Ask Petal pinned at the bottom of that expanded view. */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-3 px-3.5 py-3 text-left"
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
          <PetalMark className="size-3.5 text-foreground/70" />
        </span>
        <span className="min-w-0 flex-1 text-[13px] leading-snug text-foreground/90">
          {insight.title}
        </span>
        <svg
          width={10} height={10} viewBox="0 0 10 10"
          className={cn(
            "shrink-0 text-muted-foreground/40 transition-transform duration-200",
            isExpanded && "rotate-90"
          )}
        >
          <path d="M3 1.5L7 5L3 8.5" stroke="currentColor" fill="none" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-border/40 px-3.5 pt-3 pb-3.5">
              {/* Reasoning */}
              <p className="text-[13px] leading-relaxed text-foreground/70">
                {highlightInsightText(insight.content, { client: clients.find(c => c.id === insight.clientId) })}
              </p>
              {/* Stat cards (only if the insight carries them) */}
              {hasSupplementary && (
                <SupplementaryCards items={insight.supplementary!} onFlag={onFlag} clientId={insight.clientId} />
              )}
              {/* Ask Petal — lives at the bottom of the expanded view */}
              {!hideAskPetal && (
                <div className="pt-0.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1 px-3 text-[11px]"
                    onClick={() => onAction?.(petalAction)}
                  >
                    Ask Petal
                    <svg width={9} height={9} viewBox="0 0 12 12" className="text-muted-foreground">
                      <path d="M3.5 2L8.5 2L8.5 7" stroke="currentColor" fill="none" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M8.5 2L3 7.5" stroke="currentColor" fill="none" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Draft message — nested borderless inside the same card, divided by a
          rule so it reads as part of the one unit, not a separate box. */}
      {insight.draftMessage && (
        <DraftMessageCard
          draft={insight.draftMessage}
          client={clients.find(c => c.id === insight.clientId)}
          onSend={(channel) => onSendMessage?.(insight.draftMessage!.id, channel)}
          onEdit={() => onEditMessage?.(insight.draftMessage!.id)}
          className="rounded-none border-0 border-t border-border/40"
        />
      )}

      {/* Primary action when there's no draft — connected section below the bar */}
      {primaryAction && !insight.draftMessage && (
        <div className="border-t border-border/40 px-3.5 py-3">
          <Button size="sm" className="h-7 px-3 text-[11px]" onClick={() => onAction?.(primaryAction)}>
            {primaryAction.label}
          </Button>
        </div>
      )}
    </motion.div>
  )
}

// Compact variant for client cards
interface CompactInsightProps {
  insight: PetalInsight
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

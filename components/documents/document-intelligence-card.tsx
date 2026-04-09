"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"
import type { DocumentIntelligence, DocumentFlag } from "@/lib/documents-mock-data"
import { DocTypeBadge } from "./doc-type-badge"

// Flag dot colors
const flagDot: Record<DocumentFlag["type"], string> = {
  info: "bg-emerald-500",
  warning: "bg-amber-500",
  error: "bg-red-500",
}

interface DocumentIntelligenceCardProps {
  intelligence: DocumentIntelligence
  fileName?: string
  docTypeLabel?: string
  fileSize?: string
  uploadedAt?: string
  defaultExpanded?: boolean
  className?: string
}

export function DocumentIntelligenceCard({
  intelligence,
  fileName,
  docTypeLabel,
  fileSize,
  uploadedAt,
  defaultExpanded = false,
  className,
}: DocumentIntelligenceCardProps) {
  const [expanded, setExpanded] = React.useState(defaultExpanded)

  // First line of summary for compact view
  const summaryFirstLine = intelligence.aiSummary.split(". ").slice(0, 1).join(". ") + "."

  return (
    <div className={cn("rounded-lg border bg-card", className)}>
      {/* Compact view - always visible */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-3.5 py-2.5 hover:bg-muted/20 transition-colors rounded-lg"
      >
        <div className="flex items-center gap-2 mb-1">
          {docTypeLabel && (
            <DocTypeBadge type={docTypeLabel} />
          )}
          {fileName && (
            <span className="text-xs font-medium truncate">{fileName.replace(/_/g, " ").replace(/\.[^.]+$/, "")}</span>
          )}
          {fileSize && (
            <span className="text-[10px] text-muted-foreground ml-auto shrink-0">{fileSize}</span>
          )}
          <ChevronDown className={cn(
            "size-3.5 text-muted-foreground transition-transform duration-200 shrink-0",
            expanded && "rotate-180"
          )} />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-1">
          {summaryFirstLine}
        </p>
      </button>

      {/* Expanded view */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-3.5 pb-3 space-y-2.5 border-t border-border/40">
              {/* Full AI summary */}
              <p className="text-xs text-foreground/80 leading-relaxed pt-2.5">
                {intelligence.aiSummary}
              </p>

              {/* Key data points */}
              {intelligence.keyDataPoints.length > 0 && (
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {intelligence.keyDataPoints.map((point, i) => (
                    <div key={i} className="flex items-baseline gap-1.5">
                      <span className="text-[10px] text-muted-foreground">{point.label}:</span>
                      <span className="text-xs font-medium tabular-nums">{point.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Prior year comparison */}
              {intelligence.priorYearComparison && (
                <p className="text-[11px] text-muted-foreground italic">
                  vs prior year: {intelligence.priorYearComparison}
                </p>
              )}

              {/* Flags */}
              {intelligence.flags.length > 0 && (
                <div className="space-y-1">
                  {intelligence.flags.map((flag, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", flagDot[flag.type])} />
                      <span className="text-xs text-muted-foreground leading-relaxed">
                        {flag.message}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Duplicate notice */}
              {intelligence.duplicateOf && (
                <p className="text-[10px] text-muted-foreground">
                  Duplicate of {intelligence.duplicateOf} - ignored
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Inline summary for document lists (no card wrapper)
interface InlineIntelligenceProps {
  summary: string
  flags?: DocumentFlag[]
  className?: string
}

export function InlineDocumentIntelligence({ summary, flags, className }: InlineIntelligenceProps) {
  const firstLine = summary.split(". ").slice(0, 1).join(". ") + "."
  const hasWarnings = flags?.some(f => f.type === "warning" || f.type === "error")

  return (
    <div className={cn("flex items-start gap-2", className)}>
      {hasWarnings && (
        <span className="mt-1 size-1.5 shrink-0 rounded-full bg-amber-500" />
      )}
      <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-1">
        {firstLine}
      </p>
    </div>
  )
}

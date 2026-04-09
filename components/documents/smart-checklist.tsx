"use client"

import * as React from "react"
import { ChevronDown, Check, Circle, AlertTriangle, X } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"
import type { SmartChecklistCategory, SmartChecklistItem } from "@/lib/documents-mock-data"

// Status icon mapping
function StatusIcon({ status }: { status: SmartChecklistItem["status"] }) {
  switch (status) {
    case "received":
      return <Check className="size-3.5 text-emerald-600" />
    case "pending":
      return <Circle className="size-3.5 text-muted-foreground/40" />
    case "flagged":
      return <AlertTriangle className="size-3.5 text-amber-500" />
    case "dismissed":
      return <X className="size-3.5 text-muted-foreground/30" />
    default:
      return null
  }
}

// Full checklist with collapsible categories
interface SmartChecklistProps {
  categories: SmartChecklistCategory[]
  className?: string
}

export function SmartChecklist({ categories, className }: SmartChecklistProps) {
  return (
    <div className={cn("space-y-1", className)}>
      {categories.map((cat) => (
        <ChecklistCategorySection key={cat.category} category={cat} />
      ))}
    </div>
  )
}

function ChecklistCategorySection({ category }: { category: SmartChecklistCategory }) {
  const [open, setOpen] = React.useState(category.received < category.total)
  const allComplete = category.received === category.total

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-2 py-2 rounded-md hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <ChevronDown className={cn(
            "size-3.5 text-muted-foreground transition-transform duration-150",
            !open && "-rotate-90"
          )} />
          <span className="text-xs font-medium">{category.label}</span>
        </div>
        <span className={cn(
          "text-[10px] tabular-nums",
          allComplete ? "text-emerald-600 font-medium" : "text-muted-foreground"
        )}>
          {allComplete ? "\u2713" : `${category.received}/${category.total}`}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="pl-4 space-y-0.5 pb-1">
              {category.items.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-xs",
                    item.status === "dismissed" && "opacity-40"
                  )}
                >
                  <StatusIcon status={item.status} />
                  <span className={cn(
                    "flex-1",
                    item.status === "received" ? "text-foreground" : "text-muted-foreground",
                    item.status === "dismissed" && "line-through"
                  )}>
                    {item.label}
                  </span>
                  {item.formName && (
                    <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                      {item.formName}
                    </span>
                  )}
                  {item.status === "flagged" && item.flagReason && (
                    <span className="text-[10px] text-amber-600 truncate max-w-[120px]">
                      {item.flagReason}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Compact summary for client cards
interface CompactChecklistProps {
  summary: string
  className?: string
}

export function CompactChecklistSummary({ summary, className }: CompactChecklistProps) {
  if (!summary) return null
  return (
    <p className={cn("text-[10px] text-muted-foreground tabular-nums", className)}>
      {summary}
    </p>
  )
}

"use client";

import { cn } from "@/lib/utils";
import { Brain, Pen, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { ClientIssue } from "@/lib/issues-mock-data";
import { formatDistanceToNow, parseISO } from "date-fns";

interface IssueRowProps {
  issue: ClientIssue;
  onResolve: (id: string, note: string) => void;
}

export function IssueRow({ issue, onResolve }: IssueRowProps) {
  const [showDetail, setShowDetail] = useState(false);
  const [resolveNote, setResolveNote] = useState("");
  const [resolving, setResolving] = useState(false);
  const isResolved = issue.status === "resolved";

  const handleResolve = () => {
    if (resolving) {
      onResolve(issue.id, resolveNote);
      setResolving(false);
      setResolveNote("");
    } else {
      setResolving(true);
    }
  };

  return (
    <div className={cn("py-2.5 transition-colors", isResolved && "opacity-50")}>
      <div className="flex items-start gap-2.5">
        {/* Source indicator */}
        <div className="mt-0.5">
          {issue.source === "ai" ? (
            <Brain className="size-3.5 text-emerald-500/70" />
          ) : (
            <Pen className="size-3.5 text-muted-foreground/50" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-sm leading-snug",
              isResolved && "line-through text-muted-foreground"
            )}
          >
            {issue.title}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {issue.description}
          </p>

          {/* Metadata */}
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground/60">
              {formatDistanceToNow(parseISO(issue.createdAt), { addSuffix: true })}
            </span>
            {issue.aiReason && !isResolved && (
              <button
                onClick={() => setShowDetail(!showDetail)}
                className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronDown className={cn("size-2.5 transition-transform", showDetail && "rotate-180")} />
                AI reasoning
              </button>
            )}
            {isResolved && issue.resolvedNote && (
              <span className="text-[10px] italic text-muted-foreground/60">
                {issue.resolvedNote}
              </span>
            )}
          </div>

          {/* AI reasoning detail */}
          <AnimatePresence>
            {showDetail && issue.aiReason && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <p className="mt-1.5 rounded-md bg-muted/40 p-2 text-[11px] leading-relaxed text-muted-foreground">
                  {issue.aiReason}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Resolve input */}
          <AnimatePresence>
            {resolving && !isResolved && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <div className="mt-2 flex items-center gap-2">
                  <input
                    value={resolveNote}
                    onChange={(e) => setResolveNote(e.target.value)}
                    placeholder="Resolution note (optional)..."
                    className="flex-1 rounded-md border bg-background px-2 py-1 text-xs outline-none"
                    onKeyDown={(e) => e.key === "Enter" && handleResolve()}
                    autoFocus
                  />
                  <Button size="sm" className="h-6 px-2 text-[10px]" onClick={handleResolve}>
                    <Check className="mr-1 size-3" />
                    Done
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Resolve button */}
        {!isResolved && !resolving && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[10px] text-muted-foreground shrink-0"
            onClick={handleResolve}
          >
            Resolve
          </Button>
        )}
      </div>
    </div>
  );
}

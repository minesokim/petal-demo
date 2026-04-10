"use client";

import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Check, ChevronDown, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { ClientIssue } from "@/lib/issues-mock-data";
import { formatDistanceToNow, parseISO } from "date-fns";

interface IssueRowProps {
  issue: ClientIssue;
  onResolve: (id: string, note: string) => void;
  onUnresolve?: (id: string) => void;
}

export function IssueRow({ issue, onResolve, onUnresolve }: IssueRowProps) {
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
    <div className={cn("py-2.5 transition-colors")}>
      <div className="flex items-start gap-2.5">
        {/* Status icon — animated spring swap */}
        <div className="mt-0.5">
          <motion.div
            key={isResolved ? "resolved" : "open"}
            initial={{ scale: 0.3, opacity: 0, rotate: -45 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 12, mass: 0.6 }}
          >
            {isResolved ? (
              <CheckCircle2 className="size-3.5 text-emerald-500" />
            ) : (
              <AlertCircle className="size-3.5 text-red-500" />
            )}
          </motion.div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <motion.p
            animate={{ opacity: isResolved ? 0.4 : 1 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "text-sm leading-snug transition-all duration-300",
              isResolved && "line-through text-muted-foreground"
            )}
          >
            {issue.title}
          </motion.p>
          {issue.description && !isResolved && (
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {issue.description}
            </p>
          )}

          {/* Metadata */}
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground/60">
              {formatDistanceToNow(parseISO(issue.createdAt), { addSuffix: true })}
            </span>
            {issue.source === "ai" && !isResolved && (
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

        {/* Action buttons — animated swap */}
        <AnimatePresence mode="wait">
          {isResolved && onUnresolve ? (
            <motion.div
              key="undo"
              initial={{ opacity: 0, x: 12, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ type: "spring", stiffness: 500, damping: 18, mass: 0.5 }}
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px] text-muted-foreground shrink-0"
                onClick={() => onUnresolve(issue.id)}
              >
                Undo
              </Button>
            </motion.div>
          ) : !isResolved && !resolving ? (
            <motion.div
              key="resolve"
              initial={{ opacity: 0, x: -12, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ type: "spring", stiffness: 500, damping: 18, mass: 0.5 }}
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px] text-muted-foreground shrink-0"
                onClick={handleResolve}
              >
                Resolve
              </Button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

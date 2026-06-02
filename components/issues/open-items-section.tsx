"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IssueRow } from "./issue-row";
import { getOpenIssues, getResolvedIssues, type ClientIssue } from "@/lib/issues-mock-data";
import {
  addClientFlag,
  resolveClientFlag,
  unresolveClientFlag,
  useClientIssuesStore,
} from "@/lib/client-issues-store";
import { ChevronDown, Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface OpenItemsSectionProps {
  clientId: string;
  additionalItems?: ClientIssue[];
}

export function OpenItemsSection({ clientId, additionalItems = [] }: OpenItemsSectionProps) {
  // Subscribe to the runtime store so flags added from the triage page
  // ("Flag this") appear here instantly and vice versa.
  const { flags: runtimeFlags, resolved: runtimeResolved } = useClientIssuesStore();

  const initialOpen = getOpenIssues(clientId);
  const initialResolved = getResolvedIssues(clientId);

  // Merge mock-data + runtime-store flags for THIS client, filtering out
  // anything resolved in-session.
  const runtimeOpenForClient = runtimeFlags.filter(
    (f) => f.clientId === clientId && f.status === "open" && !runtimeResolved.has(f.id)
  );
  const allOpen = [
    ...initialOpen.filter((i) => !runtimeResolved.has(i.id)),
    ...runtimeOpenForClient,
    ...additionalItems,
  ];
  const allResolved = [
    ...initialResolved,
    // Mock-data flags resolved this session show up in resolved list with
    // a synthesized resolution timestamp.
    ...initialOpen
      .filter((i) => runtimeResolved.has(i.id))
      .map((i) => ({
        ...i,
        status: "resolved" as const,
        resolvedAt: new Date().toISOString(),
        resolvedNote: "Resolved",
      })),
    // Runtime flags that were resolved this session
    ...runtimeFlags
      .filter((f) => f.clientId === clientId && runtimeResolved.has(f.id))
      .map((f) => ({
        ...f,
        status: "resolved" as const,
        resolvedAt: new Date().toISOString(),
        resolvedNote: "Resolved",
      })),
  ];

  const [showResolved, setShowResolved] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  if (allOpen.length === 0 && allResolved.length === 0) return null;

  const handleResolve = (id: string, _note: string) => {
    resolveClientFlag(id);
  };

  const handleUnresolve = (id: string) => {
    unresolveClientFlag(id);
  };

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    addClientFlag({
      clientId,
      title: newTitle.trim(),
      source: "manual",
    });
    setNewTitle("");
    setShowAddForm(false);
  };

  return (
    <Card>
      <CardContent className="py-4">
        {/* Header — no exclamation icon, red count */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Flags</h3>
            {allOpen.length > 0 && (
              <span className="flex size-5 items-center justify-center rounded-full bg-red-50 text-[10px] font-semibold tabular-nums text-red-600">
                {allOpen.length}
              </span>
            )}
            {allOpen.length === 0 && (
              <span className="text-[10px] text-emerald-600 font-medium">All clear</span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs text-muted-foreground"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus className="size-3" />
            Add
          </Button>
        </div>

        {/* Add form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="mb-3 flex items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2">
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Describe the issue..."
                  className="flex-1 bg-transparent text-sm outline-none"
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  autoFocus
                />
                <Button
                  size="sm"
                  className="h-6 px-2 text-[10px]"
                  onClick={handleAdd}
                  disabled={!newTitle.trim()}
                >
                  Add
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Open items */}
        {allOpen.length > 0 ? (
          <div className="divide-y divide-border/40">
            <AnimatePresence>
              {allOpen.map((issue) => (
                <motion.div
                  key={issue.id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0, x: -20 }}
                  transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                  className="overflow-hidden"
                >
                  <IssueRow issue={issue} onResolve={handleResolve} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <p className="py-4 text-center text-xs text-muted-foreground">
            No flags — all clear
          </p>
        )}

        {/* Resolved items */}
        {allResolved.length > 0 && (
          <div className="mt-3 border-t border-border/30 pt-2">
            <button
              onClick={() => setShowResolved(!showResolved)}
              className="flex w-full items-center gap-1.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronDown
                className={cn(
                  "size-3 transition-transform duration-150",
                  showResolved && "rotate-180"
                )}
              />
              Resolved ({allResolved.length})
            </button>

            <AnimatePresence>
              {showResolved && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="divide-y divide-border/20">
                    {allResolved.map((issue) => (
                      <IssueRow
                        key={issue.id}
                        issue={issue}
                        onResolve={() => {}}
                        onUnresolve={handleUnresolve}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

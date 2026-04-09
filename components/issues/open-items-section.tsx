"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IssueRow } from "./issue-row";
import { getOpenIssues, getResolvedIssues, type ClientIssue } from "@/lib/issues-mock-data";
import { AlertCircle, ChevronDown, Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface OpenItemsSectionProps {
  clientId: string;
}

export function OpenItemsSection({ clientId }: OpenItemsSectionProps) {
  const initialOpen = getOpenIssues(clientId);
  const initialResolved = getResolvedIssues(clientId);

  const [openItems, setOpenItems] = useState<ClientIssue[]>(initialOpen);
  const [resolvedItems, setResolvedItems] = useState<ClientIssue[]>(initialResolved);
  const [showResolved, setShowResolved] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  if (openItems.length === 0 && resolvedItems.length === 0) return null;

  const handleResolve = (id: string, note: string) => {
    const item = openItems.find((i) => i.id === id);
    if (!item) return;
    setOpenItems((prev) => prev.filter((i) => i.id !== id));
    setResolvedItems((prev) => [
      { ...item, status: "resolved", resolvedAt: new Date().toISOString(), resolvedNote: note || "Resolved" },
      ...prev,
    ]);
  };

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    const newIssue: ClientIssue = {
      id: `iss-new-${Date.now()}`,
      clientId,
      title: newTitle.trim(),
      description: "",
      source: "manual",
      status: "open",
      createdAt: new Date().toISOString(),
    };
    setOpenItems((prev) => [...prev, newIssue]);
    setNewTitle("");
    setShowAddForm(false);
  };

  return (
    <Card>
      <CardContent className="py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 text-red-500" />
            <h3 className="text-sm font-semibold">Flags</h3>
            {openItems.length > 0 && (
              <span className="flex size-5 items-center justify-center rounded-full bg-foreground/10 text-[10px] font-semibold tabular-nums">
                {openItems.length}
              </span>
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
        {openItems.length > 0 ? (
          <div className="divide-y divide-border/40">
            {openItems.map((issue) => (
              <IssueRow key={issue.id} issue={issue} onResolve={handleResolve} />
            ))}
          </div>
        ) : (
          <p className="py-4 text-center text-xs text-muted-foreground">
            No flags — all clear
          </p>
        )}

        {/* Resolved items */}
        {resolvedItems.length > 0 && (
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
              Resolved ({resolvedItems.length})
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
                    {resolvedItems.map((issue) => (
                      <IssueRow key={issue.id} issue={issue} onResolve={() => {}} />
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

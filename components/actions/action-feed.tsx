"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ActionCard } from "./action-card";
import { type FeedAction } from "@/lib/actions-mock-data";

const filters = [
  { key: "all", label: "All" },
  { key: "urgent", label: "Urgent" },
  { key: "document", label: "Documents" },
  { key: "signature", label: "Signatures" },
  { key: "payment", label: "Payments" },
  { key: "schedule", label: "Scheduling" },
  { key: "escalation", label: "Follow-up" },
];

interface ActionFeedProps {
  actions: FeedAction[];
  onSelectAction: (action: FeedAction) => void;
}

export function ActionFeed({ actions, onSelectAction }: ActionFeedProps) {
  const [filter, setFilter] = useState("all");

  const filtered = actions
    .filter(a => {
      if (a.isResolved) return false;
      if (filter === "all") return true;
      if (filter === "urgent") return a.priority <= 1;
      return a.category === filter;
    })
    .sort((a, b) => a.priority - b.priority);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {filters.map(f => (
          <Button
            key={f.key}
            variant={filter === f.key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            {f.key === "all" && ` (${actions.filter(a => !a.isResolved).length})`}
          </Button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="bg-primary/10 mb-4 flex size-14 items-center justify-center rounded-2xl">
              <svg className="text-primary size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
            </div>
            <h3 className="text-base font-semibold">All caught up</h3>
            <p className="text-muted-foreground text-sm">No actions in this category.</p>
          </div>
        ) : (
          filtered.map(action => (
            <ActionCard key={action.id} action={action} onClick={() => onSelectAction(action)} />
          ))
        )}
      </div>
    </div>
  );
}

"use client";

import { Check, Clock } from "lucide-react";
import { type ChecklistItem } from "@/lib/documents-mock-data";

export function DocumentChecklist({ items, taxYear = 2025 }: { items: ChecklistItem[]; taxYear?: number }) {
  const received = items.filter(i => i.received).length;

  return (
    <div>
      <div className="mb-3 text-sm font-semibold">Document checklist</div>
      <div className="rounded-xl border">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="text-sm font-medium">{taxYear} tax year</span>
          <span className="text-muted-foreground text-xs">{received} of {items.length} received</span>
        </div>
        <div className="divide-y">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-2.5">
              <div className={`flex size-5 shrink-0 items-center justify-center rounded ${
                item.received ? "bg-emerald-500" : "border-2 border-amber-400"
              }`}>
                {item.received && <Check className="size-3 text-white" />}
              </div>
              <span className={`flex-1 text-[13px] ${item.received ? "text-muted-foreground line-through" : ""}`}>
                {item.label}
              </span>
              {item.received && item.matchedFileName ? (
                <span className="text-muted-foreground text-xs">{item.matchedFileName}</span>
              ) : !item.received ? (
                <span className="text-xs text-amber-600">{item.daysSinceRequested} days</span>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Icon, I } from "@/components/os/icon";
import { closeTasks, closeStatusMeta, CLOSE_ORDER, closeMonth, closeOwners } from "@/lib/os-close";

const ME = "u-antonio";
const initials = (n: string) => n.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

export default function ClosePage() {
  const [scope, setScope] = useState<"mine" | "all">("mine");

  const tasks = scope === "mine" ? closeTasks.filter(t => t.assignee === ME) : closeTasks;
  const groups = CLOSE_ORDER.map(s => ({ status: s, items: tasks.filter(t => t.status === s) })).filter(g => g.items.length > 0);
  const mineCount = closeTasks.filter(t => t.assignee === ME).length;

  return (
    <div className="flex h-full flex-col">
      {/* header — Close checklist › May 2026 */}
      <div className="flex items-center gap-2 border-b border-[var(--os-border)] px-8 py-3">
        <Icon icon={I.check} size={16} className="text-[var(--os-ink-muted)]" />
        <h1 className="text-[14px] font-semibold text-[var(--os-ink)] os-display">Close checklist</h1>
        <Icon icon={I.chevronRight} size={13} className="text-[var(--os-ink-subtle)]" />
        <span className="text-[14px] text-[var(--os-ink-muted)]">{closeMonth}</span>
        <div className="ml-auto flex items-center gap-1.5">
          <button className="flex h-7 items-center gap-1.5 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2.5 text-[12px] text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)]">{closeMonth} <Icon icon={I.chevronDown} size={13} className="text-[var(--os-ink-subtle)]" /></button>
          <button className="flex h-7 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-2.5 text-[12px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97]"><Icon icon={I.plus} size={15} /> New task</button>
        </div>
      </div>

      {/* tabs — Assigned to you / All tasks */}
      <div className="flex items-center gap-1 border-b border-[var(--os-border)] px-8 py-1.5">
        {(["mine", "all"] as const).map(s => (
          <button
            key={s}
            onClick={() => setScope(s)}
            className={cn("flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[13px] transition-colors", scope === s ? "bg-[var(--os-selected)] font-medium text-[var(--os-ink)]" : "text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)]")}
          >
            {s === "mine" ? "Assigned to you" : "All tasks"}
            <span className="tabular-nums text-[12px] text-[var(--os-ink-subtle)]">{s === "mine" ? mineCount : closeTasks.length}</span>
          </button>
        ))}
      </div>

      {/* body — grouped by status */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {groups.length === 0 ? (
          <div className="grid place-items-center px-6 py-16 text-center text-[13px] text-[var(--os-ink-subtle)]">Nothing here.</div>
        ) : groups.map(g => (
          <div key={g.status}>
            {/* group header */}
            <div className="flex items-center gap-2 bg-[var(--os-bg-subtle)] px-8 py-1.5">
              <span className={cn("size-2 shrink-0 rounded-full", closeStatusMeta[g.status].dot)} />
              <span className="text-[13px] font-medium text-[var(--os-ink)]">{closeStatusMeta[g.status].label}</span>
              <span className="text-[13px] tabular-nums text-[var(--os-ink-subtle)]">{g.items.length}</span>
              <button className="ml-auto grid size-5 place-items-center rounded text-[var(--os-ink-subtle)] transition-colors hover:bg-[var(--os-selected)] hover:text-[var(--os-ink)]"><Icon icon={I.plus} size={14} /></button>
            </div>
            {/* rows */}
            {g.items.map(t => (
              <div key={t.id} className="flex h-14 items-center gap-3 border-b border-[var(--os-border)] px-8 transition-colors hover:bg-[var(--os-hover)]">
                <span className={cn("grid size-4 shrink-0 place-items-center rounded-full border-2", t.status === "complete" ? "border-emerald-500 bg-emerald-500 text-white" : t.status === "in_progress" ? "border-amber-500" : "border-[var(--os-border-strong)]")}>
                  {t.status === "complete" && <Icon icon={I.check} size={10} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium text-[var(--os-ink)]">{t.title}</div>
                  <div className="truncate text-[12px] text-[var(--os-ink-subtle)]">{t.client}</div>
                </div>
                <span className="hidden shrink-0 rounded-md border border-[var(--os-border)] px-2 py-0.5 text-[11px] font-medium text-[var(--os-ink-muted)] sm:inline-flex">{t.group}</span>
                <span className="hidden w-14 shrink-0 text-right text-[12px] tabular-nums text-[var(--os-ink-muted)] sm:inline-block">{t.due}</span>
                <span title={closeOwners[t.assignee]} className="grid size-6 shrink-0 place-items-center rounded-full bg-[var(--os-selected)] text-[10px] font-semibold text-[var(--os-ink-muted)]">{initials(closeOwners[t.assignee] || "")}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

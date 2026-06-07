"use client";

import { useState } from "react";
import Link from "next/link";
import {
  households, entitiesOf, returnsOf, householdStage, householdFee, healthMeta,
  kindLabel, stageLabels, stageDotStyles, OWNERS, type Household, type ReturnStage,
} from "@/lib/os-entities";
import { cn } from "@/lib/utils";
import { Icon, I } from "@/components/os/icon";

type ListKey = "my-book" | "in-prep" | "needs-review";

const LISTS: { key: ListKey; title: string; subtitle: string; filter: (h: Household) => boolean }[] = [
  { key: "my-book", title: "My book", subtitle: "Clients assigned to you", filter: h => h.assignedTo === "u-antonio" },
  { key: "in-prep", title: "In preparation", subtitle: "A return in active prep", filter: h => returnsOf(h.id).some(r => r.stage === "in_preparation") },
  { key: "needs-review", title: "Needs review", subtitle: "Drafted and waiting on you", filter: h => returnsOf(h.id).some(r => r.stage === "client_review" || r.stage === "pay_and_sign") },
];

const COLS = "grid-cols-[minmax(220px,1.6fr)_minmax(150px,1.1fr)_150px_96px_120px_130px]";

export default function ListsPage() {
  const [active, setActive] = useState<ListKey>("my-book");
  const list = LISTS.find(l => l.key === active)!;
  const rows = households.filter(list.filter);
  const counts = LISTS.reduce<Record<string, number>>((a, l) => { a[l.key] = households.filter(l.filter).length; return a; }, {});

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--os-border)] px-8 pt-6 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[24px] font-semibold text-[var(--os-ink)] os-display">Worklists</h1>
            <p className="mt-1 text-[13px] text-[var(--os-ink-muted)]">Saved views that group your book by what needs doing.</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button className="flex h-7 items-center gap-1.5 rounded-md px-2 text-[12px] text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)]"><Icon icon={I.sort} size={15} /> Sort</button>
            <button className="flex h-7 items-center gap-1.5 rounded-md px-2 text-[12px] text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)]"><Icon icon={I.filter} size={15} /> Filter</button>
            <button className="grid size-7 place-items-center rounded-md text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)]"><Icon icon={I.search} size={15} /></button>
          </div>
        </div>
      </div>

      {/* merged: switch between saved lists */}
      <div className="flex items-center gap-1 border-b border-[var(--os-border)] px-8">
        {LISTS.map(l => (
          <button
            key={l.key}
            onClick={() => setActive(l.key)}
            className={cn("relative flex items-center gap-1.5 px-2.5 py-2 text-[13px] transition-colors", active === l.key ? "font-medium text-[var(--os-ink)]" : "text-[var(--os-ink-muted)] hover:text-[var(--os-ink)]")}
          >
            {l.title}
            <span className="rounded bg-[var(--os-selected)] px-1.5 text-[11px] font-medium tabular-nums text-[var(--os-ink-muted)]">{counts[l.key]}</span>
            {active === l.key && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--os-ink)]" />}
          </button>
        ))}
      </div>

      <div className={cn("grid items-center gap-x-4 border-b border-[var(--os-border)] px-8 py-2", COLS)}>
        {["Client", "Entities", "Stage", "Fee", "Health", "Owner"].map((h, i) => (
          <div key={h} className={cn("os-label", i === 3 && "text-right")}>{h}</div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {rows.length === 0 ? (
          <div className="grid h-full place-items-center text-[13px] text-[var(--os-ink-subtle)]">Nothing in this list right now.</div>
        ) : rows.map(h => {
          const ents = entitiesOf(h.id);
          const stage = householdStage(h.id);
          const hp = healthMeta(h.healthUrgency);
          const initials = h.name.split(" ").map(n => n[0]).join("").slice(0, 2);
          return (
            <Link key={h.id} href={`/os/clients/${h.id}`} className={cn("grid h-[52px] items-center gap-x-4 border-b border-[var(--os-border)] px-8 transition-colors hover:bg-[var(--os-hover)]", COLS)}>
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[var(--os-selected)] text-[10px] font-medium text-[var(--os-ink-muted)]">{initials}</span>
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium text-[var(--os-ink)]">{h.name}</div>
                  <div className="truncate text-[11px] text-[var(--os-ink-subtle)]">{kindLabel[h.kind]} · {ents.length} {ents.length === 1 ? "entity" : "entities"}</div>
                </div>
              </div>
              <div className="flex min-w-0 items-center gap-1 text-[12px] text-[var(--os-ink-muted)]">
                {ents.slice(0, 3).map(e => (
                  <span key={e.id} className="shrink-0 rounded bg-[var(--os-selected)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--os-ink-muted)]">{e.form}</span>
                ))}
                {ents.length > 3 && <span className="text-[11px] text-[var(--os-ink-subtle)]">+{ents.length - 3}</span>}
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-[var(--os-ink-muted)]">
                <span className={cn("size-1.5 shrink-0 rounded-full", (stageDotStyles as Record<string, string>)[stage] || "bg-stone-400")} />
                <span className="truncate">{stageLabels[stage as ReturnStage] || stage}</span>
              </div>
              <div className="text-right text-[12px] font-medium tabular-nums">${householdFee(h.id).toLocaleString()}</div>
              <div className={cn("flex items-center gap-1.5 text-[12px]", hp.text)}>
                <span className={cn("size-1.5 shrink-0 rounded-full", hp.dot)} /> {hp.label}
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-[var(--os-ink-muted)]">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[var(--os-selected)] text-[9px] font-medium">{(OWNERS[h.assignedTo] || "?")[0]}</span>
                <span className="truncate">{(OWNERS[h.assignedTo] || "Unassigned").split(" ")[0]}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

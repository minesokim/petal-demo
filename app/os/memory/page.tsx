"use client";

// Firm-wide Client Memory — audit and manage everything Petal has stored across
// clients. Pending observations to approve up top; then memories grouped by
// client, searchable, each pin/forgettable. Per-client memory lives on the
// client record (Memory tab); this is the governance view.

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Icon, I } from "@/components/os/icon";
import { PetalMark } from "@/components/petal-mark";
import { householdById } from "@/lib/fixtures/firm";
import { memoryStore, useMemory, MEMORY_KIND_LABEL, type MemoryKind } from "@/lib/memory-store";

const FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]";
const KIND_TONE: Record<MemoryKind, string> = {
  preference: "text-[var(--os-ink-muted)] bg-[var(--os-selected)]",
  fact: "text-[var(--os-ink-muted)] bg-[var(--os-selected)]",
  history: "text-[var(--os-ink-muted)] bg-[var(--os-selected)]",
  flag: "text-[var(--os-warning)] bg-[color-mix(in_srgb,var(--os-warning)_12%,transparent)]",
};

export default function MemoryPage() {
  useMemory();
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();

  const groups = memoryStore.byHousehold()
    .map(g => ({ ...g, memories: g.memories.filter(m => !query || m.text.toLowerCase().includes(query) || g.name.toLowerCase().includes(query)) }))
    .filter(g => g.memories.length > 0);
  const total = memoryStore.all().length;
  const suggestions = memoryStore.allSuggestions();

  return (
    <div className="flex h-full flex-col">
      {/* header */}
      <div className="border-b border-[var(--os-border)] px-8 pt-6 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="os-display flex items-center gap-2 text-[24px] font-semibold text-[var(--os-ink)]">
              <PetalMark className="size-5 text-[var(--os-ink-muted)]" /> Memory
            </h1>
            <p className="mt-1 text-[13px] text-[var(--os-ink-muted)]">Everything Petal remembers about your clients — sourced, and yours to manage.</p>
          </div>
          <div className="shrink-0 text-right">
            <div className="os-display text-[22px] font-semibold leading-none tabular-nums text-[var(--os-ink)]">{total}</div>
            <div className="mt-1 text-[11px] text-[var(--os-ink-subtle)]">memories</div>
          </div>
        </div>
      </div>

      {/* search */}
      <div className="flex items-center gap-3 border-b border-[var(--os-border)] px-8 py-2.5">
        <div className="relative w-full max-w-[320px]">
          <Icon icon={I.search} size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--os-ink-subtle)]" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search memories or clients…" className={cn("h-8 w-full rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] pl-8 pr-3 text-[13px] text-[var(--os-ink)] outline-none placeholder:text-[var(--os-ink-subtle)] focus:border-[var(--os-border-strong)]", FOCUS)} />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
        <div className="mx-auto max-w-[760px] space-y-6">
          {/* pending — Petal noticed, awaiting approval */}
          {suggestions.length > 0 && !query && (
            <div>
              <h2 className="os-label mb-2.5">Petal noticed · {suggestions.length} to review</h2>
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {suggestions.map(sug => (
                    <motion.div key={sug.id} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden rounded-xl border border-[var(--os-border-strong)] bg-[var(--os-card)] p-3.5">
                      <div className="flex items-start gap-2.5">
                        <PetalMark className="mt-0.5 size-4 shrink-0 text-[var(--os-primary)]" />
                        <div className="min-w-0 flex-1">
                          <Link href={`/os/clients/${sug.householdId}?tab=Memory`} className="text-[12px] font-medium text-[var(--os-link)] hover:underline">{householdById(sug.householdId)?.name ?? "Client"}</Link>
                          <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--os-ink)]">{sug.text}</p>
                          <div className="mt-0.5 text-[11px] text-[var(--os-ink-subtle)]">{sug.source}</div>
                          <div className="mt-2.5 flex items-center gap-1.5">
                            <button onClick={() => memoryStore.confirm(sug.id)} className={cn("inline-flex h-7 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-2.5 text-[12px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97]", FOCUS)}><Icon icon={I.check} size={13} /> Remember</button>
                            <button onClick={() => memoryStore.dismissSuggestion(sug.id)} className={cn("inline-flex h-7 items-center rounded-md px-2.5 text-[12px] font-medium text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]", FOCUS)}>Dismiss</button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* grouped by client */}
          {groups.length === 0 ? (
            <p className="py-16 text-center text-[13px] text-[var(--os-ink-muted)]">No memories match.</p>
          ) : (
            groups.map(g => (
              <div key={g.householdId} className="overflow-hidden rounded-xl border border-[var(--os-border)]">
                <div className="flex items-center gap-2 border-b border-[var(--os-border)] bg-[var(--os-bg-subtle)] px-3.5 py-2">
                  <Link href={`/os/clients/${g.householdId}?tab=Memory`} className="text-[12.5px] font-medium text-[var(--os-ink)] hover:underline">{g.name}</Link>
                  <span className="rounded bg-[var(--os-selected)] px-1.5 text-[11px] font-medium tabular-nums text-[var(--os-ink-muted)]">{g.memories.length}</span>
                </div>
                <div className="divide-y divide-[var(--os-border)]">
                  {g.memories.map(mem => (
                    <div key={mem.id} className="group/mem flex items-start gap-3 px-3.5 py-2.5">
                      <span className={cn("mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium", KIND_TONE[mem.kind])}>{MEMORY_KIND_LABEL[mem.kind]}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] leading-snug text-[var(--os-ink)]">{mem.text}</p>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[var(--os-ink-subtle)]">
                          {mem.pinned && <Icon icon={I.star} size={11} className="text-[var(--os-ink-muted)]" />}
                          {mem.source}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/mem:opacity-100">
                        <button onClick={() => memoryStore.togglePin(mem.id)} aria-label={mem.pinned ? "Unpin" : "Pin"} className={cn("grid size-6 place-items-center rounded text-[var(--os-ink-subtle)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]", mem.pinned && "text-[var(--os-ink)] opacity-100", FOCUS)}><Icon icon={I.star} size={13} /></button>
                        <button onClick={() => memoryStore.remove(mem.id)} aria-label="Forget" className={cn("grid size-6 place-items-center rounded text-[var(--os-ink-subtle)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]", FOCUS)}><Icon icon={I.close} size={13} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

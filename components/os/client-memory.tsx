"use client";

// Client Memory panel — the durable facts Petal knows about one client. Pinned
// first; each memory is sourced and can be pinned or dismissed. Petal's
// not-yet-confirmed observations sit up top as "remember this?" cards you approve
// or dismiss — the same propose→approve pattern as the rest of Petal.

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Icon, I } from "@/components/os/icon";
import { PetalMark } from "@/components/petal-mark";
import { memoryStore, useMemory, MEMORY_KIND_LABEL, type MemoryKind } from "@/lib/memory-store";

const FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]";

const KIND_TONE: Record<MemoryKind, string> = {
  preference: "text-[var(--os-ink-muted)] bg-[var(--os-selected)]",
  fact: "text-[var(--os-ink-muted)] bg-[var(--os-selected)]",
  history: "text-[var(--os-ink-muted)] bg-[var(--os-selected)]",
  flag: "text-[var(--os-warning)] bg-[color-mix(in_srgb,var(--os-warning)_12%,transparent)]",
};

export function ClientMemory({ householdId, compact = false }: { householdId: string; compact?: boolean }) {
  useMemory();
  const memories = memoryStore.ofHousehold(householdId);
  const suggestions = memoryStore.suggestionsOf(householdId);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const addMemory = () => { const t = draft.trim(); if (!t) return; memoryStore.add(householdId, t); setDraft(""); setAdding(false); };

  return (
    <div className={cn("space-y-4", compact ? "" : "max-w-[760px]")}>
      {/* what Petal noticed — approve into memory */}
      <AnimatePresence initial={false}>
        {suggestions.map(sug => (
          <motion.div
            key={sug.id}
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden rounded-xl border border-[var(--os-border-strong)] bg-[var(--os-card)] p-3.5"
          >
            <div className="flex items-start gap-2.5">
              <PetalMark className="mt-0.5 size-4 shrink-0 text-[var(--os-primary)]" />
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-medium text-[var(--os-ink-muted)]">Petal noticed — remember this?</div>
                <p className="mt-1 text-[13px] leading-relaxed text-[var(--os-ink)]">{sug.text}</p>
                <div className="mt-1 text-[11px] text-[var(--os-ink-subtle)]">{sug.source}</div>
                <div className="mt-2.5 flex items-center gap-1.5">
                  <button onClick={() => memoryStore.confirm(sug.id)} className={cn("inline-flex h-7 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-2.5 text-[12px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97]", FOCUS)}>
                    <Icon icon={I.check} size={13} /> Remember
                  </button>
                  <button onClick={() => memoryStore.dismissSuggestion(sug.id)} className={cn("inline-flex h-7 items-center rounded-md px-2.5 text-[12px] font-medium text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]", FOCUS)}>
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* the memory list */}
      <div className="overflow-hidden rounded-xl border border-[var(--os-border)]">
        <div className="flex items-center gap-2 border-b border-[var(--os-border)] bg-[var(--os-bg-subtle)] px-3.5 py-2">
          <PetalMark className="size-3.5 text-[var(--os-ink-muted)]" />
          <span className="text-[12.5px] font-medium text-[var(--os-ink)]">What Petal knows</span>
          <span className="rounded bg-[var(--os-selected)] px-1.5 text-[11px] font-medium tabular-nums text-[var(--os-ink-muted)]">{memories.length}</span>
          <button onClick={() => setAdding(a => !a)} className={cn("ml-auto inline-flex h-6 items-center gap-1 rounded-md px-1.5 text-[12px] font-medium text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]", FOCUS)}>
            <Icon icon={I.plus} size={13} /> Add
          </button>
        </div>

        {adding && (
          <div className="flex items-center gap-2 border-b border-[var(--os-border)] px-3.5 py-2.5">
            <input
              autoFocus value={draft} onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") addMemory(); if (e.key === "Escape") { setAdding(false); setDraft(""); } }}
              placeholder="Something durable Petal should remember about this client…"
              className={cn("h-8 flex-1 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2.5 text-[13px] text-[var(--os-ink)] outline-none placeholder:text-[var(--os-ink-subtle)] focus:border-[var(--os-border-strong)]", FOCUS)}
            />
            <button onClick={addMemory} disabled={!draft.trim()} className="inline-flex h-8 items-center rounded-md bg-[var(--os-primary)] px-3 text-[12.5px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97] disabled:opacity-40">Save</button>
          </div>
        )}

        {memories.length === 0 && !adding ? (
          <p className="px-3.5 py-8 text-center text-[12.5px] text-[var(--os-ink-muted)]">Nothing remembered yet. Petal builds this from calls, messages, and returns.</p>
        ) : (
          <div className="divide-y divide-[var(--os-border)]">
            {memories.map(mem => (
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
                  <button onClick={() => memoryStore.togglePin(mem.id)} aria-label={mem.pinned ? "Unpin" : "Pin"} className={cn("grid size-6 place-items-center rounded text-[var(--os-ink-subtle)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]", mem.pinned && "text-[var(--os-ink)] opacity-100", FOCUS)}>
                    <Icon icon={I.star} size={13} />
                  </button>
                  <button onClick={() => memoryStore.remove(mem.id)} aria-label="Forget" className={cn("grid size-6 place-items-center rounded text-[var(--os-ink-subtle)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]", FOCUS)}>
                    <Icon icon={I.close} size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="px-0.5 text-[11.5px] leading-relaxed text-[var(--os-ink-subtle)]">
        Petal grounds answers and briefs in these memories and cites them. You stay in control — pin what matters, forget what doesn&apos;t.
      </p>
    </div>
  );
}

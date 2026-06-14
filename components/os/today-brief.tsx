"use client";

// Today's brief — situational awareness, not a task mirror. A newspaper grouped by
// "desk" (IRS & regulatory · Your firm · Season · Practice). Each item opens a modal
// briefing: what changed, why it matters to this firm, and an optional soft action.

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import { Icon, I } from "@/components/os/icon";
import { Button } from "@/components/os/primitives";
import {
  brief, briefToneDot, briefDeskMeta, BRIEF_DESK_ORDER, type BriefItem,
} from "@/lib/fixtures/firm";

const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]";

function BriefRow({ item, onOpen }: { item: BriefItem; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className={cn("group/brief -mx-2 flex w-full gap-2.5 rounded-md px-2 py-2.5 text-left transition-colors hover:bg-[var(--os-hover)]", focusRing)}
    >
      <span className={cn("mt-[7px] size-1.5 shrink-0 rounded-full", briefToneDot[item.tone])} />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-1.5">
          <span className="min-w-0 flex-1 text-[13px] font-medium leading-snug text-[var(--os-ink)]">{item.headline}</span>
          <span className="shrink-0 text-[10.5px] tabular-nums text-[var(--os-ink-subtle)]">{item.dateline}</span>
        </span>
        <span className="mt-0.5 block text-[12px] leading-snug text-[var(--os-ink-muted)]">{item.detail}</span>
      </span>
      <Icon icon={I.chevronRight} size={14} className="mt-1 shrink-0 self-start text-[var(--os-ink-subtle)] opacity-0 transition-opacity group-hover/brief:opacity-100" />
    </button>
  );
}

function BriefModal({ item, onClose }: { item: BriefItem; onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.99 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.99 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          onClick={e => e.stopPropagation()}
          role="dialog" aria-modal="true" aria-label={item.headline}
          className="w-full max-w-[520px] overflow-hidden rounded-2xl border border-[var(--os-border)] bg-[var(--os-surface)] shadow-[0_12px_40px_rgba(17,17,26,0.16)]"
        >
          {/* desk eyebrow + close */}
          <div className="flex items-center gap-2 px-5 pt-4">
            <span className={cn("size-1.5 rounded-full", briefToneDot[item.tone])} />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--os-ink-subtle)]">{briefDeskMeta[item.desk].label}</span>
            <span className="text-[11px] text-[var(--os-ink-subtle)]">· {item.source} · {item.dateline}</span>
            <button
              onClick={onClose}
              aria-label="Close"
              className={cn("ml-auto grid size-7 place-items-center rounded-md text-[var(--os-ink-subtle)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]", focusRing)}
            >
              <Icon icon={I.close} size={15} />
            </button>
          </div>

          {/* headline + briefing */}
          <div className="px-5 pb-1 pt-2.5">
            <h2 className="os-display text-[17px] font-semibold leading-snug text-[var(--os-ink)]">{item.headline}</h2>
            <p className="mt-2.5 text-[13px] leading-relaxed text-[var(--os-ink-muted)]">{item.body}</p>
          </div>

          {/* why it matters — the firm-specific lens */}
          {item.whyItMatters && (
            <div className="mx-5 mb-1 mt-3 rounded-xl border border-[var(--os-border)] bg-[var(--os-card)] p-3.5">
              <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--os-ink-subtle)]">
                <PetalMark className="size-3 text-[var(--os-ink-muted)]" /> Why it matters to you
              </div>
              <p className="text-[12.5px] leading-relaxed text-[var(--os-ink)]">{item.whyItMatters}</p>
            </div>
          )}

          {/* footer — awareness is the default; action is optional */}
          <div className="mt-3 flex items-center gap-2 border-t border-[var(--os-border)] px-5 py-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--os-ink-subtle)]">
              <PetalMark className="size-3" /> Briefed by Petal
            </span>
            <div className="ml-auto flex items-center gap-1.5">
              {item.action && (
                <Link href={item.action.href} onClick={onClose}>
                  <Button variant="secondary" size="sm">{item.action.label}</Button>
                </Link>
              )}
              <Button variant="primary" size="sm" onClick={onClose}>Got it</Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function TodayBrief() {
  const [open, setOpen] = useState<BriefItem | null>(null);
  const desks = BRIEF_DESK_ORDER
    .map(d => ({ desk: d, items: brief.filter(b => b.desk === d) }))
    .filter(g => g.items.length > 0);

  return (
    <div className="flex flex-col rounded-xl border border-[var(--os-border-strong)] bg-[var(--os-card)] p-5 transition-colors duration-200 hover:border-[var(--os-border-hover)]">
      <div className="mb-4 flex items-center gap-2">
        <PetalMark className="size-4 text-[var(--os-ink-muted)]" />
        <h3 className="os-display text-[15px] font-semibold text-[var(--os-ink)]">Today&apos;s brief</h3>
        <span className="text-[12px] text-[var(--os-ink-subtle)]">What's moving in your world</span>
      </div>

      <div className="space-y-7">
        {desks.map(({ desk, items }) => (
          <section key={desk}>
            <div className="os-label mb-1.5 px-0.5">{briefDeskMeta[desk].label}</div>
            <div className="space-y-2">
              {items.map(item => <BriefRow key={item.id} item={item} onOpen={() => setOpen(item)} />)}
            </div>
          </section>
        ))}
      </div>

      <Link href="/os/activity" className={cn("-mx-2 mt-5 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] font-medium text-[var(--os-ink-muted)] transition-colors hover:text-[var(--os-ink)]", focusRing)}>
        View activity log <Icon icon={I.chevronRight} size={13} />
      </Link>

      {open && <BriefModal item={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

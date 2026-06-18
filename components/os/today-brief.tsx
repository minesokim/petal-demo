"use client";

// Today's brief - situational awareness, not a task mirror. A newspaper grouped by
// "desk" (IRS & regulatory · Your firm · Season · Practice). Each item expands inline
// with an animation: the briefing (what changed, why it matters, optional action)
// unfolds in place rather than opening a modal.

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

function BriefRow({ item, open, onToggle }: { item: BriefItem; open: boolean; onToggle: () => void }) {
  return (
    <div className={cn("-mx-2 rounded-lg transition-colors", open && "bg-[var(--os-hover)]")}>
      <button
        onClick={onToggle}
        aria-expanded={open}
        className={cn("group/brief flex w-full gap-2.5 rounded-lg px-2 py-2.5 text-left transition-colors", !open && "hover:bg-[var(--os-hover)]", focusRing)}
      >
        <span className={cn("mt-[7px] size-1.5 shrink-0 rounded-full", briefToneDot[item.tone])} />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-1.5">
            <span className="min-w-0 flex-1 text-[13px] font-normal leading-snug text-[var(--os-ink)]">{item.headline}</span>
            <span className="shrink-0 text-[10.5px] tabular-nums text-[var(--os-ink-subtle)]">{item.dateline}</span>
          </span>
          <span className="mt-0.5 block text-[12px] leading-snug text-[var(--os-ink-muted)]">{item.detail}</span>
        </span>
        <Icon icon={I.chevronDown} size={14} className={cn("mt-1 shrink-0 self-start text-[var(--os-ink-subtle)] transition-transform duration-200", open && "rotate-180")} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-2 pb-3 pl-[26px] pt-0.5">
              <div className="mb-2 text-[10.5px] text-[var(--os-ink-subtle)]">{item.source} · {item.dateline}</div>
              <p className="text-[12.5px] leading-relaxed text-[var(--os-ink-muted)]">{item.body}</p>

              {item.whyItMatters && (
                <div className="mt-3 rounded-lg border border-[var(--os-border)] bg-[var(--os-card)] p-3">
                  <div className="mb-1 flex items-center gap-1.5 text-[10.5px] font-medium tracking-wide text-[var(--os-ink-subtle)]">
                    <PetalMark className="size-3 text-[var(--os-ink-muted)]" /> Why it matters to you
                  </div>
                  <p className="text-[12.5px] leading-relaxed text-[var(--os-ink)]">{item.whyItMatters}</p>
                </div>
              )}

              <div className="mt-3 flex items-center gap-2">
                {item.action && (
                  <Link href={item.action.href}><Button variant="secondary" size="sm">{item.action.label}</Button></Link>
                )}
                <Link href="/os/ask" className="group/ask ml-auto inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[11.5px] text-[var(--os-ink-subtle)] transition-colors hover:text-[var(--os-ink-muted)]">
                  <PetalMark className="size-3 transition-transform duration-500 ease-out group-hover/ask:rotate-[72deg]" /> Ask Petal
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function TodayBrief() {
  const [openId, setOpenId] = useState<string | null>(null);
  const desks = BRIEF_DESK_ORDER
    .map(d => ({ desk: d, items: brief.filter(b => b.desk === d) }))
    .filter(g => g.items.length > 0);

  return (
    <div className="flex flex-col rounded-xl border border-[var(--os-border-strong)] bg-[var(--os-card)] p-5 transition-colors duration-200 hover:border-[var(--os-border-hover)]">
      <div className="mb-4 flex items-center gap-2">
        <PetalMark className="size-4 text-[var(--os-ink-muted)]" />
        <h3 className="os-display text-[15px] text-[var(--os-ink)]">Today&apos;s brief</h3>
      </div>

      <div className="space-y-7">
        {desks.map(({ desk, items }) => (
          <section key={desk}>
            <div className="os-label mb-1.5 px-0.5">{briefDeskMeta[desk].label}</div>
            <div className="space-y-1">
              {items.map(item => (
                <BriefRow
                  key={item.id}
                  item={item}
                  open={openId === item.id}
                  onToggle={() => setOpenId(openId === item.id ? null : item.id)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <Link href="/os/activity" className={cn("-mx-2 mt-5 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] font-normal text-[var(--os-ink-muted)] transition-colors hover:text-[var(--os-ink)]", focusRing)}>
        View activity log <Icon icon={I.chevronRight} size={13} />
      </Link>
    </div>
  );
}

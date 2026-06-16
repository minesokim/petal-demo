"use client";

// WeeklyDigestLink - the ROI story lives as a sentence in the Today hero (Ferndesk's
// stats-as-a-sentence); this is the quiet trigger for the weekly digest. The modal mirrors
// the Knowledge page's reading language: a Petal context banner + a key-numbers table.
// Numbers derive from roiWeek().

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { roiWeek } from "@/lib/fixtures/derive";
import { FIRM_PROFILE } from "@/lib/fixtures/firm";
import { PetalMark } from "@/components/petal-mark";
import { Icon, I } from "@/components/os/icon";

const WEEK_LABEL = "Jun 22 – 25, 2026";

export function WeeklyDigestLink({ tone = "dark", className }: { tone?: "light" | "dark"; className?: string }) {
  const roi = roiWeek();
  const [open, setOpen] = useState(false);

  const rows: [string, string | number][] = [
    ["Actions run", roi.actions],
    ["Documents collected & filed", roi.docsCollected],
    ["Returns e-filed", roi.returnsFiled],
    ["Notice responses drafted", roi.noticesDrafted],
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "group inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium transition-colors",
          tone === "light"
            ? "text-white/70 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/80"
            : "text-[var(--os-ink-muted)] hover:text-[var(--os-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]",
          className,
        )}
      >
        <PetalMark className="size-3.5 shrink-0 transition-transform duration-500 ease-out group-hover:rotate-180" /> Weekly digest
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4 backdrop-blur-md"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              onClick={e => e.stopPropagation()}
              role="dialog" aria-modal="true" aria-label="Weekly digest"
              className="w-full max-w-[440px] overflow-hidden rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] shadow-xl"
            >
              {/* header (Knowledge reading-meta language) */}
              <div className="flex items-start justify-between gap-3 border-b border-[var(--os-border)] px-5 py-3.5">
                <div>
                  <div className="text-[11px] text-[var(--os-ink-subtle)]">{WEEK_LABEL}</div>
                  <h3 className="os-display text-[16px] font-semibold leading-tight text-[var(--os-ink)]">Weekly digest</h3>
                </div>
                <button
                  aria-label="Close"
                  onClick={() => setOpen(false)}
                  className="-mr-1 grid size-6 shrink-0 place-items-center rounded-md text-[var(--os-ink-subtle)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]"
                >
                  <Icon icon={I.close} size={15} />
                </button>
              </div>

              <div className="px-5 py-4">
                {/* Petal context banner (Knowledge "injected into every run" banner) */}
                <div className="flex items-center gap-2.5 rounded-lg bg-[var(--os-bg-subtle)] px-3.5 py-2.5">
                  <span className="grid size-7 shrink-0 place-items-center rounded-md bg-[var(--os-primary)] text-[var(--os-primary-fg)]">
                    <PetalMark className="size-4" />
                  </span>
                  <div className="text-[12px] text-[var(--os-ink-muted)]">
                    <span className="font-medium text-[var(--os-ink)]">Petal returned about {roi.hoursReturned} hours</span> this week at {FIRM_PROFILE.name} - every return pre-approved by you.
                  </div>
                </div>

                {/* key-numbers table */}
                <div className="os-label mb-2 mt-5">This week</div>
                <div className="divide-y divide-[var(--os-border)] rounded-lg border border-[var(--os-border)]">
                  {rows.map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between px-3.5 py-2">
                      <span className="text-[13px] text-[var(--os-ink)]">{label}</span>
                      <span className="text-[13px] font-medium tabular-nums text-[var(--os-ink)]">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* footer (Knowledge SourceModal language) */}
              <div className="flex items-center justify-between border-t border-[var(--os-border)] px-5 py-3">
                <Link
                  href="/os/activity"
                  onClick={() => setOpen(false)}
                  className="flex h-8 items-center gap-1.5 rounded-md px-2 text-[12px] font-medium text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]"
                >
                  <Icon icon={I.history} size={14} /> View activity log
                </Link>
                <button
                  onClick={() => setOpen(false)}
                  className="flex h-8 items-center rounded-md bg-[var(--os-primary)] px-3 text-[12px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--os-accent)]"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

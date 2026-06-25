"use client";

// DailyBriefLink — the banner's "Daily brief" trigger. Opens a short, TODAY-focused brief: what
// needs YOU today (your review queue + at-risk clients) plus the day's firm + season items from the
// REAL derived brief (review queue, blocked docs, deadlines). It is NOT the weekly ROI story — the
// "hours returned" line lives in the banner greeting + the activity log. The news desks (IRS /
// practice) live in the Weekly digest below. (File name is historical — was the ROI "digest" link.)

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useDerive } from "@/lib/client/firm-context";
import { useBrief } from "@/lib/client/brief-context";
import { PetalMark } from "@/components/petal-mark";
import { Icon, I } from "@/components/os/icon";
import { briefToneDot } from "@/lib/fixtures/firm";
import { DEMO_DATE_LABEL } from "@/lib/fixtures/vocab";

export function DailyBriefLink({ tone = "dark", className }: { tone?: "light" | "dark"; className?: string }) {
  const { needsYouTasks, healthCounts } = useDerive();
  const brief = useBrief();
  const [open, setOpen] = useState(false);

  const needsYou = needsYouTasks().length;
  const atRisk = healthCounts().at_risk;
  // "Your day" = the firm + season desks of the real brief (review queue, blocked docs, deadlines).
  const dayItems = brief.filter((b) => b.desk === "firm" || b.desk === "season");

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
        <PetalMark className="size-3.5 shrink-0 transition-transform duration-500 ease-out group-hover:rotate-[72deg]" /> Daily brief
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4 backdrop-blur-[6px]"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              onClick={e => e.stopPropagation()}
              role="dialog" aria-modal="true" aria-label="Daily brief"
              className="w-full max-w-[440px] overflow-hidden rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] shadow-xl"
            >
              {/* header */}
              <div className="flex items-start justify-between gap-3 border-b border-[var(--os-border)] px-5 py-3.5">
                <div>
                  <div className="text-[11px] text-[var(--os-ink-subtle)]">{DEMO_DATE_LABEL}</div>
                  <h3 className="os-display text-[16px] font-semibold leading-tight text-[var(--os-ink)]">Daily brief</h3>
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
                {/* Petal line — what needs you today (NOT the weekly ROI story) */}
                <div className="flex items-center gap-2.5 rounded-lg bg-[var(--os-bg-subtle)] px-3.5 py-2.5">
                  <span className="grid size-7 shrink-0 place-items-center rounded-md bg-[var(--os-primary)] text-[var(--os-primary-fg)]">
                    <PetalMark className="size-4" />
                  </span>
                  <div className="text-[12px] text-[var(--os-ink-muted)]">
                    {needsYou > 0 ? (
                      <>
                        <span className="font-medium text-[var(--os-ink)]">{needsYou} item{needsYou === 1 ? "" : "s"} need you today</span>
                        {atRisk > 0 ? `, and ${atRisk} client${atRisk === 1 ? " is" : "s are"} at risk.` : "."}
                      </>
                    ) : (
                      <span className="font-medium text-[var(--os-ink)]">Nothing urgent needs you today — you&apos;re clear.</span>
                    )}
                  </div>
                </div>

                {/* your day — the firm + season desks of the real brief */}
                {dayItems.length > 0 && (
                  <>
                    <div className="os-label mb-2 mt-5">Today</div>
                    <div className="space-y-1.5">
                      {dayItems.map((it) => (
                        <div key={it.id} className="flex gap-2.5 rounded-xl border border-[var(--os-border)] bg-[var(--os-card)] px-3.5 py-3">
                          <span className={cn("mt-[6px] size-1.5 shrink-0 rounded-full", briefToneDot[it.tone])} />
                          <div className="min-w-0 flex-1">
                            <div className="text-[12.5px] font-medium leading-snug text-[var(--os-ink)]">{it.headline}</div>
                            <div className="mt-0.5 text-[12px] leading-snug text-[var(--os-ink-muted)]">{it.detail}</div>
                            {it.action && (
                              <Link
                                href={it.action.href}
                                onClick={() => setOpen(false)}
                                className="mt-1.5 inline-flex items-center gap-1 text-[11.5px] font-medium text-[var(--os-ink-muted)] transition-colors hover:text-[var(--os-ink)]"
                              >
                                {it.action.label} <Icon icon={I.chevronRight} size={12} />
                              </Link>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* footer */}
              <div className="flex items-center justify-between border-t border-[var(--os-border)] px-5 py-3">
                <Link
                  href="/os/review"
                  onClick={() => setOpen(false)}
                  className="flex h-8 items-center gap-1.5 rounded-md px-2 text-[12px] font-medium text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]"
                >
                  <PetalMark className="size-3.5" /> Open review queue
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

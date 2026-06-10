"use client";

// WeeklyDigestLink — the ROI story lives as a sentence in the Today hero
// (Ferndesk's stats-as-a-sentence); this is the quiet trigger for the
// email-styled digest preview. Numbers derive from roiWeek().

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { roiWeek } from "@/lib/fixtures/derive";
import { FIRM_PROFILE } from "@/lib/fixtures/firm";
import { Icon, I } from "@/components/os/icon";

export function WeeklyDigestLink({ tone = "dark", className }: { tone?: "light" | "dark"; className?: string }) {
  const roi = roiWeek();
  const [digestOpen, setDigestOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setDigestOpen(true)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium transition-colors",
          tone === "light"
            ? "text-white/70 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/80"
            : "text-[var(--os-ink-muted)] hover:text-[var(--os-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]",
          className,
        )}
      >
        <Icon icon={I.mail} size={13} /> Weekly digest
      </button>

      <AnimatePresence>
        {digestOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/20 p-4"
            onClick={() => setDigestOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-[560px] overflow-hidden rounded-xl border border-[var(--os-border)] bg-white shadow-[0_8px_30px_rgba(17,17,26,0.12)]"
            >
              {/* email-styled digest preview */}
              <div className="flex items-center justify-between border-b border-[var(--os-border)] px-5 py-3">
                <span className="text-[13px] font-semibold text-[var(--os-ink)]">Weekly digest</span>
                <button aria-label="Close" onClick={() => setDigestOpen(false)} className="grid size-7 place-items-center rounded-md text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]">
                  <Icon icon={I.close} size={14} />
                </button>
              </div>
              <div className="px-5 py-4 text-[13px]">
                <div className="text-[11px] text-[var(--os-ink-subtle)]">
                  From: Petal &lt;digest@petal.app&gt; · To: {FIRM_PROFILE.owner.name} · Friday 7:00 AM
                </div>
                <h3 className="mt-3 text-[15px] font-semibold text-[var(--os-ink)]">Your week at {FIRM_PROFILE.name}</h3>
                <p className="mt-2 leading-relaxed text-[var(--os-ink)]">
                  Petal ran <strong>{roi.actions} actions</strong> this week: {roi.docsCollected} documents collected and filed,{" "}
                  {roi.returnsFiled} returns e-filed clean (pre-approved by you), and {roi.noticesDrafted} notice responses drafted.
                  That's roughly <strong>~{roi.hoursReturned} hours returned</strong> to the work only you can do.
                </p>
                <p className="mt-2 leading-relaxed text-[var(--os-ink-muted)]">
                  Every action is logged with its sources in the{" "}
                  <Link href="/os/activity" onClick={() => setDigestOpen(false)} className="text-[var(--os-accent)] hover:underline">activity log</Link>.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

"use client";

// RoiStats — the week's numbers as a composed stat bar, designed to sit INSIDE the
// Today hero banner (translucent row over the photo). Every number derives from the
// activity log via roiWeek(); hours come from the per-action minutes map.

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { roiWeek } from "@/lib/fixtures/derive";
import { FIRM_PROFILE } from "@/lib/fixtures/firm";
import { Icon, I } from "@/components/os/icon";

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[16px] font-semibold leading-tight tabular-nums text-white os-display">{value}</div>
      <div className="mt-0.5 truncate text-[11px] leading-tight text-white/60">{label}</div>
    </div>
  );
}

/** The translucent stat row for the hero banner. */
export function RoiStats() {
  const roi = roiWeek();
  const [digestOpen, setDigestOpen] = useState(false);

  return (
    <>
      <div className="relative flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-white/15 bg-white/[0.06] px-7 py-3.5 backdrop-blur-[2px]">
        <Stat value={roi.actions} label="actions this week" />
        <Stat value={roi.docsCollected} label="documents in" />
        <Stat value={roi.returnsFiled} label="returns filed" />
        <Stat value={roi.noticesDrafted} label="notices drafted" />
        <Stat value={`~${roi.hoursReturned}`} label="hours returned" />
        <button
          onClick={() => setDigestOpen(true)}
          className="ml-auto inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium text-white/70 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/80"
        >
          <Icon icon={I.mail} size={13} /> Weekly digest
        </button>
      </div>

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

/** @deprecated kept as an alias while pages migrate — renders the banner stat row. */
export const RoiStrip = RoiStats;

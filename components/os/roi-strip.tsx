"use client";

// ROI strip — replaces the Today banner image. Every number derives from the
// activity log via roiWeek(); hours come from the per-action minutes map.

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { roiWeek } from "@/lib/fixtures/derive";
import { FIRM_PROFILE } from "@/lib/fixtures/firm";
import { PetalMark } from "@/components/petal-mark";
import { Icon, I } from "@/components/os/icon";

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="text-[15px] font-semibold tabular-nums text-[var(--os-ink)]">{value}</span>
      <span className="text-[12px] text-[var(--os-ink-muted)]">{label}</span>
    </span>
  );
}

export function RoiStrip() {
  const roi = roiWeek();
  const [digestOpen, setDigestOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-[var(--os-border)] bg-[var(--os-card)] px-4 py-3">
        <span className="inline-flex items-center gap-2 text-[12px] font-medium text-[var(--os-ink-muted)]">
          <PetalMark className="size-3.5" /> This week
        </span>
        <Stat value={roi.actions} label="actions" />
        <span className="text-[var(--os-border-strong)]">·</span>
        <Stat value={roi.docsCollected} label="documents collected" />
        <span className="text-[var(--os-border-strong)]">·</span>
        <Stat value={roi.returnsFiled} label="returns filed" />
        <span className="text-[var(--os-border-strong)]">·</span>
        <Stat value={roi.noticesDrafted} label="notices drafted" />
        <span className="text-[var(--os-border-strong)]">·</span>
        <Stat value={`~${roi.hoursReturned} hrs`} label="returned" />
        <button
          onClick={() => setDigestOpen(true)}
          className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]"
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
                <span className="text-[13px] font-semibold">Weekly digest</span>
                <button aria-label="Close" onClick={() => setDigestOpen(false)} className="grid size-7 place-items-center rounded-md text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]">
                  <Icon icon={I.close} size={14} />
                </button>
              </div>
              <div className="px-5 py-4 text-[13px]">
                <div className="text-[11px] text-[var(--os-ink-subtle)]">
                  From: Petal &lt;digest@petal.app&gt; · To: {FIRM_PROFILE.owner.name} · Friday 7:00 AM
                </div>
                <h3 className="mt-3 text-[15px] font-semibold">Your week at {FIRM_PROFILE.name}</h3>
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

"use client";

// Today's call row → opens a pre-call brief modal. The brief is what Petal
// prepared: agenda, the open item to resolve, and client context. Read-only
// (it's a briefing); actions link to the record. Derives from lib/fixtures.

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import { Icon, I } from "@/components/os/icon";
import { SkillPetal } from "@/components/os/primitives";
import { ProvenancePanel } from "@/components/os/provenance";
import { householdById, engagementById } from "@/lib/fixtures/firm";
import { type SkillCategory } from "@/lib/fixtures/vocab";

const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]";
const initials = (n: string) => n.split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();

export function TodaysCall({
  householdId, engagementId, time, runId, skillCategory,
}: {
  householdId: string;
  engagementId?: string;
  time: string;
  runId?: string;
  skillCategory: SkillCategory;
}) {
  const [open, setOpen] = useState(false);
  const h = householdById(householdId);
  const eng = engagementId ? engagementById(engagementId) : undefined;
  const form = eng?.form;
  if (!h) return null;

  const subtitle = form ? `${form} review` : "Review call";
  const openItem = eng?.blockedBy;

  const agenda = [
    form ? `Walk through the ${form} draft together` : "Walk through the draft together",
    openItem ? `Resolve: ${openItem}` : "Confirm any open questions before filing",
    "Confirm signature & next steps",
  ];

  return (
    <>
      {/* row — opens the brief */}
      <button
        onClick={() => setOpen(true)}
        className={cn("group flex w-full items-center gap-3 rounded-lg py-1 text-left transition-colors", focusRing)}
      >
        <span className="w-14 shrink-0 text-[12px] tabular-nums text-[var(--os-ink-muted)]">{time}</span>
        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[var(--os-selected)] text-[10px] font-semibold text-[var(--os-ink-muted)]">{initials(h.name)}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium text-[var(--os-ink)] group-hover:underline">{h.name}</span>
          <span className="block truncate text-[12px] text-[var(--os-ink-muted)]">{subtitle}</span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-1.5 text-[12px] text-[var(--os-ink-muted)]">
          <SkillPetal category={skillCategory} size={18} /> View brief
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.14 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4 backdrop-blur-[6px]"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 10 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              onClick={e => e.stopPropagation()}
              role="dialog" aria-modal="true" aria-label="Pre-call brief"
              className="flex max-h-[88vh] w-full max-w-[520px] flex-col overflow-hidden rounded-xl border border-[var(--os-border)] bg-[var(--os-surface)] shadow-xl"
            >
              {/* header */}
              <div className="flex items-start justify-between gap-3 border-b border-[var(--os-border)] px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--os-selected)] text-[12px] font-semibold text-[var(--os-ink-muted)]">{initials(h.name)}</span>
                  <div>
                    <h2 className="os-display text-[16px] font-semibold leading-tight text-[var(--os-ink)]">{h.name}</h2>
                    <p className="mt-0.5 text-[12px] text-[var(--os-ink-muted)]">{time} · {subtitle}</p>
                  </div>
                </div>
                <button aria-label="Close" onClick={() => setOpen(false)} className={cn("-mr-1 grid size-7 shrink-0 place-items-center rounded-md text-[var(--os-ink-subtle)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]", focusRing)}>
                  <Icon icon={I.close} size={15} />
                </button>
              </div>

              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
                {/* Petal context banner */}
                <div className="flex items-start gap-2.5 rounded-lg bg-[var(--os-bg-subtle)] px-3.5 py-2.5">
                  <span className="grid size-7 shrink-0 place-items-center rounded-md bg-[var(--os-primary)] text-[var(--os-primary-fg)]"><PetalMark className="size-4" /></span>
                  <p className="text-[12.5px] leading-relaxed text-[var(--os-ink-muted)]">{h.catchUp}</p>
                </div>

                {/* Agenda */}
                <div>
                  <div className="os-label mb-2">Agenda</div>
                  <ul className="space-y-2">
                    {agenda.map((a, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-[13px] leading-snug text-[var(--os-ink)]">
                        <span className="mt-[3px] grid size-4 shrink-0 place-items-center rounded-full bg-[var(--os-selected)] text-[10px] font-medium tabular-nums text-[var(--os-ink-muted)]">{i + 1}</span>
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* the run that produced the brief */}
                {runId && (
                  <div>
                    <div className="os-label mb-2">How Petal prepared this</div>
                    <ProvenancePanel runId={runId} defaultOpen />
                  </div>
                )}
              </div>

              {/* footer */}
              <div className="flex items-center justify-between border-t border-[var(--os-border)] px-5 py-3">
                <Link href={`/os/clients/${h.id}`} onClick={() => setOpen(false)} className="flex h-8 items-center gap-1.5 rounded-md px-2 text-[12px] font-medium text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]">
                  Open client <Icon icon={I.chevronRight} size={13} />
                </Link>
                <button onClick={() => setOpen(false)} className="flex h-8 items-center rounded-md bg-[var(--os-primary)] px-3 text-[12px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97]">
                  Mark prepped
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

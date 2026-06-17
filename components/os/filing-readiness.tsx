"use client";

// Filing readiness - the Today card opens an ANALYTICS modal: overall readiness, a
// breakdown by return type and by risk reason, and an at-risk client roster with
// avatars. Read-only (it's a dashboard, not a queue). Derives from lib/fixtures/derive.

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Icon, I } from "@/components/os/icon";
import { Badge } from "@/components/os/primitives";
import { filingReadiness, atRiskHouseholds, filingStateOf } from "@/lib/fixtures/derive";
import { engagements } from "@/lib/fixtures/firm";
import { healthMeta } from "@/lib/fixtures/vocab";

const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]";

const STATS = [
  { key: "filed", label: "Filed", dot: "bg-emerald-500" },
  { key: "onTrack", label: "On track", dot: "bg-blue-500" },
  { key: "atRisk", label: "At risk", dot: "bg-amber-500" },
] as const;

/** Shared readiness bar + 3 stat blocks (card + modal overview). */
function ReadinessSummary({ fr, size = "card" }: { fr: ReturnType<typeof filingReadiness>; size?: "card" | "modal" }) {
  const pct = (n: number) => (fr.total ? (n / fr.total) * 100 : 0);
  return (
    <>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-[var(--os-selected)]">
        <div className="h-full bg-emerald-500" style={{ width: `${pct(fr.filed)}%` }} />
        <div className="h-full bg-blue-500" style={{ width: `${pct(fr.onTrack)}%` }} />
        <div className="h-full bg-amber-500" style={{ width: `${pct(fr.atRisk)}%` }} />
      </div>
      <div className={cn("mt-3.5 flex items-center", size === "modal" ? "gap-12" : "gap-10")}>
        {STATS.map(s => (
          <div key={s.key}>
            <div className="flex items-center gap-1.5 text-[12px] text-[var(--os-ink-muted)]">
              <span className={cn("size-2 rounded-full", s.dot)} /> {s.label}
            </div>
            <div className="os-display mt-1 text-[20px] font-semibold tabular-nums text-[var(--os-ink)]">{fr[s.key]}</div>
          </div>
        ))}
      </div>
    </>
  );
}

/** Ramp-style radial gauge - animated arc with the figure centered. */
function RadialGauge({ value, label, sublabel, color }: { value: number; label: string; sublabel: string; color: string }) {
  const r = 50;
  const circ = 2 * Math.PI * r;
  const dash = Math.max(0, Math.min(100, value)) / 100 * circ;
  return (
    <div className="flex flex-col items-center rounded-xl border border-[var(--os-border)] px-4 py-5">
      <div className="relative grid place-items-center">
        <svg width="124" height="124" viewBox="0 0 124 124">
          <g transform="rotate(-90 62 62)">
            <circle cx="62" cy="62" r={r} fill="none" stroke="var(--os-selected)" strokeWidth="9" />
            <motion.circle
              cx="62" cy="62" r={r} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
              strokeDasharray={circ}
              initial={{ strokeDashoffset: circ }}
              animate={{ strokeDashoffset: circ - dash }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            />
          </g>
        </svg>
        <span className="absolute os-display text-[27px] font-semibold tabular-nums text-[var(--os-ink)]">{value}%</span>
      </div>
      <div className="mt-3 text-center">
        <div className="text-[13px] font-medium text-[var(--os-ink)]">{label}</div>
        <div className="mt-0.5 text-[11.5px] text-[var(--os-ink-muted)]">{sublabel}</div>
      </div>
    </div>
  );
}

function ClientAvatar({ name, size = 30 }: { name: string; size?: number }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full bg-[var(--os-selected)] font-semibold text-[var(--os-ink-muted)]"
      style={{ width: size, height: size, fontSize: size <= 26 ? 10 : 11 }}
    >
      {initials}
    </span>
  );
}

export function FilingReadiness() {
  const [open, setOpen] = useState(false);
  const fr = filingReadiness();
  const lagging = atRiskHouseholds();


  const onTrackShare = fr.total ? Math.round(((fr.filed + fr.onTrack) / fr.total) * 100) : 0;

  // two gauge metrics - our own context (readiness vs. money collected)
  const depositsPaid = engagements.filter(e => e.depositPaid).length;
  const depositShare = fr.total ? Math.round((depositsPaid / fr.total) * 100) : 0;

  return (
    <>
      {/* card - opens the modal */}
      <button
        onClick={() => setOpen(true)}
        className={cn("block w-full rounded-xl border border-[var(--os-border-strong)] bg-[var(--os-card)] p-5 text-left transition-colors duration-200 hover:border-[var(--os-border-hover)]", focusRing)}
      >
        <div className="flex items-center justify-between">
          <h3 className="os-display text-[15px] font-semibold text-[var(--os-ink)]">Filing readiness</h3>
          <span className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--os-ink-muted)]">
            <span className="tabular-nums">{fr.total}</span> returns <Icon icon={I.chevronRight} size={13} className="text-[var(--os-ink-subtle)]" />
          </span>
        </div>
        <p className="mt-0.5 text-[12px] text-[var(--os-ink-muted)]">Extension season - Sep 15 business, Oct 15 individual</p>
        <div className="mt-4"><ReadinessSummary fr={fr} /></div>
      </button>

      {/* modal - analytics */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4 backdrop-blur-[6px]"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 10 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              onClick={e => e.stopPropagation()}
              role="dialog" aria-modal="true" aria-label="Filing readiness"
              className="flex max-h-[88vh] w-full max-w-[760px] select-none flex-col overflow-hidden rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] shadow-xl"
            >
              {/* header */}
              <div className="flex items-start justify-between gap-3 border-b border-[var(--os-border)] px-6 py-4">
                <div>
                  <h2 className="os-display text-[18px] font-semibold leading-tight text-[var(--os-ink)]">Filing readiness</h2>
                  <p className="mt-0.5 text-[12px] text-[var(--os-ink-muted)]">Extension season · {fr.total} returns · <span className="font-medium text-[var(--os-ink)] tabular-nums">{onTrackShare}%</span> filed or on track</p>
                </div>
                <button aria-label="Close" onClick={() => setOpen(false)} className={cn("-mr-1 grid size-7 shrink-0 place-items-center rounded-md text-[var(--os-ink-subtle)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]", focusRing)}>
                  <Icon icon={I.close} size={15} />
                </button>
              </div>

              <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
                {/* overview */}
                <div>
                  <div className="os-label mb-2.5">Overall</div>
                  <ReadinessSummary fr={fr} size="modal" />
                  <div className="mt-5 grid grid-cols-2 gap-4">
                    <RadialGauge value={onTrackShare} label="On track to file" sublabel={`${fr.filed + fr.onTrack} of ${fr.total} returns`} color="var(--os-brand)" />
                    <RadialGauge value={depositShare} label="Deposits collected" sublabel={`${depositsPaid} of ${fr.total} paid`} color="#2563eb" />
                  </div>
                </div>

                {/* at-risk roster - avatars, read-only */}
                <div>
                  <div className="os-label mb-2.5">At-risk clients <span className="tabular-nums text-[var(--os-ink-subtle)]">{lagging.length}</span></div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {lagging.map(x => (
                      <Link
                        key={x.household.id}
                        href={`/os/clients/${x.household.id}`}
                        onClick={() => setOpen(false)}
                        className={cn("flex items-center gap-3 rounded-xl border border-[var(--os-border)] p-3 transition-colors hover:border-[var(--os-border-strong)] hover:bg-[var(--os-hover)]", focusRing)}
                      >
                        <ClientAvatar name={x.household.name} size={32} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13px] font-medium text-[var(--os-ink)]">{x.household.name}</div>
                          <div className="truncate text-[11.5px] text-[var(--os-ink-muted)]">{x.reason}</div>
                        </div>
                        <Badge tone={x.health === "at_risk" ? "red" : "amber"} size="sm">{healthMeta[x.health].label}</Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* footer */}
              <div className="flex items-center justify-between border-t border-[var(--os-border)] px-6 py-3">
                <span className="text-[11px] text-[var(--os-ink-subtle)]">
                  <span className="font-medium text-[var(--os-ink-muted)] tabular-nums">{fr.filed}</span> filed · <span className="font-medium text-[var(--os-ink-muted)] tabular-nums">{fr.onTrack}</span> on track · <span className="font-medium text-[var(--os-ink-muted)] tabular-nums">{fr.atRisk}</span> at risk
                </span>
                <Link href="/os/clients" onClick={() => setOpen(false)} className="flex h-8 items-center gap-1.5 rounded-md px-2 text-[12px] font-medium text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]">
                  All clients <Icon icon={I.chevronRight} size={13} />
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

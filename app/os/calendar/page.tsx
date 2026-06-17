"use client";

// /os/calendar - the firm scheduling calendar. Month grid in the Notion/Linear
// idiom (hairline cells, day numbers, today circled, events as dot + text) + an
// Upcoming rail. This surface is for SCHEDULED things (meetings, calls, focus
// blocks, office closures) - deadlines live in Today/Tasks/Notices. Clicking an
// event opens a detail modal; nothing navigates away. Opens on June 2026.

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Icon, I } from "@/components/os/icon";
import { PetalMark } from "@/components/petal-mark";
import { fmtDateYear } from "@/lib/fixtures/vocab";
import { householdById } from "@/lib/fixtures/firm";
import { calendarEvents, calEventMeta, eventsOn, upcomingEvents, type CalEvent, type CalEventType } from "@/lib/fixtures/calendar";

const FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]";
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const iso = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

/** whole-day difference between two ISO dates (base is "today") */
const dayDiff = (dateIso: string, baseIso: string) =>
  Math.round((Date.parse(dateIso) - Date.parse(baseIso)) / 86_400_000);

/** the week grid of ISO dates covering `month` of `year` (Sun-started weeks) */
function monthGrid(year: number, month: number): string[] {
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  const weeks = Math.ceil((first.getDay() + new Date(year, month + 1, 0).getDate()) / 7);
  const cells: string[] = [];
  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push(iso(d.getFullYear(), d.getMonth(), d.getDate()));
  }
  return cells;
}

function whenLabel(dateIso: string, todayIso: string): string {
  const dleft = dayDiff(dateIso, todayIso);
  return dleft === 0 ? "Today" : dleft === 1 ? "Tomorrow" : dleft > 0 ? `in ${dleft} days` : fmtDateYear(dateIso);
}

/** Soft tinted chip per event type — the month-grid event look (colored fill + dot + title). */
const EVENT_TONE: Record<CalEventType, { chip: string; dot: string; text: string }> = {
  meeting: { chip: "bg-amber-100/70 hover:bg-amber-100", dot: "bg-amber-500", text: "text-amber-900" },
  block: { chip: "bg-violet-100/70 hover:bg-violet-100", dot: "bg-violet-500", text: "text-violet-900" },
  office: { chip: "bg-[var(--os-selected)] hover:bg-[var(--os-border)]", dot: "bg-[var(--os-ink-subtle)]", text: "text-[var(--os-ink-muted)]" },
};

export default function CalendarPage() {
  // real current date — the calendar tracks today, not the demo's frozen date
  const now = new Date();
  const todayIso = iso(now.getFullYear(), now.getMonth(), now.getDate());

  const [view, setView] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [open, setOpen] = useState<CalEvent | null>(null);
  const cells = monthGrid(view.year, view.month);
  const upcoming = upcomingEvents(todayIso, 8);

  const go = (delta: number) => {
    const m = view.month + delta;
    setView({ year: view.year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 });
  };
  const today = () => setView({ year: now.getFullYear(), month: now.getMonth() });

  return (
    <div className="flex h-full flex-col">
      {/* header */}
      <div className="flex items-center gap-3 border-b border-[var(--os-border)] px-8 py-4">
        <h1 className="os-display text-[20px] font-semibold text-[var(--os-ink)]">
          {MONTHS[view.month]} <span className="tabular-nums text-[var(--os-ink-muted)]">{view.year}</span>
        </h1>
        <div className="ml-auto flex items-center gap-1.5">
          <button onClick={today} className={cn("h-7 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2.5 text-[12px] font-medium text-[var(--os-ink)] transition-colors hover:bg-[var(--os-hover)]", FOCUS)}>Today</button>
          <div className="flex items-center rounded-md border border-[var(--os-border)] p-0.5">
            <button onClick={() => go(-1)} aria-label="Previous month" className={cn("grid size-6 place-items-center rounded text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]", FOCUS)}><Icon icon={I.chevronLeft} size={15} /></button>
            <button onClick={() => go(1)} aria-label="Next month" className={cn("grid size-6 place-items-center rounded text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]", FOCUS)}><Icon icon={I.chevronRight} size={15} /></button>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* ── month grid ── */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="grid grid-cols-7 border-b border-[var(--os-border)]">
            {WEEKDAYS.map(d => (
              <div key={d} className="px-2 py-1.5 text-[11px] font-medium text-[var(--os-ink-muted)]">{d}</div>
            ))}
          </div>
          <div
            className="grid min-h-0 flex-1 grid-cols-7 overflow-y-auto"
            style={{ gridTemplateRows: `repeat(${cells.length / 7}, minmax(96px, 1fr))` }}
          >
            {cells.map((d, i) => {
              const day = Number(d.slice(8, 10));
              const inMonth = Number(d.slice(5, 7)) === view.month + 1;
              const isToday = d === todayIso;
              const evts = eventsOn(d);
              return (
                <div
                  key={d}
                  className={cn(
                    "min-w-0 border-b border-r border-[var(--os-border)] p-1.5",
                    i % 7 === 0 && "border-l",
                    !inMonth && "bg-[var(--os-bg-subtle)]",
                  )}
                >
                  <div className="mb-1 flex items-center px-1">
                    <span
                      className={cn(
                        "grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 text-[11px] font-medium tabular-nums",
                        isToday ? "bg-red-500 text-white" : inMonth ? "text-[var(--os-ink)]" : "text-[var(--os-ink-subtle)]",
                      )}
                    >
                      {day}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {evts.slice(0, 3).map(e => {
                      const t = EVENT_TONE[e.type];
                      return (
                        <button
                          key={e.id}
                          onClick={() => setOpen(e)}
                          className={cn("flex w-full items-center gap-1.5 rounded-[5px] px-1.5 py-[3px] text-left text-[11px] font-medium leading-tight transition-colors", t.chip, FOCUS, e.done && "opacity-55")}
                        >
                          <span className={cn("size-1.5 shrink-0 rounded-full", t.dot, e.done && "opacity-50")} />
                          <span className={cn("min-w-0 flex-1 truncate", t.text, e.done && "line-through decoration-current/40")}>{e.title}</span>
                        </button>
                      );
                    })}
                    {evts.length > 3 && (
                      <div className="px-1 text-[10.5px] font-medium text-[var(--os-ink-muted)]">+{evts.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Upcoming rail ── */}
        <div className="hidden w-[300px] shrink-0 flex-col border-l border-[var(--os-border)] lg:flex">
          <div className="border-b border-[var(--os-border)] px-5 py-3">
            <h2 className="text-[13px] font-semibold text-[var(--os-ink)]">Upcoming</h2>
            <p className="mt-0.5 text-[11px] text-[var(--os-ink-muted)]">Your next scheduled meetings and blocks.</p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
            {upcoming.map(e => {
              const hh = e.householdId ? householdById(e.householdId) : undefined;
              return (
                <button
                  key={e.id}
                  onClick={() => setOpen(e)}
                  className={cn("flex w-full items-start gap-2.5 rounded-md px-3 py-2 text-left transition-colors hover:bg-[var(--os-hover)]", FOCUS)}
                >
                  <span className={cn("mt-1 size-2 shrink-0 rounded-full", calEventMeta[e.type].dot)} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-[var(--os-ink)]">{e.title}</div>
                    <div className="truncate text-[11px] text-[var(--os-ink-muted)]">
                      {e.time ? `${e.time} · ` : ""}{whenLabel(e.date, todayIso)}{hh ? ` · ${hh.name}` : ""}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="border-t border-[var(--os-border)] px-5 py-3">
            <div className="flex flex-wrap gap-x-3 gap-y-1.5">
              {(Object.keys(calEventMeta) as (keyof typeof calEventMeta)[]).map(t => (
                <span key={t} className="inline-flex items-center gap-1.5 text-[11px] text-[var(--os-ink-muted)]">
                  <span className={cn("size-1.5 rounded-full", calEventMeta[t].dot)} /> {calEventMeta[t].label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── event detail modal ── */}
      <EventModal event={open} onClose={() => setOpen(null)} />
    </div>
  );
}

function Field({ icon, children }: { icon: typeof I.calendar; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 text-[13px]">
      <Icon icon={icon} size={15} className="mt-0.5 shrink-0 text-[var(--os-ink-subtle)]" />
      <span className="min-w-0 flex-1 text-[var(--os-ink)]">{children}</span>
    </div>
  );
}

function EventModal({ event, onClose }: { event: CalEvent | null; onClose: () => void }) {
  const e = event;
  const hh = e?.householdId ? householdById(e.householdId) : undefined;
  return (
    <AnimatePresence>
      {e && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-center bg-black/20 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            onClick={ev => ev.stopPropagation()}
            className="w-full max-w-[440px] overflow-hidden rounded-md border border-[var(--os-border)] bg-white shadow-[0_12px_40px_-8px_rgba(17,17,26,0.22)]"
          >
            {/* header */}
            <div className="flex items-center gap-2 border-b border-[var(--os-border)] px-5 py-3">
              <span className={cn("size-2 shrink-0 rounded-full", calEventMeta[e.type].dot)} />
              <span className="text-[12px] font-medium text-[var(--os-ink-muted)]">{calEventMeta[e.type].label}</span>
              {e.done && <span className="rounded-full bg-[var(--os-selected)] px-1.5 py-0.5 text-[10.5px] font-medium text-[var(--os-ink-muted)]">Completed</span>}
              <button onClick={onClose} aria-label="Close" className={cn("ml-auto grid size-7 place-items-center rounded-md text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]", FOCUS)}>
                <Icon icon={I.close} size={15} />
              </button>
            </div>

            {/* body */}
            <div className="space-y-3 px-5 py-4">
              <h3 className="os-display text-[16px] font-semibold leading-snug text-[var(--os-ink)]">{e.title}</h3>
              <Field icon={I.calendar}>
                {fmtDateYear(e.date)}{e.time ? <span className="text-[var(--os-ink-muted)]"> · {e.time}{e.endTime ? `–${e.endTime}` : ""}</span> : null}
              </Field>
              {e.location && <Field icon={e.location === "Zoom" ? I.globe : e.location === "Phone" ? I.call : I.building}>{e.location}</Field>}
              {e.with && (
                <Field icon={I.persona}>
                  {e.with}{hh ? <span className="text-[var(--os-ink-muted)]"> · {hh.name}</span> : null}
                </Field>
              )}
              {e.notes && (
                <div className="rounded-lg border border-[var(--os-border)] bg-[var(--os-card)] px-3 py-2.5">
                  <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-[var(--os-ink-muted)]"><PetalMark className="size-3" /> Notes</div>
                  <p className="text-[12.5px] leading-relaxed text-[var(--os-ink)]">{e.notes}</p>
                </div>
              )}
            </div>

            {/* actions */}
            <div className="flex items-center gap-1.5 border-t border-[var(--os-border)] px-5 py-3">
              {hh && (
                <Link href={`/os/clients/${hh.id}`} className={cn("inline-flex h-8 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-3 text-[13px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97]", FOCUS)}>
                  Open client record <Icon icon={I.chevronRight} size={13} />
                </Link>
              )}
              {!e.done && e.location && e.location !== "In office" && (
                <button className={cn("inline-flex h-8 items-center gap-1.5 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-3 text-[13px] font-medium text-[var(--os-ink)] transition-colors hover:bg-[var(--os-hover)]", FOCUS)}>
                  <Icon icon={e.location === "Zoom" ? I.globe : I.call} size={14} /> Join {e.location}
                </button>
              )}
              <button onClick={onClose} className={cn("ml-auto inline-flex h-8 items-center rounded-md px-2.5 text-[13px] font-medium text-[var(--os-ink-muted)] transition-colors hover:text-[var(--os-ink)]", FOCUS)}>
                Reschedule
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

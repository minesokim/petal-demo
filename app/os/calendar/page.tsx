"use client";

// /os/calendar — the firm calendar. Month grid in the Notion/Linear idiom
// (hairline grid, day numbers top-left, today circled, events as dot + text),
// plus an Upcoming rail of the deadlines and calls that matter. Demo date is
// Thursday, June 25, 2026, so the calendar opens on June 2026.

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Icon, I } from "@/components/os/icon";
import { DEMO_DATE, daysUntil } from "@/lib/fixtures/vocab";
import { householdById } from "@/lib/fixtures/firm";
import { calendarEvents, calEventMeta, eventsOn, upcomingEvents, type CalEvent } from "@/lib/fixtures/calendar";

const FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]";
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const iso = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

const TODAY_ISO = iso(DEMO_DATE.getFullYear(), DEMO_DATE.getMonth(), DEMO_DATE.getDate());

/** the 5–6 week grid of ISO dates covering `month` of `year` (Sun-started weeks) */
function monthGrid(year: number, month: number): string[] {
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay()); // back up to Sunday
  const weeks = Math.ceil((first.getDay() + new Date(year, month + 1, 0).getDate()) / 7);
  const cells: string[] = [];
  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push(iso(d.getFullYear(), d.getMonth(), d.getDate()));
  }
  return cells;
}

function EventRow({ e, compact }: { e: CalEvent; compact?: boolean }) {
  const inner = (
    <>
      <span className={cn("mt-[5px] size-1.5 shrink-0 rounded-full", calEventMeta[e.type].dot, e.done && "opacity-40")} />
      <span className="min-w-0 flex-1 truncate">
        {e.time && <span className="mr-1 tabular-nums text-[var(--os-ink-subtle)]">{e.time}</span>}
        <span className={cn(e.done ? "text-[var(--os-ink-subtle)] line-through decoration-[var(--os-border-strong)]" : "text-[var(--os-ink)]")}>{e.title}</span>
      </span>
    </>
  );
  const cls = cn("flex items-start gap-1.5 rounded px-1 py-0.5 text-[11px] leading-tight transition-colors", e.href && "hover:bg-[var(--os-selected)]", compact && "py-px");
  return e.href ? (
    <Link href={e.href} className={cn(cls, FOCUS)} onClick={ev => ev.stopPropagation()}>{inner}</Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

export default function CalendarPage() {
  // open on the demo month
  const [view, setView] = useState({ year: DEMO_DATE.getFullYear(), month: DEMO_DATE.getMonth() });
  const cells = monthGrid(view.year, view.month);
  const upcoming = upcomingEvents(TODAY_ISO, 7);

  const go = (delta: number) => {
    const m = view.month + delta;
    setView({ year: view.year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 });
  };
  const today = () => setView({ year: DEMO_DATE.getFullYear(), month: DEMO_DATE.getMonth() });

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
          {/* weekday header */}
          <div className="grid grid-cols-7 border-b border-[var(--os-border)]">
            {WEEKDAYS.map(d => (
              <div key={d} className="px-2 py-1.5 text-[11px] font-medium text-[var(--os-ink-muted)]">{d}</div>
            ))}
          </div>
          {/* cells */}
          <div
            className="grid min-h-0 flex-1 grid-cols-7 overflow-y-auto"
            style={{ gridTemplateRows: `repeat(${cells.length / 7}, minmax(96px, 1fr))` }}
          >
            {cells.map((d, i) => {
              const day = Number(d.slice(8, 10));
              const inMonth = Number(d.slice(5, 7)) === view.month + 1;
              const isToday = d === TODAY_ISO;
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
                    {evts.slice(0, 3).map(e => <EventRow key={e.id} e={e} />)}
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
            <p className="mt-0.5 text-[11px] text-[var(--os-ink-muted)]">What's next on the firm's calendar.</p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
            {upcoming.map(e => {
              const hh = e.householdId ? householdById(e.householdId) : undefined;
              const dleft = daysUntil(e.date);
              const when = dleft === 0 ? "Today" : dleft === 1 ? "Tomorrow" : `in ${dleft} days`;
              const row = (
                <>
                  <span className={cn("mt-1 size-2 shrink-0 rounded-full", calEventMeta[e.type].dot)} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-[var(--os-ink)]">{e.title}</div>
                    <div className="truncate text-[11px] text-[var(--os-ink-muted)]">
                      {e.time ? `${e.time} · ` : ""}{when}{hh ? ` · ${hh.name}` : ""}
                    </div>
                  </div>
                  {e.type === "deadline" && (
                    <span className={cn("shrink-0 text-[11px] font-medium tabular-nums", dleft < 14 ? "text-[var(--os-danger)]" : "text-[var(--os-ink-subtle)]")}>{dleft}d</span>
                  )}
                </>
              );
              const cls = "flex items-start gap-2.5 rounded-md px-3 py-2 transition-colors hover:bg-[var(--os-hover)]";
              return e.href ? (
                <Link key={e.id} href={e.href} className={cn(cls, FOCUS)}>{row}</Link>
              ) : (
                <div key={e.id} className={cls}>{row}</div>
              );
            })}
          </div>
          {/* legend */}
          <div className="border-t border-[var(--os-border)] px-5 py-3">
            <div className="flex flex-wrap gap-x-3 gap-y-1.5">
              {(Object.keys(calEventMeta) as (keyof typeof calEventMeta)[])
                .filter(t => calendarEvents.some(e => e.type === t))
                .map(t => (
                  <span key={t} className="inline-flex items-center gap-1.5 text-[11px] text-[var(--os-ink-muted)]">
                    <span className={cn("size-1.5 rounded-full", calEventMeta[t].dot)} /> {calEventMeta[t].label}
                  </span>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

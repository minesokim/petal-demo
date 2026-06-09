"use client";

// Activity — the firm-wide immutable log (the flight recorder). Every run and
// approval lands here; nothing can be edited. All rows come from activityFeed().

import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import { Icon, I } from "@/components/os/icon";
import { ProvenancePanel } from "@/components/os/provenance";
import { households, skills, householdById, type ActivityEvent } from "@/lib/fixtures/firm";
import { activityFeed } from "@/lib/fixtures/derive";
import { DEMO_DATE, fmtDate } from "@/lib/fixtures/vocab";

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]";

/** ISO date for a day number in the demo month (June 2026, from the canon clock). */
function isoOfDay(day: number): string {
  const y = DEMO_DATE.getFullYear();
  const m = String(DEMO_DATE.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-${String(day).padStart(2, "0")}`;
}

/** "Wednesday, Jun 24" — weekday derived from the day number, never hard-coded. */
function dayHeading(day: number): string {
  return new Date(DEMO_DATE.getFullYear(), DEMO_DATE.getMonth(), day).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function csvField(v: string): string {
  return `"${v.replace(/"/g, '""')}"`;
}

/** Build the CSV from activityFeed() and really download it. */
function exportCsv() {
  const header = ["Date", "Time", "Actor", "Kind", "Event", "Client", "Run"];
  const lines = [
    header,
    ...activityFeed().map(a => [
      isoOfDay(a.day),
      a.at,
      a.actor,
      a.kind,
      a.label,
      a.householdId ? householdById(a.householdId)?.name ?? "" : "",
      a.runId ?? "",
    ]),
  ].map(row => row.map(csvField).join(","));
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "petal-activity-log.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Actor chip — PetalMark for Petal (AI layer), flat initials for the human. */
function ActorChip({ actor }: { actor: ActivityEvent["actor"] }) {
  if (actor === "Petal") {
    return (
      <span
        title="Petal"
        className="grid size-5 shrink-0 place-items-center rounded-full border border-[var(--os-border)] bg-white"
      >
        <PetalMark className="size-3 text-[var(--os-ink-muted)]" />
        <span className="sr-only">Petal</span>
      </span>
    );
  }
  return (
    <span
      title={actor}
      className="grid size-5 shrink-0 place-items-center rounded-full bg-[var(--os-selected)] text-[9px] font-semibold text-[var(--os-ink-muted)]"
    >
      AV<span className="sr-only">{actor}</span>
    </span>
  );
}

function ActivityLog() {
  const searchParams = useSearchParams();
  const runParam = searchParams.get("run");

  const [client, setClient] = useState<string>("all");
  const [skill, setSkill] = useState<string>("all");
  const [day, setDay] = useState<"all" | number>("all");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const focusRowRef = useRef<HTMLDivElement | null>(null);

  // The deep-linked row: first event carrying ?run='s runId, in feed order.
  const focusEventId = useMemo(() => {
    if (!runParam) return null;
    return activityFeed().find(a => a.runId === runParam)?.id ?? null;
  }, [runParam]);

  useEffect(() => {
    if (!focusEventId) return;
    setExpanded(prev => {
      const next = new Set(prev);
      next.add(focusEventId);
      return next;
    });
    const t = setTimeout(
      () => focusRowRef.current?.scrollIntoView({ block: "center", behavior: "smooth" }),
      60,
    );
    return () => clearTimeout(t);
  }, [focusEventId]);

  const list = activityFeed({
    householdId: client === "all" ? undefined : client,
    skillId: skill === "all" ? undefined : skill,
    day: day === "all" ? undefined : day,
  });

  // Days present in the full log drive both the select and the grouping.
  const allDays = useMemo(
    () => [...new Set(activityFeed().map(a => a.day))].sort((a, b) => a - b),
    [],
  );
  const visibleDays = [...new Set(list.map(a => a.day))]; // feed is day-desc already

  const filtered = client !== "all" || skill !== "all" || day !== "all";
  const clearFilters = () => {
    setClient("all");
    setSkill("all");
    setDay("all");
  };

  const toggleRun = (id: string) =>
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectCls = cn(
    "h-7 max-w-[160px] rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2 text-[12px] text-[var(--os-ink)]",
    focusRing,
  );

  return (
    <div className="flex h-full flex-col">
      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--os-border)] px-8 pt-6 pb-5">
        <div>
          <h1 className="os-display text-[24px] font-semibold text-[var(--os-ink)]">Activity</h1>
          <p className="mt-1 text-[13px] text-[var(--os-ink-muted)]">
            Every run and approval, logged. Nothing here can be edited.
          </p>
        </div>
        <button
          onClick={exportCsv}
          className={cn(
            "flex h-7 items-center gap-1.5 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2.5 text-[12px] font-medium text-[var(--os-ink)] transition-colors hover:bg-[var(--os-hover)] active:scale-[0.97]",
            focusRing,
          )}
        >
          <Icon icon={I.export} size={13} className="text-[var(--os-ink-muted)]" />
          Export
        </button>
      </div>

      {/* filters */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-[var(--os-border)] px-8 py-1.5">
        <select value={client} onChange={e => setClient(e.target.value)} aria-label="Client" className={selectCls}>
          <option value="all">All clients</option>
          {households.map(h => (
            <option key={h.id} value={h.id}>{h.name}</option>
          ))}
        </select>
        <select value={skill} onChange={e => setSkill(e.target.value)} aria-label="Skill" className={selectCls}>
          <option value="all">All skills</option>
          {skills.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select
          value={day === "all" ? "all" : String(day)}
          onChange={e => setDay(e.target.value === "all" ? "all" : Number(e.target.value))}
          aria-label="Day"
          className={selectCls}
        >
          <option value="all">All days</option>
          {allDays.map(d => (
            <option key={d} value={d}>{fmtDate(isoOfDay(d))}</option>
          ))}
        </select>
        {filtered && (
          <button
            onClick={clearFilters}
            className={cn("h-7 rounded-md px-2 text-[12px] text-[var(--os-ink-muted)] transition-colors hover:text-[var(--os-ink)]", focusRing)}
          >
            Clear filters
          </button>
        )}
        <span className="ml-auto text-[12px] tabular-nums text-[var(--os-ink-muted)]">
          {list.length} {list.length === 1 ? "event" : "events"}
        </span>
      </div>

      {/* the log */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="px-8 py-6">
          {list.length === 0 ? (
            <div className="grid place-items-center gap-2 rounded-lg border border-dashed border-[var(--os-border-strong)] px-4 py-10 text-center">
              <PetalMark className="size-4 text-[var(--os-ink-subtle)]" />
              <p className="text-[13px] text-[var(--os-ink-muted)]">
                Nothing logged for these filters yet.
              </p>
              <button
                onClick={clearFilters}
                className={cn("text-[12px] font-medium text-[var(--os-accent)] hover:underline", focusRing)}
              >
                Clear filters to see the full log
              </button>
            </div>
          ) : (
            visibleDays.map(d => (
              <section key={d}>
                <div className="flex items-center gap-2 pt-5 pb-1.5 first:pt-0">
                  <h2 className="os-label">
                    {dayHeading(d)}
                    {d === DEMO_DATE.getDate() ? " · Today" : ""}
                  </h2>
                  <span className="h-px flex-1 bg-[var(--os-border)]" aria-hidden />
                </div>

                {list.filter(a => a.day === d).map(ev => {
                  const isFocus = ev.id === focusEventId;
                  const isOpen = expanded.has(ev.id);
                  return (
                    <div
                      key={ev.id}
                      ref={isFocus ? focusRowRef : undefined}
                      className={cn(
                        "border-b border-[var(--os-border)] px-2 py-2 transition-colors",
                        isFocus ? "bg-[var(--os-selected)]" : "hover:bg-[var(--os-hover)]",
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="w-[58px] shrink-0 text-[12px] tabular-nums text-[var(--os-ink-subtle)]">
                          {ev.at}
                        </span>
                        <ActorChip actor={ev.actor} />
                        <span className="min-w-[180px] flex-1 text-[13px] text-[var(--os-ink)]">
                          {ev.label}
                        </span>
                        {ev.householdId && (
                          <Link
                            href={`/os/clients/${ev.householdId}`}
                            className={cn("shrink-0 text-[12px] text-[var(--os-ink-muted)] transition-colors hover:text-[var(--os-ink)] hover:underline", focusRing)}
                          >
                            {householdById(ev.householdId)?.name}
                          </Link>
                        )}
                        {ev.runId && (
                          <button
                            onClick={() => toggleRun(ev.id)}
                            aria-expanded={isOpen}
                            className={cn("inline-flex shrink-0 items-center gap-1 text-[12px] font-medium text-[var(--os-accent)] hover:underline", focusRing)}
                          >
                            {isOpen ? "Hide run" : "View run"}
                            <Icon icon={I.chevronDown} size={11} className={cn("transition-transform", !isOpen && "-rotate-90")} />
                          </button>
                        )}
                      </div>
                      {isOpen && ev.runId && (
                        <ProvenancePanel runId={ev.runId} defaultOpen className="mt-2" />
                      )}
                    </div>
                  );
                })}
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function ActivityPage() {
  return (
    <Suspense fallback={null}>
      <ActivityLog />
    </Suspense>
  );
}

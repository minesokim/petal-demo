"use client";

/**
 * MorningBriefing — top-of-triage strip that summarizes what's on your plate
 * today and what got done overnight without your involvement.
 *
 * Three sections, horizontal:
 *   1. Day shape — open issue count, hours of work, calls today, clear-by ETA
 *   2. Overnight wins — issues Petal auto-resolved + which integrations did it
 *   3. Live integration sync — last-sync timestamps for the busiest sources
 *
 * Dismissible. Stays dismissed for the session (local state). Mock; in
 * production the dismiss state would persist per-user per-day in Convex.
 */

import * as React from "react";
import { ChevronDown, ChevronUp, X, Sparkles } from "lucide-react";
import { PetalMark } from "@/components/petal-mark";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/session-context";
import { SourceChip } from "@/components/integrations/source-chip";
import { INTEGRATIONS, getIntegration } from "@/lib/integrations-mock-data";

interface MorningBriefingProps {
  /** Total open issues across the queue right now. */
  openCount: number;
  /** Estimated minutes to clear the queue. */
  totalMin: number;
  /** Calendar events that are triage_calendar_event items today. */
  callsToday: { time: string; clientName: string }[];
  /** Overnight wins — Petal-resolved or auto-synced items the user didn't have to do. */
  overnightWins: { count: number; integrationIds: string[] }[];
  className?: string;
}

export function MorningBriefing({
  openCount,
  totalMin,
  callsToday,
  overnightWins,
  className,
}: MorningBriefingProps) {
  const { user } = useSession();
  const [dismissed, setDismissed] = React.useState(false);
  const [expanded, setExpanded] = React.useState(true);

  if (dismissed) return null;

  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  const paceLabel = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  const greeting = greetingForTime();
  const overnightTotal = overnightWins.reduce((sum, w) => sum + w.count, 0);
  const activeSources = INTEGRATIONS.filter((i) => i.connected && i.produces_cards).slice(0, 6);

  return (
    <div
      className={cn(
        "shrink-0 overflow-hidden rounded-lg border border-foreground/10 bg-gradient-to-br from-violet-50/60 via-blue-50/40 to-emerald-50/30 dark:from-violet-950/20 dark:via-blue-950/15 dark:to-emerald-950/10",
        className
      )}
    >
      {/* Top row — greeting + dismiss */}
      <div className="flex items-start justify-between gap-3 px-4 pt-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-foreground/[0.06]">
            <PetalMark className="size-3.5 text-foreground/70" />
          </span>
          <div>
            <div className="flex items-center gap-1.5 text-[13px] font-medium leading-none">
              {greeting}, {user.shortName}
            </div>
            <div className="mt-1 text-[11.5px] leading-none text-muted-foreground">
              Petal's briefing for the day · synced just now
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
            title={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
            title="Dismiss for the day"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Three-section grid */}
      {expanded && (
        <div className="grid grid-cols-1 gap-3 px-4 pb-3.5 pt-3 md:grid-cols-3 md:divide-x md:divide-foreground/10">
          {/* 1. Day shape */}
          <div className="md:pr-4">
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Your day
            </div>
            <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-display text-[20px] font-semibold leading-none tabular-nums">
                {openCount}
              </span>
              <span className="text-[11.5px] text-muted-foreground">open issues</span>
              <span className="text-muted-foreground/40">·</span>
              <span className="text-[12px] font-medium tabular-nums">{paceLabel}</span>
              <span className="text-[11.5px] text-muted-foreground">to clear</span>
            </div>
            {callsToday.length > 0 ? (
              <div className="mt-2.5">
                <div className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Calls today
                </div>
                <ul className="mt-1 space-y-0.5 text-[11.5px] text-foreground/80">
                  {callsToday.slice(0, 3).map((c, i) => (
                    <li key={i} className="flex gap-1.5">
                      <span className="font-medium tabular-nums text-foreground">{c.time}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="truncate">{c.clientName}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="mt-2.5 text-[11px] text-muted-foreground italic">No client calls scheduled</div>
            )}
          </div>

          {/* 2. Overnight wins */}
          <div className="md:px-4">
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Overnight wins
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="font-display text-[20px] font-semibold leading-none tabular-nums">
                {overnightTotal}
              </span>
              <span className="text-[11.5px] text-muted-foreground">items handled for you</span>
            </div>
            <ul className="mt-2 space-y-1 text-[11.5px]">
              {overnightWins.map((w, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  <Sparkles className="size-2.5 shrink-0 text-emerald-500" />
                  <span className="tabular-nums font-medium">{w.count}</span>
                  <span className="text-muted-foreground">via</span>
                  <span className="flex flex-wrap items-center gap-1">
                    {w.integrationIds.slice(0, 3).map((id) => (
                      <SourceChip key={id} integrationId={id} size="xs" />
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. Live integration sync */}
          <div className="md:pl-4">
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Connected & syncing
            </div>
            <div className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
              {activeSources.map((i) => (
                <div key={i.id} className="flex min-w-0 items-center gap-1.5">
                  <span
                    className="size-1.5 shrink-0 rounded-full bg-emerald-500"
                    aria-hidden="true"
                  />
                  <SourceChip integrationId={i.id} size="xs" showSync />
                </div>
              ))}
            </div>
            <a
              href="/dashboard/pages/settings/integrations"
              className="mt-2 inline-flex items-center gap-1 text-[10.5px] font-medium text-muted-foreground hover:text-foreground"
            >
              Manage integrations →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function greetingForTime(): string {
  const h = new Date().getHours();
  if (h < 5) return "Up late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

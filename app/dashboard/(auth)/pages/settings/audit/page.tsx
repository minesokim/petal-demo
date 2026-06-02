"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  BotIcon,
  SearchIcon,
  ServerIcon,
  ShieldCheckIcon,
  UploadIcon,
  UserIcon,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { PetalMark } from "@/components/petal-mark";
import { TrustTierDot } from "@/components/trust-tier-badge";
import { cn } from "@/lib/utils";
import {
  ACTIVITY_EVENTS,
  groupActivityByBucket,
  type ActivityEvent,
  type ActivityKind,
} from "@/lib/activity-stream-mock-data";

// ═════════════════════════════════════════════════════════════════════════
// Audit trail — system event log (moved here from /dashboard/activity)
// ═════════════════════════════════════════════════════════════════════════

type FilterKey = "all" | "ai" | "compliance" | "client" | "you" | "system";

const FILTERS: { key: FilterKey; label: string; dot?: string }[] = [
  { key: "all", label: "All" },
  { key: "ai", label: "AI actions", dot: "bg-foreground/55" },
  { key: "compliance", label: "Compliance", dot: "bg-emerald-500" },
  { key: "client", label: "Client activity", dot: "bg-blue-500" },
  { key: "you", label: "Your activity", dot: "bg-amber-500" },
  { key: "system", label: "System", dot: "bg-muted-foreground/40" },
];

export default function SettingsAuditPage() {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return ACTIVITY_EVENTS.filter((e) => {
      if (filter !== "all") {
        const matches: Record<FilterKey, (e: ActivityEvent) => boolean> = {
          all: () => true,
          ai: (e) => e.kind === "ai_action",
          compliance: (e) => e.kind === "compliance",
          client: (e) => e.kind === "client_action",
          you: (e) => e.kind === "user_action",
          system: (e) => e.kind === "system",
        };
        if (!matches[filter](e)) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        return (
          e.title.toLowerCase().includes(q) ||
          (e.detail?.toLowerCase().includes(q) ?? false) ||
          (e.entity?.label.toLowerCase().includes(q) ?? false) ||
          (e.agent?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });
  }, [filter, search]);

  const buckets = useMemo(() => groupActivityByBucket(filtered), [filtered]);

  const counts = useMemo(() => {
    return {
      all: ACTIVITY_EVENTS.length,
      ai: ACTIVITY_EVENTS.filter((e) => e.kind === "ai_action").length,
      compliance: ACTIVITY_EVENTS.filter((e) => e.kind === "compliance").length,
      client: ACTIVITY_EVENTS.filter((e) => e.kind === "client_action").length,
      you: ACTIVITY_EVENTS.filter((e) => e.kind === "user_action").length,
      system: ACTIVITY_EVENTS.filter((e) => e.kind === "system").length,
    } as Record<FilterKey, number>;
  }, []);

  const todayCount =
    (buckets["Just now"]?.length ?? 0) + (buckets["Last hour"]?.length ?? 0) + (buckets["Today"]?.length ?? 0);

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h3 className="text-lg font-semibold">Audit trail</h3>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground/80 tabular-nums">{todayCount}</span> events today
          <span className="mx-1.5 text-muted-foreground/40">·</span>
          <span className="tabular-nums">{ACTIVITY_EVENTS.length}</span> in the last 72 hours
          <span className="mx-1.5 text-muted-foreground/40">·</span>
          retained 7 years per WISP
        </p>
      </div>

      {/* Filter strip */}
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-border/60 bg-muted/50 p-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-all",
                filter === f.key
                  ? "bg-background text-foreground shadow-sm ring-1 ring-foreground/[0.06]"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.dot && <span className={cn("size-1.5 rounded-full", f.dot)} />}
              <span>{f.label}</span>
              <span className="tabular-nums text-muted-foreground/60">{counts[f.key]}</span>
            </button>
          ))}
        </div>
        <div className="relative max-w-xs">
          <SearchIcon className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events…"
            className="pl-9 bg-white"
          />
        </div>
      </div>

      {/* Live indicator */}
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <span className="relative flex size-2">
          <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/40" />
          <span className="relative size-2 rounded-full bg-emerald-500" />
        </span>
        <span>Streaming live · new events appear automatically</span>
      </div>

      {/* Bucketed stream */}
      <div className="space-y-6">
        {Object.entries(buckets).map(([label, events]) => {
          if (events.length === 0) return null;
          return (
            <section key={label}>
              <div className="mb-2 text-[10.5px] font-medium uppercase tracking-[0.08em] text-foreground/55">
                {label} <span className="text-muted-foreground/60">· {events.length}</span>
              </div>
              <ul className="divide-y divide-border/40 overflow-hidden rounded-lg border bg-card">
                {events.map((e) => (
                  <ActivityRow key={e.id} event={e} />
                ))}
              </ul>
            </section>
          );
        })}

        {filtered.length === 0 && (
          <div className="flex h-[200px] flex-col items-center justify-center gap-2 rounded-lg border bg-card text-center">
            <PetalMark className="size-6 text-foreground/40" />
            <div className="text-[14px] font-medium">No events match</div>
            <div className="text-[12px] text-muted-foreground">Adjust the filter or search</div>
          </div>
        )}
      </div>

      <div className="border-t border-border/60 pt-4 text-[11px] text-muted-foreground">
        Audit trail is the system console for your practice · searchable for 7 years · exportable as IRS-defense PDF
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// Activity row
// ═════════════════════════════════════════════════════════════════════════

const KIND_ICON: Record<ActivityKind, React.ComponentType<{ className?: string }>> = {
  ai_action: BotIcon,
  user_action: UserIcon,
  client_action: UploadIcon,
  compliance: ShieldCheckIcon,
  system: ServerIcon,
};

const KIND_COLOR: Record<ActivityKind, string> = {
  ai_action: "text-foreground/65",
  user_action: "text-amber-600",
  client_action: "text-blue-600",
  compliance: "text-emerald-600",
  system: "text-muted-foreground",
};

function ActivityRow({ event }: { event: ActivityEvent }) {
  const Icon = KIND_ICON[event.kind];
  const colorClass = KIND_COLOR[event.kind];
  const timeStr = new Date(event.at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  return (
    <li className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/30">
      <span className={cn("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded bg-foreground/[0.04]", colorClass)}>
        <Icon className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 text-[11px] text-muted-foreground mb-0.5">
          {event.agent && <span className="font-mono text-[10.5px] text-foreground/55">{event.agent}</span>}
          {event.actor && <span className="font-medium text-foreground/75">{event.actor}</span>}
          {(event.agent || event.actor) && <span className="text-muted-foreground/40">·</span>}
          <span className="capitalize">
            {event.kind === "ai_action"
              ? "AI action"
              : event.kind === "user_action"
              ? "User"
              : event.kind === "client_action"
              ? "Client"
              : event.kind}
          </span>
          {event.tier && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <TrustTierDot tier={event.tier} />
            </>
          )}
        </div>
        <div className="text-[13px] text-foreground/90">{event.title}</div>
        {event.detail && (
          <div className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">{event.detail}</div>
        )}
        {event.entity && event.entity.id && (
          <Link
            href={`/dashboard/clients/${event.entity.id}/overview`}
            className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-foreground/70 transition-colors hover:text-foreground"
          >
            {event.entity.label} <ArrowRightIcon className="size-2.5" />
          </Link>
        )}
      </div>
      <span className="shrink-0 text-[10.5px] tabular-nums text-muted-foreground">{timeStr}</span>
    </li>
  );
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  CheckIcon,
  MicIcon,
  PhoneIcon,
  PlayIcon,
  SparklesIcon,
  VideoIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PetalMark } from "@/components/petal-mark";
import { cn } from "@/lib/utils";
import {
  VOICE_RECORDINGS,
  SOURCE_META,
  formatDuration,
  type RecordingSource,
  type VoiceRecording,
} from "@/lib/voice-recordings-mock-data";
import { clients, type Client } from "@/lib/mock-data";
import { VoiceRecorderDialog } from "@/components/voice/voice-recorder";

/**
 * Conversations view - the full /voice page experience inside a client tab.
 *
 * Shows the COMPLETE recording library (every client's recordings) so the
 * tab is never empty when a particular client has no recordings yet. This
 * client's own recordings are highlighted and pinned to the top of the
 * roster, so they're never buried.
 *
 * Three sources flow through one summarization pipeline:
 *   - in_person  · tapped record button in the app
 *   - video      · Petal auto-joined a Google Meet / Zoom
 *   - phone      · Twilio inbound/outbound call
 *
 * Layout: horizontal roster strip on top, full recording detail below.
 * (Earlier this was a left-sidebar master-detail; the user asked for the
 * roster to live on the top instead.)
 */

const SOURCE_ICONS: Record<RecordingSource, React.ComponentType<{ className?: string }>> = {
  in_person: MicIcon,
  video: VideoIcon,
  phone: PhoneIcon,
};

interface ConversationsViewProps {
  client: Client;
  variant?: "popup" | "full";
  onAction?: (label: string) => void;
}

export function ConversationsView({ client, variant = "full", onAction }: ConversationsViewProps) {
  const [filter, setFilter] = useState<RecordingSource | "all">("all");
  const [recorderOpen, setRecorderOpen] = useState(false);

  // Pin this client's recordings first, then everyone else in recency order.
  // This way the tab never feels empty, but the current client's stuff is
  // never buried either.
  const orderedAll = useMemo(() => {
    const mine = VOICE_RECORDINGS.filter((r) => r.clientId === client.id).sort(
      (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
    );
    const others = VOICE_RECORDINGS.filter((r) => r.clientId !== client.id).sort(
      (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
    );
    return [...mine, ...others];
  }, [client.id]);

  const filtered = useMemo(() => {
    if (filter === "all") return orderedAll;
    return orderedAll.filter((r) => r.source === filter);
  }, [orderedAll, filter]);

  // Default-select the first visible recording (mine if any, else most recent
  // across all clients).
  const [selectedId, setSelectedId] = useState<string | null>(orderedAll[0]?.id ?? null);
  const selected = filtered.find((r) => r.id === selectedId) ?? filtered[0] ?? null;

  const counts = useMemo(
    () => ({
      all: orderedAll.length,
      in_person: orderedAll.filter((r) => r.source === "in_person").length,
      video: orderedAll.filter((r) => r.source === "video").length,
      phone: orderedAll.filter((r) => r.source === "phone").length,
      mine: orderedAll.filter((r) => r.clientId === client.id).length,
    }),
    [orderedAll, client.id]
  );

  const totalMin = Math.round(orderedAll.reduce((s, r) => s + r.durationSec, 0) / 60);
  const noop = (label: string) => onAction?.(label);

  // No recordings at all (edge case - the library is genuinely empty).
  if (orderedAll.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center gap-4 rounded-lg border bg-card px-8 py-14 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-foreground/[0.04]">
            <MicIcon className="size-5 text-foreground/55" />
          </span>
          <div>
            <h3 className="font-display text-[18px] font-medium leading-tight">No conversations yet</h3>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              Tap record to capture your first in-person chat, or let Petal auto-join your next Meet, Zoom, or phone call.
            </p>
          </div>
          <Button
            size="sm"
            className="bg-foreground text-background hover:bg-foreground/90"
            onClick={() => setRecorderOpen(true)}
          >
            <MicIcon className="size-3.5" /> Record now
          </Button>
        </div>
        <VoiceRecorderDialog open={recorderOpen} onOpenChange={setRecorderOpen} />
      </>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Stat line + Record button ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[12.5px] text-muted-foreground">
          <span className="font-medium text-foreground/80 tabular-nums">{orderedAll.length}</span>{" "}
          {orderedAll.length === 1 ? "conversation" : "conversations"}
          <span className="mx-1.5 text-muted-foreground/40">·</span>
          <span className="tabular-nums">{counts.mine}</span> with{" "}
          <span className="font-medium text-foreground/75">{client.fullName.split(" ")[0]}</span>
          <span className="mx-1.5 text-muted-foreground/40">·</span>
          <span className="tabular-nums">{totalMin}</span> min captured
          <span className="mx-1.5 text-muted-foreground/40">·</span>
          indexed into OmniContext
        </p>
        <Button
          size="sm"
          className="h-8 bg-foreground text-background hover:bg-foreground/90"
          onClick={() => setRecorderOpen(true)}
        >
          <MicIcon className="size-3.5" /> Record
        </Button>
      </div>

      {/* ── Source filter strip ── */}
      <div className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-border/60 bg-muted/50 p-1">
        <FilterPill label="All" count={counts.all} active={filter === "all"} onClick={() => setFilter("all")} />
        <FilterPill
          label="In person"
          icon={MicIcon}
          count={counts.in_person}
          active={filter === "in_person"}
          onClick={() => setFilter("in_person")}
        />
        <FilterPill
          label="Video"
          icon={VideoIcon}
          count={counts.video}
          active={filter === "video"}
          onClick={() => setFilter("video")}
        />
        <FilterPill
          label="Phone"
          icon={PhoneIcon}
          count={counts.phone}
          active={filter === "phone"}
          onClick={() => setFilter("phone")}
        />
      </div>

      {/* ── Roster on top - horizontal scroll strip ── */}
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <ul className="flex w-max gap-2">
          {filtered.map((r) => (
            <RosterCard
              key={r.id}
              recording={r}
              selected={r.id === selected?.id}
              isThisClient={r.clientId === client.id}
              onSelect={() => setSelectedId(r.id)}
            />
          ))}
          {filtered.length === 0 && (
            <li className="flex h-[88px] items-center rounded-md border border-dashed border-border/60 bg-muted/20 px-6 text-[11.5px] text-muted-foreground">
              No matches for this filter.
            </li>
          )}
        </ul>
      </div>

      {/* ── Detail panel underneath ── */}
      {selected ? (
        <RecordingDetail recording={selected} thisClientId={client.id} onAction={noop} />
      ) : (
        <div className="rounded-lg border bg-card px-6 py-12 text-center text-[12.5px] text-muted-foreground">
          Pick a recording above to view its summary, facts, and transcript.
        </div>
      )}

      <VoiceRecorderDialog open={recorderOpen} onOpenChange={setRecorderOpen} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Roster card - horizontal strip item
// ─────────────────────────────────────────────────────────────────────────

function RosterCard({
  recording,
  selected,
  isThisClient,
  onSelect,
}: {
  recording: VoiceRecording;
  selected: boolean;
  isThisClient: boolean;
  onSelect: () => void;
}) {
  const Icon = SOURCE_ICONS[recording.source];
  const when = new Date(recording.recordedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const meta = SOURCE_META[recording.source];

  return (
    <li className="shrink-0">
      <button
        onClick={onSelect}
        className={cn(
          "flex h-[88px] w-[240px] flex-col justify-between rounded-lg border bg-card p-3 text-left transition-all",
          selected ? "border-foreground/40 ring-1 ring-foreground/15 shadow-sm" : "hover:border-foreground/20 hover:shadow-sm",
          isThisClient && !selected && "ring-1 ring-inset ring-foreground/[0.06]"
        )}
      >
        {/* Top row: source + this-client chip */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.08em] text-foreground/55">
            <Icon className="size-2.5" />
            <span>{meta.label}</span>
          </div>
          {isThisClient && (
            <span className="rounded bg-foreground/[0.06] px-1.5 py-0.5 text-[9.5px] font-medium uppercase tracking-wider text-foreground/65">
              this client
            </span>
          )}
        </div>

        {/* Middle: title (truncated) */}
        <div className="line-clamp-2 text-[12.5px] font-medium leading-snug text-foreground/90">
          {recording.title}
        </div>

        {/* Bottom: client + duration + date */}
        <div className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
          {recording.clientName && (
            <>
              <span className="truncate font-medium text-foreground/65">{recording.clientName}</span>
              <span className="text-muted-foreground/40">·</span>
            </>
          )}
          <span className="tabular-nums">{formatDuration(recording.durationSec)}</span>
          <span className="text-muted-foreground/40">·</span>
          <span className="tabular-nums">{when}</span>
        </div>
      </button>
    </li>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Recording detail - the full article (same as the old /voice page)
// ─────────────────────────────────────────────────────────────────────────

function RecordingDetail({
  recording,
  thisClientId,
  onAction,
}: {
  recording: VoiceRecording;
  thisClientId: string;
  onAction: (label: string) => void;
}) {
  const Icon = SOURCE_ICONS[recording.source];
  const recClient = recording.clientId ? clients.find((c) => c.id === recording.clientId) : null;
  const isThisClient = recording.clientId === thisClientId;
  const when = new Date(recording.recordedAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const initials = recording.clientName
    ? recording.clientName.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  return (
    <article className="space-y-5 rounded-lg border bg-card p-5 md:p-6">
      {/* Header */}
      <header className="space-y-2.5">
        <div className="flex flex-wrap items-center gap-2 text-[10.5px] font-medium uppercase tracking-[0.08em] text-foreground/60">
          <Icon className="size-3" />
          <span>{SOURCE_META[recording.source].label}</span>
          <span className="text-muted-foreground/40">·</span>
          <span>{SOURCE_META[recording.source].description}</span>
          <span className="text-muted-foreground/40">·</span>
          <span className="tabular-nums">{formatDuration(recording.durationSec)}</span>
          <span className="text-muted-foreground/40">·</span>
          <span className="tabular-nums">{when}</span>
        </div>
        <h2 className="font-display text-[22px] font-medium leading-tight tracking-tight md:text-[24px]">
          {recording.title}
        </h2>
        {recClient && !isThisClient && (
          <div className="flex items-center gap-2 text-[12px]">
            <Avatar className="size-5">
              {recClient.avatar && <AvatarImage src={recClient.avatar} alt={recClient.fullName} />}
              <AvatarFallback className="text-[8px] font-medium">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-muted-foreground">From</span>
            <Link
              href={`/dashboard/clients/${recClient.id}/overview`}
              className="font-medium text-foreground/85 transition-colors hover:text-foreground"
            >
              {recClient.fullName}
            </Link>
          </div>
        )}
      </header>

      {/* Playback strip */}
      <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
        <button
          onClick={() => onAction("Playing recording")}
          className="flex size-9 items-center justify-center rounded-full bg-foreground text-background transition-transform hover:scale-105"
          aria-label="Play recording"
        >
          <PlayIcon className="size-4 fill-current pl-0.5" />
        </button>
        <div className="flex h-7 flex-1 items-center gap-[2px]">
          {Array.from({ length: 64 }).map((_, i) => (
            <span
              key={i}
              className="w-[2px] rounded-full bg-foreground/30"
              style={{ height: `${8 + Math.abs(Math.sin(i * 0.3)) * 16}px` }}
            />
          ))}
        </div>
        <span className="shrink-0 tabular-nums text-[11px] text-muted-foreground">
          0:00 / {formatDuration(recording.durationSec)}
        </span>
      </div>

      {/* Petal summary (hero) */}
      <div className="rounded-lg border border-foreground/15 bg-background p-4">
        <div className="mb-2 flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.08em] text-foreground/55">
          <PetalMark className="size-3 text-foreground/60" />
          My summary
        </div>
        <p className="text-[13px] leading-relaxed text-foreground/85">{recording.summary}</p>
      </div>

      {/* Extracted facts + action items */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="mb-2 text-[10.5px] font-medium uppercase tracking-[0.08em] text-foreground/55">
            Facts extracted
          </div>
          <ul className="space-y-1.5">
            {recording.extractedFacts.map((f) => (
              <li key={f} className="flex items-start gap-2 text-[12.5px] text-foreground/85">
                <SparklesIcon className="mt-0.5 size-3 shrink-0 text-foreground/55" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="mb-2 text-[10.5px] font-medium uppercase tracking-[0.08em] text-foreground/55">
            Action items
          </div>
          <ul className="space-y-1.5">
            {recording.actionItems.map((a) => (
              <li key={a} className="flex items-start gap-2 text-[12.5px] text-foreground/85">
                <CheckIcon className="mt-0.5 size-3 shrink-0 text-emerald-600" />
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Transcript */}
      <details className="rounded-md border border-border/60 bg-muted/30" open>
        <summary className="cursor-pointer px-3.5 py-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-foreground/65">
          Transcript ({recording.excerpts.length} excerpts shown)
        </summary>
        <ul className="space-y-2.5 px-3.5 pb-3.5 pt-1 text-[12.5px]">
          {recording.excerpts.map((e, i) => (
            <li key={i} className="flex gap-3">
              <span className="w-10 shrink-0 font-mono text-[10.5px] tabular-nums text-muted-foreground">
                {e.tMin}:{e.tSec.toString().padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <span className="font-medium text-foreground/85">{e.speaker}:</span>{" "}
                <span className="italic text-foreground/75">{e.text}</span>
              </div>
            </li>
          ))}
        </ul>
      </details>

      {/* Footer actions */}
      <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
        {recClient && !isThisClient && (
          <Link href={`/dashboard/clients/${recClient.id}/overview`}>
            <Button size="sm" variant="outline">
              <ArrowRightIcon className="size-3.5" /> Open {recClient.fullName.split(" ")[0]}&apos;s page
            </Button>
          </Link>
        )}
        <Button size="sm" variant="ghost" onClick={() => onAction("Downloaded transcript")}>
          Download transcript
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onAction("Shared")}>
          Share
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto text-red-600 hover:text-red-700"
          onClick={() => onAction("Discarded")}
        >
          Delete
        </Button>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Filter pill
// ─────────────────────────────────────────────────────────────────────────

function FilterPill({
  label,
  count,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  count: number;
  icon?: React.ComponentType<{ className?: string }>;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-all",
        active
          ? "bg-background text-foreground shadow-sm ring-1 ring-foreground/[0.06]"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {Icon && <Icon className="size-3" />}
      <span>{label}</span>
      <span className="tabular-nums text-muted-foreground/60">{count}</span>
    </button>
  );
}

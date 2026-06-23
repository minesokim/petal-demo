"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import { Hourglass } from "lucide-react";
import { Icon, I } from "@/components/os/icon";
import { Badge, ScopeToggle, type Scope } from "@/components/os/primitives";
import { ThreadConversation } from "@/components/os/thread-conversation";
import { ComposeModal } from "@/components/os/compose-modal";
import { CURRENT_USER_ID, type Thread, type Channel } from "@/lib/fixtures/firm";
import { useFirmData } from "@/lib/client/firm-context";
import { assigneeOf, useAssignVersion } from "@/lib/assign-store";
import { DEMO_DATE } from "@/lib/fixtures/vocab";

const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]";

/* ── channel meta (UI colors live here, not in fixtures) ── */
const channelMeta: Record<Channel, { label: string; dot: string }> = {
  email:  { label: "Email",  dot: "bg-blue-500" },
  sms:    { label: "SMS",    dot: "bg-emerald-500" },
  portal: { label: "Portal", dot: "bg-violet-500" },
  call:   { label: "Call",   dot: "bg-yellow-500" },
};
const CHANNEL_ORDER: Channel[] = ["email", "sms", "portal", "call"];

const inboxFilters: { key: string; label: string; test: (t: Thread) => boolean }[] = [
  { key: "open",    label: "Open",           test: t => t.status === "open" },
  { key: "waiting", label: "Client waiting", test: t => t.status === "open" && !!t.waitingOnFirmSince },
  { key: "done",    label: "Done",           test: t => t.status === "done" },
];

const initials = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2);
const first = (name: string) => name.split(" ")[0];

/** "Jun 23" → how many days the client has been waiting as of the demo date (Jun 25). */
function waitingDays(since: string): number {
  const day = parseInt(since.split(" ")[1] ?? "", 10);
  if (Number.isNaN(day)) return 0;
  return Math.max(0, DEMO_DATE.getDate() - day);
}

function WaitingChip({ since, className }: { since: string; className?: string }) {
  const n = waitingDays(since);
  if (n < 1) return null;
  return (
    <Badge tone="amber" icon={Hourglass} className={cn("tabular-nums", className)}>
      Waiting {n}d
    </Badge>
  );
}

function contextLine(t: Thread) {
  if (t.petalDraft) return "Petal drafted a reply";
  const last = t.messages[t.messages.length - 1];
  if (!last) return t.preview;
  return last.from === "client" ? `${first(last.author)} replied` : "You replied";
}

function ChannelChip({ channel }: { channel: Channel }) {
  const m = channelMeta[channel];
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-[var(--os-ink)]">
      <span className={cn("size-1.5 rounded-full", m.dot)} /> {m.label}
    </span>
  );
}

function ThreadPane({ thread }: { thread: Thread }) {
  return (
    <div className="flex min-w-0 flex-1">
      {/* Conversation column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Breadcrumb header (Linear) */}
        <div className="flex items-center gap-1.5 border-b border-[var(--os-border)] px-5 py-3 text-[13px]">
          <Link href={`/os/clients/${thread.householdId}`} className={cn("shrink-0 text-[var(--os-ink-muted)] transition-colors hover:text-[var(--os-ink)]", focusRing)}>{thread.clientName}</Link>
          <Icon icon={I.chevronRight} size={12} className="shrink-0 text-[var(--os-ink-subtle)]" />
          <span className="truncate font-medium text-[var(--os-ink)]">{thread.subject}</span>
          <button title="Snooze" className={cn("ml-auto grid size-7 shrink-0 place-items-center rounded-md text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]", focusRing)}><Icon icon={I.history} size={15} /></button>
          <button title="Star" className={cn("grid size-7 shrink-0 place-items-center rounded-md text-[var(--os-ink-subtle)] hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]", focusRing)}><Icon icon={I.star} size={15} /></button>
          <button title="More" className={cn("grid size-7 shrink-0 place-items-center rounded-md text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)]", focusRing)}><Icon icon={I.more} size={16} /></button>
        </div>

        <ThreadConversation thread={thread} />
      </div>

      {/* Properties rail (Linear) */}
      <aside className="hidden w-[220px] shrink-0 overflow-y-auto border-l border-[var(--os-border)] px-4 py-4 xl:block">
        <div className="os-label mb-3">Properties</div>
        <div className="space-y-3">
          <div>
            <div className="mb-1 text-[11px] text-[var(--os-ink-subtle)]">Channel</div>
            <ChannelChip channel={thread.channel} />
          </div>
          <div>
            <div className="mb-1 text-[11px] text-[var(--os-ink-subtle)]">Client</div>
            <Link href={`/os/clients/${thread.householdId}`} className={cn("flex items-center gap-1.5 text-[13px] text-[var(--os-link)] hover:underline", focusRing)}>
              <span className="grid size-5 place-items-center rounded-full bg-[var(--os-selected)] text-[9px] font-medium text-[var(--os-ink-muted)]">{initials(thread.clientName)}</span>
              {thread.clientName}
            </Link>
          </div>
          {thread.waitingOnFirmSince && (
            <div>
              <div className="mb-1 text-[11px] text-[var(--os-ink-subtle)]">Waiting</div>
              <WaitingChip since={thread.waitingOnFirmSince} />
            </div>
          )}
          {thread.transcript && (
            <div>
              <div className="mb-1 text-[11px] text-[var(--os-ink-subtle)]">Follow-ups</div>
              <div className="flex items-center gap-1.5 text-[13px] text-[var(--os-ink)]">
                <PetalMark className="size-3 shrink-0 text-[var(--os-ink-muted)]" />
                {thread.transcript.followUps.length} extracted from the call
              </div>
            </div>
          )}
        </div>
        <Link href={`/os/clients/${thread.householdId}`} className={cn("mt-4 flex h-8 w-full items-center justify-center gap-1.5 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] text-[12px] transition-colors hover:bg-[var(--os-hover)]", focusRing)}>
          Open record <Icon icon={I.chevronRight} size={13} />
        </Link>
      </aside>
    </div>
  );
}

export function InboxView() {
  const { threads } = useFirmData();
  const [filter, setFilter] = useState<string>("open");
  const [channel, setChannel] = useState<"all" | Channel>("all");
  const [scope, setScope] = useState<Scope>("firm");
  const [composeOpen, setComposeOpen] = useState(false);
  useAssignVersion(); // re-filter when a client is reassigned
  const f = inboxFilters.find(x => x.key === filter)!;
  const scopeOk = (t: Thread) => scope === "firm" || assigneeOf(t.householdId) === CURRENT_USER_ID;
  const list = threads.filter(t => f.test(t) && scopeOk(t) && (channel === "all" || t.channel === channel));
  const [selected, setSelected] = useState<string>(() => threads.find(t => t.status === "open")?.id ?? threads[0]?.id ?? "");
  const thread = list.find(t => t.id === selected) || list[0];

  const counts = inboxFilters.reduce<Record<string, number>>((a, x) => { a[x.key] = threads.filter(t => x.test(t) && scopeOk(t)).length; return a; }, {});

  return (
    <div className="flex h-full flex-col">
      {/* Header - Compose is a ghost icon; the primary affordance lives in the composer ("Draft with Petal") */}
      <div className="flex items-center gap-2 border-b border-[var(--os-border)] px-5 pt-6 pb-5 sm:px-8">
        <h1 className="os-display text-[24px] font-semibold text-[var(--os-ink)]">Inbox</h1>
        <div className="ml-auto flex items-center gap-1.5">
          <ScopeToggle scope={scope} onChange={setScope} />
          <span className="mx-0.5 h-5 w-px bg-[var(--os-border)]" />
          <button title="Search" className={cn("grid size-7 place-items-center rounded-md text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]", focusRing)}><Icon icon={I.search} size={15} /></button>
          <button onClick={() => setComposeOpen(true)} title="Compose" aria-label="Compose" className={cn("grid size-7 place-items-center rounded-md text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]", focusRing)}><Icon icon={I.edit} size={15} /></button>
        </div>
      </div>

      {/* Filters: status pills (left) + channel filter (right) */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-[var(--os-border)] px-5 py-1.5 sm:px-8">
        {inboxFilters.map(t => (
          <button
            key={t.key}
            onClick={() => { setFilter(t.key); const next = threads.filter(x => t.test(x) && scopeOk(x) && (channel === "all" || x.channel === channel)); if (next.length) setSelected(next[0].id); }}
            className={cn("flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-[13px] transition-colors", focusRing, filter === t.key ? "bg-[var(--os-selected)] font-medium text-[var(--os-ink)]" : "text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)]")}
          >
            {t.label}
            <span className="text-[11px] tabular-nums text-[var(--os-ink-subtle)]">{counts[t.key]}</span>
          </button>
        ))}
        <div className="ml-auto flex items-center gap-0.5">
          {(["all", ...CHANNEL_ORDER] as const).map(c => (
            <button
              key={c}
              onClick={() => { setChannel(c); const next = threads.filter(x => f.test(x) && scopeOk(x) && (c === "all" || x.channel === c)); if (next.length) setSelected(next[0].id); }}
              className={cn("flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2 text-[12px] transition-colors", focusRing, channel === c ? "bg-[var(--os-selected)] font-medium text-[var(--os-ink)]" : "text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)]")}
            >
              {c !== "all" && <span className={cn("size-1.5 rounded-full", channelMeta[c].dot)} />}
              {c === "all" ? "All channels" : channelMeta[c].label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-x-auto">
        {/* Conversation list (Linear) — tighter so the thread breathes */}
        <div className="flex w-[256px] shrink-0 flex-col overflow-y-auto border-r border-[var(--os-border)] sm:w-[292px]">
          {list.length === 0 ? (
            <div className="grid flex-1 place-items-center px-6 text-center text-[13px] text-[var(--os-ink-subtle)]">Nothing in this view - switch filters, or compose to start a thread.</div>
          ) : list.map(t => {
            // one uniform context line per row + waiting as a small inline icon
            const ai = t.transcript
              ? `Petal extracted ${t.transcript.followUps.length} follow-up${t.transcript.followUps.length === 1 ? "" : "s"} from the call`
              : t.extraction ? t.extraction.summary
              : t.petalDraft ? "Petal drafted a reply"
              : null;
            const meta = ai ?? contextLine(t);
            const waitDays = t.waitingOnFirmSince ? waitingDays(t.waitingOnFirmSince) : 0;
            return (
            <button
              key={t.id}
              onClick={() => setSelected(t.id)}
              className={cn("group flex items-start gap-2.5 border-b border-[var(--os-border)] px-3.5 py-2.5 text-left transition-colors", focusRing, t.id === thread?.id ? "bg-[var(--os-selected)]" : "hover:bg-[var(--os-hover)]")}
            >
              <div className="relative mt-0.5 shrink-0">
                <span className="grid size-7 place-items-center rounded-full bg-[var(--os-selected)] text-[10px] font-medium text-[var(--os-ink-muted)]">{initials(t.clientName)}</span>
                <span className={cn("absolute -bottom-0.5 -right-0.5 size-3 rounded-full ring-2 ring-[var(--os-bg)]", channelMeta[t.channel].dot)} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={cn("truncate text-[13px] text-[var(--os-ink)]", t.unread ? "font-medium" : "font-normal")}>{t.clientName}</span>
                  <div className="ml-auto flex shrink-0 items-center gap-1.5">
                    {waitDays >= 1 && (
                      <Badge tone="amber" icon={Hourglass} size="sm" className="tabular-nums">{waitDays}d</Badge>
                    )}
                    <span className="text-[11px] tabular-nums text-[var(--os-ink-subtle)]">{t.time}</span>
                    {t.unread && <span className="size-2 rounded-full bg-[var(--os-info)]" />}
                  </div>
                </div>
                <div className="mt-0.5 truncate text-[12.5px] text-[var(--os-ink-muted)]">{t.subject}</div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-[var(--os-ink-subtle)]">
                  {ai && <PetalMark className="size-3 shrink-0" />}
                  <span className="truncate">{meta}</span>
                </div>
              </div>
            </button>
            );
          })}
        </div>

        {/* Thread */}
        <AnimatePresence mode="wait">
          {thread && (
            <motion.div key={thread.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.16, ease: "easeOut" }} className="flex min-w-[320px] flex-1">
              <ThreadPane thread={thread} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {composeOpen && <ComposeModal onClose={() => setComposeOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}

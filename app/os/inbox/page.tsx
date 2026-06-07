"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import { Icon, I } from "@/components/os/icon";
import { threads, channelMeta, inboxFilters, type Thread, type Message } from "@/lib/os-inbox";
import { OWNERS, people } from "@/lib/os-entities";

function initials(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2);
}
function first(name: string) {
  return name.split(" ")[0];
}
function emailFor(author: string, from: Message["from"]) {
  if (from === "firm") return `${first(author).toLowerCase()}@vazantea.com`;
  return people.find(p => p.name === author)?.email ?? `${first(author).toLowerCase()}@gmail.com`;
}
function contextLine(t: Thread) {
  if (t.petalDraft) return "Petal drafted a reply";
  const last = t.messages[t.messages.length - 1];
  if (!last) return t.preview;
  return last.from === "client" ? `${first(last.author)} replied` : "You replied";
}

function ChannelChip({ channel }: { channel: Thread["channel"] }) {
  const m = channelMeta[channel];
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-[var(--os-ink)]">
      <span className={cn("size-1.5 rounded-full", m.dot)} /> {m.label}
    </span>
  );
}

function ThreadView({ thread }: { thread: Thread }) {
  const [reply, setReply] = useState(thread.petalDraft?.text ?? "");
  const m = channelMeta[thread.channel];

  return (
    <div className="flex min-w-0 flex-1">
      {/* Conversation column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Breadcrumb header (Linear) */}
        <div className="flex items-center gap-1.5 border-b border-[var(--os-border)] px-5 py-3 text-[13px]">
          <Link href={`/os/clients/${thread.householdId}`} className="shrink-0 text-[var(--os-ink-muted)] transition-colors hover:text-[var(--os-ink)]">{thread.clientName}</Link>
          <Icon icon={I.chevronRight} size={12} className="shrink-0 text-[var(--os-ink-subtle)]" />
          <span className="truncate font-medium text-[var(--os-ink)]">{thread.subject}</span>
          <button title="Snooze" className="ml-auto grid size-7 shrink-0 place-items-center rounded-md text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]"><Icon icon={I.history} size={15} /></button>
          <button title="Star" className="grid size-7 shrink-0 place-items-center rounded-md text-[var(--os-ink-subtle)] hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]"><Icon icon={I.star} size={15} /></button>
          <button title="More" className="grid size-7 shrink-0 place-items-center rounded-md text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)]"><Icon icon={I.more} size={16} /></button>
        </div>

        {/* Conversation — rendered per channel */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className={cn("mx-auto max-w-[640px]", thread.channel === "sms" ? "space-y-2.5" : thread.channel === "email" ? "space-y-0" : "space-y-5")}>
            {thread.messages.map((msg, i) => {
              // ── Email: full-width message blocks (Gmail / Superhuman) ──
              if (thread.channel === "email") {
                return (
                  <div key={i} className="border-b border-[var(--os-border)] py-4 first:pt-0 last:border-0 last:pb-0">
                    <div className="flex items-start gap-3">
                      <span className={cn("mt-0.5 grid size-8 shrink-0 place-items-center rounded-full text-[10px] font-medium", msg.from === "firm" ? "bg-[var(--os-primary)] text-[var(--os-primary-fg)]" : "bg-[var(--os-selected)] text-[var(--os-ink-muted)]")}>{initials(msg.author)}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-[13px] font-semibold text-[var(--os-ink)]">{msg.author}</span>
                          <span className="truncate font-mono text-[11px] text-[var(--os-ink-subtle)]">&lt;{emailFor(msg.author, msg.from)}&gt;</span>
                          <span className="ml-auto shrink-0 text-[11px] text-[var(--os-ink-subtle)]">{msg.time}</span>
                        </div>
                        <div className="text-[12px] text-[var(--os-ink-subtle)]">{msg.from === "firm" ? `to ${thread.clientName}` : "to me"}</div>
                        <p className="mt-2.5 whitespace-pre-line text-[13px] leading-relaxed text-[var(--os-ink)]">{msg.text}</p>
                      </div>
                    </div>
                  </div>
                );
              }
              // ── SMS: aligned chat bubbles ──
              if (thread.channel === "sms") {
                const firm = msg.from === "firm";
                return (
                  <div key={i} className={cn("flex", firm ? "justify-end" : "justify-start")}>
                    <div className="max-w-[76%]">
                      <div className={cn("px-3.5 py-2 text-[13px] leading-snug", firm ? "rounded-2xl rounded-br-md bg-[var(--os-primary)] text-[var(--os-primary-fg)]" : "rounded-2xl rounded-bl-md bg-[var(--os-selected)] text-[var(--os-ink)]")}>{msg.text}</div>
                      <div className={cn("mt-0.5 text-[11px] text-[var(--os-ink-subtle)]", firm && "text-right")}>{msg.time}</div>
                    </div>
                  </div>
                );
              }
              // ── Portal: message thread ──
              return (
                <div key={i} className="flex gap-2.5">
                  <span className={cn("mt-0.5 grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-medium", msg.from === "firm" ? "bg-[var(--os-primary)] text-[var(--os-primary-fg)]" : "bg-[var(--os-selected)] text-[var(--os-ink-muted)]")}>{initials(msg.author)}</span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-baseline gap-2">
                      <span className="text-[13px] font-medium text-[var(--os-ink)]">{msg.author}</span>
                      <span className="text-[11px] text-[var(--os-ink-subtle)]">{msg.time}</span>
                    </div>
                    <div className="rounded-lg rounded-tl-sm bg-[var(--os-bg-subtle)] px-3.5 py-2.5 text-[13px] leading-relaxed text-[var(--os-ink)]">{msg.text}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Composer */}
        <div className="px-5 pb-4">
          <div className="mx-auto max-w-[640px]">
            {thread.petalDraft && (
              <div className="mb-2 flex items-center gap-2 rounded-t-lg border border-b-0 border-[var(--os-border)] bg-[var(--os-bg-subtle)] px-3 py-1.5 text-[12px]">
                <PetalMark className="size-3.5 shrink-0" />
                <span className="text-[var(--os-ink-muted)]"><span className="font-medium text-[var(--os-ink)]">{thread.petalDraft.skill}</span> drafted this reply — review before sending.</span>
              </div>
            )}
            <div className={cn("rounded-lg border border-[var(--os-border-strong)] bg-[var(--os-surface)] px-3 py-2.5 transition-shadow focus-within:shadow-sm", thread.petalDraft && "rounded-t-none")}>
              {thread.channel === "email" && (
                <div className="mb-2 flex items-center gap-1.5 border-b border-[var(--os-border)] pb-2 text-[12px] text-[var(--os-ink-subtle)]">
                  <span className="text-[var(--os-ink-muted)]">To</span>
                  <span className="rounded bg-[var(--os-selected)] px-1.5 py-0.5 text-[12px] text-[var(--os-ink)]">{thread.clientName} <span className="font-mono text-[11px] text-[var(--os-ink-subtle)]">&lt;{emailFor(thread.clientName, "client")}&gt;</span></span>
                </div>
              )}
              <textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                placeholder={thread.channel === "email" ? `Reply to ${first(thread.clientName)}…` : thread.channel === "sms" ? `Text ${first(thread.clientName)}…` : "Reply in the portal…"}
                rows={thread.channel === "sms" ? 1 : 2}
                className="w-full resize-none bg-transparent text-[13px] leading-relaxed text-[var(--os-ink)] placeholder:text-[var(--os-ink-subtle)] focus:outline-none"
              />
              <div className="mt-1 flex items-center gap-1.5">
                <button className="flex h-7 items-center gap-1.5 rounded-md px-2 text-[12px] text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)]"><PetalMark className="size-3.5" /> {thread.petalDraft ? "Redraft" : "Draft with Petal"}</button>
                <button className="grid size-7 place-items-center rounded-md text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)]"><Icon icon={I.attach} size={15} /></button>
                <button disabled={!reply.trim()} className="ml-auto flex h-7 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-3 text-[12px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97] disabled:opacity-30">
                  <Icon icon={I.send} size={14} /> Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Properties rail (Linear) */}
      <aside className="hidden w-[240px] shrink-0 overflow-y-auto border-l border-[var(--os-border)] px-4 py-4 xl:block">
        <div className="os-label mb-3">Properties</div>
        <div className="space-y-3">
          <div>
            <div className="mb-1 text-[11px] text-[var(--os-ink-subtle)]">Channel</div>
            <ChannelChip channel={thread.channel} />
          </div>
          <div>
            <div className="mb-1 text-[11px] text-[var(--os-ink-subtle)]">Assignee</div>
            <div className="flex items-center gap-1.5 text-[13px] text-[var(--os-ink)]">
              <span className="grid size-5 place-items-center rounded-full bg-[var(--os-selected)] text-[9px] font-medium text-[var(--os-ink-muted)]">{(OWNERS[thread.assignee] || "?")[0]}</span>
              {OWNERS[thread.assignee] || "Unassigned"}
            </div>
          </div>
          <div>
            <div className="mb-1 text-[11px] text-[var(--os-ink-subtle)]">Client</div>
            <Link href={`/os/clients/${thread.householdId}`} className="flex items-center gap-1.5 text-[13px] text-[var(--os-ink)] hover:underline">
              <span className="grid size-5 place-items-center rounded-full bg-[var(--os-selected)] text-[9px] font-medium text-[var(--os-ink-muted)]">{initials(thread.clientName)}</span>
              {thread.clientName}
            </Link>
          </div>
        </div>
        <Link href={`/os/clients/${thread.householdId}`} className="mt-4 flex h-8 w-full items-center justify-center gap-1.5 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] text-[12px] transition-colors hover:bg-[var(--os-hover)]">
          Open record <Icon icon={I.chevronRight} size={13} />
        </Link>
      </aside>
    </div>
  );
}

const CHANNEL_FILTERS = [
  { key: "all", label: "All channels", dot: "" },
  { key: "email", label: "Email", dot: channelMeta.email.dot },
  { key: "sms", label: "SMS", dot: channelMeta.sms.dot },
  { key: "portal", label: "Portal", dot: channelMeta.portal.dot },
] as const;

export default function InboxPage() {
  const [filter, setFilter] = useState<string>("mine");
  const [channel, setChannel] = useState<string>("all");
  const f = inboxFilters.find(x => x.key === filter)!;
  const list = threads.filter(t => f.test(t) && (channel === "all" || t.channel === channel));
  const [selected, setSelected] = useState<string>(() => threads.find(t => t.status === "open" && t.assignee === "u-antonio")?.id ?? threads[0].id);
  const thread = list.find(t => t.id === selected) || list[0];

  const counts = inboxFilters.reduce<Record<string, number>>((a, x) => { a[x.key] = threads.filter(x.test).length; return a; }, {});

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[var(--os-border)] px-8 py-3">
        <Icon icon={I.inbox} size={16} className="text-[var(--os-ink-muted)]" />
        <h1 className="text-[14px] font-semibold text-[var(--os-ink)] os-display">Inbox</h1>
        <div className="ml-auto flex items-center gap-1.5">
          <button className="grid size-7 place-items-center rounded-md text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)]"><Icon icon={I.search} size={15} /></button>
          <button className="flex h-7 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-2.5 text-[12px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97]"><Icon icon={I.edit} size={15} /> Compose</button>
        </div>
      </div>

      {/* Filters: status pills (left) + channel filter (right) */}
      <div className="flex items-center gap-1.5 border-b border-[var(--os-border)] px-8 py-1.5">
        {inboxFilters.map(t => (
          <button
            key={t.key}
            onClick={() => { setFilter(t.key); const next = threads.filter(x => t.test(x) && (channel === "all" || x.channel === channel)); if (next.length) setSelected(next[0].id); }}
            className={cn("flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[13px] transition-colors", filter === t.key ? "bg-[var(--os-selected)] font-medium text-[var(--os-ink)]" : "text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)]")}
          >
            {t.label}
            <span className="text-[11px] tabular-nums text-[var(--os-ink-subtle)]">{counts[t.key]}</span>
          </button>
        ))}
        <div className="ml-auto flex items-center gap-0.5">
          {CHANNEL_FILTERS.map(c => (
            <button
              key={c.key}
              onClick={() => { setChannel(c.key); const next = threads.filter(x => f.test(x) && (c.key === "all" || x.channel === c.key)); if (next.length) setSelected(next[0].id); }}
              className={cn("flex h-7 items-center gap-1.5 rounded-md px-2 text-[12px] transition-colors", channel === c.key ? "bg-[var(--os-selected)] font-medium text-[var(--os-ink)]" : "text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)]")}
            >
              {c.dot && <span className={cn("size-1.5 rounded-full", c.dot)} />}
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Conversation list (Linear) */}
        <div className="flex w-[340px] shrink-0 flex-col overflow-y-auto border-r border-[var(--os-border)]">
          {list.length === 0 ? (
            <div className="grid flex-1 place-items-center px-6 text-center text-[13px] text-[var(--os-ink-subtle)]">Nothing here.</div>
          ) : list.map(t => (
            <button
              key={t.id}
              onClick={() => setSelected(t.id)}
              className={cn("group flex gap-2.5 border-b border-[var(--os-border)] px-3.5 py-3 text-left transition-colors", t.id === thread?.id ? "bg-[var(--os-selected)]" : "hover:bg-[var(--os-hover)]")}
            >
              <div className="relative mt-0.5 shrink-0">
                <span className="grid size-7 place-items-center rounded-full bg-[var(--os-selected)] text-[10px] font-medium text-[var(--os-ink-muted)]">{initials(t.clientName)}</span>
                <span className={cn("absolute -bottom-0.5 -right-0.5 size-3 rounded-full ring-2 ring-[var(--os-bg)]", channelMeta[t.channel].dot)} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={cn("truncate text-[13px] text-[var(--os-ink)]", t.unread ? "font-semibold" : "font-medium")}>{t.subject}</span>
                  <span className="ml-auto shrink-0 text-[11px] tabular-nums text-[var(--os-ink-subtle)]">{t.time}</span>
                  {t.unread && <span className="size-2 shrink-0 rounded-full bg-[var(--os-accent)]" />}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-[var(--os-ink-muted)]">
                  {t.petalDraft && <PetalMark className="size-3 shrink-0" />}
                  <span className="truncate">{contextLine(t)} · {t.clientName}</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Thread */}
        <AnimatePresence mode="wait">
          {thread && (
            <motion.div key={thread.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.16, ease: "easeOut" }} className="flex min-w-0 flex-1">
              <ThreadView thread={thread} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import { Icon, I } from "@/components/os/icon";
import { channelMeta, type Thread, type Message } from "@/lib/os-inbox";
import { people } from "@/lib/os-entities";

const initials = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2);
const first = (name: string) => name.split(" ")[0];
function emailFor(author: string, from: Message["from"]) {
  if (from === "firm") return `${first(author).toLowerCase()}@vazantea.com`;
  return people.find(p => p.name === author)?.email ?? `${first(author).toLowerCase()}@gmail.com`;
}

/** Per-channel conversation + reply composer. Shared by the Inbox and the client record Messages tab.
 *  Renders as a flex-1 scrolling message area + a composer pinned beneath — drop it into a flex-col parent. */
export function ThreadConversation({ thread }: { thread: Thread }) {
  const [reply, setReply] = useState(thread.petalDraft?.text ?? "");

  return (
    <>
      {/* Conversation — rendered per channel */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className={cn("mx-auto max-w-[640px]", thread.channel === "sms" ? "space-y-2.5" : thread.channel === "email" ? "space-y-0" : "space-y-5")}>
          {thread.messages.map((msg, i) => {
            // ── Email: full-width message blocks ──
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
    </>
  );
}

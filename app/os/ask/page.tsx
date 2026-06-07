"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import { Icon, I } from "@/components/os/icon";

type Msg = { id: number; role: "user" | "petal" };

const EXAMPLES: { icon: typeof I.returns; title: string; desc: string; prompt: string }[] = [
  { icon: I.returns, title: "Draft a return", desc: "Turn a client's documents into a reviewable draft.", prompt: "Draft the 2025 return for Marcus Chen" },
  { icon: I.search, title: "Research a question", desc: "Answer a tax question, grounded in the client's file.", prompt: "Why did Marcus Chen's wages drop 40% this year?" },
  { icon: I.mail, title: "Draft a message", desc: "Write a client reminder or update in your voice.", prompt: "Draft a reminder to Priya for her missing documents" },
];

const SOURCES = [
  "W-2 2025.pdf",
  "Apr 8 meeting notes",
  "2024 Return.pdf",
];

const GROUNDING: { icon: keyof typeof I; label: string }[] = [
  { icon: "knowledge", label: "Firm Constitution" },
  { icon: "sparkle", label: "Client Memory" },
  { icon: "file", label: "Prior-year returns" },
  { icon: "clients", label: "QuickBooks Online" },
  { icon: "mail", label: "Gmail" },
];

function Cite({ n }: { n: number }) {
  return (
    <button className="mx-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded bg-[var(--os-selected)] px-1 align-[2px] text-[10px] font-medium tabular-nums text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-border-strong)]">
      {n}
    </button>
  );
}

function UserBubble() {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] rounded-2xl rounded-br-md bg-[var(--os-selected)] px-3.5 py-2 text-[13px] leading-relaxed text-[var(--os-ink)]">
        Why did Marcus Chen&apos;s wages drop 40% this year?
      </div>
    </div>
  );
}

function PetalAnswer() {
  return (
    <div className="flex gap-3">
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--os-bg-subtle)] ring-1 ring-[var(--os-border)]">
        <PetalMark className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-relaxed text-[var(--os-ink)]">
          Marcus&apos;s W-2 wages fell from <span className="font-medium tabular-nums">$96,400</span> to{" "}
          <span className="font-medium tabular-nums">$58,000</span> because his second restaurant location closed in
          Q2 2025<Cite n={1} />. That matches the note from your April 8 call, where he mentioned winding down the
          Riverside spot<Cite n={2} />. His Schedule C business income actually rose 19% over the same period<Cite n={3} />,
          so total household income is down only ~8%, not 40%.
        </p>
        <p className="mt-2.5 text-[13px] leading-relaxed text-[var(--os-ink)]">
          One thing to confirm verbally before filing: the W-2 reduction isn&apos;t backed by a termination letter in his
          documents, so I&apos;ve flagged it rather than treating it as final.
        </p>

        {/* Sources strip */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-[var(--os-ink-subtle)]">Sources</span>
          {SOURCES.map((s, i) => (
            <button
              key={s}
              className="inline-flex items-center gap-1.5 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2 py-1 text-[12px] text-[var(--os-ink-muted)] transition-colors hover:border-[var(--os-border-strong)] hover:text-[var(--os-ink)]"
            >
              <span className="text-[10px] font-medium tabular-nums text-[var(--os-ink-subtle)]">{i + 1}</span>
              <Icon icon={I.file} size={13} className="text-[var(--os-ink-subtle)]" />
              <span className="truncate">{s}</span>
            </button>
          ))}
        </div>

        {/* The "Do" gear — turn the answer into a run */}
        <div className="mt-3.5 flex items-center gap-3 rounded-lg border border-[var(--os-border)] bg-[var(--os-bg-subtle)] px-3.5 py-2.5">
          <span className="grid size-7 shrink-0 place-items-center rounded-md bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-sm ring-1 ring-inset ring-white/20">
            <Icon icon={I.skills} size={15} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-medium text-[var(--os-ink)]">Want me to draft the 2025 return?</div>
            <div className="text-[12px] text-[var(--os-ink-muted)]">Runs the 1040 Drafter skill — lands in Tasks for your review.</div>
          </div>
          <button className="shrink-0 flex h-7 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-2.5 text-[12px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97]">
            <Icon icon={I.trigger} size={14} /> Start run
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AskPetalPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"ask" | "research" | "do">("ask");

  const hasConvo = messages.length > 0;

  const send = () => {
    if (!input.trim()) return;
    setMessages(m => [...m, { id: Date.now(), role: "user" }, { id: Date.now() + 1, role: "petal" }]);
    setInput("");
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[var(--os-border)] px-8 py-3">
        <button className="ml-1 flex h-6 items-center gap-1.5 rounded-md px-1.5 text-[12px] text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)]">
          <Icon icon={I.clients} size={13} /> All clients <Icon icon={I.chevronDown} size={12} className="text-[var(--os-ink-subtle)]" />
        </button>
        <button
          onClick={() => setMessages([])}
          className="ml-auto flex h-7 items-center gap-1.5 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2.5 text-[12px] transition-colors hover:bg-[var(--os-hover)]"
        >
          <Icon icon={I.newChat} size={14} /> New chat
        </button>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Conversation column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto">
            {hasConvo ? (
              <div className="mx-auto max-w-[720px] space-y-6 px-6 py-6">
                {messages.map(m => (
                  <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, ease: "easeOut" }}>
                    {m.role === "user" ? <UserBubble /> : <PetalAnswer />}
                  </motion.div>
                ))}
              </div>
            ) : (
              // Welcome (Linear "Ask" composition)
              <div className="relative mx-auto flex h-full w-full max-w-[760px] flex-col items-center justify-center px-6">
                <div className="w-full">
                  <h2 className="text-center text-[24px] font-semibold os-display">Welcome to Petal</h2>
                  <p className="mt-1.5 text-center text-[13px] text-[var(--os-ink-muted)]">Ask anything, or tell Petal what to do.</p>

                  <div className="mt-6 rounded-xl border border-[var(--os-border-strong)] bg-[var(--os-surface)] px-3.5 py-3 shadow-sm transition-shadow focus-within:shadow-md">
                    <input
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") send(); }}
                      placeholder="Ask Petal…"
                      autoFocus
                      className="w-full bg-transparent text-[14px] text-[var(--os-ink)] placeholder:text-[var(--os-ink-subtle)] focus:outline-none"
                    />
                    <div className="mt-3 flex items-center gap-1.5">
                      <button className="flex h-7 items-center gap-1.5 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2 text-[12px] text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)]"><Icon icon={I.skills} size={14} /> Skills <Icon icon={I.chevronDown} size={12} className="text-[var(--os-ink-subtle)]" /></button>
                      <div className="ml-auto flex items-center gap-1">
                        <button className="grid size-7 place-items-center rounded-md text-[var(--os-ink-subtle)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]"><Icon icon={I.attach} size={15} /></button>
                        <button onClick={send} disabled={!input.trim()} className="grid size-7 place-items-center rounded-full bg-[var(--os-primary)] text-[var(--os-primary-fg)] transition-transform active:scale-95 disabled:opacity-30"><Icon icon={I.send} size={15} /></button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center">
                      <span className="text-[12px] text-[var(--os-ink-muted)]">Get started with some examples</span>
                      <button className="ml-auto grid size-5 place-items-center rounded text-[var(--os-ink-subtle)] transition-colors hover:text-[var(--os-ink)]"><Icon icon={I.close} size={13} /></button>
                    </div>
                    <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {EXAMPLES.map(ex => (
                        <button key={ex.title} onClick={() => setInput(ex.prompt)} className="flex flex-col rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] p-3.5 text-left transition-colors hover:border-[var(--os-border-strong)] hover:bg-[var(--os-hover)]">
                          <Icon icon={ex.icon} size={17} className="text-[var(--os-ink-muted)]" />
                          <div className="mt-6 text-[13px] font-medium text-[var(--os-ink)]">{ex.title}</div>
                          <div className="mt-1 text-[12px] leading-snug text-[var(--os-ink-muted)]">{ex.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Composer (in-conversation) */}
          {hasConvo && (
          <div className="px-6 pb-5 pt-2">
            <div className="mx-auto max-w-[720px]">
              <div className="rounded-2xl border border-[var(--os-border-strong)] bg-[var(--os-surface)] px-3 py-2.5 shadow-sm transition-shadow focus-within:shadow-md">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") send(); }}
                  placeholder="Ask Petal anything, or describe work to run…"
                  className="w-full bg-transparent text-[13px] text-[var(--os-ink)] placeholder:text-[var(--os-ink-subtle)] focus:outline-none"
                />
                <div className="mt-2.5 flex items-center gap-1.5">
                  {/* mode segmented */}
                  <div className="flex items-center gap-0.5 rounded-lg bg-[var(--os-bg-subtle)] p-0.5">
                    {([["ask", I.sparkle, "Ask"], ["research", I.globe, "Research"], ["do", I.trigger, "Do"]] as const).map(([key, icon, label]) => (
                      <button
                        key={key}
                        onClick={() => setMode(key)}
                        className={cn(
                          "flex h-6 items-center gap-1.5 rounded-md px-2 text-[12px] transition-colors",
                          mode === key ? "bg-[var(--os-surface)] font-medium text-[var(--os-ink)] shadow-sm" : "text-[var(--os-ink-muted)] hover:text-[var(--os-ink)]",
                        )}
                      >
                        <Icon icon={icon} size={13} /> {label}
                      </button>
                    ))}
                  </div>
                  <button className="flex h-6 items-center gap-1.5 rounded-md px-2 text-[12px] text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)]">
                    <Icon icon={I.attach} size={14} />
                  </button>
                  <button
                    onClick={send}
                    disabled={!input.trim()}
                    className="ml-auto grid size-7 place-items-center rounded-full bg-[var(--os-primary)] text-[var(--os-primary-fg)] transition-transform active:scale-95 disabled:opacity-30"
                  >
                    <Icon icon={I.send} size={15} />
                  </button>
                </div>
              </div>
              <p className="mt-1.5 text-center text-[11px] text-[var(--os-ink-subtle)]">Petal answers only from sources it can cite. Output never touches a record until you approve it.</p>
            </div>
          </div>
          )}
        </div>

        {/* Context rail */}
        {hasConvo && (
        <aside className="hidden w-[280px] shrink-0 overflow-y-auto border-l border-[var(--os-border)] px-4 py-5 xl:block">
          <div className="os-label mb-2">Scope</div>
          <button className="mb-5 flex w-full items-center gap-2 rounded-lg border border-[var(--os-border)] px-3 py-2 text-left text-[13px] transition-colors hover:bg-[var(--os-hover)]">
            <Icon icon={I.clients} size={15} className="text-[var(--os-ink-muted)]" />
            <span className="flex-1 text-[var(--os-ink)]">All clients</span>
            <Icon icon={I.chevronDown} size={13} className="text-[var(--os-ink-subtle)]" />
          </button>

          <div className="os-label mb-2">Grounded in</div>
          <div className="space-y-0.5">
            {GROUNDING.map(g => (
              <div key={g.label} className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px]">
                <Icon icon={I[g.icon]} size={15} className="shrink-0 text-[var(--os-ink-subtle)]" />
                <span className="flex-1 truncate text-[var(--os-ink)]">{g.label}</span>
                <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-[var(--os-ink-subtle)]">
            Petal grounds every answer in these sources and cites them. Connect more in Settings → Integrations.
          </p>
        </aside>
        )}
      </div>
    </div>
  );
}

"use client";

// Ask Petal - the full-page chat. Answers come from the scripted demo bank
// (lib/fixtures/demo-chat) keyword-matched against whatever is typed; every
// number in an answer derives from canon. ?q= runs a question on arrival
// (the Today composer hands off here).

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import { PetalLogo } from "@/components/petal-logo";
import { Icon, I } from "@/components/os/icon";
import { Mic } from "lucide-react";
import { usePetalChat, PetalAnswerView, type ChatMsg } from "@/components/os/petal-chat";
import { SUGGESTED_QUESTIONS } from "@/lib/fixtures/demo-chat";
import { skills, households, householdById } from "@/lib/fixtures/firm";
import { connectionStore, useConnections } from "@/lib/connection-store";
import { SkillPetal } from "@/components/os/primitives";
import { Tip } from "@/components/os/tooltip";
import { useAutogrow } from "@/lib/os/use-autogrow";

/** Unified composer - same in the empty state and in-conversation. + attach · Skills · mic · send. */
function Composer({ value, onChange, onSubmit, autoFocus, big, onAttach }: { value: string; onChange: (v: string) => void; onSubmit: () => void; autoFocus?: boolean; big?: boolean; onAttach?: (file: File) => void }) {
  const [skillsOpen, setSkillsOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  // claude.ai-style composer: grows from one line up to ~17 lines as you type / shift+enter, then scrolls.
  const taRef = useAutogrow(value);
  return (
    <div className="rounded-2xl border border-[var(--os-border-strong)] bg-[var(--os-surface)] px-3.5 py-3 shadow-[0_1px_2px_rgba(17,17,26,0.04)] transition-shadow focus-within:shadow-[0_2px_10px_-2px_rgba(17,17,26,0.10)]">
      <textarea
        ref={taRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSubmit(); } }}
        rows={1}
        autoFocus={autoFocus}
        placeholder="Ask Petal anything, or describe work to run…"
        className={cn("w-full resize-none bg-transparent leading-relaxed text-[var(--os-ink)] placeholder:text-[var(--os-ink-subtle)] focus:outline-none", big ? "text-[15px]" : "text-[14px]")}
      />
      <div className="mt-2.5 flex items-center gap-1.5">
        <Tip label="Attach files" side="top"><button type="button" onClick={() => fileRef.current?.click()} aria-label="Attach" className="grid size-8 shrink-0 place-items-center rounded-full border border-[var(--os-border)] text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)]"><Icon icon={I.plus} size={16} /></button></Tip>
        <input ref={fileRef} type="file" accept="application/pdf,image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onAttach?.(f); e.target.value = ""; }} />
        {/* Skills picker */}
        <div className="relative">
          <button
            onClick={() => setSkillsOpen(o => !o)}
            aria-expanded={skillsOpen}
            className={cn("flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-medium transition-colors", skillsOpen ? "border-[var(--os-border-strong)] bg-[var(--os-selected)] text-[var(--os-ink)]" : "border-[var(--os-border)] text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]")}
          >
            <PetalMark className="size-3.5" /> Skills
          </button>
          {skillsOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setSkillsOpen(false)} />
              <div className="absolute bottom-full left-0 z-40 mb-2 max-h-[300px] w-[286px] overflow-y-auto rounded-xl border border-[var(--os-border)] bg-[var(--os-surface)] p-1 shadow-[0_12px_34px_-8px_rgba(17,17,26,0.2)]">
                <div className="os-label px-2.5 pb-1 pt-1.5">Run a skill</div>
                {skills.map(s => (
                  <button key={s.id} onClick={() => { onChange(`Run the ${s.name} skill`); setSkillsOpen(false); }} className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left transition-colors hover:bg-[var(--os-hover)]">
                    <SkillPetal category={s.category} size={15} />
                    <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--os-ink)]">{s.name}</span>
                    <Icon icon={I.chevronRight} size={12} className="shrink-0 text-[var(--os-ink-subtle)]" />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <Tip label="Voice input" side="top"><button aria-label="Voice" className="grid size-8 shrink-0 place-items-center rounded-full text-[var(--os-ink-subtle)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]"><Mic className="size-[17px]" strokeWidth={1.75} /></button></Tip>
          <Tip label="Send" side="top"><button onClick={onSubmit} disabled={!value.trim()} aria-label="Send" className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--os-primary)] text-[var(--os-primary-fg)] transition-transform active:scale-95 disabled:opacity-30"><Icon icon={I.send} size={15} /></button></Tip>
        </div>
      </div>
    </div>
  );
}

const STARTERS: { icon: typeof I.returns; label: string; prompt: string }[] = [
  { icon: I.shield, label: "Run a risk scan across my book", prompt: "Run a risk scan across my book" },
  { icon: I.billing, label: "Show me the financial picture", prompt: "Show me the financial picture of the practice" },
  { icon: I.history, label: "Can I take on more clients?", prompt: "Can I take on more clients?" },
  { icon: I.tasks, label: "What needs me today?", prompt: "What needs me today?" },
];

// Petal-native knowledge (always on) + connected integrations (status from the
// connections store). Each row links somewhere real; nothing is decorative.
const GROUNDING: { label: string; href: string; icon?: keyof typeof I; petal?: boolean; logo?: string; connectId?: string }[] = [
  { label: "Firm Constitution", href: "/os/knowledge", icon: "knowledge" },
  { label: "Client Memory", href: "/os/memory", petal: true },
  { label: "Prior-year returns", href: "/os/documents", icon: "file" },
  { label: "QuickBooks Online", href: "/os/connections", logo: "/logos/quickbooks.svg", connectId: "qbo" },
  { label: "Gmail", href: "/os/connections", logo: "/logos/gmail.svg", connectId: "gmail" },
];

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] rounded-2xl rounded-br-md bg-[var(--os-selected)] px-3.5 py-2 text-[13px] leading-relaxed text-[var(--os-ink)]">
        {text}
      </div>
    </div>
  );
}

function PetalBubble({ msg, isLatest, onSuggest }: { msg: Extract<ChatMsg, { role: "petal" }>; isLatest: boolean; onSuggest: (q: string) => void }) {
  return (
    <div className="flex gap-3">
      <PetalLogo
        key={msg.thinking ? "load" : "done"}
        loading={msg.thinking}
        className="mt-0.5 size-6 shrink-0 text-[var(--os-primary)]"
      />
      <div className="min-w-0 flex-1 pt-1">
        <PetalAnswerView answer={msg.answer} thinking={msg.thinking} liveSteps={msg.liveSteps} streamingText={msg.streamingText} traceTitle={msg.traceTitle} stream={isLatest} onSuggest={onSuggest} />
      </div>
    </div>
  );
}

function AskPetalInner() {
  const params = useSearchParams();
  const [scopeId, setScopeId] = useState<string | undefined>(undefined);
  const [scopeOpen, setScopeOpen] = useState(false);
  const { messages, send, reset, openThread, analyze } = usePetalChat(scopeId);
  useConnections(); // re-render the grounding rail when a source is (dis)connected
  const [dragOver, setDragOver] = useState(false);
  const onDropFile = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) analyze(f);
  };
  const scopeLabel = scopeId ? householdById(scopeId)?.name ?? "All clients" : "All clients";
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const ranParam = useRef(false);

  const hasConvo = messages.length > 0;

  // Arrival handoff: ?thread= reopens a persisted conversation (sidebar Recent /
  // history overlay); ?q= runs a fresh question (the Today composer). One-shot.
  useEffect(() => {
    if (ranParam.current) return;
    const thread = params.get("thread");
    const q = params.get("q");
    if (thread) {
      ranParam.current = true;
      void openThread(thread);
    } else if (q) {
      ranParam.current = true;
      send(q);
    }
  }, [params, send, openThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const submit = (text?: string) => {
    const q = (text ?? input).trim();
    if (!q) return;
    send(q);
    setInput("");
  };

  const lastPetalId = [...messages].reverse().find(m => m.role === "petal")?.id;

  return (
    <div className="flex h-full flex-col">
      {/* Header — scope (what Petal is allowed to look at) + new chat */}
      <div className="flex items-center gap-2 border-b border-[var(--os-border)] px-8 py-3">
        <div className="relative">
          <button
            onClick={() => setScopeOpen(o => !o)}
            aria-expanded={scopeOpen}
            className={cn("flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-[12.5px] transition-colors", scopeOpen ? "border-[var(--os-border-strong)] bg-[var(--os-selected)] text-[var(--os-ink)]" : "border-[var(--os-border)] text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]")}
          >
            <Icon icon={I.clients} size={13} className="text-[var(--os-ink-subtle)]" />
            <span className="text-[var(--os-ink)]">{scopeLabel}</span>
            <Icon icon={I.chevronDown} size={12} className={cn("text-[var(--os-ink-subtle)] transition-transform", scopeOpen && "rotate-180")} />
          </button>
          {scopeOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setScopeOpen(false)} />
              <div className="absolute left-0 top-9 z-20 max-h-[320px] w-[240px] overflow-y-auto rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] p-1 shadow-[0_10px_34px_rgba(17,17,26,0.13)]">
                <div className="os-label px-2 pb-1 pt-0.5">Scope this chat to</div>
                <button onClick={() => { setScopeId(undefined); setScopeOpen(false); }} className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors hover:bg-[var(--os-hover)]", !scopeId ? "text-[var(--os-ink)]" : "text-[var(--os-ink-muted)]")}>
                  <Icon icon={I.clients} size={14} className="text-[var(--os-ink-subtle)]" /> All clients {!scopeId && <Icon icon={I.check} size={13} className="ml-auto text-[var(--os-ink)]" />}
                </button>
                <div className="my-1 h-px bg-[var(--os-border)]" />
                {households.map(h => (
                  <button key={h.id} onClick={() => { setScopeId(h.id); setScopeOpen(false); }} className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors hover:bg-[var(--os-hover)]", scopeId === h.id ? "text-[var(--os-ink)]" : "text-[var(--os-ink-muted)]")}>
                    <span className="truncate">{h.name}</span>
                    {scopeId === h.id && <Icon icon={I.check} size={13} className="ml-auto shrink-0 text-[var(--os-ink)]" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <button
          onClick={() => { reset(); setInput(""); }}
          className="ml-auto flex h-7 items-center gap-1.5 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2.5 text-[12.5px] text-[var(--os-ink)] transition-colors hover:bg-[var(--os-hover)]"
        >
          <Icon icon={I.edit} size={13} className="text-[var(--os-ink-muted)]" /> New chat
        </button>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Conversation column */}
        <div
          className="relative flex min-w-0 flex-1 flex-col"
          onDragOver={e => { if (e.dataTransfer.types.includes("Files")) { e.preventDefault(); setDragOver(true); } }}
          onDragLeave={e => { if (e.currentTarget === e.target) setDragOver(false); }}
          onDrop={onDropFile}
        >
          {dragOver && (
            <div className="pointer-events-none absolute inset-0 z-30 m-3 grid place-items-center rounded-xl border-2 border-dashed border-[var(--os-accent)] bg-[var(--os-accent)]/[0.05]">
              <span className="rounded-full bg-[var(--os-primary)] px-3.5 py-1.5 text-[12.5px] font-medium text-[var(--os-primary-fg)] shadow-[0_10px_34px_rgba(17,17,26,0.25)]">Drop a document for Petal to analyze</span>
            </div>
          )}
          <div className="flex-1 overflow-y-auto">
            {hasConvo ? (
              <div className="mx-auto max-w-[720px] space-y-6 px-6 py-6">
                {messages.map(m => (
                  <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, ease: "easeOut" }}>
                    {m.role === "user"
                      ? <UserBubble text={m.text} />
                      : <PetalBubble msg={m} isLatest={m.id === lastPetalId} onSuggest={submit} />}
                  </motion.div>
                ))}
                <div ref={bottomRef} />
              </div>
            ) : (
              // Empty state - chat-first starter
              <div className="mx-auto flex h-full w-full max-w-[680px] flex-col px-6 pb-6">
                <div className="flex-1" />
                <PetalLogo className="mb-3 size-7 text-[var(--os-primary)]" />
                <h2 className="text-[26px] font-semibold leading-tight os-display text-[var(--os-ink)]">What can I help you with, Antonio?</h2>

                <div className="mt-5 space-y-0.5">
                  {STARTERS.map(s => (
                    <button key={s.label} onClick={() => submit(s.prompt)} className="group/s -mx-2 flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-[var(--os-hover)]">
                      <Icon icon={s.icon} size={16} className="shrink-0 text-[var(--os-ink-muted)]" />
                      <span className="flex-1 truncate text-[14px] text-[var(--os-ink-muted)] transition-colors group-hover/s:text-[var(--os-ink)]">{s.label}</span>
                      <Icon icon={I.chevronRight} size={14} className="shrink-0 text-[var(--os-ink-subtle)] opacity-0 transition-opacity group-hover/s:opacity-100" />
                    </button>
                  ))}
                </div>

                <div className="mt-7">
                  <Composer value={input} onChange={setInput} onSubmit={() => submit()} autoFocus big onAttach={analyze} />
                </div>
              </div>
            )}
          </div>

          {/* Composer (in-conversation) */}
          {hasConvo && (
          <div className="px-6 pb-5 pt-2">
            <div className="mx-auto max-w-[720px]">
              <Composer value={input} onChange={setInput} onSubmit={() => submit()} autoFocus onAttach={analyze} />
              <p className="mt-1.5 text-center text-[11px] text-[var(--os-ink-subtle)]">Petal answers only from sources it can cite. Output never touches a record until you approve it.</p>
            </div>
          </div>
          )}
        </div>

        {/* Context rail — what Petal grounds its answers in */}
        {hasConvo && (
        <aside className="hidden w-[288px] shrink-0 overflow-y-auto border-l border-[var(--os-border)] px-4 py-5 xl:block">
          <div className="flex items-center gap-1.5">
            <PetalMark className="size-3.5 text-[var(--os-ink-muted)]" />
            <span className="os-label">Grounded in</span>
          </div>
          <div className="mt-2.5 space-y-0.5">
            {GROUNDING.map(g => {
              const connected = g.connectId ? connectionStore.isConnected(g.connectId) : true;
              return (
                <Link
                  key={g.label}
                  href={g.href}
                  className="group -mx-2 flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-[var(--os-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]"
                >
                  <span className="grid size-6 shrink-0 place-items-center overflow-hidden rounded-md border border-[var(--os-border)] bg-white">
                    {g.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={g.logo} alt="" className="size-4 object-contain" />
                    ) : g.petal ? (
                      <PetalMark className="size-3.5 text-[var(--os-ink-muted)]" />
                    ) : (
                      <Icon icon={I[g.icon!]} size={13} className="text-[var(--os-ink-muted)]" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--os-ink)]">{g.label}</span>
                  {connected ? (
                    <Icon icon={I.check} size={13} className="shrink-0 text-[var(--os-ink-subtle)]" />
                  ) : (
                    <span className="shrink-0 text-[11px] font-medium text-[var(--os-link)] opacity-0 transition-opacity group-hover:opacity-100">Connect</span>
                  )}
                </Link>
              );
            })}
          </div>
          <p className="mt-3 px-0.5 text-[11.5px] leading-relaxed text-[var(--os-ink-subtle)]">
            Every answer is grounded in these sources and cited.{" "}
            <Link href="/os/connections" className="font-medium text-[var(--os-link)] hover:underline">Manage connections →</Link>
          </p>
        </aside>
        )}
      </div>
    </div>
  );
}

export default function AskPetalPage() {
  return (
    <Suspense>
      <AskPetalInner />
    </Suspense>
  );
}

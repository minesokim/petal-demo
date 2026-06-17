"use client";

// Ask Petal - the full-page chat. Answers come from the scripted demo bank
// (lib/fixtures/demo-chat) keyword-matched against whatever is typed; every
// number in an answer derives from canon. ?q= runs a question on arrival
// (the Today composer hands off here).

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import { Icon, I } from "@/components/os/icon";
import { Mic } from "lucide-react";
import { usePetalChat, PetalAnswerView, type ChatMsg } from "@/components/os/petal-chat";
import { SUGGESTED_QUESTIONS } from "@/lib/fixtures/demo-chat";
import { skills } from "@/lib/fixtures/firm";
import { SkillPetal } from "@/components/os/primitives";
import { Tip } from "@/components/os/tooltip";

/** Unified composer - same in the empty state and in-conversation. + attach · Skills · mic · send. */
function Composer({ value, onChange, onSubmit, autoFocus, big }: { value: string; onChange: (v: string) => void; onSubmit: () => void; autoFocus?: boolean; big?: boolean }) {
  const [skillsOpen, setSkillsOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-[var(--os-border-strong)] bg-[var(--os-surface)] px-3.5 py-3 shadow-[0_1px_2px_rgba(17,17,26,0.04)] transition-shadow focus-within:shadow-[0_2px_10px_-2px_rgba(17,17,26,0.10)]">
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSubmit(); } }}
        rows={1}
        autoFocus={autoFocus}
        placeholder="Ask Petal anything, or describe work to run…"
        className={cn("max-h-40 w-full resize-none bg-transparent leading-relaxed text-[var(--os-ink)] placeholder:text-[var(--os-ink-subtle)] focus:outline-none", big ? "text-[15px]" : "text-[14px]")}
      />
      <div className="mt-2.5 flex items-center gap-1.5">
        <Tip label="Attach files" side="top"><button aria-label="Attach" className="grid size-8 shrink-0 place-items-center rounded-full border border-[var(--os-border)] text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)]"><Icon icon={I.plus} size={16} /></button></Tip>
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

const GROUNDING: { icon: keyof typeof I; label: string }[] = [
  { icon: "knowledge", label: "Firm Constitution" },
  { icon: "sparkle", label: "Client Memory" },
  { icon: "file", label: "Prior-year returns" },
  { icon: "clients", label: "QuickBooks Online" },
  { icon: "mail", label: "Gmail" },
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
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--os-bg-subtle)] ring-1 ring-[var(--os-border)]">
        <PetalMark className="size-4" />
      </span>
      <div className="min-w-0 flex-1 pt-1">
        <PetalAnswerView answer={msg.answer} thinking={msg.thinking} stream={isLatest} onSuggest={onSuggest} />
      </div>
    </div>
  );
}

function AskPetalInner() {
  const params = useSearchParams();
  const { messages, send, reset } = usePetalChat();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const ranParam = useRef(false);

  const hasConvo = messages.length > 0;

  // the Today composer hands its question off via ?q=
  useEffect(() => {
    const q = params.get("q");
    if (q && !ranParam.current) {
      ranParam.current = true;
      send(q);
    }
  }, [params, send]);

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
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[var(--os-border)] px-8 py-3">
        <button className="ml-1 flex h-6 items-center gap-1.5 rounded-md px-1.5 text-[12px] text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)]">
          <Icon icon={I.clients} size={13} /> All clients <Icon icon={I.chevronDown} size={12} className="text-[var(--os-ink-subtle)]" />
        </button>
        <button
          onClick={() => { reset(); setInput(""); }}
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
                <PetalMark className="mb-3 size-6" />
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
                  <Composer value={input} onChange={setInput} onSubmit={() => submit()} autoFocus big />
                </div>
              </div>
            )}
          </div>

          {/* Composer (in-conversation) */}
          {hasConvo && (
          <div className="px-6 pb-5 pt-2">
            <div className="mx-auto max-w-[720px]">
              <Composer value={input} onChange={setInput} onSubmit={() => submit()} autoFocus />
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
                <span className="size-1.5 shrink-0 rounded-full bg-[var(--os-brand)]" />
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

export default function AskPetalPage() {
  return (
    <Suspense>
      <AskPetalInner />
    </Suspense>
  );
}

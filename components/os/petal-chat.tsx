"use client";

// Petal chat runtime — shared by /os/ask and the client-record @Petal rail.
// Answers come from the scripted demo bank (lib/fixtures/demo-chat); this file
// owns the conversation state, the streaming reveal, and the answer renderer.

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import { Icon, I } from "@/components/os/icon";
import { SkillPetal } from "@/components/os/primitives";
import { matchQuestion, type ChatAnswer } from "@/lib/fixtures/demo-chat";

export type ChatMsg =
  | { id: number; role: "user"; text: string }
  | { id: number; role: "petal"; answer: ChatAnswer; thinking?: boolean };

let msgSeq = 1;

export function usePetalChat(scopeHouseholdId?: string) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);

  const send = useCallback((text: string) => {
    const q = text.trim();
    if (!q) return;
    const thinkingId = ++msgSeq + 1;
    setMessages(m => [
      ...m,
      { id: ++msgSeq, role: "user", text: q },
      { id: thinkingId, role: "petal", answer: { paragraphs: [] }, thinking: true },
    ]);
    const answer = matchQuestion(q, scopeHouseholdId);
    window.setTimeout(() => {
      setMessages(m => m.map(msg => (msg.id === thinkingId ? { ...msg, answer, thinking: false } : msg)));
    }, 650);
  }, [scopeHouseholdId]);

  const reset = useCallback(() => setMessages([]), []);

  return { messages, send, reset };
}

/** word-by-word reveal for one paragraph string; instant under reduced motion */
function useStreamedText(text: string, active: boolean) {
  const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const [count, setCount] = useState(active && !reduced ? 0 : Infinity);
  const words = text.split(" ");
  useEffect(() => {
    if (!active || reduced) return;
    setCount(0);
    let i = 0;
    const t = window.setInterval(() => {
      i += 3;
      setCount(i);
      if (i >= words.length) window.clearInterval(t);
    }, 28);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, active]);
  return { visible: words.slice(0, count).join(" "), done: count >= words.length };
}

/** **bold** spans → <strong> */
function Rich({ text }: { text: string }) {
  const parts = text.split("**");
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? <strong key={i} className="font-semibold tabular-nums text-[var(--os-ink)]">{p}</strong> : <span key={i}>{p}</span>,
      )}
    </>
  );
}

function StreamedParagraph({ text, active, onDone }: { text: string; active: boolean; onDone: () => void }) {
  const { visible, done } = useStreamedText(text, active);
  const fired = useRef(false);
  useEffect(() => {
    if (done && !fired.current) { fired.current = true; onDone(); }
  }, [done, onDone]);
  return (
    <p className="text-[13px] leading-relaxed text-[var(--os-ink)]">
      <Rich text={active ? visible : text} />
    </p>
  );
}

function Thinking() {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--os-ink-subtle)]">
      <span className="flex gap-0.5">
        {[0, 1, 2].map(i => (
          <span key={i} className="size-1 animate-pulse rounded-full bg-[var(--os-ink-subtle)]" style={{ animationDelay: `${i * 160}ms` }} />
        ))}
      </span>
      Reading the firm's records…
    </span>
  );
}

export function PetalAnswerView({
  answer,
  thinking,
  stream = true,
  compact = false,
  onSuggest,
}: {
  answer: ChatAnswer;
  thinking?: boolean;
  /** stream the reveal (latest message) vs render instantly (history) */
  stream?: boolean;
  /** tighter type + spacing for the record rail */
  compact?: boolean;
  onSuggest?: (q: string) => void;
}) {
  const [revealed, setRevealed] = useState(stream ? 0 : Infinity);
  const allDone = revealed >= answer.paragraphs.length;

  if (thinking) return <Thinking />;

  return (
    <div className={cn("min-w-0 space-y-2.5", compact && "space-y-2 text-[12.5px]")}>
      {answer.paragraphs.map((p, i) => (
        i <= revealed && (
          <StreamedParagraph
            key={i}
            text={p}
            active={stream && i === revealed}
            onDone={() => setRevealed(r => (r === i ? r + 1 : r))}
          />
        )
      ))}

      {allDone && answer.sources && answer.sources.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[11px] text-[var(--os-ink-subtle)]">Sources</span>
          {answer.sources.map((s, i) => (
            <span key={s} className="inline-flex items-center gap-1.5 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2 py-1 text-[11.5px] text-[var(--os-ink-muted)]">
              <span className="text-[10px] font-medium tabular-nums text-[var(--os-ink-subtle)]">{i + 1}</span>
              <Icon icon={I.file} size={12} className="text-[var(--os-ink-subtle)]" />
              <span className="max-w-[180px] truncate">{s}</span>
            </span>
          ))}
        </div>
      )}

      {allDone && answer.links && answer.links.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {answer.links.map(l => (
            <Link
              key={l.href + l.label}
              href={l.href}
              className="inline-flex items-center gap-1 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2 py-1 text-[12px] font-medium text-[var(--os-ink)] transition-colors hover:bg-[var(--os-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]"
            >
              {l.label} <Icon icon={I.chevronRight} size={11} className="text-[var(--os-ink-subtle)]" />
            </Link>
          ))}
        </div>
      )}

      {allDone && answer.action && (
        <ActionCard action={answer.action} compact={compact} />
      )}

      {allDone && answer.suggest && answer.suggest.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {answer.suggest.map(q => (
            <button
              key={q}
              onClick={() => onSuggest?.(q)}
              className="inline-flex items-center rounded-full border border-[var(--os-border)] px-2.5 py-1 text-[12px] text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]"
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ActionCard({ action, compact }: { action: NonNullable<ChatAnswer["action"]>; compact?: boolean }) {
  const [queued, setQueued] = useState(false);
  return (
    <div className={cn("mt-1 flex items-center gap-3 rounded-lg border border-[var(--os-border)] bg-[var(--os-bg-subtle)] px-3 py-2.5", compact && "px-2.5 py-2")}>
      <SkillPetal category={action.category} size={compact ? 16 : 20} />
      <div className="min-w-0 flex-1">
        <div className={cn("font-medium text-[var(--os-ink)]", compact ? "text-[12px]" : "text-[13px]")}>{action.title}</div>
        <div className={cn("text-[var(--os-ink-muted)]", compact ? "text-[11px]" : "text-[12px]")}>{action.desc}</div>
      </div>
      {queued ? (
        <span className="inline-flex shrink-0 items-center gap-1.5 text-[12px] text-[var(--os-ink-muted)]">
          <PetalMark className="size-3" /> Queued
        </span>
      ) : (
        <button
          onClick={() => setQueued(true)}
          className="flex h-7 shrink-0 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-2.5 text-[12px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]"
        >
          <Icon icon={I.trigger} size={13} /> {action.button}
        </button>
      )}
    </div>
  );
}

"use client";

// Petal chat runtime - shared by /os/ask and the client-record @Petal rail.
// Answers come from the scripted demo bank (lib/fixtures/demo-chat); this file
// owns the conversation state, the agentic reveal (steps → prose → chart →
// findings), and the answer renderer.

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import { Icon, I } from "@/components/os/icon";
import { SkillPetal } from "@/components/os/primitives";
import {
  matchQuestion,
  type ChatAnswer, type ChatStep, type ChatMetric, type ChatChart, type ChatFinding,
} from "@/lib/fixtures/demo-chat";

export type ChatMsg =
  | { id: number; role: "user"; text: string; attachments?: string[] }
  | { id: number; role: "petal"; answer: ChatAnswer; thinking?: boolean };

let msgSeq = 1;

export function usePetalChat(scopeHouseholdId?: string) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);

  const send = useCallback((text: string, attachments?: string[]) => {
    const q = text.trim();
    if (!q && !attachments?.length) return;
    const userId = ++msgSeq;
    const thinkingId = ++msgSeq;
    setMessages(m => [
      ...m,
      { id: userId, role: "user", text: q, attachments },
      { id: thinkingId, role: "petal", answer: { paragraphs: [] }, thinking: true },
    ]);
    const answer = matchQuestion(q || (attachments?.join(", ") ?? ""), scopeHouseholdId);
    // hold the premium loading state for a beat (Petal "working"), then answer
    window.setTimeout(() => {
      setMessages(m => m.map(msg => (msg.id === thinkingId ? { ...msg, answer, thinking: false } : msg)));
    }, 2400);
  }, [scopeHouseholdId]);

  const reset = useCallback(() => setMessages([]), []);

  return { messages, send, reset };
}

const prefersReduced = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** word-by-word reveal for one paragraph string; instant under reduced motion */
function useStreamedText(text: string, active: boolean) {
  const reduced = prefersReduced();
  const [count, setCount] = useState(active && !reduced ? 0 : Infinity);
  const words = text.split(" ");
  useEffect(() => {
    if (!active || reduced) return;
    setCount(0);
    let i = 0;
    const t = window.setInterval(() => {
      i += 1;
      setCount(i);
      if (i >= words.length) window.clearInterval(t);
    }, 55);
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

/** Types a string out word-by-word (Petal's opening read); fires onDone at the end. */
export function StreamedText({ text, className, onDone }: { text: string; className?: string; onDone?: () => void }) {
  const reduced = prefersReduced();
  const words = text.split(" ");
  const [count, setCount] = useState(reduced ? words.length : 0);
  const fired = useRef(false);
  useEffect(() => {
    fired.current = false;
    if (reduced) { setCount(words.length); return; }
    setCount(0);
    let i = 0;
    const t = window.setInterval(() => { i += 1; setCount(i); if (i >= words.length) window.clearInterval(t); }, 26);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);
  const done = count >= words.length;
  useEffect(() => { if (done && !fired.current) { fired.current = true; onDone?.(); } }, [done, onDone]);
  return <p className={className}><Rich text={words.slice(0, count).join(" ")} /></p>;
}

const THINKING_PHRASES = [
  "Reading the firm's records…",
  "Checking deadlines and balances…",
  "Pulling the latest from your tools…",
  "Drafting your response…",
];

function Thinking() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setI(x => Math.min(x + 1, THINKING_PHRASES.length - 1)), 780);
    return () => window.clearInterval(t);
  }, []);
  return (
    <span className="relative inline-flex h-[18px] items-center overflow-hidden text-[12px] text-[var(--os-ink-subtle)]">
      <AnimatePresence mode="wait">
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
        >
          {THINKING_PHRASES[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/* ── agentic step trace ─────────────────────────────────────── */

function AgentSteps({ steps, stream, onDone }: { steps: ChatStep[]; stream: boolean; onDone: () => void }) {
  const reduced = prefersReduced();
  const [shown, setShown] = useState(stream && !reduced ? 0 : steps.length);
  const fired = useRef(false);
  const finish = () => { if (!fired.current) { fired.current = true; onDone(); } };
  useEffect(() => {
    if (!stream || reduced) { finish(); return; }
    let i = 0;
    setShown(0);
    const t = window.setInterval(() => {
      i += 1;
      setShown(i);
      if (i >= steps.length) { window.clearInterval(t); finish(); }
    }, 580);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="space-y-1.5 rounded-lg border border-[var(--os-border)] bg-[var(--os-bg-subtle)] px-3 py-2.5">
      {steps.map((s, i) => {
        const done = i < shown;
        const running = i === shown && shown < steps.length;
        if (!done && !running) return null;
        return (
          <div key={i} className="flex items-start gap-2 text-[12px]">
            {done ? (
              <span className="mt-px grid size-3.5 shrink-0 place-items-center rounded-full bg-[var(--os-brand)] text-white">
                <Icon icon={I.check} size={9} />
              </span>
            ) : (
              <span className="mt-px size-3.5 shrink-0 animate-spin rounded-full border-[1.5px] border-[var(--os-border-strong)] border-t-[var(--os-ink-muted)]" />
            )}
            <span className={done ? "text-[var(--os-ink-muted)]" : "text-[var(--os-ink)]"}>
              {s.label}{s.detail && <span className="text-[var(--os-ink-subtle)]"> · {s.detail}</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ── metrics row ────────────────────────────────────────────── */

const METRIC_TONE: Record<string, string> = {
  danger: "text-[var(--os-danger)]",
  warning: "text-[var(--os-warning)]",
  brand: "text-[var(--os-brand)]",
  neutral: "text-[var(--os-ink)]",
};

function MetricRow({ metrics, compact }: { metrics: ChatMetric[]; compact?: boolean }) {
  return (
    <div className={cn("grid gap-2", compact ? "grid-cols-2" : metrics.length >= 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3")}>
      {metrics.map((m, i) => (
        <div key={i} className="rounded-lg border border-[var(--os-border)] bg-white px-3 py-2.5">
          <div className={cn("os-display text-[19px] font-semibold leading-none tabular-nums", METRIC_TONE[m.tone ?? "neutral"])}>{m.value}</div>
          <div className="mt-1 text-[11px] leading-tight text-[var(--os-ink-muted)]">{m.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ── bar chart (grows in) ───────────────────────────────────── */

const BAR_TONE: Record<string, string> = {
  danger: "bg-red-500",
  warning: "bg-amber-500",
  brand: "bg-[var(--os-brand)]",
  neutral: "bg-[var(--os-ink-subtle)]",
};

function BarsChart({ chart }: { chart: ChatChart }) {
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setGrown(true), 40);
    return () => window.clearTimeout(t);
  }, []);
  const max = chart.max ?? Math.max(...chart.bars.map(b => b.value), 1);
  return (
    <div className="rounded-lg border border-[var(--os-border)] bg-white px-3.5 py-3">
      {chart.title && <div className="mb-2.5 text-[11px] font-medium text-[var(--os-ink-muted)]">{chart.title}</div>}
      <div className="space-y-2">
        {chart.bars.map((b, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="w-[92px] shrink-0 truncate text-right text-[11px] text-[var(--os-ink-muted)]">{b.label}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--os-selected)]">
              <div
                className={cn("h-full rounded-full transition-[width] duration-[800ms] ease-out", BAR_TONE[b.tone ?? "neutral"])}
                style={{ width: grown ? `${Math.max(4, (b.value / max) * 100)}%` : "0%" }}
              />
            </div>
            <span className="w-[52px] shrink-0 text-right text-[11px] font-medium tabular-nums text-[var(--os-ink)]">{b.display}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── findings list ──────────────────────────────────────────── */

const SEV: Record<string, { dot: string; chip: string; label: string }> = {
  high: { dot: "bg-red-500", chip: "bg-red-50 text-red-700", label: "High" },
  medium: { dot: "bg-amber-500", chip: "bg-amber-50 text-amber-700", label: "Medium" },
  low: { dot: "bg-[var(--os-brand)]", chip: "bg-[var(--os-selected)] text-[var(--os-ink-muted)]", label: "Low" },
};

function FindingsList({ findings }: { findings: ChatFinding[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--os-border)] bg-white">
      {findings.map((f, i) => {
        const sev = SEV[f.severity];
        const inner = (
          <>
            <span className={cn("mt-1 size-1.5 shrink-0 rounded-full", sev.dot)} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="text-[12.5px] font-semibold leading-snug text-[var(--os-ink)]">{f.title}</span>
                <span className={cn("rounded-full px-1.5 py-px text-[9.5px] font-semibold", sev.chip)}>{sev.label}</span>
              </div>
              <div className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-[var(--os-ink-muted)]">{f.detail}</div>
            </div>
            {f.href && <Icon icon={I.chevronRight} size={13} className="mt-1 shrink-0 text-[var(--os-ink-subtle)]" />}
          </>
        );
        const cls = cn("flex items-start gap-2.5 px-3 py-2.5", i > 0 && "border-t border-[var(--os-border)]");
        return f.href ? (
          <Link key={i} href={f.href} className={cn(cls, "transition-colors hover:bg-[var(--os-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--os-accent)]")}>
            {inner}
          </Link>
        ) : (
          <div key={i} className={cls}>{inner}</div>
        );
      })}
    </div>
  );
}

/* ── the answer view ────────────────────────────────────────── */

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
  const hasSteps = (answer.steps?.length ?? 0) > 0;
  const [stepsDone, setStepsDone] = useState(!(stream && hasSteps));
  const [revealed, setRevealed] = useState(stream ? 0 : Infinity);
  const allDone = stepsDone && revealed >= answer.paragraphs.length;

  if (thinking) return <Thinking />;

  return (
    <div className={cn("min-w-0 space-y-2.5", compact && "space-y-2 text-[12.5px]")}>
      {hasSteps && (
        <AgentSteps steps={answer.steps!} stream={stream} onDone={() => setStepsDone(true)} />
      )}

      {stepsDone && answer.paragraphs.map((p, i) => (
        i <= revealed && (
          <StreamedParagraph
            key={i}
            text={p}
            active={stream && i === revealed}
            onDone={() => setRevealed(r => (r === i ? r + 1 : r))}
          />
        )
      ))}

      {allDone && answer.metrics && answer.metrics.length > 0 && (
        <MetricRow metrics={answer.metrics} compact={compact} />
      )}

      {allDone && answer.chart && answer.chart.bars.length > 0 && (
        <BarsChart chart={answer.chart} />
      )}

      {allDone && answer.findings && answer.findings.length > 0 && (
        <FindingsList findings={answer.findings} />
      )}

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

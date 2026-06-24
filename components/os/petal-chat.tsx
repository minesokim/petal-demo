"use client";

// Petal chat runtime - shared by /os/ask and the client-record @Petal rail.
// Replies come from the REAL assistant: send() POSTs the message to /api/ask,
// which runs the ZDR Anthropic model with the Petal persona prompt (§7216-safe:
// the message is redacted and no client records are injected). This file owns the
// conversation state, the agentic reveal (steps → prose → chart → findings), and
// the answer renderer. The scripted demo bank (matchQuestion) is kept only as an
// offline fallback when the API is unreachable, so the demo never goes blank.

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
import {
  createThreadAction,
  appendMessageAction,
  getThreadAction,
} from "@/app/os/ask/chat-actions";
import { confirmAgentAction } from "@/app/os/ask/agent-actions";

export type ChatMsg =
  | { id: number; role: "user"; text: string; attachments?: string[] }
  | { id: number; role: "petal"; answer: ChatAnswer; thinking?: boolean; liveSteps?: string[] };

let msgSeq = 1;

/** Real assistant reply text → the ChatAnswer the renderer already streams. We
 * split on blank lines so multi-paragraph replies flow through the existing
 * paragraph-by-paragraph reveal unchanged. */
function answerFromReply(reply: string): ChatAnswer {
  const paragraphs = reply
    .split(/\n{2,}/)
    .map(p => p.replace(/\s+\n/g, " ").trim())
    .filter(Boolean);
  return { paragraphs: paragraphs.length ? paragraphs : [reply.trim()] };
}

// The agent's confirm-card wire shape: a staged write the model proposed. Rendered as the
// existing ConfirmCard the preparer clicks to execute (confirmAgentAction).
type AgentConfirmAction = { tool: string; args: Record<string, unknown>; title: string };

type AgentResult = { reply: string; proposedActions?: AgentConfirmAction[]; citations?: { cite: string; sourceUrl?: string; authority?: string }[] };

/** Friendly inline message for an error frame (so the bubble never goes raw). */
function friendlyAgentError(code: string): string {
  if (code === "gated_7216")
    return "I can't run that on real client data yet — real-data AI is still pending the §7216 sign-off.";
  return "Something went wrong on my side. Let me try a simpler answer.";
}

/**
 * Open the agent SSE stream and drive the live thinking trace. Resolves with the terminal
 * `done` result; REJECTS on an `error` frame or a transport failure so the caller can fall
 * back to /api/ask. `step` frames are pushed into the in-flight bubble as they arrive.
 *
 * Frames are newline-delimited SSE: `event: <name>\ndata: <json>\n\n`. We buffer the byte
 * stream, split on the blank-line record separator, and dispatch each record.
 */
async function streamAgent({
  message,
  history,
  pushStep,
}: {
  message: string;
  history: { role: "user" | "assistant"; content: string }[];
  pushStep: (label: string) => void;
}): Promise<AgentResult> {
  const res = await fetch("/api/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  });
  if (!res.ok || !res.body) throw new Error(`agent failed: ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let result: AgentResult | null = null;
  let errored: string | null = null;

  const handleRecord = (record: string) => {
    let event = "message";
    const dataLines: string[] = [];
    for (const line of record.split("\n")) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) dataLines.push(line.slice(5).replace(/^ /, ""));
    }
    if (!dataLines.length) return;
    let data: unknown;
    try { data = JSON.parse(dataLines.join("\n")); } catch { return; }
    if (event === "step") {
      const label = (data as { label?: unknown }).label;
      if (typeof label === "string" && label.trim()) pushStep(label);
    } else if (event === "done") {
      const d = data as AgentResult;
      result = { reply: d.reply ?? "", proposedActions: d.proposedActions, citations: d.citations };
    } else if (event === "error") {
      errored = (data as { error?: unknown }).error as string ?? "agent_error";
    }
  };

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let sep: number;
    // Records are separated by a blank line (\n\n).
    while ((sep = buf.indexOf("\n\n")) !== -1) {
      const record = buf.slice(0, sep);
      buf = buf.slice(sep + 2);
      if (record.trim()) handleRecord(record);
    }
  }
  if (buf.trim()) handleRecord(buf);

  if (errored) throw new Error(errored);
  if (!result) throw new Error("agent stream ended without a result");
  return result;
}

export function usePetalChat(scopeHouseholdId?: string) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  // prior turns for /api/ask context, kept in a ref so send() stays stable
  const historyRef = useRef<{ role: "user" | "assistant"; content: string }[]>([]);
  // Persistence: the current thread, kept as a promise so the create-on-first-send
  // resolves once and the user/assistant appends serialize behind it (no race, no
  // duplicate thread). null = not yet created; cleared on reset/new chat.
  const threadRef = useRef<Promise<string | null> | null>(null);

  // Append one persisted turn to the active thread. RLS-scoped + audited server-
  // side; best-effort (a persistence failure must never break the live reply).
  const persist = useCallback((role: "user" | "assistant", content: string) => {
    const c = content.trim();
    if (!c || !threadRef.current) return;
    threadRef.current
      .then(id => { if (id) return appendMessageAction(id, role, c); })
      .catch(() => {});
  }, []);

  const send = useCallback((text: string, attachments?: string[]) => {
    const q = text.trim();
    if (!q && !attachments?.length) return;
    const message = q || (attachments?.join(", ") ?? "");
    const userId = ++msgSeq;
    const thinkingId = ++msgSeq;
    setMessages(m => [
      ...m,
      { id: userId, role: "user", text: q, attachments },
      { id: thinkingId, role: "petal", answer: { paragraphs: [] }, thinking: true, liveSteps: [] },
    ]);

    const history = historyRef.current.slice();
    historyRef.current = [...history, { role: "user", content: message }];

    // On the FIRST user message of a session, create the thread (title = the
    // message, server-truncated). Subsequent turns reuse the same thread.
    if (!threadRef.current) {
      threadRef.current = createThreadAction(message.slice(0, 60)).then(r => r?.id ?? null);
    }
    persist("user", message);

    const settle = (answer: ChatAnswer, replyForHistory?: string) => {
      if (replyForHistory) historyRef.current = [...historyRef.current, { role: "assistant", content: replyForHistory }];
      setMessages(m => m.map(msg => (msg.id === thinkingId ? { ...msg, answer, thinking: false, liveSteps: undefined } : msg)));
    };

    // Append a streamed thinking step to the in-flight bubble (Claude-style live trace).
    const pushStep = (label: string) => {
      setMessages(m => m.map(msg => {
        if (msg.id !== thinkingId || msg.role !== "petal") return msg;
        const prev = msg.liveSteps ?? [];
        // De-dupe an identical consecutive label (a retried turn shouldn't double a line).
        if (prev[prev.length - 1] === label) return msg;
        return { ...msg, liveSteps: [...prev, label] };
      }));
    };

    // FALLBACK assistant: POST to /api/ask. Reached ONLY when the unified agent itself
    // errors. The route redacts the message (§7216) and never injects client records. On any
    // failure here too, fall back to the scripted demo bank so the experience never goes blank.
    const runAsk = () => {
      fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
      })
        .then(async res => {
          if (!res.ok) throw new Error(`ask failed: ${res.status}`);
          const data = (await res.json()) as { reply?: string };
          const reply = (data.reply ?? "").trim();
          if (!reply) throw new Error("empty reply");
          settle(answerFromReply(reply), reply);
          persist("assistant", reply);
        })
        .catch(() => {
          // offline / API down → scripted demo answer (no history echo)
          const answer = matchQuestion(message, scopeHouseholdId);
          settle(answer);
          // Persist a readable transcript of the fallback answer too.
          const flat = answer.paragraphs.join("\n\n").trim();
          if (flat) persist("assistant", flat);
        });
    };

    // UNIFIED, MODEL-DRIVEN AGENT — no trigger-word routing. EVERY message goes to /api/agent,
    // now over a Server-Sent Event STREAM so the preparer sees a live, Claude-style thinking
    // trace. The model decides what to do from the natural language: it can look up a client,
    // research a tax question (cited), compute a figure, draft an email (all reads, woven into the
    // reply), or STAGE an external write (SMS/create/request) as a confirm card the preparer
    // clicks. `step` frames stream into liveSteps as each phase/tool fires; the terminal `done`
    // frame settles the answer (ChatAnswer + ConfirmCards). /api/ask is the fallback ONLY if the
    // stream errors (network failure or an `error` frame).
    streamAgent({ message, history, pushStep })
      .then(({ reply, proposedActions, citations }) => {
        const text = (reply ?? "").trim() || "Done.";
        const ans = answerFromReply(text);
        if (proposedActions?.length) ans.confirmActions = proposedActions;
        // Surface the research engine's cited authority as clickable sources beside the answer.
        if (citations?.length) ans.citations = citations.map(c => ({ cite: c.cite, url: c.sourceUrl, authority: c.authority }));
        settle(ans, text);
        persist("assistant", text);
      })
      .catch((err: unknown) => {
        // A §7216 gate is an honest, terminal answer — show it inline, don't paper over it with
        // a scripted demo or an /api/ask retry. Any OTHER failure falls back to /api/ask.
        const code = err instanceof Error ? err.message : "";
        if (code === "gated_7216") {
          const msg = friendlyAgentError(code);
          settle(answerFromReply(msg), msg);
          persist("assistant", msg);
          return;
        }
        runAsk();
      });
  }, [scopeHouseholdId, persist]);

  // Analyze a dropped/attached document. POSTs the file to /api/ask/analyze, which
  // gates the model call on §7216 (assertCleared) — so this returns either the real
  // analysis (summary) or the honest gated message. Persists the turn like send().
  const analyze = useCallback((file: File) => {
    const label = `Analyze ${file.name}`;
    const userId = ++msgSeq;
    const thinkingId = ++msgSeq;
    setMessages(m => [
      ...m,
      { id: userId, role: "user", text: label, attachments: [file.name] },
      { id: thinkingId, role: "petal", answer: { paragraphs: [] }, thinking: true },
    ]);
    if (!threadRef.current) {
      threadRef.current = createThreadAction(label.slice(0, 60)).then(r => r?.id ?? null);
    }
    persist("user", label);

    const settle = (answer: ChatAnswer, replyForHistory?: string) => {
      if (replyForHistory) historyRef.current = [...historyRef.current, { role: "assistant", content: replyForHistory }];
      setMessages(m => m.map(msg => (msg.id === thinkingId ? { ...msg, answer, thinking: false } : msg)));
    };

    const fd = new FormData();
    fd.set("file", file);
    fetch("/api/ask/analyze", { method: "POST", body: fd })
      .then(async res => {
        const data = (await res.json().catch(() => ({}))) as { summary?: string; message?: string };
        const reply = (data.summary ?? data.message ?? "").trim();
        if (!reply) throw new Error("empty");
        settle(answerFromReply(reply), reply);
        persist("assistant", reply);
      })
      .catch(() => {
        const msg = "I couldn't read that file just now. Please attach a PDF or image under 25 MB and try again.";
        settle(answerFromReply(msg));
        persist("assistant", msg);
      });
  }, [persist]);

  const reset = useCallback(() => {
    historyRef.current = [];
    threadRef.current = null;
    setMessages([]);
  }, []);

  // Reopen a persisted thread: load its transcript (oldest-first) and render it in
  // the chat surface. New turns append to THIS thread (threadRef points at it).
  const openThread = useCallback(async (threadId: string) => {
    const turns = await getThreadAction(threadId);
    threadRef.current = Promise.resolve(threadId);
    historyRef.current = turns
      .filter(t => t.role === "user" || t.role === "assistant")
      .map(t => ({ role: t.role as "user" | "assistant", content: t.content }));
    setMessages(
      turns.map(t =>
        t.role === "user"
          ? { id: ++msgSeq, role: "user", text: t.content }
          : { id: ++msgSeq, role: "petal", answer: answerFromReply(t.content) },
      ),
    );
  }, []);

  return { messages, send, reset, openThread, analyze };
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

// The single thinking indicator. When the agent streams REAL step labels (Thinking → Looking up
// Haokun → Preparing the text), it shows the live action; with no steps (the /api/ask fallback or
// document analyze) it rotates the existing phrases. Same animation either way — one component.
function Thinking({ steps }: { steps?: string[] }) {
  const [i, setI] = useState(0);
  const live = !!steps && steps.length > 0;
  useEffect(() => {
    if (live) return; // real streamed steps drive the label; no mock rotation while streaming
    const t = window.setInterval(() => setI(x => Math.min(x + 1, THINKING_PHRASES.length - 1)), 780);
    return () => window.clearInterval(t);
  }, [live]);
  const label = live ? steps![steps!.length - 1] : THINKING_PHRASES[i];
  return (
    <span className="relative inline-flex h-[18px] items-center overflow-hidden text-[12px] text-[var(--os-ink-subtle)]">
      <AnimatePresence mode="wait">
        <motion.span
          key={label}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
        >
          {label}
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
  liveSteps,
  stream = true,
  compact = false,
  onSuggest,
}: {
  answer: ChatAnswer;
  thinking?: boolean;
  /** streamed reasoning steps for the in-flight bubble (Claude-style live trace) */
  liveSteps?: string[];
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

  if (thinking) return <Thinking steps={liveSteps} />;

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

      {/* Cited legal authority — each links to its official primary source (govinfo / IRS / Cornell
          LII). This is the "cheap verification" affordance: the preparer clicks through and checks
          the cite itself. Non-link when no source URL is available. */}
      {allDone && answer.citations && answer.citations.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[11px] text-[var(--os-ink-subtle)]">Sources</span>
          {answer.citations.map((c, i) => {
            const inner = (
              <>
                <span className="text-[10px] font-medium tabular-nums text-[var(--os-ink-subtle)]">{i + 1}</span>
                <span className="max-w-[220px] truncate">{c.cite}</span>
                {c.url && <Icon icon={I.link} size={11} className="text-[var(--os-ink-subtle)]" />}
              </>
            );
            return c.url ? (
              <a
                key={c.cite}
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2 py-1 text-[11.5px] text-[var(--os-ink)] transition-colors hover:bg-[var(--os-hover)] hover:border-[var(--os-border-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]"
              >
                {inner}
              </a>
            ) : (
              <span key={c.cite} className="inline-flex items-center gap-1.5 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2 py-1 text-[11.5px] text-[var(--os-ink-muted)]">
                {inner}
              </span>
            );
          })}
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

      {allDone && answer.confirmActions && answer.confirmActions.length > 0 && (
        <div className="space-y-2">
          {answer.confirmActions.map((a, i) => <ConfirmCard key={`${a.tool}-${i}`} action={a} compact={compact} />)}
        </div>
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

// The agent confirm-gate card: a write Petal staged. Nothing ran until the preparer clicks
// Confirm, which executes the audited server action via confirmAgentAction.
function ConfirmCard({ action, compact }: { action: AgentConfirmAction; compact?: boolean }) {
  const [state, setState] = useState<"idle" | "running" | "done" | "error">("idle");
  const [err, setErr] = useState<string>();
  return (
    <div className={cn("flex items-center gap-3 rounded-lg border border-[var(--os-border)] bg-[var(--os-bg-subtle)] px-3 py-2.5", compact && "px-2.5 py-2")}>
      <PetalMark className={cn("shrink-0 text-[var(--os-ink-muted)]", compact ? "size-4" : "size-5")} />
      <div className="min-w-0 flex-1">
        <div className={cn("font-medium text-[var(--os-ink)]", compact ? "text-[12px]" : "text-[13px]")}>{action.title}</div>
        <div className={cn(state === "error" && err ? "text-[var(--os-danger)]" : "text-[var(--os-ink-muted)]", compact ? "text-[11px]" : "text-[12px]")} title={err}>
          {state === "error" && err ? err : "Petal staged this — confirm to run it."}
        </div>
      </div>
      {state === "done" ? (
        <span className="inline-flex shrink-0 items-center gap-1.5 text-[12px] text-[var(--os-ink-muted)]"><Icon icon={I.check} size={13} /> Done</span>
      ) : state === "error" ? (
        <span className="shrink-0 text-[12px] text-[var(--os-danger)]">Failed</span>
      ) : (
        <button
          disabled={state === "running"}
          onClick={() => {
            setState("running");
            confirmAgentAction(action.tool, action.args)
              .then(r => { setState(r.ok ? "done" : "error"); if (!r.ok) setErr(r.error); })
              .catch(() => setState("error"));
          }}
          className="flex h-7 shrink-0 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-2.5 text-[12px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97] disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]"
        >
          <Icon icon={I.check} size={13} /> {state === "running" ? "Running…" : "Confirm"}
        </button>
      )}
    </div>
  );
}

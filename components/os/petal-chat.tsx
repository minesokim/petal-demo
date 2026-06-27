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

// One entry in the live cognition trace. `phase` groups entries (analyzing vs reasoning); `chips` render as
// pills — authority families ("IRC", "CFR") or citations ("§402"). A bare {label} renders as a plain step.
export type TraceStep = { label: string; phase?: "analyzing" | "reasoning"; chips?: string[]; chipKind?: "authority" | "citation" };

export type ChatMsg =
  | { id: number; role: "user"; text: string; attachments?: string[] }
  | { id: number; role: "petal"; answer: ChatAnswer; thinking?: boolean; liveSteps?: TraceStep[]; streamingText?: string; streamTurn?: number; traceTitle?: string };

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

// The answer fields that can't be rebuilt from the message text — persisted as chat_message metadata so
// reopening a saved chat restores the real answer (its cited sources, calibration, ungrounded-figure flags),
// not a lossy text-only rebuild.
function restorableAnswerMeta(a: ChatAnswer): Record<string, unknown> {
  const m: Record<string, unknown> = {};
  if (a.citations?.length) m.citations = a.citations;
  if (a.calibration) m.calibration = a.calibration;
  if (a.ungroundedFigures?.length) m.ungroundedFigures = a.ungroundedFigures;
  return m;
}

function restoreAnswer(content: string, metadata?: Record<string, unknown>): ChatAnswer {
  const a = answerFromReply(content);
  const m = metadata ?? {};
  if (Array.isArray(m.citations)) a.citations = m.citations as ChatAnswer["citations"];
  if (typeof m.calibration === "string") a.calibration = m.calibration as ChatAnswer["calibration"];
  if (Array.isArray(m.ungroundedFigures)) a.ungroundedFigures = m.ungroundedFigures as string[];
  return a;
}

// The agent's confirm-card wire shape: a staged write the model proposed. Rendered as the
// existing ConfirmCard the preparer clicks to execute (confirmAgentAction).
type AgentConfirmAction = { tool: string; args: Record<string, unknown>; title: string };

type AgentResult = { reply: string; proposedActions?: AgentConfirmAction[]; citations?: { cite: string; sourceUrl?: string; authority?: string }[]; calibration?: string; ungroundedFigures?: string[]; runPersisted?: boolean };

// Friendly, action-pointing labels for the research calibration reason-codes (grounded is never shown).
const CAL_LABEL: Record<string, string> = {
  unsettled: "Unsettled law — weigh §6662 substantial authority and Form 8275",
  coverage_gap: "Coverage gap — no authority found; check the primary source",
  ungrounded: "Not grounded — review the retrieved authority directly",
  indeterminate: "Fact-dependent — apply the governing multi-factor test",
  fetched: "Fetched live from primary authority — verify it is current",
};

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
  threadId,
  pushStep,
  pushText,
  signal,
}: {
  message: string;
  history: { role: "user" | "assistant"; content: string }[];
  threadId?: string | null;
  pushStep: (step: TraceStep) => void;
  pushText: (delta: string, turn: number) => void;
  signal?: AbortSignal; // aborting it cancels the fetch + the reader → the run stops (the Stop button)
}): Promise<AgentResult> {
  const res = await fetch("/api/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    // threadId activates DURABLE server-side persistence: the run survives navigation / tab close and
    // reconnects on reopen. Omitted ⇒ the server doesn't persist and the client persists on settle (below).
    body: JSON.stringify({ message, history, threadId: threadId ?? undefined }),
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
      const d = data as { label?: unknown; phase?: unknown; chips?: unknown; chipKind?: unknown };
      if (typeof d.label === "string" && d.label.trim()) {
        pushStep({
          label: d.label,
          phase: d.phase === "analyzing" || d.phase === "reasoning" ? d.phase : undefined,
          chips: Array.isArray(d.chips) ? d.chips.filter((c): c is string => typeof c === "string") : undefined,
          chipKind: d.chipKind === "authority" || d.chipKind === "citation" ? d.chipKind : undefined,
        });
      }
    } else if (event === "text") {
      const d = data as { delta?: unknown; turn?: unknown };
      if (typeof d.delta === "string") pushText(d.delta, typeof d.turn === "number" ? d.turn : 0);
    } else if (event === "done") {
      const d = data as AgentResult;
      result = { reply: d.reply ?? "", proposedActions: d.proposedActions, citations: d.citations, calibration: d.calibration, ungroundedFigures: d.ungroundedFigures, runPersisted: d.runPersisted };
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

  // In-flight run control. abortRef backs the Stop button (aborts the agent fetch); thinkingSince drives the
  // "this may take longer" banner + the elapsed timer; notifyArmedRef fires a browser notification when a
  // slow answer lands while the tab is hidden (the "Notify me" affordance).
  const abortRef = useRef<AbortController | null>(null);
  const notifyArmedRef = useRef(false);
  const [thinkingSince, setThinkingSince] = useState<number | null>(null);
  const [notifyArmed, setNotifyArmed] = useState(false);

  // Append one persisted turn to the active thread. RLS-scoped + audited server-
  // side; best-effort (a persistence failure must never break the live reply).
  const persist = useCallback((role: "user" | "assistant", content: string, metadata?: Record<string, unknown>) => {
    const c = content.trim();
    if (!c || !threadRef.current) return;
    threadRef.current
      .then(id => { if (id) return appendMessageAction(id, role, c, metadata); })
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
      { id: thinkingId, role: "petal", answer: { paragraphs: [] }, thinking: true, liveSteps: [], traceTitle: titleFromMessage(message) },
    ]);

    // Start an abortable run + arm the in-flight UI (Stop button + elapsed-time "may take longer" banner).
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setThinkingSince(Date.now());

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
      setMessages(m => m.map(msg => (msg.id === thinkingId ? { ...msg, answer, thinking: false, liveSteps: undefined, streamingText: undefined, streamTurn: undefined } : msg)));
      setThinkingSince(null);
      // Browser notification for a slow answer the user walked away from — armed via "Notify me", only when
      // the tab is hidden, and NEVER on a user-initiated Stop (an aborted run).
      if (notifyArmedRef.current && !ac.signal.aborted && typeof document !== "undefined" && document.hidden && typeof Notification !== "undefined" && Notification.permission === "granted") {
        try { new Notification("Petal finished your answer", { body: titleFromMessage(message), tag: "petal-answer" }); } catch {}
      }
      notifyArmedRef.current = false;
      setNotifyArmed(false);
    };

    // Append a streamed thinking step to the in-flight bubble (Claude-style live trace).
    const pushStep = (step: TraceStep) => {
      setMessages(m => m.map(msg => {
        if (msg.id !== thinkingId || msg.role !== "petal") return msg;
        const prev = msg.liveSteps ?? [];
        const last = prev[prev.length - 1];
        // De-dupe an identical consecutive PLAIN label (a retried turn shouldn't double a line). A
        // chip-bearing step always appends — it carries new authority/citation data.
        if (last && last.label === step.label && !step.chips && !last.chips) return msg;
        return { ...msg, liveSteps: [...prev, step] };
      }));
    };

    // Append a REAL streamed text delta to the in-flight bubble (true token streaming). The `turn`
    // resets the preview at each loop turn so a tool-call preamble never sticks to the final answer.
    const pushText = (delta: string, turn: number) => {
      setMessages(m => m.map(msg => {
        if (msg.id !== thinkingId || msg.role !== "petal") return msg;
        const base = msg.streamTurn === turn ? (msg.streamingText ?? "") : "";
        return { ...msg, streamTurn: turn, streamingText: base + delta };
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
    // Resolve the thread id first so the run is persisted SERVER-SIDE (durable: survives navigation / tab
    // close, reconnects on reopen). threadRef was set just above (new thread) or by openThread (existing).
    Promise.resolve(threadRef.current)
      .then(tid => streamAgent({ message, history, threadId: tid, pushStep, pushText, signal: ac.signal }))
      .then(({ reply, proposedActions, citations, calibration, ungroundedFigures, runPersisted }) => {
        const text = (reply ?? "").trim() || "Done.";
        const ans = answerFromReply(text);
        if (proposedActions?.length) ans.confirmActions = proposedActions;
        // Surface the research engine's cited authority as clickable sources beside the answer.
        if (citations?.length) ans.citations = citations.map(c => ({ cite: c.cite, url: c.sourceUrl, authority: c.authority }));
        // Surface the calibration reason-code (only when it's a caution worth showing).
        if (calibration && calibration !== "grounded") ans.calibration = calibration;
        // Ground-or-refuse: figures Petal stated that no authority grounded — flag them loudly.
        if (ungroundedFigures?.length) ans.ungroundedFigures = ungroundedFigures;
        settle(ans, text);
        // The server already persisted this turn as a durable run ⇒ don't double-write. Otherwise (no
        // thread / not signed in) persist client-side so reopening still restores the real answer.
        if (!runPersisted) persist("assistant", text, restorableAnswerMeta(ans));
      })
      .catch((err: unknown) => {
        // The user pressed Stop → the fetch aborted; settle the bubble as stopped, do NOT retry/fallback.
        if (ac.signal.aborted || (err instanceof Error && err.name === "AbortError")) {
          settle(answerFromReply("Stopped."));
          return;
        }
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
      turns.map(t => {
        if (t.role === "user") return { id: ++msgSeq, role: "user", text: t.content };
        const meta = (t.metadata ?? {}) as Record<string, unknown>;
        if (meta.status === "running") {
          // RECONNECT a server-side run that was still going when the tab closed: show its live trace +
          // partial text exactly where it left off (the persisted snapshot), instead of an empty bubble.
          const trace = Array.isArray(meta.trace) ? (meta.trace as TraceStep[]) : [];
          const partial = typeof meta.partialText === "string" ? meta.partialText : "";
          return { id: ++msgSeq, role: "petal", answer: { paragraphs: [] }, thinking: true, liveSteps: trace, streamingText: partial || undefined };
        }
        return { id: ++msgSeq, role: "petal", answer: restoreAnswer(t.content, t.metadata) };
      }),
    );
  }, []);

  // Stop the in-flight run (aborts the agent fetch → the catch settles the bubble "Stopped").
  const stop = useCallback(() => { abortRef.current?.abort(); }, []);
  // Arm a browser notification for when a slow answer finishes (and request permission if not yet decided).
  const armNotify = useCallback(() => {
    notifyArmedRef.current = true;
    setNotifyArmed(true);
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      void Notification.requestPermission().catch(() => {});
    }
  }, []);

  return { messages, send, reset, openThread, analyze, stop, armNotify, isThinking: thinkingSince !== null, thinkingSince, notifyArmed };
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
    <p className="text-[15.6px] leading-relaxed text-[var(--os-ink)]">
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

// The brief placeholder shown for the split second before the REAL streamed trace arrives. These mirror
// the actual stages of the run (understand → search authority → read → reason), never canned firm-data
// chatter. Kept short (a few words each) so it reads as a real status, not filler.
const THINKING_PHRASES = [
  "Understanding your question",
  "Searching the tax authority",
  "Reading the sources",
  "Reasoning through the answer",
];

// COGNITION TRACE — the live "what Petal is doing" checklist (reassurance, Claude/Harvey-style).
// Each real streamed step stacks as it fires: completed steps get a check, the current one pulses.
// Once the answer starts streaming (`settling`), every step reads as done.
const PHASE_LABEL: Record<string, string> = { analyzing: "Analyzing the question", reasoning: "Reasoning through the answer" };

// A small branch/node glyph for the authority + citation chips (the pill icon in the design).
function BranchGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <circle cx="4" cy="4" r="1.7" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="4" cy="12" r="1.7" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="12" cy="8" r="1.7" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4 5.7v4.6M5.6 4.4c3.2 0 4 1.6 5.1 2.9M5.6 11.6c3.2 0 4-1.6 5.1-2.9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

// The authority/citation pills under a "Researching" / "Reading" step. Shows ALL sources (no "+N more"
// cap, per David) so every authority Petal touched is visible in the trace; they wrap to multiple rows.
function TraceChips({ chips }: { chips: string[] }) {
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 pl-[18px]">
      {chips.map((c, i) => (
        <span key={`${c}-${i}`} className="inline-flex items-center gap-1.5 rounded-full bg-[var(--os-hover)] px-2.5 py-1 text-[12px] text-[var(--os-ink-muted)]">
          <BranchGlyph className="size-3 shrink-0 text-[var(--os-ink-subtle)]" />
          <span className="max-w-[200px] truncate">{c}</span>
        </span>
      ))}
    </div>
  );
}

// A descriptive gerund title for the cognition-trace header (claude.ai-style "what Petal is doing"),
// derived from the question so the thinking state reads richer than a bare "Analyzing". The verb is
// chosen from the intent; the question framing is stripped so it reads as a phrase, not a question.
function titleFromMessage(message: string): string {
  const raw = message.trim().replace(/\s+/g, " ");
  const lc = raw.toLowerCase();
  const verb =
    /\b(draft|write|compose|email|reply|message|letter|memo)\b/.test(lc) ? "Drafting" :
    /\b(compute|calculate|estimate|figure out|how much|what's the (tax|amount|total))\b/.test(lc) ? "Computing" :
    /\b(summari[sz]e|recap|tl;?dr|overview)\b/.test(lc) ? "Summarizing" :
    /\b(compare|versus|\bvs\.?\b|difference between)\b/.test(lc) ? "Comparing" :
    /\b(tax|deduct|credit|irc|§|section|return|filing|qbi|salt|basis|exempt|penalt|ruling|\breg\b|depreciat|1031|liability|withhold|estate|gift|nexus|s[- ]?corp)\b/.test(lc) ? "Researching" :
    "Working through";
  let body = raw
    .replace(/\?+\s*$/g, "")
    .replace(/^(please\s+|hey,?\s+|can you\s+|could you\s+|i need (you )?to\s+|help me\s+|tell me\s+|give me\s+)/i, "")
    .replace(/^(what (is|are|was|were|'?s)|how (do|does|can|should|much|many)|when (is|do|does|will|can)|which|who|why|where|is there|are there|explain|describe|walk me through)\s+/i, "")
    .trim();
  if (!body) body = "your request";
  const short = body.length > 72 ? body.slice(0, 71).replace(/\s+\S*$/, "") + "…" : body;
  return `${verb} ${short.charAt(0).toLowerCase()}${short.slice(1)}`;
}

// A small FILLED check-circle — the completed-step marker. The circle springs in and the tick DRAWS on
// (pathLength 0→1) for a smooth "check" animation rather than a hard pop. Fills its container (size-full),
// so the caller controls the size.
function FilledCheck() {
  return (
    <motion.svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="size-full text-[var(--os-ink-subtle)]"
      initial={{ scale: 0.4, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 22 }}
    >
      <circle cx="8" cy="8" r="7.5" fill="currentColor" />
      <motion.path
        d="M4.7 8.2l2.2 2.2 4.4-4.6"
        stroke="var(--os-surface)"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.28, ease: "easeOut", delay: 0.06 }}
      />
    </motion.svg>
  );
}

// Step status marker: a spinning loader WHILE the step runs, swapped for the draw-on filled check the
// moment it completes. A step is "done" once it is no longer the live one (the next step starting, or
// the answer streaming, marks the prior step complete). All markers are size-3 (12px) so the spinner,
// the check, and the phase globe read as one consistent small circle.
// The 4-dot radial-gradient spinner (dots at top/left/right/bottom, rotating) in BLACK (--os-ink) — the live
// "working" loader shown while a step runs. Replaces the petal-logo/ring indicator per the requested design.
function DotSpinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block animate-spin", className)}
      style={{
        aspectRatio: "1",
        ["--_c" as string]: "no-repeat radial-gradient(farthest-side, var(--os-ink-subtle) 92%, transparent)",
        background: "var(--_c) top, var(--_c) left, var(--_c) right, var(--_c) bottom",
        backgroundSize: "34% 34%",
      } as React.CSSProperties}
    />
  );
}

function StepDot({ done }: { done: boolean }) {
  return (
    <span className="flex size-3.5 shrink-0 items-center justify-center">
      {done ? <FilledCheck /> : <DotSpinner className="size-2" />}
    </span>
  );
}

// COGNITION TRACE — the live "what Petal is doing" trace, claude.ai-style. A descriptive TITLE header
// (the active line's text shimmers, no dot) with a chevron folds the detail; the body stacks the streamed
// steps, each carrying an optional PHASE group and authority/citation CHIPS. Open by default so the live
// trace is visible; one click collapses to just the title. Once the answer streams (`settling`) it reads done.
function CognitionTrace({ steps, settling, title }: { steps: TraceStep[]; settling?: boolean; title?: string }) {
  const [open, setOpen] = useState(true);
  const header = title || steps[steps.length - 1]?.label || "Thinking";
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="group flex w-full items-center gap-2 text-left"
        aria-expanded={open}
      >
        <span className={cn("min-w-0 flex-1 truncate text-[13px] leading-snug text-[var(--os-ink-muted)]", !settling && "os-think-pulse")}>
          {header}
        </span>
        <Icon
          icon={I.chevronDown}
          size={14}
          className={cn("shrink-0 text-[var(--os-ink-subtle)] transition-transform duration-200 group-hover:text-[var(--os-ink-muted)]", !open && "-rotate-90")}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="ml-[7px] space-y-1.5 border-l border-[var(--os-border)] pl-3.5">
              {steps.map((s, i) => {
                const hasChips = !!s.chips && s.chips.length > 0;
                const current = !settling && i === steps.length - 1 && !hasChips;
                const showPhase = !!s.phase && s.phase !== (i > 0 ? steps[i - 1].phase : undefined);
                return (
                  <motion.div
                    key={`${i}-${s.label}`}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {showPhase && (
                      <div className="mb-1 mt-0.5 flex items-center gap-2 text-[13px] text-[var(--os-ink-muted)]">
                        <span className="flex size-3.5 shrink-0 items-center justify-center">
                          <Icon icon={I.globe} size={14} className="text-[var(--os-ink-subtle)]" />
                        </span>
                        <span>{PHASE_LABEL[s.phase!]}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <StepDot done={!current} />
                      <span className={cn("text-[12.5px] leading-snug", current ? "text-[var(--os-ink)]" : "text-[var(--os-ink-muted)]")}>
                        {s.label}
                      </span>
                    </div>
                    {hasChips && <TraceChips chips={s.chips!} />}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// The single thinking indicator. When the agent streams REAL step labels (Thinking → Looking up
// Haokun → Preparing the text), it shows the live action; with no steps (the /api/ask fallback or
// document analyze) it rotates the existing phrases. Same animation either way — one component.
function Thinking({ steps }: { steps?: TraceStep[] }) {
  const [i, setI] = useState(0);
  const live = !!steps && steps.length > 0;
  useEffect(() => {
    if (live) return; // real streamed steps drive the label; no mock rotation while streaming
    const t = window.setInterval(() => setI(x => Math.min(x + 1, THINKING_PHRASES.length - 1)), 780);
    return () => window.clearInterval(t);
  }, [live]);
  const label = live ? steps![steps!.length - 1].label : THINKING_PHRASES[i];
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
  streamingText,
  traceTitle,
  stream = true,
  compact = false,
  onSuggest,
}: {
  answer: ChatAnswer;
  thinking?: boolean;
  /** streamed reasoning steps for the in-flight bubble (Claude-style live trace) */
  liveSteps?: TraceStep[];
  /** REAL token-streamed answer text for the in-flight bubble (true generation streaming) */
  streamingText?: string;
  /** descriptive header for the cognition trace (claude.ai-style "what Petal is doing") */
  traceTitle?: string;
  /** stream the reveal (latest message) vs render instantly (history) */
  stream?: boolean;
  /** tighter type + spacing for the record rail */
  compact?: boolean;
  onSuggest?: (q: string) => void;
}) {
  const hasSteps = (answer.steps?.length ?? 0) > 0;
  const [stepsDone, setStepsDone] = useState(!(stream && hasSteps));
  // Real token streaming shows the live text during `thinking`; the settled answer renders INSTANTLY
  // (no client-side typewriter), so it never replays on remount and never desyncs from the model.
  const [revealed, setRevealed] = useState(Infinity);
  const allDone = stepsDone && revealed >= answer.paragraphs.length;

  if (thinking) {
    // Once the real answer starts streaming, the thinking trace goes AWAY — show only the streaming
    // text (not kept around until done). Before any text streams, show the live cognition trace.
    if (streamingText) {
      return (
        <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--os-ink)]">
          <Rich text={streamingText} />
        </p>
      );
    }
    const hasTrace = (liveSteps?.length ?? 0) > 0;
    return hasTrace ? <CognitionTrace steps={liveSteps!} title={traceTitle} /> : <Thinking steps={liveSteps} />;
  }

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
            active={false}
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

      {/* Calibration caution — the research honesty signal: tells the preparer WHY the answer is not
          a flat assertion (unsettled law -> disclosure analysis, vs a coverage gap, vs fact-driven).
          Monochrome pill, consistent with the frozen design. Only shown when there's a caution. */}
      {allDone && answer.calibration && (
        <div className="flex items-center gap-1.5 pt-0.5">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2 py-1 text-[11px] text-[var(--os-ink-muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--os-ink-subtle)]" />
            {CAL_LABEL[answer.calibration] ?? answer.calibration}
          </span>
        </div>
      )}

      {/* Ground-or-refuse caution — Petal stated a verifiable figure it could not trace to grounded
          authority (a parametric leak). Surfaced as a hard, prominent warning, not a quiet pill:
          these are the figures a preparer must NOT rely on without checking the source. */}
      {allDone && answer.ungroundedFigures && answer.ungroundedFigures.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-[var(--os-border-strong)] bg-[var(--os-hover)] px-2.5 py-2 text-[11.5px] text-[var(--os-ink)]">
          <Icon icon={I.alert} size={14} className="mt-0.5 shrink-0 text-[var(--os-ink-muted)]" />
          <span>
            Unverified figures: {answer.ungroundedFigures.join(", ")}. Petal could not ground{" "}
            {answer.ungroundedFigures.length === 1 ? "this number" : "these numbers"} in cited authority — do not rely on{" "}
            {answer.ungroundedFigures.length === 1 ? "it" : "them"} without confirming the source.
          </span>
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

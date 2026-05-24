"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUp, Plus, History, Search, Copy, Share2, RefreshCw, MoreHorizontal, PanelRightClose, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PetalInsightCard } from "@/components/insights";
import { getInsightForClient } from "@/lib/insights-mock-data";
import { useToast } from "@/components/ui/toast-notification";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  getClientChatHistory,
  formatHistoryTime,
  type ChatHistorySession,
} from "@/lib/chat-history-mock";
import type { Client, InsightAction } from "@/lib/mock-data";

type ThinkingStep = {
  type: "thinking" | "searching" | "found";
  text: string;
  source?: string;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  steps?: ThinkingStep[];
  foundContent?: { text: string };
  summary?: string;
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const PREPARER_FIRST_NAME = "Antonio";

type DemoResponse = {
  steps: ThinkingStep[];
  foundContent: { text: string };
  summary: string;
};

function matchResponse(query: string, client: Client): DemoResponse {
  const q = query.toLowerCase();
  const firstName = client.fullName.split(" ")[0];

  if (q.includes("task") || q.includes("pending") || q.includes("outstanding")) {
    const missing = client.documentsRequired - client.documentsSubmitted;
    return {
      steps: [
        { type: "thinking", text: `Reviewing ${firstName}'s open items and document checklist.` },
        { type: "searching", text: "Checking intake, document store, and payment status", source: `${client.documentsRequired} required docs` },
        { type: "found", text: `${missing} document${missing === 1 ? "" : "s"} outstanding. Deposit ${client.depositPaid ? "received" : "pending"}.` },
      ],
      foundContent: {
        text: missing > 0
          ? `**Documents outstanding** - ${missing} of ${client.documentsRequired} still needed from ${firstName}.\n\n**Deposit status** - ${client.depositPaid ? "Paid in full — clear to begin prep." : "Pending — flag before kicking off."}\n\n**Last activity** - ${client.lastActivity}`
          : `**All documents in** - ${client.documentsSubmitted} of ${client.documentsRequired} received.\n\n**Deposit status** - ${client.depositPaid ? "Paid." : "Still pending."}\n\n**Ready for next step** - ${client.depositPaid ? "Begin preparation." : "Collect deposit before prep."}`
      },
      summary: missing > 0
        ? `Send ${firstName} a reminder for the remaining ${missing} document${missing === 1 ? "" : "s"}.`
        : `${firstName} is ready for the next stage.`,
    };
  }

  if (q.includes("meeting") || q.includes("communication") || q.includes("recent") || q.includes("call")) {
    return {
      steps: [
        { type: "thinking", text: `Pulling recent activity timeline for ${firstName}.` },
        { type: "searching", text: "Querying messages, calls, and portal events", source: "Last 30 days" },
        { type: "found", text: `Last activity logged ${client.lastActivity}.` },
      ],
      foundContent: {
        text: `**Last activity** - ${client.lastActivity}\n\n**Portal access** - ${client.lastPortalLogin ? `Last login ${client.lastPortalLogin}` : "Never logged in"}${client.scheduledCall ? `\n\n**Scheduled call** - ${client.scheduledCall}` : ""}`,
      },
      summary: client.scheduledCall ? `Upcoming call: ${client.scheduledCall}.` : `No upcoming calls scheduled.`,
    };
  }

  if (q.includes("document") || q.includes("doc")) {
    return {
      steps: [
        { type: "thinking", text: `Inspecting document checklist for ${firstName}.` },
        { type: "searching", text: "Cross-referencing intake against received documents" },
        { type: "found", text: `${client.documentsSubmitted}/${client.documentsRequired} documents received.` },
      ],
      foundContent: {
        text: `**Progress** - ${client.documentsSubmitted} of ${client.documentsRequired} documents in (${Math.round((client.documentsSubmitted / Math.max(client.documentsRequired, 1)) * 100)}%).\n\n**Next step** - Open the Documents tab to see exactly which items are still needed and trigger a reminder.`,
      },
      summary: `Review the Documents tab for the full checklist.`,
    };
  }

  if (q.includes("draft") || q.includes("message") || q.includes("follow") || q.includes("email")) {
    return {
      steps: [
        { type: "thinking", text: `Composing a follow-up draft for ${firstName} based on current stage.` },
        { type: "searching", text: "Pulling stage context, outstanding items, and tone preferences" },
        { type: "found", text: "Draft prepared." },
      ],
      foundContent: {
        text: `Drafted a follow-up for ${firstName} aligned with your warm-professional voice.\n\n**Open the Messages tab** to review, edit, and send.`,
      },
      summary: `Draft ready — review before sending.`,
    };
  }

  return {
    steps: [
      { type: "thinking", text: `Building a quick context summary for ${client.fullName}.` },
      { type: "searching", text: "Reading intake, stage, billing, and notes" },
      { type: "found", text: `Pulled full client snapshot.` },
    ],
    foundContent: {
      text: `**${client.fullName}** - ${client.type === "business" ? "Business client" : "Individual filer"} on the ${client.serviceTier} tier.\n\n**Stage** - ${client.returnStage.replace(/_/g, " ")}\n\n**Fee** - $${client.feeAmount.toLocaleString()}, deposit ${client.depositPaid ? "paid" : "pending"}\n\n**Documents** - ${client.documentsSubmitted}/${client.documentsRequired} received${client.notes ? `\n\n**Note** - ${client.notes}` : ""}`,
    },
    summary: `Anything specific you'd like to dig into?`,
  };
}

function formatSessionDate(date: Date) {
  const dateStr = date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const timeStr = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${dateStr} at ${timeStr}`;
}

const SUGGESTED_QUESTIONS = [
  "What tasks are pending for this client?",
  "What recent meetings or communications have we had?",
  "Draft a follow-up message",
];

export function ClientAskPetal({
  client,
  compact = false,
  onInsightAction,
  onInsightFlag,
  onMinimize,
}: {
  client: Client;
  compact?: boolean;
  onInsightAction?: (action: InsightAction) => void;
  onInsightFlag?: (title: string, description: string) => void;
  onMinimize?: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionStartedAt, setSessionStartedAt] = useState<Date | null>(null);
  const [expandedThinking, setExpandedThinking] = useState<Record<string, boolean>>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const insight = getInsightForClient(client.id);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg) return;
    const userId = `u-${Date.now()}`;
    const aiId = `a-${Date.now() + 1}`;
    if (!sessionStartedAt) setSessionStartedAt(new Date());
    setMessages(prev => [...prev, { id: userId, role: "user", content: msg }]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setIsTyping(true);

    const response = matchResponse(msg, client);

    // Phase 1: First reasoning step
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { id: aiId, role: "assistant", content: "", steps: [response.steps[0]] }]);
    }, 600);

    // Phase 2: Add searching step
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === aiId ? { ...m, steps: [response.steps[0], response.steps[1]] } : m));
    }, 1400);

    // Phase 3: Add found step
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === aiId ? { ...m, steps: response.steps } : m));
    }, 2100);

    // Phase 4: Stream answer
    setTimeout(() => {
      const words = response.foundContent.text.split(/(\s+)/);
      const wordsPerTick = 3;
      const tickInterval = 25;
      let tickIndex = 0;

      setMessages(prev => prev.map(m => m.id === aiId ? { ...m, foundContent: { text: "" } } : m));

      const timer = setInterval(() => {
        tickIndex++;
        const wordCount = tickIndex * wordsPerTick;
        if (wordCount >= words.length) {
          clearInterval(timer);
          setMessages(prev => prev.map(m => m.id === aiId ? { ...m, foundContent: response.foundContent, summary: response.summary } : m));
          return;
        }
        setMessages(prev => prev.map(m => m.id === aiId ? { ...m, foundContent: { text: words.slice(0, wordCount).join("") } } : m));
      }, tickInterval);
    }, 2800);
  };

  const newChat = () => {
    setMessages([]);
    setInput("");
    setIsTyping(false);
    setSessionStartedAt(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const copyMessage = (content: string) => {
    navigator.clipboard?.writeText(content).then(
      () => showToast("success", "Copied", "Message copied to clipboard"),
      () => showToast("error", "Copy failed", "Could not access clipboard"),
    );
  };

  const autoGrow = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      {/* Header row: greeting (only when there's an insight to show — otherwise
          the centered Ask-Petal block in the middle of the scroll area carries
          the heading on its own and the top stays clean) + action pills */}
      <div className="flex shrink-0 items-center justify-between gap-3 pb-3">
        {isEmpty && insight ? (
          <h1 className={`font-display tracking-tight ${compact ? "text-lg" : "text-xl md:text-2xl"}`}>
            {greeting()}, {PREPARER_FIRST_NAME}
          </h1>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-1 rounded-full border border-border bg-card px-1 py-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded-full text-muted-foreground hover:text-foreground"
            onClick={newChat}
            title="New chat"
          >
            <Plus className="size-4" />
          </Button>
          <span className="h-4 w-px bg-border" />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 rounded-full text-muted-foreground hover:text-foreground"
                title="History"
              >
                <History className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={8} className="w-[340px] p-0 overflow-hidden">
              <div className="border-b border-border/60 px-4 py-3">
                <div className="text-[13px] font-semibold">Chat history</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  Past Ask Petal conversations about {client.fullName.split(" ")[0]}
                </div>
              </div>
              <ul className="max-h-[380px] overflow-y-auto py-1">
                {getClientChatHistory(client.id).map((session) => (
                  <li key={session.id}>
                    <button
                      onClick={() => {
                        // Load this session into the chat view
                        setMessages(session.messages.map(m => ({
                          id: m.id, role: m.role, content: m.content, summary: m.summary,
                        })));
                        setSessionStartedAt(new Date(session.lastMessageAt));
                      }}
                      className="flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/40"
                    >
                      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-foreground/5">
                        <MessageSquare className="size-3.5 text-muted-foreground" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-medium truncate">{session.title}</div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <span>{formatHistoryTime(session.lastMessageAt)}</span>
                          <span className="text-muted-foreground/40">·</span>
                          <span>{session.messages.length} {session.messages.length === 1 ? "message" : "messages"}</span>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </PopoverContent>
          </Popover>
          {onMinimize && (
            <>
              <span className="h-4 w-px bg-border" />
              <Button
                variant="ghost"
                size="icon"
                className="size-7 rounded-full text-muted-foreground hover:text-foreground"
                onClick={onMinimize}
                title="Minimize chat"
              >
                <PanelRightClose className="size-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Scrollable content area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="space-y-4 px-1 pb-2">
          {/* Insight card — expanded when empty, collapsed when conversation started.
              Fade-in matches the AI insight animation on the overview + popup surfaces
              so it feels freshly generated. The key is on the motion wrapper so the
              empty↔active transition re-mounts and re-animates. */}
          {insight && (
            <div className="[zoom:0.85]">
              <motion.div
                key={isEmpty ? "insight-empty" : "insight-active"}
                initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
              >
                <PetalInsightCard
                  insight={insight}
                  defaultExpanded={isEmpty}
                  hideAskPetal
                  onAction={onInsightAction}
                  onFlag={onInsightFlag}
                />
              </motion.div>
            </div>
          )}

          {/* Suggested questions — when there's an insight, they sit below the
              insight in the natural flow (current behavior). */}
          {isEmpty && insight && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {SUGGESTED_QUESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="rounded-full border border-border/60 bg-card px-3 py-1.5 text-[13px] text-foreground/75 transition-colors hover:border-border hover:bg-muted hover:text-foreground"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Harvey-style centered empty state — for clients with no insight
              AND no messages yet (e.g. Ashley new_intake). Fills the empty
              middle of the chat panel with a clear call-to-action instead of
              dead vertical white space. The existing chat input bar at the
              bottom is still the entry point — user types there. */}
          {isEmpty && !insight && (
            <div className="flex min-h-[420px] flex-col items-center justify-center px-4 py-10 text-center">
              <div className="max-w-md space-y-3">
                <h2 className="font-display text-2xl tracking-tight md:text-3xl">
                  Ask Petal about {client.fullName.split(" ")[0]}
                </h2>
                <p className="text-[13px] leading-relaxed text-muted-foreground">
                  Petal needs more data before insights land. Ask anything below to get started.
                </p>
              </div>
              <div className="mt-6 flex flex-wrap justify-center gap-1.5">
                {SUGGESTED_QUESTIONS.map(q => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    className="rounded-full border border-border/60 bg-card px-3 py-1.5 text-[13px] text-foreground/75 transition-colors hover:border-border hover:bg-muted hover:text-foreground"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Conversation thread */}
          {!isEmpty && (
            <div className="space-y-5">
              {sessionStartedAt && (
                <div className="flex items-center justify-center py-1">
                  <span className="text-[11px] text-muted-foreground/60">
                    {formatSessionDate(sessionStartedAt)}
                  </span>
                </div>
              )}
              <AnimatePresence initial={false}>
                {messages.map(msg => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {msg.role === "user" ? (
                      <div className="flex justify-end">
                        <div className="max-w-[85%] rounded-2xl bg-muted px-4 py-2.5 text-[14px] leading-relaxed">
                          {msg.content}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Reasoning chain (collapsible) */}
                        {msg.steps && msg.steps.length > 0 && (
                          <>
                            <button
                              onClick={() => setExpandedThinking(prev => ({ ...prev, [msg.id]: !prev[msg.id] }))}
                              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted/50"
                            >
                              <div className="flex size-4 items-center justify-center">
                                <div className={`size-1.5 rounded-full bg-primary ${msg.foundContent ? "" : "animate-pulse"}`} />
                              </div>
                              <span className="text-[11px] text-muted-foreground">
                                {expandedThinking[msg.id]
                                  ? "Hide reasoning"
                                  : msg.foundContent ? `Reasoned over ${msg.steps.length} step${msg.steps.length === 1 ? "" : "s"}` : "Thinking…"}
                              </span>
                              <svg className={`size-3 text-muted-foreground transition-transform ${expandedThinking[msg.id] ? "rotate-180" : ""}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M3 4.5L6 7.5L9 4.5" />
                              </svg>
                            </button>
                            {expandedThinking[msg.id] && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                transition={{ duration: 0.25 }}
                                className="ml-4 space-y-1 overflow-hidden border-l border-border/40 pl-3 py-1"
                              >
                                {msg.steps.map((step, i) => (
                                  <motion.div
                                    key={i}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.08, duration: 0.25 }}
                                    className="flex items-center gap-2 py-0.5"
                                  >
                                    <div className="shrink-0">
                                      {step.type === "thinking" && <div className="size-1.5 rounded-full bg-muted-foreground/30" />}
                                      {step.type === "searching" && <Search size={12} className="text-muted-foreground/40" />}
                                      {step.type === "found" && <div className="size-1.5 rounded-full bg-emerald-500/60" />}
                                    </div>
                                    <p className="text-[11px] leading-snug text-muted-foreground/80">{step.text}</p>
                                    {step.source && <span className="text-[10px] text-muted-foreground/40">· {step.source}</span>}
                                  </motion.div>
                                ))}
                              </motion.div>
                            )}
                          </>
                        )}

                        {/* Found content */}
                        {msg.foundContent && (
                          <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className="space-y-3 pl-0.5 text-[14.5px] leading-[1.7]"
                          >
                            {msg.foundContent.text.split("\n\n").map((block, i) => {
                              if (block.startsWith("**")) {
                                const [bold, ...rest] = block.split(" - ");
                                const cleanBold = bold.replace(/\*\*/g, "");
                                if (rest.length === 0) {
                                  return (
                                    <p key={i} className="pt-1 font-bold text-foreground">{cleanBold}</p>
                                  );
                                }
                                return (
                                  <div key={i} className="flex items-start gap-2">
                                    <span className="mt-[0.55em] size-1 shrink-0 rounded-full bg-foreground/40" />
                                    <p>
                                      <span className="font-semibold text-foreground">{cleanBold}</span>
                                      <span className="text-foreground/80"> {rest.join(" - ")}</span>
                                    </p>
                                  </div>
                                );
                              }
                              return <p key={i} className="text-foreground/80">{block}</p>;
                            })}
                          </motion.div>
                        )}

                        {/* Summary line */}
                        {msg.summary && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.3 }}
                            className="pt-1 text-[14.5px] font-semibold text-foreground"
                          >
                            {msg.summary}
                          </motion.p>
                        )}

                        {/* Action icons */}
                        {msg.foundContent && (
                          <div className="flex items-center gap-1 pt-0.5">
                            <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-foreground" title="Share">
                              <Share2 className="size-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-foreground" title="Regenerate" onClick={() => handleSend(messages.find(u => u.role === "user" && u.id < msg.id)?.content)}>
                              <RefreshCw className="size-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-foreground" title="Copy" onClick={() => copyMessage(`${msg.foundContent?.text ?? ""}${msg.summary ? `\n\n${msg.summary}` : ""}`)}>
                              <Copy className="size-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-foreground" title="More">
                              <MoreHorizontal className="size-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              {isTyping && (
                <div className="flex items-center gap-1 pl-1">
                  <span className="size-1.5 animate-pulse rounded-full bg-foreground/40" />
                  <span className="size-1.5 animate-pulse rounded-full bg-foreground/40 [animation-delay:120ms]" />
                  <span className="size-1.5 animate-pulse rounded-full bg-foreground/40 [animation-delay:240ms]" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Input bar */}
      <div className="shrink-0 pt-2">
        <div className="relative flex items-end gap-2 rounded-2xl border border-border bg-muted/40 px-4 py-3 transition-colors focus-within:border-foreground/30 focus-within:bg-muted/60">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => { setInput(e.target.value); autoGrow(e.target); }}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask anything about this client..."
            rows={2}
            className="min-h-[56px] flex-1 resize-none bg-transparent py-1 text-[15px] leading-snug outline-none placeholder:text-muted-foreground/60"
          />
          <Button
            size="icon"
            onClick={() => handleSend()}
            disabled={!input.trim() && !isTyping}
            className="size-9 shrink-0 rounded-full bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600"
          >
            <ArrowUp className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

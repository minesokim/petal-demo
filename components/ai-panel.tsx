"use client";

import { useState, useRef, useEffect, createContext, useContext } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SendIcon, CopyIcon, RefreshCwIcon, ShareIcon,
  MoreHorizontalIcon, SearchIcon, FileTextIcon,
  Loader2Icon, PanelRightCloseIcon, MessageSquareTextIcon,
  MaximizeIcon, MinimizeIcon
} from "lucide-react";
import { motion } from "motion/react";

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */
type AIPanelContextType = {
  isOpen: boolean;
  isFullPage: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
  toggleFullPage: () => void;
  askQuestion: (question: string) => void;
  pendingQuestion: string | null;
  clearPendingQuestion: () => void;
};

const AIPanelContext = createContext<AIPanelContextType>({
  isOpen: false, isFullPage: false, toggle: () => {}, open: () => {}, close: () => {},
  toggleFullPage: () => {}, askQuestion: () => {}, pendingQuestion: null, clearPendingQuestion: () => {},
});

export const useAIPanel = () => useContext(AIPanelContext);
export const useAIPanelAsk = () => {
  const { askQuestion } = useContext(AIPanelContext);
  return askQuestion;
};

export function AIPanelProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullPage, setIsFullPage] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  return (
    <AIPanelContext.Provider value={{
      isOpen,
      isFullPage,
      toggle: () => setIsOpen((v) => !v),
      open: () => setIsOpen(true),
      close: () => { setIsOpen(false); setIsFullPage(false); },
      toggleFullPage: () => setIsFullPage((v) => !v),
      askQuestion: (q: string) => { setPendingQuestion(q); setIsOpen(true); },
      pendingQuestion,
      clearPendingQuestion: () => setPendingQuestion(null),
    }}>
      {children}
    </AIPanelContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type ThinkingStep = {
  type: "thinking" | "searching" | "found";
  text: string;
  source?: string;
};

type FoundContent = {
  text: string;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  steps?: ThinkingStep[];
  foundContent?: FoundContent;
  summary?: string;
};

/* ------------------------------------------------------------------ */
/*  Demo                                                               */
/* ------------------------------------------------------------------ */
const demoMessages: Message[] = [
  {
    id: "1",
    role: "user",
    content: "Which clients are at risk of missing the April 15 deadline?",
  },
  {
    id: "2",
    role: "assistant",
    content: "",
    steps: [
      { type: "thinking", text: "Analyzing 20 clients against April 15 deadline. Checking document completion rates, portal activity, and filing history." },
      { type: "searching", text: "Querying client pipeline, document status, and engagement logs", source: "20 clients analyzed" },
      { type: "found", text: "Identified 5 at-risk clients across 2 urgency levels." },
    ],
    foundContent: {
      text: "**Critical** - Vladimir Petrov: 0/16 docs, never logged in, complex international. Extension almost certain.\n\n**Critical** - DeShawn Williams: 1/6 docs, deposit unpaid, never logged in. New client.\n\n**High** - Tyrone Mitchell: 2/5 docs, 9 days stale, extended last year.\n\n**Moderate** - Priya Sharma: 3/7 docs, missing 1099s but active on portal.\n\n**Moderate** - Thomas DuBois: 11/14 docs, missing crypto records only.",
    },
    summary: "5 clients at risk. I've prepared draft messages for DeShawn and Tyrone in your Action Feed. Recommend scheduling an extension discussion with Vladimir this week.",
  },
];

const suggestedQuestions = [
  "Who hasn't logged into the portal?",
  "What's my outstanding revenue?",
  "Show clients missing documents",
  "Which returns need my review?",
];

/* ------------------------------------------------------------------ */
/*  Icons matching the inspiration                                     */
/* ------------------------------------------------------------------ */
function ThinkingIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-muted-foreground">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2.5 2.5" />
      <path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchingIcon() {
  return <SearchIcon className="text-muted-foreground" size={20} />;
}

function BulletIcon() {
  return (
    <div className="mt-[3px] flex size-[22px] items-center justify-center">
      <div className="bg-muted-foreground size-[6px] rounded-full" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  The Panel                                                          */
/* ------------------------------------------------------------------ */
export function AIPanel() {
  const { isOpen, isFullPage, close, toggleFullPage, pendingQuestion, clearPendingQuestion } = useAIPanel();
  const [messages, setMessages] = useState<Message[]>(demoMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  // Handle pending questions from other components
  useEffect(() => {
    if (pendingQuestion && isOpen) {
      handleSend(pendingQuestion);
      clearPendingQuestion();
    }
  }, [pendingQuestion, isOpen]);

  const handleSend = (text?: string) => {
    const msg = text || input;
    if (!msg.trim()) return;
    const userMsgId = Date.now().toString();
    const aiMsgId = (Date.now() + 1).toString();

    setMessages((prev) => [...prev, { id: userMsgId, role: "user", content: msg }]);
    setInput("");
    setIsTyping(true);

    // Phase 1: Show reasoning steps one by one
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { id: aiMsgId, role: "assistant", content: "", steps: [
          { type: "thinking", text: "Analyzing your question against practice data..." },
        ]},
      ]);
      setExpandedThinking(prev => ({ ...prev, [aiMsgId]: true }));
    }, 800);

    // Phase 2: Add searching step
    setTimeout(() => {
      setMessages((prev) => prev.map(m => m.id === aiMsgId ? {
        ...m, steps: [
          { type: "thinking", text: "Analyzing your question against practice data..." },
          { type: "searching", text: "Searching client records, documents, and activity logs", source: "20 clients queried" },
        ]
      } : m));
    }, 1800);

    // Phase 3: Add found step
    setTimeout(() => {
      setMessages((prev) => prev.map(m => m.id === aiMsgId ? {
        ...m, steps: [
          ...m.steps!,
          { type: "found", text: "Found relevant results." },
        ]
      } : m));
    }, 2600);

    // Phase 4: Add the actual answer
    setTimeout(() => {
      setMessages((prev) => prev.map(m => m.id === aiMsgId ? {
        ...m,
        foundContent: {
          text: "This is a demo of Ask Docket. In the full version, I have real-time access to all your client records, document statuses, communication history, and calendar data.\n\nI can help with questions about specific clients, missing documents, deadlines, deduction opportunities, and more.",
        },
        summary: "Every suggestion I make appears for your review first. I never send messages or take actions without your explicit approval.",
      } : m));
      // Auto-expand thinking for new messages
      setExpandedThinking(prev => ({ ...prev, [aiMsgId]: true }));
    }, 3400);
  };

  const [expandedThinking, setExpandedThinking] = useState<Record<string, boolean>>({ "2": true });

  const renderMessages = () => messages.map((msg) => (
    <div key={msg.id}>
      {msg.role === "user" ? (
        <div className="rounded-xl border border-white/15 bg-white/40 px-4 py-3 shadow-sm backdrop-blur-md dark:bg-white/5">
          <p className="text-foreground text-[13px] leading-snug">{msg.content}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Collapsible reasoning chain */}
          {msg.steps && msg.steps.length > 0 && (
            <button
              onClick={() => setExpandedThinking(prev => ({ ...prev, [msg.id]: !prev[msg.id] }))}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted/50"
            >
              <div className="flex size-4 items-center justify-center">
                <div className="size-1.5 rounded-full bg-primary animate-pulse" />
              </div>
              <span className="text-[11px] text-muted-foreground">
                {expandedThinking[msg.id] ? "Hide reasoning" : `Reasoned over ${msg.steps.length} steps`}
              </span>
              <svg className={`size-3 text-muted-foreground transition-transform ${expandedThinking[msg.id] ? "rotate-180" : ""}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 4.5L6 7.5L9 4.5" /></svg>
            </button>
          )}

          {expandedThinking[msg.id] && msg.steps && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} transition={{ duration: 0.3 }} className="ml-3 space-y-1.5 overflow-hidden border-l border-border/50 pl-3">
              {msg.steps.map((step, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1, duration: 0.3 }} className="flex items-start gap-2">
                  <div className="mt-1 shrink-0">
                    {step.type === "thinking" && <ThinkingIcon />}
                    {step.type === "searching" && <SearchingIcon />}
                    {step.type === "found" && <div className="flex size-[18px] items-center justify-center"><div className="size-2 rounded-full bg-emerald-500" /></div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-muted-foreground text-[11px] leading-relaxed">{step.text}</p>
                    {step.source && (
                      <span className="mt-1 inline-flex items-center gap-1 rounded bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        <FileTextIcon size={10} />
                        {step.source}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Found content - formatted with bold/bullets, animated in */}
          {msg.foundContent && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="space-y-1 pl-1">
              {msg.foundContent.text.split("\n\n").map((block, i) => {
                if (block.startsWith("**")) {
                  const [bold, ...rest] = block.split(" - ");
                  return (
                    <motion.div key={i} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08, duration: 0.3 }} className="flex items-start gap-2 py-0.5">
                      <span className="mt-[5px] size-1 shrink-0 rounded-full bg-foreground/50" />
                      <p className="text-[12px] leading-relaxed">
                        <span className="font-semibold text-foreground">{bold.replace(/\*\*/g, "")}</span>
                        {rest.length > 0 && <span className="text-muted-foreground"> - {rest.join(" - ")}</span>}
                      </p>
                    </motion.div>
                  );
                }
                return <motion.p key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.3 }} className="text-[12px] text-muted-foreground leading-relaxed">{block}</motion.p>;
              })}
            </motion.div>
          )}

          {/* Summary - animated in last */}
          {msg.summary && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.4 }} className="text-foreground text-[12px] font-medium leading-relaxed">{msg.summary}</motion.p>
          )}

          {/* Action icons - smaller */}
          <div className="flex items-center gap-1 pt-0.5">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground size-7"><ShareIcon size={14} /></Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground size-7"><RefreshCwIcon size={14} /></Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground size-7"><CopyIcon size={14} /></Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground size-7"><MoreHorizontalIcon size={14} /></Button>
          </div>
        </div>
      )}
    </div>
  ));

  return (
    <aside
      className="fixed right-0 top-0 bottom-0 z-40 flex flex-col overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
      style={{
        width: isOpen ? (isFullPage ? "100%" : 440) : 0,
        opacity: isOpen ? 1 : 0,
      }}
    >
      <div className={`flex h-full flex-col bg-gradient-to-b from-sidebar via-[hsl(48_25%_96%)] to-[hsl(142_20%_94%)] px-3 pt-3 backdrop-blur-xl dark:from-sidebar dark:via-[hsl(48_15%_7%)] dark:to-[hsl(142_15%_7%)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isFullPage ? "w-full" : "w-[440px]"}`}>
        {/* Header */}
        <div className="flex items-center gap-4 px-4 pb-6 pt-4">
          <Avatar className="size-11 shrink-0">
            <AvatarFallback className="bg-gradient-to-br from-violet-200 via-blue-100 to-pink-200 text-transparent">.</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold leading-tight">Ask Docket</h2>
            <p className="text-muted-foreground text-[13px]">Updated just now</p>
          </div>
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="text-muted-foreground/50 hover:text-muted-foreground size-8" onClick={toggleFullPage} title={isFullPage ? "Collapse" : "Expand"}>
              {isFullPage ? <MinimizeIcon size={15} /> : <MaximizeIcon size={15} />}
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground size-9" onClick={close}>
              <PanelRightCloseIcon size={18} />
            </Button>
          </div>
        </div>

        {/* Scrollable messages - overscroll-contain prevents scroll bleed to main content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className={`space-y-8 pb-6 transition-all duration-500 ${isFullPage ? "mx-auto max-w-2xl px-6" : "px-4"}`}>
            {renderMessages()}
            {isTyping && (
              <div className="flex items-center gap-2 rounded-lg px-2 py-2">
                <div className="flex gap-1">
                  <motion.div className="size-1.5 rounded-full bg-primary" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0 }} />
                  <motion.div className="size-1.5 rounded-full bg-primary" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }} />
                  <motion.div className="size-1.5 rounded-full bg-primary" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }} />
                </div>
                <span className="text-muted-foreground text-[11px]">Thinking...</span>
              </div>
            )}
            {messages.length <= 2 && !isTyping && (
              <div className="flex flex-wrap gap-2 pt-2">
                {suggestedQuestions.map((q) => (
                  <button key={q} onClick={() => handleSend(q)} className="rounded-full border border-white/15 bg-white/40 px-4 py-2.5 text-[12px] font-medium text-foreground shadow-sm backdrop-blur-md transition-colors hover:bg-white/60 dark:bg-white/5 dark:hover:bg-white/10">{q}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Input - fixed at bottom, outside scroll */}
        <div className={`shrink-0 pb-5 pt-4 transition-all duration-500 ${isFullPage ? "mx-auto w-full max-w-2xl px-6" : "px-4"}`}>
          <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/40 px-4 py-3 shadow-sm backdrop-blur-md dark:bg-white/5">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} placeholder="Ask about clients, documents, deadlines..." className="flex-1 bg-transparent text-[14px] text-foreground outline-none placeholder:text-muted-foreground" />
            <button onClick={() => handleSend()} disabled={!input.trim()} className="shrink-0 text-muted-foreground transition-colors hover:text-foreground disabled:text-muted-foreground/30"><SendIcon size={18} /></button>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">All suggestions require your review before sending.</p>
        </div>
      </div>
    </aside>
  );
}

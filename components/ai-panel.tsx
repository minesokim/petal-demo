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
import { motion, AnimatePresence } from "motion/react";
import { voiceDumpSession } from "@/lib/actions-mock-data";

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

// 8 cycling suggestions — shown 3 at a time with fade animation
const allSuggestions = [
  "Who needs my attention today?",
  "What's my outstanding revenue?",
  "Who hasn't logged into the portal?",
  "Show me Priya's missing documents",
  "Draft a message to DeShawn",
  "Which returns need my review?",
  "Compare this season to last season",
  "Which clients are at risk of extension?",
];

// Intent-matched demo responses
type DemoResponse = {
  steps: ThinkingStep[];
  foundContent: FoundContent;
  summary: string;
};

function matchResponse(query: string): DemoResponse {
  const q = query.toLowerCase();

  // 1. Who needs my attention / urgent
  if (q.includes("attention") || q.includes("urgent") || q.includes("needs me") || q.includes("priority")) {
    return {
      steps: [
        { type: "thinking", text: "Scanning all 20 clients for items requiring your immediate attention." },
        { type: "searching", text: "Checking pipeline stages, overdue items, and pending actions", source: "20 clients analyzed" },
        { type: "found", text: "Found 7 items needing your attention across 4 categories." },
      ],
      foundContent: {
        text: "**ERO Signatures (2)** - Rodriguez ($500) and Aisha Johnson ($350) have paid and signed. Your countersignature files their returns.\n\n**Overdue Deposits (2)** - DeShawn Williams ($150, 10 days overdue) and Vladimir Petrov ($500, never paid).\n\n**Stale Clients (2)** - Tyrone Mitchell (9 days, no activity) and DeShawn Williams (12 days, never logged in).\n\n**Ready to Prep (1)** - Miguel Sandoval has all 9 docs. Waiting for you to begin preparation.",
      },
      summary: "Start with the ERO signatures — those are 2 returns you can file in under a minute. I've prepared draft messages for DeShawn and Tyrone in your Action Feed.",
    };
  }

  // 2. Outstanding revenue / money
  if (q.includes("revenue") || q.includes("outstanding") || q.includes("owed") || q.includes("collected") || q.includes("money")) {
    return {
      steps: [
        { type: "thinking", text: "Calculating revenue across all active clients and invoices." },
        { type: "searching", text: "Querying payment records, deposits, and outstanding balances", source: "20 clients, 15 invoices" },
        { type: "found", text: "Revenue breakdown ready." },
      ],
      foundContent: {
        text: "**Collected this season** - $2,400 across 6 clients (3 deposits + 3 full payments).\n\n**Outstanding** - $4,650 across 14 clients. Breakdown: $1,500 in unpaid deposits, $3,150 in pending balance invoices.\n\n**Overdue** - $650 (DeShawn Williams deposit $150, 10 days + Vladimir Petrov deposit $500, never paid).\n\n**Projected total** - $7,050 when all 20 active returns are complete.",
      },
      summary: "You've collected 34% of projected revenue. The two overdue deposits ($650) should be prioritized — want me to draft payment reminders?",
    };
  }

  // 3. Portal logins
  if (q.includes("portal") || q.includes("logged in") || q.includes("login") || q.includes("never logged")) {
    return {
      steps: [
        { type: "thinking", text: "Checking portal access records for all active clients." },
        { type: "searching", text: "Querying last login timestamps and account activation status", source: "20 clients checked" },
        { type: "found", text: "4 clients have never accessed the portal." },
      ],
      foundContent: {
        text: "**Never logged in** - Vladimir Petrov (new intake, 0/16 docs), DeShawn Williams (new client, 1/6 docs), Ashley Kim (new intake, 0/8 docs), Fatima Al-Hassan (new intake, 0/7 docs).\n\n**Last login 7+ days ago** - Tyrone Mitchell (Mar 19, collecting docs), Jasmine Torres (Mar 24, collecting docs).\n\n**Active on portal this week** - 14 clients have logged in within the last 7 days.",
      },
      summary: "The 4 who've never logged in are your highest drop-off risk. Vladimir and DeShawn are both new clients with unpaid deposits — they may need a phone call rather than a portal nudge.",
    };
  }

  // 4. Missing documents (specific client or general)
  if (q.includes("missing") || q.includes("document") || q.includes("docs")) {
    const isPriya = q.includes("priya");
    const isDeShawn = q.includes("deshawn");
    if (isPriya) {
      return {
        steps: [
          { type: "thinking", text: "Looking up Priya Sharma's document checklist." },
          { type: "searching", text: "Checking required vs received documents", source: "7 items on checklist" },
          { type: "found", text: "Priya is missing 4 of 7 required documents." },
        ],
        foundContent: {
          text: "**Received (3)** - W-2 (verified), Driver's license (verified), Prior year return (verified).\n\n**Missing (4)** - 1099-NEC (TikTok income, requested 12 days ago), 1099-NEC (brand partnerships, requested 12 days ago), 1099-INT (bank interest, requested 7 days ago), SSN card (requested 7 days ago).\n\n**Notes** - Priya is active on the portal (last login Mar 22) but hasn't uploaded since her initial batch.",
        },
        summary: "The 1099-NECs are the blockers — she can't move to prep without them. She mentioned in chat she \"has her TikTok 1099 but isn't sure how to upload it.\" A quick walkthrough message could unblock her.",
      };
    }
    return {
      steps: [
        { type: "thinking", text: "Scanning document checklists across all active clients." },
        { type: "searching", text: "Comparing required vs received documents per client", source: "20 clients, 142 documents" },
        { type: "found", text: "4 clients have significant missing documents." },
      ],
      foundContent: {
        text: "**Priya Sharma** - 3/7 docs (missing 1099-NECs for TikTok + brand deals, 1099-INT, SSN card). Active on portal.\n\n**DeShawn Williams** - 1/6 docs (missing W-2, 1099s, ID, SSN card, prior return). Never logged in.\n\n**Jasmine Torres** - 4/8 docs (missing 1099-NECs, mortgage 1098, investment statements). Last active Mar 24.\n\n**Tyrone Mitchell** - 2/5 docs (missing Uber 1099-NEC, mileage log, prior return). 9 days stale.",
      },
      summary: "DeShawn is the most behind — he hasn't even logged into the portal. Priya is closest to ready but stuck on the 1099 uploads. Want me to draft personalized follow-ups for each?",
    };
  }

  // 5. Draft a message
  if (q.includes("draft") || q.includes("message") || q.includes("write") || q.includes("send")) {
    const isDeShawn = q.includes("deshawn");
    const isVlad = q.includes("vladimir") || q.includes("vlad");
    const name = isDeShawn ? "DeShawn" : isVlad ? "Vladimir" : "the client";
    const draft = isDeShawn
      ? "Hey DeShawn! Just checking in on your tax return. I noticed we're still waiting on your W-2 and a few other documents. The quickest way to get started is through your client portal — I've sent you the link. It only takes about 10 minutes to upload everything. Let me know if you have any questions!"
      : isVlad
      ? "Vladimir, I wanted to reach out about your 2025 tax return. Given the complexity of Petrov Imports, we should discuss whether filing an extension makes sense. Can we schedule a call this week?"
      : "Hi! Just following up on your tax return. We're making good progress but need a couple more items from you. Check your portal for the specific documents we're waiting on. Happy to help if you have any questions!";
    return {
      steps: [
        { type: "thinking", text: `Analyzing ${name}'s current status and communication history.` },
        { type: "searching", text: "Checking pipeline stage, missing items, and last contact", source: "Client record + message history" },
        { type: "found", text: "Draft generated based on context." },
      ],
      foundContent: { text: `**Draft message for ${name}:**\n\n"${draft}"` },
      summary: "This draft is in your Action Feed for review. Edit or send as-is — I won't send anything without your approval.",
    };
  }

  // 6. Returns needing review
  if (q.includes("review") || q.includes("prepared") || q.includes("ready to file")) {
    return {
      steps: [
        { type: "thinking", text: "Checking for clients in the Client Review stage." },
        { type: "searching", text: "Querying pipeline for client_review and pay_and_sign stages", source: "20 clients checked" },
        { type: "found", text: "4 clients need your attention at the review/signing stage." },
      ],
      foundContent: {
        text: "**Client Review (2)** - Roberto Fuentes (return sent Mar 25, 5 days waiting, last portal login Mar 26) and Mei-Lin Wu (return sent Mar 26, 4 days waiting, active on portal).\n\n**Pay & Sign (2)** - James & Sofia Rodriguez ($500 paid, 8879 signed, awaiting ERO) and Aisha Johnson ($350 paid, 8879 signed, awaiting ERO).",
      },
      summary: "Rodriguez and Johnson are ready to file right now — just need your ERO signature. Roberto and Mei-Lin are reviewing but haven't signed yet. Roberto is 5 days in — might be worth a nudge.",
    };
  }

  // 7. Season comparison
  if (q.includes("season") || q.includes("compare") || q.includes("last year") || q.includes("progress")) {
    return {
      steps: [
        { type: "thinking", text: "Comparing current season metrics against last year's data." },
        { type: "searching", text: "Analyzing filing rates, turnaround times, and revenue", source: "2025 vs 2026 season data" },
        { type: "found", text: "Season comparison ready." },
      ],
      foundContent: {
        text: "**Filed** - 3 of 20 returns (15%). Last year at this point: 5 of 18 (28%). You're behind pace by ~2 returns.\n\n**Average turnaround** - 12 days from docs complete to filed. Last year: 14 days. You're faster this season.\n\n**Revenue** - $2,400 collected of $7,050 projected (34%). Last year at this date: $3,200 of $6,300 (51%).\n\n**Client mix** - More complex returns this year (8 business vs 5 last year). Average fee up 18% ($352 vs $298).",
      },
      summary: "You're behind on filings but handling more complex (and higher-value) returns. The bottleneck is document collection — 6 clients are still in Collecting Docs. Clearing that backlog is the fastest path to catching up.",
    };
  }

  // 8. Extension risk
  if (q.includes("extension") || q.includes("risk") || q.includes("deadline") || q.includes("april 15")) {
    return {
      steps: [
        { type: "thinking", text: "Analyzing extension risk based on document completion, engagement, and complexity." },
        { type: "searching", text: "Scoring each client's likelihood of needing an extension", source: "20 clients scored" },
        { type: "found", text: "3 clients at high risk of needing extensions." },
      ],
      foundContent: {
        text: "**Almost certain (95%)** - Vladimir Petrov: 0/16 docs, never logged in, complex international business. No engagement whatsoever.\n\n**Likely (70%)** - DeShawn Williams: 1/6 docs, deposit unpaid, new client. 12 days since last activity.\n\n**Moderate (45%)** - Tyrone Mitchell: 2/5 docs, extended last year too. History of late filing.\n\n**Low risk** - All other clients are on track or have enough time to complete.",
      },
      summary: "Vladimir almost certainly needs an extension — recommend scheduling a call to confirm and file Form 4868 this week. DeShawn might still make it with aggressive follow-up.",
    };
  }

  // Fallback — still helpful, not a dead end
  return {
    steps: [
      { type: "thinking", text: "Processing your question against practice data." },
      { type: "searching", text: "Searching client records, documents, and activity", source: "20 clients queried" },
      { type: "found", text: "Here's what I found." },
    ],
    foundContent: {
      text: "I can help with that. Here are some things I can look up right now:\n\n**Clients** - Status, missing docs, deposit history, portal activity, extension risk.\n\n**Revenue** - Collected vs outstanding, overdue payments, projected totals.\n\n**Workflow** - Who's ready to prep, who needs your review, who needs ERO signing.\n\n**Communication** - Draft messages, follow-up suggestions, stale client alerts.",
    },
    summary: "Try asking about a specific client by name, or ask about deadlines, revenue, or documents. I work best with specific questions.",
  };
}

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
/*  Cycling Suggestions                                                */
/* ------------------------------------------------------------------ */
function CyclingSuggestions({ onSelect }: { onSelect: (q: string) => void }) {
  const [setIdx, setSetIdx] = useState(0);
  const setsOf3 = [
    [allSuggestions[0], allSuggestions[1], allSuggestions[2]],
    [allSuggestions[3], allSuggestions[4], allSuggestions[5]],
    [allSuggestions[6], allSuggestions[7], allSuggestions[0]],
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setSetIdx(prev => (prev + 1) % setsOf3.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const currentSet = setsOf3[setIdx];

  return (
    <div className="pt-2">
      <AnimatePresence mode="wait">
        <motion.div
          key={setIdx}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="flex flex-wrap gap-2"
        >
          {currentSet.map((q) => (
            <button
              key={q}
              onClick={() => onSelect(q)}
              className="rounded-full border border-white/15 bg-white/40 px-4 py-2.5 text-[12px] font-medium text-foreground shadow-sm backdrop-blur-md transition-colors hover:bg-white/60 dark:bg-white/5 dark:hover:bg-white/10"
            >
              {q}
            </button>
          ))}
        </motion.div>
      </AnimatePresence>
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

  // Voice results state
  const [voiceResults, setVoiceResults] = useState<typeof voiceDumpSession | null>(null);
  const [voiceChecked, setVoiceChecked] = useState<Record<string, boolean>>({});

  // Handle pending questions from other components
  useEffect(() => {
    if (pendingQuestion && isOpen) {
      if (pendingQuestion === "__voice_results__") {
        // Show voice results instead of sending as a question
        setVoiceResults(voiceDumpSession);
        const defaultChecked: Record<string, boolean> = {};
        voiceDumpSession.parsedItems.forEach(item => {
          defaultChecked[item.id] = item.category === "action"; // Auto-check actions, not personal todos
        });
        setVoiceChecked(defaultChecked);
        clearPendingQuestion();
      } else {
        handleSend(pendingQuestion);
        clearPendingQuestion();
      }
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

    const response = matchResponse(msg);

    // Phase 1: Show first reasoning step
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { id: aiMsgId, role: "assistant", content: "", steps: [response.steps[0]] },
      ]);
      setExpandedThinking(prev => ({ ...prev, [aiMsgId]: true }));
    }, 800);

    // Phase 2: Add searching step
    setTimeout(() => {
      setMessages((prev) => prev.map(m => m.id === aiMsgId ? {
        ...m, steps: [response.steps[0], response.steps[1]]
      } : m));
    }, 1800);

    // Phase 3: Add found step
    setTimeout(() => {
      setMessages((prev) => prev.map(m => m.id === aiMsgId ? {
        ...m, steps: response.steps
      } : m));
    }, 2600);

    // Phase 4: Add the actual answer
    setTimeout(() => {
      setMessages((prev) => prev.map(m => m.id === aiMsgId ? {
        ...m,
        foundContent: response.foundContent,
        summary: response.summary,
      } : m));
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
      className="fixed right-0 top-0 bottom-0 z-40 flex flex-col overflow-hidden border-l transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
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

            {/* Voice Results Card */}
            {voiceResults && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border bg-background p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex size-6 items-center justify-center rounded-full bg-zinc-900 dark:bg-zinc-100">
                      <svg className="size-3 text-white dark:text-zinc-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                    </div>
                    <span className="text-sm font-semibold">Voice Note</span>
                  </div>
                  <button
                    onClick={() => setVoiceResults(null)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Dismiss
                  </button>
                </div>

                {/* Transcript (collapsible) */}
                <details className="group">
                  <summary className="cursor-pointer text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                    View transcript
                  </summary>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed italic border-l-2 border-muted pl-3">
                    {voiceResults.transcript}
                  </p>
                </details>

                {/* Parsed items as checklist */}
                <div className="space-y-1.5">
                  {voiceResults.parsedItems.map(item => (
                    <label
                      key={item.id}
                      className="flex items-start gap-2.5 rounded-lg px-2 py-1.5 hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={voiceChecked[item.id] || false}
                        onChange={(e) => setVoiceChecked(prev => ({ ...prev, [item.id]: e.target.checked }))}
                        className="mt-0.5 rounded border-border"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs">{item.text}</span>
                        {item.clientName && (
                          <span className="ml-1.5 text-[10px] text-muted-foreground">
                            / {item.clientName.split(" ")[0]}
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>

                {/* Add to feed button */}
                <Button
                  size="sm"
                  className="w-full h-8 text-xs"
                  disabled={!Object.values(voiceChecked).some(v => v)}
                  onClick={() => {
                    const count = Object.values(voiceChecked).filter(v => v).length;
                    setVoiceResults(null);
                    setVoiceChecked({});
                    // In a real app, this would add items to the action feed
                    setMessages(prev => [...prev, {
                      id: Date.now().toString(),
                      role: "assistant",
                      content: "",
                      summary: `Added ${count} item${count !== 1 ? "s" : ""} from your voice note to the action feed.`,
                    }]);
                  }}
                >
                  Add {Object.values(voiceChecked).filter(v => v).length} to action feed
                </Button>
              </motion.div>
            )}

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
              <CyclingSuggestions onSelect={handleSend} />
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

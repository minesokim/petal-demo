"use client";

import { useState, useRef, useEffect, createContext, useContext } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SendIcon, CopyIcon, RefreshCwIcon, ShareIcon,
  MoreHorizontalIcon, SearchIcon, FileTextIcon,
  Loader2Icon, PanelRightCloseIcon, MessageSquareTextIcon
} from "lucide-react";
import { GooeyFilter } from "@/components/ui/gooey-filter";

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */
type AIPanelContextType = {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
  askQuestion: (question: string) => void;
  pendingQuestion: string | null;
  clearPendingQuestion: () => void;
};

const AIPanelContext = createContext<AIPanelContextType>({
  isOpen: false, toggle: () => {}, open: () => {}, close: () => {},
  askQuestion: () => {}, pendingQuestion: null, clearPendingQuestion: () => {},
});

export const useAIPanel = () => useContext(AIPanelContext);
export const useAIPanelAsk = () => {
  const { askQuestion } = useContext(AIPanelContext);
  return askQuestion;
};

export function AIPanelProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  return (
    <AIPanelContext.Provider value={{
      isOpen,
      toggle: () => setIsOpen((v) => !v),
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
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
      { type: "thinking", text: "Thinking through the process to find clients at risk of missing the filing deadline." },
      { type: "searching", text: "Searching for clients with incomplete documents and low portal engagement", source: "Client Pipeline - Active Returns" },
    ],
    foundContent: {
      text: "Found details regarding at-risk clients for the April 15 filing deadline.\n\nVladimir Petrov (Petrov Imports LLC) has submitted 0 of 16 required documents with no portal login recorded. DeShawn Williams has submitted 1 of 6 documents, has not paid the deposit, and has never logged into the portal. Tyrone Mitchell has been inactive for 9 days with only 2 of 5 documents submitted, and was extended last year. Priya Sharma is missing 4 documents but remains active on the portal. Thomas and Marie DuBois are missing 3 crypto-related documents including their Coinbase 1099-DA.",
    },
    summary: "Based on current filing status and engagement data, 5 clients are at high risk of missing the April 15 deadline. Vladimir Petrov will almost certainly need an extension. DeShawn Williams and Tyrone Mitchell need immediate outreach. AI draft messages have been prepared for both in your Action Feed.",
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
  const { isOpen, close, pendingQuestion, clearPendingQuestion } = useAIPanel();
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
    setMessages((prev) => [...prev, { id: Date.now().toString(), role: "user", content: msg }]);
    setInput("");
    setIsTyping(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "",
          steps: [
            { type: "thinking", text: "Processing your question against practice data." },
            { type: "searching", text: "Searching client records, documents, and activity logs" },
          ],
          foundContent: {
            text: "This is a demo of the Docket AI Assistant. In the full version, it has real-time access to all 203 client records, document statuses, communication history, and calendar data to provide precise, actionable answers.",
          },
          summary: "Every suggestion the AI makes appears for your review first. It never sends messages or takes actions on your behalf without explicit approval.",
        },
      ]);
      setIsTyping(false);
    }, 2500);
  };

  const renderMessages = () => messages.map((msg) => (
    <div key={msg.id}>
      {msg.role === "user" ? (
        <div className="rounded-2xl border border-border/60 bg-background px-6 py-4">
          <p className="text-foreground text-[15px] leading-snug">{msg.content}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {msg.steps?.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="shrink-0 pt-0.5">
                {step.type === "thinking" && <ThinkingIcon />}
                {step.type === "searching" && <SearchingIcon />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground text-[14.5px] leading-relaxed">{step.text}</p>
                {step.source && (
                  <button className="mt-2 inline-flex items-center gap-2 rounded-lg bg-muted/70 px-3.5 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-muted">
                    <FileTextIcon size={14} className="text-muted-foreground" />
                    {step.source}
                  </button>
                )}
              </div>
            </div>
          ))}
          {msg.foundContent && (
            <div className="flex items-start gap-3">
              <BulletIcon />
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground text-[14.5px] leading-[1.75]">{msg.foundContent.text}</p>
              </div>
            </div>
          )}
          {msg.summary && (
            <p className="text-foreground text-[15px] font-semibold leading-[1.7]">{msg.summary}</p>
          )}
          <div className="flex items-center gap-2 pt-1">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground size-10"><ShareIcon size={20} /></Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground size-10"><RefreshCwIcon size={20} /></Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground size-10"><CopyIcon size={20} /></Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground size-10"><MoreHorizontalIcon size={20} /></Button>
          </div>
        </div>
      )}
    </div>
  ));

  return (
    <aside
      className="fixed right-0 top-0 bottom-0 z-40 flex flex-col overflow-hidden transition-all duration-300 ease-in-out"
      style={{ width: isOpen ? 440 : 0, opacity: isOpen ? 1 : 0 }}
    >
      <div className="flex h-full w-[440px] flex-col bg-gradient-to-b from-sidebar via-sidebar to-[hsl(48_40%_95%)] px-3 pt-3 backdrop-blur-xl dark:to-[hsl(48_30%_8%)]">
        {/* Header */}
        <div className="flex items-center gap-4 px-4 pb-6 pt-4">
          <Avatar className="size-11 shrink-0">
            <AvatarFallback className="bg-gradient-to-br from-violet-200 via-blue-100 to-pink-200 text-transparent">.</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold leading-tight">Ask Docket</h2>
            <p className="text-muted-foreground text-[13px]">Updated just now</p>
          </div>
          <Button variant="ghost" size="icon" className="text-muted-foreground size-9" onClick={close}>
            <PanelRightCloseIcon size={18} />
          </Button>
        </div>

        {/* Scrollable messages - overscroll-contain prevents scroll bleed to main content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="space-y-8 px-4 pb-6">
            {renderMessages()}
            {isTyping && (
              <div className="flex flex-col items-center gap-4 py-4">
                <GooeyFilter id="ai-thinking-goo" strength={8} />
                <div className="relative flex items-center justify-center" style={{ filter: "url(#ai-thinking-goo)" }}>
                  <div
                    className="size-5 rounded-full"
                    style={{
                      background: "hsl(142.1 76.2% 36.3%)",
                      animation: "gooLeft 1.6s ease-in-out infinite",
                    }}
                  />
                  <div
                    className="size-5 rounded-full"
                    style={{
                      background: "hsl(214.7 95% 50%)",
                      animation: "gooCenter 1.6s ease-in-out infinite",
                    }}
                  />
                  <div
                    className="size-5 rounded-full"
                    style={{
                      background: "hsl(47.9 95.8% 53.1%)",
                      animation: "gooRight 1.6s ease-in-out infinite",
                    }}
                  />
                </div>
                <span className="text-muted-foreground text-[13px]">Analyzing your practice data...</span>
                <style>{`
                  @keyframes gooLeft {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(14px, 0); }
                  }
                  @keyframes gooCenter {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(0, -10px); }
                  }
                  @keyframes gooRight {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(-14px, 0); }
                  }
                `}</style>
              </div>
            )}
            {messages.length <= 2 && !isTyping && (
              <div className="flex flex-wrap gap-2 pt-2">
                {suggestedQuestions.map((q) => (
                  <button key={q} onClick={() => handleSend(q)} className="rounded-full border bg-background px-4 py-2.5 text-[13px] font-medium text-foreground transition-colors hover:bg-muted">{q}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Input - fixed at bottom, outside scroll */}
        <div className="shrink-0 px-4 pb-5 pt-4">
          <div className="flex items-center gap-2 rounded-2xl border bg-background px-4 py-3 shadow-sm">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} placeholder="Ask about clients, documents, deadlines..." className="flex-1 bg-transparent text-[14px] text-foreground outline-none placeholder:text-muted-foreground" />
            <button onClick={() => handleSend()} disabled={!input.trim()} className="shrink-0 text-muted-foreground transition-colors hover:text-foreground disabled:text-muted-foreground/30"><SendIcon size={18} /></button>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">All suggestions require your review before sending.</p>
        </div>
      </div>
    </aside>
  );
}

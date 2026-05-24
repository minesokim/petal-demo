"use client";

import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  SendIcon, UploadIcon, CopyIcon, RefreshCwIcon,
  ShareIcon, MoreHorizontalIcon, SearchIcon, BrainIcon,
  FileTextIcon, SparklesIcon, CheckCircleIcon, ChevronRightIcon,
  Loader2Icon, PanelRightIcon, XIcon
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type ThinkingStep = {
  icon: "thinking" | "searching" | "found";
  text: string;
  source?: string;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  thinking?: ThinkingStep[];
  answer?: string;
  timestamp: string;
};

/* ------------------------------------------------------------------ */
/*  Demo data                                                          */
/* ------------------------------------------------------------------ */
const demoMessages: Message[] = [
  {
    id: "1",
    role: "user",
    content: "Which clients are at risk of missing the April 15 deadline?",
    timestamp: "2 mins ago",
  },
  {
    id: "2",
    role: "assistant",
    content: "",
    thinking: [
      { icon: "thinking", text: "Analyzing client pipeline against April 15 filing deadline." },
      { icon: "searching", text: "Searching for clients with missing documents and low engagement", source: "Client Pipeline - 203 Active Clients" },
      { icon: "found", text: "Found 5 clients at risk across urgent and high priority levels." },
    ],
    answer:
      "Based on current filing status and engagement patterns, here are your highest-risk clients:\n\n**Critical (likely need extension):**\n\n- **Vladimir Petrov** - Petrov Imports LLC. 0 of 16 documents submitted. No portal login. Complex international business.\n\n- **DeShawn Williams** - No portal login, 1 of 6 docs, deposit unpaid. New client who may not understand the process.\n\n**High Risk (need immediate follow-up):**\n\n- **Tyrone Mitchell** - Stale for 9 days. Only 2 of 5 docs. Extended last year.\n\n- **Priya Sharma** - Missing 4 docs but active on portal.\n\n- **Thomas & Marie DuBois** - Missing 3 crypto docs.\n\nI've prepared AI draft messages for DeShawn and Tyrone in your Action Feed. Want me to draft an extension conversation for Vladimir?",
    timestamp: "Just now",
  },
];

const suggestedQuestions = [
  "Who hasn't logged into the portal yet?",
  "What's my outstanding revenue this month?",
  "Show me all clients missing documents",
  "Which returns are ready for my review?",
];

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */
function ThinkingStepRow({ step }: { step: ThinkingStep }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center">
        {step.icon === "thinking" && (
          <svg className="text-muted-foreground size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" strokeDasharray="3 3" />
            <path d="M12 6v6l4 2" />
          </svg>
        )}
        {step.icon === "searching" && (
          <SearchIcon className="text-muted-foreground size-4" />
        )}
        {step.icon === "found" && (
          <CheckCircleIcon className="size-4 text-green-500" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground text-[13px] leading-relaxed">{step.text}</p>
        {step.source && (
          <button className="bg-muted text-foreground mt-1.5 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent/10">
            <FileTextIcon className="size-3" />
            {step.source}
          </button>
        )}
      </div>
    </div>
  );
}

function FormattedAnswer({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.trim() === "") return <div key={i} className="h-2" />;

        // Bold headers like **Critical (likely need extension):**
        const boldHeaderMatch = line.match(/^\*\*(.+?)\*\*$/);
        if (boldHeaderMatch) {
          return (
            <p key={i} className="text-foreground pt-2 text-[13px] font-semibold">
              {boldHeaderMatch[1]}
            </p>
          );
        }

        // Bullet points with bold name like - **Name** - description
        const bulletMatch = line.match(/^- \*\*(.+?)\*\*(.*)$/);
        if (bulletMatch) {
          return (
            <div key={i} className="flex items-start gap-2 py-0.5 pl-1">
              <span className="bg-foreground mt-2 size-1 shrink-0 rounded-full" />
              <p className="text-[13px] leading-relaxed">
                <span className="text-foreground font-semibold">{bulletMatch[1]}</span>
                <span className="text-muted-foreground">{bulletMatch[2]}</span>
              </p>
            </div>
          );
        }

        // Regular text
        return (
          <p key={i} className="text-foreground text-[13px] font-medium leading-relaxed">
            {line}
          </p>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */
export default function Page() {
  const [messages, setMessages] = useState<Message[]>(demoMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = (text?: string) => {
    const msg = text || input;
    if (!msg.trim()) return;

    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", content: msg, timestamp: "Just now" },
    ]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "",
          thinking: [
            { icon: "thinking", text: "Processing your question against practice data." },
            { icon: "searching", text: "Searching client records, documents, and activity logs" },
          ],
          answer:
            "This is a demo of the Petal AI Assistant. In the full version, I have real-time access to all 203 client records, document statuses, communication history, and calendar data to give you precise, actionable answers.\n\nEvery suggestion I make appears for your review first. I never send messages or take actions without your approval.",
          timestamp: "Just now",
        },
      ]);
      setIsTyping(false);
    }, 2500);
  };

  return (
    <div className="flex h-[calc(100vh-var(--header-height)-2rem)] flex-col">
      {/* Panel Header */}
      <div className="flex items-center gap-3 px-6 py-4">
        <Avatar className="size-10">
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
            <SparklesIcon className="size-4" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h2 className="text-sm font-semibold">Petal AI</h2>
          <p className="text-muted-foreground text-xs">Your practice assistant</p>
        </div>
        <Button variant="ghost" size="icon" className="size-8">
          <PanelRightIcon className="size-4" />
        </Button>
      </div>

      <Separator />

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.role === "user" ? (
              /* User question - styled like the screenshot input bubble */
              <div className="bg-muted/60 rounded-2xl border px-5 py-3.5">
                <p className="text-foreground text-[14px] font-medium">{msg.content}</p>
              </div>
            ) : (
              /* Assistant response */
              <div className="space-y-1">
                {/* Thinking steps */}
                {msg.thinking && (
                  <div className="border-muted ml-2 space-y-0 border-l-2 pl-4">
                    {msg.thinking.map((step, i) => (
                      <ThinkingStepRow key={i} step={step} />
                    ))}
                  </div>
                )}

                {/* Answer */}
                {msg.answer && (
                  <div className="pt-3">
                    <FormattedAnswer text={msg.answer} />

                    {/* Action bar like the screenshot */}
                    <div className="mt-4 flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="text-muted-foreground size-8 hover:text-foreground">
                        <ShareIcon className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-muted-foreground size-8 hover:text-foreground">
                        <RefreshCwIcon className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-muted-foreground size-8 hover:text-foreground">
                        <CopyIcon className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-muted-foreground size-8 hover:text-foreground">
                        <MoreHorizontalIcon className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="border-muted ml-2 border-l-2 pl-4">
            <div className="flex items-center gap-2 py-2">
              <Loader2Icon className="text-muted-foreground size-4 animate-spin" />
              <span className="text-muted-foreground text-[13px]">Analyzing your practice data...</span>
            </div>
          </div>
        )}

        {/* Suggested questions (show when empty or after response) */}
        {messages.length <= 2 && !isTyping && (
          <div className="pt-2">
            <p className="text-muted-foreground mb-3 text-xs font-medium">Suggested questions</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="bg-muted/50 text-foreground hover:bg-muted rounded-full border px-3.5 py-2 text-xs font-medium transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Input area */}
      <div className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask about clients, documents, deadlines..."
              className="pr-10"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 size-7 -translate-y-1/2"
              onClick={() => handleSend()}
              disabled={!input.trim()}
            >
              <SendIcon className="size-3.5" />
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground mt-2 text-center text-[10px]">
          All suggestions require your review before sending.
        </p>
      </div>
    </div>
  );
}

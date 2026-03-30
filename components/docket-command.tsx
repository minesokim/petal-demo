"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { clients, stageLabels, actionItems, getClientPaymentSummary } from "@/lib/mock-data";
import { feedActions } from "@/lib/actions-mock-data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search, CornerDownLeft, ArrowUp, ArrowDown,
  FileText, Users, Zap, Shield, Check, Clock,
  Command as CommandIcon
} from "lucide-react";

// ─── Cycling placeholder phrases ───
const placeholders = [
  "Search clients, docs, actions...",
  "Who needs my attention today?",
  "Show me overdue deposits",
  "Draft a message to Vladimir...",
  "Which returns are ready to file?",
  "Show DeShawn's missing documents",
];

// ─── Search data builders ───
function getClientResults(query: string) {
  const q = query.toLowerCase();
  return clients
    .filter(c => c.clientStatus !== "declined" && (
      c.fullName.toLowerCase().includes(q) ||
      (c.businessName && c.businessName.toLowerCase().includes(q)) ||
      c.email.toLowerCase().includes(q)
    ))
    .slice(0, 4)
    .map(c => ({
      id: c.id,
      type: "client" as const,
      title: c.fullName,
      subtitle: [
        stageLabels[c.returnStage],
        `${c.documentsSubmitted}/${c.documentsRequired} docs`,
        c.depositPaid ? "Paid" : "Deposit pending",
      ].join(" \u00b7 "),
      avatar: c.avatar,
      initials: c.fullName.split(" ").map(n => n[0]).join("").slice(0, 2),
      href: `/dashboard/clients/${c.id}/overview`,
    }));
}

function getActionResults(query: string) {
  const q = query.toLowerCase();
  const actions = feedActions.filter(a =>
    !a.isResolved && (
      a.title.toLowerCase().includes(q) ||
      a.clientName.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q)
    )
  ).slice(0, 3);

  return actions.map(a => ({
    id: a.id,
    type: "action" as const,
    title: a.title,
    subtitle: [a.clientName, a.category].join(" \u00b7 "),
    icon: a.category === "signature" ? "signature" : a.category === "document" ? "document" : "action",
    href: `/dashboard/clients/${a.clientId}/overview`,
  }));
}

function getDocumentResults(query: string) {
  // Mock document search results
  const q = query.toLowerCase();
  const mockDocs = [
    { id: "d1", name: "2025_Federal_Return.pdf", client: "Rodriguez", clientId: "c3", size: "1.8 MB", date: "Mar 27", type: "PDF" },
    { id: "d2", name: "W-2_James_Rodriguez.pdf", client: "Rodriguez", clientId: "c3", size: "120 KB", date: "Mar 15", type: "W2" },
    { id: "d3", name: "W-2_Marcus_Chen.pdf", client: "Marcus Chen", clientId: "c1", size: "98 KB", date: "Mar 10", type: "W2" },
    { id: "d4", name: "1099-NEC_Priya_Sharma.pdf", client: "Priya Sharma", clientId: "c2", size: "84 KB", date: "Mar 8", type: "1099" },
    { id: "d5", name: "Schedule_K1_DuBois.pdf", client: "Thomas DuBois", clientId: "c8", size: "156 KB", date: "Mar 22", type: "K-1" },
    { id: "d6", name: "1120S_Fuentes_Transport.pdf", client: "Roberto Fuentes", clientId: "c6", size: "2.4 MB", date: "Mar 25", type: "1120S" },
    { id: "d7", name: "Engagement_Letter_Kim.pdf", client: "Ashley Kim", clientId: "c7", size: "64 KB", date: "Mar 26", type: "PDF" },
  ];

  return mockDocs
    .filter(d => d.name.toLowerCase().includes(q) || d.client.toLowerCase().includes(q))
    .slice(0, 3)
    .map(d => ({
      id: d.id,
      type: "document" as const,
      title: d.name,
      subtitle: [d.client, d.size, d.date].join(" \u00b7 "),
      docType: d.type,
      href: `/dashboard/clients/${d.clientId}/documents`,
    }));
}

// ─── AI Response mock ───
function getAIResponse(query: string) {
  const q = query.toLowerCase();

  if (q.includes("urgent") || q.includes("attention") || q.includes("important")) {
    return {
      text: "Aisha Johnson's return is ready to file. She's paid $350 and signed her 8879. You just need to countersign as ERO.",
      card: {
        type: "ero" as const,
        clientName: "Aisha Johnson",
        clientId: "c14",
        initials: "AJ",
        details: "$350 paid \u00b7 8879 signed Mar 28 \u00b7 ERO needed",
        action: "Sign as ERO",
      },
      followUp: "Rodriguez also needs ERO signing. Want me to show both?",
    };
  }

  if (q.includes("deposit") || q.includes("paid") || q.includes("payment")) {
    return {
      text: "3 clients have unpaid deposits: DeShawn Williams ($150), Ashley Kim ($350), and Vladimir Petrov ($500). DeShawn is the most overdue at 10 days.",
      card: null,
      followUp: "Want me to draft payment reminders for all three?",
    };
  }

  if (q.includes("missing") || q.includes("document") || q.includes("docs")) {
    return {
      text: "4 clients are missing documents. Priya Sharma needs 4 more (1099-NECs), DeShawn Williams needs 5 (nearly everything), Jasmine Torres needs 4, and Tyrone Mitchell needs 3.",
      card: null,
      followUp: "Should I draft follow-up messages for the most overdue ones?",
    };
  }

  return {
    text: "I can help with that. Try asking about specific clients, overdue items, missing documents, or upcoming deadlines.",
    card: null,
    followUp: null,
  };
}

// ─── Highlight match ───
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query || query.length < 2) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span className="underline decoration-primary/40 underline-offset-2">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}

// ─── Doc type badge ───
function DocTypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    PDF: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
    W2: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
    "1099": "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
    "K-1": "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400",
    "1120S": "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  };
  return (
    <div className={`flex size-10 items-center justify-center rounded-lg text-[10px] font-bold ${colors[type] || "bg-muted text-muted-foreground"}`}>
      {type}
    </div>
  );
}

// ─── Action icon ───
function ActionIcon({ type }: { type: string }) {
  const icons: Record<string, { bg: string; icon: React.ReactNode }> = {
    signature: { bg: "bg-amber-100 dark:bg-amber-950/50", icon: <Shield className="size-4 text-amber-700 dark:text-amber-400" /> },
    document: { bg: "bg-blue-100 dark:bg-blue-950/50", icon: <FileText className="size-4 text-blue-700 dark:text-blue-400" /> },
    action: { bg: "bg-violet-100 dark:bg-violet-950/50", icon: <Zap className="size-4 text-violet-700 dark:text-violet-400" /> },
  };
  const { bg, icon } = icons[type] || icons.action;
  return <div className={`flex size-10 items-center justify-center rounded-lg ${bg}`}>{icon}</div>;
}

// ─── Main Component ───
export function DocketCommand() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [aiMode, setAiMode] = useState(false);
  const [aiResponse, setAiResponse] = useState<ReturnType<typeof getAIResponse> | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Cycle placeholders
  useEffect(() => {
    if (open) return;
    const interval = setInterval(() => {
      setPlaceholderIdx(prev => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [open]);

  // Reset on close
  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setAiMode(false);
    setAiResponse(null);
    setSelectedIdx(0);
  }, []);

  // Cmd+K to open, Escape to close (global)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        close();
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, close]);

  // Focus input on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // Handle AI query
  const handleAiQuery = useCallback(() => {
    if (!query.trim()) return;
    setAiMode(true);
    setAiLoading(true);
    // Simulate AI processing
    setTimeout(() => {
      setAiResponse(getAIResponse(query));
      setAiLoading(false);
    }, 800);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { close(); return; }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleAiQuery();
      return;
    }
    if (e.key === "Enter" && !aiMode) {
      e.preventDefault();
      const allResults = [...getClientResults(query), ...getActionResults(query), ...getDocumentResults(query)];
      const selected = allResults[selectedIdx];
      if (selected?.href) { router.push(selected.href); close(); }
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx(prev => prev + 1); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx(prev => Math.max(0, prev - 1)); }
  };

  // Search results
  const clientResults = query.length >= 2 ? getClientResults(query) : [];
  const actionResults = query.length >= 2 ? getActionResults(query) : [];
  const docResults = query.length >= 2 ? getDocumentResults(query) : [];
  const hasResults = clientResults.length + actionResults.length + docResults.length > 0;

  const exampleQueries = [
    "What's my most urgent item?",
    "Show DeShawn's missing documents",
    "Who hasn't paid their deposit?",
  ];

  return (
    <>
      {/* ─── Resting trigger ─── */}
      <button
        onClick={() => setOpen(true)}
        className="relative flex h-9 w-full max-w-sm items-center gap-2 rounded-xl border border-border/50 bg-background/60 px-3 text-sm backdrop-blur-sm transition-all hover:border-border hover:bg-background/80"
      >
        <Search className="size-3.5 text-muted-foreground/60" />
        <AnimatePresence mode="wait">
          <motion.span
            key={placeholderIdx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="text-muted-foreground/50 text-[13px] truncate"
          >
            {placeholders[placeholderIdx]}
          </motion.span>
        </AnimatePresence>
        <div className="ml-auto flex items-center gap-0.5 rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/60">
          <CommandIcon className="size-2.5" />K
        </div>
      </button>

      {/* ─── Modal overlay ─── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop — invisible click catcher */}
            <div
              className="fixed inset-0 z-50 cursor-default"
              onClick={close}
              onMouseDown={(e) => e.target === e.currentTarget && close()}
            />

            {/* Command palette */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -4 }}
              transition={{ type: "spring", damping: 30, stiffness: 400, mass: 0.8 }}
              className="fixed left-1/2 top-[min(18vh,140px)] z-50 w-full max-w-xl -translate-x-1/2 px-4"
            >
              <div className="overflow-hidden rounded-2xl bg-background shadow-[0_8px_40px_-8px_rgba(0,0,0,0.12),0_2px_12px_-4px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_40px_-8px_rgba(0,0,0,0.5),0_2px_12px_-4px_rgba(0,0,0,0.3)] ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
                {/* Input */}
                <div className="flex items-center gap-3 border-b border-border/30 px-4 py-3">
                  <Search className="size-4 text-muted-foreground/50 shrink-0" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setAiMode(false); setAiResponse(null); setSelectedIdx(0); }}
                    onKeyDown={handleKeyDown}
                    placeholder=""
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/40"
                    autoComplete="off"
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <kbd className="rounded-md border border-border/30 bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/50">
                      ESC
                    </kbd>
                  </div>
                </div>

                {/* Content area */}
                <div className="max-h-[min(50vh,400px)] overflow-y-auto">
                  <AnimatePresence mode="wait">
                    {/* AI Response */}
                    {aiMode && (
                      <motion.div
                        key="ai"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="p-4"
                      >
                        {aiLoading ? (
                          <div className="flex items-center gap-3 py-6">
                            <div className="size-2 animate-pulse rounded-full bg-primary" />
                            <span className="text-sm text-muted-foreground">Thinking...</span>
                          </div>
                        ) : aiResponse && (
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <div className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                              <p className="text-sm leading-relaxed">{aiResponse.text}</p>
                            </div>

                            {aiResponse.card && (
                              <div className="ml-5 rounded-xl border bg-card p-3">
                                <div className="flex items-center gap-3">
                                  <Avatar className="size-10">
                                    <AvatarFallback className="text-xs">{aiResponse.card.initials}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="text-sm font-semibold">{aiResponse.card.clientName}</div>
                                    <div className="text-xs text-muted-foreground">{aiResponse.card.details}</div>
                                  </div>
                                  <Button
                                    size="sm"
                                    className="bg-emerald-700 hover:bg-emerald-800 text-white"
                                    onClick={() => { router.push(`/dashboard/clients/${aiResponse.card!.clientId}/overview`); close(); }}
                                  >
                                    {aiResponse.card.action}
                                  </Button>
                                </div>
                              </div>
                            )}

                            {aiResponse.followUp && (
                              <p className="ml-5 text-xs text-muted-foreground">{aiResponse.followUp}</p>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Empty state (no query) */}
                    {!aiMode && query.length < 2 && (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="p-4"
                      >
                        <p className="mb-4 text-center text-xs text-muted-foreground/50">
                          Search clients, docs, actions or ask Docket anything
                        </p>
                        <div className="space-y-1.5">
                          {exampleQueries.map((eq) => (
                            <button
                              key={eq}
                              onClick={() => { setQuery(eq); handleAiQuery(); }}
                              className="w-full rounded-lg px-3 py-2 text-center text-sm text-muted-foreground/70 transition-colors hover:bg-muted/50 hover:text-foreground"
                            >
                              &ldquo;{eq}&rdquo;
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Search results */}
                    {!aiMode && query.length >= 2 && (
                      <motion.div
                        key="results"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="py-2"
                      >
                        {!hasResults && (
                          <div className="px-3 py-4">
                            <p className="mb-3 text-center text-xs text-muted-foreground/40">No matches found</p>
                            <button
                              onClick={handleAiQuery}
                              className="flex w-full items-center gap-3 rounded-xl bg-muted/30 px-3 py-3 text-left transition-colors hover:bg-muted/50"
                            >
                              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                                <div className="size-2 rounded-full bg-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[11px] text-muted-foreground/50">Ask Docket</div>
                                <div className="text-sm truncate">{query}</div>
                              </div>
                              <CornerDownLeft className="size-3.5 text-muted-foreground/30 shrink-0" />
                            </button>
                          </div>
                        )}

                        {/* Clients */}
                        {clientResults.length > 0 && (
                          <div className="px-2 pb-1">
                            <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">
                              Clients
                            </div>
                            {clientResults.map((r, i) => (
                              <button
                                key={r.id}
                                onClick={() => { router.push(r.href); close(); }}
                                data-selected={selectedIdx === i}
                                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/50 data-[selected=true]:bg-muted/50"
                              >
                                <Avatar className="size-8">
                                  <AvatarImage src={r.avatar} />
                                  <AvatarFallback className="text-[10px]">{r.initials}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium">
                                    <HighlightMatch text={r.title} query={query} />
                                  </div>
                                  <div className="text-[11px] text-muted-foreground truncate">{r.subtitle}</div>
                                </div>
                                <CornerDownLeft className="size-3.5 text-muted-foreground/30 shrink-0" />
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        {actionResults.length > 0 && (
                          <div className="px-2 pb-1">
                            <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">
                              Actions
                            </div>
                            {actionResults.map((r, i) => (
                              <button
                                key={r.id}
                                onClick={() => { router.push(r.href); close(); }}
                                data-selected={selectedIdx === clientResults.length + i}
                                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/50 data-[selected=true]:bg-muted/50"
                              >
                                <ActionIcon type={r.icon} />
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium">
                                    <HighlightMatch text={r.title} query={query} />
                                  </div>
                                  <div className="text-[11px] text-muted-foreground truncate">{r.subtitle}</div>
                                </div>
                                <CornerDownLeft className="size-3.5 text-muted-foreground/30 shrink-0" />
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Documents */}
                        {docResults.length > 0 && (
                          <div className="px-2 pb-1">
                            <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">
                              Documents
                            </div>
                            {docResults.map((r, i) => (
                              <button
                                key={r.id}
                                onClick={() => { router.push(r.href); close(); }}
                                data-selected={selectedIdx === clientResults.length + actionResults.length + i}
                                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/50 data-[selected=true]:bg-muted/50"
                              >
                                <DocTypeBadge type={r.docType} />
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium">
                                    <HighlightMatch text={r.title} query={query} />
                                  </div>
                                  <div className="text-[11px] text-muted-foreground truncate">
                                    <HighlightMatch text={r.subtitle} query={query} />
                                  </div>
                                </div>
                                <CornerDownLeft className="size-3.5 text-muted-foreground/30 shrink-0" />
                              </button>
                            ))}
                          </div>
                        )}
                        {/* Ask Docket row — below results when results exist */}
                        {hasResults && (
                          <div className="mx-3 mb-2 mt-1">
                            <button
                              onClick={handleAiQuery}
                              className="flex w-full items-center gap-3 rounded-xl bg-muted/30 px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
                            >
                              <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
                                <div className="size-1.5 rounded-full bg-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[11px] text-muted-foreground/50">Ask Docket</div>
                                <div className="text-xs truncate">{query}</div>
                              </div>
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="flex items-center gap-3 border-t border-border/10 px-4 py-2">
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground/30">
                    <ArrowUp className="size-2.5" /><ArrowDown className="size-2.5" /> navigate
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground/30">
                    <CornerDownLeft className="size-2.5" /> open
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground/30">
                    esc close
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

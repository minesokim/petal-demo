"use client";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  ChevronRightIcon, VideoIcon, PhoneIcon,
  ClockIcon, SparklesIcon,
  SendIcon, FileTextIcon, ArrowUpRightIcon, CalendarIcon, MessageSquareIcon, MicIcon
} from "lucide-react";
import { ClientCard } from "@/components/ui/client-card";
import { ClientDetailDialog } from "@/components/client-detail-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { clients, actionItems, type Client } from "@/lib/mock-data";
import { initialTodos, type TodoItem } from "@/lib/actions-mock-data";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { IntelligencePanel } from "@/components/actions/intelligence/intelligence-panel";
import { BatchPanel } from "@/components/actions/batch/batch-panel";
import { VoiceDumpDialog } from "@/components/actions/voice/voice-dump-dialog";
import { useAIPanelAsk } from "@/components/ai-panel";
import { useToast } from "@/components/ui/toast-notification";
// Pipeline stages removed — replaced by summary bar in header

const todayAppointments = [
  { name: "Sarah Mitchell", avatar: "/images/avatars/10.png", time: "10:00 - 10:30 AM", type: "phone" as const, note: "New client intro call", clientId: "c21" },
  { name: "David Park", avatar: "/images/avatars/11.png", time: "3:00 - 4:00 PM", type: "video" as const, note: "S-Corp return review", clientId: "c11" },
  { name: "Miguel Sandoval", avatar: "/images/avatars/09.png", time: "4:00 - 4:30 PM", type: "phone" as const, note: "Discuss incorporation", clientId: "c9" },
];

const messages = [
  { name: "Priya Sharma", avatar: "/images/avatars/02.png", message: "Hi Antonio! I have my TikTok 1099 but I'm not sure how to upload it.", time: "2:30 PM", unread: true },
  { name: "David Park", avatar: "/images/avatars/11.png", message: "Can we push the call to 3pm instead of 2?", time: "8:15 AM", unread: true },
  { name: "Carlos & Elena Mendez", avatar: "/images/avatars/03.png", message: "Elena wants to know about the paint booth deduction.", time: "Yesterday", unread: true },
];

// need_you: ERO sign(2: Rodriguez,Aisha) + new_intake(3: Vladimir,Ashley,Fatima) + ready_to_prep(2: Miguel,Anthony) = 7
// waiting: collecting_docs(4: Priya,DeShawn,Jasmine,Tyrone) + client_review(2: Roberto,MeiLin) = 6
// in_progress: in_preparation(4: Marcus,DuBois,David,Mendez) = 4
// complete: filed(3: Linda,Karen,Rachel) = 3
// Total: 7+6+4+3 = 20 active clients
const summaryTabs = [
  { key: "need_you", label: "need you", count: 7, color: "bg-red-500" },
  { key: "waiting", label: "waiting", count: 6, color: "bg-amber-500" },
  { key: "in_progress", label: "in progress", count: 4, color: "bg-blue-500" },
  { key: "complete", label: "done", count: 3, color: "bg-emerald-500" },
  { key: "todos", label: "to-do", count: 0, color: "bg-violet-500" }, // count set dynamically
];

type ActionClient = {
  initials: string;
  name: string;
  detail: string;
  urgency: "red" | "amber" | "green" | "none";
};

const actionGroups: Record<string, { label: string; clients: ActionClient[] }[]> = {
  need_you: [
    { label: "Sign & file", clients: [
      { initials: "JR", name: "James & Sofia Rodriguez", detail: "Paid $500 + signed · your ERO countersignature needed", urgency: "amber" },
      { initials: "AJ", name: "Aisha Johnson", detail: "Paid $350 + signed · your ERO countersignature needed", urgency: "amber" },
    ]},
    { label: "New intakes", clients: [
      { initials: "VP", name: "Vladimir Petrov", detail: "0 of 16 docs · deposit unpaid · never logged in", urgency: "red" },
      { initials: "AK", name: "Ashley Kim", detail: "Intake sent · 2 days ago · deposit pending", urgency: "none" },
      { initials: "FA", name: "Fatima Al-Hassan", detail: "Intake sent · yesterday · nudge in 1 day", urgency: "none" },
    ]},
    { label: "Ready to prep", clients: [
      { initials: "MS", name: "Miguel Sandoval", detail: "9 of 9 docs · ready for prep", urgency: "none" },
      { initials: "AR", name: "Anthony Russo", detail: "9 of 9 docs · cap gains calc needed", urgency: "none" },
    ]},
  ],
  waiting: [
    { label: "Collecting documents", clients: [
      { initials: "PS", name: "Priya Sharma", detail: "3 of 7 docs · missing 1099s · $300 remaining", urgency: "amber" },
      { initials: "DW", name: "DeShawn Williams", detail: "1 of 6 docs · $150 deposit overdue 10 days", urgency: "red" },
      { initials: "JT", name: "Jasmine Torres", detail: "4 of 8 docs · freelance 1099s · $300 remaining", urgency: "amber" },
      { initials: "TM", name: "Tyrone Mitchell", detail: "2 of 5 docs · 9 days stale · $100 remaining", urgency: "red" },
    ]},
    { label: "Client reviewing return", clients: [
      { initials: "RF", name: "Roberto Fuentes", detail: "1120S · reviewing 5 days · $450 balance invoiced", urgency: "none" },
      { initials: "MW", name: "Mei-Lin Wu", detail: "Schedule C · reviewing 4 days · $450 balance invoiced", urgency: "none" },
    ]},
  ],
  in_progress: [
    { label: "In preparation", clients: [
      { initials: "MC", name: "Marcus Chen", detail: "Schedule C · 3 restaurants · $450 remaining", urgency: "none" },
      { initials: "TD", name: "Thomas & Marie DuBois", detail: "1040 + crypto · 11 of 14 docs · $450 remaining", urgency: "amber" },
      { initials: "DP", name: "David Park", detail: "1120S · call at 3:00 PM today · $450 remaining", urgency: "amber" },
      { initials: "CM", name: "Carlos & Elena Mendez", detail: "1065 partnership · 13 of 14 docs · $450 remaining", urgency: "none" },
    ]},
  ],
  complete: [
    { label: "Filed & accepted", clients: [
      { initials: "LN", name: "Linda Nakamura", detail: "1040 · filed Mar 15 · paid in full", urgency: "green" },
      { initials: "KO", name: "Karen O'Brien", detail: "1040 · filed Mar 10 · paid in full", urgency: "green" },
      { initials: "RG", name: "Rachel Goldstein", detail: "1040 MFJ · filed Mar 12 · paid in full", urgency: "green" },
    ]},
  ],
};

export default function Page() {
  const [activeTab, setActiveTab] = useState("need_you");
  const [viewMode, setViewMode] = useState<"clients" | "actions">("actions");
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [detailClient, setDetailClient] = useState<Client | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<typeof todayAppointments[0] | null>(null);
  const [todos, setTodos] = useState<TodoItem[]>(initialTodos);
  const [newTodoText, setNewTodoText] = useState("");
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [sentDrafts, setSentDrafts] = useState<Set<string>>(new Set());
  const [editingDraft, setEditingDraft] = useState<string | null>(null);
  const { showToast } = useToast();
  let askDocket = (_q: string) => {};
  try { askDocket = useAIPanelAsk(); } catch {}

  const toggleTodo = (id: string) => setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const addTodo = () => {
    if (!newTodoText.trim()) return;
    setTodos(prev => [{ id: `t-${Date.now()}`, text: newTodoText.trim(), done: false, source: "manual", createdAt: new Date().toISOString() }, ...prev]);
    setNewTodoText("");
  };
  const pendingTodoCount = todos.filter(t => !t.done).length;

  const tabHues: Record<string, { border: string; bg: string }> = {
    need_you: { border: "border-red-500", bg: "bg-red-50/40 dark:bg-red-950/15" },
    waiting: { border: "border-amber-500", bg: "bg-amber-50/40 dark:bg-amber-950/15" },
    in_progress: { border: "border-blue-500", bg: "bg-blue-50/40 dark:bg-blue-950/15" },
    complete: { border: "border-emerald-500", bg: "bg-emerald-50/40 dark:bg-emerald-950/15" },
    todos: { border: "border-violet-500", bg: "bg-violet-50/40 dark:bg-violet-950/15" },
  };

  return (
    <div className="space-y-5">
      {/* ── Header with status bar ── */}
      <div className="rounded-xl border bg-card px-5 py-4">
        <h1 className="text-2xl font-bold tracking-tight">Good morning, Antonio</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          18 days to deadline · 3 of 20 filed · <span className="text-emerald-600 font-medium">$2,850 collected</span> · <span className="text-foreground font-medium">$4,200 outstanding</span> · <span className="text-red-500 font-medium">1 overdue</span>
        </p>

        {/* Status counts — clickable to filter action feed */}
        <div className="flex items-center gap-5 mt-4">
          {summaryTabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const isHovered = hoveredTab === tab.key;
            return (
              <motion.button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                onMouseEnter={() => setHoveredTab(tab.key)}
                onMouseLeave={() => setHoveredTab(null)}
                className={`flex items-center gap-2 cursor-pointer select-none ${isActive ? "opacity-100" : "opacity-50"}`}
                animate={{ scale: isHovered || isActive ? 1.05 : 1, opacity: isActive ? 1 : isHovered ? 0.8 : 0.5 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <span className={`size-2.5 rounded-full ${tab.color}`} />
                <span className="font-display text-lg font-semibold tabular-nums">{tab.key === "todos" ? pendingTodoCount : tab.count}</span>
                <span className={`text-sm ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`}>{tab.label}</span>
                {isActive && <span className="size-1 rounded-full bg-foreground/40" />}
              </motion.button>
            );
          })}
        </div>

        {/* Segmented progress bar — interactive with spring physics */}
        <div className="flex gap-1.5 mt-3">
          {summaryTabs.map((tab, i) => {
            const getCount = (t: typeof tab) => t.key === "todos" ? pendingTodoCount : t.count;
            const total = summaryTabs.reduce((s, t) => s + getCount(t), 0);
            const basePct = (getCount(tab) / total) * 100;
            const isBarHovered = hoveredTab === tab.key;
            const isActive = activeTab === tab.key;
            // When a bar is hovered, it grows by 3%, others shrink proportionally
            const hoverBoost = isBarHovered ? 3 : hoveredTab ? -(3 / (summaryTabs.length - 1)) : 0;
            const pct = basePct + hoverBoost;
            return (
              <motion.div
                key={tab.key}
                className={`h-3.5 rounded-full ${tab.color} cursor-pointer ${isActive ? "opacity-100" : "opacity-50"}`}
                initial={{ width: 0 }}
                animate={{
                  width: `${pct}%`,
                  opacity: isActive ? 1 : isBarHovered ? 0.8 : 0.5,
                }}
                transition={
                  isBarHovered || hoveredTab
                    ? { type: "spring", stiffness: 300, damping: 20, mass: 0.8 }
                    : { duration: 1.2, delay: 0.1 + i * 0.1, ease: [0.35, 0, 0.15, 1] }
                }
                onClick={() => setActiveTab(tab.key)}
                onMouseEnter={() => setHoveredTab(tab.key)}
                onMouseLeave={() => setHoveredTab(null)}
              />
            );
          })}
        </div>
      </div>

      {/* ── Action Feed ── */}
      <Card className="overflow-hidden">
        {/* Section header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h3 className="text-sm font-semibold capitalize">{summaryTabs.find(t => t.key === activeTab)?.label}</h3>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]" onClick={() => setVoiceOpen(true)}>
              <MicIcon className="size-3" /> Voice
            </Button>
            {activeTab !== "todos" && (
              <div className="flex rounded-lg border">
                {(["actions", "clients"] as const).map((mode, i, arr) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1 text-[11px] font-medium transition-colors ${viewMode === mode ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"} ${i === 0 ? "rounded-l-md" : ""} ${i === arr.length - 1 ? "rounded-r-md" : ""}`}
                  >
                    {mode === "actions" ? "Actions" : "Clients"}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <CardContent className="pt-0 pb-4">
          {activeTab === "todos" ? (
            /* ── To-do list ── */
            <div className="space-y-1">
              {/* Add task input */}
              <div className="flex items-center gap-2 pb-2">
                <Input
                  placeholder="Add a task..."
                  value={newTodoText}
                  onChange={e => setNewTodoText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addTodo()}
                  className="h-9 text-sm"
                />
                <Button size="sm" variant="outline" className="h-9 shrink-0" onClick={addTodo} disabled={!newTodoText.trim()}>
                  Add
                </Button>
              </div>

              {/* Pending items */}
              {todos.filter(t => !t.done).map(todo => (
                <div key={todo.id} className="flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/50">
                  <Checkbox checked={todo.done} onCheckedChange={() => toggleTodo(todo.id)} className="mt-0.5 cursor-pointer" />
                  <div className="min-w-0 flex-1">
                    <span className="text-sm leading-snug">{todo.text}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      {todo.clientName && (
                        <button onClick={() => {
                          const c = clients.find(cl => cl.id === todo.clientId);
                          if (c) setDetailClient(c);
                        }}>
                          <Badge variant="outline" className="text-[9px] h-4 px-1.5 cursor-pointer hover:bg-muted">{todo.clientName.split(" ")[0]}</Badge>
                        </button>
                      )}
                      {todo.source === "voice" && (
                        <button onClick={() => askDocket(`Help me with: "${todo.text}"${todo.clientName ? ` for ${todo.clientName}` : ""}`)} className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-primary transition-colors cursor-pointer" title="Ask Docket about this">
                          <MicIcon className="size-2.5" /> Voice
                        </button>
                      )}
                      {todo.source === "ai" && (
                        <button onClick={() => askDocket(`Help me with: "${todo.text}"${todo.clientName ? ` for ${todo.clientName}` : ""}`)} className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-primary transition-colors cursor-pointer" title="Ask Docket about this">
                          <SparklesIcon className="size-2.5" /> AI
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Completed items */}
              {todos.filter(t => t.done).length > 0 && (
                <div className="pt-2">
                  <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Completed</div>
                  {todos.filter(t => t.done).map(todo => (
                    <label key={todo.id} className="flex items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50 cursor-pointer opacity-50">
                      <Checkbox checked={todo.done} onCheckedChange={() => toggleTodo(todo.id)} className="mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm leading-snug line-through">{todo.text}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          {todo.clientName && <Badge variant="outline" className="text-[9px] h-4 px-1.5">{todo.clientName.split(" ")[0]}</Badge>}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ) : viewMode === "actions" ? (
            <div className="space-y-3">
              {(actionGroups[activeTab] || []).map((group) => (
                <div key={group.label}>
                  <div className="px-1 pt-3 pb-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{group.label}</span>
                  </div>
                  {group.clients.map((actionClient, ci) => {
                    const matchedAction = actionItems.find(a =>
                      !a.isResolved && a.clientName.includes(actionClient.name.split(" ")[0])
                    );
                    const matchedClientForAvatar = clients.find(c =>
                      c.fullName.includes(actionClient.name.split(" ")[0]) ||
                      actionClient.initials === c.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
                    );
                    return (
                      <div key={`${group.label}-${ci}`} className="rounded-xl border p-3.5">
                        <button onClick={() => matchedClientForAvatar && setDetailClient(matchedClientForAvatar)} className="flex w-full items-center gap-3 text-left transition-colors hover:opacity-80">
                          <Avatar className="size-8 shrink-0">
                            {matchedClientForAvatar && <AvatarImage src={matchedClientForAvatar.avatar} alt={actionClient.name} />}
                            <AvatarFallback className="text-[10px]">{actionClient.initials}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold leading-tight">{actionClient.name}</div>
                            <div className="text-muted-foreground text-xs">{actionClient.detail}</div>
                          </div>
                          {actionClient.urgency !== "none" && (
                            <span className={`size-2 shrink-0 rounded-full ${
                              actionClient.urgency === "red" ? "bg-red-500" :
                              actionClient.urgency === "amber" ? "bg-amber-500" :
                              "bg-emerald-500"
                            }`} />
                          )}
                        </button>
                        {matchedAction?.aiDraft && (
                          <div className="mt-2.5 ml-11">
                            {sentDrafts.has(matchedAction.id) ? (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-400"
                              >
                                <motion.svg
                                  width="14" height="14" viewBox="0 0 14 14" fill="none"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: "spring", stiffness: 500, damping: 20, delay: 0.15 }}
                                >
                                  <path d="M3 7L5.5 9.5L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </motion.svg>
                                Sent to {actionClient.name.split(" ")[0]}
                              </motion.div>
                            ) : (
                              <>
                                {editingDraft === matchedAction.id ? (
                                  <textarea
                                    defaultValue={matchedAction.aiDraft}
                                    className="w-full rounded-lg border bg-background px-3 py-2 text-xs leading-relaxed outline-none focus:ring-1 focus:ring-primary resize-none"
                                    rows={3}
                                    autoFocus
                                  />
                                ) : (
                                  <p className="text-xs leading-relaxed text-muted-foreground">{matchedAction.aiDraft}</p>
                                )}
                                <div className="mt-2 flex gap-2">
                                  <Button size="sm" className="h-7 text-xs" onClick={() => { setSentDrafts(p => new Set([...p, matchedAction.id])); setEditingDraft(null); showToast("sent", `Message sent to ${actionClient.name.split(" ")[0]}`, "Delivered via portal and email"); }}>
                                    <SendIcon className="size-3" /> {editingDraft === matchedAction.id ? "Send edited" : "Send as Antonio"}
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditingDraft(editingDraft === matchedAction.id ? null : matchedAction.id)}>
                                    <FileTextIcon className="size-3" /> {editingDraft === matchedAction.id ? "Cancel" : "Edit"}
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-2 grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {(() => {
                const allClientsInTab = (actionGroups[activeTab] || []).flatMap(g => g.clients);
                const uniqueClients = allClientsInTab.reduce((acc, ac) => {
                  if (!acc.find(c => c.initials === ac.initials)) acc.push(ac);
                  return acc;
                }, [] as typeof allClientsInTab);
                return uniqueClients.map((actionClient, ci) => {
                  const matchedClient = clients.find(c =>
                    c.fullName.includes(actionClient.name.split(" ")[0]) ||
                    actionClient.initials === c.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
                  );
                  const urgencyBg =
                    actionClient.urgency === "red" ? "bg-red-50 dark:bg-red-950/20" :
                    actionClient.urgency === "amber" ? "bg-amber-50 dark:bg-amber-950/20" :
                    actionClient.urgency === "green" ? "bg-emerald-50 dark:bg-emerald-950/20" :
                    "";
                  if (matchedClient) {
                    return (
                      <div key={ci} className={`rounded-2xl ${urgencyBg}`}>
                        <ClientCard client={matchedClient} onOpenDetail={setDetailClient} />
                      </div>
                    );
                  }
                  const fallbackClient = clients.find(c =>
                    c.fullName.toLowerCase().includes(actionClient.name.split(" ")[0].toLowerCase())
                  );
                  return (
                    <button
                      key={ci}
                      onClick={() => fallbackClient && setDetailClient(fallbackClient)}
                      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-muted/50 ${urgencyBg}`}
                    >
                      <Avatar className="size-9 shrink-0">
                        {fallbackClient && <AvatarImage src={fallbackClient.avatar} alt={actionClient.name} />}
                        <AvatarFallback className="text-xs">{actionClient.initials}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold">{actionClient.name}</div>
                        <div className="text-muted-foreground text-xs">{actionClient.detail}</div>
                      </div>
                    </button>
                  );
                });
              })()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Today + Messages ── */}
      <div className="grid gap-4 xl:grid-cols-5">
        {/* Today's Schedule */}
        <Card className="xl:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <CalendarIcon className="size-3.5" />
              Today
            </CardTitle>
            <CardAction>
              <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                <Link href="/dashboard/apps/calendar">
                  Calendar <ChevronRightIcon className="size-3" />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {todayAppointments.map((apt) => (
              <button
                key={apt.name}
                onClick={() => setSelectedAppointment(apt)}
                className="bg-muted/50 flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-muted"
              >
                <Avatar className="size-8 shrink-0">
                  <AvatarImage src={apt.avatar} alt={apt.name} />
                  <AvatarFallback className="text-[10px]">{apt.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold leading-tight">{apt.name}</div>
                  <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                    {apt.type === "video" ? <VideoIcon className="size-3" /> : <PhoneIcon className="size-3" />}
                    {apt.time}
                    <span className="text-muted-foreground/60">·</span>
                    {apt.note}
                  </div>
                </div>
                <ChevronRightIcon className="size-3.5 text-muted-foreground shrink-0" />
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Messages */}
        <Card className="xl:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <MessageSquareIcon className="size-3.5" />
              Messages
              <Badge variant="secondary" className="ml-1 h-5 rounded-full px-1.5 text-[10px] font-bold">3</Badge>
            </CardTitle>
            <CardAction>
              <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                <Link href="/dashboard/apps/chat">
                  View all <ChevronRightIcon className="size-3" />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-0.5 pt-0">
            {messages.map((msg, i) => (
              <Link
                key={i}
                href="/dashboard/apps/chat"
                className="flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted/50"
              >
                <Avatar className="size-8 shrink-0">
                  <AvatarImage src={msg.avatar} alt={msg.name} />
                  <AvatarFallback className="text-[10px]">{msg.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold leading-tight">{msg.name}</span>
                    <span className="text-muted-foreground shrink-0 text-[11px]">{msg.time}</span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{msg.message}</p>
                </div>
                {msg.unread && <span className="size-2 shrink-0 rounded-full bg-blue-500" />}
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Voice Notes Dialog */}
      <VoiceDumpDialog open={voiceOpen} onOpenChange={setVoiceOpen} />

      <ClientDetailDialog
        client={detailClient}
        open={!!detailClient}
        onOpenChange={(open) => !open && setDetailClient(null)}
      />

      {/* Appointment Detail Dialog */}
      {selectedAppointment && (
        <Dialog open={!!selectedAppointment} onOpenChange={(open) => !open && setSelectedAppointment(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedAppointment.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="size-12">
                  <AvatarImage src={selectedAppointment.avatar} alt={selectedAppointment.name} />
                  <AvatarFallback>{selectedAppointment.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-base font-semibold">{selectedAppointment.name}</div>
                  <div className="text-sm text-muted-foreground">{selectedAppointment.note}</div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <ClockIcon className="size-4 text-muted-foreground" />
                  <div className="font-medium">Today, {selectedAppointment.time}</div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  {selectedAppointment.type === "video" ? <VideoIcon className="size-4 text-muted-foreground" /> : <PhoneIcon className="size-4 text-muted-foreground" />}
                  <div className="font-medium">{selectedAppointment.type === "video" ? "Google Meet" : "Phone call"}</div>
                </div>
              </div>

              <Separator />

              <div className="flex gap-2">
                {selectedAppointment.type === "video" && (
                  <Button className="flex-1"><VideoIcon className="size-3.5" /> Join Meeting</Button>
                )}
                {selectedAppointment.type === "phone" && (
                  <Button className="flex-1"><PhoneIcon className="size-3.5" /> Call</Button>
                )}
                <Button variant="outline" className="flex-1" asChild>
                  <Link href={`/dashboard/clients/${selectedAppointment.clientId}/overview`}>
                    View Client
                  </Link>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

"use client";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  ChevronRightIcon, VideoIcon, PhoneIcon,
  ClockIcon, BotIcon,
  SendIcon, FileTextIcon, ArrowUpRightIcon, CalendarIcon, MessageSquareIcon, MicIcon
} from "lucide-react";
import { ClientCard } from "@/components/ui/client-card";
import { ClientDetailDialog } from "@/components/client-detail-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { clients, actionItems, type Client, type InsightAction } from "@/lib/mock-data";
import { initialTodos, type TodoItem } from "@/lib/actions-mock-data";
import { MorningBriefing } from "@/components/insights";
import { morningBriefing, intelligenceBrief } from "@/lib/insights-mock-data";
import type { IntelligenceBriefItem } from "@/lib/mock-data";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";
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
  { name: "Priya Sharma", avatar: "/images/avatars/02.png", message: "Hi Antonio! I have my TikTok 1099 but I'm not sure how to upload it.", time: "2:30 PM", unreadCount: 2 },
  { name: "David Park", avatar: "/images/avatars/11.png", message: "Can we push the call to 3pm instead of 2?", time: "8:15 AM", unreadCount: 1 },
  { name: "Carlos & Elena Mendez", avatar: "/images/avatars/03.png", message: "Elena wants to know about the paint booth deduction.", time: "Yesterday", unreadCount: 3 },
];

// need_you: ERO sign(2: Rodriguez,Aisha) + new_intake(3: Vladimir,Ashley,Fatima) + ready_to_prep(2: Miguel,Anthony) = 7
// waiting: collecting_docs(4: Priya,DeShawn,Jasmine,Tyrone) + client_review(2: Roberto,MeiLin) = 6
// in_progress: in_preparation(4: Marcus,DuBois,David,Mendez) = 4
// complete: filed(3: Linda,Karen,Rachel) = 3
// Total: 7+6+4+3 = 20 active clients
const summaryTabs = [
  { key: "need_you", label: "Need You", count: 7, color: "bg-red-500", cssColor: "#ef4444", circleClass: "bg-red-500/12 border-red-400/30 text-red-600" },
  { key: "waiting", label: "Waiting", count: 6, color: "bg-amber-500", cssColor: "#f59e0b", circleClass: "bg-amber-500/12 border-amber-400/30 text-amber-600" },
  { key: "in_progress", label: "In Progress", count: 4, color: "bg-blue-500", cssColor: "#3b82f6", circleClass: "bg-blue-500/12 border-blue-400/30 text-blue-600" },
  { key: "complete", label: "Done", count: 3, color: "bg-emerald-500", cssColor: "#10b981", circleClass: "bg-emerald-500/12 border-emerald-400/30 text-emerald-600" },
  { key: "todos", label: "To-do", count: 0, color: "bg-violet-500", cssColor: "#8b5cf6", circleClass: "bg-violet-500/12 border-violet-400/30 text-violet-600" },
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
    { label: "Stuck - needs attention", clients: [
      { initials: "TD", name: "Thomas & Marie DuBois", detail: "Waiting 5 days for crypto docs - consider escalation", urgency: "amber" },
      { initials: "CM", name: "Carlos & Elena Mendez", detail: "Unresolved paint booth question - Elena awaiting reply", urgency: "amber" },
      { initials: "DP", name: "David Park", detail: "Call at 3pm today - still missing 2 docs", urgency: "amber" },
    ]},
    { label: "In preparation", clients: [
      { initials: "MC", name: "Marcus Chen", detail: "Schedule C · 3 restaurants · confirm closure before filing", urgency: "none" },
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

// ── Hand-drawn organic circle SVG ──
function OrganicCircle({ color, size = 32 }: { color: string; size?: number }) {
  // Hand-drawn wobbly circle path — intentionally imperfect
  const path = "M20.5,4 C28,3.5 35,8 36.5,16 C38,24 33,33 24,36 C15,39 6,34 4,25 C2,16 7,6 16,4.5 C18,4.2 19.5,4 20.5,4 Z";
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className="absolute inset-0">
      <path
        d={path}
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        strokeDasharray="120"
        strokeDashoffset="120"
        style={{ animation: "draw-circle 400ms ease-out forwards" }}
      />
      <style>{`@keyframes draw-circle { to { stroke-dashoffset: 0; } }`}</style>
    </svg>
  );
}

// ── Pipeline Strip with organic circles + animated underline ──
function PipelineStrip({ tabs, activeTab, pendingTodoCount, onTabChange }: {
  tabs: typeof summaryTabs;
  activeTab: string;
  pendingTodoCount: number;
  onTabChange: (key: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const [underline, setUnderline] = useState({ left: 0, width: 0, color: tabs[0].cssColor });
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const updateUnderline = useCallback((key: string) => {
    const label = labelRefs.current[key];
    const container = containerRef.current;
    if (!label || !container) return;
    const containerRect = container.getBoundingClientRect();
    const labelRect = label.getBoundingClientRect();
    const tab = tabs.find(t => t.key === key);
    setUnderline({
      left: labelRect.left - containerRect.left,
      width: labelRect.width,
      color: tab?.cssColor || tabs[0].cssColor,
    });
  }, [tabs]);

  useEffect(() => {
    const target = hoveredKey || activeTab;
    if (!mounted) {
      const timer = setTimeout(() => { updateUnderline(target); setMounted(true); }, 150);
      return () => clearTimeout(timer);
    }
    updateUnderline(target);
  }, [activeTab, hoveredKey, mounted, updateUnderline]);

  useEffect(() => {
    const onResize = () => updateUnderline(hoveredKey || activeTab);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [activeTab, hoveredKey, updateUnderline]);

  return (
    <div
      ref={containerRef}
      className="relative flex items-center gap-6"
      onMouseLeave={() => setHoveredKey(null)}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        const count = tab.key === "todos" ? pendingTodoCount : tab.count;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            onMouseEnter={() => setHoveredKey(tab.key)}
            className="flex items-center gap-2 cursor-pointer select-none pb-px"
          >
            {/* Number */}
            <span className={`text-[17px] font-semibold tabular-nums transition-colors duration-200 ${isActive ? "" : "text-muted-foreground/50"}`} style={{ color: isActive ? tab.cssColor : undefined }}>
              {count}
            </span>
            {/* Label */}
            <span
              ref={el => { labelRefs.current[tab.key] = el; }}
              className={`text-[15px] transition-colors duration-200 ${
                isActive ? "text-foreground font-medium" : "text-muted-foreground/60"
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}

      {/* Animated underline — lightsaber draw from left */}
      <div
        className="absolute bottom-0 h-[2px] rounded-full"
        style={{
          left: underline.left,
          width: underline.width,
          backgroundColor: underline.color,
          transform: mounted ? "scaleX(1)" : "scaleX(0)",
          transformOrigin: "left",
          transition: "left 300ms cubic-bezier(0.4, 0, 0.2, 1), width 300ms cubic-bezier(0.4, 0, 0.2, 1), background-color 300ms cubic-bezier(0.4, 0, 0.2, 1), transform 450ms cubic-bezier(0.0, 0, 0.2, 1)",
        }}
      />
    </div>
  );
}

export default function Page() {
  const [activeTab, setActiveTab] = useState("need_you");
  const [viewMode, setViewMode] = useState<"clients" | "actions">("actions");
  const [detailClient, setDetailClient] = useState<Client | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<typeof todayAppointments[0] | null>(null);
  const [todos, setTodos] = useState<TodoItem[]>(initialTodos);
  const [newTodoText, setNewTodoText] = useState("");
  const [sentDrafts, setSentDrafts] = useState<Set<string>>(new Set());
  const [editingDraft, setEditingDraft] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [openInsightId, setOpenInsightId] = useState<string | null>("brief-1");
  const [newTodoClient, setNewTodoClient] = useState<string>("");
  const [showClientPicker, setShowClientPicker] = useState(false);
  const { showToast } = useToast();
  let askDocket = (_q: string) => {};
  try { askDocket = useAIPanelAsk(); } catch {}

  const handleInsightAction = (action: InsightAction) => {
    showToast("success", `Action: ${action.label}`, `Executing ${action.action}...`);
  };

  const toggleTodo = (id: string) => setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const addTodo = () => {
    if (!newTodoText.trim()) return;
    const matchedClient = newTodoClient ? clients.find(c => c.id === newTodoClient) : null;
    setTodos(prev => [{
      id: `t-${Date.now()}`,
      text: newTodoText.trim(),
      done: false,
      source: "manual" as const,
      createdAt: new Date().toISOString(),
      ...(matchedClient && { clientId: matchedClient.id, clientName: matchedClient.fullName }),
    }, ...prev]);
    setNewTodoText("");
    setNewTodoClient("");
    setShowClientPicker(false);
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
    <div className="space-y-4">
      {/* ── Section 1: Morning Intelligence ── */}
      <motion.div
        className="rounded-[20px_20px_20px_6px] bg-card border border-border/40 px-7 py-6 shadow-sm"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {/* Timestamp */}
        <motion.p
          className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Saturday, March 28 · 7:42 AM
        </motion.p>

        {/* Greeting */}
        <motion.h1
          className="text-[28px] tracking-[-0.02em] font-display mt-3 text-foreground"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          Good morning, Antonio
        </motion.h1>

        {/* Stat row */}
        <motion.div
          className="flex items-baseline gap-7 mt-4 pb-5 border-b border-border/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <div><span className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground/60 block mb-1">Deadline</span><span className="text-[15px] font-semibold text-foreground">18 days</span></div>
          <div><span className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground/60 block mb-1">Filed</span><span className="text-[15px] font-semibold text-foreground">3 of 20</span></div>
          <div><span className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground/60 block mb-1">Collected</span><span className="text-[15px] font-semibold text-emerald-600">$2,850</span></div>
          <div><span className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground/60 block mb-1">Outstanding</span><span className="text-[15px] font-semibold text-foreground">$4,200</span></div>
          <div><span className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground/60 block mb-1">Overdue</span><span className="text-[15px] font-semibold text-red-500">1</span></div>
        </motion.div>

        {/* Editorial intro */}
        <motion.p
          className="text-[14.5px] text-muted-foreground/70 mt-5 mb-5 pb-5 border-b border-border/20 leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          Two returns are ready to file right now. Priya&apos;s 1099 doesn&apos;t match her intake. And the Rodriguez refund is going to be smaller than they expect.
        </motion.p>

        {/* Insight compartments — collapsible, expanded by default */}
        <div>
          {intelligenceBrief.map((item, index) => {
            const isOpen = openInsightId === item.id;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.08 }}
                className={`py-4 ${index < intelligenceBrief.length - 1 ? "border-b border-border/50" : ""}`}
              >
                {/* Title row — click to toggle (accordion) */}
                <button
                  onClick={() => setOpenInsightId(isOpen ? null : item.id)}
                  className="flex w-full items-center gap-2.5 text-left group/title rounded-lg px-3 py-2 -mx-3 transition-all duration-200 hover:bg-muted/40"
                >
                  {item.urgent && (
                    <span className="size-[7px] rounded-full bg-red-500 shrink-0" />
                  )}
                  <span className="flex-1 text-[17px] font-semibold text-foreground group-hover/title:text-foreground/70 transition-colors font-display">
                    {item.title}
                  </span>
                  <svg
                    width={10} height={10} viewBox="0 0 10 10"
                    className={`shrink-0 text-muted-foreground/30 transition-all duration-200 group-hover/title:text-muted-foreground/60 ${isOpen ? "rotate-90" : ""}`}
                  >
                    <path d="M3 1.5L7 5L3 8.5" stroke="currentColor" fill="none" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                </button>

                {/* Body — smooth expand/collapse */}
                <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                    className="overflow-hidden"
                  >
                  <div className="mt-3 pl-0">
                    <p className="text-[14px] leading-[1.8] text-foreground/75">
                      {item.content}
                    </p>

                    {/* Filing pace — line graph */}
                    {item.id === "brief-3" && (
                      <div className="mt-4 rounded-xl border border-border/30 bg-muted/20 p-5">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[11px] font-medium text-foreground/60">Filing pace</span>
                          <span className="text-[10px] text-muted-foreground">18 days to deadline</span>
                        </div>
                        <svg width="100%" height={220} viewBox="0 0 480 220" className="block">
                          {/* Grid lines */}
                          {[0, 1, 2, 3, 4].map(i => (
                            <line key={i} x1={45} y1={20 + i * 44} x2={465} y2={20 + i * 44} stroke="currentColor" strokeWidth="0.5" className="text-border/30" />
                          ))}
                          {/* Y-axis labels */}
                          {[20, 15, 10, 5, 0].map((v, i) => (
                            <text key={v} x={36} y={25 + i * 44} textAnchor="end" className="fill-muted-foreground/40" fontSize="11">{v}</text>
                          ))}
                          {/* X-axis labels */}
                          {["Jan", "Feb", "Mar", "Apr"].map((m, i) => (
                            <text key={m} x={45 + i * 140} y={210} textAnchor="start" className="fill-muted-foreground/40" fontSize="11">{m}</text>
                          ))}
                          {/* Last year line — full season */}
                          <polyline
                            points="45,196 115,172 185,148 255,124 325,100 395,56 465,20"
                            fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                            className="text-muted-foreground/20"
                          />
                          {/* This year line — partial */}
                          <polyline
                            points="45,196 115,185 185,176 255,170"
                            fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"
                          />
                          <circle cx={255} cy={170} r={4.5} fill="#ef4444" opacity="0.8" />
                          {/* Annotation */}
                          <text x={267} y={166} className="fill-red-500/70" fontSize="11" fontWeight="500">3 filed</text>
                          <text x={465} y={16} textAnchor="end" className="fill-muted-foreground/30" fontSize="11">18 filed</text>
                        </svg>
                        <div className="flex items-center gap-5 mt-2">
                          <div className="flex items-center gap-1.5">
                            <div className="w-4 h-[2px] bg-red-500/60 rounded" />
                            <span className="text-[10px] text-foreground/60">2026</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-4 h-[2px] bg-muted-foreground/20 rounded" />
                            <span className="text-[10px] text-muted-foreground/40">2025</span>
                          </div>
                          <span className="text-[10px] text-red-500/60 ml-auto">2 returns behind pace</span>
                        </div>
                      </div>
                    )}

                    {/* Rodriguez income — horizontal comparison */}
                    {item.id === "brief-4" && (
                      <div className="mt-4 rounded-xl border border-border/30 bg-muted/20 p-5">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[11px] font-medium text-foreground/60">Household income</span>
                          <span className="text-[10px] text-blue-500/70 font-medium">&rarr; 24% bracket + NIIT</span>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[11px] text-muted-foreground/60">2024</span>
                              <span className="text-[12px] font-medium text-muted-foreground/60 tabular-nums">$167K</span>
                            </div>
                            <div className="h-2.5 rounded-full bg-muted/50 overflow-hidden">
                              <div className="h-full rounded-full bg-blue-400/30" style={{ width: "59%" }} />
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[11px] text-foreground/70 font-medium">2025</span>
                              <span className="text-[12px] font-semibold text-blue-600 tabular-nums">$285K</span>
                            </div>
                            <div className="h-2.5 rounded-full bg-muted/50 overflow-hidden">
                              <div className="h-full rounded-full bg-blue-500/60" style={{ width: "100%" }} />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-[10px] text-blue-500/60">+$118K</span>
                          <span className="text-[10px] text-muted-foreground/40">&middot;</span>
                          <span className="text-[10px] text-muted-foreground/50">22% &rarr; 24% bracket</span>
                          <span className="text-[10px] text-muted-foreground/40">&middot;</span>
                          <span className="text-[10px] text-red-400/60">New: NIIT on rental</span>
                        </div>
                      </div>
                    )}

                    {/* Referral potential for Ashley */}
                    {item.id === "brief-5" && (
                      <div className="mt-4 rounded-xl border border-border/30 bg-muted/20 p-5">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[11px] font-medium text-foreground/60">Referral potential</span>
                          <span className="text-[10px] text-violet-500/70 font-medium">Creator niche</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <span className="text-[20px] font-semibold text-foreground tabular-nums">$350</span>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">Priya&apos;s fee</span>
                          </div>
                          <div>
                            <span className="text-[20px] font-semibold text-foreground/50 tabular-nums">$350</span>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">Ashley (if converts)</span>
                          </div>
                          <div>
                            <span className="text-[20px] font-semibold text-violet-500 tabular-nums">$5K+</span>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">Network (3-yr value)</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {item.implication && (
                      <p className="text-[12.5px] text-muted-foreground mt-3 leading-relaxed">
                        &rarr; {item.implication}
                      </p>
                    )}

                    {/* Reference + deep dive */}
                    <div className="flex items-center gap-3 mt-4">
                      {item.refs && item.refs.length > 0 && (
                        <span className="text-[11px] text-muted-foreground/50">
                          {item.refs.join(" · ")}
                        </span>
                      )}
                      {item.deepDiveQuery && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] gap-1.5"
                          onClick={(e) => { e.stopPropagation(); askDocket(item.deepDiveQuery!); }}
                        >
                          Ask Docket <ArrowUpRightIcon className="size-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  </motion.div>
                )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Footer */}
        <motion.div
          className="mt-4 pt-4 border-t border-border/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 1 }}
        >
          <p className="text-[10px] text-muted-foreground/40">
            20 clients · 142 documents · 34 messages · 3 prior-year returns
          </p>
        </motion.div>
      </motion.div>

      {/* ── Section 2: Actions + Sidebar ── */}
      <div className="flex gap-6 mt-10">
      {/* Left: Pipeline + Action Feed (70%) */}
      <div className="flex-[7] min-w-0 space-y-5">
        {/* Pipeline — organic circles with animated underline */}
        <PipelineStrip
          tabs={summaryTabs}
          activeTab={activeTab}
          pendingTodoCount={pendingTodoCount}
          onTabChange={setActiveTab}
        />

        {/* Section heading — editorial, not dashboard */}
        <h3 className="text-[19px] font-medium text-foreground tracking-tight font-display">
          {summaryTabs.find(t => t.key === activeTab)?.label}
        </h3>

        {/* Content */}
        <div>
          {activeTab === "todos" ? (
            /* ── To-do — journal style ── */
            <div className="space-y-0">
              {/* Add task — at the top */}
              <div className="py-[10px]">
                <div className="flex items-start gap-3">
                  <div className="mt-[3px] shrink-0">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" className="text-muted-foreground/20" strokeDasharray="2 2" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <input
                      placeholder="Add a task..."
                      value={newTodoText}
                      onChange={e => { setNewTodoText(e.target.value); if (e.target.value.trim() && !showClientPicker) setShowClientPicker(true); }}
                      onKeyDown={e => e.key === "Enter" && addTodo()}
                      onFocus={() => { if (newTodoText.trim()) setShowClientPicker(true); }}
                      className="w-full text-[14px] text-foreground/85 bg-transparent outline-none placeholder:text-muted-foreground/30 border-b border-transparent focus:border-border/40 transition-colors pb-0.5"
                    />
                    {showClientPicker && newTodoText.trim() && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-2 flex items-center gap-2"
                      >
                        <span className="text-[11px] text-muted-foreground/50">for</span>
                        <select
                          value={newTodoClient}
                          onChange={e => setNewTodoClient(e.target.value)}
                          className="text-[12px] text-muted-foreground bg-transparent border-b border-border/30 outline-none py-0.5 pr-4 cursor-pointer"
                        >
                          <option value="">no client</option>
                          {clients.filter(c => c.clientStatus !== "declined").map(c => (
                            <option key={c.id} value={c.id}>{c.fullName}</option>
                          ))}
                        </select>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>

              {/* Pending items */}
              {todos.filter(t => !t.done).map(todo => {
                const sourceLabel = todo.source === "ai" ? "flagged by Docket" : null;
                const nameInText = todo.clientName && todo.text.toLowerCase().includes(todo.clientName.split(" ")[0].toLowerCase());
                return (
                  <motion.div
                    key={todo.id}
                    layout
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-start gap-3 py-[10px] group"
                  >
                    {/* Open circle — animated fill on click */}
                    <button
                      onClick={() => toggleTodo(todo.id)}
                      className="mt-[3px] shrink-0 cursor-pointer"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" className="text-muted-foreground/40 transition-colors duration-200 group-hover:text-muted-foreground" />
                      </svg>
                    </button>
                    <div className="min-w-0 flex-1">
                      <span className="text-[14px] leading-relaxed text-foreground/85">{todo.text}</span>
                      {(sourceLabel || (todo.clientName && !nameInText)) && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {todo.clientName && !nameInText && (
                            <button
                              onClick={() => { const c = clients.find(cl => cl.id === todo.clientId); if (c) setDetailClient(c); }}
                              className="text-[11px] text-muted-foreground/50 hover:text-foreground transition-colors"
                            >
                              {todo.clientName}
                            </button>
                          )}
                          {sourceLabel && (todo.clientName && !nameInText) && <span className="text-muted-foreground/30 text-[10px]">&middot;</span>}
                          {sourceLabel && <span className="text-[11px] text-muted-foreground/40">{sourceLabel}</span>}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {/* Completed — open by default */}
              {todos.filter(t => t.done).length > 0 && (
                <div className="pt-4">
                  <button
                    onClick={() => setShowCompleted(!showCompleted)}
                    className="text-[12px] text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                  >
                    Completed ({todos.filter(t => t.done).length}) {showCompleted ? "" : ""}
                  </button>
                  {showCompleted && (
                    <div className="mt-2 space-y-0">
                      {todos.filter(t => t.done).map(todo => (
                        <motion.div
                          key={todo.id}
                          layout
                          className="flex items-start gap-3 py-[8px] group cursor-pointer"
                          onClick={() => toggleTodo(todo.id)}
                        >
                          <div className="mt-[3px] shrink-0">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <circle cx="7" cy="7" r="5.5" fill="currentColor" className="text-muted-foreground/25 transition-colors duration-200 group-hover:text-muted-foreground/40" />
                            </svg>
                          </div>
                          <span className="text-[14px] leading-relaxed text-muted-foreground/40 line-through">{todo.text}</span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {(actionGroups[activeTab] || []).map((group) => (
                <div key={group.label}>
                  <div className="px-1 pt-2 pb-2.5">
                    <span className="text-[12px] text-muted-foreground/60">{group.label}</span>
                  </div>
                  <div className="space-y-2">
                  {group.clients.map((actionClient, ci) => {
                    const matchedAction = actionItems.find(a =>
                      !a.isResolved && a.clientName.includes(actionClient.name.split(" ")[0])
                    );
                    const matchedClientForAvatar = clients.find(c =>
                      c.fullName.includes(actionClient.name.split(" ")[0]) ||
                      actionClient.initials === c.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
                    );
                    const accentBg = actionClient.urgency === "red" ? "bg-red-300/60" : actionClient.urgency === "amber" ? "bg-amber-300/60" : actionClient.urgency === "green" ? "bg-emerald-300/60" : "";
                    return (
                      <div key={`${group.label}-${ci}`} className="relative rounded-xl border border-border/40 p-4 transition-all duration-200 hover:bg-muted/40 hover:border-border/70 hover:shadow-sm">
                        {accentBg && <div className={`absolute left-0 top-3 bottom-3 w-[2.5px] rounded-full ${accentBg}`} />}
                        <button onClick={() => matchedClientForAvatar && setDetailClient(matchedClientForAvatar)} className="flex w-full items-center gap-3 text-left">
                          <Avatar className="size-9 shrink-0">
                            {matchedClientForAvatar && <AvatarImage src={matchedClientForAvatar.avatar} alt={actionClient.name} />}
                            <AvatarFallback className="text-[10px]">{actionClient.initials}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="text-[15px] font-medium leading-tight font-display">{actionClient.name}</div>
                            <div className="text-muted-foreground text-[12.5px] mt-0.5">{actionClient.detail}</div>
                          </div>
                        </button>
                        {matchedAction?.aiDraft && (
                          <div className="mt-3 ml-11">
                            {sentDrafts.has(matchedAction.id) ? (
                              <motion.div
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="flex items-center gap-2 text-xs font-medium text-emerald-600"
                              >
                                <motion.svg
                                  width="12" height="12" viewBox="0 0 14 14" fill="none"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: "spring", stiffness: 500, damping: 20, delay: 0.1 }}
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
                                  <p className="text-[12.5px] leading-[1.7] text-muted-foreground">{matchedAction.aiDraft}</p>
                                )}
                                <div className="mt-2.5 flex gap-2">
                                  <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => { setSentDrafts(p => new Set([...p, matchedAction.id])); setEditingDraft(null); showToast("sent", `Message sent to ${actionClient.name.split(" ")[0]}`, "Delivered via portal and email"); }}>
                                    <SendIcon className="size-3" /> {editingDraft === matchedAction.id ? "Send edited" : "Send as Antonio"}
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-7 text-[11px] text-muted-foreground" onClick={() => setEditingDraft(editingDraft === matchedAction.id ? null : matchedAction.id)}>
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Today + Messages (30%) */}
      <div className="flex-[3] flex flex-col gap-5 min-w-0 pt-1 border-l border-border/30 pl-6">
        {/* Today */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-medium text-foreground">Today</span>
            <Link href="/dashboard/apps/calendar" className="text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors">
              Calendar &rarr;
            </Link>
          </div>
          <div className="space-y-2">
            {todayAppointments.map((apt) => (
              <button
                key={apt.name}
                onClick={() => setSelectedAppointment(apt)}
                className="flex w-full items-center gap-3 rounded-xl border border-border/40 p-3 text-left transition-all duration-200 hover:bg-muted/40 hover:border-border/70 hover:shadow-sm"
              >
                <Avatar className="size-7 shrink-0">
                  <AvatarImage src={apt.avatar} alt={apt.name} />
                  <AvatarFallback className="text-[9px]">{apt.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] font-medium leading-tight">{apt.name}</div>
                  <div className="text-muted-foreground flex items-center gap-1 text-[11px] mt-0.5">
                    {apt.type === "video" ? <VideoIcon className="size-2.5" /> : <PhoneIcon className="size-2.5" />}
                    {apt.time}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="border-t border-border/30 pt-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium text-foreground">Messages</span>
              <span className="flex size-[16px] items-center justify-center rounded-full bg-emerald-600 text-[8px] font-bold leading-none text-white">3</span>
            </div>
            <Link href="/dashboard/apps/chat" className="text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors">
              View all &rarr;
            </Link>
          </div>
          <div className="space-y-1">
            {messages.map((msg, i) => (
              <Link
                key={i}
                href="/dashboard/apps/chat"
                className="flex items-center gap-3 rounded-lg p-2 transition-all duration-200 hover:bg-muted/40 hover:shadow-sm"
              >
                <Avatar className="size-7 shrink-0">
                  <AvatarImage src={msg.avatar} alt={msg.name} />
                  <AvatarFallback className="text-[9px]">{msg.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[12.5px] font-medium leading-tight">{msg.name}</span>
                    <span className="text-muted-foreground/50 shrink-0 text-[10px]">{msg.time}</span>
                  </div>
                  <p className="truncate text-[11px] text-muted-foreground mt-0.5">{msg.message}</p>
                </div>
                {msg.unreadCount > 0 && (
                  <span className="flex size-[16px] shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[8px] font-bold leading-none text-white">
                    {msg.unreadCount}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
      </div>

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

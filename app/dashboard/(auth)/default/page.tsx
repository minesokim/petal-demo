"use client";

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  UsersIcon, FileTextIcon, AlertTriangleIcon, DollarSignIcon,
  TrendingUpIcon, ChevronRightIcon, VideoIcon, PhoneIcon,
  MapPinIcon, ClockIcon, SparklesIcon, ZapIcon,
  SendIcon, CircleCheckIcon, ArrowUpRightIcon, CalendarIcon, MessageSquareIcon, MicIcon
} from "lucide-react";
import { Area, AreaChart, Bar, BarChart, Pie, PieChart, Cell } from "recharts";
import {
  ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent
} from "@/components/ui/chart";
import { CategoryBarChart } from "@/components/ui/category-bar-chart";
import { ClientCard } from "@/components/ui/client-card";
import { ClientDetailDialog } from "@/components/client-detail-dialog";
import { DonutChart, type DonutChartSegment } from "@/components/ui/donut-chart";
import { clients, actionItems, type Client } from "@/lib/mock-data";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { IntelligencePanel } from "@/components/actions/intelligence/intelligence-panel";
import { BatchPanel } from "@/components/actions/batch/batch-panel";
import { VoiceDumpDialog } from "@/components/actions/voice/voice-dump-dialog";

const docStatusData: DonutChartSegment[] = [
  { value: 142, color: "hsl(142.1 76.2% 36.3%)", label: "Received" },
  { value: 34, color: "hsl(0 84.2% 60.2%)", label: "Missing" },
  { value: 18, color: "hsl(47.9 95.8% 53.1%)", label: "Pending" },
  { value: 8, color: "hsl(214.7 95% 50%)", label: "Processing" },
];
const docTotal = docStatusData.reduce((s, d) => s + d.value, 0);

function DocumentStatusDonut() {
  const [hovered, setHovered] = useState<string | null>(null);
  const active = docStatusData.find((d) => d.label === hovered);
  const displayValue = active?.value ?? docTotal;
  const displayLabel = active?.label ?? "Total Documents";

  return (
    <div className="flex flex-col items-center space-y-4">
      <DonutChart
        data={docStatusData}
        size={180}
        strokeWidth={24}
        animationDuration={1.2}
        animationDelayPerSegment={0.05}
        highlightOnHover
        onSegmentHover={(seg) => setHovered(seg?.label ?? null)}
        centerContent={
          <AnimatePresence mode="wait">
            <motion.div
              key={displayLabel}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2, ease: "circOut" }}
              className="flex flex-col items-center justify-center text-center"
            >
              <p className="text-muted-foreground max-w-[100px] truncate text-xs font-medium">
                {displayLabel}
              </p>
              <p className="font-display text-3xl tracking-tight tabular-nums text-foreground">
                {displayValue}
              </p>
              {active && (
                <p className="text-muted-foreground text-sm font-medium">
                  {((active.value / docTotal) * 100).toFixed(0)}%
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        }
      />
      <div className="flex w-full flex-col space-y-1.5">
        {docStatusData.map((segment) => (
          <div
            key={segment.label}
            className={`flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 transition-all duration-200 ${
              hovered === segment.label ? "bg-muted" : ""
            }`}
            onMouseEnter={() => setHovered(segment.label)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
              <span className="text-foreground text-sm font-medium">{segment.label}</span>
            </div>
            <span className="text-muted-foreground text-sm font-semibold tabular-nums">{segment.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const revenueData = [
  { month: "Jan", revenue: 3200 },
  { month: "Feb", revenue: 8500 },
  { month: "Mar", revenue: 18700 },
  { month: "Apr", revenue: 28400 },
  { month: "May", revenue: 4200 },
  { month: "Jun", revenue: 2100 },
  { month: "Jul", revenue: 1800 },
  { month: "Aug", revenue: 1500 },
  { month: "Sep", revenue: 3800 },
  { month: "Oct", revenue: 6200 },
  { month: "Nov", revenue: 2400 },
  { month: "Dec", revenue: 1900 },
];

const revenueConfig = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
} satisfies ChartConfig;

const pipelineData = [
  { name: "New Intake", count: 3, fill: "hsl(0 84.2% 60.2%)" },
  { name: "Collecting Docs", count: 4, fill: "hsl(47.9 95.8% 48%)" },
  { name: "Ready to Prep", count: 2, fill: "hsl(214.7 95% 58%)" },
  { name: "In Preparation", count: 4, fill: "hsl(214.7 95% 50%)" },
  { name: "Client Review", count: 2, fill: "hsl(214.7 95% 44%)" },
  { name: "Pay & Sign", count: 2, fill: "hsl(142.1 76.2% 42%)" },
  { name: "Filed", count: 3, fill: "hsl(142.1 76.2% 36.3%)" },
];

const pipelineConfig = {
  count: { label: "Clients" },
} satisfies ChartConfig;

const todayAppointments = [
  { name: "David Park", avatar: "/images/avatars/11.png", time: "2:00 - 3:00 PM", type: "video" as const, note: "S-Corp return review" },
  { name: "Miguel Sandoval", avatar: "/images/avatars/09.png", time: "4:00 - 4:30 PM", type: "phone" as const, note: "Discuss incorporation" },
];

const urgentActions = [
  { name: "DeShawn Williams", issue: "Missing W-2 and deposit", priority: "urgent", hasAiDraft: true },
  { name: "Tyrone Mitchell", issue: "Stale - 9 days since last activity", priority: "urgent", hasAiDraft: true },
  { name: "Vladimir Petrov", issue: "No documents - likely needs extension", priority: "high", hasAiDraft: true },
  { name: "James & Sofia Rodriguez", issue: "Return ready - awaiting 8879 signature", priority: "high", hasAiDraft: false },
];

// need_you: new_intake(3:Vladimir,Ashley,Fatima) + ready_to_prep(2:Miguel,Anthony) + pay_and_sign ERO pending = 5
// waiting: collecting_docs(4:Priya,DeShawn,Jasmine,Tyrone) + client_review(2:Roberto,MeiLin) = 6
// in_progress: in_preparation(4:Marcus,DuBois,David,Mendez) = 4
// complete: pay_and_sign(2:Rodriguez,Aisha) + filed(3:Linda,Karen,Rachel) = 5
// Total: 5+6+4+5 = 20
const summaryTabs = [
  { key: "need_you", label: "Need you", count: 6 },
  { key: "waiting", label: "Waiting", count: 6 },
  { key: "in_progress", label: "In progress", count: 4 },
  { key: "complete", label: "Complete", count: 5 },
];

type ActionClient = {
  initials: string;
  name: string;
  detail: string;
  urgency: "red" | "amber" | "green" | "none";
};

// New bucket mapping based on 7-stage workflow
const actionGroups: Record<string, { label: string; clients: ActionClient[] }[]> = {
  need_you: [
    // new_intake (3) + ready_to_prep (2) = 5 clients Antonio needs to act on
    { label: "New intakes", clients: [
      { initials: "VP", name: "Vladimir Petrov", detail: "0 of 16 docs \u00b7 never logged in", urgency: "red" },
      { initials: "AK", name: "Ashley Kim", detail: "Intake sent \u00b7 2 days ago", urgency: "none" },
      { initials: "FA", name: "Fatima Al-Hassan", detail: "Intake sent \u00b7 yesterday", urgency: "none" },
    ]},
    { label: "Ready to prep", clients: [
      { initials: "MS", name: "Miguel Sandoval", detail: "9 of 9 docs \u00b7 ready for prep", urgency: "none" },
      { initials: "AR", name: "Anthony Russo", detail: "9 of 9 docs \u00b7 cap gains calc needed", urgency: "none" },
    ]},
    { label: "ERO signature needed", clients: [
      { initials: "AJ", name: "Aisha Johnson", detail: "Client paid + signed \u00b7 your countersignature needed", urgency: "amber" },
    ]},
  ],
  waiting: [
    // collecting_docs (4) + client_review (2) = 6 clients Antonio is waiting on
    { label: "Collecting documents", clients: [
      { initials: "PS", name: "Priya Sharma", detail: "3 of 7 docs \u00b7 missing 1099s", urgency: "amber" },
      { initials: "DW", name: "DeShawn Williams", detail: "1 of 6 docs \u00b7 deposit unpaid", urgency: "red" },
      { initials: "JT", name: "Jasmine Torres", detail: "4 of 8 docs \u00b7 freelance 1099s", urgency: "amber" },
      { initials: "TM", name: "Tyrone Mitchell", detail: "2 of 5 docs \u00b7 9 days stale", urgency: "red" },
    ]},
    { label: "Client reviewing return", clients: [
      { initials: "RF", name: "Roberto Fuentes", detail: "1120S \u00b7 sent for client review", urgency: "none" },
      { initials: "MW", name: "Mei-Lin Wu", detail: "Schedule C \u00b7 sent for client review", urgency: "none" },
    ]},
  ],
  in_progress: [
    // in_preparation (4) = 4 clients Antonio is actively working on
    { label: "In preparation", clients: [
      { initials: "MC", name: "Marcus Chen", detail: "Schedule C \u00b7 3 locations", urgency: "none" },
      { initials: "TD", name: "Thomas & Marie DuBois", detail: "1040 + crypto \u00b7 11 of 14 docs", urgency: "amber" },
      { initials: "DP", name: "David Park", detail: "1120S \u00b7 18 of 20 docs", urgency: "none" },
      { initials: "CM", name: "Carlos & Elena Mendez", detail: "1065 partnership \u00b7 13 of 14 docs", urgency: "none" },
    ]},
  ],
  complete: [
    // pay_and_sign (2) + filed (3) = 5 clients done or nearly done
    { label: "Pay & sign", clients: [
      { initials: "JR", name: "James & Sofia Rodriguez", detail: "8879 \u00b7 awaiting payment + signature", urgency: "amber" },
      { initials: "AJ", name: "Aisha Johnson", detail: "8879 \u00b7 awaiting payment + signature", urgency: "amber" },
    ]},
    { label: "Filed & accepted", clients: [
      { initials: "LN", name: "Linda Nakamura", detail: "1040 \u00b7 filed Mar 15", urgency: "green" },
      { initials: "KO", name: "Karen O'Brien", detail: "1040 \u00b7 filed Mar 10", urgency: "green" },
      { initials: "RG", name: "Rachel Goldstein", detail: "1040 MFJ \u00b7 filed Mar 12", urgency: "green" },
    ]},
  ],
};

const initialTodos = [
  { id: 1, text: "Review Roberto Fuentes 1120S return", done: false },
  { id: 2, text: "Call David Park at 2:00 PM", done: false },
  { id: 3, text: "Send Priya missing docs reminder", done: false },
  { id: 4, text: "Review Mei-Lin Wu Schedule C", done: false },
  { id: 5, text: "Follow up with Vladimir about extension", done: false },
  { id: 6, text: "Process Rodriguez 8879 e-signature", done: true },
  { id: 7, text: "Send Ashley Kim intake reminder", done: true },
];

export default function Page() {
  const [todos, setTodos] = useState(initialTodos);
  const [activeTab, setActiveTab] = useState("need_you");
  const [viewMode, setViewMode] = useState<"clients" | "actions" | "intelligence" | "batch">("clients");
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [detailClient, setDetailClient] = useState<Client | null>(null);

  const toggleTodo = (id: number) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Good morning, Antonio</h1>
        <p className="text-muted-foreground text-sm">
          You have 4 urgent items and 2 appointments today. 18 days until the filing deadline.
        </p>
      </div>

      {/* Actionable KPI Cards */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="py-4">
            <div className="text-primary-foreground/70 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider">
              <ClockIcon className="size-3" /> Filing Deadline
            </div>
            <div className="font-display mt-1 text-2xl tracking-tight tabular-nums">18 days</div>
            <div className="text-primary-foreground/60 text-xs">3 of 20 filed</div>
            <div className="bg-primary-foreground/20 mt-2 h-1 overflow-hidden rounded-full">
              <div className="bg-primary-foreground/70 h-full rounded-full" style={{ width: "44%" }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="font-display text-2xl tracking-tight tabular-nums">4 unread</div>
            <div className="text-muted-foreground text-xs">messages waiting</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="font-display text-2xl tracking-tight tabular-nums">2 calls</div>
            <div className="text-muted-foreground text-xs">scheduled today</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="font-display text-2xl tracking-tight tabular-nums">$1,650</div>
            <div className="text-muted-foreground text-xs">outstanding</div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline + Summary + Clients — single card */}
      <Card className="overflow-hidden">
        {/* Pipeline bar chart section */}
        <CategoryBarChart className="border-0 shadow-none rounded-none" />

        <Separator />

        {/* Summary stat tabs */}
        <div className="grid grid-cols-4">
          {summaryTabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const hue =
              tab.key === "need_you" ? { bg: "bg-red-50/30 dark:bg-red-950/10", border: "border-b-red-300", text: "text-foreground" } :
              tab.key === "waiting" ? { bg: "bg-amber-50/30 dark:bg-amber-950/10", border: "border-b-amber-300", text: "text-foreground" } :
              tab.key === "in_progress" ? { bg: "bg-blue-50/30 dark:bg-blue-950/10", border: "border-b-blue-300", text: "text-foreground" } :
              { bg: "bg-emerald-50/30 dark:bg-emerald-950/10", border: "border-b-emerald-300", text: "text-foreground" };
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex flex-col items-center gap-0.5 py-3 transition-all ${
                  isActive ? `border-b-2 ${hue.border} ${hue.bg}` : "hover:bg-muted/50"
                }`}
              >
                <span className={`text-sm font-semibold ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                  {tab.label}
                </span>
                <span className={`font-display text-lg tracking-tight tabular-nums ${isActive ? hue.text : "text-muted-foreground"}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Section header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h3 className="text-sm font-semibold">{summaryTabs.find(t => t.key === activeTab)?.label}</h3>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border">
              {(["clients", "actions", "intelligence", "batch"] as const).map((mode, i, arr) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-2.5 py-1 text-[11px] font-medium transition-colors ${viewMode === mode ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"} ${i === 0 ? "rounded-l-md" : ""} ${i === arr.length - 1 ? "rounded-r-md" : ""}`}
                >
                  {mode === "clients" ? "Clients" : mode === "actions" ? "Actions" : mode === "intelligence" ? "AI" : "Batch"}
                </button>
              ))}
            </div>
            <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setVoiceOpen(true)}>
              <MicIcon className="size-3" /> Voice
            </Button>
          </div>
        </div>

        {/* Content based on view mode */}
        <CardContent className="pb-4">
          {viewMode === "actions" ? (
            /* Actions view - action-first, client as secondary context */
            <div className="mt-3 space-y-2">
              {(actionGroups[activeTab] || []).flatMap((group) =>
                group.clients.map((actionClient, ci) => {
                  const matchedAction = actionItems.find(a =>
                    !a.isResolved && a.clientName.includes(actionClient.name.split(" ")[0])
                  );
                  const matchedClientForAvatar = clients.find(c =>
                    c.fullName.includes(actionClient.name.split(" ")[0]) ||
                    actionClient.initials === c.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
                  );
                  return (
                    <div key={`${group.label}-${ci}`} className="rounded-xl border p-4">
                      <Link href={matchedClientForAvatar ? `/dashboard/clients/${matchedClientForAvatar.id}/overview` : "#"} className="flex items-start gap-3 transition-colors hover:opacity-80">
                        <Avatar className="size-8 shrink-0">
                          {matchedClientForAvatar && <AvatarImage src={matchedClientForAvatar.avatar} alt={actionClient.name} />}
                          <AvatarFallback className="text-[10px]">{actionClient.initials}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold">{group.label}</div>
                          <div className="text-muted-foreground text-xs">{actionClient.name} &middot; {actionClient.detail}</div>
                        </div>
                        {actionClient.urgency !== "none" && (
                          <span className={`mt-1 size-2 shrink-0 rounded-full ${
                            actionClient.urgency === "red" ? "bg-red-500" :
                            actionClient.urgency === "amber" ? "bg-amber-500" :
                            "bg-emerald-500"
                          }`} />
                        )}
                      </Link>
                      {matchedAction?.aiDraft && (
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{matchedAction.aiDraft}</p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {matchedAction?.aiDraft && (
                          <Button size="sm" className="h-7 text-xs">
                            <SendIcon className="size-3" /> Send as Antonio
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="h-7 text-xs">
                          <FileTextIcon className="size-3" /> Edit
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* Clients view - flat list with urgency color tinting */
            <div className="mt-3 grid gap-2 md:grid-cols-2 lg:grid-cols-3">
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
                    c.fullName.includes(actionClient.name.split(" ")[0]) ||
                    actionClient.initials === c.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
                  );
                  return (
                    <div key={ci} className={`flex items-center gap-3 rounded-xl border p-3 ${urgencyBg}`}>
                      <Avatar className="size-9 shrink-0">
                        {fallbackClient && <AvatarImage src={fallbackClient.avatar} alt={actionClient.name} />}
                        <AvatarFallback className="text-xs">{actionClient.initials}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold">{actionClient.name}</div>
                        <div className="text-muted-foreground text-xs">{actionClient.detail}</div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
          {viewMode === "intelligence" && (
            <div className="mt-3">
              <IntelligencePanel />
            </div>
          )}
          {viewMode === "batch" && (
            <div className="mt-3">
              <BatchPanel />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Voice Dump Dialog */}
      <VoiceDumpDialog open={voiceOpen} onOpenChange={setVoiceOpen} />

      {/* Main Grid */}
      <div className="grid gap-4 xl:grid-cols-3">
        {/* Messages */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquareIcon className="size-4" />
              Messages
            </CardTitle>
            <CardAction>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/apps/chat">
                  View all <ChevronRightIcon className="size-3.5" />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-1">
            {[
              { name: "Priya Sharma", avatar: "/images/avatars/02.png", message: "Hi Antonio! I have my TikTok 1099 but I'm not sure how to upload it.", time: "2:30 PM", unread: true },
              { name: "David Park", avatar: "/images/avatars/11.png", message: "Can we push the call to 3pm instead of 2?", time: "8:15 AM", unread: true },
              { name: "Carlos & Elena Mendez", avatar: "/images/avatars/03.png", message: "Elena wants to know about the paint booth deduction.", time: "Yesterday", unread: true },
            ].map((msg, i) => (
              <Link
                key={i}
                href="/dashboard/apps/chat"
                className={`flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-muted/50 ${msg.unread ? "" : "opacity-60"}`}
              >
                <Avatar className="size-9 shrink-0">
                  <AvatarImage src={msg.avatar} alt={msg.name} />
                  <AvatarFallback className="text-xs">{msg.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${msg.unread ? "font-semibold" : "font-medium"}`}>{msg.name}</span>
                    <span className="text-muted-foreground shrink-0 text-xs">{msg.time}</span>
                  </div>
                  <p className={`truncate text-xs ${msg.unread ? "text-foreground" : "text-muted-foreground"}`}>{msg.message}</p>
                </div>
                {msg.unread && <span className="mt-2 size-2 shrink-0 rounded-full bg-blue-500" />}
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="size-4" />
              Today
            </CardTitle>
            <CardAction>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/apps/calendar">
                  View all <ChevronRightIcon className="size-3.5" />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayAppointments.map((apt) => (
              <div key={apt.name} className="bg-muted/50 flex items-start gap-3 rounded-xl p-3">
                <Avatar className="size-9 shrink-0">
                  <AvatarImage src={apt.avatar} alt={apt.name} />
                  <AvatarFallback className="text-[10px]">{apt.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{apt.name}</div>
                  <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                    {apt.type === "video" ? <VideoIcon className="size-3" /> : <PhoneIcon className="size-3" />}
                    {apt.time}
                  </div>
                  <div className="text-muted-foreground mt-0.5 text-xs">{apt.note}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* To-Do */}
      <div className="grid gap-4 xl:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>To-do</CardTitle>
            <CardAction>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/actions">
                  View all <ChevronRightIcon className="size-3.5" />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-1">
            {todos.filter(t => !t.done).slice(0, 3).map((todo) => (
              <label
                key={todo.id}
                className="hover:bg-muted/50 flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 transition-colors"
              >
                <Checkbox
                  checked={todo.done}
                  onCheckedChange={() => toggleTodo(todo.id)}
                  className="mt-0.5"
                />
                <span className={`text-sm leading-snug ${todo.done ? "text-muted-foreground line-through" : ""}`}>
                  {todo.text}
                </span>
              </label>
            ))}
          </CardContent>
        </Card>

      </div>

      <ClientDetailDialog
        client={detailClient}
        open={!!detailClient}
        onOpenChange={(open) => !open && setDetailClient(null)}
      />
    </div>
  );
}

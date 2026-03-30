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
import { motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { IntelligencePanel } from "@/components/actions/intelligence/intelligence-panel";
import { BatchPanel } from "@/components/actions/batch/batch-panel";
import { VoiceDumpDialog } from "@/components/actions/voice/voice-dump-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Pipeline stages for inline strip
const pipelineStages = [
  { label: "Intake", count: 3, color: "hsl(0 84.2% 60.2%)", width: 15 },
  { label: "Docs", count: 4, color: "hsl(47.9 95.8% 48%)", width: 20 },
  { label: "Prep Ready", count: 2, color: "hsl(214.7 95% 58%)", width: 10 },
  { label: "In Prep", count: 4, color: "hsl(214.7 95% 50%)", width: 20 },
  { label: "Review", count: 2, color: "hsl(214.7 95% 44%)", width: 10 },
  { label: "Pay & Sign", count: 2, color: "hsl(142.1 76.2% 42%)", width: 10 },
  { label: "Filed", count: 3, color: "hsl(142.1 76.2% 36.3%)", width: 15 },
];

const todayAppointments = [
  { name: "David Park", avatar: "/images/avatars/11.png", time: "3:00 - 4:00 PM", type: "video" as const, note: "S-Corp return review", clientId: "c11" },
  { name: "Miguel Sandoval", avatar: "/images/avatars/09.png", time: "4:00 - 4:30 PM", type: "phone" as const, note: "Discuss incorporation", clientId: "c9" },
];

const messages = [
  { name: "Priya Sharma", avatar: "/images/avatars/02.png", message: "Hi Antonio! I have my TikTok 1099 but I'm not sure how to upload it.", time: "2:30 PM", unread: true },
  { name: "David Park", avatar: "/images/avatars/11.png", message: "Can we push the call to 3pm instead of 2?", time: "8:15 AM", unread: true },
  { name: "Carlos & Elena Mendez", avatar: "/images/avatars/03.png", message: "Elena wants to know about the paint booth deduction.", time: "Yesterday", unread: true },
];

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

const actionGroups: Record<string, { label: string; clients: ActionClient[] }[]> = {
  need_you: [
    { label: "ERO signature needed", clients: [
      { initials: "AJ", name: "Aisha Johnson", detail: "Client paid + signed · your countersignature needed", urgency: "amber" },
    ]},
    { label: "New intakes", clients: [
      { initials: "VP", name: "Vladimir Petrov", detail: "0 of 16 docs · never logged in", urgency: "red" },
      { initials: "AK", name: "Ashley Kim", detail: "Intake sent · 2 days ago", urgency: "none" },
      { initials: "FA", name: "Fatima Al-Hassan", detail: "Intake sent · yesterday", urgency: "none" },
    ]},
    { label: "Ready to prep", clients: [
      { initials: "MS", name: "Miguel Sandoval", detail: "9 of 9 docs · ready for prep", urgency: "none" },
      { initials: "AR", name: "Anthony Russo", detail: "9 of 9 docs · cap gains calc needed", urgency: "none" },
    ]},
  ],
  waiting: [
    { label: "Collecting documents", clients: [
      { initials: "PS", name: "Priya Sharma", detail: "3 of 7 docs · missing 1099s", urgency: "amber" },
      { initials: "DW", name: "DeShawn Williams", detail: "1 of 6 docs · deposit unpaid", urgency: "red" },
      { initials: "JT", name: "Jasmine Torres", detail: "4 of 8 docs · freelance 1099s", urgency: "amber" },
      { initials: "TM", name: "Tyrone Mitchell", detail: "2 of 5 docs · 9 days stale", urgency: "red" },
    ]},
    { label: "Client reviewing return", clients: [
      { initials: "RF", name: "Roberto Fuentes", detail: "1120S · sent for client review", urgency: "none" },
      { initials: "MW", name: "Mei-Lin Wu", detail: "Schedule C · sent for client review", urgency: "none" },
    ]},
  ],
  in_progress: [
    { label: "In preparation", clients: [
      { initials: "MC", name: "Marcus Chen", detail: "Schedule C · 3 locations", urgency: "none" },
      { initials: "TD", name: "Thomas & Marie DuBois", detail: "1040 + crypto · 11 of 14 docs", urgency: "amber" },
      { initials: "DP", name: "David Park", detail: "1120S · 18 of 20 docs", urgency: "none" },
      { initials: "CM", name: "Carlos & Elena Mendez", detail: "1065 partnership · 13 of 14 docs", urgency: "none" },
    ]},
  ],
  complete: [
    { label: "Pay & sign", clients: [
      { initials: "JR", name: "James & Sofia Rodriguez", detail: "8879 · awaiting payment + signature", urgency: "amber" },
      { initials: "AJ", name: "Aisha Johnson", detail: "8879 · awaiting payment + signature", urgency: "amber" },
    ]},
    { label: "Filed & accepted", clients: [
      { initials: "LN", name: "Linda Nakamura", detail: "1040 · filed Mar 15", urgency: "green" },
      { initials: "KO", name: "Karen O'Brien", detail: "1040 · filed Mar 10", urgency: "green" },
      { initials: "RG", name: "Rachel Goldstein", detail: "1040 MFJ · filed Mar 12", urgency: "green" },
    ]},
  ],
};

export default function Page() {
  const [activeTab, setActiveTab] = useState("need_you");
  const [viewMode, setViewMode] = useState<"clients" | "actions">("actions");
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [detailClient, setDetailClient] = useState<Client | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<typeof todayAppointments[0] | null>(null);

  const tabHues: Record<string, { border: string; bg: string }> = {
    need_you: { border: "border-red-400", bg: "bg-red-50/40 dark:bg-red-950/15" },
    waiting: { border: "border-amber-400", bg: "bg-amber-50/40 dark:bg-amber-950/15" },
    in_progress: { border: "border-blue-400", bg: "bg-blue-50/40 dark:bg-blue-950/15" },
    complete: { border: "border-emerald-400", bg: "bg-emerald-50/40 dark:bg-emerald-950/15" },
  };

  return (
    <div className="space-y-5">
      {/* ── Header + Season Context Strip ── */}
      <div className="space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Good morning, Antonio</h1>
            <p className="text-muted-foreground text-sm">
              4 urgent items · 2 appointments today
            </p>
          </div>
          <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => setVoiceOpen(true)}>
            <MicIcon className="size-3" /> Voice note
          </Button>
        </div>

        {/* Compact season strip: deadline + pipeline bar */}
        <div className="flex items-center gap-4 rounded-xl border bg-card px-4 py-3">
          {/* Deadline badge */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-center leading-none">
              <div className="font-display text-lg font-bold tabular-nums">18</div>
              <div className="text-[9px] font-medium uppercase tracking-wider opacity-70">days</div>
            </div>
            <div className="text-sm">
              <div className="font-semibold">3 of 20 filed</div>
              <div className="text-muted-foreground text-xs">Due April 15</div>
            </div>
          </div>

          <Separator orientation="vertical" className="h-8" />

          {/* Inline pipeline bar */}
          <div className="flex-1 min-w-0">
            <TooltipProvider delayDuration={0}>
              <div className="flex gap-0.5">
                {pipelineStages.map((stage, i) => (
                  <Tooltip key={i}>
                    <TooltipTrigger asChild>
                      <motion.div
                        className="cursor-pointer transition-opacity hover:opacity-80"
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: `${stage.width}%`, opacity: 1 }}
                        transition={{
                          width: { duration: 1.5, delay: 0.1 + i * 0.06, ease: [0.35, 0, 0.15, 1] },
                          opacity: { duration: 0.8, delay: 0.1 + i * 0.06 },
                        }}
                      >
                        <div
                          className="flex h-6 items-center justify-center rounded-[4px]"
                          style={{ backgroundColor: stage.color }}
                        >
                          {stage.count >= 3 && (
                            <span className="text-[10px] font-bold text-white">{stage.count}</span>
                          )}
                        </div>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      {stage.label} — {stage.count} clients
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>
            <div className="flex gap-2.5 mt-1.5">
              {pipelineStages.map((stage) => (
                <div key={stage.label} className="flex items-center gap-1">
                  <span className="size-1.5 rounded-full" style={{ backgroundColor: stage.color }} />
                  <span className="text-[9px] text-muted-foreground whitespace-nowrap">{stage.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Now: Appointments + Messages ── */}
      <div className="grid gap-4 xl:grid-cols-5">
        {/* Today's Schedule — compact */}
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
              <Badge variant="secondary" className="ml-1 h-5 rounded-full px-1.5 text-[10px] font-bold">4</Badge>
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

      {/* ── Today's Work: Summary Tabs + Action Feed ── */}
      <Card className="overflow-hidden">
        {/* Compact summary tabs — single row, number-first */}
        <div className="grid grid-cols-4 border-b">
          {summaryTabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const hue = tabHues[tab.key];
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center justify-center gap-2 py-2.5 text-sm transition-all ${
                  isActive ? `border-b-2 ${hue.border} ${hue.bg} font-semibold` : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                }`}
              >
                <span className={`font-display text-base tabular-nums ${isActive ? "text-foreground" : ""}`}>
                  {tab.count}
                </span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* View toggle header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h3 className="text-sm font-semibold">{summaryTabs.find(t => t.key === activeTab)?.label}</h3>
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
        </div>

        {/* Content */}
        <CardContent className="pt-0 pb-4">
          {viewMode === "actions" ? (
            <div className="space-y-1.5">
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
                            <p className="text-xs leading-relaxed text-muted-foreground">{matchedAction.aiDraft}</p>
                            <div className="mt-2 flex gap-2">
                              <Button size="sm" className="h-7 text-xs">
                                <SendIcon className="size-3" /> Send as Antonio
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 text-xs">
                                <FileTextIcon className="size-3" /> Edit
                              </Button>
                            </div>
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

      {/* Voice Dump Dialog */}
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

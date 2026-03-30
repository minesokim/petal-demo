"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { ClientCard } from "@/components/ui/client-card";
import { ClientDetailDialog } from "@/components/client-detail-dialog";
import { SearchIcon, Check, X, Calendar, Phone, Clock, FileText } from "lucide-react";
import { clients, stageLabels, type Client, type ReturnStage } from "@/lib/mock-data";
import { motion } from "motion/react";

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [detailClient, setDetailClient] = useState<Client | null>(null);
  const [acceptedIds, setAcceptedIds] = useState<string[]>([]);
  const [declinedIds, setDeclinedIds] = useState<string[]>([]);
  const [assignedTiers, setAssignedTiers] = useState<Record<string, string>>({});

  const serviceTierOptions = [
    { value: "", label: "Assign service tier..." },
    { value: "Simple Tax Return — $150", label: "Simple Tax Return — $150" },
    { value: "Complex Return — $350", label: "Complex Return — $350" },
    { value: "Business Tax Return — $500", label: "Business Tax Return — $500" },
    { value: "Business Formation Basic — $500", label: "Business Formation Basic — $500" },
    { value: "Business Formation Full — $1,000", label: "Business Formation Full — $1,000" },
    { value: "Bookkeeping Monthly — $200", label: "Bookkeeping Monthly — $200/mo" },
    { value: "Strategic Consultation — $250", label: "Strategic Consultation — $250" },
  ];

  const filtered = clients.filter((c) => {
    if (search && !c.fullName.toLowerCase().includes(search.toLowerCase())) return false;
    if (declinedIds.includes(c.id)) return false;
    return true;
  });

  // Map clients to workflow buckets matching Overview terminology
  const getBucket = (c: Client): string => {
    if (c.clientStatus === "pending" && !acceptedIds.includes(c.id)) return "pending";
    const stage = c.returnStage;
    if (stage === "new_intake" || stage === "ready_to_prep" || stage === "pay_and_sign") return "need_you";
    if (stage === "collecting_docs" || stage === "client_review") return "waiting";
    if (stage === "in_preparation") return "in_progress";
    if (stage === "filed") return "done";
    return "need_you";
  };

  const columns = [
    { key: "pending", label: "Pending", dot: "bg-zinc-400", bg: "bg-zinc-50 dark:bg-zinc-900/20", headerBg: "bg-zinc-100 dark:bg-zinc-900/30" },
    { key: "need_you", label: "Need You", dot: "bg-red-500", bg: "bg-red-50 dark:bg-red-950/20", headerBg: "bg-red-50 dark:bg-red-950/30" },
    { key: "waiting", label: "Waiting", dot: "bg-amber-500", bg: "bg-amber-50 dark:bg-amber-950/20", headerBg: "bg-amber-50 dark:bg-amber-950/30" },
    { key: "in_progress", label: "In Progress", dot: "bg-blue-500", bg: "bg-blue-50 dark:bg-blue-950/20", headerBg: "bg-blue-50 dark:bg-blue-950/30" },
    { key: "done", label: "Done", dot: "bg-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/20", headerBg: "bg-emerald-50 dark:bg-emerald-950/30" },
  ];

  const columnData = columns.map(col => ({
    ...col,
    clients: filtered.filter(c => getBucket(c) === col.key),
  })).filter(col => col.clients.length > 0);

  const formatCallTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    const isPast = d < now;
    const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

    if (isToday) return `Today at ${timeStr}`;
    if (isYesterday) return `Yesterday at ${timeStr}`;
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) + " at " + timeStr;
  };
  const isCallPast = (dateStr: string) => new Date(dateStr) < new Date();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground text-sm">{clients.filter(c => c.clientStatus !== "declined" && !declinedIds.includes(c.id)).length} total clients</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <SearchIcon className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
        <Input placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Kanban-style columns - horizontal scroll */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {columnData.map((col) => (
          <div key={col.key} className="w-[280px] shrink-0">
            {/* Column header */}
            <div className={`mb-3 flex items-center justify-between rounded-lg px-3 py-2 ${col.headerBg}`}>
              <div className="flex items-center gap-2">
                <span className={`size-2 rounded-full ${col.dot}`} />
                <span className="text-sm font-semibold">{col.label}</span>
              </div>
              <Badge variant="outline" className="text-[10px]">{col.clients.length}</Badge>
            </div>

            {/* Column cards */}
            <div className="space-y-3">
              {col.key === "pending" ? (
                // Pending clients get special accept/decline cards
                col.clients.map((client) => (
                  <motion.div
                    key={client.id}
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-2xl border bg-background p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="size-10 shrink-0">
                        <AvatarImage src={client.avatar} alt={client.fullName} />
                        <AvatarFallback className="text-xs">{client.fullName.split(" ").map(n => n[0]).join("").slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold">{client.fullName}</div>
                        <div className="text-xs text-muted-foreground">
                          {client.businessName || `${client.serviceTier} - $${client.feeAmount}`}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px]">New</Badge>
                    </div>

                    {/* Intake context */}
                    {(() => {
                      const intakeContext: Record<string, { filing: string; income: string[]; service: string }> = {
                        c21: { filing: "Single", income: ["W-2", "1099-NEC"], service: "Complex Return" },
                        c22: { filing: "MFJ", income: ["Business (S-Corp)", "W-2"], service: "Business Tax Return" },
                        c23: { filing: "Single", income: ["W-2"], service: "Simple Tax Return" },
                      };
                      const ctx = intakeContext[client.id];
                      return (
                        <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Check className="size-3 text-emerald-500" /> Intake completed
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="size-3 text-emerald-500" /> $50 deposit paid
                          </div>
                          {ctx && (
                            <>
                              <div className="flex items-center gap-2">
                                <FileText className="size-3 text-primary" />
                                <span>{ctx.service} &middot; {ctx.filing}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <FileText className="size-3 text-muted-foreground/50" />
                                <span>Income: {ctx.income.join(", ")}</span>
                              </div>
                            </>
                          )}
                          <div className="flex items-center gap-2">
                            <Calendar className={`size-3 ${client.scheduledCall && isCallPast(client.scheduledCall) ? "text-red-500" : "text-blue-500"}`} />
                            <span className={client.scheduledCall && isCallPast(client.scheduledCall) ? "text-red-600 dark:text-red-400" : ""}>
                              Call: {client.scheduledCall ? formatCallTime(client.scheduledCall) : "Not scheduled"}
                              {client.scheduledCall && isCallPast(client.scheduledCall) && " · Missed"}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Notes */}
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{client.notes}</p>

                    {/* Tier assignment */}
                    {!acceptedIds.includes(client.id) && (
                      <div className="mt-3">
                        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {(() => {
                            const ctx: Record<string, string> = { c21: "Complex Return", c22: "Business Tax Return", c23: "Simple Tax Return" };
                            const requested = ctx[client.id];
                            return requested ? `Client requested: ${requested}` : "Assign service tier";
                          })()}
                        </label>
                        <select
                          value={assignedTiers[client.id] || ""}
                          onChange={(e) => setAssignedTiers(prev => ({ ...prev, [client.id]: e.target.value }))}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground outline-none transition-colors focus:border-primary"
                        >
                          {serviceTierOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Accept / Decline */}
                    {acceptedIds.includes(client.id) ? (
                      <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 p-2 dark:bg-emerald-950/20">
                        <Check className="size-4 text-emerald-600" />
                        <span className="text-xs font-medium text-emerald-700">
                          Accepted{assignedTiers[client.id] ? ` — ${assignedTiers[client.id]}` : ""}
                        </span>
                      </div>
                    ) : (
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" className="flex-1" onClick={() => setAcceptedIds(prev => [...prev, client.id])} disabled={!assignedTiers[client.id]}>
                          <Check className="size-3.5" /> Accept
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => setDeclinedIds(prev => [...prev, client.id])}>
                          <X className="size-3.5" /> Decline
                        </Button>
                      </div>
                    )}
                  </motion.div>
                ))
              ) : (
                // Regular clients get the standard card
                col.clients.map((client) => (
                  <ClientCard
                    key={client.id}
                    client={client}
                    onOpenDetail={setDetailClient}
                    defaultExpanded
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <ClientDetailDialog
        client={detailClient}
        open={!!detailClient}
        onOpenChange={(open) => !open && setDetailClient(null)}
      />
    </div>
  );
}

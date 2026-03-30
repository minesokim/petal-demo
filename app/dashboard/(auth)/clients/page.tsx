"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { ClientCard } from "@/components/ui/client-card";
import { ClientDetailDialog } from "@/components/client-detail-dialog";
import { SearchIcon, Check, X, Calendar, Phone, Clock } from "lucide-react";
import { clients, stageLabels, type Client, type ReturnStage } from "@/lib/mock-data";
import { motion } from "motion/react";

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [detailClient, setDetailClient] = useState<Client | null>(null);
  const [acceptedIds, setAcceptedIds] = useState<string[]>([]);
  const [declinedIds, setDeclinedIds] = useState<string[]>([]);

  const filtered = clients.filter((c) => {
    if (search && !c.fullName.toLowerCase().includes(search.toLowerCase())) return false;
    if (declinedIds.includes(c.id)) return false;
    return true;
  });

  // If accepted, move from pending to the appropriate urgency column
  const getEffectiveStatus = (c: Client) => {
    if (c.clientStatus === "pending" && !acceptedIds.includes(c.id)) return "pending";
    return c.urgency;
  };

  const columns = [
    { key: "pending", label: "Pending", dot: "bg-zinc-400", bg: "bg-zinc-50 dark:bg-zinc-900/20", headerBg: "bg-zinc-100 dark:bg-zinc-900/30" },
    { key: "urgent", label: "Urgent", dot: "bg-red-500", bg: "bg-red-50 dark:bg-red-950/20", headerBg: "bg-red-50 dark:bg-red-950/30" },
    { key: "high", label: "High Priority", dot: "bg-amber-500", bg: "bg-amber-50 dark:bg-amber-950/20", headerBg: "bg-amber-50 dark:bg-amber-950/30" },
    { key: "normal", label: "Active", dot: "bg-blue-500", bg: "bg-blue-50 dark:bg-blue-950/20", headerBg: "bg-blue-50 dark:bg-blue-950/30" },
    { key: "low", label: "Complete", dot: "bg-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/20", headerBg: "bg-emerald-50 dark:bg-emerald-950/30" },
  ];

  const columnData = columns.map(col => ({
    ...col,
    clients: filtered.filter(c => getEffectiveStatus(c) === col.key),
  })).filter(col => col.clients.length > 0);

  const formatCallTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) + " at " +
      d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

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

      {/* Kanban-style columns - wraps when space is tight */}
      <div className="grid gap-3 pb-4" style={{ gridTemplateColumns: `repeat(${columnData.length}, minmax(220px, 1fr))` }}>
        {columnData.map((col) => (
          <div key={col.key} className="min-w-0">
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

                    {/* Intake summary */}
                    <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Check className="size-3 text-emerald-500" /> Intake completed
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="size-3 text-emerald-500" /> $50 deposit paid
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="size-3 text-blue-500" />
                        Call: {client.scheduledCall ? formatCallTime(client.scheduledCall) : "Not scheduled"}
                      </div>
                    </div>

                    {/* Notes */}
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{client.notes}</p>

                    {/* Accept / Decline */}
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => setAcceptedIds(prev => [...prev, client.id])}
                      >
                        <Check className="size-3.5" /> Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setDeclinedIds(prev => [...prev, client.id])}
                      >
                        <X className="size-3.5" /> Decline
                      </Button>
                    </div>
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

"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search, Download, FileSignature, ArrowRightLeft, MessageSquare,
  CreditCard, Shield, FileText, BotIcon, User, Monitor, X,
  ChevronDown
} from "lucide-react";
import { getAllActivity } from "@/lib/activity-mock-data";
import { useToast } from "@/components/ui/toast-notification";

const eventTypeConfig: Record<string, { label: string; color: string }> = {
  email_sent: { label: "Email Sent", color: "bg-blue-500" },
  portal_login: { label: "Portal Login", color: "bg-emerald-500" },
  signature_completed: { label: "Signature", color: "bg-violet-500" },
  document_uploaded: { label: "Document Upload", color: "bg-sky-500" },
  ai_classification: { label: "AI Classification", color: "bg-indigo-500" },
  ai_extraction: { label: "AI Extraction", color: "bg-indigo-500" },
  ai_flag: { label: "AI Flag", color: "bg-amber-500" },
  message_received: { label: "Message In", color: "bg-emerald-500" },
  message_sent: { label: "Message Out", color: "bg-blue-500" },
  note_added: { label: "Note", color: "bg-zinc-500" },
  stage_changed: { label: "Stage Change", color: "bg-orange-500" },
  call_logged: { label: "Call", color: "bg-teal-500" },
  appointment_scheduled: { label: "Appointment", color: "bg-purple-500" },
  payment_received: { label: "Payment", color: "bg-emerald-500" },
  sms_sent: { label: "SMS Sent", color: "bg-blue-400" },
  sms_replied: { label: "SMS Reply", color: "bg-emerald-400" },
};

const actorConfig: Record<string, { label: string; icon: typeof User }> = {
  antonio: { label: "Antonio", icon: User },
  client: { label: "Client", icon: User },
  ai: { label: "AI System", icon: BotIcon },
  system: { label: "System", icon: Monitor },
};

export default function AuditTrailPage() {
  const [search, setSearch] = useState("");
  const [actorFilter, setActorFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const { showToast } = useToast();

  const allEvents = useMemo(() => getAllActivity(), []);

  const filtered = useMemo(() => {
    return allEvents.filter(e => {
      if (actorFilter !== "all" && e.actor !== actorFilter) return false;
      if (typeFilter !== "all" && e.type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          e.description.toLowerCase().includes(q) ||
          e.clientName.toLowerCase().includes(q) ||
          e.type.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allEvents, actorFilter, typeFilter, search]);

  // Get unique event types for filter
  const eventTypes = [...new Set(allEvents.map(e => e.type))].sort();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">Audit Trail</h3>
          <p className="text-sm text-muted-foreground">{allEvents.length} events across all clients</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => showToast("success", "Exporting audit trail", "PDF will download shortly")}>
          <Download className="size-3.5" /> Export PDF
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search events, clients..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <select
          value={actorFilter}
          onChange={e => setActorFilter(e.target.value)}
          className="h-9 rounded-md border bg-background px-3 text-xs outline-none"
        >
          <option value="all">All actors</option>
          <option value="antonio">Antonio</option>
          <option value="client">Client</option>
          <option value="ai">AI System</option>
          <option value="system">System</option>
        </select>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="h-9 rounded-md border bg-background px-3 text-xs outline-none"
        >
          <option value="all">All types</option>
          {eventTypes.map(t => (
            <option key={t} value={t}>{eventTypeConfig[t]?.label || t}</option>
          ))}
        </select>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {allEvents.length} events
        {(actorFilter !== "all" || typeFilter !== "all" || search) && (
          <button onClick={() => { setActorFilter("all"); setTypeFilter("all"); setSearch(""); }} className="ml-2 text-foreground underline-offset-2 hover:underline">
            Clear filters
          </button>
        )}
      </p>

      {/* Event log */}
      <Card>
        <CardContent className="p-0 divide-y">
          {filtered.slice(0, 100).map(event => {
            const config = eventTypeConfig[event.type];
            const actor = actorConfig[event.actor || "system"];
            return (
              <div key={event.id} className="flex items-start gap-3 px-4 py-3 text-sm hover:bg-muted/30 transition-colors">
                <div className={`size-2 rounded-full shrink-0 mt-2 ${config?.color || "bg-zinc-400"}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-xs">{event.clientName}</span>
                    <Badge variant="outline" className="text-[9px] h-4 px-1.5">{config?.label || event.type}</Badge>
                    {event.actor && (
                      <span className="text-[10px] text-muted-foreground">{actor?.label || event.actor}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{event.description}</p>
                  {event.detail && (
                    <p className="text-[11px] text-muted-foreground/70 mt-0.5 italic">{event.detail}</p>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground tabular-nums shrink-0 mt-0.5">
                  {new Date(event.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  {" "}
                  {new Date(event.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                </span>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">No events match your filters</div>
          )}
          {filtered.length > 100 && (
            <div className="py-3 text-center text-xs text-muted-foreground">Showing first 100 of {filtered.length} events</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

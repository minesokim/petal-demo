"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, Calendar, FileText } from "lucide-react";
import { motion } from "motion/react";
import { type Client, pendingIntakeContext, serviceTierOptions } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function formatCallTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (isToday) return `Today ${timeStr}`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + ` ${timeStr}`;
}

function isCallPast(dateStr: string) {
  return new Date(dateStr) < new Date();
}

interface PendingClientCardProps {
  client: Client;
  assignedTier: string | undefined;
  onAssignTier: (tier: string) => void;
  onAccept: () => void;
  onDecline: () => void;
  onOpen?: () => void;
}

export function PendingClientCard({
  client,
  assignedTier,
  onAssignTier,
  onAccept,
  onDecline,
  onOpen,
}: PendingClientCardProps) {
  const ctx = pendingIntakeContext[client.id];

  return (
    <motion.div
      layout
      initial={{ opacity: 1, scale: 1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0, padding: 0, overflow: "hidden" }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="cursor-pointer rounded-2xl border bg-background p-4 shadow-sm"
      onClick={onOpen}
    >
      <div className="flex items-start gap-3">
        <Avatar className="size-10 shrink-0">
          <AvatarImage src={client.avatar} alt={client.fullName} />
          <AvatarFallback className="text-xs">{getInitials(client.fullName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">{client.fullName}</div>
          <div className="text-xs text-muted-foreground">
            {client.businessName || `${client.serviceTier} - $${client.feeAmount}`}
          </div>
        </div>
        <Badge variant="outline" className="text-[10px]">New</Badge>
      </div>

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
              <span className="truncate">Income: {ctx.income.join(", ")}</span>
            </div>
          </>
        )}
        <div className="flex items-center gap-2">
          <Calendar className={cn("size-3", client.scheduledCall && isCallPast(client.scheduledCall) ? "text-red-500" : "text-blue-500")} />
          <span className={client.scheduledCall && isCallPast(client.scheduledCall) ? "text-red-600 dark:text-red-400" : ""}>
            Call: {client.scheduledCall ? formatCallTime(client.scheduledCall) : "Not scheduled"}
            {client.scheduledCall && isCallPast(client.scheduledCall) && " · Missed"}
          </span>
        </div>
      </div>

      {client.notes && (
        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{client.notes}</p>
      )}

      <div className="mt-3" onClick={e => e.stopPropagation()}>
        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {ctx ? `Client requested: ${ctx.service}` : "Assign service tier"}
        </label>
        <select
          value={assignedTier || ""}
          onChange={e => onAssignTier(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground outline-none transition-colors focus:border-primary"
        >
          {serviceTierOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="mt-3 flex gap-2" onClick={e => e.stopPropagation()}>
        <Button size="sm" className="flex-1" onClick={onAccept} disabled={!assignedTier}>
          <Check className="size-3.5" /> Accept
        </Button>
        <Button size="sm" variant="outline" className="flex-1" onClick={onDecline}>
          <X className="size-3.5" /> Decline
        </Button>
      </div>
    </motion.div>
  );
}

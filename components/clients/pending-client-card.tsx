"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { motion } from "motion/react";
import { type Client, pendingIntakeContext, serviceTierOptions } from "@/lib/mock-data";

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

interface PendingClientCardProps {
  client: Client;
  assignedTier: string | undefined;
  onAssignTier: (tier: string) => void;
  onAccept: () => void;
  onDecline: () => void;
  onOpen?: () => void;
}

/**
 * Pending intake card — stripped to triage essentials only.
 *
 * Mental model for the preparer: who is this, what do they want, are they
 * ready to engage, and what tier should I assign. Everything else (intake
 * details, income types, notes, call history) lives in the detail view.
 */
export function PendingClientCard({
  client,
  assignedTier,
  onAssignTier,
  onAccept,
  onDecline,
  onOpen,
}: PendingClientCardProps) {
  const ctx = pendingIntakeContext[client.id];
  const requested = ctx?.service || client.serviceTier;
  const filing = ctx?.filing;

  return (
    <motion.div
      layout
      initial={{ opacity: 1, scale: 1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0, padding: 0, overflow: "hidden" }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="cursor-pointer rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
      onClick={onOpen}
    >
      {/* Header — avatar + name + service/price */}
      <div className="flex items-start gap-3">
        <Avatar className="size-10 shrink-0">
          <AvatarImage src={client.avatar} alt={client.fullName} />
          <AvatarFallback className="text-xs">{getInitials(client.fullName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-[14px] font-semibold">{client.fullName}</span>
            <Badge variant="outline" className="shrink-0 text-[10px]">New</Badge>
          </div>
          <div className="mt-0.5 truncate text-[12px] text-muted-foreground">
            {requested} · ${client.feeAmount}{filing ? ` · ${filing}` : ""}
          </div>
        </div>
      </div>

      {/* Readiness signals — only the two that gate acceptance */}
      <div className="mt-3 flex items-center gap-2.5 text-[11.5px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Check className="size-3 text-emerald-500" /> Intake
        </span>
        <span className="text-muted-foreground/40">·</span>
        <span className="flex items-center gap-1">
          <Check className="size-3 text-emerald-500" /> Deposit
        </span>
      </div>

      {/* Tier assignment + decision */}
      <div className="mt-4 space-y-2" onClick={e => e.stopPropagation()}>
        <select
          value={assignedTier || ""}
          onChange={e => onAssignTier(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-[12px] font-medium text-foreground outline-none transition-colors focus:border-primary"
        >
          {serviceTierOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={onAccept} disabled={!assignedTier}>
            <Check className="size-3.5" /> Accept
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={onDecline}>
            <X className="size-3.5" /> Decline
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

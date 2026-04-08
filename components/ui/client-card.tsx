"use client";

import * as React from "react";
import { FileText, ArrowUpRight, Clock, Building2, Activity, ChevronDown } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { type Client, stageLabels, getClientPaymentSummary } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TrackingBadgeGroup, generateClientTrackingBadges } from "@/components/insights";

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

interface ClientCardProps {
  client: Client;
  onOpenDetail?: (client: Client) => void;
  defaultExpanded?: boolean;
}

export function ClientCard({ client, onOpenDetail, defaultExpanded = false }: ClientCardProps) {
  const [expanded, setExpanded] = React.useState(defaultExpanded);
  const docPercent = Math.round((client.documentsSubmitted / client.documentsRequired) * 100);
  const stageIndex = ['new_intake', 'collecting_docs', 'ready_to_prep', 'in_preparation', 'client_review', 'pay_and_sign', 'filed'].indexOf(client.returnStage);
  const stagePercent = Math.round(((stageIndex + 1) / 7) * 100);

  // Generate tracking badges for this client
  const trackingBadges = generateClientTrackingBadges(client);

  const lastActive = client.lastPortalLogin
    ? Math.floor((Date.now() - new Date(client.lastPortalLogin).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const lastActiveLabel = lastActive === null ? "Never" : lastActive === 0 ? "Today" : `${lastActive}d ago`;
  const lastActivePercent = lastActive === null ? "0%" : lastActive === 0 ? "100%" : lastActive <= 3 ? "75%" : lastActive <= 7 ? "40%" : "15%";

  const docsComplete = client.documentsSubmitted >= client.documentsRequired;
  const returnComplete = client.returnStage === "filed";

  const stages = ['new_intake', 'collecting_docs', 'ready_to_prep', 'in_preparation', 'client_review', 'pay_and_sign', 'filed'];
  const lastActiveColor = lastActive !== null && lastActive <= 3 ? "text-foreground" : lastActive !== null && lastActive <= 7 ? "text-amber-600" : "text-red-500";

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open if clicking the expand arrow or profile link
    if ((e.target as HTMLElement).closest("[data-expand-toggle]") || (e.target as HTMLElement).closest("[data-profile-link]")) return;
    onOpenDetail?.(client);
  };

  return (
    <div className="rounded-lg bg-white border p-2.5 shadow-sm transition-shadow hover:shadow-md">
      {/* Main card area - clickable to open detail */}
      <div
        className="cursor-pointer rounded-lg bg-white px-3.5 py-3 shadow-sm"
        onClick={handleCardClick}
      >
        {/* Header row */}
        <div className="flex items-center gap-3">
          <Avatar className="size-10 shrink-0">
            <AvatarImage src={client.avatar} alt={client.fullName} />
            <AvatarFallback className="text-xs">{getInitials(client.fullName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold leading-tight">{client.fullName}</h3>
              {client.type === "business" && <Building2 className="size-3.5 shrink-0 text-muted-foreground" />}
              {(client.urgency === "urgent" || client.urgency === "high") && (
                <span className={`size-2 shrink-0 rounded-full ${client.urgency === "urgent" ? "bg-red-500" : "bg-amber-500"}`} />
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-tight">
              {client.businessName || `${client.serviceTier} - $${client.feeAmount}`}
            </p>
          </div>
          <Badge
            variant={
              client.returnStage === "filed" ? "default" :
              client.returnStage === "pay_and_sign" ? "default" :
              client.returnStage === "collecting_docs" ? "secondary" :
              "outline"
            }
            className="shrink-0 text-[10px]"
          >
            {stageLabels[client.returnStage]}
          </Badge>
        </div>

        {/* Tracking badges */}
        {trackingBadges.length > 0 && (
          <div className="mt-2">
            <TrackingBadgeGroup badges={trackingBadges} maxVisible={3} />
          </div>
        )}

        {/* Expandable stats - only via arrow click */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: "auto", opacity: 1, marginTop: 14 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="overflow-hidden"
            >
              {/* Documents bar */}
              <div className="mt-1">
                <div className="mb-1 flex items-center justify-between text-xs font-medium text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <FileText className="size-3.5" /> Documents
                  </div>
                  <span>{client.documentsSubmitted}/{client.documentsRequired}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted">
                  <motion.div
                    className={`h-1.5 rounded-full ${docsComplete ? "bg-emerald-500" : "bg-primary"}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${docPercent}%` }}
                    transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                  />
                </div>
              </div>

              {/* Return Progress bar */}
              <div className="mt-2">
                <div className="mb-1 flex items-center justify-between text-xs font-medium text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Activity className="size-3.5" /> Return Progress
                  </div>
                  <span>{stageLabels[client.returnStage]}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted">
                  <motion.div
                    className={`h-1.5 rounded-full ${returnComplete ? "bg-emerald-500" : "bg-primary"}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${stagePercent}%` }}
                    transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                  />
                </div>
              </div>

              {/* Last Active — text only */}
              <div className="mt-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock className="size-3.5" /> Last Active
                </div>
                <span className={lastActiveColor}>{lastActiveLabel}</span>
              </div>

              {client.notes && (
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  {client.notes}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="mt-2 flex items-center gap-2 px-1">
        <div className="flex size-5 items-center justify-center rounded-full bg-primary text-white">
          <FileText className="size-3" />
        </div>
        <span className="flex-1 text-xs font-medium text-muted-foreground">
          {client.documentsSubmitted}/{client.documentsRequired} docs · {(() => {
            const ps = getClientPaymentSummary(client.id);
            if (ps.fullyPaid) return <span className="text-emerald-600">Paid in full</span>;
            if (ps.hasOverdue) return <span className="text-red-500">${ps.totalOwed} overdue</span>;
            if (ps.totalOwed > 0) return <span>${ps.totalOwed} remaining</span>;
            return <span>Deposit {client.depositPaid ? "paid" : "unpaid"}</span>;
          })()}
        </span>

        {/* View full profile */}
        <Link
          data-profile-link
          href={`/dashboard/clients/${client.id}/overview`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Open <ArrowUpRight className="size-3" />
        </Link>

        {/* Expand toggle arrow - only show if not defaultExpanded */}
        {!defaultExpanded && (
          <button
            data-expand-toggle
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
            className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronDown
              className={`size-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            />
          </button>
        )}
      </div>
    </div>
  );
}

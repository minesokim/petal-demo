"use client";

import * as React from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { type Client, stageLabels, getClientPaymentSummary } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getOneLineInsightForClient, getAdvisoryForFiledClient } from "@/lib/insights-mock-data";
import { cn } from "@/lib/utils";
import Link from "next/link";

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// Severity dot colors for inline insight
const severityDot = {
  insight: "bg-emerald-500",
  concern: "bg-amber-500",
  alert: "bg-red-500",
};

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

  const oneLineInsight = getOneLineInsightForClient(client.id);
  const filedAdvisory = client.returnStage === "filed" ? getAdvisoryForFiledClient(client.id) : null;
  const [showAdvisory, setShowAdvisory] = React.useState(false);

  const lastActive = client.lastPortalLogin
    ? Math.floor((Date.now() - new Date(client.lastPortalLogin).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const lastActiveLabel = lastActive === null ? "Never" : lastActive === 0 ? "Today" : `${lastActive}d ago`;

  const docsComplete = client.documentsSubmitted >= client.documentsRequired;
  const returnComplete = client.returnStage === "filed";

  const lastActiveColor = lastActive !== null && lastActive <= 3 ? "text-foreground" : lastActive !== null && lastActive <= 7 ? "text-amber-600" : "text-red-500";

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-expand-toggle]")) return;
    if ((e.target as HTMLElement).closest("[data-full-page-link]")) return;
    onOpenDetail?.(client);
  };

  return (
    <div className="rounded-lg bg-white border p-2.5 shadow-sm transition-shadow hover:shadow-md">
      {/* Main card area - clickable to open detail */}
      <div
        className="cursor-pointer rounded-lg bg-white px-3.5 py-3"
        onClick={handleCardClick}
      >
        {/* Header row */}
        <div className="flex items-center gap-3">
          <Avatar className="size-10 shrink-0">
            <AvatarImage src={client.avatar} alt={client.fullName} />
            <AvatarFallback className="text-xs">{getInitials(client.fullName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold leading-tight truncate font-display">{client.fullName}</h3>
            <p className="text-xs text-muted-foreground leading-tight truncate">
              {client.businessName || `${client.serviceTier} · $${client.feeAmount}`}
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

        {/* Primary metrics - always visible */}
        <div className="mt-3 space-y-2">
          {/* Documents progress */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-muted-foreground w-12">Docs</span>
            <div className="flex-1 h-1.5 rounded-full bg-muted">
              <div
                className={cn("h-1.5 rounded-full transition-all", docsComplete ? "bg-emerald-500" : "bg-primary")}
                style={{ width: `${docPercent}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-right">
              {client.documentsSubmitted}/{client.documentsRequired}
            </span>
          </div>

          {/* Return progress */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-muted-foreground w-12">Return</span>
            <div className="flex-1 h-1.5 rounded-full bg-muted">
              <div
                className={cn("h-1.5 rounded-full transition-all", returnComplete ? "bg-emerald-500" : "bg-primary")}
                style={{ width: `${stagePercent}%` }}
              />
            </div>
            <span className={cn("text-[10px] w-8 text-right", lastActiveColor)}>
              {lastActiveLabel}
            </span>
          </div>
        </div>

        {/* AI Insight — clean, no colored borders or backgrounds */}
        {oneLineInsight && (
          <div className="mt-3 flex gap-2 items-start">
            <span className={cn(
              "mt-1.5 size-1.5 shrink-0 rounded-full",
              severityDot[oneLineInsight.severity]
            )} />
            <p className="text-xs text-muted-foreground leading-relaxed">
              {oneLineInsight.title}
            </p>
          </div>
        )}

        {/* Expandable section — only shows NEW info (notes + advisory) */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                {client.notes && (
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {client.notes}
                  </p>
                )}

                {/* Filed client advisory */}
                {filedAdvisory && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setShowAdvisory(!showAdvisory); }}
                      className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ChevronDown className={cn("size-3 transition-transform", showAdvisory && "rotate-180")} />
                      Advisory opportunity
                    </button>
                    <AnimatePresence>
                      {showAdvisory && (
                        <motion.p
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-2 text-xs text-muted-foreground leading-relaxed overflow-hidden"
                        >
                          {filedAdvisory.title}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="mt-2 flex items-center justify-between px-1">
        <span className="text-xs text-muted-foreground">
          {(() => {
            const ps = getClientPaymentSummary(client.id);
            if (ps.fullyPaid) return <span className="text-emerald-600">Paid in full</span>;
            if (ps.hasOverdue) return <span className="text-red-500">${ps.totalOwed} overdue</span>;
            if (ps.totalOwed > 0) return <span>${ps.totalOwed} due</span>;
            return <span>Deposit {client.depositPaid ? "paid" : "unpaid"}</span>;
          })()}
        </span>

        <div className="flex items-center gap-1">
          {/* Open full page link */}
          <Link
            href={`/dashboard/clients/${client.id}/overview`}
            data-full-page-link
            onClick={(e) => e.stopPropagation()}
            className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Open full page"
          >
            <ExternalLink className="size-3.5" />
          </Link>

          {/* Expand toggle */}
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
                className={cn("size-4 transition-transform duration-200", expanded && "rotate-180")}
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

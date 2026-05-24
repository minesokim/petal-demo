"use client";

import * as React from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { type Client, type ReturnStage, stageLabels, getClientPaymentSummary } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getOneLineInsightForClient, getAdvisoryForFiledClient } from "@/lib/insights-mock-data";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  subscribePipelineStages,
  getAllStageOverrides,
} from "@/lib/pipeline-stage-store";

// Stable empty snapshot for SSR (kept module-level so identity is stable)
const EMPTY_OVERRIDES: Record<string, ReturnStage> = {};

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
  /** When true, hides the expand chevron (card stays at fixed size). */
  staticSize?: boolean;
  /** Optional unread message count — shown as a small badge in the header. */
  unreadCount?: number;
  /** Pipeline density. "compact" = single-line row (~36px); "comfortable" = full card. */
  density?: "comfortable" | "compact";
}

export function ClientCard({
  client,
  onOpenDetail,
  defaultExpanded = false,
  staticSize = false,
  unreadCount = 0,
  density = "comfortable",
}: ClientCardProps) {
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  // Effective stage — honors drag-and-drop overrides from pipeline-stage-store.
  // The card's badge + stage-driven UI always reflects what the user dragged.
  const overrides = React.useSyncExternalStore<Record<string, ReturnStage>>(
    subscribePipelineStages,
    getAllStageOverrides,
    () => EMPTY_OVERRIDES
  );
  const effectiveStage: ReturnStage = overrides[client.id] ?? client.returnStage;
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

  // ─── Compact density — single-line row used in pipeline "Compact" view ───
  if (density === "compact") {
    return (
      <div
        onClick={() => onOpenDetail?.(client)}
        className="group flex h-9 cursor-pointer items-center gap-2 rounded-md border bg-white px-2.5 text-[12px] transition-colors hover:bg-muted/50"
      >
        <Avatar className="size-5 shrink-0">
          {client.avatar && <AvatarImage src={client.avatar} alt={client.fullName} />}
          <AvatarFallback className="text-[8px] font-medium">{getInitials(client.fullName)}</AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1 truncate font-medium">{client.fullName}</span>
        {unreadCount > 0 && (
          <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-semibold leading-none text-white">
            {unreadCount}
          </span>
        )}
        <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">
          {client.documentsSubmitted}/{client.documentsRequired}
        </span>
        <span className={cn("shrink-0 text-[10px] tabular-nums", lastActiveColor)}>
          {lastActiveLabel}
        </span>
      </div>
    );
  }

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-expand-toggle]")) return;
    if ((e.target as HTMLElement).closest("[data-full-page-link]")) return;
    onOpenDetail?.(client);
  };

  return (
    <div className={cn(
      "relative rounded-lg bg-white border p-2.5 shadow-sm transition-shadow hover:shadow-md",
      // Pipeline mode: every card is exactly the same height for clean vertical
      // rhythm. Height is tall enough to fit the longest content (insight line +
      // footer) without clipping the Open button. Main area is flex-1 +
      // overflow-hidden so any excessively long content truncates internally
      // rather than pushing the footer off-screen.
      staticSize && "flex h-[220px] flex-col overflow-hidden"
    )}>
      {/* "Open full page" link lives in the footer (see end of card) — kept
          out of the top-right so the name + stage badge have full room and
          don't truncate to ellipses on narrow pipeline cards.
          Main area is flex-1 + overflow-hidden + min-h-0 so it absorbs the
          available space inside the fixed 220px height, clipping its OWN
          content if it's somehow taller. Footer stays pinned at the bottom. */}
      {/* Main card area - clickable to open detail */}
      <div
        className={cn(
          "cursor-pointer rounded-lg bg-white px-3.5 py-3",
          staticSize && "min-h-0 flex-1 overflow-hidden"
        )}
        onClick={handleCardClick}
      >
        {/* Header row */}
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <Avatar className="size-10">
              <AvatarImage src={client.avatar} alt={client.fullName} />
              <AvatarFallback className="text-xs">{getInitials(client.fullName)}</AvatarFallback>
            </Avatar>
            {unreadCount > 0 && (
              <span
                className="absolute -right-0.5 -top-0.5 flex size-[18px] items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold leading-none text-white ring-2 ring-card tabular-nums"
                aria-label={`${unreadCount} unread message${unreadCount === 1 ? "" : "s"}`}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold leading-tight truncate">{client.fullName}</h3>
            <p className="text-xs text-muted-foreground leading-tight truncate">
              {client.businessName || `${client.serviceTier} · $${client.feeAmount}`}
            </p>
          </div>
          <Badge
            variant={
              effectiveStage === "filed" ? "default" :
              effectiveStage === "pay_and_sign" ? "default" :
              effectiveStage === "collecting_docs" ? "secondary" :
              "outline"
            }
            className="shrink-0 text-[10px]"
          >
            {stageLabels[effectiveStage]}
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

      {/* Footer — shrink-0 so it always sits at the bottom of the 180px card
          and the Open button is never clipped, even when the main area has
          a tall insight/flag line above. */}
      <div className="mt-2 flex shrink-0 items-center justify-between px-1">
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
          {/* Open full page — bordered link in the footer. Decent visual
              hierarchy (border + subtle shadow + same height as a small button)
              so it reads as a real affordance, not a tiny text-link. */}
          <Link
            href={`/dashboard/clients/${client.id}/overview`}
            data-full-page-link
            onClick={(e) => e.stopPropagation()}
            className="flex h-7 items-center gap-1.5 rounded-md border border-border bg-background px-2 text-[11px] font-medium text-foreground/80 shadow-sm transition-colors hover:border-foreground/30 hover:bg-muted hover:text-foreground"
            title="Open full page"
          >
            <ExternalLink className="size-3" />
            <span>Open full page</span>
          </Link>

          {/* Expand toggle */}
          {!defaultExpanded && !staticSize && (
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

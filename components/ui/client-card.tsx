"use client";

import * as React from "react";
import { FileText, ArrowUpRight, Clock, Building2, Activity, ChevronDown } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { type Client, stageLabels } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  const stageIndex = ['not_started', 'intake_sent', 'docs_collecting', 'docs_complete', 'in_prep', 'in_review', 'ready_to_sign', 'filed'].indexOf(client.returnStage);
  const stagePercent = Math.round((stageIndex / 7) * 100);

  const lastActive = client.lastPortalLogin
    ? Math.floor((Date.now() - new Date(client.lastPortalLogin).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const lastActiveLabel = lastActive === null ? "Never" : lastActive === 0 ? "Today" : `${lastActive}d ago`;
  const lastActivePercent = lastActive === null ? "0%" : lastActive === 0 ? "100%" : lastActive <= 3 ? "75%" : lastActive <= 7 ? "40%" : "15%";

  const docsComplete = client.documentsSubmitted >= client.documentsRequired;
  const returnComplete = client.returnStage === "filed";

  const stats = [
    { label: "Documents", value: `${docPercent}%`, displayValue: `${client.documentsSubmitted}/${client.documentsRequired}`, Icon: FileText, barColor: docsComplete ? "bg-emerald-500" : "bg-primary" },
    { label: "Return Progress", value: `${stagePercent}%`, displayValue: stageLabels[client.returnStage], Icon: Activity, barColor: returnComplete ? "bg-emerald-500" : "bg-primary" },
    { label: "Last Active", value: lastActivePercent, displayValue: lastActiveLabel, Icon: Clock, barColor: lastActive !== null && lastActive <= 3 ? "bg-primary" : lastActive !== null && lastActive <= 7 ? "bg-amber-400" : "bg-red-400" },
  ];

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open if clicking the expand arrow or profile link
    if ((e.target as HTMLElement).closest("[data-expand-toggle]") || (e.target as HTMLElement).closest("[data-profile-link]")) return;
    onOpenDetail?.(client);
  };

  return (
    <div className="rounded-2xl bg-muted/60 p-2.5 shadow-sm transition-shadow hover:shadow-md">
      {/* Main card area - clickable to open detail */}
      <div
        className="cursor-pointer rounded-xl bg-background px-4 py-3.5 shadow-sm"
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
              <h3 className="truncate text-sm font-semibold">{client.fullName}</h3>
              {client.type === "business" && <Building2 className="size-3.5 shrink-0 text-muted-foreground" />}
              {(client.urgency === "urgent" || client.urgency === "high") && (
                <span className={`size-2 shrink-0 rounded-full ${client.urgency === "urgent" ? "bg-red-500" : "bg-amber-500"}`} />
              )}
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {client.businessName || `${client.serviceTier} - $${client.feeAmount}`}
            </p>
          </div>
          <Badge
            variant={
              client.returnStage === "filed" ? "default" :
              client.returnStage === "ready_to_sign" ? "default" :
              client.returnStage === "docs_collecting" ? "secondary" :
              "outline"
            }
            className="shrink-0 text-[10px]"
          >
            {stageLabels[client.returnStage]}
          </Badge>
        </div>

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
              {stats.map(({ label, value, displayValue, Icon, barColor }) => (
                <div key={label} className="mt-2">
                  <div className="mb-1 flex items-center justify-between text-xs font-medium text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Icon className="size-3.5" /> {label}
                    </div>
                    <span>{displayValue}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted">
                    <motion.div
                      className={`h-1.5 rounded-full ${barColor}`}
                      initial={{ width: 0 }}
                      animate={{ width: value }}
                      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                    />
                  </div>
                </div>
              ))}

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
          {client.documentsSubmitted}/{client.documentsRequired} docs - {stageLabels[client.returnStage]}
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

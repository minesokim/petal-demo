"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText, Signature, Calendar, Clock, DollarSign,
  ArrowRight, AlertTriangle, MessageSquare, ChevronRight,
  Send, Bell
} from "lucide-react";
import { type FeedAction } from "@/lib/actions-mock-data";

const categoryConfig: Record<string, { icon: typeof FileText; label: string }> = {
  document: { icon: FileText, label: "Documents" },
  signature: { icon: Signature, label: "E-Sign" },
  schedule: { icon: Calendar, label: "Schedule" },
  payment: { icon: DollarSign, label: "Payment" },
  pipeline: { icon: ArrowRight, label: "Pipeline" },
  escalation: { icon: AlertTriangle, label: "Follow-up" },
  nudge: { icon: Bell, label: "Nudge" },
};

interface ActionCardProps {
  action: FeedAction;
  onClick: () => void;
}

export function ActionCard({ action, onClick }: ActionCardProps) {
  const config = categoryConfig[action.category] || categoryConfig.document;
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      className="hover:bg-muted/50 flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors"
    >
      <Avatar className="size-9 shrink-0">
        <AvatarImage src={action.clientAvatar} alt={action.clientName} />
        <AvatarFallback className="text-[10px]">
          {action.clientName.split(" ").map(n => n[0]).join("").slice(0, 2)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">{action.title}</span>
          {action.priority <= 1 && <Badge variant="destructive" className="text-[10px]">Urgent</Badge>}
          {action.priority === 2 && <Badge variant="secondary" className="text-[10px]">High</Badge>}
          <Badge variant="outline" className="text-[10px]">
            <Icon className="mr-1 size-2.5" />
            {config.label}
          </Badge>
          {action.aiDraft && (
            <Badge variant="outline" className="border-green-200 text-[10px] text-green-700 dark:border-green-800 dark:text-green-400">
              AI Draft
            </Badge>
          )}
        </div>
        <div className="text-muted-foreground mt-0.5 text-xs">
          {action.clientName} &middot; {action.description.slice(0, 80)}{action.description.length > 80 ? "..." : ""}
        </div>
      </div>
      <ChevronRight className="text-muted-foreground mt-1 size-4 shrink-0" />
    </button>
  );
}

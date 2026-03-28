"use client";

import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
import { DocTypeBadge } from "./doc-type-badge";
import { type MockDocument } from "@/lib/documents-mock-data";

function timeAgo(date: string) {
  const now = new Date("2026-03-28T12:00:00");
  const d = new Date(date);
  const diff = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface DocumentRowProps {
  doc: MockDocument;
  showNew?: boolean;
  showDate?: boolean;
}

export function DocumentRow({ doc, showNew = false, showDate = false }: DocumentRowProps) {
  return (
    <div className="hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors">
      <DocTypeBadge type={doc.docTypeLabel} />
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium">{doc.fileName}</div>
        <div className="text-muted-foreground text-xs">
          {doc.clientName} &middot; {doc.fileSize} &middot; {showDate ? new Date(doc.uploadedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : timeAgo(doc.uploadedAt)}
        </div>
      </div>
      {showNew && !doc.viewedByPreparer && (
        <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 border-0 text-[10px]">New</Badge>
      )}
      {doc.status === "signed" && (
        <span className="text-muted-foreground text-[11px] font-medium">Signed</span>
      )}
      {doc.status === "ready_for_review" && (
        <Badge variant="outline" className="text-[10px]">Ready for review</Badge>
      )}
      <ChevronRight className="text-muted-foreground size-4 shrink-0" />
    </div>
  );
}

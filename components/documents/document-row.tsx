"use client";

import { Badge } from "@/components/ui/badge";
import { Download, ChevronRight } from "lucide-react";
import { DocTypeBadge } from "./doc-type-badge";
import { type MockDocument } from "@/lib/documents-mock-data";
import { getIntelligenceForDocument } from "@/lib/documents-mock-data";
import { useToast } from "@/components/ui/toast-notification";

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
  showClassification?: boolean;
  onOpen?: (doc: MockDocument) => void;
}

export function DocumentRow({ doc, showNew = false, showDate = false, showClassification = false, onOpen }: DocumentRowProps) {
  const { showToast } = useToast();
  const intel = getIntelligenceForDocument(doc.id);

  return (
    <div
      onClick={() => onOpen?.(doc)}
      className="hover:bg-muted/50 flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors"
    >
      <DocTypeBadge type={doc.docTypeLabel} />
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium">{doc.fileName.replace(/_/g, " ").replace(/\.[^.]+$/, "")}</div>
        <div className="text-muted-foreground text-xs">
          {doc.fileSize} &middot; {showDate ? new Date(doc.uploadedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : timeAgo(doc.uploadedAt)}
          {intel && (
            <span className="text-foreground/50"> &middot; {intel.keyDataPoints.length} fields extracted</span>
          )}
        </div>
      </div>
      {showNew && !doc.viewedByPreparer && (
        <div className="size-2 rounded-full bg-blue-500 shrink-0" />
      )}
      {doc.status === "signed" && (
        <span className="text-muted-foreground text-[11px]">Signed</span>
      )}
      {doc.status === "ready_for_review" && (
        <Badge variant="outline" className="text-[10px]">Review</Badge>
      )}
      <ChevronRight className="text-muted-foreground/40 size-4 shrink-0" />
    </div>
  );
}

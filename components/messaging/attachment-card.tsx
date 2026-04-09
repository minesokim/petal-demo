"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FileText, Check, ArrowRight, Loader2, Eye, RotateCcw } from "lucide-react";
import type { EmailAttachment } from "@/lib/comms-mock-data";
import { useToast } from "@/components/ui/toast-notification";
import { AttachmentPreviewDialog } from "./attachment-preview-dialog";

const docTypeLabels: Record<string, string> = {
  w2: "W-2", "1099_nec": "1099-NEC", "1099_int": "1099-INT", "1099_div": "1099-DIV", expense: "Expense", id: "ID",
};

interface AttachmentCardProps {
  attachment: EmailAttachment;
  isInbound?: boolean; // Only show Process/Ignore for inbound (client-sent) attachments
}

export function AttachmentCard({ attachment, isInbound = true }: AttachmentCardProps) {
  const [status, setStatus] = useState<"idle" | "processing" | "processed" | "ignored">("idle");
  const [previewOpen, setPreviewOpen] = useState(false);
  const { showToast } = useToast();

  const handleProcess = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setStatus("processing");
    setTimeout(() => {
      setStatus("processed");
      showToast("success", `${attachment.fileName} filed to documents`, "AI extraction started");
    }, 1200);
  };

  const handleIgnore = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setStatus("ignored");
  };

  const handleReprocess = () => {
    setStatus("processing");
    setTimeout(() => {
      setStatus("processed");
      showToast("success", `${attachment.fileName} filed to documents`, "AI extraction started");
    }, 1200);
  };

  const typeLabel = attachment.docType ? docTypeLabels[attachment.docType] : null;

  return (
    <>
      <div
        onClick={(e) => { e.stopPropagation(); setPreviewOpen(true); }}
        className={cn(
          "flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all cursor-pointer",
          status === "processed" && "border-emerald-200/60 bg-emerald-50/20 dark:border-emerald-800/40 dark:bg-emerald-950/10",
          status === "ignored" && "border-border/40 bg-muted/20",
          status === "idle" && "bg-card hover:bg-muted/30 hover:border-border",
          status === "processing" && "bg-card"
        )}
      >
        {/* Icon */}
        <div className={cn(
          "flex size-9 items-center justify-center rounded-lg",
          status === "processed" ? "bg-emerald-100 dark:bg-emerald-900/30" :
          status === "ignored" ? "bg-muted" : "bg-muted"
        )}>
          {status === "processing" ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          ) : status === "processed" ? (
            <Check className="size-4 text-emerald-600" />
          ) : (
            <FileText className="size-4 text-muted-foreground" />
          )}
        </div>

        {/* File info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={cn(
              "truncate text-xs font-medium",
              status === "ignored" && "text-muted-foreground"
            )}>
              {attachment.fileName}
            </span>
            {typeLabel && (
              <span className="shrink-0 rounded bg-muted px-1 py-0.5 text-[9px] font-medium text-muted-foreground">
                {typeLabel}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] text-muted-foreground">{attachment.fileSize}</span>
            {status === "processed" && (
              <span className="text-[10px] font-medium text-emerald-600">Filed</span>
            )}
            {status === "ignored" && (
              <span className="text-[10px] text-amber-600">Ignored</span>
            )}
          </div>
        </div>

        {/* Actions — only for inbound (client-sent) attachments */}
        {isInbound && status === "idle" && (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button size="sm" className="h-7 gap-1 px-3 text-[10px]" onClick={(e) => handleProcess(e)}>
              <ArrowRight className="size-3" /> Process
            </Button>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-[10px] text-muted-foreground" onClick={(e) => handleIgnore(e)}>
              Ignore
            </Button>
          </div>
        )}

        {isInbound && status === "ignored" && (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button size="sm" variant="outline" className="h-7 gap-1 px-3 text-[10px]" onClick={(e) => { e.stopPropagation(); handleReprocess(); }}>
              <RotateCcw className="size-3" /> Process
            </Button>
          </div>
        )}

        {isInbound && status === "processed" && (
          <Eye className="size-3.5 text-muted-foreground/40 shrink-0" />
        )}

        {/* Outbound attachments — just show the file, no actions */}
        {!isInbound && (
          <span className="text-[10px] text-muted-foreground/50 shrink-0">Sent</span>
        )}

        {status === "processing" && (
          <span className="text-[10px] text-muted-foreground shrink-0">Processing...</span>
        )}
      </div>

      {/* Preview dialog */}
      <AttachmentPreviewDialog
        attachment={previewOpen ? attachment : null}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        status={status}
        onProcess={() => {
          setStatus("processed");
          setPreviewOpen(false);
        }}
        onIgnore={() => {
          setStatus("ignored");
        }}
        onReprocess={() => {
          setStatus("processed");
          setPreviewOpen(false);
        }}
      />
    </>
  );
}

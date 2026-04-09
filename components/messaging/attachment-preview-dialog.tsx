"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Check, ArrowRight, X, Loader2 } from "lucide-react";
import type { EmailAttachment } from "@/lib/comms-mock-data";
import { useToast } from "@/components/ui/toast-notification";
import dynamic from "next/dynamic";

const PdfViewerInner = dynamic(
  () => import("@/components/documents/doc-panel/pdf-viewer-inner"),
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading...</div> }
);

const docTypeLabels: Record<string, string> = {
  w2: "W-2", "1099_nec": "1099-NEC", "1099_int": "1099-INT", "1099_div": "1099-DIV", expense: "Expense", id: "ID",
};

// Map attachment filenames to demo PDF paths (best effort)
function getAttachmentPdfPath(fileName: string): string | null {
  const name = fileName.replace(/\s/g, "_");
  // Try direct match in /docs/
  const candidates = [
    `/docs/${name}`,
    `/docs/${name.replace(".pdf", "")}.pdf`,
  ];
  // Known mappings
  const knownMap: Record<string, string> = {
    "1099-NEC_Revolve.pdf": "/docs/1099-NEC_Design_Clients.pdf",
    "Park_Dental_PL_2025.pdf": "/docs/W-2_Golden_Dragon_LLC.pdf", // placeholder
    "Payroll_Summary_Q4.pdf": "/docs/W-2_Regional_Hospital.pdf", // placeholder
    "Tyrone_Document_Checklist.pdf": "/docs/Engagement_Letter_2025.pdf", // placeholder
  };
  return knownMap[fileName] || null;
}

interface AttachmentPreviewDialogProps {
  attachment: EmailAttachment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: "idle" | "processing" | "processed" | "ignored";
  onProcess: () => void;
  onIgnore: () => void;
  onReprocess?: () => void;
}

export function AttachmentPreviewDialog({
  attachment,
  open,
  onOpenChange,
  status,
  onProcess,
  onIgnore,
  onReprocess,
}: AttachmentPreviewDialogProps) {
  const { showToast } = useToast();
  const [localProcessing, setLocalProcessing] = useState(false);

  if (!attachment) return null;

  const pdfPath = getAttachmentPdfPath(attachment.fileName);
  const typeLabel = attachment.docType ? docTypeLabels[attachment.docType] : null;

  const handleProcess = () => {
    setLocalProcessing(true);
    setTimeout(() => {
      setLocalProcessing(false);
      onProcess();
      showToast("success", `${attachment.fileName} filed to documents`, "AI extraction started");
    }, 1200);
  };

  const handleIgnore = () => {
    onIgnore();
    showToast("info", `${attachment.fileName} ignored`);
  };

  const handleReprocess = () => {
    setLocalProcessing(true);
    setTimeout(() => {
      setLocalProcessing(false);
      onReprocess?.();
      showToast("success", `${attachment.fileName} filed to documents`, "AI extraction started");
    }, 1200);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex !h-[85vh] !w-[80vw] !max-w-[80vw] flex-col gap-0 overflow-hidden p-0" showCloseButton={false}>
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="size-4 text-muted-foreground shrink-0" />
            <h2 className="text-sm font-semibold truncate">{attachment.fileName}</h2>
            <span className="text-xs text-muted-foreground shrink-0">{attachment.fileSize}</span>
            {typeLabel && (
              <Badge variant="outline" className="text-[10px] shrink-0">{typeLabel}</Badge>
            )}
            {status === "processed" && (
              <Badge variant="outline" className="text-[10px] border-emerald-200 text-emerald-700">Filed</Badge>
            )}
            {status === "ignored" && (
              <Badge variant="outline" className="text-[10px] border-amber-200 text-amber-700">Ignored</Badge>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Action buttons based on status */}
            {status === "idle" && !localProcessing && (
              <>
                <Button size="sm" className="h-8 gap-1.5 px-4 text-xs" onClick={handleProcess}>
                  <ArrowRight className="size-3.5" /> Process & File
                </Button>
                <Button size="sm" variant="outline" className="h-8 px-3 text-xs text-muted-foreground" onClick={handleIgnore}>
                  Ignore
                </Button>
              </>
            )}
            {localProcessing && (
              <Button size="sm" disabled className="h-8 gap-1.5 px-4 text-xs">
                <Loader2 className="size-3.5 animate-spin" /> Processing...
              </Button>
            )}
            {status === "processed" && !localProcessing && (
              <div className="flex items-center gap-2 text-xs text-emerald-600">
                <Check className="size-3.5" />
                <span className="font-medium">Filed to documents</span>
              </div>
            )}
            {status === "ignored" && !localProcessing && (
              <Button size="sm" variant="outline" className="h-8 gap-1.5 px-4 text-xs" onClick={handleReprocess}>
                <ArrowRight className="size-3.5" /> Process anyway
              </Button>
            )}
            <Button variant="ghost" size="icon-sm" onClick={() => onOpenChange(false)}>
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Body: PDF + summary side by side */}
        <div className="flex flex-1 overflow-hidden">
          {/* PDF viewer */}
          <div className="flex-1 overflow-hidden">
            {pdfPath ? (
              <PdfViewerInner pdfPath={pdfPath} />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center bg-muted/5">
                <div className="flex size-20 items-center justify-center rounded-2xl bg-muted/60">
                  <FileText className="size-9 text-muted-foreground/30" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground/70">{attachment.fileName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Document preview will be available after processing
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right: AI summary placeholder */}
          <div className="w-[360px] shrink-0 border-l border-border/40 flex flex-col overflow-y-auto">
            <div className="px-5 py-4 border-b border-border/30">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Document Details
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">File name</span>
                  <span className="font-medium">{attachment.fileName}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Size</span>
                  <span className="font-medium">{attachment.fileSize}</span>
                </div>
                {typeLabel && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Detected type</span>
                    <span className="font-medium">{typeLabel}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Source</span>
                  <span className="font-medium">Email attachment</span>
                </div>
              </div>
            </div>

            {status === "idle" && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
                <div className="rounded-lg border border-dashed border-border/60 p-6 w-full">
                  <p className="text-sm text-muted-foreground">
                    Process this document to extract data and file it to the client's document list.
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground/60">
                    AI will automatically classify, extract fields, and flag any issues.
                  </p>
                </div>
              </div>
            )}

            {status === "processed" && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/30 p-6 w-full dark:border-emerald-900 dark:bg-emerald-950/20">
                  <Check className="mx-auto size-8 text-emerald-500 mb-2" />
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    Document filed successfully
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    AI extraction is running. Check the Documents tab for results.
                  </p>
                </div>
              </div>
            )}

            {status === "ignored" && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
                <div className="rounded-lg border border-amber-200 bg-amber-50/20 p-6 w-full dark:border-amber-900 dark:bg-amber-950/20">
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Document was ignored
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    You can still process it later by clicking "Process anyway" above.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

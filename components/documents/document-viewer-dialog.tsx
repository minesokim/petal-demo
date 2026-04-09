"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getDocumentById,
  getIntelligenceForDocument,
  type MockDocument,
  type DocumentFlag,
} from "@/lib/documents-mock-data";
import {
  Check,
  Flag,
  FileText,
  Download,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";

// Lazy-load PDF viewer
const PdfViewerInner = dynamic(
  () => import("./doc-panel/pdf-viewer-inner"),
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading viewer...</div> }
);

// ── Flag dot ──
function FlagDot({ type }: { type: DocumentFlag["type"] }) {
  return (
    <div
      className={cn(
        "size-1.5 rounded-full shrink-0",
        type === "error" && "bg-red-500",
        type === "warning" && "bg-amber-500",
        type === "info" && "bg-blue-500"
      )}
    />
  );
}

// ── Field verification toggle ──
function FieldVerification({ defaultVerified = false }: { defaultVerified?: boolean }) {
  const [verified, setVerified] = useState(defaultVerified);
  return (
    <button
      onClick={() => setVerified(!verified)}
      className={cn(
        "flex size-5 items-center justify-center rounded transition-all",
        verified
          ? "bg-emerald-500/10 text-emerald-600"
          : "bg-muted text-muted-foreground hover:bg-muted/80"
      )}
      title={verified ? "Verified" : "Click to verify"}
    >
      {verified ? <Check className="size-3" /> : <Flag className="size-2.5" />}
    </button>
  );
}

// ── Main Dialog ──
interface DocumentViewerDialogProps {
  document: MockDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Navigate to adjacent documents */
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export function DocumentViewerDialog({
  document: doc,
  open,
  onOpenChange,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: DocumentViewerDialogProps) {
  const [showPriorYear, setShowPriorYear] = useState(false);

  if (!doc) return null;

  const intel = getIntelligenceForDocument(doc.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex !h-[88vh] !w-[92vw] !max-w-[92vw] flex-col gap-0 overflow-hidden p-0" showCloseButton={false}>
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <Badge variant="outline" className="text-[10px] shrink-0">
              {doc.docTypeLabel}
            </Badge>
            <h2 className="text-sm font-semibold truncate">
              {doc.fileName.replace(/_/g, " ").replace(/\.[^.]+$/, "")}
            </h2>
            <span className="text-xs text-muted-foreground shrink-0">{doc.fileSize}</span>
            {doc.status === "signed" && (
              <Badge variant="outline" className="text-[10px] border-emerald-200 text-emerald-700">Signed</Badge>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {/* Doc navigation */}
            {(hasPrev || hasNext) && (
              <div className="flex items-center gap-0.5 mr-2">
                <Button variant="ghost" size="icon-xs" onClick={onPrev} disabled={!hasPrev}>
                  <ChevronLeft className="size-3.5" />
                </Button>
                <Button variant="ghost" size="icon-xs" onClick={onNext} disabled={!hasNext}>
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            )}
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
              <Download className="size-3" /> Download
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => onOpenChange(false)}>
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Body: two-column */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: PDF or placeholder */}
          <div className="flex-1 overflow-hidden border-r border-border/40">
            {doc.demoPdfPath ? (
              <PdfViewerInner pdfPath={doc.demoPdfPath} />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center bg-muted/10">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-muted/60">
                  <FileText className="size-7 text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Preview not available for this file
                </p>
              </div>
            )}
          </div>

          {/* Right: Extracted data */}
          <div className="w-[420px] shrink-0 flex flex-col overflow-y-auto">
            {intel ? (
              <>
                {/* Summary */}
                <div className="border-b border-border/30 px-5 py-4">
                  <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Summary
                  </h3>
                  <p className="text-sm leading-relaxed text-foreground/85">
                    {intel.aiSummary}
                  </p>
                </div>

                {/* Flags */}
                {intel.flags.length > 0 && (
                  <div className="border-b border-border/30 px-5 py-3">
                    <div className="space-y-1.5">
                      {intel.flags.map((flag, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <FlagDot type={flag.type} />
                          <p className="text-xs leading-snug text-muted-foreground">{flag.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Extracted fields */}
                <div className="flex-1 px-5 py-4">
                  <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Extracted Fields
                  </h4>
                  <div className="space-y-0">
                    {intel.keyDataPoints.map((point, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between border-b border-border/20 py-2.5 last:border-0"
                      >
                        <span className="text-xs text-muted-foreground">{point.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium tabular-nums">{point.value}</span>
                          <FieldVerification defaultVerified={i < 2} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Prior year */}
                {intel.priorYearComparison && (
                  <div className="border-t border-border/30 px-5 py-3">
                    <button
                      onClick={() => setShowPriorYear(!showPriorYear)}
                      className="flex w-full items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ChevronDown className={cn("size-3 transition-transform", showPriorYear && "rotate-180")} />
                      Prior year comparison
                    </button>
                    {showPriorYear && (
                      <p className="mt-2 text-xs italic leading-relaxed text-muted-foreground/80">
                        {intel.priorYearComparison}
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : (
              /* No AI intelligence */
              <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
                  <FileText className="size-5 text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground">No extracted data yet</p>
                <p className="text-xs text-muted-foreground/60">
                  AI analysis will run automatically after upload
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

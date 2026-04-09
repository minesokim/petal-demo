"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  getDocumentById,
  getIntelligenceForDocument,
  type DocumentIntelligence,
  type DocumentFlag,
} from "@/lib/documents-mock-data";
import {
  Check,
  AlertTriangle,
  Info,
  Flag,
  FileSearch,
  FileText,
  ChevronDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ExtractionPanelProps {
  documentId: string | null;
}

// Flag severity dot
function FlagDot({ type }: { type: DocumentFlag["type"] }) {
  return (
    <div
      className={cn(
        "size-1.5 rounded-full flex-shrink-0",
        type === "error" && "bg-red-500",
        type === "warning" && "bg-amber-500",
        type === "info" && "bg-blue-500"
      )}
    />
  );
}

// Verification toggle for each field
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

export function ExtractionPanel({ documentId }: ExtractionPanelProps) {
  const [showPriorYear, setShowPriorYear] = useState(false);

  // No document selected
  if (!documentId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center px-6">
        <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
          <FileSearch className="size-5 text-muted-foreground/40" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground/70">Extracted Data</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Select a document to see extracted data
          </p>
        </div>
      </div>
    );
  }

  const doc = getDocumentById(documentId);
  const intel = getIntelligenceForDocument(documentId);

  if (!doc) return null;

  // No AI intelligence for this document
  if (!intel) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Extracted Data</span>
        </div>
        <div className="rounded-lg border border-dashed border-border/60 p-6 text-center">
          <FileText className="mx-auto mb-2 size-6 text-muted-foreground/30" />
          <p className="text-xs text-muted-foreground">
            AI analysis pending for this document
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground/60">
            Processing typically takes 10–30 seconds
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* Header */}
      <div className="border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Extracted Data
          </span>
        </div>
        <h3 className="mt-1 text-sm font-medium leading-snug">
          {doc.fileName.replace(/_/g, " ").replace(/\.[^.]+$/, "")}
        </h3>
        <Badge variant="outline" className="mt-1.5 text-[10px]">
          {doc.docTypeLabel}
        </Badge>
      </div>

      {/* AI Summary */}
      <div className="border-b border-border/30 px-4 py-3">
        <p className="text-sm leading-relaxed text-foreground/85">
          {intel.aiSummary}
        </p>
      </div>

      {/* Flags — inline with fields context */}
      {intel.flags.length > 0 && (
        <div className="border-b border-border/30 px-4 py-2.5">
          <div className="space-y-1.5">
            {intel.flags.map((flag, i) => (
              <div key={i} className="flex items-start gap-2">
                <FlagDot type={flag.type} />
                <p className="text-xs leading-snug text-muted-foreground">
                  {flag.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Data Points */}
      <div className="flex-1 px-4 py-3">
        <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Extracted Fields
        </h4>
        <div className="space-y-0">
          {intel.keyDataPoints.map((point, i) => (
            <div
              key={i}
              className="flex items-center justify-between border-b border-border/20 py-2 last:border-0"
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

      {/* Prior year comparison */}
      {intel.priorYearComparison && (
        <div className="border-t border-border/30 px-4 py-3">
          <button
            onClick={() => setShowPriorYear(!showPriorYear)}
            className="flex w-full items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronDown
              className={cn(
                "size-3 transition-transform duration-150",
                showPriorYear && "rotate-180"
              )}
            />
            <span>Prior year comparison</span>
          </button>
          {showPriorYear && (
            <p className="mt-2 text-xs italic leading-relaxed text-muted-foreground/80">
              {intel.priorYearComparison}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getDocumentById,
  getIntelligenceForDocument,
  getClientDocuments,
  groupDocumentsByCategory,
  getClientChecklist,
  type MockDocument,
  type DocumentFlag,
} from "@/lib/documents-mock-data";
import {
  Check,
  Flag,
  FileText,
  Download,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
  Eye,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";

const PdfViewerInner = dynamic(
  () => import("./doc-panel/pdf-viewer-inner"),
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading viewer...</div> }
);

// ── Flag dot ──
function FlagDot({ type }: { type: DocumentFlag["type"] }) {
  return (
    <div className={cn(
      "size-1.5 rounded-full shrink-0",
      type === "error" && "bg-red-500",
      type === "warning" && "bg-amber-500",
      type === "info" && "bg-blue-500"
    )} />
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
        verified ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground hover:bg-muted/80"
      )}
    >
      {verified ? <Check className="size-3" /> : <Flag className="size-2.5" />}
    </button>
  );
}

// ── Doc status icon for tree ──
function DocStatusIcon({ doc }: { doc: MockDocument }) {
  if (doc.status === "signed") return <CheckCircle2 className="size-3 text-emerald-500" />;
  if (doc.status === "ready_for_review") return <Eye className="size-3 text-blue-500" />;
  if (!doc.viewedByPreparer) return <div className="size-1.5 rounded-full bg-blue-500" />;
  return <CheckCircle2 className="size-3 text-emerald-500/50" />;
}

// ── Document Tree (left column) ──
function ViewerDocTree({ clientId, selectedDocId, onSelect }: {
  clientId: string;
  selectedDocId: string;
  onSelect: (docId: string) => void;
}) {
  const groups = groupDocumentsByCategory(clientId);
  const checklist = getClientChecklist(clientId);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(groups.map(g => g.category)));

  const toggle = (cat: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-0.5 py-2 px-2">
      {groups.map(group => {
        const isOpen = expanded.has(group.category);
        return (
          <div key={group.category}>
            <button
              onClick={() => toggle(group.category)}
              className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted/60"
            >
              <ChevronRight className={cn("size-3 text-muted-foreground/50 transition-transform", isOpen && "rotate-90")} />
              <span className="flex-1 font-medium text-foreground/80">{group.label}</span>
              <span className="text-[9px] tabular-nums text-muted-foreground/50">
                {group.docs.length}
              </span>
            </button>
            {isOpen && (
              <div className="ml-2 border-l border-border/30 pl-1.5">
                {group.docs.map(doc => (
                  <button
                    key={doc.id}
                    onClick={() => onSelect(doc.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
                      selectedDocId === doc.id
                        ? "bg-primary/5 text-foreground"
                        : "text-foreground/70 hover:bg-muted/40"
                    )}
                  >
                    <DocStatusIcon doc={doc} />
                    <span className="flex-1 truncate text-[11px] leading-tight">
                      {doc.fileName.replace(/_/g, " ").replace(/\.[^.]+$/, "")}
                    </span>
                  </button>
                ))}
                {group.missing.map(item => (
                  <div key={item.id} className="flex items-center gap-2 px-2 py-1.5">
                    <Clock className="size-3 text-amber-500/60" />
                    <span className="flex-1 truncate text-[11px] italic text-muted-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main Dialog ──
interface DocumentViewerDialogProps {
  document: MockDocument | null;
  clientId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentViewerDialog({
  document: initialDoc,
  clientId,
  open,
  onOpenChange,
}: DocumentViewerDialogProps) {
  const [selectedDocId, setSelectedDocId] = useState<string | null>(initialDoc?.id || null);
  const [showPriorYear, setShowPriorYear] = useState(false);

  // Update selectedDocId when a new document is passed in
  const effectiveDocId = selectedDocId || initialDoc?.id || null;
  const doc = effectiveDocId ? getDocumentById(effectiveDocId) : initialDoc;
  const resolvedClientId = clientId || doc?.clientId || "";
  const intel = doc ? getIntelligenceForDocument(doc.id) : null;

  // Reset selection when dialog opens with a new doc
  if (initialDoc && initialDoc.id !== selectedDocId && open) {
    setSelectedDocId(initialDoc.id);
  }

  if (!doc) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setSelectedDocId(null); }}>
      <DialogContent className="flex !h-[88vh] !w-[92vw] !max-w-[92vw] flex-col gap-0 overflow-hidden p-0" showCloseButton={false}>
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-2.5 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Badge variant="outline" className="text-[10px] shrink-0">{doc.docTypeLabel}</Badge>
            <h2 className="text-sm font-semibold truncate">
              {doc.fileName.replace(/_/g, " ").replace(/\.[^.]+$/, "")}
            </h2>
            <span className="text-xs text-muted-foreground shrink-0">{doc.fileSize}</span>
            {doc.status === "signed" && (
              <Badge variant="outline" className="text-[10px] border-emerald-200 text-emerald-700">Signed</Badge>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
              <Download className="size-3" /> Download
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => onOpenChange(false)}>
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Body: three columns */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Document tree */}
          <div className="w-[220px] shrink-0 border-r border-border/40 overflow-y-auto bg-muted/5">
            <div className="px-3 pt-3 pb-1">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Documents</span>
            </div>
            <ViewerDocTree
              clientId={resolvedClientId}
              selectedDocId={doc.id}
              onSelect={(id) => { setSelectedDocId(id); setShowPriorYear(false); }}
            />
          </div>

          {/* Center: PDF viewer */}
          <div className="flex-1 overflow-hidden">
            {doc.demoPdfPath ? (
              <PdfViewerInner pdfPath={doc.demoPdfPath} />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center bg-muted/5">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-muted/60">
                  <FileText className="size-7 text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground">Preview not available</p>
              </div>
            )}
          </div>

          {/* Right: Extracted data */}
          <div className="w-[380px] shrink-0 border-l border-border/40 flex flex-col overflow-y-auto">
            {intel ? (
              <>
                <div className="border-b border-border/30 px-5 py-4">
                  <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Summary</h3>
                  <p className="text-sm leading-relaxed text-foreground/85">{intel.aiSummary}</p>
                </div>

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

                <div className="flex-1 px-5 py-4">
                  <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Extracted Fields</h4>
                  {intel.keyDataPoints.map((point, i) => (
                    <div key={i} className="flex items-center justify-between border-b border-border/20 py-2.5 last:border-0">
                      <span className="text-xs text-muted-foreground">{point.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium tabular-nums">{point.value}</span>
                        <FieldVerification defaultVerified={i < 2} />
                      </div>
                    </div>
                  ))}
                </div>

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
                      <p className="mt-2 text-xs italic leading-relaxed text-muted-foreground/80">{intel.priorYearComparison}</p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                <FileText className="size-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No extracted data yet</p>
                <p className="text-xs text-muted-foreground/60">AI analysis runs automatically after upload</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

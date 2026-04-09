"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  X, ChevronRight, Clock, FileText, Check, CheckCircle2, Eye,
  AlertTriangle, Send, Flag, ArrowLeft, ClipboardList
} from "lucide-react";
import { cn } from "@/lib/utils";
import { clients, getClientPaymentSummary, type Client } from "@/lib/mock-data";
import {
  getClientDocuments, groupDocumentsByCategory, getClientChecklist,
  getIntelligenceForDocument, getDocumentById,
  type MockDocument
} from "@/lib/documents-mock-data";
import {
  anomalyAlerts, deductionSuggestions, extensionPredictions,
  complianceAlerts, documentExtractions
} from "@/lib/actions-mock-data";
import { getOpenIssues } from "@/lib/issues-mock-data";
import dynamic from "next/dynamic";

const PdfViewerInner = dynamic(
  () => import("@/components/documents/doc-panel/pdf-viewer-inner"),
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading viewer...</div> }
);

// ── Document status icon ──
function DocStatusIcon({ doc }: { doc: MockDocument }) {
  if (doc.status === "signed") return <CheckCircle2 className="size-3 text-emerald-500" />;
  if (doc.status === "ready_for_review") return <Eye className="size-3 text-blue-500" />;
  if (!doc.viewedByPreparer) return <div className="size-1.5 rounded-full bg-blue-500" />;
  return <CheckCircle2 className="size-3 text-emerald-500/50" />;
}

// ── Document Tree (left panel) ──
function DocTree({ clientId, selectedDocId, onSelect, onSummary, showingSummary }: {
  clientId: string; selectedDocId: string | null; onSelect: (docId: string) => void;
  onSummary: () => void; showingSummary: boolean;
}) {
  const groups = groupDocumentsByCategory(clientId);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(groups.map(g => g.category)));

  const toggle = (cat: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  // Separate working docs from administrative
  const workingCategories = ["income", "business", "deductions", "returns"];
  const adminCategories = ["identity", "agreements"];

  const workingGroups = groups.filter(g => workingCategories.includes(g.category));
  const adminGroups = groups.filter(g => adminCategories.includes(g.category));

  const renderGroup = (group: typeof groups[0]) => {
    const isOpen = expanded.has(group.category);
    return (
      <div key={group.category}>
        <button
          onClick={() => toggle(group.category)}
          className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted/60"
        >
          <ChevronRight className={cn("size-3 text-muted-foreground/50 transition-transform", isOpen && "rotate-90")} />
          <span className="flex-1 font-medium text-foreground">{group.label}</span>
          <span className="text-[9px] tabular-nums text-muted-foreground/50">{group.docs.length}</span>
        </button>
        {isOpen && (
          <div className="ml-2 border-l border-border/30 pl-1.5">
            {group.docs.map(doc => (
              <button
                key={doc.id}
                onClick={() => onSelect(doc.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
                  !showingSummary && selectedDocId === doc.id
                    ? "bg-primary/5 text-foreground font-medium"
                    : "text-foreground hover:bg-muted/40"
                )}
              >
                <DocStatusIcon doc={doc} />
                <span className="flex-1 truncate text-xs leading-tight">
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
  };

  return (
    <div className="flex flex-col gap-0.5 py-2 px-2">
      {/* Prep Summary link */}
      <button
        onClick={onSummary}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs transition-colors mb-1",
          showingSummary
            ? "bg-blue-50 text-blue-700 font-medium"
            : "text-foreground hover:bg-muted/40"
        )}
      >
        <ClipboardList className="size-3.5" />
        <span className="font-medium">Prep Summary</span>
      </button>

      <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground px-2 pt-1 pb-0.5">Working Documents</div>
      {workingGroups.map(renderGroup)}

      {adminGroups.length > 0 && (
        <>
          <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground px-2 pt-3 pb-0.5">Administrative</div>
          {adminGroups.map(renderGroup)}
        </>
      )}
    </div>
  );
}

// ── Prep Summary (center panel default) ──
function PrepSummary({ client, onDocClick }: { client: Client; onDocClick: (docId: string) => void }) {
  const docs = getClientDocuments(client.id);
  const workingDocs = docs.filter(d => ["income", "business", "deductions"].includes(d.docCategory));
  const returnDocs = docs.filter(d => d.docCategory === "returns");

  // Group by tax topic
  const incomeDocs = docs.filter(d => d.docCategory === "income");
  const businessDocs = docs.filter(d => d.docCategory === "business");
  const deductionDocs = docs.filter(d => d.docCategory === "deductions");

  const renderDocLine = (doc: MockDocument) => {
    const intel = getIntelligenceForDocument(doc.id);
    return (
      <button
        key={doc.id}
        onClick={() => onDocClick(doc.id)}
        className="flex w-full items-center justify-between rounded-lg border bg-card px-3 py-2.5 text-left transition-all hover:shadow-sm hover:border-primary/20"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[9px] h-5 px-1.5 shrink-0">{doc.docTypeLabel}</Badge>
            <span className="text-sm font-medium truncate">{doc.fileName.replace(/_/g, " ").replace(/\.[^.]+$/, "")}</span>
            {intel?.flags?.some(f => f.type === "warning" || f.type === "error") && (
              <AlertTriangle className="size-3 text-amber-500 shrink-0" />
            )}
          </div>
          {intel && intel.keyDataPoints.length > 0 && (
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              {intel.keyDataPoints.slice(0, 3).map((kv, i) => (
                <span key={i}>
                  {kv.label}: <span className="font-medium text-foreground tabular-nums">{kv.value}</span>
                  {i < Math.min(2, intel.keyDataPoints.length - 1) && <span className="text-muted-foreground/30 ml-2">·</span>}
                </span>
              ))}
            </div>
          )}
          {intel?.priorYearComparison && (
            <div className="text-[11px] text-muted-foreground mt-0.5 italic">{intel.priorYearComparison}</div>
          )}
        </div>
        <ChevronRight className="size-3.5 text-muted-foreground/30 shrink-0 ml-2" />
      </button>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Client info */}
      <div>
        <h2 className="text-lg font-display tracking-tight">{client.fullName}</h2>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
          {client.businessName && <span>{client.businessName}</span>}
          {client.businessName && <span>·</span>}
          <span>{client.filingStatus === "mfj" ? "Married Filing Jointly" : client.filingStatus === "single" ? "Single" : client.filingStatus === "hoh" ? "Head of Household" : client.filingStatus}</span>
          <span>·</span>
          <span>{client.serviceTier}</span>
        </div>
      </div>

      {/* Income */}
      {incomeDocs.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Income</h3>
          <div className="space-y-1.5">
            {incomeDocs.map(renderDocLine)}
          </div>
        </div>
      )}

      {/* Business */}
      {businessDocs.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Business</h3>
          <div className="space-y-1.5">
            {businessDocs.map(renderDocLine)}
          </div>
        </div>
      )}

      {/* Deductions */}
      {deductionDocs.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Deductions</h3>
          <div className="space-y-1.5">
            {deductionDocs.map(renderDocLine)}
          </div>
        </div>
      )}

      {/* Return documents */}
      {returnDocs.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Return</h3>
          <div className="space-y-1.5">
            {returnDocs.map(renderDocLine)}
          </div>
        </div>
      )}

      {workingDocs.length === 0 && (
        <div className="py-12 text-center text-sm text-muted-foreground">No working documents yet</div>
      )}
    </div>
  );
}

// ── Document Preview (center panel when doc selected) ──
function DocPreview({ doc }: { doc: MockDocument }) {
  return (
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
  );
}

// ── Right Sidebar ──
function PrepSidebar({ client, showingSummary, selectedDoc, onCompletePrep }: {
  client: Client; showingSummary: boolean; selectedDoc: MockDocument | null;
  onCompletePrep: () => void;
}) {
  const flags = getOpenIssues(client.id);
  const ps = getClientPaymentSummary(client.id);
  const intel = selectedDoc ? getIntelligenceForDocument(selectedDoc.id) : null;

  // Prep timer (mock: days since last activity change)
  const prepDays = Math.floor((Date.now() - new Date(client.lastActivity).getTime()) / (1000 * 60 * 60 * 24));

  if (!showingSummary && selectedDoc && intel) {
    // Document-specific sidebar
    return (
      <div className="flex flex-col overflow-y-auto">
        <div className="border-b border-border/30 px-5 py-4">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Summary</h3>
          <p className="text-sm leading-relaxed text-foreground/85">{intel.aiSummary}</p>
        </div>

        {intel.flags.length > 0 && (
          <div className="border-b border-border/30 px-5 py-3 space-y-1.5">
            {intel.flags.map((flag, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className={cn(
                  "size-1.5 rounded-full shrink-0 mt-1.5",
                  flag.type === "error" && "bg-red-500",
                  flag.type === "warning" && "bg-amber-500",
                  flag.type === "info" && "bg-blue-500"
                )} />
                <p className="text-xs leading-snug text-muted-foreground">{flag.message}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex-1 px-5 py-4">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Extracted Fields</h4>
          {intel.keyDataPoints.map((point, i) => (
            <div key={i} className="flex items-center justify-between border-b border-border/20 py-2.5 last:border-0">
              <span className="text-xs text-muted-foreground">{point.label}</span>
              <span className="text-sm font-medium tabular-nums">{point.value}</span>
            </div>
          ))}
        </div>

        {intel.priorYearComparison && (
          <div className="border-t border-border/30 px-5 py-3">
            <p className="text-[11px] text-muted-foreground italic">{intel.priorYearComparison}</p>
          </div>
        )}
      </div>
    );
  }

  // Prep Summary sidebar
  return (
    <div className="flex flex-col overflow-y-auto">
      {/* Prep timer */}
      <div className="border-b border-border/30 px-5 py-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="size-3.5" />
          <span>In preparation for <span className="font-medium text-foreground">{prepDays} days</span></span>
        </div>
      </div>

      {/* Open flags */}
      <div className="border-b border-border/30 px-5 py-4">
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Flags
          {flags.length > 0 && (
            <span className="ml-1.5 inline-flex size-4 items-center justify-center rounded-full bg-foreground/10 text-[9px] font-semibold tabular-nums">
              {flags.length}
            </span>
          )}
        </h4>
        {flags.length > 0 ? (
          <div className="space-y-2">
            {flags.map(flag => (
              <div key={flag.id} className="flex items-start gap-2">
                <span className={cn(
                  "size-1.5 rounded-full shrink-0 mt-1.5",
                  flag.priority === "critical" || flag.priority === "high" ? "bg-red-500" :
                  flag.priority === "medium" ? "bg-amber-500" : "bg-muted-foreground/30"
                )} />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium">{flag.title}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-emerald-600 flex items-center gap-1"><Check className="size-3" /> All flags resolved</p>
        )}
      </div>

      {/* Payment status */}
      <div className="border-b border-border/30 px-5 py-4">
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Payment</h4>
        <div className="text-xs">
          <span className="font-display text-base">${ps.totalPaid}</span>
          <span className="text-muted-foreground"> of ${ps.totalFee}</span>
        </div>
        <div className={cn("text-[11px] mt-0.5", ps.fullyPaid ? "text-emerald-600" : ps.hasOverdue ? "text-red-500" : "text-muted-foreground")}>
          {ps.fullyPaid ? "Paid in full" : ps.hasOverdue ? `$${ps.totalOwed} overdue` : `$${ps.totalOwed} remaining`}
        </div>
      </div>

      {/* Complete Preparation */}
      <div className="px-5 py-4">
        <Button className="w-full" onClick={onCompletePrep}>
          <Send className="size-3.5" /> Complete Preparation
        </Button>
      </div>
    </div>
  );
}

// ── Main Modal ──
interface PrepWorkspaceModalProps {
  client: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompletePrep: () => void;
}

export function PrepWorkspaceModal({ client, open, onOpenChange, onCompletePrep }: PrepWorkspaceModalProps) {
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [showingSummary, setShowingSummary] = useState(true);

  const selectedDoc = selectedDocId ? getDocumentById(selectedDocId) : null;

  const handleDocSelect = (docId: string) => {
    setSelectedDocId(docId);
    setShowingSummary(false);
  };

  const handleSummary = () => {
    setShowingSummary(true);
    setSelectedDocId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex !h-[90vh] !w-[94vw] !max-w-[94vw] flex-col gap-0 overflow-hidden p-0" showCloseButton={false}>
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-2.5 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {!showingSummary && (
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={handleSummary}>
                <ArrowLeft className="size-3" /> Summary
              </Button>
            )}
            {showingSummary ? (
              <>
                <ClipboardList className="size-4 text-blue-600" />
                <h2 className="text-sm font-semibold">Prep Workspace</h2>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{client.fullName}</span>
              </>
            ) : selectedDoc ? (
              <>
                <Badge variant="outline" className="text-[10px] shrink-0">{selectedDoc.docTypeLabel}</Badge>
                <h2 className="text-sm font-semibold truncate">
                  {selectedDoc.fileName.replace(/_/g, " ").replace(/\.[^.]+$/, "")}
                </h2>
                <span className="text-xs text-muted-foreground shrink-0">{selectedDoc.fileSize}</span>
              </>
            ) : null}
          </div>
          <Button variant="ghost" size="icon-sm" onClick={() => onOpenChange(false)}>
            <X className="size-4" />
          </Button>
        </div>

        {/* Body: three panels */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Document tree */}
          <div className="w-[220px] shrink-0 border-r border-border/40 overflow-y-auto bg-muted/5">
            <DocTree
              clientId={client.id}
              selectedDocId={selectedDocId}
              onSelect={handleDocSelect}
              onSummary={handleSummary}
              showingSummary={showingSummary}
            />
          </div>

          {/* Center: Prep Summary or Document Preview */}
          {showingSummary ? (
            <PrepSummary client={client} onDocClick={handleDocSelect} />
          ) : selectedDoc ? (
            <DocPreview doc={selectedDoc} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
              Select a document
            </div>
          )}

          {/* Right: Contextual sidebar */}
          <div className="w-[320px] shrink-0 border-l border-border/40 overflow-y-auto">
            <PrepSidebar
              client={client}
              showingSummary={showingSummary}
              selectedDoc={selectedDoc}
              onCompletePrep={onCompletePrep}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

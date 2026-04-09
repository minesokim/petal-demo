"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  X, ChevronRight, ChevronDown, Clock, FileText, Check, CheckCircle2, Eye,
  AlertTriangle, Send, ArrowLeft, ClipboardList, Download, BotIcon, MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getClientPaymentSummary, type Client } from "@/lib/mock-data";
import {
  getClientDocuments, groupDocumentsByCategory, getClientChecklist,
  getIntelligenceForDocument, getDocumentById, getDocumentIntelligence,
  type MockDocument, type DocumentIntelligence
} from "@/lib/documents-mock-data";
import { getOpenIssues, type ClientIssue } from "@/lib/issues-mock-data";
import { getInsightForClient } from "@/lib/insights-mock-data";
import { motion, AnimatePresence } from "motion/react";
import dynamic from "next/dynamic";

const PdfViewerInner = dynamic(
  () => import("@/components/documents/doc-panel/pdf-viewer-inner"),
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading viewer...</div> }
);

// ── Helpers ──
function parseAmount(val: string): number {
  return parseFloat(val.replace(/[$,]/g, "")) || 0;
}

// ── Doc status icon ──
function DocStatusIcon({ doc }: { doc: MockDocument }) {
  if (doc.status === "signed") return <CheckCircle2 className="size-3 text-emerald-500" />;
  if (!doc.viewedByPreparer) return <div className="size-1.5 rounded-full bg-blue-500" />;
  return <CheckCircle2 className="size-3 text-emerald-500/50" />;
}

// ═══════════════════════════════════════════════
// LEFT PANEL: Document Tree
// ═══════════════════════════════════════════════
function DocTree({ clientId, selectedDocId, onSelect, onSummary, showingSummary }: {
  clientId: string; selectedDocId: string | null; onSelect: (docId: string) => void;
  onSummary: () => void; showingSummary: boolean;
}) {
  const groups = groupDocumentsByCategory(clientId);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(groups.map(g => g.category)));
  const toggle = (cat: string) => setExpanded(prev => { const n = new Set(prev); n.has(cat) ? n.delete(cat) : n.add(cat); return n; });

  const workingCategories = ["income", "business", "deductions", "returns"];
  const adminCategories = ["identity", "agreements"];
  const workingGroups = groups.filter(g => workingCategories.includes(g.category));
  const adminGroups = groups.filter(g => adminCategories.includes(g.category));

  const renderGroup = (group: typeof groups[0]) => {
    const isOpen = expanded.has(group.category);
    return (
      <div key={group.category}>
        <button onClick={() => toggle(group.category)} className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted/60">
          <ChevronRight className={cn("size-3 text-muted-foreground/50 transition-transform", isOpen && "rotate-90")} />
          <span className="flex-1 font-medium">{group.label}</span>
          <span className="text-[9px] tabular-nums text-muted-foreground/50">{group.docs.length}</span>
        </button>
        {isOpen && (
          <div className="ml-2 border-l border-border/30 pl-1.5">
            {group.docs.map(doc => (
              <button key={doc.id} onClick={() => onSelect(doc.id)} className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
                !showingSummary && selectedDocId === doc.id ? "bg-primary/5 font-medium" : "hover:bg-muted/40"
              )}>
                <DocStatusIcon doc={doc} />
                <span className="flex-1 truncate text-xs">{doc.fileName.replace(/_/g, " ").replace(/\.[^.]+$/, "")}</span>
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
      <button onClick={onSummary} className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs transition-colors mb-1",
        showingSummary ? "bg-blue-50 text-blue-700 font-medium" : "hover:bg-muted/40"
      )}>
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

// ═══════════════════════════════════════════════
// PREP SUMMARY LINE ITEM
// ═══════════════════════════════════════════════
function SummaryLineItem({ label, source, amount, priorYear, verified, onDocClick, flagType, docTypeBadge, allFields }: {
  label: string; source: string; amount: string; priorYear?: string;
  verified?: boolean; onDocClick?: () => void; flagType?: "info" | "warning" | "error";
  docTypeBadge?: string; allFields?: { label: string; value: string }[];
}) {
  const [isVerified, setIsVerified] = useState(verified ?? false);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border bg-card transition-all hover:shadow-sm overflow-hidden">
      {/* Header row */}
      <div className="flex w-full items-center gap-3 px-4 py-3">
        {docTypeBadge && (
          <Badge variant="outline" className="text-[9px] h-5 px-1.5 shrink-0">{docTypeBadge}</Badge>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{label}</span>
            {flagType === "warning" && <AlertTriangle className="size-3 text-amber-500" />}
            {flagType === "error" && <AlertTriangle className="size-3 text-red-500" />}
          </div>
          <span className="text-xs text-muted-foreground">{source}</span>
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm font-bold tabular-nums">{amount}</div>
          {priorYear && (
            <div className={cn("text-[10px] tabular-nums", priorYear.startsWith("+") ? "text-emerald-600" : priorYear.startsWith("-") ? "text-red-500" : "text-muted-foreground")}>
              {priorYear}
            </div>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setIsVerified(!isVerified); }}
          className={cn("flex size-6 items-center justify-center rounded-full transition-all shrink-0",
            isVerified ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground/50 hover:bg-muted/80"
          )}
        >
          <Check className="size-3" />
        </button>
        {allFields && allFields.length > 0 ? (
          <button onClick={() => setExpanded(!expanded)} className="shrink-0">
            <ChevronDown className={cn("size-3.5 text-muted-foreground/40 transition-transform", expanded && "rotate-180")} />
          </button>
        ) : onDocClick ? (
          <button onClick={onDocClick} className="shrink-0">
            <ChevronRight className="size-3.5 text-muted-foreground/30" />
          </button>
        ) : null}
      </div>

      {/* Expanded detail fields */}
      <AnimatePresence>
        {expanded && allFields && allFields.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/30 px-4 py-2">
              {allFields.map((field, i) => (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-muted-foreground">{field.label}</span>
                  <span className="text-xs tabular-nums font-medium">{field.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════
// PREP SUMMARY (center panel)
// ═══════════════════════════════════════════════
function PrepSummary({ client, onDocClick }: { client: Client; onDocClick: (docId: string) => void }) {
  const docs = getClientDocuments(client.id);
  const allIntel = getDocumentIntelligence(client.id);
  const insight = getInsightForClient(client.id);
  const ps = getClientPaymentSummary(client.id);
  const checklist = getClientChecklist(client.id);

  // Categorize docs
  const incomeDocs = docs.filter(d => d.docCategory === "income");
  const deductionDocs = docs.filter(d => d.docCategory === "deductions");
  const businessDocs = docs.filter(d => d.docCategory === "business");
  const returnDocs = docs.filter(d => d.docCategory === "returns" && d.status === "ready_for_review");

  // Calculate totals from extracted data
  const incomeItems: { label: string; source: string; amount: string; rawAmount: number; priorYear?: string; docId: string; flagType?: "info" | "warning" | "error"; docTypeBadge: string; allFields: { label: string; value: string }[] }[] = [];
  const deductionItems: typeof incomeItems = [];
  const withholdingItems: { label: string; amount: string; rawAmount: number }[] = [];

  incomeDocs.forEach(doc => {
    const intel = getIntelligenceForDocument(doc.id);
    if (!intel) return;
    const mainKv = intel.keyDataPoints[0];
    if (!mainKv) return;
    const flagType = intel.flags.length > 0 ? intel.flags[0]!.type as "info" | "warning" | "error" : undefined;
    incomeItems.push({
      label: mainKv.label === "Wages" ? `W-2 Wages (${doc.fileName.includes("James") ? "James" : doc.fileName.includes("Sofia") ? "Sofia" : doc.clientName.split(" ")[0]})` :
             mainKv.label === "NEC Income" ? `1099-NEC (${intel.keyDataPoints.find(k => k.label === "Payer")?.value || "Self-employment"})` :
             mainKv.label === "Interest" ? `Interest Income` :
             mainKv.label === "Rental Income" ? `Rental Income (Net)` :
             mainKv.label === "Salary" ? `W-2 Salary (${doc.clientName.split(" ")[0]})` :
             mainKv.label,
      source: `${doc.docTypeLabel} from ${intel.keyDataPoints.find(k => k.label === "Payer" || k.label === "Bank" || k.label === "Property")?.value || doc.fileName.replace(/_/g, " ").replace(/\.[^.]+$/, "")}`,
      amount: mainKv.value,
      rawAmount: parseAmount(mainKv.value),
      priorYear: intel.priorYearComparison ? (intel.priorYearComparison.includes("up") ? `+${intel.priorYearComparison.match(/\([\d.]+%\)/)?.[0]?.replace(/[()]/g, "") || ""} vs 2024` : intel.priorYearComparison.includes("down") ? `-${intel.priorYearComparison.match(/\([\d.]+%\)/)?.[0]?.replace(/[()]/g, "") || ""} vs 2024` : undefined) : undefined,
      docId: doc.id,
      flagType: flagType !== "info" ? flagType : undefined,
      docTypeBadge: doc.docTypeLabel,
      allFields: intel.keyDataPoints,
    });

    // Extract withholding
    const fedWithheld = intel.keyDataPoints.find(k => k.label === "Fed Withheld");
    if (fedWithheld) {
      const name = doc.fileName.includes("James") ? "James" : doc.fileName.includes("Sofia") ? "Sofia" : doc.clientName.split(" ")[0];
      withholdingItems.push({ label: `Federal (${name} ${doc.docTypeLabel})`, amount: fedWithheld.value, rawAmount: parseAmount(fedWithheld.value) });
    }
  });

  deductionDocs.forEach(doc => {
    const intel = getIntelligenceForDocument(doc.id);
    if (!intel) {
      deductionItems.push({
        label: doc.fileName.replace(/_/g, " ").replace(/\.[^.]+$/, ""),
        source: doc.docTypeLabel,
        amount: "—",
        rawAmount: 0,
        docId: doc.id,
        docTypeBadge: doc.docTypeLabel,
        allFields: [],
      });
      return;
    }
    const mainKv = intel.keyDataPoints[0];
    if (!mainKv) return;
    deductionItems.push({
      label: mainKv.label.includes("Mortgage") ? "Mortgage Interest (Primary)" :
             mainKv.label.includes("Property") ? "Property Tax" :
             mainKv.label,
      source: `${doc.docTypeLabel} from ${intel.keyDataPoints.find(k => k.label === "Bank" || k.label === "Property")?.value || "client documents"}`,
      amount: mainKv.value,
      rawAmount: parseAmount(mainKv.value),
      docId: doc.id,
      docTypeBadge: doc.docTypeLabel,
      allFields: intel.keyDataPoints,
    });
  });

  const totalIncome = incomeItems.reduce((s, i) => s + i.rawAmount, 0);
  const totalWithholding = withholdingItems.reduce((s, i) => s + i.rawAmount, 0);

  const receivedCount = checklist.filter(c => c.received).length;
  const totalCount = checklist.length;

  return (
    <div className="flex-1 overflow-y-auto">
      {/* AI Preparation Brief */}
      {insight && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-6 mt-6 rounded-xl border bg-card p-4"
        >
          <div className="flex items-start gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 shrink-0">
              <BotIcon className="size-4 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Preparation Brief</div>
              <p className="text-sm leading-relaxed text-foreground/85">{insight.text}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Client info bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="mx-6 mt-4 rounded-lg bg-muted/30 px-4 py-3 flex items-center gap-6"
      >
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Filing</div>
          <div className="text-sm font-medium">{client.filingStatus === "mfj" ? "Married Filing Jointly" : client.filingStatus === "single" ? "Single" : client.filingStatus === "hoh" ? "Head of Household" : client.filingStatus}</div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Service</div>
          <div className="text-sm font-medium">{client.serviceTier}</div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Fee</div>
          <div className="text-sm font-medium">${client.feeAmount}</div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Documents</div>
          <div className="text-sm font-medium">{receivedCount}/{totalCount}</div>
        </div>
      </motion.div>

      <div className="px-6 py-5 space-y-6">
        {/* INCOME */}
        {incomeItems.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center gap-2 mb-3">
              <ChevronDown className="size-3 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Income</span>
              <Badge variant="secondary" className="text-[9px] h-4 px-1.5">{incomeItems.length}</Badge>
            </div>
            <div className="space-y-1.5">
              {incomeItems.map((item, i) => (
                <SummaryLineItem
                  key={i}
                  label={item.label}
                  source={item.source}
                  amount={item.amount}
                  priorYear={item.priorYear}
                  flagType={item.flagType}
                  docTypeBadge={item.docTypeBadge}
                  allFields={item.allFields}
                  onDocClick={() => onDocClick(item.docId)}
                />
              ))}
            </div>
            <div className="flex items-center justify-between mt-3 px-4 py-2 rounded-lg bg-emerald-50/50">
              <span className="text-sm font-medium text-emerald-700">Total Gross Income</span>
              <span className="text-sm font-bold tabular-nums text-emerald-700">${totalIncome.toLocaleString()}</span>
            </div>
          </motion.div>
        )}

        {/* DEDUCTIONS */}
        {deductionItems.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="flex items-center gap-2 mb-3">
              <ChevronDown className="size-3 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Deductions</span>
              <Badge variant="secondary" className="text-[9px] h-4 px-1.5">{deductionItems.length}</Badge>
            </div>
            <div className="space-y-1.5">
              {deductionItems.map((item, i) => (
                <SummaryLineItem
                  key={i}
                  label={item.label}
                  source={item.source}
                  amount={item.amount}
                  docTypeBadge={item.docTypeBadge}
                  allFields={item.allFields}
                  onDocClick={() => onDocClick(item.docId)}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* WITHHOLDING & PAYMENTS */}
        {withholdingItems.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <div className="flex items-center gap-2 mb-3">
              <ChevronDown className="size-3 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Withholding & Payments</span>
              <Badge variant="secondary" className="text-[9px] h-4 px-1.5">{withholdingItems.length}</Badge>
            </div>
            <div className="rounded-lg border bg-card overflow-hidden">
              {withholdingItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b border-border/20 last:border-0">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <span className="text-sm tabular-nums">{item.amount}</span>
                </div>
              ))}
              <div className="flex items-center justify-between px-4 py-2.5 bg-muted/20">
                <span className="text-xs font-semibold">Total Federal Withheld</span>
                <span className="text-sm font-bold tabular-nums">${totalWithholding.toLocaleString()}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* RETURN SUMMARY */}
        {returnDocs.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <div className="flex items-center gap-2 mb-3">
              <ChevronDown className="size-3 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Return Summary (Prepared)</span>
            </div>
            {returnDocs.map(doc => {
              const intel = getIntelligenceForDocument(doc.id);
              if (!intel) return null;
              return (
                <button key={doc.id} onClick={() => onDocClick(doc.id)} className="w-full rounded-lg border bg-card p-4 text-left transition-all hover:shadow-sm">
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                    {intel.keyDataPoints.map((kv, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{kv.label}</span>
                        <span className="text-sm font-medium tabular-nums">{kv.value}</span>
                      </div>
                    ))}
                  </div>
                </button>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// DOCUMENT PREVIEW (center panel)
// ═══════════════════════════════════════════════
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

// ═══════════════════════════════════════════════
// RIGHT SIDEBAR
// ═══════════════════════════════════════════════
function PrepSidebar({ client, showingSummary, selectedDoc, onCompletePrep, onAskDocket }: {
  client: Client; showingSummary: boolean; selectedDoc: MockDocument | null;
  onCompletePrep: () => void; onAskDocket: (question: string) => void;
}) {
  const flags = getOpenIssues(client.id);
  const ps = getClientPaymentSummary(client.id);
  const intel = selectedDoc ? getIntelligenceForDocument(selectedDoc.id) : null;
  const prepDays = Math.floor((Date.now() - new Date(client.lastActivity).getTime()) / (1000 * 60 * 60 * 24));
  const [expandedFlags, setExpandedFlags] = useState<Set<string>>(new Set());

  // Document-specific sidebar
  if (!showingSummary && selectedDoc && intel) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col overflow-y-auto">
        <div className="border-b border-border/30 px-5 py-4">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Summary</h3>
          <p className="text-sm leading-relaxed text-foreground/85">{intel.aiSummary}</p>
        </div>

        {intel.flags.length > 0 && (
          <div className="border-b border-border/30 px-5 py-3 space-y-1.5">
            {intel.flags.map((flag, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className={cn("size-1.5 rounded-full shrink-0 mt-1.5",
                  flag.type === "error" ? "bg-red-500" : flag.type === "warning" ? "bg-amber-500" : "bg-blue-500"
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

        <div className="border-t border-border/30 px-5 py-3">
          <Button size="sm" variant="outline" className="w-full text-xs h-8" onClick={() => onAskDocket(`Tell me about ${selectedDoc.fileName.replace(/_/g, " ")} for ${client.fullName}`)}>
            <MessageSquare className="size-3.5" /> Ask Docket about this document
          </Button>
        </div>
      </motion.div>
    );
  }

  // Summary sidebar
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col overflow-y-auto">
      {/* Prep timer */}
      <div className="border-b border-border/30 px-5 py-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="size-3.5" />
          <span>In preparation for <span className="font-medium text-foreground">{prepDays} days</span></span>
        </div>
      </div>

      {/* Flags — detailed with expand */}
      <div className="border-b border-border/30 px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Flags
            {flags.length > 0 && (
              <span className="ml-1.5 inline-flex size-4 items-center justify-center rounded-full bg-foreground/10 text-[9px] font-semibold tabular-nums">{flags.length}</span>
            )}
          </h4>
        </div>
        {flags.length > 0 ? (
          <div className="space-y-2">
            {flags.map(flag => {
              const isExpanded = expandedFlags.has(flag.id);
              return (
                <div key={flag.id} className="rounded-lg border bg-card overflow-hidden">
                  <button
                    onClick={() => setExpandedFlags(prev => { const n = new Set(prev); n.has(flag.id) ? n.delete(flag.id) : n.add(flag.id); return n; })}
                    className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-muted/30 transition-colors"
                  >
                    <span className={cn("size-1.5 rounded-full shrink-0 mt-1.5",
                      flag.priority === "critical" || flag.priority === "high" ? "bg-red-500" :
                      flag.priority === "medium" ? "bg-amber-500" : "bg-muted-foreground/30"
                    )} />
                    <span className="flex-1 text-xs font-medium">{flag.title}</span>
                    <ChevronRight className={cn("size-3 text-muted-foreground/50 transition-transform shrink-0 mt-0.5", isExpanded && "rotate-90")} />
                  </button>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-2.5 space-y-2">
                          {flag.description && <p className="text-[11px] text-muted-foreground leading-relaxed">{flag.description}</p>}
                          <div className="flex gap-1.5">
                            <Button size="sm" variant="outline" className="h-6 text-[10px] px-2">Resolve</Button>
                            <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 text-muted-foreground" onClick={() => onAskDocket(`Explain the "${flag.title}" flag for ${client.fullName}`)}>
                              Ask Docket
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-emerald-600 flex items-center gap-1"><Check className="size-3" /> All flags resolved</p>
        )}
      </div>

      {/* Payment */}
      <div className="border-b border-border/30 px-5 py-4">
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Payment</h4>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">{client.serviceTier} Return</div>
            <div className="text-[10px] text-muted-foreground">Fee: ${client.feeAmount}</div>
          </div>
          <div className="text-right">
            <div className="text-base tracking-tight"><span className="font-display">${ps.totalPaid}</span> <span className="text-xs font-sans text-muted-foreground">of ${ps.totalFee}</span></div>
          </div>
        </div>
        <Progress value={(ps.totalPaid / ps.totalFee) * 100} className="h-1.5 mt-2" indicatorColor={ps.fullyPaid ? "bg-emerald-500" : ps.hasOverdue ? "bg-red-500" : undefined} />
        <div className={cn("text-[11px] mt-1.5", ps.fullyPaid ? "text-emerald-600" : ps.hasOverdue ? "text-red-500" : "text-muted-foreground")}>
          {ps.fullyPaid ? "Paid in full" : ps.hasOverdue ? `$${ps.totalOwed} overdue` : `$${ps.totalOwed} remaining, ${ps.balance?.status === "sent" ? "invoice sent" : "not yet invoiced"}`}
        </div>
      </div>

      {/* Ask Docket */}
      <div className="border-b border-border/30 px-5 py-4">
        <Button size="sm" variant="outline" className="w-full text-xs h-8" onClick={() => onAskDocket(`What should I know before prepping ${client.fullName}'s return?`)}>
          <MessageSquare className="size-3.5" /> Ask Docket
        </Button>
      </div>

      {/* Complete Preparation */}
      <div className="px-5 py-4">
        <Button className="w-full" onClick={onCompletePrep}>
          <Send className="size-3.5" /> Complete Preparation
        </Button>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════
// MAIN MODAL
// ═══════════════════════════════════════════════
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
  const prepDays = Math.floor((Date.now() - new Date(client.lastActivity).getTime()) / (1000 * 60 * 60 * 24));

  // Ask Docket handler — opens the AI panel with the question
  const handleAskDocket = (question: string) => {
    // In production, this would open the AI panel with the question pre-filled
    // For now, we'll just log it
    console.log("Ask Docket:", question);
  };

  const handleDocSelect = (docId: string) => { setSelectedDocId(docId); setShowingSummary(false); };
  const handleSummary = () => { setShowingSummary(true); setSelectedDocId(null); };

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
                <h2 className="text-sm font-semibold truncate">{selectedDoc.fileName.replace(/_/g, " ").replace(/\.[^.]+$/, "")}</h2>
                <span className="text-xs text-muted-foreground shrink-0">{selectedDoc.fileSize}</span>
              </>
            ) : null}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              <Clock className="size-3 mr-1" /> In preparation for {prepDays}d
            </Badge>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
              <Download className="size-3" /> Download All
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => onOpenChange(false)}>
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Document tree */}
          <div className="w-[220px] shrink-0 border-r border-border/40 overflow-y-auto bg-muted/5">
            <DocTree clientId={client.id} selectedDocId={selectedDocId} onSelect={handleDocSelect} onSummary={handleSummary} showingSummary={showingSummary} />
          </div>

          {/* Center */}
          <AnimatePresence mode="wait">
            {showingSummary ? (
              <motion.div key="summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex-1 overflow-hidden">
                <PrepSummary client={client} onDocClick={handleDocSelect} />
              </motion.div>
            ) : selectedDoc ? (
              <motion.div key={selectedDoc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex-1 overflow-hidden">
                <DocPreview doc={selectedDoc} />
              </motion.div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">Select a document</div>
            )}
          </AnimatePresence>

          {/* Right: Sidebar */}
          <div className="w-[320px] shrink-0 border-l border-border/40 overflow-hidden">
            <PrepSidebar
              client={client}
              showingSummary={showingSummary}
              selectedDoc={selectedDoc}
              onCompletePrep={onCompletePrep}
              onAskDocket={handleAskDocket}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

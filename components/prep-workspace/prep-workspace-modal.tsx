"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  X, ChevronRight, ChevronDown, Clock, FileText, Check, CheckCircle2, Eye,
  AlertTriangle, AlertCircle, Send, ArrowLeft, ClipboardList, Download, MessageSquare,
  Maximize2, Minimize2
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
import { useAIPanelAsk } from "@/components/ai-panel";
import { useToast } from "@/components/ui/toast-notification";
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

// ── Rich text formatter for AI content ──
function FormattedInsightText({ text }: { text: string }) {
  const highlightEntities = (text: string) => {
    const parts = text.split(/(\$[\d,]+(?:\.\d{2})?|\d+%|Golden Dragon LLC|Golden Dragon(?:\s+#\d)?|Marcus|Schedule [A-Z]|Form \d{4}[A-Z]?|1099-[A-Z]+|W-2|Q[1-4] \d{4}|March \d+|Restaurant Consulting Group|Pasadena|Riverside|Alhambra|IRS|Section \d+|QBI)/g);
    return parts.map((part, i) => {
      if (/^\$[\d,]+/.test(part)) return <span key={i} className="font-bold tabular-nums text-foreground bg-muted/50 rounded px-0.5">{part}</span>;
      if (/^\d+%$/.test(part)) return <span key={i} className="font-bold tabular-nums text-foreground bg-muted/50 rounded px-0.5">{part}</span>;
      if (/^Golden Dragon LLC$/.test(part)) return <span key={i} className="font-bold text-foreground bg-muted/50 rounded px-0.5">{part}</span>;
      if (/^(Golden Dragon|Marcus|Restaurant Consulting Group|Pasadena|Riverside|Alhambra|IRS)/.test(part)) return <span key={i} className="font-semibold text-foreground bg-muted/40 rounded px-0.5">{part}</span>;
      if (/^(Schedule [A-Z]|Form \d|1099-|W-2|Q[1-4]|Section \d|QBI)/.test(part)) return <span key={i} className="font-medium text-foreground/90 bg-muted/50 rounded px-1 py-0.5">{part}</span>;
      if (/^March \d+/.test(part)) return <span key={i} className="font-medium text-foreground bg-muted/40 rounded px-0.5">{part}</span>;
      return <span key={i}>{part}</span>;
    });
  };

  // Split into paragraphs by double newline
  const paragraphs = text.split("\n\n");

  return (
    <div className="text-sm leading-relaxed text-foreground/75 space-y-3">
      {paragraphs.map((para, pi) => {
        // Split paragraph into lines
        const lines = para.split("\n");

        // Check if this paragraph is a numbered or bullet list
        const listLines = lines.filter(l => l.match(/^\d+\.\s|^-\s|^\(\d+\)/));
        const nonListLines = lines.filter(l => !l.match(/^\d+\.\s|^-\s|^\(\d+\)/));

        if (listLines.length > 0) {
          return (
            <div key={pi}>
              {nonListLines.length > 0 && nonListLines[0]!.trim() && (
                <p className="mb-2">{highlightEntities(nonListLines[0]!.trim())}</p>
              )}
              <div className="space-y-1.5 pl-1">
                {listLines.map((line, li) => {
                  const numMatch = line.match(/^(\d+)\.\s*(.+)$/);
                  const parenMatch = line.match(/^\((\d+)\)\s*(.+)$/);
                  const bulletMatch = line.match(/^-\s*(.+)$/);
                  if (numMatch) {
                    return (
                      <div key={li} className="flex gap-2">
                        <span className="text-muted-foreground font-medium shrink-0 w-4 text-right">{numMatch[1]}.</span>
                        <span>{highlightEntities(numMatch[2]!)}</span>
                      </div>
                    );
                  }
                  if (parenMatch) {
                    return (
                      <div key={li} className="flex gap-2">
                        <span className="text-muted-foreground font-medium shrink-0 w-4 text-right">{parenMatch[1]}.</span>
                        <span>{highlightEntities(parenMatch[2]!)}</span>
                      </div>
                    );
                  }
                  if (bulletMatch) {
                    return (
                      <div key={li} className="flex gap-2">
                        <span className="text-muted-foreground shrink-0 mt-1.5 size-1 rounded-full bg-muted-foreground/40" />
                        <span>{highlightEntities(bulletMatch[1]!)}</span>
                      </div>
                    );
                  }
                  return <p key={li}>{highlightEntities(line)}</p>;
                })}
              </div>
            </div>
          );
        }

        // Regular paragraph — handle single newlines as line breaks
        if (lines.length > 1) {
          return (
            <div key={pi}>
              {lines.map((line, li) => (
                <p key={li}>{highlightEntities(line)}</p>
              ))}
            </div>
          );
        }

        return <p key={pi}>{highlightEntities(para)}</p>;
      })}
    </div>
  );
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
function SummaryLineItem({ label, source, amount, priorYear, verified, onToggleVerified, onDocClick, flagType, docTypeBadge, allFields }: {
  label: string; source: string; amount: string; priorYear?: string;
  verified?: boolean; onToggleVerified?: () => void; onDocClick?: () => void; flagType?: "info" | "warning" | "error";
  docTypeBadge?: string; allFields?: { label: string; value: string }[];
}) {
  const isVerified = verified ?? false;
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
          onClick={(e) => { e.stopPropagation(); onToggleVerified?.(); }}
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
function PrepSummary({ client, onDocClick, onAskDocket }: { client: Client; onDocClick: (docId: string) => void; onAskDocket: (q: string) => void }) {
  const docs = getClientDocuments(client.id);
  const allIntel = getDocumentIntelligence(client.id);
  const insight = getInsightForClient(client.id);
  const ps = getClientPaymentSummary(client.id);
  const [verifiedItems, setVerifiedItems] = useState<Set<string>>(new Set());
  const toggleVerified = (key: string) => setVerifiedItems(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
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

    // Extract withholding — federal and state
    const fedWithheld = intel.keyDataPoints.find(k => k.label === "Fed Withheld");
    const state = intel.keyDataPoints.find(k => k.label === "State");
    if (fedWithheld) {
      const name = doc.fileName.includes("James") ? "James" : doc.fileName.includes("Sofia") ? "Sofia" : doc.clientName.split(" ")[0];
      withholdingItems.push({ label: `Federal (${name} ${doc.docTypeLabel})`, amount: fedWithheld.value, rawAmount: parseAmount(fedWithheld.value) });
      // Check for state withholding in allFields (from the expanded data)
      const stateWithheld = intel.keyDataPoints.find(k => k.label === "State Withheld" || k.label === "State Tax");
      if (stateWithheld) {
        withholdingItems.push({ label: `State ${state?.value || ""} (${name} ${doc.docTypeLabel})`, amount: stateWithheld.value, rawAmount: parseAmount(stateWithheld.value) });
      }
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
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }}
          className="mx-6 mt-6 rounded-lg border bg-card"
        >
          <div className="px-4 py-2.5 flex items-center gap-2">
            <span className={cn("size-1.5 rounded-full shrink-0",
              insight.severity === "alert" ? "bg-red-500" : insight.severity === "concern" ? "bg-amber-500" : "bg-emerald-500"
            )} />
            <span className={cn("text-[10px] font-semibold uppercase tracking-wide",
              insight.severity === "alert" ? "text-red-700" : insight.severity === "concern" ? "text-amber-700" : "text-emerald-700"
            )}>
              {insight.severity === "alert" ? "Action Required" : insight.severity === "concern" ? "Needs Attention" : "Preparation Notes"}
            </span>
          </div>
          <div className="px-4 pb-4">
            <motion.h3
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="font-display text-base tracking-tight mb-2"
            >
              {insight.title}
            </motion.h3>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <FormattedInsightText text={insight.content} />
            </motion.div>
            {insight.actions && insight.actions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.3 }}
                className="mt-3 flex flex-wrap gap-2"
              >
                {insight.actions.map((action, i) => (
                  <Button
                    key={i}
                    size="sm"
                    variant={action.variant === "primary" ? "default" : "outline"}
                    className="h-7 text-xs"
                    onClick={() => {
                      if (action.action === "ask_docket") onAskDocket(`Tell me about ${insight.title} for ${client.fullName}`);
                    }}
                  >
                    {action.label}
                  </Button>
                ))}
              </motion.div>
            )}
          </div>
        </motion.div>
      )}


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
                  verified={verifiedItems.has(`income-${i}`)}
                  onToggleVerified={() => toggleVerified(`income-${i}`)}
                  onDocClick={() => onDocClick(item.docId)}
                />
              ))}
            </div>
            <AnimatePresence>
              {incomeItems.length > 0 && incomeItems.every((_, i) => verifiedItems.has(`income-${i}`)) && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-emerald-50/50 border border-emerald-200/50">
                    <span className="text-sm font-medium text-emerald-700">Total Gross Income</span>
                    <span className="font-display text-base tabular-nums text-emerald-700">${totalIncome.toLocaleString()}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
              {(() => {
                const fedItems = withholdingItems.filter(w => w.label.startsWith("Federal"));
                const stateItems = withholdingItems.filter(w => w.label.startsWith("State"));
                const fedTotal = fedItems.reduce((s, w) => s + w.rawAmount, 0);
                const stateTotal = stateItems.reduce((s, w) => s + w.rawAmount, 0);
                return (
                  <>
                    {fedItems.length > 0 && (
                      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/20 border-b border-border/20">
                        <span className="text-xs font-semibold">Total Federal Withheld</span>
                        <span className="text-sm font-bold tabular-nums">${fedTotal.toLocaleString()}</span>
                      </div>
                    )}
                    {stateTotal > 0 && (
                      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/20">
                        <span className="text-xs font-semibold">Total State Withheld</span>
                        <span className="text-sm font-bold tabular-nums">${stateTotal.toLocaleString()}</span>
                      </div>
                    )}
                  </>
                );
              })()}
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
  const [resolvedFlags, setResolvedFlags] = useState<Set<string>>(new Set());

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
      {/* Flags — check/exclamation style */}
      <div className="border-b border-border/30 px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Flags</h4>
          {flags.length > 0 && (
            <span className="text-[10px] text-amber-600 font-medium">{flags.length} open</span>
          )}
        </div>
        <div className="space-y-1">
          {flags.map(flag => {
            const isResolved = resolvedFlags.has(flag.id);
            const isExpanded = expandedFlags.has(flag.id);
            return (
              <motion.div
                key={flag.id}
                layout
                className="overflow-hidden"
              >
                {/* Header row */}
                <button
                  onClick={() => !isResolved && setExpandedFlags(prev => { const n = new Set(prev); n.has(flag.id) ? n.delete(flag.id) : n.add(flag.id); return n; })}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/30"
                >
                  <motion.div
                    key={isResolved ? "resolved" : "open"}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  >
                    {isResolved ? (
                      <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <AlertCircle className="size-3.5 text-red-500 shrink-0" />
                    )}
                  </motion.div>
                  <motion.span
                    animate={{ opacity: isResolved ? 0.5 : 1 }}
                    transition={{ duration: 0.3 }}
                    className={cn("flex-1 text-xs font-medium transition-all duration-300", isResolved && "line-through text-muted-foreground")}
                  >
                    {flag.title}
                  </motion.span>
                  <AnimatePresence mode="wait">
                    {isResolved ? (
                      <motion.div key="undo" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-[10px] px-2 shrink-0 text-muted-foreground"
                          onClick={(e) => { e.stopPropagation(); setResolvedFlags(prev => { const n = new Set(prev); n.delete(flag.id); return n; }); }}
                        >
                          Undo
                        </Button>
                      </motion.div>
                    ) : (
                      <motion.div key="resolve" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.2 }}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-[10px] px-2 shrink-0 text-muted-foreground"
                          onClick={(e) => { e.stopPropagation(); setResolvedFlags(prev => new Set([...prev, flag.id])); }}
                        >
                          Resolve
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
                {/* Expanded detail */}
                <AnimatePresence>
                  {isExpanded && !isResolved && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-9 pr-2 pb-2.5 space-y-2">
                        {flag.description && <p className="text-[11px] text-muted-foreground leading-relaxed">{flag.description}</p>}
                        <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => onAskDocket(`Explain the "${flag.title}" flag for ${client.fullName}`)}>
                          Ask Docket
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
          {flags.length === 0 && (
            <p className="text-xs text-emerald-600 flex items-center gap-1 py-1"><CheckCircle2 className="size-3.5" /> All flags resolved</p>
          )}
        </div>
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
  const [docketOpen, setDocketOpen] = useState(false);
  const [docketFullscreen, setDocketFullscreen] = useState(false);
  const [docketHasOpened, setDocketHasOpened] = useState(false);
  const [docketMessages, setDocketMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [docketInput, setDocketInput] = useState("");
  const [docketTyping, setDocketTyping] = useState(false);
  const selectedDoc = selectedDocId ? getDocumentById(selectedDocId) : null;
  const { showToast } = useToast();
  const prepDays = Math.floor((Date.now() - new Date(client.lastActivity).getTime()) / (1000 * 60 * 60 * 24));
  const firstName = client.fullName.split(" ")[0];

  // Comprehensive auto-response for first open
  const fullPrepBrief = `Marcus has 3 restaurant locations under Golden Dragon LLC, but total Schedule C revenue dropped 40% from $238,000 to $142,000. His notes mention one location closed. The Pasadena location (Golden Dragon #3) appears to have closed in Q2 2025 based on the expense records cutting off in June. You need verbal confirmation from Marcus that the closure is permanent before filing, because the IRS will flag a 40% revenue drop on a multi-location Schedule C without explanation.\n\nNew this year: Marcus has a $12,000 1099-NEC from Restaurant Consulting Group. This is new income not present in 2024 and will likely need its own Schedule C or allocation to the existing one. Ask Marcus if this is a separate business activity or related to Golden Dragon.\n\nThe W-2 from Golden Dragon shows wages of $58,000, down from $96,000 last year. This is consistent with the location closure but make sure the wage reduction is proportional to the actual closure timeline, not an error. Equipment disposal of $23,000 from the Riverside location needs special depreciation treatment. Verify whether this was a sale, abandonment, or trade-in, as each has different tax implications.\n\nMarcus has a call scheduled for March 30 at 2pm. Recommend covering:\n1. Confirm Pasadena closure date and circumstances\n2. Consulting income classification\n3. Equipment disposal method\n4. Review all three P&Ls side by side`;

  // Word-by-word streaming with reasoning steps
  const simulateDocketResponse = (question: string) => {
    setDocketMessages(prev => [...prev, { role: "user", text: question }]);

    const q = question.toLowerCase();
    let response = `Based on ${firstName}'s documents, here's what I found:\n\nAll ${client.documentsSubmitted} documents have been received and processed. The key items to review during preparation are the income sources and any flagged anomalies shown in the prep summary.\n\nWant me to look at something specific?`;

    if (q.includes("know before") || (q.includes("prep") && q.includes("return"))) {
      response = fullPrepBrief;
    } else if (q.includes("revenue") || q.includes("drop") || q.includes("closure")) {
      response = `The 40% revenue drop from $238,000 to $142,000 is driven by the Pasadena location (Golden Dragon #3) closing mid-year in Q2 2025.\n\nThe expense records for Pasadena stop in June, which supports a Q2 closure. The other two locations (Alhambra and Riverside) show relatively stable revenue year-over-year.\n\nThe IRS will almost certainly flag a 40% Schedule C revenue decline on a multi-location business. Without documentation of the closure, it looks like underreporting. You need:\n\n1. Written or verbal confirmation from Marcus of the closure date\n2. Final lease termination or landlord correspondence if available\n3. Last payroll date for Pasadena employees\n\nThe remaining $142,000 across two locations actually represents slight growth per-location, which is a good sign.`;
    } else if (q.includes("consulting") || q.includes("1099") || q.includes("schedule c") || q.includes("nec")) {
      response = `The $12,000 1099-NEC from Restaurant Consulting Group is brand new — not present in 2024.\n\nTwo classification options:\n\n1. Separate Schedule C — if Marcus is doing consulting as a distinct side business. Gets its own profit/loss and may qualify for a separate QBI deduction.\n\n2. Same Schedule C as Golden Dragon — if the consulting is directly related to his restaurant operations.\n\nThe distinction matters for self-employment tax, QBI deduction eligibility, and business expense allocation.\n\nAsk Marcus during the March 30 call: "Is this consulting work you do separately from the restaurants, or is it through Golden Dragon?"`;
    } else if (q.includes("equipment") || q.includes("depreciation") || q.includes("disposal")) {
      response = `The $23,000 equipment disposal from the Riverside location has three possible treatments:\n\n1. Sale — Report on Form 4797. Could trigger ordinary income recapture on prior depreciation.\n\n2. Abandonment — Deduct remaining undepreciated basis as ordinary loss. Usually the best outcome tax-wise.\n\n3. Trade-in — Like-kind exchange rules under Section 1031 may defer the gain.\n\nKey question for Marcus: "What happened to the Riverside equipment — did you sell it, scrap it, or trade it in?"`;
    } else if (q.includes("flag") || q.includes("wage") || q.includes("summarize")) {
      response = `4 open flags for Marcus:\n\n1. Wage decrease needs confirmation — W-2 dropped 40% ($96K → $58K). Consistent with closure but needs verbal confirmation.\n\n2. New consulting income — $12K 1099-NEC needs Schedule C classification.\n\n3. Riverside equipment — $23K disposal method TBD (sale vs abandonment vs trade-in).\n\n4. Review call — March 30 at 2pm. Should resolve flags 1-3.\n\nPrep talking points for each topic so you can get clear answers in one conversation.`;
    } else if (q.includes("blocking") || q.includes("block")) {
      response = `Three things blocking Marcus's return:\n\n1. Unconfirmed Pasadena closure — can't file Schedule C with 40% revenue drop without documentation.\n\n2. Consulting income classification — $12,000 1099-NEC needs Schedule C determination.\n\n3. Equipment disposal method — $23,000 Form 4797 treatment depends on sale/abandonment/trade-in.\n\nAll three can be resolved in the March 30 call. Everything else is ready — documents in, deposit paid.`;
    }

    // Phase 1: Reasoning steps
    setDocketMessages(prev => [...prev, { role: "assistant", text: "__reasoning__" }]);

    // Phase 2: After reasoning, stream the response word by word
    setTimeout(() => {
      // Remove reasoning placeholder, start streaming
      setDocketMessages(prev => prev.filter(m => m.text !== "__reasoning__"));
      const words = response.split(" ");
      let currentText = "";
      const streamId = `stream-${Date.now()}`;
      setDocketMessages(prev => [...prev, { role: "assistant", text: "" }]);

      words.forEach((word, i) => {
        setTimeout(() => {
          currentText += (i === 0 ? "" : " ") + word;
          setDocketMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "assistant", text: currentText };
            return updated;
          });
        }, i * 25); // 25ms per word = ~40 words/sec
      });
    }, 2000); // 2s for reasoning
  };

  const handleAskDocket = (question?: string) => {
    if (question) {
      // Specific question from a button — open panel and ask
      setDocketOpen(true);
      simulateDocketResponse(question);
      return;
    }
    // Toggle behavior for the sidebar Ask Docket button
    if (docketOpen) {
      setDocketOpen(false);
      setDocketFullscreen(false);
      return;
    }
    setDocketOpen(true);
    if (!docketHasOpened) {
      // First open only — auto-send the comprehensive question
      setDocketHasOpened(true);
      simulateDocketResponse(`What should I know before prepping ${client.fullName}'s return?`);
    }
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
                <h2 className="text-sm font-semibold">{client.fullName}</h2>
                <span className="text-[10px] text-muted-foreground/40">·</span>
                <span className="text-[10px] text-muted-foreground">{client.filingStatus === "mfj" ? "MFJ" : client.filingStatus === "single" ? "Single" : client.filingStatus === "hoh" ? "HOH" : client.filingStatus.toUpperCase()}</span>
                <span className="text-[10px] text-muted-foreground/40">·</span>
                <span className="text-[10px] text-muted-foreground">{client.serviceTier}</span>
                <span className="text-[10px] text-muted-foreground/40">·</span>
                <span className="text-[10px] text-muted-foreground">${client.feeAmount}</span>
                <span className="text-[10px] text-muted-foreground/40">·</span>
                <span className="text-[10px] text-muted-foreground">{client.documentsSubmitted}/{client.documentsRequired} docs</span>
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
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => showToast("success", "Downloading all documents", `${client.documentsSubmitted} files for ${client.fullName}`)}>
              <Download className="size-3" /> Download All
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => onOpenChange(false)}>
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Left: Document tree */}
          <div className="w-[220px] shrink-0 border-r border-border/40 overflow-y-auto bg-muted/5">
            <DocTree clientId={client.id} selectedDocId={selectedDocId} onSelect={handleDocSelect} onSummary={handleSummary} showingSummary={showingSummary} />
          </div>

          {/* Center */}
          <AnimatePresence mode="wait">
            {showingSummary ? (
              <motion.div key="summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex-1 min-h-0 overflow-y-auto">
                <PrepSummary client={client} onDocClick={handleDocSelect} onAskDocket={handleAskDocket} />
              </motion.div>
            ) : selectedDoc ? (
              <motion.div key={selectedDoc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex-1 overflow-hidden">
                <DocPreview doc={selectedDoc} />
              </motion.div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">Select a document</div>
            )}
          </AnimatePresence>

          {/* Right: Sidebar (always visible) */}
          <div className="w-[280px] shrink-0 border-l border-border/40 overflow-y-auto">
            <PrepSidebar
              client={client}
              showingSummary={showingSummary}
              selectedDoc={selectedDoc}
              onCompletePrep={onCompletePrep}
              onAskDocket={handleAskDocket}
            />
          </div>

          {/* Docket Chat (attached side panel) */}
          <AnimatePresence>
            {docketOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: docketFullscreen ? "100%" : 340, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={cn("border-l border-border/40 flex flex-col overflow-hidden", docketFullscreen ? "absolute inset-0 z-10 bg-background border-l-0" : "shrink-0")}
              >
                {/* Docket header */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b shrink-0">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="size-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold">Ask Docket</span>
                    <span className="text-[10px] text-muted-foreground">· {firstName}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Button variant="ghost" size="icon-sm" onClick={() => setDocketFullscreen(!docketFullscreen)}>
                      {docketFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => { setDocketOpen(false); setDocketFullscreen(false); }}>
                      <X className="size-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                  {docketMessages.length === 0 && !docketTyping && (
                    <div className="py-6 text-center">
                      <p className="text-xs text-muted-foreground mb-3">Ask about {client.fullName.split(" ")[0]}'s return</p>
                      <div className="space-y-1.5">
                        {[
                          "Explain the revenue drop",
                          "How should I classify the consulting income?",
                          "What happened with the equipment disposal?",
                          "Summarize all flags",
                          `What's blocking ${firstName}'s return?`,
                        ].map((suggestion, i) => (
                          <button
                            key={i}
                            onClick={() => simulateDocketResponse(suggestion)}
                            className="block w-full text-left rounded-lg border px-3 py-2 text-[11px] text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {docketMessages.map((msg, i) => {
                    // Reasoning placeholder
                    if (msg.text === "__reasoning__") {
                      return (
                        <motion.div key={`reasoning-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 py-2">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <motion.div className="size-3 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
                            <span>Analyzing {firstName}'s documents...</span>
                          </div>
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Check className="size-3 text-emerald-500" />
                            <span>Reviewed {client.documentsSubmitted} documents</span>
                          </motion.div>
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Check className="size-3 text-emerald-500" />
                            <span>Checked flags and anomalies</span>
                          </motion.div>
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Check className="size-3 text-emerald-500" />
                            <span>Compared with prior year</span>
                          </motion.div>
                        </motion.div>
                      );
                    }
                    // User message
                    if (msg.role === "user") {
                      return (
                        <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="ml-8 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs leading-relaxed">
                          {msg.text}
                        </motion.div>
                      );
                    }
                    // AI response with rich formatting
                    return (
                      <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="mr-2">
                        <FormattedInsightText text={msg.text} />
                      </motion.div>
                    );
                  })}
                </div>

                {/* Input */}
                <div className="border-t px-3 py-2.5 shrink-0">
                  <div className="flex items-center gap-2">
                    <input
                      value={docketInput}
                      onChange={e => setDocketInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && docketInput.trim()) { simulateDocketResponse(docketInput.trim()); setDocketInput(""); } }}
                      placeholder="Ask about this return..."
                      className="flex-1 rounded-lg border bg-background px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
                    />
                    <Button size="icon" className="size-7 shrink-0" disabled={!docketInput.trim()} onClick={() => { if (docketInput.trim()) { simulateDocketResponse(docketInput.trim()); setDocketInput(""); } }}>
                      <Send className="size-3" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}

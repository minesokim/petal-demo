"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Check, X, AlertTriangle, TrendingDown, FileText,
  Calculator, Mail, Clock, ChevronRight, DollarSign, Brain
} from "lucide-react";
import { ExtractionDialog } from "@/components/documents/extraction-dialog";
import { type DocumentExtraction } from "@/lib/actions-mock-data";
import {
  documentExtractions, complianceAlerts, anomalyAlerts,
  extensionPredictions, deductionSuggestions, irsNotices,
  estimatedTaxCalcs, autoCategorizeItems,
  type DemoState,
} from "@/lib/actions-mock-data";
import { useAIPanelAsk } from "@/components/ai-panel";

// ============================================================
// Document Extraction Card - clickable, opens review dialog
// ============================================================
function DocumentExtractionCard({ extraction, onOpen }: { extraction: typeof documentExtractions[0]; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all hover:shadow-md hover:border-primary/20">
      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
        <FileText className="size-5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{extraction.documentType}</span>
          <span className="text-xs text-muted-foreground">{extraction.clientName}</span>
          <Badge variant={extraction.overallConfidence >= 90 ? "default" : "secondary"} className="text-[10px]">{extraction.overallConfidence}%</Badge>
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {extraction.fields.length} fields · {extraction.fields.filter(f => f.needsReview).length} need review
        </div>
      </div>
      <ChevronRight className="size-4 text-muted-foreground shrink-0" />
    </button>
  );
}

// ============================================================
// Auto-Categorize Card
// ============================================================
function AutoCategorizeCard({ item }: { item: typeof autoCategorizeItems[0] }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border p-3">
      <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
        <FileText className="size-3.5 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-xs font-medium">{item.originalFileName}</span>
        <span className="text-xs text-muted-foreground ml-1.5">{item.clientName}</span>
      </div>
      <div className="flex items-center gap-1.5">
        {!item.readable && <Badge variant="destructive" className="text-[10px]">Unreadable</Badge>}
        <Badge variant="outline" className="text-[10px]">{item.detectedType}</Badge>
      </div>
    </div>
  );
}

// ============================================================
// TIER 1: CRITICAL — Compliance alerts with fine risk
// Red left border, red bg tint. Can't miss it.
// ============================================================
function ComplianceFlagCard({ alert }: { alert: typeof complianceAlerts[0] }) {
  const [status, setStatus] = useState(alert.status);
  if (status !== "pending") return null;

  return (
    <div className="rounded-xl border-l-[3px] border-l-red-500 border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/10 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="size-4 text-red-500 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{alert.title}</span>
            {alert.severity === "critical" && <Badge variant="destructive" className="text-[10px]">critical</Badge>}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{alert.clientName}</div>
          <div className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
            {alert.fineRisk}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Button size="sm" className="h-7 text-xs" onClick={() => setStatus("acknowledged")}>
          Complete {alert.formRequired}
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={() => setStatus("dismissed")}>
          Dismiss
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// TIER 2: ATTENTION — Anomalies, questions for Antonio
// Amber left border. Shows data, asks to confirm.
// ============================================================
function AnomalyAlertCard({ alert, onAskDocket }: { alert: typeof anomalyAlerts[0]; onAskDocket?: () => void }) {
  const [status, setStatus] = useState(alert.status);
  if (status !== "pending") return null;

  return (
    <div className="rounded-xl border-l-[3px] border-l-amber-500 border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{alert.metric}</div>
          <div className="text-xs text-muted-foreground">{alert.clientName}</div>
        </div>
        <TrendingDown className="size-4 text-amber-500 shrink-0" />
      </div>

      {/* Data comparison - compact */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-lg border p-2 text-center">
          <div className="font-display text-base tabular-nums">${(alert.priorYear / 1000).toFixed(0)}K</div>
          <div className="text-[10px] text-muted-foreground">2024</div>
        </div>
        <div className="rounded-lg border p-2 text-center">
          <div className="font-display text-base tabular-nums">${(alert.currentYear / 1000).toFixed(0)}K</div>
          <div className="text-[10px] text-muted-foreground">2025</div>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 p-2 text-center">
          <div className="font-display text-base tabular-nums text-red-600">{alert.changePercent}%</div>
          <div className="text-[10px] text-muted-foreground">Change</div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setStatus("flagged")}>
          <AlertTriangle className="mr-1 size-3" /> Flag for review
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setStatus("proceeded")}>
          Confirm and proceed
        </Button>
        {onAskDocket && (
          <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground ml-auto" onClick={onAskDocket}>
            <Brain className="mr-1 size-3" /> Ask Docket
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// TIER 3: OPPORTUNITY — Deductions, savings
// Emerald left border. Big savings number.
// ============================================================
function DeductionSuggestionCard({ suggestion, onAskDocket }: { suggestion: typeof deductionSuggestions[0]; onAskDocket?: () => void }) {
  const [status, setStatus] = useState(suggestion.status);
  if (status !== "pending") return null;

  return (
    <div className="rounded-xl border-l-[3px] border-l-emerald-500 border p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-semibold">{suggestion.deductionType}</div>
          <div className="text-xs text-muted-foreground">{suggestion.clientName} · {suggestion.section}</div>
        </div>
        <div className="text-right">
          <div className="font-display text-xl tabular-nums text-emerald-600">~${suggestion.estimatedSavings.toLocaleString()}</div>
          <div className="text-[10px] text-muted-foreground">savings</div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Button size="sm" className="h-7 text-xs" onClick={() => setStatus("applied")}>
          Apply ${suggestion.estimatedSavings.toLocaleString()} deduction
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={() => setStatus("dismissed")}>
          Dismiss
        </Button>
        {onAskDocket && (
          <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground ml-auto" onClick={onAskDocket}>
            <Brain className="mr-1 size-3" /> Ask Docket
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// TIER 4: INFO — Extension predictions, quiet
// No colored border. Clean data display.
// ============================================================
function ExtensionPredictionCard({ prediction }: { prediction: typeof extensionPredictions[0] }) {
  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">{prediction.clientName}</div>
          <div className="text-xs text-muted-foreground">Extension likelihood</div>
        </div>
        <div className="font-display text-2xl tabular-nums tracking-tight">{prediction.probability}%</div>
      </div>
      <Progress value={prediction.probability} className="mt-3 h-1.5" indicatorColor={prediction.probability >= 80 ? "bg-red-500" : "bg-amber-500"} />
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {prediction.factors.map((f, i) => (
          <span key={i} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{f}</span>
        ))}
      </div>
      {prediction.probability >= 80 && (
        <Button size="sm" variant="outline" className="h-7 text-xs mt-3">
          File Form 4868
        </Button>
      )}
    </div>
  );
}

// ============================================================
// TIER 4: INFO — Estimated Tax, clean
// ============================================================
function EstimatedTaxCard({ calc }: { calc: typeof estimatedTaxCalcs[0] }) {
  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">{calc.clientName}</div>
          <div className="text-xs text-muted-foreground">2026 quarterly estimates</div>
        </div>
        <div className="font-display text-xl tabular-nums tracking-tight">${calc.totalEstimated.toLocaleString()}</div>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {(["q1", "q2", "q3", "q4"] as const).map(q => (
          <div key={q} className="rounded-lg border p-2 text-center">
            <div className="font-display text-sm tabular-nums">${calc.quarterlyAmounts[q].toLocaleString()}</div>
            <div className="text-[10px] text-muted-foreground">{q.toUpperCase()}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-xs text-muted-foreground">{calc.basis}</div>
      <Button size="sm" variant="outline" className="h-7 text-xs mt-3">
        <DollarSign className="mr-1 size-3" /> Send to client
      </Button>
    </div>
  );
}

// ============================================================
// IRS Notice Card — Tier 1 (critical, with AI draft)
// ============================================================
function IrsNoticeCard({ notice }: { notice: typeof irsNotices[0] }) {
  const [state, setState] = useState<DemoState>("idle");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(notice.aiDraftResponse);

  return (
    <div className="rounded-xl border-l-[3px] border-l-red-500 border p-4">
      <div className="flex items-start gap-3">
        <Mail className="size-4 text-red-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="text-sm font-semibold">{notice.noticeType} Notice</div>
          <div className="text-xs text-muted-foreground">{notice.clientName} · {notice.receivedDate}</div>
          <div className="mt-1 text-xs">{notice.summary}</div>
        </div>
      </div>
      <Separator className="my-3" />
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2">AI-drafted response</div>
      {editing ? (
        <div>
          <Textarea value={draft} onChange={e => setDraft(e.target.value)} className="min-h-[120px] text-xs font-mono" />
          <div className="mt-2 flex gap-2">
            <Button size="sm" className="h-7 text-xs" onClick={() => { setEditing(false); setState("processing"); setTimeout(() => setState("complete"), 1500); }}>Send response</Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      ) : state === "complete" ? (
        <div className="flex items-center gap-2 rounded-lg border bg-emerald-50 p-3 dark:bg-emerald-950/20">
          <Check className="size-4 text-emerald-600" />
          <span className="text-sm font-medium">Response sent</span>
        </div>
      ) : (
        <div>
          <pre className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">{draft}</pre>
          <div className="mt-3 flex gap-2">
            <Button size="sm" className="h-7 text-xs" onClick={() => { setState("processing"); setTimeout(() => setState("complete"), 1500); }}>Send response</Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditing(true)}>Edit draft</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Main Intelligence Panel
// ============================================================
export function IntelligencePanel() {
  const [selectedExtraction, setSelectedExtraction] = useState<DocumentExtraction | null>(null);
  let askDocket = (_q: string) => {};
  try { askDocket = useAIPanelAsk(); } catch {}

  return (
    <div className="space-y-6">
      {/* Critical: Compliance + IRS Notices */}
      {(complianceAlerts.length > 0 || irsNotices.length > 0) && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Compliance</h3>
          <div className="space-y-3">
            {complianceAlerts.map(ca => <ComplianceFlagCard key={ca.id} alert={ca} />)}
            {irsNotices.map(n => <IrsNoticeCard key={n.id} notice={n} />)}
          </div>
        </div>
      )}

      {/* Attention: Anomalies */}
      {anomalyAlerts.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Anomalies</h3>
          <div className="space-y-3">
            {anomalyAlerts.map(aa => (
              <AnomalyAlertCard
                key={aa.id}
                alert={aa}
                onAskDocket={() => askDocket(`Explain the ${aa.metric} anomaly for ${aa.clientName}. Prior year: $${aa.priorYear.toLocaleString()}, current: $${aa.currentYear.toLocaleString()}.`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Opportunity: Deductions */}
      {deductionSuggestions.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Deductions Found</h3>
          <div className="space-y-3">
            {deductionSuggestions.map(ds => (
              <DeductionSuggestionCard
                key={ds.id}
                suggestion={ds}
                onAskDocket={() => askDocket(`Tell me more about the ${ds.deductionType} deduction for ${ds.clientName} under ${ds.section}.`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Document Extraction */}
      {documentExtractions.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Document Extraction</h3>
          <div className="space-y-2">
            {documentExtractions.map(de => <DocumentExtractionCard key={de.id} extraction={de} onOpen={() => setSelectedExtraction(de)} />)}
          </div>
        </div>
      )}

      {/* Auto-Categorize */}
      {autoCategorizeItems.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Auto-Categorized</h3>
          <div className="space-y-2">
            {autoCategorizeItems.map(item => <AutoCategorizeCard key={item.id} item={item} />)}
          </div>
        </div>
      )}

      {/* Info: Extensions + Estimates */}
      {(extensionPredictions.length > 0 || estimatedTaxCalcs.length > 0) && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Predictions</h3>
          <div className="space-y-3">
            {extensionPredictions.map(ep => <ExtensionPredictionCard key={ep.id} prediction={ep} />)}
            {estimatedTaxCalcs.map(et => <EstimatedTaxCard key={et.id} calc={et} />)}
          </div>
        </div>
      )}

      <ExtractionDialog
        extraction={selectedExtraction}
        open={!!selectedExtraction}
        onOpenChange={(open) => !open && setSelectedExtraction(null)}
      />
    </div>
  );
}

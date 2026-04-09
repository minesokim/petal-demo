"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Check, X, AlertTriangle, TrendingDown, FileText,
  Calculator, Mail, Clock, ChevronRight, DollarSign, Brain, Sparkles
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
// Document Extraction Card — flagship feature, needs to stand out
// ============================================================
function DocumentExtractionCard({ extraction, onOpen }: { extraction: typeof documentExtractions[0]; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="flex w-full items-center gap-4 rounded-lg border p-3.5 text-left transition-all hover:shadow-md hover:border-primary/30 group">
      <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
        <FileText className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{extraction.documentType}</span>
          <Badge variant={extraction.overallConfidence >= 90 ? "default" : "secondary"} className="text-[10px]">{extraction.overallConfidence}%</Badge>
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {extraction.fields.length} fields extracted · {extraction.fields.filter(f => f.needsReview).length} need review
        </div>
      </div>
      <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
    </button>
  );
}

// ============================================================
// Auto-Categorize Card
// ============================================================
function AutoCategorizeCard({ item }: { item: typeof autoCategorizeItems[0] }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
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
// Compliance Flag Card — clean, no red tint backgrounds
// ============================================================
function ComplianceFlagCard({ alert }: { alert: typeof complianceAlerts[0] }) {
  const [status, setStatus] = useState(alert.status);
  if (status !== "pending") return null;

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 size-2 shrink-0 rounded-full bg-red-500" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{alert.title}</span>
            {alert.severity === "critical" && <Badge variant="destructive" className="text-[10px]">critical</Badge>}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{alert.description}</p>
          <div className="mt-2 flex items-center gap-4 text-xs">
            <span className="text-muted-foreground">Form: <strong>{alert.formRequired}</strong></span>
            <span className="text-red-600">{alert.fineRisk}</span>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Button size="sm" className="h-7 text-xs" onClick={() => setStatus("acknowledged")}>
          <Check className="size-3 mr-1" /> Acknowledge
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={() => setStatus("dismissed")}>
          <X className="size-3 mr-1" /> Dismiss
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// Anomaly Alert Card — clean data display
// ============================================================
function AnomalyAlertCard({ alert, onAskDocket }: { alert: typeof anomalyAlerts[0]; onAskDocket?: () => void }) {
  const [status, setStatus] = useState(alert.status);
  if (status !== "pending") return null;

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 size-2 shrink-0 rounded-full bg-amber-500" />
        <div className="flex-1">
          <div className="text-sm font-semibold">{alert.metric}</div>
          <div className="text-xs text-muted-foreground">{alert.clientName}</div>
        </div>
      </div>

      {/* Data comparison */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-lg border p-2.5 text-center">
          <div className="font-display text-base tabular-nums">${(alert.priorYear / 1000).toFixed(0)}K</div>
          <div className="text-[10px] text-muted-foreground">2024</div>
        </div>
        <div className="rounded-lg border p-2.5 text-center">
          <div className="font-display text-base tabular-nums">${(alert.currentYear / 1000).toFixed(0)}K</div>
          <div className="text-[10px] text-muted-foreground">2025</div>
        </div>
        <div className="rounded-lg border p-2.5 text-center">
          <div className="font-display text-base tabular-nums text-red-600">{alert.changePercent}%</div>
          <div className="text-[10px] text-muted-foreground">Change</div>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground leading-relaxed">{alert.aiExplanation}</p>

      <div className="mt-3 flex items-center gap-2">
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setStatus("flagged")}>
          Flag for review
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setStatus("proceeded")}>
          Proceed
        </Button>
        {onAskDocket && (
          <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground ml-auto" onClick={onAskDocket}>
            Ask Docket
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Deduction Suggestion Card
// ============================================================
function DeductionSuggestionCard({ suggestion, onAskDocket }: { suggestion: typeof deductionSuggestions[0]; onAskDocket?: () => void }) {
  const [status, setStatus] = useState(suggestion.status);
  if (status !== "pending") return null;

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 size-2 shrink-0 rounded-full bg-emerald-500" />
          <div>
            <div className="text-sm font-semibold">{suggestion.deductionType}</div>
            <div className="text-xs text-muted-foreground">{suggestion.section}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-lg tabular-nums text-emerald-600">~${suggestion.estimatedSavings.toLocaleString()}</div>
          <div className="text-[10px] text-muted-foreground">estimated savings</div>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{suggestion.basis}</p>
      <div className="mt-3 flex items-center gap-2">
        <Button size="sm" className="h-7 text-xs" onClick={() => setStatus("applied")}>
          <Check className="size-3 mr-1" /> Apply
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={() => setStatus("dismissed")}>
          <X className="size-3 mr-1" /> Dismiss
        </Button>
        {onAskDocket && (
          <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground ml-auto" onClick={onAskDocket}>
            Ask Docket
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Extension Prediction Card
// ============================================================
function ExtensionPredictionCard({ prediction }: { prediction: typeof extensionPredictions[0] }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`size-2 shrink-0 rounded-full ${prediction.probability >= 80 ? "bg-red-500" : "bg-amber-500"}`} />
          <div>
            <div className="text-sm font-semibold">{prediction.clientName}</div>
            <div className="text-xs text-muted-foreground">Extension likelihood</div>
          </div>
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
// Estimated Tax Card
// ============================================================
function EstimatedTaxCard({ calc }: { calc: typeof estimatedTaxCalcs[0] }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">2026 quarterly estimates</div>
          <div className="text-xs text-muted-foreground">{calc.clientName}</div>
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
      <p className="mt-3 text-xs text-muted-foreground">{calc.basis}</p>
      <Button size="sm" variant="outline" className="h-7 text-xs mt-3">
        Send to client
      </Button>
    </div>
  );
}

// ============================================================
// IRS Notice Card
// ============================================================
function IrsNoticeCard({ notice }: { notice: typeof irsNotices[0] }) {
  const [state, setState] = useState<DemoState>("idle");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(notice.aiDraftResponse);

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 size-2 shrink-0 rounded-full bg-red-500" />
        <div className="flex-1">
          <div className="text-sm font-semibold">{notice.noticeType} Notice</div>
          <div className="text-xs text-muted-foreground">{notice.clientName} · {notice.receivedDate}</div>
          <p className="mt-1.5 text-xs text-foreground/80">{notice.summary}</p>
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
        <div className="flex items-center gap-2 rounded-lg border p-3">
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
      {/* Document Extraction — flagship, at the top */}
      {documentExtractions.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Document Extraction</h3>
          <div className="rounded-lg border bg-card p-4 space-y-2">
            <div className="flex items-center gap-3 mb-1">
              <Sparkles className="size-4 text-primary" />
              <div className="flex-1">
                <div className="text-sm font-semibold">Extracted Documents</div>
                <div className="text-[11px] text-muted-foreground">Review fields, then push to OLT</div>
              </div>
            </div>
            {documentExtractions.map(de => <DocumentExtractionCard key={de.id} extraction={de} onOpen={() => setSelectedExtraction(de)} />)}
          </div>
        </div>
      )}

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

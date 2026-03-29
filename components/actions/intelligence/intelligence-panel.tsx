"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Check, X, AlertTriangle, TrendingDown, FileText,
  Brain, Calculator, Mail, Clock, Sparkles, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ExtractionDialog } from "@/components/documents/extraction-dialog";
import { type DocumentExtraction } from "@/lib/actions-mock-data";
import {
  documentExtractions, complianceAlerts, anomalyAlerts,
  extensionPredictions, deductionSuggestions, irsNotices,
  estimatedTaxCalcs, autoCategorizeItems,
  type DemoState,
} from "@/lib/actions-mock-data";

// ============================================================
// Document Extraction Card - clickable, opens glassmorphic dialog
// ============================================================
function DocumentExtractionCard({ extraction, onOpen }: { extraction: typeof documentExtractions[0]; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all hover:shadow-md hover:border-primary/20">
      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
        <FileText className="size-5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{extraction.documentType} - {extraction.clientName}</span>
          <Badge variant={extraction.overallConfidence >= 90 ? "default" : "secondary"} className="text-[10px]">{extraction.overallConfidence}%</Badge>
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {extraction.fields.length} fields extracted &middot; {extraction.fields.filter(f => f.needsReview).length} need review &middot; Click to review and push to OLT
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
    <Card>
      <CardContent className="flex items-center gap-3 py-4">
        <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
          <FileText className="size-4 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium">{item.originalFileName}</div>
          <div className="text-xs text-muted-foreground">{item.clientName} &middot; Detected: {item.detectedType}</div>
        </div>
        <div className="flex items-center gap-2">
          {!item.readable && <Badge variant="destructive" className="text-[10px]">Unreadable</Badge>}
          {item.convertedToPdf && <Badge variant="outline" className="text-[10px]">PDF</Badge>}
          <Badge variant={item.confidence >= 80 ? "default" : "secondary"} className="text-[10px]">{item.confidence}%</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Compliance Flag Card
// ============================================================
function ComplianceFlagCard({ alert }: { alert: typeof complianceAlerts[0] }) {
  const [status, setStatus] = useState(alert.status);
  return (
    <Card className={status === "acknowledged" ? "opacity-60" : ""}>
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
            alert.severity === "critical" ? "bg-red-100 dark:bg-red-900/50" : "bg-amber-100 dark:bg-amber-900/50"
          }`}>
            <AlertTriangle className={`size-4 ${alert.severity === "critical" ? "text-red-600" : "text-amber-600"}`} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{alert.title}</span>
              <Badge variant={alert.severity === "critical" ? "destructive" : "secondary"} className="text-[10px]">{alert.severity}</Badge>
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">{alert.clientName}</div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{alert.description}</p>
            <div className="mt-2 flex items-center gap-4 text-xs">
              <span className="text-muted-foreground">Form: <strong>{alert.formRequired}</strong></span>
              <span className="text-red-600">Fine risk: {alert.fineRisk}</span>
            </div>
          </div>
        </div>
        {status === "pending" && (
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => setStatus("acknowledged")}><Check className="size-3.5" /> Acknowledge</Button>
            <Button size="sm" variant="outline" onClick={() => setStatus("dismissed")}><X className="size-3.5" /> Dismiss</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// Anomaly Alert Card
// ============================================================
function AnomalyAlertCard({ alert }: { alert: typeof anomalyAlerts[0] }) {
  const [status, setStatus] = useState(alert.status);
  return (
    <Card className={status !== "pending" ? "opacity-60" : ""}>
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
            <TrendingDown className="size-4 text-amber-600" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">Year-over-year anomaly</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{alert.clientName} &middot; {alert.metric}</div>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <div className="rounded-lg border p-2 text-center">
                <div className="font-display text-lg tabular-nums">${(alert.priorYear / 1000).toFixed(0)}K</div>
                <div className="text-[10px] text-muted-foreground">2024</div>
              </div>
              <div className="rounded-lg border p-2 text-center">
                <div className="font-display text-lg tabular-nums">${(alert.currentYear / 1000).toFixed(0)}K</div>
                <div className="text-[10px] text-muted-foreground">2025</div>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-center dark:border-red-900 dark:bg-red-950/30">
                <div className="font-display text-lg tabular-nums text-red-600">{alert.changePercent}%</div>
                <div className="text-[10px] text-muted-foreground">Change</div>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{alert.aiExplanation}</p>
          </div>
        </div>
        {status === "pending" && (
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="destructive" onClick={() => setStatus("flagged")}><AlertTriangle className="size-3.5" /> Flag for review</Button>
            <Button size="sm" variant="outline" onClick={() => setStatus("proceeded")}><Check className="size-3.5" /> Proceed</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// Extension Prediction Card
// ============================================================
function ExtensionPredictionCard({ prediction }: { prediction: typeof extensionPredictions[0] }) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">{prediction.clientName}</div>
            <div className="text-xs text-muted-foreground">Extension likelihood</div>
          </div>
          <div className="font-display text-2xl tabular-nums tracking-tight">{prediction.probability}%</div>
        </div>
        <Progress value={prediction.probability} className="mt-3 h-2" indicatorColor={prediction.probability >= 80 ? "bg-red-500" : "bg-amber-500"} />
        <div className="mt-3 space-y-1">
          {prediction.factors.map((f, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
              <span className="mt-0.5 size-1 shrink-0 rounded-full bg-muted-foreground" />
              {f}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Deduction Suggestion Card
// ============================================================
function DeductionSuggestionCard({ suggestion }: { suggestion: typeof deductionSuggestions[0] }) {
  const [status, setStatus] = useState(suggestion.status);
  return (
    <Card className={status !== "pending" ? "opacity-60" : ""}>
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
            <Sparkles className="size-4 text-emerald-600" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">{suggestion.deductionType}</div>
            <div className="text-xs text-muted-foreground">{suggestion.clientName} &middot; {suggestion.section}</div>
            <div className="mt-2 font-display text-xl tabular-nums tracking-tight text-emerald-600">~${suggestion.estimatedSavings.toLocaleString()} savings</div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{suggestion.description}</p>
          </div>
        </div>
        {status === "pending" && (
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => setStatus("applied")}><Check className="size-3.5" /> Apply</Button>
            <Button size="sm" variant="outline" onClick={() => setStatus("dismissed")}><X className="size-3.5" /> Dismiss</Button>
          </div>
        )}
      </CardContent>
    </Card>
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
    <Card>
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/50">
            <Mail className="size-4 text-red-600" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">{notice.noticeType} Notice</div>
            <div className="text-xs text-muted-foreground">{notice.clientName} &middot; Received {notice.receivedDate}</div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{notice.summary}</p>
          </div>
        </div>
        <Separator className="my-3" />
        <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2">AI-drafted response</div>
        {editing ? (
          <div>
            <Textarea value={draft} onChange={e => setDraft(e.target.value)} className="min-h-[120px] text-xs font-mono" />
            <div className="mt-2 flex gap-2">
              <Button size="sm" onClick={() => { setEditing(false); setState("processing"); setTimeout(() => setState("complete"), 1500); }}><Check className="size-3.5" /> Send</Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}><X className="size-3.5" /> Cancel</Button>
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
              <Button size="sm" onClick={() => { setState("processing"); setTimeout(() => setState("complete"), 1500); }}><Mail className="size-3.5" /> Send response</Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}><FileText className="size-3.5" /> Edit</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// Estimated Tax Card
// ============================================================
function EstimatedTaxCard({ calc }: { calc: typeof estimatedTaxCalcs[0] }) {
  return (
    <Card>
      <CardContent className="py-4">
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
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{calc.basis}</p>
        <Button size="sm" className="mt-3"><Calculator className="size-3.5" /> Send to client</Button>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Main Intelligence Panel
// ============================================================
export function IntelligencePanel() {
  const [selectedExtraction, setSelectedExtraction] = useState<DocumentExtraction | null>(null);

  return (
    <div className="space-y-6">
      {/* Document Extraction */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">Document Extraction</h3>
        <div className="space-y-3">
          {documentExtractions.map(de => <DocumentExtractionCard key={de.id} extraction={de} onOpen={() => setSelectedExtraction(de)} />)}
        </div>
      </div>

      {/* Auto-Categorize */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">Auto-Categorized Uploads</h3>
        <div className="space-y-2">
          {autoCategorizeItems.map(item => <AutoCategorizeCard key={item.id} item={item} />)}
        </div>
      </div>

      {/* Compliance */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">Compliance Alerts</h3>
        <div className="space-y-2">
          {complianceAlerts.map(ca => <ComplianceFlagCard key={ca.id} alert={ca} />)}
        </div>
      </div>

      {/* Anomalies */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">Year-over-Year Anomalies</h3>
        <div className="space-y-2">
          {anomalyAlerts.map(aa => <AnomalyAlertCard key={aa.id} alert={aa} />)}
        </div>
      </div>

      {/* Extension Predictions */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">Extension Predictions</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {extensionPredictions.map(ep => <ExtensionPredictionCard key={ep.id} prediction={ep} />)}
        </div>
      </div>

      {/* Deductions */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">Deduction Suggestions</h3>
        <div className="space-y-2">
          {deductionSuggestions.map(ds => <DeductionSuggestionCard key={ds.id} suggestion={ds} />)}
        </div>
      </div>

      {/* IRS Notices */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">IRS Notice Responses</h3>
        <div className="space-y-2">
          {irsNotices.map(n => <IrsNoticeCard key={n.id} notice={n} />)}
        </div>
      </div>

      {/* Estimated Tax */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">Estimated Tax Calculations</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {estimatedTaxCalcs.map(et => <EstimatedTaxCard key={et.id} calc={et} />)}
        </div>
      </div>

      <ExtractionDialog
        extraction={selectedExtraction}
        open={!!selectedExtraction}
        onOpenChange={(open) => !open && setSelectedExtraction(null)}
      />
    </div>
  );
}

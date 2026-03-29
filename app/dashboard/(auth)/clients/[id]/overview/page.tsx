"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  FileText, DollarSign, Clock, Mail, Phone, Send,
  ExternalLink, Calendar, MessageSquare, Pen, CheckCircle,
  AlertTriangle, ChevronRight
} from "lucide-react";
import { clients, stageLabels, actionItems } from "@/lib/mock-data";
import {
  complianceAlerts, anomalyAlerts, deductionSuggestions,
  extensionPredictions, documentExtractions, estimatedTaxCalcs,
  feedActions, type FeedAction
} from "@/lib/actions-mock-data";
import { ExtractionDialog } from "@/components/documents/extraction-dialog";
import { type DocumentExtraction } from "@/lib/actions-mock-data";
import TrackingTimeline, { type TimelineItem } from "@/components/ui/tracking-timeline";
import { ActionDraftCard } from "@/components/action-draft-card";
import { ActionCard } from "@/components/actions/action-card";
import { ActionExecutionSheet } from "@/components/actions/action-execution-sheet";
import { useAIPanelAsk } from "@/components/ai-panel";

export default function ClientOverviewPage() {
  const params = useParams();
  const client = clients.find(c => c.id === params.id);
  const [selectedAction, setSelectedAction] = useState<FeedAction | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedExtraction, setSelectedExtraction] = useState<DocumentExtraction | null>(null);
  let askDocket = (_q: string) => {};
  try { askDocket = useAIPanelAsk(); } catch {}

  if (!client) return <div className="text-muted-foreground">Client not found</div>;

  const docPercent = Math.round((client.documentsSubmitted / client.documentsRequired) * 100);
  const stageIndex = ["not_started", "intake_sent", "docs_collecting", "docs_complete", "in_prep", "in_review", "ready_to_sign", "filed"].indexOf(client.returnStage);

  const timelineItems: TimelineItem[] = [
    { id: 1, title: "Intake Sent", date: "Engagement letter + 7216 consent", status: stageIndex > 1 ? "completed" : stageIndex === 1 ? "in-progress" : "pending" },
    { id: 2, title: "Documents Collected", date: `${client.documentsSubmitted} of ${client.documentsRequired} received`, status: stageIndex > 3 ? "completed" : stageIndex >= 2 && stageIndex <= 3 ? "in-progress" : "pending" },
    { id: 3, title: "In Preparation", date: "Return being prepared", status: stageIndex > 4 ? "completed" : stageIndex === 4 ? "in-progress" : "pending" },
    { id: 4, title: "Review", date: "Reviewing for accuracy", status: stageIndex > 5 ? "completed" : stageIndex === 5 ? "in-progress" : "pending" },
    { id: 5, title: "Ready to Sign", date: "8879 e-signature pending", status: stageIndex > 6 ? "completed" : stageIndex === 6 ? "in-progress" : "pending" },
    { id: 6, title: "Filed", date: "Return filed with IRS", status: stageIndex >= 7 ? "completed" : "pending" },
  ];

  const clientActions = actionItems.filter(a => a.clientId === client.id && !a.isResolved);
  const clientFeedActions = feedActions.filter(a => a.clientId === client.id && !a.isResolved);
  const clientCompliance = complianceAlerts.filter(a => a.clientId === client.id);
  const clientAnomalies = anomalyAlerts.filter(a => a.clientId === client.id);
  const clientDeductions = deductionSuggestions.filter(a => a.clientId === client.id);
  const clientExtensions = extensionPredictions.filter(a => a.clientId === client.id);
  const clientExtractions = documentExtractions.filter(a => a.clientId === client.id);
  const clientEstimates = estimatedTaxCalcs.filter(a => a.clientId === client.id);
  const hasIntel = clientCompliance.length + clientAnomalies.length + clientDeductions.length + clientExtensions.length + clientExtractions.length + clientEstimates.length > 0;

  return (
    <div className="space-y-6">
      {/* Action items - full interactive feed */}
      {(clientFeedActions.length > 0 || clientActions.length > 0) && (
        <div className="space-y-3">
          <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Actions for {client.fullName.split(" ")[0]}</div>
          {clientFeedActions.map(action => (
            <ActionCard key={action.id} action={action} onClick={() => { setSelectedAction(action); setSheetOpen(true); }} />
          ))}
          {clientActions.filter(a => !clientFeedActions.some(fa => fa.clientId === a.clientId && fa.title === a.title)).map(action => (
            <ActionDraftCard key={action.id} action={action} />
          ))}
        </div>
      )}

      {/* Document Extraction - clickable cards that open glassmorphic dialog */}
      {clientExtractions.length > 0 && (
        <div className="space-y-3">
          <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Document processing</div>
          {clientExtractions.map(extraction => (
            <button
              key={extraction.id}
              onClick={() => setSelectedExtraction(extraction)}
              className="flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all hover:shadow-md hover:border-primary/20"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="size-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{extraction.documentType} ready for review</span>
                  <Badge variant={extraction.overallConfidence >= 90 ? "default" : "secondary"} className="text-[10px]">{extraction.overallConfidence}%</Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {extraction.fields.length} fields extracted &middot; {extraction.fields.filter(f => f.needsReview).length} need review &middot; Click to review and push to OLT
                </div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* AI Insights */}
      {hasIntel && (
        <div className="space-y-2">
          <div className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">AI Insights</div>
          {clientCompliance.map(a => (
            <button key={a.id} onClick={() => askDocket(`Tell me more about the ${a.title} compliance requirement for ${client.fullName}. What are the risks and what do I need to do?`)} className="flex w-full items-start gap-2 rounded-xl border p-3 text-left transition-colors hover:bg-muted/50">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-500" />
              <div className="flex-1"><div className="text-sm font-semibold">{a.title}</div><p className="mt-0.5 text-xs text-muted-foreground">{a.description}</p><div className="mt-1 text-xs text-red-600">Fine risk: {a.fineRisk}</div></div>
              <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            </button>
          ))}
          {clientAnomalies.map(a => (
            <button key={a.id} onClick={() => askDocket(`Explain the ${a.metric} anomaly for ${client.fullName}. Revenue went from $${a.priorYear.toLocaleString()} to $${a.currentYear.toLocaleString()} (${a.changePercent}% change). What could be causing this and should I be concerned?`)} className="flex w-full items-start gap-2 rounded-xl border p-3 text-left transition-colors hover:bg-muted/50">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
              <div className="flex-1"><div className="text-sm font-semibold">{a.metric}: {a.changePercent}% change</div><p className="mt-0.5 text-xs text-muted-foreground">{a.aiExplanation}</p></div>
              <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            </button>
          ))}
          {clientDeductions.map(a => (
            <button key={a.id} onClick={() => askDocket(`Tell me about the ${a.deductionType} (${a.section}) deduction for ${client.fullName}. How does it work and what's the estimated savings of $${a.estimatedSavings.toLocaleString()}?`)} className="flex w-full items-start gap-2 rounded-xl border p-3 text-left transition-colors hover:bg-muted/50">
              <CheckCircle className="mt-0.5 size-4 shrink-0 text-emerald-500" />
              <div className="flex-1"><div className="text-sm font-semibold">{a.deductionType} ({a.section})</div><p className="mt-0.5 text-xs text-muted-foreground">~${a.estimatedSavings.toLocaleString()} estimated savings</p></div>
              <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            </button>
          ))}
          {clientExtensions.map(a => (
            <button key={a.id} onClick={() => askDocket(`${client.fullName} has a ${a.probability}% extension likelihood. What are the factors and what should I do about it?`)} className="flex w-full items-start gap-2 rounded-xl border p-3 text-left transition-colors hover:bg-muted/50">
              <Clock className="mt-0.5 size-4 shrink-0 text-amber-500" />
              <div className="flex-1"><div className="text-sm font-semibold">Extension likelihood: {a.probability}%</div><p className="mt-0.5 text-xs text-muted-foreground">{a.factors.join(", ")}</p></div>
              <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Stats + Progress */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Return Status</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <div className="rounded-lg border p-3 text-center">
                <FileText className="mx-auto mb-1 size-4 text-muted-foreground" />
                <div className="font-display text-lg tabular-nums tracking-tight">{client.documentsSubmitted}/{client.documentsRequired}</div>
                <div className="text-[10px] text-muted-foreground">Documents</div>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <DollarSign className="mx-auto mb-1 size-4 text-muted-foreground" />
                <div className="font-display text-lg tabular-nums tracking-tight">${client.feeAmount}</div>
                <div className="text-[10px] text-muted-foreground">Fee</div>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <Clock className="mx-auto mb-1 size-4 text-muted-foreground" />
                <div className="font-display text-lg tabular-nums tracking-tight">{client.depositPaid ? "Paid" : "No"}</div>
                <div className="text-[10px] text-muted-foreground">Deposit</div>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <FileText className="mx-auto mb-1 size-4 text-muted-foreground" />
                <div className="font-display text-lg tabular-nums tracking-tight">{docPercent}%</div>
                <div className="text-[10px] text-muted-foreground">Complete</div>
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>Document progress</span><span>{client.documentsSubmitted} of {client.documentsRequired}</span>
              </div>
              <Progress value={docPercent} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Return Timeline */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Return Progress</CardTitle></CardHeader>
          <CardContent>
            <TrackingTimeline items={timelineItems} />
          </CardContent>
        </Card>
      </div>

      {/* Contact + Filing + Notes */}
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Contact</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Mail className="size-4" /> {client.email}</div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="size-4" /> {client.phone}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Filing Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div>Filing Status: <span className="font-medium text-foreground">{client.filingStatus.toUpperCase()}</span></div>
            <div>Last Portal Login: <span className="font-medium text-foreground">{client.lastPortalLogin ? new Date(client.lastPortalLogin).toLocaleDateString() : "Never"}</span></div>
          </CardContent>
        </Card>
      </div>

      {/* Context Notes */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Context Notes</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground">{client.notes}</p>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-2 xl:grid-cols-6">
        <Button variant="outline" size="sm" className="h-auto flex-col gap-1 py-3"><Send className="size-4" /><span className="text-xs">Remind</span></Button>
        <Button variant="outline" size="sm" className="h-auto flex-col gap-1 py-3"><FileText className="size-4" /><span className="text-xs">Request Docs</span></Button>
        <Button variant="outline" size="sm" className="h-auto flex-col gap-1 py-3"><MessageSquare className="size-4" /><span className="text-xs">Message</span></Button>
        <Button variant="outline" size="sm" className="h-auto flex-col gap-1 py-3"><Calendar className="size-4" /><span className="text-xs">Schedule</span></Button>
        <Button variant="outline" size="sm" className="h-auto flex-col gap-1 py-3"><ExternalLink className="size-4" /><span className="text-xs">Portal</span></Button>
        <Button variant="outline" size="sm" className="h-auto flex-col gap-1 py-3"><Pen className="size-4" /><span className="text-xs">Edit</span></Button>
      </div>

      {/* Action Execution Dialog */}
      <ActionExecutionSheet
        action={selectedAction}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />

      {/* Extraction Dialog */}
      <ExtractionDialog
        extraction={selectedExtraction}
        open={!!selectedExtraction}
        onOpenChange={(open) => !open && setSelectedExtraction(null)}
      />
    </div>
  );
}

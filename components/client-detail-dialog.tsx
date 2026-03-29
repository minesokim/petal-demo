"use client";

import { type Client, stageLabels, actionItems } from "@/lib/mock-data";
import Link from "next/link";
import { useAIPanelAsk } from "@/components/ai-panel";
import {
  complianceAlerts, anomalyAlerts, deductionSuggestions,
  extensionPredictions, documentExtractions, estimatedTaxCalcs
} from "@/lib/actions-mock-data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Building2, Mail, Phone, FileText, DollarSign, Clock,
  Send, ExternalLink, Calendar, MessageSquare, Pen,
  CheckCircle, AlertTriangle, ArrowUpRight, ChevronRight
} from "lucide-react";
import TrackingTimeline, { type TimelineItem } from "@/components/ui/tracking-timeline";
import { ActionDraftCard } from "@/components/action-draft-card";

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

interface ClientDetailDialogProps {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClientDetailDialog({ client, open, onOpenChange }: ClientDetailDialogProps) {
  let askDocket = (_q: string) => {};
  try { askDocket = useAIPanelAsk(); } catch {}

  if (!client) return null;

  const docPercent = Math.round((client.documentsSubmitted / client.documentsRequired) * 100);
  const stageIndex = ['not_started', 'intake_sent', 'docs_collecting', 'docs_complete', 'in_prep', 'in_review', 'ready_to_sign', 'filed'].indexOf(client.returnStage);

  const timelineItems: TimelineItem[] = [
    { id: 1, title: "Intake Sent", date: "Engagement letter + 7216 consent", status: stageIndex > 1 ? "completed" : stageIndex === 1 ? "in-progress" : "pending" },
    { id: 2, title: "Documents Collected", date: `${client.documentsSubmitted} of ${client.documentsRequired} received`, status: stageIndex > 3 ? "completed" : stageIndex >= 2 && stageIndex <= 3 ? "in-progress" : "pending" },
    { id: 3, title: "In Preparation", date: "Return being prepared", status: stageIndex > 4 ? "completed" : stageIndex === 4 ? "in-progress" : "pending" },
    { id: 4, title: "Review", date: "Reviewing for accuracy", status: stageIndex > 5 ? "completed" : stageIndex === 5 ? "in-progress" : "pending" },
    { id: 5, title: "Ready to Sign", date: "8879 e-signature pending", status: stageIndex > 6 ? "completed" : stageIndex === 6 ? "in-progress" : "pending" },
    { id: 6, title: "Filed", date: "Return filed with IRS", status: stageIndex >= 7 ? "completed" : "pending" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <Avatar className="size-16">
              <AvatarImage src={client.avatar} alt={client.fullName} />
              <AvatarFallback className="text-xl">{getInitials(client.fullName)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-xl">{client.fullName}</DialogTitle>
                {client.type === "business" && <Building2 className="size-4 text-muted-foreground" />}
              </div>
              {client.businessName && (
                <p className="text-sm text-muted-foreground">{client.businessName}</p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge>{stageLabels[client.returnStage]}</Badge>
                <Badge variant="outline">{client.serviceTier}</Badge>
                <Badge variant="outline">${client.feeAmount}</Badge>
                {client.urgency === "urgent" && <Badge variant="destructive">Urgent</Badge>}
                {client.urgency === "high" && <Badge variant="secondary">High Priority</Badge>}
                <Button size="sm" variant="ghost" className="ml-auto h-7 text-xs" asChild>
                  <Link href={`/dashboard/clients/${client.id}/overview`}>
                    Open full profile <ArrowUpRight className="ml-1 size-3" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Action Needed */}
        {(() => {
          const clientActions = actionItems.filter(a => a.clientId === client.id && !a.isResolved);
          if (clientActions.length === 0) return null;
          return (
            <div className="mt-1 space-y-3">
              {clientActions.map((action) => (
                <ActionDraftCard key={action.id} action={action} />
              ))}
            </div>
          );
        })()}

        {/* Intelligence Alerts for this client */}
        {(() => {
          const clientCompliance = complianceAlerts.filter(a => a.clientId === client.id);
          const clientAnomalies = anomalyAlerts.filter(a => a.clientId === client.id);
          const clientDeductions = deductionSuggestions.filter(a => a.clientId === client.id);
          const clientExtensions = extensionPredictions.filter(a => a.clientId === client.id);
          const clientExtractions = documentExtractions.filter(a => a.clientId === client.id);
          const clientEstimates = estimatedTaxCalcs.filter(a => a.clientId === client.id);
          const hasIntel = clientCompliance.length + clientAnomalies.length + clientDeductions.length + clientExtensions.length + clientExtractions.length + clientEstimates.length > 0;
          if (!hasIntel) return null;
          return (
            <div className="mt-1 space-y-2">
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">AI Insights</div>
              {clientCompliance.map(a => (
                <button key={a.id} onClick={() => { onOpenChange(false); setTimeout(() => askDocket(`Tell me about ${a.title} for ${client.fullName}. What are the risks and what do I need to do?`), 300); }} className="flex w-full items-start gap-2 rounded-xl border p-3 text-left transition-colors hover:bg-muted/50">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-500" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{a.title}</div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{a.description}</p>
                    <div className="mt-1 text-xs text-red-600">Fine risk: {a.fineRisk}</div>
                  </div>
                  <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
              {clientAnomalies.map(a => (
                <button key={a.id} onClick={() => { onOpenChange(false); setTimeout(() => askDocket(`Explain the ${a.metric} anomaly for ${client.fullName}. Revenue changed ${a.changePercent}%. What could be causing this?`), 300); }} className="flex w-full items-start gap-2 rounded-xl border p-3 text-left transition-colors hover:bg-muted/50">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{a.metric}: {a.changePercent}% change</div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{a.aiExplanation}</p>
                  </div>
                  <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
              {clientDeductions.map(a => (
                <button key={a.id} onClick={() => { onOpenChange(false); setTimeout(() => askDocket(`Tell me about ${a.deductionType} (${a.section}) for ${client.fullName}. Estimated savings: $${a.estimatedSavings.toLocaleString()}`), 300); }} className="flex w-full items-start gap-2 rounded-xl border p-3 text-left transition-colors hover:bg-muted/50">
                  <CheckCircle className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{a.deductionType} ({a.section})</div>
                    <p className="mt-0.5 text-xs text-muted-foreground">~${a.estimatedSavings.toLocaleString()} estimated savings</p>
                  </div>
                  <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
              {clientExtensions.map(a => (
                <button key={a.id} onClick={() => { onOpenChange(false); setTimeout(() => askDocket(`${client.fullName} has a ${a.probability}% extension likelihood. Factors: ${a.factors.join(", ")}. What should I do?`), 300); }} className="flex w-full items-start gap-2 rounded-xl border p-3 text-left transition-colors hover:bg-muted/50">
                  <Clock className="mt-0.5 size-4 shrink-0 text-amber-500" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">Extension likelihood: {a.probability}%</div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{a.factors.join(", ")}</p>
                  </div>
                  <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
              {clientExtractions.map(a => (
                <div key={a.id} className="flex items-start gap-2 rounded-xl border p-3">
                  <FileText className="mt-0.5 size-4 shrink-0 text-blue-500" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{a.documentType} extracted ({a.overallConfidence}% confidence)</div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{a.fields.filter(f => f.needsReview).length} fields need review</p>
                  </div>
                </div>
              ))}
              {clientEstimates.map(a => (
                <div key={a.id} className="flex items-start gap-2 rounded-xl border p-3">
                  <DollarSign className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">Quarterly estimates: ${a.totalEstimated.toLocaleString()}/year</div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{a.basis}</p>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Stats row */}
        <div className="mt-2 grid grid-cols-4 gap-4">
          <div className="rounded-xl border p-3 text-center">
            <FileText className="mx-auto mb-1 size-4 text-muted-foreground" />
            <div className="font-display text-xl tracking-tight tabular-nums">{client.documentsSubmitted}/{client.documentsRequired}</div>
            <div className="text-xs text-muted-foreground">Documents</div>
          </div>
          <div className="rounded-xl border p-3 text-center">
            <DollarSign className="mx-auto mb-1 size-4 text-muted-foreground" />
            <div className="font-display text-xl tracking-tight tabular-nums">${client.feeAmount}</div>
            <div className="text-xs text-muted-foreground">Fee</div>
          </div>
          <div className="rounded-xl border p-3 text-center">
            <Clock className="mx-auto mb-1 size-4 text-muted-foreground" />
            <div className="font-display text-xl tracking-tight tabular-nums">{client.depositPaid ? "Paid" : "No"}</div>
            <div className="text-xs text-muted-foreground">Deposit</div>
          </div>
          <div className="rounded-xl border p-3 text-center">
            <FileText className="mx-auto mb-1 size-4 text-muted-foreground" />
            <div className="font-display text-xl tracking-tight tabular-nums">{docPercent}%</div>
            <div className="text-xs text-muted-foreground">Complete</div>
          </div>
        </div>

        {/* Document progress bar */}
        <div className="mt-1">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>Document progress</span>
            <span>{client.documentsSubmitted} of {client.documentsRequired}</span>
          </div>
          <Progress value={docPercent} className="h-2" />
        </div>

        <Separator />

        {/* Return Timeline - with pulsing animation */}
        <div>
          <h4 className="mb-3 text-sm font-semibold">Return Progress</h4>
          <TrackingTimeline items={timelineItems} />
        </div>

        <Separator />

        {/* Contact info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="mb-2 text-sm font-semibold">Contact</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="size-4" /> {client.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="size-4" /> {client.phone}
              </div>
            </div>
          </div>
          <div>
            <h4 className="mb-2 text-sm font-semibold">Filing Details</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>Filing Status: <span className="font-medium text-foreground">{client.filingStatus.toUpperCase()}</span></div>
              <div>Last Portal Login: <span className="font-medium text-foreground">{client.lastPortalLogin ? new Date(client.lastPortalLogin).toLocaleDateString() : "Never"}</span></div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Context notes */}
        <div>
          <h4 className="mb-2 text-sm font-semibold">Context Notes</h4>
          <div className="rounded-xl bg-muted/50 p-4">
            <p className="text-sm leading-relaxed text-muted-foreground">{client.notes}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h4 className="mb-3 text-sm font-semibold">Actions</h4>
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" size="sm" className="h-auto flex-col gap-1 py-3">
              <Send className="size-4" />
              <span className="text-xs">Send Reminder</span>
            </Button>
            <Button variant="outline" size="sm" className="h-auto flex-col gap-1 py-3">
              <FileText className="size-4" />
              <span className="text-xs">Request Docs</span>
            </Button>
            <Button variant="outline" size="sm" className="h-auto flex-col gap-1 py-3">
              <MessageSquare className="size-4" />
              <span className="text-xs">Message</span>
            </Button>
            <Button variant="outline" size="sm" className="h-auto flex-col gap-1 py-3">
              <Calendar className="size-4" />
              <span className="text-xs">Schedule Call</span>
            </Button>
            <Button variant="outline" size="sm" className="h-auto flex-col gap-1 py-3">
              <ExternalLink className="size-4" />
              <span className="text-xs">View Portal</span>
            </Button>
            <Button variant="outline" size="sm" className="h-auto flex-col gap-1 py-3">
              <Pen className="size-4" />
              <span className="text-xs">Edit Client</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

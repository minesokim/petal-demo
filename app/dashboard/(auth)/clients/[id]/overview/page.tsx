"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  FileText, DollarSign, Clock, Mail, Phone, Send,
  ExternalLink, Calendar, MessageSquare, Pen, CheckCircle,
  AlertTriangle, ChevronRight, Shield, Check, X,
  TrendingDown, Calculator, Brain, Download, ClipboardList
} from "lucide-react";
import Link from "next/link";
import { clients, stageLabels, actionItems, getClientPaymentSummary, type InsightAction } from "@/lib/mock-data";
import { DocketInsightCard, TrackingBadgeGroup } from "@/components/insights";
import { getInsightForClient, getTrackingBadgesForClient } from "@/lib/insights-mock-data";
import {
  complianceAlerts, anomalyAlerts, deductionSuggestions,
  extensionPredictions, documentExtractions, estimatedTaxCalcs,
  feedActions, irsNotices, type FeedAction, type DocumentExtraction
} from "@/lib/actions-mock-data";
import { ExtractionDialog } from "@/components/documents/extraction-dialog";
import TrackingTimeline, { type TimelineItem } from "@/components/ui/tracking-timeline";
import { ActionDraftCard } from "@/components/action-draft-card";
import { ActionCard } from "@/components/actions/action-card";
import { ActionExecutionSheet } from "@/components/actions/action-execution-sheet";
import { EroSignatureDialog } from "@/components/ero-signature-dialog";
import { useAIPanelAsk } from "@/components/ai-panel";
import { useToast } from "@/components/ui/toast-notification";
import { OpenItemsSection } from "@/components/issues/open-items-section";
import { UpcomingCallBanner } from "@/components/upcoming-call-banner";
import { Form8867Dialog } from "@/components/compliance/form-8867-dialog";
import { PrepWorkspaceModal } from "@/components/prep-workspace/prep-workspace-modal";
import { BillingCard } from "@/components/billing/billing-card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export default function ClientOverviewPage() {
  const params = useParams();
  const client = clients.find(c => c.id === params.id);
  const [selectedAction, setSelectedAction] = useState<FeedAction | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedExtraction, setSelectedExtraction] = useState<DocumentExtraction | null>(null);
  const [eroOpen, setEroOpen] = useState(false);
  const [stageOverride, setStageOverride] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [sentBilling, setSentBilling] = useState<string | null>(null);
  const [completePrepOpen, setCompletePrepOpen] = useState(false);
  const [returnSummary, setReturnSummary] = useState("");
  const [prepWorkspaceOpen, setPrepWorkspaceOpen] = useState(false);
  const [extensionDialogOpen, setExtensionDialogOpen] = useState(false);
  const [flaggedItems, setFlaggedItems] = useState<Array<{ id: string; clientId: string; title: string; description: string; source: string; priority: string; createdAt: string; status: string }>>([]);
  const { showToast } = useToast();
  let askDocket = (_q: string) => {};
  try { askDocket = useAIPanelAsk(); } catch {}

  if (!client) return <div className="text-muted-foreground">Client not found</div>;

  const currentStage = stageOverride || client.returnStage;
  const clientInsight = getInsightForClient(client.id);
  const clientTrackingBadges = getTrackingBadgesForClient(client.id);

  const handleInsightAction = (action: InsightAction) => {
    if (action.action === "file_extension") {
      setExtensionDialogOpen(true);
      return;
    }
    if (action.action === "ask_docket") {
      askDocket(`Tell me about ${client.fullName}'s situation — what's complex about this return?`);
      return;
    }
    showToast("success", `Action: ${action.label}`, `Executing ${action.action}...`);
  };
  const docPercent = Math.round((client.documentsSubmitted / client.documentsRequired) * 100);
  const stageIndex = ["new_intake", "collecting_docs", "ready_to_prep", "in_preparation", "client_review", "pay_and_sign", "filed"].indexOf(currentStage);
  const ps = getClientPaymentSummary(client.id);

  const timelineItems: TimelineItem[] = [
    { id: 1, title: "New Intake", date: "Engagement letter + 7216 consent", status: stageIndex > 0 ? "completed" : stageIndex === 0 ? "in-progress" : "pending" },
    { id: 2, title: "Collecting Docs", date: `${client.documentsSubmitted} of ${client.documentsRequired} received`, status: stageIndex > 1 ? "completed" : stageIndex === 1 ? "in-progress" : "pending" },
    { id: 3, title: "Ready to Prep", date: "All docs received, queued", status: stageIndex > 2 ? "completed" : stageIndex === 2 ? "in-progress" : "pending" },
    { id: 4, title: "In Preparation", date: "Antonio preparing the return", status: stageIndex > 3 ? "completed" : stageIndex === 3 ? "in-progress" : "pending" },
    { id: 5, title: "Client Review", date: "Client reviewing the return", status: stageIndex > 4 ? "completed" : stageIndex === 4 ? "in-progress" : "pending" },
    { id: 6, title: "Pay & Sign", date: "Payment + 8879 + ERO signature", status: stageIndex > 5 ? "completed" : stageIndex === 5 ? "in-progress" : "pending" },
    { id: 7, title: "Filed", date: "Return filed with IRS", status: stageIndex >= 6 ? "completed" : "pending" },
  ];

  const clientActions = actionItems.filter(a => a.clientId === client.id && !a.isResolved && a.type !== "signature_needed");
  const clientFeedActions = feedActions.filter(a => a.clientId === client.id && !a.isResolved);
  const clientCompliance = complianceAlerts.filter(a => a.clientId === client.id);
  const clientAnomalies = anomalyAlerts.filter(a => a.clientId === client.id);
  const clientDeductions = deductionSuggestions.filter(a => a.clientId === client.id);
  const clientExtensions = extensionPredictions.filter(a => a.clientId === client.id);
  const clientExtractions = documentExtractions.filter(a => a.clientId === client.id);
  const clientEstimates = estimatedTaxCalcs.filter(a => a.clientId === client.id);
  const clientIrsNotices = irsNotices.filter(a => a.clientId === client.id);
  const hasIntel = clientCompliance.length + clientAnomalies.length + clientDeductions.length + clientExtensions.length + clientExtractions.length + clientEstimates.length + clientIrsNotices.length > 0;

  // Filter out signature feed actions when dedicated ERO card handles it
  const filteredFeedActions = currentStage === "pay_and_sign"
    ? clientFeedActions.filter(a => a.category !== "signature")
    : clientFeedActions;
  const filteredActions = clientActions.filter(a => a.type !== "signature_needed");

  return (
    <div className="space-y-6">
      {/* Prep Workspace button — portaled into layout header */}
      <PrepWorkspacePortal visible={currentStage === "in_preparation"} onOpen={() => setPrepWorkspaceOpen(true)} />

      {/* AI Insight */}
      {clientInsight && (
        <DocketInsightCard
          insight={clientInsight}
          defaultExpanded={true}
          onAction={handleInsightAction}
          onSendMessage={(messageId, channel) => {
            showToast("success", `Message sent via ${channel}`, `Draft ${messageId} delivered`);
          }}
          onEditMessage={(messageId) => {
            showToast("info", "Editing draft", `Opening editor for ${messageId}`);
          }}
        />
      )}

      {/* Upcoming call notification */}
      <UpcomingCallBanner clientId={client.id} clientName={client.fullName} />

      {/* Flags */}
      <OpenItemsSection clientId={client.id} additionalItems={flaggedItems as any} />

      {/* Ready to Prep / Transition — animated */}
      <AnimatePresence mode="wait">
        {currentStage === "ready_to_prep" && !transitioning && !stageOverride && (
          <motion.div
            key="ready-card"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="rounded-xl border border-primary/20 bg-primary/[0.03] p-4"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-8 items-center justify-center rounded-lg bg-primary/10">
                <CheckCircle className="size-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">Ready to begin preparation</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  All {client.documentsRequired} documents received. Confirm to move {client.fullName.split(" ")[0]} into preparation.
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex items-center gap-1 text-[10px] text-emerald-600"><Check className="size-3" /> {client.documentsSubmitted}/{client.documentsRequired} docs received</div>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-600"><Check className="size-3" /> Deposit paid</div>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-600"><Check className="size-3" /> Engagement signed</div>
                </div>
              </div>
            </div>
            <Button
              className="mt-3 w-full"
              onClick={() => {
                setTransitioning(true);
                setTimeout(() => {
                  setStageOverride("in_preparation");
                  setTransitioning(false);
                  showToast("success", "Preparation started", `${client.fullName.split(" ")[0]} has been moved to In Preparation.`);
                }, 1500);
              }}
            >
              <FileText className="size-3.5" /> Begin Preparation
            </Button>
          </motion.div>
        )}

        {transitioning && (
          <motion.div
            key="transitioning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-2.5 rounded-xl border bg-muted/30 px-4 py-3"
          >
            <motion.div
              className="size-4 rounded-full border-2 border-primary border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            />
            <span className="text-sm text-muted-foreground">Moving to preparation...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collecting Docs — show progress toward ready */}
      {currentStage === "collecting_docs" && client.documentsSubmitted < client.documentsRequired && (
        <div className="rounded-xl border p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-8 items-center justify-center rounded-lg bg-muted">
              <Clock className="size-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">Waiting on documents</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {client.documentsRequired - client.documentsSubmitted} documents still needed from {client.fullName.split(" ")[0]}.
              </div>
              <div className="mt-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-muted-foreground">{client.documentsSubmitted} of {client.documentsRequired} received</span>
                  <span className="text-[10px] font-medium tabular-nums">{docPercent}%</span>
                </div>
                <Progress value={docPercent} className="h-1.5" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Preparation for in_preparation clients */}
      {(currentStage === "in_preparation") && !transitioning && (
        <div className="rounded-xl border p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-8 items-center justify-center rounded-lg bg-blue-50">
              <FileText className="size-4 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">In preparation</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Resolve all flags, then complete preparation to send {client.fullName.split(" ")[0]} their return for review.
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {clientInsight && (clientInsight.severity === "high" || clientInsight.severity === "critical") ? (
                  <div className="flex items-center gap-1 text-[10px] text-amber-600"><AlertTriangle className="size-3" /> Open flags need resolution</div>
                ) : (
                  <div className="flex items-center gap-1 text-[10px] text-emerald-600"><Check className="size-3" /> All flags resolved</div>
                )}
              </div>
            </div>
          </div>
          <Button
            className="mt-3 w-full"
            onClick={() => setCompletePrepOpen(true)}
          >
            <CheckCircle className="size-3.5" /> Complete Preparation
          </Button>
        </div>
      )}

      {/* Complete Preparation Dialog */}
      <Dialog open={completePrepOpen} onOpenChange={setCompletePrepOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold">Complete preparation</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {client.fullName}'s return will be sent for client review.
              </p>
            </div>

            {/* Flags status */}
            <div className="rounded-lg border p-3 space-y-2">
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Flags</div>
              {clientInsight && (clientInsight.severity === "high" || clientInsight.severity === "critical") ? (
                <div className="flex items-center gap-2 text-xs text-amber-600">
                  <AlertTriangle className="size-3.5" />
                  <span>There are unresolved flags. You can still proceed.</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-emerald-600">
                  <Check className="size-3.5" />
                  <span>All flags resolved</span>
                </div>
              )}
            </div>

            {/* Return summary */}
            <div>
              <label className="text-xs font-medium">Return summary <span className="text-muted-foreground font-normal">(optional)</span></label>
              <textarea
                value={returnSummary}
                onChange={e => setReturnSummary(e.target.value)}
                placeholder="e.g. $2,180 refund, same as last year. Schedule C net income $76K."
                className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2 text-sm leading-relaxed resize-none outline-none focus:ring-1 focus:ring-ring"
                rows={2}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setCompletePrepOpen(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setCompletePrepOpen(false);
                  setTransitioning(true);
                  setTimeout(() => {
                    setStageOverride("client_review");
                    setTransitioning(false);
                    showToast("success", "Sent for review", `${client.fullName.split(" ")[0]}'s return has been sent for client review.`);
                  }, 1500);
                }}
              >
                <Send className="size-3.5" /> Send for Review
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ERO Signature for pay_and_sign clients */}
      {currentStage === "pay_and_sign" && (
        <div className="rounded-xl border p-4">
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 size-4 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">8879 ready for ERO signature</div>
              <div className="text-xs text-muted-foreground mt-0.5">Client has paid and signed. Your countersignature is needed to file.</div>
              <div className="mt-2 flex gap-1.5">
                <div className="flex items-center gap-1 text-[10px] text-emerald-600"><Check className="size-3" /> Paid</div>
                <div className="flex items-center gap-1 text-[10px] text-emerald-600"><Check className="size-3" /> Client signed</div>
                <div className="flex items-center gap-1 text-[10px] text-amber-600"><Clock className="size-3" /> ERO pending</div>
              </div>
            </div>
          </div>
          <Button className="mt-3 w-full" onClick={() => setEroOpen(true)}>
            <Shield className="size-3.5" /> Sign as ERO & file
          </Button>
        </div>
      )}

      {/* Docket Insight */}
      {hasIntel && (
        <div className="space-y-3">
          {/* Compliance */}
          {clientCompliance.map(a => (
            <ComplianceCard key={a.id} alert={a} onAskDocket={(q) => askDocket(q)} clientName={client.fullName} />
          ))}
          {/* Anomalies */}
          {clientAnomalies.map(a => (
            <AnomalyCard key={a.id} alert={a} onAskDocket={(q) => askDocket(q)} clientName={client.fullName} onFlag={(title, desc) => setFlaggedItems(prev => [...prev, { id: `flag-${Date.now()}`, clientId: client.id, title, description: desc, source: "ai_anomaly", priority: "high", createdAt: new Date().toISOString(), status: "open" }])} />
          ))}
          {/* Deductions */}
          {clientDeductions.map(a => (
            <DeductionCard key={a.id} suggestion={a} onAskDocket={(q) => askDocket(q)} clientName={client.fullName} />
          ))}
          {/* Extensions */}
          {currentStage === "extended" ? (
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-orange-500" />
                  <span className="text-sm font-semibold">Extended to October 15, 2026</span>
                </div>
                <Badge className="bg-orange-100 text-orange-700">Extended</Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Form 4868 filed. {client.fullName.split(" ")[0]} has until October 15 to complete filing.
                {(() => {
                  const daysLeft = Math.floor((new Date("2026-10-15").getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  return daysLeft > 0 ? ` ${daysLeft} days remaining.` : " Deadline passed.";
                })()}
              </p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" className="text-xs h-7">Resume document collection</Button>
                <Button size="sm" variant="ghost" className="text-xs h-7 text-muted-foreground" onClick={() => askDocket(`What's the status of ${client.fullName}'s extension?`)}>Ask Docket</Button>
              </div>
            </div>
          ) : clientExtensions.map(a => (
            <div key={a.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-amber-500" />
                  <span className="text-sm font-semibold">Extension likelihood</span>
                </div>
                <span className="font-display text-2xl tabular-nums tracking-tight">{a.probability}%</span>
              </div>
              <Progress value={a.probability} className="mt-3 h-2" indicatorColor={a.probability >= 80 ? "bg-red-500" : "bg-amber-500"} />
              <div className="mt-3 space-y-1">
                {a.factors.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="mt-0.5 size-1 shrink-0 rounded-full bg-muted-foreground" /> {f}
                  </div>
                ))}
              </div>
              {a.probability >= 70 && (
                <Button className="mt-3 w-full" onClick={() => setExtensionDialogOpen(true)}>
                  <FileText className="size-3.5" /> File Extension (Form 4868)
                </Button>
              )}
            </div>
          ))}
          {/* Estimated Tax */}
          {clientEstimates.map(calc => (
            <div key={calc.id} className="rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Calculator className="size-4 text-primary" /><span className="text-sm font-semibold">2026 quarterly estimates</span></div>
                <span className="font-display text-xl tabular-nums tracking-tight">${calc.totalEstimated.toLocaleString()}</span>
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
              <Button size="sm" className="mt-3" onClick={() => setSentBilling("calc")} disabled={sentBilling === "calc"}>
                <Calculator className="size-3.5" /> {sentBilling === "calc" ? "Sent!" : "Send to client"}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Two-column layout for details */}
      <div className="grid items-start gap-5 lg:grid-cols-[1fr_300px]">
        {/* Left column — billing + intel overflow */}
        <div className="space-y-5">
          {/* Billing — uses shared BillingCard */}
          <BillingCard client={client} />

          {/* Intake snapshot — compact */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Intake Summary</CardTitle>
              <Link href={`/dashboard/clients/${client.id}/intake`}>
                <Button variant="ghost" size="sm" className="text-xs gap-1">View full intake <ChevronRight className="size-3" /></Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 md:grid-cols-4">
                <div><div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Filing</div><div className="text-sm font-medium mt-0.5">{client.filingStatus === "mfj" ? "Married Filing Jointly" : client.filingStatus === "single" ? "Single" : client.filingStatus === "hoh" ? "Head of Household" : client.filingStatus}</div></div>
                <div><div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Service</div><div className="text-sm font-medium mt-0.5">{client.serviceTier}</div></div>
                <div><div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Documents</div><div className="text-sm font-medium mt-0.5">{client.documentsSubmitted} / {client.documentsRequired}</div></div>
                <div><div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Deposit</div><div className="text-sm font-medium mt-0.5">{client.depositPaid ? <span className="text-emerald-600">Paid</span> : <span className="text-amber-600">Pending</span>}</div></div>
              </div>
              {client.notes && (
                <div className="mt-3 rounded-lg bg-muted/50 px-3 py-2">
                  <div className="text-xs text-muted-foreground">{client.notes}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Client Review enhancement */}
          {client.returnStage === "client_review" && client.returnSentDate && (() => {
            const daysSinceSent = Math.floor((Date.now() - new Date(client.returnSentDate).getTime()) / (1000 * 60 * 60 * 24));
            const lastLogin = client.lastPortalLogin ? Math.floor((Date.now() - new Date(client.lastPortalLogin).getTime()) / (1000 * 60 * 60 * 24)) : null;
            return (
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>Sent {daysSinceSent}d ago</span>
                <span className="text-muted-foreground/30">·</span>
                <span>Portal {lastLogin !== null ? (lastLogin === 0 ? "today" : `${lastLogin}d ago`) : "never"}</span>
                {daysSinceSent > 5 && (
                  <>
                    <span className="text-muted-foreground/30">·</span>
                    <span className="text-amber-600">{daysSinceSent}d without response</span>
                  </>
                )}
              </div>
            );
          })()}
        </div>

        {/* Right column — timeline + contact + notes */}
        <div className="space-y-5">
          {/* Return Timeline */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Return Progress</CardTitle></CardHeader>
            <CardContent>
              <TrackingTimeline items={timelineItems} />
            </CardContent>
          </Card>

          {/* Contact — compact */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Contact</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Mail className="size-3.5" /> {client.email}</div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="size-3.5" /> {client.phone}</div>
            </CardContent>
          </Card>

          {/* Filing Details — compact */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Filing Details</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div>Filing Status: <span className="font-medium text-foreground">{client.filingStatus.toUpperCase()}</span></div>
              <div>Last Portal Login: <span className="font-medium text-foreground">{client.lastPortalLogin ? new Date(client.lastPortalLogin).toLocaleDateString() : "Never"}</span></div>
            </CardContent>
          </Card>

          {/* Context Notes — compact */}
          {client.notes && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Notes</CardTitle></CardHeader>
              <CardContent>
                <p className="text-xs leading-relaxed text-muted-foreground">{client.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Contextual Actions */}
      <ContextualActions stage={client.returnStage} clientId={client.id} onEroSign={() => setEroOpen(true)} onDownload={() => showToast("success", "Tax return downloaded", `${client.fullName} — 2025 Federal Return`)} />

      {/* Dialogs */}
      <ActionExecutionSheet action={selectedAction} open={sheetOpen} onOpenChange={setSheetOpen} />
      <ExtractionDialog extraction={selectedExtraction} open={!!selectedExtraction} onOpenChange={(open) => !open && setSelectedExtraction(null)} />
      <EroSignatureDialog client={client} open={eroOpen} onOpenChange={setEroOpen} />
      <PrepWorkspaceModal
        client={client}
        open={prepWorkspaceOpen}
        onOpenChange={setPrepWorkspaceOpen}
        onCompletePrep={() => {
          setPrepWorkspaceOpen(false);
          setCompletePrepOpen(true);
        }}
      />

      {/* File Extension Dialog */}
      <Dialog open={extensionDialogOpen} onOpenChange={setExtensionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold">File Extension</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Form 4868 will extend {client.fullName}'s deadline to October 15, 2026.
              </p>
            </div>

            <div className="rounded-lg border p-3 space-y-2">
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Extension details</div>
              <div className="flex items-center gap-2 text-xs">
                <Check className="size-3.5 text-emerald-600" />
                <span>Form 4868 — Automatic Extension of Time</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Clock className="size-3.5 text-orange-500" />
                <span>New deadline: October 15, 2026</span>
              </div>
              {clientExtensions.length > 0 && clientExtensions[0]!.factors.map((f, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <AlertTriangle className="size-3 text-amber-500 shrink-0 mt-0.5" />
                  <span>{f}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setExtensionDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-orange-600 hover:bg-orange-700"
                onClick={() => {
                  setExtensionDialogOpen(false);
                  setTransitioning(true);
                  setTimeout(() => {
                    setStageOverride("extended");
                    setTransitioning(false);
                    showToast("success", "Extension filed", `${client.fullName.split(" ")[0]}'s deadline extended to October 15, 2026.`);
                  }, 1500);
                }}
              >
                <FileText className="size-3.5" /> File Extension
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Intelligence Cards (matching popup dialog) ──

// TIER 1: CRITICAL
function ComplianceCard({ alert, onAskDocket, clientName }: { alert: typeof complianceAlerts[0]; onAskDocket: (q: string) => void; clientName: string }) {
  const [status, setStatus] = useState(alert.status);
  const [form8867Open, setForm8867Open] = useState(false);
  const { showToast } = useToast();
  if (status !== "pending") return null;
  const isForm8867 = alert.formRequired === "Form 8867";
  return (
    <>
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 size-2 shrink-0 rounded-full bg-red-500" />
          <div className="min-w-0 flex-1">
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
          {isForm8867 ? (
            <Button size="sm" className="h-7 text-xs" onClick={() => setForm8867Open(true)}>
              Begin Due Diligence
            </Button>
          ) : (
            <Button size="sm" className="h-7 text-xs" onClick={() => setStatus("acknowledged")}>
              <Check className="size-3 mr-1" /> Acknowledge
            </Button>
          )}
          <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={() => setStatus("dismissed")}>
            <X className="size-3 mr-1" /> Dismiss
          </Button>
        </div>
      </div>
      {isForm8867 && (
        <Form8867Dialog
          clientName={clientName}
          open={form8867Open}
          onOpenChange={setForm8867Open}
          onComplete={() => {
            setStatus("acknowledged");
            showToast("success", "Due diligence complete", `Form 8867 completed for ${clientName}`);
          }}
        />
      )}
    </>
  );
}

// TIER 2: ATTENTION
function AnomalyCard({ alert, onAskDocket, clientName, onFlag }: { alert: typeof anomalyAlerts[0]; onAskDocket: (q: string) => void; clientName: string; onFlag?: (title: string, desc: string) => void }) {
  const [status, setStatus] = useState(alert.status);
  const { showToast } = useToast();
  return (
    <AnimatePresence>
      {status === "pending" && (
        <motion.div
          initial={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="rounded-lg border bg-card p-4 overflow-hidden"
        >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 size-2 shrink-0 rounded-full bg-amber-500" />
        <div className="flex-1">
          <div className="text-sm font-semibold">{alert.metric}</div>
        </div>
      </div>
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
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setStatus("flagged"); onFlag?.(alert.metric, alert.aiExplanation); showToast("success", "Added to flags", `${alert.metric} has been flagged for review.`); }}>
          Flag for review
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setStatus("proceeded"); showToast("info", "Proceeded", "Marked as reviewed."); }}>Proceed</Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground ml-auto" onClick={() => onAskDocket(`Explain the ${alert.metric} anomaly for ${clientName}: ${alert.changePercent}% change`)}>
          Ask Docket
        </Button>
      </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// TIER 3: OPPORTUNITY
function DeductionCard({ suggestion, onAskDocket, clientName }: { suggestion: typeof deductionSuggestions[0]; onAskDocket: (q: string) => void; clientName: string }) {
  const [status, setStatus] = useState(suggestion.status);
  if (status !== "pending") return null;
  return (
    <div className="rounded-lg border bg-card p-4">
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
        <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground ml-auto" onClick={() => onAskDocket(`Tell me about ${suggestion.deductionType} for ${clientName}`)}>
          Ask Docket
        </Button>
      </div>
    </div>
  );
}

function ContextualActions({ stage, clientId, onEroSign, onDownload }: { stage: string; clientId: string; onEroSign: () => void; onDownload?: () => void }) {
  const [sent, setSent] = useState<string | null>(null);
  const { showToast } = useToast();
  const sendAction = (key: string, label: string) => {
    setSent(key);
    showToast("success", label);
    setTimeout(() => setSent(null), 2500);
  };

  const actions: { icon: React.ReactNode; label: string; key: string; sentLabel?: string; primary?: boolean; onClick: () => void }[] = [];

  const navToMessages = () => { window.location.href = `/dashboard/clients/${clientId}/messages`; };
  const navToCalendar = () => { window.location.href = "/dashboard/apps/calendar"; };

  switch (stage) {
    case "new_intake":
      actions.push({ icon: <Send className="size-3.5" />, label: "Send Intake", key: "intake", sentLabel: "Sent!", primary: true, onClick: () => sendAction("intake", "Intake sent") });
      actions.push({ icon: <Send className="size-3.5" />, label: "Remind", key: "remind", sentLabel: "Reminded", onClick: () => sendAction("remind", "Reminder sent") });
      actions.push({ icon: <MessageSquare className="size-3.5" />, label: "Message", key: "message", onClick: navToMessages });
      actions.push({ icon: <Calendar className="size-3.5" />, label: "Schedule", key: "schedule", onClick: navToCalendar });
      break;
    case "collecting_docs":
      actions.push({ icon: <FileText className="size-3.5" />, label: "Request Docs", key: "docs", sentLabel: "Requested", primary: true, onClick: () => sendAction("docs", "Document request sent") });
      actions.push({ icon: <Send className="size-3.5" />, label: "Remind", key: "remind", sentLabel: "Reminded", onClick: () => sendAction("remind", "Reminder sent") });
      actions.push({ icon: <MessageSquare className="size-3.5" />, label: "Message", key: "message", onClick: navToMessages });
      actions.push({ icon: <ExternalLink className="size-3.5" />, label: "Portal", key: "portal", onClick: () => window.open("/portal", "_blank") });
      break;
    case "ready_to_prep":
      actions.push({ icon: <FileText className="size-3.5" />, label: "Start Prep", key: "prep", sentLabel: "Started", primary: true, onClick: () => sendAction("prep", "Preparation started") });
      actions.push({ icon: <MessageSquare className="size-3.5" />, label: "Message", key: "message", onClick: navToMessages });
      actions.push({ icon: <Calendar className="size-3.5" />, label: "Schedule", key: "schedule", onClick: navToCalendar });
      break;
    case "in_preparation":
      actions.push({ icon: <MessageSquare className="size-3.5" />, label: "Message", key: "message", onClick: navToMessages });
      actions.push({ icon: <Calendar className="size-3.5" />, label: "Schedule", key: "schedule", onClick: navToCalendar });
      actions.push({ icon: <ExternalLink className="size-3.5" />, label: "Portal", key: "portal", onClick: () => window.open("/portal", "_blank") });
      break;
    case "client_review":
      actions.push({ icon: <Send className="size-3.5" />, label: "Nudge", key: "nudge", sentLabel: "Nudged", primary: true, onClick: () => sendAction("nudge", "Follow-up sent") });
      actions.push({ icon: <MessageSquare className="size-3.5" />, label: "Message", key: "message", onClick: navToMessages });
      actions.push({ icon: <ExternalLink className="size-3.5" />, label: "Portal", key: "portal", onClick: () => window.open("/portal", "_blank") });
      break;
    case "pay_and_sign":
      actions.push({ icon: <Shield className="size-3.5" />, label: "Sign as ERO", key: "ero", primary: true, onClick: onEroSign });
      actions.push({ icon: <DollarSign className="size-3.5" />, label: "Send Invoice", key: "invoice", sentLabel: "Sent!", onClick: () => sendAction("invoice", "Invoice sent") });
      actions.push({ icon: <MessageSquare className="size-3.5" />, label: "Message", key: "message", onClick: navToMessages });
      break;
    case "filed":
      actions.push({ icon: <MessageSquare className="size-3.5" />, label: "Message", key: "message", onClick: navToMessages });
      actions.push({ icon: <Calendar className="size-3.5" />, label: "Schedule", key: "schedule", onClick: navToCalendar });
      actions.push({ icon: <Download className="size-3.5" />, label: "Download Return", key: "download", onClick: () => { if (onDownload) onDownload(); } });
      break;
    case "extended":
      actions.push({ icon: <FileText className="size-3.5" />, label: "Request Docs", key: "docs", sentLabel: "Requested", primary: true, onClick: () => sendAction("docs", "Document request sent") });
      actions.push({ icon: <MessageSquare className="size-3.5" />, label: "Message", key: "message", onClick: navToMessages });
      actions.push({ icon: <Calendar className="size-3.5" />, label: "Schedule", key: "schedule", onClick: navToCalendar });
      break;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((a) => {
        const isSent = sent === a.key;
        if (isSent && a.sentLabel) {
          return (
            <div key={a.key} className="flex items-center gap-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 animate-in fade-in slide-in-from-bottom-1 duration-300 h-9">
              <Check className="size-3.5" /> {a.sentLabel}
            </div>
          );
        }
        return (
          <Button key={a.key} size="sm" variant={a.primary ? "default" : "outline"} className="h-9" onClick={a.onClick}>
            {a.icon} {a.label}
          </Button>
        );
      })}
    </div>
  );
}

// Portal the Prep Workspace button into the layout header
function PrepWorkspacePortal({ visible, onOpen }: { visible: boolean; onOpen: () => void }) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const wasVisibleOnMount = useState(() => visible)[0]; // capture initial value

  useEffect(() => {
    const el = document.getElementById("client-header-actions");
    if (el) setContainer(el);
  }, []);

  if (!container) return null;

  // If already visible on mount, render without animation
  // If it becomes visible after mount (Begin Prep clicked), animate in
  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={wasVisibleOnMount ? false : { opacity: 0, scale: 0.9, width: 0 }}
          animate={{ opacity: 1, scale: 1, width: "auto" }}
          exit={{ opacity: 0, scale: 0.9, width: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="overflow-hidden"
        >
          <Button
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 h-10 text-sm whitespace-nowrap"
            onClick={onOpen}
          >
            <ClipboardList className="size-4" />
            Prep Workspace
          </Button>
        </motion.div>
      )}
    </AnimatePresence>,
    container
  );
}


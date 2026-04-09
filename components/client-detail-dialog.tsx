"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { type Client, stageLabels, actionItems, getClientPaymentSummary, pendingIntakeContext, serviceTierOptions, type InsightAction } from "@/lib/mock-data";
import { getThread, getClientDrafts, type ChatMessage as ChatMessageType } from "@/lib/messages-data";
import { AIDraftCard } from "@/components/messaging/ai-draft-card";
import { MessageInput } from "@/components/messaging/message-input";
import { useAIPanelAsk } from "@/components/ai-panel";
import {
  complianceAlerts, anomalyAlerts, deductionSuggestions,
  extensionPredictions, documentExtractions, estimatedTaxCalcs,
  feedActions, irsNotices,
  type DocumentExtraction, type FeedAction,
} from "@/lib/actions-mock-data";
import { DocketInsightCard, TrackingBadgeGroup } from "@/components/insights";
import { getInsightForClient, getTrackingBadgesForClient } from "@/lib/insights-mock-data";
import { ExtractionDialog } from "@/components/documents/extraction-dialog";
import { getClientChecklist, getClientNotes, groupDocumentsByCategory, getSmartChecklist, getDocumentIntelligence, getClientDocuments, getIntelligenceForDocument } from "@/lib/documents-mock-data";
import { SmartChecklist } from "@/components/documents/smart-checklist";
import { DocumentIntelligenceCard } from "@/components/documents/document-intelligence-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Building2, Mail, Phone, FileText, DollarSign, Clock,
  Send, ExternalLink, Calendar, MessageSquare, Pen,
  CheckCircle, AlertTriangle, ArrowUpRight, ChevronRight, Download, Shield, Check,
  TrendingDown, Calculator, X, Brain, Loader2
} from "lucide-react";
import TrackingTimeline, { type TimelineItem } from "@/components/ui/tracking-timeline";
import { ActionDraftCard } from "@/components/action-draft-card";
import { useToast } from "@/components/ui/toast-notification";
import { ActionCard } from "@/components/actions/action-card";
import { ActionExecutionSheet } from "@/components/actions/action-execution-sheet";
import { EroSignatureDialog } from "@/components/ero-signature-dialog";
import { UploadZone } from "@/components/documents/upload-zone";
import { DocumentChecklist } from "@/components/documents/document-checklist";
import { DocumentGroup } from "@/components/documents/document-group";
import { DocumentViewerDialog } from "@/components/documents/document-viewer-dialog";
import { OpenItemsSection } from "@/components/issues/open-items-section";
import { UnifiedTimeline } from "@/components/messaging/unified-timeline";
import { ChannelSelector } from "@/components/messaging/channel-selector";
import { getUnifiedThread, type UnifiedMessage, type CommChannel } from "@/lib/comms-mock-data";
import { getClientActivity } from "@/lib/activity-mock-data";
import { ActivityFilterBar, type FilterOption } from "@/components/activity/activity-filter-bar";
import { AuditTrailTimeline } from "@/components/activity/audit-trail-timeline";
import type { MockDocument } from "@/lib/documents-mock-data";

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function formatCallTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (isToday) return `Today at ${timeStr}`;
  if (isYesterday) return `Yesterday at ${timeStr}`;
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) + " at " + timeStr;
}
function isCallPast(dateStr: string) { return new Date(dateStr) < new Date(); }

interface ClientDetailDialogProps {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept?: (id: string, tier: string) => void;
  onDecline?: (id: string) => void;
}

export function ClientDetailDialog({ client, open, onOpenChange, onAccept, onDecline }: ClientDetailDialogProps) {
  const [eroOpen, setEroOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<FeedAction | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedExtraction, setSelectedExtraction] = useState<DocumentExtraction | null>(null);
  const [stageOverride, setStageOverride] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const { showToast } = useToast();
  const [sentCalc, setSentCalc] = useState(false);
  const [sentBilling, setSentBilling] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [assignedTier, setAssignedTier] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [viewerDoc, setViewerDoc] = useState<MockDocument | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activityFilter, setActivityFilter] = useState<FilterOption>("all");
  let askDocket = (_q: string) => {};
  try { askDocket = useAIPanelAsk(); } catch {}

  if (!client) return null;

  const currentStage = stageOverride || client.returnStage;
  const clientInsight = getInsightForClient(client.id);
  const clientTrackingBadges = getTrackingBadgesForClient(client.id);

  const handleInsightAction = (action: InsightAction) => {
    showToast("success", `Action: ${action.label}`, `Executing ${action.action}...`);
  };
  const docPercent = Math.round((client.documentsSubmitted / client.documentsRequired) * 100);
  const stageIndex = ['new_intake', 'collecting_docs', 'ready_to_prep', 'in_preparation', 'client_review', 'pay_and_sign', 'filed'].indexOf(currentStage);

  const timelineItems: TimelineItem[] = [
    { id: 1, title: "New Intake", date: "Engagement letter + 7216 consent", status: stageIndex > 0 ? "completed" : stageIndex === 0 ? "in-progress" : "pending" },
    { id: 2, title: "Collecting Docs", date: `${client.documentsSubmitted} of ${client.documentsRequired} received`, status: stageIndex > 1 ? "completed" : stageIndex === 1 ? "in-progress" : "pending" },
    { id: 3, title: "Ready to Prep", date: "All docs received, queued for preparation", status: stageIndex > 2 ? "completed" : stageIndex === 2 ? "in-progress" : "pending" },
    { id: 4, title: "In Preparation", date: "Antonio is preparing the return", status: stageIndex > 3 ? "completed" : stageIndex === 3 ? "in-progress" : "pending" },
    { id: 5, title: "Client Review", date: "Client reviewing the prepared return", status: stageIndex > 4 ? "completed" : stageIndex === 4 ? "in-progress" : "pending" },
    { id: 6, title: "Pay & Sign", date: "Payment + 8879 client signature + ERO signature", status: stageIndex > 5 ? "completed" : stageIndex === 5 ? "in-progress" : "pending" },
    { id: 7, title: "Filed", date: "Return filed with IRS", status: stageIndex >= 6 ? "completed" : "pending" },
  ];

  const clientActions = actionItems.filter(a => a.clientId === client.id && !a.isResolved);
  const clientFeedActions = feedActions.filter(a => a.clientId === client.id && !a.isResolved);
  const clientCompliance = complianceAlerts.filter(a => a.clientId === client.id);
  const clientAnomalies = anomalyAlerts.filter(a => a.clientId === client.id);
  const clientDeductions = deductionSuggestions.filter(a => a.clientId === client.id);
  const clientExtensions = extensionPredictions.filter(a => a.clientId === client.id);
  const clientExtractions = documentExtractions.filter(a => a.clientId === client.id);
  const clientEstimatedTax = estimatedTaxCalcs.filter(a => a.clientId === client.id);
  const clientIrsNotices = irsNotices.filter(a => a.clientId === client.id);
  const hasIntel = clientCompliance.length + clientAnomalies.length + clientDeductions.length + clientExtensions.length + clientExtractions.length + clientEstimatedTax.length + clientIrsNotices.length > 0;

  const checklist = getClientChecklist(client.id);
  const docGroups = groupDocumentsByCategory(client.id);
  const notes = getClientNotes(client.id);
  const smartCategories = getSmartChecklist(client.id);
  const clientDocs = getClientDocuments(client.id);
  const clientIntelligence = getDocumentIntelligence(client.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[90vh] max-h-[90vh] overflow-hidden sm:max-w-3xl p-0 flex flex-col">
        {/* Header */}
        <div className="flex items-start gap-4 border-b px-6 py-4">
          <Avatar className="size-14">
            <AvatarImage src={client.avatar} alt={client.fullName} />
            <AvatarFallback className="text-lg">{getInitials(client.fullName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-lg">{client.fullName}</DialogTitle>
              {client.type === "business" && <Building2 className="size-4 text-muted-foreground" />}
            </div>
            {client.businessName && <p className="text-sm text-muted-foreground">{client.businessName}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge>{stageLabels[client.returnStage]}</Badge>
              <Badge variant="outline">{client.serviceTier}</Badge>
              <Badge variant="outline">${client.feeAmount}</Badge>
              {client.urgency === "urgent" && <Badge variant="destructive">Urgent</Badge>}
              {client.urgency === "high" && <Badge variant="secondary">High Priority</Badge>}
              <Button size="sm" variant="ghost" className="ml-auto h-7 text-xs" asChild>
                <Link href={`/dashboard/clients/${client.id}/overview`}>
                  Open full page <ArrowUpRight className="ml-1 size-3" />
                </Link>
              </Button>
            </div>
            {/* Tracking badges */}
            {clientTrackingBadges.length > 0 && (
              <div className="mt-2">
                <TrackingBadgeGroup badges={clientTrackingBadges} maxVisible={4} />
              </div>
            )}
          </div>
        </div>

        {/* Pending intake banner */}
        {client.clientStatus === "pending" && onAccept && onDecline && (
          <div className="border-b bg-rose-50/50 dark:bg-rose-950/10 px-6 py-4 space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300">Pending Review</Badge>
            </div>

            {/* Intake details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Check className="size-3 text-emerald-500" />
                  <span>Intake completed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="size-3 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">$50 deposit paid</span>
                </div>
                {(() => {
                  const ctx = pendingIntakeContext[client.id];
                  return ctx ? (
                    <>
                      <div className="flex items-center gap-1.5">
                        <FileText className="size-3 text-muted-foreground" />
                        <span>Requested: <strong>{ctx.service}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FileText className="size-3 text-muted-foreground/50" />
                        <span className="text-muted-foreground">{ctx.filing} / {ctx.income.join(", ")}</span>
                      </div>
                    </>
                  ) : null;
                })()}
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Calendar className={`size-3 ${client.scheduledCall && isCallPast(client.scheduledCall) ? "text-red-500" : "text-blue-500"}`} />
                  <span className={client.scheduledCall && isCallPast(client.scheduledCall) ? "text-red-600 dark:text-red-400 font-medium" : ""}>
                    {client.scheduledCall ? formatCallTime(client.scheduledCall) : "No call scheduled"}
                    {client.scheduledCall && isCallPast(client.scheduledCall) && " · Missed"}
                  </span>
                </div>
                {client.notes && (
                  <p className="text-muted-foreground leading-relaxed mt-1">{client.notes}</p>
                )}
              </div>
            </div>

            {/* Tier assignment + actions */}
            <div className="flex items-center gap-2 pt-1">
              <select
                value={assignedTier}
                onChange={(e) => setAssignedTier(e.target.value)}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground outline-none transition-colors focus:border-primary"
              >
                {serviceTierOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <Button
                size="sm"
                className="h-8"
                disabled={!assignedTier}
                onClick={() => {
                  onAccept(client.id, assignedTier);
                  onOpenChange(false);
                }}
              >
                <Check className="mr-1 size-3.5" /> Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8"
                onClick={() => {
                  onDecline(client.id);
                  onOpenChange(false);
                }}
              >
                <X className="mr-1 size-3.5" /> Decline
              </Button>
            </div>
          </div>
        )}

        {/* Tabbed content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="px-6 pt-2 pb-6">
            <TabsList variant="fill" className="mb-4 w-full">
              {["overview", "intake", "documents", "messages", "activity", "billing", "notes"].map(tab => (
                <TabsTrigger key={tab} value={tab} className="relative">
                  {activeTab === tab && (
                    <motion.span
                      layoutId="active-dialog-tab"
                      className="absolute inset-0 rounded-t-md bg-muted"
                      transition={{ type: "spring", stiffness: 250, damping: 28, mass: 0.9 }}
                    />
                  )}
                  <span className="relative z-10 capitalize">{tab}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="space-y-5">
              {/* Docket Insight - AI Commentary */}
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

              {/* Open Items */}
              <OpenItemsSection clientId={client.id} />

              {/* Ready to Prep / Transition — animated (synced with full page) */}
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
                          <div className="flex items-center gap-1 text-[10px] text-emerald-600"><Check className="size-3" /> {client.documentsSubmitted}/{client.documentsRequired} docs</div>
                          <div className="flex items-center gap-1 text-[10px] text-emerald-600"><Check className="size-3" /> Deposit paid</div>
                          <div className="flex items-center gap-1 text-[10px] text-emerald-600"><Check className="size-3" /> Engagement signed</div>
                        </div>
                      </div>
                    </div>
                    <Button
                      className="mt-3 w-full"
                      onClick={() => {
                        setTransitioning(true);
                        setTimeout(() => { setStageOverride("in_preparation"); setTransitioning(false); showToast("success", "Preparation started", `${client.fullName.split(" ")[0]} has been moved to In Preparation.`); }, 1500);
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

              {/* Collecting Docs — show progress */}
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
                  <div className="flex items-center gap-2">
                    <Brain className="size-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Docket Insight</span>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-medium text-muted-foreground">Preview</Badge>
                  </div>

                  {/* Document Extractions — OCR to OLT */}
                  {clientExtractions.length > 0 && (
                    <div className="rounded-xl border bg-card p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                          <FileText className="size-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold">Extracted Documents</div>
                          <div className="text-[11px] text-muted-foreground">Review fields, then push to OLT</div>
                        </div>
                      </div>
                      {clientExtractions.map(de => (
                        <button key={de.id} onClick={() => setSelectedExtraction(de)} className="flex w-full items-center gap-4 rounded-xl border bg-card p-3.5 text-left transition-all hover:shadow-md hover:border-primary/30">
                          <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                            <FileText className="size-5 text-muted-foreground" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold">{de.documentType}</span>
                              <Badge variant={de.overallConfidence >= 90 ? "default" : "secondary"} className="text-[10px]">{de.overallConfidence}%</Badge>
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {de.fields.length} fields extracted · {de.fields.filter(f => f.needsReview).length} need review
                            </div>
                          </div>
                          <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Compliance Alerts */}
                  {clientCompliance.map(a => (
                    <InlineComplianceCard key={a.id} alert={a} onAskDocket={(q) => { onOpenChange(false); setTimeout(() => askDocket(q), 300); }} clientName={client.fullName} />
                  ))}

                  {/* YoY Anomalies */}
                  {clientAnomalies.map(a => (
                    <InlineAnomalyCard key={a.id} alert={a} onAskDocket={(q) => { onOpenChange(false); setTimeout(() => askDocket(q), 300); }} clientName={client.fullName} />
                  ))}

                  {/* Deduction Suggestions */}
                  {clientDeductions.map(a => (
                    <InlineDeductionCard key={a.id} suggestion={a} onAskDocket={(q) => { onOpenChange(false); setTimeout(() => askDocket(q), 300); }} clientName={client.fullName} />
                  ))}

                  {/* Extension Predictions */}
                  {clientExtensions.map(a => (
                    <div key={a.id} className="rounded-xl border p-4">
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
                            <span className="mt-0.5 size-1 shrink-0 rounded-full bg-muted-foreground" />
                            {f}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Estimated Tax Calculations */}
                  {clientEstimatedTax.map(calc => (
                    <div key={calc.id} className="rounded-xl border p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calculator className="size-4 text-primary" />
                          <span className="text-sm font-semibold">2026 quarterly estimates</span>
                        </div>
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
                      <Button size="sm" className="mt-3" onClick={() => setSentCalc(true)} disabled={sentCalc}>
                        <Calculator className="size-3.5" /> {sentCalc ? "Sent!" : "Send to client"}
                      </Button>
                    </div>
                  ))}

                  {/* IRS Notices */}
                  {clientIrsNotices.map(n => (
                    <InlineIrsNoticeCard key={n.id} notice={n} />
                  ))}

                </div>
              )}

              {/* Quick stats */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span><strong className="text-foreground">{client.documentsSubmitted}/{client.documentsRequired}</strong> docs</span>
                <span><strong className="text-foreground">${client.feeAmount}</strong> fee</span>
                <span>Deposit: <strong className={client.depositPaid ? "text-emerald-600" : "text-red-500"}>{client.depositPaid ? "Paid" : "Unpaid"}</strong></span>
                <Progress value={docPercent} className="h-1.5 flex-1" indicatorColor={docPercent >= 100 ? "bg-emerald-500" : undefined} />
              </div>

              {/* Return Progress timeline */}
              <div className="rounded-xl border p-4">
                <span className="text-sm font-semibold">Return Progress</span>
                <div className="mt-3">
                  <TrackingTimeline items={timelineItems} />
                </div>
              </div>

              {/* Client Review stage enhancement */}
              {client.returnStage === "client_review" && client.returnSentDate && (() => {
                const daysSinceSent = Math.floor((Date.now() - new Date(client.returnSentDate).getTime()) / (1000 * 60 * 60 * 24));
                const lastLogin = client.lastPortalLogin ? Math.floor((Date.now() - new Date(client.lastPortalLogin).getTime()) / (1000 * 60 * 60 * 24)) : null;
                return (
                  <div className={`rounded-xl border p-3 ${daysSinceSent > 3 ? "border-amber-200 bg-amber-50/30 dark:border-amber-900 dark:bg-amber-950/10" : ""}`}>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="size-4 text-muted-foreground" />
                      <span>Return sent <strong>{daysSinceSent} days ago</strong></span>
                      <span className="text-muted-foreground">·</span>
                      <span>Portal {lastLogin !== null ? (lastLogin === 0 ? "accessed today" : `accessed ${lastLogin}d ago`) : "never accessed"}</span>
                    </div>
                    {daysSinceSent > 3 && (
                      <p className="mt-1.5 text-xs text-amber-600">Review may be stale — consider sending a follow-up</p>
                    )}
                  </div>
                );
              })()}

              {/* Contact */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground">Contact</div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Mail className="size-4" /> {client.email}</div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="size-4" /> {client.phone}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground">Filing</div>
                  <div className="text-sm text-muted-foreground">Status: <span className="text-foreground font-medium">{client.filingStatus.toUpperCase()}</span></div>
                  <div className="text-sm text-muted-foreground">Last login: <span className="text-foreground font-medium">{client.lastPortalLogin ? new Date(client.lastPortalLogin).toLocaleDateString() : "Never"}</span></div>
                </div>
              </div>

              {/* Notes - editable */}
              <EditableNotes initialNotes={client.notes} />

              {/* Contextual Actions — based on stage */}
              <ContextualActions stage={client.returnStage} onEroSign={() => setEroOpen(true)} />
            </TabsContent>

            {/* INTAKE TAB */}
            <TabsContent value="intake" className="space-y-4">
              {(() => {
                const intakeMap: Record<string, { submitted: string; service: string; filing: string; spouse?: string; dependents: string[]; income: string[]; selfEmployment?: { business: string; revenue: string }; deductions: string[]; lifeEvents: string[]; priorYear: string; states: string[]; slot: string }> = {
                  c1: { submitted: "Mar 20, 2026", service: "Complex Return", filing: "Married Filing Jointly", spouse: "Sofia Rodriguez", dependents: ["Isabella Rodriguez (7)", "Lucas Rodriguez (5)"], income: ["W-2 Employee", "Investments / Crypto"], deductions: ["Mortgage interest", "Childcare expenses", "Charitable donations"], lifeEvents: [], priorYear: "Filed with Antonio last year", states: ["California"], slot: "Mon, Mar 24 · 9:00 AM" },
                  c2: { submitted: "Mar 22, 2026", service: "Complex Return", filing: "Single", dependents: [], income: ["Self-Employed / 1099", "Investments / Crypto"], selfEmployment: { business: "Priya Creates LLC", revenue: "$85,000" }, deductions: ["Home office", "Business expenses"], lifeEvents: ["Started a business"], priorYear: "First time filing", states: ["California"], slot: "Sat, Mar 29 · 1:00 PM" },
                  c14: { submitted: "Mar 18, 2026", service: "Standard Return", filing: "Single", dependents: [], income: ["W-2 Employee", "Self-Employed / 1099"], selfEmployment: { business: "Aisha's Scrubs (Etsy)", revenue: "$12,400" }, deductions: ["Student loan interest", "Business expenses"], lifeEvents: [], priorYear: "Filed with H&R Block", states: ["California"], slot: "Tue, Mar 19 · 10:00 AM" },
                  c3: { submitted: "Mar 15, 2026", service: "Standard Return", filing: "Single", dependents: ["Jaylen Mitchell (11)"], income: ["Self-Employed / 1099"], selfEmployment: { business: "Self (Uber/Lyft)", revenue: "$52,000" }, deductions: ["Vehicle expenses"], lifeEvents: ["Divorced"], priorYear: "Filed with Antonio (extended)", states: ["California"], slot: "Thu, Mar 20 · 2:00 PM" },
                };
                const data = intakeMap[client.id];
                if (!data) return (
                  <div className="py-10 text-center">
                    <FileText className="mx-auto mb-3 size-10 text-muted-foreground/30" />
                    <div className="text-sm font-medium">No intake submitted</div>
                    <div className="text-xs text-muted-foreground mt-1">{client.fullName} hasn&apos;t completed the questionnaire yet.</div>
                  </div>
                );
                return (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="size-2 rounded-full bg-emerald-500" />
                        <span className="text-xs font-medium text-emerald-700">Completed {data.submitted}</span>
                      </div>
                      <Link href={`/dashboard/clients/${client.id}/intake`}>
                        <Button variant="ghost" size="sm" className="text-xs h-7">Full details →</Button>
                      </Link>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Service", value: data.service },
                        { label: "Filing", value: data.filing },
                        { label: "State", value: data.states.join(", ") },
                        { label: "Prior Year", value: data.priorYear },
                        { label: "Appointment", value: data.slot },
                        { label: "Deposit", value: client.depositPaid ? "Paid" : "Pending" },
                      ].map(r => (
                        <div key={r.label} className="rounded-lg border px-3 py-2">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{r.label}</div>
                          <div className="text-sm font-medium mt-0.5">{r.value}</div>
                        </div>
                      ))}
                    </div>
                    {data.spouse && (
                      <div className="rounded-lg border px-3 py-2">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Spouse</div>
                        <div className="text-sm font-medium mt-0.5">{data.spouse}</div>
                      </div>
                    )}
                    {data.dependents.length > 0 && (
                      <div className="rounded-lg border px-3 py-2">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Dependents</div>
                        {data.dependents.map(d => <div key={d} className="text-sm mt-0.5">{d}</div>)}
                      </div>
                    )}
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Income Sources</div>
                      <div className="flex flex-wrap gap-1.5">
                        {data.income.map(i => <Badge key={i} variant="secondary" className="text-xs">{i}</Badge>)}
                      </div>
                      {data.selfEmployment && (
                        <div className="mt-2 rounded-lg bg-muted/50 px-3 py-2 text-xs">
                          <span className="font-medium">{data.selfEmployment.business}</span> · {data.selfEmployment.revenue}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Deductions</div>
                      <div className="flex flex-wrap gap-1.5">
                        {data.deductions.map(d => <Badge key={d} variant="outline" className="text-xs">{d}</Badge>)}
                      </div>
                    </div>
                    {data.lifeEvents.length > 0 && (
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Life Events (2025)</div>
                        <div className="flex flex-wrap gap-1.5">
                          {data.lifeEvents.map(e => <Badge key={e} variant="secondary" className="text-xs">{e}</Badge>)}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </TabsContent>

            {/* DOCUMENTS TAB */}
            <TabsContent value="documents" className="space-y-4">
              <UploadZone clientName={client.fullName.split(" ")[0]} />

              {/* Status summary */}
              {(() => {
                const isFiled = client.returnStage === "filed";
                const allReceived = client.documentsSubmitted >= client.documentsRequired || isFiled;
                const totalDocs = docGroups.reduce((sum, g) => sum + g.docs.length, 0);
                const missingCount = checklist.filter(c => c.required && !c.received).length;
                return (
                  <div className="rounded-xl border p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex size-8 items-center justify-center rounded-lg ${allReceived ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-muted"}`}>
                          {allReceived ? <CheckCircle className="size-4 text-emerald-600" /> : <FileText className="size-4 text-muted-foreground" />}
                        </div>
                        <div>
                          <span className="text-sm font-semibold">
                            {allReceived ? "All documents received" : `${client.documentsSubmitted} of ${client.documentsRequired} received`}
                          </span>
                          {!allReceived && missingCount > 0 && (
                            <Badge variant="outline" className="ml-2 border-amber-200 text-amber-700 text-[10px]">{missingCount} missing</Badge>
                          )}
                          {!allReceived && (
                            <div className="mt-1 flex items-center gap-2">
                              <Progress value={docPercent} className="h-1.5 w-24" />
                              <span className="text-[10px] tabular-nums text-muted-foreground">{docPercent}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Document groups — click opens viewer dialog */}
              {docGroups.length > 0 ? (
                <div className="space-y-4">
                  {docGroups.map(g => (
                    <DocumentGroup
                      key={g.category}
                      label={g.label}
                      docs={g.docs}
                      missing={g.missing}
                      onOpenDocument={(doc) => { setViewerDoc(doc); setViewerOpen(true); }}
                    />
                  ))}
                </div>
              ) : client.documentsSubmitted === 0 && client.returnStage !== "filed" ? (
                <div className="py-4 text-center text-sm text-muted-foreground">No documents uploaded yet.</div>
              ) : client.documentsSubmitted > 0 ? (
                <GeneratedDocList client={client} />
              ) : null}

              {client.returnStage === "filed" && (
                <div className="rounded-xl border bg-emerald-50/50 p-3 dark:bg-emerald-950/10">
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700"><CheckCircle className="size-4" /> Return filed and accepted</div>
                  <p className="mt-1 text-xs text-muted-foreground">All documents retained for audit support.</p>
                </div>
              )}
            </TabsContent>

            {/* MESSAGES TAB — unified comms */}
            <TabsContent value="messages">
              <DialogMessagesTab client={client} />
            </TabsContent>

            {/* ACTIVITY TAB */}
            <TabsContent value="activity">
              <DialogActivityTab client={client} activityFilter={activityFilter} setActivityFilter={setActivityFilter} />
            </TabsContent>

            {/* BILLING TAB */}
            <TabsContent value="billing" className="space-y-4">
              <BillingTab client={client} sentBilling={sentBilling} setSentBilling={setSentBilling} />
            </TabsContent>

            {/* NOTES TAB */}
            <TabsContent value="notes" className="space-y-3">
              <ClientNotesTab clientId={client.id} initialNotes={notes} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>

      <EroSignatureDialog client={client} open={eroOpen} onOpenChange={setEroOpen} />
      <ExtractionDialog extraction={selectedExtraction} open={!!selectedExtraction} onOpenChange={(o) => !o && setSelectedExtraction(null)} />
      {selectedAction && <ActionExecutionSheet action={selectedAction} open={sheetOpen} onOpenChange={(o) => { setSheetOpen(o); if (!o) setSelectedAction(null); }} />}
      <DocumentViewerDialog
        document={viewerDoc}
        clientId={client.id}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
      />
    </Dialog>
  );
}

// Notes tab with add + edit
function ClientNotesTab({ clientId, initialNotes }: { clientId: string; initialNotes: { id: string; content: string; createdAt: string; updatedAt: string }[] }) {
  const [notes, setNotes] = useState(initialNotes);
  const [newNote, setNewNote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const addNote = () => {
    if (!newNote.trim()) return;
    const now = new Date().toISOString();
    setNotes(prev => [{
      id: `n-${Date.now()}`,
      content: newNote.trim(),
      createdAt: now,
      updatedAt: now,
    }, ...prev]);
    setNewNote("");
  };

  const startEdit = (note: typeof notes[0]) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const saveEdit = () => {
    if (!editingId) return;
    setNotes(prev => prev.map(n => n.id === editingId ? { ...n, content: editContent, updatedAt: new Date().toISOString() } : n));
    setEditingId(null);
    setEditContent("");
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="space-y-3">
      {/* Compose area */}
      <div className="rounded-lg border bg-card">
        <textarea
          ref={textareaRef}
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              addNote();
            }
          }}
          placeholder="Add a note..."
          className="w-full resize-none bg-transparent px-3.5 pt-3 pb-1 text-sm leading-relaxed outline-none placeholder:text-muted-foreground/50 min-h-[72px]"
        />
        <div className="flex items-center justify-between px-3.5 pb-2.5">
          <span className="text-[10px] text-muted-foreground/40">
            {newNote.trim() ? `${String.fromCodePoint(8984)}+Enter to save` : "Private to you"}
          </span>
          {newNote.trim() && (
            <Button size="sm" className="h-7 text-xs" onClick={addNote}>
              Save note
            </Button>
          )}
        </div>
      </div>

      {/* Existing notes */}
      {notes.map(n => (
        <div key={n.id} className="group rounded-lg border p-3.5">
          {editingId === n.id ? (
            <div>
              <textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                className="w-full resize-none bg-transparent text-sm leading-relaxed outline-none min-h-[60px]"
                autoFocus
              />
              <div className="mt-2 flex gap-2">
                <Button size="sm" className="h-6 text-[10px]" onClick={saveEdit}>Save</Button>
                <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => setEditingId(null)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{n.content}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  {new Date(n.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  {n.createdAt !== n.updatedAt && " (edited)"}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="ghost" className="h-6 text-[10px] text-muted-foreground" onClick={() => startEdit(n)}>
                    <Pen className="size-2.5 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" className="h-6 text-[10px] text-muted-foreground" onClick={() => deleteNote(n.id)}>
                    <X className="size-2.5 mr-1" /> Delete
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      ))}

      {notes.length === 0 && !newNote && (
        <div className="py-6 text-center">
          <p className="text-sm text-muted-foreground">No notes yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Notes are private and only visible to you</p>
        </div>
      )}
    </div>
  );
}

// Editable notes component
function EditableNotes({ initialNotes }: { initialNotes: string }) {
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(initialNotes);
  return (
    <div className="rounded-xl bg-muted/50 p-3">
      {editing ? (
        <div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full min-h-[60px] bg-transparent text-sm leading-relaxed outline-none resize-none" autoFocus />
          <div className="mt-2 flex gap-2">
            <Button size="sm" className="h-6 text-[10px]" onClick={() => setEditing(false)}><Check className="size-2.5" /> Save</Button>
            <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => { setNotes(initialNotes); setEditing(false); }}>Cancel</Button>
          </div>
        </div>
      ) : (
        <button onClick={() => setEditing(true)} className="w-full text-left group">
          <p className="text-sm leading-relaxed text-muted-foreground">{notes}</p>
          <span className="text-[10px] text-muted-foreground/50 group-hover:text-muted-foreground mt-1 block">Click to edit</span>
        </button>
      )}
    </div>
  );
}

// Generated doc list for clients without explicit document data
// ── Unified Messages Tab for Dialog ──
function DialogMessagesTab({ client }: { client: Client }) {
  const baseThread = getUnifiedThread(client.id);
  const [localMsgs, setLocalMsgs] = useState<UnifiedMessage[]>([]);
  const [input, setInput] = useState("");
  const [composeChannel, setComposeChannel] = useState<Exclude<CommChannel, "voice">>("portal");
  const thread = [...baseThread, ...localMsgs];

  const suggestSms = !client.lastPortalLogin ||
    (Date.now() - new Date(client.lastPortalLogin).getTime()) / 86400000 > 7;

  const sendMsg = () => {
    if (!input.trim()) return;
    setLocalMsgs(prev => [...prev, {
      id: `sent-${Date.now()}`,
      sender: "preparer",
      channel: composeChannel,
      content: input,
      timestamp: new Date().toISOString(),
    }]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full -mb-6">
      <div className="flex-1 min-h-0 overflow-y-auto pb-3">
        <UnifiedTimeline messages={thread} client={client} />
      </div>
      <div className="shrink-0 border-t pt-2 pb-6 bg-background space-y-2">
        <ChannelSelector value={composeChannel} onChange={setComposeChannel} suggestSms={suggestSms} />
        <div className="flex items-center gap-2">
          <input
            placeholder={composeChannel === "email" ? "Compose email..." : composeChannel === "sms" ? "Type a text..." : `Message ${client.fullName.split(" ")[0]}...`}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMsg()}
            className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none"
          />
          <Button size="icon" className="size-9 shrink-0" onClick={sendMsg} disabled={!input.trim()}>
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Activity Tab for Dialog ──
function DialogActivityTab({ client, activityFilter, setActivityFilter }: {
  client: Client;
  activityFilter: FilterOption;
  setActivityFilter: (f: FilterOption) => void;
}) {
  const allEvents = getClientActivity(client.id);
  const counts: Record<FilterOption, number> = { all: allEvents.length, antonio: 0, client: 0, ai: 0, system: 0 };
  for (const e of allEvents) {
    if (e.actor && e.actor in counts) counts[e.actor as FilterOption]++;
  }
  const filtered = activityFilter === "all" ? allEvents : allEvents.filter(e => e.actor === activityFilter);

  return (
    <div className="space-y-3">
      <ActivityFilterBar active={activityFilter} onChange={setActivityFilter} counts={counts} />
      <div className="max-h-[calc(90vh-280px)] overflow-y-auto">
        <AuditTrailTimeline events={filtered} clientAvatar={client.avatar} clientName={client.fullName} />
      </div>
    </div>
  );
}

function GeneratedDocList({ client }: { client: Client }) {
  const docs: { name: string; type: string; size: string }[] = [];

  // Every client has these
  docs.push({ name: "Driver's License", type: "ID", size: "1.8 MB" });
  docs.push({ name: "Engagement Letter 2025", type: "AGR", size: "156 KB" });
  docs.push({ name: "7216 Consent", type: "AGR", size: "92 KB" });

  // Income docs based on type
  if (client.type === "business" && client.businessName) {
    docs.push({ name: `W-2 (${client.businessName})`, type: "W2", size: "245 KB" });
    docs.push({ name: `Business P&L (${client.businessName})`, type: "EXP", size: "890 KB" });
    docs.push({ name: "Business Expenses", type: "EXP", size: "456 KB" });
  } else {
    docs.push({ name: "W-2 (Employer)", type: "W2", size: "120 KB" });
  }

  if (client.filingStatus === "mfj") {
    docs.push({ name: "W-2 (Spouse)", type: "W2", size: "118 KB" });
  }

  // Filed clients get the return
  if (client.returnStage === "filed") {
    docs.push({ name: "2025 Federal Return (1040)", type: "RET", size: "1.8 MB" });
    docs.push({ name: "2025 State Return", type: "RET", size: "980 KB" });
  }

  // Trim to match actual doc count
  const trimmed = docs.slice(0, Math.max(client.documentsRequired, docs.length));

  return (
    <div className="rounded-xl border divide-y">
      {trimmed.map((doc, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5">
          <Badge variant="outline" className="h-6 min-w-[36px] justify-center rounded-md px-1.5 text-[10px] font-semibold">{doc.type}</Badge>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-medium">{doc.name}</div>
            <div className="text-xs text-muted-foreground">{doc.size}</div>
          </div>
          <button className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" title="Download">
            <Download className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

// Inline messages component for the dialog — uses shared message data
function ClientMessagesInline({ clientId, clientAvatar, clientName }: { clientId: string; clientAvatar: string; clientName: string }) {
  const baseThread = getThread(clientId);
  const [localMsgs, setLocalMsgs] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState("");
  const [dismissedDrafts, setDismissedDrafts] = useState<Set<string>>(new Set());
  const drafts = getClientDrafts(clientId).filter(d => !dismissedDrafts.has(d.id));

  // Filter to just client/preparer messages for the compact dialog view (skip system cards)
  const thread = [...baseThread, ...localMsgs].filter(m => m.sender === "client" || m.sender === "preparer");

  const sendMsg = (text: string) => {
    setLocalMsgs(prev => [...prev, { id: `sent-${Date.now()}`, sender: "preparer", content: text, time: "Just now" }]);
    drafts.forEach(d => setDismissedDrafts(prev => new Set([...prev, d.id])));
  };

  if (thread.length === 0 && drafts.length === 0) {
    return <div className="py-8 text-center text-sm text-muted-foreground">No messages yet with {clientName.split(" ")[0]}.</div>;
  }

  return (
    <div className="flex flex-col h-full -mb-6">
      {/* Scrollable messages */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pb-3">
        {thread.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender === "client" ? "justify-start" : "justify-end"}`}>
            {msg.sender === "client" && (
              <Avatar className="mr-2 size-6 shrink-0 mt-1">
                <AvatarImage src={clientAvatar} alt={clientName} />
                <AvatarFallback className="text-[8px]">{clientName.split(" ").map(n => n[0]).join("").slice(0, 2)}</AvatarFallback>
              </Avatar>
            )}
            <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${msg.sender === "client" ? "border bg-muted/50" : "bg-primary text-primary-foreground"}`}>
              <p className="text-xs leading-relaxed">{msg.content}</p>
              <div className={`mt-0.5 text-[9px] ${msg.sender === "client" ? "text-muted-foreground" : "text-primary-foreground/60"}`}>{msg.time}</div>
            </div>
          </div>
        ))}
        {/* AI Draft */}
        {drafts.length > 0 && (
          <AIDraftCard
            draft={drafts[0]}
            onSend={sendMsg}
            onEdit={(text) => { setInput(text); drafts.forEach(d => setDismissedDrafts(prev => new Set([...prev, d.id]))); }}
            onDismiss={() => setDismissedDrafts(prev => new Set([...prev, drafts[0].id]))}
          />
        )}
      </div>
      {/* Input pinned to bottom */}
      <div className="shrink-0 border-t pt-3 pb-6 bg-background">
        <MessageInput
          placeholder={`Message ${clientName.split(" ")[0]}...`}
          value={input}
          onChange={setInput}
          onSend={(text) => { sendMsg(text); setInput(""); }}
        />
      </div>
    </div>
  );
}

// ── Inline Docket Insight Cards ──

function InlineComplianceCard({ alert, onAskDocket, clientName }: { alert: typeof complianceAlerts[0]; onAskDocket: (q: string) => void; clientName: string }) {
  const [status, setStatus] = useState(alert.status);
  return (
    <div className={`rounded-lg border p-4 ${status === "acknowledged" ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 size-2 shrink-0 rounded-full bg-red-500" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{alert.title}</span>
            <Badge variant={alert.severity === "critical" ? "destructive" : "secondary"} className="text-[10px]">{alert.severity}</Badge>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{alert.description}</p>
          <div className="mt-2 flex items-center gap-4 text-xs">
            <span className="text-muted-foreground">Form: <strong>{alert.formRequired}</strong></span>
            <span className="text-red-600">{alert.fineRisk}</span>
          </div>
        </div>
      </div>
      {status === "pending" && (
        <div className="mt-3 flex gap-2">
          <Button size="sm" onClick={() => setStatus("acknowledged")}><Check className="size-3.5" /> Acknowledge</Button>
          <Button size="sm" variant="outline" onClick={() => setStatus("dismissed")}><X className="size-3.5" /> Dismiss</Button>
          <Button size="sm" variant="ghost" className="ml-auto text-muted-foreground" onClick={() => onAskDocket(`Explain ${alert.title} compliance requirement for ${clientName}`)}>Ask Docket</Button>
        </div>
      )}
    </div>
  );
}

function InlineAnomalyCard({ alert, onAskDocket, clientName }: { alert: typeof anomalyAlerts[0]; onAskDocket: (q: string) => void; clientName: string }) {
  const [status, setStatus] = useState(alert.status);
  return (
    <div className={`rounded-lg border p-4 ${status !== "pending" ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 size-2 shrink-0 rounded-full bg-amber-500" />
        <div className="flex-1">
          <div className="text-sm font-semibold">Year-over-year anomaly: {alert.metric}</div>
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
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{alert.aiExplanation}</p>
        </div>
      </div>
      {status === "pending" && (
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setStatus("flagged")}>Flag for review</Button>
          <Button size="sm" variant="ghost" onClick={() => setStatus("proceeded")}>Proceed</Button>
          <Button size="sm" variant="ghost" className="ml-auto text-muted-foreground" onClick={() => onAskDocket(`Explain the ${alert.metric} anomaly for ${clientName}: ${alert.changePercent}% change`)}>Ask Docket</Button>
        </div>
      )}
    </div>
  );
}

function InlineDeductionCard({ suggestion, onAskDocket, clientName }: { suggestion: typeof deductionSuggestions[0]; onAskDocket: (q: string) => void; clientName: string }) {
  const [status, setStatus] = useState(suggestion.status);
  return (
    <div className={`rounded-lg border p-4 ${status !== "pending" ? "opacity-60" : ""}`}>
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
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{suggestion.description}</p>
      {status === "pending" && (
        <div className="mt-3 flex gap-2">
          <Button size="sm" onClick={() => setStatus("applied")}><Check className="size-3.5" /> Apply</Button>
          <Button size="sm" variant="outline" onClick={() => setStatus("dismissed")}><X className="size-3.5" /> Dismiss</Button>
          <Button size="sm" variant="ghost" className="ml-auto text-muted-foreground" onClick={() => onAskDocket(`Tell me about ${suggestion.deductionType} for ${clientName}: ${suggestion.description}`)}>Ask Docket</Button>
        </div>
      )}
    </div>
  );
}

function InlineIrsNoticeCard({ notice }: { notice: typeof irsNotices[0] }) {
  const [state, setState] = useState<"idle" | "processing" | "complete">("idle");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(notice.aiDraftResponse);

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 size-2 shrink-0 rounded-full bg-red-500" />
        <div className="flex-1">
          <div className="text-sm font-semibold">{notice.noticeType} Notice</div>
          <div className="text-xs text-muted-foreground">Received {notice.receivedDate}</div>
          <p className="mt-2 text-xs leading-relaxed text-foreground/80">{notice.summary}</p>
        </div>
      </div>
      <Separator className="my-3" />
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2">AI-drafted response</div>
      {editing ? (
        <div>
          <textarea value={draft} onChange={e => setDraft(e.target.value)} className="w-full min-h-[100px] rounded-lg border bg-background p-2 text-xs font-mono outline-none resize-none" />
          <div className="mt-2 flex gap-2">
            <Button size="sm" onClick={() => { setEditing(false); setState("processing"); setTimeout(() => setState("complete"), 1500); }}>Send</Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
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
            <Button size="sm" onClick={() => { setState("processing"); setTimeout(() => setState("complete"), 1500); }}>Send response</Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>Edit draft</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Billing Tab ──
function BillingTab({ client, sentBilling, setSentBilling }: { client: Client; sentBilling: string | null; setSentBilling: (v: string | null) => void }) {
  const ps = getClientPaymentSummary(client.id);

  const events: { date: string; label: string; type: "paid" | "sent" | "pending" | "overdue" }[] = [];
  if (ps.deposit?.paidDate) events.push({ date: ps.deposit.paidDate, label: `Deposit paid — $${ps.deposit.amount}`, type: "paid" });
  if (ps.deposit?.sentDate && ps.deposit.status !== "paid") events.push({ date: ps.deposit.sentDate, label: `Deposit invoice sent — $${ps.deposit.amount}`, type: ps.deposit.status === "overdue" ? "overdue" : "sent" });
  if (ps.balance?.paidDate) events.push({ date: ps.balance.paidDate, label: `Balance paid — $${ps.balance.amount}`, type: "paid" });
  if (ps.balance?.sentDate && ps.balance.status !== "paid") events.push({ date: ps.balance.sentDate, label: `Balance invoice sent — $${ps.balance.amount}`, type: ps.balance.status === "overdue" ? "overdue" : "sent" });
  events.sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-4">
      <div className="rounded-xl border p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-semibold">{client.serviceTier} Return</div>
            <div className="text-xs text-muted-foreground">Total fee: ${client.feeAmount}</div>
          </div>
          <div className="text-right">
            <div className="font-display text-xl tabular-nums tracking-tight">${ps.totalPaid} <span className="text-sm font-normal text-muted-foreground">/ ${ps.totalFee}</span></div>
            <div className={`text-xs font-medium ${ps.fullyPaid ? "text-emerald-600" : ps.hasOverdue ? "text-red-500" : "text-muted-foreground"}`}>
              {ps.fullyPaid ? "Paid in full" : ps.hasOverdue ? `$${ps.totalOwed} overdue` : `$${ps.totalOwed} remaining`}
            </div>
          </div>
        </div>
        <Progress value={(ps.totalPaid / ps.totalFee) * 100} className="h-2" indicatorColor={ps.fullyPaid ? "bg-emerald-500" : ps.hasOverdue ? "bg-red-500" : undefined} />
      </div>

      <div className="space-y-2">
        <div className="rounded-xl border p-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Deposit</div>
            <div className="text-xs text-muted-foreground">${ps.deposit?.amount || 50}</div>
          </div>
          {ps.deposit?.status === "paid" ? (
            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">Paid {ps.deposit.paidDate && new Date(ps.deposit.paidDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</Badge>
          ) : ps.deposit?.status === "overdue" ? (
            <Badge variant="destructive">Overdue</Badge>
          ) : (
            <Badge variant="secondary">Pending</Badge>
          )}
        </div>
        {ps.balance && ps.balance.status !== "not_applicable" && (
          <div className="rounded-xl border p-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Remaining Balance</div>
              <div className="text-xs text-muted-foreground">${ps.balance.amount}</div>
            </div>
            {ps.balance.status === "paid" ? (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">Paid {ps.balance.paidDate && new Date(ps.balance.paidDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</Badge>
            ) : ps.balance.status === "sent" ? (
              <Badge variant="secondary">Invoice sent</Badge>
            ) : (
              <Badge variant="outline">Not yet invoiced</Badge>
            )}
          </div>
        )}
      </div>

      {events.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground">Payment Timeline</div>
          {events.map((e, i) => (
            <div key={i} className="flex items-center gap-3 text-xs">
              <div className={`size-2 shrink-0 rounded-full ${e.type === "paid" ? "bg-emerald-500" : e.type === "overdue" ? "bg-red-500" : "bg-muted-foreground/30"}`} />
              <span className="text-muted-foreground">{new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
              <span>{e.label}</span>
            </div>
          ))}
        </div>
      )}

      {!ps.fullyPaid && (
        <div className="flex gap-2">
          {ps.deposit?.status === "overdue" && (
            sentBilling === "reminder" ? (
              <div className="flex items-center gap-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 animate-in fade-in slide-in-from-bottom-1 duration-300">
                <Check className="size-3.5" /> Reminder sent
              </div>
            ) : (
              <Button size="sm" onClick={() => setSentBilling("reminder")}>
                <Send className="size-3.5" /> Send payment reminder
              </Button>
            )
          )}
          {ps.balance?.status === "pending" && (
            sentBilling === "invoice" ? (
              <div className="flex items-center gap-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 animate-in fade-in slide-in-from-bottom-1 duration-300">
                <Check className="size-3.5" /> Invoice sent
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setSentBilling("invoice")}>
                <DollarSign className="size-3.5" /> Send invoice
              </Button>
            )
          )}
          {ps.balance?.status === "sent" && (
            sentBilling === "resend" ? (
              <div className="flex items-center gap-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 animate-in fade-in slide-in-from-bottom-1 duration-300">
                <Check className="size-3.5" /> Invoice resent
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setSentBilling("resend")}>
                <Send className="size-3.5" /> Resend invoice
              </Button>
            )
          )}
        </div>
      )}
    </div>
  );
}

// ── Contextual Actions by Stage ──
function ContextualActions({ stage, onEroSign }: { stage: string; onEroSign: () => void }) {
  const [sent, setSent] = useState<string | null>(null);
  const actions: { icon: React.ReactNode; label: string; sentLabel?: string; primary?: boolean; onClick: () => void }[] = [];

  const sendAction = (key: string) => { setSent(key); setTimeout(() => setSent(null), 2500); };

  switch (stage) {
    case "new_intake":
      actions.push({ icon: <Send className="size-3.5" />, label: "Send Intake", sentLabel: "Sent!", primary: true, onClick: () => sendAction("intake") });
      actions.push({ icon: <Send className="size-3.5" />, label: "Remind", sentLabel: "Reminded", onClick: () => sendAction("remind") });
      actions.push({ icon: <MessageSquare className="size-3.5" />, label: "Message", onClick: () => { const el = document.querySelector('[data-value="messages"]') as HTMLElement; el?.click(); } });
      actions.push({ icon: <Calendar className="size-3.5" />, label: "Schedule", onClick: () => window.open("/dashboard/apps/calendar", "_blank") });
      break;
    case "collecting_docs":
      actions.push({ icon: <FileText className="size-3.5" />, label: "Request Docs", sentLabel: "Requested", primary: true, onClick: () => sendAction("docs") });
      actions.push({ icon: <Send className="size-3.5" />, label: "Remind", sentLabel: "Reminded", onClick: () => sendAction("remind") });
      actions.push({ icon: <MessageSquare className="size-3.5" />, label: "Message", onClick: () => { const el = document.querySelector('[data-value="messages"]') as HTMLElement; el?.click(); } });
      actions.push({ icon: <ExternalLink className="size-3.5" />, label: "Portal", onClick: () => window.open("/clientportal", "_blank") });
      break;
    case "ready_to_prep":
      actions.push({ icon: <FileText className="size-3.5" />, label: "Start Prep", sentLabel: "Started", primary: true, onClick: () => sendAction("prep") });
      actions.push({ icon: <MessageSquare className="size-3.5" />, label: "Message", onClick: () => { const el = document.querySelector('[data-value="messages"]') as HTMLElement; el?.click(); } });
      actions.push({ icon: <Calendar className="size-3.5" />, label: "Schedule", onClick: () => window.open("/dashboard/apps/calendar", "_blank") });
      break;
    case "in_preparation":
      actions.push({ icon: <MessageSquare className="size-3.5" />, label: "Message", onClick: () => { const el = document.querySelector('[data-value="messages"]') as HTMLElement; el?.click(); } });
      actions.push({ icon: <Calendar className="size-3.5" />, label: "Schedule", onClick: () => window.open("/dashboard/apps/calendar", "_blank") });
      actions.push({ icon: <ExternalLink className="size-3.5" />, label: "Portal", onClick: () => window.open("/clientportal", "_blank") });
      break;
    case "client_review":
      actions.push({ icon: <Send className="size-3.5" />, label: "Nudge", sentLabel: "Nudged", primary: true, onClick: () => sendAction("nudge") });
      actions.push({ icon: <MessageSquare className="size-3.5" />, label: "Message", onClick: () => { const el = document.querySelector('[data-value="messages"]') as HTMLElement; el?.click(); } });
      actions.push({ icon: <ExternalLink className="size-3.5" />, label: "Portal", onClick: () => window.open("/clientportal", "_blank") });
      break;
    case "pay_and_sign":
      actions.push({ icon: <Shield className="size-3.5" />, label: "Sign as ERO", primary: true, onClick: onEroSign });
      actions.push({ icon: <DollarSign className="size-3.5" />, label: "Send Invoice", sentLabel: "Sent!", onClick: () => sendAction("invoice") });
      actions.push({ icon: <MessageSquare className="size-3.5" />, label: "Message", onClick: () => { const el = document.querySelector('[data-value="messages"]') as HTMLElement; el?.click(); } });
      break;
    case "filed":
      actions.push({ icon: <MessageSquare className="size-3.5" />, label: "Message", onClick: () => { const el = document.querySelector('[data-value="messages"]') as HTMLElement; el?.click(); } });
      actions.push({ icon: <Calendar className="size-3.5" />, label: "Schedule", onClick: () => window.open("/dashboard/apps/calendar", "_blank") });
      actions.push({ icon: <Download className="size-3.5" />, label: "Return", sentLabel: "Downloaded", onClick: () => sendAction("return") });
      break;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((a, i) => {
        const key = a.label.toLowerCase().replace(/\s/g, "_");
        const isSent = sent === key;
        if (isSent && a.sentLabel) {
          return (
            <div key={i} className="flex items-center gap-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 animate-in fade-in slide-in-from-bottom-1 duration-300 h-8">
              <Check className="size-3.5" /> {a.sentLabel}
            </div>
          );
        }
        return (
          <Button key={i} size="sm" variant={a.primary ? "default" : "outline"} className="h-8 text-xs" onClick={() => {
            if (a.sentLabel) sendAction(key);
            else a.onClick();
          }}>
            {a.icon} {a.label}
          </Button>
        );
      })}
    </div>
  );
}

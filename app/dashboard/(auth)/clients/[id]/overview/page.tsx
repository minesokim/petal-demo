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
  TrendingDown, Calculator, Brain, Download, ClipboardList, Upload, Plus, PanelLeftOpen
} from "lucide-react";
import Link from "next/link";
import { clients, stageLabels, actionItems, getClientPaymentSummary, pendingIntakeContext, serviceTierOptions, type InsightAction } from "@/lib/mock-data";
import { setStageOverride as setStageOverrideGlobal } from "@/lib/stage-overrides";
import { PetalInsightCard, TrackingBadgeGroup } from "@/components/insights";
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
// Chart library components available in components/ui/ — imported when needed
import { useAIPanelAsk } from "@/components/ai-panel";
import { useToast } from "@/components/ui/toast-notification";
import { OpenItemsSection } from "@/components/issues/open-items-section";
import { Form8867Dialog } from "@/components/compliance/form-8867-dialog";
import { Form8867Viewer } from "@/components/compliance/form-8867-viewer";
import { PrepWorkspaceModal } from "@/components/prep-workspace/prep-workspace-modal";
import { BillingCard } from "@/components/billing/billing-card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ClientAskPetal } from "@/components/client-ask-petal";
import { getClientNotes, type ClientNote } from "@/lib/documents-mock-data";
import { StageActionCard, getStageActionDescriptor } from "@/components/stage-action-card";

export default function ClientOverviewPage() {
  const params = useParams();
  const client = clients.find(c => c.id === params.id);
  const [selectedAction, setSelectedAction] = useState<FeedAction | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedExtraction, setSelectedExtraction] = useState<DocumentExtraction | null>(null);
  const [eroOpen, setEroOpen] = useState(false);
  const [chatMinimized, setChatMinimized] = useState(false);
  const [stageOverride, setStageOverride] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [sentBilling, setSentBilling] = useState<string | null>(null);
  const [completePrepOpen, setCompletePrepOpen] = useState(false);
  const [returnSummary, setReturnSummary] = useState("");
  const [returnPdf, setReturnPdf] = useState<File | null>(null);
  const [pdfDragOver, setPdfDragOver] = useState(false);
  const [prepWorkspaceOpen, setPrepWorkspaceOpen] = useState(false);
  const [extensionDialogOpen, setExtensionDialogOpen] = useState(false);
  const [flaggedItems, setFlaggedItems] = useState<Array<{ id: string; clientId: string; title: string; description: string; source: string; priority: string; createdAt: string; status: string }>>([]);
  const { showToast } = useToast();
  let askPetal = (_q: string) => {};
  try { askPetal = useAIPanelAsk(); } catch {}

  if (!client) return <div className="text-muted-foreground">Client not found</div>;

  const currentStage = stageOverride || client.returnStage;
  const clientInsight = getInsightForClient(client.id);
  const clientTrackingBadges = getTrackingBadgesForClient(client.id);

  const handleInsightAction = (action: InsightAction) => {
    if (action.action === "file_extension") {
      setExtensionDialogOpen(true);
      return;
    }
    if (action.action === "ero_sign") {
      setEroOpen(true);
      return;
    }
    if (action.action === "ask_petal") {
      askPetal(`Tell me more about ${client.fullName}'s situation — what do I need to know?`);
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

  // Unified next-action descriptor — drives the StageActionCard rendered at the
  // top of the Snapshot tab AND the top of the compact-mode sidebar.
  const hasOpenFlags = !!clientInsight && (clientInsight.severity === "high" || clientInsight.severity === "critical");
  const stageAction = getStageActionDescriptor({
    stage: currentStage,
    client,
    transitioning,
    stageOverride,
    hasOpenFlags,
    onSignEFile: () => setEroOpen(true),
    onCompletePrep: () => setCompletePrepOpen(true),
    onBeginPrep: () => {
      setTransitioning(true);
      setTimeout(() => {
        setStageOverride("in_preparation");
        setStageOverrideGlobal(client.id, "in_preparation");
        setTransitioning(false);
        showToast("success", "Preparation started", `${client.fullName.split(" ")[0]} has been moved to In Preparation.`);
      }, 1500);
    },
  });

  // Mirrors the popup's "promote metadata when no hero" pattern. When the
  // chat-minimized main column would otherwise be sparse (no insight, no
  // stage CTA, no compliance), promote Intake Summary + Contact + Notes UP
  // from the sidebar into the main column so it doesn't read as half-empty.
  const hasLeftContent = !!clientInsight || !!stageAction || clientCompliance.length > 0;

  const intakeSummaryCardJSX = (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm">Intake Summary</CardTitle>
        <Link href={`/dashboard/clients/${client.id}/intake`}>
          <Button variant="ghost" size="sm" className="text-xs gap-1">Full <ChevronRight className="size-3" /></Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Filing</div>
            <div className="text-xs font-medium mt-0.5">{client.filingStatus === "mfj" ? "Married Filing Jointly" : client.filingStatus === "single" ? "Single" : client.filingStatus === "hoh" ? "Head of Household" : client.filingStatus}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Service</div>
            <div className="text-xs font-medium mt-0.5">{client.serviceTier}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Type</div>
            <div className="text-xs font-medium mt-0.5 capitalize">{client.type}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Stage</div>
            <div className="text-xs font-medium mt-0.5">{stageLabels[currentStage] || currentStage}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Documents</div>
            <div className="text-xs font-medium mt-0.5 tabular-nums">{client.documentsSubmitted} / {client.documentsRequired}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Deposit</div>
            <div className="text-xs font-medium mt-0.5">{client.depositPaid ? <span className="text-emerald-600">Paid</span> : <span className="text-amber-600">Pending</span>}</div>
          </div>
        </div>
        {/* (Notes paragraph removed — duplicated the dedicated Notes card.) */}
      </CardContent>
    </Card>
  );

  const contactCardJSX = (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-sm">Contact</CardTitle></CardHeader>
      <CardContent className="space-y-2.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground"><Mail className="size-3.5 shrink-0" /> <span className="truncate">{client.email}</span></div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground"><Phone className="size-3.5 shrink-0" /> {client.phone}</div>
      </CardContent>
    </Card>
  );

  const notesCardJSX = (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-sm">Notes</CardTitle></CardHeader>
      <CardContent>
        <NotesPanel client={client} />
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:h-[calc(100vh-200px)]">
      {/* Left: Ask Petal chat — hidden when minimized */}
      {!chatMinimized && (
        <div className="flex min-h-[600px] min-w-0 flex-1 flex-col lg:min-h-0">
          <ClientAskPetal
            client={client}
            onInsightAction={handleInsightAction}
            onInsightFlag={(title, description) => {
              setFlaggedItems(prev => [...prev, {
                id: `flag-${Date.now()}`,
                clientId: client.id,
                title,
                description,
                source: "ai_insight",
                priority: "high",
                createdAt: new Date().toISOString(),
                status: "open",
              }]);
              showToast("success", "Flagged for review", `${title} added to your flags`);
            }}
            onMinimize={() => setChatMinimized(true)}
          />
        </div>
      )}
      {/* Right: Overview details — scrollable on lg, expands when chat is minimized */}
      {/* [zoom:0.85] shrinks the whole right section (tabs + cards + text) by 15%
          when chat is visible. Original column width restored — zoom does the
          shrinking so width AND content both scale together. */}
      <aside className={`${chatMinimized ? "flex-1" : "lg:w-[380px] lg:shrink-0 [zoom:0.85]"} lg:overflow-y-auto lg:pr-1`}>
        <div className="space-y-6">
      {/* Prep Workspace button — portaled into layout header */}
      <PrepWorkspacePortal visible={currentStage === "in_preparation"} onOpen={() => setPrepWorkspaceOpen(true)} />

      {chatMinimized && (
        // ────── COMPACT 2-COLUMN LAYOUT (chat hidden) ──────
        <>
          <div className="sticky top-0 z-10 -mt-1 flex items-center bg-background pb-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => setChatMinimized(false)}
              title="Show chat"
            >
              <PanelLeftOpen className="size-4" />
              <span className="text-xs">Show chat</span>
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
            {/* MAIN COLUMN — AI insight hero, flags, billing.
                Action items (stage CTAs, compliance) and all metadata live in the sidebar. */}
            <main className="min-w-0 space-y-5">
              {/* AI Insight hero — front and center since the chat is hidden.
                  Fresh-generated animation: starts blurred + faded out, slides in
                  smoothly. Gives the user the feeling the AI just produced it
                  rather than presenting a pre-baked card. */}
              {/* AI Insight hero — only renders when an insight exists. For
                  clients without insights (new intakes, etc.) the chat-minimized
                  view simply omits the hero; the Ask-Petal welcome lives in the
                  chat-visible state (ClientAskPetal) only. */}
              {clientInsight && !stageOverride && (
                <div className="[zoom:0.85]">
                  <motion.div
                    initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
                  >
                  <PetalInsightCard
                    insight={clientInsight}
                    defaultExpanded
                    hideAskPetal
                    onAction={handleInsightAction}
                    onFlag={(title, description) => {
                      setFlaggedItems(prev => [...prev, {
                        id: `flag-${Date.now()}`,
                        clientId: client.id,
                        title,
                        description,
                        source: "ai_insight",
                        priority: "high",
                        createdAt: new Date().toISOString(),
                        status: "open",
                      }]);
                      showToast("success", "Flagged for review", `${title} added to your flags`);
                    }}
                  />
                  </motion.div>
                </div>
              )}

              {/* Compliance cards (Form 8867 etc.) moved to the sidebar action zone — alongside StageActionCard. */}

              {/* Pending client */}
              {client.clientStatus === "pending" && (
                <div className="rounded-xl border bg-card p-5 space-y-4">
                  <div className="rounded-lg bg-amber-50/60 dark:bg-amber-950/10 border border-amber-200/50 px-4 py-3">
                    <h3 className="text-base font-bold text-amber-900 dark:text-amber-100">Assign a service tier to accept this client</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {client.fullName.split(" ")[0]} completed intake and paid the $50 deposit. Select a tier to start their return.
                    </p>
                  </div>
                  {client.notes && <p className="text-xs text-foreground/70 leading-relaxed">{client.notes}</p>}
                  {(() => {
                    const ctx = pendingIntakeContext[client.id];
                    return ctx ? (
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span>{ctx.filing}</span>
                        <span className="text-muted-foreground/30">·</span>
                        <span>{ctx.income.join(", ")}</span>
                        <span className="text-muted-foreground/30">·</span>
                        <span>Requested {ctx.service}</span>
                      </div>
                    ) : null;
                  })()}
                  <div className="space-y-2">
                    <select className="w-full h-10 rounded-lg border bg-background px-3 text-sm outline-none">
                      <option value="">Assign service tier...</option>
                      {serviceTierOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <Button className="flex-1 h-10" onClick={() => showToast("success", "Client accepted", `${client.fullName} has been added to your pipeline.`)}>Accept Client</Button>
                      <Button variant="outline" className="h-10 px-6" onClick={() => showToast("info", "Client declined", `${client.fullName} has been removed.`)}>Decline</Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Stage CTAs (Sign & e-file / Begin Prep / Complete Prep) moved
                  to the top of the sidebar in compact mode so they're never
                  hidden away. The transitioning indicator (brief spinner) stays
                  inline here so the user sees the in-progress state. */}
              <AnimatePresence>
                {transitioning && (
                  <motion.div
                    key="transitioning-compact"
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

              {/* Flags / Open items */}
              {currentStage !== "filed" && (
                <OpenItemsSection clientId={client.id} additionalItems={flaggedItems as any} />
              )}

              {/* Billing — financial snapshot */}
              <BillingCard client={client} />

              {/* When there's no hero content (no insight, no stage CTA, no
                  compliance), promote Intake Summary + Contact + Notes UP into
                  the main column so it doesn't read as half-empty. They're
                  removed from the sidebar in that case. */}
              {!hasLeftContent && intakeSummaryCardJSX}
              {!hasLeftContent && contactCardJSX}
              {!hasLeftContent && notesCardJSX}
            </main>

            {/* RIGHT SIDEBAR — sticky stack of metadata cards.
                No self-start so the column stretches to row height for symmetric bottoms. */}
            <aside className="space-y-4 lg:sticky lg:top-12">
              {/* ── ACTION ITEMS — always at the top so they're never hidden ── */}

              {/* Stage CTA: Sign & e-file / Begin Prep / Complete Prep */}
              {stageAction && <StageActionCard {...stageAction} />}

              {/* Compliance (Form 8867 due diligence etc.) — also an action item */}
              {clientCompliance.map(a => (
                <ComplianceCard key={a.id} alert={a} onAskPetal={(q) => askPetal(q)} clientName={client.fullName} />
              ))}

              {/* ── METADATA STACK ──
                  Intake / Contact / Notes only render here when there IS hero
                  content. Otherwise they're promoted into the main column. */}

              {/* Intake Summary — stacked 2-col layout for narrow sidebar */}
              {hasLeftContent && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-sm">Intake Summary</CardTitle>
                  <Link href={`/dashboard/clients/${client.id}/intake`}>
                    <Button variant="ghost" size="sm" className="text-xs gap-1">Full <ChevronRight className="size-3" /></Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Filing</div>
                      <div className="text-xs font-medium mt-0.5">{client.filingStatus === "mfj" ? "Married Filing Jointly" : client.filingStatus === "single" ? "Single" : client.filingStatus === "hoh" ? "Head of Household" : client.filingStatus}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Service</div>
                      <div className="text-xs font-medium mt-0.5">{client.serviceTier}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Type</div>
                      <div className="text-xs font-medium mt-0.5 capitalize">{client.type}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Stage</div>
                      <div className="text-xs font-medium mt-0.5">{stageLabels[currentStage] || currentStage}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Documents</div>
                      <div className="text-xs font-medium mt-0.5 tabular-nums">{client.documentsSubmitted} / {client.documentsRequired}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Deposit</div>
                      <div className="text-xs font-medium mt-0.5">{client.depositPaid ? <span className="text-emerald-600">Paid</span> : <span className="text-amber-600">Pending</span>}</div>
                    </div>
                  </div>
                  {/* (Notes paragraph removed — duplicated the dedicated Notes card below.) */}
                </CardContent>
              </Card>
              )}

              {/* Documents — progress + last login */}
              {(() => {
                const dp = client.documentsRequired > 0 ? Math.round((client.documentsSubmitted / client.documentsRequired) * 100) : 0;
                const lastLogin = client.lastPortalLogin
                  ? new Date(client.lastPortalLogin).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : "Never";
                return (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                      <CardTitle className="text-sm">Documents</CardTitle>
                      <Link href={`/dashboard/clients/${client.id}/documents`}>
                        <Button variant="ghost" size="sm" className="text-xs gap-1">View <ChevronRight className="size-3" /></Button>
                      </Link>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm">
                          <span className="font-display text-xl tabular-nums">{client.documentsSubmitted}</span>
                          <span className="text-muted-foreground"> of {client.documentsRequired}</span>
                        </span>
                        <span className="text-xs tabular-nums text-muted-foreground">{dp}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div className={`h-full transition-all ${dp >= 100 ? "bg-emerald-500" : dp >= 50 ? "bg-foreground/70" : "bg-amber-500"}`} style={{ width: `${dp}%` }} />
                      </div>
                      <div className="flex items-center justify-between border-t border-border/40 pt-3 text-xs">
                        <span className="text-muted-foreground">Last portal login</span>
                        <span className={`tabular-nums ${client.lastPortalLogin ? "text-foreground" : "text-amber-600"}`}>{lastLogin}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Return Progress — workflow timeline */}
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Return Progress</CardTitle></CardHeader>
                <CardContent>
                  <TrackingTimeline items={timelineItems} />
                </CardContent>
              </Card>

              {/* Contact — only in sidebar when hero exists; otherwise promoted to main */}
              {hasLeftContent && (
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Contact</CardTitle></CardHeader>
                <CardContent className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><Mail className="size-3.5 shrink-0" /> <span className="truncate">{client.email}</span></div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><Phone className="size-3.5 shrink-0" /> {client.phone}</div>
                </CardContent>
              </Card>
              )}

              {/* Notes — only in sidebar when hero exists; otherwise promoted to main */}
              {hasLeftContent && (
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Notes</CardTitle></CardHeader>
                <CardContent>
                  <NotesPanel client={client} />
                </CardContent>
              </Card>
              )}
            </aside>
          </div>
        </>
      )}

      {!chatMinimized && (
      <Tabs defaultValue="snapshot" className="space-y-4">
        <div className="sticky top-0 z-10 flex items-center gap-2 bg-background">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="snapshot">Snapshot</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="status" className="space-y-6">
      {/* Billing — financial snapshot */}
      <BillingCard client={client} />

      {/* Return Progress — workflow timeline */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Return Progress</CardTitle></CardHeader>
        <CardContent>
          <TrackingTimeline items={timelineItems} />
        </CardContent>
      </Card>

      {/* Pending client — blocking action */}
      {client.clientStatus === "pending" && (
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <div className="rounded-lg bg-amber-50/60 dark:bg-amber-950/10 border border-amber-200/50 px-4 py-3">
            <h3 className="text-base font-bold text-amber-900 dark:text-amber-100">Assign a service tier to accept this client</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {client.fullName.split(" ")[0]} completed intake and paid the $50 deposit. Select a tier to start their return.
            </p>
          </div>
          {client.notes && <p className="text-xs text-foreground/70 leading-relaxed">{client.notes}</p>}
          {(() => {
            const ctx = pendingIntakeContext[client.id];
            return ctx ? (
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span>{ctx.filing}</span>
                <span className="text-muted-foreground/30">·</span>
                <span>{ctx.income.join(", ")}</span>
                <span className="text-muted-foreground/30">·</span>
                <span>Requested {ctx.service}</span>
              </div>
            ) : null;
          })()}
          <div className="space-y-2">
            <select className="w-full h-10 rounded-lg border bg-background px-3 text-sm outline-none">
              <option value="">Assign service tier...</option>
              {serviceTierOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <Button className="flex-1 h-10" onClick={() => showToast("success", "Client accepted", `${client.fullName} has been added to your pipeline.`)}>
                Accept Client
              </Button>
              <Button variant="outline" className="h-10 px-6" onClick={() => showToast("info", "Client declined", `${client.fullName} has been removed.`)}>
                Decline
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* AI Insight moved to Ask Petal tab. */}

      {/* Chart library components saved in components/ui/ for future use:
          - stats-4.tsx (area sparklines)
          - category-bar-chart.tsx (segmented bar)
          - stats-cards-with-links.tsx (KPI cards)
          - stats-card-1.tsx (animated bar stats)
          - area-chart.tsx (recharts primitives)
          - statistics-card-2.tsx (colored KPI cards)
          - statistics-card-5.tsx (balance card)
      */}

      {/* Compliance cards (8867 due diligence) — second card, below insight */}
      {clientCompliance.map(a => (
        <ComplianceCard key={a.id} alert={a} onAskPetal={(q) => askPetal(q)} clientName={client.fullName} />
      ))}

      {/* Stage CTAs (Ready / Complete Prep / Sign & e-file) now live as the
          first card in the Snapshot tab via <StageActionCard>, so they're not
          duplicated here in the Status tab. */}

        </TabsContent>

        <TabsContent value="notes" className="space-y-3">
          <NotesPanel client={client} />
        </TabsContent>

        <TabsContent value="snapshot" className="space-y-6">
      {/* Single-column snapshot for narrow sidebar */}
      <div className="space-y-4">
        {/* ── ACTION ITEMS — always at the top so they're never hidden ── */}
        {stageAction && <StageActionCard {...stageAction} />}
        {clientCompliance.map(a => (
          <ComplianceCard key={a.id} alert={a} onAskPetal={(q) => askPetal(q)} clientName={client.fullName} />
        ))}

        {/* 1. Intake Summary — most-useful first-glance metadata */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Intake Summary</CardTitle>
            <Link href={`/dashboard/clients/${client.id}/intake`}>
              <Button variant="ghost" size="sm" className="text-xs gap-1">View full intake <ChevronRight className="size-3" /></Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div><div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Filing</div><div className="text-sm font-medium mt-0.5">{client.filingStatus === "mfj" ? "Married Filing Jointly" : client.filingStatus === "single" ? "Single" : client.filingStatus === "hoh" ? "Head of Household" : client.filingStatus}</div></div>
              <div><div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Service</div><div className="text-sm font-medium mt-0.5">{client.serviceTier}</div></div>
              <div><div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Stage</div><div className="text-sm font-medium mt-0.5">{stageLabels[client.returnStage]}</div></div>
              <div><div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Deposit</div><div className="text-sm font-medium mt-0.5">{client.depositPaid ? <span className="text-emerald-600">Paid</span> : <span className="text-amber-600">Pending</span>}</div></div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Document Tracker — progress + last login */}
        {(() => {
          const docPercent = client.documentsRequired > 0
            ? Math.round((client.documentsSubmitted / client.documentsRequired) * 100)
            : 0;
          const lastLogin = client.lastPortalLogin
            ? new Date(client.lastPortalLogin).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : "Never";
          return (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Documents</CardTitle>
                <Link href={`/dashboard/clients/${client.id}/documents`}>
                  <Button variant="ghost" size="sm" className="text-xs gap-1">View checklist <ChevronRight className="size-3" /></Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm">
                    <span className="font-display text-xl tabular-nums">{client.documentsSubmitted}</span>
                    <span className="text-muted-foreground"> of {client.documentsRequired} received</span>
                  </span>
                  <span className="text-xs tabular-nums text-muted-foreground">{docPercent}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full transition-all ${docPercent >= 100 ? "bg-emerald-500" : docPercent >= 50 ? "bg-foreground/70" : "bg-amber-500"}`}
                    style={{ width: `${docPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between border-t border-border/40 pt-3 text-xs">
                  <span className="text-muted-foreground">Last portal login</span>
                  <span className={`tabular-nums ${client.lastPortalLogin ? "text-foreground" : "text-amber-600"}`}>{lastLogin}</span>
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* 3. Flags — open items + AI-flagged review */}
        {currentStage !== "filed" && (
          <OpenItemsSection clientId={client.id} additionalItems={flaggedItems as any} />
        )}

        {/* 4. Contact — email + phone */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Contact</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Mail className="size-3.5" /> {client.email}</div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="size-3.5" /> {client.phone}</div>
          </CardContent>
        </Card>
      </div>

        </TabsContent>
      </Tabs>
      )}

      {/* Dialogs — always rendered so they work in both layouts */}
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

            {/* Return PDF upload */}
            <div>
              <label className="text-xs font-medium">Return PDF <span className="text-muted-foreground font-normal">(optional)</span></label>
              <div
                onDragOver={(e) => { e.preventDefault(); setPdfDragOver(true); }}
                onDragLeave={() => setPdfDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setPdfDragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file && file.type === "application/pdf") setReturnPdf(file);
                }}
                className={cn(
                  "mt-1.5 rounded-lg border-2 border-dashed p-4 text-center transition-colors cursor-pointer",
                  pdfDragOver ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40",
                  returnPdf && "border-emerald-300 bg-emerald-50/50"
                )}
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = ".pdf";
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) setReturnPdf(file);
                  };
                  input.click();
                }}
              >
                {returnPdf ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="size-4 text-emerald-600" />
                    <span className="text-xs font-medium">{returnPdf.name}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setReturnPdf(null); }}
                      className="ml-1 rounded-full p-0.5 hover:bg-muted"
                    >
                      <X className="size-3 text-muted-foreground" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Upload className="mx-auto size-5 text-muted-foreground/40" />
                    <p className="text-xs text-muted-foreground">Drop return PDF here or click to browse</p>
                  </div>
                )}
              </div>
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
                    setStageOverrideGlobal(client.id, "client_review");
                    setTransitioning(false);
                    showToast("success", "Sent for review", `${client.fullName.split(" ")[0]}'s return has been sent for client review.${returnPdf ? " Return PDF attached." : ""}`);
                    setReturnPdf(null);
                  }, 1500);
                }}
              >
                <Send className="size-3.5" /> Send for Review
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ActionExecutionSheet action={selectedAction} open={sheetOpen} onOpenChange={setSheetOpen} />
      <ExtractionDialog extraction={selectedExtraction} open={!!selectedExtraction} onOpenChange={(open) => !open && setSelectedExtraction(null)} />
      <EroSignatureDialog client={client} open={eroOpen} onOpenChange={setEroOpen} onComplete={() => {
        setStageOverride("filed");
        setStageOverrideGlobal(client.id, "filed");
        showToast("success", "Return filed!", `${client.fullName}'s return has been e-filed with the IRS.`);
      }} />
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
              <h3 className="text-base font-bold">Mark as Extended</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Confirm that you've filed Form 4868 for {client.fullName} with the IRS.
              </p>
            </div>

            <div className="rounded-lg border p-3 space-y-2">
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">What this does</div>
              <div className="flex items-center gap-2 text-xs">
                <Check className="size-3.5 text-emerald-600" />
                <span>Updates {client.fullName.split(" ")[0]}'s deadline to October 15, 2026</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Check className="size-3.5 text-emerald-600" />
                <span>Moves client to Extended stage in the pipeline</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="size-3.5 text-orange-500" />
                <span>Client still owes any estimated tax by April 15</span>
              </div>
            </div>

            {clientExtensions.length > 0 && (
              <div className="rounded-lg border p-3 space-y-2">
                <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Why extending</div>
                {clientExtensions[0]!.factors.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="mt-0.5 size-1 shrink-0 rounded-full bg-muted-foreground" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setExtensionDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  setExtensionDialogOpen(false);
                  setTransitioning(true);
                  setTimeout(() => {
                    setStageOverride("extended");
                    setStageOverrideGlobal(client.id, "extended");
                    setTransitioning(false);
                    showToast("success", "Extension filed", `${client.fullName.split(" ")[0]}'s deadline extended to October 15, 2026.`);
                  }, 1500);
                }}
              >
                <Check className="size-3.5" /> Confirm Extension Filed
              </Button>

            </div>
          </div>
        </DialogContent>
      </Dialog>
        </div>
      </aside>
    </div>
  );
}

// ── Notes Panel ──

function NotesPanel({ client }: { client: typeof clients[0] }) {
  const [notes, setNotes] = useState<ClientNote[]>(() => {
    const list = getClientNotes(client.id);
    if (client.notes && !list.some(n => n.content === client.notes)) {
      list.push({
        id: `seed-${client.id}`,
        clientId: client.id,
        content: client.notes,
        createdAt: new Date(0).toISOString(),
        updatedAt: new Date(0).toISOString(),
      });
    }
    return list;
  });
  const [newNote, setNewNote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const addNote = () => {
    if (!newNote.trim()) return;
    setNotes(prev => [{
      id: `n${Date.now()}`,
      clientId: client.id,
      content: newNote.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, ...prev]);
    setNewNote("");
  };

  const saveEdit = () => {
    setNotes(prev => prev.map(n => n.id === editingId ? { ...n, content: editContent, updatedAt: new Date().toISOString() } : n));
    setEditingId(null);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Textarea
          placeholder={`Private notes about ${client.fullName.split(" ")[0]}...`}
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          className="min-h-[72px] text-sm"
        />
        <Button size="sm" onClick={addNote} disabled={!newNote.trim()} className="w-full">
          <Plus className="size-3.5" /> Add note
        </Button>
      </div>
      <div className="space-y-2">
        {notes.length === 0 && (
          <div className="rounded-lg border border-dashed py-6 text-center text-xs text-muted-foreground">
            No notes yet.
          </div>
        )}
        {notes.map(note => (
          <div key={note.id} className="rounded-lg border bg-card p-3">
            {editingId === note.id ? (
              <div className="space-y-2">
                <Textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="min-h-[60px] text-sm" />
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveEdit}>Save</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm leading-relaxed">{note.content}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    {note.id.startsWith("seed-")
                      ? "From intake"
                      : <>
                          {new Date(note.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          {note.createdAt !== note.updatedAt && " · edited"}
                        </>
                    }
                  </span>
                  <Button size="sm" variant="ghost" className="h-6 text-[11px]" onClick={() => { setEditingId(note.id); setEditContent(note.content); }}>
                    <Pen className="size-3" /> Edit
                  </Button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Intelligence Cards (matching popup dialog) ──

// TIER 1: CRITICAL
function ComplianceCard({ alert, onAskPetal, clientName }: { alert: typeof complianceAlerts[0]; onAskPetal: (q: string) => void; clientName: string }) {
  const [status, setStatus] = useState(alert.status);
  const [form8867Open, setForm8867Open] = useState(false);
  const { showToast } = useToast();
  const isForm8867 = alert.formRequired === "Form 8867";

  // Completed state — stays visible with green indicator
  if (status === "acknowledged" && isForm8867) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="mt-0.5 size-4 shrink-0 text-emerald-500" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Form 8867 Due Diligence</span>
              <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Complete</Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Completed {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}. Keep on file for IRS audit purposes.
            </p>
            <div className="mt-2">
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setForm8867Open(true)}>
                View completed form
              </Button>
            </div>
          </div>
        </div>
        {isForm8867 && (
          <Form8867Viewer clientName={clientName} clientId={alert.clientId} open={form8867Open} onOpenChange={setForm8867Open} />
        )}
      </div>
    );
  }

  if (status !== "pending") return null;

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
          clientId={alert.clientId}
          open={form8867Open}
          onOpenChange={setForm8867Open}
          onComplete={() => {
            setStatus("acknowledged");
            showToast("success", "Due diligence complete", `Form 8867 completed for ${clientName}`);
            setTimeout(() => setForm8867Open(true), 300);
          }}
        />
      )}
    </>
  );
}

// TIER 2: ATTENTION
function AnomalyCard({ alert, onAskPetal, clientName, onFlag }: { alert: typeof anomalyAlerts[0]; onAskPetal: (q: string) => void; clientName: string; onFlag?: (title: string, desc: string) => void }) {
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
        <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground ml-auto" onClick={() => onAskPetal(`Explain the ${alert.metric} anomaly for ${clientName}: ${alert.changePercent}% change`)}>
          Ask Petal
        </Button>
      </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// TIER 3: OPPORTUNITY
function DeductionCard({ suggestion, onAskPetal, clientName }: { suggestion: typeof deductionSuggestions[0]; onAskPetal: (q: string) => void; clientName: string }) {
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
        <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground ml-auto" onClick={() => onAskPetal(`Tell me about ${suggestion.deductionType} for ${clientName}`)}>
          Ask Petal
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


"use client";

import { useState } from "react";
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
  TrendingDown, Calculator, Brain, Download
} from "lucide-react";
import Link from "next/link";
import { clients, stageLabels, actionItems, getClientPaymentSummary } from "@/lib/mock-data";
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
  const { showToast } = useToast();
  let askDocket = (_q: string) => {};
  try { askDocket = useAIPanelAsk(); } catch {}

  if (!client) return <div className="text-muted-foreground">Client not found</div>;

  const currentStage = stageOverride || client.returnStage;
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
      {/* Action items */}
      {(filteredFeedActions.length > 0 || filteredActions.length > 0) && (
        <div className="space-y-4">
          <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Actions for {client.fullName.split(" ")[0]}</div>
          {filteredFeedActions.map(action => (
            <ActionCard key={action.id} action={action} onClick={() => { setSelectedAction(action); setSheetOpen(true); }} />
          ))}
          {filteredActions.filter(a => !filteredFeedActions.some(fa => fa.clientId === a.clientId && fa.title === a.title)).map(action => (
            <ActionDraftCard key={action.id} action={action} />
          ))}
        </div>
      )}

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

      {/* AI Intelligence */}
      {hasIntel && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Brain className="size-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Intelligence</span>
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-medium text-muted-foreground">Preview</Badge>
          </div>

          {/* Document Extractions */}
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

          {/* Compliance */}
          {clientCompliance.map(a => (
            <ComplianceCard key={a.id} alert={a} onAskDocket={(q) => askDocket(q)} clientName={client.fullName} />
          ))}
          {/* Anomalies */}
          {clientAnomalies.map(a => (
            <AnomalyCard key={a.id} alert={a} onAskDocket={(q) => askDocket(q)} clientName={client.fullName} />
          ))}
          {/* Deductions */}
          {clientDeductions.map(a => (
            <DeductionCard key={a.id} suggestion={a} onAskDocket={(q) => askDocket(q)} clientName={client.fullName} />
          ))}
          {/* Extensions */}
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
                    <span className="mt-0.5 size-1 shrink-0 rounded-full bg-muted-foreground" /> {f}
                  </div>
                ))}
              </div>
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
          {/* Billing */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Billing</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
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

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border p-2.5 flex items-center justify-between">
                  <div><div className="text-xs font-medium">Deposit</div><div className="text-[11px] text-muted-foreground">${ps.deposit?.amount || 50}</div></div>
                  {ps.deposit?.status === "paid" ? (
                    <Badge className="bg-emerald-100 text-emerald-700 text-[10px] dark:bg-emerald-900/50 dark:text-emerald-400">Paid {ps.deposit.paidDate && new Date(ps.deposit.paidDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</Badge>
                  ) : ps.deposit?.status === "overdue" ? (
                    <Badge variant="destructive" className="text-[10px]">Overdue</Badge>
                  ) : <Badge variant="secondary" className="text-[10px]">Pending</Badge>}
                </div>
                {ps.balance && ps.balance.status !== "not_applicable" && (
                  <div className="rounded-lg border p-2.5 flex items-center justify-between">
                    <div><div className="text-xs font-medium">Balance</div><div className="text-[11px] text-muted-foreground">${ps.balance.amount}</div></div>
                    {ps.balance.status === "paid" ? (
                      <Badge className="bg-emerald-100 text-emerald-700 text-[10px] dark:bg-emerald-900/50 dark:text-emerald-400">Paid {ps.balance.paidDate && new Date(ps.balance.paidDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</Badge>
                    ) : ps.balance.status === "sent" ? (
                      <Badge variant="secondary" className="text-[10px]">Invoice sent</Badge>
                    ) : <Badge variant="outline" className="text-[10px]">Not invoiced</Badge>}
                  </div>
                )}
              </div>

              {(() => {
                const events: { date: string; label: string; type: string }[] = [];
                if (ps.deposit?.paidDate) events.push({ date: ps.deposit.paidDate, label: `Deposit — $${ps.deposit.amount}`, type: "paid" });
                if (ps.deposit?.sentDate && ps.deposit.status !== "paid") events.push({ date: ps.deposit.sentDate, label: `Deposit invoice — $${ps.deposit.amount}`, type: ps.deposit.status === "overdue" ? "overdue" : "sent" });
                if (ps.balance?.paidDate) events.push({ date: ps.balance.paidDate, label: `Balance — $${ps.balance.amount}`, type: "paid" });
                if (ps.balance?.sentDate && ps.balance.status !== "paid") events.push({ date: ps.balance.sentDate, label: `Balance invoice — $${ps.balance.amount}`, type: ps.balance.status === "overdue" ? "overdue" : "sent" });
                events.sort((a, b) => a.date.localeCompare(b.date));
                if (events.length === 0) return null;
                return (
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Payment Timeline</div>
                    {events.map((e, i) => (
                      <div key={i} className="flex items-center gap-3 text-xs">
                        <div className={`size-2 shrink-0 rounded-full ${e.type === "paid" ? "bg-emerald-500" : e.type === "overdue" ? "bg-red-500" : "bg-muted-foreground/30"}`} />
                        <span className="text-muted-foreground">{new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        <span>{e.label}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {!ps.fullyPaid && (
                <div className="flex flex-wrap gap-2">
                  {ps.deposit?.status === "overdue" && (
                    sentBilling === "reminder"
                      ? <div className="flex items-center gap-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 text-xs font-medium text-emerald-700 animate-in fade-in slide-in-from-bottom-1 duration-300"><Check className="size-3.5" /> Reminder sent</div>
                      : <Button size="sm" onClick={() => setSentBilling("reminder")}><Send className="size-3.5" /> Send reminder</Button>
                  )}
                  {ps.balance?.status === "pending" && (
                    sentBilling === "invoice"
                      ? <div className="flex items-center gap-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 text-xs font-medium text-emerald-700 animate-in fade-in slide-in-from-bottom-1 duration-300"><Check className="size-3.5" /> Invoice sent</div>
                      : <Button size="sm" variant="outline" onClick={() => setSentBilling("invoice")}><DollarSign className="size-3.5" /> Send invoice</Button>
                  )}
                  {ps.balance?.status === "sent" && (
                    sentBilling === "resend"
                      ? <div className="flex items-center gap-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 text-xs font-medium text-emerald-700 animate-in fade-in slide-in-from-bottom-1 duration-300"><Check className="size-3.5" /> Invoice resent</div>
                      : <Button size="sm" variant="outline" onClick={() => setSentBilling("resend")}><Send className="size-3.5" /> Resend invoice</Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

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
              <div className={`rounded-xl border p-3 ${daysSinceSent > 3 ? "border-amber-200 bg-amber-50/30 dark:border-amber-900 dark:bg-amber-950/10" : ""}`}>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="size-4 text-muted-foreground" />
                  <span>Return sent <strong>{daysSinceSent} days ago</strong></span>
                  <span className="text-muted-foreground">·</span>
                  <span>Portal {lastLogin !== null ? (lastLogin === 0 ? "accessed today" : `accessed ${lastLogin}d ago`) : "never accessed"}</span>
                </div>
                {daysSinceSent > 3 && <p className="mt-1.5 text-xs text-amber-600">Review may be stale — consider sending a follow-up</p>}
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
      <ContextualActions stage={client.returnStage} onEroSign={() => setEroOpen(true)} onDownload={() => showToast("success", "Tax return downloaded", `${client.fullName} — 2025 Federal Return`)} />

      {/* Dialogs */}
      <ActionExecutionSheet action={selectedAction} open={sheetOpen} onOpenChange={setSheetOpen} />
      <ExtractionDialog extraction={selectedExtraction} open={!!selectedExtraction} onOpenChange={(open) => !open && setSelectedExtraction(null)} />
      <EroSignatureDialog client={client} open={eroOpen} onOpenChange={setEroOpen} />
    </div>
  );
}

// ── Intelligence Cards (matching popup dialog) ──

function ComplianceCard({ alert, onAskDocket, clientName }: { alert: typeof complianceAlerts[0]; onAskDocket: (q: string) => void; clientName: string }) {
  const [status, setStatus] = useState(alert.status);
  return (
    <div className={`rounded-xl border p-4 ${status === "acknowledged" ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-3">
        <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${alert.severity === "critical" ? "bg-red-100 dark:bg-red-900/50" : "bg-amber-100 dark:bg-amber-900/50"}`}>
          <AlertTriangle className={`size-4 ${alert.severity === "critical" ? "text-red-600" : "text-amber-600"}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{alert.title}</span>
            <Badge variant={alert.severity === "critical" ? "destructive" : "secondary"} className="text-[10px]">{alert.severity}</Badge>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{alert.description}</p>
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
          <Button size="sm" variant="ghost" className="ml-auto text-muted-foreground" onClick={() => onAskDocket(`Explain ${alert.title} compliance requirement for ${clientName}`)}><Brain className="size-3.5" /> Ask Docket</Button>
        </div>
      )}
    </div>
  );
}

function AnomalyCard({ alert, onAskDocket, clientName }: { alert: typeof anomalyAlerts[0]; onAskDocket: (q: string) => void; clientName: string }) {
  const [status, setStatus] = useState(alert.status);
  return (
    <div className={`rounded-xl border p-4 ${status !== "pending" ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
          <TrendingDown className="size-4 text-amber-600" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold">Year-over-year anomaly: {alert.metric}</div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-lg border p-2 text-center">
              <div className="font-display text-base tabular-nums">${(alert.priorYear / 1000).toFixed(0)}K</div>
              <div className="text-[10px] text-muted-foreground">2024</div>
            </div>
            <div className="rounded-lg border p-2 text-center">
              <div className="font-display text-base tabular-nums">${(alert.currentYear / 1000).toFixed(0)}K</div>
              <div className="text-[10px] text-muted-foreground">2025</div>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-center dark:border-red-900 dark:bg-red-950/30">
              <div className="font-display text-base tabular-nums text-red-600">{alert.changePercent}%</div>
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
          <Button size="sm" variant="ghost" className="ml-auto text-muted-foreground" onClick={() => onAskDocket(`Explain the ${alert.metric} anomaly for ${clientName}: ${alert.changePercent}% change`)}><Brain className="size-3.5" /> Ask Docket</Button>
        </div>
      )}
    </div>
  );
}

function DeductionCard({ suggestion, onAskDocket, clientName }: { suggestion: typeof deductionSuggestions[0]; onAskDocket: (q: string) => void; clientName: string }) {
  const [status, setStatus] = useState(suggestion.status);
  return (
    <div className={`rounded-xl border p-4 ${status !== "pending" ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
          <Calculator className="size-4 text-emerald-600" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold">{suggestion.deductionType}</div>
          <div className="text-xs text-muted-foreground">{suggestion.section}</div>
          <div className="mt-2 font-display text-xl tabular-nums tracking-tight text-emerald-600">~${suggestion.estimatedSavings.toLocaleString()} savings</div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{suggestion.description}</p>
        </div>
      </div>
      {status === "pending" && (
        <div className="mt-3 flex gap-2">
          <Button size="sm" onClick={() => setStatus("applied")}><Check className="size-3.5" /> Apply</Button>
          <Button size="sm" variant="outline" onClick={() => setStatus("dismissed")}><X className="size-3.5" /> Dismiss</Button>
          <Button size="sm" variant="ghost" className="ml-auto text-muted-foreground" onClick={() => onAskDocket(`Tell me about ${suggestion.deductionType} for ${clientName}`)}><Brain className="size-3.5" /> Ask Docket</Button>
        </div>
      )}
    </div>
  );
}

function ContextualActions({ stage, onEroSign, onDownload }: { stage: string; onEroSign: () => void; onDownload?: () => void }) {
  const actions: { icon: React.ReactNode; label: string; primary?: boolean; onClick?: () => void }[] = [];
  switch (stage) {
    case "new_intake":
      actions.push({ icon: <Send className="size-4" />, label: "Send Intake", primary: true });
      actions.push({ icon: <Send className="size-4" />, label: "Remind" });
      actions.push({ icon: <MessageSquare className="size-4" />, label: "Message" });
      actions.push({ icon: <Calendar className="size-4" />, label: "Schedule" });
      break;
    case "collecting_docs":
      actions.push({ icon: <FileText className="size-4" />, label: "Request Docs", primary: true });
      actions.push({ icon: <Send className="size-4" />, label: "Remind" });
      actions.push({ icon: <MessageSquare className="size-4" />, label: "Message" });
      actions.push({ icon: <ExternalLink className="size-4" />, label: "Portal" });
      break;
    case "ready_to_prep":
      actions.push({ icon: <FileText className="size-4" />, label: "Start Prep", primary: true });
      actions.push({ icon: <MessageSquare className="size-4" />, label: "Message" });
      actions.push({ icon: <Calendar className="size-4" />, label: "Schedule" });
      break;
    case "in_preparation":
      actions.push({ icon: <MessageSquare className="size-4" />, label: "Message" });
      actions.push({ icon: <Calendar className="size-4" />, label: "Schedule" });
      actions.push({ icon: <ExternalLink className="size-4" />, label: "Portal" });
      break;
    case "client_review":
      actions.push({ icon: <Send className="size-4" />, label: "Nudge", primary: true });
      actions.push({ icon: <MessageSquare className="size-4" />, label: "Message" });
      actions.push({ icon: <ExternalLink className="size-4" />, label: "Portal" });
      break;
    case "pay_and_sign":
      actions.push({ icon: <Shield className="size-4" />, label: "Sign as ERO", primary: true, onClick: onEroSign });
      actions.push({ icon: <DollarSign className="size-4" />, label: "Send Invoice" });
      actions.push({ icon: <MessageSquare className="size-4" />, label: "Message" });
      break;
    case "filed":
      actions.push({ icon: <MessageSquare className="size-4" />, label: "Message" });
      actions.push({ icon: <Calendar className="size-4" />, label: "Schedule" });
      actions.push({ icon: <Download className="size-4" />, label: "Download Return", onClick: onDownload });
      break;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((a, i) => (
        <Button key={i} size="sm" variant={a.primary ? "default" : "outline"} className="h-9" onClick={a.onClick}>
          {a.icon} {a.label}
        </Button>
      ))}
    </div>
  );
}

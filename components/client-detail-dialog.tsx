"use client";

import { useState } from "react";
import { type Client, stageLabels, actionItems, getClientPaymentSummary } from "@/lib/mock-data";
import { getThread, getClientDrafts, type ChatMessage as ChatMessageType } from "@/lib/messages-data";
import { AIDraftCard } from "@/components/messaging/ai-draft-card";
import { MessageInput } from "@/components/messaging/message-input";
import Link from "next/link";
import { useAIPanelAsk } from "@/components/ai-panel";
import {
  complianceAlerts, anomalyAlerts, deductionSuggestions,
  extensionPredictions, documentExtractions, estimatedTaxCalcs,
  feedActions, irsNotices,
  type DocumentExtraction,
} from "@/lib/actions-mock-data";
import { ExtractionDialog } from "@/components/documents/extraction-dialog";
import { getClientChecklist, getClientNotes, groupDocumentsByCategory } from "@/lib/documents-mock-data";
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
  TrendingDown, Sparkles, Calculator, X, Brain
} from "lucide-react";
import TrackingTimeline, { type TimelineItem } from "@/components/ui/tracking-timeline";
import { ActionDraftCard } from "@/components/action-draft-card";
import { ActionCard } from "@/components/actions/action-card";
import { EroSignatureDialog } from "@/components/ero-signature-dialog";
import { UploadZone } from "@/components/documents/upload-zone";
import { DocumentChecklist } from "@/components/documents/document-checklist";
import { DocumentGroup } from "@/components/documents/document-group";

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

interface ClientDetailDialogProps {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClientDetailDialog({ client, open, onOpenChange }: ClientDetailDialogProps) {
  const [eroOpen, setEroOpen] = useState(false);
  const [selectedExtraction, setSelectedExtraction] = useState<DocumentExtraction | null>(null);
  let askDocket = (_q: string) => {};
  try { askDocket = useAIPanelAsk(); } catch {}

  if (!client) return null;

  const docPercent = Math.round((client.documentsSubmitted / client.documentsRequired) * 100);
  const stageIndex = ['new_intake', 'collecting_docs', 'ready_to_prep', 'in_preparation', 'client_review', 'pay_and_sign', 'filed'].indexOf(client.returnStage);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-3xl p-0">
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
          </div>
        </div>

        {/* Tabbed content */}
        <div className="overflow-y-auto" style={{ maxHeight: "calc(90vh - 120px)" }}>
          <Tabs defaultValue="overview" className="px-6 pt-2 pb-6">
            <TabsList variant="line" className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="space-y-5">
              {/* Feed actions (same as full page) */}
              {clientFeedActions.length > 0 && (
                <div className="space-y-2">
                  {clientFeedActions.map(action => (
                    <ActionCard key={action.id} action={action} onClick={() => {}} />
                  ))}
                </div>
              )}

              {/* Actions (exclude signature actions — handled by dedicated ERO section below) */}
              {clientActions.filter(a => a.type !== "signature_needed").length > 0 && clientFeedActions.length === 0 && (
                <div className="space-y-2">
                  {clientActions.filter(a => a.type !== "signature_needed").map(action => <ActionDraftCard key={action.id} action={action} />)}
                </div>
              )}

              {/* Ready to Prep — confirm all docs received and begin preparation */}
              {client.returnStage === "ready_to_prep" && (
                <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-4">
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
                  <Button className="mt-3 w-full">
                    <FileText className="size-3.5" /> Begin Preparation
                  </Button>
                </div>
              )}

              {/* Collecting Docs — show progress */}
              {client.returnStage === "collecting_docs" && client.documentsSubmitted < client.documentsRequired && (
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
              {client.returnStage === "pay_and_sign" && (
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
                    <Brain className="size-4 text-primary" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Docket Intelligence</span>
                  </div>

                  {/* Document Extractions — OCR to OLT (hero feature) */}
                  {clientExtractions.length > 0 && (
                    <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/[0.04] to-transparent p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                          <Sparkles className="size-4 text-primary" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold">AI-Extracted Documents</div>
                          <div className="text-[11px] text-muted-foreground">Review extracted fields, then push directly to OLT</div>
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
                      <Button size="sm" className="mt-3"><Calculator className="size-3.5" /> Send to client</Button>
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

            {/* DOCUMENTS TAB */}
            <TabsContent value="documents" className="space-y-5">
              <UploadZone clientName={client.fullName.split(" ")[0]} />

              {/* Document summary for this client */}
              <div className="rounded-xl border p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold">Document Status</span>
                  <span className="text-xs text-muted-foreground">{client.documentsSubmitted} of {client.documentsRequired} received</span>
                </div>
                <Progress value={docPercent} className="h-2 mb-3" indicatorColor={docPercent >= 100 ? "bg-emerald-500" : undefined} />
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2"><CheckCircle className="size-3 text-emerald-500" /> <span>{client.documentsSubmitted} received</span></div>
                  <div className="flex items-center gap-2"><Clock className="size-3 text-amber-500" /> <span>{client.documentsRequired - client.documentsSubmitted} outstanding</span></div>
                </div>
              </div>

              {checklist.length > 0 && <DocumentChecklist items={checklist} />}
              {docGroups.length > 0 && (
                <div className="space-y-4">
                  {docGroups.map(g => <DocumentGroup key={g.category} label={g.label} docs={g.docs} missing={g.missing} />)}
                </div>
              )}

              {/* Filed clients - show success banner but keep docs accessible */}
              {client.returnStage === "filed" && (
                <div className="rounded-xl border bg-emerald-50/50 p-3 dark:bg-emerald-950/10">
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700"><CheckCircle className="size-4" /> Return filed and accepted</div>
                  <p className="mt-1 text-xs text-muted-foreground">All documents retained for audit support and next year's filing.</p>
                </div>
              )}

              {/* Auto-generate doc list for clients without explicit checklist data */}
              {checklist.length === 0 && docGroups.length === 0 && client.documentsSubmitted > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Documents on file</div>
                  <GeneratedDocList client={client} />
                </div>
              )}
              {checklist.length === 0 && docGroups.length === 0 && client.documentsSubmitted === 0 && client.returnStage !== "filed" && (
                <div className="py-4 text-center text-sm text-muted-foreground">No documents uploaded yet. Send the intake form to get started.</div>
              )}
            </TabsContent>

            {/* MESSAGES TAB */}
            <TabsContent value="messages">
              <ClientMessagesInline clientId={client.id} clientAvatar={client.avatar} clientName={client.fullName} />
            </TabsContent>

            {/* BILLING TAB */}
            <TabsContent value="billing" className="space-y-4">
              <BillingTab client={client} />
            </TabsContent>

            {/* NOTES TAB */}
            <TabsContent value="notes" className="space-y-3">
              {notes.length > 0 ? notes.map(n => (
                <div key={n.id} className="rounded-xl border p-3">
                  <p className="text-sm leading-relaxed">{n.content}</p>
                  <div className="mt-2 text-xs text-muted-foreground">{new Date(n.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                </div>
              )) : (
                <div className="py-8 text-center text-sm text-muted-foreground">No notes yet.</div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>

      <EroSignatureDialog client={client} open={eroOpen} onOpenChange={setEroOpen} />
      <ExtractionDialog extraction={selectedExtraction} open={!!selectedExtraction} onOpenChange={(o) => !o && setSelectedExtraction(null)} />
    </Dialog>
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
    <div className="space-y-3">
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
      <MessageInput
        placeholder={`Message ${clientName.split(" ")[0]}...`}
        value={input}
        onChange={setInput}
        onSend={(text) => { sendMsg(text); setInput(""); }}
      />
    </div>
  );
}

// ── Inline Intelligence Cards ──

function InlineComplianceCard({ alert, onAskDocket, clientName }: { alert: typeof complianceAlerts[0]; onAskDocket: (q: string) => void; clientName: string }) {
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

function InlineAnomalyCard({ alert, onAskDocket, clientName }: { alert: typeof anomalyAlerts[0]; onAskDocket: (q: string) => void; clientName: string }) {
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

function InlineDeductionCard({ suggestion, onAskDocket, clientName }: { suggestion: typeof deductionSuggestions[0]; onAskDocket: (q: string) => void; clientName: string }) {
  const [status, setStatus] = useState(suggestion.status);
  return (
    <div className={`rounded-xl border p-4 ${status !== "pending" ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
          <Sparkles className="size-4 text-emerald-600" />
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
          <Button size="sm" variant="ghost" className="ml-auto text-muted-foreground" onClick={() => onAskDocket(`Tell me about ${suggestion.deductionType} for ${clientName}: ${suggestion.description}`)}><Brain className="size-3.5" /> Ask Docket</Button>
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
    <div className="rounded-xl border p-4">
      <div className="flex items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/50">
          <Mail className="size-4 text-red-600" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold">{notice.noticeType} Notice</div>
          <div className="text-xs text-muted-foreground">Received {notice.receivedDate}</div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{notice.summary}</p>
        </div>
      </div>
      <Separator className="my-3" />
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2">AI-drafted response</div>
      {editing ? (
        <div>
          <textarea value={draft} onChange={e => setDraft(e.target.value)} className="w-full min-h-[100px] rounded-lg border bg-background p-2 text-xs font-mono outline-none resize-none" />
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
    </div>
  );
}

// ── Billing Tab ──
function BillingTab({ client }: { client: Client }) {
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
          {ps.deposit?.status === "overdue" && <Button size="sm"><Send className="size-3.5" /> Send payment reminder</Button>}
          {ps.balance?.status === "pending" && <Button size="sm" variant="outline"><DollarSign className="size-3.5" /> Send invoice</Button>}
          {ps.balance?.status === "sent" && <Button size="sm" variant="outline"><Send className="size-3.5" /> Resend invoice</Button>}
        </div>
      )}
    </div>
  );
}

// ── Contextual Actions by Stage ──
function ContextualActions({ stage, onEroSign }: { stage: string; onEroSign: () => void }) {
  const actions: { icon: React.ReactNode; label: string; primary?: boolean; onClick?: () => void }[] = [];

  switch (stage) {
    case "new_intake":
      actions.push({ icon: <Send className="size-3.5" />, label: "Send Intake", primary: true });
      actions.push({ icon: <Send className="size-3.5" />, label: "Remind" });
      actions.push({ icon: <MessageSquare className="size-3.5" />, label: "Message" });
      actions.push({ icon: <Calendar className="size-3.5" />, label: "Schedule" });
      break;
    case "collecting_docs":
      actions.push({ icon: <FileText className="size-3.5" />, label: "Request Docs", primary: true });
      actions.push({ icon: <Send className="size-3.5" />, label: "Remind" });
      actions.push({ icon: <MessageSquare className="size-3.5" />, label: "Message" });
      actions.push({ icon: <ExternalLink className="size-3.5" />, label: "Portal" });
      break;
    case "ready_to_prep":
      actions.push({ icon: <FileText className="size-3.5" />, label: "Start Prep", primary: true });
      actions.push({ icon: <MessageSquare className="size-3.5" />, label: "Message" });
      actions.push({ icon: <Calendar className="size-3.5" />, label: "Schedule" });
      break;
    case "in_preparation":
      actions.push({ icon: <MessageSquare className="size-3.5" />, label: "Message" });
      actions.push({ icon: <Calendar className="size-3.5" />, label: "Schedule" });
      actions.push({ icon: <ExternalLink className="size-3.5" />, label: "Portal" });
      break;
    case "client_review":
      actions.push({ icon: <Send className="size-3.5" />, label: "Nudge", primary: true });
      actions.push({ icon: <MessageSquare className="size-3.5" />, label: "Message" });
      actions.push({ icon: <ExternalLink className="size-3.5" />, label: "Portal" });
      break;
    case "pay_and_sign":
      actions.push({ icon: <Shield className="size-3.5" />, label: "Sign as ERO", primary: true, onClick: onEroSign });
      actions.push({ icon: <DollarSign className="size-3.5" />, label: "Send Invoice" });
      actions.push({ icon: <MessageSquare className="size-3.5" />, label: "Message" });
      break;
    case "filed":
      actions.push({ icon: <MessageSquare className="size-3.5" />, label: "Message" });
      actions.push({ icon: <Calendar className="size-3.5" />, label: "Schedule" });
      actions.push({ icon: <Download className="size-3.5" />, label: "Return" });
      break;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((a, i) => (
        <Button key={i} size="sm" variant={a.primary ? "default" : "outline"} className="h-8 text-xs" onClick={a.onClick}>
          {a.icon} {a.label}
        </Button>
      ))}
    </div>
  );
}

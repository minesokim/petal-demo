"use client";

import { useState } from "react";
import { type Client, stageLabels, actionItems } from "@/lib/mock-data";
import Link from "next/link";
import { useAIPanelAsk } from "@/components/ai-panel";
import {
  complianceAlerts, anomalyAlerts, deductionSuggestions,
  extensionPredictions, documentExtractions, estimatedTaxCalcs,
  feedActions
} from "@/lib/actions-mock-data";
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
  CheckCircle, AlertTriangle, ArrowUpRight, ChevronRight
} from "lucide-react";
import TrackingTimeline, { type TimelineItem } from "@/components/ui/tracking-timeline";
import { ActionDraftCard } from "@/components/action-draft-card";
import { ActionCard } from "@/components/actions/action-card";
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

  const clientActions = actionItems.filter(a => a.clientId === client.id && !a.isResolved);
  const clientCompliance = complianceAlerts.filter(a => a.clientId === client.id);
  const clientAnomalies = anomalyAlerts.filter(a => a.clientId === client.id);
  const clientDeductions = deductionSuggestions.filter(a => a.clientId === client.id);
  const clientExtensions = extensionPredictions.filter(a => a.clientId === client.id);
  const clientExtractions = documentExtractions.filter(a => a.clientId === client.id);
  const hasIntel = clientCompliance.length + clientAnomalies.length + clientDeductions.length + clientExtensions.length + clientExtractions.length > 0;

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
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="space-y-5">
              {/* Actions */}
              {clientActions.length > 0 && (
                <div className="space-y-2">
                  {clientActions.map(action => <ActionDraftCard key={action.id} action={action} />)}
                </div>
              )}

              {/* AI Insights */}
              {hasIntel && (
                <div className="space-y-2">
                  <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">AI Insights</div>
                  {clientCompliance.map(a => (
                    <button key={a.id} onClick={() => { onOpenChange(false); setTimeout(() => askDocket(`Tell me about ${a.title} for ${client.fullName}`), 300); }} className="flex w-full items-start gap-2 rounded-xl border p-3 text-left transition-colors hover:bg-muted/50">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-500" />
                      <div className="flex-1"><div className="text-sm font-semibold">{a.title}</div><p className="mt-0.5 text-xs text-muted-foreground">{a.description}</p></div>
                      <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    </button>
                  ))}
                  {clientAnomalies.map(a => (
                    <button key={a.id} onClick={() => { onOpenChange(false); setTimeout(() => askDocket(`Explain the ${a.metric} anomaly for ${client.fullName}`), 300); }} className="flex w-full items-start gap-2 rounded-xl border p-3 text-left transition-colors hover:bg-muted/50">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
                      <div className="flex-1"><div className="text-sm font-semibold">{a.metric}: {a.changePercent}% change</div><p className="mt-0.5 text-xs text-muted-foreground">{a.aiExplanation}</p></div>
                      <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    </button>
                  ))}
                  {clientDeductions.map(a => (
                    <button key={a.id} onClick={() => { onOpenChange(false); setTimeout(() => askDocket(`Tell me about ${a.deductionType} for ${client.fullName}`), 300); }} className="flex w-full items-start gap-2 rounded-xl border p-3 text-left transition-colors hover:bg-muted/50">
                      <CheckCircle className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                      <div className="flex-1"><div className="text-sm font-semibold">{a.deductionType} ({a.section})</div><p className="mt-0.5 text-xs text-muted-foreground">~${a.estimatedSavings.toLocaleString()} savings</p></div>
                      <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    </button>
                  ))}
                  {clientExtensions.map(a => (
                    <button key={a.id} onClick={() => { onOpenChange(false); setTimeout(() => askDocket(`${client.fullName} extension likelihood: ${a.probability}%`), 300); }} className="flex w-full items-start gap-2 rounded-xl border p-3 text-left transition-colors hover:bg-muted/50">
                      <Clock className="mt-0.5 size-4 shrink-0 text-amber-500" />
                      <div className="flex-1"><div className="text-sm font-semibold">Extension: {a.probability}%</div><p className="mt-0.5 text-xs text-muted-foreground">{a.factors.join(", ")}</p></div>
                      <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}

              {/* Stats + Timeline */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Return Status</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-4 gap-2">
                      <div className="rounded-lg border p-2 text-center"><div className="font-display text-base tabular-nums">{client.documentsSubmitted}/{client.documentsRequired}</div><div className="text-[9px] text-muted-foreground">Docs</div></div>
                      <div className="rounded-lg border p-2 text-center"><div className="font-display text-base tabular-nums">${client.feeAmount}</div><div className="text-[9px] text-muted-foreground">Fee</div></div>
                      <div className="rounded-lg border p-2 text-center"><div className="font-display text-base tabular-nums">{client.depositPaid ? "Paid" : "No"}</div><div className="text-[9px] text-muted-foreground">Deposit</div></div>
                      <div className="rounded-lg border p-2 text-center"><div className="font-display text-base tabular-nums">{docPercent}%</div><div className="text-[9px] text-muted-foreground">Done</div></div>
                    </div>
                    <Progress value={docPercent} className="h-1.5" />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Return Progress</CardTitle></CardHeader>
                  <CardContent><TrackingTimeline items={timelineItems} /></CardContent>
                </Card>
              </div>

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

              {/* Notes */}
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-sm leading-relaxed text-muted-foreground">{client.notes}</p>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
                <Button variant="outline" size="sm" className="h-auto flex-col gap-1 py-2"><Send className="size-3.5" /><span className="text-[10px]">Remind</span></Button>
                <Button variant="outline" size="sm" className="h-auto flex-col gap-1 py-2"><FileText className="size-3.5" /><span className="text-[10px]">Request</span></Button>
                <Button variant="outline" size="sm" className="h-auto flex-col gap-1 py-2"><MessageSquare className="size-3.5" /><span className="text-[10px]">Message</span></Button>
                <Button variant="outline" size="sm" className="h-auto flex-col gap-1 py-2"><Calendar className="size-3.5" /><span className="text-[10px]">Schedule</span></Button>
                <Button variant="outline" size="sm" className="h-auto flex-col gap-1 py-2"><ExternalLink className="size-3.5" /><span className="text-[10px]">Portal</span></Button>
                <Button variant="outline" size="sm" className="h-auto flex-col gap-1 py-2"><Pen className="size-3.5" /><span className="text-[10px]">Edit</span></Button>
              </div>
            </TabsContent>

            {/* DOCUMENTS TAB */}
            <TabsContent value="documents" className="space-y-5">
              <UploadZone clientName={client.fullName.split(" ")[0]} />
              {checklist.length > 0 && <DocumentChecklist items={checklist} />}
              {docGroups.length > 0 && (
                <div className="space-y-4">
                  {docGroups.map(g => <DocumentGroup key={g.category} label={g.label} docs={g.docs} missing={g.missing} />)}
                </div>
              )}
              {checklist.length === 0 && docGroups.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">No documents yet.</div>
              )}
            </TabsContent>

            {/* MESSAGES TAB */}
            <TabsContent value="messages">
              <div className="py-8 text-center text-sm text-muted-foreground">
                <Link href={`/dashboard/clients/${client.id}/messages`} className="text-primary hover:underline">Open full message thread</Link>
              </div>
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
    </Dialog>
  );
}

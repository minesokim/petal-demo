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
  CheckCircle, AlertTriangle, ArrowUpRight, ChevronRight, Download
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
                    <Progress value={docPercent} className="h-1.5" indicatorColor={docPercent >= 100 ? "bg-emerald-500" : undefined} />
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

// Inline messages component for the dialog
const messageThreads: Record<string, { id: string; sender: "client" | "preparer"; content: string; time: string }[]> = {
  c2: [
    { id: "1", sender: "client", content: "Hi Antonio! I have my TikTok 1099 but I'm not sure how to upload it.", time: "2:30 PM" },
    { id: "2", sender: "preparer", content: "Hey Priya! Log into your portal and go to the Docs tab. You can take a photo of the 1099 with your phone too.", time: "2:45 PM" },
    { id: "3", sender: "client", content: "Do I need to report the $500 I made from a one-time sponsored post?", time: "2:52 PM" },
    { id: "4", sender: "preparer", content: "Yes, all income needs to be reported even without a 1099. We'll include it on your Schedule C.", time: "3:10 PM" },
  ],
  c3: [
    { id: "1", sender: "client", content: "Are our returns done?", time: "Mar 25" },
    { id: "2", sender: "preparer", content: "Yes! I just need you and Sofia to sign Form 8879 to authorize e-filing.", time: "Mar 26" },
    { id: "3", sender: "client", content: "We're ready to sign whenever you are!", time: "7:45 AM" },
  ],
  c4: [
    { id: "1", sender: "preparer", content: "Hi DeShawn! Welcome. I've sent your intake form - just follow the link.", time: "Mar 18" },
    { id: "2", sender: "client", content: "Thanks! I'll try to get to it this weekend.", time: "Mar 20" },
    { id: "3", sender: "preparer", content: "We still need your W-2 and the $50 deposit. April 15 is coming up.", time: "Mar 22" },
  ],
  c11: [
    { id: "1", sender: "preparer", content: "David, your S-Corp return is coming along. Can we schedule a call about the payroll summary?", time: "Mar 25" },
    { id: "2", sender: "client", content: "Sure! How about Thursday at 2pm?", time: "Mar 26" },
    { id: "3", sender: "client", content: "Can we push to 3pm? Got a patient emergency.", time: "8:15 AM" },
    { id: "4", sender: "preparer", content: "Of course. Moved to 3pm. Hope everything is okay!", time: "8:30 AM" },
  ],
  c15: [
    { id: "1", sender: "client", content: "Elena wants to know if we can deduct the new paint booth equipment.", time: "Mar 27" },
    { id: "2", sender: "preparer", content: "Yes! Section 179 immediate expensing. Full deduction in 2025 instead of 7 years. How much was it?", time: "Mar 27" },
    { id: "3", sender: "client", content: "About $32,000. That would be a big deduction!", time: "Mar 27" },
    { id: "4", sender: "preparer", content: "Should save roughly $8,200 in taxes. Numbers ready for our review Monday.", time: "Mar 27" },
  ],
  c1: [
    { id: "1", sender: "client", content: "All 3 restaurant P&Ls have been uploaded.", time: "Mar 27" },
    { id: "2", sender: "preparer", content: "Got them, thanks Marcus! We'll go over it in our call on the 30th.", time: "Mar 27" },
  ],
};

function ClientMessagesInline({ clientId, clientAvatar, clientName }: { clientId: string; clientAvatar: string; clientName: string }) {
  const thread = messageThreads[clientId];
  const [input, setInput] = useState("");

  if (!thread) {
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
      <div className="flex items-center gap-2 pt-2">
        <input placeholder={`Message ${clientName.split(" ")[0]}...`} value={input} onChange={e => setInput(e.target.value)} className="flex-1 rounded-lg border bg-background px-3 py-2 text-xs outline-none" />
        <Button size="sm" className="h-8"><Send className="size-3" /></Button>
      </div>
    </div>
  );
}

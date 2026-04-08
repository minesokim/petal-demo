"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Search, ChevronRight, ChevronDown, FileText, Users } from "lucide-react";
import { clients } from "@/lib/mock-data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { DonutChart, type DonutChartSegment } from "@/components/ui/donut-chart";
import { motion, AnimatePresence } from "motion/react";
import { DocumentRow } from "@/components/documents/document-row";
import { MissingDocRow } from "@/components/documents/missing-doc-row";
import { DocTypeBadge } from "@/components/documents/doc-type-badge";
import { BulkReminderPanel } from "@/components/documents/bulk-reminder-panel";
import {
  mockDocuments, checklistItems, firmDocuments,
  getDocumentsByDay, getUnviewedCount, getMissingCount,
  type MockDocument
} from "@/lib/documents-mock-data";

const docStatusData: DonutChartSegment[] = [
  { value: 142, color: "hsl(142.1 76.2% 36.3%)", label: "Received" },
  { value: 34, color: "hsl(0 84.2% 60.2%)", label: "Missing" },
  { value: 18, color: "hsl(47.9 95.8% 53.1%)", label: "Pending" },
  { value: 8, color: "hsl(214.7 95% 50%)", label: "Processing" },
];
const docTotal = docStatusData.reduce((s, d) => s + d.value, 0);

function DocumentStatusWidget() {
  const [hovered, setHovered] = useState<string | null>(null);
  const active = docStatusData.find((d) => d.label === hovered);
  const displayValue = active?.value ?? docTotal;
  const displayLabel = active?.label ?? "Total";

  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col gap-1">
        {docStatusData.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5" onMouseEnter={() => setHovered(s.label)} onMouseLeave={() => setHovered(null)}>
            <span className="size-1.5 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-[10px] text-muted-foreground">{s.label}: <span className="font-medium text-foreground">{s.value}</span></span>
          </div>
        ))}
      </div>
      <DonutChart
        data={docStatusData}
        size={96}
        strokeWidth={14}
        animationDuration={0.8}
        highlightOnHover
        onSegmentHover={(seg) => setHovered(seg?.label ?? null)}
        centerContent={
          <div className="flex flex-col items-center">
            <AnimatePresence mode="wait">
              <motion.span
                key={`${displayValue}-${displayLabel}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="font-display text-sm tracking-tight tabular-nums"
              >
                {displayValue}
              </motion.span>
            </AnimatePresence>
          </div>
        }
      />
    </div>
  );
}

// Collapsible group for "By client" view
function ClientDocGroup({ group, defaultOpen }: {
  group: { name: string; avatar: string; clientId: string; docs: MockDocument[]; submitted: number; required: number };
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const pct = group.required > 0 ? Math.round((group.submitted / group.required) * 100) : 100;
  const isMissing = group.submitted < group.required;

  return (
    <Card>
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30">
        <Avatar className="size-7">
          <AvatarImage src={group.avatar} />
          <AvatarFallback className="text-[10px]">{group.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold truncate">{group.name}</span>
            <span className="text-[10px] text-muted-foreground tabular-nums">{group.submitted}/{group.required}</span>
            {isMissing && <Progress value={pct} className="h-1 w-16" />}
          </div>
        </div>
        <span className="text-[10px] text-muted-foreground">{group.docs.length} files</span>
        <ChevronDown className={`size-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <CardContent className="divide-y border-t p-0">
          {group.docs.map(doc => <DocumentRow key={doc.id} doc={doc} showDate />)}
        </CardContent>
      )}
    </Card>
  );
}

// Collapsible group for "By type" view
function TypeDocGroup({ typeKey, label, docs, defaultOpen }: {
  typeKey: string; label: string; docs: MockDocument[]; defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card>
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30">
        <DocTypeBadge type={typeKey} />
        <div className="flex-1">
          <span className="text-sm font-semibold">{label}</span>
        </div>
        <span className="text-[10px] text-muted-foreground">{docs.length}</span>
        <ChevronDown className={`size-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <CardContent className="divide-y border-t p-0">
          {docs.sort((a, b) => a.clientName.localeCompare(b.clientName)).map(doc => <DocumentRow key={doc.id} doc={doc} showDate />)}
        </CardContent>
      )}
    </Card>
  );
}

export default function DocumentsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"recent" | "client" | "type">("recent");

  const unviewedCount = getUnviewedCount();
  const missingCount = getMissingCount();
  const docsByDay = getDocumentsByDay();
  const missingItems = checklistItems.filter(c => !c.received).sort((a, b) => b.daysSinceRequested - a.daysSinceRequested);

  const allDocsFiltered = mockDocuments
    .filter(d => {
      if (search) {
        const q = search.toLowerCase();
        return d.fileName.toLowerCase().includes(q) || d.clientName.toLowerCase().includes(q) || d.docType.toLowerCase().includes(q);
      }
      return true;
    })
    .filter(d => typeFilter === "all" || d.docType === typeFilter)
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display tracking-tight">Documents</h1>
          <p className="text-muted-foreground text-sm">Manage documents across all clients</p>
        </div>
        <DocumentStatusWidget />
      </div>

      <Tabs defaultValue="inbox">
        <TabsList variant="line">
          <TabsTrigger value="inbox">
            Inbox
            {unviewedCount > 0 && <Badge variant="secondary" className="ml-1.5 text-[10px]">{unviewedCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="missing">
            Missing
            <Badge variant="secondary" className="ml-1.5 text-[10px]">{missingCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="all">All docs</TabsTrigger>
          <TabsTrigger value="firm">Firm files</TabsTrigger>
        </TabsList>

        {/* INBOX */}
        <TabsContent value="inbox" className="mt-4 space-y-4">
          {Object.entries(docsByDay).map(([day, docs]) => (
            <div key={day}>
              <div className="text-muted-foreground mb-1 text-xs font-semibold uppercase tracking-wider">{day}</div>
              <Card>
                <CardContent className="divide-y p-0">
                  {docs.map(doc => <DocumentRow key={doc.id} doc={doc} showNew showClassification />)}
                </CardContent>
              </Card>
            </div>
          ))}
        </TabsContent>

        {/* MISSING */}
        <TabsContent value="missing" className="mt-4 space-y-4">
          {/* Bulk Reminders Panel */}
          <BulkReminderPanel />

          {/* AI Summary Header */}
          {(() => {
            const criticalDocs = missingItems.filter(i => i.daysSinceRequested >= 7);
            const attentionDocs = missingItems.filter(i => i.daysSinceRequested >= 3 && i.daysSinceRequested < 7);
            const uniqueClients = new Set(missingItems.map(i => i.clientId)).size;
            const blockingReturns = missingItems.filter(i => {
              const client = clients.find(c => c.id === i.clientId);
              return client && client.returnStage === "collecting_docs" && i.required;
            }).length;

            return (
              <Card className="bg-muted/30 border-dashed">
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-red-500" />
                        <span className="text-sm"><span className="font-semibold">{criticalDocs.length}</span> critical</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-amber-500" />
                        <span className="text-sm"><span className="font-semibold">{attentionDocs.length}</span> attention</span>
                      </div>
                      <Separator orientation="vertical" className="h-4" />
                      <span className="text-sm text-muted-foreground">
                        {missingCount} docs from {uniqueClients} clients
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Sorted by urgency
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* Priority-sorted missing docs */}
          <Card>
            <CardContent className="divide-y p-0">
              {/* Sort by priority: critical (7+ days) > attention (3-6 days) > recent */}
              {[...missingItems]
                .sort((a, b) => {
                  // First by urgency tier
                  const aUrgency = a.daysSinceRequested >= 7 ? 0 : a.daysSinceRequested >= 3 ? 1 : 2;
                  const bUrgency = b.daysSinceRequested >= 7 ? 0 : b.daysSinceRequested >= 3 ? 1 : 2;
                  if (aUrgency !== bUrgency) return aUrgency - bUrgency;
                  // Then by days since requested (longer = more urgent)
                  return b.daysSinceRequested - a.daysSinceRequested;
                })
                .map(item => <MissingDocRow key={item.id} item={item} />)}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ALL DOCS — 3 view modes */}
        <TabsContent value="all" className="mt-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
              <Input
                placeholder="Search documents, clients, types..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex rounded-lg border bg-muted/30 p-0.5">
              {(["recent", "client", "type"] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setViewMode(v)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                    viewMode === v
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {v === "recent" ? "Recent" : v === "client" ? "By client" : "By type"}
                </button>
              ))}
            </div>
          </div>

          {/* Recent view (default) */}
          {viewMode === "recent" && (
            <Card>
              <CardContent className="divide-y p-0">
                {allDocsFiltered.map(doc => <DocumentRow key={doc.id} doc={doc} showDate />)}
                {allDocsFiltered.length === 0 && (
                  <div className="py-12 text-center text-sm text-muted-foreground">No documents found</div>
                )}
              </CardContent>
            </Card>
          )}

          {/* By client view */}
          {viewMode === "client" && (() => {
            const clientGroups = new Map<string, { name: string; avatar: string; clientId: string; docs: typeof allDocsFiltered; submitted: number; required: number }>();
            allDocsFiltered.forEach(doc => {
              if (!clientGroups.has(doc.clientId)) {
                const c = clients.find(cl => cl.id === doc.clientId);
                clientGroups.set(doc.clientId, {
                  name: doc.clientName, avatar: doc.clientAvatar, clientId: doc.clientId,
                  docs: [], submitted: c?.documentsSubmitted ?? 0, required: c?.documentsRequired ?? 0,
                });
              }
              clientGroups.get(doc.clientId)!.docs.push(doc);
            });
            // Sort: missing docs first, then recent uploads, then complete
            const sorted = [...clientGroups.values()].sort((a, b) => {
              const aMissing = a.required - a.submitted;
              const bMissing = b.required - b.submitted;
              if (aMissing !== bMissing) return bMissing - aMissing; // more missing = first
              return b.docs.length - a.docs.length;
            });

            return sorted.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">No documents found</div>
            ) : (
              <div className="space-y-2">
                {sorted.map((group, i) => (
                  <ClientDocGroup key={group.clientId} group={group} defaultOpen={i < 4} />
                ))}
              </div>
            );
          })()}

          {/* By type view */}
          {viewMode === "type" && (() => {
            const typeGroups = new Map<string, { label: string; docs: typeof allDocsFiltered }>();
            const typeOrder = ["W2", "1099", "K1", "EXP", "RET", "ID", "AGR"];
            allDocsFiltered.forEach(doc => {
              const key = doc.docTypeLabel;
              if (!typeGroups.has(key)) typeGroups.set(key, { label: key, docs: [] });
              typeGroups.get(key)!.docs.push(doc);
            });
            const sorted = [...typeGroups.entries()].sort((a, b) => {
              const ai = typeOrder.indexOf(a[0]); const bi = typeOrder.indexOf(b[0]);
              return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
            });

            const typeLabels: Record<string, string> = {
              W2: "W-2s", "1099": "1099s", K1: "K-1s", EXP: "Business Expenses",
              RET: "Tax Returns", ID: "Identity Documents", AGR: "Agreements",
            };

            return sorted.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">No documents found</div>
            ) : (
              <div className="space-y-2">
                {sorted.map(([key, group], i) => (
                  <TypeDocGroup key={key} typeKey={key} label={typeLabels[key] || key} docs={group.docs} defaultOpen={i < 4} />
                ))}
              </div>
            );
          })()}
        </TabsContent>

        {/* FIRM FILES */}
        <TabsContent value="firm" className="mt-4">
          <div className="grid gap-3 md:grid-cols-2">
            {firmDocuments.map(doc => (
              <Card key={doc.id} className="cursor-pointer transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                    <FileText className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{doc.name}</div>
                    <div className="text-muted-foreground text-xs">{doc.description}</div>
                    <div className="text-muted-foreground mt-0.5 text-[10px]">Last edited {new Date(doc.lastEdited).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                  </div>
                  <ChevronRight className="text-muted-foreground size-4 shrink-0" />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

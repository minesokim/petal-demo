"use client";

import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronRight, ChevronDown, FileText, X, AlertTriangle, BotIcon, Send, Check } from "lucide-react";
import { DocumentViewerDialog } from "@/components/documents/document-viewer-dialog";
import { clients } from "@/lib/mock-data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { DocumentRow } from "@/components/documents/document-row";
import { MissingDocRow } from "@/components/documents/missing-doc-row";
import { DocTypeBadge } from "@/components/documents/doc-type-badge";
import {
  mockDocuments, checklistItems, firmDocuments,
  getDocumentsByDay, getUnviewedCount, getMissingCount,
  getIntelligenceForDocument,
  type MockDocument
} from "@/lib/documents-mock-data";
import { useToast } from "@/components/ui/toast-notification";

// Stat data
const docStatusData: { value: number; color: string; label: string }[] = [
  { value: 142, color: "hsl(142.1 76.2% 36.3%)", label: "Received" },
  { value: 34, color: "hsl(0 84.2% 60.2%)", label: "Missing" },
  { value: 18, color: "hsl(47.9 95.8% 53.1%)", label: "Pending" },
  { value: 8, color: "hsl(214.7 95% 50%)", label: "Processing" },
];
const docTotal = docStatusData.reduce((s, d) => s + d.value, 0);

// ───────────────────────────────────────────────
// Stat Bar (clickable)
// ───────────────────────────────────────────────
function StatBar({ onStatClick }: { onStatClick: (tab: string) => void }) {
  return (
    <div className="flex items-center gap-1">
      {docStatusData.map((s) => (
        <button
          key={s.label}
          onClick={() => {
            if (s.label === "Missing") onStatClick("missing");
            else if (s.label === "Received") onStatClick("inbox");
            else onStatClick("all");
          }}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs transition-colors hover:bg-muted/50"
        >
          <span className="size-1.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
          <span className="text-muted-foreground">{s.label}</span>
          <span className="font-bold tabular-nums">{s.value}</span>
        </button>
      ))}
    </div>
  );
}

// ───────────────────────────────────────────────
// Document Row with AI Summary
// ───────────────────────────────────────────────
function SmartDocumentRow({ doc, showNew = false, showDate = false, onOpen }: {
  doc: MockDocument; showNew?: boolean; showDate?: boolean; onOpen: (doc: MockDocument) => void;
}) {
  const intel = getIntelligenceForDocument(doc.id);
  const isNew = showNew && !doc.viewedByPreparer;

  // AI-classified name (cleaned up filename)
  const displayName = doc.fileName.replace(/_/g, " ").replace(/\.[^.]+$/, "");

  // One-line AI summary
  const summary = intel?.aiSummary
    ? intel.keyDataPoints.map(kv => `${kv.label}: ${kv.value}`).join(" · ")
    : null;

  return (
    <button
      onClick={() => onOpen(doc)}
      className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all hover:bg-muted/50 ${isNew ? "" : doc.viewedByPreparer ? "opacity-70" : ""}`}
    >
      <DocTypeBadge type={doc.docTypeLabel} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`text-[13px] truncate ${isNew ? "font-bold" : "font-medium"}`}>{displayName}</span>
          {intel?.flags?.some(f => f.type === "warning") && (
            <AlertTriangle className="size-3 text-amber-500 shrink-0" />
          )}
        </div>
        <div className="text-muted-foreground text-xs truncate">
          {doc.clientName}
          {showDate
            ? ` · ${new Date(doc.uploadedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
            : ` · ${doc.fileSize}`
          }
          {summary && (
            <span className="text-foreground/40"> · {summary}</span>
          )}
        </div>
      </div>
      {isNew && <div className="size-2 rounded-full bg-blue-500 shrink-0" />}
      {doc.status === "ready_for_review" && (
        <Badge variant="outline" className="text-[10px] shrink-0">Review</Badge>
      )}
      <ChevronRight className="size-3.5 text-muted-foreground/30 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}


// ───────────────────────────────────────────────
// Missing: Client group with AI-drafted remind
// ───────────────────────────────────────────────
interface MissingClientGroup {
  clientId: string;
  items: typeof checklistItems;
}

function generateAIDraft(clientName: string, items: typeof checklistItems): string {
  const firstName = clientName.split(" ")[0];
  const itemList = items.map(i => i.label).join(", ");
  return `Hey ${firstName}, just following up on your return. I still need ${items.length === 1 ? "your " + items[0]!.label : "a few things: " + itemList} to move forward. You can upload through the portal anytime, or just snap a photo and send it over. Let me know if you have any questions!`;
}

function MissingClientGroupCard({ group }: { group: MissingClientGroup }) {
  const [expanded, setExpanded] = useState(false);
  const [composing, setComposing] = useState(false);
  const [sent, setSent] = useState(false);
  const { showToast } = useToast();
  const client = clients.find(c => c.id === group.clientId);
  if (!client) return null;

  const maxDays = Math.max(...group.items.map(i => i.daysSinceRequested));
  const urgency = maxDays >= 7 ? "critical" : maxDays >= 3 ? "attention" : "fresh";
  const urgencyColor = urgency === "critical" ? "bg-red-500" : urgency === "attention" ? "bg-amber-500" : "bg-emerald-500";
  const urgencyLabel = urgency === "critical" ? `${maxDays}d overdue` : urgency === "attention" ? `${maxDays}d waiting` : `${maxDays}d`;

  const [draft, setDraft] = useState(() => generateAIDraft(client.fullName, group.items));

  return (
    <Card className="overflow-hidden">
      {/* Client header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Avatar className="size-8 shrink-0">
          <AvatarImage src={client.avatar} />
          <AvatarFallback className="text-[10px]">{client.fullName.split(" ").map(n => n[0]).join("").slice(0, 2)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold truncate">{client.fullName}</span>
            <span className={`size-1.5 rounded-full shrink-0 ${urgencyColor}`} />
          </div>
          <div className="text-xs text-muted-foreground">
            {group.items.length} missing · {urgencyLabel}
            {sent && <span className="text-emerald-600 ml-1">· Reminded</span>}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {sent ? (
            <span className="flex items-center gap-1 text-xs text-emerald-600"><Check className="size-3" /> Sent</span>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={(e) => { e.stopPropagation(); setComposing(!composing); }}
            >
              <Send className="size-3" /> Remind
            </Button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center justify-center size-7 rounded-md hover:bg-muted/50 transition-colors"
          >
            <ChevronDown className={`size-3.5 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* Message compose */}
      <AnimatePresence>
        {composing && !sent && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/50 px-4 py-3 space-y-2.5">
              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm leading-relaxed resize-none outline-none focus:ring-1 focus:ring-ring"
                rows={3}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  via {client.email ? "email" : "portal"}
                </span>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setComposing(false)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => { setSent(true); setComposing(false); showToast("success", "Reminder sent", `Message sent to ${client!.fullName} via ${client!.email ? "email" : "portal"}`); }}
                  >
                    <Send className="size-3.5" /> Send
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded item list */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/50 divide-y">
              {group.items
                .sort((a, b) => b.daysSinceRequested - a.daysSinceRequested)
                .map(item => {
                  const itemUrgency = item.daysSinceRequested >= 7 ? "text-red-500" : item.daysSinceRequested >= 3 ? "text-amber-500" : "text-muted-foreground";
                  return (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-2 pl-16">
                      <span className="text-[13px] font-medium flex-1 truncate">{item.label}</span>
                      <span className={`text-[10px] tabular-nums ${itemUrgency}`}>{item.daysSinceRequested}d</span>
                    </div>
                  );
                })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// ───────────────────────────────────────────────
// Client Group (By client view)
// ───────────────────────────────────────────────
function ClientDocGroup({ group, defaultOpen, onOpenDoc }: {
  group: { name: string; avatar: string; clientId: string; docs: MockDocument[]; submitted: number; required: number };
  defaultOpen: boolean;
  onOpenDoc: (doc: MockDocument) => void;
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
          {group.docs.map(doc => (
            <SmartDocumentRow key={doc.id} doc={doc} showDate onOpen={onOpenDoc} />
          ))}
        </CardContent>
      )}
    </Card>
  );
}

// ───────────────────────────────────────────────
// Type Group (By type view)
// ───────────────────────────────────────────────
function TypeDocGroup({ typeKey, label, docs, defaultOpen, onOpenDoc }: {
  typeKey: string; label: string; docs: MockDocument[]; defaultOpen: boolean;
  onOpenDoc: (doc: MockDocument) => void;
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
          {docs.sort((a, b) => a.clientName.localeCompare(b.clientName)).map(doc => (
            <SmartDocumentRow key={doc.id} doc={doc} showDate onOpen={onOpenDoc} />
          ))}
        </CardContent>
      )}
    </Card>
  );
}

// ───────────────────────────────────────────────
// Main Page
// ───────────────────────────────────────────────
export default function DocumentsPage() {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"recent" | "client" | "type">("client");
  const [activeTab, setActiveTab] = useState("inbox");
  const [selectedDoc, setSelectedDoc] = useState<MockDocument | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  const unviewedCount = getUnviewedCount();
  const missingCount = getMissingCount();
  const docsByDay = getDocumentsByDay();
  const missingItems = checklistItems.filter(c => !c.received).sort((a, b) => b.daysSinceRequested - a.daysSinceRequested);

  // Search filtering — searches filename, client name, doc type, and AI content
  const allDocsFiltered = useMemo(() => {
    return mockDocuments
      .filter(d => {
        if (!search) return true;
        const q = search.toLowerCase();
        const intel = getIntelligenceForDocument(d.id);
        return (
          d.fileName.toLowerCase().includes(q) ||
          d.clientName.toLowerCase().includes(q) ||
          d.docType.toLowerCase().includes(q) ||
          d.docTypeLabel.toLowerCase().includes(q) ||
          (intel?.aiSummary?.toLowerCase().includes(q)) ||
          (intel?.keyDataPoints.some(kv => kv.value.toLowerCase().includes(q) || kv.label.toLowerCase().includes(q)))
        );
      })
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }, [search]);

  const handleStatClick = (tab: string) => setActiveTab(tab);
  const handleOpenDoc = (doc: MockDocument) => {
    setSelectedDoc(doc);
    setViewerOpen(true);
  };

  return (
    <div>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-display tracking-tight">Documents</h1>
            <p className="text-muted-foreground text-sm">Manage documents across all clients</p>
          </div>
          <StatBar onStatClick={handleStatClick} />
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search by client, type, or content..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
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
                    {docs.map(doc => (
                      <SmartDocumentRow key={doc.id} doc={doc} showNew onOpen={handleOpenDoc} />
                    ))}
                  </CardContent>
                </Card>
              </div>
            ))}
          </TabsContent>

          {/* MISSING — grouped by client */}
          <TabsContent value="missing" className="mt-4 space-y-3">
            {(() => {
              // Group missing items by client
              const clientGroups = new Map<string, typeof missingItems>();
              missingItems.forEach(item => {
                if (!clientGroups.has(item.clientId)) clientGroups.set(item.clientId, []);
                clientGroups.get(item.clientId)!.push(item);
              });

              // Sort by worst urgency (highest days), then by count
              const sorted = [...clientGroups.entries()].sort((a, b) => {
                const aMax = Math.max(...a[1].map(i => i.daysSinceRequested));
                const bMax = Math.max(...b[1].map(i => i.daysSinceRequested));
                if (aMax !== bMax) return bMax - aMax;
                return b[1].length - a[1].length;
              });

              const criticalCount = missingItems.filter(i => i.daysSinceRequested >= 7).length;

              return (
                <>
                  <p className="text-sm text-muted-foreground">
                    {missingCount} documents from {sorted.length} clients
                    {criticalCount > 0 && (
                      <span className="text-destructive font-medium"> · {criticalCount} overdue 7+ days</span>
                    )}
                  </p>
                  {sorted.map(([clientId, items]) => (
                    <MissingClientGroupCard key={clientId} group={{ clientId, items }} />
                  ))}
                </>
              );
            })()}
          </TabsContent>

          {/* ALL DOCS */}
          <TabsContent value="all" className="mt-4 space-y-4">
            <div className="flex items-center justify-end">
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

            {/* Recent view */}
            {viewMode === "recent" && (
              <Card>
                <CardContent className="divide-y p-0">
                  {allDocsFiltered.map(doc => <SmartDocumentRow key={doc.id} doc={doc} showDate onOpen={handleOpenDoc} />)}
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
              const sorted = [...clientGroups.values()].sort((a, b) => {
                const aMissing = a.required - a.submitted;
                const bMissing = b.required - b.submitted;
                if (aMissing !== bMissing) return bMissing - aMissing;
                return b.docs.length - a.docs.length;
              });
              return sorted.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">No documents found</div>
              ) : (
                <div className="space-y-2">
                  {sorted.map((group, i) => (
                    <ClientDocGroup key={group.clientId} group={group} defaultOpen={i < 4} onOpenDoc={handleOpenDoc} />
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
                    <TypeDocGroup key={key} typeKey={key} label={typeLabels[key] || key} docs={group.docs} defaultOpen={i < 4} onOpenDoc={handleOpenDoc} />
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

      {/* Document Viewer Dialog (reuses existing component from client detail) */}
      <DocumentViewerDialog
        document={selectedDoc}
        clientId={selectedDoc?.clientId || ""}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
      />
    </div>
  );
}

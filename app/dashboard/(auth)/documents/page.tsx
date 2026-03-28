"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Search, ChevronRight, FileText } from "lucide-react";
import { DocumentRow } from "@/components/documents/document-row";
import { MissingDocRow } from "@/components/documents/missing-doc-row";
import { DocTypeBadge } from "@/components/documents/doc-type-badge";
import {
  mockDocuments, checklistItems, firmDocuments,
  getDocumentsByDay, getUnviewedCount, getMissingCount
} from "@/lib/documents-mock-data";

export default function DocumentsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
        <p className="text-muted-foreground text-sm">Manage documents across all clients</p>
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
                  {docs.map(doc => <DocumentRow key={doc.id} doc={doc} showNew />)}
                </CardContent>
              </Card>
            </div>
          ))}
        </TabsContent>

        {/* MISSING */}
        <TabsContent value="missing" className="mt-4">
          <Card>
            <CardContent className="divide-y p-0">
              {missingItems.map(item => <MissingDocRow key={item.id} item={item} />)}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ALL DOCS */}
        <TabsContent value="all" className="mt-4 space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
              <Input
                placeholder="Search all documents..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-1">
              {["all", "w2", "1099_nec", "1099_int", "id", "expense", "return"].map(t => (
                <Button key={t} size="sm" variant={typeFilter === t ? "default" : "outline"} onClick={() => setTypeFilter(t)}>
                  {t === "all" ? "All" : t === "w2" ? "W-2" : t === "1099_nec" ? "1099" : t === "id" ? "ID" : t === "expense" ? "Expense" : t === "return" ? "Returns" : t}
                </Button>
              ))}
            </div>
          </div>
          <Card>
            <CardContent className="divide-y p-0">
              {allDocsFiltered.map(doc => <DocumentRow key={doc.id} doc={doc} showDate />)}
              {allDocsFiltered.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">No documents found</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* FIRM FILES */}
        <TabsContent value="firm" className="mt-4">
          <div className="grid gap-3 md:grid-cols-2">
            {firmDocuments.map(doc => (
              <Card key={doc.id} className="cursor-pointer transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-lg">
                    {doc.icon}
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

"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { UploadZone } from "@/components/documents/upload-zone";
import { DocumentChecklist } from "@/components/documents/document-checklist";
import { DocumentGroup } from "@/components/documents/document-group";
import { clients } from "@/lib/mock-data";
import { documentExtractions } from "@/lib/actions-mock-data";
import { getClientChecklist, groupDocumentsByCategory } from "@/lib/documents-mock-data";
import { DocumentExtractionView } from "@/components/documents/document-extraction-view";
import { AlertTriangle, Check, CheckCircle, Download, FileText, FolderDown } from "lucide-react";
import { useToast } from "@/components/ui/toast-notification";

export default function ClientDocumentsPage() {
  const params = useParams();
  const client = clients.find(c => c.id === params.id);
  const [downloading, setDownloading] = useState(false);
  const { showToast } = useToast();
  if (!client) return <div className="text-muted-foreground">Client not found</div>;

  const checklist = getClientChecklist(client.id);
  const groups = groupDocumentsByCategory(client.id);
  const extractions = documentExtractions.filter(e => e.clientId === client.id);

  const totalDocs = groups.reduce((sum, g) => sum + g.docs.length, 0);
  const receivedCount = client.documentsSubmitted;
  const requiredCount = client.documentsRequired;
  const isFiled = client.returnStage === "filed";
  const allReceived = receivedCount >= requiredCount || isFiled;
  const missingCount = checklist.filter(c => c.required && !c.received).length;
  const docPercent = requiredCount > 0 ? Math.round((receivedCount / requiredCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Document Status Summary */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`flex size-10 items-center justify-center rounded-xl ${allReceived ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-muted"}`}>
                {allReceived ? (
                  <CheckCircle className="size-5 text-emerald-600" />
                ) : (
                  <FileText className="size-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    {allReceived ? "All documents received" : `${receivedCount} of ${requiredCount} documents received`}
                  </span>
                  {allReceived && (
                    <Badge variant="outline" className="border-emerald-200 text-emerald-700 text-[10px]">
                      <Check className="mr-1 size-3" /> Complete
                    </Badge>
                  )}
                  {!allReceived && missingCount > 0 && (
                    <Badge variant="outline" className="border-amber-200 text-amber-700 text-[10px]">
                      {missingCount} missing
                    </Badge>
                  )}
                </div>
                {!allReceived && (
                  <div className="mt-1.5 flex items-center gap-3">
                    <Progress value={docPercent} className="h-1.5 w-32" />
                    <span className="text-[11px] tabular-nums text-muted-foreground">{docPercent}%</span>
                  </div>
                )}
                {allReceived && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {totalDocs} files uploaded &middot; Ready for preparation
                  </p>
                )}
              </div>
            </div>

            {/* Download All button — only when all docs received */}
            {allReceived && totalDocs > 0 && (
              <Button size="sm" variant="outline" className="gap-1.5" disabled={downloading} onClick={() => { setDownloading(true); showToast("download", `Downloading ${totalDocs} files`, `${client.fullName.split(" ")[0]}'s documents`); setTimeout(() => setDownloading(false), 1500); }}>
                <FolderDown className={`size-3.5 ${downloading ? "animate-bounce" : ""}`} />
                {downloading ? "Downloading..." : `Download all (${totalDocs})`}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload zone */}
      <UploadZone clientName={client.fullName.split(" ")[0]} />

      {/* Document checklist */}
      {checklist.length > 0 && <DocumentChecklist items={checklist} />}

      {/* Auto-organized groups */}
      {groups.length > 0 && (
        <div className="space-y-5">
          {groups.map(group => (
            <DocumentGroup key={group.category} label={group.label} docs={group.docs} missing={group.missing} />
          ))}
        </div>
      )}

      {groups.length === 0 && checklist.length === 0 && (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No documents yet. Upload files or send the intake form to get started.
        </div>
      )}

      {/* AI Document Processing - interactive */}
      {extractions.length > 0 && (
        <div>
          <Separator className="my-4" />
          <div className="mb-3 text-sm font-semibold">AI Document Processing</div>
          <div className="space-y-3">
            {extractions.map(extraction => (
              <DocumentExtractionView key={extraction.id} extraction={extraction} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

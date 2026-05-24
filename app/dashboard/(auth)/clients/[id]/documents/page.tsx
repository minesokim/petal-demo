"use client";

import { useState, useMemo, useSyncExternalStore } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { UploadZone } from "@/components/documents/upload-zone";
import { DocumentGroup } from "@/components/documents/document-group";
import { DocumentViewerDialog } from "@/components/documents/document-viewer-dialog";
import { clients } from "@/lib/mock-data";
import {
  getClientChecklist,
  getClientDocuments,
  groupDocumentsByCategory,
  type MockDocument,
} from "@/lib/documents-mock-data";
import { subscribeForm8867 } from "@/lib/form-8867-store";
import { Check, CheckCircle, FileText, FolderDown } from "lucide-react";
import { useToast } from "@/components/ui/toast-notification";

export default function ClientDocumentsPage() {
  const params = useParams();
  const client = clients.find((c) => c.id === params.id);
  const [downloading, setDownloading] = useState(false);
  const [viewerDoc, setViewerDoc] = useState<MockDocument | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const { showToast } = useToast();

  // Subscribe to Form 8867 store so newly-filed forms appear immediately in this tab
  // (getClientDocuments / groupDocumentsByCategory already merge in 8867 completions).
  useSyncExternalStore(subscribeForm8867, () => null, () => null);

  if (!client) return <div className="text-muted-foreground">Client not found</div>;

  const checklist = getClientChecklist(client.id);
  const groups = groupDocumentsByCategory(client.id);
  const allDocs = getClientDocuments(client.id);

  const totalDocs = groups.reduce((sum, g) => sum + g.docs.length, 0);
  const receivedCount = client.documentsSubmitted;
  const requiredCount = client.documentsRequired;
  const isFiled = client.returnStage === "filed";
  const allReceived = receivedCount >= requiredCount || isFiled;
  const missingCount = checklist.filter((c) => c.required && !c.received).length;
  const docPercent = requiredCount > 0 ? Math.round((receivedCount / requiredCount) * 100) : 0;

  // For prev/next navigation in the dialog
  const currentDocIndex = viewerDoc ? allDocs.findIndex((d) => d.id === viewerDoc.id) : -1;

  const openViewer = (doc: MockDocument) => {
    setViewerDoc(doc);
    setViewerOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* Upload zone — always on top */}
      <UploadZone clientName={client.fullName.split(" ")[0]} />

      {/* Document Status Summary */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`flex size-9 items-center justify-center rounded-lg ${
                  allReceived ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-muted"
                }`}
              >
                {allReceived ? (
                  <CheckCircle className="size-4 text-emerald-600" />
                ) : (
                  <FileText className="size-4 text-muted-foreground" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    {allReceived
                      ? "All documents received"
                      : `${receivedCount} of ${requiredCount} documents`}
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
                  <div className="mt-1 flex items-center gap-3">
                    <Progress value={docPercent} className="h-1.5 w-28" />
                    <span className="text-[10px] tabular-nums text-muted-foreground">{docPercent}%</span>
                  </div>
                )}
              </div>
            </div>

            {totalDocs > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 h-8"
                disabled={downloading}
                onClick={() => {
                  setDownloading(true);
                  const downloadable = groups.flatMap(g => g.docs).filter(d => d.demoPdfPath);
                  downloadable.forEach((doc, i) => {
                    setTimeout(() => {
                      const a = document.createElement("a");
                      a.href = doc.demoPdfPath!;
                      a.download = doc.fileName;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }, i * 200);
                  });
                  showToast("success", "Downloading documents", `${downloadable.length} files downloading`);
                  setTimeout(() => setDownloading(false), 1500);
                }}
              >
                <FolderDown className={`size-3.5 ${downloading ? "animate-bounce" : ""}`} />
                {downloading ? "Downloading..." : `Download all (${totalDocs})`}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Document groups by category */}
      {groups.length > 0 ? (
        <div className="space-y-5">
          {groups.map((group) => (
            <DocumentGroup key={group.category} label={group.label} docs={group.docs} missing={group.missing} onOpenDocument={openViewer} />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No documents yet. Upload files or send the intake form to get started.
        </div>
      )}

      {/* Document Viewer Dialog — opens when clicking a document */}
      <DocumentViewerDialog
        document={viewerDoc}
        clientId={client.id}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
      />
    </div>
  );
}

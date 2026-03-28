"use client";

import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { UploadZone } from "@/components/documents/upload-zone";
import { DocumentChecklist } from "@/components/documents/document-checklist";
import { DocumentGroup } from "@/components/documents/document-group";
import { clients } from "@/lib/mock-data";
import { documentExtractions } from "@/lib/actions-mock-data";
import { getClientChecklist, groupDocumentsByCategory } from "@/lib/documents-mock-data";
import { DocumentExtractionView } from "@/components/documents/document-extraction-view";
import { AlertTriangle, FileText } from "lucide-react";

export default function ClientDocumentsPage() {
  const params = useParams();
  const client = clients.find(c => c.id === params.id);
  if (!client) return <div className="text-muted-foreground">Client not found</div>;

  const checklist = getClientChecklist(client.id);
  const groups = groupDocumentsByCategory(client.id);
  const extractions = documentExtractions.filter(e => e.clientId === client.id);

  return (
    <div className="space-y-6">
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

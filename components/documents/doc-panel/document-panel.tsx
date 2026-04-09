"use client";

import { useState, useCallback } from "react";
import { DocumentTree } from "./document-tree";
import { PdfViewer } from "./pdf-viewer";
import { ExtractionPanel } from "./extraction-panel";
import { getDocumentById } from "@/lib/documents-mock-data";

interface DocumentPanelProps {
  clientId: string;
}

export function DocumentPanel({ clientId }: DocumentPanelProps) {
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  const handleSelectDocument = useCallback((docId: string) => {
    setSelectedDocId(docId);
  }, []);

  const selectedDoc = selectedDocId ? getDocumentById(selectedDocId) : null;

  return (
    <div className="grid h-[calc(100vh-400px)] min-h-[520px] grid-cols-[240px_1fr_320px] gap-0 overflow-hidden rounded-lg border bg-card">
      {/* Left: Document Tree */}
      <div className="flex h-full flex-col overflow-hidden border-r border-border/40">
        <div className="shrink-0 border-b border-border/50 px-3 py-2.5">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Documents
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto px-1 py-1">
          <DocumentTree
            clientId={clientId}
            selectedDocId={selectedDocId}
            onSelectDocument={handleSelectDocument}
          />
        </div>
      </div>

      {/* Center: PDF Viewer */}
      <div className="h-full overflow-hidden border-r border-border/40">
        <PdfViewer
          pdfPath={selectedDoc?.demoPdfPath || null}
          fileName={selectedDoc?.fileName || ""}
        />
      </div>

      {/* Right: Extracted Data */}
      <div className="h-full overflow-hidden">
        <ExtractionPanel documentId={selectedDocId} />
      </div>
    </div>
  );
}

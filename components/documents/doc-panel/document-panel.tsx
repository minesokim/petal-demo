"use client";

import { useState, useCallback } from "react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { DocumentTree } from "./document-tree";
import { PdfViewer } from "./pdf-viewer";
import { ExtractionPanel } from "./extraction-panel";
import { getDocumentById } from "@/lib/documents-mock-data";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BinderSummaryBar } from "./binder-summary-bar";

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
    <div className="h-[calc(100vh-420px)] min-h-[500px] rounded-lg border bg-card">
      <ResizablePanelGroup direction="horizontal">
        {/* Left: Document Tree */}
        <ResizablePanel defaultSize={22} minSize={16} maxSize={35}>
          <div className="flex h-full flex-col">
            <div className="border-b border-border/50 px-3 py-2">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Documents
              </h3>
            </div>
            <BinderSummaryBar clientId={clientId} />
            <ScrollArea className="flex-1 px-1">
              <DocumentTree
                clientId={clientId}
                selectedDocId={selectedDocId}
                onSelectDocument={handleSelectDocument}
              />
            </ScrollArea>
          </div>
        </ResizablePanel>

        <ResizableHandle />

        {/* Center: PDF Viewer */}
        <ResizablePanel defaultSize={45} minSize={30}>
          <PdfViewer
            pdfPath={selectedDoc?.demoPdfPath || null}
            fileName={selectedDoc?.fileName || ""}
          />
        </ResizablePanel>

        <ResizableHandle />

        {/* Right: AI Extraction */}
        <ResizablePanel defaultSize={33} minSize={22}>
          <ExtractionPanel documentId={selectedDocId} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

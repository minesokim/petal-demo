"use client";

import { useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  Loader2,
} from "lucide-react";

// Configure worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  pdfPath: string | null;
  fileName: string;
}

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function PdfViewer({ pdfPath, fileName }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoomIndex, setZoomIndex] = useState(2); // Start at 100%
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const scale = ZOOM_LEVELS[zoomIndex];

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
    setLoading(false);
    setError(false);
  }, []);

  const onDocumentLoadError = useCallback(() => {
    setLoading(false);
    setError(true);
  }, []);

  const zoomIn = () => setZoomIndex((i) => Math.min(i + 1, ZOOM_LEVELS.length - 1));
  const zoomOut = () => setZoomIndex((i) => Math.max(i - 1, 0));
  const resetZoom = () => setZoomIndex(2);

  // No PDF available — show placeholder
  if (!pdfPath) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
          <FileText className="size-7 text-muted-foreground/50" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground/70">
            {fileName.replace(/_/g, " ").replace(/\.[^.]+$/, "")}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Preview not available
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border/50 px-3 py-1.5">
        {/* Page nav */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
            disabled={pageNumber <= 1}
          >
            <ChevronLeft className="size-3.5" />
          </Button>
          <span className="min-w-[4rem] text-center text-xs tabular-nums text-muted-foreground">
            {pageNumber} / {numPages || "–"}
          </span>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
            disabled={pageNumber >= numPages}
          >
            <ChevronRight className="size-3.5" />
          </Button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-xs" onClick={zoomOut} disabled={zoomIndex <= 0}>
            <ZoomOut className="size-3.5" />
          </Button>
          <button
            onClick={resetZoom}
            className="min-w-[3rem] rounded px-1 py-0.5 text-center text-[10px] tabular-nums text-muted-foreground transition-colors hover:bg-muted"
          >
            {Math.round(scale * 100)}%
          </button>
          <Button variant="ghost" size="icon-xs" onClick={zoomIn} disabled={zoomIndex >= ZOOM_LEVELS.length - 1}>
            <ZoomIn className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* PDF content */}
      <div className="flex-1 overflow-auto bg-muted/20 p-4">
        {error ? (
          <div className="flex h-full flex-col items-center justify-center gap-2">
            <FileText className="size-8 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">Failed to load PDF</p>
          </div>
        ) : (
          <div className="flex justify-center">
            <Document
              file={pdfPath}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex items-center gap-2 py-20">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Loading document...</span>
                </div>
              }
              className="shadow-sm"
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                className="rounded bg-white shadow-md"
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            </Document>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useCallback, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  FileText,
  Loader2,
} from "lucide-react";

// Configure worker via CDN
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const MIN_SCALE = 0.25;
const MAX_SCALE = 4;

interface PdfViewerInnerProps {
  pdfPath: string;
}

export default function PdfViewerInner({ pdfPath }: PdfViewerInnerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [error, setError] = useState(false);

  // Pan state
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });
  const panStartOffset = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
    setError(false);
  }, []);

  const onDocumentLoadError = useCallback((err: any) => {
    console.error("PDF load error:", err);
    setError(true);
  }, []);

  const zoomIn = () => setScale(s => Math.min(s * 1.25, MAX_SCALE));
  const zoomOut = () => setScale(s => Math.max(s / 1.25, MIN_SCALE));
  const resetZoom = () => { setScale(1); setPanOffset({ x: 0, y: 0 }); };

  // Scroll wheel = zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(s => Math.max(MIN_SCALE, Math.min(MAX_SCALE, s * delta)));
  }, []);

  // Mouse drag = pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // left click only
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY };
    panStartOffset.current = { ...panOffset };
  }, [panOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setPanOffset({
      x: panStartOffset.current.x + dx,
      y: panStartOffset.current.y + dy,
    });
  }, [isPanning]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between border-b border-border/50 px-3 py-1.5">
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

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-xs" onClick={zoomOut}>
            <ZoomOut className="size-3.5" />
          </Button>
          <button
            onClick={resetZoom}
            className="min-w-[3rem] rounded px-1 py-0.5 text-center text-[10px] tabular-nums text-muted-foreground transition-colors hover:bg-muted"
          >
            {Math.round(scale * 100)}%
          </button>
          <Button variant="ghost" size="icon-xs" onClick={zoomIn}>
            <ZoomIn className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* PDF content — scroll to zoom, drag to pan */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden bg-muted/10"
        style={{ cursor: isPanning ? "grabbing" : "grab" }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {error ? (
          <div className="flex h-full flex-col items-center justify-center gap-2">
            <FileText className="size-8 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">Failed to load PDF</p>
          </div>
        ) : (
          <div
            className="flex h-full items-center justify-center p-4"
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
              transition: isPanning ? "none" : "transform 0.1s ease-out",
            }}
          >
            <Document
              file={pdfPath}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex items-center gap-2 py-20">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Loading...</span>
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                className="rounded bg-white shadow-md select-none"
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>
          </div>
        )}
      </div>
    </div>
  );
}

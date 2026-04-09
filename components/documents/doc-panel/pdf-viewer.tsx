"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  FileText,
  Loader2,
} from "lucide-react";

interface PdfViewerProps {
  pdfPath: string | null;
  fileName: string;
}

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 2];

// Lazy-load react-pdf to avoid SSR issues
const PdfViewerInner = dynamic(() => import("./pdf-viewer-inner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
    </div>
  ),
});

export function PdfViewer({ pdfPath, fileName }: PdfViewerProps) {
  // No document selected at all
  if (!pdfPath && !fileName) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
        <div className="flex size-14 items-center justify-center rounded-xl bg-muted/60">
          <FileText className="size-6 text-muted-foreground/40" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Select a document</p>
          <p className="mt-0.5 text-xs text-muted-foreground/60">
            Choose a file from the tree to preview
          </p>
        </div>
      </div>
    );
  }

  // Document selected but no PDF file available
  if (!pdfPath) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
        <div className="flex size-14 items-center justify-center rounded-xl bg-muted/60">
          <FileText className="size-6 text-muted-foreground/40" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground/70">
            {fileName.replace(/_/g, " ").replace(/\.[^.]+$/, "")}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Preview not available for this file type
          </p>
        </div>
      </div>
    );
  }

  return <PdfViewerInner pdfPath={pdfPath} />;
}

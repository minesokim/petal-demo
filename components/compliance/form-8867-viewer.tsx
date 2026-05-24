"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, X, Pen, Loader2 } from "lucide-react";
import { Form8867Dialog } from "./form-8867-dialog";
import {
  getForm8867Completion,
  subscribeForm8867,
  type Form8867Completion,
} from "@/lib/form-8867-store";
import { fillForm8867 } from "@/lib/fill-form-8867";

interface Form8867ViewerProps {
  clientName: string;
  clientId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Renders the **real, filled IRS Form 8867 PDF** for a client's saved
 * completion. Pulls answers from `form-8867-store`, fills `public/forms/f8867.pdf`
 * via pdf-lib, and streams the resulting PDF into an iframe.
 *
 * This is the document the preparer must retain for 3 years under IRC §6695(g).
 * The "Download" button gives them a copy on disk.
 */
export function Form8867Viewer({ clientName, clientId, open, onOpenChange }: Form8867ViewerProps) {
  const [editOpen, setEditOpen] = useState(false);

  // Subscribe to the store so the viewer re-renders when the form is updated
  const completion = useSyncExternalStore<Form8867Completion | undefined>(
    subscribeForm8867,
    () => (clientId ? getForm8867Completion(clientId) : undefined),
    () => undefined
  );

  // Generate the filled PDF blob URL whenever the completion changes
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !completion) {
      setPdfUrl(null);
      setPdfError(null);
      return;
    }

    let cancelled = false;
    let createdUrl: string | null = null;

    setPdfError(null);
    setPdfUrl(null);

    (async () => {
      try {
        const bytes = await fillForm8867(completion);
        if (cancelled) return;
        // Copy into ArrayBuffer for BlobPart compatibility
        const buf = new ArrayBuffer(bytes.byteLength);
        new Uint8Array(buf).set(bytes);
        const blob = new Blob([buf], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        createdUrl = url;
        setPdfUrl(url);
      } catch (err) {
        if (cancelled) return;
        setPdfError(err instanceof Error ? err.message : "Failed to render Form 8867");
      }
    })();

    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [open, completion]);

  function downloadPdf() {
    if (!pdfUrl || !completion) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = `Form 8867 - ${completion.clientName} - ${completion.answers.taxYear}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="flex !h-[92vh] !w-[920px] !max-w-[95vw] flex-col gap-0 overflow-hidden p-0"
          showCloseButton={false}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-5 py-2.5 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-sm font-semibold">Form 8867</h2>
              {completion ? (
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-[10px] shrink-0">
                  Filed
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] shrink-0">
                  Not yet completed
                </Badge>
              )}
              <span className="text-[11px] text-muted-foreground truncate">
                {clientName} · {completion?.answers.taxYear ?? new Date().getFullYear()}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={() => setEditOpen(true)}
              >
                <Pen className="size-3" />
                {completion ? "Amend" : "Complete"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={downloadPdf}
                disabled={!pdfUrl}
              >
                <Download className="size-3" /> Download
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => onOpenChange(false)}>
                <X className="size-4" />
              </Button>
            </div>
          </div>

          {/* PDF viewer */}
          <div className="flex-1 overflow-hidden bg-neutral-100 dark:bg-neutral-900 min-h-0">
            {!completion ? (
              <EmptyState onComplete={() => setEditOpen(true)} />
            ) : pdfError ? (
              <ErrorState message={pdfError} />
            ) : !pdfUrl ? (
              <LoadingState />
            ) : (
              <iframe
                src={pdfUrl}
                className="h-full w-full border-0"
                title={`Form 8867 - ${completion.clientName}`}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Amend / Complete questionnaire */}
      <Form8867Dialog
        clientName={clientName}
        clientId={clientId}
        open={editOpen}
        onOpenChange={setEditOpen}
        onComplete={() => setEditOpen(false)}
      />
    </>
  );
}

// ─── States ───

function LoadingState() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        <span className="text-xs">Generating filled Form 8867…</span>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="max-w-sm rounded-lg border bg-card p-4 text-center">
        <div className="text-sm font-medium">Couldn't render Form 8867</div>
        <div className="mt-1 text-xs text-muted-foreground">{message}</div>
      </div>
    </div>
  );
}

function EmptyState({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="max-w-sm rounded-lg border bg-card p-5 text-center space-y-3">
        <div className="text-sm font-semibold">Form 8867 not yet completed</div>
        <p className="text-xs text-muted-foreground">
          The Paid Preparer&apos;s Due Diligence Checklist needs to be completed
          before this return can be e-filed. Required for any return claiming EIC,
          CTC/ACTC/ODC, AOTC, or HOH filing status.
        </p>
        <Button size="sm" onClick={onComplete}>
          Complete Form 8867
        </Button>
      </div>
    </div>
  );
}

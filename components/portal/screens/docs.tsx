"use client";

import * as React from "react";

import { useIntakeStore } from "@/lib/portal/intake-store";
import {
  AntonioNote,
  Body,
  BottomBar,
  Button,
  Eyebrow,
  IntakeHeader,
  Row,
  Screen,
  Stack
} from "@/components/portal/primitives";
import { Glyph } from "./icons";

/**
 * Docs upload — the mockup shows 5 phases of the same screen:
 *   empty     → nothing uploaded
 *   scanning  → a file is being OCR'd
 *   retake    → AI wants a better photo
 *   parsed    → fields extracted, confidence scores
 *   uploaded  → all done
 *
 * Phase 1 ships a minimal happy-path version: empty → uploaded,
 * with a simulated scan animation in between. The retake/parsed
 * details (confidence scoring, field re-selection) are rich enough
 * to deserve their own screen iteration after backend OCR lands.
 */

type DocPhase = "empty" | "scanning" | "parsed" | "uploaded";

type UploadedDoc = {
  id: string;
  name: string;
  kind: string;
  size: string;
  phase: Exclude<DocPhase, "empty">;
  confidence?: number;
};

export function ScreenDocsUpload() {
  const { docsUploadedAt, patch, goNext, goPrev } = useIntakeStore();
  const [docs, setDocs] = React.useState<UploadedDoc[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList) => {
    const newDocs: UploadedDoc[] = Array.from(files).slice(0, 5).map((f, i) => ({
      id: `${Date.now()}-${i}`,
      name: f.name,
      kind: guessKind(f.name),
      size: formatSize(f.size),
      phase: "scanning"
    }));
    setDocs((prev) => [...prev, ...newDocs]);

    // Simulate per-doc OCR: scanning → parsed → uploaded
    newDocs.forEach((d, i) => {
      window.setTimeout(
        () => {
          setDocs((prev) =>
            prev.map((x) =>
              x.id === d.id
                ? { ...x, phase: "parsed", confidence: 0.92 + Math.random() * 0.07 }
                : x
            )
          );
        },
        1200 + i * 300
      );
      window.setTimeout(
        () => {
          setDocs((prev) =>
            prev.map((x) => (x.id === d.id ? { ...x, phase: "uploaded" } : x))
          );
        },
        2200 + i * 300
      );
    });
  };

  const allDone =
    docs.length > 0 && docs.every((d) => d.phase === "uploaded");

  const handleContinue = () => {
    if (!docsUploadedAt) {
      patch({ docsUploadedAt: new Date().toISOString() });
    }
    goNext();
  };

  return (
    <Screen>
      <IntakeHeader step={12} label="Documents" />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="px-6 pt-7 pb-6">
          <Stack gap={10}>
            <h1
              className="font-serif text-[26px] font-medium leading-[1.15] tracking-[-0.015em] text-portal-ink"
              style={{
                fontVariationSettings: '"opsz" 36',
                fontSynthesis: "none"
              }}>
              Upload your documents.
            </h1>
            <Body size={14}>
              Snap photos or pick files. I&apos;ll classify each one
              automatically.
            </Body>
          </Stack>

          {/* Upload zone */}
          <div
            className="mt-6 rounded-[20px] border-2 border-dashed border-portal-border bg-portal-bg-elev/60 px-6 py-8 text-center transition-colors"
            onDragOver={(e) => {
              e.preventDefault();
              (e.currentTarget as HTMLDivElement).style.borderColor =
                "var(--portal-forest)";
            }}
            onDragLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = "";
            }}
            onDrop={(e) => {
              e.preventDefault();
              (e.currentTarget as HTMLDivElement).style.borderColor = "";
              if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
            }}>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              accept="image/*,application/pdf"
              onChange={(e) => {
                if (e.target.files?.length) handleFiles(e.target.files);
                e.target.value = "";
              }}
            />

            <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-forest-tint text-forest">
              <Glyph name="upload" className="size-7" />
            </div>

            <div className="mb-1 text-[15px] font-medium text-portal-ink">
              Tap to upload
            </div>
            <div className="mb-4 text-[12.5px] text-portal-muted">
              Photos of W-2s, 1099s, statements — anything you have.
            </div>

            <Row gap={8} justify="center">
              <Button
                variant="primary"
                size="md"
                onClick={() => inputRef.current?.click()}>
                <Glyph name="camera" className="size-4" />
                Take photo
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => inputRef.current?.click()}>
                <Glyph name="upload" className="size-4" />
                Choose files
              </Button>
            </Row>
          </div>

          {/* Uploaded list */}
          {docs.length > 0 ? (
            <div className="mt-6">
              <Row justify="space-between" className="mb-2.5">
                <Eyebrow>
                  {docs.length} document{docs.length > 1 ? "s" : ""}
                </Eyebrow>
                <Eyebrow>
                  {docs.filter((d) => d.phase === "uploaded").length} saved
                </Eyebrow>
              </Row>
              <Stack gap={8}>
                {docs.map((d) => (
                  <DocRow
                    key={d.id}
                    doc={d}
                    onRemove={() =>
                      setDocs((prev) => prev.filter((x) => x.id !== d.id))
                    }
                  />
                ))}
              </Stack>
            </div>
          ) : null}

          <AntonioNote>
            Don&apos;t worry about quality — the AI de-skews phone photos and
            flags anything low-confidence for my review. You can always add
            more later from your portal home.
          </AntonioNote>
        </div>
      </div>

      <BottomBar>
        <Button variant="secondary" onClick={goPrev}>
          Back
        </Button>
        <Button
          variant="primary"
          fullWidth
          disabled={docs.length > 0 && !allDone}
          onClick={handleContinue}>
          {docs.length === 0 ? "Skip for now" : allDone ? "Continue" : "Processing…"}
        </Button>
      </BottomBar>
    </Screen>
  );
}

function DocRow({
  doc,
  onRemove
}: {
  doc: UploadedDoc;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[12px] border border-portal-border bg-portal-card px-4 py-3">
      <span
        aria-hidden
        className="grid size-10 flex-shrink-0 place-items-center rounded-[10px] bg-portal-bg-elev font-mono text-[10px] font-semibold uppercase tracking-[0.05em] text-portal-ink-soft">
        {doc.kind}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13.5px] font-medium text-portal-ink">
          {doc.name}
        </div>
        <div className="mt-0.5 text-[11px] text-portal-muted">
          {doc.size}
          {doc.phase === "parsed" && doc.confidence ? (
            <>
              {" · "}
              <span className="text-forest-ink">
                {Math.round(doc.confidence * 100)}% parsed
              </span>
            </>
          ) : null}
          {doc.phase === "uploaded" ? (
            <>
              {" · "}
              <span className="text-forest-ink">Saved</span>
            </>
          ) : null}
        </div>
      </div>
      {doc.phase === "scanning" ? (
        <span
          aria-hidden
          className="size-5 animate-spin rounded-full border-2 border-portal-border border-t-forest"
        />
      ) : doc.phase === "uploaded" ? (
        <span className="grid size-6 place-items-center rounded-full bg-forest text-white">
          <Glyph name="check" className="size-4" />
        </span>
      ) : (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove"
          className="grid size-6 place-items-center rounded-full border border-portal-border text-portal-muted transition-colors hover:bg-portal-bg-elev hover:text-portal-ink-soft">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M2 2l6 6M8 2l-6 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

function guessKind(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("w-2") || n.includes("w2")) return "W-2";
  if (n.includes("1099")) return "1099";
  if (n.includes("k-1") || n.includes("k1")) return "K-1";
  if (n.includes("1098")) return "1098";
  if (n.endsWith(".pdf")) return "PDF";
  if (/\.(jpg|jpeg|png|heic|webp)$/i.test(n)) return "IMG";
  return "DOC";
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

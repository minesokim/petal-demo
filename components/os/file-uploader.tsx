"use client";

// FileUploader — a polished drag-and-drop upload zone + uploading/uploaded file cards.
// Demo-interactive: choosing or dropping files adds cards that animate a simulated
// upload to 100%. Each finished file is draggable (e.g. onto the Ask Petal rail).

import { useRef, useState } from "react";
import { Upload, X, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { FileGlyph } from "@/components/os/primitives";

const FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]";
const extOf = (name: string) => (name.includes(".") ? name.split(".").pop()!.toLowerCase() : "pdf");
const fmtMB = (mb: number) => (mb >= 1 ? `${mb.toFixed(mb < 10 ? 1 : 0)} MB` : `${Math.round(mb * 1000)} KB`);

type UF = { id: string; name: string; mb: number; status: "uploading" | "done" | "error"; progress: number };

/** Small circular progress ring shown while a file uploads. */
function Ring({ pct }: { pct: number }) {
  const r = 7, c = 2 * Math.PI * r;
  return (
    <span className="relative grid size-4 place-items-center">
      <svg width="16" height="16" viewBox="0 0 16 16" className="-rotate-90">
        <circle cx="8" cy="8" r={r} fill="none" stroke="var(--os-selected)" strokeWidth="2" />
        <circle cx="8" cy="8" r={r} fill="none" stroke="var(--os-brand)" strokeWidth="2" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c} />
      </svg>
    </span>
  );
}

export function FileUploader({
  hint = "PDF, PNG, JPG or XLSX, up to 50 MB",
  onDragFileStart,
  seed = [],
}: {
  hint?: string;
  /** called when a finished file starts being dragged (e.g. to set drag data) */
  onDragFileStart?: (e: React.DragEvent, name: string) => void;
  seed?: { name: string; mb: number }[];
}) {
  const [files, setFiles] = useState<UF[]>(() =>
    seed.map((s, i) => ({ id: `seed-${i}`, name: s.name, mb: s.mb, status: "done" as const, progress: 100 })),
  );
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timers = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  function simulate(id: string) {
    if (timers.current[id]) clearInterval(timers.current[id]);
    timers.current[id] = setInterval(() => {
      setFiles(prev => prev.map(f => {
        if (f.id !== id || f.status !== "uploading") return f;
        const next = Math.min(100, f.progress + 6 + Math.round(Math.random() * 14));
        if (next >= 100) { clearInterval(timers.current[id]); return { ...f, progress: 100, status: "done" }; }
        return { ...f, progress: next };
      }));
    }, 280);
  }

  function add(list: FileList | File[]) {
    const incoming: UF[] = Array.from(list).map((file, i) => ({
      id: `f-${Date.now()}-${i}-${Math.round(Math.random() * 1e4)}`,
      name: file.name,
      mb: file.size / 1e6 || 1 + Math.random() * 12,
      status: "uploading",
      progress: 0,
    }));
    setFiles(prev => [...incoming, ...prev]);
    incoming.forEach(f => simulate(f.id));
  }

  const remove = (id: string) => { if (timers.current[id]) clearInterval(timers.current[id]); setFiles(prev => prev.filter(f => f.id !== id)); };
  const retry = (id: string) => { setFiles(prev => prev.map(f => (f.id === id ? { ...f, status: "uploading", progress: 0 } : f))); simulate(id); };

  return (
    <div className="space-y-2.5">
      {/* dropzone */}
      <div
        onDragOver={e => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={e => { e.preventDefault(); setOver(false); if (e.dataTransfer.files?.length) add(e.dataTransfer.files); }}
        className={cn(
          "flex items-center gap-4 rounded-xl border px-5 py-4 transition-colors",
          over ? "border-dashed border-[var(--os-brand)] bg-[var(--os-brand)]/[0.04]" : "border-[var(--os-border)] bg-[var(--os-surface)]",
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-medium text-[var(--os-ink)]">Choose a file or drag and drop it here</div>
          <div className="mt-0.5 text-[12px] text-[var(--os-ink-muted)]">{hint}</div>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          className={cn("flex h-9 shrink-0 items-center gap-2 rounded-lg border border-[var(--os-border-strong)] bg-[var(--os-surface)] px-3.5 text-[13px] font-medium text-[var(--os-ink)] shadow-[0_1px_1px_rgba(17,17,26,0.04)] transition-colors hover:bg-[var(--os-hover)]", FOCUS)}
        >
          <Upload className="size-4 text-[var(--os-brand)]" /> Choose a file
        </button>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={e => { if (e.target.files) add(e.target.files); e.target.value = ""; }} />
      </div>

      {/* file cards */}
      {files.map(f => (
        <div
          key={f.id}
          draggable={f.status === "done"}
          onDragStart={e => { if (f.status === "done") { e.dataTransfer.effectAllowed = "copy"; e.dataTransfer.setData("text/plain", f.name); onDragFileStart?.(e, f.name); } }}
          className={cn(
            "group/uf flex items-center gap-3 rounded-xl border border-[var(--os-border)] bg-[var(--os-surface)] px-4 py-3 transition-colors",
            f.status === "done" && "cursor-grab hover:border-[var(--os-border-strong)] active:cursor-grabbing",
          )}
        >
          <FileGlyph kind={extOf(f.name)} size={34} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13.5px] font-medium text-[var(--os-ink)]">{f.name}</div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[12px] tabular-nums text-[var(--os-ink-muted)]">
              {f.status === "uploading" ? (
                <>{fmtMB(f.mb * f.progress / 100)} of {fmtMB(f.mb)} <span className="text-[var(--os-ink-subtle)]">·</span> <Ring pct={f.progress} /> {f.progress}%</>
              ) : f.status === "error" ? (
                <span className="text-[var(--os-danger)]">Upload failed</span>
              ) : (
                fmtMB(f.mb)
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {f.status === "error" && (
              <button onClick={() => retry(f.id)} aria-label="Retry" className={cn("grid size-8 place-items-center rounded-lg border border-[var(--os-border)] text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]", FOCUS)}>
                <RotateCw className="size-4" />
              </button>
            )}
            <button onClick={() => remove(f.id)} aria-label="Remove" className={cn("grid size-8 place-items-center rounded-lg border border-[var(--os-border)] text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]", FOCUS)}>
              <X className="size-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

"use client";

// /os/documents - the FIRM's own files (not client documents). A Google-Drive-style
// browser over the firm's credentials, compliance docs, templates, tax reference,
// admin records, and SOPs. Client tax documents live on each client's record.

import { useMemo, useState } from "react";
import { Folder, FolderPlus, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Icon, I } from "@/components/os/icon";
import { FileGlyph } from "@/components/os/primitives";
import { type FileKind, type FirmFile, type FlatFile } from "@/lib/fixtures/firm-files";
import { type FirmDocsData } from "@/lib/server/fixture-data";

const FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]";
type View = "all" | "starred" | string; // string = folderId
type Layout = "list" | "grid";

/* ── file-type glyph (page shape + folded corner + type badge) ── */
function KindTile({ kind, size = 32 }: { kind: FileKind; size?: number }) {
  return <FileGlyph kind={kind} size={size} />;
}

function FileRow({ f, showFolder }: { f: FirmFile & { folderName?: string }; showFolder?: boolean }) {
  return (
    <div className={cn("group/file flex cursor-default items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-[var(--os-hover)]")}>
      <KindTile kind={f.kind} size={30} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[13px] font-medium text-[var(--os-ink)]">{f.name}</span>
          {f.starred && <Icon icon={I.star} size={12} className="shrink-0 text-amber-500" />}
        </div>
        <div className="truncate text-[11px] text-[var(--os-ink-subtle)]">
          {f.owner} · {f.modified}{showFolder && f.folderName ? <> · {f.folderName}</> : null}
        </div>
      </div>
      <span className="hidden w-16 shrink-0 text-right text-[11px] tabular-nums text-[var(--os-ink-subtle)] sm:block">{f.size}</span>
      <button aria-label="More" className={cn("grid size-7 shrink-0 place-items-center rounded-md text-[var(--os-ink-subtle)] opacity-0 transition-all hover:bg-[var(--os-selected)] hover:text-[var(--os-ink)] group-hover/file:opacity-100", FOCUS)}>
        <Icon icon={I.more} size={15} />
      </button>
    </div>
  );
}

function FileCard({ f }: { f: FirmFile }) {
  return (
    <div className="group/file flex cursor-default flex-col rounded-xl border border-[var(--os-border)] bg-[var(--os-card)] p-3 transition-colors hover:border-[var(--os-border-strong)] hover:bg-[var(--os-hover)]">
      <div className="flex items-start justify-between">
        <KindTile kind={f.kind} size={40} />
        {f.starred && <Icon icon={I.star} size={13} className="text-amber-500" />}
      </div>
      <div className="mt-3 truncate text-[12.5px] font-medium text-[var(--os-ink)]" title={f.name}>{f.name}</div>
      <div className="mt-0.5 text-[11px] text-[var(--os-ink-subtle)]">{f.modified} · {f.size}</div>
    </div>
  );
}

function FilesView({ files, layout, showFolder }: { files: (FirmFile & { folderName?: string })[]; layout: Layout; showFolder?: boolean }) {
  if (files.length === 0) {
    return <p className="px-3 py-6 text-[13px] text-[var(--os-ink-muted)]">Nothing here yet.</p>;
  }
  return layout === "grid" ? (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      {files.map(f => <FileCard key={f.id} f={f} />)}
    </div>
  ) : (
    <div className="-mx-3">
      {files.map(f => <FileRow key={f.id} f={f} showFolder={showFolder} />)}
    </div>
  );
}

export function DocumentsView({ firmFolders, recentFirmFiles, starredFirmFiles, allFirmFiles, firmFileCount }: FirmDocsData) {
  const [view, setView] = useState<View>("all");
  const [layout, setLayout] = useState<Layout>("list");
  const [query, setQuery] = useState("");

  const folder = view !== "all" && view !== "starred" ? firmFolders.find(f => f.id === view) : undefined;
  const q = query.trim().toLowerCase();

  const searchResults = useMemo(
    () => (q ? allFirmFiles.filter(f => f.name.toLowerCase().includes(q) || f.folderName.toLowerCase().includes(q)) : []),
    [q],
  );

  const railItems: { key: View; label: string; count: number; icon: React.ReactNode }[] = [
    { key: "all", label: "All files", count: firmFileCount, icon: <Folder className="size-4" /> },
    { key: "starred", label: "Starred", count: starredFirmFiles.length, icon: <Icon icon={I.star} size={15} /> },
  ];

  const crumb = q ? `Search · "${query}"` : folder ? folder.name : view === "starred" ? "Starred" : "All files";

  return (
    <div className="flex h-full flex-col">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--os-border)] px-8 pb-5 pt-6">
        <div>
          <h1 className="os-display text-[24px] font-semibold text-[var(--os-ink)]">Documents</h1>
          <p className="mt-1 text-[13px] text-[var(--os-ink-muted)]">Your firm's files - credentials, templates, policies, and tax reference.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className={cn("flex h-8 items-center gap-1.5 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2.5 text-[13px] font-medium text-[var(--os-ink)] transition-colors hover:bg-[var(--os-hover)]", FOCUS)}>
            <FolderPlus className="size-[15px] text-[var(--os-ink-muted)]" /> New folder
          </button>
          <button className={cn("flex h-8 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-3 text-[13px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97]", FOCUS)}>
            <Upload className="size-[15px]" /> Upload
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* ── left rail: search + locations + folders ── */}
        <div className="hidden w-[220px] shrink-0 flex-col border-r border-[var(--os-border)] py-3 sm:flex">
          <div className="px-3">
            <div className="flex h-8 items-center gap-2 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2">
              <Icon icon={I.search} size={14} className="shrink-0 text-[var(--os-ink-subtle)]" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search files"
                className="w-full bg-transparent text-[13px] text-[var(--os-ink)] outline-none placeholder:text-[var(--os-ink-subtle)]"
              />
            </div>
          </div>

          <div className="mt-3 px-2">
            {railItems.map(it => (
              <button
                key={it.key}
                onClick={() => { setView(it.key); setQuery(""); }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors",
                  view === it.key && !q ? "bg-[var(--os-selected)] font-medium text-[var(--os-ink)]" : "text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]",
                  FOCUS,
                )}
              >
                <span className="shrink-0 text-[var(--os-ink-muted)]">{it.icon}</span>
                <span className="flex-1 truncate">{it.label}</span>
                <span className="text-[11px] tabular-nums text-[var(--os-ink-subtle)]">{it.count}</span>
              </button>
            ))}
          </div>

          <div className="os-label mb-1 mt-4 px-3">Folders</div>
          <div className="min-h-0 flex-1 overflow-y-auto px-2">
            {firmFolders.map(f => (
              <button
                key={f.id}
                onClick={() => { setView(f.id); setQuery(""); }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors",
                  view === f.id && !q ? "bg-[var(--os-selected)] font-medium text-[var(--os-ink)]" : "text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]",
                  FOCUS,
                )}
              >
                <Folder className="size-4 shrink-0 text-[var(--os-ink-muted)]" />
                <span className="flex-1 truncate">{f.name}</span>
                <span className="text-[11px] tabular-nums text-[var(--os-ink-subtle)]">{f.files.length}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── main: breadcrumb + content ── */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between gap-2 border-b border-[var(--os-border)] px-5 py-2 sm:px-8">
            <div className="flex items-center gap-1.5 text-[13px]">
              {q || folder || view === "starred" ? (
                <>
                  <button onClick={() => { setView("all"); setQuery(""); }} className={cn("rounded text-[var(--os-ink-muted)] transition-colors hover:text-[var(--os-ink)]", FOCUS)}>All files</button>
                  <Icon icon={I.chevronRight} size={12} className="text-[var(--os-ink-subtle)]" />
                  <span className="font-medium text-[var(--os-ink)]">{crumb}</span>
                </>
              ) : (
                <span className="font-medium text-[var(--os-ink)]">All files</span>
              )}
            </div>
            <div className="flex shrink-0 items-center rounded-md border border-[var(--os-border)] p-0.5" role="group" aria-label="Layout">
              {(["list", "grid"] as const).map(l => (
                <button
                  key={l}
                  onClick={() => setLayout(l)}
                  aria-pressed={layout === l}
                  className={cn("grid size-6 place-items-center rounded transition-colors", layout === l ? "bg-[var(--os-selected)] text-[var(--os-ink)]" : "text-[var(--os-ink-muted)] hover:text-[var(--os-ink)]", FOCUS)}
                >
                  <Icon icon={l === "list" ? I.viewList : I.viewBoard} size={14} />
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8">
            {q ? (
              <FilesView files={searchResults} layout={layout} showFolder />
            ) : folder ? (
              <FilesView files={folder.files} layout={layout} />
            ) : view === "starred" ? (
              <FilesView files={starredFirmFiles} layout={layout} showFolder />
            ) : (
              /* root: folders grid + recent */
              <div className="space-y-7">
                <section>
                  <div className="os-label mb-2.5">Folders</div>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                    {firmFolders.map(f => (
                      <button
                        key={f.id}
                        onClick={() => setView(f.id)}
                        className={cn("group/fold flex items-center gap-3 rounded-xl border border-[var(--os-border)] bg-[var(--os-card)] px-3.5 py-3 text-left transition-colors hover:border-[var(--os-border-hover)]", FOCUS)}
                      >
                        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--os-selected)] text-[var(--os-ink-muted)]">
                          <Folder className="size-[18px]" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13px] font-medium text-[var(--os-ink)]">{f.name}</div>
                          <div className="truncate text-[11px] text-[var(--os-ink-muted)]"><span className="tabular-nums">{f.files.length}</span> items · {f.description}</div>
                        </div>
                        <Icon icon={I.chevronRight} size={14} className="shrink-0 text-[var(--os-ink-subtle)] transition-transform group-hover/fold:translate-x-0.5" />
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <div className="os-label mb-2.5">Recent</div>
                  <FilesView files={recentFirmFiles} layout={layout} showFolder />
                </section>
              </div>
            )}
          </div>

          {/* upload hint */}
          <div className="flex items-center gap-1.5 border-t border-[var(--os-border)] px-5 py-2.5 text-[12px] text-[var(--os-ink-subtle)] sm:px-8">
            <Upload className="size-3.5 shrink-0" />
            Drop files here or email them to <span className="text-[var(--os-ink-muted)]">files@vazantea.com</span> - Petal files them to the right folder.
          </div>
        </div>
      </div>
    </div>
  );
}

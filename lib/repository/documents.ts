import { eq } from "drizzle-orm";
import { firmFolders, firmFiles } from "../db/schema";
import { writeAudit } from "./audit";
import type { Db, Ctx } from "./types";

// ③ Document library selectors mirroring lib/fixtures/firm-files.ts. Projects only
// fixture fields (no firm_id / storage_path / timestamps) so shapes are identical.
const folderCols = { id: firmFolders.id, name: firmFolders.name, description: firmFolders.description };
const fileCols = {
  id: firmFiles.id, name: firmFiles.name, kind: firmFiles.kind, size: firmFiles.size,
  modified: firmFiles.modified, ts: firmFiles.ts, owner: firmFiles.owner, starred: firmFiles.starred,
};

export async function listFirmFolders(db: Db) {
  return db.select(folderCols).from(firmFolders);
}
export async function folderById(db: Db, id: string) {
  const [r] = await db.select(folderCols).from(firmFolders).where(eq(firmFolders.id, id));
  return r;
}
export async function filesOf(db: Db, folderId: string) {
  return db.select(fileCols).from(firmFiles).where(eq(firmFiles.folderId, folderId));
}

// FirmFolder[] with nested files — the exact fixture `firmFolders` shape.
export async function firmFoldersWithFiles(db: Db) {
  const folders = await db.select(folderCols).from(firmFolders);
  const files = await db.select({ ...fileCols, folderId: firmFiles.folderId }).from(firmFiles);
  return folders.map((f) => ({
    ...f,
    files: files.filter((x) => x.folderId === f.id).map(({ folderId, ...rest }) => rest),
  }));
}

// FlatFile[] (file + folderId + folderName) — feeds recent/starred derivations.
export async function allFirmFiles(db: Db) {
  return db
    .select({ ...fileCols, folderId: firmFiles.folderId, folderName: firmFolders.name })
    .from(firmFiles)
    .innerJoin(firmFolders, eq(firmFiles.folderId, firmFolders.id));
}

// ── audited + RLS-scoped writers (mirrors lib/repository/practice-writes.ts) ──

// Map an upload's extension/mime to the UI's FileKind ("pdf" | "docx" | "xlsx").
// Anything else falls back to "pdf" (the generic page glyph) so the view renders.
function kindFromFile(name: string, mimeType: string): "pdf" | "docx" | "xlsx" {
  const ext = (name.split(".").pop() ?? "").toLowerCase();
  if (ext === "pdf" || mimeType === "application/pdf") return "pdf";
  if (ext === "docx" || ext === "doc" || mimeType.includes("word")) return "docx";
  if (ext === "xlsx" || ext === "xls" || ext === "csv" || mimeType.includes("sheet") || mimeType.includes("excel")) return "xlsx";
  return "pdf";
}

// Human-readable size string matching the fixtures ("180 KB", "1.2 MB").
function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

// "Jun 23, 2026" — matches the fixtures' `modified` display.
function displayDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export type CreateFolderInput = { id?: string; name: string; description?: string };

// Create a firm folder. RLS scopes the INSERT to the caller's firm (firm_id is
// stamped from ctx); one audit row records it.
export async function createFolder(db: Db, ctx: Ctx, input: CreateFolderInput): Promise<string> {
  const id = input.id ?? globalThis.crypto.randomUUID();
  await db.insert(firmFolders).values({
    id,
    firmId: ctx.firmId,
    name: input.name,
    description: input.description ?? null,
  });
  await writeAudit(db, ctx, { action: "firm_folder.create", resourceType: "firm_folder", resourceId: id });
  return id;
}

// firm_files.folder_id is NOT NULL, so an upload with no chosen folder needs a
// home. Reuse the firm's "Uploads" folder if it exists, else create it (audited).
export async function ensureUploadsFolder(db: Db, ctx: Ctx): Promise<string> {
  const [existing] = await db
    .select({ id: firmFolders.id })
    .from(firmFolders)
    .where(eq(firmFolders.name, "Uploads"));
  if (existing) return existing.id;
  return createFolder(db, ctx, { name: "Uploads", description: "Files uploaded from the dashboard." });
}

export type CreateFileInput = {
  id?: string;
  name: string;
  folderId: string; // firm_files.folder_id is NOT NULL — every file lives in a folder
  storagePath: string;
  sizeBytes: number;
  mimeType: string;
  owner?: string;
};

// Persist firm_files metadata after the blob is in Storage. RLS-scoped + audited.
// ts uses the upload epoch (seconds) so fresh uploads sort to the top of Recent.
export async function createFile(db: Db, ctx: Ctx, input: CreateFileInput): Promise<string> {
  const id = input.id ?? globalThis.crypto.randomUUID();
  const now = new Date();
  await db.insert(firmFiles).values({
    id,
    firmId: ctx.firmId,
    folderId: input.folderId,
    name: input.name,
    kind: kindFromFile(input.name, input.mimeType),
    size: humanSize(input.sizeBytes),
    modified: displayDate(now),
    ts: Math.floor(now.getTime() / 1000),
    owner: input.owner ?? null,
    starred: false,
    storagePath: input.storagePath,
  });
  await writeAudit(db, ctx, { action: "firm_file.create", resourceType: "firm_file", resourceId: id });
  return id;
}

// RLS-scoped read of a single file's storage_path (for signed-download resolution).
export async function fileStoragePath(db: Db, id: string): Promise<string | null> {
  const [r] = await db.select({ storagePath: firmFiles.storagePath }).from(firmFiles).where(eq(firmFiles.id, id));
  return r?.storagePath ?? null;
}

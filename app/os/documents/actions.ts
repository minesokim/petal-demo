"use server";

import { revalidatePath } from "next/cache";
import { withFirm } from "@/lib/auth/tenant";
import { setDocStatus } from "@/lib/repository/practice-writes";
import {
  createFile,
  createFolder,
  ensureUploadsFolder,
  fileStoragePath,
  filesOfHousehold,
  householdOwned,
  removeFile,
} from "@/lib/repository/documents";
import { uploadFirmFile, signedUrlForFirmFile, removeFirmFile } from "@/lib/storage/firm-files";

// Server-side upload guards (the UI hint is cosmetic; enforce here). Cap BEFORE the blob is
// read into memory, and allowlist the document/image types Petal handles.
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50 MB
const ALLOWED_UPLOAD_TYPES = new Set([
  "application/pdf", "image/png", "image/jpeg", "image/webp", "image/gif",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
  "application/vnd.ms-excel", "application/msword", "text/csv", "text/plain",
]);

// Document write-path. requestDocumentsAction records a real, audited request for
// each selected expected-doc: setDocStatus(id, "requested") runs RLS-scoped and
// appends one audit row per doc (doc.status) via the repository writer. The manual
// "Request documents" UI calls this from its existing Send handler, then
// router.refresh() re-reads the firm's docs from loadFirmData.

// Marks the given expected-docs as requested (idempotent for docs already in that
// state — the point is the audited request event). Returns how many rows changed.
export async function requestDocumentsAction(
  docIds: string[],
): Promise<{ requested: number }> {
  const ids = docIds.filter(Boolean);
  if (ids.length === 0) return { requested: 0 };
  const count = await withFirm(async (db, ctx) => {
    let n = 0;
    for (const id of ids) {
      if (await setDocStatus(db, ctx, id, "requested")) n++;
    }
    return n;
  });
  return { requested: count ?? 0 };
}

// ── firm document library: real upload + folder creation (Supabase Storage + DB) ──

// Upload one file: blob → firm-files/{firmId}/… (Storage), then a firm_files row
// (RLS-scoped + audited). Files land in the firm's "Uploads" folder unless a
// folderId is supplied (folder_id is NOT NULL). Returns the new file id.
export async function uploadDocumentAction(
  formData: FormData,
): Promise<{ id: string } | null> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > MAX_UPLOAD_BYTES) return null; // H3: cap before reading the blob (OOM/DoS)
  if (file.type && !ALLOWED_UPLOAD_TYPES.has(file.type)) return null; // type allowlist
  const folderIdRaw = formData.get("folderId");
  const folderId = typeof folderIdRaw === "string" && folderIdRaw ? folderIdRaw : undefined;
  const householdRaw = formData.get("householdId");
  const householdIdRaw = typeof householdRaw === "string" && householdRaw ? householdRaw : undefined;

  const result = await withFirm(async (db, ctx) => {
    // Only tag the file to the household if it belongs to THIS firm (reject a spoofed
    // cross-tenant household id rather than persisting it).
    const householdId = householdIdRaw && (await householdOwned(db, householdIdRaw)) ? householdIdRaw : undefined;
    const { storagePath, sizeBytes, mimeType } = await uploadFirmFile(ctx.firmId, file);
    const targetFolder = folderId ?? (await ensureUploadsFolder(db, ctx));
    const id = await createFile(db, ctx, {
      name: file.name,
      folderId: targetFolder,
      householdId,
      storagePath,
      sizeBytes,
      mimeType,
    });
    return { id };
  });
  if (result) {
    revalidatePath("/os/documents");
    if (householdIdRaw) revalidatePath(`/os/clients/${householdIdRaw}`);
  }
  return result;
}

// ── client-page document library: persisted upload zone backing the client tab ──

// "1.2 MB" / "180 KB" / "512 B" → an MB number for the uploader's size display.
function sizeToMb(size: string | null): number {
  if (!size) return 0;
  const m = size.match(/([\d.]+)\s*(KB|MB|GB|B)/i);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  const unit = m[2].toUpperCase();
  return unit === "GB" ? n * 1024 : unit === "MB" ? n : unit === "KB" ? n / 1024 : n / 1e6;
}

// The client's already-uploaded files (so the upload zone re-hydrates on load
// instead of looking empty / losing files). RLS-scoped to the firm + household.
export async function listClientFilesAction(
  householdId: string,
): Promise<{ id: string; name: string; mb: number }[]> {
  if (!householdId) return [];
  const rows = await withFirm((db, ctx) => filesOfHousehold(db, ctx.firmId, householdId));
  return (rows ?? [])
    .slice()
    .sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0))
    .map((r) => ({ id: r.id, name: r.name, mb: sizeToMb(r.size) }));
}

// Delete one of the client's files: remove the DB row (audited) AND the Storage
// blob. RLS-scoped — a firm can only delete its own files.
export async function deleteClientFileAction(
  fileId: string,
  householdId?: string,
): Promise<{ ok: boolean }> {
  if (!fileId) return { ok: false };
  const path = await withFirm((db, ctx) => removeFile(db, ctx, fileId));
  if (path) await removeFirmFile(path).catch(() => {});
  revalidatePath("/os/documents");
  if (householdId) revalidatePath(`/os/clients/${householdId}`);
  return { ok: path !== null };
}

// Create a new (empty) firm folder. RLS-scoped + audited. Returns the new id.
export async function createFolderAction(
  name: string,
  description?: string,
): Promise<{ id: string } | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const result = await withFirm(async (db, ctx) => {
    const id = await createFolder(db, ctx, { name: trimmed, description: description?.trim() || undefined });
    return { id };
  });
  if (result) revalidatePath("/os/documents");
  return result;
}

// Resolve a short-lived signed download URL for one firm file. The storage_path
// read is RLS-scoped (a firm only sees its own files); null if not found.
export async function downloadFileAction(fileId: string): Promise<{ url: string } | null> {
  if (!fileId) return null;
  return withFirm(async (db) => {
    const path = await fileStoragePath(db, fileId);
    if (!path) return null;
    const url = await signedUrlForFirmFile(path);
    return { url };
  });
}

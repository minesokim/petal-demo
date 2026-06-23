"use server";

import { revalidatePath } from "next/cache";
import { withFirm } from "@/lib/auth/tenant";
import { setDocStatus } from "@/lib/repository/practice-writes";
import {
  createFile,
  createFolder,
  ensureUploadsFolder,
  fileStoragePath,
} from "@/lib/repository/documents";
import { uploadFirmFile, signedUrlForFirmFile } from "@/lib/storage/firm-files";

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
  const folderIdRaw = formData.get("folderId");
  const folderId = typeof folderIdRaw === "string" && folderIdRaw ? folderIdRaw : undefined;

  const result = await withFirm(async (db, ctx) => {
    const { storagePath, sizeBytes, mimeType } = await uploadFirmFile(ctx.firmId, file);
    const targetFolder = folderId ?? (await ensureUploadsFolder(db, ctx));
    const id = await createFile(db, ctx, {
      name: file.name,
      folderId: targetFolder,
      storagePath,
      sizeBytes,
      mimeType,
    });
    return { id };
  });
  if (result) revalidatePath("/os/documents");
  return result;
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

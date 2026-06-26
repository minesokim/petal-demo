import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { validateUpload } from "./upload-guard";

// Server-only Supabase Storage client for the firm's file library. Uses the
// service-role key (never shipped to the browser) so we control firm-scoping at
// the application layer; storage.objects RLS is defense-in-depth on top. Blobs
// live in the private 'firm-files' bucket at {firmId}/{uuid}-{safeName}.

const BUCKET = "firm-files";

let _client: SupabaseClient | null = null;
function client(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase storage not configured (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
  }
  _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}

// Strip path separators and anything risky from a user-supplied filename so it
// can't escape the firm's folder or break the object path. Keeps the extension.
function safeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "file";
  const cleaned = base.replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^_+|_+$/g, "");
  return cleaned || "file";
}

export type UploadedFirmFile = {
  storagePath: string;
  sizeBytes: number;
  mimeType: string;
};

// Upload a File to firm-files/{firmId}/{uuid}-{safeName}. Returns the object path
// plus the size/mime the caller persists to the firm_files row.
export async function uploadFirmFile(firmId: string, file: File): Promise<UploadedFirmFile> {
  const safeName = safeFileName(file.name);
  const storagePath = `${firmId}/${globalThis.crypto.randomUUID()}-${safeName}`;
  const mimeType = file.type || "application/octet-stream";
  const bytes = new Uint8Array(await file.arrayBuffer());

  // UPLOAD HARDENING: validate size + declared MIME (allowlist) + magic bytes BEFORE storing, so an
  // oversized file, a disallowed type, or a disguised executable claiming application/pdf is rejected.
  const check = validateUpload(bytes, mimeType);
  if (!check.ok) throw new Error(`upload rejected: ${check.reason}`);

  const { error } = await client()
    .storage.from(BUCKET)
    .upload(storagePath, bytes, { contentType: mimeType, upsert: false });
  if (error) throw new Error(`firm-files upload failed: ${error.message}`);

  return { storagePath, sizeBytes: bytes.byteLength, mimeType };
}

// Upload raw bytes (not a File) to the firm-files bucket — used for inbound MMS media that we
// fetch from Twilio's media URL, where there's no browser File object. Same path convention +
// firm-scoping as uploadFirmFile.
export async function uploadFirmFileBytes(
  firmId: string,
  bytes: Uint8Array,
  name: string,
  mimeType: string,
): Promise<UploadedFirmFile> {
  const safeName = safeFileName(name);
  const storagePath = `${firmId}/${globalThis.crypto.randomUUID()}-${safeName}`;
  const contentType = mimeType || "application/octet-stream";
  const { error } = await client()
    .storage.from(BUCKET)
    .upload(storagePath, bytes, { contentType, upsert: false });
  if (error) throw new Error(`firm-files upload failed: ${error.message}`);
  return { storagePath, sizeBytes: bytes.byteLength, mimeType: contentType };
}

// Short-lived signed download URL for a stored object (private bucket — no public
// URLs). Default 60s is plenty for a window.open hand-off.
//
// TENANT GUARD (defense-in-depth over storage RLS): client() uses the service-role key, which
// BYPASSES storage.objects RLS, so we MUST confirm the object lives under the CALLER's firm
// prefix before minting a URL. Keys are `{firmId}/{uuid}-{name}` (uploadFirmFile). The required
// firmId is supplied by the caller from its trusted firm context (Clerk-derived), never from a
// model/client arg — this is what stops a crafted/model-supplied storageKey from reading another
// firm's documents. Thrown before any network call (so it is unit-testable without Supabase).
export async function signedUrlForFirmFile(storagePath: string, firmId: string, expiresInSec = 60): Promise<string> {
  if (!firmId || !storagePath.startsWith(`${firmId}/`)) {
    throw new Error("cross-firm storage access denied");
  }
  const { data, error } = await client()
    .storage.from(BUCKET)
    .createSignedUrl(storagePath, expiresInSec);
  if (error || !data?.signedUrl) throw new Error(`firm-files signed url failed: ${error?.message ?? "no url"}`);
  return data.signedUrl;
}

// Best-effort delete (used by the upload verification script and cleanup paths).
export async function removeFirmFile(storagePath: string): Promise<void> {
  await client().storage.from(BUCKET).remove([storagePath]);
}

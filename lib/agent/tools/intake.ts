// CAPABILITY 1 tools — Document intake / extraction (tier 1). The extract_document tool wraps
// the extraction core (lib/intake/extract.ts), which runs the EXISTING Ask-Petal analyze
// pipeline (AIProvider.analyzeDocument) over a stored document and returns schema-validated
// fields — and, when handed a manifest target, advances the matching fetch_requirement to
// `received` with the document as evidence.
//
// Why tier 1 even though it touches the manifest: the only mutation is stamping a requirement
// `received` from a document that actually arrived (a high-trust, recording-an-observed-fact
// write, not an external side effect). It runs under withFirm (RLS) and is gated by §7216
// (scope "synthetic" in Phase 1). requiredScopes ["intake:read"]; runTool re-checks at dispatch.

import { z } from "zod";
import type { AgentTool } from "../registry";
import { withFirm } from "@/lib/auth/tenant";
import { AnthropicProvider } from "@/lib/ai/anthropic";
import { signedUrlForFirmFile } from "@/lib/storage/firm-files";
import { extractDocument, type ExtractDeps } from "@/lib/intake/extract";

const ACCEPTED = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

const ExtractArgs = z.object({
  storageKey: z.string().min(1), // the stored object key (Supabase storage path / R2 key)
  mediaType: z.string().min(1),
  fileName: z.string().optional(),
  docTypeHint: z.string().min(1), // e.g. "W-2", "1099-NEC"
  // when present, link the extraction to this client+period manifest slot.
  clientId: z.string().optional(),
  period: z.string().optional(),
});

// Default deps for the runtime: the ZDR Anthropic provider + a storage loader that pulls the
// object via a short-lived signed URL and base64-encodes it. (Injected in tests with a
// MockProvider + an in-memory loader so extraction is deterministic and offline.)
// The loader is bound to the CALLER's firmId so signedUrlForFirmFile's tenant guard refuses any
// storageKey outside this firm's prefix — closing the cross-tenant document-read hole where a
// model-supplied key could otherwise sign another firm's object via the service-role client.
function runtimeDeps(firmId: string): ExtractDeps {
  return {
    provider: new AnthropicProvider(),
    loadBytes: async (key: string) => {
      const url = await signedUrlForFirmFile(key, firmId);
      const res = await fetch(url);
      if (!res.ok) throw new Error("document fetch failed");
      return Buffer.from(await res.arrayBuffer()).toString("base64");
    },
  };
}

const INTAKE_TOOLS: AgentTool[] = [
  {
    name: "extract_document",
    description:
      "Extract structured fields from a stored tax document (by storage key + a docType hint): " +
      "document type, tax year, named parties, key figures, and flags to double-check. If a " +
      "client+period is given, link the document to its manifest item and mark that requirement " +
      "received with the document as evidence. Governed by §7216 (gated until document-AI is " +
      "cleared).",
    tier: 1,
    access: "read",
    requiredScopes: ["intake:read"],
    schema: ExtractArgs,
    run: async (a) => {
      const args = ExtractArgs.parse(a);
      if (!ACCEPTED.has(args.mediaType)) {
        return { gated: false, fields: null, error: `unsupported_type: ${args.mediaType}` };
      }
      const doc = { storageKey: args.storageKey, mediaType: args.mediaType, fileName: args.fileName };
      const wantsLink = Boolean(args.clientId && args.period);
      // ALWAYS run inside withFirm so the loader is bound to the caller's firmId (the storage
      // tenant guard) — not only when a manifest link is requested.
      const out = await withFirm(async (db, ctx) =>
        extractDocument(
          runtimeDeps(ctx.firmId),
          {
            doc,
            docTypeHint: args.docTypeHint,
            manifest: wantsLink ? { clientId: args.clientId!, period: args.period! } : undefined,
          },
          wantsLink ? { db, ctx } : undefined,
        ),
      );
      return out ?? { gated: false, fields: null, error: "unauthorized" };
    },
    describe: (a) =>
      `Extract ${a.docTypeHint ?? "document"} from ${a.fileName ?? a.storageKey}` +
      (a.clientId ? ` and link to client ${a.clientId} (${a.period})` : ""),
  },
];

export default INTAKE_TOOLS;

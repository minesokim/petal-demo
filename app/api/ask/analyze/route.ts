// Ask Petal — document analysis. POST multipart { file } → { summary } | { gated }.
// Unlike /api/ask (general Q&A), this sends a DOCUMENT's contents to the model,
// which is real taxpayer return information.
//
// §7216 HARD GATE (non-negotiable): assertCleared("real") gates the model call.
// Until real-data AI is cleared by counsel (PETAL_7216_CLEARED=true) this route
// NEVER sends a document to the model — it returns a clear "gated" response so the
// UI is honest, and the moment the flag flips the same pipeline runs for real.
// See docs/superpowers/specs/2026-06-23-tax-ai-master-spec.md.

import { NextResponse } from "next/server";
import { AnthropicProvider } from "@/lib/ai/anthropic";
import { assertCleared } from "@/lib/ai/guard";
import { getFirmContext } from "@/lib/auth/context";
import { withFirm } from "@/lib/auth/tenant";
import { writeAudit } from "@/lib/repository/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Document analysis is a heavier task than chat — use the strong ZDR model.
const ANALYZE_MODEL = "claude-opus-4-8";
const MAX_BYTES = 25 * 1024 * 1024; // 25 MB — Anthropic's document limit ballpark
const ACCEPTED: Record<string, string> = {
  "application/pdf": "application/pdf",
  "image/png": "image/png",
  "image/jpeg": "image/jpeg",
  "image/webp": "image/webp",
  "image/gif": "image/gif",
};

const ANALYZE_SYSTEM =
  "You are Petal, a tax-practice assistant analyzing a document a preparer dropped in. " +
  "Identify the document type (e.g. W-2, 1099-NEC, K-1, prior-year 1040, brokerage statement), " +
  "extract the key figures and parties, and flag anything a preparer should double-check " +
  "(missing fields, inconsistencies, unusual amounts). Be concise and concrete. Do not invent " +
  "values that are not in the document; if a field is illegible or absent, say so.";

export async function POST(req: Request) {
  // Auth: a document is firm data — require a signed-in firm.
  const ctx = await getFirmContext().catch(() => null);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "invalid_form" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "file_required" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "file_too_large" }, { status: 413 });
  }
  const mediaType = ACCEPTED[file.type];
  if (!mediaType) {
    return NextResponse.json({ error: "unsupported_type", detail: file.type }, { status: 415 });
  }

  // §7216 GATE — the document's contents are real taxpayer data. Until cleared,
  // never send it to the model; return an honest, actionable message instead.
  try {
    assertCleared("real");
  } catch {
    return NextResponse.json(
      {
        gated: true,
        fileName: file.name,
        message:
          `I can analyze "${file.name}" — that capability is built and ready. But reading a ` +
          `client document means sending its contents to Petal's AI, which is governed by IRS ` +
          `§7216. It stays off until document-AI is cleared (a written tax-attorney opinion). ` +
          `The moment it's cleared, drop the file again and I'll extract the figures, identify ` +
          `the form, and flag anything to check.`,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  let provider: AnthropicProvider;
  try {
    provider = new AnthropicProvider();
  } catch {
    return NextResponse.json({ error: "ai_unavailable" }, { status: 503 });
  }

  try {
    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    const { text, model } = await provider.analyzeDocument({
      system: ANALYZE_SYSTEM,
      prompt: `Analyze this document (${file.name}) and report what you find.`,
      base64,
      mediaType,
      model: ANALYZE_MODEL,
    });
    // Audit the analysis (no document content in the audit row — just the event).
    await withFirm((db, c) =>
      writeAudit(db, c, { action: "document.analyze", resourceType: "document", resourceId: file.name }),
    ).catch(() => {});
    if (!text) return NextResponse.json({ error: "empty_reply" }, { status: 502 });
    return NextResponse.json({ summary: text, fileName: file.name, model }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    // Never log the raw err — analyzeDocument can throw with document-derived content.
    console.error("[/api/ask/analyze] failed:", err instanceof Error ? err.name : "unknown");
    return NextResponse.json({ error: "ai_error" }, { status: 502 });
  }
}

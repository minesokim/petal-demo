// Grounded tax-research endpoint. POST { question, taxYear?, jurisdiction? } → a verified,
// cited SourcedAnswer. This is the grounded-research counterpart to /api/tax/compute: where
// compute routes a question to a DETERMINISTIC worksheet, research answers an open tax question
// from the in-corpus PRIMARY authority (OBBBA-era statute + IRS/FTB guidance) and refuses to
// answer where it has no authority ("no citation, no claim").
//
// The defensible path: a proposer (Sonnet) drafts a grounded answer against the retrieved
// authority; a judge (Opus — a DIFFERENT model) adversarially verifies every claim resolves to
// a real chunk and that no stale/superseded figure survives. The bucket (answer | hedge |
// coverage_gap) and the currency note are DERIVED from that verification, never self-reported.
//
// §7216: a general tax question carries no taxpayer return data — this is law research, not a
// computation on a client's facts — so there is no real-data gate here. It is still auth-gated
// (a signed-in firm) so the endpoint is never hittable anonymously, mirroring the OS routes.

import { NextResponse } from "next/server";
import { getProvider } from "@/lib/ai/provider-factory";
import type { AIProvider } from "@/lib/ai/provider";
import { getFirmContext } from "@/lib/auth/context";
import { researchAnswer } from "@/lib/research/engine";
import { runWithUsageScope } from "@/lib/ai/usage-ledger";
import { persistUsageForOrg } from "@/lib/ai/usage-store";
import type { Jurisdiction } from "@/lib/tax/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const JURISDICTIONS: Jurisdiction[] = ["federal", "CA"];

export async function POST(req: Request) {
  const ctx = await getFirmContext().catch(() => null);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const question = (body as { question?: unknown }).question;
  if (typeof question !== "string" || !question.trim()) {
    return NextResponse.json({ error: "question_required" }, { status: 400 });
  }
  if (question.length > 8000) {
    return NextResponse.json({ error: "question_too_long" }, { status: 413 });
  }

  // taxYear is optional; clamp a supplied value to a sane range, default to the current TY.
  const yearRaw = Number((body as { taxYear?: unknown }).taxYear) || 2025;
  const taxYear = yearRaw >= 2020 && yearRaw <= 2030 ? yearRaw : 2025;

  // jurisdiction is optional; accept only the known jurisdictions, default to federal.
  const jRaw = (body as { jurisdiction?: unknown }).jurisdiction;
  const jurisdiction: Jurisdiction =
    typeof jRaw === "string" && (JURISDICTIONS as string[]).includes(jRaw)
      ? (jRaw as Jurisdiction)
      : "federal";

  // Proposer = Sonnet (routine grounded generation); judge = Opus (hard adversarial reasoning).
  // Prod: Anthropic (ZDR, hard-rejects non-ZDR at construction). Dev: getProvider may route to the
  // GPT-5.5 Codex-proxy provider when PETAL_DEV_INFERENCE=codex-sub (non-prod, synthetic only).
  let proposer: AIProvider;
  let judge: AIProvider;
  try {
    proposer = getProvider("claude-sonnet-4-6");
    judge = getProvider("claude-opus-4-8");
  } catch {
    return NextResponse.json({ error: "ai_unavailable" }, { status: 503 });
  }

  try {
    // judge is a SEPARATE model (Opus) from the proposer (Sonnet), passed positionally per the
    // engine contract. The internal `abstain` bucket (authority retrieved but nothing groundable)
    // renders to the user exactly like a hedge, so we map it to "hedge" for the chat wire, which
    // models the three OBSERVABLE buckets (answer | hedge | coverage_gap).
    // Scope the meter to THIS request (AsyncLocalStorage) so concurrent firms' AI cost never mixes,
    // then persist it to ai_usage best-effort — a cost-accounting failure must NEVER fail the answer
    // (honest degradation: log the error name only, return the research result regardless).
    const { result, entries } = await runWithUsageScope(() =>
      // contraSearch: run a real contrary-authority search so the §6662 weight-of-authorities standard
      // is honestly weighed (and can exceed the substantial-authority cap when warranted), not capped by
      // default. The live product weighs authority; the offline benchmark leaves it off to stay fast.
      researchAnswer(proposer, judge, question, { taxYear, jurisdiction, contraSearch: true }),
    );
    try {
      await persistUsageForOrg(ctx.clerkOrgId, entries);
    } catch (e) {
      console.error("[/api/research] ai_usage persist failed:", e instanceof Error ? e.name : "unknown");
    }
    const wireBucket = result.bucket === "abstain" ? "hedge" : result.bucket;
    return NextResponse.json(
      {
        answer: result.answer,
        citations: result.citations.map((c) => ({
          authority: c.authority,
          cite: c.cite,
          sourceUrl: c.sourceUrl,
          authorityTier: c.authorityTier,
        })),
        bucket: wireBucket,
        // Calibration reason-code (finer than bucket): grounded | indeterminate | unsettled |
        // coverage_gap | ungrounded. Lets a reviewer tell contested law from fact-dependence.
        calibration: result.calibration,
        currencyNote: result.currencyNote,
        reviewNotes: result.reviewNotes,
        // §6662 weight-of-authorities (compliance lane): standard + Form 8275 disclosure flag + scope.
        weightOfAuthority: result.weightOfAuthority,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    // Never log the raw err — name only. A grounded answer can echo a quoted question fragment,
    // so we keep the message body out of the logs entirely.
    console.error("[/api/research] failed:", err instanceof Error ? err.name : "unknown");
    return NextResponse.json({ error: "research_failed" }, { status: 502 });
  }
}

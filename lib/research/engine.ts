// GROUNDED RESEARCH PIPELINE (lib/research/engine.ts) — the architectural fix.
//
// This is the seam the research transcript failures pointed at. A naive LLM trained on
// pre-2025 law answers a 2026 SALT question with "$10,000", invents a Rev. Rul. that does
// not exist, and abstains on the OBBBA senior/overtime deductions it SHOULD answer. Three
// distinct failures, one root cause: the model was trusted to (a) supply its own facts,
// (b) police its own grounding, and (c) decide for itself when it lacks authority. This
// pipeline removes all three trusts and replaces them with code:
//
//   1. RETRIEVE  — facts come ONLY from the year+jurisdiction-filtered authority store
//                  (corpus-2025 + corpus-obbba). Superseded chunks are dropped for the
//                  target year by the store itself, so a stale pre-OBBBA figure can never
//                  reach the model. No parametric recall. (store.retrieve)
//   2. REASON    — grounded via the existing reason / reasonAndScore path. "No citation, no
//                  claim" is already enforced there: a position citing a chunkId we did not
//                  retrieve is dropped before it is scored. (lib/ai/reasoning)
//   3. VERIFY    — the 10.22(c)(1) fix. Circular 230 §10.22 imposes diligence as to accuracy:
//                  you may not rely on an authority you have not actually checked resolves. So
//                  EVERY cite the model emits is re-resolved here against the retrieved set AND
//                  checked for supersession for the target year. A cite that resolves to no
//                  retrieved chunk is FABRICATED → dropped. A cite that resolves but is
//                  superseded/out-of-year is STALE → dropped + the position downgraded. A
//                  model-proposed authority absent from the store never survives.
//   4. BUCKET    — the 3-bucket calibration fix. On-point CURRENT authority retrieved and a
//                  grounded position survives → `answer` (cite it). Genuinely indeterminate
//                  (a facts-and-circumstances doctrine or an unreleased future figure — no
//                  operative rule to retrieve) → `hedge` (list the factors). Should-be-covered
//                  but retrieval came back empty → `coverage_gap` (say so explicitly and
//                  decline). A coverage gap must NEVER masquerade as calibrated caution.
//   5. JUDGE     — a SEPARATE model adversarially checks freshness/supersession: given the
//                  target year and the surviving cites, did the answer lean on a rule stale for
//                  that year? Its verdict forces a currency note and can downgrade the answer.
//                  The model never grades its own freshness.
//
// SOURCES ON EVERYTHING: every substantive claim in an `answer` carries a citation that
// resolved to a retrieved chunk; the citation carries its sourceUrl and a code-derived
// authority tier so the preparer can see WHAT kind of authority backs it.
//
// §7216: this pipeline runs on PUBLIC authority only (statute / reg / IRS guidance text in
// the corpus). assertCleared('synthetic') is asserted at entry — NO client PII reaches the
// model here. The moment a caller routes real taxpayer return data through research, it must
// pass scope 'real' (which throws until counsel clears it via PETAL_7216_CLEARED).

import { z } from "zod";
import type { AIProvider } from "../ai/provider";
import { assertCleared, type DataScope } from "../ai/guard";
import { reasonAndScore } from "../ai/reasoning";
import { retrieve, retrieveLifecycle, type AuthorityChunk, type AuthorityType, REGISTERED_CORPUS } from "../tax/authority/store";
import { assessAuthorityWeight, type AuthorityAssessment } from "./authority-assess";
import { graphRetrieve } from "./retrieval/graph-retrieve";
import { namedCoverageGaps } from "./coverage-manifest";
import { fetchPrimary } from "./fetch/fetch-primary";
import type { Citation, Jurisdiction } from "../tax/types";
import type { ReasoningOutput } from "../ai/schema";
import { compute } from "../tax-ai/compute";
import { extractCompute, type ExtractWorksheet } from "./extract";

// ── Authority tier (the "authorityTier" on every citation) ─────────────────────────────────
// Derived in CODE from the chunk's authorityType, never declared by the model. Statute and
// regulation are PRIMARY/controlling; published IRS guidance and case law are STRONG but
// interpretive; a form instruction is the WEAKEST (informal, non-precedential). The preparer
// sees this so "right answer, weak authority" is visible rather than hidden.
export type AuthorityTier = "primary" | "interpretive" | "informal";

export function tierOfAuthority(t: AuthorityType): AuthorityTier {
  switch (t) {
    case "statute":
    case "regulation":
      return "primary";
    case "irs_guidance":
    case "case":
      return "interpretive";
    case "form_instruction":
      return "informal";
  }
}

// Coarse authority family for the existing chat wire (which renders `authority` + `cite` +
// `sourceUrl`). Derived from the cite string so the rendered label matches the workpaper.
function authorityFamily(cite: string): string {
  if (/CFR/i.test(cite)) return "CFR";
  if (/\bRTC\b/i.test(cite)) return "CA RTC";
  if (/\bFTB\b/i.test(cite)) return "FTB";
  if (/Rev\.?\s*(Proc|Rul)/i.test(cite)) return "IRS guidance";
  if (/OBBBA|P\.?L\.?\s*119/i.test(cite)) return "Public Law";
  if (/IRC|§\s*\d/i.test(cite)) return "IRC";
  return "authority";
}

// ── The output contract ────────────────────────────────────────────────────────────────────

/** One resolved, verified citation backing a substantive claim. Sources on everything. */
export type SourcedCitation = {
  chunkId: string; // the retrieved chunk it resolved to (audit anchor)
  authority: string; // coarse family (IRC / CFR / CA RTC / …) — for the existing chat wire
  cite: string; // the legal cite string a preparer writes on a workpaper
  sourceUrl: string; // official, free primary source
  authorityTier: AuthorityTier; // code-derived from the chunk's authorityType
  taxYear: number; // the year this cite was retrieved + verified for
};

/**
 * The observable shape of the answer to the user. The three graded buckets are
 * answer | hedge | coverage_gap (per tests/research/golden); `abstain` is the internal fourth
 * — the reasoning layer produced nothing groundable even though authority WAS retrieved (a
 * grounding/freshness failure, distinct from a coverage gap where retrieval itself was empty).
 * `abstain` renders to the user as a hedge but is reported distinctly so an operator can tell a
 * retrieval gap from a reasoning gap.
 */
export type AnswerBucket = "answer" | "hedge" | "coverage_gap" | "abstain";

/**
 * The CALIBRATION REASON-CODE — names WHY the answer carries the confidence it does, so a preparer
 * can tell apart failure modes that the coarse bucket conflates. The critical split: `indeterminate`
 * (the question is inherently fact-driven — give the facts and apply the test) vs `unsettled` (the
 * LAW itself is contested — conflicting/split authority), because only the latter implicates a
 * §6662 substantial-authority analysis and possible Form 8275 disclosure. Every answer carries one.
 *   grounded     → on-point current authority retrieved and a position grounded on it (bucket answer)
 *   indeterminate→ no operative rule: facts-and-circumstances / unreleased figure (bucket hedge)
 *   unsettled    → the law is genuinely contested (circuit split / contra authority) (bucket hedge)
 *   coverage_gap → a should-be-covered settled rule, but retrieval came back empty (bucket coverage_gap)
 *   ungrounded   → authority was retrieved but no position survived grounding (bucket abstain)
 */
//   fetched      → corpus had nothing, but a LIVE fetch of primary authority grounded a position
//                  on the fetched text (bucket answer; carries a verify-currency caveat)
export type CalibrationReason = "grounded" | "fetched" | "indeterminate" | "unsettled" | "coverage_gap" | "ungrounded";

/**
 * The INV-1 split's engine-derived half. When a research question is compute-flavored AND maps
 * to one of the four OBBBA worksheets AND its inputs were deterministically extractable, the
 * engine hands off to lib/tax-ai/compute() and attaches the DETERMINISTIC figure here. This is
 * NOT a model-authored claim — lib/tax produced both the number and its trace — so it is EXEMPT
 * from the model numeric gate (verifyPositions / ungroundedFigures). The model states the rule
 * and cites it; this object carries the figure.
 */
export type EngineComputation = {
  /** Which deterministic worksheet produced the figure. */
  worksheet: ExtractWorksheet;
  /** The computed amount, straight from lib/tax (cited + validated, never the model's). */
  value: number;
  /** The year the worksheet's year-specific figures were resolved for. */
  taxYear: number;
  /** The auditable worksheet trace (one line per IRS-worksheet line). */
  trace: { line: string; label: string; amount: number }[];
  /** The worksheet's own citations (authority the figure rests on). */
  citations: Citation[];
};

export type SourcedAnswer = {
  answer: string;
  citations: SourcedCitation[];
  bucket: AnswerBucket;
  /** Why the answer carries the confidence it does (finer than `bucket`). Always set. */
  calibration: CalibrationReason;
  /** Set when a freshness/supersession concern is relevant (a year-boundary or an OBBBA
   *  change). Explains WHY the figure is current, or notes the gap. */
  currencyNote?: string;
  /** What the preparer must check before adopting. Never auto-filed. */
  reviewNotes: string[];
  /** The engine-derived figure (INV-1 split). Present ONLY when the bucket is already "answer"
   *  AND the deterministic handoff succeeded — never turns an abstain into a fabricated answer. */
  computation?: EngineComputation;
  /** §6662 weight-of-authorities assessment over the grounded authority (live on `answer` only).
   *  Standard is corpus-scoped + capped at substantial-authority until a contra search is wired. */
  weightOfAuthority?: AuthorityAssessment;
};

// ── The adversarial freshness/supersession judge ────────────────────────────────────────────
// A SEPARATE model (different from `provider`, per the master spec) that does ONE job: given
// the target tax year and the cites that survived verification, decide whether the answer rests
// on a rule that is STALE for that year. Binary rubric → high judge accuracy. It never sees
// client data (public authority text only) and never recomputes anything.
const FRESHNESS_JUDGE_SYSTEM = `You are an adversarial FRESHNESS reviewer for tax research. You are
given a target tax year, a drafted answer, and the authorities it cites (each with the year it was
retrieved for). Your only job: decide whether the answer relies on a rule that is STALE or
SUPERSEDED for the target year — for example, quoting a pre-2025 figure for a 2026 question, or
treating a provision as expired when later law made it permanent. Do NOT recompute figures and do
NOT use outside knowledge of specific dollar amounts; judge only internal consistency between the
target year, the cited authority TEXT provided (and the year each was retrieved for), and the
claim. This INCLUDES figure consistency: for every dollar or percentage figure the answer states,
check it against the cited authority text you are given — if the answer presents a figure in a
role the cited text contradicts for the target year (for example calling $10,000 the cap when the
cited section's text gives the target-year cap as a larger amount and shows $10,000 only as a
floor or a prior-year value), set stale=true and explain it in issues. Use ONLY the provided cited
text for this; never introduce a figure from your own knowledge. Default stale=true if the answer
leans on an authority whose retrieved year does not include the target year. Put a one-line
plain-language status in currencyNote (empty string if nothing to note).`;

export const FreshnessVerdict = z.object({
  stale: z.boolean(), // does the answer rely on a rule stale/superseded for the target year?
  currencyNote: z.string(), // one-line note on supersession status ("" if none)
  issues: z.array(z.string()), // specific freshness concerns the preparer must check
});
export type FreshnessVerdict = z.infer<typeof FreshnessVerdict>;

// ── Options ─────────────────────────────────────────────────────────────────────────────────
export type ResearchOpts = {
  taxYear: number;
  jurisdiction: Jurisdiction;
  /** retrieval breadth (top-k chunks). Default 4 — wide enough for multi-cite answers. */
  k?: number;
  /** §7216 data scope. Public-authority research is "synthetic" (always clears). A caller that
   *  routes real taxpayer data must pass "real" (gated by PETAL_7216_CLEARED). */
  scope?: DataScope;
  /** Corpus override (tests inject a fixture). Defaults to the registered store. */
  corpus?: AuthorityChunk[];
  /**
   * Indeterminacy classifier — the ONLY thing that tells `hedge` from `coverage_gap` when
   * retrieval is empty. A question is INDETERMINATE when there is no operative rule to retrieve
   * at all: a facts-and-circumstances doctrine (employee vs. IC, reasonable comp, hobby-loss) or
   * a prediction of an unreleased future figure. Such questions SHOULD return empty from the
   * store, and the right shape is a `hedge` (list the factors), not a coverage_gap. A question
   * that SHOULD be covered (a settled, in-corpus rule) returning empty is a genuine
   * `coverage_gap`. Return true ⇒ indeterminate ⇒ hedge on empty retrieval. Defaults to a
   * conservative heuristic (INDETERMINACY_HINTS) when omitted.
   */
  isIndeterminate?: (question: string) => boolean;
  /**
   * Retrieve-on-demand. When true, a coverage gap triggers a LIVE fetch of primary authority
   * (the "third door") before abstaining: fetch → ground in the fetched text → answer with
   * calibration `fetched`. OPT-IN (default off) so tests + the golden benchmark stay offline and
   * deterministic; the agent's tax_research passes fetch:true. Queries are §7216-guarded
   * (public-law-shaped, no PII); a fetch failure or empty result falls through to the honest abstain.
   */
  fetch?: boolean;
  /** Injectable fetcher for tests (defaults to the real fetchPrimary). */
  fetchPrimary?: (question: string, taxYear: number, jurisdiction: Jurisdiction) => Promise<AuthorityChunk[]>;
  // Phase 1b cutover: use the RRF-fused authority-GRAPH retrieval (Supabase) instead of the in-memory
  // keyword corpus. Defaults to the PETAL_GRAPH_RETRIEVAL env flag; a graph error degrades to in-memory.
  useGraph?: boolean;
};

// Conservative default heuristic for indeterminacy: only the doctrines/predictions that are
// genuinely facts-driven or unreleased. Deliberately narrow — when in doubt, an empty retrieval
// is treated as a COVERAGE GAP (decline honestly), not a hedge, because a coverage gap
// masquerading as calibration is the exact failure we are fixing. Better to say "I do not have
// authority" than to dress a gap up as nuance.
const INDETERMINACY_HINTS: RegExp[] = [
  /employee or (an? )?independent contractor/i,
  /\bworker\b[^.]*\bclassif/i,
  /reasonable compensation/i,
  /\bhobby\b|hobby-loss|hobby or (a )?business/i,
  /facts and circumstances/i,
  // Predictions of not-yet-released future figures (inflation-indexed amounts published late in
  // the prior year): "What WILL the standard deduction BE for 2027".
  /\bwill\b[^.]*\bbe\b[^.]*\b20\d\d\b/i,
];

function defaultIsIndeterminate(question: string): boolean {
  return INDETERMINACY_HINTS.some((re) => re.test(question));
}

// NOTE on the `unsettled` calibration reason: it is intentionally NOT derived from the question's
// wording any more. A wording heuristic (round-2/3 "Fix 4") cannot tell "I failed to retrieve a
// settled rule" from "the law is genuinely open" — it just trusts the asker's framing, which is the
// 10a failure (calling a settled-but-unloaded 1099-K threshold "still in flux"). "unsettled" must
// come from RETRIEVED authority that is itself non-final (a proposed/reserved reg, a live circuit
// conflict in the retrieved text). The corpus carries no non-final tier yet, so `unsettled` is
// dormant — and that is honest: with nothing loaded, the truthful answer is a coverage gap, not a
// claim that the law is open. Reintroduce `unsettled` here once the corpus tags non-final authority.

// ── A retrieved cite's verification verdict (the 10.22(c)(1) fix, in code) ───────────────────
type CiteVerification =
  | { status: "verified"; chunk: AuthorityChunk } // resolves to a retrieved, current chunk
  | { status: "fabricated" } // resolves to NO chunk anywhere — model invented it
  | { status: "superseded"; supersededBy: string }; // resolves but stale/out-of-year

// Resolve one model-proposed chunkId. The retrieved set is ALREADY year+jurisdiction-filtered
// and supersession-dropped by the store, so a chunkId not in it is either fabricated OR a real
// chunk that the store filtered out (superseded / wrong year). We check the full corpus to
// distinguish the two for the audit trail — both are barred from backing a current claim.
function verifyCite(
  chunkId: string,
  retrieved: AuthorityChunk[],
  corpus: AuthorityChunk[],
  taxYear: number,
): CiteVerification {
  const hit = retrieved.find((c) => c.chunkId === chunkId);
  if (hit) return { status: "verified", chunk: hit };

  const elsewhere = corpus.find((c) => c.chunkId === chunkId);
  if (elsewhere) {
    const by = elsewhere.supersededBy ?? `not applicable to tax year ${taxYear}`;
    return { status: "superseded", supersededBy: by };
  }
  return { status: "fabricated" };
}

// ── Value-level grounding (the residual-leak fix) ────────────────────────────────────────────
// Citation-level verification proves a claim cites a real, current chunk — NOT that the claim's
// PROSE restates that chunk faithfully. A position can cite the correct §164 chunk (which states
// "$40,000") yet write "$10,000", a dollar figure pulled from the model's memory. This gate is
// deterministic: every MONETARY and PERCENTAGE figure a claim states must match a figure that
// literally appears in the text of one of the chunks that claim cites. A figure with no match is
// an ungrounded parametric leak → the position is dropped (→ a safe abstain, never a memory
// number). Years and bare counts are excluded (the freshness judge owns year currency, and those
// are rarely memory-leaked). Matching is by NUMERIC VALUE with unit expansion ($40k == $40,000,
// $15M == $15,000,000) so a formatting difference never causes a false drop.
// Thousands grouping is `\d+(?:,\d{3})*` (not `[\d,]*`) so a trailing comma is NEVER captured —
// "$505,000, but" yields "$505,000", not "$505,000, b". The unit suffix carries a trailing `\b` so a
// single letter (k/m/b) only matches a real standalone unit ("$40k", "$15 million"), not the leading
// letter of a following word ("$40,000 because" → "$40,000", not "$40,000 b"). Both bugs together had
// mis-read a grounded figure as 505 BILLION and dropped a valid position → over-abstention.
const MONEY_RE = /\$\s?\d+(?:,\d{3})*(?:\.\d+)?(?:\s?(?:k|m|b|million|billion)\b)?/gi;
const PERCENT_RE = /\d+(?:,\d{3})*(?:\.\d+)?\s?%|\d+(?:,\d{3})*(?:\.\d+)?\s*percent\b/gi;

export function figureValue(raw: string): number | null {
  const m = raw.toLowerCase().replace(/[\s,$]/g, "").match(/^(\d+(?:\.\d+)?)(k|m|b|million|billion|%|percent)?$/);
  if (!m) return null;
  let n = parseFloat(m[1]);
  switch (m[2]) {
    case "k": n *= 1e3; break;
    case "m": case "million": n *= 1e6; break;
    case "b": case "billion": n *= 1e9; break;
  }
  return n;
}

function figuresIn(text: string): { money: Set<number>; percent: Set<number> } {
  const money = new Set<number>();
  const percent = new Set<number>();
  for (const m of text.matchAll(MONEY_RE)) { const v = figureValue(m[0]); if (v != null) money.add(v); }
  for (const m of text.matchAll(PERCENT_RE)) { const v = figureValue(m[0]); if (v != null) percent.add(v); }
  return { money, percent };
}

// All numeric figure values (money and percent, merged) literally present in `text`. Used by the
// agent ground-gate as the ANCHOR set for its arithmetic-derivation check (user inputs + grounded
// authority figures); a reply figure derivable from these by simple arithmetic is not a leak.
export function figureValuesIn(text: string): number[] {
  const { money, percent } = figuresIn(text);
  return [...money, ...percent];
}

/**
 * Figures STATED in `claim` that no figure in `authorityText` supports. Money is checked against
 * money and percent against percent (so "$90" never satisfies "90%"). Returns the raw figure
 * strings for the audit trail; an empty array ⇒ every stated figure is grounded in the authority.
 */
export function ungroundedFigures(claim: string, authorityText: string): string[] {
  const authority = figuresIn(authorityText);
  const out: string[] = [];
  for (const m of claim.matchAll(MONEY_RE)) {
    const v = figureValue(m[0]);
    if (v != null && !authority.money.has(v)) out.push(m[0].trim());
  }
  for (const m of claim.matchAll(PERCENT_RE)) {
    const v = figureValue(m[0]);
    if (v != null && !authority.percent.has(v)) out.push(m[0].trim());
  }
  return out;
}

// Verify a reasoning output's positions: keep only those whose EVERY citation verified (no
// partial-credit claims) AND whose stated figures are all grounded in their cited authority,
// collecting the verified SourcedCitations and the supersession / fabrication / ungrounded notes
// for the audit trail.
function verifyPositions(
  out: ReasoningOutput,
  retrieved: AuthorityChunk[],
  corpus: AuthorityChunk[],
  taxYear: number,
  question: string,
): {
  groundedPositions: ReasoningOutput["positions"];
  citations: SourcedCitation[];
  /** the verified authority CHUNKS backing the surviving positions — the §6662 weighing input. */
  groundedChunks: AuthorityChunk[];
  fabricated: string[];
  superseded: string[];
  ungrounded: string[];
} {
  const byChunk = new Map<string, SourcedCitation>();
  const groundedChunkById = new Map<string, AuthorityChunk>();
  const fabricated: string[] = [];
  const superseded: string[] = [];
  const ungrounded: string[] = [];
  const groundedPositions: ReasoningOutput["positions"] = [];

  for (const p of out.positions) {
    // BIND THE FAITHFULNESS GATE (Phase-0): deriveTier (in reasonAndScore) floors a position to
    // "abstain" when its claims are NOT grounded in the cited sources (faithfulnessScore < 0.5),
    // structural verification failed, or there is no on-point authority. That signal was computed
    // then discarded — a live false-confidence path. Honor it: an abstain-tier position never ships,
    // even if it carries a syntactically valid citation.
    if (p.tier === "abstain") {
      const note = "claim not grounded in its cited authority (faithfulness gate)";
      if (!ungrounded.includes(note)) ungrounded.push(note);
      continue;
    }
    let positionOk = p.citations.length > 0; // no citation, no claim
    const positionChunks: AuthorityChunk[] = [];
    for (const ref of p.citations) {
      const v = verifyCite(ref.chunkId, retrieved, corpus, taxYear);
      if (v.status === "fabricated") {
        positionOk = false;
        const tag = ref.citation || ref.chunkId;
        if (!fabricated.includes(tag)) fabricated.push(tag);
      } else if (v.status === "superseded") {
        positionOk = false;
        const note = `${ref.citation || ref.chunkId} is superseded for ${taxYear} (${v.supersededBy})`;
        if (!superseded.includes(note)) superseded.push(note);
      } else {
        positionChunks.push(v.chunk);
        if (!byChunk.has(v.chunk.chunkId)) {
          byChunk.set(v.chunk.chunkId, {
            chunkId: v.chunk.chunkId,
            authority: authorityFamily(v.chunk.citation),
            cite: v.chunk.citation,
            sourceUrl: v.chunk.sourceUrl,
            authorityTier: tierOfAuthority(v.chunk.authorityType),
            taxYear,
          });
        }
      }
    }

    // VALUE-LEVEL GROUNDING: with every cite verified, a stated dollar/percent figure appearing in
    // NONE of this position's cited chunks is a parametric leak. Drop the whole position — we do
    // not ship a number the cited authority does not contain.
    if (positionOk) {
      // Ground figures against the cited authority AND the QUESTION: a number the user supplied
      // in their question (a $700,000 MAGI, a $40,000 income) is a client input the claim may
      // restate — not a memory leak. The gate's job is to catch figures the model INVENTED (not
      // in the authority and not given by the user), e.g. a stale $13.61M exemption from memory.
      const authorityText = positionChunks.map((c) => c.text).join("\n") + "\n" + question;
      const leaks = ungroundedFigures(p.claim, authorityText);
      if (leaks.length) {
        positionOk = false;
        const note = `claim states ${leaks.join(", ")} — not found in its cited authority`;
        if (!ungrounded.includes(note)) ungrounded.push(note);
      }
    }

    if (positionOk) {
      groundedPositions.push(p);
      for (const c of positionChunks) if (!groundedChunkById.has(c.chunkId)) groundedChunkById.set(c.chunkId, c);
    }
  }

  // Keep only cites that actually back a SURVIVING position — a cite attached solely to a
  // dropped position must not leak into the answer's sources.
  const keptChunkIds = new Set(groundedPositions.flatMap((p) => p.citations.map((c) => c.chunkId)));
  const citations = [...byChunk.values()].filter((c) => keptChunkIds.has(c.chunkId));
  const groundedChunks = [...groundedChunkById.values()].filter((c) => keptChunkIds.has(c.chunkId));

  return { groundedPositions, citations, groundedChunks, fabricated, superseded, ungrounded };
}

// Compose the prose answer from the surviving grounded positions. Deterministic join — the
// model's claim text (already grounding-checked) is reused verbatim; we never re-author facts
// here. Each claim carries its cites inline so SOURCES sit ON the claim.
function composeAnswer(positions: ReasoningOutput["positions"]): string {
  return positions
    .map((p) => {
      const cites = p.citations.map((c) => c.citation).join("; ");
      return cites ? `${p.claim} [${cites}]` : p.claim;
    })
    .join("\n\n");
}

// LIFECYCLE / point-in-time fallback. When normal (year-filtered) retrieval found nothing groundable for
// the asked year, but a strongly-matching provision EXISTED for other years (expired before, or not yet
// effective), answer that lifecycle fact DETERMINISTICALLY from the chunk's own year range + cite, rather
// than abstaining. The answer is built from chunk METADATA (no model arithmetic, no hallucinated figure)
// and is confidence-gated in retrieveLifecycle, so it only fires on a high-confidence out-of-year match.
function lifecycleFallback(
  question: string,
  taxYear: number,
  jurisdiction: Jurisdiction,
  corpus: AuthorityChunk[],
): SourcedAnswer | null {
  const life = retrieveLifecycle(question, { taxYear, jurisdiction }, corpus);
  if (!life) return null;
  const { chunk, boundaryYear, firstYear } = life;
  return {
    answer: `${chunk.citation} applied for tax years ${firstYear}–${boundaryYear} and terminates for tax years beginning after ${boundaryYear}, so it does not apply for tax year ${taxYear} absent new legislation enacted after that date. Confirm against current law before relying on this.`,
    citations: [{
      chunkId: chunk.chunkId,
      authority: authorityFamily(chunk.citation),
      cite: chunk.citation,
      sourceUrl: chunk.sourceUrl,
      authorityTier: tierOfAuthority(chunk.authorityType),
      taxYear,
    }],
    bucket: "answer",
    calibration: "grounded",
    currencyNote: `This provision sunset after ${boundaryYear}; verify no later legislation revived it for ${taxYear}.`,
    reviewNotes: [
      `Point-in-time answer: the provision sunset after ${boundaryYear} and does not govern ${taxYear}; answered from its statutory sunset.`,
    ],
    weightOfAuthority: assessAuthorityWeight([chunk]),
  };
}

// Retrieve-on-demand fallback used at an abstain point (empty retrieval OR corpus authority too
// tangential to ground). Fetch primary authority live, reason + ground in it through the SAME gates,
// and return a `fetched` answer — or null to fall through to the honest abstain. The fetched text is
// ephemeral (not written to the corpus). §7216 is enforced inside the source search().
async function tryFetchGround(
  provider: AIProvider,
  question: string,
  taxYear: number,
  jurisdiction: Jurisdiction,
  fetchFn: (q: string, y: number, j: Jurisdiction) => Promise<AuthorityChunk[]>,
): Promise<SourcedAnswer | null> {
  const fetched = await fetchFn(question, taxYear, jurisdiction).catch(() => [] as AuthorityChunk[]);
  if (fetched.length === 0) return null;
  const reasoned = await reasonAndScore(provider, question, fetched);
  const { groundedPositions, citations } = verifyPositions(reasoned, fetched, fetched, taxYear, question);
  if (reasoned.abstained || groundedPositions.length === 0) return null; // fetched, but nothing grounded → abstain
  const reviewNotes: string[] = [];
  for (const p of groundedPositions) reviewNotes.push(...p.reviewNotes.verify);
  reviewNotes.push(
    "Answered from a LIVE FETCH of primary authority (not the vetted corpus) — verify the cite and that it is current for the tax year before relying on it.",
  );
  return {
    answer: composeAnswer(groundedPositions),
    citations,
    bucket: "answer",
    calibration: "fetched",
    currencyNote: `Fetched live from primary authority for tax year ${taxYear}; confirm currency before filing.`,
    reviewNotes,
  };
}

// ── The pipeline ─────────────────────────────────────────────────────────────────────────────
export async function researchAnswer(
  provider: AIProvider,
  judge: AIProvider | undefined,
  question: string,
  opts: ResearchOpts,
): Promise<SourcedAnswer> {
  // §7216 HARD GATE — public authority only. Real taxpayer data must flip scope to "real".
  assertCleared(opts.scope ?? "synthetic");

  const { taxYear, jurisdiction, k = 4 } = opts;
  const corpus = opts.corpus ?? REGISTERED_CORPUS;
  const isIndeterminate = opts.isIndeterminate ?? defaultIsIndeterminate;

  // 1 — RETRIEVE. Year + jurisdiction filtered; superseded versions never enter ranking.
  // Flag-gated cutover (Phase 1b): the authority GRAPH (RRF-fused sparse+dense on Supabase) vs the
  // in-memory keyword corpus. Default stays in-memory until graph parity is proven on the golden set.
  // A graph error degrades to in-memory — HONEST DEGRADATION (a DB hiccup never crashes a research answer).
  const useGraph = opts.useGraph ?? process.env.PETAL_GRAPH_RETRIEVAL === "1";
  let retrieved: AuthorityChunk[];
  if (useGraph) {
    try {
      retrieved = await graphRetrieve(question, { taxYear, jurisdiction, k });
    } catch {
      retrieved = retrieve(question, { taxYear, jurisdiction, k }, corpus);
    }
  } else {
    retrieved = retrieve(question, { taxYear, jurisdiction, k }, corpus);
  }
  // The real fetcher distills raw authority via the proposer model; tests inject opts.fetchPrimary.
  const fetchFn = opts.fetchPrimary ?? ((q: string, y: number, j: Jurisdiction) => fetchPrimary(q, y, j, { provider }));

  // 4a — COVERAGE/CALIBRATION when retrieval is EMPTY. A genuinely INDETERMINATE question (a
  // facts-and-circumstances doctrine — a property of the question, knowable from its wording)
  // hedges. Everything else is a COVERAGE GAP: we retrieved nothing, so we say so. We do NOT call
  // it "unsettled" — claiming the law is open with zero authority in hand is the exact failure the
  // round-3 diagnostic flagged (10a). "unsettled" must come from RETRIEVED non-final authority, not
  // from the question's wording. The manifest lets us NAME the missing provision instead of a vague hedge.
  if (retrieved.length === 0) {
    // LIFECYCLE first: a sunset/effective-range question ("available in 2029?") is DETERMINABLE, not
    // indeterminate — answer it from the provision's year range before any facts-and-circumstances hedge.
    const lifeEmpty = lifecycleFallback(question, taxYear, jurisdiction, corpus);
    if (lifeEmpty) return lifeEmpty;
    if (isIndeterminate(question)) {
      return {
        answer:
          "This turns on the specific facts and circumstances, not a single bright-line rule, so I can't give a definite answer from the information provided. A licensed preparer should weigh the governing factors against the full facts.",
        citations: [],
        bucket: "hedge",
        calibration: "indeterminate",
        reviewNotes: [
          "Genuinely indeterminate: resolution depends on a facts-and-circumstances test (or an unreleased future figure), not a retrievable rule.",
          "Gather the relevant facts and apply the controlling multi-factor analysis before reaching a position.",
        ],
      };
    }
    // RETRIEVE-ON-DEMAND (the third door): before declaring a coverage gap, try a LIVE fetch of
    // primary authority and ground in it. §7216-guarded (public-law queries only, no PII); HONEST
    // DEGRADATION — a fetch failure or empty/ungroundable result falls through to the abstain below.
    // OPT-IN via opts.fetch so tests + the golden benchmark stay offline.
    if (opts.fetch) {
      const fetchedAnswer = await tryFetchGround(provider, question, taxYear, jurisdiction, fetchFn);
      if (fetchedAnswer) return fetchedAnswer;
    }
    const named = namedCoverageGaps(question, taxYear, jurisdiction);
    const gapList = named.length ? named.join(", ") : null;
    return {
      answer: gapList
        ? `I don't have authority on ${gapList} loaded in my sources, so I won't answer from memory. Check ${named.length === 1 ? "it" : "them"} directly against primary authority for tax year ${taxYear}.`
        : "I do not have current authority on this question in my sources, so I decline to answer rather than guess. This should be checked directly against primary authority for the applicable tax year and jurisdiction.",
      citations: [],
      bucket: "coverage_gap",
      calibration: "coverage_gap",
      currencyNote: gapList
        ? `Not loaded: ${gapList} (tax year ${taxYear}, ${jurisdiction}).`
        : `No in-corpus authority retrieved for tax year ${taxYear} (${jurisdiction}).`,
      reviewNotes: [
        gapList
          ? `Coverage gap: ${gapList} ${named.length === 1 ? "is" : "are"} not in the corpus (the manifest confirms it). This is a KNOWN gap, not a calibrated hedge and not "unsettled law".`
          : "Coverage gap: the authority store returned nothing on-point. This is NOT a calibrated hedge — it is a known gap in the corpus.",
        "Do not treat the absence of an answer as a conclusion; consult primary authority directly.",
      ],
    };
  }

  // 2 — REASON, grounded. The model may cite ONLY the retrieved chunkIds (enforced in
  // reasonAndScore). Positions come back stamped with a code-derived confidence tier.
  const reasoned = await reasonAndScore(provider, question, retrieved);

  // 3 — VERIFY CITATIONS (the 10.22(c)(1) fix). Re-resolve every cite; strip fabricated +
  // superseded; keep only fully grounded positions and their verified sources.
  const { groundedPositions, citations, groundedChunks, fabricated, superseded, ungrounded } = verifyPositions(
    reasoned,
    retrieved,
    corpus,
    taxYear,
    question,
  );

  // 4b — the model abstained, or every position was stripped in verification. Authority was
  // retrieved (possibly only tangentially, by keyword overlap), but nothing groundable survived.
  // Re-apply the calibration policy so this does not collapse into a single opaque "abstain":
  //   - a genuinely INDETERMINATE question (facts-doctrine / prediction) → HEDGE (list factors),
  //     even if a tangential chunk was retrieved — the indeterminacy is about the question, not
  //     the corpus;
  //   - otherwise → `abstain`: authority was retrieved but the model could not ground a position
  //     on it (a reasoning/on-point gap), surfaced to the user as a hedge but marked distinctly
  //     so an operator can tell it from a clean coverage gap.
  if (reasoned.abstained || groundedPositions.length === 0) {
    // LIFECYCLE first (same precedence as the empty-retrieval branch): a determinable sunset/effective-
    // range answer beats both an indeterminate hedge and an abstain.
    const lifeB = lifecycleFallback(question, taxYear, jurisdiction, corpus);
    if (lifeB) return lifeB;
    if (isIndeterminate(question)) {
      return {
        answer:
          "This turns on the specific facts and circumstances, not a single bright-line rule, so I can't give a definite answer from the information provided. A licensed preparer should weigh the governing factors against the full facts.",
        citations: [],
        bucket: "hedge",
        calibration: "indeterminate",
        reviewNotes: [
          "Genuinely indeterminate: resolution depends on a facts-and-circumstances test (or an unreleased future figure), not a retrievable rule.",
          "Gather the relevant facts and apply the controlling multi-factor analysis before reaching a position.",
        ],
      };
    }
    // RETRIEVE-ON-DEMAND: the corpus authority was too tangential to ground. Before abstaining, try a
    // LIVE fetch of primary authority and ground in THAT (this is the branch the remittance-tax and
    // similar real-but-unloaded questions land in). §7216-guarded; honest abstain if the fetch is empty.
    if (opts.fetch) {
      const fetchedAnswer = await tryFetchGround(provider, question, taxYear, jurisdiction, fetchFn);
      if (fetchedAnswer) return fetchedAnswer;
    }
    const reviewNotes = [
      "Authority was retrieved, but no proposed position survived grounding verification.",
      ...superseded.map((s) => `Stripped stale citation: ${s}`),
      ...fabricated.map((f) => `Stripped unresolvable citation: ${f}`),
      ...ungrounded.map((u) => `Dropped a position with an ungrounded figure (${u}); not asserting a number the cited authority does not contain.`),
    ];
    return {
      answer:
        "I found potentially relevant authority but could not ground a definite position on it, so I'm not asserting an answer. A preparer should review the retrieved authority directly.",
      citations: [],
      bucket: "abstain",
      calibration: "ungrounded",
      currencyNote: superseded.length
        ? `Some proposed citations were superseded for tax year ${taxYear} and were dropped.`
        : undefined,
      reviewNotes,
    };
  }

  // We have at least one fully grounded, current-authority-backed position → ANSWER.
  const reviewNotes: string[] = [];
  for (const p of groundedPositions) {
    reviewNotes.push(...p.reviewNotes.verify);
    if (p.reviewNotes.disclosureFlag) {
      reviewNotes.push("Disclosure flag: this position may warrant Form 8275 — confirm before filing.");
    }
  }
  for (const s of superseded) reviewNotes.push(`Dropped a superseded citation during verification: ${s}`);
  for (const f of fabricated) reviewNotes.push(`Dropped an unresolvable (fabricated) citation during verification: ${f}`);
  for (const u of ungrounded) reviewNotes.push(`Dropped a position whose stated figure was not supported by its cited authority: ${u}`);

  let currencyNote: string | undefined = superseded.length
    ? `Stale authority was proposed and dropped; the figures below reflect current law for tax year ${taxYear}.`
    : undefined;

  // 5 — JUDGE: adversarial freshness/supersession check (a SEPARATE model). It can override the
  // currency note and add review notes; if it finds the surviving answer still leans on a rule
  // stale for the target year, we DOWNGRADE to abstain rather than ship a flagged figure.
  if (judge) {
    const verdict = await runFreshnessJudge(
      judge,
      question,
      taxYear,
      groundedPositions,
      citations,
      retrieved,
      opts.scope ?? "synthetic",
    );
    if (verdict.issues.length) reviewNotes.push(...verdict.issues);
    if (verdict.currencyNote) currencyNote = verdict.currencyNote;
    if (verdict.stale) {
      return {
        answer:
          "A freshness review flagged that this answer may rely on a rule that is not current for the target tax year, so I'm not asserting it. Verify the year-effective authority before adopting.",
        citations,
        bucket: "abstain",
        calibration: "ungrounded",
        currencyNote: verdict.currencyNote || `Freshness review flagged possible supersession for tax year ${taxYear}.`,
        reviewNotes,
      };
    }
  }

  // ── INV-1 COMPUTE-HANDOFF ──────────────────────────────────────────────────────────────────
  // We are in the `answer` bucket: a grounded, current-authority position survived every gate.
  // If this question is ALSO compute-flavored — it maps to one of the four OBBBA worksheets and
  // its inputs were deterministically extractable from the text — hand off to lib/tax-ai/compute
  // for the FIGURE. The number is produced by lib/tax (cited, validated), never by the model, so
  // it is EXEMPT from the numeric gate that policed the model's prose above. The engine-derived
  // sentence we fold into `answer` is appended AFTER composeAnswer + verifyPositions have run, so
  // it never passes through ungroundedFigures (it is trustworthy by construction, not by check).
  // Guard: this only runs in the `answer` bucket and only when compute() succeeds — an abstain or
  // a failed handoff can never be turned into a fabricated number here.
  let answer = composeAnswer(groundedPositions);
  let computation: EngineComputation | undefined;
  const handoff = extractCompute(question);
  if (handoff) {
    try {
      const { worksheet, taxYear: computedYear, result } = compute(handoff.request, handoff.taxYear);
      computation = {
        worksheet: worksheet as ExtractWorksheet,
        value: result.value,
        taxYear: computedYear,
        trace: result.lines,
        citations: result.citations,
      };
      // Engine-derived sentence — NOT run through verifyPositions / the numeric gate.
      answer += `\n\nComputed by the deterministic engine: $${result.value.toLocaleString()} — see trace.`;
      reviewNotes.push(
        "The figure above was computed deterministically by lib/tax from inputs extracted from your question; confirm those inputs (and any eligibility assumptions) before relying on it.",
      );
    } catch {
      // A malformed handoff must never break the grounded answer — fall back to rule-only.
      computation = undefined;
    }
  }

  // §6662 WEIGHT-OF-AUTHORITIES (live): weigh the grounded supporting authority deterministically.
  // Corpus-scoped + capped at substantial-authority (no automated contra search yet). Surface the
  // genuinely-defensible signal: a Form 8275 disclosure recommendation when support is non-precedential.
  const weightOfAuthority = assessAuthorityWeight(groundedChunks);
  if (weightOfAuthority.disclosureRecommended) {
    reviewNotes.push(
      `Authority weight: ${weightOfAuthority.standard} — Form 8275 disclosure recommended. ${weightOfAuthority.rationale}`,
    );
  }

  return {
    answer,
    citations,
    bucket: "answer",
    calibration: "grounded",
    currencyNote,
    reviewNotes,
    computation,
    weightOfAuthority,
  };
}

// Run the adversarial freshness judge over the surviving answer. Public-authority only; the
// judge sees cites + years, never client data. Asserts its own §7216 scope (defense in depth).
async function runFreshnessJudge(
  judge: AIProvider,
  question: string,
  taxYear: number,
  positions: ReasoningOutput["positions"],
  citations: SourcedCitation[],
  retrieved: AuthorityChunk[],
  scope: DataScope,
): Promise<FreshnessVerdict> {
  assertCleared(scope);
  const answerText = positions.map((p) => p.claim).join("\n");
  // Give the judge the TEXT of each cited authority (not just its label), so it can check that
  // every figure the answer states is consistent with how the cited section actually uses it.
  const citeBlocks = citations
    .map((c) => {
      const chunk = retrieved.find((r) => r.chunkId === c.chunkId);
      const text = chunk ? `\n  text: ${chunk.text.replace(/\s+/g, " ").trim()}` : "";
      return `- ${c.cite} (retrieved for ${c.taxYear}, tier=${c.authorityTier}) ${c.sourceUrl}${text}`;
    })
    .join("\n");
  const { object } = await judge.generateObject({
    system: FRESHNESS_JUDGE_SYSTEM,
    prompt:
      `Target tax year: ${taxYear}\n\n` +
      `Question:\n${question}\n\n` +
      `Drafted answer:\n${answerText}\n\n` +
      `Cited authorities (with their text — judge figures ONLY against this):\n${citeBlocks || "(none)"}`,
    schema: FreshnessVerdict,
    maxTokens: 700,
  });
  return object;
}

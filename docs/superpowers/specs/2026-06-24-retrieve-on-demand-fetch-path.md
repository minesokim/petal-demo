# Retrieve-on-demand fetch path — design spec

**Status:** draft for review (not yet implemented)
**Goal:** turn a research coverage gap from an honest *abstain* into a *fetched + cited* answer,
without breaking the moat (cited, grounded, abstaining). This is the diagnostic's Fix 1 + Fix 2.

## Problem

Today the engine grounds only in the local corpus. A question it has no chunk for → `coverage_gap`
→ honest abstain (or, in the agent, a "Not grounded" stamp). That's safe but limited: Petal can't
answer a case-law or fresh-guidance question even though the primary source is one keyless API call
away. The fetch clients exist (GovInfo, eCFR, Federal Register, and now Tax Court DAWSON) but nothing
*wires a gap to a fetch*.

## Non-negotiable constraints (these are the whole point — do not cut them)

1. **Full-text grounding, never cite-only.** Searching DAWSON/CourtListener returns case names +
   cites. The engine must FETCH the opinion/ruling text and ground the asserted rule in that text
   (the existing figure/citation gate runs on the fetched text just like a corpus chunk). Citing a
   case for a proposition without reading it is the exact failure the moat exists to prevent.
2. **Honest degradation.** Fetch fails, times out, or returns nothing → fall back to the abstain with
   the reason ("couldn't reach the Tax Court library"), NEVER a silent guess. Surface degraded/fetched
   state to the UI. No silent fallback.
3. **§7216 in code, not by assumption.** The engine starts making outbound calls at query time. The
   query string must be public-law-shaped (a topic, a section, a cite) and pass redaction before it
   leaves the process — no taxpayer PII ever in a fetch URL. A guard asserts this, with a test.
4. **Authority weighting holds.** Rank fetched authority by the 3 axes (statute / courts by
   level+circuit / agency) and Treas. Reg. 1.6662-4(d)(3)(iii). Carry the `precedential` flag (Summary
   Opinions, PLR/TAM/CCA → never as precedent). A ruling never overrides a contrary controlling
   in-circuit holding.

## Design

A new calibration state and a fetch step between "no corpus hit" and "abstain":

```
retrieve(corpus) ──hit──> ground + cite (calibration: grounded)
       │ miss
       ▼
namedCoverageGaps(question)  ── identifies the missing provision/topic (already built)
       │
       ▼
fetchPrimary(topic, sourcePriority)  ── public-law query, redacted, §7216-guarded
       │ got text                         │ failed / empty
       ▼                                  ▼
ground in fetched text → cite        abstain with reason (calibration: coverage_gap)
(calibration: FETCHED)               + "couldn't reach <source>" if it was a fetch failure
```

- **Source priority** (from `docs/AUTHORITY_SOURCES.md`): pick by question shape. Case-law question →
  DAWSON, then CourtListener (other courts). "What does Rev. Rul./Notice say" → IRS IRB. Bill status →
  Congress.gov. Reg → eCFR/Federal Register (already wired). State → CA leginfo/FTB.
- **New `calibration: "fetched"`** — distinct from `grounded` (corpus) and `coverage_gap` (abstain).
  The UI shows it as "Answered from a live fetch of <source>, <date>" — honest about provenance.
- The fetched text is **ephemeral** (not written to the corpus) for v1; a later step can promote a
  high-value fetch into the corpus via the existing grounded-ingest pipeline.

## Files (task-by-task)

1. **`lib/research/fetch/registry.ts`** — `pickSources(question, gap)` → ordered `FetchSource[]`; each
   source has `search(query)` + `fetchText(ref)` + an `authorityTier`/`precedential` mapper. Wraps the
   existing clients (govinfo, ecfr, federal-register, tax-court) behind one interface.
2. **`lib/research/fetch/guard.ts`** — `assertPublicLawQuery(q)`: redact + reject if PII-shaped;
   throws before any outbound call. Test: a query containing an SSN/name is rejected.
3. **Tax Court text extractor** — extend `tax-court.ts`: `fetchTaxCourtText(docketNumber, entryId)` →
   resolve the presigned URL → fetch the PDF → extract text (reuse the doc pipeline used for uploads).
4. **`lib/research/engine.ts`** — after the empty-retrieval branch, call `fetchPrimary`; on text, run
   the SAME `verifyPositions` grounding gate against the fetched text; set `calibration: "fetched"`.
   On failure, keep the current `coverage_gap` abstain + attach the failure reason.
5. **Calibration plumbing** — add `"fetched"` to `CalibrationReason`, the agent `AgentCalibration`,
   `CAL_RANK`, and the petal-chat label map ("Answered from a live fetch …", not "Not grounded").
6. **Tests** — fetch-guard PII rejection; engine grounds in a stubbed fetched opinion and returns
   `fetched`; engine abstains honestly when the stubbed fetch throws; precedential weighting (a Summary
   Opinion never outranks a holding). Then re-run the golden benchmark to confirm no regression.

## Out of scope (v1)

Promoting fetches into the corpus; CourtListener token wiring (needs the key); IRS IRB HTML mapping;
caching. Those are fast-follows once the gap→fetch→ground spine is proven on DAWSON.

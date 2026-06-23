# Adversarial Security Review 001 — Petal backend

**Date:** 2026-06-22 · **Scope:** slices ①②④ + crypto/redaction · **Method:**
10-agent red-team workflow — one skeptical reviewer per surface, then an
independent verifier per finding instructed to *refute* it (mark real only if the
exploit concretely reproduces against the actual code). Surfaces reviewed:
tenant isolation / RLS, repository boundary, AI quarantine + redaction, auth
bridge, envelope crypto.

## Result: 5 findings, 1 confirmed real (fixed). Core surfaces clean.

The RLS/tenant-isolation, repository-boundary, auth-bridge, and crypto reviewers
returned **no findings** — those surfaces held up under attack (RLS `WITH CHECK`
blocks cross-firm writes, `withTenant` sets role+claims so RLS is live, the Db
union masked no real bug, `requireRole` gates writes/promotion, GCM verifies the
tag and the wrapped DEK). All 5 findings landed in the redaction layer.

| # | Finding | Verdict | Action |
|---|---|---|---|
| 1 | Credit-card / 13–19-digit account numbers not masked in free-text prompts (reachable via `anthropic.ts` → `messages.create`) | **REAL (confirmed)** | **Fixed** — `NUM_RE` masks contiguous 13–19 digit runs + dashed/spaced card groups |
| 2 | EIN format (`12-3456789`) not masked in text | refuted (value-level SSN mask + not yet wired) | Fixed anyway — `NUM_RE` covers `\d{2}-\d{7}` |
| 3 | `itin*` key names not in `SENSITIVE_KEY` | refuted (real ITIN digits caught by `SSN_RE`) | Hardened — added `itin` to key list |
| 4 | System prompt not redacted | refuted (developer-authored, not untrusted) | Hardened — `redactText` now applied to `system` too |
| 5 | `taxpayerId`/`taxpayer_id` key names not recognized | refuted (value-level mask catches the digits) | Hardened — added `taxpayer` to key list |

## Why the confirmed finding mattered
`redactText` (the only wired redaction path) masked only 9-digit SSN/ITIN
shapes. A card or long account number embedded in a prompt string — or a string
value under an innocuously-named key — egressed verbatim to the model. Mitigated
contractually (ZDR + no-training) and by Square handling card PII, but it is a
data-minimization gap the WISP claims to close, so it was fixed, not waived.

## Residual / out-of-scope (tracked in soc2-controls.md)
- Sub-processor DPAs + ZDR confirmation on the production Anthropic key.
- Storage-layer (document) encryption — arrives with slice ③.
- Prompt-injection from untrusted document text influencing *actions* is bounded
  by the AI-quarantine human gate, but warrants its own review when ④ goes live.

**Disposition:** no open holes in the reviewed surfaces after the redaction fix.
Re-run this review per slice as ③–⑧ land.

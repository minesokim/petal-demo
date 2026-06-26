// ②/① AI-layer enforcement gate. Two HARD code-enforced rules live here so they
// can't drift into "just a comment":
//
//   1. §7216 data-scope gate — assertCleared(scope) refuses to let REAL taxpayer
//      data reach the model until counsel has cleared it (PETAL_7216_CLEARED).
//      The reasoning pipeline + OLT puller run on synthetic/public data today, so
//      they call assertCleared('synthetic') (passes). The moment a caller wires in
//      real client return data it must call assertCleared('real') — which THROWS
//      unless the env flag is set, turning the §7216 master-spec HARD GATE into a
//      runtime trip-wire, not a TODO.
//
//   2. ZDR model allowlist — only the zero-data-retention-eligible models are
//      permitted. Non-ZDR models (e.g. Fable/Mythos, which require 30-day
//      retention and are not available under ZDR) are rejected before any prompt
//      is built. Centralized here so every model call shares one source of truth.

// The zero-data-retention-eligible models. ZDR + no-training are contractual at
// the account/DPA level; these are the only model IDs we will send taxpayer-
// adjacent prompts to. Fable 5 / Mythos 5 are deliberately EXCLUDED — they
// require 30-day data retention and are not offered under ZDR.
export const ZDR_MODELS = ["claude-opus-4-8", "claude-sonnet-4-6", "claude-haiku-4-5"] as const;
export type ZdrModel = (typeof ZDR_MODELS)[number];

const ZDR_SET: ReadonlySet<string> = new Set(ZDR_MODELS);

export function isZdrModel(model: string): model is ZdrModel {
  return ZDR_SET.has(model);
}

// HARD allowlist check. Throws on any model not in the ZDR set so a non-ZDR
// model (Fable/Mythos, an experimental id, a typo) can never carry a prompt to
// a non-ZDR endpoint. Call at the entry of every model invocation.
export function assertZdrModel(model: string): asserts model is ZdrModel {
  if (!isZdrModel(model)) {
    throw new Error(
      `Model "${model}" is not ZDR-eligible. Only zero-data-retention models may be used: ` +
        `${ZDR_MODELS.join(", ")}. (Non-ZDR models such as Fable/Mythos require 30-day ` +
        `retention and are not permitted for taxpayer-adjacent data.)`,
    );
  }
}

export type DataScope = "synthetic" | "real";

// HARD §7216 gate. 'synthetic' (synthetic/public data) always passes. 'real'
// (actual taxpayer return data through the model) THROWS unless real-data AI has
// been explicitly cleared via the env flag — which only flips once counsel's
// §7216 attorney opinion is in hand. This is the single code enforcement point;
// callers that could route real taxpayer data to the model MUST call this at
// their entry so the gate is enforced in code, not in a comment.
export function assertCleared(scope: DataScope): void {
  if (scope === "synthetic") return;
  if (process.env.PETAL_7216_CLEARED === "true") return;
  throw new Error(
    "§7216 gate: real taxpayer data may not be sent to the model until real-data AI is " +
      "cleared by counsel. Set PETAL_7216_CLEARED=true only after the §7216 attorney opinion " +
      "is in hand. Until then, run on synthetic/public data (assertCleared('synthetic')).",
  );
}

// DEV OVERRIDE (§7216-SAFE): may the non-ZDR codex/GPT-5.5 endpoint run on a DEPLOYED server? Only for a
// DEMO deploy that has NOT been cleared for real taxpayer data — so a REMOTE developer can test the deployed
// app on the cheap codex path without an Anthropic key. The §7216 invariant is PRESERVED: the override is
// auto-refused the instant the deploy is cleared for real data (PETAL_7216_CLEARED=true), so real taxpayer
// data can never reach a non-ZDR endpoint. Requires an explicit opt-in env flag, never on by default.
export function codexDeployOverrideAllowed(): boolean {
  return process.env.PETAL_ALLOW_CODEX_ON_DEPLOY === "1" && process.env.PETAL_7216_CLEARED !== "true";
}

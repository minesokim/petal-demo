-- Envelope-encrypt the action_proposals payload at rest. The staged-action payload can carry
-- taxpayer PII (an SMS body, a phone number, staged wage figures, bank payee/memo, the evidenced
-- artifact's field values, and the rationale label which embeds client names). RULE: all PII is
-- envelope-encrypted at rest (AES-256-GCM, lib/crypto/envelope.ts), so the structured payload moves
-- into payload_enc and the plaintext columns are written with non-PII placeholders. Non-sensitive
-- structure (tool_name, status, risk_lane/level, confidence, human_must_submit, proposer identity)
-- stays plaintext for filtering. Idempotent. Legacy rows (payload_enc null) keep their plaintext
-- columns and the readers fall back to them.

alter table public.action_proposals
  add column if not exists payload_enc text; -- AES-256-GCM { args, evidence, reviewArtifact, rationale }

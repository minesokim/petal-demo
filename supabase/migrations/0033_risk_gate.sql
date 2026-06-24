-- Risk gate + evidenced review artifact — additive columns on the existing approval gate.
-- The proposal flow, RLS (firm_id = current_firm_id()), and atomic claim are unchanged; this
-- only records, per staged action: which RISK LANE it falls in, the factors behind that, the
-- EVIDENCED REVIEW ARTIFACT a human verifies against, whether Petal is barred from performing
-- the final irreversible submit (human_must_submit), and WHO staged it (so a high-stakes
-- 'review' action cannot be self-approved). status gains a 'ready_to_submit' value for
-- human_must_submit proposals once cleared (status stays free-text — no constraint to alter).
-- Idempotent.

alter table public.action_proposals
  add column if not exists risk_lane text,                                  -- 'auto'|'confirm'|'review'|'blocked'
  add column if not exists risk_level text,                                 -- 'low'|'medium'|'high'
  add column if not exists risk_factors jsonb,                              -- RiskFactor[]
  add column if not exists human_must_submit boolean not null default false,
  add column if not exists review_artifact jsonb,                           -- ReviewArtifact (field -> source)
  add column if not exists proposed_by_user_id text,                        -- actor who staged it
  add column if not exists proposed_by_role text;                           -- their role at stage time

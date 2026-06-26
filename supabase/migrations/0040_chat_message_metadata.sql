-- Persist an assistant turn's rich answer fields (cited sources, calibration, ungrounded-figure flags)
-- alongside its text, so REOPENING a saved chat restores the same sources UI instead of rebuilding a
-- plain-text answer with the sources dropped. RULE 1: the reopened transcript must be the real answer,
-- sources and all, not a lossy text-only reconstruction.
alter table public.chat_messages add column if not exists metadata jsonb not null default '{}'::jsonb;

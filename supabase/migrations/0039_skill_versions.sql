-- VERSIONED SKILLS (agentic-OS). A skill is a reusable playbook; versioning makes each published definition
-- an immutable snapshot, so a skill_run is traceable to the EXACT playbook that produced it (audit/repro) and
-- editing a skill never rewrites history. Same stable-id + version-slice shape used for tax authorities, and
-- the global-or-firm skills RLS (global product skills are firm_id NULL; a firm versions only its own).

alter table public.skills add column if not exists version integer not null default 1;
alter table public.skill_runs add column if not exists skill_version integer;

create table if not exists public.skill_versions (
  id uuid primary key default gen_random_uuid(),
  skill_id text not null references public.skills(id) on delete cascade,
  firm_id uuid references public.firms(id) on delete cascade, -- inherits the skill's scope (NULL = global)
  version integer not null,
  definition jsonb not null,            -- immutable snapshot of the skill's fields at publish time
  published_by_user_id text,
  published_at timestamptz not null default now(),
  unique (skill_id, version)
);

create index if not exists skill_versions_skill_idx on public.skill_versions(skill_id);

alter table skill_versions enable row level security;
-- Read a version if its skill is global (firm_id NULL) or belongs to the caller's firm; write only your firm's
-- (a global skill's versions are product-managed via the service role, never a firm's RLS write).
create policy skill_versions_read on skill_versions for select to authenticated
  using (firm_id is null or firm_id = public.current_firm_id());
create policy skill_versions_write on skill_versions for all to authenticated
  using (firm_id = public.current_firm_id()) with check (firm_id = public.current_firm_id());

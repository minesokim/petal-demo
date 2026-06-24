-- Client Memory — durable per-client facts, replacing the in-memory/localStorage demo store.
-- The memory text is client PII (S-corp elections, comp figures, dependents), so it is stored
-- ENVELOPE-ENCRYPTED at rest in text_enc (the app encrypts before insert; plaintext never lands
-- here). firm_id scopes RLS exactly like the practice tables. status 'suggested' = an AI-proposed
-- memory awaiting a human confirm; 'confirmed' = active. Idempotent.

create table if not exists public.client_memory (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  household_id text not null references public.households(id) on delete cascade,
  text_enc text not null,
  source text not null,
  kind text not null check (kind in ('preference','fact','history','flag')),
  status text not null default 'confirmed' check (status in ('confirmed','suggested')),
  pinned boolean not null default false,
  created_by_user_id text,
  created_at timestamptz not null default now()
);

create index if not exists client_memory_firm_household_idx
  on public.client_memory(firm_id, household_id, created_at);

grant select, insert, update, delete on client_memory to authenticated;
alter table client_memory enable row level security;

drop policy if exists client_memory_rw on client_memory;
create policy client_memory_rw on client_memory for all to authenticated
  using (firm_id = public.current_firm_id()) with check (firm_id = public.current_firm_id());

-- AI cost ledger (persisted) — per-firm, per-operation token usage + dollar cost. The production
-- cost-dashboard substrate: the in-memory usage-ledger flushes here server-side (service role) after a
-- research call / agent run, so a firm can see live $/operation, $/client, $/season.
--
-- §7216: rows carry NO taxpayer data — only operation tag, model, token COUNTS, and cost. firm_id
-- scopes every row; RLS lets a firm READ its own spend while ONLY the system WRITES (no authenticated
-- insert/update/delete) — usage is a system-recorded fact, not user-editable. Idempotent.

create table if not exists public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  run_id text,                         -- optional correlation to an agent_runs row / request id
  operation text not null,             -- "research:reason", "agent:turn", "extraction", …
  model text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cache_read_tokens integer not null default 0,
  cache_write_tokens integer not null default 0,
  cost_usd numeric(12,6) not null default 0,   -- priced at the model's rate when recorded
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_firm_created_idx on public.ai_usage(firm_id, created_at desc);
create index if not exists ai_usage_firm_operation_idx on public.ai_usage(firm_id, operation);

-- RLS — firm-scoped READ only. Writes go through the service role (which bypasses RLS).
grant select on public.ai_usage to authenticated;
alter table public.ai_usage enable row level security;

drop policy if exists ai_usage_read on public.ai_usage;
create policy ai_usage_read on public.ai_usage for select to authenticated
  using (firm_id = public.current_firm_id());

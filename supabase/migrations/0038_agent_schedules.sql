-- Agentic-OS SCHEDULER (cron -> recurring runs). A schedule is a firm-scoped template that, when due,
-- spawns an agent_task on the same durable runtime. Recurrence is interval-based (interval_minutes) — a
-- dependency-free, deterministic MVP of "cron -> recurring runs"; next_run_at advances by the interval on
-- every fire. firm_id scopes the row directly; RLS isolates by firm exactly like agent_tasks (0028).

create table if not exists public.agent_schedules (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  client_id text references public.households(id) on delete set null,
  created_by_user_id text,
  kind text not null,                          -- the agent_task kind to spawn
  tier integer not null,                       -- INV-3 tier of the spawned task
  input jsonb not null default '{}'::jsonb,     -- the task template input
  interval_minutes integer not null,           -- recurrence cadence (e.g. 1440 = daily)
  next_run_at timestamptz not null,            -- when it next fires
  last_run_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists agent_schedules_firm_idx on public.agent_schedules(firm_id);
create index if not exists agent_schedules_due_idx on public.agent_schedules(active, next_run_at);

alter table agent_schedules enable row level security;
create policy agent_schedules_rw on agent_schedules for all to authenticated
  using (firm_id = public.current_firm_id()) with check (firm_id = public.current_firm_id());

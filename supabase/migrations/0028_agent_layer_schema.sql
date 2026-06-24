-- Phase 0 — agentic-layer data model.
--
-- The durable substrate for the agent runtime: tasks (a unit of agentic work),
-- runs (each planner/sub-agent LLM turn under a task), connections (per-firm or
-- per-client scoped credential references — secrets live OUTSIDE the DB, only a
-- secret_ref pointer here), fetch_requirements (the document-collection ledger:
-- what we still need, where it comes from, how we'll get it), action_proposals
-- (the tier-3 approval gate — a staged WRITE that executes only after a recorded
-- human approval; mirrors the existing confirmAgentAction shim), and artifacts
-- (durable outputs: briefs, drafts, computed worksheets).
--
-- INV-7: every run / proposal / approval / write is also appended to the EXISTING
-- append-only audit_log (lib/repository/audit) by the repository layer; these
-- tables are the structured state, audit_log is the immutable trail.
--
-- §7216 / tenancy: firm_id scopes every table directly EXCEPT agent_runs, which
-- inherits its firm via its parent agent_task (a run has no client data of its
-- own beyond the transcript, and is always reached through a task). RLS below
-- enforces firm isolation at the DB layer, exactly like 0027 (sms_messages) and
-- 0001 (audit_log). Idempotent: create-if-not-exists + drop-policy-if-exists.

-- ── agent_tasks ───────────────────────────────────────────────────────────────
-- One unit of agentic work. tier mirrors INV-3 (1 read / 2 propose / 3 governed
-- write / 4 scheduled). input/result are jsonb. client_id nullable (firm-level
-- tasks exist, e.g. a batch planner). created_by_user_id is the Clerk user id of
-- the preparer who launched it (null for scheduled/system tasks).
create table if not exists public.agent_tasks (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  client_id text references public.households(id) on delete set null,
  created_by_user_id text,
  kind text not null,
  tier integer not null check (tier between 1 and 4),
  status text not null default 'pending',
  input jsonb not null default '{}'::jsonb,
  result jsonb,
  created_at timestamptz not null default now()
);

-- ── agent_runs ────────────────────────────────────────────────────────────────
-- Each LLM turn under a task. parent_run_id models the planner -> sub-agent tree
-- (INV-6 compute-budget chunking). No direct firm_id: a run is reached through its
-- task, and RLS scopes it via that task's firm (see policy below). transcript is
-- the full turn (messages + tool calls) as jsonb.
create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.agent_tasks(id) on delete cascade,
  parent_run_id uuid references public.agent_runs(id) on delete cascade,
  role text not null,
  model text not null,
  input_tokens integer,
  output_tokens integer,
  transcript jsonb,
  created_at timestamptz not null default now()
);

-- ── connections ───────────────────────────────────────────────────────────────
-- A scoped credential reference (INV-4 least-privilege). secret_ref points at the
-- secret store (e.g. a vault key / Composio connection id) — the secret itself is
-- NEVER stored here and never enters model context. scopes is the granted scope
-- list. client_id nullable (firm-level connection vs per-client). Distinct from the
-- existing `connections` table (Composio toolkit state); this is the agentic-layer
-- credential ledger keyed by provider+auth_type.
create table if not exists public.agent_connections (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  client_id text references public.households(id) on delete set null,
  provider text not null,
  auth_type text not null,
  scopes jsonb not null default '[]'::jsonb,
  secret_ref text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- ── fetch_requirements ────────────────────────────────────────────────────────
-- The document-collection ledger: per client+period, one row per item we still
-- need (a W-2, a 1099, bank statements). source_type = where it comes from
-- (client_upload / connector / third_party). fetch_method = how (manual / api /
-- email). connection_id optionally links the connector that will fetch it.
-- evidence_r2_key points at the fetched artifact in R2 once obtained. client_id
-- is NOT NULL here (a requirement is always about a specific client).
create table if not exists public.fetch_requirements (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  client_id text not null references public.households(id) on delete cascade,
  period text not null,
  item text not null,
  source_type text not null,
  connection_id uuid references public.agent_connections(id) on delete set null,
  fetch_method text not null,
  status text not null default 'needed',
  assigned_to text,
  evidence_r2_key text,
  last_attempt_at timestamptz,
  created_at timestamptz not null default now()
);

-- ── action_proposals ──────────────────────────────────────────────────────────
-- The tier-3 approval gate. A write tool NEVER executes inside the agent loop; it
-- is staged here as a proposal carrying the tool_name + args + rationale + evidence
-- + confidence. A human resolves it (approved/rejected); on approval the existing
-- confirm shim re-validates and executes, stamping execution_result. firm_id direct
-- (also reachable via task) so listProposals(status) is a simple firm-scoped scan.
create table if not exists public.action_proposals (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.agent_tasks(id) on delete cascade,
  firm_id uuid not null references public.firms(id) on delete cascade,
  client_id text references public.households(id) on delete set null,
  tool_name text not null,
  args jsonb not null default '{}'::jsonb,
  rationale text not null,
  evidence jsonb,
  confidence numeric,
  status text not null default 'pending',
  resolved_by_user_id text,
  resolved_at timestamptz,
  execution_result jsonb,
  created_at timestamptz not null default now()
);

-- ── artifacts ─────────────────────────────────────────────────────────────────
-- Durable outputs of a task: a brief, a drafted reply, a computed worksheet. type
-- names the kind. Either r2_key (a blob in R2) OR content (inline jsonb) — large
-- artifacts go to R2, small structured ones stay inline.
create table if not exists public.artifacts (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.agent_tasks(id) on delete cascade,
  firm_id uuid not null references public.firms(id) on delete cascade,
  client_id text references public.households(id) on delete set null,
  type text not null,
  r2_key text,
  content jsonb,
  created_at timestamptz not null default now()
);

-- ── indexes ───────────────────────────────────────────────────────────────────
create index if not exists agent_tasks_firm_idx on public.agent_tasks(firm_id);
create index if not exists agent_tasks_firm_client_idx on public.agent_tasks(firm_id, client_id);
create index if not exists agent_tasks_status_idx on public.agent_tasks(firm_id, status);
create index if not exists agent_runs_task_idx on public.agent_runs(task_id);
create index if not exists agent_runs_parent_idx on public.agent_runs(parent_run_id);
create index if not exists agent_connections_firm_idx on public.agent_connections(firm_id);
create index if not exists agent_connections_firm_client_idx on public.agent_connections(firm_id, client_id);
create index if not exists fetch_requirements_firm_idx on public.fetch_requirements(firm_id);
create index if not exists fetch_requirements_client_period_idx on public.fetch_requirements(firm_id, client_id, period);
create index if not exists fetch_requirements_status_idx on public.fetch_requirements(firm_id, status);
create index if not exists action_proposals_firm_idx on public.action_proposals(firm_id);
create index if not exists action_proposals_task_idx on public.action_proposals(task_id);
create index if not exists action_proposals_status_idx on public.action_proposals(firm_id, status);
create index if not exists artifacts_firm_idx on public.artifacts(firm_id);
create index if not exists artifacts_task_idx on public.artifacts(task_id);
create index if not exists artifacts_firm_client_idx on public.artifacts(firm_id, client_id);

-- ── RLS — firm-scoped isolation (mirrors 0027 / 0001) ─────────────────────────
grant select, insert, update, delete on agent_tasks to authenticated;
grant select, insert, update, delete on agent_runs to authenticated;
grant select, insert, update, delete on agent_connections to authenticated;
grant select, insert, update, delete on fetch_requirements to authenticated;
grant select, insert, update, delete on action_proposals to authenticated;
grant select, insert, update, delete on artifacts to authenticated;

alter table agent_tasks enable row level security;
alter table agent_runs enable row level security;
alter table agent_connections enable row level security;
alter table fetch_requirements enable row level security;
alter table action_proposals enable row level security;
alter table artifacts enable row level security;

-- Tables with a direct firm_id: standard firm-isolation policy.
drop policy if exists agent_tasks_rw on agent_tasks;
create policy agent_tasks_rw on agent_tasks for all to authenticated
  using (firm_id = public.current_firm_id()) with check (firm_id = public.current_firm_id());

drop policy if exists agent_connections_rw on agent_connections;
create policy agent_connections_rw on agent_connections for all to authenticated
  using (firm_id = public.current_firm_id()) with check (firm_id = public.current_firm_id());

drop policy if exists fetch_requirements_rw on fetch_requirements;
create policy fetch_requirements_rw on fetch_requirements for all to authenticated
  using (firm_id = public.current_firm_id()) with check (firm_id = public.current_firm_id());

drop policy if exists action_proposals_rw on action_proposals;
create policy action_proposals_rw on action_proposals for all to authenticated
  using (firm_id = public.current_firm_id()) with check (firm_id = public.current_firm_id());

drop policy if exists artifacts_rw on artifacts;
create policy artifacts_rw on artifacts for all to authenticated
  using (firm_id = public.current_firm_id()) with check (firm_id = public.current_firm_id());

-- agent_runs has no direct firm_id: scope via the parent task's firm. A run is
-- visible/writable only when its task belongs to the caller's firm. The WITH CHECK
-- mirrors USING so a row can't be inserted/repointed under a foreign firm's task.
drop policy if exists agent_runs_rw on agent_runs;
create policy agent_runs_rw on agent_runs for all to authenticated
  using (exists (
    select 1 from public.agent_tasks t
    where t.id = agent_runs.task_id and t.firm_id = public.current_firm_id()
  ))
  with check (exists (
    select 1 from public.agent_tasks t
    where t.id = agent_runs.task_id and t.firm_id = public.current_firm_id()
  ));

-- ⑨ Ask Petal chat history — real, persisted assistant conversations.
--
-- The sidebar "Recent" list and the chat-history overlay were mock (lib/fixtures
-- firm.ts). These two tables persist the firm's own chat threads + messages so a
-- conversation survives a reload and reopens with its full transcript.
--
-- §7216: chat text is the FIRM'S OWN data, stored in their RLS-scoped DB. Nothing
-- new leaves the process — /api/ask already redacts before any model call; this
-- migration only adds at-rest storage scoped to the firm.
--
-- firm_id scopes every row; RLS (below) enforces firm isolation at the DB layer,
-- exactly like firm_folders / firm_files (0008 + 0009). Idempotent: create-if-not-
-- exists + drop-policy-if-exists so re-runs are safe.

create table if not exists public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  user_id text,
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  firm_id uuid not null references public.firms(id) on delete cascade,
  role text not null,
  content text not null,
  created_at timestamptz not null default now()
);

-- Index the message→thread fan-in and the newest-first thread listing.
create index if not exists chat_messages_thread_idx
  on public.chat_messages(thread_id);
create index if not exists chat_threads_firm_updated_idx
  on public.chat_threads(firm_id, updated_at desc);

-- ⑨ RLS — firm-scoped isolation on chat history (mirrors firm_folders / firm_files).
grant select, insert, update, delete on chat_threads, chat_messages to authenticated;
alter table chat_threads enable row level security;
alter table chat_messages enable row level security;

drop policy if exists chat_threads_rw on chat_threads;
create policy chat_threads_rw on chat_threads for all to authenticated
  using (firm_id = public.current_firm_id()) with check (firm_id = public.current_firm_id());

drop policy if exists chat_messages_rw on chat_messages;
create policy chat_messages_rw on chat_messages for all to authenticated
  using (firm_id = public.current_firm_id()) with check (firm_id = public.current_firm_id());

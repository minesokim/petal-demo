-- MMS / file attachments on a text. One row per media item (a client can send several).
-- The blob lives in the firm-files Supabase Storage bucket (same store as documents);
-- storage_path is {firm_id}/{uuid}-{name}. firm_id scopes RLS exactly like sms_messages;
-- ON DELETE CASCADE so media disappears with its parent message. Idempotent.

create table if not exists public.sms_media (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  sms_message_id uuid not null references public.sms_messages(id) on delete cascade,
  storage_path text not null,
  content_type text not null,
  name text not null,
  size_bytes integer,
  created_at timestamptz not null default now()
);

create index if not exists sms_media_message_idx on public.sms_media(sms_message_id);

-- RLS — firm-scoped isolation (mirrors sms_messages).
grant select, insert, update, delete on sms_media to authenticated;
alter table sms_media enable row level security;

drop policy if exists sms_media_rw on sms_media;
create policy sms_media_rw on sms_media for all to authenticated
  using (firm_id = public.current_firm_id()) with check (firm_id = public.current_firm_id());

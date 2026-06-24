-- SMS message persistence — texts become a thread.
--
-- sendClientSmsAction previously recorded only the audit event + Twilio sid + dest
-- (not the body), so a client's texts never formed a readable conversation. This
-- table persists every outbound (and future inbound) SMS so the client page can
-- render the thread oldest-first.
--
-- §7216: SMS body is the FIRM'S OWN client-communication data, stored in their
-- RLS-scoped DB. firm_id scopes every row; RLS (below) enforces firm isolation at
-- the DB layer, exactly like chat_threads / chat_messages (0025). household_id is a
-- soft link (on delete set null) so a deleted household doesn't erase the audit-
-- relevant message log. Idempotent: create-if-not-exists + drop-policy-if-exists.

create table if not exists public.sms_messages (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  household_id text references public.households(id) on delete set null,
  direction text not null check (direction in ('outbound','inbound')),
  body text not null,
  phone text not null,
  twilio_sid text,
  status text,
  created_at timestamptz not null default now()
);

-- The per-household thread listing (firm-scoped, oldest-first within a household).
create index if not exists sms_messages_firm_household_created_idx
  on public.sms_messages(firm_id, household_id, created_at);

-- RLS — firm-scoped isolation on SMS messages (mirrors chat_threads / chat_messages).
grant select, insert, update, delete on sms_messages to authenticated;
alter table sms_messages enable row level security;

drop policy if exists sms_messages_rw on sms_messages;
create policy sms_messages_rw on sms_messages for all to authenticated
  using (firm_id = public.current_firm_id()) with check (firm_id = public.current_firm_id());

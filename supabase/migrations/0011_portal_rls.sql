-- ⑧ Portal client isolation. A client (user_type='client') must see ONLY their
-- own household's returns + documents and their own client row — nothing else in
-- the firm. Rather than touch every firm-wide policy, we make current_firm_id()
-- return NULL for clients, so every existing `firm_id = current_firm_id()` policy
-- auto-excludes them; clients get access solely via the three policies below.

create or replace function public.current_firm_id() returns uuid language sql stable set search_path = '' as $$
  select case
    when nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'user_type' = 'client' then null
    else nullif((nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'firm_id'), '')::uuid
  end
$$;

create or replace function public.current_household_id() returns text language sql stable set search_path = '' as $$
  select nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'household_id'
$$;

-- the ONLY rows a portal client may read
create policy clients_self_read on clients for select to authenticated
  using (public.current_user_type() = 'client' and id = public.current_client_id());

create policy engagements_client_read on engagements for select to authenticated
  using (public.current_user_type() = 'client' and household_id = public.current_household_id());

create policy expected_docs_client_read on expected_docs for select to authenticated
  using (
    public.current_user_type() = 'client'
    and engagement_id in (select id from engagements where household_id = public.current_household_id())
  );

-- Petal RLS: database-enforced firm_id isolation (the security floor).
-- Claim helpers read current_setting('request.jwt.claims'), set by Supabase auth
-- at runtime or by our tenant connection. Kept in `public` so we never touch
-- Supabase's managed `auth` schema.

create or replace function public.current_firm_id() returns uuid language sql stable as $$
  select nullif((nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'firm_id'), '')::uuid
$$;
create or replace function public.current_role_claim() returns text language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'
$$;
create or replace function public.current_user_type() returns text language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'user_type'
$$;
create or replace function public.current_client_id() returns uuid language sql stable as $$
  select nullif((nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'client_id'), '')::uuid
$$;

-- `authenticated` role (exists in Supabase; created here for local PGlite).
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
end $$;
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on all functions in schema public to authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;

-- enable RLS
alter table firms enable row level security;
alter table firm_members enable row level security;
alter table clients enable row level security;
alter table audit_log enable row level security;

-- firms: any member reads; owner/admin writes
create policy firms_select on firms for select to authenticated using (id = public.current_firm_id());
create policy firms_write on firms for all to authenticated
  using (id = public.current_firm_id() and public.current_role_claim() in ('owner','admin'))
  with check (id = public.current_firm_id() and public.current_role_claim() in ('owner','admin'));

-- firm_members: any member reads; owner/admin writes
create policy members_select on firm_members for select to authenticated using (firm_id = public.current_firm_id());
create policy members_write on firm_members for all to authenticated
  using (firm_id = public.current_firm_id() and public.current_role_claim() in ('owner','admin'))
  with check (firm_id = public.current_firm_id() and public.current_role_claim() in ('owner','admin'));

-- clients: firm-scoped read/write for preparers (assignment-scoping arrives in ②)
create policy clients_rw on clients for all to authenticated
  using (firm_id = public.current_firm_id())
  with check (firm_id = public.current_firm_id());

-- audit_log: firm-scoped read + insert; append-only (no update/delete policy => denied)
create policy audit_select on audit_log for select to authenticated using (firm_id = public.current_firm_id());
create policy audit_insert on audit_log for insert to authenticated with check (firm_id = public.current_firm_id());

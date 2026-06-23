-- Supabase custom access-token hook: when a client authenticates via OTP,
-- inject firm_id / client_id / user_type so RLS scopes the portal user to their
-- firm. security definer so it can resolve any client at login (before the user
-- has claims). Registered in Supabase auth config at runtime (Task 5/8).
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_firm uuid;
  v_client uuid;
  claims jsonb;
begin
  claims := coalesce(event->'claims', '{}'::jsonb);

  select id, firm_id into v_client, v_firm
  from clients
  where supabase_user_id = (event->>'user_id')::uuid
  limit 1;

  if v_client is not null then
    claims := jsonb_set(claims, '{firm_id}', to_jsonb(v_firm::text));
    claims := jsonb_set(claims, '{client_id}', to_jsonb(v_client::text));
    claims := jsonb_set(claims, '{user_type}', to_jsonb('client'::text));
    claims := jsonb_set(claims, '{role}', to_jsonb('client'::text));
  end if;

  return jsonb_set(event, '{claims}', claims);
end;
$$;

-- In Supabase, the hook runs as supabase_auth_admin. Grant only there.
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then
    grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
    revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;
  end if;
end $$;

-- ⑧ Inject household_id into a client's JWT so portal RLS can scope by household.
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
  v_household text;
  claims jsonb;
begin
  claims := coalesce(event->'claims', '{}'::jsonb);

  select id, firm_id, household_id into v_client, v_firm, v_household
  from clients
  where supabase_user_id = (event->>'user_id')::uuid
  limit 1;

  if v_client is not null then
    claims := jsonb_set(claims, '{firm_id}', to_jsonb(v_firm::text));
    claims := jsonb_set(claims, '{client_id}', to_jsonb(v_client::text));
    claims := jsonb_set(claims, '{household_id}', to_jsonb(coalesce(v_household, '')));
    claims := jsonb_set(claims, '{user_type}', to_jsonb('client'::text));
    claims := jsonb_set(claims, '{role}', to_jsonb('client'::text));
  end if;

  return jsonb_set(event, '{claims}', claims);
end;
$$;

-- ③ Tag firm files to a client (household) so a document uploaded from the client
-- page persists AND is listed back on that client. Nullable: firm-library files
-- (uploaded from /os/documents) have no client. RLS is unchanged — firm_files is
-- already firm_id-scoped, so this only narrows WITHIN a firm's own rows.

alter table public.firm_files
  add column if not exists household_id text
  references public.households(id) on delete set null;

create index if not exists firm_files_household_idx
  on public.firm_files(household_id);

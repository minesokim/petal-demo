-- ⑧ Portal: link a client login to its household.
alter table clients add column household_id text;
alter table clients add constraint clients_household_id_fk
  foreign key (household_id) references households(id) on delete set null;

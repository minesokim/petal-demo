-- ④ Authority graph — the research-AI spine (the Phase 1 keystone).
--
-- PUBLIC reference data: statutes / regs / cases / rulings shared across ALL firms, so these tables
-- carry NO firm_id and are NOT tenant tables. RLS is read-to-all-authenticated, write-service-only
-- (the service connection bypasses RLS for ingest; an authenticated user can only SELECT).
--
-- Point-in-time VERSIONED: a node is a stable identity across versions; a version is a time-slice
-- with [valid_from, valid_to) + the tax_years it governs; edges form the citation graph. A generated
-- tsvector column + GIN index gives sparse full-text retrieval now; pgvector is enabled for the dense
-- layer to follow. Hand-written (drizzle's journal predates the 0006+ hand-written migrations).
-- Schema mirror: lib/db/schema.ts (authorityNodes / authorityVersions / authorityEdges).

create extension if not exists vector;

create type "authority_kind" as enum ('statute','regulation','case','ruling','procedure','notice','form_instruction','state');
create type "delegation_basis" as enum ('express','general_7805','skidmore');
create type "court_level" as enum ('tax','district','circuit','supreme');
create type "authority_edge_type" as enum ('cites','cited_by','superseded_by','supersedes','amends','amended_by','implements','invalidates','interprets','relies_on');
create type "authority_edge_source" as enum ('structural','extracted','llm_verified');

create table "authority_nodes" (
  "id" uuid primary key default gen_random_uuid(),
  "kind" "authority_kind" not null,
  "citation" text not null,
  "jurisdiction" text not null,
  "court_level" "court_level",
  "circuit" text,
  "created_at" timestamptz not null default now(),
  constraint "authority_nodes_citation_juris_uq" unique ("citation","jurisdiction")
);

create table "authority_versions" (
  "id" uuid primary key default gen_random_uuid(),
  "node_id" uuid not null references "authority_nodes"("id") on delete cascade,
  "valid_from" text,
  "valid_to" text,
  "tax_years" integer[] not null,
  "text" text not null,
  "source_url" text not null,
  "raw_blob_url" text,
  "content_hash" text,
  "authority_class" integer,
  "delegation_basis" "delegation_basis",
  "precedential" boolean,
  "ingested_at" timestamptz not null default now(),
  -- generated tsvector for sparse full-text retrieval (kills the keyword-overlap vocabulary cliff).
  "search" tsvector generated always as (to_tsvector('english', "text")) stored
);
create index "authority_versions_node_idx" on "authority_versions" ("node_id");
create index "authority_versions_search_idx" on "authority_versions" using gin ("search");

create table "authority_edges" (
  "id" uuid primary key default gen_random_uuid(),
  "from_version" uuid not null references "authority_versions"("id") on delete cascade,
  "to_version" uuid not null references "authority_versions"("id") on delete cascade,
  "edge_type" "authority_edge_type" not null,
  "source" "authority_edge_source" not null default 'structural',
  constraint "authority_edges_uq" unique ("from_version","to_version","edge_type")
);
create index "authority_edges_from_idx" on "authority_edges" ("from_version");
create index "authority_edges_to_idx" on "authority_edges" ("to_version");

-- RLS: public reference data → any authenticated user may READ; no write policy ⇒ writes are
-- service-only (the ingest job runs on the service connection, which bypasses RLS).
alter table "authority_nodes" enable row level security;
alter table "authority_versions" enable row level security;
alter table "authority_edges" enable row level security;
create policy "authority_nodes_read" on "authority_nodes" for select to authenticated using (true);
create policy "authority_versions_read" on "authority_versions" for select to authenticated using (true);
create policy "authority_edges_read" on "authority_edges" for select to authenticated using (true);

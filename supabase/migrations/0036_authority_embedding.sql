-- ④ Authority graph — the dense layer (Phase 1b). One embedding row per authority_version, for
-- semantic recall that closes the vocabulary-mismatch gap sparse tsvector leaves open. Free/local
-- embedding model (all-MiniLM-L6-v2, 384 dims). HNSW cosine index for fast ANN. Public reference
-- data → read-to-all-authenticated, write-service-only (mirrors the rest of the graph).
create table "authority_embedding" (
  "version_id" uuid primary key references "authority_versions"("id") on delete cascade,
  "embedding" vector(384) not null,
  "model" text not null,
  "created_at" timestamptz not null default now()
);
create index "authority_embedding_hnsw" on "authority_embedding" using hnsw ("embedding" vector_cosine_ops);

alter table "authority_embedding" enable row level security;
create policy "authority_embedding_read" on "authority_embedding" for select to authenticated using (true);

# ② Core Data Model — Implementation Plan

**Goal:** Persist the practice-management spine (households → entities → engagements → expectedDocs, plus tasks/notices/skills) under `firm_id` RLS, with a repository whose selectors return shapes byte-identical to `lib/fixtures/firm.ts`, so the dashboard UI wires 1:1 later by swapping the fixture import for the repository.

**Architecture:** Same pattern as ① — Drizzle schema + RLS (`firm_id = public.current_firm_id()`) + PGlite tests + service/tenant split. **Text primary keys matching the fixture ids** (e.g. `h-chen`, `e-chen-1040`) so seed data ports 1:1 and any id-based UI routing is identical. Nested sub-objects (`owners`, `fields`, `proposedActions`, `messages`, `graduation`, …) are `jsonb`. Fixture date strings stored as `text` for exact passthrough. Money fields `integer` (returns JS number, not numeric-string).

## Global Constraints (inherit ①)
- RLS mandatory on every table (`firm_id` policy); no PII in audit.
- Repository selectors mirror the EXACT fixture function names + return shapes (the UI seam). Derived values (derive.ts) stay computed in app code — never columns.
- TDD, PGlite, frequent commits. Build in `backend` worktree; no deploy from this plan.

## Entities (this slice)
`households` · `people` · `entities` · `engagements` · `expected_docs` · `skills` · `notices` · `tasks`.
Deferred to later slices: `skillRuns`/`activity`/`workpapers`/`positions` (④ AI/provenance), `threads` (messaging), `brief`/`booksItems` (secondary surfaces), `firmFiles` (③ documents/storage).

## Cross-layer note
Fixture member ids (`u-antonio`) and the ① `firm_members` uuid rows are different layers. `preparer`/`assigneeId`/`runId`/`noticeId`/`k1FlowsTo` are **plain text (no FK)** for now; mapped to real Clerk members at UI-wiring time. Enforced FKs only on the strict containment hierarchy (people/entities/engagements → household; expected_docs → engagement; tasks/notices → household). The ① `clients` table is the portal-auth account (links a Supabase login to a household later in ⑧) — distinct from `households`.

## Tasks
1. Schema (8 tables) + generate migration `0004_practice_schema`.
2. RLS migration `0005_practice_rls` — enable RLS + firm-scoped policy on each; cross-tenant isolation test (PGlite) green.
3. Repository selectors mirroring fixture seams (`households`, `householdById`, `peopleOf`, `entitiesOf`, `engagementsOf`, `engagementById`, `docsOfEngagement`, `tasksOf`, `taskById`, `noticesOf`, `skills`/`skillById`) + audited writes; per-group tests.
4. Seed loader (fixtures → DB) for the cloud project, gated behind a script (not run until creds + verify step).

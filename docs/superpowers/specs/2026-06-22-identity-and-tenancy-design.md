# ① Identity & Tenancy — Design Spec

**Date:** 2026-06-22
**Status:** Approved (design). Next: implementation plan (writing-plans).
**Parent:** `2026-06-22-platform-foundation-and-roadmap.md`

## Goal

The load-bearing first slice: real authentication and **database-enforced tenant isolation** so every
later slice can assume "the current user is authenticated and scoped to exactly one firm." Nothing
else gets built until this is solid.

**Success =** a preparer signs into their firm and sees only that firm's data; a client signs into the
portal via OTP and sees only their own records; RLS makes cross-tenant access *physically impossible*
even with a buggy query; every mutation is audited.

## Tenant model

- **Firm = a Clerk Organization.** The Clerk org id maps to a `firms.id`; `firm_id` is the tenant key
  on every row in the system.
- **Preparers = Clerk org members.** A preparer **may belong to multiple firms** (multi-office /
  contractor reality); the **active org** is the session's `firm_id`. Switching org switches tenant.
- **Clients = Supabase Auth users** (passwordless OTP), each represented by a `clients` row scoped to
  exactly **one** firm. The same human at two firms = two client records (clean isolation; rare).
  Clients are **not** Clerk users and are never org members.

## Roles & permissions

Clerk org roles, mirrored into the JWT `role` claim and enforced in both RLS write policies and the
service layer.

| Role | Firm settings | Members | Billing | Client/return data | Approve AI / sign-off |
|---|---|---|---|---|---|
| **Owner** | ✓ | ✓ | ✓ | all | ✓ |
| **Admin** | ✓ | ✓ | — | all | ✓ |
| **Reviewer** | — | — | — | all | ✓ |
| **Preparer** | — | — | — | assigned | — (draft only) |

- Read access to client/return data is firm-wide for Owner/Admin/Reviewer; Preparers are limited to
  assigned work (enforced in ② via an assignment table + policy; in ① the role claim is established).
- "Approve AI / sign-off" gates promotion of quarantined AI output and final review sign-off (used in ④).

## Auth → RLS bridge (the critical mechanism)

1. **Preparers (Clerk):** a Clerk **JWT template** issues a token containing
   `firm_id` (active org id), `role` (active org role), `user_type: "preparer"`, `sub` (Clerk user id).
   Supabase is configured to accept **Clerk as a third-party auth provider** (JWKS), so Supabase
   `auth.jwt()` exposes these claims to RLS.
2. **Clients (Supabase Auth OTP):** the client authenticates directly with Supabase email/SMS OTP. A
   Supabase **auth hook / custom access-token hook** stamps `firm_id`, `client_id`, and
   `user_type: "client"` onto their JWT from their `clients` row.
3. **RLS baseline (every table):** `USING (firm_id = (auth.jwt() ->> 'firm_id')::uuid)`.
   - Writes additionally gated by `role` (e.g., settings tables require Owner/Admin).
   - Client-readable tables additionally gated by `user_type = 'client' AND client_id = (auth.jwt() ->> 'client_id')::uuid`.
4. **Service layer** still re-checks authorization (defense in depth); RLS is the floor, not the only gate.

## Data model (introduced in ①)

All tables carry `firm_id uuid not null` and have RLS enabled. Drizzle migrations.

- **`firms`** — `id` (uuid, = mapped Clerk org), `clerk_org_id`, `name`, `settings jsonb`,
  `billing_customer_id`, timestamps. Mirror of the Clerk org, kept in sync via webhook.
- **`firm_members`** — `id`, `firm_id`, `clerk_user_id`, `role` (enum: owner/admin/reviewer/preparer),
  `name`, `email`, `credential`, `active`, timestamps. Synced from Clerk org-membership webhooks.
  Backs the existing **Settings → Members** UI and the assignee picker.
- **`clients`** — `id`, `firm_id`, `supabase_user_id` (nullable until first OTP login), `name`,
  `email`, `phone`, `status`, timestamps. (Rich client/household fields land in ②; ① is identity only.)
- **`audit_log`** — append-only: `id`, `firm_id`, `actor_type` (preparer/client/system), `actor_id`,
  `action`, `resource_type`, `resource_id`, `metadata jsonb`, `created_at`. No raw PII in `metadata`.

## UI wiring (existing mockup → real)

- **Preparer sign-in:** Clerk `<SignIn>` + **organization switcher** in the OS shell; gate `/os/*`.
- **Settings → Members:** the existing roster screen becomes real Clerk member + role management
  (invite, change role, deactivate), reading `firm_members`.
- **Client portal:** the existing OTP screen wires to Supabase OTP; gate `/portal/*`.
- **Sync:** Clerk **webhooks** (`organization.created/updated`, `organizationMembership.created/
  updated/deleted`) upsert `firms` / `firm_members`. A Supabase auth trigger links `clients.supabase_user_id`
  on first client login.

## Security & compliance (this slice's portion of the cross-cutting track)

- RLS policies on all four tables (the isolation floor).
- `audit_log` born here, written by the service layer on every mutation; used by every later slice.
- MFA available for preparers via Clerk; enforce for Owner/Admin.
- Envelope-encryption helper (KMS / Supabase Vault) **introduced** here for future SSN/bank fields,
  even though ① stores no SSNs yet — so ② can use it from day one.
- Test posture: an explicit **cross-tenant isolation test** (firm A's JWT cannot read firm B's rows)
  is part of ①'s acceptance, run in CI.

## Out of scope for ① (deferred)

- The rich client/household/return/task/document schema → ②.
- Billing UI and Stripe wiring → ⑦.
- Document storage/encryption specifics → ③.
- Assignment-based preparer read-scoping enforcement → ② (role claim established here).

## Acceptance criteria

1. A preparer signs in (Clerk), lands in their firm, and the OS shell scopes all reads to that firm.
2. Switching org (multi-firm preparer) switches the visible tenant with no leakage.
3. A client signs in via Supabase OTP and can reach only their own portal records.
4. RLS blocks a hand-crafted query using firm A's JWT from returning any firm B row (CI test).
5. Inviting/role-changing/deactivating a member in Settings → Members reflects in Clerk and `firm_members`.
6. Every mutation writes an `audit_log` row.

## Open implementation questions (resolve during writing-plans)

- Clerk ↔ Supabase third-party-auth wiring specifics (JWKS URL, claim mapping) — confirm against
  current Clerk + Supabase docs at build time.
- Whether `firms.id` equals the Clerk org id directly or a mapped uuid (favor a mapped uuid + unique
  `clerk_org_id` for flexibility).

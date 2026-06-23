# Petal Backend — Platform Foundation & Roadmap

**Date:** 2026-06-22
**Status:** Approved (foundation + sequencing). Per-slice specs follow.

## Context

Petal is a feature-complete UI mockup (`/os` dashboard + `/portal` client app) running entirely
on fixtures, deployed to petal-os.vercel.app. This document records the decision to turn it into a
real **multi-tenant SaaS** and the foundation every build slice sits on. Two earlier, partial
backend visions exist in-repo and are superseded by this document: `docs/BACKEND_ARCHITECTURE.md`
(Convex) and the hermes Next-BFF in the `docket-personal` worktree. We keep two good ideas from
them — the **AI-quarantine pattern** (Convex doc) and the **repository/service boundary** (hermes).

## Target

**Full multi-tenant SaaS** — many firms, isolated, from day one. This is the highest-consequence
isolation problem (many firms' client PII under one roof) and drives every decision below.

## Foundation (decided)

| Concern | Decision |
|---|---|
| Store + isolation | **Supabase Postgres + Row-Level Security** (`firm_id` on every row), **Drizzle** ORM |
| Firm/preparer auth | **Clerk Organizations** (firm = org; preparers = members with roles) |
| Client auth | **Supabase Auth OTP** — persistent passwordless accounts, one per firm |
| Service layer | **Next.js / Vercel** route handlers + server actions behind a **repository boundary** (UI is source-agnostic) |
| Background work | **Inngest** — AI runs, connector sync, scheduled jobs (estimates, transcript sweeps, OLT pulls) |
| AI | **Anthropic SDK direct** (ZDR + no-training + DPA), **Zod** structured outputs, no LangChain, behind an `AIProvider` adapter (swappable to Bedrock/Vertex if a customer demands VPC) |
| Connectors | **Composio** (API/MCP: Gmail, Drive, Calendar) + the **browser extension** (OLT), both normalized into Postgres |
| AI safety | AI writes land in **quarantine tables** (`pending_review`); a human promotes; autonomy tier gates auto-acting |

### Why Postgres + RLS over Convex
Convex has no database-level row security — isolation would be 100% app-layer discipline, where one
missed `firm_id` filter leaks tax PII across tenants. Postgres RLS enforces `firm_id = current_tenant`
**underneath** the app code: even a buggy query physically cannot return another firm's rows.

## Cross-cutting: Security & compliance (SOC 2 posture + WISP)

Not a phase — a standing posture every slice adheres to. Goal: build/operate to SOC 2 controls now so
a future Type II audit is evidence-collection, not a re-architecture. Also satisfies the IRS Pub 4557
**WISP** (Written Information Security Plan) that tax preparers are required to maintain.

- **Isolation:** RLS (`firm_id`) + least-privilege roles.
- **Encryption:** Supabase at-rest + TLS, **plus app-level envelope encryption for crown-jewel PII**
  (SSN, bank/routing) with keys in a KMS / Supabase Vault — a DB dump never exposes SSNs.
- **AI data minimization:** send the model only what a task needs; redact/tokenize SSN-class fields
  when irrelevant to the task. ZDR + minimization is belt-and-suspenders.
- **Audit:** append-only `audit_log` on every mutation and AI run (actor, action, resource, `firm_id`,
  prompt version, model, tokens, reviewer, decision). Logs reference sources, never raw PII.
- **Vendors:** DPA + SOC 2 report from every subprocessor (Supabase, Vercel, Clerk, Inngest, Anthropic
  confirmed; Composio to verify) → maintained subprocessor list.
- **Access:** MFA for preparers (Clerk), session management, secret management (no secrets in code).

## Build roadmap (slices, in dependency order)

Each slice gets its own spec → implementation plan → build. Foundation scaffolding precedes ①.

- **Phase 0 — Scaffolding:** Supabase project, Drizzle migrations, Clerk, Inngest, env, repository
  skeleton, RLS baseline + the `firm_id` claim convention.
- **① Identity & tenancy:** firms (Clerk orgs) + preparer roles; client OTP; JWT → RLS; `firms` /
  `firm_members` / `clients` / `audit_log` tables + policies; sign-in/invite on the real UI.
  *(Spec: `2026-06-22-identity-and-tenancy-design.md`.)*
- **② Core data model + service layer:** canonical schema (households, engagements/returns, tasks,
  documents, messages, notices, AI-quarantine) with RLS everywhere; the repository the UI reads/writes;
  mockup surfaces move onto the real (empty) DB.
- **③ Documents:** Storage upload, expected-docs checklist, OCR/extraction (Inngest → fields → quarantine).
- **④ AI orchestration:** agents/capabilities → real Claude runs (Inngest) → drafts to quarantine →
  Review queue promotes; provenance/citations; autonomy tiers gate auto-acting.
- **⑤ Connectors (Composio):** Gmail/Drive/Calendar OAuth → sync into the model; the Apps page goes real.
- **⑥ Browser automation (OLT):** the extension + OLT adapter (ranked locators + read-back reconciliation)
  + the "Pull from OLT" capability on real pulls.
- **⑦ Payments:** Stripe/Square deposits ($50 policy applied-to-bill/forfeit-on-no-show) + fee tracking.
- **⑧ Portal end-to-end:** intake + e-sign (8879 / engagement letter / §7216) + messaging on real data —
  a client goes intake → worked → filed.

**Sequencing:** ①②③ are the spine. After the spine, prefer thin vertical slices through a single
real workflow (e.g., "client uploads a W-2 → Petal extracts → preparer reviews") over building each
subsystem fully-wide, so the whole stack (auth + RLS + jobs + AI + review) is exercised early.

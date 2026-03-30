# Vazant/Docket Tax SaaS — Full Backend Architecture Plan

## Context

The vazant-dashboard-v2 is a feature-complete UI mockup with 26+ features running entirely on mock data. It needs a real backend that two apps connect to: (1) the preparer dashboard (Antonio) and (2) a client-facing portal. The stakes are existential — accountants' licenses are on the line. One wrong calculation pushed to a return, one data leak between clients, one double-charge, and the company is done.

This plan covers: database choice, schema, API layer, auth, file storage, AI safety, real-time, payments, integrations, audit trail, error handling, client app strategy, and a phased migration path.

---

## Decision: Supabase (PostgreSQL)

**Not Convex. Not Firebase. Not PlanetScale+Prisma.**

### Why Supabase wins on the five non-negotiable dimensions:

| Dimension | Supabase (PostgreSQL) | Convex | Firebase |
|---|---|---|---|
| **ACID transactions** | Native, battle-tested for 30+ years | Yes but proprietary engine, young | No cross-document ACID |
| **Row-Level Security** | Native — enforced at DB level even if API has bugs | None — must enforce in every query function | Security rules (less mature) |
| **Compliance audit** | Auditors understand PostgreSQL, SOC 2 path clear | Black box to every compliance auditor | Google SOC 2, but NoSQL concerns |
| **Reporting/Analytics** | SQL is the language of reporting | Custom aggregation functions needed | Limited query capabilities |
| **Exit strategy** | Standard PostgreSQL — migrate to RDS/Cloud SQL in hours | Total rewrite if Convex fails | Firestore export is painful |

### The regulatory reality:
- **IRS Circular 230**: Requires due diligence in tax preparation
- **GLBA (Gramm-Leach-Bliley Act)**: Financial data protection
- **IRC Section 7216**: Tax preparer confidentiality — criminal penalties for unauthorized disclosure
- **SOC 2**: Required path for any B2B SaaS handling financial data

PostgreSQL + RLS means even if your application code has a bug, the database itself prevents cross-client data leakage. This is defense-in-depth that Convex simply cannot offer.

---

## Schema Design (36 tables)

### Settings Tables (added after settings rebuild)

```
ero_config
├── id (UUID, PK)
├── preparer_id (FK → preparers)
├── signature_name (TEXT) — as printed on 8879
├── ero_confirmed (BOOLEAN) — authorization acknowledgment
├── last_verified_at (TIMESTAMPTZ)
├── returns_signed_count (INT)
├── last_signature_date (DATE)
├── created_at, updated_at

payment_config
├── id (UUID, PK)
├── preparer_id (FK → preparers)
├── default_deposit_amount (NUMERIC, default 50)
├── payment_terms (ENUM: due_on_receipt, net_7, net_15, net_30)
├── auto_invoice_on_review (BOOLEAN, default true)
├── auto_reminder_enabled (BOOLEAN, default true)
├── auto_reminder_days (INT, default 7)
├── send_receipts (BOOLEAN, default true)
├── refund_policy_text (TEXT, nullable)
├── stripe_account_id (TEXT)
├── created_at, updated_at

portal_config
├── id (UUID, PK)
├── preparer_id (FK → preparers)
├── logo_url (TEXT, nullable)
├── welcome_message (TEXT)
├── custom_domain (TEXT, nullable)
├── messaging_enabled (BOOLEAN, default true)
├── stage_messages (JSONB) — {collecting: "...", preparation: "...", ...}
├── created_at, updated_at

checklist_templates
├── id (UUID, PK)
├── preparer_id (FK → preparers)
├── tier_id (FK → service_tiers)
├── items (TEXT[]) — ordered list of required doc types
├── created_at, updated_at

legal_document_templates
├── id (UUID, PK)
├── preparer_id (FK → preparers)
├── name (TEXT) — "Engagement Letter", "7216 Consent", "Privacy Policy"
├── description (TEXT)
├── storage_path (TEXT)
├── version (INT)
├── last_updated_at (TIMESTAMPTZ)
├── created_at

ai_config
├── id (UUID, PK)
├── preparer_id (FK → preparers)
├── draft_tone (ENUM: professional, friendly)
├── auto_draft_enabled (BOOLEAN, default true)
├── nudge_after_days (INT, default 3)
├── personality_prompt (TEXT)
├── insight_toggles (JSONB) — {audit_risk: true, deadline_warnings: true, ...}
├── created_at, updated_at

reminder_config
├── id (UUID, PK)
├── preparer_id (FK → preparers)
├── intake_followup_days (INT, default 2)
├── document_reminder_days (INT, default 7)
├── document_escalation_days (INT, default 14)
├── deposit_reminder_days (INT, default 5)
├── client_review_nudge_days (INT, default 3)
├── re_remind_frequency_days (INT, default 5)
├── max_reminders (INT, default 3)
├── quiet_hours_enabled (BOOLEAN, default true)
├── quiet_hours_start (INT, default 20) — hour of day
├── quiet_hours_end (INT, default 8)
├── created_at, updated_at

notification_preferences
├── id (UUID, PK)
├── preparer_id (FK → preparers)
├── preferences (JSONB) — {doc_uploaded: {inApp: true, email: false, push: true}, ...}
├── quiet_hours_enabled (BOOLEAN)
├── quiet_hours_start (INT)
├── quiet_hours_end (INT)
├── created_at, updated_at
```

### Core Entities

```
preparers
├── id (UUID, PK)
├── user_id (FK → auth.users)
├── firm_name, preparer_name, email, phone
├── ptin, efin
├── avatar_url
├── created_at, updated_at

service_tiers
├── id (UUID, PK)
├── preparer_id (FK → preparers)
├── name, description, price (NUMERIC)
├── includes (TEXT[])
├── sort_order
├── created_at, updated_at

clients
├── id (UUID, PK)
├── preparer_id (FK → preparers) ← RLS key
├── full_name, email, phone
├── filing_status (ENUM: single, mfj, mfs, hoh, qw)
├── service_tier_id (FK → service_tiers)
├── type (ENUM: individual, business)
├── business_name (nullable)
├── avatar_url
├── client_status (ENUM: pending, active, declined)
├── portal_user_id (FK → auth.users, nullable)
├── last_portal_login, last_activity
├── consent_7216 (BOOLEAN), consent_engagement (BOOLEAN)
├── notes (TEXT)
├── scheduled_call (TIMESTAMPTZ, nullable)
├── created_at, updated_at, deleted_at (soft delete)

tax_returns
├── id (UUID, PK)
├── client_id (FK → clients)
├── preparer_id (FK → preparers)
├── tax_year (INT)
├── return_stage (ENUM: new_intake, collecting_docs, ready_to_prep,
│   in_preparation, client_review, pay_and_sign, filed)
├── fee_amount (NUMERIC)
├── deposit_required (NUMERIC)
├── urgency (ENUM: low, normal, high, urgent)
├── olt_reference_id (nullable)
├── extension_filed (BOOLEAN)
├── extension_date (DATE, nullable)
├── filed_date (DATE, nullable)
├── return_sent_date (DATE, nullable)
├── form_8879_signed_client (BOOLEAN)
├── form_8879_signed_ero (BOOLEAN)
├── form_8879_signed_at (TIMESTAMPTZ, nullable)
├── created_at, updated_at

return_stage_transitions (IMMUTABLE — no UPDATE, no DELETE)
├── id (UUID, PK)
├── return_id (FK → tax_returns)
├── from_stage, to_stage
├── actor_id (FK → auth.users)
├── reason (TEXT, nullable)
├── created_at
```

### Documents

```
documents
├── id (UUID, PK)
├── client_id (FK → clients)
├── preparer_id (FK → preparers)
├── return_id (FK → tax_returns, nullable)
├── file_name, file_size (BIGINT)
├── mime_type, storage_path
├── sha256_checksum (for integrity verification)
├── doc_type (ENUM: w2, 1099_nec, 1099_int, 1099_div, 1099_b,
│   1099_r, 1099_misc, schedule_k1, bank_statement, id_front,
│   id_back, engagement_letter, consent_7216, prior_return, other)
├── category (ENUM: income, business, identity, deductions, returns, agreements)
├── status (ENUM: uploaded, processing, extracted, reviewed, error)
├── uploaded_by (ENUM: client, preparer)
├── viewed_by_preparer (BOOLEAN)
├── created_at, updated_at, deleted_at

document_checklist
├── id (UUID, PK)
├── client_id (FK → clients)
├── return_id (FK → tax_returns)
├── doc_type (ENUM)
├── label (TEXT)
├── required (BOOLEAN)
├── received (BOOLEAN)
├── document_id (FK → documents, nullable)
├── requested_at, received_at
├── created_at, updated_at
```

### Communication

```
messages
├── id (UUID, PK)
├── client_id (FK → clients)
├── preparer_id (FK → preparers)
├── sender_type (ENUM: client, preparer, system)
├── sender_id (FK → auth.users, nullable for system)
├── content (TEXT)
├── attachments (JSONB[]) — [{fileName, fileSize, storageUrl, mimeType}]
├── system_card (JSONB, nullable) — {type, title, description, actionUrl}
├── read_by_preparer (BOOLEAN)
├── read_by_client (BOOLEAN)
├── created_at

client_notes
├── id (UUID, PK)
├── client_id (FK → clients)
├── preparer_id (FK → preparers)
├── content (TEXT)
├── created_at, updated_at
```

### Time & Calendar

```
time_entries
├── id (UUID, PK)
├── client_id (FK → clients)
├── preparer_id (FK → preparers)
├── duration_seconds (INT)
├── activity (ENUM: prep, review, call, filing, follow_up, meeting)
├── note (TEXT, nullable)
├── date (DATE)
├── created_at

appointments
├── id (UUID, PK)
├── client_id (FK → clients)
├── preparer_id (FK → preparers)
├── title, description
├── start_time, end_time (TIMESTAMPTZ)
├── type (ENUM: video, phone, in_person)
├── location (TEXT, nullable)
├── google_event_id (TEXT, nullable)
├── meet_link (TEXT, nullable)
├── color (TEXT, nullable)
├── created_at, updated_at
```

### Payments

```
invoices
├── id (UUID, PK)
├── client_id (FK → clients)
├── return_id (FK → tax_returns)
├── preparer_id (FK → preparers)
├── type (ENUM: deposit, balance, full)
├── amount (NUMERIC)
├── status (ENUM: draft, sent, paid, overdue, void)
├── stripe_invoice_id (TEXT, nullable)
├── due_date (DATE)
├── sent_at, paid_at (TIMESTAMPTZ, nullable)
├── created_at, updated_at

payment_records
├── id (UUID, PK)
├── invoice_id (FK → invoices)
├── client_id (FK → clients)
├── preparer_id (FK → preparers)
├── amount (NUMERIC)
├── stripe_payment_intent_id (TEXT)
├── idempotency_key (TEXT, UNIQUE) ← prevents double-charges
├── status (ENUM: pending, succeeded, failed, refunded)
├── created_at, updated_at
```

### Actions & Todos

```
action_items
├── id (UUID, PK)
├── client_id (FK → clients, nullable)
├── preparer_id (FK → preparers)
├── category (ENUM: document, signature, schedule, payment,
│   pipeline, escalation, nudge)
├── title, description
├── priority (ENUM: critical, high, medium, low)
├── ai_draft (TEXT, nullable)
├── is_resolved (BOOLEAN)
├── resolved_at (TIMESTAMPTZ, nullable)
├── created_at, updated_at

todo_items
├── id (UUID, PK)
├── preparer_id (FK → preparers)
├── client_id (FK → clients, nullable)
├── content (TEXT)
├── completed (BOOLEAN)
├── source (ENUM: manual, voice, ai)
├── created_at, updated_at
```

### AI Quarantine Tables (NEVER touch production data directly)

```
document_extractions
├── id (UUID, PK)
├── document_id (FK → documents)
├── client_id (FK → clients)
├── preparer_id (FK → preparers)
├── document_type (TEXT)
├── overall_confidence (NUMERIC 0-1)
├── fields (JSONB) — [{fieldName, value, confidence, needsReview}]
├── status (ENUM: pending_review, approved, rejected, edited)
├── approved_by (FK → auth.users, nullable)
├── approved_at (TIMESTAMPTZ, nullable)
├── model_version (TEXT)
├── created_at, updated_at

compliance_alerts
├── id, client_id, preparer_id, return_id
├── severity (ENUM: critical, warning, info)
├── title, description
├── form_required (TEXT, nullable)
├── fine_risk (TEXT, nullable)
├── status (ENUM: pending_review, acknowledged, dismissed, resolved)
├── reviewed_by, reviewed_at
├── model_version
├── created_at

anomaly_alerts
├── id, client_id, preparer_id, return_id
├── metric, prior_year_value, current_year_value
├── change_percent (NUMERIC)
├── ai_explanation (TEXT)
├── status (ENUM: pending_review, flagged, confirmed_ok, adjusted)
├── reviewed_by, reviewed_at
├── created_at

deduction_suggestions
├── id, client_id, preparer_id, return_id
├── deduction_type, description
├── estimated_savings (NUMERIC)
├── status (ENUM: pending_review, applied, dismissed)
├── reviewed_by, reviewed_at
├── created_at

extension_predictions
├── id, client_id, preparer_id, return_id
├── probability (NUMERIC 0-1)
├── factors (TEXT[])
├── created_at

estimated_tax_calcs
├── id, client_id, preparer_id, return_id
├── q1, q2, q3, q4 (NUMERIC)
├── total_estimated (NUMERIC)
├── basis (TEXT)
├── status (ENUM: draft, sent_to_client, acknowledged)
├── created_at
```

### System

```
audit_log (IMMUTABLE — INSERT only, no UPDATE/DELETE grants)
├── id (UUID, PK)
├── actor_id (FK → auth.users)
├── actor_type (ENUM: preparer, client, system)
├── action (TEXT) — e.g., 'return.stage_changed', 'document.uploaded'
├── resource_type (TEXT) — e.g., 'tax_return', 'document'
├── resource_id (UUID)
├── changes (JSONB) — {old: {...}, new: {...}}
├── ip_address (INET)
├── created_at

portal_invites
├── id (UUID, PK)
├── client_id (FK → clients)
├── preparer_id (FK → preparers)
├── email (TEXT)
├── token (TEXT, UNIQUE)
├── expires_at (TIMESTAMPTZ)
├── accepted_at (TIMESTAMPTZ, nullable)
├── created_at

voice_dump_sessions
├── id (UUID, PK)
├── preparer_id (FK → preparers)
├── audio_storage_path (TEXT)
├── transcript (TEXT)
├── parsed_items (JSONB) — [{type, content, clientId, confidence}]
├── status (ENUM: recording, transcribing, parsed, reviewed)
├── created_at
```

---

## API Layer: Next.js Server Actions + Supabase Client

**Not REST. Not tRPC. Not GraphQL.**

The app is Next.js on Vercel. Server Actions are the native pattern. Every mock data import gets replaced by a `db/` query file that returns the same TypeScript shape:

```
lib/
  supabase/
    server.ts       — createServerClient (cookies-based)
    client.ts       — createBrowserClient (for Realtime)
    middleware.ts    — Auth session refresh
  db/
    clients.ts      — getClients(), getClient(id), createClient(), updateClient()
    returns.ts      — getReturn(), transitionStage() (with state machine validation)
    documents.ts    — getDocuments(), uploadDocument(), getChecklist()
    messages.ts     — getThread(), sendMessage()
    payments.ts     — createInvoice(), getPaymentSummary()
    audit.ts        — logAction() (called by all other db/ files)
    ...
  validators/
    *.schema.ts     — Zod schemas for every mutation
```

**Client portal** uses the Supabase JS client directly with RLS. Same database, different auth role, different data visibility.

---

## Auth Strategy

**Single-tenant for now** (just Antonio), but schema supports multi-preparer later via `preparer_id` FK on every table. No wasted effort — the column exists from day one, we just don't need the multi-tenant UI yet.

| | Preparer App | Client Portal |
|---|---|---|
| **Method** | Email/password + Google OAuth | Magic link (email) |
| **Session** | HTTP-only cookie, 30-min timeout | HTTP-only cookie, 15-min timeout |
| **Role** | `preparer` in user metadata | `client` in user metadata |
| **RLS** | Sees all own clients | Sees only own data |

**Client portal**: Existing separate project (already in progress). Backend changes are welcome — we'll point it at the same Supabase project. Share types via a published npm package or a shared `@vazant/types` workspace.

---

## AI Safety: The Quarantine Pattern

**This is the most important architectural decision.**

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│  AI Service  │ ──→ │ Quarantine Table  │ ──→ │  Human      │
│  (Claude,    │     │ status:           │     │  Reviews &  │
│   Textract,  │     │ 'pending_review'  │     │  Approves   │
│   Doc AI)    │     │                   │     │             │
└─────────────┘     └──────────────────┘     └──────┬──────┘
                                                     │
                                              status → 'approved'
                                              audit_log entry created
                                                     │
                                              ┌──────▼──────┐
                                              │ Production   │
                                              │ Data         │
                                              └─────────────┘
```

**Rules:**
1. AI output NEVER writes to `clients`, `tax_returns`, `documents`, or `payment_records` directly
2. AI output ALWAYS goes to a quarantine table with `status: 'pending_review'`
3. Human MUST approve before data is promoted
4. Every approval creates an `audit_log` entry with the reviewer's ID
5. Every AI output stores `model_version` for traceability
6. All AI features are labeled "AI Suggestion" or "Docket Intelligence" in the UI — never presented as fact

---

## Real-Time: Supabase Realtime

- **Messages**: Both apps subscribe to `messages` table filtered by `client_id`
- **Document uploads**: Preparer subscribes to `documents` table changes
- **Return stage changes**: Client subscribes to `tax_returns` for their return
- **Low-frequency data** (notes, time entries, settings): Standard revalidation via `revalidatePath()`

---

## Payments: Stripe

```
Preparer creates invoice
    → INSERT into invoices (status: 'draft')
    → Create Stripe PaymentIntent
    → UPDATE invoice (status: 'sent', stripe_invoice_id)
    → Client receives payment link

Client pays via Stripe Checkout
    → Stripe webhook: payment_intent.succeeded
    → INSERT into payment_records (with idempotency_key UNIQUE)
    → UPDATE invoice (status: 'paid')
    → IF return fully paid + return complete → unlock 8879 signing
    → INSERT system message to chat
    → INSERT audit_log entry
```

**Double-charge prevention**: `idempotency_key` UNIQUE constraint on `payment_records`. Webhook handler checks existence before inserting.

**8879 gate**: Database function `can_sign_8879(return_id)` → returns TRUE only if stage = `pay_and_sign` AND all invoices for that return have status = `paid`.

---

## Error Handling: Three-Layer Defense

**Layer 1 — Zod (application)**: Every input validated. Return stage transitions validated against state machine map.

**Layer 2 — PostgreSQL constraints (database)**: FK, ENUM, CHECK, UNIQUE, NOT NULL. Stage transition trigger validates `from_stage → to_stage` is legal. Prevents invalid data even if Zod is bypassed.

**Layer 3 — RLS (access)**: Even if Layers 1 and 2 fail, RLS prevents cross-client data access. Defense in depth.

---

## Client Portal Connection

Separate Next.js app → same Supabase project. Different auth role. RLS handles everything.

```
dashboard.vazant.co  →  Preparer app  →  role: preparer
portal.vazant.co     →  Client app    →  role: client
                              ↓
                     Same Supabase project
                     Same database
                     RLS isolates data
```

Client portal features: upload docs, view return status (Realtime), sign 8879, pay via Stripe, message preparer.

---

## Migration Path (10-Phase Incremental)

The key insight: every page imports from `@/lib/mock-data.ts` etc. We replace one import at a time. UI never changes.

| Phase | Week | What |
|---|---|---|
| 1 | 1-2 | Supabase project, schema migrations, RLS, auth, seed from mock data |
| 2 | 2-3 | Replace mock imports: clients list, client detail, overview |
| 3 | 3-4 | Documents (upload to Storage + checklist), notes (CRUD), time entries |
| 4 | 4-5 | Real-time messaging (both apps), Supabase Realtime subscriptions |
| 5 | 5-6 | Stripe payments: invoices, checkout, webhooks, 8879 payment gate |
| 6 | 6-7 | AI pipeline: OCR (Textract/Document AI), message drafts (Claude), compliance checks |
| 7 | 7-8 | AI intelligence: anomaly detection, deduction suggestions, extension predictions |
| 8 | 8-9 | Client portal: new Next.js app, magic link auth, all client-facing features |
| 9 | 9 | Integrations: Google Calendar sync, Meet links, Gmail reference |
| 10 | 10 | Audit trail triggers, compliance review, SOC 2 prep, load testing |

---

## Key Files to Modify

- `lib/mock-data.ts` → types stay, data replaced by `lib/db/clients.ts` queries
- `lib/documents-mock-data.ts` → replaced by `lib/db/documents.ts`
- `lib/actions-mock-data.ts` → replaced by `lib/db/actions.ts` + AI quarantine queries
- `lib/messages-data.ts` → replaced by `lib/db/messages.ts` + Realtime
- `components/time-tracker.tsx` → globalEntries replaced by Supabase persistence
- Every page in `app/dashboard/(auth)/` → change imports from mock to db

---

## AI Provider Strategy (Performance per Dollar, Zero-Error Priority)

The AI in this app falls into two categories with very different requirements:

**Category 1 — Structured extraction (OCR, field parsing)**
→ **AWS Textract** ($1.50/1000 pages) or **Google Document AI** ($1.50/1000 pages)
- These are deterministic extraction engines, not LLMs. They don't hallucinate field values — they read what's on the page.
- Confidence scores per field. Anything below 95% gets flagged for human review.
- For W-2s and 1099s specifically, both have pre-built "specialized models" trained on these exact form layouts.
- **Recommendation**: Google Document AI for W-2/1099 specialized processors. AWS Textract as fallback.

**Category 2 — Text intelligence (message drafts, compliance explanations, anomaly summaries)**
→ **GPT-4o-mini** for drafts ($0.15/1M input, $0.60/1M output) — 90% of text tasks
→ **GPT-4o** for complex analysis ($2.50/1M input, $10/1M output) — compliance checks, anomaly analysis
→ **Claude Sonnet 4** as alternative ($3/1M input, $15/1M output) — if GPT-4o quality insufficient

Why this tiering:
- Message drafts are low-stakes (human reviews before sending) → cheap model is fine
- Compliance checks are high-stakes → needs the best reasoning model
- Neither model's output EVER touches production data without human approval (quarantine pattern)
- At 20-100 clients, even the expensive model costs <$30/month

**Why not Opus 4.6**: At $15/1M input + $75/1M output, it's 5-30x more expensive than GPT-4o for tasks where GPT-4o performs comparably. Reserve Opus-class models for if/when you need multi-step tax law reasoning.

**The real safety net is not the model — it's the quarantine pattern.** Even a perfect model gets human review. Even a hallucinating model can't corrupt data.

## Cost Estimate

- **Supabase Pro**: $25/month (8GB database, 100GB storage, 500K edge invocations)
- **Vercel Pro**: $20/month per app × 2 = $40/month
- **Stripe**: 2.9% + $0.30 per transaction (pass-through or absorb)
- **Google Document AI**: ~$5-15/month at 20-100 clients (seasonal: higher in Jan-Apr)
- **GPT-4o-mini** (drafts): ~$5/month
- **GPT-4o** (compliance): ~$10-30/month
- **Total**: ~$105-155/month to run everything

---

## Summary

**Supabase** because PostgreSQL + RLS = the only architecture where a code bug cannot leak client data between preparers or between clients. The quarantine pattern ensures AI never corrupts tax data. The migration is incremental — one mock import replaced at a time, UI untouched. Two apps (preparer + client) share one Supabase project with RLS handling access control.

# Docket Backend Architecture — Convex

## Decision: Convex

Convex is the backend. It has no database-level RLS, so security is enforced with extreme discipline at the application layer. Every query and mutation function must explicitly verify authorization. This document defines the architecture that makes this safe.

---

## Security Architecture: Defense Without RLS

### Layer 1: Auth Middleware (every function)
Every query and mutation starts with an auth check. No exceptions.

```typescript
// helpers/auth.ts — used in EVERY function
export async function requirePreparer(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  const preparer = await ctx.db
    .query("preparers")
    .withIndex("by_user_id", q => q.eq("userId", identity.subject))
    .unique();
  if (!preparer) throw new Error("Not a preparer");
  return preparer;
}

export async function requireClient(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  const client = await ctx.db
    .query("clients")
    .withIndex("by_portal_user_id", q => q.eq("portalUserId", identity.subject))
    .unique();
  if (!client) throw new Error("Not a client");
  return client;
}
```

### Layer 2: Ownership Verification (every data access)
After auth, every query filters by the authenticated user's scope. Preparers see only their clients. Clients see only their own data.

### Layer 3: Audit Trail (every mutation)
Every write logs to an append-only audit table with actor, action, resource, and changes.

### Security Rules
1. NEVER write a query/mutation without `requirePreparer()` or `requireClient()` first
2. NEVER query a table without filtering by `preparerId` or `clientId`
3. NEVER skip audit logging on client data mutations
4. Code review mandatory for every PR touching `convex/`

---

## AI Quarantine Pattern

All AI outputs go to quarantine tables with `status: "pending_review"`. Human approval required before promotion. Audit log records who approved what and when.

---

## Portal-to-Dashboard Data Flow

When a client completes portal intake:
1. Client record created with `intakeAnswers` JSON
2. Document checklist auto-generated from answers
3. Appointment created from selected time slot
4. Payment record created from $50 deposit
5. System message posted ("New intake completed")
6. Action item created for Antonio

Client messages flow to Antonio's Messages page. System auto-responses (status, docs, payment) use `senderType: "system"`.

---

## AI Provider Strategy

- Google Document AI for OCR ($1.50/1K pages)
- GPT-4o-mini for drafts ($0.60/1M output)
- GPT-4o for compliance ($10/1M output)
- All output quarantined until human approval

---

## Cost: ~$80-110/month

Convex Pro $25 + Vercel Pro $40 (2 apps) + AI ~$15-45 + Stripe pass-through

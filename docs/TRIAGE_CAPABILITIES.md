# Triage — Full Capability Reference

**Last updated:** 2026-05-26
**Owner:** Petal preparer-dashboard team
**Status:** Demo-complete · production wiring pending

This document is the single reference for what Petal's Triage page can surface, how each capability is sourced, what trust tier governs autonomy, and what production integration powers it. Treat it as the contract between the dashboard UI and the backend / Convex layer that will replace the current mock data.

---

## 1. Architecture in one paragraph

Triage is the **single decision queue for an entire CPA practice**. Every actionable signal — Petal's own AI analysis, inbound data from connected systems (Xero, QuickBooks, Plaid, Gusto, DocuSign, IRS e-Services, etc.), team handoffs, regulatory deadlines, client messages requiring a decision, and manual bookmarks the user wants to defer — surfaces as a `TriageIssue` record with a consistent shape (urgency tier, trust tier, evidence, recommended reply, deep-link). The user works the queue top-to-bottom; Petal handles or pre-stages everything else.

Source of truth: `lib/triage-mock-data.ts` (mock data + types + helpers). Page: `app/dashboard/(auth)/triage/page.tsx`.

---

## 2. The data model

```ts
interface TriageIssue {
  id: string;
  tier: "right_now" | "today" | "waiting" | "needs_review";
  type: TriageIssueType;       // see §4 below
  typeLabel: string;            // human-readable
  clientId: string;
  clientName: string;
  clientAvatar?: string;

  // Narrative
  title: string;
  needsResponseBy?: string;     // urgency one-liner
  whyNow: string;               // 2-3 sentences

  // Optional supporting evidence
  signal?: { via: string; timestamp: string; quote: string };
  evidence?: { type: "file" | "calculation" | "transaction"; label: string; detail: string }[];

  // Context + confidence
  context: string[];
  confidence: "High" | "Medium" | "Low";

  // Recommendation
  recommendation: string;
  recommendedReply?: string;    // Petal-drafted message body

  sources: string[];            // citations as small pills
  estimatedMin: number;

  // Autonomy
  trustTier?: "auto" | "drafts" | "asks" | "manual";

  // Timeline (optional, falls back to derived)
  timeline?: TimelineEvent[];

  // Cross-system metadata
  sourceIntegrationId?: string; // e.g. "xero" — drives the source chip
  deepLink?: { label: string; href: string; integrationId: string };
}
```

**Why this shape:** every triage card needs to answer five questions before Antonio decides — *what is it, why now, what's the evidence, what's the recommendation, what data did this come from?* The fields map 1:1.

---

## 3. Urgency vs autonomy — two orthogonal axes

| Axis | Values | Drives |
|---|---|---|
| **Urgency tier** (`tier`) | `right_now` · `today` · `waiting` · `needs_review` | Section grouping in the queue |
| **Trust tier** (`trustTier`) | `auto` · `drafts` · `asks` · `manual` | What Petal will do without asking |

These are independent. A `right_now` item can be `auto` (Petal already handled it; you're seeing the receipt) or `manual` (Petal won't touch it; you must act).

### Trust tier semantics
- **auto** — Petal already did the work. You see the receipt.
- **drafts** — Petal pre-drafted the action. You approve before send.
- **asks** — Petal flagged the issue. You make the call.
- **manual** — Petal won't touch this. Human-only.

---

## 4. All triage types — capability matrix

There are **~38 distinct triage types** as of 2026-05-26, grouped by family.

### A. Core return workflow (per client) — 16 types

| Type | What it surfaces | Default trust tier | Audit risk |
|---|---|---|---|
| `document_gap` | Missing required documents from client | drafts | 6 |
| `signature` | Form 8879 ERO countersignature needed | asks | 0 |
| `extension_risk` | Filing deadline at risk; extension recommended | drafts | 14 |
| `meeting_prep` | Pre-call brief generated for upcoming meeting | auto | 0 |
| `payment` | Deposit / balance / fee status changes | drafts | 0 |
| `prep_decision` | Decision needed mid-prep (S-Corp election, position, etc.) | asks | 10 |
| `intake_gap` | New-client intake form missing data | drafts | 4 |
| `calculation` | Specific calculation needs review (cap gains, depreciation, etc.) | asks | 16 |
| `return_review` | Return ready for internal/external review | asks | 2 |
| `compliance_alert` | §6695(g) due diligence, 8867 gaps, missing forms | manual | 12 |
| `anomaly` | YoY swing, hobby-loss flag, unusual deduction | asks | 8 |
| `discovery` | Missed deduction/credit surfaced by AI | drafts | 0 |
| `irs_notice` | CP2000 / CP504 / LT11 + drafted response | drafts | 20 |
| `position_refusal` | Petal refused to take a position (insufficient authority) | asks | 0 |
| `disclosure_required` | Form 8275 / §6662 disclosure recommended | asks | 4 |
| `nudge_escalation` | Silent client; nudge-agent escalated to call | drafts | 0 |

### B. Cross-system surfaces — 2 types

| Type | What it surfaces | Default trust tier | Audit risk |
|---|---|---|---|
| `flag` | (Reserved — flags don't surface as triage cards. See §6.) | asks | 0 |
| `message` | Inbound client message that requires a decision-grade response | drafts | 0 |

### C. Connected-system surfaces — 13 types

| Type | What it surfaces | Default trust tier | Audit risk | Powered by |
|---|---|---|---|---|
| `prep_ready` | Return is fully prepped, deep-link to tax software | asks | 0 | Drake / Lacerte / ProConnect |
| `books_discrepancy` | Xero/QBO P&L doesn't match intake or bank | drafts | 8 | Xero, QuickBooks, Plaid |
| `txn_uncategorized` | Uncategorized transactions in books / cards | drafts | 4 | QuickBooks, Ramp, Brex |
| `payroll_verify` | Gusto W-2s/1099s ready; auto-verified | auto | 0 | Gusto, ADP, Paychex |
| `esign_stalled` | DocuSign envelope viewed but not signed | drafts | 0 | DocuSign, Adobe Sign |
| `boi_filing` | FinCEN Beneficial Ownership report due/overdue | asks | 18 | FinCEN BOI portal |
| `calendar_event` | Upcoming meeting + pre-call brief | auto | 0 | Google Calendar, Outlook |
| `tax_planning` | Holistiplan/Corvee opportunity surfaced | drafts | 0 | Holistiplan, Corvee |
| `research_update` | Checkpoint/BNA new guidance affecting a client | drafts | 10 | Checkpoint, Bloomberg Tax |
| `transcript_finding` | IRS e-Services transcript revealed something | asks | 12 | IRS e-Services |
| `state_notice` | State DOR correspondence (CA FTB, NY DTF, etc.) | drafts | 16 | State DOR portals |
| `team_handoff` | Teammate finished work or asked a question | asks | 0 | Slack, internal team data |
| `industry_signal` | Shopify/Toast/Mindbody POS data signal | varies | 4 | POS integrations |

### D. Practice operations + planning — 4 types

| Type | What it surfaces | Default trust tier | Audit risk |
|---|---|---|---|
| `regulatory_deadline` | PTIN/EFIN/WISP/ERO/1099/sales-tax/payroll deadlines | asks | 14 |
| `prep_blocker` | Chained dependency ("can't prep X until Y resolves") | asks | 12 |
| `business_ops` | Practice ops: deposits, payouts, AP/AR, insurance | drafts | 0 |
| `proactive_opportunity` | Revenue jumps, lifecycle events, advisory windows | drafts | 0 |

### E. Gap-closing pass — 7 types

| Type | What it surfaces | Default trust tier | Audit risk |
|---|---|---|---|
| `e_file_status` | E-file transmission lifecycle (pending → accepted/rejected) | auto | 18 |
| `engagement_letter` | Annual renewal cycle for client engagement letters | drafts | 6 |
| `cpe_tracking` | Preparer continuing education hours / deadline | asks | 0 |
| `k1_inflow` | Waiting on K-1 from upstream entity/preparer | drafts | 8 |
| `multi_state` | Additional state return triggered (move, work, second home) | asks | 10 |
| `amended_return` | Form 1040-X workflow | asks | 14 |
| `audit_representation` | Client under IRS audit — distinct engagement | manual | 20 |

**Total: ~38 capability types.** Adding a new type requires updates in:
- `lib/triage-mock-data.ts` → type union, `AUDIT_RISK_TYPE_BUMP`, `defaultTrustTierFor`
- `app/dashboard/(auth)/triage/page.tsx` → optional detail-header chip, optional next-step hint, optional deriveDraftSubject entry

---

## 5. Integrations — what powers each type

There are **42 integrations** registered in `lib/integrations-mock-data.ts` across **17 categories**. Each connected integration can (a) push triage cards, (b) deliver deep-link CTAs, or (c) auto-sync data quietly.

### Connector categories
| Category | Vendors |
|---|---|
| **Tax preparation** | Drake Tax, Lacerte, ProConnect Online, UltraTax CS, CCH Axcess |
| **Bookkeeping** | QuickBooks Online, Xero, FreshBooks |
| **Banking** | Plaid, Mercury |
| **Payroll** | Gusto, ADP RUN, Paychex Flex |
| **Documents / PBC** | Suralink, SmartVault, Box, Google Drive |
| **E-signature** | DocuSign, Adobe Sign |
| **Payments / billing** | Stripe, Bill.com, Ignition |
| **Spend management** | Ramp, Brex, Expensify |
| **Calendar** | Google Calendar, Outlook Calendar, Calendly |
| **Communication** | Gmail, Outlook Mail, Slack, Loom |
| **Tax research** | Checkpoint, Bloomberg Tax, CCH AnswerConnect |
| **Tax planning** | Holistiplan, Corvee |
| **IRS systems** | IRS e-Services |
| **State agencies** | CA FTB, NY Tax & Finance |
| **FinCEN / BOI** | FinCEN BOI portal |
| **Industry POS** | Shopify, Toast, Square, Mindbody |

### Production wiring notes per integration family

**Tax prep software** — APIs vary widely. Intuit (ProConnect, Lacerte) has the strongest developer surface via Intuit Developer Portal; Drake has limited public API; UltraTax requires partner agreement; CCH Axcess is cloud-native with reasonable API access. For the demo, deep-links go to mock URLs; in production each return's deep-link URL is fetched per session.

**Bookkeeping** — QuickBooks Online API is OAuth + REST; we read trial balance, uncategorized transactions, and bank feed status. Xero is OAuth + REST with similar surface.

**Banking** — Plaid is the dominant aggregator (OAuth + token-based); we use it for transaction-level cross-checking against intake reports. Mercury has direct API for accounts using their banking.

**Payroll** — Gusto OAuth + REST for W-2 / 1099 / contractor data. ADP and Paychex require partner integration agreements.

**Documents / PBC** — Suralink has webhook + REST for PBC list status. Box and Google Drive use standard OAuth.

**E-signature** — DocuSign REST API gives envelope status + telemetry (opened, viewed, signed, declined).

**Payments / billing** — Stripe (webhooks for charge.succeeded, payout.created, etc.) and Bill.com (REST for AP/AR).

**Spend** — Ramp has REST + webhooks for card transactions with categorization confidence.

**Calendar** — Google Calendar via OAuth + webhooks for events. Outlook via Microsoft Graph.

**Communication** — Gmail via OAuth + Pub/Sub for message events. Slack via OAuth + Events API.

**Tax research** — Checkpoint and Bloomberg Tax have content-delivery APIs for guidance updates. Subscription required.

**Tax planning** — Holistiplan has API for projection + opportunity surfacing.

**IRS e-Services** — Tax Pro Account portal supports OAuth as of late 2025 for transcripts + POA. **Does not include MeF.** See §10 for e-file specifics.

**State DOR** — Each state has its own. CA FTB has a practitioner portal with limited API access; many states still require email/SFTP delivery.

**FinCEN BOI** — Portal-based today; programmatic submission requires Reporting Company API access (restricted).

**Industry POS** — Shopify Admin API, Toast Public API, Square OAuth API. All standard.

---

## 6. The flag system (model B)

**Flags are persistent bookmarks on a client's record. They do NOT surface as triage cards.**

- Click **Flag** on any triage item → opens an inline preview form matching the canonical Flag row UI (red `AlertCircle`, editable title, editable description)
- Submit → creates a `ClientIssue` (`source: "manual"`) on the client's Flags card + **resolves the original triage item**
- The work has moved off the active queue. The bookmark lives on the client's page. Reactivate from there if needed.

**Data layer:**
- Persistent flags live in `lib/issues-mock-data.ts` → `ClientIssue[]`
- Runtime additions/resolutions in `lib/client-issues-store.ts` (session-only overlay; will move to Convex in production)
- Canonical render: `components/issues/open-items-section.tsx` + `components/issues/issue-row.tsx`

**What flags do not do:**
- They do not auto-derive into triage cards
- The `flag` triage type still exists in the union but no items use it (reserved for future "make this flag a triage item" feature)

---

## 7. Visual identity rules

### Queue rows (left column)
- One visual hook per row: title + client name + source chip + risk %
- **No type icons** — they competed with source chips and avatars
- Source chip = brand-colored letter badge + integration name + optional sync timestamp
- Selected row gets a thin foreground-color left-edge marker (Linear-style) that fades in on selection
- Smooth scroll-into-view on arrow-key navigation

### Detail panel (middle column)
- Kicker line: tier dot + `typeLabel`
- Detail chips for cross-system types: `Flagged`, `From inbox`, `Deadline`, `Blocker`, `Practice`, `Opportunity`, `E-file`, `Engagement`, `CPE`, `K-1`, `Multi-state`, `Amended`, `Audit rep`
- `proactive_opportunity` gets a holographic gradient chip (blue→violet) with the Petal mark — visual cue for advisory work
- "Once resolved:" italic hint at the bottom of the recommendation block — bridges per-card view to workflow chain

### Right rail (context column)
- Audit risk + Confidence + Autonomy as a 3-column strip
- Why this surfaced · Evidence · Sources · Timeline

---

## 8. Keyboard navigation

| Key | Action |
|---|---|
| `↓` / `j` | Next issue (throttled to ~130ms; OS autorepeat dropped) |
| `↑` / `k` | Previous issue (same throttling) |
| `Enter` (in flag form) | Submit flag |
| `Esc` (in flag form) | Cancel flag |
| `⌘+Enter` (in flag form) | Submit flag |

Selected row scrolls into view smoothly. Focus marker bar fades in.

---

## 9. Grouping & sorting

### Group dropdown
- **Status** (default) — TRIAGE_TIERS: Blocks filing · Needs client · Later today · Needs review
- **Client** — one section per client
- **Trust tier** — Auto / Asks / Drafts / Manual
- **Source** — one section per source integration (most-active first)

### Sort dropdown
- **Priority** (default) — tier priority + dispatched age
- **Newest** — most-recently created first
- **Fastest** — smallest `estimatedMin` first (quick wins)

### Scope toggle
- **Everyone** (default) — entire firm's queue
- **Mine** — only issues where the active user is the assigned client preparer

---

## 10. E-file integration — the real story

There is no clean OAuth or MCP path for direct IRS Modernized e-File (MeF) integration. To talk to MeF directly, an entity must be an authorized **Transmitter** (separate from being an ERO), which requires application, EFIN, and security clearance. Most CPAs are not Transmitters — they file through their tax software, which acts as the Transmitter on their behalf.

### Realistic options for production

| Path | How | Effort | Reality |
|---|---|---|---|
| **1. Read status from tax software API** | Drake, Lacerte, ProConnect, UltraTax, CCH Axcess all expose transmission status + IRS ack codes. Read from there. | Medium | Most viable. Intuit has best API; Drake limited; UltraTax partner-only. |
| **2. Email parsing of IRS acks** | IRS sends ack files to transmitter's email. Parse them. | Low | Fragile fallback. |
| **3. SFTP from transmitter** | Some firms get ack file drops over SFTP. | Low | Only if firm has direct Transmitter setup. |
| **4. IRS Tax Pro Account OAuth** | OAuth into IRS practitioner portal for transcripts + POA. **Does not cover e-file.** | Medium | Useful for `transcript_finding` type, not `e_file_status`. |
| **5. Direct MeF integration** | Become an authorized Transmitter ourselves. Build XML/SOAP submission. | High | Long-term, $$, regulatory approval. |
| **6. Partner with an aggregator** | CrossLink, TaxSlayer, Wolters Kluwer offer Transmitter-as-a-service for white-label apps. | Medium | Realistic mid-term play. |

### Recommendation for Petal production
- **Phase 1 (launch):** path #1 + #2 fallback. Read e-file status from Drake/Lacerte/ProConnect APIs. Parse ack emails as backup.
- **Phase 2 (6-12 months):** path #6. Partner with Wolters Kluwer or similar for white-label MeF transmission.
- **Phase 3 (long-term):** path #5 only if Petal handles enough volume to justify being a Transmitter directly.

### What the `e_file_status` triage type can do today
- Surface "X returns transmitted, Y accepted, Z pending, W rejected" rollup card
- Surface individual rejection cards with specific reject codes (IND-031-04 etc.) + drafted resubmission package
- Auto-create a `right_now` triage card within 90 seconds of any rejection received

---

## 11. Multi-user model

Triage is firm-aware. The `useSession()` hook provides the current active firm member (Antonio owner / Elena CPA preparer / James junior / Maria bookkeeper / Petal AI). Role-gated behavior:

- **"Mine" toggle** narrows the queue to issues where the assigned-to of the client matches the current user
- Per-issue ownership is currently per-client (`client.assignedTo`); per-issue handoff is a future enhancement
- Trust tiers apply uniformly across users (a `manual` item won't auto-execute for any role)
- Petal (AI persona) is excluded from the "Mine" toggle since she has no assigned book of business

---

## 12. Workflow connection layer

### "Once resolved:" hints
Every triage card (when not in dispatched state) shows a small italic line beneath the recommendation explaining what unblocks downstream. Type-by-type mapping in `deriveNextStep()`:

- `document_gap` → "Petal moves the return to ready_to_prep when all docs land."
- `signature` → "After 8879 + your ERO sig, Petal transmits to IRS + tracks acceptance."
- `e_file_status` → "On acceptance, Petal closes the engagement + queues the bill."
- `prep_blocker` → "Unblocking this releases the chained downstream items."
- ...and 16+ other type-specific hints

### Resolved / snoozed sections
- Resolved-today section shows everything cleared this session
- Snoozed section shows everything deferred
- Click either to view in read-only dispatched mode with "Bring back to queue" affordance

---

## 13. Coverage scorecard

Honest assessment of triage's CPA workflow coverage as of 2026-05-26:

| Workflow area | Coverage | Notes |
|---|---|---|
| In-season prep (Feb–April) | ~96% | E-file lifecycle + multi-state + K-1 + IP PIN closed |
| Off-season planning (May–Jan) | ~85% | Quarterlies, engagement renewals, CPE, mid-year, year-end covered |
| Practice management overlay | ~85% | Insurance, contract preparers, firm own-books, sales tax, 941 covered |
| Audit representation | ~70% | `audit_representation` type exists; workflow for appeals + tax court pending |
| International (FBAR/FATCA) | 0% | Not covered |
| Trust & estate (Form 1041) | 0% | Not covered |
| Specialized credits (R&D, §754) | 0% | Not covered |

### Out-of-scope items (intentionally)
- Foreign account reporting (FBAR / FATCA) — relevant to a sliver of clients
- Trust & estate returns (Form 1041) — separate workflow, niche for solo EAs
- §754 elections — partnership step-up, very specialized
- R&D credit substantiation — tech-focused

These can be added as new types when demand warrants.

---

## 14. Files touched by triage

### Page entry
- `app/dashboard/(auth)/triage/page.tsx` — main page render + state

### Data layer
- `lib/triage-mock-data.ts` — type definitions + mock data + helpers
- `lib/integrations-mock-data.ts` — connector registry
- `lib/issues-mock-data.ts` — flags (ClientIssue) source data
- `lib/client-issues-store.ts` — flag runtime store
- `lib/client-assignment-store.ts` — per-client assignee runtime store
- `lib/session-context.tsx` — active firm member
- `lib/firm-mock-data.ts` — firm + member + role permissions

### Components
- `components/integrations/source-chip.tsx` — brand-color source badge
- `components/clients/client-assignee-picker.tsx` — assignee dropdown (also used on client pages)
- `components/insights/draft-message.tsx` — DraftMessageCard (Apple-Mail-style email preview)
- `components/issues/open-items-section.tsx` — canonical Flag card (used on client overview)
- `components/issues/issue-row.tsx` — canonical Flag row
- `components/trust-tier-badge.tsx` — trust tier dot / chip primitives

### Settings + integrations grid
- `app/dashboard/(auth)/pages/settings/integrations/page.tsx` — 42-connector grid

---

## 15. Production migration checklist

When wiring the Convex backend, the following must move from mock to real:

- [ ] `TRIAGE_ISSUES` array → Convex query with reactive subscription
- [ ] `applyAssignmentOverrides` runtime store → Convex assignments table
- [ ] `client-issues-store` runtime overlay → Convex `client_issues` table with status field
- [ ] `INTEGRATIONS` connected status + last sync timestamps → real OAuth-state inspection per integration
- [ ] `addClientFlag` mutation → Convex mutation that writes to `client_issues` + emits activity event
- [ ] `handleResolve` / `handleSnooze` → Convex mutations with audit trail (who resolved, when, why)
- [ ] `deepLink.href` per-issue URLs → fetched from each connected tax-prep tool's API
- [ ] AI safety rule: every Petal-generated `recommendedReply` must be flagged `status: 'pending_review'` until human approves (per `CLAUDE.md`)
- [ ] All PII in evidence/context/sources → AES-256 encrypted at rest
- [ ] Trust tier enforcement: backend must refuse to auto-execute `asks` or `manual` items even if UI bug allows it

---

## 16. Design principles (for future contributors)

1. **One visual hook per row.** Queue rows compete with source chips, avatars, and risk %; type icons add noise. Keep queue minimal; let detail panel carry the type-specific identity.
2. **Trust tier is a contract.** If you mark something `auto`, Petal must actually do it without human approval. Don't tag for visual effect.
3. **Every card answers five questions.** What is it · why now · what's the evidence · what's the recommendation · what data did this come from? If any question can't be answered, the card isn't ready.
4. **Source chips beat type chips.** "Came from Xero" is more useful than "this is a books discrepancy."
5. **Flags are bookmarks, not duplicates.** Flagging in triage removes the item from the queue + puts it on the client's page. No echo cards.
6. **Workflow continuity beats per-card isolation.** Every card surfaces "Once resolved: ..." so the user sees the chain, not just the next click.
7. **Petal proposes; humans dispose.** No matter how confident, every consequential action gets a human in the loop for `asks` and `manual` items.

---

*This document is authoritative. If reality and this document disagree, the document is wrong — file an issue + update.*

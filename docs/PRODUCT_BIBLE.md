# Docket Product Bible

> The single source of truth for building Docket. If you're a developer, AI model, designer, or investor touching this product, read this first.

---

## What is Docket?

Docket is an AI-native practice management platform for solo enrolled agents and small tax preparers. It replaces 5+ disconnected tools (Cognito Forms, Calendly, Square, IRS Solutions, email) with one integrated system.

Two apps:
1. **Docket Dashboard** (preparer-facing) — command center for managing clients, returns, documents, payments, and AI intelligence
2. **Docket Portal** (client-facing) — branded client portal for document upload, return status, payments, e-signatures, and messaging

---

## Who is Antonio Vazquez?

Antonio is our founding user and the person every feature is designed for.

- **Title**: Enrolled Agent (EA), Tax Preparer
- **Company**: Vazant Consulting (Montclair, CA)
- **Client base**: ~200 clients (20 active in current tax season demo)
- **Client mix**: Restaurant owners, TikTok/OnlyFans creators, S-Corps, freelancers, W-2 employees
- **Services**: Personal returns ($150), complex returns ($350), business + personal ($500), monthly bookkeeping ($200)
- **Current stack**: Xero (bookkeeping), OLT/Rapid Software (tax prep), Cognito Forms (intake), Calendly (scheduling), Square/Venmo/Zelle (payments), IRS Solutions (return delivery)
- **Background**: Former Intuit (TurboTax) employee. Deep tax expertise.

### What Antonio cares about most:

1. **Human interaction is the premium.** "AI is going to take over so much stuff that I think the human interaction is going to be a premium. People pay me because Antonio answers quickly." The platform should reduce busywork, NOT replace his relationships.

2. **Compliance is non-negotiable.** He operates under IRS Circular 230. Form 8867 due diligence is mandatory. IRC Section 7216 (confidentiality) carries criminal penalties. One mistake = license revoked.

3. **Payment before signature.** His workflow enforces: payment confirmed -> e-signature (Form 8879) -> return release. This is a legal safeguard.

4. **Looking professional.** The portal differentiates him from "garage preparers." His brand, his logo, his voice.

5. **Iteration over perfection.** "Never a finished product. One tax season happens and I'll come back to you."

### His pain points (why Docket exists):

- **Document collection chaos**: Clients submit incomplete docs. He follows up 3-4 times via email/text. Sensitive data flying around insecurely.
- **"Where's my return?"**: Constant phone calls/texts. No visibility. He calls this "a solved problem in every other industry" (DoorDash tracks your pizza).
- **Manual data entry**: Gets W-2 photos via text, manually enters into OLT. Wants AI extraction.
- **Tool fragmentation**: 5+ tools for one workflow. Context-switching kills productivity.
- **Cash flow timing**: Feast/famine cycle. Wants deposits collected upfront.
- **No-shows**: Wants $50 deposit to prevent no-shows.
- **Post-season silence**: Clients go dark May-December. Bookkeeping is untapped revenue.

---

## Product Philosophy

### "Automate Antonio's side, humanize the client's side."

- **For Antonio**: AI drafts messages, extracts documents, flags compliance risks, predicts extensions, calculates estimates. Antonio reviews and approves. AI never acts alone.
- **For clients**: The portal feels personal. Antonio's logo, Antonio's voice, Antonio's welcome message. Clients interact with "Vazant Consulting," not "Docket."

### The Quarantine Pattern (AI Safety)

Every AI output goes into a quarantine state (`pending_review`). It is NEVER promoted to production data without explicit human approval. The preparer reviews, approves or edits, and only then does the data become trusted. An audit log records who approved what and when.

This is not a nice-to-have. This is the architecture that keeps Antonio's license safe.

### Stage-Based Pipeline (not time-based)

Clients move through 7 stages:
1. **New Intake** — Engagement letter + 7216 consent
2. **Collecting Docs** — Waiting on client documents
3. **Ready to Prep** — All docs received, queued for Antonio
4. **In Preparation** — Antonio preparing the return
5. **Client Review** — Client reviewing the return
6. **Pay & Sign** — Payment + Form 8879 signature + ERO countersignature
7. **Filed** — Return filed with IRS

Work is organized by stage, not by deadline. This enables triage: "Who needs me right now?" vs "What's due soonest?"

---

## Feature Map

### Dashboard (Overview)

| Feature | What | Why | Backend needs |
|---|---|---|---|
| Status Summary Bar | 5 tabs (Need You/Waiting/In Progress/Done/To-do) with counts and color-coded progress | Triage at a glance. Shows where attention is needed. | Client stage aggregation query |
| Action Feed | Cards showing urgent client work with AI-drafted messages | Puts the most important work in front of Antonio | action_items table + AI draft generation |
| To-Do List | Manual + voice + AI-sourced tasks with client links | Quick capture without typing | todo_items table |
| Today's Schedule | 2-3 upcoming appointments with call/meet links | Know what's next without opening calendar | appointments table |
| Messages Widget | 3 most recent unread messages | Surface urgent client communication | messages table |
| Voice Dump | Record -> transcribe -> parse to actions/todos | Hands-free capture | voice_dump_sessions table + transcription API |

### Clients

| Feature | What | Why | Backend needs |
|---|---|---|---|
| Kanban Board | 5 columns (Pending/Need You/Waiting/In Progress/Done) | Visual pipeline management | clients + tax_returns tables |
| Pending Client Cards | Accept/decline with intake checklist | Explicit onboarding decision | client_status field |
| Client Search | Real-time text filter | Find anyone instantly | Full-text search index |

### Client Detail — Overview

| Feature | What | Why | Backend needs |
|---|---|---|---|
| Stage Action Cards | Ready to Prep: "Begin Preparation" button. Collecting Docs: progress bar. Pay & Sign: ERO signature. | Actionable UI at every stage. | return_stage_transitions table |
| AI Document Extraction | OCR with field-level confidence, "needs review" flags | Hero feature. Eliminates manual data entry. | document_extractions table + OCR API |
| Compliance Alerts | Form 8867, audit risk flags | Protect Antonio's license | compliance_alerts table + rules engine |
| Anomaly Detection | YoY income/expense change flagging | Catch mistakes before filing | anomaly_alerts table + comparison logic |
| Deduction Suggestions | Missed deduction opportunities with savings estimate | Make clients more money | deduction_suggestions table + AI |
| Extension Predictions | Probability + contributing factors | Plan ahead | extension_predictions table + AI |
| Estimated Tax | Quarterly breakdown | Proactive advisory service | estimated_tax_calcs table |
| Billing Card | Deposit/balance tracking, payment timeline, contextual actions | Know payment status at a glance | invoices + payment_records tables |
| Return Progress Timeline | 7-stage visual timeline | Show where client is in process | tax_returns.return_stage |
| Client Review Enhancement | Days since return sent, portal activity | Know if client is stale | tax_returns.return_sent_date + portal_login tracking |

### Client Detail — Documents

| Feature | What | Why | Backend needs |
|---|---|---|---|
| Document Status Summary | X of Y received, progress bar, "Download All" when complete | Quick status check | document_checklist aggregation |
| Upload Zone | Drag-and-drop file upload | Easy document ingestion | Convex File Storage |
| Document Checklist | Required vs received by type | Track what's missing | document_checklist table |
| Auto-Organized Groups | Docs grouped by category (income, deductions, etc.) | Easy browsing | documents.category field |
| AI Processing | Extraction status per document | See what AI has processed | document_extractions table |

### Client Detail — Messages

| Feature | What | Why | Backend needs |
|---|---|---|---|
| Message Thread | Chronological client<->preparer messages | Communication history | messages table |
| System Cards | Auto-generated status/payment/signature updates | Keep clients informed | messages with sender_type='system' |
| AI Draft Suggestions | AI-generated message drafts above input | Faster responses | AI draft generation + ai_config.draft_tone |
| File Attachments | Inline file sharing in messages | Share docs in context | messages.attachments JSONB |

### Client Detail — Notes

| Feature | What | Why | Backend needs |
|---|---|---|---|
| Notes CRUD | Create, edit, list notes with timestamps | Private preparer context | client_notes table |

### Calendar

| Feature | What | Why | Backend needs |
|---|---|---|---|
| Month/Week/Day views | Standard calendar with appointments | Schedule management | appointments table |
| Client appointments | Linked to client records | Context for every call | appointments.client_id FK |
| Google Calendar sync | Bidirectional sync | Use existing calendar | Google Calendar API + OAuth |

### Chat (Global Messages)

| Feature | What | Why | Backend needs |
|---|---|---|---|
| Conversation List | Sorted by unread + draft status | Prioritize urgent messages | messages grouped by client_id |
| AI Drafts | Per-conversation draft suggestions | Speed up responses | AI draft generation |
| Realtime | Live message delivery | Instant communication | Convex reactive queries |

### Settings (12 Sections)

| Section | Key Configuration | Backend table |
|---|---|---|
| Firm Profile | Name, email, phone, PTIN, EFIN, avatar | preparers |
| Service Tiers | CRUD for pricing packages with includes list | service_tiers |
| E-Filing & ERO | Digital signature, credential verification, signing stats | ero_config |
| Payments | Stripe connection, deposit amount, terms, auto-invoice, reminders | payment_config |
| Client Portal | Logo, welcome message, stage messages, custom domain | portal_config |
| Templates | Document checklists per tier, legal documents | checklist_templates + legal_document_templates |
| AI Preferences | Tone, auto-draft, nudge timing, insight toggles, personality | ai_config |
| Automated Reminders | Intake/document/deposit/review timing, quiet hours | reminder_config |
| Notifications | Per-type channel toggles (in-app/email/push), quiet hours | notification_preferences |
| Integrations | Google Calendar, Stripe, Meet, Gmail, Xero, QuickBooks, Zoom | integration_config |
| Appearance | Light/dark/system theme | user preferences (cookie) |
| Audit Trail | Coming soon — immutable action log | audit_log |

### Other Components

| Component | What | Backend needs |
|---|---|---|
| Notification Bell | Unread notification dropdown with actions | notifications table |
| Ask Docket (AI Panel) | Conversational AI about clients/tax | LLM API + client data context |
| Time Tracker | Floating timer per client with activity types | time_entries table |
| ERO Signature Dialog | Multi-step 8879 signing flow | ero_config + tax_returns + audit_log |
| Client Detail Dialog | Modal version of client overview | Same as client detail pages |

---

## Design Language

### Typography
- Page titles: `text-2xl font-bold tracking-tight`
- Card titles: `text-sm font-semibold`
- Labels: `text-xs font-medium text-muted-foreground`
- Numbers/metrics: `font-display tabular-nums`
- Tiny secondary: `text-[10px] text-muted-foreground`

### Color Semantics
- **Red**: Urgent action needed
- **Amber**: Waiting/pending/warning
- **Blue**: In progress
- **Emerald**: Complete/success/paid
- **Violet**: Todos/generic

### Spacing Patterns
- Card padding: `p-4`
- Section gaps: `space-y-6`
- List item gaps: `space-y-1.5` to `space-y-2`
- Grid gaps: `gap-3` to `gap-4`

### Component Patterns
- Cards: `rounded-xl border bg-card`
- Badges: outline for metadata, filled for status, destructive for urgent
- Buttons: primary for main action, outline for secondary, ghost for tertiary
- Status indicators: colored dots + text labels

---

## Competitive Landscape

| Competitor | What they do | What Docket does better |
|---|---|---|
| **TaxDome** | Practice management + client portal | AI-native (not bolted on). Document extraction, compliance alerts, anomaly detection, deduction mining built in. |
| **Canopy** | Practice management + intake workflows | More opinionated pipeline (7 stages vs generic). AI drafts messages. Voice-to-todo. |
| **Carbon** | AI tax assistant | Carbon is B2C (consumer tax). Docket is B2B (for the preparer, not the client). |
| **Accruel** | Automated form-filling | Docket is full workflow, not just forms. Portal, messaging, payments, ERO signing. |

Antonio's take: "Nothing is really emerging in terms of what we're trying to do" (AI-native + tax workflow + client portal all together).

---

## Business Context

- **Deal**: $12K founding partnership with 2% equity, lifetime platform access, no monthly fees
- **Market**: Medium-scale agencies pay $200-500K for custom portals. Docket targets solo EAs/CPAs at $125-200/month (future pricing).
- **Distribution**: Antonio's mentor runs an EA training network with "thousands of people." If Antonio succeeds, mentor recommends to network.
- **Tech stack**: Next.js (Vercel) + Convex (reactive backend) + Stripe + Google Calendar/Meet + AI APIs (GPT-4o, Document AI)
- **Running cost**: ~$80-110/month (Convex Pro $25 + Vercel Pro $40 for 2 apps + AI ~$15-45 + Stripe pass-through)

---

## What NOT to Build

- Don't replace Xero/QuickBooks (accounting). Integrate with them.
- Don't replace OLT/Drake/ProConnect (tax prep software). Push data to them.
- Don't auto-send messages without Antonio's approval. Ever.
- Don't auto-file returns. Antonio files through OLT.
- Don't store credit card numbers. Stripe handles all payment data.
- Don't build hourly billing. Antonio charges flat fees.
- Don't build team/multi-preparer features yet. Single-tenant first.

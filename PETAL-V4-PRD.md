# Petal v4 — Product Specification

**Version:** v4 Synthesis (April 17, 2026)
**Author:** David Viramontes, Noctworks
**Audience:** Claude Code, Haokun Yang (backend), Antonio Vazquez (founding client review)
**Reference mockups (visual source of truth):**
- `/design-references/petal-direction-b-v2.html` (triage workflow, primary home)
- `/design-references/petal-synthesis.html` (client workspace, deep work surface)

---

## 1. Product Overview

Petal is an AI native practice management platform for solo enrolled agents and small tax firms. The product replaces TaxDome, Canopy, and Karbon for solo EAs managing 20 to 200 individual and small business clients per year.

**Positioning:** The AI native operating system for solo tax professionals.

**Primary user:** Antonio Vazquez. Solo EA in Riverside, California. Manages 23 active clients across individual 1040s, Schedule C sole proprietors, S corps, partnerships. Works 60+ hour weeks during tax season (Feb 1 to April 15). Billable time is the constraint. Compliance exposure is the risk.

**Core thesis:** Tax work during season is a queue, not a dashboard. Antonio does not need situational awareness. He needs to process items one by one until the queue is empty. When an item needs deeper context, he drops into the full client workspace. When done, he returns to the queue. Everything Petal does is in service of that round trip.

**Differentiation vs. TaxDome / Canopy:**
1. Triage first workflow instead of dashboard first
2. AI insights that are grounded in firm data with source attribution, not generic chatbot
3. Compliance engine that makes IRS Circular 230, Publication 4557, and FTC Safeguards Rule evidence auditable
4. Editorial warm aesthetic (cream paper, Fraunces serif moments, rust accents) instead of generic enterprise blue

**Differentiation vs. AI native rivals (Basis, Accrual, TaxGPT, Juno):**
1. Practice management as system of record, not just reasoning engine overlay
2. Built for solo practitioners and firms under 10 preparers, not top 100 firms
3. Full client lifecycle including intake, portal, messaging, filing, and post filing continuity

---

## 2. Design System

### 2.1 Color tokens

Warm Claude coded palette. Cream paper, warm near black ink, rust accent for urgency and emphasis, forest green for financial positive, muted amber for warnings, warm red for errors. All colors have warmth (no cool grays or blues).

```css
:root {
  /* Surfaces */
  --bg: #F5F2EA;           /* cream paper background */
  --surface: #FBFAF5;       /* elevated surfaces, cards */
  --surface-2: #F0EBDD;     /* hover states, muted zones */
  --surface-3: #EAE3D0;     /* progress tracks, alt surface */

  /* Ink (text) */
  --ink: #1A1612;           /* primary text, warm near black */
  --ink-2: #3F382E;         /* secondary */
  --ink-3: #6F6655;         /* tertiary, labels */
  --ink-4: #9C9380;         /* quaternary, metadata */
  --ink-5: #B8AE99;         /* subtlest, dividers in text */

  /* Hairlines */
  --hairline: #E3DCC9;      /* warm hairline, primary border */
  --hairline-2: #D4CBB4;    /* stronger border */

  /* Accent (rust, urgency, key emphasis) */
  --accent: #B8532C;        /* rust primary */
  --accent-2: #9A4323;      /* darker rust, hover */
  --accent-soft: #F5E2D2;   /* soft rust background */
  --accent-bg: #FBF2EC;     /* lightest rust background */

  /* Positive (financial green, success) */
  --positive: #3F6B40;      /* forest green */
  --positive-bg: #EDF2EC;

  /* Warning (amber) */
  --warning: #B87A2F;
  --warning-bg: #F7EDD9;

  /* Error (warm red) */
  --error: #A73B2B;
  --error-bg: #F5E0DC;
}
```

### 2.2 Typography

Three font families, carried over from v3. Each has a specific role. Do not mix roles.

```css
:root {
  /* Editorial display: brand, client names, insight emphasis, headlines */
  --serif: 'P22 Mackinac Pro', 'Fraunces', Georgia, serif;

  /* Body, UI chrome, forms, labels, navigation */
  --sans: 'DM Sans', 'Lato', -apple-system, BlinkMacSystemFont, sans-serif;

  /* Numbers, timestamps, keyboard shortcuts, code, tabular data (new in v4) */
  --mono: 'Geist Mono', ui-monospace, 'SF Mono', monospace;
}
```

**P22 Mackinac Pro (serif):** used for the Petal brand mark, client names in workspace headers (e.g., "Priya Sharma" at 32px), AI insight body copy with italic accent on key phrases, and editorial moments like "inbox zero by 4pm". Paid font, already licensed for v3. Self hosted at `/public/fonts/p22-mackinac-book.woff2` and `/public/fonts/p22-mackinac-medium.woff2`. Weights available: 400 (Book), 500 (Medium). Never use for body text, buttons, labels, or form fields.

Fallback to Fraunces (Google Fonts, free) in development environments where P22 is not installed. The design reference HTML files use Fraunces for this reason. Production uses P22 Mackinac.

**DM Sans (sans):** everything that is not explicitly serif or mono. Interface chrome, body text, buttons, labels, form fields, navigation. Google Fonts, free. Load via `next/font/google` for automatic optimization.

**Geist Mono:** all numbers, time displays, keyboard shortcuts, code blocks, metadata, file sizes, counts, identifiers, tax IDs, dollar amounts in data strips, and any tabular data. Always apply `font-variant-numeric: tabular-nums` so digits align column wise across rows. This is a v4 addition; v3 does not have a dedicated monospace which means KPI numbers in v3 do not align vertically. Free via Vercel / Google Fonts.

### 2.2.1 Fonts to remove from v3

v3 currently loads these fonts but does not actually use them on rendered surfaces. They add several hundred KB to initial load. Remove from `layout.tsx` font imports during v4 build:

- Inter
- Roboto (all weights)
- Matter (if hosted locally)
- SF Pro Display (if hosted locally)
- Geist sans (replaced by DM Sans)

### 2.3 Type scale (13px base for interface, 16px for body content, scaled for display)

- Display (client name): `32px` Fraunces, weight 500, letter spacing `-0.018em`
- Heading 1 (section title): `18px` Geist, weight 600
- Heading 2 (subsection): `14px` Geist, weight 550
- Body: `13px` Geist, weight 450, line height 1.45
- Small (meta): `11px` Geist or Geist Mono, weight 500
- Label (eyebrow): `10px` Geist Mono, uppercase, letter spacing `0.12em`, weight 550

### 2.4 Spacing (4px grid)

```css
--s-1: 4px;
--s-2: 8px;
--s-3: 12px;
--s-4: 16px;
--s-5: 24px;
--s-6: 32px;
--s-7: 48px;
--s-8: 64px;
```

### 2.5 Border radius

- `3px` for pills, badges, small buttons
- `4px` for buttons, inputs, small cards
- `5px` for medium cards
- `6px` to `8px` for elevated cards only
- `50%` for avatars and dots
- Never use larger than `8px` except for circular elements

### 2.6 Shadows

Avoid shadows on cards. Use hairline borders instead. The only shadow permitted is on the composer input in Direction C, a subtle `0 1px 0 rgba(0,0,0,0.02)`. All other surfaces are flat, differentiated by `1px solid var(--hairline)` borders and background color shifts.

### 2.7 Icons

Use `lucide-react` or equivalent thin stroke icon set. 1.5px stroke width. 16px default size in UI, 14px in dense areas, 20px in buttons, 24px for primary navigation. Never use emoji for UI chrome. Emoji are permitted only as user generated content inside messages.

### 2.8 Avatars

- Circle, three sizes: 16px (xs), 20px (sm), 26px (default), 38px (lg)
- Background: `var(--surface-2)` for soft variant, `var(--ink-2)` for strong
- Content: two letter initials, `weight: 550`, `font-size` scaled to avatar
- No photos, no illustrations, no colored backgrounds by hash. Monochrome only.

### 2.9 Motion

- Hover transitions: `0.08s` to `0.12s` ease
- Page transitions (⌘T round trip): `200ms` ease with slide
- Loading states: subtle pulse on skeleton surfaces, no spinners
- Accent pulse on unread indicators: `2s` infinite

---

## 3. Information Architecture

### 3.1 The two modes

Petal has two primary modes of operation. Every pixel serves one mode or makes the transition between them clear.

**Mode A: Triage (home).** A queue of items that need Antonio's attention. Each item has a type, a client, an action, a time cost, and a severity. Antonio processes items. The queue shrinks. Goal is inbox zero by a chosen time (default 4 PM). Reference: `petal-direction-b-v2.html`.

**Mode B: Client workspace (deep work).** A rich single client view with tabs for Overview, Documents, Messages, Return, Billing, Timeline, Compliance. Full context for one client. Antonio goes here when a triage item needs more than a quick action. Reference: `petal-synthesis.html`.

### 3.2 The round trip

The critical design move: Antonio can always see he came from triage and can return with one keystroke.

- Breadcrumb at top shows `← Triage 1/14 ⌘T` as a persistent clickable chip
- Status bar bottom left always shows `⌘T back to triage (N remaining)` in rust
- Pressing J/K in client workspace advances to the next/previous triage item's client, without going back to the queue (power user flow)
- Exiting a client via ⌘T lands Antonio on the next item after the one he was working on

### 3.3 Left navigation (persistent across both modes)

```
Queue
  Triage            (count, urgent if > 0)
  Snoozed           (count)
  Done today        (count)

Views
  Clients           (total count)
  Pipeline          (kanban view)
  Documents         (count)
  Calendar
  Ask Petal        (command palette, ⌘K)

Firm
  Automations
  Integrations
  Compliance
```

### 3.4 Header (persistent)

Left: Petal brand mark + wordmark
Middle: context dependent breadcrumb (triage state) or client chip (workspace state)
Right: command palette (⌘K), notification bell if unread, user avatar

### 3.5 Status bar (persistent, 28px tall)

Keyboard shortcut reference in monospace uppercase. Date and tax season deadline countdown. Sync status indicator. When in client workspace, the leftmost group shows `⌘T back to triage (N remaining)` in rust.

### 3.6 Mode transitions

```
User opens Petal
  → Lands on Triage (Mode A)
  → Sees queue of 14 items grouped by urgency horizon

Clicks an item (Priya Sharma · MSG · Critical)
  → Detail pane slides in showing message + AI insight + drafted reply
  → Can resolve with R (send as Antonio), E (edit), S (snooze), etc.
  → Or click client name chip in breadcrumb to go deeper

Clicking client chip
  → 200ms transition into client workspace (Mode B)
  → Priya's Overview tab active
  → Breadcrumb now shows ← Triage 1/14 ⌘T

Works in client workspace
  → Reviews compliance tab, checks documents, runs safe harbor calc
  → When done, presses ⌘T
  → 200ms transition back to triage
  → Priya item now shows as "resolved" or Antonio dismisses/snoozes
  → Queue now at 13 remaining, item 2 is selected
```

---

## 4. Core Workflows

### 4.1 Morning triage workflow (the killer loop)

This is how Antonio spends 80% of his time during tax season.

1. Open Petal at 7 AM. Lands on Triage.
2. Queue shows 14 items grouped by "Right now" (2), "Today" (8), "Later this week" (4).
3. Goal display: "inbox zero by 4 PM · est 2h 20m at current pace"
4. First item pre selected. Detail pane shows message, AI insight with source attribution, drafted reply.
5. Antonio reads, approves or edits, sends. Item resolved. Queue advances. Counter ticks up.
6. For items that need deeper work, clicks client chip or presses Enter to open workspace.
7. In workspace, reviews and acts. Presses ⌘T to return to triage.
8. Repeats until queue is empty. Editorial moment: "All clear. 14 done. See you tomorrow."

### 4.2 Deep work client session

When Antonio is preparing Marcus Chen's complex S corp return.

1. Enters client workspace from triage item, Clients nav, or ⌘K search.
2. Overview tab shows AI insights, stats strip, next steps, recent documents.
3. Checks Compliance tab for S corp requirements, ensures all evidence is captured.
4. Opens Documents tab, reviews extracted fields on the new consulting 1099.
5. Opens Return tab to start prep in OLT Pro integrated view.
6. When ready, clicks "Send for client review" which triggers auto release to portal after payment.

### 4.3 AI drafted message round trip

The most demo worthy flow.

1. Client sends SMS ("I have my TikTok 1099 but don't know how to upload it").
2. Item appears in triage with Petal drafted reply already prepared.
3. AI insight surfaces: actual 1099 shows $34,200 vs intake estimate $20,000.
4. Drafted reply answers her question AND surfaces the gap AND offers a call.
5. Antonio reviews, hits R to send as himself. Message goes out. Item resolved.
6. If Antonio edits first, he hits E, modifies inline, then sends.
7. If message needs a call instead, he hits C to schedule.

### 4.4 Compliance evidence export

The defensive moat feature.

1. IRS or state board requests evidence for Marcus Chen's 2024 return.
2. Antonio opens Marcus workspace, goes to Compliance tab.
3. Sees every compliance dimension with status, evidence, timestamps, actors.
4. Clicks "Export Audit Evidence". Generates PDF with every piece of evidence, every signature, every audit log entry.
5. PDF includes: engagement letter, §7216 consent, KBA verification, 8867 due diligence, §199A calculation, reasonable compensation analysis, §179 worksheet, YoY consistency check, Form 8879 signature forensics, ERO countersignature, every AI reasoning trace that influenced the return.

---

## 5. Screens

For each screen, reference the HTML mockup file that visually defines the target. Claude Code should open the referenced file and match tokens, layout, and component behavior.

### 5.1 Triage (home)

**Reference:** `petal-direction-b-v2.html` (full implementation)

**Layout:** Three pane grid. 200px nav + 440px queue list + flexible detail pane. Header 48px, status bar 28px.

**Queue list:**
- Grouped by urgency horizon: "Right now" (critical, immediate), "Today" (high priority, actionable today), "Later this week" (normal, plan ahead)
- Each item shows: type badge (MSG / FILE / FLAG / DOC / CALL / INTAKE / COMP / PREP), client name, service tier + fee, action description in one line with optional rust accent phrase, time cost estimate, age, severity pill
- Hover: subtle surface shift
- Selected: rust left border, surface background
- Keyboard: J/K to navigate, Enter to open, R primary action, E edit, S snooze, E archive

**Detail pane:**
- Breadcrumb with J/K arrows, item position (1/14), client chip, service tier, context line (intake date, year client), estimated time to resolve
- Title tag (MESSAGE · CRITICAL · NEEDS GAP REVIEW style)
- Serif title with one italic rust accent on operative word
- Numbered workflow sections: 1. Context, 2. Petal noticed (insight), 3. Draft (ready to send)
- Each section has its own component treatment
- Action bar at bottom with primary action, secondary actions, keyboard hints
- "Up next" preview chip showing what J will land on

**Header:**
- Progress bar with filled (done), active (current), and empty segments
- Progress stats: "6 done · 14 remaining"
- Editorial goal line in italic rust serif: "inbox zero by 4 pm · est 2h 20m at current pace"
- Command palette input with ⌘K shortcut
- User avatar

### 5.2 Client workspace (deep work)

**Reference:** `petal-synthesis.html` (full implementation)

**Layout:** Three pane grid. 200px nav + flexible main + 320px context panel.

**Client header:**
- Large avatar + Fraunces serif client name at 26px
- Meta line: service tier, year client, intake date, referral attribution
- Action buttons right aligned: Message (M), Call (C), Documents, Open return (⌘⏎)
- Six stat chips below: Status, Deadline, Docs, Paid, Est. refund, Last contact

**Tabs:**
- Overview, Documents (count), Messages (count with pulse if unread), Return, Billing, Timeline, Compliance
- Active tab: rust underline, weight 550

**Overview tab content (top to bottom):**
- "Needs attention" AI insight card (rust left border, grounding attribution, serif body with italic rust accents on key numbers, 4 column data strip, action buttons)
- Progress strip (4 cells: Documents, Return preparation, Client engagement, Billing, each with mini progress bar)
- Next steps (numbered list, first one has current ring, done ones have green check, each row has inline action button)
- Recent documents (compact table, type badge, filename, timestamp, status pill, arrow)

**Context panel (right, 320px):**
- Recent messages (3 previews with channel badge, unread ones have rust left border)
- Activity timeline (chronological, colored dots, compact)
- Compliance checklist (green checks for complete, dashes for N/A, pending states for open items)
- Similar in your book (prior clients with comparable situations, power user feature)

### 5.3 Documents tab (per client)

**Structure:**
- Top controls: Upload zone (drag drop), Download all button, AI classification confidence indicator
- Documents grouped by category (Income, Business, Identity, Agreements)
- Each document card: type icon, title, size, date, fields extracted, confidence score, status badge
- Click document: opens side by side viewer with PDF preview (left) and extracted fields panel (right)
- Each extracted field: name, value, confidence, source location on PDF (click to highlight), preparer override button
- Auto enhancement: phone photos de skewed, contrast enhanced, "Enhanced from phone photo" indicator

### 5.4 Messages tab (per client)

**Structure:**
- Channel filter pills: All, Portal, Email, SMS, Calls, Video
- Conversation thread (center)
- Each message: sender avatar, channel badge, content, timestamp, attachments
- Incoming messages with AI drafted reply shown below in distinct card: "Drafted by Petal, review before sending" with Send as Antonio / Edit / Change tone / Change channel buttons
- Voice/video calls: expandable entry showing duration, full transcript with speaker labels, AI summary, action items (each with Accept/Decline), follow up task suggestions

### 5.5 Compliance tab (per client) — NEW, critical feature

**Structure:** Structured list of every applicable compliance dimension for this return.

**Each item:**
- Status icon (check, dash for N/A, caution for in progress, warning for missing)
- Title
- Authority reference (e.g., "IRC §6695(g), $600 per failure")
- Penalty exposure if applicable
- "Show evidence" expand: what's required, current evidence link, audit trail entry

**Return level compliance (current year):**
- Engagement Letter signed (separate from §7216)
- §7216 Consent signed (separate signature, separate timestamp)
- Digital assets question answered
- Filing status verified
- Filing type requirements (Schedule C / SE verification, S corp reasonable compensation, §199A QBI analysis, §179 equipment disposal, §280F vehicle limits, etc.)
- YoY consistency check vs prior return
- Form 8879 authorization (grayed until payment)
- Form 2441 (if childcare)
- Form 8863 (if education credits)
- Form 8867 due diligence (if EITC or HoH)
- FBAR (if foreign accounts)
- Crypto reporting (if transactions)

**Multi year status (returning clients):**
- Prior years filed
- Outstanding balances
- Active POAs (Form 2848 with tax years covered)
- Notices received
- CSEDs

**Client specific risk factors (AI derived from intake):**
- Free text paragraph explaining what applies to this client and why
- What's NOT applicable and why (prevents over preparation)

**Export Audit Evidence button (prominent):**
- Generates PDF with every dimension, every piece of evidence, every timestamp, every actor
- This is the defensive moat artifact

### 5.6 Intake form (client facing)

**Reference:** Rebuild from v4 spec Part 4. Conditional tree with progressive disclosure.

**Sections (each with conditional logic):**
1. Service & Filing (with dynamic pricing ticker at bottom: "Estimated fee: $150 to $350 based on selections")
2. Personal Information
3. Dependents (conditional on HoH or dependents)
4. Income Sources (checkbox tree, each checkbox expands a sub section with document requests)
5. Tax Questions (digital assets, health insurance, estimated payments, life events)
6. Deductions (standard vs itemized, business expenses if self employed, home office, vehicle)
7. Refund Preference (direct deposit only)
8. Legal Agreements (Engagement Letter and §7216 Consent on SEPARATE screens with SEPARATE signatures and timestamps)
9. Appointment Scheduling (with $50 deposit)
10. Confirmation

**Key behaviors:**
- Dynamic pricing updates as user toggles options
- Cash business toggle triggers additional documentation requirements
- Rental triggers depreciation schedule request
- Crypto triggers transaction history request
- HoH triggers Form 8867 due diligence questions on the preparer side

### 5.7 Client portal dashboard

**Reference:** Rebuild from v4 spec. Warm aesthetic consistent with preparer side.

**Header:** Time aware greeting, tax return status

**Primary card:** Current next step
- If payment and signature pending: "Your return is ready for your review"
- NO dollar amount for refund until filing accepted
- Replace with: "Estimated processing time: 3 to 5 business days after filing"

**Action cards (stacked):**
- Pay remaining balance (if unpaid, clear amount, pay button)
- Sign Form 8879 (grayed until payment confirmed)
- Schedule appointment (if needed)

**Upcoming meeting:** time, date, format (phone / video / in person), join button if video, directions if in person, add to calendar, reschedule

**Return Progress stepper:** 7 vertical steps with completed / current / future states

**Antonio's message (if any):** Full avatar and name, timestamped message from Antonio. NEVER AI generated on client side.

**Post filing (after Filed state):**
- Tax Summary card: filed date, IRS accepted date, income breakdown, deductions taken, YoY comparison for returning clients, refund/owed amount
- Quarterly Estimate Reminders (if applicable): next due date, Pay via IRS Direct Pay button, reminder schedule

**Upsell surface (subtle, near bottom):**
- "Other ways Antonio can help"
- Bookkeeping, Payroll, Tax planning, IRS representation
- Links to inquiry conversation, not sales page

### 5.8 Prep Workspace (preparer only, when actively preparing)

**Layout:** Three panel side by side (40% / 40% / 20%)

**Left panel:** Client data (intake summary, prior year return, current year flags, notes, compliance checklist)

**Center panel:** Document viewer (current document with extracted fields, navigation)

**Right panel:** Ask Petal contextual (pre loaded with this client's context, suggestion chips: "§179 treatment?", "Reasonable comp benchmark?", "QBI calculation?")

**Bottom bar:** Step indicator (Review → Analyze → Check compliance → Send), "Send for client review" with pre flight check

### 5.9 Settings

**Reorganized:**

- **Practice:** Firm Profile (CAF number, state registrations, credentials), Service Tiers, E Filing & ERO, Payments
- **Client Experience:** Client Portal, Templates, Automated Reminders
- **Intelligence:** AI Preferences, Notifications
- **Compliance (NEW):** WISP (version history, last review), Insurance (cyber + E&O expirations), Legal Templates (engagement letter, §7216, DPA, ToS, Privacy Policy with version history), Audit Trail (viewer + export), Firm Compliance Dashboard
- **System:** Integrations (monochrome logos, no "coming soon" clutter), Appearance

---

## 6. AI Capabilities

### 6.1 AI Insights (per client)

Every client Overview has at most one "Needs attention" AI insight at the top. The insight includes:

- Grounding line: list of data sources (intake form, specific documents, prior year return, message history) with monospace separators
- Narrative body: 3 to 5 sentences in Fraunces serif with italic rust accents on key numbers and phrases
- Data strip: 4 columns with labels and mono values (e.g., Stated, Actual, Gap, Penalty risk)
- Action buttons: primary action with keyboard shortcut, secondary actions, dismiss

**Signature insight patterns to support:**

1. **Income gap detection (Priya / W1):** 1099 amount does not match intake estimate. Compute gap, estimate penalty, draft outreach.

2. **Habit pattern detection (Anthony / N6):** Client uploaded X documents every year for N years, one is missing this year. Draft outreach asking about it. This is the Chase 1099 INT demo.

3. **EIN/SSN mismatch (Marcus / I1):** Business 1099 came under personal SSN, but LLC has EIN on file. Flag for attribution, suggest corrected 1099 request or nominee adjustment.

4. **YoY consistency (Roberto / W3, Marcus / I1):** Revenue shifted substantially YoY, verify with client before filing. Surface prior year figures.

5. **Compliance gap (DeShawn / W2):** New HoH client with incomplete 8867 due diligence. Flag penalty exposure ($600 per failure).

6. **Extension pattern (Tyrone / W5):** Client extended last year, showing same stall pattern this year. Recommend preemptive extension discussion.

7. **Referral leading indicator (Ashley / N4):** New client referred by strong existing client (Priya). Flag similar profile, expect multiple platform 1099s.

### 6.2 AI drafted messages

When a client sends a message or an insight requires outreach, Petal drafts a reply. The draft:

- Appears in a distinct card labeled "Drafted by Petal · review before sending"
- Has clear rationale ("answers her question · surfaces the gap · offers a call")
- Shows character count for SMS (e.g., "SMS · 340 / 480 chars")
- Has four buttons: Send as Antonio, Edit draft, Change tone, Change channel
- Tone options: Friendly, Professional, Direct, Warm
- Channel options: Portal, Email, SMS (with character counts per channel)
- Never sent automatically. Always requires Antonio's approval.

### 6.3 Document extraction

When a document is uploaded:

1. Auto classified by type (W-2, 1099 NEC, 1099 K, 1099 INT, Schedule C, etc.)
2. Fields extracted with confidence scores per field
3. Documents with confidence below 85% flagged for review
4. Phone photos auto enhanced (de skewed, contrast normalized, converted to searchable PDF)
5. Side by side viewer: PDF on left, extracted fields on right, click any field to highlight source location
6. Preparer can override any field; override is logged in audit trail
7. "Push to OLT" button when integration ready

### 6.4 Command palette (Cmd+K)

Universal search and command across the product.

**Supports:**
- Jump to any client by name
- Jump to any document
- Run any action (draft message, schedule appointment, run safe harbor calc, generate 4868, etc.)
- Ask Petal questions ("Which clients are at risk?", "What's the §179 limit for 2025?", "Who needs to pay this week?")
- Recent commands
- Contextual suggestions based on current screen

### 6.5 Morning brief generation

Runs overnight. Surfaces at top of Triage as a dismissible banner.

**Contents:**
- Count of items needing attention
- 2 to 3 intelligence items flagged (habit patterns, EIN mismatches, YoY shifts)
- Compliance risk dollar figure across active clients
- Count of drafted messages ready for review
- First appointment of the day

**Not a dashboard.** It is a briefing header on the Triage screen. Dismissible. Does not replace or compete with the queue.

---

## 7. Compliance Engine

This is Petal's defensive moat. TaxDome and Canopy do not have this. Harvey has it for legal, we have it for tax.

### 7.1 Data model

Every compliance dimension is a structured record with:

```typescript
{
  id: string,
  clientId: string,
  returnYear: number,
  dimensionKey: string,           // "engagement_letter", "7216_consent", etc.
  status: "required" | "complete" | "na" | "in_progress" | "missing",
  authority: string,              // "IRC §6695(g)"
  penaltyExposure: number | null, // dollar amount if missing
  requiredEvidence: string[],
  providedEvidence: Evidence[],
  auditTrail: AuditEvent[],
}
```

### 7.2 Dimensions to track

**Universal (every return):**
- Engagement Letter signed
- §7216 Consent signed (separate signature, separate timestamp)
- Digital assets question answered
- Filing status verified
- Form 8879 authorization
- ERO signature

**Conditional (based on intake):**
- 8867 due diligence (EITC, HoH, CTC, AOTC)
- Schedule C / SE verification
- S corp reasonable compensation
- §199A QBI analysis
- §179 equipment disposal
- §280F vehicle limits
- FBAR (foreign accounts)
- Crypto reporting
- Partnership K-1 generation
- California FTB return
- State specific requirements

**Multi year (returning clients):**
- Prior years filed
- Outstanding balances
- Active POAs (Form 2848)
- Notices received
- CSEDs

### 7.3 Audit trail

Every action that touches a compliance dimension logs an event. Events are append only. They include:

- Timestamp
- Actor (Antonio, client, Petal AI, Haokun if supporting)
- Action description
- Before/after state
- Evidence artifact if applicable
- Hash chained to prior event (tamper evident)

### 7.4 Export Audit Evidence

One click PDF generation. Includes:

- Cover page with client, return year, generated date
- Every compliance dimension with status, authority, evidence
- Every evidence artifact embedded (signed PDFs, screenshots)
- Full audit trail with hash chain verification
- Signature of Petal's cryptographic verification

This is the artifact Antonio hands to an auditor.

---

## 8. Mock Client Roster

23 active clients + 3 pending. Each is purpose built to showcase a specific Petal capability. See v4 spec Part 1 for full details. Summary:

| # | Name | Stage | Key feature showcased |
|---|------|-------|----------------------|
| P1 | Sarah Mitchell | Pending | Dynamic pricing, service tier assignment |
| P2 | Kevin & Lisa Park | Pending | Business S-Corp, referral attribution |
| P3 | Daniel Okafor | Pending | Simplest case, mentor network attribution |
| N1 | James & Sofia Rodriguez | Need You | Auto release, ERO countersignature |
| N2 | Aisha Johnson | Need You | E-sign forensics |
| N3 | Vladimir Petrov | Need You | Extension flow, Form 4868 generation |
| N4 | Ashley Kim | Need You | Referral + leading indicator AI |
| N5 | Miguel Sandoval | Need You | Ready to prep + upsell (incorporation) |
| N6 | Anthony Russo | Need You | **Habit detection (Chase 1099 INT)** |
| N7 | Fatima Al-Hassan | Need You | Conditional intake (cash business) |
| W1 | Priya Sharma | Waiting | **Document intelligence flagship** |
| W2 | DeShawn Williams | Waiting | Compliance risk (HoH 8867) |
| W3 | Roberto Fuentes | Waiting | YoY depreciation consistency |
| W4 | Jasmine Torres | Waiting | Automated reminder sequence |
| W5 | Tyrone Mitchell | Waiting | Extension pattern recognition |
| W6 | Mei-Lin Wu | Waiting | Healthcare Schedule C compliance |
| I1 | Marcus Chen | In Progress | **Complex case flagship (EIN mismatch, S corp compliance)** |
| I2 | Thomas & Marie DuBois | In Progress | Multi trigger conditional intake |
| I3 | David Park | In Progress | S corp with POA tracking |
| I4 | Carlos & Elena Mendez | In Progress | Partnership, §179 Insight |
| D1 | Linda Nakamura | Done | Post filing tax summary |
| D2 | Karen O'Brien | Done | Returning client streamlined |
| D3 | Rachel Goldstein | Done | 4 year historical view |

---

## 9. Tech Stack

Confirmed stack (per Haokun's review):

- **Framework:** Next.js 15 App Router (existing prototype already on Next.js)
- **Styling:** Tailwind CSS with custom design tokens matching `:root` variables above
- **Database + Backend:** Convex (real time, type safe, replaces Supabase plan)
- **Auth:** Clerk (phone + SMS OTP for client portal, standard auth for firm users)
- **Payments:** Square (configured, Stripe as fallback)
- **SMS:** Twilio
- **Document AI:** Google Document AI (extraction)
- **Email:** Resend or Postmark (TBD)
- **Encryption at rest:** AES 256 GCM for document storage
- **Hosting:** Vercel
- **Voice/video calls:** TBD, investigate Daily.co or LiveKit for transcripts

**Key architectural decisions:**
- All AI calls to Claude (Anthropic API) with tool use for structured outputs
- All compliance events as append only hash chained log
- Real time sync via Convex subscriptions
- File uploads stream to encrypted storage, then to Document AI pipeline
- Client portal is separate Next.js route (/portal) with phone + OTP auth only

---

## 10. Implementation Phases

### Phase 1 — Antonio beta (target: May 15, 2026)

Goal: Antonio onboards one real new client end to end.

1. Design system foundation (tokens, typography, components library)
2. App shell with three pane layouts, nav, status bar
3. Triage screen (B v2) with mock data, functional J/K nav, Send as Antonio flow
4. Client workspace (synthesis) with Overview tab, AI insight card, progress strip, next steps, recent documents
5. Compliance tab with return level dimensions for 1040 + Sch C
6. Intake form with conditional logic, dynamic pricing, §7216 separate signature
7. Client portal entry (phone + OTP) and dashboard
8. Convex schema for clients, documents, insights, messages, compliance events

### Phase 2 — Mentor demo (target: July 15, 2026)

Goal: 15 minute live demo of every flagship feature for the mentor's class of 1,000+ preparers.

1. All 23 mock clients fully fleshed out with realistic demo data
2. Every AI insight pattern (habit detection, EIN mismatch, YoY consistency, compliance gap, extension pattern, referral indicator)
3. Full Compliance tab with all dimensions, multi year status, Export Audit Evidence PDF generation
4. Document upload, extraction, confidence scoring, side by side viewer
5. AI drafted messages with Send as Antonio flow across SMS, Email, Portal
6. Voice/video call transcripts with action items
7. Post filing tax summary (Q19) and quarterly estimate reminders (Q20)
8. Command palette (⌘K) with full search and command set
9. Polish pass: motion, micro interactions, empty states, loading states
10. Demo script prepared and rehearsed

### Phase 3 — Phase 1A (August to October 2026)

1. Bidirectional SMS bridge (Twilio two way)
2. IRS Solutions transcript import integration
3. Document auto enhancement for phone photos
4. Upsell surface in client portal
5. Add on service module (bookkeeping, payroll, representation)
6. Calendar integration (Google Calendar)
7. OLT Pro integration for return preparation
8. Square full integration with refunds

---

## 11. Demo Script (for July mentor class)

15 minute walkthrough. Every client click is a feature demo.

**Minute 0 to 2: Triage queue** Show the morning briefing. Walk through the queue. Point out grouping, time estimates, severity. "Antonio processes 14 items every morning. One at a time. Done by lunch."

**Minute 2 to 4: Anthony Russo** Habit detection demo. Show the Insight: "Chase 1099 INT missing for the first time in 4 years." Send AI drafted SMS. "This single feature catches the amended returns that cost $400 to fix."

**Minute 4 to 6: Marcus Chen** EIN mismatch + Compliance tab. Show the S corp dimensions, penalty exposure, audit trail. Export Audit Evidence PDF. "If the IRS audits you tomorrow, this is your defense."

**Minute 6 to 8: DeShawn Williams** Compliance risk demo. Show $2,400 aggregate risk. Open his 8867 gap. "$600 exposure per failure. IRS audited a La Puente office last year and found 30 non compliant returns. $18,000 in penalties. This catches it before filing."

**Minute 8 to 10: Vladimir Petrov** Extension flow. One click, Form 4868 generated, client message drafted. "Extension handled in 60 seconds."

**Minute 10 to 12: Priya Sharma** Document intelligence. Show extracted fields, confidence scores, OCR flag on phone photo, AI insight with gap detection, drafted reply. "Every document classified. Every gap identified. Every response drafted."

**Minute 12 to 14: Client portal (Maria's view)** Show Antonio's branded portal. Clean, calm, professional. "Your client sees your brand, not ours. No AI chatbot. No dollar figures speculated. Just their preparer."

**Minute 14 to 15: Close** "This is Petal. Your practice, protected. Your clients, engaged. Your license, defended. Every preparer in this room can have this within 30 days."

---

## 12. What Changed From Earlier v4 Spec

The v4 spec document generated earlier had some elements that conflict with the synthesis direction. Here's what changed and why.

**Dashboard as home → Triage as home.** The earlier spec had a "morning narrative" as the primary surface with action tabs (Need You / Waiting / In Progress / Done) as a kanban style view. The synthesis direction replaces this with a queue oriented triage interface where items (not clients) are the unit of work. Clients are still the object of work, but Antonio processes them one item at a time.

**"Ask Petal" as sidebar feature → Command palette (⌘K).** The earlier spec killed the sidebar and moved Ask Petal to ⌘K. Synthesis keeps this decision.

**Kept:** All the AI insight patterns, the compliance tab, the intake form design, the client portal, the mock data roster, the demo script, and the phase structure.

**Dropped:** The long morning narrative as primary surface (now a small briefing header in Triage), the action tabs pattern as dashboard (now internal to client Pipeline view), the action counter as big number (redundant with Triage progress bar).

---

## 13. Open Questions

Things that need resolution before or during Phase 1.

**Technical:**
1. Convex schema for audit trail hash chain verification
2. Clerk phone + SMS OTP compliance with IRS e signature standard for Form 8879
3. Document AI pipeline architecture (direct integration vs queue based)
4. Real time sync latency targets for triage queue updates

**Business:**
1. Paper refund elimination cutoff date per IRS 2025 changes (verify before building refund preference UI)
2. Current §179 and §199A limits for 2025 (hardcode vs config)
3. Overtime/tips deduction rules and sunset from new 2025 tax law
4. Antonio's advisor equity structure reflected in product positioning

**User research:**
1. Does each AI drafted message sound like Antonio? (voice calibration)
2. Is Anthony's Chase 1099 INT story representative of real habit patterns?
3. Does Antonio prefer J/K for item navigation or arrow keys?
4. What does "inbox zero" look like emotionally at end of tax season?

---

## 14. Claude Code Usage Notes

When using this PRD with Claude Code:

1. **Keep this file at repo root** as `PETAL-V4-PRD.md`. Reference it in every Claude Code session with `@PETAL-V4-PRD.md`.

2. **Keep the HTML mockups** at `/design-references/` as visual source of truth. When building any UI component, Claude Code should open the referenced HTML file to match tokens, spacing, and behavior exactly.

3. **Create a `CLAUDE.md`** at repo root with project specific conventions (file naming, component structure, Convex patterns). This PRD is the product spec. `CLAUDE.md` is the engineering spec.

4. **Work in phases.** Don't try to build everything at once. Start with design system + app shell. Then triage. Then client workspace Overview. Then one tab at a time.

5. **Ask for decisions, not opinions.** When Claude Code hits ambiguity in this PRD, it should ask David directly for the resolution, not make its own call on product direction.

6. **Mock data first.** Before wiring real Convex queries, build everything against the 23 client mock dataset. Easier to iterate on UI when data is deterministic.

---

End of PRD.

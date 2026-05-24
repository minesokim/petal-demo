# Petal — Development Context

## What is this project?

Petal is an AI-native tax practice management platform. This repo (`vazant-dashboard-v2`) is the **preparer-facing dashboard**. There is a separate client-facing portal app.

**Current state**: Feature-complete UI mockup running on mock data. No real backend yet. All data lives in `lib/mock-data.ts`, `lib/documents-mock-data.ts`, `lib/actions-mock-data.ts`, and `lib/messages-data.ts`.

**Next step**: Connect to Convex backend. See `docs/BACKEND_ARCHITECTURE.md` for the complete backend architecture plan.

## Tech Stack

- **Framework**: Next.js 15 (App Router) on Vercel
- **UI**: shadcn/ui + Tailwind CSS v4 + Radix UI primitives
- **Animations**: motion/react (Framer Motion)
- **Forms**: react-hook-form + Zod
- **Icons**: Lucide React
- **Fonts**: Inter (primary), plus theme-specific alternates via next/font/google
- **State**: React useState (no global state library — will use Convex reactive queries)
- **Planned backend**: Convex (reactive database + auth + file storage + scheduled functions)
- **Planned payments**: Stripe
- **Planned AI**: GPT-4o-mini (drafts), GPT-4o (compliance), Google Document AI (OCR)

## Project Structure

> Note: This repo was scaffolded from a dashboard template. Only the paths below are Petal-relevant. Other directories (academy, ecommerce, hotel, etc.) are unused template sections.

```
app/dashboard/(auth)/
  default/           — Overview/Dashboard (command center)
  clients/           — Clients list (Cards, Table, Pipeline views)
  clients/[id]/      — Client detail layout + sub-pages
    overview/        — AI intelligence, billing, stage actions
    documents/       — Document collection + AI extraction
    messages/        — Client messaging thread
    notes/           — Private preparer notes
    intake/          — Client intake details
  documents/         — Global document view
  actions/           — Action feed page
  apps/calendar/     — Calendar
  apps/chat/         — Global messaging
  pages/settings/    — 12 settings sections with sidebar nav
    profile/         — Firm info + credentials
    tiers/           — Service tier CRUD
    ero/             — ERO signature + verification
    payments/        — Stripe config + deposit/terms
    portal/          — Client portal branding
    templates/       — Document checklists + legal docs
    ai/              — AI tone + insight toggles
    reminders/       — Automated reminder thresholds
    notifications/   — Per-type channel preferences
    integrations/    — Third-party connections
    appearance/      — Theme toggle
    audit/           — Coming soon placeholder

components/
  ai-panel.tsx              — Ask Petal sidebar
  time-tracker.tsx          — Floating time tracker
  client-detail-dialog.tsx  — Modal client view (popup on card/row click)
  ero-signature-dialog.tsx  — 8879 signing flow
  petal-command.tsx        — Command palette navigation
  clients/                  — Client view components
    view-mode-toggle.tsx    — Cards/Table/Pipeline toggle
    clients-filter-pills.tsx — Workflow bucket filter pills
    clients-table-view.tsx  — Table view with sort options
    clients-pipeline-view.tsx — Kanban pipeline view
  actions/                  — Action feed components
    action-card.tsx         — Individual action card
    action-feed.tsx         — Action feed list
    action-execution-sheet.tsx — Action execution panel
    voice/voice-dump-dialog.tsx — Voice recording dialog
    intelligence/intelligence-panel.tsx — AI intelligence cards
    todo/todo-voice-panel.tsx — Voice-sourced todo panel
    batch/batch-panel.tsx   — Batch operations
  documents/                — Document upload/checklist/extraction
  messaging/                — Chat/messaging components
  layout/                   — Sidebar, header, notifications
  onboarding/               — Onboarding flow components
  ui/                       — shadcn/ui component library

lib/
  mock-data.ts              — Core types + 20 clients + actions + payments
  documents-mock-data.ts    — Documents + checklists
  actions-mock-data.ts      — AI intelligence types + feed actions
  messages-data.ts          — Chat threads
  fonts.ts                  — Font definitions (next/font/google)
  themes.ts                 — Theme preset definitions
  utils.ts                  — Utility functions

docs/
  PRODUCT_BIBLE.md          — Complete product context (read this first)
  BACKEND_ARCHITECTURE.md   — Convex backend architecture plan
```

## Key Types

```typescript
type ReturnStage = 'new_intake' | 'collecting_docs' | 'ready_to_prep' |
  'in_preparation' | 'client_review' | 'pay_and_sign' | 'filed'

type FilingStatus = 'single' | 'mfj' | 'mfs' | 'hoh' | 'qw'

type ClientStatus = 'pending' | 'active' | 'declined'

type Client = {
  id, fullName, email, phone, filingStatus, returnStage,
  serviceTier, feeAmount, depositPaid, urgency,
  lastActivity, lastPortalLogin, documentsSubmitted, documentsRequired,
  notes, type ('individual' | 'business'), businessName, avatar,
  clientStatus, scheduledCall, returnSentDate
}
```

## Design Conventions

- **Color semantics**: Red = urgent, Amber = waiting, Blue = in progress, Emerald = done
- **Typography**: `font-display tabular-nums` for numbers, `text-[10px]` for micro labels
- **Cards**: `rounded-xl border bg-card p-4`
- **Spacing**: `space-y-6` between sections, `gap-3` in grids
- **Badges**: outline for metadata, filled for status
- **Buttons**: primary = main action, outline = secondary, ghost = tertiary
- No emojis in UI unless explicitly requested
- No em dashes in UI text
- Subtle, tasteful design — not flashy
- Intelligence cards differentiate through content not decorative borders
- Filter pills use workflow buckets (Need You, Waiting, etc.) not pipeline stages
- **CRITICAL: ALWAYS update BOTH client detail views when changing one:**
  - Full page: `app/dashboard/(auth)/clients/[id]/overview/page.tsx`
  - Popup dialog: `components/client-detail-dialog.tsx`
  - These MUST stay synced. Never commit changes to one without the other.

## Search Rules

Before reading files or exploring directories, always use qmd to search for information in local projects first. Use `qmd search` for specific terms and `qmd vsearch` for conceptual queries where wording may vary.

## AI Safety Rule

**AI output NEVER touches production data directly.** All AI results go to quarantine tables with `status: 'pending_review'`. Human approves before data is promoted. This is non-negotiable.

## The User

Antonio Vazquez, EA. Solo enrolled agent in Montclair, CA. ~200 clients. Uses Xero + OLT. Values human interaction, compliance, and looking professional. See `docs/PRODUCT_BIBLE.md` for full background.

## Security Requirements

- All PII must be AES-256 encrypted at rest
- OTP verification required for client portal access
- Payment data never touches our servers (Square handles PCI)
- RLS policies on every table with user data
- WISP (Written Information Security Plan) compliance

## Deployment

- **Repo**: github.com/minesokim/antonio-tax-ui
- **Live**: vazant-dashboard-v2.vercel.app
- **Vercel team**: team_qwHcRX2Ih5A0x3J6w62Nvd32
- **Branch**: main (auto-deploys)

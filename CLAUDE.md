# Docket — Development Context

## What is this project?

Docket is an AI-native tax practice management platform. This repo (`vazant-dashboard-v2`) is the **preparer-facing dashboard**. There is a separate client-facing portal app.

**Current state**: Feature-complete UI mockup running on mock data. No real backend yet. All data lives in `lib/mock-data.ts`, `lib/documents-mock-data.ts`, `lib/actions-mock-data.ts`, and `lib/messages-data.ts`.

**Next step**: Connect to Supabase backend. See `docs/PRODUCT_BIBLE.md` for full product context and `.claude/plans/proud-snuggling-teapot.md` for the complete backend architecture plan.

## Tech Stack

- **Framework**: Next.js 15 (App Router) on Vercel
- **UI**: shadcn/ui + Tailwind CSS + Radix UI primitives
- **Animations**: motion/react (Framer Motion)
- **Forms**: react-hook-form + Zod
- **Icons**: Lucide React
- **State**: React useState (no global state library — will use Supabase Realtime)
- **Planned backend**: Supabase (PostgreSQL + Auth + Storage + Realtime + Edge Functions)
- **Planned payments**: Stripe
- **Planned AI**: GPT-4o-mini (drafts), GPT-4o (compliance), Google Document AI (OCR)

## Project Structure

```
app/dashboard/(auth)/
  default/           — Overview/Dashboard (command center)
  clients/           — Clients list (Kanban board)
  clients/[id]/      — Client detail layout + sub-pages
    overview/        — AI intelligence, billing, stage actions
    documents/       — Document collection + AI extraction
    messages/        — Client messaging thread
    notes/           — Private preparer notes
  documents/         — Global document view
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
  ai-panel.tsx       — Ask Docket sidebar
  time-tracker.tsx   — Floating time tracker
  client-detail-dialog.tsx — Modal client view
  ero-signature-dialog.tsx — 8879 signing flow
  actions/           — Action feed components
    voice/           — Voice dump dialog
  documents/         — Document upload/checklist/extraction
  layout/            — Sidebar, header, notifications

lib/
  mock-data.ts       — Core types + 20 clients + actions + payments
  documents-mock-data.ts — Documents + checklists
  actions-mock-data.ts   — AI intelligence types + feed actions
  messages-data.ts       — Chat threads

docs/
  PRODUCT_BIBLE.md   — Complete product context (read this first)
```

## Key Types

```typescript
type ReturnStage = 'new_intake' | 'collecting_docs' | 'ready_to_prep' |
  'in_preparation' | 'client_review' | 'pay_and_sign' | 'filed'

type FilingStatus = 'single' | 'mfj' | 'mfs' | 'hoh' | 'qw'

type Client = {
  id, fullName, email, phone, filingStatus, returnStage,
  serviceTier, feeAmount, depositPaid, urgency,
  lastActivity, lastPortalLogin, documentsSubmitted, documentsRequired,
  notes, type ('individual' | 'business'), businessName, avatar,
  clientStatus ('pending' | 'active' | 'declined')
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
- Subtle, tasteful design — not flashy

## AI Safety Rule

**AI output NEVER touches production data directly.** All AI results go to quarantine tables with `status: 'pending_review'`. Human approves before data is promoted. This is non-negotiable.

## The User

Antonio Vazquez, EA. Solo enrolled agent in Montclair, CA. ~200 clients. Uses Xero + OLT. Values human interaction, compliance, and looking professional. See `docs/PRODUCT_BIBLE.md` for full background.

## Deployment

- **Repo**: github.com/minesokim/antonio-tax-ui
- **Live**: vazant-dashboard-v2.vercel.app
- **Vercel team**: team_qwHcRX2Ih5A0x3J6w62Nvd32
- **Branch**: main (auto-deploys)

# Petal OS — Product Spec (agentic-os branch)

> Working spec for the "soft remake." Mockup-first: this describes what we build in
> the prototype to lock product direction. Backend (Convex + Agent SDK + MCP) comes later.

## 0. One-line thesis

**Petal is the firm-grade agentic OS for accounting/advisory firms: a calm,
client-centric workspace where AI agents run the production work — close, return
prep, reconciliations, document chase — grounded in firm policy and per-client
memory, and every output lands as a cited, reviewable draft the preparer approves.**

Lineage: Cowork's paradigm (agent as infrastructure) · Attio's entity bones ·
Relevance's run-and-review loop · Sana's restraint · Ping's client memory ·
Harvey's professional-trust bar.

The wedge vs horizontal agent tools: a **client system of record** + **accounting-native
skills** + **compliance/audit defense** baked in. The wedge vs Ping/Slant (memory +
admin assist): our agents **do the production work**, not just remember the client.

---

## 1. Design language (Sana-leaning) — locked first, fixes consistency

The reason past screens felt inconsistent was ad-hoc type sizes + scattered color.
A constrained system makes every screen cohere automatically.

- **Type:** one grotesk (e.g. Geist / Inter-adjacent). Scale, 5 steps only:
  `11` (micro/labels) · `12` (meta) · `13` (body) · `15` (titles) · `19/24` (page/display).
  Weights: 400 / 500 / 600. Hierarchy via size+weight+color, never decoration.
- **Color:** warm off-white background (`#FAF9F7`-ish), 3 neutral grays, near-black text,
  **one** brand accent (Petal mark color), and semantic red/amber/emerald used **rarely**
  and only for status. No colored icon circles, no gradients, no rainbow dots.
- **Spacing:** 4px base; generous, uniform padding. Calm density.
- **Grouping:** borderless — soft fills + hairline dividers + section headers, not boxes.
- **One focal action** per screen; everything else recedes (ghost/muted).
- **Motion:** minimal-functional only.

---

## 2. Skeleton — Attio's object model (this is the frame)

Petal is an **Attio-style object workspace**, not a dashboard. Everything is records,
lists, and a calm global rail. We graft the agentic layer (Ask + Tasks review +
Workforce) onto Attio's bones; we keep Sana's restraint as the skin.

**Global left rail** (Attio's exact shape):
- Workspace switcher + **⌘K Quick actions** (command bar = the Ask Petal entry)
- **Ask Petal** — research / chat (our addition; the *synchronous* gear)
- **Tasks** — the review queue: agent runs awaiting approval (the *async* gear) ← heart
- **Inbox / Comms** — email + messages
- **Reports**
- **Records** (objects): **Clients**, **Returns / Engagements**, **Contacts**
- **Lists** (saved views): "Needs review", "In prep", "My book", season buckets
- **Workforce** (Agents) + **Skills** (= Attio Automations, reframed)
- **Knowledge** (Firm Constitution) · **Settings** (integrations, usage, security, team)

**Two gears, one brain:**
- **Ask** = synchronous research/draft, cited. Lives in Ask Petal + ⌘K, scoped to the
  current record. Answers/artifacts out.
- **Do** = async skills/agents → drafts land in **Tasks** → review. Work product out.
- Bridge: from Ask → "Run as task" / "Save as skill"; from a Task → open its Ask thread.

### Attio → Petal mapping
| Attio | Petal |
|---|---|
| Records (Companies / People objects) | Clients / Returns / Contacts |
| Record action **"Run workflow"** | **Run a skill / agent** on this client |
| Record **Activity** tab (field-level change diffs) | **Client Memory + audit trail fused** — every human *and agent* change, with diffs |
| **Details** attribute panel (inline edit) | Stage · service · fee · health · filing · EIN · deadline |
| **Lists** (saved filtered views) | Saved views / pipeline buckets / "Needs review" |
| **Automations** (visual builder + Runs) | **Skills builder** (a skill *is* a workflow) + run history |
| ⌘K Quick actions | Command bar + Ask Petal |

---

## 3. Pages & surfaces

### 3.1 Home / Today
The entry point. "Here's what happened while you were out, here's what needs you."
- What agents did overnight (runs completed, drafts ready).
- **Needs your review** (count → Tasks).
- Today's meetings (with auto-prep), upcoming deadlines, at-risk clients.
- One calm narrative brief, not a widget wall.

### 3.2 Tasks — the run-and-review queue (the heart)
Every agent run lands here as a draft awaiting a human.
- Tabs: **To review · Scheduled · Running · Escalated · Done** (Relevance model).
- Row: task · client · **run by** (which agent) · status (pending approval / running /
  escalated) · **confidence** · timestamp.
- Group by client / agent / type. Filters. "My queue."
- This is the WISP/7216-grade control plane: nothing auto-applies; humans approve.

### 3.3 Run detail — a master-detail PANEL, never a page
Like Attio/Linear/Relevance, a run opens *beside* the queue (split view) or as a
**drawer from anywhere** (Home, a client record). Never a separate route — you stay in
the queue and rip through approvals. Three panes when open:
- **Left — what the agent did:** timeline of steps (analyzed return, pulled W-2, created
  Sch C). Trust through transparency.
- **Center — the output as a reviewable draft:** for numbers, a **diff** (this year vs
  last, what changed, why) with **inline citations** — click a figure → its source doc
  opens with the box highlighted (Accrual/Hebbia/NotebookLM pattern).
- **Right — provenance + confidence:** source doc, the agent's confidence + reasoning.
- Actions: **Approve · Edit · Send back with note · Escalate.** The send-back note feeds
  skill improvement (the compounding loop).

### 3.4 Clients — entity workspace (Attio bones)
- Calm, Attio-grade table of clients (records): stage · service · fee · **health** ·
  assigned · next deadline. Saved views, filters, sorts.
- Click → Client record.

### 3.5 Client record — Attio's record detail, exactly
- **Header:** client name + star + actions **"Run skill · Compose · Add to view · ⋯"**
  (Attio's "Run workflow / Compose Email" slot — this is where you launch an agent on
  the client).
- **Right — Details panel** (Attio's attributes): inline-editable stage · service · fee ·
  **health** · filing · EIN · deadline, plus which **engagements / lists** it belongs to.
- **Center — tabs** (Attio's row): **Activity · Work · Documents · Comms · Tasks · Files.**
  - **Activity = Client Memory + audit trail fused** (this replaces a separate Memory
    tab). The living timeline of every meeting, email, doc, and every human/agent change
    *with diffs* — Ping's living profile rendered as Attio's activity feed, with a
    plain-language "catch me up" summary pinned on top.
  - **Work** = current engagement (return / close): agent drafts + the prep cockpit + review.
  - **Documents / Comms / Tasks / Files** as in Attio.
- **Ask Petal** is summonable (⌘K / companion), scoped to this client — not a tab.

### 3.6 Client Memory — a first-class layer (Ping, done as well or better)
Not a side tab — the substrate every agent run draws from.
- **Auto-captured** from notetaker (meetings) + email + documents (Slant's notetaker→record loop).
- **A living profile:** plain-language summary ("understand a 5-year relationship in
  minutes"), key facts, relationship-history timeline, open commitments.
- **Client Health:** sentiment + signal score across comms.
- **Firm-wide / institutional:** context stays with the firm, not the individual —
  turnover-proof. Search across all clients' memory.
- Feeds: every skill/agent run uses this as context. (Principles 3 + 4.)

### 3.7 Workforce / Agents
- The firm's AI staff as cards: **Close Bot · 1040 Prep · 1099 Chaser · Bank Rec ·
  Notetaker.** Each shows purpose, recent runs, % auto / % needs-review.
- **Agent builder** (Sana tabs + live preview):
  - **Persona** — instructions (inherits the Firm Constitution).
  - **Knowledge** — what context it sees: firm policy + which client data + connectors.
  - **Skills/Workflows** — the jobs it can run (each with a defined output schema).
  - **Visibility** — permissions + **autonomy level**: drafts-only / asks-first / auto.

### 3.8 Skills Library
- Repeatable jobs as first-class objects (close steps, prep workpaper, recs, chase).
- Each: plain-text definition (non-dev authorable), **defined output**, version history,
  "improved from N review notes," firm-distributed.
- **Skill creator** — turn a successful past run into a reusable skill (Cowork pattern).

### 3.9 Knowledge / Firm Constitution
- The firm's policies, definitions, glossary, CoA rules, engagement standards, naming
  conventions. **Injected into every run.** Editable, versioned. (Principle 1.)
- Plus firm reference docs the agents can ground on.

### 3.10 Integrations / Connectors
- QBO / Xero / banks (MCP), document pipeline, **OLT/Drake via computer-use**, Google/MS,
  calendar + email. Read-only by default (training wheels) → granular write scopes.

### 3.11 Settings
- **Usage & cost** — per-seat / per-client spend, overnight scheduling, limits (Cowork lesson).
- **Security & compliance posture** — SSO, "data never trained," quarantine rule,
  WISP/7216 surfacing, **audit log** (who/agent did what, when).
- **Team & roles** — preparer / reviewer / partner; who can approve what.

---

## 4. Cross-cutting flows

**A day in the life:** overnight, scheduled agents run → morning **Home** brief →
**Tasks** review queue → open a **Run** → review the cited diff → Approve or
Send-back-with-note → note improves the skill.

**Agent run lifecycle:** triggered/scheduled → runs grounded in (Client Memory + Firm
Constitution + connectors) → produces a **cited draft** → lands in **Tasks** → human
reviews the **diff** → Approve (applies) or Send back (note → skill improves) or Escalate.

**Memory capture:** notetaker / email / docs → **Client Memory** → feeds every run.

### Mapping (so nothing's lost)
| Principle / Cowork concept | Surface |
|---|---|
| 1. Set instructions | Firm Constitution (Knowledge) |
| 2. Structure output | Skill output schemas; Run-detail draft |
| 3. Live context | Client Memory + close/fiscal state |
| 4. Memory | Client Memory layer + agentmemory |
| 5. Build in checks | Tasks queue + Run-detail review-as-diff |
| Agent as infrastructure | Workforce + scheduled runs |
| Skills self-improve | Send-back notes → Skill versions |
| Connectors / computer-use | Integrations |

---

## 5. Build order (mockup phasing)

1. **Lock the design language** (§1) — tokens, then every screen obeys it.
2. **Shell + nav** (§2) — the calm Sana-style frame.
3. **Tasks + Run detail** (§3.2–3.3) — the heart: review-as-diff + provenance + approve.
4. **Clients + Client record + Memory** (§3.4–3.6) — the entity workspace + the substrate.
5. **Workforce + Skills + Constitution** (§3.7–3.9) — the agent layer.
6. **Integrations + Settings** (§3.10–3.11) — connectors + governance/compliance.

Reference apps per surface: Tasks/Run → Relevance, Accrual, Hebbia. Clients/record →
Attio, Harvey. Memory → Ping, Slant. Agent builder → Sana, Lindy. Whole feel → Sana.

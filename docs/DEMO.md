# Petal OS — Techstars Demo Guide

> Demo world: **Thursday, June 25, 2026** · Vazant EA (Antonio Vazquez, EA + Elena, part-time admin) · 11 client households · extension season. Every number on every screen derives from one fixture module and ties out (`/os/debug/tie-out` — all 27 checks).

---

## 1. What is real vs. simulated (the honest gap analysis)

### Works for real in the demo
- **Every surface renders from one canonical data model** — counts, badges, KPIs, and charts all derive at render time and agree with each other. Park Family Dental tells the same story on Today, the Returns board, Documents, Billing, and in chat.
- **Ask Petal is interactive on all three surfaces** (full page `/os/ask`, the Today composer, the @Petal rail on every client record). Typed questions are keyword-matched against a scripted bank; answers stream in with sources, deep links, and "Do" cards. **Unscripted questions get a graceful fallback with suggestion chips — you cannot get caught.**
- **Approvals move the numbers live.** Approving in Review mode (or Tasks) decrements the sidebar badge, the Today headline, and the callout in real time. **Reloading the page resets the world** — that's the demo reset button.
- **Review mode** runs on real keyboard handlers (A approve / E edit / S skip / Esc exit) with an end card.
- Provenance ("Sources & reasoning") opens on every AI artifact; the activity log's CSV **Export actually downloads**.

### Simulated (fine for a demo, must not be oversold)
- **The AI is a scripted bank, not a model.** ~12 firm-level questions + 3 per-client templates (status / documents / balance — these work for *all 11 clients*). Extend in `lib/fixtures/demo-chat.ts`.
- Approvals don't *send* anything; "Queued — lands in Tasks" actions don't create tasks; edits aren't persisted.
- The world is frozen at Jun 25, 2026; single user; no auth.

### What the real product needs that the demo does not have
| Gap | What it means post-accelerator |
|---|---|
| No backend | Convex/Postgres + auth; the fixture model is the schema draft |
| No real LLM layer | Retrieval over firm records + drafting with citations; the provenance UI is already built for it |
| No document pipeline | OCR/extraction (the confidence-flag UX already exists) |
| No e-file or IRS integration | OLT Pro transmission + IRS e-Services transcripts (UI treats both as connected) |
| No outbound comms | Email/SMS/portal sending behind the trust-tier gates |
| No payments | Stripe for invoices |
| Compliance hardening | PII encryption, WISP, §7216 consent flows (copy exists in Settings) |

### Known demo rules (read before going live)
1. **Never hard-refresh mid-demo** — it resets approvals (by design). Refresh *between* runs to reset.
2. **Type only scripted questions** (list below) — anything else gets the polite fallback, which is safe but breaks flow.
3. Stay off header buttons not in the script (Search / Export / Create on list pages are visual only).
4. Demo at desktop width; `/os` lands on Today.

---

## 2. The scripted question bank (type any of these)

**⭐ Flagship — deep analysis (agentic steps + chart + ranked findings). These are the wow moments:**
- **"Run a risk scan across my book"** — Petal scans all 19 returns, streams its reasoning steps, then returns a 4-metric summary, an *exposure-by-client* bar chart (red = high, amber = medium), and ranked finding cards — every one deep-linked to its record (the CP2000, the Russo basis decision, Park's 1098 + open position, etc.). **This is the single most impressive moment in the demo.**
- **"Show me the financial picture"** — fees booked / collected / outstanding / blocked-on-docs, plus a fees-by-stage chart.
- **"Can I take on more clients?"** — the capacity story: hours/month returned → returns of headroom → "one EA carrying the book of three," with the hours-by-category chart.
- **"How much time did you save me this week?"** — ROI metrics + the where-the-hours-came-back chart.

**Quick factual answers (Ask page or Today composer):**
- "What needs me today?"
- "Why did Marcus Chen's wages drop 40%?"
- "Where does Park Family Dental stand?"
- "What's blocking the Russo return?"
- "What's the deal with the Rodriguez CP2000?"
- "Who missed Q2 estimates?"
- "What did you file this week?"
- "Which clients are at risk?"
- "Chase DeShawn's W-2 again"
- "Did Roberto sign the 8879 yet?"
- "Where are the May books?"

**On any client record (@Petal rail):** "Where do they stand?" · "What documents are missing?" · "What do they owe?"

Matching is keyword-based and forgiving ("did roberto sign yet", "park status", "q2 misses" all hit).

---

## 3. The 3-minute Techstars script

**Setup:** `npm run dev` → open `localhost:3000/os` (lands on Today). Fresh reload. Desktop, full screen, 100% zoom.

**The story:** *Petal is an AI operating system for solo tax firms. The AI does the work; the licensed professional reviews and signs. Every number you'll see is one derived world — and every AI action carries its receipts.*

| ⏱ | Say | Do |
|---|---|---|
| 0:00 | "This is Antonio — a solo Enrolled Agent with 11 clients, mid extension season. This is his 9am." | On **Today**. Let the banner read: *Petal ran 41 actions this week — about 6.5 hours returned. 12 items need you.* |
| 0:20 | "Petal already did the week's grunt work — collected documents, filed three returns he pre-approved, drafted two IRS notice responses. Everything it does carries its receipts." | Click **Sources & reasoning** on the brief's first item — show sources, the rule applied, approval trail. Collapse it. |
| 0:40 | "But here's where it gets interesting. He doesn't just ask about one client — he asks it to think across his whole book." | In the composer, type **"run a risk scan across my book"** → hands off to chat. **Let it run** — the steps stream ("Read 19 engagements… cross-referenced positions, notices, flags… ranked exposure"). |
| 1:00 | "It just audited 19 returns in four seconds — and everything it found is clickable to the actual record." | The answer lands: *6 exposures, 2 high-severity, $4.3k at stake.* Point at the **exposure-by-client chart** (red/amber bars) and the **ranked findings** — the CP2000, the Russo basis decision. Say: "No solo EA has an analyst. Now he does. And every number ties to one source of truth." Optionally click a finding to jump to the record. |
| 1:20 | "But here's the thing about tax — the license on the line is Antonio's. So nothing sends, nothing files, until he signs off. That's the daily habit:" | Back to Today (sidebar). Click **Start reviewing**. |
| 1:35 | "Twelve items, one at a time, sources alongside. Keyboard speed." | In **Review mode**: first item is the capital-gains decision — point at options A/B/C and *Petal recommends A*. Press **A**. Next is a drafted client email — press **A**. One more — **A**. |
| 2:00 | "Watch the number." | Press **Esc** → back on Today: badge and headline now read **9**. "Approved on his keyboard, before coffee." |
| 2:15 | "Trust is graduated, per skill — Petal starts by drafting everything, and earns autonomy the same way a junior would." | Sidebar → **Skills**. Open **Doc Chase** — show the T0–T3 trust dial and the graduation prompt: *"You've approved 12 drafts without edits — promote?"* |
| 2:35 | "And when the IRS comes knocking, the answer is already drafted — with the position documented." | Sidebar → **Notices** → open the **CP2000**. Show the drafted response letter + the respond-by countdown. |
| 2:50 | "Every action, logged for audit. That's Petal: the AI does the work, the professional stays in command — and gets ~6.5 hours a week back to take the clients they've been turning away." | Sidebar → **Activity** (scroll the flight recorder). End on **Today**. |

### If you have 5 minutes, add
- **Client record deep-dive** (after 1:00): click *Open record* from the chat answer → the Park header strip, **Returns tab** (K-1 relationship graph + the workpaper: "trace any line back to the run, the workpaper, and the source document"), **Positions tab** (the open home-office position).
- **Returns board**: "Where is every return? One board — $9,000 in pipeline, $5,200 blocked on documents."
- **Inbox**: the Park call transcript with extracted follow-ups, and the "Petal can answer" chip on Karen's refund question.

### Recovery moves (live-demo insurance)
- **Typed something unscripted?** The fallback offers suggestion chips — click one and keep talking; it reads as a feature ("in the demo build I keep it to the firm's records").
- **Lost your place?** Sidebar → Today always re-anchors. The story re-enters anywhere.
- **Numbers look wrong?** You hard-refreshed mid-run; refresh once more and say "let me reset the morning."
- **Q&A ammo:** `/os/debug/tie-out` (27 derivation checks — "we obsess over data integrity"), Settings → Trust & autonomy (the §7216/zero-retention assurances), Practice (the firm dashboard).

### One-line answers for likely Techstars questions
- *Is the AI real?* — "The product is a high-fidelity functional prototype; the AI layer is scripted for the demo. The provenance, trust-tier, and review architecture is the real IP — the model plugs into it."
- *Why now?* — "Ramp launched Stack for accounting firms three weeks ago and raised $750M doing it — but for bookkeeping close. Tax is the bigger, harder, license-gated half. That's ours."
- *Who's the buyer?* — "58,000 solo EAs/CPAs in the US. Our design partner is a real one — this demo is his actual practice shape."

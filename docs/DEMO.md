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

## 3. The demo narration (voiceover script — Ramp Stack style)

**Setup:** `npm run dev` → open `localhost:3000/os` (lands on Today). Fresh reload. Desktop, full screen, 100% zoom. Record screen + mic, or perform live.

**Voice:** first person, in-character as Antonio the EA, warm and moving. Narrate as you click — the actions are implied by the words, the way the Ramp Stack walkthrough does it. (Pitching live instead of recording? Shift to third person — "This is Antonio's morning…" — same words otherwise.)

> Type only the **scripted questions** (§2). Never hard-refresh mid-run (it resets approvals — that's the reset *between* takes). Each ❡ below is one screen.

---

❡ **Home — Today.**
"How's it going? I'm Antonio — a solo enrolled agent, just me and a part-time admin — and today I want to walk you through Petal, the AI operating system I run my entire tax practice on. We start here on my home screen, where I can take quick action, throw any ad-hoc request at Petal, get a read on where all my returns stand, and see exactly what needs my attention this morning. Right up top it's telling me Petal ran 41 actions for me this week — about six and a half hours of work — and that twelve things need me."

❡ **Ask Petal — the risk scan.** *(type "run a risk scan across my book" into the composer)*
"But today, let's actually put it to work. It's extension season, and before I touch anything I want to know where I'm exposed across my whole book — so I'll just ask it: run a risk scan across my book. Now watch what Petal does. First it grounds itself in what it knows — my firm's constitution, my client memory, my prior-year returns, and the systems I've connected. Then it tells me exactly what it's doing: it reads all nineteen of my open returns, cross-references every tax position, every IRS notice, every variance flag — and it pulls that data right from the source and references it, so I have full visibility into what it's looking at. Through every step I get complete traceability — the data it used, the rule it applied, the conclusion it reached — so I always know how it's operating, and I can correct it whenever I need to."

❡ **The result.**
"And within seconds, Petal hands me the picture: six exposures worth my attention, two of them high-severity, about forty-three hundred dollars of tax at stake. It even charts it for me by client, and ranks every finding — and the best part, each one is one click from the actual record. No solo EA can afford an analyst to do this. Now I have one."

❡ **Client deep-dive — the file defends itself.** *(click the last finding, "Home office + vehicle mixed-use — Park Family Dental")*
"Let me click into this one on Park Dental. It takes me straight to the position on the client's file — a home-office position Petal flagged as aggressive — and it's already documented the authority and the confidence behind it, so the file defends itself. And up here in the header, every number is derived from one source of truth — the stage, the deadline, thirty-two of thirty-four documents in, the fee, the balance — the same figures Petal just quoted me in the chat."

❡ **Returns tab — traceability.** *(open the Returns tab)*
"And this is the part I love. Petal drew the relationship between the client's S-corp and their personal return — the K-1 flows right through, and it mapped that for me. And every figure on this return traces back to the workpaper, the run that produced it, and the source document it came from. I can always come back here and see exactly how a number was built. That's what gives me audit-level confidence using a tool like this. And right next door, the compliance tab tracks every e-file authorization — nothing gets transmitted until it's signed and I've approved it."

❡ **Skills — the operating procedure, and trust.** *(Sidebar → Skills → open Doc Chase)*
"All of this runs on skills. If I open one up — here's my document-chase skill — I can see the exact operating procedure Petal follows: the trigger, the steps, the tone it uses with my clients, when it escalates. And trust is graduated. Petal starts by drafting everything for me to approve, and as I approve without edits, it offers to take on more — the same way I'd graduate a junior preparer. Right here it's telling me I've approved twelve of these in a row without a change, and asking if I want to promote it. I decide how much it does."

❡ **Returns board — where is every return.** *(Sidebar → Returns)*
"Let me zoom all the way out for a second. Where is every return in my practice? One board. Petal lays them out across their stages — from collecting documents all the way to accepted — and right at the top it's telling me I've got nine thousand dollars of fees in the pipeline, and that fifty-two hundred of it is blocked behind missing client documents. Which is exactly what those document-chase skills are clearing for me, every day, without me lifting a finger."

❡ **Inbox — every channel, and Petal answers.** *(Sidebar → Inbox → open the Park call, then Karen's refund question)*
"And all of my client communication lives here too — email, text, the portal, even my calls. Petal sat in on my books review call with this client, transcribed the whole thing, and pulled out two follow-ups as tasks for me automatically. And on the routine questions — here's a client asking where her refund is — Petal already knows the answer from her file and drafted the reply for me. I just glance at it, and send."

❡ **Review mode — the calls only I can make.** *(Sidebar → Today → Start reviewing)*
"Now here's the thing about tax: the license on the line is mine. So nothing sends, and nothing files, until I sign off — that's my daily habit. Let me jump into review mode. Petal lines up everything that needs me, one at a time, with the sources right alongside. Here's a real one: capital gains where seven of twenty-three lots are missing their cost basis. Petal didn't guess — it stopped, laid out my three options, and recommends requesting the records from the client. I agree, so I approve it, right from my keyboard. Next, a drafted client email — approve. One more — approve. And watch the number up here: my queue just dropped from twelve to nine. That's a morning's worth of decisions, done before my coffee got cold."

❡ **Notices — the IRS, already handled.** *(Sidebar → Notices → open the CP2000)*
"And when the IRS comes knocking, the answer is already drafted. Here's a CP2000 on the Rodriguez return — Petal read it, matched it against the filed return, found that the IRS matched the income to the wrong year, and drafted the dispute with the schedule and the form attached. I just review the position, and approve."

❡ **Activity — the flight recorder.** *(Sidebar → Activity)*
"And every single action my firm takes — mine, and my admin Elena's — is logged right here, with its sources and its approvals. It's a complete flight recorder. When the IRS, or a reviewer, or a client asks how something was handled, the answer is one click away."

❡ **The client meeting — out of the weeds.** *(Sidebar → Today → composer: "show me the financial picture")*
"And speaking of clients — I've got a planning call in a few minutes. So let me just ask Petal for the financial picture of the practice. Same thing — it grounds itself, pulls the numbers, shows its work — and hands me a clean read with a chart I can actually talk through. I walk into that call out of the weeds, and ready to advise."

❡ **Close.**
"And that's the real power of Petal. In a few minutes, I scanned my entire book for risk, made the calls only I'm licensed to make, cleared a stack of approvals, and got ready for a client call — work that used to eat my whole morning. Now I've got that time back to actually be a strategic advisor. My firm wins, and my clients win."

---

### Staging cheat-sheet (the same beats, as clicks)

> **3-minute cut:** run only the beats marked ★. Skip the Deep-dive, Returns board, and Inbox rows.

| ⏱ | Say | Do |
|---|---|---|
| ★ 0:00 | "This is Antonio — a solo Enrolled Agent with 11 clients, mid extension season. This is his 9am." | On **Today**. Let the banner read: *Petal ran 41 actions this week — about 6.5 hours returned. 12 items need you.* |
| ★ 0:20 | "Petal already did the week's grunt work — collected documents, filed three returns he pre-approved, drafted two IRS notice responses. Everything it does carries its receipts." | Click **Sources & reasoning** on the brief's first item — show sources, the rule applied, approval trail. Collapse it. |
| ★ 0:40 | "But here's where it gets interesting. He doesn't just ask about one client — he asks it to think across his whole book." | In the composer, type **"run a risk scan across my book"** → hands off to chat. **Let it run** — the steps stream ("Read 19 engagements… cross-referenced positions, notices, flags… ranked exposure"). |
| ★ 1:00 | "It just audited 19 returns in four seconds — and everything it found is clickable to the actual record." | The answer lands: *6 exposures, 2 high-severity, $4.3k at stake.* Point at the **exposure-by-client chart** (red/amber bars) and the **ranked findings**. Say: "No solo EA has an analyst. Now he does." Then: "And every finding is one click from the file." **Click the last finding — "Home office + vehicle mixed-use — Park Family Dental."** |
| **Deep-dive** 1:20 | "It jumped me straight to that position on Park's record. When a position is aggressive, Petal documents the authority and the confidence — substantial authority, 74% — so the file defends itself." | You're on the **Park record, Positions tab**. Point at the open position + its documentation. Then point at the **header strip** — "and every number up here is derived: Ready to Prep, docs 32 of 34, fee, balance — the same figures Petal just quoted." |
| 1:45 | "Here's the part auditors love. The K-1 from the S-corp flows to the personal return — Petal drew that relationship. And the workpaper traces *every line on the return back to the run, the workpaper, and the source document.*" | Open the **Returns tab**: point at the **K-1 relationship graph** ("David & Grace Park (1040) ← K-1 ← Park Family Dental (1120S, 100%)") and the **workpaper block** — click a line's *View run*. |
| 2:05 | "And compliance is its own tab — every 8879 and e-file authorization tracked, nothing transmitted until signed and approved." | **More ▾ → Compliance** — the preparer authorizations + per-return 8879 / e-file status. |
| **Returns board** 2:20 | "Zoom out — *where is every return?* One board. $9,000 of fees in the pipeline, and it tells me $5,200 is blocked on missing documents — which is exactly what the chases are clearing." | Sidebar → **Returns**. Point at the 7 stage columns and the header strip (fees in pipeline / blocked by docs). |
| **Inbox** 2:45 | "Client comms live here too — email, SMS, portal, and calls. Petal sat in on David's books call, transcribed it, and pulled out two follow-ups as tasks." | Sidebar → **Inbox** → open the **Park books review call** (Call channel) → show the transcript + *Petal extracted 2 follow-ups*. |
| 3:05 | "And on routine questions, it just drafts the answer." | Open **Karen O'Brien — "Where's my refund?"** → click the **Petal can answer** chip → the drafted reply fills the composer. (Optional: click **Approve & send** — it posts into the thread.) |
| ★ 3:20 | "But here's the thing about tax — the license on the line is Antonio's. Nothing sends, nothing files, until he signs off. That's the daily habit:" | Sidebar → **Today**. Click **Start reviewing**. |
| ★ 3:35 | "Twelve items, one at a time, sources alongside. Keyboard speed." | In **Review mode**: first item is the capital-gains decision — point at options A/B/C and *Petal recommends A*. Press **A**. Next, a drafted client email — **A**. One more — **A**. |
| ★ 4:00 | "Watch the number." | Press **Esc** → back on Today: the badge and headline now read **9**. "Approved on his keyboard, before coffee." |
| ★ 4:15 | "Trust is graduated, per skill — Petal drafts everything first, and earns autonomy the way a junior would." | Sidebar → **Skills**. Open **Doc Chase** — the T0–T3 trust dial and the graduation prompt: *"You've approved 12 drafts without edits — promote?"* |
| ★ 4:35 | "And when the IRS comes knocking, the answer is already drafted — with the position documented." | Sidebar → **Notices** → open the **CP2000** — the drafted response letter + respond-by countdown. |
| ★ 4:50 | "Every action, logged for audit. That's Petal: the AI does the work, the professional stays in command — and gets ~6.5 hours a week back to take the clients they've been turning away." | Sidebar → **Activity** (scroll the flight recorder). End on **Today**. |

> **Deep-dive note:** the More ▾ dropdown holds Billing, Notices, Positions, Compliance, Notes. If you'd rather not open the menu twice on stage, deep-link Positions directly: the at-risk link and chat both jump there, or just narrate Compliance from the Positions view.

### Recovery moves (live-demo insurance)
- **Typed something unscripted?** The fallback offers suggestion chips — click one and keep talking; it reads as a feature ("in the demo build I keep it to the firm's records").
- **Lost your place?** Sidebar → Today always re-anchors. The story re-enters anywhere.
- **Numbers look wrong?** You hard-refreshed mid-run; refresh once more and say "let me reset the morning."
- **Q&A ammo:** `/os/debug/tie-out` (27 derivation checks — "we obsess over data integrity"), Settings → Trust & autonomy (the §7216/zero-retention assurances), Practice (the firm dashboard).

### One-line answers for likely Techstars questions
- *Is the AI real?* — "The product is a high-fidelity functional prototype; the AI layer is scripted for the demo. The provenance, trust-tier, and review architecture is the real IP — the model plugs into it."
- *Why now?* — "Ramp launched Stack for accounting firms three weeks ago and raised $750M doing it — but for bookkeeping close. Tax is the bigger, harder, license-gated half. That's ours."
- *Who's the buyer?* — "58,000 solo EAs/CPAs in the US. Our design partner is a real one — this demo is his actual practice shape."

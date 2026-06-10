# Petal OS — Design Language (LOCKED)

> Source of truth for the `agentic-os` remake. Locked references (verified on Mobbin, not invented):
> - **Attio** → records skeleton (tables, record detail, attribute panels, the sidebar).
> - **Linear** → work surfaces (Tasks, Today, Inbox): hairline rows, status glyphs, flat property rails, density.
> - **Mercury** → the premium bar: generous whitespace, calm monochrome, color only on amounts/state, charts as soft single-hue tints. This is the "expensive financial tool" feel Petal should hit.
> - **Relevance AI** → the agent layer: colorful identity lives **only on agents**, the rest stays monochrome.
>
> **Rule for all contributors (and CLAUDE): read this before any visual/UI decision. Do not deviate without updating this file.**

## 0. The one sentence
Near-monochrome, white-canvas, Inter, hairline-bordered, low-radius, calm. Color is
**punctuation**, never decoration. Primary actions are near-black, not colored.

## 0.5 The product idea (what every pixel serves)
Petal is an **agentic OS for a tax practice**: a roster of AI agents does the work under a
Firm Constitution + trust tiers; the human **reviews and decides**. The whole UI exists to
make delegation feel **safe** (citations, diffs, receipts, trust tiers) and the human feel
in **calm control**. Lead with the work, make records the reference, hide the config.

**Surface → reference (which app to copy for each):**
| Surface | Copy from |
|---|---|
| Today (command center), Tasks, Inbox | **Linear** (+ Mercury calm) |
| Clients, Returns, record detail | **Attio** (+ Mercury polish) |
| Agents, Skills | **Relevance** (agent identity) over an Attio table |
| Overall polish / restraint bar | **Mercury** |

**Ask Petal is NOT a chatbot.** No cutesy persona, no emoji greeting, no "Hey Sam 👋"
(reject the Base44/Chatbase consumer flavor). It's a quiet, professional command surface —
Linear/Mercury restraint. Petal's warmth lives in plain, clear copy, not in chrome.

---

## 1. Type (verified: Attio uses Inter + Inter Display)

- **UI / body:** `Inter` — weights 400 / 500 / 600. `tabular-nums` on all numbers.
- **Headings / display:** `Inter Display` (optical), weight 600, tracking `-0.01em`.
  (Fallback: `Inter` 600 tighter tracking — already Petal's primary font.)
- **No serif in-app.** (Attio uses Tiempos only on its marketing site.)
- **No uppercase labels.** Section labels are sentence-case, small, muted (Attio style).

### Scale (5 steps — that's it)
| Token | px / line-height / weight | Use |
|---|---|---|
| `display` | 20 / 26 / 600 | page title |
| `title` | 15 / 20 / 600 | section / card title |
| `body` | 13 / 18 / 400 | default text, table cells, attribute values |
| `meta` | 12 / 16 / 400 (muted) | secondary, timestamps |
| `label` | 11 / 14 / 500 (muted) | sidebar section labels, column headers |

---

## 2. Color tokens (light) — near-monochrome

```css
:root {
  /* surfaces */
  --bg:            #FFFFFF;   /* main canvas (Attio bodyBg = pure white) */
  --bg-subtle:     #FBFBFA;   /* sidebar, hover fills (barely warm off-white) */
  --surface:       #FFFFFF;   /* cards/panels */
  --selected:      #F0F0EF;   /* selected nav item / row */

  /* ink (Attio bodyColor ≈ near-black) */
  --ink:           #1A1A1A;   /* primary text */
  --ink-muted:     #6B6B70;   /* secondary text, icons */
  --ink-subtle:    #9B9BA0;   /* tertiary, placeholders */

  /* lines */
  --border:        #ECECEC;   /* hairlines (the workhorse) */
  --border-strong: #E0E0E0;   /* inputs, stronger separation */

  /* primary action = near-black (Attio's CTA is black, not colored) */
  --primary:       #1C1C1E;
  --primary-fg:    #FFFFFF;

  /* accent — used ONLY for links / active state, sparingly */
  --accent:        #2F6BFF;   /* calm blue (Attio's link/selection blue) */

  /* status — rare, only for state */
  --success: #16794C;  --warning: #B45309;  --danger: #C2410C;  --info: #2F6BFF;

  /* radius */
  --radius-sm: 6px;  --radius-md: 8px;  --radius-lg: 10px;  /* Attio is low-radius/crisp */
}
```
- **The chrome stays monochrome** — canvas, text, borders, nav, buttons all use the
  tokens above. Color is never decoration on the chrome.

### 2a. Color layer ("color carries meaning") — the Relevance model
The monochrome chrome is the stage; color lives only on **the AI layer and state**. This is
the Relevance pattern: a colorful agent roster acting on an otherwise calm, Attio/Mercury ledger.

- **THE LINE (resolves every past over-coloring):** gradient orbs are the **AI / system layer
  ONLY** — agents, skills, and connected tools/integrations. **Humans and records (clients,
  people, you, team) use flat initials / favicon avatars (Attio/Mercury), never orbs.** Keep
  the book of business calm; let the AI workforce be the alive, colorful thing on top of it.
- **Agent gradient orbs.** Each Agent owns a fixed gradient (`from-X to-Y`) — color *is* its
  identity. Premium "app-icon" treatment: `bg-gradient-to-br` + top white gloss +
  `ring-1 ring-inset ring-white/20` + `shadow-sm`, radius 6–10px, optional white glyph. The
  same gradient tags that agent everywhere (roster, Tasks "run by", Skills owner). Palette:
  indigo→violet, emerald→teal, amber→orange, sky→blue, rose→pink, violet→fuchsia.
- **PetalMark = AI-authorship marker, monochrome.** Wherever Petal authored content (a drafted
  reply, a recommendation, a receipt), mark it with the PetalMark + a quiet label ("Petal
  drafted"), rendered **monochrome** (`currentColor`, muted) on a **neutral** surface — never a
  green/colored tint wash (that reads vibe-coded; we tried it, it was wrong). The mark is the
  signal; color is not.
- **State color = punctuation only** (Mercury): a single small **dot or glyph** + neutral text
  (Linear status style). Amounts may carry subtle color (money-in green). Soft-fill pills allowed
  only in a detail/header context, never stacked on dense table rows. No saturated blocks.
- **Still forbidden:** colored *page* backgrounds, gradients anywhere except agent orbs, rainbow
  icon circles on the chrome, color where it carries no meaning, marketing callout banners in-product.

### 2b. Color balance rule (don't over-color)
A single row/cell shows **at most two** color sources: the **identity orb** + **one**
status mark (a small dot or, in a detail header, one tinted pill). Everything else in the
row stays monochrome. Metric bars are a single neutral tone unless the value is itself the
status. Tinted *pills* live in detail/header context, not stacked on every table row —
in dense tables use a small colored dot + neutral label instead. If a screen reads as
"colorful," remove color until only meaning remains.

### 1b. Iconography
Two deliberate tiers:
- **Chrome / sidebar nav → Lucide.** The left rail keeps Lucide (familiar, neutral,
  Attio-like). Agents nav uses `Orbit` (never a robot/`Bot`, never `Sparkles`/sparkle).
- **Page content → Hugeicons** (`@hugeicons/react` + `@hugeicons/core-free-icons`,
  stroke-rounded), centralized in `components/os/icon.tsx` (`<Icon icon={I.x} size={px} />`,
  `currentColor`, stroke 1.5). All in-page headers, tabs, buttons, list/flow glyphs use this.
  Add new glyphs to the `I` map; don't import ad hoc.
- Agents do **not** use glyph icons anywhere — their identity is the gradient orb (`AgentAvatar`).

### 5b. Motion (functional, fast)
- Opening a detail (Agent builder, Task run, Skill switch) animates the panel in:
  `opacity 0→1, x 14→0` (or `y 6→0`), **~160–180ms ease-out**, via `motion/react`
  `AnimatePresence` keyed on the record id (so switching records re-animates).
- Primary buttons: `active:scale-[0.97]`. Rows: color hover only.
- No bounce, no long durations, no decorative motion. If it draws attention to itself, cut it.

---

## 3. The sidebar (1-to-1 with Attio)

- **Width:** 240px. Background `--bg-subtle`, right edge a single `--border` hairline.
- **Top block:** workspace switcher (16px logo + name 13/600 + chevron) · `⌘K` Quick
  actions · collapse icon. Compact.
- **Nav item:** `[16px monochrome icon] [label 13/400]`, height **28px**, radius `6px`,
  padding-x 8px, ~1px gap between items.
  - hover: bg `--selected`; selected: bg `--selected` + ink `--ink` (icon darkens). No
    heavy active bar, no color fill — just the gray.
- **Section labels** ("Favorites", "Records", "Lists"): `label` token (11/500 muted),
  margin-top 16px, padding-x 8px, sentence-case.
- **Bottom:** invite / help / usage meter — small, muted.

---

## 4. Core component patterns (from Attio's screens)

**Record table (object list):** row height 36px, `--border` dividers, sticky first column
(icon + name), column headers in `label` token with hover sort arrows, inline "+ New" row,
"+ Add calculation" footer cells. Selection = `--selected`.

**Record detail header:** `[object icon] [name 15/600] [☆]` left; ghost-style actions right
("Run skill · Compose · Add to view · ⋯"). One hairline under it.

**Details / attribute panel (right):** collapsible groups ("Record Details", "Lists").
Attribute row = `[icon + label, meta token, muted]` left / `[value, body token]` right,
height ~32px, inline-editable (hover reveals affordance). No card borders inside the panel.

**Activity item (= Memory + audit):** small dot/avatar + `actor did X` (body) + relative
time (meta); expandable to show field-level diffs (`Stage → Meeting`, struck old value).

**Tabs** (record center): underline indicator, `body` weight 500 active / muted inactive.

**Buttons:**
- primary: bg `--primary`, `--primary-fg`, radius `--radius-md`, h-32, 13/500.
- secondary: `--surface` + `--border`, ink.
- ghost: transparent, `--ink-muted` → `--ink` on hover.

**Chips:** soft-fill, `radius-full`, 11–12px, used only for status/stage.

---

## 5. Spacing & motion
- Base unit **4px**. Generous, uniform padding. Calm density (Sana).
- One focal action per screen; everything else recedes.
- Motion: 150–250ms, ease-out; minimal-functional only. No flourishes.

---

## 6. Anti-patterns (the "no vibe code" list)
Gradients **only** on agent/AI-layer orbs and the two sanctioned crafted moments (§7) ·
no colored icon circles on the chrome · orbs never on humans/records · no green/tinted
PetalMark wash (mark is monochrome) · no marketing callout banners in-product **except the
§7 patterns** · no cutesy AI-chatbot persona · no uppercase labels · no ad-hoc font sizes
outside the 5-step scale · no hard boxes where a hairline + spacing will do · no saturated
status blocks (soft-fill only) · no high border-radius.

---

## 7. Crafted moments (added Jun 9, 2026 — Ramp Stack / Ferndesk research)

Two — and only two — sanctioned departures from flat monochrome. Both exist to make the
product feel crafted, not decorated (references: Ramp Stack's home + "Start automating your
checklist" callout; Ferndesk's greeting-with-stats home). Everything around them stays calm.

1. **Today hero banner.** `/images/today-banner.jpg` under a left-weighted black gradient
   (`from-black/80 via-black/50 to-black/20`), eyebrow `PetalMark + "Daily brief · {date}"`,
   white greeting + one summary sentence with derived numbers. Today only — never on other pages.
2. **FeatureCallout** (`components/os/callout.tsx`). Two-pane box: soft sage→cream wash
   (`linear-gradient(105deg, #edf4ec, #f6f5ec, #fbfaf9)`) with copy + ONE primary action on
   the left; a deeper-tint pane on the right holding a small white preview card of the REAL
   artifact (derived data, never a mock illustration). **Max one per page.** Current uses:
   Today (review queue), Books (run-with-Petal).

**The section grammar — Ramp Stack (reference #1, studied from the firm's own Stack account;
proven on Today, Jun 9, 2026).** Hierarchy comes from TYPE CONTRAST and air — never from
boxes, tinted icon tiles, colored pills, or dot columns (tinted glyph tiles in pastel squares
were tried and rejected as "vibe coded"):
- **Section eyebrows**: 12/500 sentence-case ink-muted, sitting on the canvas above the
  content, optional count + a right-aligned quiet underlined link. No uppercase.
- **Lists are typographic**: headline 13.5/600 over a 12.5 muted detail line, tall rows
  (py-3.5–4), hairline dividers, hover-only chevrons. No leading marks.
- **Metadata = small gray chips** (rounded-md, bg --os-selected, 10.5/500 muted) — like
  Ramp's "Owner" chip. Never colored pills in rows.
- **State = plain colored text** (11/600: red-600 "At risk", amber-700 "Watch") next to the
  name — Mercury/Ramp style. Dots only where a legend defines them (boards, charts).
- **Row actions = quiet underlined links** (Ramp's "Edit"): 12px ink-muted, hairline
  underline, right-aligned. Bordered buttons only for primary actions in headers/callouts.
- **Entity rows** lead with the flat initials avatar; one state word; one action.
- **The Ramp close card**: progress modules = title row → segmented bar → a row of
  number-over-label stat blocks (20/600 tabular number over 12 muted label with its dot).
- **Stats live in sentences**: the hero carries the week's numbers inside its one summary
  sentence; no standalone stat strips on content pages.
- **One accent moment per screen** (the gradient callout, or one primary button) — everything
  else stays monochrome. Page titles elsewhere may go display-large (28–36/600, tight
  tracking) to create the Ramp type-contrast; sections stay 13–15.

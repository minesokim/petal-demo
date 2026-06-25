# Petal — Reference Library ("things we may use")

> Durable bookmark of external resources, codebases, and strategies surfaced in research sessions.
> Not all are adopted — each has a **license**, a **verdict**, and **where it fits**. Companion to
> `docs/AUTHORITY_SOURCES.md` (live source-wiring status) and the retrieve-on-demand fetch-path spec.
> Last curated: 2026-06-25.

## 0. The licensing filter (decides fork-vs-reference)

For a **closed, commercial SaaS** this single rule sorts every codebase below:
- **MIT / Apache-2.0 / BSD / public-domain** → SAFE to fork into Petal.
- **AGPL-3.0 / GPL** → reference / learn-from ONLY. AGPL's network clause can force open-sourcing
  Petal; if ever used, isolate as a separately-deployed service, don't statically link.
- **Elastic License 2.0** (Invoice Ninja), **BSL** (Akaunting) → source-available, NOT OSI open
  source; cannot fork for a competing product. Reference their data models, not their code.

## 1. Tax rules-as-code — cross-checks for `lib/tax` (validate against, don't embed)

The highest-strategic-value use: run these, compare Petal's deterministic worksheet outputs, and claim
"validated against the canonical open tax models." None go *into* Petal.
- **PolicyEngine-US** (AGPL, Python) — federal **and state**, validated every release against NBER's
  TAXSIM-35. The most current open implementation. Top reference.
- **PSLmodels/Tax-Calculator** (open policy license, Python) — canonical federal individual+payroll model.
- **IRS-Public/direct-file** (public domain, Scala) — the IRS's own filing logic + the **Fact Graph**
  (declarative knowledge graph that reasons over *incomplete* returns — directly analogous to guided
  prep). Archived; **openfiletax/openfile** is the community fork.
- **OpenTaxSolver** (GPL, C), **habutax** (Python, fills PDF forms), **mmacpherson/tenforty** (Python
  wrapper), **ustaxes/UsTaxes** (TS, browser 1040 — same language, most readable reference).

## 2. Document extraction (slice ③ — documents + extraction)

- **TaxHacker** (vas3k) — **MIT**, Next.js / Postgres / Prisma / TypeScript — *same stack*, LLM-vision
  receipt/invoice extraction, supports local models via Ollama. **Primary borrow candidate.** "Keep tabs."
- **invoice-x/invoice2data** — MIT, Python, template-based field extraction. Lighter fallback.
- **Arelle** — Apache-2.0, the free XBRL/iXBRL platform (SEC EDGAR runs on it). If financial-statement
  / XBRL data ever enters scope.

## 3. Bookkeeping / ledger — NOW IN SCOPE (2026-06-25)

Double-entry ledger is a first-class future subsystem (Petal will do bookkeeping, not just tax).
- **Actual Budget** — **MIT, TypeScript, local-first.** The ONLY freely-forkable, same-language ledger.
  **Primary borrow candidate** for the ledger core + sync model.
- Reference-only (copyleft) double-entry models to study: **Ghostfolio** (AGPL, NestJS+Prisma+Postgres —
  closest stack), **Beancount** (GPL, strict balance-enforcing, LLM-friendly + has an MCP server),
  **Frappe Books** (AGPL, TS, financial-statement generation), **Firefly III** (AGPL, PHP — rule-based
  categorization + a decoupled importer service), **Maybe** (AGPL, Rails — best-documented event-sourced
  finance model; repo archived Jul 2025), **ERPNext** (GPL), **Ledger / hledger / GnuCash** (plain-text).
- Crypto cost-basis (if crypto clients): **rotki** (AGPL — FIFO/LIFO/ACB per jurisdiction).
- **Connector:** Xero (Antonio already uses it) → connectors slice ⑤, MCP-first; high-stakes posts are
  DRAFT-ONLY per the risk gate.

## 4. Billing / AR (slice ⑦)

- **Prefer Stripe** over forking a billing engine. **Lago** (AGPL) reference-only; **Invoice Ninja**
  (Elastic License) source-available, not forkable — but its e-invoicing UBL / Factur-X schemas are a
  useful standards reference for compliant invoice output.

## 5. Research-AI authority sources (wiring status in `docs/AUTHORITY_SOURCES.md`)

- **Wired:** GovInfo (USCODE / PLAW), DAWSON (US Tax Court, keyless), IRS Internal Revenue Bulletin
  (irs.gov scan), **Federal Register API** (Treasury/IRS regulations — the structured tier-1 that fixed
  the remittance-tax question; final Rule = reg authority, Proposed Rule = directional/flagged).
- **To add, priority order:** CourtListener (all-courts case law + a citation resolver), Congress.gov
  (bill/law status), IRS Written Determinations, JCT Blue Books, California (leginfo + FTB).

## 6. IRB scanning strategy (how the corpus stays current)

- IRB = the IRS's authoritative **weekly** guidance record, numbered `YEAR-WEEK`; both PDF
  (`/pub/irs-irbs/irbNN-NN.pdf`) and HTML (`/irb/{issue}_IRB`, HTML for issues after Jun 2003).
- **Triage surface = "Highlights of This Issue"** (per-item synopses) — fast to skim but **NEVER
  citeable**; always resolve to the full text in Parts I–IV.
- **Supersession tracking = the Finding Lists at the back** (what got obsoleted / modified / revoked /
  amplified). Track these, not just new items — else the corpus serves dead authority.
- **Latency tiers (push vs pull):** Federal Register API (fastest, regs, structured JSON) → IRS
  **GuideWire** email subscription ("early drops", incomplete) → the IRB itself (authoritative, complete,
  the only place the Finding Lists live).
- **Source-tiering principle:** pull from the most-structured source first (Federal Register JSON), fall
  to IRB HTML, fall to PDF only as a last resort.
- **PDF fallback tools:** Docling (IBM, **MIT**) or Marker (Datalab, GPL) — PDF→Markdown, run as a
  Python sidecar, **tier-3 only**. Docling's MIT license is the cleaner choice for a commercial product.

## 7. Codex dev setup (local GPT-5.5 evaluation)

- `PETAL_DEV_INFERENCE=codex-sub` in `.env.local` → localhost runs on **GPT-5.5** via a CLIProxyAPI
  proxy at `http://127.0.0.1:8317/v1` (key `PETAL_DEV_OPENAI_KEY`).
- Runs on codex locally: BOTH the research/draft **tools** (`getProvider`) AND the agent **loop**
  (`lib/agent/codex-seam.ts` — translates the Anthropic tool-call shape ↔ OpenAI proxy, streams live).
- **HARD-GATED:** `usingDevCodexProvider()` requires `!isDeployed()`; the OpenAI provider's constructor
  throws on any deployed server. **Production is ALWAYS Anthropic Opus** (ZDR/BAA — the §7216 boundary).
  Codex path = **synthetic / demo data ONLY**.
- Switch back to the Claude baseline: `PETAL_DEV_INFERENCE=` (empty).

## 8. Measured error rate (the moat — release gate)

- Harness: `scripts/research-benchmark.mts` over `tests/research/golden/cases.ts`; `--no-judge` for the
  deterministic grade. `PETAL_DEV_INFERENCE` toggles Claude vs GPT-5.5 on the same golden set.
- Latest run (2026-06-25, Claude baseline, `--no-judge`): **80.8% pass (21/26)**. 5 abstain-regressions
  flagged for investigation — salt-cap §164, salt-phasedown, tips-SE-tax (OBBBA), estate §2010, qbi
  §199A — all "expected answer, got abstain / no citation". NOT yet confirmed as caused by the
  `reasonAndScore` drop-on-error change vs. being the no-judge baseline; needs a clean before/after.

## 9. Blocked on David (not engineering)

- **§7216 counsel decision** — gates real taxpayer data through the model (`PETAL_7216_CLEARED`).
- **Rotate exposed credentials** — Codex OAuth token, GovInfo API key, Twilio creds (pasted in chat).

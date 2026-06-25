# The Spine: Versioned Authority Graph + Neuro-Symbolic Split

> The keystone of the research-AI plan. Six of the eight scorecard dimensions (corpus, retrieval,
> authority-weighting, deterministic-numbers, grounding, calibration) are PROPERTIES of this one
> machine, not separate features. Coverage is breadth on the graph; research→execution is the action
> layer on top. Build this, and the grades move together. Stack: Next.js + Supabase Postgres + Drizzle
> + pgvector (project dzqfecbvxifykzsqssdb). Model inference for ingest/retrieval dev = codex proxy
> (never Petal's metered Anthropic key); production stays Anthropic ZDR.

## 0. Honest, resource-scoped target

A is the goal on the five we CONTROL — retrieval, grounding, deterministic-numbers/eval, calibration,
research→execution/trust. A- on primary-authority coverage (all free/public sources) and on
authority-weighting in the COMPLIANCE lane (not litigation-outcome prediction). The two rigged axes —
licensed editorial commentary ($3k+/user, enterprise-locked) and 50-state formalized depth (person-
years) — are explicitly scoped, with the coverage manifest turning partial coverage into a trustworthy
boundary, never a bluff. We do not fake a grade we cannot defend in front of an EA.

## 1. The neuro-symbolic split (the non-negotiable rule)

The language model is NEVER the source of truth for anything verifiable. It does three jobs only:
- **retrieve** — find candidate authority versions,
- **translate** — statute prose → formal rule inputs; client facts → structured inputs,
- **synthesize** — write prose around results it did not invent.

Truth lives in two symbolic stores: the **authority graph** ("what the law says and when") and the
**`lib/tax` compute engine** ("what the number is"). This is already Petal's seed (typed cited figures,
the figure-gate, no-citation-no-claim); the plan grows it into the whole reasoning layer.

## 2. Schema (Drizzle / Postgres on Supabase)

Point-in-time versioning is the keystone decision: never store "§199A" as one blob — store
§199A-as-it-read-for-TY2024 and §199A-as-amended-by-OBBBA-for-TY2025+ as distinct linked versions.
Freshness, point-in-time currency, and supersession then become the NATIVE SHAPE of the data, not
bolt-ons.

```
authority_node            -- stable identity across versions
  id (pk), kind ENUM(statute|regulation|case|ruling|procedure|notice|form_instr|state),
  citation (canonical, e.g. "IRC §199A"), jurisdiction (federal|<StateCode>),
  court_level (tax|district|circuit|supreme|null), circuit (1..11|DC|Fed|null)

authority_version         -- point-in-time slice of a node
  id (pk), node_id (fk), valid_from DATE, valid_to DATE (null=current),
  tax_years int[],            -- years this version governs
  text TEXT, source_url, raw_blob_url (R2/Supabase storage), content_hash,
  authority_class SMALLINT,   -- §6662 substantial-authority weight (statute>reg>...>PLR)
  delegation_basis ENUM(express|general_7805|skidmore|null),  -- post-Loper-Bright
  precedential BOOL, ingested_at TIMESTAMPTZ

authority_edge            -- the citation graph (the differentiator vs flat RAG)
  from_version (fk), to_version (fk),
  edge_type ENUM(cites|amends|supersedes|implements|invalidates|interprets|relies_on),
  source ENUM(structural|extracted|llm_verified)   -- provenance of the edge itself

authority_embedding       -- pgvector dense recall
  version_id (fk), embedding VECTOR(n), model TEXT
```

Existing `AuthorityChunk` (lib/tax/authority/store.ts) maps onto `authority_version`; the existing
free-text `supersededBy` STRING pointers resolve into real `authority_edge` rows.

## 3. Retrieval pipeline (hybrid + graph + point-in-time)

1. **Pre-filter (hard WHERE):** jurisdiction match AND the version is valid for the question's tax year
   (`tax_years @> year` / `valid_from..valid_to` covers it). Stale versions never enter ranking.
2. **Lexical (sparse):** tsvector/GIN + ts_rank_cd — exact terms + citation hits (keeps the exact-cite boost).
3. **Dense:** pgvector + HNSW over `authority_embedding` — conceptual recall (kills vocabulary-mismatch).
4. **Fuse:** Reciprocal Rank Fusion of sparse+dense.
5. **Graph expansion:** recursive CTE 1–2 hops over `authority_edge` — pull the reg that implements the
   hit statute, the case that invalidated it, the superseding amendment. Enables NEGATIVE retrieval
   (surface that an authority was superseded/invalidated) that flat similarity structurally cannot.
6. **Authority-aware rerank:** cross-encoder rerank, then boost by `authority_class` so a controlling
   reg outranks a blog and a higher §6662 class wins ties.

## 4. Authority-weighting & formal reasoning

- A pure `weighting.ts`: authorities-for/against → {standard, forWeight, againstWeight,
  disclosureRecommended}, encoding the §1.6662-4(d)(3)(iii) list + hard invariants (a ruling/PLR/TAM
  NEVER outweighs a contrary controlling in-circuit holding; a Summary Opinion/PLR/TAM is NEVER sole
  support). Re-enable the dormant `unsettled` branch once case law grounds.
- Formalize where the law is formal: tax statutes are prioritized default logic (base rule overridden
  by exceptions overridden by exceptions). Encode formalized provisions Catala-style (typed TS
  equivalent) so exception precedence is guaranteed by structure, not hoped from the model. Test with
  property-based + concolic exploration (CUTECat-style), not just the 185 hand-written tie-outs.

## 5. Ingestion (free primary sources, automated)

Inngest/cron workers, content-hash diff → mint new version + close prior `valid_to` + write supersession edge:
- **IRC:** govinfo bulk USLM XML (Title 26). **26 CFR:** eCFR bulk API + XML.
- **New regs/notices/effective-dates:** Federal Register daily API (agency=IRS/Treasury).
- **Rulings/procedures:** IRS IRB (already wired). **Public laws:** GovInfo PLAW.
- **Case law:** un-stub DAWSON PDF→text (Tax Court) + CourtListener REST/bulk (District/Circuit/SCOTUS),
  persist court_level + circuit.
Idempotent + content-addressed; raw XML/PDF to storage for permanent provenance.

## 6. Eval moat (externally legible)

Keep the 38→150 internal golden set. ADD public benchmarks wired into CI: **SARA-numeric** (exact-dollar
statutory reasoning) + **SARA-entailment** (LegalBench). Report a reproducible cross-model number
(Claude vs GPT-5.5) with a written methodology; gate releases on it. Plus the hallucination-rate suite:
fabricated-cite, superseded-cite, right-cite-wrong-figure, unsupported-claim — each a tracked number,
adversarially red-teamed, regression-gated. Calibration: reliability diagram / ECE per confidence tier.

## 7. Migration sequence

- **1a** — schema + backfill the current ~60 chunks into authority_node/version/embedding; resolve
  supersededBy strings → edges. (Behind a flag; keyword path stays default until parity proven.)
- **1b** — hybrid retrieval (sparse+dense+RRF+rerank) behind the flag; prove recall@k + currency on a
  labeled set incl. superseded-trap cases; flip the default.
- **1c** — bulk-ingest full IRC + 26 CFR + IRB archive.
- **1d** — case law (DAWSON text + CourtListener) + automated daily freshness cron.
- Then §6662 weighting + contra-authority finder consume the case corpus.

## 8. Decisions needed before touching the live DB

1. **Apply additive migrations** to Supabase `dzqfecbvxifykzsqssdb` (new tables only, no destructive change)?
2. **Embedding model** — a hosted API (text-embedding-3-large, ~cheap but a paid call) vs a local/free
   model (slower, $0). Affects 1a.

Until confirmed: Phase-0 cheap wins proceed (faithfulness gate already shipped; RBAC scopes,
research→execution wiring, benchmark→CI, Tax Court un-stub, tsvector ranking, federal|CA type-break next).

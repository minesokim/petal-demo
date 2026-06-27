# Petal Librarian — Master Coverage Map & Bulk-Ingest Plan

**Goal:** a world-class US tax librarian — answer almost any federal (and major multistate) tax question, cited and grounded, at a depth a tax attorney would sign (§6694/Circ-230). Measured (Blue J parity), not asserted.

**Why this doc:** stop the reactive one-at-a-time grind. "Everything" is a *finite, knowable core* — roughly 300–450 IRC sections + the key regs + landmark/circuit-split cases a real EA/CPA/attorney actually touches. Map it once, then **bulk-ingest** in automated passes.

## Method
1. **Map** the territory (this doc) — every area → its core sections (tiered), key regs (with delegation basis), landmark/circuit-split cases.
2. **Bulk-ingest** from the map: drive `scripts/ingest-authority.mts` over the whole tier-1 statute list in automated passes (it already fetches LII → distills → figure-gates). Not 5 at a time.
3. **Three authority types** (the §6662 / Loper-Bright model needs all three to weigh): statutes (LII — done for the base), **regs** (eCFR + a `delegationBasis` tag: express-delegation vs §7805-general), **landmark/circuit-split cases** (CourtListener + a *holding gate* analogous to the figure gate).
4. **Measure per area** — a scored test set per area (the `--set entity` pattern), so coverage is graded, not just stocked.

## Tiering
- **T1** = every preparer hits it (ingest first). **T2** = common. **T3** = specialist.

## Coverage map (T1/T2 statutes by area)

**1. Individual income** — gross income & exclusions: §61, §71, §72, §74, §79, §83, §86, §101–§104, §105–§106, §108, §117, §119, §121, §125, §127, §129, §132, §137, §139; deductions: §62, §63, §67, §68, §151–§152, §161–§165, §170, §163, §164, §166, §170, §179, §199A, §211–§224 (esp. §212, §213, §215, §217, §219, §221, §223); credits: §21, §22, §24, §25A, §25B, §25C, §25D, §30D, §31, §32, §36B; AMT: §55–§59; rates/filing: §1, §2, §63(c), §1411, §3101/§3111 (FICA), §1401–§1402 (SE).
**2. Business entities** — Subch S: §1361–§1379 (T1: 1361/1362/1366/1367/1368/1374/1375). Subch K: §701–§777 (T1: 702/704/705/706/707/721/722/723/731/732/733/734/736/741/743/751/752/754). Subch C: §301/§302/§304/§305/§307/§311/§312/§316/§317/§318/§331/§332/§336/§337/§338/§351/§354/§355/§356/§357/§358/§361/§362/§368/§381/§382/§383/§385.
**3. Property / capital gains / basis** — §1001, §1011–§1019, §1014, §1015, §1031, §1033, §1041, §1060, §1091, §1202, §1211, §1212, §1221, §1222, §1223, §1231, §1235, §1241, §1245, §1250, §1253, §1271–§1275, §1361-adjacent §1276, §1(h) rates, §453, §453A, §453B, §1060.
**4. Compensation & benefits** — equity: §83, §409A, §421, §422, §423, §424; retirement: §401, §402, §403, §404, §408, §408A, §409, §410, §411, §412, §414, §415, §416, §457, §72(t); fringe: §119, §125, §127, §129, §132, §137, §223; payroll: §3101–§3134, §3301–§3311, §3401–§3406; reasonable comp / §162(m), §280G.
**5. Accounting methods & periods** — §441, §442, §443, §446, §448, §451, §453, §455, §458, §460, §461, §465, §467, §469, §471, §472, §475, §481, §483, §263, §263A, §195, §248, §709, §174, §174A, §172.
**6. International** — §861–§865, §871, §881, §882, §884, §894, §901–§909, §911, §912, §951, §951A (GILTI), §954, §956, §957, §958, §959, §960, §961, §965, §245A, §250 (FDII), §267A, §1291–§1298 (PFIC), §1441–§1446, §1471–§1474 (FATCA), §6038, §6038A, §6038B, §6038C.
**7. Estate, gift & trust** — §2001, §2010, §2031, §2032, §2032A, §2033–§2046, §2053, §2055, §2056, §2058, §2501, §2503, §2505, §2511–§2519, §2522, §2523, §2601–§2664 (GST), §641–§645, §651, §652, §661, §662, §663, §664, §671–§679 (grantor).
**8. Procedure, penalties & ethics** — §6011, §6012, §6031–§6060, §6201, §6213, §6320/§6330, §6402, §6404, §6501, §6502, §6511, §6601, §6621, §6651, §6654, §6655, §6662, §6662A, §6663, §6664, §6694, §6695, §6695A, §6700–§6702, §6707A, §6713, §7201–§7207, §7216, §7421, §7430, §7442, §7491, §7525; Circular 230 (§10.21–§10.37, §10.51).
**9. Exempt orgs, credits & energy** — §501, §502, §503, §508, §509, §511–§514 (UBIT), §170(b), §4940–§4948, §4958, §38, §41 (R&D), §45, §48, §45X, §179D, §199A, §1400Z-1/§1400Z-2 (OZ), §25C/§25D/§30D/§45W (post-OBBBA).
**10. Multistate** — nexus (Wayfair) + PL 86-272; UDITPA apportionment; combined vs separate; conformity (rolling vs static); core CA (R&TC §17041, §17052, §17501, §23151, §25120–§25137, §18662), NY, TX (franchise/margin) primary authority.

## Key regs (T1, with delegation basis to wake §6662 weighting)
§1.61-1, §1.83-1/-2/-7, §1.162-1, §1.163(j), §1.199A-1 to -6 (express §199A(f)(4)), §1.469-5T (material participation), §1.704-1/-2/-3 (express §704(b)), §1.752-1 to -7, §1.1061-1 to -6, §1.409A-1 to -6, §1.6662-4 (the substantial-authority reg itself), §1.6664-4 (reasonable cause), §301.7701-1 to -3 (check-the-box), §1.482 (express §482). Tag each: **express-delegation** (durable post-Loper-Bright) vs **§7805-general** (Skidmore-weight, contestable).

## Landmark + circuit-split cases (the authority-weighting fuel — the C+→A lever)
Supreme: *Gregory v. Helvering*, *Welch v. Helvering*, *INDOPCO*, *Frank Lyon*, *Knetsch*, *Cottage Savings*, *Commissioner v. Glenshaw Glass*, *Crane*, *Tufts*, *Commissioner v. Banks*, *Gitlitz*, *Loper Bright* (overruling Chevron). Circuit splits to load (≥2 circuits each, opposite holdings) on: economic-substance pre-§7701(o), §183 hobby-loss factors, §162 vs §263 repair-vs-improvement, §469 grouping/real-estate-pro, §1061 application, trust material-participation (*Aragona* vs IRS position), §6751(b) supervisory approval timing. **Holding gate:** every case chunk's holding + court + circuit verified against the actual opinion (CourtListener) before admission.

## Current state (2026-06-27)
~49 ingested chunks (corpus-ingested.ts) + the static base. Covered: individual 1040 base, entity S/K/C cores, the capital-gains spine, depreciation/deduction, high-frequency individual, **equity comp §83/§409A/§421-424** (this batch). Entity benchmark = **22/23 (95.7%)** on codex. Grade: **C+** (retrieval C, authority-weighting D — starved of regs + circuit splits).

## Bulk-ingest plan
- **Wave 1 (T1 statutes, ~150–200 sections):** extend `TARGETS` with the T1 list above; run `--write` in chunks of ~20 (each ~1 codex call; the figure gate rejects ungrounded numbers). ~3–4 automated passes, a couple hours of codex runtime. **Fix the section-filter** first: the substring filter collides (e.g. "312" matches §3121, "83" is fine but "421"/"422" must stay exact) — switch to exact `§<n>` matching or a `--only` flag.
- **Wave 2 (T1 regs, ~25–30):** add an eCFR fetch path (the pipeline comment already references eCFR XML) + a `delegationBasis`/`authorityClass` field on each reg chunk. This is what actually wakes the §6662 weighting engine.
- **Wave 3 (landmark + circuit-split cases, ~30–40):** a CourtListener fetch + a holding-verification gate; tag court/level/circuit + `isSplit`. This lifts authority-weighting (D) **and** the "unsettled" calibration together — the binding lever from C+ to A.
- **Wave 4 (T2/T3 + multistate):** the long tail, parallelizable.
- **After each wave:** a scored test set for the area (the `--set <area>` pattern) recorded in `measured-baseline.ts`, gated in CI.

## Scale (honest)
Full T1+T2 ≈ 350–450 chunks (statutes) + ~30 regs + ~40 cases ≈ **~450 authorities**. At ~1 codex call/chunk that's a few hours of one-time runtime, not weeks of hand-batching. Ongoing = currency updates (new acts) + new splits. This is grind, not architecture — the pipeline exists.

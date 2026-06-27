// L1 authority ingestion pipeline (durable, re-runnable). For each target section it:
//   1. FETCHES the real primary-source text (keyless: LII for IRC, eCFR XML for 26 CFR),
//   2. has Claude write a CONCISE operative-rule AuthorityChunk *from that text* (not memory),
//   3. GROUNDING GATE: every $/%/year figure in the chunk must appear in the source — else reject,
//   4. writes the survivors to lib/research/corpus-ingested.ts (registered alongside the others).
// PUBLIC authority only (no taxpayer data → §7216-clean). Run:
//   node --env-file=.env.local --import tsx scripts/ingest-authority.mts [--write] [section...]
import { getProvider } from "../lib/ai/provider-factory";
import type { AIProvider } from "../lib/ai/provider";
import { authorityChunkSchema, type AuthorityChunk } from "../lib/tax/authority/store";

// ── Targets: Phase-1 federal scope (1040 + the 4 due-diligence credits + gap-closers). Each entry
// is a real, resolvable primary source. taxYear lists the years the rule (as fetched) governs. ──
type Target = { cite: string; url: string; type: AuthorityChunk["authorityType"]; taxYear: number[]; note: string };
const lii = (n: string) => `https://www.law.cornell.edu/uscode/text/26/${n}`;
const TARGETS: Target[] = [
  { cite: "IRC §3121", url: lii("3121"), type: "statute", taxYear: [2024, 2025], note: "FICA definitions — tips are wages (so tips run through payroll FICA, not SE tax)" },
  { cite: "IRC §1402", url: lii("1402"), type: "statute", taxYear: [2024, 2025], note: "net earnings from self-employment — defines the SE-tax base (excludes W-2 wages/tips)" },
  { cite: "IRC §1401", url: lii("1401"), type: "statute", taxYear: [2024, 2025], note: "self-employment tax rate (OASDI + Medicare portions)" },
  { cite: "IRC §1411", url: lii("1411"), type: "statute", taxYear: [2024, 2025], note: "3.8% net investment income tax + MAGI thresholds" },
  { cite: "IRC §61", url: lii("61"), type: "statute", taxYear: [2024, 2025], note: "gross income defined — all income from whatever source derived" },
  { cite: "IRC §62", url: lii("62"), type: "statute", taxYear: [2024, 2025], note: "adjusted gross income — the above-the-line deductions" },
  { cite: "IRC §213", url: lii("213"), type: "statute", taxYear: [2024, 2025], note: "medical-expense deduction + the AGI floor" },
  { cite: "IRC §223", url: lii("223"), type: "statute", taxYear: [2024, 2025], note: "HSA deduction + contribution limits / HDHP definition" },
  { cite: "IRC §219", url: lii("219"), type: "statute", taxYear: [2024, 2025], note: "deductible IRA contributions" },
  { cite: "IRC §163", url: lii("163"), type: "statute", taxYear: [2024, 2025], note: "interest deduction incl. the qualified-residence/mortgage limits" },
  { cite: "IRC §6662", url: lii("6662"), type: "statute", taxYear: [2024, 2025], note: "accuracy-related penalty (20%) + substantial understatement" },
  { cite: "IRC §6651", url: lii("6651"), type: "statute", taxYear: [2024, 2025], note: "failure-to-file and failure-to-pay penalties" },
  { cite: "IRC §6694", url: lii("6694"), type: "statute", taxYear: [2024, 2025], note: "tax-return-preparer understatement penalty" },
  { cite: "IRC §7216", url: lii("7216"), type: "statute", taxYear: [2024, 2025], note: "criminal penalty for preparer disclosure/use of return information" },
  // Gap-closers from the round-3 held-out diagnostic (OBBBA-era). Each is fetched from the current
  // USC text and figure-grounded; DRY-RUN + verify the figures reflect post-OBBBA law before --write.
  { cite: "IRC §30D", url: lii("30D"), type: "statute", taxYear: [2025, 2026], note: "clean vehicle credit — OBBBA terminates it for vehicles acquired after Sept 30, 2025" },
  { cite: "IRC §25D", url: lii("25D"), type: "statute", taxYear: [2025, 2026], note: "residential clean energy credit — OBBBA ends it for expenditures after Dec 31, 2025 (installation-completion keyed)" },
  { cite: "IRC §6050W", url: lii("6050W"), type: "statute", taxYear: [2025, 2026], note: "1099-K / third-party settlement reporting — OBBBA restores the $20,000-and-200-transaction threshold" },
  { cite: "IRC §174A", url: lii("174A"), type: "statute", taxYear: [2025, 2026], note: "domestic R&D — OBBBA restores current expensing for tax years beginning after Dec 31, 2024" },
  // ── ENTITY LAW — Subchapter S CORE (the audit's #1 binding constraint: ~half an EA practice, 0% covered).
  // The most common business return. Stable, non-OBBBA provisions, so taxYear spans current years. Each is
  // fetched from current USC text and figure-grounded; capture the operative RULE, not a worked example. ──
  { cite: "IRC §1361", url: lii("1361"), type: "statute", taxYear: [2024, 2025, 2026], note: "S corporation defined — small business corporation: a domestic corporation with no more than 100 shareholders, only eligible shareholders (individuals, estates, certain trusts and exempt orgs — NOT nonresident aliens, partnerships, or C corporations), and only ONE class of stock (differences in voting rights are allowed)" },
  { cite: "IRC §1366", url: lii("1366"), type: "statute", taxYear: [2024, 2025, 2026], note: "pass-through to shareholders — each shareholder takes into account a pro-rata share of the S corporation's separately stated items and nonseparately computed income/loss; the aggregate loss/deduction a shareholder may take is LIMITED to the shareholder's adjusted basis in stock plus basis in any indebtedness of the S corp to the shareholder, with disallowed losses carried forward" },
  { cite: "IRC §1367", url: lii("1367"), type: "statute", taxYear: [2024, 2025, 2026], note: "basis adjustments — a shareholder's stock basis is INCREASED by income items (separately stated income and tax-exempt income) and DECREASED (not below zero) by distributions, separately stated loss/deduction items, nondeductible noncapital expenses; the ordering and the stock-then-debt basis mechanics" },
  { cite: "IRC §1368", url: lii("1368"), type: "statute", taxYear: [2024, 2025, 2026], note: "distributions — for an S corp with NO accumulated earnings and profits, a distribution is tax-free to the extent of stock basis then capital gain; for an S corp WITH accumulated E&P, the accumulated adjustments account (AAA) ordering governs (AAA first as a return of basis, then E&P as a dividend, then remaining basis, then gain)" },
  { cite: "IRC §1374", url: lii("1374"), type: "statute", taxYear: [2024, 2025, 2026], note: "built-in gains tax — a former C corporation that elects S status owes a corporate-level tax (at the highest §11 rate) on net recognized built-in gain during the recognition period following conversion; capture the recognition-period rule and that the tax is at the corporate rate" },
  // ── ENTITY LAW — Subchapter K CORE (partnerships, the second-most-common entity; audit gap #1 continued).
  // Stable, non-OBBBA provisions. Capture the operative RULE (substantial economic effect, outside-basis
  // mechanics, the liability and §754 rules), not a worked example. ──
  { cite: "IRC §704", url: lii("704"), type: "statute", taxYear: [2024, 2025, 2026], note: "partner's distributive share — a partner's share of income, gain, loss, deduction, or credit is determined by the partnership agreement, but an allocation is respected only if it has SUBSTANTIAL ECONOMIC EFFECT (else it is reallocated by the partner's interest in the partnership). §704(c): built-in gain or loss on CONTRIBUTED property is allocated to the contributing partner. §704(d): a partner's distributive share of loss is allowed only to the extent of the partner's adjusted basis in the partnership interest, with the excess carried forward" },
  { cite: "IRC §705", url: lii("705"), type: "statute", taxYear: [2024, 2025, 2026], note: "adjusted basis of a partner's interest (OUTSIDE BASIS) — increased by the partner's distributive share of taxable income and tax-exempt income and by additional contributions, and decreased (not below zero) by distributions and by the partner's distributive share of losses and nondeductible noncapital expenses" },
  { cite: "IRC §722", url: lii("722"), type: "statute", taxYear: [2024, 2025, 2026], note: "basis of a contributing partner's interest — a partner's basis in the partnership interest acquired by a contribution of property equals the money contributed plus the partner's adjusted basis in the contributed property at the time of contribution (carryover/substituted basis)" },
  { cite: "IRC §731", url: lii("731"), type: "statute", taxYear: [2024, 2025, 2026], note: "gain or loss on a distribution — a partner recognizes GAIN on a current distribution only to the extent money distributed EXCEEDS the partner's adjusted outside basis; a distribution of property is generally nontaxable; loss is recognized only on a liquidating distribution of money (and certain hot assets)" },
  { cite: "IRC §752", url: lii("752"), type: "statute", taxYear: [2024, 2025, 2026], note: "treatment of partnership LIABILITIES — an increase in a partner's share of partnership liabilities is treated as a contribution of money by that partner (raising outside basis); a decrease is treated as a distribution of money (lowering outside basis); recourse liabilities are allocated to the partner who bears the economic risk of loss, nonrecourse generally by profit share" },
  { cite: "IRC §754", url: lii("754"), type: "statute", taxYear: [2024, 2025, 2026], note: "election to adjust basis of partnership property — a partnership may elect to adjust the basis of its property on a transfer of an interest (§743(b)) and on a distribution (§734(b)); once made, the election applies to all such transfers and distributions until revoked with IRS consent" },
  // ── ENTITY LAW — Subchapter C CORE (C corporations; audit gap #1 continued). Distribution + incorporation
  // rules. (§312 E&P deferred: the substring section filter would collide with the existing §3121 chunk.) ──
  { cite: "IRC §301", url: lii("301"), type: "statute", taxYear: [2024, 2025, 2026], note: "distributions of property — under §301(c) a distribution to a shareholder is a DIVIDEND to the extent of the corporation's earnings and profits (§316); the part that is not a dividend is applied against and reduces the shareholder's stock basis (return of capital); any remaining excess is treated as gain from the sale of the stock" },
  { cite: "IRC §311", url: lii("311"), type: "statute", taxYear: [2024, 2025, 2026], note: "taxability of the corporation on a distribution — under §311(b) a corporation that distributes APPRECIATED property recognizes gain as if it had sold the property at fair market value; under §311(a) it does NOT recognize loss on a distribution of property" },
  { cite: "IRC §316", url: lii("316"), type: "statute", taxYear: [2024, 2025, 2026], note: "dividend defined — a dividend is any distribution of property a corporation makes to its shareholders out of earnings and profits, either accumulated after Feb 28 1913 or of the current taxable year; distributions are treated as made out of the most recently accumulated E&P" },
  { cite: "IRC §351", url: lii("351"), type: "statute", taxYear: [2024, 2025, 2026], note: "transfer to a controlled corporation — no gain or loss is recognized if property is transferred to a corporation by one or more persons SOLELY in exchange for its stock and, immediately after the exchange, those persons are in CONTROL (within the meaning of §368(c): at least 80% of total combined voting power and at least 80% of each other class) of the corporation" },
  { cite: "IRC §357", url: lii("357"), type: "statute", taxYear: [2024, 2025, 2026], note: "assumption of liability — in a §351 exchange the corporation's assumption of a transferor's liability is generally NOT treated as money or boot; but under §357(c) gain is recognized to the extent the liabilities assumed EXCEED the total adjusted basis of the property transferred, and under §357(b) the assumption is treated as boot if its principal purpose is tax avoidance or not a bona fide business purpose" },
  // ── CAPITAL GAINS / PROPERTY SPINE (the audit's biggest hole — foundational to almost every property
  // transaction). §1061 is the carried-interest rule a PE/hedge-fund question turns on. ──
  { cite: "IRC §1061", url: lii("1061"), type: "statute", taxYear: [2024, 2025, 2026], note: "carried interest / applicable partnership interest — to the extent a taxpayer holds an applicable partnership interest, the net long-term capital gain is RECHARACTERIZED as SHORT-TERM unless the relevant holding period is MORE THAN 3 YEARS (the rule substitutes a 3-year period for the normal 1-year period of §1222). So carried-interest gain on a position held 3 years or less is short-term; held MORE than 3 years it keeps long-term treatment. Capture the 3-year holding-period rule" },
  { cite: "IRC §1221", url: lii("1221"), type: "statute", taxYear: [2024, 2025, 2026], note: "capital asset DEFINED — property held by the taxpayer is a capital asset EXCEPT the enumerated exclusions: inventory / stock in trade / property held primarily for sale to customers; depreciable property and real property used in a trade or business (that is §1231 property, not a capital asset); accounts or notes receivable acquired in the ordinary course; certain self-created copyrights and similar property; and certain hedging transactions" },
  { cite: "IRC §1222", url: lii("1222"), type: "statute", taxYear: [2024, 2025, 2026], note: "long-term vs short-term DEFINED — a capital gain or loss is LONG-TERM if the asset was held for MORE THAN 1 YEAR, and SHORT-TERM if held for 1 year or less; defines net short-term and net long-term capital gain/loss and the netting terms" },
  { cite: "IRC §1231", url: lii("1231"), type: "statute", taxYear: [2024, 2025, 2026], note: "property used in a trade or business — the best-of-both rule: if §1231 gains EXCEED §1231 losses for the year, ALL are treated as LONG-TERM CAPITAL gains and losses; if losses equal or exceed gains, all are treated as ORDINARY. A non-recaptured net §1231 loss in the prior 5 years recharacterizes a later §1231 gain as ordinary to that extent (the §1231(c) lookback)" },
  { cite: "IRC §1245", url: lii("1245"), type: "statute", taxYear: [2024, 2025, 2026], note: "depreciation recapture on §1245 (personal / tangible business) property — on a disposition, gain is recaptured as ORDINARY income to the extent of prior depreciation or amortization taken (the lower of the depreciation taken or the gain realized); any remaining gain is §1231/capital" },
  { cite: "IRC §1250", url: lii("1250"), type: "statute", taxYear: [2024, 2025, 2026], note: "depreciation recapture on §1250 (depreciable REAL) property — ordinary-income recapture applies only to the EXCESS of accelerated depreciation over straight-line (generally zero for property placed in service after 1986 using straight-line); the previously deducted straight-line depreciation is 'unrecaptured §1250 gain' taxed as capital gain at a maximum 25% rate" },
  { cite: "IRC §1014", url: lii("1014"), type: "statute", taxYear: [2024, 2025, 2026], note: "basis of property acquired from a DECEDENT — the basis is the property's FAIR MARKET VALUE at the date of the decedent's death (or the alternate valuation date if elected), i.e. a stepped-up (or stepped-down) basis; capture the FMV-at-death rule" },
  { cite: "IRC §1015", url: lii("1015"), type: "statute", taxYear: [2024, 2025, 2026], note: "basis of property acquired by GIFT — the donee takes a CARRYOVER basis equal to the donor's adjusted basis (increased for gift tax paid on the appreciation); special dual-basis rule: if the donor's basis exceeds FMV at the gift date, the basis for determining a LOSS is that lower FMV" },
  // ── HIGH-FREQUENCY INDIVIDUAL / SMB PROVISIONS (next-ranked coverage after the capital-gains spine). ──
  { cite: "IRC §1041", url: lii("1041"), type: "statute", taxYear: [2024, 2025, 2026], note: "transfers between spouses or incident to divorce — NO gain or loss is recognized on a transfer of property to (or in trust for) a spouse, or a former spouse if incident to divorce; the transferee takes the transferor's adjusted basis (carryover/gift-like treatment), so the transfer is nonrecognition not a step-up" },
  { cite: "IRC §280A", url: lii("280A"), type: "statute", taxYear: [2024, 2025, 2026], note: "business use of a home (home-office) + dwelling rented — deductions for a dwelling unit the taxpayer uses as a residence are generally disallowed EXCEPT a portion used EXCLUSIVELY and on a REGULAR basis as the principal place of business, or to meet clients/customers, or a separate structure; the home-office deduction is limited to gross income from that use, with disallowed amounts carried forward. Also the rental rule: if a residence is rented fewer than 15 days, the rental income is excluded and no rental deductions are allowed" },
  { cite: "IRC §166", url: lii("166"), type: "statute", taxYear: [2024, 2025, 2026], note: "bad debt deduction — a business bad debt that becomes wholly or partially worthless is deductible as an ORDINARY deduction in the year of worthlessness; a NONBUSINESS bad debt is deductible only when TOTALLY worthless and is treated as a SHORT-TERM CAPITAL LOSS. Requires a bona fide debt (a debtor-creditor relationship), not a gift or contribution to capital" },
  { cite: "IRC §318", url: lii("318"), type: "statute", taxYear: [2024, 2025, 2026], note: "constructive ownership of stock (attribution) — for the provisions that apply it, a person is treated as owning stock owned by family members (spouse, children, grandchildren, and parents), and stock is attributed to and from partnerships, estates, trusts, and corporations (with a 50%-ownership threshold for corporate attribution); option holders are treated as owning the underlying stock" },
  { cite: "IRC §469", url: lii("469"), type: "statute", taxYear: [2024, 2025, 2026], note: "passive activity loss limitation — losses and credits from a PASSIVE activity (a trade or business in which the taxpayer does not MATERIALLY PARTICIPATE, and, generally, any rental activity) are deductible only to the extent of income from passive activities; disallowed passive losses are SUSPENDED and carried forward, and are allowed in full when the taxpayer disposes of the entire interest in the activity in a fully taxable transaction" },
  // ── CORE DEPRECIATION / DEDUCTION PROVISIONS (very high frequency in business + individual returns). ──
  { cite: "IRC §168", url: lii("168"), type: "statute", taxYear: [2024, 2025, 2026], note: "MACRS depreciation — tangible property is depreciated over its assigned recovery period using the applicable method (200% or 150% declining balance switching to straight-line for personal property; straight-line for real property) and convention (half-year, mid-quarter, or mid-month). §168(k) BONUS depreciation allows an additional first-year deduction equal to the applicable percentage of the adjusted basis of qualified property. Capture the MACRS framework + that §168(k) is the bonus/additional first-year allowance" },
  { cite: "IRC §179", url: lii("179"), type: "statute", taxYear: [2024, 2025, 2026], note: "election to expense — a taxpayer may ELECT to treat the cost of qualifying section 179 property (depreciable tangible personal property, and certain real property, acquired for use in the active conduct of a trade or business) as a current expense rather than capitalize and depreciate it, subject to an annual dollar limitation that is reduced (phased out) as the total cost of section 179 property placed in service exceeds a threshold, and limited to the taxable income from the active trade or business (excess carried forward)" },
  { cite: "IRC §453", url: lii("453"), type: "statute", taxYear: [2024, 2025, 2026], note: "installment method — for an installment sale (a disposition of property where at least one payment is received AFTER the close of the taxable year of the sale), gain is reported as payments are received: each payment includes income equal to the gross-profit ratio (gross profit divided by total contract price). Dealer dispositions, inventory, and publicly traded property do not qualify; depreciation recapture under §1245/§1250 is recognized in the year of sale regardless" },
  { cite: "IRC §165", url: lii("165"), type: "statute", taxYear: [2024, 2025, 2026], note: "losses — a deduction is allowed for any loss sustained during the taxable year and not compensated by insurance or otherwise. For an INDIVIDUAL, the deduction is limited to losses incurred in a trade or business, losses incurred in a transaction entered into for profit, and casualty or theft losses — and personal casualty losses are deductible only to the extent attributable to a federally declared disaster (post-TCJA). Capital losses are allowed only as provided in §§1211-1212; a worthless security is treated as a capital loss" },
  { cite: "IRC §170", url: lii("170"), type: "statute", taxYear: [2024, 2025, 2026], note: "charitable contribution deduction — a deduction is allowed for charitable contributions to qualified organizations, paid within the taxable year, subject to ADJUSTED-GROSS-INCOME percentage CEILINGS that depend on the donee and the property (cash to public charities up to 60% of AGI; capital-gain property generally limited to 30%, or 20% to certain organizations); contributions exceeding the ceiling carry forward up to 5 years, and contributions of $250 or more require contemporaneous written acknowledgment" },
  // ── EQUITY COMPENSATION (the §409A gap surfaced live: discounted options / ISOs / restricted stock). ──
  { cite: "IRC §83", url: lii("83"), type: "statute", taxYear: [2024, 2025, 2026], note: "property transferred for services — the excess of the property's FAIR MARKET VALUE over the amount paid is included in the service provider's gross income in the first year the property is either TRANSFERABLE or NO LONGER SUBJECT TO A SUBSTANTIAL RISK OF FORFEITURE (i.e. when it vests). Under the §83(b) election the service provider may instead elect to include the spread at the time of transfer (grant); the election must be made within 30 DAYS of the transfer" },
  { cite: "IRC §409A", url: lii("409A"), type: "statute", taxYear: [2024, 2025, 2026], note: "nonqualified deferred compensation — if an NQDC plan fails to meet the §409A distribution, acceleration, and election requirements, all compensation deferred under the plan (to the extent not subject to a substantial risk of forfeiture and not previously included) is INCLUDED IN GROSS INCOME, and the tax for that year is INCREASED by an ADDITIONAL 20% of the amount included PLUS a premium-interest charge. A stock option with an exercise price below FMV at grant is generally nonqualified deferred compensation subject to §409A. Capture the income-inclusion-when-vested rule + the additional 20% tax" },
  { cite: "IRC §421", url: lii("421"), type: "statute", taxYear: [2024, 2025, 2026], note: "general rules for STATUTORY stock options — when a share is transferred to an individual on exercise of a statutory option (an incentive stock option under §422 or an employee stock purchase plan option under §423) and the holding-period requirements are met, NO income is recognized at exercise for regular tax and the employer gets no deduction; gain is generally capital on a later sale" },
  { cite: "IRC §422", url: lii("422"), type: "statute", taxYear: [2024, 2025, 2026], note: "INCENTIVE STOCK OPTIONS (ISOs) — to qualify: granted under a shareholder-approved plan to an employee; the option PRICE must be at least the FAIR MARKET VALUE of the stock at grant; the option must be exercisable within 10 years; and the aggregate FMV (determined at grant) of stock for which ISOs are first exercisable in any calendar year may not exceed $100,000 (the excess is treated as a nonstatutory option). For a more-than-10% shareholder, the price must be at least 110% of FMV and the term no more than 5 years. A below-FMV strike disqualifies ISO treatment" },
  { cite: "IRC §423", url: lii("423"), type: "statute", taxYear: [2024, 2025, 2026], note: "EMPLOYEE STOCK PURCHASE PLANS (ESPPs) — a qualified §423 plan must be available to employees on equal terms; the option PRICE may not be less than the LESSER of 85% of the FMV at grant or 85% of the FMV at exercise; and no employee may accrue the right to purchase more than $25,000 of stock (FMV at grant) per calendar year" },
  { cite: "IRC §424", url: lii("424"), type: "statute", taxYear: [2024, 2025, 2026], note: "definitions and special rules for statutory stock options — defines a permitted modification/extension/renewal (a modification is treated as the grant of a NEW option), substitutions and assumptions in corporate transactions, the meaning of disposition, and the stock-attribution rules used for the §422 more-than-10%-shareholder test" },
  // IRC §1202 (QSBS) — DISABLED pending a fix. The figure-grounded chunk is correct on the tiers
  // but the LII operative text refers to "the applicable date" WITHOUT pinning it to a calendar date,
  // and the "OBBBA enacted July 4, 2025" fact lives in a chunk a QSBS query doesn't co-retrieve. Result:
  // the model can't place a pre-July-2025 acquisition and CONFIDENTLY MISCLASSIFIES it (gave 75% where
  // the answer is $0 for a 4-yr hold on March-2025 stock). A confident wrong answer is worse than the
  // honest abstain, so this stays out until the applicable-date definition (= OBBBA enactment, 7/4/2025)
  // is grounded INTO this chunk and/or co-retrieved. See ask-once.mts to reproduce.
  // { cite: "IRC §1202", url: lii("1202"), type: "statute", taxYear: [2025, 2026], note: "QSBS gain exclusion — capture the applicable-date DEFINITION (= date of enactment of OBBBA / P.L. 119-21) explicitly, not just the term." },
];

// A figure's NUMERIC CORE (digits only) — so "3.8%", "3.8 percent", and "$3.8" all compare equal,
// and "$125,000" matches "125,000". The gate grounds the NUMBER, tolerant of unit formatting.
function figureCores(text: string): string[] {
  return [...text.matchAll(/\$?\d[\d,]*(?:\.\d+)?\s?%?|\b(?:19|20)\d{2}\b/g)]
    .map((m) => m[0].replace(/[^\d.]/g, ""))
    .filter((n) => n.length >= 2 && n !== "."); // ignore single digits / noise
}
function norm(s: string): string { return s.replace(/[^\d.]/g, ""); } // digits-and-dots stream of the source

async function fetchSource(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "user-agent": "PetalAuthorityIngest/1.0 (tax-research corpus)" } });
  if (!res.ok) throw new Error(`fetch ${res.status}`);
  const raw = await res.text();
  // Strip scripts/styles/tags to plain text; collapse whitespace; cap tokens.
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 24000);
}

const SYS = `You ingest US tax PRIMARY AUTHORITY into a research corpus. From the provided source text of ONE provision, write a single concise "operative rule" paraphrase a tax preparer could rely on. RULES: use ONLY facts/figures present in the provided text — never add a number, threshold, rate, or year from your own knowledge; if the text doesn't state a figure, don't include it. Public-domain factual paraphrase (statute isn't copyrightable). Output STRICT JSON only: {"text": string (the operative-rule paraphrase, 2-5 sentences), "keywords": string[] (8-15 lowercase retrieval terms incl. the section number and key concepts), "effectiveDate": "YYYY-MM-DD" (when this rule took effect; use the provided text or a conservative Jan 1 of the earliest listed tax year)}.`;

async function buildChunk(t: Target, provider: AIProvider): Promise<AuthorityChunk | null> {
  const source = await fetchSource(t.url);
  const { text: out } = await provider.generateText({
    system: SYS,
    prompt: `Citation: ${t.cite}\nHint: ${t.note}\nTax years this should serve: ${t.taxYear.join(", ")}\n\nSOURCE TEXT:\n${source}`,
    maxTokens: 700,
  });
  let parsed: { text: string; keywords: string[]; effectiveDate: string };
  try { parsed = JSON.parse(out.slice(out.indexOf("{"), out.lastIndexOf("}") + 1)); }
  catch { console.log(`✗ ${t.cite}: non-JSON output`); return null; }

  // GROUNDING GATE: every figure's numeric core in the paraphrase must appear in the fetched source.
  const src = norm(source);
  const ungrounded = figureCores(parsed.text).filter((f) => !src.includes(f));
  if (ungrounded.length) { console.log(`✗ ${t.cite}: ungrounded figures ${ungrounded.join(", ")} (rejected)`); return null; }

  const chunk: AuthorityChunk = {
    chunkId: `ingested-${t.cite.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
    authorityType: t.type,
    citation: t.cite,
    jurisdiction: "federal",
    taxYear: t.taxYear,
    effectiveDate: parsed.effectiveDate || `${Math.min(...t.taxYear)}-01-01`,
    sourceUrl: t.url,
    ingestedAt: new Date().toISOString(),
    text: parsed.text,
    keywords: [...new Set(parsed.keywords.map((k) => k.toLowerCase()))],
  };
  const v = authorityChunkSchema.safeParse(chunk);
  if (!v.success) { console.log(`✗ ${t.cite}: schema ${v.error.issues[0]?.message}`); return null; }
  console.log(`✓ ${t.cite}: ${chunk.text.slice(0, 90)}…`);
  return chunk;
}

async function main() {
  const write = process.argv.includes("--write");
  // Optional section filter: non-flag args restrict which TARGETS run (e.g. `... 30D 6050W`). With
  // --write + a filter, the new chunks are MERGED into the existing corpus (existing ones kept, not
  // re-paraphrased); with --write and no filter, the whole file is regenerated from all TARGETS.
  const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const targets = only.length ? TARGETS.filter((t) => only.some((o) => t.cite.toLowerCase().includes(o.toLowerCase()))) : TARGETS;
  // Provider via the FACTORY so ingestion honors PETAL_DEV_INFERENCE=codex-sub (runs on the codex sub, not
  // the metered Anthropic key). The figure-grounding gate below guards correctness regardless of model.
  const provider = getProvider("claude-sonnet-4-6");
  const out: AuthorityChunk[] = [];
  for (const t of targets) {
    try { const c = await buildChunk(t, provider); if (c) out.push(c); }
    catch (e) { console.log(`✗ ${t.cite}: ${e instanceof Error ? e.message : e}`); }
  }
  console.log(`\n${out.length}/${targets.length} chunks passed the grounding gate.`);

  if (write) {
    // Merge into the existing corpus when a filter was used (keep the others); else full regenerate.
    let final = out;
    if (only.length) {
      const { CORPUS_INGESTED } = (await import("../lib/research/corpus-ingested.ts")) as { CORPUS_INGESTED: AuthorityChunk[] };
      const byId = new Map(CORPUS_INGESTED.map((c) => [c.chunkId, c]));
      for (const c of out) byId.set(c.chunkId, c);
      final = [...byId.values()];
    }
    const { writeFileSync } = await import("node:fs");
    const file =
      `// AUTO-GENERATED by scripts/ingest-authority.mts — re-run to refresh; do not hand-edit.\n` +
      `// Grounded primary-authority chunks: each is a concise operative-rule paraphrase produced\n` +
      `// FROM the fetched source text, and every $/%/year figure was verified to appear in that\n` +
      `// source before admission. Public domain (statute) — §7216-clean. Registered in authority/store.ts.\n` +
      `import type { AuthorityChunk } from "../tax/authority/store";\n\n` +
      `export const CORPUS_INGESTED: AuthorityChunk[] = ${JSON.stringify(final, null, 2)};\n`;
    writeFileSync("lib/research/corpus-ingested.ts", file);
    console.log(`wrote lib/research/corpus-ingested.ts (${final.length} chunks)`);
  } else {
    console.log("(dry run — pass --write to emit lib/research/corpus-ingested.ts)");
  }
}
main().catch((e) => { console.error(e); process.exit(1); });

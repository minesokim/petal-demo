/**
 * Position Library — Petal's tax-law cookbook.
 *
 * 20 named tax positions, each with confidence tier, authority chain,
 * eligibility rules, and documentation requirements. This is what Petal
 * looks up when it suggests a position on a return — it doesn't guess,
 * it consults the cookbook.
 *
 * Tiers (Position Framework):
 *   - settled         — rock solid, courts agree
 *   - substantial     — ~40% chance of winning if challenged
 *   - reasonable_basis — ~33% — disclose via Form 8275 to avoid penalty
 *   - mltn            — more likely than not (>50%)
 *
 * Refusal floor: Petal never takes a position below Reasonable Basis.
 */

export type PositionTier = "settled" | "substantial" | "reasonable_basis" | "mltn";

export type PositionCategory =
  | "deduction"
  | "credit"
  | "election"
  | "strategy"
  | "disclosure"
  | "calculation";

export interface PositionAuthority {
  type: "irc" | "treas_reg" | "rev_proc" | "case" | "irs_guidance";
  citation: string;
  note?: string;
}

export interface Position {
  id: string;
  name: string;
  iconSection: string;
  tier: PositionTier;
  category: PositionCategory;
  brief: string;
  description: string;
  authority: PositionAuthority[];
  eligibility: string[];
  documentation: string[];
  /** How many of Antonio's clients had this position applied this season */
  usedInPractice: number;
  /** How many times Petal refused to take this position (refusal floor enforcement) */
  refusedCount?: number;
}

export const TIER_META: Record<
  PositionTier,
  { label: string; short: string; description: string; chipClass: string; dotClass: string }
> = {
  settled: {
    label: "Settled",
    short: "Settled",
    description: "Rock solid · courts and IRS agree · take with confidence",
    chipClass: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400",
    dotClass: "bg-emerald-500",
  },
  substantial: {
    label: "Substantial Authority",
    short: "Substantial",
    description: "~40% defensible · disclosure not required · take with documentation",
    chipClass: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/30 dark:text-blue-400",
    dotClass: "bg-blue-500",
  },
  reasonable_basis: {
    label: "Reasonable Basis",
    short: "Reasonable Basis",
    description: "~33% defensible · disclose via Form 8275 to avoid §6662 penalty",
    chipClass: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-400",
    dotClass: "bg-amber-500",
  },
  mltn: {
    label: "More Likely Than Not",
    short: "MLTN",
    description: ">50% chance of being upheld · sufficient for tax accrual purposes",
    chipClass: "bg-purple-50 text-purple-700 ring-purple-200 dark:bg-purple-950/30 dark:text-purple-400",
    dotClass: "bg-purple-500",
  },
};

export const CATEGORY_META: Record<PositionCategory, { label: string }> = {
  deduction: { label: "Deduction" },
  credit: { label: "Credit" },
  election: { label: "Election" },
  strategy: { label: "Strategy" },
  disclosure: { label: "Disclosure" },
  calculation: { label: "Calculation" },
};

export const POSITIONS: Position[] = [
  {
    id: "199a",
    name: "QBI Deduction",
    iconSection: "§199A",
    tier: "settled",
    category: "deduction",
    brief: "20% deduction on qualifying business income for pass-through entities.",
    description:
      "Allows owners of sole proprietorships, partnerships, S-corporations, and certain trusts/estates to deduct up to 20% of qualified business income (QBI). Subject to W-2 wage and unadjusted basis (UBIA) limits above the income threshold, and excluded for Specified Service Trades or Businesses (SSTB) above the phase-in.",
    authority: [
      { type: "irc", citation: "IRC §199A" },
      { type: "treas_reg", citation: "Treas. Reg. §1.199A-1 through 1.199A-6" },
      { type: "rev_proc", citation: "Rev. Proc. 2019-38", note: "Safe harbor for rental real estate" },
      { type: "irs_guidance", citation: "Notice 2018-64" },
    ],
    eligibility: [
      "Qualifying pass-through entity (sole prop, partnership, S-corp, trust)",
      "Taxable income below threshold ($241,950 single / $483,900 MFJ for 2026) — no SSTB limits apply",
      "Above threshold: W-2 wages and UBIA limits apply",
      "SSTB businesses phased out entirely above upper threshold",
    ],
    documentation: [
      "Schedule C / K-1 / Schedule E showing business income",
      "W-2 wages paid by the business (above-threshold)",
      "UBIA of qualifying property (above-threshold)",
      "Form 8995 (simplified) or Form 8995-A (full)",
    ],
    usedInPractice: 14,
    refusedCount: 2,
  },
  {
    id: "scorp-rc",
    name: "Reasonable Compensation",
    iconSection: "S-Corp",
    tier: "substantial",
    category: "strategy",
    brief: "S-corp shareholder-employees must pay themselves reasonable W-2 wages before taking distributions.",
    description:
      "S-corporation shareholder-employees who perform services must receive reasonable compensation as W-2 wages. Distributions in lieu of wages are recharacterized by the IRS, triggering payroll tax + penalties. Defensible analysis requires comparable-position market data, time studies, and documentation.",
    authority: [
      { type: "irc", citation: "IRC §1366" },
      { type: "case", citation: "Watson v. Commissioner (8th Cir. 2012)" },
      { type: "case", citation: "Davis v. United States (5th Cir. 1998)" },
      { type: "irs_guidance", citation: "Fact Sheet FS-2008-25" },
    ],
    eligibility: [
      "Shareholder-employee performs services for the S-corp",
      "Comparable-position market data exists (BLS, Compease, RC Reports)",
      "Time study documenting hours worked",
    ],
    documentation: [
      "Market wage study (e.g., RC Reports analysis)",
      "Time and duties log",
      "W-2 issued with appropriate wages",
      "Board minutes documenting comp decision",
    ],
    usedInPractice: 6,
  },
  {
    id: "hobby-business",
    name: "Hobby vs Business",
    iconSection: "§183",
    tier: "settled",
    category: "disclosure",
    brief: "Activities not engaged in for profit are limited under §183 hobby-loss rules.",
    description:
      "Loss-generating activities risk reclassification as hobbies, which limits deductions to income. Safe harbor: profit in 3 of last 5 years (2 of 7 for horse-related). Otherwise, 9-factor test under Treas. Reg. §1.183-2 applies.",
    authority: [
      { type: "irc", citation: "IRC §183" },
      { type: "treas_reg", citation: "Treas. Reg. §1.183-2 (9-factor test)" },
      { type: "case", citation: "Hendricks v. Commissioner, T.C. Memo 2014-192" },
    ],
    eligibility: [
      "Activity generates income",
      "Manner consistent with for-profit motive (records, business plan, time invested)",
    ],
    documentation: [
      "Business plan or strategy document",
      "Books and records",
      "Time logs",
      "Profit-motive evidence (marketing, networking, training)",
    ],
    usedInPractice: 3,
    refusedCount: 1,
  },
  {
    id: "469-passive",
    name: "Passive Activity Rules",
    iconSection: "§469",
    tier: "substantial",
    category: "strategy",
    brief: "Passive losses can only offset passive income — unless real-estate-pro status applies.",
    description:
      "Losses from passive activities (rental real estate + businesses you don't materially participate in) are deductible only against passive income. Unused losses suspend until the activity is disposed of or other passive income is generated. Material participation = 500+ hours.",
    authority: [
      { type: "irc", citation: "IRC §469" },
      { type: "treas_reg", citation: "Temp. Reg. §1.469-5T (material participation tests)" },
      { type: "case", citation: "Tolin v. Commissioner, T.C. Memo 2014-65" },
    ],
    eligibility: [
      "Activity is rental real estate OR business in which taxpayer doesn't materially participate",
      "Material participation: one of 7 tests (500-hr, substantially all, 100+ and more than anyone else, etc.)",
    ],
    documentation: [
      "Contemporaneous time log",
      "Activity grouping election (if grouping)",
      "Form 8582 to compute allowed loss",
    ],
    usedInPractice: 5,
  },
  {
    id: "real-estate-pro",
    name: "Real Estate Professional Status",
    iconSection: "§469(c)(7)",
    tier: "reasonable_basis",
    category: "strategy",
    brief: "Exception to passive loss rules for real estate professionals. High audit risk.",
    description:
      "Real-estate-professional status converts rental real estate losses from passive to non-passive. Requires (1) 750+ hours per year in real-property trades, (2) more than half of personal-service hours in real-property trades, (3) material participation in each rental activity. Documentation must be contemporaneous; reconstructed logs are routinely rejected.",
    authority: [
      { type: "irc", citation: "IRC §469(c)(7)" },
      { type: "case", citation: "Bailey v. Commissioner, T.C. Memo 2001-296 (denied — no contemporaneous log)" },
      { type: "case", citation: "Hairston v. Commissioner, T.C. Memo 2019-104 (denied)" },
    ],
    eligibility: [
      "750+ hours/year in real-property trades or businesses",
      "More than 50% of personal-service hours in real-property trades",
      "Material participation in each rental (or grouped via §1.469-9 election)",
      "Contemporaneous time log REQUIRED — reconstructed logs lose at audit",
    ],
    documentation: [
      "Contemporaneous time log (daily entries)",
      "Activity grouping election filed",
      "Evidence of real-property-trade qualification (license, business records)",
      "Form 8275 disclosure recommended",
    ],
    usedInPractice: 1,
    refusedCount: 3,
  },
  {
    id: "170-charitable",
    name: "Charitable Contributions",
    iconSection: "§170",
    tier: "settled",
    category: "deduction",
    brief: "Cash + non-cash donations to qualified 501(c)(3) organizations, with substantiation rules.",
    description:
      "Deductions for charitable contributions are limited by AGI (60% for cash, 30% for capital-gain property to public charities, 50% to private foundations). Substantiation: receipts for $250+, qualified appraisal for non-cash $5,000+, Form 8283 for non-cash over $500.",
    authority: [
      { type: "irc", citation: "IRC §170" },
      { type: "treas_reg", citation: "Treas. Reg. §1.170A-13 (substantiation)" },
      { type: "irs_guidance", citation: "Publication 526" },
    ],
    eligibility: [
      "Recipient is qualified 501(c)(3) organization (verify via Tax Exempt Organization Search)",
      "Taxpayer itemizes deductions on Schedule A",
      "Proper substantiation maintained",
    ],
    documentation: [
      "Receipts for any contribution $250+",
      "Form 8283 for non-cash over $500",
      "Qualified appraisal for non-cash over $5,000",
      "Contemporaneous written acknowledgment from charity",
    ],
    usedInPractice: 11,
  },
  {
    id: "1031",
    name: "Like-Kind Exchange",
    iconSection: "§1031",
    tier: "settled",
    category: "strategy",
    brief: "Defer capital gains on real-property-for-real-property exchanges.",
    description:
      "Post-TCJA, §1031 applies only to real property (not personal property). 45-day identification + 180-day completion deadlines. Boot recognized to extent of cash/non-like-kind received. Qualified intermediary required for non-simultaneous exchanges.",
    authority: [
      { type: "irc", citation: "IRC §1031" },
      { type: "treas_reg", citation: "Treas. Reg. §1.1031(a)-1 through 1.1031(k)-1" },
    ],
    eligibility: [
      "Both relinquished and replacement properties are real property held for investment or productive use",
      "45-day identification window met",
      "180-day exchange completion met",
      "Qualified intermediary used (for non-simultaneous)",
    ],
    documentation: [
      "QI agreement",
      "Form 8824",
      "Identification notice (within 45 days)",
      "Closing documents for both properties",
    ],
    usedInPractice: 0,
  },
  {
    id: "121-home-sale",
    name: "Home Sale Exclusion",
    iconSection: "§121",
    tier: "settled",
    category: "strategy",
    brief: "Up to $250K ($500K MFJ) gain exclusion on sale of primary residence.",
    description:
      "Ownership AND use tests: lived in home as primary residence for 2 of last 5 years. Partial exclusion available for change in employment, health, or unforeseen circumstances. Cannot be used more than once every 2 years.",
    authority: [
      { type: "irc", citation: "IRC §121" },
      { type: "treas_reg", citation: "Treas. Reg. §1.121-1 through 1.121-4" },
    ],
    eligibility: [
      "Owned home 2+ of last 5 years",
      "Used as primary residence 2+ of last 5 years",
      "Hasn't used §121 in last 2 years",
    ],
    documentation: [
      "Closing statement (HUD-1) for purchase + sale",
      "Improvement records (raise basis)",
      "Form 1099-S if issued",
    ],
    usedInPractice: 2,
  },
  {
    id: "274-meals",
    name: "Meals Deduction",
    iconSection: "§274",
    tier: "settled",
    category: "deduction",
    brief: "50% deduction for business meals (100% for restaurant meals 2021-2022 only).",
    description:
      "Business meals are 50% deductible if (1) ordinary and necessary, (2) not lavish, (3) taxpayer or employee present, (4) business associate is the recipient. Entertainment is NOT deductible post-TCJA. Per-diem rules apply to travel.",
    authority: [
      { type: "irc", citation: "IRC §274(n)" },
      { type: "irs_guidance", citation: "Notice 2021-25 (restaurant 100% temp)" },
    ],
    eligibility: [
      "Ordinary and necessary business purpose",
      "Not lavish or extravagant",
      "Taxpayer or employee present",
      "Substantiation: amount, time, place, business purpose, attendees",
    ],
    documentation: [
      "Receipt with date, amount, vendor",
      "Notation of business purpose and attendees",
      "Mileage log if travel-related",
    ],
    usedInPractice: 8,
  },
  {
    id: "280a-home-office",
    name: "Home Office Deduction",
    iconSection: "§280A",
    tier: "settled",
    category: "deduction",
    brief: "Deduction for home used regularly and exclusively for business.",
    description:
      "Two methods: simplified ($5/sq ft up to 300 sq ft = $1,500 max) or actual expenses (depreciation, utilities, repairs allocated by sq ft). Self-employed only (W-2 employees lost this post-TCJA). Regular and exclusive use required.",
    authority: [
      { type: "irc", citation: "IRC §280A" },
      { type: "irs_guidance", citation: "Publication 587" },
    ],
    eligibility: [
      "Self-employed (Schedule C, partnership, S-corp)",
      "Regular and exclusive business use of dedicated space",
      "Principal place of business OR client meeting space",
    ],
    documentation: [
      "Square-footage measurement of office vs total home",
      "Utility bills (actual method)",
      "Form 8829 (actual method)",
    ],
    usedInPractice: 9,
  },
  {
    id: "168k-bonus",
    name: "Bonus Depreciation",
    iconSection: "§168(k)",
    tier: "settled",
    category: "deduction",
    brief: "Accelerated first-year depreciation for qualifying property.",
    description:
      "60% bonus depreciation for 2026 (phasing down: 80%→2023, 60%→2024, 40%→2025, 20%→2026, 0%→2027 unless renewed). Applies to property with class life of 20 years or less. Used property qualifies post-TCJA.",
    authority: [
      { type: "irc", citation: "IRC §168(k)" },
      { type: "treas_reg", citation: "Treas. Reg. §1.168(k)-2" },
    ],
    eligibility: [
      "Property with class life of 20 years or less",
      "Placed in service during the tax year",
      "New or used (post-TCJA)",
    ],
    documentation: [
      "Asset purchase invoice + placed-in-service date",
      "Form 4562",
      "Cost segregation study (if applicable)",
    ],
    usedInPractice: 7,
  },
  {
    id: "179-expensing",
    name: "§179 Expensing",
    iconSection: "§179",
    tier: "settled",
    category: "election",
    brief: "Immediate expensing election for qualifying business property (cap $1.22M for 2026).",
    description:
      "Election to expense tangible personal property and qualified real property used in a trade or business, up to $1.22M for 2026 (phase-out begins at $3.05M). Limited to taxable income from active trades/businesses. Cannot create a net loss.",
    authority: [
      { type: "irc", citation: "IRC §179" },
      { type: "treas_reg", citation: "Treas. Reg. §1.179-1 through 1.179-6" },
    ],
    eligibility: [
      "Qualifying property (tangible personal property + qualified real property)",
      "Used in active trade or business (>50% business use)",
      "Election made on Form 4562",
      "Limited to taxable income (no loss creation)",
    ],
    documentation: [
      "Asset purchase invoice",
      "Form 4562 with §179 election",
      "Business-use percentage documentation",
    ],
    usedInPractice: 5,
  },
  {
    id: "1245-recapture",
    name: "Depreciation Recapture",
    iconSection: "§1245/§1250",
    tier: "settled",
    category: "calculation",
    brief: "Gain on sale of depreciable property recaptured as ordinary income up to depreciation taken.",
    description:
      "§1245 (personal property) recaptures ALL depreciation as ordinary income. §1250 (real property) recaptures only the depreciation in excess of straight-line — usually none for post-1986 property. §291 corporate add-back applies.",
    authority: [
      { type: "irc", citation: "IRC §1245 (personal property)" },
      { type: "irc", citation: "IRC §1250 (real property)" },
      { type: "irc", citation: "IRC §291 (corporate add-back)" },
    ],
    eligibility: [
      "Sale or exchange of depreciable property",
      "Realized gain on the sale",
    ],
    documentation: [
      "Depreciation schedule",
      "Sale settlement statement",
      "Form 4797",
    ],
    usedInPractice: 2,
  },
  {
    id: "163j",
    name: "Business Interest Limitation",
    iconSection: "§163(j)",
    tier: "substantial",
    category: "calculation",
    brief: "Business interest deduction capped at 30% of ATI (some exceptions).",
    description:
      "Business interest deduction limited to business interest income + 30% of adjusted taxable income (ATI) + floor plan financing. Small business exception: <$30M average gross receipts (2026). Real property trades/businesses can elect out (with ADS depreciation tradeoff).",
    authority: [
      { type: "irc", citation: "IRC §163(j)" },
      { type: "treas_reg", citation: "Treas. Reg. §1.163(j)-1 through 1.163(j)-11" },
    ],
    eligibility: [
      "Business with interest expense",
      "Average gross receipts ≥ small-biz threshold ($30M for 2026)",
      "Not opted out as real property trade/business",
    ],
    documentation: [
      "ATI computation",
      "Form 8990",
      "Carryforward tracking",
    ],
    usedInPractice: 1,
  },
  {
    id: "61-constructive",
    name: "Constructive Receipt",
    iconSection: "§61",
    tier: "substantial",
    category: "strategy",
    brief: "Income recognized when set apart for taxpayer, not just when received.",
    description:
      "Cash-basis taxpayers must recognize income when it's credited to their account, set apart, or made available without substantial limitations. Bonus deferral, year-end checks, and pension distributions all touch this doctrine.",
    authority: [
      { type: "treas_reg", citation: "Treas. Reg. §1.451-2" },
      { type: "case", citation: "Hornung v. Commissioner, 47 T.C. 428 (1967)" },
    ],
    eligibility: [
      "Cash-basis taxpayer",
      "Income credited / set apart / made available without restriction",
    ],
    documentation: [
      "Bank statements",
      "Pay stubs (date received vs date paid)",
      "1099 timing analysis",
    ],
    usedInPractice: 2,
  },
  {
    id: "164b-salt",
    name: "SALT Deduction",
    iconSection: "§164(b)",
    tier: "settled",
    category: "deduction",
    brief: "Capped at $10,000 per return ($5,000 MFS) for state and local taxes.",
    description:
      "State and local income, sales, and property tax deduction capped at $10K per return ($5K MFS) under TCJA. Pass-through entity tax (PTET) workaround available in CA and 30+ states — election to pay tax at entity level, deduct federally.",
    authority: [
      { type: "irc", citation: "IRC §164(b)(6)" },
      { type: "irs_guidance", citation: "Notice 2020-75 (PTET workaround)" },
    ],
    eligibility: [
      "Itemizing deductions on Schedule A",
      "Capped at $10K combined ($5K MFS)",
      "Pass-through entity owners may elect PTET in 30+ states",
    ],
    documentation: [
      "State income tax payments",
      "Property tax bills",
      "PTET election (if applicable)",
    ],
    usedInPractice: 12,
  },
  {
    id: "219-ira",
    name: "IRA Deduction",
    iconSection: "§219 / §408",
    tier: "settled",
    category: "deduction",
    brief: "Traditional IRA contribution deduction (subject to income phase-out if covered by employer plan).",
    description:
      "Up to $7,000 ($8,000 if 50+) for 2026. Fully deductible if not covered by employer retirement plan. If covered: phase-out applies based on AGI. Spousal IRA available when one spouse has earned income.",
    authority: [
      { type: "irc", citation: "IRC §219" },
      { type: "irc", citation: "IRC §408" },
    ],
    eligibility: [
      "Earned income at least equal to contribution",
      "Under age 70½ (no longer applies post-SECURE Act)",
      "AGI within phase-out range (if covered by employer plan)",
    ],
    documentation: [
      "Form 5498 (issued by IRA custodian)",
      "Earned income evidence",
    ],
    usedInPractice: 4,
  },
  {
    id: "72t-early",
    name: "Early Distribution Penalty",
    iconSection: "§72(t)",
    tier: "settled",
    category: "calculation",
    brief: "10% additional tax on early IRA/401(k) distributions before age 59½ — with exceptions.",
    description:
      "10% additional tax on distributions before age 59½. Exceptions: §72(t)(2) series of substantially equal periodic payments, first-time home purchase ($10K cap), qualified higher education, qualified birth/adoption ($5K), terminal illness, federally-declared disaster, and SECURE 2.0 emergency expense ($1K/yr).",
    authority: [
      { type: "irc", citation: "IRC §72(t)" },
      { type: "irs_guidance", citation: "Form 5329 instructions" },
    ],
    eligibility: [
      "Distribution before age 59½ from IRA or qualified plan",
      "Exception applies (see list)",
    ],
    documentation: [
      "Form 1099-R",
      "Form 5329",
      "Exception substantiation (purchase agreement, medical bills, etc.)",
    ],
    usedInPractice: 1,
  },
  {
    id: "223-hsa",
    name: "HSA Deduction",
    iconSection: "§223",
    tier: "settled",
    category: "deduction",
    brief: "Above-the-line deduction for HSA contributions (HDHP enrollment required).",
    description:
      "Above-the-line deduction for HSA contributions: $4,150 self-only / $8,300 family for 2026 (plus $1,000 catch-up at 55+). HDHP coverage required. Distributions for qualified medical expenses are tax-free.",
    authority: [
      { type: "irc", citation: "IRC §223" },
      { type: "irs_guidance", citation: "Publication 969" },
    ],
    eligibility: [
      "Enrolled in High-Deductible Health Plan (HDHP)",
      "Not covered by any other non-HDHP health insurance",
      "Not enrolled in Medicare",
      "Not claimed as dependent",
    ],
    documentation: [
      "Form 8889",
      "Form 5498-SA (issued by HSA custodian)",
      "HDHP coverage proof",
    ],
    usedInPractice: 6,
  },
  {
    id: "6662-disclosure",
    name: "Substantial Understatement Disclosure",
    iconSection: "§6662",
    tier: "settled",
    category: "disclosure",
    brief: "20% accuracy-related penalty for substantial understatement — shielded by adequate disclosure.",
    description:
      "20% accuracy-related penalty applies for understatements exceeding the greater of 10% of correct tax or $5,000. Adequate disclosure on Form 8275 (or 8275-R for regulations contrary to law) provides protection if the position has at least Reasonable Basis.",
    authority: [
      { type: "irc", citation: "IRC §6662" },
      { type: "treas_reg", citation: "Treas. Reg. §1.6662-3 (disclosure)" },
      { type: "rev_proc", citation: "Rev. Proc. 2026-XX (annual update on adequate disclosure)" },
    ],
    eligibility: [
      "Position has at least Reasonable Basis (Petal refusal floor)",
      "Adequate disclosure made on Form 8275",
    ],
    documentation: [
      "Form 8275 (or 8275-R if contrary to regulation)",
      "Memorandum supporting the position",
      "Authority citations",
    ],
    usedInPractice: 3,
  },
];

export function getPositionById(id: string): Position | undefined {
  return POSITIONS.find((p) => p.id === id);
}

export const POSITIONS_BY_TIER = (() => {
  const groups = { settled: 0, substantial: 0, reasonable_basis: 0, mltn: 0 } as Record<PositionTier, number>;
  for (const p of POSITIONS) groups[p.tier]++;
  return groups;
})();

// Petal OS — THE canonical fixture world. Every count, badge, KPI, chart, and copy
// string on every /os surface derives from this module at render time (via ./derive).
// Canon rules:
//   · DEMO_DATE is Thursday, June 25, 2026 — extension season. Q2 estimates just passed
//     (Jun 15); Q3 due Sep 15; CP2000s for tax year 2024 arriving; May 2026 books wrapping.
//   · The firm is Antonio Vazquez, EA + Elena Reyes (part-time admin). Nobody else exists.
//   · One assistant: Petal. The things it runs are Skills; executions are runs.
//   · Hard-coding a number in a component instead of deriving it from here is a bug.
//     `scripts/tieout.ts` and /os/debug/tie-out enforce this.

import type {
  TaskStatus, Stage, SkillCategory, TrustTier, ExpectedDocStatus, ActivityKind,
} from "./vocab";

// ── Firm ─────────────────────────────────────────────────────
export const FIRM_PROFILE = {
  name: "Vazant EA",
  owner: { id: "u-antonio", name: "Antonio Vazquez", credential: "EA" },
  admin: { id: "u-elena", name: "Elena Reyes", role: "Part-time admin" },
} as const;

// ── Firm team (roles, permissions, assignment) ───────────────
export type FirmRole = "owner" | "preparer" | "reviewer" | "admin";

export interface FirmMember {
  id: string;
  name: string;
  role: FirmRole;
  credential?: string; // EA / CPA
  email: string;
  active: boolean;
}

/** who is "logged in" — the demo runs as the owner */
export const CURRENT_USER_ID = "u-antonio";

export const firmMembers: FirmMember[] = [
  { id: "u-antonio", name: "Antonio Vazquez", role: "owner", credential: "EA", email: "antonio@vazantea.com", active: true },
  { id: "u-raj", name: "Raj Patel", role: "reviewer", credential: "CPA", email: "raj@vazantea.com", active: true },
  { id: "u-daniel", name: "Daniel Okonkwo", role: "preparer", email: "daniel@vazantea.com", active: true },
  { id: "u-hannah", name: "Hannah Brooks", role: "preparer", email: "hannah@vazantea.com", active: true },
  { id: "u-elena", name: "Elena Reyes", role: "admin", email: "elena@vazantea.com", active: true },
];

export const roleMeta: Record<FirmRole, { label: string; blurb: string; tint: string; dot: string }> = {
  owner:    { label: "Owner",    blurb: "Signs and e-files returns. Full access to clients, billing, and team.", tint: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  reviewer: { label: "Reviewer", blurb: "Reviews and approves drafts across the firm. Cannot sign.",            tint: "bg-violet-50 text-violet-700",  dot: "bg-violet-500" },
  preparer: { label: "Preparer", blurb: "Drafts returns and chases documents. The owner signs and files.",      tint: "bg-blue-50 text-blue-700",      dot: "bg-blue-500" },
  admin:    { label: "Admin",    blurb: "Intake, documents, and billing. Cannot prepare or sign returns.",       tint: "bg-amber-50 text-amber-700",    dot: "bg-amber-500" },
};

export type Permission =
  | "sign_returns" | "efile" | "approve_drafts" | "prepare_returns" | "manage_billing" | "manage_team" | "intake_docs";
export const PERMISSIONS: Permission[] = ["sign_returns", "efile", "approve_drafts", "prepare_returns", "manage_billing", "manage_team", "intake_docs"];
export const PERMISSION_LABEL: Record<Permission, string> = {
  sign_returns: "Sign returns",
  efile: "Transmit e-file",
  approve_drafts: "Approve drafts",
  prepare_returns: "Prepare returns",
  manage_billing: "Manage billing",
  manage_team: "Manage team",
  intake_docs: "Intake & documents",
};
export const ROLE_PERMISSIONS: Record<FirmRole, Permission[]> = {
  owner: ["sign_returns", "efile", "approve_drafts", "prepare_returns", "manage_billing", "manage_team", "intake_docs"],
  reviewer: ["approve_drafts", "prepare_returns", "intake_docs"],
  preparer: ["prepare_returns", "intake_docs"],
  admin: ["intake_docs", "manage_billing"],
};

export const memberById = (id?: string) => firmMembers.find(m => m.id === id);
export const memberInitials = (id?: string) => {
  const m = memberById(id);
  return m ? m.name.split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase() : "?";
};
export const isCurrentUser = (id?: string) => id === CURRENT_USER_ID;

/** who leads each client relationship — the assigned preparer */
export const HOUSEHOLD_PREPARER: Record<string, string> = {
  "h-chen": "u-antonio", "h-rodriguez": "u-antonio", "h-park": "u-antonio", "h-fuentes": "u-antonio",
  "h-sharma": "u-daniel", "h-nakamura": "u-daniel", "h-mendez": "u-daniel", "h-russo": "u-daniel",
  "h-williams": "u-hannah", "h-sandoval": "u-hannah", "h-obrien": "u-hannah",
};
export const preparerOf = (householdId: string) => HOUSEHOLD_PREPARER[householdId] ?? "u-antonio";

// legacy name map — now derived from the full roster
export const STAFF: Record<string, string> = Object.fromEntries(firmMembers.map(m => [m.id, m.name]));

// ── Households ───────────────────────────────────────────────
export type HouseholdKind = "individual" | "business" | "mixed";

export interface Household {
  id: string;
  name: string;
  kind: HouseholdKind;
  serviceTier: "Basic" | "Standard" | "Premium";
  since: number;
  /** IRS Form 8821 (transcript authorization) on file — drives Transcript Watch coverage */
  has8821: boolean;
  /** firm keeps this client's books (drives the Books module) */
  hasBooks: boolean;
  catchUp: string;
}

export const households: Household[] = [
  { id: "h-chen", name: "Chen Household", kind: "mixed", serviceTier: "Premium", since: 2021, has8821: true, hasBooks: false,
    catchUp: "5-year client. Marcus runs Golden Dragon LLC (restaurant) plus Riverside Rental LLC with Lin; files jointly. Wages dropped 40% after the second location closed — Marcus confirmed by email Jun 23. All three returns on extension." },
  { id: "h-sharma", name: "Priya Sharma", kind: "mixed", serviceTier: "Standard", since: 2025, has8821: true, hasBooks: false,
    catchUp: "First-year client. Creator income on Schedule C alongside her 1040. On extension; still collecting 4 documents — reminder drafted." },
  { id: "h-rodriguez", name: "Rodriguez Family", kind: "individual", serviceTier: "Premium", since: 2023, has8821: true, hasBooks: false,
    catchUp: "MFJ couple with a rental. 2025 return accepted in April, $2,840 refund. A CP2000 for tax year 2024 arrived Jun 18 — response drafted, in Notices." },
  { id: "h-williams", name: "DeShawn Williams", kind: "individual", serviceTier: "Basic", since: 2026, has8821: false, hasBooks: false,
    catchUp: "New client, head of household, 2 kids. Extension filed in April; W-2 still missing — chase #3 sent Tuesday." },
  { id: "h-park", name: "Park Family Dental", kind: "business", serviceTier: "Premium", since: 2020, has8821: true, hasBooks: true,
    catchUp: "Dental practice S-corp plus David & Grace's personal return. May books wrapping up; home-office + vehicle position open on the 1040." },
  { id: "h-nakamura", name: "Linda Nakamura", kind: "mixed", serviceTier: "Standard", since: 2022, has8821: true, hasBooks: false,
    catchUp: "W-2 plus a small Etsy shop. Both returns e-filed Jun 23 and accepted. A corrected 1099-DIV arrived after acceptance — 1040-X drafted." },
  { id: "h-fuentes", name: "Fuentes Transport", kind: "business", serviceTier: "Premium", since: 2022, has8821: true, hasBooks: true,
    catchUp: "Trucking S-corp plus Roberto & Maria's 1040. The 1120S is signed-ready — Roberto viewed the 8879 Jun 23 but hasn't signed." },
  { id: "h-sandoval", name: "Sandoval Plumbing", kind: "mixed", serviceTier: "Premium", since: 2023, has8821: true, hasBooks: true,
    catchUp: "Miguel's plumbing business on a 1040 Schedule C. Ready to prep. Missed the Jun 15 Q2 estimate — follow-up drafted." },
  { id: "h-obrien", name: "Karen O'Brien", kind: "individual", serviceTier: "Basic", since: 2024, has8821: false, hasBooks: false,
    catchUp: "Simple W-2 return, e-filed Jun 23 and accepted. $610 refund on the way; she asked about timing in the portal." },
  { id: "h-mendez", name: "Mendez Auto", kind: "business", serviceTier: "Premium", since: 2021, has8821: true, hasBooks: false,
    catchUp: "Auto repair partnership (1065) plus Carlos & Elena's joint 1040. K-1 allocation running; the 1040 waits on it." },
  { id: "h-russo", name: "Anthony Russo", kind: "individual", serviceTier: "Standard", since: 2024, has8821: true, hasBooks: false,
    catchUp: "Individual with brokerage activity. 7 of 23 lots on the Schwab 1099-B are missing cost basis — your call on how to proceed. CP14 earlier this month, paid and closed." },
];

// ── People ───────────────────────────────────────────────────
export type PersonRole = "Taxpayer" | "Spouse" | "Owner" | "Partner" | "Bookkeeper";

export interface Person {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: PersonRole;
  householdId: string;
}

export const people: Person[] = [
  { id: "p-marcus", name: "Marcus Chen", email: "marcus.chen@gmail.com", phone: "(951) 555-0142", role: "Taxpayer", householdId: "h-chen" },
  { id: "p-lin", name: "Lin Chen", email: "lin.chen@gmail.com", phone: "(951) 555-0143", role: "Spouse", householdId: "h-chen" },
  { id: "p-priya", name: "Priya Sharma", email: "priya.sharma@outlook.com", phone: "(951) 555-0198", role: "Taxpayer", householdId: "h-sharma" },
  { id: "p-james-r", name: "James Rodriguez", email: "jrodriguez@yahoo.com", phone: "(909) 555-0176", role: "Taxpayer", householdId: "h-rodriguez" },
  { id: "p-sofia", name: "Sofia Rodriguez", email: "sofia.r@yahoo.com", phone: "(909) 555-0177", role: "Spouse", householdId: "h-rodriguez" },
  { id: "p-deshawn", name: "DeShawn Williams", email: "deshawn.w@gmail.com", phone: "(951) 555-0134", role: "Taxpayer", householdId: "h-williams" },
  { id: "p-david", name: "David Park", email: "dpark@parkdental.com", phone: "(714) 555-0123", role: "Owner", householdId: "h-park" },
  { id: "p-grace", name: "Grace Park", email: "grace.park@gmail.com", phone: "(714) 555-0124", role: "Spouse", householdId: "h-park" },
  { id: "p-tina", name: "Tina Alvarez", email: "tina@parkdental.com", phone: "(714) 555-0125", role: "Bookkeeper", householdId: "h-park" },
  { id: "p-linda", name: "Linda Nakamura", email: "linda.n@proton.me", phone: "(626) 555-0155", role: "Taxpayer", householdId: "h-nakamura" },
  { id: "p-roberto", name: "Roberto Fuentes", email: "roberto@fuentestrucking.com", phone: "(909) 555-0188", role: "Owner", householdId: "h-fuentes" },
  { id: "p-mariaf", name: "Maria Fuentes", email: "maria.f@fuentestrucking.com", phone: "(909) 555-0189", role: "Spouse", householdId: "h-fuentes" },
  { id: "p-miguel", name: "Miguel Sandoval", email: "miguel@sandovalplumbing.com", phone: "(909) 555-0199", role: "Owner", householdId: "h-sandoval" },
  { id: "p-karen", name: "Karen O'Brien", email: "kobrien@hotmail.com", phone: "(626) 555-0178", role: "Taxpayer", householdId: "h-obrien" },
  { id: "p-carlos", name: "Carlos Mendez", email: "cmendez@mendezauto.com", phone: "(951) 555-0177", role: "Partner", householdId: "h-mendez" },
  { id: "p-elenam", name: "Elena Mendez", email: "elena.m@mendezauto.com", phone: "(951) 555-0178", role: "Partner", householdId: "h-mendez" },
  { id: "p-russo", name: "Anthony Russo", email: "a.russo@gmail.com", phone: "(626) 555-0161", role: "Taxpayer", householdId: "h-russo" },
];

// ── Entities (the things that file) ──────────────────────────
export interface Entity {
  id: string;
  householdId: string;
  name: string;
  type: string;
  form: string;
  ein?: string;
  /** ownership links — the relationship graph */
  owners?: { personId: string; pct: number }[];
}

export const entities: Entity[] = [
  { id: "e-chen-1040", householdId: "h-chen", name: "Marcus & Lin Chen", type: "Individual (MFJ)", form: "1040" },
  { id: "e-golden", householdId: "h-chen", name: "Golden Dragon LLC", type: "S-Corp", form: "1120S", ein: "84-1924011", owners: [{ personId: "p-marcus", pct: 100 }] },
  { id: "e-riverside", householdId: "h-chen", name: "Riverside Rental LLC", type: "Rental Partnership", form: "1065", ein: "88-3310042", owners: [{ personId: "p-marcus", pct: 50 }, { personId: "p-lin", pct: 50 }] },
  { id: "e-sharma-1040", householdId: "h-sharma", name: "Priya Sharma", type: "Individual", form: "1040" },
  { id: "e-sharma-c", householdId: "h-sharma", name: "Priya Creative", type: "Sole Prop", form: "Sch C" },
  { id: "e-rod-1040", householdId: "h-rodriguez", name: "James & Sofia Rodriguez", type: "Individual (MFJ)", form: "1040" },
  { id: "e-rod-rental", householdId: "h-rodriguez", name: "Rodriguez Rental", type: "Rental", form: "Sch E" },
  { id: "e-williams", householdId: "h-williams", name: "DeShawn Williams", type: "Individual (HoH)", form: "1040" },
  { id: "e-parkdental", householdId: "h-park", name: "Park Family Dental", type: "S-Corp", form: "1120S", ein: "47-2210983", owners: [{ personId: "p-david", pct: 100 }] },
  { id: "e-park-1040", householdId: "h-park", name: "David & Grace Park", type: "Individual (MFJ)", form: "1040" },
  { id: "e-nak-1040", householdId: "h-nakamura", name: "Linda Nakamura", type: "Individual", form: "1040" },
  { id: "e-nak-etsy", householdId: "h-nakamura", name: "Linda's Etsy Shop", type: "Sole Prop", form: "Sch C" },
  { id: "e-fuentes-s", householdId: "h-fuentes", name: "Fuentes Transport Inc", type: "S-Corp", form: "1120S", ein: "82-7741200", owners: [{ personId: "p-roberto", pct: 100 }] },
  { id: "e-fuentes-1040", householdId: "h-fuentes", name: "Roberto & Maria Fuentes", type: "Individual (MFJ)", form: "1040" },
  { id: "e-sandoval", householdId: "h-sandoval", name: "Miguel Sandoval", type: "Individual + Sch C", form: "1040" },
  { id: "e-obrien", householdId: "h-obrien", name: "Karen O'Brien", type: "Individual", form: "1040" },
  { id: "e-mendez-p", householdId: "h-mendez", name: "Mendez Auto Repair", type: "Partnership", form: "1065", ein: "83-5520117", owners: [{ personId: "p-carlos", pct: 50 }, { personId: "p-elenam", pct: 50 }] },
  { id: "e-mendez-1040", householdId: "h-mendez", name: "Carlos & Elena Mendez", type: "Individual (MFJ)", form: "1040" },
  { id: "e-russo", householdId: "h-russo", name: "Anthony Russo", type: "Individual", form: "1040" },
];

// ── Engagements (one return-year) ────────────────────────────
export interface Engagement {
  id: string;
  entityId: string;
  householdId: string;
  form: string;
  taxYear: 2025;
  stage: Stage;
  /** ISO dates */
  statutoryDeadline: string;
  extendedDeadline?: string;
  fee: number;
  depositPaid: boolean;
  preparer: "u-antonio";
  /** workflow dependency, shown as the blocked-by line on return cards */
  blockedBy?: string;
  /** internal K-1 flow: this engagement produces a K-1 consumed by another */
  k1FlowsTo?: string;
  /** set when the return was e-filed (drives "filed this week") */
  eFiledOn?: string;
  acceptedOn?: string;
  refund?: number;
}

const APR15 = "2026-04-15", MAR16 = "2026-03-16", OCT15 = "2026-10-15", SEP15 = "2026-09-15";

function mkEng(
  id: string, entityId: string, stage: Stage, fee: number,
  opts: Partial<Engagement> = {},
): Engagement {
  const e = entities.find(x => x.id === entityId)!;
  const business = e.form === "1120S" || e.form === "1065";
  const accepted = stage === "accepted" || stage === "e_filed";
  return {
    id, entityId, householdId: e.householdId, form: e.form, taxYear: 2025, stage, fee,
    statutoryDeadline: business ? MAR16 : APR15,
    extendedDeadline: accepted ? undefined : business ? SEP15 : OCT15,
    depositPaid: true, preparer: "u-antonio",
    ...opts,
  };
}

export const engagements: Engagement[] = [
  mkEng("en-chen-1040", "e-chen-1040", "in_preparation", 500),
  mkEng("en-golden", "e-golden", "in_preparation", 900, { k1FlowsTo: "en-chen-1040" }),
  mkEng("en-riverside", "e-riverside", "collecting_docs", 600, { k1FlowsTo: "en-chen-1040" }),
  mkEng("en-sharma-1040", "e-sharma-1040", "collecting_docs", 350),
  mkEng("en-sharma-c", "e-sharma-c", "collecting_docs", 250),
  mkEng("en-rod-1040", "e-rod-1040", "accepted", 500, { eFiledOn: "2026-04-09", acceptedOn: "2026-04-10", refund: 2840 }),
  mkEng("en-rod-rental", "e-rod-rental", "accepted", 250, { eFiledOn: "2026-04-09", acceptedOn: "2026-04-10" }),
  mkEng("en-williams", "e-williams", "collecting_docs", 150, { depositPaid: false, blockedBy: "W-2 — Hartline Logistics (employer)" }),
  mkEng("en-parkdental", "e-parkdental", "in_preparation", 1400, { k1FlowsTo: "en-park-1040" }),
  mkEng("en-park-1040", "e-park-1040", "ready_to_prep", 500, { blockedBy: "K-1 — Park Family Dental 1120S" }),
  mkEng("en-nak-1040", "e-nak-1040", "accepted", 350, { eFiledOn: "2026-06-23", acceptedOn: "2026-06-24" }),
  mkEng("en-nak-etsy", "e-nak-etsy", "accepted", 200, { eFiledOn: "2026-06-23", acceptedOn: "2026-06-24" }),
  mkEng("en-fuentes-s", "e-fuentes-s", "pay_and_sign", 1200, { blockedBy: "8879 signature — Roberto (viewed Jun 23, unsigned 2 days)", k1FlowsTo: "en-fuentes-1040" }),
  mkEng("en-fuentes-1040", "e-fuentes-1040", "in_review", 500),
  mkEng("en-sandoval", "e-sandoval", "ready_to_prep", 600),
  mkEng("en-obrien", "e-obrien", "accepted", 150, { eFiledOn: "2026-06-23", acceptedOn: "2026-06-24", refund: 610 }),
  mkEng("en-mendez-p", "e-mendez-p", "in_preparation", 1100, { k1FlowsTo: "en-mendez-1040" }),
  mkEng("en-mendez-1040", "e-mendez-1040", "ready_to_prep", 500, { blockedBy: "K-1 — Mendez Auto 1065" }),
  mkEng("en-russo", "e-russo", "in_preparation", 450, { blockedBy: "Cost basis — 7 of 23 lots (Schwab 1099-B)" }),
];

// ── Expected documents (per engagement, derived from prior year) ──
export interface ExpectedDoc {
  id: string;
  engagementId: string;
  type: string;
  source: string;
  status: ExpectedDocStatus;
  priorYearValue?: string;
  /** extraction results when in hand (per-field confidence; <0.95 flags) */
  fields?: { label: string; value: string; confidence: number; flag?: boolean }[];
  receivedVia?: "Portal" | "Email" | "Upload" | "Text";
  when?: string;
  note?: string;
}

let docSeq = 0;
function have(engagementId: string, type: string, source: string, extra: Partial<ExpectedDoc> = {}): ExpectedDoc {
  return { id: `doc-${++docSeq}`, engagementId, type, source, status: "have", receivedVia: "Portal", ...extra };
}
function req(engagementId: string, type: string, source: string, extra: Partial<ExpectedDoc> = {}): ExpectedDoc {
  return { id: `doc-${++docSeq}`, engagementId, type, source, status: "requested", ...extra };
}
/** n boring already-in-hand docs, named from the prior-year checklist */
function bulk(engagementId: string, n: number, label: string): ExpectedDoc[] {
  return Array.from({ length: n }, (_, i) =>
    have(engagementId, label, `${label} ${i + 1} — per 2024 checklist`));
}

export const expectedDocs: ExpectedDoc[] = [
  // Chen 1040 — 12 expected: 11 have + 1 needs_review (THE extraction exemplar)
  {
    id: "doc-chen-w2", engagementId: "en-chen-1040", type: "W-2", source: "W-2 — Golden Dragon LLC",
    status: "needs_review", receivedVia: "Email", when: "Jun 23", priorYearValue: "$96,400",
    note: "Wages dropped 40% vs 2024 — Marcus confirmed the Riverside location closed; one field still under the confidence bar.",
    fields: [
      { label: "Box 1 — Wages", value: "$58,000", confidence: 0.99 },
      { label: "Box 2 — Federal withholding", value: "$6,240", confidence: 0.98 },
      { label: "Box 12 — Code DD", value: "$8,410", confidence: 0.91, flag: true },
      { label: "Employer EIN", value: "84-1924011", confidence: 0.99 },
    ],
  },
  have("en-chen-1040", "Prior-year return", "2024 Return.pdf", { priorYearValue: "AGI $238,400" }),
  have("en-chen-1040", "1098", "1098 — Wells Fargo Home Mtg"),
  have("en-chen-1040", "K-1", "K-1 — Golden Dragon LLC (draft)"),
  ...bulk("en-chen-1040", 8, "Supporting doc"),

  // Golden Dragon 1120S — 20 expected: 18 have + 2 requested
  have("en-golden", "POS export", "POS export 2025.csv", { when: "Jun 22" }),
  have("en-golden", "Payroll summary", "Gusto payroll — Golden Dragon"),
  req("en-golden", "Bank statement", "December statement — Chase Business", { note: "Chase #2 sent Jun 20." }),
  req("en-golden", "Loan statement", "Equipment loan year-end statement", { note: "Chase #2 sent Jun 20." }),
  ...bulk("en-golden", 16, "Business doc"),

  // Riverside 1065 — 9 expected: 5 have + 4 requested
  have("en-riverside", "Lease", "Lease agreements (2 units)", { when: "Jun 24" }),
  ...bulk("en-riverside", 4, "Rental doc"),
  req("en-riverside", "1098", "1098 — rental mortgage"),
  req("en-riverside", "Insurance", "Landlord policy declarations"),
  req("en-riverside", "Repairs", "Repair invoices over $2,500"),
  req("en-riverside", "Utilities", "Utility summary"),

  // Sharma 1040 — 7 expected: 3 have + 4 requested
  have("en-sharma-1040", "1099-NEC", "1099-NEC — TikTok Inc", { when: "Jun 23", fields: [{ label: "Box 1 — Nonemployee comp", value: "$18,200", confidence: 0.99 }] }),
  ...bulk("en-sharma-1040", 2, "Supporting doc"),
  req("en-sharma-1040", "1099-NEC", "1099-NEC — brand deal (Aster Co)"),
  req("en-sharma-1040", "1099-K", "1099-K — payment app"),
  req("en-sharma-1040", "Mileage log", "Mileage log Jan–Dec 2025"),
  req("en-sharma-1040", "Home office", "Home-office square footage"),

  // Sharma Sch C — 5 expected: 2 have + 3 requested
  ...bulk("en-sharma-c", 2, "Business doc"),
  req("en-sharma-c", "Expense export", "Creator expense export"),
  req("en-sharma-c", "Equipment", "Camera + lighting receipts"),
  req("en-sharma-c", "Software", "Editing subscription invoices"),

  // Rodriguez — complete
  ...bulk("en-rod-1040", 13, "Filed doc"),
  ...bulk("en-rod-rental", 4, "Rental doc"),

  // Williams — 6 expected: 1 have + 5 requested (the at-risk story: "Missing 5 docs")
  have("en-williams", "ID", "Driver's license + SSN cards", { receivedVia: "Text" }),
  req("en-williams", "W-2", "W-2 — Hartline Logistics", { note: "Chase #3 sent Tue Jun 23 — escalate to a call?" }),
  req("en-williams", "Childcare", "Childcare provider statement"),
  req("en-williams", "1095-A", "1095-A — Covered California"),
  req("en-williams", "Bank info", "Direct-deposit details"),
  req("en-williams", "Prior-year return", "2024 return (self-prepared)"),

  // Park Dental 1120S — 20 expected: 18 have + 2 requested  → Park household ties to 32/34
  have("en-parkdental", "Bank statement", "Chase Business — May 2026", { when: "Jun 20", fields: [{ label: "Transactions", value: "145", confidence: 1 }, { label: "Auto-matched", value: "142 (98%)", confidence: 1 }] }),
  have("en-parkdental", "Payroll", "Gusto payroll summary — Q2"),
  ...bulk("en-parkdental", 16, "Business doc"),
  req("en-parkdental", "Vendor W-9", "W-9 — 3 contractors", { note: "Requests drafted — in your review queue." }),
  req("en-parkdental", "Equipment invoice", "Sterilizer purchase invoice ($2,800)"),

  // Park 1040 — 14 expected: 13 have + 1 needs_review (the 1098 anomaly)
  {
    id: "doc-park-1098", engagementId: "en-park-1040", type: "1098", source: "1098 — Wells Fargo Home Mtg",
    status: "needs_review", receivedVia: "Email", when: "Jun 24", priorYearValue: "$9,800",
    note: "Mortgage interest tripled vs 2024 — likely a refinance; verify the acquisition-debt cap before claiming.",
    fields: [
      { label: "Mortgage interest", value: "$31,400", confidence: 0.97, flag: true },
      { label: "Outstanding principal", value: "$842,000", confidence: 0.93, flag: true },
      { label: "Lender", value: "Wells Fargo Home Mtg", confidence: 0.99 },
    ],
  },
  ...bulk("en-park-1040", 13, "Supporting doc"),

  // Nakamura — complete (1 needs_review: the corrected 1099-DIV behind the 1040-X)
  {
    id: "doc-nak-div", engagementId: "en-nak-1040", type: "1099-DIV (corrected)", source: "1099-DIV — Vanguard",
    status: "needs_review", receivedVia: "Email", when: "Jun 24", priorYearValue: "$0",
    note: "Arrived after the return was accepted — drives the drafted 1040-X.",
    fields: [
      { label: "Ordinary dividends", value: "$420", confidence: 0.99, flag: true },
      { label: "Qualified dividends", value: "$390", confidence: 0.98 },
    ],
  },
  ...bulk("en-nak-1040", 6, "Filed doc"),
  ...bulk("en-nak-etsy", 4, "Business doc"),

  // Fuentes — complete
  ...bulk("en-fuentes-s", 15, "Business doc"),
  ...bulk("en-fuentes-1040", 11, "Filed doc"),

  // Sandoval — complete
  ...bulk("en-sandoval", 9, "Supporting doc"),

  // O'Brien — complete
  ...bulk("en-obrien", 4, "Filed doc"),

  // Mendez 1065 — 14 expected: 13 have + 1 requested
  ...bulk("en-mendez-p", 13, "Business doc"),
  req("en-mendez-p", "Insurance", "Prepaid insurance schedule"),

  // Mendez 1040 — complete (K-1 is produced internally by the 1065, not requested from the client)
  ...bulk("en-mendez-1040", 9, "Supporting doc"),

  // Russo — 9 expected: 8 have + 1 requested (basis statements)
  {
    id: "doc-russo-1099b", engagementId: "en-russo", type: "1099-B", source: "1099-B — Schwab",
    status: "have", receivedVia: "Email", when: "Jun 22",
    note: "7 of 23 lots show 'basis not reported to IRS' — Petal stopped rather than overstate the gain.",
    fields: [
      { label: "Proceeds (total)", value: "$214,900", confidence: 0.99 },
      { label: "Short-term gain (16 lots)", value: "$8,420", confidence: 0.97 },
      { label: "Cost basis — 7 lots", value: "Not reported", confidence: 0.58, flag: true },
      { label: "Wash sales", value: "None detected", confidence: 0.96 },
    ],
  },
  ...bulk("en-russo", 7, "Supporting doc"),
  req("en-russo", "Basis records", "Purchase confirmations — 7 lots (Schwab)", { note: "Request drafted — option A on the open decision." }),
];

// ── Skills (the library — 11) ────────────────────────────────
export interface SkillVariant {
  name: string;
  householdId?: string;
  delta: string;
}

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  trust: TrustTier;
  description: string;
  trigger: string;
  steps: string[];
  channels: string[];
  tone: string;
  escalation: string;
  variants?: SkillVariant[];
  graduation?: { approvedNoEditStreak: number; prompt: string; promoteTo: TrustTier };
}

export const skills: Skill[] = [
  {
    id: "sk-doc-chase", name: "Doc Chase", category: "signatures_chase", trust: 1,
    description: "Watches each engagement's expected-document checklist and follows up on what's missing, in your voice, on the client's preferred channel.",
    trigger: "5 days of checklist inactivity, or on demand from a record.",
    steps: ["Check the expected-docs checklist against what's arrived", "Draft a reminder naming exactly what's missing", "Queue for your approval", "Log the send and set the next follow-up"],
    channels: ["Email", "SMS", "Portal"], tone: "Warm, plain, specific — no jargon.",
    escalation: "After 3 unanswered chases, proposes a phone call instead of another message.",
    variants: [
      { name: "Firm default", delta: "Email first, portal fallback, 5-day cadence." },
      { name: "Doc Chase — Chen Household variant", householdId: "h-chen", delta: "SMS only, Mandarin greeting, weekly cadence." },
    ],
    graduation: { approvedNoEditStreak: 12, prompt: "You've approved 12 Doc Chase drafts without edits — promote Doc Chase to send automatically?", promoteTo: 2 },
  },
  {
    id: "sk-notice", name: "Notice Response", category: "prep_filing", trust: 1,
    description: "Reads IRS and state notices, matches them against the filed return, and drafts a response with the position documented.",
    trigger: "A notice arrives by mail scan, portal upload, or transcript match.",
    steps: ["Classify the notice and its respond-by date", "Match proposed changes against the filed return", "Draft the response with citations", "Queue for your approval; calendar the deadline"],
    channels: ["Mail", "IRS e-Services"], tone: "Formal, precise, factual.",
    escalation: "Any notice proposing more than $5,000 of tax goes straight to you with no draft sent.",
  },
  {
    id: "sk-precall", name: "Pre-call Brief", category: "meetings_calls", trust: 3,
    description: "Assembles a one-page brief before each client call: open items, last commitments, and what changed since you last spoke.",
    trigger: "A calendar event with a client attendee, 30 minutes out.",
    steps: ["Read the calendar event", "Pull open tasks, recent docs, and notes for the household", "Write the one-page brief", "Deliver ~15 minutes before the call"],
    channels: ["Calendar", "In-app"], tone: "Terse, scannable.",
    escalation: "Informational only — nothing external ever sends.",
  },
  {
    id: "sk-estimates", name: "Estimate Reminders", category: "estimates_deadlines", trust: 1,
    description: "Computes safe-harbor vouchers from the latest filed return and reminds clients ahead of each quarterly deadline.",
    trigger: "21 days before each estimated-payment due date; follow-ups for missed payments.",
    steps: ["Compute safe-harbor amounts from the filed return", "Draft vouchers + a payment reminder", "Queue for your approval", "Track confirmations; follow up on misses"],
    channels: ["Email", "Portal"], tone: "Brief, deadline-first.",
    escalation: "Two missed quarters in a row → proposes a planning call.",
  },
  {
    id: "sk-signature", name: "Signature Follow-up", category: "signatures_chase", trust: 1,
    description: "Tracks every out-for-signature 8879 and nudges signers who viewed but didn't sign.",
    trigger: "An envelope is viewed without signing for 24 hours, or unopened for 3 days.",
    steps: ["Read envelope status", "Draft a nudge matched to where the signer stopped", "Queue for your approval", "On signature, hand off to e-file"],
    channels: ["Email", "SMS"], tone: "Light, one-line.",
    escalation: "After 2 nudges, proposes you call the signer.",
  },
  {
    id: "sk-variance", name: "Variance Review", category: "prep_filing", trust: 1,
    description: "Compares every extracted figure against prior year and flags moves beyond the firm threshold before anything is filed.",
    trigger: "A document finishes extraction on an open engagement.",
    steps: ["Compare each figure to the 2024 return", "Flag moves beyond ±25%", "Attach the comparison to the engagement", "Queue flags for your decision"],
    channels: ["In-app"], tone: "Numbers first.",
    escalation: "Flags never clear themselves — a human resolves every one.",
  },
  {
    id: "sk-books", name: "Books-to-Tax Close", category: "books", trust: 1,
    description: "Gets a books client's ledger tax-ready: reconciles bank activity, proposes categories, and drafts the adjusting entries you review.",
    trigger: "Month end for books clients, or on demand.",
    steps: ["Reconcile bank + card feeds against the ledger", "Propose categories for unmatched items", "Draft adjusting entries", "Queue the close items you must review"],
    channels: ["QuickBooks Online"], tone: "Ledger-precise.",
    escalation: "Transactions over $250 with no historical match always come to you.",
  },
  {
    id: "sk-1099", name: "1099 Batch", category: "prep_filing", trust: 0,
    description: "Collects W-9s during the year and drafts the January 1099-NEC batch from the vendor ledger.",
    trigger: "Vendor crosses $600 paid without a W-9 on file; batch drafts in January.",
    steps: ["Watch vendor ledgers for $600+ without a W-9", "Draft W-9 requests", "In January, draft the 1099-NEC batch", "Queue for your approval and filing"],
    channels: ["Email", "Portal"], tone: "Housekeeping-brief.",
    escalation: "Proposes only until January; nothing files without you.",
  },
  {
    id: "sk-invoice", name: "Invoice Chase", category: "signatures_chase", trust: 1,
    description: "Follows up on overdue invoices with a polite, firm reminder and a payment link.",
    trigger: "An invoice passes its due date by 7 days.",
    steps: ["Check the invoice ledger for overdue balances", "Draft a reminder with the payment link", "Queue for your approval", "Log and schedule the next touch"],
    channels: ["Email"], tone: "Courteous, direct.",
    escalation: "Past 30 days overdue → proposes pausing work and flagging the engagement.",
  },
  {
    id: "sk-transcript", name: "Transcript Watch", category: "prep_filing", trust: 3,
    description: "Polls IRS transcripts for every client with an 8821 on file and reports any change — new notices, holds, or adjustments.",
    trigger: "Daily, for the 9 clients with an 8821 on file.",
    steps: ["Pull transcripts via IRS e-Services", "Diff against the last pull", "Match changes to open notices or returns", "Log the check; surface changes in your brief"],
    channels: ["IRS e-Services"], tone: "Read-only reporting.",
    escalation: "Reads only — any required response routes through Notice Response at its own tier.",
  },
  {
    id: "sk-deadline", name: "Deadline & Extension Filing", category: "estimates_deadlines", trust: 1,
    description: "Tracks every statutory and extended deadline and drafts extensions before anything goes late.",
    trigger: "30 days before any deadline with the return not yet ready.",
    steps: ["Scan engagements against their deadlines", "Draft 4868/7004 extensions where needed", "Queue for your approval", "Confirm acceptance and update the engagement"],
    channels: ["OLT Pro"], tone: "Dates and amounts only.",
    escalation: "Never files anything — extensions transmit only after your approval.",
  },
];

// ── Skill runs (the provenance backbone) ─────────────────────
export interface SkillRun {
  id: string;
  skillId: string;
  householdId: string;
  engagementId?: string;
  startedAt: string;
  status: "running" | "done";
  inputs: { ref: string; page?: string }[];
  outputs: string[];
  extracted?: { label: string; value: string; confidence: number; flag?: boolean }[];
  /** the rule or comparison used — rendered verbatim in Sources & reasoning */
  rule?: string;
  confidence?: number;
  trustTierAtRun: TrustTier;
  approvedBy?: string;
  approvedAt?: string;
  summary: string;
  reasoning: string;
}

export const skillRuns: SkillRun[] = [
  {
    id: "run-w2-chen", skillId: "sk-variance", householdId: "h-chen", engagementId: "en-chen-1040",
    startedAt: "Jun 23, 9:14 AM", status: "done", trustTierAtRun: 1,
    inputs: [{ ref: "W-2 — Golden Dragon LLC", page: "p.1" }, { ref: "2024 Return.pdf", page: "p.2 (wages)" }],
    outputs: ["Extraction filed to Chen 2025", "Variance flag attached to the engagement"],
    extracted: [
      { label: "Box 1 — Wages", value: "$58,000", confidence: 0.99 },
      { label: "Box 12 — Code DD", value: "$8,410", confidence: 0.91, flag: true },
    ],
    rule: "wages $58,000 vs $96,400 prior year → −40% variance flag (threshold ±25%)",
    confidence: 0.95,
    summary: "Extracted Marcus's W-2 and flagged the 40% wage drop against 2024.",
    reasoning: "Wages fell 40% because the Riverside location closed in Q2 — consistent with Marcus's Jun 23 email. One extracted field (Box 12) is below the 95% confidence bar, so the document sits in Needs review rather than auto-filing.",
  },
  {
    id: "run-recon-park", skillId: "sk-books", householdId: "h-park", engagementId: "en-parkdental",
    startedAt: "Jun 20, 7:02 AM", status: "done", trustTierAtRun: 1,
    approvedBy: "Antonio Vazquez", approvedAt: "Jun 22",
    inputs: [{ ref: "Chase Business — May 2026", page: "all" }, { ref: "Gusto payroll summary — Q2" }, { ref: "Fixed-asset schedule", page: "p.3" }],
    outputs: ["142 of 145 transactions matched", "3 categories proposed from David's email", "Adjusting entries drafted"],
    rule: "transactions over $250 with no historical match are held for review (firm threshold)",
    confidence: 0.91,
    summary: "Reconciled May bank activity for Park Family Dental; 3 items needed a category.",
    reasoning: "98% of May activity matched prior categorization. The three flagged items ($2,800, $910, $500) exceed the $250 threshold with no history; David's Jun 24 email identifies them — categories proposed and queued for approval.",
  },
  {
    id: "run-cp2000", skillId: "sk-notice", householdId: "h-rodriguez", engagementId: "en-rod-1040",
    startedAt: "Jun 22, 8:40 AM", status: "done", trustTierAtRun: 1,
    inputs: [{ ref: "IRS CP2000 — tax year 2024", page: "p.1–3" }, { ref: "2024 Return.pdf", page: "Schedule B" }, { ref: "1099-INT — Chase", page: "p.1" }],
    outputs: ["Response letter drafted", "Respond-by deadline calendared (Jul 18)"],
    rule: "proposed underreporting matched line-by-line against Schedule B of the filed return",
    confidence: 0.86,
    summary: "Drafted the CP2000 response: the interest was reported — the IRS matched the wrong year.",
    reasoning: "The CP2000 proposes +$1,210 tax on a 1099-INT it says was unreported. The same interest appears on Schedule B of the filed 2024 return; the payer reported it against the wrong year. The draft disputes the notice and attaches Schedule B and the 1099-INT.",
  },
  {
    id: "run-transcript-rod", skillId: "sk-transcript", householdId: "h-rodriguez",
    startedAt: "Jun 24, 6:05 AM", status: "done", trustTierAtRun: 3,
    inputs: [{ ref: "IRS account transcript — Rodriguez (8821)", page: "2024" }],
    outputs: ["Transcript change logged", "Matched to open notice CP2000"],
    rule: "daily transcript diff for the 9 clients with an 8821 on file",
    confidence: 0.99,
    summary: "Transcript change detected for Rodriguez — matches the CP2000 already in Notices.",
    reasoning: "The 2024 account transcript shows a new AUR (underreporter) marker dated Jun 16. It corresponds to the CP2000 received Jun 18 — no new issue; logged and linked.",
  },
  {
    id: "run-cp14-russo", skillId: "sk-notice", householdId: "h-russo",
    startedAt: "Jun 23, 10:20 AM", status: "done", trustTierAtRun: 1,
    approvedBy: "Antonio Vazquez", approvedAt: "Jun 23",
    inputs: [{ ref: "IRS CP14 — tax year 2025", page: "p.1" }, { ref: "IRS payment confirmation — Jun 12" }],
    outputs: ["Confirmation letter drafted and mailed", "Notice closed"],
    rule: "balance-due notice matched against the payment posted Jun 12",
    confidence: 0.97,
    summary: "Closed the Russo CP14 — balance was paid Jun 12; confirmation drafted and mailed.",
    reasoning: "The CP14 balance was paid online Jun 12, before the notice crossed in the mail. The letter documents the payment confirmation number so the account closes cleanly.",
  },
  {
    id: "run-efile-nak", skillId: "sk-deadline", householdId: "h-nakamura", engagementId: "en-nak-1040",
    startedAt: "Jun 23, 11:05 AM", status: "done", trustTierAtRun: 1,
    approvedBy: "Antonio Vazquez", approvedAt: "Jun 23",
    inputs: [{ ref: "Linda 2025 return — final", page: "all" }, { ref: "8879 — signed Jun 22" }],
    outputs: ["Transmitted via OLT Pro", "IRS acceptance Jun 24"],
    rule: "transmit only after signed 8879 + your approval",
    confidence: 0.98,
    summary: "E-filed Linda's 1040 after your Jun 23 approval; accepted Jun 24.",
    reasoning: "Return was final, 8879 signed Jun 22, approval logged Jun 23. Acknowledgment synced back from OLT Pro.",
  },
  {
    id: "run-efile-etsy", skillId: "sk-deadline", householdId: "h-nakamura", engagementId: "en-nak-etsy",
    startedAt: "Jun 23, 11:06 AM", status: "done", trustTierAtRun: 1,
    approvedBy: "Antonio Vazquez", approvedAt: "Jun 23",
    inputs: [{ ref: "Etsy Schedule C — final" }],
    outputs: ["Transmitted with the 1040", "IRS acceptance Jun 24"],
    rule: "transmit only after signed 8879 + your approval",
    confidence: 0.98,
    summary: "Schedule C transmitted with Linda's 1040; accepted Jun 24.",
    reasoning: "Filed as part of the same submission; acknowledgment received.",
  },
  {
    id: "run-efile-obrien", skillId: "sk-deadline", householdId: "h-obrien", engagementId: "en-obrien",
    startedAt: "Jun 23, 11:20 AM", status: "done", trustTierAtRun: 1,
    approvedBy: "Antonio Vazquez", approvedAt: "Jun 23",
    inputs: [{ ref: "Karen 2025 return — final" }, { ref: "8879 — signed Jun 21" }],
    outputs: ["Transmitted via OLT Pro", "IRS acceptance Jun 24", "$610 refund expected"],
    rule: "transmit only after signed 8879 + your approval",
    confidence: 0.99,
    summary: "E-filed Karen's 1040 after your Jun 23 approval; accepted within a day.",
    reasoning: "Simple W-2 return; clean acceptance with a $610 refund.",
  },
  {
    id: "run-brief-fuentes", skillId: "sk-precall", householdId: "h-fuentes", engagementId: "en-fuentes-s",
    startedAt: "Jun 25, 8:30 AM", status: "running", trustTierAtRun: 3,
    inputs: [{ ref: "Calendar — Fuentes 1120S review, 3:00 PM" }, { ref: "Client notes — Fuentes" }, { ref: "1120S 2025 — final draft" }],
    outputs: ["One-page brief (in progress)"],
    summary: "Assembling the brief for this afternoon's 1120S review call.",
    reasoning: "Pulling the unsigned-8879 status, Roberto's bonus-depreciation question from Jun 22, and the open invoice balance. Lands ~15 minutes before the call.",
  },
  {
    id: "run-1065-mendez", skillId: "sk-variance", householdId: "h-mendez", engagementId: "en-mendez-p",
    startedAt: "Jun 25, 7:10 AM", status: "running", trustTierAtRun: 1,
    inputs: [{ ref: "Mendez Auto books 2025" }, { ref: "2024 Return.pdf", page: "K-1s" }],
    outputs: ["Depreciation complete", "K-1 allocation in progress"],
    summary: "Drafting the Mendez Auto 1065 — allocating the two partner K-1s now.",
    reasoning: "Depreciation reconciles to the fixed-asset schedule. Once K-1s allocate, they flow to Carlos & Elena's 1040 and clear its blocker.",
  },
  {
    id: "run-est-q2", skillId: "sk-estimates", householdId: "h-sandoval",
    startedAt: "Jun 22, 9:00 AM", status: "done", trustTierAtRun: 1,
    inputs: [{ ref: "Q2 voucher ledger" }, { ref: "Safe-harbor worksheet — 2025 returns" }],
    outputs: ["Follow-up drafts for 2 missed Q2 payments (Sandoval, Park Dental)"],
    rule: "safe harbor: 110% of prior-year tax for AGI over $150k, else 100%",
    confidence: 0.94,
    summary: "Q2 estimates passed Jun 15 — two clients haven't paid; follow-ups drafted.",
    reasoning: "Payment confirmations arrived for 7 of 9 voucher clients. Sandoval and Park Dental show no payment; reminders are queued for your approval.",
  },
  {
    id: "run-extract-sharma", skillId: "sk-variance", householdId: "h-sharma", engagementId: "en-sharma-1040",
    startedAt: "Jun 23, 2:10 PM", status: "done", trustTierAtRun: 1,
    inputs: [{ ref: "1099-NEC — TikTok Inc", page: "p.1" }],
    outputs: ["Extraction filed to Sharma 2025"],
    extracted: [{ label: "Box 1 — Nonemployee comp", value: "$18,200", confidence: 0.99 }],
    rule: "first-year client — no prior-year comparison available; extraction only",
    confidence: 0.99,
    summary: "Extracted Priya's TikTok 1099-NEC cleanly.",
    reasoning: "All fields above the confidence bar; filed to the engagement without flags.",
  },
];

// ── Tasks ────────────────────────────────────────────────────
export interface ProposedAction {
  key: "A" | "B" | "C";
  label: string;
  detail: string;
}

export interface Task {
  id: string;
  householdId: string;
  engagementId?: string;
  status: TaskStatus;
  kind: string;
  title: string;
  why: string;
  skillId: string;
  runId?: string;
  proposedActions?: ProposedAction[];
  recommendedAction?: "A" | "B" | "C";
  recommendation?: string;
  draftText?: string;
  /** ISO deadline driving the deadline chip */
  deadline?: string;
  feeContext?: string;
  flagged?: boolean;
  estimatedMin: number;
  noticeId?: string;
}

export const tasks: Task[] = [
  // ── Needs decision (5) ─────────────────────────────────────
  {
    id: "t-russo-basis", householdId: "h-russo", engagementId: "en-russo", status: "needs_decision",
    kind: "Calculation", title: "Capital gains: 7 of 23 lots missing basis",
    why: "Filing without basis would overstate the gain and the tax. Petal stopped rather than guess.",
    skillId: "sk-variance", flagged: true, estimatedMin: 6, deadline: "2026-10-15",
    feeContext: "Fee $450 — blocked on this decision",
    proposedActions: [
      { key: "A", label: "Request statements from client (drafted)", detail: "Ask Anthony for the purchase confirmations on the 7 uncovered lots — the request is already drafted." },
      { key: "B", label: "Broker lookup", detail: "Pull historical basis from Schwab — slower, needs Anthony's authorization." },
      { key: "C", label: "Proceed with $0 basis (adds ~$3.1k tax)", detail: "Compliant but overstates the gain by roughly $3,100 of tax. Not recommended." },
    ],
    recommendedAction: "A",
    recommendation: "Petal recommends A — the records request is drafted and Anthony responded same-day to the CP14 earlier this month.",
  },
  {
    id: "t-cp2000-rod", householdId: "h-rodriguez", engagementId: "en-rod-1040", status: "needs_decision",
    kind: "IRS notice", title: "CP2000 response drafted — review before it mails",
    why: "The IRS proposes +$1,210 tax from a 1099-INT it says was unreported. It was reported — the IRS matched the wrong year.",
    skillId: "sk-notice", runId: "run-cp2000", noticeId: "n-cp2000", estimatedMin: 8, deadline: "2026-07-18",
    proposedActions: [
      { key: "A", label: "Approve the drafted response", detail: "Dispute the notice with Schedule B and the 1099-INT attached." },
      { key: "B", label: "Concede and pay", detail: "Accept the proposed change — not supported by the return." },
    ],
    recommendedAction: "A",
    recommendation: "Petal recommends A — the interest appears on Schedule B of the filed return. The full draft lives in Notices.",
  },
  {
    id: "t-park-1098", householdId: "h-park", engagementId: "en-park-1040", status: "needs_decision",
    kind: "Variance flag", title: "Mortgage interest up 3x year over year — verify before prep",
    why: "The 1098 shows $31,400 against $9,800 in 2024. Likely a refinance, but the acquisition-debt cap may limit the deduction.",
    skillId: "sk-variance", flagged: true, estimatedMin: 3, deadline: "2026-10-15",
    proposedActions: [
      { key: "A", label: "Confirm the refinance with David", detail: "One question on the next books call — the brief already includes it." },
      { key: "B", label: "Request the closing disclosure", detail: "Document the new loan terms before claiming the deduction." },
      { key: "C", label: "Cap at $750k acquisition debt", detail: "Claim the limited amount now; amend later if the records support more." },
    ],
    recommendedAction: "A",
    recommendation: "Petal recommends A — David is responsive and the books call is already scheduled.",
  },
  {
    id: "t-nak-1040x", householdId: "h-nakamura", engagementId: "en-nak-1040", status: "needs_decision",
    kind: "Amendment", title: "Corrected 1099-DIV arrived after acceptance — 1040-X drafted",
    why: "Vanguard issued a corrected 1099-DIV ($420 of dividends) the day after Linda's return was accepted. The amendment adds $63 of tax.",
    skillId: "sk-notice", estimatedMin: 5, deadline: "2026-07-31",
    proposedActions: [
      { key: "A", label: "File the 1040-X now", detail: "Cleaner than waiting for an IRS notice; the explanation statement is drafted." },
      { key: "B", label: "Wait for the IRS to match it", detail: "The IRS may catch it next year — risks interest and a notice." },
    ],
    recommendedAction: "A",
    recommendation: "Petal recommends A — $63 now beats a CP2000 next spring.",
  },
  {
    id: "t-chen-wages", householdId: "h-chen", engagementId: "en-chen-1040", status: "needs_decision",
    kind: "Variance flag", title: "Wages down 40% — accept Marcus's confirmation?",
    why: "Marcus confirmed by email Jun 23 that the Riverside location closed in May. The flag needs your sign-off before prep continues.",
    skillId: "sk-variance", runId: "run-w2-chen", flagged: true, estimatedMin: 2, deadline: "2026-10-15",
    proposedActions: [
      { key: "A", label: "Accept the email confirmation", detail: "Log Marcus's Jun 23 reply as the support and clear the flag." },
      { key: "B", label: "Schedule a call", detail: "Confirm verbally before clearing — slower, adds little." },
    ],
    recommendedAction: "A",
    recommendation: "Petal recommends A — the email is unambiguous and consistent with the POS export.",
  },

  // ── Ready to approve (7) ───────────────────────────────────
  {
    id: "t-williams-chase", householdId: "h-williams", engagementId: "en-williams", status: "ready_to_approve",
    kind: "Doc chase", title: "DeShawn's W-2 — chase #4, escalated to a call offer",
    why: "Three messages unanswered since Jun 12. This draft offers a 10-minute call instead of another reminder.",
    skillId: "sk-doc-chase", estimatedMin: 1, deadline: "2026-10-15", feeContext: "Fee $150 — deposit unpaid",
    draftText: "Hi DeShawn — I know things get busy. We still need your W-2 from Hartline to start your return. Want to hop on a quick 10-minute call this week instead? I can also walk you through texting a photo — whatever's easiest.",
  },
  {
    id: "t-sharma-chase", householdId: "h-sharma", engagementId: "en-sharma-1040", status: "ready_to_approve",
    kind: "Doc chase", title: "Priya — 4 documents outstanding, reminder drafted",
    why: "Missing both 1099-NECs, the mileage log, and home-office square footage. Warm reminder matched to her channel.",
    skillId: "sk-doc-chase", estimatedMin: 1, deadline: "2026-10-15",
    draftText: "Hi Priya! Quick check-in on your 2025 return — we're still missing: the brand-deal 1099-NEC, your 1099-K, the mileage log, and your home-office square footage. Upload to the portal or text photos, whatever's easiest. The sooner these land, the sooner we wrap up!",
  },
  {
    id: "t-fuentes-8879", householdId: "h-fuentes", engagementId: "en-fuentes-s", status: "ready_to_approve",
    kind: "Signature follow-up", title: "8879 viewed but not signed — 2 days. Nudge drafted",
    why: "Roberto opened the envelope Jun 23 and stopped. The 1120S can't transmit until he signs.",
    skillId: "sk-signature", estimatedMin: 1, deadline: "2026-09-15", feeContext: "Fee $1,200 — transmits on signature",
    draftText: "Hi Roberto — your 8879 is sitting one signature away from filing the 1120S. Two clicks and we're done. Anything in the form giving you pause? Happy to walk through it before this afternoon's call.",
  },
  {
    id: "t-park-w9", householdId: "h-park", engagementId: "en-parkdental", status: "ready_to_approve",
    kind: "W-9 collection", title: "3 contractors paid $600+ without a W-9 — requests drafted",
    why: "Park Dental paid $11,400 across 3 contractors with no W-9 on file. Collecting now keeps January's 1099 batch clean.",
    skillId: "sk-1099", estimatedMin: 2, deadline: "2027-01-31",
    draftText: "Hi — quick housekeeping from Park Family Dental's accounting team: we need a signed W-9 on file to issue your 1099 correctly next January. It takes about a minute — here's the secure link. Thank you!",
  },
  {
    id: "t-est-q2", householdId: "h-sandoval", status: "ready_to_approve",
    kind: "Estimate follow-up", title: "Q2 estimates — 2 clients missed the Jun 15 payment",
    why: "Sandoval Plumbing and Park Family Dental show no Q2 payment confirmation. Follow-ups drafted with voucher copies attached.",
    skillId: "sk-estimates", runId: "run-est-q2", estimatedMin: 2, deadline: "2026-06-30",
    draftText: "Hi Miguel — our records show the Q2 estimated payment (due Jun 15) hasn't gone through. The voucher's attached; paying this week keeps any penalty negligible. Reply here if it's already paid and I'll match it up.",
  },
  {
    id: "t-obrien-refund", householdId: "h-obrien", engagementId: "en-obrien", status: "ready_to_approve",
    kind: "Client question", title: "Karen asked where her refund is — reply drafted",
    why: "Routine question; the answer is on the record. Petal can answer this one.",
    skillId: "sk-doc-chase", estimatedMin: 1,
    draftText: "Hi Karen — great news: your return was accepted by the IRS on June 24, with a $610 refund on the way. Direct deposits usually land within 21 days of acceptance — so by mid-July at the latest. You can track it at irs.gov/refunds with your SSN and the exact amount ($610).",
  },
  {
    id: "t-park-books", householdId: "h-park", engagementId: "en-parkdental", status: "ready_to_approve",
    kind: "Books", title: "3 uncategorized May expenses — categories proposed from David's email",
    why: "David identified all three: $2,800 sterilizer (Equipment), $910 team dinner (Meals, 50% limit), $500 renewal (Software).",
    skillId: "sk-books", runId: "run-recon-park", estimatedMin: 2, deadline: "2026-06-30",
    feeContext: "Blocks the May books close",
    draftText: "Post: $2,800 → Equipment (Section 179 candidate) · $910 → Meals (50% deductible) · $500 → Software subscriptions. Then post drafted closing entries.",
  },

  // ── Running (2) ────────────────────────────────────────────
  {
    id: "t-mendez-1065", householdId: "h-mendez", engagementId: "en-mendez-p", status: "running",
    kind: "Return drafting", title: "Drafting the Mendez Auto 1065 — K-1 allocation in progress",
    why: "Depreciation is done. Once the two partner K-1s allocate, they flow to Carlos & Elena's 1040 and clear its blocker.",
    skillId: "sk-variance", runId: "run-1065-mendez", estimatedMin: 0, deadline: "2026-09-15",
  },
  {
    id: "t-brief-fuentes", householdId: "h-fuentes", status: "running",
    kind: "Pre-call brief", title: "Brief generating for the 3:00 PM Fuentes 1120S review",
    why: "Open items, the unsigned 8879, and Roberto's bonus-depreciation question. Lands ~15 minutes before the call.",
    skillId: "sk-precall", runId: "run-brief-fuentes", estimatedMin: 0,
  },

  // ── Scheduled (2) ──────────────────────────────────────────
  {
    id: "t-est-q3", householdId: "h-sandoval", status: "scheduled",
    kind: "Estimates", title: "Q3 estimate vouchers — compute Sep 1 for the Sep 15 deadline",
    why: "Safe-harbor vouchers for 9 clients draft automatically on Sep 1 and land here for approval.",
    skillId: "sk-estimates", estimatedMin: 0, deadline: "2026-09-15",
  },
  {
    id: "t-ext-watch", householdId: "h-park", status: "scheduled",
    kind: "Deadline check", title: "Weekly extension-season sweep — next run Monday",
    why: "Every extended engagement checked against Sep 15 / Oct 15 pacing; anything falling behind surfaces here.",
    skillId: "sk-deadline", estimatedMin: 0,
  },

  // ── Waiting on client (2) ──────────────────────────────────
  {
    id: "t-golden-docs", householdId: "h-chen", engagementId: "en-golden", status: "waiting_client",
    kind: "Doc chase", title: "Golden Dragon — 2 documents outstanding",
    why: "December bank statement and the equipment-loan statement. Chase #2 sent Jun 20 on the Chen SMS cadence.",
    skillId: "sk-doc-chase", estimatedMin: 0, deadline: "2026-09-15",
  },
  {
    id: "t-riverside-docs", householdId: "h-chen", engagementId: "en-riverside", status: "waiting_client",
    kind: "Doc chase", title: "Riverside Rental — 4 documents outstanding",
    why: "Rental 1098, landlord policy, repair invoices, and the utility summary. First chase sent Jun 24.",
    skillId: "sk-doc-chase", estimatedMin: 0, deadline: "2026-09-15",
  },

  // ── Waiting on third party (1) ─────────────────────────────
  {
    id: "t-mendez-k1", householdId: "h-mendez", engagementId: "en-mendez-1040", status: "waiting_third_party",
    kind: "K-1 flow", title: "Waiting on K-1 — Mendez Auto 1065",
    why: "Carlos & Elena's 1040 can't start until the partnership return issues its K-1s. The 1065 draft is running now.",
    skillId: "sk-deadline", estimatedMin: 0, deadline: "2026-10-15",
  },

  // ── Done (4 receipts) ──────────────────────────────────────
  {
    id: "t-efiled-3", householdId: "h-nakamura", status: "done",
    kind: "E-file receipt", title: "Petal filed 3 returns clean — pre-approved by you Jun 23",
    why: "Linda's 1040 + Etsy Schedule C and Karen's 1040 transmitted Jun 23 after your approval; all accepted Jun 24.",
    skillId: "sk-deadline", runId: "run-efile-nak", estimatedMin: 0,
  },
  {
    id: "t-recon-park-done", householdId: "h-park", engagementId: "en-parkdental", status: "done",
    kind: "Books receipt", title: "May bank activity reconciled — 142 of 145 matched",
    why: "Approved Jun 22. The 3 unmatched items are in your queue with proposed categories.",
    skillId: "sk-books", runId: "run-recon-park", estimatedMin: 0,
  },
  {
    id: "t-transcript-rod", householdId: "h-rodriguez", status: "done",
    kind: "Transcript watch", title: "Transcript change detected for Rodriguez — matched to the CP2000",
    why: "No new issue: the AUR marker corresponds to the notice already in Notices.",
    skillId: "sk-transcript", runId: "run-transcript-rod", noticeId: "n-cp2000", estimatedMin: 0,
  },
  {
    id: "t-cp14-russo", householdId: "h-russo", status: "done",
    kind: "Notice receipt", title: "Russo CP14 closed — payment confirmed, letter mailed",
    why: "Balance was paid Jun 12 before the notice crossed in the mail. Approved and mailed Jun 23.",
    skillId: "sk-notice", runId: "run-cp14-russo", noticeId: "n-cp14", estimatedMin: 0,
  },
];

// ── Notices ──────────────────────────────────────────────────
export interface Notice {
  id: string;
  type: string;
  householdId: string;
  taxYear: number;
  received: string;
  respondBy: string;
  status: "response_drafted" | "resolved";
  amount?: string;
  draftedResponse?: string;
  runId?: string;
  linkedTranscriptRunId?: string;
  resolvedBy?: string;
  resolvedOn?: string;
  note?: string;
}

export const notices: Notice[] = [
  {
    id: "n-cp2000", type: "CP2000", householdId: "h-rodriguez", taxYear: 2024,
    received: "2026-06-18", respondBy: "2026-07-18", status: "response_drafted",
    amount: "+$1,210 proposed", runId: "run-cp2000", linkedTranscriptRunId: "run-transcript-rod",
    draftedResponse: `Re: CP2000, tax year 2024 — James & Sofia Rodriguez

We disagree with the proposed change. The $1,210 of interest income identified in this notice was reported on Schedule B, line 1 of the taxpayers' timely filed 2024 return (copy enclosed). The payer's 1099-INT (enclosed) shows the same amount; the information-return match appears to have been applied to the wrong tax year.

We respectfully request the proposed assessment be withdrawn. Please contact this office with any questions — Form 2848 is on file.

Antonio Vazquez, EA · Vazant EA`,
  },
  {
    id: "n-cp14", type: "CP14", householdId: "h-russo", taxYear: 2025,
    received: "2026-06-08", respondBy: "2026-06-29", status: "resolved",
    amount: "$1,840 balance due", runId: "run-cp14-russo",
    resolvedBy: "Antonio Vazquez", resolvedOn: "2026-06-23",
    note: "Balance paid online Jun 12, before the notice crossed in the mail. Confirmation letter mailed Jun 23.",
  },
];

// ── Positions ────────────────────────────────────────────────
export interface Position {
  id: string;
  engagementId: string;
  householdId: string;
  issue: string;
  authorityLevel: string;
  confidence: number;
  documentation: string[];
  status: "open" | "resolved";
  resolvedBy?: string;
  resolvedOn?: string;
}

export const positions: Position[] = [
  {
    id: "p-park-ho", engagementId: "en-park-1040", householdId: "h-park",
    issue: "Home office + vehicle mixed-use", authorityLevel: "Substantial authority", confidence: 0.74,
    documentation: ["Home-office floor plan + square-footage worksheet", "Mileage log Jan–Dec 2025"],
    status: "open",
  },
  {
    id: "p-chen-qbi", engagementId: "en-chen-1040", householdId: "h-chen",
    issue: "QBI deduction — SSTB threshold", authorityLevel: "Settled", confidence: 0.96,
    documentation: ["§199A worksheet"],
    status: "resolved", resolvedBy: "Antonio Vazquez", resolvedOn: "2026-06-20",
  },
];

// ── Workpapers ───────────────────────────────────────────────
export interface WorkpaperRow {
  line: string;
  amount: string;
  sourceDoc: string;
  page?: string;
  runId?: string;
}

export interface Workpaper {
  id: string;
  engagementId: string;
  rows: WorkpaperRow[];
}

/** UI tagline: "Trace any line on the return back to the run, the workpaper, and the source document." */
export const workpapers: Workpaper[] = [
  {
    id: "wp-parkdental", engagementId: "en-parkdental",
    rows: [
      { line: "Gross receipts", amount: "$612,400", sourceDoc: "POS export 2025.csv", page: "p.2", runId: "run-recon-park" },
      { line: "Officer compensation", amount: "$145,000", sourceDoc: "Gusto W-2 summary", page: "p.1" },
      { line: "Depreciation", amount: "$42,100", sourceDoc: "Fixed-asset schedule", page: "p.3" },
      { line: "Meals (50% limited)", amount: "$4,210", sourceDoc: "May reconciliation", runId: "run-recon-park" },
    ],
  },
];

// ── Inbox threads ────────────────────────────────────────────
export type Channel = "email" | "sms" | "portal" | "call";
export type ThreadStatus = "open" | "snoozed" | "done";

export interface Message {
  from: "client" | "firm";
  author: string;
  text: string;
  time: string;
}

export interface Thread {
  id: string;
  householdId: string;
  clientName: string;
  channel: Channel;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
  status: ThreadStatus;
  /** set when the last message is the client's and the firm hasn't replied — drives the aging chip */
  waitingOnFirmSince?: string;
  messages: Message[];
  petalDraft?: { skillId: string; text: string };
  extraction?: { runId: string; summary: string; docId: string };
  petalCanAnswer?: { taskId: string; draft: string };
  transcript?: {
    /** phone or video — both ride the single "call" channel; the medium is a sub-label */
    medium?: "phone" | "video";
    durationMin?: number;
    summary: string;
    lines: { speaker: string; text: string }[];
    followUps: { label: string; taskId: string }[];
  };
}

export const threads: Thread[] = [
  {
    id: "th-chen", householdId: "h-chen", clientName: "Marcus Chen", channel: "email",
    subject: "Re: 2025 return — wages question", preview: "Yeah, the Riverside location closed in May. W-2 attached.",
    time: "Jun 23", unread: true, status: "open", waitingOnFirmSince: "Jun 23",
    extraction: {
      runId: "run-w2-chen",
      summary: "Petal extracted W-2 — Golden Dragon LLC → filed to Chen 2025 · 1 field needs review",
      docId: "doc-chen-w2",
    },
    messages: [
      { from: "firm", author: "Antonio Vazquez", text: "Hi Marcus — quick one before we go further on the 2025 return. Your wages came in about 40% lower than last year. Can you confirm the second restaurant location closed?", time: "Jun 22, 4:02 PM" },
      { from: "client", author: "Marcus Chen", text: "Yeah, the Riverside location closed in May. Slower year overall but the main spot is doing fine. W-2 attached so you have the clean copy.", time: "Jun 23, 9:14 AM" },
    ],
  },
  {
    id: "th-park-call", householdId: "h-park", clientName: "David Park", channel: "call",
    subject: "Park books review call", preview: "Transcribed · 2 follow-ups extracted",
    time: "Jun 24", unread: false, status: "open",
    transcript: {
      medium: "phone",
      durationMin: 9,
      summary: "David cleared the three uncategorized May transactions — the $2,800 sterilizer, the $910 team dinner after the office move, and the $500 annual software renewal — and confirmed he refinanced the house in February, which explains the tripled 1098 mortgage interest. He'll send the closing disclosure if needed.",
      lines: [
        { speaker: "Antonio", text: "Three May transactions need a category before we close: $2,800 on Dec— sorry, Jun 3, $910 on Jun 9, and $500 on Jun 18." },
        { speaker: "David", text: "The $2,800 was the new sterilizer. The $910 was the team dinner after the office move. The $500 is the annual practice-software renewal." },
        { speaker: "Antonio", text: "Got it. One more — the mortgage interest on your 1098 tripled. Did you refinance the house this year?" },
        { speaker: "David", text: "We did, in February. I'll send the closing disclosure if you need it." },
      ],
      followUps: [
        { label: "Post the 3 proposed categories", taskId: "t-park-books" },
        { label: "Confirm refinance → resolve the 1098 flag", taskId: "t-park-1098" },
      ],
    },
    messages: [],
  },
  {
    id: "th-obrien", householdId: "h-obrien", clientName: "Karen O'Brien", channel: "portal",
    subject: "Where's my refund?", preview: "Hi! Just checking when my refund might arrive.",
    time: "Jun 24", unread: true, status: "open", waitingOnFirmSince: "Jun 24",
    petalCanAnswer: {
      taskId: "t-obrien-refund",
      draft: "Hi Karen — great news: your return was accepted by the IRS on June 24, with a $610 refund on the way. Direct deposits usually land within 21 days of acceptance — so by mid-July at the latest. You can track it at irs.gov/refunds with your SSN and the exact amount ($610).",
    },
    messages: [
      { from: "client", author: "Karen O'Brien", text: "Hi! Just checking when my refund might arrive — anything I need to do on my end?", time: "Jun 24, 2:30 PM" },
    ],
  },
  {
    id: "th-sharma", householdId: "h-sharma", clientName: "Priya Sharma", channel: "portal",
    subject: "Missing documents for your return", preview: "Reminder drafted for the 4 outstanding items.",
    time: "Jun 23", unread: false, status: "open",
    petalDraft: { skillId: "sk-doc-chase", text: "Hi Priya! Quick check-in on your 2025 return — we're still missing: the brand-deal 1099-NEC, your 1099-K, the mileage log, and your home-office square footage. Upload to the portal or text photos, whatever's easiest!" },
    messages: [
      { from: "firm", author: "Elena Reyes", text: "Hi Priya! Welcome aboard. Whenever you get a chance, upload anything you have in the portal and we'll take it from there.", time: "Jun 16, 11:00 AM" },
    ],
  },
  {
    id: "th-fuentes", householdId: "h-fuentes", clientName: "Roberto Fuentes", channel: "email",
    subject: "1120S review — bonus depreciation question", preview: "Can we still take bonus depreciation on the two trucks?",
    time: "Jun 22", unread: false, status: "open", waitingOnFirmSince: "Jun 22",
    messages: [
      { from: "client", author: "Roberto Fuentes", text: "Before we sign — can we still take bonus depreciation on the two trucks we bought in 2025? Want to make sure before I do the e-sign thing.", time: "Jun 22, 3:40 PM" },
    ],
  },
  {
    id: "th-williams", householdId: "h-williams", clientName: "DeShawn Williams", channel: "sms",
    subject: "W-2 reminder", preview: "Got it, will upload tonight!",
    time: "Jun 12", unread: false, status: "open",
    messages: [
      { from: "firm", author: "Elena Reyes", text: "Hi DeShawn — friendly reminder we still need your W-2 from Hartline to start your return. You can text a photo right here or upload to the portal.", time: "Jun 12, 10:05 AM" },
      { from: "client", author: "DeShawn Williams", text: "Got it, will upload tonight!", time: "Jun 12, 6:12 PM" },
    ],
  },
  {
    id: "th-park-books", householdId: "h-park", clientName: "David Park", channel: "email",
    subject: "May books — 3 expenses to confirm", preview: "Sterilizer, team dinner, software renewal — details inside.",
    time: "Jun 24", unread: false, status: "done",
    messages: [
      { from: "firm", author: "Antonio Vazquez", text: "David — before we close May I have three transactions without a category: $2,800 (Jun 3), $910 (Jun 9), and $500 (Jun 18). What was each for?", time: "Jun 23, 2:10 PM" },
      { from: "client", author: "David Park", text: "Sure — $2,800 was the new sterilizer (equipment), $910 was the team dinner after the office move, and $500 is the annual software renewal.", time: "Jun 24, 9:40 AM" },
    ],
  },
  {
    id: "th-nakamura", householdId: "h-nakamura", clientName: "Linda Nakamura", channel: "email",
    subject: "Return accepted — thank you!", preview: "Saw the acceptance email — thanks for making this painless.",
    time: "Jun 24", unread: false, status: "done",
    messages: [
      { from: "client", author: "Linda Nakamura", text: "Saw the acceptance email come through — thank you both for making this painless, even with the extension!", time: "Jun 24, 5:02 PM" },
      { from: "firm", author: "Antonio Vazquez", text: "Glad to, Linda! One small follow-up coming your way — a corrected dividend form arrived, tiny amendment, nothing to worry about.", time: "Jun 24, 5:30 PM" },
    ],
  },
];

// ── Brief (Today) ────────────────────────────────────────────
// The brief is SITUATIONAL AWARENESS, not a task mirror: what an EA needs to KNOW
// (the tax world, the firm in aggregate) that never becomes a row in the queue.
// Grouped by "desk" like a newspaper. Most items are awareness-only (no action).
export type BriefTone = "urgent" | "alert" | "win" | "info";

/** Which desk a brief item is filed under — Today groups the newspaper by these. */
export type BriefDesk = "irs" | "firm" | "season" | "practice";
export const briefDeskMeta: Record<BriefDesk, { label: string }> = {
  irs:      { label: "IRS & regulatory" },
  firm:     { label: "Your firm" },
  season:   { label: "Season" },
  practice: { label: "Practice" },
};
export const BRIEF_DESK_ORDER: BriefDesk[] = ["irs", "firm", "season", "practice"];

export interface BriefItem {
  id: string;
  desk: BriefDesk;
  tone: BriefTone;
  source: string;     // sourced from — "IRS", "FinCEN", "Petal · Books"
  dateline: string;   // when it surfaced — "Jun 24"
  headline: string;
  detail: string;     // one-line summary (list view)
  body: string;       // the full briefing (modal)
  whyItMatters?: string; // firm-specific relevance (modal callout)
  action?: { label: string; href: string }; // optional soft action — awareness is the default
}

// dots share the Filing-readiness palette so Today reads as one system
export const briefToneDot: Record<BriefTone, string> = {
  urgent: "bg-red-500",
  alert: "bg-amber-500",     // at-risk amber
  win: "bg-emerald-500",     // filed emerald
  info: "bg-blue-500",       // on-track blue
};

export const brief: BriefItem[] = [
  // ── IRS & regulatory — the outside world Petal watches ──
  {
    id: "br-cp2000-season", desk: "irs", tone: "alert", source: "IRS", dateline: "Jun 24",
    headline: "IRS resumed automated CP2000 matching for tax year 2024",
    detail: "The Automated Underreporter program restarted after the spring pause — expect more notices through Q3.",
    body: "The IRS has restarted its Automated Underreporter (AUR) program for 2024 returns following the seasonal pause. AUR cross-matches filed returns against third-party 1099 and W-2 data and issues CP2000 notices where they disagree. Notice volume typically peaks June through September.",
    whyItMatters: "Petal is already watching 1099/W-2 mismatches across your clients. One CP2000 (Rodriguez) has landed and the response is drafted; others may follow as matching runs.",
    action: { label: "Open Notices", href: "/os/notices" },
  },
  {
    id: "br-inflation-2026", desk: "irs", tone: "info", source: "IRS", dateline: "Jun 20",
    headline: "2026 inflation adjustments released",
    detail: "Standard deduction $15,750 single / $31,500 MFJ, business mileage 70¢, 401(k) deferral cap $24,500.",
    body: "Rev. Proc. 2025-32 sets the 2026 inflation-adjusted figures: standard deduction of $15,750 (single) and $31,500 (married filing jointly), the business standard mileage rate at 70¢/mile, and the 401(k) elective deferral limit at $24,500 with a $8,000 catch-up at 50+.",
    whyItMatters: "These drive every Q3 planning conversation and your estimated-payment math. No filing action today — context for client calls.",
  },
  {
    id: "br-boi-reopen", desk: "irs", tone: "alert", source: "FinCEN", dateline: "Jun 18",
    headline: "FinCEN reopens Beneficial Ownership (BOI) reporting",
    detail: "Filing requirements are back in effect after the injunction lifted; new entities report within 30 days.",
    body: "With the nationwide injunction lifted, FinCEN's Beneficial Ownership Information reporting under the Corporate Transparency Act is again in effect. Existing reporting companies face updated deadlines; newly formed entities must file an initial BOI report within 30 days of formation.",
    whyItMatters: "11 of your clients are business entities that may have a BOI obligation — none are tracked in your queue yet. Worth a sweep.",
    action: { label: "Review business clients", href: "/os/clients" },
  },

  // ── Your firm — aggregate signals across the book ──
  {
    id: "br-books-behind", desk: "firm", tone: "alert", source: "Petal · Books", dateline: "this morning",
    headline: "May books close trending behind across your 3 books clients",
    detail: "62% reconciled with 6 days to your internal target — Park Family Dental is the long pole.",
    body: "Aggregating your three monthly-books engagements, the May close is 62% reconciled against a target of done-by-month-end-plus-20. Park Family Dental is the constraint: its POS export is in but two bank feeds are unreconciled. The other two are on pace.",
    whyItMatters: "A late May close compresses the June close and delays any Q2 advisory. The reconciliation tasks are already in your queue.",
    action: { label: "Open books tasks", href: "/os/tasks" },
  },
  {
    id: "br-intake-up", desk: "firm", tone: "win", source: "Petal · Intake", dateline: "this week",
    headline: "4 new portal inquiries this week — intake running ahead of last June",
    detail: "Two individuals, one S-corp, one partnership submitted inquiries through the client portal.",
    body: "Four prospective clients submitted inquiries through your portal this week — ahead of the same week last year. Mix: two individual 1040s, one S-corporation, and one partnership. Petal has triaged each and drafted intake responses for your review.",
    whyItMatters: "Healthy top-of-funnel, but the S-corp and partnership add complexity during extension season. Worth deciding capacity before you reply.",
    action: { label: "View clients", href: "/os/clients" },
  },

  // ── Season — firm-level calendar posture ──
  {
    id: "br-q3-estimates", desk: "season", tone: "info", source: "IRS", dateline: "Sep 15 deadline",
    headline: "Q3 estimated payments are the next firm-wide deadline",
    detail: "Vouchers compute Sep 1 for your 9 voucher clients; two Q2 stragglers still have follow-ups out.",
    body: "The next firm-wide deadline is the Q3 1040-ES due September 15. Petal will compute and draft vouchers for all nine of your voucher clients on September 1, leaving two weeks for review and client delivery. Two Q2 stragglers (Sandoval, Park) still have payment-confirmation follow-ups outstanding.",
    whyItMatters: "Nothing to do today — the work pre-stages itself. Flagged so the date is on your radar before it compresses against the close.",
  },

  // ── Practice — you, the business ──
  {
    id: "br-wisp-review", desk: "practice", tone: "alert", source: "Petal · Security", dateline: "Annual",
    headline: "Your WISP annual review is due",
    detail: "The Written Information Security Plan was last updated Jun 2025 — IRS Pub 4557 expects a yearly review.",
    body: "IRS Publication 4557 (Safeguarding Taxpayer Data) and the FTC Safeguards Rule both expect tax practices to review their Written Information Security Plan annually. Your WISP was last revised June 2025, so it's due. The current document is in your firm files.",
    whyItMatters: "A current WISP is a condition of your PTIN attestation and your professional liability coverage. A 10-minute review keeps you compliant.",
    action: { label: "Open in Documents", href: "/os/documents" },
  },
];

// ── Activity (the flight recorder; week of Jun 22–25) ────────
export interface ActivityEvent {
  id: string;
  /** sortable: dayIndex within the demo week (22..25), plus a display time */
  day: 22 | 23 | 24 | 25;
  at: string;
  kind: ActivityKind;
  label: string;
  actor: "Petal" | "Antonio Vazquez";
  householdId?: string;
  runId?: string;
}

let evSeq = 0;
function ev(day: 22 | 23 | 24 | 25, at: string, kind: ActivityKind, label: string, householdId?: string, runId?: string, actor: "Petal" | "Antonio Vazquez" = "Petal"): ActivityEvent {
  return { id: `ev-${++evSeq}`, day, at, kind, label, actor, householdId, runId };
}

export const activity: ActivityEvent[] = [
  // Monday Jun 22
  ev(22, "6:04 AM", "transcript_check", "Daily transcript sweep — 9 clients, no changes", undefined, undefined),
  ev(22, "8:40 AM", "notice_draft", "CP2000 response drafted — Rodriguez", "h-rodriguez", "run-cp2000"),
  ev(22, "9:00 AM", "draft", "Q2 estimate follow-ups drafted — Sandoval, Park Dental", "h-sandoval", "run-est-q2"),
  ev(22, "10:15 AM", "doc_collected", "POS export 2025.csv — Golden Dragon LLC", "h-chen"),
  ev(22, "11:30 AM", "doc_collected", "1099-B — Schwab (Russo)", "h-russo"),
  ev(22, "2:20 PM", "send", "Chase #2 sent — Golden Dragon documents (SMS, Chen cadence)", "h-chen"),
  ev(22, "4:45 PM", "approval", "Approved: May reconciliation — Park Family Dental", "h-park", "run-recon-park", "Antonio Vazquez"),
  // Tuesday Jun 23
  ev(23, "6:05 AM", "transcript_check", "Daily transcript sweep — 9 clients, no changes"),
  ev(23, "9:14 AM", "extraction", "W-2 — Golden Dragon LLC extracted · 1 field flagged", "h-chen", "run-w2-chen"),
  ev(23, "9:15 AM", "doc_collected", "W-2 — Golden Dragon LLC filed to Chen 2025", "h-chen", "run-w2-chen"),
  ev(23, "9:20 AM", "transcript_check", "Variance check — Chen wages vs prior year", "h-chen", "run-w2-chen"),
  ev(23, "10:20 AM", "notice_draft", "CP14 confirmation letter drafted — Russo", "h-russo", "run-cp14-russo"),
  ev(23, "10:40 AM", "approval", "Approved: CP14 letter — mailed", "h-russo", "run-cp14-russo", "Antonio Vazquez"),
  ev(23, "11:00 AM", "approval", "Approved: 3 returns for transmission", "h-nakamura", "run-efile-nak", "Antonio Vazquez"),
  ev(23, "11:05 AM", "efile", "E-filed: Nakamura 1040", "h-nakamura", "run-efile-nak"),
  ev(23, "11:06 AM", "efile", "E-filed: Nakamura Etsy Schedule C", "h-nakamura", "run-efile-etsy"),
  ev(23, "11:20 AM", "efile", "E-filed: O'Brien 1040", "h-obrien", "run-efile-obrien"),
  ev(23, "1:10 PM", "draft", "Chase #4 drafted — DeShawn W-2, call offer", "h-williams"),
  ev(23, "2:10 PM", "extraction", "1099-NEC — TikTok Inc extracted (Sharma)", "h-sharma", "run-extract-sharma"),
  ev(23, "2:11 PM", "doc_collected", "1099-NEC — TikTok Inc filed to Sharma 2025", "h-sharma"),
  ev(23, "3:30 PM", "send", "Signature reminder scheduled — Fuentes 8879", "h-fuentes"),
  ev(23, "4:00 PM", "draft", "W-9 requests drafted — 3 Park Dental contractors", "h-park"),
  // Wednesday Jun 24
  ev(24, "6:05 AM", "transcript_check", "Daily transcript sweep — 9 clients · 1 change", "h-rodriguez", "run-transcript-rod"),
  ev(24, "6:06 AM", "transcript_check", "Transcript change matched to CP2000 — Rodriguez", "h-rodriguez", "run-transcript-rod"),
  ev(24, "8:50 AM", "doc_collected", "Lease agreements (2 units) — Riverside Rental", "h-chen"),
  ev(24, "9:40 AM", "doc_collected", "Category confirmations — David Park email", "h-park"),
  ev(24, "10:00 AM", "extraction", "1098 — Wells Fargo extracted · 2 fields flagged", "h-park"),
  ev(24, "10:01 AM", "doc_collected", "1098 — Wells Fargo filed to Park 2025", "h-park"),
  ev(24, "11:00 AM", "brief", "Call transcribed: Park books review · 2 follow-ups extracted", "h-park"),
  ev(24, "11:45 AM", "doc_collected", "Corrected 1099-DIV — Vanguard (Nakamura)", "h-nakamura"),
  ev(24, "12:30 PM", "draft", "1040-X drafted — Nakamura corrected dividends", "h-nakamura"),
  ev(24, "2:00 PM", "send", "Chase #1 sent — Riverside Rental documents", "h-chen"),
  ev(24, "2:35 PM", "send", "Q2 follow-up scheduled — Park Dental voucher", "h-park"),
  ev(24, "4:10 PM", "draft", "Refund-status reply drafted — Karen O'Brien", "h-obrien"),
  ev(24, "5:00 PM", "send", "Acceptance confirmations sent — Nakamura, O'Brien", "h-nakamura"),
  // Thursday Jun 25 (today)
  ev(25, "6:05 AM", "transcript_check", "Daily transcript sweep — 9 clients, no changes"),
  ev(25, "7:10 AM", "send", "Mendez 1065 progress logged — K-1 allocation started", "h-mendez", "run-1065-mendez"),
  ev(25, "8:30 AM", "brief", "Pre-call brief started — Fuentes 1120S review (3:00 PM)", "h-fuentes", "run-brief-fuentes"),
  ev(25, "8:45 AM", "send", "Daily brief assembled", undefined),
  ev(25, "9:05 AM", "send", "Sharma reminder queued for approval", "h-sharma"),
  ev(25, "9:30 AM", "doc_collected", "Gusto payroll summary — Q2 (Park Dental)", "h-park"),
  ev(25, "10:00 AM", "send", "Fuentes nudge queued for approval", "h-fuentes"),
  ev(25, "10:30 AM", "send", "Extension-pace sweep logged — 5 business returns on track", undefined),
  ev(25, "11:30 AM", "send", "Russo basis request held for your decision", "h-russo"),
];

// ── Recent Petal chats (sidebar) — each artifact-producing chat links to its artifact ──
export interface RecentChat {
  id: string;
  title: string;
  when: string;
  unread?: boolean;
  artifact?: { label: string; href: string };
}

export const recentChats: RecentChat[] = [
  { id: "c-brief", title: "What needs me this morning?", when: "1h", unread: true },
  { id: "c-cp2000", title: "Draft CP2000 response — Rodriguez", when: "Jun 22", artifact: { label: "CP2000 — Rodriguez", href: "/os/notices/n-cp2000" } },
  { id: "c-recon", title: "Reconcile bank activity — Park Dental", when: "Jun 20", artifact: { label: "Books run — Park Family Dental", href: "/os/books" } },
  { id: "c-russo", title: "Russo capital gains — basis options", when: "Jun 22", artifact: { label: "Decision — 7 lots missing basis", href: "/os/tasks?task=t-russo-basis" } },
  { id: "c-chen", title: "Why did Marcus Chen's wages drop 40%?", when: "Jun 23", artifact: { label: "Chen Household", href: "/os/clients/h-chen" } },
  { id: "c-q2", title: "Who missed Q2 estimates?", when: "Jun 22", artifact: { label: "Q2 follow-ups", href: "/os/tasks?task=t-est-q2" } },
];

// ── Books-to-tax readiness (May 2026, books clients only) ────
export type BooksStatus = "not_started" | "in_progress" | "complete";

export interface BooksItem {
  id: string;
  title: string;
  status: BooksStatus;
  householdId: string;
  /** Petal can run it (reconciliation/categorization) vs. owner-only review */
  petalRunnable: boolean;
  runId?: string;
  due: string;
  group: "Reconciliation" | "Adjustments" | "Review";
}

export const booksMonth = "May 2026";

export const booksStatusMeta: Record<BooksStatus, { label: string; dot: string }> = {
  not_started: { label: "Not started", dot: "bg-[var(--os-border-strong)]" },
  in_progress: { label: "In progress", dot: "bg-amber-500" },
  complete: { label: "Complete", dot: "bg-emerald-500" },
};

export const BOOKS_ORDER: BooksStatus[] = ["not_started", "in_progress", "complete"];

export const booksItems: BooksItem[] = [
  { id: "bk-1", title: "Reconcile bank + card accounts", status: "complete", householdId: "h-park", petalRunnable: true, runId: "run-recon-park", due: "Jun 20", group: "Reconciliation" },
  { id: "bk-2", title: "Reconcile payroll to Gusto", status: "complete", householdId: "h-fuentes", petalRunnable: true, due: "Jun 20", group: "Reconciliation" },
  { id: "bk-3", title: "Categorize 3 flagged expenses", status: "in_progress", householdId: "h-park", petalRunnable: true, runId: "run-recon-park", due: "Jun 30", group: "Adjustments" },
  { id: "bk-4", title: "Post depreciation + amortization", status: "in_progress", householdId: "h-fuentes", petalRunnable: true, due: "Jun 30", group: "Adjustments" },
  { id: "bk-5", title: "Update prepaid insurance schedule", status: "in_progress", householdId: "h-sandoval", petalRunnable: true, due: "Jun 30", group: "Adjustments" },
  { id: "bk-6", title: "Review AP aging + accruals", status: "not_started", householdId: "h-sandoval", petalRunnable: false, due: "Jun 30", group: "Review" },
  { id: "bk-7", title: "Owner sign-off — books-to-tax tie", status: "not_started", householdId: "h-park", petalRunnable: false, due: "Jun 30", group: "Review" },
];

// ── Lookups ──────────────────────────────────────────────────
export const householdById = (id: string) => households.find(h => h.id === id);
export const entityById = (id: string) => entities.find(e => e.id === id);
export const engagementById = (id: string) => engagements.find(e => e.id === id);
export const skillById = (id: string) => skills.find(s => s.id === id);
export const runById = (id: string) => skillRuns.find(r => r.id === id);
export const taskById = (id: string) => tasks.find(t => t.id === id);
export const noticeById = (id: string) => notices.find(n => n.id === id);
export const entitiesOf = (hid: string) => entities.filter(e => e.householdId === hid);
export const engagementsOf = (hid: string) => engagements.filter(e => e.householdId === hid);
export const peopleOf = (hid: string) => people.filter(p => p.householdId === hid);
export const tasksOf = (hid: string) => tasks.filter(t => t.householdId === hid);
export const threadsOf = (hid: string) => threads.filter(t => t.householdId === hid);
export const noticesOf = (hid: string) => notices.filter(n => n.householdId === hid);
export const positionsOf = (hid: string) => positions.filter(p => p.householdId === hid);
export const docsOfEngagement = (eid: string) => expectedDocs.filter(d => d.engagementId === eid);
export const workpaperOf = (eid: string) => workpapers.find(w => w.engagementId === eid);

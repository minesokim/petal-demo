// Petal OS — the real object model: Household (Client) → Entity → Return, plus People.
// This is the agentic-os system of record. Legacy lib/mock-data.ts is left untouched for /dashboard.
//
// Cardinality is intentionally honest:
//   Households (Clients)  10  — the relationship/billing/memory hub
//   Entities              18  — each thing that FILES (1040 household, S-corp, rental LLC…)
//   Returns               18  — Entity × tax year (the unit of work agents draft & Tasks review)
//   People                16  — humans; more than households (spouses, partners, bookkeepers)

import { stageLabels, stageDotStyles, type ReturnStage } from "@/lib/mock-data";
export { stageLabels, stageDotStyles, type ReturnStage };

export type HouseholdKind = "individual" | "business" | "mixed";
export type Urgency = "urgent" | "high" | "normal" | "low";
export type PersonRole = "Taxpayer" | "Spouse" | "Owner" | "Partner" | "Bookkeeper" | "POA";

export interface Person {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: PersonRole;
  householdId: string;
  householdName: string;
}

export interface Entity {
  id: string;
  householdId: string;
  name: string;
  /** plain-language entity type, e.g. "S-Corp", "Individual (MFJ)", "Rental LLC" */
  type: string;
  form: string; // "1040", "1120S", "1065", "Sch C", "Sch E"
  ein?: string;
}

export interface Return {
  id: string;
  entityId: string;
  entityName: string;
  householdId: string;
  householdName: string;
  form: string;
  year: number;
  stage: ReturnStage;
  fee: number;
  depositPaid: boolean;
  docsSubmitted: number;
  docsRequired: number;
  assignedTo: string;
  urgency: Urgency;
}

export interface Household {
  id: string;
  name: string;
  kind: HouseholdKind;
  serviceTier: "Basic" | "Standard" | "Premium";
  assignedTo: string;
  healthUrgency: Urgency;
  since: number;
  catchUp: string;
}

export const OWNERS: Record<string, string> = {
  "u-antonio": "Antonio Vazquez",
  "u-elena": "Elena Reyes",
  "u-marcus": "Marcus Lee",
  "u-james": "James Okafor",
  "u-maria": "Maria Santos",
};

// ── Households ───────────────────────────────────────────────
export const households: Household[] = [
  { id: "h-chen", name: "Chen Household", kind: "mixed", serviceTier: "Premium", assignedTo: "u-antonio", healthUrgency: "normal", since: 2021, catchUp: "5-year client. Marcus runs Golden Dragon LLC (restaurant) plus a rental LLC; files jointly with Lin. Now in preparation — wages dropped 40% after the second location closed (needs verbal confirm). Premium, deposit paid." },
  { id: "h-priya", name: "Priya Sharma", kind: "mixed", serviceTier: "Standard", assignedTo: "u-elena", healthUrgency: "high", since: 2025, catchUp: "First-year client. TikTok creator with multiple 1099-NECs — her content work files on a Schedule C alongside her 1040. Still collecting 4 documents." },
  { id: "h-rodriguez", name: "Rodriguez Family", kind: "individual", serviceTier: "Premium", assignedTo: "u-antonio", healthUrgency: "normal", since: 2023, catchUp: "MFJ couple with a rental property. 2 dependents. Return drafted and out for signature." },
  { id: "h-deshawn", name: "DeShawn Williams", kind: "individual", serviceTier: "Basic", assignedTo: "u-james", healthUrgency: "urgent", since: 2026, catchUp: "New client, head of household with 2 kids. Hasn't uploaded his W-2 yet — at risk on the deadline." },
  { id: "h-park", name: "Park Family Dental", kind: "business", serviceTier: "Premium", assignedTo: "u-antonio", healthUrgency: "high", since: 2020, catchUp: "Dental practice S-Corp with payroll, plus David & Grace's personal return. Books close in progress; 3 uncategorized expenses to confirm." },
  { id: "h-linda", name: "Linda Nakamura", kind: "mixed", serviceTier: "Standard", assignedTo: "u-james", healthUrgency: "low", since: 2022, catchUp: "W-2 employee plus a small Etsy shop on Schedule C. Both returns filed and accepted." },
  { id: "h-fuentes", name: "Fuentes Transport", kind: "business", serviceTier: "Premium", assignedTo: "u-antonio", healthUrgency: "normal", since: 2022, catchUp: "Trucking company (S-Corp) with complex depreciation, plus Roberto & Maria's 1040. Both in client review." },
  { id: "h-sandoval", name: "Sandoval Plumbing", kind: "mixed", serviceTier: "Premium", assignedTo: "u-antonio", healthUrgency: "normal", since: 2023, catchUp: "Miguel's plumbing business runs as a sole prop on his 1040 Schedule C. Considering incorporating next year. Ready to prep." },
  { id: "h-karen", name: "Karen O'Brien", kind: "individual", serviceTier: "Basic", assignedTo: "u-james", healthUrgency: "low", since: 2024, catchUp: "Simple W-2 return. Filed and accepted. Returning client." },
  { id: "h-mendez", name: "Mendez Auto", kind: "business", serviceTier: "Premium", assignedTo: "u-antonio", healthUrgency: "normal", since: 2021, catchUp: "Auto repair shop structured as a partnership (1065), plus Carlos & Elena's joint 1040 with 4 dependents. In preparation." },
];

// ── People ───────────────────────────────────────────────────
export const people: Person[] = [
  { id: "p-marcus", name: "Marcus Chen", email: "marcus.chen@gmail.com", phone: "(951) 555-0142", role: "Taxpayer", householdId: "h-chen", householdName: "Chen Household" },
  { id: "p-lin", name: "Lin Chen", email: "lin.chen@gmail.com", phone: "(951) 555-0143", role: "Spouse", householdId: "h-chen", householdName: "Chen Household" },
  { id: "p-priya", name: "Priya Sharma", email: "priya.sharma@outlook.com", phone: "(951) 555-0198", role: "Taxpayer", householdId: "h-priya", householdName: "Priya Sharma" },
  { id: "p-james-r", name: "James Rodriguez", email: "jrodriguez@yahoo.com", phone: "(909) 555-0176", role: "Taxpayer", householdId: "h-rodriguez", householdName: "Rodriguez Family" },
  { id: "p-sofia", name: "Sofia Rodriguez", email: "sofia.r@yahoo.com", phone: "(909) 555-0177", role: "Spouse", householdId: "h-rodriguez", householdName: "Rodriguez Family" },
  { id: "p-deshawn", name: "DeShawn Williams", email: "deshawn.w@gmail.com", phone: "(951) 555-0134", role: "Taxpayer", householdId: "h-deshawn", householdName: "DeShawn Williams" },
  { id: "p-david", name: "David Park", email: "dpark@parkdental.com", phone: "(714) 555-0123", role: "Owner", householdId: "h-park", householdName: "Park Family Dental" },
  { id: "p-grace", name: "Grace Park", email: "grace.park@gmail.com", phone: "(714) 555-0124", role: "Spouse", householdId: "h-park", householdName: "Park Family Dental" },
  { id: "p-tina", name: "Tina Alvarez", email: "tina@parkdental.com", phone: "(714) 555-0125", role: "Bookkeeper", householdId: "h-park", householdName: "Park Family Dental" },
  { id: "p-linda", name: "Linda Nakamura", email: "linda.n@proton.me", phone: "(626) 555-0155", role: "Taxpayer", householdId: "h-linda", householdName: "Linda Nakamura" },
  { id: "p-roberto", name: "Roberto Fuentes", email: "roberto@fuentestrucking.com", phone: "(909) 555-0188", role: "Owner", householdId: "h-fuentes", householdName: "Fuentes Transport" },
  { id: "p-mariaf", name: "Maria Fuentes", email: "maria.f@fuentestrucking.com", phone: "(909) 555-0189", role: "Spouse", householdId: "h-fuentes", householdName: "Fuentes Transport" },
  { id: "p-miguel", name: "Miguel Sandoval", email: "miguel@sandovalplumbing.com", phone: "(909) 555-0199", role: "Owner", householdId: "h-sandoval", householdName: "Sandoval Plumbing" },
  { id: "p-karen", name: "Karen O'Brien", email: "kobrien@hotmail.com", phone: "(626) 555-0178", role: "Taxpayer", householdId: "h-karen", householdName: "Karen O'Brien" },
  { id: "p-carlos", name: "Carlos Mendez", email: "cmendez@mendezauto.com", phone: "(951) 555-0177", role: "Partner", householdId: "h-mendez", householdName: "Mendez Auto" },
  { id: "p-elenam", name: "Elena Mendez", email: "elena.m@mendezauto.com", phone: "(951) 555-0178", role: "Partner", householdId: "h-mendez", householdName: "Mendez Auto" },
];

// ── Entities ─────────────────────────────────────────────────
export const entities: Entity[] = [
  { id: "e-chen-1040", householdId: "h-chen", name: "Marcus & Lin Chen", type: "Individual (MFJ)", form: "1040" },
  { id: "e-golden", householdId: "h-chen", name: "Golden Dragon LLC", type: "S-Corp", form: "1120S", ein: "84-1924011" },
  { id: "e-riverside", householdId: "h-chen", name: "Riverside Rental LLC", type: "Rental Partnership", form: "1065", ein: "88-3310042" },
  { id: "e-priya-1040", householdId: "h-priya", name: "Priya Sharma", type: "Individual", form: "1040" },
  { id: "e-priya-c", householdId: "h-priya", name: "Priya Creative", type: "Sole Prop", form: "Sch C" },
  { id: "e-rod-1040", householdId: "h-rodriguez", name: "James & Sofia Rodriguez", type: "Individual (MFJ)", form: "1040" },
  { id: "e-rod-rental", householdId: "h-rodriguez", name: "Rodriguez Rental", type: "Rental", form: "Sch E" },
  { id: "e-deshawn", householdId: "h-deshawn", name: "DeShawn Williams", type: "Individual (HoH)", form: "1040" },
  { id: "e-parkdental", householdId: "h-park", name: "Park Family Dental", type: "S-Corp", form: "1120S", ein: "47-2210983" },
  { id: "e-park-1040", householdId: "h-park", name: "David & Grace Park", type: "Individual (MFJ)", form: "1040" },
  { id: "e-linda-1040", householdId: "h-linda", name: "Linda Nakamura", type: "Individual", form: "1040" },
  { id: "e-linda-etsy", householdId: "h-linda", name: "Linda's Etsy Shop", type: "Sole Prop", form: "Sch C" },
  { id: "e-fuentes-s", householdId: "h-fuentes", name: "Fuentes Transport Inc", type: "S-Corp", form: "1120S", ein: "82-7741200" },
  { id: "e-fuentes-1040", householdId: "h-fuentes", name: "Roberto & Maria Fuentes", type: "Individual (MFJ)", form: "1040" },
  { id: "e-sandoval", householdId: "h-sandoval", name: "Miguel Sandoval", type: "Individual + Sch C", form: "1040" },
  { id: "e-karen", householdId: "h-karen", name: "Karen O'Brien", type: "Individual", form: "1040" },
  { id: "e-mendez-p", householdId: "h-mendez", name: "Mendez Auto Repair", type: "Partnership", form: "1065", ein: "83-5520117" },
  { id: "e-mendez-1040", householdId: "h-mendez", name: "Carlos & Elena Mendez", type: "Individual (MFJ)", form: "1040" },
];

// ── Returns (Entity × 2024) ──────────────────────────────────
function mkReturn(
  id: string, entityId: string, stage: ReturnStage, fee: number, depositPaid: boolean,
  docsSubmitted: number, docsRequired: number, urgency: Urgency,
): Return {
  const e = entities.find(x => x.id === entityId)!;
  const h = households.find(x => x.id === e.householdId)!;
  return { id, entityId, entityName: e.name, householdId: h.id, householdName: h.name, form: e.form, year: 2025, stage, fee, depositPaid, docsSubmitted, docsRequired, assignedTo: h.assignedTo, urgency };
}

export const returns: Return[] = [
  mkReturn("r-chen-1040", "e-chen-1040", "in_preparation", 500, true, 12, 12, "normal"),
  mkReturn("r-golden", "e-golden", "in_preparation", 900, true, 18, 20, "high"),
  mkReturn("r-riverside", "e-riverside", "collecting_docs", 600, true, 5, 9, "normal"),
  mkReturn("r-priya-1040", "e-priya-1040", "collecting_docs", 350, true, 3, 7, "high"),
  mkReturn("r-priya-c", "e-priya-c", "collecting_docs", 250, true, 2, 5, "high"),
  mkReturn("r-rod-1040", "e-rod-1040", "pay_and_sign", 500, true, 13, 13, "normal"),
  mkReturn("r-rod-rental", "e-rod-rental", "client_review", 250, true, 4, 4, "normal"),
  mkReturn("r-deshawn", "e-deshawn", "collecting_docs", 150, false, 1, 6, "urgent"),
  mkReturn("r-parkdental", "e-parkdental", "in_preparation", 1400, true, 18, 20, "high"),
  mkReturn("r-park-1040", "e-park-1040", "ready_to_prep", 500, true, 14, 14, "normal"),
  mkReturn("r-linda-1040", "e-linda-1040", "filed", 350, true, 7, 7, "low"),
  mkReturn("r-linda-etsy", "e-linda-etsy", "filed", 200, true, 4, 4, "low"),
  mkReturn("r-fuentes-s", "e-fuentes-s", "client_review", 1200, true, 15, 15, "normal"),
  mkReturn("r-fuentes-1040", "e-fuentes-1040", "client_review", 500, true, 11, 11, "normal"),
  mkReturn("r-sandoval", "e-sandoval", "ready_to_prep", 600, true, 9, 9, "normal"),
  mkReturn("r-karen", "e-karen", "filed", 150, true, 4, 4, "low"),
  mkReturn("r-mendez-p", "e-mendez-p", "in_preparation", 1100, true, 13, 14, "normal"),
  mkReturn("r-mendez-1040", "e-mendez-1040", "ready_to_prep", 500, true, 9, 9, "normal"),
];

// ── Accessors / rollups ──────────────────────────────────────
export const entitiesOf = (hid: string) => entities.filter(e => e.householdId === hid);
export const returnsOf = (hid: string) => returns.filter(r => r.householdId === hid);
export const returnsOfEntity = (eid: string) => returns.filter(r => r.entityId === eid);
export const peopleOf = (hid: string) => people.filter(p => p.householdId === hid);
export const householdFee = (hid: string) => returnsOf(hid).reduce((s, r) => s + r.fee, 0);

const STAGE_ORDER: ReturnStage[] = ["new_intake", "collecting_docs", "ready_to_prep", "in_preparation", "client_review", "pay_and_sign", "filed", "extended"];

/** Representative stage for a household: the least-progressed active return. */
export function householdStage(hid: string): ReturnStage {
  const rs = returnsOf(hid);
  if (rs.length === 0) return "new_intake";
  return rs.reduce((min, r) => (STAGE_ORDER.indexOf(r.stage) < STAGE_ORDER.indexOf(min) ? r.stage : min), rs[0].stage);
}

export function healthMeta(u: Urgency) {
  if (u === "urgent") return { label: "At risk", dot: "bg-red-500", text: "text-[var(--os-danger)]" };
  if (u === "high") return { label: "Watch", dot: "bg-amber-500", text: "text-[var(--os-warning)]" };
  return { label: "Healthy", dot: "bg-emerald-500", text: "text-[var(--os-success)]" };
}

export const kindLabel: Record<HouseholdKind, string> = { individual: "Individual", business: "Business", mixed: "Hybrid" };

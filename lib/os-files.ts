// Petal OS — firm-wide Documents. The document inbox + OCR extraction-review queue.
// Petal parses every incoming doc; extractions land in "Needs review" until a human confirms
// (the quarantine-before-promotion rule). Outstanding = what Doc Chase is still chasing.

export type DocStatus = "needs_review" | "received" | "requested";

export const docStatusMeta: Record<DocStatus, { label: string; dot: string; accent: string }> = {
  needs_review: { label: "Needs review", dot: "bg-amber-500", accent: "text-[var(--os-warning)]" },
  received: { label: "Extracted", dot: "bg-emerald-500", accent: "text-[var(--os-success)]" },
  requested: { label: "Requested", dot: "bg-[var(--os-ink-subtle)]", accent: "text-[var(--os-ink-muted)]" },
};

export const DOC_STATUS_ORDER: DocStatus[] = ["needs_review", "received", "requested"];

export interface ExtractedField {
  label: string;
  value: string;
  flag?: boolean;
}

export interface OsDoc {
  id: string;
  name: string;
  type: string;
  clientName: string;
  householdId: string;
  context: string;
  status: DocStatus;
  source: "Portal" | "Email" | "Upload";
  when: string;
  note?: string;
  fields?: ExtractedField[];
}

export const docs: OsDoc[] = [
  // ── Needs review (Petal extracted; flagged for a human) ──
  {
    id: "d-russo-1099b", name: "1099-B Schwab.pdf", type: "1099-B", clientName: "Anthony Russo", householdId: "h-fuentes",
    context: "Capital gains", status: "needs_review", source: "Email", when: "Yesterday",
    note: "7 of 23 lots are missing cost basis — Petal stopped rather than overstate the gain.",
    fields: [
      { label: "Proceeds (total)", value: "$214,900" },
      { label: "Short-term gain (16 lots)", value: "$8,420" },
      { label: "Cost basis — 7 lots", value: "Not reported", flag: true },
      { label: "Wash sales", value: "None detected" },
    ],
  },
  {
    id: "d-chen-w2", name: "W-2 2025.pdf", type: "W-2", clientName: "Marcus Chen", householdId: "h-chen",
    context: "Golden Dragon LLC", status: "needs_review", source: "Portal", when: "2h ago",
    note: "Wages dropped 40% vs 2024 — flagged for verbal confirmation before filing.",
    fields: [
      { label: "Box 1 — Wages", value: "$58,000", flag: true },
      { label: "Box 2 — Federal w/h", value: "$6,240" },
      { label: "Employer", value: "Golden Dragon LLC" },
      { label: "EIN", value: "84-1924011" },
    ],
  },
  {
    id: "d-park-1098", name: "1098 2025.pdf", type: "1098", clientName: "David Park", householdId: "h-park",
    context: "Mortgage interest", status: "needs_review", source: "Email", when: "3h ago",
    note: "Mortgage interest tripled vs 2024 — likely a refinance; verify the acquisition-debt cap.",
    fields: [
      { label: "Mortgage interest", value: "$31,400", flag: true },
      { label: "Prior year", value: "$9,800" },
      { label: "Lender", value: "Wells Fargo Home Mtg" },
    ],
  },
  {
    id: "d-linda-div", name: "1099-DIV corrected.pdf", type: "1099-DIV", clientName: "Linda Nakamura", householdId: "h-linda",
    context: "Amended return", status: "needs_review", source: "Email", when: "Yesterday",
    note: "Arrived after the return was filed — Petal drafted a 1040-X.",
    fields: [
      { label: "Ordinary dividends", value: "$420", flag: true },
      { label: "Qualified dividends", value: "$390" },
      { label: "Payer", value: "Vanguard" },
    ],
  },

  // ── Received (extracted cleanly) ──
  { id: "d-rod-w2", name: "W-2 2025.pdf", type: "W-2", clientName: "Rodriguez Family", householdId: "h-rodriguez", context: "1040", status: "received", source: "Portal", when: "2d ago", fields: [{ label: "Box 1 — Wages", value: "$96,400" }, { label: "Box 2 — Federal w/h", value: "$14,100" }] },
  { id: "d-priya-nec", name: "1099-NEC TikTok.pdf", type: "1099-NEC", clientName: "Priya Sharma", householdId: "h-priya", context: "Priya Creative", status: "received", source: "Portal", when: "Yesterday", fields: [{ label: "Box 1 — Nonemployee comp", value: "$18,200" }, { label: "Payer", value: "TikTok Inc" }] },
  { id: "d-park-chase", name: "Chase_Q4.csv", type: "Bank statement", clientName: "David Park", householdId: "h-park", context: "Park Family Dental", status: "received", source: "Upload", when: "4h ago", fields: [{ label: "Transactions", value: "145" }, { label: "Auto-matched", value: "142 (98%)" }] },
  { id: "d-park-gusto", name: "Gusto_payroll.pdf", type: "Payroll", clientName: "David Park", householdId: "h-park", context: "Park Family Dental", status: "received", source: "Upload", when: "4h ago", fields: [{ label: "Q4 wages", value: "$84,300" }, { label: "Employees", value: "6" }] },
  { id: "d-rod-8879", name: "8879 signed.pdf", type: "8879", clientName: "Rodriguez Family", householdId: "h-rodriguez", context: "E-file authorization", status: "received", source: "Portal", when: "2d ago", fields: [{ label: "Signature", value: "Collected" }, { label: "Signed", value: "James & Sofia Rodriguez" }] },
  { id: "d-chen-prior", name: "2024 Return.pdf", type: "Prior-year return", clientName: "Marcus Chen", householdId: "h-chen", context: "1040", status: "received", source: "Upload", when: "1w ago", fields: [{ label: "2024 AGI", value: "$238,400" }, { label: "2024 refund", value: "$1,200" }] },

  // ── Requested (outstanding — Doc Chase is on it) ──
  { id: "d-deshawn-w2", name: "W-2", type: "W-2", clientName: "DeShawn Williams", householdId: "h-deshawn", context: "1040", status: "requested", source: "Portal", when: "Due Apr 15", note: "Doc Chase drafted a reminder — awaiting your approval to send." },
  { id: "d-priya-mileage", name: "Mileage log", type: "Mileage log", clientName: "Priya Sharma", householdId: "h-priya", context: "Priya Creative", status: "requested", source: "Portal", when: "Requested", note: "Part of the 4 outstanding for Priya's Schedule C." },
  { id: "d-priya-ho", name: "Home-office square footage", type: "Home office", clientName: "Priya Sharma", householdId: "h-priya", context: "Priya Creative", status: "requested", source: "Portal", when: "Requested", note: "Needed for the home-office deduction." },
  { id: "d-mendez-k1", name: "K-1 (partnership)", type: "K-1", clientName: "Carlos & Elena Mendez", householdId: "h-mendez", context: "Mendez Auto 1065", status: "requested", source: "Upload", when: "3d ago", note: "Can't finalize the 1040 until the partnership issues the K-1." },
];

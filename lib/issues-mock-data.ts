// ============================================================
// DOCKET ISSUES — Per-client open items
// ============================================================

export interface ClientIssue {
  id: string;
  clientId: string;
  title: string;
  description: string;
  source: "ai" | "manual";
  status: "open" | "resolved";
  createdAt: string;
  resolvedAt?: string;
  resolvedNote?: string;
  sourceDocumentId?: string;
  aiReason?: string;
}

// ============================================================
// MOCK ISSUES
// ============================================================

export const clientIssues: ClientIssue[] = [
  // Marcus Chen (c1) — In Preparation
  {
    id: "iss-101",
    clientId: "c1",
    title: "Wage decrease needs confirmation",
    description: "W-2 wages dropped 40% from prior year ($96K → $58K). Consistent with reported Pasadena location closure but needs verbal confirmation.",
    source: "ai",
    status: "open",
    createdAt: "2026-03-24T10:03:00",
    sourceDocumentId: "d101",
    aiReason: "Significant year-over-year variance detected in W-2 Box 1. Flagged for preparer review per compliance policy.",
  },
  {
    id: "iss-102",
    clientId: "c1",
    title: "New consulting income — Schedule C needed?",
    description: "1099-NEC for $12,000 from Restaurant Consulting Group. Not present in prior year. May require new Schedule C.",
    source: "ai",
    status: "open",
    createdAt: "2026-03-24T10:07:00",
    sourceDocumentId: "d102",
    aiReason: "New 1099-NEC income not present in prior year return. If this is ongoing self-employment, Schedule C and SE tax apply.",
  },
  {
    id: "iss-103",
    clientId: "c1",
    title: "Confirm Riverside closeout equipment classification",
    description: "Equipment disposal loss of $23K — need to verify book value vs fully depreciated for proper classification.",
    source: "manual",
    status: "open",
    createdAt: "2026-03-28T09:00:00",
  },
  {
    id: "iss-104",
    clientId: "c1",
    title: "Review call with Marcus",
    description: "Schedule and complete review call to go over all three restaurant P&Ls before filing.",
    source: "manual",
    status: "open",
    createdAt: "2026-03-27T14:00:00",
  },

  // Priya Sharma (c2) — Collecting Docs
  {
    id: "iss-201",
    clientId: "c2",
    title: "1099-NEC photo quality may cause OCR issues",
    description: "TikTok 1099-NEC was uploaded as a phone photo. Some fields may be unclear. Consider requesting PDF directly from TikTok.",
    source: "ai",
    status: "open",
    createdAt: "2026-03-27T14:32:00",
    sourceDocumentId: "d201",
    aiReason: "Document quality check: phone photo with compression artifacts. OCR confidence on some fields is below 90%.",
  },
  {
    id: "iss-202",
    clientId: "c2",
    title: "Missing 1099-NEC from brand partnerships",
    description: "Priya mentioned brand deals on TikTok and Instagram. No 1099-NEC received from these platforms yet.",
    source: "manual",
    status: "open",
    createdAt: "2026-03-25T10:00:00",
  },
  {
    id: "iss-203",
    clientId: "c2",
    title: "Unreported $500 sponsored post income",
    description: "Priya mentioned a one-time $500 sponsored post. Will not have a 1099 but needs to be reported on Schedule C.",
    source: "manual",
    status: "open",
    createdAt: "2026-03-27T15:15:00",
  },

  // James & Sofia Rodriguez (c3) — Pay & Sign (mostly resolved)
  {
    id: "iss-301",
    clientId: "c3",
    title: "W-2 Box 1 / Box 5 mismatch — James",
    description: "Box 1 wages ($72,400) differ from Box 5 Medicare wages ($73,100) by $700. Likely pre-tax deduction. Confirmed correct.",
    source: "ai",
    status: "resolved",
    createdAt: "2026-03-15T10:02:00",
    resolvedAt: "2026-03-15T14:00:00",
    resolvedNote: "Normal — $700 difference is Section 125 cafeteria plan. Verified with employer.",
    sourceDocumentId: "d302",
  },
  {
    id: "iss-302",
    clientId: "c3",
    title: "Verify rental property depreciation basis",
    description: "Rental income $24K/yr from Palm Ave property. Verify depreciation basis and placed-in-service date for Schedule E.",
    source: "manual",
    status: "resolved",
    createdAt: "2026-03-17T10:00:00",
    resolvedAt: "2026-03-22T08:00:00",
    resolvedNote: "Basis confirmed: $280K purchase in 2019, straight-line 27.5yr.",
  },
  {
    id: "iss-303",
    clientId: "c3",
    title: "Both spouses need to sign 8879",
    description: "MFJ return — both James and Sofia must sign Form 8879 before e-filing.",
    source: "system" as "ai",
    status: "open",
    createdAt: "2026-03-27T08:00:00",
  },

  // DeShawn Williams (c4) — Urgent, stale
  {
    id: "iss-401",
    clientId: "c4",
    title: "Missing W-2 — critical",
    description: "No W-2 submitted. Cannot begin preparation without employment income data.",
    source: "ai",
    status: "open",
    createdAt: "2026-03-28T08:00:00",
    aiReason: "Required document missing. Client has submitted 1 of 6 documents. Filing deadline approaching.",
  },
  {
    id: "iss-402",
    clientId: "c4",
    title: "Deposit not received",
    description: "$150 deposit required to begin preparation. Multiple reminders sent.",
    source: "manual",
    status: "open",
    createdAt: "2026-03-22T10:00:00",
  },
  {
    id: "iss-403",
    clientId: "c4",
    title: "Extension filing may be needed",
    description: "At current pace, client will not have all documents by April 10. Recommend discussing extension by April 5.",
    source: "ai",
    status: "open",
    createdAt: "2026-03-28T08:00:00",
    aiReason: "Based on document submission rate and remaining items, there is a 85% probability that an extension will be needed.",
  },

  // David Park (c11) — S-Corp
  {
    id: "iss-1101",
    clientId: "c11",
    title: "Missing payroll summary from ADP",
    description: "Formal W-3 / payroll summary from ADP not yet received. David said it would come next week.",
    source: "manual",
    status: "open",
    createdAt: "2026-03-26T09:30:00",
  },
  {
    id: "iss-1102",
    clientId: "c11",
    title: "Equipment depreciation schedule needed",
    description: "P&L has a depreciation line but no detail schedule. David will request from his accountant.",
    source: "manual",
    status: "open",
    createdAt: "2026-03-27T15:00:00",
  },
  {
    id: "iss-1103",
    clientId: "c11",
    title: "Verify Section 179 eligibility for dental chair",
    description: "New dental chair purchased for $45,000. Need to confirm placed-in-service date and verify Section 179 election is optimal vs MACRS.",
    source: "ai",
    status: "open",
    createdAt: "2026-03-27T15:05:00",
    aiReason: "Large equipment purchase detected. Section 179 immediate expensing appears beneficial but MACRS comparison should be reviewed for tax planning purposes.",
  },
];

// ============================================================
// HELPERS
// ============================================================

export function getClientIssues(clientId: string): ClientIssue[] {
  return clientIssues.filter((i) => i.clientId === clientId);
}

export function getOpenIssues(clientId: string): ClientIssue[] {
  return getClientIssues(clientId).filter((i) => i.status === "open");
}

export function getResolvedIssues(clientId: string): ClientIssue[] {
  return getClientIssues(clientId).filter((i) => i.status === "resolved");
}

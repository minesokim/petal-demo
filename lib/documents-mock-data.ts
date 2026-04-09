// ============================================================
// DOCKET DOCUMENTS - Mock data for Documents system
// ============================================================

import { clients } from "./mock-data";

// ============================================================
// TYPES
// ============================================================

export interface MockDocument {
  id: string;
  clientId: string;
  clientName: string;
  clientAvatar: string;
  fileName: string;
  originalFileName: string;
  fileSize: string;
  docType: string;
  docTypeLabel: string; // Display abbreviation: W2, 1099, ID, RET, AGR, EXP, K1
  docCategory: "income" | "business" | "identity" | "deductions" | "returns" | "agreements";
  uploadedBy: "client" | "preparer";
  viewedByPreparer: boolean;
  uploadedAt: string;
  checklistItemId?: string;
  status?: "signed" | "ready_for_review";
}

export interface ChecklistItem {
  id: string;
  clientId: string;
  label: string;
  docType: string;
  category: "income" | "business" | "identity" | "deductions" | "returns" | "agreements";
  required: boolean;
  received: boolean;
  receivedAt?: string;
  documentId?: string;
  matchedFileName?: string;
  requestedAt: string;
  daysSinceRequested: number;
}

export interface FirmDocument {
  id: string;
  name: string;
  type: string;
  icon: string;
  lastEdited: string;
  description: string;
}

export interface ClientNote {
  id: string;
  clientId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// DOCUMENTS
// ============================================================

export const mockDocuments: MockDocument[] = [
  // Marcus Chen (c1) - Restaurant owner
  { id: "d101", clientId: "c1", clientName: "Marcus Chen", clientAvatar: "/images/avatars/01.png", fileName: "W-2_Golden_Dragon_LLC.pdf", originalFileName: "IMG_4521.jpg", fileSize: "245 KB", docType: "w2", docTypeLabel: "W2", docCategory: "income", uploadedBy: "client", viewedByPreparer: true, uploadedAt: "2026-03-24T10:00:00" },
  { id: "d102", clientId: "c1", clientName: "Marcus Chen", clientAvatar: "/images/avatars/01.png", fileName: "1099-NEC_Consulting.pdf", originalFileName: "1099_consulting.pdf", fileSize: "89 KB", docType: "1099_nec", docTypeLabel: "1099", docCategory: "income", uploadedBy: "client", viewedByPreparer: true, uploadedAt: "2026-03-24T10:05:00" },
  { id: "d103", clientId: "c1", clientName: "Marcus Chen", clientAvatar: "/images/avatars/01.png", fileName: "Business_Expenses_2025.xlsx", originalFileName: "expenses_all_locations.xlsx", fileSize: "1.2 MB", docType: "expense", docTypeLabel: "EXP", docCategory: "business", uploadedBy: "client", viewedByPreparer: true, uploadedAt: "2026-03-22T14:00:00" },
  { id: "d104", clientId: "c1", clientName: "Marcus Chen", clientAvatar: "/images/avatars/01.png", fileName: "Drivers_License.jpg", originalFileName: "license_front.jpg", fileSize: "1.8 MB", docType: "id", docTypeLabel: "ID", docCategory: "identity", uploadedBy: "client", viewedByPreparer: true, uploadedAt: "2026-03-20T09:00:00" },
  { id: "d105", clientId: "c1", clientName: "Marcus Chen", clientAvatar: "/images/avatars/01.png", fileName: "Engagement_Letter_2025.pdf", originalFileName: "Engagement_Letter_2025.pdf", fileSize: "156 KB", docType: "engagement", docTypeLabel: "AGR", docCategory: "agreements", uploadedBy: "preparer", viewedByPreparer: true, uploadedAt: "2026-03-18T08:00:00", status: "signed" },
  { id: "d106", clientId: "c1", clientName: "Marcus Chen", clientAvatar: "/images/avatars/01.png", fileName: "7216_Consent.pdf", originalFileName: "7216_Consent.pdf", fileSize: "92 KB", docType: "7216", docTypeLabel: "AGR", docCategory: "agreements", uploadedBy: "preparer", viewedByPreparer: true, uploadedAt: "2026-03-18T08:05:00", status: "signed" },

  // Priya Sharma (c2) - TikTok creator
  { id: "d201", clientId: "c2", clientName: "Priya Sharma", clientAvatar: "/images/avatars/02.png", fileName: "1099-NEC_TikTok.pdf", originalFileName: "photo_1099.heic", fileSize: "89 KB", docType: "1099_nec", docTypeLabel: "1099", docCategory: "income", uploadedBy: "client", viewedByPreparer: false, uploadedAt: "2026-03-27T14:30:00" },
  { id: "d202", clientId: "c2", clientName: "Priya Sharma", clientAvatar: "/images/avatars/02.png", fileName: "Drivers_License.jpg", originalFileName: "id_photo.jpg", fileSize: "2.1 MB", docType: "id", docTypeLabel: "ID", docCategory: "identity", uploadedBy: "client", viewedByPreparer: true, uploadedAt: "2026-03-22T09:00:00" },
  { id: "d203", clientId: "c2", clientName: "Priya Sharma", clientAvatar: "/images/avatars/02.png", fileName: "Engagement_Letter_2025.pdf", originalFileName: "Engagement_Letter_2025.pdf", fileSize: "156 KB", docType: "engagement", docTypeLabel: "AGR", docCategory: "agreements", uploadedBy: "preparer", viewedByPreparer: true, uploadedAt: "2026-03-20T08:00:00", status: "signed" },

  // James & Sofia Rodriguez (c3) - Pay & Sign - 12/12 docs
  { id: "d301", clientId: "c3", clientName: "James & Sofia Rodriguez", clientAvatar: "/images/avatars/03.png", fileName: "2025_Federal_Return.pdf", originalFileName: "2025_Federal_Return.pdf", fileSize: "1.8 MB", docType: "return", docTypeLabel: "RET", docCategory: "returns", uploadedBy: "preparer", viewedByPreparer: true, uploadedAt: "2026-03-27T16:00:00", status: "ready_for_review" },
  { id: "d302", clientId: "c3", clientName: "James & Sofia Rodriguez", clientAvatar: "/images/avatars/03.png", fileName: "W-2_James_Rodriguez.pdf", originalFileName: "w2_james.pdf", fileSize: "120 KB", docType: "w2", docTypeLabel: "W2", docCategory: "income", uploadedBy: "client", viewedByPreparer: true, uploadedAt: "2026-03-15T10:00:00" },
  { id: "d303", clientId: "c3", clientName: "James & Sofia Rodriguez", clientAvatar: "/images/avatars/03.png", fileName: "W-2_Sofia_Rodriguez.pdf", originalFileName: "w2_sofia.pdf", fileSize: "118 KB", docType: "w2", docTypeLabel: "W2", docCategory: "income", uploadedBy: "client", viewedByPreparer: true, uploadedAt: "2026-03-15T10:05:00" },
  { id: "d304", clientId: "c3", clientName: "James & Sofia Rodriguez", clientAvatar: "/images/avatars/03.png", fileName: "1099-INT_Chase_Bank.pdf", originalFileName: "1099_chase.pdf", fileSize: "45 KB", docType: "1099_int", docTypeLabel: "1099", docCategory: "income", uploadedBy: "client", viewedByPreparer: true, uploadedAt: "2026-03-16T09:00:00" },
  { id: "d305", clientId: "c3", clientName: "James & Sofia Rodriguez", clientAvatar: "/images/avatars/03.png", fileName: "Rental_Income_Statement.pdf", originalFileName: "rental_income.pdf", fileSize: "234 KB", docType: "expense", docTypeLabel: "EXP", docCategory: "income", uploadedBy: "client", viewedByPreparer: true, uploadedAt: "2026-03-16T09:30:00" },
  { id: "d306", clientId: "c3", clientName: "James & Sofia Rodriguez", clientAvatar: "/images/avatars/03.png", fileName: "Rental_Expenses.xlsx", originalFileName: "rental_expenses.xlsx", fileSize: "156 KB", docType: "expense", docTypeLabel: "EXP", docCategory: "deductions", uploadedBy: "client", viewedByPreparer: true, uploadedAt: "2026-03-17T14:00:00" },
  { id: "d307", clientId: "c3", clientName: "James & Sofia Rodriguez", clientAvatar: "/images/avatars/03.png", fileName: "Property_Tax_Receipt.pdf", originalFileName: "prop_tax.pdf", fileSize: "89 KB", docType: "expense", docTypeLabel: "EXP", docCategory: "deductions", uploadedBy: "client", viewedByPreparer: true, uploadedAt: "2026-03-17T14:30:00" },
  { id: "d308", clientId: "c3", clientName: "James & Sofia Rodriguez", clientAvatar: "/images/avatars/03.png", fileName: "Mortgage_Interest_1098.pdf", originalFileName: "1098_mortgage.pdf", fileSize: "67 KB", docType: "1099_int", docTypeLabel: "1099", docCategory: "deductions", uploadedBy: "client", viewedByPreparer: true, uploadedAt: "2026-03-18T08:00:00" },
  { id: "d309", clientId: "c3", clientName: "James & Sofia Rodriguez", clientAvatar: "/images/avatars/03.png", fileName: "Drivers_License_James.jpg", originalFileName: "id_james.jpg", fileSize: "1.9 MB", docType: "id", docTypeLabel: "ID", docCategory: "identity", uploadedBy: "client", viewedByPreparer: true, uploadedAt: "2026-03-14T10:00:00" },
  { id: "d310", clientId: "c3", clientName: "James & Sofia Rodriguez", clientAvatar: "/images/avatars/03.png", fileName: "Drivers_License_Sofia.jpg", originalFileName: "id_sofia.jpg", fileSize: "1.8 MB", docType: "id", docTypeLabel: "ID", docCategory: "identity", uploadedBy: "client", viewedByPreparer: true, uploadedAt: "2026-03-14T10:05:00" },
  { id: "d311", clientId: "c3", clientName: "James & Sofia Rodriguez", clientAvatar: "/images/avatars/03.png", fileName: "Engagement_Letter_2025.pdf", originalFileName: "Engagement_Letter_2025.pdf", fileSize: "156 KB", docType: "engagement", docTypeLabel: "AGR", docCategory: "agreements", uploadedBy: "preparer", viewedByPreparer: true, uploadedAt: "2026-03-12T08:00:00", status: "signed" },
  { id: "d312", clientId: "c3", clientName: "James & Sofia Rodriguez", clientAvatar: "/images/avatars/03.png", fileName: "7216_Consent.pdf", originalFileName: "7216_Consent.pdf", fileSize: "92 KB", docType: "7216", docTypeLabel: "AGR", docCategory: "agreements", uploadedBy: "preparer", viewedByPreparer: true, uploadedAt: "2026-03-12T08:05:00", status: "signed" },

  // DeShawn Williams (c4) - Urgent, missing docs
  { id: "d401", clientId: "c4", clientName: "DeShawn Williams", clientAvatar: "/images/avatars/04.png", fileName: "Drivers_License.jpg", originalFileName: "dl_scan.jpg", fileSize: "1.5 MB", docType: "id", docTypeLabel: "ID", docCategory: "identity", uploadedBy: "client", viewedByPreparer: true, uploadedAt: "2026-03-18T09:30:00" },

  // David Park (c11) - S-Corp
  { id: "d1101", clientId: "c11", clientName: "David Park", clientAvatar: "/images/avatars/11.png", fileName: "W-2_Park_Family_Dental.pdf", originalFileName: "w2_dental.pdf", fileSize: "134 KB", docType: "w2", docTypeLabel: "W2", docCategory: "income", uploadedBy: "client", viewedByPreparer: true, uploadedAt: "2026-03-25T08:00:00" },
  { id: "d1102", clientId: "c11", clientName: "David Park", clientAvatar: "/images/avatars/11.png", fileName: "1120S_Profit_Loss.pdf", originalFileName: "pl_statement_2025.pdf", fileSize: "890 KB", docType: "expense", docTypeLabel: "EXP", docCategory: "business", uploadedBy: "client", viewedByPreparer: false, uploadedAt: "2026-03-27T20:00:00" },

  // Roberto Fuentes (c6) - In Review
  { id: "d601", clientId: "c6", clientName: "Roberto Fuentes", clientAvatar: "/images/avatars/06.png", fileName: "2025_Federal_Return_1120S.pdf", originalFileName: "2025_Federal_Return_1120S.pdf", fileSize: "2.4 MB", docType: "return", docTypeLabel: "RET", docCategory: "returns", uploadedBy: "preparer", viewedByPreparer: true, uploadedAt: "2026-03-27T16:00:00", status: "ready_for_review" },

  // Mei-Lin Wu (c18) - Acupuncture
  { id: "d1801", clientId: "c18", clientName: "Mei-Lin Wu", clientAvatar: "/images/avatars/06.png", fileName: "Schedule_C_Wu_Acupuncture.pdf", originalFileName: "business_records.pdf", fileSize: "456 KB", docType: "expense", docTypeLabel: "EXP", docCategory: "business", uploadedBy: "client", viewedByPreparer: true, uploadedAt: "2026-03-26T12:00:00" },
  { id: "d1802", clientId: "c18", clientName: "Mei-Lin Wu", clientAvatar: "/images/avatars/06.png", fileName: "1099-NEC_Acupuncture_Clients.pdf", originalFileName: "1099s_combined.pdf", fileSize: "234 KB", docType: "1099_nec", docTypeLabel: "1099", docCategory: "income", uploadedBy: "client", viewedByPreparer: false, uploadedAt: "2026-03-28T07:00:00" },

  // Aisha Johnson (c14) - Pay & Sign
  { id: "d1401", clientId: "c14", clientName: "Aisha Johnson", clientAvatar: "/images/avatars/02.png", fileName: "W-2_Regional_Hospital.pdf", originalFileName: "w2_hospital.pdf", fileSize: "110 KB", docType: "w2", docTypeLabel: "W2", docCategory: "income", uploadedBy: "client", viewedByPreparer: true, uploadedAt: "2026-03-20T11:00:00" },
];

// ============================================================
// CHECKLISTS (per client)
// ============================================================

export const checklistItems: ChecklistItem[] = [
  // Priya Sharma (c2) - 3 of 7 received
  { id: "cl201", clientId: "c2", label: "Photo ID", docType: "id", category: "identity", required: true, received: true, receivedAt: "2026-03-22", documentId: "d202", matchedFileName: "Drivers_License.jpg", requestedAt: "2026-03-20", daysSinceRequested: 8 },
  { id: "cl202", clientId: "c2", label: "1099-NEC from TikTok", docType: "1099_nec", category: "income", required: true, received: true, receivedAt: "2026-03-27", documentId: "d201", matchedFileName: "1099-NEC_TikTok.pdf", requestedAt: "2026-03-20", daysSinceRequested: 8 },
  { id: "cl203", clientId: "c2", label: "1099-NEC (brand partnerships)", docType: "1099_nec", category: "income", required: true, received: false, requestedAt: "2026-03-25", daysSinceRequested: 3 },
  { id: "cl204", clientId: "c2", label: "Business bank statements", docType: "expense", category: "business", required: true, received: false, requestedAt: "2026-03-25", daysSinceRequested: 3 },
  { id: "cl205", clientId: "c2", label: "Estimated payment receipts", docType: "expense", category: "deductions", required: false, received: false, requestedAt: "2026-03-25", daysSinceRequested: 3 },
  { id: "cl206", clientId: "c2", label: "Prior year return", docType: "return", category: "returns", required: true, received: false, requestedAt: "2026-03-23", daysSinceRequested: 5 },
  { id: "cl207", clientId: "c2", label: "Engagement letter", docType: "engagement", category: "agreements", required: true, received: true, receivedAt: "2026-03-20", documentId: "d203", matchedFileName: "Engagement_Letter_2025.pdf", requestedAt: "2026-03-20", daysSinceRequested: 8 },

  // DeShawn Williams (c4) - 1 of 6 received
  { id: "cl401", clientId: "c4", label: "Photo ID", docType: "id", category: "identity", required: true, received: true, receivedAt: "2026-03-18", documentId: "d401", matchedFileName: "Drivers_License.jpg", requestedAt: "2026-03-18", daysSinceRequested: 10 },
  { id: "cl402", clientId: "c4", label: "W-2 from employer", docType: "w2", category: "income", required: true, received: false, requestedAt: "2026-03-18", daysSinceRequested: 10 },
  { id: "cl403", clientId: "c4", label: "Dependent SSN cards", docType: "id", category: "identity", required: true, received: false, requestedAt: "2026-03-18", daysSinceRequested: 10 },
  { id: "cl404", clientId: "c4", label: "Childcare expense records", docType: "expense", category: "deductions", required: false, received: false, requestedAt: "2026-03-18", daysSinceRequested: 10 },
  { id: "cl405", clientId: "c4", label: "Prior year return", docType: "return", category: "returns", required: true, received: false, requestedAt: "2026-03-18", daysSinceRequested: 10 },
  { id: "cl406", clientId: "c4", label: "Social Security card", docType: "id", category: "identity", required: true, received: false, requestedAt: "2026-03-18", daysSinceRequested: 10 },

  // David Park (c11) - 18 of 20
  { id: "cl1101", clientId: "c11", label: "Payroll summary", docType: "expense", category: "business", required: true, received: false, requestedAt: "2026-03-22", daysSinceRequested: 6 },
  { id: "cl1102", clientId: "c11", label: "Equipment depreciation schedule", docType: "expense", category: "business", required: true, received: false, requestedAt: "2026-03-22", daysSinceRequested: 6 },

  // Thomas & Marie DuBois (c8) - missing crypto docs
  { id: "cl801", clientId: "c8", label: "1099-DA from Coinbase", docType: "1099_int", category: "income", required: true, received: false, requestedAt: "2026-03-23", daysSinceRequested: 5 },
  { id: "cl802", clientId: "c8", label: "Crypto transaction history", docType: "expense", category: "income", required: true, received: false, requestedAt: "2026-03-23", daysSinceRequested: 5 },
  { id: "cl803", clientId: "c8", label: "Cost basis report", docType: "expense", category: "income", required: true, received: false, requestedAt: "2026-03-23", daysSinceRequested: 5 },

  // Tyrone Mitchell (c17) - missing Uber docs
  { id: "cl1701", clientId: "c17", label: "1099-K from Uber", docType: "1099_nec", category: "income", required: true, received: false, requestedAt: "2026-03-19", daysSinceRequested: 9 },
  { id: "cl1702", clientId: "c17", label: "Mileage log", docType: "expense", category: "deductions", required: true, received: false, requestedAt: "2026-03-19", daysSinceRequested: 9 },
  { id: "cl1703", clientId: "c17", label: "Prior year return", docType: "return", category: "returns", required: true, received: false, requestedAt: "2026-03-19", daysSinceRequested: 9 },
];

// ============================================================
// FIRM DOCUMENTS
// ============================================================

export const firmDocuments: FirmDocument[] = [
  { id: "fd1", name: "Engagement Letter Template", type: "engagement_template", icon: "doc", lastEdited: "2026-03-15", description: "Standard engagement letter for new clients" },
  { id: "fd2", name: "IRC 7216 Consent Form", type: "7216_template", icon: "doc", lastEdited: "2026-02-20", description: "Required taxpayer consent for third-party disclosure" },
  { id: "fd3", name: "Written Information Security Plan (WISP)", type: "wisp", icon: "shield", lastEdited: "2026-01-10", description: "IRS Publication 4557 required security plan" },
  { id: "fd4", name: "Quarterly Estimate Calculator", type: "calculator", icon: "calc", lastEdited: "2026-03-01", description: "Template for calculating estimated quarterly payments" },
  { id: "fd5", name: "Form 8867 Due Diligence Checklist", type: "checklist", icon: "check", lastEdited: "2026-02-15", description: "Paid preparer due diligence checklist for EITC/CTC/AOTC/HOH" },
];

// ============================================================
// CLIENT NOTES
// ============================================================

export const clientNotes: ClientNote[] = [
  { id: "n1", clientId: "c1", content: "Marcus mentioned he may close the 3rd Golden Dragon location in Riverside. Revenue drop is expected - not a data issue. Will confirm in review call on Mar 30.", createdAt: "2026-03-27T14:00:00", updatedAt: "2026-03-27T14:00:00" },
  { id: "n2", clientId: "c2", content: "Priya is new to filing as self-employed. She's been doing brand deals on TikTok and Instagram. Needs education on estimated payments for next year. Very responsive on the portal.", createdAt: "2026-03-22T10:00:00", updatedAt: "2026-03-25T11:00:00" },
  { id: "n3", clientId: "c4", content: "DeShawn was referred by a friend. He's never filed with a preparer before. Very busy with work - may need a phone call to walk through the portal. Two kids, head of household.", createdAt: "2026-03-18T09:00:00", updatedAt: "2026-03-18T09:00:00" },
  { id: "n4", clientId: "c6", content: "Roberto's trucking business had a strong year. Complex depreciation on 3 trucks purchased in 2025. Need to discuss Section 179 vs MACRS. He prefers text messages over portal.", createdAt: "2026-03-20T16:00:00", updatedAt: "2026-03-27T16:00:00" },
  { id: "n5", clientId: "c11", content: "David's dental practice has 8 employees. Payroll is through ADP. He's meticulous about documentation - will want to review every line. Schedule extra time for the review call.", createdAt: "2026-03-25T08:00:00", updatedAt: "2026-03-28T07:00:00" },
  { id: "n6", clientId: "c13", content: "Vladimir's import business is complex - some international transactions. Will almost certainly need an extension. His English is good but he prefers written communication. Mentor connection.", createdAt: "2026-03-20T10:00:00", updatedAt: "2026-03-20T10:00:00" },
  { id: "n7", clientId: "c17", content: "Tyrone drove for both Uber and Lyft last year. Didn't track mileage consistently. May need to reconstruct mileage from app data. Was extended last year too - pattern.", createdAt: "2026-03-19T08:00:00", updatedAt: "2026-03-23T08:00:00" },
  { id: "n8", clientId: "c18", content: "Mei-Lin has a home office in her acupuncture clinic. Health insurance deduction is significant. QBI deduction should apply. Very organized - all docs came in clean.", createdAt: "2026-03-26T12:00:00", updatedAt: "2026-03-27T17:00:00" },
];

// ============================================================
// SMART CHECKLIST (categorized with tax-relevant groupings)
// ============================================================

export type SmartChecklistStatus = "received" | "pending" | "flagged" | "dismissed"

export interface SmartChecklistItem {
  id: string
  clientId: string
  category: "income" | "deductions" | "other"
  label: string
  formName?: string // e.g. "W-2", "1099-NEC"
  status: SmartChecklistStatus
  documentId?: string
  dismissedReason?: string
  aiSummary?: string
  flagReason?: string
}

export interface SmartChecklistCategory {
  category: "income" | "deductions" | "other"
  label: string
  items: SmartChecklistItem[]
  received: number
  total: number
}

// Generate smart checklist from existing data
export function getSmartChecklist(clientId: string): SmartChecklistCategory[] {
  const docs = getClientDocuments(clientId)
  const checklist = getClientChecklist(clientId)
  const intelligence = getDocumentIntelligence(clientId)

  // Map existing checklist items to smart format
  const smartItems: SmartChecklistItem[] = checklist.map(item => {
    const intel = item.documentId ? intelligence.find(i => i.documentId === item.documentId) : undefined
    const smartCategory: "income" | "deductions" | "other" =
      item.category === "income" || item.category === "business" ? "income" :
      item.category === "deductions" ? "deductions" : "other"

    return {
      id: item.id,
      clientId: item.clientId,
      category: smartCategory,
      label: item.label,
      formName: item.docType === "w2" ? "W-2" :
                item.docType === "1099_nec" ? "1099-NEC" :
                item.docType === "1099_int" ? "1099-INT" :
                item.docType === "id" ? "ID" :
                item.docType === "return" ? "Prior Return" :
                item.docType === "engagement" ? "Agreement" :
                undefined,
      status: item.received ? "received" : "pending",
      documentId: item.documentId,
      aiSummary: intel?.aiSummary,
    }
  })

  // If no checklist exists, generate from documents
  if (smartItems.length === 0 && docs.length > 0) {
    for (const doc of docs) {
      const smartCategory: "income" | "deductions" | "other" =
        doc.docCategory === "income" || doc.docCategory === "business" ? "income" :
        doc.docCategory === "deductions" ? "deductions" : "other"
      const intel = intelligence.find(i => i.documentId === doc.id)

      smartItems.push({
        id: `smart-${doc.id}`,
        clientId: doc.clientId,
        category: smartCategory,
        label: doc.fileName.replace(/_/g, " ").replace(/\.[^.]+$/, ""),
        formName: doc.docTypeLabel,
        status: "received",
        documentId: doc.id,
        aiSummary: intel?.aiSummary,
      })
    }
  }

  // Group by category
  const categoryMap: Record<string, SmartChecklistItem[]> = {
    income: [],
    deductions: [],
    other: [],
  }

  for (const item of smartItems) {
    categoryMap[item.category]?.push(item)
  }

  const categoryLabels: Record<string, string> = {
    income: "Income",
    deductions: "Deductions",
    other: "Other",
  }

  return Object.entries(categoryMap)
    .filter(([, items]) => items.length > 0)
    .map(([cat, items]) => ({
      category: cat as "income" | "deductions" | "other",
      label: categoryLabels[cat],
      items,
      received: items.filter(i => i.status === "received").length,
      total: items.length,
    }))
}

// Compact summary for client cards: "Income ✓ · Deductions 1/3 · Other ✓"
export function getSmartChecklistSummary(clientId: string): string {
  const categories = getSmartChecklist(clientId)
  if (categories.length === 0) return ""

  return categories.map(cat => {
    if (cat.received === cat.total) return `${cat.label} \u2713`
    return `${cat.label} ${cat.received}/${cat.total}`
  }).join(" · ")
}

// ============================================================
// DOCUMENT INTELLIGENCE
// ============================================================

export interface DocumentFlag {
  type: "info" | "warning" | "error"
  message: string
}

export interface DocumentIntelligence {
  documentId: string
  clientId: string
  aiSummary: string
  keyDataPoints: { label: string; value: string }[]
  flags: DocumentFlag[]
  duplicateOf?: string
  priorYearComparison?: string
}

export const documentIntelligence: DocumentIntelligence[] = [
  // Marcus Chen - W-2
  {
    documentId: "d101",
    clientId: "c1",
    aiSummary: "W-2 from Golden Dragon LLC for tax year 2025. Gross wages: $58,000. Federal tax withheld: $7,200. This is the primary employment income. Wages decreased from $96,000 last year due to the Pasadena location closure.",
    keyDataPoints: [
      { label: "Wages", value: "$58,000" },
      { label: "Fed Withheld", value: "$7,200" },
      { label: "State", value: "CA" },
    ],
    flags: [
      { type: "warning", message: "Wages decreased 40% from prior year ($96,000). Consistent with reported location closure." },
    ],
    priorYearComparison: "Wages down $38,000 (40%) from 2024. Location closure explains the drop.",
  },
  // Marcus Chen - 1099-NEC
  {
    documentId: "d102",
    clientId: "c1",
    aiSummary: "1099-NEC for consulting work. Non-employee compensation: $12,000. This is new income not present in prior year.",
    keyDataPoints: [
      { label: "NEC Income", value: "$12,000" },
      { label: "Payer", value: "Restaurant Consulting Group" },
    ],
    flags: [
      { type: "info", message: "New income source not present in 2024. May need Schedule C." },
    ],
  },
  // Priya Sharma - 1099-NEC TikTok
  {
    documentId: "d201",
    clientId: "c2",
    aiSummary: "1099-NEC from TikTok Creator Fund for tax year 2025. Non-employee compensation: $28,400. This is Priya's primary self-employment income. Document was a phone photo converted to PDF.",
    keyDataPoints: [
      { label: "NEC Income", value: "$28,400" },
      { label: "Payer", value: "TikTok Inc." },
    ],
    flags: [
      { type: "info", message: "Matches expected document from intake. Filed under Income." },
      { type: "warning", message: "Document is a phone photo. Some fields may be unclear. Consider requesting PDF." },
    ],
  },
  // Rodriguez - W-2 James
  {
    documentId: "d302",
    clientId: "c3",
    aiSummary: "W-2 from Riverside County Public Works for James Rodriguez. Gross wages: $72,400. Federal tax withheld: $9,800. Consistent with prior year.",
    keyDataPoints: [
      { label: "Wages", value: "$72,400" },
      { label: "Fed Withheld", value: "$9,800" },
      { label: "State", value: "CA" },
    ],
    flags: [
      { type: "info", message: "Wages up 3% from prior year ($70,200). Normal increase." },
    ],
    priorYearComparison: "Wages up $2,200 (3%) from 2024.",
  },
  // Rodriguez - W-2 Sofia
  {
    documentId: "d303",
    clientId: "c3",
    aiSummary: "W-2 from Inland Empire School District for Sofia Rodriguez. Gross wages: $54,200. Federal tax withheld: $6,100. Teaching position, same employer as prior year.",
    keyDataPoints: [
      { label: "Wages", value: "$54,200" },
      { label: "Fed Withheld", value: "$6,100" },
      { label: "State", value: "CA" },
    ],
    flags: [],
    priorYearComparison: "Wages up $1,800 (3.4%) from 2024.",
  },
  // Rodriguez - 1099-INT
  {
    documentId: "d304",
    clientId: "c3",
    aiSummary: "1099-INT from Chase Bank. Interest income: $340. Standard savings account interest.",
    keyDataPoints: [
      { label: "Interest", value: "$340" },
      { label: "Bank", value: "Chase" },
    ],
    flags: [],
  },
  // Rodriguez - Rental income
  {
    documentId: "d305",
    clientId: "c3",
    aiSummary: "Rental income statement for investment property at 1824 Palm Ave, Riverside. Gross rental income: $24,000 ($2,000/mo). Property managed by Rodriguez family.",
    keyDataPoints: [
      { label: "Rental Income", value: "$24,000" },
      { label: "Monthly", value: "$2,000" },
      { label: "Property", value: "1824 Palm Ave" },
    ],
    flags: [
      { type: "info", message: "Rental income consistent with prior year. Schedule E required." },
    ],
  },
  // David Park - W-2
  {
    documentId: "d1101",
    clientId: "c11",
    aiSummary: "W-2 from Park Family Dental PC. Salary: $185,000. Federal tax withheld: $38,200. S-Corp officer compensation.",
    keyDataPoints: [
      { label: "Salary", value: "$185,000" },
      { label: "Fed Withheld", value: "$38,200" },
      { label: "State", value: "CA" },
    ],
    flags: [
      { type: "info", message: "S-Corp reasonable compensation. Up from $170,000 prior year." },
    ],
    priorYearComparison: "Officer salary increased $15,000 (8.8%) from 2024.",
  },
  // Mei-Lin Wu - 1099-NEC
  {
    documentId: "d1802",
    clientId: "c18",
    aiSummary: "1099-NEC combined from multiple acupuncture clients. Total non-employee compensation: $78,000. This is Mei-Lin's sole source of Schedule C income.",
    keyDataPoints: [
      { label: "NEC Total", value: "$78,000" },
      { label: "Clients", value: "Multiple" },
    ],
    flags: [
      { type: "info", message: "Income consistent with prior year ($74,500). QBI deduction applies." },
    ],
    priorYearComparison: "NEC income up $3,500 (4.7%) from 2024.",
  },
]

export function getDocumentIntelligence(clientId: string): DocumentIntelligence[] {
  return documentIntelligence.filter(d => d.clientId === clientId)
}

export function getIntelligenceForDocument(documentId: string): DocumentIntelligence | undefined {
  return documentIntelligence.find(d => d.documentId === documentId)
}

// ============================================================
// HELPERS
// ============================================================

export function getClientDocuments(clientId: string) {
  return mockDocuments.filter(d => d.clientId === clientId);
}

export function getClientChecklist(clientId: string) {
  return checklistItems.filter(c => c.clientId === clientId);
}

export function getClientNotes(clientId: string) {
  return clientNotes.filter(n => n.clientId === clientId);
}

export function getUnviewedCount() {
  return mockDocuments.filter(d => !d.viewedByPreparer).length;
}

export function getMissingCount() {
  return checklistItems.filter(c => !c.received).length;
}

export function getDocumentsByDay() {
  const sorted = [...mockDocuments].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  const groups: Record<string, MockDocument[]> = {};

  const today = new Date("2026-03-28");
  const yesterday = new Date("2026-03-27");

  for (const doc of sorted) {
    const date = new Date(doc.uploadedAt);
    const dateStr = date.toDateString();
    let label: string;

    if (dateStr === today.toDateString()) label = "Today";
    else if (dateStr === yesterday.toDateString()) label = "Yesterday";
    else label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    if (!groups[label]) groups[label] = [];
    groups[label].push(doc);
  }

  return groups;
}

export function groupDocumentsByCategory(clientId: string) {
  const docs = getClientDocuments(clientId);
  const checklist = getClientChecklist(clientId);
  const missingItems = checklist.filter(c => !c.received);

  const groups: Record<string, { docs: MockDocument[]; missing: ChecklistItem[] }> = {
    income: { docs: [], missing: [] },
    business: { docs: [], missing: [] },
    identity: { docs: [], missing: [] },
    deductions: { docs: [], missing: [] },
    returns: { docs: [], missing: [] },
    agreements: { docs: [], missing: [] },
  };

  for (const doc of docs) {
    if (groups[doc.docCategory]) {
      groups[doc.docCategory].docs.push(doc);
    }
  }

  for (const item of missingItems) {
    if (groups[item.category]) {
      groups[item.category].missing.push(item);
    }
  }

  // Filter out empty groups (no docs AND no missing)
  const result: { category: string; label: string; docs: MockDocument[]; missing: ChecklistItem[] }[] = [];
  const labels: Record<string, string> = {
    income: "Income documents",
    business: "Business records",
    identity: "Identity",
    deductions: "Deductions",
    returns: "Tax returns",
    agreements: "Agreements",
  };

  for (const [key, value] of Object.entries(groups)) {
    if (value.docs.length > 0 || value.missing.length > 0) {
      result.push({ category: key, label: labels[key] || key, ...value });
    }
  }

  return result;
}

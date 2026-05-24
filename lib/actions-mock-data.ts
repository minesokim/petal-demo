// ============================================================
// PETAL ACTIONS - Comprehensive mock data for all 26 agentic capabilities
// ============================================================

import { type ActionItem, type Client, clients, actionItems } from "./mock-data";

// ============================================================
// TYPES
// ============================================================

export type DemoState = "idle" | "processing" | "complete";

export type ActionCategory =
  | "document" | "signature" | "schedule" | "payment"
  | "pipeline" | "escalation" | "intelligence" | "batch" | "voice" | "nudge";

// --- Document Extraction ---
export interface ExtractedField {
  label: string;
  value: string;
  confidence: number; // 0-100
  source: string; // e.g. "W-2 Box 1"
  needsReview: boolean;
}

export interface DocumentExtraction {
  id: string;
  clientId: string;
  clientName: string;
  documentType: string;
  overallConfidence: number;
  fields: ExtractedField[];
  status: "pending_review" | "approved" | "needs_edit";
}

// --- Voice Dump ---
export type VoiceItemCategory = "action" | "todo";

export interface VoiceClientMatch {
  clientId: string;
  clientName: string;
}

export interface VoiceParsedItem {
  id: string;
  text: string;
  clientId?: string;
  clientName?: string;
  /** "confident" = single match, "ambiguous" = multiple candidates, "none" = no client detected */
  matchType: "confident" | "ambiguous" | "none";
  /** For ambiguous matches, the list of possible clients */
  matchCandidates?: VoiceClientMatch[];
  category: VoiceItemCategory;
  confidence: number;
  status: "pending" | "approved" | "rejected";
}

export interface VoiceDumpSession {
  id: string;
  timestamp: string;
  duration: string;
  transcript: string;
  parsedItems: VoiceParsedItem[];
}

// --- Compliance ---
export interface ComplianceAlert {
  id: string;
  clientId: string;
  clientName: string;
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  formRequired: string;
  fineRisk: string;
  status: "pending" | "acknowledged" | "dismissed";
}

// --- Anomaly ---
export interface AnomalyAlert {
  id: string;
  clientId: string;
  clientName: string;
  metric: string;
  priorYear: number;
  currentYear: number;
  changePercent: number;
  aiExplanation: string;
  status: "pending" | "flagged" | "proceeded";
}

// --- Escalation ---
export type EscalationLevel = "reminder" | "urgent" | "schedule_call" | "final_notice";

export interface EscalationState {
  clientId: string;
  clientName: string;
  currentLevel: EscalationLevel;
  attemptCount: number;
  daysSinceLastActivity: number;
  history: { level: EscalationLevel; date: string; method: string }[];
}

// --- Calendar ---
export interface CalendarSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  isAiSuggested: boolean;
  reason?: string;
}

// --- Batch ---
export interface BatchItem {
  id: string;
  clientId: string;
  clientName: string;
  detail: string;
  status: "pending" | "processing" | "complete" | "failed";
  avatar: string;
}

export interface BatchOperation {
  id: string;
  type: "reminders" | "invoices" | "stage_advance";
  title: string;
  description: string;
  items: BatchItem[];
}

// --- Deduction ---
export interface DeductionSuggestion {
  id: string;
  clientId: string;
  clientName: string;
  deductionType: string;
  section: string;
  estimatedSavings: number;
  description: string;
  status: "pending" | "applied" | "dismissed";
}

// --- IRS Notice ---
export interface IrsNotice {
  id: string;
  clientId: string;
  clientName: string;
  noticeType: string;
  receivedDate: string;
  summary: string;
  aiDraftResponse: string;
  status: "pending" | "sent" | "resolved";
}

// --- Extension Prediction ---
export interface ExtensionPrediction {
  id: string;
  clientId: string;
  clientName: string;
  probability: number;
  factors: string[];
  status: "pending" | "extension_filed" | "dismissed";
}

// --- Estimated Tax ---
export interface EstimatedTaxCalc {
  id: string;
  clientId: string;
  clientName: string;
  quarterlyAmounts: { q1: number; q2: number; q3: number; q4: number };
  totalEstimated: number;
  basis: string;
}

// --- Portal Nudge ---
export interface PortalNudge {
  id: string;
  clientId: string;
  clientName: string;
  daysSinceAction: number;
  lastAction: string;
  suggestedNudge: string;
  status: "pending" | "sent" | "dismissed";
}

// --- To-do ---
export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  source: "manual" | "voice" | "ai";
  createdAt: string;
  clientId?: string;
  clientName?: string;
}

// --- Enhanced Action for the feed ---
export interface FeedAction {
  id: string;
  clientId: string;
  clientName: string;
  clientAvatar: string;
  category: ActionCategory;
  type: string;
  title: string;
  description: string;
  priority: number; // 1=urgent, 5=low
  aiDraft?: string;
  createdAt: string;
  isResolved: boolean;
}

// ============================================================
// MOCK DATA
// ============================================================

// --- Feed Actions (expanded from the original 12 to cover all types) ---
export const feedActions: FeedAction[] = [
  // Document actions
  { id: "fa1", clientId: "c2", clientName: "Priya Sharma", clientAvatar: "/images/avatars/02.png", category: "document", type: "request_docs", title: "Missing 3 documents", description: "TikTok 1099 received. Still needs: 1099-NEC (brand deals), bank statements, estimated payment receipts.", priority: 1, aiDraft: "Hi Priya! Thanks for uploading your TikTok 1099. We just need a few more things to finish up: any 1099s from brand deals, bank statements, and receipts for estimated payments. You can upload them right in the portal!", createdAt: "2026-03-28T08:00:00", isResolved: false },
  { id: "fa2", clientId: "c4", clientName: "DeShawn Williams", clientAvatar: "/images/avatars/04.png", category: "document", type: "request_docs", title: "Missing W-2 and deposit", description: "DeShawn hasn't uploaded his W-2 or paid the deposit. Last login was never. Sent intake 10 days ago.", priority: 1, aiDraft: "Hi DeShawn, just checking in! I noticed we're still waiting on your W-2 and the $150 deposit to get started on your return. The April 15 deadline is coming up fast. Can you upload your W-2 through the portal this week?", createdAt: "2026-03-28T08:00:00", isResolved: false },
  // Signature
  { id: "fa3", clientId: "c3", clientName: "James & Sofia Rodriguez", clientAvatar: "/images/avatars/03.png", category: "signature", type: "send_signature", title: "8879 ready for signature", description: "Return complete and reviewed. Payment confirmed ($500). Ready to send Form 8879 for e-signature.", priority: 2, createdAt: "2026-03-28T07:00:00", isResolved: false },
  { id: "fa4", clientId: "c14", clientName: "Aisha Johnson", clientAvatar: "/images/avatars/02.png", category: "signature", type: "send_signature", title: "8879 ready for signature", description: "Simple return complete. Payment received ($350). Waiting on e-signature.", priority: 2, createdAt: "2026-03-28T07:30:00", isResolved: false },
  // Scheduling
  { id: "fa5", clientId: "c13", clientName: "Vladimir Petrov", clientAvatar: "/images/avatars/01.png", category: "schedule", type: "schedule_appointment", title: "Schedule extension discussion", description: "0 of 16 documents submitted. Extension almost certain. Need to discuss timeline and plan.", priority: 2, aiDraft: "Vladimir, I wanted to reach out about your 2025 tax return. Given the complexity of Petrov Imports, we should discuss filing an extension. Can we schedule a call this week?", createdAt: "2026-03-28T08:00:00", isResolved: false },
  { id: "fa6", clientId: "c11", clientName: "David Park", clientAvatar: "/images/avatars/11.png", category: "schedule", type: "appointment_reminder", title: "Appointment reminder - 3:00 PM today", description: "Video call to review S-Corp return. Rescheduled from 2pm. 2 documents still missing (payroll summary, equipment list).", priority: 2, createdAt: "2026-03-28T07:00:00", isResolved: false },
  // Payment
  { id: "fa7", clientId: "c4", clientName: "DeShawn Williams", clientAvatar: "/images/avatars/04.png", category: "payment", type: "send_payment_link", title: "Deposit not paid - $150", description: "$150 deposit outstanding for 10 days. Cannot proceed with return preparation until deposit is received.", priority: 2, createdAt: "2026-03-28T08:00:00", isResolved: false },
  // Pipeline
  { id: "fa8", clientId: "c9", clientName: "Miguel Sandoval", clientAvatar: "/images/avatars/09.png", category: "pipeline", type: "advance_stage", title: "Ready to advance: Docs Complete → In Prep", description: "All 9 documents received. Sandoval Plumbing Schedule C ready to begin preparation.", priority: 3, createdAt: "2026-03-28T08:00:00", isResolved: false },
  { id: "fa9", clientId: "c13", clientName: "Vladimir Petrov", clientAvatar: "/images/avatars/01.png", category: "pipeline", type: "file_extension", title: "File extension - Form 4868", description: "0 documents submitted, no portal login. Filing Form 4868 to extend deadline to October 15.", priority: 2, createdAt: "2026-03-28T08:00:00", isResolved: false },
  // Escalation
  { id: "fa10", clientId: "c17", clientName: "Tyrone Mitchell", clientAvatar: "/images/avatars/05.png", category: "escalation", type: "escalate", title: "Stale client - 9 days inactive", description: "Only 2 of 5 docs submitted. Was extended last year. Currently at 'reminder' level.", priority: 1, aiDraft: "Hey Tyrone, I see you started uploading your docs but we still need your 1099-K from Uber, mileage log, and last year's return. I don't want you to have to extend again this year.", createdAt: "2026-03-28T08:00:00", isResolved: false },
  // Review
  { id: "fa11", clientId: "c6", clientName: "Roberto Fuentes", clientAvatar: "/images/avatars/06.png", category: "pipeline", type: "flag_review", title: "Client reviewing 1120S return", description: "Fuentes Transport Inc. 1120S + personal return sent to Roberto for review. Depreciation schedules updated. Follow up if no response by Monday.", priority: 3, createdAt: "2026-03-27T16:00:00", isResolved: false },
  { id: "fa12", clientId: "c18", clientName: "Mei-Lin Wu", clientAvatar: "/images/avatars/06.png", category: "pipeline", type: "flag_review", title: "Client reviewing Schedule C", description: "Wu Acupuncture return sent to Mei-Lin for review. Health insurance deduction and QBI deduction included.", priority: 3, createdAt: "2026-03-27T17:00:00", isResolved: false },
  // Nudge
  { id: "fa13", clientId: "c7", clientName: "Ashley Kim", clientAvatar: "/images/avatars/07.png", category: "nudge", type: "portal_nudge", title: "Hasn't started intake - 2 days", description: "Intake link sent 2 days ago. No login yet. Referred by Priya Sharma.", priority: 4, aiDraft: "Hi Ashley! I sent over your intake form a couple days ago. When you get a chance, just follow the link to get started. It only takes about 10 minutes!", createdAt: "2026-03-26T14:00:00", isResolved: false },
  { id: "fa14", clientId: "c20", clientName: "Fatima Al-Hassan", clientAvatar: "/images/avatars/08.png", category: "nudge", type: "portal_nudge", title: "Hasn't started intake - 1 day", description: "New referral from Elena Mendez. Intake sent yesterday, no response.", priority: 5, aiDraft: "Hi Fatima! Elena Mendez referred you to us — welcome! I sent over your intake form yesterday. When you get a chance, just follow the link to get started. It takes about 10 minutes and we'll handle everything from there.", createdAt: "2026-03-27T10:00:00", isResolved: false },
  // ERO signatures needed
  { id: "fa15", clientId: "c3", clientName: "James & Sofia Rodriguez", clientAvatar: "/images/avatars/03.png", category: "signature", type: "ero_signature", title: "8879 ready for ERO signature", description: "Client paid ($500) and signed Form 8879. Your ERO countersignature is needed to file.", priority: 1, createdAt: "2026-03-28T09:00:00", isResolved: false },
  { id: "fa16", clientId: "c14", clientName: "Aisha Johnson", clientAvatar: "/images/avatars/02.png", category: "signature", type: "ero_signature", title: "8879 ready for ERO signature", description: "Client paid ($350) and signed Form 8879. Your ERO countersignature is needed to file.", priority: 1, createdAt: "2026-03-28T09:00:00", isResolved: false },
];

// --- Document Extractions ---
export const documentExtractions: DocumentExtraction[] = [
  {
    id: "de1",
    clientId: "c1",
    clientName: "Marcus Chen",
    documentType: "W-2",
    overallConfidence: 96,
    fields: [
      { label: "Employer Name", value: "Golden Dragon LLC", confidence: 99, source: "W-2 Box c", needsReview: false },
      { label: "Wages", value: "$68,450.00", confidence: 98, source: "W-2 Box 1", needsReview: false },
      { label: "Federal Tax Withheld", value: "$12,340.00", confidence: 97, source: "W-2 Box 2", needsReview: false },
      { label: "Social Security Wages", value: "$68,450.00", confidence: 98, source: "W-2 Box 3", needsReview: false },
      { label: "SS Tax Withheld", value: "$4,243.90", confidence: 96, source: "W-2 Box 4", needsReview: false },
      { label: "State Wages", value: "$68,450.00", confidence: 94, source: "W-2 Box 16", needsReview: false },
      { label: "State Tax Withheld", value: "$3,422.50", confidence: 91, source: "W-2 Box 17", needsReview: false },
    ],
    status: "pending_review",
  },
  {
    id: "de2",
    clientId: "c2",
    clientName: "Priya Sharma",
    documentType: "1099-NEC",
    overallConfidence: 74,
    fields: [
      { label: "Payer Name", value: "TikTok Inc.", confidence: 95, source: "1099-NEC Box header", needsReview: false },
      { label: "Nonemployee Compensation", value: "$24,830.00", confidence: 88, source: "1099-NEC Box 1", needsReview: false },
      { label: "Federal Tax Withheld", value: "$0.00", confidence: 92, source: "1099-NEC Box 4", needsReview: false },
      { label: "Payer TIN", value: "XX-XXX4782", confidence: 62, source: "1099-NEC Box header", needsReview: true },
      { label: "State Tax Withheld", value: "$1,241.50", confidence: 58, source: "1099-NEC Box 7", needsReview: true },
    ],
    status: "pending_review",
  },
];

// --- Compliance Alerts ---
export const complianceAlerts: ComplianceAlert[] = [
  {
    id: "ca1", clientId: "c4", clientName: "DeShawn Williams",
    severity: "critical", title: "Form 8867 Due Diligence",
    description: "HOH with 2 dependents. EITC, CTC, AOTC, and HOH all require 8867.",
    formRequired: "Form 8867", fineRisk: "$600 per return per failure",
    status: "pending",
  },
  {
    id: "ca2", clientId: "c18", clientName: "Mei-Lin Wu",
    severity: "warning", title: "Schedule C Audit Risk",
    description: "78% expense-to-revenue ratio. Above IRS trigger threshold for this industry.",
    formRequired: "Supporting documentation", fineRisk: "Audit risk, substantiation required",
    status: "pending",
  },
];

// --- Anomaly Alerts ---
// c1 Marcus Chen anomaly merged into PetalInsight supplementary data
export const anomalyAlerts: AnomalyAlert[] = [];

// --- Escalation States ---
export const escalationStates: EscalationState[] = [
  {
    clientId: "c4", clientName: "DeShawn Williams",
    currentLevel: "urgent", attemptCount: 2, daysSinceLastActivity: 10,
    history: [
      { level: "reminder", date: "2026-03-20", method: "Portal message" },
      { level: "urgent", date: "2026-03-25", method: "Text message" },
    ],
  },
  {
    clientId: "c17", clientName: "Tyrone Mitchell",
    currentLevel: "reminder", attemptCount: 1, daysSinceLastActivity: 9,
    history: [
      { level: "reminder", date: "2026-03-23", method: "Portal message" },
    ],
  },
];

// --- Calendar Slots ---
export const calendarSlots: CalendarSlot[] = [
  { id: "cs1", date: "2026-03-29", startTime: "10:00 AM", endTime: "11:00 AM", isAiSuggested: true, reason: "Both calendars free, morning preferred for complex discussions" },
  { id: "cs2", date: "2026-03-29", startTime: "2:00 PM", endTime: "3:00 PM", isAiSuggested: false },
  { id: "cs3", date: "2026-03-30", startTime: "9:00 AM", endTime: "10:00 AM", isAiSuggested: true, reason: "Early slot before other appointments" },
  { id: "cs4", date: "2026-03-30", startTime: "3:00 PM", endTime: "4:00 PM", isAiSuggested: false },
  { id: "cs5", date: "2026-03-31", startTime: "11:00 AM", endTime: "12:00 PM", isAiSuggested: false },
];

// --- Batch Operations ---
export const batchOperations: BatchOperation[] = [
  {
    id: "bo1", type: "reminders", title: "Send missing document reminders",
    description: "14 clients have outstanding documents. Each will receive a personalized reminder.",
    items: [
      { id: "bi1", clientId: "c2", clientName: "Priya Sharma", detail: "Missing: 1099-NEC (TikTok), bank statements", status: "pending", avatar: "/images/avatars/02.png" },
      { id: "bi2", clientId: "c4", clientName: "DeShawn Williams", detail: "Missing: W-2, deposit payment", status: "pending", avatar: "/images/avatars/04.png" },
      { id: "bi3", clientId: "c8", clientName: "Thomas & Marie DuBois", detail: "Missing: 1099-DA (Coinbase), crypto records", status: "pending", avatar: "/images/avatars/08.png" },
      { id: "bi4", clientId: "c11", clientName: "David Park", detail: "Missing: payroll summary, equipment list", status: "pending", avatar: "/images/avatars/11.png" },
      { id: "bi5", clientId: "c12", clientName: "Jasmine Torres", detail: "Missing: 1099-NEC (freelance), expense records", status: "pending", avatar: "/images/avatars/12.png" },
      { id: "bi6", clientId: "c17", clientName: "Tyrone Mitchell", detail: "Missing: 1099-K (Uber), mileage log, prior return", status: "pending", avatar: "/images/avatars/05.png" },
    ],
  },
  {
    id: "bo2", type: "invoices", title: "Generate outstanding invoices",
    description: "3 completed returns need invoices generated and sent.",
    items: [
      { id: "bi7", clientId: "c6", clientName: "Roberto Fuentes", detail: "$500 - Business Return (1120S + 1040)", status: "pending", avatar: "/images/avatars/06.png" },
      { id: "bi8", clientId: "c1", clientName: "Marcus Chen", detail: "$500 - Business Return (Sch C + 1040)", status: "pending", avatar: "/images/avatars/01.png" },
      { id: "bi9", clientId: "c11", clientName: "David Park", detail: "$500 - Business Return (1120S + 1040)", status: "pending", avatar: "/images/avatars/11.png" },
    ],
  },
  {
    id: "bo3", type: "stage_advance", title: "Advance to In Prep",
    description: "2 clients have all documents and are ready to move to preparation.",
    items: [
      { id: "bi10", clientId: "c9", clientName: "Miguel Sandoval", detail: "Docs Complete → In Prep (Sandoval Plumbing)", status: "pending", avatar: "/images/avatars/09.png" },
      { id: "bi11", clientId: "c19", clientName: "Anthony Russo", detail: "Docs Complete → In Prep (Investment income)", status: "pending", avatar: "/images/avatars/07.png" },
    ],
  },
];

// --- Deduction Suggestions ---
// c18 Mei-Lin Wu QBI merged into PetalInsight supplementary data
export const deductionSuggestions: DeductionSuggestion[] = [
  {
    id: "ds2", clientId: "c15", clientName: "Carlos & Elena Mendez",
    deductionType: "Equipment Depreciation", section: "Section 179",
    estimatedSavings: 8200,
    description: "$32K paint booth (Dec). Full deduction vs 7-year depreciation.",
    status: "pending",
  },
];

// --- IRS Notice ---
export const irsNotices: IrsNotice[] = [
  {
    id: "in1", clientId: "c6", clientName: "Roberto Fuentes",
    noticeType: "CP2000", receivedDate: "2026-03-15",
    summary: "IRS proposes additional tax of $3,200 for unreported 1099-MISC income from a subcontractor payment in 2024.",
    aiDraftResponse: "Dear IRS,\n\nWe are responding to CP2000 Notice dated March 10, 2026 for Roberto Fuentes (SSN: XXX-XX-4521).\n\nThe income referenced in the notice ($12,800 from Allied Freight) was reported on Schedule C, Line 1 of the 2024 return as part of gross receipts for Fuentes Transport Inc. The 1099-MISC was included in the total business income of $312,450.\n\nEnclosed please find:\n1. Copy of 2024 Form 1040 Schedule C\n2. 1099-MISC from Allied Freight\n3. Business income reconciliation worksheet\n\nWe respectfully request the proposed adjustment be withdrawn.\n\nSincerely,\nAntonio Vazquez, EA\nVazant Consulting",
    status: "pending",
  },
];

// --- Extension Predictions ---
// Extension predictions merged into PetalInsight supplementary data
export const extensionPredictions: ExtensionPrediction[] = [];

// --- Estimated Tax ---
// c18 Mei-Lin Wu quarterly estimates merged into PetalInsight supplementary data
export const estimatedTaxCalcs: EstimatedTaxCalc[] = [
  {
    id: "et2", clientId: "c12", clientName: "Jasmine Torres",
    quarterlyAmounts: { q1: 1800, q2: 1800, q3: 1800, q4: 1800 },
    totalEstimated: 7200,
    basis: "Freelance income $42K. First year, estimates recommended to avoid penalty.",
  },
];

// --- Portal Nudges ---
export const portalNudges: PortalNudge[] = [
  {
    id: "pn1", clientId: "c7", clientName: "Ashley Kim",
    daysSinceAction: 2, lastAction: "Intake link sent",
    suggestedNudge: "Hi Ashley! I sent over your intake form a couple days ago. When you get a chance, just follow the link to get started. It only takes about 10 minutes!",
    status: "pending",
  },
  {
    id: "pn2", clientId: "c20", clientName: "Fatima Al-Hassan",
    daysSinceAction: 1, lastAction: "Intake link sent",
    suggestedNudge: "Hi Fatima! Elena Mendez recommended you reach out. I sent your intake form yesterday. Feel free to start whenever you're ready!",
    status: "pending",
  },
];

// --- Voice Dump Session ---
export const voiceDumpSession: VoiceDumpSession = {
  id: "vd1",
  timestamp: "2026-03-28T09:15:00",
  duration: "0:42",
  transcript: "Check in with DeShawn about his W-2, he needs to upload it ASAP. Remind Priya about her 1099 from TikTok. Call Maria at 7 tonight. Schedule Vladimir for an extension discussion this week. Pick up lunch for the team. Follow up with Tyrone about his mileage log, he's been dragging his feet.",
  parsedItems: [
    { id: "vp1", text: "Check in with DeShawn about his W-2 upload", clientId: "c4", clientName: "DeShawn Williams", matchType: "confident", category: "action", confidence: 95, status: "pending" },
    { id: "vp2", text: "Remind Priya about 1099-NEC from TikTok", clientId: "c2", clientName: "Priya Sharma", matchType: "confident", category: "action", confidence: 92, status: "pending" },
    { id: "vp3", text: "Call Maria at 7 PM tonight", matchType: "none", category: "todo", confidence: 88, status: "pending" },
    { id: "vp4", text: "Schedule Vladimir for extension discussion", clientId: "c13", clientName: "Vladimir Petrov", matchType: "confident", category: "action", confidence: 94, status: "pending" },
    { id: "vp5", text: "Pick up lunch for the team", matchType: "none", category: "todo", confidence: 96, status: "pending" },
    { id: "vp6", text: "Follow up with Tyrone about mileage log", clientId: "c17", clientName: "Tyrone Mitchell", matchType: "confident", category: "action", confidence: 91, status: "pending" },
  ],
};

// --- To-do Items ---
export const initialTodos: TodoItem[] = [
  // AI-generated
  { id: "t1", text: "Review Roberto Fuentes 1120S return", done: false, source: "ai", createdAt: "2026-03-28T07:00:00", clientId: "c6", clientName: "Roberto Fuentes" },
  { id: "t3", text: "Send Priya missing docs reminder", done: false, source: "ai", createdAt: "2026-03-28T08:00:00", clientId: "c2", clientName: "Priya Sharma" },
  { id: "t4", text: "Review Mei-Lin Wu Schedule C", done: false, source: "ai", createdAt: "2026-03-28T08:00:00", clientId: "c18", clientName: "Mei-Lin Wu" },
  // Manual
  { id: "t2", text: "Call David Park at 3:00 PM", done: false, source: "manual", createdAt: "2026-03-28T07:30:00", clientId: "c11", clientName: "David Park" },
  { id: "t5", text: "Follow up with Vladimir about extension", done: false, source: "manual", createdAt: "2026-03-27T16:00:00", clientId: "c13", clientName: "Vladimir Petrov" },
  // Manual items
  { id: "t8", text: "Check in with DeShawn about his W-2 upload", done: false, source: "manual", createdAt: "2026-03-28T09:15:00", clientId: "c4", clientName: "DeShawn Williams" },
  { id: "t9", text: "Call Maria at 7 PM tonight", done: false, source: "manual", createdAt: "2026-03-28T09:15:00" },
  { id: "t10", text: "Follow up with Tyrone about mileage log", done: false, source: "manual", createdAt: "2026-03-28T09:15:00", clientId: "c17", clientName: "Tyrone Mitchell" },
  // Completed
  { id: "t6", text: "Process Rodriguez 8879 e-signature", done: true, source: "ai", createdAt: "2026-03-27T14:00:00", clientId: "c3", clientName: "James & Sofia Rodriguez" },
  { id: "t7", text: "Send Ashley Kim intake reminder", done: true, source: "ai", createdAt: "2026-03-27T10:00:00", clientId: "c7", clientName: "Ashley Kim" },
  { id: "t11", text: "Pick up lunch for the team", done: true, source: "manual", createdAt: "2026-03-28T09:15:00" },
];

// --- Missing Documents Checklist (for document-request demo) ---
export const missingDocChecklists: Record<string, { doc: string; status: "missing" | "received" | "partial" }[]> = {
  c2: [
    { doc: "1099-NEC (TikTok)", status: "missing" },
    { doc: "1099-NEC (Brand Partnerships)", status: "missing" },
    { doc: "Business Bank Statements", status: "missing" },
    { doc: "Estimated Payment Receipts", status: "missing" },
    { doc: "W-2 (Part-time job)", status: "received" },
    { doc: "Driver's License", status: "received" },
    { doc: "Prior Year Return", status: "received" },
  ],
  c4: [
    { doc: "W-2 (Employer)", status: "missing" },
    { doc: "Dependent SSN Cards", status: "missing" },
    { doc: "Childcare Expense Records", status: "missing" },
    { doc: "Prior Year Return", status: "missing" },
    { doc: "Driver's License", status: "received" },
    { doc: "Social Security Card", status: "partial" },
  ],
};

// --- Auto-Categorize Demo ---
export interface AutoCategorizeItem {
  id: string;
  clientName: string;
  originalFileName: string;
  detectedType: string;
  confidence: number;
  convertedToPdf: boolean;
  readable: boolean;
}

export const autoCategorizeItems: AutoCategorizeItem[] = [
  { id: "ac1", clientName: "Marcus Chen", originalFileName: "IMG_4521.jpg", detectedType: "W-2 (Golden Dragon LLC)", confidence: 97, convertedToPdf: true, readable: true },
  { id: "ac2", clientName: "Priya Sharma", originalFileName: "photo_1099.heic", detectedType: "1099-NEC (TikTok Inc.)", confidence: 84, convertedToPdf: true, readable: true },
  { id: "ac3", clientName: "Tyrone Mitchell", originalFileName: "scan0034.jpg", detectedType: "1099-K (Uber)", confidence: 42, convertedToPdf: true, readable: false },
];

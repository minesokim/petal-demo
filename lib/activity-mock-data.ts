// ============================================================
// DOCKET AUDIT TRAIL — Per-client activity events
// ============================================================

import type { ActivityEvent } from "./mock-data";

// ============================================================
// ACTIVITY DATA BY CLIENT
// ============================================================

const activityData: Record<string, ActivityEvent[]> = {
  // Marcus Chen (c1) — Restaurant owner, in preparation
  c1: [
    { id: "a1-01", timestamp: "2026-03-18T08:00:00", type: "email_sent", description: "Sent engagement letter and 7216 consent form", actor: "antonio", channel: "email" },
    { id: "a1-02", timestamp: "2026-03-18T10:30:00", type: "portal_login", description: "Marcus logged into the client portal for the first time", actor: "client", channel: "portal" },
    { id: "a1-03", timestamp: "2026-03-18T10:45:00", type: "signature_completed", description: "Marcus signed engagement letter", actor: "client", channel: "portal" },
    { id: "a1-04", timestamp: "2026-03-18T10:46:00", type: "signature_completed", description: "Marcus signed 7216 consent form", actor: "client", channel: "portal" },
    { id: "a1-05", timestamp: "2026-03-20T09:00:00", type: "document_uploaded", description: "Marcus uploaded Driver's License via portal", actor: "client", channel: "portal" },
    { id: "a1-06", timestamp: "2026-03-20T09:01:00", type: "ai_classification", description: "AI classified document as Photo ID (99% confidence)", actor: "ai", detail: "Document matched against ID template. Extracted name: Marcus Chen. Photo quality: good." },
    { id: "a1-07", timestamp: "2026-03-22T14:00:00", type: "document_uploaded", description: "Marcus uploaded Business Expenses 2025 spreadsheet", actor: "client", channel: "portal" },
    { id: "a1-08", timestamp: "2026-03-24T10:00:00", type: "document_uploaded", description: "Marcus uploaded W-2 from Golden Dragon LLC", actor: "client", channel: "portal" },
    { id: "a1-09", timestamp: "2026-03-24T10:02:00", type: "ai_extraction", description: "AI extracted 8 fields from W-2: wages $58,000, federal withheld $7,200", actor: "ai", detail: "Extraction confidence: 97%. Wages decreased 40% from prior year ($96,000). Flagged for preparer review — consistent with reported Pasadena location closure." },
    { id: "a1-10", timestamp: "2026-03-24T10:03:00", type: "ai_flag", description: "AI flagged: wages decreased 40% from prior year", actor: "ai", detail: "W-2 wages $58,000 vs prior year $96,000. Drop of $38,000 (40%). This may be expected if business changes occurred. Requires manual confirmation." },
    { id: "a1-11", timestamp: "2026-03-24T10:05:00", type: "document_uploaded", description: "Marcus uploaded 1099-NEC from consulting", actor: "client", channel: "portal" },
    { id: "a1-12", timestamp: "2026-03-24T10:07:00", type: "ai_extraction", description: "AI extracted 1099-NEC: $12,000 non-employee compensation", actor: "ai", detail: "New income source not present in 2024. Schedule C may be required." },
    { id: "a1-13", timestamp: "2026-03-27T11:00:00", type: "message_received", description: "Marcus emailed: all P&Ls uploaded, Riverside includes closeout", actor: "client", channel: "email" },
    { id: "a1-14", timestamp: "2026-03-27T14:00:00", type: "message_sent", description: "Antonio replied: will review for call on the 30th", actor: "antonio", channel: "portal" },
    { id: "a1-15", timestamp: "2026-03-27T15:00:00", type: "note_added", description: "Antonio added note: Marcus may close 3rd location, revenue drop expected", actor: "antonio" },
    { id: "a1-16", timestamp: "2026-03-28T09:00:00", type: "message_sent", description: "Antonio emailed question about Riverside closeout equipment classification", actor: "antonio", channel: "email" },
    { id: "a1-17", timestamp: "2026-03-28T09:30:00", type: "stage_changed", description: "Stage changed from Collecting Docs to In Preparation", actor: "system" },
  ],

  // Priya Sharma (c2) — TikTok creator, collecting docs
  c2: [
    { id: "a2-01", timestamp: "2026-03-20T08:00:00", type: "email_sent", description: "Sent engagement letter to Priya", actor: "antonio", channel: "email" },
    { id: "a2-02", timestamp: "2026-03-20T09:00:00", type: "portal_login", description: "Priya logged into the client portal", actor: "client", channel: "portal" },
    { id: "a2-03", timestamp: "2026-03-20T09:15:00", type: "signature_completed", description: "Priya signed engagement letter", actor: "client", channel: "portal" },
    { id: "a2-04", timestamp: "2026-03-22T09:00:00", type: "document_uploaded", description: "Priya uploaded Driver's License (phone photo)", actor: "client", channel: "portal" },
    { id: "a2-05", timestamp: "2026-03-22T09:01:00", type: "ai_classification", description: "AI classified as Photo ID — image quality warning", actor: "ai", detail: "Photo is slightly blurry. All fields readable but may need re-upload if OCR fails on address." },
    { id: "a2-06", timestamp: "2026-03-27T14:30:00", type: "document_uploaded", description: "Priya uploaded 1099-NEC from TikTok (phone photo)", actor: "client", channel: "portal" },
    { id: "a2-07", timestamp: "2026-03-27T14:32:00", type: "ai_extraction", description: "AI extracted 1099-NEC: $28,400 from TikTok Inc.", actor: "ai", detail: "Extraction from phone photo. Confidence: 92%. Some fields unclear — consider requesting original PDF from TikTok." },
    { id: "a2-08", timestamp: "2026-03-27T14:30:00", type: "message_received", description: "Priya asked about uploading her 1099 via portal", actor: "client", channel: "portal" },
    { id: "a2-09", timestamp: "2026-03-27T14:45:00", type: "message_sent", description: "Antonio explained upload process, mentioned phone photo option", actor: "antonio", channel: "portal" },
    { id: "a2-10", timestamp: "2026-03-28T09:15:00", type: "message_received", description: "Priya emailed: found another 1099 from Revolve brand deal", actor: "client", channel: "email" },
    { id: "a2-11", timestamp: "2026-03-28T10:20:00", type: "message_received", description: "Priya said thanks via portal", actor: "client", channel: "portal" },
  ],

  // James & Sofia Rodriguez (c3) — Pay & Sign, 12/12 docs
  c3: [
    { id: "a3-01", timestamp: "2026-03-12T08:00:00", type: "signature_sent", description: "Sent engagement letter and 7216 consent to James & Sofia", actor: "antonio", channel: "email" },
    { id: "a3-02", timestamp: "2026-03-12T10:00:00", type: "signature_completed", description: "James signed engagement letter and 7216 consent", actor: "client", channel: "portal" },
    { id: "a3-03", timestamp: "2026-03-14T10:00:00", type: "document_uploaded", description: "James uploaded Driver's License (James)", actor: "client", channel: "portal" },
    { id: "a3-04", timestamp: "2026-03-14T10:05:00", type: "document_uploaded", description: "Sofia uploaded Driver's License (Sofia)", actor: "client", channel: "portal" },
    { id: "a3-05", timestamp: "2026-03-15T10:00:00", type: "document_uploaded", description: "James uploaded W-2 from Riverside County Public Works", actor: "client", channel: "portal" },
    { id: "a3-06", timestamp: "2026-03-15T10:02:00", type: "ai_extraction", description: "AI extracted W-2: $72,400 wages, $9,800 federal withheld", actor: "ai", detail: "Wages up 3% from prior year ($70,200). Normal increase, no flags." },
    { id: "a3-07", timestamp: "2026-03-15T10:05:00", type: "document_uploaded", description: "Sofia uploaded W-2 from Inland Empire School District", actor: "client", channel: "portal" },
    { id: "a3-08", timestamp: "2026-03-15T10:07:00", type: "ai_extraction", description: "AI extracted W-2: $54,200 wages, $6,100 federal withheld", actor: "ai", detail: "Teaching position, same employer as prior year. Wages up 3.4% from $52,400." },
    { id: "a3-09", timestamp: "2026-03-16T09:00:00", type: "document_uploaded", description: "James uploaded 1099-INT from Chase Bank", actor: "client", channel: "portal" },
    { id: "a3-10", timestamp: "2026-03-18T08:00:00", type: "document_uploaded", description: "James uploaded Mortgage Interest 1098", actor: "client", channel: "portal" },
    { id: "a3-11", timestamp: "2026-03-20T10:00:00", type: "stage_changed", description: "All documents received — stage changed to Ready to Prep", actor: "system" },
    { id: "a3-12", timestamp: "2026-03-22T08:00:00", type: "stage_changed", description: "Antonio began preparation — stage changed to In Preparation", actor: "antonio" },
    { id: "a3-13", timestamp: "2026-03-25T16:00:00", type: "stage_changed", description: "Preparation complete — stage changed to Client Review", actor: "antonio" },
    { id: "a3-14", timestamp: "2026-03-26T14:00:00", type: "call_logged", description: "Antonio called James to walk through the completed return (8:42)", actor: "antonio", channel: "voice" },
    { id: "a3-15", timestamp: "2026-03-27T07:45:00", type: "message_received", description: "James said: we're ready to sign", actor: "client", channel: "portal" },
    { id: "a3-16", timestamp: "2026-03-27T08:00:00", type: "signature_sent", description: "Form 8879 sent for e-signature", actor: "antonio", channel: "portal" },
    { id: "a3-17", timestamp: "2026-03-27T16:00:00", type: "stage_changed", description: "Stage changed to Pay & Sign", actor: "system" },
    { id: "a3-18", timestamp: "2026-03-27T18:00:00", type: "payment_received", description: "Full payment received: $400 via Stripe", actor: "system" },
    { id: "a3-19", timestamp: "2026-03-27T19:00:00", type: "signature_completed", description: "James signed Form 8879", actor: "client", channel: "portal" },
    { id: "a3-20", timestamp: "2026-03-27T21:00:00", type: "signature_completed", description: "Sofia signed Form 8879", actor: "client", channel: "portal" },
  ],

  // DeShawn Williams (c4) — Stale, urgent
  c4: [
    { id: "a4-01", timestamp: "2026-03-18T09:00:00", type: "email_sent", description: "Sent intake form and welcome email to DeShawn", actor: "antonio", channel: "email" },
    { id: "a4-02", timestamp: "2026-03-18T09:30:00", type: "document_uploaded", description: "DeShawn uploaded Driver's License", actor: "client", channel: "portal" },
    { id: "a4-03", timestamp: "2026-03-18T09:31:00", type: "ai_classification", description: "AI classified as Photo ID (98% confidence)", actor: "ai" },
    { id: "a4-04", timestamp: "2026-03-20T18:00:00", type: "message_received", description: "DeShawn said: will try this weekend", actor: "client", channel: "portal" },
    { id: "a4-05", timestamp: "2026-03-22T10:00:00", type: "message_sent", description: "Antonio reminded about W-2 and deposit", actor: "antonio", channel: "portal" },
    { id: "a4-06", timestamp: "2026-03-25T10:30:00", type: "sms_sent", description: "Antonio sent SMS nudge: W-2 + deposit needed, 18 days to deadline", actor: "antonio", channel: "sms" },
    { id: "a4-07", timestamp: "2026-03-26T12:15:00", type: "sms_replied", description: "DeShawn replied: sorry been swamped, will try this weekend", actor: "client", channel: "sms" },
    { id: "a4-08", timestamp: "2026-03-28T08:00:00", type: "ai_flag", description: "AI flagged: client at risk of needing extension — 1 of 6 docs, no deposit", actor: "ai", detail: "DeShawn has submitted 1 of 6 required documents and has not paid the $150 deposit. At current pace, extension filing is recommended by April 5." },
  ],

  // David Park (c11) — S-Corp, complex
  c11: [
    { id: "a11-01", timestamp: "2026-03-22T08:00:00", type: "email_sent", description: "Sent document request checklist (20 items) to David", actor: "antonio", channel: "email" },
    { id: "a11-02", timestamp: "2026-03-25T08:00:00", type: "document_uploaded", description: "David uploaded W-2 from Park Family Dental PC", actor: "client", channel: "portal" },
    { id: "a11-03", timestamp: "2026-03-25T08:02:00", type: "ai_extraction", description: "AI extracted W-2: $185,000 salary, $38,200 federal withheld", actor: "ai", detail: "S-Corp officer compensation. Up from $170,000 prior year (8.8% increase). Within reasonable comp range for dental practice of this size." },
    { id: "a11-04", timestamp: "2026-03-25T11:00:00", type: "message_sent", description: "Antonio asked about scheduling a call re: payroll and equipment", actor: "antonio", channel: "portal" },
    { id: "a11-05", timestamp: "2026-03-26T08:00:00", type: "message_received", description: "David suggested Thursday at 2pm", actor: "client", channel: "portal" },
    { id: "a11-06", timestamp: "2026-03-26T09:30:00", type: "message_received", description: "David emailed P&L and payroll summary", actor: "client", channel: "email" },
    { id: "a11-07", timestamp: "2026-03-26T09:32:00", type: "ai_classification", description: "AI classified 2 attachments: P&L Statement + Payroll Summary", actor: "ai" },
    { id: "a11-08", timestamp: "2026-03-27T08:15:00", type: "message_received", description: "David asked to reschedule call from 2pm to 3pm — patient emergency", actor: "client", channel: "portal" },
    { id: "a11-09", timestamp: "2026-03-27T08:30:00", type: "appointment_scheduled", description: "Call rescheduled to 3pm", actor: "antonio" },
    { id: "a11-10", timestamp: "2026-03-27T15:00:00", type: "call_logged", description: "Review call with David (22:15) — discussed officer comp, Section 179 dental chair, Q3 payroll variance", actor: "antonio", channel: "voice" },
    { id: "a11-11", timestamp: "2026-03-27T20:00:00", type: "document_uploaded", description: "David uploaded 1120S Profit & Loss statement", actor: "client", channel: "portal" },
    { id: "a11-12", timestamp: "2026-03-28T07:00:00", type: "note_added", description: "Antonio updated notes: meticulous about documentation, schedule extra review time", actor: "antonio" },
  ],
};

// ============================================================
// HELPERS
// ============================================================

export function getClientActivity(clientId: string): ActivityEvent[] {
  const events = activityData[clientId] || [];
  // Return sorted by timestamp descending (newest first)
  return [...events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function getClientActivityAsc(clientId: string): ActivityEvent[] {
  const events = activityData[clientId] || [];
  return [...events].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export function getActivityByActor(clientId: string, actor: string): ActivityEvent[] {
  return getClientActivity(clientId).filter(e => e.actor === actor);
}

export function getAllActivity(): (ActivityEvent & { clientId: string; clientName: string })[] {
  const { clients } = require("./mock-data");
  const all: (ActivityEvent & { clientId: string; clientName: string })[] = [];
  for (const [clientId, events] of Object.entries(activityData)) {
    const client = clients.find((c: { id: string }) => c.id === clientId);
    const clientName = client?.fullName || clientId;
    for (const event of events as ActivityEvent[]) {
      all.push({ ...event, clientId, clientName });
    }
  }
  return all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

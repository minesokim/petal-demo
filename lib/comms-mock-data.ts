// ============================================================
// PETAL UNIFIED COMMS — Multi-channel message data
// ============================================================

export type CommChannel = "portal" | "email" | "sms" | "voice" | "video";

export interface EmailAttachment {
  id: string;
  fileName: string;
  fileSize: string;
  docType?: string; // "w2", "1099_nec", etc.
  processed?: boolean;
}

export interface UnifiedMessage {
  id: string;
  sender: "client" | "preparer" | "system";
  channel: CommChannel;
  content: string;
  timestamp: string; // ISO 8601
  // Email-specific
  emailSubject?: string;
  // Attachments — can come from any channel (portal upload, email, SMS photo)
  attachments?: EmailAttachment[];
  emailAttachments?: EmailAttachment[]; // legacy alias
  // Voice/Video call specific
  voiceDuration?: string; // "12:34"
  voiceAiSummary?: string;
  voiceTranscript?: string;
  voiceKeyPoints?: string[];
  voiceActionItems?: string[];
  // Video-specific
  videoPlatform?: "zoom" | "google_meet";
  videoRecordingUrl?: string;
  suggestedItems?: string[]; // AI-suggested open items from the call
  // System card (same pattern as before)
  systemCard?: { type: string; title: string; description: string; action?: string };
}

// ============================================================
// UNIFIED THREADS
// ============================================================

export const unifiedThreads: Record<string, UnifiedMessage[]> = {
  // Priya Sharma (c2) — portal + email mix
  c2: [
    { id: "u2-1", sender: "client", channel: "portal", content: "Hi Antonio! I have my TikTok 1099 but I'm not sure how to upload it. Can you help?", timestamp: "2026-03-27T14:30:00" },
    { id: "u2-2", sender: "preparer", channel: "portal", content: "Hey Priya! The easiest way is to log into your portal and go to the Docs tab. There's an upload button right at the top. You can take a photo of the 1099 with your phone too — we'll extract the data automatically.", timestamp: "2026-03-27T14:45:00" },
    { id: "u2-3", sender: "client", channel: "portal", content: "Oh perfect! I'll do that now. Also, do I need to report the $500 I made from a one-time sponsored post?", timestamp: "2026-03-27T14:52:00" },
    { id: "u2-4", sender: "preparer", channel: "portal", content: "Yes, all income needs to be reported even if you don't receive a 1099 for it. We'll include it on your Schedule C.", timestamp: "2026-03-27T15:10:00" },
    { id: "u2-5", sender: "client", channel: "email", content: "Hey Antonio, I found another 1099 from a brand deal I forgot about. Attaching it here — it's from Revolve. Let me know if you need anything else!", emailSubject: "Found another 1099", emailAttachments: [{ id: "att-201", fileName: "1099-NEC_Revolve.pdf", fileSize: "92 KB", docType: "1099_nec" }], timestamp: "2026-03-28T09:15:00" },
    { id: "u2-6", sender: "system", channel: "portal", content: "", timestamp: "2026-03-28T09:15:00", systemCard: { type: "status", title: "Return Status", description: "3 of 7 documents received. Once complete, preparation takes 3–5 business days.", action: "View Status" } },
    { id: "u2-7", sender: "client", channel: "portal", content: "Just uploaded my TikTok 1099 through the portal!", timestamp: "2026-03-28T10:20:00", attachments: [{ id: "att-202", fileName: "1099-NEC_TikTok.pdf", fileSize: "89 KB", docType: "1099_nec" }] },
    { id: "u2-8", sender: "client", channel: "sms", content: "Antonio, found my bank statement for the business account. Took a pic, hope its clear enough", timestamp: "2026-03-29T08:45:00", attachments: [{ id: "att-203", fileName: "Chase_Business_Statement.jpg", fileSize: "3.2 MB" }] },
  ],

  // James & Sofia Rodriguez (c3) — portal + voice call
  c3: [
    { id: "u3-1", sender: "client", channel: "portal", content: "Hi Antonio, just wanted to check in. Are our returns done?", timestamp: "2026-03-25T10:00:00" },
    { id: "u3-2", sender: "preparer", channel: "portal", content: "Hi James! Yes, your returns are complete. I just need you and Sofia to sign Form 8879 to authorize e-filing.", timestamp: "2026-03-26T09:00:00" },
    { id: "u3-3", sender: "preparer", channel: "voice", content: "", timestamp: "2026-03-26T14:00:00", voiceDuration: "8:42", voiceAiSummary: "Antonio walked James through the completed return. Discussed rental income reporting on Schedule E, the mortgage interest deduction, and the $340 interest from Chase. James confirmed all numbers looked correct. Sofia will sign the 8879 this evening.", voiceKeyPoints: ["Return walkthrough completed — all figures confirmed", "Rental income of $24,000 on Schedule E reviewed", "Mortgage interest deduction of $18,200 verified", "Total refund: $3,840 federal, $420 state"], voiceActionItems: ["Sofia needs to sign 8879 by end of day", "Antonio to e-file once both signatures received"], suggestedItems: ["Send 8879 to Sofia for signature", "E-file federal and state returns after both signatures", "Discuss estimated payments for rental income next year"], voiceTranscript: "Antonio: Hey James, thanks for hopping on. I wanted to walk you through your return before you sign.\n\nJames: Sounds good, we're excited to get this filed.\n\nAntonio: So starting with income — your W-2 from Riverside County shows $72,400, and Sofia's from the school district is $54,200. Plus the $340 interest from Chase and $24,000 in rental income from Palm Ave.\n\nJames: That all sounds right. The rental has been steady at $2,000 a month.\n\nAntonio: Perfect. On deductions, your mortgage interest was $18,200, property taxes $4,800, and the rental expenses came to $8,400. You're looking at a federal refund of $3,840.\n\nJames: That's great! Sofia will sign tonight — she's at school right now.\n\nAntonio: Perfect, once I have both signatures I'll e-file same day." },
    { id: "u3-4", sender: "client", channel: "portal", content: "We're ready to sign whenever you are!", timestamp: "2026-03-27T07:45:00" },
    { id: "u3-5", sender: "system", channel: "portal", content: "", timestamp: "2026-03-27T07:45:00", systemCard: { type: "signature", title: "E-Signature Ready", description: "Form 8879 is ready for signature. Both James and Sofia need to sign.", action: "Sign Now" } },
  ],

  // DeShawn Williams (c4) — portal + SMS (stale client, needs nudging)
  c4: [
    { id: "u4-1", sender: "preparer", channel: "portal", content: "Hi DeShawn! Welcome to Vazant Consulting. I've sent your intake form — just follow the link to get started.", timestamp: "2026-03-18T09:00:00" },
    { id: "u4-2", sender: "client", channel: "portal", content: "Thanks! I'll try to get to it this weekend.", timestamp: "2026-03-20T18:00:00" },
    { id: "u4-3", sender: "preparer", channel: "portal", content: "No problem! We still need your W-2 and the $150 deposit to start. April 15 is coming up.", timestamp: "2026-03-22T10:00:00" },
    { id: "u4-4", sender: "preparer", channel: "sms", content: "Hey DeShawn, just checking in. We still need your W-2 and deposit to get started on your return. April 15 deadline is 18 days away. Any questions I can help with?", timestamp: "2026-03-25T10:30:00" },
    { id: "u4-5", sender: "client", channel: "sms", content: "Sorry been swamped at work. Will try this weekend", timestamp: "2026-03-26T12:15:00" },
    { id: "u4-6", sender: "system", channel: "portal", content: "", timestamp: "2026-03-26T12:15:00", systemCard: { type: "payment", title: "Deposit Required", description: "$150 deposit required to begin preparing your return.", action: "Pay Now" } },
    { id: "u4-7", sender: "client", channel: "sms", content: "hey antonio finally got my w2. sending a pic", timestamp: "2026-03-29T19:30:00", attachments: [{ id: "att-401", fileName: "W2_photo.jpg", fileSize: "4.1 MB", docType: "w2" }] },
    { id: "u4-8", sender: "preparer", channel: "sms", content: "Got it DeShawn! I can see the W-2. Let me process it. Can you also send your SSN card photo when you get a chance?", timestamp: "2026-03-29T20:00:00" },
  ],

  // David Park (c11) — portal + email + voice (complex S-Corp)
  c11: [
    { id: "u11-1", sender: "preparer", channel: "portal", content: "David, your S-Corp return is coming along. I have questions about the payroll summary and new equipment. Can we schedule a call?", timestamp: "2026-03-25T11:00:00" },
    { id: "u11-2", sender: "client", channel: "portal", content: "Sure! How about Thursday at 2pm?", timestamp: "2026-03-26T08:00:00" },
    { id: "u11-3", sender: "client", channel: "email", content: "Antonio, I'm attaching the P&L from our practice management software. The payroll summary should be on page 3. ADP will send the formal W-3 next week.", emailSubject: "P&L and payroll info", emailAttachments: [{ id: "att-1101", fileName: "Park_Dental_PL_2025.pdf", fileSize: "1.2 MB", docType: "expense" }, { id: "att-1102", fileName: "Payroll_Summary_Q4.pdf", fileSize: "340 KB", docType: "expense" }], timestamp: "2026-03-26T09:30:00" },
    { id: "u11-4", sender: "preparer", channel: "email", content: "Thanks David! Got the P&L and payroll summary. I'll review before our call. Quick question — the equipment depreciation schedule, is that also in the P&L or separate?", emailSubject: "Re: P&L and payroll info", timestamp: "2026-03-26T10:15:00" },
    { id: "u11-5", sender: "client", channel: "portal", content: "Can we push the call to 3pm instead of 2? Got a patient emergency.", timestamp: "2026-03-27T08:15:00" },
    { id: "u11-6", sender: "preparer", channel: "portal", content: "Of course. Moved to 3pm. Hope everything is okay!", timestamp: "2026-03-27T08:30:00" },
    { id: "u11-7", sender: "preparer", channel: "voice", content: "", timestamp: "2026-03-27T15:00:00", voiceDuration: "22:15", voiceAiSummary: "Detailed review of Park Family Dental S-Corp return. Discussed officer compensation ($185K), new dental chair purchase ($45K — Section 179 eligible), and payroll discrepancy in Q3. David confirmed the Q3 variance was due to a temp hygienist. Equipment depreciation schedule will be emailed separately.", voiceKeyPoints: ["Officer salary $185K confirmed as reasonable comp", "New dental chair $45K qualifies for Section 179", "Q3 payroll variance: temp hygienist (not permanent hire)", "Equipment depreciation schedule coming via email", "Estimated tax liability discussed — no surprises"], voiceActionItems: ["David to send equipment depreciation schedule", "Antonio to finalize 1120S once schedule received", "Schedule review call after filing for estimated payments discussion"], suggestedItems: ["Follow up with David on equipment depreciation schedule", "Verify Section 179 election is optimal vs MACRS for dental chair", "Note Q3 payroll variance explanation (temp hygienist) in file", "Schedule estimated payments review after filing"], voiceTranscript: "Antonio: David, thanks for making time. Let's go through the S-Corp return.\n\nDavid: Sure, I've been looking forward to reviewing everything.\n\nAntonio: So your officer salary is $185,000, up from $170K last year. That's well within reasonable comp for your practice size.\n\nDavid: Right, we adjusted it based on the revenue increase.\n\nAntonio: The big item is the new dental chair — $45,000. Great news, it qualifies for Section 179 immediate expensing. Full deduction this year.\n\nDavid: That's what I was hoping. That should help offset the income increase.\n\nAntonio: Exactly. Now, I noticed a payroll bump in Q3 — about $12,000 higher than other quarters. Can you explain that?\n\nDavid: Oh yes, we had a temp hygienist covering for Sarah's maternity leave. That was August through October.\n\nAntonio: Perfect, that explains it. I'll note that. Last thing — I still need the equipment depreciation schedule. The P&L had a depreciation line but no detail.\n\nDavid: I'll get that from our accountant and email it over this week." },
    { id: "u11-8", sender: "preparer", channel: "video", content: "", timestamp: "2026-04-02T14:00:00", videoPlatform: "zoom", voiceDuration: "34:20", voiceAiSummary: "Follow-up video call to review finalized 1120S and discuss estimated tax payments for 2026. David shared his screen to walk through the equipment depreciation schedule. Confirmed Section 179 election for dental chair. Discussed Q1 estimated payment of $12,400 and set up quarterly reminders.", voiceKeyPoints: ["1120S finalized — all numbers confirmed by David", "Equipment depreciation schedule reviewed on screen share", "Section 179 election confirmed for $45K dental chair", "Q1 2026 estimated payment: $12,400 due April 15", "Quarterly payment schedule set: $12,400 per quarter", "David wants Antonio to handle estimated payment vouchers"], voiceActionItems: ["Antonio to e-file 1120S today", "Prepare Form 1040-ES vouchers for David", "Schedule mid-year check-in for August", "Send David the quarterly payment calendar"], voiceTranscript: "Antonio: David, good to see you. Let me share my screen — I've got your finalized 1120S ready.\n\nDavid: Great, I've got the depreciation schedule pulled up too.\n\nAntonio: Perfect. So the bottom line — your S-Corp net income after the Section 179 deduction on the dental chair is $142,000. Your officer salary stays at $185K.\n\nDavid: That Section 179 made a big difference.\n\nAntonio: Absolutely. Saved about $11,000 in tax. Now let's talk estimated payments for 2026. Based on this year's numbers, I'm recommending $12,400 per quarter.\n\nDavid: That sounds manageable. Can you set up the vouchers for me?\n\nAntonio: Of course. I'll send the 1040-ES vouchers with the due dates. First one is April 15.", suggestedItems: ["E-file 1120S for Park Family Dental PC", "Prepare 1040-ES vouchers ($12,400/quarter)", "Send David quarterly payment calendar", "Schedule August mid-year check-in"] },
  ],

  // Marcus Chen (c1) — portal + email
  c1: [
    { id: "u1-1", sender: "client", channel: "email", content: "Hi Antonio, I've uploaded all three restaurant P&Ls to the portal. The Riverside location numbers include the closeout costs for January. Let me know if anything looks off.", emailSubject: "All P&Ls uploaded", timestamp: "2026-03-27T11:00:00" },
    { id: "u1-2", sender: "preparer", channel: "portal", content: "Got them, thanks Marcus! I'll review everything and we'll go over it in our call on the 30th.", timestamp: "2026-03-27T14:00:00" },
    { id: "u1-3", sender: "preparer", channel: "email", content: "Marcus — quick follow-up. The Riverside closeout shows a $23,000 loss on equipment disposal. I want to make sure we classify this correctly. Was this equipment fully depreciated or did it still have book value?", emailSubject: "Question on Riverside closeout", timestamp: "2026-03-28T09:00:00" },
    { id: "u1-4", sender: "client", channel: "email", content: "Good question. The ovens had about $8,000 in remaining book value. Everything else was fully depreciated. I can pull the depreciation schedule if you need it.", emailSubject: "Re: Question on Riverside closeout", timestamp: "2026-03-28T11:30:00" },
  ],

  // Carlos Mendez (c15) — portal only
  c15: [
    { id: "u15-1", sender: "client", channel: "portal", content: "Elena wants to know if we can deduct the new paint booth equipment we bought in December.", timestamp: "2026-03-27T10:00:00" },
    { id: "u15-2", sender: "preparer", channel: "portal", content: "Great question! Yes, the paint booth likely qualifies for Section 179 immediate expensing. Full deduction in 2025 instead of 7-year depreciation. How much was it?", timestamp: "2026-03-27T10:30:00" },
    { id: "u15-3", sender: "client", channel: "portal", content: "It was about $32,000. That would be a big deduction!", timestamp: "2026-03-27T11:00:00" },
    { id: "u15-4", sender: "preparer", channel: "portal", content: "Significant deduction. I'll include it as Section 179. Should save roughly $8,200 in taxes. Numbers ready for our review Monday.", timestamp: "2026-03-27T11:30:00" },
  ],

  // Tyrone Mitchell (c17) — portal + SMS (stale)
  c17: [
    { id: "u17-1", sender: "system", channel: "portal", content: "Last activity 9 days ago. 2 of 5 documents submitted.", timestamp: "2026-03-19T10:00:00", systemCard: { type: "status", title: "Stale Client", description: "Last activity 9 days ago. 2 of 5 documents submitted.", action: "Send Reminder" } },
    { id: "u17-2", sender: "preparer", channel: "sms", content: "Hey Tyrone, just checking in on your tax docs. We still need your 1099-K from Uber, mileage log, and prior year return. April 15 is coming up fast. Need help with anything?", timestamp: "2026-03-25T09:00:00" },
    { id: "u17-3", sender: "preparer", channel: "email", content: "Hi Tyrone, following up on your outstanding documents. I've attached a checklist of what we still need. If gathering these docs is difficult, we can discuss filing an extension — no penalty, just pushes the deadline to October 15.", emailSubject: "Your tax documents — checklist attached", emailAttachments: [{ id: "att-1701", fileName: "Tyrone_Document_Checklist.pdf", fileSize: "45 KB" }], timestamp: "2026-03-26T10:00:00" },
  ],

  // System-only threads for inactive clients
  c7: [
    { id: "u7-1", sender: "system", channel: "portal", content: "New client. Intake form sent 2 days ago — no portal login yet.", timestamp: "2026-03-26T08:00:00", systemCard: { type: "status", title: "Awaiting Intake", description: "New client. Intake form sent 2 days ago — no portal login yet.", action: "Resend Intake" } },
  ],
  c13: [
    { id: "u13-1", sender: "system", channel: "portal", content: "New client. 0 of 16 documents submitted. No portal login. Extension likely.", timestamp: "2026-03-20T08:00:00", systemCard: { type: "status", title: "No Activity", description: "New client. 0 of 16 documents submitted. No portal login. Extension likely.", action: "Send Reminder" } },
  ],
};

// ============================================================
// HELPERS
// ============================================================

export function getUnifiedThread(clientId: string): UnifiedMessage[] {
  return unifiedThreads[clientId] || [];
}

export function getLastMessageTime(clientId: string): string | null {
  const thread = unifiedThreads[clientId];
  if (!thread || thread.length === 0) return null;
  return thread[thread.length - 1].timestamp;
}

// Heuristic unread count — messages from the client after the demo's "today" cutoff.
// Matches the per-channel logic used in the Messages tab so badges stay consistent.
const UNREAD_CUTOFF_MS = new Date("2026-03-28T00:00:00").getTime();
export function getUnreadCountForClient(clientId: string): number {
  const thread = unifiedThreads[clientId];
  if (!thread) return 0;
  let count = 0;
  for (const m of thread) {
    if (m.sender === "client" && new Date(m.timestamp).getTime() > UNREAD_CUTOFF_MS) {
      count++;
    }
  }
  return count;
}

// ============================================================
// SCHEDULED CALLS
// ============================================================

export interface ScheduledCall {
  id: string;
  clientId: string;
  clientName: string;
  platform: "zoom" | "google_meet";
  scheduledAt: string; // ISO 8601
  duration: number; // minutes
  subject: string;
  meetingUrl: string;
  status: "upcoming" | "in_progress" | "completed";
}

export const scheduledCalls: ScheduledCall[] = [
  {
    id: "sc-1",
    clientId: "c11",
    clientName: "David Park",
    platform: "zoom",
    scheduledAt: "2026-04-08T15:00:00",
    duration: 30,
    subject: "Estimated payments review + 1120S follow-up",
    meetingUrl: "https://zoom.us/j/92834756123",
    status: "upcoming",
  },
  {
    id: "sc-2",
    clientId: "c1",
    clientName: "Marcus Chen",
    platform: "google_meet",
    scheduledAt: "2026-04-08T16:30:00",
    duration: 45,
    subject: "Return walkthrough — all 3 restaurant P&Ls",
    meetingUrl: "https://meet.google.com/abc-defg-hij",
    status: "upcoming",
  },
  {
    id: "sc-3",
    clientId: "c6",
    clientName: "Roberto Fuentes",
    platform: "zoom",
    scheduledAt: "2026-04-09T10:00:00",
    duration: 30,
    subject: "1120S review — trucking depreciation discussion",
    meetingUrl: "https://zoom.us/j/83947561234",
    status: "upcoming",
  },
];

export function getScheduledCallsForClient(clientId: string): ScheduledCall[] {
  return scheduledCalls.filter(c => c.clientId === clientId);
}

export function getAllScheduledCalls(): ScheduledCall[] {
  return scheduledCalls;
}

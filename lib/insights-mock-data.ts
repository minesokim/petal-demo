// ============================================================
// DOCKET INSIGHTS - Mock Data for AI Intelligence Layer
// ============================================================

import type {
  DocketInsight,
  MorningBriefingData,
  TrackingBadgeData,
  ActivityEvent,
} from "./mock-data"

// ============================================================
// MORNING BRIEFING
// ============================================================

export const morningBriefing: MorningBriefingData = {
  id: "briefing-2026-03-28",
  date: "2026-03-28",
  greeting: "Good morning",
  overnight: "Priya uploaded her TikTok 1099 (4 of 7 docs now in). Carlos replied to your message about the paint booth, asking for clarification. No other portal activity.",
  today: "You have 3 calls scheduled. Miguel's return is prepped and ready for your review. James & Sofia are ready to sign.",
  concern: "DeShawn and Tyrone have gone dark. 18 days to deadline with 3 of 20 filed. You need to file 2 more this week to stay on pace with last year.",
  pacing: "You're at 15% filed vs 18% this time last year. The next 10 days are critical.",
  priorityActions: [
    { id: "action-1", label: "Review Miguel's return", variant: "primary", action: "open_prep" },
    { id: "action-2", label: "Reply to Carlos", variant: "secondary", action: "open_message" },
    { id: "action-3", label: "Sign & file Rodriguez", variant: "secondary", action: "sign_8879" },
  ],
}

// ============================================================
// CLIENT INSIGHTS
// ============================================================

export const clientInsights: Record<string, DocketInsight> = {
  // Tyrone Mitchell - Warning (stale, pattern of extending)
  c17: {
    id: "insight-c17",
    clientId: "c17",
    severity: "concern",
    category: "client_engagement",
    title: "Pattern match: likely extension",
    content: "Tyrone has 2 of 5 docs uploaded with 18 days to deadline. He opened the reminder email on 3/22 but didn't click the upload link. He hasn't logged into the portal in 9 days. Last year he also went dark mid-season and you ended up filing an extension. His Uber 1099 and mileage log are still missing. Given the pattern, recommend a direct call rather than another automated message. If he's extending again, better to file Form 4868 now rather than last minute.",
    timestamp: "2026-03-28T06:00:00",
    actions: [
      { id: "call-tyrone", label: "Call Tyrone", variant: "primary", action: "initiate_call" },
      { id: "draft-extension", label: "Draft extension", variant: "secondary", action: "draft_4868" },
      { id: "send-reminder", label: "Send final reminder", variant: "ghost", action: "send_reminder" },
    ],
    activityTrail: [
      { id: "t1", timestamp: "2026-03-08T14:30:00", type: "portal_login", description: "Logged into portal, uploaded W-2 and 1099-K" },
      { id: "t2", timestamp: "2026-03-15T10:00:00", type: "email_sent", description: "Reminder email sent: missing 1099-NEC, mileage log, health ins." },
      { id: "t3", timestamp: "2026-03-22T14:14:00", type: "email_opened", description: "Email opened (2:14 PM) - no link click, no upload" },
      { id: "t4", timestamp: "2026-03-25T11:30:00", type: "sms_sent", description: "SMS follow-up delivered - no response" },
      { id: "t5", timestamp: "2026-03-28T06:00:00", type: "stage_changed", description: "9 days since last portal visit. Extended last year (same pattern)." },
    ],
  },

  // Priya Sharma - Insight (active, making progress)
  c2: {
    id: "insight-c2",
    clientId: "c2",
    severity: "insight",
    category: "document_collection",
    title: "Making progress, needs targeted follow-up",
    content: "Priya uploaded her TikTok 1099-NEC overnight (1:47 AM). 4 of 7 docs now in. Still missing: PayPal 1099-K, estimated tax payment receipts, and health insurance form. She messaged at 2:30 PM yesterday asking how to upload the TikTok 1099, so she's actively engaged. Since she's responsive, a targeted checklist of her 3 remaining items should work. No need to escalate.",
    timestamp: "2026-03-28T01:47:00",
    actions: [
      { id: "send-checklist", label: "Send remaining items checklist", variant: "primary", action: "send_checklist" },
      { id: "reply-message", label: "Reply to her message", variant: "secondary", action: "open_thread" },
    ],
    draftMessage: {
      id: "draft-priya",
      channel: "email",
      subject: "Quick update on your remaining docs",
      content: "Hey Priya! Got your TikTok 1099, thanks for uploading that. You're almost there - just 3 more items: your PayPal 1099-K, your estimated tax payment receipts (if you made any quarterly payments), and your 1095-A health insurance form. Let me know if you need help finding any of these!",
      tone: "friendly",
    },
    activityTrail: [
      { id: "p1", timestamp: "2026-03-20T10:15:00", type: "portal_login", description: "First portal login, uploaded 2 documents" },
      { id: "p2", timestamp: "2026-03-22T16:30:00", type: "document_uploaded", description: "Uploaded 1099-NEC from brand deal" },
      { id: "p3", timestamp: "2026-03-27T14:30:00", type: "sms_replied", description: "Asked how to upload TikTok 1099" },
      { id: "p4", timestamp: "2026-03-28T01:47:00", type: "document_uploaded", description: "Uploaded TikTok 1099-NEC (late night)" },
    ],
  },

  // Miguel Sandoval - Insight (ready to prep)
  c9: {
    id: "insight-c9",
    clientId: "c9",
    severity: "insight",
    category: "prep_ready",
    title: "All docs in, ready for prep",
    content: "All 9 documents received and validated. Schedule C income is $142,000 (up 18% from $120,000 last year - business is growing). Estimated tax payments total $28,000 across 4 quarters. He wants to discuss incorporation during your 4 PM call today. Recommend prepping a simple S-Corp vs LLC comparison before the call. His return is straightforward once you decide the entity question.",
    timestamp: "2026-03-28T07:00:00",
    actions: [
      { id: "start-prep", label: "Start prep in OLT", variant: "primary", action: "open_olt" },
      { id: "view-summary", label: "View pre-prep summary", variant: "secondary", action: "view_summary" },
      { id: "scorp-notes", label: "S-Corp talking points", variant: "ghost", action: "view_notes" },
    ],
  },

  // DeShawn Williams - Alert (critical, disengaged)
  c4: {
    id: "insight-c4",
    clientId: "c4",
    severity: "alert",
    category: "client_engagement",
    title: "Disengaged new client - consider closing",
    content: "DeShawn has 1 of 6 docs, an overdue deposit, and has never logged into the portal. He was referred by the mentor network on 3/10 and completed intake on 3/12 but hasn't engaged since. The welcome email was opened once on 3/12 but the portal link was never clicked. Two follow-up emails were sent (3/18, 3/25) - neither was opened. This could be a client who signed up casually and doesn't intend to follow through. Recommend one final SMS (he may not check email regularly) and if no response in 48 hours, consider closing the engagement to free up your pipeline.",
    timestamp: "2026-03-28T08:00:00",
    actions: [
      { id: "send-sms", label: "Send final SMS", variant: "primary", action: "send_sms" },
      { id: "call-deshawn", label: "Call DeShawn", variant: "secondary", action: "initiate_call" },
      { id: "close-engagement", label: "Close engagement", variant: "ghost", action: "close_client" },
    ],
    draftMessage: {
      id: "draft-deshawn",
      channel: "sms",
      content: "Hi DeShawn, this is Antonio from Vazant Consulting. I want to make sure we get your taxes filed on time - the deadline is April 15. I still need your documents and deposit to get started. You can upload everything at your portal link. If you've decided to go a different route, just let me know. Thanks!",
      tone: "professional",
    },
    activityTrail: [
      { id: "d1", timestamp: "2026-03-10T15:00:00", type: "form_completed", description: "Referred by mentor network. Intake link sent via email." },
      { id: "d2", timestamp: "2026-03-12T11:30:00", type: "email_opened", description: "Welcome email opened once. Portal link never clicked." },
      { id: "d3", timestamp: "2026-03-12T14:00:00", type: "document_uploaded", description: "Uploaded a single document (W-2 from Amazon warehouse)." },
      { id: "d4", timestamp: "2026-03-18T10:00:00", type: "email_sent", description: "Follow-up email #1 sent - never opened." },
      { id: "d5", timestamp: "2026-03-25T10:00:00", type: "email_sent", description: "Follow-up email #2 sent - never opened." },
    ],
  },

  // James & Sofia Rodriguez - Insight (ready to sign)
  c3: {
    id: "insight-c3",
    clientId: "c3",
    severity: "insight",
    category: "signature_needed",
    title: "Ready to file - one click",
    content: "James and Sofia have paid in full and signed the 8879. Just needs your ERO countersignature to e-file. Their return includes rental property income (Schedule E) and 2 dependents - same as last 3 years. Refund is $2,180 (vs $1,920 last year, increase from higher rental depreciation). One click to sign and file.",
    timestamp: "2026-03-28T07:45:00",
    actions: [
      { id: "sign-efile", label: "Sign & e-file", variant: "primary", action: "ero_sign" },
      { id: "review-return", label: "Review return first", variant: "secondary", action: "open_return" },
    ],
  },

  // Thomas & Marie DuBois - Concern (missing crypto docs)
  c8: {
    id: "insight-c8",
    clientId: "c8",
    severity: "concern",
    category: "document_collection",
    title: "Missing crypto docs - client may need guidance",
    content: "Thomas is missing 3 crypto-related documents: his Coinbase 1099-B, his Kraken transaction history, and his DeFi wallet transaction log. He has been active on the portal (last login yesterday) so he's not disengaged - he may not know how to export these. Consider sending him step-by-step instructions for each exchange. Also: his crypto trades this year appear to involve short-term gains. You may want to flag the tax implications before finalizing. His return is otherwise ready for completion pending these docs.",
    timestamp: "2026-03-28T04:00:00",
    actions: [
      { id: "send-guide", label: "Send crypto doc guide", variant: "primary", action: "send_guide" },
      { id: "message-thomas", label: "Message Thomas", variant: "secondary", action: "open_thread" },
    ],
    draftMessage: {
      id: "draft-thomas",
      channel: "email",
      subject: "Quick guide for your crypto docs",
      content: "Hey Thomas! Your return is almost ready - just need 3 more items related to your crypto activity. I put together quick steps for exporting from Coinbase and Kraken. The DeFi wallet might need a manual log. Also, heads up: some of your trades this year will be short-term gains, so we should discuss the impact. Check the guide I attached and let me know if you have questions!",
      tone: "friendly",
    },
  },

  // Aisha Johnson - Insight (ready to sign)
  c14: {
    id: "insight-c14",
    clientId: "c14",
    severity: "insight",
    category: "signature_needed",
    title: "Simple return ready for signature",
    content: "Aisha's return is complete - W-2 from her nursing job plus Schedule C for her scrubs business. Payment received in full. Refund of $890. Waiting on her 8879 e-signature. She logged into the portal this morning, so she's likely ready to sign.",
    timestamp: "2026-03-28T09:00:00",
    actions: [
      { id: "send-8879", label: "Send 8879 for signature", variant: "primary", action: "send_8879" },
      { id: "review-return", label: "Review return", variant: "secondary", action: "open_return" },
    ],
  },

  // David Park - Concern (appointment today, docs missing)
  c11: {
    id: "insight-c11",
    clientId: "c11",
    severity: "concern",
    category: "general",
    title: "Meeting today - still missing 2 docs",
    content: "You have a 3 PM video call with David to review his S-Corp return (rescheduled from 2pm). He's still missing 2 documents: the payroll summary and equipment depreciation schedule. His return is complex with multiple employees. Consider asking him to bring these docs to the call or have him upload them before you meet. The call will be more productive if you have everything.",
    timestamp: "2026-03-28T08:15:00",
    actions: [
      { id: "send-reminder", label: "Send docs reminder", variant: "primary", action: "send_reminder" },
      { id: "view-return", label: "Review partial return", variant: "secondary", action: "open_return" },
      { id: "prep-call", label: "Prep call notes", variant: "ghost", action: "open_notes" },
    ],
    draftMessage: {
      id: "draft-david",
      channel: "sms",
      content: "Hi David! Looking forward to our 3pm call. Quick heads up - I still need your 2025 payroll summary and equipment list to finalize everything. Can you upload those before we meet, or bring them to the call? Thanks!",
      tone: "professional",
    },
  },
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

export function getInsightForClient(clientId: string): DocketInsight | undefined {
  return clientInsights[clientId]
}

export function getAllInsights(): DocketInsight[] {
  return Object.values(clientInsights)
}

export function getInsightsByPriority(): {
  needsApproval: DocketInsight[]
  atRisk: DocketInsight[]
  inProgress: DocketInsight[]
  onTrack: DocketInsight[]
} {
  const insights = getAllInsights()

  return {
    needsApproval: insights.filter(i =>
      i.category === "signature_needed" || i.category === "review_ready"
    ),
    atRisk: insights.filter(i => i.severity === "alert"),
    inProgress: insights.filter(i =>
      i.severity === "concern" &&
      i.category !== "signature_needed" &&
      i.category !== "review_ready"
    ),
    onTrack: insights.filter(i =>
      i.severity === "insight" &&
      i.category !== "signature_needed" &&
      i.category !== "review_ready"
    ),
  }
}

// Pre-computed tracking badges for quick access
export const clientTrackingBadges: Record<string, TrackingBadgeData[]> = {
  c17: [
    { id: "email-opened", label: "Email opened", variant: "success", tooltip: "Opened reminder email 3/22" },
    { id: "no-login", label: "No portal login 9d", variant: "danger", tooltip: "Last portal login: March 19" },
  ],
  c2: [
    { id: "active-today", label: "Active today", variant: "success", tooltip: "Uploaded 1099 at 1:47 AM" },
    { id: "docs-progress", label: "4/7 docs", variant: "warning", tooltip: "3 documents remaining" },
  ],
  c9: [
    { id: "all-docs", label: "All docs \u2713", variant: "success", tooltip: "All 9 documents received" },
    { id: "deposit-paid", label: "Deposit paid", variant: "success", tooltip: "Paid February 28" },
  ],
  c4: [
    { id: "deposit-overdue", label: "Deposit overdue", variant: "danger", tooltip: "$150 deposit unpaid since 3/12" },
    { id: "never-logged", label: "Never logged in", variant: "danger", tooltip: "Has never opened the portal" },
  ],
  c3: [
    { id: "paid", label: "Paid \u2713", variant: "success", tooltip: "Full payment received" },
    { id: "signed", label: "Signed \u2713", variant: "success", tooltip: "8879 signed by client" },
  ],
  c8: [
    { id: "active-yesterday", label: "Active 1d ago", variant: "success", tooltip: "Portal login yesterday" },
    { id: "docs-missing", label: "3 docs needed", variant: "warning", tooltip: "Crypto docs missing" },
  ],
  c14: [
    { id: "paid", label: "Paid \u2713", variant: "success", tooltip: "Full payment received" },
    { id: "awaiting-sig", label: "Awaiting signature", variant: "info", tooltip: "8879 pending" },
  ],
  c11: [
    { id: "call-today", label: "Call 3pm", variant: "info", tooltip: "Video call scheduled" },
    { id: "docs-missing", label: "2 docs needed", variant: "warning", tooltip: "Payroll & equipment list" },
  ],
}

export function getTrackingBadgesForClient(clientId: string): TrackingBadgeData[] {
  return clientTrackingBadges[clientId] || []
}

// ============================================================
// PETAL INSIGHTS - Mock Data for AI Intelligence Layer
// ============================================================

import type {
  PetalInsight,
  MorningBriefingData,
  TrackingBadgeData,
  ActivityEvent,
  IntelligenceBriefItem,
} from "./mock-data"

// ============================================================
// INTELLIGENCE BRIEF — Senior partner morning debrief
// ============================================================

export const intelligenceBrief: IntelligenceBriefItem[] = [
  {
    id: "brief-1",
    priority: "high",
    urgent: true,
    title: "Priya\u2019s 1099 gap",
    clientId: "c2",
    refs: ["Priya Sharma"],
    content: "Priya\u2019s TikTok 1099 came in at $34,200 but she estimated around $20K in her intake. That\u2019s a $14K gap. Either she had a much bigger year than she realized or there\u2019s a second platform she hasn\u2019t mentioned. Worth asking before you start prepping.",
    implication: "If there\u2019s a second 1099, her estimated tax payments are likely short. Could trigger underpayment penalty.",
    deepDiveQuery: "Deep dive on Priya Sharma's income discrepancy. Her TikTok 1099-NEC shows $34,200 but her intake estimated $20K. Walk me through: What are the likely explanations? Could there be a second platform (YouTube, Instagram, Patreon)? If the $34K is accurate, what does that mean for her estimated tax payments? Would she owe an underpayment penalty under the safe harbor rules? What questions should I ask her before I start prepping?",
  },
  {
    id: "brief-3",
    priority: "medium",
    urgent: true,
    title: "Filing pace",
    refs: ["Thomas DuBois", "Rodriguez", "Johnson"],
    clientId: "c8",
    content: "You\u2019ve filed 3 of 20. Last year at this point you\u2019d filed 5. The real risk is Thomas DuBois: 11 of 14 docs in, but the missing 3 are all crypto. If those don\u2019t come in by this weekend, he\u2019s an extension, and that\u2019s $450 in revenue that shifts to October.",
    implication: "Rodriguez and Johnson are both ready to file today. Sign both and you\u2019re back on pace.",
    deepDiveQuery: "Analyze my filing pace and extension risk. I\u2019ve filed 3 of 20, behind last year\u2019s 5 at this point. Break down: Which clients are ready to file right now? What\u2019s my revenue at risk if Thomas DuBois extends (he\u2019s missing 3 crypto docs)? Give me a priority-ordered filing plan for the next 10 days that gets me back on pace. Factor in which returns are simplest to close first.",
  },
  {
    id: "brief-2",
    priority: "high",
    urgent: true,
    title: "Carlos\u2019s paint booth deduction",
    refs: ["Carlos Mendez", "Elena Mendez"],
    clientId: "c15",
    content: "Carlos asked about a paint booth deduction yesterday. His Schedule C last year showed $38K in total business deductions. A new paint booth runs $15\u2013$40K. If he purchased one, that\u2019s a Section 179 deduction that could cut his liability in half. This might need to be a Complex return, not Standard.",
    implication: "His fee would go from $350 to $500. Confirm the purchase before his call on Thursday.",
    deepDiveQuery: "Deep dive on Carlos Mendez's paint booth deduction. His Schedule C showed $38K in deductions last year. A commercial paint booth costs $15K-$40K. Walk me through: Section 179 vs MACRS depreciation for this equipment. What\u2019s the optimal deduction strategy? Does this push his return from Standard to Complex tier? What documentation do I need from him (invoice, placed-in-service date, business use %)? What are the QBI implications if his deductions spike?",
  },
  {
    id: "brief-4",
    priority: "notable",
    title: "Rodriguez bracket jump",
    refs: ["Sofia Rodriguez", "James Rodriguez"],
    clientId: "c1",
    content: "Sofia Rodriguez started at Living Robotics this year. That\u2019s $97K new W-2 income on top of James\u2019s $87K at Riverside County. Combined income jumped from $167K to $285K, pushing them into the 24% bracket. Likely triggers Net Investment Income Tax on their rental income for the first time. Refund will be lower than last year.",
    implication: "Flag this when they review so they aren\u2019t surprised by the smaller refund.",
    deepDiveQuery: "Deep dive on Rodriguez family tax situation. Their combined income jumped from $167K to $285K due to Sofia\u2019s new job at Living Robotics ($97K). Walk me through: What bracket changes does this trigger? Will they owe Net Investment Income Tax on their rental income (Schedule E) for the first time? What was their refund last year vs estimated this year? How should I frame this for the client review so they understand why the refund dropped? Any planning opportunities (retirement contributions, rental depreciation)?",
  },
  {
    id: "brief-5",
    priority: "fyi",
    title: "Ashley Kim is a leading indicator",
    refs: ["Ashley Kim", "Priya Sharma"],
    clientId: "c20",
    content: "Ashley Kim\u2019s intake says OnlyFans income, referred by Priya. No deposit yet, never logged in. If Priya\u2019s experience goes well, Ashley follows. A fast turnaround on Priya\u2019s return has a multiplier effect on referrals from that creator network.",
    implication: "Priya is worth prioritizing not just for her fee but for the downstream revenue.",
    deepDiveQuery: "Analyze the referral opportunity from Priya Sharma's creator network. Ashley Kim was referred by Priya and has OnlyFans income. Walk me through: What\u2019s the typical profile of creator-economy clients (1099 complexity, estimated payments, business deductions)? If I deliver a great experience for Priya, what\u2019s the realistic referral pipeline? How should I price creator returns given the Schedule C complexity? What\u2019s the lifetime value calculation for building out this niche?",
  },
]

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

export const clientInsights: Record<string, PetalInsight> = {
  // Tyrone Mitchell - Warning (stale, pattern of extending)
  c17: {
    id: "insight-c17",
    clientId: "c17",
    severity: "concern",
    category: "client_engagement",
    title: "Pattern match: likely extension",
    content: "Tyrone has 2 of 5 docs uploaded with 18 days to deadline. He opened the reminder email on 3/22 but didn't click the upload link. He hasn't logged into the portal in 9 days. Last year he also went dark mid-season and you ended up filing an extension. His Uber 1099 and mileage log are still missing. Given the pattern, recommend a direct call rather than another automated message. If he's extending again, better to file Form 4868 now rather than last minute.",
    timestamp: "2026-03-28T06:00:00",
    supplementary: [
      { label: "Extension Probability", value: "62%", type: "kpi", highlightColor: "amber", detail: "Same pattern as last year — went dark mid-season, ended up extending" },
      { label: "Documents", value: "2 of 5", detail: "Missing: Uber 1099-NEC, mileage log, health insurance", type: "stat" },
      { label: "Days Inactive", value: "9 days", detail: "Last portal login March 19", type: "stat" },
    ],
    actions: [
      { id: "call-tyrone", label: "Call Tyrone", variant: "primary", action: "initiate_call" },
      { id: "draft-extension", label: "Draft extension", variant: "secondary", action: "draft_4868" },
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
    supplementary: [
      { label: "Documents Received", value: "4 of 7", detail: "Missing: PayPal 1099-K, estimated tax payments, 1095-A health insurance", type: "highlight", highlightColor: "blue" },
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

  // Miguel Sandoval - Insight (ready to prep, business growing)
  c9: {
    id: "insight-c9",
    clientId: "c9",
    severity: "insight",
    category: "prep_ready",
    title: "All docs in, ready for prep — business up 18%",
    content: "All 9 documents received and validated. Schedule C income is $142,000 (up 18% from $120,000 last year - business is growing). Estimated tax payments total $28,000 across 4 quarters. He wants to discuss incorporation during your 4 PM call today. Recommend prepping a simple S-Corp vs LLC comparison before the call. His return is straightforward once you decide the entity question.",
    timestamp: "2026-03-28T07:00:00",
    supplementary: [
      { label: "Quarterly Revenue", value: "$142K", type: "barChart", barChangeValue: 18, barChangeDescription: "vs 2024",
        barPrimaryColor: "bg-emerald-500", barSecondaryColor: "bg-emerald-200 dark:bg-emerald-900",
        barChartData: [
          { label: "Q1", currentValue: 30, previousValue: 25 },
          { label: "Q2", currentValue: 40, previousValue: 32 },
          { label: "Q3", currentValue: 38, previousValue: 30 },
          { label: "Q4", currentValue: 34, previousValue: 33 },
        ],
      },
    ],
    actions: [
      { id: "start-prep", label: "Start prep in OLT", variant: "primary", action: "open_olt" },
      { id: "view-summary", label: "View pre-prep summary", variant: "secondary", action: "view_summary" },
    ],
  },

  // DeShawn Williams - Alert (critical, disengaged + due diligence needed)
  c4: {
    id: "insight-c4",
    clientId: "c4",
    severity: "alert",
    category: "client_engagement",
    title: "Disengaged client, $600 penalty risk if due diligence incomplete",
    content: "DeShawn hasn't uploaded his W-2 or paid the $150 deposit. He's never logged into the portal. Intake was sent 10 days ago and two follow-up emails went unopened. He's Head of Household with 2 dependents, which means EITC, CTC, AOTC, and HOH all require Form 8867 due diligence before you can file. That's a $600 per return penalty if you skip it. Recommend one final SMS and if no response in 48 hours, consider closing the engagement.",
    timestamp: "2026-03-28T08:00:00",
    supplementary: [
      { label: "Penalty Risk", value: "$600/return", detail: "EITC + CTC + AOTC + HOH each require Form 8867 due diligence", type: "highlight", highlightColor: "red" },
      { label: "Deposit Outstanding", value: "$150", detail: "10 days overdue — cannot begin preparation", type: "highlight", highlightColor: "amber" },
    ],
    actions: [
      { id: "call-deshawn", label: "Call DeShawn", variant: "primary", action: "initiate_call" },
      { id: "ask-petal-dd", label: "Learn more with Petal", variant: "secondary", action: "ask_petal" },
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
      { id: "review-petal", label: "Review with Petal", variant: "secondary", action: "ask_petal" },
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
      { id: "sign-efile", label: "Sign & e-file", variant: "primary", action: "ero_sign" },
      { id: "review-petal", label: "Review with Petal", variant: "secondary", action: "ask_petal" },
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

  // Marcus Chen - Concern (revenue anomaly + restaurant data merged)
  c1: {
    id: "insight-c1",
    clientId: "c1",
    severity: "concern",
    category: "anomaly",
    title: "3-year client, restaurant owner — 40% revenue drop needs confirmation",
    content: "Marcus Chen has been with the firm since 2023, filing MFJ with his wife. He owns Golden Dragon LLC, a 3-location restaurant business in the Inland Empire. This year his Schedule C revenue dropped 40% from $238,000 to $142,000 because one location (Pasadena) appears to have closed in Q2. He also has a new $12,000 consulting 1099-NEC that wasn't present last year. W-2 wages dropped proportionally from $96,000 to $58,000. There's a $23,000 equipment disposal from the Riverside location that needs classification. He has a call scheduled March 30 at 2pm to cover all open items.",
    timestamp: "2026-03-28T07:30:00",
    supplementary: [
      { label: "Schedule C Revenue", type: "comparison", priorValue: 485000, currentValue: 291000, priorLabel: "2024", currentLabel: "2025", changePercent: -40 },
    ],
    actions: [
      { id: "message-marcus", label: "Message Marcus", variant: "primary", action: "open_thread" },
      { id: "ask-petal", label: "Ask Petal", variant: "secondary", action: "ask_petal" },
    ],
  },

  // Roberto Fuentes - Concern (client review stale)
  c6: {
    id: "insight-c6",
    clientId: "c6",
    severity: "concern",
    category: "review_ready",
    title: "Client review sent 5 days ago - follow up if no response by Monday",
    content: "Roberto's 1120S and personal return were sent for review on March 23. He opened the email but hasn't signed off or asked any questions. His trucking depreciation schedules are complex this year with the new equipment. He might have questions but hasn't reached out. Consider a gentle check-in if he doesn't respond by Monday.",
    timestamp: "2026-03-28T08:00:00",
    actions: [
      { id: "send-followup", label: "Send follow-up", variant: "primary", action: "open_thread" },
      { id: "view-return", label: "View return", variant: "secondary", action: "open_return" },
    ],
    draftMessage: {
      id: "draft-roberto",
      channel: "email",
      subject: "Quick check-in on your return",
      content: "Hi Roberto, I sent your return for review a few days ago and wanted to make sure you had a chance to look it over. The depreciation schedules for the new equipment are detailed on page 4 - let me know if you have any questions about those calculations. Happy to hop on a quick call if that's easier.",
      tone: "professional",
    },
  },

  // Jasmine Torres - Concern (docs stalled)
  c12: {
    id: "insight-c12",
    clientId: "c12",
    severity: "concern",
    category: "document_collection",
    title: "4 of 8 docs - freelance 1099s missing after 15 days",
    content: "Jasmine has been in collecting docs stage for 15 days with 4 of 8 documents. She's a freelance graphic designer with multiple clients, and we're missing 1099s from 3 of them. She logged in 4 days ago but didn't upload anything. She asked March 26 if she needs to report a $200 one-time logo job (yes). Her 1099s may be scattered across different clients - she might need guidance on which ones to request.",
    timestamp: "2026-03-28T09:00:00",
    actions: [
      { id: "send-checklist", label: "Send 1099 checklist", variant: "primary", action: "send_checklist" },
      { id: "reply-question", label: "Reply to question", variant: "secondary", action: "open_thread" },
    ],
  },

  // Vladimir Petrov - Alert (extension candidate)
  c13: {
    id: "insight-c13",
    clientId: "c13",
    severity: "alert",
    category: "deadline",
    title: "0 engagement since intake - extension conversation needed this week",
    content: "Vladimir completed intake 14 days ago but has never logged into the portal. 0 of 16 documents uploaded. His import business (Petrov Imports) has complex international transactions that require significant prep time. With 18 days to deadline and zero progress, an extension is almost certain. You have a call scheduled tomorrow (March 29) at 10am. Use that call to discuss the extension and set realistic expectations for the extended deadline.",
    timestamp: "2026-03-28T06:00:00",
    supplementary: [
      { label: "Extension likelihood", type: "extension", probability: 95, factors: ["0 of 16 documents submitted", "No portal login ever", "Complex international business", "Prior year was also extended"] },
    ],
    actions: [
      { id: "prep-extension", label: "Mark as extended", variant: "primary", action: "file_extension" },
      { id: "review-complexity", label: "Review complexity with Petal", variant: "secondary", action: "ask_petal" },
    ],
  },

  // Carlos & Elena Mendez - Insight (unresolved question)
  c15: {
    id: "insight-c15",
    clientId: "c15",
    severity: "insight",
    category: "general",
    title: "Paint booth deduction question pending - reply before continuing prep",
    content: "Elena messaged yesterday asking if they can deduct the new paint booth equipment purchased in December. The answer is yes (Section 179), but they're missing the invoice. Their 1065 partnership return has 13 of 14 docs - the paint booth invoice is the last one. Reply to Elena's question and request the invoice in the same message. Meeting scheduled March 30 for partnership review.",
    timestamp: "2026-03-28T07:00:00",
    actions: [
      { id: "reply-elena", label: "Reply to Elena", variant: "primary", action: "open_thread" },
      { id: "view-return", label: "Continue prep", variant: "secondary", action: "open_return" },
    ],
    draftMessage: {
      id: "draft-elena",
      channel: "portal",
      content: "Hi Elena! Yes, you can absolutely deduct the paint booth under Section 179 - it's a qualifying equipment purchase. To include it, I'll need the purchase invoice showing the date and amount. Can you upload that to the portal? Once I have that, we'll be ready to finalize everything before our Saturday meeting.",
      tone: "friendly",
    },
  },

  // Mei-Lin Wu - Insight (ready for signature, with QBI + quarterly merged)
  c18: {
    id: "insight-c18",
    clientId: "c18",
    severity: "insight",
    category: "review_ready",
    title: "QBI deduction applied - review sent 4 days ago, awaiting sign-off",
    content: "Mei-Lin's Schedule C return is complete with the 20% QBI deduction applied to her consulting income. Return was sent for review 4 days ago. She logged in once since then but hasn't signed off. Her return is straightforward - $78,000 consulting income, standard deductions, health insurance premium deduction. Expected refund of $1,450. She'll also need to make quarterly estimated payments for 2026 based on her Schedule C net income.",
    timestamp: "2026-03-28T08:30:00",
    supplementary: [
      { label: "QBI Deduction (Section 199A)", value: "$2,400", detail: "20% QBI on $48K net income — $9,600 deduction applied", type: "highlight", highlightColor: "emerald" },
      { label: "Expected Refund", value: "$1,450", type: "highlight", highlightColor: "blue" },
      { label: "2026 Quarterly Estimates", value: "$12,800 total", detail: "Schedule C net $48K + SE tax. Safe harbor (100% prior year).", type: "quarterly", quarterlyAmounts: { q1: 3200, q2: 3200, q3: 3200, q4: 3200 } },
    ],
    actions: [
      { id: "send-reminder", label: "Send gentle reminder", variant: "primary", action: "send_reminder" },
      { id: "view-return", label: "Review return", variant: "secondary", action: "open_return" },
    ],
  },

  // Sarah Mitchell - Pending intake
  c21: {
    id: "insight-c21",
    clientId: "c21",
    severity: "insight",
    category: "general",
    title: "Nextdoor referral - intro call Saturday, looks straightforward",
    content: "Sarah found you on Nextdoor and completed intake yesterday. She's a freelance photographer with W-2 from part-time work plus 1099s from photography clients. Deposit paid. Call scheduled for Saturday 10am. Her case looks straightforward - Standard tier with estimated 6 docs. Warm lead who's already engaged.",
    timestamp: "2026-03-28T10:00:00",
    actions: [
      { id: "confirm-call", label: "Send call confirmation", variant: "primary", action: "send_confirmation" },
      { id: "view-intake", label: "View intake", variant: "secondary", action: "open_intake" },
    ],
  },

  // Kevin & Lisa Park - Pending intake
  c22: {
    id: "insight-c22",
    clientId: "c22",
    severity: "insight",
    category: "general",
    title: "David Park's brother - switching from H&R Block, call tomorrow",
    content: "Kevin and Lisa were referred by David Park (your existing client). They own Park Cleaners with multiple employees and want to switch from H&R Block. Premium tier, 12 docs expected. Call scheduled tomorrow (March 29) at 2pm. They're a warm referral with a business that aligns well with your expertise. Converting them would be a good win.",
    timestamp: "2026-03-28T09:30:00",
    actions: [
      { id: "confirm-call", label: "Send call confirmation", variant: "primary", action: "send_confirmation" },
      { id: "prep-notes", label: "Prep call notes", variant: "secondary", action: "open_notes" },
    ],
  },
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

export function getInsightForClient(clientId: string): PetalInsight | undefined {
  return clientInsights[clientId]
}

export function getAllInsights(): PetalInsight[] {
  return Object.values(clientInsights)
}

export function getInsightsByPriority(): {
  needsApproval: PetalInsight[]
  atRisk: PetalInsight[]
  inProgress: PetalInsight[]
  onTrack: PetalInsight[]
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
    { id: "no-login", label: "No login 9d", variant: "danger", tooltip: "Last portal login: March 19" },
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
  // New clients
  c1: [
    { id: "active-1d", label: "Active 1d ago", variant: "success", tooltip: "Portal login yesterday" },
    { id: "revenue-drop", label: "Revenue drop", variant: "warning", tooltip: "40% YoY decrease flagged" },
  ],
  c6: [
    { id: "review-5d", label: "Review sent 5d", variant: "warning", tooltip: "Awaiting client sign-off" },
    { id: "all-docs", label: "All docs \u2713", variant: "success", tooltip: "15/15 documents received" },
  ],
  c12: [
    { id: "stalled-15d", label: "Stalled 15d", variant: "warning", tooltip: "In collecting docs for 15 days" },
    { id: "docs-progress", label: "4/8 docs", variant: "warning", tooltip: "Freelance 1099s missing" },
  ],
  c13: [
    { id: "never-logged", label: "Never logged in", variant: "danger", tooltip: "Has never opened the portal" },
    { id: "extension-likely", label: "Extension likely", variant: "danger", tooltip: "0/16 docs, complex business" },
  ],
  c15: [
    { id: "unread-msg", label: "Unread message", variant: "warning", tooltip: "Elena's question unanswered" },
    { id: "docs-progress", label: "13/14 docs", variant: "success", tooltip: "Paint booth invoice missing" },
  ],
  c18: [
    { id: "review-4d", label: "Review sent 4d", variant: "info", tooltip: "Awaiting client sign-off" },
    { id: "all-docs", label: "All docs \u2713", variant: "success", tooltip: "All documents received" },
  ],
  c21: [
    { id: "deposit-paid", label: "Deposit paid", variant: "success", tooltip: "Deposit received" },
    { id: "call-sat", label: "Call Sat 10am", variant: "info", tooltip: "Intro call scheduled" },
  ],
  c22: [
    { id: "deposit-paid", label: "Deposit paid", variant: "success", tooltip: "Deposit received" },
    { id: "call-tomorrow", label: "Call tomorrow", variant: "info", tooltip: "Call scheduled Mar 29" },
    { id: "referral", label: "Referral", variant: "success", tooltip: "Referred by David Park" },
  ],
  // Filed clients
  c5: [
    { id: "filed", label: "Filed \u2713", variant: "success", tooltip: "Filed and accepted" },
    { id: "paid", label: "Paid \u2713", variant: "success", tooltip: "Full payment received" },
  ],
  c10: [
    { id: "filed", label: "Filed \u2713", variant: "success", tooltip: "Filed and accepted" },
    { id: "paid", label: "Paid \u2713", variant: "success", tooltip: "Full payment received" },
  ],
  c16: [
    { id: "filed", label: "Filed \u2713", variant: "success", tooltip: "Filed and accepted" },
    { id: "returning", label: "4th year", variant: "info", tooltip: "Returning client since 2022" },
  ],
}

export function getTrackingBadgesForClient(clientId: string): TrackingBadgeData[] {
  return clientTrackingBadges[clientId] || []
}

// ============================================================
// ONE-LINER INSIGHTS (for client cards)
// ============================================================

export interface OneLineInsight {
  title: string
  severity: "insight" | "concern" | "alert"
}

export function getOneLineInsightForClient(clientId: string): OneLineInsight | null {
  const insight = clientInsights[clientId]
  if (!insight) return null

  return {
    title: insight.title,
    severity: insight.severity,
  }
}

// ============================================================
// FILED CLIENT ADVISORY (collapsed by default)
// ============================================================

export const filedClientAdvisory: Record<string, {
  title: string
  content: string
}> = {
  // Linda Nakamura - Etsy growth
  c5: {
    title: "Etsy income grew 40% - suggest quarterly estimated payments",
    content: "Linda's Etsy shop revenue increased from $8,500 to $12,000 this year. If this trend continues, she may owe more than $1,000 at filing next year and should consider making quarterly estimated payments. A quick note about this would be a valuable touchpoint.",
  },
  // Karen O'Brien - Simple return, relationship opportunity
  c10: {
    title: "Filed successfully - send thank you and next year's checklist",
    content: "Karen's simple W-2 return was filed and accepted. Consider sending a thank-you message with a reminder to save docs for next year. She's been a returning client - a quick check-in maintains the relationship.",
  },
  // Rachel Goldstein - Long-term client
  c16: {
    title: "4th year client - thank her for the loyalty",
    content: "Rachel and her husband have been clients for 4 years. Their return is straightforward (both W-2) but the relationship is valuable. A brief thank-you acknowledging their loyalty could be a nice touch.",
  },
}

export function getAdvisoryForFiledClient(clientId: string): { title: string; content: string } | null {
  return filedClientAdvisory[clientId] || null
}

/**
 * Triage queue — v4 mock data.
 *
 * Every item is derived from the 14 items in
 * design-references/petal-direction-b-v2.html so the queue list
 * renders exactly like the mockup. Clients cross-reference real
 * records in lib/mock-data.ts where they exist (Priya, Anthony,
 * Marcus, DeShawn, etc. are in that roster). Phase 3+ replaces the
 * inline `serviceTier` / `fee` with a `clients.find(...)` lookup.
 *
 * Type codes (PRD §5.1):
 *   MSG · FILE · FLAG · DOC · CALL · INTAKE · COMP · PREP
 *
 * Items are flat; they carry their `horizon` so the list component
 * can group without re-sorting.
 */

export type TriageItemType =
  | "MSG"
  | "FILE"
  | "FLAG"
  | "DOC"
  | "CALL"
  | "INTAKE"
  | "COMP"
  | "PREP";

export type TriageSeverity = "critical" | "high" | "normal";

export type TriageHorizon = "right-now" | "today" | "later-this-week";

export type TriageServiceTier = "Basic" | "Standard" | "Premium";

export type TriageItem = {
  id: string;
  type: TriageItemType;
  horizon: TriageHorizon;
  severity: TriageSeverity;
  /** Client ID (joins to lib/mock-data clients where applicable). */
  clientId: string;
  clientName: string;
  /** Two-letter initials for avatar (lowercased/uppercased per context). */
  clientInitials: string;
  serviceTier: TriageServiceTier;
  fee: number;
  /**
   * Plain-text one-line summary. Phase 1 renders this as-is; the
   * detail pane uses `detailTitle` for the serif headline.
   */
  action: string;
  /** Optional fragment within `action` that gets rust emphasis. */
  actionEmphasis?: string;
  /** Expected minutes to resolve, or "call" for scheduled-call items. */
  timeCost: number | "call";
  /** Age as displayed: "12m ago", "9d", "in 9h". Calculated upstream. */
  age: string;
  /** True when the age pill renders in error red. */
  ageOverdue?: boolean;
  /** Context for the detail breadcrumb line. */
  intakeLabel: string;
  /** Estimated minutes to resolve, shown in breadcrumb. */
  estMinutes: number;
  /** Detail pane serif title. Accents wrapped in *asterisks* render italic rust. */
  detailTitle: string;
  /** One-line subtitle under the title. `$` + digits render in mono. */
  detailSubtitle: string;
  /** Optional message section content (only for MSG items in Phase 2). */
  message?: {
    body: string;
    channel: string;
    timestamp: string;
  };
  /** Optional insight (only Priya is fleshed out in Phase 2). */
  insight?: {
    grounding: string[];
    body: string;
    stats: { label: string; value: string; accent?: boolean }[];
  };
  /** Optional AI draft (Phase 2 fleshes out Priya only). */
  draft?: {
    channel: string;
    charsUsed: number;
    charsMax: number;
    rationale: string;
    paragraphs: string[];
  };
};

/** Goal / progress telemetry shown in the header ProgressStrip. */
export type TriageProgress = {
  done: number;
  total: number;
  goalTime: string; // "4 pm"
  goalCopy: string; // "inbox zero by 4 pm"
  paceEstimate: string; // "est 2h 20m at current pace"
};

export const TRIAGE_PROGRESS: TriageProgress = {
  done: 6,
  total: 20,
  goalTime: "4 pm",
  goalCopy: "inbox zero by 4 pm",
  paceEstimate: "est 2h 20m at current pace"
};

export const TRIAGE_ITEMS: TriageItem[] = [
  // ─── RIGHT NOW ────────────────────────────────────────────
  {
    id: "t-priya-msg-1099",
    type: "MSG",
    horizon: "right-now",
    severity: "critical",
    clientId: "client-priya-sharma",
    clientName: "Priya Sharma",
    clientInitials: "PS",
    serviceTier: "Standard",
    fee: 350,
    action: "TikTok 1099 needs gap review before upload",
    actionEmphasis: "gap review",
    timeCost: 3,
    age: "12m ago",
    intakeLabel: "intake Jan 14 · 2nd year client",
    estMinutes: 3,
    detailTitle: "Priya's TikTok 1099 doesn't match her *intake*.",
    detailSubtitle:
      "She's trying to upload it. Before you reply, there's a $14,200 discrepancy between the 1099 and her January intake that's worth asking about.",
    message: {
      body: "Hi Antonio! I have my TikTok 1099 but I'm not sure how to upload it.",
      channel: "SMS",
      timestamp: "Mar 29, 2:30 PM · Priya Sharma · arrived 12 min ago"
    },
    insight: {
      grounding: [
        "intake form",
        "1099-NEC attached",
        "prior year Sch C",
        "Q3 estimated payments ledger"
      ],
      body: "Her TikTok 1099 shows *$34,200* in NEC income. Her January intake estimated around *$20,000*. A *$14,200* gap this size usually means either a much bigger year than she realized, or a second platform she hasn't mentioned. Her Q1 to Q3 estimated payments were sized to the $20K number, so she's likely short.",
      stats: [
        { label: "Stated", value: "$20,000" },
        { label: "Actual", value: "$34,200", accent: true },
        { label: "Gap", value: "+$14,200", accent: true },
        { label: "Penalty risk", value: "~$420" }
      ]
    },
    draft: {
      channel: "SMS",
      charsUsed: 340,
      charsMax: 480,
      rationale: "answers her question · surfaces the gap · offers a call",
      paragraphs: [
        "Hi Priya! Easy, drag the 1099 into the Documents section of your portal and I'll see it immediately.",
        "Quick flag while I have you: the TikTok 1099 shows $34,200, but your January intake had you closer to $20K. That's a meaningful gap. Did you earn from another platform this year, or did TikTok have a bigger year than expected? Worth a 10-minute call, it affects your estimated payments too."
      ]
    }
  },
  {
    id: "t-tyrone-flag-mileage",
    type: "FLAG",
    horizon: "right-now",
    severity: "critical",
    clientId: "client-tyrone-mitchell",
    clientName: "Tyrone Mitchell",
    clientInitials: "TM",
    serviceTier: "Basic",
    fee: 150,
    action: "Mileage log still missing, extended last year",
    actionEmphasis: "still missing",
    timeCost: "call",
    age: "9d",
    ageOverdue: true,
    intakeLabel: "intake Feb 2 · 3rd year client",
    estMinutes: 10,
    detailTitle: "Tyrone's mileage log is *still missing*.",
    detailSubtitle:
      "Same stall pattern as last year — he extended in 2024 over this exact document. Worth a proactive extension conversation now."
  },

  // ─── TODAY ────────────────────────────────────────────────
  {
    id: "t-rodriguez-file-ero",
    type: "FILE",
    horizon: "today",
    severity: "high",
    clientId: "client-rodriguez",
    clientName: "James & Sofia Rodriguez",
    clientInitials: "JR",
    serviceTier: "Premium",
    fee: 500,
    action: "Paid, signed, awaiting ERO countersignature",
    timeCost: 2,
    age: "2h",
    intakeLabel: "intake Jan 8 · 4th year client",
    estMinutes: 2,
    detailTitle: "Rodriguez return is ready for *ERO countersignature*.",
    detailSubtitle:
      "8879 executed, $500 invoice paid in full. Two minutes of your time, then it's filed."
  },
  {
    id: "t-aisha-file-ero",
    type: "FILE",
    horizon: "today",
    severity: "high",
    clientId: "client-aisha-johnson",
    clientName: "Aisha Johnson",
    clientInitials: "AJ",
    serviceTier: "Standard",
    fee: 350,
    action: "Paid, signed, awaiting ERO countersignature",
    timeCost: 2,
    age: "3h",
    intakeLabel: "intake Jan 22 · 2nd year client",
    estMinutes: 2,
    detailTitle: "Aisha's return is ready for *ERO countersignature*.",
    detailSubtitle: "8879 executed, invoice settled. Same quick step as Rodriguez above."
  },
  {
    id: "t-mendez-flag-paint",
    type: "FLAG",
    horizon: "today",
    severity: "high",
    clientId: "client-mendez",
    clientName: "Carlos & Elena Mendez",
    clientInitials: "CM",
    serviceTier: "Premium",
    fee: 500,
    action: "Paint booth depreciation question pending",
    timeCost: 10,
    age: "3d",
    intakeLabel: "intake Feb 5 · 3rd year client",
    estMinutes: 10,
    detailTitle: "Elena is waiting on the *paint booth §179* answer.",
    detailSubtitle:
      "$42,000 purchase, likely qualifies for §179 expensing vs MACRS over 7 years. She texted Monday asking which is better for her."
  },
  {
    id: "t-mei-doc-schc",
    type: "DOC",
    horizon: "today",
    severity: "high",
    clientId: "client-mei-wu",
    clientName: "Mei-Lin Wu",
    clientInitials: "MW",
    serviceTier: "Standard",
    fee: 350,
    action: "New Schedule C uploaded, extracted, needs review",
    timeCost: 5,
    age: "1h",
    intakeLabel: "intake Jan 29 · 2nd year client",
    estMinutes: 5,
    detailTitle: "Mei-Lin's Schedule C is *extracted and waiting*.",
    detailSubtitle: "14 fields parsed at 91% average confidence. 2 rows flagged for your eye."
  },
  {
    id: "t-david-call-3pm",
    type: "CALL",
    horizon: "today",
    severity: "high",
    clientId: "client-david-park",
    clientName: "David Park",
    clientInitials: "DP",
    serviceTier: "Standard",
    fee: 350,
    action: "3:00 PM today, prep brief auto-generated",
    timeCost: 30,
    age: "in 9h",
    intakeLabel: "scheduled 3:00 PM today",
    estMinutes: 30,
    detailTitle: "David Park call at *3 PM* today.",
    detailSubtitle:
      "Pre-brief below covers his S-corp reasonable-comp question and the POA renewal you flagged last month."
  },
  {
    id: "t-rodriguez-flag-refund",
    type: "FLAG",
    horizon: "today",
    severity: "high",
    clientId: "client-rodriguez",
    clientName: "James & Sofia Rodriguez",
    clientInitials: "JR",
    serviceTier: "Premium",
    fee: 500,
    action: "Refund will land $1,750 lower than expected",
    actionEmphasis: "$1,750 lower",
    timeCost: 5,
    age: "4h",
    intakeLabel: "intake Jan 8 · 4th year client",
    estMinutes: 5,
    detailTitle: "Rodriguez refund will land *$1,750 lower* than expected.",
    detailSubtitle:
      "Their 2024 bonus pushed them into a new bracket. Worth a heads-up before they see the number at filing."
  },
  {
    id: "t-vladimir-intake-stall",
    type: "INTAKE",
    horizon: "today",
    severity: "high",
    clientId: "client-vladimir-petrov",
    clientName: "Vladimir Petrov",
    clientInitials: "VP",
    serviceTier: "Premium",
    fee: 500,
    action: "Never logged in, extension conversation needed",
    timeCost: "call",
    age: "5d",
    ageOverdue: true,
    intakeLabel: "intake invite sent Mar 28 · never opened",
    estMinutes: 10,
    detailTitle: "Vladimir hasn't logged in — *extension* conversation now.",
    detailSubtitle:
      "0 of 16 documents, 5 days since invite. International complexity means a preemptive 4868 makes sense."
  },
  {
    id: "t-deshawn-msg-w2",
    type: "MSG",
    horizon: "today",
    severity: "high",
    clientId: "client-deshawn-williams",
    clientName: "DeShawn Williams",
    clientInitials: "DW",
    serviceTier: "Basic",
    fee: 150,
    action: "W-2 uploaded, auto-matched to prior year employer",
    timeCost: 2,
    age: "1h",
    intakeLabel: "intake Feb 12 · new client (HoH)",
    estMinutes: 2,
    detailTitle: "DeShawn's W-2 *auto-matched* his 2024 employer.",
    detailSubtitle:
      "Same EIN as last year, same wage progression. Green light on classification; confirm with him and move on."
  },

  // ─── LATER THIS WEEK ──────────────────────────────────────
  {
    id: "t-ashley-intake-deposit",
    type: "INTAKE",
    horizon: "later-this-week",
    severity: "normal",
    clientId: "client-ashley-kim",
    clientName: "Ashley Kim",
    clientInitials: "AK",
    serviceTier: "Standard",
    fee: 350,
    action: "Nudge overdue, deposit pending since Wednesday",
    timeCost: 2,
    age: "2d",
    intakeLabel: "intake started Mar 25 · deposit pending",
    estMinutes: 2,
    detailTitle: "Ashley's deposit is *pending since Wednesday*.",
    detailSubtitle: "Referred by Priya — same TikTok creator profile. Gentle nudge via portal."
  },
  {
    id: "t-thomas-doc-crypto",
    type: "DOC",
    horizon: "later-this-week",
    severity: "normal",
    clientId: "client-thomas-dubois",
    clientName: "Thomas DuBois",
    clientInitials: "TD",
    serviceTier: "Premium",
    fee: 500,
    action: "Crypto records still outstanding (11 of 14)",
    actionEmphasis: "11 of 14",
    timeCost: 5,
    age: "2d",
    intakeLabel: "intake Jan 19 · 3rd year client",
    estMinutes: 5,
    detailTitle: "Thomas is *11 of 14* on crypto records.",
    detailSubtitle: "Coinbase + Kraken CSVs in, Uniswap + Solana wallet history still outstanding."
  },
  {
    id: "t-miguel-prep-ready",
    type: "PREP",
    horizon: "later-this-week",
    severity: "normal",
    clientId: "client-miguel-sandoval",
    clientName: "Miguel Sandoval",
    clientInitials: "MS",
    serviceTier: "Standard",
    fee: 350,
    action: "All 9 docs received, ready for prep",
    timeCost: 45,
    age: "4h",
    intakeLabel: "intake Feb 1 · 2nd year client",
    estMinutes: 45,
    detailTitle: "Miguel is *ready for prep* — all 9 docs in.",
    detailSubtitle: "Straightforward 1040 + Sch C. Estimate 45 minutes including review."
  },
  {
    id: "t-anthony-prep-cap-gains",
    type: "PREP",
    horizon: "later-this-week",
    severity: "normal",
    clientId: "client-anthony-russo",
    clientName: "Anthony Russo",
    clientInitials: "AR",
    serviceTier: "Standard",
    fee: 350,
    action: "Ready for prep, cap gains calc needed",
    timeCost: 60,
    age: "6h",
    intakeLabel: "intake Jan 11 · 4th year client",
    estMinutes: 60,
    detailTitle: "Anthony is ready, *cap gains* calc pending.",
    detailSubtitle:
      "Chase 1099 INT that has been every year for 4 years hasn't arrived yet — worth a quick text before prep."
  }
];

export const HORIZONS: { key: TriageHorizon; label: string; urgent?: boolean }[] = [
  { key: "right-now", label: "Right now", urgent: true },
  { key: "today", label: "Today" },
  { key: "later-this-week", label: "Later this week" }
];

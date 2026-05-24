"use client";

import { useState, useRef, useEffect, createContext, useContext } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SendIcon, CopyIcon, RefreshCwIcon, ShareIcon,
  MoreHorizontalIcon, SearchIcon, FileTextIcon,
  Loader2Icon, PanelRightCloseIcon, MessageSquareTextIcon,
  MaximizeIcon, MinimizeIcon,
  Plus, Paperclip, Database, Table as TableIcon,
  Check, Globe, Users
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { voiceDumpSession, type VoiceParsedItem } from "@/lib/actions-mock-data";
import { clients } from "@/lib/mock-data";
import { X as XIcon, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { useSidebar } from "@/components/ui/sidebar";
import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import {
  subscribePetalPrompts,
  getPetalPrompts,
  addPetalPrompt,
  deletePetalPrompt,
  type SavedPrompt,
} from "@/lib/petal-prompts-store";

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */
type ClientContext = {
  clientId: string;
  clientName: string;
} | null;

type AIPanelContextType = {
  isOpen: boolean;
  isFullPage: boolean;
  toggle: () => void;
  open: () => void;
  /** Open the panel directly in fullscreen mode — used by the sidebar "Ask Petal" entry. */
  openFullScreen: () => void;
  close: () => void;
  toggleFullPage: () => void;
  askQuestion: (question: string) => void;
  pendingQuestion: string | null;
  clearPendingQuestion: () => void;
  clientContext: ClientContext;
  setClientContext: (ctx: ClientContext) => void;
};

const AIPanelContext = createContext<AIPanelContextType>({
  isOpen: false, isFullPage: false, toggle: () => {}, open: () => {}, openFullScreen: () => {}, close: () => {},
  toggleFullPage: () => {}, askQuestion: () => {}, pendingQuestion: null, clearPendingQuestion: () => {},
  clientContext: null, setClientContext: () => {},
});

export const useAIPanel = () => useContext(AIPanelContext);
export const useAIPanelAsk = () => {
  const { askQuestion } = useContext(AIPanelContext);
  return askQuestion;
};

export function AIPanelProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullPage, setIsFullPage] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [clientContext, setClientContext] = useState<ClientContext>(null);
  return (
    <AIPanelContext.Provider value={{
      isOpen,
      isFullPage,
      toggle: () => setIsOpen((v) => !v),
      open: () => setIsOpen(true),
      openFullScreen: () => { setIsOpen(true); setIsFullPage(true); },
      close: () => { setIsOpen(false); setIsFullPage(false); },
      toggleFullPage: () => setIsFullPage((v) => !v),
      askQuestion: (q: string) => { setPendingQuestion(q); setIsOpen(true); },
      pendingQuestion,
      clearPendingQuestion: () => setPendingQuestion(null),
      clientContext,
      setClientContext,
    }}>
      {children}
    </AIPanelContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type ThinkingStep = {
  type: "thinking" | "searching" | "found";
  text: string;
  source?: string;
};

type FoundContent = {
  text: string;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  steps?: ThinkingStep[];
  foundContent?: FoundContent;
  summary?: string;
};

/* ------------------------------------------------------------------ */
/*  Demo                                                               */
/* ------------------------------------------------------------------ */
const demoMessages: Message[] = [
  {
    id: "1",
    role: "user",
    content: "Which clients are at risk of missing the April 15 deadline?",
  },
  {
    id: "2",
    role: "assistant",
    content: "",
    steps: [
      { type: "thinking", text: "Analyzing 20 clients against April 15 deadline. Checking document completion rates, portal activity, and filing history." },
      { type: "searching", text: "Querying client pipeline, document status, and engagement logs", source: "20 clients analyzed" },
      { type: "found", text: "Identified 5 at-risk clients across 2 urgency levels." },
    ],
    foundContent: {
      text: "**Critical** - Vladimir Petrov: 0/16 docs, never logged in, complex international. Extension almost certain.\n\n**Critical** - DeShawn Williams: 1/6 docs, deposit unpaid, never logged in. New client.\n\n**High** - Tyrone Mitchell: 2/5 docs, 9 days stale, extended last year.\n\n**Moderate** - Priya Sharma: 3/7 docs, missing 1099s but active on portal.\n\n**Moderate** - Thomas DuBois: 11/14 docs, missing crypto records only.",
    },
    summary: "5 clients at risk. I've prepared draft messages for DeShawn and Tyrone in your Action Feed. Recommend scheduling an extension discussion with Vladimir this week.",
  },
];

// 8 cycling suggestions — shown 3 at a time with fade animation
const allSuggestions = [
  "Who needs my attention today?",
  "What's my outstanding revenue?",
  "Who hasn't logged into the portal?",
  "Show me Priya's missing documents",
  "Draft a message to DeShawn",
  "Which returns need my review?",
  "Compare this season to last season",
  "Which clients are at risk of extension?",
];

// Client-specific suggestions (placeholders replaced with actual client name)
function getClientSpecificSuggestions(clientName: string): string[] {
  const firstName = clientName.split(" ")[0];
  return [
    `What's blocking ${firstName}?`,
    `What documents is ${firstName} missing?`,
    `Draft a follow-up message to ${firstName}`,
    `Show ${firstName}'s timeline`,
    `Is ${firstName} at risk of extension?`,
    `What did ${firstName} ask about last?`,
    `Summarize ${firstName}'s return`,
    `What's ${firstName}'s payment status?`,
  ];
}

// Intent-matched demo responses
type DemoResponse = {
  steps: ThinkingStep[];
  foundContent: FoundContent;
  summary: string;
};

// Client-specific response data for demo
const clientSpecificData: Record<string, {
  blocking: string;
  missing: string;
  timeline: string;
  risk: string;
  payment: string;
  summary: string;
}> = {
  c1: { // Marcus Chen
    blocking: "**Revenue verification** - 40% revenue drop across restaurants needs explanation before filing. Flagged for unusual pattern.",
    missing: "**All documents received** - Marcus has submitted 11/11 required documents. Ready for preparation.",
    timeline: "**Mar 15** - Intake submitted\n**Mar 18** - All docs uploaded\n**Mar 22** - Started prep\n**Mar 26** - Flagged revenue question\n**Now** - Awaiting clarification",
    risk: "**Low risk** - On track if revenue clarification resolved this week. No extension needed.",
    payment: "**$850 total** - $200 deposit paid Mar 15. Balance $650 due on filing.",
    summary: "3-restaurant business return. Schedule C with significant revenue drop (40%) flagged. K-1 from real estate partnership. Need confirmation about 3rd location closure before continuing.",
  },
  c3: { // DeShawn Williams
    blocking: "**Multiple blockers** - Never logged into portal, deposit unpaid ($150), missing 5 of 6 documents. New client with no engagement.",
    missing: "**Missing 5 docs** - W-2 (employer), 1099-NEC (side gig), Driver's license, SSN card, Prior year return. Only received initial intake form.",
    timeline: "**Mar 16** - Signed up\n**Mar 16** - Deposit invoice sent (unpaid)\n**Mar 16** - Portal invite sent (never opened)\n**12 days** - No activity since",
    risk: "**High risk (70%)** - New client with zero engagement. Likely needs extension without immediate intervention.",
    payment: "**$300 total** - $150 deposit unpaid (10 days overdue). Payment required before prep can begin.",
    summary: "First-time client referred by social media. Basic 1040 with gig income. Zero engagement since signup. Recommend phone call rather than portal nudge.",
  },
  c4: { // Thomas & Marie DuBois
    blocking: "**Waiting on crypto records** - 11 of 14 docs received. Crypto cost basis documentation blocking completion.",
    missing: "**Missing 3 docs** - Crypto transaction records (Coinbase/Binance), Mining income statements, Cost basis documentation.",
    timeline: "**Mar 10** - Intake\n**Mar 14** - Initial batch uploaded (8 docs)\n**Mar 19** - Requested crypto records\n**Mar 24** - Reminder sent\n**5 days** - Waiting",
    risk: "**Moderate (35%)** - Good engagement history. Crypto docs are complex. May need extension if not resolved by Apr 8.",
    payment: "**$700 total** - $200 deposit paid. Balance $500 due on filing.",
    summary: "Married filing jointly. W-2s, rental income, and significant crypto activity. Strong communicators but crypto documentation is complex.",
  },
  c6: { // Roberto Fuentes
    blocking: "**Awaiting client signature** - Return completed and sent Mar 25. Roberto viewed it Mar 26 but hasn't signed. 5 days waiting.",
    missing: "**All documents received** - Full document set submitted. Return is prepared and awaiting signature.",
    timeline: "**Mar 8** - Intake\n**Mar 12** - Docs complete\n**Mar 20** - Prep complete\n**Mar 25** - Return sent for review\n**Mar 26** - Client viewed\n**5 days** - Waiting for signature",
    risk: "**Low risk** - Just needs a signature nudge. Return is complete and ready to file.",
    payment: "**$650 total** - $175 deposit paid. Balance $475 due on signing.",
    summary: "Self-employed contractor. Schedule C with home office. Return complete, just awaiting signature. Follow up recommended.",
  },
  c13: { // Vladimir Petrov
    blocking: "**Complete non-engagement** - Never logged in, deposit unpaid ($500), 0 of 16 documents. Complex international business return.",
    missing: "**Missing all 16 docs** - Business financials, international transactions, K-1s, personal documents. No uploads at all.",
    timeline: "**Mar 20** - Signed up (referral)\n**Mar 20** - Portal invite sent\n**Mar 20** - Deposit invoice sent ($500)\n**0 activity** - Never logged in",
    risk: "**Almost certain extension (95%)** - Complex import business with no engagement. Extension conversation needed immediately.",
    payment: "**$1,500 total** - $500 deposit unpaid. High-value client but zero payment activity.",
    summary: "Petrov Imports - complex international business. First-year client. Needs immediate extension discussion. Schedule a call, portal reminders won't work.",
    complexity: "**Petrov Imports LLC** is a California-based import business dealing with international suppliers. Here's what makes this return complex:\n\n**Required forms beyond 1040:**\n1. Schedule C — Petrov Imports business income and expenses\n2. Form 5471 — if Vladimir has ownership in foreign corporations\n3. FBAR (FinCEN 114) — if foreign bank accounts exceed $10,000 aggregate\n4. Form 8938 (FATCA) — if foreign financial assets exceed reporting threshold\n5. Schedule B — foreign bank account disclosure questions\n\n**International complexity factors:**\n- Import transactions require customs documentation and cost of goods sold calculations\n- Foreign supplier payments may trigger Form 1099-NEC or withholding obligations\n- Currency conversion for all international transactions\n- Potential foreign tax credits if taxes paid abroad\n- Transfer pricing considerations if related-party transactions\n\n**Estimated prep time:** 8-12 hours (vs 2-3 for a standard Schedule C)\n\n**Recommended fee:** $1,200-$1,500 based on complexity. Current fee is $500 (Premium tier) which may be underpriced for this level of work. Consider discussing a fee adjustment during the March 29 call.\n\n**Critical:** You need his complete business financials, import records, and any foreign account statements before you can start. With 0 of 16 docs submitted, an extension is the right call.",
  },
  c12: { // Jasmine Torres
    blocking: "**Missing 1099s from freelance work** - 4 of 8 docs received but key income documents still outstanding after 4 days.",
    missing: "**Missing 4 docs** - 1099-NEC (freelance clients x2), 1099-INT (bank), Investment account statements.",
    timeline: "**Mar 18** - Intake\n**Mar 20** - Initial docs (4)\n**Mar 24** - Reminder sent\n**4 days** - Waiting on 1099s",
    risk: "**Moderate (40%)** - Active on portal, just needs the 1099s. Deadline achievable with quick follow-up.",
    payment: "**$400 total** - $100 deposit paid. Balance $300 due on filing.",
    summary: "Freelance designer with multiple income sources. Good communicator, just needs 1099 reminders.",
  },
};

const deepDiveResponses: Record<string, DemoResponse> = {
  priya: {
    steps: [
      { type: "thinking", text: "Analyzing intake vs 1099-NEC" },
      { type: "searching", text: "Cross-referencing platform data", source: "Priya Sharma" },
      { type: "found", text: "Analysis complete" },
    ],
    foundContent: {
      text: "**Income discrepancy: $34,200 actual vs $20,000 estimated**\n\nThe $14,200 gap between Priya\u2019s TikTok 1099-NEC and her intake estimate is significant but not unusual for creator-economy clients. Here\u2019s the full picture.\n\n**Why the gap exists**\n\nThe most likely explanation is simple underestimation. TikTok pays creators monthly through its Creator Fund plus ad revenue sharing. Most creators track their big payouts but miss the accumulation of smaller monthly deposits. If Priya started monetizing in March 2025 and saw growth through the year, her mental estimate would anchor on early months when income was lower.\n\nThe second possibility is a second platform. About 60% of TikTok creators with $30K+ income also earn from YouTube Shorts, Instagram Reels, Patreon, or brand sponsorships. If she has a 1099-K from PayPal, Stripe, or Venmo that she hasn\u2019t mentioned, that\u2019s additional unreported income.\n\nThe third possibility is brand partnerships. Sponsored content payments often come through talent agencies like Viral Nation or Creator.co, not through TikTok directly. These show up on separate 1099-NEC forms from the agency, not from TikTok.\n\n**Tax math at $34,200 self-employment income**\n\nSelf-employment tax (15.3% on 92.35%): $4,835. Federal income tax at her bracket (assuming single, standard deduction): approximately $2,400. California state tax: approximately $1,200. Total estimated liability: $8,400 to $9,000.\n\nIf she made zero estimated payments in 2025, she\u2019ll owe the full amount plus an underpayment penalty. The safe harbor rule requires paying either 100% of prior year tax or 90% of current year. Since this is her first year with significant SE income, she likely had no prior year SE tax, meaning she had no safe harbor protection. Penalty is roughly 8% annualized on the underpayment.\n\n**If there\u2019s a second platform**\n\nEvery additional $10K in unreported 1099 income adds roughly $2,500 to her total tax bill. If she has $15K in brand deal income she hasn\u2019t mentioned, her total liability jumps from $9K to roughly $13,000. That changes the conversation significantly.\n\n**Business deductions to explore**\n\nBefore you start prepping, ask about deductions that could offset the higher income. Common creator deductions: ring light, camera equipment, phone (business % only), internet (home office %), editing software subscriptions (Adobe, CapCut Pro), props and products used in content, and any travel for content creation. If she\u2019s spending $5K\u2013$8K on legitimate business expenses, that brings her SE income down to $26K\u2013$29K and reduces her tax bill by $1,500\u2013$2,000.\n\n**Questions to ask Priya**\n\n\u201CDid you earn income from any platforms besides TikTok? YouTube, Instagram, brand deals?\u201D\n\n\u201CDid you receive any 1099-K from PayPal, Stripe, or Venmo?\u201D\n\n\u201CDid you make any estimated tax payments in 2025?\u201D\n\n\u201CWhat business expenses did you have? Equipment, software, internet, phone?\u201D\n\n\u201CDo you have a dedicated workspace at home?\u201D\n\n**2026 quarterly estimates**\n\nRegardless of the outcome, you\u2019ll need to set up quarterly estimated payments for 2026. If her income stays around $34K, quarterly payments of $2,100\u2013$2,250 will keep her in safe harbor. If she\u2019s growing, budget $2,500/quarter. Recommend she set aside 30% of every payment she receives.",
    },
    summary: "Start by asking about other platforms and 1099-Ks. Then explore business deductions before prepping. Set up 2026 quarterly estimates regardless. Her total liability is $8,400\u2013$13,000 depending on whether there\u2019s a second income stream.",
  },
  carlos: {
    steps: [
      { type: "thinking", text: "Analyzing deduction history and equipment rules" },
      { type: "searching", text: "Pulling Schedule C, Section 179, QBI data", source: "Carlos Mendez" },
      { type: "found", text: "Analysis complete" },
    ],
    foundContent: {
      text: "**Paint booth deduction \u2014 Section 179 vs MACRS analysis**\n\nCarlos\u2019s auto body shop had $38K in deductions last year. A commercial paint booth runs $15K\u2013$40K depending on size and filtration.\n\n**Section 179 (immediate deduction)**\n\nFull cost deductible in year of purchase (up to $1,220,000 limit for 2025). Must be placed in service before Dec 31, 2025. Business use must be over 50%. A $30K booth would roughly double his total deductions to approximately $68K.\n\n**MACRS (depreciation over time)**\n\nPaint booth is 7-year property under MACRS. Year 1 deduction with bonus depreciation: 60% = $18K on a $30K booth. Better if he expects lower income next year.\n\n**Recommendation: Section 179.** Carlos\u2019s business is stable. Take the full deduction now.\n\n**Return complexity impact**\n\nCurrent tier: Standard ($350). With equipment purchase plus depreciation schedule: Complex ($500). Fee increase: $150.\n\n**QBI consideration**\n\nIf total deductions push his taxable income below the QBI threshold ($191,950 for MFJ), he keeps the full 20% QBI deduction. This is actually favorable \u2014 the paint booth helps both his tax liability and his QBI eligibility.\n\n**Documentation needed**\n\nPurchase invoice with date. Placed-in-service date. Business use percentage (likely 100% for a paint booth). Financing terms if applicable.",
    },
    summary: "Section 179 is the clear winner. Confirm the purchase date and get the invoice. Return moves to Complex tier ($500). The QBI math works in his favor.",
  },
  filingPace: {
    steps: [
      { type: "thinking", text: "Comparing filing pace to prior year" },
      { type: "searching", text: "Analyzing pipeline and revenue impact", source: "20 clients" },
      { type: "found", text: "Pace analysis ready" },
    ],
    foundContent: {
      text: "**Filing pace: 3/20 filed vs 5/20 last year at this date**\n\nYou\u2019re 2 returns behind pace. Here\u2019s the breakdown.\n\n**Ready to file today (2)**\n\nJames & Sofia Rodriguez \u2014 paid, signed, needs ERO signature. $500 fee. Aisha Johnson \u2014 paid, signed, needs ERO signature. $350 fee. Combined: $850 in revenue, approximately 5 minutes of work.\n\n**Ready to prep (2)**\n\nMiguel Sandoval \u2014 9/9 docs, all complete. Schedule C plus S-Corp. $500 fee. Anthony Russo \u2014 9/9 docs, cap gains calc needed. $350 fee.\n\n**Extension risk ($450 revenue at stake)**\n\nThomas DuBois \u2014 11/14 docs, missing 3 crypto records. If not in by Apr 5, file extension.\n\n**10-day filing plan**\n\n1. Today: Sign Rodriguez + Johnson = 5 filed, back on pace.\n2. This week: Prep Miguel + Anthony = 2 more in pipeline.\n3. By Apr 5: Get Thomas\u2019s crypto docs or file extension.\n4. By Apr 10: File Miguel + Anthony = 7 filed (ahead of last year).\n\n**Revenue projection**\n\nIf you file 4 more by Apr 15: $5,550 collected (79% of total). If Thomas extends: $450 shifts to October.",
    },
    summary: "Sign Rodriguez and Johnson right now \u2014 $850 and 2 filings in under 5 minutes. You\u2019ll be back on pace immediately.",
  },
  rodriguez: {
    steps: [
      { type: "thinking", text: "Analyzing bracket shift and NIIT impact" },
      { type: "searching", text: "Pulling W-2 data, thresholds, rental income", source: "Rodriguez family" },
      { type: "found", text: "Tax impact analysis complete" },
    ],
    foundContent: {
      text: "**Rodriguez bracket analysis: $167K to $285K combined income**\n\n**What changed**\n\n2024: James W-2 ($87K Riverside County) plus Sofia part-time ($80K) = $167K AGI. 2025: James W-2 ($87K) plus Sofia W-2 ($97K Living Robotics) plus rental income ($18K) = $285K AGI.\n\n**Bracket impact**\n\n2024: 22% bracket (MFJ $89,451\u2013$190,750). 2025: 24% bracket (MFJ $190,751\u2013$364,200). Marginal rate increase: 2 percentage points on approximately $94K of income.\n\n**Net Investment Income Tax (NIIT)**\n\nThreshold: $250,000 for MFJ. Their AGI ($285K) exceeds by $35K. NIIT = 3.8% on lesser of net investment income or excess AGI. Rental income ($18K) is subject = $684 additional tax. This is new \u2014 they\u2019ve never owed NIIT before.\n\n**Refund comparison**\n\n2024 refund: $2,180. 2025 estimated refund: $800\u2013$1,200 (depending on withholding). Drop: approximately $1,000\u2013$1,400 less than last year.\n\n**How to frame it for the client**\n\n\u201CGreat news \u2014 Sofia\u2019s new role significantly increased your household income. The trade-off is a higher bracket and a new investment income tax on your rental. Your refund will be smaller than last year, but that\u2019s because you earned $118K more.\u201D\n\n**Planning opportunities**\n\nMax out both 401(k)s ($23,500 each) to reduce AGI below NIIT threshold. Review rental depreciation schedule \u2014 cost segregation study could help. Consider Roth IRA (income limit $230K for full, $240K phase-out \u2014 they\u2019re over).",
    },
    summary: "Refund drops approximately $1,200 because of the bracket jump and new NIIT on rental income. Frame it as good news (more income) with a tax planning conversation about maxing 401(k)s.",
  },
  referral: {
    steps: [
      { type: "thinking", text: "Analyzing creator referral pipeline" },
      { type: "searching", text: "Checking intake data and segment potential", source: "Ashley Kim, Priya Sharma" },
      { type: "found", text: "Referral analysis complete" },
    ],
    foundContent: {
      text: "**Creator-economy referral analysis**\n\n**Current pipeline**\n\nPriya Sharma (TikTok, $34K income) \u2014 active, 4/7 docs. Ashley Kim (OnlyFans, income TBD) \u2014 referred by Priya, no engagement yet.\n\n**Creator client profile**\n\nTypical 1099-NEC income: $20K\u2013$150K. Multiple platforms means multiple 1099s. High deduction potential: equipment, home office, internet, software subscriptions, content creation expenses. Most need estimated tax payment setup. Usually young, mobile-first, want fast communication.\n\n**Pricing for creator returns**\n\nSimple (single platform, under $50K): Standard tier ($350). Complex (multi-platform, over $50K, business entity): Complex tier ($500). Priya is borderline \u2014 if second platform exists, she\u2019s Complex.\n\n**Referral economics**\n\nCreator networks are tight \u2014 one good experience leads to 2\u20133 referrals. If Priya refers 2 more at $350\u2013$500 each: $700\u2013$1,000 additional revenue. Lifetime value (3-year retention): $1,050\u2013$1,500 per creator client. 5-client creator niche = $5K\u2013$7.5K annual recurring revenue.\n\n**Recommendation**\n\nPrioritize Priya\u2019s return for speed, not just correctness. A 48-hour turnaround after docs are complete would be remarkable in her world. She\u2019ll post about it.",
    },
    summary: "One happy creator client can build a $5K+ annual niche. Priya is the entry point \u2014 prioritize her turnaround speed.",
  },
};

function matchResponse(query: string, clientCtx?: ClientContext): DemoResponse {
  const q = query.toLowerCase();

  // Intelligence brief deep dives — highest priority, check first
  if (q.includes("deep dive") && q.includes("priya")) return deepDiveResponses.priya;
  if (q.includes("deep dive") && q.includes("carlos")) return deepDiveResponses.carlos;
  if (q.includes("filing pace") || (q.includes("analyze") && q.includes("pace"))) return deepDiveResponses.filingPace;
  if (q.includes("deep dive") && q.includes("rodriguez")) return deepDiveResponses.rodriguez;
  if (q.includes("referral") || (q.includes("deep dive") && q.includes("ashley"))) return deepDiveResponses.referral;

  // Client-specific queries when context is set
  if (clientCtx) {
    const data = clientSpecificData[clientCtx.clientId];
    const firstName = clientCtx.clientName.split(" ")[0];

    if (data) {
      // What's blocking / blockers
      if (q.includes("blocking") || q.includes("blocker") || q.includes("stuck")) {
        return {
          steps: [
            { type: "thinking", text: `Analyzing ${firstName}'s return for blockers.` },
            { type: "searching", text: "Checking documents, payments, and activity", source: "Client record" },
            { type: "found", text: "Blocker analysis complete." },
          ],
          foundContent: { text: data.blocking },
          summary: `This is what's holding up ${firstName}'s return.`,
        };
      }

      // Missing documents
      if (q.includes("missing") || q.includes("document")) {
        return {
          steps: [
            { type: "thinking", text: `Checking ${firstName}'s document checklist.` },
            { type: "searching", text: "Comparing required vs received documents", source: "Document checklist" },
            { type: "found", text: "Document status retrieved." },
          ],
          foundContent: { text: data.missing },
          summary: `${firstName}'s document status is shown above. Want me to draft a reminder?`,
        };
      }

      // Timeline
      if (q.includes("timeline") || q.includes("history") || q.includes("activity")) {
        return {
          steps: [
            { type: "thinking", text: `Building ${firstName}'s engagement timeline.` },
            { type: "searching", text: "Retrieving activity log and milestones", source: "Activity history" },
            { type: "found", text: "Timeline constructed." },
          ],
          foundContent: { text: data.timeline },
          summary: `This is ${firstName}'s journey so far.`,
        };
      }

      // Extension risk
      if (q.includes("risk") || q.includes("extension") || q.includes("deadline")) {
        return {
          steps: [
            { type: "thinking", text: `Assessing ${firstName}'s extension risk.` },
            { type: "searching", text: "Analyzing completion rate, engagement, and complexity", source: "Risk model" },
            { type: "found", text: "Risk assessment complete." },
          ],
          foundContent: { text: data.risk },
          summary: `Here's ${firstName}'s deadline outlook.`,
        };
      }

      // Payment status
      if (q.includes("payment") || q.includes("paid") || q.includes("owe") || q.includes("balance")) {
        return {
          steps: [
            { type: "thinking", text: `Looking up ${firstName}'s payment status.` },
            { type: "searching", text: "Checking deposits, invoices, and balances", source: "Billing records" },
            { type: "found", text: "Payment status retrieved." },
          ],
          foundContent: { text: data.payment },
          summary: `${firstName}'s billing is shown above.`,
        };
      }

      // Complexity review
      if ((q.includes("complex") || q.includes("international") || q.includes("forms needed") || q.includes("prep time")) && data.complexity) {
        return {
          steps: [
            { type: "thinking", text: `Analyzing ${firstName}'s return complexity.` },
            { type: "searching", text: "Reviewing business type, international factors, required forms", source: "Client profile + IRS requirements" },
            { type: "found", text: "Complexity analysis complete." },
          ],
          foundContent: { text: data.complexity },
          summary: `${firstName}'s return is significantly more complex than standard. Review the form requirements and estimated prep time above.`,
        };
      }

      // Summary / overview
      if (q.includes("summar") || q.includes("overview") || q.includes("about")) {
        return {
          steps: [
            { type: "thinking", text: `Generating ${firstName}'s return summary.` },
            { type: "searching", text: "Compiling return type, complexity, and status", source: "Client profile" },
            { type: "found", text: "Summary ready." },
          ],
          foundContent: { text: data.summary },
          summary: `That's ${firstName}'s return at a glance.`,
        };
      }

      // Draft message
      if (q.includes("draft") || q.includes("message") || q.includes("follow")) {
        const draft = `Hey ${firstName}! Just checking in on your tax return. We're making progress but I wanted to touch base about a few items. Can you log into your portal when you have a moment? I've flagged the specific items we need. Let me know if you have any questions!`;
        return {
          steps: [
            { type: "thinking", text: `Drafting a message for ${firstName}.` },
            { type: "searching", text: "Analyzing current blockers and tone preferences", source: "Message history" },
            { type: "found", text: "Draft ready for review." },
          ],
          foundContent: { text: `**Draft message for ${firstName}:**\n\n"${draft}"` },
          summary: "Review and send from your Action Feed. I won't send anything without your approval.",
        };
      }
    }
  }

  // 1. Who needs my attention / urgent
  if (q.includes("attention") || q.includes("urgent") || q.includes("needs me") || q.includes("priority")) {
    return {
      steps: [
        { type: "thinking", text: "Scanning all 20 clients for items requiring your immediate attention." },
        { type: "searching", text: "Checking pipeline stages, overdue items, and pending actions", source: "20 clients analyzed" },
        { type: "found", text: "Found 7 items needing your attention across 4 categories." },
      ],
      foundContent: {
        text: "**ERO Signatures (2)** - Rodriguez ($500) and Aisha Johnson ($350) have paid and signed. Your countersignature files their returns.\n\n**Overdue Deposits (2)** - DeShawn Williams ($150, 10 days overdue) and Vladimir Petrov ($500, never paid).\n\n**Stale Clients (2)** - Tyrone Mitchell (9 days, no activity) and DeShawn Williams (12 days, never logged in).\n\n**Ready to Prep (1)** - Miguel Sandoval has all 9 docs. Waiting for you to begin preparation.",
      },
      summary: "Start with the ERO signatures — those are 2 returns you can file in under a minute. I've prepared draft messages for DeShawn and Tyrone in your Action Feed.",
    };
  }

  // 2. Outstanding revenue / money
  if (q.includes("revenue") || q.includes("outstanding") || q.includes("owed") || q.includes("collected") || q.includes("money")) {
    return {
      steps: [
        { type: "thinking", text: "Calculating revenue across all active clients and invoices." },
        { type: "searching", text: "Querying payment records, deposits, and outstanding balances", source: "20 clients, 15 invoices" },
        { type: "found", text: "Revenue breakdown ready." },
      ],
      foundContent: {
        text: "**Collected this season** - $2,400 across 6 clients (3 deposits + 3 full payments).\n\n**Outstanding** - $4,650 across 14 clients. Breakdown: $1,500 in unpaid deposits, $3,150 in pending balance invoices.\n\n**Overdue** - $650 (DeShawn Williams deposit $150, 10 days + Vladimir Petrov deposit $500, never paid).\n\n**Projected total** - $7,050 when all 20 active returns are complete.",
      },
      summary: "You've collected 34% of projected revenue. The two overdue deposits ($650) should be prioritized — want me to draft payment reminders?",
    };
  }

  // 3. Portal logins
  if (q.includes("portal") || q.includes("logged in") || q.includes("login") || q.includes("never logged")) {
    return {
      steps: [
        { type: "thinking", text: "Checking portal access records for all active clients." },
        { type: "searching", text: "Querying last login timestamps and account activation status", source: "20 clients checked" },
        { type: "found", text: "4 clients have never accessed the portal." },
      ],
      foundContent: {
        text: "**Never logged in** - Vladimir Petrov (new intake, 0/16 docs), DeShawn Williams (new client, 1/6 docs), Ashley Kim (new intake, 0/8 docs), Fatima Al-Hassan (new intake, 0/7 docs).\n\n**Last login 7+ days ago** - Tyrone Mitchell (Mar 19, collecting docs), Jasmine Torres (Mar 24, collecting docs).\n\n**Active on portal this week** - 14 clients have logged in within the last 7 days.",
      },
      summary: "The 4 who've never logged in are your highest drop-off risk. Vladimir and DeShawn are both new clients with unpaid deposits — they may need a phone call rather than a portal nudge.",
    };
  }

  // 4. Missing documents (specific client or general)
  if (q.includes("missing") || q.includes("document") || q.includes("docs")) {
    const isPriya = q.includes("priya");
    const isDeShawn = q.includes("deshawn");
    if (isPriya) {
      return {
        steps: [
          { type: "thinking", text: "Looking up Priya Sharma's document checklist." },
          { type: "searching", text: "Checking required vs received documents", source: "7 items on checklist" },
          { type: "found", text: "Priya is missing 4 of 7 required documents." },
        ],
        foundContent: {
          text: "**Received (3)** - W-2 (verified), Driver's license (verified), Prior year return (verified).\n\n**Missing (4)** - 1099-NEC (TikTok income, requested 12 days ago), 1099-NEC (brand partnerships, requested 12 days ago), 1099-INT (bank interest, requested 7 days ago), SSN card (requested 7 days ago).\n\n**Notes** - Priya is active on the portal (last login Mar 22) but hasn't uploaded since her initial batch.",
        },
        summary: "The 1099-NECs are the blockers — she can't move to prep without them. She mentioned in chat she \"has her TikTok 1099 but isn't sure how to upload it.\" A quick walkthrough message could unblock her.",
      };
    }
    return {
      steps: [
        { type: "thinking", text: "Scanning document checklists across all active clients." },
        { type: "searching", text: "Comparing required vs received documents per client", source: "20 clients, 142 documents" },
        { type: "found", text: "4 clients have significant missing documents." },
      ],
      foundContent: {
        text: "**Priya Sharma** - 3/7 docs (missing 1099-NECs for TikTok + brand deals, 1099-INT, SSN card). Active on portal.\n\n**DeShawn Williams** - 1/6 docs (missing W-2, 1099s, ID, SSN card, prior return). Never logged in.\n\n**Jasmine Torres** - 4/8 docs (missing 1099-NECs, mortgage 1098, investment statements). Last active Mar 24.\n\n**Tyrone Mitchell** - 2/5 docs (missing Uber 1099-NEC, mileage log, prior return). 9 days stale.",
      },
      summary: "DeShawn is the most behind — he hasn't even logged into the portal. Priya is closest to ready but stuck on the 1099 uploads. Want me to draft personalized follow-ups for each?",
    };
  }

  // 5. Draft a message
  if (q.includes("draft") || q.includes("message") || q.includes("write") || q.includes("send")) {
    const isDeShawn = q.includes("deshawn");
    const isVlad = q.includes("vladimir") || q.includes("vlad");
    const name = isDeShawn ? "DeShawn" : isVlad ? "Vladimir" : "the client";
    const draft = isDeShawn
      ? "Hey DeShawn! Just checking in on your tax return. I noticed we're still waiting on your W-2 and a few other documents. The quickest way to get started is through your client portal — I've sent you the link. It only takes about 10 minutes to upload everything. Let me know if you have any questions!"
      : isVlad
      ? "Vladimir, I wanted to reach out about your 2025 tax return. Given the complexity of Petrov Imports, we should discuss whether filing an extension makes sense. Can we schedule a call this week?"
      : "Hi! Just following up on your tax return. We're making good progress but need a couple more items from you. Check your portal for the specific documents we're waiting on. Happy to help if you have any questions!";
    return {
      steps: [
        { type: "thinking", text: `Analyzing ${name}'s current status and communication history.` },
        { type: "searching", text: "Checking pipeline stage, missing items, and last contact", source: "Client record + message history" },
        { type: "found", text: "Draft generated based on context." },
      ],
      foundContent: { text: `**Draft message for ${name}:**\n\n"${draft}"` },
      summary: "This draft is in your Action Feed for review. Edit or send as-is — I won't send anything without your approval.",
    };
  }

  // 6. Returns needing review
  if (q.includes("review") || q.includes("prepared") || q.includes("ready to file")) {
    return {
      steps: [
        { type: "thinking", text: "Checking for clients in the Client Review stage." },
        { type: "searching", text: "Querying pipeline for client_review and pay_and_sign stages", source: "20 clients checked" },
        { type: "found", text: "4 clients need your attention at the review/signing stage." },
      ],
      foundContent: {
        text: "**Client Review (2)** - Roberto Fuentes (return sent Mar 25, 5 days waiting, last portal login Mar 26) and Mei-Lin Wu (return sent Mar 26, 4 days waiting, active on portal).\n\n**Pay & Sign (2)** - James & Sofia Rodriguez ($500 paid, 8879 signed, awaiting ERO) and Aisha Johnson ($350 paid, 8879 signed, awaiting ERO).",
      },
      summary: "Rodriguez and Johnson are ready to file right now — just need your ERO signature. Roberto and Mei-Lin are reviewing but haven't signed yet. Roberto is 5 days in — might be worth a nudge.",
    };
  }

  // 7. Season comparison
  if (q.includes("season") || q.includes("compare") || q.includes("last year") || q.includes("progress")) {
    return {
      steps: [
        { type: "thinking", text: "Comparing current season metrics against last year's data." },
        { type: "searching", text: "Analyzing filing rates, turnaround times, and revenue", source: "2025 vs 2026 season data" },
        { type: "found", text: "Season comparison ready." },
      ],
      foundContent: {
        text: "**Filed** - 3 of 20 returns (15%). Last year at this point: 5 of 18 (28%). You're behind pace by ~2 returns.\n\n**Average turnaround** - 12 days from docs complete to filed. Last year: 14 days. You're faster this season.\n\n**Revenue** - $2,400 collected of $7,050 projected (34%). Last year at this date: $3,200 of $6,300 (51%).\n\n**Client mix** - More complex returns this year (8 business vs 5 last year). Average fee up 18% ($352 vs $298).",
      },
      summary: "You're behind on filings but handling more complex (and higher-value) returns. The bottleneck is document collection — 6 clients are still in Collecting Docs. Clearing that backlog is the fastest path to catching up.",
    };
  }

  // 8. Extension risk
  if (q.includes("extension") || q.includes("risk") || q.includes("deadline") || q.includes("april 15")) {
    return {
      steps: [
        { type: "thinking", text: "Analyzing extension risk based on document completion, engagement, and complexity." },
        { type: "searching", text: "Scoring each client's likelihood of needing an extension", source: "20 clients scored" },
        { type: "found", text: "3 clients at high risk of needing extensions." },
      ],
      foundContent: {
        text: "**Almost certain (95%)** - Vladimir Petrov: 0/16 docs, never logged in, complex international business. No engagement whatsoever.\n\n**Likely (70%)** - DeShawn Williams: 1/6 docs, deposit unpaid, new client. 12 days since last activity.\n\n**Moderate (45%)** - Tyrone Mitchell: 2/5 docs, extended last year too. History of late filing.\n\n**Low risk** - All other clients are on track or have enough time to complete.",
      },
      summary: "Vladimir almost certainly needs an extension — recommend scheduling a call to confirm and file Form 4868 this week. DeShawn might still make it with aggressive follow-up.",
    };
  }

  // (Deep dive responses handled by early returns at top of function)

  // Old deep dive block — now unreachable, kept as dead code for reference
  if (false) {
    return {
      steps: [
        { type: "thinking" as const, text: "Analyzing intake estimate vs 1099-NEC" },
        { type: "searching" as const, text: "Cross-referencing platform data and payment history", source: "Priya Sharma" },
        { type: "found" as const, text: "Analysis complete" },
      ],
      foundContent: {
        text: "**Income discrepancy: $34,200 actual vs $20,000 estimated**\n\nThe $14,200 gap between Priya\u2019s TikTok 1099-NEC and her intake estimate is significant but not unusual for creator-economy clients. Here\u2019s the full picture.\n\n**Why the gap exists**\n\nThe most likely explanation is simple underestimation. TikTok pays creators monthly through its Creator Fund plus ad revenue sharing. Most creators track their big payouts but miss the accumulation of smaller monthly deposits. If Priya started monetizing in March 2025 and saw growth through the year, her mental estimate would anchor on early months when income was lower.\n\nThe second possibility is a second platform. About 60% of TikTok creators with $30K+ income also earn from YouTube Shorts, Instagram Reels, Patreon, or brand sponsorships. If she has a 1099-K from PayPal, Stripe, or Venmo that she hasn\u2019t mentioned, that\u2019s additional unreported income.\n\nThe third possibility is brand partnerships. Sponsored content payments often come through talent agencies like Viral Nation or Creator.co, not through TikTok directly. These show up on separate 1099-NEC forms from the agency, not from TikTok.\n\n**Tax math at $34,200 self-employment income**\n\nSelf-employment tax (15.3% on 92.35%): $4,835. Federal income tax at her bracket (assuming single, standard deduction): approximately $2,400. California state tax: approximately $1,200. Total estimated liability: $8,400 to $9,000.\n\nIf she made zero estimated payments in 2025, she\u2019ll owe the full amount plus an underpayment penalty. The safe harbor rule requires paying either 100% of prior year tax or 90% of current year. Since this is her first year with significant SE income, she likely had no prior year SE tax, meaning she had no safe harbor protection. Penalty is roughly 8% annualized on the underpayment.\n\n**If there\u2019s a second platform**\n\nEvery additional $10K in unreported 1099 income adds roughly $2,500 to her total tax bill. If she has $15K in brand deal income she hasn\u2019t mentioned, her total liability jumps from $9K to roughly $13,000. That changes the conversation significantly.\n\n**Business deductions to explore**\n\nBefore you start prepping, ask about deductions that could offset the higher income. Common creator deductions: ring light, camera equipment, phone (business % only), internet (home office %), editing software subscriptions (Adobe, CapCut Pro), props and products used in content, and any travel for content creation. If she\u2019s spending $5K-$8K on legitimate business expenses, that brings her SE income down to $26K-$29K and reduces her tax bill by $1,500-$2,000.\n\n**Questions to ask Priya**\n\n\u201CDid you earn income from any platforms besides TikTok? YouTube, Instagram, brand deals?\u201D\n\n\u201CDid you receive any 1099-K from PayPal, Stripe, or Venmo?\u201D\n\n\u201CDid you make any estimated tax payments in 2025?\u201D\n\n\u201CWhat business expenses did you have? Equipment, software, internet, phone?\u201D\n\n\u201CDo you have a dedicated workspace at home?\u201D\n\n**2026 quarterly estimates**\n\nRegardless of the outcome, you\u2019ll need to set up quarterly estimated payments for 2026. If her income stays around $34K, quarterly payments of $2,100-$2,250 will keep her in safe harbor. If she\u2019s growing, budget $2,500/quarter. Recommend she set aside 30% of every payment she receives.",
      },
      summary: "Start by asking about other platforms and 1099-Ks. Then explore business deductions before prepping. Set up 2026 quarterly estimates regardless. Her total liability is $8,400-$13,000 depending on whether there\u2019s a second income stream.",
    };
  }

  if (q.includes("deep dive") && q.includes("carlos")) {
    return {
      steps: [
        { type: "thinking", text: "Analyzing Carlos's deduction history and paint booth scenario." },
        { type: "searching", text: "Pulling Schedule C data, equipment rules, QBI thresholds", source: "Carlos & Elena Mendez (c15)" },
        { type: "found", text: "Section 179 analysis complete." },
      ],
      foundContent: {
        text: "**Paint booth deduction \u2014 Section 179 vs MACRS analysis**\n\nCarlos\u2019s auto body shop had $38K in deductions last year. A commercial paint booth runs $15K\u2013$40K depending on size and filtration.\n\n**Section 179 (immediate deduction):**\n\u2022 Full cost deductible in year of purchase (up to $1,220,000 limit for 2025)\n\u2022 Must be placed in service before Dec 31, 2025\n\u2022 Business use must be >50%\n\u2022 A $30K booth would roughly double his total deductions to ~$68K\n\n**MACRS (depreciation over time):**\n\u2022 Paint booth = 7-year property under MACRS\n\u2022 Year 1 deduction with bonus depreciation: 60% = $18K on a $30K booth\n\u2022 Better if he expects lower income next year\n\n**Recommendation: Section 179** \u2014 Carlos\u2019s business is stable. Take the full deduction now.\n\n**Return complexity impact:**\n\u2022 Current tier: Standard ($350)\n\u2022 With equipment purchase + depreciation schedule: Complex ($500)\n\u2022 Fee increase: $150\n\n**QBI consideration:**\n\u2022 If total deductions push his taxable income below the QBI threshold ($191,950 for MFJ), he keeps the full 20% QBI deduction\n\u2022 This is actually favorable \u2014 the paint booth helps both his tax liability AND his QBI eligibility\n\n**Documentation needed:**\n\u2022 Purchase invoice with date\n\u2022 Placed-in-service date\n\u2022 Business use percentage (likely 100% for a paint booth)\n\u2022 Financing terms if applicable",
      },
      summary: "Section 179 is the clear winner here. Confirm the purchase date and get the invoice. His return moves to Complex tier ($500). The QBI math actually works in his favor.",
    };
  }

  if (q.includes("filing pace") || (q.includes("analyze") && q.includes("pace"))) {
    return {
      steps: [
        { type: "thinking", text: "Comparing current filing pace to prior year benchmarks." },
        { type: "searching", text: "Analyzing pipeline stages, ready-to-file returns, revenue impact", source: "20 clients, prior year data" },
        { type: "found", text: "Pace analysis and filing plan ready." },
      ],
      foundContent: {
        text: "**Filing pace: 3/20 filed vs 5/20 last year at this date**\n\nYou\u2019re 2 returns behind pace. Here\u2019s the breakdown:\n\n**Ready to file today (2):**\n\u2022 James & Sofia Rodriguez \u2014 paid, signed, needs ERO signature. $500 fee.\n\u2022 Aisha Johnson \u2014 paid, signed, needs ERO signature. $350 fee.\n\u2022 Combined: $850 in revenue, ~5 minutes of work.\n\n**Ready to prep (2):**\n\u2022 Miguel Sandoval \u2014 9/9 docs, all complete. Schedule C + S-Corp. $500 fee.\n\u2022 Anthony Russo \u2014 9/9 docs, cap gains calc needed. $350 fee.\n\n**Extension risk ($450 revenue at stake):**\n\u2022 Thomas DuBois \u2014 11/14 docs, missing 3 crypto records. If not in by Apr 5, file extension.\n\n**10-day filing plan:**\n1. **Today:** Sign Rodriguez + Johnson = 5 filed, back on pace\n2. **This week:** Prep Miguel + Anthony = 2 more in pipeline\n3. **By Apr 5:** Get Thomas\u2019s crypto docs or file extension\n4. **By Apr 10:** File Miguel + Anthony = 7 filed (ahead of last year)\n\n**Revenue projection:**\n\u2022 If you file 4 more by Apr 15: $5,550 collected (79% of total)\n\u2022 If Thomas extends: $450 shifts to October",
      },
      summary: "Sign Rodriguez and Johnson right now \u2014 that\u2019s $850 and 2 filings in under 5 minutes. You\u2019ll be back on pace immediately.",
    };
  }

  if (q.includes("deep dive") && q.includes("rodriguez")) {
    return {
      steps: [
        { type: "thinking", text: "Analyzing Rodriguez family tax bracket shift." },
        { type: "searching", text: "Pulling W-2 data, bracket thresholds, NIIT rules, rental income", source: "James & Sofia Rodriguez (c1)" },
        { type: "found", text: "Tax impact analysis complete." },
      ],
      foundContent: {
        text: "**Rodriguez bracket analysis: $167K \u2192 $285K combined income**\n\n**What changed:**\n\u2022 2024: James W-2 ($87K Riverside County) + Sofia part-time ($80K) = $167K AGI\n\u2022 2025: James W-2 ($87K) + Sofia W-2 ($97K Living Robotics) + rental income ($18K) = $285K AGI\n\n**Bracket impact:**\n\u2022 2024: 22% bracket (MFJ $89,451\u2013$190,750)\n\u2022 2025: 24% bracket (MFJ $190,751\u2013$364,200)\n\u2022 Marginal rate increase: 2 percentage points on ~$94K of income\n\n**Net Investment Income Tax (NIIT):**\n\u2022 Threshold: $250,000 for MFJ\n\u2022 Their AGI ($285K) exceeds by $35K\n\u2022 NIIT = 3.8% on lesser of net investment income or excess AGI\n\u2022 Rental income ($18K) is subject = $684 additional tax\n\u2022 **This is new** \u2014 they\u2019ve never owed NIIT before\n\n**Refund comparison:**\n\u2022 2024 refund: $2,180\n\u2022 2025 estimated refund: $800\u2013$1,200 (depending on withholding)\n\u2022 Drop: ~$1,000\u2013$1,400 less than last year\n\n**How to frame it for the client:**\n\u201CGreat news \u2014 Sofia\u2019s new role significantly increased your household income. The trade-off is a higher bracket and a new investment income tax on your rental. Your refund will be smaller than last year, but that\u2019s because you earned $118K more.\u201D\n\n**Planning opportunities:**\n\u2022 Max out both 401(k)s ($23,500 each) to reduce AGI below NIIT threshold\n\u2022 Review rental depreciation schedule \u2014 cost segregation study could help\n\u2022 Consider Roth IRA (income limit $230K for full, $240K phase-out \u2014 they\u2019re over)",
      },
      summary: "The refund drops ~$1,200 because of the bracket jump and new NIIT on rental income. Frame it as good news (more income) with a tax planning conversation about maxing 401(k)s.",
    };
  }

  if (q.includes("referral") || (q.includes("deep dive") && q.includes("ashley"))) {
    return {
      steps: [
        { type: "thinking", text: "Analyzing creator-economy referral pipeline." },
        { type: "searching", text: "Checking intake data, referral source, client segment potential", source: "Ashley Kim, Priya Sharma" },
        { type: "found", text: "Referral analysis complete." },
      ],
      foundContent: {
        text: "**Creator-economy referral analysis**\n\n**Current pipeline:**\n\u2022 Priya Sharma (TikTok, $34K income) \u2014 active, 4/7 docs\n\u2022 Ashley Kim (OnlyFans, income TBD) \u2014 referred by Priya, no engagement yet\n\n**Creator client profile:**\n\u2022 Typical 1099-NEC income: $20K\u2013$150K\n\u2022 Multiple platforms = multiple 1099s\n\u2022 High deduction potential: equipment, home office, internet, software subscriptions, content creation expenses\n\u2022 Most need estimated tax payment setup\n\u2022 Usually young, mobile-first, want fast communication\n\n**Pricing for creator returns:**\n\u2022 Simple (single platform, <$50K): Standard tier ($350)\n\u2022 Complex (multi-platform, >$50K, business entity): Complex tier ($500)\n\u2022 Priya is borderline \u2014 if second platform exists, she\u2019s Complex\n\n**Referral economics:**\n\u2022 Creator networks are tight \u2014 one good experience = 2\u20133 referrals\n\u2022 If Priya refers 2 more at $350\u2013$500 each: $700\u2013$1,000 additional revenue\n\u2022 Lifetime value (3-year retention): $1,050\u2013$1,500 per creator client\n\u2022 5-client creator niche = $5K\u2013$7.5K annual recurring revenue\n\n**Recommendation:**\nPrioritize Priya\u2019s return for speed, not just correctness. A 48-hour turnaround after docs are complete would be remarkable in her world. She\u2019ll post about it.",
      },
      summary: "One happy creator client can build a $5K+ annual niche. Priya is the entry point \u2014 prioritize her turnaround speed.",
    };
  }

  // Fallback — still helpful, not a dead end
  return {
    steps: [
      { type: "thinking", text: "Processing your question against practice data." },
      { type: "searching", text: "Searching client records, documents, and activity", source: "20 clients queried" },
      { type: "found", text: "Here's what I found." },
    ],
    foundContent: {
      text: "I can help with that. Here are some things I can look up right now:\n\n**Clients** - Status, missing docs, deposit history, portal activity, extension risk.\n\n**Revenue** - Collected vs outstanding, overdue payments, projected totals.\n\n**Workflow** - Who's ready to prep, who needs your review, who needs ERO signing.\n\n**Communication** - Draft messages, follow-up suggestions, stale client alerts.",
    },
    summary: "Try asking about a specific client by name, or ask about deadlines, revenue, or documents. I work best with specific questions.",
  };
}

/* ------------------------------------------------------------------ */
/*  Icons matching the inspiration                                     */
/* ------------------------------------------------------------------ */
function ThinkingIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-muted-foreground">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2.5 2.5" />
      <path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchingIcon() {
  return <SearchIcon className="text-muted-foreground" size={20} />;
}

function BulletIcon() {
  return (
    <div className="mt-[3px] flex size-[22px] items-center justify-center">
      <div className="bg-muted-foreground size-[6px] rounded-full" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Cycling Suggestions                                                */
/* ------------------------------------------------------------------ */
function CyclingSuggestions({ onSelect, clientContext }: { onSelect: (q: string) => void; clientContext: ClientContext }) {
  const [setIdx, setSetIdx] = useState(0);

  // Use client-specific suggestions when viewing a client, otherwise general suggestions
  const suggestions = clientContext
    ? getClientSpecificSuggestions(clientContext.clientName)
    : allSuggestions;

  const setsOf3 = [
    [suggestions[0], suggestions[1], suggestions[2]],
    [suggestions[3], suggestions[4], suggestions[5]],
    [suggestions[6], suggestions[7], suggestions[0]],
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setSetIdx(prev => (prev + 1) % setsOf3.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [setsOf3.length]);

  // Reset to first set when client context changes
  useEffect(() => {
    setSetIdx(0);
  }, [clientContext?.clientId]);

  const currentSet = setsOf3[setIdx];

  return (
    <div className="pt-2">
      {clientContext && (
        <p className="text-[10px] text-muted-foreground mb-2">
          Viewing: <span className="font-medium text-foreground">{clientContext.clientName}</span>
        </p>
      )}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${clientContext?.clientId || 'global'}-${setIdx}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="flex flex-wrap gap-2"
        >
          {currentSet.map((q) => (
            <button
              key={q}
              onClick={() => onSelect(q)}
              className="rounded-full border border-white/15 bg-white/40 px-4 py-2.5 text-[12px] font-medium text-foreground shadow-sm backdrop-blur-md transition-colors hover:bg-white/60 dark:bg-white/5 dark:hover:bg-white/10"
            >
              {q}
            </button>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Fullscreen Landing (Harvey-style)                                  */
/* ------------------------------------------------------------------ */

/**
 * Common integrations + MCP-style connectors for the accounting / CPA space.
 * Replaces Harvey's legal stack (Vault, EDGAR, LexisNexis, iManage).
 */
type Integration = {
  name: string;
  /** Path to a PNG logo in /public/integrations. Preferred over IconNode when present. */
  src?: string;
  /** Fallback render for integrations without a real logo (letter badges). */
  IconNode?: () => React.ReactNode;
  /** Background tint behind the icon/letter — only used for IconNode fallback. */
  bg?: string;
};

/** Primary integration row — real brand logos. */
const PETAL_INTEGRATIONS: Integration[] = [
  { name: "QuickBooks Online", src: "/integrations/quickbooks.png" },
  { name: "Xero", src: "/integrations/xero.png" },
  { name: "Drake Tax", src: "/integrations/drake.png" },
  { name: "IRS e-Services", src: "/integrations/irs.png" },
  { name: "DocuSign", src: "/integrations/docusign.png" },
  { name: "Plaid", src: "/integrations/plaid.png" },
  { name: "TaxDome", src: "/integrations/taxdome.png" },
];

/**
 * Additional integrations available under the "More" popover. Letter badges
 * for now; swap to real logos as we acquire them.
 */
const MORE_INTEGRATIONS: Integration[] = [
  { name: "Bill.com",        IconNode: () => <span className="text-[9px] font-bold leading-none text-red-700 dark:text-red-300">B</span>, bg: "bg-red-100 dark:bg-red-950/40" },
  { name: "Gusto",           IconNode: () => <span className="text-[9px] font-bold leading-none text-orange-700 dark:text-orange-300">G</span>, bg: "bg-orange-100 dark:bg-orange-950/40" },
  { name: "Box",             IconNode: () => <span className="text-[9px] font-bold leading-none text-blue-700 dark:text-blue-300">B</span>, bg: "bg-blue-100 dark:bg-blue-950/40" },
  { name: "Microsoft 365",   IconNode: () => <span className="text-[9px] font-bold leading-none text-amber-700 dark:text-amber-300">M</span>, bg: "bg-amber-100 dark:bg-amber-950/40" },
  { name: "Karbon",          IconNode: () => <span className="text-[9px] font-bold leading-none text-emerald-700 dark:text-emerald-300">K</span>, bg: "bg-emerald-100 dark:bg-emerald-950/40" },
  { name: "Canopy",          IconNode: () => <span className="text-[9px] font-bold leading-none text-sky-700 dark:text-sky-300">C</span>, bg: "bg-sky-100 dark:bg-sky-950/40" },
  { name: "ProSeries",       IconNode: () => <span className="text-[9px] font-bold leading-none text-emerald-700 dark:text-emerald-300">P</span>, bg: "bg-emerald-100 dark:bg-emerald-950/40" },
  { name: "UltraTax",        IconNode: () => <span className="text-[9px] font-bold leading-none text-blue-700 dark:text-blue-300">U</span>, bg: "bg-blue-100 dark:bg-blue-950/40" },
  { name: "Stripe",          IconNode: () => <span className="text-[9px] font-bold leading-none text-purple-700 dark:text-purple-300">S</span>, bg: "bg-purple-100 dark:bg-purple-950/40" },
  { name: "Google Drive",    IconNode: () => <span className="text-[9px] font-bold leading-none text-green-700 dark:text-green-300">GD</span>, bg: "bg-green-100 dark:bg-green-950/40" },
];

/** All integrations indexed by name — for resolving attached source chips. */
const ALL_INTEGRATIONS: Record<string, Integration> = Object.fromEntries(
  [...PETAL_INTEGRATIONS, ...MORE_INTEGRATIONS].map(i => [i.name, i])
);

/** Renders just the small icon chip — used both in pills + in attached chips. */
function IntegrationIconChip({ integ, size = "size-5" }: { integ: Integration; size?: string }) {
  if (integ.src) {
    return (
      <span className={`flex ${size} shrink-0 items-center justify-center overflow-hidden rounded bg-white p-0.5 ring-1 ring-border/50`}>
        <img src={integ.src} alt={integ.name} className="size-full object-contain" />
      </span>
    );
  }
  const I = integ.IconNode!;
  return (
    <span className={`flex ${size} shrink-0 items-center justify-center rounded ${integ.bg ?? "bg-muted"}`}>
      <I />
    </span>
  );
}

/** Mock "Recent" list — the kind of thing a real session-history table would back. */
const PETAL_RECENT = [
  { type: "table" as const, title: "Analyze deductions across portfolio", date: "Today" },
  { type: "chat" as const, title: "Compare service tiers vs collections rate", date: "Today" },
  { type: "doc" as const, title: "Email to client for missing 1099s", date: "Yesterday" },
  { type: "table" as const, title: "Form 8867 compliance scan", date: "Yesterday" },
];

/**
 * Client scoping dropdown — searchable, Command-driven.
 * Defaults to "All clients". Picking a client sets `clientContext` on the panel
 * so subsequent prompts (and integration cards) are scoped to that client.
 */
function ClientPicker() {
  const { clientContext, setClientContext } = useAIPanel();
  const [open, setOpen] = useState(false);
  const selected = clientContext;

  // Initials for the small avatar chip
  const initials = (name: string) =>
    name.split(" ").map(s => s[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cnLite(
            "flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] transition-colors",
            "hover:bg-muted hover:text-foreground",
            selected ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {selected ? (
            <>
              <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-[8px] font-semibold uppercase">
                {initials(selected.clientName)}
              </span>
              <span className="font-medium">{selected.clientName}</span>
              <span
                role="button"
                aria-label="Clear client"
                onClick={(e) => { e.stopPropagation(); setClientContext(null); }}
                className="ml-0.5 rounded p-0.5 text-muted-foreground/60 hover:bg-muted hover:text-foreground"
              >
                <XIcon size={10} />
              </span>
            </>
          ) : (
            <>
              <Users size={12} />
              <span>All clients</span>
              <ChevronDown size={11} className="text-muted-foreground/60" />
            </>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-[320px] p-0 overflow-hidden"
      >
        <Command>
          <CommandInput placeholder={`Search ${clients.length} clients...`} className="h-10" />
          <CommandList className="max-h-[340px]">
            <CommandEmpty className="py-6 text-center text-xs text-muted-foreground">
              No clients match
            </CommandEmpty>
            <CommandGroup heading="Scope">
              <CommandItem
                value="__all__ all clients"
                onSelect={() => { setClientContext(null); setOpen(false); }}
                className="flex items-center gap-2.5 py-2"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground/5 text-muted-foreground">
                  <Globe size={13} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium">All clients</div>
                  <div className="text-[11px] text-muted-foreground">Broad query across your roster</div>
                </div>
                {!selected && <Check size={14} className="text-foreground" />}
              </CommandItem>
            </CommandGroup>
            <CommandGroup heading="Clients">
              {clients.map((c) => {
                const isSelected = selected?.clientId === c.id;
                return (
                  <CommandItem
                    key={c.id}
                    value={`${c.fullName} ${c.email ?? ""} ${c.returnStage}`}
                    onSelect={() => {
                      setClientContext({ clientId: c.id, clientName: c.fullName });
                      setOpen(false);
                    }}
                    className="flex items-center gap-2.5 py-2"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-[10px] font-semibold uppercase text-foreground/80">
                      {initials(c.fullName)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium truncate">{c.fullName}</div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {prettyStage(c.returnStage)} · {c.filingStatus?.toUpperCase?.() ?? ""}
                      </div>
                    </div>
                    {isSelected && <Check size={14} className="text-foreground" />}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Saved-prompt library — seeded with the canonical CPA/EA workflows Antonio
 * is likely to reach for. Click to fire the prompt against the current
 * client-scope. New saved prompts would be inserted into this list (in
 * production: user-editable + persisted via the same store as completions).
 */
const PETAL_SAVED_PROMPTS: { category: string; items: { title: string; prompt: string }[] }[] = [
  {
    category: "Compliance",
    items: [
      { title: "Find clients missing 1099s", prompt: "Which clients still need to submit 1099 forms for this tax year?" },
      { title: "Check Form 8867 due diligence", prompt: "Run a Form 8867 compliance scan across all returns claiming EIC, CTC/ACTC/ODC, AOTC, or HOH." },
      { title: "Identify HOH eligibility", prompt: "Verify Head of Household filing status eligibility for the scoped client(s)." },
    ],
  },
  {
    category: "Calculations",
    items: [
      { title: "Compute QBI deduction", prompt: "Calculate the Section 199A Qualified Business Income deduction for this client." },
      { title: "Calculate AMT exposure", prompt: "Compute Alternative Minimum Tax exposure for this client." },
      { title: "Estimated tax safe harbor", prompt: "Compute Q1–Q4 estimated tax payments needed to satisfy the safe-harbor rule for this client." },
    ],
  },
  {
    category: "Analysis",
    items: [
      { title: "Compare year-over-year changes", prompt: "Compare this year's return to last year's and surface significant changes (income, deductions, credits)." },
      { title: "Find clients past deposit due date", prompt: "Which clients have unpaid deposits past their due date?" },
      { title: "Review return for red flags", prompt: "Scan this client's return for audit triggers, missed deductions, and computational errors." },
    ],
  },
];

// Stable empty array for the SSR snapshot — same identity each call so
// useSyncExternalStore doesn't warn about server/client mismatch.
const EMPTY_PROMPTS: SavedPrompt[] = [];

function PromptsLibrary({ onSelect }: { onSelect: (q: string) => void }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"list" | "add">("list");
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");

  // Subscribe to the user-saved prompts store
  const userPrompts = useSyncExternalStore<SavedPrompt[]>(
    subscribePetalPrompts,
    getPetalPrompts,
    () => EMPTY_PROMPTS
  );

  const canSave = newTitle.trim().length > 0 && newBody.trim().length > 0;

  const resetForm = () => {
    setNewTitle("");
    setNewBody("");
    setMode("list");
  };

  const handleSave = () => {
    if (!canSave) return;
    addPetalPrompt({ title: newTitle, prompt: newBody });
    resetForm();
  };

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) resetForm();
      }}
    >
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          Prompts <ChevronDown size={11} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={6} className="w-[360px] p-0 overflow-hidden">
        {mode === "add" ? (
          // ─── Add new prompt form ───
          <div className="p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="text-[13px] font-semibold">New prompt</div>
              <button
                onClick={resetForm}
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Cancel"
              >
                <XIcon size={14} />
              </button>
            </div>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Title — e.g. Find missing K-1s"
              className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-[13px] outline-none transition-colors focus:border-foreground/30"
              autoFocus
            />
            <textarea
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              placeholder="The prompt Petal will run when you pick this..."
              rows={4}
              className="w-full resize-none rounded-md border border-border bg-background px-2.5 py-1.5 text-[12px] leading-relaxed outline-none transition-colors focus:border-foreground/30"
            />
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" size="sm" className="h-7 text-[12px]" onClick={resetForm}>
                Cancel
              </Button>
              <Button size="sm" className="h-7 gap-1 text-[12px]" disabled={!canSave} onClick={handleSave}>
                <Check size={12} /> Save prompt
              </Button>
            </div>
          </div>
        ) : (
          // ─── List view ───
          <Command>
            <CommandInput placeholder="Search saved prompts..." className="h-10" />
            <CommandList className="max-h-[380px]">
              <CommandEmpty className="py-6 text-center text-xs text-muted-foreground">
                No prompts match
              </CommandEmpty>

              {/* User-saved prompts (newest first) */}
              {userPrompts.length > 0 && (
                <CommandGroup heading="My prompts">
                  {userPrompts.map((p) => (
                    <CommandItem
                      key={p.id}
                      value={`${p.title} ${p.prompt}`}
                      onSelect={() => { onSelect(p.prompt); setOpen(false); }}
                      className="group flex flex-col items-start gap-0.5 py-2"
                    >
                      <div className="flex w-full items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-medium">{p.title}</div>
                          <div className="text-[11px] text-muted-foreground line-clamp-1">{p.prompt}</div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); deletePetalPrompt(p.id); }}
                          className="shrink-0 rounded p-0.5 text-muted-foreground/40 opacity-0 transition-all hover:bg-muted hover:text-foreground group-hover:opacity-100"
                          aria-label={`Delete ${p.title}`}
                        >
                          <XIcon size={11} />
                        </button>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Default canonical prompts */}
              {PETAL_SAVED_PROMPTS.map((group) => (
                <CommandGroup key={group.category} heading={group.category}>
                  {group.items.map((item) => (
                    <CommandItem
                      key={item.title}
                      value={`${item.title} ${item.prompt}`}
                      onSelect={() => { onSelect(item.prompt); setOpen(false); }}
                      className="flex flex-col items-start gap-0.5 py-2"
                    >
                      <div className="text-[13px] font-medium">{item.title}</div>
                      <div className="text-[11px] text-muted-foreground line-clamp-1">{item.prompt}</div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>

            {/* Footer — "Save new prompt" action */}
            <div className="border-t border-border/60 p-2">
              <button
                onClick={() => setMode("add")}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[12px] font-medium text-foreground/85 transition-colors hover:bg-muted"
              >
                <Plus size={13} className="text-muted-foreground" />
                Save a new prompt
              </button>
            </div>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  );
}

// Tiny local className util — avoids importing the heavier cn() in this file
function cnLite(...args: (string | false | null | undefined)[]) {
  return args.filter(Boolean).join(" ");
}

function prettyStage(stage: string): string {
  return stage.split("_").map(w => w[0]?.toUpperCase() + w.slice(1)).join(" ");
}

/** Shared pill renderer for both the primary row and the More popover. */
function IntegrationPill({
  integ,
  attached,
  onToggle,
}: {
  integ: Integration;
  attached: boolean;
  onToggle: (name: string) => void;
}) {
  return (
    <button
      onClick={() => onToggle(integ.name)}
      className={cnLite(
        "group flex items-center gap-2 rounded-md border px-3 py-1.5 transition-colors",
        attached
          ? "border-foreground/40 bg-muted text-foreground"
          : "border-border bg-card text-foreground/85 hover:bg-muted"
      )}
    >
      <IntegrationIconChip integ={integ} />
      <span className="text-[13px]">{integ.name}</span>
      {attached ? (
        <XIcon size={12} className="text-muted-foreground" />
      ) : (
        <Plus size={12} className="text-muted-foreground/60 transition-colors group-hover:text-foreground" />
      )}
    </button>
  );
}

/** "+ More" pill that opens a popover with the rest of the CPA integrations. */
function MoreIntegrationsPopover({
  attachedSources,
  onToggle,
}: {
  attachedSources: string[];
  onToggle: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const attachedFromMore = MORE_INTEGRATIONS.filter(i => attachedSources.includes(i.name)).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cnLite(
            "group flex items-center gap-1.5 rounded-md border px-3 py-1.5 transition-colors",
            attachedFromMore > 0
              ? "border-foreground/40 bg-muted text-foreground"
              : "border-dashed border-border bg-card text-foreground/85 hover:bg-muted"
          )}
        >
          <Plus size={13} className="text-muted-foreground" />
          <span className="text-[13px]">
            More{attachedFromMore > 0 ? ` · ${attachedFromMore}` : ""}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="center" sideOffset={6} className="w-[340px] p-0 overflow-hidden">
        <Command>
          <CommandInput placeholder="Search integrations..." className="h-10" />
          <CommandList className="max-h-[320px]">
            <CommandEmpty className="py-6 text-center text-xs text-muted-foreground">
              No integrations match
            </CommandEmpty>
            <CommandGroup heading="More integrations">
              {MORE_INTEGRATIONS.map((integ) => {
                const attached = attachedSources.includes(integ.name);
                return (
                  <CommandItem
                    key={integ.name}
                    value={integ.name}
                    onSelect={() => { onToggle(integ.name); /* keep popover open so user can attach multiple */ }}
                    className="flex items-center gap-2.5 py-2"
                  >
                    <IntegrationIconChip integ={integ} />
                    <span className="flex-1 text-[13px] font-medium">{integ.name}</span>
                    {attached ? (
                      <Check size={14} className="text-foreground" />
                    ) : (
                      <Plus size={13} className="text-muted-foreground/60" />
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function AIPanelLanding({ onAsk }: { onAsk: (q: string) => void }) {
  const [input, setInput] = useState("");
  /** Integrations the user has attached as sources for the next prompt.
      Matches Harvey's @-mention pattern — clicking a pill adds/removes it. */
  const [attachedSources, setAttachedSources] = useState<string[]>([]);

  const toggleSource = (name: string) => {
    setAttachedSources(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const send = () => {
    const q = input.trim();
    if (!q && attachedSources.length === 0) return;
    // Prepend @-mentions so they're visible in the user's chat bubble
    const sourcePrefix = attachedSources.length > 0
      ? attachedSources.map(s => `@${s}`).join(" ") + " "
      : "";
    setInput("");
    setAttachedSources([]);
    onAsk(sourcePrefix + (q || "Tell me what's relevant from these sources."));
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-8 pt-12 pb-16 lg:pt-20">
        {/* Serif title — matches Harvey's centerpiece */}
        <h1 className="font-display text-center text-5xl font-medium tracking-tight">
          Ask Petal
        </h1>

        {/* Action chips */}
        <div className="flex justify-center gap-2.5">
          <button
            onClick={() => onAsk("Draft a follow-up message for a client")}
            className="flex items-center gap-2 rounded-md border border-border bg-card px-3.5 py-2 text-[13px] text-foreground/85 transition-colors hover:bg-muted"
          >
            <FileTextIcon size={13} className="text-muted-foreground" /> Draft message
          </button>
          <button
            onClick={() => onAsk("Review this tax return for issues")}
            className="flex items-center gap-2 rounded-md border border-border bg-card px-3.5 py-2 text-[13px] text-foreground/85 transition-colors hover:bg-muted"
          >
            <TableIcon size={13} className="text-muted-foreground" /> Review return
          </button>
        </div>

        {/* Client scope / Prompts row + main input */}
        <div className="space-y-2 pt-6">
          <div className="flex items-center justify-between px-1">
            <ClientPicker />
            <PromptsLibrary onSelect={onAsk} />
          </div>

          <div className="rounded-2xl border border-border bg-muted/30 transition-colors focus-within:border-foreground/30 focus-within:bg-muted/50">
            {/* Attached source chips — appear when user clicks integration pills below
                or picks one from the More popover. Resolves from ALL_INTEGRATIONS so
                long-tail picks render their letter badge correctly. */}
            {attachedSources.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-3 pt-3">
                {attachedSources.map(name => {
                  const integ = ALL_INTEGRATIONS[name];
                  if (!integ) return null;
                  return (
                    <span
                      key={name}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-[11px] font-medium"
                    >
                      <IntegrationIconChip integ={integ} size="size-3.5" />
                      {name}
                      <button
                        onClick={() => toggleSource(name)}
                        className="ml-0.5 rounded p-0.5 text-muted-foreground/60 hover:bg-muted hover:text-foreground"
                        aria-label={`Remove ${name}`}
                      >
                        <XIcon size={10} />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Ask Petal anything. Type @ to add sources."
              rows={2}
              className="w-full resize-none bg-transparent px-4 pt-3.5 text-[14px] text-foreground placeholder:text-muted-foreground outline-none"
            />
            <div className="flex items-center justify-between border-t border-border/40 px-3 py-2">
              <div className="flex items-center gap-4 text-[12px] text-muted-foreground">
                <button className="flex items-center gap-1.5 transition-colors hover:text-foreground">
                  <Paperclip size={13} /> Files
                </button>
                <button className="flex items-center gap-1.5 transition-colors hover:text-foreground">
                  <Database size={13} /> Sources
                </button>
              </div>
              <button
                onClick={send}
                disabled={!input.trim()}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                aria-label="Send"
              >
                <SendIcon size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Integration cards — click to attach as a source for the next prompt.
            Attached pills get a highlighted border + × icon; click again to remove.
            "+ More" at the end opens a popover with the long-tail integrations. */}
        <div className="flex flex-wrap justify-center gap-2.5">
          {PETAL_INTEGRATIONS.map(i => (
            <IntegrationPill
              key={i.name}
              integ={i}
              attached={attachedSources.includes(i.name)}
              onToggle={toggleSource}
            />
          ))}
          <MoreIntegrationsPopover
            attachedSources={attachedSources}
            onToggle={toggleSource}
          />
        </div>

        {/* Recent items */}
        <div className="space-y-2 pt-6">
          <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground">Recent</h3>
          <ul className="divide-y divide-border/60">
            {PETAL_RECENT.map((r, i) => {
              const I = r.type === "table" ? TableIcon : r.type === "chat" ? MessageSquareTextIcon : FileTextIcon;
              return (
                <li key={i}>
                  <button
                    onClick={() => onAsk(r.title)}
                    className="-mx-2 flex w-full items-center justify-between gap-4 rounded px-2 py-3 text-left transition-colors hover:bg-muted/30"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <I size={14} className="shrink-0 text-muted-foreground" />
                      <span className="truncate text-[14px]">{r.title}</span>
                    </div>
                    <span className="shrink-0 text-[12px] text-muted-foreground">{r.date}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  The Panel                                                          */
/* ------------------------------------------------------------------ */
export function AIPanel() {
  const { isOpen, isFullPage, close, toggleFullPage, pendingQuestion, clearPendingQuestion, clientContext } = useAIPanel();

  // When fullscreen, leave the dashboard sidebar visible by anchoring the panel
  // to start after it (vs. covering the whole viewport at 100% width).
  const sidebar = useSidebar();
  const sidebarOffset = sidebar.isMobile
    ? "0px"
    : sidebar.state === "collapsed"
      ? "var(--sidebar-width-icon, 3rem)"
      : "var(--sidebar-width, 13.5rem)";

  // Auto-close the panel when the user navigates away. Belt-and-suspenders
  // with the sidebar's onClick handler (nav-main.tsx) — the sidebar fires
  // close() *before* the route changes for a clean animation, this effect
  // catches any other navigation path (back button, programmatic nav, etc.).
  //
  // The prev ref ALWAYS updates each effect run — earlier we only updated it
  // inside the close branch, which left the ref stale when isOpen was false
  // and caused the panel to immediately self-close on its next open.
  const pathname = usePathname();
  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    const prev = prevPathnameRef.current;
    prevPathnameRef.current = pathname;
    if (prev !== pathname && isOpen) {
      close();
    }
  }, [pathname, isOpen, close]);

  // Start empty so the fullscreen Harvey-style landing renders on first open.
  // (demoMessages is kept around for ad-hoc demos but no longer the default.)
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  // Voice results state
  const [voiceResults, setVoiceResults] = useState<typeof voiceDumpSession | null>(null);
  const [voiceChecked, setVoiceChecked] = useState<Record<string, boolean>>({});
  // Track client assignments (can be changed by user for ambiguous/wrong matches)
  const [voiceClientMap, setVoiceClientMap] = useState<Record<string, { clientId: string; clientName: string } | null>>({});
  // Track which items have their client picker open
  const [openPickerId, setOpenPickerId] = useState<string | null>(null);

  // Handle pending questions from other components
  useEffect(() => {
    if (pendingQuestion && isOpen) {
      if (pendingQuestion === "__voice_results__") {
        // Show voice results instead of sending as a question
        setVoiceResults(voiceDumpSession);
        const defaultChecked: Record<string, boolean> = {};
        const defaultClientMap: Record<string, { clientId: string; clientName: string } | null> = {};
        voiceDumpSession.parsedItems.forEach(item => {
          defaultChecked[item.id] = item.category === "action";
          defaultClientMap[item.id] = item.clientId && item.clientName
            ? { clientId: item.clientId, clientName: item.clientName }
            : null;
        });
        setVoiceChecked(defaultChecked);
        setVoiceClientMap(defaultClientMap);
        setOpenPickerId(null);
        clearPendingQuestion();
      } else {
        handleSend(pendingQuestion);
        clearPendingQuestion();
      }
    }
  }, [pendingQuestion, isOpen]);

  const handleSend = (text?: string) => {
    const msg = text || input;
    if (!msg.trim()) return;
    const userMsgId = Date.now().toString();
    const aiMsgId = (Date.now() + 1).toString();

    setMessages((prev) => [...prev, { id: userMsgId, role: "user", content: msg }]);
    setInput("");
    setIsTyping(true);

    const response = matchResponse(msg, clientContext);

    // Phase 1: Show first reasoning step
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { id: aiMsgId, role: "assistant", content: "", steps: [response.steps[0]] },
      ]);
    }, 800);

    // Phase 2: Add searching step
    setTimeout(() => {
      setMessages((prev) => prev.map(m => m.id === aiMsgId ? {
        ...m, steps: [response.steps[0], response.steps[1]]
      } : m));
    }, 1800);

    // Phase 3: Add found step
    setTimeout(() => {
      setMessages((prev) => prev.map(m => m.id === aiMsgId ? {
        ...m, steps: response.steps
      } : m));
    }, 2600);

    // Phase 4: Stream answer word by word (fast)
    setTimeout(() => {
      const fullText = response.foundContent.text;
      const words = fullText.split(/(\s+)/);
      const wordsPerTick = 3;
      const tickInterval = 25;
      let tickIndex = 0;

      // Start with empty content visible
      setMessages((prev) => prev.map(m => m.id === aiMsgId ? {
        ...m,
        foundContent: { text: "" },
      } : m));

      const timer = setInterval(() => {
        tickIndex++;
        const wordCount = tickIndex * wordsPerTick;
        if (wordCount >= words.length) {
          clearInterval(timer);
          setMessages((prev) => prev.map(m => m.id === aiMsgId ? {
            ...m,
            foundContent: response.foundContent,
            summary: response.summary,
          } : m));
          return;
        }
        setMessages((prev) => prev.map(m => m.id === aiMsgId ? {
          ...m,
          foundContent: { text: words.slice(0, wordCount).join("") },
        } : m));
      }, tickInterval);
    }, 3400);
  };

  const [expandedThinking, setExpandedThinking] = useState<Record<string, boolean>>({});

  const renderMessages = () => messages.map((msg) => (
    <div key={msg.id}>
      {msg.role === "user" ? (
        <div className="rounded-xl border border-white/15 bg-white/40 px-5 py-3.5 shadow-sm backdrop-blur-md dark:bg-white/5 transition-all duration-500" style={{ fontSize: isFullPage ? '14.5px' : '13px' }}>
          <p className="text-foreground leading-[1.6]">{msg.content}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Collapsible reasoning chain */}
          {msg.steps && msg.steps.length > 0 && (
            <button
              onClick={() => setExpandedThinking(prev => ({ ...prev, [msg.id]: !prev[msg.id] }))}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted/50"
            >
              <div className="flex size-4 items-center justify-center">
                <div className="size-1.5 rounded-full bg-primary animate-pulse" />
              </div>
              <span className="text-[11px] text-muted-foreground">
                {expandedThinking[msg.id] ? "Hide reasoning" : `Reasoned over ${msg.steps.length} steps`}
              </span>
              <svg className={`size-3 text-muted-foreground transition-transform ${expandedThinking[msg.id] ? "rotate-180" : ""}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 4.5L6 7.5L9 4.5" /></svg>
            </button>
          )}

          {expandedThinking[msg.id] && msg.steps && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} transition={{ duration: 0.25 }} className="ml-4 space-y-1 overflow-hidden border-l border-border/40 pl-3 py-1">
              {msg.steps.map((step, i) => (
                <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.08, duration: 0.25 }} className="flex items-center gap-2 py-0.5">
                  <div className="shrink-0">
                    {step.type === "thinking" && <div className="size-1.5 rounded-full bg-muted-foreground/30" />}
                    {step.type === "searching" && <SearchIcon size={12} className="text-muted-foreground/40" />}
                    {step.type === "found" && <div className="size-1.5 rounded-full bg-emerald-500/50" />}
                  </div>
                  <p className="text-muted-foreground/70 text-[11px] leading-snug">{step.text}</p>
                  {step.source && (
                    <span className="text-[10px] text-muted-foreground/40">{step.source}</span>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Found content - formatted with bold/bullets, animated in */}
          {msg.foundContent && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
              className="pl-0.5 transition-all duration-500"
              style={{ fontSize: isFullPage ? '14.5px' : '13px', lineHeight: '1.75' }}
            >
              <div className="space-y-[1em]">
              {msg.foundContent.text.split("\n\n").map((block, i) => {
                if (block.startsWith("**")) {
                  const [bold, ...rest] = block.split(" - ");
                  const cleanBold = bold.replace(/\*\*/g, "");
                  // Section header (no dash separator, just bold text)
                  if (rest.length === 0 || cleanBold.length > 40) {
                    return (
                      <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04, duration: 0.4 }} className="pt-[0.3em]">
                        <p className="font-bold text-foreground" style={{ fontSize: isFullPage ? '15.5px' : '14px' }}>{cleanBold}</p>
                      </motion.div>
                    );
                  }
                  return (
                    <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04, duration: 0.4 }} className="flex items-start gap-2">
                      <span className="mt-[0.55em] size-1 shrink-0 rounded-full bg-foreground/40" />
                      <p>
                        <span className="font-semibold text-foreground">{cleanBold}</span>
                        <span className="text-foreground/80"> {rest.join(" - ")}</span>
                      </p>
                    </motion.div>
                  );
                }
                return <motion.p key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04, duration: 0.4 }} className="text-foreground/80">{block}</motion.p>;
              })}
              </div>
            </motion.div>
          )}

          {/* Summary - animated in last */}
          {msg.summary && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="text-foreground font-semibold leading-relaxed pt-3 transition-all duration-500"
              style={{ fontSize: isFullPage ? '15px' : '13.5px' }}
            >
              {msg.summary}
            </motion.p>
          )}

          {/* Action icons - smaller */}
          <div className="flex items-center gap-1 pt-0.5">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground size-7"><ShareIcon size={14} /></Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground size-7"><RefreshCwIcon size={14} /></Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground size-7"><CopyIcon size={14} /></Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground size-7"><MoreHorizontalIcon size={14} /></Button>
          </div>
        </div>
      )}
    </div>
  ));

  return (
    <aside
      className="fixed right-0 top-0 bottom-0 z-40 flex flex-col overflow-hidden border-l transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
      style={{
        // Fullscreen leaves the dashboard sidebar visible — width = viewport − sidebar
        width: isOpen
          ? (isFullPage ? `calc(100% - ${sidebarOffset})` : 440)
          : 0,
        opacity: isOpen ? 1 : 0,
      }}
    >
      <div className={`flex h-full flex-col rounded-l-2xl bg-card px-3 pt-3 shadow-lg backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isFullPage ? "w-full" : "w-[440px]"}`}>
        {/* Header — full chrome in side panel, minimal close-only bar in fullscreen.
            In fullscreen the giant centered "Ask Petal" serif title in the landing
            is the only branding needed; the duplicate small header was noise. */}
        {isFullPage ? (
          <div className="flex shrink-0 items-center justify-end px-3 pt-3">
            {/* Only the full-page ↔ side-panel toggle in fullscreen. Close (X)
                is intentionally omitted — users navigate away (auto-closes) or
                collapse to side-panel mode via this button. */}
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-foreground"
              onClick={toggleFullPage}
              title="Collapse to side panel"
            >
              <MinimizeIcon size={15} />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-4 px-4 pb-6 pt-4">
            <Avatar className="size-11 shrink-0">
              <AvatarFallback className="bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-100 text-transparent">.</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] font-medium leading-tight">Ask Petal</h2>
              <p className="text-muted-foreground text-[13px]">Updated just now</p>
            </div>
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon" className="text-muted-foreground/50 hover:text-muted-foreground size-8" onClick={toggleFullPage} title="Expand">
                <MaximizeIcon size={15} />
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground size-9" onClick={close} title="Close">
                <XIcon size={18} />
              </Button>
            </div>
          </div>
        )}

        {/* Harvey-style landing for fullscreen + empty state. The moment the user
            sends a question (or voice results arrive), `messages.length` flips
            and we fall through to the chat scroll + input bar below. */}
        {isFullPage && messages.length === 0 && !voiceResults && !pendingQuestion ? (
          <AIPanelLanding onAsk={(q) => handleSend(q)} />
        ) : (
          <>
        {/* Scrollable messages - overscroll-contain prevents scroll bleed to main content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className={`pb-6 transition-all duration-500 ${isFullPage ? "mx-auto max-w-3xl px-8 space-y-10" : "px-4 space-y-8"}`}>
            {renderMessages()}

            {/* Voice Results Card */}
            {voiceResults && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border bg-background p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex size-6 items-center justify-center rounded-full bg-zinc-900 dark:bg-zinc-100">
                      <svg className="size-3 text-white dark:text-zinc-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                    </div>
                    <span className="text-sm font-semibold">Voice Note</span>
                  </div>
                  <button
                    onClick={() => { setVoiceResults(null); setOpenPickerId(null); }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Dismiss
                  </button>
                </div>

                {/* Transcript (collapsible) */}
                <details className="group">
                  <summary className="cursor-pointer text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                    View transcript
                  </summary>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed italic border-l-2 border-muted pl-3">
                    {voiceResults.transcript}
                  </p>
                </details>

                {/* Parsed items with smart client matching */}
                <div className="space-y-1">
                  {voiceResults.parsedItems.map(item => {
                    const assignedClient = voiceClientMap[item.id];
                    const isPickerOpen = openPickerId === item.id;

                    return (
                      <div key={item.id} className="relative">
                        <div className="flex items-start gap-2.5 rounded-lg px-2 py-2 hover:bg-muted/50 transition-colors">
                          <input
                            type="checkbox"
                            checked={voiceChecked[item.id] || false}
                            onChange={(e) => setVoiceChecked(prev => ({ ...prev, [item.id]: e.target.checked }))}
                            className="mt-0.5 rounded border-border cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-xs">{item.text}</span>
                            {/* Client tag */}
                            <div className="mt-1 flex items-center gap-1 flex-wrap">
                              {assignedClient ? (
                                /* Confident/assigned match: show tag with × */
                                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                  {assignedClient.clientName.split(" ")[0]} {assignedClient.clientName.split(" ").slice(-1)[0]?.[0]}.
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setVoiceClientMap(prev => ({ ...prev, [item.id]: null }));
                                    }}
                                    className="ml-0.5 rounded-full hover:bg-primary/20 transition-colors"
                                  >
                                    <XIcon className="size-2.5" />
                                  </button>
                                </span>
                              ) : (
                                /* No match: show "Link client" button */
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenPickerId(isPickerOpen ? null : item.id);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-full border border-dashed border-muted-foreground/30 px-2 py-0.5 text-[10px] text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                                >
                                  Link client <ChevronDown className="size-2.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Client picker dropdown */}
                        {isPickerOpen && (
                          <div className="ml-7 mb-1 rounded-lg border bg-background shadow-lg max-h-36 overflow-y-auto">
                            <div className="p-1.5">
                              {clients.filter(c => c.clientStatus !== "declined").slice(0, 10).map(c => (
                                <button
                                  key={c.id}
                                  onClick={() => {
                                    setVoiceClientMap(prev => ({ ...prev, [item.id]: { clientId: c.id, clientName: c.fullName } }));
                                    setOpenPickerId(null);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted transition-colors"
                                >
                                  <span className="font-medium">{c.fullName}</span>
                                  {c.businessName && <span className="text-[10px] text-muted-foreground">{c.businessName}</span>}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add to feed button */}
                <Button
                  size="sm"
                  className="w-full h-8 text-xs"
                  disabled={!Object.values(voiceChecked).some(v => v)}
                  onClick={() => {
                    const checkedCount = Object.values(voiceChecked).filter(v => v).length;
                    const clientLinked = Object.entries(voiceChecked).filter(([id, checked]) => checked && voiceClientMap[id]).length;
                    const personal = checkedCount - clientLinked;
                    setVoiceResults(null);
                    setVoiceChecked({});
                    setVoiceClientMap({});
                    setOpenPickerId(null);
                    const parts: string[] = [];
                    if (clientLinked > 0) parts.push(`${clientLinked} client action${clientLinked !== 1 ? "s" : ""}`);
                    if (personal > 0) parts.push(`${personal} personal task${personal !== 1 ? "s" : ""}`);
                    setMessages(prev => [...prev, {
                      id: Date.now().toString(),
                      role: "assistant",
                      content: "",
                      summary: `Added ${parts.join(" and ")} from your voice note.`,
                    }]);
                  }}
                >
                  Add {Object.values(voiceChecked).filter(v => v).length} to feed
                </Button>
              </motion.div>
            )}

            {isTyping && (
              <div className="flex items-center gap-2 rounded-lg px-2 py-2">
                <div className="flex gap-1">
                  <motion.div className="size-1.5 rounded-full bg-primary" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0 }} />
                  <motion.div className="size-1.5 rounded-full bg-primary" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }} />
                  <motion.div className="size-1.5 rounded-full bg-primary" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }} />
                </div>
                <span className="text-muted-foreground text-[11px]">Thinking...</span>
              </div>
            )}
            {messages.length <= 2 && !isTyping && (
              <CyclingSuggestions onSelect={handleSend} clientContext={clientContext} />
            )}
          </div>
        </div>

        {/* Input - fixed at bottom, outside scroll */}
        <div className={`shrink-0 pb-5 pt-4 transition-all duration-500 ${isFullPage ? "mx-auto w-full max-w-3xl px-8" : "px-4"}`}>
          <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/40 px-4 py-3 shadow-sm backdrop-blur-md dark:bg-white/5">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} placeholder="Ask about clients, documents, deadlines..." className="flex-1 bg-transparent text-[14px] text-foreground outline-none placeholder:text-muted-foreground" />
            <button onClick={() => handleSend()} disabled={!input.trim()} className="shrink-0 text-muted-foreground transition-colors hover:text-foreground disabled:text-muted-foreground/30"><SendIcon size={18} /></button>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">All suggestions require your review before sending.</p>
        </div>
          </>
        )}
      </div>
    </aside>
  );
}

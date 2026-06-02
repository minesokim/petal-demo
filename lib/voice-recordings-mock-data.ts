/**
 * Voice recordings mock data.
 *
 * Three sources, one summarization pipeline (Slant pattern):
 *   - in_person  - tapped record button in the app
 *   - video      - auto-recorded from Google Meet / Zoom (Petal bot joins)
 *   - phone      - auto-recorded inbound/outbound phone calls (Twilio)
 *
 * Each recording produces: raw transcript + AI summary + extracted facts
 * (which flow into the client's OmniContext memory).
 */

export type RecordingSource = "in_person" | "video" | "phone";

export interface VoiceRecording {
  id: string;
  source: RecordingSource;
  clientId?: string;
  clientName?: string;
  title: string;
  durationSec: number;
  recordedAt: string; // ISO
  summary: string;
  /** A few quoted excerpts from the transcript - what shows in the preview */
  excerpts: { speaker: string; text: string; tMin: number; tSec: number }[];
  /** Facts the memory-curator extracted from this call */
  extractedFacts: string[];
  /** Action items Petal suggested based on the call */
  actionItems: string[];
}

const now = new Date();
const hoursAgo = (n: number) => new Date(now.getTime() - n * 60 * 60 * 1000).toISOString();
const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000).toISOString();

export const VOICE_RECORDINGS: VoiceRecording[] = [
  {
    id: "v1",
    source: "in_person",
    clientId: "c21",
    clientName: "Sarah Mitchell",
    title: "Intro coffee · downtown Montclair",
    durationSec: 1437, // 23:57
    recordedAt: hoursAgo(2),
    summary:
      "Sarah is a freelance photographer transitioning to full-time self-employment. She's worried about Q4 estimates and whether to incorporate. Discussed Schedule C setup, home office eligibility, and S-Corp election math (probably not yet - income too low to justify payroll costs). Promised to send a setup checklist by Friday.",
    excerpts: [
      { speaker: "Antonio", text: "So tell me how the business has been going since we last talked.", tMin: 0, tSec: 42 },
      { speaker: "Sarah", text: "Better than I expected, honestly. I left the part-time job in February.", tMin: 1, tSec: 18 },
      { speaker: "Sarah", text: "My friend told me I should be an LLC. Is that right for me?", tMin: 11, tSec: 4 },
      { speaker: "Antonio", text: "Not yet - at your income level the S-Corp payroll cost would eat the savings.", tMin: 11, tSec: 28 },
    ],
    extractedFacts: [
      "Left part-time job · now full-time freelance photographer",
      "Considering LLC formation (Antonio: not yet)",
      "Income projection: ~$54K Schedule C",
      "Home office: dedicated 110 sqft space (qualifies)",
    ],
    actionItems: [
      "Send Schedule C setup checklist by Friday",
      "Schedule follow-up for Q4 estimate review (Oct 1)",
      "Update OmniContext: photographer business confirmed",
    ],
  },
  {
    id: "v2",
    source: "video",
    clientId: "c11",
    clientName: "David Park",
    title: "S-Corp return review · Zoom",
    durationSec: 2784, // 46:24
    recordedAt: hoursAgo(5),
    summary:
      "Reviewed Park Family Dental's 2025 S-Corp return. Walked through bonus depreciation election (took it - 60% for 2026), K-1 split between David and spouse (60/40, unchanged), and Q4 estimate adjustment. He approved everything verbally; I'll send the 8879 today. He also asked about adding his daughter to payroll next year (she's 16).",
    excerpts: [
      { speaker: "Antonio", text: "On the depreciation question - I'd recommend taking the bonus, even though it phases down next year.", tMin: 7, tSec: 12 },
      { speaker: "David", text: "Yeah, let's take it. What's the impact on this year's number?", tMin: 7, tSec: 38 },
      { speaker: "David", text: "Can my daughter work for the practice next year? She's 16, wants to save for college.", tMin: 38, tSec: 47 },
      { speaker: "Antonio", text: "Yes - actually a great strategy. We can talk about reasonable comp next time.", tMin: 39, tSec: 8 },
    ],
    extractedFacts: [
      "Bonus depreciation approved · $42K equipment placed in service",
      "K-1 split unchanged · 60/40 David/spouse",
      "Daughter (16) interested in payroll for 2026",
      "Next year planning: kiddie tax + earned income strategy",
    ],
    actionItems: [
      "Generate and send Form 8879 today",
      "Add 'daughter payroll planning' to 2026 advisory roadmap",
      "Schedule mid-year review for Q3 2026",
    ],
  },
  {
    id: "v3",
    source: "phone",
    clientId: "c4",
    clientName: "DeShawn Williams",
    title: "Inbound call · W-2 question",
    durationSec: 412, // 6:52
    recordedAt: daysAgo(1),
    summary:
      "DeShawn called to ask about getting his W-2 from his former employer. He left in November and hasn't received it. I walked him through the IRS Form 4852 process if it doesn't arrive by Feb 15. He confirmed he'll call the employer tomorrow first. Sounded stressed about the deadline - reassured him we have time and can file extension if needed.",
    excerpts: [
      { speaker: "DeShawn", text: "I left in November and they haven't sent it. They're not answering my texts.", tMin: 0, tSec: 38 },
      { speaker: "Antonio", text: "Try calling tomorrow morning first. If no response by Feb 15, we use Form 4852 as a substitute.", tMin: 1, tSec: 24 },
      { speaker: "DeShawn", text: "Will I get in trouble with the IRS if I don't have the W-2?", tMin: 4, tSec: 11 },
      { speaker: "Antonio", text: "No. The IRS knows employers sometimes don't deliver. We have several options.", tMin: 4, tSec: 28 },
    ],
    extractedFacts: [
      "Left previous employer in November 2025",
      "W-2 still missing as of recording date",
      "Anxious about IRS consequences (reassurance given)",
      "Plan: contact employer, then Form 4852 by Feb 15",
    ],
    actionItems: [
      "Follow up in 5 days to check W-2 status",
      "Pre-draft Form 4852 in case employer doesn't deliver",
      "Send DeShawn a written summary of his options",
    ],
  },
  {
    id: "v4",
    source: "in_person",
    clientId: "c9",
    clientName: "Miguel Sandoval",
    title: "Site visit · Sandoval Plumbing shop",
    durationSec: 2156, // 35:56
    recordedAt: daysAgo(2),
    summary:
      "Met at Miguel's plumbing shop to walk through equipment for §179 / depreciation planning. He bought a new truck ($48K) and two compressors ($6K each) in 2025. Discussed S-Corp election - he's interested but March 15 deadline was missed, so we'll target tax year 2027. Also flagged that his bookkeeper is mixing personal and business expenses on the same card.",
    excerpts: [
      { speaker: "Antonio", text: "When did the truck go into service?", tMin: 4, tSec: 8 },
      { speaker: "Miguel", text: "First week of November. I've been using it for jobs every day since.", tMin: 4, tSec: 17 },
      { speaker: "Antonio", text: "OK - we can fully expense it under §179. Saves you about $14K in taxes.", tMin: 4, tSec: 38 },
      { speaker: "Miguel", text: "And the S-Corp thing - what do you think? Am I ready?", tMin: 22, tSec: 11 },
    ],
    extractedFacts: [
      "Equipment purchases: $48K truck (Nov 2025) + 2x compressors ($12K total)",
      "§179 fully deductible - saves ~$14K",
      "Wants S-Corp election (March 15 deadline missed · target 2027)",
      "Bookkeeping: mixing personal/business on same card (advise separation)",
    ],
    actionItems: [
      "Add equipment to depreciation schedule with §179 election",
      "File Form 2553 for S-Corp election effective Jan 1, 2027",
      "Send Miguel bookkeeping separation checklist",
    ],
  },
  {
    id: "v5",
    source: "video",
    clientId: "c15",
    clientName: "Carlos & Elena Mendez",
    title: "Partnership return walkthrough · Google Meet",
    durationSec: 1980, // 33:00
    recordedAt: daysAgo(3),
    summary:
      "Walked Carlos and Elena through their 1065 partnership return for Mendez Auto Repair. Discussed the K-1 distributions, allocation of guaranteed payments, and the §179 election they want to take on the new lift ($28K). Carlos asked about adding their oldest son as a partner in 2027 (estate planning angle). Both signed off on the return.",
    excerpts: [
      { speaker: "Antonio", text: "The K-1 distributions look the same as last year - both at 50/50.", tMin: 8, tSec: 4 },
      { speaker: "Carlos", text: "Good. We want to keep it that way until we add Ricardo.", tMin: 8, tSec: 22 },
      { speaker: "Elena", text: "What about that lift we bought? Can we write the whole thing off?", tMin: 14, tSec: 38 },
      { speaker: "Antonio", text: "Yes - §179 takes the full $28K this year.", tMin: 14, tSec: 51 },
    ],
    extractedFacts: [
      "K-1 split: 50/50 Carlos/Elena (unchanged)",
      "§179 election on $28K shop lift",
      "Considering adding son Ricardo as partner in 2027 (estate planning)",
      "Partnership return approved verbally · ready for signature",
    ],
    actionItems: [
      "Send K-1s and 8879 for signature",
      "Add 'Ricardo partnership entry 2027' to advisory roadmap",
      "Schedule estate planning consult Q4 2026",
    ],
  },
  {
    id: "v6",
    source: "phone",
    clientId: "c2",
    clientName: "Priya Sharma",
    title: "Outbound call · 1099 mismatch clarification",
    durationSec: 318, // 5:18
    recordedAt: daysAgo(4),
    summary:
      "Quick call to Priya about the 1099-NEC mismatch. She confirmed the $4,320 amount is correct - she forgot to update her intake form when the second TikTok brand deal came in. Will update her Schedule C accordingly. She also mentioned she's planning to do paid speaking gigs in 2026 - flagged for next year's planning.",
    excerpts: [
      { speaker: "Antonio", text: "Hey Priya - quick question on your 1099 from TikTok.", tMin: 0, tSec: 8 },
      { speaker: "Priya", text: "Oh yeah, $4,320 is right. I forgot to update my form when the second deal closed.", tMin: 0, tSec: 28 },
      { speaker: "Priya", text: "BTW I'm starting paid speaking next year, anything I should think about?", tMin: 4, tSec: 12 },
      { speaker: "Antonio", text: "Yes - keep mileage logs and have me look at it before you sign any contracts.", tMin: 4, tSec: 34 },
    ],
    extractedFacts: [
      "1099-NEC amount $4,320 confirmed correct",
      "Second TikTok brand deal closed mid-year (not in intake)",
      "2026 plans: paid speaking gigs",
      "Action: mileage tracking + contract review for 2026",
    ],
    actionItems: [
      "Update Schedule C with correct $4,320 1099-NEC amount",
      "Add 'speaking income 2026' to client memory",
      "Send Priya mileage tracking app recommendations",
    ],
  },
];

export const SOURCE_META: Record<RecordingSource, { label: string; icon: string; description: string }> = {
  in_person: { label: "In person", icon: "mic", description: "Tapped record button" },
  video: { label: "Video call", icon: "video", description: "Petal joined the meeting" },
  phone: { label: "Phone call", icon: "phone", description: "Twilio-recorded" },
};

export function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Petal OS — Inbox: client comms across email / SMS / portal.
// Mock data for the agentic-os prototype.

export type Channel = "email" | "sms" | "portal";
export type ThreadStatus = "open" | "snoozed" | "done";

export interface Message {
  from: "client" | "firm";
  author: string;
  text: string;
  time: string;
}

export interface Thread {
  id: string;
  clientName: string;
  householdId: string;
  channel: Channel;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
  assignee: string; // owner key
  status: ThreadStatus;
  messages: Message[];
  /** a reply Petal pre-drafted, awaiting the preparer's send */
  petalDraft?: { skill: string; text: string };
}

export const channelMeta: Record<Channel, { label: string; tint: string; dot: string }> = {
  email: { label: "Email", tint: "bg-blue-50 text-blue-700", dot: "bg-blue-500" },
  sms: { label: "SMS", tint: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  portal: { label: "Portal", tint: "bg-violet-50 text-violet-700", dot: "bg-violet-500" },
};

export const threads: Thread[] = [
  {
    id: "t1", clientName: "Marcus Chen", householdId: "h-chen", channel: "email",
    subject: "Re: 2025 return — wages question", preview: "Yeah, the Riverside location closed in May. Let me know what you need.",
    time: "9:14 AM", unread: true, assignee: "u-antonio", status: "open",
    messages: [
      { from: "firm", author: "Antonio Vazquez", text: "Hi Marcus — quick one before I finalize the 2025 return. Your W-2 wages came in about 40% lower than last year. Can you confirm the second restaurant location closed in 2025?", time: "Yesterday 4:02 PM" },
      { from: "client", author: "Marcus Chen", text: "Yeah, the Riverside location closed in May. Slower year overall but the main spot is doing fine. Let me know what you need.", time: "9:14 AM" },
    ],
  },
  {
    id: "t2", clientName: "Priya Sharma", householdId: "h-priya", channel: "portal",
    subject: "Missing documents for your return", preview: "Petal drafted a reminder for the 4 outstanding items.",
    time: "8:30 AM", unread: true, assignee: "u-elena", status: "open",
    messages: [
      { from: "firm", author: "Elena Reyes", text: "Hi Priya! Welcome aboard. Whenever you get a chance, upload anything you have in the portal and we'll take it from there.", time: "Mon 11:00 AM" },
    ],
    petalDraft: { skill: "Doc Chase", text: "Hi Priya — to finish your 2025 return we still need a few things: your two 1099-NECs (the TikTok and brand-deal ones), your mileage log, and your home-office square footage. You can upload them right in the portal. No rush, but the sooner we have them the sooner we can wrap up. Thanks!" },
  },
  {
    id: "t3", clientName: "David Park", householdId: "h-park", channel: "email",
    subject: "Q4 books — 3 expenses to confirm", preview: "The $2,800 was a new sterilizer. The $910 was a team dinner.",
    time: "Yesterday", unread: false, assignee: "u-antonio", status: "open",
    messages: [
      { from: "firm", author: "Antonio Vazquez", text: "David — before we close Q4 I have three transactions without a category: $2,800 (Dec 3), $910 (Dec 9), and $500 (Dec 18). Can you tell me what each was for?", time: "Tue 2:10 PM" },
      { from: "client", author: "David Park", text: "Sure — the $2,800 was a new sterilizer (equipment), the $910 was a team holiday dinner (meals), and the $500 was the annual software renewal.", time: "Yesterday 9:40 AM" },
    ],
  },
  {
    id: "t4", clientName: "DeShawn Williams", householdId: "h-deshawn", channel: "sms",
    subject: "W-2 reminder", preview: "Got it, will upload tonight!",
    time: "2d ago", unread: false, assignee: "u-james", status: "open",
    messages: [
      { from: "firm", author: "James Okafor", text: "Hi DeShawn — friendly reminder we still need your W-2 to start your return. The deadline's coming up. You can text a photo right here or upload to the portal.", time: "2d ago" },
      { from: "client", author: "DeShawn Williams", text: "Got it, will upload tonight!", time: "2d ago" },
    ],
  },
  {
    id: "t5", clientName: "Roberto Fuentes", householdId: "h-fuentes", channel: "email",
    subject: "1120S review call — follow-up", preview: "Thanks for walking through the depreciation. One more question…",
    time: "3d ago", unread: false, assignee: "u-antonio", status: "open",
    messages: [
      { from: "client", author: "Roberto Fuentes", text: "Thanks for walking through the depreciation schedule on our call. One more question — can we still take bonus depreciation on the two trucks we bought in 2025?", time: "3d ago" },
    ],
  },
  {
    id: "t6", clientName: "Linda Nakamura", householdId: "h-linda", channel: "email",
    subject: "Refund received — thank you!", preview: "Just wanted to say thanks, the refund hit my account today.",
    time: "Last week", unread: false, assignee: "u-james", status: "done",
    messages: [
      { from: "client", author: "Linda Nakamura", text: "Just wanted to say thanks — the refund hit my account today. Appreciate you both making this painless again this year.", time: "Last week" },
      { from: "firm", author: "James Okafor", text: "So glad to hear it, Linda! Talk next year — and reach out anytime in between.", time: "Last week" },
    ],
  },
];

export const inboxFilters = [
  { key: "all", label: "All open", test: (t: Thread) => t.status === "open" },
  { key: "unassigned", label: "Unassigned", test: (t: Thread) => false },
  { key: "mine", label: "Mine", test: (t: Thread) => t.status === "open" && t.assignee === "u-antonio" },
  { key: "snoozed", label: "Snoozed", test: (t: Thread) => t.status === "snoozed" },
  { key: "done", label: "Done", test: (t: Thread) => t.status === "done" },
] as const;

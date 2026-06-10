// Petal OS — the scripted demo brain behind Ask Petal.
// Typed questions are keyword-matched against this bank; every answer is BUILT
// from the canonical fixtures at call time, so chat numbers always tie out.
// Unmatched questions get a graceful fallback with suggestions (live-demo safety).
//
// Matching: an entry matches when ANY of its `match` groups matches; a group
// matches when EVERY keyword in it appears in the input (a keyword may list
// synonyms separated by "|"). First match in bank order wins.

import { money, fmtDate, stageMeta, type SkillCategory } from "./vocab";
import {
  householdById, engagementsOf, tasksOf, noticesOf, positionsOf, taskById, noticeById,
  expectedDocs, brief, type Household,
} from "./firm";
import {
  needsYouTasks, docsOfHousehold, householdStage, householdFee, householdDeadline,
  invoiceOf, clientHealth, atRiskHouseholds, healthCounts, roiWeek, filedThisWeek,
  openNotices, noticeCountdown, billingKpis, feesInPipeline, feesBlockedByDocs,
  transcriptWatchCount, booksClients,
} from "./derive";

export interface ChatAnswer {
  /** plain text paragraphs; **bold** spans supported */
  paragraphs: string[];
  sources?: string[];
  links?: { label: string; href: string }[];
  /** the "Do" card — turns the answer into a run */
  action?: { title: string; desc: string; button: string; category: SkillCategory; href?: string };
  /** suggestion chips that SEND a new question (used by the fallback) */
  suggest?: string[];
}

export interface QAEntry {
  id: string;
  question: string;
  match: string[][];
  build: () => ChatAnswer;
}

const norm = (s: string) => " " + s.toLowerCase().replace(/[^a-z0-9$]+/g, " ").trim() + " ";

function groupMatches(input: string, group: string[]): boolean {
  return group.every(kw => kw.split("|").some(syn => input.includes(syn.trim())));
}

/* ── global bank ─────────────────────────────────────────────── */

export const QA_BANK: QAEntry[] = [
  {
    id: "qa-needs-me",
    question: "What needs me today?",
    match: [["what|anything", "need|do|review", "me|today|now"], ["needs me"], ["my queue"], ["what should i"]],
    build: () => {
      const queue = needsYouTasks();
      const decisions = queue.filter(t => t.status === "needs_decision");
      const mins = queue.reduce((s, t) => s + t.estimatedMin, 0);
      return {
        paragraphs: [
          `**${queue.length} items** are waiting on you — ${decisions.length} decisions and ${queue.length - decisions.length} drafts ready to approve. About **${mins} minutes** end to end.`,
          `The one I'd start with: **${decisions[0].title}** — ${householdById(decisions[0].householdId)!.name}. I've laid out three options and recommend option A.`,
        ],
        links: [
          { label: "Start reviewing", href: "/os/review" },
          { label: "Open tasks", href: "/os/tasks" },
        ],
      };
    },
  },
  {
    id: "qa-chen-wages",
    question: "Why did Marcus Chen's wages drop 40%?",
    match: [["chen|marcus", "wage|drop|salary|w-2|w2"], ["wages", "40"]],
    build: () => ({
      paragraphs: [
        "Marcus's W-2 wages fell from **$96,400** to **$58,000** because his second restaurant location closed in May 2026. That matches his Jun 23 email, where he confirmed winding down the Riverside spot.",
        "His K-1 income from Golden Dragon actually rose 19% over the same period, so total household income is down only ~8%, not 40%.",
        "One thing to confirm before filing: the reduction isn't backed by a termination letter in his documents, so I've flagged it rather than treating it as final — the flag is in your review queue.",
      ],
      sources: ["W-2 — Golden Dragon LLC", "Jun 23 email — Marcus", "2024 Return.pdf"],
      links: [{ label: "Open the flag", href: "/os/tasks?task=t-chen-wages" }],
      action: { title: "Clear the flag with his email as support?", desc: "Logs the confirmation and lets prep continue — lands in Tasks for your approval.", button: "Queue it", category: "prep_filing" },
    }),
  },
  {
    id: "qa-park-status",
    question: "Where does Park Family Dental stand?",
    match: [["park", "stand|status|where|return|story|catch"]],
    build: () => buildClientStatus(householdById("h-park")!),
  },
  {
    id: "qa-russo",
    question: "What's blocking the Russo return?",
    match: [["russo"], ["capital gains"], ["basis", "lots|missing|blocking"]],
    build: () => {
      const t = taskById("t-russo-basis")!;
      return {
        paragraphs: [
          "Anthony's Schwab 1099-B is missing cost basis on **7 of 23 lots** — filing as-is would overstate the gain by roughly **$3,100 of tax**, so I stopped rather than guess.",
          "Your options: **A** — request the purchase confirmations from Anthony (I've drafted the ask). **B** — pull historical basis from Schwab, which needs his authorization. **C** — proceed with $0 basis, which is compliant but costs him money.",
          "I recommend **A**. He answered the CP14 same-day earlier this month, so turnaround should be quick.",
        ],
        sources: ["1099-B — Schwab", "Schedule D worksheet"],
        links: [{ label: "Decide now", href: `/os/tasks?task=${t.id}` }],
      };
    },
  },
  {
    id: "qa-cp2000",
    question: "What's the deal with the Rodriguez CP2000?",
    match: [["cp2000"], ["rodriguez", "notice|irs|letter"], ["notice", "respond|due|deal"]],
    build: () => {
      const n = noticeById("n-cp2000")!;
      const days = noticeCountdown(n);
      return {
        paragraphs: [
          `The IRS proposes **+$1,210 of tax** on 2024 interest income it says was unreported. It WAS reported — the same interest is on Schedule B of the filed return; the payer matched it to the wrong year.`,
          `I drafted the response disputing the notice with Schedule B and the 1099-INT attached. The respond-by date is **${fmtDate(n.respondBy)}** — ${days} days out — and yesterday's transcript sweep picked up the matching AUR marker, so nothing new is hiding.`,
        ],
        sources: ["IRS CP2000 — tax year 2024", "2024 Return — Schedule B", "1099-INT — Chase"],
        links: [{ label: "Review the response", href: "/os/notices/n-cp2000" }],
      };
    },
  },
  {
    id: "qa-q2",
    question: "Who missed Q2 estimates?",
    match: [["q2|quarterly", "estimate|payment|missed"], ["missed", "estimate"]],
    build: () => ({
      paragraphs: [
        "Two clients show no Q2 payment confirmation: **Sandoval Plumbing** and **Park Family Dental**. The other 7 voucher clients all confirmed by Jun 15.",
        "Follow-ups with voucher copies are drafted and sitting in your queue — paying this week keeps any penalty negligible.",
      ],
      sources: ["Q2 voucher ledger", "Safe-harbor worksheet — 2025 returns"],
      links: [{ label: "Approve the follow-ups", href: "/os/tasks?task=t-est-q2" }],
    }),
  },
  {
    id: "qa-filed",
    question: "What did you file this week?",
    match: [["file|filed|efile", "week|recent|lately"]],
    build: () => {
      const filed = filedThisWeek();
      return {
        paragraphs: [
          `**${filed.length} returns** went out clean on ${fmtDate(filed[0].eFiledOn!)} after your approval — Linda's 1040 + Etsy Schedule C and Karen's 1040. All accepted by the IRS the next morning.`,
          "Every transmission is logged with its sources and your approval in the activity log.",
        ],
        links: [
          { label: "View in activity log", href: "/os/activity?run=run-efile-nak" },
          { label: "Returns board", href: "/os/returns" },
        ],
      };
    },
  },
  {
    id: "qa-roi",
    question: "How much time did you save me this week?",
    match: [["time|hours", "save|saved|return"], ["roi"], ["how much", "did you do|work"]],
    build: () => {
      const roi = roiWeek();
      return {
        paragraphs: [
          `This week I ran **${roi.actions} actions**: ${roi.docsCollected} documents collected and filed, ${roi.returnsFiled} returns e-filed clean, and ${roi.noticesDrafted} notice responses drafted.`,
          `Against your own minutes-per-task numbers, that's roughly **~${roi.hoursReturned} hours returned** — most of it document chasing and extraction you didn't have to touch.`,
        ],
        links: [{ label: "Activity log", href: "/os/activity" }],
      };
    },
  },
  {
    id: "qa-at-risk",
    question: "Which clients are at risk?",
    match: [["risk|trouble|behind|watch", "client|who|which"], ["at risk"]],
    build: () => {
      const list = atRiskHouseholds();
      const counts = healthCounts();
      const top = list.filter(x => x.health === "at_risk");
      return {
        paragraphs: [
          `**${counts.at_risk} at risk, ${counts.watch} on watch.** The two that matter today: **${top[0].household.name}** — ${top[0].reason.toLowerCase()} — and **${top[1].household.name}** — ${top[1].reason.toLowerCase()}.`,
          "Both have a next step already drafted in your queue. The watch-list four are flagged decisions and open documents — nothing time-critical yet.",
        ],
        links: [
          { label: "Open clients", href: "/os/clients" },
          { label: "Start reviewing", href: "/os/review" },
        ],
      };
    },
  },
  {
    id: "qa-deshawn",
    question: "Chase DeShawn's W-2 again",
    match: [["deshawn|williams", "chase|w-2|w2|remind|doc"]],
    build: () => ({
      paragraphs: [
        "DeShawn's W-2 from Hartline Logistics is still the only thing blocking his return — three messages since Jun 12, no upload. Chase #4 is drafted, and this one offers a 10-minute call instead of another reminder.",
        "His deposit is also unpaid, so I'd send this one personally.",
      ],
      sources: ["Document checklist — DeShawn Williams", "SMS thread"],
      links: [{ label: "Approve & send", href: "/os/tasks?task=t-williams-chase" }],
      action: { title: "Escalate to a call?", desc: "Books a 10-minute slot and sends him the link — lands in Tasks first.", button: "Queue it", category: "signatures_chase" },
    }),
  },
  {
    id: "qa-fuentes",
    question: "Did Roberto sign the 8879 yet?",
    match: [["fuentes|roberto", "sign|8879|signature"], ["8879"]],
    build: () => ({
      paragraphs: [
        "Not yet — Roberto **viewed the 8879 on Jun 23** and stopped. The 1120S is final and transmits the moment he signs.",
        "A nudge is drafted in your queue, and you have him on the phone at 3:00 today — his bonus-depreciation question from Monday is probably what's holding him. The answer is yes, the two trucks qualify for 60% bonus.",
      ],
      sources: ["E-sign envelope status", "Jun 22 email — Roberto"],
      links: [
        { label: "Approve the nudge", href: "/os/tasks?task=t-fuentes-8879" },
        { label: "Pre-call brief", href: "/os/tasks?task=t-brief-fuentes" },
      ],
    }),
  },
  {
    id: "qa-books",
    question: "Where are the May books?",
    match: [["books|close", "may|status|where|stand"]],
    build: () => {
      const clients = booksClients();
      return {
        paragraphs: [
          `May books for ${clients.map(h => h.name).join(", ")} are **wrapping up — 2 of 7 items complete, 3 in progress**.`,
          "I can run the three reconciliation and categorization items; the AP review and owner sign-off stay with you. Park's bank rec is already done — 142 of 145 matched, and David confirmed the three stragglers by email.",
        ],
        links: [{ label: "Open books", href: "/os/books" }],
        action: { title: "Run the remaining items?", desc: "Reconciliations and categorization queue as drafts for your approval.", button: "Run with Petal", category: "books", href: "/os/books" },
      };
    },
  },
  {
    id: "qa-pipeline",
    question: "How's the season looking?",
    match: [["season|pipeline|practice", "look|going|doing|health"], ["fees", "pipeline|blocked"]],
    build: () => ({
      paragraphs: [
        `**${money(feesInPipeline())} in fees** across 14 active returns, all safely on extension. ${money(feesBlockedByDocs())} of it is blocked on missing documents — which is why the chases run daily.`,
        "5 business returns track Sep 15, the rest Oct 15. Nothing is behind pace as of this morning.",
      ],
      links: [
        { label: "Returns board", href: "/os/returns" },
        { label: "Practice", href: "/os/practice" },
      ],
    }),
  },
];

/* ── client-scoped templates (work for any household) ────────── */

function buildClientStatus(h: Household): ChatAnswer {
  const stage = stageMeta[householdStage(h.id)].label;
  const docs = docsOfHousehold(h.id);
  const inv = invoiceOf(h.id);
  const deadline = householdDeadline(h.id);
  const open = tasksOf(h.id).filter(t => t.status === "needs_decision" || t.status === "ready_to_approve");
  const engs = engagementsOf(h.id);
  const blocked = engs.find(e => e.blockedBy);
  const health = clientHealth(h.id);
  return {
    paragraphs: [
      `**${h.name}** is **${stage}** — documents **${docs.label}**, fee **${money(householdFee(h.id))}**, balance **${money(inv.balance)}**${deadline ? `, next deadline **${fmtDate(deadline.iso)}**` : ""}.`,
      blocked
        ? `Blocking item: ${blocked.blockedBy}. ${open.length ? `${open.length} item${open.length > 1 ? "s" : ""} for this client ${open.length > 1 ? "are" : "is"} in your queue.` : ""}`
        : health.health === "healthy"
          ? "Nothing is blocking — on pace."
          : `Health: ${health.reason}.`,
    ],
    links: [
      { label: "Open record", href: `/os/clients/${h.id}` },
      ...(open[0] ? [{ label: "Review their items", href: `/os/tasks?task=${open[0].id}` }] : []),
    ],
  };
}

function buildClientDocs(h: Household): ChatAnswer {
  const docs = docsOfHousehold(h.id);
  const missing = engagementsOf(h.id).flatMap(e =>
    expectedDocs.filter(d => d.engagementId === e.id && d.status === "requested").map(d => d.source));
  return {
    paragraphs: [
      `**${docs.label} in hand** — ${docs.requested} still out${docs.needsReview ? `, ${docs.needsReview} extraction awaiting your review` : ""}.`,
      missing.length ? `Still missing: ${missing.slice(0, 4).join(" · ")}${missing.length > 4 ? ` and ${missing.length - 4} more` : ""}. The chase cadence is running.` : "The checklist is complete.",
    ],
    links: [{ label: "Open documents", href: `/os/clients/${h.id}?tab=documents` }],
  };
}

function buildClientBalance(h: Household): ChatAnswer {
  const inv = invoiceOf(h.id);
  return {
    paragraphs: [
      `Invoiced **${money(inv.invoiced)}**, collected **${money(inv.collected)}** — balance **${money(inv.balance)}** (${inv.status === "overdue" ? `overdue, ${inv.due.toLowerCase()}` : inv.due.toLowerCase()}).`,
    ],
    links: [{ label: "Open billing", href: `/os/clients/${h.id}?tab=billing` }],
  };
}

const CLIENT_TEMPLATES: { match: string[][]; build: (h: Household) => ChatAnswer }[] = [
  { match: [["doc|w-2|w2|1099|checklist|missing|outstanding"]], build: buildClientDocs },
  { match: [["owe|balance|invoice|paid|bill"]], build: buildClientBalance },
  { match: [["stand|status|where|catch|stage|return|story|update|going"]], build: buildClientStatus },
];

/* ── matcher + fallback ──────────────────────────────────────── */

export const SUGGESTED_QUESTIONS = [
  "What needs me today?",
  "Why did Marcus Chen's wages drop 40%?",
  "What's the deal with the Rodriguez CP2000?",
  "How much time did you save me this week?",
];

export function fallbackAnswer(scopeHouseholdId?: string): ChatAnswer {
  const h = scopeHouseholdId ? householdById(scopeHouseholdId) : undefined;
  return {
    paragraphs: [
      h
        ? `In the full product I answer anything from ${h.name}'s records — returns, documents, billing, history. In this demo, try one of these:`
        : "In the full product I answer anything from your firm's records — every answer cited to its sources. In this demo, try one of these:",
    ],
    suggest: h
      ? [`Where does ${h.name.split(" ")[0]} stand?`, "What documents are missing?", "What do they owe?"]
      : SUGGESTED_QUESTIONS,
  };
}

export function matchQuestion(text: string, scopeHouseholdId?: string): ChatAnswer {
  const input = norm(text);
  if (scopeHouseholdId) {
    const h = householdById(scopeHouseholdId);
    if (h) {
      for (const t of CLIENT_TEMPLATES) {
        if (t.match.some(g => groupMatches(input, g))) return t.build(h);
      }
    }
  }
  for (const entry of QA_BANK) {
    if (entry.match.some(g => groupMatches(input, g))) return entry.build();
  }
  return fallbackAnswer(scopeHouseholdId);
}

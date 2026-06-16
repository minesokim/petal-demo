"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import { Icon, I } from "@/components/os/icon";

type Block =
  | { kind: "p"; text: string }
  | { kind: "h"; text: string }
  | { kind: "bullets"; items: { lead?: string; text: string }[] };

interface Version { v: string; note: string; when: string }
type RefCategory = "Checklists" | "Key numbers" | "Templates" | "Authorities" | "SOPs" | "Sources";

interface Doc {
  id: string;
  group: "constitution" | "reference";
  category?: RefCategory;
  title: string;
  summary: string;
  updated: string;
  version: string;
  usedBy?: number;
  fileType?: string;
  body: Block[];
  history: Version[];
  /** structured, entity-typed checklist (Doc Chase operates on this) */
  checklist?: { form: string; entityLabel: string; items: { label: string; note?: string }[] };
  /** structured key numbers */
  keyNumbers?: { group: string; rows: { label: string; value: string }[] }[];
  external?: string;
}

const REF_ORDER: RefCategory[] = ["Checklists", "Key numbers", "Templates", "Authorities", "SOPs", "Sources"];

const SEED: Doc[] = [
  // ── Firm Constitution ──
  {
    id: "voice", group: "constitution", title: "Voice & tone", summary: "How Petal writes to clients on the firm's behalf.",
    updated: "2 weeks ago", version: "v3", usedBy: 4,
    body: [
      { kind: "p", text: "Every client-facing message Petal drafts should sound like Antonio: warm, plain-spoken, and precise. We are an enrolled-agent practice that values human relationships - the writing should reflect that." },
      { kind: "h", text: "Principles" },
      { kind: "bullets", items: [
        { lead: "Plain language", text: "no jargon. If a tax term is unavoidable, define it in one short clause." },
        { lead: "Warm, not casual", text: "friendly and respectful; never slangy or over-familiar." },
        { lead: "Specific", text: "name the exact form or document, and what it looks like, so the client can find it." },
        { lead: "Never pressure", text: "reminders are helpful, not anxious. No countdown urgency." },
      ] },
      { kind: "h", text: "Avoid" },
      { kind: "bullets", items: [{ text: "Em dashes in client messages, and exclamation points beyond one." }, { text: "Promising outcomes (\"you'll definitely get a refund\")." }] },
    ],
    history: [{ v: "v3", note: "Added the “never pressure” principle", when: "2 weeks ago" }, { v: "v2", note: "Tightened the “avoid” list", when: "2 months ago" }, { v: "v1", note: "Initial firm version", when: "Jan 2026" }],
  },
  {
    id: "filing", group: "constitution", title: "Filing policy", summary: "When a return may be filed, and what must be confirmed first.",
    updated: "1 month ago", version: "v5", usedBy: 2,
    body: [
      { kind: "p", text: "No return is ever filed by an agent. Petal produces a draft; a human approves; the human files. This is non-negotiable and reflects our WISP and Circular 230 obligations." },
      { kind: "h", text: "Pre-file checks" },
      { kind: "bullets", items: [{ lead: "Year-over-year flag", text: "any line that moves more than 25% must be flagged for verbal confirmation." }, { lead: "Source-backed", text: "every figure reconciles to a cited source document within $5." }, { lead: "Signature", text: "8879 e-sign collected before transmission." }] },
    ],
    history: [{ v: "v5", note: "Lowered YoY flag threshold to 25%", when: "1 month ago" }, { v: "v4", note: "Added source-backed rule", when: "3 months ago" }],
  },
  { id: "categorization", group: "constitution", title: "Categorization rules", summary: "Chart-of-accounts mapping and the auto-categorize threshold.", updated: "3 weeks ago", version: "v4", usedBy: 1, body: [{ kind: "p", text: "When reconciling books, match transactions to the client's prior categorization patterns first. Hold anything ambiguous for a human." }, { kind: "bullets", items: [{ lead: "Threshold", text: "auto-categorize only transactions at or below $250 with a confident historical match." }, { lead: "New vendors", text: "never auto-create a category; surface it." }] }], history: [{ v: "v4", note: "Raised threshold to $250", when: "3 weeks ago" }] },
  { id: "safe-harbor", group: "constitution", title: "Safe-harbor method", summary: "How estimated payments are computed.", updated: "2 months ago", version: "v2", usedBy: 1, body: [{ kind: "p", text: "Compute quarterly estimates using the prior-year safe harbor: 110% of prior-year tax for AGI over $150k, otherwise 100%. Prefer safe harbor unless the client requests annualized." }], history: [{ v: "v2", note: "Clarified the 110% threshold", when: "2 months ago" }] },
  { id: "naming", group: "constitution", title: "Naming conventions", summary: "How entities, files, and returns are named.", updated: "1 month ago", version: "v2", usedBy: 6, body: [{ kind: "p", text: "Consistent names keep documents findable across years and agents." }, { kind: "bullets", items: [{ lead: "Documents", text: "{Year} {FormType} {Description} - e.g. \"2025 W-2 Golden Dragon\"." }, { lead: "Entities", text: "legal name as registered; DBA in parentheses." }] }], history: [{ v: "v2", note: "Added entity naming rule", when: "1 month ago" }] },
  { id: "review", group: "constitution", title: "Review & approval", summary: "Who approves what, and the quarantine rule.", updated: "3 weeks ago", version: "v3", usedBy: 4, body: [{ kind: "p", text: "AI output never touches a client record until a human approves it. Drafts land in Tasks; the assigned preparer or a reviewer approves." }, { kind: "bullets", items: [{ lead: "Returns", text: "approved by Antonio or a designated reviewer." }, { lead: "Client messages", text: "approved by the assigned preparer before sending." }] }], history: [{ v: "v3", note: "Added quarantine rule", when: "3 weeks ago" }] },

  // ── Reference library: Checklists (structured, entity-typed) ──
  {
    id: "ck-1040", group: "reference", category: "Checklists", title: "1040 - Individual", summary: "Documents required for an individual return.", updated: "Jan 2026", version: "v1", body: [], history: [],
    checklist: { form: "1040", entityLabel: "individual", items: [
      { label: "W-2s", note: "all employers" }, { label: "1099s", note: "NEC, INT, DIV, B, R" }, { label: "1098 mortgage interest" }, { label: "Prior-year return" }, { label: "Dependent SSNs & DOBs" }, { label: "1095 health coverage" }, { label: "Childcare provider + EIN" }, { label: "Charitable contribution receipts" }, { label: "Estimated payments record" },
    ] },
  },
  {
    id: "ck-1120s", group: "reference", category: "Checklists", title: "1120S - S-Corp", summary: "Documents required for an S-Corporation return.", updated: "Jan 2026", version: "v1", body: [], history: [],
    checklist: { form: "1120S", entityLabel: "S-Corp", items: [
      { label: "P&L and balance sheet", note: "trial balance" }, { label: "Payroll reports", note: "941s, W-3, state" }, { label: "Shareholder basis schedule" }, { label: "Fixed-asset & depreciation schedule" }, { label: "Bank & credit-card statements" }, { label: "Loan statements" }, { label: "Prior-year return + K-1s" }, { label: "Officer health insurance (2% S/H)" },
    ] },
  },
  {
    id: "ck-1065", group: "reference", category: "Checklists", title: "1065 - Partnership", summary: "Documents required for a partnership return.", updated: "Jan 2026", version: "v1", body: [], history: [],
    checklist: { form: "1065", entityLabel: "partnership", items: [
      { label: "P&L and balance sheet" }, { label: "Partner ownership %" }, { label: "Capital contributions & distributions" }, { label: "Fixed-asset schedule" }, { label: "Guaranteed payments" }, { label: "Prior-year return + K-1s" },
    ] },
  },
  {
    id: "ck-schc", group: "reference", category: "Checklists", title: "Schedule C - Sole Prop", summary: "Documents for a sole-proprietor business on the 1040.", updated: "Jan 2026", version: "v1", body: [], history: [],
    checklist: { form: "Sch C", entityLabel: "sole-prop", items: [
      { label: "Income summary + 1099-NECs" }, { label: "Expense totals by category" }, { label: "Mileage log", note: "business miles" }, { label: "Home-office square footage" }, { label: "Asset purchases", note: "§179 candidates" }, { label: "Health insurance premiums" },
    ] },
  },
  {
    id: "ck-sche", group: "reference", category: "Checklists", title: "Schedule E - Rental", summary: "Documents for rental-property income.", updated: "Jan 2026", version: "v1", body: [], history: [],
    checklist: { form: "Sch E", entityLabel: "rental", items: [
      { label: "Rental income by property" }, { label: "1098 mortgage interest" }, { label: "Property tax statements" }, { label: "Repairs vs improvements log" }, { label: "Depreciation schedule" }, { label: "Days rented vs personal use" },
    ] },
  },

  // ── Key numbers ──
  {
    id: "key-2025", group: "reference", category: "Key numbers", title: "Key numbers - 2025", summary: "The figures agents compute and cite against.", updated: "Jan 2026", version: "v1", body: [], history: [],
    keyNumbers: [
      { group: "Individual", rows: [
        { label: "Standard deduction - Single", value: "$15,000" }, { label: "Standard deduction - MFJ", value: "$30,000" }, { label: "Standard deduction - HoH", value: "$22,500" }, { label: "Top marginal bracket", value: "37%" }, { label: "Standard mileage rate", value: "70¢ / mi" }, { label: "1099-K reporting threshold", value: "$2,500" },
      ] },
      { group: "Business", rows: [
        { label: "§179 expensing limit", value: "$1,250,000" }, { label: "Bonus depreciation", value: "100%" }, { label: "QBI phase-out start (MFJ)", value: "$394,600" }, { label: "SE tax rate", value: "15.3%" },
      ] },
      { group: "Retirement & health", rows: [
        { label: "401(k) elective deferral", value: "$23,500" }, { label: "401(k) catch-up (50+)", value: "$7,500" }, { label: "IRA contribution", value: "$7,000" }, { label: "HSA - self / family", value: "$4,300 / $8,550" },
      ] },
    ],
  },

  // ── Templates ──
  { id: "tpl-engagement", group: "reference", category: "Templates", title: "Engagement letter", summary: "Standard engagement letter, by service tier.", updated: "Jan 2026", version: "v1", fileType: "Template", body: [{ kind: "p", text: "The firm's standard engagement letter. Scope, fees, and responsibilities vary by tier (Basic / Standard / Premium)." }], history: [] },
  { id: "tpl-organizer", group: "reference", category: "Templates", title: "Client organizer", summary: "Annual organizer sent at the start of the season.", updated: "Dec 2025", version: "v1", fileType: "Template", body: [{ kind: "p", text: "Prior-year-prefilled organizer the client completes before we begin." }], history: [] },
  { id: "tpl-8879", group: "reference", category: "Templates", title: "8879 e-sign instructions", summary: "How clients e-sign the 8879 authorization.", updated: "Jan 2026", version: "v1", fileType: "Template", body: [{ kind: "p", text: "Step-by-step the client receives to authorize e-file. Required before any return is transmitted." }], history: [] },

  // ── Authorities ──
  { id: "auth-pub17", group: "reference", category: "Authorities", title: "IRS Publication 17", summary: "Your Federal Income Tax - the individual reference.", updated: "2025 ed.", version: "v1", fileType: "IRS Pub", external: "irs.gov/pub17", body: [{ kind: "p", text: "The authoritative individual-tax reference. Petal cites this for individual-return positions." }], history: [] },
  { id: "auth-pub535", group: "reference", category: "Authorities", title: "IRS Publication 535", summary: "Business Expenses.", updated: "2025 ed.", version: "v1", fileType: "IRS Pub", external: "irs.gov/pub535", body: [{ kind: "p", text: "Deductibility of business expenses. Cited for Schedule C and entity returns." }], history: [] },
  { id: "auth-ca540", group: "reference", category: "Authorities", title: "CA FTB - Form 540 & PTE", summary: "California 540 and the pass-through entity elective tax.", updated: "2025 ed.", version: "v1", fileType: "State", external: "ftb.ca.gov", body: [{ kind: "p", text: "California reference: 540 individual return and the PTE elective tax workaround relevant to our S-Corp and partnership clients." }], history: [] },

  // ── SOPs ──
  { id: "sop-close", group: "reference", category: "SOPs", title: "Month-end close process", summary: "Internal steps for closing a client's books.", updated: "Nov 2025", version: "v1", fileType: "SOP", body: [{ kind: "p", text: "The firm's standard close sequence: reconcile → categorize → closing entries → review → deliver." }], history: [] },
  { id: "sop-review", group: "reference", category: "SOPs", title: "Return review checklist", summary: "Reviewer's pass before a return is sent to the client.", updated: "Dec 2025", version: "v1", fileType: "SOP", body: [{ kind: "p", text: "What a reviewer verifies before a return leaves the firm." }], history: [] },
];

function flatten(blocks: Block[]): string {
  return blocks.map(b => { if (b.kind === "h") return "## " + b.text; if (b.kind === "p") return b.text; return b.items.map(it => "- " + (it.lead ? `**${it.lead}** - ` : "") + it.text).join("\n"); }).join("\n\n");
}
function parse(raw: string): Block[] {
  return raw.split(/\n\s*\n/).map(chunk => {
    const lines = chunk.split("\n").filter(l => l.trim());
    if (lines.length === 0) return null;
    if (lines.every(l => l.startsWith("- "))) return { kind: "bullets", items: lines.map(l => { const t = l.slice(2); const m = t.match(/^\*\*(.+?)\*\*\s*-\s*(.*)$/); return m ? { lead: m[1], text: m[2] } : { text: t }; }) } as Block;
    if (lines.length === 1 && lines[0].startsWith("## ")) return { kind: "h", text: lines[0].slice(3) } as Block;
    return { kind: "p", text: chunk.replace(/\n/g, " ").trim() } as Block;
  }).filter(Boolean) as Block[];
}
function bumpVersion(v: string) { return "v" + ((parseInt(v.replace("v", "")) || 0) + 1); }

function DocBody({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-3.5">
      {blocks.map((b, i) => {
        if (b.kind === "h") return <h3 key={i} className="pt-1 text-[15px] font-semibold text-[var(--os-ink)] os-display">{b.text}</h3>;
        if (b.kind === "p") return <p key={i} className="text-[13px] leading-relaxed text-[var(--os-ink)]">{b.text}</p>;
        return <ul key={i} className="space-y-2">{b.items.map((it, j) => (<li key={j} className="flex gap-2.5 text-[13px] leading-relaxed text-[var(--os-ink)]"><span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-[var(--os-border-strong)]" /><span>{it.lead && <span className="font-medium">{it.lead}</span>}{it.lead ? " - " : ""}{it.text}</span></li>))}</ul>;
      })}
    </div>
  );
}

export default function KnowledgePage() {
  const [docs, setDocs] = useState<Doc[]>(SEED);
  const [selected, setSelected] = useState("voice");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ title: "", summary: "", body: "" });
  const [addMenu, setAddMenu] = useState(false);
  const [sourceModal, setSourceModal] = useState(false);
  // collapsible rail - only the active group is open by default (low cognitive load)
  const [open, setOpen] = useState<Set<string>>(() => new Set(["constitution"]));
  const toggle = (k: string) => setOpen(p => { const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const openGroup = (k: string) => setOpen(p => new Set(p).add(k));

  const doc = docs.find(d => d.id === selected)!;
  const constitution = docs.filter(d => d.group === "constitution");
  const reference = docs.filter(d => d.group === "reference");
  const groupKeyOf = (d: Doc) => (d.group === "constitution" ? "constitution" : (d.category as string));
  function selectDoc(d: Doc) { setSelected(d.id); setEditing(false); openGroup(groupKeyOf(d)); }

  function startEdit() { setDraft({ title: doc.title, summary: doc.summary, body: flatten(doc.body) }); setEditing(true); }
  function save() {
    setDocs(prev => prev.map(d => d.id === doc.id ? { ...d, title: draft.title.trim() || d.title, summary: draft.summary.trim(), body: parse(draft.body), version: bumpVersion(d.version), updated: "just now", history: [{ v: bumpVersion(d.version), note: "Edited", when: "just now" }, ...d.history] } : d));
    setEditing(false);
  }
  function newPolicy() {
    const id = "policy-" + Date.now();
    const nd: Doc = { id, group: "constitution", title: "Untitled policy", summary: "Describe what this policy governs.", updated: "just now", version: "v1", usedBy: 0, body: [{ kind: "p", text: "" }], history: [] };
    setDocs(prev => [...prev.filter(d => d.group === "constitution"), nd, ...prev.filter(d => d.group === "reference")]);
    setSelected(id); setAddMenu(false); openGroup("constitution"); setDraft({ title: nd.title, summary: nd.summary, body: "" }); setEditing(true);
  }
  function addSource(title: string, fileType: string) {
    const id = "src-" + Date.now();
    const nd: Doc = { id, group: "reference", category: "Sources", title: title || "Untitled source", summary: "Added to the reference library.", updated: "just now", version: "v1", fileType, body: [{ kind: "p", text: "Petal can now ground answers and skill runs on this source." }], history: [] };
    setDocs(prev => [...prev, nd]); setSelected(id); setSourceModal(false); setEditing(false); openGroup("Sources");
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--os-border)] px-8 pt-6 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[24px] font-semibold text-[var(--os-ink)] os-display">Knowledge</h1>
            <p className="mt-1 text-[13px] text-[var(--os-ink-muted)]">Policies and sources Petal applies to every run.</p>
          </div>
          <div className="relative flex shrink-0 items-center gap-1.5">
          <button className="grid size-7 place-items-center rounded-md text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)]"><Icon icon={I.search} size={15} /></button>
          <button onClick={() => setAddMenu(v => !v)} className="flex h-7 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-2.5 text-[12px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97]"><Icon icon={I.plus} size={15} /> Add knowledge</button>
          {addMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setAddMenu(false)} />
              <div className="absolute right-0 top-9 z-20 w-64 overflow-hidden rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] py-1 shadow-lg">
                <button onClick={newPolicy} className="flex w-full items-start gap-2.5 px-3 py-2 text-left hover:bg-[var(--os-hover)]"><PetalMark className="mt-0.5 size-4 shrink-0" /><span><span className="block text-[13px] font-medium text-[var(--os-ink)]">Write a policy</span><span className="block text-[11px] text-[var(--os-ink-muted)]">A rule that's injected into every run</span></span></button>
                <button onClick={() => { setAddMenu(false); setSourceModal(true); }} className="flex w-full items-start gap-2.5 px-3 py-2 text-left hover:bg-[var(--os-hover)]"><Icon icon={I.file} size={16} className="mt-0.5 shrink-0 text-[var(--os-ink-muted)]" /><span><span className="block text-[13px] font-medium text-[var(--os-ink)]">Add a source</span><span className="block text-[11px] text-[var(--os-ink-muted)]">Upload, paste, link, or connect a document</span></span></button>
              </div>
            </>
          )}
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Rail - collapsible groups (only the active group open by default) */}
        <div className="flex w-[280px] shrink-0 flex-col overflow-y-auto border-r border-[var(--os-border)] px-2 py-3">
          {/* Firm Constitution group */}
          <button onClick={() => toggle("constitution")} className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-[var(--os-hover)]">
            <Icon icon={open.has("constitution") ? I.chevronDown : I.chevronRight} size={13} className="shrink-0 text-[var(--os-ink-subtle)]" />
            <PetalMark className="size-3 shrink-0" />
            <span className="flex-1 text-[13px] font-medium text-[var(--os-ink)]">Firm Constitution</span>
            <span className="text-[11px] tabular-nums text-[var(--os-ink-subtle)]">{constitution.length}</span>
          </button>
          {open.has("constitution") && (
            <div className="mb-2 ml-3 space-y-0.5 border-l border-[var(--os-border)] pl-2">
              {constitution.map(d => (
                <button key={d.id} onClick={() => selectDoc(d)} className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors", d.id === selected ? "bg-[var(--os-selected)] font-medium text-[var(--os-ink)]" : "text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]")}>
                  <PetalMark className="size-3 shrink-0 text-[var(--os-ink-subtle)]" /><span className="truncate">{d.title}</span>
                </button>
              ))}
            </div>
          )}

          <div className="os-label mb-1 mt-3 px-2">Reference library</div>
          {REF_ORDER.map(cat => {
            const ds = reference.filter(d => d.category === cat);
            if (!ds.length) return null;
            return (
              <div key={cat}>
                <button onClick={() => toggle(cat)} className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-[var(--os-hover)]">
                  <Icon icon={open.has(cat) ? I.chevronDown : I.chevronRight} size={13} className="shrink-0 text-[var(--os-ink-subtle)]" />
                  <span className="flex-1 text-[13px] text-[var(--os-ink)]">{cat}</span>
                  <span className="text-[11px] tabular-nums text-[var(--os-ink-subtle)]">{ds.length}</span>
                </button>
                {open.has(cat) && (
                  <div className="mb-1 ml-3 space-y-0.5 border-l border-[var(--os-border)] pl-2">
                    {ds.map(d => (
                      <button key={d.id} onClick={() => selectDoc(d)} className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors", d.id === selected ? "bg-[var(--os-selected)] font-medium text-[var(--os-ink)]" : "text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]")}>
                        <Icon icon={d.checklist ? I.tasks : d.keyNumbers ? I.reports : d.external ? I.globe : I.file} size={14} className="shrink-0 text-[var(--os-ink-subtle)]" />
                        <span className="truncate">{d.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Reading / edit view */}
        <div className="min-w-0 flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div key={doc.id + (editing ? "-edit" : "")} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.16, ease: "easeOut" }} className="mx-auto max-w-[720px] px-8 py-8">
              <div className="mb-1 flex items-center gap-2 text-[11px] text-[var(--os-ink-subtle)]">
                {doc.group === "constitution" ? <>{doc.version} · updated {doc.updated}{doc.usedBy ? ` · used by ${doc.usedBy} agents` : ""}</> : <>{doc.checklist ? `Checklist · ${doc.checklist.form}` : doc.keyNumbers ? "Key numbers" : doc.fileType || doc.category} · updated {doc.updated}</>}
              </div>

              {editing ? <input value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} className="w-full bg-transparent text-[20px] font-semibold leading-tight os-display focus:outline-none" placeholder="Policy title" /> : <h2 className="text-[20px] font-semibold leading-tight os-display">{doc.title}</h2>}
              {editing ? <input value={draft.summary} onChange={e => setDraft({ ...draft, summary: e.target.value })} className="mt-1 w-full bg-transparent text-[13px] text-[var(--os-ink-muted)] focus:outline-none" placeholder="One-line summary" /> : <p className="mt-1 text-[13px] text-[var(--os-ink-muted)]">{doc.summary}</p>}

              {doc.group === "constitution" && (
                <div className="mt-4 flex items-center gap-2.5 rounded-lg bg-[var(--os-bg-subtle)] px-3.5 py-2.5">
                  <PetalMark className="size-4 shrink-0" />
                  <div className="text-[12px] text-[var(--os-ink-muted)]"><span className="font-medium text-[var(--os-ink)]">Injected into every run.</span> {editing ? "Changes apply to future agent runs." : "Petal applies this policy automatically whenever an agent works."}</div>
                  {editing ? (
                    <div className="ml-auto flex shrink-0 items-center gap-1.5"><button onClick={() => setEditing(false)} className="flex h-7 items-center rounded-md px-2.5 text-[12px] text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)]">Cancel</button><button onClick={save} className="flex h-7 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-2.5 text-[12px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97]"><Icon icon={I.check} size={14} /> Save</button></div>
                  ) : (
                    <button onClick={startEdit} className="ml-auto flex h-7 shrink-0 items-center gap-1.5 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2.5 text-[12px] transition-colors hover:bg-[var(--os-hover)]"><Icon icon={I.edit} size={14} /> Edit</button>
                  )}
                </div>
              )}

              {/* Checklist - used by Doc Chase */}
              {doc.checklist && (
                <>
                  <div className="mt-4 flex items-center gap-2.5 rounded-lg bg-[var(--os-bg-subtle)] px-3.5 py-2.5">
                    <span className="grid size-7 shrink-0 place-items-center rounded-md bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-sm ring-1 ring-inset ring-white/20"><Icon icon={I.mail} size={14} /></span>
                    <div className="text-[12px] text-[var(--os-ink-muted)]"><span className="font-medium text-[var(--os-ink)]">Doc Chase uses this.</span> When a {doc.checklist.entityLabel} entity is missing any of these, Petal drafts a request for exactly what's outstanding.</div>
                  </div>
                  <div className="mt-5 os-label mb-2">{doc.checklist.items.length} required documents</div>
                  <div className="divide-y divide-[var(--os-border)] rounded-lg border border-[var(--os-border)]">
                    {doc.checklist.items.map((it, i) => (
                      <div key={i} className="flex items-center gap-3 px-3.5 py-2.5">
                        <span className="grid size-4 shrink-0 place-items-center rounded border border-[var(--os-border-strong)]" />
                        <span className="text-[13px] text-[var(--os-ink)]">{it.label}</span>
                        {it.note && <span className="text-[12px] text-[var(--os-ink-subtle)]">- {it.note}</span>}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Key numbers */}
              {doc.keyNumbers && (
                <div className="mt-6 space-y-6">
                  {doc.keyNumbers.map(g => (
                    <div key={g.group}>
                      <h3 className="mb-2 text-[15px] font-semibold text-[var(--os-ink)] os-display">{g.group}</h3>
                      <div className="divide-y divide-[var(--os-border)] rounded-lg border border-[var(--os-border)]">
                        {g.rows.map((r, i) => (<div key={i} className="flex items-center justify-between px-3.5 py-2"><span className="text-[13px] text-[var(--os-ink)]">{r.label}</span><span className="text-[13px] font-medium tabular-nums text-[var(--os-ink)]">{r.value}</span></div>))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Prose body (constitution, templates, authorities, SOPs, sources) */}
              {!doc.checklist && !doc.keyNumbers && (
                <div className="mt-6">
                  {editing ? (
                    <><textarea value={draft.body} onChange={e => setDraft({ ...draft, body: e.target.value })} style={{ minHeight: 320 }} className="w-full resize-none bg-transparent text-[13px] leading-relaxed text-[var(--os-ink)] focus:outline-none" placeholder="Write the policy…" /><p className="mt-2 text-[11px] text-[var(--os-ink-subtle)]">Formatting: <code className="rounded bg-[var(--os-selected)] px-1">## Heading</code> · <code className="rounded bg-[var(--os-selected)] px-1">- bullet</code> · <code className="rounded bg-[var(--os-selected)] px-1">- **Lead** - text</code></p></>
                  ) : (
                    <>
                      <DocBody blocks={doc.body} />
                      {doc.external && <button className="mt-4 flex h-8 items-center gap-1.5 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-3 text-[12px] text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)]"><Icon icon={I.globe} size={14} /> {doc.external}</button>}
                    </>
                  )}
                </div>
              )}

              {!editing && doc.group === "constitution" && doc.history.length > 0 && (
                <div className="mt-8 border-t border-[var(--os-border)] pt-5">
                  <div className="os-label mb-3 flex items-center gap-1.5"><Icon icon={I.history} size={14} /> Version history</div>
                  <div>
                    {doc.history.map((h, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center"><span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", i === 0 ? "bg-[var(--os-ink)]" : "bg-[var(--os-border-strong)]")} />{i < doc.history.length - 1 && <div className="my-1 w-px flex-1 bg-[var(--os-border)]" />}</div>
                        <div className={cn("min-w-0", i < doc.history.length - 1 ? "pb-4" : "")}><div className="flex items-center gap-2"><span className="text-[13px] text-[var(--os-ink)]">{h.note}</span><span className="text-[11px] tabular-nums text-[var(--os-ink-subtle)]">{h.v}</span></div><div className="text-[11px] text-[var(--os-ink-subtle)]">{h.when}</div></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>{sourceModal && <SourceModal onClose={() => setSourceModal(false)} onAdd={addSource} />}</AnimatePresence>
    </div>
  );
}

function SourceModal({ onClose, onAdd }: { onClose: () => void; onAdd: (title: string, type: string) => void }) {
  const [type, setType] = useState<"Upload" | "Link" | "Text">("Upload");
  const [title, setTitle] = useState("");
  const TYPES = [{ key: "Upload" as const, icon: I.attach, label: "Upload" }, { key: "Link" as const, icon: I.globe, label: "Link" }, { key: "Text" as const, icon: I.file, label: "Paste text" }];
  const CONNECTORS = ["QuickBooks", "Gmail", "Google Drive", "Dropbox"];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.14 }} className="fixed inset-0 z-30 grid place-items-center bg-black/20 p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 8 }} transition={{ duration: 0.16, ease: "easeOut" }} onClick={e => e.stopPropagation()} className="w-full max-w-[460px] overflow-hidden rounded-xl border border-[var(--os-border)] bg-[var(--os-surface)] shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--os-border)] px-4 py-3"><h3 className="text-[15px] font-semibold os-display">Add a source</h3><button onClick={onClose} className="grid size-6 place-items-center rounded-md text-[var(--os-ink-subtle)] hover:bg-[var(--os-hover)]"><Icon icon={I.close} size={15} /></button></div>
        <div className="px-4 py-4">
          <div className="mb-3 flex items-center gap-0.5 rounded-lg bg-[var(--os-bg-subtle)] p-0.5">{TYPES.map(t => (<button key={t.key} onClick={() => setType(t.key)} className={cn("flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md text-[12px] transition-colors", type === t.key ? "bg-[var(--os-surface)] font-medium text-[var(--os-ink)] shadow-sm" : "text-[var(--os-ink-muted)] hover:text-[var(--os-ink)]")}><Icon icon={t.icon} size={14} /> {t.label}</button>))}</div>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Source name" className="mb-3 w-full rounded-lg border border-[var(--os-border-strong)] bg-[var(--os-surface)] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--os-accent)]/20" />
          {type === "Upload" && <div className="grid h-28 place-items-center rounded-lg border border-dashed border-[var(--os-border-strong)] text-center"><div className="text-[12px] text-[var(--os-ink-muted)]"><Icon icon={I.attach} size={18} className="mx-auto mb-1 text-[var(--os-ink-subtle)]" />Drop a PDF or DOCX, or click to browse</div></div>}
          {type === "Link" && <input placeholder="https://…" className="w-full rounded-lg border border-[var(--os-border-strong)] bg-[var(--os-surface)] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--os-accent)]/20" />}
          {type === "Text" && <textarea placeholder="Paste the text Petal should reference…" style={{ minHeight: 96 }} className="w-full resize-none rounded-lg border border-[var(--os-border-strong)] bg-[var(--os-surface)] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--os-accent)]/20" />}
          <div className="mt-4"><div className="os-label mb-1.5">Or connect a source</div><div className="flex flex-wrap gap-1.5">{CONNECTORS.map(c => (<button key={c} onClick={() => onAdd(c, "Connector")} className="rounded-md border border-[var(--os-border)] px-2.5 py-1 text-[12px] text-[var(--os-ink-muted)] transition-colors hover:border-[var(--os-border-strong)] hover:text-[var(--os-ink)]">{c}</button>))}</div></div>
        </div>
        <div className="flex items-center justify-end gap-1.5 border-t border-[var(--os-border)] px-4 py-3"><button onClick={onClose} className="flex h-8 items-center rounded-md px-3 text-[12px] text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)]">Cancel</button><button onClick={() => onAdd(title, type)} className="flex h-8 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-3 text-[12px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97]"><Icon icon={I.plus} size={14} /> Add source</button></div>
      </motion.div>
    </motion.div>
  );
}

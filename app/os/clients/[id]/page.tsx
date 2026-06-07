"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  households, entitiesOf, returnsOf, returnsOfEntity, peopleOf, householdFee, householdStage,
  healthMeta, kindLabel, stageLabels, stageDotStyles, OWNERS, type ReturnStage,
} from "@/lib/os-entities";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import { Icon, I } from "@/components/os/icon";
import { threads, channelMeta, type Thread } from "@/lib/os-inbox";
import { checklistFor } from "@/lib/os-documents";
import { triage, tierMeta, TIER_ORDER } from "@/lib/os-triage";
import { agents } from "@/lib/os-agents";
import { AgentAvatar, TierGlyph, TrustPill } from "@/components/os/primitives";

// Don't cram the tab bar — keep the daily-driver surfaces visible (Assembly), overflow the rest.
const PRIMARY_TABS = ["Activity", "Returns", "Documents", "Tasks", "Messages", "Billing"];
const OVERFLOW_TABS = ["Intake", "Entities", "Compliance"];

const agentByName = (name?: string) => agents.find(a => a.name === name);
const firstOf = (name: string) => name.split(" ")[0];
function threadContext(t: Thread) {
  if (t.petalDraft) return "Petal drafted a reply";
  const last = t.messages[t.messages.length - 1];
  if (!last) return t.preview;
  return last.from === "client" ? `${firstOf(last.author)} replied` : "You replied";
}

const money = (n: number) => `$${n.toLocaleString()}`;
type Tone = "ok" | "warn" | "muted";
const toneClass: Record<Tone, string> = { ok: "text-[var(--os-success)]", warn: "text-[var(--os-warning)]", muted: "text-[var(--os-ink-subtle)]" };
const toneDot: Record<Tone, string> = { ok: "bg-emerald-500", warn: "bg-amber-500", muted: "bg-[var(--os-ink-subtle)]" };
function complianceFor(stage: ReturnStage): { auth: [string, Tone]; efile: [string, Tone] } {
  if (stage === "filed") return { auth: ["8879 signed", "ok"], efile: ["E-file accepted", "ok"] };
  if (stage === "pay_and_sign") return { auth: ["8879 awaiting signature", "warn"], efile: ["E-file not started", "muted"] };
  if (stage === "client_review") return { auth: ["8879 pending review", "muted"], efile: ["E-file not started", "muted"] };
  return { auth: ["8879 not generated", "muted"], efile: ["E-file not started", "muted"] };
}

function Attr({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-3 py-2">
      <span className="text-[12px] text-[var(--os-ink-muted)]">{label}</span>
      <span className="max-w-[60%] text-right text-[13px] text-[var(--os-ink)]">{children}</span>
    </div>
  );
}

function StageTag({ stage }: { stage: ReturnStage }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--os-ink-muted)]">
      <span className={cn("size-1.5 rounded-full", (stageDotStyles as Record<string, string>)[stage] || "bg-stone-400")} />
      {stageLabels[stage] || stage}
    </span>
  );
}

export default function ClientRecordPage() {
  const params = useParams();
  const h = households.find(x => x.id === params.id);
  const [tab, setTab] = useState("Activity");
  const [moreOpen, setMoreOpen] = useState(false);
  const [panel, setPanel] = useState<"Internal chat" | "Notes" | "Details">("Internal chat");

  if (!h) return <div className="p-8 text-[13px] text-[var(--os-ink-muted)]">Client not found</div>;

  const ents = entitiesOf(h.id);
  const rets = returnsOf(h.id);
  const ppl = peopleOf(h.id);
  const hp = healthMeta(h.healthUrgency);
  const stage = householdStage(h.id);
  const initials = h.name.split(" ").map(n => n[0]).join("").slice(0, 2);
  const owner = OWNERS[h.assignedTo] || "Unassigned";
  const biz = ents.find(e => e.form !== "1040");
  const firstName = h.name.split(" ")[0];
  const docsIn = rets.reduce((s, r) => s + r.docsSubmitted, 0);
  const docsReq = rets.reduce((s, r) => s + r.docsRequired, 0);
  const missing = Math.max(0, docsReq - docsIn);
  const petalSummary = `${h.name} is in ${stageLabels[stage] || stage}. ${docsIn} of ${docsReq} documents are in across ${rets.length} return${rets.length === 1 ? "" : "s"}, total fee $${householdFee(h.id).toLocaleString()}.`;
  const draftText = missing > 0
    ? `Hi ${firstName}, quick nudge — we still need ${missing} item${missing === 1 ? "" : "s"} to wrap up your ${rets[0]?.year ?? 2025} return. You can upload straight from your portal whenever it's handy. Thank you!`
    : `Hi ${firstName}, good news — everything's in and your return is moving through review. We'll reach out the moment it's ready for your signature.`;

  const activity = [
    { who: "Petal", agent: true, text: `Drafted ${biz ? biz.name : ents[0].name} ${biz ? biz.form : "1040"} and flagged 1 item for review`, time: "2h ago", diff: ["Wages → $58,000 (−40% vs 2024)", biz ? `Created ${biz.form} — ${biz.type}` : "Matched prior-year return"] },
    { who: owner.split(" ")[0], text: "changed Stage and 2 attributes", time: "1d ago", diff: ["Stage → In Preparation", "Deposit → Paid"] },
    { who: "Petal", agent: true, text: "1099-NEC uploaded to portal — extracted 2 fields", time: "2d ago" },
    { who: "Meeting", meeting: true, text: "Estimated payments review + entity follow-up", time: "Apr 8 · 30 min · Zoom" },
    { who: owner.split(" ")[0], text: `created ${h.name}`, time: `${h.since}` },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Breadcrumb header (Assembly composition) */}
      <div className="flex items-center gap-2 border-b border-[var(--os-border)] px-8 py-3">
        <Link href="/os/clients" className="text-[13px] text-[var(--os-ink-subtle)] transition-colors hover:text-[var(--os-ink)]">Clients</Link>
        <Icon icon={I.chevronRight} size={13} className="text-[var(--os-ink-subtle)]" />
        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[var(--os-selected)] text-[9px] font-medium text-[var(--os-ink-muted)]">{initials}</span>
        <span className="text-[13px] font-semibold text-[var(--os-ink)]">{h.name}</span>
        <div className="ml-auto flex items-center gap-1.5">
          <button className="flex h-7 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-2.5 text-[12px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97]"><PetalMark className="size-3.5" /> Run skill</button>
          <button className="grid size-7 place-items-center rounded-md text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)]"><Icon icon={I.more} size={16} /></button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Center: tabs + content */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-1 border-b border-[var(--os-border)] px-8">
            {PRIMARY_TABS.map(t => {
              const count = t === "Entities" ? ents.length : t === "Returns" ? rets.length : null;
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn("relative px-2.5 py-2 text-[13px] transition-colors", tab === t ? "font-medium text-[var(--os-ink)]" : "text-[var(--os-ink-muted)] hover:text-[var(--os-ink)]")}
                >
                  {t}
                  {count !== null && <span className="ml-1 text-[11px] tabular-nums text-[var(--os-ink-subtle)]">{count}</span>}
                  {tab === t && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--os-ink)]" />}
                </button>
              );
            })}
            {/* Overflow — keep the bar uncluttered (Assembly "N more") */}
            <div className="relative">
              <button
                onClick={() => setMoreOpen(o => !o)}
                className={cn("relative flex items-center gap-1 px-2.5 py-2 text-[13px] transition-colors", OVERFLOW_TABS.includes(tab) ? "font-medium text-[var(--os-ink)]" : "text-[var(--os-ink-muted)] hover:text-[var(--os-ink)]")}
              >
                {OVERFLOW_TABS.includes(tab) ? tab : `${OVERFLOW_TABS.length} more`}
                <Icon icon={I.chevronDown} size={13} className={cn("text-[var(--os-ink-subtle)] transition-transform", moreOpen && "rotate-180")} />
                {OVERFLOW_TABS.includes(tab) && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--os-ink)]" />}
              </button>
              {moreOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMoreOpen(false)} />
                  <div className="absolute left-0 top-full z-20 mt-1 min-w-[170px] rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] p-1 shadow-md">
                    {OVERFLOW_TABS.map(t => {
                      const count = t === "Entities" ? ents.length : t === "Returns" ? rets.length : null;
                      return (
                        <button
                          key={t}
                          onClick={() => { setTab(t); setMoreOpen(false); }}
                          className={cn("flex w-full items-center gap-1.5 rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors", tab === t ? "bg-[var(--os-selected)] font-medium text-[var(--os-ink)]" : "text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)]")}
                        >
                          {t}
                          {count !== null && <span className="text-[11px] tabular-nums text-[var(--os-ink-subtle)]">{count}</span>}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-5">
            {tab === "Activity" && (
              <>
                <div className="mb-4 rounded-lg bg-[var(--os-bg-subtle)] p-3.5">
                  <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-[var(--os-ink-muted)]"><PetalMark className="size-3" /> Catch me up</div>
                  <p className="text-[13px] leading-relaxed text-[var(--os-ink)]">{h.catchUp}</p>
                </div>
                <div className="os-label mb-2">Activity</div>
                <div className="space-y-3">
                  {activity.map((a, i) => (
                    <div key={i} className="flex gap-2.5">
                      <span className={cn("mt-1 size-1.5 shrink-0 rounded-full", a.agent ? "bg-emerald-500" : a.meeting ? "bg-blue-500" : "bg-[var(--os-border-strong)]")} />
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] leading-snug">
                          <span className="font-medium">{a.who}</span> <span className="text-[var(--os-ink-muted)]">{a.text}</span>
                        </div>
                        {a.diff && <div className="mt-1 space-y-0.5">{a.diff.map((d, j) => <div key={j} className="text-[12px] text-[var(--os-ink-muted)]">{d}</div>)}</div>}
                        <div className="mt-0.5 text-[11px] text-[var(--os-ink-subtle)]">{a.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {tab === "Intake" && (() => {
              const primary = ppl.find(p => p.role === "Taxpayer" || p.role === "Owner") ?? ppl[0];
              const filingStatus = ents.find(e => e.form === "1040")?.type ?? kindLabel[h.kind];
              const forms = [...new Set(ents.map(e => e.form))].join(" · ");
              const SOURCES = ["Referral — existing client", "Returning client", "Google search", "Partner CPA referral", "Walk-in"];
              const source = SOURCES[Math.abs(h.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % SOURCES.length];
              const depositPaid = rets.some(r => r.depositPaid);
              return (
                <div className="space-y-6">
                  <div className="rounded-lg bg-[var(--os-bg-subtle)] p-3.5">
                    <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-[var(--os-ink-muted)]"><PetalMark className="size-3" /> Intake summary</div>
                    <p className="text-[13px] leading-relaxed text-[var(--os-ink)]">{firstName} — {kindLabel[h.kind].toLowerCase()} client since {h.since}. {ents.length} entit{ents.length === 1 ? "y" : "ies"} filing {forms}.</p>
                  </div>

                  <section>
                    <div className="os-label mb-2">Filing profile</div>
                    <div className="divide-y divide-[var(--os-border)] overflow-hidden rounded-lg border border-[var(--os-border)]">
                      <Attr label="Client type">{kindLabel[h.kind]}</Attr>
                      <Attr label="Filing status">{filingStatus}</Attr>
                      <Attr label="Entities"><span className="tabular-nums">{ents.length}</span></Attr>
                      <Attr label="Expected forms">{forms}</Attr>
                    </div>
                  </section>

                  <section>
                    <div className="os-label mb-2">Contacts</div>
                    <div className="divide-y divide-[var(--os-border)] overflow-hidden rounded-lg border border-[var(--os-border)]">
                      {ppl.map(p => (
                        <div key={p.id} className="flex items-center gap-2.5 px-3.5 py-2.5">
                          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--os-selected)] text-[10px] font-medium text-[var(--os-ink-muted)]">{p.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-[13px] font-medium text-[var(--os-ink)]">{p.name}</span>
                              {primary && p.id === primary.id && <span className="shrink-0 rounded-full bg-[var(--os-selected)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--os-ink-muted)]">Primary</span>}
                            </div>
                            <div className="truncate text-[11px] text-[var(--os-ink-subtle)]">{p.email} · {p.phone}</div>
                          </div>
                          <span className="shrink-0 text-[11px] text-[var(--os-ink-subtle)]">{p.role}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <div className="os-label mb-2">Engagement</div>
                    <div className="divide-y divide-[var(--os-border)] overflow-hidden rounded-lg border border-[var(--os-border)]">
                      <Attr label="Service tier">{h.serviceTier}</Attr>
                      <Attr label="Assigned preparer">{owner}</Attr>
                      <Attr label="Client since"><span className="tabular-nums">{h.since}</span></Attr>
                      <Attr label="Referral source">{source}</Attr>
                      <Attr label="Deposit"><span className={depositPaid ? "text-[var(--os-success)]" : "text-[var(--os-warning)]"}>{depositPaid ? "Paid" : "Not collected"}</span></Attr>
                    </div>
                  </section>
                </div>
              );
            })()}

            {tab === "Entities" && (
              <div className="space-y-2.5">
                {ents.map(e => {
                  const er = returnsOfEntity(e.id);
                  return (
                    <div key={e.id} className="rounded-lg border border-[var(--os-border)] p-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="rounded-md bg-[var(--os-selected)] px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-[var(--os-ink-muted)]">{e.form}</span>
                        <span className="text-[13px] font-medium text-[var(--os-ink)]">{e.name}</span>
                        <span className="text-[12px] text-[var(--os-ink-subtle)]">{e.type}</span>
                        {e.ein && <span className="ml-auto font-mono text-[11px] text-[var(--os-ink-subtle)]">EIN {e.ein}</span>}
                      </div>
                      {er.map(r => (
                        <Link key={r.id} href={`/os/returns/${r.id}`} className="group/ret mt-2.5 flex items-center gap-3 border-t border-[var(--os-border)] pt-2.5 text-[12px]">
                          <span className="text-[var(--os-ink-muted)] transition-colors group-hover/ret:text-[var(--os-ink)]">{r.year} return</span>
                          <StageTag stage={r.stage} />
                          <span className="text-[var(--os-ink-subtle)]">·</span>
                          <span className={cn("tabular-nums", r.docsSubmitted >= r.docsRequired ? "text-[var(--os-ink-muted)]" : "text-[var(--os-warning)]")}>{r.docsSubmitted}/{r.docsRequired} docs</span>
                          <span className="ml-auto font-medium tabular-nums text-[var(--os-ink)]">${r.fee.toLocaleString()}</span>
                          <Icon icon={I.chevronRight} size={13} className="text-[var(--os-ink-subtle)] opacity-0 transition-opacity group-hover/ret:opacity-100" />
                        </Link>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}

            {tab === "Returns" && (
              <div className="divide-y divide-[var(--os-border)] rounded-lg border border-[var(--os-border)]">
                {rets.map(r => (
                  <Link key={r.id} href={`/os/returns/${r.id}`} className="flex items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-[var(--os-hover)]">
                    <span className="rounded bg-[var(--os-selected)] px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-[var(--os-ink-muted)]">{r.form}</span>
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-medium text-[var(--os-ink)]">{r.entityName} · {r.year}</div>
                    </div>
                    <div className="ml-auto flex items-center gap-3">
                      <StageTag stage={r.stage} />
                      <span className="w-16 text-right text-[13px] font-medium tabular-nums text-[var(--os-ink)]">${r.fee.toLocaleString()}</span>
                      <Icon icon={I.chevronRight} size={14} className="text-[var(--os-ink-subtle)]" />
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {tab === "Documents" && (
              <div className="space-y-5">
                {rets.map(r => {
                  const items = checklistFor(r.form);
                  const received = Math.min(r.docsSubmitted, items.length);
                  const missing = items.length - received;
                  return (
                    <div key={r.id}>
                      <div className="mb-2 flex items-center gap-2">
                        <span className="rounded bg-[var(--os-selected)] px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-[var(--os-ink-muted)]">{r.form}</span>
                        <span className="text-[13px] font-medium text-[var(--os-ink)]">{r.entityName}</span>
                        <span className="text-[11px] tabular-nums text-[var(--os-ink-subtle)]">{received} of {items.length} received</span>
                        {missing > 0 && (
                          <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-[var(--os-ink-subtle)]">
                            <PetalMark className="size-3" /> Doc Chase is chasing {missing}
                          </span>
                        )}
                      </div>
                      <div className="divide-y divide-[var(--os-border)] overflow-hidden rounded-lg border border-[var(--os-border)]">
                        {items.map((it, i) => {
                          const has = i < received;
                          return (
                            <div key={i} className="flex items-center gap-2.5 px-3.5 py-2.5">
                              {has
                                ? <Icon icon={I.check} size={15} className="shrink-0 text-emerald-600" />
                                : <span className="size-[15px] shrink-0 rounded-full border-[1.5px] border-amber-400" />}
                              <span className="text-[13px] text-[var(--os-ink)]">{it.label}</span>
                              {it.note && <span className="text-[11px] text-[var(--os-ink-subtle)]">{it.note}</span>}
                              <span className={cn("ml-auto text-[12px]", has ? "text-[var(--os-ink-subtle)]" : "text-[var(--os-warning)]")}>{has ? "Extracted" : "Requested"}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {tab === "Messages" && (() => {
              const cthreads = threads.filter(t => t.householdId === h.id);
              if (cthreads.length === 0) return <div className="grid h-full place-items-center text-[13px] text-[var(--os-ink-subtle)]">No messages yet.</div>;
              return (
                <div className="-mx-8 -mt-5">
                  {cthreads.map(t => (
                    <Link key={t.id} href="/os/inbox" className="group flex gap-2.5 border-b border-[var(--os-border)] px-8 py-3 transition-colors hover:bg-[var(--os-hover)]">
                      <div className="relative mt-0.5 shrink-0">
                        <span className="grid size-7 place-items-center rounded-full bg-[var(--os-selected)] text-[10px] font-medium text-[var(--os-ink-muted)]">{initials}</span>
                        <span className={cn("absolute -bottom-0.5 -right-0.5 size-3 rounded-full ring-2 ring-[var(--os-bg)]", channelMeta[t.channel].dot)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={cn("truncate text-[13px] text-[var(--os-ink)]", t.unread ? "font-semibold" : "font-medium")}>{t.subject}</span>
                          <span className="ml-auto shrink-0 text-[11px] tabular-nums text-[var(--os-ink-subtle)]">{t.time}</span>
                          {t.unread && <span className="size-2 shrink-0 rounded-full bg-[var(--os-accent)]" />}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-[var(--os-ink-muted)]">
                          {t.petalDraft && <PetalMark className="size-3 shrink-0" />}
                          <span className="truncate">{threadContext(t)} · {channelMeta[t.channel].label}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              );
            })()}

            {tab === "Billing" && (() => {
              const cardLast4 = String(1000 + (h.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 9000));
              const isBiz = h.kind !== "individual";
              const subFee = h.serviceTier === "Premium" ? 250 : 200;
              const invRows = rets.map((r, i) => {
                const [label, cls] = !r.depositPaid ? ["Overdue", "bg-amber-50 text-amber-700"] : r.stage === "filed" ? ["Paid", "bg-emerald-50 text-emerald-700"] : ["Open", "bg-blue-50 text-blue-700"];
                return { id: r.id, price: r.fee, label, cls, created: `3/${1 + i * 4}/2026`, due: `4/${12 + i * 3}/2026` };
              });
              const SUB_COLS = "grid-cols-[1fr_120px_130px_130px]";
              const INV_COLS = "grid-cols-[1fr_130px_120px_120px_40px]";
              return (
                <div className="space-y-7">
                  {/* Payment Methods */}
                  <section>
                    <div className="mb-2.5 flex items-center justify-between">
                      <h3 className="text-[14px] font-semibold text-[var(--os-ink)]">Payment Methods</h3>
                      <button className="grid size-6 place-items-center rounded-md text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]"><Icon icon={I.plus} size={15} /></button>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border border-[var(--os-border)] px-3.5 py-3">
                      <span className="grid h-6 w-9 shrink-0 place-items-center rounded bg-[var(--os-ink)] text-[8px] font-bold tracking-wide text-[var(--os-primary-fg)]">VISA</span>
                      <span className="text-[13px] tabular-nums text-[var(--os-ink)]">•••• {cardLast4}</span>
                      <span className="rounded-full bg-[var(--os-selected)] px-2 py-0.5 text-[11px] font-medium text-[var(--os-ink-muted)]">Default</span>
                      <span className="ml-auto text-[12px] text-[var(--os-ink-subtle)]">Expires 09 / 2028</span>
                      <button className="grid size-6 place-items-center rounded-md text-[var(--os-ink-subtle)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]"><Icon icon={I.more} size={15} /></button>
                    </div>
                  </section>

                  {/* Subscriptions */}
                  <section>
                    <div className="mb-2.5 flex items-center justify-between">
                      <h3 className="text-[14px] font-semibold text-[var(--os-ink)]">Subscriptions</h3>
                      <button className="grid size-6 place-items-center rounded-md text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]"><Icon icon={I.plus} size={15} /></button>
                    </div>
                    {isBiz ? (
                      <>
                        <div className="overflow-hidden rounded-lg border border-[var(--os-border)]">
                          <div className={cn("grid items-center gap-x-4 border-b border-[var(--os-border)] bg-[var(--os-bg-subtle)] px-3.5 py-2", SUB_COLS)}>
                            {["Price", "Status", "Created", "Next Payment"].map(c => <div key={c} className="os-label">{c}</div>)}
                          </div>
                          <div className={cn("grid items-center gap-x-4 px-3.5 py-3 text-[13px]", SUB_COLS)}>
                            <span className="tabular-nums text-[var(--os-ink)]"><span className="font-medium">${subFee}</span> <span className="text-[var(--os-ink-subtle)]">/ month</span></span>
                            <span><span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">Active</span></span>
                            <span className="tabular-nums text-[var(--os-ink-muted)]">1/17/2026</span>
                            <span className="tabular-nums text-[var(--os-ink-muted)]">2/17/2026</span>
                          </div>
                        </div>
                        <div className="mt-2 px-1 text-[12px] text-[var(--os-ink-subtle)]">1 subscription</div>
                      </>
                    ) : (
                      <div className="rounded-lg border border-[var(--os-border)] px-3.5 py-3 text-[13px] text-[var(--os-ink-subtle)]">No active subscriptions</div>
                    )}
                  </section>

                  {/* Invoices */}
                  <section>
                    <div className="mb-2.5 flex items-center justify-between">
                      <h3 className="text-[14px] font-semibold text-[var(--os-ink)]">Invoices</h3>
                      <button className="grid size-6 place-items-center rounded-md text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]"><Icon icon={I.plus} size={15} /></button>
                    </div>
                    <div className="overflow-hidden rounded-lg border border-[var(--os-border)]">
                      <div className={cn("grid items-center gap-x-4 border-b border-[var(--os-border)] bg-[var(--os-bg-subtle)] px-3.5 py-2", INV_COLS)}>
                        {["Price", "Status", "Created", "Due", ""].map((c, i) => <div key={i} className="os-label">{c}</div>)}
                      </div>
                      {invRows.map(row => (
                        <div key={row.id} className={cn("grid items-center gap-x-4 border-b border-[var(--os-border)] px-3.5 py-2.5 text-[13px] last:border-b-0", INV_COLS)}>
                          <span className="font-medium tabular-nums text-[var(--os-ink)]">{money(row.price)}</span>
                          <span><span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium", row.cls)}>{row.label}</span></span>
                          <span className="tabular-nums text-[var(--os-ink-muted)]">{row.created}</span>
                          <span className="tabular-nums text-[var(--os-ink-muted)]">{row.due}</span>
                          <button className="grid size-6 place-items-center justify-self-end rounded-md text-[var(--os-ink-subtle)] transition-colors hover:bg-[var(--os-selected)] hover:text-[var(--os-ink)]"><Icon icon={I.more} size={15} /></button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 px-1 text-[12px] text-[var(--os-ink-subtle)]">{invRows.length} {invRows.length === 1 ? "invoice" : "invoices"}</div>
                  </section>
                </div>
              );
            })()}

            {tab === "Tasks" && (() => {
              const items = triage.filter(t => t.householdId === h.id);
              if (items.length === 0) return <div className="grid h-full place-items-center text-[13px] text-[var(--os-ink-subtle)]">No open tasks for {firstName}.</div>;
              const groups = TIER_ORDER.map(tier => ({ tier, items: items.filter(t => t.tier === tier) })).filter(g => g.items.length > 0);
              return (
                <div className="-mx-8 -mt-5">
                  {groups.map(g => (
                    <div key={g.tier}>
                      <div className="flex items-center gap-2 bg-[var(--os-bg-subtle)] px-8 py-1.5">
                        <TierGlyph tier={g.tier} />
                        <span className="text-[13px] font-medium text-[var(--os-ink)]">{tierMeta[g.tier].label}</span>
                        <span className="text-[13px] tabular-nums text-[var(--os-ink-subtle)]">{g.items.length}</span>
                      </div>
                      {g.items.map(t => {
                        const ag = agentByName(t.agent);
                        const isDue = t.when.startsWith("Due");
                        return (
                          <Link key={t.id} href="/os/tasks" className="flex h-11 w-full items-center gap-2.5 px-8 transition-colors hover:bg-[var(--os-hover)]">
                            <TierGlyph tier={t.tier} />
                            <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--os-ink)]">{t.title}</span>
                            <div className="flex shrink-0 items-center gap-2 text-[11px]">
                              <TrustPill trust={t.trust} />
                              <span className={cn("w-14 shrink-0 text-right tabular-nums", isDue ? "text-[var(--os-warning)]" : "text-[var(--os-ink-subtle)]")}>{isDue ? t.when.replace("Due ", "") : t.when}</span>
                              {ag ? <AgentAvatar gradient={ag.gradient} size={18} bare /> : <span className="size-4 shrink-0 rounded-full bg-[var(--os-selected)]" />}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  ))}
                </div>
              );
            })()}

            {tab === "Compliance" && (
              <div className="space-y-5">
                <div>
                  <div className="os-label mb-2">Engagement &amp; consents</div>
                  <div className="divide-y divide-[var(--os-border)] overflow-hidden rounded-lg border border-[var(--os-border)]">
                    {[["Engagement letter", "Signed"], ["§7216 disclosure consent", "On file"], ["WISP acknowledgement", "On file"]].map(([label, status]) => (
                      <div key={label} className="flex items-center gap-2.5 px-3.5 py-2.5">
                        <Icon icon={I.check} size={15} className="shrink-0 text-emerald-600" />
                        <span className="text-[13px] text-[var(--os-ink)]">{label}</span>
                        <span className="ml-auto text-[12px] text-[var(--os-success)]">{status}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="os-label mb-2">E-file authorizations</div>
                  <div className="divide-y divide-[var(--os-border)] overflow-hidden rounded-lg border border-[var(--os-border)]">
                    {rets.map(r => {
                      const c = complianceFor(r.stage);
                      return (
                        <div key={r.id} className="flex items-center gap-2.5 px-3.5 py-2.5">
                          <span className="shrink-0 rounded bg-[var(--os-selected)] px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-[var(--os-ink-muted)]">{r.form}</span>
                          <span className="truncate text-[13px] text-[var(--os-ink)]">{r.entityName}</span>
                          <div className="ml-auto flex shrink-0 items-center gap-4">
                            <span className={cn("inline-flex items-center gap-1.5 text-[12px]", toneClass[c.auth[1]])}><span className={cn("size-1.5 rounded-full", toneDot[c.auth[1]])} /> {c.auth[0]}</span>
                            <span className={cn("hidden items-center gap-1.5 text-[12px] sm:inline-flex", toneClass[c.efile[1]])}><span className={cn("size-1.5 rounded-full", toneDot[c.efile[1]])} /> {c.efile[0]}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: workspace panel — Internal chat / Notes / Details (Assembly composition) */}
        <aside className="flex w-[360px] shrink-0 flex-col border-l border-[var(--os-border)]">
          <div className="flex items-center gap-1 border-b border-[var(--os-border)] px-3">
            {(["Internal chat", "Notes", "Details"] as const).map(p => (
              <button key={p} onClick={() => setPanel(p)} className={cn("relative px-2.5 py-2.5 text-[13px] transition-colors", panel === p ? "font-medium text-[var(--os-ink)]" : "text-[var(--os-ink-muted)] hover:text-[var(--os-ink)]")}>
                {p}
                {panel === p && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--os-ink)]" />}
              </button>
            ))}
          </div>

          {panel === "Internal chat" && (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
                {/* teammate prompt */}
                <div className="flex gap-2.5">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[var(--os-selected)] text-[9px] font-semibold text-[var(--os-ink-muted)]">{owner.split(" ").map(n => n[0]).join("").slice(0, 2)}</span>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-1.5"><span className="text-[13px] font-medium text-[var(--os-ink)]">{owner.split(" ")[0]}</span><span className="text-[11px] text-[var(--os-ink-subtle)]">9:32 AM</span></div>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--os-ink-muted)]"><span className="font-medium text-[var(--os-accent)]">@Petal</span> draft a reminder for {firstName} and tell me where the return stands.</p>
                  </div>
                </div>
                {/* Petal reply */}
                <div className="flex gap-2.5">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[var(--os-ink)] text-[var(--os-primary-fg)]"><PetalMark className="size-3.5" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-1.5"><span className="text-[13px] font-medium text-[var(--os-ink)]">Petal</span><span className="text-[11px] text-[var(--os-ink-subtle)]">just now</span></div>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--os-ink)]">{petalSummary}</p>
                    <div className="mt-2.5 overflow-hidden rounded-lg border border-[var(--os-border)]">
                      <div className="flex items-center gap-1.5 border-b border-[var(--os-border)] bg-[var(--os-bg-subtle)] px-3 py-2">
                        <PetalMark className="size-3.5 text-[var(--os-ink-muted)]" />
                        <span className="os-label">Draft reply</span>
                        <button className="ml-auto flex h-6 items-center gap-1 rounded-md bg-[var(--os-primary)] px-2 text-[11px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97]"><Icon icon={I.send} size={11} /> Review & send</button>
                      </div>
                      <div className="px-3 py-2.5 text-[12px] leading-relaxed text-[var(--os-ink)]">{draftText}</div>
                    </div>
                  </div>
                </div>
              </div>
              {/* composer (chat with teammates or @Petal) */}
              <div className="border-t border-[var(--os-border)] p-3">
                <div className="rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] px-2.5 py-2 transition-colors focus-within:border-[var(--os-border-strong)]">
                  <input placeholder="Chat with teammates or @Petal" className="w-full bg-transparent text-[13px] text-[var(--os-ink)] outline-none placeholder:text-[var(--os-ink-subtle)]" />
                  <div className="mt-2 flex items-center gap-0.5">
                    <button className="grid size-6 place-items-center rounded text-[14px] text-[var(--os-ink-subtle)] transition-colors hover:text-[var(--os-ink)]">@</button>
                    <button className="grid size-6 place-items-center rounded text-[var(--os-ink-subtle)] transition-colors hover:text-[var(--os-ink)]"><Icon icon={I.attach} size={14} /></button>
                    <button className="ml-auto grid size-6 place-items-center rounded-md bg-[var(--os-primary)] text-[var(--os-primary-fg)]"><Icon icon={I.send} size={13} /></button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {panel === "Notes" && (
            <div className="flex-1 overflow-y-auto p-4">
              <textarea placeholder={`Private notes about ${h.name}…`} className="h-full min-h-[220px] w-full resize-none rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] p-3 text-[13px] leading-relaxed text-[var(--os-ink)] outline-none placeholder:text-[var(--os-ink-subtle)] focus:border-[var(--os-border-strong)]" />
            </div>
          )}

          {panel === "Details" && (
            <div className="flex-1 overflow-y-auto pb-4">
              <div className="divide-y divide-[var(--os-border)] border-b border-[var(--os-border)]">
                <Attr label="Type">{kindLabel[h.kind]}</Attr>
                <Attr label="Stage"><StageTag stage={stage} /></Attr>
                <Attr label="Service">{h.serviceTier}</Attr>
                <Attr label="Entities"><span className="tabular-nums">{ents.length}</span></Attr>
                <Attr label="Returns"><span className="tabular-nums">{rets.length}</span></Attr>
                <Attr label="Total fee"><span className="tabular-nums">${householdFee(h.id).toLocaleString()}</span></Attr>
                <Attr label="Health"><span className={hp.text}>{hp.label}</span></Attr>
                <Attr label="Owner">{owner}</Attr>
                <Attr label="Client since"><span className="tabular-nums">{h.since}</span></Attr>
              </div>

              <div className="os-label px-3 pb-2 pt-4">People</div>
              <div className="divide-y divide-[var(--os-border)] border-y border-[var(--os-border)]">
                {ppl.map(p => (
                  <div key={p.id} className="flex items-center gap-2.5 px-3 py-2">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[var(--os-selected)] text-[10px] font-medium text-[var(--os-ink-muted)]">{p.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] text-[var(--os-ink)]">{p.name}</div>
                      <div className="truncate text-[11px] text-[var(--os-ink-subtle)]">{p.email}</div>
                    </div>
                    <span className="shrink-0 text-[11px] text-[var(--os-ink-subtle)]">{p.role}</span>
                  </div>
                ))}
              </div>

            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

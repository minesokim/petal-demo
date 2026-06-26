"use client";

// Weekly digest - the news. A newspaper of regulatory + practice developments (IRS &
// regulatory · Practice desks). Your-day items (review queue, deadlines, at-risk) live in
// the banner's Daily brief, not here. Each item expands inline with an animation: the
// briefing (what changed, why it matters, optional action) unfolds in place.

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import { Icon, I } from "@/components/os/icon";
import { Button } from "@/components/os/primitives";
import {
  briefToneDot, briefDeskMeta, BRIEF_DESK_ORDER, type BriefItem,
} from "@/lib/fixtures/firm";
import { useBrief } from "@/lib/client/brief-context";

const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]";

// Map a brief source LABEL to a canonical, authoritative official-domain URL so a reader can open it and
// verify it themselves. We never link a model-written URL (hallucination risk) — we route the label to the
// real agency page it names. No match → no link (the chip stays a plain label). Only the NEWS desk (irs)
// carries a source; practice/ops items don't get one.
function briefSourceUrl(source: string): string | null {
  const s = source.toLowerCase();
  if (/fincen|boi\b|beneficial owner|\bcta\b/.test(s)) return "https://www.fincen.gov/boi";
  if (/federal register/.test(s)) return "https://www.federalregister.gov/agencies/internal-revenue-service";
  if (/treasur/.test(s)) return "https://home.treasury.gov/policy-issues/tax-policy";
  if (/estimated|1040-?es|voucher/.test(s)) return "https://www.irs.gov/businesses/small-businesses-self-employed/estimated-taxes";
  if (/calendar|deadline|due date/.test(s)) return "https://www.irs.gov/businesses/small-businesses-self-employed/online-tax-calendar";
  if (/\birs\b|notice|rev\.?\s?proc|revenue procedure|bulletin|\birb\b|guidance|regulation|inflation|199a|qbi/.test(s)) return "https://www.irs.gov/newsroom";
  return null;
}

// The source as a single chip — a real new-tab link when we can route it to an official page, a plain
// label otherwise. stopPropagation so clicking the source doesn't also toggle the row open/closed.
function SourceChip({ source }: { source: string }) {
  const url = briefSourceUrl(source);
  const cls = "mt-1.5 inline-flex max-w-full items-center gap-1 rounded-full bg-[var(--os-hover)] px-2 py-0.5 text-[10.5px] text-[var(--os-ink-subtle)]";
  const inner = (
    <>
      <Icon icon={I.file} size={10} className="shrink-0" />
      <span className="truncate">{source}</span>
    </>
  );
  return url ? (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      title="Open source in a new tab"
      className={cn(cls, "transition-colors hover:text-[var(--os-ink-muted)] hover:underline")}
    >
      {inner}
    </a>
  ) : (
    <span className={cls}>{inner}</span>
  );
}

function BriefRow({ item, open, onToggle }: { item: BriefItem; open: boolean; onToggle: () => void }) {
  return (
    <div className={cn("-mx-2 rounded-lg transition-colors", open && "bg-[var(--os-hover)]")}>
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); } }}
        aria-expanded={open}
        className={cn("group/brief flex w-full cursor-pointer gap-2.5 rounded-lg px-2 py-2.5 text-left transition-colors", !open && "hover:bg-[var(--os-hover)]", focusRing)}
      >
        <span className={cn("mt-[7px] size-1.5 shrink-0 rounded-full", briefToneDot[item.tone])} />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-1.5">
            <span className="min-w-0 flex-1 text-[13px] font-normal leading-snug text-[var(--os-ink)]">{item.headline}</span>
            <span className="shrink-0 text-[10.5px] tabular-nums text-[var(--os-ink-subtle)]">{item.dateline}</span>
          </span>
          <span className="mt-0.5 block text-[12px] leading-snug text-[var(--os-ink-muted)]">{item.detail}</span>
          {/* Source only on the NEWS desk (irs), shown ONCE here (the expanded view no longer repeats it),
              clickable to the official page when we can route it. Practice/ops items carry no source. */}
          {item.desk === "irs" && item.source && <SourceChip source={item.source} />}
        </span>
        <Icon icon={I.chevronDown} size={14} className={cn("mt-1 shrink-0 self-start text-[var(--os-ink-subtle)] transition-transform duration-200", open && "rotate-180")} />
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-2 pb-3 pl-[26px] pt-0.5">
              <p className="text-[12.5px] leading-relaxed text-[var(--os-ink-muted)]">{item.body}</p>

              {item.whyItMatters && (
                <div className="mt-3 rounded-lg border border-[var(--os-border)] bg-[var(--os-card)] p-3">
                  <div className="mb-1 flex items-center gap-1.5 text-[10.5px] font-medium tracking-wide text-[var(--os-ink-subtle)]">
                    <PetalMark className="size-3 text-[var(--os-ink-muted)]" /> Why it matters to you
                  </div>
                  <p className="text-[12.5px] leading-relaxed text-[var(--os-ink)]">{item.whyItMatters}</p>
                </div>
              )}

              <div className="mt-3 flex items-center gap-2">
                {item.action && (
                  <Link href={item.action.href}><Button variant="secondary" size="sm">{item.action.label}</Button></Link>
                )}
                <Link href="/os/ask" className="group/ask ml-auto inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[11.5px] text-[var(--os-ink-subtle)] transition-colors hover:text-[var(--os-ink-muted)]">
                  <PetalMark className="size-3 transition-transform duration-500 ease-out group-hover/ask:rotate-[72deg]" /> Ask Petal
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function TodayBrief() {
  const brief = useBrief();
  const [openId, setOpenId] = useState<string | null>(null);
  // The Weekly digest is the NEWS: only the regulatory + practice desks. The firm + season desks
  // (your day) are surfaced in the banner's Daily brief instead, so they don't appear twice.
  const desks = BRIEF_DESK_ORDER
    .map(d => ({ desk: d, items: brief.filter(b => b.desk === d) }))
    .filter(g => g.items.length > 0 && (g.desk === "irs" || g.desk === "practice"));

  return (
    <div className="flex flex-col rounded-xl border border-[var(--os-border-strong)] bg-[var(--os-card)] p-5 transition-colors duration-200 hover:border-[var(--os-border-hover)]">
      <div className="mb-4 flex items-center gap-2">
        <PetalMark className="size-4 text-[var(--os-ink-muted)]" />
        <h3 className="os-display text-[15px] text-[var(--os-ink)]">Weekly digest</h3>
      </div>

      <div className="space-y-7">
        {desks.map(({ desk, items }) => (
          <section key={desk}>
            <div className="os-label mb-1.5 px-0.5">{briefDeskMeta[desk].label}</div>
            <div className="space-y-1">
              {items.map(item => (
                <BriefRow
                  key={item.id}
                  item={item}
                  open={openId === item.id}
                  onToggle={() => setOpenId(openId === item.id ? null : item.id)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <Link href="/os/activity" className={cn("-mx-2 mt-5 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] font-normal text-[var(--os-ink-muted)] transition-colors hover:text-[var(--os-ink)]", focusRing)}>
        View activity log <Icon icon={I.chevronRight} size={13} />
      </Link>
    </div>
  );
}

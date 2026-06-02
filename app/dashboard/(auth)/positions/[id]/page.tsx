"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  BookmarkIcon,
  CheckIcon,
  FileTextIcon,
  PlusIcon,
  ShieldCheckIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getPositionById,
  TIER_META,
  CATEGORY_META,
  type PositionAuthority,
} from "@/lib/positions-mock-data";
import { cn } from "@/lib/utils";

const AUTHORITY_TYPE_LABEL: Record<PositionAuthority["type"], string> = {
  irc: "Internal Revenue Code",
  treas_reg: "Treasury Regulation",
  rev_proc: "Revenue Procedure",
  case: "Court case",
  irs_guidance: "IRS guidance",
};

// ═════════════════════════════════════════════════════════════════════════
// Page
// ═════════════════════════════════════════════════════════════════════════

interface Props {
  params: Promise<{ id: string }>;
}

export default function PositionDetailPage({ params }: Props) {
  const { id } = use(params);
  const position = getPositionById(id);
  if (!position) notFound();

  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState("overview");

  const sections = [
    { id: "overview", label: "Overview" },
    { id: "authority", label: "Authority chain" },
    { id: "eligibility", label: "Eligibility" },
    { id: "documentation", label: "Documentation" },
    { id: "practice", label: "Use in practice" },
    { id: "notes", label: "My notes" },
  ];

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    function onScroll() {
      const scrollTop = scroller!.scrollTop;
      let current = sections[0].id;
      for (const sec of sections) {
        const el = scroller!.querySelector(`#sec-${sec.id}`) as HTMLElement | null;
        if (el && el.offsetTop - 100 <= scrollTop) current = sec.id;
      }
      setActiveSection(current);
    }
    scroller.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => scroller.removeEventListener("scroll", onScroll);
  }, []);

  const jumpTo = (id: string) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const el = scroller.querySelector(`#sec-${id}`) as HTMLElement | null;
    if (el) scroller.scrollTo({ top: el.offsetTop - 16, behavior: "smooth" });
  };

  const tier = TIER_META[position.tier];

  return (
    <div className="space-y-5">
      {/* ── Breadcrumb back ── */}
      <Link
        href="/dashboard/positions"
        className="inline-flex items-center gap-1 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon className="size-3" /> Position Library
      </Link>

      {/* ── Scroll-spy layout ── */}
      <div
        ref={scrollerRef}
        className="relative max-h-[calc(100vh-180px)] overflow-y-auto rounded-lg border bg-card"
      >
        <div className="grid gap-7 px-5 pb-12 pt-6 md:grid-cols-[180px_1fr] md:px-8">
          {/* ── Sticky TOC rail ── */}
          <aside className="md:sticky md:top-0 md:self-start md:pt-1">
            <div className="mb-3 text-[10.5px] font-medium uppercase tracking-[0.08em] text-foreground/55">
              On this page
            </div>
            <ul className="space-y-0.5">
              {sections.map((sec) => {
                const isActive = activeSection === sec.id;
                return (
                  <li key={sec.id}>
                    <button
                      onClick={() => jumpTo(sec.id)}
                      className={cn(
                        "block w-full rounded-md px-2 py-1.5 text-left text-[12px] transition-colors",
                        isActive
                          ? "bg-muted/60 font-medium text-foreground"
                          : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                      )}
                    >
                      {sec.label}
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Quick actions */}
            <div className="mt-5 space-y-1.5">
              <Button size="sm" variant="outline" className="w-full justify-start text-xs h-8">
                <PlusIcon className="size-3" /> Apply to client
              </Button>
              <Button size="sm" variant="ghost" className="w-full justify-start text-xs h-8">
                <BookmarkIcon className="size-3" /> Bookmark
              </Button>
            </div>
          </aside>

          {/* ── Main column ── */}
          <main className="min-w-0">
            {/* Hero header */}
            <div className="pb-6">
              <div className="mb-1.5 flex items-center gap-2">
                <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-foreground/55">
                  {position.iconSection}
                </span>
                <span className="text-muted-foreground/40">·</span>
                <span className="text-[11px] capitalize text-muted-foreground">
                  {CATEGORY_META[position.category].label}
                </span>
              </div>
              <h1 className="font-display text-[32px] font-medium leading-tight tracking-tight">
                {position.name}
              </h1>
              <p className="mt-2 font-serif italic text-[14px] leading-relaxed text-muted-foreground">
                {position.brief}
              </p>

              {/* Tier chip with full description */}
              <div className={cn("mt-4 rounded-md px-3.5 py-2.5 ring-1", tier.chipClass)}>
                <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.08em]">
                  <ShieldCheckIcon className="size-3" />
                  <span>{tier.label}</span>
                </div>
                <p className="mt-1 text-[12.5px] leading-relaxed">{tier.description}</p>
              </div>
            </div>

            {/* OVERVIEW */}
            <Section id="overview" first label="Step 1 · Overview" heading="What this position does">
              <p className="text-[14px] leading-relaxed text-foreground/85">{position.description}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Used this season" value={position.usedInPractice.toString()} />
                <Stat label="Refused (floor)" value={(position.refusedCount ?? 0).toString()} muted={!position.refusedCount} />
                <Stat label="Category" value={CATEGORY_META[position.category].label} />
                <Stat label="Confidence tier" value={tier.short} />
              </div>
            </Section>

            {/* AUTHORITY CHAIN */}
            <Section id="authority" label="Step 2 · Authority" heading="Authority chain">
              <p className="text-[13.5px] leading-relaxed text-muted-foreground mb-4">
                Every citation links to primary source — never secondary commentary, never opinion blogs.
              </p>
              <ul className="space-y-2">
                {position.authority.map((a, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 rounded-md border border-border/70 bg-background p-3"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded bg-foreground/[0.04]">
                      <FileTextIcon className="size-3.5 text-muted-foreground" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10.5px] font-medium uppercase tracking-wider text-foreground/55">
                          {AUTHORITY_TYPE_LABEL[a.type]}
                        </span>
                      </div>
                      <div className="mt-0.5 font-mono text-[13px] text-foreground/90">{a.citation}</div>
                      {a.note && <div className="mt-0.5 text-[11.5px] italic text-muted-foreground">{a.note}</div>}
                    </div>
                  </li>
                ))}
              </ul>
            </Section>

            {/* ELIGIBILITY */}
            <Section id="eligibility" label="Step 3 · Eligibility" heading="When this position applies">
              <ul className="space-y-2">
                {position.eligibility.map((e, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[13.5px] leading-relaxed">
                    <CheckIcon className="mt-1 size-3 shrink-0 text-emerald-600" />
                    <span className="text-foreground/85">{e}</span>
                  </li>
                ))}
              </ul>
            </Section>

            {/* DOCUMENTATION */}
            <Section id="documentation" label="Step 4 · Documentation" heading="What you need on file">
              <ul className="space-y-2">
                {position.documentation.map((d, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 rounded-md border border-border/70 bg-background px-3 py-2 text-[13px] leading-relaxed"
                  >
                    <FileTextIcon className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
                    <span className="text-foreground/85">{d}</span>
                  </li>
                ))}
              </ul>
            </Section>

            {/* USE IN PRACTICE */}
            <Section id="practice" label="Step 5 · Practice" heading="Where you're using this">
              {position.usedInPractice === 0 ? (
                <p className="text-[13.5px] leading-relaxed text-muted-foreground">
                  You haven&apos;t applied this position to any returns this season. When I scan a return and detect
                  eligibility, I&apos;ll surface it in your Tasks queue.
                </p>
              ) : (
                <div>
                  <p className="text-[13.5px] leading-relaxed text-foreground/85 mb-3">
                    Applied to <span className="font-medium tabular-nums">{position.usedInPractice}</span> returns this season.
                  </p>
                  <div className="rounded-md border border-border/70 bg-background p-3.5 text-[12.5px] text-muted-foreground">
                    <p>
                      Drill-down by client coming soon. For now, search the Position Library applied filter on the Clients page.
                    </p>
                  </div>
                </div>
              )}
              {position.refusedCount !== undefined && position.refusedCount > 0 && (
                <div className="mt-3 rounded-md border border-red-200 bg-red-50/40 p-3.5 text-[12.5px] dark:border-red-900/40 dark:bg-red-950/20">
                  <div className="mb-1 flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.08em] text-red-700 dark:text-red-400">
                    <ShieldCheckIcon className="size-3" /> Refusal floor enforced
                  </div>
                  <p className="text-foreground/80 leading-relaxed">
                    I refused this position on{" "}
                    <span className="font-medium tabular-nums">{position.refusedCount}</span> returns this season — the legal
                    backing wasn&apos;t strong enough to clear Reasonable Basis. Each refusal includes a memo explaining why.
                  </p>
                </div>
              )}
            </Section>

            {/* MY NOTES */}
            <Section id="notes" label="Step 6 · Notes" heading="Your playbook">
              <div className="rounded-md border border-border/70 bg-muted/30 p-4 text-[13px] leading-relaxed text-muted-foreground italic">
                Add your own notes, examples from practice, common gotchas, or client-specific applications.
                This is your space — I&apos;ll surface it when this position comes up on any client.
              </div>
              <Button size="sm" variant="outline" className="mt-3 text-xs">
                <PlusIcon className="size-3" /> Add a note
              </Button>
            </Section>
          </main>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// Section + Stat
// ═════════════════════════════════════════════════════════════════════════

function Section({
  id,
  first,
  label,
  heading,
  children,
}: {
  id: string;
  first?: boolean;
  label: string;
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={`sec-${id}`}
      className={cn(
        "scroll-mt-3 border-t border-border/60 pt-7 mt-7",
        first && "border-t-0 pt-0 mt-0"
      )}
    >
      <div className="mb-2 text-[10.5px] font-medium uppercase tracking-[0.08em] text-foreground/55">
        {label}
      </div>
      <h2 className="font-display text-[20px] font-medium leading-tight tracking-tight mb-4">
        {heading}
      </h2>
      {children}
    </section>
  );
}

function Stat({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="rounded-md border border-border/70 bg-background px-3 py-2.5">
      <div
        className={cn(
          "font-display text-[18px] font-medium leading-none tabular-nums",
          muted && "text-muted-foreground"
        )}
      >
        {value}
      </div>
      <div className="mt-1.5 text-[10.5px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

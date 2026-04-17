import * as React from "react";
import { cn } from "@/lib/utils";
import type { ClientWorkspace, StatChip } from "@/lib/v4/clients";

/**
 * ClientHeader — top of the client workspace main pane.
 *
 * Reference: design-references/docket-synthesis.html
 *
 * Structure:
 *   [ 38px lg avatar | serif name + meta line ] [ right-aligned action buttons ]
 *   [ Status · Deadline · Docs · Paid · Est. refund · Last contact ] (6 stat chips)
 */
export interface ClientHeaderProps {
  client: ClientWorkspace;
}

export function ClientHeader({ client }: ClientHeaderProps) {
  return (
    <header className="border-b border-hairline px-7 pt-[22px] pb-4">
      <div className="mb-3.5 flex items-center gap-3.5">
        <span className="grid size-[38px] flex-shrink-0 place-items-center rounded-full bg-ink-2 text-[13px] font-medium tracking-[0.02em] text-bg">
          {client.initials}
        </span>
        <div className="min-w-0">
          <div
            className="mb-[3px] font-serif text-[26px] font-medium leading-[1.1] tracking-[-0.018em] text-ink"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 30' }}>
            {client.name}
          </div>
          <div className="font-mono text-[11px] tracking-[0.02em] text-ink-4">
            <span className="font-medium text-ink-3">
              {client.serviceTier} · ${client.fee}
            </span>
            <DotSep />
            <span>{client.yearClient}</span>
            <DotSep />
            <span>{client.intakeDate}</span>
            {client.referral ? (
              <>
                <DotSep />
                <span>{client.referral}</span>
              </>
            ) : null}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <ActionBtn kbd="M">Message</ActionBtn>
          <ActionBtn kbd="C">Call</ActionBtn>
          <ActionBtn>Documents</ActionBtn>
          <ActionBtn primary kbd="⌘⏎">
            Open return
          </ActionBtn>
        </div>
      </div>

      <div className="flex gap-7 pt-2">
        {client.stats.map((stat) => (
          <StatCell key={stat.label} stat={stat} />
        ))}
      </div>
    </header>
  );
}

function DotSep() {
  return <span className="mx-[5px] text-ink-5">·</span>;
}

function ActionBtn({
  children,
  kbd,
  primary
}: {
  children: React.ReactNode;
  kbd?: string;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-[7px] rounded-[4px] border px-[9px] py-1 text-[11.5px] font-medium transition-colors",
        "border-hairline bg-surface text-ink-2 hover:bg-surface-2",
        primary && "border-ink bg-ink text-bg hover:bg-ink-2"
      )}
      style={{ letterSpacing: "-0.003em" }}>
      {children}
      {kbd ? (
        <kbd
          className={cn(
            "inline-flex items-center rounded-[2px] border px-1 font-mono text-[9.5px] tracking-[0.02em]",
            primary
              ? "border-white/15 bg-white/[0.08] text-white/75"
              : "border-hairline bg-bg text-ink-3"
          )}
          style={{ lineHeight: "14px" }}>
          {kbd}
        </kbd>
      ) : null}
    </button>
  );
}

function StatCell({ stat }: { stat: StatChip }) {
  const isRust = stat.tone === "rust";
  const isPositive = stat.tone === "positive";
  const hasDollar = /^\$/.test(stat.value);

  return (
    <div className="flex min-w-0 flex-col gap-[2px]">
      <div className="font-mono text-[9.5px] font-medium tracking-[0.12em] text-ink-4 uppercase">
        {stat.label}
      </div>
      <div
        className={cn(
          "flex items-baseline gap-[5px] text-[13px] font-[550] text-ink",
          isRust && "text-rust before:mr-[3px] before:inline-block before:text-[10px] before:content-['\\25CF']",
          isPositive && "text-positive"
        )}>
        <span className={cn((hasDollar || /^[~\d]/.test(stat.value)) && "font-mono text-[12.5px] font-medium tabular-nums")}>
          {stat.value}
        </span>
        {stat.sub ? (
          <span className="font-mono text-[11px] font-medium text-rust">{stat.sub}</span>
        ) : null}
      </div>
    </div>
  );
}

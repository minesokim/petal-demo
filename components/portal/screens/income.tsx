"use client";

import * as React from "react";

import { useIntakeStore } from "@/lib/portal/intake-store";
import {
  AntonioNote,
  Body,
  BottomBar,
  Button,
  Eyebrow,
  FieldLabel,
  IntakeHeader,
  OptionRow,
  Row,
  Screen,
  Stack,
  TextField
} from "@/components/portal/primitives";
import type {
  IncomeSourceId,
  RentalProperty,
  SelfEmployment
} from "@/lib/portal/intake-types";
import { ServiceIcon, Glyph } from "./icons";

/* ─────────────────────── Step 7 — Income sources ─────────────────────── */

const INCOME_OPTIONS: {
  id: IncomeSourceId;
  title: string;
  sub: string;
  icon: React.ReactNode;
}[] = [
  { id: "w2", title: "W-2 wages", sub: "From an employer", icon: <Glyph name="briefcase" /> },
  { id: "self1099", title: "Self-employment / 1099", sub: "Contract or gig work", icon: <ServiceIcon name="self" /> },
  { id: "rental", title: "Rental property", sub: "Income from property you own", icon: <ServiceIcon name="rental" /> },
  { id: "interestDiv", title: "Interest & dividends", sub: "Bank, brokerage statements", icon: <Glyph name="wallet" /> },
  { id: "capGains", title: "Capital gains / losses", sub: "Stock sales, crypto, real estate", icon: <Glyph name="sparkle" /> },
  { id: "retirement", title: "Retirement distributions", sub: "IRA, 401(k), pension", icon: <Glyph name="shield" /> },
  { id: "crypto", title: "Crypto", sub: "Trades, staking, airdrops", icon: <ServiceIcon name="crypto" /> },
  { id: "gambling", title: "Gambling winnings", sub: "Sportsbook, casino, lottery", icon: <Glyph name="sparkle" /> },
  { id: "other", title: "Something else", sub: "I'll describe it separately", icon: <Glyph name="edit" /> }
];

export function ScreenIncomeSources() {
  const { incomeSources, patch, goNext, goPrev } = useIntakeStore();
  const [selected, setSelected] = React.useState<Set<IncomeSourceId>>(
    new Set(incomeSources)
  );

  const toggle = (id: IncomeSourceId) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const handleNext = () => {
    patch({ incomeSources: [...selected] });
    goNext();
  };

  const hasAnything = selected.size > 0;

  return (
    <Screen>
      <IntakeHeader step={7} label="Income" />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="px-6 pt-7 pb-6">
          <Stack gap={10}>
            <h1
              className="font-serif text-[26px] font-medium leading-[1.15] tracking-[-0.015em] text-portal-ink"
              style={{
                fontVariationSettings: '"opsz" 36',
                fontSynthesis: "none"
              }}>
              Where did money come from in 2024?
            </h1>
            <Body size={14}>Check any that apply. I&apos;ll ask for details where I need them.</Body>
          </Stack>

          <Stack gap={8} className="mt-7">
            {INCOME_OPTIONS.map((o) => (
              <OptionRow
                key={o.id}
                selected={selected.has(o.id)}
                onClick={() => toggle(o.id)}
                icon={o.icon}
                title={o.title}
                sub={o.sub}
              />
            ))}
          </Stack>

          {selected.has("rental") || selected.has("self1099") ? (
            <AntonioNote>
              I&apos;ll ask for a bit more detail on{" "}
              {selected.has("rental") && selected.has("self1099")
                ? "rental + self-employment"
                : selected.has("rental")
                  ? "your rental"
                  : "your self-employment"}{" "}
              on the next screen so I can scope Schedule E/C correctly.
            </AntonioNote>
          ) : null}
        </div>
      </div>

      <BottomBar>
        <Button variant="secondary" onClick={goPrev}>
          Back
        </Button>
        <Button
          variant="primary"
          fullWidth
          disabled={!hasAnything}
          onClick={handleNext}>
          Continue
        </Button>
      </BottomBar>
    </Screen>
  );
}

/* ─────────────────────── Step 7 (cond) — Rental property detail ─────────────────────── */

export function ScreenRentalDetail() {
  const { rental, patch, goNext, goPrev } = useIntakeStore();

  const set = (updater: (r: RentalProperty) => RentalProperty) => {
    patch({ rental: updater(rental) });
  };

  const canContinue =
    rental.addressLine.trim().length > 0 &&
    rental.city.trim().length > 0 &&
    rental.state.length === 2;

  return (
    <Screen>
      <IntakeHeader step={7} label="Rental property" />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="px-6 pt-7 pb-6">
          <Stack gap={10}>
            <h1
              className="font-serif text-[26px] font-medium leading-[1.15] tracking-[-0.015em] text-portal-ink"
              style={{
                fontVariationSettings: '"opsz" 36',
                fontSynthesis: "none"
              }}>
              Tell me about the property.
            </h1>
            <Body size={14}>
              I&apos;ll use this to start your Schedule E.
            </Body>
          </Stack>

          <Stack gap={14} className="mt-7">
            <TextField
              label="Address"
              value={rental.addressLine}
              onChange={(e) => set((r) => ({ ...r, addressLine: e.target.value }))}
              placeholder="123 Main St"
            />
            <Row gap={10}>
              <TextField
                label="City"
                value={rental.city}
                onChange={(e) => set((r) => ({ ...r, city: e.target.value }))}
              />
              <TextField
                label="State"
                value={rental.state}
                onChange={(e) =>
                  set((r) => ({
                    ...r,
                    state: e.target.value.toUpperCase().slice(0, 2) as never
                  }))
                }
                maxLength={2}
              />
              <TextField
                label="ZIP"
                value={rental.zip}
                onChange={(e) =>
                  set((r) => ({
                    ...r,
                    zip: e.target.value.replace(/\D/g, "").slice(0, 5)
                  }))
                }
                inputMode="numeric"
                maxLength={5}
              />
            </Row>

            <Row gap={10}>
              <TextField
                label="Gross rent collected"
                value={rental.grossRent?.toString() ?? ""}
                onChange={(e) =>
                  set((r) => ({
                    ...r,
                    grossRent: parseCurrency(e.target.value)
                  }))
                }
                placeholder="$"
                inputMode="decimal"
              />
              <TextField
                label="Total expenses"
                value={rental.expenses?.toString() ?? ""}
                onChange={(e) =>
                  set((r) => ({
                    ...r,
                    expenses: parseCurrency(e.target.value)
                  }))
                }
                placeholder="$"
                inputMode="decimal"
              />
            </Row>

            <div>
              <FieldLabel>Did you actively manage the property?</FieldLabel>
              <Stack gap={8}>
                <OptionRow
                  selected={rental.activeParticipation === true}
                  onClick={() =>
                    set((r) => ({ ...r, activeParticipation: true }))
                  }
                  title="Yes, actively managed"
                  sub="Handled tenant issues, repairs, rent collection"
                />
                <OptionRow
                  selected={rental.activeParticipation === false}
                  onClick={() =>
                    set((r) => ({ ...r, activeParticipation: false }))
                  }
                  title="No, passive"
                  sub="Property manager handled everything"
                />
              </Stack>
            </div>
          </Stack>

          <AntonioNote>
            Active participation unlocks the $25K passive-loss allowance (phased
            out above $150K MAGI). Worth getting right — I&apos;ll confirm when
            I see the numbers.
          </AntonioNote>
        </div>
      </div>

      <BottomBar>
        <Button variant="secondary" onClick={goPrev}>
          Back
        </Button>
        <Button
          variant="primary"
          fullWidth
          disabled={!canContinue}
          onClick={goNext}>
          Continue
        </Button>
      </BottomBar>
    </Screen>
  );
}

/* ─────────────────────── Step 7 (cond) — Self-employment detail ─────────────────────── */

export function ScreenSelfEmploymentDetail() {
  const { selfEmployment, patch, goNext, goPrev } = useIntakeStore();

  const set = (updater: (s: SelfEmployment) => SelfEmployment) => {
    patch({ selfEmployment: updater(selfEmployment) });
  };

  const canContinue =
    selfEmployment.businessName.trim().length > 0 &&
    selfEmployment.description.trim().length > 0;

  return (
    <Screen>
      <IntakeHeader step={7} label="Self-employment" />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="px-6 pt-7 pb-6">
          <Stack gap={10}>
            <h1
              className="font-serif text-[26px] font-medium leading-[1.15] tracking-[-0.015em] text-portal-ink"
              style={{
                fontVariationSettings: '"opsz" 36',
                fontSynthesis: "none"
              }}>
              About your work.
            </h1>
            <Body size={14}>
              We&apos;ll use this to start your Schedule C.
            </Body>
          </Stack>

          <Stack gap={14} className="mt-7">
            <TextField
              label="Business or professional name"
              value={selfEmployment.businessName}
              onChange={(e) =>
                set((s) => ({ ...s, businessName: e.target.value }))
              }
              placeholder="e.g. Smith Design Studio, or your name"
            />
            <div>
              <FieldLabel>What you do</FieldLabel>
              <textarea
                value={selfEmployment.description}
                onChange={(e) =>
                  set((s) => ({ ...s, description: e.target.value }))
                }
                placeholder="Brief description — e.g. freelance graphic design for small businesses"
                className="w-full rounded-[14px] border border-portal-border bg-portal-card px-[18px] py-4 text-[15px] text-portal-ink outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-portal-muted focus:border-forest focus:shadow-[0_0_0_3px_var(--portal-forest-tint)]"
                rows={3}
              />
            </div>

            <Row gap={10}>
              <TextField
                label="Gross income"
                value={selfEmployment.gross?.toString() ?? ""}
                onChange={(e) =>
                  set((s) => ({ ...s, gross: parseCurrency(e.target.value) }))
                }
                placeholder="$"
                inputMode="decimal"
              />
              <TextField
                label="Expenses"
                value={selfEmployment.expenses?.toString() ?? ""}
                onChange={(e) =>
                  set((s) => ({ ...s, expenses: parseCurrency(e.target.value) }))
                }
                placeholder="$"
                inputMode="decimal"
              />
            </Row>

            <div>
              <FieldLabel>Used a vehicle for work?</FieldLabel>
              <Row gap={8}>
                <YesNoChip
                  value={selfEmployment.vehicleUse === true}
                  onClick={() => set((s) => ({ ...s, vehicleUse: true }))}>
                  Yes
                </YesNoChip>
                <YesNoChip
                  value={selfEmployment.vehicleUse === false}
                  onClick={() => set((s) => ({ ...s, vehicleUse: false }))}>
                  No
                </YesNoChip>
              </Row>
            </div>

            <div>
              <FieldLabel>Home office?</FieldLabel>
              <Row gap={8}>
                <YesNoChip
                  value={selfEmployment.homeOffice === true}
                  onClick={() => set((s) => ({ ...s, homeOffice: true }))}>
                  Yes
                </YesNoChip>
                <YesNoChip
                  value={selfEmployment.homeOffice === false}
                  onClick={() => set((s) => ({ ...s, homeOffice: false }))}>
                  No
                </YesNoChip>
              </Row>
            </div>

            <div>
              <FieldLabel>Paid any employees or contractors?</FieldLabel>
              <Row gap={8}>
                <YesNoChip
                  value={selfEmployment.hasEmployees === true}
                  onClick={() => set((s) => ({ ...s, hasEmployees: true }))}>
                  Yes
                </YesNoChip>
                <YesNoChip
                  value={selfEmployment.hasEmployees === false}
                  onClick={() => set((s) => ({ ...s, hasEmployees: false }))}>
                  No
                </YesNoChip>
              </Row>
            </div>
          </Stack>

          <AntonioNote>
            I&apos;ll translate your gross + expenses into Schedule C categories
            (office expense, supplies, travel, etc.) — you don&apos;t need to
            itemize here. Save receipts in the docs step.
          </AntonioNote>
        </div>
      </div>

      <BottomBar>
        <Button variant="secondary" onClick={goPrev}>
          Back
        </Button>
        <Button
          variant="primary"
          fullWidth
          disabled={!canContinue}
          onClick={goNext}>
          Continue
        </Button>
      </BottomBar>
    </Screen>
  );
}

function YesNoChip({
  value,
  onClick,
  children
}: {
  value: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex-1 rounded-full border px-4 py-2 text-[13px] font-medium transition-colors",
        value
          ? "border-forest bg-forest-tint text-forest-ink"
          : "border-portal-border bg-portal-card text-portal-ink-soft hover:bg-portal-bg-elev"
      ].join(" ")}>
      {children}
    </button>
  );
}

function parseCurrency(v: string): number | null {
  const clean = v.replace(/[^0-9.]/g, "");
  if (!clean) return null;
  const n = Number(clean);
  return Number.isFinite(n) ? n : null;
}

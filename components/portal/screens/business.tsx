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
import type { BusinessEntityType } from "@/lib/portal/intake-types";

/* ─────────────────────── Business path, Step 2 — Business info ─────────────────────── */

const ENTITY_OPTIONS: {
  id: BusinessEntityType;
  title: string;
  sub: string;
}[] = [
  { id: "scorp", title: "S-Corporation", sub: "Form 1120-S" },
  { id: "partnership", title: "Partnership", sub: "Form 1065" },
  { id: "llc", title: "LLC", sub: "Depends on election — single-member or multi" },
  { id: "ccorp", title: "C-Corporation", sub: "Form 1120" }
];

export function ScreenBusinessInfo() {
  const { businessInfo, patch, goNext, goPrev } = useIntakeStore();

  const set = <K extends keyof typeof businessInfo>(
    key: K,
    value: (typeof businessInfo)[K]
  ) => patch({ businessInfo: { ...businessInfo, [key]: value } });

  const canContinue =
    businessInfo.entity !== null &&
    businessInfo.legalName.trim().length > 0 &&
    businessInfo.ein.length === 10;

  return (
    <Screen>
      <IntakeHeader step={2} label="Business info" />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="px-6 pt-7 pb-6">
          <Stack gap={10}>
            <h1
              className="font-serif text-[26px] font-medium leading-[1.15] tracking-[-0.015em] text-portal-ink"
              style={{
                fontVariationSettings: '"opsz" 36',
                fontSynthesis: "none"
              }}>
              About the business.
            </h1>
            <Body size={14}>Entity type + IRS identifiers.</Body>
          </Stack>

          <Stack gap={16} className="mt-7">
            <div>
              <FieldLabel>Entity type</FieldLabel>
              <Stack gap={8}>
                {ENTITY_OPTIONS.map((o) => (
                  <OptionRow
                    key={o.id ?? "none"}
                    selected={businessInfo.entity === o.id}
                    onClick={() => set("entity", o.id)}
                    title={o.title}
                    sub={o.sub}
                  />
                ))}
              </Stack>
            </div>

            <TextField
              label="Legal name"
              value={businessInfo.legalName}
              onChange={(e) => set("legalName", e.target.value)}
              placeholder="As shown on your IRS letter"
            />
            <TextField
              label="EIN"
              value={businessInfo.ein}
              onChange={(e) => set("ein", formatEin(e.target.value))}
              placeholder="XX-XXXXXXX"
              inputMode="numeric"
            />
            <Row gap={10}>
              <TextField
                label="State registered"
                value={businessInfo.stateRegistered}
                onChange={(e) =>
                  set(
                    "stateRegistered",
                    e.target.value.toUpperCase().slice(0, 2) as never
                  )
                }
                maxLength={2}
                placeholder="CA"
              />
              <TextField
                label="Year formed"
                value={businessInfo.yearFormed?.toString() ?? ""}
                onChange={(e) =>
                  set(
                    "yearFormed",
                    e.target.value
                      ? Number(e.target.value.replace(/\D/g, "").slice(0, 4))
                      : null
                  )
                }
                inputMode="numeric"
                maxLength={4}
                placeholder="YYYY"
              />
              <TextField
                label="Owners"
                value={businessInfo.ownerCount?.toString() ?? ""}
                onChange={(e) =>
                  set(
                    "ownerCount",
                    e.target.value
                      ? Number(e.target.value.replace(/\D/g, ""))
                      : null
                  )
                }
                inputMode="numeric"
                maxLength={3}
              />
            </Row>
          </Stack>

          <AntonioNote>
            {businessInfo.entity === "scorp"
              ? "S-Corp returns are due March 15. We'll want to start on books and reasonable-comp analysis early."
              : businessInfo.entity === "partnership"
                ? "Partnership returns (1065) are also March 15. Each partner gets a K-1 once filed."
                : "We'll confirm entity details against your IRS letter before I file."}
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

function formatEin(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 9);
  if (d.length < 3) return d;
  return `${d.slice(0, 2)}-${d.slice(2)}`;
}

/* ─────────────────────── Business path, Step 3 — Formation (desired state) ─────────────────────── */

export function ScreenBusinessFormation() {
  const { businessFormation, patch, goNext, goPrev } = useIntakeStore();

  const set = <K extends keyof typeof businessFormation>(
    key: K,
    value: (typeof businessFormation)[K]
  ) => patch({ businessFormation: { ...businessFormation, [key]: value } });

  const canContinue =
    businessFormation.desiredEntity !== null &&
    businessFormation.stateTarget.length === 2 &&
    businessFormation.hasPartners !== null;

  return (
    <Screen>
      <IntakeHeader step={3} label="Formation" />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="px-6 pt-7 pb-6">
          <Stack gap={10}>
            <h1
              className="font-serif text-[26px] font-medium leading-[1.15] tracking-[-0.015em] text-portal-ink"
              style={{
                fontVariationSettings: '"opsz" 36',
                fontSynthesis: "none"
              }}>
              What are we setting up?
            </h1>
            <Body size={14}>
              Give me the broad shape — we&apos;ll refine on our call.
            </Body>
          </Stack>

          <Stack gap={16} className="mt-7">
            <div>
              <FieldLabel>Desired entity</FieldLabel>
              <Stack gap={8}>
                {ENTITY_OPTIONS.map((o) => (
                  <OptionRow
                    key={o.id ?? "none"}
                    selected={businessFormation.desiredEntity === o.id}
                    onClick={() => set("desiredEntity", o.id)}
                    title={o.title}
                    sub={o.sub}
                  />
                ))}
              </Stack>
            </div>

            <TextField
              label="State to register in"
              value={businessFormation.stateTarget}
              onChange={(e) =>
                set(
                  "stateTarget",
                  e.target.value.toUpperCase().slice(0, 2) as never
                )
              }
              maxLength={2}
              placeholder="CA"
            />

            <div>
              <FieldLabel>Any partners or co-owners?</FieldLabel>
              <Row gap={8}>
                <YesNo
                  value={businessFormation.hasPartners === true}
                  onClick={() => set("hasPartners", true)}>
                  Yes
                </YesNo>
                <YesNo
                  value={businessFormation.hasPartners === false}
                  onClick={() => set("hasPartners", false)}>
                  No
                </YesNo>
              </Row>
            </div>
          </Stack>

          <AntonioNote>
            I&apos;ll handle state filing, EIN application, and S-Corp election
            if needed. State fees are billed at cost on top of the formation
            fee — usually $70 to $400 depending on the state.
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

/* ─────────────────────── Other path, Step 2 — Strategic topics ─────────────────────── */

const STRATEGIC_TOPICS = [
  { id: "entity", label: "Entity structure planning", sub: "LLC / S-Corp / partnership trade-offs" },
  { id: "retirement", label: "Retirement contribution strategy", sub: "Solo 401(k), SEP, defined-benefit" },
  { id: "compensation", label: "Reasonable compensation review", sub: "W-2 vs K-1 split for S-Corps" },
  { id: "quarterly", label: "Quarterly estimate planning", sub: "Safe harbor, withholding alignment" },
  { id: "real-estate", label: "Real estate tax strategy", sub: "Depreciation, 1031, professional status" },
  { id: "equity", label: "Equity compensation", sub: "ISO/NSO/RSU timing, 83(b), QSBS" },
  { id: "exit", label: "Exit planning / sale", sub: "Installment, QSBS §1202, asset vs stock" },
  { id: "multi-state", label: "Multi-state residency", sub: "CA to TX/FL/WA planning" },
  { id: "audit-risk", label: "Audit risk review", sub: "Pre-filing health-check of positions" }
];

export function ScreenStrategicTopics() {
  const { strategicTopics, patch, goNext, goPrev } = useIntakeStore();

  const toggle = (id: string) => {
    const set = new Set(strategicTopics);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    patch({ strategicTopics: [...set] });
  };

  return (
    <Screen>
      <IntakeHeader step={2} label="Topics" />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="px-6 pt-7 pb-6">
          <Stack gap={10}>
            <h1
              className="font-serif text-[26px] font-medium leading-[1.15] tracking-[-0.015em] text-portal-ink"
              style={{
                fontVariationSettings: '"opsz" 36',
                fontSynthesis: "none"
              }}>
              What would you like to talk through?
            </h1>
            <Body size={14}>
              Check anything that&apos;s on your mind. I&apos;ll prepare for
              each before our call.
            </Body>
          </Stack>

          <Stack gap={8} className="mt-7">
            {STRATEGIC_TOPICS.map((t) => (
              <CheckRow
                key={t.id}
                value={strategicTopics.includes(t.id)}
                onClick={() => toggle(t.id)}
                label={t.label}
                sub={t.sub}
              />
            ))}
          </Stack>

          <AntonioNote>
            {strategicTopics.length === 0
              ? "Nothing picked yet — that's fine. We'll talk about whatever's most pressing on the call."
              : `${strategicTopics.length} topic${strategicTopics.length > 1 ? "s" : ""} queued up. I'll make sure each one gets real airtime.`}
          </AntonioNote>
        </div>
      </div>

      <BottomBar>
        <Button variant="secondary" onClick={goPrev}>
          Back
        </Button>
        <Button variant="primary" fullWidth onClick={goNext}>
          Continue
        </Button>
      </BottomBar>
    </Screen>
  );
}

/* ─────────────────────── Other path, Step 3 — Contact info ─────────────────────── */

export function ScreenContactInfo() {
  const { consultationContact, patch, goNext, goPrev } = useIntakeStore();

  const set = <K extends keyof typeof consultationContact>(
    key: K,
    value: (typeof consultationContact)[K]
  ) =>
    patch({ consultationContact: { ...consultationContact, [key]: value } });

  return (
    <Screen>
      <IntakeHeader step={3} label="Contact" />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="px-6 pt-7 pb-6">
          <Stack gap={10}>
            <h1
              className="font-serif text-[26px] font-medium leading-[1.15] tracking-[-0.015em] text-portal-ink"
              style={{
                fontVariationSettings: '"opsz" 36',
                fontSynthesis: "none"
              }}>
              When works for you?
            </h1>
            <Body size={14}>
              I&apos;ll follow up with specific times that fit.
            </Body>
          </Stack>

          <Stack gap={16} className="mt-7">
            <div>
              <FieldLabel>Preferred time of day</FieldLabel>
              <Stack gap={8}>
                <OptionRow
                  selected={consultationContact.preferredTime === "morning"}
                  onClick={() => set("preferredTime", "morning")}
                  title="Morning"
                  sub="8 AM – 12 PM PT"
                />
                <OptionRow
                  selected={consultationContact.preferredTime === "afternoon"}
                  onClick={() => set("preferredTime", "afternoon")}
                  title="Afternoon"
                  sub="12 PM – 5 PM PT"
                />
                <OptionRow
                  selected={consultationContact.preferredTime === "evening"}
                  onClick={() => set("preferredTime", "evening")}
                  title="Evening"
                  sub="After 5 PM PT — limited, let me know"
                />
              </Stack>
            </div>

            <div>
              <FieldLabel>Anything I should know before we talk?</FieldLabel>
              <textarea
                value={consultationContact.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Optional — deadlines, specific numbers, previous conversations."
                rows={4}
                className="w-full rounded-[14px] border border-portal-border bg-portal-card px-[18px] py-4 text-[14px] text-portal-ink outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-portal-muted focus:border-forest focus:shadow-[0_0_0_3px_var(--portal-forest-tint)]"
              />
            </div>
          </Stack>
        </div>
      </div>

      <BottomBar>
        <Button variant="secondary" onClick={goPrev}>
          Back
        </Button>
        <Button
          variant="primary"
          fullWidth
          disabled={!consultationContact.preferredTime}
          onClick={goNext}>
          Continue
        </Button>
      </BottomBar>
    </Screen>
  );
}

/* ─────────────────────── Shared ─────────────────────── */

function YesNo({
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

function CheckRow({
  value,
  onClick,
  label,
  sub
}: {
  value: boolean;
  onClick: () => void;
  label: string;
  sub?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex w-full items-start gap-3 rounded-[14px] border px-[18px] py-[14px] text-left transition-[border-color,background-color] duration-150",
        value
          ? "border-forest bg-forest-tint"
          : "border-portal-border bg-portal-card hover:bg-portal-bg-elev"
      ].join(" ")}>
      <span
        className={[
          "mt-[2px] grid size-5 flex-shrink-0 place-items-center rounded-[6px] border transition-colors",
          value
            ? "border-forest bg-forest text-white"
            : "border-portal-border bg-portal-card"
        ].join(" ")}
        aria-hidden>
        {value ? (
          <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
            <path
              d="M4 11 l4 4 l8 -9"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </span>
      <span className="flex min-w-0 flex-col gap-[2px]">
        <span className="text-[14px] font-medium text-portal-ink">{label}</span>
        {sub ? (
          <span className="text-[12.5px] leading-[1.4] text-portal-muted">
            {sub}
          </span>
        ) : null}
      </span>
    </button>
  );
}

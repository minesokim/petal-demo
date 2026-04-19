"use client";

import * as React from "react";
import {
  AvatarSlot,
  Body,
  Button,
  Eyebrow,
  FieldLabel,
  Row,
  Screen,
  Stack,
  TextField
} from "@/components/portal/primitives";
import { Glyph } from "@/components/portal/screens/icons";
import { useIntakeStore } from "@/lib/portal/intake-store";
import type { PortalTab } from "./tab-bar";

/* ─────────────────────── Header primitive for tab screens ─────────────────────── */

function TabScreenHeader({
  title,
  sub,
  right
}: {
  title: string;
  sub?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="sticky top-0 z-10 bg-portal-bg px-6 pt-7 pb-3">
      <Row justify="space-between" align="center">
        <div>
          <h1
            className="font-serif text-[26px] font-medium leading-[1.1] tracking-[-0.015em] text-portal-ink"
            style={{
              fontVariationSettings: '"opsz" 32',
              fontSynthesis: "none"
            }}>
            {title}
          </h1>
          {sub ? (
            <Body size={13} className="mt-1">
              {sub}
            </Body>
          ) : null}
        </div>
        {right}
      </Row>
    </div>
  );
}

/* ─────────────────────── Docs ─────────────────────── */

type ClientDoc = {
  id: string;
  name: string;
  kind: string;
  size: string;
  when: string;
  status: "saved" | "pending" | "review";
};

const MOCK_DOCS: ClientDoc[] = [
  { id: "1", name: "W-2 Acme Corp 2024.pdf", kind: "W-2", size: "64 KB", when: "3 days ago", status: "saved" },
  { id: "2", name: "1099-NEC TikTok.pdf", kind: "1099", size: "89 KB", when: "12 min ago", status: "review" },
  { id: "3", name: "1099-INT Chase.pdf", kind: "1099", size: "41 KB", when: "5 days ago", status: "saved" },
  { id: "4", name: "Q1–Q3 estimates.zip", kind: "DEP", size: "1.2 MB", when: "Mar 10", status: "saved" }
];

export function ScreenDocs() {
  const [q, setQ] = React.useState("");
  const filtered = MOCK_DOCS.filter(
    (d) =>
      d.name.toLowerCase().includes(q.toLowerCase()) ||
      d.kind.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <Screen>
      <div className="flex-1 overflow-y-auto">
        <TabScreenHeader title="Documents" sub="Everything you've uploaded." />

        <div className="px-6 pb-24">
          <div className="relative mb-4">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search documents"
              className="w-full rounded-full border border-portal-border bg-portal-card pr-4 pl-11 py-2.5 text-[14px] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-portal-muted focus:border-forest focus:shadow-[0_0_0_3px_var(--portal-forest-tint)]"
            />
            <svg
              className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-portal-muted"
              viewBox="0 0 20 20"
              fill="none">
              <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M13 13 l4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <Button variant="primary" size="md" fullWidth>
            <Glyph name="upload" className="size-4" />
            Upload more
          </Button>

          <Stack gap={8} className="mt-5">
            {filtered.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-3 rounded-[14px] border border-portal-border bg-portal-card px-4 py-3">
                <span
                  aria-hidden
                  className="grid size-10 flex-shrink-0 place-items-center rounded-[10px] bg-portal-bg-elev font-mono text-[10px] font-semibold uppercase tracking-[0.05em] text-portal-ink-soft">
                  {d.kind}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-medium text-portal-ink">
                    {d.name}
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-portal-muted">
                    {d.size} · {d.when}
                  </div>
                </div>
                <StatusPill status={d.status} />
              </div>
            ))}
            {filtered.length === 0 ? (
              <div className="rounded-[14px] border border-dashed border-portal-border-soft px-4 py-8 text-center">
                <Eyebrow>No matches</Eyebrow>
              </div>
            ) : null}
          </Stack>
        </div>
      </div>
    </Screen>
  );
}

function StatusPill({ status }: { status: ClientDoc["status"] }) {
  const spec = {
    saved: { label: "Saved", cls: "bg-forest-tint text-forest-ink" },
    pending: { label: "Pending", cls: "bg-portal-bg-elev text-portal-muted" },
    review: { label: "Review", cls: "bg-[#F7EDD9] text-[#B87A2F]" }
  }[status];
  return (
    <span
      className={[
        "rounded-full px-2.5 py-1 text-[10.5px] font-medium uppercase tracking-[0.08em]",
        spec.cls
      ].join(" ")}>
      {spec.label}
    </span>
  );
}

/* ─────────────────────── Messages ─────────────────────── */

type Message = {
  id: string;
  from: "antonio" | "me";
  body: string;
  when: string;
};

const MOCK_THREAD: Message[] = [
  {
    id: "m5",
    from: "antonio",
    body: "Got your documents — looks complete. I'll have a draft ready by end of week. Nothing for you to do right now except wait.",
    when: "12 min ago"
  },
  {
    id: "m4",
    from: "me",
    body: "Just uploaded the TikTok 1099.",
    when: "18 min ago"
  },
  {
    id: "m3",
    from: "antonio",
    body: "Perfect. Take your time — no rush from my end.",
    when: "Yesterday"
  },
  {
    id: "m2",
    from: "me",
    body: "Found my Q3 estimate confirmation. Uploading it tonight.",
    when: "Yesterday"
  },
  {
    id: "m1",
    from: "antonio",
    body: "Welcome to Vazant Consulting. Let me know if you hit any snags during intake.",
    when: "Feb 14"
  }
];

export function ScreenMessages() {
  const [draft, setDraft] = React.useState("");
  const [messages, setMessages] = React.useState(MOCK_THREAD);

  const send = () => {
    if (!draft.trim()) return;
    setMessages((prev) => [
      {
        id: `m${Date.now()}`,
        from: "me",
        body: draft.trim(),
        when: "just now"
      },
      ...prev
    ]);
    setDraft("");
  };

  return (
    <Screen>
      <div className="flex flex-1 flex-col overflow-hidden">
        <TabScreenHeader title="Messages" sub="Talk to Antonio any time." />

        <div className="flex-1 overflow-y-auto px-6 pb-4">
          <Stack gap={12}>
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
          </Stack>
        </div>

        <div
          className="border-t border-portal-border bg-portal-card px-4 py-3"
          style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))" }}>
          <Row gap={8} align="end">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write a message"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              className="flex-1 resize-none rounded-[18px] border border-portal-border bg-portal-bg-elev px-4 py-2.5 text-[14px] text-portal-ink outline-none transition-[border-color] duration-150 placeholder:text-portal-muted focus:border-forest"
              style={{ maxHeight: 100 }}
            />
            <Button
              variant="primary"
              size="sm"
              disabled={!draft.trim()}
              onClick={send}
              className="!rounded-full !px-4 !py-2.5">
              Send
            </Button>
          </Row>
        </div>
      </div>
    </Screen>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const mine = message.from === "me";
  return (
    <div className={mine ? "ml-10" : "mr-10"}>
      <div
        className={[
          "rounded-[16px] px-4 py-3 text-[14px] leading-[1.5]",
          mine
            ? "bg-forest text-white"
            : "bg-portal-card border border-portal-border text-portal-ink"
        ].join(" ")}>
        {message.body}
      </div>
      <div
        className={[
          "mt-1 text-[11px] text-portal-muted",
          mine ? "text-right" : "text-left"
        ].join(" ")}>
        {mine ? "You" : "Antonio"} · {message.when}
      </div>
    </div>
  );
}

/* ─────────────────────── Signatures ─────────────────────── */

type SignatureItem = {
  id: string;
  title: string;
  sub: string;
  status: "signed" | "pending" | "locked";
  signedAt?: string;
};

export function ScreenSignatures() {
  const { legal } = useIntakeStore();

  const items: SignatureItem[] = [
    {
      id: "engagement",
      title: "Engagement letter",
      sub: "Scope and terms of our work together",
      status: legal.engagement.signed ? "signed" : "pending",
      signedAt: legal.engagement.signedAt ?? undefined
    },
    {
      id: "7216",
      title: "§7216 consent",
      sub: "Use of your return information for add-on suggestions",
      status: legal.consent7216.signed ? "signed" : "pending",
      signedAt: legal.consent7216.signedAt ?? undefined
    },
    {
      id: "8879",
      title: "Form 8879 (e-file authorization)",
      sub: "Unlocked once your return is prepared and reviewed",
      status: "locked"
    }
  ];

  return (
    <Screen>
      <div className="flex-1 overflow-y-auto">
        <TabScreenHeader
          title="Signatures"
          sub="Every document you've signed or need to sign."
        />

        <div className="px-6 pb-24">
          <Stack gap={10}>
            {items.map((item) => (
              <SignatureRow key={item.id} item={item} />
            ))}
          </Stack>

          <div className="mt-8">
            <Eyebrow>Audit trail</Eyebrow>
            <p className="mt-2 text-[12.5px] leading-[1.5] text-portal-muted">
              Every signature is captured with a timestamp, IP, and a hash
              chain so you and Antonio both have verifiable evidence. You can
              export an audit PDF at any time.
            </p>
            <Button variant="secondary" size="sm" className="mt-3">
              Export audit PDF
            </Button>
          </div>
        </div>
      </div>
    </Screen>
  );
}

function SignatureRow({ item }: { item: SignatureItem }) {
  const signedDate = item.signedAt
    ? new Date(item.signedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
      })
    : null;

  return (
    <div
      className={[
        "flex items-center gap-3.5 rounded-[14px] border px-4 py-3.5 transition-colors",
        item.status === "locked"
          ? "border-portal-border-soft bg-portal-bg-elev"
          : "border-portal-border bg-portal-card"
      ].join(" ")}>
      <span
        className={[
          "grid size-10 flex-shrink-0 place-items-center rounded-xl",
          item.status === "signed"
            ? "bg-forest text-white"
            : item.status === "pending"
              ? "bg-[#F7EDD9] text-[#B87A2F]"
              : "bg-portal-border-soft text-portal-muted"
        ].join(" ")}>
        {item.status === "signed" ? (
          <Glyph name="check" className="size-5" />
        ) : item.status === "locked" ? (
          <Glyph name="lock" className="size-5" />
        ) : (
          <Glyph name="edit" className="size-5" />
        )}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
        <div
          className={[
            "text-[14px] font-medium",
            item.status === "locked" ? "text-portal-muted" : "text-portal-ink"
          ].join(" ")}>
          {item.title}
        </div>
        <div className="text-[12px] text-portal-muted">
          {item.status === "signed" && signedDate
            ? `Signed ${signedDate}`
            : item.sub}
        </div>
      </div>
      {item.status === "pending" ? (
        <Button variant="primary" size="sm">
          Sign
        </Button>
      ) : item.status === "signed" ? (
        <span className="grid size-6 place-items-center rounded-full bg-forest text-white">
          <Glyph name="check" className="size-3.5" />
        </span>
      ) : null}
    </div>
  );
}

/* ─────────────────────── Profile ─────────────────────── */

export function ScreenProfile({ onTab }: { onTab: (t: PortalTab) => void }) {
  const {
    firstName,
    lastName,
    email,
    phone,
    address,
    city,
    state,
    zip,
    reset
  } = useIntakeStore();
  void onTab; // reserved for deep-linking to billing / notifications in a later pass

  return (
    <Screen>
      <div className="flex-1 overflow-y-auto">
        <TabScreenHeader title="Profile" sub="Your information." />

        <div className="px-6 pb-24">
          <Row gap={14} align="center" className="mt-2">
            <div
              className="grid size-16 place-items-center rounded-full bg-forest text-white shadow-[0_4px_16px_rgba(51,94,69,0.2)]"
              style={{
                fontFamily: "var(--font-fraunces), Georgia, serif",
                fontSize: 24,
                fontWeight: 500
              }}>
              {firstName ? firstName[0].toUpperCase() : "?"}
              {lastName ? lastName[0].toUpperCase() : ""}
            </div>
            <div className="min-w-0">
              <div
                className="font-serif text-[18px] font-medium leading-tight text-portal-ink"
                style={{
                  fontVariationSettings: '"opsz" 24',
                  fontSynthesis: "none"
                }}>
                {firstName} {lastName}
              </div>
              <div className="mt-0.5 text-[12.5px] text-portal-muted">
                {email || "—"}
              </div>
            </div>
          </Row>

          <Stack gap={20} className="mt-7">
            <Section label="Contact">
              <InfoRow label="Email" value={email} />
              <InfoRow label="Phone" value={phone} />
            </Section>

            <Section label="Address">
              <InfoRow label="Street" value={address} />
              <InfoRow
                label="City / State / ZIP"
                value={
                  [city, state, zip].filter(Boolean).join(", ") || "—"
                }
              />
            </Section>

            <Section label="Firm">
              <InfoRow label="Preparer" value="Antonio Vazquez, EA" />
              <InfoRow label="Firm" value="Vazant Consulting" />
              <InfoRow label="PTIN on file" value="Yes" />
            </Section>

            <Section label="Security">
              <Button variant="secondary" size="md" fullWidth>
                Change phone number
              </Button>
              <Button variant="secondary" size="md" fullWidth className="mt-2">
                Download my data
              </Button>
            </Section>

            <Section label="Danger zone">
              <Button
                variant="secondary"
                size="md"
                fullWidth
                onClick={() => {
                  if (
                    confirm(
                      "This will clear your portal session and all draft answers. Continue?"
                    )
                  ) {
                    reset();
                  }
                }}>
                Sign out
              </Button>
            </Section>
          </Stack>
        </div>
      </div>
    </Screen>
  );
}

function Section({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="rounded-[14px] border border-portal-border bg-portal-card">
        {children}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-portal-border-soft px-4 py-3 last:border-b-0">
      <span className="text-[12.5px] text-portal-muted">{label}</span>
      <span className="max-w-[55%] truncate text-[13.5px] font-medium text-portal-ink">
        {value || "—"}
      </span>
    </div>
  );
}

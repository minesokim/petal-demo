"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

const c = {
  bg: "#FAFAF8", surface: "#FFFFFF", muted: "#F5F4F0",
  border: "#E8E6E1", borderLight: "#F0EEEA",
  text: "#1A1A18", secondary: "#6B6960", dim: "#9C978C",
  accent: "#2D5A3D", accentLight: "#E8F0EB", accentDark: "#1a3a26",
  warm: "#D4A574", warmLight: "#FBF5EF",
  error: "#C4483E", errorLight: "#FDF0EF",
  blue: "#3B6FA0", blueLight: "#EBF2F8",
};

// ─── Shared Components ───

function AntonioAvatar({ size = 40 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg, ${c.accent} 0%, ${c.accentDark} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: size * 0.35, color: "#fff" }}>A</div>
  );
}

function Btn({ children, onClick, disabled, variant = "primary", style: sx }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; variant?: "primary" | "outline" | "ghost"; style?: React.CSSProperties }) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: disabled ? c.borderLight : c.accent, color: disabled ? c.dim : "#fff", border: "none" },
    outline: { background: "transparent", color: c.secondary, border: `1.5px solid ${c.border}` },
    ghost: { background: "transparent", color: c.secondary, border: "none" },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ width: "100%", padding: "14px 24px", borderRadius: 14, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 600, cursor: disabled ? "default" : "pointer", transition: "all 0.2s ease", ...styles[variant], ...sx }}>{children}</button>
  );
}

function StatusTracker({ steps }: { steps: { label: string; done: boolean; active?: boolean; sub?: string }[] }) {
  return (
    <div>
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        return (
          <div key={step.label} style={{ display: "flex", gap: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: step.done ? c.accent : step.active ? c.accentLight : c.muted, border: step.active ? `2px solid ${c.accent}` : "none", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s ease" }}>
                {step.done ? <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M3 7L5.5 9.5L11 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  : step.active ? <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.accent }} />
                  : <div style={{ width: 6, height: 6, borderRadius: "50%", background: c.border }} />}
              </div>
              {!isLast && <div style={{ width: 2, height: 28, borderRadius: 1, background: step.done ? c.accent : c.borderLight }} />}
            </div>
            <div style={{ paddingBottom: isLast ? 0 : 14, paddingTop: 3 }}>
              <div style={{ fontSize: 13, fontWeight: step.active ? 600 : step.done ? 500 : 400, color: step.active ? c.accent : step.done ? c.text : c.dim }}>{step.label}</div>
              {step.active && step.sub && <div style={{ fontSize: 11, color: c.accent, marginTop: 1 }}>{step.sub}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TabBar({ tab, onTab, badges }: { tab: string; onTab: (t: string) => void; badges?: Record<string, number> }) {
  const tabs = [
    { key: "home", label: "Home", d: "M3 12l9-8 9 8M5 10v8a1 1 0 001 1h3m10-9v8a1 1 0 01-1 1h-3m-4 0v-4a1 1 0 011-1h2a1 1 0 011 1v4" },
    { key: "docs", label: "Docs", d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
    { key: "messages", label: "Messages", d: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
    { key: "sign", label: "Sign", d: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" },
    { key: "profile", label: "Profile", d: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z" },
  ];
  return (
    <div style={{ display: "flex", borderTop: `1px solid ${c.border}`, background: c.surface, flexShrink: 0, paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => onTab(t.key)} style={{ flex: 1, padding: "10px 0 8px", border: "none", background: "transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, position: "relative" }}>
          <div style={{ position: "relative" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={tab === t.key ? c.accent : c.dim} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={t.d} /></svg>
            {badges && badges[t.key] ? (
              <div style={{ position: "absolute", top: -4, right: -8, minWidth: 16, height: 16, borderRadius: 8, background: c.error, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: "#fff" }}>{badges[t.key]}</span>
              </div>
            ) : null}
          </div>
          <span style={{ fontSize: 10, fontWeight: 600, color: tab === t.key ? c.accent : c.dim }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Mock Data ───
const CLIENT = { name: "Maria", fullName: "Maria Gonzalez", email: "maria.gonzalez@email.com", phone: "(626) 555-0188", address: "1842 Oak Valley Dr, Montclair, CA 91763", filing: "Married Filing Jointly", service: "Complex Return", fee: 350, depositPaid: 50 };

const STAGE = "review"; // collecting | preparing | review | pay_sign | filed | complete

const CHECKLIST = [
  { id: "1", label: "W-2 from Riverside Medical", received: true, date: "Mar 24" },
  { id: "2", label: "Driver's License", received: true, date: "Mar 24" },
  { id: "3", label: "1099-NEC (Freelance)", received: true, date: "Mar 25" },
  { id: "4", label: "1099-INT from Chase Bank", received: false },
  { id: "5", label: "Business expense records", received: false },
  { id: "6", label: "Prior year tax return", received: true, date: "Mar 26" },
  { id: "7", label: "Spouse W-2 from Tech Corp", received: true, date: "Mar 27" },
];

const STAGE_QUOTES: Record<string, string> = {
  collecting: "I'm waiting on a few more documents from you. Upload them in the Docs tab and we'll get started!",
  preparing: "I'm working on your return now. I'll let you know as soon as it's ready for your review.",
  review: "I've finished your return and it looks great. Take a look when you get a chance. No rush — but the sooner we sign, the sooner it's filed.",
  pay_sign: "Almost there! Just need your payment and signature and we'll file.",
  filed: "Your return has been filed with the IRS! I'll let you know when it's accepted.",
  complete: "All done for 2025! If you need anything else — bookkeeping, estimated taxes, or just a question — I'm here.",
};

// ═══ MAIN COMPONENT ═══
export default function ClientPortalDirect() {
  const router = useRouter();
  const [tab, setTab] = useState("home");
  const [chatInput, setChatInput] = useState("");
  const [chatMsgs, setChatMsgs] = useState<{ from: string; text: string; time: string; type?: string }[]>([
    { from: "antonio", text: "Hi Maria! Got your documents — starting my review. I'll reach out if I have questions.", time: "10:02 AM" },
    { from: "system", text: "Return Status: Your return is being prepared. 5 of 7 documents received.", time: "", type: "status" },
    { from: "antonio", text: "Your return is ready for review! Take a look at the numbers and let me know if anything looks off.", time: "Yesterday, 4:15 PM" },
  ]);
  const [uploadedIds, setUploadedIds] = useState<string[]>([]);
  const [paid, setPaid] = useState(false);
  const [signed, setSigned] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showSigning, setShowSigning] = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({ name: CLIENT.fullName, email: CLIENT.email, phone: CLIENT.phone, address: CLIENT.address });
  const [showCalendarAdded, setShowCalendarAdded] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [showSignOut, setShowSignOut] = useState(false);
  const [attachmentName, setAttachmentName] = useState("");
  const [unreadMsgs, setUnreadMsgs] = useState(1);
  const [rescheduleDay, setRescheduleDay] = useState("Mon, Apr 6");
  const [rescheduleTime, setRescheduleTime] = useState("9:00 AM");
  const [rescheduled, setRescheduled] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMsgs]);

  const received = CHECKLIST.filter(d => d.received || uploadedIds.includes(d.id)).length;
  const total = CHECKLIST.length;
  const allDocsIn = received >= total;

  const currentStage = signed ? "filed" : paid ? "pay_sign" : STAGE;
  const quote = STAGE_QUOTES[currentStage] || STAGE_QUOTES.review;

  const primaryAction = !allDocsIn ? "upload" : !paid ? "pay" : !signed ? "sign" : "done";

  // Badge counts
  const missingDocs = total - received;
  const badges: Record<string, number> = {};
  if (missingDocs > 0) badges.docs = missingDocs;
  if (unreadMsgs > 0 && tab !== "messages") badges.messages = unreadMsgs;
  if (!signed && paid) badges.sign = 1;

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim().toLowerCase();
    setChatMsgs(p => [...p, { from: "client", text: chatInput.trim(), time: "Now" }]);
    setChatInput("");
    const checks = [
      { kw: ["appointment", "meeting", "schedule", "call", "when"], resp: "Your appointment: Mon, Apr 6 at 9:00 AM — Phone call with Antonio." },
      { kw: ["document", "need", "missing", "upload"], resp: `Documents: ${received} of ${total} received. Check the Docs tab to see what's still needed.` },
      { kw: ["status", "where", "progress", "return", "update"], resp: `Your return status: ${currentStage === "review" ? "Ready for Your Review" : currentStage === "pay_sign" ? "Pay & Sign" : currentStage === "filed" ? "Filed with IRS" : "In Progress"}.` },
      { kw: ["pay", "cost", "fee", "balance", "owe", "invoice"], resp: paid ? "You're all paid up! $350 total — $50 deposit + $300 balance." : `Payment: $50 deposit paid. Remaining balance: $300. Tap "Pay $300" on the Home tab.` },
    ];
    const match = checks.find(ch => ch.kw.some(k => msg.includes(k)));
    setTimeout(() => {
      setChatMsgs(p => [...p, { from: "system", text: match ? match.resp : "Message sent to Antonio. He usually responds within a few hours.", time: "" }]);
    }, 700);
  };

  const handleChatAttachment = () => {
    chatFileRef.current?.click();
  };

  const onChatFileChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setChatMsgs(p => [...p, { from: "client", text: `[Attached: ${file.name}]`, time: "Now" }]);
    setTimeout(() => {
      setChatMsgs(p => [...p, { from: "system", text: `Attachment received: ${file.name}. Antonio will review it shortly.`, time: "", type: "doc" }]);
    }, 500);
    e.target.value = "";
  };

  // ═══ SIGN OUT CONFIRMATION ═══
  if (showSignOut) {
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: c.bg, maxWidth: 480, margin: "0 auto", justifyContent: "center", alignItems: "center", padding: 32 }}>
        <div style={{ background: c.surface, borderRadius: 20, border: `1px solid ${c.borderLight}`, padding: "32px 28px", textAlign: "center", maxWidth: 340, width: "100%" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: c.errorLight, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c.error} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, fontFamily: "'Fraunces', serif", color: c.text, marginBottom: 8 }}>Sign out?</div>
          <p style={{ fontSize: 13, color: c.secondary, lineHeight: 1.6, marginBottom: 24 }}>You&apos;ll need to sign back in to access your tax return, documents, and messages.</p>
          <Btn onClick={() => router.push("/portal")} style={{ marginBottom: 10, background: c.error }}>Sign out</Btn>
          <Btn variant="outline" onClick={() => setShowSignOut(false)}>Cancel</Btn>
        </div>
      </div>
    );
  }

  // ═══ RESCHEDULE OVERLAY ═══
  if (showReschedule) {
    const times = ["9:00 AM", "10:30 AM", "1:00 PM", "2:30 PM", "4:00 PM"];
    const days = ["Mon, Apr 6", "Tue, Apr 7", "Wed, Apr 8", "Thu, Apr 9", "Fri, Apr 10"];
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: c.bg, maxWidth: 480, margin: "0 auto" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${c.border}`, background: c.surface, display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => { setShowReschedule(false); setRescheduled(false); }} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${c.border}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke={c.secondary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div style={{ fontSize: 15, fontWeight: 600, color: c.text }}>Reschedule Appointment</div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px" }}>
          {rescheduled ? (
            <div style={{ textAlign: "center", paddingTop: 40 }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: c.accentLight, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <svg width="28" height="28" viewBox="0 0 14 14" fill="none"><path d="M3 7L5.5 9.5L11 4" stroke={c.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, fontFamily: "'Fraunces', serif", color: c.text, marginBottom: 8 }}>Rescheduled!</div>
              <p style={{ fontSize: 13, color: c.secondary }}>Your appointment is now {rescheduleDay} at {rescheduleTime}. Antonio has been notified.</p>
              <Btn onClick={() => { setShowReschedule(false); setRescheduled(false); }} style={{ marginTop: 24 }}>Done</Btn>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: c.dim, marginBottom: 10 }}>SELECT A DAY</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                {days.map(d => (
                  <button key={d} onClick={() => setRescheduleDay(d)} style={{ padding: "10px 16px", borderRadius: 10, border: `1.5px solid ${rescheduleDay === d ? c.accent : c.border}`, background: rescheduleDay === d ? c.accentLight : c.surface, color: rescheduleDay === d ? c.accent : c.text, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{d}</button>
                ))}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: c.dim, marginBottom: 10 }}>SELECT A TIME</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
                {times.map(t => (
                  <button key={t} onClick={() => setRescheduleTime(t)} style={{ padding: "10px 16px", borderRadius: 10, border: `1.5px solid ${rescheduleTime === t ? c.accent : c.border}`, background: rescheduleTime === t ? c.accentLight : c.surface, color: rescheduleTime === t ? c.accent : c.text, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{t}</button>
                ))}
              </div>
              <Btn onClick={() => {
                setRescheduled(true);
                setChatMsgs(p => [...p, { from: "system", text: `Appointment rescheduled: ${rescheduleDay} at ${rescheduleTime}. Antonio has been notified.`, time: "", type: "status" }]);
              }}>Confirm Reschedule</Btn>
            </>
          )}
        </div>
      </div>
    );
  }

  // ═══ PAYMENT OVERLAY ═══
  if (showPayment) {
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: c.bg, maxWidth: 480, margin: "0 auto" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${c.border}`, background: c.surface, display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setShowPayment(false)} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${c.border}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke={c.secondary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div style={{ fontSize: 15, fontWeight: 600, color: c.text }}>Pay Remaining Balance</div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px" }}>
          <div style={{ background: c.surface, borderRadius: 16, border: `1px solid ${c.borderLight}`, padding: "20px", marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: c.dim, marginBottom: 12 }}>PAYMENT SUMMARY</div>
            {[
              { label: "Service", value: `${CLIENT.service}` },
              { label: "Total fee", value: `$${CLIENT.fee}` },
              { label: "Deposit paid", value: `-$${CLIENT.depositPaid}`, color: c.accent },
            ].map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: i ? `1px solid ${c.borderLight}` : "none" }}>
                <span style={{ fontSize: 13, color: c.secondary }}>{r.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: r.color || c.text }}>{r.value}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0", borderTop: `1px solid ${c.border}`, marginTop: 4 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: c.text }}>Amount due</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: c.accent }}>$300.00</span>
            </div>
          </div>

          <div style={{ background: c.surface, borderRadius: 16, border: `1px solid ${c.borderLight}`, padding: "20px", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <svg width="20" height="14" viewBox="0 0 20 14" fill="none"><rect x=".5" y=".5" width="19" height="13" rx="2.5" stroke={c.accent} fill={c.accentLight} /><rect y="4" width="20" height="3" fill={c.accent} /></svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: c.text }}>Card Payment</span>
              <span style={{ fontSize: 11, color: c.dim, marginLeft: "auto" }}>Powered by Stripe</span>
            </div>
            {[{ l: "Cardholder name", p: "Maria Gonzalez" }, { l: "Card number", p: "4242 4242 4242 4242" }].map(f => (
              <div key={f.l} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: c.secondary, display: "block", marginBottom: 5 }}>{f.l}</label>
                <input defaultValue={f.p} style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${c.border}`, background: c.surface, fontSize: 14, color: c.text, outline: "none", fontFamily: "'Plus Jakarta Sans', sans-serif", boxSizing: "border-box" }} />
              </div>
            ))}
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}><label style={{ fontSize: 12, fontWeight: 600, color: c.secondary, display: "block", marginBottom: 5 }}>Expiry</label><input defaultValue="03/27" style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${c.border}`, fontSize: 14, color: c.text, outline: "none", boxSizing: "border-box" }} /></div>
              <div style={{ flex: 1 }}><label style={{ fontSize: 12, fontWeight: 600, color: c.secondary, display: "block", marginBottom: 5 }}>CVC</label><input defaultValue="123" style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${c.border}`, fontSize: 14, color: c.text, outline: "none", boxSizing: "border-box" }} /></div>
            </div>
          </div>

          <Btn onClick={() => { setPaid(true); setShowPayment(false); setChatMsgs(p => [...p, { from: "system", text: "Payment Received: $300.00. Thank you, Maria! Your Form 8879 is now ready to sign.", time: "", type: "payment" }]); }}>
            Pay $300.00
          </Btn>
        </div>
      </div>
    );
  }

  // ═══ SIGNING OVERLAY ═══
  if (showSigning) {
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: c.bg, maxWidth: 480, margin: "0 auto" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${c.border}`, background: c.surface, display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setShowSigning(false)} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${c.border}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke={c.secondary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div style={{ fontSize: 15, fontWeight: 600, color: c.text }}>Sign Form 8879</div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px" }}>
          <div style={{ background: c.surface, borderRadius: 16, border: `1px solid ${c.borderLight}`, padding: "20px", marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: c.dim, marginBottom: 12 }}>YOUR 2025 RETURN SUMMARY</div>
            {[
              { label: "Filing status", value: CLIENT.filing },
              { label: "Total income", value: "$87,420" },
              { label: "Adjusted gross income", value: "$79,180" },
              { label: "Total deductions", value: "$28,400" },
              { label: "Tax owed", value: "$8,230" },
              { label: "Tax withheld", value: "$10,570" },
            ].map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: i ? `1px solid ${c.borderLight}` : "none" }}>
                <span style={{ fontSize: 13, color: c.secondary }}>{r.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{r.value}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0", borderTop: `1px solid ${c.accent}40`, marginTop: 4 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: c.accent }}>Refund</span>
              <span style={{ fontSize: 22, fontWeight: 700, color: c.accent, fontFamily: "'Fraunces', serif" }}>$2,340</span>
            </div>
          </div>

          <p style={{ fontSize: 13, color: c.secondary, lineHeight: 1.7, marginBottom: 20 }}>
            By signing below, you authorize Antonio Vazquez, EA to electronically file your 2025 federal tax return with the IRS.
          </p>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: c.dim, marginBottom: 6 }}>Your Signature</div>
            <canvas id="sig-cp" width={680} height={240}
              onMouseDown={(e) => { const cv = e.currentTarget, ctx = cv.getContext("2d"); if (!ctx) return; const r = cv.getBoundingClientRect(); ctx.beginPath(); ctx.moveTo((e.clientX-r.left)*(cv.width/r.width),(e.clientY-r.top)*(cv.height/r.height)); const draw=(ev:MouseEvent)=>{ctx.lineWidth=2.5;ctx.lineCap="round";ctx.strokeStyle=c.accent;ctx.lineTo((ev.clientX-r.left)*(cv.width/r.width),(ev.clientY-r.top)*(cv.height/r.height));ctx.stroke();}; const stop=()=>{document.removeEventListener("mousemove",draw);document.removeEventListener("mouseup",stop);}; document.addEventListener("mousemove",draw);document.addEventListener("mouseup",stop); }}
              onTouchStart={(e) => { e.preventDefault(); const cv = e.currentTarget, ctx = cv.getContext("2d"); if (!ctx) return; const r = cv.getBoundingClientRect(), t = e.touches[0]; ctx.beginPath(); ctx.moveTo((t.clientX-r.left)*(cv.width/r.width),(t.clientY-r.top)*(cv.height/r.height)); const draw=(ev:TouchEvent)=>{ev.preventDefault();const t2=ev.touches[0];ctx.lineWidth=2.5;ctx.lineCap="round";ctx.strokeStyle=c.accent;ctx.lineTo((t2.clientX-r.left)*(cv.width/r.width),(t2.clientY-r.top)*(cv.height/r.height));ctx.stroke();}; const stop=()=>{cv.removeEventListener("touchmove",draw);cv.removeEventListener("touchend",stop);}; cv.addEventListener("touchmove",draw,{passive:false});cv.addEventListener("touchend",stop); }}
              style={{ width: "100%", height: 120, borderRadius: 12, border: `2px dashed ${c.border}`, background: c.bg, cursor: "crosshair", touchAction: "none" }}
            />
            <button onClick={() => { const cv = document.getElementById("sig-cp") as HTMLCanvasElement; cv?.getContext("2d")?.clearRect(0,0,cv.width,cv.height); }} style={{ marginTop: 8, padding: "6px 14px", borderRadius: 8, border: `1px solid ${c.border}`, background: "transparent", color: c.secondary, fontSize: 12, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Clear</button>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: c.dim, marginBottom: 6 }}>Spouse Signature (James Gonzalez)</div>
            <canvas id="sig-spouse" width={680} height={240}
              onMouseDown={(e) => { const cv = e.currentTarget, ctx = cv.getContext("2d"); if (!ctx) return; const r = cv.getBoundingClientRect(); ctx.beginPath(); ctx.moveTo((e.clientX-r.left)*(cv.width/r.width),(e.clientY-r.top)*(cv.height/r.height)); const draw=(ev:MouseEvent)=>{ctx.lineWidth=2.5;ctx.lineCap="round";ctx.strokeStyle=c.accent;ctx.lineTo((ev.clientX-r.left)*(cv.width/r.width),(ev.clientY-r.top)*(cv.height/r.height));ctx.stroke();}; const stop=()=>{document.removeEventListener("mousemove",draw);document.removeEventListener("mouseup",stop);}; document.addEventListener("mousemove",draw);document.addEventListener("mouseup",stop); }}
              onTouchStart={(e) => { e.preventDefault(); const cv = e.currentTarget, ctx = cv.getContext("2d"); if (!ctx) return; const r = cv.getBoundingClientRect(), t = e.touches[0]; ctx.beginPath(); ctx.moveTo((t.clientX-r.left)*(cv.width/r.width),(t.clientY-r.top)*(cv.height/r.height)); const draw=(ev:TouchEvent)=>{ev.preventDefault();const t2=ev.touches[0];ctx.lineWidth=2.5;ctx.lineCap="round";ctx.strokeStyle=c.accent;ctx.lineTo((t2.clientX-r.left)*(cv.width/r.width),(t2.clientY-r.top)*(cv.height/r.height));ctx.stroke();}; const stop=()=>{cv.removeEventListener("touchmove",draw);cv.removeEventListener("touchend",stop);}; cv.addEventListener("touchmove",draw,{passive:false});cv.addEventListener("touchend",stop); }}
              style={{ width: "100%", height: 120, borderRadius: 12, border: `2px dashed ${c.border}`, background: c.bg, cursor: "crosshair", touchAction: "none" }}
            />
            <button onClick={() => { const cv = document.getElementById("sig-spouse") as HTMLCanvasElement; cv?.getContext("2d")?.clearRect(0,0,cv.width,cv.height); }} style={{ marginTop: 8, padding: "6px 14px", borderRadius: 8, border: `1px solid ${c.border}`, background: "transparent", color: c.secondary, fontSize: 12, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Clear</button>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: c.dim, marginBottom: 6 }}>Date</div>
            <div style={{ padding: "12px 16px", borderRadius: 10, background: c.accentLight, border: `1.5px solid ${c.accent}`, fontSize: 13, fontWeight: 600, color: c.accent }}>March 30, 2026</div>
          </div>

          <Btn onClick={() => { setSigned(true); setShowSigning(false); setChatMsgs(p => [...p, { from: "system", text: "Form 8879 signed! Antonio will countersign and file your return within 24 hours.", time: "", type: "signature" }]); }}>
            Sign & Authorize Filing
          </Btn>
        </div>
      </div>
    );
  }

  // ═══ RETURN REVIEW OVERLAY ═══
  if (showReturn) {
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: c.bg, maxWidth: 480, margin: "0 auto" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${c.border}`, background: c.surface, display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setShowReturn(false)} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${c.border}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke={c.secondary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div style={{ fontSize: 15, fontWeight: 600, color: c.text }}>Your 2025 Tax Return</div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px" }}>
          <div style={{ background: c.accentLight, borderRadius: 16, padding: "20px", textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: c.accent, marginBottom: 4 }}>ESTIMATED REFUND</div>
            <div style={{ fontSize: 36, fontWeight: 700, color: c.accent, fontFamily: "'Fraunces', serif" }}>$2,340</div>
            <div style={{ fontSize: 12, color: c.secondary, marginTop: 4 }}>Direct deposit to Chase ****4521</div>
          </div>

          <div style={{ background: c.surface, borderRadius: 16, border: `1px solid ${c.borderLight}`, padding: "20px", marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: c.dim, marginBottom: 12 }}>RETURN DETAILS</div>
            {[
              { label: "Filing status", value: "Married Filing Jointly" },
              { label: "Wages (W-2)", value: "$72,000" },
              { label: "Self-employment income", value: "$15,420" },
              { label: "Adjusted gross income", value: "$79,180" },
              { label: "Standard deduction", value: "$28,400" },
              { label: "Taxable income", value: "$50,780" },
              { label: "Total tax", value: "$8,230" },
              { label: "Withholding + payments", value: "$10,570" },
            ].map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: i ? `1px solid ${c.borderLight}` : "none" }}>
                <span style={{ fontSize: 13, color: c.secondary }}>{r.label}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: c.text }}>{r.value}</span>
              </div>
            ))}
          </div>

          {/* Mock PDF preview */}
          <div style={{ background: c.surface, borderRadius: 16, border: `1px solid ${c.borderLight}`, padding: "20px", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.error} strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: c.text }}>2025_Federal_Return.pdf</span>
            </div>
            <div style={{ background: c.muted, borderRadius: 10, padding: "40px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: c.dim, marginBottom: 4 }}>FORM 1040 — U.S. INDIVIDUAL INCOME TAX RETURN</div>
              <div style={{ fontSize: 10, color: c.dim }}>Department of the Treasury — Internal Revenue Service</div>
              <div style={{ fontSize: 10, color: c.dim, marginTop: 12 }}>Maria & James Gonzalez</div>
              <div style={{ fontSize: 10, color: c.dim }}>Tax Year 2025 — Page 1 of 4</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <Btn variant="outline" style={{ flex: 1 }} onClick={() => { setShowReturn(false); setTab("messages"); }}>I have questions</Btn>
            <Btn style={{ flex: 1 }} onClick={() => setShowReturn(false)}>Looks good</Btn>
          </div>
        </div>
      </div>
    );
  }

  // ═══ MAIN PORTAL ═══
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: c.bg, maxWidth: 480, margin: "0 auto" }}>
      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx,.xlsx,.csv" style={{ display: "none" }} onChange={(e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAttachmentName(file.name);
        // Find first missing doc and mark it uploaded
        const missing = CHECKLIST.find(d => !d.received && !uploadedIds.includes(d.id));
        if (missing) {
          setUploadedIds(p => [...p, missing.id]);
          setChatMsgs(p => [...p, { from: "system", text: `Document received: ${missing.label}. Antonio will review it shortly.`, time: "", type: "doc" }]);
        }
        e.target.value = "";
      }} />
      <input ref={chatFileRef} type="file" accept="image/*,.pdf,.doc,.docx" style={{ display: "none" }} onChange={onChatFileChosen} />

      <div style={{ flex: 1, overflowY: tab === "messages" ? "hidden" : "auto", display: "flex", flexDirection: "column" }}>

        {/* ═══ HOME TAB ═══ */}
        {tab === "home" && (
          <div style={{ padding: "24px 20px 32px" }}>
            <div style={{ fontSize: 14, color: c.dim, marginBottom: 4 }}>Good morning,</div>
            <div style={{ fontSize: 24, fontFamily: "'Fraunces', serif", fontWeight: 600, color: c.text, marginBottom: 20 }}>{CLIENT.name}</div>

            {/* Status banner */}
            <div style={{ background: `linear-gradient(135deg, ${c.accent} 0%, ${c.accentDark} 100%)`, borderRadius: 18, padding: "20px 22px", marginBottom: 20, color: "#fff" }}>
              <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 2 }}>2025 TAX RETURN</div>
              <div style={{ fontSize: 17, fontWeight: 600, fontFamily: "'Fraunces', serif" }}>
                {signed ? "Filed with IRS" : paid ? "Ready to Sign" : "Ready for Your Review"}
              </div>
              <div style={{ height: 4, borderRadius: 4, background: "rgba(255,255,255,0.15)", marginTop: 12 }}>
                <div style={{ width: signed ? "100%" : paid ? "85%" : "70%", height: "100%", borderRadius: 4, background: "#6ECB8B", transition: "width 0.5s ease" }} />
              </div>
            </div>

            {/* Return review (when in review stage) */}
            {!paid && !signed && (
              <div style={{ background: c.surface, borderRadius: 16, border: `1px solid ${c.borderLight}`, padding: "18px 20px", marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: c.accent, marginBottom: 6 }}>YOUR RETURN IS READY</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 13, color: c.secondary }}>Estimated refund</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: c.accent, fontFamily: "'Fraunces', serif" }}>$2,340</div>
                  </div>
                  <button onClick={() => setShowReturn(true)} style={{ padding: "8px 16px", borderRadius: 10, border: `1px solid ${c.border}`, background: "transparent", color: c.secondary, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>View details</button>
                </div>
              </div>
            )}

            {/* Filed celebration */}
            {signed && (
              <div style={{ background: c.accentLight, borderRadius: 16, padding: "20px", textAlign: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>&#127881;</div>
                <div style={{ fontSize: 16, fontWeight: 600, fontFamily: "'Fraunces', serif", color: c.accent, marginBottom: 4 }}>Your return has been filed!</div>
                <div style={{ fontSize: 13, color: c.secondary }}>Estimated refund: $2,340 via direct deposit</div>
                <div style={{ fontSize: 12, color: c.dim, marginTop: 8 }}>IRS acceptance expected within 24-48 hours</div>
              </div>
            )}

            {/* PRIMARY ACTION — one at a time */}
            {!signed && (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: c.dim, marginBottom: 10 }}>NEXT STEP</div>

                {!paid && (
                  <div onClick={() => setShowPayment(true)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderRadius: 14, marginBottom: 8, background: c.surface, border: `1.5px solid ${c.warm}`, cursor: "pointer" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: c.warmLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: "#9A7245" }}>$</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: c.text }}>Pay remaining balance</div>
                      <div style={{ fontSize: 12, color: c.dim }}>$300.00 due — required before signing</div>
                    </div>
                    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: c.warmLight, color: "#9A7245" }}>Required</span>
                  </div>
                )}

                {paid && (
                  <div onClick={() => setShowSigning(true)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderRadius: 14, marginBottom: 8, background: c.surface, border: `1.5px solid ${c.accent}`, cursor: "pointer" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: c.accentLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: c.text }}>Sign Form 8879</div>
                      <div style={{ fontSize: 12, color: c.dim }}>Authorize Antonio to e-file your return</div>
                    </div>
                    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: c.accentLight, color: c.accent }}>Ready</span>
                  </div>
                )}

                {/* Grey out sign if not paid */}
                {!paid && (
                  <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderRadius: 14, marginBottom: 8, background: c.muted, opacity: 0.5 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: c.borderLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.dim} strokeWidth="1.5"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: c.dim }}>Sign Form 8879</div>
                      <div style={{ fontSize: 12, color: c.dim }}>Available after payment</div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Payment confirmation if paid */}
            {paid && !signed && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, marginBottom: 8, background: c.accentLight, border: `1px solid ${c.accent}20` }}>
                <svg width="16" height="16" viewBox="0 0 14 14" fill="none"><path d="M3 7L5.5 9.5L11 4" stroke={c.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span style={{ fontSize: 13, color: c.accent, fontWeight: 500 }}>Payment received — $300.00. Thank you!</span>
              </div>
            )}

            {/* Appointment */}
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: c.dim, marginTop: 24, marginBottom: 10 }}>UPCOMING</div>
            <div style={{ padding: "16px 18px", borderRadius: 14, background: c.surface, border: `1px solid ${c.borderLight}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: c.accentLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                </div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600, color: c.text }}>Meeting with Antonio</div><div style={{ fontSize: 12, color: c.dim }}>Mon, Apr 6 · 9:00 AM · Phone</div></div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setShowCalendarAdded(true); setTimeout(() => setShowCalendarAdded(false), 2000); }} style={{ flex: 1, padding: "9px 12px", borderRadius: 10, border: `1px solid ${c.border}`, background: showCalendarAdded ? c.accentLight : "transparent", color: showCalendarAdded ? c.accent : c.secondary, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.2s" }}>
                  {showCalendarAdded ? "Added!" : "Add to calendar"}
                </button>
                <button onClick={() => setShowReschedule(true)} style={{ flex: 1, padding: "9px 12px", borderRadius: 10, border: `1px solid ${c.border}`, background: "transparent", color: c.secondary, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Reschedule
                </button>
              </div>
            </div>

            {/* Progress tracker */}
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: c.dim, marginTop: 24, marginBottom: 14 }}>RETURN PROGRESS</div>
            <div style={{ background: c.surface, border: `1px solid ${c.borderLight}`, borderRadius: 16, padding: "20px 18px" }}>
              <StatusTracker steps={[
                { label: "Intake Complete", done: true },
                { label: "Documents", done: allDocsIn, active: !allDocsIn, sub: !allDocsIn ? `${received} of ${total} received` : undefined },
                { label: "Being Prepared", done: true },
                { label: "Ready for Your Review", done: paid, active: !paid && !signed },
                { label: "Pay & Sign", done: signed, active: paid && !signed },
                { label: "Filed with IRS", done: signed, active: false },
                { label: "Complete", done: false },
              ]} />
            </div>

            {/* Antonio quote */}
            <div style={{ display: "flex", gap: 12, padding: "14px 16px", marginTop: 20, background: c.warmLight, borderRadius: 14, alignItems: "flex-start" }}>
              <AntonioAvatar size={32} />
              <p style={{ fontSize: 13, color: "#7A5C35", lineHeight: 1.7, fontStyle: "italic", margin: 0 }}>&ldquo;{quote}&rdquo;</p>
            </div>
          </div>
        )}

        {/* ═══ DOCS TAB ═══ */}
        {tab === "docs" && (
          <div style={{ padding: "24px 20px 32px" }}>
            <h2 style={{ fontSize: 22, fontFamily: "'Fraunces', serif", fontWeight: 600, color: c.text, margin: "0 0 4px" }}>Documents</h2>
            <p style={{ fontSize: 13, color: c.dim, margin: "0 0 20px" }}>{received} of {total} received</p>

            {/* Upload zone */}
            <label style={{ display: "block", padding: "20px 16px", borderRadius: 16, border: `2px dashed ${c.accent}40`, background: c.accentLight + "40", textAlign: "center", marginBottom: 20, cursor: "pointer" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 8px", display: "block" }}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
              <div style={{ fontSize: 14, fontWeight: 600, color: c.accent }}>Upload a document</div>
              <div style={{ fontSize: 12, color: c.dim, marginTop: 2 }}>Tap to choose a file or take a photo</div>
              <input type="file" accept="image/*,.pdf,.doc,.docx" style={{ display: "none" }} onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const missing = CHECKLIST.find(d => !d.received && !uploadedIds.includes(d.id));
                if (missing) {
                  setUploadedIds(p => [...p, missing.id]);
                  setChatMsgs(p => [...p, { from: "system", text: `Document received: ${missing.label}. Antonio will review it shortly.`, time: "", type: "doc" }]);
                }
                e.target.value = "";
              }} />
            </label>

            {/* Checklist */}
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: c.dim, marginBottom: 10 }}>DOCUMENT CHECKLIST</div>
            {CHECKLIST.map(doc => {
              const isReceived = doc.received || uploadedIds.includes(doc.id);
              return (
                <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 14, marginBottom: 6, background: c.surface, border: `1px solid ${isReceived ? c.accent + "30" : c.borderLight}` }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: isReceived ? c.accentLight : c.muted, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {isReceived ? (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7L5.5 9.5L11 4" stroke={c.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    ) : (
                      <div style={{ width: 12, height: 12, borderRadius: "50%", border: `2px solid ${c.border}` }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: isReceived ? c.text : c.secondary }}>{doc.label}</div>
                    {isReceived && doc.date && <div style={{ fontSize: 11, color: c.dim, marginTop: 1 }}>Received {doc.date}</div>}
                    {isReceived && uploadedIds.includes(doc.id) && <div style={{ fontSize: 11, color: c.accent, marginTop: 1 }}>Just uploaded</div>}
                  </div>
                  {!isReceived && (
                    <button onClick={() => { setUploadedIds(p => [...p, doc.id]); setChatMsgs(p => [...p, { from: "system", text: `Document received: ${doc.label}. Antonio will review it shortly.`, time: "", type: "doc" }]); }} style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${c.accent}`, background: "transparent", color: c.accent, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Upload
                    </button>
                  )}
                </div>
              );
            })}

            {/* Uploaded history */}
            {uploadedIds.length > 0 && (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: c.dim, marginTop: 20, marginBottom: 10 }}>RECENTLY UPLOADED</div>
                {uploadedIds.map(id => {
                  const doc = CHECKLIST.find(d => d.id === id);
                  return doc ? (
                    <div key={id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, marginBottom: 4, background: c.accentLight + "60" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c.accent} strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      <span style={{ fontSize: 12, color: c.accent, fontWeight: 500 }}>{doc.label}</span>
                      <span style={{ fontSize: 11, color: c.dim, marginLeft: "auto" }}>Just now</span>
                    </div>
                  ) : null;
                })}
              </>
            )}
          </div>
        )}

        {/* ═══ MESSAGES TAB ═══ */}
        {tab === "messages" && (
          <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "14px 20px", borderBottom: `1px solid ${c.borderLight}`, display: "flex", alignItems: "center", gap: 12, background: c.surface, flexShrink: 0 }}>
              <div style={{ position: "relative" }}><AntonioAvatar size={38} /><div style={{ position: "absolute", bottom: -1, right: -1, width: 10, height: 10, borderRadius: "50%", background: "#5CB176", border: `2px solid ${c.surface}` }} /></div>
              <div><div style={{ fontSize: 15, fontWeight: 600, color: c.text }}>Antonio Vazquez</div><div style={{ fontSize: 11, color: c.dim }}>Usually responds within a few hours</div></div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px", display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Date separator */}
              <div style={{ textAlign: "center", padding: "8px 0" }}>
                <span style={{ fontSize: 11, color: c.dim, background: c.bg, padding: "4px 12px", borderRadius: 20 }}>Today</span>
              </div>
              {chatMsgs.map((m, i) => {
                if (m.from === "system") return (
                  <div key={i} style={{ alignSelf: "center", padding: "10px 16px", borderRadius: 12, background: m.type === "payment" ? c.accentLight : m.type === "signature" ? c.accentLight : m.type === "doc" ? c.accentLight : c.muted, maxWidth: "90%", border: m.type ? `1px solid ${c.accent}20` : "none" }}>
                    <p style={{ fontSize: 12, color: m.type ? c.accent : c.secondary, lineHeight: 1.6, margin: 0, textAlign: "center", fontWeight: m.type ? 500 : 400 }}>{m.text}</p>
                  </div>
                );
                const isClient = m.from === "client";
                return (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-end", flexDirection: isClient ? "row-reverse" : "row" }}>
                    {!isClient && <AntonioAvatar size={30} />}
                    <div style={{ padding: "12px 16px", borderRadius: isClient ? "16px 4px 16px 16px" : "4px 16px 16px 16px", background: isClient ? c.accent : c.surface, border: isClient ? "none" : `1px solid ${c.borderLight}`, maxWidth: "78%" }}>
                      <p style={{ fontSize: 13, color: isClient ? "#fff" : c.text, lineHeight: 1.6, margin: 0 }}>{m.text}</p>
                      {m.time && <div style={{ fontSize: 10, color: isClient ? "rgba(255,255,255,0.5)" : c.dim, marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
                        {m.time}
                        {isClient && <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M3 7L5.5 9.5L11 4" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>}
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>
            <div style={{ flexShrink: 0, padding: "10px 16px 14px", borderTop: `1px solid ${c.borderLight}`, background: c.surface }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={handleChatAttachment} style={{ width: 40, height: 40, borderRadius: 10, border: `1px solid ${c.borderLight}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: c.dim }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" /></svg>
                </button>
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat()} placeholder="Message Antonio..." style={{ flex: 1, padding: "11px 16px", borderRadius: 12, border: `1.5px solid ${c.borderLight}`, background: c.bg, fontSize: 14, color: c.text, outline: "none", fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
                <button onClick={sendChat} disabled={!chatInput.trim()} style={{ width: 40, height: 40, borderRadius: 10, border: "none", background: chatInput.trim() ? c.accent : c.borderLight, color: chatInput.trim() ? "#fff" : c.dim, cursor: chatInput.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ SIGN TAB ═══ */}
        {tab === "sign" && (
          <div style={{ padding: "24px 20px 32px" }}>
            <h2 style={{ fontSize: 22, fontFamily: "'Fraunces', serif", fontWeight: 600, color: c.text, margin: "0 0 4px" }}>Signatures</h2>
            <p style={{ fontSize: 13, color: c.dim, margin: "0 0 20px" }}>
              {signed ? "All documents signed." : !paid ? "Payment required before signing." : "Form 8879 is ready for your signature."}
            </p>

            {!signed && (
              <div style={{ padding: "18px", borderRadius: 16, marginBottom: 12, background: c.surface, border: `1.5px solid ${paid ? c.accent : c.border}`, opacity: paid ? 1 : 0.5 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: paid ? c.accentLight : c.muted, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={paid ? c.accent : c.dim} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: c.text }}>Form 8879 — e-file Authorization</div>
                    <div style={{ fontSize: 12, color: c.dim, marginTop: 3 }}>{paid ? "Ready for your signature" : "Complete payment first"}</div>
                    <div style={{ marginTop: 8 }}>
                      <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: paid ? c.warmLight : c.muted, color: paid ? "#9A7245" : c.dim }}>{paid ? "Pending Signature" : "Locked"}</span>
                    </div>
                  </div>
                </div>
                {paid && <Btn onClick={() => setShowSigning(true)} style={{ marginTop: 14 }}>Begin Signing</Btn>}
              </div>
            )}

            {signed && (
              <div style={{ padding: "18px", borderRadius: 16, marginBottom: 12, background: c.accentLight, border: `1px solid ${c.accent}20` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: c.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="20" height="20" viewBox="0 0 14 14" fill="none"><path d="M3 7L5.5 9.5L11 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: c.accent }}>Form 8879 — Signed</div>
                    <div style={{ fontSize: 12, color: c.secondary, marginTop: 2 }}>March 30, 2026 · Filed by Antonio</div>
                  </div>
                </div>
              </div>
            )}

            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: c.dim, marginTop: 24, marginBottom: 10 }}>COMPLETED</div>
            {[{ name: "Engagement Letter", date: "Mar 27, 2026" }, { name: "7216 Consent", date: "Mar 27, 2026" }].map((d, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, marginBottom: 6, background: c.surface, border: `1px solid ${c.borderLight}` }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: c.accentLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7L5.5 9.5L11 4" stroke={c.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{d.name}</div><div style={{ fontSize: 11, color: c.dim }}>{d.date}</div></div>
                <button style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${c.border}`, background: "transparent", color: c.secondary, fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>View</button>
              </div>
            ))}
          </div>
        )}

        {/* ═══ PROFILE TAB ═══ */}
        {tab === "profile" && (
          <div style={{ padding: "24px 20px 32px" }}>
            <h2 style={{ fontSize: 22, fontFamily: "'Fraunces', serif", fontWeight: 600, color: c.text, margin: "0 0 20px" }}>Profile</h2>

            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: c.accentLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 600, color: c.accent }}>MG</div>
              <div><div style={{ fontSize: 16, fontWeight: 600, color: c.text }}>{profileData.name}</div><div style={{ fontSize: 13, color: c.dim }}>{profileData.email}</div></div>
            </div>

            {/* Personal info — editable */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: c.dim }}>PERSONAL INFORMATION</div>
              <button onClick={() => {
                if (editingProfile) setEditingProfile(false);
                else setEditingProfile(true);
              }} style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${c.border}`, background: "transparent", color: editingProfile ? c.accent : c.secondary, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {editingProfile ? "Save" : "Edit"}
              </button>
            </div>
            <div style={{ background: c.surface, borderRadius: 14, border: `1px solid ${c.borderLight}`, overflow: "hidden", marginBottom: 16 }}>
              {[
                { label: "Name", key: "name" as const, value: profileData.name },
                { label: "Email", key: "email" as const, value: profileData.email },
                { label: "Phone", key: "phone" as const, value: profileData.phone },
                { label: "Address", key: "address" as const, value: profileData.address },
              ].map((item, i) => (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderTop: i ? `1px solid ${c.borderLight}` : "none" }}>
                  <span style={{ fontSize: 13, color: c.dim, flexShrink: 0, marginRight: 12 }}>{item.label}</span>
                  {editingProfile ? (
                    <input value={item.value} onChange={e => setProfileData(p => ({ ...p, [item.key]: e.target.value }))} style={{ fontSize: 13, fontWeight: 500, color: c.text, textAlign: "right", border: "none", borderBottom: `1.5px solid ${c.accent}`, background: "transparent", outline: "none", fontFamily: "'Plus Jakarta Sans', sans-serif", padding: "2px 0", flex: 1, maxWidth: 200 }} />
                  ) : (
                    <span style={{ fontSize: 13, fontWeight: 500, color: c.text, textAlign: "right" }}>{item.value}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Read-only info */}
            <div style={{ background: c.surface, borderRadius: 14, border: `1px solid ${c.borderLight}`, overflow: "hidden", marginBottom: 16 }}>
              {[{ label: "Filing status", value: CLIENT.filing }, { label: "Service", value: `${CLIENT.service} — $${CLIENT.fee}` }, { label: "Preparer", value: "Antonio Vazquez, EA" }].map((item, i) => (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "14px 18px", borderTop: i ? `1px solid ${c.borderLight}` : "none" }}>
                  <span style={{ fontSize: 13, color: c.dim }}>{item.label}</span><span style={{ fontSize: 13, fontWeight: 500, color: c.text }}>{item.value}</span>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: c.dim, marginBottom: 10 }}>BILLING</div>
            <div style={{ background: c.surface, borderRadius: 14, border: `1px solid ${c.borderLight}`, overflow: "hidden", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 18px" }}>
                <span style={{ fontSize: 13, color: c.dim }}>Deposit</span><span style={{ fontSize: 13, fontWeight: 500, color: c.accent }}>$50 paid · Mar 27</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 18px", borderTop: `1px solid ${c.borderLight}` }}>
                <span style={{ fontSize: 13, color: c.dim }}>Balance</span><span style={{ fontSize: 13, fontWeight: 500, color: paid ? c.accent : c.warm }}>{paid ? "$300 paid · Mar 30" : "$300 due"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 18px", borderTop: `1px solid ${c.border}` }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: c.text }}>Total</span><span style={{ fontSize: 13, fontWeight: 600, color: paid ? c.accent : c.text }}>{paid ? "$350 paid in full" : "$350 ($50 paid)"}</span>
              </div>
            </div>

            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: c.dim, marginBottom: 10 }}>REFUND</div>
            <div style={{ background: c.surface, borderRadius: 14, border: `1px solid ${c.borderLight}`, overflow: "hidden", marginBottom: 16 }}>
              {[{ label: "Method", value: "Direct deposit" }, { label: "Bank", value: "Chase" }, { label: "Account", value: "****4521" }].map((item, i) => (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "14px 18px", borderTop: i ? `1px solid ${c.borderLight}` : "none" }}>
                  <span style={{ fontSize: 13, color: c.dim }}>{item.label}</span><span style={{ fontSize: 13, fontWeight: 500, color: c.text }}>{item.value}</span>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: c.dim, marginBottom: 10 }}>DOCUMENTS</div>
            <div style={{ background: c.surface, borderRadius: 14, border: `1px solid ${c.borderLight}`, overflow: "hidden", marginBottom: 16 }}>
              {[{ name: "Engagement Letter", date: "Mar 27" }, { name: "7216 Consent", date: "Mar 27" }, ...(signed ? [{ name: "Form 8879 (signed)", date: "Mar 30" }, { name: "2025 Federal Return", date: "Mar 30" }] : [])].map((d, i) => (
                <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderTop: i ? `1px solid ${c.borderLight}` : "none" }}>
                  <span style={{ fontSize: 13, color: c.text }}>{d.name}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, color: c.dim }}>{d.date}</span>
                    <button style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${c.border}`, background: "transparent", color: c.secondary, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>View</button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: c.dim, marginBottom: 10 }}>NOTIFICATIONS</div>
            <div style={{ background: c.surface, borderRadius: 14, border: `1px solid ${c.borderLight}`, overflow: "hidden", marginBottom: 24 }}>
              {[{ label: "Email updates", desc: "Status changes, messages" }, { label: "Payment receipts", desc: "Sent to your email" }].map((n, i) => (
                <div key={n.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderTop: i ? `1px solid ${c.borderLight}` : "none" }}>
                  <div><div style={{ fontSize: 13, color: c.text }}>{n.label}</div><div style={{ fontSize: 11, color: c.dim }}>{n.desc}</div></div>
                  <div style={{ width: 44, height: 24, borderRadius: 12, background: c.accent, padding: 2, cursor: "pointer" }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", marginLeft: 20, transition: "margin-left 0.2s" }} />
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => setShowSignOut(true)} style={{ width: "100%", padding: "14px 18px", borderRadius: 14, background: c.surface, border: `1px solid ${c.borderLight}`, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: c.error }}>Sign out</div>
            </button>
          </div>
        )}
      </div>

      <TabBar tab={tab} onTab={(t) => { setTab(t); if (t === "messages") setUnreadMsgs(0); }} badges={badges} />
    </div>
  );
}

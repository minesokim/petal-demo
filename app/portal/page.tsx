"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

// ─── Palette (warm, organic, Antonio's brand) ───
const c = {
  bg: "#FAFAF8",
  surface: "#FFFFFF",
  muted: "#F5F4F0",
  border: "#E8E6E1",
  borderLight: "#F0EEEA",
  text: "#1A1A18",
  secondary: "#6B6960",
  dim: "#9C978C",
  accent: "#2D5A3D",
  accentLight: "#E8F0EB",
  accentDark: "#1a3a26",
  warm: "#D4A574",
  warmLight: "#FBF5EF",
  error: "#C4483E",
  errorLight: "#FDF0EF",
  blue: "#3B6FA0",
  blueLight: "#EBF2F8",
};

// ─── Components ───

function AntonioAvatar({ size = 40 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `linear-gradient(135deg, ${c.accent} 0%, ${c.accentDark} 100%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Fraunces', serif", fontWeight: 600,
      fontSize: size * 0.35, color: "#fff",
    }}>
      A
    </div>
  );
}

function AntonioNote({ text }: { text: string }) {
  return (
    <div style={{
      display: "flex", gap: 12, padding: "14px 16px", marginTop: 20,
      background: c.warmLight, borderRadius: 14, alignItems: "flex-start",
    }}>
      <AntonioAvatar size={32} />
      <p style={{
        fontSize: 13, color: "#7A5C35", lineHeight: 1.7,
        fontStyle: "italic", margin: 0,
      }}>
        &ldquo;{text}&rdquo;
      </p>
    </div>
  );
}

function QuestionHeader({ step, total, question, sub }: {
  step: number; total: number; question: string; sub?: string;
}) {
  return (
    <>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
        color: c.dim, marginBottom: 10,
      }}>
        {step} OF {total}
      </div>
      <h2 style={{
        fontSize: 24, fontFamily: "'Fraunces', serif", fontWeight: 500,
        color: c.text, marginBottom: sub ? 8 : 24, lineHeight: 1.35,
        margin: 0, marginTop: 0,
      }}>
        {question}
      </h2>
      {sub && (
        <p style={{
          fontSize: 14, color: c.secondary, marginBottom: 28,
          lineHeight: 1.7, margin: 0, marginTop: 8, marginBottom: 28,
        }}>
          {sub}
        </p>
      )}
    </>
  );
}

function OptionCard({ label, desc, price, icon, selected, onClick, isMulti }: {
  label: string; desc?: string; price?: string; icon?: string;
  selected: boolean; onClick: () => void; isMulti?: boolean;
}) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 14,
      width: "100%", padding: "15px 18px", borderRadius: 14, marginBottom: 8,
      background: selected ? c.accentLight : c.surface,
      border: `1.5px solid ${selected ? c.accent : c.borderLight}`,
      cursor: "pointer", textAlign: "left", fontFamily: "'Plus Jakarta Sans', sans-serif",
      transition: "all 0.15s ease",
    }}>
      {icon && <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: selected ? c.accent : c.text }}>
          {label}
        </div>
        {desc && <div style={{ fontSize: 12, color: c.dim, marginTop: 3 }}>{desc}</div>}
        {price && <div style={{ fontSize: 13, fontWeight: 700, color: c.accent, marginTop: 3 }}>{price}</div>}
      </div>
      <div style={{
        width: 22, height: 22, borderRadius: isMulti ? 6 : "50%", flexShrink: 0,
        border: selected ? "none" : `1.5px solid ${c.border}`,
        background: selected ? c.accent : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.15s ease",
      }}>
        {selected && (
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M3 7L5.5 9.5L11 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
    </button>
  );
}

function InputField({ label, placeholder, type = "text" }: {
  label: string; placeholder?: string; type?: string;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{
        fontSize: 12, fontWeight: 600, color: c.secondary,
        display: "block", marginBottom: 6,
      }}>
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder || label}
        style={{
          width: "100%", padding: "12px 14px", borderRadius: 12,
          border: `1.5px solid ${c.border}`, background: c.surface,
          fontSize: 14, color: c.text, outline: "none",
          fontFamily: "'Plus Jakarta Sans', sans-serif", boxSizing: "border-box",
          transition: "border-color 0.15s",
        }}
        onFocus={e => e.target.style.borderColor = c.accent}
        onBlur={e => e.target.style.borderColor = c.border}
      />
    </div>
  );
}

function PrimaryButton({ children, onClick, disabled, style: sx }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; style?: React.CSSProperties;
}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: "100%", padding: "15px 24px", borderRadius: 14,
      border: "none", fontFamily: "'Plus Jakarta Sans', sans-serif",
      background: disabled ? c.borderLight : c.accent,
      color: disabled ? c.dim : "#fff",
      fontSize: 15, fontWeight: 600, cursor: disabled ? "default" : "pointer",
      transition: "all 0.2s ease", ...sx,
    }}>
      {children}
    </button>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.min((current / total) * 100, 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        flex: 1, height: 3, borderRadius: 3,
        background: c.borderLight, overflow: "hidden",
      }}>
        <div style={{
          width: `${pct}%`, height: "100%", borderRadius: 3,
          background: c.accent, transition: "width 0.5s ease",
        }} />
      </div>
      <span style={{ fontSize: 10, color: c.dim, fontWeight: 600, tabularNums: "tabular-nums" as any }}>
        {Math.round(pct)}%
      </span>
    </div>
  );
}

function TopNav({ onBack, title, sub, right }: {
  onBack?: () => void; title: string; sub?: string; right?: React.ReactNode;
}) {
  return (
    <div style={{
      padding: "12px 20px", display: "flex", alignItems: "center",
      borderBottom: `1px solid ${c.border}`, background: c.surface,
      gap: 12, flexShrink: 0,
    }}>
      {onBack && (
        <button onClick={onBack} style={{
          width: 36, height: 36, borderRadius: 10,
          border: `1px solid ${c.border}`, background: "transparent",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          color: c.secondary, fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: c.text }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: c.dim }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

function AskAntonioBar({ onClick }: { onClick?: () => void }) {
  return (
    <div style={{
      flexShrink: 0, borderTop: `1px solid ${c.borderLight}`,
      background: c.surface, padding: "10px 20px 14px",
    }}>
      <div onClick={onClick} style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "10px 16px", borderRadius: 14,
        background: c.bg, border: `1.5px solid ${c.borderLight}`,
        cursor: "pointer", transition: "border-color 0.2s ease",
      }}>
        <div style={{ position: "relative" }}>
          <AntonioAvatar size={34} />
          <div style={{
            position: "absolute", bottom: -1, right: -1,
            width: 10, height: 10, borderRadius: "50%",
            background: "#5CB176", border: `2px solid ${c.bg}`,
          }} />
        </div>
        <span style={{ flex: 1, fontSize: 13, color: c.dim }}>Not sure? Ask Antonio</span>
        <span style={{
          padding: "5px 14px", borderRadius: 20,
          background: c.accent, color: "#fff",
          fontSize: 11, fontWeight: 600,
        }}>
          Message
        </span>
      </div>
    </div>
  );
}

// ─── Status Tracker for Portal Home ───
function StatusTracker({ steps }: { steps: { label: string; done: boolean; active?: boolean }[] }) {
  return (
    <div style={{ padding: "0 4px" }}>
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        return (
          <div key={step.label} style={{ display: "flex", gap: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: step.done ? c.accent : step.active ? c.accentLight : c.muted,
                border: step.active ? `2px solid ${c.accent}` : "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.3s ease",
              }}>
                {step.done ? (
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7L5.5 9.5L11 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : step.active ? (
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.accent }} />
                ) : (
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: c.border }} />
                )}
              </div>
              {!isLast && (
                <div style={{
                  width: 2, height: 28, borderRadius: 1,
                  background: step.done ? c.accent : c.borderLight,
                  transition: "background 0.3s ease",
                }} />
              )}
            </div>
            <div style={{ paddingBottom: isLast ? 0 : 14, paddingTop: 3 }}>
              <div style={{
                fontSize: 13,
                fontWeight: step.active ? 600 : step.done ? 500 : 400,
                color: step.active ? c.accent : step.done ? c.text : c.dim,
              }}>
                {step.label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Tab Bar for Portal ───
function TabBar({ tab, onTab }: { tab: string; onTab: (t: string) => void }) {
  const tabs = [
    { key: "home", label: "Home", icon: "M3 12l9-8 9 8M5 10v8a1 1 0 001 1h3m10-9v8a1 1 0 01-1 1h-3m-4 0v-4a1 1 0 011-1h2a1 1 0 011 1v4" },
    { key: "docs", label: "Docs", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
    { key: "messages", label: "Messages", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
    { key: "sign", label: "Sign", icon: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" },
    { key: "profile", label: "Profile", icon: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z" },
  ];
  return (
    <div style={{
      display: "flex", borderTop: `1px solid ${c.border}`,
      background: c.surface, flexShrink: 0,
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
    }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => onTab(t.key)} style={{
          flex: 1, padding: "10px 0 8px", border: "none", background: "transparent",
          cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={tab === t.key ? c.accent : c.dim} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d={t.icon} />
          </svg>
          <span style={{
            fontSize: 10, fontWeight: 600,
            color: tab === t.key ? c.accent : c.dim,
          }}>
            {t.label}
          </span>
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════
// MAIN PORTAL
// ═══════════════════════════════════════════════
// Vazant logo SVG component
function VazantLogo({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <path d="M25 20L55 100L65 100L38 28Z" fill="#2D5A3D" />
      <path d="M55 100L85 20L95 20L65 100Z" fill="#2D5A3D" />
      <path d="M72 20L95 20L105 40L85 35Z" fill="#C4973B" />
    </svg>
  );
}

export default function ClientPortal() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "otp" | "intake" | "portal">("login");
  const [loginPhone, setLoginPhone] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [step, setStep] = useState("welcome");
  const [hist, setHist] = useState<string[]>(["welcome"]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [sel, setSel] = useState<string | null>(null);
  const [multi, setMulti] = useState<string[]>([]);
  const [tab, setTab] = useState("home");
  const [showDoc, setShowDoc] = useState<"engagement" | "7216" | null>(null);
  const [engAgreed, setEngAgreed] = useState(false);
  const [s72Agreed, setS72Agreed] = useState(false);
  const [docScrolled, setDocScrolled] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutStep, setTutStep] = useState(0);
  const [askAntonioOpen, setAskAntonioOpen] = useState(false);
  const [askInput, setAskInput] = useState("");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatMsgs, setChatMsgs] = useState<{ from: "antonio" | "client" | "system"; text: string; time: string }[]>([
    { from: "antonio", text: "Got your documents! Starting my review. I'll reach out if I have questions. 👍", time: "10:02 AM" },
  ]);
  const [docFolder, setDocFolder] = useState<string | null>(null);
  const [stepKey, setStepKey] = useState(0);
  const [slideDir, setSlideDir] = useState<"forward" | "back">("forward");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Step counter for progress bar (excludes welcome/done)
  const stepIndex = hist.filter(h => h !== "welcome").length;
  const totalSteps = answers.service === "intro" || answers.service === "bookkeeping" ? 5
    : answers.service === "formation" || answers.service === "strategic" ? 7
    : answers.service === "business" ? 17 : 15;

  const go = (nextStep: string) => {
    const updated = { ...answers };
    if (sel !== null) updated[step] = sel;
    if (multi.length) updated[step] = multi;
    setAnswers(updated);
    setHist(h => [...h, nextStep]);
    setSlideDir("forward");
    setStepKey(k => k + 1);
    setStep(nextStep);
    setSel(null);
    setMulti([]);
    scrollRef.current?.scrollTo(0, 0);
  };

  const back = () => {
    if (hist.length <= 1) return;
    const h = hist.slice(0, -1);
    setHist(h);
    setSlideDir("back");
    setStepKey(k => k + 1);
    setStep(h[h.length - 1]);
    setSel(null);
    setMulti([]);
  };

  // ─── Mock returning client data ───
  const RETURNING_DATA: Record<string, any> = {
    filing: "mfj",
    personal_info: true,
    state_filing: "filed_yes",
    dependents: "2",
  };

  const handleOtpComplete = (code: string) => {
    setOtpVerifying(true);
    setTimeout(() => {
      setOtpVerifying(false);
      // Mock: phone ending in 88 = returning client (Maria), otherwise new
      const returning = loginPhone.endsWith("88") || loginPhone.endsWith("0188");
      setIsReturning(returning);
      if (returning) {
        // Returning client → go to client portal
        router.push("/clientportal");
      } else {
        // New client → intake flow
        setMode("intake");
      }
    }, 1500);
  };

  // ─── LOGIN SCREEN ───
  if (mode === "login") {
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: c.bg, maxWidth: 480, margin: "0 auto", justifyContent: "center", padding: "40px 28px" }}>
        <style>{`
          @keyframes logoFadeIn { from { opacity: 0; transform: translateY(-10px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
          @keyframes fieldSlideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
          .login-logo { animation: logoFadeIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) both; }
          .login-title { animation: fieldSlideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both; }
          .login-sub { animation: fieldSlideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.25s both; }
          .login-field { animation: fieldSlideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.35s both; }
          .login-btn { animation: fieldSlideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.45s both; }
          .login-footer { animation: fieldSlideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.55s both; }
        `}</style>
        <div style={{ textAlign: "center", marginBottom: 40 }} className="login-logo">
          <VazantLogo size={72} />
        </div>
        <h1 className="login-title" style={{ fontSize: 26, fontFamily: "'Fraunces', serif", fontWeight: 500, color: c.text, textAlign: "center", margin: "0 0 8px" }}>
          Welcome to Vazant
        </h1>
        <p className="login-sub" style={{ fontSize: 14, color: c.secondary, textAlign: "center", margin: "0 0 32px", lineHeight: 1.6 }}>
          Enter your phone number to get started.<br/>We&apos;ll send you a verification code.
        </p>
        <div className="login-field" style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: c.secondary, display: "block", marginBottom: 6 }}>Phone number</label>
          <input
            value={loginPhone}
            onChange={e => setLoginPhone(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && loginPhone.length >= 10) { setOtpSending(true); setTimeout(() => { setOtpSending(false); setMode("otp"); }, 800); } }}
            placeholder="(555) 555-5555"
            type="tel"
            autoFocus
            style={{ width: "100%", padding: "14px 18px", borderRadius: 14, border: `1.5px solid ${c.border}`, background: c.surface, fontSize: 16, color: c.text, outline: "none", fontFamily: "'Plus Jakarta Sans', sans-serif", boxSizing: "border-box", textAlign: "center", letterSpacing: 1, transition: "border-color 0.2s" }}
          />
        </div>
        <div className="login-btn">
          <PrimaryButton
            disabled={loginPhone.length < 10 || otpSending}
            onClick={() => { setOtpSending(true); setTimeout(() => { setOtpSending(false); setMode("otp"); }, 800); }}
          >
            {otpSending ? "Sending code..." : "Continue"}
          </PrimaryButton>
        </div>
        <div className="login-footer" style={{ textAlign: "center", marginTop: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginBottom: 12 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c.dim} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            <span style={{ fontSize: 11, color: c.dim }}>AES-256 encrypted · Your data is never shared</span>
          </div>
          <p style={{ fontSize: 11, color: c.dim }}>Antonio Vazquez, EA · Montclair, CA</p>
        </div>
      </div>
    );
  }

  // ─── OTP VERIFICATION SCREEN ───
  if (mode === "otp") {
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: c.bg, maxWidth: 480, margin: "0 auto", justifyContent: "center", padding: "40px 28px" }}>
        <style>{`
          @keyframes otpFadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes otpShake { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-8px); } 40% { transform: translateX(8px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); } }
          @keyframes otpSuccess { from { transform: scale(1); } 50% { transform: scale(1.05); } to { transform: scale(1); } }
          .otp-header { animation: otpFadeIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
          .otp-digits { animation: otpFadeIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both; }
          .otp-shake { animation: otpShake 0.4s ease; }
          .otp-verifying { animation: otpSuccess 0.3s ease; }
          .otp-footer { animation: otpFadeIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.3s both; }
        `}</style>
        <button onClick={() => { setMode("login"); setOtpDigits(["","","","","",""]); setOtpError(false); }} style={{ position: "absolute", top: 20, left: 20, width: 40, height: 40, borderRadius: 12, border: `1px solid ${c.border}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke={c.secondary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div className="otp-header" style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: c.accentLight, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
          </div>
          <h2 style={{ fontSize: 22, fontFamily: "'Fraunces', serif", fontWeight: 500, color: c.text, margin: "0 0 8px" }}>Enter verification code</h2>
          <p style={{ fontSize: 13, color: c.secondary, lineHeight: 1.6 }}>We sent a 6-digit code to<br/><strong style={{ color: c.text }}>{loginPhone || "(555) 555-5555"}</strong></p>
        </div>
        <div className={`otp-digits ${otpError ? "otp-shake" : ""} ${otpVerifying ? "otp-verifying" : ""}`} style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 24 }}>
          {otpDigits.map((d, i) => (
            <input
              key={i}
              ref={el => { otpRefs.current[i] = el; }}
              value={d}
              maxLength={1}
              inputMode="numeric"
              autoFocus={i === 0}
              onFocus={e => e.target.select()}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, "");
                if (!val && !d) return;
                const newDigits = [...otpDigits];
                newDigits[i] = val.slice(-1);
                setOtpDigits(newDigits);
                setOtpError(false);
                if (val && i < 5) otpRefs.current[i + 1]?.focus();
                // Auto-submit when all 6 filled
                if (val && i === 5 && newDigits.every(x => x)) {
                  handleOtpComplete(newDigits.join(""));
                }
              }}
              onKeyDown={e => {
                if (e.key === "Backspace" && !d && i > 0) {
                  otpRefs.current[i - 1]?.focus();
                }
              }}
              onPaste={e => {
                e.preventDefault();
                const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                if (paste.length === 6) {
                  const newDigits = paste.split("");
                  setOtpDigits(newDigits);
                  otpRefs.current[5]?.focus();
                  setTimeout(() => handleOtpComplete(paste), 200);
                }
              }}
              style={{
                width: 48, height: 56, borderRadius: 14, textAlign: "center",
                fontSize: 22, fontWeight: 600, fontFamily: "'Fraunces', serif",
                border: `2px solid ${otpError ? c.error : d ? c.accent : c.border}`,
                background: d ? c.accentLight : c.surface,
                color: otpError ? c.error : c.text, outline: "none",
                transition: "all 0.2s ease",
                boxShadow: d ? `0 2px 8px ${c.accent}15` : "none",
              }}
            />
          ))}
        </div>
        {otpVerifying && (
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 20, background: c.accentLight }}>
              <div style={{ width: 14, height: 14, border: `2px solid ${c.accent}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
              <span style={{ fontSize: 12, color: c.accent, fontWeight: 600 }}>Verifying...</span>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}
        {otpError && (
          <p style={{ textAlign: "center", fontSize: 13, color: c.error, marginBottom: 16 }}>Invalid code. Please try again.</p>
        )}
        <div className="otp-footer" style={{ textAlign: "center" }}>
          <button onClick={() => { setOtpDigits(["","","","","",""]); otpRefs.current[0]?.focus(); }} style={{ fontSize: 13, color: c.accent, fontWeight: 500, background: "transparent", border: "none", cursor: "pointer", padding: "8px 16px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Resend code
          </button>
          <p style={{ fontSize: 11, color: c.dim, marginTop: 12 }}>
            Code expires in 5:00
          </p>
        </div>
      </div>
    );
  }

  // ─── INTAKE FLOW ───
  if (mode === "intake") {
    return (
      <div style={{
        height: "100vh", display: "flex", flexDirection: "column",
        background: c.bg, maxWidth: 480, margin: "0 auto",
      }}>
        <style>{`
          @keyframes slideInRight { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }
          @keyframes slideInLeft { from { opacity: 0; transform: translateX(-24px); } to { opacity: 1; transform: translateX(0); } }
          @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes scaleIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
          @keyframes drawCheck { to { stroke-dashoffset: 0; } }
          @keyframes circleGrow { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          .step-slide { animation: ${slideDir === "forward" ? "slideInRight" : "slideInLeft"} 0.35s cubic-bezier(0.22, 1, 0.36, 1) both; }
          .step-fade-up { animation: fadeInUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both; }
          .done-circle { animation: circleGrow 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both; }
          .done-check { stroke-dasharray: 24; stroke-dashoffset: 24; animation: drawCheck 0.4s ease 0.5s forwards; }
          .done-title { animation: fadeInUp 0.5s ease 0.7s both; }
          .done-sub { animation: fadeInUp 0.5s ease 0.85s both; }
          .done-card { animation: fadeInUp 0.5s ease 1s both; }
          .done-note { animation: fadeInUp 0.5s ease 1.15s both; }
          .done-btn { animation: fadeInUp 0.5s ease 1.3s both; }
        `}</style>

        {/* Top nav (skip on welcome + done screens) */}
        {step !== "welcome" && step !== "done" && (
          <TopNav
            onBack={back}
            title="Vazant Consulting"
            sub="New Client Intake"
            right={<ProgressBar current={stepIndex} total={totalSteps} />}
          />
        )}

        {/* Scrollable content */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto" }}>
          <div key={stepKey} className={step !== "welcome" && step !== "done" ? "step-slide" : ""} style={{
            maxWidth: 560, width: "100%", margin: "0 auto",
            padding: step === 0 ? "0" : "32px 24px 40px",
          }}>

            {/* ── Welcome ── */}
            {step === "welcome" && (
              <div style={{ padding: "0 24px 40px" }}>
                {/* Welcome video */}
                <div style={{
                  borderRadius: 0, overflow: "hidden", marginBottom: 32,
                  background: `linear-gradient(145deg, #1a3a26 0%, #0d1f15 60%, #0a0a0a 100%)`,
                  aspectRatio: "16/9", display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", position: "relative",
                }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: "50%",
                      margin: "0 auto 14px",
                      background: "rgba(255,255,255,0.08)",
                      border: "2px solid rgba(255,255,255,0.15)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <div style={{
                        width: 0, height: 0, marginLeft: 4,
                        borderTop: "12px solid transparent",
                        borderBottom: "12px solid transparent",
                        borderLeft: "20px solid rgba(255,255,255,0.9)",
                      }} />
                    </div>
                    <div style={{
                      color: "#fff", fontSize: 17, fontWeight: 600,
                      fontFamily: "'Fraunces', serif",
                    }}>
                      A message from Antonio
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 5 }}>
                      1:12 &middot; Tap to play
                    </div>
                  </div>
                </div>

                {/* Welcome text */}
                <div style={{ textAlign: "center" }}>
                  <h1 style={{
                    fontSize: 26, fontFamily: "'Fraunces', serif",
                    fontWeight: 500, color: c.text, margin: "0 0 10px",
                    lineHeight: 1.3,
                  }}>
                    Welcome to<br />Vazant Consulting
                  </h1>
                  <p style={{
                    fontSize: 14, color: c.secondary, lineHeight: 1.7,
                    margin: "0 0 28px",
                  }}>
                    I&apos;m Antonio Vazquez, Enrolled Agent. Let&apos;s get your taxes handled. Answer a few questions &mdash; takes about <strong style={{ color: c.text }}>10 minutes</strong>.
                  </p>

                  <div style={{
                    display: "flex", gap: 8, justifyContent: "center",
                    marginBottom: 28, flexWrap: "wrap",
                  }}>
                    {["AES-256 encrypted", "Enrolled Agent", "~10 minutes"].map((s, i) => (
                      <div key={i} style={{
                        padding: "7px 14px", borderRadius: 10,
                        background: c.muted, border: `1px solid ${c.borderLight}`,
                        fontSize: 11, color: c.secondary, fontWeight: 500,
                      }}>
                        {s}
                      </div>
                    ))}
                  </div>

                  <PrimaryButton onClick={() => { setShowTutorial(true); setTutStep(0); }}>
                    Let&apos;s get started
                  </PrimaryButton>

                  <p style={{ fontSize: 11, color: c.dim, marginTop: 14, lineHeight: 1.7, textAlign: "center" }}>
                    We&apos;ll ask about your filing status, income sources, and dependents.
                    Then you&apos;ll upload your documents and sign your engagement letter.
                  </p>

                  <p style={{ fontSize: 11, color: c.dim, marginTop: 14, textAlign: "center" }}>
                    Your information is never shared or sold.
                  </p>
                </div>
              </div>
            )}

            {/* ── Service tier (matches Calendly) ── */}
            {step === "service" && (
              <div>
                <QuestionHeader step={stepIndex} total={totalSteps} question="What brings you in?" sub="Select the service that best fits your needs." />
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: c.dim, marginBottom: 8 }}>TAX PREPARATION</div>
                <OptionCard label="Simple Tax Return" desc="W-2 income, limited deductions, standard filing" price="Starting at $150" selected={sel === "simple"} onClick={() => setSel("simple")} />
                <OptionCard label="Complex Return" desc="Self-employment, rentals, investments, itemized deductions" price="Starting at $350" selected={sel === "complex"} onClick={() => setSel("complex")} />
                <OptionCard label="Business Tax Return" desc="S-Corp, LLC, C-Corp, partnership returns" price="Starting at $500" selected={sel === "business"} onClick={() => setSel("business")} />
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: c.dim, marginBottom: 8, marginTop: 20 }}>OTHER SERVICES</div>
                <OptionCard label="Introductory Consultation" desc="Free session to explore your options" selected={sel === "intro"} onClick={() => setSel("intro")} />
                <OptionCard label="Business Formation" desc="LLC, S-Corp, C-Corp setup and registration" selected={sel === "formation"} onClick={() => setSel("formation")} />
                <OptionCard label="Bookkeeping Consultation" desc="Clarity around your bookkeeping needs" selected={sel === "bookkeeping"} onClick={() => setSel("bookkeeping")} />
                <OptionCard label="Strategic Tax & Business Consultation" desc="In-depth guidance on tax and business matters" selected={sel === "strategic"} onClick={() => setSel("strategic")} />
                <AntonioNote text="Not sure where to start? The Introductory Consultation is free and I'll point you in the right direction." />
                <PrimaryButton onClick={() => {
                  const svc = sel;
                  setAnswers(a => ({ ...a, service: svc }));
                  // Route based on service type
                  if (svc === "intro" || svc === "bookkeeping") go("contact_info");
                  else if (svc === "formation") go("business_formation");
                  else if (svc === "strategic") go("strategic_topics");
                  else if (svc === "business") go("business_info");
                  else go("filing"); // simple or complex tax
                }} disabled={!sel} style={{ marginTop: 24 }}>Continue</PrimaryButton>
              </div>
            )}

            {/* ── Step 2: Filing status ── */}
            {step === "filing" && (
              <div>
                <QuestionHeader step={stepIndex} total={totalSteps} question="What's your filing status?" sub="This determines your tax rates and standard deduction." />
                <OptionCard label="Single" desc="Unmarried or legally separated" selected={sel === "single"} onClick={() => setSel("single")} />
                <OptionCard label="Married Filing Jointly" desc="Most common for married couples" selected={sel === "mfj"} onClick={() => setSel("mfj")} />
                <OptionCard label="Married Filing Separately" selected={sel === "mfs"} onClick={() => setSel("mfs")} />
                <OptionCard label="Head of Household" desc="Unmarried with qualifying dependents" selected={sel === "hoh"} onClick={() => setSel("hoh")} />
                <OptionCard label="Qualifying Surviving Spouse" selected={sel === "qw"} onClick={() => setSel("qw")} />
                <AntonioNote text="If you're not sure between Head of Household and Single, pick what sounds right. I'll verify during my review." />
                <PrimaryButton onClick={() => go(sel === "mfj" || sel === "mfs" ? "spouse" : "personal_info")} disabled={!sel} style={{ marginTop: 24 }}>Continue</PrimaryButton>
              </div>
            )}

            {/* ── Step 3: Spouse info (conditional) ── */}
            {step === "spouse" && (
              <div>
                <QuestionHeader step={stepIndex} total={totalSteps} question="Tell me about your spouse." sub="Basic info for the joint return." />
                <InputField label="Spouse's full legal name" placeholder="First and last name" />
                <InputField label="Date of birth" placeholder="MM/DD/YYYY" type="date" />
                <InputField label="Social Security Number" placeholder="XXX-XX-XXXX" />
                <InputField label="Occupation" placeholder="e.g., Teacher, Nurse, Engineer" />
                <AntonioNote text="Your SSN is encrypted the moment you type it. I only see the last 4 digits until I'm actively preparing your return." />
                <PrimaryButton onClick={() => go("personal_info")} style={{ marginTop: 16 }}>Continue</PrimaryButton>
              </div>
            )}

            {/* ── Step 4: Your info ── */}
            {step === "personal_info" && (
              <div>
                <QuestionHeader step={stepIndex} total={totalSteps} question="Your basic information" sub="This goes directly onto your return." />
                <InputField label="Full legal name" placeholder="First and last name" />
                <InputField label="Date of birth" placeholder="MM/DD/YYYY" type="date" />
                <InputField label="Social Security Number" placeholder="XXX-XX-XXXX" />
                <InputField label="Phone number" placeholder="(555) 555-5555" type="tel" />
                <InputField label="Email" placeholder="you@email.com" type="email" />
                <InputField label="Occupation" placeholder="e.g., Software Engineer" />
                <div style={{ marginTop: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: c.secondary, display: "block", marginBottom: 6 }}>Home address</label>
                  <InputField label="" placeholder="Street address" />
                  <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ flex: 2 }}><InputField label="" placeholder="City" /></div>
                    <div style={{ flex: 1 }}><InputField label="" placeholder="State" /></div>
                    <div style={{ flex: 1 }}><InputField label="" placeholder="ZIP" /></div>
                  </div>
                </div>
                <PrimaryButton onClick={() => go("state_filing")} style={{ marginTop: 16 }}>Continue</PrimaryButton>
              </div>
            )}

            {/* ── State filing + prior year ── */}
            {step === "state_filing" && (
              <div>
                <QuestionHeader step={stepIndex} total={totalSteps} question="A few more details" sub="This helps me prepare your return accurately." />
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: c.secondary, display: "block", marginBottom: 6 }}>Which state(s) did you live or work in during 2025?</label>
                  <InputField label="" placeholder="e.g., California" />
                  <InputField label="" placeholder="Additional state (if applicable)" />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: c.secondary, display: "block", marginBottom: 6 }}>Did you file a tax return last year?</label>
                  <OptionCard label="Yes, I filed last year" selected={sel === "filed_yes"} onClick={() => setSel("filed_yes")} />
                  <OptionCard label="No, I didn't file" selected={sel === "filed_no"} onClick={() => setSel("filed_no")} />
                </div>
                {sel === "filed_yes" && (
                  <div style={{ marginBottom: 12 }}>
                    <InputField label="Who prepared your return?" placeholder="e.g., Self, H&R Block, another preparer" />
                    <AntonioNote text="If you have a copy of last year's return, upload it in the documents step — it helps me catch things." />
                  </div>
                )}
                <PrimaryButton onClick={() => go("dependents")} disabled={!sel} style={{ marginTop: 8 }}>Continue</PrimaryButton>
              </div>
            )}

            {/* ── Step 5: Dependents ── */}
            {step === "dependents" && (
              <div>
                <QuestionHeader step={stepIndex} total={totalSteps} question="Do you have any dependents?" sub="Children, elderly parents, or anyone who depends on you financially." />
                <OptionCard label="No dependents" selected={sel === "none"} onClick={() => setSel("none")} />
                <OptionCard label="1 dependent" selected={sel === "1"} onClick={() => setSel("1")} />
                <OptionCard label="2 dependents" selected={sel === "2"} onClick={() => setSel("2")} />
                <OptionCard label="3 or more" selected={sel === "3+"} onClick={() => setSel("3+")} />
                <AntonioNote text="Dependents unlock credits like the Child Tax Credit ($2,000+ per child). Even if you're not sure someone qualifies, mention them." />
                <PrimaryButton onClick={() => go(sel === "none" ? "income" : "dep_detail")} disabled={!sel} style={{ marginTop: 24 }}>Continue</PrimaryButton>
              </div>
            )}

            {/* ── Step 6: Dependent details ── */}
            {step === "dep_detail" && (
              <div>
                <QuestionHeader step={stepIndex} total={totalSteps} question="Tell me about your dependents" sub="Just the basics. I'll sort out who qualifies." />
                {[1, 2].map(i => (
                  <div key={i} style={{
                    padding: "18px 20px", borderRadius: 14, marginBottom: 12,
                    background: c.surface, border: `1.5px solid ${c.borderLight}`,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: c.dim, marginBottom: 14, letterSpacing: "0.06em" }}>DEPENDENT {i}</div>
                    <InputField label="Full name" placeholder="First and last" />
                    <InputField label="Date of birth" placeholder="MM/DD/YYYY" type="date" />
                    <InputField label="Social Security Number" placeholder="XXX-XX-XXXX" />
                    <InputField label="Relationship" placeholder="e.g., Son, Daughter, Parent" />
                    <InputField label="Months living with you in 2025" placeholder="e.g., 12" />
                  </div>
                ))}
                <AntonioNote text="If you have a child under 13 and pay for daycare, that's a big credit we don't want to miss." />
                <PrimaryButton onClick={() => go("income")} style={{ marginTop: 16 }}>Continue</PrimaryButton>
              </div>
            )}

            {/* ── Step 7: Income types ── */}
            {step === "income" && (
              <div>
                <QuestionHeader step={stepIndex} total={totalSteps} question="How do you earn income?" sub="Select all that apply." />
                {[
                  { value: "w2", label: "W-2 Employee", desc: "Regular paycheck from an employer" },
                  { value: "self", label: "Self-Employed / 1099", desc: "Freelance, gig work, contracting" },
                  { value: "rental", label: "Rental Property", desc: "Income from property you own" },
                  { value: "invest", label: "Investments / Crypto", desc: "Stocks, crypto, capital gains" },
                  { value: "retire", label: "Retirement / Social Security", desc: "Pension, IRA distributions, SSA" },
                ].map(o => (
                  <OptionCard
                    key={o.value} label={o.label} desc={o.desc} icon={o.icon} isMulti
                    selected={multi.includes(o.value)}
                    onClick={() => setMulti(p => p.includes(o.value) ? p.filter(v => v !== o.value) : [...p, o.value])}
                  />
                ))}
                <AntonioNote text="Don't overthink this. If you got paid for it, select it. I'll sort out the forms." />
                <PrimaryButton
                  onClick={() => {
                    setAnswers(a => ({ ...a, income: multi }));
                    if (multi.includes("self")) go("self_employment");
                    else if (multi.includes("rental")) go("rental_detail");
                    else go("tax_questions");
                  }}
                  disabled={!multi.length}
                  style={{ marginTop: 24 }}
                >
                  Continue
                </PrimaryButton>
              </div>
            )}

            {/* ── Step 8: Tax questions ── */}
            {step === "tax_questions" && (
              <div>
                <QuestionHeader step={stepIndex} total={totalSteps} question="A few quick tax questions" sub="These help me plan your return before we even meet." />
                <OptionCard label="Did you transact in digital assets?" desc="Crypto, NFTs, stablecoins — even small airdrops count" isMulti selected={multi.includes("crypto")} onClick={() => setMulti(p => p.includes("crypto") ? p.filter(v => v !== "crypto") : [...p, "crypto"])} />
                <OptionCard label="Did you make estimated tax payments?" desc="Quarterly payments to the IRS" isMulti selected={multi.includes("estimated")} onClick={() => setMulti(p => p.includes("estimated") ? p.filter(v => v !== "estimated") : [...p, "estimated"])} />
                <OptionCard label="Did you have health insurance all year?" desc="Through employer, marketplace, or Medicare" isMulti selected={multi.includes("health")} onClick={() => setMulti(p => p.includes("health") ? p.filter(v => v !== "health") : [...p, "health"])} />
                <OptionCard label="Did you contribute to an IRA or HSA?" desc="Traditional IRA, Roth IRA, or Health Savings Account" isMulti selected={multi.includes("ira")} onClick={() => setMulti(p => p.includes("ira") ? p.filter(v => v !== "ira") : [...p, "ira"])} />
                <AntonioNote text="The digital assets question is on the front page of the 1040 now. The IRS is watching this closely." />
                <PrimaryButton onClick={() => go("deductions")} style={{ marginTop: 24 }}>Continue</PrimaryButton>
              </div>
            )}

            {/* ── Step 9: Deductions ── */}
            {step === "deductions" && (
              <div>
                <QuestionHeader step={stepIndex} total={totalSteps} question="Quick check on deductions" sub="Select anything that might apply. When in doubt, select it." />
                {[
                  { value: "mortgage", label: "Home mortgage" },
                  { value: "student", label: "Student loans" },
                  { value: "charity", label: "Charitable donations" },
                  { value: "childcare", label: "Childcare costs" },
                  { value: "medical", label: "Medical expenses" },
                  { value: "education", label: "Education / tuition" },
                  { value: "educator", label: "Educator expenses", desc: "K-12 teacher supplies (up to $300)" },
                ].map(o => (
                  <OptionCard
                    key={o.value} label={o.label} icon={o.icon} desc={o.desc} isMulti
                    selected={multi.includes(o.value)}
                    onClick={() => setMulti(p => {
                      if (o.value === "none") return ["none"];
                      return p.includes(o.value) ? p.filter(v => v !== o.value) : [...p.filter(v => v !== "none"), o.value];
                    })}
                  />
                ))}
                <OptionCard label="None of these" selected={multi.includes("none")} isMulti onClick={() => setMulti(["none"])} />
                <AntonioNote text="Even if you're not sure something counts, select it. I'd rather check than miss a deduction worth hundreds." />
                <PrimaryButton
                  onClick={() => { setAnswers(a => ({ ...a, deductions: multi })); go("refund"); }}
                  disabled={!multi.length}
                  style={{ marginTop: 24 }}
                >
                  Continue
                </PrimaryButton>
              </div>
            )}

            {/* ── Step 10: Refund preference ── */}
            {step === "refund" && (
              <div>
                <QuestionHeader step={stepIndex} total={totalSteps} question="Refund preference" sub="If you're owed a refund, how would you like to receive it?" />
                <OptionCard label="Direct deposit (fastest)" desc="Refund arrives in 10-21 days" selected={sel === "direct"} onClick={() => setSel("direct")} />
                <OptionCard label="Paper check by mail" desc="Takes 4-6 weeks" selected={sel === "check"} onClick={() => setSel("check")} />
                {sel === "direct" && (
                  <div style={{
                    padding: "18px 20px", borderRadius: 14, marginTop: 12,
                    background: c.surface, border: `1.5px solid ${c.borderLight}`,
                  }}>
                    <InputField label="Bank name" placeholder="e.g., Chase, Wells Fargo" />
                    <InputField label="Routing number" placeholder="9 digits" />
                    <InputField label="Account number" placeholder="Your account number" />
                  </div>
                )}
                <AntonioNote text="Direct deposit is always faster. If you owe instead of getting a refund, we'll figure out the best payment plan." />
                <PrimaryButton onClick={() => go("life_events")} disabled={!sel} style={{ marginTop: 24 }}>Continue</PrimaryButton>
              </div>
            )}

            {/* ── Self-employment detail (conditional) ── */}
            {step === "self_employment" && (
              <div>
                <QuestionHeader step={stepIndex} total={totalSteps} question="Tell me about your self-employment" sub="This opens up lots of deductions." />
                <InputField label="Business name" placeholder="e.g., Freelance Design LLC" />
                <InputField label="What do you do?" placeholder="e.g., Graphic design, consulting" />
                <InputField label="Entity type" placeholder="Sole Prop, LLC, S-Corp, or N/A" />
                <InputField label="EIN (if any)" placeholder="XX-XXXXXXX or N/A" />
                <InputField label="Approximate 2025 revenue" placeholder="e.g., $50,000" />
                <OptionCard label="I use a home office" selected={multi.includes("home_office")} isMulti onClick={() => setMulti(p => p.includes("home_office") ? [] : ["home_office"])} />
                <OptionCard label="I use a vehicle for business" selected={multi.includes("vehicle")} isMulti onClick={() => setMulti(p => p.includes("vehicle") ? [] : ["vehicle"])} />
                <AntonioNote text="Self-employment has dozens of deductions most people miss. Home office, mileage, equipment, health insurance. We'll go through all of them." />
                <PrimaryButton onClick={() => {
                  setAnswers(a => ({ ...a, selfEmployment: multi }));
                  if ((answers.income || []).includes("rental")) go("rental_detail");
                  else go("tax_questions");
                }} style={{ marginTop: 20 }}>Continue</PrimaryButton>
              </div>
            )}

            {/* ── Rental property detail (conditional) ── */}
            {step === "rental_detail" && (
              <div>
                <QuestionHeader step={stepIndex} total={totalSteps} question="Tell me about your rental property" />
                <InputField label="Property address" placeholder="Street, City, State" />
                <InputField label="Monthly rent collected" placeholder="e.g., $2,000" />
                <InputField label="Monthly mortgage payment" placeholder="e.g., $1,500" />
                <InputField label="Year acquired" placeholder="e.g., 2019" />
                <InputField label="Number of rental properties" placeholder="e.g., 1" />
                <AntonioNote text="Rental properties are one of the best tax advantages. Depreciation, repairs, insurance, mortgage interest — we'll capture everything." />
                <PrimaryButton onClick={() => go("tax_questions")} style={{ marginTop: 20 }}>Continue</PrimaryButton>
              </div>
            )}

            {/* ── Life events ── */}
            {step === "life_events" && (
              <div>
                <QuestionHeader step={stepIndex} total={totalSteps} question="Any major life changes in 2025?" sub="These can significantly affect your return." />
                <OptionCard label="Got married or divorced" isMulti selected={multi.includes("married")} onClick={() => setMulti(p => p.includes("married") ? p.filter(v => v !== "married") : [...p, "married"])} />
                <OptionCard label="Had a baby or adopted" isMulti selected={multi.includes("baby")} onClick={() => setMulti(p => p.includes("baby") ? p.filter(v => v !== "baby") : [...p, "baby"])} />
                <OptionCard label="Bought or sold a home" isMulti selected={multi.includes("home")} onClick={() => setMulti(p => p.includes("home") ? p.filter(v => v !== "home") : [...p, "home"])} />
                <OptionCard label="Started a business" isMulti selected={multi.includes("new_biz")} onClick={() => setMulti(p => p.includes("new_biz") ? p.filter(v => v !== "new_biz") : [...p, "new_biz"])} />
                <OptionCard label="Received an inheritance" isMulti selected={multi.includes("inheritance")} onClick={() => setMulti(p => p.includes("inheritance") ? p.filter(v => v !== "inheritance") : [...p, "inheritance"])} />
                <OptionCard label="None of these" selected={multi.includes("none")} isMulti onClick={() => setMulti(["none"])} />
                <AntonioNote text="Life changes often mean tax changes. Even if you're not sure it matters, mention it and I'll check." />
                <PrimaryButton onClick={() => { setAnswers(a => ({ ...a, lifeEvents: multi })); go("documents"); }} disabled={!multi.length} style={{ marginTop: 24 }}>Continue</PrimaryButton>
              </div>
            )}

            {/* ── Dynamic document checklist ── */}
            {step === "documents" && (() => {
              const docs: { label: string; cat: string; required?: boolean; icon: string }[] = [
                { label: "Photo ID", cat: "Driver's License or Passport", required: true, icon: "ID" },
              ];
              const inc = answers.income || [];
              const ded = answers.deductions || [];
              if (inc.includes("w2")) docs.push({ label: "W-2", cat: "From your employer(s)", icon: "W2" });
              if (inc.includes("self")) {
                docs.push({ label: "1099-NEC / 1099-K", cat: "From clients or platforms", icon: "1099" });
                docs.push({ label: "Business expenses", cat: "Receipts, statements, logs", icon: "EXP" });
              }
              if (inc.includes("rental")) docs.push({ label: "Rental records", cat: "Income, mortgage, expenses", icon: "RNT" });
              if (inc.includes("invest")) docs.push({ label: "1099-B", cat: "Brokerage / crypto statements", icon: "INV" });
              if (inc.includes("retire")) docs.push({ label: "1099-R / SSA-1099", cat: "Retirement distributions", icon: "RET" });
              if (ded.includes("mortgage")) docs.push({ label: "1098 Mortgage", cat: "Mortgage interest statement", icon: "MTG" });
              if (ded.includes("childcare")) docs.push({ label: "Childcare info", cat: "Provider name, address, EIN", icon: "CC" });
              if (answers.filing === "mfj") docs.push({ label: "Spouse documents", cat: "W-2s, 1099s for your spouse", icon: "SP" });
              docs.push({ label: "Prior year return", cat: "Last year's tax return (if available)", icon: "PY" });

              const docIdx = answers._docIdx || 0;
              const docUploaded = answers._docUploaded || [];
              const current = docs[docIdx];
              const isLast = docIdx >= docs.length - 1;
              const uploadedCount = docUploaded.length;

              if (!current) return <div><PrimaryButton onClick={() => go("schedule")}>Continue</PrimaryButton></div>;

              return (
                <div>
                  <QuestionHeader step={stepIndex} total={totalSteps} question="Upload your documents" sub={`Document ${docIdx + 1} of ${docs.length}`} />

                  {/* Progress dots */}
                  <div style={{ display: "flex", gap: 4, marginBottom: 24, justifyContent: "center" }}>
                    {docs.map((_, i) => (
                      <div key={i} style={{
                        width: i === docIdx ? 20 : 6, height: 6, borderRadius: 3,
                        background: i < docIdx ? c.accent : i === docIdx ? c.accent : c.borderLight,
                        opacity: (docUploaded as string[]).includes(String(i)) ? 1 : i === docIdx ? 1 : 0.5,
                        transition: "all 0.3s ease",
                      }} />
                    ))}
                  </div>

                  {/* Current document card */}
                  <div style={{
                    background: c.surface, borderRadius: 20, border: `1.5px solid ${c.borderLight}`,
                    padding: "28px 24px", textAlign: "center", marginBottom: 20,
                  }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: 14, margin: "0 auto 16px",
                      background: current.required ? c.warmLight : c.accentLight,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, fontWeight: 700, color: current.required ? "#9A7245" : c.accent,
                    }}>
                      {current.icon}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: c.text, fontFamily: "'Fraunces', serif", marginBottom: 4 }}>{current.label}</div>
                    <div style={{ fontSize: 13, color: c.secondary }}>{current.cat}</div>
                    {current.required && <div style={{ marginTop: 8, padding: "3px 10px", borderRadius: 20, background: c.warmLight, color: "#9A7245", fontSize: 11, fontWeight: 600, display: "inline-block" }}>Required</div>}

                    {(docUploaded as string[]).includes(String(docIdx)) ? (
                      <div style={{ marginTop: 20, padding: "12px 16px", borderRadius: 12, background: c.accentLight, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <svg width="16" height="16" viewBox="0 0 14 14" fill="none"><path d="M3 7L5.5 9.5L11 4" stroke={c.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        <span style={{ fontSize: 13, fontWeight: 600, color: c.accent }}>Uploaded</span>
                      </div>
                    ) : (
                      <div style={{ marginTop: 20 }}>
                        {/* Camera button — primary */}
                        <label style={{
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                          padding: "14px 20px", borderRadius: 14, background: c.accent, color: "#fff",
                          fontSize: 14, fontWeight: 600, cursor: "pointer", marginBottom: 10,
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                        }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                          Take a photo
                          <input type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={() => setAnswers(a => ({ ...a, _docUploaded: [...(a._docUploaded || []), String(docIdx)] }))} />
                        </label>
                        {/* Attach file — secondary */}
                        <label style={{
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                          padding: "12px 20px", borderRadius: 14, background: "transparent", border: `1.5px solid ${c.border}`,
                          color: c.secondary, fontSize: 13, fontWeight: 600, cursor: "pointer",
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                        }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
                          Attach a file
                          <input type="file" accept="image/*,.pdf,.doc,.docx" style={{ display: "none" }} onChange={() => setAnswers(a => ({ ...a, _docUploaded: [...(a._docUploaded || []), String(docIdx)] }))} />
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Navigation */}
                  <div style={{ display: "flex", gap: 10 }}>
                    {!(docUploaded as string[]).includes(String(docIdx)) && (
                      <button onClick={() => {
                        if (isLast) go("schedule");
                        else setAnswers(a => ({ ...a, _docIdx: docIdx + 1 }));
                      }} style={{
                        flex: 1, padding: "14px 20px", borderRadius: 14, background: "transparent",
                        border: `1.5px solid ${c.border}`, color: c.secondary, fontSize: 14, fontWeight: 600,
                        cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}>
                        {current.required ? "Skip for now" : "I\u2019ll add later"}
                      </button>
                    )}
                    <PrimaryButton onClick={() => {
                      if (isLast) go("schedule");
                      else setAnswers(a => ({ ...a, _docIdx: docIdx + 1 }));
                    }} style={{ flex: 1 }}>
                      {isLast ? "Continue" : "Next document"}
                    </PrimaryButton>
                  </div>

                  {uploadedCount > 0 && (
                    <div style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: c.accent, fontWeight: 500 }}>
                      {uploadedCount} of {docs.length} uploaded
                    </div>
                  )}

                  <AntonioNote text="Photos from your phone work great. You can always add more documents from your portal later." />
                </div>
              );
            })()}

            {/* ── Business info (for business tax returns) ── */}
            {step === "business_info" && (
              <div>
                <QuestionHeader step={stepIndex} total={totalSteps} question="Tell me about your business" sub="This helps me prepare the right return type." />
                <InputField label="Legal business name" placeholder="e.g., Sandoval Plumbing LLC" />
                <InputField label="EIN (Employer Identification Number)" placeholder="XX-XXXXXXX" />
                <InputField label="Entity type" placeholder="S-Corp, LLC, C-Corp, Partnership" />
                <InputField label="Business activity" placeholder="e.g., Plumbing, Restaurant, Consulting" />
                <InputField label="Number of employees" placeholder="e.g., 5" />
                <InputField label="Accounting method" placeholder="Cash or Accrual" />
                <InputField label="Fiscal year end" placeholder="e.g., 12/31" />
                <div style={{ marginTop: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: c.secondary, display: "block", marginBottom: 6 }}>Business address (if different from home)</label>
                  <InputField label="" placeholder="Street address" />
                  <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ flex: 2 }}><InputField label="" placeholder="City" /></div>
                    <div style={{ flex: 1 }}><InputField label="" placeholder="State" /></div>
                    <div style={{ flex: 1 }}><InputField label="" placeholder="ZIP" /></div>
                  </div>
                </div>
                <InputField label="Accounting software" placeholder="e.g., QuickBooks, Xero, Wave, None" />
                <InputField label="Payroll provider" placeholder="e.g., ADP, Gusto, In-house, None" />
                <div style={{ marginTop: 12, padding: "18px 20px", borderRadius: 14, background: c.surface, border: `1.5px solid ${c.borderLight}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: c.dim, marginBottom: 14, letterSpacing: "0.06em" }}>OWNERSHIP</div>
                  {[1].map(i => (
                    <div key={i}>
                      <InputField label={`Owner ${i} name`} placeholder="Full legal name" />
                      <InputField label="SSN" placeholder="XXX-XX-XXXX" />
                      <InputField label="Ownership %" placeholder="e.g., 100" />
                      <InputField label="Title" placeholder="e.g., Managing Member, President" />
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: c.secondary, display: "block", marginBottom: 6 }}>Are we also preparing personal returns for any owners?</label>
                  <OptionCard label="Yes" selected={sel === "k1_yes"} onClick={() => setSel("k1_yes")} />
                  <OptionCard label="No" selected={sel === "k1_no"} onClick={() => setSel("k1_no")} />
                </div>
                <AntonioNote text="If you're not sure about entity type or accounting method, don't worry. I'll verify everything." />
                <PrimaryButton onClick={() => go("filing")} style={{ marginTop: 20 }}>Continue</PrimaryButton>
              </div>
            )}

            {/* ── Business formation ── */}
            {step === "business_formation" && (
              <div>
                <QuestionHeader step={stepIndex} total={totalSteps} question="Business formation details" sub="Tell me about the business you want to set up." />
                <InputField label="Desired business name" placeholder="e.g., Park Cleaners LLC" />
                <InputField label="What will the business do?" placeholder="e.g., Dry cleaning, consulting" />
                <OptionCard label="LLC" selected={sel === "llc"} onClick={() => setSel("llc")} />
                <OptionCard label="S-Corporation" selected={sel === "scorp"} onClick={() => setSel("scorp")} />
                <OptionCard label="C-Corporation" selected={sel === "ccorp"} onClick={() => setSel("ccorp")} />
                <OptionCard label="Not sure — need guidance" selected={sel === "unsure"} onClick={() => setSel("unsure")} />
                <InputField label="State of incorporation" placeholder="e.g., California" />
                <InputField label="Number of owners" placeholder="e.g., 1, 2" />
                <AntonioNote text="If you're not sure which entity type, that's exactly what we'll figure out in our consultation." />
                <PrimaryButton onClick={() => go("contact_info")} style={{ marginTop: 20 }}>Continue</PrimaryButton>
              </div>
            )}

            {/* ── Strategic consultation topics ── */}
            {step === "strategic_topics" && (
              <div>
                <QuestionHeader step={stepIndex} total={totalSteps} question="What do you want to discuss?" sub="Select all that apply so I can prepare." />
                <OptionCard label="Tax planning & projections" isMulti selected={multi.includes("planning")} onClick={() => setMulti(p => p.includes("planning") ? p.filter(v => v !== "planning") : [...p, "planning"])} />
                <OptionCard label="Entity restructuring" desc="LLC to S-Corp, etc." isMulti selected={multi.includes("restructure")} onClick={() => setMulti(p => p.includes("restructure") ? p.filter(v => v !== "restructure") : [...p, "restructure"])} />
                <OptionCard label="Estimated tax payments" isMulti selected={multi.includes("estimated")} onClick={() => setMulti(p => p.includes("estimated") ? p.filter(v => v !== "estimated") : [...p, "estimated"])} />
                <OptionCard label="Retirement planning" isMulti selected={multi.includes("retirement")} onClick={() => setMulti(p => p.includes("retirement") ? p.filter(v => v !== "retirement") : [...p, "retirement"])} />
                <OptionCard label="Real estate strategy" isMulti selected={multi.includes("realestate")} onClick={() => setMulti(p => p.includes("realestate") ? p.filter(v => v !== "realestate") : [...p, "realestate"])} />
                <OptionCard label="Other" isMulti selected={multi.includes("other")} onClick={() => setMulti(p => p.includes("other") ? p.filter(v => v !== "other") : [...p, "other"])} />
                <PrimaryButton onClick={() => go("contact_info")} disabled={!multi.length} style={{ marginTop: 24 }}>Continue</PrimaryButton>
              </div>
            )}

            {/* ── Contact info (for non-tax services: intro, bookkeeping, formation, strategic) ── */}
            {step === "contact_info" && (
              <div>
                <QuestionHeader step={stepIndex} total={totalSteps} question="Your contact information" sub="So Antonio can reach you." />
                <InputField label="Full name" placeholder="First and last" />
                <InputField label="Email" placeholder="you@email.com" type="email" />
                <InputField label="Phone" placeholder="(555) 555-5555" type="tel" />
                <PrimaryButton onClick={() => go("schedule")} style={{ marginTop: 20 }}>Continue</PrimaryButton>
              </div>
            )}

            {/* ── Schedule appointment ── */}
            {step === "schedule" && (
              <div>
                <QuestionHeader step={stepIndex} total={totalSteps} question="Schedule your appointment" sub="Pick a type and time that works for you." />
                <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
                  {["Phone", "Video", "In-Person"].map(tp => (
                    <button key={tp} onClick={() => setSel(tp)} style={{
                      flex: 1, padding: "11px", borderRadius: 12,
                      border: `1.5px solid ${sel === tp ? c.accent : c.border}`,
                      background: sel === tp ? c.accentLight : c.surface,
                      color: sel === tp ? c.accent : c.secondary,
                      fontSize: 13, fontWeight: 600, cursor: "pointer",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      transition: "all 0.15s",
                    }}>
                      {tp}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: c.dim, marginBottom: 12 }}>AVAILABLE THIS WEEK</div>
                {[
                  { day: "Mon, Apr 6", slots: ["9:00 AM", "11:30 AM", "2:00 PM"] },
                  { day: "Tue, Apr 7", slots: ["10:00 AM", "1:00 PM", "4:30 PM"] },
                  { day: "Wed, Apr 8", slots: ["9:00 AM", "3:00 PM"] },
                ].map(d => (
                  <div key={d.day} style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: c.text, marginBottom: 8 }}>{d.day}</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {d.slots.map(s => {
                        const k = `${d.day} ${s}`;
                        return (
                          <button key={k} onClick={() => setAnswers(a => ({ ...a, slot: k }))} style={{
                            padding: "9px 18px", borderRadius: 10,
                            border: `1.5px solid ${answers.slot === k ? c.accent : c.border}`,
                            background: answers.slot === k ? c.accentLight : c.surface,
                            color: answers.slot === k ? c.accent : c.text,
                            fontSize: 13, fontWeight: 600, cursor: "pointer",
                            fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.15s",
                          }}>{s}</button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <AntonioNote text="Pick whatever works. If none of these times work, message me and I'll open additional slots." />
                <PrimaryButton onClick={() => go("deposit")} disabled={!answers.slot} style={{ marginTop: 20 }}>Continue</PrimaryButton>
              </div>
            )}

            {/* ── Deposit payment (variable by service) ── */}
            {step === "deposit" && (() => {
              const depositAmounts: Record<string, number> = {
                simple: 50, complex: 50, business: 100,
                formation: 250, strategic: 125,
                intro: 0, bookkeeping: 0,
              };
              const deposit = depositAmounts[answers.service] ?? 50;
              const isFree = deposit === 0;
              return (
              <div>
                <QuestionHeader step={stepIndex} total={totalSteps} question={isFree ? "Confirm your appointment" : "Secure your appointment"} sub={isFree ? undefined : `$${deposit} deposit applied toward your final fee.`} />
                <div style={{
                  background: c.surface, border: `1.5px solid ${c.borderLight}`,
                  borderRadius: 14, padding: "18px 20px", marginBottom: 20,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: c.secondary }}>Appointment</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{answers.slot}</span>
                  </div>
                  {!isFree && (
                    <div style={{
                      display: "flex", justifyContent: "space-between",
                      paddingTop: 10, borderTop: `1px solid ${c.borderLight}`,
                    }}>
                      <span style={{ fontSize: 15, fontWeight: 600 }}>Deposit</span>
                      <span style={{ fontSize: 20, fontWeight: 700, color: c.accent }}>${deposit}.00</span>
                    </div>
                  )}
                </div>

                <div style={{
                  background: c.surface, border: `1.5px solid ${c.borderLight}`,
                  borderRadius: 14, padding: "20px", marginBottom: 14,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <svg width="20" height="14" viewBox="0 0 20 14" fill="none"><rect x=".5" y=".5" width="19" height="13" rx="2.5" stroke={c.accent} fill={c.accentLight} /><rect y="4" width="20" height="3" fill={c.accent} /></svg>
                    <span style={{ fontSize: 13, fontWeight: 600, color: c.text }}>Card Payment</span>
                    <span style={{ fontSize: 11, color: c.dim, marginLeft: "auto" }}>Powered by Stripe</span>
                  </div>
                  <InputField label="Cardholder name" placeholder="Name on card" />
                  <InputField label="Card number" placeholder="4242 4242 4242 4242" />
                  <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ flex: 1 }}><InputField label="Expiry" placeholder="MM/YY" /></div>
                    <div style={{ flex: 1 }}><InputField label="CVC" placeholder="123" /></div>
                  </div>
                </div>

                <div style={{
                  padding: "10px 14px", borderRadius: 10,
                  background: c.muted, marginBottom: 8,
                }}>
                  <p style={{ fontSize: 11, color: c.dim, lineHeight: 1.6, margin: 0 }}>
                    <strong style={{ color: c.secondary }}>Cancellation policy:</strong> Cancel 48+ hours before for a full refund. Late cancellations or no-shows forfeit the deposit.
                  </p>
                </div>
                <AntonioNote text={isFree ? "No charge for this consultation. Looking forward to our call!" : `The $${deposit} goes toward your final bill. Cancel 48 hours ahead and you get it right back.`} />
                <PrimaryButton onClick={() => go("legal")} style={{ marginTop: 20 }}>
                  {isFree ? "Confirm Appointment" : `Pay $${deposit} & Confirm`}
                </PrimaryButton>
              </div>
              );
            })()}

            {/* ── Step 13: Engagement + 7216 Consent (scroll-to-agree) ── */}
            {step === "legal" && !showDoc && (
              <div>
                <QuestionHeader step={stepIndex} total={totalSteps} question="Review &amp; authorize" sub="Federal law requires your agreement before I can work with your tax information." />

                {/* Engagement Letter */}
                <button onClick={() => { if (!engAgreed) { setShowDoc("engagement"); setDocScrolled(false); } }} style={{
                  width: "100%", textAlign: "left", padding: "18px 20px", borderRadius: 14, marginBottom: 12,
                  background: c.surface, border: `1.5px solid ${engAgreed ? c.accent : c.borderLight}`,
                  cursor: engAgreed ? "default" : "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
                  display: "flex", alignItems: "center", gap: 14,
                }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                    background: engAgreed ? c.accentLight : c.muted,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {engAgreed ? (
                      <svg width="18" height="18" viewBox="0 0 14 14" fill="none"><path d="M3 7L5.5 9.5L11 4" stroke={c.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    ) : <span style={{ fontSize: 20 }}>📋</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: engAgreed ? c.accent : c.text }}>Engagement Letter</div>
                    <div style={{ fontSize: 12, color: c.dim, marginTop: 2 }}>{engAgreed ? "Agreed — timestamp recorded" : "Tap to review and agree"}</div>
                  </div>
                  {!engAgreed && (
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke={c.dim} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  )}
                </button>

                {/* 7216 Consent */}
                <button onClick={() => { if (engAgreed && !s72Agreed) { setShowDoc("7216"); setDocScrolled(false); } }} style={{
                  width: "100%", textAlign: "left", padding: "18px 20px", borderRadius: 14, marginBottom: 12,
                  background: c.surface, border: `1.5px solid ${s72Agreed ? c.accent : c.borderLight}`,
                  cursor: !engAgreed ? "default" : s72Agreed ? "default" : "pointer",
                  opacity: !engAgreed && !s72Agreed ? 0.5 : 1,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  display: "flex", alignItems: "center", gap: 14,
                }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                    background: s72Agreed ? c.accentLight : c.muted,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {s72Agreed ? (
                      <svg width="18" height="18" viewBox="0 0 14 14" fill="none"><path d="M3 7L5.5 9.5L11 4" stroke={c.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    ) : <span style={{ fontSize: 20 }}>🔒</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: s72Agreed ? c.accent : c.text }}>IRC Section 7216 Consent</div>
                    <div style={{ fontSize: 12, color: c.dim, marginTop: 2 }}>
                      {s72Agreed ? "Authorized — timestamp recorded" : !engAgreed ? "Complete engagement letter first" : "Tap to review and authorize"}
                    </div>
                  </div>
                  {!s72Agreed && engAgreed && (
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke={c.dim} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  )}
                </button>

                <AntonioNote text="These protect both of us. Federal law requires your consent before I can prepare your return." />
                <PrimaryButton onClick={() => go("done")} disabled={!engAgreed || !s72Agreed} style={{ marginTop: 24 }}>Continue</PrimaryButton>
              </div>
            )}

            {/* ── Document modal (Engagement Letter) ── */}
            {showDoc === "engagement" && (
              <div style={{ position: "fixed", inset: 0, zIndex: 400, background: c.bg, display: "flex", flexDirection: "column" }}>
                <TopNav onBack={() => setShowDoc(null)} title="Engagement Letter" sub="Vazant Consulting" />
                <div
                  onScroll={e => {
                    const el = e.target as HTMLDivElement;
                    if (el.scrollHeight - el.scrollTop - el.clientHeight < 40) setDocScrolled(true);
                  }}
                  style={{ flex: 1, overflowY: "auto", padding: "24px 20px 32px" }}
                >
                  <h3 style={{ fontSize: 18, fontFamily: "'Fraunces', serif", fontWeight: 600, color: c.text, marginBottom: 16 }}>Engagement Letter</h3>
                  {[
                    ["1. Scope of Service", "The Preparer will prepare your individual income tax return (Form 1040) along with applicable schedules and forms based on the information you provide."],
                    ["2. Client Responsibilities", "You are responsible for providing complete, accurate, and timely information. This includes all income documents (W-2s, 1099s, K-1s), expense records, and prior year returns."],
                    ["3. Fees and Payment", "A non-refundable deposit of $50.00 is required to secure your appointment and will be applied toward the total fee. The remaining balance is due before the Form 8879 is released for signature."],
                    ["4. Cancellation Policy", "Appointments cancelled more than 48 hours in advance receive a full refund. Late cancellations or no-shows forfeit the deposit."],
                    ["5. Confidentiality", "Client information will be maintained in accordance with IRC Section 7216 and will not be disclosed without written consent."],
                    ["6. Electronic Filing", "By signing Form 8879, you authorize electronic filing. The Preparer will not file until you have reviewed, paid, and signed."],
                    ["7. Limitation of Liability", "The Preparer is not responsible for penalties resulting from incomplete or inaccurate information provided by the Client."],
                    ["8. Data Security", "All data is stored with AES-256 encryption at rest and TLS 1.2+ in transit. A Written Information Security Plan (WISP) is maintained per IRS Publication 4557."],
                    ["9. Term", "This engagement covers the 2025 tax year. Either party may terminate by written notice."],
                    ["10. Dispute Resolution", "Disputes shall be resolved through mediation before arbitration or litigation."],
                  ].map(([h, b], i) => (
                    <div key={i} style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 4 }}>{h}</div>
                      <p style={{ fontSize: 13.5, lineHeight: 1.8, color: c.secondary, margin: 0 }}>{b}</p>
                    </div>
                  ))}
                  <p style={{ fontSize: 13, fontStyle: "italic", color: c.dim, lineHeight: 1.6 }}>
                    By agreeing below, you confirm that you have read, understand, and agree to the terms above.
                  </p>
                  {!docScrolled && (
                    <div style={{ textAlign: "center", padding: "16px 0", color: c.dim, fontSize: 12 }}>↓ Scroll to bottom to continue</div>
                  )}
                </div>
                <div style={{ flexShrink: 0, padding: "12px 20px 20px", borderTop: `1px solid ${c.border}`, background: c.surface }}>
                  <PrimaryButton onClick={() => { setEngAgreed(true); setShowDoc(null); }} disabled={!docScrolled}>
                    {docScrolled ? "I Agree to the Engagement Letter" : "Scroll to bottom to agree"}
                  </PrimaryButton>
                </div>
              </div>
            )}

            {/* ── Document modal (7216 Consent) ── */}
            {showDoc === "7216" && (
              <div style={{ position: "fixed", inset: 0, zIndex: 400, background: c.bg, display: "flex", flexDirection: "column" }}>
                <TopNav onBack={() => setShowDoc(null)} title="IRC §7216 Consent" sub="Taxpayer Authorization" />
                <div
                  onScroll={e => {
                    const el = e.target as HTMLDivElement;
                    if (el.scrollHeight - el.scrollTop - el.clientHeight < 40) setDocScrolled(true);
                  }}
                  style={{ flex: 1, overflowY: "auto", padding: "24px 20px 32px" }}
                >
                  <h3 style={{ fontSize: 18, fontFamily: "'Fraunces', serif", fontWeight: 600, color: c.text, marginBottom: 16 }}>IRC Section 7216 — Taxpayer Consent</h3>
                  {[
                    ["Authorized Uses", "1. To prepare and file your federal and state returns for 2025.\n2. To communicate with taxing authorities on your behalf.\n3. To store and process your information using encrypted systems.\n4. To carry forward information for subsequent years, subject to renewed consent."],
                    ["Information Covered", "This consent applies to: name, SSN, date of birth, address, income records, deduction records, financial accounts, employment info, dependent info, and all other information necessary for tax preparation."],
                    ["Duration and Revocation", "Effective from signature date until December 31, 2026, or until revoked in writing. Revocation does not affect actions taken prior to revocation."],
                    ["Your Rights", "You are not required to sign this consent. However, without consent, the Preparer cannot prepare your return. Your information will not be disclosed to unidentified third parties."],
                    ["Penalties for Unauthorized Disclosure", "Unauthorized use or disclosure of tax return information is a violation of IRC Section 7216, punishable as a misdemeanor with fines up to $1,000 and up to one year imprisonment per violation."],
                  ].map(([h, b], i) => (
                    <div key={i} style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 4 }}>{h}</div>
                      <p style={{ fontSize: 13.5, lineHeight: 1.8, color: c.secondary, margin: 0, whiteSpace: "pre-wrap" }}>{b}</p>
                    </div>
                  ))}
                  <p style={{ fontSize: 13, fontStyle: "italic", color: c.dim, lineHeight: 1.6 }}>
                    By authorizing below, you consent to the use and disclosure of your tax return information as described above.
                  </p>
                  {!docScrolled && (
                    <div style={{ textAlign: "center", padding: "16px 0", color: c.dim, fontSize: 12 }}>↓ Scroll to bottom to continue</div>
                  )}
                </div>
                <div style={{ flexShrink: 0, padding: "12px 20px 20px", borderTop: `1px solid ${c.border}`, background: c.surface }}>
                  <PrimaryButton onClick={() => { setS72Agreed(true); setShowDoc(null); }} disabled={!docScrolled}>
                    {docScrolled ? "I Authorize This Consent" : "Scroll to bottom to authorize"}
                  </PrimaryButton>
                </div>
              </div>
            )}

            {/* ── Step 14: Done ── */}
            {step === "done" && (
              <div style={{ textAlign: "center", paddingTop: 24 }}>
                <div className="done-circle" style={{
                  width: 80, height: 80, borderRadius: "50%",
                  margin: "0 auto 20px", background: `linear-gradient(135deg, ${c.accent} 0%, ${c.accentDark} 100%)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 8px 24px ${c.accent}30`,
                }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                    <path className="done-check" d="M5 12L10 17L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2 className="done-title" style={{
                  fontSize: 28, fontFamily: "'Fraunces', serif",
                  fontWeight: 500, color: c.text, margin: "0 0 10px",
                }}>
                  You&apos;re all set!
                </h2>
                <p className="done-sub" style={{
                  fontSize: 14, color: c.secondary, lineHeight: 1.7,
                  margin: "0 0 28px",
                }}>
                  Antonio will review your information within 24&ndash;48 hours.
                </p>

                <div className="done-card" style={{
                  background: c.surface, border: `1.5px solid ${c.borderLight}`,
                  borderRadius: 14, padding: "20px", textAlign: "left", marginBottom: 20,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: c.dim, marginBottom: 14 }}>WHAT HAPPENS NEXT</div>
                  {[
                    { n: "1", text: "Antonio reviews your intake and documents", sub: "24-48 hours" },
                    { n: "2", text: `Your appointment: ${answers.slot || "TBD"}` },
                    { n: "3", text: "Return prepared and sent for your review" },
                    { n: "4", text: "Pay remaining balance, sign Form 8879, filed!" },
                  ].map((item, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "flex-start", gap: 12,
                      padding: "10px 0", borderTop: i ? `1px solid ${c.borderLight}` : "none",
                    }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                        background: c.accentLight, display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: 11, fontWeight: 700, color: c.accent,
                      }}>
                        {item.n}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: c.text }}>{item.text}</div>
                        {item.sub && <div style={{ fontSize: 11, color: c.dim, marginTop: 2 }}>{item.sub}</div>}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="done-note"><AntonioNote text="Thanks for trusting me with your taxes. I promise I'll make this painless. Talk soon!" /></div>
                <div className="done-btn"><PrimaryButton onClick={() => router.push("/clientportal")} style={{ marginTop: 24 }}>
                  Open Your Portal
                </PrimaryButton></div>
              </div>
            )}
          </div>
        </div>

        {/* Ask Antonio bar */}
        {step !== "welcome" && step !== "done" && <AskAntonioBar onClick={() => setAskAntonioOpen(true)} />}

        {/* Tutorial overlay */}
        {showTutorial && (
          <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div style={{ width: "100%", maxWidth: 380, background: c.surface, borderRadius: 24, overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.25)" }}>
              <div style={{ padding: "32px 28px 0", textAlign: "center" }}>
                {tutStep === 0 && (<>
                  <div style={{ width: 64, height: 64, borderRadius: 16, margin: "0 auto 20px", background: c.accentLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, color: c.accent }}>1</div>
                  <div style={{ fontSize: 20, fontFamily: "'Fraunces', serif", fontWeight: 600, color: c.text, marginBottom: 8 }}>Here&apos;s how this works</div>
                  <div style={{ fontSize: 14, color: c.secondary, lineHeight: 1.65, marginBottom: 20 }}>Simple questions. Most are just <strong style={{ color: c.text }}>tap to select</strong>.</div>
                  <div style={{ background: c.bg, borderRadius: 14, padding: "14px 16px", textAlign: "left", border: `1px solid ${c.borderLight}` }}>
                    <div style={{ fontSize: 11, color: c.dim, marginBottom: 8, fontWeight: 600 }}>EXAMPLE</div>
                    {["W-2 Employee", "Self-Employed"].map((l, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, marginBottom: 4, background: i === 0 ? c.accentLight : c.surface, border: `1.5px solid ${i === 0 ? c.accent : c.borderLight}` }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: i === 0 ? c.accent : c.dim }}>{i === 0 ? "W2" : "1099"}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: i === 0 ? c.accent : c.text }}>{l}</span>
                        <div style={{ marginLeft: "auto", width: 18, height: 18, borderRadius: "50%", background: i === 0 ? c.accent : "transparent", border: i === 0 ? "none" : `1.5px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {i === 0 && <svg width="10" height="10" viewBox="0 0 14 14" fill="none"><path d="M3 7L5.5 9.5L11 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                      </div>
                    ))}
                  </div>
                </>)}
                {tutStep === 1 && (<>
                  <div style={{ width: 64, height: 64, borderRadius: 16, margin: "0 auto 20px", background: c.warmLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, color: "#9A7245" }}>2</div>
                  <div style={{ fontSize: 20, fontFamily: "'Fraunces', serif", fontWeight: 600, color: c.text, marginBottom: 8 }}>Don&apos;t know the answer?</div>
                  <div style={{ fontSize: 14, color: c.secondary, lineHeight: 1.65, marginBottom: 20 }}>If you&apos;re stuck on <strong style={{ color: c.text }}>any question</strong>, tap the bar at the bottom.</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 14, background: c.bg, border: `1.5px solid ${c.borderLight}` }}>
                    <AntonioAvatar size={32} />
                    <span style={{ flex: 1, fontSize: 13, color: c.dim, textAlign: "left" }}>Not sure?</span>
                    <span style={{ padding: "5px 12px", borderRadius: 18, background: c.accent, color: "#fff", fontSize: 11, fontWeight: 600 }}>Ask Antonio</span>
                  </div>
                  <div style={{ fontSize: 12, color: c.accent, fontWeight: 600, marginTop: 10 }}>Always at the bottom</div>
                </>)}
                {tutStep === 2 && (<>
                  <div style={{ width: 64, height: 64, borderRadius: 16, margin: "0 auto 20px", background: c.accentLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, color: c.accent }}>3</div>
                  <div style={{ fontSize: 20, fontFamily: "'Fraunces', serif", fontWeight: 600, color: c.text, marginBottom: 8 }}>You&apos;re ready.</div>
                  <div style={{ fontSize: 14, color: c.secondary, lineHeight: 1.65, marginBottom: 16 }}>Answer what you can, skip what you can&apos;t, message me for anything.</div>
                  <div style={{ background: c.bg, borderRadius: 14, padding: "14px 16px", textAlign: "left", border: `1px solid ${c.borderLight}` }}>
                    {[{ i: "1", t: "Tap to select answers" }, { i: "2", t: "Message Antonio if unsure" }, { i: "3", t: "Upload docs now or later" }, { i: "4", t: "Progress saves automatically" }].map((x, j) => (
                      <div key={j} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: j ? `1px solid ${c.borderLight}` : "none" }}>
                        <span style={{ fontSize: 16 }}>{x.i}</span>
                        <span style={{ fontSize: 13, color: c.text, fontWeight: 500 }}>{x.t}</span>
                      </div>
                    ))}
                  </div>
                </>)}
              </div>
              <div style={{ padding: "16px 28px 28px" }}>
                <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 12 }}>
                  {[0, 1, 2].map(i => <div key={i} style={{ width: tutStep === i ? 20 : 6, height: 6, borderRadius: 3, background: tutStep === i ? c.accent : c.borderLight, transition: "all 0.25s" }} />)}
                </div>
                <PrimaryButton onClick={() => { if (tutStep < 2) setTutStep(tutStep + 1); else { setShowTutorial(false); go("service"); } }}>
                  {tutStep < 2 ? "Next" : "Let\u2019s Go"}
                </PrimaryButton>
                {tutStep < 2 && (
                  <button onClick={() => { setShowTutorial(false); go("service"); }} style={{ width: "100%", padding: "10px", borderRadius: 12, border: "none", background: "transparent", color: c.dim, fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", marginTop: 4 }}>
                    Skip tutorial
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Ask Antonio chat overlay */}
        {askAntonioOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 300, background: c.bg, display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto", animation: "sheetSlideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) both" }}>
            <style>{`@keyframes sheetSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", borderBottom: `1px solid ${c.borderLight}`, background: c.surface, flexShrink: 0 }}>
              <button onClick={() => setAskAntonioOpen(false)} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${c.border}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke={c.secondary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <div style={{ position: "relative" }}>
                <AntonioAvatar size={38} />
                <div style={{ position: "absolute", bottom: -1, right: -1, width: 10, height: 10, borderRadius: "50%", background: "#5CB176", border: `2px solid ${c.surface}` }} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: c.text }}>Antonio Vazquez</div>
                <div style={{ fontSize: 11, color: c.dim }}>Usually responds within a few hours</div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ padding: "14px 18px", borderRadius: "4px 16px 16px 16px", background: c.surface, border: `1px solid ${c.borderLight}`, maxWidth: "85%" }}>
                <p style={{ fontSize: 14, color: c.text, lineHeight: 1.7, margin: 0 }}>
                  If you&apos;re stuck on a question or not sure what to upload, just ask. I&apos;ll get back to you personally.
                </p>
                <div style={{ fontSize: 10, color: c.dim, marginTop: 6 }}>Antonio · Just now</div>
              </div>
              <div style={{ padding: "12px 16px", borderRadius: 14, background: c.warmLight, alignSelf: "center", maxWidth: "90%" }}>
                <p style={{ fontSize: 12, color: "#7A5C35", lineHeight: 1.6, margin: 0, textAlign: "center" }}>
                  Your message will be sent directly to Antonio. He&apos;ll respond via text or through your portal.
                </p>
              </div>
            </div>

            {/* Input */}
            <div style={{ flexShrink: 0, padding: "12px 20px 24px", borderTop: `1px solid ${c.borderLight}`, background: c.surface }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  value={askInput}
                  onChange={e => setAskInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && askInput.trim()) {
                      setAskInput("");
                      setTimeout(() => setAskAntonioOpen(false), 300);
                    }
                  }}
                  placeholder="Type your question..."
                  autoFocus
                    style={{
                      flex: 1, padding: "12px 16px", borderRadius: 14,
                      border: `1.5px solid ${c.borderLight}`, background: c.bg,
                      fontSize: 14, color: c.text, outline: "none",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  />
                  <button onClick={() => { if (askInput.trim()) { setAskInput(""); setTimeout(() => setAskAntonioOpen(false), 300); } }} style={{
                    width: 42, height: 42, borderRadius: 12, border: "none",
                    background: askInput.trim() ? c.accent : c.borderLight,
                    color: askInput.trim() ? "#fff" : c.dim,
                    cursor: askInput.trim() ? "pointer" : "default",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
        )}
      </div>
    );
  }




  // Post-intake: redirect to the full client portal
  router.push("/clientportal");
  return null;
}

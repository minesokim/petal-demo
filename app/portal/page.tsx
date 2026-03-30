"use client";

import { useState, useRef, useEffect } from "react";

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
      cursor: "pointer", textAlign: "left", fontFamily: "'DM Sans', sans-serif",
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
          fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
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
      border: "none", fontFamily: "'DM Sans', sans-serif",
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
          color: c.secondary, fontFamily: "'DM Sans', sans-serif",
        }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: c.text, fontFamily: "'Fraunces', serif" }}>{title}</div>
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
        cursor: "pointer",
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
          fontFamily: "'DM Sans', sans-serif",
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
export default function ClientPortal() {
  const [mode, setMode] = useState<"intake" | "portal">("intake");
  const [step, setStep] = useState(0);
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
  const scrollRef = useRef<HTMLDivElement>(null);

  const totalSteps = 14;

  const go = (nextStep: number) => {
    const updated = { ...answers };
    if (sel !== null) updated[`step_${step}`] = sel;
    if (multi.length) updated[`step_${step}`] = multi;
    setAnswers(updated);
    setStep(nextStep);
    setSel(null);
    setMulti([]);
    scrollRef.current?.scrollTo(0, 0);
  };

  const back = () => {
    if (step > 0) {
      setStep(step - 1);
      setSel(null);
      setMulti([]);
    }
  };

  // ─── INTAKE FLOW ───
  if (mode === "intake") {
    return (
      <div style={{
        height: "100vh", display: "flex", flexDirection: "column",
        background: c.bg, maxWidth: 480, margin: "0 auto",
      }}>
        {/* Top nav (skip on welcome + done screens) */}
        {step > 0 && step < totalSteps && (
          <TopNav
            onBack={back}
            title="Vazant Consulting"
            sub="New Client Intake"
            right={<ProgressBar current={step} total={totalSteps} />}
          />
        )}

        {/* Scrollable content */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto" }}>
          <div style={{
            maxWidth: 560, width: "100%", margin: "0 auto",
            padding: step === 0 ? "0" : "32px 24px 40px",
          }}>

            {/* ── Step 0: Welcome ── */}
            {step === 0 && (
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

                  <p style={{ fontSize: 12, color: c.dim, marginTop: 12 }}>
                    Your information is never shared or sold.
                  </p>
                </div>
              </div>
            )}

            {/* ── Step 1: Service tier (matches Calendly) ── */}
            {step === 1 && (
              <div>
                <QuestionHeader step={1} total={totalSteps} question="What brings you in?" sub="Select the service that best fits your needs." />
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: c.dim, marginBottom: 8 }}>TAX PREPARATION</div>
                <OptionCard label="Simple Tax Return" desc="W-2 income, limited deductions, standard filing" price="Starting at $150" icon="📄" selected={sel === "simple"} onClick={() => setSel("simple")} />
                <OptionCard label="Complex Return" desc="Self-employment, rentals, investments, itemized deductions" price="Starting at $350" icon="📊" selected={sel === "complex"} onClick={() => setSel("complex")} />
                <OptionCard label="Business Tax Return" desc="S-Corp, LLC, C-Corp, partnership returns" price="Starting at $500" icon="🏢" selected={sel === "business"} onClick={() => setSel("business")} />
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: c.dim, marginBottom: 8, marginTop: 20 }}>OTHER SERVICES</div>
                <OptionCard label="Introductory Consultation" desc="Free session to explore your options" icon="👋" selected={sel === "intro"} onClick={() => setSel("intro")} />
                <OptionCard label="Business Formation" desc="LLC, S-Corp, C-Corp setup and registration" icon="🏗️" selected={sel === "formation"} onClick={() => setSel("formation")} />
                <OptionCard label="Bookkeeping Consultation" desc="Clarity around your bookkeeping needs" icon="📒" selected={sel === "bookkeeping"} onClick={() => setSel("bookkeeping")} />
                <OptionCard label="Strategic Tax & Business Consultation" desc="In-depth guidance on tax and business matters" icon="🎯" selected={sel === "strategic"} onClick={() => setSel("strategic")} />
                <AntonioNote text="Not sure where to start? The Introductory Consultation is free and I'll point you in the right direction." />
                <PrimaryButton onClick={() => go(2)} disabled={!sel} style={{ marginTop: 24 }}>Continue</PrimaryButton>
              </div>
            )}

            {/* ── Step 2: Filing status ── */}
            {step === 2 && (
              <div>
                <QuestionHeader step={2} total={totalSteps} question="What's your filing status?" sub="This determines your tax rates and standard deduction." />
                <OptionCard label="Single" desc="Unmarried or legally separated" selected={sel === "single"} onClick={() => setSel("single")} />
                <OptionCard label="Married Filing Jointly" desc="Most common for married couples" selected={sel === "mfj"} onClick={() => setSel("mfj")} />
                <OptionCard label="Married Filing Separately" selected={sel === "mfs"} onClick={() => setSel("mfs")} />
                <OptionCard label="Head of Household" desc="Unmarried with qualifying dependents" selected={sel === "hoh"} onClick={() => setSel("hoh")} />
                <OptionCard label="Qualifying Surviving Spouse" selected={sel === "qw"} onClick={() => setSel("qw")} />
                <AntonioNote text="If you're not sure between Head of Household and Single, pick what sounds right. I'll verify during my review." />
                <PrimaryButton onClick={() => go(sel === "mfj" || sel === "mfs" ? 3 : 4)} disabled={!sel} style={{ marginTop: 24 }}>Continue</PrimaryButton>
              </div>
            )}

            {/* ── Step 3: Spouse info (conditional) ── */}
            {step === 3 && (
              <div>
                <QuestionHeader step={3} total={totalSteps} question="Tell me about your spouse." sub="Basic info for the joint return." />
                <InputField label="Spouse's full legal name" placeholder="First and last name" />
                <InputField label="Date of birth" placeholder="MM/DD/YYYY" type="date" />
                <InputField label="Social Security Number" placeholder="XXX-XX-XXXX" />
                <InputField label="Occupation" placeholder="e.g., Teacher, Nurse, Engineer" />
                <AntonioNote text="Your SSN is encrypted the moment you type it. I only see the last 4 digits until I'm actively preparing your return." />
                <PrimaryButton onClick={() => go(4)} style={{ marginTop: 16 }}>Continue</PrimaryButton>
              </div>
            )}

            {/* ── Step 4: Your info ── */}
            {step === 4 && (
              <div>
                <QuestionHeader step={4} total={totalSteps} question="Your basic information" sub="This goes directly onto your return." />
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
                <PrimaryButton onClick={() => go(5)} style={{ marginTop: 16 }}>Continue</PrimaryButton>
              </div>
            )}

            {/* ── Step 5: Dependents ── */}
            {step === 5 && (
              <div>
                <QuestionHeader step={5} total={totalSteps} question="Do you have any dependents?" sub="Children, elderly parents, or anyone who depends on you financially." />
                <OptionCard label="No dependents" selected={sel === "none"} onClick={() => setSel("none")} />
                <OptionCard label="1 dependent" selected={sel === "1"} onClick={() => setSel("1")} />
                <OptionCard label="2 dependents" selected={sel === "2"} onClick={() => setSel("2")} />
                <OptionCard label="3 or more" selected={sel === "3+"} onClick={() => setSel("3+")} />
                <AntonioNote text="Dependents unlock credits like the Child Tax Credit ($2,000+ per child). Even if you're not sure someone qualifies, mention them." />
                <PrimaryButton onClick={() => go(sel === "none" ? 7 : 6)} disabled={!sel} style={{ marginTop: 24 }}>Continue</PrimaryButton>
              </div>
            )}

            {/* ── Step 6: Dependent details ── */}
            {step === 6 && (
              <div>
                <QuestionHeader step={6} total={totalSteps} question="Tell me about your dependents" sub="Just the basics. I'll sort out who qualifies." />
                {[1, 2].map(i => (
                  <div key={i} style={{
                    padding: "18px 20px", borderRadius: 14, marginBottom: 12,
                    background: c.surface, border: `1.5px solid ${c.borderLight}`,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: c.dim, marginBottom: 14, letterSpacing: "0.06em" }}>DEPENDENT {i}</div>
                    <InputField label="Full name" placeholder="First and last" />
                    <InputField label="Date of birth" placeholder="MM/DD/YYYY" type="date" />
                    <InputField label="Relationship" placeholder="e.g., Son, Daughter, Parent" />
                    <InputField label="Months living with you in 2025" placeholder="e.g., 12" />
                  </div>
                ))}
                <AntonioNote text="If you have a child under 13 and pay for daycare, that's a big credit we don't want to miss." />
                <PrimaryButton onClick={() => go(7)} style={{ marginTop: 16 }}>Continue</PrimaryButton>
              </div>
            )}

            {/* ── Step 7: Income types ── */}
            {step === 7 && (
              <div>
                <QuestionHeader step={7} total={totalSteps} question="How do you earn income?" sub="Select all that apply." />
                {[
                  { value: "w2", label: "W-2 Employee", icon: "🏢", desc: "Regular paycheck from an employer" },
                  { value: "self", label: "Self-Employed / 1099", icon: "💻", desc: "Freelance, gig work, contracting" },
                  { value: "rental", label: "Rental Property", icon: "🏠", desc: "Income from property you own" },
                  { value: "invest", label: "Investments / Crypto", icon: "📈", desc: "Stocks, crypto, capital gains" },
                  { value: "retire", label: "Retirement / Social Security", icon: "🏖️", desc: "Pension, IRA distributions, SSA" },
                ].map(o => (
                  <OptionCard
                    key={o.value} label={o.label} desc={o.desc} icon={o.icon} isMulti
                    selected={multi.includes(o.value)}
                    onClick={() => setMulti(p => p.includes(o.value) ? p.filter(v => v !== o.value) : [...p, o.value])}
                  />
                ))}
                <AntonioNote text="Don't overthink this. If you got paid for it, select it. I'll sort out the forms." />
                <PrimaryButton
                  onClick={() => { setAnswers(a => ({ ...a, income: multi })); go(8); }}
                  disabled={!multi.length}
                  style={{ marginTop: 24 }}
                >
                  Continue
                </PrimaryButton>
              </div>
            )}

            {/* ── Step 8: Tax questions ── */}
            {step === 8 && (
              <div>
                <QuestionHeader step={8} total={totalSteps} question="A few quick tax questions" sub="These help me plan your return before we even meet." />
                <OptionCard label="Did you transact in digital assets?" desc="Crypto, NFTs, stablecoins — even small airdrops count" isMulti selected={multi.includes("crypto")} onClick={() => setMulti(p => p.includes("crypto") ? p.filter(v => v !== "crypto") : [...p, "crypto"])} />
                <OptionCard label="Did you make estimated tax payments?" desc="Quarterly payments to the IRS" isMulti selected={multi.includes("estimated")} onClick={() => setMulti(p => p.includes("estimated") ? p.filter(v => v !== "estimated") : [...p, "estimated"])} />
                <OptionCard label="Did you have health insurance all year?" desc="Through employer, marketplace, or Medicare" isMulti selected={multi.includes("health")} onClick={() => setMulti(p => p.includes("health") ? p.filter(v => v !== "health") : [...p, "health"])} />
                <OptionCard label="Did you contribute to an IRA or HSA?" desc="Traditional IRA, Roth IRA, or Health Savings Account" isMulti selected={multi.includes("ira")} onClick={() => setMulti(p => p.includes("ira") ? p.filter(v => v !== "ira") : [...p, "ira"])} />
                <AntonioNote text="The digital assets question is on the front page of the 1040 now. The IRS is watching this closely." />
                <PrimaryButton onClick={() => go(9)} style={{ marginTop: 24 }}>Continue</PrimaryButton>
              </div>
            )}

            {/* ── Step 9: Deductions ── */}
            {step === 9 && (
              <div>
                <QuestionHeader step={9} total={totalSteps} question="Quick check on deductions" sub="Select anything that might apply. When in doubt, select it." />
                {[
                  { value: "mortgage", label: "Home mortgage", icon: "🏡" },
                  { value: "student", label: "Student loans", icon: "🎓" },
                  { value: "charity", label: "Charitable donations", icon: "❤️" },
                  { value: "childcare", label: "Childcare costs", icon: "👶" },
                  { value: "medical", label: "Medical expenses", icon: "🏥" },
                  { value: "education", label: "Education / tuition", icon: "📚" },
                  { value: "educator", label: "Educator expenses", icon: "🍎", desc: "K-12 teacher supplies (up to $300)" },
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
                  onClick={() => { setAnswers(a => ({ ...a, deductions: multi })); go(10); }}
                  disabled={!multi.length}
                  style={{ marginTop: 24 }}
                >
                  Continue
                </PrimaryButton>
              </div>
            )}

            {/* ── Step 10: Refund preference ── */}
            {step === 10 && (
              <div>
                <QuestionHeader step={10} total={totalSteps} question="Refund preference" sub="If you're owed a refund, how would you like to receive it?" />
                <OptionCard label="Direct deposit (fastest)" desc="Refund arrives in 10-21 days" icon="🏦" selected={sel === "direct"} onClick={() => setSel("direct")} />
                <OptionCard label="Paper check by mail" desc="Takes 4-6 weeks" icon="📬" selected={sel === "check"} onClick={() => setSel("check")} />
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
                <PrimaryButton onClick={() => go(11)} disabled={!sel} style={{ marginTop: 24 }}>Continue</PrimaryButton>
              </div>
            )}

            {/* ── Step 11: Schedule appointment ── */}
            {step === 11 && (
              <div>
                <QuestionHeader step={11} total={totalSteps} question="Schedule your appointment" sub="Pick a type and time that works for you." />
                <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
                  {["Phone", "Video", "In-Person"].map(tp => (
                    <button key={tp} onClick={() => setSel(tp)} style={{
                      flex: 1, padding: "11px", borderRadius: 12,
                      border: `1.5px solid ${sel === tp ? c.accent : c.border}`,
                      background: sel === tp ? c.accentLight : c.surface,
                      color: sel === tp ? c.accent : c.secondary,
                      fontSize: 13, fontWeight: 600, cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                      transition: "all 0.15s",
                    }}>
                      {tp === "Phone" ? "📞" : tp === "Video" ? "💻" : "🏢"} {tp}
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
                            fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
                          }}>{s}</button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <AntonioNote text="Pick whatever works. If none of these times work, message me and I'll open additional slots." />
                <PrimaryButton onClick={() => go(12)} disabled={!answers.slot} style={{ marginTop: 20 }}>Continue</PrimaryButton>
              </div>
            )}

            {/* ── Step 12: Deposit payment ── */}
            {step === 12 && (
              <div>
                <QuestionHeader step={12} total={totalSteps} question="Secure your appointment" sub="$50 deposit applied toward your final fee." />
                <div style={{
                  background: c.surface, border: `1.5px solid ${c.borderLight}`,
                  borderRadius: 14, padding: "18px 20px", marginBottom: 20,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: c.secondary }}>Appointment</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{answers.slot}</span>
                  </div>
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    paddingTop: 10, borderTop: `1px solid ${c.borderLight}`,
                  }}>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>Deposit</span>
                    <span style={{ fontSize: 20, fontWeight: 700, color: c.accent, fontFamily: "'Fraunces', serif" }}>$50.00</span>
                  </div>
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
                <AntonioNote text="The $50 goes toward your final bill. Cancel 48 hours ahead and you get it right back." />
                <PrimaryButton onClick={() => go(13)} style={{ marginTop: 20 }}>Pay $50 &amp; Confirm</PrimaryButton>
              </div>
            )}

            {/* ── Step 13: Engagement + 7216 Consent (scroll-to-agree) ── */}
            {step === 13 && !showDoc && (
              <div>
                <QuestionHeader step={13} total={totalSteps} question="Review &amp; authorize" sub="Federal law requires your agreement before I can work with your tax information." />

                {/* Engagement Letter */}
                <button onClick={() => { if (!engAgreed) { setShowDoc("engagement"); setDocScrolled(false); } }} style={{
                  width: "100%", textAlign: "left", padding: "18px 20px", borderRadius: 14, marginBottom: 12,
                  background: c.surface, border: `1.5px solid ${engAgreed ? c.accent : c.borderLight}`,
                  cursor: engAgreed ? "default" : "pointer", fontFamily: "'DM Sans', sans-serif",
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
                  fontFamily: "'DM Sans', sans-serif",
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
                <PrimaryButton onClick={() => go(14)} disabled={!engAgreed || !s72Agreed} style={{ marginTop: 24 }}>Continue</PrimaryButton>
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
            {step === 14 && (
              <div style={{ textAlign: "center", paddingTop: 24 }}>
                <div style={{
                  width: 72, height: 72, borderRadius: "50%",
                  margin: "0 auto 20px", background: c.accentLight,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="32" height="32" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7L5.5 9.5L11 4" stroke={c.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2 style={{
                  fontSize: 28, fontFamily: "'Fraunces', serif",
                  fontWeight: 500, color: c.text, margin: "0 0 10px",
                }}>
                  You&apos;re all set!
                </h2>
                <p style={{
                  fontSize: 14, color: c.secondary, lineHeight: 1.7,
                  margin: "0 0 28px",
                }}>
                  Antonio will review your information within 24&ndash;48 hours.
                </p>

                <div style={{
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

                <AntonioNote text="Thanks for trusting me with your taxes. I promise I'll make this painless. Talk soon!" />
                <PrimaryButton onClick={() => { setMode("portal"); setTab("home"); }} style={{ marginTop: 24 }}>
                  Open Your Portal
                </PrimaryButton>
              </div>
            )}
          </div>
        </div>

        {/* Ask Antonio bar */}
        {step > 0 && step < 14 && <AskAntonioBar onClick={() => setAskAntonioOpen(true)} />}

        {/* Tutorial overlay */}
        {showTutorial && (
          <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div style={{ width: "100%", maxWidth: 380, background: c.surface, borderRadius: 24, overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.25)" }}>
              <div style={{ padding: "32px 28px 0", textAlign: "center" }}>
                {tutStep === 0 && (<>
                  <div style={{ width: 64, height: 64, borderRadius: 16, margin: "0 auto 20px", background: c.accentLight, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 30 }}>👋</span></div>
                  <div style={{ fontSize: 20, fontFamily: "'Fraunces', serif", fontWeight: 600, color: c.text, marginBottom: 8 }}>Here&apos;s how this works</div>
                  <div style={{ fontSize: 14, color: c.secondary, lineHeight: 1.65, marginBottom: 20 }}>Simple questions. Most are just <strong style={{ color: c.text }}>tap to select</strong>.</div>
                  <div style={{ background: c.bg, borderRadius: 14, padding: "14px 16px", textAlign: "left", border: `1px solid ${c.borderLight}` }}>
                    <div style={{ fontSize: 11, color: c.dim, marginBottom: 8, fontWeight: 600 }}>EXAMPLE</div>
                    {["W-2 Employee", "Self-Employed"].map((l, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, marginBottom: 4, background: i === 0 ? c.accentLight : c.surface, border: `1.5px solid ${i === 0 ? c.accent : c.borderLight}` }}>
                        <span style={{ fontSize: 16 }}>{i === 0 ? "🏢" : "💻"}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: i === 0 ? c.accent : c.text }}>{l}</span>
                        <div style={{ marginLeft: "auto", width: 18, height: 18, borderRadius: "50%", background: i === 0 ? c.accent : "transparent", border: i === 0 ? "none" : `1.5px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {i === 0 && <svg width="10" height="10" viewBox="0 0 14 14" fill="none"><path d="M3 7L5.5 9.5L11 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                      </div>
                    ))}
                  </div>
                </>)}
                {tutStep === 1 && (<>
                  <div style={{ width: 64, height: 64, borderRadius: 16, margin: "0 auto 20px", background: c.warmLight, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 30 }}>🤔</span></div>
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
                  <div style={{ width: 64, height: 64, borderRadius: 16, margin: "0 auto 20px", background: c.accentLight, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 30 }}>✨</span></div>
                  <div style={{ fontSize: 20, fontFamily: "'Fraunces', serif", fontWeight: 600, color: c.text, marginBottom: 8 }}>You&apos;re ready.</div>
                  <div style={{ fontSize: 14, color: c.secondary, lineHeight: 1.65, marginBottom: 16 }}>Answer what you can, skip what you can&apos;t, message me for anything.</div>
                  <div style={{ background: c.bg, borderRadius: 14, padding: "14px 16px", textAlign: "left", border: `1px solid ${c.borderLight}` }}>
                    {[{ i: "👆", t: "Tap to select answers" }, { i: "💬", t: "Message Antonio if unsure" }, { i: "📄", t: "Upload docs now or later" }, { i: "💾", t: "Progress saves automatically" }].map((x, j) => (
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
                <PrimaryButton onClick={() => { if (tutStep < 2) setTutStep(tutStep + 1); else { setShowTutorial(false); setStep(1); } }}>
                  {tutStep < 2 ? "Next" : "Let\u2019s Go"}
                </PrimaryButton>
                {tutStep < 2 && (
                  <button onClick={() => { setShowTutorial(false); setStep(1); }} style={{ width: "100%", padding: "10px", borderRadius: 12, border: "none", background: "transparent", color: c.dim, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginTop: 4 }}>
                    Skip tutorial
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Ask Antonio chat overlay */}
        {askAntonioOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end" }}>
            <div style={{ width: "100%", maxWidth: 480, margin: "0 auto", background: c.surface, borderRadius: "24px 24px 0 0", maxHeight: "70vh", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <AntonioAvatar size={34} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: c.text, fontFamily: "'Fraunces', serif" }}>Ask Antonio</div>
                    <div style={{ fontSize: 11, color: c.dim }}>Usually responds within a few hours</div>
                  </div>
                </div>
                <button onClick={() => setAskAntonioOpen(false)} style={{ border: "none", background: "transparent", fontSize: 24, color: c.dim, cursor: "pointer" }}>&times;</button>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 16px" }}>
                <div style={{ padding: "14px 16px", borderRadius: 14, background: c.warmLight, marginBottom: 12 }}>
                  <p style={{ fontSize: 13, color: "#7A5C35", lineHeight: 1.6, margin: 0, fontStyle: "italic" }}>
                    &ldquo;If you&apos;re stuck on a question or not sure what to upload, just ask. I&apos;ll get back to you personally.&rdquo;
                  </p>
                </div>
              </div>

              <div style={{ padding: "10px 20px 20px", borderTop: `1px solid ${c.borderLight}` }}>
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
                      fontFamily: "'DM Sans', sans-serif",
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
          </div>
        )}
      </div>
    );
  }

  // ─── PORTAL (post-intake) ───
  const [chatInput, setChatInput] = useState("");
  const [chatMsgs, setChatMsgs] = useState([
    { from: "antonio" as const, text: "Got your documents! Starting my review. I'll reach out if I have questions. 👍", time: "10:02 AM" },
  ]);
  const [docFolder, setDocFolder] = useState<string | null>(null);

  const portalFolders = [
    { id: "uploads", name: "My Uploads", count: 3, icon: "📤", color: c.accentLight, files: [
      { name: "W-2 Riverside Medical.pdf", date: "Mar 24", size: "245 KB", status: "ok" },
      { name: "Drivers_License.jpg", date: "Mar 24", size: "1.2 MB", status: "ok" },
      { name: "1099-NEC_Freelance.pdf", date: "Mar 25", size: "89 KB", status: "ok" },
    ]},
    { id: "needed", name: "Still Needed", count: 2, icon: "⏳", color: c.warmLight, files: [
      { name: "1099-INT from Chase Bank", status: "pending" },
      { name: "Business expense records", status: "pending" },
    ]},
    { id: "returns", name: "Tax Returns", count: 1, icon: "📊", color: c.blueLight, files: [
      { name: "2025_Federal_Return.pdf", date: "Apr 8", size: "1.8 MB", status: "ok" },
    ]},
    { id: "agreements", name: "Agreements", count: 2, icon: "📝", color: c.muted, files: [
      { name: "Engagement Letter 2025.pdf", date: "Mar 27", size: "156 KB", status: "signed" },
      { name: "7216 Consent.pdf", date: "Mar 27", size: "92 KB", status: "signed" },
    ]},
  ];

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim().toLowerCase();
    setChatMsgs(p => [...p, { from: "client" as const, text: chatInput.trim(), time: "Now" }]);
    setChatInput("");

    // System auto-responses
    const checks = [
      { kw: ["appointment", "meeting", "schedule", "call", "when"], response: { from: "system" as const, text: `Your appointment: ${answers.slot || "Mon, Apr 6 · 9:00 AM"} — Phone call with Antonio.`, time: "" } },
      { kw: ["document", "need", "missing", "upload", "what else"], response: { from: "system" as const, text: "Still needed: 1099-INT from Chase Bank, Business expense records. You've uploaded 3 of 5 documents.", time: "" } },
      { kw: ["status", "where", "progress", "return", "update"], response: { from: "system" as const, text: "Your return status: Ready for Your Review. Antonio finished preparing your return. Review it and let him know if you have questions.", time: "" } },
      { kw: ["pay", "cost", "fee", "balance", "owe", "invoice"], response: { from: "system" as const, text: "Payment summary: $50 deposit paid. Remaining balance: $300. Total fee: $350. Payment is due before Form 8879 signing.", time: "" } },
    ];
    const match = checks.find(ch => ch.kw.some(k => msg.includes(k)));

    if (match) {
      setTimeout(() => setChatMsgs(p => [...p, match.response]), 600);
      setTimeout(() => setChatMsgs(p => [...p, { from: "system" as const, text: "This info is from your account. Antonio will follow up personally if needed.", time: "" }]), 900);
    } else {
      setTimeout(() => setChatMsgs(p => [...p, { from: "system" as const, text: "Message sent to Antonio. He usually responds within a few hours.", time: "" }]), 800);
    }
  };

  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      background: c.bg, maxWidth: 480, margin: "0 auto",
    }}>
      {/* Portal content */}
      <div style={{ flex: 1, overflowY: tab === "messages" ? "hidden" : "auto", display: "flex", flexDirection: "column" }}>
        {tab === "home" && (
          <div style={{ padding: "24px 20px 32px" }}>
            {/* Personalized greeting */}
            <div style={{ fontSize: 14, color: c.dim, marginBottom: 4 }}>Good morning,</div>
            <div style={{ fontSize: 24, fontFamily: "'Fraunces', serif", fontWeight: 600, color: c.text, marginBottom: 20 }}>Maria</div>

            {/* Status banner */}
            <div style={{
              background: `linear-gradient(135deg, ${c.accent} 0%, ${c.accentDark} 100%)`,
              borderRadius: 18, padding: "20px 22px", marginBottom: 20, color: "#fff",
            }}>
              <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 2 }}>2025 TAX RETURN</div>
              <div style={{ fontSize: 17, fontWeight: 600, fontFamily: "'Fraunces', serif" }}>Ready for Your Review</div>
              <div style={{ height: 4, borderRadius: 4, background: "rgba(255,255,255,0.15)", marginTop: 12 }}>
                <div style={{ width: "70%", height: "100%", borderRadius: 4, background: "#6ECB8B" }} />
              </div>
            </div>

            {/* Action needed */}
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: c.dim, marginBottom: 10 }}>ACTION NEEDED</div>
            {[
              { label: "Sign Form 8879", desc: "e-file authorization required", icon: "✍️", toTab: "sign" },
              { label: "Pay remaining balance", desc: "$300.00 due", icon: "💳" },
            ].map((a, i) => (
              <div key={i} onClick={() => a.toTab && setTab(a.toTab)} style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "14px 16px", borderRadius: 14, marginBottom: 8,
                background: c.surface, border: `1.5px solid ${c.warm}`,
                cursor: a.toTab ? "pointer" : "default",
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: c.warmLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{a.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: c.text }}>{a.label}</div>
                  <div style={{ fontSize: 12, color: c.dim }}>{a.desc}</div>
                </div>
                <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: c.warmLight, color: "#9A7245" }}>Action</span>
              </div>
            ))}

            {/* Appointment */}
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: c.dim, marginTop: 24, marginBottom: 10 }}>UPCOMING</div>
            <div style={{ padding: "16px 18px", borderRadius: 14, background: c.surface, border: `1px solid ${c.borderLight}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 24 }}>📞</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: c.text }}>Meeting with Antonio</div>
                  <div style={{ fontSize: 12, color: c.dim }}>{answers.slot || "Mon, Apr 6 · 9:00 AM"} &middot; Phone</div>
                </div>
              </div>
            </div>

            {/* Return progress */}
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: c.dim, marginTop: 24, marginBottom: 14 }}>RETURN PROGRESS</div>
            <div style={{ background: c.surface, border: `1px solid ${c.borderLight}`, borderRadius: 16, padding: "20px 18px" }}>
              <StatusTracker steps={[
                { label: "Intake Complete", done: true },
                { label: "Documents Received", done: true },
                { label: "Under Review", done: true },
                { label: "Being Prepared", done: true },
                { label: "Ready for Your Review", active: true },
                { label: "Pay & Sign", done: false },
                { label: "Filed with IRS", done: false },
                { label: "Complete", done: false },
              ]} />
            </div>

            <AntonioNote text="I've finished your return and it looks great. Take a look when you get a chance. No rush — but the sooner we sign, the sooner it's filed." />
          </div>
        )}

        {tab === "docs" && (
          <div style={{ padding: "24px 20px 32px" }}>
            {docFolder ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                  <button onClick={() => setDocFolder(null)} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${c.border}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: c.secondary, fontFamily: "'DM Sans', sans-serif" }}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                  <h2 style={{ fontSize: 18, fontFamily: "'Fraunces', serif", fontWeight: 600, color: c.text, margin: 0 }}>
                    {portalFolders.find(f => f.id === docFolder)?.name}
                  </h2>
                </div>
                {portalFolders.find(f => f.id === docFolder)?.files.map((fl, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 14, marginBottom: 6, background: c.surface, border: `1px solid ${c.borderLight}` }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: fl.status === "pending" ? c.warmLight : fl.status === "signed" ? c.accentLight : c.muted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                      {fl.status === "pending" ? "⏳" : fl.status === "signed" ? "✍️" : "📄"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: c.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fl.name}</div>
                      <div style={{ fontSize: 11, color: c.dim, marginTop: 2 }}>{"date" in fl && fl.date ? `${fl.date} · ${"size" in fl ? fl.size : ""}` : "Waiting for upload"}</div>
                    </div>
                    {fl.status === "pending" ? (
                      <button style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${c.accent}`, background: "transparent", color: c.accent, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Upload</button>
                    ) : (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${c.border}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>👁</button>
                        <button style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${c.border}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⬇</button>
                      </div>
                    )}
                  </div>
                ))}
              </>
            ) : (
              <>
                <h2 style={{ fontSize: 22, fontFamily: "'Fraunces', serif", fontWeight: 600, color: c.text, margin: "0 0 4px" }}>Documents</h2>
                <p style={{ fontSize: 13, color: c.dim, margin: "0 0 20px" }}>Your secure tax file cabinet</p>
                <div style={{ padding: "20px 16px", borderRadius: 16, border: `2px dashed ${c.border}`, background: c.surface, textAlign: "center", marginBottom: 20, cursor: "pointer" }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>📸</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: c.text }}>Upload or scan</div>
                  <div style={{ fontSize: 12, color: c.dim, marginTop: 2 }}>Photos from your phone work great</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {portalFolders.map(f => (
                    <div key={f.id} onClick={() => setDocFolder(f.id)} style={{ padding: "18px 16px", borderRadius: 16, cursor: "pointer", background: c.surface, border: `1px solid ${c.borderLight}` }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, marginBottom: 10, background: f.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{f.icon}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: c.text }}>{f.name}</div>
                      <div style={{ fontSize: 12, color: c.dim, marginTop: 2 }}>{f.count} files</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {tab === "messages" && (
          <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            {/* Chat header */}
            <div style={{ padding: "14px 20px", borderBottom: `1px solid ${c.borderLight}`, display: "flex", alignItems: "center", gap: 12, background: c.surface, flexShrink: 0 }}>
              <div style={{ position: "relative" }}>
                <AntonioAvatar size={38} />
                <div style={{ position: "absolute", bottom: -1, right: -1, width: 10, height: 10, borderRadius: "50%", background: "#5CB176", border: `2px solid ${c.surface}` }} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: c.text, fontFamily: "'Fraunces', serif" }}>Antonio Vazquez</div>
                <div style={{ fontSize: 11, color: c.dim }}>Usually responds within a few hours</div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px", display: "flex", flexDirection: "column", gap: 10 }}>
              {chatMsgs.map((m, i) => {
                if (m.from === "system") {
                  return (
                    <div key={i} style={{ alignSelf: "center", padding: "8px 16px", borderRadius: 12, background: c.muted, maxWidth: "90%" }}>
                      <p style={{ fontSize: 12, color: c.secondary, lineHeight: 1.6, margin: 0, textAlign: "center" }}>{m.text}</p>
                    </div>
                  );
                }
                const isClient = m.from === "client";
                return (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", flexDirection: isClient ? "row-reverse" : "row" }}>
                    {!isClient && <AntonioAvatar size={32} />}
                    <div style={{
                      padding: "12px 16px",
                      borderRadius: isClient ? "14px 4px 14px 14px" : "4px 14px 14px 14px",
                      background: isClient ? c.accent : c.surface,
                      border: isClient ? "none" : `1px solid ${c.borderLight}`,
                      maxWidth: "78%",
                    }}>
                      <p style={{ fontSize: 13, color: isClient ? "#fff" : c.text, lineHeight: 1.6, margin: 0 }}>{m.text}</p>
                      {m.time && <div style={{ fontSize: 10, color: isClient ? "rgba(255,255,255,0.5)" : c.dim, marginTop: 6 }}>{m.time}</div>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chat input */}
            <div style={{ flexShrink: 0, padding: "10px 16px 14px", borderTop: `1px solid ${c.borderLight}`, background: c.surface }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendChat()}
                  placeholder="Message Antonio..."
                  style={{
                    flex: 1, padding: "12px 16px", borderRadius: 14,
                    border: `1.5px solid ${c.borderLight}`, background: c.bg,
                    fontSize: 14, color: c.text, outline: "none",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                />
                <button onClick={sendChat} disabled={!chatInput.trim()} style={{
                  width: 42, height: 42, borderRadius: 12, border: "none",
                  background: chatInput.trim() ? c.accent : c.borderLight,
                  color: chatInput.trim() ? "#fff" : c.dim,
                  cursor: chatInput.trim() ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === "sign" && (
          <div style={{ padding: "24px 20px 32px" }}>
            <h2 style={{ fontSize: 22, fontFamily: "'Fraunces', serif", fontWeight: 600, color: c.text, margin: "0 0 4px" }}>Signatures</h2>
            <p style={{ fontSize: 13, color: c.dim, margin: "0 0 20px" }}>Documents waiting for your signature</p>

            {/* 8879 card */}
            <div style={{ padding: "18px", borderRadius: 16, marginBottom: 12, background: c.surface, border: `1.5px solid ${c.warm}`, cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: c.warmLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>✍️</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: c.text }}>Form 8879 &mdash; e-file Authorization</div>
                  <div style={{ fontSize: 12, color: c.dim, marginTop: 3 }}>4 fields to complete</div>
                  <div style={{ marginTop: 8 }}>
                    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: c.warmLight, color: "#9A7245" }}>Pending Signature</span>
                  </div>
                </div>
              </div>
              <PrimaryButton onClick={() => {}} style={{ marginTop: 14 }}>Begin Signing</PrimaryButton>
            </div>

            {/* Completed */}
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: c.dim, marginTop: 24, marginBottom: 10 }}>COMPLETED</div>
            {[
              { name: "Engagement Letter", date: "Mar 27, 2026" },
              { name: "7216 Consent", date: "Mar 27, 2026" },
            ].map((d, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, marginBottom: 6, background: c.surface, border: `1px solid ${c.borderLight}` }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: c.accentLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7L5.5 9.5L11 4" stroke={c.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{d.name}</div>
                  <div style={{ fontSize: 11, color: c.dim }}>{d.date}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tab bar */}
      <TabBar tab={tab} onTab={(t) => { setTab(t); setDocFolder(null); }} />
    </div>
  );
}

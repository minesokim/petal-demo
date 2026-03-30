"use client";

// This page skips the intake flow and goes straight to the client portal.
// /portal = full intake flow → portal
// /clientportal = portal only (for demo/testing)

import { useState, useRef } from "react";

// Re-use all the components and palette from the portal page
// Import the color palette and components inline to avoid circular deps

const c = {
  bg: "#FAFAF8", surface: "#FFFFFF", muted: "#F5F4F0",
  border: "#E8E6E1", borderLight: "#F0EEEA",
  text: "#1A1A18", secondary: "#6B6960", dim: "#9C978C",
  accent: "#2D5A3D", accentLight: "#E8F0EB", accentDark: "#1a3a26",
  warm: "#D4A574", warmLight: "#FBF5EF",
  error: "#C4483E", blueLight: "#EBF2F8",
};

function AntonioAvatar({ size = 40 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `linear-gradient(135deg, ${c.accent} 0%, ${c.accentDark} 100%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Fraunces', serif", fontWeight: 600,
      fontSize: size * 0.35, color: "#fff",
    }}>A</div>
  );
}

function AntonioNote({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", gap: 12, padding: "14px 16px", marginTop: 20, background: c.warmLight, borderRadius: 14, alignItems: "flex-start" }}>
      <AntonioAvatar size={32} />
      <p style={{ fontSize: 13, color: "#7A5C35", lineHeight: 1.7, fontStyle: "italic", margin: 0 }}>&ldquo;{text}&rdquo;</p>
    </div>
  );
}

function PrimaryButton({ children, onClick, disabled, style: sx }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; style?: React.CSSProperties }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: "100%", padding: "15px 24px", borderRadius: 14, border: "none",
      background: disabled ? c.borderLight : c.accent, color: disabled ? c.dim : "#fff",
      fontSize: 15, fontWeight: 600, cursor: disabled ? "default" : "pointer",
      fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.2s ease", ...sx,
    }}>{children}</button>
  );
}

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
              }}>
                {step.done ? <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M3 7L5.5 9.5L11 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  : step.active ? <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.accent }} />
                  : <div style={{ width: 6, height: 6, borderRadius: "50%", background: c.border }} />}
              </div>
              {!isLast && <div style={{ width: 2, height: 28, borderRadius: 1, background: step.done ? c.accent : c.borderLight }} />}
            </div>
            <div style={{ paddingBottom: isLast ? 0 : 14, paddingTop: 3 }}>
              <div style={{ fontSize: 13, fontWeight: step.active ? 600 : step.done ? 500 : 400, color: step.active ? c.accent : step.done ? c.text : c.dim }}>{step.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TabBar({ tab, onTab }: { tab: string; onTab: (t: string) => void }) {
  const tabs = [
    { key: "home", label: "Home", icon: "M3 12l9-8 9 8M5 10v8a1 1 0 001 1h3m10-9v8a1 1 0 01-1 1h-3m-4 0v-4a1 1 0 011-1h2a1 1 0 011 1v4" },
    { key: "docs", label: "Docs", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
    { key: "messages", label: "Messages", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
    { key: "sign", label: "Sign", icon: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" },
    { key: "profile", label: "Profile", icon: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z" },
  ];
  return (
    <div style={{ display: "flex", borderTop: `1px solid ${c.border}`, background: c.surface, flexShrink: 0, paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => onTab(t.key)} style={{
          flex: 1, padding: "10px 0 8px", border: "none", background: "transparent",
          cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={tab === t.key ? c.accent : c.dim} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={t.icon} /></svg>
          <span style={{ fontSize: 10, fontWeight: 600, color: tab === t.key ? c.accent : c.dim }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

function TopNav({ onBack, title, sub }: { onBack?: () => void; title: string; sub?: string }) {
  return (
    <div style={{ padding: "12px 20px", display: "flex", alignItems: "center", borderBottom: `1px solid ${c.border}`, background: c.surface, gap: 12, flexShrink: 0 }}>
      {onBack && (
        <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${c.border}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: c.secondary }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      )}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: c.text }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: c.dim }}>{sub}</div>}
      </div>
    </div>
  );
}

// ═══ CLIENT PORTAL (post-intake, direct access) ═══
export default function ClientPortalDirect() {
  const [tab, setTab] = useState("home");
  const [chatInput, setChatInput] = useState("");
  const [chatMsgs, setChatMsgs] = useState<{ from: "antonio" | "client" | "system"; text: string; time: string }[]>([
    { from: "antonio", text: "Got your documents! Starting my review. I'll reach out if I have questions. 👍", time: "10:02 AM" },
  ]);
  const [docFolder, setDocFolder] = useState<string | null>(null);

  const portalFolders = [
    { id: "uploads", name: "My Uploads", count: 3, icon: "U", color: c.accentLight, files: [
      { name: "W-2 Riverside Medical.pdf", date: "Mar 24", size: "245 KB", status: "ok" },
      { name: "Drivers_License.jpg", date: "Mar 24", size: "1.2 MB", status: "ok" },
      { name: "1099-NEC_Freelance.pdf", date: "Mar 25", size: "89 KB", status: "ok" },
    ]},
    { id: "needed", name: "Still Needed", count: 2, icon: "N", color: c.warmLight, files: [
      { name: "1099-INT from Chase Bank", status: "pending" },
      { name: "Business expense records", status: "pending" },
    ]},
    { id: "returns", name: "Tax Returns", count: 1, icon: "R", color: c.blueLight, files: [
      { name: "2025_Federal_Return.pdf", date: "Apr 8", size: "1.8 MB", status: "ok" },
    ]},
    { id: "agreements", name: "Agreements", count: 2, icon: "A", color: c.muted, files: [
      { name: "Engagement Letter 2025.pdf", date: "Mar 27", size: "156 KB", status: "signed" },
      { name: "7216 Consent.pdf", date: "Mar 27", size: "92 KB", status: "signed" },
    ]},
  ];

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim().toLowerCase();
    setChatMsgs(p => [...p, { from: "client", text: chatInput.trim(), time: "Now" }]);
    setChatInput("");
    const checks = [
      { kw: ["appointment", "meeting", "schedule", "call", "when"], response: { from: "system" as const, text: "Your appointment: Mon, Apr 6 · 9:00 AM — Phone call with Antonio.", time: "" } },
      { kw: ["document", "need", "missing", "upload", "what else"], response: { from: "system" as const, text: "Still needed: 1099-INT from Chase Bank, Business expense records. You've uploaded 3 of 5 documents.", time: "" } },
      { kw: ["status", "where", "progress", "return", "update"], response: { from: "system" as const, text: "Your return status: Ready for Your Review. Antonio finished preparing your return.", time: "" } },
      { kw: ["pay", "cost", "fee", "balance", "owe", "invoice"], response: { from: "system" as const, text: "Payment summary: $50 deposit paid. Remaining balance: $300. Total fee: $350.", time: "" } },
    ];
    const match = checks.find(ch => ch.kw.some(k => msg.includes(k)));
    if (match) {
      setTimeout(() => setChatMsgs(p => [...p, match.response]), 600);
      setTimeout(() => setChatMsgs(p => [...p, { from: "system", text: "This info is from your account. Antonio will follow up personally if needed.", time: "" }]), 900);
    } else {
      setTimeout(() => setChatMsgs(p => [...p, { from: "system", text: "Message sent to Antonio. He usually responds within a few hours.", time: "" }]), 800);
    }
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: c.bg, maxWidth: 480, margin: "0 auto" }}>
      <div style={{ flex: 1, overflowY: tab === "messages" ? "hidden" : "auto", display: "flex", flexDirection: "column" }}>

        {/* HOME */}
        {tab === "home" && (
          <div style={{ padding: "24px 20px 32px" }}>
            <div style={{ fontSize: 14, color: c.dim, marginBottom: 4 }}>Good morning,</div>
            <div style={{ fontSize: 24, fontFamily: "'Fraunces', serif", fontWeight: 600, color: c.text, marginBottom: 20 }}>Maria</div>
            <div style={{ background: `linear-gradient(135deg, ${c.accent} 0%, ${c.accentDark} 100%)`, borderRadius: 18, padding: "20px 22px", marginBottom: 20, color: "#fff" }}>
              <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 2 }}>2025 TAX RETURN</div>
              <div style={{ fontSize: 17, fontWeight: 600, fontFamily: "'Fraunces', serif" }}>Ready for Your Review</div>
              <div style={{ height: 4, borderRadius: 4, background: "rgba(255,255,255,0.15)", marginTop: 12 }}><div style={{ width: "70%", height: "100%", borderRadius: 4, background: "#6ECB8B" }} /></div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: c.dim, marginBottom: 10 }}>ACTION NEEDED</div>
            {[
              { label: "Sign Form 8879", desc: "e-file authorization required", icon: "S", toTab: "sign" },
              { label: "Pay remaining balance", desc: "$300.00 due", icon: "$" },
            ].map((a, i) => (
              <div key={i} onClick={() => a.toTab && setTab(a.toTab)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 14, marginBottom: 8, background: c.surface, border: `1.5px solid ${c.warm}`, cursor: a.toTab ? "pointer" : "default" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: c.warmLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#9A7245" }}>{a.icon}</div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600, color: c.text }}>{a.label}</div><div style={{ fontSize: 12, color: c.dim }}>{a.desc}</div></div>
                <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: c.warmLight, color: "#9A7245" }}>Action</span>
              </div>
            ))}
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: c.dim, marginTop: 24, marginBottom: 10 }}>UPCOMING</div>
            <div style={{ padding: "16px 18px", borderRadius: 14, background: c.surface, border: `1px solid ${c.borderLight}`, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: c.accentLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
              </div>
              <div><div style={{ fontSize: 14, fontWeight: 600, color: c.text }}>Meeting with Antonio</div><div style={{ fontSize: 12, color: c.dim }}>Mon, Apr 6 · 9:00 AM · Phone</div></div>
            </div>
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

        {/* DOCS */}
        {tab === "docs" && (
          <div style={{ padding: "24px 20px 32px" }}>
            {docFolder ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                  <button onClick={() => setDocFolder(null)} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${c.border}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: c.secondary }}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                  <h2 style={{ fontSize: 18, fontFamily: "'Fraunces', serif", fontWeight: 600, color: c.text, margin: 0 }}>{portalFolders.find(f => f.id === docFolder)?.name}</h2>
                </div>
                {portalFolders.find(f => f.id === docFolder)?.files.map((fl, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 14, marginBottom: 6, background: c.surface, border: `1px solid ${c.borderLight}` }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: fl.status === "pending" ? c.warmLight : fl.status === "signed" ? c.accentLight : c.muted, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={fl.status === "pending" ? "#9A7245" : fl.status === "signed" ? c.accent : c.dim} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        {fl.status === "pending" ? <path d="M12 6v6l4 2M12 2a10 10 0 100 20 10 10 0 000-20z" /> : fl.status === "signed" ? <path d="M9 12l2 2 4-4M12 2a10 10 0 100 20 10 10 0 000-20z" /> : <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 2v6h6" />}
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: c.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fl.name}</div>
                      <div style={{ fontSize: 11, color: c.dim, marginTop: 2 }}>{"date" in fl && fl.date ? `${fl.date} · ${"size" in fl ? fl.size : ""}` : "Waiting for upload"}</div>
                    </div>
                    {fl.status === "pending" ? (
                      <button style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${c.accent}`, background: "transparent", color: c.accent, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Upload</button>
                    ) : (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${c.border}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c.dim} strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                        </button>
                        <button style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${c.border}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c.dim} strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                        </button>
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
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 8px", display: "block" }}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
                  <div style={{ fontSize: 14, fontWeight: 600, color: c.text }}>Upload or scan</div>
                  <div style={{ fontSize: 12, color: c.dim, marginTop: 2 }}>Photos from your phone work great</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {portalFolders.map(f => (
                    <div key={f.id} onClick={() => setDocFolder(f.id)} style={{ padding: "18px 16px", borderRadius: 16, cursor: "pointer", background: c.surface, border: `1px solid ${c.borderLight}` }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, marginBottom: 10, background: f.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: c.accent }}>{f.icon}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: c.text }}>{f.name}</div>
                      <div style={{ fontSize: 12, color: c.dim, marginTop: 2 }}>{f.count} files</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* MESSAGES */}
        {tab === "messages" && (
          <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "14px 20px", borderBottom: `1px solid ${c.borderLight}`, display: "flex", alignItems: "center", gap: 12, background: c.surface, flexShrink: 0 }}>
              <div style={{ position: "relative" }}><AntonioAvatar size={38} /><div style={{ position: "absolute", bottom: -1, right: -1, width: 10, height: 10, borderRadius: "50%", background: "#5CB176", border: `2px solid ${c.surface}` }} /></div>
              <div><div style={{ fontSize: 15, fontWeight: 600, color: c.text }}>Antonio Vazquez</div><div style={{ fontSize: 11, color: c.dim }}>Usually responds within a few hours</div></div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px", display: "flex", flexDirection: "column", gap: 10 }}>
              {chatMsgs.map((m, i) => {
                if (m.from === "system") return <div key={i} style={{ alignSelf: "center", padding: "8px 16px", borderRadius: 12, background: c.muted, maxWidth: "90%" }}><p style={{ fontSize: 12, color: c.secondary, lineHeight: 1.6, margin: 0, textAlign: "center" }}>{m.text}</p></div>;
                const isClient = m.from === "client";
                return (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", flexDirection: isClient ? "row-reverse" : "row" }}>
                    {!isClient && <AntonioAvatar size={32} />}
                    <div style={{ padding: "12px 16px", borderRadius: isClient ? "14px 4px 14px 14px" : "4px 14px 14px 14px", background: isClient ? c.accent : c.surface, border: isClient ? "none" : `1px solid ${c.borderLight}`, maxWidth: "78%" }}>
                      <p style={{ fontSize: 13, color: isClient ? "#fff" : c.text, lineHeight: 1.6, margin: 0 }}>{m.text}</p>
                      {m.time && <div style={{ fontSize: 10, color: isClient ? "rgba(255,255,255,0.5)" : c.dim, marginTop: 6 }}>{m.time}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ flexShrink: 0, padding: "10px 16px 14px", borderTop: `1px solid ${c.borderLight}`, background: c.surface }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button style={{ width: 42, height: 42, borderRadius: 12, border: `1px solid ${c.borderLight}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: c.dim }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" /></svg>
                </button>
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat()} placeholder="Message Antonio..." style={{ flex: 1, padding: "12px 16px", borderRadius: 14, border: `1.5px solid ${c.borderLight}`, background: c.bg, fontSize: 14, color: c.text, outline: "none", fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
                <button onClick={sendChat} disabled={!chatInput.trim()} style={{ width: 42, height: 42, borderRadius: 12, border: "none", background: chatInput.trim() ? c.accent : c.borderLight, color: chatInput.trim() ? "#fff" : c.dim, cursor: chatInput.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SIGN */}
        {tab === "sign" && (
          <div style={{ padding: "24px 20px 32px" }}>
            <h2 style={{ fontSize: 22, fontFamily: "'Fraunces', serif", fontWeight: 600, color: c.text, margin: "0 0 4px" }}>Signatures</h2>
            <p style={{ fontSize: 13, color: c.dim, margin: "0 0 20px" }}>Documents waiting for your signature</p>
            <div style={{ padding: "18px", borderRadius: 16, marginBottom: 12, background: c.surface, border: `1.5px solid ${c.warm}` }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: c.warmLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9A7245" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: c.text }}>Form 8879 — e-file Authorization</div>
                  <div style={{ fontSize: 12, color: c.dim, marginTop: 3 }}>4 fields to complete</div>
                  <div style={{ marginTop: 8 }}><span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: c.warmLight, color: "#9A7245" }}>Pending Signature</span></div>
                </div>
              </div>
              <PrimaryButton onClick={() => setTab("signing")} style={{ marginTop: 14 }}>Begin Signing</PrimaryButton>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: c.dim, marginTop: 24, marginBottom: 10 }}>COMPLETED</div>
            {[{ name: "Engagement Letter", date: "Mar 27, 2026" }, { name: "7216 Consent", date: "Mar 27, 2026" }].map((d, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, marginBottom: 6, background: c.surface, border: `1px solid ${c.borderLight}` }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: c.accentLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7L5.5 9.5L11 4" stroke={c.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{d.name}</div><div style={{ fontSize: 11, color: c.dim }}>{d.date}</div></div>
              </div>
            ))}
          </div>
        )}

        {/* SIGNING FLOW */}
        {tab === "signing" && (
          <div style={{ padding: "24px 20px 32px" }}>
            <TopNav onBack={() => setTab("sign")} title="Form 8879" sub="e-file Authorization" />
            <div style={{ padding: "24px 0" }}>
              <div style={{ background: c.surface, borderRadius: 14, border: `1px solid ${c.borderLight}`, padding: "24px 20px", marginBottom: 16, textAlign: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: c.dim }}>FORM 8879</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: c.text, marginTop: 4 }}>IRS e-file Signature Authorization</div>
                <div style={{ fontSize: 11, color: c.dim, marginTop: 2 }}>Tax Year 2025</div>
              </div>
              <div style={{ fontSize: 13, color: c.secondary, lineHeight: 1.7, marginBottom: 20 }}>I consent to allow my electronic return originator (ERO) to send my return to the IRS electronically.</div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: c.dim, marginBottom: 6 }}>Taxpayer Signature</div>
                <canvas
                  id="sig-canvas-direct"
                  width={680} height={240}
                  onMouseDown={(e) => {
                    const canvas = e.currentTarget; const ctx = canvas.getContext("2d"); if (!ctx) return;
                    const rect = canvas.getBoundingClientRect();
                    ctx.beginPath(); ctx.moveTo((e.clientX - rect.left) * (canvas.width / rect.width), (e.clientY - rect.top) * (canvas.height / rect.height));
                    const draw = (ev: MouseEvent) => { ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.strokeStyle = c.accent; ctx.lineTo((ev.clientX - rect.left) * (canvas.width / rect.width), (ev.clientY - rect.top) * (canvas.height / rect.height)); ctx.stroke(); };
                    const stop = () => { document.removeEventListener("mousemove", draw); document.removeEventListener("mouseup", stop); };
                    document.addEventListener("mousemove", draw); document.addEventListener("mouseup", stop);
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault(); const canvas = e.currentTarget; const ctx = canvas.getContext("2d"); if (!ctx) return;
                    const rect = canvas.getBoundingClientRect(); const touch = e.touches[0];
                    ctx.beginPath(); ctx.moveTo((touch.clientX - rect.left) * (canvas.width / rect.width), (touch.clientY - rect.top) * (canvas.height / rect.height));
                    const draw = (ev: TouchEvent) => { ev.preventDefault(); const t = ev.touches[0]; ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.strokeStyle = c.accent; ctx.lineTo((t.clientX - rect.left) * (canvas.width / rect.width), (t.clientY - rect.top) * (canvas.height / rect.height)); ctx.stroke(); };
                    const stop = () => { canvas.removeEventListener("touchmove", draw); canvas.removeEventListener("touchend", stop); };
                    canvas.addEventListener("touchmove", draw, { passive: false }); canvas.addEventListener("touchend", stop);
                  }}
                  style={{ width: "100%", height: 120, borderRadius: 12, border: `2px dashed ${c.border}`, background: c.bg, cursor: "crosshair", touchAction: "none" }}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button onClick={() => { const canvas = document.getElementById("sig-canvas-direct") as HTMLCanvasElement; canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height); }} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${c.border}`, background: "transparent", color: c.secondary, fontSize: 12, cursor: "pointer" }}>Clear</button>
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: c.dim, marginBottom: 6 }}>Date</div>
                <div style={{ padding: "12px 16px", borderRadius: 10, background: c.accentLight, border: `1.5px solid ${c.accent}`, fontSize: 13, fontWeight: 600, color: c.accent }}>March 30, 2026</div>
              </div>
              <PrimaryButton onClick={() => setTab("sign")}>Submit Signature</PrimaryButton>
            </div>
          </div>
        )}

        {/* PROFILE */}
        {tab === "profile" && (
          <div style={{ padding: "24px 20px 32px" }}>
            <h2 style={{ fontSize: 22, fontFamily: "'Fraunces', serif", fontWeight: 600, color: c.text, margin: "0 0 20px" }}>Profile</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: c.accentLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 600, color: c.accent }}>MG</div>
              <div><div style={{ fontSize: 16, fontWeight: 600, color: c.text }}>Maria Gonzalez</div><div style={{ fontSize: 13, color: c.dim }}>maria.gonzalez@email.com</div></div>
            </div>
            <div style={{ background: c.surface, borderRadius: 14, border: `1px solid ${c.borderLight}`, overflow: "hidden", marginBottom: 16 }}>
              {[{ label: "Phone", value: "(626) 555-0188" }, { label: "Filing status", value: "Married Filing Jointly" }, { label: "Service", value: "Complex Return — $350" }, { label: "Preparer", value: "Antonio Vazquez, EA" }].map((item, i) => (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "14px 18px", borderTop: i ? `1px solid ${c.borderLight}` : "none" }}>
                  <span style={{ fontSize: 13, color: c.dim }}>{item.label}</span><span style={{ fontSize: 13, fontWeight: 500, color: c.text }}>{item.value}</span>
                </div>
              ))}
            </div>
            <div style={{ background: c.surface, borderRadius: 14, border: `1px solid ${c.borderLight}`, overflow: "hidden", marginBottom: 16 }}>
              {[{ label: "Refund method", value: "Direct deposit" }, { label: "Bank", value: "Chase" }, { label: "Account", value: "****4521" }].map((item, i) => (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "14px 18px", borderTop: i ? `1px solid ${c.borderLight}` : "none" }}>
                  <span style={{ fontSize: 13, color: c.dim }}>{item.label}</span><span style={{ fontSize: 13, fontWeight: 500, color: c.text }}>{item.value}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: "14px 18px", borderRadius: 14, background: c.surface, border: `1px solid ${c.borderLight}`, cursor: "pointer" }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: c.error }}>Sign out</div>
            </div>
          </div>
        )}
      </div>

      <TabBar tab={tab} onTab={(t) => { setTab(t); setDocFolder(null); }} />
    </div>
  );
}

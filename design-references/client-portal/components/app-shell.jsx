// App shell — Canvas overview + Prototype, with Tweaks panel
// Uses IOSDevice + all screen components

function PhoneShell({ t, deviceFrame, children, label }) {
  const W = 390, H = 780;
  if (deviceFrame === 'bezel') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <IOSDevice width={W} height={H} dark={false}>
          {/* Background fill so the status-bar safe-area and home-indicator area
              match the screen's own background instead of iOS default gray. */}
          <div style={{ position: 'absolute', inset: 0, background: t.bg, zIndex: 0 }} />
          {/* Inset children for iOS status bar (~47px) and home indicator (34px) */}
          <div style={{
            position: 'absolute', top: 47, left: 0, right: 0, bottom: 34,
            overflow: 'hidden', zIndex: 1,
          }}>
            {children}
          </div>
        </IOSDevice>
        {label && (
          <div style={{
            fontFamily: t.mono, fontSize: 11, color: t.muted, letterSpacing: 1.2,
            textTransform: 'uppercase',
          }}>{label}</div>
        )}
      </div>
    );
  }
  // Clean mobile viewport, no bezel
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{
        width: W, height: H,
        borderRadius: 18,
        overflow: 'hidden',
        border: `1px solid ${t.border}`,
        boxShadow: '0 20px 60px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)',
        background: t.bg,
        position: 'relative',
      }}>
        {children}
      </div>
      {label && (
        <div style={{
          fontFamily: t.mono, fontSize: 11, color: t.muted, letterSpacing: 1.2,
          textTransform: 'uppercase',
        }}>{label}</div>
      )}
    </div>
  );
}

// ─── Canvas overview ────────────────────────────────────────────
function CanvasOverview({ t, deviceFrame }) {
  const screens = [
    { label: '01 · Login', el: <ScreenLogin t={t} /> },
    { label: '02 · OTP Verification', el: <ScreenOTP t={t} /> },
    { label: '03 · Welcome', el: <ScreenWelcome t={t} /> },
    { label: '04 · Tutorial Overlay', el: <ScreenTutorial t={t} /> },
    { label: '05 · Services — Path (Step 1A/13)', el: <ScreenServicePath t={t} /> },
    { label: '05b · Services — Add-ons (Step 1B/13)', el: <ScreenServiceAddons t={t} /> },
    { label: '06 · Personal Info (Step 2/13)', el: <ScreenPersonalInfo t={t} /> },
    { label: '07 · State & Prior Year (Step 3/13)', el: <ScreenStateAndPriorYear t={t} /> },
    { label: '08 · Filing Status (Step 4/13)', el: <ScreenFilingStatus t={t} /> },
    { label: '09 · Spouse Info (Step 5/13)', el: <ScreenSpouseInfo t={t} /> },
    { label: '10 · Dependents Count (Step 6/13)', el: <ScreenDependentsCount t={t} /> },
    { label: '11 · Dependent Details (Step 6/13)', el: <ScreenDependentDetails t={t} count={2} /> },
    { label: '12 · Income Sources (Step 7/13)', el: <ScreenIncomeSources t={t} /> },
    { label: '13 · Rental Property Detail (Step 7/13)', el: <ScreenRentalDetail t={t} /> },
    { label: '14 · Self-Employment Detail (Step 7/13)', el: <ScreenSelfEmployment t={t} /> },
    { label: '15 · Tax Questions (Step 8/13)', el: <ScreenTaxQuestions t={t} /> },
    { label: '16 · Deductions (Step 9/13)', el: <ScreenDeductions t={t} /> },
    { label: '17 · Life Events (Step 10/13)', el: <ScreenLifeEvents t={t} /> },
    { label: '18 · Refund Preference (Step 11/13)', el: <ScreenRefundPreference t={t} /> },
    { label: '19 · Business Info (Alt path)', el: <ScreenBusinessInfo t={t} /> },
    { label: '20 · Business Formation (Alt path)', el: <ScreenBusinessFormation t={t} /> },
    { label: '21 · Strategic Topics (Alt path)', el: <ScreenStrategicTopics t={t} /> },
    { label: '22 · Contact Info (Alt path)', el: <ScreenContactInfo t={t} /> },
    { label: '23 · Documents — Empty (Step 12/13)', el: <ScreenDocsUpload t={t} phase="empty" /> },
    { label: '24 · Documents — AI scanning', el: <ScreenDocsUpload t={t} phase="scanning" /> },
    { label: '25 · Documents — Retake prompt', el: <ScreenDocsUpload t={t} phase="retake" /> },
    { label: '26 · Documents — AI parsed', el: <ScreenDocsUpload t={t} phase="parsed" /> },
    { label: '27 · Documents — Saved', el: <ScreenDocsUpload t={t} phase="uploaded" /> },
    { label: '27 · Engagement Letter (Step 13/13)', el: <ScreenEngagement t={t} /> },
    { label: '28 · §7216 Consent (Step 13/13)', el: <ScreenConsent7216 t={t} /> },
    { label: '29 · Schedule Appointment', el: <ScreenScheduleAppt t={t} /> },
    { label: '30 · Deposit ($50)', el: <ScreenDeposit t={t} /> },
    { label: '31 · Intake Complete', el: <ScreenDone t={t} /> },
    { label: '32 · Portal Home', el: <ScreenHome t={t} /> },
    { label: '33 · Documents', el: <ScreenDocs t={t} /> },
    { label: '34 · Messages', el: <ScreenMessages t={t} /> },
    { label: '35 · Signatures', el: <ScreenSignatures t={t} /> },
    { label: '36 · Profile', el: <ScreenProfile t={t} /> },
  ];

  return (
    <div style={{
      background: t.bg,
      minHeight: '100vh',
      padding: '60px 40px 120px',
      fontFamily: t.sans,
    }}>
      {/* Header */}
      <div style={{ maxWidth: 1600, margin: '0 auto 56px' }}>
        <div style={{
          display: 'inline-flex',
          gap: 10, alignItems: 'center',
          padding: '6px 14px',
          background: t.tintAccent,
          borderRadius: 999,
          marginBottom: 20,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.rust }}/>
          <span style={{
            fontFamily: t.mono, fontSize: 11, color: t.rustInk, letterSpacing: 1,
          }}>PETAL V4 · CLIENT-FACING MOBILE</span>
        </div>
        <div style={{
          fontFamily: t.serif, fontSize: 56, color: t.ink,
          letterSpacing: -1.4, lineHeight: 1.05, marginBottom: 14, maxWidth: 900,
        }}>
          The client portal, <em style={{ fontStyle: 'italic' }}>warmer</em>.
        </div>
        <div style={{
          fontSize: 17, color: t.inkSoft, maxWidth: 620, lineHeight: 1.5,
        }}>
          Eleven mobile screens for Vazant Consulting's new intake flow and returning-client portal.
          Warm editorial system · cream, ink, rust · Fraunces serif, sans body, mono numerics.
          Rust for primary & urgency · green reserved for completed and signed.
        </div>

        {/* Meta row */}
        <div style={{
          display: 'flex', gap: 40, marginTop: 36,
          paddingTop: 24, borderTop: `1px solid ${t.border}`,
        }}>
          {[
            ['SURFACES', '2 · intake + portal'],
            ['SCREENS', '11'],
            ['PRIMARY', 'rust · oklch'],
            ['SUCCESS', 'green'],
            ['TARGET', 'iOS Safari · Android Chrome'],
          ].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontFamily: t.mono, fontSize: 10, color: t.muted, letterSpacing: 1, marginBottom: 4 }}>{k}</div>
              <div style={{ fontSize: 14, color: t.ink, fontWeight: 500 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Section: Intake */}
      <div style={{ maxWidth: 1600, margin: '0 auto' }}>
        <SectionHeader t={t} num="01" kicker="Part one" title="New client intake" sub="Phone login → SMS OTP → 10-step form → sign agreements → done. Each step earns its place." />
        <ScreenGrid screens={screens.slice(0, 31)} t={t} deviceFrame={deviceFrame} />

        <div style={{ height: 80 }}/>

        <SectionHeader t={t} num="02" kicker="Part two" title="Returning client portal" sub="Five-tab signed-in experience: home, docs, messages, sign, profile. Status-aware, calmly paced." />
        <ScreenGrid screens={screens.slice(31)} t={t} deviceFrame={deviceFrame} />
      </div>
    </div>
  );
}

function SectionHeader({ t, num, kicker, title, sub }) {
  return (
    <div style={{ marginBottom: 40, display: 'flex', gap: 32, alignItems: 'flex-end' }}>
      <div style={{
        fontFamily: t.serif, fontSize: 120, color: t.border,
        lineHeight: 0.8, letterSpacing: -4, flexShrink: 0,
      }}>{num}</div>
      <div style={{ flex: 1, paddingBottom: 14 }}>
        <div style={{
          fontFamily: t.mono, fontSize: 11, color: t.rust,
          letterSpacing: 1.5, marginBottom: 6, textTransform: 'uppercase',
        }}>{kicker}</div>
        <div style={{ fontFamily: t.serif, fontSize: 36, color: t.ink, letterSpacing: -0.8, marginBottom: 8 }}>
          {title}
        </div>
        <div style={{ fontSize: 15, color: t.muted, maxWidth: 640, lineHeight: 1.5 }}>{sub}</div>
      </div>
    </div>
  );
}

function ScreenGrid({ screens, t, deviceFrame }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))',
      gap: 48,
      justifyItems: 'center',
    }}>
      {screens.map((s, i) => (
        <PhoneShell key={i} t={t} deviceFrame={deviceFrame} label={s.label}>
          {s.el}
        </PhoneShell>
      ))}
    </div>
  );
}

// ─── Prototype ──────────────────────────────────────────────────
function Prototype({ t, deviceFrame }) {
  const [route, setRoute] = React.useState(() => {
    try { return localStorage.getItem('petal:route') || 'login'; } catch { return 'login'; }
  });
  const [direction, setDirection] = React.useState('jump');
  const go = (r) => {
    setDirection('jump');
    setRoute(r);
    try { localStorage.setItem('petal:route', r); } catch {}
  };
  const goNext = (r) => {
    setDirection('forward');
    setRoute(r);
    try { localStorage.setItem('petal:route', r); } catch {}
  };
  const goBack = (r) => {
    setDirection('back');
    setRoute(r);
    try { localStorage.setItem('petal:route', r); } catch {}
  };

  // ─── Portal state: payment + 8879 signing ───
  const [paid, setPaid] = React.useState(() => {
    try { return localStorage.getItem('petal:paid') === '1'; } catch { return false; }
  });
  const [signed8879, setSigned8879] = React.useState(() => {
    try { return localStorage.getItem('petal:signed8879') === '1'; } catch { return false; }
  });
  const [paymentOpen, setPaymentOpen] = React.useState(false);
  const markPaid = () => {
    setPaid(true);
    try { localStorage.setItem('petal:paid', '1'); } catch {}
  };
  const markSigned = () => {
    setSigned8879(true);
    try { localStorage.setItem('petal:signed8879', '1'); } catch {}
  };
  const resetPortal = () => {
    setPaid(false); setSigned8879(false);
    try { localStorage.removeItem('petal:paid'); localStorage.removeItem('petal:signed8879'); } catch {}
  };

  // Intake order
  const intakeFlow = ['login', 'otp', 'welcome', 'tutorial', 'services', 'personal', 'stateprior', 'filing', 'spouse', 'deps', 'depdetails', 'income', 'rental', 'se', 'taxq', 'deduct', 'life', 'refund', 'docs1', 'docs2', 'docs3', 'docs4', 'engagement', 'consent', 'appt', 'deposit', 'done'];
  const portalTabs = { home: 'home', docs: 'docs', msgs: 'msgs', sign: 'sign', profile: 'home' };

  const nextIntake = (curr) => {
    const i = intakeFlow.indexOf(curr);
    go(i < intakeFlow.length - 1 ? intakeFlow[i + 1] : 'phome');
  };
  const backIntake = (curr) => {
    const i = intakeFlow.indexOf(curr);
    go(i > 0 ? intakeFlow[i - 1] : 'login');
  };

  let screen;
  switch (route) {
    case 'login': screen = <ScreenLogin t={t} onNext={() => goNext('otp')} />; break;
    case 'otp': screen = <ScreenOTP t={t} onNext={() => goNext('welcome')} onBack={() => goBack('login')} />; break;
    case 'welcome': screen = <ScreenWelcome t={t} onNext={() => goNext('tutorial')} />; break;
    case 'tutorial': screen = <ScreenTutorial t={t} onDone={() => goNext('services')} />; break;
    case 'services': screen = <ScreenServicePath t={t} onNext={() => goNext('services2')} onBack={() => goBack('welcome')} />; break;
    case 'services2': screen = <ScreenServiceAddons t={t} onNext={() => goNext('personal')} onBack={() => goBack('services')} />; break;
    case 'personal': screen = <ScreenPersonalInfo t={t} onNext={() => goNext('stateprior')} onBack={() => goBack('services2')} />; break;
    case 'stateprior': screen = <ScreenStateAndPriorYear t={t} onNext={() => goNext('filing')} onBack={() => goBack('personal')} />; break;
    case 'filing': screen = <ScreenFilingStatus t={t} onNext={() => goNext('spouse')} onBack={() => goBack('stateprior')} />; break;
    case 'spouse': screen = <ScreenSpouseInfo t={t} onNext={() => goNext('deps')} onBack={() => goBack('filing')} />; break;
    case 'deps': screen = <ScreenDependentsCount t={t} onNext={() => goNext('depdetails')} onBack={() => goBack('spouse')} />; break;
    case 'depdetails': screen = <ScreenDependentDetails t={t} count={2} onNext={() => goNext('income')} onBack={() => goBack('deps')} />; break;
    case 'income': screen = <ScreenIncomeSources t={t} onNext={() => goNext('rental')} onBack={() => goBack('depdetails')} />; break;
    case 'rental': screen = <ScreenRentalDetail t={t} onNext={() => goNext('se')} onBack={() => goBack('income')} />; break;
    case 'se': screen = <ScreenSelfEmployment t={t} onNext={() => goNext('taxq')} onBack={() => goBack('rental')} />; break;
    case 'taxq': screen = <ScreenTaxQuestions t={t} onNext={() => goNext('deduct')} onBack={() => goBack('se')} />; break;
    case 'deduct': screen = <ScreenDeductions t={t} onNext={() => goNext('refund')} onBack={() => goBack('taxq')} />; break;
    case 'refund': screen = <ScreenRefundPreference t={t} onNext={() => goNext('docs1')} onBack={() => goBack('life')} />; break;
    case 'life': screen = <ScreenLifeEvents t={t} onNext={() => goNext('refund')} onBack={() => goBack('deduct')} />; break;
    case 'appt': screen = <ScreenScheduleAppt t={t} onNext={() => goNext('deposit')} onBack={() => goBack('consent')} />; break;
    case 'deposit': screen = <ScreenDeposit t={t} onNext={() => goNext('done')} onBack={() => goBack('appt')} />; break;
    case 'biz': screen = <ScreenBusinessInfo t={t} onNext={() => goNext('filing')} onBack={() => goBack('services')} />; break;
    case 'form': screen = <ScreenBusinessFormation t={t} onNext={() => goNext('personal')} onBack={() => goBack('services')} />; break;
    case 'topics': screen = <ScreenStrategicTopics t={t} onNext={() => goNext('contact')} onBack={() => goBack('services')} />; break;
    case 'contact': screen = <ScreenContactInfo t={t} onNext={() => goNext('appt')} onBack={() => goBack('topics')} />; break;
    case 'docs1': screen = <ScreenDocsUpload t={t} phase="empty" onNext={() => goNext('docs2')} onBack={() => goBack('refund')} />; break;
    case 'docs2': screen = <ScreenDocsUpload t={t} phase="scanning" onNext={() => goNext('docs3')} onBack={() => goBack('docs1')} />; break;
    case 'docs-retake': screen = <ScreenDocsUpload t={t} phase="retake" onNext={() => goNext('docs2')} onBack={() => goBack('docs1')} />; break;
    case 'docs3': screen = <ScreenDocsUpload t={t} phase="parsed" onNext={() => goNext('docs4')} onBack={() => goBack('docs2')} />; break;
    case 'docs4': screen = <ScreenDocsUpload t={t} phase="uploaded" onNext={() => goNext('engagement')} onBack={() => goBack('docs3')} />; break;
    case 'engagement': screen = <ScreenEngagement t={t} onNext={() => goNext('consent')} onBack={() => goBack('docs4')} />; break;
    case 'consent': screen = <ScreenConsent7216 t={t} onNext={() => goNext('appt')} onBack={() => goBack('engagement')} />; break;
    case 'done': screen = <ScreenDone t={t} onPortal={() => goNext('phome')} />; break;
    case 'phome': screen = <ScreenHome t={t} onTab={(id) => go('p' + (id === 'profile' ? 'profile' : id))} paid={paid} signed8879={signed8879} onPay={() => setPaymentOpen(true)} onSign8879={() => go('sign8879')} />; break;
    case 'pdocs': screen = <ScreenDocs t={t} onTab={(id) => go('p' + (id === 'profile' ? 'profile' : id))} />; break;
    case 'pmsgs': screen = <ScreenMessages t={t} onTab={(id) => go('p' + (id === 'profile' ? 'profile' : id))} />; break;
    case 'psign': screen = <ScreenSignatures t={t} onTab={(id) => go('p' + (id === 'profile' ? 'profile' : id))} paid={paid} signed8879={signed8879} onSign8879={() => go('sign8879')} />; break;
    case 'pprofile': screen = <ScreenProfile t={t} onTab={(id) => go('p' + id)} />; break;
    case 'sign8879': screen = <Screen8879Sign t={t} onBack={() => go('phome')} onSigned={() => { markSigned(); go('phome'); }} />; break;
    default: screen = <ScreenLogin t={t} onNext={() => go('otp')} />;
  }

  // Quick-nav chip strip
  const chips = [
    { id: 'login', l: 'Login' },
    { id: 'otp', l: 'OTP' },
    { id: 'welcome', l: 'Welcome' },
    { id: 'tutorial', l: 'Tutorial' },
    { id: 'services', l: 'Services · path' },
    { id: 'services2', l: 'Services · add-ons' },
    { id: 'personal', l: 'Personal' },
    { id: 'stateprior', l: 'State + prior' },
    { id: 'filing', l: 'Filing' },
    { id: 'spouse', l: 'Spouse' },
    { id: 'deps', l: 'Dependents' },
    { id: 'depdetails', l: 'Dep. details' },
    { id: 'income', l: 'Income' },
    { id: 'rental', l: 'Rental' },
    { id: 'se', l: 'Self-employ.' },
    { id: 'taxq', l: 'Tax questions' },
    { id: 'deduct', l: 'Deductions' },
    { id: 'refund', l: 'Refund' },
    { id: 'life', l: 'Life events' },
    { id: 'appt', l: 'Appointment' },
    { id: 'deposit', l: 'Deposit' },
    { id: 'biz', l: 'Business (alt)' },
    { id: 'form', l: 'Formation (alt)' },
    { id: 'topics', l: 'Topics (alt)' },
    { id: 'contact', l: 'Contact (alt)' },
    { id: 'docs1', l: 'Docs' },
    { id: 'docs2', l: 'AI scanning' },
    { id: 'docs-retake', l: 'Retake prompt' },
    { id: 'docs3', l: 'AI parsed' },
    { id: 'docs4', l: 'Saved' },
    { id: 'engagement', l: 'Engagement' },
    { id: 'consent', l: '§7216' },
    { id: 'done', l: 'Done' },
    { id: 'phome', l: 'Portal · Home' },
    { id: 'pdocs', l: 'Docs' },
    { id: 'pmsgs', l: 'Messages' },
    { id: 'psign', l: 'Signatures' },
    { id: 'sign8879', l: '8879 sign flow' },
    { id: 'pprofile', l: 'Profile' },
  ];

  return (
    <div style={{
      background: t.bg, minHeight: '100vh',
      display: 'flex', gap: 40,
      padding: '48px 40px',
      fontFamily: t.sans,
    }}>
      {/* Nav */}
      <div style={{ width: 220, flexShrink: 0, position: 'sticky', top: 48, alignSelf: 'flex-start' }}>
        <div style={{ fontFamily: t.mono, fontSize: 10, color: t.muted, letterSpacing: 1.2, marginBottom: 12 }}>
          JUMP TO SCREEN
        </div>
        <Stack gap={4}>
          {chips.map(c => {
            const on = route === c.id;
            return (
              <button key={c.id} onClick={() => go(c.id)} style={{
                textAlign: 'left',
                padding: '8px 12px',
                borderRadius: 6,
                border: 'none',
                background: on ? t.tintAccent : 'transparent',
                color: on ? t.rustInk : t.inkSoft,
                fontSize: 13,
                fontWeight: on ? 500 : 400,
                cursor: 'pointer',
                fontFamily: t.sans,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: on ? t.rust : t.border,
                }}/>
                {c.l}
              </button>
            );
          })}
        </Stack>
      </div>

      {/* Phone */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <PhoneShell t={t} deviceFrame={deviceFrame}>
          <div
            key={route}
            data-dir={direction}
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              animation: direction === 'forward'
                ? 'route-fwd 280ms cubic-bezier(.2,.8,.2,1) both'
                : direction === 'back'
                ? 'route-back 280ms cubic-bezier(.2,.8,.2,1) both'
                : 'route-jump 180ms ease-out both',
              willChange: 'transform, opacity',
            }}
          >
            {screen}
          </div>
          <style>{`
            @keyframes route-fwd {
              0%   { transform: translateX(22px); opacity: 0; }
              60%  { opacity: 1; }
              100% { transform: translateX(0);    opacity: 1; }
            }
            @keyframes route-back {
              0%   { transform: translateX(-22px); opacity: 0; }
              60%  { opacity: 1; }
              100% { transform: translateX(0);     opacity: 1; }
            }
            @keyframes route-jump {
              0%   { opacity: 0; }
              100% { opacity: 1; }
            }
          `}</style>
          <AskAntonioChat t={t} />
          {paymentOpen && (
            <PaymentSheet t={t} onClose={() => setPaymentOpen(false)} onPaid={() => { markPaid(); setPaymentOpen(false); }} />
          )}
        </PhoneShell>
      </div>

      {/* Aside */}
      <div style={{ width: 260, flexShrink: 0 }}>
        <div style={{ fontFamily: t.mono, fontSize: 10, color: t.muted, letterSpacing: 1.2, marginBottom: 12 }}>
          LIVE PROTOTYPE
        </div>
        <div style={{ fontSize: 14, color: t.inkSoft, lineHeight: 1.55, marginBottom: 20 }}>
          Tap through the real flow. Phone input auto-formats. OTP auto-verifies on 6 digits.
          Services are multi-select with live pricing. Signatures have separate timestamps.
        </div>
        <div style={{
          padding: '14px 16px',
          background: t.card, border: `1px solid ${t.border}`,
          borderRadius: t.radius,
        }}>
          <div style={{ fontFamily: t.mono, fontSize: 10, color: t.muted, letterSpacing: 1, marginBottom: 6 }}>CURRENT STATE</div>
          <div style={{ fontFamily: t.serif, fontSize: 18, color: t.ink, letterSpacing: -0.2 }}>
            {chips.find(c => c.id === route)?.l}
          </div>
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { CanvasOverview, Prototype, PhoneShell });

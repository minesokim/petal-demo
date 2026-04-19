// Tax Questions screen — 7 multi-select yes/no cards.
// Reuses ToggleCard from self-employment.jsx.

function IconCrypto({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="5.5"/>
      <path d="M6.5 5.5v5M9.5 5.5v5M5.5 7H10a1.25 1.25 0 010 2.5H5.5M5.5 9.5h4.8a1.25 1.25 0 010 2.5H5.5"/>
    </svg>
  );
}
function IconReceipt({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 2h9v12l-1.5-1-1.5 1-1.5-1-1.5 1-1.5-1-1.5 1V2z"/>
      <path d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3"/>
    </svg>
  );
}
function IconHealth({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 13.5S2.5 10 2.5 6a3 3 0 015.5-1.7A3 3 0 0113.5 6c0 4-5.5 7.5-5.5 7.5z"/>
    </svg>
  );
}
function IconPiggy({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="12" height="7" rx="2"/>
      <path d="M5 5V3.5h6V5M4 12v1.5M12 12v1.5M11 8h.5"/>
    </svg>
  );
}
function IconGlobe({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="5.5"/>
      <path d="M2.5 8h11M8 2.5c1.8 2 1.8 9 0 11M8 2.5c-1.8 2-1.8 9 0 11"/>
    </svg>
  );
}
function IconClock({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="5.5"/>
      <path d="M8 5v3.2l2 1.3"/>
    </svg>
  );
}
function IconTip({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="5.5"/>
      <path d="M8 5v6M9.8 6.3c-.3-.5-1-.8-1.8-.8-1 0-1.8.5-1.8 1.3 0 1.8 3.6 1 3.6 2.6 0 .8-.8 1.3-1.8 1.3-.8 0-1.5-.3-1.8-.8"/>
    </svg>
  );
}

function ScreenTaxQuestions({ t, onNext, onBack }) {
  // Pre-set a realistic mix of answers
  const [state, setState] = React.useState({
    crypto: false,
    estimated: true,
    healthAll: true,
    retirement: true,
    foreign: false,
    overtime: false,
    tips: false,
  });
  const toggle = (k) => setState(s => ({ ...s, [k]: !s[k] }));

  const questions = [
    { k: 'crypto',    icon: <IconCrypto/>,  label: 'Did you transact in digital assets?',
      sub: 'Crypto, NFTs, stablecoins — even small airdrops count' },
    { k: 'estimated', icon: <IconReceipt/>, label: 'Did you make estimated tax payments?',
      sub: 'Quarterly payments to the IRS' },
    { k: 'healthAll', icon: <IconHealth/>,  label: 'Did you have health insurance all year?',
      sub: 'Through employer, marketplace, or Medicare' },
    { k: 'retirement',icon: <IconPiggy/>,   label: 'Did you contribute to an IRA or HSA?',
      sub: 'Traditional IRA, Roth IRA, or Health Savings Account' },
    { k: 'foreign',   icon: <IconGlobe/>,   label: 'Do you have foreign bank accounts or assets over $10,000?',
      sub: 'At any point in 2025 — triggers FBAR reporting', emphasis: true },
    { k: 'overtime',  icon: <IconClock/>,   label: 'Did you earn overtime pay?',
      sub: 'New 2025 deduction — triggers paystub request' },
    { k: 'tips',      icon: <IconTip/>,     label: 'Did you earn tips at work?',
      sub: 'New 2025 deduction — triggers tip summary request' },
  ];

  return (
    <Screen t={t}>
      <div style={{ padding: '24px 0 0', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <IntakeHeader t={t} step={8} label="Tax questions" />

        {/* Back */}
        <div style={{ padding: '22px 24px 0' }}>
          <button onClick={onBack} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', padding: 0,
            cursor: 'pointer', fontSize: 13, color: t.muted, fontFamily: t.sans,
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M9 3l-4 4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
        </div>

        {/* Headline */}
        <div style={{ padding: '18px 24px 8px' }}>
          <Stack gap={10}>
            <H1 t={t}>A few quick tax questions</H1>
            <Body t={t} size={15}>These help me plan your return before we even meet.</Body>
          </Stack>
        </div>

        {/* Cards */}
        <Stack gap={10} style={{ padding: '22px 24px 16px', flex: 1 }}>
          {questions.map(q => (
            <ToggleCard
              key={q.k}
              t={t}
              on={state[q.k]}
              onClick={() => toggle(q.k)}
              icon={q.icon}
              label={q.label}
              sub={q.sub}
              emphasis={q.emphasis}
            />
          ))}

          <div style={{ marginTop: 10 }}>
            <AntonioNote t={t}>
              The digital assets question is on the front page of the 1040 now. The IRS is watching this closely. Foreign accounts and crypto are audit magnets — better to disclose than hide.
            </AntonioNote>
          </div>
        </Stack>

        {/* Ask Antonio + bottom nav */}
        <div style={{
          position: 'sticky', bottom: 0,
          background: `linear-gradient(to top, ${t.bg} 75%, transparent)`,
          padding: '20px 24px 28px',
          marginTop: 12,
        }}>
          <div style={{ marginBottom: 12 }}>
            <AskAntonioBar t={t} onMessage={() => {}} />
          </div>
          <Row gap={10}>
            <Button t={t} variant="ghost" onClick={onBack} style={{ flex: '0 0 auto' }}>Back</Button>
            <Button t={t} onClick={onNext} style={{ flex: 1 }}>Continue</Button>
          </Row>
        </div>
      </div>
    </Screen>
  );
}

Object.assign(window, { ScreenTaxQuestions });

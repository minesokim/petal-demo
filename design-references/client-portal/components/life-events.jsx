// Life Events — multi-select w/ exclusive "None of these".

function IconRings({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="10" r="3.5"/>
      <circle cx="10" cy="10" r="3.5"/>
    </svg>
  );
}
function IconStroller({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l3 3v4h7"/>
      <path d="M13 10a4 4 0 00-7-3"/>
      <circle cx="6" cy="13" r="1"/>
      <circle cx="12" cy="13" r="1"/>
    </svg>
  );
}
function IconKey({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="11" r="2.5"/>
      <path d="M7 10l6-6M11 5l1.5 1.5M9.5 6.5L11 8"/>
    </svg>
  );
}
function IconBriefcase({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="12" height="8" rx="1"/>
      <path d="M6 5V3.5a1 1 0 011-1h2a1 1 0 011 1V5M2 8.5h12"/>
    </svg>
  );
}
function IconGift({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="12" height="7" rx="1"/>
      <path d="M2 9h12M8 6v7M5.5 6c-1.5 0-1.5-2.5 0-2.5C7 3.5 8 6 8 6S9 3.5 10.5 3.5c1.5 0 1.5 2.5 0 2.5"/>
    </svg>
  );
}
function IconBeach({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2v12M2 10c2 0 4-1 6-1s4 1 6 1"/>
      <path d="M3 6a5 5 0 0110 0"/>
    </svg>
  );
}

function ScreenLifeEvents({ t, onNext, onBack }) {
  const [state, setState] = React.useState({
    marriage: false, baby: false, home: true, business: false,
    inherit: false, retire: false, none: false,
  });

  const toggle = (k) => {
    setState(s => {
      if (k === 'none') {
        return s.none
          ? { ...s, none: false }
          : { marriage: false, baby: false, home: false, business: false,
              inherit: false, retire: false, none: true };
      }
      return { ...s, [k]: !s[k], none: false };
    });
  };

  const items = [
    { k: 'marriage', icon: <IconRings/>,     label: 'Got married or divorced' },
    { k: 'baby',     icon: <IconStroller/>,  label: 'Had a baby or adopted' },
    { k: 'home',     icon: <IconKey/>,       label: 'Bought or sold a home' },
    { k: 'business', icon: <IconBriefcase/>, label: 'Started a business' },
    { k: 'inherit',  icon: <IconGift/>,      label: 'Received an inheritance' },
    { k: 'retire',   icon: <IconBeach/>,     label: 'Retired' },
  ];

  return (
    <Screen t={t}>
      <div style={{ padding: '24px 0 0', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <IntakeHeader t={t} step={10} label="Life events" />

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
            <H1 t={t}>Any major life changes in 2025?</H1>
            <Body t={t} size={15}>These can significantly affect your return.</Body>
          </Stack>
        </div>

        {/* Cards */}
        <Stack gap={10} style={{ padding: '22px 24px 16px', flex: 1 }}>
          {items.map(item => (
            <ToggleCard
              key={item.k}
              t={t}
              on={state[item.k]}
              onClick={() => toggle(item.k)}
              icon={item.icon}
              label={item.label}
            />
          ))}

          <div style={{ marginTop: 2 }}>
            <ToggleCard
              t={t}
              on={state.none}
              onClick={() => toggle('none')}
              icon={<IconMinus/>}
              label="None of these"
              sub="Nothing major happened this year"
            />
          </div>

          <div style={{ marginTop: 10 }}>
            <AntonioNote t={t}>
              Life changes often mean tax changes. Even if you're not sure it matters, mention it and I'll check.
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

Object.assign(window, { ScreenLifeEvents });

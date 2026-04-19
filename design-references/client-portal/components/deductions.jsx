// Deductions screen — multi-select toggles with an exclusive "None" option,
// and an inline Form 2441 expansion when "Childcare" is on.

function IconHouse({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 7L8 2.5 13.5 7v6.5H2.5V7z"/>
      <path d="M6.5 13.5v-4h3v4"/>
    </svg>
  );
}
function IconCap({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1.5 6L8 3l6.5 3L8 9 1.5 6z"/>
      <path d="M4 7v3c0 1 1.8 2 4 2s4-1 4-2V7"/>
    </svg>
  );
}
function IconHeart({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 13.5S2.5 10 2.5 6a3 3 0 015.5-1.7A3 3 0 0113.5 6c0 4-5.5 7.5-5.5 7.5z"/>
    </svg>
  );
}
function IconChild({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="4.5" r="2"/>
      <path d="M3.5 14c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5"/>
    </svg>
  );
}
function IconMed({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h4v3h3v4h-3v3H6v-3H3V6h3V3z"/>
    </svg>
  );
}
function IconBook({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3h4.5c1 0 1.5.5 1.5 1.5V13c0-.8-.5-1.3-1.5-1.3H3V3zM13 3H8.5C7.5 3 7 3.5 7 4.5V13c0-.8.5-1.3 1.5-1.3H13V3z"/>
    </svg>
  );
}
function IconApple({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 5c-1.5-1.8-5-1.3-5 2 0 3 2.5 6 5 6s5-3 5-6c0-3.3-3.5-3.8-5-2z"/>
      <path d="M8 5V3.5M8 3.5s1 0 1.5-1"/>
    </svg>
  );
}
function IconMinus({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="5.5"/>
      <path d="M5 8h6"/>
    </svg>
  );
}

function ScreenDeductions({ t, onNext, onBack }) {
  const [state, setState] = React.useState({
    mortgage: true,
    student: false,
    charity: true,
    childcare: true,
    medical: false,
    education: false,
    educator: false,
    none: false,
  });

  const toggle = (k) => {
    setState(s => {
      if (k === 'none') {
        // Selecting None clears everything else; toggling it off leaves the rest as they were
        return s.none
          ? { ...s, none: false }
          : { mortgage: false, student: false, charity: false, childcare: false,
              medical: false, education: false, educator: false, none: true };
      }
      return { ...s, [k]: !s[k], none: false };
    });
  };

  const items = [
    { k: 'mortgage',  icon: <IconHouse/>, label: 'Home mortgage' },
    { k: 'student',   icon: <IconCap/>,   label: 'Student loans' },
    { k: 'charity',   icon: <IconHeart/>, label: 'Charitable donations' },
    { k: 'childcare', icon: <IconChild/>, label: 'Childcare costs' },
    { k: 'medical',   icon: <IconMed/>,   label: 'Medical expenses' },
    { k: 'education', icon: <IconBook/>,  label: 'Education / tuition' },
    { k: 'educator',  icon: <IconApple/>, label: 'Educator expenses',
      sub: 'K–12 teacher supplies, up to $300' },
  ];

  return (
    <Screen t={t}>
      <div style={{ padding: '24px 0 0', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <IntakeHeader t={t} step={9} label="Deductions" />

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
            <H1 t={t}>Quick check on deductions</H1>
            <Body t={t} size={15}>Select anything that might apply. When in doubt, select it.</Body>
          </Stack>
        </div>

        {/* Cards */}
        <Stack gap={10} style={{ padding: '22px 24px 16px', flex: 1 }}>
          {items.map(item => (
            <React.Fragment key={item.k}>
              <ToggleCard
                t={t}
                on={state[item.k]}
                onClick={() => toggle(item.k)}
                icon={item.icon}
                label={item.label}
                sub={item.sub}
              />

              {/* Inline Form 2441 expansion when Childcare is toggled on */}
              {item.k === 'childcare' && state.childcare && (
                <div style={{
                  marginTop: -2,
                  marginLeft: 18,
                  padding: '16px 16px 8px 18px',
                  borderLeft: `2px solid ${t.rust}`,
                  background: t.bgElev,
                  borderTopRightRadius: 8, borderBottomRightRadius: 8,
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    marginBottom: 14,
                  }}>
                    <span style={{
                      fontFamily: t.mono, fontSize: 9.5, color: t.rustInk,
                      letterSpacing: 1, textTransform: 'uppercase',
                    }}>Form 2441 · Provider info</span>
                  </div>

                  <Stack gap={14}>
                    <div>
                      <FieldLabel t={t}>Provider name</FieldLabel>
                      <TextField t={t} placeholder="Daycare or individual's name" value="Little Sprouts Learning Center" />
                    </div>
                    <div>
                      <FieldLabel t={t}>Provider address</FieldLabel>
                      <TextField t={t} placeholder="Street, city, state, ZIP" value="2204 Oak Ave, Claremont, CA 91711" />
                    </div>
                    <div>
                      <FieldLabel t={t}>Provider EIN</FieldLabel>
                      <TextField t={t} mono inputMode="numeric" placeholder="XX-XXXXXXX" value="46-8217339" />
                    </div>
                    <div>
                      <FieldLabel t={t}>Amount paid in 2025</FieldLabel>
                      <TextField t={t} mono inputMode="decimal" placeholder="$0" value="$9,840" />
                    </div>
                  </Stack>
                </div>
              )}
            </React.Fragment>
          ))}

          {/* Exclusive "None" */}
          <div style={{ marginTop: 2 }}>
            <ToggleCard
              t={t}
              on={state.none}
              onClick={() => toggle('none')}
              icon={<IconMinus/>}
              label="None of these"
              sub="Skip straight to the next step"
            />
          </div>

          <div style={{ marginTop: 10 }}>
            <AntonioNote t={t}>
              Even if you're not sure something counts, select it. I'd rather check than miss a deduction worth hundreds.
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

Object.assign(window, { ScreenDeductions });

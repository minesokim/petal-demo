// Self-Employment Detail screen — conditional step after Income.
// Fields + 2 feature toggles + 1 pricing-tied cash toggle.

function ToggleCard({ t, on, onClick, icon, label, sub, emphasis }) {
  const borderColor = on
    ? (emphasis ? t.rust : t.ink)
    : t.border;
  const bg = on
    ? (emphasis ? t.tintAccent : t.bgElev)
    : t.card;

  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 14,
      width: '100%',
      padding: '14px 16px',
      background: bg,
      border: `1px solid ${borderColor}`,
      borderRadius: t.radius,
      cursor: 'pointer',
      textAlign: 'left',
      fontFamily: t.sans,
      transition: 'border-color 120ms, background 120ms',
    }}>
      {/* Icon well */}
      <div style={{
        width: 36, height: 36, borderRadius: 8,
        background: on ? (emphasis ? t.rust : t.ink) : t.bgElev,
        border: `1px solid ${on ? 'transparent' : t.borderSoft}`,
        color: on ? '#fff' : t.inkSoft,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 15, color: t.ink, fontWeight: 500,
          letterSpacing: -0.1, marginBottom: sub ? 2 : 0,
        }}>{label}</div>
        {sub && (
          <div style={{ fontSize: 12, color: t.muted, lineHeight: 1.35 }}>{sub}</div>
        )}
      </div>

      {/* Square check */}
      <div style={{
        width: 22, height: 22, borderRadius: 6,
        border: `1.5px solid ${on ? (emphasis ? t.rust : t.ink) : t.border}`,
        background: on ? (emphasis ? t.rust : t.ink) : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {on && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2">
            <path d="M2.5 6.5l2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
    </button>
  );
}

// small inline icons
function IconHome({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 7L8 2.5 13.5 7v6.5H2.5V7z"/>
      <path d="M6.5 13.5v-4h3v4"/>
    </svg>
  );
}
function IconCar({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 10.5v-2l1.5-3.5h9L14 8.5v2"/>
      <path d="M2 10.5h12v2H2z"/>
      <circle cx="5" cy="12.5" r="1"/>
      <circle cx="11" cy="12.5" r="1"/>
    </svg>
  );
}
function IconCash({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="4" width="13" height="8" rx="1"/>
      <circle cx="8" cy="8" r="1.8"/>
      <path d="M4 8h.5M11.5 8h.5"/>
    </svg>
  );
}

function ScreenSelfEmployment({ t, onNext, onBack }) {
  const [homeOffice, setHomeOffice] = React.useState(true);
  const [vehicle, setVehicle] = React.useState(false);
  const [cash, setCash] = React.useState(false);

  return (
    <Screen t={t}>
      <div style={{ padding: '24px 0 0', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <IntakeHeader t={t} step={7} label="Self-employment" />

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

        {/* Conditional context chip */}
        <div style={{ padding: '18px 24px 0' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '5px 10px',
            background: t.tintAccent,
            border: `1px solid ${t.rustSoft}`,
            borderRadius: 999,
            fontFamily: t.mono, fontSize: 9.5, color: t.rustInk,
            letterSpacing: 0.9, textTransform: 'uppercase',
          }}>
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M2 5l2 2 3-4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Because you're self-employed
          </span>
        </div>

        {/* Headline */}
        <div style={{ padding: '14px 24px 8px' }}>
          <Stack gap={10}>
            <H1 t={t}>Tell me about your self-employment</H1>
            <Body t={t} size={15}>This opens up lots of deductions most people miss.</Body>
          </Stack>
        </div>

        {/* Form */}
        <Stack gap={18} style={{ padding: '22px 24px 16px', flex: 1 }}>
          <div>
            <FieldLabel t={t}>Business name</FieldLabel>
            <TextField t={t} placeholder="e.g., Freelance Design LLC" value="Juniper Studio" />
          </div>

          <div>
            <FieldLabel t={t}>What do you do?</FieldLabel>
            <TextField t={t} placeholder="e.g., Graphic design, consulting" value="Freelance illustration & book covers" />
          </div>

          <div>
            <FieldLabel t={t}>Entity type</FieldLabel>
            <TextField t={t} placeholder="Sole Prop, LLC, S-Corp, or N/A" value="Single-member LLC" />
          </div>

          <div>
            <FieldLabel t={t}>EIN (if any)</FieldLabel>
            <TextField t={t} mono inputMode="numeric" placeholder="XX-XXXXXXX or N/A" value="87-2134509" />
          </div>

          <div>
            <FieldLabel t={t}>Approximate 2025 revenue</FieldLabel>
            <TextField t={t} mono inputMode="decimal" placeholder="e.g., $50,000" value="$58,400" />
          </div>

          {/* Toggle cards */}
          <div style={{ marginTop: 6 }}>
            <FieldLabel t={t}>Business setup</FieldLabel>
            <Stack gap={10}>
              <ToggleCard
                t={t}
                on={homeOffice}
                onClick={() => setHomeOffice(v => !v)}
                icon={<IconHome/>}
                label="I use a home office"
                sub="Dedicated space used regularly for work"
              />
              <ToggleCard
                t={t}
                on={vehicle}
                onClick={() => setVehicle(v => !v)}
                icon={<IconCar/>}
                label="I use a vehicle for business"
                sub="Mileage, parking, tolls for client work"
              />
            </Stack>
          </div>

          {/* Cash toggle — pricing-tied */}
          <div>
            <FieldLabel t={t} hint={cash ? '+$150 DOCS FEE' : undefined}>Documentation</FieldLabel>
            <ToggleCard
              t={t}
              on={cash}
              onClick={() => setCash(v => !v)}
              icon={<IconCash/>}
              label="Is most of my revenue in cash?"
              sub="Cash businesses require more documentation"
              emphasis
            />
          </div>

          <div style={{ marginTop: 6 }}>
            <AntonioNote t={t}>
              Self-employment has dozens of deductions most people miss. Home office, mileage, equipment, health insurance, retirement contributions. We'll go through all of them.
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

Object.assign(window, { ScreenSelfEmployment });

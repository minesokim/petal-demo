// Dependents Count screen — single-select 4 options.
// Routes forward: skips dependent details if "None" selected.

function DependentCard({ t, selected, onClick, label, sub, icon }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        width: '100%',
        padding: '18px 18px',
        background: selected ? t.tintAccent : t.card,
        border: `1px solid ${selected ? t.rust : t.border}`,
        borderRadius: t.radius,
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: t.sans,
        transition: 'border-color 120ms, background 120ms',
      }}
    >
      {/* Count icon */}
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: selected ? t.rust : t.bgElev,
        border: `1px solid ${selected ? t.rust : t.borderSoft}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        fontFamily: t.serif,
        fontSize: 20, fontWeight: 500,
        color: selected ? '#fff' : t.ink,
        letterSpacing: -0.4,
      }}>
        {icon}
      </div>

      {/* Label */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 16, color: t.ink, fontWeight: 500,
          letterSpacing: -0.1, marginBottom: sub ? 2 : 0,
        }}>{label}</div>
        {sub && (
          <div style={{ fontSize: 12.5, color: t.muted, lineHeight: 1.35 }}>{sub}</div>
        )}
      </div>

      {/* Radio */}
      <div style={{
        width: 20, height: 20, borderRadius: '50%',
        border: `1.5px solid ${selected ? t.rust : t.border}`,
        background: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {selected && (
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: t.rust,
          }}/>
        )}
      </div>
    </button>
  );
}

function ScreenDependentsCount({ t, onNext, onBack, initial }) {
  const [sel, setSel] = React.useState(initial ?? null);

  const options = [
    { id: 'none', label: 'No dependents', sub: 'Just me (and spouse, if applicable)', icon: '0' },
    { id: 'one',  label: '1 dependent',   sub: 'One child, parent, or other',        icon: '1' },
    { id: 'two',  label: '2 dependents',  sub: 'Two qualifying individuals',         icon: '2' },
    { id: 'more', label: '3 or more',     sub: 'We\u2019ll capture the full list next',     icon: '3+' },
  ];

  const handleContinue = () => {
    if (!onNext) return;
    // Route-skip: "none" skips dependent-details step.
    onNext(sel === 'none' ? 'skip' : 'details');
  };

  return (
    <Screen t={t}>
      <div style={{ padding: '24px 0 0', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <IntakeHeader t={t} step={6} label="Dependents" />

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
            <H1 t={t}>Do you have any dependents?</H1>
            <Body t={t} size={15}>Children, elderly parents, or anyone who depends on you financially.</Body>
          </Stack>
        </div>

        {/* Options */}
        <Stack gap={10} style={{ padding: '22px 24px 16px', flex: 1 }}>
          {options.map(o => (
            <DependentCard
              key={o.id}
              t={t}
              selected={sel === o.id}
              onClick={() => setSel(o.id)}
              label={o.label}
              sub={o.sub}
              icon={o.icon}
            />
          ))}

          <div style={{ marginTop: 10 }}>
            <AntonioNote t={t}>
              Dependents unlock credits like the Child Tax Credit ($2,000+ per child). Even if you're not sure someone qualifies, mention them.
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
            <Button
              t={t}
              onClick={handleContinue}
              disabled={!sel}
              style={{ flex: 1, opacity: sel ? 1 : 0.45 }}
            >
              Continue
            </Button>
          </Row>
        </div>
      </div>
    </Screen>
  );
}

Object.assign(window, { ScreenDependentsCount });

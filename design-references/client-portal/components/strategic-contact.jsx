// Strategic Topics — shown if user selected "Strategic tax & business consultation" on Services.
// Multi-select checkbox list.

function TopicCard({ t, selected, onClick, label, sub }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '14px 14px',
        background: selected ? t.tintAccent : t.card,
        border: `1px solid ${selected ? t.rust : t.border}`,
        borderRadius: t.radius,
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: t.sans,
        transition: 'border-color 120ms, background 120ms',
      }}
    >
      {/* Checkbox */}
      <div style={{
        width: 18, height: 18, borderRadius: 4,
        border: `1.5px solid ${selected ? t.rust : t.border}`,
        background: selected ? t.rust : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginTop: 1,
      }}>
        {selected && (
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="#fff" strokeWidth="2">
            <path d="M2.5 5.5l2 2 4-5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: t.ink, letterSpacing: -0.1 }}>
          {label}
        </div>
        {sub && (
          <div style={{ fontSize: 12.5, color: t.muted, marginTop: 3, lineHeight: 1.4 }}>
            {sub}
          </div>
        )}
      </div>
    </button>
  );
}

function ScreenStrategicTopics({ t, onNext, onBack }) {
  const [picked, setPicked] = React.useState(new Set(['planning', 'entity']));

  const topics = [
    { id: 'planning',   label: 'Tax planning & projections' },
    { id: 'entity',     label: 'Entity restructuring', sub: 'LLC to S-Corp, etc.' },
    { id: 'estimated',  label: 'Estimated tax payments' },
    { id: 'retirement', label: 'Retirement planning' },
    { id: 'realestate', label: 'Real estate strategy' },
    { id: 'irs',        label: 'IRS notice or audit', sub: 'I received something from the IRS' },
    { id: 'other',      label: 'Other' },
  ];

  const toggle = (id) => {
    const next = new Set(picked);
    if (next.has(id)) next.delete(id); else next.add(id);
    setPicked(next);
  };

  return (
    <Screen t={t}>
      <div style={{ padding: '24px 0 0', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <IntakeHeader t={t} step={2} label="Consultation" />

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

        {/* Conditional chip */}
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
            Strategic consultation
          </span>
        </div>

        {/* Headline */}
        <div style={{ padding: '14px 24px 8px' }}>
          <Stack gap={10}>
            <H1 t={t}>What do you want to discuss?</H1>
            <Body t={t} size={15}>Select all that apply so I can prepare.</Body>
          </Stack>
        </div>

        {/* Topics list */}
        <Stack gap={8} style={{ padding: '22px 24px 16px', flex: 1 }}>
          {topics.map(tp => (
            <TopicCard
              key={tp.id}
              t={t}
              selected={picked.has(tp.id)}
              onClick={() => toggle(tp.id)}
              label={tp.label}
              sub={tp.sub}
            />
          ))}

          <div style={{ marginTop: 10 }}>
            <AntonioNote t={t}>
              Come with specific questions. The more prepared you are, the more value we get out of the hour.
            </AntonioNote>
          </div>
        </Stack>

        {/* Sticky bottom */}
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

// Contact Info — shared terminal screen for non-tax service paths (intro consult,
// bookkeeping, formation, strategic). Precedes scheduling.

function ScreenContactInfo({ t, onNext, onBack }) {
  return (
    <Screen t={t}>
      <div style={{ padding: '24px 0 0', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <IntakeHeader t={t} step={3} label="Contact" />

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
        <div style={{ padding: '20px 24px 8px' }}>
          <Stack gap={10}>
            <H1 t={t}>Your contact information</H1>
            <Body t={t} size={15}>So Antonio can reach you.</Body>
          </Stack>
        </div>

        {/* Form — just three fields */}
        <Stack gap={20} style={{ padding: '28px 24px 16px', flex: 1 }}>
          <div>
            <FieldLabel t={t}>Full name</FieldLabel>
            <TextField t={t} placeholder="Maya Chen" value="Maya Chen" />
          </div>

          <div>
            <FieldLabel t={t}>Email</FieldLabel>
            <TextField t={t} placeholder="you@example.com" value="maya@juniperstudio.co" />
          </div>

          <div>
            <FieldLabel t={t}>Phone</FieldLabel>
            <TextField t={t} mono placeholder="(415) 555-0134" value="(415) 555-0134" />
          </div>
        </Stack>

        {/* Sticky bottom */}
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

Object.assign(window, { ScreenStrategicTopics, ScreenContactInfo });

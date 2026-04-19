// Business Formation — shown if user selected "Business formation" on Services.
// Short intake: name, description, entity type (4-way single-select), state, owner count.

function EntityCard({ t, selected, onClick, label, sub, acronym }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        minWidth: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
        gap: 4,
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
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        width: '100%', justifyContent: 'space-between',
      }}>
        <span style={{
          fontFamily: t.serif, fontSize: 19, fontWeight: 500,
          color: t.ink, letterSpacing: -0.3,
        }}>{acronym}</span>
        <div style={{
          width: 16, height: 16, borderRadius: '50%',
          border: `1.5px solid ${selected ? t.rust : t.border}`,
          background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {selected && <div style={{ width: 7, height: 7, borderRadius: '50%', background: t.rust }}/>}
        </div>
      </div>
      <div style={{ fontSize: 12, color: t.muted, lineHeight: 1.35 }}>{sub}</div>
    </button>
  );
}

function ScreenBusinessFormation({ t, onNext, onBack }) {
  const [entity, setEntity] = React.useState('llc');

  const entities = [
    { id: 'llc',    acronym: 'LLC',    sub: 'Pass-through, flexible' },
    { id: 'scorp',  acronym: 'S-Corp', sub: 'Payroll + distributions' },
    { id: 'ccorp',  acronym: 'C-Corp', sub: 'Separate taxable entity' },
    { id: 'unsure', acronym: 'Not sure', sub: 'Need guidance from Antonio' },
  ];

  return (
    <Screen t={t}>
      <div style={{ padding: '24px 0 0', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <IntakeHeader t={t} step={2} label="Formation" />

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
            Because you're forming a business
          </span>
        </div>

        {/* Headline */}
        <div style={{ padding: '14px 24px 8px' }}>
          <Stack gap={10}>
            <H1 t={t}>Let's set up your business</H1>
            <Body t={t} size={15}>Tell me what you want to start.</Body>
          </Stack>
        </div>

        {/* Form */}
        <Stack gap={20} style={{ padding: '22px 24px 16px', flex: 1 }}>
          <div>
            <FieldLabel t={t}>Desired business name</FieldLabel>
            <TextField t={t} placeholder="Park Cleaners LLC" value="Juniper Studio LLC" />
          </div>

          <div>
            <FieldLabel t={t}>What will the business do?</FieldLabel>
            <TextField t={t} placeholder="A short description" value="Freelance illustration & book cover design" />
          </div>

          {/* Entity type — 2x2 grid */}
          <div>
            <FieldLabel t={t}>Entity type</FieldLabel>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
            }}>
              {entities.map(e => (
                <EntityCard
                  key={e.id}
                  t={t}
                  selected={entity === e.id}
                  onClick={() => setEntity(e.id)}
                  acronym={e.acronym}
                  sub={e.sub}
                />
              ))}
            </div>
          </div>

          <div>
            <FieldLabel t={t}>State of incorporation</FieldLabel>
            <TextField t={t} placeholder="California" value="California" />
          </div>

          <div>
            <FieldLabel t={t}>Number of owners</FieldLabel>
            <TextField t={t} mono inputMode="numeric" placeholder="1, 2" value="1" />
          </div>

          <div style={{ marginTop: 6 }}>
            <AntonioNote t={t}>
              If you're not sure which entity type, that's exactly what we'll figure out in our consultation. Most of my clients end up with an LLC, then elect S-Corp status once their income justifies it.
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

Object.assign(window, { ScreenBusinessFormation });

// Dependent Details screen — per-dependent cards with 5 fields each.
// Conditional: only shown if user said >0 dependents on prior step.

function DependentCardDetails({ t, index }) {
  return (
    <div style={{
      padding: '18px 18px 6px',
      background: t.bgElev,
      border: `1px solid ${t.borderSoft}`,
      borderRadius: t.radius,
    }}>
      <div style={{
        fontFamily: t.mono, fontSize: 10, color: t.rustInk,
        letterSpacing: 1.4, textTransform: 'uppercase',
        marginBottom: 14,
      }}>
        Dependent {index}
      </div>

      <Stack gap={16}>
        <div>
          <FieldLabel t={t}>Full name</FieldLabel>
          <TextField t={t} placeholder="First and last name" value={index === 1 ? 'Liam Rodriguez' : 'Sofia Rodriguez'} />
        </div>

        <div>
          <FieldLabel t={t}>Date of birth</FieldLabel>
          <TextField t={t} mono inputMode="numeric" placeholder="MM / DD / YYYY"
            value={index === 1 ? '06 / 14 / 2016' : '09 / 02 / 2019'} />
        </div>

        <div>
          <FieldLabel t={t} hint="LAST 4 SHOWN">Social Security Number</FieldLabel>
          <SSNField t={t} />
        </div>

        <div>
          <FieldLabel t={t}>Relationship</FieldLabel>
          <TextField t={t} placeholder="Son, Daughter, Parent" value={index === 1 ? 'Son' : 'Daughter'} />
        </div>

        <div>
          <FieldLabel t={t}>Months living with you in 2025</FieldLabel>
          <TextField t={t} mono inputMode="numeric" placeholder="12" value="12" />
        </div>
      </Stack>
    </div>
  );
}

function ScreenDependentDetails({ t, onNext, onBack, count = 2 }) {
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
            <H1 t={t}>Tell me about your dependents</H1>
            <Body t={t} size={15}>Just the basics. I'll sort out who qualifies.</Body>
          </Stack>
        </div>

        {/* Cards */}
        <Stack gap={12} style={{ padding: '22px 24px 16px', flex: 1 }}>
          {Array.from({ length: count }).map((_, i) => (
            <DependentCardDetails key={i} t={t} index={i + 1} />
          ))}

          <div style={{ marginTop: 10 }}>
            <AntonioNote t={t}>
              If you have a child under 13 and pay for daycare, that's a big credit we don't want to miss — I'll ask about that next.
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

Object.assign(window, { ScreenDependentDetails });

// Spouse Info screen — conditional, shown only after MFJ/MFS on filing status.
// Short screen: 4 fields, same field idiom as Personal Info.

function ScreenSpouseInfo({ t, onNext, onBack }) {
  return (
    <Screen t={t}>
      <div style={{ padding: '24px 0 0', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <IntakeHeader t={t} step={5} label="Spouse" />

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
            Because you're filing jointly
          </span>
        </div>

        {/* Headline */}
        <div style={{ padding: '14px 24px 8px' }}>
          <Stack gap={10}>
            <H1 t={t}>Tell me about your spouse.</H1>
            <Body t={t} size={15}>Basic info for the joint return.</Body>
          </Stack>
        </div>

        {/* Form */}
        <Stack gap={20} style={{ padding: '22px 24px 16px', flex: 1 }}>
          <div>
            <FieldLabel t={t}>Spouse's full legal name</FieldLabel>
            <TextField t={t} value="David James Rodriguez" />
          </div>

          <div>
            <FieldLabel t={t}>Date of birth</FieldLabel>
            <TextField t={t} value="11 / 22 / 1985" mono inputMode="numeric" />
          </div>

          <div>
            <FieldLabel t={t} hint="LAST 4 SHOWN">Social Security Number</FieldLabel>
            <SSNField t={t} />
          </div>

          <div>
            <FieldLabel t={t}>Occupation</FieldLabel>
            <TextField t={t} value="High School Math Teacher" />
          </div>

          <div style={{ marginTop: 8 }}>
            <AntonioNote t={t}>
              Your SSN is encrypted the moment you type it. I only see the last 4 digits until I'm actively preparing your return.
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

Object.assign(window, { ScreenSpouseInfo });

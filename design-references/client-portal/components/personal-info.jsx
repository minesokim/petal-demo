// Personal Info screen — intake step 2/10 (after Services, before Filing).
// Standard intake header, labeled form fields, address group, Antonio note,
// Ask Antonio bar, bottom nav.

function FieldLabel({ t, children, hint }) {
  return (
    <Row justify="space-between" align="baseline" style={{ marginBottom: 6 }}>
      <span style={{
        fontFamily: t.sans, fontSize: 12, color: t.muted,
        fontWeight: 500, letterSpacing: 0,
      }}>{children}</span>
      {hint && (
        <span style={{
          fontFamily: t.mono, fontSize: 10, color: t.muted,
          letterSpacing: 0.4,
        }}>{hint}</span>
      )}
    </Row>
  );
}

function TextField({ t, value, placeholder, mono, inputMode, style, readOnly, type = 'text' }) {
  return (
    <input
      type={type}
      inputMode={inputMode}
      defaultValue={value}
      placeholder={placeholder}
      readOnly={readOnly}
      style={{
        width: '100%',
        background: 'transparent',
        border: 'none',
        borderBottom: `1px solid ${t.border}`,
        padding: '10px 0 10px',
        fontSize: 16,
        color: t.ink,
        fontFamily: mono ? t.mono : t.sans,
        letterSpacing: mono ? 0.3 : 0,
        outline: 'none',
        ...style,
      }}
      onFocus={(e) => e.target.style.borderBottomColor = t.rust}
      onBlur={(e) => e.target.style.borderBottomColor = t.border}
    />
  );
}

// SSN field — masked dots for the first 5 digits, last 4 visible in larger mono.
// Small "ENCRYPTED" chip on the right.
function SSNField({ t }) {
  const visibleLast4 = '0234';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 0 10px',
      borderBottom: `1px solid ${t.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flex: 1 }}>
        {/* 3 dots · 2 dots · 4 digits */}
        <span style={{
          fontFamily: t.mono, fontSize: 14, color: t.muted,
          letterSpacing: 2, lineHeight: 1,
        }}>•••</span>
        <span style={{ fontFamily: t.mono, fontSize: 14, color: t.muted }}>–</span>
        <span style={{
          fontFamily: t.mono, fontSize: 14, color: t.muted,
          letterSpacing: 2, lineHeight: 1,
        }}>••</span>
        <span style={{ fontFamily: t.mono, fontSize: 14, color: t.muted }}>–</span>
        <span style={{
          fontFamily: t.mono, fontSize: 19, color: t.ink,
          letterSpacing: 1.5, fontWeight: 500,
        }}>{visibleLast4}</span>
      </div>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '4px 9px',
        background: t.tintAccent,
        border: `1px solid ${t.rustSoft}`,
        borderRadius: 999,
        fontFamily: t.mono, fontSize: 9, color: t.rustInk,
        letterSpacing: 0.8,
      }}>
        <svg width="9" height="10" viewBox="0 0 9 10" fill="none" stroke="currentColor" strokeWidth="1.3">
          <rect x="1.5" y="4.5" width="6" height="5" rx="0.8"/>
          <path d="M3 4.5V3a1.5 1.5 0 013 0v1.5" strokeLinecap="round"/>
        </svg>
        ENCRYPTED
      </span>
    </div>
  );
}

function ScreenPersonalInfo({ t, onNext, onBack }) {
  return (
    <Screen t={t}>
      <div style={{ padding: '24px 0 0', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <IntakeHeader t={t} step={2} label="Personal" />

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
            <H1 t={t}>Your basic information</H1>
            <Body t={t} size={15}>This goes directly onto your return.</Body>
          </Stack>
        </div>

        {/* Form */}
        <Stack gap={18} style={{ padding: '22px 24px 16px', flex: 1 }}>
          <div>
            <FieldLabel t={t}>Full legal name</FieldLabel>
            <TextField t={t} value="Maria Elena Rodriguez" />
          </div>

          <div>
            <FieldLabel t={t}>Date of birth</FieldLabel>
            <TextField t={t} value="04 / 17 / 1987" mono inputMode="numeric" />
          </div>

          <div>
            <FieldLabel t={t} hint="LAST 4 SHOWN">Social Security Number</FieldLabel>
            <SSNField t={t} />
          </div>

          <div>
            <FieldLabel t={t}>Phone number</FieldLabel>
            <TextField t={t} value="(951) 555-0234" mono inputMode="tel" />
          </div>

          <div>
            <FieldLabel t={t}>Email</FieldLabel>
            <TextField t={t} value="maria.rodriguez@gmail.com" type="email" inputMode="email" />
          </div>

          <div>
            <FieldLabel t={t}>Occupation</FieldLabel>
            <TextField t={t} value="Registered Nurse" />
          </div>

          {/* Home address group */}
          <div style={{
            marginTop: 14,
            padding: '20px 18px 4px',
            background: t.bgElev,
            border: `1px solid ${t.borderSoft}`,
            borderRadius: t.radius,
          }}>
            <div style={{
              fontFamily: t.serif, fontSize: 15, color: t.ink,
              letterSpacing: -0.2, marginBottom: 4,
            }}>Home address</div>
            <div style={{
              fontSize: 12, color: t.muted, marginBottom: 16,
            }}>Where you lived most of the tax year</div>

            <div>
              <FieldLabel t={t}>Street address</FieldLabel>
              <TextField t={t} value="4218 Juniper Ridge Road" />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <div style={{ flex: 2, minWidth: 0 }}>
                <FieldLabel t={t}>City</FieldLabel>
                <TextField t={t} value="Claremont" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <FieldLabel t={t}>State</FieldLabel>
                <TextField t={t} value="CA" mono style={{ textTransform: 'uppercase', letterSpacing: 1 }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <FieldLabel t={t}>ZIP</FieldLabel>
                <TextField t={t} value="91763" mono inputMode="numeric" />
              </div>
            </div>
          </div>

          <div style={{ marginTop: 6 }}>
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

Object.assign(window, { ScreenPersonalInfo });

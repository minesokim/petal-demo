// Business Info — conditional path for "Business Tax Return" selection.
// Replaces the personal-info intake flow for entity clients.

function ScreenBusinessInfo({ t, onNext, onBack }) {
  const [preparingPersonal, setPreparingPersonal] = React.useState('yes');

  return (
    <Screen t={t}>
      <div style={{ padding: '24px 0 0', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <IntakeHeader t={t} step={2} label="Business" />

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
            Because you're filing a business return
          </span>
        </div>

        {/* Headline */}
        <div style={{ padding: '14px 24px 8px' }}>
          <Stack gap={10}>
            <H1 t={t}>Tell me about your business</H1>
            <Body t={t} size={15}>This helps me prepare the right return type.</Body>
          </Stack>
        </div>

        {/* Form */}
        <Stack gap={18} style={{ padding: '22px 24px 16px', flex: 1 }}>
          <div>
            <FieldLabel t={t}>Legal business name</FieldLabel>
            <TextField t={t} placeholder="Full legal entity name" value="Juniper Studio LLC" />
          </div>

          <div>
            <FieldLabel t={t}>EIN</FieldLabel>
            <TextField t={t} mono inputMode="numeric" placeholder="XX-XXXXXXX" value="87-2134509" />
          </div>

          <div>
            <FieldLabel t={t}>Entity type</FieldLabel>
            <TextField t={t} placeholder="S-Corp, LLC, C-Corp, Partnership" value="Single-member LLC" />
          </div>

          <div>
            <FieldLabel t={t}>Business activity</FieldLabel>
            <TextField t={t} placeholder="Plumbing, Restaurant, Consulting" value="Illustration & design services" />
          </div>

          <div>
            <FieldLabel t={t}>Number of employees</FieldLabel>
            <TextField t={t} mono inputMode="numeric" placeholder="0" value="0" />
          </div>

          <div>
            <FieldLabel t={t}>Accounting method</FieldLabel>
            <TextField t={t} placeholder="Cash or Accrual" value="Cash" />
          </div>

          <div>
            <FieldLabel t={t}>Fiscal year end</FieldLabel>
            <TextField t={t} mono inputMode="numeric" placeholder="12/31" value="12/31" />
          </div>

          {/* Business address group */}
          <div style={{
            marginTop: 8,
            padding: '20px 18px 4px',
            background: t.bgElev,
            border: `1px solid ${t.borderSoft}`,
            borderRadius: t.radius,
          }}>
            <div style={{
              fontFamily: t.serif, fontSize: 15, color: t.ink,
              letterSpacing: -0.2, marginBottom: 4,
            }}>Business address</div>
            <div style={{
              fontSize: 12, color: t.muted, marginBottom: 16,
            }}>Principal place of business</div>

            <div>
              <FieldLabel t={t}>Street address</FieldLabel>
              <TextField t={t} placeholder="Street" value="4218 Juniper Ridge Rd, Ste 2" />
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

          <div>
            <FieldLabel t={t}>Accounting software</FieldLabel>
            <TextField t={t} placeholder="QuickBooks, Xero, Wave, None" value="QuickBooks Online" />
          </div>

          <div>
            <FieldLabel t={t}>Payroll provider</FieldLabel>
            <TextField t={t} placeholder="ADP, Gusto, In-house, None" value="None" />
          </div>

          {/* Ownership card */}
          <div style={{
            marginTop: 4,
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
              Ownership
            </div>

            <Stack gap={16}>
              <div>
                <FieldLabel t={t}>Owner 1 name</FieldLabel>
                <TextField t={t} placeholder="Full legal name" value="Maria Elena Rodriguez" />
              </div>
              <div>
                <FieldLabel t={t} hint="LAST 4 SHOWN">SSN</FieldLabel>
                <SSNField t={t} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <FieldLabel t={t}>Ownership %</FieldLabel>
                  <TextField t={t} mono inputMode="decimal" placeholder="100" value="100" />
                </div>
                <div style={{ flex: 2, minWidth: 0 }}>
                  <FieldLabel t={t}>Title</FieldLabel>
                  <TextField t={t} placeholder="Managing Member, President" value="Managing Member" />
                </div>
              </div>
            </Stack>
          </div>

          {/* Personal returns for owners? */}
          <div>
            <FieldLabel t={t}>Are we also preparing personal returns for any owners?</FieldLabel>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { id: 'yes', l: 'Yes' },
                { id: 'no', l: 'No' },
              ].map(o => {
                const on = preparingPersonal === o.id;
                return (
                  <button
                    key={o.id}
                    onClick={() => setPreparingPersonal(o.id)}
                    style={{
                      flex: 1,
                      padding: '14px 16px',
                      background: on ? t.tintAccent : t.card,
                      border: `1px solid ${on ? t.rust : t.border}`,
                      borderRadius: t.radius,
                      cursor: 'pointer',
                      fontFamily: t.sans,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%',
                      border: `1.5px solid ${on ? t.rust : t.border}`,
                      background: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {on && <div style={{ width: 9, height: 9, borderRadius: '50%', background: t.rust }}/>}
                    </div>
                    <span style={{
                      fontSize: 15, color: t.ink,
                      fontWeight: on ? 500 : 400,
                    }}>{o.l}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <AntonioNote t={t}>
            If you're not sure about entity type or accounting method, don't worry. I'll verify everything.
          </AntonioNote>
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

Object.assign(window, { ScreenBusinessInfo });

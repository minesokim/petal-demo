// Rental Property Detail — conditional from Income Sources when "Rental Property" selected.
// Single-select radio for rental type, then grouped fields.

function RentalTypeCard({ t, selected, onClick, label, sub }) {
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
      <div style={{
        width: 18, height: 18, borderRadius: '50%',
        border: `1.5px solid ${selected ? t.rust : t.border}`,
        background: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginTop: 1,
      }}>
        {selected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.rust }}/>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: t.ink, letterSpacing: -0.1 }}>
          {label}
        </div>
        <div style={{ fontSize: 12.5, color: t.muted, marginTop: 3, lineHeight: 1.4 }}>
          {sub}
        </div>
      </div>
    </button>
  );
}

function ScreenRentalDetail({ t, onNext, onBack }) {
  const [rtype, setRtype] = React.useState('long');

  const types = [
    { id: 'long',       label: 'Long-term rental', sub: 'Lease over 1 month \u00b7 Standard tenant, Schedule E' },
    { id: 'short',      label: 'Short-term rental', sub: 'Airbnb, Vrbo, avg stay under 7 days \u00b7 Schedule C, self-employment tax applies' },
    { id: 'commercial', label: 'Commercial property', sub: 'Apartment complex, retail, office \u00b7 Different depreciation rules' },
    { id: 'mixed',      label: 'Mixed-use', sub: 'Partly personal, partly rented \u00b7 Requires allocation' },
  ];

  return (
    <Screen t={t}>
      <div style={{ padding: '24px 0 0', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <IntakeHeader t={t} step={7} label="Rental" />

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
            You selected rental property
          </span>
        </div>

        {/* Headline */}
        <div style={{ padding: '14px 24px 8px' }}>
          <Stack gap={10}>
            <H1 t={t}>Tell me about your rental property</H1>
            <Body t={t} size={15}>Rental income has its own deductions and depreciation rules.</Body>
          </Stack>
        </div>

        <Stack gap={22} style={{ padding: '22px 24px 16px', flex: 1 }}>
          {/* Rental type radios */}
          <div>
            <FieldLabel t={t}>What kind of rental is this?</FieldLabel>
            <Stack gap={8}>
              {types.map(tp => (
                <RentalTypeCard
                  key={tp.id}
                  t={t}
                  selected={rtype === tp.id}
                  onClick={() => setRtype(tp.id)}
                  label={tp.label}
                  sub={tp.sub}
                />
              ))}
            </Stack>
          </div>

          {/* Grouped property fields */}
          <div style={{
            background: t.card,
            border: `1px solid ${t.border}`,
            borderRadius: t.radius,
            padding: '16px 16px 18px',
          }}>
            <div style={{
              fontFamily: t.serif, fontStyle: 'italic',
              fontSize: 14, color: t.rustInk,
              marginBottom: 14,
            }}>Property details</div>

            <Stack gap={16}>
              <div>
                <FieldLabel t={t}>Property address</FieldLabel>
                <TextField t={t} placeholder="Street, city, state" value="4120 Sunset Dr, Pasadena CA" />
              </div>
              <Row gap={10}>
                <div style={{ flex: 1 }}>
                  <FieldLabel t={t}>Monthly rent</FieldLabel>
                  <TextField t={t} mono inputMode="numeric" placeholder="$0" value="$2,850" />
                </div>
                <div style={{ flex: 1 }}>
                  <FieldLabel t={t}>Monthly mortgage</FieldLabel>
                  <TextField t={t} mono inputMode="numeric" placeholder="$0" value="$1,940" />
                </div>
              </Row>
              <Row gap={10}>
                <div style={{ flex: 1 }}>
                  <FieldLabel t={t}>Year acquired</FieldLabel>
                  <TextField t={t} mono inputMode="numeric" placeholder="2020" value="2019" />
                </div>
                <div style={{ flex: 1 }}>
                  <FieldLabel t={t}>How many rentals?</FieldLabel>
                  <TextField t={t} mono inputMode="numeric" placeholder="1" value="2" />
                </div>
              </Row>
            </Stack>
          </div>

          <AntonioNote t={t}>
            Rental properties are one of the best tax advantages. Depreciation, repairs, insurance, mortgage interest — we'll capture everything. I'll also verify your depreciation schedule, since IRS Section 167 requires it.
          </AntonioNote>
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

// State Filing + Prior Year — between personal info and dependents flow.
// Two sections: states lived/worked, prior year filing with conditional preparer field.

function ScreenStateAndPriorYear({ t, onNext, onBack }) {
  const [filedLast, setFiledLast] = React.useState('yes');

  return (
    <Screen t={t}>
      <div style={{ padding: '24px 0 0', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <IntakeHeader t={t} step={3} label="State & prior year" />

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

        <div style={{ padding: '20px 24px 8px' }}>
          <Stack gap={10}>
            <H1 t={t}>A few more details</H1>
            <Body t={t} size={15}>This helps me prepare your return accurately.</Body>
          </Stack>
        </div>

        <Stack gap={28} style={{ padding: '28px 24px 16px', flex: 1 }}>
          {/* Section 1 — states */}
          <div>
            <div style={{
              fontFamily: t.serif, fontStyle: 'italic',
              fontSize: 14, color: t.rustInk,
              marginBottom: 12,
            }}>States</div>
            <Stack gap={14}>
              <div>
                <FieldLabel t={t}>Which state(s) did you live or work in during 2025?</FieldLabel>
                <TextField t={t} placeholder="California" value="California" />
              </div>
              <div>
                <FieldLabel t={t}>Additional state (if applicable)</FieldLabel>
                <TextField t={t} placeholder="Oregon" value="" />
              </div>
            </Stack>
          </div>

          {/* Section 2 — prior year */}
          <div>
            <div style={{
              fontFamily: t.serif, fontStyle: 'italic',
              fontSize: 14, color: t.rustInk,
              marginBottom: 12,
            }}>Prior year</div>
            <FieldLabel t={t}>Did you file a tax return last year?</FieldLabel>
            <Stack gap={8}>
              <RentalTypeCard
                t={t}
                selected={filedLast === 'yes'}
                onClick={() => setFiledLast('yes')}
                label="Yes, I filed last year"
                sub="Upload a copy in the documents step"
              />
              <RentalTypeCard
                t={t}
                selected={filedLast === 'no'}
                onClick={() => setFiledLast('no')}
                label="No, I didn't file"
                sub="Antonio will help you figure out the right steps"
              />
            </Stack>

            {/* Conditional reveal */}
            {filedLast === 'yes' && (
              <div style={{ marginTop: 16 }}>
                <FieldLabel t={t}>Who prepared your return?</FieldLabel>
                <TextField t={t} placeholder="Self, H&R Block, another preparer" value="Self (TurboTax)" />
              </div>
            )}
          </div>

          {filedLast === 'yes' && (
            <AntonioNote t={t}>
              If you have a copy of last year's return, upload it in the documents step — it helps me catch things you might have missed. Unless I see it, you lose the expense.
            </AntonioNote>
          )}
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

Object.assign(window, { ScreenRentalDetail, ScreenStateAndPriorYear });

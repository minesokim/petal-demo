// Deposit screen — $50 hold, Stripe placeholder form, itemized total.
// Last step before legal agreements.

function IconLockTiny({ size = 11 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4.5" width="7" height="5" rx="0.8"/>
      <path d="M3.5 4.5V3a2 2 0 014 0v1.5"/>
    </svg>
  );
}
function IconCard({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="4" width="13" height="9" rx="1.5"/>
      <path d="M1.5 7.5h13M4 11h3"/>
    </svg>
  );
}

function ScreenDeposit({ t, onNext, onBack }) {
  return (
    <Screen t={t}>
      <div style={{ padding: '24px 0 0', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <IntakeHeader t={t} step={0} label="Deposit" total={13} />

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
            Back to schedule
          </button>
        </div>

        {/* Headline */}
        <div style={{ padding: '18px 24px 8px' }}>
          <Stack gap={10}>
            <H1 t={t}>Secure your appointment with a $50 deposit</H1>
            <Body t={t} size={15}>Goes toward your final bill. Refundable up to 48 hours before your appointment.</Body>
          </Stack>
        </div>

        <Stack gap={22} style={{ padding: '22px 24px 16px', flex: 1 }}>
          {/* Appointment recap */}
          <div style={{
            padding: '16px 18px',
            background: t.ink,
            borderRadius: t.radius,
            color: '#fff',
          }}>
            <div style={{
              fontFamily: t.serif, fontStyle: 'italic',
              fontSize: 13,
              color: 'rgba(255,255,255,0.6)',
              marginBottom: 8,
            }}>Your appointment</div>
            <div style={{
              fontFamily: t.serif, fontSize: 20, letterSpacing: -0.3,
              lineHeight: 1.15, marginBottom: 6,
            }}>
              Wed, Mar 5 · 1:00 PM
            </div>
            <div style={{
              fontSize: 13, color: 'rgba(255,255,255,0.7)',
              marginBottom: 12,
            }}>Video call (Google Meet) · 30 min</div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              paddingTop: 12,
              borderTop: '1px solid rgba(255,255,255,0.12)',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: t.rust, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: t.serif, fontSize: 13, fontWeight: 500,
              }}>AV</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                with <span style={{ color: '#fff', fontWeight: 500 }}>Antonio Vazant, EA</span>
              </div>
            </div>
          </div>

          {/* Payment method form */}
          <div>
            <Row justify="space-between" align="baseline" style={{ marginBottom: 14 }}>
              <span style={{
                fontFamily: t.serif, fontSize: 17, color: t.ink,
                letterSpacing: -0.2,
              }}>Payment method</span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontFamily: t.sans, fontSize: 12, color: t.muted,
                letterSpacing: 0,
              }}>
                <IconLockTiny size={11}/> Stripe
              </span>
            </Row>

            <Stack gap={16}>
              <div>
                <FieldLabel t={t}>Card number</FieldLabel>
                <div style={{ position: 'relative' }}>
                  <TextField
                    t={t}
                    mono
                    inputMode="numeric"
                    placeholder="1234 1234 1234 1234"
                    value="4242 4242 4242 4242"
                    style={{ paddingLeft: 26 }}
                  />
                  <div style={{
                    position: 'absolute', left: 0, top: '50%',
                    transform: 'translateY(-50%)',
                    color: t.muted, pointerEvents: 'none',
                  }}>
                    <IconCard size={16}/>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <FieldLabel t={t}>Expiry</FieldLabel>
                  <TextField t={t} mono inputMode="numeric" placeholder="MM / YY" value="08 / 28" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <FieldLabel t={t}>CVC</FieldLabel>
                  <TextField t={t} mono inputMode="numeric" placeholder="•••" value="•••" />
                </div>
              </div>

              <div>
                <FieldLabel t={t}>ZIP</FieldLabel>
                <TextField t={t} mono inputMode="numeric" placeholder="ZIP" value="91763" />
              </div>

              <div>
                <FieldLabel t={t}>Cardholder name</FieldLabel>
                <TextField t={t} placeholder="Name on card" value="Maria Elena Rodriguez" />
              </div>
            </Stack>
          </div>

          {/* Line-item summary */}
          <div style={{
            padding: '16px 18px 18px',
            background: t.bgElev,
            border: `1px solid ${t.borderSoft}`,
            borderRadius: t.radius,
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              marginBottom: 8,
            }}>
              <div>
                <div style={{ fontSize: 14.5, color: t.ink, fontWeight: 500 }}>Deposit</div>
                <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>Applied to final bill</div>
              </div>
              <div style={{
                fontFamily: t.mono, fontSize: 14, color: t.ink,
              }}>$50.00</div>
            </div>
            <div style={{
              marginTop: 14, paddingTop: 14,
              borderTop: `1px solid ${t.border}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            }}>
              <div style={{
                fontFamily: t.serif, fontSize: 15, color: t.inkSoft,
                letterSpacing: -0.1,
              }}>Total today</div>
              <div style={{
                fontFamily: t.serif, fontSize: 28, color: t.ink,
                letterSpacing: -0.8, fontWeight: 500,
              }}>$50.00</div>
            </div>
          </div>

          <AntonioNote t={t}>
            This $50 goes toward your final bill. Cancel 48 hours ahead and you get it back. This is just to protect my time — I used to have people book and never show up.
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
          <Stack gap={8}>
            <Row gap={10}>
              <Button t={t} variant="ghost" onClick={onBack} style={{ flex: '0 0 auto' }}>Back</Button>
              <Button t={t} onClick={onNext} style={{ flex: 1 }}>Pay $50 and continue</Button>
            </Row>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              fontFamily: t.sans, fontSize: 11.5, color: t.muted,
              marginTop: 2,
            }}>
              <IconLockTiny size={10}/> Secured by Stripe · Your card is encrypted
            </div>
          </Stack>
        </div>
      </div>
    </Screen>
  );
}

Object.assign(window, { ScreenDeposit });

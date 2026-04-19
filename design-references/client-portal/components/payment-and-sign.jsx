// Payment sheet + Form 8879 signing screen
// Rendered inside the phone (bezel safe area).

// ─── Payment Sheet — modal over the phone screen ─────────────────
function PaymentSheet({ t, onClose, onPaid }) {
  const [step, setStep] = React.useState('review'); // review | processing | done
  const [cardNum, setCardNum] = React.useState('4242 4242 4242 4242');
  const [cardExp, setCardExp] = React.useState('12/27');
  const [cardCvc, setCardCvc] = React.useState('123');

  const pay = () => {
    setStep('processing');
    setTimeout(() => setStep('done'), 1200);
    setTimeout(() => onPaid(), 2200);
  };

  return (
    <div
      style={{
        position: 'absolute', inset: 0,
        background: 'rgba(32, 22, 16, 0.42)',
        zIndex: 70,
        display: 'flex', alignItems: 'flex-end',
        backdropFilter: 'blur(2px)',
        animation: 'fade-in 160ms ease-out',
      }}
      onClick={() => step === 'review' && onClose()}
    >
      <style>{`
        @keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slide-up { from { transform: translateY(100%) } to { transform: translateY(0) } }
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.7 }
          100% { transform: scale(1.4); opacity: 0 }
        }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          background: t.bg,
          borderTopLeftRadius: 20, borderTopRightRadius: 20,
          display: 'flex', flexDirection: 'column',
          animation: 'slide-up 220ms cubic-bezier(.2,.8,.2,1)',
          overflow: 'hidden',
          boxShadow: '0 -12px 40px rgba(20,10,0,0.18)',
          maxHeight: '90%',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 0' }}>
          <div style={{ width: 40, height: 4, background: t.border, borderRadius: 2 }}/>
        </div>

        {step === 'review' && (
          <div style={{ padding: '16px 20px 24px' }}>
            <Eyebrow t={t} style={{ marginBottom: 8 }}>Balance due</Eyebrow>
            <div style={{
              fontFamily: t.serif, fontSize: 44, color: t.ink, letterSpacing: -1.2, lineHeight: 1,
              marginBottom: 4,
            }}>$250.00</div>
            <Body t={t} size={13} muted style={{ marginBottom: 20 }}>
              Final payment for your 2024 return. You'll receive a receipt by email.
            </Body>

            <div style={{
              background: t.bgElev, borderRadius: 10, padding: '14px 16px',
              marginBottom: 16,
            }}>
              <Row justify="space-between" style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: t.inkSoft }}>Preparation fee</span>
                <span style={{ fontSize: 13, color: t.inkSoft, fontFamily: t.mono }}>$500.00</span>
              </Row>
              <Row justify="space-between" style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: t.muted }}>Deposit paid Jan 14</span>
                <span style={{ fontSize: 13, color: t.muted, fontFamily: t.mono }}>−$250.00</span>
              </Row>
              <div style={{ height: 1, background: t.border, margin: '8px 0' }}/>
              <Row justify="space-between">
                <span style={{ fontSize: 14, color: t.ink, fontWeight: 500 }}>Due today</span>
                <span style={{ fontSize: 15, color: t.ink, fontFamily: t.serif, fontWeight: 500 }}>$250.00</span>
              </Row>
            </div>

            <Eyebrow t={t} style={{ marginBottom: 8 }}>Payment method</Eyebrow>
            <div style={{
              background: t.card, border: `1px solid ${t.border}`, borderRadius: 10,
              padding: '12px 14px', marginBottom: 10,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 34, height: 22, borderRadius: 4, background: '#1A1F71',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: t.sans, fontSize: 8, color: '#F7B600', fontWeight: 700, letterSpacing: 0.5,
              }}>VISA</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: t.ink, fontFamily: t.mono, letterSpacing: 0.5 }}>
                  •••• •••• •••• 4242
                </div>
                <div style={{ fontSize: 11, color: t.muted, marginTop: 1 }}>Expires 12/27</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={t.rust} strokeWidth="1.8">
                <path d="M3 7l3 3 5-6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            <div style={{
              fontFamily: t.mono, fontSize: 9.5, color: t.muted, letterSpacing: 0.6,
              marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke={t.muted} strokeWidth="1.5">
                <rect x="3" y="6" width="8" height="6" rx="1"/>
                <path d="M5 6V4a2 2 0 014 0v2"/>
              </svg>
              SECURED BY STRIPE · 256-BIT ENCRYPTION
            </div>

            <Row gap={10}>
              <Button t={t} variant="ghost" onClick={onClose} style={{ flex: '0 0 auto' }}>Cancel</Button>
              <Button t={t} onClick={pay} style={{ flex: 1 }}>Pay $250.00</Button>
            </Row>
          </div>
        )}

        {step === 'processing' && (
          <div style={{
            padding: '48px 20px 56px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
          }}>
            <div style={{ position: 'relative', width: 54, height: 54 }}>
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                border: `2px solid ${t.rust}`,
                animation: 'pulse-ring 1.2s ease-out infinite',
              }}/>
              <div style={{
                position: 'absolute', inset: 8, borderRadius: '50%',
                background: t.rust,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="2" y="5" width="14" height="10" rx="1.5" stroke="#fff" strokeWidth="1.5"/>
                  <path d="M2 8h14" stroke="#fff" strokeWidth="1.5"/>
                </svg>
              </div>
            </div>
            <H2 t={t} style={{ margin: 0 }}>Processing…</H2>
            <Body t={t} size={13} muted>Authorizing with your bank</Body>
          </div>
        )}

        {step === 'done' && (
          <div style={{
            padding: '40px 20px 40px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 54, height: 54, borderRadius: '50%',
              background: 'rgba(74, 143, 95, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M6 12l4 4 8-9" stroke="#4a8f5f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <H2 t={t} style={{ margin: 0 }}>Payment received</H2>
            <Body t={t} size={13} muted style={{ textAlign: 'center' }}>
              $250.00 charged to Visa ···· 4242<br/>
              Form 8879 is now unlocked.
            </Body>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Confetti — lightweight CSS burst ─────────────────────────
function Confetti({ t }) {
  // 38 particles in mixed brand greens + rust + neutral
  const colors = [t.rust, '#2e6b42', '#B87333', '#D9A441', '#6A8E6B', '#E8B59A'];
  const pieces = Array.from({ length: 38 }).map((_, i) => {
    const x = (Math.random() * 100) - 50;       // px drift, -50..50
    const xEnd = x + (Math.random() * 80 - 40); // end drift
    const delay = Math.random() * 0.15;
    const dur = 1.6 + Math.random() * 0.9;
    const rot = Math.random() * 720 - 360;
    const size = 6 + Math.random() * 5;
    const color = colors[i % colors.length];
    const shape = i % 3 === 0 ? '50%' : '1px';
    const ratio = i % 5 === 0 ? 0.35 : 1; // ribbons
    return { i, x, xEnd, delay, dur, rot, size, color, shape, ratio };
  });
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute', inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 90,
      }}
    >
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translate(var(--x0), -20px) rotate(0deg);    opacity: 0; }
          10%  { opacity: 1; }
          100% { transform: translate(var(--x1), 520px) rotate(var(--rot)); opacity: 0; }
        }
      `}</style>
      {pieces.map(p => (
        <span key={p.i} style={{
          position: 'absolute',
          top: 120, left: '50%',
          width: p.size, height: p.size * p.ratio,
          background: p.color,
          borderRadius: p.shape,
          '--x0': `${p.x}px`,
          '--x1': `${p.xEnd}px`,
          '--rot': `${p.rot}deg`,
          animation: `confetti-fall ${p.dur}s cubic-bezier(.25,.85,.4,1) ${p.delay}s both`,
        }}/>
      ))}
    </div>
  );
}

// ─── Screen: Sign Form 8879 ────────────────────────────────────
function Screen8879Sign({ t, onBack, onSigned }) {
  const [signed, setSigned] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const onSubmit = () => {
    if (!signed || submitting) return;
    setSubmitting(true);
    // let confetti + check play, then hand off
    setTimeout(() => onSigned(), 2100);
  };

  return (
    <Screen t={t}>
      {/* Top bar — route header, not iOS chrome */}
      <div style={{
        padding: '14px 18px 12px',
        borderBottom: `1px solid ${t.borderSoft}`,
        display: 'flex', alignItems: 'center', gap: 10,
        background: t.bg,
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', padding: 4, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 4,
          color: t.inkSoft, fontFamily: t.sans, fontSize: 14,
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M9 3L5 7l4 4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontFamily: t.mono, fontSize: 10, color: t.muted, letterSpacing: 1.2 }}>
            E-FILE AUTHORIZATION
          </div>
          <div style={{ fontFamily: t.serif, fontSize: 15, color: t.ink, marginTop: 2 }}>
            Form 8879
          </div>
        </div>
        <div style={{ width: 48 }}/>
      </div>

      {/* Scrollable document */}
      <div
        style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 18px' }}
      >
        <Stack gap={14}>
          <div>
            <Eyebrow t={t}>Taxpayer</Eyebrow>
            <div style={{ fontFamily: t.serif, fontSize: 19, color: t.ink, marginTop: 4 }}>
              Maria Rodriguez
            </div>
            <div style={{ fontFamily: t.mono, fontSize: 11, color: t.muted, marginTop: 2, letterSpacing: 0.3 }}>
              SSN ···-··-4829 · Tax year 2024
            </div>
          </div>

          <div style={{ height: 1, background: t.borderSoft }}/>

          <div>
            <Eyebrow t={t}>Return summary</Eyebrow>
            <div style={{
              marginTop: 10,
              background: t.bgElev, borderRadius: 10, padding: '14px 16px',
            }}>
              <Row justify="space-between" style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: t.inkSoft }}>Adjusted gross income</span>
                <span style={{ fontSize: 13, color: t.ink, fontFamily: t.mono }}>$84,320</span>
              </Row>
              <Row justify="space-between" style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: t.inkSoft }}>Total tax</span>
                <span style={{ fontSize: 13, color: t.ink, fontFamily: t.mono }}>$11,468</span>
              </Row>
              <Row justify="space-between" style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: t.inkSoft }}>Federal withholding</span>
                <span style={{ fontSize: 13, color: t.ink, fontFamily: t.mono }}>$13,260</span>
              </Row>
              <div style={{ height: 1, background: t.border, margin: '8px 0' }}/>
              <Row justify="space-between">
                <span style={{ fontSize: 14, color: t.ink, fontWeight: 500 }}>Refund</span>
                <span style={{ fontSize: 15, color: '#2e6b42', fontFamily: t.serif, fontWeight: 500 }}>$1,792</span>
              </Row>
            </div>
          </div>

          <div>
            <Eyebrow t={t}>Declaration</Eyebrow>
            <div style={{
              fontFamily: t.serif, fontSize: 14, lineHeight: 1.6, color: t.inkSoft,
              marginTop: 8, textWrap: 'pretty',
            }}>
              Under penalties of perjury, I declare that I have examined a copy of my 2024 federal
              individual income tax return (Form 1040) and accompanying schedules, and to the best
              of my knowledge and belief, it is true, correct, and complete.
            </div>
            <div style={{
              fontFamily: t.serif, fontSize: 14, lineHeight: 1.6, color: t.inkSoft,
              marginTop: 10, textWrap: 'pretty',
            }}>
              I consent to allow my Electronic Return Originator (Antonio Vazquez, EA —
              P00456789) to send my return to the IRS, to receive the acknowledgement of
              acceptance or reason for rejection, and if necessary, to transmit the corrected
              return.
            </div>
            <div style={{
              fontFamily: t.serif, fontSize: 14, lineHeight: 1.6, color: t.inkSoft,
              marginTop: 10, textWrap: 'pretty',
            }}>
              I authorize the U.S. Treasury and its designated Financial Agent to initiate
              an ACH electronic funds deposit entry to the financial institution account
              indicated in my tax return for my refund.
            </div>
          </div>

          <div style={{
            background: t.bgElev, border: `1px solid ${t.border}`, borderRadius: 10,
            padding: '12px 14px',
          }}>
            <div style={{
              fontFamily: t.mono, fontSize: 10, color: t.rustInk, letterSpacing: 1.2,
              textTransform: 'uppercase', marginBottom: 6,
            }}>
              Refund destination
            </div>
            <div style={{ fontFamily: t.serif, fontSize: 14, color: t.ink }}>
              Chase · Checking ····6291
            </div>
            <div style={{ fontFamily: t.mono, fontSize: 11, color: t.muted, marginTop: 2 }}>
              Direct deposit · 1–3 weeks after acceptance
            </div>
          </div>

          <div />

          {/* Signature zone */}
          <div style={{ marginTop: 10 }}>
            <Eyebrow t={t}>Your signature</Eyebrow>
            <div style={{ marginTop: 10 }}>
              <SignaturePad t={t} signed={signed} onSign={() => setSigned(true)} name="Maria Rodriguez" />
            </div>
          </div>

          <div style={{
            fontFamily: t.mono, fontSize: 9.5, color: t.muted, letterSpacing: 0.6, marginTop: 4,
          }}>
            YOUR SIGNATURE IS CRYPTOGRAPHICALLY TIMESTAMPED PER IRS CIRCULAR 230.
          </div>
        </Stack>
      </div>

      {/* Submit bar */}
      <div style={{
        padding: '14px 18px 16px',
        borderTop: `1px solid ${t.borderSoft}`,
        background: t.bg,
      }}>
        <Button
          t={t}
          onClick={onSubmit}
          style={{
            width: '100%',
            opacity: signed && !submitting ? 1 : 0.55,
            cursor: signed && !submitting ? 'pointer' : 'not-allowed',
          }}
        >
          {submitting ? 'Submitting…' : (signed ? 'Submit signature' : 'Sign to submit')}
        </Button>
      </div>

      {/* Success overlay — confetti + check, shown after submit */}
      {submitting && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 80,
          background: t.bg,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 22, padding: '0 32px',
          animation: 'sign-fade 200ms ease-out',
        }}>
          <style>{`
            @keyframes sign-fade { from { opacity: 0 } to { opacity: 1 } }
          `}</style>
          <Confetti t={t} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <HandCheckmark t={t} size={112} />
          </div>
          <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <div style={{
              fontFamily: t.serif, fontSize: 28, color: t.ink,
              letterSpacing: -0.6, marginBottom: 8,
            }}>
              You're all set, Maria
            </div>
            <div style={{
              fontSize: 14, color: t.inkSoft, lineHeight: 1.5,
              maxWidth: 280, margin: '0 auto',
            }}>
              Your return has been signed and sent to Antonio. He'll transmit it to the IRS within the hour.
            </div>
          </div>
        </div>
      )}
    </Screen>
  );
}

Object.assign(window, { PaymentSheet, Screen8879Sign });

// Intake screens 1–6: Login, OTP, Step 4 (filing status), Step 1 (services),
// Legal A (engagement), Legal B (§7216), Done

// ─── Shared bits ────────────────────────────────────────────────
function IntakeHeader({ t, step, subStep, label, total = 13 }) {
  const wrapStyle = {
    position: 'sticky',
    top: 0,
    zIndex: 5,
    background: t.bg,
    padding: '14px 24px 12px',
    borderBottom: `1px solid ${t.borderSoft}`,
  };
  if (!step) {
    return (
      <div style={wrapStyle}>
        <Row justify="space-between" style={{ marginBottom: 10 }}>
          <Eyebrow t={t}>Final step</Eyebrow>
          <Eyebrow t={t}>{label}</Eyebrow>
        </Row>
        <ProgressBar t={t} value={total} total={total} />
      </div>
    );
  }
  const stepLabel = subStep
    ? `${String(step).padStart(2, '0')}${subStep} of ${total}`
    : `${String(step).padStart(2, '0')} of ${total}`;
  const progressValue = subStep === 'B' ? step + 0.5 : step;
  return (
    <div style={wrapStyle}>
      <Row justify="space-between" style={{ marginBottom: 10 }}>
        <Eyebrow t={t}>{stepLabel}</Eyebrow>
        <Eyebrow t={t}>{label}</Eyebrow>
      </Row>
      <ProgressBar t={t} value={progressValue} total={total} />
    </div>
  );
}

function AntonioNote({ t, children }) {
  // Editorial margin-note: small monogram + italic serif aside + dateline attribution.
  // No filled box — reads as a personal annotation, not a UI card.
  return (
    <div style={{
      marginTop: 10,
      paddingLeft: 16,
      borderLeft: `1px solid ${t.rustSoft}`,
    }}>
      {/* Italic serif body — the voice itself carries the signal */}
      <div style={{
        fontFamily: t.serif,
        fontStyle: 'italic',
        fontSize: 15.5,
        lineHeight: 1.55,
        color: t.inkSoft,
        textWrap: 'pretty',
        letterSpacing: -0.1,
      }}>{children}</div>

      {/* Dateline attribution — em-dash + small caps name */}
      <div style={{
        marginTop: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span style={{
          fontFamily: t.serif,
          fontSize: 13,
          color: t.muted,
          lineHeight: 1,
        }}>—</span>
        <span style={{
          fontFamily: t.mono,
          fontSize: 10,
          letterSpacing: 1.4,
          textTransform: 'uppercase',
          color: t.rustInk,
        }}>
          Antonio
        </span>
        <span style={{
          flex: 1,
          height: 1,
          background: t.borderSoft,
          maxWidth: 40,
        }}/>
        <span style={{
          fontFamily: t.mono,
          fontSize: 9.5,
          letterSpacing: 1,
          color: t.muted,
          textTransform: 'uppercase',
        }}>EA · Claremont</span>
      </div>
    </div>
  );
}

function BottomBar({ t, children }) {
  return (
    <div style={{
      position: 'sticky', bottom: 0,
      background: `linear-gradient(to top, ${t.bg} 70%, transparent)`,
      padding: '24px 24px 32px',
      display: 'flex', gap: 10,
    }}>{children}</div>
  );
}

function Footer({ t }) {
  return (
    <div style={{
      padding: '20px 24px 28px',
      textAlign: 'center',
      fontFamily: t.mono,
      fontSize: 10,
      color: t.muted,
      letterSpacing: 0.5,
    }}>
      ANTONIO VAZQUEZ, ENROLLED AGENT · CLAREMONT, CA
    </div>
  );
}

// ─── 1. Login ───────────────────────────────────────────────────
function ScreenLogin({ t, onNext }) {
  const [phone, setPhone] = React.useState('');
  const format = (v) => {
    const d = v.replace(/\D/g, '').slice(0, 10);
    if (d.length < 4) return d;
    if (d.length < 7) return `(${d.slice(0,3)}) ${d.slice(3)}`;
    return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
  };
  return (
    <Screen t={t}>
      <div style={{ padding: '60px 24px 40px', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <Stack gap={28} style={{ flex: 1 }}>
          <AvatarSlot t={t} size={72} />
          <Stack gap={10}>
            <H1 t={t}>Welcome to<br/>Vazant Consulting</H1>
            <Body t={t} size={16}>
              Antonio will personally handle your return. Enter your phone number to get started.
            </Body>
          </Stack>

          <Stack gap={14}>
            <div>
              <div style={{
                fontFamily: t.mono, fontSize: 10, color: t.muted,
                letterSpacing: 1.2, marginBottom: 8,
              }}>PHONE NUMBER</div>
              <input
                value={phone}
                onChange={e => setPhone(format(e.target.value))}
                placeholder="(555) 555-5555"
                inputMode="tel"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '16px 18px',
                  fontSize: 18,
                  fontFamily: t.sans,
                  background: t.card,
                  border: `1px solid ${t.border}`,
                  borderRadius: t.radius,
                  color: t.ink,
                  outline: 'none',
                  letterSpacing: 0.2,
                }}
              />
            </div>
            <Button t={t} onClick={onNext} disabled={phone.length < 14}
                    style={{ width: '100%', padding: '16px 22px', fontSize: 16 }}>
              Send verification code
            </Button>
            <Row justify="center" gap={10}>
              <span style={{
                fontFamily: t.mono, fontSize: 10, color: t.muted, letterSpacing: 1,
              }}>SECURE · ENCRYPTED · IRS-COMPLIANT</span>
            </Row>
          </Stack>
        </Stack>

        <div style={{ marginTop: 40 }}>
          <div style={{
            padding: '14px 16px',
            background: t.bgElev,
            borderRadius: t.radius,
            border: `1px solid ${t.borderSoft}`,
            fontSize: 13,
            color: t.inkSoft,
            textAlign: 'center',
            lineHeight: 1.5,
          }}>
            Need help? Text Antonio directly at<br/>
            <span style={{ color: t.rust, fontWeight: 500 }}>(951) 555-0234</span>
          </div>
          <Footer t={t} />
        </div>
      </div>
    </Screen>
  );
}

// ─── 2. OTP ─────────────────────────────────────────────────────
function ScreenOTP({ t, onNext, onBack }) {
  const [digits, setDigits] = React.useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = React.useState(47);
  const [verifying, setVerifying] = React.useState(false);
  const inputRefs = React.useRef([]);

  React.useEffect(() => {
    // autofocus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  React.useEffect(() => {
    if (countdown <= 0) return;
    const id = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  const set = (i, v) => {
    // support paste of multi-digit value
    const clean = v.replace(/\D/g, '');
    if (clean.length === 0) {
      const next = [...digits];
      next[i] = '';
      setDigits(next);
      return;
    }

    const next = [...digits];
    // fill from i with as many chars as provided (1 for single, more for paste)
    for (let k = 0; k < clean.length && (i + k) < 6; k++) {
      next[i + k] = clean[k];
    }
    setDigits(next);

    // focus next empty, or the last one filled
    const nextIdx = Math.min(i + clean.length, 5);
    inputRefs.current[nextIdx]?.focus();
    if (nextIdx < 5) inputRefs.current[nextIdx]?.select?.();

    if (next.every(x => x)) {
      setVerifying(true);
      inputRefs.current[5]?.blur();
      setTimeout(() => onNext && onNext(), 1200);
    }
  };

  const onKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      if (digits[i]) {
        // clear current
        const next = [...digits];
        next[i] = '';
        setDigits(next);
      } else if (i > 0) {
        // move back and clear previous
        const next = [...digits];
        next[i - 1] = '';
        setDigits(next);
        inputRefs.current[i - 1]?.focus();
      }
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' && i > 0) {
      inputRefs.current[i - 1]?.focus();
      e.preventDefault();
    } else if (e.key === 'ArrowRight' && i < 5) {
      inputRefs.current[i + 1]?.focus();
      e.preventDefault();
    }
  };

  return (
    <Screen t={t}>
      <div style={{ padding: '24px 24px 40px', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: t.inkSoft, fontSize: 14, padding: 8, marginLeft: -8,
          display: 'flex', alignItems: 'center', gap: 6, fontFamily: t.sans,
        }}>
          <svg width="8" height="13" viewBox="0 0 8 13" fill="none">
            <path d="M7 1L1 6.5L7 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
          Back
        </button>

        <Stack gap={32} style={{ flex: 1, marginTop: 24 }}>
          <Stack gap={10}>
            <H1 t={t}>Enter verification code</H1>
            <Body t={t} size={15}>
              We sent a 6-digit code to{' '}
              <span style={{ fontFamily: t.mono, color: t.ink, whiteSpace: 'nowrap' }}>(951) •••-•234</span>
            </Body>
          </Stack>

          <Row gap={8} justify="space-between">
            {digits.map((d, i) => (
              <input key={i}
                ref={el => inputRefs.current[i] = el}
                value={d}
                onChange={e => set(i, e.target.value)}
                onKeyDown={e => onKeyDown(i, e)}
                onFocus={e => e.target.select()}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                style={{
                  width: 48, height: 62,
                  textAlign: 'center',
                  fontSize: 26,
                  fontFamily: t.mono,
                  fontWeight: 500,
                  background: d ? t.tintAccent : t.card,
                  border: `1.5px solid ${d ? t.rust : t.border}`,
                  borderRadius: t.radius,
                  color: t.ink,
                  outline: 'none',
                  transition: 'all 0.15s',
                  caretColor: t.rust,
                }}
              />
            ))}
          </Row>

          {verifying ? (
            <Row gap={10} justify="center">
              <div style={{
                width: 16, height: 16,
                border: `2px solid ${t.border}`,
                borderTopColor: t.rust,
                borderRadius: '50%',
                animation: 'spin 0.9s linear infinite',
              }}/>
              <Body t={t} size={14} muted>Verifying…</Body>
            </Row>
          ) : (
            <Row justify="center">
              <Body t={t} size={13} muted>
                Didn't get it?{' '}
                {countdown > 0 ? (
                  <span style={{ fontFamily: t.mono, color: t.muted }}>
                    Resend in 0:{String(countdown).padStart(2, '0')}
                  </span>
                ) : (
                  <span style={{ color: t.rust, cursor: 'pointer', fontWeight: 500 }}>Resend</span>
                )}
              </Body>
            </Row>
          )}
        </Stack>

        <Footer t={t} />
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Screen>
  );
}

// ─── Welcome (post-OTP, pre-tutorial) ───────────────────────────
function VideoPlaceholder({ t }) {
  return (
    <div style={{
      width: '100%',
      aspectRatio: '16 / 9',
      borderRadius: t.radius,
      overflow: 'hidden',
      position: 'relative',
      background: 'linear-gradient(135deg, #1a3a26 0%, #0c1f15 70%, #050a07 100%)',
      cursor: 'pointer',
      boxShadow: '0 8px 24px rgba(12, 31, 21, 0.18)',
    }}>
      {/* soft leafy highlight */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 25% 20%, rgba(120, 180, 140, 0.12), transparent 55%)',
      }}/>
      {/* film grain */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 3px)',
        mixBlendMode: 'overlay',
      }}/>

      {/* Corner label */}
      <div style={{
        position: 'absolute', top: 14, left: 16,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: '#d94545',
          boxShadow: '0 0 0 3px rgba(217, 69, 69, 0.22)',
        }}/>
        <span style={{
          fontFamily: t.mono, fontSize: 9.5, color: 'rgba(255,255,255,0.75)',
          letterSpacing: 1.2, textTransform: 'uppercase',
        }}>REC · ANTONIO</span>
      </div>

      {/* Center play */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 14,
      }}>
        <div style={{
          width: 68, height: 68, borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.15)',
          border: '1.5px solid rgba(255, 255, 255, 0.35)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
          transition: 'transform 0.15s',
        }}>
          <svg width="22" height="24" viewBox="0 0 22 24" fill="none" style={{ marginLeft: 4 }}>
            <path d="M2 2 L20 12 L2 22 Z" fill="#fff"/>
          </svg>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: t.serif, fontSize: 17, color: '#fff',
            letterSpacing: -0.2, fontStyle: 'italic', marginBottom: 4,
          }}>A message from Antonio</div>
          <div style={{
            fontFamily: t.mono, fontSize: 10.5, color: 'rgba(255,255,255,0.6)',
            letterSpacing: 0.8,
          }}>1:12 · TAP TO PLAY</div>
        </div>
      </div>

      {/* Bottom scrubber stub */}
      <div style={{
        position: 'absolute', bottom: 10, left: 14, right: 14,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontFamily: t.mono, fontSize: 9, color: 'rgba(255,255,255,0.55)', letterSpacing: 0.5 }}>0:00</span>
        <div style={{
          flex: 1, height: 2, borderRadius: 2,
          background: 'rgba(255,255,255,0.2)',
        }}/>
        <span style={{ fontFamily: t.mono, fontSize: 9, color: 'rgba(255,255,255,0.55)', letterSpacing: 0.5 }}>1:12</span>
      </div>
    </div>
  );
}

function TrustPill({ t, children, icon }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 11px',
      background: t.bgElev,
      border: `1px solid ${t.borderSoft}`,
      borderRadius: 999,
      fontFamily: t.sans,
      fontSize: 11,
      color: t.inkSoft,
      letterSpacing: 0.1,
    }}>
      {icon}
      {children}
    </div>
  );
}

function ScreenWelcome({ t, onNext }) {
  const ic = { width: 11, height: 11, fill: 'none', stroke: t.rust, strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' };
  return (
    <Screen t={t}>
      <div style={{ padding: '36px 24px 28px', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <Stack gap={26} style={{ flex: 1 }}>
          <VideoPlaceholder t={t} />

          <Stack gap={14} style={{ textAlign: 'center' }}>
            <div>
              <div style={{
                fontFamily: t.serif, fontWeight: 400, fontSize: 26, lineHeight: 1.15,
                letterSpacing: -0.4, color: t.ink,
              }}>
                Welcome to<br/>
                <span style={{ fontStyle: 'italic' }}>Vazant Consulting</span>
              </div>
            </div>
            <Body t={t} size={14.5} style={{ maxWidth: 310, margin: '0 auto' }}>
              I'm Antonio Vazquez, Enrolled Agent. Let's get your taxes handled.
              Answer a few questions — takes about 10 minutes.
            </Body>
          </Stack>

          <Row gap={6} justify="center" style={{ flexWrap: 'wrap' }}>
            <TrustPill t={t} icon={
              <svg {...ic} viewBox="0 0 11 11"><rect x="2" y="4.5" width="7" height="5" rx="0.8"/><path d="M3.5 4.5V3a2 2 0 014 0v1.5"/></svg>
            }>AES-256 encrypted</TrustPill>
            <TrustPill t={t} icon={
              <svg {...ic} viewBox="0 0 11 11"><path d="M5.5 1l3 1.5v2.5c0 2-1.3 3.8-3 4.5-1.7-.7-3-2.5-3-4.5V2.5z"/><path d="M4 5.5l1.2 1.2L7.5 4.2"/></svg>
            }>Enrolled Agent</TrustPill>
            <TrustPill t={t} icon={
              <svg {...ic} viewBox="0 0 11 11"><circle cx="5.5" cy="5.5" r="4"/><path d="M5.5 3.5v2l1.5 1"/></svg>
            }>~10 minutes</TrustPill>
          </Row>
        </Stack>

        <Stack gap={14} style={{ marginTop: 28 }}>
          <Button t={t} onClick={onNext} style={{ width: '100%', padding: '15px 22px', fontSize: 15 }}>
            Let's get started
          </Button>
          <div style={{
            fontSize: 11.5, color: t.muted, lineHeight: 1.5,
            textAlign: 'center', maxWidth: 320, margin: '0 auto',
          }}>
            We'll ask about your filing status, income sources, and dependents.
            Then you'll upload your documents and sign your engagement letter.
          </div>
          <div style={{
            fontSize: 10, color: t.muted, letterSpacing: 0.4,
            textAlign: 'center', fontFamily: t.mono, textTransform: 'uppercase',
            paddingTop: 4,
          }}>
            Your information is never shared or sold
          </div>
        </Stack>
      </div>
    </Screen>
  );
}

// ─── Intake Step 4: Filing Status ────────────────────────────
function ScreenFilingStatus({ t, onNext, onBack }) {
  const [sel, setSel] = React.useState('single');
  const options = [
    { id: 'single', label: 'Single', hint: 'Unmarried or legally separated' },
    { id: 'mfj', label: 'Married filing jointly', hint: 'Most common for married couples' },
    { id: 'mfs', label: 'Married filing separately', hint: 'Each spouse files their own return' },
    { id: 'hoh', label: 'Head of household', hint: 'Unmarried, supporting a qualifying dependent' },
    { id: 'qw', label: 'Qualifying widow(er)', hint: 'Spouse passed within the last 2 years' },
  ];
  return (
    <Screen t={t}>
      <div style={{ padding: '24px 0 0', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <IntakeHeader t={t} step={4} label="Filing" />
        <div style={{ padding: '32px 24px 8px' }}>
          <Stack gap={10}>
            <H1 t={t}>What's your filing status?</H1>
            <Body t={t} size={15}>
              This affects your standard deduction and tax bracket.
            </Body>
          </Stack>
        </div>
        <Stack gap={10} style={{ padding: '20px 24px 16px', flex: 1 }}>
          {options.map(o => (
            <Card key={o.id} t={t}
                  onClick={() => setSel(o.id)}
                  selected={sel === o.id}
                  tinted={sel === o.id}
                  style={{ padding: '16px 18px' }}>
              <Row gap={12} align="flex-start">
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  border: `1.5px solid ${sel === o.id ? t.rust : t.border}`,
                  background: sel === o.id ? t.rust : 'transparent',
                  flexShrink: 0, marginTop: 2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {sel === o.id && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 500, color: t.ink, marginBottom: 3 }}>{o.label}</div>
                  <div style={{ fontSize: 13, color: t.muted, lineHeight: 1.4 }}>{o.hint}</div>
                </div>
              </Row>
            </Card>
          ))}
          <div style={{ marginTop: 8 }}>
            <AntonioNote t={t}>
              If you're not sure which applies, pick your best guess — I'll verify during our call.
            </AntonioNote>
          </div>
        </Stack>
        <div style={{
          position: 'sticky', bottom: 0,
          background: `linear-gradient(to top, ${t.bg} 75%, transparent)`,
          padding: '20px 24px 28px',
        }}>
          <div style={{ marginBottom: 12 }}>
            <AskAntonioBar t={t} />
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

// ─── 4. Intake Step 1: Services (Dynamic pricing) ───────────────
function ServiceIcon({ t, kind }) {
  const s = { width: 20, height: 20, stroke: t.rustInk, strokeWidth: 1.4, fill: 'none' };
  const map = {
    personal: <svg {...s} viewBox="0 0 20 20"><rect x="3" y="3" width="14" height="14" rx="2" strokeLinejoin="round"/><path d="M6 8h8M6 11h5" strokeLinecap="round"/></svg>,
    self: <svg {...s} viewBox="0 0 20 20"><path d="M3 6h14v11H3zM3 6l3-3h8l3 3" strokeLinejoin="round"/><path d="M8 10h4" strokeLinecap="round"/></svg>,
    biz: <svg {...s} viewBox="0 0 20 20"><rect x="3" y="6" width="14" height="11" rx="1" strokeLinejoin="round"/><path d="M7 6V4h6v2M8 10v4M12 10v4" strokeLinecap="round"/></svg>,
    rental: <svg {...s} viewBox="0 0 20 20"><path d="M3 10l7-6 7 6v7H3z" strokeLinejoin="round"/><path d="M8 17v-4h4v4" /></svg>,
    crypto: <svg {...s} viewBox="0 0 20 20"><circle cx="10" cy="10" r="7"/><path d="M8 7v6M12 7v6M7 9h5a1.5 1.5 0 010 3H7M7 9l-1 1M7 12l-1 1" strokeLinecap="round"/></svg>,
    amend: <svg {...s} viewBox="0 0 20 20"><path d="M4 4h9l3 3v9H4z" strokeLinejoin="round"/><path d="M7 11l3 3 5-5" strokeLinecap="round"/></svg>,
    states: <svg {...s} viewBox="0 0 20 20"><path d="M3 5l4-1 6 2 4-1v11l-4 1-6-2-4 1z" strokeLinejoin="round"/><path d="M7 4v12M13 6v12" /></svg>,
    fbar: <svg {...s} viewBox="0 0 20 20"><circle cx="10" cy="10" r="7"/><path d="M3 10h14M10 3c2.5 2 2.5 12 0 14M10 3c-2.5 2-2.5 12 0 14" /></svg>,
    consult: <svg {...s} viewBox="0 0 20 20"><path d="M4 4h12v9H9l-4 3v-3H4z" strokeLinejoin="round"/><path d="M8 8h4M8 10h3" strokeLinecap="round"/></svg>,
    formation: <svg {...s} viewBox="0 0 20 20"><path d="M5 3h7l3 3v11H5z" strokeLinejoin="round"/><path d="M12 3v4h3M8 11h4M8 13h4" strokeLinecap="round"/></svg>,
    books: <svg {...s} viewBox="0 0 20 20"><path d="M4 4h5a2 2 0 012 2v11a2 2 0 00-2-2H4zM16 4h-5a2 2 0 00-2 2v11a2 2 0 012-2h5z" strokeLinejoin="round"/></svg>,
    strategy: <svg {...s} viewBox="0 0 20 20"><path d="M3 15l4-5 3 2 4-6 3 4" strokeLinejoin="round" strokeLinecap="round"/><circle cx="7" cy="10" r="1.2" fill={t.rustInk}/><circle cx="14" cy="6" r="1.2" fill={t.rustInk}/></svg>,
  };
  return map[kind] || null;
}

// Shared catalog used by path + add-ons screens
const SERVICE_CATALOG = {
  paths: [
    { id: 'personal', name: 'Personal tax return', sub: 'W-2 income, maybe a 1099', fee: '$150 – $250', lo: 150, hi: 250, icon: 'personal' },
    { id: 'self', name: 'Self-employed return', sub: 'Schedule C or 1099 income', fee: '$250 – $500', lo: 250, hi: 500, icon: 'self' },
    { id: 'biz', name: 'Business return', sub: 'S-Corp, Partnership, LLC', fee: '$500 – $1,000', lo: 500, hi: 1000, icon: 'biz' },
    { id: 'other', name: 'Something else', sub: 'Consultation, new business, bookkeeping', fee: 'Varies', lo: 0, hi: 0, icon: 'consult' },
  ],
  otherSub: [
    { id: 'intro', name: 'Introductory consultation', sub: 'New clients — get acquainted', fee: 'Free', lo: 0, hi: 0, icon: 'consult' },
    { id: 'formation', name: 'Business formation', sub: 'LLC, S-Corp, Partnership setup — plus state fees', fee: '$500 – $1,500', lo: 500, hi: 1500, icon: 'formation' },
    { id: 'books', name: 'Bookkeeping consultation', sub: 'Review your current process', fee: 'Free initial', lo: 0, hi: 0, icon: 'books' },
    { id: 'strategy', name: 'Strategic tax & business consultation', sub: 'Planning, entity structure, long-term', fee: '$300 – $600', lo: 300, hi: 600, icon: 'strategy' },
  ],
  addons: {
    personal: [
      { id: 'rental', name: 'Rental property', sub: '+$150 per property', fee: '+ $150', lo: 150, hi: 150, icon: 'rental' },
      { id: 'crypto', name: 'Crypto transactions', sub: 'Trades, staking, wallets', fee: '+ $100', lo: 100, hi: 100, icon: 'crypto' },
      { id: 'states', name: 'Multi-state filing', sub: 'Per additional state', fee: '+ $75 – $150', lo: 75, hi: 150, icon: 'states' },
      { id: 'fbar', name: 'Foreign accounts (FBAR)', sub: 'Assets held outside the US', fee: '+ $250', lo: 250, hi: 250, icon: 'fbar' },
      { id: 'amend', name: 'Prior year amendment', sub: 'Correcting a filed return', fee: '$200 – $400', lo: 200, hi: 400, icon: 'amend' },
    ],
    self: [
      { id: 'rental', name: 'Rental property', sub: '+$150 per property', fee: '+ $150', lo: 150, hi: 150, icon: 'rental' },
      { id: 'crypto', name: 'Crypto transactions', sub: 'Trades, staking, wallets', fee: '+ $100', lo: 100, hi: 100, icon: 'crypto' },
      { id: 'states', name: 'Multi-state filing', sub: 'Per additional state', fee: '+ $75 – $150', lo: 75, hi: 150, icon: 'states' },
      { id: 'fbar', name: 'Foreign accounts (FBAR)', sub: 'Assets held outside the US', fee: '+ $250', lo: 250, hi: 250, icon: 'fbar' },
      { id: 'amend', name: 'Prior year amendment', sub: 'Correcting a filed return', fee: '$200 – $400', lo: 200, hi: 400, icon: 'amend' },
    ],
    biz: [
      { id: 'states', name: 'Multi-state filing', sub: 'Per additional state', fee: '+ $75 – $150', lo: 75, hi: 150, icon: 'states' },
      { id: 'amend', name: 'Prior year amendment', sub: 'Correcting a filed return', fee: '$200 – $400', lo: 200, hi: 400, icon: 'amend' },
      { id: 'books', name: 'Bookkeeping cleanup', sub: 'Before we prep the return', fee: '$300 – $800', lo: 300, hi: 800, icon: 'books' },
    ],
    other: [],
  },
};

// Persisted selection across both service screens
function getServicePick() {
  try {
    const raw = localStorage.getItem('vazant.servicePick');
    if (!raw) return null;
    const p = JSON.parse(raw);
    p.addons = new Set(p.addons || []);
    return p;
  } catch { return null; }
}
function setServicePick(pick) {
  try {
    localStorage.setItem('vazant.servicePick', JSON.stringify({
      path: pick.path, otherSub: pick.otherSub || null, addons: [...(pick.addons || [])],
    }));
  } catch {}
}

// ─── Services — Screen A: choose path ───────────────────────────
function ScreenServicePath({ t, onNext, onBack }) {
  const initial = getServicePick();
  const [path, setPath] = React.useState(initial?.path || 'personal');
  const [otherSub, setOtherSub] = React.useState(initial?.otherSub || null);

  const pickPath = (id) => {
    setPath(id);
    if (id !== 'other') setOtherSub(null);
  };

  const currentPath = SERVICE_CATALOG.paths.find(p => p.id === path);
  const currentOther = otherSub ? SERVICE_CATALOG.otherSub.find(o => o.id === otherSub) : null;

  const headline = path === 'other'
    ? (currentOther ? currentOther.fee : 'Pick a service below')
    : currentPath.fee;

  const canContinue = path !== 'other' || !!otherSub;

  const handleNext = () => {
    setServicePick({ path, otherSub, addons: new Set() });
    onNext && onNext();
  };

  return (
    <Screen t={t}>
      <div style={{ padding: '24px 0 0', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <IntakeHeader t={t} step={1} subStep="A" label="Services" />
        <div style={{ padding: '32px 24px 8px' }}>
          <Stack gap={10}>
            <H1 t={t}>What brings you in this year?</H1>
            <Body t={t} size={15}>
              Pick the one that fits best. I'll ask about add-ons next.
            </Body>
          </Stack>
        </div>

        <Stack gap={12} style={{ padding: '24px 24px 16px', flex: 1 }}>
          {SERVICE_CATALOG.paths.map(p => (
            <Card key={p.id} t={t}
                  onClick={() => pickPath(p.id)}
                  selected={path === p.id}
                  tinted={path === p.id}
                  style={{ padding: '16px 18px' }}>
              <Row gap={14} align="flex-start">
                <div style={{
                  width: 44, height: 44, borderRadius: t.tone === 'magazine' ? 4 : 10,
                  background: path === p.id ? t.rustSoft : t.bgElev,
                  border: `1px solid ${path === p.id ? t.rust : t.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginTop: 2,
                }}>
                  <ServiceIcon t={t} kind={p.icon} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Row justify="space-between" align="baseline" gap={10}>
                    <div style={{ fontSize: 16, fontWeight: 500, color: t.ink }}>{p.name}</div>
                    <div style={{
                      fontFamily: t.mono, fontSize: 12,
                      color: path === p.id ? t.rustInk : t.muted,
                      fontWeight: path === p.id ? 500 : 400,
                      whiteSpace: 'nowrap',
                    }}>{p.fee}</div>
                  </Row>
                  <div style={{ fontSize: 13, color: t.muted, lineHeight: 1.45, marginTop: 3 }}>
                    {p.sub}
                  </div>
                  {/* Inline sub-picker for "Something else" */}
                  {p.id === 'other' && path === 'other' && (
                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px dashed ${t.borderSoft}` }}>
                      <div style={{ fontFamily: t.serif, fontStyle: 'italic', fontSize: 13, color: t.inkSoft, marginBottom: 10 }}>
                        Which one?
                      </div>
                      <Stack gap={8}>
                        {SERVICE_CATALOG.otherSub.map(o => (
                          <div key={o.id}
                               onClick={(e) => { e.stopPropagation(); setOtherSub(o.id); }}
                               style={{
                                 display: 'flex', alignItems: 'flex-start', gap: 12,
                                 padding: '12px',
                                 background: otherSub === o.id ? t.rustSoft : t.bgElev,
                                 border: `1px solid ${otherSub === o.id ? t.rust : t.border}`,
                                 borderRadius: t.tone === 'magazine' ? 2 : 8,
                                 cursor: 'pointer',
                               }}>
                            <div style={{
                              width: 16, height: 16, borderRadius: '50%',
                              border: `1.5px solid ${otherSub === o.id ? t.rust : t.border}`,
                              background: otherSub === o.id ? t.rust : 'transparent',
                              flexShrink: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              marginTop: 2,
                            }}>
                              {otherSub === o.id && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }}/>}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <Row justify="space-between" align="baseline" gap={8} style={{ marginBottom: 2 }}>
                                <div style={{ fontSize: 14, color: t.ink, fontWeight: 500 }}>{o.name}</div>
                                <div style={{
                                  fontFamily: t.mono, fontSize: 11,
                                  color: otherSub === o.id ? t.rustInk : t.muted,
                                  whiteSpace: 'nowrap', flexShrink: 0,
                                }}>{o.fee}</div>
                              </Row>
                              <div style={{ fontSize: 12, color: t.muted, lineHeight: 1.4 }}>{o.sub}</div>
                            </div>
                          </div>
                        ))}
                      </Stack>
                    </div>
                  )}
                </div>
              </Row>
            </Card>
          ))}

          <div style={{ marginTop: 4 }}>
            <AntonioNote t={t}>
              Not sure? Pick the closest match — we can adjust once I see your documents.
            </AntonioNote>
          </div>
        </Stack>

        {/* Simple estimate ticker */}
        <div style={{
          position: 'sticky', bottom: 0,
          background: `linear-gradient(to top, ${t.bg} 70%, transparent)`,
          padding: '20px 24px 28px',
        }}>
          <div style={{
            background: t.card,
            border: `1px solid ${t.border}`,
            borderRadius: t.radius,
            padding: '14px 16px',
            marginBottom: 12,
            boxShadow: '0 6px 18px rgba(60, 40, 28, 0.06)',
          }}>
            <Row justify="space-between" align="center">
              <div style={{ fontFamily: t.serif, fontStyle: 'italic', fontSize: 13, color: t.muted }}>
                Starting estimate
              </div>
              <div style={{ fontFamily: t.serif, fontSize: 20, color: t.ink, letterSpacing: -0.3 }}>
                {headline}
              </div>
            </Row>
          </div>
          <div style={{ marginBottom: 12 }}>
            <AskAntonioBar t={t} />
          </div>
          <Row gap={10}>
            <Button t={t} variant="ghost" onClick={onBack} style={{ flex: '0 0 auto' }}>Back</Button>
            <Button t={t} onClick={handleNext} style={{ flex: 1 }} disabled={!canContinue}>
              {path === 'other' ? 'Continue' : 'Next — add-ons'}
            </Button>
          </Row>
        </div>
      </div>
    </Screen>
  );
}

// ─── Services — Screen B: conditional add-ons ───────────────────
function ScreenServiceAddons({ t, onNext, onBack }) {
  const initial = getServicePick() || { path: 'personal', addons: new Set() };
  const [addons, setAddons] = React.useState(initial.addons || new Set());

  const pathDef = SERVICE_CATALOG.paths.find(p => p.id === initial.path) || SERVICE_CATALOG.paths[0];
  const list = SERVICE_CATALOG.addons[initial.path] || [];

  const toggleAddon = (id) => {
    const n = new Set(addons);
    n.has(id) ? n.delete(id) : n.add(id);
    setAddons(n);
  };

  // Build breakdown
  const breakdown = [{ id: pathDef.id, name: pathDef.name, fee: pathDef.fee, lo: pathDef.lo, hi: pathDef.hi }];
  list.forEach(a => { if (addons.has(a.id)) breakdown.push({ id: a.id, name: a.name, fee: a.fee, lo: a.lo, hi: a.hi }); });
  const lo = breakdown.reduce((a, s) => a + s.lo, 0);
  const hi = breakdown.reduce((a, s) => a + s.hi, 0);

  const handleNext = () => {
    setServicePick({ path: initial.path, otherSub: initial.otherSub, addons });
    onNext && onNext();
  };

  return (
    <Screen t={t}>
      <div style={{ padding: '24px 0 0', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <IntakeHeader t={t} step={1} subStep="B" label="Services" />
        <div style={{ padding: '32px 24px 8px' }}>
          <Stack gap={10}>
            <H1 t={t}>Anything else going on?</H1>
            <Body t={t} size={15}>
              Select what applies. Skip if none of these fit.
            </Body>
            <div style={{
              marginTop: 6,
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 10px',
              background: t.bgElev,
              border: `1px solid ${t.borderSoft}`,
              borderRadius: t.tone === 'magazine' ? 2 : 999,
              alignSelf: 'flex-start',
            }}>
              <ServiceIcon t={t} kind={pathDef.icon} />
              <span style={{ fontSize: 12.5, color: t.inkSoft }}>
                Building on <span style={{ color: t.ink, fontWeight: 500 }}>{pathDef.name}</span>
              </span>
              <span
                onClick={onBack}
                style={{ fontFamily: t.serif, fontStyle: 'italic', fontSize: 12, color: t.rustInk, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2 }}>
                change
              </span>
            </div>
          </Stack>
        </div>

        <Stack gap={10} style={{ padding: '24px 24px 16px', flex: 1 }}>
          {list.map(item => {
            const selected = addons.has(item.id);
            return (
              <Card key={item.id} t={t}
                    onClick={() => toggleAddon(item.id)}
                    selected={selected}
                    tinted={selected}
                    style={{ padding: '14px 16px' }}>
                <Row gap={14} align="center">
                  <div style={{
                    width: 22, height: 22, flexShrink: 0,
                    borderRadius: t.tone === 'magazine' ? 3 : 5,
                    border: `1.5px solid ${selected ? t.rust : t.border}`,
                    background: selected ? t.rust : t.card,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {selected && <svg width="12" height="10" viewBox="0 0 12 10"><path d="M1 5l3.5 3.5L11 1" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 500, color: t.ink, marginBottom: 2 }}>{item.name}</div>
                    <div style={{ fontSize: 12.5, color: t.muted, lineHeight: 1.4 }}>{item.sub}</div>
                  </div>
                  <div style={{
                    fontFamily: t.mono, fontSize: 12,
                    color: selected ? t.rustInk : t.muted,
                    fontWeight: selected ? 500 : 400,
                    whiteSpace: 'nowrap',
                  }}>{item.fee}</div>
                </Row>
              </Card>
            );
          })}

          <div style={{ marginTop: 6 }}>
            <AntonioNote t={t}>
              If none of these apply, skip ahead — we'll catch anything I missed during review.
            </AntonioNote>
          </div>
        </Stack>

        {/* Full estimate with breakdown */}
        <div style={{
          position: 'sticky', bottom: 0,
          background: `linear-gradient(to top, ${t.bg} 70%, transparent)`,
          padding: '20px 24px 28px',
        }}>
          <div style={{
            background: t.card,
            border: `1px solid ${t.border}`,
            borderRadius: t.radius,
            padding: '14px 16px 6px',
            marginBottom: 12,
            boxShadow: '0 6px 18px rgba(60, 40, 28, 0.06)',
          }}>
            <Row justify="space-between" align="flex-start">
              <div>
                <div style={{ fontFamily: t.serif, fontStyle: 'italic', fontSize: 12.5, color: t.muted, marginBottom: 4 }}>
                  Your estimate
                </div>
                <div style={{ fontFamily: t.serif, fontSize: 22, color: t.ink, letterSpacing: -0.4 }}>
                  {lo === hi ? (lo === 0 ? 'Free' : `$${lo.toLocaleString()}`) : `$${lo.toLocaleString()} – $${hi.toLocaleString()}`}
                </div>
              </div>
              <div style={{
                fontFamily: t.serif, fontStyle: 'italic',
                fontSize: 11.5, color: t.muted, textAlign: 'right',
                lineHeight: 1.4, maxWidth: 140, paddingTop: 2,
              }}>
                final quote after Antonio reviews
              </div>
            </Row>

            <div style={{
              marginTop: 12,
              paddingTop: 10,
              borderTop: `1px dashed ${t.borderSoft}`,
            }}>
              {breakdown.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '7px 6px', margin: '0 -6px',
                    borderRadius: 6,
                  }}
                >
                  <span style={{ color: t.rust, fontSize: 10, lineHeight: 1 }}>●</span>
                  <span style={{
                    flex: 1, minWidth: 0,
                    fontSize: 12.5, color: t.inkSoft,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{item.name}</span>
                  <span style={{
                    fontFamily: t.mono, fontSize: 11.5, color: t.rustInk,
                    whiteSpace: 'nowrap',
                  }}>{item.fee}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <AskAntonioBar t={t} />
          </div>
          <Row gap={10}>
            <Button t={t} variant="ghost" onClick={onBack} style={{ flex: '0 0 auto' }}>Back</Button>
            <Button t={t} onClick={handleNext} style={{ flex: 1 }}>
              {addons.size === 0 ? 'Skip — nothing else' : `Continue with ${addons.size} add-on${addons.size === 1 ? '' : 's'}`}
            </Button>
          </Row>
        </div>
      </div>
    </Screen>
  );
}

// ─── (legacy) Services — original combined screen, kept for reference ─
function ScreenServices({ t, onNext, onBack }) {
  // Base tier: single-select
  const [base, setBase] = React.useState('personal');
  // Add-ons: multi-select (Set of ids)
  const [addons, setAddons] = React.useState(new Set());
  // Other services: single-select, mutually exclusive with base
  const [other, setOther] = React.useState(null);

  const baseTier = [
    { id: 'personal', name: 'Personal tax return', sub: 'W-2 income, maybe a 1099', fee: '$150 – $250', lo: 150, hi: 250, icon: 'personal' },
    { id: 'self', name: 'Self-employed return', sub: 'Schedule C, 1099 income', fee: '$250 – $500', lo: 250, hi: 500, icon: 'self' },
    { id: 'biz', name: 'Business return', sub: 'S-Corp, Partnership, LLC', fee: '$500 – $1,000', lo: 500, hi: 1000, icon: 'biz' },
  ];

  const addonList = [
    { id: 'rental', name: 'Rental property', sub: '+$150/property (long-term) · asks type next', fee: '+ $150', lo: 150, hi: 150, icon: 'rental' },
    { id: 'crypto', name: 'Crypto transactions', sub: 'Trades, staking, wallets', fee: '+ $100', lo: 100, hi: 100, icon: 'crypto' },
    { id: 'states', name: 'Multi-state filing', sub: 'Per additional state', fee: '+ $75 – $150', lo: 75, hi: 150, icon: 'states' },
    { id: 'fbar', name: 'Foreign accounts (FBAR)', sub: 'Assets held outside the US', fee: '+ $250', lo: 250, hi: 250, icon: 'fbar' },
    { id: 'amend', name: 'Prior year amendment', sub: 'Correcting a previously filed return', fee: '$200 – $400', lo: 200, hi: 400, icon: 'amend' },
  ];

  const otherList = [
    { id: 'intro', name: 'Introductory consultation', sub: 'New clients — get acquainted', fee: 'Free', lo: 0, hi: 0, icon: 'consult' },
    { id: 'formation', name: 'Business formation', sub: 'LLC, S-Corp, Partnership setup', fee: '$500 – $1,500 + state fees', lo: 500, hi: 1500, icon: 'formation' },
    { id: 'books', name: 'Bookkeeping consultation', sub: 'Review your current process', fee: 'Free initial', lo: 0, hi: 0, icon: 'books' },
    { id: 'strategy', name: 'Strategic tax & business consultation', sub: 'Planning, entity structure, long-term', fee: '$300 – $600', lo: 300, hi: 600, icon: 'strategy' },
  ];

  // Mutual exclusivity: picking Other clears tax; picking tax clears Other
  const pickBase = (id) => { setBase(id); setOther(null); };
  const pickOther = (id) => {
    if (other === id) { setOther(null); } else { setOther(id); setBase(null); setAddons(new Set()); }
  };
  const toggleAddon = (id) => {
    const n = new Set(addons); n.has(id) ? n.delete(id) : n.add(id);
    setAddons(n); setOther(null);
  };

  // Breakdown + totals
  const breakdown = [];
  if (base) {
    const b = baseTier.find(x => x.id === base);
    breakdown.push({ id: b.id, name: b.name, fee: b.fee, lo: b.lo, hi: b.hi });
  }
  addonList.forEach(a => {
    if (addons.has(a.id)) breakdown.push({ id: a.id, name: a.name, fee: a.fee, lo: a.lo, hi: a.hi });
  });
  if (other) {
    const o = otherList.find(x => x.id === other);
    breakdown.push({ id: o.id, name: o.name, fee: o.fee, lo: o.lo, hi: o.hi });
  }
  const lo = breakdown.reduce((a, s) => a + s.lo, 0);
  const hi = breakdown.reduce((a, s) => a + s.hi, 0);
  const canContinue = !!base || !!other;

  const renderItem = (item, { selected, onClick, kind }) => (
    <Card key={item.id} t={t} onClick={onClick} selected={selected} tinted={selected}
          style={{ padding: '14px 16px' }}>
      <Row gap={14}>
        <div style={{
          width: 40, height: 40, borderRadius: t.tone === 'magazine' ? 4 : 10,
          background: selected ? t.rustSoft : t.bgElev,
          border: `1px solid ${selected ? t.rust : t.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <ServiceIcon t={t} kind={item.icon} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: t.ink, marginBottom: 2 }}>{item.name}</div>
          <div style={{ fontSize: 12, color: t.muted, lineHeight: 1.4 }}>{item.sub}</div>
        </div>
        <div style={{
          fontFamily: t.mono, fontSize: 12,
          color: selected ? t.rustInk : t.muted,
          fontWeight: selected ? 500 : 400,
          whiteSpace: 'nowrap',
        }}>{item.fee}</div>
      </Row>
    </Card>
  );

  const GroupLabel = ({ num, title, hint }) => (
    <Row justify="space-between" align="baseline" style={{ margin: '4px 0 2px' }}>
      <Row gap={8} align="baseline">
        <span style={{ fontFamily: t.mono, fontSize: 10, color: t.rustInk, letterSpacing: 1.2 }}>{num}</span>
        <span style={{ fontFamily: t.serif, fontSize: 15, color: t.ink, letterSpacing: -0.2 }}>{title}</span>
      </Row>
      <span style={{ fontFamily: t.mono, fontSize: 9.5, color: t.muted, letterSpacing: 0.8 }}>{hint}</span>
    </Row>
  );

  return (
    <Screen t={t}>
      <div style={{ padding: '24px 0 0', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <IntakeHeader t={t} step={1} label="Services" />
        <div style={{ padding: '32px 24px 8px' }}>
          <Stack gap={10}>
            <H1 t={t}>What services do you need this year?</H1>
            <Body t={t} size={15}>
              Pick a base tier, then any add-ons. I'll follow up if anything's missing.
            </Body>
          </Stack>
        </div>

        <Stack gap={20} style={{ padding: '20px 24px 16px', flex: 1 }}>
          {/* Group A — Base tier */}
          <Stack gap={10}>
            <GroupLabel num="A" title="Base tier" hint="PICK ONE" />
            {baseTier.map(s => renderItem(s, {
              selected: base === s.id,
              onClick: () => pickBase(s.id),
            }))}
          </Stack>

          {/* Group B — Add-ons */}
          <Stack gap={10}>
            <GroupLabel num="B" title="Add-ons" hint="SELECT ANY" />
            {addonList.map(s => renderItem(s, {
              selected: addons.has(s.id),
              onClick: () => toggleAddon(s.id),
            }))}
          </Stack>

          {/* Divider */}
          <div style={{
            borderTop: `1px solid ${t.borderSoft}`,
            margin: '4px 0 0',
          }}/>

          {/* Group C — Other services */}
          <Stack gap={10}>
            <GroupLabel num="C" title="Other services" hint="INSTEAD OF A TAX RETURN" />
            {otherList.map(s => renderItem(s, {
              selected: other === s.id,
              onClick: () => pickOther(s.id),
            }))}
          </Stack>

          <div style={{ marginTop: 4 }}>
            <AntonioNote t={t}>
              Don't worry if you're not sure — I'll adjust based on what you actually have.
            </AntonioNote>
          </div>
        </Stack>

        {/* Pricing ticker — rich breakdown */}
        <div style={{
          position: 'sticky', bottom: 0,
          background: `linear-gradient(to top, ${t.bg} 70%, transparent)`,
          padding: '20px 24px 28px',
        }}>
          <div style={{
            background: t.card,
            border: `1px solid ${t.border}`,
            borderRadius: t.radius,
            padding: '14px 16px 6px',
            marginBottom: 12,
            boxShadow: '0 6px 18px rgba(60, 40, 28, 0.06)',
          }}>
            {/* Top row */}
            <Row justify="space-between" align="flex-start">
              <div>
                <div style={{ fontFamily: t.mono, fontSize: 10, color: t.muted, letterSpacing: 1, marginBottom: 4 }}>
                  YOUR ESTIMATE
                </div>
                <div style={{ fontFamily: t.serif, fontSize: 22, color: t.ink, letterSpacing: -0.4 }}>
                  {breakdown.length
                    ? (lo === hi ? (lo === 0 ? 'Free' : `$${lo.toLocaleString()}`) : `$${lo.toLocaleString()} – $${hi.toLocaleString()}`)
                    : 'Select a service'}
                </div>
              </div>
              <div style={{
                fontFamily: t.serif, fontStyle: 'italic',
                fontSize: 11.5, color: t.muted, textAlign: 'right',
                lineHeight: 1.4, maxWidth: 130, paddingTop: 2,
              }}>
                final quote after Antonio reviews
              </div>
            </Row>

            {/* Breakdown */}
            {breakdown.length > 0 && (
              <div style={{
                marginTop: 12,
                paddingTop: 10,
                borderTop: `1px dashed ${t.borderSoft}`,
              }}>
                {breakdown.map((item, i) => (
                  <div
                    key={item.id}
                    className="brk-row"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '7px 6px', margin: '0 -6px',
                      borderRadius: 6,
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ color: t.rust, fontSize: 10, lineHeight: 1 }}>●</span>
                    <span style={{
                      flex: 1, minWidth: 0,
                      fontSize: 12.5, color: t.inkSoft,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{item.name}</span>
                    <span style={{
                      fontFamily: t.mono, fontSize: 11.5, color: t.rustInk,
                      whiteSpace: 'nowrap',
                    }}>{item.fee}</span>
                  </div>
                ))}
                <style>{`
                  .brk-row:hover { background: ${t.tintAccent}; }
                  .brk-row:active { background: ${t.rustSoft}; }
                `}</style>
              </div>
            )}
          </div>
          <div style={{ marginBottom: 12 }}>
            <AskAntonioBar t={t} />
          </div>
          <Row gap={10}>
            <Button t={t} variant="ghost" onClick={onBack} style={{ flex: '0 0 auto' }}>Back</Button>
            <Button t={t} onClick={onNext} style={{ flex: 1 }} disabled={!canContinue}>Continue</Button>
          </Row>
        </div>
      </div>
    </Screen>
  );
}

// ─── 5a. Engagement Letter ──────────────────────────────────────
function LegalDoc({ t, title, paras }) {
  return (
    <div style={{
      background: t.card,
      border: `1px solid ${t.border}`,
      borderRadius: t.radius,
      padding: '20px 20px 18px',
      maxHeight: 260,
      overflowY: 'auto',
      fontSize: 13,
      lineHeight: 1.55,
      color: t.inkSoft,
      fontFamily: t.serif,
    }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: t.ink, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: t.sans }}>
        {title}
      </div>
      {paras.map((p, i) => <p key={i} style={{ margin: '0 0 10px' }}>{p}</p>)}
    </div>
  );
}

function SignaturePad({ t, signed, onSign, name = 'Maria Rodriguez' }) {
  return (
    <div style={{
      background: t.bgElev,
      border: `1.5px dashed ${signed ? t.rust : t.border}`,
      borderRadius: t.radius,
      padding: signed ? '14px 18px' : '28px 18px',
      cursor: 'pointer',
      transition: 'all 0.2s',
    }} onClick={() => !signed && onSign()}>
      {signed ? (
        <div>
          <div style={{
            fontFamily: '"Caveat", "Brush Script MT", cursive',
            fontSize: 28,
            color: t.ink,
            lineHeight: 1,
          }}>{name}</div>
          <div style={{ fontFamily: t.mono, fontSize: 10, color: t.muted, letterSpacing: 0.5, marginTop: 4 }}>
            SIGNED APR 17, 2026 · 2:14 PM PT
          </div>
        </div>
      ) : (
        <Row justify="center" gap={8}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 12l3-1 8-8 1 1-8 8-1 3-3-3z" stroke={t.muted} strokeWidth="1.3" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize: 14, color: t.muted }}>Tap to sign</span>
        </Row>
      )}
    </div>
  );
}

function ScreenEngagement({ t, onNext, onBack }) {
  const [checked, setChecked] = React.useState(false);
  const [signed, setSigned] = React.useState(false);
  const ready = checked && signed;
  return (
    <Screen t={t}>
      <div style={{ padding: '24px 0 0', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <IntakeHeader t={t} step={13} label="Engagement" />
        <div style={{ padding: '32px 24px 8px' }}>
          <Stack gap={10}>
            <H1 t={t}>Our engagement letter</H1>
            <Body t={t} size={15}>
              This is our formal agreement. Please read before signing.
            </Body>
          </Stack>
        </div>

        <Stack gap={16} style={{ padding: '20px 24px 16px', flex: 1 }}>
          <LegalDoc t={t} title="Engagement Letter — 2024 Tax Year" paras={[
            'This letter confirms the terms of the engagement between Antonio Vazquez, Enrolled Agent ("Preparer") and the undersigned client ("Client") for the preparation of the Client\'s 2024 federal and state income tax returns.',
            'Scope of services: Preparer will prepare the returns based solely on information provided by Client. Preparer will make reasonable inquiries where information appears incomplete or inconsistent, but is not obligated to audit or independently verify the data.',
            'Responsibilities: Client is responsible for providing all income, deduction, and credit information in a timely manner. Client understands that failure to disclose relevant information may result in incorrect returns and potential penalties.',
            'Fees and payment: Fees are based on the complexity of the return and are estimated in advance. A $50 deposit is required to secure an appointment and is credited against the final fee. Balance is due upon completion, before filing.',
            'Confidentiality: All information provided by Client will be held in strict confidence and used solely for the purpose of preparing the returns, except as otherwise authorized in writing.',
          ]} />

          <Row gap={10} align="flex-start">
            <div onClick={() => setChecked(!checked)} style={{
              width: 22, height: 22, flexShrink: 0,
              borderRadius: 5,
              border: `1.5px solid ${checked ? t.rust : t.border}`,
              background: checked ? t.rust : t.card,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginTop: 1,
            }}>
              {checked && <svg width="12" height="10" viewBox="0 0 12 10"><path d="M1 5l3.5 3.5L11 1" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
            <div onClick={() => setChecked(!checked)} style={{ fontSize: 14, color: t.inkSoft, cursor: 'pointer', lineHeight: 1.5 }}>
              I've read and agree to the engagement letter
            </div>
          </Row>

          <div>
            <div style={{ fontFamily: t.mono, fontSize: 10, color: t.muted, letterSpacing: 1.2, marginBottom: 8 }}>
              SIGNATURE
            </div>
            <SignaturePad t={t} signed={signed} onSign={() => setSigned(true)} />
          </div>
        </Stack>

        <BottomBar t={t}>
          <Button t={t} variant="ghost" onClick={onBack} style={{ flex: '0 0 auto' }}>Back</Button>
          <Button t={t} onClick={onNext} disabled={!ready} style={{ flex: 1 }}>Sign and continue</Button>
        </BottomBar>
      </div>
    </Screen>
  );
}

// ─── 5b. §7216 Consent ──────────────────────────────────────────
function ScreenConsent7216({ t, onNext, onBack }) {
  const [checked, setChecked] = React.useState(false);
  const [signed, setSigned] = React.useState(false);
  const ready = checked && signed;
  return (
    <Screen t={t}>
      <div style={{ padding: '24px 0 0', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <IntakeHeader t={t} step={13} label="Consent" />
        <div style={{ padding: '32px 24px 8px' }}>
          <Stack gap={10}>
            <div style={{
              display: 'inline-flex', padding: '4px 10px',
              background: t.tintAccent, borderRadius: 999,
              fontFamily: t.mono, fontSize: 10, color: t.rustInk,
              letterSpacing: 1, alignSelf: 'flex-start',
            }}>IRS §7216 · SEPARATE CONSENT</div>
            <H1 t={t}>Permission to prepare your return</H1>
            <Body t={t} size={15}>
              Under IRS rule §7216, I need your separate permission to use your tax information to prepare your return. This is separate from the engagement letter you just signed.
            </Body>
          </Stack>
        </div>

        <Stack gap={16} style={{ padding: '20px 24px 16px', flex: 1 }}>
          <LegalDoc t={t} title="§7216 Consent — Use of Tax Information" paras={[
            'Federal law requires this consent form be provided to you. Unless authorized by law, we cannot use your tax return information for any purpose other than preparing your return without your consent.',
            'You are not required to complete this form. If we obtain your signature on this form by conditioning our services on your consent, your consent will not be valid. Your consent is valid for the amount of time that you specify.',
            'By signing below, you authorize Antonio Vazquez, Enrolled Agent, to use the information you provide solely for the purpose of preparing your 2024 federal and state income tax returns. This consent is valid until the returns are filed and accepted by the applicable tax authorities.',
            'If you believe your tax return information has been disclosed or used improperly in a manner unauthorized by law or without your permission, you may contact the Treasury Inspector General for Tax Administration (TIGTA).',
          ]} />

          <Row gap={10} align="flex-start">
            <div onClick={() => setChecked(!checked)} style={{
              width: 22, height: 22, flexShrink: 0,
              borderRadius: 5,
              border: `1.5px solid ${checked ? t.rust : t.border}`,
              background: checked ? t.rust : t.card,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginTop: 1,
            }}>
              {checked && <svg width="12" height="10" viewBox="0 0 12 10"><path d="M1 5l3.5 3.5L11 1" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
            <div onClick={() => setChecked(!checked)} style={{ fontSize: 14, color: t.inkSoft, cursor: 'pointer', lineHeight: 1.5 }}>
              I give Antonio permission to use my tax information to prepare my return
            </div>
          </Row>

          <div>
            <div style={{ fontFamily: t.mono, fontSize: 10, color: t.muted, letterSpacing: 1.2, marginBottom: 8 }}>
              SEPARATE SIGNATURE · SEPARATE TIMESTAMP
            </div>
            <SignaturePad t={t} signed={signed} onSign={() => setSigned(true)} />
          </div>
        </Stack>

        <BottomBar t={t}>
          <Button t={t} variant="ghost" onClick={onBack} style={{ flex: '0 0 auto' }}>Back</Button>
          <Button t={t} onClick={onNext} disabled={!ready} style={{ flex: 1 }}>Sign and continue</Button>
        </BottomBar>
      </div>
    </Screen>
  );
}

// ─── 6. Done ────────────────────────────────────────────────────
function HandCheckmark({ t, size = 120 }) {
  // Clean geometric success mark — animated entry
  return (
    <>
      <style>{`
        @keyframes hc-pop {
          0%   { transform: scale(0);   opacity: 0; }
          60%  { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1);    opacity: 1; }
        }
        @keyframes hc-draw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes hc-halo {
          0%   { transform: scale(0.4); opacity: 0.6; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>
      <svg width={size} height={size} viewBox="0 0 120 120" style={{ display: 'block', overflow: 'visible' }}>
        {/* soft expanding halo */}
        <circle
          cx="60" cy="60" r="46"
          fill="none"
          stroke={t.rust}
          strokeWidth="1.5"
          opacity="0"
          style={{
            transformOrigin: '60px 60px',
            animation: 'hc-halo 1.1s ease-out 0.35s forwards',
          }}
        />
        <g style={{
          transformOrigin: '60px 60px',
          animation: 'hc-pop 0.55s cubic-bezier(.34,1.56,.64,1) both',
        }}>
          <circle cx="60" cy="60" r="46" fill={t.rust} />
        </g>
        <path
          d="M40 62 L54 76 L82 46"
          stroke="#fff"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          style={{
            strokeDasharray: 70,
            strokeDashoffset: 70,
            animation: 'hc-draw 0.5s cubic-bezier(.65,0,.35,1) 0.45s forwards',
          }}
        />
      </svg>
    </>
  );
}

function ScreenDone({ t, onPortal }) {
  return (
    <Screen t={t}>
      <div style={{ padding: '48px 24px 32px', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <Stack gap={28} style={{ flex: 1 }}>
          <Row justify="center">
            <HandCheckmark t={t} size={128} />
          </Row>

          <Stack gap={10} style={{ textAlign: 'center', padding: '0 8px' }}>
            <H1 t={t} style={{ fontSize: 30 }}>You're all set, Maria</H1>
            <Body t={t} size={15}>
              Antonio will review your submission within 24 hours and reach out to confirm your appointment. You'll receive a text and email when he's reviewed your info.
            </Body>
          </Stack>

          {/* Appointment card */}
          <Card t={t} style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{
              padding: '14px 18px',
              background: t.tintAccent,
              borderBottom: `1px solid ${t.border}`,
              fontFamily: t.mono, fontSize: 10, color: t.rustInk, letterSpacing: 1,
            }}>YOUR APPOINTMENT</div>
            <div style={{ padding: 20 }}>
              <Stack gap={14}>
                <div>
                  <div style={{ fontFamily: t.serif, fontSize: 22, color: t.ink, letterSpacing: -0.3 }}>
                    Wed, April 22
                  </div>
                  <div style={{ fontFamily: t.mono, fontSize: 14, color: t.inkSoft, marginTop: 4 }}>
                    3:00 PM PT · Google Meet
                  </div>
                </div>
                <Row gap={8}>
                  <Button t={t} variant="ghost" style={{ flex: 1, padding: '10px 14px', fontSize: 13 }}>
                    Add to calendar
                  </Button>
                  <Button t={t} variant="ghost" style={{ flex: 1, padding: '10px 14px', fontSize: 13 }}>
                    Reschedule
                  </Button>
                </Row>
              </Stack>
            </div>
          </Card>

          {/* What happens next */}
          <div>
            <Eyebrow t={t} style={{ marginBottom: 14 }}>What happens next</Eyebrow>
            <Stack gap={0}>
              {[
                { n: 1, t: 'Antonio reviews your intake', s: 'Within 24 hours' },
                { n: 2, t: 'You get a confirmation text & email', s: 'From (951) 555-0234' },
                { n: 3, t: 'Upload your documents', s: 'In the portal — W-2s, 1099s, etc.' },
                { n: 4, t: 'Antonio prepares your return', s: 'You\'ll review & e-sign Form 8879' },
              ].map((s, i, arr) => (
                <Row key={i} gap={14} align="flex-start" style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: i === 0 ? t.rust : t.bgElev,
                      border: `1px solid ${i === 0 ? t.rust : t.border}`,
                      color: i === 0 ? '#fff' : t.muted,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: t.mono, fontSize: 12, fontWeight: 500,
                      flexShrink: 0,
                    }}>{s.n}</div>
                    {i < arr.length - 1 && (
                      <div style={{ width: 1, flex: 1, background: t.border, minHeight: 28, margin: '4px 0' }} />
                    )}
                  </div>
                  <div style={{ paddingBottom: i < arr.length - 1 ? 20 : 0, flex: 1 }}>
                    <div style={{ fontSize: 15, color: t.ink, fontWeight: 500 }}>{s.t}</div>
                    <div style={{ fontSize: 13, color: t.muted, marginTop: 2 }}>{s.s}</div>
                  </div>
                </Row>
              ))}
            </Stack>
          </div>

          <Button t={t} onClick={onPortal} style={{ width: '100%', padding: '16px' }}>
            Go to your portal →
          </Button>
        </Stack>

        <Footer t={t} />
      </div>
    </Screen>
  );
}

// ─── Ask Antonio bar — persistent intake footer widget ─────────
function AskAntonioBar({ t, onMessage }) {
  const handleClick = () => {
    if (onMessage) onMessage();
    // Always also dispatch global open
    try { window.dispatchEvent(new CustomEvent('ask-antonio:open')); } catch (e) {}
  };
  return (
    <div
      onClick={handleClick}
      style={{
        background: t.card,
        border: `1px solid ${t.border}`,
        borderRadius: 999,
        padding: '6px 8px 6px 10px',
        display: 'flex', alignItems: 'center', gap: 10,
        boxShadow: '0 4px 12px rgba(60, 40, 28, 0.04)',
        cursor: 'pointer',
      }}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <AvatarSlot t={t} size={30} label="A" />
        <div style={{
          position: 'absolute', bottom: -1, right: -1,
          width: 9, height: 9, borderRadius: '50%',
          background: '#4a8f5f',
          border: `2px solid ${t.card}`,
        }}/>
      </div>
      <span style={{ flex: 1, fontSize: 12.5, color: t.inkSoft }}>
        Not sure? Ask Antonio
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); handleClick(); }}
        style={{
          padding: '6px 14px', fontSize: 12, fontWeight: 500,
          background: t.rust, color: '#fff', border: 'none',
          borderRadius: 999, cursor: 'pointer',
          fontFamily: t.sans,
        }}
      >Message</button>
    </div>
  );
}

// ─── Ask Antonio Chat modal — global, opens on any AskAntonioBar click ───
function AskAntonioChat({ t }) {
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState('');
  const [messages, setMessages] = React.useState([
    { from: 'a', text: "Hey — I'm here. What can I help with?", time: '2:14 PM' },
  ]);
  const scrollerRef = React.useRef(null);

  React.useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener('ask-antonio:open', onOpen);
    return () => window.removeEventListener('ask-antonio:open', onOpen);
  }, []);

  React.useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages, open]);

  const send = () => {
    if (!input.trim()) return;
    const msg = input.trim();
    const now = new Date();
    const time = `${((now.getHours() + 11) % 12) + 1}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
    setMessages(m => [...m, { from: 'u', text: msg, time }]);
    setInput('');
    // Simulate Antonio typing + reply
    setTimeout(() => {
      setMessages(m => [...m, { from: 'a', text: "Got it. Give me a few minutes — I'll come back with specifics.", time }]);
    }, 1400);
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: 'absolute', inset: 0,
        background: 'rgba(32, 22, 16, 0.42)',
        zIndex: 60,
        display: 'flex', alignItems: 'flex-end',
        backdropFilter: 'blur(2px)',
        animation: 'fade-in 160ms ease-out',
      }}
      onClick={() => setOpen(false)}
    >
      <style>{`
        @keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slide-up { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          height: '78%',
          background: t.bg,
          borderTopLeftRadius: 20, borderTopRightRadius: 20,
          display: 'flex', flexDirection: 'column',
          animation: 'slide-up 220ms cubic-bezier(.2,.8,.2,1)',
          overflow: 'hidden',
          boxShadow: '0 -12px 40px rgba(20,10,0,0.18)',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 0' }}>
          <div style={{ width: 40, height: 4, background: t.border, borderRadius: 2 }}/>
        </div>

        {/* Header */}
        <div style={{
          padding: '14px 18px 14px',
          borderBottom: `1px solid ${t.borderSoft}`,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ position: 'relative' }}>
            <AvatarSlot t={t} size={40} label="A" />
            <div style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 11, height: 11, borderRadius: '50%',
              background: '#4a8f5f',
              border: `2px solid ${t.bg}`,
            }}/>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 500, color: t.ink, letterSpacing: -0.1 }}>
              Antonio Vazquez, EA
            </div>
            <div style={{ fontSize: 11.5, color: '#4a8f5f', fontFamily: t.mono, letterSpacing: 0.3 }}>
              ● Online · typically replies within an hour
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            style={{
              width: 30, height: 30, borderRadius: '50%',
              border: 'none', background: t.bgElev,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke={t.inkSoft} strokeWidth="1.6" strokeLinecap="round">
              <path d="M3 3l6 6M9 3l-6 6"/>
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div
          ref={scrollerRef}
          style={{
            flex: 1, overflowY: 'auto',
            padding: '20px 18px 12px',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}
        >
          {messages.map((m, i) => (
            <div key={i} style={{
              display: 'flex', flexDirection: 'column',
              alignItems: m.from === 'u' ? 'flex-end' : 'flex-start',
              gap: 3,
            }}>
              <div style={{
                maxWidth: '80%',
                padding: '10px 14px',
                borderRadius: m.from === 'u' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: m.from === 'u' ? t.rust : t.card,
                color: m.from === 'u' ? '#fff' : t.ink,
                border: m.from === 'u' ? 'none' : `1px solid ${t.border}`,
                fontSize: 14, lineHeight: 1.4,
                fontFamily: t.sans,
              }}>
                {m.text}
              </div>
              <div style={{
                fontFamily: t.mono, fontSize: 9.5, color: t.muted, letterSpacing: 0.4,
                padding: '0 4px',
              }}>{m.time}</div>
            </div>
          ))}
        </div>

        {/* Composer */}
        <div style={{
          padding: '12px 14px 18px',
          borderTop: `1px solid ${t.borderSoft}`,
          display: 'flex', alignItems: 'flex-end', gap: 8,
          background: t.bg,
        }}>
          <div style={{
            flex: 1,
            background: t.card,
            border: `1px solid ${t.border}`,
            borderRadius: 20,
            padding: '8px 14px',
            display: 'flex', alignItems: 'center',
          }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
              placeholder="Type your question…"
              style={{
                flex: 1, border: 'none', outline: 'none',
                background: 'transparent',
                fontSize: 14, fontFamily: t.sans,
                color: t.ink,
              }}
            />
          </div>
          <button
            onClick={send}
            disabled={!input.trim()}
            style={{
              width: 38, height: 38, borderRadius: '50%',
              background: input.trim() ? t.rust : t.border,
              border: 'none', cursor: input.trim() ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 120ms',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 8l10-5-5 10-1.5-4.5L3 8z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Income source icon set ────────────────────────────────────
function IncomeIcon({ t, kind }) {
  const s = { width: 20, height: 20, stroke: t.rustInk, strokeWidth: 1.4, fill: 'none' };
  const map = {
    w2: <svg {...s} viewBox="0 0 20 20"><rect x="3" y="5" width="14" height="11" rx="1.5" strokeLinejoin="round"/><path d="M3 9h14M7 5V3h6v2" strokeLinecap="round"/></svg>,
    self: <svg {...s} viewBox="0 0 20 20"><path d="M3 6h14v11H3zM3 6l3-3h8l3 3" strokeLinejoin="round"/><path d="M8 10h4" strokeLinecap="round"/></svg>,
    rental: <svg {...s} viewBox="0 0 20 20"><path d="M3 10l7-6 7 6v7H3z" strokeLinejoin="round"/><path d="M8 17v-4h4v4" /></svg>,
    invest: <svg {...s} viewBox="0 0 20 20"><path d="M3 15l4-4 3 2 7-8" strokeLinejoin="round" strokeLinecap="round"/><path d="M13 5h4v4" strokeLinecap="round"/></svg>,
    retire: <svg {...s} viewBox="0 0 20 20"><circle cx="10" cy="10" r="7"/><path d="M10 6v4l3 2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  };
  return map[kind] || null;
}

function ScreenIncomeSources({ t, onNext, onBack }) {
  const [sel, setSel] = React.useState(new Set());
  const toggle = (id) => {
    const n = new Set(sel); n.has(id) ? n.delete(id) : n.add(id);
    setSel(n);
  };
  const options = [
    { id: 'w2', name: 'W-2 Employee', sub: 'Regular paycheck from an employer', icon: 'w2' },
    { id: 'self', name: 'Self-Employed / 1099', sub: 'Freelance, gig work, contracting', icon: 'self' },
    { id: 'rental', name: 'Rental Property', sub: 'Income from property you own', icon: 'rental' },
    { id: 'invest', name: 'Investments / Crypto', sub: 'Stocks, crypto, capital gains', icon: 'invest' },
    { id: 'retire', name: 'Retirement / Social Security', sub: 'Pension, IRA distributions, SSA', icon: 'retire' },
  ];
  const canContinue = sel.size > 0;

  return (
    <Screen t={t}>
      <div style={{ padding: '24px 0 0', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <IntakeHeader t={t} step={7} label="Income" />
        <div style={{ padding: '32px 24px 8px' }}>
          <Row gap={10} align="center" style={{ marginBottom: 18 }}>
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
          </Row>
          <Stack gap={10}>
            <H1 t={t}>How do you earn income?</H1>
            <Body t={t} size={15}>Select all that apply.</Body>
          </Stack>
        </div>

        <Stack gap={10} style={{ padding: '20px 24px 16px', flex: 1 }}>
          {options.map(o => {
            const on = sel.has(o.id);
            return (
              <Card key={o.id} t={t} onClick={() => toggle(o.id)} selected={on} tinted={on}
                    style={{ padding: '14px 16px' }}>
                <Row gap={14} align="center">
                  <div style={{
                    width: 40, height: 40, borderRadius: t.tone === 'magazine' ? 4 : 10,
                    background: on ? t.rustSoft : t.bgElev,
                    border: `1px solid ${on ? t.rust : t.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <IncomeIcon t={t} kind={o.icon} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 500, color: t.ink, marginBottom: 2 }}>{o.name}</div>
                    <div style={{ fontSize: 12, color: t.muted, lineHeight: 1.4 }}>{o.sub}</div>
                  </div>
                  <div style={{
                    width: 22, height: 22, borderRadius: 5,
                    border: `1.5px solid ${on ? t.rust : t.border}`,
                    background: on ? t.rust : 'transparent',
                    flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {on && (
                      <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                        <path d="M1 4.5l2.8 2.8L10 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                </Row>
              </Card>
            );
          })}

          <div style={{ marginTop: 8 }}>
            <AntonioNote t={t}>
              Don't overthink this. If you got paid for it, select it. I'll sort out the forms.
            </AntonioNote>
          </div>
        </Stack>

        {/* Persistent Ask Antonio bar + bottom nav */}
        <div style={{
          position: 'sticky', bottom: 0,
          background: `linear-gradient(to top, ${t.bg} 75%, transparent)`,
          padding: '18px 24px 28px',
        }}>
          <div style={{ marginBottom: 12 }}>
            <AskAntonioBar t={t} onMessage={() => {}} />
          </div>
          <Row gap={10}>
            <Button t={t} variant="ghost" onClick={onBack} style={{ flex: '0 0 auto' }}>Back</Button>
            <Button t={t} onClick={onNext} style={{ flex: 1 }} disabled={!canContinue}>Continue</Button>
          </Row>
        </div>
      </div>
    </Screen>
  );
}

Object.assign(window, {
  ScreenLogin, ScreenOTP, ScreenWelcome, ScreenFilingStatus, ScreenServices, ScreenServicePath, ScreenServiceAddons,
  ScreenEngagement, ScreenConsent7216, ScreenDone,
  ScreenIncomeSources, AskAntonioBar, AskAntonioChat,
  IntakeHeader, AntonioNote, BottomBar, Footer, SignaturePad,
  HandCheckmark,
});

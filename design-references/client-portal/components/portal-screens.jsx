// Portal screens 7–10: Home, Documents, Messages, Signatures

// ─── Shared: Bottom Tab Bar ─────────────────────────────────────
function TabBar({ t, active, onTab }) {
  const tabs = [
    { id: 'home', label: 'Home', dot: false },
    { id: 'docs', label: 'Docs', dot: true },
    { id: 'msgs', label: 'Messages', dot: true },
    { id: 'sign', label: 'Sign', dot: false },
    { id: 'profile', label: 'Profile', dot: false },
  ];
  const icon = (id, on) => {
    const s = { width: 22, height: 22, fill: 'none', stroke: on ? t.rust : t.muted, strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' };
    switch (id) {
      case 'home': return <svg {...s} viewBox="0 0 22 22"><path d="M3 10l8-7 8 7v9a1 1 0 01-1 1h-4v-6H8v6H4a1 1 0 01-1-1z"/></svg>;
      case 'docs': return <svg {...s} viewBox="0 0 22 22"><path d="M6 2h7l4 4v13a1 1 0 01-1 1H6a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M13 2v4h4M8 11h7M8 15h5"/></svg>;
      case 'msgs': return <svg {...s} viewBox="0 0 22 22"><path d="M3 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2h-6l-4 3v-3H5a2 2 0 01-2-2z"/></svg>;
      case 'sign': return <svg {...s} viewBox="0 0 22 22"><path d="M3 17l4-1 10-10-3-3L4 13l-1 4z"/><path d="M12 5l3 3"/></svg>;
      case 'profile': return <svg {...s} viewBox="0 0 22 22"><circle cx="11" cy="8" r="4"/><path d="M3 20c1-4 5-6 8-6s7 2 8 6"/></svg>;
    }
  };
  return (
    <div style={{
      position: 'sticky', bottom: 0,
      background: t.bgElev,
      borderTop: `1px solid ${t.border}`,
      padding: '10px 8px 24px',
      display: 'flex', justifyContent: 'space-around',
      zIndex: 10,
    }}>
      {tabs.map(tab => {
        const on = active === tab.id;
        return (
          <button key={tab.id} onClick={() => onTab && onTab(tab.id)} style={{
            background: 'none', border: 'none', padding: '6px 10px',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 4, cursor: 'pointer', position: 'relative',
            fontFamily: t.sans,
          }}>
            <div style={{ position: 'relative' }}>
              {icon(tab.id, on)}
              {tab.dot && (
                <div style={{
                  position: 'absolute', top: -1, right: -3,
                  width: 7, height: 7, borderRadius: '50%',
                  background: t.rust, border: `1.5px solid ${t.bgElev}`,
                }}/>
              )}
            </div>
            <div style={{
              fontSize: 10,
              color: on ? t.ink : t.muted,
              fontWeight: on ? 500 : 400,
              letterSpacing: 0.2,
            }}>{tab.label}</div>
          </button>
        );
      })}
    </div>
  );
}

function Wordmark({ t }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: 22, height: 22, borderRadius: '50%',
        background: `radial-gradient(circle at 30% 30%, ${t.rustSoft}, ${t.card})`,
        border: `1px solid ${t.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: t.serif, fontSize: 12, color: t.rustInk,
      }}>V</div>
      <span style={{
        fontFamily: t.serif, fontSize: 14, letterSpacing: -0.2, color: t.ink,
      }}>Vazant Consulting</span>
    </div>
  );
}

// ─── 7. Home Tab ────────────────────────────────────────────────
function ScreenHome({ t, onTab, paid, signed8879, onPay, onSign8879 }) {
  const needsPayment = !paid;
  const needsSign = paid && !signed8879;
  const allDone = paid && signed8879;

  return (
    <Screen t={t}>
      <div style={{ padding: '16px 20px 8px', borderBottom: `1px solid ${t.borderSoft}` }}>
        <Row justify="space-between">
          <Wordmark t={t} />
          <div style={{ fontFamily: t.mono, fontSize: 10, color: t.muted, letterSpacing: 1 }}>
            CLIENT PORTAL
          </div>
        </Row>
      </div>

      <div style={{ padding: '24px 20px 24px' }}>
        <Stack gap={20}>
          {/* Greeting */}
          <Stack gap={4}>
            <H1 t={t} style={{ fontSize: 30 }}>Good afternoon, Maria</H1>
            <Body t={t} size={14} muted>
              Tuesday, April 14
            </Body>
          </Stack>

          {/* Hero status card */}
          <div style={{
            background: t.card,
            border: `1px solid ${t.border}`,
            borderRadius: t.radiusLg,
            padding: 22,
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: -30, right: -30,
              width: 120, height: 120, borderRadius: '50%',
              background: allDone ? 'rgba(74, 143, 95, 0.15)' : t.tintAccent,
              opacity: 0.8,
            }}/>
            <div style={{ position: 'relative' }}>
              <div style={{
                display: 'inline-flex', padding: '4px 10px',
                background: allDone ? 'rgba(74, 143, 95, 0.15)' : t.tintAccentStrong, borderRadius: 999,
                fontFamily: t.mono, fontSize: 10,
                color: allDone ? '#2e6b42' : t.rustInk,
                letterSpacing: 1, marginBottom: 14,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: allDone ? '#4a8f5f' : t.rust, marginRight: 6, alignSelf: 'center' }}/>
                {allDone ? 'FILED WITH IRS' : 'ACTION NEEDED'}
              </div>
              <H2 t={t} style={{ marginBottom: 10 }}>
                {allDone
                  ? "Your 2024 return has been filed"
                  : "Your return is ready for your review"}
              </H2>
              <Body t={t} size={14} style={{ marginBottom: 12 }}>
                {allDone
                  ? "Antonio transmitted your return to the IRS. You'll get a confirmation within 3–5 business days. Refund is on its way."
                  : "Antonio prepared your 2024 return. Once you pay the remaining balance and sign Form 8879, it will be filed with the IRS."}
              </Body>
              <div style={{
                fontFamily: t.mono, fontSize: 11, color: t.muted,
                letterSpacing: 0.3, paddingTop: 10, borderTop: `1px solid ${t.borderSoft}`,
              }}>
                {allDone
                  ? 'Filed Apr 14 · Awaiting IRS acknowledgement'
                  : 'Estimated processing: 3–5 business days after filing'}
              </div>
            </div>
          </div>

          {/* Pay balance */}
          <Card t={t} style={{ padding: 18 }}>
            <Row justify="space-between" align="flex-start" style={{ marginBottom: 14 }}>
              <div>
                <Eyebrow t={t} style={{ marginBottom: 4 }}>
                  {paid ? 'Balance' : 'Balance due'}
                </Eyebrow>
                <div style={{
                  fontFamily: t.serif, fontSize: 32,
                  color: paid ? t.muted : t.ink,
                  textDecoration: paid ? 'line-through' : 'none',
                  letterSpacing: -0.8, lineHeight: 1,
                }}>
                  $250
                </div>
                <div style={{ fontSize: 12, color: t.muted, marginTop: 4, fontFamily: t.mono }}>
                  {paid ? 'Paid in full · $500 total' : 'of $500 total · $250 deposit paid'}
                </div>
              </div>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: paid ? 'rgba(74, 143, 95, 0.15)' : t.bgElev,
                border: `1px solid ${paid ? 'rgba(74, 143, 95, 0.3)' : t.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {paid ? (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M5 11l4 4 8-9" stroke="#4a8f5f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="6" width="18" height="13" rx="2" stroke={t.rustInk} strokeWidth="1.5"/>
                    <path d="M3 10h18" stroke={t.rustInk} strokeWidth="1.5"/>
                  </svg>
                )}
              </div>
            </Row>
            {!paid && (
              <Button t={t} onClick={onPay} style={{ width: '100%' }}>Pay remaining balance</Button>
            )}
            {paid && (
              <div style={{
                fontFamily: t.mono, fontSize: 10, color: t.muted, letterSpacing: 1,
                paddingTop: 10, borderTop: `1px solid ${t.borderSoft}`,
              }}>
                ● PAID APR 14 · VISA ···· 4242
              </div>
            )}
          </Card>

          {/* Sign 8879 — locked until paid, tappable when unlocked, check when signed */}
          <Card
            t={t}
            onClick={needsSign ? onSign8879 : undefined}
            style={{
              padding: 16,
              background: signed8879 ? t.card : (needsSign ? t.card : t.bgElev),
              opacity: needsPayment ? 0.7 : 1,
              border: `1px solid ${needsSign ? t.rust : t.border}`,
              cursor: needsSign ? 'pointer' : 'default',
            }}
          >
            <Row gap={14} align="center">
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: signed8879
                  ? 'rgba(74, 143, 95, 0.15)'
                  : (needsSign ? t.tintAccent : t.borderSoft),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {signed8879 ? (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M4 9l3 3 7-7" stroke="#4a8f5f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : needsSign ? (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M3 14c3-4 6-2 8-4M11 10l3-5 2 2-5 3" stroke={t.rustInk} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <rect x="4" y="8" width="10" height="7" rx="1" stroke={t.muted} strokeWidth="1.5"/>
                    <path d="M6 8V5a3 3 0 016 0v3" stroke={t.muted} strokeWidth="1.5"/>
                  </svg>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 15,
                  color: signed8879 || needsSign ? t.ink : t.inkSoft,
                  fontWeight: 500,
                }}>
                  {signed8879 ? 'Form 8879 — signed' : 'Sign Form 8879'}
                </div>
                <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>
                  {signed8879
                    ? 'Signed Apr 14 · 2:38 PM PT'
                    : (needsSign ? 'Ready to sign · E-file authorization' : 'Available after payment')}
                </div>
              </div>
              {needsSign && (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={t.rust} strokeWidth="1.5">
                  <path d="M5 3l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </Row>
          </Card>

          {/* Appointment */}
          <Card t={t} style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px 10px', borderBottom: `1px solid ${t.borderSoft}` }}>
              <Row justify="space-between">
                <Eyebrow t={t}>Upcoming appointment</Eyebrow>
                <div style={{ fontFamily: t.mono, fontSize: 10, color: t.green }}>● CONFIRMED</div>
              </Row>
            </div>
            <div style={{ padding: 18 }}>
              <Row gap={16} align="flex-start">
                <div style={{
                  textAlign: 'center', flexShrink: 0,
                  background: t.bgElev, border: `1px solid ${t.border}`,
                  borderRadius: t.radius, padding: '8px 12px', minWidth: 56,
                }}>
                  <div style={{ fontFamily: t.mono, fontSize: 10, color: t.rust, letterSpacing: 1 }}>APR</div>
                  <div style={{ fontFamily: t.serif, fontSize: 22, color: t.ink, lineHeight: 1 }}>09</div>
                  <div style={{ fontSize: 10, color: t.muted, marginTop: 2 }}>Wed</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, color: t.ink, fontWeight: 500 }}>3:00 PM PT</div>
                  <div style={{ fontSize: 13, color: t.muted, marginTop: 2 }}>Google Meet · 45 min review</div>
                </div>
              </Row>
              <Row gap={6} style={{ marginTop: 14, flexWrap: 'wrap' }}>
                <Button t={t} variant="ghost" style={{ padding: '8px 12px', fontSize: 12 }}>Join</Button>
                <Button t={t} variant="ghost" style={{ padding: '8px 12px', fontSize: 12 }}>Add to calendar</Button>
                <Button t={t} variant="ghost" style={{ padding: '8px 12px', fontSize: 12 }}>Reschedule</Button>
              </Row>
            </div>
          </Card>

          {/* Progress tracker */}
          <div>
            <Row justify="space-between" style={{ marginBottom: 16 }}>
              <Eyebrow t={t}>Your return</Eyebrow>
              <div style={{ fontFamily: t.mono, fontSize: 11, color: t.muted }}>5 of 7</div>
            </Row>
            <div style={{
              background: t.card, border: `1px solid ${t.border}`,
              borderRadius: t.radiusLg, padding: '18px 20px',
            }}>
              {[
                { t: 'Intake submitted', d: 'Jan 14', done: true },
                { t: 'Documents uploaded', d: 'Feb 3', done: true },
                { t: 'Review call with Antonio', d: 'Feb 18', done: true },
                { t: 'Return prepared', d: 'Mar 28', done: true },
                { t: 'Pay & sign', d: 'Current step', done: false, current: true },
                { t: 'E-filed with IRS', d: 'Pending', done: false },
                { t: 'Filing accepted', d: 'Pending', done: false, last: true },
              ].map((s, i, arr) => (
                <Row key={i} gap={14} align="flex-start">
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: s.done ? t.green : (s.current ? t.rust : 'transparent'),
                      border: `1.5px solid ${s.done ? t.green : (s.current ? t.rust : t.border)}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      position: 'relative',
                      boxShadow: s.current ? `0 0 0 4px ${t.tintAccentStrong}` : 'none',
                    }}>
                      {s.done && <svg width="12" height="10" viewBox="0 0 12 10"><path d="M1 5l3.5 3.5L11 1" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      {s.current && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }}/>}
                    </div>
                    {i < arr.length - 1 && (
                      <div style={{
                        width: 1.5, flex: 1,
                        background: s.done ? t.green : t.border,
                        minHeight: 28, margin: '3px 0',
                      }}/>
                    )}
                  </div>
                  <div style={{ paddingBottom: i < arr.length - 1 ? 16 : 0, flex: 1 }}>
                    <div style={{
                      fontSize: 14,
                      color: s.current ? t.ink : (s.done ? t.inkSoft : t.muted),
                      fontWeight: s.current ? 500 : 400,
                    }}>{s.t}</div>
                    <div style={{
                      fontSize: 11, color: t.muted, marginTop: 2,
                      fontFamily: t.mono, letterSpacing: 0.3,
                    }}>{s.d}</div>
                  </div>
                </Row>
              ))}
            </div>
          </div>

          {/* Antonio's message */}
          <Card t={t} style={{ padding: 18 }}>
            <Row gap={12} style={{ marginBottom: 12 }}>
              <AvatarSlot t={t} size={40} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: t.ink, fontWeight: 500 }}>Antonio Vazquez</div>
                <div style={{ fontFamily: t.mono, fontSize: 10, color: t.muted, marginTop: 2, letterSpacing: 0.3 }}>
                  YESTERDAY · 4:32 PM
                </div>
              </div>
            </Row>
            <div style={{
              fontFamily: t.serif, fontSize: 15, color: t.inkSoft,
              lineHeight: 1.55, fontStyle: 'italic',
            }}>
              "Hi Maria — your return looks good. Refund estimate is in line with last year. Once you pay the balance, I'll send the 8879 for your signature and file the same day. Any questions, text me."
            </div>
          </Card>
        </Stack>
      </div>

      <TabBar t={t} active="home" onTab={onTab} />
    </Screen>
  );
}

// ─── 8. Documents Tab ───────────────────────────────────────────

// Document catalog — plain-language descriptions, examples, and where to find them.
// Antonio's voice — conversational, no jargon-first.
const DOC_INFO = {
  'W-2 (Acme Inc)': {
    type: 'W-2 · Wage & tax statement',
    what: "Your wage and tax statement from your employer. Shows your total earnings, the federal and state taxes already withheld, plus any retirement or health benefits.",
    example: 'Multi-box form with your name, your employer\'s EIN, and numbered boxes 1–20 showing wages, withholding, and benefits.',
    where: 'Your employer mails it (and usually emails a PDF) by January 31. Check your email or payroll portal — ADP, Gusto, Workday, etc.',
    tip: "One per employer. If you switched jobs in 2024, you should have two.",
  },
  '1099-NEC (Freelance)': {
    type: '1099-NEC · Non-employee compensation',
    what: "Shows income paid to you as a contractor or freelancer. You get one from each client who paid you $600 or more during the year.",
    example: "Single-page form with the payer's name at top, your name and SSN below, and one box showing non-employee compensation.",
    where: "Each client sends one — paper or electronic — by January 31. Chase your inbox, or log into platforms like Upwork, Fiverr.",
    tip: "Even if you don't receive the form, the income still needs to be reported.",
  },
  '1099-K (Stripe)': {
    type: '1099-K · Payment card transactions',
    what: "Reports gross payments processed through third-party networks like Stripe, PayPal, Venmo, Square, or Etsy. It's the full amount collected, before fees.",
    example: "Form with the payment processor at top, monthly breakdown of gross transactions, and total for the year.",
    where: "Log into your Stripe / PayPal dashboard under Tax documents. They're usually available by January 31.",
    tip: "The number is before fees and refunds — Antonio will reconcile it against your actual revenue.",
  },
  '1099-INT (Chase)': {
    type: '1099-INT · Interest income',
    what: "Interest earned on bank accounts, CDs, or savings. Even small amounts count.",
    example: "Short form showing your bank, your account type, and interest earned (Box 1). Often just a few dollars.",
    where: "Your bank's online tax forms section. Chase, BoA, Ally, etc. all post them by late January.",
    tip: "Banks only send a 1099-INT if you earned $10+ in interest, but you should report all of it regardless.",
  },
  'Revenue summary 2024': {
    type: 'Revenue summary',
    what: "A year-end breakdown of all business income. Totals only — Antonio will reconcile against your 1099s and bank statements.",
    example: "One page, month-by-month or by-client, showing gross receipts. Can be a spreadsheet, a QuickBooks report, or a PDF.",
    where: "Export from QuickBooks, Wave, Xero, or your bookkeeping spreadsheet. Look for \"Profit & Loss\" or \"Income Statement.\"",
    tip: "Don't stress about categorization yet — just the totals are fine here.",
  },
  'Expense receipts': {
    type: 'Expense receipts',
    what: "Anything you paid for that was for the business — supplies, software, travel, client meals, phone bills, etc.",
    example: "Individual receipts (PDFs or photos) or a single summary spreadsheet with vendor, date, amount, and category.",
    where: "Email searches for \"receipt\" often surface more than you\u2019d expect. Also check your credit card statements.",
    tip: "A summary spreadsheet is faster than dozens of individual files — you don't need to upload each one.",
  },
  "Driver's license": {
    type: "Driver's license · Photo ID",
    what: "Photo ID required for identity verification. An IRS requirement for preparers as of 2024.",
    example: "A clear photo of the front of your license — both corners visible, readable number and expiration.",
    where: 'Use your phone camera — lay it flat on a dark surface in good light. Back of the license is not needed.',
    tip: 'Passport or state ID works too if that\'s easier.',
  },
  'Engagement letter': {
    type: 'Engagement letter',
    what: "Our formal agreement covering the scope of services, fees, and responsibilities — yours and mine.",
    example: "Five-paragraph legal document. You signed one during intake; this is the record of it.",
    where: "Already signed and on file. You can re-read it any time from this portal.",
    tip: null,
  },
  '§7216 consent': {
    type: '§7216 consent · Disclosure form',
    what: "A consent form the IRS requires before I can share specific pieces of your return with anyone else (lenders, other advisors, etc.). Without it, I cannot disclose anything.",
    example: "Short two-paragraph form listing what I can share and with whom. You choose — nothing is shared by default.",
    where: 'Awaiting your signature — tap the Sign tab below when you\'re ready.',
    tip: 'Optional but useful if a mortgage lender will need your return.',
  },
};

function DocRow({ t, name, date, status, extracted, onPreview, onInfo, onDownload }) {
  const uploaded = status === 'uploaded';
  const pending = status === 'pending';
  return (
    <div
      onClick={uploaded ? onPreview : onInfo}
      style={{
        padding: '12px 4px',
        borderBottom: `1px solid ${t.borderSoft}`,
        display: 'flex', alignItems: 'center', gap: 12,
        cursor: 'pointer',
      }}>
      {/* Thumbnail / placeholder */}
      <div style={{
        width: 32, height: 40, flexShrink: 0,
        borderRadius: 4,
        background: uploaded ? t.bgElev : 'transparent',
        border: `1px ${uploaded ? 'solid' : 'dashed'} ${t.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 1h6l3 3v8a1 1 0 01-1 1H3a1 1 0 01-1-1V2a1 1 0 011-1z"
                stroke={uploaded ? t.rustInk : t.muted} strokeWidth="1.2"/>
          <path d="M9 1v3h3" stroke={uploaded ? t.rustInk : t.muted} strokeWidth="1.2"/>
        </svg>
      </div>

      {/* Name + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, color: t.ink, fontWeight: 500 }}>{name}</div>
        <Row gap={6} style={{ marginTop: 3 }}>
          <div style={{
            fontSize: 11, color: t.muted, letterSpacing: 0.3,
          }}>{date}</div>
          {extracted && (
            <>
              <span style={{ color: t.muted, fontSize: 11 }}>·</span>
              <div style={{
                fontSize: 11, color: t.green, letterSpacing: 0.3,
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: t.green }}/>
                AI read
              </div>
            </>
          )}
        </Row>
      </div>

      {/* Actions column */}
      <Row gap={4}>
        {/* Info button — always available */}
        <button
          onClick={(e) => { e.stopPropagation(); onInfo && onInfo(); }}
          title="What is this?"
          style={{
            width: 32, height: 32, padding: 0,
            background: 'none', border: 'none', borderRadius: 999,
            cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="7" stroke={t.muted} strokeWidth="1.3" />
            <path d="M9 8v4" stroke={t.muted} strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="9" cy="5.5" r="0.9" fill={t.muted}/>
          </svg>
        </button>

        {/* Download button — uploaded only */}
        {uploaded && (
          <button
            onClick={(e) => { e.stopPropagation(); onDownload && onDownload(); }}
            title="Download"
            style={{
              width: 32, height: 32, padding: 0,
              background: 'none', border: 'none', borderRadius: 999,
              cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 3v9M5 8l4 4 4-4M3 15h12" stroke={t.rustInk} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}

        {/* Status pip — uploaded check */}
        {uploaded && (
          <div style={{ paddingLeft: 2, display: 'flex', alignItems: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16">
              <circle cx="8" cy="8" r="7" fill={t.green}/>
              <path d="M4.5 8l2.5 2.5L11.5 6" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}

        {/* Pending = subtle label, no "Request info" button anymore */}
        {pending && (
          <div style={{
            padding: '5px 10px',
            border: `1px solid ${t.border}`,
            borderRadius: 999,
            fontSize: 11, color: t.muted,
          }}>Needed</div>
        )}
      </Row>
    </div>
  );
}

function DocGroup({ t, label, count, total, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <Row justify="space-between" style={{ marginBottom: 8, padding: '0 4px' }}>
        <div style={{ fontSize: 13, color: t.ink, fontWeight: 500 }}>{label}</div>
        <div style={{ fontFamily: t.mono, fontSize: 11, color: t.muted }}>
          {count} of {total}
        </div>
      </Row>
      <div style={{
        background: t.card, border: `1px solid ${t.border}`,
        borderRadius: t.radius, padding: '4px 16px',
      }}>
        {children}
      </div>
    </div>
  );
}

// ─── Shared modal backdrop for doc dialogs ──────────────────────
function DocModal({ t, onClose, children, size = 'auto' }) {
  // Blocks scroll on the phone by covering it with a full overlay.
  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute', inset: 0,
        background: 'rgba(20, 16, 12, 0.38)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: size === 'full' ? 'stretch' : 'flex-end',
        justifyContent: 'center',
        zIndex: 50,
      }}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: t.bg,
          borderTopLeftRadius: size === 'full' ? 0 : 24,
          borderTopRightRadius: size === 'full' ? 0 : 24,
          width: '100%',
          maxHeight: size === 'full' ? '100%' : '92%',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 -8px 40px rgba(20,16,12,0.25)',
          animation: 'docModalIn 220ms cubic-bezier(0.22, 0.61, 0.36, 1)',
        }}>
        {children}
        <style>{`
          @keyframes docModalIn {
            from { transform: translateY(24px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
}

// Small pill for dialog chrome
function CloseButton({ t, onClose }) {
  return (
    <button
      onClick={onClose}
      style={{
        background: t.card, border: `1px solid ${t.border}`,
        borderRadius: 999,
        width: 32, height: 32,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
      }}>
      <svg width="12" height="12" viewBox="0 0 12 12">
        <path d="M2 2l8 8M10 2l-8 8" stroke={t.inkSoft} strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    </button>
  );
}

// ─── DocInfoDialog — "What is this document?" ──────────────────
function DocInfoDialog({ t, doc, onClose, onAskAntonio }) {
  const info = DOC_INFO[doc?.name] || {
    type: doc?.name || 'Document',
    what: 'Details coming soon.',
    example: null,
    where: null,
    tip: null,
  };
  return (
    <DocModal t={t} onClose={onClose}>
      {/* Header */}
      <div style={{
        padding: '18px 20px 14px',
        borderBottom: `1px solid ${t.borderSoft}`,
      }}>
        <Row justify="space-between" align="flex-start" gap={12}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 12, color: t.muted, marginBottom: 4, letterSpacing: 0.3,
            }}>What is this?</div>
            <div style={{
              fontFamily: t.serif, fontSize: 22, lineHeight: 1.15,
              color: t.ink, letterSpacing: -0.4, textWrap: 'pretty',
            }}>{info.type}</div>
          </div>
          <CloseButton t={t} onClose={onClose} />
        </Row>
      </div>

      {/* Scrollable body */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '18px 20px 20px',
      }}>
        <Stack gap={18}>
          {/* What it is */}
          <div style={{
            fontSize: 15, color: t.inkSoft, lineHeight: 1.5,
            textWrap: 'pretty',
          }}>{info.what}</div>

          {/* Example */}
          {info.example && (
            <div>
              <div style={{ fontSize: 12, color: t.muted, marginBottom: 8, letterSpacing: 0.3 }}>What it looks like</div>
              <div style={{
                background: t.card, border: `1px solid ${t.border}`, borderRadius: t.radius,
                overflow: 'hidden',
              }}>
                {/* Visual example placeholder with form-like lines */}
                <div style={{
                  padding: '18px 16px',
                  background: t.bgElev,
                  borderBottom: `1px solid ${t.borderSoft}`,
                }}>
                  <DocExampleSketch t={t} kind={doc?.name} />
                </div>
                <div style={{
                  padding: '12px 14px',
                  fontSize: 13, color: t.inkSoft, lineHeight: 1.45,
                }}>{info.example}</div>
              </div>
            </div>
          )}

          {/* Where to find */}
          {info.where && (
            <div>
              <div style={{ fontSize: 12, color: t.muted, marginBottom: 6, letterSpacing: 0.3 }}>Where to find it</div>
              <div style={{
                fontSize: 14, color: t.inkSoft, lineHeight: 1.5,
                textWrap: 'pretty',
              }}>{info.where}</div>
            </div>
          )}

          {/* Tip */}
          {info.tip && (
            <div style={{
              padding: '12px 14px',
              background: t.rustSoft,
              borderRadius: t.radius,
              fontSize: 13.5, color: t.rustInk, lineHeight: 1.5,
              fontFamily: t.serif, fontStyle: 'italic',
            }}>
              {info.tip}
            </div>
          )}
        </Stack>
      </div>

      {/* Footer — Ask Antonio as the final escape hatch */}
      <div style={{
        padding: '14px 20px 22px',
        borderTop: `1px solid ${t.borderSoft}`,
        background: t.bgElev,
      }}>
        <Row justify="space-between" align="center" gap={12}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, color: t.inkSoft, lineHeight: 1.35 }}>
              Still have questions?
            </div>
            <div style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>
              Antonio typically replies within a few hours.
            </div>
          </div>
          <button
            onClick={() => { onClose(); onAskAntonio && onAskAntonio(); }}
            style={{
              background: 'none',
              border: `1px solid ${t.rust}`,
              color: t.rustInk,
              borderRadius: 999,
              padding: '8px 14px',
              fontSize: 13, fontWeight: 500,
              fontFamily: t.sans,
              cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              whiteSpace: 'nowrap',
            }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M1 3.5a1 1 0 011-1h9a1 1 0 011 1v5a1 1 0 01-1 1H5.5L2.5 11.5V9.5H2a1 1 0 01-1-1z"
                    stroke={t.rustInk} strokeWidth="1.2" strokeLinejoin="round"/>
            </svg>
            Ask Antonio
          </button>
        </Row>
      </div>
    </DocModal>
  );
}

// ─── Visual example sketch — minimal form-field drawing per doc type ──
function DocExampleSketch({ t, kind }) {
  // Shared line styles
  const L = { stroke: t.border, strokeWidth: 1 };
  const Lh = { stroke: t.inkSoft, strokeWidth: 1.2, opacity: 0.3 };

  if (kind && kind.startsWith('W-2')) {
    return (
      <svg width="100%" height="120" viewBox="0 0 240 120" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
        <rect x="1" y="1" width="238" height="118" fill={t.card} stroke={t.border}/>
        {/* Header strip */}
        <rect x="1" y="1" width="238" height="18" fill={t.bgElev} stroke={t.border}/>
        <text x="10" y="13" fontFamily={t.sans} fontSize="8" fill={t.inkSoft}>FORM  W-2  ·  Wage and Tax Statement  ·  2024</text>
        {/* Grid of boxes */}
        {[0,1,2,3].map(c => [0,1,2].map(r => (
          <rect key={`${c}-${r}`} x={10 + c*55} y={26 + r*28} width="50" height="24" fill="none" {...L} />
        )))}
        {/* Filled numbers suggestion */}
        <line x1="18" y1="38" x2="52" y2="38" {...Lh}/>
        <line x1="73" y1="38" x2="107" y2="38" {...Lh}/>
        <line x1="128" y1="38" x2="162" y2="38" {...Lh}/>
        <line x1="18" y1="66" x2="52" y2="66" {...Lh}/>
        <line x1="73" y1="66" x2="107" y2="66" {...Lh}/>
        {/* Right column: employer info */}
        <rect x="175" y="26" width="55" height="52" fill="none" {...L}/>
        <line x1="180" y1="36" x2="222" y2="36" {...Lh}/>
        <line x1="180" y1="45" x2="222" y2="45" {...Lh}/>
        <line x1="180" y1="54" x2="210" y2="54" {...Lh}/>
      </svg>
    );
  }
  if (kind && kind.startsWith('1099-NEC')) {
    return (
      <svg width="100%" height="120" viewBox="0 0 240 120" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
        <rect x="1" y="1" width="238" height="118" fill={t.card} stroke={t.border}/>
        <rect x="1" y="1" width="238" height="18" fill={t.bgElev} stroke={t.border}/>
        <text x="10" y="13" fontFamily={t.sans} fontSize="8" fill={t.inkSoft}>FORM  1099-NEC  ·  Nonemployee Compensation  ·  2024</text>
        {/* Payer box */}
        <rect x="10" y="26" width="100" height="40" fill="none" {...L}/>
        <line x1="16" y1="36" x2="100" y2="36" {...Lh}/>
        <line x1="16" y1="46" x2="100" y2="46" {...Lh}/>
        <line x1="16" y1="56" x2="80" y2="56" {...Lh}/>
        {/* Recipient box */}
        <rect x="10" y="72" width="100" height="34" fill="none" {...L}/>
        <line x1="16" y1="82" x2="100" y2="82" {...Lh}/>
        <line x1="16" y1="92" x2="90" y2="92" {...Lh}/>
        {/* Compensation box — emphasized */}
        <rect x="125" y="26" width="105" height="52" fill={t.rustSoft} stroke={t.rust}/>
        <text x="132" y="36" fontFamily={t.sans} fontSize="7" fill={t.rustInk}>1  Nonemployee compensation</text>
        <text x="132" y="60" fontFamily={t.serif} fontSize="16" fontWeight="500" fill={t.ink}>$ 18,400.00</text>
        {/* Misc boxes */}
        <rect x="125" y="84" width="50" height="22" fill="none" {...L}/>
        <rect x="180" y="84" width="50" height="22" fill="none" {...L}/>
      </svg>
    );
  }
  if (kind && kind.startsWith('1099-K')) {
    return (
      <svg width="100%" height="120" viewBox="0 0 240 120" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
        <rect x="1" y="1" width="238" height="118" fill={t.card} stroke={t.border}/>
        <rect x="1" y="1" width="238" height="18" fill={t.bgElev} stroke={t.border}/>
        <text x="10" y="13" fontFamily={t.sans} fontSize="8" fill={t.inkSoft}>FORM  1099-K  ·  Payment Card &amp; Third Party Network</text>
        {/* Total row */}
        <rect x="10" y="26" width="220" height="22" fill={t.rustSoft} stroke={t.rust}/>
        <text x="16" y="34" fontFamily={t.sans} fontSize="7" fill={t.rustInk}>1a  Gross amount of payment card transactions</text>
        <text x="180" y="42" fontFamily={t.serif} fontSize="13" fontWeight="500" fill={t.ink}>$ 42,180</text>
        {/* Monthly bars */}
        {Array.from({length: 12}).map((_, i) => {
          const h = 10 + ((i * 7) % 28);
          return <rect key={i} x={14 + i*18} y={80 - h} width="12" height={h} fill={t.rustInk} opacity="0.35"/>;
        })}
        <line x1="10" y1="82" x2="230" y2="82" stroke={t.border}/>
        {['Jan','','','Apr','','','Jul','','','Oct','',''].map((m, i) => (
          <text key={i} x={20 + i*18} y="94" fontFamily={t.sans} fontSize="6" fill={t.muted} textAnchor="middle">{m}</text>
        ))}
        <text x="10" y="110" fontFamily={t.sans} fontSize="7" fill={t.muted}>Monthly breakdown</text>
      </svg>
    );
  }
  if (kind && kind.startsWith('1099-INT')) {
    return (
      <svg width="100%" height="120" viewBox="0 0 240 120" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
        <rect x="1" y="1" width="238" height="118" fill={t.card} stroke={t.border}/>
        <rect x="1" y="1" width="238" height="18" fill={t.bgElev} stroke={t.border}/>
        <text x="10" y="13" fontFamily={t.sans} fontSize="8" fill={t.inkSoft}>FORM  1099-INT  ·  Interest Income  ·  2024</text>
        <rect x="10" y="26" width="110" height="50" fill="none" {...L}/>
        <line x1="16" y1="36" x2="110" y2="36" {...Lh}/>
        <line x1="16" y1="46" x2="95" y2="46" {...Lh}/>
        <rect x="130" y="26" width="100" height="30" fill={t.rustSoft} stroke={t.rust}/>
        <text x="136" y="36" fontFamily={t.sans} fontSize="7" fill={t.rustInk}>1  Interest income</text>
        <text x="136" y="50" fontFamily={t.serif} fontSize="14" fill={t.ink}>$ 48.12</text>
      </svg>
    );
  }
  if (kind === 'Revenue summary 2024') {
    return (
      <svg width="100%" height="120" viewBox="0 0 240 120" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
        <rect x="1" y="1" width="238" height="118" fill={t.card} stroke={t.border}/>
        <text x="10" y="16" fontFamily={t.serif} fontSize="11" fill={t.ink}>Revenue Summary — 2024</text>
        {/* Rows */}
        {['Jan', 'Feb', 'Mar', 'Apr', 'May'].map((m, i) => (
          <g key={m}>
            <text x="12" y={36 + i*16} fontFamily={t.sans} fontSize="8" fill={t.muted}>{m}</text>
            <line x1="38" y1={34 + i*16} x2="180" y2={34 + i*16} {...Lh}/>
            <text x="195" y={36 + i*16} fontFamily={t.sans} fontSize="8" fill={t.inkSoft} textAnchor="end">${(3400 + i*540).toLocaleString()}</text>
            <text x="225" y={36 + i*16} fontFamily={t.sans} fontSize="8" fill={t.muted}>.00</text>
          </g>
        ))}
        <line x1="10" y1="108" x2="230" y2="108" stroke={t.border}/>
        <text x="12" y="118" fontFamily={t.sans} fontSize="9" fill={t.ink} fontWeight="600">Total</text>
        <text x="225" y="118" fontFamily={t.serif} fontSize="11" fill={t.ink} textAnchor="end">$ 84,210</text>
      </svg>
    );
  }
  if (kind === 'Expense receipts') {
    return (
      <svg width="100%" height="120" viewBox="0 0 240 120" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
        {/* Three overlapping receipt shapes */}
        {[0, 1, 2].map(i => (
          <g key={i} transform={`translate(${30 + i * 60}, ${16 + i * 6}) rotate(${-6 + i * 6}, 40, 50)`}>
            <rect x="0" y="0" width="80" height="88" fill={t.card} stroke={t.border}/>
            <line x1="8" y1="14" x2="72" y2="14" {...Lh}/>
            <line x1="8" y1="26" x2="60" y2="26" {...Lh}/>
            <line x1="8" y1="34" x2="50" y2="34" {...Lh}/>
            <line x1="8" y1="42" x2="66" y2="42" {...Lh}/>
            <line x1="8" y1="50" x2="54" y2="50" {...Lh}/>
            <line x1="8" y1="66" x2="40" y2="66" stroke={t.ink} strokeWidth="1.4"/>
            <line x1="44" y1="66" x2="72" y2="66" stroke={t.ink} strokeWidth="1.4"/>
          </g>
        ))}
      </svg>
    );
  }
  if (kind === "Driver's license") {
    return (
      <svg width="100%" height="120" viewBox="0 0 240 120" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
        <rect x="30" y="12" width="180" height="96" rx="8" fill={t.card} stroke={t.border}/>
        <rect x="40" y="22" width="50" height="60" rx="3" fill={t.bgElev} stroke={t.border}/>
        {/* Face silhouette */}
        <circle cx="65" cy="44" r="10" fill={t.border}/>
        <path d="M48 78c0-10 8-16 17-16s17 6 17 16" fill={t.border}/>
        {/* Text lines */}
        <line x1="100" y1="30" x2="195" y2="30" {...Lh}/>
        <line x1="100" y1="44" x2="170" y2="44" {...Lh}/>
        <line x1="100" y1="54" x2="185" y2="54" {...Lh}/>
        <line x1="100" y1="64" x2="160" y2="64" {...Lh}/>
        <text x="100" y="98" fontFamily={t.sans} fontSize="7" fill={t.muted}>CA DRIVER LICENSE</text>
      </svg>
    );
  }
  // Default: generic form sketch
  return (
    <svg width="100%" height="110" viewBox="0 0 240 110" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
      <rect x="1" y="1" width="238" height="108" fill={t.card} stroke={t.border}/>
      <line x1="12" y1="18" x2="140" y2="18" stroke={t.ink} strokeWidth="1.2"/>
      <line x1="12" y1="34" x2="220" y2="34" {...Lh}/>
      <line x1="12" y1="44" x2="210" y2="44" {...Lh}/>
      <line x1="12" y1="54" x2="220" y2="54" {...Lh}/>
      <line x1="12" y1="64" x2="180" y2="64" {...Lh}/>
      <line x1="12" y1="80" x2="100" y2="80" stroke={t.ink} strokeWidth="1.2"/>
      <line x1="12" y1="94" x2="220" y2="94" {...Lh}/>
    </svg>
  );
}

// ─── DocPreviewDialog — view the actual uploaded document ──────
function DocPreviewDialog({ t, doc, onClose, onInfo, onDownload, onAskAntonio }) {
  return (
    <DocModal t={t} onClose={onClose} size="full">
      {/* Top chrome */}
      <div style={{
        padding: '14px 16px 12px',
        borderBottom: `1px solid ${t.borderSoft}`,
        background: t.bgElev,
      }}>
        <Row justify="space-between" align="center" gap={10}>
          <CloseButton t={t} onClose={onClose} />
          <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: t.muted }}>Preview</div>
            <div style={{
              fontSize: 14, color: t.ink, fontWeight: 500,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{doc?.name}</div>
          </div>
          <button
            onClick={onInfo}
            title="What is this?"
            style={{
              background: t.card, border: `1px solid ${t.border}`,
              borderRadius: 999,
              width: 32, height: 32,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="5.5" stroke={t.inkSoft} strokeWidth="1.3"/>
              <path d="M7 6.2v3.4" stroke={t.inkSoft} strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="7" cy="4" r="0.8" fill={t.inkSoft}/>
            </svg>
          </button>
        </Row>
      </div>

      {/* Doc viewport */}
      <div style={{
        flex: 1, overflowY: 'auto',
        background: '#6E665A',  /* darker surround, like a real PDF reader */
        padding: '24px 16px 24px',
        display: 'flex', justifyContent: 'center',
      }}>
        <div style={{
          width: '100%', maxWidth: 340,
          background: '#fff',
          borderRadius: 4,
          boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
          padding: '18px 14px 22px',
        }}>
          <DocExampleSketch t={t} kind={doc?.name} />
          <div style={{
            marginTop: 14, paddingTop: 12,
            borderTop: `1px solid ${t.borderSoft}`,
            fontSize: 11, color: t.muted,
            textAlign: 'center', letterSpacing: 0.3,
          }}>
            Page 1 of 1 · Uploaded {doc?.date}
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div style={{
        padding: '14px 16px 22px',
        borderTop: `1px solid ${t.borderSoft}`,
        background: t.bg,
      }}>
        <Row gap={10}>
          <button
            onClick={() => { onClose(); onAskAntonio && onAskAntonio(); }}
            style={{
              flex: '0 0 auto',
              background: 'none',
              border: `1px solid ${t.border}`,
              color: t.inkSoft,
              borderRadius: 999,
              padding: '10px 14px',
              fontSize: 13,
              fontFamily: t.sans,
              cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M1 3.5a1 1 0 011-1h9a1 1 0 011 1v5a1 1 0 01-1 1H5.5L2.5 11.5V9.5H2a1 1 0 01-1-1z"
                    stroke={t.inkSoft} strokeWidth="1.2" strokeLinejoin="round"/>
            </svg>
            Ask Antonio
          </button>
          <Button t={t} onClick={onDownload} style={{ flex: 1, padding: '10px 18px' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: 4 }}>
              <path d="M7 2v7M4 6l3 3 3-3M2 12h10" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Download
          </Button>
        </Row>
      </div>
    </DocModal>
  );
}

function ScreenDocs({ t, onTab }) {
  // All docs in one array for modal-by-name lookup
  const allDocs = [
    { name: 'W-2 (Acme Inc)', date: 'FEB 3, 2026', status: 'uploaded', extracted: true, group: 'Income' },
    { name: '1099-NEC (Freelance)', date: 'FEB 3, 2026', status: 'uploaded', extracted: true, group: 'Income' },
    { name: '1099-K (Stripe)', date: 'FEB 10, 2026', status: 'uploaded', group: 'Income' },
    { name: '1099-INT (Chase)', date: 'NOT YET UPLOADED', status: 'pending', group: 'Income' },
    { name: 'Revenue summary 2024', date: 'FEB 5, 2026', status: 'uploaded', extracted: true, group: 'Business' },
    { name: 'Expense receipts', date: 'NOT YET UPLOADED', status: 'pending', group: 'Business' },
    { name: "Driver's license", date: 'JAN 14, 2026', status: 'uploaded', group: 'Identity' },
    { name: 'Engagement letter', date: 'JAN 14, 2026', status: 'uploaded', group: 'Agreements' },
    { name: '§7216 consent', date: 'AWAITING SIGNATURE', status: 'pending', group: 'Agreements' },
  ];

  const [previewDoc, setPreviewDoc] = React.useState(null);
  const [infoDoc, setInfoDoc] = React.useState(null);
  const [toast, setToast] = React.useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const grouped = allDocs.reduce((acc, d) => {
    (acc[d.group] = acc[d.group] || []).push(d); return acc;
  }, {});

  const groupTotals = Object.fromEntries(Object.entries(grouped).map(([g, arr]) => [
    g, { count: arr.filter(d => d.status === 'uploaded').length, total: arr.length }
  ]));

  const renderGroup = (label) => (
    <DocGroup t={t} label={label} count={groupTotals[label].count} total={groupTotals[label].total}>
      {grouped[label].map(d => (
        <DocRow
          key={d.name}
          t={t}
          name={d.name}
          date={d.date}
          status={d.status}
          extracted={d.extracted}
          onPreview={() => setPreviewDoc(d)}
          onInfo={() => setInfoDoc(d)}
          onDownload={() => showToast(`Downloading ${d.name}…`)}
        />
      ))}
    </DocGroup>
  );

  return (
    <Screen t={t} style={{ position: 'relative' }}>
      <div style={{ padding: '16px 20px 8px', borderBottom: `1px solid ${t.borderSoft}` }}>
        <Row justify="space-between">
          <Wordmark t={t} />
          <div style={{ fontSize: 11, color: t.muted, letterSpacing: 0.3 }}>
            Client portal
          </div>
        </Row>
      </div>

      <div style={{ padding: '24px 20px 20px' }}>
        <Stack gap={20}>
          <Stack gap={10}>
            <H1 t={t}>Documents</H1>
            <Row justify="space-between" align="flex-end">
              <Body t={t} size={14} muted>
                {allDocs.filter(d => d.status === 'uploaded').length} of {allDocs.length} uploaded
              </Body>
              <div style={{ fontSize: 13, color: t.rustInk, fontWeight: 500 }}>
                {Math.round(allDocs.filter(d => d.status === 'uploaded').length / allDocs.length * 100)}%
              </div>
            </Row>
            <ProgressBar
              t={t}
              value={allDocs.filter(d => d.status === 'uploaded').length}
              total={allDocs.length}
            />
          </Stack>

          {/* Upload zone */}
          <div style={{
            border: `1.5px dashed ${t.border}`,
            borderRadius: t.radius,
            padding: '22px 18px',
            background: t.bgElev,
            textAlign: 'center',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: t.card, border: `1px solid ${t.border}`,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 10,
            }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 13V3M4 8l5-5 5 5M3 16h12" stroke={t.rustInk} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div style={{ fontSize: 14, color: t.ink, fontWeight: 500, marginBottom: 4 }}>
              Tap to upload or drag files here
            </div>
            <div style={{ fontSize: 12, color: t.muted, marginBottom: 12 }}>
              PDF, JPG, PNG · Up to 25MB
            </div>
            <button style={{
              background: t.card, border: `1px solid ${t.border}`,
              borderRadius: 999, padding: '8px 16px',
              fontSize: 13, color: t.ink, cursor: 'pointer',
              fontFamily: t.sans, display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1.5" y="3.5" width="11" height="8" rx="1.5" stroke={t.ink} strokeWidth="1.2"/>
                <circle cx="7" cy="7.5" r="2" stroke={t.ink} strokeWidth="1.2"/>
              </svg>
              Take a photo
            </button>
          </div>

          {/* Groups */}
          <div>
            {['Income', 'Business', 'Identity', 'Agreements'].map(renderGroup)}
          </div>

          <Button
            t={t}
            variant="ghost"
            style={{ width: '100%' }}
            onClick={() => showToast('Packaging documents as ZIP…')}>
            Download all as ZIP
          </Button>
        </Stack>
      </div>

      <TabBar t={t} active="docs" onTab={onTab} />

      {/* Modals */}
      {previewDoc && (
        <DocPreviewDialog
          t={t}
          doc={previewDoc}
          onClose={() => setPreviewDoc(null)}
          onInfo={() => { setInfoDoc(previewDoc); setPreviewDoc(null); }}
          onDownload={() => {
            showToast(`Downloading ${previewDoc.name}…`);
            setPreviewDoc(null);
          }}
          onAskAntonio={() => onTab && onTab('msgs')}
        />
      )}
      {infoDoc && (
        <DocInfoDialog
          t={t}
          doc={infoDoc}
          onClose={() => setInfoDoc(null)}
          onAskAntonio={() => onTab && onTab('msgs')}
        />
      )}

      {/* Toast — inline confirmations for download & zip */}
      {toast && (
        <div style={{
          position: 'absolute',
          bottom: 92, left: '50%', transform: 'translateX(-50%)',
          background: t.ink, color: t.bgElev,
          padding: '10px 16px',
          borderRadius: 999,
          fontSize: 13,
          boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
          zIndex: 60,
          maxWidth: '80%',
          textAlign: 'center',
          animation: 'toastIn 220ms ease-out',
        }}>
          {toast}
          <style>{`@keyframes toastIn { from { opacity: 0; transform: translate(-50%, 8px); } to { opacity: 1; transform: translate(-50%, 0); } }`}</style>
        </div>
      )}
    </Screen>
  );
}

// ─── 9. Messages Tab ────────────────────────────────────────────
function Bubble({ t, from, children, time, attachment }) {
  const mine = from === 'me';
  return (
    <div style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', marginBottom: 4 }}>
      <div style={{ maxWidth: '78%' }}>
        <div style={{
          background: mine ? t.rust : t.card,
          color: mine ? '#fff' : t.ink,
          border: mine ? 'none' : `1px solid ${t.border}`,
          borderRadius: 18,
          borderBottomRightRadius: mine ? 4 : 18,
          borderBottomLeftRadius: mine ? 18 : 4,
          padding: attachment ? '8px 8px 10px' : '10px 14px',
          fontSize: 14.5,
          lineHeight: 1.45,
        }}>
          {attachment && (
            <div style={{
              background: mine ? 'rgba(255,255,255,0.12)' : t.bgElev,
              borderRadius: 12,
              padding: 10,
              marginBottom: children ? 8 : 0,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <Placeholder t={t} label="PHOTO" w={48} h={48} style={{ margin: 0 }} />
              <div style={{
                fontSize: 12,
                color: mine ? 'rgba(255,255,255,0.9)' : t.inkSoft,
                fontFamily: t.mono,
              }}>{attachment}</div>
            </div>
          )}
          {children && <div style={{ padding: attachment ? '0 6px' : 0 }}>{children}</div>}
        </div>
        {time && (
          <div style={{
            textAlign: mine ? 'right' : 'left',
            fontSize: 10, color: t.muted, fontFamily: t.mono,
            letterSpacing: 0.3, marginTop: 4, padding: '0 8px',
          }}>{time}</div>
        )}
      </div>
    </div>
  );
}

// System card — automated portal responder, distinct from chat bubbles.
// Only handles simple factual questions (progress, counts, deadlines).
// Anything nuanced falls through to Antonio.
function SystemCard({ t, children, time, title = 'Status', kind = 'info' }) {
  // kind: 'info' (neutral update), 'answer' (response to a query)
  const isAnswer = kind === 'answer';
  return (
    <div style={{
      margin: '14px 0',
      display: 'flex', justifyContent: 'center',
    }}>
      <div style={{
        width: '100%', maxWidth: '92%',
        background: t.card,
        border: `1px solid ${t.border}`,
        borderLeft: `3px solid ${isAnswer ? t.rust : t.inkSoft}`,
        borderRadius: t.radius,
        overflow: 'hidden',
      }}>
        {/* Header strip */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px 6px',
          borderBottom: `1px solid ${t.borderSoft}`,
          background: t.bgElev,
        }}>
          {/* Small lattice glyph — represents the system without anthropomorphizing */}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <rect x="1"  y="1"  width="4" height="4" rx="0.5" fill="none" stroke={isAnswer ? t.rust : t.inkSoft} strokeWidth="1"/>
            <rect x="7"  y="1"  width="4" height="4" rx="0.5" fill={isAnswer ? t.rust : t.inkSoft}/>
            <rect x="1"  y="7"  width="4" height="4" rx="0.5" fill={isAnswer ? t.rust : t.inkSoft}/>
            <rect x="7"  y="7"  width="4" height="4" rx="0.5" fill="none" stroke={isAnswer ? t.rust : t.inkSoft} strokeWidth="1"/>
          </svg>
          <span style={{
            fontFamily: t.serif, fontStyle: 'italic',
            fontSize: 13,
            color: isAnswer ? t.rustInk : t.inkSoft,
            flex: 1,
          }}>
            {title}
          </span>
          {time && (
            <span style={{
              fontFamily: t.mono, fontSize: 9, color: t.muted,
              letterSpacing: 0.4,
            }}>{time}</span>
          )}
        </div>

        {/* Body */}
        <div style={{
          padding: '10px 14px 12px',
          fontSize: 13.5, color: t.inkSoft, lineHeight: 1.45,
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function ScreenMessages({ t, onTab }) {
  return (
    <Screen t={t}>
      <div style={{ padding: '16px 20px 12px', borderBottom: `1px solid ${t.borderSoft}` }}>
        <Row gap={12}>
          <AvatarSlot t={t} size={40} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: t.serif, fontSize: 17, color: t.ink }}>Antonio Vazquez</div>
            <Row gap={5}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <rect x="2" y="4.5" width="6" height="4" rx="0.5" stroke={t.muted} strokeWidth="0.9"/>
                <path d="M3.5 4.5V3.5a1.5 1.5 0 013 0v1" stroke={t.muted} strokeWidth="0.9"/>
              </svg>
              <div style={{ fontFamily: t.mono, fontSize: 10, color: t.muted, letterSpacing: 0.4 }}>
                ENCRYPTED · PORTAL MESSAGES
              </div>
            </Row>
          </div>
        </Row>
      </div>

      <div style={{ padding: '16px 20px', flex: 1 }}>
        <div style={{
          textAlign: 'center',
          fontFamily: t.mono, fontSize: 10, color: t.muted,
          letterSpacing: 0.5, marginBottom: 14,
        }}>FRIDAY, APRIL 4</div>

        <Bubble t={t} from="them" time="10:24 AM">
          Hey Maria — I'm finishing up your return. Could you send a photo of your 1099-K from Stripe when you get a moment?
        </Bubble>

        <Bubble t={t} from="me" time="11:02 AM" attachment="1099-K_Stripe_2024.jpg · 1.2MB" />

        <Bubble t={t} from="me" time="11:02 AM">
          Here it is! Let me know if you need anything else.
        </Bubble>

        <Bubble t={t} from="them" time="11:08 AM">
          Got it, thanks. Already reading cleanly — I'll flag if anything else comes up.
        </Bubble>

        <Bubble t={t} from="me" time="4:31 PM">
          How many documents am I still missing?
        </Bubble>

        <SystemCard t={t} time="4:31 PM" title="Status · Document check" kind="answer">
          <div style={{ marginBottom: 8 }}>
            You've uploaded <span style={{ color: t.rustInk, fontFamily: t.mono, fontWeight: 500 }}>11 of 12</span> required documents.
          </div>
          <div style={{
            fontFamily: t.mono, fontSize: 10, color: t.muted, letterSpacing: 1,
            marginBottom: 6, textTransform: 'uppercase',
          }}>Still needed</div>
          <div style={{
            padding: '8px 10px',
            background: t.bgElev,
            border: `1px solid ${t.borderSoft}`,
            borderRadius: 6,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: 5,
              background: t.tintAccent,
              border: `1px solid ${t.rustSoft}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: t.mono, fontSize: 9, color: t.rustInk, fontWeight: 600, letterSpacing: 0.3,
              flexShrink: 0,
            }}>DIV</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: t.ink }}>Form 1099-DIV</div>
              <div style={{ fontSize: 11, color: t.muted }}>From Fidelity · any dividends received</div>
            </div>
          </div>
          <div style={{
            marginTop: 10, paddingTop: 8,
            borderTop: `1px dashed ${t.borderSoft}`,
            fontSize: 11.5, color: t.muted, fontStyle: 'italic',
          }}>
            Need something more specific? Just keep typing and Antonio will get back to you.
          </div>
        </SystemCard>

        <SystemCard t={t} time="APR 8 · 2:10 PM" kind="info">
          Antonio uploaded your return for review.
        </SystemCard>

        <div style={{
          textAlign: 'center',
          fontFamily: t.mono, fontSize: 10, color: t.muted,
          letterSpacing: 0.5, margin: '14px 0',
        }}>TODAY</div>

        <Bubble t={t} from="them" time="1:45 PM">
          Return's ready. You can view it in the portal. Once you pay the balance, I'll send the 8879.
        </Bubble>
      </div>

      {/* Composer */}
      <div style={{
        padding: '10px 14px 14px',
        background: t.bgElev,
        borderTop: `1px solid ${t.borderSoft}`,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <button style={{
          width: 36, height: 36, borderRadius: '50%',
          background: t.card, border: `1px solid ${t.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, cursor: 'pointer',
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1.5" y="3" width="13" height="10" rx="1.5" stroke={t.inkSoft} strokeWidth="1.3"/>
            <circle cx="8" cy="8" r="2.5" stroke={t.inkSoft} strokeWidth="1.3"/>
          </svg>
        </button>
        <input placeholder="Message Antonio…"
               style={{
                 flex: 1, padding: '10px 14px',
                 background: t.card, border: `1px solid ${t.border}`,
                 borderRadius: 999,
                 fontSize: 14, color: t.ink, outline: 'none',
                 fontFamily: t.sans,
               }}/>
        <button style={{
          width: 36, height: 36, borderRadius: '50%',
          background: t.rust, border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, cursor: 'pointer',
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 7h10M8 3l4 4-4 4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <TabBar t={t} active="msgs" onTab={onTab} />
    </Screen>
  );
}

// ─── 10. Signatures Tab ─────────────────────────────────────────
function SigCard({ t, form, subtitle, status, date, locked, reason, onSign }) {
  return (
    <Card t={t} style={{ padding: 0, opacity: locked ? 0.7 : 1, overflow: 'hidden' }}>
      <div style={{ padding: '16px 18px' }}>
        <Row justify="space-between" align="flex-start" style={{ marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: t.serif, fontSize: 18, color: t.ink, letterSpacing: -0.2, marginBottom: 4 }}>
              {form}
            </div>
            <div style={{ fontSize: 13, color: t.muted, lineHeight: 1.4 }}>{subtitle}</div>
          </div>
          {status === 'signed' && (
            <svg width="22" height="22" viewBox="0 0 22 22" style={{ flexShrink: 0, marginLeft: 8 }}>
              <circle cx="11" cy="11" r="10" fill={t.green}/>
              <path d="M6.5 11l3.5 3.5L15.5 9" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
          {locked && (
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: t.bgElev, border: `1px solid ${t.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, marginLeft: 8,
            }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <rect x="2.5" y="5" width="7" height="5.5" rx="1" stroke={t.muted} strokeWidth="1.2"/>
                <path d="M3.8 5V3.5a2.2 2.2 0 014.4 0V5" stroke={t.muted} strokeWidth="1.2"/>
              </svg>
            </div>
          )}
        </Row>
      </div>
      <div style={{
        padding: '12px 18px',
        background: t.bgElev,
        borderTop: `1px solid ${t.borderSoft}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{
          fontFamily: t.mono, fontSize: 11, color: t.muted, letterSpacing: 0.3,
        }}>
          {status === 'signed' && <><span style={{ color: t.green }}>● SIGNED</span> · {date}</>}
          {locked && <span style={{ color: t.muted }}>● {reason || 'LOCKED'}</span>}
          {status === 'pending' && !locked && <span style={{ color: t.rust }}>● AWAITING SIGNATURE</span>}
        </div>
        {status === 'signed' && (
          <button style={{
            background: 'none', border: 'none',
            fontSize: 12, color: t.rust, cursor: 'pointer',
            fontFamily: t.sans, fontWeight: 500, padding: 0,
          }}>View signed document →</button>
        )}
        {status === 'pending' && !locked && (
          <button onClick={onSign} style={{
            background: 'none', border: 'none',
            fontSize: 12, color: t.rust, cursor: 'pointer',
            fontFamily: t.sans, fontWeight: 500, padding: 0,
          }}>Sign now →</button>
        )}
      </div>
    </Card>
  );
}

function ScreenSignatures({ t, onTab, paid = false, signed8879 = false, onSign8879 }) {
  const form8879Signed = signed8879;
  return (
    <Screen t={t}>
      <div style={{ padding: '16px 20px 8px', borderBottom: `1px solid ${t.borderSoft}` }}>
        <Row justify="space-between">
          <Wordmark t={t} />
          <div style={{ fontFamily: t.mono, fontSize: 10, color: t.muted, letterSpacing: 1 }}>
            CLIENT PORTAL
          </div>
        </Row>
      </div>

      <div style={{ padding: '24px 20px 20px' }}>
        <Stack gap={18}>
          <Stack gap={10}>
            <H1 t={t}>Signatures</H1>
            <Body t={t} size={14}>Tax forms that need your signature. Each carries an independent timestamp for audit.</Body>
          </Stack>

          {!form8879Signed && (
            <div>
              <Eyebrow t={t} style={{ marginBottom: 12 }}>Awaiting you</Eyebrow>
              <SigCard t={t}
                form="Form 8879"
                subtitle="E-file authorization. Required before Antonio can transmit your return to the IRS."
                status="pending"
                locked={!paid}
                reason="AVAILABLE AFTER PAYMENT"
                onSign={onSign8879}
              />
            </div>
          )}

          <div>
            <Eyebrow t={t} style={{ marginBottom: 12 }}>Completed</Eyebrow>
            <Stack gap={12}>
              {form8879Signed && (
                <SigCard t={t}
                  form="Form 8879"
                  subtitle="E-file authorization. Antonio can now transmit your return to the IRS."
                  status="signed"
                  date="APR 14, 2026 · 2:18 PM"
                />
              )}
              <SigCard t={t}
                form="Engagement Letter"
                subtitle="Your formal agreement for preparation of the 2024 return."
                status="signed"
                date="JAN 14, 2026 · 9:42 AM"
              />
              <SigCard t={t}
                form="§7216 Consent"
                subtitle="IRS-required separate permission to use your tax information."
                status="signed"
                date="JAN 14, 2026 · 9:44 AM"
              />
            </Stack>
          </div>

          <div style={{
            padding: '14px 16px',
            background: t.bgElev,
            border: `1px dashed ${t.border}`,
            borderRadius: t.radius,
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
              <circle cx="8" cy="8" r="7" stroke={t.muted} strokeWidth="1.2"/>
              <path d="M8 4v5M8 11v0.5" stroke={t.muted} strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <div style={{ fontSize: 12, color: t.muted, lineHeight: 1.5 }}>
              Every signature is cryptographically timestamped and stored with your return. Antonio receives an audit trail per IRS Circular 230.
            </div>
          </div>
        </Stack>
      </div>

      <TabBar t={t} active="sign" onTab={onTab} />
    </Screen>
  );
}

Object.assign(window, {
  ScreenHome, ScreenDocs, ScreenMessages, ScreenSignatures,
  TabBar, Wordmark,
});

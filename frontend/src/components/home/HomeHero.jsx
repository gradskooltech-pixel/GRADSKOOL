/**
 * GRADSKOOL — HomeHero
 * Matches the original static HTML exactly:
 * - Countdown strip (black bar with red border bottom)
 * - Hero: left copy + right "27 students" card
 * - Stats bar (black background, 4 stats)
 * - Free Mock Strip
 *
 * Design tokens from original:
 *   --red: #ff5e5f  --black: #0f0f0f  --gray-50: #fafaf9
 *   font: Georgia serif + system sans
 *   border-radius: 3px  hover: translateY(-1px)
 */
import Link from 'next/link'
import { useState, useEffect } from 'react'

// ── COUNTDOWN STRIP ───────────────────────────────────────────────────────────

function CountdownStrip() {
  const TARGET = new Date('2026-11-29T09:00:00+05:30')
  const [t, setT] = useState({ d: '--', h: '--', m: '--', s: '--' })

  useEffect(() => {
    const tick = () => {
      const diff = TARGET - Date.now()
      if (diff <= 0) { setT({ d: '00', h: '00', m: '00', s: '00' }); return }
      const d  = Math.floor(diff / 86400000)
      const h  = Math.floor((diff % 86400000) / 3600000)
      const m  = Math.floor((diff % 3600000) / 60000)
      const s  = Math.floor((diff % 60000) / 1000)
      setT({
        d: String(d).padStart(2, '0'),
        h: String(h).padStart(2, '0'),
        m: String(m).padStart(2, '0'),
        s: String(s).padStart(2, '0'),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const units = [['d', t.d, 'Days'], ['h', t.h, 'Hours'], ['m', t.m, 'Mins'], ['s', t.s, 'Secs']]

  return (
    <div style={cd.strip}>
      <div style={cd.inner}>
        <span style={cd.label}>CAT 2026</span>
        <div style={cd.timer}>
          {units.map(([key, val, lbl], i) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center' }}>
              {i > 0 && <span style={cd.sep}>:</span>}
              <div style={cd.unit}>
                <span style={cd.num}>{val}</span>
                <span style={cd.unitLbl}>{lbl}</span>
              </div>
            </div>
          ))}
        </div>
        <span style={cd.note}>
          Until CAT 2026 Exam &nbsp;·&nbsp; <strong style={{ color: '#fff' }}>29 Nov 2026</strong>
        </span>
      </div>
    </div>
  )
}

// ── HERO ──────────────────────────────────────────────────────────────────────

function Hero({ catSeats }) {
  return (
    <section style={h.hero}>
      <div style={h.container}>
        <div style={h.grid}>

          {/* Left */}
          <div>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem', alignItems:'flex-start', marginBottom:'1.75rem' }}>
              <div style={h.tag}>
                <span style={h.tagDot} />
                CAT 2026 Cohort Now Open
              </div>
              {catSeats != null && catSeats > 0 && (
                <div style={{ display:'inline-flex', alignItems:'center', gap:'0.4rem', fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'600',
                  color: catSeats <= 5 ? '#991b1b' : '#166534',
                  background: catSeats <= 5 ? '#fff5f5' : '#f0fdf4',
                  border: `1px solid ${catSeats <= 5 ? '#fca5a5' : '#86efac'}`,
                  padding:'0.2rem 0.7rem', borderRadius:'100px' }}>
                  <span style={{ width:'5px', height:'5px', borderRadius:'50%', background: catSeats <= 5 ? '#ef4444' : '#22c55e', flexShrink:0 }} />
                  {catSeats} of 27 seats remaining — CAT 2026
                </div>
              )}
            </div>
            <h1 style={h.h1}>
              India&apos;s Most<br />
              <em style={h.em}>Structured</em><br />
              Exam Prep.
            </h1>
            <p style={h.sub}>
              Founded by Abhishek Leela Pandey. Built for students who want real
              mentorship — not just video lectures. CAT, GMAT, GRE, IPMAT, XAT,
              Law, CUET and beyond.
            </p>
            <div style={h.actions}>
              <Link href="/courses" style={h.btnPrimary}>Explore Courses →</Link>
              <Link href="/tools" style={h.btnSecondary}>Free Tools ↗</Link>
            </div>
          </div>

          {/* Right — 27 students card */}
          <div style={h.card} aria-hidden="true">
            <div style={h.cardAccent} />
            <div style={h.cohortLabel}>Every Cohort</div>
            <div style={h.cohortNum}>27</div>
            <div style={h.cohortDesc}>Students. No exceptions.</div>
            <ul style={h.cohortList}>
              {[
                'Preparation requires two-way dialogue',
                'Doubts deserve depth, not speed',
                'Feedback must be structured',
                'Excellence cannot be mass-produced',
              ].map((item, i) => (
                <li key={i} style={h.cohortItem}>
                  <span style={h.cohortDash}>—</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </section>
  )
}

// ── STATS BAR ─────────────────────────────────────────────────────────────────

function StatsBar({ stats = [] }) {
  const FALLBACK = [
    { value: '100K+', label: 'Students Mentored' },
    { value: '5K+',   label: 'IIM & Top B-School Converts' },
    { value: '15+',   label: 'Full-Length CAT Mocks' },
    { value: '30K+',  label: 'Practice Questions' },
  ]
  const display = stats.length ? stats : FALLBACK

  return (
    <div style={sb.wrap}>
      <div style={sb.inner}>
        {display.map((stat, i) => (
          <div key={i} style={sb.item}>
            <span style={sb.num}>{stat.value}</span>
            <span style={sb.label}>{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── FREE MOCK STRIP ───────────────────────────────────────────────────────────

const MOCK_EXAMS = [
  { label: 'CAT', href: 'https://gradskool.testfunda.com/TestCentre/mba/cat' },
  { label: 'XAT', href: 'https://gradskool.testfunda.com/TestCentre/mba/xat' },
  { label: 'SNAP', href: 'https://gradskool.testfunda.com/TestCentre/mba/snap' },
  { label: 'NMAT', href: 'https://gradskool.testfunda.com/TestCentre/mba/nmat' },
  { label: 'CMAT', href: 'https://gradskool.testfunda.com/TestCentre/mba/cmat' },
  { label: 'MH CET', href: 'https://gradskool.testfunda.com/TestCentre/mba/mhcet' },
  { label: 'IPMAT', href: 'https://gradskool.testfunda.com/TestCentre/ug/ipmat' },
  { label: 'CUET', href: 'https://gradskool.testfunda.com/TestCentre/cuet-aptitude/cuet-(general-test)' },
  { label: 'CLAT', href: 'https://gradskool.testfunda.com/TestCentre/law/clat' },
]

function FreeMockStrip() {
  return (
    <div style={fm.strip}>
      <div style={fm.inner}>
        <div style={fm.copy}>
          <div style={fm.label}>Try Before You Enrol</div>
          <div style={fm.heading}>Attempt a Free Full-Length Mock</div>
          <div style={fm.sub}>No sign-up required.</div>
        </div>
        <div style={fm.tabs}>
          {MOCK_EXAMS.map(e => (
            <Link key={e.label} href={e.href} style={fm.tab}>
              {e.label} →
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── EXPORT ────────────────────────────────────────────────────────────────────

export function HomeHero({ stats, catSeats }) {
  return (
    <>
      <CountdownStrip />
      <Hero catSeats={catSeats} />
      <StatsBar stats={stats} />
      <FreeMockStrip />
    </>
  )
}

// ── STYLES ────────────────────────────────────────────────────────────────────

// Countdown
const cd = {
  strip: {
    background:   '#0f0f0f',
    borderBottom: '3px solid #ff5e5f',
    padding:      '1rem 2rem',
  },
  inner: {
    maxWidth:       '1160px',
    margin:         '0 auto',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            '2rem',
    flexWrap:       'wrap',
  },
  label: {
    fontFamily:    'var(--font-sans)',
    fontSize:      '0.72rem',
    fontWeight:    '600',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color:         '#ff5e5f',
  },
  timer: { display: 'flex', alignItems: 'center' },
  unit:  { display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '44px' },
  num: {
    fontFamily:  'Georgia, serif',
    fontSize:    '1.8rem',
    fontWeight:  '700',
    color:       '#ffffff',
    lineHeight:  '1',
    textAlign:   'center',
  },
  unitLbl: {
    fontFamily:    'var(--font-sans)',
    fontSize:      '0.6rem',
    fontWeight:    '500',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color:         '#999',
  },
  sep: {
    fontFamily: 'Georgia, serif',
    fontSize:   '1.6rem',
    color:      '#555',
    lineHeight: '1',
    padding:    '0 0.2rem',
    marginTop:  '-4px',
  },
  note: {
    fontFamily: 'var(--font-sans)',
    fontSize:   '0.78rem',
    color:      '#999',
  },
}

// Hero
const h = {
  hero: {
    background: 'var(--white)',
    padding:    '7rem 2rem 5rem',
  },
  container: { maxWidth: '1160px', margin: '0 auto' },
  grid: {
    display:             'grid',
    gridTemplateColumns: '1.1fr 0.9fr',
    gap:                 '5rem',
    alignItems:          'center',
  },
  tag: {
    display:       'inline-flex',
    alignItems:    'center',
    gap:           '0.5rem',
    fontFamily:    'var(--font-sans)',
    fontSize:      '0.75rem',
    fontWeight:    '500',
    letterSpacing: '0.09em',
    textTransform: 'uppercase',
    color:         '#ff5e5f',
    border:        '1px solid #ffd0d0',
    background:    '#fff0f0',
    padding:       '0.3rem 0.8rem',
    borderRadius:  '2px',
  },
  tagDot: {
    width:        '6px',
    height:       '6px',
    background:   '#ff5e5f',
    borderRadius: '50%',
    animation:    'pulse 2s infinite',
    flexShrink:   0,
  },
  h1: {
    fontFamily:   'Georgia, serif',
    fontSize:     'clamp(2.6rem, 4.8vw, 3.8rem)',
    lineHeight:   '1.08',
    color:        '#0f0f0f',
    marginBottom: '1.5rem',
    fontWeight:   '700',
  },
  em: {
    fontStyle:  'italic',
    color:      '#ff5e5f',
    fontWeight: '400',
  },
  sub: {
    fontFamily:   'Georgia, serif',
    fontSize:     '1.05rem',
    color:        '#555',
    lineHeight:   '1.75',
    maxWidth:     '480px',
    marginBottom: '2.5rem',
  },
  actions: {
    display:    'flex',
    alignItems: 'center',
    gap:        '1.25rem',
    flexWrap:   'wrap',
  },
  btnPrimary: {
    display:        'inline-block',
    background:     '#0f0f0f',
    color:          '#ffffff',
    padding:        '0.8rem 1.8rem',
    borderRadius:   '3px',
    fontFamily:     'var(--font-sans)',
    fontSize:       '0.88rem',
    fontWeight:     '500',
    letterSpacing:  '0.03em',
    textDecoration: 'none',
    transition:     'background 0.2s, transform 0.15s',
  },
  btnSecondary: {
    fontFamily:     'var(--font-sans)',
    color:          '#0f0f0f',
    fontSize:       '0.88rem',
    display:        'inline-flex',
    alignItems:     'center',
    gap:            '0.4rem',
    borderBottom:   '1px solid #ddd',
    paddingBottom:  '2px',
    textDecoration: 'none',
    transition:     'color 0.2s, border-color 0.2s',
  },
  // Right card
  card: {
    background:   '#fafaf9',
    border:       '1px solid #e8e8e6',
    borderRadius: '4px',
    padding:      '2.75rem',
    position:     'relative',
    overflow:     'hidden',
  },
  cardAccent: {
    position:   'absolute',
    top:        0,
    left:       0,
    width:      '3px',
    height:     '100%',
    background: '#ff5e5f',
  },
  cohortLabel: {
    fontFamily:    'var(--font-sans)',
    fontSize:      '0.72rem',
    fontWeight:    '500',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color:         '#ff5e5f',
    marginBottom:  '0.75rem',
  },
  cohortNum: {
    fontFamily:   'Georgia, serif',
    fontSize:     '5rem',
    lineHeight:   '1',
    color:        '#0f0f0f',
    fontWeight:   '700',
    marginBottom: '0.2rem',
  },
  cohortDesc: {
    fontFamily:   'Georgia, serif',
    fontSize:     '1rem',
    color:        '#555',
    marginBottom: '2rem',
    fontStyle:    'italic',
  },
  cohortList: { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.8rem' },
  cohortItem: {
    fontFamily:  'Georgia, serif',
    fontSize:    '0.9rem',
    color:       '#555',
    display:     'flex',
    alignItems:  'flex-start',
    gap:         '0.7rem',
    lineHeight:  '1.5',
  },
  cohortDash: { color: '#ff5e5f', flexShrink: 0 },
}

// Stats bar
const sb = {
  wrap: { background: '#0f0f0f', padding: '3.5rem 2rem' },
  inner: {
    maxWidth:            '1160px',
    margin:              '0 auto',
    display:             'grid',
    gridTemplateColumns: 'repeat(4,1fr)',
    gap:                 '2rem',
  },
  item:  { textAlign: 'center' },
  num: {
    fontFamily:   'Georgia, serif',
    fontSize:     '2.8rem',
    color:        '#ffffff',
    display:      'block',
    lineHeight:   '1',
    marginBottom: '0.5rem',
    fontWeight:   '700',
  },
  label: {
    fontFamily:    'var(--font-sans)',
    fontSize:      '0.78rem',
    color:         '#999',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
}

// Free mock strip
const fm = {
  strip: {
    background:   '#0f0f0f',
    borderTop:    '3px solid #ff5e5f',
    borderBottom: '3px solid #ff5e5f',
    padding:      '2.5rem 2rem',
  },
  inner: {
    maxWidth:       '1160px',
    margin:         '0 auto',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    gap:            '2rem',
    flexWrap:       'wrap',
  },
  copy: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  label: {
    fontFamily:    'var(--font-sans)',
    fontSize:      '0.68rem',
    fontWeight:    '600',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color:         '#ff5e5f',
  },
  heading: {
    fontFamily:  'Georgia, serif',
    fontSize:    '1.5rem',
    color:       '#ffffff',
    fontWeight:  '700',
    lineHeight:  '1.2',
  },
  sub: {
    fontFamily: 'Georgia, serif',
    fontSize:   '0.88rem',
    color:      '#999',
  },
  tabs: { display: 'flex', gap: '0.6rem', flexWrap: 'wrap' },
  tab: {
    background:     'transparent',
    border:         '1px solid #333',
    color:          '#999',
    padding:        '0.55rem 1rem',
    borderRadius:   '3px',
    fontFamily:     'var(--font-sans)',
    fontSize:       '0.82rem',
    display:        'inline-block',
    textDecoration: 'none',
    transition:     'border-color 0.2s, color 0.2s',
    whiteSpace:     'nowrap',
  },
}

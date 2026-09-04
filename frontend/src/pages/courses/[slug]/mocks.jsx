/**
 * GRADSKOOL — CAT Mocks Page
 * Route: /courses/[examSlug]/mocks
 *
 * Built from static HTML + 11 uploaded screenshots.
 * Sections:
 *   1. Hero (og-cat-mock.png style)
 *   2. Mock list / schedule (mock_test.png style)
 *   3. The Problem section
 *   4. How it Works — 7 steps with SVG illustrations from screenshots
 *   5. Onboarding Journey — 6 steps (prompt → create → verify → interface → live)
 *   6. The Experience — 4 feature cards
 *   7. FAQs
 *   8. Final CTA
 */
import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { MockScheduleCard, MockScheduleTable } from '../../../components/mocks/MockSchedule'
import { NATIVE_MOCKS_EXAMS } from '../../../lib/nativeMocksExams'

// Exam-specific free mock URLs — one per exam, accessible without login
const FREE_MOCK_URLS = {
  cat:   'https://gradskool.testfunda.com/TestCentre/full-length--tests/cat',
  xat:   'https://gradskool.testfunda.com/TestCentre/mba/xat',
  snap:  'https://gradskool.testfunda.com/TestCentre/mba/snap',
  nmat:  'https://gradskool.testfunda.com/TestCentre/mba/nmat',
  gmat:  'https://gradskool.testfunda.com/TestCentre/gmat/gmat-focus',
  gre:   'https://gradskool.testfunda.com/TestCentre/gre/gre-general',
  ipmat: 'https://gradskool.testfunda.com/TestCentre/ug/ipmat',
  cmat:  'https://gradskool.testfunda.com/TestCentre/mba/cmat',
  mhcet: 'https://gradskool.testfunda.com/TestCentre/mba/mhcet',
  clat:  'https://gradskool.testfunda.com/TestCentre/law/clat',
  cuet:  'https://gradskool.testfunda.com/TestCentre/cuet-aptitude/cuet-(general-test)',
}

const FREE_MOCK_LABELS = {
  cat:'Demo iCAT Full Length Mock', xat:'Demo XAT Full Length Mock',
  snap:'Demo SNAP Full Length Mock', nmat:'Demo NMAT Full Length Mock',
  gmat:'Demo GMAT Focus Mock', gre:'Demo GRE General Test Mock',
  ipmat:'Demo IPMAT Full Length Mock', cmat:'Demo CMAT Full Length Mock',
  mhcet:'Demo MH CET MBA Mock', clat:'Demo CLAT Full Length Mock', cuet:'Demo CUET Paper III',
}

// Exam-specific content for mocks page
const EXAM_META = {
  cat:    { name:'CAT 2026',               mocks:'30', sectional:'30', area:'140', hero:'The mock that feels like the real exam.', sub:'Full-length CAT-pattern mocks with same interface, same pressure, same section structure. Then understand exactly where you lost marks and why.' },
  xat:    { name:'XAT 2027',               mocks:'6',  sectional:'12', area:'40',  hero:'XAT pattern mocks. Decision Making included.', sub:'6 full-length XAT mocks with the Decision Making section — the section no other coaching covers properly. Detailed post-test analysis after every test.' },
  snap:   { name:'SNAP 2026',              mocks:'20', sectional:'12', area:'60',  hero:'20 SNAP mocks. 60 questions. 60 minutes.', sub:'No sectional time limit. Practice the exact SNAP pressure — 60 questions in 60 minutes with full freedom to switch between sections.' },
  nmat:   { name:'NMAT 2026',              mocks:'10', sectional:'12', area:'50',  hero:'10 NMAT mocks. No negative marking. Section order choice.', sub:'Practice choosing your optimal section order. No negative marking means attempt strategy changes completely — GRADSKOOL trains you for this.' },
  gmat:   { name:'GMAT Focus Edition',     mocks:'5',  sectional:'6',  area:'30',  hero:'GMAT Focus Edition mocks. QR · VR · DI.', sub:'Full-length GMAT Focus Edition mocks with Quantitative Reasoning, Verbal Reasoning and Data Insights. No AWA, no Sentence Correction.' },
  gre:    { name:'GRE General Test',       mocks:'5',  sectional:'6',  area:'30',  hero:'GRE mocks. Verbal · Quant · AWA.', sub:'Full-length GRE General Test mocks — section-adaptive format. AWA practice essays with individual written feedback on every submission.' },
  ipmat:  { name:'IPMAT 2027',             mocks:'89', sectional:'12', area:'60',  hero:'89 full-length IPMAT mocks across 12 programmes.', sub:'IIM Indore (15) · IIM Rohtak (9) · JIPMAT (9) · NPAT (9) · IPU CET (5) · SET (6) · Xaviers (4) · Christ (4) · IIM B DBE/DSE (10) · IIMK BMS (4) · MH BBA/BMS (4).' },
  cmat:   { name:'CMAT 2027',              mocks:'12', sectional:'15', area:'60',  hero:'12 full-length CMAT mocks. All 5 sections.', sub:'Full-length CMAT mocks including the Innovation & Entrepreneurship section. Target 99%ile for JBIMS — the best value MBA in India.' },
  mhcet:  { name:'MH CET MBA 2027',        mocks:'10', sectional:'8',  area:'40',  hero:'MH CET mocks. 200 questions. 150 minutes.', sub:'No negative marking means every unattempted question is a lost mark. Practice attempting all 200 questions in 150 minutes with full section analytics.' },
  clat:   { name:'CLAT / AILET / LNAT',   mocks:'18', sectional:'8',  area:'30',  hero:'18 mocks — CLAT · AILET · LNAT.', sub:'10 CLAT mocks + 5 AILET mocks + 3 LNAT practice tests. All passage-based. Legal Reasoning, English, Current Affairs, LR and Quantitative Techniques.' },
  cuet:   { name:'CUET UG 2026',           mocks:'40', sectional:'10', area:'20',  hero:'40 online CUET mocks across all papers.', sub:'Paper I (Language) · Paper III (General Test) · Accountancy · Mathematics · Economics · Business Studies. NCERT-aligned, CUET-pattern.' },
}
const DEFAULT_META = { name:'Exam', mocks:'—', sectional:'—', area:'—', hero:'Practice under real exam conditions.', sub:'Full-length mocks with detailed post-test analysis.' }
import { useRouter } from 'next/router'

const C = {
  red: '#ff5e5f', black: '#0f0f0f', white: '#ffffff',
  cream: '#faf8f4', gray50: '#fafaf9',
  gray100: '#f5f5f3', gray200: '#e8e8e6',
  gray400: '#999', gray500: '#666', gray600: '#555',
  border: '#e8e8e6',
  varc: '#7c3aed', dilr: '#1d4ed8', qa: '#92400e',
  varcBg: '#8b5cf6', dilrBg: '#3b82f6', qaBg: '#b45309',
}

// Mock schedule data
const MOCK_SCHEDULE = [
  { name:'Demo iCAT Full Length Mock Test', time:'2h', status:'free',      date:null,              label:'Not Attempted' },
  { name:'iCAT 30',                         time:'2h', status:'live',      date:'15-Apr-2026',     label:'Available Now' },
  { name:'iCAT 29',                         time:'2h', status:'upcoming',  date:'30-Apr-2026',     label:'Available On' },
  { name:'iCAT 28',                         time:'2h', status:'upcoming',  date:'12-May-2026',     label:'Available On' },
  { name:'iCAT 27',                         time:'2h', status:'upcoming',  date:'22-May-2026',     label:'Available On' },
  { name:'iCAT 26',                         time:'2h', status:'upcoming',  date:'10-Jun-2026',     label:'Available On' },
  { name:'iCAT 25',                         time:'2h', status:'upcoming',  date:'23-Jun-2026',     label:'Available On' },
  { name:'iCAT 24',                         time:'2h', status:'upcoming',  date:'08-Jul-2026',     label:'Available On' },
  { name:'iCAT 23',                         time:'2h', status:'upcoming',  date:'21-Jul-2026',     label:'Available On' },
  { name:'iCAT 22',                         time:'2h', status:'upcoming',  date:'04-Aug-2026',     label:'Available On' },
  { name:'iCAT 21',                         time:'2h', status:'upcoming',  date:'18-Aug-2026',     label:'Available On' },
]

const FAQS = [
  { q:'Is the GRADSKOOL CAT mock test free?', a:'Yes. GRADSKOOL offers 1 free Demo iCAT Full-Length Mock Test — no credit card, no signup wall. Create a free account on the Testfunda platform, verify your email, and start immediately. The full series of 31 mocks and 30 sectional tests is available for purchase.' },
  { q:'How many CAT mock tests does GRADSKOOL offer?', a:'GRADSKOOL offers 31 full-length iCAT mock tests, 30 sectional tests (10 each for VARC, DILR, and QA), and 140 area-wise tests — over 200 tests for comprehensive CAT 2026 preparation.' },
  { q:"Does GRADSKOOL's mock test replicate the real CAT interface?", a:'Yes. GRADSKOOL offers the IIM CAT Player Look — an exact replica of the official CAT exam interface — as well as a Classic TestFunda mode for easier practice. Each test is 2 hours with 40 minutes per section, exactly matching real CAT structure.' },
  { q:'What analysis is provided after each mock test?', a:'After each mock you receive: section-wise scores (VARC, DILR, QA), All India percentile ranking, accuracy percentages, marks and time taken per section, section-wise time and attempt analysis, and video solutions with step-by-step explanations for every question.' },
  { q:'When are the GRADSKOOL CAT 2026 mocks released?', a:'Mocks are released progressively from April 2026 to November 2026. The Demo iCAT and iCAT 30 are live immediately. Full-length mocks unlock every 1–2 weeks. Download the full schedule PDF from the website.' },
]

const TESTFUNDA_URL = 'https://gradskool.testfunda.com/TestCentre/full-length--tests/cat' // CONFIRM BEFORE DEPLOY

// NATIVE_MOCKS_EXAMS (exams with a real, on-site /mocks/<slug> hub, as
// opposed to just this third-party Testfunda page) now lives in
// lib/nativeMocksExams.js — it's also used by Navbar.jsx to decide which
// exam the "Mocks" link should point to, so it needed a shared home.

// Real mocks-only PricingPlan slug per exam — matches apps.courses.
// management.commands.seed_verified_plans.py exactly. Only exams with a
// genuine, real standalone mocks plan get the "Enrol Now" checkout
// button; an exam not in this map simply doesn't show it, rather than
// linking to a plan slug that doesn't actually exist.
const MOCKS_PLAN_SLUGS = {
  cat: 'cat-mocks',
  snap: 'snap-mocks',
  nmat: 'nmat-mocks',
}


// ── MOCK CARD with hover ─────────────────────────────────────────────────────
function MockCard({ accentColor, children }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: '#fff',
        border: `1px solid ${hov ? accentColor : '#e8e8e6'}`,
        borderTop: `3px solid ${accentColor}`,
        borderRadius: '4px',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        transition: 'border-color 0.18s, box-shadow 0.18s',
        boxShadow: hov ? `0 4px 24px ${accentColor}22` : 'none',
        cursor: 'default',
      }}
    >
      {children({ hov })}
    </div>
  )
}

export async function getStaticPaths() {
  const KNOWN = ['cat', 'xat', 'snap', 'nmat', 'gmat', 'gre', 'ipmat', 'cmat', 'mhcet', 'clat', 'cuet', 'pi-wat-gd']
  return {
    paths: KNOWN.map(slug => ({ params: { slug } })),
    fallback: true,
  }
}

export async function getStaticProps({ params }) {
  return { props: { examSlugProp: params.slug } }
}

export default function MocksPage({ examSlugProp = 'cat' }) {
  const router      = useRouter()
  if (router.isFallback) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Georgia,serif', color:'#999' }}>Loading…</div>
  const examSlug    = examSlugProp || router.query.slug || 'cat'

  // Fetch credentials if student is logged in
  const [creds,     setCreds]   = useState(null)
  const [credsLoad, setCredsLoad] = useState(false)

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    if (!token) return
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
    setCredsLoad(true)
    fetch(`${API}/enrollments/mock-credentials/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (Array.isArray(data)) {
          const examCred = data.find(c => c.exam_slug === examSlug)
          setCreds(examCred || null)
        }
      })
      .catch(() => {})
      .finally(() => setCredsLoad(false))
  }, [examSlug])
  const [openFaq, setOpenFaq]   = useState(null)
  return (
    <>
      <Head>
        <title>{(examSlug||'CAT').toUpperCase()} Mock Tests — GRADSKOOL</title>
        <meta name="description" content={`${(examSlug||'cat').toUpperCase()} mock tests — full-length timed mocks, sectional tests and area-wise practice. Free demo mock available. Detailed analysis after every test.`} />
        <link rel="canonical" href={`https://gradskool.in/courses/${examSlug}/mocks`} />
      </Head>

      {/* BREADCRUMB */}
      <div style={{ padding:'0.875rem 2rem', borderBottom:`1px solid ${C.border}`, background:C.white }}>
        <div style={{ maxWidth:'1160px', margin:'0 auto', display:'flex', gap:'0.5rem', fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:C.gray400 }}>
          <Link href="/" style={{ color:C.gray400, textDecoration:'none' }}>Home</Link>
          <span>/</span>
          <Link href="/courses" style={{ color:C.gray400, textDecoration:'none' }}>Courses</Link>
          <span>/</span>
          <Link href={`/courses/${examSlug}`} style={{ color:C.gray400, textDecoration:'none' }}>CAT 2026</Link>
          <span>/</span>
          <span style={{ color:C.black }}>Mock Tests</span>
        </div>
      </div>

      {/* ── NATIVE MOCKS CALLOUT — only for exams with real on-site content ── */}
      {NATIVE_MOCKS_EXAMS.includes(examSlug) && (
        <div style={{ background: C.black, padding: '0.875rem 2rem' }}>
          <div style={{ maxWidth: '1160px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', color: '#fff', lineHeight: 1.6 }}>
              <strong>New on GRADSKOOL:</strong> take full {(examSlug||'').toUpperCase()} mock tests directly on this site — topic-wise practice, sectionals, and full mocks with instant scoring.
            </p>
            <Link href={`/mocks/${examSlug}`} style={{ flexShrink: 0, background: C.red, color: '#fff', padding: '0.6rem 1.25rem', borderRadius: '4px', fontFamily: 'var(--font-sans)', fontSize: '0.82rem', fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
              Try Native {(examSlug||'').toUpperCase()} Mocks →
            </Link>
          </div>
        </div>
      )}

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section style={s.hero}>
        <div style={s.heroInner}>
          <div style={s.heroLeft}>
            <span style={s.heroPill}>CAT Mock Test Platform</span>
            <h1 style={s.heroTitle}>
              The mock that<br />
              <em style={s.heroEm}>feels like the real exam</em>
            </h1>
            <p style={s.heroSub}>
              Practice under actual CAT conditions — same interface, same pressure,
              same section structure. Then understand exactly where you lost marks and why.
            </p>
            <div style={s.heroBtns}>
              <a href={TESTFUNDA_URL} target="_blank" rel="noreferrer" style={s.btnPrimary}>
                Start Free Mock
              </a>
              <a href="#schedule" style={s.btnOutline}>
                Buy Mocks
              </a>
              {/* Real, direct link to GRADSKOOL's own checkout for this
                  exam's mocks-only PricingPlan — added alongside the
                  existing Testfunda/schedule buttons, not replacing
                  either. Confirmed with GS: Testfunda stays exactly
                  as-is; this is purely additive, a second real path for
                  someone who already knows they want to buy and doesn't
                  need to scroll through the schedule first. Real plan
                  slugs differ per exam (cat-mocks, snap-mocks,
                  nmat-mocks — see apps.courses.management.commands.
                  seed_verified_plans.py) — this page is a shared dynamic
                  route across exams, so the slug is looked up rather
                  than hardcoded to 'cat-mocks' alone. */}
              {MOCKS_PLAN_SLUGS[examSlug] && (
                <a href={`/checkout/${examSlug}?plan=${MOCKS_PLAN_SLUGS[examSlug]}`} style={s.btnOutline}>
                  Enrol Now
                </a>
              )}
            </div>
            <div style={s.heroStats}>
              {[
                ['🎯','1 Free Demo Mock'],
                ['📋','31 Full-Length Mocks'],
                ['📝','30 Sectional Tests'],
                ['🧩','140 Area-Wise Tests'],
              ].map(([icon,label]) => (
                <div key={label} style={s.heroStatPill}>
                  <span>{icon}</span>
                  <span style={s.heroStatLabel}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hero illustration — live exam interface SVG from live.png */}
          <div style={s.heroRight}>
            <SVGExamInterface />
          </div>
        </div>
      </section>

      {/* ── THE PROBLEM ────────────────────────────────────────────────────── */}
      <section style={s.problem}>
        <div style={s.container}>
          <div style={s.sectionLabel}>The real problem</div>
          <h2 style={s.sectionTitle}>Most CAT prep is practice.<br />Not preparation.</h2>
          <div style={s.problemGrid}>
            {[
              { icon:'📊', title:'You practice. You don\'t analyse.', body:'Solving 100 questions without reviewing them is just habit formation, not improvement. Without analysis, mistakes repeat.' },
              { icon:'⏱', title:'The real CAT feels completely different.', body:'The interface, the timer pressure, the section switching — students who haven\'t simulated it are surprised on exam day.' },
              { icon:'🎯', title:'You don\'t know your actual weak areas.', body:'Feeling weak in QA isn\'t the same as knowing which topics drain your time. You need data, not gut feeling.' },
            ].map((p,i) => (
              <div key={i} style={s.problemCard}>
                <span style={s.problemIcon}>{p.icon}</span>
                <h3 style={s.problemCardTitle}>{p.title}</h3>
                <p style={s.problemCardBody}>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS — 7 steps ─────────────────────────────────────────── */}
      <section style={s.hiw}>
        <div style={s.container}>
          <div style={s.sectionLabel}>How it works</div>
          <h2 style={s.sectionTitle}>Your complete mock test journey</h2>
          <p style={{ fontFamily:'Georgia, serif', fontSize:'1rem', color:C.gray500, maxWidth:'560px', marginBottom:'4rem', lineHeight:'1.75' }}>
            From the moment you click "Start" to the detailed breakdown after — here's exactly what the experience looks like.
          </p>

          <div style={s.stepsGrid}>
            {/* Step 1 — Instructions */}
            <Step num="01" title="Read the Instructions">
              <SVGInstructions />
              <p style={s.stepBody}>The test opens with the official CAT instructions page — time limits, question palette legend, marking scheme. Identical to the real exam.</p>
            </Step>

            {/* Step 2 — Choose Interface */}
            <Step num="02" title="Choose Your Interface">
              <SVGLaunchDialog />
              <p style={s.stepBody}>Pick between IIM CAT Player look (exact replica of official CAT) or Classic TestFunda mode. 2-hour time limit, 1 attempt.</p>
            </Step>

            {/* Step 3 — Attempt */}
            <Step num="03" title="Attempt the Mock">
              <SVGLiveExam />
              <p style={s.stepBody}>40 minutes per section — VARC, DILR, QA. Section tabs, live countdown, question navigator with answered/unanswered/marked-for-review states.</p>
            </Step>

            {/* Step 4 — Overview */}
            <Step num="04" title="Overview of Results">
              <SVGOverview />
              <p style={s.stepBody}>Section-wise scores, accuracy, marks, percentile and time taken — all in one summary table immediately after submission.</p>
            </Step>

            {/* Step 5 — Solutions */}
            <Step num="05" title="Mock Analysis & Video Solutions">
              <SVGSolutions />
              <p style={s.stepBody}>Review every question — see correct vs incorrect vs unattempted. View written solutions and video explanations for each question.</p>
            </Step>

            {/* Step 6 — Percentile */}
            <Step num="06" title="All India Percentile">
              <SVGPercentile />
              <p style={s.stepBody}>See your rank and percentile nationally — VARC, DILR, QA separately and overall. Benchmark yourself against all test-takers.</p>
            </Step>

            {/* Step 7 — Time Analysis */}
            <Step num="07" title="Time & Attempt Analysis">
              <SVGTimeChart />
              <p style={s.stepBody}>Pie chart breakdown of time spent per section. Identify where you over-invested and where you rushed. Fix the pattern before the next mock.</p>
            </Step>
          </div>
        </div>
      </section>

      {/* ── ONBOARDING JOURNEY ─────────────────────────────────────────────── */}
      <section style={{ ...s.hiw, background:C.gray50, borderTop:`1px solid ${C.border}` }}>
        <div style={s.container}>
          <div style={s.sectionLabel}>Your onboarding journey</div>
          <h2 style={s.sectionTitle}>From discovery to your first mock</h2>
          <p style={{ fontFamily:'Georgia, serif', fontSize:'1rem', color:C.gray500, maxWidth:'560px', marginBottom:'4rem', lineHeight:'1.75' }}>
            Here's exactly how a new user gets started — from finding the free mock to sitting the exam.
          </p>

          <div style={s.journeyTimeline}>
            {[
              { num:'1', title:'Browse the mock test list', body:'Explore the full library of CAT mock tests, including a FREE Demo iCAT Full Length Mock Test to get you started.', svg: <SVGMockList /> },
              { num:'2', title:'Click the mock — login prompt appears', body:'When you click on the free mock without being logged in, a popup appears letting you know the exam is free for all registered users and asks you to log in first.', svg: <SVGLoginPrompt /> },
              { num:'3', title:'Create your account', body:'Click Sign Up to open the registration form. Fill in your Name, Username, Password, Email, City, Contact Number, Date of Birth and Gender. Complete reCAPTCHA and hit Sign Up.', svg: <SVGCreateAccount /> },
              { num:'4', title:'Verify your email', body:"Check your inbox for a verification email and click the link to activate your account. Once verified, you're ready to log in.", svg: null },
              { num:'5', title:"Choose your exam interface", body:'Once logged in, click the free mock again. Pick between IIM CAT Player look or Classic TestFunda look before launching.', svg: <SVGLaunchDialog small /> },
              { num:'6', title:"You're live — the exam begins", body:"The test launches in the IIM CAT Player look — section tabs, live countdown, question area, and question navigator. Use Save & Next, Mark for Review, or Submit when done.", svg: null },
            ].map((step, i) => (
              <div key={i} style={s.jstep}>
                <div style={s.jstepAside}>
                  <div style={s.jstepCircle}>{step.num}</div>
                  {i < 5 && <div style={s.jstepLine} />}
                </div>
                <div style={s.jstepContent}>
                  <h3 style={s.jstepTitle}>{step.title}</h3>
                  <p style={s.jstepBody}>{step.body}</p>
                  {step.svg && (
                    <div style={s.jstepSvg}>{step.svg}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FREE MOCK + ACCESS BANNER ──────────────────────────────────────── */}
      <section style={{ background:'#fafaf9', borderTop:`1px solid ${C.border}`, padding:'4rem 2rem' }}>
        <div style={s.container}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem', alignItems:'stretch' }}>

            {/* FREE MOCK CARD */}
            <MockCard accentColor="#22c55e">
            {({ hov }) => (<>
              <div style={{ display:'flex', alignItems:'center', gap:'0.625rem' }}>
                <span style={{ background:'#f0fdf4', border:'1px solid #86efac', color:'#166534', fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', letterSpacing:'0.08em', textTransform:'uppercase', padding:'0.2rem 0.6rem', borderRadius:'100px' }}>
                  Free — No Login Required
                </span>
              </div>
              <div>
                <p style={{ fontFamily:'Georgia,serif', fontSize:'1.25rem', fontWeight:'700', color:'#0f0f0f', marginBottom:'0.375rem' }}>
                  {FREE_MOCK_LABELS[examSlug] || `Demo ${(examSlug||'').toUpperCase()} Mock`}
                </p>
                <p style={{ fontFamily:'Georgia,serif', fontSize:'0.875rem', color:'#666', lineHeight:'1.6' }}>
                  One complete free mock. Full-length, timed, exact exam pattern.
                  No signup, no credit card, no account needed.
                </p>
              </div>
              <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', fontSize:'0.75rem', fontFamily:'var(--font-sans)', color:'#555' }}>
                <span style={{ background:'#f5f5f3', padding:'0.2rem 0.6rem', borderRadius:'3px' }}>✓ Full length</span>
                <span style={{ background:'#f5f5f3', padding:'0.2rem 0.6rem', borderRadius:'3px' }}>✓ Detailed analysis</span>
                <span style={{ background:'#f5f5f3', padding:'0.2rem 0.6rem', borderRadius:'3px' }}>✓ Instant result</span>
              </div>
              <a href={FREE_MOCK_URLS[examSlug] || FREE_MOCK_URLS.cat} target="_blank" rel="noreferrer"
                style={{ display:'inline-block', background: hov ? '#16a34a' : '#22c55e', color:'#fff', padding:'0.875rem 2rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.9rem', fontWeight:'700', textDecoration:'none', textAlign:'center', marginTop:'auto', transition:'background 0.18s, transform 0.18s', transform: hov ? 'translateY(-1px)' : 'none' }}>
                Attempt Free Mock →
              </a>
            </>)}</MockCard>

            {/* PAID MOCKS CARD */}
            <MockCard accentColor="#ff5e5f">
            {({ hov }) => (<>
              {creds ? (
                /* ── CREDENTIALS UNLOCKED ── */
                <>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.625rem' }}>
                    <span style={{ background:'#eff6ff', border:'1px solid #bfdbfe', color:'#1d4ed8', fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', letterSpacing:'0.08em', textTransform:'uppercase', padding:'0.2rem 0.6rem', borderRadius:'100px' }}>
                      Access Unlocked
                    </span>
                  </div>
                  <div>
                    <p style={{ fontFamily:'Georgia,serif', fontSize:'1.25rem', fontWeight:'700', color:'#0f0f0f', marginBottom:'0.375rem' }}>
                      Your {(examSlug||'').toUpperCase()} Mock Access
                    </p>
                    {creds.note && (
                      <p style={{ fontFamily:'Georgia,serif', fontSize:'0.875rem', color:'#666', lineHeight:'1.6', marginBottom:'1rem' }}>
                        {creds.note}
                      </p>
                    )}
                  </div>
                  {/* Credentials box */}
                  <div style={{ background:'#f8faff', border:'1px solid #bfdbfe', borderRadius:'4px', padding:'1rem' }}>
                    <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', letterSpacing:'0.08em', textTransform:'uppercase', color:'#1d4ed8', marginBottom:'0.75rem' }}>Login Credentials</p>
                    <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:'0.375rem 0.875rem', fontFamily:'var(--font-sans)', fontSize:'0.85rem', alignItems:'center' }}>
                      <span style={{ color:'#555', fontWeight:'600' }}>Username</span>
                      <span style={{ color:'#0f0f0f', fontFamily:'monospace', background:'#fff', padding:'0.2rem 0.5rem', borderRadius:'3px', border:'1px solid #dbeafe' }}>{creds.username}</span>
                      <span style={{ color:'#555', fontWeight:'600' }}>Password</span>
                      <span style={{ color:'#0f0f0f', fontFamily:'monospace', background:'#fff', padding:'0.2rem 0.5rem', borderRadius:'3px', border:'1px solid #dbeafe' }}>{creds.password}</span>
                    </div>
                  </div>
                  {creds.platform_url && (
                    <a href={creds.platform_url} target="_blank" rel="noreferrer"
                      style={{ display:'inline-block', background: hov ? '#1e40af' : '#1d4ed8', color:'#fff', padding:'0.875rem 2rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.9rem', fontWeight:'700', textDecoration:'none', textAlign:'center', marginTop:'auto', transition:'background 0.18s, transform 0.18s', transform: hov ? 'translateY(-1px)' : 'none' }}>
                      Go to Mock Platform ↗
                    </a>
                  )}
                </>
              ) : (
                /* ── NOT YET PURCHASED / LOCKED ── */
                <>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.625rem' }}>
                    <span style={{ background:'#fff0f0', border:'1px solid #ffd0d0', color:'#991b1b', fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', letterSpacing:'0.08em', textTransform:'uppercase', padding:'0.2rem 0.6rem', borderRadius:'100px' }}>
                      Full Access — Paid
                    </span>
                  </div>
                  <div>
                    <p style={{ fontFamily:'Georgia,serif', fontSize:'1.25rem', fontWeight:'700', color:'#0f0f0f', marginBottom:'0.375rem' }}>
                      Full {(examSlug||'').toUpperCase()} Mock Library
                    </p>
                    <p style={{ fontFamily:'Georgia,serif', fontSize:'0.875rem', color:'#666', lineHeight:'1.6' }}>
                      {(EXAM_META[examSlug] || EXAM_META.cat)?.mocks || '—'} full-length mocks +{' '}
                      {(EXAM_META[examSlug] || EXAM_META.cat)?.sectional || '—'} sectional tests.
                      Platform login credentials delivered within a few hours of purchase.
                    </p>
                  </div>
                  <div style={{ background:'#fff8f0', border:'1px solid #ffe4c0', borderRadius:'4px', padding:'0.875rem 1rem' }}>
                    <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', color:'#92400e', lineHeight:'1.5' }}>
                      <strong>How it works:</strong> After purchase, your Testfunda login credentials are
                      sent to you personally within a few hours. You'll see them here on this page once activated.
                    </p>
                  </div>
                  <a href={`/courses/${examSlug}#pricing`}
                    style={{ display:'inline-block', background:'#ff5e5f', color:'#fff', padding:'0.875rem 2rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.9rem', fontWeight:'700', textDecoration:'none', textAlign:'center', marginTop:'auto' }}>
                    Buy {(examSlug||'').toUpperCase()} Mocks →
                  </a>
                </>
              )}
            </>)}</MockCard>
          </div>
        </div>
      </section>

      {/* ── MOCK SCHEDULE ──────────────────────────────────────────────────── */}
      <section style={{ background:C.white, borderTop:`1px solid ${C.border}`, padding:'6rem 2rem' }} id="schedule">
        <div style={s.container}>
          <div style={s.sectionLabel}>Mock & Sectional Schedule</div>
          <h2 style={s.sectionTitle}>Plan your prep, not just your practice</h2>
          <p style={{ fontFamily:'Georgia, serif', fontSize:'1rem', color:C.gray500, maxWidth:'560px', marginBottom:'3rem', lineHeight:'1.75' }}>
            All dates auto-update. Tests that have gone live are marked Live so you always know what's available right now.
          </p>

          {/* Summary card + full-length table side by side */}
          <div style={{ display:'grid', gridTemplateColumns:'580px 1fr', gap:'3rem', alignItems:'start', marginBottom:'3rem' }}>
            <MockScheduleCard exam={examSlug} />
            <div>
              <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:C.gray400, marginBottom:'0.875rem' }}>
                Full-Length Mocks — 31 Tests
              </p>
              <MockScheduleTable type="full" exam={examSlug} />
            </div>
          </div>

          {/* Sectionals */}
          <div>
            <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:C.gray400, marginBottom:'0.875rem' }}>
              Sectional Tests — 10 Sets (VARC · DILR · QA)
            </p>
            <MockScheduleTable type="sectional" exam={examSlug} />
          </div>

          {/* Bottom strip */}
          <div style={{ marginTop:'2rem', padding:'1.25rem 1.5rem', background:C.black, borderRadius:'4px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem' }}>
            <div>
              <p style={{ fontFamily:'Georgia, serif', fontSize:'0.95rem', color:'#fff', fontWeight:'700', marginBottom:'0.2rem' }}>
                Also includes 140 Area-wise Tests
              </p>
              <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:C.gray400 }}>
                Topic-level practice across Arithmetic, RC, Seating Arrangements and more
              </p>
            </div>
            <a href={TESTFUNDA_URL} target="_blank" rel="noreferrer"
              style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', color:'#fff', background:C.red, padding:'0.6rem 1.25rem', borderRadius:'3px', textDecoration:'none', whiteSpace:'nowrap' }}>
              View Full Test Centre ↗
            </a>
          </div>
        </div>
      </section>

      {/* ── THE EXPERIENCE ─────────────────────────────────────────────────── */}
      <section style={{ background:C.cream, borderTop:`1px solid ${C.border}`, padding:'6rem 2rem' }}>
        <div style={s.container}>
          <div style={s.sectionLabel}>The experience</div>
          <h2 style={s.sectionTitle}>Built to replicate exam day</h2>
          <div style={s.experienceGrid}>
            {[
              { icon:'⏱', title:'Real exam pressure', body:'A persistent countdown timer creates the same urgency you\'ll feel on test day. No pause, no extension.' },
              { icon:'🧩', title:'Section-wise structure', body:'VARC, DILR, and QA — each with accurate question counts, individual timing, and switching logic matching the real CAT.' },
              { icon:'🖥', title:'Clean, distraction-free interface', body:'No ads, no pop-ups, no clutter. The test environment is stripped to essentials so you can focus entirely on the questions.' },
              { icon:'📊', title:'Insight-driven analysis', body:"Your report doesn't just show your score — it shows where you lost time, which question types tripped you up, and where to focus next." },
            ].map((f,i) => (
              <div key={i} style={s.expCard}>
                <span style={s.expIcon}>{f.icon}</span>
                <h3 style={s.expTitle}>{f.title}</h3>
                <p style={s.expBody}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQs ───────────────────────────────────────────────────────────── */}
      <section style={{ background:C.white, borderTop:`1px solid ${C.border}`, padding:'6rem 2rem' }}>
        <div style={{ maxWidth:'860px', margin:'0 auto' }}>
          <div style={s.sectionLabel}>Common Questions</div>
          <h2 style={{ ...s.sectionTitle, marginBottom:'2.5rem' }}>Frequently asked questions</h2>
          <div style={{ display:'flex', flexDirection:'column', border:`1px solid ${C.border}`, borderRadius:'4px', overflow:'hidden' }}>
            {FAQS.map((faq, i) => (
              <div key={i} style={{ borderBottom: i<FAQS.length-1 ? `1px solid ${C.border}` : 'none', background:C.white }}>
                <button onClick={() => setOpenFaq(openFaq===i ? null : i)}
                  style={{ width:'100%', background:'none', border:'none', padding:'1.25rem 1.75rem', textAlign:'left', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', gap:'1rem' }}>
                  <span style={{ fontFamily:'Georgia, serif', fontSize:'0.95rem', fontWeight:'500', color:C.black, lineHeight:'1.5' }}>{faq.q}</span>
                  <span style={{ fontFamily:'var(--font-sans)', fontSize:'1.2rem', color:C.red, flexShrink:0, lineHeight:'1', transform: openFaq===i ? 'rotate(45deg)' : 'none', transition:'transform 0.25s' }}>+</span>
                </button>
                {openFaq===i && (
                  <div style={{ padding:'0 1.75rem 1.5rem' }}>
                    <p style={{ fontFamily:'Georgia, serif', fontSize:'0.9rem', color:C.gray600, lineHeight:'1.8' }}>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────────────────────────── */}
      <section style={{ background:C.black, borderTop:`3px solid ${C.red}`, padding:'6rem 2rem', textAlign:'center' }}>
        <div style={{ maxWidth:'640px', margin:'0 auto' }}>
          <p style={{ fontFamily:'Georgia, serif', fontSize:'1rem', color:C.gray400, fontStyle:'italic', marginBottom:'1.5rem', lineHeight:'1.7' }}>
            The best time to take a mock was last month. The next best time is now.
          </p>
          <h2 style={{ fontFamily:'Georgia, serif', fontSize:'clamp(2rem,3.5vw,2.8rem)', color:'#fff', fontWeight:'700', lineHeight:'1.15', marginBottom:'0.875rem' }}>
            One full-length test will tell you more about your preparation than two weeks of practice.
          </h2>
          <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.875rem', color:C.gray400, marginBottom:'2.5rem' }}>
            It's free to start.
          </p>
          <div style={{ display:'flex', justifyContent:'center', gap:'1rem', flexWrap:'wrap' }}>
            <a href={TESTFUNDA_URL} target="_blank" rel="noreferrer" style={s.btnPrimary}>
              Take the Mock Now →
            </a>
            <Link href={`/courses/${examSlug}`}
              style={{ display:'inline-block', background:'transparent', color:'rgba(255,255,255,0.6)', border:'1px solid rgba(255,255,255,0.2)', padding:'0.9rem 1.75rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.875rem', textDecoration:'none' }}>
              View CAT Course
            </Link>
          </div>
          <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:C.gray400, marginTop:'1.25rem' }}>
            Free mock available now — no credit card, no signup wall.
          </p>
        </div>
      </section>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity:1; transform:scale(1); }
          50%       { opacity:0.5; transform:scale(0.85); }
        }
      `}</style>
    </>
  )
}

// ── STEP WRAPPER ─────────────────────────────────────────────────────────────

function Step({ num, title, children }) {
  return (
    <div style={s.step}>
      <div style={s.stepNum}>
        <span style={s.stepNumText}>Step {num}</span>
        <div style={{ flex:1, height:'1px', background:C.border, maxWidth:'40px' }} />
      </div>
      <h3 style={s.stepTitle}>{title}</h3>
      <div style={s.stepIllustration}>{children[0]}</div>
      {children[1]}
    </div>
  )
}

// ── SVG ILLUSTRATIONS ─────────────────────────────────────────────────────────

// From live.png — actual exam interface
function SVGExamInterface() {
  return (
    <svg viewBox="0 0 600 380" style={{ width:'100%', maxWidth:'600px', borderRadius:'4px', boxShadow:'0 8px 40px rgba(0,0,0,0.15)' }}>
      {/* Header bar */}
      <rect width="600" height="44" fill="#1a1a2e"/>
      <rect x="8" y="10" width="24" height="24" rx="4" fill="#ff5e5f"/>
      <text x="38" y="27" fill="white" fontSize="11" fontWeight="700" fontFamily="sans-serif">GRADSKOOL</text>
      <text x="140" y="27" fill="#aaa" fontSize="10" fontFamily="sans-serif">Demo iCAT Full Length Mock Test</text>
      <text x="500" y="27" fill="#aaa" fontSize="9" fontFamily="sans-serif">Question Paper</text>
      <text x="560" y="27" fill="#aaa" fontSize="9" fontFamily="sans-serif">Instructions</text>

      {/* Section tabs */}
      <rect y="44" width="600" height="32" fill="#f0f0f0"/>
      <rect x="4" y="48" width="70" height="24" rx="3" fill="#2196f3"/>
      <text x="39" y="64" fill="white" fontSize="9" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">Group 1</text>
      <rect x="80" y="48" width="70" height="24" rx="3" fill="white" stroke="#ddd"/>
      <text x="115" y="64" fill="#555" fontSize="9" textAnchor="middle" fontFamily="sans-serif">Group 2</text>
      <rect x="156" y="48" width="70" height="24" rx="3" fill="white" stroke="#ddd"/>
      <text x="191" y="64" fill="#555" fontSize="9" textAnchor="middle" fontFamily="sans-serif">Group 3</text>
      <text x="480" y="64" fill="#333" fontSize="9" fontWeight="700" fontFamily="sans-serif">Time Left: 039:04</text>

      {/* Section label */}
      <rect y="76" width="600" height="28" fill="#e8f4f8"/>
      <rect x="4" y="80" width="180" height="20" rx="2" fill="#2196f3"/>
      <text x="94" y="94" fill="white" fontSize="9" textAnchor="middle" fontFamily="sans-serif">Verbal and Reading Comprehension</text>

      {/* Main area + right panel */}
      <rect y="104" width="430" height="240" fill="white" stroke="#eee"/>
      <rect x="430" y="104" width="170" height="240" fill="#f8f8f8" stroke="#eee"/>

      {/* Question */}
      <text x="16" y="124" fill="#333" fontSize="9" fontWeight="700" fontFamily="sans-serif">Question No. 11</text>
      <line x1="12" y1="128" x2="420" y2="128" stroke="#eee"/>
      <text x="16" y="143" fill="#222" fontSize="8" fontFamily="sans-serif" fontWeight="600">Five jumbled up sentences (labelled 1, 2, 3, 4 and 5), related to a topic,</text>
      <text x="16" y="154" fill="#222" fontSize="8" fontFamily="sans-serif" fontWeight="600">are given below. Identify the odd sentence.</text>
      {[1,2,3,4,5].map((n,i) => (
        <text key={n} x="16" y={170+i*12} fill="#444" fontSize="7.5" fontFamily="sans-serif">{n}. Sample sentence for para-jumble question number {n}...</text>
      ))}

      {/* Numpad */}
      <rect x="16" y="237" width="44" height="16" rx="2" fill="white" stroke="#ccc"/>
      <text x="38" y="249" fill="#333" fontSize="7" textAnchor="middle" fontFamily="sans-serif">Answer box</text>
      {[7,8,9,4,5,6,1,2,3,0].map((n,i) => {
        const col = i%3, row = Math.floor(i/3)
        return <rect key={n} x={16+col*20} y={258+row*15} width="18" height="13" rx="2" fill="white" stroke="#ccc" />
      })}

      {/* Right panel — question palette */}
      <text x="444" y="120" fill="#333" fontSize="8" fontWeight="700" fontFamily="sans-serif">Choose a Question</text>
      <text x="444" y="132" fill="#555" fontSize="7" fontFamily="sans-serif">Verbal and Reading Compreh...</text>
      {Array.from({length:24},(_,i) => {
        const col = i%4, row = Math.floor(i/4)
        const isRed = [0,8,9,10].includes(i)
        return (
          <g key={i}>
            <rect x={440+col*38} y={138+row*32} width="30" height="26" rx="2"
              fill={isRed ? '#e53e3e' : '#eee'} stroke={isRed ? '#c53030' : '#ddd'}/>
            <text x={455+col*38} y={155+row*32} fill={isRed ? 'white' : '#555'}
              fontSize="8" textAnchor="middle" fontFamily="sans-serif">{i+1}</text>
          </g>
        )
      })}

      {/* Status legend */}
      <rect x="434" y="104" width="166" height="26" fill="#f0f7ff"/>
      <circle cx="444" cy="117" r="5" fill="#22c55e"/>
      <text x="452" y="121" fill="#333" fontSize="7" fontFamily="sans-serif">Answered</text>
      <circle cx="490" cy="117" r="5" fill="#ef4444"/>
      <text x="498" y="121" fill="#333" fontSize="7" fontFamily="sans-serif">Not Answered: 4</text>

      {/* Bottom bar */}
      <rect y="324" width="600" height="56" fill="#f8f8f8" stroke="#eee"/>
      <rect x="8" y="332" width="110" height="28" rx="3" fill="white" stroke="#999"/>
      <text x="63" y="350" fill="#333" fontSize="8" textAnchor="middle" fontFamily="sans-serif">Mark for Review &amp; Next</text>
      <rect x="126" y="332" width="90" height="28" rx="3" fill="white" stroke="#999"/>
      <text x="171" y="350" fill="#333" fontSize="8" textAnchor="middle" fontFamily="sans-serif">Clear Response</text>
      <rect x="370" y="332" width="80" height="28" rx="3" fill="#2196f3"/>
      <text x="410" y="350" fill="white" fontSize="8" textAnchor="middle" fontFamily="sans-serif">Save &amp; Next</text>
      <rect x="460" y="332" width="70" height="28" rx="3" fill="white" stroke="#999"/>
      <text x="495" y="350" fill="#333" fontSize="8" textAnchor="middle" fontFamily="sans-serif">Save for Later</text>
      <rect x="538" y="332" width="54" height="28" rx="3" fill="#2196f3"/>
      <text x="565" y="350" fill="white" fontSize="8" textAnchor="middle" fontFamily="sans-serif">Submit</text>
    </svg>
  )
}

// From startmock.png — Instructions page
function SVGInstructions() {
  return (
    <svg viewBox="0 0 400 260" style={{ width:'100%', borderRadius:'4px', border:`1px solid ${C.border}` }}>
      <rect width="400" height="260" fill="white"/>
      <text x="20" y="30" fill="#222" fontSize="11" fontWeight="700" fontFamily="sans-serif">General Instructions:</text>
      {[
        '1. Total duration of the test is 120 minutes.',
        '2. Time allotted to each section is 40 minutes.',
        '3. Some questions will be MCQ, some non-MCQ.',
        '4. On-screen calculator will be provided.',
        '5. The Question Palette shows the status of each question.',
      ].map((line,i) => (
        <text key={i} x="20" y={50+i*22} fill="#444" fontSize="9" fontFamily="sans-serif">{line}</text>
      ))}
      {/* Palette legend table */}
      <rect x="20" y="168" width="280" height="16" fill="#f0f0f0" stroke="#ddd"/>
      <text x="40" y="180" fill="#444" fontSize="8" fontFamily="sans-serif">S.No.</text>
      <text x="90" y="180" fill="#444" fontSize="8" fontFamily="sans-serif">Question with Status</text>
      <text x="230" y="180" fill="#444" fontSize="8" fontFamily="sans-serif">Meaning</text>
      {[
        ['A', '#e0e0e0', 'You have not visited the question yet.'],
        ['B', '#e53e3e', 'Visited but not answered.'],
        ['C', '#22c55e', 'Answered.'],
      ].map(([label, color, text], i) => (
        <g key={label}>
          <rect x="20" y={184+i*18} width="280" height="18" fill={i%2===0?'white':'#fafafa'} stroke="#ddd"/>
          <text x="40" y={197+i*18} fill="#444" fontSize="8" fontFamily="sans-serif">{label}</text>
          <rect x="82" y={187+i*18} width="22" height="12" rx="3" fill={color}/>
          <text x="93" y={196+i*18} fill="white" fontSize="7" textAnchor="middle" fontFamily="sans-serif">1</text>
          <text x="115" y={197+i*18} fill="#444" fontSize="8" fontFamily="sans-serif">{text}</text>
        </g>
      ))}
      <rect x="300" y="228" width="80" height="22" rx="3" fill="white" stroke="#999"/>
      <text x="340" y="243" fill="#333" fontSize="9" textAnchor="middle" fontFamily="sans-serif">Next &gt;</text>
    </svg>
  )
}

// From interface.png — Launch dialog
function SVGLaunchDialog({ small = false }) {
  const h = small ? 180 : 240
  return (
    <svg viewBox={`0 0 360 ${h}`} style={{ width:'100%', borderRadius:'4px', border:`1px solid ${C.border}` }}>
      <rect width="360" height={h} fill="white"/>
      <text x="24" y="36" fill="#222" fontSize="14" fontWeight="700" fontFamily="sans-serif">iCAT 30</text>
      <text x="24" y="52" fill="#888" fontSize="10" fontFamily="sans-serif">Full Length Mock Test</text>
      <text x="24" y="78" fill="#444" fontSize="10" fontFamily="sans-serif">Test Time Limit: <tspan fontWeight="700">2h</tspan></text>
      <text x="24" y="96" fill="#444" fontSize="10" fontFamily="sans-serif">Time Remaining: <tspan fontWeight="700">2h</tspan></text>
      <text x="24" y="114" fill="#444" fontSize="10" fontFamily="sans-serif">Attempts Left: <tspan fontWeight="700">1</tspan></text>
      {/* Radio options */}
      <circle cx="36" cy="138" r="7" fill="none" stroke="#2196f3" strokeWidth="2"/>
      <circle cx="36" cy="138" r="4" fill="#2196f3"/>
      <text x="50" y="143" fill="#222" fontSize="10" fontWeight="700" fontFamily="sans-serif">IIM CAT Player look</text>
      <text x="185" y="143" fill="#e53e3e" fontSize="10" fontFamily="sans-serif">*</text>
      <circle cx="36" cy="162" r="7" fill="none" stroke="#ccc" strokeWidth="2"/>
      <text x="50" y="167" fill="#444" fontSize="10" fontWeight="700" fontFamily="sans-serif">Classic TestFunda Player look</text>
      {!small && (
        <>
          <text x="24" y="192" fill="#666" fontSize="8.5" fontFamily="sans-serif">*This is a replica of the Official Test Player.</text>
          <rect x="90" y="208" width="70" height="24" rx="4" fill="#26bfa8"/>
          <text x="125" y="224" fill="white" fontSize="10" textAnchor="middle" fontFamily="sans-serif">Launch</text>
          <rect x="172" y="208" width="70" height="24" rx="4" fill="#26bfa8"/>
          <text x="207" y="224" fill="white" fontSize="10" textAnchor="middle" fontFamily="sans-serif">Close</text>
        </>
      )}
    </svg>
  )
}

// From live.png — smaller exam interface for steps
function SVGLiveExam() {
  return (
    <svg viewBox="0 0 400 220" style={{ width:'100%', borderRadius:'4px', border:`1px solid ${C.border}` }}>
      <rect width="400" height="220" fill="white"/>
      <rect width="400" height="30" fill="#1a1a2e"/>
      <text x="12" y="20" fill="white" fontSize="9" fontWeight="700" fontFamily="sans-serif">GRADSKOOL · Demo iCAT Full Length Mock Test</text>
      <text x="340" y="20" fill="#aaa" fontSize="8" fontFamily="sans-serif">039:04</text>
      <rect y="30" width="400" height="22" fill="#e8f4f8"/>
      <rect x="4" y="34" width="130" height="14" rx="2" fill="#2196f3"/>
      <text x="69" y="45" fill="white" fontSize="8" textAnchor="middle" fontFamily="sans-serif">Verbal and Reading Comprehension</text>
      <text x="14" y="70" fill="#555" fontSize="8" fontWeight="700" fontFamily="sans-serif">Question No. 11</text>
      <text x="14" y="84" fill="#222" fontSize="7.5" fontFamily="sans-serif">Five jumbled up sentences, related to a topic, are given below.</text>
      <text x="14" y="95" fill="#222" fontSize="7.5" fontFamily="sans-serif">Identify the odd sentence and key in the number.</text>
      {[1,2,3,4,5].map((n,i) => (
        <text key={n} x="14" y={110+i*12} fill="#444" fontSize="7" fontFamily="sans-serif">{n}. Sample sentence {n} for para-jumble question...</text>
      ))}
      {/* Right panel */}
      <rect x="290" y="52" width="110" height="140" fill="#f8f8f8" stroke="#eee"/>
      <text x="296" y="68" fill="#333" fontSize="7" fontWeight="700" fontFamily="sans-serif">Choose a Question</text>
      {Array.from({length:16},(_,i) => {
        const col=i%4, row=Math.floor(i/4)
        const isRed=[0,8,9,10].includes(i)
        return <rect key={i} x={296+col*24} y={72+row*22} width="20" height="18" rx="2" fill={isRed?'#e53e3e':'#eee'} stroke={isRed?'#c53030':'#ddd'}/>
      })}
      {/* Bottom */}
      <rect y="192" width="400" height="28" fill="#f8f8f8"/>
      <rect x="4" y="196" width="80" height="20" rx="2" fill="white" stroke="#999"/>
      <text x="44" y="209" fill="#333" fontSize="7" textAnchor="middle" fontFamily="sans-serif">Mark for Review</text>
      <rect x="260" y="196" width="60" height="20" rx="2" fill="#2196f3"/>
      <text x="290" y="209" fill="white" fontSize="7" textAnchor="middle" fontFamily="sans-serif">Save &amp; Next</text>
      <rect x="330" y="196" width="64" height="20" rx="2" fill="#2196f3"/>
      <text x="362" y="209" fill="white" fontSize="7" textAnchor="middle" fontFamily="sans-serif">Submit</text>
    </svg>
  )
}

// From overview.png — results summary table
function SVGOverview() {
  return (
    <svg viewBox="0 0 480 200" style={{ width:'100%', borderRadius:'4px', border:`1px solid ${C.border}` }}>
      <rect width="480" height="200" fill="white"/>
      <text x="20" y="22" fill="#222" fontSize="11" fontWeight="700" fontFamily="sans-serif">Summary</text>
      {/* Table header */}
      <rect x="10" y="30" width="460" height="22" fill="#6b7f6b"/>
      {['Section','Total','Accuracy','Marks','Percentile','Time'].map((h,i) => (
        <text key={h} x={20+i*75} y="45" fill="white" fontSize="8" fontWeight="700" fontFamily="sans-serif">{h}</text>
      ))}
      {/* Rows */}
      {[
        ['VARC','24','0%','0/72','54.55','40 min'],
        ['DILR','22','0%','0/66','54.55','40 min'],
        ['QA','22','100%','3/66','72.73','40 min'],
        ['Overall','68','—','3/204','54.55','2 hr'],
      ].map(([sec,...cols],i) => (
        <g key={sec}>
          <rect x="10" y={52+i*34} width="460" height="34" fill={i%2===0?'white':'#f7f7f7'} stroke="#eee"/>
          <text x="20" y={73+i*34} fill="#222" fontSize="8" fontWeight="600" fontFamily="sans-serif">{sec}</text>
          {cols.map((val,j) => (
            <text key={j} x={95+j*75} y={73+i*34} fill={j===3 ? '#166534' : '#444'} fontSize="8" fontFamily="sans-serif" fontWeight={j===3?'700':'400'}>{val}</text>
          ))}
          {/* C/I/U bar */}
          <rect x="120" y={58+i*34} width="50" height="6" rx="2" fill="#ddd"/>
          <rect x="120" y={58+i*34} width={sec==='QA'?5:0} height="6" rx="2" fill="#22c55e"/>
        </g>
      ))}
    </svg>
  )
}

// From solutions.png — solution key
function SVGSolutions() {
  return (
    <svg viewBox="0 0 480 220" style={{ width:'100%', borderRadius:'4px', border:`1px solid ${C.border}` }}>
      <rect width="480" height="220" fill="white"/>
      {/* Left panel */}
      <rect width="120" height="220" fill="#f8f8f8" stroke="#eee"/>
      <text x="10" y="20" fill="#333" fontSize="8" fontWeight="700" fontFamily="sans-serif">✓ VARC</text>
      <text x="10" y="34" fill="#888" fontSize="8" fontFamily="sans-serif">DILR</text>
      <text x="10" y="48" fill="#888" fontSize="8" fontFamily="sans-serif">QA</text>
      {Array.from({length:24},(_,i) => {
        const col=i%4, row=Math.floor(i/4)
        const color=['#22c55e','#e53e3e','#aaa'][i%3===0?0:i%3===1?1:2]
        return <circle key={i} cx={16+col*24} cy={68+row*20} r="8" fill="none" stroke={color} strokeWidth="1.5"/>
      })}
      <text x="8" y="182" fill="#22c55e" fontSize="7" fontFamily="sans-serif">● Correct</text>
      <text x="8" y="194" fill="#e53e3e" fontSize="7" fontFamily="sans-serif">● Incorrect</text>
      <text x="8" y="206" fill="#aaa" fontSize="7" fontFamily="sans-serif">● Unattempted</text>
      {/* Right panel */}
      <text x="132" y="20" fill="#555" fontSize="9" fontWeight="700" fontFamily="sans-serif">Question 1</text>
      <text x="132" y="38" fill="#222" fontSize="8" fontWeight="600" fontFamily="sans-serif">There is a sentence missing in the paragraph below.</text>
      <text x="132" y="52" fill="#222" fontSize="8" fontWeight="600" fontFamily="sans-serif">Look at the passage and decide where it fits.</text>
      <rect x="132" y="60" width="340" height="80" rx="2" fill="#f9f9f9" stroke="#eee"/>
      <text x="140" y="76" fill="#444" fontSize="7.5" fontFamily="sans-serif">Dhaka muslin, once the world's most prized fabric, vanished</text>
      <text x="140" y="88" fill="#444" fontSize="7.5" fontFamily="sans-serif">despite its unmatched beauty and craftsmanship. ___1___.</text>
      <text x="140" y="100" fill="#444" fontSize="7.5" fontFamily="sans-serif">Known for its extraordinary softness and transparency...</text>
      {['Option 2','Option 1','Option 4','Option 3'].map((opt,i) => (
        <g key={opt}>
          <circle cx="140" cy={152+i*16} r="5" fill="none" stroke="#ccc" strokeWidth="1.5"/>
          <text x="150" y={156+i*16} fill="#444" fontSize="8" fontFamily="sans-serif">{opt}</text>
        </g>
      ))}
      <text x="132" y="220" fill="#2196f3" fontSize="8" fontFamily="sans-serif">View Solution · View Video Explanation</text>
    </svg>
  )
}

// From percentile.png — national percentile
function SVGPercentile() {
  return (
    <svg viewBox="0 0 480 180" style={{ width:'100%', borderRadius:'4px', border:`1px solid ${C.border}` }}>
      <rect width="480" height="180" fill="white"/>
      <text x="20" y="22" fill="#222" fontSize="11" fontWeight="700" fontFamily="sans-serif">Summary</text>
      <rect x="10" y="30" width="460" height="22" fill="#f0f0f0" stroke="#ddd"/>
      <text x="140" y="45" fill="#333" fontSize="8" fontFamily="sans-serif">Rank <tspan fontWeight="700">5/11</tspan></text>
      <text x="320" y="45" fill="#333" fontSize="8" fontFamily="sans-serif">Time Taken <tspan fontWeight="700">2 hr</tspan></text>
      {/* Table */}
      <rect x="10" y="52" width="460" height="18" fill="#6b7f6b"/>
      {['Section','Total','Marks','Cutoff','Percentile','Remark'].map((h,i) => (
        <text key={h} x={20+i*75} y="65" fill="white" fontSize="8" fontWeight="700" fontFamily="sans-serif">{h}</text>
      ))}
      {[
        ['VARC','24','0/72 (0%)','N.A.','54.55',''],
        ['DILR','22','0/66 (0%)','N.A.','54.55',''],
        ['QA','22','3/66 (5%)','N.A.','72.73',''],
        ['Overall','68','3.00/204','N.A.','54.55',''],
      ].map(([sec,...cols],i) => (
        <g key={sec}>
          <rect x="10" y={70+i*26} width="460" height="26" fill={i%2===0?'white':'#f7f7f7'} stroke="#eee"/>
          <text x="20" y={87+i*26} fill="#222" fontSize="8" fontWeight="600" fontFamily="sans-serif">{sec}</text>
          {cols.map((val,j) => (
            <text key={j} x={95+j*75} y={87+i*26} fill={j===3?'#166534':'#444'} fontSize="8" fontFamily="sans-serif" fontWeight={j===3?'700':'400'}>{val}</text>
          ))}
        </g>
      ))}
    </svg>
  )
}

// From time.png — pie chart time allocation
function SVGTimeChart() {
  const cx=200, cy=110, r=70
  const sections = [
    { label:'VARC', pct:33.33, color:'#7c3aed', startAngle:0 },
    { label:'DILR', pct:33.33, color:'#1d4ed8', startAngle:120 },
    { label:'QA',   pct:33.34, color:'#92400e', startAngle:240 },
  ]
  const polarToCart = (cx,cy,r,deg) => {
    const rad = (deg-90)*Math.PI/180
    return [cx+r*Math.cos(rad), cy+r*Math.sin(rad)]
  }
  return (
    <svg viewBox="0 0 400 230" style={{ width:'100%', borderRadius:'4px', border:`1px solid ${C.border}` }}>
      <rect width="400" height="230" fill="white"/>
      <text x="20" y="22" fill="#222" fontSize="11" fontWeight="700" fontFamily="sans-serif">Time Taken Section Wise</text>
      {sections.map((sec) => {
        const [x1,y1]=polarToCart(cx,cy,r,sec.startAngle)
        const [x2,y2]=polarToCart(cx,cy,r,sec.startAngle+120)
        return (
          <path key={sec.label}
            d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`}
            fill={sec.color} stroke="white" strokeWidth="2"/>
        )
      })}
      {/* Labels */}
      <text x="285" y="80" fill="#7c3aed" fontSize="8" fontFamily="sans-serif">VARC: 00:40:00 (33.33%)</text>
      <text x="10" y="140" fill="#92400e" fontSize="8" fontFamily="sans-serif">QA: 00:40:00 (33.33%)</text>
      <text x="250" y="175" fill="#1d4ed8" fontSize="8" fontFamily="sans-serif">DILR: 00:40:00 (33.33%)</text>
      {/* Legend */}
      {[['#7c3aed','VARC'],['#1d4ed8','DILR'],['#92400e','QA']].map(([color,label],i) => (
        <g key={label}>
          <circle cx={30+i*110} cy={210} r="5" fill={color}/>
          <text x={40+i*110} y={214} fill="#444" fontSize="8" fontFamily="sans-serif">{label}</text>
        </g>
      ))}
      <text x="70" y="226" fill="#333" fontSize="8" fontFamily="sans-serif">TOTAL TIME: <tspan fontWeight="700">2 hr</tspan></text>
      <text x="250" y="226" fill="#333" fontSize="8" fontFamily="sans-serif">EXAM LIMIT: <tspan fontWeight="700">2 hr</tspan></text>
    </svg>
  )
}

// From mock_test.png — mock list
function SVGMockList() {
  return (
    <svg viewBox="0 0 480 160" style={{ width:'100%', borderRadius:'4px', border:`1px solid ${C.border}` }}>
      <rect width="480" height="160" fill="white"/>
      <rect width="480" height="30" fill="#1a1a2e"/>
      <text x="16" y="20" fill="white" fontSize="10" fontWeight="700" fontFamily="sans-serif">GS</text>
      <rect x="400" y="8" width="40" height="16" rx="8" fill="transparent" stroke="#26bfa8" strokeWidth="1.5"/>
      <text x="420" y="20" fill="#26bfa8" fontSize="8" textAnchor="middle" fontFamily="sans-serif">LOGIN</text>
      <text x="450" y="20" fill="white" fontSize="8" fontFamily="sans-serif">SIGN UP</text>
      <text x="16" y="48" fill="#6b7f6b" fontSize="11" fontWeight="700" fontFamily="sans-serif">CAT</text>
      {/* Table header */}
      <rect x="10" y="55" width="460" height="18" fill="#c8d8b8"/>
      {['Test Name','Time','Status','Action'].map((h,i) => (
        <text key={h} x={20+i*120} y="68" fill="#444" fontSize="8" fontWeight="700" fontFamily="sans-serif">{h}</text>
      ))}
      {[
        ['Demo iCAT Full Length Mock Test','2h','Not Attempted','Attempt'],
        ['iCAT 30','2h','Available On 15-Apr-2026','Reports'],
        ['iCAT 29','2h','Available On 30-Apr-2026','Reports'],
        ['iCAT 28','2h','Available On 12-May-2026','Reports'],
      ].map(([name,time,status,action],i) => (
        <g key={name}>
          <rect x="10" y={73+i*20} width="460" height="20" fill={i%2===0?'white':'#f9f9f9'} stroke="#eee"/>
          <text x="20" y={87+i*20} fill={i===0?'#222':'#999'} fontSize="8" fontFamily="sans-serif">{name}</text>
          {i===0 && <rect x="200" y={76+i*20} width="24" height="12" rx="2" fill="#22c55e"/>}
          {i===0 && <text x="212" y={86+i*20} fill="white" fontSize="7" textAnchor="middle" fontFamily="sans-serif">FREE</text>}
          <text x="142" y={87+i*20} fill={i===0?'#444':'#aaa'} fontSize="8" fontFamily="sans-serif">{time}</text>
          <text x="262" y={87+i*20} fill={i===0?'#444':'#aaa'} fontSize="7.5" fontFamily="sans-serif">{status}</text>
          <text x="410" y={87+i*20} fill="#888" fontSize="7.5" fontFamily="sans-serif">{action}</text>
        </g>
      ))}
    </svg>
  )
}

// From prompt.png — login prompt
function SVGLoginPrompt() {
  return (
    <svg viewBox="0 0 360 120" style={{ width:'100%', maxWidth:'360px', borderRadius:'4px', border:`1px solid ${C.border}` }}>
      <rect width="360" height="120" fill="white"/>
      <text x="30" y="42" fill="#333" fontSize="11" fontFamily="sans-serif">This exam is available <tspan fontWeight="700">FREE</tspan> to all registered users.</text>
      <text x="30" y="60" fill="#333" fontSize="11" fontFamily="sans-serif">Please <tspan fill="#2196f3">login</tspan> to launch this exam.</text>
      <rect x="140" y="78" width="80" height="28" rx="6" fill="#26bfa8"/>
      <text x="180" y="97" fill="white" fontSize="11" textAnchor="middle" fontFamily="sans-serif">OK</text>
    </svg>
  )
}

// From create.png — signup form
function SVGCreateAccount() {
  return (
    <svg viewBox="0 0 440 260" style={{ width:'100%', borderRadius:'4px', border:`1px solid ${C.border}` }}>
      <rect width="440" height="260" fill="white"/>
      {[['Name','Username'],['Password','Confirm Password'],['Email','Select a city'],['Contact No.','Date of Birth']].map(([l,r],row) => (
        <g key={l}>
          <text x="20" y={32+row*52} fill="#bbb" fontSize="10" fontFamily="sans-serif">{l}</text>
          <line x1="20" y1={38+row*52} x2="200" y2={38+row*52} stroke="#ddd"/>
          <text x="230" y={32+row*52} fill="#bbb" fontSize="10" fontFamily="sans-serif">{r}</text>
          <line x1="230" y1={38+row*52} x2="420" y2={38+row*52} stroke="#ddd"/>
        </g>
      ))}
      <circle cx="30" cy="222" r="6" fill="#26bfa8"/>
      <text x="42" y="226" fill="#444" fontSize="9" fontFamily="sans-serif">Male</text>
      <circle cx="90" cy="222" r="6" fill="none" stroke="#26bfa8" strokeWidth="1.5"/>
      <text x="102" y="226" fill="#444" fontSize="9" fontFamily="sans-serif">Female</text>
      <rect x="10" y="236" width="420" height="18" rx="3" fill="#26bfa8"/>
      <text x="220" y="249" fill="white" fontSize="10" textAnchor="middle" fontFamily="sans-serif">Signup →</text>
    </svg>
  )
}

// ── STYLES ────────────────────────────────────────────────────────────────────

const s = {
  container: { maxWidth:'1160px', margin:'0 auto' },
  sectionLabel: { fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'500', letterSpacing:'0.1em', textTransform:'uppercase', color:C.red, marginBottom:'0.6rem' },
  sectionTitle: { fontFamily:'Georgia, serif', fontSize:'clamp(1.9rem,3vw,2.6rem)', color:C.black, fontWeight:'700', lineHeight:'1.15', marginBottom:'1rem' },

  // Hero
  hero: { background:C.cream, padding:'6rem 2rem 5rem', borderBottom:`1px solid ${C.border}` },
  heroInner: { maxWidth:'1160px', margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'5rem', alignItems:'center' },
  heroLeft: {},
  heroPill: { display:'inline-block', fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'500', color:C.gray500, background:'rgba(0,0,0,0.06)', padding:'0.25rem 0.75rem', borderRadius:'100px', marginBottom:'1.5rem' },
  heroTitle: { fontFamily:'Georgia, serif', fontSize:'clamp(2.5rem,4.5vw,3.8rem)', fontWeight:'700', color:C.black, lineHeight:'1.1', marginBottom:'1.25rem' },
  heroEm: { color:C.red, fontStyle:'italic', fontWeight:'400' },
  heroSub: { fontFamily:'Georgia, serif', fontSize:'1.05rem', color:C.gray600, lineHeight:'1.75', maxWidth:'480px', marginBottom:'2rem' },
  heroBtns: { display:'flex', gap:'1rem', marginBottom:'1.5rem', flexWrap:'wrap' },
  btnPrimary: { display:'inline-block', background:C.red, color:'#fff', padding:'0.875rem 2rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.9rem', fontWeight:'700', textDecoration:'none' },
  btnOutline: { display:'inline-block', background:'transparent', color:C.black, padding:'0.875rem 1.75rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.9rem', fontWeight:'600', textDecoration:'none', border:`1.5px solid ${C.black}` },
  heroStats: { display:'flex', gap:'0.5rem', flexWrap:'wrap' },
  heroStatPill: { display:'inline-flex', alignItems:'center', gap:'0.4rem', fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:C.gray500, background:'white', border:`1px solid ${C.border}`, padding:'0.3rem 0.75rem', borderRadius:'100px' },
  heroStatLabel: {},
  heroRight: { display:'flex', alignItems:'center', justifyContent:'center' },

  // Problem
  problem: { padding:'6rem 2rem', background:C.white, borderBottom:`1px solid ${C.border}` },
  problemGrid: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1.5rem', marginTop:'2.5rem' },
  problemCard: { padding:'2rem', background:C.gray50, border:`1px solid ${C.border}`, borderRadius:'4px' },
  problemIcon: { fontSize:'1.75rem', display:'block', marginBottom:'0.875rem' },
  problemCardTitle: { fontFamily:'Georgia, serif', fontSize:'1.05rem', fontWeight:'700', color:C.black, marginBottom:'0.5rem', lineHeight:'1.35' },
  problemCardBody: { fontFamily:'Georgia, serif', fontSize:'0.9rem', color:C.gray600, lineHeight:'1.75' },

  // How it works
  hiw: { padding:'6rem 2rem', background:C.white },
  stepsGrid: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'2.5rem 2rem' },
  step: { display:'flex', flexDirection:'column', gap:'0.875rem' },
  stepNum: { display:'flex', alignItems:'center', gap:'8px' },
  stepNumText: { fontFamily:'Georgia, serif', fontSize:'13px', color:C.gray400 },
  stepTitle: { fontFamily:'Georgia, serif', fontSize:'1.1rem', fontWeight:'700', color:C.black, lineHeight:'1.3' },
  stepIllustration: { borderRadius:'4px', overflow:'hidden' },
  stepBody: { fontFamily:'Georgia, serif', fontSize:'0.875rem', color:C.gray600, lineHeight:'1.75' },

  // Journey
  journeyTimeline: { display:'flex', flexDirection:'column', gap:0 },
  jstep: { display:'flex', gap:'28px', paddingBottom:'48px' },
  jstepAside: { display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0, width:'44px' },
  jstepCircle: { width:'44px', height:'44px', borderRadius:'50%', background:C.red, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Georgia, serif', fontSize:'1.1rem', fontWeight:'700', flexShrink:0 },
  jstepLine: { flex:1, width:'2px', background:C.border, margin:'8px 0' },
  jstepContent: { flex:1, paddingTop:'8px' },
  jstepTitle: { fontFamily:'Georgia, serif', fontSize:'1.1rem', fontWeight:'700', color:C.black, marginBottom:'0.4rem' },
  jstepBody: { fontFamily:'Georgia, serif', fontSize:'0.9rem', color:C.gray600, lineHeight:'1.75', marginBottom:'1rem' },
  jstepSvg: { marginTop:'0.5rem', maxWidth:'480px' },

  // Schedule table
  scheduleTable: { border:`1px solid ${C.border}`, borderRadius:'4px', overflow:'hidden' },
  scheduleHeader: { display:'grid', gridTemplateColumns:'2fr 80px 2fr 100px', background:'#4a5f4a', padding:'0.75rem 1.25rem', gap:'1rem' },
  scheduleHeaderCell: { fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'700', letterSpacing:'0.06em', textTransform:'uppercase', color:'#d0e8d0' },
  scheduleRow: { display:'grid', gridTemplateColumns:'2fr 80px 2fr 100px', padding:'0.875rem 1.25rem', gap:'1rem', borderTop:`1px solid ${C.border}`, alignItems:'center' },
  scheduleTestName: { fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'500', color:C.black },
  scheduleCell: { fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:C.gray500 },

  // Experience
  experienceGrid: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1.5rem', marginTop:'2.5rem' },
  expCard: { padding:'1.75rem', background:C.white, border:`1px solid ${C.border}`, borderRadius:'4px' },
  expIcon: { fontSize:'1.75rem', display:'block', marginBottom:'0.875rem' },
  expTitle: { fontFamily:'Georgia, serif', fontSize:'1.05rem', fontWeight:'700', color:C.black, marginBottom:'0.5rem' },
  expBody: { fontFamily:'Georgia, serif', fontSize:'0.875rem', color:C.gray600, lineHeight:'1.75' },
}

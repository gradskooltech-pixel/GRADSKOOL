/**
 * GRADSKOOL — CAT Hub Page
 * Route: /courses/cat (and /cat)
 *
 * Contains both products:
 *  - CATalysis (flagship cohort, ₹17,999) — main content
 *  - CAThlete (crash course, ₹6,999/₹9,999) — anchored at #cathlete
 */
import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import PageSEO, { courseSchema, faqSchema, howToSchema } from '../../components/seo/PageSEO'
import { S, CourseFaqAccordion, WaFloat, CourseTestimonials } from '../../components/courses/CourseLayout'
import CatTabs from '../../components/courses/CatTabs'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
const R = { color:'var(--red)' }

/**
 * Fallback values — used until the real data exists in the DB.
 * `exam.exam_date` isn't seeded yet (seed_courses.py never sets it), and
 * CAThlete has no PricingPlan/Course record at all yet. Once those are
 * filled in via Django admin, this page switches over automatically —
 * no code change needed. See PDF_LIBRARY_LOCAL_SETUP.md-style note: this
 * is the same "admin panel drives the page" pattern discussed for seasonality.
 */
const FALLBACK = {
  examDate: '2026-11-29',
  cohortSize: 27,
  catalysisPrice: 17999,
  cathleteBasePrice: 6999,
  cathleteMocksPrice: 9999,
  cathleteStart: '2026-09-03',
}

function formatDate(iso) {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return null
  }
}

function fmtPrice(n) {
  return `₹${Number(n).toLocaleString('en-IN')}`
}

export async function getStaticProps() {
  try {
    const res = await fetch(`${API}/courses/exams/cat/`)
    const examData = res.ok ? await res.json() : null
    return { props: { examData }, revalidate: 300 }
  } catch {
    return { props: { examData: null }, revalidate: 60 }
  }
}

const STAGES = [
  { n:'01', name:'Intro Video',       desc:'English introduction to every concept before the live session so no time is lost on basics in class.' },
  { n:'02', name:'Live Session + PDF', desc:'Two-way live teaching with ALP Sir. Real questions, challenges, structured reasoning — not a monologue. Session PDF included.' },
  { n:'03', name:'Cheat Sheet',        desc:'Distilled one-pager of every concept, formula, and shortcut. The document open on your desk on revision day.' },
  { n:'04', name:'Quiz',               desc:'Timed practice to test application, not just recall. Immediate explanations for every question.' },
  { n:'05', name:'Doubt Resolution',   desc:'Structured doubt sessions so no question goes unanswered. Every concept stays sharp through exam day.' },
]

const SYLLABUS = [
  { sec:'VARC', topics:['Reading Comprehension passages','Para-jumbles','Para-summary','Odd sentence identification','Vocabulary in context','Critical reasoning'] },
  { sec:'DILR', topics:['DI caselets: tables, graphs, charts','Arrangements & scheduling','Puzzles & grid-based LR','Blood relations & direction sense','Games & tournaments','Data sets & inference'] },
  { sec:'QA',   topics:['Arithmetic — ratio, percentage, profit-loss, TSD','Algebra — linear & quadratic equations','Geometry & mensuration','Number systems & progressions','Permutation, combination & probability','Modern math & functions'] },
]

const COLLEGES = [
  { name:'IIM Ahmedabad',  courses:'PGP, PGPX, ePGP',      note:'#1 B-school in India' },
  { name:'IIM Bangalore',  courses:'PGP, PGPM, Executive',  note:'Top 3 consistently' },
  { name:'IIM Calcutta',   courses:'MBA, PGDM',             note:'Oldest IIM' },
  { name:'IIM Lucknow',    courses:'PGP, PGP-ABM, PGP-SM', note:'Recognised globally' },
  { name:'IIM Kozhikode',  courses:'PGDM, PGDM-B, PGPM',   note:'Strong placements' },
  { name:'IIM Indore',     courses:'PGPM, PGP-HRM',         note:'IPM + PGP' },
  { name:'FMS Delhi',      courses:'MBA',                   note:'University of Delhi' },
  { name:'MDI Gurgaon',    courses:'PGDM, PGDM-HR',        note:'Strong corp connect' },
]

const TESTIS = [
  { text:"Being part of GRADSKOOL has been a completely different learning experience. Each class is structured so a topic feels truly completed. Learning from ALP Sir is something special — he explains every topic from multiple perspectives and builds the right way of thinking, not just the right answers.", name:'Keshav Mundra', detail:'GMAT Cohort' },
  { text:"The structure and execution are unlike anything I have experienced before. The two-way live classes are what make GRADSKOOL stand apart. I could clear every doubt in the session itself — no waiting, no ambiguity. The 27-student limit is not marketing. You feel it in every class.", name:'Vanshaj Jaiman', detail:'CAT 2026 Cohort' },
  { text:"From my CAT journey to XAT, ALP Sir stood with us at every step. The GDPI preparation was perfectly structured. The mock interviews prepared me for exactly what I faced in the actual B-school interviews. This level of mentorship is genuinely rare.", name:'Sameer Ansari', detail:'CAT & XAT · PI WAT GD Cohort' },
]

export default function CATPage({ examData }) {
  const [addonOpen, setAddonOpen] = useState(false)

  const plans = examData?.plans || []
  const catalysisPlan = plans.find(p => p.slug === 'live-cat-mocks')
  // CAThlete has no PricingPlan or Course record yet — these stay on
  // FALLBACK until someone adds them via Django admin. Once a Course exists
  // with 'cathlete' in its slug/title, this picks it up automatically.
  const cathleteBase   = plans.find(p => p.slug === 'cathlete-no-mocks')
  const cathleteMocks  = plans.find(p => p.slug === 'cathlete-with-mocks')
  const cathleteCourse = (examData?.courses || []).find(
    c => c.slug?.includes('cathlete') || c.title?.toLowerCase().includes('cathlete')
  )

  const catalysisPrice     = catalysisPlan?.price_inr  ? Number(catalysisPlan.price_inr)  : FALLBACK.catalysisPrice
  const cathleteBasePrice  = cathleteBase?.price_inr   ? Number(cathleteBase.price_inr)   : FALLBACK.cathleteBasePrice
  const cathleteMocksPrice = cathleteMocks?.price_inr  ? Number(cathleteMocks.price_inr)  : FALLBACK.cathleteMocksPrice
  const cohortSize         = examData?.seats_available?.cohort_size || FALLBACK.cohortSize
  const examDateFormatted      = formatDate(examData?.exam_date) || formatDate(FALLBACK.examDate)
  const cathleteStartFormatted = formatDate(cathleteCourse?.start_date) || formatDate(FALLBACK.cathleteStart)
  // Drives every "CAT 2026" mention on the page — pulled from the real
  // exam date once it's set in admin, so a year rollover never needs a code change again.
  const examYear = new Date(examData?.exam_date || FALLBACK.examDate).getFullYear()
  // CATalysis is sold as next year's cohort (too late to start a full-year
  // programme for an exam 3-4 months out) — a separate product-year label
  // from the actual near-term exam CAThlete crash-courses toward. Don't
  // conflate the two: this is intentionally examYear + 1, not the same value.
  const catalysisYear = examYear + 1

  const FAQS = [
    { q:'What is CATalysis?', a:`CATalysis is GRADSKOOL's flagship CAT ${catalysisYear} preparation cohort taught by Abhishek Leela Pandey (ALP Sir). It covers VARC, DILR, and QA across 400+ hours of live two-way sessions, with 30 full-length mocks and a structured 5-stage learning framework.` },
    { q:'What is the CAT exam date?', a:`CAT ${examYear} is expected on ${examDateFormatted}. The exam is conducted by one of the IIMs on rotation and spans two to three slots across the day.` },
    { q:'How many students are in each CATalysis cohort?', a:`Every CATalysis cohort is capped at ${cohortSize} students, always. This ensures ALP Sir can give individual attention, track every student's progress, and maintain the quality of every session.` },
    { q:'What is included in the base CATalysis price?', a:`CATalysis at ${fmtPrice(catalysisPrice)} includes 400+ hours of live two-way sessions, 30 full-length CAT mocks, 30 sectional tests, post-mock analysis, session PDFs, cheat sheets, doubt resolution sessions, and PI WAT GD preparation.` },
    { q:'What add-ons are available with CATalysis?', a:'Available add-ons at ₹500 discount each: OMETs Mocks (₹1,499), XAT course (₹5,499), SNAP Mocks (₹2,499), NMAT Mocks (₹2,499).' },
    { q:'What is the difference between CATalysis and CAThlete?', a:`CATalysis is the full-year flagship programme starting from first principles — ideal if you are starting your prep now. CAThlete is an intensive crash course for the final 3 months before CAT, starting ${cathleteStartFormatted}. Students who cannot commit to a full-year programme or have already covered basics opt for CAThlete.` },
    { q:'Are sessions recorded?', a:'Yes. All live sessions are recorded and available to enrolled students within 24 hours. Students can watch at up to 2× speed with chapter markers, bookmarks, and notes on the GRADSKOOL platform.' },
    { q:'Is PI WAT GD preparation included?', a:'Yes. PI WAT GD preparation — interview training, WAT essay writing, GD strategy — is included with CATalysis at no extra cost.' },
  ]

  const ADDONS = [
    { name:'CATalysis + OMETs Mocks', price: fmtPrice(catalysisPrice + 1499), strike: fmtPrice(catalysisPrice + 1999), save:'Save ₹500' },
    { name:'CATalysis + XAT Course',      price: fmtPrice(catalysisPrice + 5499), strike: fmtPrice(catalysisPrice + 5999), save:'Save ₹500' },
    { name:'CATalysis + SNAP Mocks', price: fmtPrice(catalysisPrice + 2499), strike: fmtPrice(catalysisPrice + 2999), save:'Save ₹500' },
    { name:'CATalysis + NMAT Mocks', price: fmtPrice(catalysisPrice + 2499), strike: fmtPrice(catalysisPrice + 2999), save:'Save ₹500' },
  ]

  return (
    <>
      <PageSEO
        title={`CAThlete — CAT ${examYear} Crash Course by ALP Sir | From ${fmtPrice(cathleteBasePrice)}`}
        description={`CAThlete is GRADSKOOL's intensive CAT ${examYear} crash course starting ${cathleteStartFormatted}. Structured rapid preparation, live sessions, ${cohortSize}-student cohorts. Also: CATalysis ${catalysisYear} full-year cohort from ${fmtPrice(catalysisPrice)}.`}
        keywords={`CAThlete crash course, CAT ${examYear} crash course, CATalysis CAT ${catalysisYear}, CAT coaching ${examYear}, CAT preparation GRADSKOOL, Abhishek Leela Pandey CAT, ALP Sir CAT, ${cohortSize} students CAT cohort, CAT ${examYear} preparation India`}
        canonical="https://gradskool.in/courses/cat"
        ogImage="/assets/og-cat.jpg"
        breadcrumbs={[{name:'Home',url:'/'},{name:'Courses',url:'/#courses'},{name:'CAThlete — CAT Crash Course',url:'/courses/cat'}]}
        speakableSelectors={['h1','.cat-hero-desc']}
        schema={[
          courseSchema({name:`CAThlete — CAT ${examYear} Crash Course`,altName:'CAThlete',description:`Intensive CAT ${examYear} crash course starting ${cathleteStartFormatted}. Without mocks ${fmtPrice(cathleteBasePrice)}, with mocks ${fmtPrice(cathleteMocksPrice)}. Structured preparation for the final stretch before CAT ${examYear}.`,url:'/courses/cat',price:String(cathleteBasePrice)}),
          courseSchema({name:`CATalysis — CAT ${catalysisYear} Preparation`,altName:'CATalysis',description:`GRADSKOOL's flagship CAT ${catalysisYear} cohort by Abhishek Leela Pandey. 5-stage learning framework. ${cohortSize} students per cohort. Targets IIMs, FMS, SPJIMR and 1,200+ B-schools.`,url:'/courses/cat',price:String(catalysisPrice),startDate:`${examYear}-07-01`,endDate:`${catalysisYear}-11-28`}),
          howToSchema({name:'How CATalysis by GRADSKOOL Works — 5-Stage Learning Framework',description:`The 5-stage process followed in every CATalysis cohort for CAT ${catalysisYear} preparation.`,steps:[
            {name:'Intro Video',text:'English introduction to every concept. Watch before the live session so no time is lost on basics in class.'},
            {name:'Live Session with PDF',text:'Two-way live teaching with ALP Sir. Questions, challenges, and structured reasoning — not a monologue. Session PDF included.'},
            {name:'Cheat Sheet',text:'Distilled one-pager of every concept, formula, and shortcut.'},
            {name:'Quiz',text:'Timed practice to test application, not just recall. Immediate explanations for every question.'},
            {name:'Doubt Resolution',text:'Structured doubt sessions so no question goes unanswered.'},
          ]}),
          faqSchema(FAQS),
        ]}
      />
      <style>{S}</style>
      <style>{`
        .course-hero-grid { display:grid; grid-template-columns:1fr 1fr; border-bottom:var(--border); }
        @media(max-width:960px) { .course-hero-grid{grid-template-columns:1fr!important} }
      `}</style>

      {/* ── PRODUCT TABS — sticky below navbar ── */}
      <CatTabs />

      {/* ════════════════════════════════════════════════════════════════
          PRODUCT 1 — CATHLETE
      ════════════════════════════════════════════════════════════════ */}
      <div id="cathlete">

        {/* ── CATHLETE HERO ── */}
        <section style={{ background:'linear-gradient(135deg,#1a1a18 55%,#2a2927)', padding:'72px 0 64px', borderBottom:'var(--border)' }}>
          <div className="container">
            <div className="eyebrow" style={{ marginBottom:18, color:'var(--g500)' }}>
              <span className="dot" />CAT {examYear} · Crash Course · Starts {cathleteStartFormatted}
            </div>
            <h2 style={{ fontFamily:'var(--font-serif)', fontSize:'clamp(36px,5vw,60px)', fontWeight:400, lineHeight:1.03, letterSpacing:'-.02em', color:'#fff', marginBottom:18 }}>
              CAThlete.<br /><em style={R}>Sprint to CAT {examYear}.</em>
            </h2>
            <p style={{ fontFamily:'var(--font-body)', fontSize:15, color:'var(--g500)', lineHeight:1.85, maxWidth:520, marginBottom:40 }}>
              Not ready for the full cohort? CAThlete is GRADSKOOL's intensive crash course for the final stretch before CAT {examYear}. Structured rapid preparation, live sessions, and the option to add mocks.
            </p>

            {/* Pricing cards */}
            <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom:32 }}>
              {[
                { label:'CAThlete', sub:'Without Mocks', price: fmtPrice(cathleteBasePrice), href:'/checkout?course=cathlete&plan=base', tag:'' },
                { label:'CAThlete + Mocks', sub:'With 30 CAT Mocks', price: fmtPrice(cathleteMocksPrice), href:'/checkout?course=cathlete&plan=with-mocks', tag:'Recommended' },
              ].map(plan => (
                <div key={plan.label} style={{ background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.12)', borderRadius:4, padding:'24px 28px', minWidth:220 }}>
                  {plan.tag && (
                    <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--red)', marginBottom:8 }}>{plan.tag}</div>
                  )}
                  <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--g500)', marginBottom:6 }}>{plan.label}</div>
                  <div style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'var(--g500)', marginBottom:10 }}>{plan.sub}</div>
                  <div style={{ fontFamily:'var(--font-serif)', fontSize:34, color:'#fff', lineHeight:1, marginBottom:16 }}>{plan.price}</div>
                  <Link href={plan.href} className="btn btn-red" style={{ fontSize:12, padding:'10px 20px' }}>Enrol →</Link>
                </div>
              ))}
            </div>

            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              <a href="https://wa.me/917838737388?text=Hi%20ALP%20Sir%2C%20I%20want%20to%20know%20more%20about%20CAThlete"
                target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                <span className="wa-dot" />WhatsApp ALP Sir about CAThlete
              </a>
            </div>
          </div>
        </section>

        {/* ── CATHLETE INCLUDED ── */}
        <section className="section">
          <div className="container">
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:48 }} className="cathlete-layout">
              <style>{`@media(max-width:960px){.cathlete-layout{grid-template-columns:1fr!important}}`}</style>
              <div>
                <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />What's included</div>
                <h2 className="d-lg" style={{ marginBottom:20 }}>Everything in<br /><em style={R}>CAThlete.</em></h2>
                {['Structured rapid CAT preparation — VARC, DILR, QA',`Live sessions starting ${cathleteStartFormatted}`,'Session PDFs and cheat sheets for every topic','Doubt resolution sessions throughout the course','Post-mock strategic analysis (with mocks plan)','GRADSKOOL platform access — watch, bookmark, notes'].map(item => (
                  <div key={item} style={{ fontFamily:'var(--font-body)', fontSize:14, color:'var(--g700)', padding:'10px 0', borderBottom:'var(--border)', display:'flex', gap:10, lineHeight:1.6 }}>
                    <span style={R}>—</span><span>{item}</span>
                  </div>
                ))}
              </div>

              {/* Which one is right for you? */}
              <div>
                <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />Which one is right for you?</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:1, background:'var(--g200)', border:'var(--border)', borderRadius:4, overflow:'hidden' }}>
                  <div style={{ background:'var(--black)', padding:'24px 22px', color:'#fff' }}>
                    <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--red)', marginBottom:8 }}>CAThlete</div>
                    <div style={{ fontFamily:'var(--font-serif)', fontSize:17, color:'#fff', marginBottom:10, lineHeight:1.3 }}>Starting from scratch or short on time</div>
                    <p style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'var(--g500)', lineHeight:1.7, marginBottom:16 }}>Starting {cathleteStartFormatted}. Intensive structured preparation for the final stretch. {fmtPrice(cathleteBasePrice)} without mocks or {fmtPrice(cathleteMocksPrice)} with mocks.</p>
                    <Link href="/checkout?course=cathlete" className="btn btn-red" style={{ fontSize:12, padding:'10px 18px' }}>Enrol in CAThlete →</Link>
                  </div>
                  <div style={{ background:'#fff', padding:'24px 22px' }}>
                    <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--red)', marginBottom:8 }}>{`CATalysis ${catalysisYear}`}</div>
                    <div style={{ fontFamily:'var(--font-serif)', fontSize:17, color:'var(--black)', marginBottom:10, lineHeight:1.3 }}>Full-year structured preparation</div>
                    <p style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'var(--g700)', lineHeight:1.7, marginBottom:16 }}>From first principles to exam day. 400+ hours live, 30 mocks, {cohortSize} students. The complete IIM preparation route.</p>
                    <Link href="/checkout?course=cat&plan=live-mocks" className="btn btn-outline" style={{ fontSize:12, padding:'10px 18px' }}>Enrol in CATalysis →</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>{/* end #cathlete */}

      {/* ════════════════════════════════════════════════════════════════
          PRODUCT 2 — CATALYSIS
      ════════════════════════════════════════════════════════════════ */}
      <div id="catalysis" style={{ borderTop:'4px solid var(--black)' }}>

        {/* ── HERO ── */}
        <section className="course-hero-grid">
          <div style={{ padding:'72px 56px 64px 40px', borderRight:'var(--border)', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
            <div>
              <div className="eyebrow" style={{ marginBottom:20 }}>
                <span className="dot" />CAT {catalysisYear} · Flagship Cohort · {cohortSize} students max
              </div>
              <h1 className="d-xl" style={{ marginBottom:20 }}>
                CATalysis<br /><em style={R}>The IIM Route.</em>
              </h1>
              <p style={{ fontFamily:'var(--font-body)', fontSize:15, color:'var(--g700)', lineHeight:1.85, maxWidth:480, marginBottom:32 }}>
                400+ hours of live two-way teaching with ALP Sir. 30 full-length CAT mocks. {cohortSize} students per cohort — no exceptions. The most structured CAT preparation in India.
              </p>
              <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                <Link href="/checkout?course=cat&plan=live-mocks" className="btn btn-red">Enrol Now — {fmtPrice(catalysisPrice)} →</Link>
                <a href={`https://wa.me/917838737388?text=Hi%20ALP%20Sir%2C%20I%20want%20to%20know%20about%20CATalysis%20${catalysisYear}`}
                  target="_blank" rel="noopener noreferrer" className="btn btn-wa">
                  <span className="wa-dot" />WhatsApp ALP Sir
                </a>
              </div>
              <Link href="/courses/cat/pricing" style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'var(--red)', display:'inline-block', marginTop:14 }}>View full CATalysis &amp; CAThlete pricing →</Link>
            </div>
            <div style={{ display:'flex', gap:28, marginTop:44, paddingTop:24, borderTop:'var(--border)', flexWrap:'wrap' }}>
              {[['400+ hrs','Live sessions'],['30 mocks','Full-length CAT'],[String(cohortSize),'Students per cohort'],['4.9★','347 reviews']].map(([v,l]) => (
                <div key={l}>
                  <div style={{ fontFamily:'var(--font-serif)', fontSize:22, color:'var(--black)', lineHeight:1 }}>{v}</div>
                  <div style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'var(--g500)', marginTop:3 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing card */}
          <div style={{ background:'var(--off)', display:'flex', flexDirection:'column', justifyContent:'center', padding:'40px 48px' }}>
            <div style={{ background:'#fff', border:'var(--border)', borderRadius:4, padding:'28px 32px', marginBottom:16 }}>
              <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', background:'var(--red)', color:'#fff', padding:'3px 10px', borderRadius:1, display:'inline-block', marginBottom:14 }}>Most Popular</div>
              <div style={{ fontFamily:'var(--font-serif)', fontSize:20, color:'var(--black)', marginBottom:14 }}>CATalysis — Live + Mocks</div>
              {['400+ hours of live two-way sessions with ALP Sir','30 full-length CAT mocks + 30 sectional tests','Post-test strategic analysis after every mock','Doubt resolution + session PDFs + cheat sheets','PI WAT GD preparation included'].map(item => (
                <div key={item} style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--g700)', marginBottom:6, display:'flex', gap:8 }}>
                  <span style={R}>—</span><span>{item}</span>
                </div>
              ))}
              <div style={{ marginTop:20, display:'flex', alignItems:'baseline', gap:12, borderTop:'var(--border)', paddingTop:16 }}>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:38, color:'var(--black)', lineHeight:1 }}>{fmtPrice(catalysisPrice)}</div>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'var(--g500)' }}>+ GST</div>
              </div>
              <Link href="/checkout?course=cat&plan=live-mocks" className="btn btn-red" style={{ marginTop:14, width:'100%', justifyContent:'center' }}>
                Enrol in CATalysis →
              </Link>
            </div>
            {/* Add-ons */}
            <button onClick={() => setAddonOpen(!addonOpen)}
              style={{ width:'100%', padding:'12px 20px', border:'var(--border)', borderRadius:3, background:'#fff', fontFamily:'var(--font-sans)', fontSize:13, fontWeight:500, color:'var(--g700)', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }}>
              <span>Bundle with other courses (save ₹500 each)</span>
              <span style={{ transform: addonOpen ? 'rotate(180deg)' : 'none', transition:'transform .2s' }}>↓</span>
            </button>
            {addonOpen && (
              <div style={{ border:'var(--border)', borderTop:'none', borderRadius:'0 0 3px 3px', background:'#fff' }}>
                {ADDONS.map(a => (
                  <div key={a.name} style={{ padding:'14px 20px', borderBottom:'var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <div style={{ fontFamily:'var(--font-sans)', fontSize:13, color:'var(--black)', fontWeight:500 }}>{a.name}</div>
                      <div style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'var(--red)', fontWeight:600, marginTop:2 }}>{a.save}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontFamily:'var(--font-serif)', fontSize:17, color:'var(--black)' }}>{a.price}</div>
                      <div style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'var(--g300)', textDecoration:'line-through' }}>{a.strike}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── 5-STAGE FRAMEWORK ── */}
        <section className="section">
          <div className="container">
            <div style={{ marginBottom:36 }}>
              <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />How CATalysis works</div>
              <h2 className="d-lg">The 5-Stage<br /><em style={R}>Learning Framework</em></h2>
            </div>
            <div className="stages">
              {STAGES.map(s => (
                <div key={s.n} className="stage-card">
                  <div className="stage-bg">{s.n}</div>
                  <div style={{ fontFamily:'var(--font-serif)', fontSize:15, color:'var(--black)', lineHeight:1.3, marginBottom:8, position:'relative', zIndex:1 }}>{s.name}</div>
                  <p style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'var(--g700)', lineHeight:1.6, position:'relative', zIndex:1 }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── DAILY PRACTICE VIA GRADSCALE ── */}
        <section style={{ padding:'32px 0', borderBottom:'var(--border)' }}>
          <div className="container">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:20, flexWrap:'wrap', padding:'20px 28px', background:'var(--off)', border:'var(--border)', borderRadius:4 }}>
              <div>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--red)', marginBottom:6 }}>Daily Practice</div>
                <div style={{ fontFamily:'var(--font-body)', fontSize:14, color:'var(--g700)' }}>Targeted daily practice drills between sessions — hosted on GRADSCALE, GRADSKOOL's dedicated practice platform.</div>
              </div>
              <a href="https://www.gradscale.in/" target="_blank" rel="noopener noreferrer" className="btn btn-red" style={{ flexShrink:0 }}>Practice on GRADSCALE →</a>
            </div>
          </div>
        </section>

        {/* ── SYLLABUS ── */}
        <section style={{ padding:'72px 0', borderBottom:'var(--border)', background:'var(--off)' }}>
          <div className="container">
            <div style={{ marginBottom:32 }}>
              <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />Full coverage</div>
              <h2 className="d-lg">{`CAT ${catalysisYear} Syllabus`}</h2>
            </div>
            <div className="syllabus-grid">
              {SYLLABUS.map(s => (
                <div key={s.sec} className="syl-col">
                  <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color:'var(--red)', marginBottom:14 }}>{s.sec}</div>
                  {s.topics.map(t => (
                    <div key={t} style={{ fontFamily:'var(--font-body)', fontSize:14, color:'var(--g700)', padding:'8px 0', borderBottom:'var(--border)', lineHeight:1.5, display:'flex', gap:8 }}>
                      <span style={R}>—</span><span>{t}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── COLLEGES ── */}
        <section className="section">
          <div className="container">
            <div style={{ marginBottom:32 }}>
              <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />Where you can go</div>
              <h2 className="d-lg">Top colleges that<br /><em style={R}>accept CAT</em></h2>
            </div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:'var(--font-sans)', fontSize:13 }}>
                <thead>
                  <tr style={{ background:'var(--black)' }}>
                    {['Institution','Programmes','Note'].map(h => (
                      <th key={h} style={{ padding:'12px 16px', textAlign:'left', color:'var(--g500)', fontWeight:600, fontSize:10, letterSpacing:'.08em', textTransform:'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COLLEGES.map((c, i) => (
                    <tr key={c.name} style={{ borderBottom:'var(--border)', background: i % 2 === 0 ? '#fff' : 'var(--off)' }}>
                      <td style={{ padding:'12px 16px', fontWeight:600, color:'var(--black)' }}>{c.name}</td>
                      <td style={{ padding:'12px 16px', color:'var(--g700)' }}>{c.courses}</td>
                      <td style={{ padding:'12px 16px', color:'var(--g500)', fontSize:12 }}>{c.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section style={{ padding:'72px 0', borderBottom:'var(--border)', background:'var(--off)' }}>
          <div className="container">
            <div style={{ marginBottom:32 }}>
              <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />Student voices</div>
              <h2 className="d-lg">What CATalysis<br />students say</h2>
            </div>
            <CourseTestimonials testis={TESTIS} />
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="section">
          <div className="container">
            <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:64 }} className="faq-layout">
              <style>{`@media(max-width:960px){.faq-layout{grid-template-columns:1fr!important}}`}</style>
              <div>
                <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />Questions</div>
                <h2 className="d-lg">Everything you need to know.</h2>
                <a href="https://wa.me/917838737388?text=Hi%20ALP%20Sir%2C%20I%20have%20a%20question%20about%20CATalysis"
                  target="_blank" rel="noopener noreferrer" className="btn btn-wa" style={{ marginTop:24, display:'inline-flex' }}>
                  <span className="wa-dot" />Ask ALP Sir directly
                </a>
              </div>
              <CourseFaqAccordion faqs={FAQS} />
            </div>
          </div>
        </section>

      </div>{/* end #catalysis */}

      {/* ════════════════════════════════════════════════════════════════
          MORE CAT PRODUCTS
      ════════════════════════════════════════════════════════════════ */}
      <div id="cat-more" style={{ borderTop:'4px solid var(--black)' }}>
        <section style={{ padding:'72px 0', background:'var(--off)' }}>
          <div className="container">
            <div style={{ marginBottom:36 }}>
              <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />Also for CAT</div>
              <h2 className="d-lg">Go deeper with<br /><em style={R}>focused products.</em></h2>
              <p style={{ fontFamily:'var(--font-body)', fontSize:14, color:'var(--g700)', marginTop:10, lineHeight:1.8, maxWidth:480 }}>Standalone products for specific areas — study alongside CATalysis or CAThlete.</p>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:1, background:'var(--g200)', border:'var(--border)', borderRadius:4, overflow:'hidden' }}>
              {[
                ['/courses/cat/mocks', 'CAT Mocks',   '₹2,999','30 full-length CAT mocks with sectional tests. If you already have coaching but need mocks.'],
                ['/courses/cat/books', 'CAT Books',   '₹3,999',`Curated physical books for CAT ${examYear} — recommended reading list with ALP Sir's notes.`],
              ].map(([href,name,price,desc]) => (
                <Link key={href} href={href}
                  style={{ background:'#fff', padding:'26px 22px', display:'block', textDecoration:'none', transition:'background var(--t)' }}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--off)'}
                  onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
                  <div style={{ fontFamily:'var(--font-serif)', fontSize:18, color:'var(--black)', marginBottom:4 }}>{name}</div>
                  <div style={{ fontFamily:'var(--font-sans)', fontSize:13, fontWeight:600, color:'var(--red)', marginBottom:8 }}>{price}</div>
                  <p style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--g700)', lineHeight:1.7, marginBottom:12 }}>{desc}</p>
                  <div style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'var(--g500)' }}>View →</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ── FINAL CTA ── */}
      <section style={{ background:'var(--black)', padding:'72px 0', textAlign:'center' }}>
        <div className="container">
          <h2 style={{ fontFamily:'var(--font-serif)', fontSize:'clamp(26px,4vw,44px)', fontWeight:400, color:'#fff', marginBottom:14 }}>
            Not sure which one?<br /><em style={R}>Ask ALP Sir directly.</em>
          </h2>
          <p style={{ fontFamily:'var(--font-body)', fontSize:14, color:'var(--g500)', lineHeight:1.8, maxWidth:400, margin:'0 auto 32px' }}>
            Tell him where you are in your prep. He will tell you which product is right for you.
          </p>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <a href="https://wa.me/917838737388?text=Hi%20ALP%20Sir%2C%20I%20am%20not%20sure%20whether%20to%20take%20CATalysis%20or%20CAThlete"
              target="_blank" rel="noopener noreferrer" className="btn btn-red">
              <span className="wa-dot" />WhatsApp ALP Sir
            </a>
            <Link href="/checkout?course=cat&plan=live-mocks" className="btn btn-ghost">Enrol in CATalysis →</Link>
            <Link href="/checkout?course=cathlete" className="btn btn-ghost">Enrol in CAThlete →</Link>
          </div>
        </div>
      </section>

      {/* ── MOBILE STICKY ── */}
      <div className="mob-sticky">
        <div>
          <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:600, letterSpacing:'.07em', textTransform:'uppercase', color:'var(--g500)' }}>CAThlete</div>
          <div style={{ fontFamily:'var(--font-serif)', fontSize:19, color:'var(--black)', lineHeight:1.2 }}>{fmtPrice(cathleteBasePrice)} + GST</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <a href={`https://wa.me/917838737388?text=Hi%20ALP%20Sir%2C%20about%20CAT%20${examYear}`}
            target="_blank" rel="noopener noreferrer"
            style={{ fontFamily:'var(--font-sans)', fontSize:12, fontWeight:600, color:'#25D366', border:'2px solid #25D366', padding:'8px 14px', borderRadius:2, textDecoration:'none' }}>
            WhatsApp
          </a>
          <Link href="/checkout?course=cathlete"
            style={{ fontFamily:'var(--font-sans)', fontSize:12, fontWeight:600, background:'var(--red)', color:'#fff', padding:'8px 18px', borderRadius:2, textDecoration:'none' }}>
            Enrol →
          </Link>
        </div>
      </div>

      <WaFloat msg={`Hi ALP Sir, I want to know more about CAT ${examYear} preparation`} />
    </>
  )
}
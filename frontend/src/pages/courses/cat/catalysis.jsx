/**
 * GRADSKOOL — CATalysis Page
 * Route: /courses/cat/catalysis
 *
 * CATalysis — the flagship full-year CAT cohort — extracted from
 * /courses/cat into its own page. Sold as next year's cohort (see
 * catalysisYear = examYear + 1 below); same logic as the main CAT page.
 */
import { useState } from 'react'
import Link from 'next/link'
import PageSEO, { courseSchema } from '../../../components/seo/PageSEO'
import { S, WaFloat } from '../../../components/courses/CourseLayout'
import CatTabs from '../../../components/courses/CatTabs'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
const R = { color: 'var(--red)' }

const FALLBACK = { examDate: '2026-11-29', catalysisPrice: 17999, cohortSize: 27 }

function fmtPrice(n) { return `₹${Number(n).toLocaleString('en-IN')}` }

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

export async function getStaticProps() {
  try {
    const res = await fetch(`${API}/courses/exams/cat/`)
    const examData = res.ok ? await res.json() : null
    return { props: { examData }, revalidate: 300 }
  } catch {
    return { props: { examData: null }, revalidate: 60 }
  }
}

export default function CatalysisPage({ examData }) {
  const [addonOpen, setAddonOpen] = useState(false)
  const plans = examData?.plans || []
  const catalysisPlan = plans.find(p => p.slug === 'live-cat-mocks')
  const catalysisPrice = catalysisPlan?.price_inr ? Number(catalysisPlan.price_inr) : FALLBACK.catalysisPrice
  const cohortSize = examData?.seats_available?.cohort_size || FALLBACK.cohortSize
  const examYear = new Date(examData?.exam_date || FALLBACK.examDate).getFullYear()
  const catalysisYear = examYear + 1

  const ADDONS = [
    { name:'CATalysis + OMETs Mocks', price: fmtPrice(catalysisPrice + 1499), strike: fmtPrice(catalysisPrice + 1999), save:'Save ₹500' },
    { name:'CATalysis + XAT Course',  price: fmtPrice(catalysisPrice + 5499), strike: fmtPrice(catalysisPrice + 5999), save:'Save ₹500' },
    { name:'CATalysis + SNAP Mocks',  price: fmtPrice(catalysisPrice + 2499), strike: fmtPrice(catalysisPrice + 2999), save:'Save ₹500' },
    { name:'CATalysis + NMAT Mocks',  price: fmtPrice(catalysisPrice + 2499), strike: fmtPrice(catalysisPrice + 2999), save:'Save ₹500' },
  ]

  return (
    <>
      <PageSEO
        title={`CATalysis — CAT ${catalysisYear} Preparation by ALP Sir | From ${fmtPrice(catalysisPrice)}`}
        description={`GRADSKOOL's flagship CAT ${catalysisYear} cohort. 5-stage learning framework. ${cohortSize} students per cohort. 400+ hours live, 30 full mocks.`}
        keywords="CATalysis, CAT 2027 preparation, CAT coaching, ALP Sir CAT, GRADSKOOL CATalysis, IIM preparation"
        canonical="https://gradskool.in/courses/cat/catalysis"
        ogImage="/assets/og-catalysis.jpg"
        breadcrumbs={[{name:'Home',url:'/'},{name:'CAT',url:'/courses/cat'},{name:'CATalysis',url:'/courses/cat/catalysis'}]}
        schema={[
          courseSchema({name:`CATalysis ${catalysisYear}`, description:`GRADSKOOL's flagship CAT ${catalysisYear} cohort — 5-stage learning framework, ${cohortSize} students per cohort, 400+ hours live.`, url:'/courses/cat/catalysis', price:String(catalysisPrice)}),
        ]}
        speakableSelectors={['h1', '.eyebrow']}
      />

      <CatTabs active="catalysis" />

      {/* hero */}
      <section style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr' }} className="catalysis-hero">
        <style>{`@media(max-width:960px){.catalysis-hero{grid-template-columns:1fr!important}}`}</style>
        <style>{S}</style>
        <div style={{ padding:'72px 48px 56px' }}>
          <Link href="/courses/cat" style={{ fontFamily:'var(--font-sans)', fontSize:13, color:'var(--g500)', textDecoration:'none' }}>← Back to CAT</Link>
          <div className="eyebrow" style={{ marginTop:20, marginBottom:14 }}><span className="dot" />CAT {catalysisYear} Preparation</div>
          <h1 className="d-xl" style={{ marginBottom:20, maxWidth:520 }}>CAT<em style={R}>alysis.</em></h1>
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
          <div style={{ display:'flex', gap:28, marginTop:44, paddingTop:24, borderTop:'var(--border)', flexWrap:'wrap' }}>
            {[['400+ hrs','Live sessions'],['30 mocks','Full-length CAT'],[String(cohortSize),'Students per cohort']].map(([v,l]) => (
              <div key={l}>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:22, color:'var(--black)', lineHeight:1 }}>{v}</div>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'var(--g500)', marginTop:3 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

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
            <Link href="/checkout?course=cat&plan=live-mocks" className="btn btn-red" style={{ marginTop:14, width:'100%', justifyContent:'center' }}>Enrol in CATalysis →</Link>
          </div>
          <button onClick={() => setAddonOpen(!addonOpen)}
            style={{ width:'100%', padding:'12px 20px', border:'var(--border)', borderRadius:3, background:'#fff', fontFamily:'var(--font-sans)', fontSize:13, fontWeight:500, color:'var(--g700)', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }}>
            <span>Bundle with other courses (save ₹500 each)</span>
            <span style={{ transform: addonOpen ? 'rotate(180deg)' : 'none', transition:'transform .2s' }}>↓</span>
          </button>
          {addonOpen && (
            <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:8 }}>
              {ADDONS.map(a => (
                <div key={a.name} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', background:'#fff', border:'var(--border)', borderRadius:3, fontFamily:'var(--font-sans)', fontSize:12 }}>
                  <span>{a.name}</span>
                  <span><span style={{ color:'var(--g500)', textDecoration:'line-through', marginRight:6 }}>{a.strike}</span>{a.price}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 5-stage framework */}
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

      {/* daily practice */}
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

      {/* syllabus */}
      <section style={{ padding:'72px 0', borderBottom:'var(--border)', background:'var(--off)' }}>
        <div className="container">
          <div style={{ marginBottom:32 }}>
            <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />Full coverage</div>
            <h2 className="d-lg">{`CAT ${catalysisYear} Syllabus`}</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:32 }} className="syl-grid">
            <style>{`@media(max-width:800px){.syl-grid{grid-template-columns:1fr!important}}`}</style>
            {SYLLABUS.map(sec => (
              <div key={sec.sec}>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color:'var(--red)', marginBottom:14 }}>{sec.sec}</div>
                {sec.topics.map(t => (
                  <div key={t} style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--g700)', padding:'8px 0', borderBottom:'var(--border)' }}>{t}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* also available */}
      <section className="section">
        <div className="container">
          <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />Also preparing for CAT</div>
          <h2 className="d-lg" style={{ marginBottom:28 }}>Round out your <em style={R}>prep.</em></h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }} className="also-grid-3">
            <style>{`@media(max-width:800px){.also-grid-3{grid-template-columns:1fr!important}}`}</style>
            {[
              ['/courses/cat/alpgebra', 'ALPgebra', '₹999', "99 theorems covering CAT's full Algebra syllabus, from first principles."],
              ['/courses/cat/cathlete', 'CAThlete', '₹6,999', 'A shorter, intensive crash course — for the final stretch before exam day.'],
              ['/courses/cat/books', 'CAT Books', '₹3,999', "Curated physical books with ALP Sir's own notes in the margins."],
            ].map(([href, name, price, desc]) => (
              <Link key={href} href={href} style={{ background:'var(--off)', border:'var(--border)', borderRadius:4, padding:'24px', textDecoration:'none', display:'block' }}>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:18, color:'var(--black)', marginBottom:8 }}>{name}</div>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:13, fontWeight:700, color:'var(--red)', marginBottom:10 }}>{price}</div>
                <p style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--g700)', lineHeight:1.6, marginBottom:12 }}>{desc}</p>
                <span style={{ fontFamily:'var(--font-sans)', fontSize:12, fontWeight:600, color:'var(--red)' }}>Explore →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <WaFloat msg="Hi ALP Sir, I want to know more about CATalysis" />
    </>
  )
}
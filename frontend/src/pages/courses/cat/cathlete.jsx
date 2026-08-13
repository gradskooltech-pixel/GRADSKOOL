/**
 * GRADSKOOL — CAThlete Page
 * Route: /courses/cat/cathlete
 *
 * Rebuilt to match CATalysis's structure and visual style: light
 * 2-column hero (text + stats on the left, pricing card on the right),
 * daily practice strip, and syllabus section — for a consistent feel
 * across every CAT page rather than each having its own layout.
 */
import { useState } from 'react'
import Link from 'next/link'
import PageSEO, { courseSchema } from '../../../components/seo/PageSEO'
import { S, WaFloat } from '../../../components/courses/CourseLayout'
import CatTabs from '../../../components/courses/CatTabs'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
const R = { color: 'var(--red)' }

const FALLBACK = {
  examDate: '2026-11-29',
  cathleteBasePrice: 6999,
  cathleteMocksPrice: 9999,
  cathleteStart: '2026-08-18',
  catalysisPrice: 27999,
}

function fmtPrice(n) {
  return `₹${Number(n).toLocaleString('en-IN')}`
}

function formatDate(iso) {
  if (!iso) return null
  try { return new Date(iso).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' }) }
  catch { return null }
}

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

export default function CathletePage({ examData }) {
  const [withMocks, setWithMocks] = useState(true)

  const plans = examData?.plans || []
  const cathleteBase  = plans.find(p => p.slug === 'cathlete-no-mocks')
  const cathleteMocks = plans.find(p => p.slug === 'cathlete-with-mocks')
  const cathleteCourse = (examData?.courses || []).find(
    c => c.slug?.includes('cathlete') || c.title?.toLowerCase().includes('cathlete')
  )

  const cathleteBasePrice  = cathleteBase?.price_inr  ? Number(cathleteBase.price_inr)  : FALLBACK.cathleteBasePrice
  const cathleteMocksPrice = cathleteMocks?.price_inr ? Number(cathleteMocks.price_inr) : FALLBACK.cathleteMocksPrice
  const cathleteStartFormatted = formatDate(cathleteCourse?.start_date) || formatDate(FALLBACK.cathleteStart)
  const examYear = new Date(examData?.exam_date || FALLBACK.examDate).getFullYear()
  const catalysisYear = examYear + 1
  const catalysisPrice = FALLBACK.catalysisPrice

  const activePrice = withMocks ? cathleteMocksPrice : cathleteBasePrice
  const activeHref = withMocks ? '/checkout?course=cathlete&plan=with-mocks' : '/checkout?course=cathlete&plan=base'

  const FEATURES = withMocks
    ? ['Structured rapid CAT preparation — VARC, DILR, QA', `Live sessions starting ${cathleteStartFormatted}`, '31 full-length CAT mocks + post-test analysis', 'Session PDFs and cheat sheets for every topic', 'Doubt resolution sessions throughout the course']
    : ['Structured rapid CAT preparation — VARC, DILR, QA', `Live sessions starting ${cathleteStartFormatted}`, 'Session PDFs and cheat sheets for every topic', 'Doubt resolution sessions throughout the course', 'GRADSKOOL platform access — watch, bookmark, notes']

  return (
    <>
      <PageSEO
        title={`CAThlete — CAT ${examYear} Crash Course by ALP Sir | From ${fmtPrice(cathleteBasePrice)}`}
        description={`CAThlete is GRADSKOOL's intensive CAT ${examYear} crash course starting ${cathleteStartFormatted}. Structured rapid preparation, live sessions, 31 mocks.`}
        keywords="CAThlete, CAT crash course, CAT 2026 preparation, ALP Sir CAT, GRADSKOOL CAThlete, last minute CAT prep"
        canonical="https://gradskool.in/courses/cat/cathlete"
        ogImage="/assets/og-cathlete.jpg"
        breadcrumbs={[{name:'Home',url:'/'},{name:'CAT',url:'/courses/cat'},{name:'CAThlete',url:'/courses/cat/cathlete'}]}
        schema={[
          courseSchema({name:'CAThlete', description:`GRADSKOOL's intensive CAT ${examYear} crash course. Structured rapid preparation, live sessions, 31 mocks.`, url:'/courses/cat/cathlete', price:String(cathleteBasePrice), startDate:FALLBACK.cathleteStart}),
        ]}
        speakableSelectors={['h1', '.eyebrow']}
      />

      <CatTabs active="cathlete" />

      {/* hero */}
      <section style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr' }} className="cathlete-hero">
        <style>{`@media(max-width:960px){.cathlete-hero{grid-template-columns:1fr!important}}`}</style>
        <style>{S}</style>
        <div style={{ padding:'72px 48px 56px' }}>
          <Link href="/courses/cat" style={{ fontFamily:'var(--font-sans)', fontSize:13, color:'var(--g500)', textDecoration:'none' }}>← Back to CAT</Link>
          <div className="eyebrow" style={{ marginTop:20, marginBottom:14 }}><span className="dot" />CAT {examYear} Crash Course</div>
          <h1 className="d-xl" style={{ marginBottom:20, maxWidth:520 }}>CAT<em style={R}>hlete.</em></h1>
          <p style={{ fontFamily:'var(--font-body)', fontSize:15, color:'var(--g700)', lineHeight:1.85, maxWidth:480, marginBottom:32 }}>
            Not ready for the full cohort? CAThlete is GRADSKOOL's intensive crash course for the final stretch before CAT {examYear}. Structured rapid preparation, live sessions, and the option to add mocks.
          </p>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <Link href={activeHref} className="btn btn-red">Enrol Now — {fmtPrice(activePrice)} →</Link>
            <a href="https://wa.me/917838737388?text=Hi%20ALP%20Sir%2C%20I%20want%20to%20know%20more%20about%20CAThlete"
              target="_blank" rel="noopener noreferrer" className="btn btn-wa">
              <span className="wa-dot" />WhatsApp ALP Sir
            </a>
          </div>
          <Link href="/courses/cat/pricing" style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'var(--red)', display:'inline-block', marginTop:14 }}>View full CATalysis &amp; CAThlete pricing →</Link>
          <div style={{ display:'flex', gap:28, marginTop:44, paddingTop:24, borderTop:'var(--border)', flexWrap:'wrap' }}>
            {[['31 mocks','Full-length CAT (with mocks plan)'],[cathleteStartFormatted,'Live sessions start'],['3','Sections covered']].map(([v,l]) => (
              <div key={l}>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:22, color:'var(--black)', lineHeight:1 }}>{v}</div>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'var(--g500)', marginTop:3 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background:'var(--off)', display:'flex', flexDirection:'column', justifyContent:'center', padding:'40px 48px' }}>
          <div style={{ background:'#fff', border:'var(--border)', borderRadius:4, padding:'28px 32px', marginBottom:16 }}>
            {withMocks && <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', background:'var(--red)', color:'#fff', padding:'3px 10px', borderRadius:1, display:'inline-block', marginBottom:14 }}>Recommended</div>}
            <div style={{ fontFamily:'var(--font-serif)', fontSize:20, color:'var(--black)', marginBottom:14 }}>{withMocks ? 'CAThlete + Mocks' : 'CAThlete — Without Mocks'}</div>
            {FEATURES.map(item => (
              <div key={item} style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--g700)', marginBottom:6, display:'flex', gap:8 }}>
                <span style={R}>—</span><span>{item}</span>
              </div>
            ))}
            <div style={{ marginTop:20, display:'flex', alignItems:'baseline', gap:12, borderTop:'var(--border)', paddingTop:16 }}>
              <div style={{ fontFamily:'var(--font-serif)', fontSize:38, color:'var(--black)', lineHeight:1 }}>{fmtPrice(activePrice)}</div>
              <div style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'var(--g500)' }}>incl. GST</div>
            </div>
            <Link href={activeHref} className="btn btn-red" style={{ marginTop:14, width:'100%', justifyContent:'center' }}>Enrol in CAThlete →</Link>
          </div>
          <button onClick={() => setWithMocks(!withMocks)}
            style={{ width:'100%', padding:'12px 20px', border:'var(--border)', borderRadius:3, background:'#fff', fontFamily:'var(--font-sans)', fontSize:13, fontWeight:500, color:'var(--g700)', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }}>
            <span>{withMocks ? 'Switch to without mocks' : `Add 31 CAT mocks (+${fmtPrice(cathleteMocksPrice - cathleteBasePrice)})`}</span>
            <span>↓</span>
          </button>
        </div>
      </section>

      {/* comparison: cathlete vs catalysis */}
      <section className="section">
        <div className="container">
          <div style={{ marginBottom:36 }}>
            <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />Which one is right for you?</div>
            <h2 className="d-lg">CAThlete <em style={R}>or CATalysis?</em></h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:1, background:'var(--g200)', border:'var(--border)', borderRadius:4, overflow:'hidden' }} className="syl-grid">
            <div style={{ background:'var(--black)', padding:'28px 32px', color:'#fff' }}>
              <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--red)', marginBottom:8 }}>CAThlete</div>
              <div style={{ fontFamily:'var(--font-serif)', fontSize:17, color:'#fff', marginBottom:10, lineHeight:1.3 }}>Starting from scratch or short on time</div>
              <p style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'var(--g500)', lineHeight:1.7, marginBottom:16 }}>Starting {cathleteStartFormatted}. {fmtPrice(cathleteBasePrice)} without mocks or {fmtPrice(cathleteMocksPrice)} with mocks.</p>
              <Link href="/checkout?course=cathlete&plan=with-mocks" className="btn btn-red" style={{ fontSize:12, padding:'10px 18px' }}>Enrol in CAThlete →</Link>
            </div>
            <div style={{ background:'#fff', padding:'28px 32px' }}>
              <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--red)', marginBottom:8 }}>{`CATalysis ${catalysisYear}`}</div>
              <div style={{ fontFamily:'var(--font-serif)', fontSize:17, color:'var(--black)', marginBottom:10, lineHeight:1.3 }}>Full-year structured preparation</div>
              <p style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'var(--g700)', lineHeight:1.7, marginBottom:16 }}>From first principles to exam day. 400+ hours live, 30 mocks. The complete IIM preparation route.</p>
              <Link href="/courses/cat/catalysis" className="btn btn-outline" style={{ fontSize:12, padding:'10px 18px' }}>See CATalysis →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* also available */}
      <section style={{ padding:'56px 0', borderBottom:'var(--border)', background:'var(--off)' }}>
        <div className="container">
          <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />Also preparing for CAT</div>
          <h2 className="d-lg" style={{ marginBottom:28 }}>Round out your <em style={R}>prep.</em></h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }} className="also-grid-3">
            <style>{`@media(max-width:800px){.also-grid-3{grid-template-columns:1fr!important}}`}</style>
            {[
              ['/courses/cat/alpgebra', 'ALPgebra', '₹999', "99 theorems covering CAT's full Algebra syllabus, from first principles."],
              ['/courses/cat/mocks', 'CAT Mocks', '₹2,999', '30 full-length mocks with sectional tests, if you already have coaching but need mocks.'],
              ['/courses/cat/books', 'CAT Books', '₹3,999', "Curated physical books with ALP Sir's own notes in the margins."],
            ].map(([href, name, price, desc]) => (
              <Link key={href} href={href} style={{ background:'#fff', border:'var(--border)', borderRadius:4, padding:'24px', textDecoration:'none', display:'block' }}>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:18, color:'var(--black)', marginBottom:8 }}>{name}</div>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:13, fontWeight:700, color:'var(--red)', marginBottom:10 }}>{price}</div>
                <p style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--g700)', lineHeight:1.6, marginBottom:12 }}>{desc}</p>
                <span style={{ fontFamily:'var(--font-sans)', fontSize:12, fontWeight:600, color:'var(--red)' }}>Explore →</span>
              </Link>
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
            <h2 className="d-lg">{`CAT ${examYear} Syllabus`}</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:32 }} className="syl-grid-3">
            <style>{`@media(max-width:800px){.syl-grid-3{grid-template-columns:1fr!important}}`}</style>
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
      <WaFloat msg="Hi ALP Sir, I want to know more about CAThlete" />
    </>
  )
}
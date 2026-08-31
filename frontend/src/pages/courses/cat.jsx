/**
 * GRADSKOOL — CAT Hub Page
 * Route: /courses/cat (and /cat)
 *
 * Rebuilt as a proper hub rather than a 500+ line page with CATalysis's
 * full detail (5-stage framework, full syllabus deep-dive, etc.) embedded
 * inline — that content now lives only on /courses/cat/catalysis, its own
 * dedicated page, and duplicating it here just to drive people away from
 * this page defeats the point. This page gives brief, correct-pricing
 * teasers for CATalysis and CAThlete, then surfaces every other CAT
 * product (ALPgebra, CAT Mocks, CAT Books, All MBA Mocks + Books) that
 * previously wasn't listed here at all.
 *
 * Also fixes plan slug lookups that were broken ('live-cat-mocks',
 * 'cathlete-no-mocks', 'cathlete-with-mocks' don't match any real plan —
 * the actual slugs are 'live-mocks', 'base', 'with-mocks') — this page
 * was silently showing hardcoded fallback prices only, never real data.
 */
import Link from 'next/link'
import PageSEO, { courseSchema, faqSchema } from '../../components/seo/PageSEO'
import { S, CourseFaqAccordion, WaFloat, CourseTestimonials } from '../../components/courses/CourseLayout'
import CatTabs from '../../components/courses/CatTabs'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
const R = { color:'var(--red)' }

const FALLBACK = {
  examDate: '2026-11-29',
  cohortSize: 27,
  cathleteStart: '2026-09-03',
  'live-mocks': 27999, 'base': 6999, 'with-mocks': 9999,
  'alpgebra': 999, 'cat-mocks': 2999, 'cat-books': 3999, 'all-mba-mocks-books': 7999,
}

function formatDate(iso) {
  if (!iso) return null
  try { return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) }
  catch { return null }
}
function fmtPrice(n) { return `₹${Number(n).toLocaleString('en-IN')}` }

export async function getStaticProps() {
  try {
    const res = await fetch(`${API}/courses/exams/cat/`)
    const examData = res.ok ? await res.json() : null
    return { props: { examData }, revalidate: 300 }
  } catch {
    return { props: { examData: null }, revalidate: 60 }
  }
}

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
  const plans = examData?.plans || []
  const price = (slug) => {
    const plan = plans.find(p => p.slug === slug)
    return plan?.price_inr ? Number(plan.price_inr) : FALLBACK[slug]
  }
  const cathleteCourse = (examData?.courses || []).find(
    c => c.slug?.includes('cathlete') || c.title?.toLowerCase().includes('cathlete')
  )
  const cohortSize = examData?.seats_available?.cohort_size || FALLBACK.cohortSize
  const examDateFormatted = formatDate(examData?.exam_date) || formatDate(FALLBACK.examDate)
  const cathleteStartFormatted = formatDate(cathleteCourse?.start_date) || formatDate(FALLBACK.cathleteStart)
  const examYear = new Date(examData?.exam_date || FALLBACK.examDate).getFullYear()
  const catalysisYear = examYear + 1

  const catalysisPrice     = price('live-mocks')
  const cathleteBasePrice  = price('base')
  const cathleteMocksPrice = price('with-mocks')

  const MORE_PRODUCTS = [
    { href:'/courses/cat/alpgebra', name:'ALPgebra', slug:'alpgebra', desc:"99 theorems covering CAT's full Algebra syllabus, from first principles." },
    { href:'/checkout?course=cat&plan=cat-mocks', name:'CAT Mocks', slug:'cat-mocks', desc:'30 full-length CAT mocks with sectional tests — if you already have coaching but need mocks.' },
    { href:'/courses/cat/books', name:'CAT Books', slug:'cat-books', desc:`Curated physical books for CAT ${examYear} — recommended reading with ALP Sir's notes.` },
    { href:'/checkout?course=cat&plan=all-mba-mocks-books', name:'All MBA Mocks + Books', slug:'all-mba-mocks-books', desc:'Self-paced mocks across CAT and every OMET, plus the printed book set.' },
  ]

  const FAQS = [
    { q:'What is the difference between CATalysis and CAThlete?', a:`CATalysis is the full-year flagship programme starting from first principles — ideal if you are starting your prep now. CAThlete is an intensive crash course for the final stretch before CAT, starting ${cathleteStartFormatted}. Students who cannot commit to a full-year programme, or have already covered basics, opt for CAThlete.` },
    { q:'What is the CAT exam date?', a:`CAT ${examYear} is expected on ${examDateFormatted}. The exam is conducted by one of the IIMs on rotation and spans two to three slots across the day.` },
    { q:'How many students are in each CATalysis cohort?', a:`Every CATalysis cohort is capped at ${cohortSize} students, always, so ALP Sir can give individual attention and track every student's progress.` },
    { q:'Are sessions recorded?', a:'Yes. All live sessions are recorded and available to enrolled students within 24 hours, watchable at up to 2× speed with chapter markers and notes.' },
    { q:'What if I just need mocks, not a full course?', a:'CAT Mocks and All MBA Mocks + Books are both standalone — no live sessions, just full-length mocks (and books, for the latter) for students who already have coaching elsewhere.' },
    { q:'Is PI WAT GD preparation included?', a:'It\u2019s included with CATalysis at no extra cost, and with the top All MBA Mocks + Books tier.' },
  ]

  return (
    <>
      <PageSEO
        title={`CAT Preparation — CATalysis, CAThlete & More | GRADSKOOL`}
        description={`Every CAT ${catalysisYear} product from GRADSKOOL — CATalysis full cohort from ${fmtPrice(catalysisPrice)}, CAThlete crash course from ${fmtPrice(cathleteBasePrice)}, plus ALPgebra, mocks, and books.`}
        keywords={`CAT ${examYear} preparation, CATalysis, CAThlete, CAT coaching, ALP Sir CAT, GRADSKOOL CAT, CAT mocks, ALPgebra`}
        canonical="https://gradskool.in/courses/cat"
        ogImage="/assets/og-cat.jpg"
        breadcrumbs={[{name:'Home',url:'/'},{name:'Courses',url:'/courses'},{name:'CAT',url:'/courses/cat'}]}
        speakableSelectors={['h1']}
        schema={[
          courseSchema({name:`CATalysis — CAT ${catalysisYear} Preparation`,altName:'CATalysis',description:`GRADSKOOL's flagship CAT ${catalysisYear} cohort by Abhishek Leela Pandey. ${cohortSize} students per cohort.`,url:'/courses/cat/catalysis',price:String(catalysisPrice)}),
          courseSchema({name:`CAThlete — CAT ${examYear} Crash Course`,altName:'CAThlete',description:`Intensive CAT ${examYear} crash course starting ${cathleteStartFormatted}.`,url:'/courses/cat/cat-crash-course-2026',price:String(cathleteBasePrice)}),
          faqSchema(FAQS),
        ]}
      />
      <style>{S}</style>

      <CatTabs />

      {/* ── HERO ── */}
      <section style={{ padding:'64px 0 48px', borderBottom:'var(--border)' }}>
        <div className="container" style={{ textAlign:'center', maxWidth:640 }}>
          <div className="eyebrow" style={{ marginBottom:16, justifyContent:'center' }}><span className="dot" />CAT {examYear} · Preparation by ALP Sir</div>
          <h1 className="d-xl" style={{ marginBottom:18 }}>Two ways to <em style={R}>prepare for CAT.</em></h1>
          <p style={{ fontFamily:'var(--font-body)', fontSize:15, color:'var(--g700)', lineHeight:1.85, marginBottom:8 }}>
            A full-year flagship cohort, or an intensive crash course for the final stretch — plus standalone mocks, books, and Algebra prep for whatever else you need.
          </p>
        </div>
      </section>

      {/* ── CATALYSIS vs CATHLETE — brief teasers only, full detail lives on their own pages ── */}
      <section className="section">
        <div className="container">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }} className="cat-compare-2">
            <style>{`@media(max-width:800px){.cat-compare-2{grid-template-columns:1fr!important}}`}</style>

            <div style={{ border:'2px solid var(--red)', borderRadius:6, padding:'32px 34px', position:'relative', background:'#fff' }}>
              <div style={{ position:'absolute', top:-13, left:30, background:'var(--red)', color:'#fff', fontFamily:'var(--font-sans)', fontSize:10, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', padding:'4px 12px', borderRadius:2 }}>Full-year cohort</div>
              <div style={{ fontFamily:'var(--font-serif)', fontSize:24, color:'var(--black)', marginTop:8, marginBottom:8 }}>CATalysis</div>
              <p style={{ fontFamily:'var(--font-body)', fontSize:13.5, color:'var(--g700)', lineHeight:1.75, marginBottom:20 }}>
                400+ hours of live two-way teaching, {cohortSize} students per cohort, 30 full-length mocks. The complete IIM preparation route, from first principles.
              </p>
              <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:20 }}>
                <span style={{ fontFamily:'var(--font-serif)', fontSize:28, color:'var(--black)' }}>{fmtPrice(catalysisPrice)}</span>
                <span style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'var(--g500)' }}>incl. GST · from</span>
              </div>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                <Link href="/courses/cat/catalysis" className="btn btn-red">Explore CATalysis →</Link>
                <Link href={`/checkout?course=cat&plan=live-mocks`} className="btn btn-outline">Enrol Now →</Link>
              </div>
            </div>

            <div style={{ border:'var(--border)', borderRadius:6, padding:'32px 34px', background:'#fff' }}>
              <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--red)', marginBottom:16 }}>Crash course</div>
              <div style={{ fontFamily:'var(--font-serif)', fontSize:24, color:'var(--black)', marginBottom:8 }}>CAThlete</div>
              <p style={{ fontFamily:'var(--font-body)', fontSize:13.5, color:'var(--g700)', lineHeight:1.75, marginBottom:20 }}>
                Starting {cathleteStartFormatted}. Intensive, structured preparation for the final stretch before CAT {examYear} — for students short on time or who've already covered the basics.
              </p>
              <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:20 }}>
                <span style={{ fontFamily:'var(--font-serif)', fontSize:28, color:'var(--black)' }}>{fmtPrice(cathleteBasePrice)}</span>
                <span style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'var(--g500)' }}>incl. GST · from</span>
              </div>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                <Link href="/courses/cat/cat-crash-course-2026" className="btn btn-red">Explore CAThlete →</Link>
                <Link href={`/checkout?course=cathlete&plan=base`} className="btn btn-outline">Enrol Now →</Link>
              </div>
            </div>
          </div>
          <div style={{ textAlign:'center', marginTop:20 }}>
            <Link href="/courses/cat/pricing" style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'var(--red)' }}>View full CAT pricing →</Link>
          </div>
        </div>
      </section>

      {/* ── MORE CAT PRODUCTS ── */}
      <section style={{ padding:'56px 0', borderTop:'var(--border)', borderBottom:'var(--border)', background:'var(--off)' }}>
        <div className="container">
          <div style={{ marginBottom:28 }}>
            <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />Also for CAT</div>
            <h2 className="d-lg">Go deeper with<br /><em style={R}>focused products.</em></h2>
            <p style={{ fontFamily:'var(--font-body)', fontSize:14, color:'var(--g700)', marginTop:10, lineHeight:1.8, maxWidth:480 }}>Standalone products for specific needs — study alongside CATalysis or CAThlete, or entirely on their own.</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(230px,1fr))', gap:1, background:'var(--g200)', border:'var(--border)', borderRadius:4, overflow:'hidden' }}>
            {MORE_PRODUCTS.map(p => (
              <Link key={p.slug} href={p.href}
                style={{ background:'#fff', padding:'26px 22px', display:'block', textDecoration:'none', transition:'background var(--t)' }}
                onMouseEnter={e=>e.currentTarget.style.background='var(--off)'}
                onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:18, color:'var(--black)', marginBottom:4 }}>{p.name}</div>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:13, fontWeight:600, color:'var(--red)', marginBottom:8 }}>{fmtPrice(price(p.slug))}</div>
                <p style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--g700)', lineHeight:1.7, marginBottom:12 }}>{p.desc}</p>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'var(--g500)' }}>View →</div>
              </Link>
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
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:32 }} className="syl-grid">
            <style>{`@media(max-width:800px){.syl-grid{grid-template-columns:1fr!important}}`}</style>
            {SYLLABUS.map(s => (
              <div key={s.sec}>
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
            <h2 className="d-lg">What GRADSKOOL<br />students say</h2>
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
              <a href="https://wa.me/917838737388?text=Hi%20ALP%20Sir%2C%20I%20have%20a%20question%20about%20CAT%20preparation"
                target="_blank" rel="noopener noreferrer" className="btn btn-wa" style={{ marginTop:24, display:'inline-flex' }}>
                <span className="wa-dot" />Ask ALP Sir directly
              </a>
            </div>
            <CourseFaqAccordion faqs={FAQS} />
          </div>
        </div>
      </section>

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
            <Link href="/courses/cat/catalysis" className="btn btn-ghost">Explore CATalysis →</Link>
            <Link href="/courses/cat/cat-crash-course-2026" className="btn btn-ghost">Explore CAThlete →</Link>
          </div>
        </div>
      </section>

      {/* ── MOBILE STICKY ── */}
      <div className="mob-sticky">
        <div>
          <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:600, letterSpacing:'.07em', textTransform:'uppercase', color:'var(--g500)' }}>CAT Prep</div>
          <div style={{ fontFamily:'var(--font-serif)', fontSize:19, color:'var(--black)', lineHeight:1.2 }}>from {fmtPrice(cathleteBasePrice)}</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <a href={`https://wa.me/917838737388?text=Hi%20ALP%20Sir%2C%20about%20CAT%20${examYear}`}
            target="_blank" rel="noopener noreferrer"
            style={{ fontFamily:'var(--font-sans)', fontSize:12, fontWeight:600, color:'#25D366', border:'2px solid #25D366', padding:'8px 14px', borderRadius:2, textDecoration:'none' }}>
            WhatsApp
          </a>
          <Link href="/courses/cat/pricing"
            style={{ fontFamily:'var(--font-sans)', fontSize:12, fontWeight:600, background:'var(--red)', color:'#fff', padding:'8px 18px', borderRadius:2, textDecoration:'none' }}>
            See Pricing →
          </Link>
        </div>
      </div>

      <WaFloat msg={`Hi ALP Sir, I want to know more about CAT ${examYear} preparation`} />
    </>
  )
}
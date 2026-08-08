/**
 * GRADSKOOL — CAThlete Page
 * Route: /courses/cat/cathlete
 *
 * Previously only existed as a section within /courses/cat (#cathlete
 * anchor). Extracted into its own real page — same data source and
 * fallback pattern as the main CAT page, so it can never show different
 * numbers.
 */
import Head from 'next/head'
import Link from 'next/link'
import { S, WaFloat } from '../../../components/courses/CourseLayout'
import CatTabs from '../../../components/courses/CatTabs'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
const R = { color: 'var(--red)' }

const FALLBACK = {
  examDate: '2026-11-29',
  cathleteBasePrice: 6999,
  cathleteMocksPrice: 9999,
  cathleteStart: '2026-09-03',
  catalysisPrice: 17999,
}

function fmtPrice(n) {
  return `₹${Number(n).toLocaleString('en-IN')}`
}

function formatDate(iso) {
  if (!iso) return null
  try { return new Date(iso).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' }) }
  catch { return null }
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

export default function CathletePage({ examData }) {
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

  return (
    <>
      <Head>
        <title>{`CAThlete — CAT ${examYear} Crash Course by ALP Sir | From ${fmtPrice(cathleteBasePrice)}`}</title>
        <meta name="description" content={`CAThlete is GRADSKOOL's intensive CAT ${examYear} crash course starting ${cathleteStartFormatted}. Structured rapid preparation, live sessions.`} />
      </Head>

      <style>{`.cathlete-layout{display:grid;grid-template-columns:1fr 1fr;gap:48px}@media(max-width:960px){.cathlete-layout{grid-template-columns:1fr!important}}`}</style>
      <style>{S}</style>
      <CatTabs active="cathlete" />

      {/* hero */}
      <section style={{ background:'var(--black)', padding:'72px 0 56px', borderBottom:'var(--border)' }}>
        <div className="container">
          <Link href="/courses/cat" style={{ fontFamily:'var(--font-sans)', fontSize:13, color:'var(--g500)', textDecoration:'none' }}>← Back to CAT</Link>
          <div className="eyebrow" style={{ marginTop:20, marginBottom:14 }}><span className="dot" />CAT {examYear} Crash Course</div>
          <h1 className="d-xl" style={{ color:'#fff', marginBottom:20, maxWidth:640 }}>CAT<em style={R}>hlete.</em></h1>
          <p style={{ fontFamily:'var(--font-body)', fontSize:15, color:'var(--g500)', lineHeight:1.85, maxWidth:520, marginBottom:40 }}>
            Not ready for the full cohort? CAThlete is GRADSKOOL's intensive crash course for the final stretch before CAT {examYear}. Structured rapid preparation, live sessions, and the option to add mocks.
          </p>

          <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom:32 }}>
            {[
              { label:'CAThlete', sub:'Without Mocks', price: fmtPrice(cathleteBasePrice), href:'/checkout?course=cathlete&plan=base', tag:'' },
              { label:'CAThlete + Mocks', sub:'With 30 CAT Mocks', price: fmtPrice(cathleteMocksPrice), href:'/checkout?course=cathlete&plan=with-mocks', tag:'Recommended' },
            ].map(plan => (
              <div key={plan.label} style={{ background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.12)', borderRadius:4, padding:'24px 28px', minWidth:220 }}>
                {plan.tag && <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--red)', marginBottom:8 }}>{plan.tag}</div>}
                <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--g500)', marginBottom:6 }}>{plan.label}</div>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'var(--g500)', marginBottom:10 }}>{plan.sub}</div>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:34, color:'#fff', lineHeight:1, marginBottom:16 }}>{plan.price}</div>
                <Link href={plan.href} className="btn btn-red" style={{ fontSize:12, padding:'10px 20px' }}>Enrol →</Link>
              </div>
            ))}
          </div>

          <a href="https://wa.me/917838737388?text=Hi%20ALP%20Sir%2C%20I%20want%20to%20know%20more%20about%20CAThlete"
            target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
            <span className="wa-dot" />WhatsApp ALP Sir about CAThlete
          </a>
        </div>
      </section>

      {/* what's included + comparison */}
      <section className="section">
        <div className="container">
          <div className="cathlete-layout">
            <div>
              <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />What's included</div>
              <h2 className="d-lg" style={{ marginBottom:20 }}>Everything in<br /><em style={R}>CAThlete.</em></h2>
              {['Structured rapid CAT preparation — VARC, DILR, QA', `Live sessions starting ${cathleteStartFormatted}`, 'Session PDFs and cheat sheets for every topic', 'Doubt resolution sessions throughout the course', 'Post-mock strategic analysis (with mocks plan)', 'GRADSKOOL platform access — watch, bookmark, notes'].map(item => (
                <div key={item} style={{ fontFamily:'var(--font-body)', fontSize:14, color:'var(--g700)', padding:'10px 0', borderBottom:'var(--border)', display:'flex', gap:10, lineHeight:1.6 }}>
                  <span style={R}>—</span><span>{item}</span>
                </div>
              ))}
            </div>

            <div>
              <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />Which one is right for you?</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:1, background:'var(--g200)', border:'var(--border)', borderRadius:4, overflow:'hidden' }}>
                <div style={{ background:'var(--black)', padding:'24px 22px', color:'#fff' }}>
                  <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--red)', marginBottom:8 }}>CAThlete</div>
                  <div style={{ fontFamily:'var(--font-serif)', fontSize:17, color:'#fff', marginBottom:10, lineHeight:1.3 }}>Starting from scratch or short on time</div>
                  <p style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'var(--g500)', lineHeight:1.7, marginBottom:16 }}>Starting {cathleteStartFormatted}. {fmtPrice(cathleteBasePrice)} without mocks or {fmtPrice(cathleteMocksPrice)} with mocks.</p>
                  <Link href="/checkout?course=cathlete" className="btn btn-red" style={{ fontSize:12, padding:'10px 18px' }}>Enrol in CAThlete →</Link>
                </div>
                <div style={{ background:'#fff', padding:'24px 22px' }}>
                  <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--red)', marginBottom:8 }}>{`CATalysis ${catalysisYear}`}</div>
                  <div style={{ fontFamily:'var(--font-serif)', fontSize:17, color:'var(--black)', marginBottom:10, lineHeight:1.3 }}>Full-year structured preparation</div>
                  <p style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'var(--g700)', lineHeight:1.7, marginBottom:16 }}>From first principles to exam day. 400+ hours live, 30 mocks. The complete IIM preparation route.</p>
                  <Link href="/courses/cat/catalysis" className="btn btn-outline" style={{ fontSize:12, padding:'10px 18px' }}>See CATalysis →</Link>
                </div>
              </div>
            </div>
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
      <WaFloat msg="Hi ALP Sir, I want to know more about CAThlete" />
    </>
  )
}
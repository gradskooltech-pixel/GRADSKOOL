/**
 * GRADSKOOL — SNAP + NMAT Mocks Bundle
 * Route: /courses/nmat-snap
 *
 * Both exams' Mocks packages together at a bundle price — the paid
 * practice/testing product, same positioning as the individual
 * /courses/nmat and /courses/snap pages. The complete courses for both
 * exams are free at /courses/nmat/live and /courses/snap/live.
 */
import Link from 'next/link'
import PageSEO, { courseSchema, faqSchema } from '../../components/seo/PageSEO'
import { S, CourseFaqAccordion, WaFloat, CourseTestimonials } from '../../components/courses/CourseLayout'

const R = { color:'var(--red)' }

const COLLEGES = [
  { name:'NMIMS Mumbai',  courses:'Core MBA, HRM, Pharmacy MBA', note:'Premier NMAT college' },
  { name:'SCMHRD Pune',   courses:'MBA',                         note:'#1 SNAP college' },
  { name:'NMIMS Bangalore',courses:'MBA',                        note:'NMAT' },
  { name:'SIBM Pune',     courses:'MBA',                         note:'Top 3 SNAP college' },
  { name:'NMIMS Hyderabad',courses:'MBA',                        note:'NMAT' },
  { name:'SIIB Pune',     courses:'MBA',                         note:'International Business, SNAP' },
]

const TESTIS = [
  { text:"Grateful to share that I have converted NMIMS Mumbai – Core MBA. This milestone would not have been possible without the constant guidance of ALP Sir and the entire GRADSKOOL team.", name:'Prathamesh Mulay', detail:'NMIMS Mumbai Core MBA' },
  { text:"Grateful to have converted NMIMS Mumbai Core! A big thank you to ALP Sir and the entire team at GRADSKOOL for their constant guidance, mentorship, and belief in me throughout this journey.", name:'Avivratta Krishna', detail:'NMIMS Mumbai Core' },
  { text:"In just a week I was able to get ready for the NMIMS Competency Test with the help of GRADSKOOL. The confidence-building sessions made a significant difference.", name:'Ishan', detail:'NMIMS Competency Test' },
]

const FAQS = [
  { q:'What exactly is in the bundle?', a:'Everything from NMAT Mocks (10 full-length mocks, 12 sectional tests, 40 area-wise tests) and everything from SNAP Mocks (20 full-length mocks, 9 sectional tests, area-wise tests) — both exams, one price.' },
  { q:'How much do I save?', a:'NMAT Mocks and SNAP Mocks are ₹1,499 each separately (₹2,999 total). The bundle is ₹2,499 — a saving of ₹500.' },
  { q:'Are the complete NMAT and SNAP courses included too?', a:'The complete courses for both exams are free, separately, at /courses/nmat/live and /courses/snap/live — taught live by ALP Sir, no cost. This bundle is the mocks and testing layer on top of that.' },
  { q:'Why prepare for both NMAT and SNAP together?', a:'Both exams share significant overlap in Language Skills, Quantitative Skills, and Logical Reasoning. Many students targeting NMIMS and Symbiosis colleges appear for both — preparing together is efficient.' },
  { q:'Can I add this bundle to CATalysis?', a:"The bundle itself is priced for standalone purchase. If you're enrolled in CATalysis, NMAT and SNAP Mocks are each available as individual add-ons at ₹1,999 (saving ₹1,000 each) instead." },
  { q:'How is my performance analysed?', a:'Every mock and sectional test — across both exams — comes with a detailed report: section-wise accuracy, time spent per question, percentile estimate, and topic-wise weaknesses to work on.' },
]

export default function NMATSnapBundlePage() {
  return (
    <>
      <PageSEO
        title="SNAP + NMAT Mocks Bundle — GRADSKOOL | ₹2,499 | Save ₹500"
        description="Both exams' mocks, sectionals, and area-wise tests together. 10 NMAT mocks + 20 SNAP mocks, with detailed analysis. ₹2,499, saving ₹500 vs buying separately."
        keywords="NMAT SNAP bundle, SNAP NMAT mock tests, NMIMS coaching, SCMHRD coaching, ALP Sir NMAT SNAP, GRADSKOOL bundle"
        canonical="https://gradskool.in/courses/nmat-snap"
        ogImage="/assets/og-nmat.jpg"
        breadcrumbs={[{name:'Home',url:'/'},{name:'OMETs',url:'/omets'},{name:'SNAP + NMAT Bundle',url:'/courses/nmat-snap'}]}
        schema={[
          courseSchema({name:'SNAP + NMAT Mocks Bundle',description:"Both exams' mocks, sectionals, and area-wise tests together — 10 NMAT mocks, 20 SNAP mocks, with detailed analysis reports.",url:'/courses/nmat-snap',price:'2499',mode:['online','asynchronous']}),
          faqSchema(FAQS),
        ]}
      />
      <style>{S}</style>

      {/* ── HERO ── */}
      <section style={{ background:'var(--black)', padding:'72px 0 64px', borderBottom:'var(--border)' }}>
        <div className="container">
          <div className="eyebrow" style={{ marginBottom:18, color:'var(--g500)' }}><span className="dot" />Bundle · Mocks · Sectionals · Area-wise Tests</div>
          <h1 className="d-xl" style={{ color:'#fff', marginBottom:18 }}>SNAP + NMAT.<br /><em style={R}>One price, both exams.</em></h1>
          <p style={{ fontFamily:'var(--font-body)', fontSize:15, color:'var(--g500)', lineHeight:1.85, maxWidth:560, marginBottom:32 }}>
            Full mocks, sectional tests, and area-wise tests for both NMAT and SNAP — the two exams share significant syllabus overlap, and most students preparing for one end up appearing for both.
          </p>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <Link href="/checkout?course=nmat-snap" className="btn btn-red">Enrol Now — ₹2,499 →</Link>
            <a href="https://wa.me/917838737388?text=Hi%20ALP%20Sir%2C%20I%20want%20to%20know%20about%20the%20SNAP%20%2B%20NMAT%20bundle" target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
              <span className="wa-dot" />WhatsApp ALP Sir
            </a>
          </div>
          <div style={{ display:'flex', gap:32, marginTop:44, paddingTop:24, borderTop:'1px solid rgba(255,255,255,.1)', flexWrap:'wrap' }}>
            {[['30','Full-length mocks'],['21','Sectional tests'],['₹500','You save'],['2','Exams covered']].map(([v,l]) => (
              <div key={l}>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:20, color:'#fff', lineHeight:1 }}>{v}</div>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'var(--g500)', marginTop:3 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="section">
        <div className="container">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:40 }} className="price-layout">
            <style>{`@media(max-width:960px){.price-layout{grid-template-columns:1fr!important}}`}</style>
            <div>
              <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />What's included</div>
              <h2 className="d-lg" style={{ marginBottom:20 }}>Both exams,<br /><em style={R}>fully covered.</em></h2>
              <div style={{ background:'var(--off)', border:'var(--border)', borderRadius:4, padding:'28px 32px' }}>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:20, color:'var(--black)', marginBottom:14 }}>SNAP + NMAT Mocks Bundle</div>
                {['10 full-length NMAT mocks — real exam interface and timing','12 NMAT sectional tests — Language, Quant, Reasoning individually','40 NMAT area-wise topic tests','20 full-length SNAP mocks — real exam interface and timing','9 SNAP sectional tests — Language, Quant, Reasoning individually','SNAP area-wise topic tests','Detailed analysis report after every attempt, both exams'].map(item => (
                  <div key={item} style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--g700)', marginBottom:7, display:'flex', gap:8 }}>
                    <span style={R}>—</span><span>{item}</span>
                  </div>
                ))}
                <div style={{ marginTop:20, display:'flex', alignItems:'baseline', gap:12, borderTop:'var(--border)', paddingTop:16 }}>
                  <div style={{ fontFamily:'var(--font-serif)', fontSize:38, color:'var(--black)', lineHeight:1 }}>₹2,499</div>
                  <div style={{ fontFamily:'var(--font-sans)', fontSize:13, color:'var(--g500)', textDecoration:'line-through' }}>₹2,999</div>
                  <div style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'var(--g500)' }}>+ GST</div>
                </div>
                <Link href="/checkout?course=nmat-snap" className="btn btn-red" style={{ marginTop:14, width:'100%', justifyContent:'center' }}>Enrol Now →</Link>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div className="eyebrow" style={{ marginBottom:2 }}><span className="dot" />Learn both free first</div>
              <div style={{ background:'var(--off)', border:'var(--border)', borderRadius:4, padding:'24px 28px' }}>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:16, color:'var(--black)', marginBottom:6 }}>NMAT — Complete Course, Free</div>
                <p style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'var(--g500)', lineHeight:1.7, marginBottom:16 }}>Every topic, taught live by ALP Sir, entirely free.</p>
                <Link href="/courses/nmat/live" className="btn btn-red" style={{ fontSize:12, padding:'10px 18px' }}>Explore free course →</Link>
              </div>
              <div style={{ background:'var(--off)', border:'var(--border)', borderRadius:4, padding:'24px 28px' }}>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:16, color:'var(--black)', marginBottom:6 }}>SNAP — Complete Course, Free</div>
                <p style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'var(--g500)', lineHeight:1.7, marginBottom:16 }}>Every topic, taught live by ALP Sir, entirely free.</p>
                <Link href="/courses/snap/live" className="btn btn-red" style={{ fontSize:12, padding:'10px 18px' }}>Explore free course →</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CATHLETE CROSS-PROMO ── */}
      <div style={{ background:'linear-gradient(135deg,#1a1a18 55%,#2a2927)', padding:'28px 0' }}>
        <div className="container" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:20, flexWrap:'wrap' }}>
          <div>
            <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--red)', marginBottom:6 }}>Also preparing for CAT?</div>
            <p style={{ fontFamily:'var(--font-body)', fontSize:14, color:'#fff', lineHeight:1.6 }}>CAThlete — GRADSKOOL's intensive CAT crash course, from ₹6,999. A lot of NMAT/SNAP students take both.</p>
          </div>
          <Link href="/courses/cat/cathlete" className="btn btn-red" style={{ flexShrink:0 }}>Explore CAThlete →</Link>
        </div>
      </div>

      {/* ── COLLEGES ── */}
      <section style={{ padding:'72px 0', borderBottom:'var(--border)', background:'var(--off)' }}>
        <div className="container">
          <div style={{ marginBottom:32 }}>
            <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />Where they take you</div>
            <h2 className="d-lg">Top colleges across<br /><em style={R}>both exams</em></h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:1, background:'var(--g200)', border:'var(--border)', borderRadius:4, overflow:'hidden' }}
            className="col-grid-3">
            <style>{`@media(max-width:960px){.col-grid-3{grid-template-columns:1fr!important}}`}</style>
            {COLLEGES.map(c => (
              <div key={c.name} style={{ background:'#fff', padding:'20px 24px' }}>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:16, color:'var(--black)', marginBottom:3 }}>{c.name}</div>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'var(--g700)', marginBottom:3 }}>{c.courses}</div>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'var(--g500)' }}>{c.note}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="section">
        <div className="container">
          <div style={{ marginBottom:32 }}>
            <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />Student results</div>
            <h2 className="d-lg">Students who converted.</h2>
          </div>
          <CourseTestimonials testis={TESTIS} />
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding:'72px 0', borderBottom:'var(--border)', background:'var(--off)' }}>
        <div className="container">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:64 }} className="faq-layout">
            <style>{`@media(max-width:960px){.faq-layout{grid-template-columns:1fr!important}}`}</style>
            <div>
              <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />Questions</div>
              <h2 className="d-lg">Common questions.</h2>
              <a href="https://wa.me/917838737388?text=Hi%20ALP%20Sir%2C%20I%20have%20a%20question%20about%20the%20SNAP%20%2B%20NMAT%20bundle" target="_blank" rel="noopener noreferrer" className="btn btn-wa" style={{ marginTop:24, display:'inline-flex' }}>
                <span className="wa-dot" />Ask ALP Sir
              </a>
            </div>
            <CourseFaqAccordion faqs={FAQS} />
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background:'var(--black)', padding:'72px 0', textAlign:'center' }}>
        <div className="container">
          <h2 style={{ fontFamily:'var(--font-serif)', fontSize:'clamp(26px,4vw,44px)', fontWeight:400, color:'#fff', marginBottom:14 }}>
            Two exams.<br /><em style={R}>One decision.</em>
          </h2>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap', marginTop:24 }}>
            <Link href="/checkout?course=nmat-snap" className="btn btn-red">Enrol Now — ₹2,499 →</Link>
            <a href="https://wa.me/917838737388?text=Hi%20ALP%20Sir%2C%20about%20the%20SNAP%20%2B%20NMAT%20bundle" target="_blank" rel="noopener noreferrer" className="btn btn-ghost"><span className="wa-dot" />WhatsApp first</a>
          </div>
        </div>
      </section>

      <div className="mob-sticky">
        <div>
          <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:600, letterSpacing:'.07em', textTransform:'uppercase', color:'var(--g500)' }}>SNAP + NMAT Bundle</div>
          <div style={{ fontFamily:'var(--font-serif)', fontSize:19, color:'var(--black)' }}>₹2,499 + GST</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <a href="https://wa.me/917838737388?text=Hi%20ALP%20Sir%2C%20about%20the%20SNAP%20%2B%20NMAT%20bundle" target="_blank" rel="noopener noreferrer"
            style={{ fontFamily:'var(--font-sans)', fontSize:12, fontWeight:600, color:'#25D366', border:'2px solid #25D366', padding:'8px 14px', borderRadius:2, textDecoration:'none' }}>WhatsApp</a>
          <Link href="/checkout?course=nmat-snap" style={{ fontFamily:'var(--font-sans)', fontSize:12, fontWeight:600, background:'var(--red)', color:'#fff', padding:'8px 18px', borderRadius:2, textDecoration:'none' }}>Enrol →</Link>
        </div>
      </div>
      <WaFloat msg="Hi ALP Sir, I want to know more about the SNAP + NMAT bundle" />
    </>
  )
}
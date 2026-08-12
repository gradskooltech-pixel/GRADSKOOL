/**
 * GRADSKOOL — SNAP + NMAT Mocks Bundle
 * Route: /courses/nmat-snap
 *
 * Both exams' Mocks packages together at a bundle price — the paid
 * practice/testing product, same positioning as the individual
 * /courses/nmat and /courses/snap pages. The complete courses for both
 * exams are free at /courses/nmat/live and /courses/snap/live.
 *
 * Restyled to match CAT's design language (light 2-column hero with
 * pricing card) instead of its earlier dark single-column hero — for
 * visual consistency across every course page.
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
  { q:'Can I add this bundle to CATalysis?', a:"The bundle itself is priced for standalone purchase. If you're enrolled in CATalysis, NMAT and SNAP Mocks are each available as individual add-ons instead." },
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

      {/* hero */}
      <section style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr' }} className="bundle-hero">
        <style>{`@media(max-width:960px){.bundle-hero{grid-template-columns:1fr!important}}`}</style>
        <style>{S}</style>
        <div style={{ padding:'72px 48px 56px' }}>
          <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />Bundle · Mocks · Sectionals · Area-wise Tests</div>
          <h1 className="d-xl" style={{ marginBottom:20, maxWidth:520 }}>SNAP + NMAT.<br /><em style={R}>One price, both exams.</em></h1>
          <p style={{ fontFamily:'var(--font-body)', fontSize:15, color:'var(--g700)', lineHeight:1.85, maxWidth:520, marginBottom:32 }}>
            Full mocks, sectional tests, and area-wise tests for both NMAT and SNAP — the two exams share significant syllabus overlap, and most students preparing for one end up appearing for both.
          </p>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <Link href="/checkout?course=nmat-snap" className="btn btn-red">Enrol Now — ₹2,499 →</Link>
            <a href="https://wa.me/917838737388?text=Hi%20ALP%20Sir%2C%20I%20want%20to%20know%20about%20the%20SNAP%20%2B%20NMAT%20bundle" target="_blank" rel="noopener noreferrer" className="btn btn-wa">
              <span className="wa-dot" />WhatsApp ALP Sir
            </a>
          </div>
          <div style={{ display:'flex', gap:28, marginTop:44, paddingTop:24, borderTop:'var(--border)', flexWrap:'wrap' }}>
            {[['30','Full-length mocks'],['21','Sectional tests'],['₹500','You save'],['2','Exams covered']].map(([v,l]) => (
              <div key={l}>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:22, color:'var(--black)', lineHeight:1 }}>{v}</div>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'var(--g500)', marginTop:3 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background:'var(--off)', display:'flex', flexDirection:'column', justifyContent:'center', padding:'40px 48px', gap:16 }}>
          <div style={{ background:'#fff', border:'var(--border)', borderRadius:4, padding:'28px 32px' }}>
            <div style={{ fontFamily:'var(--font-serif)', fontSize:20, color:'var(--black)', marginBottom:14 }}>SNAP + NMAT Mocks Bundle</div>
            {['10 full-length NMAT mocks + 12 sectional + 40 area-wise tests','20 full-length SNAP mocks + 9 sectional + area-wise tests','Detailed analysis report after every attempt, both exams'].map(item => (
              <div key={item} style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--g700)', marginBottom:6, display:'flex', gap:8 }}>
                <span style={R}>—</span><span>{item}</span>
              </div>
            ))}
            <div style={{ marginTop:20, display:'flex', alignItems:'baseline', gap:12, borderTop:'var(--border)', paddingTop:16 }}>
              <div style={{ fontFamily:'var(--font-serif)', fontSize:38, color:'var(--black)', lineHeight:1 }}>₹2,499</div>
              <div style={{ fontFamily:'var(--font-sans)', fontSize:13, color:'var(--g500)', textDecoration:'line-through' }}>₹2,999</div>
              <div style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'var(--g500)' }}>incl. GST</div>
            </div>
            <Link href="/checkout?course=nmat-snap" className="btn btn-red" style={{ marginTop:14, width:'100%', justifyContent:'center' }}>Enrol Now →</Link>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div style={{ background:'#fff', border:'var(--border)', borderRadius:4, padding:'16px 18px' }}>
              <div style={{ fontFamily:'var(--font-serif)', fontSize:13, color:'var(--black)', marginBottom:8 }}>NMAT free course</div>
              <Link href="/courses/nmat/live" className="btn btn-outline" style={{ fontSize:11, padding:'7px 12px' }}>Explore →</Link>
            </div>
            <div style={{ background:'#fff', border:'var(--border)', borderRadius:4, padding:'16px 18px' }}>
              <div style={{ fontFamily:'var(--font-serif)', fontSize:13, color:'var(--black)', marginBottom:8 }}>SNAP free course</div>
              <Link href="/courses/snap/live" className="btn btn-outline" style={{ fontSize:11, padding:'7px 12px' }}>Explore →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* also available */}
      <section className="section">
        <div className="container">
          <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />Also preparing for CAT?</div>
          <h2 className="d-lg" style={{ marginBottom:28 }}>Round out your <em style={R}>prep.</em></h2>
          <Link href="/courses/cat/cathlete" style={{ background:'var(--off)', border:'var(--border)', borderRadius:4, padding:'24px', textDecoration:'none', display:'block', maxWidth:420 }}>
            <div style={{ fontFamily:'var(--font-serif)', fontSize:18, color:'var(--black)', marginBottom:8 }}>CAThlete</div>
            <div style={{ fontFamily:'var(--font-sans)', fontSize:13, fontWeight:700, color:'var(--red)', marginBottom:10 }}>₹6,999</div>
            <p style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--g700)', lineHeight:1.6, marginBottom:12 }}>GRADSKOOL's intensive CAT crash course. A lot of NMAT/SNAP students take both.</p>
            <span style={{ fontFamily:'var(--font-sans)', fontSize:12, fontWeight:600, color:'var(--red)' }}>Explore CAThlete →</span>
          </Link>
        </div>
      </section>

      {/* colleges */}
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

      {/* testimonials */}
      <section className="section">
        <div className="container">
          <div style={{ marginBottom:32 }}>
            <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />Student results</div>
            <h2 className="d-lg">Students who converted.</h2>
          </div>
          <CourseTestimonials testis={TESTIS} />
        </div>
      </section>

      {/* faq */}
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

      {/* final cta */}
      <section style={{ padding:'72px 0', textAlign:'center' }}>
        <div className="container">
          <h2 style={{ fontFamily:'var(--font-serif)', fontSize:'clamp(26px,4vw,44px)', fontWeight:400, color:'var(--black)', marginBottom:14 }}>
            Two exams. <em style={R}>One decision.</em>
          </h2>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap', marginTop:24 }}>
            <Link href="/checkout?course=nmat-snap" className="btn btn-red">Enrol Now — ₹2,499 →</Link>
            <a href="https://wa.me/917838737388?text=Hi%20ALP%20Sir%2C%20about%20the%20SNAP%20%2B%20NMAT%20bundle" target="_blank" rel="noopener noreferrer" className="btn btn-wa"><span className="wa-dot" />WhatsApp first</a>
          </div>
        </div>
      </section>

      <div className="mob-sticky">
        <div>
          <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:600, letterSpacing:'.07em', textTransform:'uppercase', color:'var(--g500)' }}>SNAP + NMAT Bundle</div>
          <div style={{ fontFamily:'var(--font-serif)', fontSize:19, color:'var(--black)' }}>₹2,499 incl. GST</div>
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
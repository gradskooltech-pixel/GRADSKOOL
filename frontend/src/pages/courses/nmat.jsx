/**
 * GRADSKOOL — NMAT Mocks
 * Route: /courses/nmat (also /nmat)
 *
 * Repositioned: the free NMAT Foundations (/foundations/nmat) now covers the
 * complete taught course. This page is purely the practice/testing product —
 * full-length mocks, sectional tests, area-wise tests — so there's no overlap
 * between the free and paid offerings.
 *
 * Restyled to match CAT's design language (light 2-column hero with
 * pricing card) instead of its earlier dark single-column hero — for
 * visual consistency across every course page.
 *
 * NOTE: mock/sectional/area-wise-test counts below are placeholders matching
 * the style of numbers already used elsewhere on the site (e.g. XAT's mock
 * package) — swap in your real counts before this goes live.
 */
import Link from 'next/link'
import PageSEO, { courseSchema, faqSchema } from '../../components/seo/PageSEO'
import { S, CourseFaqAccordion, WaFloat, CourseTestimonials } from '../../components/courses/CourseLayout'

const R = { color:'var(--red)' }

const COVERAGE = [
  { sec:'Language Skills',     topics:['Reading Comprehension — short passages','Verbal Reasoning — analogies, sentence completion','Grammar and usage — error identification','Para-jumbles and sentence correction','Vocabulary in context','Fill in the blanks'] },
  { sec:'Quantitative Skills', topics:['Arithmetic — percentages, ratios, profit-loss, TSD','Algebra — linear & quadratic equations','Geometry — basic shapes and mensuration','Data Sufficiency — NMAT DS format','Number systems and modern math','Probability and combinations'] },
  { sec:'Logical Reasoning',   topics:['Analytical Reasoning — blood relations, direction sense','Seating arrangements and grouping','Puzzles — grid, floor, scheduling','Data Interpretation caselets','Syllogisms and coding-decoding','Critical reasoning'] },
]

const COLLEGES = [
  { name:'NMIMS Mumbai',     courses:'Core MBA, HRM, Pharmacy MBA', note:'Premier NMAT college' },
  { name:'NMIMS Bangalore',  courses:'MBA',                         note:'Bangalore campus' },
  { name:'NMIMS Hyderabad',  courses:'MBA',                         note:'Hyderabad campus' },
  { name:'NMIMS Navi Mumbai',courses:'MBA',                         note:'Navi Mumbai campus' },
  { name:'Alliance Bangalore',courses:'MBA',                        note:'Top NMAT college' },
  { name:'UPES Dehradun',    courses:'MBA',                         note:'Accepts NMAT score' },
]

const TESTIS = [
  { text:"Grateful to share that I have converted NMIMS Mumbai – Core MBA. This milestone would not have been possible without the constant guidance of ALP Sir and the entire GRADSKOOL team.", name:'Prathamesh Mulay', detail:'NMIMS Mumbai Core MBA' },
  { text:"Grateful to have converted NMIMS Mumbai Core! A big thank you to ALP Sir and the entire team at GRADSKOOL for their constant guidance, mentorship, and belief in me throughout this journey.", name:'Avivratta Krishna', detail:'NMIMS Mumbai Core' },
  { text:"In just a week I was able to get ready for the NMIMS Competency Test with the help of GRADSKOOL. The confidence-building sessions made a significant difference.", name:'Ishan', detail:'NMIMS Competency Test' },
]

const FAQS = [
  { q:'What is NMAT and who conducts it?', a:'NMAT by GMAC is conducted by GMAC (Graduate Management Admission Council). It is accepted by NMIMS Mumbai, NMIMS Bangalore, NMIMS Hyderabad, Alliance University, and several other top MBA colleges. NMAT allows up to 3 attempts per cycle — a unique advantage.' },
  { q:'What exactly do I get in NMAT Mocks?', a:'10 full-length NMAT mocks in the real exam interface and timing, 12 sectional tests (Language, Quant, Reasoning individually), and 40 area-wise topic tests for granular practice. Every mock comes with a detailed analysis report.' },
  { q:"Isn't the NMAT course free on GRADSKOOL now?", a:"The complete NMAT course — every topic, taught live by ALP Sir — is free at /courses/nmat/live. This page is the practice layer on top of that: structured mocks, sectionals, and area-wise tests to actually test what you've learned, in the real exam format." },
  { q:'What makes NMAT unique?', a:"NMAT allows 3 attempts in one cycle — you can retake the exam if your first attempt doesn't go well. It also has no negative marking, which changes test-taking strategy significantly. NMAT also has a unique Data Sufficiency format — the mocks are built around these specifics." },
  { q:'How is my performance analysed?', a:'Every mock and sectional test comes with a detailed report — section-wise accuracy, time spent per question, percentile estimate, and specific topic weaknesses to work on before your next attempt.' },
  { q:'Can I combine NMAT Mocks with SNAP Mocks?', a:'Yes. The SNAP + NMAT Mocks bundle is available at ₹2,499 — saving ₹500 compared to buying them separately.' },
]

export default function NMATPage() {
  return (
    <>
      <PageSEO
        title="NMAT Mocks — GRADSKOOL | ₹1,499 | Mocks + Sectionals + Area-wise Tests"
        description="GRADSKOOL NMAT Mocks. 10 full-length mocks, 12 sectional tests, 40 area-wise tests, with detailed analysis. Pairs with the free NMAT course at /courses/nmat/live."
        keywords="NMAT mock tests, NMAT sectional tests, NMAT area-wise tests, NMIMS Mumbai coaching, ALP Sir NMAT, GRADSKOOL NMAT, NMAT by GMAC"
        canonical="https://gradskool.in/courses/nmat"
        ogImage="/assets/og-nmat.jpg"
        breadcrumbs={[{name:'Home',url:'/'},{name:'OMETs',url:'/omets'},{name:'NMAT',url:'/courses/nmat'}]}
        schema={[
          courseSchema({name:'NMAT Mocks',description:"GRADSKOOL NMAT Mocks. 10 full-length mocks, 12 sectional tests, 40 area-wise tests, with detailed analysis reports.",url:'/courses/nmat',price:'1499',mode:['online','asynchronous']}),
          faqSchema(FAQS),
        ]}
      />

      {/* hero */}
      <section style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr' }} className="nmat-hero">
        <style>{`@media(max-width:960px){.nmat-hero{grid-template-columns:1fr!important}}`}</style>
        <style>{S}</style>
        <div style={{ padding:'72px 48px 56px' }}>
          <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />NMAT · Mocks · Sectionals · Area-wise Tests</div>
          <h1 className="d-xl" style={{ marginBottom:20, maxWidth:520 }}>NMAT <em style={R}>Mocks.</em></h1>
          <p style={{ fontFamily:'var(--font-body)', fontSize:15, color:'var(--g700)', lineHeight:1.85, maxWidth:480, marginBottom:32 }}>
            10 full-length NMAT mocks in the real exam interface. 12 sectional tests. 40 area-wise topic tests. Every attempt comes with a detailed analysis report. The complete course is free — this is the practice layer.
          </p>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <Link href="/checkout?course=nmat" className="btn btn-red">Enrol Now — ₹1,499 →</Link>
            <a href="https://wa.me/917838737388?text=Hi%20ALP%20Sir%2C%20I%20want%20to%20know%20about%20NMAT%20Mocks" target="_blank" rel="noopener noreferrer" className="btn btn-wa">
              <span className="wa-dot" />WhatsApp ALP Sir
            </a>
          </div>
          <div style={{ display:'flex', gap:28, marginTop:44, paddingTop:24, borderTop:'var(--border)', flexWrap:'wrap' }}>
            {[['10','Full-length mocks'],['12','Sectional tests'],['40','Area-wise tests'],['3','Exam attempts allowed']].map(([v,l]) => (
              <div key={l}>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:22, color:'var(--black)', lineHeight:1 }}>{v}</div>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'var(--g500)', marginTop:3 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background:'var(--off)', display:'flex', flexDirection:'column', justifyContent:'center', padding:'40px 48px', gap:16 }}>
          <div style={{ background:'#fff', border:'var(--border)', borderRadius:4, padding:'28px 32px' }}>
            <div style={{ fontFamily:'var(--font-serif)', fontSize:20, color:'var(--black)', marginBottom:14 }}>NMAT Mocks</div>
            {['10 full-length NMAT mocks — real exam interface and timing','12 sectional tests — Language, Quant, Reasoning individually','40 area-wise topic tests for granular practice','Detailed analysis report after every attempt','Percentile estimate and topic-wise weakness tracking'].map(item => (
              <div key={item} style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--g700)', marginBottom:6, display:'flex', gap:8 }}>
                <span style={R}>—</span><span>{item}</span>
              </div>
            ))}
            <div style={{ marginTop:20, display:'flex', alignItems:'baseline', gap:12, borderTop:'var(--border)', paddingTop:16 }}>
              <div style={{ fontFamily:'var(--font-serif)', fontSize:38, color:'var(--black)', lineHeight:1 }}>₹1,499</div>
              <div style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'var(--g500)' }}>+ GST</div>
            </div>
            <Link href="/checkout?course=nmat" className="btn btn-red" style={{ marginTop:14, width:'100%', justifyContent:'center' }}>Enrol Now →</Link>
          </div>
          <div style={{ background:'#fff', border:'var(--border)', borderRadius:4, padding:'20px 24px' }}>
            <div style={{ fontFamily:'var(--font-serif)', fontSize:15, color:'var(--black)', marginBottom:6 }}>NMAT — Complete Course, Free</div>
            <p style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'var(--g500)', lineHeight:1.7, marginBottom:14 }}>Every topic, taught live by ALP Sir, entirely free. Then come back here to test yourself.</p>
            <Link href="/courses/nmat/live" className="btn btn-outline" style={{ fontSize:12, padding:'9px 18px' }}>Explore free course →</Link>
          </div>
        </div>
      </section>

      {/* also available */}
      <section className="section">
        <div className="container">
          <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />Also preparing for other exams</div>
          <h2 className="d-lg" style={{ marginBottom:28 }}>Round out your <em style={R}>prep.</em></h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16 }} className="also-grid-2">
            <style>{`@media(max-width:700px){.also-grid-2{grid-template-columns:1fr!important}}`}</style>
            <Link href="/courses/nmat-snap" style={{ background:'var(--off)', border:'var(--border)', borderRadius:4, padding:'24px', textDecoration:'none', display:'block' }}>
              <div style={{ fontFamily:'var(--font-serif)', fontSize:18, color:'var(--black)', marginBottom:8 }}>SNAP + NMAT Bundle</div>
              <div style={{ fontFamily:'var(--font-sans)', fontSize:13, fontWeight:700, color:'var(--red)', marginBottom:10 }}>₹2,499</div>
              <p style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--g700)', lineHeight:1.6, marginBottom:12 }}>Both exams' mocks, sectionals, and area-wise tests together — save ₹500 vs buying separately.</p>
              <span style={{ fontFamily:'var(--font-sans)', fontSize:12, fontWeight:600, color:'var(--red)' }}>View bundle →</span>
            </Link>
            <Link href="/courses/cat/cathlete" style={{ background:'var(--off)', border:'var(--border)', borderRadius:4, padding:'24px', textDecoration:'none', display:'block' }}>
              <div style={{ fontFamily:'var(--font-serif)', fontSize:18, color:'var(--black)', marginBottom:8 }}>CAThlete</div>
              <div style={{ fontFamily:'var(--font-sans)', fontSize:13, fontWeight:700, color:'var(--red)', marginBottom:10 }}>₹6,999</div>
              <p style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--g700)', lineHeight:1.6, marginBottom:12 }}>GRADSKOOL's intensive CAT crash course. A lot of NMAT students take both.</p>
              <span style={{ fontFamily:'var(--font-sans)', fontSize:12, fontWeight:600, color:'var(--red)' }}>Explore CAThlete →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* coverage */}
      <section style={{ padding:'72px 0', borderBottom:'var(--border)', background:'var(--off)' }}>
        <div className="container">
          <div style={{ marginBottom:32 }}>
            <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />Full coverage</div>
            <h2 className="d-lg">Every area the mocks test.</h2>
            <p style={{ fontFamily:'var(--font-body)', fontSize:14, color:'var(--g700)', marginTop:10, maxWidth:520, lineHeight:1.8 }}>The mocks, sectionals, and area-wise tests span all of Language Skills, Quantitative Skills, and Logical Reasoning — with NMAT-specific question formats that differ from CAT and XAT.</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:32 }} className="cov-grid-3">
            <style>{`@media(max-width:800px){.cov-grid-3{grid-template-columns:1fr!important}}`}</style>
            {COVERAGE.map(s => (
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

      {/* colleges */}
      <section className="section">
        <div className="container">
          <div style={{ marginBottom:32 }}>
            <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />Where NMAT takes you</div>
            <h2 className="d-lg">Top colleges that<br /><em style={R}>accept NMAT</em></h2>
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
      <section style={{ padding:'72px 0', borderBottom:'var(--border)', background:'var(--off)' }}>
        <div className="container">
          <div style={{ marginBottom:32 }}>
            <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />Student results</div>
            <h2 className="d-lg">Students who converted NMIMS.</h2>
          </div>
          <CourseTestimonials testis={TESTIS} />
        </div>
      </section>

      {/* faq */}
      <section className="section">
        <div className="container">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:64 }} className="faq-layout">
            <style>{`@media(max-width:960px){.faq-layout{grid-template-columns:1fr!important}}`}</style>
            <div>
              <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />Questions</div>
              <h2 className="d-lg">Common questions.</h2>
              <a href="https://wa.me/917838737388?text=Hi%20ALP%20Sir%2C%20I%20have%20a%20question%20about%20NMAT" target="_blank" rel="noopener noreferrer" className="btn btn-wa" style={{ marginTop:24, display:'inline-flex' }}>
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
            Ready to test yourself? <em style={R}>3 attempts. Start strong.</em>
          </h2>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap', marginTop:24 }}>
            <Link href="/checkout?course=nmat" className="btn btn-red">Enrol Now — ₹1,499 →</Link>
            <a href="https://wa.me/917838737388?text=Hi%20ALP%20Sir%2C%20about%20NMAT" target="_blank" rel="noopener noreferrer" className="btn btn-wa"><span className="wa-dot" />WhatsApp first</a>
          </div>
        </div>
      </section>

      <div className="mob-sticky">
        <div>
          <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:600, letterSpacing:'.07em', textTransform:'uppercase', color:'var(--g500)' }}>NMAT Mocks</div>
          <div style={{ fontFamily:'var(--font-serif)', fontSize:19, color:'var(--black)' }}>₹1,499 + GST</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <a href="https://wa.me/917838737388?text=Hi%20ALP%20Sir%2C%20about%20NMAT" target="_blank" rel="noopener noreferrer"
            style={{ fontFamily:'var(--font-sans)', fontSize:12, fontWeight:600, color:'#25D366', border:'2px solid #25D366', padding:'8px 14px', borderRadius:2, textDecoration:'none' }}>WhatsApp</a>
          <Link href="/checkout?course=nmat" style={{ fontFamily:'var(--font-sans)', fontSize:12, fontWeight:600, background:'var(--red)', color:'#fff', padding:'8px 18px', borderRadius:2, textDecoration:'none' }}>Enrol →</Link>
        </div>
      </div>
      <WaFloat msg="Hi ALP Sir, I want to know more about NMAT Mocks" />
    </>
  )
}
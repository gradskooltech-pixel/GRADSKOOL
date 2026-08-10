/**
 * GRADSKOOL — SNAP Mocks
 * Route: /courses/snap (also /snap)
 *
 * Repositioned: the free SNAP Foundations (/foundations/snap) now covers the
 * complete taught course. This page is purely the practice/testing product —
 * full-length mocks, sectional tests, area-wise tests — so there's no overlap
 * between the free and paid offerings.
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
  { sec:'Language Skills',     topics:['Reading Comprehension — short passages with inference','Verbal Reasoning — analogies, sentence completion','Grammar and usage — error identification','Para-jumbles and sentence correction','Vocabulary in context','Fill in the blanks'] },
  { sec:'Quantitative Skills', topics:['Arithmetic — percentages, ratios, profit-loss, TSD','Algebra — linear & quadratic equations','Geometry — basic shapes and mensuration','Data Sufficiency — SNAP DS format','Number systems and modern math','Probability and combinations'] },
  { sec:'Analytical & Logical',topics:['Analytical Reasoning — blood relations, direction sense','Seating arrangements and grouping','Puzzles — grid, floor, scheduling','Data Interpretation caselets','Syllogisms and coding-decoding','Critical reasoning'] },
]

const COLLEGES = [
  { name:'SCMHRD Pune',     courses:'MBA', note:'#1 SNAP college' },
  { name:'SIBM Pune',       courses:'MBA', note:'Top 3 SNAP college' },
  { name:'SIIB Pune',       courses:'MBA', note:'International Business focus' },
  { name:'SCIT Pune',       courses:'MBA IT', note:'Technology MBA' },
  { name:'SSSS Pune',       courses:'MBA', note:'Symbiosis campus' },
  { name:'SICSR Pune',      courses:'MBA IT', note:'IT & CS MBA' },
]

const TESTIS = [
  { text:"Grateful to share that I have converted NMIMS Mumbai – Core MBA. This milestone would not have been possible without the constant guidance of ALP Sir and the entire GRADSKOOL team.", name:'Prathamesh Mulay', detail:'NMIMS Mumbai Core MBA' },
  { text:"Grateful to have converted NMIMS Mumbai Core! A big thank you to ALP Sir and the entire team at GRADSKOOL for their constant guidance, mentorship, and belief in me throughout this journey.", name:'Avivratta Krishna', detail:'NMIMS Mumbai Core' },
  { text:"In just a week I was able to get ready for the NMIMS Competency Test with the help of GRADSKOOL. The confidence-building sessions made a significant difference.", name:'Ishan', detail:'NMIMS Competency Test' },
]

const FAQS = [
  { q:'What is SNAP and who conducts it?', a:"SNAP is the Symbiosis National Aptitude Test, conducted by Symbiosis International (Deemed University), Pune. It is accepted by all 15+ Symbiosis institutes including SCMHRD, SIBM, and SIIB — making it one of the most valuable MBA entrance exams for Pune-based B-schools." },
  { q:'What exactly do I get in SNAP Mocks?', a:'20 full-length SNAP mocks in the real exam interface and timing, 9 sectional tests (Language, Quant, Reasoning individually), and area-wise topic tests for granular practice. Every mock comes with a detailed analysis report.' },
  { q:"Isn't the SNAP course free on GRADSKOOL now?", a:"The complete SNAP course — every topic, taught live by ALP Sir — is free at /courses/snap/live. This page is the practice layer on top of that: structured mocks, sectionals, and area-wise tests to actually test what you've learned, in the real exam format." },
  { q:'How is SNAP different from CAT?', a:'SNAP is shorter (60 minutes vs CAT 120 minutes) and has no negative marking for most sections. The question types are similar to CAT but less complex. SNAP is an excellent exam for students targeting Symbiosis Pune colleges — the mocks are built around this exact format.' },
  { q:'How is my performance analysed?', a:'Every mock and sectional test comes with a detailed report — section-wise accuracy, time spent per question, percentile estimate, and specific topic weaknesses to work on before your next attempt.' },
  { q:'Can I combine SNAP Mocks with NMAT Mocks?', a:'Yes. The SNAP + NMAT Mocks bundle is available at ₹4,499 — saving ₹1,499 compared to buying them separately. Both exams share significant content in Language Skills, Quantitative Skills, and Reasoning.' },
  { q:'Can I add SNAP Mocks to CATalysis?', a:'Yes. SNAP Mocks can be added as an add-on with CATalysis at ₹1,999 (saving ₹1,000). Since SNAP and CAT have significant syllabus overlap, the combination is very efficient.' },
]

export default function SNAPPage() {
  return (
    <>
      <PageSEO
        title="SNAP Mocks — GRADSKOOL | ₹1,499 | Mocks + Sectionals + Area-wise Tests"
        description="GRADSKOOL SNAP Mocks. 20 full-length mocks, 9 sectional tests, area-wise tests, with detailed analysis. Pairs with the free SNAP course at /courses/snap/live."
        keywords="SNAP mock tests, SNAP sectional tests, SNAP area-wise tests, SCMHRD coaching, Symbiosis MBA, ALP Sir SNAP, GRADSKOOL SNAP"
        canonical="https://gradskool.in/courses/snap"
        ogImage="/assets/og-nmat.jpg"
        breadcrumbs={[{name:'Home',url:'/'},{name:'OMETs',url:'/omets'},{name:'SNAP',url:'/courses/snap'}]}
        schema={[
          courseSchema({name:'SNAP Mocks',description:"GRADSKOOL SNAP Mocks. 20 full-length mocks, 9 sectional tests, area-wise tests, with detailed analysis reports.",url:'/courses/snap',price:'1499',mode:['online','asynchronous']}),
          faqSchema(FAQS),
        ]}
      />
      <style>{S}</style>

      {/* ── HERO ── */}
      <section style={{ background:'var(--black)', padding:'72px 0 64px', borderBottom:'var(--border)' }}>
        <div className="container">
          <div className="eyebrow" style={{ marginBottom:18, color:'var(--g500)' }}><span className="dot" />SNAP · Mocks · Sectionals · Area-wise Tests</div>
          <h1 className="d-xl" style={{ color:'#fff', marginBottom:18 }}>SNAP Mocks.<br /><em style={R}>Practice that finds your gaps.</em></h1>
          <p style={{ fontFamily:'var(--font-body)', fontSize:15, color:'var(--g500)', lineHeight:1.85, maxWidth:520, marginBottom:32 }}>
            20 full-length SNAP mocks in the real exam interface. 9 sectional tests. Area-wise topic tests. Every attempt comes with a detailed analysis report. The complete course is free — this is the practice layer.
          </p>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <Link href="/checkout?course=snap" className="btn btn-red">Enrol Now — ₹1,499 →</Link>
            <a href="https://wa.me/917838737388?text=Hi%20ALP%20Sir%2C%20I%20want%20to%20know%20about%20SNAP%20Mocks" target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
              <span className="wa-dot" />WhatsApp ALP Sir
            </a>
          </div>
          <div style={{ display:'flex', gap:32, marginTop:44, paddingTop:24, borderTop:'1px solid rgba(255,255,255,.1)', flexWrap:'wrap' }}>
            {[['20','Full-length mocks'],['9','Sectional tests'],['15+','Area-wise tests'],['15+','Symbiosis colleges']].map(([v,l]) => (
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
              <h2 className="d-lg" style={{ marginBottom:20 }}>Test what<br /><em style={R}>you've learned.</em></h2>
              <div style={{ background:'var(--off)', border:'var(--border)', borderRadius:4, padding:'28px 32px' }}>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:20, color:'var(--black)', marginBottom:14 }}>SNAP Mocks</div>
                {['20 full-length SNAP mocks — real exam interface and timing','9 sectional tests — Language, Quant, Reasoning individually','Area-wise topic tests for granular practice','Detailed analysis report after every attempt','Percentile estimate and topic-wise weakness tracking','SNAP-specific format and timing (60-minute exam) coverage','No negative marking strategy built into every mock'].map(item => (
                  <div key={item} style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--g700)', marginBottom:7, display:'flex', gap:8 }}>
                    <span style={R}>—</span><span>{item}</span>
                  </div>
                ))}
                <div style={{ marginTop:20, display:'flex', alignItems:'baseline', gap:12, borderTop:'var(--border)', paddingTop:16 }}>
                  <div style={{ fontFamily:'var(--font-serif)', fontSize:38, color:'var(--black)', lineHeight:1 }}>₹1,499</div>
                  <div style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'var(--g500)' }}>+ GST</div>
                </div>
                <Link href="/checkout?course=snap" className="btn btn-red" style={{ marginTop:14, width:'100%', justifyContent:'center' }}>Enrol Now →</Link>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div className="eyebrow" style={{ marginBottom:2 }}><span className="dot" />Learn it free first</div>
              <div style={{ background:'var(--off)', border:'var(--border)', borderRadius:4, padding:'24px 28px' }}>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:16, color:'var(--black)', marginBottom:6 }}>SNAP — Complete Course, Free</div>
                <p style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'var(--g500)', lineHeight:1.7, marginBottom:16 }}>Every topic, taught live by ALP Sir, entirely free. Learn the full syllabus, then come back here to test yourself with real-format mocks.</p>
                <Link href="/courses/snap/live" className="btn btn-red" style={{ fontSize:12, padding:'10px 18px' }}>Explore free course →</Link>
              </div>
              <div style={{ background:'var(--off)', border:'var(--border)', borderRadius:4, padding:'24px 28px' }}>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:16, color:'var(--black)', marginBottom:6 }}>SNAP + NMAT Mocks Bundle</div>
                <p style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'var(--g500)', lineHeight:1.7, marginBottom:16 }}>Both exams' mocks, sectionals, and area-wise tests together — ₹4,499, saving ₹1,499.</p>
                <Link href="/courses/nmat-snap" className="btn btn-red" style={{ fontSize:12, padding:'10px 18px' }}>View bundle →</Link>
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
            <p style={{ fontFamily:'var(--font-body)', fontSize:14, color:'#fff', lineHeight:1.6 }}>CAThlete — GRADSKOOL's intensive CAT crash course, from ₹6,999. A lot of SNAP students take both.</p>
          </div>
          <Link href="/courses/cat/cathlete" className="btn btn-red" style={{ flexShrink:0 }}>Explore CAThlete →</Link>
        </div>
      </div>

      {/* ── COVERAGE ── */}
      <section style={{ padding:'72px 0', borderBottom:'var(--border)', background:'var(--off)' }}>
        <div className="container">
          <div style={{ marginBottom:32 }}>
            <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />Full coverage</div>
            <h2 className="d-lg">Every area the mocks test.</h2>
            <p style={{ fontFamily:'var(--font-body)', fontSize:14, color:'var(--g700)', marginTop:10, maxWidth:520, lineHeight:1.8 }}>The mocks, sectionals, and area-wise tests span all of Language Skills, Quantitative-Data Interpretation, and Analytical & Logical Reasoning — all three sections in equal depth.</p>
          </div>
          <div className="syllabus-grid">
            {COVERAGE.map(s => (
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
            <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />Where SNAP takes you</div>
            <h2 className="d-lg">Top Symbiosis<br /><em style={R}>institutes accepting SNAP</em></h2>
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
      <section style={{ padding:'72px 0', borderBottom:'var(--border)', background:'var(--off)' }}>
        <div className="container">
          <div style={{ marginBottom:32 }}>
            <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />Student results</div>
            <h2 className="d-lg">Students who converted NMIMS.</h2>
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
              <h2 className="d-lg">Common questions.</h2>
              <a href="https://wa.me/917838737388?text=Hi%20ALP%20Sir%2C%20I%20have%20a%20question%20about%20SNAP" target="_blank" rel="noopener noreferrer" className="btn btn-wa" style={{ marginTop:24, display:'inline-flex' }}>
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
            Ready to test yourself?<br /><em style={R}>Start today.</em>
          </h2>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap', marginTop:24 }}>
            <Link href="/checkout?course=snap" className="btn btn-red">Enrol Now — ₹1,499 →</Link>
            <a href="https://wa.me/917838737388?text=Hi%20ALP%20Sir%2C%20about%20SNAP" target="_blank" rel="noopener noreferrer" className="btn btn-ghost"><span className="wa-dot" />WhatsApp first</a>
          </div>
        </div>
      </section>

      <div className="mob-sticky">
        <div>
          <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:600, letterSpacing:'.07em', textTransform:'uppercase', color:'var(--g500)' }}>SNAP Mocks</div>
          <div style={{ fontFamily:'var(--font-serif)', fontSize:19, color:'var(--black)' }}>₹1,499 + GST</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <a href="https://wa.me/917838737388?text=Hi%20ALP%20Sir%2C%20about%20SNAP" target="_blank" rel="noopener noreferrer"
            style={{ fontFamily:'var(--font-sans)', fontSize:12, fontWeight:600, color:'#25D366', border:'2px solid #25D366', padding:'8px 14px', borderRadius:2, textDecoration:'none' }}>WhatsApp</a>
          <Link href="/checkout?course=snap" style={{ fontFamily:'var(--font-sans)', fontSize:12, fontWeight:600, background:'var(--red)', color:'#fff', padding:'8px 18px', borderRadius:2, textDecoration:'none' }}>Enrol →</Link>
        </div>
      </div>
      <WaFloat msg="Hi ALP Sir, I want to know more about SNAP Mocks" />
    </>
  )
}
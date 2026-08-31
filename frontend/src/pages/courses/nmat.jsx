/**
 * GRADSKOOL — NMAT
 * Route: /courses/nmat (also /nmat)
 *
 * Repositioned per request: leads with the free NMAT Sessions (live,
 * taught by ALP Sir, at /courses/nmat/live) as the primary offering, with
 * the paid NMAT Mocks (₹1,499) kept as a secondary option on the same
 * page — not removed, just no longer the lead CTA.
 *
 * Hero swapped: left column now holds a Cloudinary video (VIDEO_URL below
 * — paste the real Cloudinary URL in when ready; shows a "coming soon"
 * placeholder until then). The text content that used to live on the
 * left has moved to the right column. The pricing cards that used to sit
 * in the hero's right column have moved down into their own "Enrol"
 * section below the hero, organized as two clear options.
 *
 * NOTE: mock/sectional/area-wise-test counts below are placeholders matching
 * the style of numbers already used elsewhere on the site — swap in your
 * real counts before this goes live.
 */
import Link from 'next/link'
import PageSEO, { courseSchema, faqSchema } from '../../components/seo/PageSEO'
import { S, CloudinaryVideo, CourseFaqAccordion, WaFloat, CourseTestimonials } from '../../components/courses/CourseLayout'

const R = { color:'var(--red)' }

// Accepts either a YouTube URL (shows a thumbnail, embeds in-place on
// click) or a direct video file URL like Cloudinary's
// 'https://res.cloudinary.com/<cloud_name>/video/upload/<public_id>.mp4'.
// Leave blank to show the "coming soon" placeholder.
const VIDEO_URL = 'https://www.youtube.com/watch?v=0CgQQROvDV8'

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
  { q:'Are the NMAT Sessions actually free?', a:"Yes — every topic, taught live by ALP Sir, at no cost. Create a free account and start watching at /courses/nmat/live." },
  { q:'What exactly do I get in NMAT Mocks?', a:'10 full-length NMAT mocks in the real exam interface and timing, 12 sectional tests (Language, Quant, Reasoning individually), and 40 area-wise topic tests for granular practice. Every mock comes with a detailed analysis report.' },
  { q:'What makes NMAT unique?', a:"NMAT allows 3 attempts in one cycle — you can retake the exam if your first attempt doesn't go well. It also has no negative marking, which changes test-taking strategy significantly. NMAT also has a unique Data Sufficiency format — the mocks are built around these specifics." },
  { q:'How is my performance analysed?', a:'Every mock and sectional test comes with a detailed report — section-wise accuracy, time spent per question, percentile estimate, and specific topic weaknesses to work on before your next attempt.' },
  { q:'Can I combine NMAT Mocks with SNAP Mocks?', a:'Yes. The SNAP + NMAT Mocks bundle is available at ₹2,499 — saving ₹500 compared to buying them separately.' },
]

export default function NMATPage() {
  return (
    <>
      <PageSEO
        title="NMAT Sessions — Free Live Classes by ALP Sir | GRADSKOOL"
        description="Free NMAT Sessions, taught live by ALP Sir — every topic, no cost. Plus NMAT Mocks (₹1,499): 10 full-length mocks, 12 sectional tests, 40 area-wise tests."
        keywords="NMAT sessions, NMAT free classes, NMAT mock tests, NMAT sectional tests, NMIMS Mumbai coaching, ALP Sir NMAT, GRADSKOOL NMAT, NMAT by GMAC"
        canonical="https://gradskool.in/courses/nmat"
        ogImage="/assets/og-nmat.jpg"
        breadcrumbs={[{name:'Home',url:'/'},{name:'OMETs',url:'/omets'},{name:'NMAT',url:'/courses/nmat'}]}
        schema={[
          courseSchema({name:'NMAT Sessions',description:"Free NMAT Sessions taught live by ALP Sir, plus NMAT Mocks: 10 full-length mocks, 12 sectional tests, 40 area-wise tests.",url:'/courses/nmat',price:'0',mode:['online','live']}),
          faqSchema(FAQS),
        ]}
      />

      {/* hero — video left, text right */}
      <section style={{ display:'grid', gridTemplateColumns:'1fr 1.1fr', gap:0, alignItems:'center' }} className="nmat-hero">
        <style>{`@media(max-width:960px){.nmat-hero{grid-template-columns:1fr!important}}`}</style>
        <style>{S}</style>
        <div style={{ padding:'40px' }}>
          <CloudinaryVideo url={VIDEO_URL} title="NMAT — a session with ALP Sir" />
        </div>

        <div style={{ padding:'40px 48px 40px 8px' }}>
          <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />NMAT · Free Sessions · Mocks · Sectionals</div>
          <h1 className="d-xl" style={{ marginBottom:20 }}>NMAT, <em style={R}>taught live.</em></h1>
          <p style={{ fontFamily:'var(--font-body)', fontSize:15, color:'var(--g700)', lineHeight:1.85, maxWidth:480, marginBottom:32 }}>
            Every topic, taught live by ALP Sir, entirely free. Then test yourself with full-length mocks, sectional tests, and area-wise practice — real exam interface, detailed analysis after every attempt.
          </p>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <Link href="/courses/nmat/live" className="btn btn-red">Enrol Now — Free →</Link>
            <a href="https://wa.me/917838737388?text=Hi%20ALP%20Sir%2C%20I%20want%20to%20know%20about%20NMAT" target="_blank" rel="noopener noreferrer" className="btn btn-wa">
              <span className="wa-dot" />WhatsApp ALP Sir
            </a>
          </div>
          <div style={{ display:'flex', gap:28, marginTop:44, paddingTop:24, borderTop:'var(--border)', flexWrap:'wrap' }}>
            {[['Free','Live sessions'],['10','Full-length mocks'],['40','Area-wise tests'],['3','Exam attempts allowed']].map(([v,l]) => (
              <div key={l}>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:22, color:'var(--black)', lineHeight:1 }}>{v}</div>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'var(--g500)', marginTop:3 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* enrol — two clear options, moved down from the hero */}
      <section style={{ padding:'56px 0', borderTop:'var(--border)', borderBottom:'var(--border)', background:'var(--off)' }}>
        <div className="container">
          <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />Get started</div>
          <h2 className="d-lg" style={{ marginBottom:32 }}>Two ways to <em style={R}>prepare.</em></h2>
          <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr', gap:20 }} className="enrol-grid-2">
            <style>{`@media(max-width:800px){.enrol-grid-2{grid-template-columns:1fr!important}}`}</style>

            <div style={{ background:'#fff', border:`2px solid var(--red)`, borderRadius:6, padding:'32px 36px', position:'relative' }}>
              <div style={{ position:'absolute', top:-13, left:32, background:'var(--red)', color:'#fff', fontFamily:'var(--font-sans)', fontSize:10, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', padding:'4px 12px', borderRadius:2 }}>Start here</div>
              <div style={{ fontFamily:'var(--font-serif)', fontSize:22, color:'var(--black)', marginTop:8, marginBottom:6 }}>NMAT Sessions</div>
              <p style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--g700)', lineHeight:1.7, marginBottom:18 }}>Every topic, taught live by ALP Sir, from the ground up through exam-day strategy. Entirely free — no payment step anywhere.</p>
              <div style={{ display:'flex', alignItems:'baseline', gap:10, marginBottom:20 }}>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:32, color:'var(--black)' }}>₹0</div>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'var(--g500)' }}>Free, forever</div>
              </div>
              <Link href="/courses/nmat/live" className="btn btn-red" style={{ width:'100%', justifyContent:'center' }}>Enrol Now — Free →</Link>
            </div>

            <div style={{ background:'#fff', border:'var(--border)', borderRadius:6, padding:'32px 36px' }}>
              <div style={{ fontFamily:'var(--font-serif)', fontSize:20, color:'var(--black)', marginBottom:14 }}>NMAT Mocks</div>
              {['10 full-length NMAT mocks — real exam interface','12 sectional tests','40 area-wise topic tests','Detailed analysis report'].map(item => (
                <div key={item} style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--g700)', marginBottom:6, display:'flex', gap:8 }}>
                  <span style={R}>—</span><span>{item}</span>
                </div>
              ))}
              <div style={{ marginTop:16, display:'flex', alignItems:'baseline', gap:10, borderTop:'var(--border)', paddingTop:16, marginBottom:16 }}>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:28, color:'var(--black)' }}>₹1,499</div>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'var(--g500)' }}>incl. GST</div>
              </div>
              <Link href="/checkout?course=nmat" className="btn btn-outline" style={{ width:'100%', justifyContent:'center' }}>Enrol Now →</Link>
            </div>
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
            <Link href="/courses/cat/cat-crash-course-2026" style={{ background:'var(--off)', border:'var(--border)', borderRadius:4, padding:'24px', textDecoration:'none', display:'block' }}>
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
            <h2 className="d-lg">Every area, sessions and mocks.</h2>
            <p style={{ fontFamily:'var(--font-body)', fontSize:14, color:'var(--g700)', marginTop:10, maxWidth:520, lineHeight:1.8 }}>Language Skills, Quantitative Skills, and Logical Reasoning — with NMAT-specific question formats that differ from CAT and XAT.</p>
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
            Start free. <em style={R}>Today.</em>
          </h2>
          <p style={{ fontFamily:'var(--font-body)', fontSize:14, color:'var(--g700)', lineHeight:1.8, maxWidth:380, margin:'0 auto 32px' }}>
            No payment, no risk — every NMAT topic taught live by ALP Sir. Add mocks whenever you're ready to test yourself.
          </p>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <Link href="/courses/nmat/live" className="btn btn-red">Enrol Now — Free →</Link>
            <a href="https://wa.me/917838737388?text=Hi%20ALP%20Sir%2C%20about%20NMAT" target="_blank" rel="noopener noreferrer" className="btn btn-wa"><span className="wa-dot" />WhatsApp first</a>
          </div>
        </div>
      </section>

      <div className="mob-sticky">
        <div>
          <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:600, letterSpacing:'.07em', textTransform:'uppercase', color:'var(--g500)' }}>NMAT Sessions</div>
          <div style={{ fontFamily:'var(--font-serif)', fontSize:19, color:'var(--black)' }}>Free</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <a href="https://wa.me/917838737388?text=Hi%20ALP%20Sir%2C%20about%20NMAT" target="_blank" rel="noopener noreferrer"
            style={{ fontFamily:'var(--font-sans)', fontSize:12, fontWeight:600, color:'#25D366', border:'2px solid #25D366', padding:'8px 14px', borderRadius:2, textDecoration:'none' }}>WhatsApp</a>
          <Link href="/courses/nmat/live" style={{ fontFamily:'var(--font-sans)', fontSize:12, fontWeight:600, background:'var(--red)', color:'#fff', padding:'8px 18px', borderRadius:2, textDecoration:'none' }}>Enrol →</Link>
        </div>
      </div>
      <WaFloat msg="Hi ALP Sir, I want to know more about NMAT" />
    </>
  )
}
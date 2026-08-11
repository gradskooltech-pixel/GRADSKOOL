/**
 * GRADSKOOL — XAT 2026 Course Page
 * Route: /courses/xat (also /xat)
 *
 * Restyled to match CAT's design language (light 2-column hero with
 * pricing card) instead of its earlier dark single-column hero — for
 * visual consistency across every course page. All content and pricing
 * preserved exactly as reviewed and confirmed.
 */
import Link from 'next/link'
import PageSEO, { courseSchema, faqSchema } from '../../components/seo/PageSEO'
import { S, CourseFaqAccordion, WaFloat, CourseTestimonials } from '../../components/courses/CourseLayout'

const R = { color:'var(--red)' }

const STAGES = [
  { n:'01', name:'Intro Video',       desc:'English introduction to each XAT topic including Decision Making, which has no equivalent in CAT.' },
  { n:'02', name:'Live Session + PDF', desc:'Two-way live teaching with ALP Sir. Structured sessions with challenging questions and group reasoning.' },
  { n:'03', name:'Cheat Sheet',        desc:'Distilled notes for every concept — VALR, DM, QA, and GK strategy — for fast revision.' },
  { n:'04', name:'Quiz',               desc:'XAT-style timed practice with immediate explanations. Decision Making sets included.' },
]

const SYLLABUS = [
  { section:'VALR', topics:['Reading Comprehension','Para-jumbles','Critical Reasoning','Poem-based questions','Vocabulary in context','Fill in the blanks'] },
  { section:'Decision Making', topics:['Analytical Reasoning','Situational analysis','Data arrangement','Conditions & grouping','Complex arrangements','Real-world decision sets'] },
  { section:'QA & DI', topics:['Arithmetic — percentages, profit, TSD','Algebra & number systems','Geometry & mensuration','Data Interpretation caselets','Tables, charts, graphs','Probability & permutation-combination'] },
]

const COLLEGES = [
  { name:'XLRI Jamshedpur',      courses:'BM, HRM, GMP',        note:'Premier XAT institution' },
  { name:'XLRI Delhi-NCR',       courses:'PGDM',                note:'Delhi campus' },
  { name:'XIM University',       courses:'PGDM, PGDM-B',        note:'Xavier Bhubaneswar' },
  { name:'IMT Ghaziabad',        courses:'PGDM, PGDM-B',        note:'Top 15 B-school' },
  { name:'XIMB Bhubaneswar',     courses:'MBA-BM, MBA-RM',      note:'Xavier heritage' },
  { name:'SP Jain Mumbai',       courses:'PGDM',                note:'Strong placements' },
  { name:'TAPMI Manipal',        courses:'PGDM, PGDM-BKFS',    note:'Manipal campus' },
  { name:'Loyola Institute',     courses:'PGDM',                note:'Chennai campus' },
]

const TESTIS = [
  { text:"Learning from ALP Sir is something special. He explains every topic from multiple perspectives and builds the right way of thinking, not just the right answers. The XAT Decision Making sessions were unlike anything else I had seen.", name:'Keshav Mundra', detail:'GMAT Cohort' },
  { text:"The two-way live classes are what make GRADSKOOL stand apart. Every doubt cleared in the session itself — no waiting. The structured approach to Decision Making was game-changing for my XAT score.", name:'Vanshaj Jaiman', detail:'CAT 2026 Cohort' },
  { text:"From CAT to XAT, ALP Sir stood with us at every step. The GDPI preparation was structured and rigorous. I converted XLRI and it would not have happened without this level of preparation.", name:'Sameer Ansari', detail:'CAT & XAT · PI WAT GD Cohort' },
]

const FAQS = [
  { q:'What is XAT and who conducts it?', a:'XAT is the Xavier Aptitude Test, conducted annually by XLRI Jamshedpur. It is accepted by over 150 B-schools across India, including XLRI, XIM University, IMT Ghaziabad, and SP Jain.' },
  { q:'What is the XAT fee at GRADSKOOL?', a:'The XAT course is priced at ₹5,999. Bundle with CATalysis and save ₹500 — the add-on price is ₹5,499.' },
  { q:'What makes XAT different from CAT?', a:'XAT has a unique Decision Making section not found in CAT. It also includes a General Knowledge section (unscored but required for XLRI BM), and the VALR section has poem-based questions which CAT does not.' },
  { q:'Can I take XAT with CATalysis?', a:'Yes. You can add the XAT course as an add-on with CATalysis at ₹5,499 (save ₹500). Since most CAT aspirants also appear for XAT, the bundle is very popular.' },
  { q:'Which is the best college to target through XAT?', a:'XLRI Jamshedpur is the premier XAT-accepting institution, offering BM (Business Management) and HRM (Human Resource Management). XLRI consistently ranks among the top 5 B-schools in India.' },
  { q:'Are XAT mock tests available separately?', a:'Yes. XAT mocks are available separately for ₹499 if you do not need the full course and only want timed practice tests.' },
]

export default function XATPage() {
  return (
    <>
      <PageSEO
        title="XAT 2026 Preparation — GRADSKOOL | XLRI Coaching by ALP Sir | ₹5,999"
        description="XAT 2026 preparation by ALP Sir. 100+ hours live, 6 full-length XAT tests, Decision Making mastery. XLRI Jamshedpur, XIM University, IMT Ghaziabad and top XAT colleges."
        keywords="XAT 2026 preparation, XAT coaching India, XLRI coaching, XAT Decision Making, ALP Sir XAT, GRADSKOOL XAT, XAT 2026 course"
        canonical="https://gradskool.in/xat"
        ogImage="/assets/og-xat.jpg"
        breadcrumbs={[{name:'Home',url:'/'},{name:'OMETs',url:'/omets'},{name:'XAT',url:'/xat'}]}
        schema={[
          courseSchema({name:'XAT 2026 Preparation',description:'XAT 2026 preparation by ALP Sir. 100+ hours live, 6 full-length tests, Decision Making mastery. XLRI Jamshedpur and top XAT colleges.',url:'/courses/xat',price:'5999'}),
          faqSchema(FAQS),
        ]}
      />

      {/* hero */}
      <section style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr' }} className="xat-hero">
        <style>{`@media(max-width:960px){.xat-hero{grid-template-columns:1fr!important}}`}</style>
        <style>{S}</style>
        <div style={{ padding:'72px 48px 56px' }}>
          <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />XAT 2026 · XLRI & Top XAT Colleges</div>
          <h1 className="d-xl" style={{ marginBottom:20, maxWidth:520 }}>XAT 2026.<br /><em style={R}>The XLRI Route.</em></h1>
          <p style={{ fontFamily:'var(--font-body)', fontSize:15, color:'var(--g700)', lineHeight:1.85, maxWidth:520, marginBottom:32 }}>
            100+ hours of live two-way sessions. Full XAT syllabus — VALR, Decision Making, QA. 6 full-length XAT tests with post-test analysis. Taught by ALP Sir.
          </p>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <Link href="/checkout?course=xat" className="btn btn-red">Enrol Now — ₹5,999 →</Link>
            <a href="https://wa.me/917838737388?text=Hi%20ALP%20Sir%2C%20I%20want%20to%20know%20about%20the%20XAT%20course" target="_blank" rel="noopener noreferrer" className="btn btn-wa">
              <span className="wa-dot" />WhatsApp ALP Sir
            </a>
          </div>
          <Link href="/courses/xat/pricing" style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'var(--red)', display:'inline-block', marginTop:14 }}>View full pricing page →</Link>
          <div style={{ display:'flex', gap:28, marginTop:32, paddingTop:24, borderTop:'var(--border)', flexWrap:'wrap' }}>
            {[['100+ hrs','Live sessions'],['6','Full XAT mocks'],['DM','Full coverage'],['150+','Colleges accept XAT']].map(([v,l]) => (
              <div key={l}>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:22, color:'var(--black)', lineHeight:1 }}>{v}</div>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'var(--g500)', marginTop:3 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background:'var(--off)', display:'flex', flexDirection:'column', justifyContent:'center', padding:'40px 48px', gap:16 }}>
          <div style={{ background:'#fff', border:'var(--border)', borderRadius:4, padding:'28px 32px' }}>
            <div style={{ fontFamily:'var(--font-serif)', fontSize:20, color:'var(--black)', marginBottom:14 }}>XAT Full Course</div>
            {['100+ hours of live two-way sessions','6 full-length XAT tests','Post-test strategic analysis','Decision Making special sessions','Session PDFs + cheat sheets','PI WAT GD prep for XLRI'].map(item => (
              <div key={item} style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--g700)', marginBottom:6, display:'flex', gap:8 }}>
                <span style={R}>—</span><span>{item}</span>
              </div>
            ))}
            <div style={{ marginTop:20, display:'flex', alignItems:'baseline', gap:12, borderTop:'var(--border)', paddingTop:16 }}>
              <div style={{ fontFamily:'var(--font-serif)', fontSize:38, color:'var(--black)', lineHeight:1 }}>₹5,999</div>
              <div style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'var(--g500)' }}>+ GST</div>
            </div>
            <Link href="/checkout?course=xat" className="btn btn-red" style={{ marginTop:14, width:'100%', justifyContent:'center' }}>Enrol Now →</Link>
          </div>
          <div style={{ background:'#fff', border:'var(--border)', borderRadius:4, padding:'16px 20px', fontFamily:'var(--font-sans)', fontSize:12, color:'var(--g700)' }}>
            <strong style={{ color:'var(--red)' }}>Bundle with CATalysis?</strong> Add XAT at ₹5,499 (save ₹500).
          </div>
        </div>
      </section>

      {/* also available */}
      <section className="section">
        <div className="container">
          <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />Also available</div>
          <h2 className="d-lg" style={{ marginBottom:28 }}>Not ready for<br /><em style={R}>the full course?</em></h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16 }} className="also-grid-2">
            <style>{`@media(max-width:700px){.also-grid-2{grid-template-columns:1fr!important}}`}</style>
            <div style={{ background:'var(--off)', border:'var(--border)', borderRadius:4, padding:'24px' }}>
              <div style={{ fontFamily:'var(--font-serif)', fontSize:18, color:'var(--black)', marginBottom:8 }}>XAT Mocks Only</div>
              <p style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--g700)', lineHeight:1.6, marginBottom:12 }}>Already studying? Just want timed full-length XAT tests with analysis?</p>
              <div style={{ fontFamily:'var(--font-serif)', fontSize:28, color:'var(--black)', marginBottom:12 }}>₹499</div>
              <Link href="/checkout?course=xat&plan=mocks" className="btn btn-outline" style={{ fontSize:12, padding:'9px 18px' }}>Get XAT Mocks →</Link>
            </div>
            <div style={{ background:'var(--off)', border:'var(--border)', borderRadius:4, padding:'24px' }}>
              <div style={{ fontFamily:'var(--font-serif)', fontSize:18, color:'var(--black)', marginBottom:8 }}>Not sure yet?</div>
              <p style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--g700)', lineHeight:1.6, marginBottom:12 }}>Free XAT Foundations classes, taught live by ALP Sir — no cost, no signup fee.</p>
              <Link href="/foundations/xat" className="btn btn-red" style={{ fontSize:12, padding:'9px 18px' }}>Watch free classes →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* cathlete cross-promo */}
      <section className="section">
        <div className="container">
          <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />Also preparing for CAT?</div>
          <h2 className="d-lg" style={{ marginBottom:28 }}>Round out your <em style={R}>prep.</em></h2>
          <Link href="/courses/cat/cathlete" style={{ background:'var(--off)', border:'var(--border)', borderRadius:4, padding:'24px', textDecoration:'none', display:'block', maxWidth:420 }}>
            <div style={{ fontFamily:'var(--font-serif)', fontSize:18, color:'var(--black)', marginBottom:8 }}>CAThlete</div>
            <div style={{ fontFamily:'var(--font-sans)', fontSize:13, fontWeight:700, color:'var(--red)', marginBottom:10 }}>₹6,999</div>
            <p style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--g700)', lineHeight:1.6, marginBottom:12 }}>GRADSKOOL's intensive CAT crash course. A lot of XAT students take both.</p>
            <span style={{ fontFamily:'var(--font-sans)', fontSize:12, fontWeight:600, color:'var(--red)' }}>Explore CAThlete →</span>
          </Link>
        </div>
      </section>

      {/* 4-stage framework */}
      <section style={{ padding:'72px 0', borderBottom:'var(--border)', background:'var(--off)' }}>
        <div className="container">
          <div style={{ marginBottom:32 }}>
            <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />How XAT works</div>
            <h2 className="d-lg">The 4-Stage<br /><em style={R}>Learning Framework</em></h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:1, background:'var(--g200)', border:'var(--border)', borderRadius:4, overflow:'hidden' }} className="stage-grid-4">
            <style>{`@media(max-width:800px){.stage-grid-4{grid-template-columns:1fr 1fr!important}}`}</style>
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
      <section className="section">
        <div className="container">
          <div style={{ marginBottom:32 }}>
            <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />Full coverage</div>
            <h2 className="d-lg">XAT Syllabus</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:32 }} className="syl-grid-3">
            <style>{`@media(max-width:800px){.syl-grid-3{grid-template-columns:1fr!important}}`}</style>
            {SYLLABUS.map(sec => (
              <div key={sec.section}>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color:'var(--red)', marginBottom:14 }}>{sec.section}</div>
                {sec.topics.map(t => (
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
      <section style={{ padding:'72px 0', borderBottom:'var(--border)', background:'var(--off)' }}>
        <div className="container">
          <div style={{ marginBottom:32 }}>
            <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />Where XAT takes you</div>
            <h2 className="d-lg">Top colleges that<br /><em style={R}>accept XAT</em></h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:1, background:'var(--g200)', border:'var(--border)', borderRadius:4, overflow:'hidden' }} className="col-grid-3">
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
            <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />Student Voices</div>
            <h2 className="d-lg">What our students say</h2>
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
              <h2 className="d-lg">XAT FAQs</h2>
              <a href="https://wa.me/917838737388?text=Hi%20ALP%20Sir%2C%20I%20have%20a%20question%20about%20XAT" target="_blank" rel="noopener noreferrer" className="btn btn-wa" style={{ marginTop:24, display:'inline-flex' }}>
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
            Ready for XLRI? <em style={R}>Start here.</em>
          </h2>
          <p style={{ fontFamily:'var(--font-body)', fontSize:14, color:'var(--g700)', lineHeight:1.8, maxWidth:380, margin:'0 auto 32px' }}>
            The XAT Decision Making section cannot be cracked without structured preparation. Start with GRADSKOOL.
          </p>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <Link href="/checkout?course=xat" className="btn btn-red">Enrol Now — ₹5,999 →</Link>
            <a href="https://wa.me/917838737388?text=Hi%20ALP%20Sir%2C%20question%20about%20XAT" target="_blank" rel="noopener noreferrer" className="btn btn-wa"><span className="wa-dot" />WhatsApp first</a>
          </div>
        </div>
      </section>

      <div className="mob-sticky">
        <div>
          <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:600, letterSpacing:'.07em', textTransform:'uppercase', color:'var(--g500)' }}>XAT 2026</div>
          <div style={{ fontFamily:'var(--font-serif)', fontSize:19, color:'var(--black)' }}>₹5,999 + GST</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <a href="https://wa.me/917838737388?text=Hi%20ALP%20Sir%2C%20about%20XAT" target="_blank" rel="noopener noreferrer"
            style={{ fontFamily:'var(--font-sans)', fontSize:12, fontWeight:600, color:'#25D366', border:'2px solid #25D366', padding:'8px 14px', borderRadius:2, textDecoration:'none' }}>WhatsApp</a>
          <Link href="/checkout?course=xat" style={{ fontFamily:'var(--font-sans)', fontSize:12, fontWeight:600, background:'var(--red)', color:'#fff', padding:'8px 18px', borderRadius:2, textDecoration:'none' }}>Enrol →</Link>
        </div>
      </div>

      <WaFloat msg="Hi ALP Sir, I want to know more about the XAT course" />
    </>
  )
}
/**
 * GRADSKOOL — ALPgebra
 * Route: /courses/cat/alpgebra
 *
 * 99 Theorems by Abhishek Leela Pandey — a self-paced, concept-first
 * Algebra program. Rebuilt with real content (replacing the earlier
 * placeholder) matching CATalysis's structure and visual style: light
 * 2-column hero with a pricing card on the right, for consistency
 * across every CAT page.
 */
import Head from 'next/head'
import Link from 'next/link'
import { S, WaFloat } from '../../../components/courses/CourseLayout'
import CatTabs from '../../../components/courses/CatTabs'

const R = { color: 'var(--red)' }
const PRICE = 999

function fmtPrice(n) {
  return `₹${Number(n).toLocaleString('en-IN')}`
}

const CHAPTERS = [
  'Surds and Indices', 'Linear Equations', 'Quadratic Equations', 'Polynomials',
  'Inequalities', 'Modulus', 'Functions', 'Graphs', 'AP', 'GP', 'HP',
  'Miscellaneous Series', 'Infinite Series', 'Logarithms', 'Coordinate Geometry',
  'Algebraic Identities', 'Algebraic Expansions', 'Binomial Theorem', 'Algebraic Operations',
]

const DIFFERENTIATORS = [
  '99 interconnected mathematical theorems',
  'Concept-first learning with zero shortcut dependency',
  'Deep visual explanations for every concept',
  'Structured progression from fundamentals to advanced applications',
  '1,485 carefully curated practice problems',
  'CAT-focused applications after every major concept',
  'Lifetime self-paced access',
]

const FOR_WHOM = [
  'CAT aspirants targeting 99+ percentile in Quant',
  'Students preparing for XAT, GMAT, GRE and IPMAT',
  'Repeat CAT aspirants',
  'Students done with surface-level prep who want a system that actually builds algebraic reflexes',
]

export default function AlpgebraPage() {
  return (
    <>
      <Head>
        <title>{`ALPgebra — 99 Theorems by Abhishek Leela Pandey | ${fmtPrice(PRICE)} Early Bird — GRADSKOOL`}</title>
        <meta name="description" content={`ALPgebra — the most rigorous Algebra program built for CAT aspirants. 99 interconnected theorems, 19 chapters, 1,485 curated problems. Early bird ${fmtPrice(PRICE)}.`} />
      </Head>

      <CatTabs active="alpgebra" />

      {/* hero */}
      <section style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr' }} className="alpgebra-hero">
        <style>{`@media(max-width:960px){.alpgebra-hero{grid-template-columns:1fr!important}}`}</style>
        <style>{S}</style>
        <div style={{ padding:'72px 48px 56px' }}>
          <Link href="/courses/cat" style={{ fontFamily:'var(--font-sans)', fontSize:13, color:'var(--g500)', textDecoration:'none' }}>← Back to CAT</Link>
          <div className="eyebrow" style={{ marginTop:20, marginBottom:14 }}><span className="dot" />99 Theorems by Abhishek Leela Pandey</div>
          <h1 className="d-xl" style={{ marginBottom:20, maxWidth:520 }}>ALP<em style={R}>gebra.</em></h1>
          <p style={{ fontFamily:'var(--font-body)', fontSize:15, color:'var(--g700)', lineHeight:1.85, maxWidth:480, marginBottom:12 }}>
            The most rigorous and comprehensive Algebra program ever created for CAT aspirants — a complete mathematical framework built from first principles, where every concept connects through 99 carefully structured theorems.
          </p>
          <p style={{ fontFamily:'var(--font-body)', fontSize:14, color:'var(--g500)', lineHeight:1.8, maxWidth:480, marginBottom:32 }}>
            Not another collection of shortcuts. ALPgebra builds the intuition to solve difficult Algebra questions confidently — mathematical reflexes that stay with you throughout your preparation.
          </p>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <Link href="/checkout?course=alpgebra&plan=alpgebra" className="btn btn-red">Enrol Now — {fmtPrice(PRICE)} →</Link>
            <a href="https://wa.me/917838737388?text=Hi%20ALP%20Sir%2C%20I%20want%20to%20know%20more%20about%20ALPgebra"
              target="_blank" rel="noopener noreferrer" className="btn btn-wa">
              <span className="wa-dot" />WhatsApp ALP Sir
            </a>
          </div>
          <div style={{ display:'flex', gap:28, marginTop:44, paddingTop:24, borderTop:'var(--border)', flexWrap:'wrap' }}>
            {[['99','Theorems'],['19','Chapters'],['1,485','Curated problems']].map(([v,l]) => (
              <div key={l}>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:22, color:'var(--black)', lineHeight:1 }}>{v}</div>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'var(--g500)', marginTop:3 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background:'var(--off)', display:'flex', flexDirection:'column', justifyContent:'center', padding:'40px 48px' }}>
          <div style={{ background:'#fff', border:'var(--border)', borderRadius:4, padding:'28px 32px' }}>
            <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', background:'var(--red)', color:'#fff', padding:'3px 10px', borderRadius:1, display:'inline-block', marginBottom:14 }}>Early Bird</div>
            <div style={{ fontFamily:'var(--font-serif)', fontSize:20, color:'var(--black)', marginBottom:14 }}>ALPgebra — 99 Theorems</div>
            {['19 complete chapters covering every Algebra topic tested in CAT', '1,485 curated problems from CAT, GMAT, GRE, XAT and IPMAT', 'Downloadable notes, worked solutions, and answer keys per chapter', 'Concept-first — zero shortcut dependency', 'Lifetime self-paced access'].map(item => (
              <div key={item} style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--g700)', marginBottom:6, display:'flex', gap:8 }}>
                <span style={R}>—</span><span>{item}</span>
              </div>
            ))}
            <div style={{ marginTop:20, display:'flex', alignItems:'baseline', gap:12, borderTop:'var(--border)', paddingTop:16 }}>
              <div style={{ fontFamily:'var(--font-serif)', fontSize:38, color:'var(--black)', lineHeight:1 }}>{fmtPrice(PRICE)}</div>
              <div style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'var(--g500)' }}>+ GST</div>
            </div>
            <Link href="/checkout?course=alpgebra&plan=alpgebra" className="btn btn-red" style={{ marginTop:14, width:'100%', justifyContent:'center' }}>Enrol Now →</Link>
          </div>
        </div>
      </section>

      {/* chapters */}
      <section className="section">
        <div className="container">
          <div style={{ marginBottom:32 }}>
            <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />What you'll learn</div>
            <h2 className="d-lg">19 chapters,<br /><em style={R}>every topic covered.</em></h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:1, background:'var(--g200)', border:'var(--border)', borderRadius:4, overflow:'hidden' }} className="chap-grid-3">
            <style>{`@media(max-width:800px){.chap-grid-3{grid-template-columns:1fr!important}}`}</style>
            {CHAPTERS.map((c, i) => (
              <div key={c} style={{ background:'#fff', padding:'16px 20px', display:'flex', gap:12, alignItems:'baseline' }}>
                <span style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'var(--red)', fontWeight:600, flexShrink:0 }}>{String(i+1).padStart(2,'0')}</span>
                <span style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--g700)' }}>{c}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* what makes it different */}
      <section style={{ padding:'72px 0', borderBottom:'var(--border)', background:'var(--off)' }}>
        <div className="container" style={{ maxWidth:640 }}>
          <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />What makes it different</div>
          <h2 className="d-lg" style={{ marginBottom:20 }}>Concept-first,<br /><em style={R}>not shortcut-dependent.</em></h2>
          {DIFFERENTIATORS.map(item => (
            <div key={item} style={{ fontFamily:'var(--font-body)', fontSize:14, color:'var(--g700)', padding:'10px 0', borderBottom:'var(--border)', display:'flex', gap:10, lineHeight:1.6 }}>
              <span style={R}>—</span><span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* who it's for */}
      <section className="section">
        <div className="container" style={{ maxWidth:640 }}>
          <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />Who is this for</div>
          <h2 className="d-lg" style={{ marginBottom:20 }}>Built for<br /><em style={R}>serious preparation.</em></h2>
          {FOR_WHOM.map(item => (
            <div key={item} style={{ fontFamily:'var(--font-body)', fontSize:14, color:'var(--g700)', padding:'10px 0', borderBottom:'var(--border)', display:'flex', gap:10, lineHeight:1.6 }}>
              <span style={R}>—</span><span>{item}</span>
            </div>
          ))}
          <div style={{ marginTop:28, padding:'20px 24px', background:'var(--off)', border:'var(--border)', borderRadius:4 }}>
            <div style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', color:'var(--g500)', marginBottom:8 }}>What ALPgebra does not cover</div>
            <p style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--g700)', lineHeight:1.7 }}>
              ALPgebra is a pure Algebra program — it does not cover Arithmetic topics such as Percentages, Profit and Loss, Time Speed and Distance, or Time and Work. Arithmetic is covered in a separate dedicated program.
            </p>
          </div>
        </div>
      </section>

      {/* about ALP sir */}
      <section style={{ padding:'56px 0', borderBottom:'var(--border)', background:'var(--black)' }}>
        <div className="container" style={{ maxWidth:640 }}>
          <div className="eyebrow" style={{ marginBottom:14, color:'var(--g500)' }}><span className="dot" />Who's teaching it</div>
          <h2 style={{ fontFamily:'var(--font-serif)', fontSize:'clamp(22px,3vw,30px)', color:'#fff', marginBottom:16, lineHeight:1.3 }}>Abhishek Leela Pandey</h2>
          <p style={{ fontFamily:'var(--font-body)', fontSize:14, color:'var(--g500)', lineHeight:1.8 }}>
            99.93 percentile in CAT. 770 on the GMAT Focus Edition. Founder of GRADSKOOL. Years spent watching students lose marks not because they lacked effort, but because they lacked a system — ALPgebra is that system.
          </p>
        </div>
      </section>

      {/* final CTA */}
      <section style={{ padding:'72px 0', textAlign:'center' }}>
        <div className="container">
          <h2 style={{ fontFamily:'var(--font-serif)', fontSize:'clamp(26px,4vw,44px)', fontWeight:400, color:'var(--black)', marginBottom:14 }}>
            Predict. Practice. <em style={R}>Perfect.</em>
          </h2>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap', marginTop:24 }}>
            <Link href="/checkout?course=alpgebra&plan=alpgebra" className="btn btn-red">Enrol Now — {fmtPrice(PRICE)} →</Link>
            <a href="https://wa.me/917838737388?text=Hi%20ALP%20Sir%2C%20I%20want%20to%20know%20more%20about%20ALPgebra" target="_blank" rel="noopener noreferrer" className="btn btn-wa">
              <span className="wa-dot" />WhatsApp ALP Sir
            </a>
          </div>
        </div>
      </section>

      <WaFloat msg="Hi ALP Sir, I want to know more about ALPgebra" />
    </>
  )
}
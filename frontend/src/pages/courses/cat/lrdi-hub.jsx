/**
 * GRADSKOOL — LRDI Hub
 * Route: /courses/cat/lrdi-hub
 *
 * A genuine resource hub for CAT's DILR section — not just a syllabus
 * list. Links directly into the FYQ practice bank's LRDI section via a
 * deep-link query param, so "practice this section" is an actual,
 * working destination, not a dead end.
 */
import Head from 'next/head'
import Link from 'next/link'
import { S, WaFloat } from '../../../components/courses/CourseLayout'
import CatTabs from '../../../components/courses/CatTabs'

const R = { color: 'var(--red)' }

const TOPICS = ['DI caselets: tables, graphs, charts','Arrangements & scheduling','Puzzles & grid-based LR','Blood relations & direction sense','Games & tournaments','Data sets & inference']

const APPROACH = [
  { n:'01', name:'Pattern Recognition', desc:'Every LRDI caselet fits a recognizable pattern. We teach you to spot it in the first 30 seconds, not stumble through it blind.' },
  { n:'02', name:'Selective Attempting', desc:'Not every set is worth solving. Structured frameworks for deciding what to attempt and what to skip, under time pressure.' },
  { n:'03', name:'Speed + Accuracy', desc:'Timed drills that build both — accuracy without speed doesn\u2019t clear the cutoff, speed without accuracy costs you the set.' },
]

export default function LrdiHubPage() {
  return (
    <>
      <Head>
        <title>LRDI Hub — CAT Logical Reasoning & Data Interpretation — GRADSKOOL</title>
        <meta name="description" content="GRADSKOOL's LRDI Hub — structured DILR preparation for CAT, with pattern-based teaching and dedicated practice questions." />
      </Head>

      <style>{S}</style>
      <CatTabs active="lrdi-hub" />

      <section style={{ background:'var(--black)', padding:'72px 0 56px', borderBottom:'var(--border)' }}>
        <div className="container">
          <Link href="/courses/cat" style={{ fontFamily:'var(--font-sans)', fontSize:13, color:'var(--g500)', textDecoration:'none' }}>← Back to CAT</Link>
          <div className="eyebrow" style={{ marginTop:20, marginBottom:14 }}><span className="dot" />LRDI Hub</div>
          <h1 className="d-xl" style={{ color:'#fff', marginBottom:20, maxWidth:600 }}>Logical Reasoning<br />&amp; <em style={R}>Data Interpretation.</em></h1>
          <p style={{ fontFamily:'var(--font-body)', fontSize:15, color:'var(--g500)', lineHeight:1.85, maxWidth:520, marginBottom:32 }}>
            DILR is where CAT scores are made or lost — a strong VARC/QA score means little if DILR sinks the sectional cutoff. GRADSKOOL's LRDI Hub is structured specifically around pattern recognition and selective attempting, not just more caselets.
          </p>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <Link href="/checkout?course=lrdi-hub&plan=lrdi-hub" className="btn btn-red">Enrol Now — ₹499 →</Link>
            <Link href="/fyqs?section=LRDI" className="btn btn-ghost">Practice LRDI Questions →</Link>
            <Link href="/courses/cat/catalysis" className="btn btn-ghost">See full CATalysis course →</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div style={{ marginBottom:36 }}>
            <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />How we teach DILR</div>
            <h2 className="d-lg">Not more caselets<br /><em style={R}>— better ones.</em></h2>
          </div>
          <div className="stages">
            {APPROACH.map(s => (
              <div key={s.n} className="stage-card">
                <div className="stage-bg">{s.n}</div>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:15, color:'var(--black)', lineHeight:1.3, marginBottom:8, position:'relative', zIndex:1 }}>{s.name}</div>
                <p style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'var(--g700)', lineHeight:1.6, position:'relative', zIndex:1 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding:'72px 0', background:'var(--off)' }}>
        <div className="container">
          <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />Full coverage</div>
          <h2 className="d-lg" style={{ marginBottom:28 }}>DILR topics covered</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:12 }}>
            {TOPICS.map(t => (
              <div key={t} style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--g700)', padding:'14px 18px', background:'#fff', border:'var(--border)', borderRadius:3 }}>{t}</div>
            ))}
          </div>
        </div>
      </section>
      <WaFloat msg="Hi ALP Sir, I want to know more about the LRDI Hub" />
    </>
  )
}
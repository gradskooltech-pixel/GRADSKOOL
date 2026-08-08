/**
 * GRADSKOOL — VARC Hub
 * Route: /courses/cat/varc-hub
 *
 * Same pattern as the LRDI Hub — genuine resource page, deep-links into
 * the FYQ practice bank's VARC section.
 */
import Head from 'next/head'
import Link from 'next/link'
import { S, WaFloat } from '../../../components/courses/CourseLayout'
import CatTabs from '../../../components/courses/CatTabs'

const R = { color: 'var(--red)' }

const TOPICS = ['Reading Comprehension passages','Para-jumbles','Para-summary','Odd sentence identification','Vocabulary in context','Critical reasoning']

const APPROACH = [
  { n:'01', name:'Reading Speed & Retention', desc:'RC passages reward comprehension speed, not just vocabulary. Structured reading techniques that hold up under time pressure.' },
  { n:'02', name:'Logical Structure', desc:'Para-jumbles and summaries are logic problems disguised as reading questions. We teach the underlying structure, not guesswork.' },
  { n:'03', name:'Elimination Discipline', desc:'Most VARC questions are won by eliminating three wrong answers, not spotting the right one directly. A trainable skill.' },
]

export default function VarcHubPage() {
  return (
    <>
      <Head>
        <title>VARC Hub — CAT Verbal Ability & Reading Comprehension — GRADSKOOL</title>
        <meta name="description" content="GRADSKOOL's VARC Hub — structured Verbal Ability and Reading Comprehension preparation for CAT, with dedicated practice questions." />
      </Head>

      <style>{S}</style>
      <CatTabs active="varc-hub" />

      <section style={{ background:'var(--black)', padding:'72px 0 56px', borderBottom:'var(--border)' }}>
        <div className="container">
          <Link href="/courses/cat" style={{ fontFamily:'var(--font-sans)', fontSize:13, color:'var(--g500)', textDecoration:'none' }}>← Back to CAT</Link>
          <div className="eyebrow" style={{ marginTop:20, marginBottom:14 }}><span className="dot" />VARC Hub</div>
          <h1 className="d-xl" style={{ color:'#fff', marginBottom:20, maxWidth:600 }}>Verbal Ability<br />&amp; <em style={R}>Reading Comprehension.</em></h1>
          <p style={{ fontFamily:'var(--font-body)', fontSize:15, color:'var(--g500)', lineHeight:1.85, maxWidth:520, marginBottom:32 }}>
            VARC punishes slow reading and rewards logical elimination more than raw vocabulary. GRADSKOOL's VARC Hub is structured around reading speed, passage logic, and disciplined elimination — not endless RC sets with no framework.
          </p>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <Link href="/checkout?course=varc-hub&plan=varc-hub" className="btn btn-red">Enrol Now — ₹499 →</Link>
            <Link href="/fyqs?section=VARC" className="btn btn-ghost">Practice VARC Questions →</Link>
            <Link href="/courses/cat/catalysis" className="btn btn-ghost">See full CATalysis course →</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div style={{ marginBottom:36 }}>
            <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />How we teach VARC</div>
            <h2 className="d-lg">Not more passages<br /><em style={R}>— better technique.</em></h2>
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
          <h2 className="d-lg" style={{ marginBottom:28 }}>VARC topics covered</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:12 }}>
            {TOPICS.map(t => (
              <div key={t} style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--g700)', padding:'14px 18px', background:'#fff', border:'var(--border)', borderRadius:3 }}>{t}</div>
            ))}
          </div>
        </div>
      </section>
      <WaFloat msg="Hi ALP Sir, I want to know more about the VARC Hub" />
    </>
  )
}
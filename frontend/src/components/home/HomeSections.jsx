/**
 * GRADSKOOL — Homepage Sections
 * Rebuilt from static HTML — exact design match.
 *
 * Design system from static:
 *   --red: #ff5e5f  --black: #0f0f0f
 *   Font: Georgia serif + system sans
 *   Border-radius: 3-4px
 *   Hover: background #fafaf9, border-color red, translateY(-1px)
 */
import Link from 'next/link'
import { useState } from 'react'

// ── SHARED ────────────────────────────────────────────────────────────────────

const C = {
  red:     '#ff5e5f',
  redDark: '#cc3a3b',
  redLight:'#fff0f0',
  black:   '#0f0f0f',
  gray900: '#1a1a1a',
  gray700: '#3a3a3a',
  gray600: '#555',
  gray400: '#999',
  gray200: '#ddd',
  gray100: '#f5f5f3',
  gray50:  '#fafaf9',
  border:  '#e8e8e6',
  white:   '#ffffff',
}

const container = { maxWidth: '1160px', margin: '0 auto', padding: '0 2rem' }
const section   = { maxWidth: '1160px', margin: '0 auto', padding: '6rem 2rem' }

// ── COURSE GRID + 9-STAGE FRAMEWORK ──────────────────────────────────────────

const NINE_STAGES = [
  { num: '01', name: 'Video Introduction (English)',  detail: 'Concept overview · Exam relevance · Mental priming' },
  { num: '02', name: 'Video Introduction (Hindi)',    detail: 'Same concept · Wider accessibility · No language barriers' },
  { num: '03', name: 'Live Concept Session',          detail: 'First-principles teaching · Logic before shortcuts' },
  { num: '04', name: 'Cheat Sheet',                   detail: 'Key ideas · Patterns & triggers · Revision-ready' },
  { num: '05', name: 'Basic Quiz',                    detail: 'Immediate application · Concept validation' },
  { num: '06', name: 'Practice Live Session',         detail: 'Dedicated problem-solving · Speed + confidence' },
  { num: '07', name: 'Advanced Quiz',                 detail: 'Exam-level difficulty · Mixed application' },
  { num: '08', name: 'Session PDFs',                  detail: 'Class notes · Solved examples · Reference material' },
  { num: '09', name: 'Doubt Resolution',              detail: 'Dedicated support · No gaps carried forward' },
]

const FALLBACK_EXAMS = [
  { slug: 'xat',         short: 'XAT',                cat: 'MBA India',      catColor: 'india',  badge: null,             desc: "Decision Making, Verbal Ability and Quantitative. Target XLRI Jamshedpur and top XAT-accepting B-schools." },
  { slug: 'snap',        short: 'SNAP',               cat: 'MBA India',      catColor: 'india',  badge: null,             desc: "Symbiosis — SIBM Pune, SCMHRD, SIIB and more. One of India's fastest-growing MBA clusters." },
  { slug: 'nmat',        short: 'NMAT',               cat: 'MBA India',      catColor: 'india',  badge: null,             desc: "NMIMS Mumbai, Hyderabad, Bangalore. Retake-friendly exam with structured score improvement strategy." },
  { slug: 'cmat',        short: 'CMAT',               cat: 'MBA India',      catColor: 'india',  badge: null,             desc: "JBIMS, SIMSREE, PUMBA and 1000+ AICTE institutes. NTA-conducted. Also accepted by top Maharashtra B-schools." },
  { slug: 'mhcet',       short: 'MH CET MBA',         cat: 'MBA Maharashtra',catColor: 'india',  badge: 'JBIMS Route',    desc: "200 questions. 150 minutes. No negative marking. The fastest route to JBIMS, SIMSREE and KJ Somaiya." },
  { slug: 'gmat',        short: 'GMAT',               cat: 'MBA Abroad',     catColor: 'abroad', badge: 'Global MBA',     desc: "Quantitative, verbal and data insights preparation for ISB, INSEAD, LBS and top global MBA programmes." },
  { slug: 'gre',         short: 'GRE',                cat: 'Masters Abroad', catColor: 'abroad', badge: 'International',  desc: "Analytical writing, verbal and quantitative reasoning for MIT, Stanford, CMU, NUS and top universities worldwide." },
  { slug: 'ipmat',       short: 'IPMAT',              cat: 'UG Management',  catColor: 'ug',     badge: 'IIM at 18',      desc: "IIM Indore, Rohtak, JIPMAT, NPAT and 12 programmes. 89 mocks + 19 books. The only route to IIM without CAT." },
  { slug: 'clat',        short: 'CLAT / AILET / LNAT',cat: 'Law Entrance',   catColor: 'ug',     badge: 'NLU + UK',       desc: "10 CLAT + 5 AILET + 3 LNAT mocks. 21 printed books. NLU Delhi, NLSIU, and UK law schools — one package." },
  { slug: 'cuet',        short: 'CUET UG',            cat: 'University UG',  catColor: 'ug',     badge: 'DU · BHU · JNU', desc: "Delhi University, BHU, JNU and 250+ central universities. Mocks + books. Free tools always available." },
  { slug: 'pi-wat-gd',   short: 'PI WAT GD',          cat: 'Interview Prep', catColor: 'bundle', badge: 'Post-CAT',       desc: "Personal Interview, Written Ability Test, Group Discussion. GDPI preparation for IIM and top B-school calls." },
  { slug: 'complete-mba',short: 'Complete MBA Prep',  cat: 'Bundle',         catColor: 'bundle', badge: 'All-in-one',     desc: "CAT + XAT + SNAP + NMAT + CMAT. One integrated programme. The only prep you will ever need." },
]

const TAG_COLORS = {
  india:  { bg: '#e8f4e8', color: '#2d6a2d', label: 'MBA India' },
  abroad: { bg: '#e8eef8', color: '#1a3d78', label: 'MBA Abroad' },
  ug:     { bg: '#fff3e0', color: '#7a4500', label: 'UG Entrance' },
  bundle: { bg: '#f9f0ff', color: '#6a0dad', label: 'Bundle' },
}

function CourseCard({ exam, isHero = false }) {
  const [hov, setHov] = useState(false)
  const tc = TAG_COLORS[exam.catColor] || TAG_COLORS.india

  if (isHero) {
    return (
      <Link
        href={`/courses/${exam.slug}`}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          gridColumn:  '1 / -1',
          background:  hov ? '#111' : C.black,
          display:     'grid',
          gridTemplateColumns: '1fr 380px',
          minHeight:   '280px',
          position:    'relative',
          overflow:    'hidden',
          textDecoration: 'none',
          transition:  'background 0.2s',
        }}
      >
        {/* Red accent bar */}
        <div style={{ position:'absolute',top:0,left:0,width:'4px',height:'100%',background:C.red,zIndex:1 }} />

        {/* Left */}
        <div style={{ padding:'2.75rem 3rem', display:'flex', flexDirection:'column', justifyContent:'space-between', gap:'1.5rem' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.75rem' }}>
              <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', fontWeight:'600', letterSpacing:'0.1em', textTransform:'uppercase', color:C.red }}>MBA India</span>
              <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'600', background:C.red, color:'#fff', padding:'0.18rem 0.55rem', borderRadius:'2px' }}>Flagship</span>
            </div>
            <div style={{ fontFamily:'Georgia,serif', fontSize:'clamp(2rem,3.5vw,2.8rem)', color:'#fff', fontWeight:'700', lineHeight:'1.1', marginBottom:'0.5rem' }}>
              CAT 2026 —<br /><em style={{ fontStyle:'italic', color:C.red, fontWeight:'400' }}>The IIM Route.</em>
            </div>
            <p style={{ fontFamily:'Georgia,serif', fontSize:'0.95rem', color:'#aaa', lineHeight:'1.7', maxWidth:'520px' }}>
              {exam.desc || "India's most competitive MBA entrance exam. GRADSKOOL's flagship programme — live two-way sessions with ALP Sir, 15+ full-length mocks, post-test strategic analysis, and optional GDPI preparation. Every session is capped at 27 students."}
            </p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'2rem', flexWrap:'wrap' }}>
            <div style={{ fontFamily:'Georgia,serif', fontSize:'1rem', color:'#fff' }}>
              Starting from{' '}
              <strong style={{ fontSize:'1.4rem', color:C.red }}>₹27,999</strong>
              {' '}<span style={{ fontSize:'0.85rem', opacity:0.7 }}>+ GST · Mocks-only from ₹2,999</span>
            </div>
            <span style={{
              fontFamily:'var(--font-sans)', fontSize:'0.85rem', fontWeight:'500', color:C.red,
              display:'flex', alignItems:'center', gap:'0.3rem',
              opacity: hov ? 1 : 0,
              transform: hov ? 'translateX(0)' : 'translateX(-4px)',
              transition: 'opacity 0.2s, transform 0.2s',
            }}>Explore CAT 2026 →</span>
          </div>
        </div>

        {/* Right — 9-stage framework */}
        <div style={{ background:'#111', borderLeft:'1px solid #222', padding:'2.25rem 2rem' }}>
          <div style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'600', letterSpacing:'0.1em', textTransform:'uppercase', color:C.red, marginBottom:'1rem' }}>
            The 9-Stage Learning Framework
          </div>
          {NINE_STAGES.map(s => (
            <div key={s.num} style={{ display:'flex', alignItems:'flex-start', gap:'0.75rem', padding:'0.55rem 0', borderBottom:'1px solid #1e1e1e' }}>
              <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.62rem', fontWeight:'700', color:C.red, width:'16px', flexShrink:0, marginTop:'0.15rem' }}>{s.num}</span>
              <div>
                <div style={{ fontFamily:'Georgia,serif', fontSize:'0.82rem', color:'#ccc', lineHeight:'1.3' }}>{s.name}</div>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', color:'#666', marginTop:'0.1rem', lineHeight:'1.4' }}>{s.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={`/courses/${exam.slug}`}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background:     hov ? C.gray50 : C.white,
        padding:        '2.25rem',
        display:        'flex',
        flexDirection:  'column',
        textDecoration: 'none',
        transition:     'background 0.2s',
      }}
    >
      {/* Tag */}
      <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'500', letterSpacing:'0.09em', textTransform:'uppercase', color:C.red, marginBottom:'0.5rem' }}>
        {exam.cat}
      </span>
      {/* Badge */}
      {exam.badge && (
        <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', letterSpacing:'0.05em', textTransform:'uppercase', padding:'0.2rem 0.55rem', borderRadius:'2px', background:tc.bg, color:tc.color, display:'inline-block', marginBottom:'0.5rem', alignSelf:'flex-start' }}>
          {exam.badge}
        </span>
      )}
      {/* Name */}
      <div style={{ fontFamily:'Georgia,serif', fontSize:'1.3rem', color:C.black, marginBottom:'0.6rem', lineHeight:'1.2', fontWeight:'500' }}>
        {exam.short}
      </div>
      {/* Desc */}
      <p style={{ fontFamily:'Georgia,serif', fontSize:'0.875rem', color:C.gray600, lineHeight:'1.7', marginBottom:'1.25rem', flex:1 }}>
        {exam.desc}
      </p>
      {/* Arrow */}
      <span style={{
        fontFamily: 'var(--font-sans)', fontSize: '0.82rem', fontWeight: '500', color: C.red,
        display: 'flex', alignItems: 'center', gap: '0.3rem',
        opacity:    hov ? 1 : 0,
        transform:  hov ? 'translateX(0)' : 'translateX(-4px)',
        transition: 'opacity 0.2s, transform 0.2s',
      }}>
        Learn more →
      </span>
    </Link>
  )
}

export function HomeCourseGrid({ exams = [] }) {
  const catExam = exams.find(e => e.slug === 'cat')
  const rest    = FALLBACK_EXAMS

  return (
    <section style={{ ...section }} id="courses">
      <div style={sg.header}>
        <div>
          <div style={sg.label}>What We Offer</div>
          <h2 style={sg.title}>Courses for Every Exam</h2>
          <p style={sg.sub}>From CAT to GMAT, GRE to Law UG — structured preparation for every major entrance exam in India and abroad.</p>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1px', background:C.border, border:`1px solid ${C.border}`, borderRadius:'4px', overflow:'hidden' }}>
        {/* CAT Hero card */}
        <CourseCard isHero exam={catExam || { slug:'cat', desc:'' }} />

        {/* All other exams */}
        {rest.map(exam => (
          <CourseCard key={exam.slug} exam={exam} />
        ))}
      </div>

      <div style={{ marginTop:'2.5rem', textAlign:'center' }}>
        <Link href="/courses" style={{ fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'500', color:C.red, display:'inline-flex', alignItems:'center', gap:'0.4rem', borderBottom:`1px solid ${C.red}`, paddingBottom:'1px', textDecoration:'none' }}>
          See all programmes →
        </Link>
      </div>
    </section>
  )
}

const sg = {
  header: { display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'3rem', gap:'2rem' },
  label:  { fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'500', letterSpacing:'0.1em', textTransform:'uppercase', color:C.red, marginBottom:'0.6rem' },
  title:  { fontFamily:'Georgia,serif', fontSize:'clamp(1.9rem,3vw,2.6rem)', color:C.black, lineHeight:'1.15', marginBottom:'0.9rem', fontWeight:'700' },
  sub:    { fontFamily:'Georgia,serif', fontSize:'1rem', color:C.gray600, maxWidth:'520px', lineHeight:'1.75' },
}

// ── WHY SECTION ───────────────────────────────────────────────────────────────

const WHY = [
  { num:'01', title:'Two-Way Live Interaction',    body:'Every session is built around structured questioning. Students articulate reasoning, defend approaches, and identify hidden assumptions before solutions are revealed.' },
  { num:'02', title:'Post-Test Strategic Analysis', body:'Every test is followed by a detailed breakdown — time distribution, attempt vs accuracy mapping, behavioural insights, and negative marking impact. Not just scores. How you thought.' },
  { num:'03', title:'27-Student Cohort Limit',      body:'Not a policy. A philosophy. Genuine mentorship requires knowing every student\'s strengths, blind spots, and thinking patterns by name.' },
  { num:'04', title:'Learn On The Go',              body:'Access live sessions, revision modules, daily drills and diagnostics seamlessly across all devices without compromising structure or depth.' },
]

export function HomeWhy() {
  return (
    <section style={{ background:C.gray50, borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}` }}>
      <div style={{ ...section }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1.2fr', gap:'6rem', alignItems:'start' }}>
          {/* Left — sticky */}
          <div style={{ position:'sticky', top:'80px' }}>
            <div style={sg.label}>Our Method</div>
            <h2 style={{ ...sg.title, maxWidth:'none' }}>
              Why GRADSKOOL<br />is Different
            </h2>
            <p style={sg.sub}>
              Most coaching is passive. You watch, you forget. We built a system
              that forces active thinking at every step.
            </p>
          </div>

          {/* Right — feature cards */}
          <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
            {WHY.map((w, i) => (
              <WhyFeature key={i} {...w} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function WhyFeature({ num, title, body }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding:      '2rem',
        background:   C.white,
        border:       `1px solid ${hov ? C.red : C.border}`,
        borderRadius: '4px',
        position:     'relative',
        overflow:     'hidden',
        transition:   'border-color 0.25s',
      }}
    >
      {/* Big number watermark */}
      <div style={{ fontFamily:'Georgia,serif', fontSize:'3.5rem', color:'#f0f0ee', position:'absolute', top:'0.5rem', right:'1.25rem', lineHeight:'1', fontWeight:'700', userSelect:'none', pointerEvents:'none' }}>
        {num}
      </div>
      <h3 style={{ fontFamily:'Georgia,serif', fontSize:'1.15rem', color:C.black, marginBottom:'0.6rem', fontWeight:'500' }}>{title}</h3>
      <p style={{ fontFamily:'Georgia,serif', fontSize:'0.9rem', color:C.gray600, lineHeight:'1.75' }}>{body}</p>
    </div>
  )
}

// ── TOOLS GRID ────────────────────────────────────────────────────────────────

const TOOLS = [
  { slug:'rc99',            name:'RC 99 Passages',       exam:'CAT',        desc:'99 RC passages with detailed questions — by category and difficulty.' },
  { slug:'rc111',           name:'RC 111 Passages',       exam:'CAT · XAT',  desc:'111 passages — the most comprehensive free RC tool available.' },
  { slug:'cat-maths',       name:'CAT QA Tool',           exam:'CAT · IPMAT',desc:'34 topics, 2,178 questions with concept notes and explanations.' },
  { slug:'rc-lexicon',      name:'RC Lexicon',             exam:'CAT · GMAT', desc:'160 vocabulary MCQs from RC passages across 8 topic categories.' },
  { slug:'gre-vocab',       name:'GRE Vocab Forge',        exam:'GRE · GMAT', desc:'759 words with definitions, examples and contextual meaning.' },
  { slug:'cat-grammar',     name:'Grammar Practice',       exam:'All Exams',  desc:'570 questions across 19 grammar topics for CAT, GMAT, CLAT.' },
  { slug:'mba-gk',          name:'MBA GK — 450 Qs',       exam:'XAT · SNAP', desc:'Business, current affairs, static GK for XAT, SNAP, NMAT.' },
  { slug:'legal-awareness', name:'CLAT Legal Reasoning',  exam:'Law UG',     desc:'60 principle-application cards for CLAT and AILET preparation.' },
]

export function HomeToolsGrid() {
  return (
    <section style={{ ...section }}>
      <div style={{ ...sg.header }}>
        <div>
          <div style={sg.label}>Free Resources</div>
          <h2 style={sg.title}>Practice Tools</h2>
          <p style={sg.sub}>Purpose-built tools to sharpen every skill — free for all students. Leave your email and access instantly.</p>
        </div>
        <Link href="/tools" style={{ fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'500', color:C.red, display:'inline-flex', alignItems:'center', gap:'0.4rem', borderBottom:`1px solid ${C.red}`, paddingBottom:'1px', textDecoration:'none', whiteSpace:'nowrap' }}>
          All tools →
        </Link>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem' }}>
        {TOOLS.map(tool => <ToolCard key={tool.slug} tool={tool} />)}
      </div>
    </section>
  )
}

function ToolCard({ tool }) {
  const [hov, setHov] = useState(false)
  return (
    <Link
      href={`/tools/${tool.slug}`}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        border:       `1px solid ${hov ? C.red : C.border}`,
        borderRadius: '4px',
        padding:      '1.4rem',
        display:      'flex',
        flexDirection:'column',
        gap:          '0.5rem',
        textDecoration:'none',
        boxShadow:    hov ? '0 2px 16px rgba(255,94,95,0.07)' : 'none',
        transition:   'border-color 0.2s, box-shadow 0.2s',
      }}
    >
      <div style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', fontWeight:'500', letterSpacing:'0.07em', textTransform:'uppercase', color:C.red }}>{tool.exam}</div>
      <div style={{ fontFamily:'Georgia,serif', fontSize:'0.92rem', fontWeight:'500', color:C.black, lineHeight:'1.4' }}>{tool.name}</div>
      <p style={{ fontFamily:'Georgia,serif', fontSize:'0.82rem', color:C.gray600, lineHeight:'1.6', flex:1 }}>{tool.desc}</p>
      <div style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', color: hov ? C.red : C.gray400, marginTop:'auto', display:'flex', alignItems:'center', gap:'0.3rem', transition:'color 0.2s' }}>
        Open tool →
      </div>
    </Link>
  )
}

// ── TESTIMONIALS ──────────────────────────────────────────────────────────────

const TESTIMONIALS_FB = [
  { name:'Keshav Mundra',   detail:'GMAT Cohort',                text:'Being part of GradSKOOL has been a completely different learning experience. Each class is structured so a topic feels truly completed. The pre-class videos, live session, PDFs, and quiz — this end-to-end flow gives real confidence. The personal mentorship is the most valuable part — I have reached out for academic and professional guidance, and he always has the right solution.', stars:5 },
  { name:'Vanshaj Jaiman',  detail:'CAT 2026 Cohort',            text:'Totally out of the box. The content and structure — how things are planned and executed — is remarkable. Planning is one thing and execution is another, and GRADSKOOL nails both. The two-way live communication platform is the most valuable thing. I am able to clear even my smallest doubts in the session itself.', stars:5 },
  { name:'Sameer Ansari',   detail:'XAT 2026 · PI WAT GD Cohort',text:'From my CAT journey to XAT, you stood with us at every step. The GDPI preparation was fantabulous — NMIMS competency, personal interview, study material, all perfectly structured. The mock interviews from normal to stress rounds prepared me for exactly what happened in real interviews. Words cannot define how much you helped, sir.', stars:5 },
]

export function HomeTestimonials({ testimonials = [] }) {
  const list = testimonials.length ? testimonials : TESTIMONIALS_FB
  return (
    <section style={{ ...section, borderTop:`1px solid ${C.border}` }}>
      <div style={{ ...sg.header }}>
        <div>
          <div style={sg.label}>Student Voices</div>
          <h2 style={sg.title}>What Our Students Say</h2>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1.5rem' }}>
        {list.slice(0,3).map((t,i) => (
          <div key={i} style={{ border:`1px solid ${C.border}`, borderRadius:'4px', padding:'2rem', background:C.white, display:'flex', flexDirection:'column', gap:'1.25rem' }}>
            <div style={{ fontFamily:'Georgia,serif', fontSize:'2.5rem', color:C.red, lineHeight:'1', fontStyle:'italic' }}>"</div>
            <p style={{ fontFamily:'Georgia,serif', fontSize:'0.9rem', color:C.gray700, lineHeight:'1.8', flex:1, fontStyle:'italic' }}>{t.text}</p>
            <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:'1rem' }}>
              <div style={{ fontFamily:'Georgia,serif', fontSize:'0.95rem', fontWeight:'500', color:C.black }}>{t.name || t.student_name}</div>
              {(t.detail || t.cohort) && <div style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:C.gray400, marginTop:'0.2rem' }}>{t.detail || t.cohort}</div>}
              <div style={{ color:'#f59e0b', fontSize:'0.8rem', marginTop:'0.25rem', letterSpacing:'0.05em' }}>{'★'.repeat(t.stars || t.rating || 5)}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── FAQ ───────────────────────────────────────────────────────────────────────

const FAQS = [
  { q:'What makes GRADSKOOL different from other CAT coaching institutes?', a:'GRADSKOOL limits every cohort to 27 students, ensuring two-way live interaction, personalised feedback, and structured post-test analysis. Unlike mass coaching, every student\'s doubts, thinking patterns and performance are addressed individually by name.' },
  { q:'Which exams does GRADSKOOL prepare students for?', a:'GRADSKOOL offers structured preparation for CAT, GMAT, GRE, IPMAT, XAT, SNAP, NMAT, CMAT, MHCET, Law UG (CLAT/AILET) and CUET.' },
  { q:'How many students are in each GRADSKOOL cohort?', a:'Every GRADSKOOL cohort is intentionally limited to 27 students. This is not a policy — it is a philosophy. Genuine mentorship requires knowing every student\'s strengths, blind spots, and thinking patterns by name.' },
  { q:'Does GRADSKOOL offer free resources for CAT preparation?', a:'Yes. GRADSKOOL offers free tools including CAT Quantitative Aptitude Tool, RC 111, Logic Builder, Grammar, RC Lexicon, Vocabulary Builder, GK Tool, and downloadable PDFs — all available on the Tools page at no cost.' },
  { q:'Who founded GRADSKOOL?', a:'GRADSKOOL was founded by Abhishek Leela Pandey, who has mentored over 100,000 students and helped 5,000+ students convert calls from IIMs and top B-schools across India and abroad.' },
]

export function HomeFAQ() {
  const [open, setOpen] = useState(null)
  return (
    <section style={{ background:C.gray50, borderTop:`1px solid ${C.border}` }}>
      <div style={{ ...section }}>
        <div style={{ ...sg.header }}>
          <div>
            <div style={sg.label}>Common Questions</div>
            <h2 style={sg.title}>Frequently Asked Questions</h2>
            <p style={sg.sub}>Everything you need to know before joining a GRADSKOOL cohort.</p>
          </div>
          <Link href="/faqs" style={{ fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'500', color:C.red, display:'inline-flex', alignItems:'center', gap:'0.4rem', borderBottom:`1px solid ${C.red}`, paddingBottom:'1px', textDecoration:'none', whiteSpace:'nowrap' }}>
            All FAQs →
          </Link>
        </div>

        <div style={{ display:'flex', flexDirection:'column', border:`1px solid ${C.border}`, borderRadius:'4px', overflow:'hidden' }}>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ borderBottom: i < FAQS.length-1 ? `1px solid ${C.border}` : 'none', background:C.white }}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                style={{ width:'100%', background:'none', border:'none', padding:'1.4rem 1.75rem', textAlign:'left', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', gap:'1rem' }}
              >
                <span style={{ fontFamily:'Georgia,serif', fontSize:'0.95rem', fontWeight:'500', color:C.black, lineHeight:'1.5' }}>{faq.q}</span>
                <span style={{ fontFamily:'var(--font-sans)', fontSize:'1.2rem', color:C.red, flexShrink:0, transition:'transform 0.25s', lineHeight:'1', transform: open === i ? 'rotate(45deg)' : 'none' }}>+</span>
              </button>
              {open === i && (
                <div style={{ padding:'0 1.75rem 1.5rem' }}>
                  <p style={{ fontFamily:'Georgia,serif', fontSize:'0.9rem', color:C.gray600, lineHeight:'1.8' }}>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── BLOG ──────────────────────────────────────────────────────────────────────

const BLOG_FB = []

export function HomeBlog({ posts = [] }) {
  // Don't render the section at all if no posts
  if (!posts?.length) return null
  const list = posts
  return (
    <section style={{ ...section, borderTop:`1px solid ${C.border}` }}>
      <div style={{ ...sg.header }}>
        <div>
          <div style={sg.label}>Latest</div>
          <h2 style={sg.title}>From the Blog</h2>
          <p style={sg.sub}>Strategy, insights and preparation guides from the GRADSKOOL team.</p>
        </div>
        <Link href="/blog" style={{ fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'500', color:C.red, display:'inline-flex', alignItems:'center', gap:'0.4rem', borderBottom:`1px solid ${C.red}`, paddingBottom:'1px', textDecoration:'none', whiteSpace:'nowrap' }}>
          All articles →
        </Link>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'2.5rem' }}>
        {list.slice(0,3).map((post,i) => (
          <BlogCard key={i} post={post} />
        ))}
      </div>
    </section>
  )
}

function BlogCard({ post }) {
  const [hov, setHov] = useState(false)
  const href = post.slug && post.slug !== 'blog' ? `/blog/${post.slug}` : '/blog'
  return (
    <Link
      href={href}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ display:'flex', flexDirection:'column', gap:'0.6rem', borderBottom:`1px solid ${C.border}`, paddingBottom:'2rem', textDecoration:'none' }}
    >
      <div style={{ fontFamily:'var(--font-sans)', fontSize:'0.7rem', fontWeight:'500', letterSpacing:'0.08em', textTransform:'uppercase', color:C.red }}>{post.tag || post.category}</div>
      <div style={{ fontFamily:'Georgia,serif', fontSize:'1.15rem', color: hov ? C.red : C.black, lineHeight:'1.35', fontWeight:'500', transition:'color 0.2s' }}>{post.title}</div>
      <p style={{ fontFamily:'Georgia,serif', fontSize:'0.875rem', color:C.gray600, lineHeight:'1.7' }}>{post.excerpt || post.meta_desc}</p>
      <div style={{ fontFamily:'var(--font-sans)', fontSize:'0.76rem', color:C.gray400, marginTop:'auto' }}>{post.date || post.published_at?.slice(0,10) || ''}</div>
    </Link>
  )
}

// ── FOUNDER ───────────────────────────────────────────────────────────────────

export function HomeFounder() {
  return (
    <div style={{ background:C.black, padding:'6rem 2rem' }}>
      <div style={{ ...container }}>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'6rem', alignItems:'center' }}>
          <div>
            <div style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'500', letterSpacing:'0.1em', textTransform:'uppercase', color:C.red, marginBottom:'0.75rem' }}>Founded By</div>
            <h2 style={{ fontFamily:'Georgia,serif', fontSize:'2.5rem', color:'#ffffff', lineHeight:'1.1', marginBottom:'1.5rem', fontWeight:'700' }}>
              Abhishek<br />Leela Pandey
            </h2>
            <p style={{ fontFamily:'Georgia,serif', fontSize:'0.95rem', color:C.gray400, lineHeight:'1.85' }}>
              GRADSKOOL was built on a simple belief — that serious exam preparation requires
              genuine mentorship, not content delivery. Every cohort, every session, and every
              tool on this platform is designed around that principle. The goal has never been
              scale. It has always been outcomes.
            </p>
          </div>
          <div style={{ width:'100%', maxWidth:'380px', aspectRatio:'1', background:'#1a1a1a', borderRadius:'0', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
            <div style={{ fontFamily:'Georgia,serif', fontSize:'4rem', color:'#333', fontWeight:'700', textAlign:'center', lineHeight:'1' }}>ALP</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── INSTRUCTORS ───────────────────────────────────────────────────────────────

export function HomeInstructors({ instructors = [] }) {
  if (!instructors.length) return null
  const lead = instructors.find(i => i.is_lead) || instructors[0]
  return (
    <section style={{ ...section, borderTop:`1px solid ${C.border}` }}>
      <div style={{ ...sg.header }}>
        <div>
          <div style={sg.label}>Faculty</div>
          <h2 style={sg.title}>Who teaches you.</h2>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'180px 1fr', gap:'3rem', alignItems:'flex-start' }}>
        <div style={{ width:'160px', height:'160px', borderRadius:'50%', background:C.black, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Georgia,serif', fontSize:'3rem', fontWeight:'700' }}>
          {lead.name?.split(' ').map(n => n[0]).join('').slice(0,2)}
        </div>
        <div>
          <div style={sg.label}>{lead.title}</div>
          <h3 style={{ fontFamily:'Georgia,serif', fontSize:'1.8rem', fontWeight:'700', color:C.black, lineHeight:'1.1', marginBottom:'0.5rem' }}>{lead.name}</h3>
          {lead.credentials && <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.8rem', color:C.gray400, marginBottom:'0.75rem' }}>{lead.credentials}</p>}
          {lead.bio && <p style={{ fontFamily:'Georgia,serif', fontSize:'0.95rem', color:C.gray600, lineHeight:'1.8', maxWidth:'580px' }}>{lead.bio.slice(0,300)}{lead.bio.length > 300 ? '…' : ''}</p>}
        </div>
      </div>
    </section>
  )
}

// ── RECOGNITION ───────────────────────────────────────────────────────────────

const RECOGNITION = [
  { pub:'TradeFlock', title:'40 Under 40 — 2024', body:"Recognised among India's top 40 business leaders under 40 for impact in education and mentorship.", href:'https://tradeflock.com/40-under-40-2024-abhishek-leela-pandey/' },
  { pub:'Insights Success', title:'EdTech Leaders', body:'Featured among EdTech leaders reshaping education in India — for structured pedagogy and student outcomes.', href:'https://issuu.com/insightssuccess22/docs/edtech_leaders_who_are_changing_the_face_of_educat' },
  { pub:'Amazon', title:'Published Author', body:'Books by Abhishek Leela Pandey — available on Amazon. An established author alongside his role as lead mentor.', href:'https://www.amazon.in' },
]

export function HomeRecognition() {
  return (
    <section style={{ ...section, borderTop:`1px solid ${C.border}` }}>
      <div style={{ marginBottom:'3rem' }}>
        <div style={sg.label}>Recognition</div>
        <h2 style={sg.title}>Abhishek Leela Pandey — Featured &amp; Recognised</h2>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1px', background:C.border, border:`1px solid ${C.border}`, borderRadius:'4px', overflow:'hidden', marginTop:'2rem' }}>
        {RECOGNITION.map((r,i) => (
          <RecognitionCard key={i} item={r} />
        ))}
      </div>
    </section>
  )
}

function RecognitionCard({ item }) {
  const [hov, setHov] = useState(false)
  return (
    <a
      href={item.href} target="_blank" rel="noreferrer"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background: hov ? C.gray50 : C.white, padding:'2rem', display:'block', textDecoration:'none', transition:'background 0.15s' }}
    >
      <div style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'600', letterSpacing:'0.1em', textTransform:'uppercase', color:C.red, marginBottom:'0.6rem' }}>{item.pub}</div>
      <div style={{ fontFamily:'Georgia,serif', fontSize:'1.05rem', fontWeight:'700', color:C.black, marginBottom:'0.4rem' }}>{item.title}</div>
      <p style={{ fontFamily:'Georgia,serif', fontSize:'0.85rem', color:C.gray600, lineHeight:'1.6' }}>{item.body}</p>
      <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.8rem', color:C.red, marginTop:'0.75rem', display:'block' }}>Read feature →</span>
    </a>
  )
}

// ── BOTTOM CTA ────────────────────────────────────────────────────────────────

export function HomeCTA() {
  return (
    <div style={{ background:C.red, padding:'5.5rem 2rem', textAlign:'center' }}>
      <div style={{ ...container }}>
        <h2 style={{ fontFamily:'Georgia,serif', fontSize:'clamp(2rem,3.5vw,3rem)', color:'#fff', marginBottom:'1rem', lineHeight:'1.15', fontWeight:'700' }}>
          Ready to Prepare the Right Way?
        </h2>
        <p style={{ fontFamily:'Georgia,serif', fontSize:'1rem', color:'rgba(255,255,255,0.85)', marginBottom:'2.5rem', maxWidth:'460px', margin:'0 auto 2.5rem', lineHeight:'1.7' }}>
          Seats in every cohort are limited to 27 students. Once full,
          the next cohort opens only after the current one completes.
        </p>
        <div style={{ display:'flex', justifyContent:'center', gap:'1rem', flexWrap:'wrap' }}>
          <Link href="/courses" style={{ background:'#fff', color:C.red, padding:'0.9rem 2.5rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.9rem', fontWeight:'500', letterSpacing:'0.03em', display:'inline-block', textDecoration:'none' }}>
            Explore Courses →
          </Link>
          <a href="https://wa.me/916360597966" target="_blank" rel="noreferrer" style={{ background:'transparent', color:'#fff', padding:'0.9rem 2rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.9rem', border:'1px solid rgba(255,255,255,0.5)', display:'inline-block', textDecoration:'none' }}>
            💬 WhatsApp Us
          </a>
        </div>
      </div>
    </div>
  )
}
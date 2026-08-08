/**
 * GRADSKOOL — About Page
 * Route: /about
 *
 * Matches static HTML article layout exactly:
 * - Article header: tag, title, excerpt, meta
 * - Two-col layout: article body (left) + sticky sidebar (right)
 * - Body: prose + credentials table + books grid + recognition grid
 * - Sidebar: quick stats, social links, CTA
 */
import Head from 'next/head'
import Link from 'next/link'

const C = {
  red: '#ff5e5f', black: '#0f0f0f', white: '#ffffff',
  gray50: '#fafaf9', gray400: '#999', gray500: '#666',
  gray600: '#555', border: '#e8e8e6',
}

const CREDENTIALS = [
  ['CAT Percentile',       '99.93'],
  ['GMAT Score',           '770'],
  ['CAT Sections Taught',  'VARC, DILR & QA — all three personally'],
  ['Books Published',      '8 (fiction, philosophy, mathematics, strategy)'],
  ['Original Theorems',    '9 (Brahmaganita v1.0 treatise)'],
  ['Academic Credentials', 'Kyoto University (advanced certification) · RUSA Tamil Nadu · MHA Bastar'],
  ['Previous Roles',       'Chief Academic Officer — iQuanta · Senior Faculty — PrepLadder, T.I.M.E., IMS'],
  ['Recognition',          'TradeFlock 40 Under 40 (2024) · Insights Success EdTech Leaders (2025)'],
  ['Cohort Size',          '27 students — strictly capped'],
]

const BOOKS = [
  { genre:'Mythology & Fiction',  title:'The Man with Five Heads',        desc:'' },
  { genre:'Mathematical Fiction', title:'Infinity',                        desc:'A mathematical love story.' },
  { genre:'Strategy',             title:'The Art of Corporate War',        desc:'' },
  { genre:'Philosophy',           title:'Gita for Millennials and Gen Z',  desc:'' },
  { genre:'Logic & Thinking',     title:'The Grand Unification Theory',    desc:'A treatise on thinking systems.' },
  { genre:'Mathematics',          title:'Brahmaganita v1.0',               desc:'9 original theorems.' },
  { genre:'Self-development',     title:'The Perfect MBA',                 desc:'' },
  { genre:'Fiction',              title:'The Last Theorem',                desc:'' },
]

const RECOGNITION = [
  { pub:'TradeFlock',      title:'40 Under 40 — 2024',    body:"Recognised among India's top 40 business leaders under 40.", href:'https://tradeflock.com/40-under-40-2024-abhishek-leela-pandey/' },
  { pub:'Insights Success',title:"India's Most Transformative EdTech Leader 2025", body:'Featured for reshaping education in India through structured pedagogy.', href:'https://issuu.com/insightssuccess22/docs/edtech_leaders_who_are_changing_the_face_of_educat' },
  { pub:'Amazon',          title:'Published Author',       body:'8 books across fiction, philosophy, mathematics, and strategy.', href:'https://www.amazon.com/stores/author/B072N5TSR1/allbooks' },
]

const SECTIONS = [
  {
    title:'The Mathematical Foundation — Brahmaganita',
    body:`ALP Sir's teaching is not built on exam hacks. It is built on mathematics. His treatise Brahmaganita v1.0 contains 9 original theorems that simplify complex numerical relationships — the intellectual foundation for how he approaches Quantitative Ability at GRADSKOOL.

This work earned him an invitation to deliver advanced Vedic Mathematics sessions under RUSA (Rashtriya Uchchatar Shiksha Abhiyan), Tamil Nadu — validating his methods at the state academic level.

The theorems are not exam tricks. They are derived mathematical structures that reveal why certain numerical operations behave as they do. Students who understand the why find that the how becomes obvious — and permanent.`,
  },
  {
    title:'The Thinking System',
    body:`Most coaching teaches content. GRADSKOOL teaches thinking. The distinction is ALP Sir's central thesis — and it manifests across everything from how RC passages are read to how DILR sets are entered to how QA problems are structured before solving.

His Cognitive Apprenticeship model — developed after senior roles as Chief Academic Officer at iQuanta and faculty positions at PrepLadder, T.I.M.E., and IMS — is the architecture of every GRADSKOOL session. The model holds that expertise is not transmitted through content delivery but through observed and practised reasoning. Students do not watch ALP Sir solve problems. They watch him think — and then they do it themselves, in the session, in real time.`,
  },
  {
    title:'Social Impact — Bastar & Tribal Education',
    body:`ALP Sir's commitment to human systems extends well beyond the exam ecosystem. He has worked extensively under Ministry of Home Affairs (MHA) projects in Bastar — one of India's most challenging administrative regions — delivering educational programmes for schoolchildren in tribal terrain.

This work sits at the intersection of anthropology, pedagogy, and social infrastructure, and informs the same first-principles thinking that defines his teaching at GRADSKOOL.`,
  },
]

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>About Abhishek Leela Pandey — Thinking Systems Architect — GRADSKOOL</title>
        <meta name="description" content="99.93 percentile CAT · 770 GMAT · Mathematician · Polymath · Published author of 8 books · AI Filmmaker · Coder · Founder, GRADSKOOL." />
        <link rel="canonical" href="https://gradskool.in/about" />
      </Head>

      {/* BREADCRUMB */}
      <div style={{ padding:'0.875rem 2rem', borderBottom:`1px solid ${C.border}`, background:C.white }}>
        <div style={{ maxWidth:'1060px', margin:'0 auto', display:'flex', gap:'0.5rem', fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:C.gray400 }}>
          <Link href="/" style={{ color:C.gray400, textDecoration:'none' }}>Home</Link>
          <span>/</span>
          <span style={{ color:C.black }}>About</span>
        </div>
      </div>

      {/* ARTICLE HEADER */}
      <div style={s.articleHeader}>
        <span style={s.tag}>About</span>
        <h1 style={s.title}>Abhishek Leela Pandey — Thinking Systems Architect</h1>
        <p style={s.excerpt}>
          99.93 percentile CAT · 770 GMAT · Mathematician · Polymath · Published author of 8 books ·
          AI Filmmaker · Coder · Founder, GRADSKOOL.
          Known to students as the "Number Whisperer" and the GOAT of entrance prep.
        </p>
        <div style={s.meta}>
          <span style={s.metaAuthor}>GRADSKOOL</span>
          <span style={s.metaDot}>·</span>
          <span style={s.metaDate}>Updated March 2026</span>
        </div>
      </div>

      {/* ARTICLE WRAP — two col */}
      <div style={s.wrap}>

        {/* LEFT — body */}
        <div style={s.body}>

          <p style={s.p}>
            Abhishek Leela Pandey — widely known as ALP Sir — is an award-winning entrepreneur,
            mathematician, and polymath whose work bridges ancient logic, social impact, and futuristic
            technology. Known to his students as the <strong>"Number Whisperer"</strong> and the{' '}
            <strong>"GOAT" of entrance prep</strong>, ALP has built a cult following on radical
            transparency and intellectual rigour.
          </p>
          <p style={s.p}>
            He is a rare triple-threat educator — 99.93 percentile in CAT and 770 on the GMAT — who
            personally teaches all three sections of CAT: VARC, DILR, and Quantitative Ability. In an
            industry where faculty are almost universally siloed into a single section, ALP applies a
            unified thinking mindset that treats every exam as a structured system to be decoded, not a
            syllabus to be memorised.
          </p>

          <Divider />

          <h2 style={s.h2}>Credentials at a Glance</h2>
          <div style={{ overflowX:'auto', margin:'1.5rem 0' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:'var(--font-sans)', fontSize:'0.88rem' }}>
              <tbody>
                {CREDENTIALS.map(([key, val], i) => (
                  <tr key={i} style={{ borderBottom:`1px solid ${C.border}`, background: i%2===1 ? C.gray50 : C.white }}>
                    <td style={{ padding:'10px 14px', fontWeight:'600', width:'38%', color:C.black }}>{key}</td>
                    <td style={{ padding:'10px 14px', color:C.gray600 }}>{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {SECTIONS.map((sec, i) => (
            <div key={i}>
              <Divider />
              <h2 style={s.h2}>{sec.title}</h2>
              {sec.body.split('\n\n').map((para, j) => (
                <p key={j} style={s.p}>{para}</p>
              ))}
            </div>
          ))}

          <Divider />

          <h2 style={s.h2}>The 8 Books</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:'1rem', margin:'1.5rem 0' }}>
            {BOOKS.map((book, i) => (
              <div key={i} style={{ border:`1px solid ${C.border}`, borderRadius:'4px', padding:'1.25rem' }}>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', fontWeight:'600', letterSpacing:'0.08em', textTransform:'uppercase', color:C.red, marginBottom:'0.4rem' }}>
                  {book.genre}
                </div>
                <div style={{ fontFamily:'Georgia, serif', fontSize:'0.95rem', fontWeight:'600', color:C.black, lineHeight:'1.3' }}>
                  {book.title}
                </div>
                {book.desc && <p style={{ fontFamily:'Georgia, serif', fontSize:'0.8rem', color:C.gray500, lineHeight:'1.5', marginTop:'0.4rem' }}>{book.desc}</p>}
              </div>
            ))}
          </div>
          <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:C.gray400, marginTop:'0.5rem' }}>
            <a href="https://www.amazon.com/stores/author/B072N5TSR1/allbooks" target="_blank" rel="noreferrer"
              style={{ color:C.red, textDecoration:'none', borderBottom:`1px solid #ffd0d0` }}>
              View all books on Amazon →
            </a>
          </p>

          <Divider />

          <h2 style={s.h2}>Recognition & Press</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:'1px', background:C.border, border:`1px solid ${C.border}`, borderRadius:'4px', overflow:'hidden', margin:'1.5rem 0' }}>
            {RECOGNITION.map((r, i) => (
              <a key={i} href={r.href} target="_blank" rel="noreferrer"
                style={{ background:C.white, padding:'1.75rem', display:'block', textDecoration:'none' }}>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:C.red, marginBottom:'0.5rem' }}>{r.pub}</div>
                <div style={{ fontFamily:'Georgia, serif', fontSize:'1rem', fontWeight:'700', color:C.black, marginBottom:'0.4rem', lineHeight:'1.3' }}>{r.title}</div>
                <p style={{ fontFamily:'Georgia, serif', fontSize:'0.85rem', color:C.gray500, lineHeight:'1.6' }}>{r.body}</p>
                <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:C.red, display:'block', marginTop:'0.75rem' }}>Read feature →</span>
              </a>
            ))}
          </div>

        </div>

        {/* RIGHT — sticky sidebar */}
        <aside style={s.sidebar}>
          {/* Quick stats */}
          <div style={sidebar.box}>
            <p style={sidebar.label}>At a Glance</p>
            {[
              ['99.93%', 'CAT Percentile'],
              ['770',    'GMAT Score'],
              ['27',     'Students per Cohort'],
              ['5,000+', 'IIM Calls Converted'],
              ['8',      'Books Published'],
              ['9',      'Original Theorems'],
            ].map(([val, lbl]) => (
              <div key={lbl} style={sidebar.stat}>
                <span style={sidebar.statVal}>{val}</span>
                <span style={sidebar.statLabel}>{lbl}</span>
              </div>
            ))}
          </div>

          {/* Social */}
          <div style={sidebar.box}>
            <p style={sidebar.label}>Find ALP Sir</p>
            {[
              { label:'X (Twitter)', href:'https://x.com/i_m_alp', handle:'@i_m_alp' },
              { label:'Amazon', href:'https://www.amazon.com/stores/author/B072N5TSR1/allbooks', handle:'All 8 books →' },
              { label:'GRADFLIX', href:'https://gradflix.in', handle:'gradflix.in →' },
            ].map(link => (
              <a key={link.label} href={link.href} target="_blank" rel="noreferrer"
                style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.6rem 0', borderBottom:`1px solid ${C.border}`, textDecoration:'none' }}>
                <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:C.gray600 }}>{link.label}</span>
                <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:C.red, fontWeight:'600' }}>{link.handle}</span>
              </a>
            ))}
          </div>

          {/* CTA */}
          <div style={{ background:C.black, borderRadius:'4px', padding:'2rem' }}>
            <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:C.red, marginBottom:'0.4rem' }}>Learn from ALP Sir</p>
            <p style={{ fontFamily:'Georgia, serif', fontSize:'1.1rem', fontWeight:'700', color:'#fff', lineHeight:'1.25', marginBottom:'0.6rem' }}>Join a GRADSKOOL Cohort</p>
            <p style={{ fontFamily:'Georgia, serif', fontSize:'0.85rem', color:C.gray400, lineHeight:'1.65', marginBottom:'1.25rem' }}>
              Live two-way classes. 27 students only. Every cohort taught personally by ALP Sir.
            </p>
            <Link href="/courses" style={{ display:'block', textAlign:'center', background:C.red, color:'#fff', padding:'0.75rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'700', textDecoration:'none', marginBottom:'0.5rem' }}>
              Explore Courses →
            </Link>
            <a href="https://wa.me/916360597966" target="_blank" rel="noreferrer"
              style={{ display:'block', textAlign:'center', fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:C.gray400, textDecoration:'none' }}>
              💬 WhatsApp Us
            </a>
          </div>
        </aside>

      </div>
    </>
  )
}

function Divider() {
  return <hr style={{ border:'none', borderTop:`1px solid ${C.border}`, margin:'2.5rem 0' }} />
}

const s = {
  articleHeader: {
    maxWidth:'1060px', margin:'0 auto', padding:'3rem 2rem 2.5rem',
    borderBottom:`1px solid ${C.border}`,
  },
  tag:  { fontFamily:'var(--font-sans)', fontSize:'0.7rem', fontWeight:'600', letterSpacing:'0.1em', textTransform:'uppercase', color:C.red, marginBottom:'1rem', display:'block' },
  title:{ fontFamily:'Georgia, serif', fontSize:'clamp(2rem, 4vw, 3rem)', fontWeight:'700', color:C.black, lineHeight:'1.1', marginBottom:'1rem' },
  excerpt:{ fontFamily:'Georgia, serif', fontSize:'1.05rem', color:C.gray500, lineHeight:'1.7', maxWidth:'620px', marginBottom:'1.25rem' },
  meta: { display:'flex', alignItems:'center', gap:'0.5rem' },
  metaAuthor:{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'600', color:C.black },
  metaDot:{ color:C.gray400 },
  metaDate:{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:C.gray400 },
  wrap: { maxWidth:'1060px', margin:'0 auto', padding:'3rem 2rem 5rem', display:'grid', gridTemplateColumns:'1fr 280px', gap:'4rem', alignItems:'start' },
  body: {},
  p:    { fontFamily:'Georgia, serif', fontSize:'1rem', color:C.gray600, lineHeight:'1.85', marginBottom:'1.5rem' },
  h2:   { fontFamily:'Georgia, serif', fontSize:'1.6rem', fontWeight:'700', color:C.black, margin:'2.5rem 0 1rem', lineHeight:'1.2' },
  sidebar:{ position:'sticky', top:'80px', display:'flex', flexDirection:'column', gap:'1.5rem' },
}

const sidebar = {
  box:      { background:C.gray50, border:`1px solid ${C.border}`, borderRadius:'4px', padding:'1.5rem' },
  label:    { fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:C.gray400, marginBottom:'1rem' },
  stat:     { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.6rem 0', borderBottom:`1px solid ${C.border}` },
  statVal:  { fontFamily:'Georgia, serif', fontSize:'1.2rem', fontWeight:'700', color:C.black },
  statLabel:{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', color:C.gray500 },
}

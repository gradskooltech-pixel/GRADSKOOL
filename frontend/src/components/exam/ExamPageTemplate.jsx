import { useState } from 'react'
/**
 * GRADSKOOL — Exam Page Template
 * Shared component used by all exam course pages.
 * Each exam page passes its own static data object.
 *
 * Sections (in order):
 *   Breadcrumb
 *   Hero (headline + meta pills + sticky enrol card)
 *   Stats bar (4 numbers)
 *   What is [Exam]? (overview grid + section cards)
 *   Score/Percentile table (optional)
 *   Eligibility
 *   Key Dates timeline
 *   Curriculum (accordion modules)
 *   How Cohort Works (4 steps)
 *   Plans & Pricing (card grid)
 *   9-Stage Framework
 *   Top Colleges table
 *   Testimonials
 *   FAQs
 *   Also Preparing For
 *   Final CTA
 */
import Head from 'next/head'
import Link from 'next/link'

// ── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  red: '#ff5e5f', black: '#0f0f0f', white: '#ffffff',
  gray50: '#fafaf9', gray100: '#f5f5f3', gray200: '#e8e8e6',
  gray400: '#999', gray500: '#666', gray600: '#555',
  border: '#e8e8e6',
}

// ── NINE STAGES ──────────────────────────────────────────────────────────────
const NINE_STAGES = [
  { num:'01', label:'Video — English',    sub:'Concept overview · Exam relevance',   type:'self' },
  { num:'02', label:'Video — Hindi',      sub:'Same concept · Wider accessibility',  type:'self' },
  { num:'03', label:'Live Concept',       sub:'First-principles · Logic before shortcuts', type:'live' },
  { num:'04', label:'Cheat Sheet',        sub:'Key ideas · Patterns & triggers',     type:'self' },
  { num:'05', label:'Basic Quiz',         sub:'Immediate application · Validation',  type:'live' },
  { num:'06', label:'Practice Live',      sub:'Problem-solving · Speed + confidence',type:'live' },
  { num:'07', label:'Advanced Quiz',      sub:'Exam-level difficulty · Mixed',       type:'live' },
  { num:'08', label:'Session PDFs',       sub:'Class notes · Solved examples',       type:'self' },
  { num:'09', label:'Doubt Resolution',   sub:'No gaps carried forward',             type:'live' },
]

// ── TEMPLATE ─────────────────────────────────────────────────────────────────
export default function ExamPageTemplate({ data, meta }) {
  const [tab,       setTab]     = useState('overview')
  const [openFaq,   setOpenFaq]  = useState(null)
  const [openMod,   setOpenMod]  = useState(0)
  const [formName,  setFormName] = useState('')
  const [formPhone, setFormPhone]= useState('')
  const [formMsg,   setFormMsg]  = useState('')
  const [formSent,  setFormSent] = useState(false)

  const handleEnquiry = (e) => {
    e.preventDefault()
    if (!formName || !formPhone) return
    const msg = `Hi ALP Sir, I want to enquire about ${name}.
Name: ${formName}
Phone: ${formPhone}${formMsg ? '\nMessage: ' + formMsg : ''}`
    const wa = `https://wa.me/916360597966?text=${encodeURIComponent(msg)}`
    window.open(wa, '_blank')
    setFormSent(true)
  }

  const {
    slug, name, tagline, description,
    badge, enrolHref = 'https://wa.me/916360597966',
    heroVideo,
    heroStats, overview_cards, sections,
    scoreTable, eligibility, key_dates, curriculum,
    howSteps, plans, colleges, testimonials, faqs,
    alsoExams, mocksSlug,
    enrolPrice, enrolNote,
  } = data

  // Tab definitions — hide tabs with no content
  const TABS = [
    { id:'overview',    label:'Overview',         show: true },
    { id:'curriculum',  label:'Curriculum',       show: !!(curriculum?.length) },
    { id:'dates',       label:'Dates & Eligibility', show: !!(key_dates?.length || eligibility?.length) },
    { id:'pricing',     label:'Plans & Pricing',  show: !!(plans?.length) },
    { id:'reviews',     label:'Reviews & FAQs',   show: !!(testimonials?.length || faqs?.length) },
    { id:'colleges',    label:'Top Colleges',     show: !!(colleges?.length) },
  ].filter(t => t.show)

  return (
    <>
      <Head>
        <title>{meta?.title || `${name} — GRADSKOOL`}</title>
        <meta name="description" content={meta?.desc || description} />
        {meta?.canonical && <link rel="canonical" href={meta.canonical} />}
      </Head>

      <style>{`
        @media(max-width:900px) {
          .ept-hero-row1, .ept-hero-row2 { grid-template-columns:1fr!important; gap:1.5rem!important; }
          .ept-overview-grid { grid-template-columns:repeat(2,1fr)!important; }
          .ept-sections-grid, .ept-how-grid, .ept-nine-grid, .ept-elig-grid, .ept-plans-grid, .ept-testimonials-grid, .ept-also-grid {
            grid-template-columns:1fr!important;
          }
        }
        @media(max-width:640px) {
          .ept-pad-2rem { padding-left:1.1rem!important; padding-right:1.1rem!important; }
          .ept-section-pad { padding-left:1.1rem!important; padding-right:1.1rem!important; padding-top:3rem!important; padding-bottom:3rem!important; }
          .ept-stats-bar { flex-wrap:wrap!important; }
          .ept-stats-bar > div { flex:1 1 50%!important; border-bottom:1px solid ${C.border}; }
        }
      `}</style>

      {/* ── BREADCRUMB ─────────────────────────────────────────────────────── */}
      <div style={s.breadcrumbWrap} className="ept-pad-2rem">
        <div style={s.breadcrumbInner}>
          <Link href="/" style={s.breadLink}>Home</Link>
          <span style={s.breadSep}>/</span>
          <Link href="/courses" style={s.breadLink}>Courses</Link>
          <span style={s.breadSep}>/</span>
          <span style={{ color: C.black }}>{name}</span>
        </div>
      </div>

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section style={s.heroSection}>
        <div style={s.heroOuter} className="ept-pad-2rem">

          {/* ── ROW 1: Video (left) + Enrol Card (right) ── */}
          <div style={s.heroRow1} className="ept-hero-row1">

            {/* Video */}
            <div style={s.heroVideoWrap}>
              {heroVideo ? (
                <div style={s.videoEmbed}>
                  <iframe
                    src={heroVideo}
                    title={`${name} — Introduction`}
                    style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', border:'none', borderRadius:'4px' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div style={{ ...s.videoEmbed, position:'relative' }}>
                  <div style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', background:'#1a1a1a', borderRadius:'4px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'1rem' }}>
                    <span style={{ fontSize:'3rem' }}>▶</span>
                    <p style={{ fontFamily:'Georgia,serif', fontSize:'1rem', color:'rgba(255,255,255,0.5)' }}>Intro video coming soon</p>
                  </div>
                </div>
              )}
              {mocksSlug && (
                <Link href={`/courses/${mocksSlug}/mocks`}
                  style={{ display:'block', marginTop:'0.75rem', fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:C.gray500, textDecoration:'none', textAlign:'center' }}>
                  🎯 Free mock available → Try before you buy
                </Link>
              )}
            </div>

            {/* Enrol Card */}
            <div style={s.heroRight}>
              <div style={s.enrolCard}>
                <div style={s.enrolCardTop}>
                  {badge && (
                    <span style={{ display:'inline-block', fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:'#22c55e', background:'rgba(34,197,94,0.12)', border:'1px solid rgba(34,197,94,0.3)', padding:'0.2rem 0.6rem', borderRadius:'100px', marginBottom:'0.875rem' }}>
                      {badge}
                    </span>
                  )}
                  {enrolPrice && (
                    <>
                      <p style={s.enrolLabel}>Live Programme</p>
                      <div style={s.enrolPrice}>
                        <span style={s.enrolCurrency}>₹</span>
                        <span style={s.enrolAmount}>{enrolPrice}</span>
                        <span style={s.enrolGst}>incl. GST</span>
                      </div>
                      {enrolNote && <p style={s.enrolNote}>{enrolNote}</p>}
                    </>
                  )}
                  <a href={enrolHref} target="_blank" rel="noreferrer" style={s.enrolBtn}>
                    Enrol / Enquire →
                  </a>
                  <p style={s.enrolSeats}>Seats are limited to 27 per cohort.</p>
                </div>
                <div style={s.enrolFeatures}>
                  {(data.enrolFeatures || [
                    'Live two-way sessions with ALP Sir',
                    'Daily structured practice sets',
                    'Full-length mocks + analysis',
                    'Post-test strategic analysis',
                    'Recorded session access',
                    'Doubt resolution every session',
                  ]).map((f, i) => (
                    <div key={i} style={s.enrolFeature}>
                      <span style={s.enrolCheck}>✓</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── ROW 2: Headline (left) + Contact Form (right) ── */}
          <div style={s.heroRow2} className="ept-hero-row2">

            {/* Left — headline + tagline + stats */}
            <div style={s.heroLeft}>
              <h1 style={s.heroTitle}>{name}</h1>
              <p style={s.heroTagline}>{tagline}</p>
              <p style={s.heroDesc}>{description}</p>
              {heroStats && (
                <div style={s.heroPills}>
                  {(heroStats||[]).map(([val, lbl]) => (
                    <div key={lbl} style={s.heroPill}>
                      <span style={s.heroPillVal}>{val}</span>
                      <span style={s.heroPillLbl}>{lbl}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={s.heroActions}>
                <a href={enrolHref} target="_blank" rel="noreferrer" style={s.heroBtnPrimary}>
                  Enrol Now →
                </a>
                <button onClick={() => setTab('curriculum')} style={s.heroBtnSecondary}>
                  View Curriculum ↓
                </button>
              </div>
            </div>

            {/* Right — Contact / Enquiry form */}
            <div style={s.contactFormWrap}>
              <div style={s.contactForm}>
                {formSent ? (
                  <div style={{ padding:'2rem', textAlign:'center' }}>
                    <div style={{ fontSize:'2.5rem', marginBottom:'0.75rem' }}>✓</div>
                    <p style={{ fontFamily:'Georgia,serif', fontSize:'1.1rem', fontWeight:'700', color:C.black, marginBottom:'0.375rem' }}>Opening WhatsApp…</p>
                    <p style={{ fontFamily:'Georgia,serif', fontSize:'0.875rem', color:C.gray500, lineHeight:'1.65' }}>
                      Your enquiry has been sent to ALP Sir on WhatsApp.
                    </p>
                    <button onClick={() => setFormSent(false)}
                      style={{ marginTop:'1rem', fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:C.red, background:'none', border:'none', cursor:'pointer' }}>
                      Send another →
                    </button>
                  </div>
                ) : (
                  <>
                    <p style={{ fontFamily:'Georgia,serif', fontSize:'1.05rem', fontWeight:'700', color:C.black, marginBottom:'0.25rem' }}>
                      Enquire about {name}
                    </p>
                    <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:C.gray400, marginBottom:'1.25rem' }}>
                      ALP Sir responds personally on WhatsApp.
                    </p>
                    <form onSubmit={handleEnquiry} style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                      <input
                        value={formName} onChange={e => setFormName(e.target.value)}
                        placeholder="Your name *"
                        required
                        style={s.formInput}
                      />
                      <input
                        value={formPhone} onChange={e => setFormPhone(e.target.value)}
                        placeholder="Phone number *"
                        required type="tel"
                        style={s.formInput}
                      />
                      <textarea
                        value={formMsg} onChange={e => setFormMsg(e.target.value)}
                        placeholder={`Any specific question about ${name}? (optional)`}
                        rows={3}
                        style={{ ...s.formInput, resize:'vertical', minHeight:'72px' }}
                      />
                      <button type="submit" style={s.formBtn}>
                        Send Enquiry on WhatsApp →
                      </button>
                      <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', color:C.gray400, textAlign:'center' }}>
                        No spam. Direct message to ALP Sir.
                      </p>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── STATS BAR ──────────────────────────────────────────────────────── */}
      {heroStats && (
        <div style={s.statsBar} className="ept-stats-bar">
          {(heroStats||[]).map(([val, lbl]) => (
            <div key={lbl} style={s.statItem}>
              <span style={s.statVal}>{val}</span>
              <span style={s.statLbl}>{lbl}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── ABOVE THE FOLD — Quick facts shown before tabs ─────────────── */}
      <div style={{ background:'#fff', borderBottom:`1px solid ${C.border}`, padding:'3rem 2rem' }} className="ept-section-pad">
        <div style={s.container}>

          {/* Overview cards — exam pattern at a glance */}
          {overview_cards?.length > 0 && (
            <div style={{ marginBottom:'2.5rem' }}>
              <p style={{ ...s.eyebrow, marginBottom:'1rem' }}>Exam at a Glance</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1px', background:C.border, border:`1px solid ${C.border}`, borderRadius:'4px', overflow:'hidden' }} className="ept-overview-grid">
                {(overview_cards||[]).slice(0,8).map((card, i) => (
                  <div key={i} style={{ background:'#fff', padding:'1rem 1.25rem' }}>
                    <div style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', letterSpacing:'0.08em', textTransform:'uppercase', color:C.gray400, marginBottom:'0.2rem' }}>{card.label}</div>
                    <div style={{ fontFamily:'Georgia,serif', fontSize:'0.95rem', fontWeight:'700', color:C.black, lineHeight:'1.3' }}>{card.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section pills — what the exam tests */}
          {sections?.length > 0 && (
            <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap', alignItems:'flex-start' }}>
              <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:C.gray400, paddingTop:'0.2rem', flexShrink:0 }}>
                Sections
              </p>
              <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
                {(sections||[]).map((sec, i) => (
                  <div key={i} style={{ background:'#fafaf9', border:`1px solid ${C.border}`, borderRadius:'4px', padding:'0.625rem 1rem' }}>
                    <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'700', color:C.black, marginBottom:'0.15rem' }}>{sec.name}</p>
                    {sec.badge && (
                      <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', color:C.gray400 }}>{sec.badge}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── STICKY TABS ──────────────────────────────────────────────────── */}
      <div style={s.tabsBar} className="ept-pad-2rem">
        <div style={s.tabsInner}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                ...s.tabBtn,
                ...(tab === t.id ? s.tabBtnActive : {}),
              }}>
              {t.label}
            </button>
          ))}
        </div>
        {/* Quick enrol button in tab bar */}
        <a href={enrolHref} target="_blank" rel="noreferrer" style={s.tabEnrolBtn}>
          Enrol →
        </a>
      </div>

      {/* ── TAB CONTENT ──────────────────────────────────────────────────── */}

      {/* OVERVIEW TAB */}
      {tab === 'overview' && (
        <div>
          {/* ── WHAT IS [EXAM] ──────────────────────────────────────────────────── */}
      <section style={s.section} className="ept-section-pad">
        <div style={s.container}>
          <p style={s.eyebrow}>About the Exam</p>
          <h2 style={s.sectionTitle}>What is {name.split(' ')[0]}?</h2>
          <p style={s.sectionDesc}>{description}</p>

          {/* Overview cards shown above tabs — not repeated here */}

          {/* Section cards */}
          {sections?.length > 0 && (
            <div style={s.sectionsGrid} className="ept-sections-grid">
              {(sections||[]).map((sec, i) => (
                <div key={i} style={s.sectionCard}>
                  <p style={s.sectionCardNum}>{sec.num}</p>
                  <h3 style={s.sectionCardTitle}>{sec.name}</h3>
                  {sec.badge && (
                    <span style={s.sectionCardBadge}>{sec.badge}</span>
                  )}
                  <div style={s.sectionCardPills}>
                    {sec.pills?.map(p => (
                      <span key={p} style={s.sectionPill}>{p}</span>
                    ))}
                  </div>
                  <ul style={s.sectionTopics}>
                    {sec.topics?.map((t, j) => (
                      <li key={j} style={s.sectionTopic}>
                        <span style={s.topicDash}>—</span>{t}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

          {/* ── SCORE / PERCENTILE TABLE (optional) ────────────────────────────── */}
      {scoreTable && (
        <section style={{ ...s.section, background: C.gray50, borderTop: `1px solid ${C.border}` }} className="ept-section-pad">
          <div style={s.container}>
            <p style={s.eyebrow}>{scoreTable.label || 'Score to Percentile'}</p>
            <h2 style={s.sectionTitle}>{scoreTable.title}</h2>
            {scoreTable.note && <p style={{ ...s.sectionDesc, marginBottom:'2rem' }}>{scoreTable.note}</p>}
            <div style={{ overflowX:'auto' }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    {(scoreTable?.headers||[]).map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(scoreTable?.rows||[]).map((row, i) => (
                    <tr key={i} style={{ background: i%2===0 ? C.white : C.gray50 }}>
                      {(row||[]).map((cell, j) => (
                        <td key={j} style={{ ...s.td, fontWeight: j===0?'700':'400', color: j===0?C.red:C.gray600 }}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {scoreTable.footer && (
              <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', color:C.gray400, marginTop:'1rem' }}>
                {scoreTable.footer}
              </p>
            )}
          </div>
        </section>
      )}

          {/* ── HOW COHORT WORKS ───────────────────────────────────────────────── */}
      {howSteps?.length > 0 && (
        <section style={{ ...s.section, background:C.black, borderTop:`1px solid #1a1a1a` }} className="ept-section-pad">
          <div style={s.container}>
            <p style={{ ...s.eyebrow, color:C.red }}>The Process</p>
            <h2 style={{ ...s.sectionTitle, color:'#fff' }}>How a GRADSKOOL Cohort Works</h2>
            <p style={{ fontFamily:'Georgia,serif', fontSize:'1rem', color:C.gray400, maxWidth:'560px', marginBottom:'3rem', lineHeight:'1.75' }}>
              Every week follows the same proven rhythm — so nothing falls through the cracks.
            </p>
            <div style={s.howGrid} className="ept-how-grid">
              {(howSteps||[]).map((step, i) => (
                <div key={i} style={s.howCard}>
                  <span style={s.howNum}>{step.num}</span>
                  <h3 style={s.howTitle}>{step.title}</h3>
                  <p style={s.howBody}>{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

          {/* ── 9-STAGE FRAMEWORK ──────────────────────────────────────────────── */}
      <section style={{ ...s.section, background:C.gray50, borderTop:`1px solid ${C.border}` }} className="ept-section-pad">
        <div style={s.container}>
          <p style={s.eyebrow}>How We Teach</p>
          <h2 style={s.sectionTitle}>The 9-Stage Learning Framework</h2>
          <p style={s.sectionDesc}>
            At GRADSKOOL, every topic follows a structured 9-stage loop — from first introduction to zero-doubt mastery. No step is skipped. No concept is left half-understood.
          </p>
          <div style={s.nineGrid} className="ept-nine-grid">
            {NINE_STAGES.map((st, i) => (
              <div key={i} style={{ ...s.nineCard, borderColor: st.type==='live' ? C.red : C.border }}>
                <span style={{ ...s.nineNum, color: st.type==='live' ? C.red : C.gray400 }}>{st.num}</span>
                <p style={s.nineLabel}>{st.label}</p>
                <p style={s.nineSub}>{st.sub}</p>
                <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.6rem', fontWeight:'700', letterSpacing:'0.08em', textTransform:'uppercase', color: st.type==='live' ? C.red : C.gray400 }}>
                  {st.type==='live' ? 'Live' : 'Self-Paced'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
        </div>
      )}

      {/* CURRICULUM TAB */}
      {tab === 'curriculum' && (
        <div>
          {/* ── CURRICULUM ─────────────────────────────────────────────────────── */}
      {curriculum?.length > 0 && (
        <section style={{ ...s.section, borderTop:`1px solid ${C.border}` }} className="ept-section-pad" id="curriculum">
          <div style={s.container}>
            <p style={s.eyebrow}>What You'll Learn</p>
            <h2 style={s.sectionTitle}>Course Curriculum</h2>
            <p style={s.sectionDesc}>
              Every module is sequenced to build from foundations to exam-day mastery — with no gaps and no filler.
            </p>
            <div style={s.curriculumList}>
              {(curriculum||[]).map((mod, i) => (
                <div key={i} style={{ ...s.moduleCard, borderColor: openMod===i ? C.red : C.border }}>
                  <button onClick={() => setOpenMod(openMod===i ? -1 : i)} style={s.moduleBtn}>
                    <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
                      <span style={s.moduleNum}>{mod.num}</span>
                      <span style={s.moduleTitle}>{mod.title}</span>
                    </div>
                    <span style={{ color: openMod===i ? C.red : C.gray400, fontSize:'1.2rem', transition:'transform 0.2s', transform: openMod===i?'rotate(45deg)':'none', display:'inline-block' }}>+</span>
                  </button>
                  {openMod===i && (
                    <div style={s.moduleTopics}>
                      {(mod.topics||[]).map((t, j) => (
                        <div key={j} style={s.moduleTopic}>
                          <span style={s.topicDash}>—</span>
                          <span>{t}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
        </div>
      )}

      {/* DATES & ELIGIBILITY TAB */}
      {tab === 'dates' && (
        <div>
          {/* ── ELIGIBILITY ────────────────────────────────────────────────────── */}
      {eligibility?.length > 0 && (
        <section style={{ ...s.section, borderTop:`1px solid ${C.border}` }} className="ept-section-pad">
          <div style={s.container}>
            <p style={s.eyebrow}>Who Can Apply</p>
            <h2 style={s.sectionTitle}>{name.split(' ')[0]} Eligibility Criteria</h2>
            <div style={s.eligGrid} className="ept-elig-grid">
              {(eligibility||[]).map((item, i) => (
                <div key={i} style={s.eligCard}>
                  <span style={s.eligIcon}>{item.icon || '✓'}</span>
                  <div>
                    {item.title && <p style={s.eligTitle}>{item.title}</p>}
                    <p style={s.eligBody}>{item.body || item}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

          {/* ── KEY DATES ──────────────────────────────────────────────────────── */}
      {key_dates?.length > 0 && (
        <section style={{ ...s.section, background:C.gray50, borderTop:`1px solid ${C.border}` }} className="ept-section-pad">
          <div style={s.container}>
            <p style={s.eyebrow}>Plan Your Prep</p>
            <h2 style={s.sectionTitle}>{name.split(' ')[0]} Important Dates</h2>
            <div style={s.timeline}>
              {(key_dates||[]).map((date, i) => (
                <div key={i} style={s.timelineItem}>
                  <div style={s.timelineDate}>
                    <span style={s.timelineMonth}>{date.month}</span>
                    <span style={s.timelineYear}>{date.year}</span>
                  </div>
                  <div style={s.timelineDot} />
                  <div style={s.timelineContent}>
                    <p style={s.timelineEvent}>{date.event}</p>
                    <p style={s.timelineDetail}>{date.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
        </div>
      )}

      {/* PRICING TAB */}
      {tab === 'pricing' && (
        <div>
          {/* ── PLANS & PRICING ────────────────────────────────────────────────── */}
      {plans?.length > 0 && (
        <section style={{ ...s.section, borderTop:`1px solid ${C.border}` }} className="ept-section-pad">
          <div style={s.container}>
            <p style={s.eyebrow}>Plans & Pricing</p>
            <h2 style={s.sectionTitle}>{name.split(' ')[0]} — Plans & Pricing</h2>
            {mocksSlug && (
              <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.875rem', color:C.gray500, marginBottom:'2rem' }}>
                Try before you invest →{' '}
                <Link href={`/courses/${mocksSlug}/mocks`} style={{ color:C.red, textDecoration:'none' }}>
                  Attempt a Free {name.split(' ')[0]} Mock ↗
                </Link>
              </p>
            )}
            <div style={{ ...s.plansGrid, gridTemplateColumns: `repeat(${Math.min(plans.length,3)},1fr)` }} className="ept-plans-grid">
              {(plans||[]).map((plan, i) => (
                <div key={i} style={{ ...s.planCard, ...(plan.featured ? s.planFeatured : {}) }}>
                  {plan.badge && (
                    <div style={{ ...s.planBadge, ...(plan.featured ? { background:C.red, color:'#fff' } : {}) }}>
                      {plan.badge}
                    </div>
                  )}
                  <div style={s.planName}>{plan.name}</div>
                  <div style={s.planPriceRow}>
                    <span style={{ ...s.planCurrency, color: plan.featured?C.red:C.gray400 }}>₹</span>
                    <span style={{ ...s.planPrice, color: plan.featured?C.red:C.black }}>{plan.price}</span>
                    <span style={s.planGst}>incl. GST</span>
                  </div>
                  {plan.note && <p style={s.planNote}>{plan.note}</p>}
                  <div style={s.planFeatures}>
                    {plan.features?.map((f, j) => (
                      <div key={j} style={{ ...s.planFeature, opacity: f.ok ? 1 : 0.4 }}>
                        <span style={{ color: f.ok ? '#22c55e' : C.gray400, flexShrink:0 }}>{f.ok?'✓':'✕'}</span>
                        <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', color: plan.featured?'rgba(255,255,255,0.85)':C.gray600 }}>{f.t}</span>
                      </div>
                    ))}
                  </div>
                  <a href={enrolHref} target="_blank" rel="noreferrer"
                    style={{ ...s.planBtn, ...(plan.featured ? { background:C.red } : { background:C.black }) }}>
                    Enrol Now →
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
        </div>
      )}

      {/* REVIEWS & FAQS TAB */}
      {tab === 'reviews' && (
        <div>
          {/* ── TESTIMONIALS ───────────────────────────────────────────────────── */}
      {testimonials?.length > 0 && (
        <section style={{ ...s.section, background:C.gray50, borderTop:`1px solid ${C.border}` }} className="ept-section-pad">
          <div style={s.container}>
            <p style={s.eyebrow}>Student Voices</p>
            <h2 style={s.sectionTitle}>What Students Say</h2>
            <div style={s.testimonialsGrid} className="ept-testimonials-grid">
              {(testimonials||[]).map((t, i) => (
                <div key={i} style={s.testimonialCard}>
                  <p style={s.testimonialQuote}>&ldquo;{t.text}&rdquo;</p>
                  <div style={s.testimonialFooter}>
                    <p style={s.testimonialName}>{t.name}</p>
                    <p style={s.testimonialDetail}>{t.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

          {/* ── FAQS ───────────────────────────────────────────────────────────── */}
      {faqs?.length > 0 && (
        <section style={{ ...s.section, borderTop:`1px solid ${C.border}` }} className="ept-section-pad">
          <div style={{ maxWidth:'860px', margin:'0 auto', padding:'0 2rem' }} className="ept-pad-2rem">
            <p style={s.eyebrow}>Common Questions</p>
            <h2 style={s.sectionTitle}>{name.split(' ')[0]} Course — FAQs</h2>
            <div style={{ border:`1px solid ${C.border}`, borderRadius:'4px', overflow:'hidden', marginTop:'2rem' }}>
              {(faqs||[]).map((faq, i) => (
                <div key={i} style={{ borderBottom: i<faqs.length-1?`1px solid ${C.border}`:'none' }}>
                  <button onClick={() => setOpenFaq(openFaq===i?null:i)}
                    style={s.faqBtn}>
                    <span style={s.faqQ}>{faq.q}</span>
                    <span style={{ color:C.red, fontSize:'1.2rem', lineHeight:'1', transform:openFaq===i?'rotate(45deg)':'none', transition:'transform 0.25s', display:'inline-block', flexShrink:0 }}>+</span>
                  </button>
                  {openFaq===i && (
                    <div style={s.faqAnswer}>
                      {faq.a.split('\n\n').map((para, j) => (
                        <p key={j} style={s.faqPara}>{para}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
        </div>
      )}

      {/* COLLEGES TAB */}
      {tab === 'colleges' && (
        <div>
          {/* ── COLLEGES ───────────────────────────────────────────────────────── */}
      {colleges?.length > 0 && (
        <section style={{ ...s.section, borderTop:`1px solid ${C.border}` }} className="ept-section-pad">
          <div style={s.container}>
            <p style={s.eyebrow}>Where {name.split(' ')[0]} Takes You</p>
            <h2 style={s.sectionTitle}>Top Colleges — Cutoff & Placements</h2>
            {(colleges||[]).map((group, gi) => (
              <div key={gi} style={{ marginBottom:'2rem' }}>
                {group.label && (
                  <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:C.gray400, marginBottom:'0.875rem' }}>
                    {group.label}
                  </p>
                )}
                <div style={{ overflowX:'auto' }}>
                  <table style={s.table}>
                    <thead>
                      <tr>
                        {(group.headers || ['College','Location','Cutoff','Avg. Package','Fees']).map(h => (
                          <th key={h} style={s.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(group.rows||[]).map((row, ri) => (
                        <tr key={ri} style={{ background: ri%2===0 ? C.white : C.gray50 }}>
                          {(row||[]).map((cell, ci) => (
                            <td key={ci} style={{ ...s.td, fontWeight: ci===0?'600':'400', color: ci===0?C.black:C.gray600 }}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
        </div>
      )}

      {/* ── ALWAYS VISIBLE BOTTOM ────────────────────────────────────────── */}
      {/* ── ALSO PREPARING FOR ─────────────────────────────────────────────── */}
      {alsoExams?.length > 0 && (
        <section style={{ ...s.section, background:C.gray50, borderTop:`1px solid ${C.border}` }} className="ept-section-pad">
          <div style={s.container}>
            <p style={s.eyebrow}>Also Preparing For?</p>
            <h2 style={s.sectionTitle}>More Courses by GRADSKOOL</h2>
            <div style={s.alsoGrid} className="ept-also-grid">
              {(alsoExams||[]).map((ex, i) => (
                <Link key={i} href={`/courses/${ex.slug}`} style={s.alsoCard}>
                  <p style={s.alsoCat}>{ex.cat}</p>
                  <p style={s.alsoShort}>{ex.short}</p>
                  <p style={s.alsoDesc}>{ex.desc}</p>
                  <span style={s.alsoLink}>View {ex.short} Course →</span>
                </Link>
              ))}
              <Link href="/courses" style={{ ...s.alsoCard, background:C.black, borderColor:C.black }}>
                <p style={{ ...s.alsoCat, color:C.gray400 }}>All Exams</p>
                <p style={{ ...s.alsoShort, color:'#fff' }}>View All Courses</p>
                <p style={{ ...s.alsoDesc, color:C.gray400 }}>CAT, GMAT, GRE, IPMAT, XAT, SNAP, NMAT, CMAT, Law UG and CUET.</p>
                <span style={{ ...s.alsoLink, color:C.red }}>Browse All Courses →</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── FINAL CTA ──────────────────────────────────────────────────────── */}
      <section style={{ background:C.red, padding:'5rem 2rem', textAlign:'center' }} className="ept-section-pad">
        <div style={{ maxWidth:'640px', margin:'0 auto' }}>
          <h2 style={{ fontFamily:'Georgia,serif', fontSize:'clamp(1.8rem,3vw,2.5rem)', color:'#fff', fontWeight:'700', lineHeight:'1.15', marginBottom:'0.875rem' }}>
            Only a handful of seats remaining.
          </h2>
          <p style={{ fontFamily:'Georgia,serif', fontSize:'1rem', color:'rgba(255,255,255,0.75)', lineHeight:'1.75', marginBottom:'2rem' }}>
            Once the cohort of 27 is full, the next batch opens only after the current one completes. Don't wait until it's too late.
          </p>
          <a href={enrolHref} target="_blank" rel="noreferrer"
            style={{ display:'inline-block', background:'#fff', color:C.red, padding:'1rem 2.5rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.95rem', fontWeight:'800', textDecoration:'none', letterSpacing:'-0.01em' }}>
            Enrol / Enquire Now →
          </a>
        </div>
      </section>

    </>
  )
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const s = {
  // Breadcrumb
  breadcrumbWrap:  { padding:'0.875rem 2rem', borderBottom:`1px solid ${C.border}`, background:C.white },
  breadcrumbInner: { maxWidth:'1160px', margin:'0 auto', display:'flex', gap:'0.5rem', fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:C.gray400 },
  breadLink:       { color:C.gray400, textDecoration:'none' },
  breadSep:        { color:C.gray200 },

  // Hero — new 2-row layout
  heroSection:    { background:C.white, borderBottom:`1px solid ${C.border}` },
  heroOuter:      { maxWidth:'1200px', margin:'0 auto', padding:'0 2rem' },

  // Row 1: Video + Enrol Card
  heroRow1:       { display:'grid', gridTemplateColumns:'1.3fr 1fr', gap:'2.5rem', alignItems:'start', padding:'3rem 0 2.5rem' },
  heroVideoWrap:  { },
  videoEmbed:     { position:'relative', paddingTop:'56.25%', borderRadius:'4px', overflow:'hidden', background:'#1a1a1a', boxShadow:'0 8px 32px rgba(0,0,0,0.12)' },

  // Row 2: Headline + Contact Form
  heroRow2:       { display:'grid', gridTemplateColumns:'1.3fr 1fr', gap:'2.5rem', alignItems:'start', padding:'2.5rem 0 3.5rem', borderTop:`1px solid ${C.border}` },
  heroLeft:       { },
  heroTitle:      { fontFamily:'Georgia,serif', fontSize:'clamp(2rem,3.5vw,3rem)', fontWeight:'700', color:C.black, lineHeight:'1.1', marginBottom:'0.625rem' },
  heroTagline:    { fontFamily:'Georgia,serif', fontSize:'1.1rem', color:C.red, fontWeight:'600', marginBottom:'0.875rem', lineHeight:'1.4' },
  heroDesc:       { fontFamily:'Georgia,serif', fontSize:'0.95rem', color:C.gray600, lineHeight:'1.8', marginBottom:'1.75rem', maxWidth:'500px' },
  heroPills:      { display:'flex', gap:'0.75rem', marginBottom:'1.75rem', flexWrap:'wrap' },
  heroPill:       { background:C.gray50, border:`1px solid ${C.border}`, borderRadius:'4px', padding:'0.625rem 0.875rem', display:'flex', flexDirection:'column', gap:'0.15rem' },
  heroPillVal:    { fontFamily:'Georgia,serif', fontSize:'1.2rem', fontWeight:'700', color:C.black, lineHeight:'1' },
  heroPillLbl:    { fontFamily:'var(--font-sans)', fontSize:'0.65rem', color:C.gray400, letterSpacing:'0.04em' },
  heroActions:    { display:'flex', gap:'1rem', flexWrap:'wrap' },
  heroBtnPrimary: { display:'inline-block', background:C.red, color:'#fff', padding:'0.875rem 2rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.9rem', fontWeight:'700', textDecoration:'none' },
  heroBtnSecondary:{ display:'inline-flex', alignItems:'center', color:C.black, padding:'0.875rem 1.5rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.9rem', fontWeight:'600', background:'none', border:`1px solid ${C.border}`, cursor:'pointer' },
  heroMocksLink:  { fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:C.gray500, textDecoration:'none', borderBottom:`1px solid ${C.border}`, paddingBottom:'1px' },
  heroBadge:      { display:'inline-block', fontFamily:'var(--font-sans)', fontSize:'0.7rem', fontWeight:'700', letterSpacing:'0.12em', textTransform:'uppercase', color:C.red, background:'#fff0f0', border:`1px solid #ffd0d0`, padding:'0.25rem 0.75rem', borderRadius:'100px', marginBottom:'1.25rem' },

  // Enrol card (in Row 1)
  heroRight:      { },
  enrolCard:      { border:`1px solid ${C.border}`, borderRadius:'4px', overflow:'hidden', boxShadow:'0 4px 24px rgba(0,0,0,0.08)' },
  enrolCardTop:   { background:C.black, padding:'1.75rem' },
  enrolLabel:     { fontFamily:'var(--font-sans)', fontSize:'0.7rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:C.gray400, marginBottom:'0.5rem' },
  enrolPrice:     { display:'flex', alignItems:'baseline', gap:'0.25rem', marginBottom:'0.5rem' },
  enrolCurrency:  { fontFamily:'Georgia,serif', fontSize:'1.5rem', color:'#fff' },
  enrolAmount:    { fontFamily:'Georgia,serif', fontSize:'2.5rem', fontWeight:'700', color:'#fff', lineHeight:'1' },
  enrolGst:       { fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:C.gray400 },
  enrolNote:      { fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:C.gray400, marginBottom:'1.25rem', lineHeight:'1.5' },
  enrolBtn:       { display:'block', background:C.red, color:'#fff', textAlign:'center', padding:'0.875rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.9rem', fontWeight:'700', textDecoration:'none', marginBottom:'0.75rem' },
  enrolSeats:     { fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:C.gray400, textAlign:'center' },
  enrolFeatures:  { padding:'1.25rem', display:'flex', flexDirection:'column', gap:'0.5rem', background:C.white },
  enrolFeature:   { display:'flex', gap:'0.5rem', alignItems:'flex-start', fontFamily:'var(--font-sans)', fontSize:'0.8rem', color:C.gray600 },
  enrolCheck:     { color:'#22c55e', flexShrink:0, fontWeight:'700' },

  // Contact form (in Row 2)
  contactFormWrap:{ },
  contactForm:    { border:`1px solid ${C.border}`, borderRadius:'4px', padding:'1.75rem', background:'#fff', boxShadow:'0 2px 12px rgba(0,0,0,0.04)' },
  formInput:      { width:'100%', padding:'0.7rem 0.875rem', fontFamily:'var(--font-sans)', fontSize:'0.875rem', border:`1px solid ${C.border}`, borderRadius:'3px', outline:'none', boxSizing:'border-box', color:C.black },
  formBtn:        { width:'100%', background:C.red, color:'#fff', border:'none', padding:'0.875rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.9rem', fontWeight:'700', cursor:'pointer' },

  // Tab bar
  tabsBar:      { position:'sticky', top:0, zIndex:100, background:'#fff', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 2rem' },
  tabsInner:    { display:'flex', gap:0, overflowX:'auto' },
  tabBtn:       { fontFamily:'var(--font-sans)', fontSize:'0.85rem', fontWeight:'500', color:C.gray400, background:'none', border:'none', borderBottom:'2px solid transparent', padding:'0.875rem 1.25rem', cursor:'pointer', whiteSpace:'nowrap', transition:'all 0.15s', marginBottom:'-1px' },
  tabBtnActive: { color:C.black, borderBottomColor:C.red, fontWeight:'600' },
  tabEnrolBtn:  { display:'inline-block', background:C.red, color:'#fff', padding:'0.5rem 1.25rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', textDecoration:'none', whiteSpace:'nowrap', flexShrink:0 },

  // Stats bar
  statsBar:   { display:'flex', borderBottom:`1px solid ${C.border}`, background:C.gray50 },
  statItem:   { flex:1, padding:'1.5rem 2rem', borderRight:`1px solid ${C.border}`, display:'flex', flexDirection:'column', gap:'0.25rem', alignItems:'center', textAlign:'center' },
  statVal:    { fontFamily:'Georgia,serif', fontSize:'1.75rem', fontWeight:'700', color:C.black, lineHeight:'1' },
  statLbl:    { fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:C.gray400, letterSpacing:'0.04em' },

  // Shared section
  section:    { padding:'5rem 2rem', background:C.white },
  container:  { maxWidth:'1160px', margin:'0 auto' },
  eyebrow:    { fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'700', letterSpacing:'0.12em', textTransform:'uppercase', color:C.red, marginBottom:'0.5rem' },
  sectionTitle:{ fontFamily:'Georgia,serif', fontSize:'clamp(1.8rem,3vw,2.6rem)', fontWeight:'700', color:C.black, lineHeight:'1.15', marginBottom:'0.875rem' },
  sectionDesc: { fontFamily:'Georgia,serif', fontSize:'1rem', color:C.gray500, lineHeight:'1.8', maxWidth:'600px', marginBottom:'2.5rem' },

  // Overview grid
  overviewGrid: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1px', background:C.border, border:`1px solid ${C.border}`, borderRadius:'4px', overflow:'hidden', marginBottom:'3rem' },
  overviewCard: { background:C.white, padding:'1.25rem 1.5rem', display:'flex', flexDirection:'column', gap:'0.25rem' },
  overviewLabel:{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:C.gray400 },
  overviewValue:{ fontFamily:'Georgia,serif', fontSize:'1rem', fontWeight:'700', color:C.black, lineHeight:'1.3' },

  // Section cards
  sectionsGrid: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1.25rem', marginTop:'1rem' },
  sectionCard:  { border:`1px solid ${C.border}`, borderRadius:'4px', padding:'1.75rem', background:C.white },
  sectionCardNum:{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', letterSpacing:'0.12em', textTransform:'uppercase', color:C.red, marginBottom:'0.5rem' },
  sectionCardTitle:{ fontFamily:'Georgia,serif', fontSize:'1.1rem', fontWeight:'700', color:C.black, lineHeight:'1.3', marginBottom:'0.5rem' },
  sectionCardBadge:{ display:'inline-block', fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', color:'#166534', background:'#f0fdf4', border:'1px solid #86efac', padding:'0.1rem 0.5rem', borderRadius:'100px', marginBottom:'0.75rem' },
  sectionCardPills:{ display:'flex', flexWrap:'wrap', gap:'0.4rem', marginBottom:'1rem' },
  sectionPill: { fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:C.gray500, background:C.gray50, border:`1px solid ${C.border}`, padding:'0.2rem 0.6rem', borderRadius:'100px' },
  sectionTopics:{ listStyle:'none', display:'flex', flexDirection:'column', gap:'0.3rem' },
  sectionTopic: { display:'flex', gap:'0.5rem', fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:C.gray600 },
  topicDash:   { color:C.red, flexShrink:0 },

  // Score table
  table: { width:'100%', borderCollapse:'collapse', fontFamily:'var(--font-sans)', fontSize:'0.875rem' },
  th:    { padding:'0.75rem 1rem', fontFamily:'var(--font-sans)', fontSize:'0.68rem', fontWeight:'700', letterSpacing:'0.08em', textTransform:'uppercase', color:'#fff', background:'#2d3748', textAlign:'left' },
  td:    { padding:'0.75rem 1rem', borderBottom:`1px solid ${C.border}`, color:C.gray600 },

  // Eligibility
  eligGrid: { display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'1.25rem', marginTop:'1rem' },
  eligCard: { display:'flex', gap:'1rem', padding:'1.5rem', background:C.gray50, border:`1px solid ${C.border}`, borderRadius:'4px', alignItems:'flex-start' },
  eligIcon: { fontSize:'1.5rem', flexShrink:0 },
  eligTitle:{ fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'700', color:C.black, marginBottom:'0.25rem' },
  eligBody: { fontFamily:'Georgia,serif', fontSize:'0.875rem', color:C.gray600, lineHeight:'1.65' },

  // Key dates
  timeline: { display:'flex', flexDirection:'column', gap:0, marginTop:'1rem' },
  timelineItem: { display:'grid', gridTemplateColumns:'80px 24px 1fr', gap:'1.5rem', paddingBottom:'2rem', alignItems:'start' },
  timelineDate: { display:'flex', flexDirection:'column', gap:'0.1rem', paddingTop:'2px' },
  timelineMonth:{ fontFamily:'var(--font-sans)', fontSize:'0.7rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:C.red },
  timelineYear: { fontFamily:'Georgia,serif', fontSize:'1rem', fontWeight:'700', color:C.black },
  timelineDot:  { width:'10px', height:'10px', borderRadius:'50%', background:C.red, marginTop:'4px', flexShrink:0 },
  timelineContent:{ },
  timelineEvent:{ fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'700', color:C.black, marginBottom:'0.25rem' },
  timelineDetail:{ fontFamily:'Georgia,serif', fontSize:'0.875rem', color:C.gray600, lineHeight:'1.65' },

  // Curriculum
  curriculumList:{ display:'flex', flexDirection:'column', gap:'3px', marginTop:'1rem' },
  moduleCard:    { border:'1px solid', borderRadius:'4px', overflow:'hidden', transition:'border-color 0.2s' },
  moduleBtn:     { width:'100%', background:'none', border:'none', padding:'1.25rem 1.75rem', textAlign:'left', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', gap:'1rem' },
  moduleNum:     { fontFamily:'var(--font-sans)', fontSize:'0.68rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:C.red },
  moduleTitle:   { fontFamily:'Georgia,serif', fontSize:'1.05rem', fontWeight:'700', color:C.black },
  moduleTopics:  { padding:'0 1.75rem 1.5rem', display:'flex', flexDirection:'column', gap:'0.4rem', borderTop:`1px solid ${C.border}` },
  moduleTopic:   { display:'flex', gap:'0.5rem', fontFamily:'var(--font-sans)', fontSize:'0.85rem', color:C.gray600, paddingTop:'0.4rem' },

  // How steps
  howGrid: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1.5rem' },
  howCard: { },
  howNum:  { fontFamily:'Georgia,serif', fontSize:'2.5rem', fontWeight:'700', color:C.red, lineHeight:'1', display:'block', marginBottom:'0.75rem' },
  howTitle:{ fontFamily:'Georgia,serif', fontSize:'1.1rem', fontWeight:'700', color:'#fff', marginBottom:'0.5rem' },
  howBody: { fontFamily:'Georgia,serif', fontSize:'0.875rem', color:C.gray400, lineHeight:'1.75' },

  // Plans
  plansGrid:    { display:'grid', gap:'1.5rem', marginTop:'2rem' },
  planCard:     { border:`1px solid ${C.border}`, borderRadius:'4px', padding:'2rem', display:'flex', flexDirection:'column', gap:'0.75rem' },
  planFeatured: { background:C.black, borderColor:C.black },
  planBadge:    { display:'inline-block', fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', background:C.gray100, color:C.gray500, padding:'0.25rem 0.625rem', borderRadius:'2px' },
  planName:     { fontFamily:'Georgia,serif', fontSize:'1.1rem', fontWeight:'700', color:C.white, lineHeight:'1.2' },
  planPriceRow: { display:'flex', alignItems:'baseline', gap:'0.25rem' },
  planCurrency: { fontFamily:'Georgia,serif', fontSize:'1.1rem' },
  planPrice:    { fontFamily:'Georgia,serif', fontSize:'2rem', fontWeight:'700', lineHeight:'1' },
  planGst:      { fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:C.gray400 },
  planNote:     { fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:C.gray400, lineHeight:'1.5' },
  planFeatures: { display:'flex', flexDirection:'column', gap:'0.5rem', flex:1 },
  planFeature:  { display:'flex', gap:'0.5rem', alignItems:'flex-start' },
  planBtn:      { display:'block', color:'#fff', textAlign:'center', padding:'0.875rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'700', textDecoration:'none', marginTop:'0.5rem' },

  // 9 stages
  nineGrid: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1px', background:C.border, border:`1px solid ${C.border}`, borderRadius:'4px', overflow:'hidden', marginTop:'1rem' },
  nineCard: { background:C.white, padding:'1.5rem', display:'flex', flexDirection:'column', gap:'0.25rem', borderLeft:'3px solid' },
  nineNum:  { fontFamily:'Georgia,serif', fontSize:'1.5rem', fontWeight:'700', lineHeight:'1', marginBottom:'0.25rem' },
  nineLabel:{ fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'700', color:C.black },
  nineSub:  { fontFamily:'var(--font-sans)', fontSize:'0.75rem', color:C.gray400, lineHeight:'1.5', flex:1 },

  // Testimonials
  testimonialsGrid:{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1.5rem', marginTop:'2rem' },
  testimonialCard: { border:`1px solid ${C.border}`, borderRadius:'4px', padding:'2rem', background:C.white, display:'flex', flexDirection:'column', gap:'1.25rem' },
  testimonialQuote:{ fontFamily:'Georgia,serif', fontSize:'0.95rem', color:C.gray600, lineHeight:'1.8', fontStyle:'italic', flex:1 },
  testimonialFooter:{ borderTop:`1px solid ${C.border}`, paddingTop:'1rem' },
  testimonialName: { fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'700', color:C.black },
  testimonialDetail:{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', color:C.red },

  // FAQs
  faqBtn:    { width:'100%', background:'none', border:'none', padding:'1.4rem 1.75rem', textAlign:'left', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', gap:'1rem' },
  faqQ:      { fontFamily:'Georgia,serif', fontSize:'0.95rem', fontWeight:'600', color:C.black, lineHeight:'1.5' },
  faqAnswer: { padding:'0 1.75rem 1.5rem' },
  faqPara:   { fontFamily:'Georgia,serif', fontSize:'0.9rem', color:C.gray600, lineHeight:'1.8', marginBottom:'0.75rem' },

  // Also
  alsoGrid: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1.25rem', marginTop:'2rem' },
  alsoCard: { border:`1px solid ${C.border}`, borderRadius:'4px', padding:'1.75rem', textDecoration:'none', display:'flex', flexDirection:'column', gap:'0.35rem', background:C.white },
  alsoCat:  { fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:C.red },
  alsoShort:{ fontFamily:'Georgia,serif', fontSize:'1.2rem', fontWeight:'700', color:C.black },
  alsoDesc: { fontFamily:'Georgia,serif', fontSize:'0.82rem', color:C.gray500, lineHeight:'1.6', flex:1 },
  alsoLink: { fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:'600', color:C.red, marginTop:'0.5rem' },
}
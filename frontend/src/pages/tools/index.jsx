/**
 * GRADSKOOL — Tools Index Page
 * Route: /tools
 *
 * Matches original static HTML exactly:
 * - Filter tabs: CAT | GMAT | GRE | IPMAT | Law UG | CUET | Other
 * - Each exam shows relevant tools with section labels
 * - GRADFLIX sister property card
 * - Free PDF downloads section
 */
import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'

// ── ALL TOOLS DATA ────────────────────────────────────────────────────────────

const TOOLS_BY_EXAM = {
  CAT: {
    label: 'CAT',
    icon: '📊',
    subtitle: 'Common Admission Test — MBA India',
    courseLink: '/courses/cat',
    hasGradflix: true,
    tools: [
      { slug: 'cat-maths',   name: 'CAT Quantitative Aptitude Tool', section: 'Quantitative Ability', icon: '🔢', desc: 'Topic-wise QA revision covering Arithmetic, Algebra, Geometry, Number Systems and Modern Maths — with concept summaries and practice questions.' },
      { slug: 'rc111',       name: 'RC 111',                          section: 'Verbal Ability',       icon: '📚', desc: '111 Reading Comprehension passages across 23 topic categories — Philosophy, Psychology, History, Business, Science, Arts and more.' },
      { slug: 'rc99',        name: 'RC 99 Passages',                 section: 'Verbal Ability',       icon: '📝', desc: '99 Reading Comprehension passages with questions — classified by category and difficulty. CAT-level practice.' },
      { slug: 'reasoning',   name: 'CAT DILR Practice Tool',          section: 'Logical Reasoning',    icon: '🧩', desc: 'Structured puzzles and DILR sets to build logical reasoning from foundations — seating arrangements, grids, games, data sets and caselets.' },
      { slug: 'cat-grammar',     name: 'CAT Grammar Practice Tool',       section: 'Verbal Ability',       icon: '✏️', desc: 'Grammar concepts and practice questions for CAT — subject-verb agreement, tenses, modifiers, parallelism and more, all in exam context.' },
      { slug: 'rc-lexicon',  name: 'RC Lexicon',                      section: 'Verbal Ability',       icon: '📖', desc: 'Advanced vocabulary encountered in CAT RC passages — words in context, not definitions. Build reading fluency with high-frequency CAT vocabulary.' },
      { slug: 'gre-vocab',   name: 'GRE Vocabulary Tool',             section: 'Vocabulary',           icon: '🔤', desc: 'Context-based vocabulary learning programme — 5,000+ words encountered in CAT, GMAT and GRE passages. Daily word sets with usage examples.' },
      { slug: 'mba-gk',      name: 'MBA GK Practice Tool',            section: 'General Knowledge',    icon: '🌍', desc: 'MBA General Knowledge and current affairs — useful for CAT GDPI rounds, WAT essays and staying sharp on business and economic awareness.' },
    ],
  },
  GMAT: {
    label: 'GMAT',
    icon: '🌍',
    subtitle: 'GMAT Focus Edition — Global MBA',
    courseLink: '/courses/gmat',
    hasGradflix: false,
    tools: [
      { slug: 'rc-lexicon',  name: 'RC Lexicon',                      section: 'Verbal Reasoning',   icon: '📖', desc: 'Advanced vocabulary in passage context — critical for GMAT Critical Reasoning and RC. Builds reading fluency with high-frequency GMAT verbal words.' },
      { slug: 'cat-grammar',     name: 'CAT Grammar Practice Tool',       section: 'Critical Reasoning',  icon: '✏️', desc: 'Grammar and argument structure for GMAT Verbal — sentence correction patterns, logical connectors and reasoning mechanics for Critical Reasoning.' },
      { slug: 'cat-maths',   name: 'CAT Quantitative Aptitude Tool',  section: 'Quantitative',        icon: '🔢', desc: 'QA revision covering Arithmetic, Algebra, Geometry and Number Systems — all tested in GMAT Quant. Concept summaries and timed practice.' },
      { slug: 'gre-vocab',   name: 'GRE Vocabulary Tool',             section: 'Vocabulary',          icon: '🔤', desc: 'Context-based vocabulary programme — words encountered in GMAT Verbal and CR passages. Critical for Text Completion and high-difficulty RC questions.' },
    ],
  },
  GRE: {
    label: 'GRE',
    icon: '🎓',
    subtitle: 'GRE General Test — Masters & PhD Abroad',
    courseLink: '/courses/gre',
    hasGradflix: false,
    tools: [
      { slug: 'reasoning',  name: 'GRE Verbal Practice Tool',        section: 'Full Practice',       icon: '💬', desc: 'Practice questions across all GRE sections — Verbal Reasoning, Quantitative Reasoning — including Text Completion, Sentence Equivalence and RC.' },
      { slug: 'cat-grammar',     name: 'CAT Grammar Practice Tool',       section: 'Verbal Reasoning',    icon: '✏️', desc: 'Grammar for GRE AWA and Verbal — sentence structure, argumentation patterns and writing mechanics for a strong Analytical Writing score.' },
      { slug: 'gre-vocab',   name: 'GRE Vocabulary Tool',             section: 'Vocabulary',          icon: '🔤', desc: '5,000-word GRE vocabulary programme — context-based, not flashcards. Daily word sets built into passages for retention. Critical for GRE Text Completion.' },
      { slug: 'rc-lexicon',  name: 'RC Lexicon',                      section: 'Verbal Reasoning',    icon: '📖', desc: 'Advanced vocabulary in GRE RC passage context — builds the reading fluency and word recognition needed for high-difficulty GRE Verbal sections.' },
    ],
  },
  IPMAT: {
    label: 'IPMAT',
    icon: '📐',
    subtitle: 'IIM Indore / Rohtak — Integrated Programme in Management',
    courseLink: '/courses/ipmat',
    hasGradflix: false,
    tools: [
      { slug: 'rc111',       name: 'RC 111',                          section: 'RC Practice',         icon: '📚', desc: 'CAT and IPMAT-level RC passages — ideal for IPMAT Verbal Ability section preparation. Topic-tagged with answer explanations.' },
      { slug: 'cat-maths',   name: 'CAT Quantitative Aptitude Tool',  section: 'Quantitative',        icon: '🔢', desc: 'All 34 QA topics with formulas, concept notes and practice — covers the full IPMAT QA syllabus including Short Answer question patterns.' },
      { slug: 'cat-grammar',     name: 'CAT Grammar Practice Tool',       section: 'Grammar',             icon: '✏️', desc: 'Complete grammar reference and practice for IPMAT Verbal Ability — sentence correction, fill in the blanks, and usage rules with examples.' },
      { slug: 'rc-lexicon',  name: 'RC Lexicon',                      section: 'Vocabulary',          icon: '📖', desc: 'High-frequency vocabulary for IPMAT Verbal Ability — words in context, not lists. Builds the reading vocabulary needed for RC passages.' },
      { slug: 'gre-vocab',   name: 'GRE Vocabulary Tool',             section: 'Vocabulary Builder',  icon: '🔤', desc: 'GRE and CAT-level vocabulary — works equally well for IPMAT VA. Roots, usage, and contextual meaning for 500+ high-frequency words.' },
    ],
  },
  'Law UG': {
    label: 'Law UG',
    icon: '⚖️',
    subtitle: 'CLAT / AILET — National Law University Admissions',
    courseLink: '/courses/clat',
    hasGradflix: false,
    tools: [
      { slug: 'legal-awareness', name: 'CLAT Legal Reasoning Tool',   section: 'Full Practice',       icon: '⚖️', desc: 'Legal reasoning and awareness questions for CLAT and AILET — principles, passages, legal GK and reasoning patterns that appear in actual exams.' },
      { slug: 'rc99',        name: 'RC 99 Passages',                 section: 'RC Practice',         icon: '📝', desc: '99 Reading Comprehension passages with detailed questions — classified by category and difficulty. Ideal for CLAT English preparation.' },
      { slug: 'rc111',       name: 'RC 111',                          section: 'RC Practice',         icon: '📚', desc: '111 Reading Comprehension passages with questions — CAT-level difficulty, topic-tagged, with answer explanations. The most comprehensive free RC tool available.' },
      { slug: null, href: 'https://gradskool.testfunda.com/TestCentre/law/clat', name: 'CLAT Practice', section: 'Mock Tests', icon: '📋', desc: 'Full-length CLAT-pattern practice sets — English, Current Affairs, Legal Reasoning, Logical Reasoning and Quantitative Techniques in one timed session.' },
      { slug: 'rc-lexicon',  name: 'RC Lexicon',                      section: 'Verbal Ability',      icon: '📖', desc: 'Reading Comprehension vocabulary for CLAT — RC passages in law UG exams are dense and passage-based. This builds the word recognition needed for speed.' },
      { slug: 'cat-grammar',     name: 'CAT Grammar Practice Tool',       section: 'Verbal Ability',      icon: '✏️', desc: 'Grammar for CLAT English section — sentence correction, fill in the blanks, error identification and usage patterns that appear in CLAT and AILET.' },
      { slug: 'gre-vocab',   name: 'GRE Vocabulary Tool',             section: 'Vocabulary',          icon: '🔤', desc: 'Context-based vocabulary programme — builds the reading fluency and word recognition essential for CLAT RC and English sections.' },
      { slug: 'mba-gk',      name: 'MBA GK Practice Tool',            section: 'General Knowledge',   icon: '🌍', desc: 'General Knowledge and current affairs essential for CLAT GK section — covers national affairs, international events, legal GK and static awareness.' },
    ],
  },
  CUET: {
    label: 'CUET',
    icon: '🏛️',
    subtitle: 'Common University Entrance Test — Central Universities',
    courseLink: '/courses/cuet',
    hasGradflix: false,
    tools: [
      { slug: null, href: 'https://gradskool.testfunda.com/TestCentre/cuet-aptitude/cuet-(general-test)', name: 'CUET Practice Tool', section: 'Full Practice', icon: '📋', desc: 'Practice questions across CUET sections — General Test, Language, and Domain Subjects. Covers Reasoning, Quantitative, GK and English in exam format.' },
      { slug: 'cat-grammar',     name: 'CAT Grammar Practice Tool',       section: 'Verbal Ability',      icon: '✏️', desc: 'Grammar for CUET Language section — comprehension, vocabulary, rearrangement and sentence correction patterns that appear in CUET English.' },
      { slug: 'gre-vocab',   name: 'GRE Vocabulary Tool',             section: 'Vocabulary',          icon: '🔤', desc: 'Context-based vocabulary for CUET Language and comprehension sections — builds the reading fluency needed for high scores in the English paper.' },
      { slug: 'rc-lexicon',  name: 'RC Lexicon',                      section: 'Verbal Ability',      icon: '📖', desc: 'Reading Comprehension vocabulary for CUET — passage-based word recognition and inference skills essential for the Language section.' },
      { slug: 'mba-gk',      name: 'MBA GK Practice Tool',            section: 'General Knowledge',   icon: '🌍', desc: 'Current affairs, static GK, and general awareness for CUET General Test — updated regularly with important events, rankings, awards and appointments.' },
    ],
  },
  Other: {
    label: 'Other',
    icon: '🛠️',
    subtitle: 'General Tools — Useful across all exams',
    courseLink: null,
    hasGradflix: false,
    tools: [
      { slug: 'mba-gk',      name: 'MBA GK Practice Tool',            section: 'General Knowledge',   icon: '🌍', desc: 'Current affairs, static GK, awards, appointments, rankings and important events — updated regularly. Useful for CAT, IIFT, SNAP, NMAT and CUET.' },
      { slug: 'gre-vocab',   name: 'GRE Vocabulary Tool',             section: 'Vocabulary',          icon: '🔤', desc: 'Universal vocabulary programme useful across CAT, GMAT, GRE, CLAT and CUET — 5,000+ words in context with daily sets and retention tracking.' },
      { slug: 'cat-grammar',     name: 'CAT Grammar Practice Tool',       section: 'Verbal Ability',      icon: '✏️', desc: 'Comprehensive grammar reference and practice — covering all major grammar rules tested across MBA, law and central university entrance exams.' },
    ],
  },
}

const PDFS = [
  { exam: 'CAT', icon: '📘', name: 'CAT Formula Sheet — QA', desc: 'All important Quantitative Ability formulas for CAT — Arithmetic, Algebra, Geometry, Number Systems and Modern Maths in one printable sheet.', file: '/cat-formula-sheet.pdf' },
  { exam: 'CAT', icon: '📋', name: 'CAT 2026 Preparation Roadmap', desc: 'Month-by-month preparation plan for CAT 2026 — April to November. What to study, when to start mocks, how to approach the final 30 days.', file: '/cat-2026-preparation-roadmap.pdf' },
]

// ── PAGE ──────────────────────────────────────────────────────────────────────

// ── GEN-Z TOOLS PAGE ─────────────────────────────────────────────────────────

const EXAM_TABS = ['CAT', 'GMAT', 'GRE', 'IPMAT', 'Law UG', 'CUET', 'General']

// Colour system per exam — dark, vibrant
const EXAM_COLORS = {
  CAT:     { bg:'#ff5e5f', text:'#fff', dark:'#cc2a2b' },
  GMAT:    { bg:'#3b82f6', text:'#fff', dark:'#1d4ed8' },
  GRE:     { bg:'#8b5cf6', text:'#fff', dark:'#6d28d9' },
  IPMAT:   { bg:'#10b981', text:'#fff', dark:'#059669' },
  'Law UG':{ bg:'#f59e0b', text:'#000', dark:'#d97706' },
  CUET:    { bg:'#ec4899', text:'#fff', dark:'#be185d' },
  General: { bg:'#6b7280', text:'#fff', dark:'#4b5563' },
}

export default function ToolsPage() {
  const [active, setActive] = useState('CAT')
  const col = EXAM_COLORS[active] || EXAM_COLORS.CAT
  const examData = TOOLS_BY_EXAM[active === 'General' ? 'Other' : active === 'Law UG' ? 'CAT' : active]

  // Merge tools for General tab
  const generalTools = Object.values(TOOLS_BY_EXAM)
    .flatMap(e => e.tools)
    .filter((t, i, arr) => arr.findIndex(x => x.slug === t.slug) === i)
    .slice(0, 6)

  const displayTools = active === 'General' ? generalTools : (examData?.tools || [])
  const showGradflix  = active === 'CAT'

  return (
    <>
      <Head>
        <title>Free Tools — GRADSKOOL</title>
        <meta name="description" content="Free CAT, GMAT, GRE, IPMAT practice tools. RC passages, quant, vocab, grammar, DILR, GK — all free, no sign-up required." />
        <link rel="canonical" href="https://gradskool.in/tools" />
      </Head>

      {/* ── HERO — dark, bold ────────────────────────────────────── */}
      <div style={g.hero}>
        <div style={g.heroContainer}>
          <div style={g.heroBadge}>
            <span style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#4ade80', animation:'pulse 2s infinite', flexShrink:0 }} />
            Free · No sign-up required
          </div>
          <h1 style={g.heroTitle}>
            Practice tools.<br />
            <span style={{ color:'rgba(255,255,255,0.4)', fontStyle:'italic', fontWeight:'400' }}>
              Actually free.
            </span>
          </h1>
          <p style={g.heroSub}>
            9 tools. 9,000+ practice questions. CAT, GMAT, GRE, IPMAT, Law UG and CUET.
            Open any tool and start — no account, no paywall, no catch.
          </p>

          {/* Quick stat pills */}
          <div style={g.heroPills}>
            {[
              ['2,178', 'Quant Questions'],
              ['111', 'RC Passages'],
              ['5,000+', 'Vocab Words'],
              ['570', 'Grammar Qs'],
            ].map(([val, lbl]) => (
              <div key={lbl} style={g.heroPill}>
                <span style={g.heroPillVal}>{val}</span>
                <span style={g.heroPillLbl}>{lbl}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── EXAM TABS ─────────────────────────────────────────────── */}
      <div style={g.tabsBar}>
        <div style={g.tabsInner}>
          {EXAM_TABS.map(tab => {
            const c = EXAM_COLORS[tab] || EXAM_COLORS.General
            const isActive = active === tab
            return (
              <button
                key={tab}
                onClick={() => setActive(tab)}
                style={{
                  fontFamily:    'var(--font-sans)',
                  fontSize:      '0.85rem',
                  fontWeight:    isActive ? '700' : '500',
                  padding:       '0.75rem 1.25rem',
                  border:        'none',
                  borderBottom:  isActive ? `3px solid ${c.bg}` : '3px solid transparent',
                  background:    'none',
                  color:         isActive ? c.bg : '#999',
                  cursor:        'pointer',
                  whiteSpace:    'nowrap',
                  transition:    'color 0.15s, border-color 0.15s',
                  marginBottom:  '-1px',
                }}
              >
                {tab}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── EXAM HEADER ───────────────────────────────────────────── */}
      <div style={{ background:'#fff', borderBottom:'1px solid #e8e8e6', padding:'2rem' }}>
        <div style={{ maxWidth:'1160px', margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.3rem' }}>
              <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:col.bg, flexShrink:0 }} />
              <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'700',
                letterSpacing:'0.1em', textTransform:'uppercase', color:col.bg }}>
                {active}
              </span>
            </div>
            <h2 style={{ fontFamily:'Georgia, serif', fontSize:'1.5rem', fontWeight:'700', color:'#0f0f0f' }}>
              {active === 'General' ? 'General Tools — Useful Across All Exams' : `Free Tools for ${active}`}
            </h2>
          </div>
          {examData?.courseLink && (
            <Link href={examData.courseLink} style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem',
              fontWeight:'600', color:col.bg, textDecoration:'none',
              border:`1px solid ${col.bg}`, padding:'0.5rem 1rem', borderRadius:'3px' }}>
              View {active} Course →
            </Link>
          )}
        </div>
      </div>

      {/* ── GRADFLIX CARD (CAT tab) ────────────────────────────────── */}
      {showGradflix && (
        <div style={{ background:'#0f0f0f', borderBottom:'1px solid #1e1e1e', padding:'2rem' }}>
          <div style={{ maxWidth:'1160px', margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'2rem', flexWrap:'wrap' }}>
            <div>
              <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', fontWeight:'700',
                letterSpacing:'0.12em', textTransform:'uppercase', color:col.bg, marginBottom:'0.4rem' }}>
                Sister Property
              </p>
              <h3 style={{ fontFamily:'Georgia, serif', fontSize:'1.75rem', fontWeight:'700', color:'#fff', marginBottom:'0.5rem' }}>GRADFLIX</h3>
              <p style={{ fontFamily:'Georgia, serif', fontSize:'0.9rem', color:'#777', lineHeight:'1.65', maxWidth:'520px' }}>
                A curated reading and writing ecosystem for serious MBA aspirants. Essays, editorials,
                book reviews, business analysis — built by ALP to sharpen comprehension, critical thinking
                and RC performance. 1,034 articles.
              </p>
            </div>
            <a href="https://gradflix.in" target="_blank" rel="noreferrer"
              style={{ background:col.bg, color:'#fff', padding:'0.875rem 1.75rem',
                borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.9rem',
                fontWeight:'700', textDecoration:'none', whiteSpace:'nowrap' }}>
              Visit GRADFLIX ↗
            </a>
          </div>
        </div>
      )}

      {/* ── TOOLS GRID ────────────────────────────────────────────── */}
      <div style={{ background:'#fafaf9', padding:'2.5rem 2rem 4rem' }}>
        <div style={{ maxWidth:'1160px', margin:'0 auto' }}>
          <div style={g.toolsGrid}>
            {displayTools.map(tool => (
              <ToolCard key={tool.slug || tool.name} tool={tool} accent={col.bg} />
            ))}
          </div>
        </div>
      </div>

      {/* ── PDF DOWNLOADS ─────────────────────────────────────────── */}
      <div style={{ background:'#fff', borderTop:'1px solid #e8e8e6', padding:'4rem 2rem' }}>
        <div style={{ maxWidth:'1160px', margin:'0 auto' }}>
          <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'700',
            letterSpacing:'0.12em', textTransform:'uppercase', color:'#ff5e5f', marginBottom:'0.5rem' }}>
            Free Downloads
          </p>
          <h2 style={{ fontFamily:'Georgia, serif', fontSize:'1.75rem', fontWeight:'700',
            color:'#0f0f0f', marginBottom:'0.75rem' }}>Downloadable PDFs</h2>
          <p style={{ fontFamily:'Georgia, serif', fontSize:'0.95rem', color:'#666',
            lineHeight:'1.7', marginBottom:'2rem', maxWidth:'560px' }}>
            Curated study material from GRADSKOOL — free to download and share.
            Each PDF is branded with GRADSKOOL and designed for serious aspirants.
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem' }}>
            {[
              { title:'CAT Formula Sheet', desc:'All QA formulas — Arithmetic, Algebra, Geometry, Modern Maths. 2 pages.' },
              { title:'RC Strategy Guide', desc:'ALP Sir\'s complete RC approach — passage types, question patterns, common traps.' },
              { title:'CAT Vocabulary List', desc:'500 high-frequency words from CAT RC passages — with meanings and usage.' },
            ].map((pdf, i) => (
              <div key={i} style={{ background:'#fafaf9', border:'1px solid #e8e8e6',
                borderRadius:'4px', padding:'1.5rem', display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                <p style={{ fontFamily:'Georgia, serif', fontSize:'0.95rem', fontWeight:'600',
                  color:'#0f0f0f' }}>{pdf.title}</p>
                <p style={{ fontFamily:'Georgia, serif', fontSize:'0.82rem', color:'#666',
                  lineHeight:'1.6', flex:1 }}>{pdf.desc}</p>
                <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:'600',
                  color:'#ff5e5f', marginTop:'0.25rem', cursor:'pointer' }}>Download PDF ↓</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity:1; transform:scale(1); }
          50%       { opacity:0.5; transform:scale(0.85); }
        }
      `}</style>
    </>
  )
}

function ToolCard({ tool, accent }) {
  const [hov, setHov] = useState(false)
  const href = tool.href || `/tools/${tool.slug}`
  const isExt = Boolean(tool.href)

  const inner = (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background:    hov ? '#fff' : '#fff',
        border:        `1px solid ${hov ? accent : '#e8e8e6'}`,
        borderTop:     `3px solid ${hov ? accent : 'transparent'}`,
        borderRadius:  '4px',
        padding:       '1.5rem',
        display:       'flex',
        flexDirection: 'column',
        gap:           '0.5rem',
        boxShadow:     hov ? `0 4px 20px ${accent}18` : 'none',
        transition:    'border-color 0.2s, box-shadow 0.2s, border-top-color 0.2s',
        cursor:        'pointer',
        height:        '100%',
        boxSizing:     'border-box',
      }}
    >
      {/* Section + Free badge */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.62rem', fontWeight:'700',
          letterSpacing:'0.1em', textTransform:'uppercase',
          color: hov ? accent : '#999' }}>
          {tool.section || tool.exam}
        </span>
        <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.6rem', fontWeight:'700',
          letterSpacing:'0.06em', textTransform:'uppercase',
          background:'#f0fdf4', color:'#166534', border:'1px solid #86efac',
          padding:'0.1rem 0.4rem', borderRadius:'100px' }}>
          FREE
        </span>
      </div>

      {/* Name */}
      <h3 style={{ fontFamily:'Georgia, serif', fontSize:'1rem', fontWeight:'700',
        color:'#0f0f0f', lineHeight:'1.3' }}>
        {tool.name}
      </h3>

      {/* Desc */}
      <p style={{ fontFamily:'Georgia, serif', fontSize:'0.82rem', color:'#666',
        lineHeight:'1.65', flex:1 }}>
        {tool.desc}
      </p>

      {/* CTA */}
      <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', marginTop:'0.25rem',
        fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:'600',
        color: hov ? accent : '#ccc', transition:'color 0.2s' }}>
        Open tool {isExt ? '↗' : '→'}
      </div>
    </div>
  )

  return isExt
    ? <a href={href} target="_blank" rel="noreferrer" style={{ textDecoration:'none', display:'block' }}>{inner}</a>
    : <Link href={href} style={{ textDecoration:'none', display:'block' }}>{inner}</Link>
}

const g = {
  hero: { background:'#0f0f0f', padding:'5rem 2rem 4rem', borderBottom:'3px solid #ff5e5f' },
  heroContainer: { maxWidth:'860px', margin:'0 auto' },
  heroBadge: { display:'inline-flex', alignItems:'center', gap:'0.5rem',
    fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'600',
    letterSpacing:'0.08em', textTransform:'uppercase',
    color:'#4ade80', marginBottom:'1.5rem' },
  heroTitle: { fontFamily:'Georgia, serif', fontSize:'clamp(2.5rem, 5vw, 4rem)',
    fontWeight:'700', color:'#fff', lineHeight:'1.08', marginBottom:'1.25rem',
    letterSpacing:'-0.02em' },
  heroSub: { fontFamily:'Georgia, serif', fontSize:'1.05rem', color:'rgba(255,255,255,0.45)',
    lineHeight:'1.75', maxWidth:'540px', marginBottom:'2.5rem' },
  heroPills: { display:'flex', gap:'1rem', flexWrap:'wrap' },
  heroPill: { display:'flex', flexDirection:'column', gap:'0.2rem',
    padding:'0.875rem 1.25rem', background:'#111', border:'1px solid #222',
    borderRadius:'4px' },
  heroPillVal: { fontFamily:'Georgia, serif', fontSize:'1.5rem', fontWeight:'700',
    color:'#fff', lineHeight:'1' },
  heroPillLbl: { fontFamily:'var(--font-sans)', fontSize:'0.68rem',
    color:'#555', letterSpacing:'0.04em' },
  tabsBar: { background:'#fff', borderBottom:'1px solid #e8e8e6',
    position:'sticky', top:0, zIndex:50 },
  tabsInner: { maxWidth:'1160px', margin:'0 auto', padding:'0 2rem',
    display:'flex', overflowX:'auto', gap:0 },
  toolsGrid: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem' },
}

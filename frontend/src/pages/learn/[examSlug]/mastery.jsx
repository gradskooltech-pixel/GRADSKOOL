/**
 * GRADSKOOL — Topic Mastery Map
 * Route: /learn/[examSlug]/mastery
 *
 * Visual grid of all topics across all sections.
 * Green = mastered, amber = in progress, red = not started.
 * Like a skill tree — student sees exactly where they are.
 */
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ProtectedRoute } from '../../../components/auth/ProtectedRoute'
import api from '../../../lib/api'

const C = {
  red:'#ff5e5f', black:'#0f0f0f', white:'#fff',
  bg:'#f7f6f3', border:'#e8e8e6', gray50:'#fafaf9',
  gray400:'#999', gray500:'#666',
  green:'#22c55e', amber:'#f59e0b', slate:'#e2e8f0',
}

const STATUS_CONFIG = {
  completed:   { color:'#16a34a', bg:'#dcfce7', border:'#86efac', icon:'✓', label:'Mastered' },
  in_progress: { color:'#d97706', bg:'#fef3c7', border:'#fcd34d', icon:'◐', label:'In Progress' },
  not_started: { color:'#94a3b8', bg:'#f1f5f9', border:'#e2e8f0', icon:'○', label:'Not Started' },
}

export default function MasteryPage() {
  return <ProtectedRoute><Inner /></ProtectedRoute>
}

function Inner() {
  const router = useRouter()
  const { examSlug } = router.query
  const [data,    setData]   = useState(null)
  const [loading, setLoad]   = useState(true)
  const [view,    setView]   = useState('map') // 'map' | 'list'

  useEffect(() => {
    if (!examSlug) return
    setLoad(true)
    api.get(`/learn/${examSlug}/sections/`)
      .then(async ({ data: d }) => {
        // For each section fetch topics
        const sections = d.sections || []
        const enriched = await Promise.all(sections.map(async sec => {
          try {
            const { data: td } = await api.get(`/learn/${examSlug}/sections/${sec.slug}/topics/`)
            return { ...sec, topics: td.topics || [] }
          } catch {
            return { ...sec, topics: [] }
          }
        }))
        setData({ exam: d.exam, sections: enriched })
      })
      .catch(() => setData(DEMO_DATA))
      .finally(() => setLoad(false))
  }, [examSlug])

  if (loading) return (
    <Shell examSlug={examSlug}>
      <div style={{ textAlign:'center', padding:'4rem', color:C.gray400, fontFamily:'Georgia,serif' }}>Loading mastery map…</div>
    </Shell>
  )

  if (!data) return null

  const allTopics = data.sections.flatMap(s => s.topics || [])
  const mastered  = allTopics.filter(t => t.status === 'completed').length
  const inProg    = allTopics.filter(t => t.status === 'in_progress').length
  const total     = allTopics.length
  const masteryPct = total > 0 ? Math.round((mastered / total) * 100) : 0

  return (
    <Shell examSlug={examSlug}>
      <Head><title>Mastery Map — {examSlug?.toUpperCase()} — GRADSKOOL</title></Head>

      <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'2rem' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'2rem', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <p style={s.eyebrow}>Skill Map</p>
            <h1 style={s.title}>{examSlug?.toUpperCase()} — Topic Mastery</h1>
            <p style={s.sub}>Your progress across all topics. Green = mastered. Complete each video, quiz and cheat sheet to fill the map.</p>
          </div>
          <div style={{ display:'flex', gap:'0.375rem' }}>
            {[['map','Grid'],['list','List']].map(([id,label]) => (
              <button key={id} onClick={() => setView(id)}
                style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', padding:'0.5rem 1rem', border:`1px solid ${C.border}`, borderRadius:'4px', cursor:'pointer',
                  background: view===id ? C.black : C.white, color: view===id ? '#fff' : C.gray500 }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Overall progress ring */}
        <div style={{ display:'flex', gap:'1.5rem', padding:'1.5rem', background:C.white, border:`1px solid ${C.border}`, borderRadius:'8px', marginBottom:'2rem', alignItems:'center', flexWrap:'wrap' }}>
          {/* Big ring */}
          <div style={{ position:'relative', width:'100px', height:'100px', flexShrink:0 }}>
            <svg width="100" height="100" style={{ transform:'rotate(-90deg)' }}>
              <circle cx="50" cy="50" r="40" fill="none" stroke={C.border} strokeWidth="10" />
              <circle cx="50" cy="50" r="40" fill="none" stroke={C.green} strokeWidth="10"
                strokeDasharray={`${2*Math.PI*40}`}
                strokeDashoffset={`${2*Math.PI*40*(1-masteryPct/100)}`}
                strokeLinecap="round"
                style={{ transition:'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center' }}>
              <p style={{ fontFamily:'Georgia,serif', fontSize:'1.25rem', fontWeight:'700', color:C.black, lineHeight:1 }}>{masteryPct}%</p>
              <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.55rem', color:C.gray400 }}>mastered</p>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display:'flex', gap:'2rem', flexWrap:'wrap' }}>
            {[
              ['✓', mastered, 'Mastered', STATUS_CONFIG.completed.color],
              ['◐', inProg, 'In Progress', STATUS_CONFIG.in_progress.color],
              ['○', total-mastered-inProg, 'Not Started', C.gray400],
              ['📚', total, 'Total Topics', C.black],
            ].map(([icon, val, label, color]) => (
              <div key={label} style={{ textAlign:'center' }}>
                <p style={{ fontFamily:'Georgia,serif', fontSize:'1.5rem', fontWeight:'700', color, lineHeight:1 }}>{val}</p>
                <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', color:C.gray400, marginTop:'0.15rem' }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div style={{ marginLeft:'auto', display:'flex', gap:'1rem', flexWrap:'wrap' }}>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <div key={key} style={{ display:'flex', alignItems:'center', gap:'0.375rem' }}>
                <div style={{ width:'12px', height:'12px', borderRadius:'3px', background:cfg.bg, border:`1px solid ${cfg.border}` }} />
                <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', color:C.gray500 }}>{cfg.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Map / List view */}
        {data.sections.map(section => (
          <div key={section.id} style={{ marginBottom:'2.5rem' }}>
            {/* Section header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.875rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.875rem' }}>
                <h2 style={{ fontFamily:'Georgia,serif', fontSize:'1.1rem', fontWeight:'700', color:C.black }}>{section.title}</h2>
                <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.7rem', color:C.gray400 }}>
                  {section.topics?.filter(t=>t.status==='completed').length}/{section.topics?.length} mastered
                </span>
              </div>
              <Link href={`/learn/${examSlug}/${section.slug}`}
                style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', color:C.red, textDecoration:'none', fontWeight:'600' }}>
                Continue →
              </Link>
            </div>

            {/* Section progress bar */}
            <div style={{ height:'4px', background:C.border, borderRadius:'2px', marginBottom:'0.875rem', overflow:'hidden' }}>
              <div style={{
                height:'100%', background:C.green, borderRadius:'2px',
                width:`${section.topics?.length ? Math.round((section.topics.filter(t=>t.status==='completed').length/section.topics.length)*100) : 0}%`,
                transition:'width 0.5s'
              }} />
            </div>

            {/* Grid view */}
            {view === 'map' ? (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:'0.625rem' }}>
                {(section.topics || []).map((topic, idx) => {
                  const cfg = STATUS_CONFIG[topic.status] || STATUS_CONFIG.not_started
                  return (
                    <Link key={topic.id} href={`/learn/${examSlug}/${section.slug}/${topic.slug}`}
                      style={{
                        display:'block', textDecoration:'none',
                        padding:'0.875rem', borderRadius:'6px',
                        background: cfg.bg, border:`1px solid ${cfg.border}`,
                        transition:'all 0.15s',
                      }}
                    >
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.375rem' }}>
                        <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.6rem', fontWeight:'700', color:C.gray400 }}>
                          {String(idx+1).padStart(2,'0')}
                        </span>
                        <span style={{ fontSize:'0.875rem', color:cfg.color }}>{cfg.icon}</span>
                      </div>
                      <p style={{ fontFamily:'Georgia,serif', fontSize:'0.78rem', fontWeight:'600', color:C.black, lineHeight:'1.4',
                        display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden', marginBottom:'0.375rem' }}>
                        {topic.title}
                      </p>
                      {topic.status !== 'not_started' && (
                        <div style={{ height:'3px', background:C.border, borderRadius:'2px', overflow:'hidden' }}>
                          <div style={{ height:'100%', background:cfg.color, borderRadius:'2px', width:`${topic.pct||0}%` }} />
                        </div>
                      )}
                      {topic.best_score && (
                        <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.6rem', color:cfg.color, marginTop:'0.3rem', fontWeight:'700' }}>
                          Quiz: {Math.round(topic.best_score)}%
                        </p>
                      )}
                    </Link>
                  )
                })}
              </div>
            ) : (
              /* List view */
              <div style={{ border:`1px solid ${C.border}`, borderRadius:'6px', overflow:'hidden' }}>
                {(section.topics || []).map((topic, idx) => {
                  const cfg = STATUS_CONFIG[topic.status] || STATUS_CONFIG.not_started
                  return (
                    <Link key={topic.id} href={`/learn/${examSlug}/${section.slug}/${topic.slug}`}
                      style={{
                        display:'flex', alignItems:'center', gap:'1rem', padding:'0.875rem 1.25rem',
                        borderBottom: idx < section.topics.length-1 ? `1px solid ${C.border}` : 'none',
                        background:C.white, textDecoration:'none', transition:'background 0.1s',
                      }}
                    >
                      <div style={{ width:'28px', height:'28px', borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:cfg.bg, border:`1px solid ${cfg.border}` }}>
                        <span style={{ color:cfg.color, fontSize:'0.75rem' }}>{cfg.icon}</span>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontFamily:'Georgia,serif', fontSize:'0.875rem', fontWeight:'600', color:C.black, marginBottom:'0.15rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {topic.title}
                        </p>
                        <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', color:C.gray400 }}>
                          {topic.total_videos||0} videos
                          {topic.best_score ? ` · Quiz: ${Math.round(topic.best_score)}%` : ''}
                        </p>
                      </div>
                      <div style={{ width:'80px', textAlign:'right' }}>
                        <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', fontWeight:'700', color:cfg.color, marginBottom:'0.2rem' }}>{topic.pct||0}%</p>
                        <div style={{ height:'3px', background:C.border, borderRadius:'2px', overflow:'hidden' }}>
                          <div style={{ height:'100%', background:cfg.color, borderRadius:'2px', width:`${topic.pct||0}%` }} />
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </Shell>
  )
}

function Shell({ examSlug, children }) {
  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <div style={s.topbar}>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <Link href="/" style={s.logo}><span style={{ color:C.red }}>GRAD</span>SKOOL</Link>
          <span style={{ color:C.border }}>|</span>
          <Link href={`/learn/${examSlug}`} style={s.navLink}>← {examSlug?.toUpperCase()} Portal</Link>
        </div>
        <Link href="/dashboard" style={{ ...s.navLink, color:C.red, fontWeight:'700' }}>Dashboard →</Link>
      </div>
      {children}
    </div>
  )
}

// Demo data
const DEMO_DATA = {
  exam: { name:'CAT 2026', slug:'cat' },
  sections: [
    {
      id:1, title:'Verbal Ability & Reading Comprehension', short_title:'VARC', slug:'cat-varc',
      topics: [
        { id:1, title:'RC Strategy & Approach', slug:'rc-strategy', status:'completed', pct:100, total_videos:3, best_score:84 },
        { id:2, title:'RC 111 — Timed Practice', slug:'rc111', status:'completed', pct:100, total_videos:4, best_score:76 },
        { id:3, title:'Para-Jumbles', slug:'para-jumbles', status:'in_progress', pct:66, total_videos:3, best_score:60 },
        { id:4, title:'Para-Summary', slug:'para-summary', status:'not_started', pct:0, total_videos:2 },
        { id:5, title:'Odd Sentence Out', slug:'odd-sentence', status:'not_started', pct:0, total_videos:2 },
        { id:6, title:'Vocabulary & RC Lexicon', slug:'vocabulary', status:'not_started', pct:0, total_videos:3 },
        { id:7, title:'Grammar for CAT', slug:'grammar', status:'not_started', pct:0, total_videos:2 },
      ]
    },
    {
      id:2, title:'Data Interpretation & Logical Reasoning', short_title:'DILR', slug:'cat-dilr',
      topics: [
        { id:8, title:'Seating Arrangements', slug:'seating', status:'in_progress', pct:33, total_videos:3 },
        { id:9, title:'Grids & Networks', slug:'grids', status:'not_started', pct:0, total_videos:3 },
        { id:10, title:'Games & Tournaments', slug:'games', status:'not_started', pct:0, total_videos:2 },
        { id:11, title:'DI — Tables', slug:'di-tables', status:'not_started', pct:0, total_videos:3 },
        { id:12, title:'DI — Charts & Caselets', slug:'di-charts', status:'not_started', pct:0, total_videos:3 },
        { id:13, title:'LR — Schedules & Routes', slug:'lr-schedules', status:'not_started', pct:0, total_videos:2 },
        { id:14, title:'Set Selection Strategy', slug:'set-selection', status:'not_started', pct:0, total_videos:2 },
      ]
    },
    {
      id:3, title:'Quantitative Ability', short_title:'QA', slug:'cat-qa',
      topics: [
        { id:15, title:'Arithmetic — Ratios & Percentages', slug:'arithmetic', status:'not_started', pct:0, total_videos:4 },
        { id:16, title:'Arithmetic — Profit & Interest', slug:'profit-interest', status:'not_started', pct:0, total_videos:3 },
        { id:17, title:'Algebra — Equations', slug:'algebra-eq', status:'not_started', pct:0, total_videos:3 },
        { id:18, title:'Algebra — Functions', slug:'algebra-fn', status:'not_started', pct:0, total_videos:2 },
        { id:19, title:'Geometry — Lines & Triangles', slug:'geometry-lines', status:'not_started', pct:0, total_videos:3 },
        { id:20, title:'Geometry — Mensuration', slug:'mensuration', status:'not_started', pct:0, total_videos:3 },
        { id:21, title:'Number Systems', slug:'number-systems', status:'not_started', pct:0, total_videos:3 },
        { id:22, title:'Modern Maths — P&C, Probability', slug:'modern-maths', status:'not_started', pct:0, total_videos:3 },
      ]
    },
  ]
}

const s = {
  topbar:  { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 2rem', height:'56px', background:C.white, borderBottom:`1px solid ${C.border}`, position:'sticky', top:0, zIndex:100 },
  logo:    { fontFamily:'Georgia,serif', fontSize:'1.1rem', fontWeight:'700', textDecoration:'none', color:C.black },
  navLink: { fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:C.gray400, textDecoration:'none' },
  eyebrow: { fontFamily:'var(--font-sans)', fontSize:'0.7rem', fontWeight:'700', letterSpacing:'0.12em', textTransform:'uppercase', color:C.red, marginBottom:'0.375rem' },
  title:   { fontFamily:'Georgia,serif', fontSize:'2rem', fontWeight:'700', color:C.black, marginBottom:'0.5rem' },
  sub:     { fontFamily:'Georgia,serif', fontSize:'0.95rem', color:C.gray400, lineHeight:1.7 },
}

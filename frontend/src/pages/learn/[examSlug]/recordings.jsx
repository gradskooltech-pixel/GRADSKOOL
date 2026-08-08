/**
 * GRADSKOOL — Session Recordings
 * Route: /learn/[examSlug]/recordings
 *
 * All past live sessions organized by section, searchable,
 * with duration, date and topic tags.
 */
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ProtectedRoute } from '../../../components/auth/ProtectedRoute'
import api from '../../../lib/api'

const C = {
  red:'#ff5e5f', black:'#0f0f0f', white:'#fff',
  bg:'#f7f6f3', border:'#e8e8e6',
  gray50:'#fafaf9', gray400:'#999', gray500:'#666',
}

export default function RecordingsPage() {
  return <ProtectedRoute><Inner /></ProtectedRoute>
}

function Inner() {
  const router = useRouter()
  const { examSlug } = router.query
  const [sessions, setSessions] = useState([])
  const [loading,  setLoad]     = useState(true)
  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState('all')

  useEffect(() => {
    if (!examSlug) return
    setLoad(true)
    api.get(`/learn/${examSlug}/recordings/`)
      .then(({ data }) => setSessions(data.sessions || []))
      .catch(() => setSessions(DEMO_SESSIONS))
      .finally(() => setLoad(false))
  }, [examSlug])

  const sections = ['all', ...new Set(sessions.map(s => s.section_slug).filter(Boolean))]

  const filtered = sessions.filter(s => {
    const matchSearch = !search ||
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))
    const matchFilter = filter === 'all' || s.section_slug === filter
    return matchSearch && matchFilter
  })

  // Group by section
  const grouped = {}
  filtered.forEach(s => {
    const key = s.section_title || 'General'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(s)
  })

  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <Head><title>Recordings — {examSlug?.toUpperCase()} — GRADSKOOL</title></Head>

      {/* Topbar */}
      <div style={s.topbar}>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <Link href="/" style={s.logo}><span style={{ color:C.red }}>GRAD</span>SKOOL</Link>
          <span style={{ color:C.border }}>|</span>
          <Link href={`/learn/${examSlug}`} style={s.navLink}>← Back to {examSlug?.toUpperCase()}</Link>
        </div>
        <Link href="/dashboard" style={{ ...s.navLink, color:C.red, fontWeight:'700' }}>Dashboard →</Link>
      </div>

      <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'2rem' }}>
        {/* Header */}
        <div style={{ marginBottom:'2rem' }}>
          <p style={s.eyebrow}>Session Archive</p>
          <h1 style={s.title}>{examSlug?.toUpperCase()} — All Recordings</h1>
          <p style={s.sub}>Every live session recorded and organised by topic. Search or filter by section.</p>
        </div>

        {/* Search + filter */}
        <div style={{ display:'flex', gap:'1rem', marginBottom:'2rem', flexWrap:'wrap' }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search recordings..."
            style={s.searchInput}
          />
          <div style={{ display:'flex', gap:'0.375rem', flexWrap:'wrap' }}>
            {sections.map(sec => (
              <button key={sec} onClick={() => setFilter(sec)}
                style={{ ...s.filterBtn, ...(filter===sec ? s.filterBtnActive : {}) }}>
                {sec === 'all' ? 'All' : sec.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ display:'flex', gap:'2rem', padding:'1rem 1.5rem', background:C.white, border:`1px solid ${C.border}`, borderRadius:'6px', marginBottom:'2rem' }}>
          {[
            ['Total Sessions', sessions.length],
            ['Hours of Content', Math.round(sessions.reduce((a,s) => a + (s.duration_mins||0), 0) / 60) + 'h'],
            ['Sections Covered', new Set(sessions.map(s=>s.section_slug)).size],
            ['This Month', sessions.filter(s => {
              const d = new Date(s.recorded_at)
              const now = new Date()
              return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
            }).length],
          ].map(([label, val]) => (
            <div key={label}>
              <p style={{ fontFamily:'Georgia,serif', fontSize:'1.5rem', fontWeight:'700', color:C.black, lineHeight:1 }}>{val}</p>
              <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', color:C.gray400, marginTop:'0.15rem' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Recordings */}
        {loading ? (
          <div style={{ textAlign:'center', padding:'4rem', color:C.gray400, fontFamily:'Georgia,serif' }}>Loading recordings…</div>
        ) : Object.keys(grouped).length === 0 ? (
          <div style={{ textAlign:'center', padding:'4rem', border:`1px solid ${C.border}`, borderRadius:'6px', background:C.white }}>
            <div style={{ fontSize:'2.5rem', marginBottom:'0.75rem' }}>🎬</div>
            <p style={{ fontFamily:'Georgia,serif', fontSize:'1.1rem', fontWeight:'700', color:C.black, marginBottom:'0.375rem' }}>
              {search ? 'No recordings found' : 'No recordings yet'}
            </p>
            <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.875rem', color:C.gray400 }}>
              {search ? 'Try a different search term.' : 'Recordings appear here after each live session.'}
            </p>
          </div>
        ) : (
          Object.entries(grouped).map(([sectionTitle, recs]) => (
            <div key={sectionTitle} style={{ marginBottom:'2.5rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1rem' }}>
                <h2 style={{ fontFamily:'Georgia,serif', fontSize:'1.1rem', fontWeight:'700', color:C.black }}>{sectionTitle}</h2>
                <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:C.gray400 }}>{recs.length} sessions</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem' }}>
                {recs.map(rec => (
                  <RecordingCard key={rec.id} rec={rec} examSlug={examSlug} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function RecordingCard({ rec, examSlug }) {
  const [hov, setHov] = useState(false)
  const date = rec.recorded_at
    ? new Date(rec.recorded_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
    : 'Date TBD'

  return (
    <a
      href={rec.bunny_video_id ? `/watch/${examSlug}/${rec.bunny_video_id}` : rec.youtube_url || '#'}
      target={rec.youtube_url ? '_blank' : undefined}
      rel="noreferrer"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:'block', textDecoration:'none',
        border:`1px solid ${hov ? C.red : C.border}`,
        borderRadius:'6px', overflow:'hidden', background:C.white,
        boxShadow: hov ? '0 4px 20px rgba(255,94,95,0.12)' : '0 1px 4px rgba(0,0,0,0.04)',
        transition:'all 0.18s',
      }}
    >
      {/* Thumbnail */}
      <div style={{ position:'relative', paddingTop:'56.25%', background:'#1a1a1a' }}>
        {rec.thumbnail_url ? (
          <img src={rec.thumbnail_url} alt={rec.title}
            style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', objectFit:'cover' }} />
        ) : (
          <div style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'0.5rem' }}>
            <div style={{ width:'44px', height:'44px', borderRadius:'50%', background:'rgba(255,94,95,0.9)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem' }}>▶</div>
          </div>
        )}
        {rec.duration_mins && (
          <div style={{ position:'absolute', bottom:'0.5rem', right:'0.5rem', background:'rgba(0,0,0,0.8)', color:'#fff', fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', padding:'0.15rem 0.4rem', borderRadius:'3px' }}>
            {rec.duration_mins}m
          </div>
        )}
        {rec.is_new && (
          <div style={{ position:'absolute', top:'0.5rem', left:'0.5rem', background:C.red, color:'#fff', fontFamily:'var(--font-sans)', fontSize:'0.6rem', fontWeight:'700', padding:'0.15rem 0.5rem', borderRadius:'100px', letterSpacing:'0.05em' }}>
            NEW
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding:'0.875rem' }}>
        <p style={{ fontFamily:'Georgia,serif', fontSize:'0.875rem', fontWeight:'700', color:C.black, lineHeight:'1.4', marginBottom:'0.375rem',
          display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
          {rec.title}
        </p>
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flexWrap:'wrap' }}>
          <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', color:C.gray400 }}>{date}</span>
          {rec.tags?.slice(0,2).map(tag => (
            <span key={tag} style={{ fontFamily:'var(--font-sans)', fontSize:'0.6rem', background:C.gray50, border:`1px solid ${C.border}`, color:C.gray500, padding:'0.1rem 0.4rem', borderRadius:'3px' }}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    </a>
  )
}

// Demo data for testing
const DEMO_SESSIONS = [
  { id:1, title:'RC Strategy — How to Read Passages Faster Without Losing Accuracy', section_slug:'varc', section_title:'VARC', duration_mins:72, recorded_at:'2026-05-10', tags:['RC','Strategy'], bunny_video_id:'demo-1', is_new:true },
  { id:2, title:'Para-Jumbles — The Mandatory Pair Technique', section_slug:'varc', section_title:'VARC', duration_mins:58, recorded_at:'2026-05-08', tags:['Para-Jumbles','VARC'] },
  { id:3, title:'Para-Summary — Finding the Central Idea in 90 Seconds', section_slug:'varc', section_title:'VARC', duration_mins:64, recorded_at:'2026-05-05', tags:['Para-Summary'] },
  { id:4, title:'Seating Arrangements — All 6 Types Solved Live', section_slug:'dilr', section_title:'DILR', duration_mins:88, recorded_at:'2026-05-07', tags:['Seating','DILR'] },
  { id:5, title:'Grid Problems — DI Sets from CAT 2024', section_slug:'dilr', section_title:'DILR', duration_mins:76, recorded_at:'2026-05-03', tags:['Grids','DI'] },
  { id:6, title:'Percentage and Ratio — CAT Level Problems', section_slug:'qa', section_title:'QA', duration_mins:82, recorded_at:'2026-05-06', tags:['Arithmetic','QA'] },
  { id:7, title:'Number Systems — HCF LCM and Remainders', section_slug:'qa', section_title:'QA', duration_mins:69, recorded_at:'2026-05-01', tags:['Numbers','QA'] },
  { id:8, title:'Mock 4 Analysis — Why 90%ilers plateau and how to break through', section_slug:'mocks', section_title:'Mock Tests', duration_mins:95, recorded_at:'2026-05-09', tags:['Mock Analysis','Strategy'], is_new:true },
]

const s = {
  topbar:     { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 2rem', height:'56px', background:C.white, borderBottom:`1px solid ${C.border}`, position:'sticky', top:0, zIndex:100 },
  logo:       { fontFamily:'Georgia,serif', fontSize:'1.1rem', fontWeight:'700', textDecoration:'none', color:C.black },
  navLink:    { fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:C.gray400, textDecoration:'none' },
  eyebrow:    { fontFamily:'var(--font-sans)', fontSize:'0.7rem', fontWeight:'700', letterSpacing:'0.12em', textTransform:'uppercase', color:C.red, marginBottom:'0.375rem' },
  title:      { fontFamily:'Georgia,serif', fontSize:'2rem', fontWeight:'700', color:C.black, marginBottom:'0.5rem' },
  sub:        { fontFamily:'Georgia,serif', fontSize:'0.95rem', color:C.gray400, lineHeight:1.7 },
  searchInput:{ flex:1, minWidth:'220px', padding:'0.625rem 0.875rem', fontFamily:'var(--font-sans)', fontSize:'0.875rem', border:`1px solid ${C.border}`, borderRadius:'4px', outline:'none', color:C.black },
  filterBtn:  { fontFamily:'var(--font-sans)', fontSize:'0.72rem', padding:'0.4rem 0.875rem', border:`1px solid ${C.border}`, borderRadius:'100px', background:C.white, cursor:'pointer', color:C.gray500 },
  filterBtnActive:{ background:C.black, color:C.white, border:`1px solid ${C.black}` },
}

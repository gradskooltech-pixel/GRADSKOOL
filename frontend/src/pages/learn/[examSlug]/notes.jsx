/**
 * GRADSKOOL — Notes & Resources
 * Route: /learn/[examSlug]/notes
 */
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ProtectedRoute } from '../../../components/auth/ProtectedRoute'
import api from '../../../lib/api'

const C = { red:'#ff5e5f', black:'#0f0f0f', white:'#fff', bg:'#f7f6f3', border:'#e8e8e6', gray:'#999', green:'#22c55e', blue:'#3b82f6', amber:'#f59e0b', muted:'#f4f3f0' }

const DEMO = [
  { course:'CAT 2026 Live Cohort', type:'resources', title:'Formula Sheets', items:[
    { title:'Quant Formula Sheet — All Topics', url:'#', type:'pdf' },
    { title:'RC Strategy PDF — ALP Sir Notes', url:'#', type:'pdf' },
    { title:'DILR Shortcuts & Patterns', url:'#', type:'pdf' },
    { title:'Grammar Rules Cheat Sheet', url:'#', type:'pdf' },
  ]},
  { course:'CAT 2026 Live Cohort', type:'notes', title:'Study Notes', items:[
    { title:'Week 1 — Percentages & Ratios Notes', url:'#', type:'pdf' },
    { title:'Week 2 — RC Technique Notes', url:'#', type:'pdf' },
    { title:'Important Formulas — Updated', url:'#', type:'pdf' },
  ]},
]

export default function NotesPage() {
  return <ProtectedRoute><Inner /></ProtectedRoute>
}

function Inner() {
  const router = useRouter()
  const { examSlug } = router.query
  const [data,    setData]    = useState([])
  const [loading, setLoad]    = useState(true)
  const [filter,  setFilter]  = useState('all')

  useEffect(() => {
    if (!examSlug) return
    setLoad(true)
    api.get(`/learn/${examSlug}/notes/`)
      .then(({ data: d }) => setData(d.sections || []))
      .catch(() => setData(DEMO))
      .finally(() => setLoad(false))
  }, [examSlug])

  const filtered = filter === 'all' ? data : data.filter(s => s.type === filter)

  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <Head><title>Notes & Resources — {(examSlug||'').toUpperCase()} — GRADSKOOL</title></Head>
      <div style={{ height:'52px', background:C.white, borderBottom:'1px solid '+C.border, display:'flex', alignItems:'center', padding:'0 1.5rem', gap:'1rem' }}>
        <Link href={`/learn/${examSlug}`} style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', color:C.gray, textDecoration:'none' }}>← {(examSlug||'').toUpperCase()}</Link>
        <span style={{ color:C.border }}>|</span>
        <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', color:C.black }}>Notes & Resources</span>
      </div>

      <div style={{ maxWidth:'800px', margin:'0 auto', padding:'2rem' }}>
        <div style={{ display:'flex', gap:'0.375rem', marginBottom:'1.5rem' }}>
          {[['all','All'],['resources','Formula Sheets'],['notes','Class Notes']].map(([val,label]) => (
            <button key={val} onClick={() => setFilter(val)}
              style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', padding:'0.3rem 0.875rem', border:'1px solid '+(filter===val?C.red:C.border), borderRadius:'100px', background:filter===val?'#fff5f5':C.white, color:filter===val?C.red:C.gray, cursor:'pointer', fontWeight:filter===val?'700':'400' }}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ textAlign:'center', color:C.gray, fontFamily:'Georgia,serif', padding:'4rem' }}>Loading resources…</p>
        ) : !filtered.length ? (
          <div style={{ textAlign:'center', padding:'4rem', background:C.white, border:'1px dashed '+C.border, borderRadius:'8px' }}>
            <p style={{ fontSize:'2.5rem', marginBottom:'0.75rem' }}>📚</p>
            <p style={{ fontFamily:'Georgia,serif', color:C.gray }}>No resources uploaded yet. Check back soon.</p>
          </div>
        ) : filtered.map((section, i) => (
          <div key={i} style={{ background:C.white, border:'1px solid '+C.border, borderRadius:'8px', marginBottom:'1rem', overflow:'hidden' }}>
            <div style={{ padding:'1rem 1.25rem', borderBottom:'1px solid '+C.border, display:'flex', alignItems:'center', gap:'0.75rem', background:section.type==='resources'?'#eff6ff':'#f0fdf4' }}>
              <span style={{ fontSize:'1.1rem' }}>{section.type==='resources'?'📋':'📓'}</span>
              <div>
                <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', color:C.black }}>{section.title}</p>
                <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', color:C.gray }}>{section.course}</p>
              </div>
              <span style={{ marginLeft:'auto', fontFamily:'var(--font-sans)', fontSize:'0.65rem', padding:'0.15rem 0.5rem', borderRadius:'3px', background: section.type==='resources'?'#dbeafe':'#dcfce7', color: section.type==='resources'?'#1d4ed8':'#166534' }}>
                {section.items?.length||0} files
              </span>
            </div>
            <div>
              {section.items?.map((item, j) => (
                <a key={j} href={item.url} target="_blank" rel="noreferrer"
                  style={{ display:'flex', alignItems:'center', gap:'0.875rem', padding:'0.875rem 1.25rem', borderBottom:'1px solid '+C.border, textDecoration:'none', transition:'background 0.1s' }}
                  onMouseEnter={e=>e.currentTarget.style.background=C.muted}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <span style={{ fontSize:'1rem' }}>📄</span>
                  <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:C.black, flex:1 }}>{item.title}</span>
                  <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', fontWeight:'700', color:C.blue }}>Download ↓</span>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

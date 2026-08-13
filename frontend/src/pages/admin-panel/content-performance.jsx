/**
 * GRADSKOOL Admin — Content Performance
 * Route: /admin-panel/content-performance
 * Per video: views, watch%, quiz avg · Per student drill · Search · Section filter
 */
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import api from '../../lib/api'
import { AdminLayout } from '../../components/admin/AdminLayout'

const C = { red:'#ff5e5f', black:'#0f0f0f', white:'#fff', bg:'#f7f6f3', border:'#e8e8e6', gray:'#999', green:'#22c55e', amber:'#f59e0b', blue:'#3b82f6', muted:'#f4f3f0' }
const EXAMS = ['cat','xat','snap','nmat','gmat','gre']

export default function ContentPerformance() {
  const [videos,    setVideos]   = useState([])
  const [exam,      setExam]     = useState('cat')
  const [loading,   setLoad]     = useState(true)
  const [expanded,  setExpanded] = useState(null)
  const [sort,      setSort]     = useState('views')
  const [searchTerm,setSearch]   = useState('')
  const [sectionFilter,setSection]= useState('all')

  const load = () => {
    setLoad(true)
    api.get('/learn/admin/content-performance/?exam=' + exam)
      .then(({ data }) => setVideos(data.videos || []))
      .catch(() => setVideos(DEMO_VIDEOS))
      .finally(() => setLoad(false))
  }
  useEffect(load, [exam])

  const sections = ['all', ...new Set(videos.map(v => v.section).filter(Boolean))]

  const filtered = videos
    .filter(v => {
      const matchSearch  = !searchTerm || v.title.toLowerCase().includes(searchTerm.toLowerCase())
      const matchSection = sectionFilter === 'all' || v.section === sectionFilter
      return matchSearch && matchSection
    })
    .sort((a,b) => {
      if (sort === 'views')      return b.unique_viewers - a.unique_viewers
      if (sort === 'completion') return b.completion_rate - a.completion_rate
      if (sort === 'quiz')       return b.avg_quiz_score - a.avg_quiz_score
      if (sort === 'watch_pct')  return b.avg_watch_pct - a.avg_watch_pct
      return 0
    })

  const csvExport = () => {
    const rows = [['Title','Section','Views','Avg Watch%','Completion%','Avg Quiz'],
      ...filtered.map(v=>[v.title,v.section,v.unique_viewers,v.avg_watch_pct+'%',v.completion_rate+'%',v.avg_quiz_score+'%'])]
    const a = document.createElement('a')
    a.href = 'data:text/csv,' + encodeURIComponent(rows.map(r=>r.join(',')).join('\n'))
    a.download = `content-performance-${exam}.csv`
    a.click()
  }

  const avgOf = key => filtered.length ? Math.round(filtered.reduce((a,v)=>a+v[key],0)/filtered.length) : 0

  return (
    <AdminLayout title="Content Performance">
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <Head><title>Content Performance — Admin — GRADSKOOL</title></Head>

      <div style={{ height:'56px', background:C.white, borderBottom:'1px solid '+C.border, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 1.5rem', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <Link href="/admin-panel" style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', color:C.gray, textDecoration:'none' }}>← Admin</Link>
          <span style={{ color:C.border }}>|</span>
          <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', color:C.black }}>Content Performance</span>
        </div>
        <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
          <select value={exam} onChange={e=>setExam(e.target.value)} style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', padding:'0.3rem 0.5rem', border:'1px solid '+C.border, borderRadius:'4px', background:C.white, cursor:'pointer' }}>
            {EXAMS.map(e=><option key={e} value={e}>{e.toUpperCase()}</option>)}
          </select>
          <select value={sort} onChange={e=>setSort(e.target.value)} style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', padding:'0.3rem 0.5rem', border:'1px solid '+C.border, borderRadius:'4px', background:C.white, cursor:'pointer' }}>
            <option value="views">Sort: Most viewed</option>
            <option value="completion">Sort: Completion</option>
            <option value="quiz">Sort: Quiz score</option>
            <option value="watch_pct">Sort: Watch %</option>
          </select>
          <button onClick={csvExport} style={{ fontFamily:'var(--font-sans)', fontSize:'0.7rem', padding:'0.3rem 0.75rem', border:'1px solid '+C.border, borderRadius:'3px', background:C.white, cursor:'pointer' }}>↓ CSV</button>
        </div>
      </div>

      <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'2rem' }}>
        {/* Summary */}
        {filtered.length > 0 && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
            {[
              ['Videos',     filtered.length, C.blue],
              ['Avg watch',  avgOf('avg_watch_pct')+'%', C.amber],
              ['Avg completion', avgOf('completion_rate')+'%', C.green],
              ['Avg quiz',   avgOf('avg_quiz_score')+'%', C.red],
            ].map(([label,val,color])=>(
              <div key={label} style={{ background:C.white, border:'1px solid '+C.border, borderRadius:'8px', padding:'1rem', textAlign:'center' }}>
                <p style={{ fontFamily:'Georgia,serif', fontSize:'1.5rem', fontWeight:'700', color, lineHeight:1, marginBottom:'0.2rem' }}>{val}</p>
                <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', color:C.gray }}>{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Search + section filter */}
        <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1rem', flexWrap:'wrap', alignItems:'center' }}>
          <input value={searchTerm} onChange={e=>setSearch(e.target.value)} placeholder="Search videos…"
            style={{ flex:'1', minWidth:'200px', padding:'0.5rem 0.75rem', fontFamily:'var(--font-sans)', fontSize:'0.82rem', border:'1px solid '+C.border, borderRadius:'4px', outline:'none' }} />
          <div style={{ display:'flex', gap:'0.375rem', flexWrap:'wrap' }}>
            {sections.map(sec=>(
              <button key={sec} onClick={()=>setSection(sec)}
                style={{ fontFamily:'var(--font-sans)', fontSize:'0.7rem', padding:'0.3rem 0.75rem', border:'1px solid '+(sectionFilter===sec?C.red:C.border), borderRadius:'100px', background:sectionFilter===sec?'#fff5f5':C.white, color:sectionFilter===sec?C.red:C.gray, cursor:'pointer' }}>
                {sec==='all'?'All sections':sec}
              </button>
            ))}
          </div>
          <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:C.gray }}>{filtered.length} videos</span>
        </div>

        {loading ? <p style={{ textAlign:'center', fontFamily:'Georgia,serif', color:C.gray, padding:'4rem' }}>Loading…</p>
        : !filtered.length ? <p style={{ textAlign:'center', fontFamily:'Georgia,serif', color:C.gray, padding:'3rem' }}>No videos match your search.</p>
        : filtered.map(v => (
          <div key={v.id} style={{ background:C.white, border:'1px solid '+C.border, borderRadius:'8px', marginBottom:'0.75rem', overflow:'hidden' }}>
            {/* Video row */}
            <div onClick={()=>setExpanded(expanded===v.id?null:v.id)}
              style={{ display:'grid', gridTemplateColumns:'2fr 80px 90px 90px 90px 90px 40px', gap:'0.75rem', padding:'1rem 1.25rem', alignItems:'center', cursor:'pointer' }}>
              <div>
                <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'600', color:C.black, marginBottom:'0.15rem' }}>{v.title}</p>
                <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.62rem', color:C.gray }}>{v.section} · {v.duration_mins}min</p>
              </div>
              {[[v.unique_viewers,'viewers',C.blue],[v.avg_watch_pct+'%','avg watch',v.avg_watch_pct>=70?C.green:C.amber],[v.completion_rate+'%','completed',v.completion_rate>=60?C.green:C.red],[v.avg_quiz_score>0?v.avg_quiz_score+'%':'—','quiz avg',v.avg_quiz_score>=60?C.green:C.amber],[v.total_views,'views',C.gray]].map(([val,label,color])=>(
                <div key={label} style={{ textAlign:'center' }}>
                  <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'700', color, lineHeight:1 }}>{val}</p>
                  <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.58rem', color:C.gray }}>{label}</p>
                </div>
              ))}
              <span style={{ color:C.gray, fontSize:'0.75rem', textAlign:'center' }}>{expanded===v.id?'▲':'▼'}</span>
            </div>

            {/* Expanded: per-student */}
            {expanded === v.id && (
              <div style={{ borderTop:'1px solid '+C.border }}>
                <div style={{ display:'grid', gridTemplateColumns:'2fr 80px 100px 80px 160px', gap:'0.5rem', padding:'0.5rem 1.25rem', background:C.muted }}>
                  {['Student','Watch %','Time','Quiz','Last watched'].map(h=>(
                    <span key={h} style={{ fontFamily:'var(--font-sans)', fontSize:'0.6rem', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.06em', color:C.gray }}>{h}</span>
                  ))}
                </div>
                {v.students?.map((st,i)=>(
                  <div key={i} style={{ display:'grid', gridTemplateColumns:'2fr 80px 100px 80px 160px', gap:'0.5rem', padding:'0.625rem 1.25rem', borderBottom:'1px solid '+C.border, alignItems:'center' }}>
                    <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:'500', color:C.black }}>{st.name}</span>
                    <div>
                      <div style={{ height:'5px', background:C.muted, borderRadius:'100px', overflow:'hidden', marginBottom:'2px' }}>
                        <div style={{ height:'100%', width:st.watch_pct+'%', background:st.watch_pct>=70?C.green:C.amber, borderRadius:'100px' }} />
                      </div>
                      <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.62rem', fontWeight:'600', color:st.watch_pct>=70?C.green:C.amber }}>{st.watch_pct}%</span>
                    </div>
                    <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:C.gray }}>
                      {st.watched_secs ? Math.floor(st.watched_secs/60)+'m '+st.watched_secs%60+'s' : '—'}
                    </span>
                    <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', fontWeight:'600', color:st.quiz_score>=70?C.green:st.quiz_score>=50?C.amber:st.quiz_score?C.red:C.gray }}>
                      {st.quiz_score!=null ? st.quiz_score+'%' : '—'}
                    </span>
                    <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', color:C.gray }}>
                      {st.last_watched ? new Date(st.last_watched).toLocaleDateString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : '—'}
                    </span>
                  </div>
                ))}
                {!v.students?.length && <p style={{ padding:'1rem 1.25rem', fontFamily:'Georgia,serif', fontSize:'0.82rem', color:C.gray }}>No student data yet</p>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  </AdminLayout>
  )
}

const DEMO_VIDEOS = [
  { id:1, title:'RC Strategy — Introduction', section:'VARC', duration_mins:22, unique_viewers:24, total_views:31, avg_watch_pct:78, completion_rate:71, avg_quiz_score:65,
    students:[
      { name:'Kavya Kumar',  watch_pct:100, watched_secs:1320, quiz_score:88, last_watched:'2026-05-20T14:30:00' },
      { name:'Rahul Sharma', watch_pct:85,  watched_secs:1122, quiz_score:72, last_watched:'2026-05-19T11:00:00' },
      { name:'Priya Patel',  watch_pct:45,  watched_secs:594,  quiz_score:null, last_watched:'2026-05-18T09:00:00' },
    ]},
  { id:2, title:'Percentages — All Concepts', section:'QA', duration_mins:35, unique_viewers:22, total_views:28, avg_watch_pct:62, completion_rate:55, avg_quiz_score:58,
    students:[
      { name:'Kavya Kumar', watch_pct:100, watched_secs:2100, quiz_score:76, last_watched:'2026-05-21T10:00:00' },
      { name:'Amit Singh',  watch_pct:30,  watched_secs:630,  quiz_score:null, last_watched:'2026-05-17T16:00:00' },
    ]},
  { id:3, title:'Seating Arrangement Basics', section:'DILR', duration_mins:28, unique_viewers:20, total_views:24, avg_watch_pct:71, completion_rate:65, avg_quiz_score:44,
    students:[
      { name:'Rahul Sharma', watch_pct:90,  watched_secs:1512, quiz_score:55, last_watched:'2026-05-22T09:30:00' },
      { name:'Neha Joshi',   watch_pct:100, watched_secs:1680, quiz_score:33, last_watched:'2026-05-21T15:00:00' },
    ]},
]

/**
 * GRADSKOOL Admin — Batch Health
 * Route: /admin-panel/batch-health
 * At-risk · inactive · engaged · search · send nudge
 */
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import api from '../../lib/api'
import { AdminLayout } from '../../components/admin/AdminLayout'

const C = { red:'#ff5e5f', black:'#0f0f0f', white:'#fff', bg:'#f7f6f3', border:'#e8e8e6', gray:'#999', green:'#22c55e', amber:'#f59e0b', blue:'#3b82f6', muted:'#f4f3f0' }

export default function BatchHealth() {
  const [data,      setData]     = useState(null)
  const [exam,      setExam]     = useState('cat')
  const [filter,    setFilter]   = useState('all')
  const [search,    setSearch]   = useState('')
  const [selected,  setSelected] = useState(new Set())
  const [nudgeModal,setNudgeModal]= useState(false)
  const [nudgeMsg,  setNudgeMsg] = useState('')
  const [nudgeTitle,setNudgeTitle]= useState('Message from your instructor')
  const [nudgeType, setNudgeType]= useState('inapp')
  const [sending,   setSending]  = useState(false)
  const [loading,   setLoad]     = useState(true)
  const [msg,       setMsg]      = useState(null)

  const load = () => {
    setLoad(true)
    api.get('/learn/admin/batch-health/?exam=' + exam)
      .then(({ data: d }) => setData(d))
      .catch(() => setData(DEMO))
      .finally(() => setLoad(false))
  }
  useEffect(load, [exam])

  const notify = (text, type='success') => { setMsg({type,text}); setTimeout(()=>setMsg(null),3000) }

  const students = (data?.students||[]).filter(s => {
    const matchFilter = filter === 'all' || s.status === filter
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const sum = data?.summary || {}

  const toggleSelect = id => setSelected(s => { const n=new Set(s); n.has(id)?n.delete(id):n.add(id); return n })
  const selectAll    = () => setSelected(new Set(students.map(s=>s.id)))
  const clearSelect  = () => setSelected(new Set())

  const sendNudge = async () => {
    if (!nudgeMsg.trim()) { notify('Write a message first','error'); return }
    setSending(true)
    try {
      const { data: r } = await api.post('/dashboard/nudge/', {
        user_ids:  [...selected],
        message:   nudgeMsg,
        title:     nudgeTitle,
        type:      nudgeType,
      })
      notify(`Sent to ${r.sent} student${r.sent!==1?'s':''}`)
      setNudgeModal(false)
      setNudgeMsg('')
      clearSelect()
    } catch { notify('Failed to send','error') }
    finally { setSending(false) }
  }

  const csvExport = () => {
    const rows = [['Name','Email','Status','Days since login','Videos','Quizzes','Avg score'],
      ...students.map(s=>[s.name,s.email,s.status,s.days_since,s.videos,s.quizzes,s.avg_quiz+'%'])]
    const a = document.createElement('a')
    a.href = 'data:text/csv,' + encodeURIComponent(rows.map(r=>r.join(',')).join('\n'))
    a.download = `batch-health-${exam}.csv`
    a.click()
  }

  return (
    <AdminLayout title="Batch Health">
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <Head><title>Batch Health — Admin — GRADSKOOL</title></Head>
      {msg && <div style={{ position:'fixed', top:'64px', right:'1.5rem', zIndex:999, padding:'0.75rem 1.25rem', borderRadius:'4px', fontFamily:'var(--font-sans)', fontSize:'0.82rem', background:msg.type==='error'?'#fee2e2':'#dcfce7', border:'1px solid '+(msg.type==='error'?'#fca5a5':'#86efac'), color:msg.type==='error'?'#991b1b':'#166534' }}>{msg.text}</div>}

      <div style={{ height:'56px', background:C.white, borderBottom:'1px solid '+C.border, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 1.5rem', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <Link href="/admin-panel" style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', color:C.gray, textDecoration:'none' }}>← Admin</Link>
          <span style={{ color:C.border }}>|</span>
          <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', color:C.black }}>Batch Health</span>
        </div>
        <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
          <select value={exam} onChange={e=>setExam(e.target.value)} style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', padding:'0.3rem 0.5rem', border:'1px solid '+C.border, borderRadius:'4px', background:C.white, cursor:'pointer' }}>
            {['cat','xat','snap','nmat','gmat','gre'].map(e=><option key={e} value={e}>{e.toUpperCase()}</option>)}
          </select>
          {selected.size > 0 && <>
            <button onClick={() => setNudgeModal(true)}
              style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'700', padding:'0.3rem 0.875rem', background:C.red, color:'#fff', border:'none', borderRadius:'4px', cursor:'pointer' }}>
              💬 Nudge {selected.size}
            </button>
            <button onClick={clearSelect} style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', color:C.gray, background:'none', border:'none', cursor:'pointer' }}>Clear</button>
          </>}
          <button onClick={csvExport} style={{ fontFamily:'var(--font-sans)', fontSize:'0.7rem', padding:'0.3rem 0.75rem', border:'1px solid '+C.border, borderRadius:'3px', background:C.white, cursor:'pointer' }}>↓ CSV</button>
        </div>
      </div>

      <div style={{ maxWidth:'1000px', margin:'0 auto', padding:'2rem' }}>
        {/* Summary cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
          {[
            ['Total',sum.total||0,C.blue,'all'],
            ['Engaged',sum.engaged||0,C.green,'engaged'],
            ['Inactive (2d+)',sum.inactive||0,C.amber,'inactive'],
            ['At risk (5d+)',sum.at_risk||0,C.red,'at_risk'],
          ].map(([label,val,color,f])=>(
            <div key={label} onClick={()=>setFilter(f)}
              style={{ background:C.white, border:'2px solid '+(filter===f?color:C.border), borderRadius:'8px', padding:'1.25rem', cursor:'pointer', textAlign:'center', transition:'border-color .15s' }}>
              <p style={{ fontFamily:'Georgia,serif', fontSize:'1.75rem', fontWeight:'700', color, lineHeight:1, marginBottom:'0.2rem' }}>{val}</p>
              <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', color:C.gray }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1rem', alignItems:'center' }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or email…"
            style={{ flex:1, padding:'0.5rem 0.75rem', fontFamily:'var(--font-sans)', fontSize:'0.82rem', border:'1px solid '+C.border, borderRadius:'4px', outline:'none' }} />
          <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:C.gray }}>{students.length} students</span>
          {students.length > 0 && <button onClick={selectAll} style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', padding:'0.3rem 0.5rem', border:'1px solid '+C.border, borderRadius:'3px', background:C.white, cursor:'pointer', color:C.gray }}>Select all</button>}
        </div>

        {loading ? <p style={{ textAlign:'center', fontFamily:'Georgia,serif', color:C.gray, padding:'4rem' }}>Loading…</p>
        : !students.length ? <p style={{ textAlign:'center', fontFamily:'Georgia,serif', color:C.gray, padding:'3rem' }}>No students found</p>
        : (
          <div style={{ background:C.white, border:'1px solid '+C.border, borderRadius:'8px', overflow:'hidden' }}>
            <div style={{ display:'grid', gridTemplateColumns:'2.5rem 2fr 1fr 80px 60px 60px 80px 90px', gap:'0.5rem', padding:'0.625rem 1rem', background:C.muted, borderBottom:'1px solid '+C.border }}>
              {['','Student','Status','Last seen','Videos','Quizzes','Avg score',''].map((h,i)=>(
                <span key={i} style={{ fontFamily:'var(--font-sans)', fontSize:'0.6rem', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.07em', color:C.gray }}>{h}</span>
              ))}
            </div>
            {students.map(s=>(
              <div key={s.id} style={{ display:'grid', gridTemplateColumns:'2.5rem 2fr 1fr 80px 60px 60px 80px 90px', gap:'0.5rem', padding:'0.875rem 1rem', borderBottom:'1px solid '+C.border, alignItems:'center', background:selected.has(s.id)?'#fff5f5':C.white }}>
                <input type="checkbox" checked={selected.has(s.id)} onChange={()=>toggleSelect(s.id)} />
                <div>
                  <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'600', color:C.black }}>{s.name}</p>
                  <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', color:C.gray }}>{s.email}</p>
                </div>
                <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', fontWeight:'700', padding:'0.15rem 0.5rem', borderRadius:'3px',
                  background:s.status==='engaged'?'#dcfce7':s.status==='at_risk'?'#fee2e2':'#fef3c7',
                  color:s.status==='engaged'?'#166534':s.status==='at_risk'?C.red:'#92400e' }}>
                  {s.status.replace('_',' ')}
                </span>
                <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', color:s.days_since>5?C.red:s.days_since>2?C.amber:C.green, fontWeight:'600' }}>
                  {s.days_since===999?'Never':s.days_since===0?'Today':s.days_since+'d ago'}
                </span>
                <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:C.black, fontWeight:'600', textAlign:'center' }}>{s.videos}</span>
                <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:C.black, textAlign:'center' }}>{s.quizzes}</span>
                <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:'600', textAlign:'center', color:s.avg_quiz>=70?C.green:s.avg_quiz>=50?C.amber:C.red }}>
                  {s.avg_quiz||0}%
                </span>
                <button onClick={()=>{ setSelected(new Set([s.id])); setNudgeModal(true) }}
                  style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', padding:'0.2rem 0.5rem', border:'1px solid '+C.border, borderRadius:'3px', cursor:'pointer', background:C.white }}>
                  💬 Nudge
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Nudge modal */}
      {nudgeModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }} onClick={e=>e.target===e.currentTarget&&(setNudgeModal(false),clearSelect())}>
          <div style={{ background:C.white, borderRadius:'8px', width:'100%', maxWidth:'480px', padding:'2rem' }}>
            <p style={{ fontFamily:'Georgia,serif', fontSize:'1.25rem', fontWeight:'700', color:C.black, marginBottom:'0.375rem' }}>Send message</p>
            <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:C.gray, marginBottom:'1.5rem' }}>Sending to {selected.size} student{selected.size!==1?'s':''}</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
              <div>
                <label style={s.lbl}>Title</label>
                <input value={nudgeTitle} onChange={e=>setNudgeTitle(e.target.value)} style={s.inp} />
              </div>
              <div>
                <label style={s.lbl}>Message *</label>
                <textarea value={nudgeMsg} onChange={e=>setNudgeMsg(e.target.value)} rows={4}
                  style={{ ...s.inp, height:'100px', resize:'vertical' }}
                  placeholder="Hey! You haven't logged in for a few days. Your CAT prep plan is waiting…" />
              </div>
              <div>
                <label style={s.lbl}>Channel</label>
                <div style={{ display:'flex', gap:'0.5rem' }}>
                  {[['inapp','In-app notification'],['whatsapp','WhatsApp']].map(([val,label])=>(
                    <label key={val} style={{ display:'flex', alignItems:'center', gap:'0.375rem', cursor:'pointer', padding:'0.5rem 0.875rem', border:'1px solid '+(nudgeType===val?C.red:C.border), borderRadius:'4px', background:nudgeType===val?'#fff5f5':C.white }}>
                      <input type="radio" value={val} checked={nudgeType===val} onChange={()=>setNudgeType(val)} />
                      <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', color:nudgeType===val?C.red:C.black }}>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.75rem', marginTop:'1.5rem', paddingTop:'1rem', borderTop:'1px solid '+C.border }}>
              <button onClick={()=>{setNudgeModal(false);clearSelect()}} style={{ padding:'0.625rem 1.25rem', border:'1px solid '+C.border, borderRadius:'4px', background:C.white, fontFamily:'var(--font-sans)', fontSize:'0.82rem', cursor:'pointer' }}>Cancel</button>
              <button onClick={sendNudge} disabled={sending||!nudgeMsg.trim()}
                style={{ padding:'0.625rem 1.5rem', background:sending?C.gray:C.red, color:'#fff', border:'none', borderRadius:'4px', fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', cursor:sending?'not-allowed':'pointer' }}>
                {sending?'Sending…':'Send message'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </AdminLayout>
  )
}

const s = { lbl:{ fontFamily:'var(--font-sans)',fontSize:'0.7rem',fontWeight:'700',color:'#666',display:'block',marginBottom:'0.25rem' }, inp:{ width:'100%',padding:'0.5rem 0.625rem',fontFamily:'var(--font-sans)',fontSize:'0.82rem',border:'1px solid #e8e8e6',borderRadius:'4px',outline:'none',color:'#0f0f0f',boxSizing:'border-box',background:'#fff' } }

const DEMO = {
  summary:{ total:27, engaged:18, inactive:5, at_risk:4 },
  students:[
    { id:1, name:'Kavya Kumar',  email:'kavya@gmail.com',  days_since:0, videos:24, quizzes:8, avg_quiz:72, status:'engaged' },
    { id:2, name:'Rahul Sharma', email:'rahul@gmail.com',  days_since:1, videos:19, quizzes:5, avg_quiz:68, status:'engaged' },
    { id:3, name:'Priya Patel',  email:'priya@gmail.com',  days_since:3, videos:12, quizzes:3, avg_quiz:55, status:'inactive' },
    { id:4, name:'Amit Singh',   email:'amit@gmail.com',   days_since:6, videos:4,  quizzes:1, avg_quiz:40, status:'at_risk' },
    { id:5, name:'Neha Joshi',   email:'neha@gmail.com',   days_since:9, videos:2,  quizzes:0, avg_quiz:0,  status:'at_risk' },
  ],
}

/**
 * GRADSKOOL — Student Profile
 * Route: /profile
 */
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import api from '../lib/api'

const C = { red:'#ff5e5f', black:'#0f0f0f', white:'#fff', bg:'#f7f6f3', border:'#e8e8e6', gray:'#999', green:'#22c55e', muted:'#f4f3f0' }
const EXAMS = ['cat','xat','snap','nmat','gmat','gre','ipmat','cmat','mhcet','clat','cuet']

export default function ProfilePage() {
  return <ProtectedRoute><Inner /></ProtectedRoute>
}

function Inner() {
  const [profile, setProfile] = useState(null)
  const [form,    setForm]    = useState({})
  const [loading, setLoad]    = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [msg,     setMsg]     = useState(null)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    api.get('/learn/profile/')
      .then(({ data }) => { setProfile(data); setForm(data) })
      .catch(() => {})
      .finally(() => setLoad(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      await api.patch('/learn/profile/', form)
      setProfile(p => ({...p, ...form}))
      setEditing(false)
      setMsg({ type:'success', text:'Profile updated' })
      setTimeout(() => setMsg(null), 2000)
    } catch { setMsg({ type:'error', text:'Failed to save' }) }
    finally { setSaving(false) }
  }

  if (loading) return <div style={{ minHeight:'100vh', background:C.bg, display:'flex', alignItems:'center', justifyContent:'center' }}><p style={{ fontFamily:'Georgia,serif', color:C.gray }}>Loading…</p></div>

  const initials = ((form.first_name||'')[0]||'') + ((form.last_name||'')[0]||'')

  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <Head><title>Profile — GRADSKOOL</title></Head>
      <div style={{ height:'52px', background:C.white, borderBottom:'1px solid '+C.border, display:'flex', alignItems:'center', padding:'0 1.5rem', gap:'1rem' }}>
        <Link href="/dashboard" style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', color:C.gray, textDecoration:'none' }}>← Dashboard</Link>
        <span style={{ color:C.border }}>|</span>
        <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', color:C.black }}>My Profile</span>
      </div>
      {msg && <div style={{ position:'fixed', top:'60px', right:'1.5rem', zIndex:999, padding:'0.75rem 1.25rem', borderRadius:'4px', fontFamily:'var(--font-sans)', fontSize:'0.82rem', background:msg.type==='error'?'#fee2e2':'#dcfce7', border:'1px solid '+(msg.type==='error'?'#fca5a5':'#86efac'), color:msg.type==='error'?'#991b1b':'#166534' }}>{msg.text}</div>}

      <div style={{ maxWidth:'680px', margin:'0 auto', padding:'2rem' }}>
        {/* Avatar + name */}
        <div style={{ background:C.white, border:'1px solid '+C.border, borderRadius:'8px', padding:'2rem', marginBottom:'1.5rem', display:'flex', alignItems:'center', gap:'1.5rem', flexWrap:'wrap' }}>
          <div style={{ width:'72px', height:'72px', borderRadius:'50%', background:C.red, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontFamily:'Georgia,serif', fontSize:'1.75rem', fontWeight:'700', flexShrink:0 }}>
            {initials.toUpperCase() || '?'}
          </div>
          <div style={{ flex:1 }}>
            <h1 style={{ fontFamily:'Georgia,serif', fontSize:'1.5rem', fontWeight:'700', color:C.black, marginBottom:'0.25rem' }}>
              {profile?.first_name} {profile?.last_name}
            </h1>
            <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:C.gray, marginBottom:'0.25rem' }}>{profile?.email}</p>
            <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', marginTop:'0.5rem' }}>
              {profile?.enrollments?.map((e, i) => (
                <span key={i} style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', fontWeight:'700', padding:'0.15rem 0.5rem', borderRadius:'3px', background:'#eff6ff', color:'#1d4ed8' }}>
                  {e.exam} — {e.plan}
                </span>
              ))}
            </div>
          </div>
          <div style={{ display:'flex', gap:'0.5rem' }}>
            <button onClick={() => setEditing(!editing)}
              style={{ padding:'0.5rem 1rem', background:editing?C.gray:C.black, color:'#fff', border:'none', borderRadius:'4px', fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:'700', cursor:'pointer' }}>
              {editing ? 'Cancel' : '✎ Edit'}
            </button>
            {editing && <button onClick={save} disabled={saving} style={{ padding:'0.5rem 1rem', background:C.red, color:'#fff', border:'none', borderRadius:'4px', fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:'700', cursor:'pointer' }}>{saving?'Saving…':'Save'}</button>}
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:'1.5rem', marginBottom:'1.5rem' }}>
          {/* Personal info */}
          <div style={{ background:C.white, border:'1px solid '+C.border, borderRadius:'8px', padding:'1.25rem' }}>
            <p style={s.label}>Personal Info</p>
            {editing ? (
              <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem', marginTop:'0.875rem' }}>
                {[['First Name','first_name'],['Last Name','last_name'],['Phone','phone']].map(([l,k]) => (
                  <div key={k}>
                    <label style={s.lbl}>{l}</label>
                    <input value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} style={s.inp} />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ marginTop:'0.875rem' }}>
                {[['Phone',profile?.phone||'—'],['Joined',profile?.joined?new Date(profile.joined).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):'—']].map(([l,v]) => (
                  <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'0.4rem 0', borderBottom:'1px solid '+C.border }}>
                    <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:C.gray }}>{l}</span>
                    <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:'600', color:C.black }}>{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Exam target */}
          <div style={{ background:C.white, border:'1px solid '+C.border, borderRadius:'8px', padding:'1.25rem' }}>
            <p style={s.label}>Exam Target</p>
            {editing ? (
              <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem', marginTop:'0.875rem' }}>
                <div>
                  <label style={s.lbl}>Target Exam</label>
                  <select value={form.target_exam||''} onChange={e=>setForm(f=>({...f,target_exam:e.target.value}))} style={s.inp}>
                    {EXAMS.map(e => <option key={e} value={e}>{e.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>
            ) : (
              <div style={{ marginTop:'0.875rem' }}>
                <div style={{ textAlign:'center', padding:'1.5rem 0' }}>
                  <p style={{ fontFamily:'Georgia,serif', fontSize:'2rem', fontWeight:'700', color:C.red }}>{(profile?.target_exam||'—').toUpperCase()}</p>
                  <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:C.gray, marginTop:'0.25rem' }}>Target exam</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ background:C.white, border:'1px solid '+C.border, borderRadius:'8px', padding:'1.25rem' }}>
          <p style={s.label}>Learning Stats</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginTop:'0.875rem' }}>
            {[['📹', profile?.videos_watched||0, 'Videos watched'],['📝', profile?.quizzes_done||0,'Quizzes done']].map(([icon,val,lbl]) => (
              <div key={lbl} style={{ textAlign:'center', padding:'0.875rem', background:C.muted, borderRadius:'6px' }}>
                <p style={{ fontSize:'1.25rem', marginBottom:'0.25rem' }}>{icon}</p>
                <p style={{ fontFamily:'Georgia,serif', fontSize:'1.5rem', fontWeight:'700', color:C.black, lineHeight:1, marginBottom:'0.15rem' }}>{val}</p>
                <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.62rem', color:C.gray }}>{lbl}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const s = {
  label: { fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:'#999' },
  lbl: { fontFamily:'var(--font-sans)', fontSize:'0.7rem', fontWeight:'700', color:'#666', display:'block', marginBottom:'0.25rem' },
  inp: { width:'100%', padding:'0.5rem 0.625rem', fontFamily:'var(--font-sans)', fontSize:'0.82rem', border:'1px solid #e8e8e6', borderRadius:'4px', outline:'none', color:'#0f0f0f', boxSizing:'border-box', background:'#fff' },
}

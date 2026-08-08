/**
 * GRADSKOOL — Daily / Weekly Goals
 * Route: /dashboard/goals
 */
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { ProtectedRoute } from '../../components/auth/ProtectedRoute'
import { useAuth } from '../../hooks/useAuth'
import api from '../../lib/api'

const C = { red:'#ff5e5f', black:'#0f0f0f', white:'#fff', bg:'#f7f6f3', border:'#e8e8e6', gray:'#999', green:'#22c55e', amber:'#f59e0b', muted:'#f4f3f0' }

const METRICS = [
  { key:'videos',     label:'Videos to watch',       icon:'📹', hint:'e.g. 3 videos per day' },
  { key:'quiz_score', label:'Minimum quiz score',     icon:'📝', hint:'e.g. 60%' },
  { key:'study_mins', label:'Study minutes',          icon:'⏱', hint:'e.g. 60 minutes per day' },
  { key:'topics',     label:'Topics to complete',     icon:'✅', hint:'e.g. 1 topic per day' },
]

export default function GoalsPage() {
  return <ProtectedRoute><Inner /></ProtectedRoute>
}

function Inner() {
  const { user } = useAuth()
  const [goals,   setGoals]  = useState([])
  const [gam,     setGam]    = useState(null)
  const [loading, setLoad]   = useState(true)
  const [form,    setForm]   = useState({ period:'daily', metric:'videos', target:3 })
  const [saving,  setSaving] = useState(false)
  const [msg,     setMsg]    = useState(null)
  const exam = user?.target_exam || 'cat'

  const load = () => {
    setLoad(true)
    api.get('/learn/gamification/?exam=' + exam)
      .then(({ data }) => { setGam(data); setGoals(data.goals || []) })
      .catch(() => setGoals([]))
      .finally(() => setLoad(false))
  }
  useEffect(load, [])

  const notify = (text, type='success') => { setMsg({ type, text }); setTimeout(() => setMsg(null), 2500) }

  const add = async () => {
    if (!form.target || form.target < 1) { notify('Set a target > 0', 'error'); return }
    setSaving(true)
    try {
      await api.post('/learn/goals/', { ...form, exam_slug: exam })
      notify('Goal added!')
      load()
    } catch(e) { notify(e.response?.data?.error || 'Failed', 'error') }
    finally { setSaving(false) }
  }

  const del = async (id) => {
    try { await api.delete('/learn/goals/' + id + '/'); notify('Removed'); load() }
    catch { notify('Failed', 'error') }
  }

  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <Head><title>Goals — GRADSKOOL</title></Head>
      <div style={{ height:'52px', background:C.white, borderBottom:'1px solid '+C.border, display:'flex', alignItems:'center', padding:'0 1.5rem', gap:'1rem' }}>
        <Link href="/dashboard?tab=gamification" style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', color:C.gray, textDecoration:'none' }}>← Dashboard</Link>
        <span style={{ color:C.border }}>|</span>
        <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', color:C.black }}>Study Goals</span>
      </div>
      {msg && <div style={{ position:'fixed', top:'60px', right:'1.5rem', zIndex:999, padding:'0.75rem 1.25rem', borderRadius:'4px', fontFamily:'var(--font-sans)', fontSize:'0.82rem', background:msg.type==='error'?'#fee2e2':'#dcfce7', border:'1px solid '+(msg.type==='error'?'#fca5a5':'#86efac'), color:msg.type==='error'?'#991b1b':'#166534' }}>{msg.text}</div>}

      <div style={{ maxWidth:'640px', margin:'0 auto', padding:'2rem' }}>
        {/* Today's progress */}
        {goals.length > 0 && (
          <div style={{ background:C.white, border:'1px solid '+C.border, borderRadius:'8px', padding:'1.5rem', marginBottom:'1.5rem' }}>
            <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.1em', color:C.gray, marginBottom:'1rem' }}>Today's Progress</p>
            {goals.map(g => {
              const m = METRICS.find(x => x.key === g.metric)
              return (
                <div key={g.id} style={{ marginBottom:'1.25rem' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.4rem' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                      <span>{m?.icon}</span>
                      <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'600', color:C.black }}>{m?.label}</span>
                      <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', color:C.gray, background:C.muted, padding:'0.1rem 0.4rem', borderRadius:'3px' }}>{g.period}</span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                      <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', color:g.pct >= 100 ? C.green : C.black }}>
                        {g.progress} / {g.target} {g.pct >= 100 ? '✓' : ''}
                      </span>
                      <button onClick={() => del(g.id)} style={{ background:'none', border:'none', cursor:'pointer', color:C.gray, fontSize:'0.875rem' }}>✕</button>
                    </div>
                  </div>
                  <div style={{ height:'8px', background:C.muted, borderRadius:'100px', overflow:'hidden' }}>
                    <div style={{ height:'100%', width: Math.min(100, g.pct) + '%', background: g.pct >= 100 ? C.green : C.red, borderRadius:'100px', transition:'width 0.5s' }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Add goal */}
        <div style={{ background:C.white, border:'1px solid '+C.border, borderRadius:'8px', padding:'1.5rem', marginBottom:'1.5rem' }}>
          <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.1em', color:C.gray, marginBottom:'1.25rem' }}>Add a Goal</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px,1fr))', gap:'0.875rem', marginBottom:'1rem' }}>
            <div>
              <label style={s.lbl}>Period</label>
              <select value={form.period} onChange={e => setForm(f => ({...f, period:e.target.value}))} style={s.inp}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div>
              <label style={s.lbl}>Metric</label>
              <select value={form.metric} onChange={e => setForm(f => ({...f, metric:e.target.value}))} style={s.inp}>
                {METRICS.map(m => <option key={m.key} value={m.key}>{m.icon} {m.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom:'1.25rem' }}>
            <label style={s.lbl}>Target — {METRICS.find(m => m.key === form.metric)?.hint}</label>
            <input type="number" value={form.target} onChange={e => setForm(f => ({...f, target: parseInt(e.target.value)||1}))} min={1} style={s.inp} />
          </div>
          <button onClick={add} disabled={saving}
            style={{ padding:'0.75rem 1.5rem', background:saving?C.gray:C.red, color:'#fff', border:'none', borderRadius:'6px', fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'700', cursor:saving?'not-allowed':'pointer' }}>
            {saving ? 'Adding…' : '+ Add Goal'}
          </button>
        </div>

        {/* Preset goals */}
        <div style={{ background:C.muted, border:'1px solid '+C.border, borderRadius:'8px', padding:'1.25rem' }}>
          <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.1em', color:C.gray, marginBottom:'0.875rem' }}>Suggested Goals</p>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
            {[
              { label:'Watch 2 videos per day',   metric:'videos',     target:2, period:'daily' },
              { label:'Score 60%+ on every quiz', metric:'quiz_score', target:60, period:'daily' },
              { label:'Study 45 mins per day',    metric:'study_mins', target:45, period:'daily' },
              { label:'Complete 1 topic per day', metric:'topics',     target:1, period:'daily' },
            ].map(g => (
              <button key={g.label} onClick={() => { setForm({ period:g.period, metric:g.metric, target:g.target }); }}
                style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.625rem 0.875rem', background:C.white, border:'1px solid '+C.border, borderRadius:'4px', cursor:'pointer', textAlign:'left' }}>
                <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:C.black }}>{g.label}</span>
                <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', color:C.gray }}>Use this →</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const s = {
  lbl: { fontFamily:'var(--font-sans)', fontSize:'0.7rem', fontWeight:'700', color:'#666', display:'block', marginBottom:'0.25rem' },
  inp: { width:'100%', padding:'0.5rem 0.625rem', fontFamily:'var(--font-sans)', fontSize:'0.82rem', border:'1px solid #e8e8e6', borderRadius:'4px', outline:'none', color:'#0f0f0f', boxSizing:'border-box', background:'#fff' },
}

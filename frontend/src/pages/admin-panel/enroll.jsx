/**
 * GRADSKOOL Admin — Manual Enrollment
 * Route: /admin-panel/enroll
 *
 * Enroll any student in any plan without payment.
 * Used for: testing, scholarships, demo access, support.
 */
import { useState, useEffect } from 'react'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { SectionBox } from '../../components/admin/AdminPrimitives'
import api from '../../lib/api'

export default function AdminManualEnrollPage() {
  const [plans,    setPlans]   = useState([])
  const [loading,  setLoad]    = useState(true)
  const [form,     setForm]    = useState({ email:'', plan_id:'', note:'' })
  const [saving,   setSaving]  = useState(false)
  const [msg,      setMsg]     = useState(null)
  const [history,  setHistory] = useState([])

  useEffect(() => {
    api.get('/dashboard/plans/')
      .then(({ data }) => setPlans(data))
      .catch(() => {})
      .finally(() => setLoad(false))
  }, [])

  const handleEnroll = async () => {
    if (!form.email || !form.plan_id) {
      setMsg({ type:'error', text:'Email and plan are required' })
      return
    }
    setSaving(true)
    try {
      const { data } = await api.post('/dashboard/manual-enroll/', form)
      setMsg({ type:'success', text:`✓ ${data.user} enrolled in ${data.plan} (${data.exam})${data.created ? ' — new enrollment' : ' — reactivated'}` })
      setHistory(h => [{ ...data, ts: new Date().toLocaleTimeString() }, ...h.slice(0,9)])
      setForm(f => ({ ...f, email:'', note:'' }))
    } catch (err) {
      const msg = typeof err.response?.data?.error === 'string' ? err.response.data.error : (err.response?.data?.detail || err.response?.data?.message || 'Enrollment failed')
      setMsg({ type:'error', text: msg })
    } finally {
      setSaving(false)
    }
  }

  // Group plans by exam
  const byExam = plans.reduce((acc, p) => {
    if (!acc[p.exam]) acc[p.exam] = []
    acc[p.exam].push(p)
    return acc
  }, {})

  return (
    <AdminLayout title="Manual Enrollment">
      <div style={s.header}>
        <div>
          <p style={s.eyebrow}>Admin Tool</p>
          <h1 style={s.title}>Manual Enrollment</h1>
          <p style={s.sub}>Enroll a student in any plan without payment. For testing, scholarships, and demo access.</p>
        </div>
      </div>

      {msg && (
        <div style={{ display:'flex', justifyContent:'space-between', padding:'0.875rem 1rem', borderRadius:'4px', marginBottom:'1.25rem', fontFamily:'var(--font-sans)', fontSize:'0.875rem', background:msg.type==='success'?'#f0fdf4':'#fff5f5', border:`1px solid ${msg.type==='success'?'#86efac':'#fca5a5'}`, color:msg.type==='success'?'#166534':'#991b1b' }}>
          {msg.text}
          <button onClick={() => setMsg(null)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1rem' }}>✕</button>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2rem', alignItems:'start' }}>

        {/* Form */}
        <SectionBox>
          <h2 style={s.boxTitle}>Enroll a Student</h2>

          <div style={{ marginBottom:'1rem' }}>
            <label style={s.label}>Student Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email:e.target.value }))}
              style={s.input}
              placeholder="student@email.com"
            />
            <p style={s.hint}>Student must have already registered on GRADSKOOL.</p>
          </div>

          <div style={{ marginBottom:'1rem' }}>
            <label style={s.label}>Plan *</label>
            <select
              value={form.plan_id}
              onChange={e => setForm(f => ({ ...f, plan_id:e.target.value }))}
              style={s.input}
            >
              <option value="">— Select a plan —</option>
              {Object.entries(byExam).map(([exam, examPlans]) => (
                <optgroup key={exam} label={exam}>
                  {examPlans.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ₹{p.price} {p.badge ? `(${p.badge})` : ''}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div style={{ marginBottom:'1.5rem' }}>
            <label style={s.label}>Note (internal, optional)</label>
            <input
              value={form.note}
              onChange={e => setForm(f => ({ ...f, note:e.target.value }))}
              style={s.input}
              placeholder="e.g. Scholarship, testing, demo access…"
            />
          </div>

          <button
            onClick={handleEnroll}
            disabled={saving || !form.email || !form.plan_id}
            style={{ ...s.btn, opacity: (saving || !form.email || !form.plan_id) ? 0.5 : 1 }}
          >
            {saving ? 'Enrolling…' : 'Enroll Student →'}
          </button>
        </SectionBox>

        {/* How it works + history */}
        <div>
          <SectionBox>
            <h2 style={s.boxTitle}>How it works</h2>
            <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              {[
                ['1.', 'Student registers at /auth/register with their email.'],
                ['2.', 'You pick their email and the plan here, and click Enroll.'],
                ['3.', 'Student logs in and their dashboard shows the enrolled course immediately.'],
                ['4.', 'No payment required. The enrollment is marked active with no order attached.'],
              ].map(([n, t]) => (
                <div key={n} style={{ display:'flex', gap:'0.75rem' }}>
                  <span style={{ fontFamily:'Georgia,serif', fontSize:'1.1rem', fontWeight:'700', color:'var(--red)', flexShrink:0 }}>{n}</span>
                  <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.875rem', color:'var(--gray-600)', lineHeight:'1.6' }}>{t}</span>
                </div>
              ))}
            </div>
          </SectionBox>

          {history.length > 0 && (
            <SectionBox style={{ marginTop:'1.5rem' }}>
              <h2 style={s.boxTitle}>This Session</h2>
              {history.map((h, i) => (
                <div key={i} style={{ padding:'0.625rem 0', borderBottom:'1px solid var(--gray-100)', display:'flex', justifyContent:'space-between', alignItems:'start', gap:'0.5rem' }}>
                  <div>
                    <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'600', color:'var(--black)', marginBottom:'0.1rem' }}>{h.user}</p>
                    <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', color:'var(--gray-400)' }}>{h.plan} · {h.exam}</p>
                  </div>
                  <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', color:'var(--gray-400)', flexShrink:0 }}>{h.ts}</span>
                </div>
              ))}
            </SectionBox>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

const s = {
  header:   { marginBottom:'1.5rem' },
  eyebrow:  { fontFamily:'var(--font-sans)', fontSize:'0.68rem', fontWeight:'700', letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--red)', marginBottom:'0.2rem' },
  title:    { fontFamily:'var(--font-serif)', fontSize:'2rem', fontWeight:'700', color:'var(--black)', marginBottom:'0.25rem' },
  sub:      { fontFamily:'var(--font-sans)', fontSize:'0.875rem', color:'var(--gray-500)' },
  boxTitle: { fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'700', color:'var(--black)', marginBottom:'1.25rem', paddingBottom:'0.75rem', borderBottom:'1px solid var(--gray-100)' },
  label:    { display:'block', fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:'600', color:'var(--gray-700)', marginBottom:'0.3rem' },
  input:    { width:'100%', padding:'0.6rem 0.75rem', fontFamily:'var(--font-sans)', fontSize:'0.875rem', border:'1px solid var(--gray-200)', borderRadius:'3px', outline:'none', boxSizing:'border-box' },
  hint:     { fontFamily:'var(--font-sans)', fontSize:'0.68rem', color:'var(--gray-400)', marginTop:'0.25rem' },
  btn:      { background:'var(--black)', color:'var(--white)', border:'none', padding:'0.75rem 1.5rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'700', cursor:'pointer', width:'100%' },
}

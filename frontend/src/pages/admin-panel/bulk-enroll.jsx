/**
 * GRADSKOOL Admin — Bulk Enrollment
 * Route: /admin-panel/bulk-enroll
 */
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import api from '../../lib/api'

const C = { red:'#ff5e5f',black:'#0f0f0f',white:'#fff',bg:'#f7f6f3',border:'#e8e8e6',gray50:'#fafaf9',gray400:'#999',gray500:'#666',green:'#22c55e',amber:'#f59e0b' }

export default function BulkEnroll() {
  const [plans,   setPlans]  = useState([])
  const [planId,  setPlanId] = useState('')
  const [emails,  setEmails] = useState('')
  const [result,  setResult] = useState(null)
  const [loading, setLoad]   = useState(false)
  const [msg,     setMsg]    = useState(null)

  useEffect(() => {
    api.get('/dashboard/plans/').then(({ data }) => setPlans(data || [])).catch(() => {})
  }, [])

  const parsed = emails.split(/[\n,;]+/).map(e=>e.trim().toLowerCase()).filter(Boolean)

  const enroll = async () => {
    if (!planId) { setMsg({ type:'error', text:'Select a plan' }); return }
    if (!parsed.length) { setMsg({ type:'error', text:'Enter at least one email' }); return }
    setLoad(true); setResult(null)
    try {
      const { data } = await api.post('/dashboard/bulk-enroll/', { emails:parsed, plan_id:parseInt(planId) })
      setResult(data)
      setMsg({ type:'success', text:'Enrollment complete' })
    } catch(e) { setMsg({ type:'error', text:e.response?.data?.error||'Failed' }) }
    finally { setLoad(false) }
  }

  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <Head><title>Bulk Enroll — Admin</title></Head>
      <div style={{ height:'56px', background:C.white, borderBottom:'1px solid '+C.border, display:'flex', alignItems:'center', padding:'0 1.5rem', gap:'1rem' }}>
        <Link href="/admin-panel" style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', color:C.gray400, textDecoration:'none' }}>← Admin Panel</Link>
        <span style={{ color:C.border }}>|</span>
        <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', color:C.black }}>Bulk Enrollment</span>
      </div>
      {msg && <div style={{ position:'fixed', top:'64px', right:'1.5rem', zIndex:999, padding:'0.75rem 1.25rem', borderRadius:'4px', fontFamily:'var(--font-sans)', fontSize:'0.82rem', background:msg.type==='error'?'#fee2e2':'#dcfce7', border:'1px solid '+(msg.type==='error'?'#fca5a5':'#86efac'), color:msg.type==='error'?'#991b1b':'#166534' }}>{msg.text}</div>}

      <div style={{ maxWidth:'700px', margin:'0 auto', padding:'2rem' }}>
        <div style={{ marginBottom:'2rem' }}>
          <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.7rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:C.red, marginBottom:'0.375rem' }}>Enrollment</p>
          <h1 style={{ fontFamily:'Georgia,serif', fontSize:'1.75rem', fontWeight:'700', color:C.black, marginBottom:'0.5rem' }}>Bulk Enroll Students</h1>
          <p style={{ fontFamily:'Georgia,serif', fontSize:'0.875rem', color:C.gray400 }}>Paste a list of emails to enroll multiple students at once. Students must already have accounts.</p>
        </div>

        <div style={{ background:C.white, border:'1px solid '+C.border, borderRadius:'8px', padding:'1.75rem', marginBottom:'1.5rem' }}>
          <div style={{ marginBottom:'1.25rem' }}>
            <label style={s.lbl}>Select Plan *</label>
            <select value={planId} onChange={e=>setPlanId(e.target.value)} style={s.inp}>
              <option value="">— Choose a plan —</option>
              {plans.map(p => <option key={p.id} value={p.id}>{p.exam_name} — {p.name} (₹{p.price_inr})</option>)}
            </select>
          </div>

          <div style={{ marginBottom:'1.25rem' }}>
            <label style={s.lbl}>Student Emails * ({parsed.length} detected)</label>
            <textarea value={emails} onChange={e=>setEmails(e.target.value)} rows={10}
              placeholder={"student1@gmail.com\nstudent2@gmail.com\nstudent3@gmail.com\n\nOne per line, or comma-separated"}
              style={{ ...s.inp, height:'220px', resize:'vertical', fontFamily:"'SF Mono', monospace", fontSize:'0.78rem' }} />
            <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', color:C.gray400, marginTop:'0.375rem' }}>
              Separate by new line, comma, or semicolon. Students without accounts will be listed as "not found".
            </p>
          </div>

          <button onClick={enroll} disabled={loading || !planId || !parsed.length}
            style={{ padding:'0.875rem 2rem', background:loading?C.gray400:C.red, color:'#fff', border:'none', borderRadius:'6px', fontFamily:'var(--font-sans)', fontSize:'0.9rem', fontWeight:'700', cursor:loading?'not-allowed':'pointer' }}>
            {loading ? 'Enrolling…' : 'Enroll ' + parsed.length + ' Students →'}
          </button>
        </div>

        {result && (
          <div style={{ background:C.white, border:'1px solid '+C.border, borderRadius:'8px', padding:'1.75rem' }}>
            <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:C.gray400, marginBottom:'1rem' }}>Results</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginBottom:'1.25rem' }}>
              {[['Enrolled',result.enrolled_count,C.green],['Already Enrolled',result.skipped_count,C.amber],['Not Found',result.not_found?.length||0,C.red]].map(([l,v,c]) => (
                <div key={l} style={{ background:C.bg, borderRadius:'6px', padding:'1rem', textAlign:'center' }}>
                  <p style={{ fontFamily:'Georgia,serif', fontSize:'2rem', fontWeight:'700', color:c, lineHeight:1, marginBottom:'0.25rem' }}>{v}</p>
                  <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', color:C.gray400 }}>{l}</p>
                </div>
              ))}
            </div>
            {result.not_found?.length > 0 && (
              <div style={{ background:'#fff5f5', border:'1px solid #ffd0d0', borderRadius:'4px', padding:'1rem' }}>
                <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'700', color:C.red, marginBottom:'0.5rem' }}>Not Found — no account:</p>
                {result.not_found.map(e => <p key={e} style={{ fontFamily:"'SF Mono',monospace", fontSize:'0.75rem', color:C.gray500 }}>{e}</p>)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const s = {
  lbl: { fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'700', color:'#666', display:'block', marginBottom:'0.375rem' },
  inp: { width:'100%', padding:'0.625rem 0.75rem', fontFamily:'var(--font-sans)', fontSize:'0.875rem', border:'1px solid #e8e8e6', borderRadius:'4px', outline:'none', color:'#0f0f0f', boxSizing:'border-box', background:'#fff' },
}

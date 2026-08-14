/**
 * GRADSKOOL Admin — Coupon Codes
 * Route: /admin-panel/coupons
 */
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import api from '../../lib/api'
import { AdminLayout } from '../../components/admin/AdminLayout'

const C = { red:'#ff5e5f',black:'#0f0f0f',white:'#fff',bg:'#f7f6f3',border:'#e8e8e6',gray50:'#fafaf9',gray400:'#999',gray500:'#666',green:'#22c55e',amber:'#f59e0b' }

function CouponsInner() {
  const [coupons, setCoupons] = useState([])
  const [modal,   setModal]  = useState(false)
  const [form,    setForm]   = useState({ type:'percent', value:10, max_uses:100, active:true })
  const [saving,  setSaving] = useState(false)
  const [msg,     setMsg]    = useState(null)

  const load = () => api.get('/dashboard/coupons/').then(({ data }) => setCoupons(data.coupons||[])).catch(()=>{})
  useEffect(() => { load() }, [])

  const notify = (text, type='success') => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3000) }

  const save = async () => {
    if (!form.code) { notify('Enter a coupon code', 'error'); return }
    setSaving(true)
    try {
      await api.post('/dashboard/coupons/', form)
      notify('Coupon created')
      setModal(false); setForm({ type:'percent', value:10, max_uses:100, active:true })
      load()
    } catch(e) { notify(e.response?.data?.error||'Failed', 'error') }
    finally { setSaving(false) }
  }

  const del = async (id) => {
    if (!confirm('Delete this coupon?')) return
    try { await api.delete('/dashboard/coupons/' + id + '/'); notify('Deleted'); load() }
    catch { notify('Failed', 'error') }
  }

  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <Head><title>Coupons — Admin</title></Head>
      <div style={{ height:'56px', background:C.white, borderBottom:'1px solid '+C.border, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 1.5rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <Link href="/admin-panel" style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', color:C.gray400, textDecoration:'none' }}>← Admin Panel</Link>
          <span style={{ color:C.border }}>|</span>
          <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', color:C.black }}>Coupon Codes</span>
        </div>
        <button onClick={() => setModal(true)} style={{ padding:'0.4rem 1rem', background:C.red, color:'#fff', border:'none', borderRadius:'4px', fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:'700', cursor:'pointer' }}>+ Create Coupon</button>
      </div>
      {msg && <div style={{ position:'fixed', top:'64px', right:'1.5rem', zIndex:999, padding:'0.75rem 1.25rem', borderRadius:'4px', fontFamily:'var(--font-sans)', fontSize:'0.82rem', background:msg.type==='error'?'#fee2e2':'#dcfce7', border:'1px solid '+(msg.type==='error'?'#fca5a5':'#86efac'), color:msg.type==='error'?'#991b1b':'#166534' }}>{msg.text}</div>}

      <div style={{ maxWidth:'900px', margin:'0 auto', padding:'2rem' }}>
        <div style={{ background:'#fff8f0', border:'1px solid #ffe4c0', borderRadius:'6px', padding:'1rem 1.25rem', marginBottom:'1.5rem', fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:'#92400e', lineHeight:1.6 }}>
          <strong>How coupons work:</strong> Students enter the code at checkout. Percent discount reduces the plan price by that %. Flat discount reduces by a fixed amount. Set expiry and max uses to control distribution.
        </div>

        {coupons.length === 0 ? (
          <div style={{ textAlign:'center', padding:'4rem', background:C.white, border:'1px dashed '+C.border, borderRadius:'8px' }}>
            <p style={{ fontSize:'2.5rem', marginBottom:'0.75rem' }}>🎟️</p>
            <p style={{ fontFamily:'Georgia,serif', fontSize:'1.1rem', fontWeight:'700', color:C.black, marginBottom:'0.5rem' }}>No coupons yet</p>
            <p style={{ fontFamily:'Georgia,serif', fontSize:'0.875rem', color:C.gray400, marginBottom:'1.5rem' }}>Create discount codes for referrals, offers, and cohort launches.</p>
            <button onClick={()=>setModal(true)} style={{ padding:'0.75rem 1.5rem', background:C.red, color:'#fff', border:'none', borderRadius:'6px', fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'700', cursor:'pointer' }}>Create First Coupon</button>
          </div>
        ) : (
          <div style={{ background:C.white, border:'1px solid '+C.border, borderRadius:'8px', overflow:'hidden' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr 1fr 1fr 1fr 1fr 80px', gap:'0.5rem', padding:'0.625rem 1.25rem', background:C.gray50, borderBottom:'1px solid '+C.border }}>
              {['Code','Type','Value','Uses','Exam','Expiry',''].map(h => <span key={h} style={{ fontFamily:'var(--font-sans)', fontSize:'0.62rem', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.08em', color:C.gray400 }}>{h}</span>)}
            </div>
            {coupons.map(c => (
              <div key={c.id} style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr 1fr 1fr 1fr 1fr 80px', gap:'0.5rem', padding:'0.875rem 1.25rem', borderBottom:'1px solid '+C.border, alignItems:'center' }}>
                <span style={{ fontFamily:"'SF Mono',monospace", fontSize:'0.875rem', fontWeight:'700', color:C.black, background:C.gray50, padding:'0.2rem 0.5rem', borderRadius:'3px', display:'inline-block' }}>{c.code}</span>
                <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:C.gray500 }}>{c.type}</span>
                <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', color:C.red }}>{c.type==='percent'?c.value+'%':'₹'+c.value}</span>
                <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:C.gray500 }}>{c.uses||0}/{c.max_uses}</span>
                <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', color:C.gray400 }}>{c.exam_slug||'All'}</span>
                <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:C.gray400 }}>{c.expiry||'No expiry'}</span>
                <button onClick={()=>del(c.id)} style={{ padding:'0.3rem 0.625rem', background:'#fff', border:'1px solid #fca5a5', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.72rem', cursor:'pointer', color:C.red }}>Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }} onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div style={{ background:C.white, borderRadius:'8px', width:'100%', maxWidth:'480px', padding:'2rem', boxShadow:'0 24px 64px rgba(0,0,0,0.25)' }}>
            <p style={{ fontFamily:'Georgia,serif', fontSize:'1.25rem', fontWeight:'700', color:C.black, marginBottom:'1.5rem' }}>Create Coupon</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
              <Fld label="Coupon Code *" value={form.code||''} onChange={v=>setForm(f=>({...f,code:v.toUpperCase().replace(/[^A-Z0-9]/g,'')}))} placeholder="e.g. GRADSKOOL20" />
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                <div>
                  <label style={s.lbl}>Type</label>
                  <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} style={s.inp}>
                    <option value="percent">Percent (%)</option>
                    <option value="flat">Flat (₹)</option>
                  </select>
                </div>
                <Fld label={form.type==='percent'?'Discount %':'Discount ₹'} value={form.value||''} onChange={v=>setForm(f=>({...f,value:v}))} type="number" />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                <Fld label="Max Uses" value={form.max_uses||''} onChange={v=>setForm(f=>({...f,max_uses:v}))} type="number" />
                <div>
                  <label style={s.lbl}>Expiry (optional)</label>
                  <input type="date" value={form.expiry||''} onChange={e=>setForm(f=>({...f,expiry:e.target.value}))} style={s.inp} />
                </div>
              </div>
              <div>
                <label style={s.lbl}>Exam (optional — blank = all)</label>
                <select value={form.exam_slug||''} onChange={e=>setForm(f=>({...f,exam_slug:e.target.value}))} style={s.inp}>
                  <option value="">All Exams</option>
                  {['cat','xat','snap','nmat','gmat','gre','ipmat','cmat','mhcet','clat','cuet'].map(e=><option key={e} value={e}>{e.toUpperCase()}</option>)}
                </select>
              </div>
              <Fld label="Description (internal note)" value={form.description||''} onChange={v=>setForm(f=>({...f,description:v}))} placeholder="e.g. Referral coupon for Arjun batch" />
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.75rem', marginTop:'1.5rem', paddingTop:'1rem', borderTop:'1px solid '+C.border }}>
              <button onClick={()=>{setModal(false);setForm({type:'percent',value:10,max_uses:100,active:true})}} style={{ padding:'0.625rem 1.25rem', border:'1px solid '+C.border, borderRadius:'4px', background:C.white, fontFamily:'var(--font-sans)', fontSize:'0.82rem', cursor:'pointer', color:C.gray500 }}>Cancel</button>
              <button onClick={save} disabled={saving||!form.code} style={{ padding:'0.625rem 1.5rem', background:saving?C.gray400:C.red, color:'#fff', border:'none', borderRadius:'4px', fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', cursor:saving?'not-allowed':'pointer' }}>{saving?'Creating…':'Create Coupon'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Fld({ label, value, onChange, placeholder, type='text' }) {
  return (
    <div>
      {label && <label style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'700', color:'#666', display:'block', marginBottom:'0.25rem' }}>{label}</label>}
      <input type={type} value={value||''} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{ width:'100%', padding:'0.5rem 0.625rem', fontFamily:'var(--font-sans)', fontSize:'0.82rem', border:'1px solid #e8e8e6', borderRadius:'4px', outline:'none', color:'#0f0f0f', boxSizing:'border-box' }} />
    </div>
  )
}

const s = {
  lbl: { fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'700', color:'#666', display:'block', marginBottom:'0.25rem' },
  inp: { width:'100%', padding:'0.5rem 0.625rem', fontFamily:'var(--font-sans)', fontSize:'0.875rem', border:'1px solid #e8e8e6', borderRadius:'4px', outline:'none', color:'#0f0f0f', boxSizing:'border-box', background:'#fff' },
}


export default function Coupons(props) {
  return (
    <AdminLayout title="Coupons">
      <CouponsInner {...props} />
    </AdminLayout>
  )
}

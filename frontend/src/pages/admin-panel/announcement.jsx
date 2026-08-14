/**
 * GRADSKOOL Admin — Announcement Banner
 * Route: /admin-panel/announcement
 */
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import api from '../../lib/api'
import { AdminLayout } from '../../components/admin/AdminLayout'

const C = { red:'#ff5e5f',black:'#0f0f0f',white:'#fff',bg:'#f7f6f3',border:'#e8e8e6',gray400:'#999',gray500:'#666',green:'#22c55e' }

function AnnouncementInner() {
  const [form,  setForm]  = useState({ text:'', active:false, link:'', color:'#0f0f0f' })
  const [saving,setSaving]= useState(false)
  const [msg,   setMsg]   = useState(null)

  useEffect(() => {
    api.get('/dashboard/announcement/').then(({ data }) => setForm(data)).catch(()=>{})
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      await api.post('/dashboard/announcement/', form)
      setMsg({ type:'success', text:form.active?'Announcement is now live!':'Announcement saved (hidden)' })
      setTimeout(() => setMsg(null), 3000)
    } catch(e) { setMsg({ type:'error', text:e.response?.data?.error||'Failed' }) }
    finally { setSaving(false) }
  }

  const presets = [
    { label:'Black', color:'#0f0f0f' },
    { label:'Red', color:'#ff5e5f' },
    { label:'Dark Blue', color:'#1e3a5f' },
    { label:'Green', color:'#166534' },
    { label:'Amber', color:'#92400e' },
    { label:'Purple', color:'#4c1d95' },
  ]

  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <Head><title>Announcement — Admin</title></Head>
      <div style={{ height:'56px', background:C.white, borderBottom:'1px solid '+C.border, display:'flex', alignItems:'center', padding:'0 1.5rem', gap:'1rem' }}>
        <Link href="/admin-panel" style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', color:C.gray400, textDecoration:'none' }}>← Admin Panel</Link>
        <span style={{ color:C.border }}>|</span>
        <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', color:C.black }}>Announcement Banner</span>
      </div>
      {msg && <div style={{ position:'fixed', top:'64px', right:'1.5rem', zIndex:999, padding:'0.75rem 1.25rem', borderRadius:'4px', fontFamily:'var(--font-sans)', fontSize:'0.82rem', background:msg.type==='error'?'#fee2e2':'#dcfce7', border:'1px solid '+(msg.type==='error'?'#fca5a5':'#86efac'), color:msg.type==='error'?'#991b1b':'#166534' }}>{msg.text}</div>}

      <div style={{ maxWidth:'700px', margin:'0 auto', padding:'2rem' }}>
        <div style={{ marginBottom:'2rem' }}>
          <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.7rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:C.red, marginBottom:'0.375rem' }}>Site-wide</p>
          <h1 style={{ fontFamily:'Georgia,serif', fontSize:'1.75rem', fontWeight:'700', color:C.black, marginBottom:'0.5rem' }}>Announcement Banner</h1>
          <p style={{ fontFamily:'Georgia,serif', fontSize:'0.875rem', color:C.gray400 }}>Shows at the top of every page for all logged-in students. Use for mock drops, session reminders, urgent announcements.</p>
        </div>

        {/* Live preview */}
        {form.text && (
          <div style={{ marginBottom:'1.5rem' }}>
            <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.08em', color:C.gray400, marginBottom:'0.5rem' }}>Preview</p>
            <div style={{ background:form.color||C.black, padding:'0.625rem 1.5rem', display:'flex', alignItems:'center', justifyContent:'center', gap:'1rem', borderRadius:'4px' }}>
              <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:'#fff', fontWeight:'500' }}>{form.text}</span>
              {form.link && <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:'rgba(255,255,255,0.7)', fontWeight:'700' }}>→</span>}
            </div>
          </div>
        )}

        <div style={{ background:C.white, border:'1px solid '+C.border, borderRadius:'8px', padding:'1.75rem' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
            <div>
              <label style={s.lbl}>Message *</label>
              <input value={form.text||''} onChange={e=>setForm(f=>({...f,text:e.target.value}))} placeholder="e.g. Mock 8 drops tomorrow! Check your Testfunda credentials →" style={s.inp} />
              <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', color:C.gray400, marginTop:'0.25rem' }}>Keep it under 100 characters. Use → at the end if you have a link.</p>
            </div>

            <div>
              <label style={s.lbl}>Link (optional)</label>
              <input value={form.link||''} onChange={e=>setForm(f=>({...f,link:e.target.value}))} placeholder="e.g. /courses/cat/mocks" style={s.inp} />
            </div>

            <div>
              <label style={s.lbl}>Background Color</label>
              <div style={{ display:'flex', gap:'0.625rem', flexWrap:'wrap', marginTop:'0.375rem' }}>
                {presets.map(p => (
                  <button key={p.color} onClick={()=>setForm(f=>({...f,color:p.color}))}
                    style={{ padding:'0.4rem 0.875rem', background:p.color, color:'#fff', border:form.color===p.color?'2px solid #333':'2px solid transparent', borderRadius:'4px', fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'600', cursor:'pointer' }}>
                    {p.label}
                  </button>
                ))}
                <input type="color" value={form.color||'#0f0f0f'} onChange={e=>setForm(f=>({...f,color:e.target.value}))}
                  style={{ width:'40px', height:'34px', border:'1px solid '+C.border, borderRadius:'4px', cursor:'pointer', padding:'1px' }} />
              </div>
            </div>

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:'1rem', borderTop:'1px solid '+C.border }}>
              <label style={{ display:'flex', alignItems:'center', gap:'0.625rem', cursor:'pointer' }}>
                <div onClick={()=>setForm(f=>({...f,active:!f.active}))}
                  style={{ width:'44px', height:'24px', borderRadius:'100px', background:form.active?C.green:'#d1d5db', position:'relative', transition:'background 0.2s', flexShrink:0, cursor:'pointer' }}>
                  <div style={{ width:'20px', height:'20px', borderRadius:'50%', background:'#fff', position:'absolute', top:'2px', left:form.active?'22px':'2px', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
                <div>
                  <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', color:C.black }}>{form.active?'Banner is LIVE':'Banner is hidden'}</p>
                  <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', color:C.gray400 }}>{form.active?'All students see this now':'Toggle on to show students'}</p>
                </div>
              </label>
              <button onClick={save} disabled={saving||!form.text}
                style={{ padding:'0.75rem 2rem', background:saving?C.gray400:form.active?C.green:C.red, color:'#fff', border:'none', borderRadius:'6px', fontFamily:'var(--font-sans)', fontSize:'0.9rem', fontWeight:'700', cursor:saving?'not-allowed':'pointer' }}>
                {saving?'Saving…':form.active?'Publish Banner':'Save (Hidden)'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const s = {
  lbl: { fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'700', color:'#666', display:'block', marginBottom:'0.375rem' },
  inp: { width:'100%', padding:'0.625rem 0.75rem', fontFamily:'var(--font-sans)', fontSize:'0.875rem', border:'1px solid #e8e8e6', borderRadius:'4px', outline:'none', color:'#0f0f0f', boxSizing:'border-box' },
}


export default function Announcement(props) {
  return (
    <AdminLayout title="Announcement">
      <AnnouncementInner {...props} />
    </AdminLayout>
  )
}

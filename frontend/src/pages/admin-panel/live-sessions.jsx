/**
 * GRADSKOOL Admin — Live Session Manager
 * Route: /admin-panel/live-sessions
 */
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import api from '../../lib/api'
import { AdminLayout } from '../../components/admin/AdminLayout'

const C = { red:'#ff5e5f',black:'#0f0f0f',white:'#fff',bg:'#f7f6f3',border:'#e8e8e6',gray50:'#fafaf9',gray400:'#999',gray500:'#666',green:'#22c55e',amber:'#f59e0b',blue:'#3b82f6',purple:'#7b2d8b' }
const STATUS_COLORS = { upcoming:C.blue, live:'#dc2626', completed:C.green, cancelled:C.gray400 }

export default function LiveSessions() {
  const [sessions, setSessions] = useState([])
  const [topics,   setTopics]   = useState([])
  const [exam,     setExam]     = useState('cat')
  const [loading,  setLoad]     = useState(true)
  const [modal,    setModal]    = useState(null)
  const [form,     setForm]     = useState({})
  const [saving,   setSaving]   = useState(false)
  const [msg,      setMsg]      = useState(null)

  useEffect(() => {
    setLoad(true)
    api.get('/dashboard/live-sessions/?exam=' + exam)
      .then(({ data }) => setSessions(data.sessions || []))
      .catch(() => setSessions([]))
      .finally(() => setLoad(false))
  }, [exam])

  useEffect(() => {
    // Load topics for the selected exam for the form
    api.get('/dashboard/curriculum/?exam=' + exam)
      .then(({ data }) => {
        const all = (data.sections || []).flatMap(s => (s.topics||[]).map(t => ({ id:t.id, title:s.short_title + ' — ' + t.title })))
        setTopics(all)
      }).catch(() => setTopics([]))
  }, [exam])

  const notify = (text, type='success') => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3000) }

  const save = async () => {
    setSaving(true)
    try {
      if (form.id) {
        await api.put('/dashboard/live-sessions/' + form.id + '/', form)
        notify('Session updated')
      } else {
        await api.post('/dashboard/live-sessions/', form)
        notify('Session created')
      }
      const { data } = await api.get('/dashboard/live-sessions/?exam=' + exam)
      setSessions(data.sessions || [])
      setModal(null); setForm({})
    } catch(e) { notify(e.response?.data?.error||'Failed', 'error') }
    finally { setSaving(false) }
  }

  const del = async (id) => {
    if (!confirm('Delete this session?')) return
    try {
      await api.delete('/dashboard/live-sessions/' + id + '/')
      setSessions(s => s.filter(x => x.id !== id))
      notify('Deleted')
    } catch { notify('Failed', 'error') }
  }

  const uploadRecording = async (sessionId) => {
    try {
      const { data } = await api.post('/learn/live-sessions/' + sessionId + '/upload-recording/', {})
      notify(data.message || 'Upload started — check back in a few minutes')
      // Poll status
      const poll = setInterval(async () => {
        try {
          const { data: st } = await api.get('/learn/live-sessions/' + sessionId + '/recording-status/')
          if (st.recording_available) {
            clearInterval(poll)
            notify('✓ Recording is live on Bunny Stream!')
            const { data: updated } = await api.get('/dashboard/live-sessions/?exam=' + exam)
            setSessions(updated.sessions || [])
          }
        } catch { clearInterval(poll) }
      }, 8000) // check every 8 seconds
      setTimeout(() => clearInterval(poll), 600000) // stop after 10 min
    } catch(e) {
      // If Zoom not configured, show modal to paste URL directly
      const url = prompt('Zoom not configured. Paste the recording download URL directly:')
      if (url) {
        try {
          const { data } = await api.post('/learn/live-sessions/' + sessionId + '/upload-recording/', { recording_url: url })
          notify(data.message || 'Upload started')
        } catch { notify('Failed to start upload', 'error') }
      }
    }
  }

  const upcoming = sessions.filter(s => s.status === 'upcoming' || s.status === 'live')
  const past      = sessions.filter(s => s.status === 'completed' || s.status === 'cancelled')

  return (
    <AdminLayout title="Live Sessions">
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <Head><title>Live Sessions — Admin</title></Head>
      <div style={{ height:'56px', background:C.white, borderBottom:'1px solid '+C.border, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 1.5rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <Link href="/admin-panel" style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', color:C.gray400, textDecoration:'none' }}>← Admin Panel</Link>
          <span style={{ color:C.border }}>|</span>
          <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', color:C.black }}>Live Sessions</span>
        </div>
        <div style={{ display:'flex', gap:'0.75rem', alignItems:'center' }}>
          <select value={exam} onChange={e=>setExam(e.target.value)} style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', padding:'0.35rem 0.625rem', border:'1px solid '+C.border, borderRadius:'4px', cursor:'pointer', background:C.white }}>
            {['cat','xat','snap','nmat','gmat','gre','ipmat','cmat','mhcet','clat','cuet'].map(e => <option key={e} value={e}>{e.toUpperCase()}</option>)}
          </select>
          <button onClick={() => { setForm({ status:'upcoming', duration_mins:90 }); setModal('session') }}
            style={{ padding:'0.4rem 1rem', background:C.red, color:'#fff', border:'none', borderRadius:'4px', fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:'700', cursor:'pointer' }}>
            + Schedule Session
          </button>
        </div>
      </div>
      {msg && <div style={{ position:'fixed', top:'64px', right:'1.5rem', zIndex:999, padding:'0.75rem 1.25rem', borderRadius:'4px', fontFamily:'var(--font-sans)', fontSize:'0.82rem', background:msg.type==='error'?'#fee2e2':'#dcfce7', border:'1px solid '+(msg.type==='error'?'#fca5a5':'#86efac'), color:msg.type==='error'?'#991b1b':'#166534' }}>{msg.text}</div>}

      <div style={{ maxWidth:'900px', margin:'0 auto', padding:'2rem' }}>
        {loading ? <p style={{ textAlign:'center', color:C.gray400, fontFamily:'Georgia,serif', padding:'4rem' }}>Loading…</p> : (
          <>
            <Section title="Upcoming & Live" sessions={upcoming} onEdit={s=>{setForm(s);setModal('session')}} onDelete={del} onUploadRecording={uploadRecording} />
            <Section title="Past Sessions" sessions={past} onEdit={s=>{setForm(s);setModal('session')}} onDelete={del} onUploadRecording={uploadRecording} />
            {sessions.length === 0 && (
              <div style={{ textAlign:'center', padding:'4rem', border:'1px dashed '+C.border, borderRadius:'8px', background:C.white }}>
                <p style={{ fontSize:'2.5rem', marginBottom:'0.75rem' }}>📡</p>
                <p style={{ fontFamily:'Georgia,serif', fontSize:'1.1rem', fontWeight:'700', color:C.black, marginBottom:'0.375rem' }}>No sessions yet</p>
                <p style={{ fontFamily:'Georgia,serif', fontSize:'0.875rem', color:C.gray400, marginBottom:'1.5rem' }}>Schedule a live session for any topic in the {exam.toUpperCase()} curriculum.</p>
                <button onClick={() => { setForm({ status:'upcoming', duration_mins:90 }); setModal('session') }}
                  style={{ padding:'0.75rem 1.5rem', background:C.red, color:'#fff', border:'none', borderRadius:'6px', fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'700', cursor:'pointer' }}>
                  + Schedule First Session
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {modal === 'session' && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }} onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div style={{ background:C.white, borderRadius:'8px', width:'100%', maxWidth:'540px', maxHeight:'90vh', overflowY:'auto', padding:'2rem', boxShadow:'0 24px 64px rgba(0,0,0,0.25)' }}>
            <p style={{ fontFamily:'Georgia,serif', fontSize:'1.25rem', fontWeight:'700', color:C.black, marginBottom:'1.5rem' }}>{form.id?'Edit Session':'Schedule Session'}</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
              <F label="Session Title *" value={form.title||''} onChange={v=>setForm(f=>({...f,title:v}))} placeholder="e.g. RC Strategy — Live Q&A" />
              <div>
                <label style={s.lbl}>Topic *</label>
                <select value={form.topic_id||''} onChange={e=>setForm(f=>({...f,topic_id:e.target.value}))} style={s.inp}>
                  <option value="">— Select topic —</option>
                  {topics.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                <div>
                  <label style={s.lbl}>Scheduled At *</label>
                  <input type="datetime-local" value={form.scheduled_at||''} onChange={e=>setForm(f=>({...f,scheduled_at:e.target.value}))} style={s.inp} />
                </div>
                <F label="Duration (mins)" value={form.duration_mins||90} onChange={v=>setForm(f=>({...f,duration_mins:v}))} type="number" />
              </div>
              <F label="Meet Link (Zoom/Google Meet)" value={form.meet_link||''} onChange={v=>setForm(f=>({...f,meet_link:v}))} placeholder="https://zoom.us/j/..." />
              <div>
                <label style={s.lbl}>Status</label>
                <select value={form.status||'upcoming'} onChange={e=>setForm(f=>({...f,status:e.target.value}))} style={s.inp}>
                  <option value="upcoming">Upcoming</option>
                  <option value="live">Live Now</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              {(form.status==='completed') && (
                <F label="Recording URL (optional)" value={form.recording_url||''} onChange={v=>setForm(f=>({...f,recording_url:v}))} placeholder="https://..." />
              )}
              <F label="Description (optional)" value={form.description||''} onChange={v=>setForm(f=>({...f,description:v}))} placeholder="What this session covers..." textarea />
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.75rem', marginTop:'1.5rem', paddingTop:'1rem', borderTop:'1px solid '+C.border }}>
              <button onClick={()=>{setModal(null);setForm({})}} style={{ padding:'0.625rem 1.25rem', border:'1px solid '+C.border, borderRadius:'4px', background:C.white, fontFamily:'var(--font-sans)', fontSize:'0.82rem', cursor:'pointer', color:C.gray500 }}>Cancel</button>
              <button onClick={save} disabled={saving||!form.title||!form.topic_id||!form.scheduled_at}
                style={{ padding:'0.625rem 1.5rem', background:saving?C.gray400:C.red, color:'#fff', border:'none', borderRadius:'4px', fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', cursor:saving?'not-allowed':'pointer' }}>
                {saving?'Saving…':form.id?'Update Session':'Schedule Session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </AdminLayout>
  )
}

function Section({ title, sessions, onEdit, onDelete, onUploadRecording }) {
  if (!sessions.length) return null
  const STATUS_C = { upcoming:'#3b82f6', live:'#dc2626', completed:'#22c55e', cancelled:'#999' }
  return (
    <div style={{ marginBottom:'2rem' }}>
      <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.7rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:'#999', marginBottom:'0.875rem' }}>{title}</p>
      {sessions.map(s => (
        <div key={s.id} style={{ background:'#fff', border:'1px solid #e8e8e6', borderRadius:'8px', padding:'1.25rem', marginBottom:'0.75rem', display:'flex', gap:'1rem', alignItems:'flex-start' }}>
          <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:STATUS_C[s.status]||'#999', flexShrink:0, marginTop:'0.375rem' }} />
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontFamily:'Georgia,serif', fontSize:'1rem', fontWeight:'700', color:'#0f0f0f', marginBottom:'0.2rem' }}>{s.title}</p>
            <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', color:'#666', marginBottom:'0.375rem' }}>
              {s.topic_title} · {s.exam_name}
            </p>
            <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:'#999' }}>
              {new Date(s.scheduled_at).toLocaleString('en-IN',{dateStyle:'full',timeStyle:'short'})} · {s.duration_mins} min
            </p>
            <div style={{ display:'flex', gap:'0.5rem', marginTop:'0.375rem', flexWrap:'wrap' }}>
              <a href={'/live/' + s.id} target="_blank" rel="noreferrer"
                style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'700', color:'#fff', background:'#22c55e', padding:'0.2rem 0.625rem', borderRadius:'3px', textDecoration:'none' }}>
                🎥 Open Live Room
              </a>
              {s.meet_link && <a href={s.meet_link} target="_blank" rel="noreferrer" style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:'#3b82f6', fontWeight:'700' }}>Zoom Link ↗</a>}
            </div>
          </div>
          <div style={{ display:'flex', gap:'0.5rem', flexShrink:0, flexWrap:'wrap' }}>
            {(s.status === 'completed' || s.status === 'live') && !s.recording_available && (
              <button onClick={()=>onUploadRecording(s.id)}
                style={{ padding:'0.35rem 0.75rem', background:'#7b2d8b', color:'#fff', border:'none', borderRadius:'4px', fontFamily:'var(--font-sans)', fontSize:'0.72rem', cursor:'pointer', fontWeight:'700' }}>
                {s.recording_processing ? '⏳ Processing…' : '⬆ Upload to Bunny'}
              </button>
            )}
            {s.recording_available && s.bunny_video_id && (
              <span style={{ padding:'0.35rem 0.75rem', background:'#dcfce7', border:'1px solid #86efac', borderRadius:'4px', fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:'#166534', fontWeight:'700' }}>
                ✓ Recording Ready
              </span>
            )}
            <button onClick={()=>onEdit(s)} style={{ padding:'0.35rem 0.75rem', background:'#fff', border:'1px solid #e8e8e6', borderRadius:'4px', fontFamily:'var(--font-sans)', fontSize:'0.72rem', cursor:'pointer' }}>✎ Edit</button>
            <button onClick={()=>onDelete(s.id)} style={{ padding:'0.35rem 0.75rem', background:'#fff', border:'1px solid #fca5a5', borderRadius:'4px', fontFamily:'var(--font-sans)', fontSize:'0.72rem', cursor:'pointer', color:'#ff5e5f' }}>✕</button>
          </div>
        </div>
      ))}
    </div>
  )
}

function F({ label, value, onChange, placeholder, textarea, type='text' }) {
  return (
    <div>
      {label && <label style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'700', color:'#666', display:'block', marginBottom:'0.25rem' }}>{label}</label>}
      {textarea
        ? <textarea value={value||''} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{ width:'100%', padding:'0.5rem 0.625rem', fontFamily:'var(--font-sans)', fontSize:'0.82rem', border:'1px solid #e8e8e6', borderRadius:'4px', outline:'none', color:'#0f0f0f', boxSizing:'border-box', height:'80px', resize:'vertical' }} />
        : <input type={type} value={value||''} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{ width:'100%', padding:'0.5rem 0.625rem', fontFamily:'var(--font-sans)', fontSize:'0.82rem', border:'1px solid #e8e8e6', borderRadius:'4px', outline:'none', color:'#0f0f0f', boxSizing:'border-box' }} />}
    </div>
  )
}

const s = {
  lbl: { fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'700', color:'#666', display:'block', marginBottom:'0.25rem' },
  inp: { width:'100%', padding:'0.5rem 0.625rem', fontFamily:'var(--font-sans)', fontSize:'0.875rem', border:'1px solid #e8e8e6', borderRadius:'4px', outline:'none', color:'#0f0f0f', boxSizing:'border-box', background:'#fff' },
}

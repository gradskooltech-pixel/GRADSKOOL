/**
 * GRADSKOOL Admin — Video Library
 * Route: /admin-panel/video-library
 *
 * Central repository of all Bunny/YouTube videos.
 * One video can be attached to multiple topics across multiple courses.
 * Admin uploads to Bunny externally, pastes the ID here once, reuses everywhere.
 */
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import api from '../../lib/api'
import { AdminLayout } from '../../components/admin/AdminLayout'

const C = { red:'#ff5e5f',black:'#0f0f0f',white:'#fff',bg:'#f7f6f3',border:'#e8e8e6',gray50:'#fafaf9',gray400:'#999',gray500:'#666',green:'#22c55e',amber:'#f59e0b',blue:'#3b82f6' }
const EXAMS = ['','cat','xat','snap','nmat','gmat','gre','ipmat','cmat','mhcet','clat','cuet']

export default function VideoLibraryPage() {
  const [videos,  setVideos]  = useState([])
  const [loading, setLoad]    = useState(true)
  const [search,  setSearch]  = useState('')
  const [exam,    setExam]    = useState('')
  const [source,  setSource]  = useState('')
  const [modal,   setModal]   = useState(null)  // null | 'add' | 'edit' | 'attach'
  const [form,    setForm]    = useState({})
  const [saving,  setSaving]  = useState(false)
  const [msg,     setMsg]     = useState(null)
  const [selected,setSelected]= useState(null)  // video being attached

  // Topics for attach modal
  const [curriculum,setCurriculum] = useState([])

  const load = () => {
    setLoad(true)
    const params = new URLSearchParams()
    if (exam)   params.set('exam', exam)
    if (source) params.set('source', source)
    if (search) params.set('search', search)
    api.get('/dashboard/video-library/?' + params.toString())
      .then(({ data }) => setVideos(data.videos || []))
      .catch(() => setVideos([]))
      .finally(() => setLoad(false))
  }

  useEffect(() => { load() }, [exam, source])

  const notify = (text, type='success') => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3000) }

  const save = async () => {
    if (!form.title) { notify('Title required', 'error'); return }
    setSaving(true)
    try {
      if (form.id) {
        await api.put('/dashboard/video-library/' + form.id + '/', form)
        notify('Video updated')
      } else {
        await api.post('/dashboard/video-library/', form)
        notify('Video added to library')
      }
      setModal(null); setForm({}); load()
    } catch(e) { notify(e.response?.data?.error || 'Failed', 'error') }
    finally { setSaving(false) }
  }

  const del = async (v) => {
    if (v.usage_count > 0) {
      alert('This video is used in ' + v.usage_count + ' topic(s). Remove from all topics first.')
      return
    }
    if (!confirm('Delete "' + v.title + '"?')) return
    try { await api.delete('/dashboard/video-library/' + v.id + '/'); notify('Deleted'); load() }
    catch(e) { notify(e.response?.data?.error || 'Failed', 'error') }
  }

  const openAttach = async (video) => {
    setSelected(video)
    // Load curriculum for attach selector
    api.get('/dashboard/curriculum/?exam=' + (video.exam_slug || 'cat'))
      .then(({ data }) => setCurriculum(data.sections || []))
      .catch(() => setCurriculum([]))
    setForm({ title: video.title, has_cheatsheet: true, has_quiz: false, has_live: false, quiz_duration_mins: 40, quiz_question_count: 10, difficulty: 'beginner' })
    setModal('attach')
  }

  const attach = async () => {
    if (!form.topic_id) { notify('Select a topic', 'error'); return }
    setSaving(true)
    try {
      await api.post('/dashboard/video-library/' + selected.id + '/attach/', form)
      notify('Video attached to topic!')
      setModal(null); setForm({}); load()
    } catch(e) { notify(e.response?.data?.error || 'Failed', 'error') }
    finally { setSaving(false) }
  }

  const filtered = search
    ? videos.filter(v => v.title.toLowerCase().includes(search.toLowerCase()) || v.tags?.toLowerCase().includes(search.toLowerCase()))
    : videos

  return (
    <AdminLayout title="Video Library">
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <Head><title>Video Library — Admin — GRADSKOOL</title></Head>

      <div style={{ height:'56px', background:C.white, borderBottom:'1px solid '+C.border, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 1.5rem', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <Link href="/admin-panel" style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', color:C.gray400, textDecoration:'none' }}>← Admin</Link>
          <span style={{ color:C.border }}>|</span>
          <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', color:C.black }}>Video Library</span>
          <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:C.gray400, background:C.bg, padding:'0.1rem 0.5rem', borderRadius:'100px' }}>{filtered.length}</span>
        </div>
        <button onClick={() => { setForm({ video_source:'bunny', is_published:true }); setModal('add') }}
          style={{ padding:'0.4rem 1rem', background:C.red, color:'#fff', border:'none', borderRadius:'4px', fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:'700', cursor:'pointer' }}>
          + Add Video
        </button>
      </div>

      {msg && <div style={{ position:'fixed', top:'64px', right:'1.5rem', zIndex:999, padding:'0.75rem 1.25rem', borderRadius:'4px', fontFamily:'var(--font-sans)', fontSize:'0.82rem', background:msg.type==='error'?'#fee2e2':'#dcfce7', border:'1px solid '+(msg.type==='error'?'#fca5a5':'#86efac'), color:msg.type==='error'?'#991b1b':'#166534' }}>{msg.text}</div>}

      <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'2rem' }}>
        {/* Info banner */}
        <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:'6px', padding:'1rem 1.25rem', marginBottom:'1.5rem', fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:'#1d4ed8', lineHeight:1.6 }}>
          <strong>How reuse works:</strong> Add a Bunny video once. Then use "Attach to Topic" to add it to any number of topics across any courses.
          The same video can appear in CAT 2026 Live Cohort AND CAT 2025 Crash Course simultaneously.
          Edit the video title/ID here and it updates everywhere.
        </div>

        {/* Search + filters */}
        <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1.5rem', flexWrap:'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key==='Enter'&&load()} placeholder="Search by title or tag..."
            style={{ flex:'1', minWidth:'200px', padding:'0.5rem 0.75rem', fontFamily:'var(--font-sans)', fontSize:'0.82rem', border:'1px solid '+C.border, borderRadius:'4px', outline:'none' }} />
          <select value={exam} onChange={e => setExam(e.target.value)} style={s.sel}>
            {EXAMS.map(e => <option key={e} value={e}>{e ? e.toUpperCase() : 'All Exams'}</option>)}
          </select>
          <select value={source} onChange={e => setSource(e.target.value)} style={s.sel}>
            <option value="">All Sources</option>
            <option value="bunny">Bunny Stream</option>
            <option value="youtube">YouTube</option>
          </select>
          <button onClick={load} style={{ padding:'0.5rem 1rem', background:C.black, color:'#fff', border:'none', borderRadius:'4px', fontFamily:'var(--font-sans)', fontSize:'0.78rem', cursor:'pointer' }}>Search</button>
        </div>

        {loading ? (
          <p style={{ textAlign:'center', color:C.gray400, fontFamily:'Georgia,serif', padding:'4rem' }}>Loading library…</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'4rem', background:C.white, border:'1px dashed '+C.border, borderRadius:'8px' }}>
            <p style={{ fontSize:'2.5rem', marginBottom:'0.75rem' }}>🎬</p>
            <p style={{ fontFamily:'Georgia,serif', fontSize:'1.1rem', fontWeight:'700', color:C.black, marginBottom:'0.5rem' }}>No videos yet</p>
            <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.875rem', color:C.gray400, marginBottom:'1.5rem' }}>
              Upload to Bunny Stream first, then paste the video ID here.
            </p>
            <button onClick={() => { setForm({ video_source:'bunny', is_published:true }); setModal('add') }}
              style={{ padding:'0.75rem 1.5rem', background:C.red, color:'#fff', border:'none', borderRadius:'6px', fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'700', cursor:'pointer' }}>
              + Add First Video
            </button>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'0.625rem' }}>
            {/* Table header */}
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 80px 120px 160px', gap:'0.5rem', padding:'0.5rem 1rem', background:C.gray50, borderRadius:'4px' }}>
              {['Title','Exam','Source','Duration','Used In','Actions'].map(h => (
                <span key={h} style={{ fontFamily:'var(--font-sans)', fontSize:'0.62rem', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.08em', color:C.gray400 }}>{h}</span>
              ))}
            </div>

            {filtered.map(v => (
              <div key={v.id} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 80px 120px 160px', gap:'0.5rem', padding:'0.75rem 1rem', background:C.white, border:'1px solid '+C.border, borderRadius:'6px', alignItems:'center' }}>
                <div>
                  <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'600', color:C.black, marginBottom:'0.15rem' }}>{v.title}</p>
                  {v.tags && <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.62rem', color:C.gray400 }}>{v.tags}</p>}
                  <p style={{ fontFamily:"'SF Mono',monospace", fontSize:'0.62rem', color:C.blue }}>{v.bunny_video_id || v.youtube_video_id || '—'}</p>
                </div>
                <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', color:C.gray500 }}>{v.exam || '—'}</span>
                <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'700', padding:'0.15rem 0.5rem', borderRadius:'3px',
                  background:v.video_source==='bunny'?'#eff6ff':'#fff7ed',
                  color:v.video_source==='bunny'?C.blue:C.amber }}>
                  {v.video_source}
                </span>
                <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', color:C.gray500 }}>{v.duration_display || '—'}</span>
                <div>
                  {v.usage_count === 0 ? (
                    <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', color:C.gray400 }}>Not used</span>
                  ) : (
                    <div>
                      <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'700', color:C.green }}>{v.usage_count} topic{v.usage_count!==1?'s':''}</span>
                      <div style={{ marginTop:'0.2rem' }}>
                        {v.used_in?.slice(0,2).map((u,i) => (
                          <p key={i} style={{ fontFamily:'var(--font-sans)', fontSize:'0.6rem', color:C.gray400, lineHeight:1.3 }}>{u.course} → {u.topic}</p>
                        ))}
                        {v.used_in?.length > 2 && <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.6rem', color:C.gray400 }}>+{v.used_in.length-2} more</p>}
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ display:'flex', gap:'0.375rem', flexWrap:'wrap' }}>
                  <button onClick={() => openAttach(v)}
                    style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', padding:'0.25rem 0.5rem', background:'#f0fdf4', border:'1px solid #86efac', borderRadius:'3px', cursor:'pointer', color:C.green, whiteSpace:'nowrap' }}>
                    + Attach
                  </button>
                  <button onClick={() => { setForm({ ...v, duration_mins: Math.round((v.duration_secs||0)/60) }); setModal('edit') }}
                    style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', padding:'0.25rem 0.5rem', background:C.white, border:'1px solid '+C.border, borderRadius:'3px', cursor:'pointer', color:C.gray500 }}>
                    ✎
                  </button>
                  <button onClick={() => del(v)}
                    style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', padding:'0.25rem 0.5rem', background:C.white, border:'1px solid #fca5a5', borderRadius:'3px', cursor:'pointer', color:C.red }}>
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }} onClick={e=>e.target===e.currentTarget&&(setModal(null),setForm({}))}>
          <div style={{ background:C.white, borderRadius:'8px', width:'100%', maxWidth:'520px', padding:'2rem', boxShadow:'0 24px 64px rgba(0,0,0,0.25)' }}>
            <p style={s.mTitle}>{modal==='add'?'Add Video to Library':'Edit Video'}</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
              <F label="Title *" value={form.title||''} onChange={v=>setForm(f=>({...f,title:v}))} placeholder="e.g. RC Strategy — How to Read Faster" />
              <div>
                <label style={s.lbl}>Source</label>
                <select value={form.video_source||'bunny'} onChange={e=>setForm(f=>({...f,video_source:e.target.value}))} style={s.inp}>
                  <option value="bunny">Bunny Stream</option>
                  <option value="youtube">YouTube (free preview)</option>
                </select>
              </div>
              {form.video_source !== 'youtube'
                ? <F label="Bunny Video ID" value={form.bunny_video_id||''} onChange={v=>setForm(f=>({...f,bunny_video_id:v}))} placeholder="e.g. a1b2c3d4-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
                : <F label="YouTube Video ID" value={form.youtube_video_id||''} onChange={v=>setForm(f=>({...f,youtube_video_id:v}))} placeholder="e.g. dQw4w9WgXcQ (11 chars from URL)" />
              }
              <F label="Duration (mins)" value={form.duration_mins||''} onChange={v=>setForm(f=>({...f,duration_mins:v}))} placeholder="e.g. 22" type="number" />
              <div>
                <label style={s.lbl}>Primary Exam (for filtering)</label>
                <select value={form.exam_slug||''} onChange={e=>setForm(f=>({...f,exam_slug:e.target.value}))} style={s.inp}>
                  {EXAMS.map(e => <option key={e} value={e}>{e ? e.toUpperCase() : '— None —'}</option>)}
                </select>
              </div>
              <F label="Tags (comma-separated, for search)" value={form.tags||''} onChange={v=>setForm(f=>({...f,tags:v}))} placeholder="e.g. varc, rc, strategy, beginner" />
              <F label="Description (optional)" value={form.description||''} onChange={v=>setForm(f=>({...f,description:v}))} textarea placeholder="Brief description of what this video covers..." />
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.75rem', marginTop:'1.5rem', paddingTop:'1rem', borderTop:'1px solid '+C.border }}>
              <button onClick={()=>{setModal(null);setForm({})}} style={{ padding:'0.625rem 1.25rem', border:'1px solid '+C.border, borderRadius:'4px', background:C.white, fontFamily:'var(--font-sans)', fontSize:'0.82rem', cursor:'pointer', color:C.gray500 }}>Cancel</button>
              <button onClick={save} disabled={saving||!form.title}
                style={{ padding:'0.625rem 1.5rem', background:saving||!form.title?C.gray400:C.red, color:'#fff', border:'none', borderRadius:'4px', fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', cursor:saving||!form.title?'not-allowed':'pointer' }}>
                {saving?'Saving…':modal==='add'?'Add to Library':'Update Video'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attach to Topic Modal */}
      {modal === 'attach' && selected && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }} onClick={e=>e.target===e.currentTarget&&(setModal(null),setForm({}))}>
          <div style={{ background:C.white, borderRadius:'8px', width:'100%', maxWidth:'580px', maxHeight:'90vh', overflowY:'auto', padding:'2rem', boxShadow:'0 24px 64px rgba(0,0,0,0.25)' }}>
            <p style={s.mTitle}>Attach Video to Topic</p>
            <div style={{ background:C.bg, borderRadius:'6px', padding:'0.75rem 1rem', marginBottom:'1.25rem', display:'flex', gap:'0.875rem', alignItems:'center' }}>
              <span style={{ fontSize:'1.25rem' }}>🎬</span>
              <div>
                <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', color:C.black }}>{selected.title}</p>
                <p style={{ fontFamily:"'SF Mono',monospace", fontSize:'0.65rem', color:C.blue }}>{selected.bunny_video_id}</p>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
              {/* Exam picker to load curriculum */}
              <div>
                <label style={s.lbl}>Exam</label>
                <select value={form.exam_slug||selected.exam_slug||'cat'} onChange={e => {
                  setForm(f=>({...f,exam_slug:e.target.value,section_id:'',topic_id:''}))
                  api.get('/dashboard/curriculum/?exam='+e.target.value).then(({data})=>setCurriculum(data.sections||[])).catch(()=>setCurriculum([]))
                }} style={s.inp}>
                  {EXAMS.filter(Boolean).map(e => <option key={e} value={e}>{e.toUpperCase()}</option>)}
                </select>
              </div>
              {/* Section picker */}
              <div>
                <label style={s.lbl}>Section *</label>
                <select value={form.section_id||''} onChange={e=>setForm(f=>({...f,section_id:e.target.value,topic_id:''}))} style={s.inp}>
                  <option value="">— Select section —</option>
                  {curriculum.map(sec => <option key={sec.id} value={sec.id}>{sec.title}</option>)}
                </select>
              </div>
              {/* Topic picker */}
              {form.section_id && (
                <div>
                  <label style={s.lbl}>Topic *</label>
                  <select value={form.topic_id||''} onChange={e=>setForm(f=>({...f,topic_id:e.target.value}))} style={s.inp}>
                    <option value="">— Select topic —</option>
                    {(curriculum.find(s=>String(s.id)===String(form.section_id))?.topics||[]).map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </div>
              )}
              <F label="Title in this topic (optional, defaults to video title)" value={form.title||''} onChange={v=>setForm(f=>({...f,title:v}))} placeholder={selected.title} />
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                <F label="Sort Order" value={form.sort_order||''} onChange={v=>setForm(f=>({...f,sort_order:v}))} placeholder="auto" type="number" />
                <div>
                  <label style={s.lbl}>Difficulty</label>
                  <select value={form.difficulty||'beginner'} onChange={e=>setForm(f=>({...f,difficulty:e.target.value}))} style={s.inp}>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
              {/* Toggles */}
              <div style={{ display:'flex', gap:'0.875rem' }}>
                {[['📄 Cheat Sheet','has_cheatsheet',true],['📝 Quiz','has_quiz',false],['📡 Live','has_live',false]].map(([lbl,key,def])=>(
                  <label key={key} style={{ display:'flex', alignItems:'center', gap:'0.375rem', cursor:'pointer' }}>
                    <input type="checkbox" checked={form[key]!==undefined?form[key]:def} onChange={e=>setForm(f=>({...f,[key]:e.target.checked}))} />
                    <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem' }}>{lbl}</span>
                  </label>
                ))}
              </div>
              {form.has_quiz && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', padding:'0.75rem', background:'#fffbeb', border:'1px solid #fcd34d', borderRadius:'4px' }}>
                  <F label="Quiz Duration (mins)" value={form.quiz_duration_mins||40} onChange={v=>setForm(f=>({...f,quiz_duration_mins:parseInt(v)||40}))} type="number" />
                  <F label="No. of Questions" value={form.quiz_question_count||10} onChange={v=>setForm(f=>({...f,quiz_question_count:parseInt(v)||10}))} type="number" />
                </div>
              )}
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.75rem', marginTop:'1.5rem', paddingTop:'1rem', borderTop:'1px solid '+C.border }}>
              <button onClick={()=>{setModal(null);setForm({})}} style={{ padding:'0.625rem 1.25rem', border:'1px solid '+C.border, borderRadius:'4px', background:C.white, fontFamily:'var(--font-sans)', fontSize:'0.82rem', cursor:'pointer', color:C.gray500 }}>Cancel</button>
              <button onClick={attach} disabled={saving||!form.topic_id}
                style={{ padding:'0.625rem 1.5rem', background:saving||!form.topic_id?C.gray400:C.green, color:'#fff', border:'none', borderRadius:'4px', fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', cursor:saving||!form.topic_id?'not-allowed':'pointer' }}>
                {saving?'Attaching…':'Attach to Topic →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </AdminLayout>
  )
}

function F({ label, value, onChange, placeholder, textarea, type='text' }) {
  return (
    <div>
      {label && <label style={{ fontFamily:'var(--font-sans)', fontSize:'0.7rem', fontWeight:'700', color:'#666', display:'block', marginBottom:'0.25rem' }}>{label}</label>}
      {textarea
        ? <textarea value={value||''} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{ width:'100%', padding:'0.5rem 0.625rem', fontFamily:'var(--font-sans)', fontSize:'0.82rem', border:'1px solid #e8e8e6', borderRadius:'4px', outline:'none', color:'#0f0f0f', boxSizing:'border-box', height:'72px', resize:'vertical' }} />
        : <input type={type} value={value||''} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{ width:'100%', padding:'0.5rem 0.625rem', fontFamily:'var(--font-sans)', fontSize:'0.82rem', border:'1px solid #e8e8e6', borderRadius:'4px', outline:'none', color:'#0f0f0f', boxSizing:'border-box' }} />}
    </div>
  )
}

const s = {
  mTitle: { fontFamily:'Georgia,serif', fontSize:'1.25rem', fontWeight:'700', color:'#0f0f0f', marginBottom:'1.5rem' },
  lbl: { fontFamily:'var(--font-sans)', fontSize:'0.7rem', fontWeight:'700', color:'#666', display:'block', marginBottom:'0.25rem' },
  inp: { width:'100%', padding:'0.5rem 0.625rem', fontFamily:'var(--font-sans)', fontSize:'0.82rem', border:'1px solid #e8e8e6', borderRadius:'4px', outline:'none', color:'#0f0f0f', boxSizing:'border-box', background:'#fff' },
  sel: { padding:'0.5rem 0.625rem', fontFamily:'var(--font-sans)', fontSize:'0.78rem', border:'1px solid #e8e8e6', borderRadius:'4px', outline:'none', color:'#0f0f0f', background:'#fff', cursor:'pointer' },
}

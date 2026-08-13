/**
 * GRADSKOOL Admin — Course Builder
 * Route: /admin-panel/course/[id]
 *
 * Single page to manage EVERYTHING about a course:
 *   - Course type + settings
 *   - Components (what learning activities exist)
 *   - Sections → Topics → Videos (curriculum)
 *   - Quiz questions per video
 *   - Cheat sheets
 *   - Live sessions
 */
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import api from '../../../lib/api'
import { AdminLayout } from '../../../components/admin/AdminLayout'

const C = {
  red:'#ff5e5f', black:'#0f0f0f', white:'#fff',
  bg:'#f7f6f3', border:'#e8e8e6', gray50:'#fafaf9',
  gray400:'#999', gray500:'#666', green:'#22c55e',
  amber:'#f59e0b', blue:'#3b82f6', purple:'#7b2d8b',
}

const COMPONENT_TYPES = [
  { type:'pre_test',   icon:'🎯', label:'Pre-Test',       color:C.amber,  bg:'#fffbeb', desc:'Diagnostic test before the course starts' },
  { type:'video',      icon:'📹', label:'Videos',         color:C.blue,   bg:'#eff6ff', desc:'Recorded video lectures' },
  { type:'quiz',       icon:'📝', label:'Quiz',           color:'#e76f51',bg:'#fff4f0', desc:'Questions after videos' },
  { type:'cheatsheet', icon:'📄', label:'Cheat Sheet',    color:C.red,    bg:'#fff1f2', desc:'Key takeaways after quiz' },
  { type:'live',       icon:'📡', label:'Live Class',     color:C.purple, bg:'#f3e8ff', desc:'Scheduled live sessions' },
  { type:'assignment', icon:'✏️', label:'Assignment',     color:'#0e7490',bg:'#ecfeff', desc:'Homework or practice tasks' },
  { type:'mock_test',  icon:'🧪', label:'Mock Test',      color:'#1d4ed8',bg:'#eff6ff', desc:'Full-length mock exam' },
  { type:'post_test',  icon:'🏁', label:'Post-Test',      color:C.green,  bg:'#f0fdf4', desc:'Final assessment' },
  { type:'resources',  icon:'📚', label:'Resources',      color:'#64748b',bg:'#f8fafc', desc:'PDFs, links, downloads' },
  { type:'notes',      icon:'📓', label:'Notes',          color:'#374151',bg:'#f9fafb', desc:'Reading material / notes' },
]

const COURSE_TYPES = [
  { value:'recorded',      label:'Recorded Videos + Quizzes' },
  { value:'live_recorded', label:'Live Classes + Recordings + Quizzes' },
  { value:'mocks_only',    label:'Mocks Only' },
  { value:'self_paced',    label:'Self-Paced' },
  { value:'crash_course',  label:'Crash Course (Pre/Post Test)' },
  { value:'gdpi_prep',     label:'GDPI Preparation' },
  { value:'custom',        label:'Custom' },
]

export default function CourseBuilder() {
  const router = useRouter()
  const { id }  = router.query

  const [course,       setCourse]      = useState(null)
  const [loading,      setLoad]        = useState(true)
  const [activeTab,    setActiveTab]   = useState('overview')
  const [msg,          setMsg]         = useState(null)
  const [saving,       setSaving]      = useState(false)

  // Curriculum state (reuse from curriculum.jsx pattern)
  const [activeSection,setActiveSection] = useState(null)
  const [activeTopic,  setActiveTopic]   = useState(null)
  const [activeVideo,  setActiveVideo]   = useState(null)
  const [videoPanel,   setVideoPanel]    = useState('details')

  // Modals
  const [modal,  setModal]  = useState(null)
  const [form,   setForm]   = useState({})

  // Quiz questions
  const [questions,  setQuestions] = useState([])
  const [qLoad,      setQLoad]    = useState(false)
  const [cheatsheet, setCheatsheet] = useState(null)   // {summary, key_points, formulas, files}
  const [csLoad,     setCsLoad]   = useState(false)

  const load = () => {
    if (!id) return
    setLoad(true)
    api.get('/dashboard/course-builder/' + id + '/')
      .then(({ data }) => setCourse(data))
      .catch(() => notify('Failed to load course', 'error'))
      .finally(() => setLoad(false))
  }
  useEffect(() => { load() }, [id])

  const notify = (text, type='success') => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3500) }

  const saveCourse = async (updates) => {
    try {
      await api.patch('/dashboard/course-builder/' + id + '/', updates)
      setCourse(c => ({ ...c, ...updates }))
      notify('Saved')
    } catch { notify('Failed to save', 'error') }
  }

  // Component CRUD
  const addComponent = async (type) => {
    const cfg = COMPONENT_TYPES.find(c => c.type === type)
    try {
      const { data } = await api.post('/dashboard/course-builder/' + id + '/components/', {
        component_type: type, title: cfg?.label || type,
      })
      notify(cfg?.label + ' added')
      load()
    } catch { notify('Failed', 'error') }
  }

  const toggleComponent = async (comp) => {
    try {
      await api.put('/dashboard/course-builder/' + id + '/components/' + comp.id + '/', {
        is_enabled: !comp.is_enabled
      })
      load()
    } catch { notify('Failed', 'error') }
  }

  const deleteComponent = async (comp) => {
    if (!confirm('Remove "' + comp.title + '" from this course?')) return
    try {
      await api.delete('/dashboard/course-builder/' + id + '/components/' + comp.id + '/')
      notify('Removed')
      load()
    } catch { notify('Failed', 'error') }
  }

  const moveComponent = async (components, idx, dir) => {
    const newOrder = [...components]
    const swapIdx  = idx + dir
    if (swapIdx < 0 || swapIdx >= newOrder.length) return
    ;[newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]]
    try {
      await api.post('/dashboard/course-builder/' + id + '/components/', {
        action: 'reorder', order: newOrder.map(c => c.id)
      })
      load()
    } catch { notify('Failed to reorder', 'error') }
  }

  // Curriculum CRUD (same as curriculum.jsx)
  const saveSection = async () => {
    setSaving(true)
    try {
      if (form.id) await api.put('/dashboard/curriculum/sections/' + form.id + '/', form)
      else await api.post('/dashboard/curriculum/sections/', { ...form, exam_slug: course.exam_slug, course_id: id })
      notify(form.id ? 'Section updated' : 'Section created')
      setModal(null); setForm({}); load()
    } catch(e) { notify(e.response?.data?.error||'Failed', 'error') }
    finally { setSaving(false) }
  }

  const saveTopic = async () => {
    setSaving(true)
    try {
      if (form.id) await api.put('/dashboard/curriculum/topics/' + form.id + '/', form)
      else await api.post('/dashboard/curriculum/topics/', { ...form, section_id: activeSection?.id })
      notify(form.id ? 'Topic updated' : 'Topic created')
      setModal(null); setForm({}); load()
    } catch(e) { notify(e.response?.data?.error||'Failed', 'error') }
    finally { setSaving(false) }
  }

  const saveVideo = async () => {
    setSaving(true)
    try {
      if (form.id) await api.put('/dashboard/curriculum/videos/' + form.id + '/', form)
      else await api.post('/dashboard/curriculum/videos/', { ...form, topic_id: activeTopic?.id })
      notify(form.id ? 'Video updated' : 'Video added')
      setModal(null); setForm({}); load()
    } catch(e) { notify(e.response?.data?.error||'Failed', 'error') }
    finally { setSaving(false) }
  }

  const saveQuestion = async () => {
    setSaving(true)
    try {
      const options = ['A','B','C','D'].map(key => ({
        key, text: form['opt_'+key]||'', is_correct: form.correct===key
      })).filter(o => o.text)
      if (form.isEdit && form.questionId) {
        await api.put('/dashboard/curriculum/videos/' + activeVideo.id + '/quiz/' + form.questionId + '/', {
          text: form.text, explanation: form.explanation||'', difficulty: form.difficulty||'medium', options
        })
        notify('Question updated')
      } else {
        await api.post('/dashboard/curriculum/videos/' + activeVideo.id + '/quiz/', {
          text: form.text, explanation: form.explanation||'', difficulty: form.difficulty||'medium', options
        })
        notify('Question added')
      }
      setModal(null)
      loadQuestions(activeVideo.id)
    } catch(e) { notify(e.response?.data?.error||'Failed', 'error') }
    finally { setSaving(false) }
  }

  const loadQuestions = (videoId) => {
    setQLoad(true)
    api.get('/dashboard/curriculum/videos/' + videoId + '/quiz/')
      .then(({ data }) => setQuestions(data.questions || []))
      .catch(() => setQuestions([]))
      .finally(() => setQLoad(false))
  }

  useEffect(() => {
    if (activeVideo && videoPanel === 'quiz') loadQuestions(activeVideo.id)
    if (activeVideo && videoPanel === 'cheatsheet') loadCheatsheet(activeVideo.id)
  }, [activeVideo, videoPanel])

  const loadCheatsheet = (videoId) => {
    setCsLoad(true)
    api.get('/dashboard/curriculum/videos/' + videoId + '/cheatsheet/')
      .then(({ data }) => setCheatsheet(data))
      .catch(() => setCheatsheet(null))
      .finally(() => setCsLoad(false))
  }

  const sections = course?.sections || []
  const topics   = activeSection ? (sections.find(s => s.id === activeSection.id)?.topics || []) : []
  const videos   = activeTopic   ? (topics.find(t => t.id === activeTopic.id)?.videos || [])   : []

  if (loading) return (
    <AdminLayout title="Course">
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <p style={{ fontFamily:'Georgia,serif', color:C.gray400 }}>Loading course builder…</p>
    </div>
  </AdminLayout>
  )

  if (!course) return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <p style={{ fontFamily:'Georgia,serif', color:C.red }}>Course not found</p>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <Head><title>{course.title} — Course Builder — GRADSKOOL</title></Head>

      {/* Top bar */}
      <div style={{ height:'56px', background:C.black, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 1.5rem', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.875rem' }}>
          <Link href="/admin-panel/courses" style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:'rgba(255,255,255,0.4)', textDecoration:'none' }}>← Courses</Link>
          <span style={{ color:'rgba(255,255,255,0.2)' }}>|</span>
          <p style={{ fontFamily:'Georgia,serif', fontSize:'0.9rem', fontWeight:'700', color:'#fff' }}>{course.title}</p>
          <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', padding:'0.15rem 0.5rem', borderRadius:'3px', background:'rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.5)' }}>
            {course.exam_name} · {COURSE_TYPES.find(t=>t.value===course.course_type)?.label||course.course_type}
          </span>
        </div>
        <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
          <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', padding:'0.2rem 0.5rem', borderRadius:'3px',
            background:course.status==='active'?'rgba(34,197,94,0.2)':'rgba(255,255,255,0.08)',
            color:course.status==='active'?'#4ade80':'rgba(255,255,255,0.4)' }}>
            {course.status}
          </span>
          <a href={'/learn/'+course.exam_slug} target="_blank" rel="noreferrer"
            style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:'rgba(255,255,255,0.4)', textDecoration:'none', padding:'0.25rem 0.625rem', border:'1px solid rgba(255,255,255,0.15)', borderRadius:'3px' }}>
            Preview ↗
          </a>
        </div>
      </div>

      {msg && <div style={{ position:'fixed', top:'64px', right:'1.5rem', zIndex:999, padding:'0.75rem 1.25rem', borderRadius:'4px', fontFamily:'var(--font-sans)', fontSize:'0.82rem', background:msg.type==='error'?'#fee2e2':'#dcfce7', border:'1px solid '+(msg.type==='error'?'#fca5a5':'#86efac'), color:msg.type==='error'?'#991b1b':'#166534' }}>{msg.text}</div>}

      {/* Tab bar */}
      <div style={{ background:C.white, borderBottom:'1px solid '+C.border, display:'flex', padding:'0 1.5rem' }}>
        {[
          ['overview',   '⚙ Overview & Settings'],
          ['components', '🧩 Course Components'],
          ['curriculum', '📚 Curriculum Builder'],
          ['students',   '👥 Enrolled Students'],
        ].map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', padding:'0.875rem 1.125rem', border:'none',
              borderBottom:'2px solid '+(activeTab===tab?C.red:'transparent'),
              background:'none', cursor:'pointer',
              color:activeTab===tab?C.black:C.gray400,
              fontWeight:activeTab===tab?'700':'400', marginBottom:'-1px' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div style={{ maxWidth:'720px', margin:'0 auto', padding:'2rem' }}>
          <div style={{ background:C.white, border:'1px solid '+C.border, borderRadius:'8px', padding:'1.75rem', marginBottom:'1.5rem' }}>
            <p style={s.sectionLabel}>Course Details</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginTop:'1rem' }}>
              <div>
                <label style={s.lbl}>Course Title</label>
                <input defaultValue={course.title} onBlur={e => saveCourse({ title: e.target.value })} style={s.inp} />
              </div>
              <div>
                <label style={s.lbl}>Course Type</label>
                <select defaultValue={course.course_type} onChange={e => saveCourse({ course_type: e.target.value })} style={s.inp}>
                  {COURSE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label style={s.lbl}>Status</label>
                <select defaultValue={course.status} onChange={e => saveCourse({ status: e.target.value })} style={s.inp}>
                  <option value="upcoming">Upcoming</option>
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <label style={s.lbl}>Batch Size</label>
                <input type="number" defaultValue={course.batch_size} onBlur={e => saveCourse({ batch_size: parseInt(e.target.value) })} style={s.inp} />
              </div>
              <div>
                <label style={s.lbl}>Start Date</label>
                <input type="date" defaultValue={course.start_date||''} onBlur={e => saveCourse({ start_date: e.target.value })} style={s.inp} />
              </div>
              <div>
                <label style={s.lbl}>End Date</label>
                <input type="date" defaultValue={course.end_date||''} onBlur={e => saveCourse({ end_date: e.target.value })} style={s.inp} />
              </div>
            </div>
            <div style={{ marginTop:'1rem' }}>
              <label style={s.lbl}>Description</label>
              <textarea defaultValue={course.description||''} onBlur={e => saveCourse({ description: e.target.value })}
                style={{ ...s.inp, height:'80px', resize:'vertical' }} placeholder="Short description shown on the course page..." />
            </div>
          </div>

          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px,1fr))', gap:'1rem' }}>
            {[
              ['Enrolled', course.enrolled||0, C.blue],
              ['Seats', course.batch_size||0, C.gray400],
              ['Sections', sections.length, C.green],
              ['Components', course.components?.length||0, C.purple],
            ].map(([label, val, color]) => (
              <div key={label} style={{ background:C.white, border:'1px solid '+C.border, borderRadius:'8px', padding:'1rem', textAlign:'center' }}>
                <p style={{ fontFamily:'Georgia,serif', fontSize:'1.75rem', fontWeight:'700', color, lineHeight:1, marginBottom:'0.25rem' }}>{val}</p>
                <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', color:C.gray400 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── COMPONENTS TAB ──────────────────────────────────────────── */}
      {activeTab === 'components' && (
        <div style={{ maxWidth:'800px', margin:'0 auto', padding:'2rem' }}>
          <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:'6px', padding:'1rem 1.25rem', marginBottom:'1.5rem', fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:'#1d4ed8', lineHeight:1.7 }}>
            <strong>What are components?</strong> Components define what learning activities exist in this course.
            The order here is the order students see them. Toggle on/off, reorder, or add new ones.
            The <em>Curriculum Builder</em> tab lets you add actual videos and questions to the Video component.
          </div>

          {/* Current components */}
          <p style={s.sectionLabel}>Active Components — in order shown to students</p>
          {!course.components?.length ? (
            <p style={{ fontFamily:'Georgia,serif', color:C.gray400, padding:'1rem 0' }}>No components yet. Add from the palette below.</p>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'0.625rem', marginTop:'0.875rem', marginBottom:'2rem' }}>
              {course.components.map((comp, idx) => {
                const cfg = COMPONENT_TYPES.find(c => c.type === comp.component_type) || { icon:'•', label:comp.component_type, color:C.gray400, bg:C.bg }
                return (
                  <div key={comp.id} style={{ display:'flex', alignItems:'center', gap:'0.875rem', padding:'0.875rem 1.125rem', background:comp.is_enabled?C.white:'#fafaf9', border:'1px solid '+(comp.is_enabled?C.border:'#e0e0e0'), borderLeft:'4px solid '+(comp.is_enabled?cfg.color:'#d0d0d0'), borderRadius:'6px', opacity:comp.is_enabled?1:0.6 }}>
                    <span style={{ fontSize:'1.25rem', flexShrink:0 }}>{cfg.icon}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.85rem', fontWeight:'700', color:comp.is_enabled?C.black:'#999', marginBottom:'0.1rem' }}>{comp.title}</p>
                      <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', color:C.gray400 }}>{cfg.desc}</p>
                    </div>
                    <div style={{ display:'flex', gap:'0.375rem', alignItems:'center', flexShrink:0 }}>
                      <button onClick={() => moveComponent(course.components, idx, -1)} disabled={idx===0}
                        style={{ background:'none', border:'1px solid '+C.border, cursor:'pointer', padding:'0.2rem 0.5rem', borderRadius:'3px', fontSize:'0.75rem', opacity:idx===0?0.3:1 }}>↑</button>
                      <button onClick={() => moveComponent(course.components, idx, 1)} disabled={idx===course.components.length-1}
                        style={{ background:'none', border:'1px solid '+C.border, cursor:'pointer', padding:'0.2rem 0.5rem', borderRadius:'3px', fontSize:'0.75rem', opacity:idx===course.components.length-1?0.3:1 }}>↓</button>
                      {/* Config button for components that have settings */}
                      {['mock_test','pre_test','post_test','resources'].includes(comp.component_type) && (
                        <button onClick={() => { setForm({ id:comp.id, component_type:comp.component_type, title:comp.title, ...comp.config }); setModal('config_'+comp.component_type) }}
                          style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', padding:'0.2rem 0.625rem', border:'1px solid '+C.blue, borderRadius:'3px', background:'#eff6ff', color:C.blue, cursor:'pointer', fontWeight:'700' }}>
                          ⚙ Config
                        </button>
                      )}
                      <button onClick={() => toggleComponent(comp)}
                        style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', padding:'0.2rem 0.625rem', border:'1px solid '+C.border, borderRadius:'3px', background:comp.is_enabled?'#f0fdf4':'#fff', color:comp.is_enabled?C.green:'#999', cursor:'pointer', fontWeight:'700' }}>
                        {comp.is_enabled ? 'ON' : 'OFF'}
                      </button>
                      <button onClick={() => deleteComponent(comp)}
                        style={{ background:'none', border:'1px solid #fca5a5', cursor:'pointer', padding:'0.2rem 0.5rem', borderRadius:'3px', fontSize:'0.75rem', color:C.red }}>✕</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Add component palette */}
          <p style={s.sectionLabel}>Add Component</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:'0.75rem', marginTop:'0.875rem' }}>
            {COMPONENT_TYPES.map(cfg => {
              const already = course.components?.some(c => c.component_type === cfg.type)
              return (
                <button key={cfg.type} onClick={() => addComponent(cfg.type)}
                  style={{ display:'flex', alignItems:'center', gap:'0.625rem', padding:'0.875rem', background:already?C.gray50:C.white, border:'1px solid '+(already?C.border:C.border), borderRadius:'6px', cursor:'pointer', textAlign:'left', transition:'all 0.15s', opacity:already?0.5:1 }}>
                  <span style={{ fontSize:'1.25rem', flexShrink:0 }}>{cfg.icon}</span>
                  <div>
                    <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:'700', color:C.black, marginBottom:'0.1rem' }}>{cfg.label}</p>
                    <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.6rem', color:C.gray400, lineHeight:1.3 }}>{cfg.desc}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── CURRICULUM BUILDER TAB ──────────────────────────────────── */}
      {activeTab === 'curriculum' && (
        <div style={{ display:'grid', gridTemplateColumns:'220px 220px 1fr', height:'calc(100vh - 112px)' }}
          className="gs-admin-3col">
          <style>{`
            @media (max-width: 900px) {
              .gs-admin-3col { display: block !important; height: auto !important; overflow-y: auto; }
              .gs-admin-3col > div { border-right: none !important; border-bottom: 1px solid #e8e8e6; max-height: 300px; overflow-y: auto; }
            }
          `}</style>

          {/* Col 1: Sections */}
          <div style={{ background:C.white, borderRight:'1px solid '+C.border, overflowY:'auto' }}>
            <div style={s.colH}>
              <span style={s.colT}>Sections</span>
              <button onClick={() => { setForm({}); setModal('section') }} style={s.addB}>+ Add</button>
            </div>
            {!sections.length
              ? <p style={s.empty}>No sections yet</p>
              : sections.map(sec => (
                <div key={sec.id} onClick={() => { setActiveSection(sec); setActiveTopic(null); setActiveVideo(null) }}
                  style={{ ...s.row, background:activeSection?.id===sec.id?'#fff5f5':C.white, borderLeft:'3px solid '+(activeSection?.id===sec.id?C.red:'transparent') }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={s.rowT}>{sec.title}</p>
                    <p style={s.rowS}>{sec.topic_count} topics · {sec.short_title}</p>
                  </div>
                  <div style={{ display:'flex', gap:'2px' }}>
                    <button onClick={e=>{e.stopPropagation();setForm(sec);setModal('section')}} style={s.iconB}>✎</button>
                    <button onClick={e=>{e.stopPropagation();if(confirm('Delete section?')) api.delete('/dashboard/curriculum/sections/'+sec.id+'/').then(()=>{setActiveSection(null);load()})}} style={{...s.iconB,color:C.red}}>✕</button>
                  </div>
                </div>
              ))}
          </div>

          {/* Col 2: Topics */}
          <div style={{ background:C.white, borderRight:'1px solid '+C.border, overflowY:'auto' }}>
            <div style={s.colH}>
              <span style={s.colT}>{activeSection?activeSection.short_title+' Topics':'Topics'}</span>
              {activeSection && <button onClick={() => { setForm({}); setModal('topic') }} style={s.addB}>+ Add</button>}
            </div>
            {!activeSection ? <p style={s.empty}>Select section</p>
            : !topics.length ? <p style={s.empty}>No topics yet</p>
            : topics.map(t => (
              <div key={t.id} onClick={() => { setActiveTopic(t); setActiveVideo(null) }}
                style={{ ...s.row, background:activeTopic?.id===t.id?'#fff5f5':C.white, borderLeft:'3px solid '+(activeTopic?.id===t.id?C.red:'transparent') }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={s.rowT}>{t.title}</p>
                  <p style={s.rowS}>{t.video_count} videos</p>
                </div>
                <div style={{ display:'flex', gap:'2px' }}>
                  <button onClick={e=>{e.stopPropagation();setForm(t);setModal('topic')}} style={s.iconB}>✎</button>
                  <button onClick={e=>{e.stopPropagation();if(confirm('Delete topic?')) api.delete('/dashboard/curriculum/topics/'+t.id+'/').then(()=>{setActiveTopic(null);load()})}} style={{...s.iconB,color:C.red}}>✕</button>
                </div>
              </div>
            ))}
          </div>

          {/* Col 3: Videos + editor */}
          <div style={{ background:C.white, overflow:'hidden', display:'flex', flexDirection:'column' }}>
            {!activeTopic ? (
              <p style={s.empty}>Select a topic to manage its videos</p>
            ) : (
              <>
                {/* Video list */}
                <div style={{ borderBottom:'1px solid '+C.border }}>
                  <div style={s.colH}>
                    <span style={s.colT}>{activeTopic.title}</span>
                    <button onClick={() => { setForm({ has_cheatsheet:true, has_quiz:false, has_live:false, video_source:'bunny', duration_mins:20, difficulty:'beginner', quiz_duration_mins:40, quiz_question_count:10 }); setModal('video') }} style={s.addB}>+ Add Video</button>
                  </div>
                  <div style={{ maxHeight:'200px', overflowY:'auto' }}>
                    {!videos.length ? <p style={s.empty}>No videos yet</p>
                    : videos.map(v => (
                      <div key={v.id} onClick={() => { setActiveVideo(v); setVideoPanel('details') }}
                        style={{ ...s.row, background:activeVideo?.id===v.id?'#eff6ff':C.white, borderLeft:'3px solid '+(activeVideo?.id===v.id?C.blue:'transparent') }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={s.rowT}>{v.title||'(untitled)'}</p>
                          <p style={s.rowS}>{v.duration_mins}min{v.is_free_preview?' · 🆓':''}{v.has_cheatsheet?' · 📄':''}{v.has_quiz?' · 📝 '+v.quiz_duration_mins+'min':''}{v.has_live?' · 📡':''}</p>
                        </div>
                        <div style={{ display:'flex', gap:'2px' }}>
                          <button onClick={e=>{e.stopPropagation();setForm(v);setModal('video')}} style={s.iconB}>✎</button>
                          <button onClick={e=>{e.stopPropagation();if(confirm('Delete?')) api.delete('/dashboard/curriculum/videos/'+v.id+'/').then(()=>{setActiveVideo(null);load()})}} style={{...s.iconB,color:C.red}}>✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Video detail panels */}
                {activeVideo && (
                  <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>
                    {/* Panel tabs */}
                    <div style={{ display:'flex', borderBottom:'1px solid '+C.border, background:C.white }}>
                      {[['details','📹 Details'],['quiz','📝 Quiz'],['cheatsheet','📄 Cheat Sheet']].map(([pid,plabel]) => (
                        <button key={pid} onClick={() => setVideoPanel(pid)}
                          style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', padding:'0.625rem 1rem', border:'none', borderBottom:'2px solid '+(videoPanel===pid?C.red:'transparent'), background:'none', cursor:'pointer', color:videoPanel===pid?C.black:C.gray400, fontWeight:videoPanel===pid?'700':'400', marginBottom:'-1px' }}>
                          {plabel}
                        </button>
                      ))}
                    </div>

                    {/* Details panel */}
                    {videoPanel === 'details' && (
                      <div style={{ padding:'1.25rem' }}>
                        <div style={{ background:C.bg, border:'1px solid '+C.border, borderRadius:'6px', padding:'1rem', marginBottom:'0.875rem' }}>
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.625rem' }}>
                            {[['Title',activeVideo.title],['Duration',activeVideo.duration_mins+'min'],['Source',activeVideo.video_source||'bunny'],['Difficulty',activeVideo.difficulty],['Video ID',activeVideo.bunny_video_id||'(not set)']].map(([l,v])=>(
                              <div key={l}>
                                <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.6rem', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.08em', color:C.gray400 }}>{l}</p>
                                <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:C.black, marginTop:'0.1rem', wordBreak:'break-all' }}>{v}</p>
                              </div>
                            ))}
                          </div>
                          <div style={{ display:'flex', gap:'0.5rem', marginTop:'0.875rem', paddingTop:'0.875rem', borderTop:'1px solid '+C.border, flexWrap:'wrap' }}>
                            {[['📄 Cheat Sheet',activeVideo.has_cheatsheet],['📝 Quiz '+(activeVideo.quiz_duration_mins||40)+'min',activeVideo.has_quiz],['📡 Live',activeVideo.has_live]].map(([l,on])=>(
                              <span key={l} style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', padding:'0.2rem 0.5rem', borderRadius:'3px', background:on?'#dcfce7':'#f1f5f9', color:on?'#166534':C.gray400, border:'1px solid '+(on?'#86efac':C.border) }}>
                                {on?'✓':'✗'} {l}
                              </span>
                            ))}
                          </div>
                        </div>
                        <button onClick={() => { setForm(activeVideo); setModal('video') }} style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:'700', padding:'0.5rem 1rem', background:C.black, color:'#fff', border:'none', borderRadius:'4px', cursor:'pointer' }}>
                          ✎ Edit Video
                        </button>
                      </div>
                    )}

                    {/* Quiz panel */}
                    {videoPanel === 'quiz' && (
                      <div style={{ padding:'1.25rem', height:'100%', overflowY:'auto' }}>
                        {/* Quiz settings bar */}
                        <div style={{ background:C.muted, border:'1px solid '+C.border, borderRadius:'6px', padding:'0.875rem 1rem', marginBottom:'1rem', display:'flex', gap:'1.5rem', alignItems:'center', flexWrap:'wrap' }}>
                          <div>
                            <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.6rem', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.08em', color:C.gray400, marginBottom:'0.2rem' }}>Duration</p>
                            <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', color:C.black }}>{activeVideo.quiz_duration_mins||40} min</p>
                          </div>
                          <div>
                            <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.6rem', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.08em', color:C.gray400, marginBottom:'0.2rem' }}>Questions</p>
                            <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', color:C.black }}>{questions.length} added</p>
                          </div>
                          <div>
                            <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.6rem', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.08em', color:C.gray400, marginBottom:'0.2rem' }}>Marking</p>
                            <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', color:C.black }}>+3 / −1</p>
                          </div>
                          <button onClick={() => { setForm({ difficulty:'medium' }); setModal('question') }}
                            style={{ marginLeft:'auto', fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'700', padding:'0.375rem 0.875rem', background:C.red, color:'#fff', border:'none', borderRadius:'4px', cursor:'pointer' }}>
                            + Add Question
                          </button>
                        </div>

                        {qLoad ? <p style={s.empty}>Loading…</p>
                        : questions.length === 0 ? (
                          <div style={{ textAlign:'center', padding:'2.5rem', border:'1px dashed '+C.border, borderRadius:'6px', background:C.muted }}>
                            <p style={{ fontSize:'1.75rem', marginBottom:'0.5rem' }}>📝</p>
                            <p style={{ fontFamily:'Georgia,serif', fontSize:'0.95rem', color:C.black, marginBottom:'0.5rem' }}>No questions yet</p>
                            <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:C.gray400, marginBottom:'1rem', lineHeight:1.5 }}>
                              Add questions manually, or attach from the question bank.
                            </p>
                            <button onClick={() => { setForm({ difficulty:'medium' }); setModal('question') }} style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:'700', padding:'0.5rem 1.25rem', background:C.red, color:'#fff', border:'none', borderRadius:'4px', cursor:'pointer' }}>
                              + Add First Question
                            </button>
                          </div>
                        ) : questions.map((q,i) => (
                          <div key={q.id} style={{ background:C.white, border:'1px solid '+C.border, borderRadius:'6px', padding:'1rem', marginBottom:'0.625rem' }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.5rem' }}>
                              <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
                                <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.6rem', fontWeight:'700', color:C.gray400 }}>Q{i+1}</span>
                                <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.6rem', padding:'0.1rem 0.375rem', borderRadius:'3px',
                                  background:q.difficulty==='hard'?'#fee2e2':q.difficulty==='easy'?'#dcfce7':'#eff6ff',
                                  color:q.difficulty==='hard'?C.red:q.difficulty==='easy'?'#166534':C.blue }}>
                                  {q.difficulty||'medium'}
                                </span>
                              </div>
                              <div style={{ display:'flex', gap:'4px' }}>
                                <button onClick={()=>{ setForm({ id:q.id, text:q.text||q.question_text, explanation:q.explanation, difficulty:q.difficulty||'medium', opt_A:q.options?.find(o=>o.key==='A')?.text||'', opt_B:q.options?.find(o=>o.key==='B')?.text||'', opt_C:q.options?.find(o=>o.key==='C')?.text||'', opt_D:q.options?.find(o=>o.key==='D')?.text||'', correct:q.options?.find(o=>o.is_correct)?.key||'A', isEdit:true, questionId:q.id }); setModal('question') }}
                                  style={{ background:'none', border:'1px solid '+C.border, cursor:'pointer', color:C.gray500, fontSize:'0.75rem', padding:'0.15rem 0.5rem', borderRadius:'3px' }}>✎ Edit</button>
                                <button onClick={async()=>{ if(confirm('Remove this question from this video?')){ await api.delete('/dashboard/curriculum/videos/'+activeVideo.id+'/quiz/'+q.id+'/'); loadQuestions(activeVideo.id) }}}
                                  style={{ background:'none', border:'1px solid #fca5a5', cursor:'pointer', color:C.red, fontSize:'0.75rem', padding:'0.15rem 0.5rem', borderRadius:'3px' }}>Remove</button>
                              </div>
                            </div>
                            <p style={{ fontFamily:'Georgia,serif', fontSize:'0.875rem', color:C.black, lineHeight:1.7, marginBottom:'0.625rem' }}>{q.text||q.question_text}</p>
                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.375rem', marginBottom:'0.5rem' }}>
                              {q.options?.map(opt => (
                                <div key={opt.id||opt.key} style={{ padding:'0.3rem 0.625rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.72rem', background:opt.is_correct?'#dcfce7':C.muted, border:'1px solid '+(opt.is_correct?'#86efac':C.border), display:'flex', gap:'0.375rem', alignItems:'center', color:opt.is_correct?'#166534':C.gray500 }}>
                                  <span style={{ fontWeight:'700', flexShrink:0 }}>{opt.key}.</span>
                                  <span style={{ flex:1 }}>{opt.text}</span>
                                  {opt.is_correct && <span style={{ marginLeft:'auto', flexShrink:0 }}>✓</span>}
                                </div>
                              ))}
                            </div>
                            {q.explanation && (
                              <div style={{ padding:'0.5rem 0.75rem', background:'#fffbeb', border:'1px solid #fcd34d', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.68rem', color:'#92400e', lineHeight:1.5 }}>
                                💡 {q.explanation}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Cheat sheet panel */}
                    {videoPanel === 'cheatsheet' && (
                      <div style={{ padding:'1.25rem', height:'100%', overflowY:'auto' }}>
                        {csLoad ? (
                          <p style={s.empty}>Loading cheat sheet…</p>
                        ) : (
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>

                            {/* Text content — pre-populated from DB */}
                            <div>
                              <p style={{ ...s.sectionLabel, marginBottom:'0.75rem' }}>📄 Text Content</p>
                              <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', color:C.gray400, marginBottom:'0.875rem', lineHeight:1.5 }}>
                                Stored in database. Shown as a card inside the platform.
                                {cheatsheet?.updated_at && <span style={{ color:C.green }}> Last saved: {new Date(cheatsheet.updated_at).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</span>}
                              </p>
                              <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                                <div>
                                  <label style={s.lbl}>Summary</label>
                                  <textarea id="cs-summary" rows={2}
                                    defaultKey={activeVideo?.id}
                                    key={'cs-sum-'+activeVideo?.id}
                                    defaultValue={cheatsheet?.summary || ''}
                                    style={{ ...s.inp, height:'56px', resize:'vertical' }}
                                    placeholder="Key takeaway from this video..." />
                                </div>
                                <div>
                                  <label style={s.lbl}>Key Points (one per line)</label>
                                  <textarea id="cs-points" rows={5}
                                    key={'cs-pts-'+activeVideo?.id}
                                    defaultValue={(cheatsheet?.key_points||[]).map(p=>'→ '+p).join('\n')}
                                    style={{ ...s.inp, height:'100px', resize:'vertical', fontFamily:"'SF Mono',monospace", fontSize:'0.75rem' }}
                                    placeholder={"→ First key point\n→ Second key point"} />
                                </div>
                                <button onClick={async () => {
                                  const summary   = document.getElementById('cs-summary')?.value || ''
                                  const rawPoints = document.getElementById('cs-points')?.value || ''
                                  const keyPoints = rawPoints.split('\n').map(l=>l.replace(/^[→•-]\s*/,'')).filter(Boolean)
                                  try {
                                    await api.post('/dashboard/curriculum/videos/' + activeVideo.id + '/cheatsheet/', { summary, key_points: keyPoints })
                                    notify('Cheat sheet saved ✓')
                                    loadCheatsheet(activeVideo.id)
                                  } catch { notify('Failed to save', 'error') }
                                }} style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:'700', padding:'0.5rem 1.25rem', background:C.red, color:'#fff', border:'none', borderRadius:'4px', cursor:'pointer', alignSelf:'flex-start' }}>
                                  Save Text Cheat Sheet
                                </button>
                              </div>
                            </div>

                            {/* PDF files */}
                            <div>
                              <p style={{ ...s.sectionLabel, marginBottom:'0.75rem' }}>📁 PDF Files</p>

                              {/* Existing PDFs */}
                              {cheatsheet?.files?.length > 0 && (
                                <div style={{ marginBottom:'0.875rem' }}>
                                  <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', color:C.gray400, marginBottom:'0.375rem' }}>Linked PDFs</p>
                                  {cheatsheet.files.map(f => (
                                    <div key={f.id} style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.5rem 0.625rem', background:C.bg, border:'1px solid '+C.border, borderRadius:'4px', marginBottom:'4px' }}>
                                      <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:C.black, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.title}</span>
                                      <a href={f.bunny_file_url} target="_blank" rel="noreferrer" style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', color:C.blue }}>↗</a>
                                      <button onClick={async()=>{
                                        await api.delete('/dashboard/curriculum/videos/'+activeVideo.id+'/cheatsheet/file/'+f.id+'/').catch(()=>{})
                                        loadCheatsheet(activeVideo.id)
                                        notify('PDF removed')
                                      }} style={{ background:'none', border:'none', cursor:'pointer', color:C.red, fontSize:'0.75rem' }}>✕</button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', color:C.gray400, marginBottom:'0.875rem', lineHeight:1.5 }}>
                                Upload to Bunny Storage first, paste CDN URL below.
                              </p>
                              <div style={{ display:'flex', flexDirection:'column', gap:'0.625rem' }}>
                                <div>
                                  <label style={s.lbl}>PDF Title</label>
                                  <input id="pdf-title" style={s.inp} placeholder={(activeVideo?.title||'') + ' — Cheat Sheet'} />
                                </div>
                                <div>
                                  <label style={s.lbl}>Bunny CDN URL</label>
                                  <input id="pdf-url" style={s.inp} placeholder="https://cdn.gradskool.com/cheatsheets/xxx.pdf" />
                                </div>
                                <button onClick={async () => {
                                  const title = document.getElementById('pdf-title')?.value || (activeVideo?.title||'') + ' — Cheat Sheet'
                                  const url   = document.getElementById('pdf-url')?.value || ''
                                  if (!url) { notify('Paste the Bunny CDN URL first', 'error'); return }
                                  try {
                                    await api.post('/dashboard/curriculum/videos/' + activeVideo.id + '/cheatsheet/file/', { title, bunny_file_url: url })
                                    notify('PDF linked ✓')
                                    loadCheatsheet(activeVideo.id)
                                  } catch { notify('Failed', 'error') }
                                }} style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:'700', padding:'0.5rem 1.25rem', background:C.black, color:'#fff', border:'none', borderRadius:'4px', cursor:'pointer', alignSelf:'flex-start' }}>
                                  Link PDF
                                </button>
                                <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:'4px', padding:'0.625rem', fontFamily:'var(--font-sans)', fontSize:'0.62rem', color:'#1d4ed8', lineHeight:1.6 }}>
                                  Upload to Bunny Storage → copy CDN URL → paste above
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── STUDENTS TAB ────────────────────────────────────────────── */}
      {activeTab === 'students' && (
        <div style={{ maxWidth:'800px', margin:'0 auto', padding:'2rem' }}>
          <p style={s.sectionLabel}>{course.enrolled||0} Enrolled Students</p>
          <div style={{ marginTop:'1rem', display:'flex', gap:'0.75rem' }}>
            <Link href={'/admin-panel/bulk-enroll?course='+id}
              style={{ padding:'0.625rem 1.25rem', background:C.red, color:'#fff', borderRadius:'4px', fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', textDecoration:'none' }}>
              + Bulk Enroll Students
            </Link>
            <Link href={'/admin-panel/students?course='+id}
              style={{ padding:'0.625rem 1.25rem', background:C.white, color:C.black, border:'1px solid '+C.border, borderRadius:'4px', fontFamily:'var(--font-sans)', fontSize:'0.82rem', textDecoration:'none' }}>
              View All Students →
            </Link>
          </div>
        </div>
      )}

      {/* ── MODALS ──────────────────────────────────────────────────── */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }} onClick={e=>e.target===e.currentTarget&&(setModal(null),setForm({}))}>
          <div style={{ background:C.white, borderRadius:'8px', width:'100%', maxWidth:'520px', maxHeight:'90vh', overflowY:'auto', padding:'2rem', boxShadow:'0 24px 64px rgba(0,0,0,0.25)' }}>
            {modal === 'section' && (
              <>
                <p style={s.mTitle}>{form.id?'Edit Section':'Add Section'}</p>
                <div style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
                  <F label="Section Title *" value={form.title||''} onChange={v=>setForm(f=>({...f,title:v}))} placeholder="e.g. Verbal Ability & Reading Comprehension" />
                  <F label="Short Title" value={form.short_title||''} onChange={v=>setForm(f=>({...f,short_title:v}))} placeholder="e.g. VARC" />
                  <F label="Description" value={form.description||''} onChange={v=>setForm(f=>({...f,description:v}))} textarea placeholder="Optional..." />
                </div>
                <Foot onCancel={()=>{setModal(null);setForm({})}} onSave={saveSection} saving={saving} valid={!!form.title} label={form.id?'Update':'Create Section'} />
              </>
            )}

            {modal === 'topic' && (
              <>
                <p style={s.mTitle}>{form.id?'Edit Topic':'Add Topic'}</p>
                <div style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
                  <F label="Topic Title *" value={form.title||''} onChange={v=>setForm(f=>({...f,title:v}))} placeholder="e.g. Reading Comprehension Strategy" />
                  <F label="Sort Order" value={form.sort_order||''} onChange={v=>setForm(f=>({...f,sort_order:v}))} placeholder="1" type="number" />
                </div>
                <Foot onCancel={()=>{setModal(null);setForm({})}} onSave={saveTopic} saving={saving} valid={!!form.title} label={form.id?'Update':'Add Topic'} />
              </>
            )}

            {modal === 'video' && (
              <>
                <p style={s.mTitle}>{form.id?'Edit Video':'Add Video'}</p>
                {/* Flow preview */}
                <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:'4px', padding:'0.625rem 1rem', marginBottom:'1.25rem', fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:'#1d4ed8' }}>
                  Flow: Watch → {form.has_cheatsheet!==false?'Cheat Sheet → ':''}{form.has_quiz?'Quiz ('+( form.quiz_duration_mins||40)+'min) → ':''}{form.has_live?'Live Class → ':''}Done ✓
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
                  <F label="Title *" value={form.title||''} onChange={v=>setForm(f=>({...f,title:v}))} placeholder="e.g. RC Strategy — Introduction" />
                  <div>
                    <label style={s.lbl}>Source</label>
                    <select value={form.video_source||'bunny'} onChange={e=>setForm(f=>({...f,video_source:e.target.value}))} style={s.inp}>
                      <option value="bunny">Bunny Stream</option>
                      <option value="youtube">YouTube</option>
                    </select>
                  </div>
                  <F label="Video ID" value={form.bunny_video_id||''} onChange={v=>setForm(f=>({...f,bunny_video_id:v}))} placeholder="Bunny GUID or YouTube ID" />
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                    <F label="Duration (mins)" value={form.duration_mins||''} onChange={v=>setForm(f=>({...f,duration_mins:v}))} type="number" />
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
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem', marginBottom:'0.25rem' }}>
                    <label style={{ display:'flex', alignItems:'center', gap:'0.375rem', cursor:'pointer', padding:'0.5rem', border:'1px solid '+(form.is_free_preview?'#22c55e':C.border), borderRadius:'4px', background:form.is_free_preview?'#f0fdf4':'#fff' }}>
                      <input type="checkbox" checked={!!form.is_free_preview} onChange={e=>setForm(f=>({...f,is_free_preview:e.target.checked}))} />
                      <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'700', color:form.is_free_preview?'#166534':'#666' }}>🆓 Free Preview</span>
                    </label>
                    <div style={{ padding:'0.5rem', background:'#fffbeb', border:'1px solid #fcd34d', borderRadius:'4px' }}>
                      <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.6rem', color:'#92400e', lineHeight:1.4 }}>Mark this video as free preview — visible without enrollment. First 10% of course recommended.</p>
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.5rem' }}>
                    {[['📄 Cheat Sheet','has_cheatsheet',true],['📝 Quiz','has_quiz',false],['📡 Live','has_live',false]].map(([lbl,key,def])=>(
                      <label key={key} style={{ display:'flex', alignItems:'center', gap:'0.375rem', cursor:'pointer', padding:'0.5rem', border:'1px solid '+(form[key]!==false&&(form[key]||def)?C.green:C.border), borderRadius:'4px', background:form[key]!==false&&(form[key]||def)?'#f0fdf4':'#fff' }}>
                        <input type="checkbox" checked={form[key]!==false&&!!(form[key]!==undefined?form[key]:def)} onChange={e=>setForm(f=>({...f,[key]:e.target.checked}))} />
                        <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem' }}>{lbl}</span>
                      </label>
                    ))}
                  </div>
                  {form.has_quiz && (
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', padding:'0.75rem', background:'#fffbeb', border:'1px solid #fcd34d', borderRadius:'4px' }}>
                      <F label="Quiz Duration (mins)" value={form.quiz_duration_mins||40} onChange={v=>setForm(f=>({...f,quiz_duration_mins:parseInt(v)||40}))} type="number" />
                      <F label="No. of Questions" value={form.quiz_question_count||10} onChange={v=>setForm(f=>({...f,quiz_question_count:parseInt(v)||10}))} type="number" />
                    </div>
                  )}
                  {form.has_live && <F label="Live Class Description" value={form.live_description||''} onChange={v=>setForm(f=>({...f,live_description:v}))} placeholder="Live Q&A with ALP Sir..." textarea />}
                </div>
                <Foot onCancel={()=>{setModal(null);setForm({})}} onSave={saveVideo} saving={saving} valid={!!form.title} label={form.id?'Update':'Add Video'} />
              </>
            )}

            {/* Mock test config modal */}
            {modal === 'config_mock_test' && (
              <>
                <p style={s.mTitle}>Mock Test Settings</p>
                <div style={{ background:'#fffbeb', border:'1px solid #fcd34d', borderRadius:'6px', padding:'1rem', marginBottom:'1.25rem', fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:'#92400e', lineHeight:1.6 }}>
                  <strong>Mock Provider:</strong> Choose Testfunda (3rd-party) or your own mock system (once built).
                  This can be changed at any time — no student data is affected.
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
                  <div>
                    <label style={s.lbl}>Mock Provider</label>
                    <select value={form.provider||'testfunda'} onChange={e=>setForm(f=>({...f,provider:e.target.value}))} style={s.inp}>
                      <option value="testfunda">Testfunda (3rd party — current)</option>
                      <option value="own">Own Mock System (when ready)</option>
                      <option value="custom_url">Custom URL</option>
                    </select>
                  </div>
                  {(form.provider==='testfunda'||!form.provider) && (
                    <>
                      <F label="Testfunda Mock URL" value={form.redirect_url||''} onChange={v=>setForm(f=>({...f,redirect_url:v}))} placeholder="https://gradskool.testfunda.com/..." />
                      <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', color:C.gray400, lineHeight:1.5 }}>
                        Students will be redirected to this URL. Testfunda credentials are sent separately via Admin → Mock Credentials.
                      </p>
                    </>
                  )}
                  {form.provider==='own' && (
                    <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:C.blue, lineHeight:1.6, padding:'0.75rem', background:'#eff6ff', borderRadius:'4px' }}>
                      Your own mock system will be used once it's built. Students will take mocks directly on GRADSKOOL.
                    </p>
                  )}
                  {form.provider==='custom_url' && (
                    <F label="Custom Mock URL" value={form.redirect_url||''} onChange={v=>setForm(f=>({...f,redirect_url:v}))} placeholder="https://..." />
                  )}
                  <F label="Mock Count (for display)" value={form.mock_count||''} onChange={v=>setForm(f=>({...f,mock_count:v}))} placeholder="e.g. 6" type="number" />
                  <F label="Display Label (optional)" value={form.label||''} onChange={v=>setForm(f=>({...f,label:v}))} placeholder="e.g. 6 Full-Length CAT Mocks" />
                </div>
                <Foot onCancel={()=>{setModal(null);setForm({})}}
                  onSave={async()=>{
                    setSaving(true)
                    try {
                      await api.put('/dashboard/course-builder/'+id+'/components/'+form.id+'/', { config:{ provider:form.provider, redirect_url:form.redirect_url, mock_count:form.mock_count, label:form.label } })
                      notify('Mock settings saved'); setModal(null); setForm({}); load()
                    } catch { notify('Failed','error') }
                    finally { setSaving(false) }
                  }}
                  saving={saving} valid={true} label="Save Mock Settings" />
              </>
            )}

            {/* Pre-test / Post-test config */}
            {(modal === 'config_pre_test' || modal === 'config_post_test') && (
              <>
                <p style={s.mTitle}>{modal==='config_pre_test'?'Pre-Test':'Post-Test'} Settings</p>
                <div style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
                  <F label="Display Title" value={form.title||''} onChange={v=>setForm(f=>({...f,title:v}))} placeholder={modal==='config_pre_test'?'Pre-Test Diagnostic':'Final Assessment'} />
                  <F label="Number of Questions" value={form.question_count||''} onChange={v=>setForm(f=>({...f,question_count:v}))} placeholder="e.g. 20" type="number" />
                  <F label="Duration (mins)" value={form.duration_mins||''} onChange={v=>setForm(f=>({...f,duration_mins:v}))} placeholder="e.g. 30" type="number" />
                  <F label="Pass % (to unlock next component)" value={form.pass_pct||''} onChange={v=>setForm(f=>({...f,pass_pct:v}))} placeholder="e.g. 50 (leave blank to not gate)" type="number" />
                  <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:'4px', padding:'0.75rem', fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:'#166534' }}>
                    {form.pass_pct ? 'Students must score '+form.pass_pct+'% to proceed to the next component.' : 'No gate — students can proceed regardless of score.'}
                  </div>
                </div>
                <Foot onCancel={()=>{setModal(null);setForm({})}}
                  onSave={async()=>{
                    setSaving(true)
                    try {
                      await api.put('/dashboard/course-builder/'+id+'/components/'+form.id+'/', {
                        title: form.title,
                        config: { question_count:form.question_count, duration_mins:form.duration_mins, pass_pct:form.pass_pct }
                      })
                      notify('Test settings saved'); setModal(null); setForm({}); load()
                    } catch { notify('Failed','error') }
                    finally { setSaving(false) }
                  }}
                  saving={saving} valid={true} label="Save Settings" />
              </>
            )}

            {/* Resources config */}
            {modal === 'config_resources' && (
              <>
                <p style={s.mTitle}>Resources / Downloads</p>
                <div style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
                  <F label="Section Title" value={form.title||''} onChange={v=>setForm(f=>({...f,title:v}))} placeholder="e.g. Course Materials" />
                  <div>
                    <label style={s.lbl}>Resources (one per line: Title | URL)</label>
                    <textarea value={form.items_text||''} onChange={e=>setForm(f=>({...f,items_text:e.target.value}))}
                      placeholder={"CAT Formula Sheet | https://...\nRC Strategy PDF | https://...\nMock Test Schedule | https://..."}
                      style={{ width:'100%', padding:'0.5rem 0.625rem', fontFamily:"'SF Mono',monospace", fontSize:'0.75rem', border:'1px solid #e8e8e6', borderRadius:'4px', outline:'none', color:'#0f0f0f', boxSizing:'border-box', height:'120px', resize:'vertical' }} />
                  </div>
                </div>
                <Foot onCancel={()=>{setModal(null);setForm({})}}
                  onSave={async()=>{
                    const items = (form.items_text||'').split('\n').filter(Boolean).map(line => {
                      const [title, url] = line.split('|').map(s=>s.trim())
                      return { title, url }
                    }).filter(i=>i.title&&i.url)
                    setSaving(true)
                    try {
                      await api.put('/dashboard/course-builder/'+id+'/components/'+form.id+'/', {
                        title: form.title,
                        config: { items }
                      })
                      notify('Resources saved'); setModal(null); setForm({}); load()
                    } catch { notify('Failed','error') }
                    finally { setSaving(false) }
                  }}
                  saving={saving} valid={true} label="Save Resources" />
              </>
            )}

            {modal === 'question' && (
              <>
                <p style={s.mTitle}>{form.isEdit ? 'Edit Question' : 'Add Quiz Question'}</p>
                <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:C.gray400, marginBottom:'1.25rem' }}>For: {activeVideo?.title}</p>
                <div style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
                  <F label="Question Text *" value={form.text||''} onChange={v=>setForm(f=>({...f,text:v}))} textarea placeholder="Enter question..." />
                  {['A','B','C','D'].map(key=>(
                    <div key={key} style={{ display:'flex', alignItems:'center', gap:'0.625rem' }}>
                      <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', color:C.gray400, width:'16px' }}>{key}.</span>
                      <input value={form['opt_'+key]||''} onChange={e=>setForm(f=>({...f,['opt_'+key]:e.target.value}))} placeholder={'Option '+key} style={{ ...s.inp, flex:1 }} />
                      <label style={{ display:'flex', alignItems:'center', gap:'0.3rem', cursor:'pointer', flexShrink:0 }}>
                        <input type="radio" name="correct" value={key} checked={form.correct===key} onChange={()=>setForm(f=>({...f,correct:key}))} />
                        <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', color:C.gray500 }}>Correct</span>
                      </label>
                    </div>
                  ))}
                  <F label="Explanation" value={form.explanation||''} onChange={v=>setForm(f=>({...f,explanation:v}))} textarea placeholder="Why is this the correct answer?" />
                </div>
                <Foot onCancel={()=>{setModal(null);setForm({})}} onSave={saveQuestion} saving={saving} valid={!!form.text&&!!form.correct} label="Add Question" />
              </>
            )}
          </div>
        </div>
      )}
    </div>
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

function Foot({ onCancel, onSave, saving, valid, label }) {
  return (
    <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.75rem', marginTop:'1.5rem', paddingTop:'1rem', borderTop:'1px solid #e8e8e6' }}>
      <button onClick={onCancel} style={{ padding:'0.625rem 1.25rem', border:'1px solid #e8e8e6', borderRadius:'4px', background:'#fff', fontFamily:'var(--font-sans)', fontSize:'0.82rem', cursor:'pointer', color:'#666' }}>Cancel</button>
      <button onClick={onSave} disabled={saving||!valid} style={{ padding:'0.625rem 1.5rem', background:saving||!valid?'#999':'#ff5e5f', color:'#fff', border:'none', borderRadius:'4px', fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', cursor:saving||!valid?'not-allowed':'pointer' }}>
        {saving?'Saving…':label}
      </button>
    </div>
  )
}

const s = {
  sectionLabel: { fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:'#999' },
  lbl: { fontFamily:'var(--font-sans)', fontSize:'0.7rem', fontWeight:'700', color:'#666', display:'block', marginBottom:'0.25rem' },
  inp: { width:'100%', padding:'0.5rem 0.625rem', fontFamily:'var(--font-sans)', fontSize:'0.82rem', border:'1px solid #e8e8e6', borderRadius:'4px', outline:'none', color:'#0f0f0f', boxSizing:'border-box', background:'#fff' },
  colH: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.75rem 1rem', borderBottom:'1px solid #e8e8e6', position:'sticky', top:0, background:'#fff', zIndex:10 },
  colT: { fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', letterSpacing:'0.08em', textTransform:'uppercase', color:'#999' },
  addB: { fontFamily:'var(--font-sans)', fontSize:'0.68rem', fontWeight:'700', padding:'0.25rem 0.5rem', background:'#ff5e5f', color:'#fff', border:'none', borderRadius:'3px', cursor:'pointer' },
  row:  { display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.625rem 1rem', borderBottom:'1px solid #e8e8e6', cursor:'pointer', transition:'background 0.1s' },
  rowT: { fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:'600', color:'#0f0f0f', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  rowS: { fontFamily:'var(--font-sans)', fontSize:'0.62rem', color:'#999', marginTop:'0.1rem' },
  iconB:{ background:'none', border:'none', cursor:'pointer', color:'#999', fontSize:'0.875rem', padding:'0.15rem 0.25rem' },
  empty:{ padding:'2rem', textAlign:'center', fontFamily:'Georgia,serif', color:'#999', fontSize:'0.875rem' },
  mTitle:{ fontFamily:'Georgia,serif', fontSize:'1.25rem', fontWeight:'700', color:'#0f0f0f', marginBottom:'1.5rem' },
}

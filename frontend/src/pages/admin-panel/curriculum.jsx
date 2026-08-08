/**
 * GRADSKOOL Admin — Curriculum Manager
 * Route: /admin-panel/curriculum
 */
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '../../hooks/useAuth'
import api from '../../lib/api'

const C = {
  red:'#ff5e5f', black:'#0f0f0f', white:'#fff',
  bg:'#f7f6f3', border:'#e8e8e6', gray50:'#fafaf9',
  gray400:'#999', gray500:'#666', gray200:'#e8e8e6',
  green:'#22c55e', amber:'#f59e0b', blue:'#3b82f6',
}

const EXAMS = ['cat','xat','snap','nmat','gmat','gre','ipmat','cmat','mhcet','clat','cuet']

export default function CurriculumPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user?.role !== 'admin') router.replace('/dashboard')
  }, [user, isLoading])

  const [exam,          setExam]         = useState('cat')
  const [data,          setData]         = useState(null)
  const [loading,       setLoad]         = useState(true)
  const [msg,           setMsg]          = useState(null)
  const [activeSection, setActiveSection]= useState(null)
  const [activeTopic,   setActiveTopic]  = useState(null)
  const [activeVideo,   setActiveVideo]  = useState(null)
  const [rightPanel,    setRightPanel]   = useState('videos')
  const [modal,         setModal]        = useState(null)
  const [form,          setForm]         = useState({})
  const [saving,        setSaving]       = useState(false)
  const [questions,     setQuestions]    = useState([])
  const [qLoad,         setQLoad]        = useState(false)

  const loadData = () => {
    setLoad(true)
    api.get('/dashboard/curriculum/?exam=' + exam)
      .then(({ data: d }) => setData(d))
      .catch(() => notify('Failed to load curriculum', 'error'))
      .finally(() => setLoad(false))
  }

  useEffect(() => { loadData() }, [exam])

  const loadQuestions = (videoId) => {
    setQLoad(true)
    api.get('/dashboard/curriculum/videos/' + videoId + '/quiz/')
      .then(({ data: d }) => setQuestions(d.questions || []))
      .catch(() => setQuestions([]))
      .finally(() => setQLoad(false))
  }

  useEffect(() => {
    if (activeVideo && rightPanel === 'quiz') loadQuestions(activeVideo.id)
  }, [activeVideo, rightPanel])

  const notify = (text, type='success') => {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 3000)
  }

  const openModal = (type, prefill={}) => { setForm(prefill); setModal(type) }
  const closeModal = () => { setModal(null); setForm({}) }

  const saveSection = async () => {
    setSaving(true)
    try {
      if (form.id) await api.put('/dashboard/curriculum/sections/' + form.id + '/', form)
      else await api.post('/dashboard/curriculum/sections/', { ...form, exam_slug: exam })
      notify(form.id ? 'Section updated' : 'Section created')
      closeModal(); loadData()
    } catch (e) { notify(e.response?.data?.error || 'Failed', 'error') }
    finally { setSaving(false) }
  }

  const deleteSection = async (id) => {
    if (!confirm('Delete this section and all its topics?')) return
    try { await api.delete('/dashboard/curriculum/sections/' + id + '/'); notify('Section deleted'); setActiveSection(null); setActiveTopic(null); setActiveVideo(null); loadData() }
    catch { notify('Failed to delete', 'error') }
  }

  const saveTopic = async () => {
    setSaving(true)
    try {
      if (form.id) await api.put('/dashboard/curriculum/topics/' + form.id + '/', form)
      else await api.post('/dashboard/curriculum/topics/', { ...form, section_id: activeSection?.id })
      notify(form.id ? 'Topic updated' : 'Topic created')
      closeModal(); loadData()
    } catch (e) { notify(e.response?.data?.error || 'Failed', 'error') }
    finally { setSaving(false) }
  }

  const deleteTopic = async (id) => {
    if (!confirm('Delete this topic and all its videos?')) return
    try { await api.delete('/dashboard/curriculum/topics/' + id + '/'); notify('Topic deleted'); setActiveTopic(null); setActiveVideo(null); loadData() }
    catch { notify('Failed to delete', 'error') }
  }

  const saveVideo = async () => {
    setSaving(true)
    try {
      if (form.id) await api.put('/dashboard/curriculum/videos/' + form.id + '/', form)
      else await api.post('/dashboard/curriculum/videos/', { ...form, topic_id: activeTopic?.id })
      notify(form.id ? 'Video updated' : 'Video added')
      closeModal(); loadData()
    } catch (e) { notify(e.response?.data?.error || 'Failed', 'error') }
    finally { setSaving(false) }
  }

  const deleteVideo = async (id) => {
    if (!confirm('Delete this video?')) return
    try { await api.delete('/dashboard/curriculum/videos/' + id + '/'); notify('Video deleted'); setActiveVideo(null); loadData() }
    catch { notify('Failed to delete', 'error') }
  }

  const saveQuestion = async () => {
    setSaving(true)
    try {
      const options = ['A','B','C','D'].map(key => ({
        key, text: form['opt_' + key] || '', is_correct: form.correct === key
      })).filter(o => o.text)
      await api.post('/dashboard/curriculum/videos/' + activeVideo.id + '/quiz/', {
        text: form.text, explanation: form.explanation || '', difficulty: form.difficulty || 'medium', options
      })
      notify('Question added'); closeModal(); loadQuestions(activeVideo.id)
    } catch (e) { notify(e.response?.data?.error || 'Failed', 'error') }
    finally { setSaving(false) }
  }

  const deleteQuestion = async (qId) => {
    if (!confirm('Delete this question?')) return
    try { await api.delete('/dashboard/curriculum/videos/' + activeVideo.id + '/quiz/' + qId + '/'); notify('Deleted'); loadQuestions(activeVideo.id) }
    catch { notify('Failed', 'error') }
  }

  const sections = data?.sections || []
  const topics   = activeSection ? (sections.find(s => s.id === activeSection.id)?.topics || []) : []
  const videos   = activeTopic   ? (topics.find(t => t.id === activeTopic.id)?.videos || [])   : []

  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <Head><title>Curriculum — Admin — GRADSKOOL</title></Head>

      <div style={s.topbar}>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <Link href="/admin-panel" style={s.logo}><span style={{ color:C.red }}>GRAD</span>SKOOL</Link>
          <span style={{ color:C.border }}>|</span>
          <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:C.gray400 }}>Curriculum Manager</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <select value={exam} onChange={e => { setExam(e.target.value); setActiveSection(null); setActiveTopic(null); setActiveVideo(null) }}
            style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', padding:'0.375rem 0.625rem', border:'1px solid ' + C.border, borderRadius:'4px', background:C.white, cursor:'pointer', color:C.black, fontWeight:'700' }}>
            {EXAMS.map(e => <option key={e} value={e}>{e.toUpperCase()}</option>)}
          </select>
          <Link href="/admin-panel" style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', color:C.gray400, textDecoration:'none' }}>Back to Admin</Link>
        </div>
      </div>

      {msg && (
        <div style={{ position:'fixed', top:'64px', right:'1.5rem', zIndex:999,
          background: msg.type==='error' ? '#fee2e2' : '#dcfce7',
          border:'1px solid ' + (msg.type==='error' ? '#fca5a5' : '#86efac'),
          padding:'0.75rem 1.25rem', borderRadius:'4px',
          fontFamily:'var(--font-sans)', fontSize:'0.82rem',
          color: msg.type==='error' ? '#991b1b' : '#166534' }}>
          {msg.text}
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'240px 240px 1fr', overflowX:'auto', height:'calc(100vh - 56px)' }}>

        {/* SECTIONS */}
        <div style={s.col}>
          <div style={s.colHeader}>
            <span style={s.colTitle}>Sections</span>
            <button onClick={() => openModal('section')} style={s.addBtn}>+ Add</button>
          </div>
          {loading ? <p style={s.empty}>Loading…</p>
          : sections.length === 0 ? <p style={s.empty}>No sections yet</p>
          : sections.map(sec => (
            <div key={sec.id} onClick={() => { setActiveSection(sec); setActiveTopic(null); setActiveVideo(null) }}
              style={{ ...s.row, background: activeSection?.id===sec.id ? '#fff5f5' : C.white, borderLeft: activeSection?.id===sec.id ? '3px solid ' + C.red : '3px solid transparent' }}>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={s.rowTitle}>{sec.title}</p>
                <p style={s.rowSub}>{sec.topic_count} topics · {sec.short_title}</p>
              </div>
              <div style={{ display:'flex', gap:'0.25rem', flexShrink:0 }}>
                <button onClick={e => { e.stopPropagation(); openModal('section', sec) }} style={s.iconBtn}>✎</button>
                <button onClick={e => { e.stopPropagation(); deleteSection(sec.id) }} style={{ ...s.iconBtn, color:C.red }}>✕</button>
              </div>
            </div>
          ))}
        </div>

        {/* TOPICS */}
        <div style={{ ...s.col, borderLeft:'1px solid ' + C.border }}>
          <div style={s.colHeader}>
            <span style={s.colTitle}>{activeSection ? activeSection.short_title + ' Topics' : 'Topics'}</span>
            {activeSection && <button onClick={() => openModal('topic')} style={s.addBtn}>+ Add</button>}
          </div>
          {!activeSection ? <p style={s.empty}>Select a section</p>
          : topics.length === 0 ? <p style={s.empty}>No topics yet</p>
          : topics.map(topic => (
            <div key={topic.id} onClick={() => { setActiveTopic(topic); setActiveVideo(null) }}
              style={{ ...s.row, background: activeTopic?.id===topic.id ? '#fff5f5' : C.white, borderLeft: activeTopic?.id===topic.id ? '3px solid ' + C.red : '3px solid transparent' }}>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={s.rowTitle}>{topic.title}</p>
                <p style={s.rowSub}>{topic.video_count} videos</p>
              </div>
              <div style={{ display:'flex', gap:'0.25rem', flexShrink:0 }}>
                <button onClick={e => { e.stopPropagation(); openModal('topic', topic) }} style={s.iconBtn}>✎</button>
                <button onClick={e => { e.stopPropagation(); deleteTopic(topic.id) }} style={{ ...s.iconBtn, color:C.red }}>✕</button>
              </div>
            </div>
          ))}
        </div>

        {/* VIDEOS + PANELS */}
        <div style={{ ...s.col, borderLeft:'1px solid ' + C.border, overflow:'hidden', display:'flex', flexDirection:'column' }}>
          {!activeTopic ? (
            <p style={s.empty}>Select a topic to manage its videos</p>
          ) : (
            <>
              <div style={{ borderBottom:'1px solid ' + C.border }}>
                <div style={s.colHeader}>
                  <span style={s.colTitle}>{activeTopic.title}</span>
                  <button onClick={() => openModal('video')} style={s.addBtn}>+ Add Video</button>
                </div>
                <div style={{ maxHeight:'220px', overflowY:'auto' }}>
                  {videos.length === 0 ? <p style={s.empty}>No videos yet</p>
                  : videos.map(v => (
                    <div key={v.id} onClick={() => { setActiveVideo(v); setRightPanel('videos') }}
                      style={{ ...s.row, background: activeVideo?.id===v.id ? '#eff6ff' : C.white, borderLeft: activeVideo?.id===v.id ? '3px solid ' + C.blue : '3px solid transparent' }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={s.rowTitle}>{v.title || '(untitled)'}</p>
                        <p style={s.rowSub}>{v.duration_mins}min · {v.video_source||'bunny'}{v.has_cheatsheet ? ' · 📄' : ''}{v.has_quiz ? ' · 📝 ' + (v.quiz_duration_mins||40) + 'min' : ''}{v.has_live ? ' · 📡' : ''}</p>
                      </div>
                      <div style={{ display:'flex', gap:'0.25rem', flexShrink:0 }}>
                        <button onClick={e => { e.stopPropagation(); openModal('video', v) }} style={s.iconBtn}>✎</button>
                        <button onClick={e => { e.stopPropagation(); deleteVideo(v.id) }} style={{ ...s.iconBtn, color:C.red }}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {activeVideo && (
                <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>
                  <div style={{ display:'flex', borderBottom:'1px solid ' + C.border, background:C.white }}>
                    {[['videos','📹 Video'],['quiz','📝 Quiz'],['cheatsheet','📄 Cheat Sheet']].map(([id,label]) => (
                      <button key={id} onClick={() => setRightPanel(id)}
                        style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', padding:'0.625rem 1rem', border:'none', borderBottom:'2px solid ' + (rightPanel===id ? C.red : 'transparent'), background:'none', cursor:'pointer', color: rightPanel===id ? C.black : C.gray400, fontWeight: rightPanel===id ? '700' : '400', marginBottom:'-1px' }}>
                        {label}
                      </button>
                    ))}
                  </div>

                  {rightPanel === 'videos' && (
                    <div style={{ padding:'1.5rem' }}>
                      <div style={{ background:C.white, border:'1px solid ' + C.border, borderRadius:'6px', padding:'1.25rem', marginBottom:'1rem' }}>
                        <p style={s.panelLabel}>Video Details</p>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginTop:'0.75rem' }}>
                          {[['Title',activeVideo.title],['Duration',activeVideo.duration_mins+'min'],['Source',activeVideo.video_source||'bunny'],['Difficulty',activeVideo.difficulty],['Video ID',activeVideo.bunny_video_id||'(not set)'],['Sort Order',activeVideo.sort_order]].map(([l,v]) => (
                            <div key={l}><p style={{ fontFamily:'var(--font-sans)', fontSize:'0.6rem', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.08em', color:C.gray400 }}>{l}</p>
                            <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:C.black, marginTop:'0.15rem', wordBreak:'break-all' }}>{v}</p></div>
                          ))}
                        </div>
                        <div style={{ display:'flex', gap:'0.5rem', marginTop:'1rem', paddingTop:'1rem', borderTop:'1px solid ' + C.border }}>
                          {[
            ['📄 Cheat Sheet', activeVideo.has_cheatsheet, ''],
            ['📝 Quiz', activeVideo.has_quiz, activeVideo.quiz_duration_mins ? activeVideo.quiz_duration_mins + 'min · ' + (activeVideo.quiz_question_count||10) + 'q' : ''],
            ['📡 Live Class', activeVideo.has_live, ''],
          ].map(([l,on,detail]) => (
                            <span key={l} style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', padding:'0.2rem 0.5rem', borderRadius:'3px', background: on ? '#dcfce7' : '#f1f5f9', color: on ? '#166534' : C.gray400, border:'1px solid ' + (on ? '#86efac' : C.border) }}>
                              {on ? '✓' : '✗'} {l}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button onClick={() => openModal('video', activeVideo)} style={s.editBtn}>✎ Edit Video</button>
                    </div>
                  )}

                  {rightPanel === 'quiz' && (
                    <div style={{ padding:'1.5rem' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
                        <div>
                          <p style={s.panelLabel}>Quiz Questions</p>
                          <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:C.gray400 }}>{questions.length} questions · shown after student marks video watched</p>
                        </div>
                        <button onClick={() => openModal('question')} style={s.addBtn}>+ Add Question</button>
                      </div>
                      {qLoad ? <p style={s.empty}>Loading…</p>
                      : questions.length === 0 ? (
                        <div style={{ textAlign:'center', padding:'2rem', border:'1px dashed ' + C.border, borderRadius:'6px' }}>
                          <p style={{ fontSize:'1.5rem', marginBottom:'0.5rem' }}>📝</p>
                          <p style={{ fontFamily:'Georgia,serif', fontSize:'0.9rem', color:C.black, marginBottom:'0.25rem' }}>No questions yet</p>
                          <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', color:C.gray400, marginBottom:'1rem' }}>Questions pop after the student marks the video as watched</p>
                          <button onClick={() => openModal('question')} style={s.addBtn}>+ Add First Question</button>
                        </div>
                      ) : questions.map((q, i) => (
                        <div key={q.id} style={{ background:C.white, border:'1px solid ' + C.border, borderRadius:'6px', padding:'1rem', marginBottom:'0.75rem' }}>
                          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.5rem' }}>
                            <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', color:C.gray400 }}>Q{i+1}</p>
                            <button onClick={() => deleteQuestion(q.id)} style={{ background:'none', border:'none', cursor:'pointer', color:C.red, fontSize:'0.875rem' }}>✕</button>
                          </div>
                          <p style={{ fontFamily:'Georgia,serif', fontSize:'0.875rem', color:C.black, lineHeight:1.6, marginBottom:'0.625rem' }}>{q.text}</p>
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.375rem' }}>
                            {q.options.map(opt => (
                              <div key={opt.id} style={{ padding:'0.375rem 0.625rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.72rem', background: opt.is_correct ? '#dcfce7' : C.gray50, border:'1px solid ' + (opt.is_correct ? '#86efac' : C.border), color: opt.is_correct ? '#166534' : C.gray600, display:'flex', gap:'0.375rem' }}>
                                <span style={{ fontWeight:'700' }}>{opt.key}.</span><span>{opt.text}</span>{opt.is_correct && <span style={{ marginLeft:'auto' }}>✓</span>}
                              </div>
                            ))}
                          </div>
                          {q.explanation && <div style={{ marginTop:'0.5rem', padding:'0.5rem 0.75rem', background:'#fffbeb', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.7rem', color:'#92400e' }}>💡 {q.explanation}</div>}
                        </div>
                      ))}
                    </div>
                  )}

                  {rightPanel === 'cheatsheet' && (
                    <div style={{ padding:'1.5rem' }}>
                      <p style={s.panelLabel}>Cheat Sheet</p>
                      <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:C.gray400, marginTop:'0.15rem', marginBottom:'1rem' }}>Shown after student passes the quiz.</p>
                      <div style={{ background:'#fffbeb', border:'1px solid #fcd34d', borderRadius:'6px', padding:'1rem', marginBottom:'1rem' }}>
                        <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:'#92400e', lineHeight:1.6 }}>
                          Cheat sheets are auto-generated after Bunny video upload via AI transcript. You can also write one manually below.
                        </p>
                      </div>
                      <div style={{ background:C.white, border:'1px solid ' + C.border, borderRadius:'6px', padding:'1.25rem', display:'flex', flexDirection:'column', gap:'0.875rem' }}>
                        <div>
                          <label style={s.fieldLabel}>Summary</label>
                          <textarea rows={3} placeholder="Brief summary of key teaching..." style={{ ...s.input, height:'70px', resize:'vertical' }} />
                        </div>
                        <div>
                          <label style={s.fieldLabel}>Key Points (one per line, start with →)</label>
                          <textarea rows={5} placeholder={"→ Key concept one\n→ Key concept two"} style={{ ...s.input, height:'100px', resize:'vertical' }} />
                        </div>
                        <button style={s.saveBtn}>Save Cheat Sheet</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* MODALS */}
      {modal && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && closeModal()}>
          <div style={s.modalBox}>
            {modal === 'section' && <>
              <p style={s.modalTitle}>{form.id ? 'Edit Section' : 'Add Section'}</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
                <FField label="Section Title *" value={form.title||''} onChange={v => setForm(f=>({...f,title:v}))} placeholder="e.g. Verbal Ability & Reading Comprehension" />
                <FField label="Short Title" value={form.short_title||''} onChange={v => setForm(f=>({...f,short_title:v}))} placeholder="e.g. VARC" />
                <FField label="Description" value={form.description||''} onChange={v => setForm(f=>({...f,description:v}))} placeholder="Optional..." textarea />
              </div>
              <div style={s.modalFooter}>
                <button onClick={closeModal} style={s.cancelBtn}>Cancel</button>
                <button onClick={saveSection} disabled={saving||!form.title} style={s.saveBtn}>{saving ? 'Saving…' : form.id ? 'Update' : 'Create Section'}</button>
              </div>
            </>}

            {modal === 'topic' && <>
              <p style={s.modalTitle}>{form.id ? 'Edit Topic' : 'Add Topic'}</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
                <FField label="Topic Title *" value={form.title||''} onChange={v => setForm(f=>({...f,title:v}))} placeholder="e.g. Reading Comprehension — Strategy" />
                <FField label="Sort Order" value={form.sort_order||''} onChange={v => setForm(f=>({...f,sort_order:v}))} placeholder="e.g. 1" type="number" />
              </div>
              <div style={s.modalFooter}>
                <button onClick={closeModal} style={s.cancelBtn}>Cancel</button>
                <button onClick={saveTopic} disabled={saving||!form.title} style={s.saveBtn}>{saving ? 'Saving…' : form.id ? 'Update' : 'Add Topic'}</button>
              </div>
            </>}

            {modal === 'video' && <>
              <p style={s.modalTitle}>{form.id ? 'Edit Video' : 'Add Video'}</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
                <FField label="Video Title *" value={form.title||''} onChange={v => setForm(f=>({...f,title:v}))} placeholder="e.g. RC Strategy — Introduction" />
                <div>
                  <label style={s.fieldLabel}>Video Source</label>
                  <select value={form.video_source||'bunny'} onChange={e => setForm(f=>({...f,video_source:e.target.value}))} style={s.select}>
                    <option value="bunny">Bunny Stream</option>
                    <option value="youtube">YouTube</option>
                  </select>
                </div>
                <FField label={form.video_source==='youtube' ? 'YouTube Video ID' : 'Bunny Stream Video ID'} value={form.bunny_video_id||''} onChange={v => setForm(f=>({...f,bunny_video_id:v}))} placeholder={form.video_source==='youtube' ? 'e.g. dQw4w9WgXcQ' : 'e.g. a1b2c3d4-xxxx-...'} />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                  <FField label="Duration (mins)" value={form.duration_mins||''} onChange={v => setForm(f=>({...f,duration_mins:v}))} placeholder="e.g. 22" type="number" />
                  <div>
                    <label style={s.fieldLabel}>Difficulty</label>
                    <select value={form.difficulty||'beginner'} onChange={e => setForm(f=>({...f,difficulty:e.target.value}))} style={s.select}>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>
                <FField label="Sub-tag (optional)" value={form.sub_tag||''} onChange={v => setForm(f=>({...f,sub_tag:v}))} placeholder="e.g. % Change, Fractions" />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                  <label style={{ display:'flex', alignItems:'center', gap:'0.5rem', cursor:'pointer', padding:'0.5rem 0.75rem', border:'1px solid ' + C.border, borderRadius:'4px' }}>
                    <input type="checkbox" checked={form.has_cheatsheet !== false} onChange={e => setForm(f=>({...f,has_cheatsheet:e.target.checked}))} />
                    <div>
                      <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:'600', display:'block' }}>📄 Cheat Sheet</span>
                      <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.62rem', color:C.gray400 }}>After watching</span>
                    </div>
                  </label>
                  <label style={{ display:'flex', alignItems:'center', gap:'0.5rem', cursor:'pointer', padding:'0.5rem 0.75rem', border:'1px solid ' + C.border, borderRadius:'4px' }}>
                    <input type="checkbox" checked={!!form.has_quiz} onChange={e => setForm(f=>({...f,has_quiz:e.target.checked}))} />
                    <div>
                      <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:'600', display:'block' }}>📝 Quiz</span>
                      <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.62rem', color:C.gray400 }}>After cheat sheet</span>
                    </div>
                  </label>
                  <label style={{ display:'flex', alignItems:'center', gap:'0.5rem', cursor:'pointer', padding:'0.5rem 0.75rem', border:'1px solid ' + (form.has_live ? '#e9d5ff' : C.border), borderRadius:'4px', background:form.has_live ? '#f3e8ff' : 'transparent' }}>
                    <input type="checkbox" checked={!!form.has_live} onChange={e => setForm(f=>({...f,has_live:e.target.checked}))} />
                    <div>
                      <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:'600', display:'block' }}>📡 Live Class</span>
                      <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.62rem', color:C.gray400 }}>After quiz (optional)</span>
                    </div>
                  </label>
                </div>
                {form.has_quiz && (
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', padding:'0.875rem', background:'#fffbeb', border:'1px solid #fcd34d', borderRadius:'4px' }}>
                    <FField label="Quiz Duration (mins)" value={form.quiz_duration_mins||40} onChange={v => setForm(f=>({...f,quiz_duration_mins:parseInt(v)||40}))} placeholder="e.g. 40" type="number" />
                    <FField label="No. of Questions" value={form.quiz_question_count||10} onChange={v => setForm(f=>({...f,quiz_question_count:parseInt(v)||10}))} placeholder="e.g. 10" type="number" />
                  </div>
                )}
                {form.has_live && (
                  <FField label="Live Class Description" value={form.live_description||''} onChange={v => setForm(f=>({...f,live_description:v}))}
                    placeholder="e.g. Live Q&A session — ask doubts directly to ALP Sir" textarea />
                )}
              </div>
              <div style={s.modalFooter}>
                <button onClick={closeModal} style={s.cancelBtn}>Cancel</button>
                <button onClick={saveVideo} disabled={saving||!form.title} style={s.saveBtn}>{saving ? 'Saving…' : form.id ? 'Update Video' : 'Add Video'}</button>
              </div>
            </>}

            {modal === 'question' && <>
              <p style={s.modalTitle}>Add Quiz Question</p>
              <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:C.gray400, marginBottom:'1.25rem' }}>For: {activeVideo?.title}</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
                <FField label="Question Text *" value={form.text||''} onChange={v => setForm(f=>({...f,text:v}))} placeholder="Enter the question..." textarea />
                {['A','B','C','D'].map(key => (
                  <div key={key} style={{ display:'flex', alignItems:'center', gap:'0.625rem' }}>
                    <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', color:C.gray400, width:'16px', flexShrink:0 }}>{key}.</span>
                    <input value={form['opt_'+key]||''} onChange={e => setForm(f=>({...f,['opt_'+key]:e.target.value}))} placeholder={'Option ' + key} style={{ ...s.input, flex:1 }} />
                    <label style={{ display:'flex', alignItems:'center', gap:'0.375rem', fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:C.gray500, flexShrink:0, cursor:'pointer' }}>
                      <input type="radio" name="correct" value={key} checked={form.correct===key} onChange={() => setForm(f=>({...f,correct:key}))} />
                      Correct
                    </label>
                  </div>
                ))}
                <FField label="Explanation (shown after submit)" value={form.explanation||''} onChange={v => setForm(f=>({...f,explanation:v}))} placeholder="Why is this the correct answer?" textarea />
              </div>
              <div style={s.modalFooter}>
                <button onClick={closeModal} style={s.cancelBtn}>Cancel</button>
                <button onClick={saveQuestion} disabled={saving||!form.text||!form.correct} style={s.saveBtn}>{saving ? 'Saving…' : 'Add Question'}</button>
              </div>
            </>}
          </div>
        </div>
      )}
    </div>
  )
}

function FField({ label, value, onChange, placeholder, textarea, type='text' }) {
  return (
    <div>
      <label style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'700', color:'#666', display:'block', marginBottom:'0.375rem' }}>{label}</label>
      {textarea
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            style={{ width:'100%', padding:'0.625rem 0.75rem', fontFamily:'var(--font-sans)', fontSize:'0.875rem', border:'1px solid #e8e8e6', borderRadius:'4px', outline:'none', color:'#0f0f0f', boxSizing:'border-box', height:'80px', resize:'vertical' }} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            style={{ width:'100%', padding:'0.625rem 0.75rem', fontFamily:'var(--font-sans)', fontSize:'0.875rem', border:'1px solid #e8e8e6', borderRadius:'4px', outline:'none', color:'#0f0f0f', boxSizing:'border-box' }} />
      }
    </div>
  )
}

const s = {
  topbar:     { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 1.5rem', height:'56px', background:C.white, borderBottom:'1px solid ' + C.border, position:'sticky', top:0, zIndex:100 },
  logo:       { fontFamily:'Georgia,serif', fontSize:'1.1rem', fontWeight:'700', textDecoration:'none', color:C.black },
  col:        { display:'flex', flexDirection:'column', background:C.white, overflow:'auto' },
  colHeader:  { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.75rem 1rem', borderBottom:'1px solid ' + C.border, flexShrink:0, position:'sticky', top:0, background:C.white, zIndex:10 },
  colTitle:   { fontFamily:'var(--font-sans)', fontSize:'0.7rem', fontWeight:'700', letterSpacing:'0.08em', textTransform:'uppercase', color:C.gray400 },
  addBtn:     { fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'700', padding:'0.3rem 0.625rem', background:C.red, color:'#fff', border:'none', borderRadius:'3px', cursor:'pointer' },
  row:        { display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.625rem 0.875rem', borderBottom:'1px solid ' + C.border, cursor:'pointer', transition:'background 0.1s', flexShrink:0 },
  rowTitle:   { fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:'600', color:C.black, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  rowSub:     { fontFamily:'var(--font-sans)', fontSize:'0.62rem', color:C.gray400, marginTop:'0.1rem' },
  iconBtn:    { background:'none', border:'none', cursor:'pointer', color:C.gray400, fontSize:'0.875rem', padding:'0.15rem 0.25rem' },
  empty:      { padding:'2rem', textAlign:'center', fontFamily:'Georgia,serif', color:C.gray400, fontSize:'0.875rem' },
  panelLabel: { fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:C.gray400 },
  editBtn:    { fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:'700', padding:'0.5rem 1rem', background:C.black, color:'#fff', border:'none', borderRadius:'3px', cursor:'pointer' },
  overlay:    { position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' },
  modalBox:   { background:C.white, borderRadius:'8px', width:'100%', maxWidth:'540px', maxHeight:'90vh', overflowY:'auto', padding:'2rem', boxShadow:'0 24px 64px rgba(0,0,0,0.25)' },
  modalTitle: { fontFamily:'Georgia,serif', fontSize:'1.25rem', fontWeight:'700', color:C.black, marginBottom:'1.5rem' },
  modalFooter:{ display:'flex', justifyContent:'flex-end', gap:'0.75rem', marginTop:'1.5rem', paddingTop:'1rem', borderTop:'1px solid ' + C.border },
  fieldLabel: { fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'700', color:C.gray500, display:'block', marginBottom:'0.375rem' },
  input:      { width:'100%', padding:'0.625rem 0.75rem', fontFamily:'var(--font-sans)', fontSize:'0.875rem', border:'1px solid ' + C.border, borderRadius:'4px', outline:'none', color:C.black, boxSizing:'border-box' },
  select:     { width:'100%', padding:'0.625rem 0.75rem', fontFamily:'var(--font-sans)', fontSize:'0.875rem', border:'1px solid ' + C.border, borderRadius:'4px', outline:'none', color:C.black, background:C.white, cursor:'pointer' },
  cancelBtn:  { fontFamily:'var(--font-sans)', fontSize:'0.82rem', padding:'0.625rem 1.25rem', border:'1px solid ' + C.border, borderRadius:'4px', background:C.white, color:C.gray500, cursor:'pointer' },
  saveBtn:    { fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', padding:'0.625rem 1.5rem', border:'none', borderRadius:'4px', background:C.red, color:'#fff', cursor:'pointer' },
}

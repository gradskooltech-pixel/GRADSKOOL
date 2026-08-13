/**
 * GRADSKOOL Admin — Courses (All Courses Overview)
 * Route: /admin-panel/courses
 * Shows all courses across all exams, with type, status, enrollment count.
 * Click any course → goes to /admin-panel/course/[id] (Course Builder)
 */
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import api from '../../lib/api'
import { AdminLayout } from '../../components/admin/AdminLayout'

const C = { red:'#ff5e5f',black:'#0f0f0f',white:'#fff',bg:'#f7f6f3',border:'#e8e8e6',gray50:'#fafaf9',gray400:'#999',gray500:'#666',green:'#22c55e',amber:'#f59e0b',blue:'#3b82f6' }

const TYPE_LABELS = {
  recorded:      { label:'Recorded',       color:'#3b82f6', bg:'#eff6ff' },
  live_recorded: { label:'Live + Recorded', color:'#7b2d8b', bg:'#f3e8ff' },
  mocks_only:    { label:'Mocks Only',      color:'#f59e0b', bg:'#fffbeb' },
  self_paced:    { label:'Self-Paced',      color:'#22c55e', bg:'#f0fdf4' },
  crash_course:  { label:'Crash Course',    color:'#e63946', bg:'#fff1f2' },
  gdpi_prep:     { label:'GDPI Prep',       color:'#0e7490', bg:'#ecfeff' },
  custom:        { label:'Custom',          color:'#666',    bg:'#f4f3f0' },
}

const EXAMS = ['cat','xat','snap','nmat','gmat','gre','ipmat','cmat','mhcet','clat','cuet']

export default function CoursesPage() {
  const [courses, setCourses]   = useState([])
  const [loading, setLoad]      = useState(true)
  const [modal,   setModal]     = useState(false)
  const [form,    setForm]      = useState({ exam_slug:'cat', course_type:'recorded', batch_size:27, status:'upcoming' })
  const [saving,  setSaving]    = useState(false)
  const [msg,     setMsg]       = useState(null)
  const [filter,  setFilter]    = useState('all')
  const router = useRouter()

  const load = () => {
    setLoad(true)
    api.get('/dashboard/courses/')
      .then(({ data }) => setCourses(data.courses || []))
      .catch(() => setCourses([]))
      .finally(() => setLoad(false))
  }
  useEffect(() => { load() }, [])

  const notify = (text, type='success') => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3000) }

  const createCourse = async () => {
    if (!form.title) { notify('Enter a course title', 'error'); return }
    setSaving(true)
    try {
      const { data } = await api.post('/dashboard/courses/', form)
      notify('Course created! Opening builder...')
      setModal(false)
      setTimeout(() => router.push('/admin-panel/course/' + data.id), 500)
    } catch(e) { notify(e.response?.data?.error || 'Failed', 'error') }
    finally { setSaving(false) }
  }

  const filtered = filter === 'all' ? courses : courses.filter(c => c.exam_slug === filter || c.status === filter || c.course_type === filter)
  const byExam = filtered.reduce((acc, c) => { (acc[c.exam_name] = acc[c.exam_name] || []).push(c); return acc }, {})

  return (
    <AdminLayout title="Course Builder">
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <Head><title>Courses — Admin — GRADSKOOL</title></Head>

      <div style={{ height:'56px', background:C.white, borderBottom:'1px solid '+C.border, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 1.5rem', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <Link href="/admin-panel" style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', color:C.gray400, textDecoration:'none' }}>← Admin Panel</Link>
          <span style={{ color:C.border }}>|</span>
          <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', color:C.black }}>All Courses</span>
          <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:C.gray400, background:C.bg, padding:'0.1rem 0.5rem', borderRadius:'100px' }}>{courses.length}</span>
        </div>
        <button onClick={() => setModal(true)}
          style={{ padding:'0.4rem 1rem', background:C.red, color:'#fff', border:'none', borderRadius:'4px', fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:'700', cursor:'pointer' }}>
          + New Course
        </button>
      </div>

      {msg && <div style={{ position:'fixed', top:'64px', right:'1.5rem', zIndex:999, padding:'0.75rem 1.25rem', borderRadius:'4px', fontFamily:'var(--font-sans)', fontSize:'0.82rem', background:msg.type==='error'?'#fee2e2':'#dcfce7', border:'1px solid '+(msg.type==='error'?'#fca5a5':'#86efac'), color:msg.type==='error'?'#991b1b':'#166534' }}>{msg.text}</div>}

      <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'2rem' }}>

        {/* Filter bar */}
        <div style={{ display:'flex', gap:'0.375rem', marginBottom:'1.5rem', flexWrap:'wrap' }}>
          {[['all','All'],['active','Active'],['upcoming','Upcoming'],['cat','CAT'],['xat','XAT'],['recorded','Recorded'],['live_recorded','Live+Rec'],['mocks_only','Mocks']].map(([val,label]) => (
            <button key={val} onClick={() => setFilter(val)}
              style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', padding:'0.3rem 0.75rem', border:'1px solid '+(filter===val?C.red:C.border), borderRadius:'100px', background:filter===val?'#fff5f5':C.white, color:filter===val?C.red:C.gray500, cursor:'pointer', fontWeight:filter===val?'700':'400' }}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ textAlign:'center', color:C.gray400, fontFamily:'Georgia,serif', padding:'4rem' }}>Loading courses…</p>
        ) : courses.length === 0 ? (
          <div style={{ textAlign:'center', padding:'5rem', background:C.white, border:'1px dashed '+C.border, borderRadius:'8px' }}>
            <p style={{ fontSize:'2.5rem', marginBottom:'0.75rem' }}>🎓</p>
            <p style={{ fontFamily:'Georgia,serif', fontSize:'1.1rem', fontWeight:'700', color:C.black, marginBottom:'0.5rem' }}>No courses yet</p>
            <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.875rem', color:C.gray400, marginBottom:'1.5rem' }}>Create your first course to start building the curriculum.</p>
            <button onClick={() => setModal(true)} style={{ padding:'0.75rem 1.5rem', background:C.red, color:'#fff', border:'none', borderRadius:'6px', fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'700', cursor:'pointer' }}>+ Create First Course</button>
          </div>
        ) : (
          Object.entries(byExam).map(([examName, examCourses]) => (
            <div key={examName} style={{ marginBottom:'2rem' }}>
              <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:C.gray400, marginBottom:'0.875rem' }}>
                {examName} · {examCourses.length} course{examCourses.length!==1?'s':''}
              </p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'1rem' }}>
                {examCourses.map(course => {
                  const typeInfo = TYPE_LABELS[course.course_type] || TYPE_LABELS.custom
                  return (
                    <div key={course.id}
                      style={{ background:C.white, border:'1px solid '+C.border, borderRadius:'8px', overflow:'hidden', cursor:'pointer', transition:'box-shadow 0.15s' }}
                      onClick={() => router.push('/admin-panel/course/' + course.id)}
                      onMouseEnter={e => e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.boxShadow='none'}>
                      {/* Card header */}
                      <div style={{ padding:'1rem 1.25rem', borderBottom:'1px solid '+C.border }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.375rem' }}>
                          <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', padding:'0.2rem 0.5rem', borderRadius:'3px', background:typeInfo.bg, color:typeInfo.color }}>
                            {typeInfo.label}
                          </span>
                          <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', padding:'0.2rem 0.5rem', borderRadius:'3px',
                            background:course.status==='active'?'#dcfce7':course.status==='upcoming'?'#fff7ed':'#f1f5f9',
                            color:course.status==='active'?'#166534':course.status==='upcoming'?'#92400e':'#64748b' }}>
                            {course.status}
                          </span>
                        </div>
                        <p style={{ fontFamily:'Georgia,serif', fontSize:'0.95rem', fontWeight:'700', color:C.black, marginBottom:'0.2rem' }}>{course.title}</p>
                        {course.start_date && <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', color:C.gray400 }}>Starts {new Date(course.start_date).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})}</p>}
                      </div>
                      {/* Card stats */}
                      <div style={{ padding:'0.75rem 1.25rem', display:'flex', gap:'1.25rem' }}>
                        {[
                          [course.enrolled||0, 'enrolled'],
                          [course.batch_size||0, 'seats'],
                          [course.component_count||0, 'components'],
                        ].map(([val, label]) => (
                          <div key={label}>
                            <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.9rem', fontWeight:'700', color:C.black, lineHeight:1 }}>{val}</p>
                            <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.62rem', color:C.gray400, marginTop:'0.15rem' }}>{label}</p>
                          </div>
                        ))}
                        <div style={{ marginLeft:'auto' }}>
                          <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:C.red, fontWeight:'700' }}>Open Builder →</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create course modal */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }} onClick={e => e.target===e.currentTarget&&setModal(false)}>
          <div style={{ background:C.white, borderRadius:'8px', width:'100%', maxWidth:'520px', padding:'2rem', boxShadow:'0 24px 64px rgba(0,0,0,0.25)' }}>
            <p style={{ fontFamily:'Georgia,serif', fontSize:'1.25rem', fontWeight:'700', color:C.black, marginBottom:'1.5rem' }}>Create New Course</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div>
                <label style={s.lbl}>Exam *</label>
                <select value={form.exam_slug} onChange={e => setForm(f => ({...f, exam_slug:e.target.value}))} style={s.inp}>
                  {EXAMS.map(e => <option key={e} value={e}>{e.toUpperCase()}</option>)}
                </select>
              </div>
              <div>
                <label style={s.lbl}>Course Title *</label>
                <input value={form.title||''} onChange={e => setForm(f => ({...f, title:e.target.value}))} placeholder="e.g. CAT 2026 Live Cohort" style={s.inp} />
              </div>
              <div>
                <label style={s.lbl}>Course Type *</label>
                <select value={form.course_type} onChange={e => setForm(f => ({...f, course_type:e.target.value}))} style={s.inp}>
                  {Object.entries(TYPE_LABELS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', color:C.gray400, marginTop:'0.25rem' }}>
                  {form.course_type==='recorded' && 'Default: Videos → Cheat Sheet → Quiz'}
                  {form.course_type==='live_recorded' && 'Default: Pre-Test → Videos → Quiz → Cheat Sheet → Live Class'}
                  {form.course_type==='mocks_only' && 'Default: Mock Tests only'}
                  {form.course_type==='crash_course' && 'Default: Pre-Test → Videos → Quiz → Post-Test'}
                  {form.course_type==='self_paced' && 'Default: Videos → Notes → Assignments → Quiz'}
                  {form.course_type==='gdpi_prep' && 'Default: Videos → WAT Material → Mock Essays → Mock PI'}
                  {form.course_type==='custom' && 'You choose every component in the builder'}
                </p>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                <div>
                  <label style={s.lbl}>Batch Size</label>
                  <input type="number" value={form.batch_size} onChange={e => setForm(f => ({...f, batch_size:e.target.value}))} style={s.inp} />
                </div>
                <div>
                  <label style={s.lbl}>Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({...f, status:e.target.value}))} style={s.inp}>
                    <option value="upcoming">Upcoming</option>
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={s.lbl}>Description (optional)</label>
                <textarea value={form.description||''} onChange={e => setForm(f => ({...f, description:e.target.value}))} placeholder="Brief description..." style={{ ...s.inp, height:'70px', resize:'vertical' }} />
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.75rem', marginTop:'1.5rem', paddingTop:'1rem', borderTop:'1px solid '+C.border }}>
              <button onClick={() => setModal(false)} style={{ padding:'0.625rem 1.25rem', border:'1px solid '+C.border, borderRadius:'4px', background:C.white, fontFamily:'var(--font-sans)', fontSize:'0.82rem', cursor:'pointer', color:C.gray500 }}>Cancel</button>
              <button onClick={createCourse} disabled={saving||!form.title}
                style={{ padding:'0.625rem 1.5rem', background:saving?C.gray400:C.red, color:'#fff', border:'none', borderRadius:'4px', fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', cursor:saving?'not-allowed':'pointer' }}>
                {saving ? 'Creating…' : 'Create & Open Builder →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </AdminLayout>
  )
}

const s = {
  lbl: { fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'700', color:'#666', display:'block', marginBottom:'0.25rem' },
  inp: { width:'100%', padding:'0.5rem 0.625rem', fontFamily:'var(--font-sans)', fontSize:'0.82rem', border:'1px solid #e8e8e6', borderRadius:'4px', outline:'none', color:'#0f0f0f', boxSizing:'border-box', background:'#fff' },
}

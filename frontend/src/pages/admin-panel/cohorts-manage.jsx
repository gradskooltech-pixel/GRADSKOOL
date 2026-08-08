/**
 * GRADSKOOL Admin — Cohorts
 * Route: /admin-panel/cohorts-manage
 *
 * Create and manage cohorts per exam.
 * Set start/end dates, cohort size, open/close status.
 */
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { SectionBox, Badge } from '../../components/admin/AdminPrimitives'
import api from '../../lib/api'

export default function AdminCohortsPage() {
  const [cohorts, setCohorts]     = useState([])
  const [exams, setExams]         = useState([])
  const [loading, setLoad]        = useState(true)
  const [showCreate, setCreate]   = useState(false)
  const [editing, setEditing]     = useState(null)
  const [saving, setSaving]       = useState(false)
  const [msg, setMsg]             = useState(null)

  const EMPTY_FORM = {
    exam_slug: '', title: '', cohort_label: '',
    batch_size: 27, start_date: '', end_date: '',
    status: 'upcoming', is_open: false, description: '',
  }
  const [form, setForm] = useState(EMPTY_FORM)

  const load = useCallback(() => {
    setLoad(true)
    Promise.all([
      api.get('/courses/cohorts/'),
      api.get('/courses/exams/'),
    ])
      .then(([c, e]) => {
        setCohorts(Array.isArray(c.data) ? c.data : [])
        setExams(e.data.exams || [])
      })
      .catch(() => setMsg({ type:'error', text:'Failed to load' }))
      .finally(() => setLoad(false))
  }, [])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setEditing(null)
    setCreate(true)
  }

  const openEdit = (cohort) => {
    setForm({
      exam_slug:    cohort.exam_slug,
      title:        cohort.title,
      cohort_label: cohort.cohort_label || '',
      batch_size:   cohort.batch_size,
      start_date:   cohort.start_date || '',
      end_date:     cohort.end_date || '',
      status:       cohort.status,
      is_open:      cohort.is_open,
      description:  cohort.description || '',
    })
    setEditing(cohort)
    setCreate(true)
  }

  const handleSave = async () => {
    if (!form.exam_slug || !form.title) return
    setSaving(true)
    try {
      if (editing) {
        await api.patch(`/courses/cohorts/${editing.slug}/`, form)
        setMsg({ type:'success', text:'Cohort updated' })
      } else {
        await api.post('/courses/cohorts/', form)
        setMsg({ type:'success', text:'Cohort created' })
      }
      setCreate(false)
      load()
    } catch (e) {
      setMsg({ type:'error', text: typeof e.response?.data?.error === 'string' ? e.response.data.error : JSON.stringify(e.response?.data?.error || 'Failed') || 'Save failed' })
    } finally {
      setSaving(false)
    }
  }

  const handleToggleOpen = async (cohort) => {
    const action = cohort.is_open ? 'close' : 'open'
    if (!confirm(`${action === 'open' ? 'Open' : 'Close'} this cohort for enrolment?\n${action === 'open' ? 'This will close all other open cohorts for this exam.' : ''}`)) return
    try {
      await api.patch(`/courses/cohorts/${cohort.slug}/`, { is_open: !cohort.is_open })
      load()
    } catch {
      setMsg({ type:'error', text:'Failed to update' })
    }
  }

  // Group cohorts by exam
  const grouped = cohorts.reduce((acc, c) => {
    const key = c.exam_name
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {})

  return (
    <AdminLayout title="Cohorts">
      <div style={s.header}>
        <div>
          <p style={s.eyebrow}>Management</p>
          <h1 style={s.title}>Cohorts</h1>
          <p style={s.subtitle}>Create and manage cohorts per exam. Only one cohort per exam should be open at a time.</p>
        </div>
        <button onClick={openCreate} style={s.createBtn}>+ New Cohort</button>
      </div>

      {msg && (
        <div style={{ ...s.msg, background: msg.type==='success' ? '#f0fdf4' : '#fff5f5', border:`1px solid ${msg.type==='success' ? '#86efac' : '#fca5a5'}`, color: msg.type==='success' ? '#166534' : '#991b1b' }}>
          {msg.text}
          <button onClick={() => setMsg(null)} style={s.msgClose}>✕</button>
        </div>
      )}

      {loading ? (
        <div style={s.loading}>Loading cohorts…</div>
      ) : cohorts.length === 0 ? (
        <div style={s.empty}>
          No cohorts yet.{' '}
          <button onClick={openCreate} style={s.inlineLink}>Create the first one →</button>
        </div>
      ) : (
        Object.entries(grouped).map(([examName, examCohorts]) => (
          <div key={examName} style={s.examGroup}>
            <p style={s.examGroupLabel}>{examName}</p>
            <SectionBox>
              {examCohorts.map(cohort => (
                <CohortRow
                  key={cohort.id}
                  cohort={cohort}
                  onEdit={() => openEdit(cohort)}
                  onToggleOpen={() => handleToggleOpen(cohort)}
                />
              ))}
            </SectionBox>
          </div>
        ))
      )}

      {/* Create / Edit panel */}
      {showCreate && (
        <div style={s.overlay}>
          <div style={s.panel}>
            <div style={s.panelHeader}>
              <h2 style={s.panelTitle}>{editing ? 'Edit Cohort' : 'New Cohort'}</h2>
              <button onClick={() => setCreate(false)} style={s.closeBtn}>✕</button>
            </div>

            <div style={s.form}>
              {!editing && (
                <div style={s.row}>
                  <label style={s.label}>Exam *</label>
                  <select value={form.exam_slug}
                    onChange={e => setForm(f => ({ ...f, exam_slug: e.target.value,
                      title: exams.find(ex => ex.slug === e.target.value)?.name + ' Cohort' || '' }))}
                    style={s.input}>
                    <option value="">Select exam…</option>
                    {exams.map(ex => <option key={ex.slug} value={ex.slug}>{ex.name}</option>)}
                  </select>
                </div>
              )}

              <div style={s.row}>
                <label style={s.label}>Cohort Label *</label>
                <input value={form.cohort_label}
                  onChange={e => setForm(f => ({ ...f, cohort_label: e.target.value }))}
                  style={s.input} placeholder="e.g. Cohort 1, Batch 2026-A" />
                <p style={s.hint}>Used in the URL slug and student-facing labels</p>
              </div>

              <div style={s.row}>
                <label style={s.label}>Full Title</label>
                <input value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  style={s.input} placeholder="e.g. CAT 2026 Live Cohort" />
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                <div style={s.row}>
                  <label style={s.label}>Start Date</label>
                  <input type="date" value={form.start_date}
                    onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                    style={s.input} />
                </div>
                <div style={s.row}>
                  <label style={s.label}>End Date</label>
                  <input type="date" value={form.end_date}
                    onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                    style={s.input} />
                </div>
              </div>

              <div style={s.row}>
                <label style={s.label}>Cohort Size (seats)</label>
                <input type="number" min="1" max="100" value={form.batch_size}
                  onChange={e => setForm(f => ({ ...f, batch_size: Number(e.target.value) }))}
                  style={{ ...s.input, width:'120px' }} />
              </div>

              <div style={s.row}>
                <label style={s.label}>Status</label>
                <div style={s.radioGroup}>
                  {[['upcoming','Upcoming'],['active','Active — cohort is running'],['closed','Closed']].map(([val, lbl]) => (
                    <label key={val} style={s.radioLabel}>
                      <input type="radio" name="status"
                        checked={form.status === val}
                        onChange={() => setForm(f => ({ ...f, status: val }))} />
                      {lbl}
                    </label>
                  ))}
                </div>
              </div>

              <div style={s.row}>
                <label style={s.radioLabel}>
                  <input type="checkbox"
                    checked={form.is_open}
                    onChange={e => setForm(f => ({ ...f, is_open: e.target.checked }))} />
                  Open for enrolment — new students will be auto-assigned to this cohort
                </label>
                <p style={s.hint}>⚠ Only one cohort per exam should be open. Saving will auto-close others.</p>
              </div>

              <div style={s.row}>
                <label style={s.label}>Description (shown on cohort page)</label>
                <textarea value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  style={{ ...s.input, minHeight:'80px', resize:'vertical' }}
                  placeholder="Brief description of this cohort…" />
              </div>

              <button onClick={handleSave}
                disabled={saving || !form.exam_slug || !form.cohort_label}
                style={s.saveBtn}>
                {saving ? 'Saving…' : editing ? 'Save Changes →' : 'Create Cohort →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

function CohortRow({ cohort, onEdit, onToggleOpen }) {
  return (
    <div style={s.cohortRow}>
      <div style={s.cohortLeft}>
        <div style={s.cohortTop}>
          <span style={s.cohortLabel}>{cohort.cohort_label || cohort.title}</span>
          <Badge color={cohort.status === 'active' ? 'green' : cohort.status === 'upcoming' ? 'yellow' : 'gray'}>
            {cohort.status}
          </Badge>
          {cohort.is_open && (
            <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', color:'#166534', background:'#f0fdf4', border:'1px solid #86efac', padding:'0.15rem 0.5rem', borderRadius:'100px', display:'inline-flex', alignItems:'center', gap:'0.3rem' }}>
              <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#22c55e', display:'inline-block' }} />
              Open
            </span>
          )}
        </div>
        <div style={s.cohortMeta}>
          {cohort.start_date && <span>{cohort.start_date} → {cohort.end_date || '…'}</span>}
          <span>{cohort.enrolled} / {cohort.batch_size} enrolled</span>
          <span style={{ color: cohort.remaining <= 5 ? '#991b1b' : 'inherit' }}>
            {cohort.remaining} seats remaining
          </span>
          <Link href={`/courses/${cohort.exam_slug}/cohorts/${cohort.slug}`} target="_blank"
            style={{ color:'var(--red)', textDecoration:'none', fontSize:'0.72rem' }}>
            /courses/{cohort.exam_slug}/cohorts/{cohort.slug} ↗
          </Link>
          <Link href={`/cohorts/${cohort.slug}`} target="_blank"
            style={{ color:'#059669', textDecoration:'none', fontSize:'0.72rem', fontWeight:'600' }}>
            🔗 /cohorts/{cohort.slug} (shareable) ↗
          </Link>
          <button onClick={() => {
            const url = `${window.location.origin}/cohorts/${cohort.slug}`
            navigator.clipboard?.writeText(url)
              .then(() => alert('Link copied: ' + url))
              .catch(() => alert(url))
          }} style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', color:'#059669', background:'#f0fdf4', border:'1px solid #86efac', borderRadius:'3px', padding:'0.15rem 0.4rem', cursor:'pointer' }}>
            Copy Link
          </button>
        </div>
      </div>
      <div style={{ display:'flex', gap:'0.5rem', alignItems:'center', flexShrink:0 }}>
        <button onClick={onEdit} style={s.editBtn}>Edit</button>
        <button onClick={onToggleOpen}
          style={{ ...s.editBtn, color: cohort.is_open ? '#991b1b' : '#166534', background: cohort.is_open ? '#fff5f5' : '#f0fdf4', borderColor: cohort.is_open ? '#fca5a5' : '#86efac' }}>
          {cohort.is_open ? 'Close Enrolment' : 'Open Enrolment'}
        </button>
      </div>
    </div>
  )
}

const s = {
  header:    { display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'2rem' },
  eyebrow:   { fontFamily:'var(--font-sans)', fontSize:'0.68rem', fontWeight:'700', letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--red)', marginBottom:'0.25rem' },
  title:     { fontFamily:'var(--font-serif)', fontSize:'2rem', fontWeight:'700', color:'var(--black)', marginBottom:'0.4rem' },
  subtitle:  { fontFamily:'var(--font-sans)', fontSize:'0.875rem', color:'var(--gray-500)' },
  createBtn: { background:'var(--black)', color:'var(--white)', border:'none', padding:'0.7rem 1.25rem', borderRadius:'var(--radius)', fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'700', cursor:'pointer' },
  msg:       { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.75rem 1rem', borderRadius:'var(--radius)', marginBottom:'1rem', fontFamily:'var(--font-sans)', fontSize:'0.875rem' },
  msgClose:  { background:'none', border:'none', cursor:'pointer' },
  loading:   { padding:'3rem', textAlign:'center', fontFamily:'var(--font-sans)', color:'var(--gray-400)' },
  empty:     { padding:'3rem', textAlign:'center', fontFamily:'var(--font-sans)', color:'var(--gray-400)' },
  inlineLink:{ background:'none', border:'none', color:'var(--red)', cursor:'pointer', fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'600' },
  examGroup: { marginBottom:'2rem' },
  examGroupLabel: { fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:'0.75rem' },
  cohortRow: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'1.25rem 1.5rem', borderBottom:'1px solid var(--gray-100)', gap:'1rem' },
  cohortLeft:{ flex:1 },
  cohortTop: { display:'flex', alignItems:'center', gap:'0.5rem', flexWrap:'wrap', marginBottom:'0.35rem' },
  cohortLabel:{ fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'600', color:'var(--black)' },
  cohortMeta:{ display:'flex', gap:'1.25rem', flexWrap:'wrap', fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:'var(--gray-400)' },
  editBtn:   { fontFamily:'var(--font-sans)', fontSize:'0.72rem', padding:'0.3rem 0.7rem', border:'1px solid var(--gray-200)', borderRadius:'3px', background:'var(--white)', cursor:'pointer' },
  overlay:   { position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200, display:'flex', justifyContent:'flex-end' },
  panel:     { width:'480px', height:'100%', background:'var(--white)', overflowY:'auto', padding:'2rem', boxShadow:'-4px 0 20px rgba(0,0,0,0.1)' },
  panelHeader:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', paddingBottom:'1rem', borderBottom:'1px solid var(--gray-100)' },
  panelTitle:{ fontFamily:'var(--font-serif)', fontSize:'1.3rem', fontWeight:'700', color:'var(--black)' },
  closeBtn:  { background:'none', border:'none', cursor:'pointer', fontSize:'1.25rem', color:'var(--gray-400)' },
  form:      { display:'flex', flexDirection:'column', gap:'1rem' },
  row:       {},
  label:     { fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:'600', color:'var(--gray-700)', display:'block', marginBottom:'0.3rem' },
  input:     { width:'100%', padding:'0.6rem 0.75rem', fontFamily:'var(--font-sans)', fontSize:'0.875rem', border:'1px solid var(--gray-200)', borderRadius:'var(--radius)', outline:'none', boxSizing:'border-box' },
  hint:      { fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:'var(--gray-400)', marginTop:'0.25rem' },
  radioGroup:{ display:'flex', flexDirection:'column', gap:'0.4rem' },
  radioLabel:{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:'var(--gray-700)', display:'flex', alignItems:'center', gap:'0.5rem', cursor:'pointer' },
  saveBtn:   { width:'100%', padding:'0.8rem', background:'var(--black)', color:'var(--white)', border:'none', borderRadius:'var(--radius)', fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'700', cursor:'pointer', marginTop:'0.5rem' },
}

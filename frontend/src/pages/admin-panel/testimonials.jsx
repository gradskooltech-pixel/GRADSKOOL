/**
 * GRADSKOOL Admin — Testimonials
 * Route: /admin-panel/testimonials
 */
import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { SectionBox, Badge } from '../../components/admin/AdminPrimitives'
import api from '../../lib/api'

const EXAMS = ['','cat','gmat','gre','xat','snap','nmat','ipmat','clat','cuet']

export default function AdminTestimonialsPage() {
  const [items, setItems]     = useState([])
  const [loading, setLoad]    = useState(true)
  const [showForm, setForm]   = useState(false)
  const [editing, setEditing] = useState(null)
  const [filter, setFilter]   = useState('')
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState(null)

  const EMPTY = { exam_slug:'', student_name:'', detail:'', text:'', rating:5, photo_url:'', is_active:true }
  const [form, setFormData]   = useState(EMPTY)

  const load = useCallback(() => {
    setLoad(true)
    const params = filter ? `?exam=${filter}` : ''
    api.get(`/dashboard/testimonials/${params}`)
      .then(({ data }) => setItems(data))
      .catch(() => setMsg({ type:'error', text:'Failed to load' }))
      .finally(() => setLoad(false))
  }, [filter])

  useEffect(() => { load() }, [load])

  const openNew = () => { setFormData(EMPTY); setEditing(null); setForm(true) }
  const openEdit = (t) => { setFormData({ ...t, exam_slug: t.exam_slug||'' }); setEditing(t.id); setForm(true) }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editing) {
        await api.patch(`/dashboard/testimonials/${editing}/`, form)
        setMsg({ type:'success', text:'Testimonial updated' })
      } else {
        await api.post('/dashboard/testimonials/', form)
        setMsg({ type:'success', text:'Testimonial added' })
      }
      setForm(false); setEditing(null); load()
    } catch { setMsg({ type:'error', text:'Save failed' }) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this testimonial?')) return
    await api.delete(`/dashboard/testimonials/${id}/`)
    setMsg({ type:'success', text:'Deleted' }); load()
  }

  const set = (f) => (e) => {
    const v = e.target.type==='checkbox' ? e.target.checked : e.target.value
    setFormData(d => ({ ...d, [f]: v }))
  }

  return (
    <AdminLayout title="Testimonials">
      <div style={s.header}>
        <div>
          <p style={s.eyebrow}>Content</p>
          <h1 style={s.title}>Testimonials</h1>
        </div>
        <button onClick={openNew} style={s.btn}>+ Add Testimonial</button>
      </div>

      {msg && <Msg msg={msg} onClose={() => setMsg(null)} />}

      {/* Filter */}
      <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1.25rem', flexWrap:'wrap' }}>
        {[['','All'],['','Homepage only'],...EXAMS.filter(e=>e).map(e=>[e,e.toUpperCase()])].slice(0,10).map(([val,lbl],i) => (
          <button key={i} onClick={() => setFilter(val==='' && i===1 ? 'site' : val)}
            style={{ ...s.filterBtn, ...(filter===(val===''&&i===1?'site':val) ? s.filterActive : {}) }}>
            {lbl}
          </button>
        ))}
      </div>

      <SectionBox>
        {loading ? <div style={s.loading}>Loading…</div>
          : items.length === 0 ? <div style={s.empty}>No testimonials yet.</div>
          : items.map(t => (
            <div key={t.id} style={s.row}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.25rem', flexWrap:'wrap' }}>
                  <span style={s.name}>{t.student_name}</span>
                  {t.exam_name && <span style={s.exam}>{t.exam_name}</span>}
                  <Badge color={t.is_active ? 'green' : 'gray'}>{t.is_active ? 'Active' : 'Inactive'}</Badge>
                  <span style={{ color:'#f59e0b', fontSize:'0.75rem' }}>{'★'.repeat(t.rating)}</span>
                </div>
                {t.detail && <p style={s.detail}>{t.detail}</p>}
                <p style={s.text}>{t.text.slice(0,200)}{t.text.length>200?'…':''}</p>
              </div>
              <div style={{ display:'flex', gap:'0.5rem', flexShrink:0 }}>
                <button onClick={() => openEdit(t)} style={s.actionBtn}>Edit</button>
                <button onClick={() => handleDelete(t.id)} style={{ ...s.actionBtn, color:'#991b1b', borderColor:'#fca5a5' }}>Delete</button>
              </div>
            </div>
          ))
        }
      </SectionBox>

      {/* Slide panel */}
      {showForm && (
        <div style={s.overlay}>
          <div style={s.panel}>
            <div style={s.panelHeader}>
              <h2 style={s.panelTitle}>{editing ? 'Edit Testimonial' : 'Add Testimonial'}</h2>
              <button onClick={() => setForm(false)} style={s.closeBtn}>✕</button>
            </div>
            <div style={s.form}>
              <Field label="Student Name *"><input value={form.student_name} onChange={set('student_name')} style={s.input} placeholder="Keshav Mundra"/></Field>
              <Field label="Detail (cohort, result)"><input value={form.detail} onChange={set('detail')} style={s.input} placeholder="CAT 2026 Cohort · 98.7 percentile"/></Field>
              <Field label="Exam">
                <select value={form.exam_slug} onChange={set('exam_slug')} style={s.input}>
                  <option value="">Homepage / Site-wide</option>
                  {EXAMS.filter(e=>e).map(e => <option key={e} value={e}>{e.toUpperCase()}</option>)}
                </select>
              </Field>
              <Field label="Testimonial Text *">
                <textarea value={form.text} onChange={set('text')} style={{ ...s.input, minHeight:'120px', resize:'vertical' }} placeholder="What the student said…"/>
              </Field>
              <Field label="Rating (1-5)">
                <div style={{ display:'flex', gap:'0.5rem' }}>
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setFormData(d=>({...d,rating:n}))}
                      style={{ fontFamily:'var(--font-sans)', fontSize:'1rem', background:'none', border:'none', cursor:'pointer', color: n<=form.rating ? '#f59e0b' : '#ddd' }}>
                      ★
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Photo URL (optional)"><input value={form.photo_url} onChange={set('photo_url')} style={s.input} placeholder="https://…"/></Field>
              <label style={s.checkbox}><input type="checkbox" checked={form.is_active} onChange={set('is_active')}/> Active (visible on site)</label>
              <div style={{ display:'flex', gap:'0.75rem', marginTop:'0.5rem' }}>
                <button onClick={handleSave} disabled={saving||!form.student_name||!form.text} style={s.saveBtn}>
                  {saving ? 'Saving…' : editing ? 'Update →' : 'Add Testimonial →'}
                </button>
                <button onClick={() => setForm(false)} style={s.cancelBtn}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

function Field({ label, children }) {
  return <div style={{ marginBottom:'0.875rem' }}><label style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:'600', color:'var(--gray-700)', display:'block', marginBottom:'0.3rem' }}>{label}</label>{children}</div>
}
function Msg({ msg, onClose }) {
  return <div style={{ display:'flex', justifyContent:'space-between', padding:'0.75rem 1rem', borderRadius:'4px', marginBottom:'1rem', fontFamily:'var(--font-sans)', fontSize:'0.875rem', background:msg.type==='success'?'#f0fdf4':'#fff5f5', border:`1px solid ${msg.type==='success'?'#86efac':'#fca5a5'}`, color:msg.type==='success'?'#166534':'#991b1b' }}>{msg.text}<button onClick={onClose} style={{ background:'none',border:'none',cursor:'pointer' }}>✕</button></div>
}

const s = {
  header:     { display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'1.5rem' },
  eyebrow:    { fontFamily:'var(--font-sans)', fontSize:'0.68rem', fontWeight:'700', letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--red)', marginBottom:'0.2rem' },
  title:      { fontFamily:'var(--font-serif)', fontSize:'2rem', fontWeight:'700', color:'var(--black)' },
  btn:        { background:'var(--black)', color:'var(--white)', border:'none', padding:'0.7rem 1.25rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'700', cursor:'pointer' },
  filterBtn:  { fontFamily:'var(--font-sans)', fontSize:'0.72rem', padding:'0.3rem 0.75rem', border:'1px solid var(--gray-200)', borderRadius:'3px', background:'var(--white)', cursor:'pointer', color:'var(--gray-500)' },
  filterActive:{ background:'var(--black)', color:'var(--white)', borderColor:'var(--black)' },
  loading:    { padding:'2rem', textAlign:'center', fontFamily:'var(--font-sans)', color:'var(--gray-400)' },
  empty:      { padding:'2rem', textAlign:'center', fontFamily:'var(--font-sans)', color:'var(--gray-400)' },
  row:        { display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'1.25rem 1.5rem', borderBottom:'1px solid var(--gray-100)', gap:'1rem' },
  name:       { fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'700', color:'var(--black)' },
  exam:       { fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', color:'var(--red)', background:'#fff0f0', border:'1px solid #ffd0d0', padding:'0.1rem 0.4rem', borderRadius:'2px' },
  detail:     { fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:'var(--gray-400)', marginBottom:'0.2rem' },
  text:       { fontFamily:'Georgia, serif', fontSize:'0.85rem', color:'var(--gray-600)', lineHeight:'1.6', fontStyle:'italic' },
  actionBtn:  { fontFamily:'var(--font-sans)', fontSize:'0.72rem', padding:'0.25rem 0.55rem', border:'1px solid var(--gray-200)', borderRadius:'3px', background:'var(--white)', cursor:'pointer', color:'var(--gray-600)' },
  overlay:    { position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200, display:'flex', justifyContent:'flex-end' },
  panel:      { width:'480px', height:'100%', background:'var(--white)', overflowY:'auto', padding:'2rem', boxShadow:'-4px 0 20px rgba(0,0,0,0.1)' },
  panelHeader:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', paddingBottom:'1rem', borderBottom:'1px solid var(--gray-100)' },
  panelTitle: { fontFamily:'var(--font-serif)', fontSize:'1.2rem', fontWeight:'700', color:'var(--black)' },
  closeBtn:   { background:'none', border:'none', cursor:'pointer', fontSize:'1.25rem', color:'var(--gray-400)' },
  form:       { display:'flex', flexDirection:'column', gap:'0.25rem' },
  input:      { width:'100%', padding:'0.6rem 0.75rem', fontFamily:'var(--font-sans)', fontSize:'0.875rem', border:'1px solid var(--gray-200)', borderRadius:'3px', outline:'none', boxSizing:'border-box' },
  checkbox:   { fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:'var(--gray-700)', display:'flex', alignItems:'center', gap:'0.5rem', cursor:'pointer' },
  saveBtn:    { background:'var(--black)', color:'var(--white)', border:'none', padding:'0.7rem 1.25rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'700', cursor:'pointer' },
  cancelBtn:  { background:'none', border:'1px solid var(--gray-200)', padding:'0.7rem 1.25rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.875rem', cursor:'pointer', color:'var(--gray-500)' },
}

/**
 * GRADSKOOL Admin — Mock Schedule
 * Route: /admin-panel/mock-schedule
 *
 * Edit mock test dates stored in DB.
 * Changes reflect immediately on /courses/[exam]/mocks page.
 */
import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { SectionBox, Badge } from '../../components/admin/AdminPrimitives'
import api from '../../lib/api'

const EXAMS = ['cat','xat','snap','nmat','gmat','gre','ipmat','clat','cuet']
const TYPES = [['full_length','Full-Length Mock'],['sectional','Sectional Set'],['area_wise','Area-Wise Test']]

export default function AdminMockSchedulePage() {
  const [items, setItems]     = useState([])
  const [loading, setLoad]    = useState(true)
  const [exam, setExam]       = useState('cat')
  const [showForm, setForm]   = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState(null)

  const EMPTY = { exam_slug:exam, entry_type:'full_length', name:'', release_date:'', is_free:false, duration_mins:120, sort_order:0, is_active:true, testfunda_url:'' }
  const [form, setFormData]   = useState(EMPTY)

  const load = useCallback(() => {
    setLoad(true)
    api.get(`/dashboard/mock-schedule/?exam=${exam}`)
      .then(({ data }) => setItems(data))
      .catch(() => setMsg({ type:'error', text:'Failed to load' }))
      .finally(() => setLoad(false))
  }, [exam])

  useEffect(() => { load() }, [load])

  const openNew  = () => { setFormData({ ...EMPTY, exam_slug:exam }); setEditing(null); setForm(true) }
  const openEdit = (item) => { setFormData({ ...item, release_date:item.release_date?.slice(0,16)||'' }); setEditing(item.id); setForm(true) }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = { ...form, release_date: form.release_date || null }
      if (editing) {
        await api.patch(`/dashboard/mock-schedule/${editing}/`, payload)
        setMsg({ type:'success', text:'Updated' })
      } else {
        await api.post('/dashboard/mock-schedule/', payload)
        setMsg({ type:'success', text:'Added' })
      }
      setForm(false); setEditing(null); load()
    } catch { setMsg({ type:'error', text:'Save failed' }) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this entry?')) return
    await api.delete(`/dashboard/mock-schedule/${id}/`)
    setMsg({ type:'success', text:'Deleted' }); load()
  }

  const set = (f) => (e) => {
    const v = e.target.type==='checkbox' ? e.target.checked : e.target.value
    setFormData(d => ({ ...d, [f]: v }))
  }

  // Group by type
  const grouped = items.reduce((acc, item) => {
    if (!acc[item.entry_type]) acc[item.entry_type] = []
    acc[item.entry_type].push(item)
    return acc
  }, {})

  // Stats
  const live     = items.filter(i => i.is_live)
  const upcoming = items.filter(i => !i.is_live)

  return (
    <AdminLayout title="Mock Schedule">
      <div style={s.header}>
        <div>
          <p style={s.eyebrow}>Content</p>
          <h1 style={s.title}>Mock Schedule</h1>
          <p style={s.subtitle}>Edit mock test dates. Changes reflect immediately on the mocks page.</p>
        </div>
        <button onClick={openNew} style={s.btn}>+ Add Entry</button>
      </div>

      {msg && <Msg msg={msg} onClose={() => setMsg(null)} />}

      {/* Exam tabs */}
      <div style={{ display:'flex', gap:'0.25rem', marginBottom:'1.5rem', flexWrap:'wrap' }}>
        {EXAMS.map(e => (
          <button key={e} onClick={() => setExam(e)}
            style={{ ...s.filterBtn, ...(exam===e ? s.filterActive : {}) }}>
            {e.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div style={s.summary}>
        <div style={s.summaryItem}>
          <span style={s.summaryNum}>{live.length}</span>
          <span style={s.summaryLabel}>Live Now</span>
        </div>
        <div style={s.summaryItem}>
          <span style={s.summaryNum}>{upcoming.length}</span>
          <span style={s.summaryLabel}>Upcoming</span>
        </div>
        <div style={s.summaryItem}>
          <span style={s.summaryNum}>{items.length}</span>
          <span style={s.summaryLabel}>Total Entries</span>
        </div>
      </div>

      {loading ? <div style={s.loading}>Loading…</div>
        : Object.entries(grouped).map(([type, typeItems]) => {
          const typeLabel = TYPES.find(t=>t[0]===type)?.[1] || type
          return (
            <div key={type} style={{ marginBottom:'2rem' }}>
              <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:'0.75rem' }}>{typeLabel} — {typeItems.length}</p>
              <SectionBox>
                {/* Table header */}
                <div style={s.tableHeader}>
                  {['Name','Release Date / Status','Duration','Free','Action'].map(h => (
                    <span key={h} style={s.th}>{h}</span>
                  ))}
                </div>
                {typeItems.map(item => (
                  <div key={item.id} style={{ ...s.tableRow, opacity:!item.is_active?0.5:1 }}>
                    <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'500', color:'var(--black)' }}>{item.name}</span>
                    <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem' }}>
                      {item.is_live
                        ? <span style={{ color:'#166534', fontWeight:'700' }}>🟢 Live Now</span>
                        : <span style={{ color:'var(--gray-500)' }}>{item.release_date?.slice(0,10)} at 10:00 PM</span>
                      }
                    </span>
                    <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:'var(--gray-500)' }}>{item.duration_mins}m</span>
                    <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem' }}>{item.is_free ? <span style={{ color:'#166534', fontWeight:'700' }}>FREE</span> : '—'}</span>
                    <div style={{ display:'flex', gap:'0.4rem' }}>
                      <button onClick={() => openEdit(item)} style={s.actionBtn}>Edit</button>
                      <button onClick={() => handleDelete(item.id)} style={{ ...s.actionBtn, color:'#991b1b', borderColor:'#fca5a5' }}>Delete</button>
                    </div>
                  </div>
                ))}
              </SectionBox>
            </div>
          )
        })
      }

      {showForm && (
        <div style={s.overlay}>
          <div style={s.panel}>
            <div style={s.panelHeader}>
              <h2 style={s.panelTitle}>{editing ? 'Edit Entry' : 'Add Entry'}</h2>
              <button onClick={() => setForm(false)} style={s.closeBtn}>✕</button>
            </div>
            <div style={s.form}>
              <Field label="Exam">
                <select value={form.exam_slug} onChange={set('exam_slug')} style={s.input}>
                  {EXAMS.map(e => <option key={e} value={e}>{e.toUpperCase()}</option>)}
                </select>
              </Field>
              <Field label="Type">
                <select value={form.entry_type} onChange={e => {
                  const t = e.target.value
                  setFormData(d => ({ ...d, entry_type:t, duration_mins:t==='full_length'?120:t==='sectional'?40:30 }))
                }} style={s.input}>
                  {TYPES.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
              <Field label="Name *">
                <input value={form.name} onChange={set('name')} style={s.input} placeholder="e.g. iCAT 30 or Set 10"/>
              </Field>
              <Field label="Release Date & Time (leave blank = always live)">
                <input type="datetime-local" value={form.release_date} onChange={set('release_date')} style={s.input}/>
                <p style={s.hint}>Use IST timezone (UTC+5:30). Leave blank for always-available tests.</p>
              </Field>
              <Field label="Duration (minutes)">
                <input type="number" value={form.duration_mins} onChange={set('duration_mins')} style={{ ...s.input, width:'100px' }}/>
              </Field>
              <Field label="Sort Order (higher = shown first)">
                <input type="number" value={form.sort_order} onChange={set('sort_order')} style={{ ...s.input, width:'100px' }}/>
              </Field>
              <Field label="Testfunda URL (override, leave blank for default)">
                <input value={form.testfunda_url} onChange={set('testfunda_url')} style={s.input} placeholder="https://gradskool.testfunda.com/…"/>
              </Field>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem' }}>
                <label style={s.checkbox}><input type="checkbox" checked={form.is_free} onChange={set('is_free')}/> Free (no purchase required)</label>
                <label style={s.checkbox}><input type="checkbox" checked={form.is_active} onChange={set('is_active')}/> Active (shown on schedule)</label>
              </div>
              <div style={{ display:'flex', gap:'0.75rem', marginTop:'0.5rem' }}>
                <button onClick={handleSave} disabled={saving||!form.name} style={s.saveBtn}>
                  {saving ? 'Saving…' : editing ? 'Update →' : 'Add Entry →'}
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
  header:      { display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'1.5rem' },
  eyebrow:     { fontFamily:'var(--font-sans)', fontSize:'0.68rem', fontWeight:'700', letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--red)', marginBottom:'0.2rem' },
  title:       { fontFamily:'var(--font-serif)', fontSize:'2rem', fontWeight:'700', color:'var(--black)', marginBottom:'0.25rem' },
  subtitle:    { fontFamily:'var(--font-sans)', fontSize:'0.875rem', color:'var(--gray-500)' },
  btn:         { background:'var(--black)', color:'var(--white)', border:'none', padding:'0.7rem 1.25rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'700', cursor:'pointer' },
  filterBtn:   { fontFamily:'var(--font-sans)', fontSize:'0.72rem', padding:'0.3rem 0.75rem', border:'1px solid var(--gray-200)', borderRadius:'3px', background:'var(--white)', cursor:'pointer', color:'var(--gray-500)' },
  filterActive:{ background:'var(--black)', color:'var(--white)', borderColor:'var(--black)' },
  summary:     { display:'flex', gap:'1px', background:'var(--gray-200)', border:'1px solid var(--gray-200)', borderRadius:'4px', overflow:'hidden', marginBottom:'1.5rem' },
  summaryItem: { flex:1, background:'var(--white)', padding:'1rem', textAlign:'center', display:'flex', flexDirection:'column', gap:'0.2rem' },
  summaryNum:  { fontFamily:'Georgia, serif', fontSize:'1.8rem', fontWeight:'700', color:'var(--black)', lineHeight:'1' },
  summaryLabel:{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:'var(--gray-400)', letterSpacing:'0.06em', textTransform:'uppercase' },
  loading:     { padding:'2rem', textAlign:'center', fontFamily:'var(--font-sans)', color:'var(--gray-400)' },
  tableHeader: { display:'grid', gridTemplateColumns:'2fr 2fr 80px 60px 120px', gap:'1rem', padding:'0.75rem 1.5rem', background:'var(--gray-50)', borderBottom:'1px solid var(--gray-100)' },
  th:          { fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--gray-400)' },
  tableRow:    { display:'grid', gridTemplateColumns:'2fr 2fr 80px 60px 120px', gap:'1rem', padding:'0.875rem 1.5rem', borderBottom:'1px solid var(--gray-100)', alignItems:'center' },
  actionBtn:   { fontFamily:'var(--font-sans)', fontSize:'0.72rem', padding:'0.25rem 0.55rem', border:'1px solid var(--gray-200)', borderRadius:'3px', background:'var(--white)', cursor:'pointer', color:'var(--gray-600)' },
  overlay:     { position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200, display:'flex', justifyContent:'flex-end' },
  panel:       { width:'480px', height:'100%', background:'var(--white)', overflowY:'auto', padding:'2rem', boxShadow:'-4px 0 20px rgba(0,0,0,0.1)' },
  panelHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', paddingBottom:'1rem', borderBottom:'1px solid var(--gray-100)' },
  panelTitle:  { fontFamily:'var(--font-serif)', fontSize:'1.2rem', fontWeight:'700', color:'var(--black)' },
  closeBtn:    { background:'none', border:'none', cursor:'pointer', fontSize:'1.25rem', color:'var(--gray-400)' },
  form:        { display:'flex', flexDirection:'column', gap:'0.25rem' },
  input:       { width:'100%', padding:'0.6rem 0.75rem', fontFamily:'var(--font-sans)', fontSize:'0.875rem', border:'1px solid var(--gray-200)', borderRadius:'3px', outline:'none', boxSizing:'border-box' },
  hint:        { fontFamily:'var(--font-sans)', fontSize:'0.68rem', color:'var(--gray-400)', marginTop:'0.25rem' },
  checkbox:    { fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:'var(--gray-700)', display:'flex', alignItems:'center', gap:'0.5rem', cursor:'pointer' },
  saveBtn:     { background:'var(--black)', color:'var(--white)', border:'none', padding:'0.7rem 1.25rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'700', cursor:'pointer' },
  cancelBtn:   { background:'none', border:'1px solid var(--gray-200)', padding:'0.7rem 1.25rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.875rem', cursor:'pointer', color:'var(--gray-500)' },
}

/**
 * GRADSKOOL Admin — FAQs Management
 * Route: /admin-panel/faqs-manage
 */
import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { SectionBox, Badge } from '../../components/admin/AdminPrimitives'
import api from '../../lib/api'

const CATS = [
  ['general','General'],['alp','About ALP Sir'],['cohort','Cohort & Structure'],
  ['cat','CAT'],['gmat_gre','GMAT & GRE'],['platform','Platform'],['enrolment','Enrolment'],
]
const EXAMS = ['','cat','xat','snap','nmat','gmat','gre','ipmat','clat','cuet']

export default function AdminFAQsPage() {
  const [items, setItems]     = useState([])
  const [loading, setLoad]    = useState(true)
  const [showForm, setForm]   = useState(false)
  const [editing, setEditing] = useState(null)
  const [filter, setFilter]   = useState('site')
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState(null)

  const EMPTY = { exam_slug:'', category:'general', question:'', answer:'', sort_order:0, is_active:true }
  const [form, setFormData]   = useState(EMPTY)

  const load = useCallback(() => {
    setLoad(true)
    const params = filter ? `?exam=${filter}` : ''
    api.get(`/dashboard/faqs/${params}`)
      .then(({ data }) => setItems(data))
      .catch(() => setMsg({ type:'error', text:'Failed to load' }))
      .finally(() => setLoad(false))
  }, [filter])

  useEffect(() => { load() }, [load])

  const openEdit = (f) => { setFormData({ ...f, exam_slug:f.exam_slug||'' }); setEditing(f.id); setForm(true) }
  const openNew  = () => { setFormData({ ...EMPTY, exam_slug: filter==='site'?'':filter }); setEditing(null); setForm(true) }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editing) {
        await api.patch(`/dashboard/faqs/${editing}/`, form)
        setMsg({ type:'success', text:'FAQ updated' })
      } else {
        await api.post('/dashboard/faqs/', form)
        setMsg({ type:'success', text:'FAQ added' })
      }
      setForm(false); setEditing(null); load()
    } catch { setMsg({ type:'error', text:'Save failed' }) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this FAQ?')) return
    await api.delete(`/dashboard/faqs/${id}/`)
    setMsg({ type:'success', text:'Deleted' }); load()
  }

  const moveOrder = async (faq, dir) => {
    await api.patch(`/dashboard/faqs/${faq.id}/`, { sort_order: faq.sort_order + dir })
    load()
  }

  const set = (f) => (e) => {
    const v = e.target.type==='checkbox' ? e.target.checked : e.target.value
    setFormData(d => ({ ...d, [f]: v }))
  }

  // Group by category
  const grouped = items.reduce((acc, f) => {
    const cat = f.category || 'general'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(f)
    return acc
  }, {})

  return (
    <AdminLayout title="FAQs">
      <div style={s.header}>
        <div>
          <p style={s.eyebrow}>Content</p>
          <h1 style={s.title}>FAQs</h1>
          <p style={s.subtitle}>Manage FAQ items shown on /faqs page and exam course pages.</p>
        </div>
        <button onClick={openNew} style={s.btn}>+ Add FAQ</button>
      </div>

      {msg && <Msg msg={msg} onClose={() => setMsg(null)} />}

      {/* Filter tabs */}
      <div style={{ display:'flex', gap:'0.25rem', marginBottom:'1.5rem', flexWrap:'wrap' }}>
        {[['site','Site-wide FAQs'],['','All'],['cat','CAT'],['xat','XAT'],['snap','SNAP'],['nmat','NMAT'],['gmat','GMAT'],['gre','GRE']].map(([val,lbl]) => (
          <button key={val+lbl} onClick={() => setFilter(val)}
            style={{ ...s.filterBtn, ...(filter===val ? s.filterActive : {}) }}>
            {lbl}
          </button>
        ))}
      </div>

      {loading ? <div style={s.loading}>Loading…</div>
        : items.length === 0 ? (
          <div style={s.empty}>
            No FAQs for this filter.{' '}
            <button onClick={openNew} style={{ background:'none', border:'none', color:'var(--red)', cursor:'pointer', fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'600' }}>
              Add one →
            </button>
          </div>
        ) : (
          Object.entries(grouped).map(([cat, faqs]) => {
            const catLabel = CATS.find(c=>c[0]===cat)?.[1] || cat
            return (
              <div key={cat} style={{ marginBottom:'2rem' }}>
                <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:'0.75rem' }}>{catLabel}</p>
                <SectionBox>
                  {faqs.map((faq, i) => (
                    <div key={faq.id} style={s.row}>
                      <div style={{ display:'flex', flexDirection:'column', gap:'0.2rem', flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                          <p style={s.question}>{faq.question}</p>
                          {!faq.is_active && <Badge color="gray">Hidden</Badge>}
                        </div>
                        <p style={s.answer}>{faq.answer.slice(0,120)}{faq.answer.length>120?'…':''}</p>
                      </div>
                      <div style={{ display:'flex', gap:'0.25rem', flexShrink:0 }}>
                        <button onClick={() => moveOrder(faq,-1)} disabled={i===0} style={{ ...s.orderBtn, opacity:i===0?0.3:1 }}>↑</button>
                        <button onClick={() => moveOrder(faq,1)} disabled={i===faqs.length-1} style={{ ...s.orderBtn, opacity:i===faqs.length-1?0.3:1 }}>↓</button>
                        <button onClick={() => openEdit(faq)} style={s.actionBtn}>Edit</button>
                        <button onClick={() => handleDelete(faq.id)} style={{ ...s.actionBtn, color:'#991b1b', borderColor:'#fca5a5' }}>Delete</button>
                      </div>
                    </div>
                  ))}
                </SectionBox>
              </div>
            )
          })
        )
      }

      {showForm && (
        <div style={s.overlay}>
          <div style={s.panel}>
            <div style={s.panelHeader}>
              <h2 style={s.panelTitle}>{editing ? 'Edit FAQ' : 'Add FAQ'}</h2>
              <button onClick={() => setForm(false)} style={s.closeBtn}>✕</button>
            </div>
            <div style={s.form}>
              <Field label="Scope">
                <select value={form.exam_slug} onChange={set('exam_slug')} style={s.input}>
                  <option value="">Site-wide (/faqs page)</option>
                  {EXAMS.filter(e=>e).map(e => <option key={e} value={e}>{e.toUpperCase()} course page</option>)}
                </select>
              </Field>
              <Field label="Category">
                <select value={form.category} onChange={set('category')} style={s.input}>
                  {CATS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
              <Field label="Question *">
                <input value={form.question} onChange={set('question')} style={s.input} placeholder="What is…?"/>
              </Field>
              <Field label="Answer *">
                <textarea value={form.answer} onChange={set('answer')} style={{ ...s.input, minHeight:'140px', resize:'vertical' }} placeholder="Full answer here…"/>
              </Field>
              <Field label="Sort Order">
                <input type="number" value={form.sort_order} onChange={set('sort_order')} style={{ ...s.input, width:'100px' }}/>
              </Field>
              <label style={s.checkbox}><input type="checkbox" checked={form.is_active} onChange={set('is_active')}/> Active (visible on site)</label>
              <div style={{ display:'flex', gap:'0.75rem', marginTop:'0.5rem' }}>
                <button onClick={handleSave} disabled={saving||!form.question||!form.answer} style={s.saveBtn}>
                  {saving ? 'Saving…' : editing ? 'Update →' : 'Add FAQ →'}
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
  loading:     { padding:'2rem', textAlign:'center', fontFamily:'var(--font-sans)', color:'var(--gray-400)' },
  empty:       { padding:'2rem', textAlign:'center', fontFamily:'var(--font-sans)', color:'var(--gray-400)' },
  row:         { display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'1rem 1.5rem', borderBottom:'1px solid var(--gray-100)', gap:'1rem' },
  question:    { fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'600', color:'var(--black)', lineHeight:'1.4' },
  answer:      { fontFamily:'Georgia, serif', fontSize:'0.82rem', color:'var(--gray-500)', lineHeight:'1.5' },
  orderBtn:    { fontFamily:'var(--font-sans)', fontSize:'0.72rem', padding:'0.2rem 0.4rem', border:'1px solid var(--gray-200)', borderRadius:'3px', background:'var(--white)', cursor:'pointer', color:'var(--gray-400)' },
  actionBtn:   { fontFamily:'var(--font-sans)', fontSize:'0.72rem', padding:'0.25rem 0.55rem', border:'1px solid var(--gray-200)', borderRadius:'3px', background:'var(--white)', cursor:'pointer', color:'var(--gray-600)' },
  overlay:     { position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200, display:'flex', justifyContent:'flex-end' },
  panel:       { width:'520px', height:'100%', background:'var(--white)', overflowY:'auto', padding:'2rem', boxShadow:'-4px 0 20px rgba(0,0,0,0.1)' },
  panelHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', paddingBottom:'1rem', borderBottom:'1px solid var(--gray-100)' },
  panelTitle:  { fontFamily:'var(--font-serif)', fontSize:'1.2rem', fontWeight:'700', color:'var(--black)' },
  closeBtn:    { background:'none', border:'none', cursor:'pointer', fontSize:'1.25rem', color:'var(--gray-400)' },
  form:        { display:'flex', flexDirection:'column', gap:'0.25rem' },
  input:       { width:'100%', padding:'0.6rem 0.75rem', fontFamily:'var(--font-sans)', fontSize:'0.875rem', border:'1px solid var(--gray-200)', borderRadius:'3px', outline:'none', boxSizing:'border-box' },
  checkbox:    { fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:'var(--gray-700)', display:'flex', alignItems:'center', gap:'0.5rem', cursor:'pointer' },
  saveBtn:     { background:'var(--black)', color:'var(--white)', border:'none', padding:'0.7rem 1.25rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'700', cursor:'pointer' },
  cancelBtn:   { background:'none', border:'1px solid var(--gray-200)', padding:'0.7rem 1.25rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.875rem', cursor:'pointer', color:'var(--gray-500)' },
}

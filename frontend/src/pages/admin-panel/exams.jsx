/**
 * GRADSKOOL Admin — Exams
 * Route: /admin-panel/exams
 *
 * Edit all exam page content:
 * Basic info · Overview · Eligibility · Key Dates · Exam Pattern ·
 * Top Colleges · SEO · Settings
 */
import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { SectionBox, Badge } from '../../components/admin/AdminPrimitives'
import api from '../../lib/api'

const CATEGORIES = [
  ['mba_india','MBA India'],['mba_abroad','MBA Abroad'],
  ['ug','Undergraduate'],['bundle','Bundle'],['interview','Interview Prep'],
]

const TABS = ['Basic','Overview','Eligibility','Key Dates','Exam Pattern','Top Colleges','SEO']

export default function AdminExamsPage() {
  const [exams, setExams]       = useState([])
  const [loading, setLoad]      = useState(true)
  const [selected, setSelected] = useState(null)
  const [form, setForm]         = useState(null)
  const [activeTab, setTab]     = useState('Basic')
  const [saving, setSaving]     = useState(false)
  const [msg, setMsg]           = useState(null)

  const loadExams = useCallback(() => {
    setLoad(true)
    api.get('/dashboard/exams/')
      .then(({ data }) => setExams(data))
      .catch(() => setMsg({ type:'error', text:'Failed to load exams' }))
      .finally(() => setLoad(false))
  }, [])

  useEffect(() => { loadExams() }, [loadExams])

  const openExam = async (slug) => {
    try {
      const { data } = await api.get(`/dashboard/exams/${slug}/`)
      setForm(data)
      setSelected(slug)
      setTab('Basic')
    } catch {
      setMsg({ type:'error', text:'Failed to load exam' })
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.patch(`/dashboard/exams/${selected}/`, form)
      setMsg({ type:'success', text:'Saved ✓' })
      loadExams()
    } catch {
      setMsg({ type:'error', text:'Save failed' })
    } finally {
      setSaving(false)
    }
  }

  const set = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(f => ({ ...f, [field]: val }))
  }

  // JSON field helpers
  const setJSON = (field, val) => setForm(f => ({ ...f, [field]: val }))

  if (selected && form) {
    return (
      <AdminLayout title="Exams">
        <div style={s.header}>
          <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
            <button onClick={() => setSelected(null)} style={s.backBtn}>← All Exams</button>
            <div>
              <p style={s.eyebrow}>Editing</p>
              <h1 style={s.title}>{form.name}</h1>
            </div>
          </div>
          <button onClick={handleSave} disabled={saving} style={s.saveBtn}>
            {saving ? 'Saving…' : 'Save Changes →'}
          </button>
        </div>

        {msg && <MsgBar msg={msg} onClose={() => setMsg(null)} />}

        {/* Tab bar */}
        <div style={s.tabBar}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setTab(tab)}
              style={{ ...s.tabBtn, ...(activeTab===tab ? s.tabActive : {}) }}>
              {tab}
            </button>
          ))}
        </div>

        <div style={{ marginTop:'1.5rem' }}>
          {activeTab === 'Basic' && (
            <SectionBox>
              <div style={s.grid2}>
                <Field label="Full Name *"><input value={form.name||''} onChange={set('name')} style={s.input}/></Field>
                <Field label="Short Name *"><input value={form.short_name||''} onChange={set('short_name')} style={s.input}/></Field>
                <Field label="Tagline"><input value={form.tagline||''} onChange={set('tagline')} style={s.input}/></Field>
                <Field label="Category">
                  <select value={form.category||''} onChange={set('category')} style={s.input}>
                    {CATEGORIES.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </Field>
                <Field label="Conducting Body"><input value={form.conducting_body||''} onChange={set('conducting_body')} style={s.input} placeholder="e.g. IIMs (rotating)"/></Field>
                <Field label="Score Range"><input value={form.score_range||''} onChange={set('score_range')} style={s.input} placeholder="e.g. 205–805"/></Field>
                <Field label="Exam Date"><input type="date" value={form.exam_date||''} onChange={set('exam_date')} style={s.input}/></Field>
                <Field label="Cohort Size"><input type="number" value={form.cohort_size||27} onChange={set('cohort_size')} style={s.input}/></Field>
                <Field label="Sort Order"><input type="number" value={form.sort_order||0} onChange={set('sort_order')} style={s.input}/></Field>
                <Field label="OG Image URL"><input value={form.og_image_url||''} onChange={set('og_image_url')} style={s.input} placeholder="https://…"/></Field>
              </div>
              <div style={{ display:'flex', gap:'2rem', marginTop:'1rem' }}>
                <label style={s.checkbox}><input type="checkbox" checked={!!form.is_active} onChange={set('is_active')}/> Active (visible to students)</label>
                <label style={s.checkbox}><input type="checkbox" checked={!!form.is_featured} onChange={set('is_featured')}/> Featured (shown on homepage)</label>
              </div>
            </SectionBox>
          )}

          {activeTab === 'Overview' && (
            <SectionBox>
              <Field label="Description (short — used in cards)">
                <textarea value={form.description||''} onChange={set('description')} style={{ ...s.input, minHeight:'80px', resize:'vertical' }}/>
              </Field>
              <Field label="What is [Exam]? — Full overview paragraph (shown on course page)">
                <textarea value={form.exam_overview||''} onChange={set('exam_overview')} style={{ ...s.input, minHeight:'180px', resize:'vertical' }} placeholder="Explain the exam — what it is, who conducts it, which colleges accept it…"/>
              </Field>
            </SectionBox>
          )}

          {activeTab === 'Eligibility' && (
            <SectionBox>
              <Field label="Eligibility criteria (one criterion per line)">
                <textarea value={form.eligibility||''} onChange={set('eligibility')} style={{ ...s.input, minHeight:'160px', resize:'vertical' }} placeholder="A Bachelor's degree in any discipline&#10;Minimum 50% aggregate&#10;Final-year students also eligible&#10;No age limit"/>
              </Field>
              <p style={s.hint}>Each line becomes one eligibility card on the course page.</p>
            </SectionBox>
          )}

          {activeTab === 'Key Dates' && (
            <KeyDatesEditor
              dates={form.key_dates || []}
              onChange={val => setJSON('key_dates', val)}
            />
          )}

          {activeTab === 'Exam Pattern' && (
            <ExamPatternEditor
              pattern={form.exam_pattern || []}
              onChange={val => setJSON('exam_pattern', val)}
            />
          )}

          {activeTab === 'Top Colleges' && (
            <TopCollegesEditor
              colleges={form.top_colleges || []}
              onChange={val => setJSON('top_colleges', val)}
            />
          )}

          {activeTab === 'SEO' && (
            <SectionBox>
              <Field label={`Meta Title (${(form.meta_title||'').length}/60)`}>
                <input value={form.meta_title||''} onChange={set('meta_title')} style={s.input} maxLength={60} placeholder={form.name}/>
              </Field>
              <Field label={`Meta Description (${(form.meta_desc||'').length}/160)`}>
                <textarea value={form.meta_desc||''} onChange={set('meta_desc')} style={{ ...s.input, minHeight:'80px', resize:'vertical' }} maxLength={160}/>
              </Field>
            </SectionBox>
          )}
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Exams">
      <div style={s.header}>
        <div>
          <p style={s.eyebrow}>Content</p>
          <h1 style={s.title}>Exams</h1>
          <p style={s.subtitle}>Edit exam page content — overview, dates, curriculum, pricing and SEO.</p>
        </div>
      </div>

      {msg && <MsgBar msg={msg} onClose={() => setMsg(null)} />}

      {loading ? (
        <div style={s.loading}>Loading exams…</div>
      ) : (
        <div style={s.examGrid}>
          {exams.map(exam => (
            <button key={exam.slug} onClick={() => openExam(exam.slug)} style={s.examCard}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.5rem' }}>
                <span style={s.examShort}>{exam.short_name}</span>
                <Badge color={exam.is_active ? 'green' : 'gray'}>{exam.is_active ? 'Active' : 'Inactive'}</Badge>
              </div>
              <p style={s.examName}>{exam.name}</p>
              <p style={s.examCat}>{exam.category?.replace('_',' ')}</p>
              <span style={s.editHint}>Edit content →</span>
            </button>
          ))}
        </div>
      )}
    </AdminLayout>
  )
}

// ── KEY DATES EDITOR ─────────────────────────────────────────────────────────

function KeyDatesEditor({ dates, onChange }) {
  const add = () => onChange([...dates, { month:'', year:'2026', event:'', detail:'' }])
  const remove = (i) => onChange(dates.filter((_,j) => j!==i))
  const update = (i, field, val) => {
    const next = [...dates]
    next[i] = { ...next[i], [field]: val }
    onChange(next)
  }
  return (
    <div>
      <SectionBox>
        {dates.length === 0 && <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.875rem', color:'var(--gray-400)', padding:'1rem 0' }}>No dates yet. Add one below.</p>}
        {dates.map((d, i) => (
          <div key={i} style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(100px,1fr))', gap:'0.75rem', alignItems:'start', padding:'0.875rem 0', borderBottom:'1px solid var(--gray-100)' }}>
            <Field label="Month"><input value={d.month||''} onChange={e => update(i,'month',e.target.value)} style={s.inputSm} placeholder="JUL"/></Field>
            <Field label="Year"><input value={d.year||''} onChange={e => update(i,'year',e.target.value)} style={s.inputSm} placeholder="2026"/></Field>
            <Field label="Event"><input value={d.event||''} onChange={e => update(i,'event',e.target.value)} style={s.inputSm} placeholder="Registration Opens"/></Field>
            <Field label="Detail"><input value={d.detail||''} onChange={e => update(i,'detail',e.target.value)} style={s.inputSm} placeholder="Brief description…"/></Field>
            <button onClick={() => remove(i)} style={{ background:'none', border:'none', color:'#e53e3e', cursor:'pointer', fontSize:'1rem', paddingTop:'22px' }}>✕</button>
          </div>
        ))}
        <button onClick={add} style={{ ...s.addBtn, marginTop:'1rem' }}>+ Add Date</button>
      </SectionBox>
    </div>
  )
}

// ── EXAM PATTERN EDITOR ──────────────────────────────────────────────────────

function ExamPatternEditor({ pattern, onChange }) {
  const add = () => onChange([...pattern, { label:'', value:'' }])
  const remove = (i) => onChange(pattern.filter((_,j) => j!==i))
  const update = (i, field, val) => {
    const next = [...pattern]
    next[i] = { ...next[i], [field]: val }
    onChange(next)
  }
  return (
    <SectionBox>
      <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:'var(--gray-500)', marginBottom:'1rem' }}>
        These appear as the 8-cell facts grid on the course page (Conducted By, Duration, Questions etc.)
      </p>
      {pattern.map((p, i) => (
        <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 32px', gap:'0.75rem', alignItems:'end', marginBottom:'0.75rem' }}>
          <Field label="Label"><input value={p.label||''} onChange={e => update(i,'label',e.target.value)} style={s.inputSm} placeholder="e.g. Total Questions"/></Field>
          <Field label="Value"><input value={p.value||''} onChange={e => update(i,'value',e.target.value)} style={s.inputSm} placeholder="e.g. 68"/></Field>
          <button onClick={() => remove(i)} style={{ background:'none', border:'none', color:'#e53e3e', cursor:'pointer', fontSize:'1rem', marginBottom:'2px' }}>✕</button>
        </div>
      ))}
      <button onClick={add} style={s.addBtn}>+ Add Row</button>
    </SectionBox>
  )
}

// ── TOP COLLEGES EDITOR ──────────────────────────────────────────────────────

function TopCollegesEditor({ colleges, onChange }) {
  const add = () => onChange([...colleges, { name:'', city:'', cutoff:'', avg:'', fee:'' }])
  const remove = (i) => onChange(colleges.filter((_,j) => j!==i))
  const update = (i, field, val) => {
    const next = [...colleges]
    next[i] = { ...next[i], [field]: val }
    onChange(next)
  }
  return (
    <SectionBox>
      {colleges.map((c, i) => (
        <div key={i} style={{ padding:'0.875rem 0', borderBottom:'1px solid var(--gray-100)' }}>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1.5fr 1fr 1fr 1fr 32px', gap:'0.5rem', alignItems:'end' }}>
            <Field label="College Name"><input value={c.name||''} onChange={e => update(i,'name',e.target.value)} style={s.inputSm} placeholder="IIM Ahmedabad"/></Field>
            <Field label="City"><input value={c.city||''} onChange={e => update(i,'city',e.target.value)} style={s.inputSm} placeholder="Ahmedabad, Gujarat"/></Field>
            <Field label="CAT Cutoff"><input value={c.cutoff||''} onChange={e => update(i,'cutoff',e.target.value)} style={s.inputSm} placeholder="99.5%+"/></Field>
            <Field label="Avg Package"><input value={c.avg||''} onChange={e => update(i,'avg',e.target.value)} style={s.inputSm} placeholder="INR 30 LPA"/></Field>
            <Field label="Fees"><input value={c.fee||''} onChange={e => update(i,'fee',e.target.value)} style={s.inputSm} placeholder="INR 25 L"/></Field>
            <button onClick={() => remove(i)} style={{ background:'none', border:'none', color:'#e53e3e', cursor:'pointer', fontSize:'1rem', marginBottom:'2px' }}>✕</button>
          </div>
        </div>
      ))}
      <button onClick={add} style={{ ...s.addBtn, marginTop:'1rem' }}>+ Add College</button>
    </SectionBox>
  )
}

// ── SHARED ────────────────────────────────────────────────────────────────────

function Field({ label, children }) {
  return (
    <div style={{ marginBottom:'1rem' }}>
      <label style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:'600', color:'var(--gray-700)', display:'block', marginBottom:'0.3rem' }}>{label}</label>
      {children}
    </div>
  )
}

function MsgBar({ msg, onClose }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.75rem 1rem', borderRadius:'4px', marginBottom:'1.25rem', fontFamily:'var(--font-sans)', fontSize:'0.875rem',
      background: msg.type==='success' ? '#f0fdf4' : '#fff5f5',
      border: `1px solid ${msg.type==='success' ? '#86efac' : '#fca5a5'}`,
      color: msg.type==='success' ? '#166534' : '#991b1b' }}>
      {msg.text}
      <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer' }}>✕</button>
    </div>
  )
}

const s = {
  header:   { display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem' },
  eyebrow:  { fontFamily:'var(--font-sans)', fontSize:'0.68rem', fontWeight:'700', letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--red)', marginBottom:'0.2rem' },
  title:    { fontFamily:'var(--font-serif)', fontSize:'2rem', fontWeight:'700', color:'var(--black)', marginBottom:'0.25rem' },
  subtitle: { fontFamily:'var(--font-sans)', fontSize:'0.875rem', color:'var(--gray-500)' },
  backBtn:  { fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:'var(--gray-500)', background:'none', border:'1px solid var(--gray-200)', padding:'0.5rem 0.875rem', borderRadius:'3px', cursor:'pointer' },
  saveBtn:  { background:'var(--black)', color:'var(--white)', border:'none', padding:'0.7rem 1.5rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'700', cursor:'pointer' },
  loading:  { padding:'3rem', textAlign:'center', fontFamily:'var(--font-sans)', color:'var(--gray-400)' },
  hint:     { fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:'var(--gray-400)', marginTop:'0.25rem' },
  examGrid: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem' },
  examCard: { background:'var(--white)', border:'1px solid var(--gray-200)', borderRadius:'4px', padding:'1.5rem', textAlign:'left', cursor:'pointer', transition:'border-color 0.15s', display:'flex', flexDirection:'column', gap:'0.25rem' },
  examShort:{ fontFamily:'var(--font-serif)', fontSize:'1.1rem', fontWeight:'700', color:'var(--black)' },
  examName: { fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:'var(--gray-600)' },
  examCat:  { fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:'var(--gray-400)', textTransform:'capitalize' },
  editHint: { fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:'var(--red)', marginTop:'0.5rem' },
  tabBar:   { display:'flex', gap:0, borderBottom:'1px solid var(--gray-200)' },
  tabBtn:   { fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'500', color:'var(--gray-400)', background:'none', border:'none', borderBottom:'2px solid transparent', padding:'0.75rem 1.25rem', cursor:'pointer', marginBottom:'-1px', transition:'color 0.15s' },
  tabActive:{ color:'var(--black)', borderBottomColor:'var(--red)', fontWeight:'600' },
  grid2:    { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 1rem' },
  input:    { width:'100%', padding:'0.6rem 0.75rem', fontFamily:'var(--font-sans)', fontSize:'0.875rem', border:'1px solid var(--gray-200)', borderRadius:'3px', outline:'none', boxSizing:'border-box' },
  inputSm:  { width:'100%', padding:'0.5rem 0.6rem', fontFamily:'var(--font-sans)', fontSize:'0.82rem', border:'1px solid var(--gray-200)', borderRadius:'3px', outline:'none', boxSizing:'border-box' },
  checkbox: { fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:'var(--gray-700)', display:'flex', alignItems:'center', gap:'0.5rem', cursor:'pointer' },
  addBtn:   { fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:'600', color:'var(--red)', background:'none', border:'1px dashed var(--red)', padding:'0.5rem 1rem', borderRadius:'3px', cursor:'pointer' },
}

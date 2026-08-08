/**
 * GRADSKOOL Admin — Tools Management
 * Route: /admin-panel/tools-manage
 *
 * - List all tools with question counts
 * - Edit tool settings (name, description, access model, pricing)
 * - Add/edit/delete questions per tool
 * - Import questions from HTML files (via management command)
 */
import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { SectionBox, Badge } from '../../components/admin/AdminPrimitives'
import api from '../../lib/api'

const DIFFICULTIES = ['Easy', 'Medium', 'Hard']
const OPTION_LABELS = ['A', 'B', 'C', 'D']

export default function AdminToolsManagePage() {
  const [tools, setTools]         = useState([])
  const [loading, setLoad]        = useState(true)
  const [selected, setSelected]   = useState(null)  // selected tool
  const [view, setView]           = useState('tools') // 'tools' | 'questions' | 'edit'
  const [msg, setMsg]             = useState(null)

  const loadTools = useCallback(() => {
    setLoad(true)
    api.get('/dashboard/tools-admin/')
      .then(({ data }) => setTools(data))
      .catch(() => setMsg({ type:'error', text:'Failed to load tools' }))
      .finally(() => setLoad(false))
  }, [])

  useEffect(() => { loadTools() }, [loadTools])

  return (
    <AdminLayout title="Tools">
      <div style={s.header}>
        <div>
          <p style={s.eyebrow}>Management</p>
          <h1 style={s.title}>Free Tools</h1>
          <p style={s.subtitle}>Manage tool settings, access model, pricing and questions.</p>
        </div>
        {selected && view !== 'tools' && (
          <button onClick={() => { setSelected(null); setView('tools') }} style={s.backBtn}>
            ← All Tools
          </button>
        )}
      </div>

      {msg && (
        <div style={{ ...s.msg, background: msg.type==='success' ? '#f0fdf4' : '#fff5f5',
          border:`1px solid ${msg.type==='success' ? '#86efac' : '#fca5a5'}`,
          color: msg.type==='success' ? '#166534' : '#991b1b' }}>
          {msg.text}
          <button onClick={() => setMsg(null)} style={s.msgClose}>✕</button>
        </div>
      )}

      {/* Tool list */}
      {view === 'tools' && (
        <div style={s.toolGrid}>
          {loading
            ? [0,1,2,3].map(i => <div key={i} style={{ height:'160px', background:'var(--gray-100)', borderRadius:'4px' }} />)
            : tools.map(tool => (
              <ToolCard
                key={tool.id}
                tool={tool}
                onEdit={() => { setSelected(tool); setView('edit') }}
                onQuestions={() => { setSelected(tool); setView('questions') }}
              />
            ))
          }
        </div>
      )}

      {/* Edit tool settings */}
      {view === 'edit' && selected && (
        <EditToolPanel
          tool={selected}
          onSave={async (data) => {
            await api.patch('/dashboard/tools-admin/', { id: selected.id, ...data })
            setMsg({ type:'success', text:'Tool updated' })
            loadTools()
            setView('tools')
          }}
          onCancel={() => setView('tools')}
        />
      )}

      {/* Questions manager */}
      {view === 'questions' && selected && (
        <QuestionsManager
          tool={selected}
          setMsg={setMsg}
        />
      )}
    </AdminLayout>
  )
}

// ── TOOL CARD ─────────────────────────────────────────────────────────────────

function ToolCard({ tool, onEdit, onQuestions }) {
  return (
    <div style={tc.card}>
      <div style={tc.top}>
        <div>
          <p style={tc.name}>{tool.name}</p>
          <p style={tc.slug}>{tool.slug}</p>
        </div>
        <Badge color={tool.is_active ? 'green' : 'gray'}>
          {tool.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      <div style={tc.stats}>
        <div style={tc.stat}>
          <span style={tc.statVal}>{tool.question_count.toLocaleString()}</span>
          <span style={tc.statLabel}>Questions</span>
        </div>
        <div style={tc.stat}>
          <span style={{ ...tc.statVal, color: tool.access_model === 'free' ? '#166534' : '#991b1b' }}>
            {tool.access_model === 'free' ? 'Free' : `₹${tool.price_inr}`}
          </span>
          <span style={tc.statLabel}>Access</span>
        </div>
        {tool.badge_text && (
          <div style={tc.stat}>
            <span style={{ ...tc.statVal, fontSize:'0.75rem' }}>{tool.badge_text}</span>
            <span style={tc.statLabel}>Badge</span>
          </div>
        )}
      </div>

      <div style={tc.actions}>
        <button onClick={onQuestions} style={tc.primaryBtn}>Manage Questions →</button>
        <button onClick={onEdit}      style={tc.secondaryBtn}>Edit Settings</button>
      </div>
    </div>
  )
}

const tc = {
  card:        { background:'var(--white)', border:'1px solid var(--gray-200)', borderRadius:'4px', padding:'1.5rem', display:'flex', flexDirection:'column', gap:'1rem' },
  top:         { display:'flex', justifyContent:'space-between', alignItems:'flex-start' },
  name:        { fontFamily:'var(--font-serif)', fontSize:'1rem', fontWeight:'700', color:'var(--black)' },
  slug:        { fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:'var(--gray-400)', marginTop:'0.15rem' },
  stats:       { display:'flex', gap:'1.5rem' },
  stat:        { display:'flex', flexDirection:'column', gap:'0.15rem' },
  statVal:     { fontFamily:'var(--font-serif)', fontSize:'1.3rem', fontWeight:'700', color:'var(--black)', lineHeight:'1' },
  statLabel:   { fontFamily:'var(--font-sans)', fontSize:'0.65rem', color:'var(--gray-400)', letterSpacing:'0.06em', textTransform:'uppercase' },
  actions:     { display:'flex', gap:'0.75rem', marginTop:'0.25rem' },
  primaryBtn:  { fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:'700', background:'var(--black)', color:'var(--white)', border:'none', padding:'0.5rem 0.875rem', borderRadius:'3px', cursor:'pointer' },
  secondaryBtn:{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', background:'none', border:'1px solid var(--gray-200)', padding:'0.5rem 0.875rem', borderRadius:'3px', cursor:'pointer', color:'var(--gray-600)' },
}

// ── EDIT TOOL PANEL ───────────────────────────────────────────────────────────

function EditToolPanel({ tool, onSave, onCancel }) {
  const [form, setForm] = useState({
    name:             tool.name,
    description:      tool.description,
    is_active:        tool.is_active,
    access_model:     tool.access_model,
    price_inr:        tool.price_inr || '',
    razorpay_plan_id: tool.razorpay_plan_id || '',
    preview_questions:tool.preview_questions,
    badge_text:       tool.badge_text || '',
    sort_order:       tool.sort_order,
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try { await onSave(form) }
    finally { setSaving(false) }
  }

  return (
    <SectionBox>
      <h2 style={s.panelTitle}>Edit — {tool.name}</h2>
      <div style={s.form}>
        <Field label="Name">
          <input value={form.name} onChange={e => setForm(f => ({...f, name:e.target.value}))} style={s.input} />
        </Field>
        <Field label="Description">
          <textarea value={form.description} onChange={e => setForm(f => ({...f, description:e.target.value}))} style={{ ...s.input, minHeight:'80px', resize:'vertical' }} />
        </Field>
        <Field label="Access Model">
          <div style={s.radioGroup}>
            {[['free','Free — anyone can use'],['premium','Premium — requires payment']].map(([val,lbl]) => (
              <label key={val} style={s.radioLabel}>
                <input type="radio" name="access" checked={form.access_model===val}
                  onChange={() => setForm(f => ({...f, access_model:val}))} />
                {lbl}
              </label>
            ))}
          </div>
        </Field>
        {form.access_model === 'premium' && (
          <>
            <Field label="Price (INR)">
              <input type="number" value={form.price_inr}
                onChange={e => setForm(f => ({...f, price_inr:e.target.value}))} style={s.input} />
            </Field>
            <Field label="Free Preview Questions">
              <input type="number" value={form.preview_questions}
                onChange={e => setForm(f => ({...f, preview_questions:Number(e.target.value)}))} style={{ ...s.input, width:'120px' }} />
              <p style={s.hint}>Number of questions shown before paywall</p>
            </Field>
            <Field label="Razorpay Plan ID">
              <input value={form.razorpay_plan_id}
                onChange={e => setForm(f => ({...f, razorpay_plan_id:e.target.value}))} style={s.input}
                placeholder="plan_XXXXXXXXXX" />
            </Field>
          </>
        )}
        <Field label="Badge Text (optional)">
          <input value={form.badge_text}
            onChange={e => setForm(f => ({...f, badge_text:e.target.value}))} style={s.input}
            placeholder="e.g. New, Premium, Coming Soon" />
        </Field>
        <Field label="Sort Order">
          <input type="number" value={form.sort_order}
            onChange={e => setForm(f => ({...f, sort_order:Number(e.target.value)}))} style={{ ...s.input, width:'100px' }} />
        </Field>
        <Field label="Status">
          <label style={s.radioLabel}>
            <input type="checkbox" checked={form.is_active}
              onChange={e => setForm(f => ({...f, is_active:e.target.checked}))} />
            Active (visible to students)
          </label>
        </Field>

        <div style={{ display:'flex', gap:'0.75rem', marginTop:'0.5rem' }}>
          <button onClick={handleSave} disabled={saving} style={s.saveBtn}>
            {saving ? 'Saving…' : 'Save Changes →'}
          </button>
          <button onClick={onCancel} style={s.cancelBtn}>Cancel</button>
        </div>
      </div>
    </SectionBox>
  )
}

// ── QUESTIONS MANAGER ─────────────────────────────────────────────────────────

function QuestionsManager({ tool, setMsg }) {
  const [questions, setQuestions] = useState([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoad]        = useState(true)
  const [page, setPage]           = useState(1)
  const [search, setSearch]       = useState('')
  const [diff, setDiff]           = useState('')
  const [showAdd, setShowAdd]     = useState(false)
  const [editing, setEditing]     = useState(null)
  const PER_PAGE = 30

  const loadQs = useCallback(() => {
    if (!tool) return
    setLoad(true)
    const params = new URLSearchParams({ page, per_page:PER_PAGE, search, difficulty:diff })
    api.get(`/dashboard/tools-admin/${tool.id}/questions/?${params}`)
      .then(({ data }) => { setQuestions(data.results || []); setTotal(data.count || 0) })
      .catch(() => {})
      .finally(() => setLoad(false))
  }, [tool, page, search, diff])

  useEffect(() => { loadQs() }, [loadQs])

  const handleDelete = async (qId) => {
    if (!confirm('Delete this question?')) return
    await api.delete(`/dashboard/tools-admin/questions/${qId}/`)
    setMsg({ type:'success', text:'Question deleted' })
    loadQs()
  }

  return (
    <div>
      <div style={s.qHeader}>
        <div>
          <h2 style={s.panelTitle}>{tool.name} — Questions</h2>
          <p style={s.subtitle}>{total.toLocaleString()} total questions</p>
        </div>
        <button onClick={() => { setEditing(null); setShowAdd(true) }} style={s.saveBtn}>
          + Add Question
        </button>
      </div>

      {/* Import hint */}
      <div style={s.importHint}>
        <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:'#92400e' }}>
          💡 To bulk-import questions from HTML files, run:
        </p>
        <code style={{ fontFamily:'monospace', fontSize:'0.78rem', color:'#78350f', display:'block', marginTop:'0.25rem' }}>
          python manage.py import_from_html --html-dir /path/to/html/
        </code>
      </div>

      {/* Filters */}
      <div style={s.filters}>
        <input type="text" placeholder="Search questions…"
          value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          style={s.searchInput} />
        <select value={diff} onChange={e => { setDiff(e.target.value); setPage(1) }} style={s.select}>
          <option value="">All Difficulties</option>
          {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Question list */}
      <SectionBox>
        {loading
          ? <div style={s.loading}>Loading questions…</div>
          : questions.length === 0
            ? <div style={s.empty}>No questions found. Add one above or import from HTML.</div>
            : questions.map(q => (
                <QuestionRow key={q.id} q={q}
                  onEdit={() => { setEditing(q); setShowAdd(true) }}
                  onDelete={() => handleDelete(q.id)} />
              ))
        }
        {total > PER_PAGE && (
          <div style={s.pagination}>
            <button disabled={page===1} onClick={() => setPage(p=>p-1)} style={s.pageBtn}>← Prev</button>
            <span style={s.pageInfo}>{page} / {Math.ceil(total/PER_PAGE)}</span>
            <button disabled={page>=Math.ceil(total/PER_PAGE)} onClick={() => setPage(p=>p+1)} style={s.pageBtn}>Next →</button>
          </div>
        )}
      </SectionBox>

      {/* Add/Edit question panel */}
      {showAdd && (
        <div style={s.overlay}>
          <div style={s.qPanel}>
            <AddEditQuestion
              toolId={tool.id}
              question={editing}
              onSave={async (data) => {
                if (editing) {
                  await api.patch(`/dashboard/tools-admin/questions/${editing.id}/`, data)
                  setMsg({ type:'success', text:'Question updated' })
                } else {
                  await api.post(`/dashboard/tools-admin/${tool.id}/questions/`, data)
                  setMsg({ type:'success', text:'Question added' })
                }
                setShowAdd(false)
                setEditing(null)
                loadQs()
              }}
              onClose={() => { setShowAdd(false); setEditing(null) }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function QuestionRow({ q, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div style={{ borderBottom:'1px solid var(--gray-100)', padding:'1rem 1.5rem' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'1rem' }}>
        <div style={{ flex:1 }}>
          <p style={{ fontFamily:'Georgia, serif', fontSize:'0.875rem', color:'var(--black)',
            lineHeight:'1.5', marginBottom:'0.35rem',
            overflow: expanded ? 'visible' : 'hidden',
            display: expanded ? 'block' : '-webkit-box',
            WebkitLineClamp: expanded ? 'none' : 2,
            WebkitBoxOrient: 'vertical',
          }}>
            {q.text}
          </p>
          <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
            {q.difficulty && (
              <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700',
                letterSpacing:'0.06em', textTransform:'uppercase',
                color: q.difficulty==='Easy' ? '#166534' : q.difficulty==='Hard' ? '#991b1b' : '#92400e',
                background: q.difficulty==='Easy' ? '#f0fdf4' : q.difficulty==='Hard' ? '#fff5f5' : '#fef9c3',
                padding:'0.1rem 0.4rem', borderRadius:'100px' }}>
                {q.difficulty}
              </span>
            )}
            {q.topic && <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.7rem', color:'var(--gray-400)' }}>{q.topic}</span>}
            {q.options?.length > 0 && <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.7rem', color:'var(--gray-400)' }}>{q.options.length} options</span>}
          </div>
        </div>
        <div style={{ display:'flex', gap:'0.4rem', flexShrink:0 }}>
          <button onClick={() => setExpanded(!expanded)} style={{ ...s.actionBtn, color:'var(--gray-400)' }}>{expanded ? 'Less' : 'More'}</button>
          <button onClick={onEdit}   style={s.actionBtn}>Edit</button>
          <button onClick={onDelete} style={{ ...s.actionBtn, color:'#991b1b' }}>Delete</button>
        </div>
      </div>
      {expanded && q.options?.length > 0 && (
        <div style={{ marginTop:'0.75rem', display:'flex', flexDirection:'column', gap:'0.3rem' }}>
          {q.options.map(opt => (
            <div key={opt.id} style={{ display:'flex', gap:'0.5rem', fontFamily:'var(--font-sans)', fontSize:'0.78rem' }}>
              <span style={{ fontWeight:'700', color: opt.is_correct ? '#166534' : 'var(--gray-400)', flexShrink:0 }}>{opt.label}.</span>
              <span style={{ color: opt.is_correct ? '#166534' : 'var(--gray-600)' }}>{opt.text}</span>
              {opt.is_correct && <span style={{ color:'#166534', fontWeight:'700' }}>✓</span>}
            </div>
          ))}
          {q.explanation && (
            <p style={{ fontFamily:'Georgia, serif', fontSize:'0.78rem', color:'var(--gray-500)',
              fontStyle:'italic', marginTop:'0.4rem', lineHeight:'1.6', borderLeft:'2px solid var(--gray-200)', paddingLeft:'0.75rem' }}>
              {q.explanation}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function AddEditQuestion({ question, toolId, onSave, onClose }) {
  const initOptions = question?.options?.length
    ? question.options
    : OPTION_LABELS.map(l => ({ label:l, text:'', is_correct:false }))

  const [form, setForm] = useState({
    text:        question?.text || '',
    explanation: question?.explanation || '',
    difficulty:  question?.difficulty || 'Medium',
    topic:       question?.topic || '',
    options:     initOptions,
  })
  const [saving, setSaving] = useState(false)

  const setOption = (i, field, val) => {
    setForm(f => {
      const opts = [...f.options]
      opts[i] = { ...opts[i], [field]: val }
      // if setting is_correct, unset others
      if (field === 'is_correct' && val) {
        opts.forEach((o, j) => { if (j !== i) opts[j] = { ...opts[j], is_correct:false } })
      }
      return { ...f, options:opts }
    })
  }

  const handleSave = async () => {
    if (!form.text.trim()) return
    setSaving(true)
    try { await onSave(form) }
    finally { setSaving(false) }
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
        marginBottom:'1.5rem', paddingBottom:'1rem', borderBottom:'1px solid var(--gray-100)' }}>
        <h2 style={{ fontFamily:'var(--font-serif)', fontSize:'1.2rem', fontWeight:'700', color:'var(--black)' }}>
          {question ? 'Edit Question' : 'Add Question'}
        </h2>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1.25rem', color:'var(--gray-400)' }}>✕</button>
      </div>

      <div style={s.form}>
        <Field label="Question Text *">
          <textarea value={form.text} onChange={e => setForm(f => ({...f, text:e.target.value}))}
            style={{ ...s.input, minHeight:'100px', resize:'vertical' }}
            placeholder="Type the question here…" />
        </Field>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
          <Field label="Difficulty">
            <select value={form.difficulty} onChange={e => setForm(f => ({...f, difficulty:e.target.value}))} style={s.input}>
              {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Topic Tag">
            <input value={form.topic} onChange={e => setForm(f => ({...f, topic:e.target.value}))}
              style={s.input} placeholder="e.g. Percentages, RC, Vocab" />
          </Field>
        </div>

        <Field label="Answer Options (click ✓ to mark correct)">
          {form.options.map((opt, i) => (
            <div key={i} style={{ display:'flex', gap:'0.5rem', alignItems:'center', marginBottom:'0.5rem' }}>
              <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:'700',
                color: opt.is_correct ? '#166534' : 'var(--gray-400)', width:'18px', flexShrink:0 }}>
                {opt.label}.
              </span>
              <input value={opt.text} onChange={e => setOption(i, 'text', e.target.value)}
                style={{ ...s.input, flex:1 }} placeholder={`Option ${opt.label}`} />
              <button onClick={() => setOption(i, 'is_correct', !opt.is_correct)}
                style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'700',
                  padding:'0.3rem 0.5rem', border:`1px solid ${opt.is_correct ? '#86efac' : 'var(--gray-200)'}`,
                  background: opt.is_correct ? '#f0fdf4' : 'var(--white)',
                  color: opt.is_correct ? '#166534' : 'var(--gray-400)',
                  borderRadius:'3px', cursor:'pointer', flexShrink:0 }}>
                {opt.is_correct ? '✓ Correct' : '✓'}
              </button>
            </div>
          ))}
        </Field>

        <Field label="Explanation (optional)">
          <textarea value={form.explanation} onChange={e => setForm(f => ({...f, explanation:e.target.value}))}
            style={{ ...s.input, minHeight:'60px', resize:'vertical' }}
            placeholder="Explain the correct answer…" />
        </Field>

        <div style={{ display:'flex', gap:'0.75rem' }}>
          <button onClick={handleSave} disabled={saving || !form.text.trim()} style={s.saveBtn}>
            {saving ? 'Saving…' : question ? 'Update Question →' : 'Add Question →'}
          </button>
          <button onClick={onClose} style={s.cancelBtn}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ── SHARED ────────────────────────────────────────────────────────────────────

function Field({ label, children }) {
  return (
    <div>
      <label style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:'600',
        color:'var(--gray-700)', display:'block', marginBottom:'0.35rem' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const s = {
  header:   { display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'2rem' },
  eyebrow:  { fontFamily:'var(--font-sans)', fontSize:'0.68rem', fontWeight:'700', letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--red)', marginBottom:'0.25rem' },
  title:    { fontFamily:'var(--font-serif)', fontSize:'2rem', fontWeight:'700', color:'var(--black)', marginBottom:'0.3rem' },
  subtitle: { fontFamily:'var(--font-sans)', fontSize:'0.875rem', color:'var(--gray-500)' },
  backBtn:  { fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:'var(--gray-500)', background:'none', border:'1px solid var(--gray-200)', padding:'0.5rem 0.875rem', borderRadius:'3px', cursor:'pointer' },
  msg:      { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.75rem 1rem', borderRadius:'4px', marginBottom:'1rem', fontFamily:'var(--font-sans)', fontSize:'0.875rem' },
  msgClose: { background:'none', border:'none', cursor:'pointer' },
  toolGrid: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1.25rem' },
  panelTitle:{ fontFamily:'var(--font-serif)', fontSize:'1.3rem', fontWeight:'700', color:'var(--black)', marginBottom:'0.25rem' },
  qHeader:  { display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'1.25rem' },
  importHint:{ background:'#fef9c3', border:'1px solid #fde68a', borderRadius:'4px', padding:'0.875rem 1.25rem', marginBottom:'1.25rem' },
  filters:  { display:'flex', gap:'0.75rem', marginBottom:'1.25rem' },
  searchInput:{ flex:1, padding:'0.6rem 0.875rem', fontFamily:'var(--font-sans)', fontSize:'0.875rem', border:'1px solid var(--gray-200)', borderRadius:'3px', outline:'none' },
  select:   { padding:'0.6rem 0.875rem', fontFamily:'var(--font-sans)', fontSize:'0.82rem', border:'1px solid var(--gray-200)', borderRadius:'3px', background:'var(--white)', outline:'none' },
  loading:  { padding:'2rem', textAlign:'center', fontFamily:'var(--font-sans)', color:'var(--gray-400)' },
  empty:    { padding:'2rem', textAlign:'center', fontFamily:'var(--font-sans)', color:'var(--gray-400)' },
  actionBtn:{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', padding:'0.25rem 0.55rem', border:'1px solid var(--gray-200)', borderRadius:'3px', background:'var(--white)', cursor:'pointer', color:'var(--gray-600)' },
  pagination:{ display:'flex', alignItems:'center', justifyContent:'center', gap:'1rem', padding:'1rem 0 0', borderTop:'1px solid var(--gray-100)' },
  pageBtn:  { fontFamily:'var(--font-sans)', fontSize:'0.82rem', padding:'0.4rem 0.875rem', border:'1px solid var(--gray-200)', borderRadius:'3px', background:'var(--white)', cursor:'pointer' },
  pageInfo: { fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:'var(--gray-400)' },
  overlay:  { position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200, display:'flex', justifyContent:'flex-end' },
  qPanel:   { width:'520px', height:'100%', background:'var(--white)', overflowY:'auto', padding:'2rem', boxShadow:'-4px 0 20px rgba(0,0,0,0.1)' },
  form:     { display:'flex', flexDirection:'column', gap:'1rem' },
  input:    { width:'100%', padding:'0.6rem 0.75rem', fontFamily:'var(--font-sans)', fontSize:'0.875rem', border:'1px solid var(--gray-200)', borderRadius:'3px', outline:'none', boxSizing:'border-box' },
  hint:     { fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:'var(--gray-400)', marginTop:'0.25rem' },
  radioGroup:{ display:'flex', flexDirection:'column', gap:'0.4rem' },
  radioLabel:{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:'var(--gray-700)', display:'flex', alignItems:'center', gap:'0.5rem', cursor:'pointer' },
  saveBtn:  { background:'var(--black)', color:'var(--white)', border:'none', padding:'0.7rem 1.25rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'700', cursor:'pointer' },
  cancelBtn:{ background:'none', border:'1px solid var(--gray-200)', padding:'0.7rem 1.25rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.875rem', cursor:'pointer', color:'var(--gray-500)' },
}

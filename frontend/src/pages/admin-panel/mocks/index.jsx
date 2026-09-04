/**
 * GRADSKOOL Admin — Mock Tests
 * Route: /admin-panel/mocks
 *
 * Lists Full Mock + Sectional papers per exam. Topic-wise practice needs
 * no paper here — it's assembled dynamically from tagged questions, see
 * /admin-panel/mocks/topics for tag management.
 */
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { AdminLayout } from '../../../components/admin/AdminLayout'
import { SectionBox, Badge } from '../../../components/admin/AdminPrimitives'
import api from '../../../lib/api'

const EXAMS = ['cat', 'xat', 'snap', 'nmat', 'gmat', 'gre', 'ipmat', 'cmat', 'mhcet', 'clat', 'cuet']

const s = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' },
  eyebrow: { fontFamily: 'var(--font-sans)', fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: '0.2rem' },
  title: { fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: '700', color: 'var(--black)', marginBottom: '0.25rem' },
  sub: { fontFamily: 'var(--font-sans)', fontSize: '0.875rem', color: 'var(--gray-500)' },
  btn: { background: 'var(--black)', color: 'var(--white)', border: 'none', padding: '0.7rem 1.25rem', borderRadius: '3px', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer' },
  filterBtn: { fontFamily: 'var(--font-sans)', fontSize: '0.72rem', padding: '0.3rem 0.75rem', border: '1px solid var(--gray-200)', borderRadius: '3px', background: 'var(--white)', cursor: 'pointer', color: 'var(--gray-500)' },
  filterActive: { background: 'var(--black)', color: 'var(--white)', borderColor: 'var(--black)' },
  row: { display: 'grid', gridTemplateColumns: '2fr 100px 1fr 100px 100px 100px', gap: '1rem', padding: '0.875rem 1.5rem', borderBottom: '1px solid var(--gray-100)', alignItems: 'center' },
  th: { fontFamily: 'var(--font-sans)', fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gray-400)' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', justifyContent: 'flex-end' },
  panel: { width: '520px', height: '100%', background: 'var(--white)', overflowY: 'auto', padding: '2rem', boxShadow: '-4px 0 20px rgba(0,0,0,0.1)' },
  input: { width: '100%', padding: '0.6rem 0.75rem', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', border: '1px solid var(--gray-200)', borderRadius: '3px', outline: 'none', boxSizing: 'border-box' },
  label: { fontFamily: 'var(--font-sans)', fontSize: '0.78rem', fontWeight: '600', color: 'var(--gray-700)', display: 'block', marginBottom: '0.3rem' },
  fieldWrap: { marginBottom: '0.875rem' },
}

export default function AdminMocksPage() {
  const [exam, setExam] = useState('snap')
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [msg, setMsg] = useState(null)

  const EMPTY = { exam_slug: exam, test_type: 'sectional', title: '', description: '', is_free: false, sections: [{ name: '', time_limit_mins: 40 }] }
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    api.get(`/dashboard/mocks/papers/?exam=${exam}`)
      .then(({ data }) => setPapers(data))
      .catch(() => setMsg({ type: 'error', text: 'Failed to load' }))
      .finally(() => setLoading(false))
  }, [exam])

  useEffect(() => { load() }, [load])

  const openNew = (test_type) => {
    setForm({ ...EMPTY, exam_slug: exam, test_type, sections: test_type === 'sectional' ? [{ name: '', time_limit_mins: 40 }] : [] })
    setShowForm(true)
  }

  const addSectionRow = () => setForm(f => ({ ...f, sections: [...f.sections, { name: '', time_limit_mins: 40, order: f.sections.length + 1 }] }))
  const updateSectionRow = (i, field, val) => setForm(f => ({ ...f, sections: f.sections.map((sec, idx) => idx === i ? { ...sec, [field]: val } : sec) }))
  const removeSectionRow = (i) => setForm(f => ({ ...f, sections: f.sections.filter((_, idx) => idx !== i) }))

  const save = async () => {
    if (!form.title.trim()) { setMsg({ type: 'error', text: 'Title is required' }); return }
    if (form.test_type === 'sectional' && (!form.sections.length || !form.sections[0].name.trim())) {
      setMsg({ type: 'error', text: 'A sectional paper needs one section name' }); return
    }
    setSaving(true)
    try {
      await api.post('/dashboard/mocks/papers/', form)
      setMsg({ type: 'success', text: 'Paper created' })
      setShowForm(false)
      load()
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.error || 'Failed to create paper' })
    } finally { setSaving(false) }
  }

  const mocks = papers.filter(p => p.test_type === 'mock')
  const sectionals = papers.filter(p => p.test_type === 'sectional')

  return (
    <AdminLayout title="Mock Tests">
      <div style={s.header}>
        <div>
          <p style={s.eyebrow}>Content</p>
          <h1 style={s.title}>Mock Tests</h1>
          <p style={s.sub}>Full Mocks + Sectionals, authored the same way PYQs are — create a paper, then paste &amp; split to bulk-add questions. Topic-wise practice is tag-driven — see <Link href="/admin-panel/mocks/topics">Topics</Link>.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => openNew('sectional')} style={s.btn}>+ Sectional</button>
          <button onClick={() => openNew('mock')} style={{ ...s.btn, background: 'var(--red)' }}>+ Full Mock</button>
        </div>
      </div>

      {msg && (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', borderRadius: '4px', marginBottom: '1.25rem', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', background: msg.type === 'success' ? '#f0fdf4' : '#fff5f5', border: `1px solid ${msg.type === 'success' ? '#86efac' : '#fca5a5'}`, color: msg.type === 'success' ? '#166534' : '#991b1b' }}>
          {msg.text}<button onClick={() => setMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {EXAMS.map(e => (
          <button key={e} onClick={() => setExam(e)} style={{ ...s.filterBtn, ...(exam === e ? s.filterActive : {}) }}>{e.toUpperCase()}</button>
        ))}
      </div>

      {loading ? <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-400)' }}>Loading…</p> : (
        <>
          <PaperGroup title={`Full Mocks — ${mocks.length}`} papers={mocks} />
          <PaperGroup title={`Sectionals — ${sectionals.length}`} papers={sectionals} />
        </>
      )}

      {showForm && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div style={s.panel}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: '700', marginBottom: '1.5rem' }}>
              New {form.test_type === 'mock' ? 'Full Mock' : 'Sectional'} — {exam.toUpperCase()}
            </h2>
            <div style={s.fieldWrap}>
              <label style={s.label}>Title *</label>
              <input style={s.input} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder={form.test_type === 'mock' ? 'e.g. SNAP Mock 1' : 'e.g. SNAP Sectional — Quant-DI-DS Set 3'} />
            </div>
            <div style={s.fieldWrap}>
              <label style={s.label}>Description</label>
              <textarea style={{ ...s.input, minHeight: '60px' }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div style={s.fieldWrap}>
              <label style={{ ...s.label, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.is_free} onChange={e => setForm(f => ({ ...f, is_free: e.target.checked }))} />
                Free (bypasses paid access AND the unlock-progression gate)
              </label>
            </div>

            <div style={{ ...s.fieldWrap, borderTop: '1px solid var(--gray-100)', paddingTop: '1rem' }}>
              <label style={s.label}>
                {form.test_type === 'sectional' ? 'Section (exactly one)' : `Sections — ${exam.toUpperCase()} has its own real section names, e.g. General English / Quant-DI-DS / Analytical & Logical Reasoning`}
              </label>
              {form.sections.map((sec, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 32px', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input style={s.input} placeholder="Section name" value={sec.name} onChange={e => updateSectionRow(i, 'name', e.target.value)} />
                  <input style={s.input} type="number" placeholder="mins" value={sec.time_limit_mins} onChange={e => updateSectionRow(i, 'time_limit_mins', e.target.value)} />
                  {form.test_type === 'mock' && form.sections.length > 1 && (
                    <button onClick={() => removeSectionRow(i)} style={{ border: '1px solid #fca5a5', background: '#fff', color: '#991b1b', borderRadius: '3px', cursor: 'pointer' }}>✕</button>
                  )}
                </div>
              ))}
              {form.test_type === 'mock' && (
                <button onClick={addSectionRow} style={{ ...s.filterBtn, marginTop: '0.25rem' }}>+ Add section</button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button onClick={save} disabled={saving} style={{ ...s.btn, flex: 1, opacity: saving ? 0.6 : 1 }}>{saving ? 'Creating…' : 'Create Paper →'}</button>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: '1px solid var(--gray-200)', padding: '0.7rem 1.25rem', borderRadius: '3px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

function PaperGroup({ title, papers }) {
  return (
    <div style={{ marginBottom: '2rem' }}>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: '0.75rem' }}>{title}</p>
      <SectionBox>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 100px 1fr 100px 100px 100px', gap: '1rem', padding: '0.75rem 1.5rem', background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-100)' }}>
          {['Title', 'Free', 'Sections', 'Questions', 'Active', ''].map(h => <span key={h} style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gray-400)' }}>{h}</span>)}
        </div>
        {papers.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-400)', fontFamily: 'var(--font-sans)', fontSize: '0.875rem' }}>None yet.</div>
        ) : papers.map(p => (
          <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '2fr 100px 1fr 100px 100px 100px', gap: '1rem', padding: '0.875rem 1.5rem', borderBottom: '1px solid var(--gray-100)', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: '600' }}>{p.title}</span>
            <span>{p.is_free ? <Badge label="FREE" color="#166534" bg="#dcfce7" /> : '—'}</span>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: 'var(--gray-500)' }}>{p.sections.map(s => s.name).join(', ') || '—'}</span>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.82rem', fontWeight: '700' }}>{p.total_questions}</span>
            <span>{p.is_active ? <Badge label="ACTIVE" color="#166534" bg="#dcfce7" /> : <Badge label="OFF" />}</span>
            <Link href={`/admin-panel/mocks/paper/${p.id}`} style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'var(--red)', fontWeight: '700', textDecoration: 'none' }}>Manage →</Link>
          </div>
        ))}
      </SectionBox>
    </div>
  )
}

/**
 * GRADSKOOL Admin — Mock Paper Detail
 * Route: /admin-panel/mocks/paper/[id]
 */
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { AdminLayout } from '../../../../components/admin/AdminLayout'
import { SectionBox, Badge } from '../../../../components/admin/AdminPrimitives'
import api from '../../../../lib/api'

const s = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' },
  eyebrow: { fontFamily: 'var(--font-sans)', fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: '0.2rem' },
  title: { fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: '700', color: 'var(--black)' },
  sub: { fontFamily: 'var(--font-sans)', fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: '0.25rem' },
  btn: { background: 'var(--black)', color: 'var(--white)', border: 'none', padding: '0.6rem 1rem', borderRadius: '3px', fontFamily: 'var(--font-sans)', fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer' },
  row: { display: 'grid', gridTemplateColumns: '1.5fr 100px 100px 120px', gap: '1rem', padding: '0.875rem 1.5rem', borderBottom: '1px solid var(--gray-100)', alignItems: 'center' },
  input: { padding: '0.4rem 0.6rem', fontFamily: 'var(--font-sans)', fontSize: '0.82rem', border: '1px solid var(--gray-200)', borderRadius: '3px', width: '100%', boxSizing: 'border-box' },
}

export default function MockPaperDetail() {
  const router = useRouter()
  const { id } = router.query
  const [paper, setPaper] = useState(null)
  const [loading, setLoading] = useState(true)
  const [newSection, setNewSection] = useState({ name: '', time_limit_mins: 40 })
  const [msg, setMsg] = useState(null)

  const load = useCallback(() => {
    if (!id) return
    setLoading(true)
    api.get(`/dashboard/mocks/papers/${id}/`).then(({ data }) => setPaper(data)).finally(() => setLoading(false))
  }, [id])
  useEffect(() => { load() }, [load])

  const addSection = async () => {
    if (!newSection.name.trim()) return
    try {
      await api.post(`/dashboard/mocks/papers/${id}/sections/`, newSection)
      setNewSection({ name: '', time_limit_mins: 40 })
      load()
    } catch (e) { setMsg({ type: 'error', text: e.response?.data?.error || 'Failed' }) }
  }

  const toggleActive = async () => {
    await api.patch(`/dashboard/mocks/papers/${id}/`, { is_active: !paper.is_active })
    load()
  }

  if (loading || !paper) return <AdminLayout title="Mock Paper"><p style={{ padding: '2rem', color: 'var(--gray-400)' }}>Loading…</p></AdminLayout>

  return (
    <AdminLayout title={paper.title}>
      <Link href="/admin-panel/mocks" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: 'var(--gray-500)', textDecoration: 'none' }}>← All Mock Tests</Link>

      <div style={{ ...s.header, marginTop: '0.75rem' }}>
        <div>
          <p style={s.eyebrow}>{paper.test_type === 'mock' ? 'Full Mock' : 'Sectional'} — {paper.exam_slug.toUpperCase()}</p>
          <h1 style={s.title}>{paper.title}</h1>
          <p style={s.sub}>{paper.total_questions} questions · {paper.total_duration_mins} min total {paper.is_free && ' · FREE'}</p>
        </div>
        <button onClick={toggleActive} style={{ ...s.btn, background: paper.is_active ? '#991b1b' : 'var(--black)' }}>
          {paper.is_active ? 'Deactivate' : 'Activate'}
        </button>
      </div>

      {msg && <p style={{ color: '#991b1b', fontFamily: 'var(--font-sans)', fontSize: '0.82rem' }}>{msg.text}</p>}

      <SectionBox title="Sections">
        <div style={{ ...s.row, background: 'var(--gray-50)' }}>
          {['Section', 'Time (min)', 'Questions', ''].map(h => <span key={h} style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--gray-400)' }}>{h}</span>)}
        </div>
        {paper.sections.map(sec => (
          <div key={sec.id} style={s.row}>
            <span style={{ fontFamily: 'var(--font-sans)', fontWeight: '600' }}>{sec.name}</span>
            <span>{sec.time_limit_mins}</span>
            <span>{sec.question_count}</span>
            <Link href={`/admin-panel/mocks/section/${sec.id}`} style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'var(--red)', fontWeight: '700', textDecoration: 'none' }}>Manage Questions →</Link>
          </div>
        ))}
        {paper.test_type === 'mock' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 100px 100px', gap: '1rem', padding: '0.875rem 1.5rem' }}>
            <input style={s.input} placeholder="New section name" value={newSection.name} onChange={e => setNewSection(n => ({ ...n, name: e.target.value }))} />
            <input style={s.input} type="number" value={newSection.time_limit_mins} onChange={e => setNewSection(n => ({ ...n, time_limit_mins: e.target.value }))} />
            <button onClick={addSection} style={s.btn}>+ Add</button>
          </div>
        )}
      </SectionBox>
    </AdminLayout>
  )
}

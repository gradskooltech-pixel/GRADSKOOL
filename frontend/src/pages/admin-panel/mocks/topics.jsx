/**
 * GRADSKOOL Admin — Mock Test Topics
 * Route: /admin-panel/mocks/topics
 *
 * These tags drive Topic-wise practice — a topic-wise attempt dynamically
 * pulls every MockQuestion tagged with a topic, regardless of which paper
 * (mock or sectional) that question was originally authored under.
 */
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { AdminLayout } from '../../../components/admin/AdminLayout'
import { SectionBox } from '../../../components/admin/AdminPrimitives'
import api from '../../../lib/api'

const EXAMS = ['cat', 'xat', 'snap', 'nmat', 'gmat', 'gre', 'ipmat', 'cmat', 'mhcet', 'clat', 'cuet']

const s = {
  title: { fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: '700', marginBottom: '0.25rem' },
  sub: { fontFamily: 'var(--font-sans)', fontSize: '0.875rem', color: 'var(--gray-500)', marginBottom: '1.5rem' },
  filterBtn: { fontFamily: 'var(--font-sans)', fontSize: '0.72rem', padding: '0.3rem 0.75rem', border: '1px solid var(--gray-200)', borderRadius: '3px', background: 'var(--white)', cursor: 'pointer', color: 'var(--gray-500)' },
  filterActive: { background: 'var(--black)', color: 'var(--white)', borderColor: 'var(--black)' },
  input: { padding: '0.5rem 0.7rem', fontFamily: 'var(--font-sans)', fontSize: '0.82rem', border: '1px solid var(--gray-200)', borderRadius: '3px', boxSizing: 'border-box' },
  btn: { background: 'var(--black)', color: 'var(--white)', border: 'none', padding: '0.5rem 1rem', borderRadius: '3px', fontFamily: 'var(--font-sans)', fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer' },
  row: { display: 'grid', gridTemplateColumns: '1.5fr 1fr 100px 120px 80px', gap: '1rem', padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--gray-100)', alignItems: 'center' },
}

export default function MockTopicsPage() {
  const [exam, setExam] = useState('snap')
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', section_name: '' })

  const load = useCallback(() => {
    setLoading(true)
    api.get(`/dashboard/mocks/topics/?exam=${exam}`).then(({ data }) => setTopics(data)).finally(() => setLoading(false))
  }, [exam])
  useEffect(() => { load() }, [load])

  const create = async () => {
    if (!form.name.trim() || !form.section_name.trim()) return
    await api.post('/dashboard/mocks/topics/', { exam_slug: exam, name: form.name, section_name: form.section_name })
    setForm({ name: '', section_name: '' })
    load()
  }

  const del = async (id) => {
    if (!confirm('Delete this topic? Questions tagged with it will keep their other tags but lose this one.')) return
    await api.delete(`/dashboard/mocks/topics/${id}/`)
    load()
  }

  const bySection = topics.reduce((acc, t) => { (acc[t.section_name] ||= []).push(t); return acc }, {})

  return (
    <AdminLayout title="Mock Test Topics">
      <h1 style={s.title}>Mock Test Topics</h1>
      <p style={s.sub}>Topic-wise is its own separate question pool — a topic here has its own questions, authored directly (Paste &amp; Split or single-add), not reused from any Mock/Sectional paper. "Section name" below is just a grouping label to match your real exam sections (e.g. "Quant-DI-DS").</p>

      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {EXAMS.map(e => <button key={e} onClick={() => setExam(e)} style={{ ...s.filterBtn, ...(exam === e ? s.filterActive : {}) }}>{e.toUpperCase()}</button>)}
      </div>

      <SectionBox title="Add Topic">
        <div style={{ padding: '1rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: '0.75rem' }}>
          <input style={s.input} placeholder="Section name (e.g. Quant-DI-DS)" value={form.section_name} onChange={e => setForm(f => ({ ...f, section_name: e.target.value }))} />
          <input style={s.input} placeholder="Topic name (e.g. Number Series)" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <button onClick={create} style={s.btn}>+ Add</button>
        </div>
      </SectionBox>

      {loading ? <p style={{ padding: '2rem', color: 'var(--gray-400)' }}>Loading…</p> : Object.entries(bySection).map(([section, ts]) => (
        <SectionBox key={section} title={`${section} — ${ts.length}`}>
          <div style={s.row}><span style={{ fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--gray-400)' }}>Name</span><span /><span style={{ fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--gray-400)' }}>Questions</span><span /><span /></div>
          {ts.map(t => (
            <div key={t.id} style={s.row}>
              <span style={{ fontFamily: 'var(--font-sans)', fontWeight: '600' }}>{t.name}</span>
              <span />
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.82rem' }}>{t.question_count}</span>
              <Link href={`/admin-panel/mocks/topic/${t.id}`} style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'var(--red)', fontWeight: '700', textDecoration: 'none' }}>Manage Questions →</Link>
              <button onClick={() => del(t.id)} style={{ ...s.filterBtn, color: '#991b1b', borderColor: '#fca5a5' }}>Delete</button>
            </div>
          ))}
        </SectionBox>
      ))}
    </AdminLayout>
  )
}

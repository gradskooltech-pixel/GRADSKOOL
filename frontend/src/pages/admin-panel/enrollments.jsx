/**
 * GRADSKOOL Admin — Enrollments
 * Route: /admin-panel/enrollments
 *
 * View all enrollments, filter by status/exam,
 * manually create enrollment, suspend/reactivate.
 */
import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { SectionBox, DataTable, Badge, fmt } from '../../components/admin/AdminPrimitives'
import api from '../../lib/api'

export default function AdminEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState([])
  const [total, setTotal]             = useState(0)
  const [loading, setLoad]            = useState(true)
  const [search, setSearch]           = useState('')
  const [examFilter, setExamFilter]   = useState('')
  const [statusFilter, setStatus]     = useState('active')
  const [page, setPage]               = useState(1)
  const [showCreate, setShowCreate]   = useState(false)
  const [creating, setCreating]       = useState(false)
  const [msg, setMsg]                 = useState(null)
  const [courses, setCourses]         = useState([])
  const [plans, setPlans]             = useState([])
  const [form, setForm]               = useState({
    email: '', course: '', plan: '', access: 'full', note: '',
  })

  const PER_PAGE = 25

  const load = useCallback(() => {
    setLoad(true)
    const params = new URLSearchParams({
      page, search,
      exam: examFilter,
      status: statusFilter,
      per_page: PER_PAGE,
    })
    api.get(`/dashboard/enrollments/?${params}`)
      .then(({ data }) => { setEnrollments(data.results || []); setTotal(data.count || 0) })
      .catch(() => {})
      .finally(() => setLoad(false))
  }, [page, search, examFilter, statusFilter])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    api.get('/courses/exams/').then(({ data }) => setCourses(data.exams || []))
  }, [])

  useEffect(() => {
    if (!form.course) return
    api.get(`/courses/${form.course}/plans/`)
      .then(({ data }) => setPlans(data.plans || []))
  }, [form.course])

  const handleCreate = async () => {
    if (!form.email || !form.plan) return
    setCreating(true)
    try {
      await api.post('/dashboard/admin-enrol/', {
        email:      form.email,
        plan_slug:  form.plan,
        access:     form.access,
        note:       form.note,
      })
      setMsg({ type: 'success', text: `Enrolled ${form.email} successfully` })
      setShowCreate(false)
      setForm({ email: '', course: '', plan: '', access: 'full', note: '' })
      load()
    } catch (e) {
      setMsg({ type: 'error', text: typeof e.response?.data?.error === 'string' ? e.response.data.error : JSON.stringify(e.response?.data?.error || 'Failed') || 'Failed to create enrollment' })
    } finally {
      setCreating(false)
    }
  }

  const handleStatus = async (id, action) => {
    const label = action === 'suspend' ? 'Suspend' : 'Reactivate'
    if (!confirm(`${label} this enrollment?`)) return
    try {
      await api.post(`/dashboard/enrollments/${id}/${action}/`)
      setMsg({ type: 'success', text: `Enrollment ${action}d` })
      load()
    } catch {
      setMsg({ type: 'error', text: 'Action failed' })
    }
  }

  const COLS = [
    { key: 'student',     label: 'Student',   render: r => (
      <div>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.82rem', fontWeight: '600', color: 'var(--black)', marginBottom: '0.1rem' }}>
          {r.student_name || r.student_email}
        </p>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: 'var(--gray-400)' }}>
          {r.student_email}
        </p>
      </div>
    )},
    { key: 'exam',        label: 'Exam',      render: r => r.exam_slug?.toUpperCase() || '—' },
    { key: 'plan',        label: 'Plan',      render: r => r.plan_name },
    { key: 'status',      label: 'Status',    render: r => (
      <Badge color={r.status === 'active' ? 'green' : r.status === 'suspended' ? 'yellow' : 'red'}>
        {r.status}
      </Badge>
    )},
    { key: 'access',      label: 'Access',    render: r => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
        {r.can_attend_live      && <span style={s.accessTag}>📡 Live</span>}
        {r.can_watch_recordings && <span style={s.accessTag}>🎬 Recordings</span>}
        {r.can_take_mocks       && <span style={s.accessTag}>📝 Mocks</span>}
      </div>
    )},
    { key: 'enrolled_at', label: 'Enrolled',  render: r => r.enrolled_at?.slice(0, 10) || '—' },
    { key: 'actions',     label: '',           render: r => (
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {r.status === 'active'
          ? <button onClick={() => handleStatus(r.id, 'suspend')} style={s.suspendBtn}>Suspend</button>
          : <button onClick={() => handleStatus(r.id, 'reactivate')} style={s.reactivateBtn}>Reactivate</button>
        }
      </div>
    )},
  ]

  return (
    <AdminLayout title="Enrollments">
      <div style={s.header}>
        <div>
          <p style={s.eyebrow}>Management</p>
          <h1 style={s.title}>Enrollments</h1>
        </div>
        <button onClick={() => setShowCreate(true)} style={s.createBtn}>
          + Enrol Student
        </button>
      </div>

      {msg && (
        <div style={{ ...s.msg, background: msg.type === 'success' ? '#f0fdf4' : '#fff5f5',
          border: `1px solid ${msg.type === 'success' ? '#86efac' : '#fca5a5'}`,
          color: msg.type === 'success' ? '#166534' : '#991b1b' }}>
          {msg.text}
          <button onClick={() => setMsg(null)} style={s.msgClose}>✕</button>
        </div>
      )}

      {/* Filters */}
      <div style={s.filters}>
        <input type="text" placeholder="Search by email…"
          value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          style={s.searchInput} />
        <select value={examFilter} onChange={e => { setExamFilter(e.target.value); setPage(1) }} style={s.select}>
          <option value="">All Exams</option>
          {courses.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
        <div style={s.statusBtns}>
          {['active','suspended','refunded','all'].map(st => (
            <button key={st} onClick={() => { setStatus(st); setPage(1) }}
              style={{ ...s.statusBtn, ...(statusFilter === st ? s.statusBtnActive : {}) }}>
              {st.charAt(0).toUpperCase() + st.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <SectionBox>
        <div style={s.tableHeader}>
          <span style={s.tableTotal}>{fmt(total)} enrollments</span>
        </div>
        {loading
          ? <div style={s.loading}>Loading…</div>
          : <DataTable columns={COLS} rows={enrollments} />
        }
        {total > PER_PAGE && (
          <div style={s.pagination}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={s.pageBtn}>← Prev</button>
            <span style={s.pageInfo}>{page} / {Math.ceil(total / PER_PAGE)}</span>
            <button disabled={page >= Math.ceil(total / PER_PAGE)} onClick={() => setPage(p => p + 1)} style={s.pageBtn}>Next →</button>
          </div>
        )}
      </SectionBox>

      {/* Create enrollment modal */}
      {showCreate && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>Enrol a Student</h2>
              <button onClick={() => setShowCreate(false)} style={s.closeBtn}>✕</button>
            </div>

            <div style={s.form}>
              <div style={s.formRow}>
                <label style={s.label}>Student Email *</label>
                <input type="email" placeholder="student@example.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  style={s.input} />
              </div>
              <div style={s.formRow}>
                <label style={s.label}>Exam *</label>
                <select value={form.course}
                  onChange={e => setForm(f => ({ ...f, course: e.target.value, plan: '' }))}
                  style={s.input}>
                  <option value="">Select exam…</option>
                  {courses.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </select>
              </div>
              <div style={s.formRow}>
                <label style={s.label}>Plan *</label>
                <select value={form.plan}
                  onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}
                  style={s.input} disabled={!form.course}>
                  <option value="">Select plan…</option>
                  {plans.map(p => <option key={p.slug} value={p.slug}>{p.name} — ₹{p.price_inr}</option>)}
                </select>
              </div>
              <div style={s.formRow}>
                <label style={s.label}>Access Level</label>
                <div style={s.radioGroup}>
                  {[
                    ['full', 'Full Cohort — Live + Recordings + Mocks + Books'],
                    ['recordings', 'Recordings Only'],
                    ['mocks', 'Mocks Only'],
                  ].map(([val, lbl]) => (
                    <label key={val} style={s.radioLabel}>
                      <input type="radio" name="access"
                        checked={form.access === val}
                        onChange={() => setForm(f => ({ ...f, access: val }))} />
                      {lbl}
                    </label>
                  ))}
                </div>
              </div>
              <div style={s.formRow}>
                <label style={s.label}>Internal Note (optional)</label>
                <input type="text" placeholder="e.g. Manual enrol — scholarship"
                  value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  style={s.input} />
              </div>
              <button onClick={handleCreate}
                disabled={creating || !form.email || !form.plan}
                style={s.submitBtn}>
                {creating ? 'Enrolling…' : 'Create Enrollment →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

const s = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' },
  eyebrow: { fontFamily: 'var(--font-sans)', fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: '0.25rem' },
  title: { fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: '700', color: 'var(--black)' },
  createBtn: { background: 'var(--black)', color: 'var(--white)', border: 'none', padding: '0.7rem 1.25rem', borderRadius: 'var(--radius)', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer' },
  msg: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', marginBottom: '1rem', fontFamily: 'var(--font-sans)', fontSize: '0.875rem' },
  msgClose: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' },
  filters: { display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' },
  searchInput: { flex: 1, minWidth: '200px', padding: '0.6rem 0.875rem', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', outline: 'none' },
  select: { padding: '0.6rem 0.875rem', fontFamily: 'var(--font-sans)', fontSize: '0.82rem', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', background: 'var(--white)', outline: 'none' },
  statusBtns: { display: 'flex', gap: '0.25rem' },
  statusBtn: { padding: '0.5rem 0.75rem', fontFamily: 'var(--font-sans)', fontSize: '0.75rem', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', background: 'var(--white)', cursor: 'pointer' },
  statusBtnActive: { background: 'var(--black)', color: 'var(--white)', borderColor: 'var(--black)' },
  tableHeader: { marginBottom: '0.75rem' },
  tableTotal: { fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: 'var(--gray-400)' },
  loading: { padding: '2rem', textAlign: 'center', fontFamily: 'var(--font-sans)', color: 'var(--gray-400)' },
  accessTag: { fontFamily: 'var(--font-sans)', fontSize: '0.68rem', color: 'var(--gray-500)' },
  suspendBtn: { fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: '#991b1b', background: '#fff5f5', border: '1px solid #fca5a5', padding: '0.2rem 0.5rem', borderRadius: '3px', cursor: 'pointer' },
  reactivateBtn: { fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: '#166534', background: '#f0fdf4', border: '1px solid #86efac', padding: '0.2rem 0.5rem', borderRadius: '3px', cursor: 'pointer' },
  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '1rem 0 0', borderTop: '1px solid var(--gray-100)' },
  pageBtn: { fontFamily: 'var(--font-sans)', fontSize: '0.82rem', padding: '0.4rem 0.875rem', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', background: 'var(--white)', cursor: 'pointer' },
  pageInfo: { fontFamily: 'var(--font-sans)', fontSize: '0.82rem', color: 'var(--gray-400)' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal: { background: 'var(--white)', borderRadius: 'var(--radius-md)', padding: '2rem', width: '480px', maxHeight: '90vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  modalTitle: { fontFamily: 'var(--font-serif)', fontSize: '1.3rem', fontWeight: '700', color: 'var(--black)' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--gray-400)' },
  form: { display: 'flex', flexDirection: 'column', gap: '0.875rem' },
  formRow: {},
  label: { fontFamily: 'var(--font-sans)', fontSize: '0.78rem', fontWeight: '600', color: 'var(--gray-700)', display: 'block', marginBottom: '0.3rem' },
  input: { width: '100%', padding: '0.6rem 0.75rem', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', outline: 'none', boxSizing: 'border-box' },
  radioGroup: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  radioLabel: { fontFamily: 'var(--font-sans)', fontSize: '0.82rem', color: 'var(--gray-700)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' },
  submitBtn: { width: '100%', padding: '0.8rem', background: 'var(--black)', color: 'var(--white)', border: 'none', borderRadius: 'var(--radius)', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer', marginTop: '0.5rem' },
}

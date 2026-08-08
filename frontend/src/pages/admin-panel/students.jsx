/**
 * GRADSKOOL Admin — Students
 * Route: /admin-panel/students
 *
 * List all users, search, filter by enrollment status,
 * view per-student details, manually enrol, suspend.
 */
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { SectionBox, DataTable, Badge, fmt } from '../../components/admin/AdminPrimitives'
import api from '../../lib/api'

export default function AdminStudentsPage() {
  const [students, setStudents]   = useState([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoad]        = useState(true)
  const [search, setSearch]       = useState('')
  const [filter, setFilter]       = useState('all')  // all | enrolled | not_enrolled
  const [page, setPage]           = useState(1)
  const [selected, setSelected]   = useState(null)   // selected student for detail panel
  const [enrolling, setEnrolling] = useState(false)
  const [enrollForm, setEnrollForm] = useState({ course: '', plan: '', access: 'full' })
  const [courses, setCourses]     = useState([])
  const [plans, setPlans]         = useState([])
  const [msg, setMsg]             = useState(null)

  const PER_PAGE = 20

  const load = useCallback(() => {
    setLoad(true)
    const params = new URLSearchParams({ page, search, filter, per_page: PER_PAGE })
    api.get(`/dashboard/students/?${params}`)
      .then(({ data }) => { setStudents(data.results || []); setTotal(data.count || 0) })
      .catch(() => {})
      .finally(() => setLoad(false))
  }, [page, search, filter])

  useEffect(() => { load() }, [load])

  // Load courses for enrol form
  useEffect(() => {
    api.get('/dashboard/exams/').then(({ data }) => setCourses(Array.isArray(data) ? data : []))
  }, [])

  // Load plans when course selected
  useEffect(() => {
    if (!enrollForm.course) return
    api.get('/dashboard/plans/')
      .then(({ data }) => setPlans(Array.isArray(data) ? data : []))
  }, [enrollForm.course])

  const handleEnrol = async () => {
    if (!selected || !enrollForm.course || !enrollForm.plan) return
    setEnrolling(true)
    try {
      await api.post('/dashboard/manual-enroll/', {
        email:   selected.email,
        plan_id: enrollForm.plan,
        note:    'Enrolled via admin students panel',
      })
      setMsg({ type: 'success', text: `${selected.email} enrolled successfully` })
      load()
      setSelected(null)
    } catch (e) {
      setMsg({ type: 'error', text: typeof e.response?.data?.error === 'string' ? e.response.data.error : (e.response?.data?.detail || e.response?.data?.message || 'Enrolment failed') })
    } finally {
      setEnrolling(false)
    }
  }

  const handleSuspend = async (enrollmentId) => {
    if (!confirm('Suspend this enrollment?')) return
    await api.patch(`/dashboard/enrollments/${enrollmentId}/suspend/`)
    setMsg({ type: 'success', text: 'Enrollment suspended' })
    load()
  }

  const COLS = [
    { key: 'name',        label: 'Name',     render: r => `${r.first_name} ${r.last_name}`.trim() || '—' },
    { key: 'email',       label: 'Email' },
    { key: 'target_exam', label: 'Target',   render: r => r.target_exam?.toUpperCase() || '—' },
    { key: 'enrolled',    label: 'Enrolled', render: r => r.active_enrollments > 0
        ? <Badge color="green">{r.active_enrollments} active</Badge>
        : <Badge color="gray">None</Badge>
    },
    { key: 'joined',      label: 'Joined',   render: r => r.date_joined?.slice(0, 10) || '—' },
    { key: 'action',      label: '',         render: r => (
      <button onClick={() => setSelected(r)} style={s.viewBtn}>Manage →</button>
    )},
  ]

  return (
    <AdminLayout title="Students">
      <div style={s.header}>
        <div>
          <p style={s.eyebrow}>Management</p>
          <h1 style={s.title}>Students</h1>
        </div>
        <div style={s.headerRight}>
          <span style={s.total}>{fmt(total)} total</span>
        </div>
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
        <input
          type="text" placeholder="Search by name or email…"
          value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          style={s.searchInput}
        />
        <div style={s.filterBtns}>
          {['all', 'enrolled', 'not_enrolled'].map(f => (
            <button key={f} onClick={() => { setFilter(f); setPage(1) }}
              style={{ ...s.filterBtn, ...(filter === f ? s.filterBtnActive : {}) }}>
              {f === 'all' ? 'All' : f === 'enrolled' ? 'Enrolled' : 'Not Enrolled'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <SectionBox>
        {loading ? (
          <div style={s.loading}>Loading…</div>
        ) : students.length === 0 ? (
          <div style={s.empty}>No students found</div>
        ) : (
          <DataTable columns={COLS} rows={students} />
        )}
        {/* Pagination */}
        {total > PER_PAGE && (
          <div style={s.pagination}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={s.pageBtn}>← Prev</button>
            <span style={s.pageInfo}>{page} / {Math.ceil(total / PER_PAGE)}</span>
            <button disabled={page >= Math.ceil(total / PER_PAGE)} onClick={() => setPage(p => p + 1)} style={s.pageBtn}>Next →</button>
          </div>
        )}
      </SectionBox>

      {/* Student detail / enrol panel */}
      {selected && (
        <div style={s.overlay}>
          <div style={s.panel}>
            <div style={s.panelHeader}>
              <div>
                <h2 style={s.panelName}>{selected.first_name} {selected.last_name}</h2>
                <p style={s.panelEmail}>{selected.email}</p>
              </div>
              <button onClick={() => setSelected(null)} style={s.closeBtn}>✕</button>
            </div>

            <div style={s.panelMeta}>
              <div style={s.metaItem}><span style={s.metaLabel}>Target Exam</span><span style={s.metaVal}>{selected.target_exam?.toUpperCase() || '—'}</span></div>
              <div style={s.metaItem}><span style={s.metaLabel}>Joined</span><span style={s.metaVal}>{selected.date_joined?.slice(0, 10)}</span></div>
              <div style={s.metaItem}><span style={s.metaLabel}>Verified</span><span style={s.metaVal}>{selected.is_email_verified ? '✓ Yes' : '✗ No'}</span></div>
              <div style={s.metaItem}><span style={s.metaLabel}>Active Enrollments</span><span style={s.metaVal}>{selected.active_enrollments}</span></div>
            </div>

            {/* Enrol form */}
            <div style={s.enrolSection}>
              <p style={s.enrolTitle}>Enrol in a Course</p>

              <div style={s.formRow}>
                <label style={s.label}>Exam</label>
                <select style={s.select}
                  value={enrollForm.course}
                  onChange={e => setEnrollForm(f => ({ ...f, course: e.target.value, plan: '' }))}>
                  <option value="">Select exam…</option>
                  {courses.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </select>
              </div>

              <div style={s.formRow}>
                <label style={s.label}>Plan</label>
                <select style={s.select}
                  value={enrollForm.plan}
                  onChange={e => setEnrollForm(f => ({ ...f, plan: e.target.value }))}
                  disabled={!enrollForm.course}>
                  <option value="">Select plan…</option>
                  {plans.filter(p => !enrollForm.course || p.exam_slug === enrollForm.course).map(p => <option key={p.id} value={p.id}>{p.exam} — {p.name} (₹{p.price})</option>)}
                </select>
              </div>

              <div style={s.formRow}>
                <label style={s.label}>Access Type</label>
                <div style={s.radioGroup}>
                  {[['full', 'Full Cohort (Live + Recordings + All)'], ['recordings', 'Recordings Only']].map(([val, lbl]) => (
                    <label key={val} style={s.radioLabel}>
                      <input type="radio" name="access"
                        checked={enrollForm.access === val}
                        onChange={() => setEnrollForm(f => ({ ...f, access: val }))} />
                      {lbl}
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleEnrol}
                disabled={enrolling || !enrollForm.course || !enrollForm.plan}
                style={s.enrolBtn}>
                {enrolling ? 'Enrolling…' : 'Enrol Student →'}
              </button>
            </div>

            {/* Existing enrollments */}
            {selected.enrollments?.length > 0 && (
              <div style={s.existingEnrolls}>
                <p style={s.enrolTitle}>Existing Enrollments</p>
                {selected.enrollments.map(e => (
                  <div key={e.id} style={s.enrollRow}>
                    <div>
                      <p style={s.enrollCourse}>{e.exam_name} — {e.plan_name}</p>
                      <p style={s.enrollDate}>Enrolled: {e.enrolled_at}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <Badge color={e.status === 'active' ? 'green' : 'red'}>{e.status}</Badge>
                      {e.status === 'active' && (
                        <button onClick={() => handleSuspend(e.id)} style={s.suspendBtn}>
                          Suspend
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
  headerRight: { display: 'flex', alignItems: 'center', gap: '1rem' },
  total: { fontFamily: 'var(--font-sans)', fontSize: '0.82rem', color: 'var(--gray-400)' },
  msg: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', marginBottom: '1rem', fontFamily: 'var(--font-sans)', fontSize: '0.875rem' },
  msgClose: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' },
  filters: { display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  searchInput: { flex: 1, minWidth: '240px', padding: '0.6rem 0.875rem', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', outline: 'none' },
  filterBtns: { display: 'flex', gap: '0.25rem' },
  filterBtn: { padding: '0.5rem 0.875rem', fontFamily: 'var(--font-sans)', fontSize: '0.78rem', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', background: 'var(--white)', cursor: 'pointer' },
  filterBtnActive: { background: 'var(--black)', color: 'var(--white)', borderColor: 'var(--black)' },
  loading: { padding: '2rem', textAlign: 'center', fontFamily: 'var(--font-sans)', color: 'var(--gray-400)' },
  empty: { padding: '2rem', textAlign: 'center', fontFamily: 'var(--font-sans)', color: 'var(--gray-400)' },
  viewBtn: { fontFamily: 'var(--font-sans)', fontSize: '0.78rem', fontWeight: '600', color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem 0' },
  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '1rem 0 0', borderTop: '1px solid var(--gray-100)' },
  pageBtn: { fontFamily: 'var(--font-sans)', fontSize: '0.82rem', padding: '0.4rem 0.875rem', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', background: 'var(--white)', cursor: 'pointer' },
  pageInfo: { fontFamily: 'var(--font-sans)', fontSize: '0.82rem', color: 'var(--gray-400)' },
  // Panel
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', justifyContent: 'flex-end' },
  panel: { width: '460px', height: '100%', background: 'var(--white)', overflowY: 'auto', padding: '2rem', boxShadow: '-4px 0 20px rgba(0,0,0,0.1)' },
  panelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' },
  panelName: { fontFamily: 'var(--font-serif)', fontSize: '1.3rem', fontWeight: '700', color: 'var(--black)', marginBottom: '0.25rem' },
  panelEmail: { fontFamily: 'var(--font-sans)', fontSize: '0.82rem', color: 'var(--gray-500)' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--gray-400)' },
  panelMeta: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', padding: '1rem', background: 'var(--gray-50)', borderRadius: 'var(--radius)', marginBottom: '1.5rem' },
  metaItem: { display: 'flex', flexDirection: 'column', gap: '0.2rem' },
  metaLabel: { fontFamily: 'var(--font-sans)', fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gray-400)' },
  metaVal: { fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: '600', color: 'var(--black)' },
  enrolSection: { borderTop: '1px solid var(--gray-100)', paddingTop: '1.5rem', marginBottom: '1.5rem' },
  enrolTitle: { fontFamily: 'var(--font-sans)', fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: '1rem' },
  formRow: { marginBottom: '0.875rem' },
  label: { fontFamily: 'var(--font-sans)', fontSize: '0.78rem', fontWeight: '600', color: 'var(--gray-700)', display: 'block', marginBottom: '0.3rem' },
  select: { width: '100%', padding: '0.6rem 0.75rem', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', background: 'var(--white)', outline: 'none' },
  radioGroup: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  radioLabel: { fontFamily: 'var(--font-sans)', fontSize: '0.82rem', color: 'var(--gray-700)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' },
  enrolBtn: { width: '100%', padding: '0.75rem', background: 'var(--black)', color: 'var(--white)', border: 'none', borderRadius: 'var(--radius)', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer', marginTop: '0.5rem' },
  existingEnrolls: { borderTop: '1px solid var(--gray-100)', paddingTop: '1.5rem' },
  enrollRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 0', borderBottom: '1px solid var(--gray-100)' },
  enrollCourse: { fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: '600', color: 'var(--black)', marginBottom: '0.2rem' },
  enrollDate: { fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: 'var(--gray-400)' },
  suspendBtn: { fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: '#991b1b', background: '#fff5f5', border: '1px solid #fca5a5', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius)', cursor: 'pointer' },
}

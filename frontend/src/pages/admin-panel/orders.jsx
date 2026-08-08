/**
 * GRADSKOOL Admin — Orders
 * Route: /admin-panel/orders
 * View all payment orders, filter by status, download CSV.
 */
import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { SectionBox, DataTable, Badge, fmt } from '../../components/admin/AdminPrimitives'
import api from '../../lib/api'

export default function AdminOrdersPage() {
  const [orders, setOrders]   = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoad]    = useState(true)
  const [search, setSearch]   = useState('')
  const [status, setStatus]   = useState('all')
  const [page, setPage]       = useState(1)
  const PER_PAGE = 25

  const load = useCallback(() => {
    setLoad(true)
    const params = new URLSearchParams({ page, search, status, per_page: PER_PAGE })
    api.get(`/dashboard/orders/?${params}`)
      .then(({ data }) => { setOrders(data.results || []); setTotal(data.count || 0) })
      .catch(() => {})
      .finally(() => setLoad(false))
  }, [page, search, status])

  useEffect(() => { load() }, [load])

  const downloadCSV = () => {
    const rows = [
      ['Date', 'Order ID', 'Student', 'Email', 'Exam', 'Plan', 'Amount', 'Status'],
      ...orders.map(o => [
        o.created_at?.slice(0, 10),
        o.razorpay_order_id,
        o.student_name,
        o.student_email,
        o.exam_slug?.toUpperCase(),
        o.plan_name,
        o.amount_inr,
        o.status,
      ]),
    ]
    const csv = rows.map(r => r.map(c => `"${c ?? ''}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'orders.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const totalRevenue = orders.reduce((s, o) => s + (o.status === 'paid' ? Number(o.amount_inr) : 0), 0)

  const COLS = [
    { key: 'date',     label: 'Date',     render: r => r.created_at?.slice(0, 10) },
    { key: 'student',  label: 'Student',  render: r => (
      <div>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.82rem', fontWeight: '600' }}>{r.student_name || '—'}</p>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: 'var(--gray-400)' }}>{r.student_email}</p>
      </div>
    )},
    { key: 'exam',     label: 'Exam',     render: r => r.exam_slug?.toUpperCase() || '—' },
    { key: 'plan',     label: 'Plan',     render: r => r.plan_name || '—' },
    { key: 'amount',   label: 'Amount',   align: 'right', render: r => `₹${Number(r.amount_inr || 0).toLocaleString('en-IN')}` },
    { key: 'status',   label: 'Status',   render: r => (
      <Badge color={r.status === 'paid' ? 'green' : r.status === 'failed' ? 'red' : 'yellow'}>
        {r.status}
      </Badge>
    )},
    { key: 'razorpay', label: 'Razorpay ID', render: r => (
      <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--gray-400)' }}>
        {r.razorpay_order_id?.slice(-10) || '—'}
      </span>
    )},
  ]

  return (
    <AdminLayout title="Orders">
      <div style={s.header}>
        <div>
          <p style={s.eyebrow}>Payments</p>
          <h1 style={s.title}>Orders</h1>
        </div>
        <button onClick={downloadCSV} style={s.csvBtn}>↓ Export CSV</button>
      </div>

      {/* Summary cards */}
      <div style={s.cards}>
        <div style={s.card}>
          <p style={s.cardVal}>₹{totalRevenue.toLocaleString('en-IN')}</p>
          <p style={s.cardLabel}>Showing page total</p>
        </div>
        <div style={s.card}>
          <p style={s.cardVal}>{fmt(total)}</p>
          <p style={s.cardLabel}>Total orders</p>
        </div>
        <div style={s.card}>
          <p style={s.cardVal}>{orders.filter(o => o.status === 'paid').length}</p>
          <p style={s.cardLabel}>Paid on this page</p>
        </div>
      </div>

      {/* Filters */}
      <div style={s.filters}>
        <input type="text" placeholder="Search by email or order ID…"
          value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          style={s.searchInput} />
        <div style={s.statusBtns}>
          {['all', 'paid', 'created', 'failed', 'refunded'].map(st => (
            <button key={st} onClick={() => { setStatus(st); setPage(1) }}
              style={{ ...s.statusBtn, ...(status === st ? s.statusBtnActive : {}) }}>
              {st.charAt(0).toUpperCase() + st.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <SectionBox>
        {loading
          ? <div style={s.loading}>Loading…</div>
          : <DataTable columns={COLS} rows={orders} />
        }
        {total > PER_PAGE && (
          <div style={s.pagination}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={s.pageBtn}>← Prev</button>
            <span style={s.pageInfo}>{page} / {Math.ceil(total / PER_PAGE)}</span>
            <button disabled={page >= Math.ceil(total / PER_PAGE)} onClick={() => setPage(p => p + 1)} style={s.pageBtn}>Next →</button>
          </div>
        )}
      </SectionBox>
    </AdminLayout>
  )
}

const s = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' },
  eyebrow: { fontFamily: 'var(--font-sans)', fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: '0.25rem' },
  title: { fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: '700', color: 'var(--black)' },
  csvBtn: { background: 'var(--white)', border: '1px solid var(--gray-200)', padding: '0.6rem 1.25rem', borderRadius: 'var(--radius)', fontFamily: 'var(--font-sans)', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer' },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1.5rem' },
  card: { background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', padding: '1.25rem 1.5rem' },
  cardVal: { fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: '700', color: 'var(--black)', marginBottom: '0.2rem' },
  cardLabel: { fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: 'var(--gray-400)' },
  filters: { display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' },
  searchInput: { flex: 1, minWidth: '220px', padding: '0.6rem 0.875rem', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', outline: 'none' },
  statusBtns: { display: 'flex', gap: '0.25rem' },
  statusBtn: { padding: '0.5rem 0.75rem', fontFamily: 'var(--font-sans)', fontSize: '0.75rem', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', background: 'var(--white)', cursor: 'pointer' },
  statusBtnActive: { background: 'var(--black)', color: 'var(--white)', borderColor: 'var(--black)' },
  loading: { padding: '2rem', textAlign: 'center', fontFamily: 'var(--font-sans)', color: 'var(--gray-400)' },
  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '1rem 0 0', borderTop: '1px solid var(--gray-100)' },
  pageBtn: { fontFamily: 'var(--font-sans)', fontSize: '0.82rem', padding: '0.4rem 0.875rem', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', background: 'var(--white)', cursor: 'pointer' },
  pageInfo: { fontFamily: 'var(--font-sans)', fontSize: '0.82rem', color: 'var(--gray-400)' },
}

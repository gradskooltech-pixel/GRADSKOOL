/**
 * GRADSKOOL — Admin: PDF Library
 * Route: /admin-panel/pdfs
 *
 * List + publish/unpublish + delete. New PDFs are created from
 * /admin-panel/pdfs/new (the upload flow), then show up here.
 */
import { useState, useEffect } from 'react'
import Link from 'next/link'
import api from '../../lib/api'
import { AdminLayout } from '../../components/admin/AdminLayout'

const C = {
  red: '#d94f50', black: '#0f0f0f', white: '#fff', bg: '#f7f6f3',
  border: '#e8e8e6', gray: '#999', green: '#22c55e', amber: '#f59e0b',
}

const STATUS_COLOR = { draft: C.gray, processing: C.amber, ready: C.green, failed: C.red }

function CardLabelCell({ pdf, onSave }) {
  const [value, setValue] = useState(pdf.card_label || '')
  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => onSave(pdf, value)}
      onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur() }}
      placeholder="PDF"
      maxLength={30}
      style={{ width: 110, fontFamily: 'var(--font-sans)', fontSize: 12, padding: '4px 8px', border: `1px solid ${C.border}`, borderRadius: 3, color: C.black }}
    />
  )
}

export default function AdminPdfsPage() {
  const [pdfs, setPdfs] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    // Was api.get('/pdfs/admin/pdfs/') with no page_size — the real
    // backend paginates at 20/page (shared.pagination.StandardPagination),
    // and this only ever read the first page's results, never fetching
    // more. With 34 real rows now (1 real PDF + 33 upcoming placeholders,
    // see seed_upcoming_quant_pdfs), anything past the first 20 by
    // sort_order/-created_at silently never showed here — which is
    // exactly what happened to the original Percentages PDF, the oldest
    // row, once 33 newer ones pushed it past page 1. page_size=100 (the
    // real max_page_size on the backend) covers this comfortably for the
    // foreseeable future without needing real multi-page fetching logic.
    api.get('/pdfs/admin/pdfs/?page_size=100')
      .then(({ data }) => setPdfs(data.results || data || []))
      .catch(() => setPdfs([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const togglePublish = async (pdf) => {
    try {
      await api.patch(`/pdfs/admin/pdfs/${pdf.id}/`, { is_published: !pdf.is_published })
      load()
    } catch { /* noop — surface via toast if the project has one */ }
  }

  const saveCardLabel = async (pdf, value) => {
    if (value === (pdf.card_label || '')) return // no change, skip the request
    try {
      await api.patch(`/pdfs/admin/pdfs/${pdf.id}/`, { card_label: value })
      load()
    } catch { /* noop */ }
  }

  const remove = async (pdf) => {
    if (!confirm(`Delete "${pdf.title}"? This removes all uploaded pages too.`)) return
    try {
      await api.delete(`/pdfs/admin/pdfs/${pdf.id}/`)
      load()
    } catch { /* noop */ }
  }

  return (
    <AdminLayout title="PDF Library">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: C.black }}>PDF Library</h1>
        <Link href="/admin-panel/pdfs/new" style={{ background: C.red, color: '#fff', fontFamily: 'var(--font-sans)', fontSize: '0.78rem', fontWeight: 600, padding: '0.5rem 1rem', borderRadius: 4, textDecoration: 'none' }}>
          + Upload New PDF
        </Link>
      </div>

      {loading ? (
        <p style={{ fontFamily: 'var(--font-sans)', color: C.gray }}>Loading…</p>
      ) : pdfs.length === 0 ? (
        <p style={{ fontFamily: 'var(--font-sans)', color: C.gray }}>No PDFs yet — upload your first one.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden' }}>
          <thead>
            <tr style={{ background: C.bg, textAlign: 'left' }}>
              {['Title', 'Exam', 'Card Label', 'Price', 'Pages', 'Status', 'Published', ''].map((h) => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pdfs.map((pdf) => (
              <tr key={pdf.id} style={{ borderTop: `1px solid ${C.border}` }}>
                <td style={td}>{pdf.title}</td>
                <td style={td}>{pdf.exam_slug ? pdf.exam_slug.toUpperCase() : '—'}</td>
                <td style={td}><CardLabelCell pdf={pdf} onSave={saveCardLabel} /></td>
                <td style={td}>{pdf.is_free ? 'Free' : `₹${Number(pdf.price_inr).toLocaleString('en-IN')}`}</td>
                <td style={td}>{pdf.page_count}</td>
                <td style={td}>
                  <span style={{ color: STATUS_COLOR[pdf.status] || C.gray, fontWeight: 600, textTransform: 'capitalize' }}>
                    {pdf.status}
                  </span>
                </td>
                <td style={td}>
                  <button onClick={() => togglePublish(pdf)} disabled={pdf.status !== 'ready'} style={pillBtn(pdf.is_published)}>
                    {pdf.is_published ? 'Live' : 'Hidden'}
                  </button>
                </td>
                <td style={{ ...td, textAlign: 'right' }}>
                  <Link href={`/admin-panel/pdfs/${pdf.slug}/edit`} style={{ ...editLink, marginRight: 12 }}>Edit</Link>
                  <button onClick={() => remove(pdf)} style={dangerBtn}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AdminLayout>
  )
}

const th = { padding: '10px 14px', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: '#666' }
const td = { padding: '10px 14px', fontFamily: 'var(--font-sans)', fontSize: 13, color: '#0f0f0f' }
const dangerBtn = { background: 'none', border: '1px solid #eee', borderRadius: 4, padding: '4px 10px', fontFamily: 'var(--font-sans)', fontSize: 12, color: '#b3261e', cursor: 'pointer' }
const editLink = { display: 'inline-block', border: '1px solid #e8e8e6', borderRadius: 4, padding: '4px 10px', fontFamily: 'var(--font-sans)', fontSize: 12, color: '#0f0f0f', textDecoration: 'none' }
const pillBtn = (active) => ({
  background: active ? 'rgba(34,197,94,0.12)' : 'rgba(0,0,0,0.06)',
  color: active ? '#16a34a' : '#666',
  border: 'none', borderRadius: 20, padding: '4px 12px',
  fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
})
/**
 * GRADSKOOL — Admin: PDF Library
 * Route: /admin-panel/pdfs
 *
 * List + publish/unpublish + delete. New PDFs are created from
 * /admin-panel/pdfs/new (the upload flow), then show up here.
 */
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import api from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'

const C = {
  red: '#d94f50', black: '#0f0f0f', white: '#fff', bg: '#f7f6f3',
  border: '#e8e8e6', gray: '#999', green: '#22c55e', amber: '#f59e0b',
}

const STATUS_COLOR = { draft: C.gray, processing: C.amber, ready: C.green, failed: C.red }

export default function AdminPdfsPage() {
  const router = useRouter()
  const { isAdmin, isLoading: authLoading } = useAuth()
  const [pdfs, setPdfs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !isAdmin) router.replace('/auth/login?redirect=/admin-panel/pdfs')
  }, [authLoading, isAdmin, router])

  const load = () => {
    setLoading(true)
    api.get('/pdfs/admin/pdfs/')
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

  const remove = async (pdf) => {
    if (!confirm(`Delete "${pdf.title}"? This removes all uploaded pages too.`)) return
    try {
      await api.delete(`/pdfs/admin/pdfs/${pdf.id}/`)
      load()
    } catch { /* noop */ }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <Head><title>PDF Library — Admin — GRADSKOOL</title></Head>

      <div style={{ background: C.black, padding: '0 1.5rem', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/admin-panel" style={{ color: '#fff', fontFamily: 'var(--font-sans)', fontSize: '0.8rem', textDecoration: 'none' }}>← Admin</Link>
          <span style={{ fontFamily: 'Georgia,serif', fontSize: '1rem', fontWeight: 700, color: '#fff' }}>PDF Library</span>
        </div>
        <Link href="/admin-panel/pdfs/new" style={{ background: C.red, color: '#fff', fontFamily: 'var(--font-sans)', fontSize: '0.78rem', fontWeight: 600, padding: '0.5rem 1rem', borderRadius: 4, textDecoration: 'none' }}>
          + Upload New PDF
        </Link>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {loading ? (
          <p style={{ fontFamily: 'var(--font-sans)', color: C.gray }}>Loading…</p>
        ) : pdfs.length === 0 ? (
          <p style={{ fontFamily: 'var(--font-sans)', color: C.gray }}>No PDFs yet — upload your first one.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: C.bg, textAlign: 'left' }}>
                {['Title', 'Exam', 'Price', 'Pages', 'Status', 'Published', ''].map((h) => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pdfs.map((pdf) => (
                <tr key={pdf.id} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td style={td}>{pdf.title}</td>
                  <td style={td}>{pdf.exam_slug ? pdf.exam_slug.toUpperCase() : '—'}</td>
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
                    <button onClick={() => remove(pdf)} style={dangerBtn}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

const th = { padding: '10px 14px', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: '#666' }
const td = { padding: '10px 14px', fontFamily: 'var(--font-sans)', fontSize: 13, color: '#0f0f0f' }
const dangerBtn = { background: 'none', border: '1px solid #eee', borderRadius: 4, padding: '4px 10px', fontFamily: 'var(--font-sans)', fontSize: 12, color: '#b3261e', cursor: 'pointer' }
const pillBtn = (active) => ({
  background: active ? 'rgba(34,197,94,0.12)' : 'rgba(0,0,0,0.06)',
  color: active ? '#16a34a' : '#666',
  border: 'none', borderRadius: 20, padding: '4px 12px',
  fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
})

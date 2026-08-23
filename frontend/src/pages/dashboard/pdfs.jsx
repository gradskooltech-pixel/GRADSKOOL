/**
 * GRADSKOOL — My PDFs
 * Route: /dashboard/pdfs
 *
 * The real backend for this (GET /pdfs/my-library/ → MyPdfLibraryView)
 * already existed — genuinely just never had a page built on top of it.
 * Complements the "✓ Owned" badge + sort-to-top + filter toggle added to
 * the per-exam library grids (/pdfs/exam/[examSlug].jsx) — this is the
 * single place across every exam a student's ever bought PDFs from,
 * rather than needing to check each exam's library page separately.
 */
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { ProtectedRoute } from '../../components/auth/ProtectedRoute'
import api from '../../lib/api'

const C = {
  red: '#ff5e5f', black: '#0f0f0f', white: '#fff', bg: '#f7f6f3',
  border: '#e8e8e6', gray: '#999',
}

export default function MyPdfs() { return <ProtectedRoute><Inner /></ProtectedRoute> }

function Inner() {
  const [purchases, setPurchases] = useState([])
  const [loading, setLoad] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/pdfs/my-library/')
      .then(({ data }) => setPurchases(data.results || data || []))
      .catch(() => setError('Could not load your PDFs. Please try again.'))
      .finally(() => setLoad(false))
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <Head><title>My PDFs — GRADSKOOL</title></Head>

      <div style={{ background: C.black, padding: '0 1.5rem', height: 52, display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link href="/dashboard" style={{ color: '#fff', fontFamily: 'var(--font-sans)', fontSize: '0.8rem', textDecoration: 'none' }}>← Dashboard</Link>
        <span style={{ fontFamily: 'Georgia,serif', fontSize: '1rem', fontWeight: 700, color: '#fff' }}>My PDFs</span>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8, height: 140 }} />
            ))}
          </div>
        ) : error ? (
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: '#b3261e' }}>{error}</p>
        ) : purchases.length === 0 ? (
          <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8, padding: '2.5rem', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: C.black, marginBottom: 8 }}>No PDFs yet</p>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13.5, color: C.gray, marginBottom: 20 }}>
              PDFs you buy — individually or in a bundle — will show up here.
            </p>
            <Link href="/pdfs" style={{ color: C.red, fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600 }}>
              Browse the PDF Library →
            </Link>
          </div>
        ) : (
          <>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: C.gray, marginBottom: 20 }}>
              {purchases.length} PDF{purchases.length !== 1 ? 's' : ''} owned
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 }}>
              {purchases.map(p => (
                <Link
                  key={p.id}
                  href={`/pdfs/${p.pdf_slug}/read`}
                  style={{
                    background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden',
                    textDecoration: 'none', display: 'flex', flexDirection: 'column',
                  }}
                >
                  <div
                    style={{
                      aspectRatio: '3/4', background: p.pdf_cover_url ? undefined : '#f0f0ee',
                      backgroundImage: p.pdf_cover_url ? `url(${p.pdf_cover_url})` : undefined,
                      backgroundSize: 'cover', backgroundPosition: 'center',
                    }}
                  />
                  <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: C.black, lineHeight: 1.3, margin: 0 }}>
                      {p.pdf_title}
                    </h3>
                    <span style={{ marginTop: 'auto', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: '#22c55e' }}>
                      Read now →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/**
 * GRADSKOOL — Admin: Edit Existing PDF
 * Route: /admin-panel/pdfs/[slug]/edit
 *
 * The real missing piece this session flagged: /admin-panel/pdfs/new.jsx
 * only ever created BRAND NEW PDFs — there was genuinely no way to add
 * pages to an already-existing row, which matters specifically for
 * "upcoming" placeholders (see seed_upcoming_quant_pdfs) that need real
 * content added later. Reuses new.jsx's exact same pdf.js render-in-
 * browser + per-page upload approach — only the create step is skipped
 * (the Pdf row already exists), everything else is identical.
 *
 * Route is by slug (not id) to match the rest of the admin panel's URL
 * conventions, but the actual admin API works by numeric pk — so this
 * page first resolves slug → id via the public PdfDetailView (which
 * already returns `id`), then uses the admin pk-based endpoints for
 * everything else, same ones new.jsx already uses.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import api from '../../../../lib/api'
import { useAuth } from '../../../../hooks/useAuth'
import { AdminLayout } from '../../../../components/admin/AdminLayout'

const C = { red: '#d94f50', black: '#0f0f0f', bg: '#f7f6f3', border: '#e8e8e6', gray: '#999' }

// Same exact version/reasoning as new.jsx — kept identical on purpose so
// both pages load the same cached script, not two separate CDN fetches.
const PDFJS_VERSION = '3.11.174'
const PDFJS_SCRIPT = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`
const PDFJS_WORKER  = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`

function loadPdfJs() {
  return new Promise((resolve, reject) => {
    if (window.pdfjsLib) { resolve(window.pdfjsLib); return }
    const script = document.createElement('script')
    script.src = PDFJS_SCRIPT
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER
      resolve(window.pdfjsLib)
    }
    script.onerror = () => reject(new Error('pdf.js failed to load'))
    document.body.appendChild(script)
  })
}

function AdminPdfEditPageInner() {
  const router = useRouter()
  const { slug } = router.query
  const { isAdmin, isLoading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading && !isAdmin) router.replace(`/auth/login?redirect=/admin-panel/pdfs/${slug}/edit`)
  }, [authLoading, isAdmin, router, slug])

  const [exams, setExams] = useState([])
  const [pdfId, setPdfId] = useState(null)
  const [form, setForm] = useState(null)   // null while loading — real values fetched, never invented
  const [existingPageCount, setExistingPageCount] = useState(0)
  const [loadError, setLoadError] = useState('')

  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('loading') // loading | form | saving | uploading | done | error
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [error, setError] = useState('')
  const cancelRef = useRef(false)

  useEffect(() => {
    api.get('/courses/exams/').then(({ data }) => {
      const list = Array.isArray(data) ? data
        : Array.isArray(data?.exams) ? data.exams
        : Array.isArray(data?.results) ? data.results
        : []
      setExams(list)
    }).catch(() => setExams([]))
  }, [])

  // Resolve slug -> id via the public detail endpoint (which already
  // returns numeric id), then fetch the REAL admin record for full,
  // accurate fields — never guessing at what's already there.
  useEffect(() => {
    if (!slug) return
    let cancelled = false
    api.get(`/pdfs/${slug}/`)
      .then(({ data }) => {
        if (cancelled) return
        setPdfId(data.id)
        return api.get(`/pdfs/admin/pdfs/${data.id}/`)
      })
      .then((res) => {
        if (cancelled || !res) return
        const d = res.data
        setForm({
          title: d.title || '', description: d.description || '', exam: d.exam || '',
          price_inr: d.price_inr || '', is_free: d.is_free || false,
          cover_image_url: d.cover_image_url || '', card_label: d.card_label || '',
          fyq_category: d.fyq_category || false,
        })
        setExistingPageCount(d.page_count || 0)
        setStatus('form')
      })
      .catch(() => { if (!cancelled) { setLoadError('Could not load this PDF — it may not exist.'); setStatus('error') } })
    return () => { cancelled = true }
  }, [slug])

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const handleFileChange = (e) => setFile(e.target.files?.[0] || null)

  const saveMetadata = useCallback(async () => {
    if (!form.title) { setError('Title is required.'); return false }
    setError('')
    try {
      await api.patch(`/pdfs/admin/pdfs/${pdfId}/`, {
        title: form.title,
        description: form.description,
        exam: form.exam || null,
        price_inr: form.is_free ? 0 : Number(form.price_inr || 0),
        is_free: form.is_free,
        cover_image_url: form.cover_image_url,
        card_label: form.card_label,
        fyq_category: form.fyq_category,
      })
      return true
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to save details.')
      return false
    }
  }, [form, pdfId])

  // Metadata-only save — for when someone just wants to fix a title/price
  // without touching pages at all.
  const handleSaveOnly = async () => {
    setStatus('saving')
    const ok = await saveMetadata()
    setStatus(ok ? 'form' : 'form')
  }

  // Same real render-in-browser + per-page-upload flow as new.jsx, minus
  // the create step — this row already exists.
  const runUpload = useCallback(async () => {
    if (!file) { setError('Choose a PDF file to add pages from.'); return }
    const savedOk = await saveMetadata()
    if (!savedOk) return

    setError('')
    setStatus('uploading')
    cancelRef.current = false

    try {
      const pdfjsLib = await loadPdfJs()
      const arrayBuffer = await file.arrayBuffer()
      const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      const total = doc.numPages
      setProgress({ current: 0, total })

      // New pages continue numbering after whatever already exists,
      // rather than assuming this upload starts at page 1 — genuinely
      // matters if someone's adding pages to a PDF that already has some.
      const startAt = existingPageCount

      for (let i = 1; i <= total; i++) {
        if (cancelRef.current) return

        const page = await doc.getPage(i)
        const viewport = page.getViewport({ scale: 1.8 })
        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext('2d')
        await page.render({ canvasContext: ctx, viewport }).promise

        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.85))
        const fd = new FormData()
        fd.append('page_number', String(startAt + i))
        fd.append('file', blob, `page-${startAt + i}.webp`)

        await api.post(`/pdfs/admin/pdfs/${pdfId}/pages/`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })

        setProgress({ current: i, total })
      }

      // finalize() sets status='ready', page_count, AND clears is_upcoming
      // (fixed in apps.pdfs.admin_views.AdminPdfFinalizeView specifically
      // for this feature — a PDF with real pages should never still show
      // an "Upcoming" badge on the public library page).
      await api.post(`/pdfs/admin/pdfs/${pdfId}/finalize/`, { publish: true })
      setStatus('done')
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Upload failed. Please try again.')
      setStatus('error')
    }
  }, [file, pdfId, existingPageCount, saveMetadata])

  if (status === 'loading' || !form) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: C.gray }}>
          {loadError || 'Loading…'}
        </p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <Head><title>Edit {form.title} — Admin — GRADSKOOL</title></Head>

      <div style={{ background: C.black, padding: '0 1.5rem', height: 52, display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link href="/admin-panel/pdfs" style={{ color: '#fff', fontFamily: 'var(--font-sans)', fontSize: '0.8rem', textDecoration: 'none' }}>← PDF Library</Link>
        <span style={{ fontFamily: 'Georgia,serif', fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Edit PDF</span>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        {status === 'done' ? (
          <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8, padding: '2rem', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 22, marginBottom: 8 }}>Published ✓</p>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: C.gray, marginBottom: 20 }}>
              {progress.total} new page(s) added. This PDF is now live and no longer shows as Upcoming.
            </p>
            <Link href="/admin-panel/pdfs" style={{ color: C.red, fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600 }}>
              Back to PDF Library →
            </Link>
          </div>
        ) : (
          <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {existingPageCount === 0 && (
              <div style={{ background: '#fef9e7', border: '1px solid #f5e6a8', borderRadius: 6, padding: '10px 14px', fontFamily: 'var(--font-sans)', fontSize: 12.5, color: '#7a5c00' }}>
                This PDF has no pages yet — it's an upcoming placeholder. Upload a file below to make it real.
              </div>
            )}
            {existingPageCount > 0 && (
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12.5, color: C.gray }}>
                Currently has {existingPageCount} page(s). Uploading a file below adds MORE pages after these — it does not replace them.
              </div>
            )}

            <Field label="Title">
              <input style={input} value={form.title} onChange={(e) => setField('title', e.target.value)} disabled={status === 'uploading'} />
            </Field>
            <Field label="Description">
              <textarea style={{ ...input, minHeight: 80 }} value={form.description} onChange={(e) => setField('description', e.target.value)} disabled={status === 'uploading'} />
            </Field>
            <Field label="Exam (optional)">
              <select style={input} value={form.exam} onChange={(e) => setField('exam', e.target.value)} disabled={status === 'uploading'}>
                <option value="">— General / not exam-specific —</option>
                {exams.map((ex) => <option key={ex.id} value={ex.id}>{ex.name || ex.slug}</option>)}
              </select>
            </Field>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-sans)', fontSize: 13 }}>
              <input
                type="checkbox"
                checked={form.fyq_category}
                onChange={(e) => setField('fyq_category', e.target.checked)}
                disabled={status === 'uploading' || !form.exam}
              />
              Count under "&lt;Exam&gt; FYQs" in the PDF Library
            </label>
            <Field label="Cover image URL (optional)">
              <input style={input} value={form.cover_image_url} onChange={(e) => setField('cover_image_url', e.target.value)} disabled={status === 'uploading'} />
            </Field>
            <Field label='Card label (optional)'>
              <input style={input} value={form.card_label} onChange={(e) => setField('card_label', e.target.value)} placeholder="PDF" maxLength={30} disabled={status === 'uploading'} />
            </Field>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-sans)', fontSize: 13 }}>
              <input type="checkbox" checked={form.is_free} onChange={(e) => setField('is_free', e.target.checked)} disabled={status === 'uploading'} />
              This PDF is free
            </label>
            {!form.is_free && (
              <Field label="Price (₹)">
                <input style={input} type="number" min="0" value={form.price_inr} onChange={(e) => setField('price_inr', e.target.value)} disabled={status === 'uploading'} />
              </Field>
            )}

            <Field label={existingPageCount > 0 ? 'Add more pages (optional — leave blank to just save details above)' : 'PDF file'}>
              <input type="file" accept="application/pdf" onChange={handleFileChange} disabled={status === 'uploading'} />
            </Field>

            {status === 'uploading' && (
              <div>
                <div style={{ height: 6, background: C.bg, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', background: C.red, borderRadius: 3,
                    width: progress.total ? `${(progress.current / progress.total) * 100}%` : '10%',
                    transition: 'width .2s',
                  }} />
                </div>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: C.gray, marginTop: 6 }}>
                  {progress.total ? `Rendering page ${progress.current} of ${progress.total}…` : 'Preparing…'}
                </p>
              </div>
            )}

            {error && <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#b3261e' }}>{error}</p>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleSaveOnly}
                disabled={status === 'uploading' || status === 'saving'}
                style={{
                  background: '#fff', color: C.black, border: `1px solid ${C.border}`, borderRadius: 6,
                  padding: '0.75rem 1.25rem', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
                  cursor: status === 'uploading' ? 'not-allowed' : 'pointer',
                }}
              >
                {status === 'saving' ? 'Saving…' : 'Save Details Only'}
              </button>
              <button
                onClick={runUpload}
                disabled={status === 'uploading' || !file}
                style={{
                  background: C.red, color: '#fff', border: 'none', borderRadius: 6,
                  padding: '0.75rem 1.5rem', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
                  cursor: (status === 'uploading' || !file) ? 'not-allowed' : 'pointer',
                  opacity: (status === 'uploading' || !file) ? 0.6 : 1,
                }}
              >
                {status === 'uploading' ? 'Uploading…' : 'Save & Upload Pages'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const input = {
  width: '100%', padding: '0.55rem 0.75rem', border: `1px solid ${C.border}`, borderRadius: 6,
  fontFamily: 'var(--font-sans)', fontSize: 14, color: C.black, boxSizing: 'border-box',
}

export default function AdminPdfEditPage(props) {
  return (
    <AdminLayout title="Edit PDF">
      <AdminPdfEditPageInner {...props} />
    </AdminLayout>
  )
}
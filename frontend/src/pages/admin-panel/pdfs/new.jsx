/**
 * GRADSKOOL — Admin: Upload New PDF
 * Route: /admin-panel/pdfs/new
 *
 * The PDF is rendered to page images entirely IN THE ADMIN'S BROWSER via
 * pdf.js (loaded from CDN — same "CDN over npm install" preference as
 * Quill.js elsewhere in this project). Each canvas is exported to webp and
 * uploaded one page at a time. No server-side poppler/ImageMagick needed,
 * so this stays compatible with the Railway deployment as-is.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import api from '../../../lib/api'
import { useAuth } from '../../../hooks/useAuth'

const C = { red: '#d94f50', black: '#0f0f0f', bg: '#f7f6f3', border: '#e8e8e6', gray: '#999' }

// 3.11.174 is deliberate, not outdated carelessness — it's the LAST pdf.js
// version built as a classic script (window.pdfjsLib global via <script>).
// v4.0+ switched entirely to ES modules (.mjs), which this loadPdfJs()
// pattern can't consume. The exact version this replaced (4.0.379) never
// existed on cdnjs at all, which is why it 404'd. Verified this file
// actually exists before using it: cdnjs.com/libraries/pdf.js/3.11.174
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

export default function AdminPdfNewPage() {
  const router = useRouter()
  const { isAdmin, isLoading: authLoading } = useAuth()

  // Reached from a Foundations class panel's "+ Upload Cheat Sheet" button —
  // pre-fills title/exam and auto-links the finished PDF back to that class.
  const { foundation_class: fromClassId, title: suggestedTitle, exam: suggestedExam } = router.query

  useEffect(() => {
    if (!authLoading && !isAdmin) router.replace('/auth/login?redirect=/admin-panel/pdfs/new')
  }, [authLoading, isAdmin, router])

  const [exams, setExams] = useState([])
  const [form, setForm] = useState({
    title: '', description: '', exam: '', price_inr: '', is_free: false, cover_image_url: '',
  })
  const [file, setFile] = useState(null)
  const [pdfId, setPdfId] = useState(null)
  const [status, setStatus] = useState('form') // form | uploading | done | error
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [error, setError] = useState('')
  const cancelRef = useRef(false)

  useEffect(() => {
    api.get('/courses/exams/').then(({ data }) => {
      const list = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : []
      setExams(list)
    }).catch(() => setExams([]))
  }, [])

  // Prefill once query params are actually available (router.query is empty
  // on first render, populates after hydration)
  useEffect(() => {
    if (suggestedTitle) setForm(f => ({ ...f, title: decodeURIComponent(String(suggestedTitle)) }))
  }, [suggestedTitle])
  useEffect(() => {
    if (suggestedExam && exams.length) {
      const match = exams.find(e => e.slug === suggestedExam)
      if (match) setForm(f => ({ ...f, exam: match.id }))
    }
  }, [suggestedExam, exams])

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleFileChange = (e) => setFile(e.target.files?.[0] || null)

  const runUpload = useCallback(async () => {
    if (!form.title || !file) {
      setError('Title and a PDF file are required.')
      return
    }
    setError('')
    setStatus('uploading')
    cancelRef.current = false

    try {
      // 1. Create the Pdf record (draft) — auto-linked to the class if we
      //    arrived here from a Foundations panel's upload button
      const { data: created } = await api.post('/pdfs/admin/pdfs/', {
        title: form.title,
        description: form.description,
        exam: form.exam || null,
        price_inr: form.is_free ? 0 : Number(form.price_inr || 0),
        is_free: form.is_free,
        cover_image_url: form.cover_image_url,
        foundation_class: fromClassId || null,
      })
      setPdfId(created.id)

      // 2. Render every page to an image, in the browser
      const pdfjsLib = await loadPdfJs()
      const arrayBuffer = await file.arrayBuffer()
      const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      const total = doc.numPages
      setProgress({ current: 0, total })

      for (let pageNum = 1; pageNum <= total; pageNum++) {
        if (cancelRef.current) return

        const page = await doc.getPage(pageNum)
        const viewport = page.getViewport({ scale: 1.8 })
        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext('2d')
        await page.render({ canvasContext: ctx, viewport }).promise

        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.85))
        const fd = new FormData()
        fd.append('page_number', String(pageNum))
        fd.append('file', blob, `page-${pageNum}.webp`)

        await api.post(`/pdfs/admin/pdfs/${created.id}/pages/`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })

        setProgress({ current: pageNum, total })
      }

      // 3. Finalize — sets page_count, status=ready, publishes
      await api.post(`/pdfs/admin/pdfs/${created.id}/finalize/`, { publish: true })
      setStatus('done')
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Upload failed. Please try again.')
      setStatus('error')
    }
  }, [form, file, fromClassId])

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <Head><title>Upload PDF — Admin — GRADSKOOL</title></Head>

      <div style={{ background: C.black, padding: '0 1.5rem', height: 52, display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link href="/admin-panel/pdfs" style={{ color: '#fff', fontFamily: 'var(--font-sans)', fontSize: '0.8rem', textDecoration: 'none' }}>← PDF Library</Link>
        <span style={{ fontFamily: 'Georgia,serif', fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Upload New PDF</span>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        {status === 'done' ? (
          <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8, padding: '2rem', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 22, marginBottom: 8 }}>Published ✓</p>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: C.gray, marginBottom: 20 }}>
              {progress.total} pages uploaded and live in the PDF Library.
              {fromClassId && ' Linked to the class you came from — go back and refresh to see it attached.'}
            </p>
            {fromClassId ? (
              <button onClick={() => window.close()} style={{ color: C.red, fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                Close this tab →
              </button>
            ) : (
              <Link href="/admin-panel/pdfs" style={{ color: C.red, fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600 }}>
                Back to PDF Library →
              </Link>
            )}
          </div>
        ) : (
          <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
            <Field label="Cover image URL (optional)">
              <input style={input} value={form.cover_image_url} onChange={(e) => setField('cover_image_url', e.target.value)} disabled={status === 'uploading'} />
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
            <Field label="PDF file">
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

            <button
              onClick={runUpload}
              disabled={status === 'uploading'}
              style={{
                background: C.red, color: '#fff', border: 'none', borderRadius: 6,
                padding: '0.75rem 1.5rem', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
                cursor: status === 'uploading' ? 'not-allowed' : 'pointer', opacity: status === 'uploading' ? 0.7 : 1,
              }}
            >
              {status === 'uploading' ? 'Uploading…' : 'Render, Upload & Publish'}
            </button>
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
/**
 * GRADSKOOL Admin — FYQ (Future Year Questions) CMS
 * Route: /admin-panel/fyq
 *
 * Flat list, not grouped into series like Foundations — there's no live-class
 * structure here, just a large (hundreds of items) evergreen question bank.
 * Search + pagination are load-bearing, not nice-to-haves, given the scale.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Script from 'next/script'
import api from '../../lib/api'

const C = {
  red:'#d94f50', black:'#1a1a18', white:'#fff',
  border:'#e6e5e1', gray:'#7a7974', g100:'#f4f3ef', g200:'#e6e5e1', off:'#fafaf8',
}

function inp(extra={}) {
  return {
    fontFamily:'var(--font-sans)', fontSize:13, padding:'8px 10px',
    border:`1px solid ${C.border}`, borderRadius:2, background:C.white,
    outline:'none', width:'100%', boxSizing:'border-box', color:C.black,
    ...extra,
  }
}

function errorText(err, fallback = 'Something went wrong') {
  if (!err) return fallback
  if (typeof err === 'string') return err
  if (typeof err === 'object') return err.message || err.detail || JSON.stringify(err)
  return fallback
}

function Toast({ msg }) {
  if (!msg) return null
  return (
    <div style={{ position:'fixed', top:68, right:24, zIndex:999, padding:'10px 18px', borderRadius:3,
      fontFamily:'var(--font-sans)', fontSize:13, fontWeight:500,
      background: msg.type === 'error' ? '#fee2e2' : '#dcfce7',
      border: `1px solid ${msg.type === 'error' ? '#fca5a5' : '#86efac'}`,
      color: msg.type === 'error' ? '#991b1b' : '#166534',
      boxShadow:'0 4px 16px rgba(0,0,0,.1)',
    }}>{errorText(msg.text, '')}</div>
  )
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
export default function FYQAdmin() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState({ results:[], count:0, page:1, num_pages:1 })
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState(null)
  const [panel, setPanel] = useState(null) // null | 'new' | { q }
  const [panelKey, setPanelKey] = useState(0)

  const notify = (text, type='success') => { setMsg({ text, type }); setTimeout(() => setMsg(null), 3500) }
  const openPanel = (next) => { setPanelKey(k => k + 1); setPanel(next) }

  useEffect(() => { const t = setTimeout(() => setDebouncedSearch(search), 350); return () => clearTimeout(t) }, [search])
  useEffect(() => { setPage(1) }, [debouncedSearch])

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ exam:'cat', page:String(page), page_size:'50' })
    if (debouncedSearch) params.set('search', debouncedSearch)
    api.get(`/dashboard/fyq/questions/?${params.toString()}`)
      .then(({ data }) => setData(data))
      .catch(() => setData({ results:[], count:0, page:1, num_pages:1 }))
      .finally(() => setLoading(false))
  }, [debouncedSearch, page])

  useEffect(() => { load() }, [load])

  return (
    <div style={{ minHeight:'100vh', background:C.off }}>
      <Head><title>FYQs — Admin — GRADSKOOL</title></Head>
      <Toast msg={msg} />

      <div style={{ height:56, background:C.white, borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 32px', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <Link href="/admin-panel" style={{ fontFamily:'var(--font-sans)', fontSize:13, color:C.gray, textDecoration:'none' }}>← Admin</Link>
          <span style={{ color:C.border }}>|</span>
          <span style={{ fontFamily:'var(--font-sans)', fontSize:14, fontWeight:600, color:C.black }}>FYQs — CAT</span>
          <span style={{ fontFamily:'var(--font-sans)', fontSize:11, color:C.gray, background:C.g100, padding:'2px 8px', borderRadius:2 }}>{data.count} total</span>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <Link href="/admin-panel/fyq-categories" style={{ fontFamily:'var(--font-sans)', fontSize:13, fontWeight:600, padding:'8px 18px', border:`1px solid ${C.border}`, borderRadius:2, background:C.white, color:C.black, textDecoration:'none' }}>
            Manage Categories
          </Link>
          <button onClick={() => openPanel('new')}
            style={{ fontFamily:'var(--font-sans)', fontSize:13, fontWeight:600, padding:'8px 18px', background:C.red, color:C.white, border:'none', borderRadius:2, cursor:'pointer' }}>
            + New Question
          </button>
        </div>
      </div>

      <div style={{ background:C.white, borderBottom:`1px solid ${C.border}`, padding:'14px 32px', display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title, topic, or FYQ number…" style={inp({ maxWidth:340 })} />
      </div>

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'24px' }}>
        {loading ? (
          <p style={{ fontFamily:'var(--font-sans)', color:C.gray, textAlign:'center', padding:'3rem' }}>Loading…</p>
        ) : data.results.length === 0 ? (
          <div style={{ textAlign:'center', padding:'4rem', background:C.white, border:`1px dashed ${C.border}`, borderRadius:4 }}>
            <p style={{ fontFamily:'var(--font-sans)', fontSize:14, color:C.gray, marginBottom:16 }}>No questions match this filter.</p>
            <button onClick={() => openPanel('new')} style={{ fontFamily:'var(--font-sans)', fontSize:13, fontWeight:600, padding:'9px 20px', background:C.red, color:C.white, border:'none', borderRadius:2, cursor:'pointer' }}>
              + Add first question
            </button>
          </div>
        ) : (
          <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:4, overflow:'hidden' }}>
            <div style={{ display:'grid', gridTemplateColumns:'70px 1fr 200px 90px 100px', gap:8, padding:'8px 20px', background:C.g100, fontFamily:'var(--font-sans)', fontSize:10, fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase', color:C.gray }}>
              {['#','Title','Topic','Status','Actions'].map(h => <span key={h}>{h}</span>)}
            </div>
            {data.results.map(q => (
              <div key={q.id} style={{ display:'grid', gridTemplateColumns:'70px 1fr 200px 90px 100px', gap:8, padding:'12px 20px', borderTop:`1px solid ${C.border}`, alignItems:'center' }}>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:16, color:C.gray }}>{String(q.question_number).padStart(3,'0')}</div>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:13, fontWeight:500, color:C.black }}>
                  {q.title}
                  {q.has_video && <span style={{ marginLeft:8, fontSize:11, color:'#ff4444' }}>▶</span>}
                </div>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:12, color:C.gray }}>{q.topic_name || '—'}</div>
                <div>
                  <span style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:2, background: q.is_published ? '#dcfce7' : '#fef3c7', color: q.is_published ? '#166534' : '#92400e' }}>
                    {q.is_published ? 'Live' : 'Hidden'}
                  </span>
                </div>
                <div style={{ display:'flex', gap:4 }}>
                  <button onClick={() => openPanel({ q })} style={{ fontFamily:'var(--font-sans)', fontSize:11, padding:'4px 10px', border:`1px solid ${C.border}`, borderRadius:2, background:C.white, cursor:'pointer' }}>Edit</button>
                  <button onClick={async () => {
                    if (!confirm('Delete this question?')) return
                    try { await api.delete(`/dashboard/fyq/questions/${q.id}/`); notify('Deleted'); load() }
                    catch { notify('Failed to delete', 'error') }
                  }} style={{ fontFamily:'var(--font-sans)', fontSize:11, padding:'4px 8px', border:'1px solid #fca5a5', borderRadius:2, background:C.white, cursor:'pointer', color:C.red }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {data.num_pages > 1 && (
          <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:16, padding:'20px 0' }}>
            <button disabled={!data.has_prev} onClick={() => setPage(p => p - 1)} style={{ fontFamily:'var(--font-sans)', fontSize:13, padding:'8px 16px', border:`1px solid ${C.border}`, borderRadius:2, background:C.white, cursor:'pointer', opacity: data.has_prev ? 1 : .4 }}>← Prev</button>
            <span style={{ fontFamily:'var(--font-sans)', fontSize:12, color:C.gray }}>Page {data.page} of {data.num_pages}</span>
            <button disabled={!data.has_next} onClick={() => setPage(p => p + 1)} style={{ fontFamily:'var(--font-sans)', fontSize:13, padding:'8px 16px', border:`1px solid ${C.border}`, borderRadius:2, background:C.white, cursor:'pointer', opacity: data.has_next ? 1 : .4 }}>Next →</button>
          </div>
        )}
      </div>

      {panel && (
        <SidePanel key={panelKey} panel={panel} onClose={() => setPanel(null)} onSave={() => { setPanel(null); load() }} notify={notify} />
      )}
    </div>
  )
}

/* ── PDF attachment, same pattern as Foundations but targeting fyq_question ── */
/* ── Cascading Section → Category → Topic picker ── */
function TopicPicker({ initialSectionId, initialCategoryId, topicId, onTopicChange }) {
  const [sections, setSections] = useState([])
  const [sectionId, setSectionId] = useState(initialSectionId || '')
  const [categoryId, setCategoryId] = useState(initialCategoryId || '')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/fyq/sections/')
      .then(({ data }) => setSections(data))
      .catch(() => setSections([]))
      .finally(() => setLoading(false))
  }, [])

  const section    = sections.find(s => s.id === Number(sectionId))
  const categories = section?.categories || []
  const category   = categories.find(c => c.id === Number(categoryId))
  const topics     = section?.has_categories ? (category?.topics || []) : (section?.topics || [])

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      <select value={sectionId} disabled={loading} style={inp()}
        onChange={e => { setSectionId(e.target.value); setCategoryId(''); onTopicChange(null) }}>
        <option value="">— Select section —</option>
        {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      {section?.has_categories && (
        <select value={categoryId} style={inp()}
          onChange={e => { setCategoryId(e.target.value); onTopicChange(null) }}>
          <option value="">— Select category —</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      )}
      {section && (!section.has_categories || categoryId) && (
        <select value={topicId || ''} style={inp()} onChange={e => onTopicChange(e.target.value || null)}>
          <option value="">— Select topic —</option>
          {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      )}
      {!loading && sections.length === 0 && (
        <p style={{ fontFamily:'var(--font-sans)', fontSize:11, color:C.gray }}>
          No sections yet — <a href="/admin-panel/fyq-categories" target="_blank" rel="noopener noreferrer" style={{ color:C.red }}>create one first →</a>
        </p>
      )}
    </div>
  )
}

function PdfAttachSection({ questionId, suggestedTitle, suggestedExam, notify }) {
  const [linkedPdfs, setLinkedPdfs] = useState([])
  const [unlinkedPdfs, setUnlinkedPdfs] = useState([])
  const [loading, setLoading] = useState(true)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [linking, setLinking] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get(`/pdfs/admin/pdfs/?fyq_question=${questionId}`),
      api.get('/pdfs/admin/pdfs/?unlinked=1'),
    ]).then(([linkedRes, unlinkedRes]) => {
      setLinkedPdfs(linkedRes.data.results || linkedRes.data || [])
      setUnlinkedPdfs(unlinkedRes.data.results || unlinkedRes.data || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [questionId])

  const linkExisting = async (pdfId) => {
    if (!pdfId) return
    setLinking(true)
    try {
      await api.patch(`/pdfs/admin/pdfs/${pdfId}/`, { fyq_question: questionId })
      notify('PDF linked ✓'); setPickerOpen(false); load()
    } catch { notify('Could not link that PDF', 'error') } finally { setLinking(false) }
  }

  const unlink = async (pdfId) => {
    try { await api.patch(`/pdfs/admin/pdfs/${pdfId}/`, { fyq_question: null }); notify('PDF unlinked'); load() }
    catch { notify('Could not unlink that PDF', 'error') }
  }

  const uploadNewUrl = () => {
    const params = new URLSearchParams({ fyq_question: String(questionId), title: `${suggestedTitle || 'FYQ'} — Solution PDF` })
    if (suggestedExam) params.set('exam', suggestedExam)
    return `/admin-panel/pdfs/new?${params.toString()}`
  }

  return (
    <div>
      <label style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase', color:C.gray, display:'block', marginBottom:6 }}>
        PDF <span style={{ fontWeight:400, textTransform:'none' }}>(optional — same free-claim/paid system as the PDF Library, just attached to this question)</span>
      </label>
      {loading ? <p style={{ fontFamily:'var(--font-sans)', fontSize:12, color:C.gray }}>Loading…</p> : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {linkedPdfs.map(pdf => (
            <div key={pdf.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', border:`1px solid ${C.border}`, borderRadius:3, background:C.off }}>
              <div>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:13, fontWeight:600, color:C.black }}>{pdf.title}</div>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:11, color:C.gray }}>
                  {pdf.is_free ? 'Free — needs login + phone to claim' : `₹${Number(pdf.price_inr).toLocaleString('en-IN')}`} · {pdf.status} · {pdf.is_published ? 'Live' : 'Hidden'}
                </div>
              </div>
              <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                <a href="/admin-panel/pdfs" target="_blank" rel="noopener noreferrer" style={{ fontFamily:'var(--font-sans)', fontSize:11, color:C.gray }}>Manage →</a>
                <button onClick={() => unlink(pdf.id)} style={{ fontFamily:'var(--font-sans)', fontSize:11, color:C.red, background:'none', border:'none', cursor:'pointer' }}>Unlink</button>
              </div>
            </div>
          ))}
          {pickerOpen ? (
            <div style={{ display:'flex', gap:8 }}>
              <select onChange={e => linkExisting(e.target.value)} disabled={linking} style={inp()} defaultValue="">
                <option value="" disabled>Pick an existing unlinked PDF…</option>
                {unlinkedPdfs.map(pdf => <option key={pdf.id} value={pdf.id}>{pdf.title}</option>)}
              </select>
              <button onClick={() => setPickerOpen(false)} style={{ fontFamily:'var(--font-sans)', fontSize:11, padding:'0 10px', border:`1px solid ${C.border}`, borderRadius:2, background:C.white, cursor:'pointer', color:C.gray }}>✕</button>
            </div>
          ) : (
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <a href={uploadNewUrl()} target="_blank" rel="noopener noreferrer"
                style={{ fontFamily:'var(--font-sans)', fontSize:12, fontWeight:600, padding:'8px 14px', background:C.red, color:C.white, borderRadius:2, textDecoration:'none' }}>
                + Upload New PDF
              </a>
              {unlinkedPdfs.length > 0 && (
                <button onClick={() => setPickerOpen(true)} style={{ fontFamily:'var(--font-sans)', fontSize:12, padding:'8px 14px', border:`1px solid ${C.border}`, borderRadius:2, background:C.white, cursor:'pointer', color:C.black }}>
                  Link Existing PDF
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Side panel for create/edit ── */
function SidePanel({ panel, onClose, onSave, notify }) {
  const isNew = panel === 'new'
  const q = isNew ? null : panel.q

  const longDescContainerRef = useRef(null)
  const notesContainerRef = useRef(null)
  const longDescQuillRef = useRef(null)
  const notesQuillRef = useRef(null)

  const [form, setForm] = useState(() => ({
    question_number:   q?.question_number ?? '',
    exams:              ['cat'], // CAT-only feature, not editable
    title:              q?.title || '',
    slug:               q?.slug || '',
    meta_description:   q?.meta_description || '',
    topic_id:           q?.topic_id || null,
    _initial_section_id:  q?.section_id || null,
    _initial_category_id: q?.category_id || null,
    youtube_url:        q?.youtube_url || '',
    long_description:   q?.long_description || '',
    notes:              q?.notes || '',
    is_published:       q?.is_published ?? true,
  }))
  const [saving, setSaving] = useState(false)
  // The list view (which populates panel.q) omits long_description/notes/
  // pdfs for performance — fetch the full record here so editing an
  // existing FYQ doesn't show these as empty and risk overwriting them.
  const [fullyLoaded, setFullyLoaded] = useState(isNew)
  useEffect(() => {
    if (isNew || !q?.id) return
    let cancelled = false
    api.get(`/dashboard/fyq/questions/${q.id}/`).then(({ data }) => {
      if (cancelled) return
      setForm(f => ({ ...f, long_description: data.long_description || '', notes: data.notes || '' }))
      setFullyLoaded(true)
    }).catch(() => { notify('Could not load full question content', 'error'); setFullyLoaded(true) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q?.id])

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  // Long description Quill — full toolbar for real blog-like content.
  const [longDescStatus, setLongDescStatus] = useState('loading') // loading | ready | error
  useEffect(() => {
    if (typeof window === 'undefined') return
    let cancelled = false
    let attempts = 0
    const init = () => {
      if (cancelled) return
      attempts++
      if (!window.Quill) {
        if (attempts > 75) { setLongDescStatus('error'); return } // ~6s of retrying
        setTimeout(init, 80); return
      }
      const el = longDescContainerRef.current
      if (!el) { setTimeout(init, 80); return }
      if (cancelled) return
      try {
        el.innerHTML = ''
        const editor = new window.Quill(el, {
          theme: 'snow',
          modules: { toolbar: [
            [{ header:[2,3,false] }], ['bold','italic','underline','strike'],
            [{ script:'sub' }, { script:'super' }], ['blockquote','code-block'],
            [{ list:'ordered' }, { list:'bullet' }], ['link','image'], ['clean'],
          ] },
          placeholder: 'The question and full explanation, written up like a blog post — real content search engines and AI answer engines will read.',
        })
        if (form.long_description) editor.root.innerHTML = form.long_description
        editor.on('text-change', () => {
          const html = editor.root.innerHTML
          setForm(f => ({ ...f, long_description: html === '<p><br></p>' ? '' : html }))
        })
        longDescQuillRef.current = editor
        setLongDescStatus('ready')
      } catch (err) {
        console.error('Long description Quill failed to initialize:', err)
        setLongDescStatus('error')
      }
    }
    init()
    return () => { cancelled = true; longDescQuillRef.current = null }
  }, [])

  // Notes Quill — simpler toolbar, optional supplementary content.
  const [notesStatus, setNotesStatus] = useState('loading')
  useEffect(() => {
    if (typeof window === 'undefined') return
    let cancelled = false
    let attempts = 0
    const init = () => {
      if (cancelled) return
      attempts++
      if (!window.Quill) {
        if (attempts > 75) { setNotesStatus('error'); return }
        setTimeout(init, 80); return
      }
      const el = notesContainerRef.current
      if (!el) { setTimeout(init, 80); return }
      if (cancelled) return
      try {
        el.innerHTML = ''
        const editor = new window.Quill(el, {
          theme: 'snow',
          modules: { toolbar: [[{ header:[2,3,false] }],['bold','italic'],['blockquote','code-block'],[{ list:'bullet' }],['link','image'],['clean']] },
          placeholder: 'Optional extra notes, formulas, images…',
        })
        if (form.notes) editor.root.innerHTML = form.notes
        editor.on('text-change', () => {
          const html = editor.root.innerHTML
          setForm(f => ({ ...f, notes: html === '<p><br></p>' ? '' : html }))
        })
        notesQuillRef.current = editor
        setNotesStatus('ready')
      } catch (err) {
        console.error('Notes Quill failed to initialize:', err)
        setNotesStatus('error')
      }
    }
    init()
    return () => { cancelled = true; notesQuillRef.current = null }
  }, [])

  // Once the full record has loaded AND each editor is ready, push the
  // real content in — handles either completing first, since Quill init
  // (via polling for window.Quill) and this fetch are independent async
  // operations with no guaranteed order.
  useEffect(() => {
    if (fullyLoaded && longDescStatus === 'ready' && longDescQuillRef.current) {
      longDescQuillRef.current.root.innerHTML = form.long_description || ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullyLoaded, longDescStatus])

  useEffect(() => {
    if (fullyLoaded && notesStatus === 'ready' && notesQuillRef.current) {
      notesQuillRef.current.root.innerHTML = form.notes || ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullyLoaded, notesStatus])

  const save = async () => {
    setSaving(true)
    try {
      const { _initial_section_id, _initial_category_id, ...rest } = form
      const payload = { ...rest, question_number: Number(form.question_number) }
      if (isNew) {
        await api.post('/dashboard/fyq/questions/', payload)
        notify('Question added ✓')
      } else {
        await api.patch(`/dashboard/fyq/questions/${q.id}/`, payload)
        notify('Question updated ✓')
      }
      onSave()
    } catch (e) {
      notify(errorText(e.response?.data?.error, 'Save failed'), 'error')
    } finally { setSaving(false) }
  }

  return (
    <>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/quill/1.3.7/quill.snow.min.css" />
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/quill/1.3.7/quill.min.js" strategy="afterInteractive" />

      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.3)', zIndex:200 }} />

      <div style={{ position:'fixed', top:0, right:0, bottom:0, width:680, background:C.white, boxShadow:'-4px 0 32px rgba(0,0,0,.12)', zIndex:201, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ padding:'16px 24px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <span style={{ fontFamily:'var(--font-sans)', fontSize:15, fontWeight:600, color:C.black }}>{isNew ? 'New Question' : 'Edit Question'}</span>
          <button onClick={onClose} style={{ fontFamily:'var(--font-sans)', fontSize:18, color:C.gray, background:'none', border:'none', cursor:'pointer', lineHeight:1, padding:4 }}>✕</button>
        </div>

        <div style={{ flex:1, overflow:'auto', padding:'20px 24px' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

            <div style={{ display:'grid', gridTemplateColumns:'100px 1fr', gap:12 }}>
              <div>
                <label style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase', color:C.gray, display:'block', marginBottom:6 }}>FYQ #</label>
                <input type="number" value={form.question_number} onChange={set('question_number')} min={1} style={inp()} />
              </div>
              <div>
                <label style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase', color:C.gray, display:'block', marginBottom:6 }}>Title</label>
                <input value={form.title} onChange={set('title')} placeholder="e.g. Averages &amp; Mixtures — Future Year Question 070" style={inp()} />
              </div>
            </div>

            <div>
              <label style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase', color:C.gray, display:'block', marginBottom:6 }}>
                URL Slug <span style={{ fontWeight:400, textTransform:'none' }}>(optional — auto-generated from title if left blank; keep it short and readable for Google)</span>
              </label>
              <input value={form.slug || ''} onChange={set('slug')} placeholder="fyq-070-averages-mixtures" style={inp()} />
            </div>

            <div>
              <label style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase', color:C.gray, display:'block', marginBottom:6 }}>Topic <span style={{ fontWeight:400, textTransform:'none' }}>(where this shows up in Section → Category → Topic browsing)</span></label>
              <TopicPicker
                initialSectionId={form._initial_section_id}
                initialCategoryId={form._initial_category_id}
                topicId={form.topic_id}
                onTopicChange={id => setForm(f => ({ ...f, topic_id: id }))}
              />
            </div>

            <div>
              <label style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase', color:C.gray, display:'block', marginBottom:6 }}>YouTube Solution Video URL</label>
              <input value={form.youtube_url} onChange={set('youtube_url')} placeholder="https://youtu.be/... or youtube.com/watch?v=..." style={inp()} />
            </div>

            <div>
              <label style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase', color:C.gray, display:'block', marginBottom:6 }}>
                SEO Meta Description <span style={{ fontWeight:400, textTransform:'none' }}>(shown in Google search results — falls back to the long description if left blank)</span>
              </label>
              <textarea value={form.meta_description || ''} onChange={set('meta_description')} maxLength={300} rows={2}
                placeholder="One or two sentences summarizing this question for search results — aim for under 155 characters."
                style={{ ...inp(), resize:'vertical', fontFamily:'var(--font-body)' }} />
              <div style={{ fontFamily:'var(--font-sans)', fontSize:11, color:C.gray, marginTop:4, textAlign:'right' }}>{(form.meta_description || '').length}/300</div>
            </div>

            <div>
              <label style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase', color:C.gray, display:'block', marginBottom:6 }}>
                Long Description <span style={{ fontWeight:400, textTransform:'none' }}>(the question + full explanation, blog-like — SEO/AEO content)</span>
              </label>
              <style>{`
                #fyq-long-desc-editor .ql-toolbar.ql-snow { border:1px solid ${C.border}; border-bottom:none; border-radius:3px 3px 0 0; font-family:'DM Sans',system-ui,sans-serif; }
                #fyq-long-desc-editor .ql-container.ql-snow { border:1px solid ${C.border}; border-radius:0 0 3px 3px; font-family:'Source Serif 4',Georgia,serif; font-size:14px; }
                #fyq-long-desc-editor .ql-editor { min-height:220px; padding:14px 16px; line-height:1.8; color:${C.black}; }
                #fyq-long-desc-editor .ql-editor a { color:${C.red}; }
                #fyq-long-desc-editor .ql-editor img { max-width:100%; border-radius:3px; margin:10px 0; }
              `}</style>
              <div id="fyq-long-desc-editor" ref={longDescContainerRef} />
              {longDescStatus === 'loading' && (
                <p style={{ fontFamily:'var(--font-sans)', fontSize:12, color:C.gray, marginTop:6 }}>Loading editor…</p>
              )}
              {longDescStatus === 'error' && (
                <p style={{ fontFamily:'var(--font-sans)', fontSize:12, color:C.red, marginTop:6 }}>
                  Editor failed to load — open the browser console (right-click → Inspect → Console) for the actual error, or try refreshing.
                </p>
              )}
            </div>

            <div>
              <label style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase', color:C.gray, display:'block', marginBottom:6 }}>
                Notes <span style={{ fontWeight:400, textTransform:'none' }}>(optional extra content)</span>
              </label>
              <style>{`
                #fyq-notes-editor .ql-toolbar.ql-snow { border:1px solid ${C.border}; border-bottom:none; border-radius:3px 3px 0 0; font-family:'DM Sans',system-ui,sans-serif; }
                #fyq-notes-editor .ql-container.ql-snow { border:1px solid ${C.border}; border-radius:0 0 3px 3px; font-family:'Source Serif 4',Georgia,serif; font-size:14px; }
                #fyq-notes-editor .ql-editor { min-height:140px; padding:14px 16px; line-height:1.8; color:${C.black}; }
                #fyq-notes-editor .ql-editor a { color:${C.red}; }
                #fyq-notes-editor .ql-editor img { max-width:100%; border-radius:3px; margin:10px 0; }
              `}</style>
              <div id="fyq-notes-editor" ref={notesContainerRef} />
              {notesStatus === 'loading' && (
                <p style={{ fontFamily:'var(--font-sans)', fontSize:12, color:C.gray, marginTop:6 }}>Loading editor…</p>
              )}
              {notesStatus === 'error' && (
                <p style={{ fontFamily:'var(--font-sans)', fontSize:12, color:C.red, marginTop:6 }}>
                  Editor failed to load — open the browser console (right-click → Inspect → Console) for the actual error, or try refreshing.
                </p>
              )}
            </div>

            {!isNew ? (
              <PdfAttachSection questionId={q.id} suggestedTitle={form.title} suggestedExam={form.exams[0]} notify={notify} />
            ) : (
              <p style={{ fontFamily:'var(--font-sans)', fontSize:12, color:C.gray, fontStyle:'italic' }}>
                Save this question first — you'll be able to attach a PDF right here once it exists.
              </p>
            )}

            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontFamily:'var(--font-sans)', fontSize:13 }}>
              <input type="checkbox" checked={!!form.is_published} onChange={set('is_published')} />
              Published (visible to students)
            </label>
          </div>
        </div>

        <div style={{ padding:'16px 24px', borderTop:`1px solid ${C.border}`, display:'flex', justifyContent:'flex-end', gap:8, flexShrink:0 }}>
          <button onClick={onClose} style={{ fontFamily:'var(--font-sans)', fontSize:13, padding:'9px 18px', border:`1px solid ${C.border}`, borderRadius:2, background:C.white, cursor:'pointer', color:C.black }}>Cancel</button>
          <button onClick={save} disabled={saving || !fullyLoaded} style={{ fontFamily:'var(--font-sans)', fontSize:13, fontWeight:600, padding:'9px 22px', background:(saving || !fullyLoaded)?C.gray:C.red, color:C.white, border:'none', borderRadius:2, cursor:(saving || !fullyLoaded)?'not-allowed':'pointer' }}>
            {saving ? 'Saving…' : !fullyLoaded ? 'Loading…' : 'Save'}
          </button>
        </div>
      </div>
    </>
  )
}
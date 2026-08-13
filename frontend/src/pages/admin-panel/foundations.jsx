/**
 * GRADSKOOL Admin — Foundations CMS
 * Route: /admin-panel/foundations
 *
 * Manage free foundation class series and individual classes.
 * Series: named groups (e.g. "XAT Decision Making Series")
 * Classes: individual sessions with date/time, topic, YouTube link after recording
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Script from 'next/script'
import api from '../../lib/api'
import { AdminLayout } from '../../components/admin/AdminLayout'

const C = {
  red:'#d94f50', black:'#1a1a18', white:'#fff',
  border:'#e6e5e1', gray:'#7a7974', g100:'#f4f3ef', g200:'#e6e5e1', off:'#fafaf8',
}

const EXAM_OPTS = [
  { value:'xat',  label:'XAT' },
  { value:'nmat', label:'NMAT' },
  { value:'snap', label:'SNAP' },
  { value:'cat',  label:'CAT' },
  { value:'gmat', label:'GMAT' },
]

const EXAM_COLOR = { xat:'#5b3fa0', nmat:'#1a6e3c', snap:'#1a5c8a', cat:'#d94f50', gmat:'#b45309' }

const CONTENT_TYPE_OPTS = [
  { value:'foundations',     label:'Foundations — starter content' },
  { value:'complete_course', label:'Complete Course, Free' },
]

function inp(extra={}) {
  return {
    fontFamily:'var(--font-sans)', fontSize:13, padding:'8px 10px',
    border:`1px solid ${C.border}`, borderRadius:2, background:C.white,
    outline:'none', width:'100%', boxSizing:'border-box', color:C.black,
    ...extra,
  }
}

// Django/DRF errors show up in a few different shapes depending on what
// went wrong — a plain string, {message}, {detail}, or {code, message} for
// some raw exceptions. This normalizes all of them to a safe string so we
// never accidentally hand React an object to render as text again.
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

function ytThumb(url) {
  if (!url) return null
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/)
  return m ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : null
}

function formatDT(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })
}

function isUpcoming(iso) {
  return iso ? new Date(iso) > new Date() : false
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
export default function FoundationsAdmin() {
  const [examFilter, setExamFilter] = useState('xat')
  const [series,     setSeries]     = useState([])
  const [loading,    setLoading]    = useState(true)
  const [msg,        setMsg]        = useState(null)

  // Which panel is open: null | 'new-series' | 'new-class' | { series } | { class }
  const [panel, setPanel] = useState(null)
  // Bumped every time a panel is freshly opened, and used as SidePanel's
  // React key below. Forces a genuine unmount+remount each time — even
  // across in-place panel transitions (like new-class auto-switching to
  // edit-class after save) that wouldn't otherwise unmount the component.
  // Guarantees every mount starts from a truly clean slate: fresh DOM,
  // fresh effects, fresh Quill instances — no leftover state to duplicate.
  const [panelKey, setPanelKey] = useState(0)
  const openPanel = (next) => { setPanelKey(k => k + 1); setPanel(next) }

  const notify = (text, type='success') => {
    setMsg({ text, type })
    setTimeout(() => setMsg(null), 3500)
  }

  const load = useCallback(() => {
    setLoading(true)
    const url = `/dashboard/foundations/series/?exam=${examFilter}`
    console.log('[FOUNDATIONS ADMIN DEBUG] Requesting:', url)
    api.get(url)
      .then(({ data }) => { console.log('[FOUNDATIONS ADMIN DEBUG] Success:', data); setSeries(data) })
      .catch((err) => {
        console.error('[FOUNDATIONS ADMIN DEBUG] Failed:', err.response?.status, err.response?.data || err.message)
        setSeries([])
      })
      .finally(() => setLoading(false))
  }, [examFilter])

  useEffect(() => { load() }, [load])

  return (
    <AdminLayout title="Foundations">
    <div style={{ minHeight:'100vh', background:C.off }}>
      <Head><title>Foundations — Admin — GRADSKOOL</title></Head>
      <Toast msg={msg} />

      {/* ── top bar ── */}
      <div style={{ height:56, background:C.white, borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 32px', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <Link href="/admin-panel" style={{ fontFamily:'var(--font-sans)', fontSize:13, color:C.gray, textDecoration:'none' }}>← Admin</Link>
          <span style={{ color:C.border }}>|</span>
          <span style={{ fontFamily:'var(--font-sans)', fontSize:14, fontWeight:600, color:C.black }}>Foundations</span>
          <span style={{ fontFamily:'var(--font-sans)', fontSize:11, color:C.gray, background:C.g100, padding:'2px 8px', borderRadius:2 }}>Free classes</span>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <Link href="/admin-panel/foundation-sections"
            style={{ fontFamily:'var(--font-sans)', fontSize:13, fontWeight:600, padding:'8px 18px', background:C.white, color:C.black, border:`1px solid ${C.border}`, borderRadius:2, textDecoration:'none' }}>
            Manage Sections
          </Link>
          <button onClick={() => openPanel('new-series')}
            style={{ fontFamily:'var(--font-sans)', fontSize:13, fontWeight:600, padding:'8px 18px', background:C.red, color:C.white, border:'none', borderRadius:2, cursor:'pointer' }}>
            + New Series
          </button>
        </div>
      </div>


      {/* ── exam filter tabs ── */}
      <div style={{ background:C.white, borderBottom:`1px solid ${C.border}`, display:'flex', gap:0 }}>
        {EXAM_OPTS.map(e => (
          <button key={e.value} onClick={() => setExamFilter(e.value)}
            style={{ fontFamily:'var(--font-sans)', fontSize:13, fontWeight:500, padding:'12px 24px', border:'none', borderBottom:`2px solid ${examFilter===e.value ? EXAM_COLOR[e.value] : 'transparent'}`, background:'none', color: examFilter===e.value ? C.black : C.gray, cursor:'pointer' }}>
            {e.label}
          </button>
        ))}
      </div>

      {/* ── content ── */}
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'32px 24px' }}>
        {loading ? (
          <p style={{ fontFamily:'var(--font-sans)', color:C.gray, textAlign:'center', padding:'3rem' }}>Loading…</p>
        ) : series.length === 0 ? (
          <div style={{ textAlign:'center', padding:'5rem', background:C.white, border:`1px dashed ${C.border}`, borderRadius:4 }}>
            <p style={{ fontFamily:'var(--font-sans)', fontSize:15, color:C.gray, marginBottom:20 }}>No series yet for {examFilter.toUpperCase()}.</p>
            <button onClick={() => openPanel('new-series')}
              style={{ fontFamily:'var(--font-sans)', fontSize:13, fontWeight:600, padding:'10px 24px', background:C.red, color:C.white, border:'none', borderRadius:2, cursor:'pointer' }}>
              Create first series →
            </button>
          </div>
        ) : (
          series.map(s => (
            <SeriesBlock key={s.id} series={s} examColor={EXAM_COLOR[examFilter]}
              onAddClass={() => openPanel({ type:'new-class', series: s })}
              onEditSeries={() => openPanel({ type:'edit-series', series: s })}
              onEditClass={cls => openPanel({ type:'edit-class', cls, series: s })}
              onDelete={async (type, id) => {
                if (!confirm('Delete?')) return
                try {
                  if (type === 'series') await api.delete(`/dashboard/foundations/series/${id}/`)
                  else await api.delete(`/dashboard/foundations/classes/${id}/`)
                  notify('Deleted')
                  load()
                } catch { notify('Failed to delete','error') }
              }}
              notify={notify}
              reload={load}
            />
          ))
        )}
      </div>

      {/* ── sliding panel ── */}
      {panel && (
        <SidePanel
          key={panelKey}
          panel={panel}
          examFilter={examFilter}
          onClose={() => setPanel(null)}
          onSave={(createdCls) => {
            if (createdCls) {
              // Just created a class — switch to edit mode instead of closing,
              // so the cheat-sheet/PDF section becomes usable right away.
              // Bumping the key here is the actual fix for the duplicate-
              // toolbar bug: this transition never passes through panel=null,
              // so without a key change React reuses the same SidePanel
              // instance instead of remounting it.
              setPanelKey(k => k + 1)
              setPanel(p => ({ type: 'edit-class', cls: createdCls, series: p.series }))
            } else {
              setPanel(null)
            }
            load()
          }}
          notify={notify}
        />
      )}
    </div>
  </AdminLayout>
  )
}

/* ── Series block with its classes ── */
function SeriesBlock({ series, examColor, onAddClass, onEditSeries, onEditClass, onDelete, notify, reload }) {
  const [open, setOpen] = useState(true)

  return (
    <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:4, marginBottom:16, overflow:'hidden' }}>
      {/* series header */}
      <div style={{ padding:'14px 20px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:12, background:C.g100 }}>
        <div style={{ width:8, height:8, borderRadius:'50%', background:examColor, flexShrink:0 }} />
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <div style={{ fontFamily:'var(--font-sans)', fontSize:14, fontWeight:600, color:C.black }}>{series.title}</div>
            {(series.content_types || []).map(ct => (
              <span key={ct} style={{
                fontFamily:'var(--font-sans)', fontSize:9, fontWeight:700, letterSpacing:'.05em', textTransform:'uppercase',
                padding:'2px 7px', borderRadius:2,
                background: ct === 'complete_course' ? '#dcfce7' : '#f3f0ff',
                color:      ct === 'complete_course' ? '#166534' : '#5b3fa0',
              }}>
                {ct === 'complete_course' ? 'Complete Course' : 'Foundations'}
              </span>
            ))}
          </div>
          <div style={{ fontFamily:'var(--font-sans)', fontSize:11, color:C.gray, marginTop:1 }}>
            {series.class_count} classes · {series.is_active ? 'Active' : 'Hidden'}
            {(series.exams || []).length > 0 && <> · {(series.exams || []).map(e => e.toUpperCase()).join(', ')}</>}
          </div>
        </div>
        <button onClick={onEditSeries} style={{ fontFamily:'var(--font-sans)', fontSize:11, padding:'5px 12px', border:`1px solid ${C.border}`, borderRadius:2, background:C.white, cursor:'pointer', color:C.gray }}>Edit series</button>
        <button onClick={() => onDelete('series', series.id)} style={{ fontFamily:'var(--font-sans)', fontSize:11, padding:'5px 10px', border:'1px solid #fca5a5', borderRadius:2, background:C.white, cursor:'pointer', color:C.red }}>✕</button>
        <button onClick={() => setOpen(!open)} style={{ fontFamily:'var(--font-sans)', fontSize:11, color:C.gray, background:'none', border:'none', cursor:'pointer' }}>{open ? '▲' : '▼'}</button>
      </div>

      {open && (
        <>
          {/* classes table */}
          {(series.classes || []).length > 0 && (
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'44px 1fr 180px 100px 80px 100px', gap:8, padding:'8px 20px', background:C.off, fontFamily:'var(--font-sans)', fontSize:10, fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase', color:C.gray }}>
                {['#','Topic','Date & Time','Duration','Status','Actions'].map(h => <span key={h}>{h}</span>)}
              </div>
              {(series.classes || []).map(cls => {
                const upcoming = isUpcoming(cls.scheduled_at)
                const hasRec   = !!cls.youtube_url
                return (
                  <div key={cls.id} style={{ display:'grid', gridTemplateColumns:'44px 1fr 180px 100px 80px 100px', gap:8, padding:'12px 20px', borderTop:`1px solid ${C.border}`, alignItems:'center' }}>
                    <div style={{ fontFamily:'var(--font-serif)', fontSize:18, color:C.gray, lineHeight:1 }}>L{cls.lesson_number}</div>
                    <div>
                      <div style={{ fontFamily:'var(--font-sans)', fontSize:13, fontWeight:500, color:C.black }}>{cls.title}</div>
                      <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:2 }}>
                        {cls.section_name && (
                          <span style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:600, color:C.gray, background:C.g100, padding:'1px 7px', borderRadius:2 }}>{cls.section_name}</span>
                        )}
                        {cls.youtube_url && (
                          <a href={cls.youtube_url} target="_blank" rel="noopener noreferrer" style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'#ff4444' }}>▶ Recording</a>
                        )}
                      </div>
                    </div>
                    <div style={{ fontFamily:'var(--font-sans)', fontSize:12, color:C.gray }}>{formatDT(cls.scheduled_at)}</div>
                    <div style={{ fontFamily:'var(--font-sans)', fontSize:12, color:C.gray }}>{cls.duration_mins} min</div>
                    <div>
                      <span style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:2,
                        background: hasRec ? '#dcfce7' : upcoming ? '#eff6ff' : '#fef3c7',
                        color:      hasRec ? '#166534' : upcoming ? '#1d4ed8' : '#92400e' }}>
                        {hasRec ? 'Recording' : upcoming ? 'Upcoming' : 'Past'}
                      </span>
                    </div>
                    <div style={{ display:'flex', gap:4 }}>
                      <button onClick={() => onEditClass(cls)} style={{ fontFamily:'var(--font-sans)', fontSize:11, padding:'4px 10px', border:`1px solid ${C.border}`, borderRadius:2, background:C.white, cursor:'pointer' }}>Edit</button>
                      <button onClick={() => onDelete('class', cls.id)} style={{ fontFamily:'var(--font-sans)', fontSize:11, padding:'4px 8px', border:'1px solid #fca5a5', borderRadius:2, background:C.white, cursor:'pointer', color:C.red }}>✕</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* add class button */}
          <div style={{ padding:'12px 20px', borderTop:`1px solid ${C.border}` }}>
            <button onClick={onAddClass}
              style={{ fontFamily:'var(--font-sans)', fontSize:12, fontWeight:600, padding:'7px 16px', border:`1px solid ${C.border}`, borderRadius:2, background:C.white, cursor:'pointer', color:C.black }}>
              + Add class to this series
            </button>
          </div>
        </>
      )}
    </div>
  )
}

/* ── Side panel for create/edit ── */
/* ── Cheat Sheet / PDF attachment — uses the same free-claim/paid PDF
   Library system, just scoped to one class ── */
function PdfAttachSection({ classId, suggestedTitle, suggestedExam, notify }) {
  const [linkedPdfs, setLinkedPdfs] = useState([])
  const [unlinkedPdfs, setUnlinkedPdfs] = useState([])
  const [loading, setLoading] = useState(true)
  const [linking, setLinking] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get(`/pdfs/admin/pdfs/?foundation_class=${classId}`),
      api.get('/pdfs/admin/pdfs/?unlinked=1'),
    ]).then(([linkedRes, unlinkedRes]) => {
      setLinkedPdfs(linkedRes.data.results || linkedRes.data || [])
      setUnlinkedPdfs(unlinkedRes.data.results || unlinkedRes.data || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [classId])

  const linkExisting = async (pdfId) => {
    if (!pdfId) return
    setLinking(true)
    try {
      await api.patch(`/pdfs/admin/pdfs/${pdfId}/`, { foundation_class: classId })
      notify('PDF linked ✓')
      setPickerOpen(false)
      load()
    } catch {
      notify('Could not link that PDF', 'error')
    } finally {
      setLinking(false)
    }
  }

  const unlink = async (pdfId) => {
    try {
      await api.patch(`/pdfs/admin/pdfs/${pdfId}/`, { foundation_class: null })
      notify('PDF unlinked')
      load()
    } catch {
      notify('Could not unlink that PDF', 'error')
    }
  }

  const uploadNewUrl = () => {
    const params = new URLSearchParams({
      foundation_class: String(classId),
      title: `${suggestedTitle || 'Class'} — Cheat Sheet`,
    })
    if (suggestedExam) params.set('exam', suggestedExam)
    return `/admin-panel/pdfs/new?${params.toString()}`
  }

  return (
    <div>
      <label style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase', color:C.gray, display:'block', marginBottom:6 }}>
        Cheat Sheet / PDF <span style={{ fontWeight:400, textTransform:'none' }}>(optional — same free-claim/paid system as the PDF Library, just attached to this class)</span>
      </label>

      {loading ? (
        <p style={{ fontFamily:'var(--font-sans)', fontSize:12, color:C.gray }}>Loading…</p>
      ) : (
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
                + Upload New Cheat Sheet
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

function SidePanel({ panel, examFilter, onClose, onSave, notify }) {
  const isNewSeries  = panel === 'new-series'
  const isEditSeries = panel?.type === 'edit-series'
  const isNewClass   = panel?.type === 'new-class'
  const isEditClass  = panel?.type === 'edit-class'
  const quillRef = useRef(null)
  const seriesQuillRef = useRef(null)
  const longDescQuillRef = useRef(null)
  const notesContainerRef = useRef(null)
  const seriesNotesContainerRef = useRef(null)
  const longDescContainerRef = useRef(null)

  const [form, setForm] = useState(() => {
    if (isEditSeries) return {
      exams: panel.series.exams || [], title: panel.series.title,
      description: panel.series.description, content_types: panel.series.content_types || [],
      notes: panel.series.notes || '',
      is_active: panel.series.is_active, order: panel.series.order,
    }
    if (isNewClass || isEditClass) {
      const cls = panel.cls || {}
      // Format datetime for input
      const dt = cls.scheduled_at ? new Date(cls.scheduled_at) : new Date(Date.now() + 86400000)
      const pad = n => String(n).padStart(2,'0')
      const localDT = `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`
      return {
        series_id:     panel.series?.id || cls.series_id || '',
        section_id:    cls.section_id || '',
        lesson_number: cls.lesson_number || ((panel.series?.classes?.length || 0) + 1),
        title:         cls.title || '',
        slug:          cls.slug || '',
        description:   cls.description || '',
        meta_description: cls.meta_description || '',
        long_description: cls.long_description || '',
        exams:         cls.exams_raw || [], // raw override only — empty means "inherits the series"
        scheduled_at:  localDT,
        duration_mins: cls.duration_mins || 60,
        youtube_url:   cls.youtube_url || '',
        notes:         cls.notes || '',
        is_published:  cls.is_published ?? true,
      }
    }
    return { exams: [examFilter], title: '', description: '', content_types: [], notes: '', is_active: true, order: 0 }
  })

  const [saving, setSaving] = useState(false)
  const thumb = ytThumb(form.youtube_url)

  const [sections, setSections] = useState([])
  useEffect(() => {
    if (!isNewClass && !isEditClass) return
    api.get(`/dashboard/foundations/sections/?exam=${examFilter}`)
      .then(({ data }) => setSections(data))
      .catch(() => setSections([]))
  }, [isNewClass, isEditClass, examFilter])

  // Quill for notes
  useEffect(() => {
    if (!isNewClass && !isEditClass) return
    if (typeof window === 'undefined') return
    let cancelled = false
    const init = () => {
      if (cancelled) return
      if (!window.Quill) { setTimeout(init, 80); return }
      const el = notesContainerRef.current
      if (!el) { setTimeout(init, 80); return }
      if (cancelled) return
      // React Strict Mode runs this effect twice in dev — clear whatever
      // Quill left behind from a prior mount so we always start from a
      // genuinely empty container, instead of Quill silently failing to
      // attach to a container it partially already initialized.
      el.innerHTML = ''
      const q = new window.Quill(el, {
        theme: 'snow',
        modules: { toolbar: [[{ header:[2,3,false] }],['bold','italic'],['blockquote','code-block'],[{ list:'bullet' }],['link','image'],['clean']] },
        placeholder: 'Add notes, formulas, images for this class…',
      })
      if (form.notes) q.root.innerHTML = form.notes
      q.on('text-change', () => {
        const html = q.root.innerHTML
        setForm(f => ({ ...f, notes: html === '<p><br></p>' ? '' : html }))
      })
      quillRef.current = q
    }
    init()
    return () => { cancelled = true; quillRef.current = null }
  }, [])

  // Quill for long description — fuller toolbar than Notes, since this is
  // meant for real prose about exam content: bold/italic/underline/strike,
  // superscript/subscript for formulas and exponents, ordered + bullet
  // lists, headers for structure.
  useEffect(() => {
    if (!isNewClass && !isEditClass) return
    if (typeof window === 'undefined') return
    let cancelled = false
    const init = () => {
      if (cancelled) return
      if (!window.Quill) { setTimeout(init, 80); return }
      const el = longDescContainerRef.current
      if (!el) { setTimeout(init, 80); return }
      if (cancelled) return
      el.innerHTML = ''
      const q = new window.Quill(el, {
        theme: 'snow',
        modules: { toolbar: [
          [{ header:[2,3,false] }],
          ['bold','italic','underline','strike'],
          [{ script:'sub' }, { script:'super' }],
          ['blockquote','code-block'],
          [{ list:'ordered' }, { list:'bullet' }],
          ['link','image'],
          ['clean'],
        ] },
        placeholder: 'What does this video actually teach? Write a few real paragraphs — this is what search engines and AI answer engines will read.',
      })
      if (form.long_description) q.root.innerHTML = form.long_description
      q.on('text-change', () => {
        const html = q.root.innerHTML
        setForm(f => ({ ...f, long_description: html === '<p><br></p>' ? '' : html }))
      })
      longDescQuillRef.current = q
    }
    init()
    return () => { cancelled = true; longDescQuillRef.current = null }
  }, [])

  // Quill for series-level notes — the "write once, covers the whole series" doc
  useEffect(() => {
    if (!isNewSeries && !isEditSeries) return
    if (typeof window === 'undefined') return
    let cancelled = false
    const init = () => {
      if (cancelled) return
      if (!window.Quill) { setTimeout(init, 80); return }
      const el = seriesNotesContainerRef.current
      if (!el) { setTimeout(init, 80); return }
      if (cancelled) return
      el.innerHTML = ''
      const q = new window.Quill(el, {
        theme: 'snow',
        modules: { toolbar: [[{ header:[2,3,false] }],['bold','italic'],['blockquote','code-block'],[{ list:'bullet' }],['link','image'],['clean']] },
        placeholder: 'One comprehensive doc covering everything in this series — formulas, images, links. Shows at the top of the series page, above the class list.',
      })
      if (form.notes) q.root.innerHTML = form.notes
      q.on('text-change', () => {
        const html = q.root.innerHTML
        setForm(f => ({ ...f, notes: html === '<p><br></p>' ? '' : html }))
      })
      seriesQuillRef.current = q
    }
    init()
    return () => { cancelled = true; seriesQuillRef.current = null }
  }, [])

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const save = async () => {
    setSaving(true)
    try {
      if (isNewSeries) {
        await api.post('/dashboard/foundations/series/', form)
        notify('Series created ✓')
        onSave()
      } else if (isEditSeries) {
        await api.patch(`/dashboard/foundations/series/${panel.series.id}/`, form)
        notify('Series updated ✓')
        onSave()
      } else if (isNewClass) {
        const { data: created } = await api.post('/dashboard/foundations/classes/', form)
        notify('Class added ✓ — you can attach a cheat sheet below now')
        onSave(created)  // parent switches the panel into edit mode with this class
      } else if (isEditClass) {
        await api.patch(`/dashboard/foundations/classes/${panel.cls.id}/`, form)
        notify('Class updated ✓')
        onSave()
      }
    } catch (e) {
      notify(errorText(e.response?.data?.error, 'Save failed'), 'error')
    } finally { setSaving(false) }
  }

  const title = isNewSeries ? 'New Series' : isEditSeries ? 'Edit Series' : isNewClass ? 'Add Class' : 'Edit Class'

  return (
    <>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/quill/1.3.7/quill.snow.min.css" />
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/quill/1.3.7/quill.min.js" strategy="afterInteractive" />

      {/* backdrop */}
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.3)', zIndex:200 }} />

      {/* panel */}
      <div style={{ position:'fixed', top:0, right:0, bottom:0, width: (isNewClass||isEditClass||isNewSeries||isEditSeries) ? 680 : 440, background:C.white, boxShadow:'-4px 0 32px rgba(0,0,0,.12)', zIndex:201, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* header */}
        <div style={{ padding:'16px 24px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <span style={{ fontFamily:'var(--font-sans)', fontSize:15, fontWeight:600, color:C.black }}>{title}</span>
          <button onClick={onClose} style={{ fontFamily:'var(--font-sans)', fontSize:18, color:C.gray, background:'none', border:'none', cursor:'pointer', lineHeight:1, padding:4 }}>✕</button>
        </div>

        {/* body */}
        <div style={{ flex:1, overflow:'auto', padding:'20px 24px' }}>

          {/* ─ SERIES FORM ─ */}
          {(isNewSeries || isEditSeries) && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <label style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase', color:C.gray }}>
                Exams <span style={{ fontWeight:400, textTransform:'none' }}>(check every exam this series applies to — content that overlaps, like Quant basics for XAT/SNAP/NMAT, only needs to be entered once)</span>
              </label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:10, padding:'10px 12px', border:`1px solid ${C.border}`, borderRadius:2, background:C.white }}>
                {EXAM_OPTS.map(e => (
                  <label key={e.value} style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontFamily:'var(--font-sans)', fontSize:13 }}>
                    <input
                      type="checkbox"
                      checked={form.exams.includes(e.value)}
                      onChange={ev => {
                        setForm(f => ({
                          ...f,
                          exams: ev.target.checked
                            ? [...f.exams, e.value]
                            : f.exams.filter(x => x !== e.value),
                        }))
                      }}
                    />
                    {e.label}
                  </label>
                ))}
              </div>
              {form.exams.length === 0 && (
                <p style={{ fontFamily:'var(--font-sans)', fontSize:11, color:C.red, marginTop:-6 }}>Pick at least one exam — this series won't show up anywhere until you do.</p>
              )}

              <label style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase', color:C.gray }}>
                Content Type <span style={{ fontWeight:400, textTransform:'none' }}>(pick one or both — the same video can genuinely be a starter for one exam and part of the complete course for another. For your own reference only; doesn't change what shows publicly.)</span>
              </label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:10, padding:'10px 12px', border:`1px solid ${C.border}`, borderRadius:2, background:C.white }}>
                {CONTENT_TYPE_OPTS.map(ct => (
                  <label key={ct.value} style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontFamily:'var(--font-sans)', fontSize:13 }}>
                    <input
                      type="checkbox"
                      checked={form.content_types.includes(ct.value)}
                      onChange={ev => {
                        setForm(f => ({
                          ...f,
                          content_types: ev.target.checked
                            ? [...f.content_types, ct.value]
                            : f.content_types.filter(x => x !== ct.value),
                        }))
                      }}
                    />
                    {ct.label}
                  </label>
                ))}
              </div>

              <label style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase', color:C.gray }}>Series Title</label>
              <input value={form.title} onChange={set('title')} placeholder="e.g. XAT Decision Making Series" style={inp()} />

              <label style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase', color:C.gray }}>Description <span style={{ fontWeight:400, textTransform:'none' }}>(optional)</span></label>
              <textarea value={form.description} onChange={set('description')} rows={3} placeholder="What this series covers…" style={{ ...inp(), resize:'vertical' }} />

              <div>
                <label style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase', color:C.gray, display:'block', marginBottom:6 }}>
                  Series Notes <span style={{ fontWeight:400, textTransform:'none' }}>(rich text — one doc covering everything in this series, shown at the top of the public page)</span>
                </label>
                <style>{`
                  #foundations-series-notes-editor .ql-toolbar.ql-snow { border:1px solid ${C.border}; border-bottom:none; border-radius:3px 3px 0 0; font-family:'DM Sans',system-ui,sans-serif; }
                  #foundations-series-notes-editor .ql-container.ql-snow { border:1px solid ${C.border}; border-radius:0 0 3px 3px; font-family:'Source Serif 4',Georgia,serif; font-size:14px; }
                  #foundations-series-notes-editor .ql-editor { min-height:220px; padding:14px 16px; line-height:1.8; color:${C.black}; }
                  #foundations-series-notes-editor .ql-editor a { color:${C.red}; }
                  #foundations-series-notes-editor .ql-editor img { max-width:100%; border-radius:3px; margin:10px 0; }
                `}</style>
                <div id="foundations-series-notes-editor" ref={seriesNotesContainerRef} />
              </div>

              <label style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase', color:C.gray }}>Display Order</label>
              <input type="number" value={form.order} onChange={set('order')} min={0} style={inp({ width:80 })} />

              <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontFamily:'var(--font-sans)', fontSize:13 }}>
                <input type="checkbox" checked={!!form.is_active} onChange={set('is_active')} />
                Active (visible on the Foundations page)
              </label>
            </div>
          )}

          {/* ─ CLASS FORM ─ */}
          {(isNewClass || isEditClass) && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ display:'grid', gridTemplateColumns:'80px 1fr', gap:12 }}>
                <div>
                  <label style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase', color:C.gray, display:'block', marginBottom:6 }}># Lesson</label>
                  <input type="number" value={form.lesson_number} onChange={set('lesson_number')} min={1} style={inp()} />
                </div>
                <div>
                  <label style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase', color:C.gray, display:'block', marginBottom:6 }}>Topic Title</label>
                  <input value={form.title} onChange={set('title')} placeholder="e.g. Analytical Reasoning — Intro" style={inp()} />
                </div>
              </div>

              <div>
                <label style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase', color:C.gray, display:'block', marginBottom:6 }}>
                  URL Slug <span style={{ fontWeight:400, textTransform:'none' }}>(optional — auto-generated from title if left blank; keep it short and readable for Google)</span>
                </label>
                <input value={form.slug || ''} onChange={set('slug')} placeholder="xat-1-analytical-reasoning-intro" style={inp()} />
              </div>

              <div>
                <label style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase', color:C.gray, display:'block', marginBottom:6 }}>
                  Section <span style={{ fontWeight:400, textTransform:'none' }}>(optional — topic tag so students can browse "every class about X")</span>
                </label>
                <select value={form.section_id || ''} onChange={set('section_id')} style={inp()}>
                  <option value="">No section</option>
                  {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                {sections.length === 0 && (
                  <p style={{ fontFamily:'var(--font-sans)', fontSize:11, color:C.gray, marginTop:5 }}>
                    No sections yet for {examFilter.toUpperCase()} — close this panel and use "Manage Sections" to create one.
                  </p>
                )}
              </div>

              <div>
                <label style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase', color:C.gray, display:'block', marginBottom:6 }}>Short Description</label>
                <textarea value={form.description} onChange={set('description')} rows={2} placeholder="What will be covered in this class…" style={{ ...inp(), resize:'vertical' }} />
              </div>

              <div>
                <label style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase', color:C.gray, display:'block', marginBottom:6 }}>
                  SEO Meta Description <span style={{ fontWeight:400, textTransform:'none' }}>(shown in Google search results — falls back to the short description if left blank)</span>
                </label>
                <textarea value={form.meta_description || ''} onChange={set('meta_description')} maxLength={300} rows={2}
                  placeholder="One or two sentences summarizing this class for search results — aim for under 155 characters."
                  style={{ ...inp(), resize:'vertical' }} />
                <div style={{ fontFamily:'var(--font-sans)', fontSize:11, color:C.gray, marginTop:4, textAlign:'right' }}>{(form.meta_description || '').length}/300</div>
              </div>

              <div>
                <label style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase', color:C.gray, display:'block', marginBottom:6 }}>
                  Long Description <span style={{ fontWeight:400, textTransform:'none' }}>(SEO/AEO — real paragraphs about what this video covers)</span>
                </label>
                <style>{`
                  #foundations-long-description-editor .ql-toolbar.ql-snow { border:1px solid ${C.border}; border-bottom:none; border-radius:3px 3px 0 0; font-family:'DM Sans',system-ui,sans-serif; }
                  #foundations-long-description-editor .ql-container.ql-snow { border:1px solid ${C.border}; border-radius:0 0 3px 3px; font-family:'Source Serif 4',Georgia,serif; font-size:14px; }
                  #foundations-long-description-editor .ql-editor { min-height:160px; padding:14px 16px; line-height:1.8; color:${C.black}; }
                  #foundations-long-description-editor .ql-editor a { color:${C.red}; }
                  #foundations-long-description-editor .ql-editor img { max-width:100%; border-radius:3px; margin:10px 0; }
                `}</style>
                <div id="foundations-long-description-editor" ref={longDescContainerRef} />
              </div>

              {(panel.series?.exams?.length || 0) > 1 && (
                <div>
                  <label style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase', color:C.gray, display:'block', marginBottom:6 }}>
                    Exams for this class <span style={{ fontWeight:400, textTransform:'none' }}>(optional — this series covers {panel.series.exams.map(e => e.toUpperCase()).join(', ')}, but not every video is necessarily relevant to all of them)</span>
                  </label>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:10, padding:'10px 12px', border:`1px solid ${C.border}`, borderRadius:2, background:C.white }}>
                    {panel.series.exams.map(examCode => (
                      <label key={examCode} style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontFamily:'var(--font-sans)', fontSize:13 }}>
                        <input
                          type="checkbox"
                          checked={form.exams.includes(examCode)}
                          onChange={ev => {
                            setForm(f => ({
                              ...f,
                              exams: ev.target.checked
                                ? [...f.exams, examCode]
                                : f.exams.filter(x => x !== examCode),
                            }))
                          }}
                        />
                        {(EXAM_OPTS.find(e => e.value === examCode)?.label) || examCode.toUpperCase()}
                      </label>
                    ))}
                  </div>
                  <p style={{ fontFamily:'var(--font-sans)', fontSize:11, color:C.gray, marginTop:5 }}>
                    {form.exams.length === 0
                      ? `Nothing checked — this class will show under all of: ${panel.series.exams.map(e => e.toUpperCase()).join(', ')}.`
                      : `This class will only show under: ${form.exams.map(e => e.toUpperCase()).join(', ')}.`}
                  </p>
                </div>
              )}

              <div style={{ display:'grid', gridTemplateColumns:'1fr 100px', gap:12 }}>
                <div>
                  <label style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase', color:C.gray, display:'block', marginBottom:6 }}>Date & Time (IST)</label>
                  <input type="datetime-local" value={form.scheduled_at} onChange={set('scheduled_at')} style={inp()} />
                </div>
                <div>
                  <label style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase', color:C.gray, display:'block', marginBottom:6 }}>Duration</label>
                  <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <input type="number" value={form.duration_mins} onChange={set('duration_mins')} min={15} step={15} style={{ ...inp(), width:64 }} />
                    <span style={{ fontFamily:'var(--font-sans)', fontSize:12, color:C.gray }}>min</span>
                  </div>
                </div>
              </div>

              <div>
                <label style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase', color:C.gray, display:'block', marginBottom:6 }}>
                  YouTube Recording URL <span style={{ fontWeight:400, textTransform:'none', color:C.gray }}>(add after class happens)</span>
                </label>
                <input value={form.youtube_url} onChange={set('youtube_url')} placeholder="https://youtu.be/... or youtube.com/watch?v=..." style={inp()} />
                {thumb && (
                  <div style={{ marginTop:8, position:'relative', borderRadius:3, overflow:'hidden', border:`1px solid ${C.border}`, aspectRatio:'16/9', maxWidth:280 }}>
                    <img src={thumb} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <div style={{ width:36, height:36, borderRadius:'50%', background:'rgba(255,255,255,.9)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <div style={{ width:0, height:0, borderTop:'8px solid transparent', borderBottom:'8px solid transparent', borderLeft:'12px solid #ff4444', marginLeft:3 }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes editor */}
              <div>
                <label style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase', color:C.gray, display:'block', marginBottom:6 }}>
                  Notes & Resources <span style={{ fontWeight:400, textTransform:'none' }}>(rich text — add formulas, images, examples)</span>
                </label>
                <style>{`
                  #foundations-notes-editor .ql-toolbar.ql-snow { border:1px solid ${C.border}; border-bottom:none; border-radius:3px 3px 0 0; font-family:'DM Sans',system-ui,sans-serif; }
                  #foundations-notes-editor .ql-container.ql-snow { border:1px solid ${C.border}; border-radius:0 0 3px 3px; font-family:'Source Serif 4',Georgia,serif; font-size:14px; }
                  #foundations-notes-editor .ql-editor { min-height:220px; padding:14px 16px; line-height:1.8; color:${C.black}; }
                  #foundations-notes-editor .ql-editor a { color:${C.red}; }
                  #foundations-notes-editor .ql-editor img { max-width:100%; border-radius:3px; margin:10px 0; }
                `}</style>
                <div id="foundations-notes-editor" ref={notesContainerRef} />
              </div>

              {isEditClass ? (
                <PdfAttachSection
                  classId={panel.cls.id}
                  suggestedTitle={form.title}
                  suggestedExam={panel.series?.exams?.[0]}
                  notify={notify}
                />
              ) : (
                <p style={{ fontFamily:'var(--font-sans)', fontSize:12, color:C.gray, fontStyle:'italic' }}>
                  Save this class first — you'll be able to attach a cheat sheet or PDF right here once it exists.
                </p>
              )}

              <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontFamily:'var(--font-sans)', fontSize:13 }}>
                <input type="checkbox" checked={!!form.is_published} onChange={set('is_published')} />
                Published (visible to students)
              </label>
            </div>
          )}
        </div>

        {/* footer */}
        <div style={{ padding:'16px 24px', borderTop:`1px solid ${C.border}`, display:'flex', justifyContent:'flex-end', gap:8, flexShrink:0 }}>
          <button onClick={onClose} style={{ fontFamily:'var(--font-sans)', fontSize:13, padding:'9px 18px', border:`1px solid ${C.border}`, borderRadius:2, background:C.white, cursor:'pointer', color:C.black }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ fontFamily:'var(--font-sans)', fontSize:13, fontWeight:600, padding:'9px 22px', background:C.red, color:C.white, border:'none', borderRadius:2, cursor:saving?'not-allowed':'pointer' }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </>
  )
}

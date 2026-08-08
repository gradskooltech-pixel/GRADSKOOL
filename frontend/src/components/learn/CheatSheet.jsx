/**
 * GRADSKOOL — CheatSheet
 *
 * Gated modal shown after quiz pass/bypass.
 * Student MUST open and scroll to the bottom to unlock the next video.
 * Renders AI notes in a clean card format.
 * Has a PDF download button.
 */
import { useState, useEffect, useRef } from 'react'

export function CheatSheet({ examSlug, topicSlug, topicVideo, onComplete }) {
  const [data, setData]        = useState(null)
  const [loading, setLoading]  = useState(true)
  const [marking, setMarking]  = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [opened, setOpened]    = useState(false)
  const bodyRef                = useRef(null)

  // Fetch cheat sheet
  useEffect(() => {
    const load = async () => {
      try {
        const api = (await import('../../lib/api')).default
        const res = await api.get(
          `/learn/${examSlug}/${topicSlug}/videos/${topicVideo.id}/cheatsheet/`
        )
        setData(res.data)
      } catch {
        setData({ available: false, reason: 'Failed to load cheat sheet.' })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [examSlug, topicSlug, topicVideo.id])

  // Track if student has scrolled to bottom (or just opened it for short sheets)
  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    const check = () => {
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 50
      if (atBottom) setScrolled(true)
    }
    // Short content — mark as scrolled immediately
    if (el.scrollHeight <= el.clientHeight + 50) setScrolled(true)
    el.addEventListener('scroll', check)
    return () => el.removeEventListener('scroll', check)
  }, [data])

  const handleMarkOpened = async () => {
    setMarking(true)
    try {
      const api = (await import('../../lib/api')).default
      const res = await api.post(
        `/learn/${examSlug}/${topicSlug}/videos/${topicVideo.id}/cheatsheet/open/`
      )
      setOpened(true)
      // Small delay so student sees the success state
      setTimeout(() => onComplete(res.data), 800)
    } catch {
      setMarking(false)
    }
  }

  const handleDownloadPDF = () => {
    if (!data?.ai_notes) return
    const content = `${data.title}\n${'='.repeat(50)}\n\n${data.ai_notes}`
    const blob = new Blob([content], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${topicVideo.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-cheatsheet.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={s.overlay}>
      <div style={s.modal}>

        {/* Header */}
        <div style={s.header}>
          <div>
            <p style={s.eyebrow}>📄 Cheat Sheet</p>
            <h2 style={s.title}>{topicVideo.title}</h2>
          </div>
          <button onClick={handleDownloadPDF} style={s.downloadBtn}
                  disabled={!data?.available}>
            ↓ Download
          </button>
        </div>

        {/* Info banner */}
        <div style={s.banner}>
          <span style={s.bannerIcon}>ℹ</span>
          <p style={s.bannerText}>
            Read through this cheat sheet to unlock the next video.
          </p>
        </div>

        {/* Body */}
        <div ref={bodyRef} style={s.body}>
          {loading ? (
            <div style={s.loadingWrap}>
              <div style={s.spinner} />
              <p style={s.loadingText}>Generating cheat sheet…</p>
            </div>
          ) : !data?.available ? (
            <div style={s.unavailable}>
              <p style={s.unavailableIcon}>⏳</p>
              <p style={s.unavailableTitle}>
                {data?.generating ? 'Being generated…' : 'Not available yet'}
              </p>
              <p style={s.unavailableText}>{data?.reason}</p>
            </div>
          ) : (
            <NotesRenderer notes={data.ai_notes} />
          )}
        </div>

        {/* Footer CTA */}
        <div style={s.footer}>
          {opened ? (
            <div style={s.successRow}>
              <span style={s.successIcon}>✓</span>
              <span style={s.successText}>Next video unlocking…</span>
            </div>
          ) : data?.available ? (
            <button
              onClick={handleMarkOpened}
              disabled={(!scrolled && !data?.generating) || marking}
              style={{
                ...s.continueBtn,
                opacity: (scrolled || data?.generating) && !marking ? 1 : 0.5,
              }}
            >
              {marking ? 'Saving…' :
               !scrolled ? 'Scroll to read ↓' :
               'I\'ve read this — Continue →'}
            </button>
          ) : (
            // If cheat sheet unavailable (being generated), allow skip
            <button onClick={handleMarkOpened} disabled={marking}
                    style={s.skipBtn}>
              {marking ? 'Saving…' : 'Skip for now → '}
            </button>
          )}
        </div>

      </div>
    </div>
  )
}

function NotesRenderer({ notes }) {
  if (!notes) return null

  // Parse markdown-like AI notes into sections
  const sections = []
  let current    = null

  for (const line of notes.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue

    if (trimmed.startsWith('## ')) {
      if (current) sections.push(current)
      current = { title: trimmed.replace('## ', ''), items: [], type: 'section' }
    } else if (trimmed.startsWith('# ')) {
      if (current) sections.push(current)
      current = { title: trimmed.replace('# ', ''), items: [], type: 'heading' }
    } else if (trimmed.startsWith('- ') && current) {
      current.items.push(trimmed.replace('- ', ''))
    } else if (current) {
      current.items.push(trimmed)
    } else {
      sections.push({ title: '', items: [trimmed], type: 'para' })
    }
  }
  if (current) sections.push(current)

  return (
    <div style={n.wrap}>
      {sections.map((sec, i) => (
        <div key={i} style={n.section}>
          {sec.title && (
            <h3 style={sec.type === 'heading' ? n.heading : n.sectionTitle}>
              {sec.title}
            </h3>
          )}
          {sec.items.length > 0 && (
            <ul style={n.list}>
              {sec.items.map((item, j) => (
                <li key={j} style={n.item}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}

const s = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.75)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '1rem',
  },
  modal: {
    background: 'var(--white)',
    borderRadius: 'var(--radius-md)',
    width: '100%', maxWidth: '640px',
    height: '90vh', display: 'flex', flexDirection: 'column',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '1.5rem',
    borderBottom: '1px solid var(--gray-100)',
    flexShrink: 0,
  },
  eyebrow: {
    fontFamily: 'var(--font-sans)', fontSize: '0.65rem', fontWeight: '700',
    letterSpacing: '0.1em', textTransform: 'uppercase',
    color: 'var(--red)', marginBottom: '0.2rem',
  },
  title: {
    fontFamily: 'var(--font-serif)', fontSize: '1.05rem',
    fontWeight: '500', color: 'var(--black)',
  },
  downloadBtn: {
    fontFamily: 'var(--font-sans)', fontSize: '0.78rem', fontWeight: '600',
    color: 'var(--gray-500)', background: 'none',
    border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)',
    padding: '0.4rem 0.875rem', cursor: 'pointer', flexShrink: 0,
  },
  banner: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    padding: '0.6rem 1.5rem',
    background: '#eff6ff', borderBottom: '1px solid #bfdbfe',
    flexShrink: 0,
  },
  bannerIcon: { fontSize: '0.875rem' },
  bannerText: {
    fontFamily: 'var(--font-sans)', fontSize: '0.8rem',
    color: '#1e40af',
  },
  body: {
    flex: 1, overflowY: 'auto', padding: '1.5rem',
  },
  loadingWrap: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '3rem', gap: '1rem',
  },
  spinner: {
    width: '28px', height: '28px',
    border: '3px solid var(--gray-100)',
    borderTop: '3px solid var(--red)',
    borderRadius: '50%', animation: 'spin 0.7s linear infinite',
  },
  loadingText: {
    fontFamily: 'var(--font-sans)', fontSize: '0.85rem', color: 'var(--gray-400)',
  },
  unavailable: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '3rem', textAlign: 'center', gap: '0.5rem',
  },
  unavailableIcon: { fontSize: '2.5rem' },
  unavailableTitle: {
    fontFamily: 'var(--font-serif)', fontSize: '1.1rem',
    fontWeight: '500', color: 'var(--black)',
  },
  unavailableText: {
    fontFamily: 'var(--font-sans)', fontSize: '0.85rem',
    color: 'var(--gray-400)', lineHeight: '1.6',
  },
  footer: {
    padding: '1rem 1.5rem',
    borderTop: '1px solid var(--gray-100)',
    flexShrink: 0,
  },
  continueBtn: {
    width: '100%', padding: '0.875rem',
    background: 'var(--black)', color: 'var(--white)',
    border: 'none', borderRadius: 'var(--radius)',
    fontFamily: 'var(--font-sans)', fontSize: '0.9rem', fontWeight: '600',
    cursor: 'pointer',
  },
  skipBtn: {
    width: '100%', padding: '0.875rem',
    background: 'var(--gray-100)', color: 'var(--gray-600)',
    border: 'none', borderRadius: 'var(--radius)',
    fontFamily: 'var(--font-sans)', fontSize: '0.875rem',
    cursor: 'pointer',
  },
  successRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '0.5rem', padding: '0.5rem',
  },
  successIcon: { fontSize: '1.2rem', color: '#10b981' },
  successText: {
    fontFamily: 'var(--font-sans)', fontSize: '0.9rem',
    fontWeight: '600', color: '#10b981',
  },
}

const n = {
  wrap: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  section: {},
  heading: {
    fontFamily: 'var(--font-serif)', fontSize: '1.2rem',
    fontWeight: '700', color: 'var(--black)', marginBottom: '0.75rem',
  },
  sectionTitle: {
    fontFamily: 'var(--font-sans)', fontSize: '0.68rem', fontWeight: '700',
    letterSpacing: '0.1em', textTransform: 'uppercase',
    color: 'var(--red)', marginBottom: '0.75rem',
  },
  list: { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  item: {
    fontFamily: 'var(--font-serif)', fontSize: '0.9rem',
    color: 'var(--gray-700)', lineHeight: '1.7',
    paddingLeft: '1rem', borderLeft: '2px solid var(--gray-200)',
  },
}

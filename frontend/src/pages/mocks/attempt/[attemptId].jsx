/**
 * GRADSKOOL — Mock Test Attempt (real CBT interface)
 * Route: /mocks/attempt/[attemptId]
 *
 * Bypasses the shared Navbar/Footer via getLayout, same reasoning as the
 * PDF reader (pages/pdfs/[slug]/read.jsx) — the site chrome would fight
 * this page's own full-height layout and create a second, competing
 * scroll. An exam screen needs the whole viewport to itself.
 *
 * Note on section switching: unlike the real proctored SNAP/CAT exam,
 * this practice interface does NOT hard-lock you out of a section once
 * you leave it — you can move between sections freely, same as most
 * practice-test tools. The timer is still real (one clock for the whole
 * paper, or the section's own clock for a Sectional attempt) and
 * auto-submits at zero either way.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { useAuth } from '../../../hooks/useAuth'
import api from '../../../lib/api'

const C = {
  red: '#ff5e5f', black: '#0f0f0f', white: '#fff', bg: '#f0efec',
  border: '#e2e1dd', gray: '#8a8a86', green: '#22c55e', amber: '#f59e0b', purple: '#7b2d8b', blue: '#3b82f6',
}

export default function AttemptPage() {
  const router = useRouter()
  const { attemptId } = router.query
  const { isLoggedIn, isLoading: authLoading, sessionReady } = useAuth()

  const [attempt, setAttempt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState(0)
  const [activeQ, setActiveQ] = useState(0)
  const [answers, setAnswers] = useState({}) // question_id -> { selected_option, is_marked_for_review, is_visited }
  const [secsLeft, setSecsLeft] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const qStartRef = useRef(Date.now())

  useEffect(() => {
    if (router.isReady && sessionReady && !isLoggedIn) {
      router.replace(`/auth/login?redirect=${encodeURIComponent(`/mocks/attempt/${attemptId}`)}`)
    }
  }, [sessionReady, isLoggedIn, attemptId, router, router.isReady])

  const load = useCallback(() => {
    if (!attemptId) return
    setLoading(true)
    api.get(`/mocks/attempts/${attemptId}/`).then(({ data }) => {
      if (data.completed || data.correct !== undefined) {
        router.replace(`/mocks/result/${attemptId}`)
        return
      }
      setAttempt(data)
      const initAnswers = {}
      data.questions.forEach(q => { initAnswers[q.id] = { selected_option: q.selected_option || '', is_marked_for_review: q.is_marked_for_review || false, is_visited: q.is_visited || false } })
      setAnswers(initAnswers)
      setSecsLeft(data.time_remaining_secs)
    }).finally(() => setLoading(false))
  }, [attemptId, router])
  useEffect(() => { load() }, [load])

  // Countdown
  useEffect(() => {
    if (!attempt) return
    const t = setInterval(() => setSecsLeft(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [attempt])

  useEffect(() => {
    if (attempt && secsLeft === 0 && !submitting) submit(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secsLeft])

  if (!sessionReady || loading || authLoading || !isLoggedIn || !attempt) {
    return <div style={styles.loadingPage}>Loading…</div>
  }

  // Each question carries its own section_id (full mocks span several
  // sections; sectional/topic attempts have 0-1 section, so this still
  // works — it just groups everything into one bucket).
  const questionsBySection = attempt.sections.length > 1
    ? attempt.sections.map(sec => attempt.questions.filter(q => q.section_id === sec.id))
    : [attempt.questions]

  const currentSectionQuestions = questionsBySection[activeSection] || attempt.questions

  const q = currentSectionQuestions[activeQ]

  const setAnswer = (patch) => setAnswers(a => ({ ...a, [q.id]: { ...a[q.id], ...patch } }))

  const saveCurrent = async (extra = {}) => {
    const timeTaken = Math.round((Date.now() - qStartRef.current) / 1000)
    qStartRef.current = Date.now()
    const cur = { ...answers[q.id], ...extra }
    setAnswers(a => ({ ...a, [q.id]: { ...cur, is_visited: true } }))
    try {
      await api.post(`/mocks/attempts/${attemptId}/answer/`, {
        question_id: q.id, selected_option: cur.selected_option, is_marked_for_review: cur.is_marked_for_review, time_taken_secs: timeTaken,
      })
    } catch (e) { /* best-effort autosave — don't block navigation on a network blip */ }
  }

  const goTo = async (secIdx, qIdx) => {
    await saveCurrent()
    setActiveSection(secIdx); setActiveQ(qIdx)
  }

  const saveAndNext = async () => {
    await saveCurrent()
    if (activeQ < currentSectionQuestions.length - 1) setActiveQ(i => i + 1)
    else if (activeSection < attempt.sections.length - 1) { setActiveSection(s => s + 1); setActiveQ(0) }
  }

  const markAndNext = async () => {
    await saveCurrent({ is_marked_for_review: true })
    if (activeQ < currentSectionQuestions.length - 1) setActiveQ(i => i + 1)
    else if (activeSection < attempt.sections.length - 1) { setActiveSection(s => s + 1); setActiveQ(0) }
  }

  const clearResponse = () => setAnswer({ selected_option: '' })

  const submit = async (auto = false) => {
    if (!auto && !confirm('Submit this test? You cannot change your answers after this.')) return
    setSubmitting(true)
    await saveCurrent()
    try {
      await api.post(`/mocks/attempts/${attemptId}/submit/`)
      router.replace(`/mocks/result/${attemptId}`)
    } catch (e) {
      setSubmitting(false)
    }
  }

  const answeredCount = Object.values(answers).filter(a => a.selected_option).length
  const markedCount = Object.values(answers).filter(a => a.is_marked_for_review).length

  return (
    <div style={styles.page}>
      <Head><title>{attempt.paper_title || 'Practice Set'} — GRADSKOOL</title><meta name="robots" content="noindex" /></Head>

      {/* Responsive layout for the 5 elements below — everything else on this
          page is static inline styles (fine, they don't need to change with
          viewport width). An inline `style` prop always wins over a
          stylesheet rule for the same property no matter what a media query
          says, so these 5 are defined ENTIRELY as CSS classes here (no
          parallel style={{...}} on the same elements) rather than layering a
          class on top of their old inline objects — that's the only way the
          mobile overrides below can actually take effect. Same 760-960px
          collapse convention pdfs/[slug].jsx uses for its own 280px-sidebar
          layout. Below ~860px: palette moves below the question instead of
          squeezing it to a sliver, the two action buttons stack full-width
          instead of overflowing, and the TITA input stretches instead of
          staying a fixed 260px. */}
      <style>{`
        .ma-body { flex: 1; display: flex; overflow: hidden; }
        .ma-qpanel { flex: 1; min-width: 0; padding: 2rem; overflow-y: auto; }
        .ma-palette { width: 280px; border-left: 1px solid ${C.border}; background: ${C.white}; padding: 1.25rem; overflow-y: auto; display: flex; flex-direction: column; }
        .ma-actions { display: flex; justify-content: space-between; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid ${C.border}; gap: 0.75rem; flex-wrap: wrap; }
        .ma-tita { width: 260px; margin-top: 1.25rem; padding: 0.7rem 0.9rem; border: 1px solid ${C.border}; border-radius: 4px; font-family: 'SF Mono',monospace; font-size: 0.95rem; }
        @media (max-width: 860px) {
          .ma-body { flex-direction: column; overflow: visible; }
          .ma-qpanel { overflow-y: visible; padding: 1.25rem; }
          .ma-palette { width: 100%; border-left: none; border-top: 1px solid ${C.border}; }
          .ma-actions { flex-direction: column; align-items: stretch; }
          .ma-actions > div { flex-direction: column; width: 100%; }
          .ma-actions button { width: 100%; }
          .ma-tita { width: 100%; max-width: 100%; box-sizing: border-box; }
        }
      `}</style>

      {/* Header */}
      <div style={{ ...styles.header, flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <p style={styles.headerTitle}>{attempt.paper_title || 'Topic-wise Practice'}</p>
          {attempt.sections.length > 1 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.4rem' }}>
              {attempt.sections.map((s, i) => (
                <button key={s.id || i} onClick={() => goTo(i, 0)} style={{ ...styles.sectionTab, ...(i === activeSection ? styles.sectionTabActive : {}) }}>{s.name}</button>
              ))}
            </div>
          )}
        </div>
        <div style={styles.timer(secsLeft)}>{formatTime(secsLeft)}</div>
      </div>

      <div className="ma-body">
        {/* Question panel — fills the row (no dead space beside the palette); inner wrapper caps reading width and centers it. */}
        <div className="ma-qpanel">
          <div style={styles.qPanelInner}>
            <p style={styles.qMeta}>Question {activeQ + 1} of {currentSectionQuestions.length}</p>
            {q.passage_id && <PassageNote />}
            <div style={styles.qText} dangerouslySetInnerHTML={{ __html: q.question_text }} />

            {q.question_type === 'TITA' ? (
              <input
                type="text" placeholder="Type your answer"
                value={answers[q.id]?.selected_option || ''}
                onChange={e => setAnswer({ selected_option: e.target.value })}
                className="ma-tita"
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.25rem' }}>
                {q.options.map(opt => (
                  <label key={opt.key} style={{ ...styles.option, ...(answers[q.id]?.selected_option === opt.key ? styles.optionSelected : {}) }}>
                    <input type="radio" name={`q${q.id}`} checked={answers[q.id]?.selected_option === opt.key} onChange={() => setAnswer({ selected_option: opt.key })} style={{ marginRight: '0.75rem' }} />
                    <span style={{ fontWeight: 700, marginRight: '0.5rem' }}>{opt.key}.</span>{opt.text}
                  </label>
                ))}
              </div>
            )}

            <div className="ma-actions">
              <button onClick={clearResponse} style={styles.btnGhost}>Clear Response</button>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={markAndNext} style={styles.btnPurple}>Mark for Review &amp; Next</button>
                <button onClick={saveAndNext} style={styles.btnPrimary}>Save &amp; Next →</button>
              </div>
            </div>
          </div>
        </div>

        {/* Palette */}
        <div className="ma-palette">
          <div style={styles.paletteStats}>
            <StatDot color={C.green} label={`Answered ${answeredCount}`} />
            <StatDot color={C.gray} label={`Not visited`} />
            <StatDot color={C.blue} label={`Not answered`} />
            <StatDot color={C.purple} label={`Marked ${markedCount}`} />
          </div>
          <div style={styles.paletteGrid}>
            {currentSectionQuestions.map((qq, i) => {
              const a = answers[qq.id] || {}
              let bg = C.white, color = C.black, border = C.border
              if (a.is_marked_for_review) { bg = C.purple; color = '#fff'; border = C.purple }
              else if (a.selected_option) { bg = C.green; color = '#fff'; border = C.green }
              else if (a.is_visited) { bg = C.blue; color = '#fff'; border = C.blue }
              return (
                <button key={qq.id} onClick={() => goTo(activeSection, i)} style={{ ...styles.paletteCell, background: bg, color, border: `1px solid ${border}`, outline: i === activeQ ? `2px solid ${C.red}` : 'none' }}>
                  {i + 1}
                </button>
              )
            })}
          </div>
          <button onClick={() => submit(false)} disabled={submitting} style={styles.btnSubmit}>{submitting ? 'Submitting…' : 'Submit Test'}</button>
        </div>
      </div>
    </div>
  )
}
AttemptPage.getLayout = (page) => page

function StatDot({ color, label }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-sans)', fontSize: '0.68rem', color: C.gray }}><span style={{ width: '10px', height: '10px', borderRadius: '3px', background: color, display: 'inline-block' }} />{label}</div>
}

function PassageNote() {
  return <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.7rem', color: C.gray, marginBottom: '0.5rem', fontStyle: 'italic' }}>Part of a passage/set — scroll up if you need to re-read it (shown once above the first question of the set).</p>
}

function formatTime(secs) {
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`
}

const styles = {
  loadingPage: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia,serif', color: '#999' },
  page: { minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column' },
  header: { background: C.black, color: '#fff', padding: '0.875rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50 },
  headerTitle: { fontFamily: 'var(--font-sans)', fontSize: '0.9rem', fontWeight: 700 },
  sectionTab: { fontFamily: 'var(--font-sans)', fontSize: '0.72rem', padding: '0.3rem 0.7rem', borderRadius: '3px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' },
  sectionTabActive: { background: C.red, borderColor: C.red, color: '#fff' },
  timer: (secsLeft) => ({ fontFamily: "'SF Mono',monospace", fontSize: '1.1rem', fontWeight: 700, padding: '0.4rem 1rem', borderRadius: '4px', background: secsLeft < 120 ? C.red : 'rgba(255,255,255,0.1)' }),
  // body/qPanel/palette/actionsRow/titaInput moved to CSS classes (.ma-body,
  // .ma-qpanel, .ma-palette, .ma-actions, .ma-tita in the <style> block above)
  // so their mobile media-query overrides can actually take effect — an
  // inline style prop always beats a stylesheet rule, breakpoint or not.
  qPanelInner: { maxWidth: '760px', margin: '0 auto' },
  qMeta: { fontFamily: 'var(--font-sans)', fontSize: '0.7rem', fontWeight: 700, color: C.gray, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' },
  qText: { fontFamily: 'Georgia,serif', fontSize: '1.05rem', lineHeight: 1.7, color: C.black, overflowWrap: 'anywhere' },
  option: { display: 'flex', alignItems: 'center', padding: '0.75rem 1rem', border: `1px solid ${C.border}`, borderRadius: '6px', background: C.white, fontFamily: 'var(--font-sans)', fontSize: '0.9rem', cursor: 'pointer' },
  optionSelected: { borderColor: C.red, background: '#fff5f5' },
  btnGhost: { padding: '0.65rem 1rem', background: 'none', border: `1px solid ${C.border}`, borderRadius: '4px', fontFamily: 'var(--font-sans)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', color: C.gray },
  btnPurple: { padding: '0.65rem 1.1rem', background: C.purple, color: '#fff', border: 'none', borderRadius: '4px', fontFamily: 'var(--font-sans)', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' },
  btnPrimary: { padding: '0.65rem 1.25rem', background: C.red, color: '#fff', border: 'none', borderRadius: '4px', fontFamily: 'var(--font-sans)', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' },
  paletteStats: { display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: `1px solid ${C.border}` },
  paletteGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.4rem', flex: 1, alignContent: 'flex-start' },
  paletteCell: { aspectRatio: '1', borderRadius: '4px', fontFamily: 'var(--font-sans)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' },
  btnSubmit: { marginTop: '1.25rem', padding: '0.75rem', background: C.black, color: '#fff', border: 'none', borderRadius: '4px', fontFamily: 'var(--font-sans)', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' },
}
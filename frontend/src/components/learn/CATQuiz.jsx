/**
 * GRADSKOOL — CAT Quiz Interface
 *
 * CAT-style quiz interface with:
 *   - Question palette (colour-coded exactly like CAT)
 *   - Mark for review
 *   - Clear response
 *   - On-screen calculator
 *   - On-screen keyboard (for typing scratch work)
 *   - Keyboard shortcuts (1-4 to select option, N=next, P=prev, M=mark)
 *   - No timer (as requested)
 *   - Inline result after submit
 *
 * Palette colours (exact CAT spec):
 *   #808080 = not visited (grey)
 *   #FFFFFF = visited, not answered (white with border)
 *   #00C853 = answered (green)
 *   #7B1FA2 = marked for review (purple)
 *   #00C853 + dot = answered + marked for review
 */
import { useState, useEffect, useCallback } from 'react'

// ── PALETTE STATUS ────────────────────────────────────────────────────────────
const STATUS = {
  NOT_VISITED:          'not_visited',
  VISITED:              'visited',
  ANSWERED:             'answered',
  MARKED:               'marked',
  ANSWERED_AND_MARKED:  'answered_marked',
}

const PALETTE_STYLES = {
  not_visited:     { bg: '#808080', color: '#fff', border: '#808080' },
  visited:         { bg: '#fff',    color: '#333', border: '#999' },
  answered:        { bg: '#00C853', color: '#fff', border: '#00C853' },
  marked:          { bg: '#7B1FA2', color: '#fff', border: '#7B1FA2' },
  answered_marked: { bg: '#00C853', color: '#fff', border: '#00C853', dot: true },
}

export function CATQuiz({ questions, topicTitle, onSubmitAll }) {
  const [current, setCurrent]     = useState(0)
  const [answers, setAnswers]     = useState({})    // {questionId: optionId}
  const [statuses, setStatuses]   = useState({})    // {questionId: STATUS}
  const [showCalc, setShowCalc]   = useState(false)
  const [showKeyboard, setShowKB] = useState(false)
  const [scratchText, setScratch] = useState('')
  const [submitting, setSubmit]   = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult]       = useState(null)
  const [showPalette, setPalette] = useState(true)

  const q = questions[current] || null

  // Guard: show loading/empty state if no questions yet
  if (!questions || questions.length === 0) {
    return (
      <div style={{ padding:'3rem', textAlign:'center', fontFamily:'Georgia,serif', color:'#999' }}>
        <div style={{ fontSize:'2rem', marginBottom:'0.75rem' }}>📝</div>
        <p style={{ fontSize:'1rem', marginBottom:'0.375rem', color:'#444' }}>No questions available yet.</p>
        <p style={{ fontSize:'0.875rem' }}>Questions will appear here once added via the admin panel.</p>
      </div>
    )
  }

  // Init statuses to not_visited
  useEffect(() => {
    const init = {}
    questions.forEach(q => { init[q.id] = STATUS.NOT_VISITED })
    setStatuses(init)
  }, [questions])

  // Mark current as visited when navigated to
  useEffect(() => {
    if (!q) return
    setStatuses(prev => ({
      ...prev,
      [q.id]: prev[q.id] === STATUS.NOT_VISITED ? STATUS.VISITED : prev[q.id],
    }))
  }, [current, q])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (submitted || showCalc || showKeyboard) return
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      if (['1','2','3','4'].includes(e.key)) {
        const idx = parseInt(e.key) - 1
        if (q?.options?.[idx]) selectOption(q.options[idx].id)
      }
      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'n') navigateNext()
      if (e.key === 'ArrowLeft'  || e.key.toLowerCase() === 'p') navigatePrev()
      if (e.key.toLowerCase() === 'm') toggleMark()
      if (e.key.toLowerCase() === 'c') clearResponse()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [current, q, answers, statuses, submitted, showCalc, showKeyboard])

  const selectOption = useCallback((optionId) => {
    if (!q) return
    setAnswers(prev => ({ ...prev, [q.id]: optionId }))
    setStatuses(prev => ({
      ...prev,
      [q.id]: prev[q.id] === STATUS.MARKED || prev[q.id] === STATUS.ANSWERED_AND_MARKED
        ? STATUS.ANSWERED_AND_MARKED
        : STATUS.ANSWERED,
    }))
  }, [q])

  const clearResponse = useCallback(() => {
    if (!q) return
    setAnswers(prev => { const n = { ...prev }; delete n[q.id]; return n })
    setStatuses(prev => ({ ...prev, [q.id]: STATUS.VISITED }))
  }, [q])

  const toggleMark = useCallback(() => {
    if (!q) return
    setStatuses(prev => {
      const cur = prev[q.id]
      const hasAnswer = answers[q.id]
      if (cur === STATUS.MARKED) return { ...prev, [q.id]: STATUS.VISITED }
      if (cur === STATUS.ANSWERED_AND_MARKED) return { ...prev, [q.id]: STATUS.ANSWERED }
      if (cur === STATUS.ANSWERED) return { ...prev, [q.id]: STATUS.ANSWERED_AND_MARKED }
      return { ...prev, [q.id]: STATUS.MARKED }
    })
  }, [q, answers])

  const navigatePrev = useCallback(() => {
    setCurrent(c => Math.max(0, c - 1))
  }, [])

  const navigateNext = useCallback(() => {
    setCurrent(c => Math.min(questions.length - 1, c + 1))
  }, [questions.length])

  const handleSubmit = async () => {
    const payload = questions.map(q => ({
      question_id:        q.id,
      selected_option_id: answers[q.id] || null,
    }))
    setSubmit(true)
    try {
      const res = await onSubmitAll(payload)
      setResult(res)
      setSubmitted(true)
    } finally {
      setSubmit(false)
    }
  }

  // ── RESULT VIEW ────────────────────────────────────────────────────────────
  if (submitted && result) {
    return <ResultView result={result} questions={questions} answers={answers} />
  }

  // ── QUIZ VIEW ──────────────────────────────────────────────────────────────
  const answered  = Object.keys(answers).length
  const marked    = Object.values(statuses).filter(s =>
    s === STATUS.MARKED || s === STATUS.ANSWERED_AND_MARKED).length
  const notVisited = Object.values(statuses).filter(s => s === STATUS.NOT_VISITED).length

  return (
    <div style={cat.wrap}>

      {/* ── TOP BAR ───────────────────────────────────────────────── */}
      <div style={cat.topBar}>
        <div style={cat.topLeft}>
          <span style={cat.topTitle}>{topicTitle}</span>
          <span style={cat.topSection}>Practice Quiz</span>
        </div>
        <div style={cat.topRight}>
          <button onClick={() => setShowCalc(v => !v)} style={cat.toolBtn}
                  title="Calculator (C)">🖩</button>
          <button onClick={() => setShowKB(v => !v)} style={cat.toolBtn}
                  title="On-screen keyboard">⌨</button>
          <button onClick={() => setPalette(v => !v)} style={cat.toolBtn}
                  title="Toggle palette">⊞</button>
        </div>
      </div>

      <div style={cat.body}>

        {/* ── QUESTION PANEL ────────────────────────────────────────── */}
        <div style={cat.questionPanel}>

          {/* Question header */}
          <div style={cat.qHeader}>
            <span style={cat.qType}>Single Correct</span>
            <span style={cat.qNum}>Question {current + 1} of {questions.length}</span>
          </div>

          {/* Question text */}
          <div style={cat.qBody}>
            <p style={cat.qText}>{q?.text}</p>
          </div>

          {/* Options */}
          <div style={cat.options}>
            {q?.options?.map((opt, idx) => {
              const isSelected = answers[q.id] === opt.id
              return (
                <button
                  key={opt.id}
                  onClick={() => selectOption(opt.id)}
                  style={{
                    ...cat.option,
                    ...(isSelected ? cat.optionSelected : {}),
                  }}
                >
                  <div style={{
                    ...cat.optBubble,
                    background: isSelected ? '#0066cc' : 'var(--white)',
                    border: isSelected ? '2px solid #0066cc' : '2px solid #999',
                    color: isSelected ? 'white' : '#333',
                  }}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span style={cat.optText}>{opt.text}</span>
                  <span style={cat.optKey}>[{idx + 1}]</span>
                </button>
              )
            })}
          </div>

          {/* Action buttons */}
          <div style={cat.actions}>
            <button onClick={toggleMark} style={cat.markBtn}>
              ⚑ Mark for Review
            </button>
            <button onClick={clearResponse} style={cat.clearBtn}>
              ✕ Clear Response
            </button>
            <div style={{ flex: 1 }} />
            {current > 0 && (
              <button onClick={navigatePrev} style={cat.prevBtn}>
                ← Previous
              </button>
            )}
            {current < questions.length - 1 ? (
              <button onClick={navigateNext} style={cat.nextBtn}>
                Save & Next →
              </button>
            ) : (
              <button onClick={() => {}} style={{ ...cat.nextBtn, opacity: 0.5 }}>
                Save & Next →
              </button>
            )}
          </div>

          {/* Scratch pad */}
          {showKeyboard && (
            <div style={cat.scratch}>
              <p style={cat.scratchLabel}>Scratch Pad</p>
              <textarea
                value={scratchText}
                onChange={e => setScratch(e.target.value)}
                style={cat.scratchArea}
                placeholder="Use this space for rough work…"
              />
            </div>
          )}
        </div>

        {/* ── SIDEBAR ───────────────────────────────────────────────── */}
        {showPalette && (
          <div style={cat.sidebar}>

            {/* Palette legend */}
            <div style={cat.legend}>
              <LegendItem status={STATUS.ANSWERED}        label={`${answered} Answered`} />
              <LegendItem status={STATUS.NOT_VISITED}     label={`${notVisited} Not Visited`} />
              <LegendItem status={STATUS.VISITED}         label="Not Answered" />
              <LegendItem status={STATUS.MARKED}          label={`${marked} Marked`} />
              <LegendItem status={STATUS.ANSWERED_AND_MARKED} label="Ans + Marked" />
            </div>

            {/* Palette grid */}
            <div style={cat.paletteWrap}>
              <p style={cat.paletteTitle}>Question Palette</p>
              <div style={cat.palette}>
                {questions.map((q, idx) => {
                  const st  = statuses[q.id] || STATUS.NOT_VISITED
                  const cfg = PALETTE_STYLES[st]
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrent(idx)}
                      style={{
                        ...cat.paletteDot,
                        background:   cfg.bg,
                        color:        cfg.color,
                        border:       `2px solid ${cfg.border}`,
                        outline:      current === idx ? '2px solid #0066cc' : 'none',
                        outlineOffset: '2px',
                      }}
                    >
                      {idx + 1}
                      {cfg.dot && <span style={cat.paletteSubDot} />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={cat.submitBtn}
            >
              {submitting ? 'Submitting…' : `Submit Test (${answered}/${questions.length})`}
            </button>

            {/* Shortcuts help */}
            <div style={cat.shortcuts}>
              <p style={cat.shortcutsTitle}>Keyboard Shortcuts</p>
              {[
                ['1–4', 'Select option'],
                ['N / →', 'Next question'],
                ['P / ←', 'Previous'],
                ['M', 'Mark for review'],
                ['C', 'Clear response'],
              ].map(([key, desc]) => (
                <div key={key} style={cat.shortcutRow}>
                  <kbd style={cat.kbd}>{key}</kbd>
                  <span style={cat.shortcutDesc}>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── CALCULATOR OVERLAY ────────────────────────────────────── */}
      {showCalc && (
        <Calculator onClose={() => setShowCalc(false)} />
      )}
    </div>
  )
}

// ── RESULT VIEW ───────────────────────────────────────────────────────────────

function ResultView({ result, questions, answers }) {
  const [showReview, setReview] = useState(false)

  return (
    <div style={res.wrap}>
      {/* Score header */}
      <div style={res.header}>
        <div style={res.scoreSection}>
          <ScoreRing pct={result.score_pct} />
          <div>
            <h2 style={res.scoreTitle}>
              {result.score_pct >= 70 ? '🎉 Great work!' :
               result.score_pct >= 50 ? '📈 Good attempt!' : '📚 Keep practising!'}
            </h2>
            <p style={res.scoreSubtitle}>{topicResultLabel(result)}</p>
          </div>
        </div>

        {/* Stats strip */}
        <div style={res.statsStrip}>
          <StatChip val={result.correct}  label="Correct"     color="#00C853" />
          <StatChip val={result.wrong}    label="Wrong"       color="#d32f2f" />
          <StatChip val={result.skipped}  label="Skipped"     color="#808080" />
          <StatChip val={result.attempted} label="Attempted"  color="#0066cc" />
          <StatChip val={result.total}    label="Total"       color="var(--black)" />
        </div>
      </div>

      {/* Toggle review */}
      <button onClick={() => setReview(v => !v)} style={res.reviewToggle}>
        {showReview ? '▲ Hide Answer Review' : '▼ Review Answers'}
      </button>

      {/* Answer review */}
      {showReview && (
        <div style={res.reviewList}>
          {result.feedback?.map((fb, i) => {
            const q = questions[i]
            return (
              <div key={fb.question_id} style={{
                ...res.reviewItem,
                background: fb.skipped ? '#f9fafb' : fb.is_correct ? '#f0fdf4' : '#fff5f5',
                borderLeft: `4px solid ${fb.skipped ? '#9ca3af' : fb.is_correct ? '#00C853' : '#d32f2f'}`,
              }}>
                <div style={res.reviewHeader}>
                  <span style={res.reviewQNum}>Q{i + 1}</span>
                  <span style={{
                    ...res.reviewStatus,
                    color: fb.skipped ? '#6b7280' : fb.is_correct ? '#166534' : '#991b1b',
                  }}>
                    {fb.skipped ? 'Skipped' : fb.is_correct ? '✓ Correct' : '✗ Wrong'}
                  </span>
                </div>
                <p style={res.reviewQText}>{q?.text}</p>
                {!fb.is_correct && !fb.skipped && (
                  <p style={res.reviewCorrect}>
                    Correct: <strong>{fb.correct_option_key}.</strong> {fb.correct_option_text}
                  </p>
                )}
                {fb.explanation && (
                  <p style={res.reviewExp}>{fb.explanation}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function topicResultLabel(result) {
  return `${result.correct} correct · ${result.wrong} wrong · ${result.skipped} skipped · Score: ${result.score_pct}%`
}

// ── CALCULATOR ────────────────────────────────────────────────────────────────

function Calculator({ onClose }) {
  const [display, setDisplay] = useState('0')
  const [prev, setPrev]       = useState('')
  const [op, setOp]           = useState('')
  const [fresh, setFresh]     = useState(true)

  const press = (val) => {
    if (val === 'C') { setDisplay('0'); setPrev(''); setOp(''); setFresh(true); return }
    if (val === '←') { setDisplay(d => d.length > 1 ? d.slice(0, -1) : '0'); return }

    if (['+', '-', '×', '÷'].includes(val)) {
      setPrev(display); setOp(val); setFresh(true); return
    }

    if (val === '=') {
      const a = parseFloat(prev), b = parseFloat(display)
      let r = 0
      if (op === '+') r = a + b
      if (op === '-') r = a - b
      if (op === '×') r = a * b
      if (op === '÷') r = b !== 0 ? a / b : 'Err'
      setDisplay(String(parseFloat(r.toFixed(8))))
      setPrev(''); setOp(''); setFresh(true); return
    }

    if (val === '.') {
      if (fresh) { setDisplay('0.'); setFresh(false); return }
      if (!display.includes('.')) setDisplay(d => d + '.')
      return
    }

    setDisplay(d => fresh ? val : d === '0' ? val : d + val)
    setFresh(false)
  }

  const BUTTONS = [
    ['C', '←', '%', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '='],
  ]

  return (
    <div style={calc.overlay}>
      <div style={calc.box}>
        <div style={calc.header}>
          <span style={calc.title}>Calculator</span>
          <button onClick={onClose} style={calc.close}>✕</button>
        </div>
        <div style={calc.display}>{display}</div>
        {op && prev && <div style={calc.opDisplay}>{prev} {op}</div>}
        <div style={calc.buttons}>
          {BUTTONS.map((row, ri) => (
            <div key={ri} style={calc.row}>
              {row.map(btn => (
                <button
                  key={btn}
                  onClick={() => press(btn)}
                  style={{
                    ...calc.btn,
                    ...(btn === '=' ? calc.btnEq : {}),
                    ...(btn === 'C' ? calc.btnClear : {}),
                    ...(btn === '0' ? calc.btnZero : {}),
                  }}
                >
                  {btn}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

function LegendItem({ status, label }) {
  const cfg = PALETTE_STYLES[status]
  return (
    <div style={leg.wrap}>
      <div style={{
        ...leg.dot,
        background: cfg.bg, border: `2px solid ${cfg.border}`, color: cfg.color,
      }}>
        {cfg.dot && <span style={{ width: '6px', height: '6px',
          background: '#7B1FA2', borderRadius: '50%', position: 'absolute',
          bottom: '-2px', right: '-2px' }} />}
      </div>
      <span style={leg.label}>{label}</span>
    </div>
  )
}

function ScoreRing({ pct }) {
  const size = 90, stroke = 9
  const r    = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  const color = pct >= 70 ? '#00C853' : pct >= 50 ? '#f59e0b' : '#d32f2f'

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
          strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-serif)', fontSize: '1.3rem',
        fontWeight: '700', color }}>
        {Math.round(pct)}%
      </div>
    </div>
  )
}

function StatChip({ val, label, color }) {
  return (
    <div style={{ textAlign: 'center', minWidth: '64px' }}>
      <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem',
                  fontWeight: '700', color, lineHeight: '1' }}>{val}</p>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.68rem',
                  color: 'var(--gray-400)', marginTop: '0.2rem' }}>{label}</p>
    </div>
  )
}

// ── STYLES ────────────────────────────────────────────────────────────────────

const cat = {
  wrap: { display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f5f5' },
  topBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '0.6rem 1.25rem',
    background: '#003399', color: 'white',
    flexShrink: 0,
  },
  topLeft: { display: 'flex', flexDirection: 'column' },
  topTitle: { fontFamily: 'var(--font-sans)', fontSize: '0.9rem', fontWeight: '700', color: 'white' },
  topSection: { fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)' },
  topRight: { display: 'flex', gap: '0.5rem' },
  toolBtn: {
    background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
    color: 'white', padding: '0.35rem 0.6rem', borderRadius: '3px',
    cursor: 'pointer', fontSize: '1rem',
  },
  body: { display: 'flex', flex: 1, overflow: 'hidden' },
  questionPanel: { flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  qHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '0.5rem 0', borderBottom: '1px solid #ddd',
  },
  qType: { fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: '#666', fontStyle: 'italic' },
  qNum: { fontFamily: 'var(--font-sans)', fontSize: '0.82rem', fontWeight: '600', color: '#333' },
  qBody: {
    background: 'white', border: '1px solid #e0e0e0',
    borderRadius: '4px', padding: '1.5rem', minHeight: '120px',
  },
  qText: {
    fontFamily: 'Georgia, serif', fontSize: '1rem',
    color: '#1a1a1a', lineHeight: '1.8',
  },
  options: { display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  option: {
    display: 'flex', alignItems: 'flex-start', gap: '0.875rem',
    padding: '0.875rem 1rem',
    background: 'white', border: '1px solid #ddd', borderRadius: '4px',
    cursor: 'pointer', textAlign: 'left', width: '100%',
    transition: 'border-color 0.15s', position: 'relative',
  },
  optionSelected: { borderColor: '#0066cc', background: '#f0f4ff' },
  optBubble: {
    width: '28px', height: '28px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-sans)', fontSize: '0.85rem', fontWeight: '700',
    flexShrink: 0, transition: 'all 0.15s',
  },
  optText: { fontFamily: 'Georgia, serif', fontSize: '0.95rem', color: '#1a1a1a', lineHeight: '1.6', flex: 1 },
  optKey: { fontFamily: 'var(--font-sans)', fontSize: '0.65rem', color: '#aaa', flexShrink: 0 },
  actions: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    padding: '0.75rem 0', borderTop: '1px solid #e0e0e0', flexWrap: 'wrap',
  },
  markBtn: {
    padding: '0.6rem 1rem', background: '#7B1FA2', color: 'white',
    border: 'none', borderRadius: '4px', fontFamily: 'var(--font-sans)',
    fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer',
  },
  clearBtn: {
    padding: '0.6rem 1rem', background: 'white', color: '#333',
    border: '1px solid #ccc', borderRadius: '4px', fontFamily: 'var(--font-sans)',
    fontSize: '0.82rem', cursor: 'pointer',
  },
  prevBtn: {
    padding: '0.6rem 1.25rem', background: 'white', color: '#0066cc',
    border: '1px solid #0066cc', borderRadius: '4px', fontFamily: 'var(--font-sans)',
    fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer',
  },
  nextBtn: {
    padding: '0.6rem 1.5rem', background: '#0066cc', color: 'white',
    border: 'none', borderRadius: '4px', fontFamily: 'var(--font-sans)',
    fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer',
  },
  scratch: { marginTop: '0.5rem' },
  scratchLabel: { fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: '#666', marginBottom: '0.3rem' },
  scratchArea: {
    width: '100%', height: '120px', padding: '0.75rem',
    fontFamily: 'monospace', fontSize: '0.875rem',
    border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical',
  },
  sidebar: {
    width: '220px', flexShrink: 0, borderLeft: '1px solid #ddd',
    background: 'white', overflowY: 'auto', padding: '1rem',
    display: 'flex', flexDirection: 'column', gap: '1rem',
  },
  legend: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  paletteWrap: {},
  paletteTitle: { fontFamily: 'var(--font-sans)', fontSize: '0.72rem', fontWeight: '700', color: '#666', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' },
  palette: { display: 'flex', flexWrap: 'wrap', gap: '4px' },
  paletteDot: {
    width: '32px', height: '32px', borderRadius: '4px',
    fontFamily: 'var(--font-sans)', fontSize: '0.72rem', fontWeight: '700',
    cursor: 'pointer', position: 'relative', transition: 'outline 0.1s',
  },
  paletteSubDot: {
    position: 'absolute', bottom: '-3px', right: '-3px',
    width: '8px', height: '8px', borderRadius: '50%',
    background: '#7B1FA2', border: '1px solid white',
  },
  submitBtn: {
    width: '100%', padding: '0.75rem',
    background: '#003399', color: 'white', border: 'none',
    borderRadius: '4px', fontFamily: 'var(--font-sans)',
    fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer',
  },
  shortcuts: { borderTop: '1px solid #f0f0f0', paddingTop: '0.75rem' },
  shortcutsTitle: { fontFamily: 'var(--font-sans)', fontSize: '0.65rem', fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' },
  shortcutRow: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' },
  kbd: {
    background: '#f0f0f0', border: '1px solid #ccc', borderBottom: '2px solid #999',
    borderRadius: '3px', padding: '0.1rem 0.4rem',
    fontFamily: 'monospace', fontSize: '0.72rem', color: '#333',
  },
  shortcutDesc: { fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: '#666' },
}

const leg = {
  wrap: { display: 'flex', alignItems: 'center', gap: '0.4rem' },
  dot: { width: '20px', height: '20px', borderRadius: '3px', flexShrink: 0, position: 'relative' },
  label: { fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: '#555' },
}

const res = {
  wrap: { padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  header: {
    background: 'white', border: '1px solid var(--gray-200)',
    borderRadius: 'var(--radius-md)', padding: '1.5rem',
    display: 'flex', flexDirection: 'column', gap: '1.25rem',
  },
  scoreSection: { display: 'flex', alignItems: 'center', gap: '1.5rem' },
  scoreTitle: { fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: '700', color: 'var(--black)' },
  scoreSubtitle: { fontFamily: 'var(--font-sans)', fontSize: '0.82rem', color: 'var(--gray-500)', marginTop: '0.3rem' },
  statsStrip: { display: 'flex', gap: '1.5rem', padding: '1rem 0', borderTop: '1px solid var(--gray-100)', flexWrap: 'wrap' },
  reviewToggle: {
    background: 'none', border: '1px solid var(--gray-200)',
    borderRadius: 'var(--radius)', padding: '0.6rem 1rem',
    fontFamily: 'var(--font-sans)', fontSize: '0.85rem',
    color: 'var(--black)', cursor: 'pointer', textAlign: 'left',
  },
  reviewList: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  reviewItem: { padding: '1rem 1.25rem', borderRadius: 'var(--radius)' },
  reviewHeader: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' },
  reviewQNum: { fontFamily: 'var(--font-sans)', fontSize: '0.72rem', fontWeight: '700', color: '#666' },
  reviewStatus: { fontFamily: 'var(--font-sans)', fontSize: '0.78rem', fontWeight: '700' },
  reviewQText: { fontFamily: 'Georgia, serif', fontSize: '0.9rem', color: '#333', lineHeight: '1.6', marginBottom: '0.5rem' },
  reviewCorrect: { fontFamily: 'var(--font-sans)', fontSize: '0.82rem', color: '#166534', marginBottom: '0.3rem' },
  reviewExp: { fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: '#555', lineHeight: '1.5', fontStyle: 'italic' },
}

const calc = {
  overlay: {
    position: 'fixed', top: '80px', right: '240px',
    zIndex: 500, boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
    borderRadius: '8px', overflow: 'hidden',
  },
  box: { background: '#1a1a1a', width: '220px' },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '0.5rem 0.75rem', background: '#003399',
  },
  title: { fontFamily: 'var(--font-sans)', fontSize: '0.78rem', fontWeight: '700', color: 'white' },
  close: { background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1rem' },
  display: {
    padding: '0.75rem 1rem', background: '#111',
    fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: '700',
    color: '#4ade80', textAlign: 'right', minHeight: '52px',
    wordBreak: 'break-all',
  },
  opDisplay: {
    padding: '0 1rem 0.25rem', fontFamily: 'monospace',
    fontSize: '0.75rem', color: '#888', textAlign: 'right',
  },
  buttons: { padding: '0.5rem' },
  row: { display: 'flex', gap: '4px', marginBottom: '4px' },
  btn: {
    flex: 1, padding: '0.75rem 0', border: 'none', borderRadius: '4px',
    fontFamily: 'monospace', fontSize: '1rem', fontWeight: '600',
    background: '#333', color: 'white', cursor: 'pointer',
    transition: 'background 0.1s',
  },
  btnEq:    { background: '#003399', flex: 1 },
  btnClear: { background: '#cc3300' },
  btnZero:  { flex: 2 },
}

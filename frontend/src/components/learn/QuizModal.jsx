/**
 * GRADSKOOL — QuizModal
 *
 * Appears after student watches 70% of a video (if has_quiz = true).
 * Handles question display, answer selection, submission, results.
 *
 * States:
 *   idle       → not shown
 *   questions  → showing questions one by one
 *   result     → showing score + feedback
 *   retake     → option to retake (if failed, attempts < 2)
 *   cheatsheet → passed or bypassed, go to cheat sheet
 */
import { useState, useEffect, useRef } from 'react'
import api from '../../lib/api'

export function QuizModal({ examSlug, topicSlug, topicVideo, onComplete, onClose }) {
  const [phase, setPhase]          = useState('questions') // questions | result
  const [current, setCurrent]      = useState(0)
  const [selected, setSelected]    = useState({})          // {questionId: optionId}
  const [result, setResult]        = useState(null)
  const [submitting, setSubmit]    = useState(false)
  const [questions, setQs]         = useState([])
  const [loadingQs, setLoadingQs]  = useState(true)
  const [timeStart]                = useState(Date.now())

  // Load questions on mount
  useEffect(() => {
    const load = async () => {
      try {
        // api imported statically above
        const reshuffle = (topicVideo.quiz_attempts || 0) > 0
        const res = await api.get(
          `/learn/${examSlug}/${topicSlug}/videos/${topicVideo.id}/quiz/`,
          reshuffle ? { params: { reshuffle: 'true' } } : {}
        )
        setQs(res.data.questions || [])
      } catch {
        setQs([])
      } finally {
        setLoadingQs(false)
      }
    }
    load()
  }, [examSlug, topicSlug, topicVideo.id])

  const q = questions[current]
  const isLast = current === questions.length - 1
  const allAnswered = questions.every(q => selected[q.id])

  const handleSelect = (questionId, optionId) => {
    setSelected(prev => ({ ...prev, [questionId]: optionId }))
  }

  const handleNext = () => {
    if (current < questions.length - 1) setCurrent(c => c + 1)
  }

  const handleSubmit = async () => {
    setSubmit(true)
    try {
      // api imported statically above
      const answers = Object.entries(selected).map(([qId, optId]) => ({
        question_id: parseInt(qId),
        selected_option_id: parseInt(optId),
      }))
      const timeTaken = Math.floor((Date.now() - timeStart) / 1000)
      const res = await api.post(
        `/learn/${examSlug}/${topicSlug}/videos/${topicVideo.id}/quiz/submit/`,
        { answers, time_taken_secs: timeTaken }
      )
      setResult(res.data)
      setPhase('result')
    } catch {
      setResult({ error: 'Submission failed. Try again.' })
      setPhase('result')
    } finally {
      setSubmit(false)
    }
  }

  const handleRetake = () => {
    setPhase('questions')
    setCurrent(0)
    setSelected({})
    setResult(null)
    // Reload reshuffled questions
    setLoadingQs(true)
    api.get(`/learn/${examSlug}/${topicSlug}/videos/${topicVideo.id}/quiz/?reshuffle=true`)
        .then(res => setQs(res.data.questions || []))
        .finally(() => setLoadingQs(false))
  }

  return (
    <div style={s.overlay}>
      <div style={s.modal}>

        {/* Header */}
        <div style={s.header}>
          <div>
            <p style={s.eyebrow}>
              {phase === 'result' ? 'Quiz Result' : `Question ${current + 1} of ${questions.length}`}
            </p>
            <h2 style={s.title}>{topicVideo.title}</h2>
          </div>
          {phase === 'result' && result?.next_step === 'cheatsheet' && (
            <button onClick={onClose} style={s.closeBtn}>✕</button>
          )}
        </div>

        {/* Body */}
        {loadingQs ? (
          <div style={s.loading}>
            <div style={s.spinner} />
            <p style={s.loadingText}>Loading questions…</p>
          </div>

        ) : phase === 'questions' && q ? (
          <>
            {/* Progress bar */}
            <div style={s.progressBarWrap}>
              <div style={{ ...s.progressBarFill,
                width: `${((current) / questions.length) * 100}%` }} />
            </div>

            <div style={s.questionBody}>
              <p style={s.questionText}>{q.text}</p>
              <div style={s.options}>
                {q.options.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => handleSelect(q.id, opt.id)}
                    style={{
                      ...s.option,
                      ...(selected[q.id] === opt.id ? s.optionSelected : {}),
                    }}
                  >
                    <span style={s.optKey}>{opt.key}</span>
                    <span style={s.optText}>{opt.text}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={s.footer}>
              {current > 0 && (
                <button onClick={() => setCurrent(c => c - 1)} style={s.btnSecondary}>
                  ← Back
                </button>
              )}
              <div style={{ flex: 1 }} />
              {!isLast ? (
                <button
                  onClick={handleNext}
                  disabled={!selected[q.id]}
                  style={{ ...s.btnPrimary, opacity: selected[q.id] ? 1 : 0.5 }}
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!allAnswered || submitting}
                  style={{ ...s.btnPrimary, opacity: allAnswered && !submitting ? 1 : 0.5 }}
                >
                  {submitting ? 'Submitting…' : 'Submit Quiz'}
                </button>
              )}
            </div>
          </>

        ) : phase === 'result' && result ? (
          <ResultPanel
            result={result}
            onRetake={handleRetake}
            onCheatSheet={() => onComplete('cheatsheet')}
          />
        ) : (
          <div style={s.loading}>
            <p style={s.loadingText}>No questions available.</p>
          </div>
        )}

      </div>
    </div>
  )
}

function ResultPanel({ result, onRetake, onCheatSheet }) {
  const passed  = result.passed
  const score   = result.score_pct || 0
  const bypass  = result.quiz_bypassed

  return (
    <div style={r.wrap}>
      {/* Score ring */}
      <div style={r.scoreWrap}>
        <ScoreRing pct={score} passed={passed} />
      </div>

      <h3 style={r.headline}>
        {passed ? '🎉 Well done!' : bypass ? '📚 Keep going!' : '😅 Not quite!'}
      </h3>
      <p style={r.message}>{result.message}</p>

      {/* Answer summary */}
      {result.correct != null && (
        <p style={r.summary}>
          {result.correct} / {result.total} correct
        </p>
      )}

      {/* Actions */}
      <div style={r.actions}>
        {result.next_step === 'retake' && (
          <>
            <button onClick={onRetake} style={r.retakeBtn}>
              Retake Quiz →
            </button>
            <p style={r.attemptsLeft}>
              {result.attempts_remaining} attempt{result.attempts_remaining !== 1 ? 's' : ''} remaining
            </p>
          </>
        )}

        {result.next_step === 'cheatsheet' && (
          <button onClick={onCheatSheet} style={r.cheatsheetBtn}>
            📄 Open Cheat Sheet →
          </button>
        )}
      </div>

      {/* Answer review */}
      {result.answers_with_feedback?.length > 0 && (
        <details style={r.review}>
          <summary style={r.reviewSummary}>Review answers</summary>
          <div style={r.reviewBody}>
            {result.answers_with_feedback.map((ans, i) => (
              <div key={i} style={{ ...r.answerRow,
                background: ans.is_correct ? '#f0fdf4' : '#fef2f2' }}>
                <span style={r.answerIcon}>{ans.is_correct ? '✓' : '✗'}</span>
                <div style={r.answerDetail}>
                  {!ans.is_correct && (
                    <p style={r.correctAns}>
                      Correct: {ans.correct_option_text}
                    </p>
                  )}
                  {ans.explanation && (
                    <p style={r.explanation}>{ans.explanation}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

function ScoreRing({ pct, passed }) {
  const size = 100, stroke = 10
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  const color = passed ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r}
          fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-serif)', fontSize: '1.5rem',
        fontWeight: '700', color,
      }}>
        {Math.round(pct)}%
      </div>
    </div>
  )
}

// ── STYLES ────────────────────────────────────────────────────────────────────

const s = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '1rem',
  },
  modal: {
    background: 'var(--white)',
    borderRadius: 'var(--radius-md)',
    width: '100%', maxWidth: '600px',
    maxHeight: '90vh', overflowY: 'auto',
    display: 'flex', flexDirection: 'column',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '1.5rem 1.5rem 1rem',
    borderBottom: '1px solid var(--gray-100)',
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
  closeBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: '1.1rem', color: 'var(--gray-400)', padding: '0.25rem',
  },
  progressBarWrap: {
    height: '3px', background: 'var(--gray-100)', margin: '0 1.5rem',
  },
  progressBarFill: {
    height: '100%', background: 'var(--red)',
    transition: 'width 0.3s ease',
  },
  loading: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '3rem',
    gap: '1rem',
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
  questionBody: { padding: '1.5rem' },
  questionText: {
    fontFamily: 'var(--font-serif)', fontSize: '1rem',
    color: 'var(--black)', lineHeight: '1.6', marginBottom: '1.25rem',
  },
  options: { display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  option: {
    display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
    padding: '0.875rem 1rem',
    border: '1.5px solid var(--gray-200)', borderRadius: 'var(--radius)',
    background: 'var(--white)', cursor: 'pointer',
    textAlign: 'left', transition: 'border-color 0.15s, background 0.15s',
    width: '100%',
  },
  optionSelected: {
    borderColor: 'var(--black)', background: 'var(--gray-50)',
  },
  optKey: {
    fontFamily: 'var(--font-sans)', fontSize: '0.8rem', fontWeight: '700',
    color: 'var(--gray-400)', flexShrink: 0, width: '18px',
  },
  optText: {
    fontFamily: 'var(--font-sans)', fontSize: '0.875rem',
    color: 'var(--black)', lineHeight: '1.5',
  },
  footer: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    padding: '1rem 1.5rem',
    borderTop: '1px solid var(--gray-100)',
  },
  btnPrimary: {
    background: 'var(--black)', color: 'var(--white)',
    border: 'none', borderRadius: 'var(--radius)',
    padding: '0.7rem 1.5rem',
    fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: '600',
    cursor: 'pointer',
  },
  btnSecondary: {
    background: 'none', border: '1px solid var(--gray-200)',
    borderRadius: 'var(--radius)', padding: '0.7rem 1rem',
    fontFamily: 'var(--font-sans)', fontSize: '0.875rem',
    color: 'var(--gray-500)', cursor: 'pointer',
  },
}

const r = {
  wrap: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', padding: '2rem 1.5rem',
    gap: '1rem',
  },
  scoreWrap: { marginBottom: '0.5rem' },
  headline: {
    fontFamily: 'var(--font-serif)', fontSize: '1.4rem',
    fontWeight: '700', color: 'var(--black)',
  },
  message: {
    fontFamily: 'var(--font-serif)', fontSize: '0.95rem',
    color: 'var(--gray-600)', textAlign: 'center',
    lineHeight: '1.6', maxWidth: '400px',
  },
  summary: {
    fontFamily: 'var(--font-sans)', fontSize: '0.85rem',
    color: 'var(--gray-400)',
  },
  actions: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
    marginTop: '0.5rem',
  },
  retakeBtn: {
    background: 'var(--black)', color: 'var(--white)',
    border: 'none', borderRadius: 'var(--radius)',
    padding: '0.8rem 2rem',
    fontFamily: 'var(--font-sans)', fontSize: '0.9rem', fontWeight: '600',
    cursor: 'pointer',
  },
  cheatsheetBtn: {
    background: 'var(--red)', color: 'var(--white)',
    border: 'none', borderRadius: 'var(--radius)',
    padding: '0.8rem 2rem',
    fontFamily: 'var(--font-sans)', fontSize: '0.9rem', fontWeight: '600',
    cursor: 'pointer',
  },
  attemptsLeft: {
    fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'var(--gray-400)',
  },
  review: { width: '100%', marginTop: '0.5rem' },
  reviewSummary: {
    fontFamily: 'var(--font-sans)', fontSize: '0.8rem',
    color: 'var(--red)', cursor: 'pointer',
    padding: '0.5rem 0',
  },
  reviewBody: { display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' },
  answerRow: {
    display: 'flex', gap: '0.75rem', padding: '0.75rem',
    borderRadius: 'var(--radius)',
  },
  answerIcon: { fontSize: '1rem', flexShrink: 0 },
  answerDetail: { flex: 1 },
  correctAns: {
    fontFamily: 'var(--font-sans)', fontSize: '0.8rem',
    color: '#166534', fontWeight: '600', marginBottom: '0.3rem',
  },
  explanation: {
    fontFamily: 'var(--font-sans)', fontSize: '0.78rem',
    color: 'var(--gray-500)', lineHeight: '1.5',
  },
}

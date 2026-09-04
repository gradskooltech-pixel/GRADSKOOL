/**
 * GRADSKOOL — Mock Test Result
 * Route: /mocks/result/[attemptId]
 */
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { ProtectedRoute } from '../../../components/auth/ProtectedRoute'
import api from '../../../lib/api'

const C = {
  red: '#ff5e5f', black: '#0f0f0f', white: '#fff', bg: '#f7f6f3',
  border: '#e8e8e6', gray: '#999', green: '#22c55e', amber: '#f59e0b', muted: '#f4f3f0',
}

export default function ResultPage() { return <ProtectedRoute><Inner /></ProtectedRoute> }

function Inner() {
  const router = useRouter()
  const { attemptId } = router.query
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showReview, setShowReview] = useState(false)

  const load = useCallback(() => {
    if (!attemptId) return
    setLoading(true)
    api.get(`/mocks/attempts/${attemptId}/result/`).then(({ data }) => setResult(data)).finally(() => setLoading(false))
  }, [attemptId])
  useEffect(() => { load() }, [load])

  if (loading || !result) return <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ fontFamily: 'Georgia,serif', color: C.gray }}>Loading…</p></div>

  const sections = Object.entries(result.section_breakdown || {})

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <Head><title>Result — GRADSKOOL</title></Head>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <Link href={`/mocks/${result.exam_slug}`} style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: C.gray, textDecoration: 'none' }}>← Back to Mock Tests</Link>

        <div style={{ background: C.black, borderRadius: '12px', padding: '2rem', margin: '1.25rem 0 1.75rem', color: '#fff', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>
            {result.mode === 'full' ? 'Full Mock' : result.mode === 'sectional' ? 'Sectional' : 'Topic-wise'} Result{result.is_auto_submitted ? ' (auto-submitted — time ran out)' : ''}
          </p>
          <p style={{ fontFamily: 'Georgia,serif', fontSize: '3rem', fontWeight: 700, lineHeight: 1 }}>{result.score}</p>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.5rem' }}>out of {result.total_questions * 3} max</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.75rem' }}>
          <StatBox label="Correct" value={result.correct} color={C.green} />
          <StatBox label="Incorrect" value={result.incorrect} color={C.red} />
          <StatBox label="Unattempted" value={result.unattempted} color={C.gray} />
        </div>

        {sections.length > 0 && (
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '1.25rem', marginBottom: '1.75rem' }}>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.gray, marginBottom: '1rem' }}>Section Breakdown</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {sections.map(([name, b]) => (
                <div key={name} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', paddingBottom: '0.75rem', borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.875rem' }}>{name}</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontFamily: 'var(--font-sans)', fontSize: '0.8rem' }}>
                    <span style={{ color: C.green }}>{b.correct} ✓</span>
                    <span style={{ color: C.red }}>{b.incorrect} ✗</span>
                    <span style={{ color: C.gray }}>{b.unattempted} —</span>
                    <span style={{ fontWeight: 700 }}>{b.score} pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={() => setShowReview(v => !v)} style={{ width: '100%', padding: '0.875rem', background: C.white, border: `1px solid ${C.border}`, borderRadius: '6px', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', marginBottom: '1.5rem' }}>
          {showReview ? 'Hide' : 'Review'} Answers & Explanations {showReview ? '▲' : '▼'}
        </button>

        {showReview && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {result.responses.map((r, i) => (
              <div key={r.question_id} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.7rem', fontWeight: 700, color: C.gray }}>Q{i + 1}</span>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.7rem', fontWeight: 700, color: r.is_correct === true ? C.green : r.is_correct === false ? C.red : C.gray }}>
                    {r.is_correct === true ? `+${r.marks_awarded}` : r.is_correct === false ? r.marks_awarded : 'Not attempted'}
                  </span>
                </div>
                <p style={{ fontFamily: 'Georgia,serif', fontSize: '0.9rem', color: C.black, marginBottom: '0.75rem' }} dangerouslySetInnerHTML={{ __html: r.question_text }} />
                {r.question_type === 'MCQ' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.75rem' }}>
                    {r.options.map(opt => {
                      const isCorrect = opt.key === r.correct_option
                      const isSelected = opt.key === r.selected_option
                      return (
                        <div key={opt.key} style={{
                          padding: '0.5rem 0.75rem', borderRadius: '4px', fontFamily: 'var(--font-sans)', fontSize: '0.82rem',
                          background: isCorrect ? '#f0fdf4' : isSelected ? '#fff5f5' : C.muted,
                          border: `1px solid ${isCorrect ? '#86efac' : isSelected ? '#fca5a5' : C.border}`,
                        }}>
                          <strong>{opt.key}.</strong> {opt.text} {isCorrect && ' ✓ Correct'}{isSelected && !isCorrect && ' ✗ Your answer'}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>
                    Correct answer: <strong>{r.tita_answer}</strong> — Your answer: <strong>{r.selected_option || '—'}</strong>
                  </p>
                )}
                {r.explanation && <p style={{ fontFamily: 'Georgia,serif', fontSize: '0.82rem', color: C.gray, fontStyle: 'italic', lineHeight: 1.6 }}>{r.explanation}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatBox({ label, value, color }) {
  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '1.25rem', textAlign: 'center' }}>
      <p style={{ fontFamily: 'Georgia,serif', fontSize: '1.75rem', fontWeight: 700, color, lineHeight: 1, marginBottom: '0.25rem' }}>{value}</p>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.7rem', color: C.gray, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
    </div>
  )
}

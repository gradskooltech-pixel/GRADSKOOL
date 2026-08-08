/**
 * GRADSKOOL — Quiz Portal (Full CAT-Style)
 * Route: /learn/[examSlug]/[sectionSlug]/quiz?topicVideoId=X
 *
 * Features:
 *  - CAT-style palette (attempted / marked / unanswered / skipped)
 *  - Countdown timer (admin-set duration per video)
 *  - Difficulty tags per question (easy / medium / hard)
 *  - Adaptive mode: auto-picks difficulty based on last score
 *  - TITA questions (type-in-the-answer, no options)
 *  - Multi-correct MCQ support
 *  - +3 / −1 / 0 marking (configurable per question)
 *  - Filter questions by difficulty
 *  - Mark for review
 *  - Full result analysis with section breakdown
 *  - Wrong answer highlight + explanation
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ProtectedRoute } from '../../../../components/auth/ProtectedRoute'
import api from '../../../../lib/api'

const C = {
  bg:      '#0f0f0f',
  panel:   '#1a1a1a',
  surface: '#242424',
  border:  '#333',
  white:   '#fff',
  gray:    'rgba(255,255,255,0.45)',
  red:     '#ff5e5f',
  green:   '#22c55e',
  amber:   '#f59e0b',
  blue:    '#3b82f6',
  purple:  '#a78bfa',
}

const DIFF_COLOR = { easy: '#22c55e', medium: '#f59e0b', hard: '#ef4444' }
const DIFF_BG    = { easy: 'rgba(34,197,94,0.15)', medium: 'rgba(245,158,11,0.15)', hard: 'rgba(239,68,68,0.15)' }

// Question state
const QS = {
  unanswered: { bg:'#333',                border:'#444', label:'Not answered' },
  answered:   { bg:'#1d4ed8',             border:'#3b82f6', label:'Answered' },
  marked:     { bg:'rgba(167,139,250,.3)',  border:'#a78bfa', label:'Marked for review' },
  skipped:    { bg:'rgba(255,255,255,.08)', border:'#555', label:'Visited but not answered' },
}

export default function QuizPage() {
  return <ProtectedRoute><QuizInner /></ProtectedRoute>
}

function QuizInner() {
  const router     = useRouter()
  const { examSlug, sectionSlug } = router.query
  const topicVideoId = router.query.topicVideoId || router.query.topic

  const [loading,    setLoad]     = useState(true)
  const [questions,  setQs]       = useState([])
  const [meta,       setMeta]     = useState({})       // duration_mins, title etc
  const [current,    setCurrent]  = useState(0)
  const [answers,    setAnswers]  = useState({})        // {qId: selectedKey or text}
  const [marked,     setMarked]   = useState(new Set())
  const [visited,    setVisited]  = useState(new Set())
  const [timerSecs,  setTimer]    = useState(null)
  const [result,     setResult]   = useState(null)
  const [showPalette,setPalette]  = useState(false)
  const [diffFilter, setDiffFilter] = useState('all')
  const [adaptiveMode, setAdaptiveMode] = useState(false)
  const [tiitaInput, setTitaInput] = useState('')

  const timerRef = useRef(null)

  // Load questions
  useEffect(() => {
    if (!examSlug || !sectionSlug || !topicVideoId) return
    setLoad(true)
    const params = new URLSearchParams({ adaptive: adaptiveMode })
    if (diffFilter !== 'all') params.set('difficulty', diffFilter)

    api.get(`/learn/${examSlug}/${sectionSlug}/videos/${topicVideoId}/quiz/?${params}`)
      .then(({ data }) => {
        setQs(data.questions || [])
        setMeta(data)
        setTimer((data.duration_mins || 40) * 60)
        setAnswers({})
        setMarked(new Set())
        setVisited(new Set([0]))
        setCurrent(0)
        setResult(null)
      })
      .catch(() => {
        // Demo fallback
        const demo = buildDemoQuestions()
        setQs(demo)
        setMeta({ duration_mins: 15, total_questions: demo.length })
        setTimer(15 * 60)
        setVisited(new Set([0]))
      })
      .finally(() => setLoad(false))
  }, [examSlug, sectionSlug, topicVideoId, adaptiveMode, diffFilter])

  // Timer
  useEffect(() => {
    if (timerSecs === null || result) return
    if (timerSecs <= 0) { submitQuiz(); return }
    timerRef.current = setTimeout(() => setTimer(t => t - 1), 1000)
    return () => clearTimeout(timerRef.current)
  }, [timerSecs, result])

  const fmtTime = (s) => {
    const m = Math.floor(s / 60)
    const ss = s % 60
    return `${m}:${ss.toString().padStart(2,'0')}`
  }

  const q = questions[current]

  const navigate = (idx) => {
    setCurrent(idx)
    setVisited(v => new Set([...v, idx]))
    setTitaInput(answers[questions[idx]?.id] || '')
  }

  const selectOption = (key) => {
    if (!q) return
    if (q.question_type === 'mcq_multi') {
      // Toggle in multi-correct
      const current_ans = answers[q.id] ? answers[q.id].split(',') : []
      const updated = current_ans.includes(key)
        ? current_ans.filter(k => k !== key)
        : [...current_ans, key]
      setAnswers(a => ({ ...a, [q.id]: updated.sort().join(',') }))
    } else {
      setAnswers(a => ({ ...a, [q.id]: key }))
    }
  }

  const saveTita = () => {
    if (!q || q.question_type !== 'tita') return
    setAnswers(a => ({ ...a, [q.id]: tiitaInput.trim() }))
  }

  const toggleMark = () => {
    setMarked(m => {
      const n = new Set(m)
      n.has(current) ? n.delete(current) : n.add(current)
      return n
    })
  }

  const clearResponse = () => {
    if (!q) return
    setAnswers(a => { const n = {...a}; delete n[q.id]; return n })
    setTitaInput('')
  }

  const submitQuiz = useCallback(() => {
    clearTimeout(timerRef.current)
    let correct = 0, wrong = 0, unattempted = 0
    let total_marks = 0
    const max_marks = questions.length * 3

    const detailed = questions.map(q => {
      const ans = answers[q.id]
      const isAttempted = ans !== undefined && ans !== ''

      let is_correct = false
      let q_marks = 0

      if (isAttempted) {
        if (q.question_type === 'tita') {
          is_correct = parseFloat(ans) === parseFloat(q.correct_answer)
        } else if (q.question_type === 'mcq_multi') {
          const given = (ans || '').split(',').sort().join(',')
          const expected = (q.correct_answer || '').split(',').sort().join(',')
          is_correct = given === expected
        } else {
          is_correct = ans?.toUpperCase() === q.correct_answer?.toUpperCase()
        }

        const mc = parseFloat(q.marks_correct || 3)
        const mw = parseFloat(q.marks_wrong   || -1)
        q_marks = is_correct ? mc : mw
        if (is_correct) correct++; else wrong++
        total_marks += q_marks
      } else {
        unattempted++
      }

      return {
        ...q,
        selected:    ans,
        is_correct,
        q_marks,
        is_attempted: isAttempted,
      }
    })

    const score_pct = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0

    const diff_breakdown = {}
    for (const q of detailed) {
      const d = q.difficulty || 'medium'
      if (!diff_breakdown[d]) diff_breakdown[d] = { correct: 0, total: 0 }
      diff_breakdown[d].total++
      if (q.is_correct) diff_breakdown[d].correct++
    }

    setResult({
      correct, wrong, unattempted,
      total_marks: Math.round(total_marks * 10) / 10,
      max_marks,
      score_pct,
      detailed,
      diff_breakdown,
      time_taken: (meta.duration_mins || 40) * 60 - timerSecs,
    })

    // Submit to backend
    const submit_payload = {
      topic_video_id: topicVideoId,
      answers: detailed.map(q => ({
        question_id: q.id,
        selected:    q.selected,
        is_correct:  q.is_correct,
      })),
      score_pct,
      correct,
      wrong,
      unattempted,
    }
    api.post(`/learn/${examSlug}/${sectionSlug}/videos/${topicVideoId}/quiz/submit/`, submit_payload).catch(() => {})
    api.post('/learn/check-badges/', { exam_slug: examSlug }).catch(() => {})
  }, [questions, answers, timerSecs, topicVideoId, examSlug, sectionSlug, meta])

  const getQState = (idx) => {
    const qid = questions[idx]?.id
    if (answers[qid] !== undefined && answers[qid] !== '') return 'answered'
    if (marked.has(idx)) return 'marked'
    if (visited.has(idx)) return 'skipped'
    return 'unanswered'
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <p style={{ fontFamily:'Georgia,serif', color:C.gray }}>Loading quiz…</p>
    </div>
  )

  // ── RESULT SCREEN ────────────────────────────────────────────────────────
  if (result) {
    const pct = result.score_pct
    const color = pct >= 70 ? C.green : pct >= 40 ? C.amber : C.red
    const mins = Math.floor(result.time_taken / 60)
    const secs = result.time_taken % 60

    return (
      <div style={{ minHeight:'100vh', background:C.bg, color:C.white }}>
        <Head><title>Quiz Result — GRADSKOOL</title></Head>

        <div style={{ maxWidth:'800px', margin:'0 auto', padding:'2rem 1rem' }}>
          {/* Score hero */}
          <div style={{ background:C.panel, border:'1px solid '+C.border, borderRadius:'12px', padding:'2rem', textAlign:'center', marginBottom:'1.5rem' }}>
            <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.7rem', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.12em', color:C.gray, marginBottom:'0.5rem' }}>Quiz Complete</p>
            <div style={{ fontSize:'4rem', lineHeight:1, fontWeight:'700', color, fontFamily:'Georgia,serif', marginBottom:'0.5rem' }}>
              {pct}%
            </div>
            <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.9rem', color:C.gray }}>
              {pct >= 70 ? '🎉 Excellent! You\'ve mastered this topic.' : pct >= 40 ? '📈 Good effort. Review the explanations.' : '📚 Needs work — revisit the video and try again.'}
            </p>
          </div>

          {/* CAT score grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(100px,1fr))', gap:'0.75rem', marginBottom:'1.5rem' }}>
            {[
              ['Correct',     result.correct,          C.green],
              ['Wrong',       result.wrong,             C.red],
              ['Skipped',     result.unattempted,       C.gray],
              ['CAT Score',   result.total_marks + '/' + result.max_marks, color],
              ['Time',        mins + 'm ' + secs + 's', C.blue],
            ].map(([label, val, c]) => (
              <div key={label} style={{ background:C.panel, border:'1px solid '+C.border, borderRadius:'8px', padding:'1rem', textAlign:'center' }}>
                <p style={{ fontFamily:'Georgia,serif', fontSize:'1.5rem', fontWeight:'700', color:c, lineHeight:1, marginBottom:'0.2rem' }}>{val}</p>
                <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.62rem', color:C.gray }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Difficulty breakdown */}
          {Object.keys(result.diff_breakdown).length > 0 && (
            <div style={{ background:C.panel, border:'1px solid '+C.border, borderRadius:'8px', padding:'1.25rem', marginBottom:'1.5rem' }}>
              <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.1em', color:C.gray, marginBottom:'0.875rem' }}>By Difficulty</p>
              <div style={{ display:'flex', gap:'1.5rem' }}>
                {Object.entries(result.diff_breakdown).map(([diff, stats]) => (
                  <div key={diff}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.375rem', marginBottom:'0.375rem' }}>
                      <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.7rem', fontWeight:'700', padding:'0.1rem 0.5rem', borderRadius:'100px', background: DIFF_BG[diff] || DIFF_BG.medium, color: DIFF_COLOR[diff] || C.amber }}>
                        {diff}
                      </span>
                    </div>
                    <p style={{ fontFamily:'Georgia,serif', fontSize:'1.25rem', fontWeight:'700', color:C.white }}>
                      {stats.correct}/{stats.total}
                    </p>
                    <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.62rem', color:C.gray }}>
                      {Math.round(stats.correct / stats.total * 100)}%
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Question review */}
          <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.1em', color:C.gray, marginBottom:'0.875rem' }}>
            Question Review
          </p>
          {result.detailed.map((q, i) => (
            <div key={q.id} style={{ background:C.panel, border:'1px solid '+(q.is_correct?'#166534':q.is_attempted?'#991b1b':C.border), borderRadius:'8px', padding:'1.25rem', marginBottom:'0.75rem' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.75rem' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                  <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', color:C.gray }}>Q{i+1}</span>
                  <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.62rem', padding:'0.1rem 0.4rem', borderRadius:'3px', background: DIFF_BG[q.difficulty] || DIFF_BG.medium, color: DIFF_COLOR[q.difficulty] || C.amber }}>
                    {q.difficulty || 'medium'}
                  </span>
                  {q.question_type === 'tita' && (
                    <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.62rem', padding:'0.1rem 0.4rem', borderRadius:'3px', background:'rgba(167,139,250,0.15)', color:C.purple }}>TITA</span>
                  )}
                </div>
                <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', fontWeight:'700', color:q.is_correct?C.green:q.is_attempted?C.red:C.gray }}>
                  {q.is_correct ? '+'+q.q_marks : q.is_attempted ? q.q_marks : '0 (skipped)'}
                </span>
              </div>

              <p style={{ fontFamily:'Georgia,serif', fontSize:'0.9rem', color:C.white, lineHeight:1.7, marginBottom:'1rem' }}>{q.text}</p>

              {q.question_type === 'tita' ? (
                <div style={{ display:'flex', gap:'1rem', marginBottom:'0.75rem' }}>
                  <div style={{ padding:'0.5rem 0.875rem', borderRadius:'4px', background:'rgba(255,255,255,0.05)', border:'1px solid '+C.border }}>
                    <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:C.gray }}>Your answer: </span>
                    <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', color:q.is_correct?C.green:C.red }}>{q.selected || '—'}</span>
                  </div>
                  {!q.is_correct && (
                    <div style={{ padding:'0.5rem 0.875rem', borderRadius:'4px', background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)' }}>
                      <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:C.gray }}>Correct: </span>
                      <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', color:C.green }}>{q.correct_answer}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.375rem', marginBottom:'0.75rem' }}>
                  {q.options?.map(opt => {
                    const isSelected = q.question_type === 'mcq_multi'
                      ? (q.selected || '').includes(opt.key)
                      : q.selected === opt.key
                    const isCorrect  = (q.correct_answer || '').includes(opt.key)
                    const bg = isCorrect ? 'rgba(34,197,94,0.15)' : isSelected ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.03)'
                    const border = isCorrect ? 'rgba(34,197,94,0.5)' : isSelected ? 'rgba(239,68,68,0.5)' : C.border
                    const color = isCorrect ? C.green : isSelected ? C.red : C.gray
                    return (
                      <div key={opt.key} style={{ padding:'0.5rem 0.75rem', borderRadius:'4px', background:bg, border:'1px solid '+border, display:'flex', gap:'0.5rem', alignItems:'center' }}>
                        <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', fontWeight:'700', color, flexShrink:0 }}>{opt.key}.</span>
                        <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', color, flex:1 }}>{opt.text}</span>
                        {isCorrect && <span style={{ color:C.green, flexShrink:0 }}>✓</span>}
                        {isSelected && !isCorrect && <span style={{ color:C.red, flexShrink:0 }}>✗</span>}
                      </div>
                    )
                  })}
                </div>
              )}

              {q.explanation && (
                <div style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:'6px', padding:'0.875rem 1rem' }}>
                  <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', fontWeight:'700', color:C.amber, marginBottom:'0.3rem' }}>💡 Explanation</p>
                  <p style={{ fontFamily:'Georgia,serif', fontSize:'0.82rem', color:'rgba(255,255,255,0.8)', lineHeight:1.7 }}>{q.explanation}</p>
                </div>
              )}
            </div>
          ))}

          {/* Actions */}
          <div style={{ display:'flex', gap:'0.75rem', marginTop:'1.5rem', flexWrap:'wrap' }}>
            <button onClick={() => { setResult(null); setAnswers({}); setMarked(new Set()); setVisited(new Set([0])); setCurrent(0); setTimer((meta.duration_mins||40)*60) }}
              style={{ padding:'0.75rem 1.5rem', background:C.red, color:C.white, border:'none', borderRadius:'6px', fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'700', cursor:'pointer' }}>
              Retry Quiz
            </button>
            <Link href={'/learn/'+examSlug}
              style={{ padding:'0.75rem 1.5rem', background:C.surface, color:C.white, border:'1px solid '+C.border, borderRadius:'6px', fontFamily:'var(--font-sans)', fontSize:'0.875rem', textDecoration:'none' }}>
              Back to Course
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── QUIZ SCREEN ──────────────────────────────────────────────────────────
  const answered_count = Object.keys(answers).length
  const isUrgent = timerSecs !== null && timerSecs < 120

  return (
    <div style={{ minHeight:'100vh', background:C.bg, color:C.white, display:'flex', flexDirection:'column' }}>
      <Head><title>Quiz — GRADSKOOL</title></Head>

      {/* Top bar */}
      <div style={{ minHeight:'52px', background:C.panel, borderBottom:'1px solid '+C.border, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 1rem', flexShrink:0, flexWrap:'wrap', gap:'0.5rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.875rem' }}>
          <Link href={'/learn/'+examSlug} style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:C.gray, textDecoration:'none' }}>✕</Link>
          <span style={{ color:C.border }}>|</span>
          <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', color:C.white }}>
            {meta.title || (examSlug?.toUpperCase() + ' Quiz')}
          </p>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          {/* Difficulty filter */}
          <div style={{ display:'flex', gap:'0.25rem' }}>
            {['all','easy','medium','hard'].map(d => (
              <button key={d} onClick={() => setDiffFilter(d)}
                style={{ fontFamily:'var(--font-sans)', fontSize:'0.62rem', padding:'0.2rem 0.5rem', borderRadius:'3px', border:'1px solid '+(diffFilter===d?DIFF_COLOR[d]||'#fff':C.border), background:diffFilter===d?(DIFF_BG[d]||'rgba(255,255,255,0.1)'):'transparent', color:diffFilter===d?(DIFF_COLOR[d]||C.white):C.gray, cursor:'pointer' }}>
                {d}
              </button>
            ))}
          </div>

          {/* Adaptive toggle */}
          <label style={{ display:'flex', alignItems:'center', gap:'0.375rem', cursor:'pointer' }}>
            <input type="checkbox" checked={adaptiveMode} onChange={e => setAdaptiveMode(e.target.checked)} />
            <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', color:C.gray }}>Adaptive</span>
          </label>

          {/* Timer */}
          {timerSecs !== null && (
            <div style={{ fontFamily:"'SF Mono',monospace", fontSize:'1rem', fontWeight:'700', color:isUrgent?C.red:C.white, minWidth:'56px', textAlign:'center' }}>
              {fmtTime(timerSecs)}
            </div>
          )}

          {/* Palette toggle */}
          <button onClick={() => setPalette(!showPalette)}
            style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', padding:'0.3rem 0.75rem', border:'1px solid '+C.border, borderRadius:'4px', background:'transparent', color:C.gray, cursor:'pointer' }}>
            Grid
          </button>

          <button onClick={submitQuiz}
            style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:'700', padding:'0.4rem 1.25rem', background:C.red, color:C.white, border:'none', borderRadius:'4px', cursor:'pointer' }}>
            Submit ({answered_count}/{questions.length})
          </button>
        </div>
      </div>

      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        {/* Palette sidebar */}
        {showPalette && (
          <div style={{ width:'200px', background:C.panel, borderRight:'1px solid '+C.border, padding:'1rem', overflowY:'auto', flexShrink:0 }}>
            <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.62rem', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.08em', color:C.gray, marginBottom:'0.875rem' }}>Questions</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'4px', marginBottom:'1rem' }}>
              {questions.map((_, idx) => {
                const qs = getQState(idx)
                return (
                  <button key={idx} onClick={() => navigate(idx)}
                    style={{ width:'32px', height:'32px', borderRadius:'4px', border:'1px solid '+QS[qs].border, background:QS[qs].bg+(current===idx?'99':''), fontFamily:'var(--font-sans)', fontSize:'0.68rem', fontWeight:'700', color:C.white, cursor:'pointer', outline:current===idx?'2px solid '+C.red:'none' }}>
                    {idx+1}
                  </button>
                )
              })}
            </div>
            {/* Legend */}
            {Object.entries(QS).map(([state, cfg]) => (
              <div key={state} style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'4px' }}>
                <div style={{ width:'12px', height:'12px', borderRadius:'2px', background:cfg.bg, border:'1px solid '+cfg.border, flexShrink:0 }} />
                <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.6rem', color:C.gray }}>{cfg.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Question area */}
        <div style={{ flex:1, overflowY:'auto', padding:'2rem', maxWidth:'700px', margin:'0 auto', width:'100%' }}>
          {!q ? (
            <p style={{ fontFamily:'Georgia,serif', color:C.gray, textAlign:'center', padding:'4rem' }}>No questions available.</p>
          ) : (
            <>
              {/* Question header */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                  <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'700', color:C.gray }}>
                    Q{current+1} of {questions.length}
                  </span>
                  <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', padding:'0.15rem 0.5rem', borderRadius:'100px', background: DIFF_BG[q.difficulty] || DIFF_BG.medium, color: DIFF_COLOR[q.difficulty] || C.amber }}>
                    {q.difficulty || 'medium'}
                  </span>
                  {q.question_type === 'tita' && (
                    <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', padding:'0.15rem 0.5rem', borderRadius:'100px', background:'rgba(167,139,250,0.15)', color:C.purple }}>TITA</span>
                  )}
                  {q.question_type === 'mcq_multi' && (
                    <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', padding:'0.15rem 0.5rem', borderRadius:'100px', background:'rgba(59,130,246,0.15)', color:C.blue }}>Multiple correct</span>
                  )}
                </div>
                <div style={{ display:'flex', gap:'0.5rem' }}>
                  <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.62rem', color:C.gray }}>
                    +{q.marks_correct||3} / {q.marks_wrong||'-1'}
                  </span>
                  <button onClick={toggleMark}
                    style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', padding:'0.2rem 0.625rem', border:'1px solid '+(marked.has(current)?C.purple:C.border), borderRadius:'3px', background:marked.has(current)?'rgba(167,139,250,0.15)':'transparent', color:marked.has(current)?C.purple:C.gray, cursor:'pointer' }}>
                    {marked.has(current) ? '🔖 Marked' : '🔖 Mark'}
                  </button>
                </div>
              </div>

              {/* Question text */}
              <p style={{ fontFamily:'Georgia,serif', fontSize:'1.05rem', color:C.white, lineHeight:1.8, marginBottom:'2rem' }}>
                {q.text}
              </p>

              {/* TITA input */}
              {q.question_type === 'tita' ? (
                <div style={{ marginBottom:'1.5rem' }}>
                  <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:C.gray, marginBottom:'0.5rem' }}>
                    Type your answer (numeric)
                  </p>
                  <div style={{ display:'flex', gap:'0.75rem' }}>
                    <input
                      type="text" value={tiitaInput}
                      onChange={e => setTitaInput(e.target.value)}
                      onBlur={saveTita}
                      placeholder="Enter answer…"
                      style={{ padding:'0.75rem 1rem', background:'rgba(255,255,255,0.06)', border:'1px solid '+(answers[q.id]?C.blue:C.border), borderRadius:'6px', color:C.white, fontFamily:"'SF Mono',monospace", fontSize:'1.1rem', width:'160px', outline:'none' }}
                    />
                    <button onClick={saveTita} style={{ padding:'0.75rem 1.25rem', background:C.blue, color:C.white, border:'none', borderRadius:'6px', fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', cursor:'pointer' }}>
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                /* MCQ options */
                <div style={{ display:'flex', flexDirection:'column', gap:'0.625rem', marginBottom:'1.5rem' }}>
                  {q.options?.map(opt => {
                    const isSelected = q.question_type === 'mcq_multi'
                      ? (answers[q.id] || '').includes(opt.key)
                      : answers[q.id] === opt.key
                    return (
                      <button key={opt.key} onClick={() => selectOption(opt.key)}
                        style={{ display:'flex', alignItems:'flex-start', gap:'0.875rem', padding:'1rem 1.25rem', borderRadius:'8px', border:'1px solid '+(isSelected?C.blue:C.border), background:isSelected?'rgba(59,130,246,0.12)':C.surface, cursor:'pointer', textAlign:'left', transition:'all 0.1s' }}
                        onMouseEnter={e => { if(!isSelected) e.currentTarget.style.borderColor='#555' }}
                        onMouseLeave={e => { if(!isSelected) e.currentTarget.style.borderColor=C.border }}>
                        <span style={{ width:'24px', height:'24px', borderRadius:'50%', border:'2px solid '+(isSelected?C.blue:C.border), background:isSelected?C.blue:'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:'1px' }}>
                          {isSelected && <span style={{ color:C.white, fontSize:'0.65rem', fontWeight:'700' }}>✓</span>}
                        </span>
                        <div>
                          <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', fontWeight:'700', color:isSelected?C.blue:C.gray, marginRight:'0.5rem' }}>{opt.key}.</span>
                          <span style={{ fontFamily:'Georgia,serif', fontSize:'0.95rem', color:isSelected?C.white:'rgba(255,255,255,0.75)', lineHeight:1.5 }}>{opt.text}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Navigation */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:'1rem', borderTop:'1px solid '+C.border }}>
                <button onClick={() => navigate(Math.max(0, current - 1))} disabled={current === 0}
                  style={{ padding:'0.625rem 1.25rem', border:'1px solid '+C.border, borderRadius:'6px', background:'transparent', color:current===0?C.border:C.white, cursor:current===0?'not-allowed':'pointer', fontFamily:'var(--font-sans)', fontSize:'0.82rem' }}>
                  ← Prev
                </button>

                <button onClick={clearResponse}
                  style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:C.gray, background:'none', border:'none', cursor:'pointer' }}>
                  Clear response
                </button>

                <button onClick={() => navigate(Math.min(questions.length - 1, current + 1))} disabled={current === questions.length - 1}
                  style={{ padding:'0.625rem 1.25rem', border:'1px solid '+C.border, borderRadius:'6px', background:'transparent', color:current===questions.length-1?C.border:C.white, cursor:current===questions.length-1?'not-allowed':'pointer', fontFamily:'var(--font-sans)', fontSize:'0.82rem' }}>
                  Next →
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function buildDemoQuestions() {
  return [
    { id:1, text:'A train 200m long passes a stationary pole in 10 seconds. What is its speed in km/h?', question_type:'mcq', difficulty:'easy', marks_correct:3, marks_wrong:-1, correct_answer:'B', explanation:'Speed = 200/10 = 20 m/s. Convert: 20 × 18/5 = 72 km/h.', options:[{key:'A',text:'60 km/h'},{key:'B',text:'72 km/h'},{key:'C',text:'80 km/h'},{key:'D',text:'90 km/h'}] },
    { id:2, text:'If 15% of x = 20% of y, what is x:y?', question_type:'mcq', difficulty:'medium', marks_correct:3, marks_wrong:-1, correct_answer:'A', explanation:'15x = 20y → x/y = 20/15 = 4/3', options:[{key:'A',text:'4:3'},{key:'B',text:'3:4'},{key:'C',text:'2:3'},{key:'D',text:'3:2'}] },
    { id:3, text:'A shopkeeper marks up goods by 40% and gives a 20% discount. What is his profit percentage?', question_type:'mcq', difficulty:'medium', marks_correct:3, marks_wrong:-1, correct_answer:'C', explanation:'SP = 140 × 0.8 = 112. Profit = 12%.', options:[{key:'A',text:'8%'},{key:'B',text:'10%'},{key:'C',text:'12%'},{key:'D',text:'20%'}] },
    { id:4, text:'A train covers a distance in 50 minutes if it travels at 48 km/h. What speed would cover the same distance in 40 minutes?', question_type:'tita', difficulty:'hard', marks_correct:3, marks_wrong:0, correct_answer:'60', explanation:'Distance = 48 × 50/60 = 40 km. Speed = 40 × 60/40 = 60 km/h.', options:[] },
    { id:5, text:'Which of the following statements about RC passages are correct? (Select all that apply)', question_type:'mcq_multi', difficulty:'easy', marks_correct:3, marks_wrong:-1, correct_answer:'A,C', explanation:'Read para 1 for main idea. Author\'s tone is always relevant. Paragraph order matters.', options:[{key:'A',text:'First paragraph usually states the main idea'},{key:'B',text:'Skim the passage before reading questions'},{key:'C',text:'Author tone is key to inference questions'},{key:'D',text:'Always read questions before the passage'}] },
  ]
}

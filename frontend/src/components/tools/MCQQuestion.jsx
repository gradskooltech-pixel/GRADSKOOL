/**
 * GRADSKOOL — MCQQuestion
 *
 * Renders a single MCQ question with options.
 * On option select → reveals correct/wrong state + explanation.
 * Timer counts up per question.
 *
 * Props:
 *   question     — Question object from API
 *   onAnswer     — callback(result) after answer revealed
 *   toolSlug     — for the answer-check API call
 *   showNumber   — optional question number label
 */
import { useState, useEffect, useRef } from 'react'
import { useAnswerCheck } from '../../hooks/useToolsBlogDashboard'

export function MCQQuestion({ question, onAnswer, toolSlug, showNumber }) {
  const { checkAnswer } = useAnswerCheck(toolSlug)
  const [selected, setSelected]     = useState(null)
  const [result, setResult]         = useState(null)   // API response
  const [isChecking, setIsChecking] = useState(false)
  const startTime = useRef(Date.now())

  // Reset when question changes
  useEffect(() => {
    setSelected(null)
    setResult(null)
    startTime.current = Date.now()
  }, [question?.id])

  const handleSelect = async (key) => {
    if (result) return  // Already answered
    setSelected(key)
    setIsChecking(true)
    const timeSpent = Math.round((Date.now() - startTime.current) / 1000)
    const res = await checkAnswer({
      questionId: question.id,
      selected: key,
      timeSpent,
    })
    setResult(res)
    setIsChecking(false)
    onAnswer?.({ questionId: question.id, selected: key, result: res, timeSpent })
  }

  if (!question) return null

  const isAnswered = !!result

  return (
    <div style={styles.wrap}>
      {/* Question meta */}
      <div style={styles.meta}>
        {showNumber && (
          <span style={styles.qNum}>Q{showNumber}</span>
        )}
        <div style={styles.tags}>
          {question.difficulty_tag && (
            <span style={{
              ...styles.diffTag,
              ...(DIFF_COLORS[question.difficulty_tag] || DIFF_COLORS.Medium),
            }}>
              {question.difficulty_tag}
            </span>
          )}
          {question.topic_tag && (
            <span style={styles.topicTag}>{question.topic_tag}</span>
          )}
        </div>
      </div>

      {/* Question text */}
      <p style={styles.questionText}>{question.question_text}</p>

      {/* Options */}
      <div style={styles.options}>
        {question.options?.map(opt => {
          const isSelected = selected === opt.key
          const isCorrect  = result?.correct_answer === opt.key
          const isWrong    = isAnswered && isSelected && !result?.is_correct

          return (
            <button
              key={opt.key}
              onClick={() => handleSelect(opt.key)}
              disabled={isAnswered || isChecking}
              style={{
                ...styles.option,
                ...(isSelected && !isAnswered ? styles.optionSelected : {}),
                ...(isAnswered && isCorrect   ? styles.optionCorrect   : {}),
                ...(isWrong                   ? styles.optionWrong     : {}),
              }}
              aria-pressed={isSelected}
            >
              <span style={styles.optionKey}>{opt.key.toUpperCase()}</span>
              <span style={styles.optionText}>{opt.text}</span>
              {isAnswered && isCorrect && (
                <span style={styles.optionIcon}>✓</span>
              )}
              {isWrong && (
                <span style={styles.optionIcon}>✗</span>
              )}
            </button>
          )
        })}
      </div>

      {/* TITA input */}
      {question.question_type === 'tita' && !isAnswered && (
        <TITAInput
          onSubmit={(val) => handleSelect(val)}
          isChecking={isChecking}
        />
      )}

      {/* Result + Explanation */}
      {isAnswered && result && (
        <div style={{
          ...styles.explanation,
          borderLeftColor: result.is_correct ? '#4ade80' : 'var(--red)',
        }}>
          <div style={styles.resultRow}>
            <span style={{
              ...styles.resultLabel,
              color: result.is_correct ? '#16a34a' : 'var(--red)',
            }}>
              {result.is_correct ? '✓ Correct' : '✗ Incorrect'}
            </span>
            <span style={styles.marksLabel}>
              {result.marks_earned > 0 ? `+${result.marks_earned}` : result.marks_earned} marks
            </span>
          </div>
          {result.explanation && (
            <p style={styles.explanationText}>{result.explanation}</p>
          )}
        </div>
      )}
    </div>
  )
}

function TITAInput({ onSubmit, isChecking }) {
  const [val, setVal] = useState('')
  return (
    <div style={tiStyles.wrap}>
      <label style={tiStyles.label}>Type your answer (numeric):</label>
      <div style={tiStyles.row}>
        <input
          type="number"
          value={val}
          onChange={e => setVal(e.target.value)}
          style={tiStyles.input}
          placeholder="Enter answer"
        />
        <button
          onClick={() => onSubmit(val)}
          disabled={!val || isChecking}
          style={tiStyles.btn}
        >
          {isChecking ? '…' : 'Submit'}
        </button>
      </div>
    </div>
  )
}

const DIFF_COLORS = {
  Easy:   { background: '#dcfce7', color: '#15803d' },
  Medium: { background: '#fef9c3', color: '#854d0e' },
  Hard:   { background: '#fee2e2', color: '#991b1b' },
}

const styles = {
  wrap: {
    padding: '1.75rem',
    border: '1px solid var(--gray-200)',
    borderRadius: 'var(--radius)',
    background: 'var(--white)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  meta: {
    display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap',
  },
  qNum: {
    fontFamily: 'var(--font-sans)', fontSize: '0.72rem', fontWeight: '700',
    letterSpacing: '0.08em', color: 'var(--gray-400)',
    background: 'var(--gray-100)', padding: '0.15rem 0.5rem',
    borderRadius: '2px',
  },
  tags: { display: 'flex', gap: '0.4rem', flexWrap: 'wrap' },
  diffTag: {
    fontFamily: 'var(--font-sans)', fontSize: '0.65rem', fontWeight: '700',
    letterSpacing: '0.05em', padding: '0.15rem 0.5rem', borderRadius: '2px',
  },
  topicTag: {
    fontFamily: 'var(--font-sans)', fontSize: '0.65rem', fontWeight: '500',
    color: 'var(--gray-500)', background: 'var(--gray-100)',
    padding: '0.15rem 0.5rem', borderRadius: '2px',
  },
  questionText: {
    fontFamily: 'var(--font-serif)', fontSize: '1rem',
    color: 'var(--black)', lineHeight: '1.75',
  },
  options: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  option: {
    display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
    padding: '0.75rem 1rem',
    border: '1px solid var(--gray-200)',
    borderRadius: 'var(--radius)',
    background: 'var(--white)',
    cursor: 'pointer', textAlign: 'left', width: '100%',
    transition: 'border-color 0.15s, background 0.15s',
    fontFamily: 'inherit',
  },
  optionSelected: {
    borderColor: 'var(--black)',
    background: 'var(--gray-50)',
  },
  optionCorrect: {
    borderColor: '#4ade80',
    background: '#f0fdf4',
  },
  optionWrong: {
    borderColor: 'var(--red)',
    background: 'var(--red-light)',
  },
  optionKey: {
    fontFamily: 'var(--font-sans)', fontSize: '0.75rem', fontWeight: '700',
    color: 'var(--gray-400)', flexShrink: 0, marginTop: '2px',
    minWidth: '16px',
  },
  optionText: {
    fontFamily: 'var(--font-serif)', fontSize: '0.9rem',
    color: 'var(--black)', lineHeight: '1.5', flex: 1,
  },
  optionIcon: {
    flexShrink: 0, fontWeight: '700', fontSize: '0.9rem',
  },
  explanation: {
    padding: '1rem 1.25rem',
    borderLeft: '3px solid',
    background: 'var(--gray-50)',
    display: 'flex', flexDirection: 'column', gap: '0.6rem',
  },
  resultRow: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultLabel: {
    fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: '700',
  },
  marksLabel: {
    fontFamily: 'var(--font-sans)', fontSize: '0.78rem',
    color: 'var(--gray-500)',
    background: 'var(--gray-100)',
    padding: '0.15rem 0.5rem', borderRadius: '2px',
  },
  explanationText: {
    fontFamily: 'var(--font-serif)', fontSize: '0.875rem',
    color: 'var(--gray-700)', lineHeight: '1.7',
  },
}

const tiStyles = {
  wrap: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  label: {
    fontFamily: 'var(--font-sans)', fontSize: '0.8rem',
    fontWeight: '500', color: 'var(--gray-600)',
  },
  row: { display: 'flex', gap: '0.5rem' },
  input: {
    flex: 1, padding: '0.65rem 0.75rem',
    border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)',
    fontFamily: 'var(--font-sans)', fontSize: '0.9rem',
    outline: 'none',
  },
  btn: {
    padding: '0.65rem 1.25rem',
    background: 'var(--black)', color: 'var(--white)',
    border: 'none', borderRadius: 'var(--radius)',
    fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: '600',
    cursor: 'pointer',
  },
}

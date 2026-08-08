/**
 * GRADSKOOL — VocabFlashcard
 *
 * A single GRE vocabulary flashcard.
 * Front: word + etymology hint.
 * Back (on flip): definition + example + synonyms.
 * Swipe/keyboard navigation between cards.
 */
import { useState } from 'react'

export function VocabFlashcard({ word, onNext, onPrev, current, total }) {
  const [flipped, setFlipped] = useState(false)

  // Reset flip state when word changes
  if (!word) return null

  const DIFF_COLORS = {
    high:   { bg: '#fee2e2', color: '#991b1b', label: 'High Frequency' },
    medium: { bg: '#fef9c3', color: '#854d0e', label: 'Medium Frequency' },
    low:    { bg: '#f3f4f6', color: '#374151', label: 'Low Frequency' },
  }
  const diff = DIFF_COLORS[word.difficulty] || DIFF_COLORS.medium

  return (
    <div style={styles.wrap}>
      {/* Progress */}
      <div style={styles.progress}>
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${(current / total) * 100}%` }} />
        </div>
        <span style={styles.progressLabel}>{current} / {total}</span>
      </div>

      {/* Card */}
      <div
        style={styles.card}
        onClick={() => setFlipped(f => !f)}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && setFlipped(f => !f)}
        aria-label={flipped ? 'Click to see word' : 'Click to reveal definition'}
      >
        {!flipped ? (
          // Front
          <div style={styles.front}>
            <span style={{ ...styles.diffBadge, background: diff.bg, color: diff.color }}>
              {diff.label}
            </span>
            <h2 style={styles.word}>{word.word}</h2>
            {word.etymology && (
              <p style={styles.etymology}>
                <em>Etymology: </em>{word.etymology}
              </p>
            )}
            <p style={styles.flipHint}>Click to reveal definition</p>
          </div>
        ) : (
          // Back
          <div style={styles.back}>
            <p style={styles.backWord}>{word.word}</p>
            <p style={styles.definition}>{word.definition}</p>
            {word.example && (
              <p style={styles.example}>
                <em>"{word.example}"</em>
              </p>
            )}
            {word.synonyms && (
              <div style={styles.synonymsRow}>
                <span style={styles.synonymsLabel}>Synonyms: </span>
                <span style={styles.synonyms}>{word.synonyms}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={styles.nav}>
        <button
          onClick={() => { setFlipped(false); onPrev?.() }}
          disabled={current <= 1}
          style={{ ...styles.navBtn, ...(current <= 1 ? styles.navBtnDisabled : {}) }}
        >
          ← Previous
        </button>
        <button
          onClick={() => setFlipped(false)}
          style={styles.flipBtn}
        >
          {flipped ? 'See word' : 'See definition'}
        </button>
        <button
          onClick={() => { setFlipped(false); onNext?.() }}
          disabled={current >= total}
          style={{ ...styles.navBtn, ...(current >= total ? styles.navBtnDisabled : {}) }}
        >
          Next →
        </button>
      </div>
    </div>
  )
}

const styles = {
  wrap: {
    display: 'flex', flexDirection: 'column', gap: '1.5rem',
    maxWidth: '560px', margin: '0 auto',
  },
  progress: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
  },
  progressBar: {
    flex: 1, height: '4px',
    background: 'var(--gray-200)', borderRadius: '2px', overflow: 'hidden',
  },
  progressFill: {
    height: '100%', background: 'var(--red)',
    borderRadius: '2px', transition: 'width 0.3s',
  },
  progressLabel: {
    fontFamily: 'var(--font-sans)', fontSize: '0.75rem',
    color: 'var(--gray-400)', flexShrink: 0,
  },
  card: {
    background: 'var(--white)',
    border: '1px solid var(--gray-200)',
    borderRadius: 'var(--radius-md)',
    minHeight: '280px',
    padding: '2.5rem 2rem',
    cursor: 'pointer',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    textAlign: 'center',
    boxShadow: 'var(--shadow-md)',
    transition: 'box-shadow 0.2s',
    userSelect: 'none',
  },
  front: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '1rem',
  },
  diffBadge: {
    fontFamily: 'var(--font-sans)', fontSize: '0.65rem', fontWeight: '700',
    letterSpacing: '0.08em', textTransform: 'uppercase',
    padding: '0.2rem 0.6rem', borderRadius: '2px',
  },
  word: {
    fontFamily: 'var(--font-serif)', fontSize: '2.8rem',
    fontWeight: '700', color: 'var(--black)', lineHeight: '1.1',
  },
  etymology: {
    fontFamily: 'var(--font-serif)', fontSize: '0.875rem',
    color: 'var(--gray-500)', lineHeight: '1.6',
    maxWidth: '360px',
  },
  flipHint: {
    fontFamily: 'var(--font-sans)', fontSize: '0.72rem',
    color: 'var(--gray-300)', letterSpacing: '0.05em',
    textTransform: 'uppercase', marginTop: '0.75rem',
  },
  back: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '1rem', width: '100%',
  },
  backWord: {
    fontFamily: 'var(--font-sans)', fontSize: '0.75rem',
    fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase',
    color: 'var(--gray-400)',
  },
  definition: {
    fontFamily: 'var(--font-serif)', fontSize: '1.3rem',
    color: 'var(--black)', lineHeight: '1.5',
    maxWidth: '400px',
  },
  example: {
    fontFamily: 'var(--font-serif)', fontSize: '0.9rem',
    color: 'var(--gray-600)', lineHeight: '1.7',
    maxWidth: '380px',
  },
  synonymsRow: {
    display: 'flex', alignItems: 'baseline',
    gap: '0.3rem', flexWrap: 'wrap', justifyContent: 'center',
  },
  synonymsLabel: {
    fontFamily: 'var(--font-sans)', fontSize: '0.72rem',
    fontWeight: '600', color: 'var(--gray-400)',
    textTransform: 'uppercase', letterSpacing: '0.06em',
  },
  synonyms: {
    fontFamily: 'var(--font-serif)', fontSize: '0.85rem',
    color: 'var(--gray-600)',
  },
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: '1rem',
  },
  navBtn: {
    fontFamily: 'var(--font-sans)', fontSize: '0.875rem',
    fontWeight: '600', color: 'var(--black)',
    background: 'none', border: '1px solid var(--gray-200)',
    borderRadius: 'var(--radius)', padding: '0.6rem 1rem',
    cursor: 'pointer', transition: 'border-color 0.15s',
  },
  navBtnDisabled: {
    color: 'var(--gray-300)', cursor: 'not-allowed',
    borderColor: 'var(--gray-100)',
  },
  flipBtn: {
    fontFamily: 'var(--font-sans)', fontSize: '0.875rem',
    fontWeight: '600', color: 'var(--white)',
    background: 'var(--black)', border: 'none',
    borderRadius: 'var(--radius)', padding: '0.6rem 1.25rem',
    cursor: 'pointer',
  },
}

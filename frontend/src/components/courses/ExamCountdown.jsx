/**
 * GRADSKOOL — ExamCountdown
 * Live countdown timer matching the brand style from cat.html
 */
import { useCountdown } from '../../hooks/useCourses'

export function ExamCountdown({ examDate, examName }) {
  const t = useCountdown(examDate)
  if (!t || t.done) return null

  return (
    <div style={styles.wrap}>
      <div style={styles.inner}>
        <div style={styles.meta}>
          <span style={styles.label}>{examName} — Time Remaining</span>
          <span style={styles.date}>
            {new Date(examDate).toLocaleDateString('en-IN', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            })}
          </span>
        </div>
        <div style={styles.timer}>
          {[
            { val: t.days,  unit: 'Days'  },
            { val: t.hours, unit: 'Hours' },
            { val: t.mins,  unit: 'Mins'  },
            { val: t.secs,  unit: 'Secs'  },
          ].map(({ val, unit }, i) => (
            <div key={unit} style={styles.unitWrap}>
              {i > 0 && <span style={styles.sep}>:</span>}
              <div style={styles.unit}>
                <span style={styles.num}>{String(val).padStart(2, '0')}</span>
                <span style={styles.unitLabel}>{unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const styles = {
  wrap: {
    background: 'var(--black)',
    borderBottom: '1px solid #222',
    padding: '1rem 2rem',
  },
  inner: {
    maxWidth: 'var(--max-width)',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '2rem',
    flexWrap: 'wrap',
  },
  meta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
  },
  label: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.72rem',
    fontWeight: '500',
    letterSpacing: '0.09em',
    textTransform: 'uppercase',
    color: 'var(--red)',
  },
  date: {
    fontFamily: 'var(--font-serif)',
    fontSize: '0.875rem',
    color: 'var(--gray-400)',
  },
  timer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  unitWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  sep: {
    color: 'var(--gray-600)',
    fontSize: '1.4rem',
    lineHeight: '1',
    marginBottom: '1rem',
  },
  unit: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: '52px',
  },
  num: {
    fontFamily: 'var(--font-serif)',
    fontSize: '2rem',
    fontWeight: '700',
    color: 'var(--white)',
    lineHeight: '1',
    fontVariantNumeric: 'tabular-nums',
  },
  unitLabel: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.65rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--gray-400)',
    marginTop: '0.2rem',
  },
}

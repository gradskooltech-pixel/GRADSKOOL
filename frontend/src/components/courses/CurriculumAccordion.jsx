/**
 * GRADSKOOL — CurriculumAccordion
 * Expandable modules with topic lists. Matches the cat.html curriculum style.
 */
import { useState } from 'react'

export function CurriculumAccordion({ modules = [] }) {
  const [open, setOpen] = useState(0)  // First module open by default

  if (!modules.length) return null

  return (
    <div style={styles.wrap}>
      {modules.map((mod, idx) => {
        const isOpen = open === idx
        return (
          <div
            key={mod.id}
            style={{ ...styles.module, ...(isOpen ? styles.moduleOpen : {}) }}
          >
            <button
              style={{ ...styles.header, ...(isOpen ? styles.headerOpen : {}) }}
              onClick={() => setOpen(isOpen ? -1 : idx)}
              aria-expanded={isOpen}
            >
              <div style={styles.headerLeft}>
                <span style={styles.moduleNum}>
                  Module {String(mod.number).padStart(2, '0')}
                </span>
                <span style={isOpen ? styles.titleOpen : styles.title}>
                  {mod.title}
                </span>
              </div>
              <div style={styles.headerRight}>
                {mod.duration_note && (
                  <span style={styles.duration}>{mod.duration_note}</span>
                )}
                <span style={{ ...styles.arrow, ...(isOpen ? styles.arrowOpen : {}) }}>
                  ↓
                </span>
              </div>
            </button>

            {isOpen && (
              <div style={styles.body}>
                {mod.description && (
                  <p style={styles.desc}>{mod.description}</p>
                )}
                <ul style={styles.topicList}>
                  {mod.topics?.map((topic) => (
                    <li key={topic.id} style={styles.topic}>
                      <span style={styles.dash}>—</span>
                      {topic.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

const styles = {
  wrap: {
    border: '1px solid var(--gray-200)',
    borderRadius: 'var(--radius)',
    overflow: 'hidden',
  },
  module: {
    borderBottom: '1px solid var(--gray-200)',
    transition: 'border-color 0.2s',
  },
  moduleOpen: {
    borderColor: 'var(--black)',
  },
  header: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1.25rem 1.5rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 0.15s',
    gap: '1rem',
  },
  headerOpen: {
    background: 'var(--black)',
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexShrink: 0,
  },
  moduleNum: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.68rem',
    fontWeight: '600',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--red)',
  },
  title: {
    fontFamily: 'var(--font-serif)',
    fontSize: '1.1rem',
    fontWeight: '500',
    color: 'var(--black)',
  },
  titleOpen: {
    fontFamily: 'var(--font-serif)',
    fontSize: '1.1rem',
    fontWeight: '500',
    color: 'var(--white)',
  },
  duration: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.75rem',
    color: 'var(--gray-400)',
  },
  arrow: {
    fontSize: '1rem',
    color: 'var(--gray-400)',
    transition: 'transform 0.2s',
    display: 'inline-block',
  },
  arrowOpen: {
    transform: 'rotate(180deg)',
    color: 'var(--white)',
  },
  body: {
    padding: '1.5rem',
    borderTop: '1px solid var(--gray-200)',
    background: 'var(--white)',
  },
  desc: {
    fontFamily: 'var(--font-serif)',
    fontSize: '0.9rem',
    color: 'var(--gray-600)',
    lineHeight: '1.7',
    marginBottom: '1.25rem',
  },
  topicList: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  topic: {
    fontFamily: 'var(--font-serif)',
    fontSize: '0.875rem',
    color: 'var(--gray-600)',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.6rem',
    lineHeight: '1.5',
  },
  dash: { color: 'var(--gray-300)', flexShrink: 0 },
}

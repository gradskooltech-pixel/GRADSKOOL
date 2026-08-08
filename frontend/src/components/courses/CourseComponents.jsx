/**
 * GRADSKOOL — Course Page Supporting Components
 *
 * InstructorCard     → Faculty profile card
 * TestimonialSlider  → Horizontal scrolling testimonials
 * ExamFAQ            → Accordion FAQ
 * ExamStatsBar       → Key numbers strip (30 mocks, 400+ hrs, etc.)
 * SeatsCounter       → Live seat availability indicator
 */

import { useState } from 'react'

// ── INSTRUCTOR CARD ───────────────────────────────────────────────────────────

export function InstructorCard({ instructor }) {
  return (
    <div style={icStyles.card}>
      <div style={icStyles.left}>
        {instructor.photo_url ? (
          <img src={instructor.photo_url} alt={instructor.name} style={icStyles.photo} />
        ) : (
          <div style={icStyles.initials}>
            {instructor.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </div>
        )}
      </div>
      <div style={icStyles.right}>
        <p style={icStyles.name}>{instructor.name}</p>
        <p style={icStyles.title}>{instructor.title}</p>
        {instructor.credentials && (
          <p style={icStyles.credentials}>{instructor.credentials}</p>
        )}
        {instructor.percentile && (
          <span style={icStyles.percentileBadge}>{instructor.percentile}</span>
        )}
        <div style={icStyles.links}>
          {instructor.linkedin_url && (
            <a href={instructor.linkedin_url} target="_blank" rel="noreferrer" style={icStyles.link}>
              LinkedIn ↗
            </a>
          )}
          {instructor.youtube_url && (
            <a href={instructor.youtube_url} target="_blank" rel="noreferrer" style={icStyles.link}>
              YouTube ↗
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

const icStyles = {
  card: {
    display: 'flex',
    gap: '1.5rem',
    padding: '1.75rem',
    border: '1px solid var(--gray-200)',
    borderRadius: 'var(--radius)',
    background: 'var(--white)',
    alignItems: 'flex-start',
  },
  left: { flexShrink: 0 },
  photo: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid var(--gray-200)',
  },
  initials: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    background: 'var(--black)',
    color: 'var(--white)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-serif)',
    fontSize: '1.4rem',
    fontWeight: '700',
  },
  right: { flex: 1 },
  name: {
    fontFamily: 'var(--font-serif)',
    fontSize: '1.1rem',
    fontWeight: '500',
    color: 'var(--black)',
    marginBottom: '0.2rem',
  },
  title: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.8rem',
    color: 'var(--gray-600)',
    marginBottom: '0.4rem',
  },
  credentials: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.75rem',
    color: 'var(--gray-400)',
    marginBottom: '0.5rem',
  },
  percentileBadge: {
    display: 'inline-block',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.68rem',
    fontWeight: '600',
    letterSpacing: '0.05em',
    background: 'var(--red-light)',
    color: 'var(--red)',
    border: '1px solid var(--red-border)',
    padding: '0.15rem 0.5rem',
    borderRadius: '2px',
    marginBottom: '0.75rem',
  },
  links: { display: 'flex', gap: '1rem' },
  link: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.78rem',
    color: 'var(--gray-400)',
    borderBottom: '1px solid var(--gray-200)',
    transition: 'color 0.2s',
  },
}


// ── TESTIMONIAL SLIDER ────────────────────────────────────────────────────────

export function TestimonialSlider({ testimonials = [] }) {
  if (!testimonials.length) return null

  return (
    <div style={tsStyles.grid}>
      {testimonials.map((t) => (
        <div key={t.id} style={tsStyles.card}>
          <div style={tsStyles.quote}>"</div>
          <p style={tsStyles.text}>{t.text}</p>
          <div style={tsStyles.author}>
            <p style={tsStyles.name}>{t.student_name}</p>
            {t.detail && <p style={tsStyles.detail}>{t.detail}</p>}
            {t.rating && (
              <p style={tsStyles.stars}>{'★'.repeat(t.rating)}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

const tsStyles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.25rem',
  },
  card: {
    border: '1px solid var(--gray-200)',
    borderRadius: 'var(--radius)',
    padding: '1.75rem',
    background: 'var(--white)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  quote: {
    fontFamily: 'var(--font-serif)',
    fontSize: '3rem',
    color: 'var(--red)',
    lineHeight: '0.8',
    fontStyle: 'italic',
  },
  text: {
    fontFamily: 'var(--font-serif)',
    fontSize: '0.9rem',
    color: 'var(--gray-700)',
    lineHeight: '1.75',
    fontStyle: 'italic',
    flex: 1,
  },
  author: {
    borderTop: '1px solid var(--gray-200)',
    paddingTop: '1rem',
  },
  name: {
    fontFamily: 'var(--font-serif)',
    fontSize: '0.95rem',
    fontWeight: '500',
    color: 'var(--black)',
  },
  detail: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.78rem',
    color: 'var(--gray-400)',
    marginTop: '0.2rem',
  },
  stars: {
    color: '#f59e0b',
    fontSize: '0.8rem',
    marginTop: '0.3rem',
    letterSpacing: '0.05em',
  },
}


// ── EXAM FAQ ──────────────────────────────────────────────────────────────────

export function ExamFAQ({ faqs = [] }) {
  const [open, setOpen] = useState(null)
  if (!faqs.length) return null

  return (
    <div style={faqStyles.wrap}>
      {faqs.map((faq, i) => {
        const isOpen = open === i
        return (
          <div key={faq.id} style={faqStyles.item}>
            <button
              style={faqStyles.question}
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
            >
              <span>{faq.question}</span>
              <span style={{ ...faqStyles.icon, transform: isOpen ? 'rotate(45deg)' : 'none' }}>
                +
              </span>
            </button>
            {isOpen && (
              <div style={faqStyles.answer}>
                <p>{faq.answer}</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

const faqStyles = {
  wrap: {
    border: '1px solid var(--gray-200)',
    borderRadius: 'var(--radius)',
    overflow: 'hidden',
  },
  item: {
    borderBottom: '1px solid var(--gray-200)',
  },
  question: {
    width: '100%',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '1rem',
    padding: '1.25rem 1.5rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'var(--font-serif)',
    fontSize: '0.95rem',
    color: 'var(--black)',
    lineHeight: '1.5',
  },
  icon: {
    fontSize: '1.4rem',
    color: 'var(--red)',
    flexShrink: 0,
    lineHeight: '1',
    transition: 'transform 0.2s',
  },
  answer: {
    padding: '0 1.5rem 1.25rem',
    fontFamily: 'var(--font-serif)',
    fontSize: '0.9rem',
    color: 'var(--gray-600)',
    lineHeight: '1.75',
    borderTop: '1px solid var(--gray-100)',
  },
}


// ── EXAM STATS BAR ────────────────────────────────────────────────────────────

export function ExamStatsBar({ stats = [] }) {
  if (!stats.length) return null

  return (
    <div style={statStyles.bar}>
      <div style={statStyles.inner}>
        {stats.map((s, i) => (
          <div key={i} style={statStyles.item}>
            <span style={statStyles.value}>{s.value}</span>
            <span style={statStyles.label}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const statStyles = {
  bar: {
    background: 'var(--black)',
    padding: '2.5rem 2rem',
  },
  inner: {
    maxWidth: 'var(--max-width)',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '2rem',
  },
  item: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.4rem',
    textAlign: 'center',
  },
  value: {
    fontFamily: 'var(--font-serif)',
    fontSize: '2.4rem',
    fontWeight: '700',
    color: 'var(--white)',
    lineHeight: '1',
    fontVariantNumeric: 'tabular-nums',
  },
  label: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.72rem',
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    color: 'var(--gray-400)',
  },
}


// ── SEATS COUNTER ─────────────────────────────────────────────────────────────

export function SeatsCounter({ seatsAvailable, cohortLabel }) {
  if (seatsAvailable === null || seatsAvailable === undefined) return null

  const color = seatsAvailable <= 3 ? 'var(--red)' : seatsAvailable <= 8 ? '#f59e0b' : '#4ade80'

  return (
    <div style={scStyles.wrap}>
      <span style={{ ...scStyles.dot, background: color }} />
      <span style={scStyles.text}>
        {seatsAvailable === 0
          ? 'Cohort full — join waitlist'
          : `${seatsAvailable} seat${seatsAvailable !== 1 ? 's' : ''} remaining`
        }
        {cohortLabel && ` · ${cohortLabel}`}
      </span>
    </div>
  )
}

const scStyles = {
  wrap: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.4rem 0.9rem',
    border: '1px solid var(--gray-200)',
    borderRadius: '100px',
    background: 'var(--gray-50)',
  },
  dot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    animation: 'pulse 2s infinite',
  },
  text: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.78rem',
    fontWeight: '500',
    color: 'var(--gray-700)',
  },
}

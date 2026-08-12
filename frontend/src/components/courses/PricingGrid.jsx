/**
 * GRADSKOOL — PricingGrid
 *
 * Renders plan cards for an exam page.
 * Featured plan gets black background (matches checkout.html).
 * Enrol button triggers the payment flow (M4).
 */
import { useAuth } from '../../hooks/useAuth'
import { useRouter } from 'next/router'

export function PricingGrid({ plans = [], examSlug }) {
  const { isLoggedIn } = useAuth()
  const router = useRouter()

  if (!plans.length) return null

  return (
    <div style={styles.grid}>
      {plans.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          examSlug={examSlug}
          isLoggedIn={isLoggedIn}
          onEnrol={() => {
            if (!isLoggedIn) {
              router.push(`/auth/login?redirect=/checkout/${examSlug}`)
              return
            }
            router.push(`/checkout/${examSlug}?plan=${plan.id}`)
          }}
        />
      ))}
    </div>
  )
}

function PlanCard({ plan, onEnrol }) {
  const featured = plan.is_featured
  const s = featured ? featuredStyles : defaultStyles

  return (
    <div style={s.card}>
      {/* Badge */}
      {plan.badge_text && (
        <span style={s.badge}>{plan.badge_text}</span>
      )}

      {/* Top section */}
      <div style={s.top}>
        {/* Discount badge */}
        {plan.discount_pct && (
          <span style={styles.discountBadge}>{plan.discount_pct}% off</span>
        )}

        <div style={s.planName}>{plan.name}</div>

        {plan.original_price && (
          <div style={s.originalPrice}>
            ₹{Number(plan.original_price).toLocaleString('en-IN')}
          </div>
        )}

        <div style={s.price}>
          ₹{Number(plan.price_inr).toLocaleString('en-IN')}
          <span style={s.priceSub}> incl. GST</span>
        </div>

        {plan.description && (
          <p style={s.desc}>{plan.description}</p>
        )}
      </div>

      {/* Features */}
      <ul style={styles.features}>
        {plan.features?.map((feat, i) => (
          <li key={i} style={{
            ...styles.feature,
            color: feat.is_included ? (featured ? '#ddd' : 'var(--gray-600)') : '#777',
          }}>
            <span style={{
              ...styles.featureIcon,
              color: feat.is_included ? '#4ade80' : '#777',
            }}>
              {feat.is_included ? '✓' : '–'}
            </span>
            {feat.text}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button style={s.cta} onClick={onEnrol}>
        Enrol Now →
      </button>

      {/* GST note */}
      <p style={s.gstNote}>
        Total: ₹{Number(plan.total_with_gst).toLocaleString('en-IN', {
          maximumFractionDigits: 0
        })} incl. 18% GST
      </p>
    </div>
  )
}

// ── SHARED ────────────────────────────────────────────────────────────────────
const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '1.25rem',
  },
  features: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
    flex: 1,
    marginBottom: '1.5rem',
  },
  feature: {
    fontFamily: 'var(--font-serif)',
    fontSize: '0.875rem',
    lineHeight: '1.5',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem',
  },
  featureIcon: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.8rem',
    fontWeight: '700',
    flexShrink: 0,
    marginTop: '0.1rem',
  },
  discountBadge: {
    display: 'inline-block',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.68rem',
    fontWeight: '600',
    letterSpacing: '0.05em',
    background: 'rgba(255,94,95,0.15)',
    color: 'var(--red)',
    padding: '0.2rem 0.5rem',
    borderRadius: '2px',
    marginBottom: '0.5rem',
  },
}

// ── DEFAULT PLAN STYLES ───────────────────────────────────────────────────────
const defaultStyles = {
  card: {
    border: '1px solid var(--gray-200)',
    borderRadius: 'var(--radius)',
    padding: '1.75rem',
    background: 'var(--white)',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  top: { marginBottom: '1.5rem' },
  badge: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.6rem',
    fontWeight: '600',
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    background: 'var(--gray-100)',
    color: 'var(--gray-600)',
    padding: '0.2rem 0.5rem',
    borderRadius: '2px',
  },
  planName: {
    fontFamily: 'var(--font-serif)',
    fontSize: '1.2rem',
    fontWeight: '500',
    color: 'var(--black)',
    marginBottom: '0.75rem',
  },
  originalPrice: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.85rem',
    color: 'var(--gray-400)',
    textDecoration: 'line-through',
    marginBottom: '0.2rem',
  },
  price: {
    fontFamily: 'var(--font-serif)',
    fontSize: '2.2rem',
    fontWeight: '700',
    color: 'var(--black)',
    lineHeight: '1',
    marginBottom: '0.4rem',
    fontVariantNumeric: 'tabular-nums',
  },
  priceSub: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.8rem',
    fontWeight: '300',
    color: 'var(--gray-400)',
  },
  desc: {
    fontFamily: 'var(--font-serif)',
    fontSize: '0.85rem',
    color: 'var(--gray-600)',
    fontStyle: 'italic',
    lineHeight: '1.6',
    marginTop: '0.4rem',
  },
  cta: {
    width: '100%',
    padding: '0.75rem',
    background: 'var(--black)',
    color: 'var(--white)',
    border: 'none',
    borderRadius: 'var(--radius)',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s',
    marginTop: 'auto',
  },
  gstNote: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.72rem',
    color: 'var(--gray-400)',
    textAlign: 'center',
    marginTop: '0.6rem',
  },
}

// ── FEATURED PLAN STYLES ──────────────────────────────────────────────────────
const featuredStyles = {
  ...defaultStyles,
  card: {
    ...defaultStyles.card,
    border: '1px solid var(--black)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
  },
  top: {
    ...defaultStyles.top,
    background: 'var(--black)',
    margin: '-1.75rem -1.75rem 1.5rem',
    padding: '1.75rem',
    borderRadius: 'var(--radius) var(--radius) 0 0',
  },
  badge: {
    ...defaultStyles.badge,
    background: 'rgba(255,94,95,0.2)',
    color: 'var(--red)',
  },
  planName: { ...defaultStyles.planName, color: 'var(--white)' },
  price: { ...defaultStyles.price, color: 'var(--white)' },
  priceSub: { ...defaultStyles.priceSub },
  originalPrice: { ...defaultStyles.originalPrice },
  desc: { ...defaultStyles.desc, color: '#aaa' },
  cta: {
    ...defaultStyles.cta,
    background: 'var(--red)',
  },
  gstNote: { ...defaultStyles.gstNote },
}
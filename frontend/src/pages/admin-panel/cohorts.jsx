/**
 * GRADSKOOL — Admin Cohorts Page
 * Route: /admin-panel/cohorts
 *
 * Shows seat fill rates for every active/upcoming cohort.
 * Colour-coded fill % with progress bars.
 */
import { AdminLayout } from '../../components/admin/AdminLayout'
import {
  StatCard, SectionBox, LoadingGrid, fmt,
} from '../../components/admin/AdminPrimitives'
import { useAdminCohorts } from '../../hooks/useAdminAnalytics'

export default function AdminCohortsPage() {
  const { data, loading } = useAdminCohorts()
  const cohorts = data?.cohorts || []

  const totalSeats     = cohorts.reduce((s, c) => s + c.batch_size, 0)
  const totalFilled    = cohorts.reduce((s, c) => s + c.seats_filled, 0)
  const totalAvailable = cohorts.reduce((s, c) => s + c.seats_available, 0)
  const avgFill        = totalSeats > 0 ? Math.round((totalFilled / totalSeats) * 100) : 0

  return (
    <AdminLayout title="Cohorts">

      <div style={s.pageHeader}>
        <div>
          <p style={s.eyebrow}>Enrolment Management</p>
          <h1 style={s.pageTitle}>Cohorts</h1>
        </div>
      </div>

      {/* Summary stats */}
      {loading ? <LoadingGrid cols={4} /> : (
        <div style={s.grid4}>
          <StatCard label="Active Cohorts"    value={fmt(cohorts.length)} icon="👥" />
          <StatCard label="Total Seats"       value={fmt(totalSeats)}     icon="💺" />
          <StatCard label="Seats Filled"      value={fmt(totalFilled)}    icon="✅" />
          <StatCard
            label="Avg Fill Rate"
            value={fmt(avgFill, { pct: true })}
            icon="📊"
            color={avgFill >= 80 ? '#10b981' : avgFill >= 50 ? '#f59e0b' : '#ef4444'}
          />
        </div>
      )}

      {/* Cohort cards */}
      {!loading && (
        <SectionBox title="All Cohorts" eyebrow="Status">
          {cohorts.length === 0 ? (
            <p style={s.empty}>No active cohorts found.</p>
          ) : (
            <div style={s.cohortsGrid}>
              {cohorts.map(cohort => (
                <CohortCard key={cohort.course_id} cohort={cohort} />
              ))}
            </div>
          )}
        </SectionBox>
      )}

    </AdminLayout>
  )
}

function CohortCard({ cohort }) {
  const fill = cohort.fill_pct
  const barColor = fill >= 90 ? '#ef4444' : fill >= 70 ? '#f59e0b' : '#10b981'
  const statusColors = {
    active:   { bg: '#dcfce7', color: '#166534' },
    upcoming: { bg: '#dbeafe', color: '#1e40af' },
    closed:   { bg: '#f3f4f6', color: '#374151' },
  }
  const sc = statusColors[cohort.status] || statusColors.active

  return (
    <div style={s.cohortCard}>
      {/* Header */}
      <div style={s.cohortHeader}>
        <div>
          <p style={s.cohortExam}>{cohort.exam_name}</p>
          {cohort.cohort_label && (
            <p style={s.cohortLabel}>{cohort.cohort_label}</p>
          )}
        </div>
        <span style={{ ...s.statusBadge, background: sc.bg, color: sc.color }}>
          {cohort.status}
        </span>
      </div>

      {/* Fill rate */}
      <div style={s.fillRow}>
        <span style={s.fillNum}>{cohort.seats_filled}</span>
        <span style={s.fillSlash}>/</span>
        <span style={s.fillTotal}>{cohort.batch_size}</span>
        <span style={s.fillLabel}>seats filled</span>
        <span style={{ ...s.fillPct, color: barColor }}>{fill}%</span>
      </div>

      {/* Progress bar */}
      <div style={s.fillBarWrap}>
        <div style={{ ...s.fillBarFill, width: `${fill}%`, background: barColor }} />
      </div>

      {/* Metadata */}
      <div style={s.cohortMeta}>
        {cohort.start_date && (
          <span style={s.metaItem}>📅 {cohort.start_date}</span>
        )}
        <span style={s.metaItem}>
          {cohort.seats_available > 0
            ? `${cohort.seats_available} seats left`
            : '🔴 Full'}
        </span>
      </div>

      {/* Active enrollments vs seats filled comparison */}
      {cohort.active_enrollments !== cohort.seats_filled && (
        <div style={s.discrepancy}>
          ⚠ {cohort.active_enrollments} active enrollments vs {cohort.seats_filled} seats marked filled
        </div>
      )}
    </div>
  )
}

const s = {
  pageHeader: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: '2.5rem',
  },
  eyebrow: {
    fontFamily: 'var(--font-sans)', fontSize: '0.68rem', fontWeight: '700',
    letterSpacing: '0.12em', textTransform: 'uppercase',
    color: 'var(--red)', marginBottom: '0.25rem',
  },
  pageTitle: {
    fontFamily: 'var(--font-serif)', fontSize: '2rem',
    fontWeight: '700', color: 'var(--black)', lineHeight: '1',
  },
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' },
  cohortsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))',
    gap: '1.25rem',
  },
  cohortCard: {
    border: '1px solid var(--gray-200)',
    borderRadius: 'var(--radius)', padding: '1.5rem',
    background: 'var(--white)',
    display: 'flex', flexDirection: 'column', gap: '1rem',
  },
  cohortHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  cohortExam: {
    fontFamily: 'var(--font-serif)', fontSize: '1.05rem',
    fontWeight: '500', color: 'var(--black)',
  },
  cohortLabel: {
    fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'var(--gray-400)',
    marginTop: '0.2rem',
  },
  statusBadge: {
    fontFamily: 'var(--font-sans)', fontSize: '0.62rem', fontWeight: '700',
    letterSpacing: '0.06em', textTransform: 'uppercase',
    padding: '0.15rem 0.5rem', borderRadius: '2px',
  },
  fillRow: {
    display: 'flex', alignItems: 'baseline', gap: '0.3rem',
  },
  fillNum: {
    fontFamily: 'var(--font-serif)', fontSize: '2rem',
    fontWeight: '700', color: 'var(--black)', lineHeight: '1',
  },
  fillSlash: { color: 'var(--gray-300)', fontSize: '1.5rem' },
  fillTotal: {
    fontFamily: 'var(--font-serif)', fontSize: '1.5rem',
    color: 'var(--gray-400)', lineHeight: '1',
  },
  fillLabel: {
    fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'var(--gray-400)',
    flex: 1,
  },
  fillPct: {
    fontFamily: 'var(--font-sans)', fontSize: '1.1rem', fontWeight: '700',
  },
  fillBarWrap: {
    height: '6px', background: 'var(--gray-100)',
    borderRadius: '3px', overflow: 'hidden',
  },
  fillBarFill: {
    height: '100%', borderRadius: '3px',
    transition: 'width 0.5s ease',
  },
  cohortMeta: { display: 'flex', gap: '1rem', flexWrap: 'wrap' },
  metaItem: {
    fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'var(--gray-500)',
  },
  discrepancy: {
    fontFamily: 'var(--font-sans)', fontSize: '0.72rem',
    color: '#92400e', background: '#fef9c3',
    padding: '0.4rem 0.6rem', borderRadius: '2px',
  },
  empty: {
    fontFamily: 'var(--font-sans)', color: 'var(--gray-400)',
    fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0',
  },
}

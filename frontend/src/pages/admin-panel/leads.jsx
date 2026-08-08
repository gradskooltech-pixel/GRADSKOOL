/**
 * GRADSKOOL — Admin Leads & Email Page
 * Route: /admin-panel/leads
 *
 * Shows:
 *   - Lead funnel (new → engaged → nurtured → converted)
 *   - By-exam breakdown
 *   - Email performance (open/click/bounce rates)
 *   - Drip sequence performance table
 *   - Recent conversions
 */
import { AdminLayout } from '../../components/admin/AdminLayout'
import {
  StatCard, SectionBox, DataTable,
  MiniBarChart, LoadingGrid, ProgressRing, fmt, Badge,
} from '../../components/admin/AdminPrimitives'
import api from '../../lib/api'
import { useState, useEffect } from 'react'

function useLeadsData() {
  const [data, setData]    = useState(null)
  const [loading, setLoad] = useState(true)

  useEffect(() => {
    api.get('/leads/analytics/')
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setLoad(false))
  }, [])

  return { data, loading }
}

const STATUS_COLORS = {
  new:          { bg: '#f3f4f6', color: '#374151' },
  engaged:      { bg: '#dbeafe', color: '#1e40af' },
  nurtured:     { bg: '#fef9c3', color: '#92400e' },
  converted:    { bg: '#dcfce7', color: '#166534' },
  unsubscribed: { bg: '#f3f4f6', color: '#9ca3af' },
  bounced:      { bg: '#fee2e2', color: '#991b1b' },
}

export default function AdminLeadsPage() {
  const { data, loading } = useLeadsData()

  const statusCounts = data?.by_status || {}
  const totalLeads   = data?.total || 0

  return (
    <AdminLayout title="Leads & Email">

      <div style={s.pageHeader}>
        <div>
          <p style={s.eyebrow}>Lead Pipeline</p>
          <h1 style={s.pageTitle}>Leads & Email</h1>
        </div>
      </div>

      {/* Funnel stats */}
      {loading ? <LoadingGrid cols={4} /> : (
        <div style={s.grid4}>
          <StatCard
            label="Total Leads"
            value={fmt(totalLeads)}
            sub={`+${fmt(data?.new_this_week)} this week`}
            icon="📋"
          />
          <StatCard
            label="Converted"
            value={fmt(statusCounts.converted || 0)}
            sub={`${fmt(data?.conversion_rate, { pct: true })} conversion rate`}
            icon="✅"
            color="#10b981"
          />
          <StatCard
            label="Email Open Rate"
            value={fmt(data?.email?.open_rate, { pct: true })}
            sub={`${fmt(data?.email?.sent)} emails sent`}
            icon="📧"
          />
          <StatCard
            label="Click Rate"
            value={fmt(data?.email?.click_rate, { pct: true })}
            sub={`${fmt(data?.email?.bounced)} bounced`}
            icon="🖱"
          />
        </div>
      )}

      {/* Funnel visualisation */}
      {!loading && totalLeads > 0 && (
        <SectionBox title="Lead Funnel" eyebrow="Status Breakdown">
          <div style={s.funnelGrid}>
            {['new', 'engaged', 'nurtured', 'converted', 'unsubscribed', 'bounced'].map(status => {
              const count = statusCounts[status] || 0
              const pct   = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0
              const sc    = STATUS_COLORS[status]
              return (
                <div key={status} style={s.funnelItem}>
                  <div style={s.funnelTop}>
                    <span style={{ ...s.statusPill, background: sc.bg, color: sc.color }}>
                      {status}
                    </span>
                    <span style={s.funnelPct}>{pct}%</span>
                  </div>
                  <div style={s.funnelCount}>{fmt(count)}</div>
                  <div style={s.funnelBar}>
                    <div style={{ ...s.funnelFill, width: `${pct}%`, background: sc.color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </SectionBox>
      )}

      {/* Two column: by exam + email stats */}
      {!loading && (
        <div style={s.twoCol}>
          <SectionBox title="Leads by Exam" eyebrow="Top 8">
            <MiniBarChart
              data={data?.by_exam || []}
              labelKey="target_exam"
              valueKey="count"
              color="var(--red)"
            />
          </SectionBox>

          <SectionBox title="Email Performance" eyebrow="All time">
            <div style={s.emailStatsGrid}>
              {[
                { label: 'Sent',    value: data?.email?.sent,    color: '#3b82f6' },
                { label: 'Opened',  value: data?.email?.opened,  color: '#10b981' },
                { label: 'Clicked', value: data?.email?.clicked, color: '#f59e0b' },
                { label: 'Bounced', value: data?.email?.bounced, color: '#ef4444' },
              ].map(stat => (
                <div key={stat.label} style={s.emailStat}>
                  <div style={{ ...s.emailStatValue, color: stat.color }}>
                    {fmt(stat.value)}
                  </div>
                  <div style={s.emailStatLabel}>{stat.label}</div>
                </div>
              ))}
            </div>
            <div style={s.rateRow}>
              <div style={s.rateItem}>
                <ProgressRing
                  pct={data?.email?.open_rate || 0}
                  size={64}
                  stroke={6}
                  color="#10b981"
                />
                <div>
                  <p style={s.ratePct}>{fmt(data?.email?.open_rate, { pct: true })}</p>
                  <p style={s.rateLabel}>Open Rate</p>
                </div>
              </div>
              <div style={s.rateItem}>
                <ProgressRing
                  pct={data?.email?.click_rate || 0}
                  size={64}
                  stroke={6}
                  color="#f59e0b"
                />
                <div>
                  <p style={s.ratePct}>{fmt(data?.email?.click_rate, { pct: true })}</p>
                  <p style={s.rateLabel}>Click Rate</p>
                </div>
              </div>
            </div>
          </SectionBox>
        </div>
      )}

      {/* Sequence performance */}
      {!loading && data?.sequences?.length > 0 && (
        <SectionBox title="Drip Sequence Performance" eyebrow="Active sequences">
          <DataTable
            columns={[
              { key: 'sequence__name', label: 'Sequence' },
              { key: 'total',          label: 'Total',     align: 'right' },
              { key: 'active',         label: 'Active',    align: 'right',
                render: r => <span style={{ color: '#3b82f6', fontWeight: '600' }}>{r.active}</span> },
              { key: 'completed',      label: 'Completed', align: 'right',
                render: r => <span style={{ color: '#10b981', fontWeight: '600' }}>{r.completed}</span> },
              { key: 'comp_rate',      label: 'Completion %', align: 'right',
                render: r => r.total > 0
                  ? fmt((r.completed / r.total) * 100, { pct: true })
                  : '—' },
            ]}
            rows={data.sequences}
          />
        </SectionBox>
      )}

      {/* Recent conversions */}
      {!loading && data?.recent_conversions?.length > 0 && (
        <SectionBox title="Recent Conversions" eyebrow="Last 30 days">
          <DataTable
            columns={[
              { key: 'email',       label: 'Email' },
              { key: 'target_exam', label: 'Exam',
                render: r => <Badge label={r.target_exam || '—'} /> },
              { key: 'plan',        label: 'Plan',
                render: r => r['converted_plan__name'] || '—' },
              { key: 'converted_at', label: 'Date',
                render: r => r.converted_at?.slice(0, 10) },
            ]}
            rows={data.recent_conversions}
          />
        </SectionBox>
      )}

    </AdminLayout>
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
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' },
  funnelGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem',
  },
  funnelItem: {
    padding: '1rem', border: '1px solid var(--gray-100)',
    borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column', gap: '0.5rem',
  },
  funnelTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  statusPill: {
    fontFamily: 'var(--font-sans)', fontSize: '0.62rem', fontWeight: '700',
    letterSpacing: '0.06em', textTransform: 'uppercase',
    padding: '0.15rem 0.5rem', borderRadius: '2px',
  },
  funnelPct: {
    fontFamily: 'var(--font-sans)', fontSize: '0.85rem',
    fontWeight: '700', color: 'var(--gray-400)',
  },
  funnelCount: {
    fontFamily: 'var(--font-serif)', fontSize: '1.8rem',
    fontWeight: '700', color: 'var(--black)', lineHeight: '1',
  },
  funnelBar: {
    height: '4px', background: 'var(--gray-100)',
    borderRadius: '2px', overflow: 'hidden',
  },
  funnelFill: { height: '100%', borderRadius: '2px', opacity: 0.7 },
  emailStatsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '1rem',
    marginBottom: '1.5rem',
  },
  emailStat: {
    padding: '1rem', background: 'var(--gray-50)',
    borderRadius: 'var(--radius)', textAlign: 'center',
  },
  emailStatValue: {
    fontFamily: 'var(--font-serif)', fontSize: '1.8rem',
    fontWeight: '700', lineHeight: '1', marginBottom: '0.2rem',
  },
  emailStatLabel: {
    fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: 'var(--gray-500)',
    textTransform: 'uppercase', letterSpacing: '0.06em',
  },
  rateRow: { display: 'flex', gap: '2rem', justifyContent: 'center' },
  rateItem: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  ratePct: {
    fontFamily: 'var(--font-serif)', fontSize: '1.3rem',
    fontWeight: '700', color: 'var(--black)',
  },
  rateLabel: {
    fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: 'var(--gray-400)',
  },
}

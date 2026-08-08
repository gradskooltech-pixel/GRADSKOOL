/**
 * GRADSKOOL — Admin Notifications Analytics Page
 * Route: /admin-panel/notifications
 *
 * Shows:
 *   - WhatsApp send / delivery / read rates
 *   - Per-template breakdown
 *   - In-app notification read rate
 *   - Failed sends with error tracking
 */
import { AdminLayout } from '../../components/admin/AdminLayout'
import {
  StatCard, SectionBox, DataTable,
  MiniBarChart, LoadingGrid, ProgressRing, fmt,
} from '../../components/admin/AdminPrimitives'
import { useAdminNotifications } from '../../hooks/useAdminAnalytics'

const TEMPLATE_LABELS = {
  enrollment_confirmed: 'Enrollment Confirmed',
  session_reminder:     'Session Reminder',
  payment_failed:       'Payment Failed',
  mock_available:       'New Mock Available',
  welcome:              'Welcome',
  custom:               'Custom',
}

export default function AdminNotificationsPage() {
  const { data, loading } = useAdminNotifications()
  const wa       = data?.whatsapp || {}
  const inApp    = data?.in_app   || {}

  return (
    <AdminLayout title="Notifications">

      <div style={s.pageHeader}>
        <div>
          <p style={s.eyebrow}>Notification Analytics</p>
          <h1 style={s.pageTitle}>Notifications</h1>
        </div>
      </div>

      {/* WhatsApp header */}
      <div style={s.channelLabel}>
        <span style={s.channelIcon}>💬</span>
        <span style={s.channelName}>WhatsApp</span>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.7rem',
          background: '#f3f4f6', color: '#6b7280', padding: '0.15rem 0.5rem',
          borderRadius: '2px', marginLeft: '0.5rem' }}>
          disabled
        </span>
      </div>

      {!loading && wa?.enabled === false && (
        <div style={s.setupGuide}>
          <h3 style={s.setupTitle}>WhatsApp notifications are disabled</h3>
          <p style={s.setupText}>
            In-app notifications are fully active. WhatsApp is optional and requires
            a paid Interakt subscription + Meta template approval.
          </p>
          <p style={s.setupText}>
            To enable later: add <code style={s.setupCode}>INTERAKT_API_KEY</code> to your environment variables.
          </p>
        </div>
      )}

      {/* Funnel rings + per-template */}
      {!loading && wa.total > 0 && (
        <div style={s.twoCol}>
          {/* Delivery funnel */}
          <SectionBox title="Delivery Funnel" eyebrow="WhatsApp">
            <div style={s.funnelRow}>
              {[
                { label: 'Sent',      pct: wa.send_rate     || 0, color: '#3b82f6' },
                { label: 'Delivered', pct: wa.delivery_rate || 0, color: '#10b981' },
                { label: 'Read',      pct: wa.read_rate     || 0, color: '#f59e0b' },
              ].map(item => (
                <div key={item.label} style={s.ringWrap}>
                  <div style={{ position: 'relative', width: 80, height: 80 }}>
                    <ProgressRing
                      pct={item.pct}
                      size={80}
                      stroke={8}
                      color={item.color}
                    />
                    <div style={s.ringLabel}>
                      {Math.round(item.pct)}%
                    </div>
                  </div>
                  <p style={s.ringName}>{item.label}</p>
                </div>
              ))}
            </div>
            {wa.failed > 0 && (
              <div style={s.failedNote}>
                ⚠ {fmt(wa.failed)} messages failed to send.
                Check Interakt dashboard for error details.
              </div>
            )}
          </SectionBox>

          {/* Per-template */}
          <SectionBox title="By Template" eyebrow="Breakdown">
            <MiniBarChart
              data={(wa.by_template || []).map(t => ({
                ...t,
                name: TEMPLATE_LABELS[t.template] || t.template,
              }))}
              labelKey="name"
              valueKey="total"
              color="#3b82f6"
            />
          </SectionBox>
        </div>
      )}

      {/* Per-template detail table */}
      {!loading && wa.by_template?.length > 0 && (
        <SectionBox title="Template Performance" eyebrow="WhatsApp">
          <DataTable
            columns={[
              { key: 'template', label: 'Template',
                render: r => TEMPLATE_LABELS[r.template] || r.template },
              { key: 'total',  label: 'Total',  align: 'right' },
              { key: 'sent',   label: 'Sent',   align: 'right',
                render: r => (
                  <span style={{ color: '#3b82f6', fontWeight: '600' }}>{r.sent}</span>
                )
              },
              { key: 'failed', label: 'Failed', align: 'right',
                render: r => r.failed > 0
                  ? <span style={{ color: '#ef4444', fontWeight: '600' }}>{r.failed}</span>
                  : <span style={{ color: 'var(--gray-300)' }}>0</span>
              },
              { key: 'send_rate', label: 'Send Rate', align: 'right',
                render: r => r.total > 0
                  ? fmt((r.sent / r.total) * 100, { pct: true })
                  : '—'
              },
            ]}
            rows={wa.by_template}
          />
        </SectionBox>
      )}

      {/* In-App notifications */}
      <div style={s.channelLabel}>
        <span style={s.channelIcon}>🔔</span>
        <span style={s.channelName}>In-App Notifications</span>
      </div>

      {loading ? <LoadingGrid cols={3} /> : (
        <div style={s.grid3}>
          <StatCard
            label="Total Created"
            value={fmt(inApp.total)}
            icon="🔔"
          />
          <StatCard
            label="Read"
            value={fmt(inApp.read)}
            sub={`${fmt(inApp.read_rate, { pct: true })} read rate`}
            icon="✅"
          />
          <StatCard
            label="Unread"
            value={fmt(inApp.unread)}
            sub="Across all users"
            icon="🔴"
          />
        </div>
      )}

      {/* WhatsApp setup guide */}
      {!loading && wa.total === 0 && (
        <div style={s.setupGuide}>
          <h3 style={s.setupTitle}>WhatsApp not configured</h3>
          <p style={s.setupText}>
            To enable WhatsApp notifications, add your Interakt API key
            to the environment variables:
          </p>
          <code style={s.setupCode}>INTERAKT_API_KEY=your_interakt_api_key</code>
          <p style={s.setupText}>
            Then ensure your WhatsApp templates are approved in the{' '}
            <a
              href="https://app.interakt.ai"
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--red)' }}
            >
              Interakt dashboard
            </a>{' '}
            before sending.
          </p>
        </div>
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
  channelLabel: {
    display: 'flex', alignItems: 'center', gap: '0.6rem',
    padding: '0.5rem 0', borderBottom: '2px solid var(--black)',
    marginBottom: '1rem',
  },
  channelIcon: { fontSize: '1.2rem' },
  channelName: {
    fontFamily: 'var(--font-serif)', fontSize: '1.1rem',
    fontWeight: '700', color: 'var(--black)',
  },
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' },
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' },
  funnelRow: {
    display: 'flex', justifyContent: 'space-around',
    alignItems: 'center', padding: '1.5rem 0',
  },
  ringWrap: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '0.5rem',
  },
  ringLabel: {
    position: 'absolute', top: '50%', left: '50%',
    transform: 'translate(-50%,-50%)',
    fontFamily: 'var(--font-sans)', fontSize: '0.8rem',
    fontWeight: '700', color: 'var(--black)',
  },
  ringName: {
    fontFamily: 'var(--font-sans)', fontSize: '0.75rem',
    color: 'var(--gray-500)',
  },
  failedNote: {
    fontFamily: 'var(--font-sans)', fontSize: '0.78rem',
    color: '#92400e', background: '#fef9c3',
    padding: '0.5rem 0.75rem', borderRadius: '2px',
    marginTop: '1rem',
  },
  setupGuide: {
    padding: '2rem',
    background: '#f8fafc', border: '1px solid var(--gray-200)',
    borderRadius: 'var(--radius)',
    display: 'flex', flexDirection: 'column', gap: '0.75rem',
  },
  setupTitle: {
    fontFamily: 'var(--font-serif)', fontSize: '1.1rem',
    fontWeight: '700', color: 'var(--black)',
  },
  setupText: {
    fontFamily: 'var(--font-sans)', fontSize: '0.875rem',
    color: 'var(--gray-600)', lineHeight: '1.6',
  },
  setupCode: {
    display: 'block', fontFamily: 'monospace', fontSize: '0.875rem',
    background: 'var(--black)', color: '#e2e8f0',
    padding: '0.6rem 1rem', borderRadius: 'var(--radius)',
  },
}

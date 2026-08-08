/**
 * GRADSKOOL — Admin Tools Analytics Page
 * Route: /admin-panel/tools
 *
 * Shows:
 *   - Total tool leads, sessions, tool→user conversion rate
 *   - Per-tool breakdown (leads, sessions, avg score)
 *   - Lead gate funnel visualization
 */
import { AdminLayout } from '../../components/admin/AdminLayout'
import {
  StatCard, SectionBox, DataTable,
  MiniBarChart, LoadingGrid, fmt,
} from '../../components/admin/AdminPrimitives'
import { useAdminTools } from '../../hooks/useAdminAnalytics'

const TOOL_TYPE_LABELS = {
  rc_passages:  'RC Passages',
  qa_topics:    'QA Topics',
  vocabulary:   'Vocabulary',
  grammar:      'Grammar',
  gk:           'General Knowledge',
  reasoning:    'Reasoning',
  legal:        'Legal Awareness',
  mcq_practice: 'MCQ Practice',
}

const TOOL_ICONS = {
  rc_passages:  '📖',
  qa_topics:    '🔢',
  vocabulary:   '🔤',
  grammar:      '✏️',
  gk:           '🌍',
  reasoning:    '🧩',
  legal:        '⚖️',
  mcq_practice: '✅',
}

export default function AdminToolsPage() {
  const { data, loading } = useAdminTools()

  const tools      = data?.tools || []
  const totalLeads = data?.total_tool_leads || 0
  const totalSess  = data?.total_sessions || 0

  return (
    <AdminLayout title="Free Tools">

      <div style={s.pageHeader}>
        <div>
          <p style={s.eyebrow}>Tool Analytics</p>
          <h1 style={s.pageTitle}>Free Tools</h1>
        </div>
      </div>

      {/* Summary cards */}
      {loading ? <LoadingGrid cols={4} /> : (
        <div style={s.grid4}>
          <StatCard
            label="Total Tool Leads"
            value={fmt(totalLeads)}
            sub="Submitted gate form"
            icon="🛠"
          />
          <StatCard
            label="Total Sessions"
            value={fmt(totalSess)}
            sub="Practice sessions started"
            icon="📝"
          />
          <StatCard
            label="Leads → Registered Users"
            value={fmt(data?.tool_to_user_conv)}
            icon="👤"
          />
          <StatCard
            label="Tool → User Conv. Rate"
            value={fmt(data?.tool_to_user_conv_pct, { pct: true })}
            sub="Tool leads who registered"
            icon="🎯"
            color={
              (data?.tool_to_user_conv_pct || 0) >= 20 ? '#10b981' :
              (data?.tool_to_user_conv_pct || 0) >= 10 ? '#f59e0b' : 'var(--black)'
            }
          />
        </div>
      )}

      {/* Lead chart */}
      {!loading && tools.length > 0 && (
        <SectionBox title="Leads by Tool" eyebrow="Gate submissions">
          <MiniBarChart
            data={tools}
            labelKey="name"
            valueKey="lead_count"
            color="var(--red)"
          />
        </SectionBox>
      )}

      {/* Per-tool table */}
      {!loading && (
        <SectionBox title="Tool Performance" eyebrow={`${tools.length} tools`}>
          <DataTable
            columns={[
              { key: 'name', label: 'Tool',
                render: r => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontSize: '1.1rem' }}>
                      {TOOL_ICONS[r.tool_type] || '🛠'}
                    </span>
                    <div>
                      <span style={{ fontWeight: '600', color: 'var(--black)',
                                      display: 'block' }}>{r.name}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--gray-400)' }}>
                        {TOOL_TYPE_LABELS[r.tool_type] || r.tool_type}
                      </span>
                    </div>
                  </div>
                )
              },
              { key: 'lead_count',    label: 'Leads',    align: 'right',
                render: r => <strong>{fmt(r.lead_count)}</strong> },
              { key: 'session_count', label: 'Sessions', align: 'right',
                render: r => fmt(r.session_count) },
              { key: 'conversion',    label: 'Lead→Session %', align: 'right',
                render: r => r.lead_count > 0
                  ? fmt((r.session_count / r.lead_count) * 100, { pct: true })
                  : '—'
              },
              { key: 'avg_score', label: 'Avg Score', align: 'right',
                render: r => r.avg_score != null
                  ? (
                    <span style={{
                      color: r.avg_score >= 70 ? '#10b981' :
                             r.avg_score >= 50 ? '#f59e0b' : '#ef4444',
                      fontWeight: '600',
                    }}>
                      {fmt(r.avg_score, { pct: true })}
                    </span>
                  )
                  : <span style={{ color: 'var(--gray-300)' }}>—</span>
              },
            ]}
            rows={tools}
            emptyMsg="No tool data yet."
          />
        </SectionBox>
      )}

      {/* Lead gate funnel note */}
      {!loading && (
        <div style={s.note}>
          <span style={s.noteIcon}>ℹ</span>
          <p style={s.noteText}>
            <strong>Lead gate funnel:</strong> Tool lead → Registered user conversion rate of{' '}
            <strong>{fmt(data?.tool_to_user_conv_pct, { pct: true })}</strong> means{' '}
            {fmt(data?.tool_to_user_conv)} of {fmt(totalLeads)} tool leads have
            created a GRADSKOOL account. These are your highest-intent leads.
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
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' },
  note: {
    display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
    padding: '1rem 1.25rem',
    background: '#eff6ff', border: '1px solid #bfdbfe',
    borderRadius: 'var(--radius)',
  },
  noteIcon: { fontSize: '1rem', flexShrink: 0, marginTop: '1px' },
  noteText: {
    fontFamily: 'var(--font-sans)', fontSize: '0.85rem',
    color: '#1e40af', lineHeight: '1.6',
  },
}

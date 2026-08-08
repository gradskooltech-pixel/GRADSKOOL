/**
 * GRADSKOOL Admin — Programmes
 * Route: /admin-panel/programmes
 *
 * Control which dashboard tabs are visible per pricing plan.
 * Changes affect ALL students enrolled in that plan immediately.
 */
import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '../../components/admin/AdminLayout'
import api from '../../lib/api'

const TABS = [
  { key: 'show_videos',        label: 'Videos',         icon: '🎬', desc: 'Video library in learning portal' },
  { key: 'show_practice_quiz', label: 'Practice Quiz',  icon: '📝', desc: 'Quiz interface after each topic' },
  { key: 'show_cheat_sheets',  label: 'Cheat Sheets',   icon: '📄', desc: 'AI-generated topic cheat sheets' },
  { key: 'show_live',          label: 'Live Sessions',  icon: '📡', desc: 'Live class join button' },
  { key: 'show_mocks',         label: 'Mocks',          icon: '🧪', desc: 'Redirect to mock test platform' },
  { key: 'show_books',         label: 'Books',          icon: '📚', desc: 'Downloadable books & PDFs' },
  { key: 'show_gdpi',          label: 'GDPI Prep',      icon: '🎤', desc: 'PI WAT GD preparation module' },
]

export default function AdminProgrammesPage() {
  const [exams, setExams]       = useState([])
  const [loading, setLoad]      = useState(true)
  const [saving, setSaving]     = useState({})    // { [planId]: true }
  const [saved, setSaved]       = useState({})    // { [planId]: true }
  const [expanded, setExpanded] = useState({})    // { [examId]: true }
  const [msg, setMsg]           = useState(null)

  const load = useCallback(() => {
    setLoad(true)
    api.get('/dashboard/programmes/')
      .then(({ data }) => {
        setExams(data)
        // Auto-expand first exam
        if (data.length) setExpanded({ [data[0].id]: true })
      })
      .catch(() => setMsg({ type: 'error', text: 'Failed to load programmes' }))
      .finally(() => setLoad(false))
  }, [])

  useEffect(() => { load() }, [load])

  const toggle = (examId) => {
    setExpanded(prev => ({ ...prev, [examId]: !prev[examId] }))
  }

  const handleToggle = async (planId, field, currentValue) => {
    // Optimistic update
    setExams(prev => prev.map(exam => ({
      ...exam,
      plans: exam.plans.map(plan =>
        plan.id === planId ? { ...plan, [field]: !currentValue } : plan
      ),
    })))

    // For string fields, debounce the save (don't save on every keystroke)
    if (isString) {
      clearTimeout(window._progDebounce)
      window._progDebounce = setTimeout(async () => {
        setSaving(prev => ({ ...prev, [planId]: true }))
        try {
          await api.patch(`/dashboard/programmes/plan/${planId}/`, { [field]: newValue })
          setSaved(prev => ({ ...prev, [planId]: true }))
          setTimeout(() => setSaved(prev => ({ ...prev, [planId]: false })), 2000)
        } catch { } finally {
          setSaving(prev => ({ ...prev, [planId]: false }))
        }
      }, 800)
      return
    }
    setSaving(prev => ({ ...prev, [planId]: true }))
    try {
      await api.patch(`/dashboard/programmes/plan/${planId}/`, { [field]: newValue })
      setSaved(prev => ({ ...prev, [planId]: true }))
      setTimeout(() => setSaved(prev => ({ ...prev, [planId]: false })), 2000)
    } catch {
      // Revert on error
      setExams(prev => prev.map(exam => ({
        ...exam,
        plans: exam.plans.map(plan =>
          plan.id === planId ? { ...plan, [field]: currentValue } : plan
        ),
      })))
      setMsg({ type: 'error', text: 'Failed to save — try again' })
    } finally {
      setSaving(prev => ({ ...prev, [planId]: false }))
    }
  }

  return (
    <AdminLayout title="Programmes">
      {/* How it works */}
      <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:'4px', padding:'1rem 1.25rem', marginBottom:'1.5rem', fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:'#1d4ed8', lineHeight:'1.6' }}>
        <strong>How this works:</strong> Each exam has pricing plans (e.g. "CAT Live + Mocks", "CAT Mocks Only").
        For each plan, you control: (1) what tabs appear on the student's dashboard card,
        (2) where "Continue Learning" goes, (3) what label the button shows, and (4) a short note on the card.
        <br /><strong>To add a student:</strong> Admin Panel → Manual Enroll → select exam + plan.
        Their dashboard will automatically reflect these settings.
      </div>

      <div style={s.header}>
        <div>
          <p style={s.eyebrow}>Management</p>
          <h1 style={s.title}>Programmes</h1>
          <p style={s.subtitle}>
            Control which tabs are visible per plan. Changes apply immediately to all enrolled students.
          </p>
        </div>
      </div>

      {msg && (
        <div style={{ ...s.msg, background: msg.type === 'success' ? '#f0fdf4' : '#fff5f5',
          border: `1px solid ${msg.type === 'success' ? '#86efac' : '#fca5a5'}`,
          color: msg.type === 'success' ? '#166534' : '#991b1b' }}>
          {msg.text}
          <button onClick={() => setMsg(null)} style={s.msgClose}>✕</button>
        </div>
      )}

      {/* Tab legend */}
      <div style={s.legend}>
        <p style={s.legendLabel}>Dashboard tabs:</p>
        <div style={s.legendItems}>
          {TABS.map(tab => (
            <div key={tab.key} style={s.legendItem}>
              <span>{tab.icon}</span>
              <span style={s.legendName}>{tab.label}</span>
              <span style={s.legendDesc}>{tab.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={s.loading}>Loading programmes…</div>
      ) : (
        <div style={s.examList}>
          {exams.map(exam => (
            <ExamSection
              key={exam.id}
              exam={exam}
              expanded={!!expanded[exam.id]}
              onToggleExpand={() => toggle(exam.id)}
              onToggleTab={handleToggle}
              saving={saving}
              saved={saved}
              onCohortSave={async (examId, size) => {
                await api.patch(`/dashboard/programmes/exam/${examId}/cohort-size/`, { cohort_size: size })
                load()
              }}
            />
          ))}
        </div>
      )}
    </AdminLayout>
  )
}

function ExamSection({ exam, expanded, onToggleExpand, onToggleTab, saving, saved, onCohortSave }) {
  const [editingCohort, setEditingCohort] = useState(false)
  const [cohortVal, setCohortVal]         = useState(exam.cohort_size)
  const [cohortSaving, setCohortSaving]   = useState(false)

  const saveCohort = async () => {
    setCohortSaving(true)
    try {
      await onCohortSave(exam.id, cohortVal)
      setEditingCohort(false)
    } finally {
      setCohortSaving(false)
    }
  }

  return (
    <div style={s.examCard}>
      {/* Exam header */}
      <button onClick={onToggleExpand} style={s.examHeader}>
        <div style={s.examHeaderLeft}>
          <span style={s.examShort}>{exam.short}</span>
          <span style={s.examName}>{exam.name}</span>
          <span style={s.examMeta}>{exam.plans.length} plans</span>
          {/* Seats indicator */}
          <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'600',
            color: exam.remaining <= 5 ? '#991b1b' : '#166534',
            background: exam.remaining <= 5 ? '#fff5f5' : '#f0fdf4',
            border: `1px solid ${exam.remaining <= 5 ? '#fca5a5' : '#86efac'}`,
            padding:'0.15rem 0.6rem', borderRadius:'100px' }}>
            {exam.remaining} / {exam.cohort_size} seats remaining
          </span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }} onClick={e => e.stopPropagation()}>
          {/* Cohort size editor */}
          {editingCohort ? (
            <div style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
              <input
                type="number" min="1" max="100"
                value={cohortVal}
                onChange={e => setCohortVal(Number(e.target.value))}
                style={{ width:'60px', padding:'0.25rem 0.4rem', fontFamily:'var(--font-sans)', fontSize:'0.82rem', border:'1px solid var(--gray-200)', borderRadius:'3px', textAlign:'center' }}
              />
              <button onClick={saveCohort} disabled={cohortSaving}
                style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'600', color:'#166534', background:'#f0fdf4', border:'1px solid #86efac', padding:'0.25rem 0.6rem', borderRadius:'3px', cursor:'pointer' }}>
                {cohortSaving ? '…' : 'Save'}
              </button>
              <button onClick={() => setEditingCohort(false)}
                style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:'var(--gray-400)', background:'none', border:'none', cursor:'pointer' }}>
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => setEditingCohort(true)}
              style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:'var(--gray-400)', background:'none', border:'1px solid var(--gray-200)', padding:'0.25rem 0.6rem', borderRadius:'3px', cursor:'pointer' }}>
              Edit cap ({exam.cohort_size})
            </button>
          )}
          <span style={{ fontFamily:'var(--font-sans)', fontSize:'1rem', color:'var(--gray-400)', transform: expanded ? 'rotate(180deg)' : 'none', transition:'transform 0.2s' }}>▾</span>
        </div>
      </button>

      {/* Plans */}
      {expanded && (
        <div style={s.plansWrap}>
          {/* Column headers */}
          <div style={s.colHeaders}>
            <div style={s.planNameCol}>Plan</div>
            {TABS.map(tab => (
              <div key={tab.key} style={s.tabCol}>
                <span style={s.tabIcon}>{tab.icon}</span>
                <span style={s.tabColLabel}>{tab.label}</span>
              </div>
            ))}
            <div style={s.statusCol}>Status</div>
          </div>

          {/* Plan rows */}
          {exam.plans.map(plan => (
            <PlanRow
              key={plan.id}
              plan={plan}
              onToggle={onToggleTab}
              isSaving={saving[plan.id]}
              isSaved={saved[plan.id]}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function PlanRow({ plan, onToggle, isSaving, isSaved }) {
  const activeCount = TABS.filter(t => plan[t.key]).length

  return (
    <div style={s.planRow}>
      {/* Plan name */}
      <div style={s.planNameCol}>
        <p style={s.planName}>{plan.name}</p>
        <p style={s.planPrice}>₹{Number(plan.price_inr).toLocaleString('en-IN')}</p>
      </div>

      {/* Toggle per tab */}
      {TABS.map(tab => (
        <div key={tab.key} style={s.tabCol}>
          <Toggle
            on={!!plan[tab.key]}
            disabled={isSaving}
            onChange={() => onToggle(plan.id, tab.key, plan[tab.key])}
          />
        </div>
      ))}

      {/* Status */}
      <div style={s.statusCol}>
        {isSaving ? (
          <span style={s.savingDot}>Saving…</span>
        ) : isSaved ? (
          <span style={s.savedDot}>✓ Saved</span>
        ) : (
          <span style={s.activeBadge}>{activeCount} active</span>
        )}
      </div>
    </div>
  )
}

function Toggle({ on, onChange, disabled }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      style={{
        width:          '44px',
        height:         '24px',
        borderRadius:   '100px',
        background:     on ? '#0f0f0f' : '#e5e7eb',
        border:         'none',
        cursor:         disabled ? 'not-allowed' : 'pointer',
        position:       'relative',
        transition:     'background 0.2s',
        flexShrink:     0,
        opacity:        disabled ? 0.6 : 1,
      }}
    >
      <span style={{
        position:    'absolute',
        top:         '2px',
        left:        on ? '22px' : '2px',
        width:       '20px',
        height:      '20px',
        borderRadius:'50%',
        background:  on ? '#ff5e5f' : '#ffffff',
        boxShadow:   '0 1px 3px rgba(0,0,0,0.2)',
        transition:  'left 0.2s, background 0.2s',
      }} />
    </button>
  )
}

// ── STYLES ────────────────────────────────────────────────────────────────────

const s = {
  header:     { marginBottom: '2rem' },
  eyebrow:    { fontFamily: 'var(--font-sans)', fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: '0.25rem' },
  title:      { fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: '700', color: 'var(--black)', marginBottom: '0.4rem' },
  subtitle:   { fontFamily: 'var(--font-sans)', fontSize: '0.875rem', color: 'var(--gray-500)', lineHeight: '1.6' },

  msg:        { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', marginBottom: '1rem', fontFamily: 'var(--font-sans)', fontSize: '0.875rem' },
  msgClose:   { background: 'none', border: 'none', cursor: 'pointer' },

  legend:     { background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', padding: '1rem 1.5rem', marginBottom: '1.5rem' },
  legendLabel:{ fontFamily: 'var(--font-sans)', fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: '0.75rem' },
  legendItems:{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' },
  legendItem: { display: 'flex', alignItems: 'center', gap: '0.4rem' },
  legendName: { fontFamily: 'var(--font-sans)', fontSize: '0.78rem', fontWeight: '600', color: 'var(--black)' },
  legendDesc: { fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: 'var(--gray-400)' },

  loading:    { padding: '3rem', textAlign: 'center', fontFamily: 'var(--font-sans)', color: 'var(--gray-400)' },
  examList:   { display: 'flex', flexDirection: 'column', gap: '1rem' },

  examCard:   { background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', overflow: 'hidden' },
  examHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' },
  examHeaderLeft: { display: 'flex', alignItems: 'center', gap: '1rem' },
  examShort:  { fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontWeight: '700', color: 'var(--black)', minWidth: '60px' },
  examName:   { fontFamily: 'var(--font-sans)', fontSize: '0.875rem', color: 'var(--gray-600)' },
  examMeta:   { fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: 'var(--gray-400)', background: 'var(--gray-50)', padding: '0.15rem 0.5rem', borderRadius: '100px', border: '1px solid var(--gray-200)' },

  plansWrap:  { borderTop: '1px solid var(--gray-100)' },
  colHeaders: { display: 'grid', gridTemplateColumns: '220px repeat(7, 72px) 80px', gap: 0, padding: '0.75rem 1.5rem', background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-100)', alignItems: 'center' },
  planNameCol:{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gray-400)' },
  tabCol:     { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' },
  tabIcon:    { fontSize: '1rem' },
  tabColLabel:{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', fontWeight: '600', color: 'var(--gray-400)', textAlign: 'center', letterSpacing: '0.04em' },
  statusCol:  { fontFamily: 'var(--font-sans)', fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gray-400)', textAlign: 'right' },

  planRow:    { display: 'grid', gridTemplateColumns: '220px repeat(7, 72px) 80px', gap: 0, padding: '1rem 1.5rem', borderBottom: '1px solid var(--gray-100)', alignItems: 'center' },
  planName:   { fontFamily: 'var(--font-sans)', fontSize: '0.82rem', fontWeight: '600', color: 'var(--black)', marginBottom: '0.15rem' },
  planPrice:  { fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: 'var(--gray-400)' },
  activeBadge:{ fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: 'var(--gray-400)', textAlign: 'right', display: 'block' },
  savingDot:  { fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: 'var(--gray-400)', textAlign: 'right', display: 'block' },
  savedDot:   { fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: '#166534', fontWeight: '600', textAlign: 'right', display: 'block' },
}

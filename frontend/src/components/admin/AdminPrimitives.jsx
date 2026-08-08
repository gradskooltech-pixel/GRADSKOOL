/**
 * GRADSKOOL — Admin UI Primitives
 * Shared components used across all admin analytics panels.
 */

export function StatCard({ label, value, sub, icon, trend, color = 'var(--black)' }) {
  return (
    <div style={sc.card}>
      <div style={sc.top}>
        <span style={sc.icon}>{icon}</span>
        {trend != null && (
          <span style={{ ...sc.trend, color: trend >= 0 ? '#10b981' : '#ef4444' }}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div style={{ ...sc.value, color }}>{value ?? '—'}</div>
      <div style={sc.label}>{label}</div>
      {sub && <div style={sc.sub}>{sub}</div>}
    </div>
  )
}

const sc = {
  card: {
    background: 'var(--white)',
    border: '1px solid var(--gray-200)',
    borderRadius: 'var(--radius)',
    padding: '1.5rem',
  },
  top: { display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' },
  icon: { fontSize: '1.4rem' },
  trend: {
    fontFamily: 'var(--font-sans)', fontSize: '0.75rem', fontWeight: '700',
    background: 'var(--gray-100)', padding: '0.15rem 0.5rem', borderRadius: '2px',
  },
  value: {
    fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: '700',
    color: 'var(--black)', lineHeight: '1', marginBottom: '0.3rem',
  },
  label: {
    fontFamily: 'var(--font-sans)', fontSize: '0.78rem',
    fontWeight: '600', color: 'var(--gray-600)',
  },
  sub: {
    fontFamily: 'var(--font-sans)', fontSize: '0.7rem',
    color: 'var(--gray-400)', marginTop: '0.15rem',
  },
}

export function SectionBox({ title, eyebrow, action, children }) {
  return (
    <div style={box.wrap}>
      <div style={box.header}>
        <div>
          {eyebrow && <p style={box.eyebrow}>{eyebrow}</p>}
          <h2 style={box.title}>{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

const box = {
  wrap: {
    background: 'var(--white)',
    border: '1px solid var(--gray-200)',
    borderRadius: 'var(--radius)',
    padding: '1.5rem',
  },
  header: {
    display: 'flex', alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '1.5rem',
  },
  eyebrow: {
    fontFamily: 'var(--font-sans)', fontSize: '0.65rem', fontWeight: '700',
    letterSpacing: '0.1em', textTransform: 'uppercase',
    color: 'var(--gray-400)', marginBottom: '0.2rem',
  },
  title: {
    fontFamily: 'var(--font-serif)', fontSize: '1.15rem',
    fontWeight: '700', color: 'var(--black)',
  },
}

export function DataTable({ columns, rows, emptyMsg = 'No data.' }) {
  if (!rows?.length) {
    return (
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem',
                  color: 'var(--gray-400)', padding: '1.5rem 0', textAlign: 'center' }}>
        {emptyMsg}
      </p>
    )
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={dt.table}>
        <thead>
          <tr style={dt.thead}>
            {columns.map(col => (
              <th key={col.key} style={{ ...dt.th, textAlign: col.align || 'left' }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={dt.tr}>
              {columns.map(col => (
                <td key={col.key} style={{ ...dt.td, textAlign: col.align || 'left' }}>
                  {col.render ? col.render(row) : row[col.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const dt = {
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' },
  th: {
    fontFamily: 'var(--font-sans)', fontSize: '0.65rem', fontWeight: '700',
    letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gray-400)',
    padding: '0.65rem 0.875rem',
  },
  tr: { borderBottom: '1px solid var(--gray-100)' },
  td: {
    fontFamily: 'var(--font-sans)', fontSize: '0.83rem',
    color: 'var(--gray-700)', padding: '0.75rem 0.875rem',
  },
}

export function MiniBarChart({ data, valueKey, labelKey, color = 'var(--red)' }) {
  if (!data?.length) return null
  const max = Math.max(...data.map(d => d[valueKey]))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{
            fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: 'var(--gray-600)',
            width: '120px', flexShrink: 0, overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {d[labelKey]}
          </span>
          <div style={{ flex: 1, height: '6px', background: 'var(--gray-100)',
                        borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              width: max > 0 ? `${(d[valueKey] / max) * 100}%` : '0%',
              height: '100%', background: color, borderRadius: '3px',
              transition: 'width 0.5s ease',
            }} />
          </div>
          <span style={{
            fontFamily: 'var(--font-sans)', fontSize: '0.72rem',
            fontWeight: '700', color: 'var(--black)',
            width: '64px', textAlign: 'right', flexShrink: 0,
          }}>
            {typeof d[valueKey] === 'number' && d[valueKey] > 999
              ? `₹${(d[valueKey]/1000).toFixed(0)}K`
              : d[valueKey]}
          </span>
        </div>
      ))}
    </div>
  )
}

export function ProgressRing({ pct, size = 80, stroke = 8, color = 'var(--red)' }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r}
        fill="none" stroke="var(--gray-100)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r}
        fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  )
}

export function SparkLine({ data, valueKey, height = 48, color = 'var(--black)' }) {
  if (!data?.length || data.length < 2) return null
  const vals = data.map(d => d[valueKey])
  const min  = Math.min(...vals)
  const max  = Math.max(...vals)
  const W = 200, H = height
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * W
    const y = max === min ? H / 2 : H - ((v - min) / (max - min)) * H
    return `${x},${y}`
  })
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height, overflow: 'visible' }}>
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function LoadingGrid({ cols = 4, rows = 1 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '1rem' }}>
      {Array.from({ length: cols * rows }).map((_, i) => (
        <div key={i} style={{
          height: '110px', background: 'var(--gray-100)',
          borderRadius: 'var(--radius)', animation: 'pulse 1.5s infinite',
        }} />
      ))}
    </div>
  )
}

export function Badge({ label, color = '#9ca3af', bg = '#f3f4f6' }) {
  return (
    <span style={{
      fontFamily: 'var(--font-sans)', fontSize: '0.62rem', fontWeight: '700',
      letterSpacing: '0.06em', textTransform: 'uppercase',
      padding: '0.15rem 0.45rem', borderRadius: '2px',
      background: bg, color,
    }}>
      {label}
    </span>
  )
}

export function fmt(n, opts = {}) {
  if (n == null) return '—'
  if (opts.currency) return `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
  if (opts.pct)      return `${Number(n).toFixed(1)}%`
  return Number(n).toLocaleString('en-IN')
}

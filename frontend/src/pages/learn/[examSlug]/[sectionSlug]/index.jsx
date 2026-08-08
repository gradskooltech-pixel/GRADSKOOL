/**
 * GRADSKOOL — Portal Topics List
 * Route: /learn/[examSlug]/[sectionSlug]
 *
 * Lists all topics in a section (e.g. all QA topics).
 * Each topic shows: progress, video count, quiz score, status.
 * Student clicks a topic to enter the 4-tab topic page.
 */
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ProtectedRoute } from '../../../../components/auth/ProtectedRoute'
import api from '../../../../lib/api'

export default function SectionTopicsPage() {
  return <ProtectedRoute><Inner /></ProtectedRoute>
}

function Inner() {
  const router              = useRouter()
  const { examSlug, sectionSlug } = router.query
  const [data, setData]     = useState(null)
  const [loading, setLoad]  = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!examSlug || !sectionSlug) return
    api.get(`/learn/${examSlug}/sections/${sectionSlug}/topics/`)
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setLoad(false))
  }, [examSlug, sectionSlug])

  const topics   = data?.topics || []
  const section  = data?.section

  const filtered = search
    ? topics.filter(t => t.title.toLowerCase().includes(search.toLowerCase()))
    : topics

  const completed = topics.filter(t => t.status === 'completed').length
  const inProgress = topics.filter(t => t.status === 'in_progress').length

  return (
    <>
      <Head>
        <title>{section?.title} — {examSlug?.toUpperCase()} — GRADSKOOL</title>
        <meta name="robots" content="noindex" />
      </Head>

      {/* Top bar */}
      <div style={s.topBar}>
        <div style={{ display:'flex', alignItems:'center', gap:'1.5rem' }}>
          <Link href="/" style={{ fontFamily:'Georgia, serif', fontSize:'1.3rem', fontWeight:'700', letterSpacing:'0.04em', color:'#0f0f0f', textDecoration:'none' }}>
            GRAD<span style={{ color:'#ff5e5f' }}>SKOOL</span>
          </Link>
          <div style={s.topLeft}>
            <Link href={`/learn/${examSlug}`} style={s.topBack}>
              {examSlug?.toUpperCase()}
            </Link>
            <span style={s.topSep}>/</span>
            <span style={s.topSection}>{section?.short_title || section?.title}</span>
          </div>
        </div>
        <div style={{ display:'flex', gap:'1.5rem', alignItems:'center' }}>
          <Link href="/tools" style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:'#666', textDecoration:'none' }}>Free Tools</Link>
          <Link href="/dashboard" style={s.dashLink}>Dashboard →</Link>
        </div>
      </div>

      <div style={s.body}>

        {/* Header */}
        <div style={s.pageHeader}>
          <div>
            <p style={s.eyebrow}>{examSlug?.toUpperCase()}</p>
            <h1 style={s.pageTitle}>{section?.title}</h1>
          </div>
          <div style={s.headerStats}>
            <Stat value={completed}   label="Completed"   color="#10b981" />
            <Stat value={inProgress}  label="In Progress" color="#f59e0b" />
            <Stat value={topics.length - completed - inProgress}
                  label="Not Started" color="var(--gray-400)" />
          </div>
        </div>

        {/* Search */}
        <div style={s.searchWrap}>
          <input
            type="text"
            placeholder={`Search ${topics.length} topics…`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={s.searchInput}
          />
        </div>

        {/* Topics list */}
        {loading ? (
          <SkeletonList />
        ) : filtered.length === 0 ? (
          <p style={s.empty}>No topics found.</p>
        ) : (
          <div style={s.topicList}>
            {filtered.map((topic, idx) => (
              <TopicRow
                key={topic.id}
                topic={topic}
                href={`/learn/${examSlug}/${sectionSlug}/${topic.slug}`}
                idx={idx}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function TopicRow({ topic, href, idx }) {
  const [hov, setHov] = useState(false)
  const STATUS_CONFIG = {
    completed:   { icon: '✓', bg: '#dcfce7', color: '#166534', label: 'Completed' },
    in_progress: { icon: '▶', bg: '#fef9c3', color: '#92400e', label: 'In Progress' },
    not_started: { icon: '○', bg: '#f5f5f3', color: '#999',    label: 'Not Started' },
  }
  const cfg = STATUS_CONFIG[topic.status] || STATUS_CONFIG.not_started

  return (
    <Link href={href}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ ...s.topicRow, background: hov ? '#fafaf9' : '#ffffff', borderColor: hov ? '#ff5e5f' : '#e8e8e6' }}>
      {/* Number */}
      <span style={s.topicNum}>{String(idx + 1).padStart(2, '0')}</span>

      {/* Status icon */}
      <div style={{ ...s.statusIcon, background: cfg.bg, color: cfg.color }}>
        {cfg.icon}
      </div>

      {/* Info */}
      <div style={s.topicInfo}>
        <p style={s.topicTitle}>{topic.title}</p>
        <div style={s.topicMeta}>
          <span style={s.metaItem}>
            📹 {topic.total_videos} videos
          </span>
          {topic.completed_videos > 0 && (
            <span style={s.metaItem}>
              {topic.completed_videos}/{topic.total_videos} done
            </span>
          )}
          {topic.has_quiz && (
            <span style={s.metaItem}>🎯 Practice quiz</span>
          )}
          {topic.best_score != null && (
            <span style={{ ...s.metaItem, color: topic.best_score >= 70 ? '#10b981' : '#f59e0b', fontWeight: '600' }}>
              Best: {Math.round(topic.best_score)}%
            </span>
          )}
        </div>

        {/* Progress bar */}
        {topic.pct > 0 && (
          <div style={s.topicBar}>
            <div style={{ ...s.topicBarFill, width: `${topic.pct}%` }} />
          </div>
        )}
      </div>

      {/* Arrow */}
      <span style={{ ...s.rowArrow, color: hov ? '#ff5e5f' : '#ccc', transform: hov ? 'translateX(3px)' : 'none', transition:'color 0.15s, transform 0.15s' }}>→</span>
    </Link>
  )
}

function Stat({ value, label, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem',
                  fontWeight: '700', color, lineHeight: '1' }}>{value}</p>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.7rem',
                  color: 'var(--gray-400)', marginTop: '0.2rem' }}>{label}</p>
    </div>
  )
}

function SkeletonList() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} style={{
          height: '72px', background: 'var(--gray-100)',
          borderRadius: 'var(--radius)', animation: 'pulse 1.5s infinite',
        }} />
      ))}
    </div>
  )
}

const s = {
  topBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 2rem', height: '56px',
    background: '#ffffff', borderBottom: '1px solid #e8e8e6',
    position: 'sticky', top: 0, zIndex: 100,
  },
  topLeft: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  topBack: { fontFamily: 'var(--font-sans)', fontSize: '0.82rem', color: '#999', textDecoration: 'none' },
  topSep: { color: '#ddd' },
  topSection: { fontFamily: 'var(--font-sans)', fontSize: '0.82rem', fontWeight: '600', color: '#0f0f0f' },
  dashLink: { fontFamily: 'var(--font-sans)', fontSize: '0.82rem', fontWeight: '600', color: '#ff5e5f', textDecoration: 'none' },
  body: { maxWidth: '800px', margin: '0 auto', padding: '3rem 2rem', minHeight: 'calc(100vh - 56px)', background: '#fafaf9' },
  pageHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '2rem',
  },
  eyebrow: {
    fontFamily: 'var(--font-sans)', fontSize: '0.68rem', fontWeight: '700',
    letterSpacing: '0.12em', textTransform: 'uppercase',
    color: 'var(--red)', marginBottom: '0.3rem',
  },
  pageTitle: {
    fontFamily: 'var(--font-serif)', fontSize: '2rem',
    fontWeight: '700', color: 'var(--black)',
  },
  headerStats: { display: 'flex', gap: '2rem' },
  searchWrap: { marginBottom: '1.5rem' },
  searchInput: {
    width: '100%', padding: '0.75rem 1rem',
    fontFamily: 'var(--font-sans)', fontSize: '0.875rem',
    border: '1.5px solid var(--gray-200)', borderRadius: 'var(--radius)',
    background: 'var(--white)', outline: 'none',
  },
  topicList: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  topicRow: {
    display: 'flex', alignItems: 'center', gap: '1rem',
    padding: '1rem 1.25rem',
    background: 'var(--white)',
    border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)',
    textDecoration: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
    cursor: 'pointer',
  },
  topicNum: {
    fontFamily: 'var(--font-sans)', fontSize: '0.72rem',
    fontWeight: '700', color: 'var(--gray-300)',
    width: '24px', flexShrink: 0,
  },
  statusIcon: {
    width: '28px', height: '28px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.8rem', fontWeight: '700', flexShrink: 0,
  },
  topicInfo: { flex: 1, minWidth: 0 },
  topicTitle: {
    fontFamily: 'Georgia, serif', fontSize: '0.95rem',
    fontWeight: '500', color: '#0f0f0f', marginBottom: '0.3rem', lineHeight: '1.3',
  },
  topicMeta: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' },
  metaItem: { fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: 'var(--gray-400)' },
  topicBar: {
    height: '3px', background: 'var(--gray-100)',
    borderRadius: '2px', overflow: 'hidden', marginTop: '0.4rem',
  },
  topicBarFill: {
    height: '100%', background: 'var(--red)', borderRadius: '2px',
  },
  rowArrow: { fontFamily: 'var(--font-sans)', fontSize: '1rem', color: 'var(--gray-300)', flexShrink: 0 },
  empty: { fontFamily: 'var(--font-sans)', fontSize: '0.875rem', color: 'var(--gray-400)', textAlign: 'center', padding: '3rem' },
}

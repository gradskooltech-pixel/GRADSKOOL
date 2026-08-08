/**
 * GRADSKOOL — Dashboard v3
 * First screen: pick your course → enter that course's portal
 * Below: recommended courses for unenrolled exams
 * Then: gamification bar, goals, weak areas
 */
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ProtectedRoute } from '../../components/auth/ProtectedRoute'
import { useAuth } from '../../hooks/useAuth'
import api from '../../lib/api'

const C = {
  red:'#ff5e5f', black:'#0f0f0f', white:'#fff', bg:'#f7f6f3',
  border:'#e8e8e6', gray:'#999', muted:'#f4f3f0',
  green:'#22c55e', amber:'#f59e0b', blue:'#3b82f6', purple:'#7b2d8b',
}

const COURSE_TYPE_LABEL = {
  recorded:      'Recorded Videos + Quizzes',
  live_recorded: 'Live Classes + Recordings',
  mocks_only:    'Mocks Only',
  crash_course:  'Crash Course',
  self_paced:    'Self-Paced',
  gdpi_prep:     'GDPI Preparation',
  custom:        'Custom',
}
const COURSE_TYPE_COLOR = {
  recorded:'#3b82f6', live_recorded:'#7b2d8b', mocks_only:'#f59e0b',
  crash_course:'#e63946', self_paced:'#22c55e', gdpi_prep:'#0e7490', custom:'#666',
}

export default function Dashboard() {
  return <ProtectedRoute><Inner /></ProtectedRoute>
}

function Inner() {
  const { user } = useAuth()
  const router   = useRouter()
  const [courses, setCourses]   = useState(null)   // {enrolled, recommended, primary_exam}
  const [gam,     setGam]       = useState(null)
  const [loading, setLoad]      = useState(true)
  const [setting, setSetting]   = useState(null)   // exam being set as active
  const [todayPlan, setTodayPlan] = useState([])
  const [mockCreds, setMockCreds] = useState([])

  const primaryExam = courses?.primary_exam || user?.target_exam || 'cat'

  useEffect(() => {
    const _exam = user?.target_exam || 'cat'
    Promise.all([
      api.get('/learn/active-course/'),
      api.get('/learn/gamification/?exam=' + _exam),
      api.get('/learn/todays-plan/?exam=' + _exam),
    ]).then(([c, g, p]) => {
      setCourses(c.data)
      setGam(g.data)
      setTodayPlan(p.data?.tasks || [])
    }).catch(() => {
      setCourses({ enrolled: [], recommended: [], primary_exam: 'cat' })
      setGam({ xp: 0, streak: 0, level: 1, xp_to_next: 500, badges: [], goals: [], weak_topics: [], due_reviews: [] })
    }).finally(() => setLoad(false))
  }, [])

  useEffect(() => {
    api.get('/enrollments/mock-credentials/')
      .then(({ data }) => setMockCreds(data || []))
      .catch(() => setMockCreds([]))
  }, [])

  const selectCourse = async (exam_slug) => {
    setSetting(exam_slug)
    try {
      await api.post('/learn/active-course/', { exam_slug, is_primary: true })
      router.push('/learn/' + exam_slug)
    } catch {
      router.push('/learn/' + exam_slug)
    } finally {
      setSetting(null)
    }
  }

  const xpPct = gam ? Math.round(((500 - gam.xp_to_next) / 500) * 100) : 0

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <Head><title>Dashboard — GRADSKOOL</title></Head>

      {/* Top nav */}
      <div style={{ background: C.black, padding: '0.875rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontFamily: 'Georgia,serif', fontSize: '1.1rem', fontWeight: '700', color: '#fff' }}>GRADSKOOL</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {gam && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: C.amber, fontWeight: '700' }}>⚡{gam.xp}</span>
                <div style={{ width: '60px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '100px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: xpPct + '%', background: C.amber, borderRadius: '100px' }} />
                </div>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)' }}>Lv{gam.level}</span>
              </div>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: '#f97316' }}>🔥{gam.streak}</span>
            </>
          )}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {[['Planner', '/dashboard/planner'], ['Goals', '/dashboard/goals'], ['Profile', '/profile']].map(([l, h]) => (
              <Link key={h} href={h} style={{ fontFamily: 'var(--font-sans)', fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', textDecoration: 'none', padding: '0.2rem 0.5rem', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '3px' }}>{l}</Link>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Greeting */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'Georgia,serif', fontSize: '1.75rem', fontWeight: '700', color: C.black, marginBottom: '0.25rem' }}>
            Welcome back, {user?.first_name || 'Student'} 👋
          </h1>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.875rem', color: C.gray }}>
            {loading ? 'Loading your courses…' : courses?.enrolled?.length
              ? `You are enrolled in ${courses.enrolled.length} course${courses.enrolled.length !== 1 ? 's' : ''}. Select one to continue.`
              : 'You are not enrolled in any course yet. Browse below to get started.'}
          </p>
        </div>

        {/* ── ENROLLED COURSES ─────────────────────────────────────────────── */}
        {!loading && courses?.enrolled?.length > 0 && (
          <div style={{ marginBottom: '2.5rem' }}>
            <p style={s.sLabel}>My Courses</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: '1rem', marginTop: '0.875rem' }}>
              {courses.enrolled.map(e => (
                <div key={e.exam_slug}
                  style={{ background: C.white, border: '2px solid ' + (e.is_primary ? C.red : C.border), borderRadius: '10px', overflow: 'hidden', transition: 'box-shadow 0.15s' }}
                  onMouseEnter={ev => ev.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.1)'}
                  onMouseLeave={ev => ev.currentTarget.style.boxShadow = 'none'}>

                  {/* Card top accent */}
                  <div style={{ height: '4px', background: COURSE_TYPE_COLOR[e.course_type] || C.red }} />

                  <div style={{ padding: '1.25rem' }}>
                    {/* Exam + type badges */}
                    <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.72rem', fontWeight: '700', padding: '0.2rem 0.625rem', borderRadius: '100px', background: C.black, color: '#fff' }}>
                        {e.exam_name}
                      </span>
                      {e.course_type && (
                        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '100px', background: C.muted, color: C.gray }}>
                          {COURSE_TYPE_LABEL[e.course_type] || e.course_type}
                        </span>
                      )}
                      {e.is_primary && (
                        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.62rem', fontWeight: '700', padding: '0.15rem 0.5rem', borderRadius: '100px', background: '#fff5f5', color: C.red, marginLeft: 'auto' }}>
                          ★ Primary
                        </span>
                      )}
                    </div>

                    <p style={{ fontFamily: 'Georgia,serif', fontSize: '1rem', fontWeight: '700', color: C.black, marginBottom: '0.375rem', lineHeight: 1.3 }}>
                      {e.course_title || e.exam_name + ' Preparation'}
                    </p>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.68rem', color: C.gray, marginBottom: '1.25rem' }}>
                      {e.plan_name}
                      {e.start_date ? ' · Started ' + new Date(e.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                    </p>

                    <button onClick={() => selectCourse(e.exam_slug)} disabled={setting === e.exam_slug}
                      style={{ width: '100%', padding: '0.75rem', background: e.is_primary ? C.red : C.black, color: '#fff', border: 'none', borderRadius: '6px', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: '700', cursor: setting ? 'not-allowed' : 'pointer', transition: 'opacity 0.15s' }}>
                      {setting === e.exam_slug ? 'Opening…' : (e.is_primary ? 'Continue Learning →' : 'Switch to this course →')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && courses?.enrolled?.length === 0 && (
          <div style={{ background: C.white, border: '1px dashed ' + C.border, borderRadius: '10px', padding: '3rem', textAlign: 'center', marginBottom: '2.5rem' }}>
            <p style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎓</p>
            <p style={{ fontFamily: 'Georgia,serif', fontSize: '1.1rem', fontWeight: '700', color: C.black, marginBottom: '0.5rem' }}>No courses yet</p>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.875rem', color: C.gray, marginBottom: '1.5rem' }}>Browse our courses below and enrol to get started.</p>
            <Link href="/courses" style={{ padding: '0.75rem 2rem', background: C.red, color: '#fff', borderRadius: '6px', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: '700', textDecoration: 'none' }}>
              Browse Courses →
            </Link>
          </div>
        )}

        {/* ── QUICK STATS (if enrolled) ─────────────────────────────────────── */}
        {!loading && courses?.enrolled?.length > 0 && gam && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.875rem', marginBottom: '2.5rem' }}>
            {[
              ['📹', gam.videos_watched || 0, 'Videos watched', '/learn/' + primaryExam],
              ['📝', gam.quizzes_done   || 0, 'Quizzes done',   '/dashboard/wrong-answers'],
              ['🔥', gam.streak        || 0, 'Day streak',      '/dashboard/heatmap'],
              ['⚡', gam.xp            || 0, 'Total XP',        '/dashboard/badges'],
            ].map(([icon, val, label, href]) => (
              <Link key={label} href={href} style={{ textDecoration: 'none' }}>
                <div style={{ background: C.white, border: '1px solid ' + C.border, borderRadius: '8px', padding: '1rem', textAlign: 'center', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = C.red}
                  onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                  <p style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{icon}</p>
                  <p style={{ fontFamily: 'Georgia,serif', fontSize: '1.5rem', fontWeight: '700', color: C.black, lineHeight: 1, marginBottom: '0.15rem' }}>{val}</p>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.62rem', color: C.gray }}>{label}</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* ── TODAY'S PLAN ─────────────────────────────────────────────────── */}
        {todayPlan.length > 0 && (
          <div style={{ background:C.white, border:'1px solid '+C.border, borderRadius:'8px', padding:'1.25rem', marginBottom:'2.5rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
              <p style={s.sLabel}>Today's Tasks</p>
              <Link href="/dashboard/planner" style={{ fontFamily:'var(--font-sans)', fontSize:'0.7rem', color:C.red, textDecoration:'none' }}>Full planner →</Link>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
              {todayPlan.map((task, i) => {
                const icons = { video:'📹', quiz:'📝', review:'⏰', mock:'🧪', rest:'😴' }
                const clr   = { high:C.red, medium:C.amber, low:C.gray }
                const href  = task.section_slug && task.topic_slug
                  ? '/learn/' + primaryExam + '/' + task.section_slug + '/' + task.topic_slug
                  : null
                const inner = (
                  <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.75rem 1rem', background:C.muted, borderRadius:'6px', borderLeft:'3px solid '+(clr[task.priority]||C.gray) }}>
                    <span style={{ fontSize:'1rem', flexShrink:0 }}>{icons[task.type]||'📌'}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'600', color:C.black, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{task.title}</p>
                      {task.note && <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', color:C.gray }}>{task.note}</p>}
                    </div>
                    <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', color:C.gray, flexShrink:0 }}>{task.duration_mins}min</span>
                    {href && <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.7rem', color:C.red }}>→</span>}
                  </div>
                )
                return href
                  ? <Link key={i} href={href} style={{ textDecoration:'none' }}>{inner}</Link>
                  : <div key={i}>{inner}</div>
              })}
            </div>
          </div>
        )}

        {/* ── FOCUS AREAS (weak topics + spaced rep) ────────────────────────── */}
        {gam && (gam.weak_topics?.length > 0 || gam.due_reviews?.length > 0) && (
          <div style={{ background: C.white, border: '1px solid ' + C.border, borderRadius: '8px', padding: '1.25rem', marginBottom: '2.5rem' }}>
            <p style={s.sLabel}>Focus Areas Today</p>
            <div style={{ marginTop: '0.875rem' }}>
              {gam.due_reviews?.slice(0, 3).map((r, i) => (
                <Link key={i} href={'/learn/' + (r.exam || primaryExam) + '/' + (r.section || '') + '/' + r.slug}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0', borderBottom: '1px solid ' + C.border, textDecoration: 'none' }}>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.62rem', fontWeight: '700', padding: '0.15rem 0.375rem', borderRadius: '3px', background: '#eff6ff', color: C.blue }}>⏰ REVIEW</span>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: C.black, flex: 1 }}>{r.title}</span>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', color: C.gray }}>Was {Math.round(r.last_score)}%</span>
                </Link>
              ))}
              {gam.weak_topics?.slice(0, 3).map((w, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0', borderBottom: '1px solid ' + C.border }}>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.62rem', fontWeight: '700', padding: '0.15rem 0.375rem', borderRadius: '3px', background: '#fff1f2', color: C.red }}>⚠ WEAK</span>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: C.black, flex: 1 }}>{w['topic_video__topic__title']}</span>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.68rem', fontWeight: '700', color: C.red }}>{Math.round(w.score_pct)}%</span>
                </div>
              ))}
            </div>
            <Link href="/dashboard/wrong-answers" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: C.red, textDecoration: 'none', display: 'block', marginTop: '0.75rem', fontWeight: '700' }}>
              View all weak areas →
            </Link>
          </div>
        )}

        {/* ── RECOMMENDED COURSES ─────────────────────────────────────────────── */}
        {!loading && courses?.recommended?.length > 0 && (
          <div>
            <p style={s.sLabel}>Recommended for You</p>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: C.gray, marginTop: '0.25rem', marginBottom: '0.875rem' }}>
              Based on your profile — courses you haven't enrolled in yet
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: '1rem' }}>
              {courses.recommended.map(r => (
                <div key={r.exam_slug} style={{ background: C.white, border: '1px solid ' + C.border, borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ height: '3px', background: C.muted }} />
                  <div style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.625rem' }}>
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', fontWeight: '700', padding: '0.2rem 0.625rem', borderRadius: '100px', background: C.muted, color: C.black }}>{r.exam_name}</span>
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.62rem', color: C.gray, background: C.muted, padding: '0.15rem 0.375rem', borderRadius: '3px' }}>{COURSE_TYPE_LABEL[r.course_type] || r.course_type}</span>
                    </div>
                    <p style={{ fontFamily: 'Georgia,serif', fontSize: '0.95rem', fontWeight: '700', color: C.black, marginBottom: '0.25rem' }}>{r.course_title}</p>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.68rem', color: C.gray, marginBottom: '1rem', lineHeight: 1.5 }}>
                      Expand your preparation beyond {courses.enrolled?.[0]?.exam_name || 'your current exam'}
                    </p>
                    <Link href={'/courses/' + r.exam_slug}
                      style={{ display: 'block', padding: '0.625rem', background: C.muted, border: '1px solid ' + C.border, borderRadius: '6px', textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: '0.82rem', fontWeight: '700', color: C.black, textDecoration: 'none' }}>
                      View Course →
                    </Link>
                  </div>
                </div>
              ))}

              {/* Browse all */}
              <div style={{ background: C.black, borderRadius: '10px', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', gap: '0.75rem' }}>
                <p style={{ fontFamily: 'Georgia,serif', fontSize: '1rem', fontWeight: '700', color: '#fff' }}>All Courses</p>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>CAT · XAT · SNAP · NMAT · GMAT · GRE · CLAT and more</p>
                <Link href="/courses" style={{ padding: '0.5rem 1.25rem', background: C.red, color: '#fff', borderRadius: '4px', fontFamily: 'var(--font-sans)', fontSize: '0.82rem', fontWeight: '700', textDecoration: 'none' }}>
                  Browse All →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── MOCK CREDENTIALS CARD ──────────────────────────────── */}
        {mockCreds.length > 0 && (
          <div style={{ background: C.black, border: '1px solid #333', borderRadius: '8px', padding: '1.25rem', marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginBottom: '0.2rem' }}>Mock Test Access</p>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: '700', color: '#fff' }}>Your Testfunda credentials are ready</p>
              </div>
              <Link href="/dashboard/mocks"
                style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', fontWeight: '700', padding: '0.5rem 1rem', background: C.red, color: '#fff', borderRadius: '4px', textDecoration: 'none', flexShrink: 0 }}>
                View credentials →
              </Link>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {mockCreds.slice(0, 3).map(c => (
                <div key={c.id} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '0.625rem 0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', fontWeight: '700', padding: '0.1rem 0.375rem', borderRadius: '3px', background: 'rgba(255,94,95,0.2)', color: C.red }}>{(c.exam_name||primaryExam).toUpperCase()}</span>
                  <span style={{ fontFamily: "'SF Mono',monospace", fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>{c.username}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── BOTTOM QUICK LINKS ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2.5rem', flexWrap: 'wrap' }}>
          {[
            ['🗺 Mastery Map',   '/learn/' + primaryExam + '/mastery'],
            ['📚 Notes',         '/learn/' + primaryExam + '/notes'],
            ['🏅 Badges',        '/dashboard/badges'],
            ['📊 Progress',      '/dashboard/heatmap'],
            ['📅 Planner',       '/dashboard/planner'],
            ['🏆 Leaderboard',   '/dashboard/leaderboard'],
            ['📊 Mock Scores',    '/dashboard/mock-scores'],
            ['🧪 My Mocks',       '/dashboard/mocks'],
          ].map(([label, href]) => (
            <Link key={href} href={href}
              style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', padding: '0.5rem 0.875rem', background: C.white, border: '1px solid ' + C.border, borderRadius: '6px', textDecoration: 'none', color: C.black }}>
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

const s = {
  sLabel: { fontFamily: 'var(--font-sans)', fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#999' },
}

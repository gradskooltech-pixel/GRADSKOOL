/**
 * GRADSKOOL — Mock Test Hub
 * Route: /mocks/[examSlug]
 *
 * Three tabs: Topic-wise, Sectional, Full Mock. Free preview gets a
 * capped topic-wise set with a question-count/difficulty picker; paid
 * mocks access unlocks all three formats at once (no progression gate)
 * and topic-wise drops the picker entirely — one click starts the
 * topic's full question bank. Lock reasons come straight from the
 * backend (services.paper_unlock_status), not hardcoded here.
 *
 * PUBLIC PAGE — no login wall. The catalog itself (topics, sectionals,
 * full mocks, counts, the free-vs-paid framing) is real marketing
 * content and should be crawlable/shareable like any other course page;
 * only actually STARTING an attempt (startPaper/startTopic below)
 * requires a login, same as the backend's own MockAttemptStartView.
 * getServerSideProps seeds real content into the first response (for
 * crawlers and fast first paint) via an unauthenticated fetch — the
 * backend endpoint is public, so a logged-out request already gets the
 * correct free-preview shape; the client-side load() below re-fetches
 * with the visitor's own auth so a logged-in/paid user's real
 * has_paid_access state replaces it right after mount.
 */
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from '../../../hooks/useAuth'
import api from '../../../lib/api'
import PageSEO, { courseSchema } from '../../../components/seo/PageSEO'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

const C = {
  red: '#ff5e5f', black: '#0f0f0f', white: '#fff', bg: '#f7f6f3',
  border: '#e8e8e6', gray: '#999', green: '#22c55e', amber: '#f59e0b', muted: '#f4f3f0',
}

export async function getServerSideProps({ params }) {
  const examSlug = params.examSlug
  try {
    const res = await fetch(`${API_BASE}/mocks/${examSlug}/`)
    if (!res.ok) return { props: { initialData: null, examSlug } }
    const initialData = await res.json()
    return { props: { initialData, examSlug } }
  } catch {
    return { props: { initialData: null, examSlug } }
  }
}

export default function MockHubPage({ initialData, examSlug: examSlugProp }) {
  return <Inner initialData={initialData} examSlugProp={examSlugProp} />
}

function Inner({ initialData, examSlugProp }) {
  const router = useRouter()
  const { isLoggedIn } = useAuth()
  const examSlug = examSlugProp || router.query.examSlug
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(!initialData)
  const [tab, setTab] = useState('topic')
  const [starting, setStarting] = useState(false)
  const [err, setErr] = useState(null)

  const load = useCallback(() => {
    if (!examSlug) return
    api.get(`/mocks/${examSlug}/`).then(({ data }) => setData(data)).catch(() => {}).finally(() => setLoading(false))
  }, [examSlug])
  // Always refresh client-side after mount, even though initialData already
  // seeded the page — the SSR fetch above has no auth header, so a logged-in
  // visitor's real has_paid_access/unlock status only shows up after this.
  useEffect(() => { load() }, [load])

  const requireLogin = () => router.push(`/auth/login?redirect=${encodeURIComponent(router.asPath)}`)

  const startPaper = async (paper) => {
    if (!isLoggedIn) { requireLogin(); return }
    setErr(null); setStarting(true)
    try {
      const mode = paper.test_type === 'mock' ? 'full' : 'sectional'
      const { data: attempt } = await api.post('/mocks/attempts/start/', { mode, exam_slug: examSlug, paper_id: paper.id })
      router.push(`/mocks/attempt/${attempt.id}`)
    } catch (e) {
      setErr(e.response?.data?.error || 'Could not start this test.')
    } finally { setStarting(false) }
  }

  // count/difficulty are only meaningful for the free-preview picker — a paid
  // student calls this with count=null and the backend ignores both anyway,
  // always handing back the topic's full question bank.
  const startTopic = async (topic, count, difficulty) => {
    if (!isLoggedIn) { requireLogin(); return }
    setErr(null); setStarting(true)
    try {
      const body = { mode: 'topic', exam_slug: examSlug, topic_id: topic.id }
      if (count != null) body.question_count = count
      if (difficulty) body.difficulty = difficulty
      const { data: attempt } = await api.post('/mocks/attempts/start/', body)
      router.push(`/mocks/attempt/${attempt.id}`)
    } catch (e) {
      setErr(e.response?.data?.error || 'Could not start this practice set.')
    } finally { setStarting(false) }
  }

  if (loading) return <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ fontFamily: 'Georgia,serif', color: C.gray }}>Loading…</p></div>
  if (!data) return <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ fontFamily: 'Georgia,serif', color: C.gray }}>We couldn't find that exam's mock tests.</p></div>

  const seoTitle = `${data.exam_name} Mock Tests — Topic-wise, Sectional & Full Mocks | GRADSKOOL`
  const seoDescription = `Practice ${data.exam_name} on GRADSKOOL's own mock test platform — topic-wise drills, sectional tests, and full-length mocks with instant scoring and a full section-by-section breakdown after every attempt.`

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <PageSEO
        title={seoTitle}
        description={seoDescription}
        canonical={examSlug === 'snap' ? 'https://snap.gradskool.in/mocks' : `/mocks/${examSlug}`}
        breadcrumbs={[{ name: 'Home', url: '/' }, { name: `${data.exam_name} Mocks`, url: `/mocks/${examSlug}` }]}
        schema={[courseSchema({
          name: `${data.exam_name} Mock Tests`,
          description: seoDescription,
          url: `/mocks/${examSlug}`,
        })]}
      />

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.red, marginBottom: '0.3rem' }}>{data.exam_name} — Mock Tests</p>
        <h1 style={{ fontFamily: 'Georgia,serif', fontSize: '1.8rem', fontWeight: 700, color: C.black, marginBottom: '0.5rem' }}>
          {data.has_paid_access ? 'Topic-wise, sectionals, full mocks — all unlocked' : 'Practice topic-wise, sectional, and full mocks'}
        </h1>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.875rem', color: C.gray, lineHeight: 1.7, marginBottom: '1.5rem' }}>
          {data.has_paid_access
            ? "Every topic, every sectional, every full mock is open right now — jump into whichever you want, in any order."
            : 'Free preview gives you a taste of topic-wise practice. Unlock mocks access and every topic, sectional, and full mock opens at once — no waiting.'}
        </p>

        {!data.has_paid_access && <UpgradeBanner examSlug={examSlug} examName={data.exam_name} limit={data.topic_wise_question_limit} />}

        {err && <div style={{ background: '#fff5f5', border: '1px solid #fca5a5', borderRadius: '6px', padding: '0.875rem 1.25rem', marginBottom: '1.5rem', fontFamily: 'var(--font-sans)', fontSize: '0.82rem', color: '#991b1b' }}>{err}</div>}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: `1px solid ${C.border}` }}>
          {[['topic', 'Topic-wise'], ['sectional', 'Sectionals'], ['full', 'Full Mocks']].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              padding: '0.75rem 1rem', background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: 700,
              color: tab === k ? C.black : C.gray, borderBottom: tab === k ? `2px solid ${C.red}` : '2px solid transparent',
            }}>{label}</button>
          ))}
        </div>

        {tab === 'topic' && (
          <TopicTab topics={data.topics} limit={data.topic_wise_question_limit} hasPaidAccess={data.has_paid_access} busy={starting} onStart={startTopic} />
        )}
        {tab === 'sectional' && (
          <PaperList papers={data.sectionals} emptyText="No sectionals published yet." busy={starting} onStart={startPaper} />
        )}
        {tab === 'full' && (
          <PaperList papers={data.full_mocks} emptyText="No full mocks published yet." busy={starting} onStart={startPaper} />
        )}
      </div>
    </div>
  )
}

function PaperList({ papers, emptyText, busy, onStart }) {
  if (!papers.length) return <p style={{ fontFamily: 'Georgia,serif', color: C.gray, padding: '2rem 0', textAlign: 'center' }}>{emptyText}</p>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      {papers.map(p => (
        <div key={p.id} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.95rem', fontWeight: 700, color: C.black, marginBottom: '0.2rem' }}>{p.title}{p.is_free && <span style={{ marginLeft: '0.5rem', fontSize: '0.65rem', fontWeight: 700, color: '#166534', background: '#dcfce7', padding: '0.1rem 0.5rem', borderRadius: '100px' }}>FREE</span>}</p>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: C.gray }}>{p.total_questions} questions · {p.total_duration_mins} min · {p.sections.map(s => s.name).join(' · ')}</p>
            {!p.unlock.unlocked && <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: C.amber, marginTop: '0.4rem' }}>🔒 {p.unlock.reason}</p>}
          </div>
          <button disabled={!p.unlock.unlocked || busy} onClick={() => onStart(p)} style={{
            padding: '0.625rem 1.25rem', borderRadius: '4px', border: 'none', fontFamily: 'var(--font-sans)', fontSize: '0.82rem', fontWeight: 700, cursor: p.unlock.unlocked ? 'pointer' : 'not-allowed',
            background: p.unlock.unlocked ? C.red : C.muted, color: p.unlock.unlocked ? '#fff' : C.gray,
          }}>{p.unlock.unlocked ? 'Start →' : 'Locked'}</button>
        </div>
      ))}
    </div>
  )
}

function TopicTab({ topics, limit, hasPaidAccess, busy, onStart }) {
  const [open, setOpen] = useState(null)
  const [count, setCount] = useState(limit)
  const [difficulty, setDifficulty] = useState('')

  if (!topics.length) return <p style={{ fontFamily: 'Georgia,serif', color: C.gray, padding: '2rem 0', textAlign: 'center' }}>No topics published yet.</p>

  // Paid access: one click, no picker — the whole topic's question bank, mixed difficulty.
  // Free preview: click opens a small popover to pick how many (capped) and difficulty.
  const handleClick = (t) => {
    if (hasPaidAccess) { onStart(t, null, ''); return }
    setOpen(open === t.id ? null : t.id)
    setCount(Math.min(limit, 20))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {Object.entries(groupBySection(topics)).map(([section, ts]) => (
        <div key={section}>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.gray, marginBottom: '0.5rem' }}>{section}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {ts.map(t => (
              <div key={t.id} style={{ position: 'relative' }}>
                <button disabled={busy} onClick={() => handleClick(t)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '100px', border: `1px solid ${C.border}`, background: open === t.id ? C.black : C.white, color: open === t.id ? '#fff' : C.black, fontFamily: 'var(--font-sans)', fontSize: '0.8rem', fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer' }}>
                  {t.name} <span style={{ opacity: 0.6 }}>({t.question_count})</span>
                </button>
                {!hasPaidAccess && open === t.id && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 0.5rem)', left: 0, zIndex: 10, background: C.white, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '1rem', width: 'min(260px, calc(100vw - 2rem))', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                    <label style={{ fontFamily: 'var(--font-sans)', fontSize: '0.7rem', fontWeight: 700, color: C.gray, display: 'block', marginBottom: '0.25rem' }}>How many questions? (max {limit})</label>
                    <input type="number" min={1} max={limit} value={count} onChange={e => setCount(Math.max(1, Math.min(limit, parseInt(e.target.value) || 1)))}
                      style={{ width: '100%', padding: '0.5rem', border: `1px solid ${C.border}`, borderRadius: '4px', marginBottom: '0.75rem', boxSizing: 'border-box' }} />
                    <label style={{ fontFamily: 'var(--font-sans)', fontSize: '0.7rem', fontWeight: 700, color: C.gray, display: 'block', marginBottom: '0.25rem' }}>Difficulty</label>
                    <select value={difficulty} onChange={e => setDifficulty(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: `1px solid ${C.border}`, borderRadius: '4px', marginBottom: '0.875rem', boxSizing: 'border-box' }}>
                      <option value="">Mixed</option><option value="easy">Easy</option><option value="moderate">Moderate</option><option value="hard">Hard</option>
                    </select>
                    <button disabled={busy} onClick={() => onStart(t, count, difficulty)} style={{ width: '100%', padding: '0.625rem', background: C.red, color: '#fff', border: 'none', borderRadius: '4px', fontFamily: 'var(--font-sans)', fontWeight: 700, cursor: 'pointer' }}>Start →</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function groupBySection(topics) {
  return topics.reduce((acc, t) => { (acc[t.section_name] ||= []).push(t); return acc }, {})
}

function UpgradeBanner({ examSlug, examName, limit }) {
  return (
    <div style={{
      background: C.black, borderRadius: '10px', padding: '1.75rem 2rem', marginBottom: '1.5rem',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap',
    }}>
      <div style={{ maxWidth: '560px' }}>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.red, marginBottom: '0.5rem' }}>
          You're on the free preview
        </p>
        <p style={{ fontFamily: 'Georgia,serif', fontSize: '1.15rem', fontWeight: 700, color: '#fff', lineHeight: 1.4, marginBottom: '0.6rem' }}>
          Topic-wise drills only get you so far — real {examName} scores come from full-length practice under real time pressure.
        </p>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.82rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7 }}>
          Right now you're capped at {limit} questions per topic set, and Sectionals + Full Mocks stay locked. Unlock mocks access for the complete {examName} sectional and full-mock library — same paper structure and timing as the real exam, plus a full score breakdown and answer review after every attempt.
        </p>
      </div>
      <Link href={`/checkout/${examSlug}`} style={{
        flexShrink: 0, background: C.red, color: '#fff', padding: '0.85rem 1.5rem', borderRadius: '6px',
        fontFamily: 'var(--font-sans)', fontSize: '0.88rem', fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap',
      }}>
        Unlock Mocks Access →
      </Link>
    </div>
  )
}
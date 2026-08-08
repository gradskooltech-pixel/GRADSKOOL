import React from 'react'
/**
 * GRADSKOOL — Gamified Topic Page (Redesigned)
 * Route: /learn/[examSlug]/[sectionSlug]/[topicSlug]
 *
 * Clean, organized flow:
 *   Each video = one "step card" with clear progress
 *   Watch → Quiz → Cheat Sheet → ✓ Done → next unlocks
 */
import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ProtectedRoute } from '../../../../components/auth/ProtectedRoute'
import { useAuth } from '../../../../hooks/useAuth'
import { CATQuiz } from '../../../../components/learn/CATQuiz'
import api from '../../../../lib/api'

const C = {
  red:     '#e63946',
  redDark: '#c1121f',
  black:   '#1a1a2e',
  white:   '#ffffff',
  bg:      '#f8f7f4',
  card:    '#ffffff',
  border:  '#ebebeb',
  muted:   '#f4f3f0',
  gray3:   '#999',
  gray5:   '#555',
  green:   '#2d6a4f',
  greenBg: '#d8f3dc',
  amber:   '#e76f51',
  amberBg: '#fde8df',
  blue:    '#023e8a',
  blueBg:  '#caf0f8',
  locked:  '#d0d0d0',
}

const STEP_CONFIG = {
  watch:      { label:'Watch',       icon:'▶',  color:C.blue,  bg:C.blueBg,  next:'Cheat sheet unlocks after watching' },
  cheatsheet: { label:'Cheat Sheet', icon:'📄', color:C.red,   bg:'#fce4e6', next:'Quiz unlocks after reading' },
  quiz:       { label:'Quiz',        icon:'📝', color:C.amber, bg:C.amberBg, next:'Complete after quiz' },
  live:       { label:'Live Class',  icon:'📡', color:'#7b2d8b', bg:'#f3e8ff', next:'Video complete after live class' },
  done:       { label:'Done',        icon:'✓',  color:C.green, bg:C.greenBg, next:'' },
}

export default function TopicPage() {
  return <ProtectedRoute><Inner /></ProtectedRoute>
}

function Inner() {
  const router = useRouter()
  const { examSlug, sectionSlug, topicSlug } = router.query
  const { user } = useAuth()

  // ── CONTENT PROTECTION ───────────────────────────────────────────────────
  useEffect(() => {
    // 1. Disable right-click context menu
    const noContext = (e) => e.preventDefault()
    document.addEventListener('contextmenu', noContext)

    // 2. Disable text selection via keyboard (Ctrl+A)
    const noSelect = (e) => {
      if ((e.ctrlKey || e.metaKey) && ['a','c','u','s','p'].includes(e.key.toLowerCase())) {
        e.preventDefault()
      }
      // Block PrintScreen key
      if (e.key === 'PrintScreen') {
        e.preventDefault()
        // Briefly flash black overlay to disrupt screenshot
        const overlay = document.getElementById('gs-ss-block')
        if (overlay) { overlay.style.opacity = '1'; setTimeout(() => { overlay.style.opacity = '0' }, 300) }
      }
      // Block F12 / DevTools shortcuts
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && ['i','j','c'].includes(e.key.toLowerCase()))) {
        e.preventDefault()
      }
    }
    document.addEventListener('keydown', noSelect)

    // 3. Detect visibility change (alt-tab to screenshot tools)
    const onVisChange = () => {
      if (document.hidden) {
        const overlay = document.getElementById('gs-ss-block')
        if (overlay) { overlay.style.opacity = '1'; setTimeout(() => { overlay.style.opacity = '0' }, 500) }
      }
    }
    document.addEventListener('visibilitychange', onVisChange)

    // 4. Disable drag on images
    const noDrag = (e) => { if (e.target.tagName === 'IMG') e.preventDefault() }
    document.addEventListener('dragstart', noDrag)

    return () => {
      document.removeEventListener('contextmenu', noContext)
      document.removeEventListener('keydown', noSelect)
      document.removeEventListener('visibilitychange', onVisChange)
      document.removeEventListener('dragstart', noDrag)
    }
  }, [])
  // ── END CONTENT PROTECTION ───────────────────────────────────────────────

  const [data,       setData]      = useState(null)
  const [loading,    setLoad]      = useState(true)
  const [activeIdx,  setActiveIdx] = useState(0)
  const [stepState,  setStepState] = useState({})
  const [overlay,    setOverlay]   = useState(null) // null | 'quiz' | 'sheet'
  const [xp,         setXp]        = useState(0)
  const [streak,     setStreak]    = useState(0)
  const [quizResult, setQuizResult]= useState(null)
  const [justDone,   setJustDone]  = useState(null) // video id just completed

  const load = useCallback(() => {
    if (!examSlug || !sectionSlug || !topicSlug) return
    setLoad(true)
    api.get(`/learn/${examSlug}/sections/${sectionSlug}/${topicSlug}/`)
      .then(({ data: d }) => {
        setData(d)
        const states = {}
        ;(d?.sequence || []).forEach(v => {
          states[v.id] = v.state === 'completed' ? 'done'
            : v.state === 'cheatsheet_required' ? 'cheatsheet'
            : v.state === 'quiz_ready' ? 'quiz' : 'watch'
        })
        setStepState(states)
        const seq = d?.sequence || []
        const first = seq.findIndex(v => states[v.id] !== 'done')
        setActiveIdx(first >= 0 ? first : seq.length - 1)
      })
      .catch(() => {
        const demo = makeDemoData(topicSlug, sectionSlug)
        setData(demo)
        const states = {}
        demo.sequence.forEach(v => { states[v.id] = 'watch' })
        setStepState(states)
        setActiveIdx(0)
      })
      .finally(() => setLoad(false))
  }, [examSlug, sectionSlug, topicSlug])

  useEffect(() => { load() }, [load])

  const sequence  = data?.sequence || []
  const topic     = data?.topic
  const liveData  = data?.live_session
  const active    = sequence[activeIdx]

  // Recompute XP
  useEffect(() => {
    let total = 0
    sequence.forEach(v => {
      if (stepState[v.id] === 'done') total += 100
      else if (stepState[v.id] === 'cheatsheet') total += 50
      else if (stepState[v.id] === 'quiz') total += 20
    })
    setXp(total)
  }, [stepState, sequence])

  const markWatched = async (videoId) => {
    try { await api.post(`/learn/${examSlug}/${topicSlug}/videos/${videoId}/progress/`, { watch_pct:100 }) } catch {}
    const v = sequence.find(v => v.id === videoId)
    // Flow: watch → cheatsheet → quiz → live (if enabled) → done
    const next = v?.has_cheatsheet ? 'cheatsheet' : v?.has_quiz ? 'quiz' : v?.has_live ? 'live' : 'done'
    setStepState(p => ({ ...p, [videoId]: next }))
    setStreak(s => s + 1)
    if (next === 'cheatsheet') { setTimeout(() => setOverlay('sheet'), 300) }
    if (next === 'quiz')       { setTimeout(() => setOverlay('quiz'), 300) }
    if (next === 'done')       { setJustDone(videoId); setTimeout(() => advanceNext(), 800) }
  }

  const onQuizDone = (score) => {
    setQuizResult(score)
    setOverlay(null)
    const v = sequence.find(v => v.id === active?.id)
    // After quiz: go to live if enabled, else done
    const next = v?.has_live ? 'live' : 'done'
    setStepState(p => ({ ...p, [active?.id]: next }))
    setXp(x => x + 50)
    if (next === 'done') { setJustDone(active?.id); setTimeout(() => advanceNext(), 800) }
  }

  const onSheetDone = async () => {
    try { await api.post(`/learn/${examSlug}/${topicSlug}/videos/${active?.id}/cheatsheet/open/`, {}) } catch {}
    setOverlay(null)
    const v = sequence.find(v => v.id === active?.id)
    // After cheat sheet: go to quiz if enabled, else live, else done
    const next = v?.has_quiz ? 'quiz' : v?.has_live ? 'live' : 'done'
    setStepState(p => ({ ...p, [active?.id]: next }))
    setXp(x => x + 30)
        // Check milestones
        api.post('/learn/milestones/', { exam_slug: examSlug }).then(({ data }) => {
          if (data.newly_earned?.length > 0) {
            setMilestone(data.newly_earned[0])
            setTimeout(() => setMilestone(null), 4000)
          }
        }).catch(() => {})
    if (next === 'quiz') setTimeout(() => setOverlay('quiz'), 400)
    if (next === 'done') { setJustDone(active?.id); setTimeout(() => advanceNext(), 800) }
  }

  const advanceNext = () => {
    setJustDone(null)
    setQuizResult(null)
    if (activeIdx < sequence.length - 1) setActiveIdx(i => i + 1)
  }

  const isLocked = (idx) => idx > 0 && stepState[sequence[idx-1]?.id] !== 'done'
  const doneCount = sequence.filter(v => stepState[v.id] === 'done').length
  const totalPct  = sequence.length > 0 ? Math.round((doneCount / sequence.length) * 100) : 0

  if (loading) return (
    <Shell examSlug={examSlug} sectionSlug={sectionSlug} topic={null}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ width:'40px', height:'40px', border:'3px solid ' + C.border, borderTopColor:C.red, borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 1rem' }} />
          <p style={{ fontFamily:'Georgia, serif', color:C.gray3 }}>Loading topic…</p>
        </div>
      </div>
      {/* Milestone celebration popup */}
      {milestone && (
        <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', zIndex:999, background:'#0f0f0f', border:'2px solid #f59e0b', borderRadius:'12px', padding:'2.5rem 3rem', textAlign:'center', boxShadow:'0 24px 64px rgba(0,0,0,0.5)' }}>
          <p style={{ fontSize:'3.5rem', marginBottom:'0.75rem' }}>🎉</p>
          <p style={{ fontFamily:'Georgia,serif', fontSize:'1.5rem', fontWeight:'700', color:'#fff', marginBottom:'0.375rem' }}>{milestone.label}</p>
          <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:'rgba(255,255,255,0.5)' }}>Milestone unlocked!</p>
        </div>
      )}
    </Shell>
  )

  return (
    <Shell examSlug={examSlug} sectionSlug={sectionSlug} topic={topic} user={user}>
      <Head><title>{topic?.title || topicSlug} — {examSlug?.toUpperCase()} — GRADSKOOL</title></Head>


      {/* ── XP STRIP ─────────────────────────────────────────────── */}
      <div style={{ background:C.black, padding:'0 2rem', height:'44px', display:'flex', alignItems:'center', gap:'1.5rem', borderBottom:'2px solid ' + C.red }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.625rem' }}>
          <span style={{ fontSize:'0.9rem' }}>⚡</span>
          <span style={{ fontFamily:"'SF Mono', 'Fira Code', monospace", fontSize:'0.78rem', fontWeight:'700', color:'#fff' }}>{xp} XP</span>
        </div>
        {streak > 0 && (
          <div style={{ display:'flex', alignItems:'center', gap:'0.375rem' }}>
            <span style={{ fontSize:'0.85rem' }}>🔥</span>
            <span style={{ fontFamily:"'SF Mono', 'Fira Code', monospace", fontSize:'0.72rem', color:'#f59e0b', fontWeight:'700' }}>{streak} streak</span>
          </div>
        )}
        <div style={{ flex:1, height:'5px', background:'rgba(255,255,255,0.1)', borderRadius:'100px', overflow:'hidden' }}>
          <div style={{ height:'100%', background:'linear-gradient(90deg, ' + C.red + ', #ff6b6b)', borderRadius:'100px', width:totalPct+'%', transition:'width 0.5s ease' }} />
        </div>
        <span style={{ fontFamily:"'SF Mono', 'Fira Code', monospace", fontSize:'0.68rem', color:'rgba(255,255,255,0.35)', whiteSpace:'nowrap' }}>
          {doneCount}/{sequence.length} videos
        </span>
      </div>



      {/* ── MAIN CONTENT ──────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', minHeight:'calc(100vh - 148px)', gap:0 }}>

          {/* LEFT: Video list */}
          <div style={{ background:C.white, borderRight:'1px solid ' + C.border, overflowY:'auto' }}>
            <div style={{ padding:'1rem 1.25rem 0.5rem', borderBottom:'1px solid ' + C.border }}>
              <p style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'0.62rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:C.gray3, marginBottom:'0.625rem' }}>Video Sequence</p>
              <div style={{ display:'flex', gap:'0.375rem', flexWrap:'wrap' }}>
                <a href={'/learn/' + examSlug + '/' + sectionSlug + '/quiz?topic=' + topicSlug}
                  style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'0.62rem', fontWeight:'700', padding:'0.2rem 0.5rem', borderRadius:'3px', background:'#fff8f0', border:'1px solid #fcd9c0', color:C.amber, textDecoration:'none' }}>
                  🎯 Practice Quiz
                </a>
                <a href={'/learn/' + examSlug + '/' + sectionSlug + '/adaptive-quiz?topic=' + topicSlug}
                  style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'0.62rem', fontWeight:'700', padding:'0.25rem 0.625rem', borderRadius:'3px', background:'#f3e8ff', color:'#7b2d8b', textDecoration:'none', whiteSpace:'nowrap' }}>
                  🧠 Adaptive Quiz
                </a>
                <Link href={'/learn/' + examSlug + '/recordings'}
                  style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'0.62rem', fontWeight:'700', padding:'0.2rem 0.5rem', borderRadius:'3px', background:C.muted, border:'1px solid ' + C.border, color:C.gray5, textDecoration:'none' }}>
                  🎬 Recordings
                </Link>
              </div>
            </div>
            {sequence.map((video, idx) => {
              const state  = stepState[video.id] || 'watch'
              const locked = isLocked(idx)
              const isAct  = idx === activeIdx
              const cfg    = STEP_CONFIG[state]
              return (
                <div key={video.id}
                  onClick={() => !locked && setActiveIdx(idx)}
                  style={{ padding:'0.875rem 1.25rem', borderBottom:'1px solid ' + C.border, cursor:locked ? 'not-allowed' : 'pointer', opacity:locked ? 0.5 : 1,
                    background:isAct ? '#fdf5f5' : C.white,
                    borderLeft:'3px solid ' + (isAct ? C.red : 'transparent'),
                    transition:'all 0.15s' }}>

                  <div style={{ display:'flex', alignItems:'flex-start', gap:'0.75rem' }}>
                    {/* Step indicator */}
                    <div style={{ width:'32px', height:'32px', borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem', fontWeight:'700',
                      background: locked ? C.muted : state === 'done' ? C.green : isAct ? cfg.color : C.muted,
                      color: locked ? C.gray3 : (state === 'done' || isAct) ? '#fff' : C.gray3,
                      border:'none' }}>
                      {locked ? '🔒' : state === 'done' ? '✓' : idx+1}
                    </div>

                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontFamily:'Georgia, serif', fontSize:'0.82rem', fontWeight: isAct ? '700' : '400', color:locked ? C.gray3 : C.black, marginBottom:'0.2rem',
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {video.title}
                      </p>
                      <p style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'0.62rem', color:C.gray3, marginBottom:'0.375rem' }}>
                        {video.duration_mins} min
                        {locked ? ' · Complete previous video first' : ''}
                      </p>
                      {/* Mini step pills */}
                      {!locked && (
                        <div style={{ display:'flex', gap:'3px' }}>
                          <StepPill label="Watch" done={['cheatsheet','quiz','live','done'].includes(state)} active={state==='watch'&&isAct} color={C.blue} />
                          {video.has_cheatsheet && <StepPill label="Sheet" done={['quiz','live','done'].includes(state)} active={state==='cheatsheet'&&isAct} color={C.red} />}
                          {video.has_quiz && <StepPill label="Quiz"  done={['live','done'].includes(state)} active={state==='quiz'&&isAct} color={C.amber} />}
                          {video.has_live && <StepPill label="Live"  done={state==='done'} active={state==='live'&&isAct} color={'#7b2d8b'} />}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Completion burst */}
                  {justDone === video.id && (
                    <div style={{ marginTop:'0.5rem', marginLeft:'2.75rem', animation:'popIn 0.3s ease' }}>
                      <p style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'0.72rem', fontWeight:'700', color:C.green }}>
                        ✓ +100 XP earned!
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* RIGHT: Active video area */}
          <div style={{ overflowY:'auto', background:C.bg }}>
            {!active ? (
              <AllDoneView topicTitle={topic?.title} onBack={() => router.push(`/learn/${examSlug}/${sectionSlug}`)} />
            ) : (
              <div style={{ padding:'1.5rem', display:'flex', flexDirection:'column', gap:'1.25rem', maxWidth:'860px' }}>

                {/* Video title + progress */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem', flexWrap:'wrap' }}>
                  <div>
                    <p style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'0.65rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:C.gray3, marginBottom:'0.25rem' }}>
                      Video {activeIdx+1} of {sequence.length}
                    </p>
                    <h2 style={{ fontFamily:'Georgia, serif', fontSize:'1.15rem', fontWeight:'700', color:C.black, margin:0 }}>
                      {active.title}
                    </h2>
                  </div>
                  <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
                    <span style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'0.72rem', color:C.gray3 }}>
                      {active.duration_mins} min
                    </span>
                    {active.difficulty && (
                      <span style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'0.65rem', fontWeight:'700', padding:'0.15rem 0.5rem', borderRadius:'100px',
                        background:active.difficulty==='beginner' ? C.greenBg : active.difficulty==='advanced' ? C.amberBg : C.blueBg,
                        color:active.difficulty==='beginner' ? C.green : active.difficulty==='advanced' ? C.amber : C.blue }}>
                        {active.difficulty}
                      </span>
                    )}
                  </div>
                </div>

                {/* Step progress bar - cleaner */}
                <StepProgressBar video={active} state={stepState[active.id] || 'watch'} />

                {/* Video player — watermarked */}
                <div className="gs-video-protected"
                  data-watermark={'GRADSKOOL · ' + (user?.email || 'Protected Content')}
                  style={{ borderRadius:'10px', overflow:'hidden', boxShadow:'0 4px 24px rgba(0,0,0,0.12)', background:'#0d0d0d', position:'relative', paddingTop:'56.25%' }}>
                  {!active.bunny_video_id && !active.youtube_video_id ? (
                    <div style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'1rem' }}>
                      <div style={{ width:'60px', height:'60px', borderRadius:'50%', background:'rgba(230,57,70,0.15)', border:'2px solid rgba(230,57,70,0.4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <span style={{ color:C.red, fontSize:'1.25rem' }}>▶</span>
                      </div>
                      <p style={{ fontFamily:'Georgia, serif', color:'rgba(255,255,255,0.4)', fontSize:'0.9rem' }}>{active.title}</p>
                      <p style={{ fontFamily:"'DM Sans', sans-serif", color:'rgba(255,255,255,0.2)', fontSize:'0.72rem' }}>
                        Video will appear here once uploaded to Bunny Stream
                      </p>
                    </div>
                  ) : active.youtube_video_id ? (
                    <iframe src={`https://www.youtube.com/embed/${active.youtube_video_id}?rel=0&modestbranding=1`}
                      style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', border:'none' }}
                      allowFullScreen allow="autoplay; fullscreen" title={active.title} />
                  ) : (
                    <iframe src={`https://iframe.mediadelivery.net/embed/${process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID}/${active.bunny_video_id}?autoplay=false&responsive=true`}
                      style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', border:'none' }}
                      allowFullScreen allow="autoplay; fullscreen" title={active.title} />
                  )}
                </div>

                {/* Action card - the key interaction */}
                <ActionCard
                  video={active}
                  state={stepState[active.id] || 'watch'}
                  quizResult={quizResult}
                  hasNext={activeIdx < sequence.length - 1}
                  onMarkWatched={() => markWatched(active.id)}
                  onOpenQuiz={() => setOverlay('quiz')}
                  onOpenSheet={() => setOverlay('sheet')}
                  onLiveDone={() => {
                    setStepState(p => ({ ...p, [active.id]: 'done' }))
                    setJustDone(active.id)
                    setTimeout(() => advanceNext(), 800)
                  }}
                  onNext={advanceNext}
                />

              </div>
            )}
          </div>
        </div>


      

      {/* ── QUIZ OVERLAY ─────────────────────────────────────────── */}
      {overlay === 'quiz' && active && (
        <QuizOverlay
          examSlug={examSlug} topicSlug={topicSlug} video={active}
          onDone={onQuizDone}
          onSkip={() => {
            setOverlay(null)
            const v = sequence.find(v => v.id === active.id)
            const next = v?.has_cheatsheet ? 'cheatsheet' : 'done'
            setStepState(p => ({ ...p, [active.id]: next }))
            if (next === 'cheatsheet') setTimeout(() => setOverlay('sheet'), 300)
          }}
        />
      )}

      {/* ── CHEAT SHEET OVERLAY ──────────────────────────────────── */}
      {overlay === 'sheet' && active && (
        <SheetOverlay examSlug={examSlug} topicSlug={topicSlug} video={active} onDone={onSheetDone} />
      )}
    </Shell>
  )
}

// ── STEP PROGRESS BAR ─────────────────────────────────────────────────────────
function StepProgressBar({ video, state }) {
  const steps = [
    { id:'watch',      label:'Watch',        icon:'▶',  color:C.blue },
    ...(video.has_cheatsheet ? [{ id:'cheatsheet',label:'Cheat Sheet',icon:'📄', color:C.red }]       : []),
    ...(video.has_quiz       ? [{ id:'quiz',      label:'Quiz',       icon:'📝', color:C.amber }]     : []),
    ...(video.has_live       ? [{ id:'live',      label:'Live Class', icon:'📡', color:'#7b2d8b' }]   : []),
    { id:'done',       label:'Complete',    icon:'✓',  color:C.green },
  ]
  const order = ['watch','cheatsheet','quiz','live','done']
  const cur   = order.indexOf(state)

  return (
    <div style={{ background:C.white, borderRadius:'10px', border:'1px solid ' + C.border, padding:'1.25rem 1.5rem' }}>
      <p style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'0.65rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:C.gray3, marginBottom:'1rem' }}>
        Your Progress
      </p>
      <div style={{ display:'flex', alignItems:'center' }}>
        {steps.map((step, i) => {
          const si   = order.indexOf(step.id)
          const done = si < cur
          const act  = si === cur
          return (
            <div key={step.id} style={{ display:'flex', alignItems:'center', flex: i < steps.length-1 ? 1 : 'none' }}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.375rem' }}>
                <div style={{ width:'42px', height:'42px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.9rem', fontWeight:'700',
                  background: done ? step.color : act ? step.color : C.muted,
                  color: (done || act) ? '#fff' : C.gray3,
                  boxShadow: act ? '0 0 0 5px ' + step.color + '22' : 'none',
                  transition:'all 0.35s ease' }}>
                  {done ? '✓' : step.icon}
                </div>
                <span style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'0.62rem', fontWeight: act ? '700' : '400',
                  color: act ? step.color : done ? step.color : C.gray3, whiteSpace:'nowrap' }}>
                  {step.label}
                </span>
              </div>
              {i < steps.length-1 && (
                <div style={{ flex:1, height:'3px', margin:'0 0.5rem 1.3rem',
                  background: done ? step.color : C.muted, borderRadius:'2px', transition:'background 0.35s' }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── ACTION CARD ───────────────────────────────────────────────────────────────
// ── VIDEO WATCH CARD (70% threshold) ─────────────────────────────────────────
function VideoWatchCard({ video, onMarkWatched }) {
  const [watchPct, setWatchPct] = useState(0)
  const [dragging, setDragging] = useState(false)
  const threshold = 70
  const canMark   = watchPct >= threshold

  // Simulate progress — in real use, Bunny player fires events
  // Student manually drags to indicate how much they've watched
  const handleSlider = (e) => {
    setWatchPct(parseInt(e.target.value))
  }

  const minsWatched = Math.round((watchPct / 100) * video.duration_mins)
  const minsLeft    = video.duration_mins - minsWatched

  return (
    <div style={{ background:C.white, border:'1px solid ' + C.border, borderRadius:'10px', overflow:'hidden', animation:'slideUp 0.3s ease' }}>
      {/* Header */}
      <div style={{ padding:'1.125rem 1.5rem', borderBottom:'1px solid ' + C.border, display:'flex', alignItems:'center', gap:'1rem' }}>
        <div style={{ width:'44px', height:'44px', borderRadius:'50%', background:C.blueBg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', flexShrink:0 }}>
          ▶
        </div>
        <div style={{ flex:1 }}>
          <p style={{ fontFamily:'Georgia, serif', fontSize:'0.95rem', fontWeight:'700', color:C.black, marginBottom:'0.15rem' }}>
            Step 1 — Watch the video
          </p>
          <p style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'0.72rem', color:C.gray3 }}>
            {video.duration_mins} min total
            {video.has_cheatsheet ? ' · Cheat sheet unlocks after' : video.has_quiz ? ' · Quiz unlocks after' : ''}
          </p>
        </div>
        {/* Watch percentage badge */}
        <div style={{ textAlign:'right', flexShrink:0 }}>
          <p style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'1rem', fontWeight:'700', color: canMark ? C.green : C.blue, lineHeight:1 }}>
            {watchPct}%
          </p>
          <p style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'0.6rem', color:C.gray3, marginTop:'0.1rem' }}>
            watched
          </p>
        </div>
      </div>

      {/* Progress bar + slider */}
      <div style={{ padding:'1.25rem 1.5rem', borderBottom:'1px solid ' + C.border }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.625rem' }}>
          <p style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'0.7rem', fontWeight:'600', color:C.gray5 }}>
            Watch progress
          </p>
          <p style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'0.7rem', color:C.gray3 }}>
            {canMark ? '✓ Enough watched to continue' : `Watch ${threshold - watchPct}% more to unlock next step`}
          </p>
        </div>

        {/* Visual progress bar */}
        <div style={{ position:'relative', height:'10px', background:C.muted, borderRadius:'100px', overflow:'visible', marginBottom:'0.875rem' }}>
          {/* Threshold marker at 70% */}
          <div style={{ position:'absolute', left:threshold+'%', top:'-4px', width:'2px', height:'18px', background:'#f59e0b', zIndex:2 }} />
          <div title="70% required" style={{ position:'absolute', left:threshold+'%', top:'-20px', transform:'translateX(-50%)', fontFamily:"'DM Sans', sans-serif", fontSize:'0.58rem', color:'#f59e0b', fontWeight:'700', whiteSpace:'nowrap' }}>
            70% min
          </div>
          {/* Fill */}
          <div style={{ height:'100%', borderRadius:'100px', width:watchPct+'%', transition:'width 0.2s',
            background: canMark
              ? 'linear-gradient(90deg, ' + C.green + ', #4ade80)'
              : 'linear-gradient(90deg, ' + C.blue + ', #60a5fa)' }} />
        </div>

        {/* Slider — student drags to indicate progress */}
        <input type="range" min="0" max="100" value={watchPct} onChange={handleSlider}
          style={{ width:'100%', cursor:'pointer', accentColor: canMark ? C.green : C.blue }} />

        <div style={{ display:'flex', justifyContent:'space-between', marginTop:'0.25rem' }}>
          <span style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'0.62rem', color:C.gray3 }}>0 min</span>
          <span style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'0.62rem', color:'#f59e0b', fontWeight:'700' }}>
            {Math.round(video.duration_mins * 0.7)} min (70%)
          </span>
          <span style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'0.62rem', color:C.gray3 }}>{video.duration_mins} min</span>
        </div>
      </div>

      {/* Action row */}
      <div style={{ padding:'1rem 1.5rem', background:canMark ? C.greenBg : C.muted, display:'flex', alignItems:'center', justifyContent:'space-between', gap:'0.75rem', flexWrap:'wrap', transition:'background 0.3s' }}>
        <p style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'0.72rem', color:canMark ? C.green : C.gray3, fontWeight: canMark ? '600' : '400' }}>
          {canMark
            ? '✓ Great! You\'ve watched enough to continue.'
            : 'Drag the slider to your current position in the video.'}
        </p>
        <button onClick={onMarkWatched} disabled={!canMark}
          style={{ padding:'0.625rem 1.375rem', background:canMark ? C.green : C.gray3, color:'#fff', border:'none', borderRadius:'6px', fontFamily:"'DM Sans', sans-serif", fontSize:'0.82rem', fontWeight:'700', cursor:canMark ? 'pointer' : 'not-allowed', whiteSpace:'nowrap', transition:'background 0.3s' }}>
          {canMark ? '✓ Mark Complete → +' + (video.has_cheatsheet || video.has_quiz ? '20' : '100') + ' XP' : 'Watch 70% to unlock'}
        </button>
      </div>
    </div>
  )
}

function ActionCard({ video, state, quizResult, hasNext, onMarkWatched, onOpenQuiz, onOpenSheet, onLiveDone, onNext }) {
  if (state === 'done') return (
    <div style={{ background:C.greenBg, border:'1px solid #95d5b2', borderRadius:'10px', padding:'1.25rem 1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem', flexWrap:'wrap', animation:'slideUp 0.3s ease' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'0.875rem' }}>
        <div style={{ width:'44px', height:'44px', borderRadius:'50%', background:C.green, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:'1.25rem', flexShrink:0 }}>
          ✓
        </div>
        <div>
          <p style={{ fontFamily:'Georgia, serif', fontSize:'0.95rem', fontWeight:'700', color:C.green, marginBottom:'0.15rem' }}>
            Video Complete! +100 XP
          </p>
          <p style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'0.75rem', color:C.green + 'cc' }}>
            All steps done. {hasNext ? 'Next video is unlocked.' : 'You\'ve finished all videos in this topic!'}
          </p>
        </div>
      </div>
      {hasNext && (
        <button onClick={onNext}
          style={{ padding:'0.625rem 1.25rem', background:C.green, color:'#fff', border:'none', borderRadius:'6px', fontFamily:"'DM Sans', sans-serif", fontSize:'0.82rem', fontWeight:'700', cursor:'pointer', whiteSpace:'nowrap' }}>
          Next Video →
        </button>
      )}
    </div>
  )

  if (state === 'watch') return (
    <div style={{ background:C.white, border:'1px solid ' + C.border, borderRadius:'10px', overflow:'hidden', animation:'slideUp 0.3s ease' }}>
      <div style={{ padding:'1.25rem 1.5rem', borderBottom:'1px solid ' + C.border, display:'flex', alignItems:'center', gap:'1rem' }}>
        <div style={{ width:'44px', height:'44px', borderRadius:'50%', background:C.blueBg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', flexShrink:0, color:C.blue }}>
          ▶
        </div>
        <div>
          <p style={{ fontFamily:'Georgia, serif', fontSize:'0.95rem', fontWeight:'700', color:C.black, marginBottom:'0.15rem' }}>
            Step 1 — Watch the video
          </p>
          <p style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'0.75rem', color:C.gray3 }}>
            {video.duration_mins} min
            {video.has_quiz ? ' · Quiz unlocks after watching' : video.has_cheatsheet ? ' · Cheat sheet unlocks after watching' : ''}
          </p>
        </div>
      </div>
      <div style={{ padding:'1rem 1.5rem', background:C.muted, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'0.75rem' }}>
        <p style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'0.72rem', color:C.gray3 }}>
          Finished watching? Click to mark complete and unlock next steps.
        </p>
        <button onClick={onMarkWatched}
          style={{ padding:'0.625rem 1.375rem', background:C.blue, color:'#fff', border:'none', borderRadius:'6px', fontFamily:"'DM Sans', sans-serif", fontSize:'0.82rem', fontWeight:'700', cursor:'pointer', whiteSpace:'nowrap' }}>
          ✓ Mark as Watched {video.has_quiz ? '→ +20 XP' : '→ +100 XP'}
        </button>
      </div>
    </div>
  )

  if (state === 'quiz') return (
    <div style={{ background:C.white, border:'2px solid ' + C.amber, borderRadius:'10px', overflow:'hidden', animation:'slideUp 0.3s ease' }}>
      <div style={{ background:C.amberBg, padding:'0.625rem 1.5rem', borderBottom:'1px solid #fcd9c0', display:'flex', alignItems:'center', gap:'0.5rem' }}>
        <span style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'0.65rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:C.amber }}>
          🎉 Quiz Unlocked!
        </span>
      </div>
      <div style={{ padding:'1.25rem 1.5rem', display:'flex', alignItems:'center', gap:'1rem' }}>
        <div style={{ width:'44px', height:'44px', borderRadius:'50%', background:C.amberBg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', flexShrink:0 }}>
          📝
        </div>
        <div style={{ flex:1 }}>
          <p style={{ fontFamily:'Georgia, serif', fontSize:'0.95rem', fontWeight:'700', color:C.black, marginBottom:'0.15rem' }}>
            Step 2 — Test your understanding
          </p>
          <p style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'0.75rem', color:C.gray3 }}>
            {quizResult ? `Last score: ${Math.round(quizResult)}% · ` : ''}
            Pass the quiz to unlock the cheat sheet
          </p>
        </div>
        <button onClick={onOpenQuiz}
          style={{ padding:'0.625rem 1.375rem', background:C.amber, color:'#fff', border:'none', borderRadius:'6px', fontFamily:"'DM Sans', sans-serif", fontSize:'0.82rem', fontWeight:'700', cursor:'pointer', whiteSpace:'nowrap' }}>
          {quizResult ? 'Retry Quiz' : 'Start Quiz → +50 XP'}
        </button>
      </div>
    </div>
  )

  if (state === 'live') return (
    <div style={{ background:C.white, border:'2px solid #7b2d8b', borderRadius:'10px', overflow:'hidden', animation:'slideUp 0.3s ease' }}>
      <div style={{ background:'#f3e8ff', padding:'0.625rem 1.5rem', borderBottom:'1px solid #e9d5ff', display:'flex', alignItems:'center', gap:'0.5rem' }}>
        <span style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'0.65rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:'#7b2d8b' }}>
          📡 Live Class
        </span>
      </div>
      <div style={{ padding:'1.25rem 1.5rem' }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:'1rem', marginBottom:'1rem' }}>
          <div style={{ width:'44px', height:'44px', borderRadius:'50%', background:'#f3e8ff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', flexShrink:0 }}>
            📡
          </div>
          <div style={{ flex:1 }}>
            <p style={{ fontFamily:'Georgia, serif', fontSize:'0.95rem', fontWeight:'700', color:C.black, marginBottom:'0.15rem' }}>
              Step 4 — Attend the Live Class
            </p>
            <p style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'0.75rem', color:C.gray3, lineHeight:1.6 }}>
              {video.live_description || 'A live session is scheduled for this topic. Join to ask doubts and get personalised feedback from ALP Sir.'}
            </p>
          </div>
        </div>
        <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
          {video.live_session?.meet_link && (
            <a href={video.live_session.meet_link} target="_blank" rel="noreferrer"
              style={{ display:'inline-block', padding:'0.625rem 1.375rem', background:'#7b2d8b', color:'#fff', border:'none', borderRadius:'6px', fontFamily:"'DM Sans', sans-serif", fontSize:'0.82rem', fontWeight:'700', cursor:'pointer', textDecoration:'none' }}>
              Join Live Class →
            </a>
          )}
          <button onClick={onLiveDone}
            style={{ padding:'0.625rem 1.375rem', background:C.white, color:C.gray5, border:'1px solid ' + C.border, borderRadius:'6px', fontFamily:"'DM Sans', sans-serif", fontSize:'0.82rem', cursor:'pointer' }}>
            Mark as Attended → +50 XP
          </button>
        </div>
        <p style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'0.68rem', color:C.gray3, marginTop:'0.75rem' }}>
          Can't attend? Mark as attended to continue — recordings will be available in the Recordings tab.
        </p>
      </div>
    </div>
  )

  if (state === 'cheatsheet') return (
    <div style={{ background:C.white, border:'2px solid ' + C.red, borderRadius:'10px', overflow:'hidden', animation:'slideUp 0.3s ease' }}>
      <div style={{ background:'#fce4e6', padding:'0.625rem 1.5rem', borderBottom:'1px solid #f9c0c5', display:'flex', alignItems:'center', gap:'0.5rem' }}>
        <span style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'0.65rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:C.red }}>
          🎉 Cheat Sheet Unlocked!
        </span>
      </div>
      <div style={{ padding:'1.25rem 1.5rem', display:'flex', alignItems:'center', gap:'1rem' }}>
        <div style={{ width:'44px', height:'44px', borderRadius:'50%', background:'#fce4e6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', flexShrink:0 }}>
          📄
        </div>
        <div style={{ flex:1 }}>
          <p style={{ fontFamily:'Georgia, serif', fontSize:'0.95rem', fontWeight:'700', color:C.black, marginBottom:'0.15rem' }}>
            Step 3 — Review the key concepts
          </p>
          <p style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'0.75rem', color:C.gray3 }}>
            Read the cheat sheet to complete this video and unlock the next one
          </p>
        </div>
        <button onClick={onOpenSheet}
          style={{ padding:'0.625rem 1.375rem', background:C.red, color:'#fff', border:'none', borderRadius:'6px', fontFamily:"'DM Sans', sans-serif", fontSize:'0.82rem', fontWeight:'700', cursor:'pointer', whiteSpace:'nowrap' }}>
          Open Cheat Sheet → +30 XP
        </button>
      </div>
    </div>
  )

  return null
}

// ── STEP PILL ─────────────────────────────────────────────────────────────────
function StepPill({ label, done, active, color }) {
  return (
    <div title={label} style={{ height:'5px', width:'20px', borderRadius:'100px',
      background: done ? color : active ? color + '88' : C.muted,
      transition:'background 0.2s' }} />
  )
}

// ── QUIZ OVERLAY ──────────────────────────────────────────────────────────────
function QuizOverlay({ examSlug, topicSlug, video, onDone, onSkip }) {
  const [qs,   setQs]  = useState([])
  const [cur,  setCur] = useState(0)
  const [sel,  setSel] = useState({})
  const [load, setLoad]= useState(true)
  const [res,  setRes] = useState(null)
  const [sub,  setSub] = useState(false)

  useEffect(() => {
    api.get(`/learn/${examSlug}/${topicSlug}/videos/${video.id}/quiz/`)
      .then(r => setQs(r.data.questions || []))
      .catch(() => setQs([]))
      .finally(() => setLoad(false))
  }, [])

  const submit = async () => {
    setSub(true)
    try {
      const answers = Object.entries(sel).map(([qId,optId]) => ({ question_id:parseInt(qId), selected_option_id:parseInt(optId) }))
      const r = await api.post(`/learn/${examSlug}/${topicSlug}/videos/${video.id}/quiz/submit/`, { answers })
      setRes(r.data)
    } catch { setRes({ score_pct:75, correct:3, total:qs.length }) }
    finally { setSub(false) }
  }

  const q = qs[cur]

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,15,30,0.7)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', backdropFilter:'blur(4px)' }}>
      <div style={{ background:C.white, borderRadius:'12px', width:'100%', maxWidth:'520px', maxHeight:'88vh', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 32px 80px rgba(0,0,0,0.35)', animation:'popIn 0.25s ease' }}>

        <div style={{ padding:'1.25rem 1.5rem', borderBottom:'1px solid ' + C.border, display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <p style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'0.62rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:C.amber, marginBottom:'0.2rem' }}>Quiz</p>
            <p style={{ fontFamily:'Georgia, serif', fontSize:'0.95rem', fontWeight:'700', color:C.black }}>{video.title}</p>
          </div>
          <button onClick={onSkip} style={{ background:C.muted, border:'none', cursor:'pointer', padding:'0.3rem 0.75rem', borderRadius:'4px', fontFamily:"'DM Sans', sans-serif", fontSize:'0.72rem', color:C.gray5 }}>
            Skip
          </button>
        </div>

        {load ? <div style={{ padding:'3rem', textAlign:'center', color:C.gray3, fontFamily:'Georgia, serif' }}>Loading…</div>
        : qs.length === 0 ? (
          <div style={{ padding:'3rem', textAlign:'center' }}>
            <p style={{ fontFamily:'Georgia, serif', color:C.gray3, marginBottom:'1.5rem' }}>No questions for this video yet.</p>
            <button onClick={() => onDone(100)} style={{ padding:'0.625rem 1.5rem', background:C.amber, color:'#fff', border:'none', borderRadius:'6px', fontFamily:"'DM Sans', sans-serif", fontSize:'0.82rem', fontWeight:'700', cursor:'pointer' }}>
              Continue → +50 XP
            </button>
          </div>
        ) : res ? (
          <div style={{ padding:'2rem', textAlign:'center' }}>
            <div style={{ fontSize:'3rem', fontFamily:'Georgia, serif', fontWeight:'700', color:res.score_pct>=60 ? C.green : C.amber, lineHeight:1, marginBottom:'0.5rem' }}>
              {Math.round(res.score_pct)}%
            </div>
            <p style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'0.78rem', color:C.gray3, marginBottom:'1rem' }}>
              {res.correct}/{res.total} correct
            </p>
            <p style={{ fontFamily:'Georgia, serif', fontSize:'0.9rem', color:C.gray5, lineHeight:1.7, marginBottom:'1.5rem' }}>
              {res.score_pct>=80 ? '🎉 Excellent! You\'ve got this.' : res.score_pct>=60 ? '👍 Good. The cheat sheet will help.' : '📖 Review the cheat sheet carefully.'}
            </p>
            <button onClick={() => onDone(res.score_pct)}
              style={{ padding:'0.75rem 2rem', background:C.green, color:'#fff', border:'none', borderRadius:'6px', fontFamily:"'DM Sans', sans-serif", fontSize:'0.875rem', fontWeight:'700', cursor:'pointer' }}>
              Continue →
            </button>
          </div>
        ) : (
          <>
            <div style={{ padding:'0.75rem 1.5rem', borderBottom:'1px solid ' + C.border, display:'flex', alignItems:'center', gap:'1rem' }}>
              <span style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'0.7rem', color:C.gray3, flexShrink:0 }}>{cur+1}/{qs.length}</span>
              <div style={{ flex:1, height:'5px', background:C.muted, borderRadius:'100px', overflow:'hidden' }}>
                <div style={{ height:'100%', background:C.amber, borderRadius:'100px', width:`${((cur+1)/qs.length)*100}%`, transition:'width 0.3s' }} />
              </div>
            </div>
            <div style={{ padding:'1.5rem', flex:1, overflowY:'auto' }}>
              <p style={{ fontFamily:'Georgia, serif', fontSize:'1rem', color:C.black, lineHeight:1.75, marginBottom:'1.25rem' }}>{q?.question_text}</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                {(q?.options||[]).map(opt => (
                  <button key={opt.id} onClick={() => setSel(p => ({...p,[q.id]:opt.id}))}
                    style={{ textAlign:'left', padding:'0.875rem 1.125rem', borderRadius:'8px', fontFamily:'Georgia, serif', fontSize:'0.9rem', cursor:'pointer', transition:'all 0.15s',
                      background:sel[q?.id]===opt.id ? '#fff8f0' : C.white,
                      border:`2px solid ${sel[q?.id]===opt.id ? C.amber : C.border}`,
                      color:C.black, display:'flex', alignItems:'center', gap:'0.75rem' }}>
                    <span style={{ fontWeight:'700', color:sel[q?.id]===opt.id ? C.amber : C.gray3, flexShrink:0 }}>{opt.key}.</span>
                    <span>{opt.text}</span>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ padding:'1rem 1.5rem', borderTop:'1px solid ' + C.border, display:'flex', justifyContent:'space-between' }}>
              <button onClick={() => setCur(c => Math.max(0,c-1))} disabled={cur===0}
                style={{ padding:'0.5rem 1rem', border:'1px solid ' + C.border, borderRadius:'6px', background:C.white, fontFamily:"'DM Sans', sans-serif", fontSize:'0.78rem', cursor:cur===0?'not-allowed':'pointer', opacity:cur===0?0.3:1, color:C.gray5 }}>
                ← Back
              </button>
              {cur < qs.length-1
                ? <button onClick={() => setCur(c=>c+1)} disabled={!sel[q?.id]}
                    style={{ padding:'0.5rem 1.25rem', background:C.black, color:'#fff', border:'none', borderRadius:'6px', fontFamily:"'DM Sans', sans-serif", fontSize:'0.78rem', fontWeight:'700', cursor:!sel[q?.id]?'not-allowed':'pointer', opacity:!sel[q?.id]?0.5:1 }}>
                    Next →
                  </button>
                : <button onClick={submit} disabled={sub||Object.keys(sel).length<qs.length}
                    style={{ padding:'0.5rem 1.25rem', background:C.red, color:'#fff', border:'none', borderRadius:'6px', fontFamily:"'DM Sans', sans-serif", fontSize:'0.78rem', fontWeight:'700', cursor:'pointer', opacity:sub?0.6:1 }}>
                    {sub ? 'Submitting…' : 'Submit →'}
                  </button>
              }
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── CHEAT SHEET OVERLAY ───────────────────────────────────────────────────────
function SheetOverlay({ examSlug, topicSlug, video, onDone }) {
  const [notes, setNotes] = useState(null)
  const [load,  setLoad]  = useState(true)

  useEffect(() => {
    api.get(`/learn/${examSlug}/${topicSlug}/videos/${video.id}/cheatsheet/`)
      .then(r => setNotes(r.data))
      .catch(() => setNotes({}))
      .finally(() => setLoad(false))
  }, [])

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,15,30,0.7)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', backdropFilter:'blur(4px)' }}>
      <div style={{ background:C.white, borderRadius:'12px', width:'100%', maxWidth:'580px', maxHeight:'88vh', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 32px 80px rgba(0,0,0,0.35)', animation:'popIn 0.25s ease' }}>

        <div style={{ padding:'1.25rem 1.5rem', borderBottom:'1px solid ' + C.border, display:'flex', justifyContent:'space-between', alignItems:'flex-start', background:'#fce4e6' }}>
          <div>
            <p style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'0.62rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:C.red, marginBottom:'0.2rem' }}>📄 Cheat Sheet</p>
            <p style={{ fontFamily:'Georgia, serif', fontSize:'0.95rem', fontWeight:'700', color:C.black }}>{video.title}</p>
          </div>
          <button onClick={onDone} style={{ background:C.white, border:'1px solid ' + C.border, cursor:'pointer', padding:'0.3rem 0.75rem', borderRadius:'4px', fontFamily:"'DM Sans', sans-serif", fontSize:'0.72rem', color:C.gray5 }}>
            ✕
          </button>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'1.5rem' }}>
          {load ? <p style={{ textAlign:'center', color:C.gray3, fontFamily:'Georgia, serif' }}>Loading…</p>
          : <>
            {notes?.summary && (
              <div style={{ background:C.muted, borderRadius:'8px', padding:'1rem 1.25rem', marginBottom:'1.25rem' }}>
                <p style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'0.62rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:C.gray3, marginBottom:'0.5rem' }}>Summary</p>
                <p style={{ fontFamily:'Georgia, serif', fontSize:'0.9rem', color:C.black, lineHeight:1.8 }}>{notes.summary}</p>
              </div>
            )}
            {notes?.key_points?.length > 0 && (
              <div>
                <p style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'0.62rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:C.gray3, marginBottom:'0.875rem' }}>Key Points</p>
                <div style={{ display:'flex', flexDirection:'column', gap:'0.625rem' }}>
                  {notes.key_points.map((pt, i) => (
                    <div key={i} style={{ display:'flex', gap:'0.75rem', padding:'0.75rem 1rem', background:C.white, border:'1px solid ' + C.border, borderRadius:'8px' }}>
                      <span style={{ color:C.red, fontWeight:'700', flexShrink:0 }}>→</span>
                      <p style={{ fontFamily:'Georgia, serif', fontSize:'0.875rem', color:C.black, lineHeight:1.65, margin:0 }}>{pt}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!notes?.summary && !notes?.key_points?.length && (
              <div style={{ textAlign:'center', padding:'2rem' }}>
                <p style={{ fontSize:'2rem', marginBottom:'0.75rem' }}>📄</p>
                <p style={{ fontFamily:'Georgia, serif', fontSize:'0.9rem', color:C.gray3 }}>
                  Cheat sheet will be generated after the video is processed.
                </p>
              </div>
            )}
          </>}
        </div>

        <div style={{ padding:'1rem 1.5rem', borderTop:'1px solid ' + C.border, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <p style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'0.72rem', color:C.gray3 }}>Read through before continuing</p>
          <button onClick={onDone}
            style={{ padding:'0.625rem 1.5rem', background:C.red, color:'#fff', border:'none', borderRadius:'6px', fontFamily:"'DM Sans', sans-serif", fontSize:'0.82rem', fontWeight:'700', cursor:'pointer' }}>
            Done → +30 XP
          </button>
        </div>
      </div>
    </div>
  )
}

// ── PRACTICE QUIZ TAB ─────────────────────────────────────────────────────────
function PracticeQuizTab({ examSlug, sectionSlug, topicSlug }) {
  const [questions, setQs] = useState([])
  const [loading,   setLoad] = useState(true)

  useEffect(() => {
    if (!examSlug || !sectionSlug || !topicSlug) return
    api.get(`/learn/${examSlug}/sections/${sectionSlug}/${topicSlug}/quiz/`)
      .then(({ data }) => setQs(data.questions || []))
      .catch(() => setQs([]))
      .finally(() => setLoad(false))
  }, [examSlug, sectionSlug, topicSlug])

  if (loading) return <div style={{ padding:'3rem', textAlign:'center', color:C.gray3, fontFamily:'Georgia, serif' }}>Loading…</div>

  if (!questions.length) return (
    <div style={{ padding:'4rem', textAlign:'center' }}>
      <div style={{ fontSize:'2.5rem', marginBottom:'0.75rem' }}>📝</div>
      <p style={{ fontFamily:'Georgia, serif', fontSize:'1.1rem', fontWeight:'700', color:C.black, marginBottom:'0.5rem' }}>No Questions Yet</p>
      <p style={{ fontFamily:'Georgia, serif', fontSize:'0.875rem', color:C.gray3, lineHeight:1.7, marginBottom:'1.5rem' }}>
        Questions for this topic will appear here once added via the admin panel.
      </p>
      <Link href={`/learn/${examSlug}/${sectionSlug}/quiz?topic=${topicSlug}`}
        style={{ display:'inline-block', padding:'0.75rem 1.5rem', background:C.red, color:'#fff', borderRadius:'6px', fontFamily:"'DM Sans', sans-serif", fontSize:'0.875rem', fontWeight:'700', textDecoration:'none' }}>
        Open Full Quiz Interface →
      </Link>
    </div>
  )

  return (
    <div style={{ padding:'1.5rem' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', flexWrap:'wrap', gap:'0.75rem' }}>
        <div>
          <p style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'0.65rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:C.gray3 }}>Practice Quiz</p>
          <p style={{ fontFamily:'Georgia, serif', fontSize:'1rem', fontWeight:'700', color:C.black }}>{questions.length} questions</p>
        </div>
        <Link href={`/learn/${examSlug}/${sectionSlug}/quiz?topic=${topicSlug}`}
          style={{ display:'inline-block', padding:'0.625rem 1.25rem', background:C.amber, color:'#fff', borderRadius:'6px', fontFamily:"'DM Sans', sans-serif", fontSize:'0.82rem', fontWeight:'700', textDecoration:'none' }}>
          Open Full CAT Interface →
        </Link>
      </div>
      <CATQuiz questions={questions} topicTitle={topicSlug} />
    </div>
  )
}

// ── CHEAT SHEETS TAB ──────────────────────────────────────────────────────────
function CheatSheetsTab({ sequence, stepState, examSlug, topicSlug }) {
  const unlocked = sequence.filter(v => ['cheatsheet','done'].includes(stepState[v.id]))

  if (unlocked.length === 0) return (
    <div style={{ padding:'4rem', textAlign:'center' }}>
      <div style={{ fontSize:'2.5rem', marginBottom:'0.75rem' }}>🔒</div>
      <p style={{ fontFamily:'Georgia, serif', fontSize:'1.1rem', fontWeight:'700', color:C.black, marginBottom:'0.5rem' }}>Cheat Sheets Locked</p>
      <p style={{ fontFamily:'Georgia, serif', fontSize:'0.875rem', color:C.gray3, lineHeight:1.7 }}>
        Complete a video and pass its quiz to unlock the cheat sheet.
      </p>
    </div>
  )

  return (
    <div style={{ padding:'2rem', display:'flex', flexDirection:'column', gap:'1rem', maxWidth:'720px' }}>
      {unlocked.map(video => <SheetCard key={video.id} video={video} examSlug={examSlug} topicSlug={topicSlug} />)}
    </div>
  )
}

function SheetCard({ video, examSlug, topicSlug }) {
  const [notes, setNotes] = useState(null)
  const [open,  setOpen]  = useState(false)

  const load = () => {
    if (notes) { setOpen(o => !o); return }
    api.get(`/learn/${examSlug}/${topicSlug}/videos/${video.id}/cheatsheet/`)
      .then(r => { setNotes(r.data); setOpen(true) })
      .catch(() => { setNotes({}); setOpen(true) })
  }

  return (
    <div style={{ border:'1px solid ' + C.border, borderRadius:'10px', overflow:'hidden', background:C.white }}>
      <button onClick={load}
        style={{ width:'100%', textAlign:'left', padding:'1rem 1.25rem', border:'none', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center',
          background:open ? C.black : C.white, transition:'background 0.2s' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <span style={{ fontSize:'1rem' }}>📄</span>
          <span style={{ fontFamily:'Georgia, serif', fontSize:'0.9rem', fontWeight:'600', color:open ? '#fff' : C.black }}>{video.title}</span>
        </div>
        <span style={{ color:open ? '#fff' : C.gray3, fontSize:'0.75rem', fontFamily:"'DM Sans', sans-serif" }}>{open ? '▲ Close' : '▼ View'}</span>
      </button>
      {open && notes && (
        <div style={{ padding:'1.25rem', background:C.muted, borderTop:'1px solid ' + C.border }}>
          {notes.summary && <p style={{ fontFamily:'Georgia, serif', fontSize:'0.875rem', color:C.black, lineHeight:1.8, marginBottom:'1rem' }}>{notes.summary}</p>}
          {notes.key_points?.map((pt, i) => (
            <div key={i} style={{ display:'flex', gap:'0.625rem', marginBottom:'0.5rem' }}>
              <span style={{ color:C.red, fontWeight:'700', flexShrink:0 }}>→</span>
              <p style={{ fontFamily:'Georgia, serif', fontSize:'0.875rem', color:C.black, lineHeight:1.6, margin:0 }}>{pt}</p>
            </div>
          ))}
          {!notes.summary && !notes.key_points?.length && (
            <p style={{ fontFamily:'Georgia, serif', fontSize:'0.875rem', color:C.gray3 }}>Cheat sheet content coming soon.</p>
          )}
        </div>
      )}
    </div>
  )
}

// ── ALL DONE VIEW ─────────────────────────────────────────────────────────────
function AllDoneView({ topicTitle, onBack }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'5rem 2rem', textAlign:'center' }}>
      <div style={{ fontSize:'4rem', marginBottom:'1rem' }}>🏆</div>
      <p style={{ fontFamily:'Georgia, serif', fontSize:'1.75rem', fontWeight:'700', color:C.black, marginBottom:'0.5rem' }}>Topic Complete!</p>
      <p style={{ fontFamily:'Georgia, serif', fontSize:'0.95rem', color:C.gray3, lineHeight:1.75, marginBottom:'2rem', maxWidth:'400px' }}>
        You've finished all videos, quizzes and cheat sheets in {topicTitle}. Excellent work.
      </p>
      <button onClick={onBack}
        style={{ padding:'0.875rem 2rem', background:C.red, color:'#fff', border:'none', borderRadius:'6px', fontFamily:"'DM Sans', sans-serif", fontSize:'0.9rem', fontWeight:'700', cursor:'pointer' }}>
        ← Back to Topics
      </button>
    </div>
  )
}

// ── SHELL ─────────────────────────────────────────────────────────────────────
function Shell({ examSlug, sectionSlug, topic, user, children }) {
  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:"'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

        /* ── CONTENT PROTECTION CSS ── */

        /* Disable text selection everywhere on this page */
        * {
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
          -webkit-touch-callout: none !important;
        }

        /* Allow selection only in input/textarea fields */
        input, textarea, [contenteditable] {
          -webkit-user-select: text !important;
          user-select: text !important;
        }

        /* Disable image dragging */
        img {
          -webkit-user-drag: none !important;
          user-drag: none !important;
          pointer-events: none;
        }

        /* Watermark overlay on video area */
        .gs-video-protected {
          position: relative;
        }
        .gs-video-protected::after {
          content: attr(data-watermark);
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-25deg);
          font-size: 0.85rem;
          font-family: 'DM Sans', sans-serif;
          color: rgba(255,255,255,0.08);
          pointer-events: none;
          white-space: nowrap;
          letter-spacing: 0.2em;
          font-weight: 700;
          z-index: 10;
          text-transform: uppercase;
        }

        /* Screenshot blackout overlay */
        #gs-ss-block {
          position: fixed;
          inset: 0;
          background: #000;
          z-index: 99999;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.1s;
        }

        /* Hide content when printing */
        @media print {
          body * { visibility: hidden !important; }
          body::before {
            content: 'This content is protected and cannot be printed.';
            visibility: visible !important;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 1.5rem;
            font-family: sans-serif;
            color: #333;
          }
        }

        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes popIn { 0%{transform:scale(0.8);opacity:0} 100%{transform:scale(1);opacity:1} }
        @keyframes slideUp { 0%{transform:translateY(12px);opacity:0} 100%{transform:translateY(0);opacity:1} }
      `}</style>

      {/* Screenshot blackout overlay */}
      <div id="gs-ss-block" />

      {/* Top bar */}
      <div style={{ height:'56px', background:C.white, borderBottom:'1px solid ' + C.border, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 2rem', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <Link href="/" style={{ fontFamily:'Georgia, serif', fontSize:'1.1rem', fontWeight:'700', textDecoration:'none', color:C.black }}>
            <span style={{ color:C.red }}>GRAD</span>SKOOL
          </Link>
          {examSlug && (
            <>
              <span style={{ color:C.border }}>›</span>
              <a href="/" style={{ fontFamily:"var(--font-sans)", fontSize:"0.65rem", color:"rgba(255,255,255,0.25)", textDecoration:"none" }}>Website</a>
          <span style={{ color:"rgba(255,255,255,0.15)", margin:"0 0.25rem" }}>/</span>
          <Link href="/dashboard" style={{ fontFamily:"var(--font-sans)", fontSize:"0.65rem", color:"rgba(255,255,255,0.25)", textDecoration:"none" }}>Dashboard</Link>
          <span style={{ color:"rgba(255,255,255,0.15)", margin:"0 0.25rem" }}>/</span>
          <Link href={`/learn/${examSlug}`} style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'0.78rem', color:C.gray3, textDecoration:'none' }}>
                {examSlug?.toUpperCase()}
              </Link>
            </>
          )}
          {sectionSlug && examSlug && (
            <>
              <span style={{ color:C.border }}>›</span>
              <Link href={`/learn/${examSlug}/${sectionSlug}`} style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'0.78rem', color:C.gray3, textDecoration:'none' }}>
                {sectionSlug?.replace(`${examSlug}-`,'').toUpperCase()}
              </Link>
            </>
          )}
          {topic && (
            <>
              <span style={{ color:C.border }}>›</span>
              <span style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'0.78rem', color:C.black, fontWeight:'600' }}>
                {topic.title?.length > 30 ? topic.title.substring(0,30)+'…' : topic.title}
              </span>
            </>
          )}
        </div>
        <Link href="/dashboard" style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'0.78rem', color:C.red, fontWeight:'700', textDecoration:'none' }}>
          Dashboard →
        </Link>
      </div>

      {children}
    </div>
  )
}

// ── DEMO DATA ─────────────────────────────────────────────────────────────────
function makeDemoData(topicSlug, sectionSlug) {
  const title = topicSlug?.replace(/-/g,' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Topic'
  return {
    topic: { id:1, title, slug:topicSlug },
    section: { title: sectionSlug || 'Section', short_title:'SEC', slug:sectionSlug },
    sequence: [
      { id:1, sort_order:1, title:'Introduction & Core Concepts',   duration_mins:18, has_quiz:false, has_cheatsheet:true,  has_live:false, is_locked:false, state:'unlocked', watch_pct:0, best_score_pct:null, cheatsheet_opened:false, bunny_video_id:'', youtube_video_id:'', quiz_attempts:0, quiz_passed:false, difficulty:'beginner',      live_description:'' },
      { id:2, sort_order:2, title:'Techniques & Worked Examples',   duration_mins:26, has_quiz:true,  has_cheatsheet:true,  has_live:true,  is_locked:true,  state:'locked',   watch_pct:0, best_score_pct:null, cheatsheet_opened:false, bunny_video_id:'', youtube_video_id:'', quiz_attempts:0, quiz_passed:false, difficulty:'intermediate', live_description:'Live Q&A session — ask doubts from this video directly to ALP Sir' },
      { id:3, sort_order:3, title:'Practice Problems — Level 1',    duration_mins:32, has_quiz:true,  has_cheatsheet:true,  has_live:false, is_locked:true,  state:'locked',   watch_pct:0, best_score_pct:null, cheatsheet_opened:false, bunny_video_id:'', youtube_video_id:'', quiz_attempts:0, quiz_passed:false, difficulty:'intermediate', live_description:'' },
      { id:4, sort_order:4, title:'CAT Level Questions & Strategy', duration_mins:28, has_quiz:true,  has_cheatsheet:false, has_live:false, is_locked:true,  state:'locked',   watch_pct:0, best_score_pct:null, cheatsheet_opened:false, bunny_video_id:'', youtube_video_id:'', quiz_attempts:0, quiz_passed:false, difficulty:'advanced',     live_description:'' },
    ],
    live_session: null,
  }
}

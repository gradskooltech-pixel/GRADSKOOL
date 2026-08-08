/**
 * GRADSKOOL — Learn Portal (Sidebar Navigation)
 * Route: /learn/[examSlug]
 * 
 * Redesigned: persistent left sidebar shows all sections + topics.
 * No more 3-click navigation — everything is one click away.
 */
import { useState, useEffect } from "react"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { SoftRoute } from "../../../components/auth/SoftRoute"
import { ProtectedRoute } from "../../../components/auth/ProtectedRoute"
import api from "../../../lib/api"

const C = { red:"#ff5e5f", black:"#0f0f0f", white:"#fff", bg:"#f7f6f3", border:"#e8e8e6", gray:"#999", green:"#22c55e", amber:"#f59e0b", blue:"#3b82f6", muted:"#f4f3f0" }

export default function LearnIndex() {
  return <SoftRoute><Inner /></SoftRoute>
}

function Inner() {
  const router = useRouter()
  const { examSlug } = router.query

  const [sections,  setSections]  = useState([])
  const [gam,       setGam]       = useState(null)
  const [loading,   setLoad]      = useState(true)
  const [expanded,  setExpanded]  = useState({})
  const [courseType,setCourseType]= useState("recorded")
  const [components,setComponents]= useState([])
  const [isEnrolled,setIsEnrolled]= useState(false)

  useEffect(() => {
    if (!examSlug) return
    setLoad(true)
    Promise.all([
      api.get(`/learn/${examSlug}/sections/`),
      api.get(`/learn/gamification/?exam=${examSlug}`),
    ]).then(([s, g]) => {
      const secs = s.data.sections || []
      setSections(secs)
      setCourseType(s.data.course_type || "recorded")
      setComponents(s.data.components || [])
      setIsEnrolled(s.data.is_enrolled || false)
      setGam(g.data)
      // Auto-expand first section
      if (secs.length > 0) setExpanded({ [secs[0].id]: true })
    }).catch(() => {
      setSections(DEMO_SECTIONS)
      setGam(null)
    }).finally(() => setLoad(false))
  }, [examSlug])

  const toggle = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }))

  const totalTopics    = sections.reduce((a, s) => a + (s.total_topics || 0), 0)
  const completedTotal = sections.reduce((a, s) => a + (s.completed_topics || 0), 0)
  const overallPct     = totalTopics ? Math.round(completedTotal / totalTopics * 100) : 0

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column" }}>
      <Head><title>Learn {(examSlug||"").toUpperCase()} — GRADSKOOL</title></Head>

      {/* Top bar */}
      <div style={{ height:"52px", background:C.black, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 1.5rem", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"1rem" }}>
          <Link href="/" style={{ fontFamily:"var(--font-sans)", fontSize:"0.68rem", color:"rgba(255,255,255,0.25)", textDecoration:"none", marginRight:"0.25rem" }}>Website</Link>
          <span style={{ color:"rgba(255,255,255,0.15)", marginRight:"0.25rem" }}>/</span>
          <Link href="/dashboard" style={{ fontFamily:"var(--font-sans)", fontSize:"0.75rem", color:"rgba(255,255,255,0.4)", textDecoration:"none" }}>Dashboard</Link>
          <span style={{ color:"rgba(255,255,255,0.2)" }}>|</span>
          <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.82rem", fontWeight:"700", color:"#fff" }}>
            {(examSlug||"").toUpperCase()} Portal
          </span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"1rem" }}>
          {gam && (
            <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
              <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.72rem", color:C.amber, fontWeight:"700" }}>⚡{gam.xp} XP</span>
              <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.75rem", color:"#f97316" }}>🔥{gam.streak}</span>
            </div>
          )}
          <div style={{ display:"flex", gap:"0.375rem" }}>
            {[
              ["/learn/"+examSlug+"/notes",      "📚 Notes"
              ["/learn/"+examSlug+"/glossary",    "📖 Glossary"],],
              ["/learn/"+examSlug+"/recordings", "🎬 Recordings"],
              ["/learn/"+examSlug+"/mastery",    "🗺 Mastery"],
            ].map(([href, label]) => (
              <Link key={href} href={href}
                style={{ fontFamily:"var(--font-sans)", fontSize:"0.68rem", padding:"0.25rem 0.625rem", border:"1px solid rgba(255,255,255,0.15)", borderRadius:"3px", color:"rgba(255,255,255,0.5)", textDecoration:"none" }}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"280px 1fr", flex:1, overflow:"hidden" }}>
        {/* ── SIDEBAR ───────────────────────────────────────────────── */}
        <div style={{ background:C.white, borderRight:"1px solid "+C.border, overflowY:"auto", display:"flex", flexDirection:"column" }}>
          {/* Overall progress */}
          <div style={{ padding:"1rem 1.125rem", borderBottom:"1px solid "+C.border }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"0.4rem" }}>
              <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.68rem", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.08em", color:C.gray }}>Overall Progress</span>
              <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.72rem", fontWeight:"700", color:overallPct>=80?C.green:C.black }}>{overallPct}%</span>
            </div>
            <div style={{ height:"5px", background:C.muted, borderRadius:"100px", overflow:"hidden" }}>
              <div style={{ height:"100%", width:overallPct+"%", background:overallPct>=80?C.green:C.red, borderRadius:"100px", transition:"width 0.5s" }} />
            </div>
            <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.62rem", color:C.gray, marginTop:"0.3rem" }}>
              {completedTotal} / {totalTopics} topics done
            </p>
          </div>

          {/* Spaced rep alert */}
          {gam?.due_reviews?.length > 0 && (
            <div style={{ margin:"0.75rem 1rem", padding:"0.625rem 0.875rem", background:"#fffbeb", border:"1px solid #fcd34d", borderRadius:"6px" }}>
              <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.72rem", fontWeight:"700", color:"#92400e", marginBottom:"0.2rem" }}>⏰ {gam.due_reviews.length} topic{gam.due_reviews.length!==1?"s":""} due for review</p>
              <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.62rem", color:"#a16207" }}>Based on your quiz scores</p>
            </div>
          )}

          {/* Section accordion */}
          {loading ? (
            <p style={{ padding:"2rem", textAlign:"center", fontFamily:"Georgia,serif", color:C.gray, fontSize:"0.875rem" }}>Loading…</p>
          ) : sections.map(sec => {
            const isOpen  = !!expanded[sec.id]
            const secPct  = sec.total_topics ? Math.round((sec.completed_topics||0)/sec.total_topics*100) : 0
            return (
              <div key={sec.id}>
                {/* Section header */}
                <div onClick={() => toggle(sec.id)}
                  style={{ display:"flex", alignItems:"center", gap:"0.625rem", padding:"0.75rem 1rem", cursor:"pointer", borderBottom:"1px solid "+C.border, background:isOpen?"#fff5f5":C.white, transition:"background 0.1s" }}>
                  <div style={{ width:"28px", height:"28px", borderRadius:"50%", background:secPct>=100?C.green:secPct>0?"#fff5f5":C.muted, border:"2px solid "+(secPct>=100?C.green:secPct>0?C.red:C.border), display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    {secPct >= 100
                      ? <span style={{ color:C.green, fontSize:"0.75rem" }}>✓</span>
                      : <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.6rem", fontWeight:"700", color:C.gray }}>{secPct}%</span>
                    }
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.78rem", fontWeight:"700", color:C.black, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {sec.short_title || sec.title}
                    </p>
                    <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.62rem", color:C.gray }}>
                      {sec.completed_topics||0}/{sec.total_topics||0} topics
                    </p>
                  </div>
                  <span style={{ color:C.gray, fontSize:"0.75rem", transform:isOpen?"rotate(180deg)":"none", transition:"transform 0.2s", flexShrink:0 }}>▼</span>
                </div>

                {/* Topics list */}
                {isOpen && sec.topics?.map(topic => {
                  const isDone  = (topic.completion_pct||0) >= 100
                  const isWeak  = gam?.weak_topics?.some(w => w["topic_video__topic__slug"] === topic.slug)
                  const isDue   = gam?.due_reviews?.some(r => r.slug === topic.slug)
                  return (
                    {/* isLocked = not enrolled AND video is not free preview */}
                    {(() => {
                      const isLocked = !isEnrolled && !topic.is_free_preview && !topic.videos?.some(v => v.is_free_preview)
                      if (isLocked) {
                        return (
                          <div key={topic.id}
                            style={{ display:"flex", alignItems:"center", gap:"0.625rem", padding:"0.5rem 1rem 0.5rem 2rem", borderBottom:"1px solid "+C.border, opacity:0.45, cursor:"not-allowed", background:C.white }}>
                            <div style={{ width:"14px", height:"14px", borderRadius:"50%", flexShrink:0, background:C.border, border:"1.5px solid "+C.border, display:"flex", alignItems:"center", justifyContent:"center" }}>
                              <span style={{ fontSize:"0.5rem" }}>🔒</span>
                            </div>
                            <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.75rem", color:C.gray, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                              {topic.title}
                            </span>
                            <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.55rem", color:C.gray, flexShrink:0 }}>Enrol to unlock</span>
                          </div>
                        )
                      }
                      return (
                    <Link key={topic.id}
                      href={`/learn/${examSlug}/${sec.slug}/${topic.slug}`}
                      style={{ display:"flex", alignItems:"center", gap:"0.625rem", padding:"0.5rem 1rem 0.5rem 2rem", borderBottom:"1px solid "+C.border, textDecoration:"none", background:C.white, transition:"background 0.1s" }}
                      onMouseEnter={e=>e.currentTarget.style.background=C.muted}
                      onMouseLeave={e=>e.currentTarget.style.background=C.white}>
                      <div style={{ width:"14px", height:"14px", borderRadius:"50%", flexShrink:0, background:isDone?C.green:C.border, border:"1.5px solid "+(isDone?C.green:C.border), display:"flex", alignItems:"center", justifyContent:"center" }}>
                        {isDone && <span style={{ color:"#fff", fontSize:"0.5rem" }}>✓</span>}
                      </div>
                      <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.75rem", color:C.black, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {topic.title}
                      </span>
                      <div style={{ display:"flex", gap:"3px", flexShrink:0 }}>
                        {!isEnrolled && (topic.is_free_preview || topic.videos?.some(v => v.is_free_preview)) && (
                          <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.5rem", fontWeight:"700", padding:"0.1rem 0.3rem", borderRadius:"2px", background:"#dcfce7", color:"#166534" }}>FREE</span>
                        )}
                        {isWeak && <span style={{ fontSize:"0.6rem" }}>⚠️</span>}
                        {isDue  && <span style={{ fontSize:"0.6rem" }}>⏰</span>}
                        {topic.has_live && <span style={{ fontSize:"0.6rem" }}>📡</span>}
                      </div>
                    </Link>
                      )
                    })()}
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* ── MAIN AREA ─────────────────────────────────────────────── */}
        <div style={{ overflowY:"auto", padding:"2rem", display:"flex", flexDirection:"column", gap:"1.5rem" }}>
          {/* Not enrolled banner */}
          {!isEnrolled && (
            <div style={{ background:"linear-gradient(135deg, #1d4ed8 0%, #7b2d8b 100%)", borderRadius:"8px", padding:"1.25rem 1.5rem", marginBottom:"1rem", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"0.75rem" }}>
              <div>
                <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.78rem", fontWeight:"700", color:"#fff", marginBottom:"0.2rem" }}>
                  👀 You're viewing free preview content
                </p>
                <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.68rem", color:"rgba(255,255,255,0.65)" }}>
                  🔒 Locked topics require enrollment. Enrol to unlock the full course.
                </p>
              </div>
              <a href={"/courses/"+examSlug}
                style={{ fontFamily:"var(--font-sans)", fontSize:"0.82rem", fontWeight:"700", padding:"0.625rem 1.25rem", background:"#fff", color:"#1d4ed8", borderRadius:"4px", textDecoration:"none", flexShrink:0, whiteSpace:"nowrap" }}>
                Enrol Now →
              </a>
            </div>
          )}

          {/* Welcome card */}
          <div style={{ background:"linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%)", borderRadius:"8px", padding:"2rem" }}>
            <p style={{ fontFamily:"Georgia,serif", fontSize:"1.25rem", fontWeight:"700", color:"#fff", marginBottom:"0.5rem" }}>
              {(examSlug||"").toUpperCase()} Preparation
            </p>
            <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.82rem", color:"rgba(255,255,255,0.5)", marginBottom:"1.25rem" }}>
              {totalTopics} topics · {sections.length} sections · Pick up from where you left off
            </p>
            <div style={{ display:"flex", gap:"0.75rem", flexWrap:"wrap" }}>
              {gam?.due_reviews?.[0] && (
                <Link href={`/learn/${examSlug}/${gam.due_reviews[0].section}/${gam.due_reviews[0].slug}`}
                  style={{ padding:"0.625rem 1.25rem", background:C.amber, color:"#fff", borderRadius:"4px", fontFamily:"var(--font-sans)", fontSize:"0.78rem", fontWeight:"700", textDecoration:"none" }}>
                  ⏰ Review: {gam.due_reviews[0].title}
                </Link>
              )}
              {gam?.weak_topics?.[0] && (
                <Link href={`/learn/${examSlug}/${gam.weak_topics[0]["topic_video__topic__module__slug"]}/${gam.weak_topics[0]["topic_video__topic__slug"]}`}
                  style={{ padding:"0.625rem 1.25rem", background:"rgba(255,255,255,0.1)", color:"#fff", borderRadius:"4px", fontFamily:"var(--font-sans)", fontSize:"0.78rem", fontWeight:"700", textDecoration:"none", border:"1px solid rgba(255,255,255,0.2)" }}>
                  ⚠️ Weak: {gam.weak_topics[0]["topic_video__topic__title"]}
                </Link>
              )}
            </div>
          </div>

          {/* Course components (what this course offers) */}
          {components.length > 0 && (
            <div>
              <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.65rem", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.1em", color:C.gray, marginBottom:"0.875rem" }}>This Course Includes</p>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(160px,1fr))", gap:"0.75rem" }}>
                {components.map(comp => {
                  const icons = { video:"📹", quiz:"📝", cheatsheet:"📄", live:"📡", mock_test:"🧪", pre_test:"🎯", assignment:"✏️", resources:"📚", notes:"📓", post_test:"🏁" }
                  return (
                    <div key={comp.id} style={{ background:C.white, border:"1px solid "+C.border, borderRadius:"6px", padding:"0.875rem", textAlign:"center" }}>
                      <p style={{ fontSize:"1.25rem", marginBottom:"0.375rem" }}>{icons[comp.component_type]||"📌"}</p>
                      <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.72rem", fontWeight:"700", color:C.black }}>{comp.title}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Section cards — click to expand/navigate */}
          <div>
            <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.65rem", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.1em", color:C.gray, marginBottom:"0.875rem" }}>All Sections</p>
            <div style={{ display:"flex", flexDirection:"column", gap:"0.625rem" }}>
              {sections.map(sec => {
                const secPct = sec.total_topics ? Math.round((sec.completed_topics||0)/sec.total_topics*100) : 0
                return (
                  <div key={sec.id} style={{ background:C.white, border:"1px solid "+C.border, borderRadius:"8px", padding:"1rem 1.25rem", cursor:"pointer" }}
                    onClick={() => { toggle(sec.id); document.querySelector(`[data-sec="${sec.id}"]`)?.scrollIntoView({behavior:"smooth"}) }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.5rem" }}>
                      <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.875rem", fontWeight:"700", color:C.black }}>{sec.title}</p>
                      <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.72rem", fontWeight:"700", color:secPct>=80?C.green:C.black }}>{secPct}%</span>
                    </div>
                    <div style={{ height:"4px", background:C.muted, borderRadius:"100px", overflow:"hidden", marginBottom:"0.375rem" }}>
                      <div style={{ height:"100%", width:secPct+"%", background:secPct>=80?C.green:C.red, borderRadius:"100px" }} />
                    </div>
                    <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.65rem", color:C.gray }}>{sec.completed_topics||0}/{sec.total_topics||0} topics</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const DEMO_SECTIONS = [
  { id:1, title:"Verbal Ability & Reading Comprehension", short_title:"VARC", slug:"cat-varc", total_topics:8, completed_topics:3, topics:[
    { id:1, title:"Reading Comprehension Strategy", slug:"rc-strategy", completion_pct:100 },
    { id:2, title:"Para Jumbles", slug:"para-jumbles", completion_pct:100 },
    { id:3, title:"Para Summary", slug:"para-summary", completion_pct:100 },
    { id:4, title:"Sentence Correction", slug:"sentence-correction", completion_pct:0 },
  ]},
  { id:2, title:"Data Interpretation & Logical Reasoning", short_title:"DILR", slug:"cat-dilr", total_topics:6, completed_topics:1, topics:[
    { id:5, title:"Seating Arrangements", slug:"seating-arrangements", completion_pct:100 },
    { id:6, title:"Grid Puzzles", slug:"grid-puzzles", completion_pct:0 },
  ]},
  { id:3, title:"Quantitative Aptitude", short_title:"QA", slug:"cat-qa", total_topics:10, completed_topics:0, topics:[
    { id:7, title:"Percentages", slug:"percentages", completion_pct:0 },
    { id:8, title:"Time & Work", slug:"time-work", completion_pct:0 },
  ]},
]

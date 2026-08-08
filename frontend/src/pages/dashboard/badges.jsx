/**
 * GRADSKOOL — Badges & Achievements
 * Route: /dashboard/badges  
 */
import { useState, useEffect } from "react"
import Head from "next/head"
import Link from "next/link"
import { ProtectedRoute } from "../../components/auth/ProtectedRoute"
import { useAuth } from "../../hooks/useAuth"
import api from "../../lib/api"

const C = { red:"#ff5e5f", black:"#0f0f0f", white:"#fff", bg:"#f7f6f3", border:"#e8e8e6", gray:"#999", green:"#22c55e", amber:"#f59e0b", muted:"#f4f3f0" }

const ALL_BADGES = [
  { slug:"first-video",   icon:"🎬", name:"First Video",    desc:"Watch your first video",         type:"milestone", threshold:1 },
  { slug:"streak-3",      icon:"🔥", name:"3-Day Streak",   desc:"Watch videos 3 days in a row",   type:"streak",    threshold:3 },
  { slug:"streak-7",      icon:"🔥", name:"Week Warrior",   desc:"Watch videos 7 days in a row",   type:"streak",    threshold:7 },
  { slug:"streak-30",     icon:"⚡", name:"Month Master",   desc:"30-day learning streak",          type:"streak",    threshold:30 },
  { slug:"quiz-ace",      icon:"📝", name:"Quiz Ace",       desc:"Score 90%+ on a quiz",            type:"score",     threshold:90 },
  { slug:"perfect-score", icon:"💯", name:"Perfect Score",  desc:"Score 100% on a quiz",            type:"score",     threshold:100 },
  { slug:"video-10",      icon:"📹", name:"Eager Learner",  desc:"Watch 10 videos",                 type:"completion",threshold:10 },
  { slug:"video-50",      icon:"🎓", name:"Dedicated",      desc:"Watch 50 videos",                 type:"completion",threshold:50 },
  { slug:"video-100",     icon:"🏆", name:"Expert",         desc:"Watch 100 videos",                type:"completion",threshold:100 },
]

export default function BadgesPage() {
  return <ProtectedRoute><Inner /></ProtectedRoute>
}

function Inner() {
  const { user } = useAuth()
  const [gam, setGam] = useState(null)
  const [loading, setLoad] = useState(true)
  const exam = user?.target_exam || "cat"

  useEffect(() => {
    api.get("/learn/gamification/?exam=" + exam)
      .then(({ data }) => setGam(data))
      .catch(() => setGam({ badges:[], xp:0, streak:0 }))
      .finally(() => setLoad(false))
  }, [])

  const earnedSlugs = new Set(gam?.badges?.map(b => b.badge__slug || b.badge__name?.toLowerCase().replace(/ /g,"-")) || [])
  const earnedCount = gam?.badges?.length || 0

  return (
    <div style={{ minHeight:"100vh", background:C.bg }}>
      <Head><title>Badges — GRADSKOOL</title></Head>
      <div style={{ height:"52px", background:C.white, borderBottom:"1px solid "+C.border, display:"flex", alignItems:"center", padding:"0 1.5rem", gap:"1rem" }}>
        <Link href="/dashboard?tab=gamification" style={{ fontFamily:"var(--font-sans)", fontSize:"0.75rem", color:C.gray, textDecoration:"none" }}>← Dashboard</Link>
        <span style={{ color:C.border }}>|</span>
        <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.82rem", fontWeight:"700", color:C.black }}>Badges & Achievements</span>
      </div>

      <div style={{ maxWidth:"800px", margin:"0 auto", padding:"2rem" }}>
        {/* XP summary */}
        {!loading && gam && (
          <div style={{ background:C.black, borderRadius:"8px", padding:"1.5rem", marginBottom:"1.5rem", display:"flex", alignItems:"center", gap:"2rem" }}>
            <div style={{ textAlign:"center" }}>
              <p style={{ fontFamily:"Georgia,serif", fontSize:"2.5rem", fontWeight:"700", color:C.amber, lineHeight:1 }}>⚡{gam.xp||0}</p>
              <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.65rem", color:"rgba(255,255,255,0.4)", marginTop:"0.25rem" }}>Total XP</p>
            </div>
            <div style={{ textAlign:"center" }}>
              <p style={{ fontFamily:"Georgia,serif", fontSize:"2.5rem", fontWeight:"700", color:"#f97316", lineHeight:1 }}>🔥{gam.streak||0}</p>
              <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.65rem", color:"rgba(255,255,255,0.4)", marginTop:"0.25rem" }}>Day streak</p>
            </div>
            <div style={{ textAlign:"center" }}>
              <p style={{ fontFamily:"Georgia,serif", fontSize:"2.5rem", fontWeight:"700", color:C.green, lineHeight:1 }}>🏅{earnedCount}</p>
              <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.65rem", color:"rgba(255,255,255,0.4)", marginTop:"0.25rem" }}>Badges earned</p>
            </div>
            <div style={{ flex:1 }}>
              <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.68rem", color:"rgba(255,255,255,0.4)", marginBottom:"0.5rem" }}>Level {gam.level||1} Progress</p>
              <div style={{ height:"6px", background:"rgba(255,255,255,0.1)", borderRadius:"100px", overflow:"hidden" }}>
                <div style={{ height:"100%", width:Math.round(((500-(gam.xp_to_next||500))/500)*100)+"%", background:C.amber, borderRadius:"100px" }} />
              </div>
              <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.62rem", color:"rgba(255,255,255,0.3)", marginTop:"0.3rem" }}>{gam.xp_to_next||500} XP to Level {(gam.level||1)+1}</p>
            </div>
          </div>
        )}

        {/* Badge grid */}
        <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.65rem", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.1em", color:C.gray, marginBottom:"0.875rem" }}>
          All Badges — {earnedCount}/{ALL_BADGES.length} earned
        </p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px,1fr))", gap:"1rem" }}>
          {ALL_BADGES.map(badge => {
            const earned = earnedSlugs.has(badge.slug) || (gam?.badges||[]).some(b => b.badge__name === badge.name)
            return (
              <div key={badge.slug} style={{ background:C.white, border:"1px solid "+(earned?C.green:C.border), borderRadius:"8px", padding:"1.25rem", opacity:earned?1:0.5, position:"relative", overflow:"hidden" }}>
                {earned && <div style={{ position:"absolute", top:0, right:0, width:0, height:0, borderStyle:"solid", borderWidth:"0 36px 36px 0", borderColor:"transparent "+C.green+" transparent transparent" }} />}
                {earned && <span style={{ position:"absolute", top:"3px", right:"3px", color:"#fff", fontSize:"0.6rem" }}>✓</span>}
                <p style={{ fontSize:"2rem", marginBottom:"0.625rem" }}>{badge.icon}</p>
                <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.82rem", fontWeight:"700", color:C.black, marginBottom:"0.25rem" }}>{badge.name}</p>
                <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.68rem", color:C.gray, lineHeight:1.5, marginBottom:"0.5rem" }}>{badge.desc}</p>
                <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.6rem", padding:"0.15rem 0.4rem", borderRadius:"3px", background:C.muted, color:C.gray }}>
                  {badge.type} · {badge.threshold}{badge.type==="score"?"%":badge.type==="streak"?" days":" videos"}
                </span>
              </div>
            )
          })}
        </div>

        {/* How to earn XP */}
        <div style={{ background:C.muted, border:"1px solid "+C.border, borderRadius:"8px", padding:"1.25rem", marginTop:"1.5rem" }}>
          <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.65rem", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.1em", color:C.gray, marginBottom:"0.875rem" }}>How to earn XP</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.5rem" }}>
            {[["Watch a video (70%+)","⚡ +30 XP"],["Pass a quiz (60%+)","⚡ +50 XP"],["7-day streak","⚡ +100 XP"],["Complete a topic","⚡ +80 XP"]].map(([act,xp]) => (
              <div key={act} style={{ display:"flex", justifyContent:"space-between", padding:"0.5rem 0.75rem", background:C.white, borderRadius:"4px", border:"1px solid "+C.border }}>
                <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.75rem", color:C.black }}>{act}</span>
                <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.72rem", fontWeight:"700", color:C.amber }}>{xp}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

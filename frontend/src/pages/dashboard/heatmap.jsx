/**
 * GRADSKOOL — Study Time Heatmap
 * Route: /dashboard/heatmap
 * GitHub-style contribution grid — each day coloured by study intensity
 */
import { useState, useEffect } from "react"
import Head from "next/head"
import Link from "next/link"
import { ProtectedRoute } from "../../components/auth/ProtectedRoute"
import { useAuth } from "../../hooks/useAuth"
import api from "../../lib/api"

const C = { red:"#ff5e5f",black:"#0f0f0f",white:"#fff",bg:"#f7f6f3",border:"#e8e8e6",gray:"#999",green:"#22c55e",muted:"#f4f3f0" }

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
const DAYS   = ["Mon","","Wed","","Fri","",""]

function getColor(mins) {
  if (!mins) return "#ebedf0"
  if (mins < 20)  return "#9be9a8"
  if (mins < 45)  return "#40c463"
  if (mins < 90)  return "#30a14e"
  return "#216e39"
}

export default function HeatmapPage() {
  return <ProtectedRoute><Inner /></ProtectedRoute>
}

function Inner() {
  const { user } = useAuth()
  const [data, setData]     = useState({})
  const [stats, setStats]   = useState(null)
  const [loading, setLoad]  = useState(true)
  const [tooltip, setTip]   = useState(null)
  const exam = user?.target_exam || "cat"

  useEffect(() => {
    api.get("/learn/study-heatmap/?exam=" + exam)
      .then(({ data: d }) => { setData(d.heatmap || {}); setStats(d) })
      .catch(() => {
        // Demo data
        const demo = {}
        for (let i = 0; i < 365; i++) {
          const d = new Date(); d.setDate(d.getDate() - i)
          const key = d.toISOString().slice(0,10)
          if (Math.random() > 0.4) demo[key] = { minutes: Math.floor(Math.random()*120+10), videos: Math.floor(Math.random()*4), quizzes: Math.floor(Math.random()*2) }
        }
        setData(demo)
        setStats({ total_days:Object.keys(demo).length, total_minutes:Object.values(demo).reduce((a,v)=>a+v.minutes,0), total_videos:Object.values(demo).reduce((a,v)=>a+v.videos,0), longest_streak:12 })
      })
      .finally(() => setLoad(false))
  }, [exam])

  // Build 52 weeks × 7 days grid
  const today = new Date()
  const weeks = []
  for (let w = 51; w >= 0; w--) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const date = new Date(today)
      date.setDate(date.getDate() - (w * 7 + (6 - d)))
      week.push(date.toISOString().slice(0, 10))
    }
    weeks.push(week)
  }

  // Month labels
  const monthLabels = []
  weeks.forEach((week, wi) => {
    const month = new Date(week[0]).getMonth()
    const prevMonth = wi > 0 ? new Date(weeks[wi-1][0]).getMonth() : -1
    if (month !== prevMonth) monthLabels.push({ wi, label: MONTHS[month] })
  })

  return (
    <div style={{ minHeight:"100vh", background:C.bg }}>
      <Head><title>Study Heatmap — GRADSKOOL</title></Head>
      <div style={{ height:"52px", background:C.white, borderBottom:"1px solid "+C.border, display:"flex", alignItems:"center", padding:"0 1.5rem", gap:"1rem" }}>
        <Link href="/dashboard?tab=progress" style={{ fontFamily:"var(--font-sans)", fontSize:"0.75rem", color:C.gray, textDecoration:"none" }}>← Dashboard</Link>
        <span style={{ color:C.border }}>|</span>
        <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.82rem", fontWeight:"700", color:C.black }}>Study Heatmap</span>
      </div>

      <div style={{ maxWidth:"960px", margin:"0 auto", padding:"2rem" }}>
        {/* Stats */}
        {stats && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(140px,1fr))", gap:"1rem", marginBottom:"2rem" }}>
            {[
              ["📅", stats.total_days || 0, "Active days"],
              ["⏱", Math.round((stats.total_minutes||0)/60)+"h", "Total study time"],
              ["📹", stats.total_videos||0, "Videos watched"],
              ["🔥", stats.longest_streak||0, "Longest streak"],
            ].map(([icon,val,label]) => (
              <div key={label} style={{ background:C.white, border:"1px solid "+C.border, borderRadius:"8px", padding:"1.25rem", textAlign:"center" }}>
                <p style={{ fontSize:"1.25rem", marginBottom:"0.375rem" }}>{icon}</p>
                <p style={{ fontFamily:"Georgia,serif", fontSize:"1.5rem", fontWeight:"700", color:C.black, lineHeight:1, marginBottom:"0.2rem" }}>{val}</p>
                <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.65rem", color:C.gray }}>{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Heatmap */}
        <div style={{ background:C.white, border:"1px solid "+C.border, borderRadius:"8px", padding:"1.5rem" }}>
          <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.65rem", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.1em", color:C.gray, marginBottom:"1.25rem" }}>
            Study activity — last 12 months
          </p>

          {loading ? (
            <p style={{ fontFamily:"Georgia,serif", color:C.gray, textAlign:"center", padding:"2rem" }}>Loading…</p>
          ) : (
            <div style={{ overflowX:"auto" }}>
              <div style={{ display:"flex", gap:"3px", minWidth:"fit-content" }}>
                {/* Day labels */}
                <div style={{ display:"flex", flexDirection:"column", gap:"3px", marginTop:"24px", marginRight:"4px" }}>
                  {DAYS.map((d, i) => (
                    <div key={i} style={{ height:"14px", fontFamily:"var(--font-sans)", fontSize:"0.55rem", color:C.gray, display:"flex", alignItems:"center" }}>{d}</div>
                  ))}
                </div>

                {/* Grid */}
                <div>
                  {/* Month labels */}
                  <div style={{ display:"flex", gap:"3px", marginBottom:"4px", position:"relative", height:"16px" }}>
                    {weeks.map((_, wi) => {
                      const ml = monthLabels.find(m => m.wi === wi)
                      return (
                        <div key={wi} style={{ width:"14px", fontFamily:"var(--font-sans)", fontSize:"0.55rem", color:C.gray, whiteSpace:"nowrap" }}>
                          {ml ? ml.label : ""}
                        </div>
                      )
                    })}
                  </div>
                  {/* Cells */}
                  <div style={{ display:"flex", gap:"3px" }}>
                    {weeks.map((week, wi) => (
                      <div key={wi} style={{ display:"flex", flexDirection:"column", gap:"3px" }}>
                        {week.map((day, di) => {
                          const d = data[day]
                          const isFuture = new Date(day) > today
                          return (
                            <div key={di}
                              style={{ width:"14px", height:"14px", borderRadius:"2px", background:isFuture?"transparent":getColor(d?.minutes||0), cursor:d?"pointer":"default" }}
                              title={d ? `${day}: ${d.minutes}min, ${d.videos} videos` : day}
                              onMouseEnter={e => { if(d) setTip({ day, ...d, x: e.clientX, y: e.clientY }) }}
                              onMouseLeave={() => setTip(null)}
                            />
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div style={{ display:"flex", alignItems:"center", gap:"6px", marginTop:"1rem" }}>
                <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.62rem", color:C.gray }}>Less</span>
                {["#ebedf0","#9be9a8","#40c463","#30a14e","#216e39"].map(c => (
                  <div key={c} style={{ width:"12px", height:"12px", borderRadius:"2px", background:c }} />
                ))}
                <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.62rem", color:C.gray }}>More</span>
              </div>
            </div>
          )}
        </div>

        {/* Compare with cohort link */}
        <div style={{ marginTop:"1.5rem", display:"flex", gap:"1rem" }}>
          <Link href="/dashboard/cohort" style={{ padding:"0.625rem 1.25rem", background:C.white, border:"1px solid "+C.border, borderRadius:"6px", fontFamily:"var(--font-sans)", fontSize:"0.82rem", textDecoration:"none", color:C.black }}>
            📊 Compare with cohort →
          </Link>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{ position:"fixed", top:tooltip.y-80, left:tooltip.x-60, background:C.black, color:"#fff", padding:"8px 12px", borderRadius:"6px", fontFamily:"var(--font-sans)", fontSize:"0.72rem", pointerEvents:"none", zIndex:999 }}>
          <p style={{ fontWeight:"700", marginBottom:"2px" }}>{tooltip.day}</p>
          <p>{tooltip.minutes} min studied</p>
          <p>{tooltip.videos} videos · {tooltip.quizzes} quizzes</p>
        </div>
      )}
    </div>
  )
}

/**
 * GRADSKOOL — Progress (Improved)
 * Route: /dashboard/progress
 * Section completion bars, quiz score trend, weekly study time
 */
import { useState, useEffect, useRef } from "react"
import Head from "next/head"
import Link from "next/link"
import { ProtectedRoute } from "../../components/auth/ProtectedRoute"
import { useAuth } from "../../hooks/useAuth"
import api from "../../lib/api"

const C = { red:"#ff5e5f", black:"#0f0f0f", white:"#fff", bg:"#f7f6f3", border:"#e8e8e6", gray:"#999", green:"#22c55e", amber:"#f59e0b", blue:"#3b82f6", muted:"#f4f3f0" }

export default function Progress() { return <ProtectedRoute><Inner /></ProtectedRoute> }

function Inner() {
  const { user } = useAuth()
  const exam = user?.target_exam || "cat"
  const [data,    setData]    = useState(null)
  const [gam,     setGam]     = useState(null)
  const [loading, setLoad]    = useState(true)
  const scoreChartRef = useRef(null)
  const timeChartRef  = useRef(null)
  const scoreInst = useRef(null)
  const timeInst  = useRef(null)

  useEffect(() => {
    setLoad(true)
    Promise.all([
      api.get("/learn/progress-detail/?exam=" + exam),
      api.get("/learn/gamification/?exam=" + exam),
    ]).then(([p, g]) => {
      setData(p.data)
      setGam(g.data)
    }).catch(() => {
      setData(DEMO)
      setGam({ xp:1240, streak:5, level:3, xp_to_next:260 })
    }).finally(() => setLoad(false))
  }, [exam])

  // Draw score trend chart
  useEffect(() => {
    if (!data?.score_trend?.length || !scoreChartRef.current) return
    if (typeof window === "undefined" || !window.Chart) return
    if (scoreInst.current) { scoreInst.current.destroy(); scoreInst.current = null }
    scoreInst.current = new window.Chart(scoreChartRef.current, {
      type: "line",
      data: {
        labels: data.score_trend.map(s => s.date),
        datasets: [{
          label: "Quiz score %", data: data.score_trend.map(s => s.score_pct),
          borderColor: C.red, backgroundColor: "rgba(255,94,95,0.08)",
          tension: 0.3, fill: true, pointRadius: 4,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display:false }, ticks:{ font:{ size:11 } } },
          y: { min:0, max:100, grid:{ color:"rgba(0,0,0,0.04)" }, ticks:{ font:{ size:11 }, callback: v => v+"%" } },
        },
      },
    })
  }, [data])

  // Draw weekly time chart
  useEffect(() => {
    if (!data?.weekly_time?.length || !timeChartRef.current) return
    if (typeof window === "undefined" || !window.Chart) return
    if (timeInst.current) { timeInst.current.destroy(); timeInst.current = null }
    timeInst.current = new window.Chart(timeChartRef.current, {
      type: "bar",
      data: {
        labels: data.weekly_time.map(w => w.label),
        datasets: [{
          label: "Study minutes", data: data.weekly_time.map(w => w.minutes),
          backgroundColor: C.blue + "88", borderRadius: 4,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid:{ display:false }, ticks:{ font:{ size:11 } } },
          y: { grid:{ color:"rgba(0,0,0,0.04)" }, ticks:{ font:{ size:11 }, callback: v => v+"m" } },
        },
      },
    })
  }, [data])

  const xpPct = gam ? Math.round(((500 - gam.xp_to_next) / 500) * 100) : 0

  return (
    <div style={{ minHeight:"100vh", background:C.bg }}>
      <Head><title>Progress — GRADSKOOL</title></Head>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js" async />

      <div style={{ height:"52px", background:C.white, borderBottom:"1px solid "+C.border, display:"flex", alignItems:"center", padding:"0 1.5rem", gap:"1rem" }}>
        <Link href="/dashboard?tab=progress" style={{ fontFamily:"var(--font-sans)", fontSize:"0.75rem", color:C.gray, textDecoration:"none" }}>← Dashboard</Link>
        <span style={{ color:C.border }}>|</span>
        <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.82rem", fontWeight:"700", color:C.black }}>Progress Report</span>
        <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.68rem", color:C.gray, background:C.muted, padding:"0.1rem 0.5rem", borderRadius:"100px" }}>{exam.toUpperCase()}</span>
        <div style={{ marginLeft:"auto" }}>
          <Link href="/dashboard/mock-scores" style={{ fontFamily:"var(--font-sans)", fontSize:"0.75rem", color:C.red, textDecoration:"none", fontWeight:"700" }}>
            📊 Mock Scores →
          </Link>
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign:"center", fontFamily:"Georgia,serif", color:C.gray, padding:"4rem" }}>Loading progress…</p>
      ) : (
        <div style={{ maxWidth:"900px", margin:"0 auto", padding:"2rem" }}>

          {/* XP + Streak */}
          {gam && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px,1fr))", gap:"1rem", marginBottom:"1.5rem" }}>
              <div style={{ background:C.white, border:"1px solid "+C.border, borderRadius:"8px", padding:"1.25rem" }}>
                <div style={{ display:"flex", alignItems:"baseline", gap:"0.5rem", marginBottom:"0.625rem" }}>
                  <span style={{ fontFamily:"Georgia,serif", fontSize:"2rem", fontWeight:"700", color:C.amber }}>⚡{gam.xp}</span>
                  <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.75rem", color:C.gray }}>Level {gam.level}</span>
                </div>
                <div style={{ height:"6px", background:C.muted, borderRadius:"100px", overflow:"hidden", marginBottom:"0.375rem" }}>
                  <div style={{ height:"100%", width:xpPct+"%", background:"linear-gradient(to right, #f59e0b, #f97316)", borderRadius:"100px" }} />
                </div>
                <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.65rem", color:C.gray }}>{gam.xp_to_next} XP to Level {gam.level+1}</p>
              </div>
              <div style={{ background:C.white, border:"1px solid "+C.border, borderRadius:"8px", padding:"1.25rem" }}>
                <span style={{ fontFamily:"Georgia,serif", fontSize:"2rem", fontWeight:"700", color:"#f97316" }}>🔥{gam.streak}</span>
                <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.72rem", color:C.gray, marginTop:"0.375rem" }}>day streak</p>
              </div>
              {data?.stats && (
                <>
                  <div style={{ background:C.white, border:"1px solid "+C.border, borderRadius:"8px", padding:"1.25rem", textAlign:"center" }}>
                    <p style={{ fontFamily:"Georgia,serif", fontSize:"2rem", fontWeight:"700", color:C.blue, lineHeight:1 }}>{data.stats.total_videos}</p>
                    <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.65rem", color:C.gray }}>Videos completed</p>
                  </div>
                  <div style={{ background:C.white, border:"1px solid "+C.border, borderRadius:"8px", padding:"1.25rem", textAlign:"center" }}>
                    <p style={{ fontFamily:"Georgia,serif", fontSize:"2rem", fontWeight:"700", color:C.green, lineHeight:1 }}>{data.stats.avg_quiz_score}%</p>
                    <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.65rem", color:C.gray }}>Avg quiz score</p>
                  </div>
                  <div style={{ background:C.white, border:"1px solid "+C.border, borderRadius:"8px", padding:"1.25rem", textAlign:"center" }}>
                    <p style={{ fontFamily:"Georgia,serif", fontSize:"2rem", fontWeight:"700", color:C.purple||C.red, lineHeight:1 }}>{data.stats.total_hours}h</p>
                    <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.65rem", color:C.gray }}>Total study time</p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Section completion */}
          {data?.sections?.length > 0 && (
            <div style={{ background:C.white, border:"1px solid "+C.border, borderRadius:"8px", padding:"1.25rem", marginBottom:"1.5rem" }}>
              <p style={sLabel}>Section Completion</p>
              <div style={{ display:"flex", flexDirection:"column", gap:"0.875rem", marginTop:"1rem" }}>
                {data.sections.map(sec => (
                  <div key={sec.section}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"0.35rem" }}>
                      <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.82rem", fontWeight:"600", color:C.black }}>{sec.section}</span>
                      <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.75rem", fontWeight:"700", color:sec.pct >= 80 ? C.green : sec.pct >= 40 ? C.amber : C.red }}>
                        {sec.done}/{sec.total} · {sec.pct}%
                      </span>
                    </div>
                    <div style={{ height:"8px", background:C.muted, borderRadius:"100px", overflow:"hidden" }}>
                      <div style={{ height:"100%", width:sec.pct+"%", background:sec.pct>=80?C.green:sec.pct>=40?C.amber:C.red, borderRadius:"100px", transition:"width 0.6s" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Charts row */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(300px,1fr))", gap:"1.5rem", marginBottom:"1.5rem" }}>
            {/* Quiz score trend */}
            <div style={{ background:C.white, border:"1px solid "+C.border, borderRadius:"8px", padding:"1.25rem" }}>
              <p style={sLabel}>Quiz Score Trend</p>
              {data?.score_trend?.length >= 2 ? (
                <div style={{ position:"relative", height:"180px", marginTop:"0.75rem" }}>
                  <canvas ref={scoreChartRef} />
                </div>
              ) : (
                <p style={{ fontFamily:"Georgia,serif", fontSize:"0.82rem", color:C.gray, textAlign:"center", padding:"2rem 0" }}>
                  Complete more quizzes to see your score trend.
                </p>
              )}
            </div>

            {/* Weekly study time */}
            <div style={{ background:C.white, border:"1px solid "+C.border, borderRadius:"8px", padding:"1.25rem" }}>
              <p style={sLabel}>Weekly Study Time</p>
              {data?.weekly_time?.some(w => w.minutes > 0) ? (
                <div style={{ position:"relative", height:"180px", marginTop:"0.75rem" }}>
                  <canvas ref={timeChartRef} />
                </div>
              ) : (
                <p style={{ fontFamily:"Georgia,serif", fontSize:"0.82rem", color:C.gray, textAlign:"center", padding:"2rem 0" }}>
                  Study sessions will appear here as you use the platform.
                </p>
              )}
            </div>
          </div>

          {/* Link to mock tracker */}
          <div style={{ background:C.black, borderRadius:"8px", padding:"1.25rem", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"1rem" }}>
            <div>
              <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.875rem", fontWeight:"700", color:"#fff", marginBottom:"0.2rem" }}>Track your mock test scores</p>
              <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.72rem", color:"rgba(255,255,255,0.5)" }}>Log every mock, see your trend, identify weak sections.</p>
            </div>
            <Link href="/dashboard/mock-scores"
              style={{ fontFamily:"var(--font-sans)", fontSize:"0.82rem", fontWeight:"700", padding:"0.625rem 1.25rem", background:C.red, color:"#fff", borderRadius:"4px", textDecoration:"none", flexShrink:0 }}>
              Open Mock Tracker →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

const sLabel = { fontFamily:"var(--font-sans)", fontSize:"0.65rem", fontWeight:"700", letterSpacing:"0.1em", textTransform:"uppercase", color:"#999" }

const DEMO = {
  sections: [
    { section:"VARC", total:8, done:5, pct:63 },
    { section:"DILR", total:6, done:2, pct:33 },
    { section:"QA",   total:10, done:3, pct:30 },
  ],
  score_trend: [
    { date:"May 1", score_pct:42 }, { date:"May 5", score_pct:55 }, { date:"May 9", score_pct:48 },
    { date:"May 13", score_pct:61 }, { date:"May 17", score_pct:58 }, { date:"May 21", score_pct:72 },
    { date:"May 25", score_pct:68 },
  ],
  weekly_time: [
    { week:"W1", label:"Apr 28", minutes:90 }, { week:"W2", label:"May 5", minutes:145 },
    { week:"W3", label:"May 12", minutes:210 }, { week:"W4", label:"May 19", minutes:175 },
    { week:"W5", label:"May 26", minutes:240 },
  ],
  stats: { total_videos:24, avg_quiz_score:61.5, total_hours:14.2 },
}

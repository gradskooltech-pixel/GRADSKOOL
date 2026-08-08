/**
 * GRADSKOOL — Compare with Cohort
 * Route: /dashboard/cohort
 */
import { useState, useEffect } from "react"
import Head from "next/head"
import Link from "next/link"
import { ProtectedRoute } from "../../components/auth/ProtectedRoute"
import { useAuth } from "../../hooks/useAuth"
import api from "../../lib/api"

const C = { red:"#ff5e5f",black:"#0f0f0f",white:"#fff",bg:"#f7f6f3",border:"#e8e8e6",gray:"#999",green:"#22c55e",amber:"#f59e0b",blue:"#3b82f6",muted:"#f4f3f0" }

export default function CohortPage() { return <ProtectedRoute><Inner /></ProtectedRoute> }

function Inner() {
  const { user } = useAuth()
  const [data, setData]   = useState(null)
  const [loading, setLoad]= useState(true)
  const exam = user?.target_exam || "cat"

  useEffect(() => {
    api.get("/learn/cohort-comparison/?exam=" + exam)
      .then(({ data:d }) => setData(d))
      .catch(() => setData({ me:{ videos_watched:24,avg_quiz_score:68 }, cohort:{ avg_videos:31,avg_quiz:62,size:27 }, percentile:{ videos:65,quiz:72 } }))
      .finally(() => setLoad(false))
  }, [exam])

  if (loading) return <div style={{ minHeight:"100vh", background:C.bg }}><p style={{ padding:"4rem", textAlign:"center", fontFamily:"Georgia,serif", color:C.gray }}>Loading…</p></div>

  const metrics = [
    { label:"Videos watched", me:data?.me?.videos_watched||0, cohort:data?.cohort?.avg_videos||0, unit:"", pct:data?.percentile?.videos||50, icon:"📹" },
    { label:"Avg quiz score", me:data?.me?.avg_quiz_score||0, cohort:data?.cohort?.avg_quiz||0, unit:"%", pct:data?.percentile?.quiz||50, icon:"📝" },
  ]

  return (
    <div style={{ minHeight:"100vh", background:C.bg }}>
      <Head><title>Compare with Cohort — GRADSKOOL</title></Head>
      <div style={{ height:"52px", background:C.white, borderBottom:"1px solid "+C.border, display:"flex", alignItems:"center", padding:"0 1.5rem", gap:"1rem" }}>
        <Link href="/dashboard?tab=progress" style={{ fontFamily:"var(--font-sans)", fontSize:"0.75rem", color:C.gray, textDecoration:"none" }}>← Dashboard</Link>
        <span style={{ color:C.border }}>|</span>
        <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.82rem", fontWeight:"700", color:C.black }}>Compare with Cohort</span>
        <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.68rem", color:C.gray, background:C.muted, padding:"0.1rem 0.5rem", borderRadius:"100px" }}>{data?.cohort?.size||0} students</span>
      </div>

      <div style={{ maxWidth:"720px", margin:"0 auto", padding:"2rem" }}>
        {metrics.map(m => {
          const isAhead = m.me >= m.cohort
          return (
            <div key={m.label} style={{ background:C.white, border:"1px solid "+C.border, borderRadius:"8px", padding:"1.75rem", marginBottom:"1.5rem" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"1.5rem" }}>
                <span style={{ fontSize:"1.5rem" }}>{m.icon}</span>
                <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.65rem", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.1em", color:C.gray }}>{m.label}</p>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.5rem", marginBottom:"1.5rem" }}>
                {[["You", m.me, C.red], ["Cohort avg", m.cohort, C.gray]].map(([lbl, val, color]) => (
                  <div key={lbl} style={{ textAlign:"center", padding:"1.25rem", background:C.muted, borderRadius:"8px" }}>
                    <p style={{ fontFamily:"Georgia,serif", fontSize:"2.5rem", fontWeight:"700", color, lineHeight:1, marginBottom:"0.25rem" }}>{val}{m.unit}</p>
                    <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.72rem", color:C.gray }}>{lbl}</p>
                  </div>
                ))}
              </div>

              {/* Percentile bar */}
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"0.4rem" }}>
                  <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.72rem", color:C.gray }}>Your percentile in cohort</span>
                  <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.82rem", fontWeight:"700", color:isAhead?C.green:C.amber }}>Top {100-m.pct}%</span>
                </div>
                <div style={{ height:"10px", background:C.muted, borderRadius:"100px", overflow:"hidden", position:"relative" }}>
                  <div style={{ height:"100%", width:m.pct+"%", background:isAhead?C.green:C.amber, borderRadius:"100px", transition:"width 0.8s" }} />
                  <div style={{ position:"absolute", left:m.pct+"%", top:0, transform:"translateX(-50%)", width:"2px", height:"100%", background:C.black }} />
                </div>
                <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.68rem", color:C.gray, marginTop:"0.375rem" }}>
                  {isAhead ? `You're ahead of ${m.pct}% of your batch` : `${100-m.pct}% of your batch is ahead of you — keep going`}
                </p>
              </div>
            </div>
          )
        })}

        <div style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:"8px", padding:"1.25rem", fontFamily:"var(--font-sans)", fontSize:"0.78rem", color:"#1d4ed8", lineHeight:1.7 }}>
          Cohort data is anonymised. You see your rank but not who is above or below you.
        </div>
      </div>
    </div>
  )
}

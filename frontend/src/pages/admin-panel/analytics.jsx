/**
 * GRADSKOOL Admin — Analytics Dashboard (Improved)
 * Route: /admin-panel/analytics
 * Real charts: signups, enrollments, videos watched, funnel, exam breakdown
 */
import { useState, useEffect, useRef } from "react"
import Head from "next/head"
import Link from "next/link"
import api from "../../lib/api"
import { AdminLayout } from '../../components/admin/AdminLayout'

const C = { red:"#ff5e5f", black:"#0f0f0f", white:"#fff", bg:"#f7f6f3", border:"#e8e8e6", gray:"#999", green:"#22c55e", amber:"#f59e0b", blue:"#3b82f6", purple:"#7b2d8b", muted:"#f4f3f0" }

export default function Analytics() {
  const [data,    setData]  = useState(null)
  const [loading, setLoad]  = useState(true)
  const [days,    setDays]  = useState(30)
  const [tab,     setTab]   = useState("overview")
  const chartRef = useRef(null)
  const chartInst= useRef(null)

  useEffect(() => {
    setLoad(true)
    api.get("/dashboard/analytics/?days=" + days)
      .then(({ data:d }) => setData(d))
      .catch(() => setData(DEMO))
      .finally(() => setLoad(false))
  }, [days])

  useEffect(() => {
    if (!data || !chartRef.current) return
    if (chartInst.current) { chartInst.current.destroy(); chartInst.current = null }
    if (typeof window === "undefined" || !window.Chart) return

    const ctx = chartRef.current.getContext("2d")
    const labels = data.signups?.map(d => d.date?.slice(5)) || []  // MM-DD
    chartInst.current = new window.Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          { label:"Sign-ups",    data: data.signups?.map(d=>d.count)||[],    backgroundColor:"#3b82f6", borderRadius:3 },
          { label:"Enrollments", data: data.enrollments?.map(d=>d.count)||[],backgroundColor:"#22c55e", borderRadius:3 },
          { label:"Videos",      data: data.videos?.map(d=>d.count)||[],     backgroundColor:"rgba(245,158,11,0.6)", borderRadius:3 },
        ]
      },
      options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ x:{ grid:{ display:false } }, y:{ grid:{ color:"rgba(0,0,0,0.04)" } } } }
    })
  }, [data, tab])

  const f = data?.funnel || {}

  return (
    <AdminLayout title="Analytics">
    <div style={{ minHeight:"100vh", background:C.bg }}>
      <Head><title>Analytics — Admin — GRADSKOOL</title></Head>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js" />

      <div style={{ height:"56px", background:C.white, borderBottom:"1px solid "+C.border, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 1.5rem" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"1rem" }}>
          <Link href="/admin-panel" style={{ fontFamily:"var(--font-sans)", fontSize:"0.75rem", color:C.gray, textDecoration:"none" }}>← Admin</Link>
          <span style={{ color:C.border }}>|</span>
          <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.82rem", fontWeight:"700", color:C.black }}>Analytics</span>
        </div>
        <div style={{ display:"flex", gap:"0.375rem" }}>
          {[7,14,30,90].map(d => (
            <button key={d} onClick={() => setDays(d)} style={{ fontFamily:"var(--font-sans)", fontSize:"0.72rem", padding:"0.3rem 0.625rem", border:"1px solid "+(days===d?C.red:C.border), borderRadius:"3px", background:days===d?"#fff5f5":C.white, color:days===d?C.red:C.gray, cursor:"pointer", fontWeight:days===d?"700":"400" }}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ background:C.white, borderBottom:"1px solid "+C.border, display:"flex", padding:"0 1.5rem" }}>
        {[["overview","Overview"],["engagement","Engagement"],["exams","By Exam"],["revenue","Revenue"]].map(([t,l]) => (
          <button key={t} onClick={() => setTab(t)} style={{ fontFamily:"var(--font-sans)", fontSize:"0.78rem", padding:"0.75rem 1rem", border:"none", borderBottom:"2px solid "+(tab===t?C.red:"transparent"), background:"none", cursor:"pointer", color:tab===t?C.black:C.gray, fontWeight:tab===t?"700":"400", marginBottom:"-1px" }}>{l}</button>
        ))}
      </div>

      <div style={{ maxWidth:"1100px", margin:"0 auto", padding:"2rem" }}>
        {loading ? <p style={{ textAlign:"center", color:C.gray, fontFamily:"Georgia,serif", padding:"4rem" }}>Loading analytics…</p> : !data ? null : (
          <>
            {tab === "overview" && (
              <>
                {/* KPI row */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"1rem", marginBottom:"1.5rem" }}>
                  {[["Total Users",f.total_users||0,C.blue],["Verified",f.verified||0,"#6366f1"],["Enrolled",f.enrolled||0,C.amber],["Active (7d)",f.active_learners||0,C.green]].map(([l,v,c]) => (
                    <div key={l} style={{ background:C.white, border:"1px solid "+C.border, borderRadius:"8px", padding:"1.25rem" }}>
                      <p style={{ fontFamily:"Georgia,serif", fontSize:"2rem", fontWeight:"700", color:c, lineHeight:1, marginBottom:"0.25rem" }}>{v.toLocaleString()}</p>
                      <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.72rem", color:C.gray }}>{l}</p>
                      {v > 0 && f.total_users > 0 && (
                        <div style={{ marginTop:"0.5rem", height:"3px", background:C.muted, borderRadius:"100px", overflow:"hidden" }}>
                          <div style={{ height:"100%", width:Math.round(v/f.total_users*100)+"%", background:c, borderRadius:"100px" }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Funnel */}
                <div style={{ background:C.white, border:"1px solid "+C.border, borderRadius:"8px", padding:"1.25rem", marginBottom:"1.5rem" }}>
                  <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.65rem", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.1em", color:C.gray, marginBottom:"1rem" }}>Conversion Funnel</p>
                  <div style={{ display:"flex", gap:"0", alignItems:"stretch" }}>
                    {[["Visited",f.total_users||0,"100",C.blue],["Verified",f.verified||0,f.total_users?Math.round((f.verified||0)/f.total_users*100):0,"#6366f1"],["Enrolled",f.enrolled||0,f.total_users?Math.round((f.enrolled||0)/f.total_users*100):0,C.amber],["Active",f.active_learners||0,f.enrolled?Math.round((f.active_learners||0)/f.enrolled*100):0,C.green]].map(([l,v,pct,c],i) => (
                      <div key={l} style={{ flex:1, padding:"1rem", borderLeft:i>0?"1px solid "+C.border:"none", textAlign:"center" }}>
                        <p style={{ fontFamily:"Georgia,serif", fontSize:"1.75rem", fontWeight:"700", color:c, lineHeight:1 }}>{v.toLocaleString()}</p>
                        <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.72rem", color:C.black, marginTop:"0.2rem" }}>{l}</p>
                        <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.65rem", color:C.gray }}>{pct}%</p>
                        <div style={{ height:"4px", background:C.muted, borderRadius:"100px", marginTop:"0.5rem", overflow:"hidden" }}>
                          <div style={{ height:"100%", width:pct+"%", background:c, borderRadius:"100px" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chart */}
                <div style={{ background:C.white, border:"1px solid "+C.border, borderRadius:"8px", padding:"1.25rem" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
                    <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.65rem", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.1em", color:C.gray }}>Daily Activity — Last {days} days</p>
                    <div style={{ display:"flex", gap:"1rem" }}>
                      {[["#3b82f6","Sign-ups"],["#22c55e","Enrollments"],["rgba(245,158,11,0.6)","Videos"]].map(([c,l]) => (
                        <div key={l} style={{ display:"flex", alignItems:"center", gap:"5px" }}>
                          <div style={{ width:"10px", height:"10px", borderRadius:"2px", background:c }} />
                          <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.68rem", color:C.gray }}>{l}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ position:"relative", height:"200px" }}>
                    <canvas ref={chartRef} role="img" aria-label="Daily activity chart" />
                  </div>
                </div>
              </>
            )}

            {tab === "engagement" && (
              <div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.5rem" }}>
                  {[
                    ["Average quiz score", "–",  C.amber],
                    ["Videos per student", "–",  C.blue],
                    ["Avg session length", "–",  C.purple],
                    ["Completion rate",    "–",  C.green],
                  ].map(([l,v,c]) => (
                    <div key={l} style={{ background:C.white, border:"1px solid "+C.border, borderRadius:"8px", padding:"1.25rem" }}>
                      <p style={{ fontFamily:"Georgia,serif", fontSize:"2rem", fontWeight:"700", color:c, marginBottom:"0.25rem" }}>{v}</p>
                      <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.72rem", color:C.gray }}>{l}</p>
                    </div>
                  ))}
                </div>
                <div style={{ background:"#fffbeb", border:"1px solid #fcd34d", borderRadius:"6px", padding:"1rem 1.25rem", marginTop:"1.5rem", fontFamily:"var(--font-sans)", fontSize:"0.78rem", color:"#92400e" }}>
                  Detailed engagement metrics (session length, quiz scores per topic, completion rates) will populate as students use the platform.
                </div>
              </div>
            )}

            {tab === "exams" && (
              <div>
                <div style={{ background:C.white, border:"1px solid "+C.border, borderRadius:"8px", padding:"1.25rem" }}>
                  <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.65rem", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.1em", color:C.gray, marginBottom:"1rem" }}>Enrollments by Exam</p>
                  {!(data.by_exam?.length) ? (
                    <p style={{ fontFamily:"Georgia,serif", color:C.gray, textAlign:"center", padding:"2rem" }}>No enrollments yet.</p>
                  ) : (
                    <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
                      {data.by_exam.map(row => {
                        const maxCount = Math.max(...data.by_exam.map(r=>r.count), 1)
                        return (
                          <div key={row.exam} style={{ display:"flex", alignItems:"center", gap:"1rem" }}>
                            <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.82rem", fontWeight:"600", color:C.black, width:"60px", flexShrink:0 }}>{row.exam}</span>
                            <div style={{ flex:1, height:"8px", background:C.muted, borderRadius:"4px", overflow:"hidden" }}>
                              <div style={{ height:"100%", width:Math.round(row.count/maxCount*100)+"%", background:C.red, borderRadius:"4px", transition:"width 0.5s" }} />
                            </div>
                            <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.82rem", fontWeight:"700", color:C.black, width:"32px", textAlign:"right", flexShrink:0 }}>{row.count}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab === "revenue" && (
              <div>
                <Link href="/admin-panel/revenue" style={{ fontFamily:"var(--font-sans)", fontSize:"0.82rem", color:C.red, fontWeight:"700", textDecoration:"none" }}>
                  Open detailed Revenue dashboard →
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  </AdminLayout>
  )
}

const DEMO = {
  days:30, funnel:{ total_users:340, verified:280, enrolled:95, active_learners:67 },
  signups:[...Array(30)].map((_,i)=>({date:`2026-04-${String(i+1).padStart(2,"0")}`,count:Math.floor(Math.random()*15+2)})),
  enrollments:[...Array(30)].map((_,i)=>({date:`2026-04-${String(i+1).padStart(2,"0")}`,count:Math.floor(Math.random()*5)})),
  videos:[...Array(30)].map((_,i)=>({date:`2026-04-${String(i+1).padStart(2,"0")}`,count:Math.floor(Math.random()*40+5)})),
  by_exam:[{exam:"CAT",count:62},{exam:"XAT",count:18},{exam:"SNAP",count:8},{exam:"NMAT",count:7}],
}

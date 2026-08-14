/**
 * GRADSKOOL Admin — Drop-off Heatmap
 * Route: /admin-panel/dropoff
 * Which videos lose viewers at which point + quartile funnel
 */
import { useState, useEffect } from "react"
import Head from "next/head"
import Link from "next/link"
import api from "../../lib/api"
import { AdminLayout } from '../../components/admin/AdminLayout'

const C = { red:"#ff5e5f",black:"#0f0f0f",white:"#fff",bg:"#f7f6f3",border:"#e8e8e6",gray:"#999",green:"#22c55e",amber:"#f59e0b",blue:"#3b82f6",muted:"#f4f3f0" }

function DropoffInner() {
  const [videos, setVideos] = useState([])
  const [exam,   setExam]   = useState("cat")
  const [loading,setLoad]      = useState(true)
  const [sectionFilter,setSection] = useState('all')

  useEffect(() => {
    setLoad(true)
    api.get("/learn/admin/dropoff-heatmap/?exam=" + exam)
      .then(({ data }) => setVideos(data.videos || []))
      .catch(() => setVideos(DEMO))
      .finally(() => setLoad(false))
  }, [exam])

  return (
    <div style={{ minHeight:"100vh", background:C.bg }}>
      <Head><title>Drop-off Heatmap — Admin — GRADSKOOL</title></Head>
      <div style={{ height:"56px", background:C.white, borderBottom:"1px solid "+C.border, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 1.5rem" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"1rem" }}>
          <Link href="/admin-panel" style={{ fontFamily:"var(--font-sans)", fontSize:"0.75rem", color:C.gray, textDecoration:"none" }}>← Admin</Link>
          <span style={{ color:C.border }}>|</span>
          <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.82rem", fontWeight:"700", color:C.black }}>Drop-off Heatmap</span>
        </div>
        <select value={exam} onChange={e=>setExam(e.target.value)} style={{ fontFamily:"var(--font-sans)", fontSize:"0.78rem", padding:"0.35rem 0.625rem", border:"1px solid "+C.border, borderRadius:"4px", background:C.white, cursor:"pointer" }}>
          {["cat","xat","snap","nmat","gmat","gre"].map(e=><option key={e} value={e}>{e.toUpperCase()}</option>)}
        </select>
      </div>

      <div style={{ maxWidth:"900px", margin:"0 auto", padding:"2rem" }}>
        <div style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:"6px", padding:"0.875rem 1.25rem", marginBottom:"1.5rem", fontFamily:"var(--font-sans)", fontSize:"0.78rem", color:"#1d4ed8" }}>
          Each bar shows what % of viewers reached that point in the video. A big drop between bars means students are quitting at that section.
        </div>

        {loading ? <p style={{ textAlign:"center", fontFamily:"Georgia,serif", color:C.gray, padding:"4rem" }}>Loading…</p>
        : !videos.length ? <p style={{ textAlign:"center", fontFamily:"Georgia,serif", color:C.gray, padding:"4rem" }}>No data yet — students need to start watching</p>
        : videos.filter(v => sectionFilter==='all'||v.section===sectionFilter).map(v => (
          <div key={v.id} style={{ background:C.white, border:"1px solid "+C.border, borderRadius:"8px", padding:"1.25rem", marginBottom:"1rem" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"1rem" }}>
              <div>
                <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.82rem", fontWeight:"600", color:C.black, marginBottom:"0.2rem" }}>{v.title}</p>
                <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.62rem", color:C.gray }}>{v.section} · {Math.floor(v.duration_secs/60)}min · {v.views} unique viewers</p>
              </div>
              <div style={{ textAlign:"right" }}>
                <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.68rem", color:C.gray }}>Avg reached</p>
                <p style={{ fontFamily:"Georgia,serif", fontSize:"1.1rem", fontWeight:"700", color:C.black }}>{Math.round(v.avg_watch/v.duration_secs*100)}%</p>
              </div>
            </div>

            {/* Funnel bars */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"0.75rem" }}>
              {[["25%","q25","First quarter"],["50%","q50","Halfway"],["75%","q75","Three quarters"],["100%","q100","Full video"]].map(([label,key,sub]) => {
                const pct = v.quartiles?.[key] || 0
                const drop = key==="q25" ? 100-pct : (v.quartiles?.[["q25","q50","q75","q100"][["q25","q50","q75","q100"].indexOf(key)-1]]||100) - pct
                const isBigDrop = drop > 20
                return (
                  <div key={key} style={{ textAlign:"center" }}>
                    <div style={{ height:"80px", background:C.muted, borderRadius:"6px 6px 0 0", display:"flex", flexDirection:"column", justifyContent:"flex-end", overflow:"hidden", position:"relative" }}>
                      <div style={{ width:"100%", height:pct+"%", background:isBigDrop?C.red:pct>=60?C.green:C.amber, borderRadius:"6px 6px 0 0", transition:"height 0.5s" }} />
                    </div>
                    <div style={{ borderTop:"2px solid "+C.border, padding:"0.5rem 0.25rem 0" }}>
                      <p style={{ fontFamily:"Georgia,serif", fontSize:"1.25rem", fontWeight:"700", color:isBigDrop?C.red:pct>=60?C.green:C.amber, lineHeight:1 }}>{pct}%</p>
                      <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.65rem", fontWeight:"700", color:C.gray }}>{label}</p>
                      <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.6rem", color:C.gray, lineHeight:1.3 }}>{sub}</p>
                      {isBigDrop && <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.58rem", color:C.red, fontWeight:"700", marginTop:"2px" }}>−{drop}% drop</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const DEMO = [
  { id:1, title:"RC Strategy — Introduction", section:"VARC", duration_secs:1320, views:24, avg_watch:924, quartiles:{q25:95,q50:88,q75:74,q100:61} },
  { id:2, title:"Percentages — All Concepts", section:"QA", duration_secs:2100, views:22, avg_watch:1050, quartiles:{q25:91,q50:75,q75:55,q100:40} },
  { id:3, title:"Seating Arrangement Tricks", section:"DILR", duration_secs:1800, views:19, avg_watch:1260, quartiles:{q25:89,q50:82,q75:71,q100:58} },
]


export default function Dropoff(props) {
  return (
    <AdminLayout title="Drop-off">
      <DropoffInner {...props} />
    </AdminLayout>
  )
}

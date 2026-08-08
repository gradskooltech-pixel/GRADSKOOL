/**
 * GRADSKOOL Admin — Results Wall Manager
 * Route: /admin-panel/results-wall
 */
import { useState, useEffect } from "react"
import Head from "next/head"
import Link from "next/link"
import api from "../../lib/api"

const C = { red:"#ff5e5f",black:"#0f0f0f",white:"#fff",bg:"#f7f6f3",border:"#e8e8e6",gray:"#999",green:"#22c55e",muted:"#f4f3f0" }
const EXAMS = ["cat","xat","snap","nmat","gmat","gre","ipmat","clat","cuet"]

export default function ResultsWallAdmin() {
  const [results, setResults] = useState([])
  const [modal,   setModal]   = useState(false)
  const [form,    setForm]    = useState({ exam:"cat", year:2025, is_verified:true })
  const [saving,  setSaving]  = useState(false)
  const [msg,     setMsg]     = useState(null)

  const load = () => api.get("/dashboard/results-wall/").then(({ data }) => setResults(data.results || [])).catch(()=>{})
  useEffect(load, [])

  const notify = (text, type="success") => { setMsg({type,text}); setTimeout(()=>setMsg(null),2500) }

  const save = async () => {
    if (!form.name||!form.percentile) { notify("Name and percentile required","error"); return }
    setSaving(true)
    try { await api.post("/dashboard/results-wall/", form); notify("Result added"); setModal(false); setForm({exam:"cat",year:2025,is_verified:true}); load() }
    catch { notify("Failed","error") }
    finally { setSaving(false) }
  }

  const del = async (id) => {
    if (!confirm("Remove this result?")) return
    try { await api.delete("/dashboard/results-wall/"+id+"/"); notify("Removed"); load() }
    catch { notify("Failed","error") }
  }

  return (
    <div style={{ minHeight:"100vh", background:C.bg }}>
      <Head><title>Results Wall — Admin — GRADSKOOL</title></Head>
      <div style={{ height:"56px", background:C.white, borderBottom:"1px solid "+C.border, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 1.5rem" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"1rem" }}>
          <Link href="/admin-panel" style={{ fontFamily:"var(--font-sans)", fontSize:"0.75rem", color:C.gray, textDecoration:"none" }}>← Admin</Link>
          <span style={{ color:C.border }}>|</span>
          <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.82rem", fontWeight:"700", color:C.black }}>Results Wall</span>
        </div>
        <button onClick={()=>setModal(true)} style={{ padding:"0.4rem 1rem", background:C.red, color:"#fff", border:"none", borderRadius:"4px", fontFamily:"var(--font-sans)", fontSize:"0.78rem", fontWeight:"700", cursor:"pointer" }}>+ Add Result</button>
      </div>
      {msg && <div style={{ position:"fixed", top:"64px", right:"1.5rem", zIndex:999, padding:"0.75rem 1.25rem", borderRadius:"4px", fontFamily:"var(--font-sans)", fontSize:"0.82rem", background:msg.type==="error"?"#fee2e2":"#dcfce7", border:"1px solid "+(msg.type==="error"?"#fca5a5":"#86efac"), color:msg.type==="error"?"#991b1b":"#166534" }}>{msg.text}</div>}

      <div style={{ maxWidth:"900px", margin:"0 auto", padding:"2rem" }}>
        <div style={{ background:"#fffbeb", border:"1px solid #fcd34d", borderRadius:"6px", padding:"0.875rem 1.25rem", marginBottom:"1.5rem", fontFamily:"var(--font-sans)", fontSize:"0.78rem", color:"#92400e" }}>
          Results shown here appear on the public website at /results. Only add verified students with permission to showcase their result.
        </div>

        {results.map(r => (
          <div key={r.id} style={{ background:C.white, border:"1px solid "+C.border, borderRadius:"8px", padding:"1.25rem", marginBottom:"0.75rem", display:"flex", gap:"1.25rem", alignItems:"center" }}>
            <div style={{ width:"48px", height:"48px", borderRadius:"50%", background:C.red, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontFamily:"Georgia,serif", fontSize:"1.1rem", fontWeight:"700", flexShrink:0 }}>
              {r.name?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", marginBottom:"0.25rem" }}>
                <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.875rem", fontWeight:"700", color:C.black }}>{r.name}</p>
                <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.68rem", fontWeight:"700", color:C.green }}>✓ {r.percentile}%ile</span>
                <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.65rem", color:C.gray }}>{r.exam?.toUpperCase()} {r.year}</span>
              </div>
              {r.college_calls && <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.72rem", color:C.gray }}>{r.college_calls}</p>}
            </div>
            <button onClick={()=>del(r.id)} style={{ background:"none", border:"1px solid #fca5a5", padding:"0.25rem 0.5rem", borderRadius:"3px", cursor:"pointer", color:C.red, fontFamily:"var(--font-sans)", fontSize:"0.72rem" }}>Remove</button>
          </div>
        ))}
        {!results.length && (
          <div style={{ textAlign:"center", padding:"4rem", background:C.white, border:"1px dashed "+C.border, borderRadius:"8px" }}>
            <p style={{ fontSize:"2rem", marginBottom:"0.75rem" }}>🏆</p>
            <p style={{ fontFamily:"Georgia,serif", color:C.gray }}>No results added yet. Add your first success story.</p>
          </div>
        )}
      </div>

      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }} onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div style={{ background:C.white, borderRadius:"8px", width:"100%", maxWidth:"480px", padding:"2rem" }}>
            <p style={{ fontFamily:"Georgia,serif", fontSize:"1.25rem", fontWeight:"700", color:C.black, marginBottom:"1.5rem" }}>Add Student Result</p>
            <div style={{ display:"flex", flexDirection:"column", gap:"0.875rem" }}>
              {[["Name *","name","text"],["Percentile *","percentile","number"],["Score","score","text"],["College calls","college_calls","text"]].map(([l,k,t])=>(
                <div key={k}>
                  <label style={s.lbl}>{l}</label>
                  <input type={t} value={form[k]||""} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} style={s.inp} placeholder={k==="college_calls"?"e.g. IIM A, IIM B, XLRI":""} />
                </div>
              ))}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.75rem" }}>
                <div><label style={s.lbl}>Exam</label><select value={form.exam||"cat"} onChange={e=>setForm(f=>({...f,exam:e.target.value}))} style={s.inp}>{EXAMS.map(e=><option key={e} value={e}>{e.toUpperCase()}</option>)}</select></div>
                <div><label style={s.lbl}>Year</label><input type="number" value={form.year||2025} onChange={e=>setForm(f=>({...f,year:parseInt(e.target.value)}))} style={s.inp} /></div>
              </div>
              <div><label style={s.lbl}>Testimonial (optional)</label><textarea value={form.testimonial||""} onChange={e=>setForm(f=>({...f,testimonial:e.target.value}))} style={{...s.inp,height:"60px",resize:"vertical"}} placeholder="Their words about GRADSKOOL..." /></div>
            </div>
            <div style={{ display:"flex", justifyContent:"flex-end", gap:"0.75rem", marginTop:"1.5rem", paddingTop:"1rem", borderTop:"1px solid "+C.border }}>
              <button onClick={()=>setModal(false)} style={{ padding:"0.625rem 1.25rem", border:"1px solid "+C.border, borderRadius:"4px", background:C.white, fontFamily:"var(--font-sans)", fontSize:"0.82rem", cursor:"pointer" }}>Cancel</button>
              <button onClick={save} disabled={saving||!form.name||!form.percentile} style={{ padding:"0.625rem 1.5rem", background:saving?C.gray:C.red, color:"#fff", border:"none", borderRadius:"4px", fontFamily:"var(--font-sans)", fontSize:"0.82rem", fontWeight:"700", cursor:saving?"not-allowed":"pointer" }}>{saving?"Saving…":"Add Result"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
const s = { lbl:{ fontFamily:"var(--font-sans)",fontSize:"0.7rem",fontWeight:"700",color:"#666",display:"block",marginBottom:"0.25rem" }, inp:{ width:"100%",padding:"0.5rem 0.625rem",fontFamily:"var(--font-sans)",fontSize:"0.82rem",border:"1px solid #e8e8e6",borderRadius:"4px",outline:"none",color:"#0f0f0f",boxSizing:"border-box",background:"#fff" } }

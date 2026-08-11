/**
 * GRADSKOOL Admin — Results Wall Manager
 * Route: /admin-panel/results-wall
 *
 * Each result can now optionally have a full detail page (like a blog
 * post) — slug, interview video (YouTube or Bunny), write-up body text,
 * and SEO fields — shown publicly at /results/<slug>. Also added a
 * proper Edit flow (previously only Add + Delete existed).
 */
import { useState, useEffect } from "react"
import Head from "next/head"
import Link from "next/link"
import api from "../../lib/api"

const C = { red:"#ff5e5f",black:"#0f0f0f",white:"#fff",bg:"#f7f6f3",border:"#e8e8e6",gray:"#999",green:"#22c55e",muted:"#f4f3f0" }
const EXAMS = ["cat","xat","snap","nmat","gmat","gre","ipmat","clat","cuet"]
const VIDEO_TYPES = [["","None"],["youtube","YouTube"],["bunny","Bunny"]]

const EMPTY_FORM = { exam:"cat", year:2025, is_verified:true, is_featured:false, video_type:"" }

export default function ResultsWallAdmin() {
  const [results, setResults] = useState([])
  const [modal,   setModal]   = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form,    setForm]    = useState(EMPTY_FORM)
  const [saving,  setSaving]  = useState(false)
  const [msg,     setMsg]     = useState(null)

  const load = () => api.get("/dashboard/results-wall/").then(({ data }) => setResults(data.results || [])).catch(()=>{})
  useEffect(load, [])

  const notify = (text, type="success") => { setMsg({type,text}); setTimeout(()=>setMsg(null),2500) }

  const openAdd = () => { setEditingId(null); setForm(EMPTY_FORM); setModal(true) }
  const openEdit = (r) => { setEditingId(r.id); setForm({ ...r }); setModal(true) }

  const save = async () => {
    if (!form.name||!form.percentile) { notify("Name and percentile required","error"); return }
    setSaving(true)
    try {
      if (editingId) {
        await api.patch("/dashboard/results-wall/"+editingId+"/", form)
        notify("Result updated")
      } else {
        await api.post("/dashboard/results-wall/", form)
        notify("Result added")
      }
      setModal(false); setEditingId(null); setForm(EMPTY_FORM); load()
    }
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
        <button onClick={openAdd} style={{ padding:"0.4rem 1rem", background:C.red, color:"#fff", border:"none", borderRadius:"4px", fontFamily:"var(--font-sans)", fontSize:"0.78rem", fontWeight:"700", cursor:"pointer" }}>+ Add Result</button>
      </div>
      {msg && <div style={{ position:"fixed", top:"64px", right:"1.5rem", zIndex:999, padding:"0.75rem 1.25rem", borderRadius:"4px", fontFamily:"var(--font-sans)", fontSize:"0.82rem", background:msg.type==="error"?"#fee2e2":"#dcfce7", border:"1px solid "+(msg.type==="error"?"#fca5a5":"#86efac"), color:msg.type==="error"?"#991b1b":"#166534" }}>{msg.text}</div>}

      <div style={{ maxWidth:"900px", margin:"0 auto", padding:"2rem" }}>
        <div style={{ background:"#fffbeb", border:"1px solid #fcd34d", borderRadius:"6px", padding:"0.875rem 1.25rem", marginBottom:"1.5rem", fontFamily:"var(--font-sans)", fontSize:"0.78rem", color:"#92400e" }}>
          Results shown here appear on the public website at /results. Only add verified students with permission to showcase their result. Add a slug + video + body text to give a result its own detail page (like a blog post) at /results/&lt;slug&gt;.
        </div>

        {results.map(r => (
          <div key={r.id} style={{ background:C.white, border:"1px solid "+C.border, borderRadius:"8px", padding:"1.25rem", marginBottom:"0.75rem", display:"flex", gap:"1.25rem", alignItems:"center" }}>
            <div style={{ width:"48px", height:"48px", borderRadius:"50%", background:C.red, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontFamily:"Georgia,serif", fontSize:"1.1rem", fontWeight:"700", flexShrink:0 }}>
              {r.name?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", marginBottom:"0.25rem", flexWrap:"wrap" }}>
                <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.875rem", fontWeight:"700", color:C.black }}>{r.name}</p>
                <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.68rem", fontWeight:"700", color:C.green }}>✓ {r.percentile}%ile</span>
                <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.65rem", color:C.gray }}>{r.exam?.toUpperCase()} {r.year}</span>
                {r.slug && <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.65rem", color:C.red, background:"#fef2f2", padding:"1px 6px", borderRadius:"3px" }}>/results/{r.slug}</span>}
                {r.video_type && <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.65rem", color:"#7c3aed", background:"#f5f3ff", padding:"1px 6px", borderRadius:"3px" }}>🎬 {r.video_type}</span>}
              </div>
              {r.college_calls && <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.72rem", color:C.gray }}>{r.college_calls}</p>}
            </div>
            <button onClick={()=>openEdit(r)} style={{ background:"none", border:"1px solid "+C.border, padding:"0.25rem 0.5rem", borderRadius:"3px", cursor:"pointer", color:C.black, fontFamily:"var(--font-sans)", fontSize:"0.72rem" }}>Edit</button>
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
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem", overflowY:"auto" }} onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div style={{ background:C.white, borderRadius:"8px", width:"100%", maxWidth:"560px", padding:"2rem", margin:"2rem 0" }}>
            <p style={{ fontFamily:"Georgia,serif", fontSize:"1.25rem", fontWeight:"700", color:C.black, marginBottom:"1.5rem" }}>{editingId ? "Edit Result" : "Add Student Result"}</p>
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
              <div><label style={s.lbl}>Testimonial (short quote, optional)</label><textarea value={form.testimonial||""} onChange={e=>setForm(f=>({...f,testimonial:e.target.value}))} style={{...s.inp,height:"60px",resize:"vertical"}} placeholder="Their words about GRADSKOOL..." /></div>

              <div style={{ borderTop:"1px solid "+C.border, marginTop:"0.5rem", paddingTop:"1rem" }}>
                <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.72rem", fontWeight:"700", color:C.gray, textTransform:"uppercase", letterSpacing:"0.04em", marginBottom:"0.75rem" }}>Detail page (optional)</p>
              </div>

              <div>
                <label style={s.lbl}>URL Slug</label>
                <input type="text" value={form.slug||""} onChange={e=>setForm(f=>({...f,slug:e.target.value}))} style={s.inp} placeholder="auto-generated from name if left blank" />
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:"0.75rem" }}>
                <div>
                  <label style={s.lbl}>Video</label>
                  <select value={form.video_type||""} onChange={e=>setForm(f=>({...f,video_type:e.target.value}))} style={s.inp}>
                    {VIDEO_TYPES.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label style={s.lbl}>Video URL</label>
                  <input type="text" value={form.video_url||""} onChange={e=>setForm(f=>({...f,video_url:e.target.value}))} style={s.inp}
                    placeholder={form.video_type==="youtube" ? "Any YouTube watch/share link" : form.video_type==="bunny" ? "Bunny iframe embed URL" : "Select a video type first"}
                    disabled={!form.video_type} />
                </div>
              </div>

              <div>
                <label style={s.lbl}>Body — full write-up / interview content</label>
                <textarea value={form.body||""} onChange={e=>setForm(f=>({...f,body:e.target.value}))} style={{...s.inp,height:"140px",resize:"vertical"}} placeholder="The full story — this appears on the detail page below the video." />
              </div>

              <div>
                <label style={s.lbl}>SEO Meta Title</label>
                <input type="text" value={form.meta_title||""} onChange={e=>setForm(f=>({...f,meta_title:e.target.value}))} style={s.inp} placeholder="Leave blank to auto-generate" />
                <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.65rem", color:C.gray, marginTop:"0.2rem" }}>{(form.meta_title||"").length}/70</p>
              </div>
              <div>
                <label style={s.lbl}>SEO Meta Description</label>
                <textarea value={form.meta_description||""} onChange={e=>setForm(f=>({...f,meta_description:e.target.value}))} style={{...s.inp,height:"50px",resize:"vertical"}} />
                <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.65rem", color:C.gray, marginTop:"0.2rem" }}>{(form.meta_description||"").length}/300</p>
              </div>

              <div style={{ display:"flex", gap:"1.5rem", marginTop:"0.25rem" }}>
                <label style={{ display:"flex", alignItems:"center", gap:"0.4rem", fontFamily:"var(--font-sans)", fontSize:"0.8rem", color:C.black, cursor:"pointer" }}>
                  <input type="checkbox" checked={!!form.is_verified} onChange={e=>setForm(f=>({...f,is_verified:e.target.checked}))} />
                  Verified (shows on public site)
                </label>
                <label style={{ display:"flex", alignItems:"center", gap:"0.4rem", fontFamily:"var(--font-sans)", fontSize:"0.8rem", color:C.black, cursor:"pointer" }}>
                  <input type="checkbox" checked={!!form.is_featured} onChange={e=>setForm(f=>({...f,is_featured:e.target.checked}))} />
                  Featured
                </label>
              </div>
            </div>
            <div style={{ display:"flex", justifyContent:"flex-end", gap:"0.75rem", marginTop:"1.5rem", paddingTop:"1rem", borderTop:"1px solid "+C.border }}>
              <button onClick={()=>{setModal(false);setEditingId(null)}} style={{ padding:"0.625rem 1.25rem", border:"1px solid "+C.border, borderRadius:"4px", background:C.white, fontFamily:"var(--font-sans)", fontSize:"0.82rem", cursor:"pointer" }}>Cancel</button>
              <button onClick={save} disabled={saving||!form.name||!form.percentile} style={{ padding:"0.625rem 1.5rem", background:saving?C.gray:C.red, color:"#fff", border:"none", borderRadius:"4px", fontFamily:"var(--font-sans)", fontSize:"0.82rem", fontWeight:"700", cursor:saving?"not-allowed":"pointer" }}>{saving?"Saving…":editingId?"Save Changes":"Add Result"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
const s = { lbl:{ fontFamily:"var(--font-sans)",fontSize:"0.7rem",fontWeight:"700",color:"#666",display:"block",marginBottom:"0.25rem" }, inp:{ width:"100%",padding:"0.5rem 0.625rem",fontFamily:"var(--font-sans)",fontSize:"0.82rem",border:"1px solid #e8e8e6",borderRadius:"4px",outline:"none",color:"#0f0f0f",boxSizing:"border-box",background:"#fff" } }
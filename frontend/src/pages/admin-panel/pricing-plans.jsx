/**
 * GRADSKOOL Admin — Pricing Plans Manager
 * Route: /admin-panel/pricing-plans
 *
 * Full CRUD for pricing plans across every exam. Previously the only way
 * to manage these was the seed_courses management command (which wipes
 * and rebuilds the whole table on every run) or Django's raw /admin/ —
 * this gives a proper, safe, incremental way to add/edit/remove plans.
 */
import { useState, useEffect } from "react"
import Head from "next/head"
import Link from "next/link"
import api from "../../lib/api"
import { AdminLayout } from '../../components/admin/AdminLayout'

const C = { red:"#ff5e5f",black:"#0f0f0f",white:"#fff",bg:"#f7f6f3",border:"#e8e8e6",gray:"#999",green:"#22c55e" }
const EMPTY_FORM = { exam_id:"", name:"", slug:"", price_inr:"", is_featured:false, is_active:true, sort_order:0 }

export default function PricingPlansAdmin() {
  const [plans, setPlans]   = useState([])
  const [exams, setExams]   = useState([])
  const [modal, setModal]   = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm]     = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg]       = useState(null)
  const [filterExam, setFilterExam] = useState("all")

  const load = () => api.get("/dashboard/pricing-plans/").then(({ data }) => { setPlans(data.plans || []); setExams(data.exams || []) }).catch(()=>{})
  useEffect(load, [])

  const notify = (text, type="success") => { setMsg({type,text}); setTimeout(()=>setMsg(null),2500) }

  const openAdd = () => { setEditingId(null); setForm({ ...EMPTY_FORM, exam_id: exams[0]?.id || "" }); setModal(true) }
  const openEdit = (p) => { setEditingId(p.id); setForm({ ...p }); setModal(true) }

  const save = async () => {
    if (!form.exam_id||!form.name||!form.price_inr) { notify("Exam, name and price required","error"); return }
    setSaving(true)
    try {
      if (editingId) {
        await api.patch("/dashboard/pricing-plans/"+editingId+"/", form)
        notify("Plan updated")
      } else {
        await api.post("/dashboard/pricing-plans/", form)
        notify("Plan added")
      }
      setModal(false); setEditingId(null); setForm(EMPTY_FORM); load()
    }
    catch (err) { notify(err?.response?.data?.error || "Failed","error") }
    finally { setSaving(false) }
  }

  const del = async (id) => {
    if (!confirm("Delete this plan? This can affect checkout for anyone using it.")) return
    try { await api.delete("/dashboard/pricing-plans/"+id+"/"); notify("Deleted"); load() }
    catch { notify("Failed","error") }
  }

  const filtered = filterExam === "all" ? plans : plans.filter(p => p.exam_slug === filterExam)

  return (
    <AdminLayout title="Pricing Plans">
    <div style={{ minHeight:"100vh", background:C.bg }}>
      <Head><title>Pricing Plans — Admin — GRADSKOOL</title></Head>
      <div style={{ height:"56px", background:C.white, borderBottom:"1px solid "+C.border, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 1.5rem" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"1rem" }}>
          <Link href="/admin-panel" style={{ fontFamily:"var(--font-sans)", fontSize:"0.75rem", color:C.gray, textDecoration:"none" }}>← Admin</Link>
          <span style={{ color:C.border }}>|</span>
          <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.82rem", fontWeight:"700", color:C.black }}>Pricing Plans</span>
        </div>
        <button onClick={openAdd} style={{ padding:"0.4rem 1rem", background:C.red, color:"#fff", border:"none", borderRadius:"4px", fontFamily:"var(--font-sans)", fontSize:"0.78rem", fontWeight:"700", cursor:"pointer" }}>+ Add Plan</button>
      </div>
      {msg && <div style={{ position:"fixed", top:"64px", right:"1.5rem", zIndex:999, padding:"0.75rem 1.25rem", borderRadius:"4px", fontFamily:"var(--font-sans)", fontSize:"0.82rem", background:msg.type==="error"?"#fee2e2":"#dcfce7", border:"1px solid "+(msg.type==="error"?"#fca5a5":"#86efac"), color:msg.type==="error"?"#991b1b":"#166534" }}>{msg.text}</div>}

      <div style={{ maxWidth:"1000px", margin:"0 auto", padding:"2rem" }}>
        <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap", marginBottom:"1.5rem" }}>
          <button onClick={()=>setFilterExam("all")} style={{ padding:"0.35rem 0.9rem", borderRadius:"20px", border:"1px solid "+C.border, cursor:"pointer", fontFamily:"var(--font-sans)", fontSize:"0.75rem", fontWeight:"600", background:filterExam==="all"?C.red:"#fff", color:filterExam==="all"?"#fff":C.black }}>All ({plans.length})</button>
          {exams.map(e => {
            const count = plans.filter(p=>p.exam_slug===e.slug).length
            return <button key={e.id} onClick={()=>setFilterExam(e.slug)} style={{ padding:"0.35rem 0.9rem", borderRadius:"20px", border:"1px solid "+C.border, cursor:"pointer", fontFamily:"var(--font-sans)", fontSize:"0.75rem", fontWeight:"600", background:filterExam===e.slug?C.red:"#fff", color:filterExam===e.slug?"#fff":C.black }}>{e.short_name} ({count})</button>
          })}
        </div>

        {filtered.map(p => (
          <div key={p.id} style={{ background:C.white, border:"1px solid "+C.border, borderRadius:"8px", padding:"1.1rem 1.25rem", marginBottom:"0.65rem", display:"flex", gap:"1.25rem", alignItems:"center" }}>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", flexWrap:"wrap", marginBottom:"0.25rem" }}>
                <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.65rem", fontWeight:"700", color:C.red, background:"#fef2f2", padding:"1px 7px", borderRadius:"3px" }}>{p.exam_name}</span>
                <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.875rem", fontWeight:"700", color:C.black }}>{p.name}</p>
                {p.is_featured && <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.65rem", color:"#7c3aed", background:"#f5f3ff", padding:"1px 7px", borderRadius:"3px" }}>★ Featured</span>}
                {!p.is_active && <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.65rem", color:C.gray, background:"#f4f3f0", padding:"1px 7px", borderRadius:"3px" }}>Inactive</span>}
              </div>
              <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.72rem", color:C.gray }}>/{p.exam_slug} · slug: {p.slug} · SKU: {p.razorpay_sku}</p>
            </div>
            <div style={{ fontFamily:"Georgia,serif", fontSize:"1.1rem", color:C.black, whiteSpace:"nowrap" }}>
              ₹{Number(p.price_inr).toLocaleString("en-IN")}
              {p.original_price && <span style={{ fontSize:"0.75rem", color:C.gray, textDecoration:"line-through", marginLeft:"0.4rem" }}>₹{Number(p.original_price).toLocaleString("en-IN")}</span>}
            </div>
            <button onClick={()=>openEdit(p)} style={{ background:"none", border:"1px solid "+C.border, padding:"0.25rem 0.5rem", borderRadius:"3px", cursor:"pointer", color:C.black, fontFamily:"var(--font-sans)", fontSize:"0.72rem" }}>Edit</button>
            <button onClick={()=>del(p.id)} style={{ background:"none", border:"1px solid #fca5a5", padding:"0.25rem 0.5rem", borderRadius:"3px", cursor:"pointer", color:C.red, fontFamily:"var(--font-sans)", fontSize:"0.72rem" }}>Remove</button>
          </div>
        ))}
        {!filtered.length && (
          <div style={{ textAlign:"center", padding:"4rem", background:C.white, border:"1px dashed "+C.border, borderRadius:"8px" }}>
            <p style={{ fontFamily:"Georgia,serif", color:C.gray }}>No plans {filterExam!=="all" && `for ${filterExam.toUpperCase()}`} yet.</p>
          </div>
        )}
      </div>

      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem", overflowY:"auto" }} onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div style={{ background:C.white, borderRadius:"8px", width:"100%", maxWidth:"560px", padding:"2rem", margin:"2rem 0" }}>
            <p style={{ fontFamily:"Georgia,serif", fontSize:"1.25rem", fontWeight:"700", color:C.black, marginBottom:"1.5rem" }}>{editingId ? "Edit Plan" : "Add Pricing Plan"}</p>
            <div style={{ display:"flex", flexDirection:"column", gap:"0.875rem" }}>
              <div>
                <label style={s.lbl}>Exam *</label>
                <select value={form.exam_id||""} onChange={e=>setForm(f=>({...f,exam_id:e.target.value}))} style={s.inp}>
                  <option value="">Select exam…</option>
                  {exams.map(e => <option key={e.id} value={e.id}>{e.short_name}</option>)}
                </select>
              </div>
              <div>
                <label style={s.lbl}>Plan Name *</label>
                <input type="text" value={form.name||""} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={s.inp} placeholder="e.g. Live + Mocks" />
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.75rem" }}>
                <div><label style={s.lbl}>Price (₹) *</label><input type="number" value={form.price_inr||""} onChange={e=>setForm(f=>({...f,price_inr:e.target.value}))} style={s.inp} /></div>
                <div><label style={s.lbl}>Original Price (strikethrough)</label><input type="number" value={form.original_price||""} onChange={e=>setForm(f=>({...f,original_price:e.target.value}))} style={s.inp} placeholder="optional" /></div>
              </div>
              <div>
                <label style={s.lbl}>Slug</label>
                <input type="text" value={form.slug||""} onChange={e=>setForm(f=>({...f,slug:e.target.value}))} style={s.inp} placeholder="auto-generated from name if blank — used in ?plan= links" />
              </div>
              <div><label style={s.lbl}>Badge Text</label><input type="text" value={form.badge_text||""} onChange={e=>setForm(f=>({...f,badge_text:e.target.value}))} style={s.inp} placeholder="e.g. Most Popular" /></div>
              <div><label style={s.lbl}>Description</label><textarea value={form.description||""} onChange={e=>setForm(f=>({...f,description:e.target.value}))} style={{...s.inp,height:"55px",resize:"vertical"}} /></div>

              <div style={{ display:"flex", gap:"1.25rem", flexWrap:"wrap" }}>
                {[["is_featured","Featured"],["is_active","Active (visible on site)"],["includes_live","Includes Live"],["includes_mocks","Includes Mocks"],["includes_books","Includes Books"],["includes_gdpi","Includes GD/PI"],["includes_recordings","Includes Recordings"]].map(([k,l])=>(
                  <label key={k} style={{ display:"flex", alignItems:"center", gap:"0.4rem", fontFamily:"var(--font-sans)", fontSize:"0.78rem", color:C.black, cursor:"pointer" }}>
                    <input type="checkbox" checked={!!form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.checked}))} />
                    {l}
                  </label>
                ))}
              </div>

              <div><label style={s.lbl}>Sort Order</label><input type="number" value={form.sort_order??0} onChange={e=>setForm(f=>({...f,sort_order:e.target.value}))} style={s.inp} /></div>
              <div><label style={s.lbl}>Razorpay SKU</label><input type="text" value={form.razorpay_sku||""} onChange={e=>setForm(f=>({...f,razorpay_sku:e.target.value}))} style={s.inp} placeholder="auto-generated if blank" /></div>
            </div>
            <div style={{ display:"flex", justifyContent:"flex-end", gap:"0.75rem", marginTop:"1.5rem", paddingTop:"1rem", borderTop:"1px solid "+C.border }}>
              <button onClick={()=>{setModal(false);setEditingId(null)}} style={{ padding:"0.625rem 1.25rem", border:"1px solid "+C.border, borderRadius:"4px", background:C.white, fontFamily:"var(--font-sans)", fontSize:"0.82rem", cursor:"pointer" }}>Cancel</button>
              <button onClick={save} disabled={saving} style={{ padding:"0.625rem 1.5rem", background:saving?C.gray:C.red, color:"#fff", border:"none", borderRadius:"4px", fontFamily:"var(--font-sans)", fontSize:"0.82rem", fontWeight:"700", cursor:saving?"not-allowed":"pointer" }}>{saving?"Saving…":editingId?"Save Changes":"Add Plan"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  </AdminLayout>
  )
}
const s = { lbl:{ fontFamily:"var(--font-sans)",fontSize:"0.7rem",fontWeight:"700",color:"#666",display:"block",marginBottom:"0.25rem" }, inp:{ width:"100%",padding:"0.5rem 0.625rem",fontFamily:"var(--font-sans)",fontSize:"0.82rem",border:"1px solid #e8e8e6",borderRadius:"4px",outline:"none",color:"#0f0f0f",boxSizing:"border-box",background:"#fff" } }

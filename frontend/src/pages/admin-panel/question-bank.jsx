/**
 * GRADSKOOL Admin — Question Bank Explorer
 * Route: /admin-panel/question-bank
 * Browse, filter, bulk tag, and edit all questions across the bank
 */
import { useState, useEffect } from "react"
import Head from "next/head"
import Link from "next/link"
import api from "../../lib/api"
import { AdminLayout } from '../../components/admin/AdminLayout'

const C = { red:"#ff5e5f",black:"#0f0f0f",white:"#fff",bg:"#f7f6f3",border:"#e8e8e6",gray:"#999",green:"#22c55e",amber:"#f59e0b",blue:"#3b82f6",muted:"#f4f3f0" }
const DIFFICULTIES = ["","easy","medium","hard"]
const EXAMS = ["","cat","xat","snap","nmat","gmat","gre"]

function QuestionBankInner() {
  const [questions, setQuestions] = useState([])
  const [loading,  setLoad]       = useState(true)
  const [filters,  setFilters]    = useState({ exam:"cat", difficulty:"", search:"", section:"" })
  const [selected, setSelected]   = useState(new Set())
  const [editing,  setEditing]    = useState(null)
  const [msg,      setMsg]        = useState(null)
  const [total,    setTotal]      = useState(0)

  const load = () => {
    setLoad(true)
    const p = new URLSearchParams()
    if (filters.exam)       p.set("exam", filters.exam)
    if (filters.difficulty) p.set("difficulty", filters.difficulty)
    if (filters.search)     p.set("search", filters.search)
    api.get("/dashboard/questions/?" + p.toString())
      .then(({ data }) => { setQuestions(data.questions || []); setTotal(data.count || 0) })
      .catch(() => setQuestions([]))
      .finally(() => setLoad(false))
  }
  useEffect(load, [filters.exam, filters.difficulty])

  const notify = (text, type="success") => { setMsg({ type, text }); setTimeout(() => setMsg(null), 2500) }

  const toggleSelect = (id) => setSelected(s => { const n=new Set(s); n.has(id)?n.delete(id):n.add(id); return n })
  const selectAll   = () => setSelected(new Set(questions.map(q => q.id)))
  const clearSelect = () => setSelected(new Set())

  const bulkTag = async (difficulty) => {
    if (!selected.size) return
    try {
      await api.post("/dashboard/questions/bulk-update/", { ids:[...selected], difficulty })
      notify(`Tagged ${selected.size} questions as ${difficulty}`)
      clearSelect(); load()
    } catch { notify("Failed", "error") }
  }

  const saveEdit = async () => {
    if (!editing) return
    try {
      if (editing.isNew) {
        // Create brand new question
        await api.post("/dashboard/questions/", {
          question_text:  editing.question_text,
          explanation:    editing.explanation || '',
          difficulty_tag: editing.difficulty_tag || 'medium',
          exam_tag:       editing.exam_tag || filters.exam || 'cat',
          section_tag:    editing.section_tag || '',
          options: ['A','B','C','D'].map(k => ({
            key: k, text: editing['opt_'+k] || '', is_correct: editing.correct === k
          })).filter(o => o.text),
        })
        notify("Question created")
      } else {
        await api.patch("/dashboard/questions/" + editing.id + "/", editing)
        notify("Question updated")
      }
      setEditing(null); load()
    } catch { notify("Failed", "error") }
  }

  const deleteQ = async (id) => {
    if (!confirm("Delete this question?")) return
    try { await api.delete("/dashboard/questions/" + id + "/"); notify("Deleted"); load() }
    catch { notify("Failed", "error") }
  }

  return (
    <div style={{ minHeight:"100vh", background:C.bg }}>
      <Head><title>Question Bank — Admin — GRADSKOOL</title></Head>
      <div style={{ height:"56px", background:C.white, borderBottom:"1px solid "+C.border, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 1.5rem", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"1rem" }}>
          <Link href="/admin-panel" style={{ fontFamily:"var(--font-sans)", fontSize:"0.75rem", color:C.gray, textDecoration:"none" }}>← Admin</Link>
          <span style={{ color:C.border }}>|</span>
          <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.82rem", fontWeight:"700", color:C.black }}>Question Bank</span>
          <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.68rem", color:C.gray, background:C.muted, padding:"0.1rem 0.5rem", borderRadius:"100px" }}>{total.toLocaleString()} questions</span>
        </div>
        {selected.size > 0 && (
          <div style={{ display:"flex", gap:"0.5rem", alignItems:"center" }}>
            <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.75rem", color:C.gray }}>{selected.size} selected</span>
            {["easy","medium","hard"].map(d => (
              <button key={d} onClick={() => bulkTag(d)}
                style={{ fontFamily:"var(--font-sans)", fontSize:"0.7rem", padding:"0.25rem 0.625rem", border:"1px solid "+C.border, borderRadius:"3px", background:C.white, cursor:"pointer" }}>
                Tag as {d}
              </button>
            ))}
            <button onClick={clearSelect} style={{ fontFamily:"var(--font-sans)", fontSize:"0.7rem", color:C.gray, background:"none", border:"none", cursor:"pointer" }}>Clear ✕</button>
          </div>
        )}
      </div>
      {msg && <div style={{ position:"fixed", top:"64px", right:"1.5rem", zIndex:999, padding:"0.75rem 1.25rem", borderRadius:"4px", fontFamily:"var(--font-sans)", fontSize:"0.82rem", background:msg.type==="error"?"#fee2e2":"#dcfce7", border:"1px solid "+(msg.type==="error"?"#fca5a5":"#86efac"), color:msg.type==="error"?"#991b1b":"#166534" }}>{msg.text}</div>}

      <div style={{ maxWidth:"1100px", margin:"0 auto", padding:"2rem" }}>
        {/* Filters */}
        <div style={{ display:"flex", gap:"0.75rem", marginBottom:"1.5rem", flexWrap:"wrap", alignItems:"center" }}>
          <input value={filters.search} onChange={e=>setFilters(f=>({...f,search:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&load()} placeholder="Search questions..."
            style={{ flex:"1", minWidth:"200px", padding:"0.5rem 0.75rem", fontFamily:"var(--font-sans)", fontSize:"0.82rem", border:"1px solid "+C.border, borderRadius:"4px", outline:"none" }} />
          <select value={filters.exam} onChange={e=>setFilters(f=>({...f,exam:e.target.value}))} style={s.sel}>
            {EXAMS.map(e=><option key={e} value={e}>{e||"All exams"}</option>)}
          </select>
          <select value={filters.difficulty} onChange={e=>setFilters(f=>({...f,difficulty:e.target.value}))} style={s.sel}>
            {DIFFICULTIES.map(d=><option key={d} value={d}>{d||"All difficulties"}</option>)}
          </select>
          <button onClick={load} style={{ padding:"0.5rem 1rem", background:C.black, color:"#fff", border:"none", borderRadius:"4px", fontFamily:"var(--font-sans)", fontSize:"0.78rem", cursor:"pointer" }}>Search</button>
          <button onClick={selectAll} style={{ padding:"0.5rem 0.875rem", background:C.white, border:"1px solid "+C.border, borderRadius:"4px", fontFamily:"var(--font-sans)", fontSize:"0.72rem", cursor:"pointer" }}>Select all</button>
        </div>

        {loading ? <p style={{ textAlign:"center", fontFamily:"Georgia,serif", color:C.gray, padding:"4rem" }}>Loading questions…</p>
        : !questions.length ? <p style={{ textAlign:"center", fontFamily:"Georgia,serif", color:C.gray, padding:"4rem" }}>No questions found. Try different filters.</p>
        : (
          <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
            {questions.map(q => (
              <div key={q.id} style={{ background:C.white, border:"1px solid "+(selected.has(q.id)?C.red:C.border), borderRadius:"6px", padding:"1rem 1.25rem" }}>
                <div style={{ display:"flex", gap:"0.875rem", alignItems:"flex-start" }}>
                  <input type="checkbox" checked={selected.has(q.id)} onChange={() => toggleSelect(q.id)} style={{ marginTop:"3px", flexShrink:0 }} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontFamily:"Georgia,serif", fontSize:"0.875rem", color:C.black, lineHeight:1.7, marginBottom:"0.625rem" }}>{q.question_text}</p>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.375rem", marginBottom:"0.625rem" }}>
                      {q.options?.map(opt => (
                        <div key={opt.id} style={{ padding:"0.3rem 0.5rem", borderRadius:"3px", fontFamily:"var(--font-sans)", fontSize:"0.72rem", background:opt.is_correct?"#dcfce7":C.muted, border:"1px solid "+(opt.is_correct?"#86efac":C.border), color:opt.is_correct?"#166534":C.black, display:"flex", gap:"0.375rem" }}>
                          <span style={{ fontWeight:"700" }}>{opt.key}.</span><span>{opt.text}</span>{opt.is_correct&&<span style={{marginLeft:"auto"}}>✓</span>}
                        </div>
                      ))}
                    </div>
                    {q.explanation && <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.68rem", color:"#92400e", background:"#fffbeb", padding:"0.375rem 0.625rem", borderRadius:"3px" }}>💡 {q.explanation}</p>}
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:"0.375rem", flexShrink:0, alignItems:"flex-end" }}>
                    <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.62rem", padding:"0.15rem 0.4rem", borderRadius:"3px",
                      background:q.difficulty_tag==="hard"?"#fee2e2":q.difficulty_tag==="easy"?"#dcfce7":"#eff6ff",
                      color:q.difficulty_tag==="hard"?C.red:q.difficulty_tag==="easy"?C.green:C.blue }}>
                      {q.difficulty_tag||"medium"}
                    </span>
                    <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.6rem", color:C.gray }}>{q.exam_tag?.toUpperCase()} · {q.section_tag}</span>
                    <div style={{ display:"flex", gap:"0.25rem", marginTop:"0.25rem" }}>
                      <button onClick={() => setEditing(q)} style={{ fontFamily:"var(--font-sans)", fontSize:"0.65rem", padding:"0.2rem 0.5rem", border:"1px solid "+C.border, borderRadius:"3px", cursor:"pointer", background:C.white }}>✎</button>
                      <button onClick={() => deleteQ(q.id)} style={{ fontFamily:"var(--font-sans)", fontSize:"0.65rem", padding:"0.2rem 0.5rem", border:"1px solid #fca5a5", borderRadius:"3px", cursor:"pointer", background:C.white, color:C.red }}>✕</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }} onClick={e=>e.target===e.currentTarget&&setEditing(null)}>
          <div style={{ background:C.white, borderRadius:"8px", width:"100%", maxWidth:"560px", maxHeight:"90vh", overflowY:"auto", padding:"2rem" }}>
            <p style={{ fontFamily:"Georgia,serif", fontSize:"1.1rem", fontWeight:"700", color:C.black, marginBottom:"1.25rem" }}>{editing?.isNew ? "Create New Question" : "Edit Question"}</p>
            <div style={{ display:"flex", flexDirection:"column", gap:"0.875rem" }}>
              <div>
                <label style={s.lbl}>Question Text *</label>
                <textarea value={editing.question_text||""} onChange={e=>setEditing(q=>({...q,question_text:e.target.value}))} rows={3} style={{ ...s.inp, height:"80px", resize:"vertical" }} />
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"0.625rem" }}>
                <div>
                  <label style={s.lbl}>Difficulty</label>
                  <select value={editing.difficulty_tag||"medium"} onChange={e=>setEditing(q=>({...q,difficulty_tag:e.target.value}))} style={s.inp}>
                    <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label style={s.lbl}>Exam</label>
                  <select value={editing.exam_tag||"cat"} onChange={e=>setEditing(q=>({...q,exam_tag:e.target.value}))} style={s.inp}>
                    {["cat","xat","snap","nmat","gmat","gre"].map(e=><option key={e} value={e}>{e.toUpperCase()}</option>)}
                  </select>
                </div>
                <div>
                  <label style={s.lbl}>Section</label>
                  <input value={editing.section_tag||""} onChange={e=>setEditing(q=>({...q,section_tag:e.target.value}))} style={s.inp} placeholder="e.g. varc, qa" />
                </div>
              </div>

              {/* Options — shown for new questions or when editing */}
              {(editing.isNew || editing.options) && (
                <div style={{ background:"#f9fafb", border:"1px solid "+C.border, borderRadius:"6px", padding:"0.875rem" }}>
                  <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.65rem", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.08em", color:C.gray, marginBottom:"0.625rem" }}>Answer Options</p>
                  {["A","B","C","D"].map(k => (
                    <div key={k} style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"6px" }}>
                      <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.78rem", fontWeight:"700", color:C.gray, width:"16px", flexShrink:0 }}>{k}.</span>
                      <input value={editing["opt_"+k]||editing.options?.find(o=>o.key===k)?.text||""} onChange={e=>setEditing(q=>({...q,["opt_"+k]:e.target.value}))} placeholder={"Option "+k} style={{ ...s.inp, flex:1 }} />
                      <label style={{ display:"flex", alignItems:"center", gap:"4px", cursor:"pointer", flexShrink:0 }}>
                        <input type="radio" name="correct_opt" value={k} checked={editing.correct===k||(editing.options?.find(o=>o.key===k&&o.is_correct)&&!editing.correct)} onChange={()=>setEditing(q=>({...q,correct:k}))} />
                        <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.65rem", color:C.gray }}>Correct</span>
                      </label>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label style={s.lbl}>Explanation</label>
                <textarea value={editing.explanation||""} onChange={e=>setEditing(q=>({...q,explanation:e.target.value}))} rows={2} style={{ ...s.inp, height:"60px", resize:"vertical" }} />
              </div>
            </div>
            <div style={{ display:"flex", justifyContent:"flex-end", gap:"0.75rem", marginTop:"1.5rem", paddingTop:"1rem", borderTop:"1px solid "+C.border }}>
              <button onClick={()=>setEditing(null)} style={{ padding:"0.625rem 1.25rem", border:"1px solid "+C.border, borderRadius:"4px", background:C.white, fontFamily:"var(--font-sans)", fontSize:"0.82rem", cursor:"pointer", color:C.gray }}>Cancel</button>
              <button onClick={saveEdit} style={{ padding:"0.625rem 1.5rem", background:C.red, color:"#fff", border:"none", borderRadius:"4px", fontFamily:"var(--font-sans)", fontSize:"0.82rem", fontWeight:"700", cursor:"pointer" }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
const s = {
  lbl: { fontFamily:"var(--font-sans)", fontSize:"0.7rem", fontWeight:"700", color:"#666", display:"block", marginBottom:"0.25rem" },
  inp: { width:"100%", padding:"0.5rem 0.625rem", fontFamily:"var(--font-sans)", fontSize:"0.82rem", border:"1px solid #e8e8e6", borderRadius:"4px", outline:"none", color:"#0f0f0f", boxSizing:"border-box", background:"#fff" },
  sel: { padding:"0.5rem 0.625rem", fontFamily:"var(--font-sans)", fontSize:"0.78rem", border:"1px solid #e8e8e6", borderRadius:"4px", outline:"none", color:"#0f0f0f", background:"#fff", cursor:"pointer" },
}


export default function QuestionBank(props) {
  return (
    <AdminLayout title="Question Bank">
      <QuestionBankInner {...props} />
    </AdminLayout>
  )
}

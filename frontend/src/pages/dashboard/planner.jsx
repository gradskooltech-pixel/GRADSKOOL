/**
 * GRADSKOOL — Study Planner (Calendar View)
 * Route: /dashboard/planner
 * Exam countdown + weekly calendar + daily tasks synced to course schedule
 */
import { useState, useEffect } from "react"
import Head from "next/head"
import Link from "next/link"
import { ProtectedRoute } from "../../components/auth/ProtectedRoute"
import { useAuth } from "../../hooks/useAuth"
import api from "../../lib/api"

const C = { red:"#ff5e5f", black:"#0f0f0f", white:"#fff", bg:"#f7f6f3", border:"#e8e8e6", gray:"#999", green:"#22c55e", amber:"#f59e0b", blue:"#3b82f6", muted:"#f4f3f0" }

const CAT_DATE = new Date("2026-11-24")  // approximate CAT date
const DAYS     = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
const MONTHS   = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

export default function Planner() {
  return <ProtectedRoute><Inner /></ProtectedRoute>
}

function Inner() {
  const { user } = useAuth()
  const [today]    = useState(new Date())
  const [weekStart,setWeekStart] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay()); d.setHours(0,0,0,0); return d
  })
  const [tasks,   setTasks]   = useState({})
  const [sections,setSections]= useState([])
  const [goals,   setGoals]   = useState([])
  const [addForm, setAddForm] = useState(null)
  const exam = user?.target_exam || "cat"

  // Days remaining to exam
  const daysLeft = Math.max(0, Math.ceil((CAT_DATE - today) / (1000 * 60 * 60 * 24)))
  const weeksLeft = Math.floor(daysLeft / 7)

  useEffect(() => {
    api.get(`/learn/${exam}/sections/`).then(({ data }) => setSections(data.sections || [])).catch(()=>{})
    api.get(`/learn/gamification/?exam=${exam}`).then(({ data }) => setGoals(data.goals || [])).catch(()=>{})
  }, [exam])

  const weekDays = Array.from({ length:7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(d.getDate() + i); return d
  })

  const prevWeek = () => setWeekStart(d => { const n=new Date(d); n.setDate(n.getDate()-7); return n })
  const nextWeek = () => setWeekStart(d => { const n=new Date(d); n.setDate(n.getDate()+7); return n })

  const dateKey = (d) => d.toISOString().slice(0,10)
  const isToday = (d) => dateKey(d) === dateKey(today)
  const isPast  = (d) => d < today && !isToday(d)

  const addTask = (dateKey, task) => {
    setTasks(t => ({ ...t, [dateKey]: [...(t[dateKey]||[]), task] }))
    setAddForm(null)
  }
  const removeTask = (dk, i) => setTasks(t => ({ ...t, [dk]: t[dk].filter((_,j)=>j!==i) }))
  const toggleTask = (dk, i) => setTasks(t => ({ ...t, [dk]: t[dk].map((task,j) => j===i ? {...task, done:!task.done} : task) }))

  return (
    <div style={{ minHeight:"100vh", background:C.bg }}>
      <Head><title>Planner — GRADSKOOL</title></Head>
      <div style={{ height:"52px", background:C.white, borderBottom:"1px solid "+C.border, display:"flex", alignItems:"center", padding:"0 1.5rem", gap:"1rem" }}>
        <Link href="/dashboard?tab=today" style={{ fontFamily:"var(--font-sans)", fontSize:"0.75rem", color:C.gray, textDecoration:"none" }}>← Dashboard</Link>
        <span style={{ color:C.border }}>|</span>
        <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.82rem", fontWeight:"700", color:C.black }}>Study Planner</span>
      </div>

      <div style={{ maxWidth:"1000px", margin:"0 auto", padding:"2rem" }}>
        {/* Exam countdown */}
        <div style={{ background:C.black, borderRadius:"8px", padding:"1.5rem", marginBottom:"1.5rem", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"1rem" }}>
          <div>
            <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.65rem", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.1em", color:"rgba(255,255,255,0.4)", marginBottom:"0.375rem" }}>
              {exam.toUpperCase()} 2026 countdown
            </p>
            <div style={{ display:"flex", alignItems:"baseline", gap:"0.75rem" }}>
              <span style={{ fontFamily:"Georgia,serif", fontSize:"2.5rem", fontWeight:"700", color:C.red, lineHeight:1 }}>{daysLeft}</span>
              <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.875rem", color:"rgba(255,255,255,0.5)" }}>days left</span>
              <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.72rem", color:"rgba(255,255,255,0.3)", background:"rgba(255,255,255,0.07)", padding:"0.15rem 0.5rem", borderRadius:"3px" }}>≈ {weeksLeft} weeks</span>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1rem" }}>
            {[["📚",sections.length,"Sections"],["✅",sections.reduce((a,s)=>a+(s.completed_topics||0),0),"Topics done"],["🎯",goals.length,"Active goals"]].map(([icon,val,label]) => (
              <div key={label} style={{ textAlign:"center", padding:"0.75rem 1rem", background:"rgba(255,255,255,0.05)", borderRadius:"6px", border:"1px solid rgba(255,255,255,0.08)" }}>
                <p style={{ fontSize:"1rem", marginBottom:"0.2rem" }}>{icon}</p>
                <p style={{ fontFamily:"Georgia,serif", fontSize:"1.25rem", fontWeight:"700", color:"#fff", lineHeight:1, marginBottom:"0.15rem" }}>{val}</p>
                <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.6rem", color:"rgba(255,255,255,0.3)" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Week navigation */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1rem" }}>
          <button onClick={prevWeek} style={{ background:"none", border:"1px solid "+C.border, borderRadius:"4px", padding:"0.375rem 0.75rem", cursor:"pointer", fontFamily:"var(--font-sans)", fontSize:"0.78rem", color:C.black }}>← Prev</button>
          <p style={{ fontFamily:"Georgia,serif", fontSize:"0.95rem", fontWeight:"700", color:C.black }}>
            {MONTHS[weekDays[0].getMonth()]} {weekDays[0].getDate()} – {MONTHS[weekDays[6].getMonth()]} {weekDays[6].getDate()}, {weekDays[6].getFullYear()}
          </p>
          <button onClick={nextWeek} style={{ background:"none", border:"1px solid "+C.border, borderRadius:"4px", padding:"0.375rem 0.75rem", cursor:"pointer", fontFamily:"var(--font-sans)", fontSize:"0.78rem", color:C.black }}>Next →</button>
        </div>

        {/* Calendar grid */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"0.5rem" }}>
          {weekDays.map(day => {
            const dk    = dateKey(day)
            const dayTasks = tasks[dk] || []
            const isTod = isToday(day)
            const past  = isPast(day)
            return (
              <div key={dk} style={{ background:isTod?C.white:past?"#fafaf9":C.white, border:"1px solid "+(isTod?C.red:C.border), borderRadius:"6px", overflow:"hidden", opacity:past?0.7:1, minHeight:"160px", display:"flex", flexDirection:"column" }}>
                {/* Day header */}
                <div style={{ padding:"0.5rem", borderBottom:"1px solid "+C.border, background:isTod?C.red:C.muted, textAlign:"center" }}>
                  <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.6rem", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.05em", color:isTod?"rgba(255,255,255,0.7)":C.gray }}>{DAYS[day.getDay()]}</p>
                  <p style={{ fontFamily:"Georgia,serif", fontSize:"1.1rem", fontWeight:"700", color:isTod?"#fff":C.black, lineHeight:1 }}>{day.getDate()}</p>
                </div>
                {/* Tasks */}
                <div style={{ flex:1, padding:"0.375rem", display:"flex", flexDirection:"column", gap:"3px", overflowY:"auto" }}>
                  {dayTasks.map((task, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:"4px", padding:"3px 5px", borderRadius:"3px", background:task.done?"#dcfce7":"#f1f5f9", cursor:"pointer" }}
                      onClick={() => toggleTask(dk, i)}>
                      <span style={{ fontSize:"0.6rem", flexShrink:0 }}>{task.done?"✓":"○"}</span>
                      <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.62rem", color:task.done?"#166534":C.black, textDecoration:task.done?"line-through":"none", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{task.text}</span>
                      <button onClick={e=>{e.stopPropagation();removeTask(dk,i)}} style={{ background:"none", border:"none", cursor:"pointer", color:C.gray, fontSize:"0.6rem", flexShrink:0 }}>✕</button>
                    </div>
                  ))}
                  {!past && (
                    <button onClick={() => setAddForm(dk)}
                      style={{ fontFamily:"var(--font-sans)", fontSize:"0.62rem", color:C.gray, background:"none", border:"1px dashed "+C.border, borderRadius:"3px", padding:"3px", cursor:"pointer", marginTop:"auto" }}>
                      + Task
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Add task modal */}
        {addForm && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <div style={{ background:C.white, borderRadius:"8px", padding:"1.5rem", width:"100%", maxWidth:"400px" }}>
              <p style={{ fontFamily:"Georgia,serif", fontSize:"1rem", fontWeight:"700", color:C.black, marginBottom:"1rem" }}>Add task for {addForm}</p>
              <input id="task-input" autoFocus placeholder="e.g. Watch RC Strategy Part 2"
                style={{ width:"100%", padding:"0.625rem", fontFamily:"var(--font-sans)", fontSize:"0.875rem", border:"1px solid "+C.border, borderRadius:"4px", outline:"none", marginBottom:"1rem", boxSizing:"border-box" }}
                onKeyDown={e => { if(e.key==="Enter"&&e.target.value.trim()) { addTask(addForm,{text:e.target.value.trim(),done:false}); e.target.value="" } }} />
              <div style={{ display:"flex", gap:"0.5rem" }}>
                {sections.slice(0,6).map(s => s.topics?.slice(0,2).map(t => (
                  <button key={t.id} onClick={() => addTask(addForm, { text:"Watch: "+t.title, done:false })}
                    style={{ fontFamily:"var(--font-sans)", fontSize:"0.62rem", padding:"0.25rem 0.5rem", border:"1px solid "+C.border, borderRadius:"3px", cursor:"pointer", background:C.muted, color:C.black }}>
                    {t.title.slice(0,18)}…
                  </button>
                )))}
              </div>
              <div style={{ display:"flex", justifyContent:"flex-end", gap:"0.5rem", marginTop:"1rem" }}>
                <button onClick={() => setAddForm(null)} style={{ padding:"0.5rem 1rem", border:"1px solid "+C.border, borderRadius:"4px", background:C.white, fontFamily:"var(--font-sans)", fontSize:"0.78rem", cursor:"pointer" }}>Cancel</button>
                <button onClick={() => { const v=document.getElementById("task-input").value.trim(); if(v) addTask(addForm,{text:v,done:false}) }} style={{ padding:"0.5rem 1rem", background:C.red, color:"#fff", border:"none", borderRadius:"4px", fontFamily:"var(--font-sans)", fontSize:"0.78rem", fontWeight:"700", cursor:"pointer" }}>Add</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * GRADSKOOL — Wrong Answer Analysis (improved)
 * Route: /dashboard/wrong-answers
 * See wrong answers + re-attempt selected questions
 */
import { useState, useEffect } from "react"
import Head from "next/head"
import Link from "next/link"
import { ProtectedRoute } from "../../components/auth/ProtectedRoute"
import { useAuth } from "../../hooks/useAuth"
import api from "../../lib/api"

const C = { red:"#ff5e5f", black:"#0f0f0f", white:"#fff", bg:"#f7f6f3", border:"#e8e8e6", gray:"#999", green:"#22c55e", amber:"#f59e0b", muted:"#f4f3f0" }

export default function WrongAnswers() { return <ProtectedRoute><Inner /></ProtectedRoute> }

function Inner() {
  const { user } = useAuth()
  const exam = user?.target_exam || "cat"
  const [attempts, setAttempts] = useState([])
  const [loading,  setLoad]     = useState(true)
  const [filter,   setFilter]   = useState("all")
  const [selected, setSelected] = useState(new Set())
  const [mode,     setMode]     = useState("review")  // "review" | "reattempt"
  const [reattemptIdx, setRAIdx]  = useState(0)
  const [rAnswer, setRAnswer]   = useState(null)
  const [rResult, setRResult]   = useState(null)  // "correct" | "wrong"
  const [search,  setSearch]    = useState("")

  useEffect(() => {
    api.get("/learn/quiz-attempts/?wrong_only=true&exam=" + exam)
      .then(({ data }) => setAttempts(data.attempts || []))
      .catch(() => setAttempts(DEMO))
      .finally(() => setLoad(false))
  }, [exam])

  const sections = [...new Set(attempts.map(a => a.section).filter(Boolean))]

  const filtered = attempts.filter(a => {
    const matchSec    = filter === "all" || a.section === filter
    const matchSearch = !search || a.question_text?.toLowerCase().includes(search.toLowerCase()) || a.topic?.toLowerCase().includes(search.toLowerCase())
    return matchSec && matchSearch
  })

  const toggleSelect = (id) => setSelected(s => { const n=new Set(s); n.has(id)?n.delete(id):n.add(id); return n })
  const selectAll    = () => setSelected(new Set(filtered.map(a => a.id)))
  const clearSelect  = () => setSelected(new Set())

  const reattemptList = filtered.filter(a => selected.has(a.id))
  const currentRA    = reattemptList[reattemptIdx]

  const submitRA = (key) => {
    if (!currentRA) return
    const isCorrect = key.toUpperCase() === (currentRA.correct_answer || "").toUpperCase()
    setRAnswer(key)
    setRResult(isCorrect ? "correct" : "wrong")
  }

  const nextRA = () => {
    setRAnswer(null)
    setRResult(null)
    if (reattemptIdx < reattemptList.length - 1) {
      setRAIdx(i => i + 1)
    } else {
      setMode("review")
      setRAIdx(0)
      setRAnswer(null)
      setRResult(null)
    }
  }

  if (mode === "reattempt" && currentRA) {
    return (
      <div style={{ minHeight:"100vh", background:"#0f0f0f", color:"#fff" }}>
        <Head><title>Re-attempt — GRADSKOOL</title></Head>
        <div style={{ height:"52px", background:"#1a1a1a", borderBottom:"1px solid #333", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 1.5rem" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"1rem" }}>
            <button onClick={() => { setMode("review"); setRAIdx(0); setRAnswer(null); setRResult(null) }}
              style={{ background:"none", border:"none", color:"rgba(255,255,255,0.4)", cursor:"pointer", fontFamily:"var(--font-sans)", fontSize:"0.75rem" }}>✕ Exit</button>
            <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.82rem", fontWeight:"700", color:"#fff" }}>
              Re-attempt {reattemptIdx + 1}/{reattemptList.length}
            </span>
          </div>
          <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.72rem", color:"rgba(255,255,255,0.4)" }}>{currentRA.section} · {currentRA.topic}</span>
        </div>

        <div style={{ maxWidth:"680px", margin:"0 auto", padding:"3rem 1.5rem" }}>
          <p style={{ fontFamily:"Georgia,serif", fontSize:"1.1rem", color:"#fff", lineHeight:1.8, marginBottom:"2rem" }}>{currentRA.question_text}</p>

          <div style={{ display:"flex", flexDirection:"column", gap:"0.625rem", marginBottom:"2rem" }}>
            {currentRA.options?.map(opt => {
              const isSelected = rAnswer === opt.key
              const isCorrect  = opt.key.toUpperCase() === (currentRA.correct_answer || "").toUpperCase()
              let bg = "rgba(255,255,255,0.04)"
              let border = "#333"
              let color = "rgba(255,255,255,0.75)"
              if (rAnswer) {
                if (isCorrect) { bg="rgba(34,197,94,0.15)"; border="rgba(34,197,94,0.5)"; color="#4ade80" }
                else if (isSelected && !isCorrect) { bg="rgba(239,68,68,0.15)"; border="rgba(239,68,68,0.5)"; color="#f87171" }
              } else {
                if (isSelected) { bg="rgba(59,130,246,0.15)"; border="#3b82f6" }
              }
              return (
                <button key={opt.key} onClick={() => !rAnswer && submitRA(opt.key)} disabled={!!rAnswer}
                  style={{ display:"flex", gap:"0.875rem", padding:"1rem 1.25rem", borderRadius:"8px", background:bg, border:"1px solid "+border, cursor:rAnswer?"default":"pointer", textAlign:"left" }}>
                  <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.8rem", fontWeight:"700", color, flexShrink:0 }}>{opt.key}.</span>
                  <span style={{ fontFamily:"Georgia,serif", fontSize:"0.95rem", color, lineHeight:1.6 }}>{opt.text}</span>
                  {rAnswer && isCorrect && <span style={{ marginLeft:"auto", color:"#4ade80", flexShrink:0 }}>✓</span>}
                  {rAnswer && isSelected && !isCorrect && <span style={{ marginLeft:"auto", color:"#f87171", flexShrink:0 }}>✗</span>}
                </button>
              )
            })}
          </div>

          {rAnswer && (
            <div>
              {currentRA.explanation && (
                <div style={{ background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:"8px", padding:"1rem", marginBottom:"1rem" }}>
                  <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.68rem", fontWeight:"700", color:"#f59e0b", marginBottom:"0.3rem" }}>Explanation</p>
                  <p style={{ fontFamily:"Georgia,serif", fontSize:"0.875rem", color:"rgba(255,255,255,0.8)", lineHeight:1.7 }}>{currentRA.explanation}</p>
                </div>
              )}
              <button onClick={nextRA}
                style={{ width:"100%", padding:"0.875rem", background:C.red, color:"#fff", border:"none", borderRadius:"6px", fontFamily:"var(--font-sans)", fontSize:"0.875rem", fontWeight:"700", cursor:"pointer" }}>
                {reattemptIdx < reattemptList.length - 1 ? "Next Question →" : "Finish Re-attempt"}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight:"100vh", background:C.bg }}>
      <Head><title>Wrong Answer Analysis — GRADSKOOL</title></Head>
      <div style={{ height:"52px", background:C.white, borderBottom:"1px solid "+C.border, display:"flex", alignItems:"center", padding:"0 1.5rem", gap:"1rem", position:"sticky", top:0, zIndex:100 }}>
        <Link href="/dashboard?tab=today" style={{ fontFamily:"var(--font-sans)", fontSize:"0.75rem", color:C.gray, textDecoration:"none" }}>← Dashboard</Link>
        <span style={{ color:C.border }}>|</span>
        <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.82rem", fontWeight:"700", color:C.black }}>Wrong Answer Analysis</span>
        <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.68rem", color:C.gray, background:C.muted, padding:"0.1rem 0.5rem", borderRadius:"100px" }}>{filtered.length} questions</span>
        {selected.size > 0 && (
          <button onClick={() => { setMode("reattempt"); setRAIdx(0); setRAnswer(null); setRResult(null) }}
            style={{ marginLeft:"auto", fontFamily:"var(--font-sans)", fontSize:"0.78rem", fontWeight:"700", padding:"0.4rem 1rem", background:C.red, color:"#fff", border:"none", borderRadius:"4px", cursor:"pointer" }}>
            Re-attempt {selected.size} selected →
          </button>
        )}
      </div>

      <div style={{ maxWidth:"800px", margin:"0 auto", padding:"2rem" }}>
        {/* Controls */}
        <div style={{ display:"flex", gap:"0.75rem", marginBottom:"1.5rem", flexWrap:"wrap", alignItems:"center" }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search questions..."
            style={{ flex:"1", minWidth:"180px", padding:"0.5rem 0.75rem", fontFamily:"var(--font-sans)", fontSize:"0.82rem", border:"1px solid "+C.border, borderRadius:"4px", outline:"none" }} />
          <div style={{ display:"flex", gap:"0.375rem", flexWrap:"wrap" }}>
            {["all", ...sections].map(s => (
              <button key={s} onClick={()=>setFilter(s)}
                style={{ fontFamily:"var(--font-sans)", fontSize:"0.72rem", padding:"0.3rem 0.875rem", border:"1px solid "+(filter===s?C.red:C.border), borderRadius:"100px", background:filter===s?"#fff5f5":C.white, color:filter===s?C.red:C.gray, cursor:"pointer", fontWeight:filter===s?"700":"400" }}>
                {s === "all" ? "All" : s}
              </button>
            ))}
          </div>
          <div style={{ display:"flex", gap:"0.375rem" }}>
            <button onClick={selectAll} style={{ fontFamily:"var(--font-sans)", fontSize:"0.68rem", padding:"0.3rem 0.625rem", border:"1px solid "+C.border, borderRadius:"3px", background:C.white, cursor:"pointer", color:C.gray }}>Select all</button>
            {selected.size > 0 && <button onClick={clearSelect} style={{ fontFamily:"var(--font-sans)", fontSize:"0.68rem", padding:"0.3rem 0.625rem", border:"none", background:"none", cursor:"pointer", color:C.gray }}>Clear</button>}
          </div>
        </div>

        {loading ? <p style={{ textAlign:"center", fontFamily:"Georgia,serif", color:C.gray, padding:"4rem" }}>Loading…</p>
        : !filtered.length ? <p style={{ textAlign:"center", fontFamily:"Georgia,serif", color:C.gray, padding:"4rem" }}>No wrong answers yet — keep practicing!</p>
        : filtered.map((a, i) => (
          <div key={a.id||i} onClick={() => toggleSelect(a.id||i)}
            style={{ background:C.white, border:"1px solid "+(selected.has(a.id||i)?"#3b82f6":C.border), borderLeft:"4px solid "+(selected.has(a.id||i)?C.red:"#fca5a5"), borderRadius:"6px", padding:"1.25rem", marginBottom:"1rem", cursor:"pointer", transition:"border-color .15s" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"0.625rem", flexWrap:"wrap", gap:"0.5rem" }}>
              <div style={{ display:"flex", gap:"0.5rem", alignItems:"center" }}>
                <input type="checkbox" checked={selected.has(a.id||i)} onChange={()=>toggleSelect(a.id||i)} onClick={e=>e.stopPropagation()} style={{ flexShrink:0 }} />
                <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.65rem", fontWeight:"700", color:C.gray, textTransform:"uppercase", letterSpacing:"0.06em" }}>{a.section} · {a.topic}</span>
              </div>
              <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.65rem", color:C.gray }}>{a.date}</span>
            </div>
            <p style={{ fontFamily:"Georgia,serif", fontSize:"0.9rem", color:C.black, lineHeight:1.7, marginBottom:"1rem" }}>{a.question_text}</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.375rem", marginBottom:"0.75rem" }}>
              {a.options?.map(opt => {
                const isCorrect  = opt.key.toUpperCase() === (a.correct_answer || "").toUpperCase()
                const isSelected = opt.key === a.selected
                return (
                  <div key={opt.key} style={{ padding:"0.375rem 0.625rem", borderRadius:"3px", fontFamily:"var(--font-sans)", fontSize:"0.72rem",
                    background:isCorrect?"#dcfce7":isSelected?"#fee2e2":C.muted,
                    border:"1px solid "+(isCorrect?"#86efac":isSelected?"#fca5a5":C.border),
                    display:"flex", gap:"0.375rem", alignItems:"center",
                    color:isCorrect?"#166534":isSelected?"#991b1b":C.gray }}>
                    <span style={{ fontWeight:"700", flexShrink:0 }}>{opt.key}.</span>
                    <span style={{ flex:1 }}>{opt.text}</span>
                    {isCorrect && <span>✓</span>}
                    {isSelected && !isCorrect && <span>✗ You</span>}
                  </div>
                )
              })}
            </div>
            {a.explanation && (
              <div style={{ background:"#fffbeb", border:"1px solid #fcd34d", borderRadius:"4px", padding:"0.75rem", fontFamily:"var(--font-sans)", fontSize:"0.72rem", color:"#92400e", lineHeight:1.6 }}>
                💡 {a.explanation}
              </div>
            )}
          </div>
        ))}

        {/* Floating re-attempt button */}
        {selected.size > 0 && (
          <div style={{ position:"fixed", bottom:"2rem", right:"2rem", zIndex:100 }}>
            <button onClick={() => { setMode("reattempt"); setRAIdx(0); setRAnswer(null); setRResult(null) }}
              style={{ padding:"0.875rem 1.5rem", background:C.red, color:"#fff", border:"none", borderRadius:"50px", fontFamily:"var(--font-sans)", fontSize:"0.875rem", fontWeight:"700", cursor:"pointer", boxShadow:"0 8px 32px rgba(255,94,95,0.4)" }}>
              Re-attempt {selected.size} question{selected.size!==1?"s":""} →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const DEMO = [
  { id:1, question_text:"A train 200m long passes a pole in 10s. What is its speed in km/h?", section:"QA", topic:"TSD", date:"May 21", selected:"a", correct_answer:"b", explanation:"Speed = 200/10 = 20 m/s. Convert: 20 × 18/5 = 72 km/h.", options:[{key:"a",text:"60 km/h"},{key:"b",text:"72 km/h"},{key:"c",text:"80 km/h"},{key:"d",text:"90 km/h"}] },
  { id:2, question_text:"If 15% of x = 20% of y, what is x:y?", section:"QA", topic:"Percentages", date:"May 19", selected:"d", correct_answer:"a", explanation:"15x = 20y so x/y = 20/15 = 4/3", options:[{key:"a",text:"4:3"},{key:"b",text:"3:4"},{key:"c",text:"2:3"},{key:"d",text:"3:2"}] },
]

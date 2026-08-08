/**
 * GRADSKOOL — Concept Glossary
 * Route: /learn/[examSlug]/glossary
 * Searchable dictionary of CAT/MBA concepts with examples and quick MCQs
 */
import { useState, useEffect } from "react"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { ProtectedRoute } from "../../../components/auth/ProtectedRoute"
import api from "../../../lib/api"

const C = { red:"#ff5e5f",black:"#0f0f0f",white:"#fff",bg:"#f7f6f3",border:"#e8e8e6",gray:"#999",green:"#22c55e",blue:"#3b82f6",muted:"#f4f3f0",amber:"#f59e0b" }

const DEMO_CONCEPTS = [
  { id:1, name:"Time, Speed & Distance", category:"QA", formula:"Distance = Speed × Time", notes:"Key shortcuts: relative speed for same/opposite direction. TSD forms ~8% of CAT QA.", example:"A train 200m long passes a pole in 10s. Speed = 200/10 = 20 m/s = 72 km/h", tags:["tsd","speed","train"] },
  { id:2, name:"Percentages", category:"QA", formula:"% Change = (New−Old)/Old × 100", notes:"Successive % changes: multiply the multipliers. Key: 100 is always the base unless stated.", example:"Price up 20% then down 20%: 1.2 × 0.8 = 0.96 → net −4%", tags:["percent","change"] },
  { id:3, name:"Reading Comprehension", category:"VARC", formula:"", notes:"RC is 70% of VARC. Strategy: read question types first, then skim passage, then answer in order.", example:"Inference ≠ Assumption. Inference follows from passage; assumption is unstated premise.", tags:["rc","varc","reading"] },
  { id:4, name:"Para Jumbles", category:"VARC", formula:"", notes:"Find the opening sentence (no pronoun, introduces topic). Find mandatory pairs. Use elimination.", example:"Look for logical connectors: 'However', 'Therefore', 'This' (refers to previous sentence).", tags:["pj","varc","parajumbles"] },
  { id:5, name:"Seating Arrangement", category:"DILR", formula:"", notes:"Circular: total arrangements (n−1)!. Linear: n!. For CAT, always draw the arrangement.", example:"6 people in circle: 5! = 120 ways. With fixed person: 4! = 24.", tags:["seating","dilr","lr"] },
  { id:6, name:"Profit & Loss", category:"QA", formula:"Profit% = Profit/CP × 100", notes:"Marked Price, Cost Price, Selling Price relationships. Discount always on MP.", example:"CP=100, MP=140, Discount=20% → SP=112 → Profit=12%", tags:["profit","loss","discount"] },
]

const CATEGORIES = ["All","QA","VARC","DILR"]

export default function GlossaryPage() { return <ProtectedRoute><Inner /></ProtectedRoute> }

function Inner() {
  const router = useRouter()
  const { examSlug } = router.query
  const [concepts, setConcepts] = useState([])
  const [search,   setSearch]   = useState("")
  const [cat,      setCat]      = useState("All")
  const [selected, setSelected] = useState(null)
  const [loading,  setLoad]     = useState(true)

  useEffect(() => {
    api.get("/tools/qa-topics/?exam=" + examSlug)
      .then(({ data }) => {
        const items = (data.topics || []).map(t => ({
          id: t.id, name: t.name, category: t.category?.toUpperCase() || "QA",
          formula: t.formulas || "", notes: t.concept_notes || "", example: "", tags: [],
        }))
        setConcepts(items.length ? items : DEMO_CONCEPTS)
      })
      .catch(() => setConcepts(DEMO_CONCEPTS))
      .finally(() => setLoad(false))
  }, [examSlug])

  const filtered = concepts.filter(c => {
    const matchCat = cat === "All" || c.category === cat
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.tags?.some(t => t.includes(search.toLowerCase()))
    return matchCat && matchSearch
  })

  return (
    <div style={{ minHeight:"100vh", background:C.bg }}>
      <Head><title>Concept Glossary — {(examSlug||"").toUpperCase()} — GRADSKOOL</title></Head>
      <div style={{ height:"52px", background:C.white, borderBottom:"1px solid "+C.border, display:"flex", alignItems:"center", padding:"0 1.5rem", gap:"1rem" }}>
        <Link href={"/learn/"+examSlug} style={{ fontFamily:"var(--font-sans)", fontSize:"0.75rem", color:C.gray, textDecoration:"none" }}>← {(examSlug||"").toUpperCase()}</Link>
        <span style={{ color:C.border }}>|</span>
        <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.82rem", fontWeight:"700", color:C.black }}>Concept Glossary</span>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"280px 1fr", height:"calc(100vh - 52px)" }}>
        {/* Sidebar */}
        <div style={{ background:C.white, borderRight:"1px solid "+C.border, overflowY:"auto", display:"flex", flexDirection:"column" }}>
          <div style={{ padding:"0.875rem 1rem", borderBottom:"1px solid "+C.border }}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search concepts..." style={{ width:"100%", padding:"0.5rem 0.625rem", fontFamily:"var(--font-sans)", fontSize:"0.82rem", border:"1px solid "+C.border, borderRadius:"4px", outline:"none", boxSizing:"border-box" }} />
          </div>
          <div style={{ padding:"0.625rem 1rem", borderBottom:"1px solid "+C.border, display:"flex", gap:"0.375rem", flexWrap:"wrap" }}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={()=>setCat(c)} style={{ fontFamily:"var(--font-sans)", fontSize:"0.68rem", padding:"0.2rem 0.625rem", border:"1px solid "+(cat===c?C.red:C.border), borderRadius:"100px", background:cat===c?"#fff5f5":C.white, color:cat===c?C.red:C.gray, cursor:"pointer", fontWeight:cat===c?"700":"400" }}>{c}</button>
            ))}
          </div>
          <p style={{ padding:"0.625rem 1rem", fontFamily:"var(--font-sans)", fontSize:"0.65rem", color:C.gray }}>{filtered.length} concepts</p>
          <div style={{ flex:1, overflowY:"auto" }}>
            {filtered.map(c => (
              <div key={c.id} onClick={()=>setSelected(c)}
                style={{ padding:"0.75rem 1rem", borderBottom:"1px solid "+C.border, cursor:"pointer", background:selected?.id===c.id?"#fff5f5":C.white, borderLeft:"3px solid "+(selected?.id===c.id?C.red:"transparent") }}>
                <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.82rem", fontWeight:"600", color:C.black, marginBottom:"0.2rem" }}>{c.name}</p>
                <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.62rem", padding:"0.1rem 0.4rem", borderRadius:"3px", background:c.category==="QA"?"#eff6ff":c.category==="VARC"?"#f3e8ff":"#f0fdf4", color:c.category==="QA"?C.blue:c.category==="VARC"?"#7b2d8b":C.green }}>{c.category}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Detail */}
        <div style={{ overflowY:"auto", padding:"2rem" }}>
          {!selected ? (
            <div style={{ textAlign:"center", padding:"4rem", border:"1px dashed "+C.border, borderRadius:"8px" }}>
              <p style={{ fontSize:"2.5rem", marginBottom:"0.75rem" }}>📖</p>
              <p style={{ fontFamily:"Georgia,serif", color:C.gray }}>Select a concept to see its explanation, formula, and example</p>
            </div>
          ) : (
            <div style={{ maxWidth:"680px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"1.5rem" }}>
                <h1 style={{ fontFamily:"Georgia,serif", fontSize:"1.75rem", fontWeight:"700", color:C.black }}>{selected.name}</h1>
                <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.72rem", padding:"0.2rem 0.625rem", borderRadius:"3px", background:"#eff6ff", color:C.blue }}>{selected.category}</span>
              </div>

              {selected.formula && (
                <div style={{ background:C.black, borderRadius:"8px", padding:"1.25rem", marginBottom:"1.5rem" }}>
                  <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.65rem", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.1em", color:"rgba(255,255,255,0.4)", marginBottom:"0.5rem" }}>Formula</p>
                  <p style={{ fontFamily:"'SF Mono',monospace", fontSize:"1rem", color:"#fff", fontWeight:"500" }}>{selected.formula}</p>
                </div>
              )}

              {selected.notes && (
                <div style={{ background:C.white, border:"1px solid "+C.border, borderRadius:"8px", padding:"1.25rem", marginBottom:"1.5rem" }}>
                  <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.65rem", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.1em", color:C.gray, marginBottom:"0.75rem" }}>Key Points</p>
                  <p style={{ fontFamily:"Georgia,serif", fontSize:"0.9rem", color:C.black, lineHeight:1.8 }}>{selected.notes}</p>
                </div>
              )}

              {selected.example && (
                <div style={{ background:"#fffbeb", border:"1px solid #fcd34d", borderRadius:"8px", padding:"1.25rem", marginBottom:"1.5rem" }}>
                  <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.65rem", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.1em", color:"#92400e", marginBottom:"0.75rem" }}>Worked Example</p>
                  <p style={{ fontFamily:"Georgia,serif", fontSize:"0.875rem", color:"#78350f", lineHeight:1.8 }}>{selected.example}</p>
                </div>
              )}

              <div style={{ display:"flex", gap:"0.75rem" }}>
                <Link href={"/learn/"+examSlug+"/adaptive-quiz?concept="+selected.id}
                  style={{ padding:"0.625rem 1.25rem", background:C.red, color:"#fff", borderRadius:"6px", fontFamily:"var(--font-sans)", fontSize:"0.82rem", fontWeight:"700", textDecoration:"none" }}>
                  🧠 Practice Questions →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

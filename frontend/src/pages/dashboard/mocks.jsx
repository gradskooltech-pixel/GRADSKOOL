/**
 * GRADSKOOL — My Mocks
 * Route: /dashboard/mocks
 * Shows student's Testfunda credentials + mock schedule + score tracker
 */
import { useState, useEffect } from "react"
import Head from "next/head"
import Link from "next/link"
import { ProtectedRoute } from "../../components/auth/ProtectedRoute"
import { useAuth } from "../../hooks/useAuth"
import api from "../../lib/api"

const C = {
  red:"#ff5e5f", black:"#0f0f0f", white:"#fff", bg:"#f7f6f3",
  border:"#e8e8e6", gray:"#999", green:"#22c55e", amber:"#f59e0b",
  blue:"#3b82f6", muted:"#f4f3f0",
}

export default function MyMocks() { return <ProtectedRoute><Inner /></ProtectedRoute> }

function Inner() {
  const { user } = useAuth()
  const [creds,    setCreds]   = useState([])
  const [schedule, setSchedule] = useState([])
  const [loading,  setLoad]    = useState(true)
  const [copied,   setCopied]  = useState(null)  // which field was copied
  const [showPass, setShowPass] = useState({})    // {credId: bool}

  const exam = user?.target_exam || "cat"

  useEffect(() => {
    setLoad(true)
    Promise.all([
      api.get("/enrollments/mock-credentials/"),
      api.get("/dashboard/mock-schedule/?exam=" + exam),
    ]).then(([c, s]) => {
      setCreds(c.data || [])
      setSchedule(s.data || [])
    }).catch(() => {
      setCreds([])
      setSchedule([])
    }).finally(() => setLoad(false))
  }, [exam])

  const copy = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  const togglePass = (id) => setShowPass(p => ({ ...p, [id]: !p[id] }))

  // Group schedule by upcoming vs past
  const today = new Date()
  const upcoming = schedule.filter(s => new Date(s.release_date) >= today).slice(0, 8)
  const past     = schedule.filter(s => new Date(s.release_date) < today).slice(0, 5)

  return (
    <div style={{ minHeight:"100vh", background:C.bg }}>
      <Head><title>My Mocks — GRADSKOOL</title></Head>

      <div style={{ height:"52px", background:C.white, borderBottom:"1px solid "+C.border, display:"flex", alignItems:"center", padding:"0 1.5rem", gap:"1rem" }}>
        <Link href="/dashboard" style={{ fontFamily:"var(--font-sans)", fontSize:"0.75rem", color:C.gray, textDecoration:"none" }}>← Dashboard</Link>
        <span style={{ color:C.border }}>|</span>
        <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.82rem", fontWeight:"700", color:C.black }}>My Mocks</span>
        <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.68rem", color:C.gray, background:C.muted, padding:"0.1rem 0.5rem", borderRadius:"100px" }}>{exam.toUpperCase()}</span>
        <div style={{ marginLeft:"auto" }}>
          <Link href="/dashboard/mock-scores" style={{ fontFamily:"var(--font-sans)", fontSize:"0.75rem", color:C.red, textDecoration:"none", fontWeight:"700" }}>
            📊 Track scores →
          </Link>
        </div>
      </div>

      <div style={{ maxWidth:"800px", margin:"0 auto", padding:"2rem" }}>

        {loading ? (
          <p style={{ textAlign:"center", fontFamily:"Georgia,serif", color:C.gray, padding:"4rem" }}>Loading…</p>
        ) : (
          <>
            {/* ── CREDENTIALS SECTION ─────────────────────────────────────── */}
            <div style={{ marginBottom:"2.5rem" }}>
              <p style={sLabel}>Your Mock Test Credentials</p>

              {creds.length === 0 ? (
                <div style={{ background:C.white, border:"1px solid "+C.border, borderRadius:"8px", padding:"2.5rem", textAlign:"center", marginTop:"0.875rem" }}>
                  <p style={{ fontSize:"2rem", marginBottom:"0.75rem" }}>🔐</p>
                  <p style={{ fontFamily:"Georgia,serif", fontSize:"1rem", fontWeight:"700", color:C.black, marginBottom:"0.5rem" }}>
                    No credentials yet
                  </p>
                  <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.82rem", color:C.gray, lineHeight:1.7, maxWidth:"380px", margin:"0 auto 1.5rem" }}>
                    Your Testfunda login credentials will appear here once your instructor sends them.
                    You'll also get a notification.
                  </p>
                  <div style={{ background:C.muted, borderRadius:"6px", padding:"1rem", fontFamily:"var(--font-sans)", fontSize:"0.75rem", color:C.gray, textAlign:"left", maxWidth:"400px", margin:"0 auto" }}>
                    <p style={{ fontWeight:"700", marginBottom:"0.375rem", color:C.black }}>How it works:</p>
                    <p>1. Enrol in a course with mocks</p>
                    <p>2. Your instructor sends you Testfunda credentials</p>
                    <p>3. They appear here — username + password + direct link</p>
                    <p>4. Log your scores back here after each mock</p>
                  </div>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:"1rem", marginTop:"0.875rem" }}>
                  {creds.map(c => (
                    <div key={c.id} style={{ background:C.white, border:"1px solid "+C.border, borderRadius:"10px", overflow:"hidden" }}>
                      {/* Card header */}
                      <div style={{ background:C.black, padding:"1rem 1.25rem", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <div>
                          <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.65rem", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.1em", color:"rgba(255,255,255,0.4)", marginBottom:"0.2rem" }}>
                            {c.exam_name || exam.toUpperCase()} — Mock Access
                          </p>
                          <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.7rem", color:"rgba(255,255,255,0.3)" }}>
                            Sent on {new Date(c.sent_at).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}
                          </p>
                        </div>
                        <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.65rem", fontWeight:"700", padding:"0.25rem 0.75rem", borderRadius:"100px", background:"rgba(34,197,94,0.2)", color:"#4ade80" }}>
                          ✓ Active
                        </span>
                      </div>

                      {/* Credentials */}
                      <div style={{ padding:"1.25rem" }}>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem", marginBottom:"1rem" }}>
                          {/* Username */}
                          <div style={{ background:C.muted, borderRadius:"6px", padding:"0.875rem 1rem" }}>
                            <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.6rem", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.08em", color:C.gray, marginBottom:"0.375rem" }}>Username</p>
                            <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                              <p style={{ fontFamily:"'SF Mono',monospace", fontSize:"0.875rem", fontWeight:"700", color:C.black, flex:1 }}>{c.username}</p>
                              <button onClick={() => copy(c.username, c.id+"_user")}
                                style={{ background:"none", border:"1px solid "+C.border, borderRadius:"3px", padding:"0.2rem 0.5rem", cursor:"pointer", fontFamily:"var(--font-sans)", fontSize:"0.65rem", color:copied===c.id+"_user" ? C.green : C.gray }}>
                                {copied===c.id+"_user" ? "✓ Copied" : "Copy"}
                              </button>
                            </div>
                          </div>

                          {/* Password */}
                          <div style={{ background:C.muted, borderRadius:"6px", padding:"0.875rem 1rem" }}>
                            <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.6rem", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.08em", color:C.gray, marginBottom:"0.375rem" }}>Password</p>
                            <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                              <p style={{ fontFamily:"'SF Mono',monospace", fontSize:"0.875rem", fontWeight:"700", color:C.black, flex:1, letterSpacing:showPass[c.id] ? "normal" : "0.15em" }}>
                                {showPass[c.id] ? c.password : "•".repeat(Math.min(c.password.length, 10))}
                              </p>
                              <button onClick={() => togglePass(c.id)}
                                style={{ background:"none", border:"1px solid "+C.border, borderRadius:"3px", padding:"0.2rem 0.5rem", cursor:"pointer", fontFamily:"var(--font-sans)", fontSize:"0.65rem", color:C.gray }}>
                                {showPass[c.id] ? "Hide" : "Show"}
                              </button>
                              <button onClick={() => copy(c.password, c.id+"_pass")}
                                style={{ background:"none", border:"1px solid "+C.border, borderRadius:"3px", padding:"0.2rem 0.5rem", cursor:"pointer", fontFamily:"var(--font-sans)", fontSize:"0.65rem", color:copied===c.id+"_pass" ? C.green : C.gray }}>
                                {copied===c.id+"_pass" ? "✓" : "Copy"}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Note from instructor */}
                        {c.note && (
                          <div style={{ background:"#fffbeb", border:"1px solid #fcd34d", borderRadius:"6px", padding:"0.75rem 1rem", marginBottom:"1rem", fontFamily:"var(--font-sans)", fontSize:"0.78rem", color:"#92400e", lineHeight:1.6 }}>
                            💬 {c.note}
                          </div>
                        )}

                        {/* Open mock portal button */}
                        <a href={c.platform_url || "https://testfunda.com"} target="_blank" rel="noreferrer"
                          style={{ display:"inline-flex", alignItems:"center", gap:"0.5rem", padding:"0.75rem 1.5rem", background:C.red, color:"#fff", borderRadius:"6px", fontFamily:"var(--font-sans)", fontSize:"0.875rem", fontWeight:"700", textDecoration:"none" }}>
                          Open Mock Portal →
                        </a>
                        <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.65rem", color:C.gray, marginTop:"0.5rem" }}>
                          Opens Testfunda — use the username and password above to log in
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── MOCK SCHEDULE ──────────────────────────────────────────────── */}
            {(upcoming.length > 0 || past.length > 0) && (
              <div style={{ marginBottom:"2.5rem" }}>
                <p style={sLabel}>Mock Schedule</p>
                <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem", marginTop:"0.875rem" }}>
                  {upcoming.map(s => {
                    const date    = new Date(s.release_date)
                    const daysAway = Math.ceil((date - today) / (1000 * 60 * 60 * 24))
                    return (
                      <div key={s.id} style={{ display:"flex", alignItems:"center", gap:"1rem", background:C.white, border:"1px solid "+C.border, borderRadius:"6px", padding:"0.875rem 1.25rem" }}>
                        <div style={{ width:"48px", height:"48px", borderRadius:"6px", background:C.red, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                          <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.7rem", fontWeight:"700", color:"rgba(255,255,255,0.6)", lineHeight:1 }}>{date.toLocaleDateString("en-IN",{month:"short"})}</p>
                          <p style={{ fontFamily:"Georgia,serif", fontSize:"1.1rem", fontWeight:"700", color:"#fff", lineHeight:1 }}>{date.getDate()}</p>
                        </div>
                        <div style={{ flex:1 }}>
                          <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.82rem", fontWeight:"600", color:C.black, marginBottom:"0.15rem" }}>{s.name || s.entry_type}</p>
                          <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.65rem", color:C.gray }}>
                            {s.entry_type?.replace("_"," ")} · {date.toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"})}
                          </p>
                        </div>
                        <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.72rem", fontWeight:"700", color:daysAway <= 3 ? C.red : C.amber, flexShrink:0 }}>
                          {daysAway === 0 ? "Today!" : daysAway === 1 ? "Tomorrow" : `In ${daysAway} days`}
                        </span>
                      </div>
                    )
                  })}
                  {past.slice(0,3).map(s => (
                    <div key={s.id} style={{ display:"flex", alignItems:"center", gap:"1rem", background:C.muted, border:"1px solid "+C.border, borderRadius:"6px", padding:"0.875rem 1.25rem", opacity:0.6 }}>
                      <div style={{ width:"48px", height:"48px", borderRadius:"6px", background:C.gray, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.7rem", color:"rgba(255,255,255,0.6)", lineHeight:1 }}>{new Date(s.release_date).toLocaleDateString("en-IN",{month:"short"})}</p>
                        <p style={{ fontFamily:"Georgia,serif", fontSize:"1.1rem", fontWeight:"700", color:"#fff", lineHeight:1 }}>{new Date(s.release_date).getDate()}</p>
                      </div>
                      <div style={{ flex:1 }}>
                        <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.82rem", fontWeight:"600", color:C.black }}>{s.name || s.entry_type}</p>
                        <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.65rem", color:C.gray }}>
                          {new Date(s.release_date).toLocaleDateString("en-IN",{day:"numeric",month:"long"})} · Past
                        </p>
                      </div>
                      <Link href="/dashboard/mock-scores" style={{ fontFamily:"var(--font-sans)", fontSize:"0.72rem", color:C.red, textDecoration:"none", fontWeight:"700", flexShrink:0 }}>
                        Log score →
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── NO CREDENTIALS CTA ─────────────────────────────────────── */}
            <div style={{ background:C.black, borderRadius:"8px", padding:"1.5rem", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"1rem" }}>
              <div>
                <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.875rem", fontWeight:"700", color:"#fff", marginBottom:"0.2rem" }}>Track your mock scores</p>
                <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.72rem", color:"rgba(255,255,255,0.5)" }}>Log each mock after you take it. See your score trend and identify weak sections.</p>
              </div>
              <Link href="/dashboard/mock-scores"
                style={{ fontFamily:"var(--font-sans)", fontSize:"0.82rem", fontWeight:"700", padding:"0.625rem 1.25rem", background:C.red, color:"#fff", borderRadius:"4px", textDecoration:"none", flexShrink:0 }}>
                Mock Score Tracker →
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const sLabel = { fontFamily:"var(--font-sans)", fontSize:"0.65rem", fontWeight:"700", letterSpacing:"0.1em", textTransform:"uppercase", color:"#999" }

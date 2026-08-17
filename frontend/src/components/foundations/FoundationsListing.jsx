/**
 * GRADSKOOL — Foundations Listing (shared component)
 *
 * Renders the "browse this exam's free classes" page. Used under TWO
 * different URL prefixes depending on positioning:
 *   - /foundations/xat        → genuine starter/foundations content
 *   - /courses/nmat/live      → the complete free course (paired with the
 *                                paid Mocks page at /courses/nmat)
 *   - /courses/snap/live      → same idea for SNAP
 *
 * `readBasePath` controls where class links point — that's the only real
 * difference between the two contexts, everything else is identical.
 */
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '../../hooks/useAuth'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export function isUpcoming(iso) { return iso ? new Date(iso) > new Date() : false }

// True only during the class's actual scheduled window (start time through
// start + duration) — not just "today" or "recently". Used to show a
// "Live Now" section that appears exactly when a class is happening and
// disappears the moment it ends, without needing a page refresh (the
// component re-checks this on a timer — see the useEffect below).
export function isLiveNow(cls) {
  if (!cls.scheduled_at) return false
  const start = new Date(cls.scheduled_at).getTime()
  const end = start + (cls.duration_mins || 60) * 60000
  const now = Date.now()
  return now >= start && now <= end
}

export function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
}

export function formatTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', timeZoneName:'short' })
}

export function Countdown({ iso }) {
  const [diff, setDiff] = useState(null)
  useEffect(() => {
    const tick = () => {
      const d = new Date(iso) - new Date()
      if (d <= 0) { setDiff(null); return }
      const days  = Math.floor(d / 86400000)
      const hours = Math.floor((d % 86400000) / 3600000)
      const mins  = Math.floor((d % 3600000) / 60000)
      setDiff({ days, hours, mins })
    }
    tick()
    const id = setInterval(tick, 60000)
    return () => clearInterval(id)
  }, [iso])

  if (!diff) return null
  return (
    <div style={{ display:'flex', gap:12, marginTop:10, flexWrap:'wrap' }}>
      {[['days','Days'],['hours','Hrs'],['mins','Min']].map(([k,u]) => (
        <div key={k} style={{ textAlign:'center', background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.1)', borderRadius:3, padding:'6px 12px', minWidth:52 }}>
          <div style={{ fontFamily:'var(--font-serif)', fontSize:22, color:'#fff', lineHeight:1 }}>{diff[k]}</div>
          <div style={{ fontFamily:'var(--font-sans)', fontSize:9, color:'rgba(255,255,255,.4)', letterSpacing:'.08em', textTransform:'uppercase', marginTop:2 }}>{u}</div>
        </div>
      ))}
    </div>
  )
}

export function YTThumb({ url, clickable = true }) {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|live\/))([a-zA-Z0-9_-]{11})/)
  if (!m) return null
  return (
    <div style={{ position:'relative', aspectRatio:'16/9', background:'#000', borderRadius:3, overflow:'hidden', cursor: clickable ? 'pointer' : 'default' }}
      onClick={clickable ? () => window.open(url,'_blank') : undefined}>
      <img src={`https://img.youtube.com/vi/${m[1]}/hqdefault.jpg`} alt=""
        style={{ width:'100%', height:'100%', objectFit:'cover', opacity:.85 }} />
      {clickable && (
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width:48, height:48, borderRadius:'50%', background:'rgba(255,255,255,.92)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 12px rgba(0,0,0,.3)' }}>
            <div style={{ width:0, height:0, borderTop:'10px solid transparent', borderBottom:'10px solid transparent', borderLeft:'16px solid #ff4444', marginLeft:4 }} />
          </div>
        </div>
      )}
    </div>
  )
}

export function ClassCard({ cls, meta, readBasePath }) {
  // A YouTube URL can exist BEFORE the class happens — a pre-scheduled
  // Live link is a real, stable URL from the moment it's created, not
  // just after the stream ends. So "has a video" and "is upcoming" are
  // independent, not mutually exclusive.
  const hasVideo    = !!cls.youtube_url
  const isFuture    = isUpcoming(cls.scheduled_at)
  const isLiveSoon  = hasVideo && isFuture       // thumbnail exists, hasn't aired yet
  const isRecorded  = hasVideo && !isFuture      // thumbnail exists, already happened
  const isBlankSoon = !hasVideo && isFuture      // no link yet, hasn't happened
  return (
    <div style={{ background:'#fff' }}>
      {hasVideo && (
        <div style={{ position:'relative' }}>
          <YTThumb url={cls.youtube_url} clickable={!isLiveSoon} />
          {isLiveSoon && (
            <div style={{ position:'absolute', top:8, left:8, fontFamily:'var(--font-sans)', fontSize:9, fontWeight:700, letterSpacing:'.05em', textTransform:'uppercase', padding:'3px 8px', borderRadius:2, background:'rgba(0,0,0,.75)', color:'#fff' }}>
              Upcoming
            </div>
          )}
        </div>
      )}
      {!hasVideo && (
        <div style={{ aspectRatio:'16/9', background: isBlankSoon ? 'var(--black)' : 'var(--g100)', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:6 }}>
          {isBlankSoon ? (
            <>
              <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:700, color:'rgba(255,255,255,.4)', letterSpacing:'.1em', textTransform:'uppercase' }}>Upcoming</div>
              <div style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'rgba(255,255,255,.6)', textAlign:'center', padding:'0 16px' }}>{formatDate(cls.scheduled_at)}</div>
            </>
          ) : (
            <div style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'var(--g500)' }}>Recording coming soon</div>
          )}
        </div>
      )}
      <div style={{ padding:'16px 18px' }}>
        <div style={{ display:'flex', gap:6, marginBottom:8, alignItems:'center' }}>
          <span style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:700, color:meta.color }}>L{cls.lesson_number}</span>
          <span style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:600, padding:'2px 7px', borderRadius:2,
            background: isRecorded ? '#dcfce7' : (isLiveSoon || isBlankSoon) ? '#eff6ff' : '#fef3c7',
            color:      isRecorded ? '#166534' : (isLiveSoon || isBlankSoon) ? '#1d4ed8' : '#92400e' }}>
            {isRecorded ? 'Recording available' : isLiveSoon ? 'Upcoming — link ready' : isBlankSoon ? 'Live soon' : 'Recording soon'}
          </span>
        </div>
        <div style={{ fontFamily:'var(--font-serif)', fontSize:16, color:'var(--black)', lineHeight:1.3, marginBottom:6 }}>{cls.title}</div>
        {cls.description && <p style={{ fontFamily:'var(--font-body)', fontSize:12, color:'var(--g700)', lineHeight:1.6, marginBottom:10 }}>{cls.description}</p>}
        <div style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'var(--g500)', marginBottom:12 }}>
          {formatDate(cls.scheduled_at)} · {cls.duration_mins} min · Free
        </div>
        {hasVideo && (
          <Link href={`${readBasePath}/${cls.slug}`}
            style={{ fontFamily:'var(--font-sans)', fontSize:12, fontWeight:600, color:meta.color, borderBottom:`1px solid ${meta.color}44` }}>
            {isLiveSoon ? 'View class →' : 'View class + notes →'}
          </Link>
        )}
        {isBlankSoon && (
          <Link href={`${readBasePath}/${cls.slug}`}
            style={{ fontFamily:'var(--font-sans)', fontSize:12, fontWeight:600, color:'#ff4444', borderBottom:'1px solid #ff444444' }}>
            View class →
          </Link>
        )}
      </div>
    </div>
  )
}

// A single collapsible month section within a series. Defaults open only
// if defaultOpen is true (the current month) or forceOpen is true (search
// active and this month has a match) — every other month starts collapsed,
// which is what actually keeps a 100+ class series scannable.
function MonthGroup({ group, meta, readBasePath, defaultOpen, forceOpen }) {
  const [open, setOpen] = useState(defaultOpen)
  const isOpen = forceOpen || open

  return (
    <div style={{ marginBottom:16, border:'1px solid var(--g200)', borderRadius:4, overflow:'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center',
          padding:'14px 20px', background: isOpen ? 'var(--off)' : '#fff', border:'none', cursor:'pointer', textAlign:'left',
        }}>
        <span style={{ fontFamily:'var(--font-serif)', fontSize:16, color:'var(--black)' }}>{group.label}</span>
        <span style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'var(--g500)' }}>{group.items.length} class{group.items.length === 1 ? '' : 'es'}</span>
          <span style={{ fontFamily:'var(--font-sans)', fontSize:12, color:meta.color, transform: isOpen ? 'rotate(180deg)' : 'none', transition:'transform .15s', display:'inline-block' }}>▾</span>
        </span>
      </button>
      {isOpen && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:1, background:'var(--g200)', borderTop:'1px solid var(--g200)' }}>
          {group.items.map(cls => <ClassCard key={cls.id} cls={cls} meta={meta} readBasePath={readBasePath} />)}
        </div>
      )}
    </div>
  )
}
function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

// Groups a flat class list into month buckets (newest month first), each
// bucket's classes sorted by lesson number. Classes with no scheduled_at
// land in an "Unscheduled" bucket at the end. Used to keep a 100+ class
// series from rendering as one long, unscannable grid.
function groupByMonth(classes) {
  const buckets = new Map() // key: 'YYYY-MM' or 'unscheduled' -> { label, sortKey, items }
  for (const c of classes) {
    let key, label, sortKey
    if (c.scheduled_at) {
      const d = new Date(c.scheduled_at)
      key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`
      label = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
      sortKey = d.getFullYear() * 12 + d.getMonth()
    } else {
      key = 'unscheduled'; label = 'Unscheduled'; sortKey = -1
    }
    if (!buckets.has(key)) buckets.set(key, { key, label, sortKey, items: [] })
    buckets.get(key).items.push(c)
  }
  const groups = Array.from(buckets.values())
  groups.sort((a, b) => b.sortKey - a.sortKey)
  for (const g of groups) g.items.sort((a, b) => (a.lesson_number || 0) - (b.lesson_number || 0))
  return groups
}

function DateNav({ classes, readBasePath, meta, selected, setSelected }) {
  const today = new Date()
  const [calMonth, setCalMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [popupOpen, setPopupOpen] = useState(false)
  const wrapRef = useRef(null)

  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)

  // Close the popup on an outside click — standard popover behavior.
  useEffect(() => {
    if (!popupOpen) return
    const onClick = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setPopupOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [popupOpen])

  // Which calendar dates actually have a class — drives the dot markers.
  const datesWithClasses = new Set(
    classes.filter(c => c.scheduled_at).map(c => new Date(c.scheduled_at).toDateString())
  )

  const matches = selected
    ? classes.filter(c => c.scheduled_at && isSameDay(new Date(c.scheduled_at), selected))
        .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
    : []

  // Build the visible month grid — leading/trailing blanks so weeks line up.
  const firstOfMonth = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1)
  const startOffset = firstOfMonth.getDay() // 0 = Sun
  const daysInMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0).getDate()
  const cells = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(calMonth.getFullYear(), calMonth.getMonth(), i + 1)),
  ]

  const pickDate = (date) => {
    setSelected(date)
    setCalMonth(new Date(date.getFullYear(), date.getMonth(), 1))
    setPopupOpen(false)
  }

  const quickBtn = (label, date, active) => (
    <button
      key={label}
      onClick={() => pickDate(date)}
      style={{
        fontFamily:'var(--font-sans)', fontSize:12, fontWeight:600, padding:'8px 16px', borderRadius:2, cursor:'pointer',
        border: active ? `1px solid ${meta.color}` : '1px solid var(--g200)',
        background: active ? meta.color : '#fff',
        color: active ? '#fff' : 'var(--black)',
      }}>
      {label}
    </button>
  )

  return (
    <div style={{ border:'1px solid var(--g200)', borderRadius:6, padding:'20px 24px', marginBottom:40, background:'#fff' }}>
      <div style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:meta.color, marginBottom:14 }}>
        Browse by date
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
        {quickBtn('Yesterday', yesterday, selected && isSameDay(selected, yesterday))}
        {quickBtn('Today', today, selected && isSameDay(selected, today))}
        {quickBtn('Tomorrow', tomorrow, selected && isSameDay(selected, tomorrow))}

        {/* calendar icon trigger + popup */}
        <div style={{ position:'relative' }} ref={wrapRef}>
          <button
            onClick={() => setPopupOpen(o => !o)}
            title="Open calendar"
            aria-label="Open calendar"
            style={{
              display:'flex', alignItems:'center', justifyContent:'center', width:34, height:34, borderRadius:2, cursor:'pointer',
              border: popupOpen ? `1px solid ${meta.color}` : '1px solid var(--g200)',
              background: popupOpen ? meta.color : '#fff',
            }}>
            <svg viewBox="0 0 24 24" fill="none" stroke={popupOpen ? '#fff' : 'var(--g700)'} strokeWidth="2" style={{ width:16, height:16 }}>
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M3 9h18M8 3v4M16 3v4" strokeLinecap="round" />
            </svg>
          </button>

          {popupOpen && (
            <div className="cal-popup" style={{ position:'absolute', top:'calc(100% + 8px)', left:0, zIndex:50, width:280, background:'#fff', border:'1px solid var(--g200)', borderRadius:6, boxShadow:'0 8px 24px rgba(0,0,0,.12)', padding:'16px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1))}
                  style={{ background:'none', border:'none', cursor:'pointer', fontSize:14, color:'var(--g500)', padding:4 }}>←</button>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:15, color:'var(--black)' }}>
                  {calMonth.toLocaleDateString('en-IN', { month:'long', year:'numeric' })}
                </div>
                <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1))}
                  style={{ background:'none', border:'none', cursor:'pointer', fontSize:14, color:'var(--g500)', padding:4 }}>→</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, marginBottom:4 }}>
                {['S','M','T','W','T','F','S'].map((d, i) => (
                  <div key={i} style={{ textAlign:'center', fontFamily:'var(--font-sans)', fontSize:10, color:'var(--g500)', padding:'4px 0' }}>{d}</div>
                ))}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
                {cells.map((date, i) => {
                  if (!date) return <div key={i} />
                  const hasClass = datesWithClasses.has(date.toDateString())
                  const isToday = isSameDay(date, today)
                  const isSelected = selected && isSameDay(date, selected)
                  return (
                    <button key={i} onClick={() => pickDate(date)}
                      style={{
                        aspectRatio:'1', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                        fontFamily:'var(--font-sans)', fontSize:12, borderRadius:3, cursor:'pointer',
                        border: isToday ? `1px solid ${meta.color}` : '1px solid transparent',
                        background: isSelected ? meta.color : 'transparent',
                        color: isSelected ? '#fff' : 'var(--black)',
                      }}>
                      {date.getDate()}
                      <span style={{ width:4, height:4, borderRadius:'50%', marginTop:2, background: hasClass ? (isSelected ? '#fff' : meta.color) : 'transparent' }} />
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {selected && (
          <button onClick={() => setSelected(null)}
            style={{ fontFamily:'var(--font-sans)', fontSize:12, padding:'8px 14px', borderRadius:2, border:'1px solid var(--g200)', background:'#fff', color:'var(--g500)', cursor:'pointer' }}>
            Clear ✕
          </button>
        )}
      </div>

      {/* results for selected date */}
      {selected && (
        <div style={{ marginTop:18, paddingTop:18, borderTop:'1px solid var(--g200)' }}>
          <div style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, color:'var(--g500)', marginBottom:10 }}>
            {selected.toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' })}
          </div>
          {matches.length === 0 ? (
            <p style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'var(--g500)' }}>No classes scheduled this day.</p>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:10 }}>
              {matches.map(c => (
                <Link key={c.id} href={`${readBasePath}/${c.slug}`}
                  style={{ display:'block', padding:'10px 12px', border:'1px solid var(--g200)', borderRadius:4, textDecoration:'none' }}>
                  <div style={{ fontFamily:'var(--font-sans)', fontSize:11, color:meta.color, marginBottom:2 }}>
                    {new Date(c.scheduled_at).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}
                  </div>
                  <div style={{ fontFamily:'var(--font-serif)', fontSize:14, color:'var(--black)' }}>{c.title}</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SectionNav({ sections, meta, selectedId, setSelectedId }) {
  if (sections.length === 0) return null
  return (
    // Sticky right below the main site nav (62px, position:sticky itself —
    // see components/layout/Navbar.jsx) so section-jumping and the search
    // box below stay reachable while scrolling through a long list of
    // classes, instead of needing a trip back to the top of the page.
    <div style={{
      position:'sticky', top:62, zIndex:20,
      border:'1px solid var(--g200)', borderRadius:6, padding:'16px 24px', marginBottom:40,
      background:'rgba(255,255,255,.97)', backdropFilter:'blur(10px)',
    }}>
      <div style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:meta.color, marginBottom:14 }}>
        Browse by section
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
        {sections.map(sec => (
          <button
            key={sec.id}
            onClick={() => setSelectedId(id => id === sec.id ? null : sec.id)}
            style={{
              fontFamily:'var(--font-sans)', fontSize:12, fontWeight:600, padding:'8px 16px', borderRadius:20, cursor:'pointer',
              border: selectedId === sec.id ? `1px solid ${meta.color}` : '1px solid var(--g200)',
              background: selectedId === sec.id ? meta.color : '#fff',
              color: selectedId === sec.id ? '#fff' : 'var(--black)',
            }}>
            {sec.name} ({sec.class_count})
          </button>
        ))}
        {selectedId && (
          <button onClick={() => setSelectedId(null)}
            style={{ fontFamily:'var(--font-sans)', fontSize:12, padding:'8px 14px', borderRadius:2, border:'1px solid var(--g200)', background:'#fff', color:'var(--g500)', cursor:'pointer' }}>
            Clear ✕
          </button>
        )}
      </div>
    </div>
  )
}


export function FoundationsListing({ examSlug, meta, readBasePath }) {
  const router = useRouter()
  const { isLoggedIn, isLoading: authLoading } = useAuth()
  const [series, setSeries] = useState([])
  const [sections, setSections] = useState([])
  const [selectedSectionId, setSelectedSectionId] = useState(null)
  const [loading, setLoad]  = useState(true)
  const [selectedDate, setSelectedDate] = useState(null) // lifted from DateNav so "Upcoming Classes" below can respect it too
  const [search, setSearch] = useState('') // filters recorded classes by title/lesson number, across all series
  const [, setNowTick] = useState(0) // forces a re-check of isLiveNow every 30s so the section auto-updates as classes start/end

  useEffect(() => {
    const id = setInterval(() => setNowTick(t => t + 1), 30000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    fetch(`${API}/foundations/?exam=${examSlug}`)
      .then(r => r.json())
      .then(d => setSeries(Array.isArray(d) ? d : []))
      .catch(() => setSeries([]))
      .finally(() => setLoad(false))
  }, [examSlug])

  useEffect(() => {
    fetch(`${API}/foundations/sections/?exam=${examSlug}`)
      .then(r => r.json())
      .then(d => setSections(Array.isArray(d) ? d : []))
      .catch(() => setSections([]))
  }, [examSlug])

  const allClasses = series.flatMap(s => (s.classes || []).map(c => ({ ...c, series_title: s.title })))
  const liveNow = allClasses.filter(c => c.is_published && isLiveNow(c))
  // A class can have a youtube_url set BEFORE it happens (a pre-scheduled
  // YouTube Live link has a real, stable URL from the moment it's created,
  // not just after the stream ends) — so "upcoming" is purely about the
  // scheduled time, not whether a URL exists yet.
  const upcomingAll = allClasses
    .filter(c => isUpcoming(c.scheduled_at) && (!selectedDate || isSameDay(new Date(c.scheduled_at), selectedDate)))
    .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
  // Only cap to the next 3 in the default view — once a date filter is
  // active (via DateNav), show everything that matches that specific date.
  const upcoming = selectedDate ? upcomingAll : upcomingAll.slice(0, 3)

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:var(--font-sans);color:var(--black);background:#fff;-webkit-font-smoothing:antialiased;overflow-x:hidden}
        a{text-decoration:none;color:inherit}
        .pg{max-width:1100px;margin:0 auto;padding:0 40px}
        @media(max-width:960px){.pg{padding:0 24px}}
        @media(max-width:600px){.pg{padding:0 16px}}

        /* Upcoming class card — 3-column (thumb/text/buttons) on desktop,
           stacks to a single column on mobile where a 200px fixed thumbnail
           would otherwise crush the text and buttons into almost nothing. */
        .upcoming-card { display:grid; gap:24px; align-items:center; }
        .upcoming-card.has-thumb { grid-template-columns:200px 1fr auto; }
        .upcoming-card.no-thumb { grid-template-columns:1fr auto; }
        @media(max-width:640px) {
          .upcoming-card.has-thumb, .upcoming-card.no-thumb { grid-template-columns:1fr!important; gap:16px; }
          .upcoming-card-actions { flex-direction:row!important; }
          .upcoming-card-actions a { flex:1; text-align:center; }
        }

        /* Calendar popup — fixed 280px + absolute-from-trigger positioning
           can overflow off-screen on a narrow phone, especially since the
           trigger sits after wrapping quick-date buttons and its horizontal
           position varies. Switch to a viewport-centered fixed popup instead
           of guessing where the trigger is. */
        @media(max-width:400px) {
          .cal-popup { position:fixed!important; top:50%!important; left:50%!important; transform:translate(-50%,-50%)!important; width:calc(100vw - 48px)!important; max-height:80vh; overflow-y:auto; }
        }
      `}</style>

      {/* ── HERO ── */}
      <section style={{ background:'var(--black)', padding:'64px 0 56px', borderBottom:`3px solid ${meta.color}` }}>
        <div className="pg">
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
            <Link href="/omets" style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'var(--g500)' }}>← OMETs</Link>
            <span style={{ color:'#444' }}>·</span>
            <Link href={meta.course} style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'var(--g500)' }}>{meta.courseLabel}</Link>
          </div>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:2, padding:'4px 12px', marginBottom:16 }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:'#ff4444', display:'inline-block' }} />
            <span style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:600, color:'var(--g500)', letterSpacing:'.08em', textTransform:'uppercase' }}>{meta.isFullCourse ? 'Complete Course · 100% Free · YouTube Live + Recordings' : '100% Free · YouTube Live + Recordings'}</span>
          </div>
          <h1 style={{ fontFamily:'var(--font-serif)', fontSize:'clamp(28px,4vw,52px)', fontWeight:400, color:'#fff', lineHeight:1.1, marginBottom:12 }}>
            {meta.isFullCourse ? `${meta.name} — Complete Course, Free` : `${meta.name} Foundations`}
          </h1>
          <p style={{ fontFamily:'var(--font-body)', fontSize:15, color:'var(--g500)', lineHeight:1.85, maxWidth:540, marginBottom:28 }}>
            {meta.isFullCourse
              ? `The complete ${meta.name} course, taught live by ALP Sir — every topic, ground up to exam-day strategy. Not a sample, not a preview. The whole thing, free.`
              : `Free live classes by ALP Sir covering ${meta.name} from the ground up. Attend live or watch the recording — your choice. Notes and resources added to each class page.`}
          </p>
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            <button
              onClick={() => document.getElementById('series-section')?.scrollIntoView({ behavior: 'smooth' })}
              style={{ fontFamily:'var(--font-sans)', fontSize:13, fontWeight:600, padding:'10px 20px', background:'#ff4444', color:'#fff', borderRadius:2, display:'inline-flex', alignItems:'center', gap:8, border:'none', cursor:'pointer' }}>
              Watch Classes ↓
            </button>
            <a href={`https://wa.me/917838737388?text=Hi%20ALP%20Sir%2C%20I%20want%20to%20join%20the%20free%20${meta.name}%20classes`}
              target="_blank" rel="noopener noreferrer"
              style={{ fontFamily:'var(--font-sans)', fontSize:13, fontWeight:600, padding:'10px 20px', background:'transparent', color:'#fff', border:'1px solid #444', borderRadius:2, textDecoration:'none', display:'inline-flex', alignItems:'center', gap:8 }}>
              <span style={{ width:8,height:8,borderRadius:'50%',background:'#25D366',display:'inline-block' }} />
              Get notified on WhatsApp
            </a>
          </div>
        </div>
      </section>

      <div style={{ padding:'48px 0' }}>
        <div className="pg">

          {meta.requireLogin && router.isReady && !authLoading && !isLoggedIn ? (
            <div style={{ textAlign:'center', padding:'4rem 2rem', border:`1px solid var(--g200)`, borderRadius:6, maxWidth:480, margin:'0 auto' }}>
              <p style={{ fontFamily:'var(--font-serif)', fontSize:22, color:'var(--black)', marginBottom:10 }}>
                Create a free account to start
              </p>
              <p style={{ fontFamily:'var(--font-body)', fontSize:14, color:'var(--g700)', lineHeight:1.7, marginBottom:28 }}>
                The complete {meta.name} course is free — no payment, ever. Just log in or create an account to access every session.
              </p>
              <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
                <Link href={`/auth/register?redirect=${encodeURIComponent(router.asPath)}`}
                  style={{ fontFamily:'var(--font-sans)', fontSize:13, fontWeight:600, padding:'11px 22px', background:meta.color, color:'#fff', borderRadius:2 }}>
                  Create free account →
                </Link>
                <Link href={`/auth/login?redirect=${encodeURIComponent(router.asPath)}`}
                  style={{ fontFamily:'var(--font-sans)', fontSize:13, fontWeight:600, padding:'11px 22px', border:'1px solid var(--g200)', color:'var(--black)', borderRadius:2 }}>
                  Log in
                </Link>
              </div>
            </div>
          ) : loading ? (
            <p style={{ fontFamily:'var(--font-sans)', color:'var(--g500)', textAlign:'center', padding:'3rem' }}>Loading classes…</p>
          ) : series.length === 0 ? (
            <div style={{ textAlign:'center', padding:'5rem', border:'1px dashed var(--g200)', borderRadius:4 }}>
              <p style={{ fontFamily:'var(--font-serif)', fontSize:20, color:'var(--black)', marginBottom:8 }}>Classes coming soon.</p>
              <p style={{ fontFamily:'var(--font-body)', fontSize:14, color:'var(--g700)', marginBottom:24, maxWidth:360, margin:'0 auto 24px' }}>
                ALP Sir will announce the {meta.name} series schedule soon. Subscribe and get notified.
              </p>
              <a href="https://www.youtube.com/@GRADSKOOLCAT" target="_blank" rel="noopener noreferrer"
                style={{ fontFamily:'var(--font-sans)', fontSize:13, fontWeight:600, padding:'10px 20px', background:'#ff4444', color:'#fff', borderRadius:2, textDecoration:'none' }}>
                Subscribe on YouTube →
              </a>
            </div>
          ) : (
            <>
              {liveNow.length > 0 && (
                <div style={{ marginBottom:32 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                    <span style={{ position:'relative', width:9, height:9, flexShrink:0 }}>
                      <span style={{ position:'absolute', inset:0, borderRadius:'50%', background:'#ff4444' }} />
                      <span className="live-now-ping" style={{ position:'absolute', inset:0, borderRadius:'50%', background:'#ff4444' }} />
                    </span>
                    <span style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'#ff4444' }}>Live Now</span>
                  </div>
                  <style>{`
                    @keyframes live-now-ping { 0% { transform:scale(1); opacity:.7 } 100% { transform:scale(2.4); opacity:0 } }
                    .live-now-ping { animation:live-now-ping 1.6s cubic-bezier(0,0,.2,1) infinite; }
                  `}</style>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
                    {liveNow.map(cls => (
                      <Link key={cls.id} href={`${readBasePath}/${cls.slug}`}
                        style={{ display:'block', background:'var(--black)', borderRadius:6, padding:'20px 22px', border:'1px solid #ff4444', textDecoration:'none' }}>
                        <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:700, color:'#ff4444', marginBottom:8 }}>L{cls.lesson_number} · LIVE</div>
                        <div style={{ fontFamily:'var(--font-serif)', fontSize:16, color:'#fff', lineHeight:1.35, marginBottom:10 }}>{cls.title}</div>
                        <span style={{ fontFamily:'var(--font-sans)', fontSize:12, fontWeight:600, color:'#fff' }}>Join now →</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <DateNav classes={allClasses} readBasePath={readBasePath} meta={meta} selected={selectedDate} setSelected={setSelectedDate} />
              <SectionNav sections={sections} meta={meta} selectedId={selectedSectionId} setSelectedId={setSelectedSectionId} />

              {/* ── UPCOMING ── */}
              {(upcoming.length > 0 || selectedDate) && (
                <div style={{ marginBottom:48 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', flexWrap:'wrap', gap:8, marginBottom:16 }}>
                    <div style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:meta.color }}>
                      Upcoming Classes{selectedDate && ` — ${selectedDate.toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' })}`}
                    </div>
                    {!selectedDate && upcomingAll.length > upcoming.length && (
                      <div style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'var(--g500)' }}>
                        +{upcomingAll.length - upcoming.length} more — use "Browse by date" above to see them
                      </div>
                    )}
                  </div>
                  {upcoming.length === 0 ? (
                    <p style={{ fontFamily:'var(--font-sans)', fontSize:13, color:'var(--g500)' }}>No upcoming classes on this date.</p>
                  ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                    {upcoming.map(cls => (
                      <div key={cls.id} className={`upcoming-card ${cls.youtube_url ? 'has-thumb' : 'no-thumb'}`} style={{ background:'var(--black)', borderRadius:4, padding:'24px 28px' }}>
                        {cls.youtube_url && (
                          <div style={{ position:'relative' }}>
                            <YTThumb url={cls.youtube_url} clickable={false} />
                            <div style={{ position:'absolute', top:6, left:6, fontFamily:'var(--font-sans)', fontSize:9, fontWeight:700, letterSpacing:'.05em', textTransform:'uppercase', padding:'3px 8px', borderRadius:2, background:'rgba(0,0,0,.75)', color:'#fff' }}>
                              Upcoming
                            </div>
                          </div>
                        )}
                        <div>
                          <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', color:meta.color, marginBottom:6 }}>
                            Lesson {cls.lesson_number} · {cls.series_title}
                          </div>
                          <div style={{ fontFamily:'var(--font-serif)', fontSize:20, color:'#fff', marginBottom:8, lineHeight:1.2 }}>{cls.title}</div>
                          {cls.description && (
                            <p style={{ fontFamily:'var(--font-body)', fontSize:13, color:'rgba(255,255,255,.5)', lineHeight:1.7, marginBottom:10 }}>{cls.description}</p>
                          )}
                          <div style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'rgba(255,255,255,.4)', marginBottom:4 }}>
                            {formatDate(cls.scheduled_at)} · {formatTime(cls.scheduled_at)} · {cls.duration_mins} min
                          </div>
                          <Countdown iso={cls.scheduled_at} />
                        </div>
                        <div className="upcoming-card-actions" style={{ textAlign:'right', flexShrink:0, display:'flex', flexDirection:'column', gap:8 }}>
                          <Link href={`${readBasePath}/${cls.slug}`}
                            style={{ fontFamily:'var(--font-sans)', fontSize:12, fontWeight:600, padding:'9px 18px', background:'#ff4444', color:'#fff', borderRadius:2, textDecoration:'none', display:'inline-block', whiteSpace:'nowrap' }}>
                            View class →
                          </Link>
                          {meta.mocksCheckoutUrl && (
                            <Link href={meta.mocksCheckoutUrl}
                              style={{ fontFamily:'var(--font-sans)', fontSize:12, fontWeight:600, padding:'9px 18px', background:'transparent', color:'#fff', border:'1px solid rgba(255,255,255,.3)', borderRadius:2, textDecoration:'none', display:'inline-block', whiteSpace:'nowrap' }}>
                              Buy Mocks →
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  )}
                </div>
              )}

              {/* ── SECTION VIEW — replaces the normal per-series browsing
                  when a section is selected, since a section can span
                  multiple series and month-grouping still applies. ── */}
              <div id="series-section" style={{ scrollMarginTop: 80 }} />
              {selectedSectionId ? (() => {
                const sectionMeta = sections.find(s => s.id === selectedSectionId)
                const sectionClasses = allClasses.filter(c => c.section_id === selectedSectionId && c.is_published)
                const now = new Date()
                const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`
                const groups = groupByMonth(sectionClasses)
                return (
                  <div style={{ marginBottom:48 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:20, flexWrap:'wrap', gap:8 }}>
                      <div>
                        <div style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:meta.color, marginBottom:4 }}>Section</div>
                        <h2 style={{ fontFamily:'var(--font-serif)', fontSize:'clamp(20px,3vw,28px)', fontWeight:400, color:'var(--black)' }}>{sectionMeta?.name}</h2>
                        {sectionMeta?.description && <p style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--g700)', marginTop:4, lineHeight:1.7 }}>{sectionMeta.description}</p>}
                      </div>
                      <div style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'var(--g500)' }}>{sectionClasses.length} classes</div>
                    </div>
                    {sectionClasses.length === 0 ? (
                      <p style={{ fontFamily:'var(--font-sans)', fontSize:13, color:'var(--g500)' }}>No classes tagged to this section yet.</p>
                    ) : (
                      groups.map(group => (
                        <MonthGroup key={group.key} group={group} meta={meta} readBasePath={readBasePath}
                          defaultOpen={group.key === currentMonthKey} forceOpen={false} />
                      ))
                    )}
                  </div>
                )
              })() : (
                <>
                  {/* ── SERIES WITH RECORDINGS ── */}
                  {series.some(s => (s.classes || []).some(c => c.is_published)) && (
                    <div style={{ marginBottom:24 }}>
                      <input
                        type="text"
                        placeholder="Search a class by title or lesson number…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ width:'100%', fontFamily:'var(--font-sans)', fontSize:14, padding:'11px 16px', border:'1px solid var(--g200)', borderRadius:4, outline:'none', boxSizing:'border-box' }}
                      />
                    </div>
                  )}
                  {series.map(s => {
                    const allSeriesClasses = (s.classes || []).filter(c => c.is_published)
                    if (!allSeriesClasses.length) return null

                    const q = search.trim().toLowerCase()
                    const classes = q
                      ? allSeriesClasses.filter(c => c.title.toLowerCase().includes(q) || String(c.lesson_number) === q)
                      : allSeriesClasses

                const now = new Date()
                const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`
                const groups = groupByMonth(classes)

                return (
                  <div key={s.id} style={{ marginBottom:48 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:20, flexWrap:'wrap', gap:8 }}>
                      <div>
                        <div style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:meta.color, marginBottom:4 }}>Series</div>
                        <h2 style={{ fontFamily:'var(--font-serif)', fontSize:'clamp(20px,3vw,28px)', fontWeight:400, color:'var(--black)' }}>{s.title}</h2>
                        {s.description && <p style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--g700)', marginTop:4, lineHeight:1.7 }}>{s.description}</p>}
                      </div>
                      <div style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'var(--g500)' }}>
                        {q ? `${classes.length} of ${allSeriesClasses.length} classes match` : `${allSeriesClasses.length} classes`}
                      </div>
                    </div>
                    {s.notes && (
                      <div style={{ background:'var(--off)', border:'var(--border)', borderRadius:4, padding:'24px 28px', marginBottom:24 }}>
                        <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:meta.color, marginBottom:12 }}>
                          Everything in this series
                        </div>
                        <div
                          style={{ fontFamily:'var(--font-body)', fontSize:14, color:'var(--g700)', lineHeight:1.85 }}
                          className="series-notes-content"
                          dangerouslySetInnerHTML={{ __html: s.notes }}
                        />
                        <style>{`
                          .series-notes-content img { max-width:100%; border-radius:4px; margin:12px 0; }
                          .series-notes-content a { color:var(--red); }
                          .series-notes-content h2, .series-notes-content h3 { font-family:var(--font-serif); color:var(--black); margin:16px 0 8px; }
                          .series-notes-content ul { padding-left:20px; margin:8px 0; }
                        `}</style>
                      </div>
                    )}
                    {classes.length === 0 ? (
                      <p style={{ fontFamily:'var(--font-sans)', fontSize:13, color:'var(--g500)' }}>No classes in this series match "{search}".</p>
                    ) : (
                      groups.map(group => (
                        <MonthGroup
                          key={group.key}
                          group={group}
                          meta={meta}
                          readBasePath={readBasePath}
                          defaultOpen={group.key === currentMonthKey}
                          forceOpen={!!q}
                        />
                      ))
                    )}
                  </div>
                )
              })}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
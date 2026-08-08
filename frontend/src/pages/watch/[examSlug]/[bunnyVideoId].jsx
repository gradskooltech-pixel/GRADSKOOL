/**
 * GRADSKOOL — Watch Page (Video Player)
 * Route: /watch/[examSlug]/[bunnyVideoId]
 *
 * Layout:
 *   Left (65%): Bunny iframe player + tabs (Notes | Transcript)
 *   Right (35%): Video list sidebar with progress indicators
 *
 * Features:
 *   - Signed Bunny URL fetched on mount
 *   - Progress saved every 15s via postMessage from iframe
 *   - AI notes rendered as markdown
 *   - Locked videos show upgrade prompt
 *   - Resume from last position via ?t= param on iframe
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  useStreamURL,
  useVideoList,
  useVideoProgress,
  useAINotes,
} from '../../../hooks/usePaymentsAndContent'
import { ProtectedRoute } from '../../../components/auth/ProtectedRoute'
import { useAuth } from '../../../hooks/useAuth'

export default function WatchPage() {
  return (
    <ProtectedRoute>
      <WatchPageInner />
    </ProtectedRoute>
  )
}

function WatchPageInner() {
  const router = useRouter()
  const { user } = useAuth()
  const { examSlug, bunnyVideoId } = router.query

  const { streamUrl, meta, isLoading: streamLoading, error: streamError } = useStreamURL(bunnyVideoId)
  const { videos, grouped, isLoading: videosLoading }                     = useVideoList(examSlug)
  const { notes, isLoading: notesLoading }                                = useAINotes(bunnyVideoId)
  const { save: saveProgress }                                             = useVideoProgress(bunnyVideoId)

  const [activeTab, setActiveTab] = useState('notes')    // 'notes' | 'transcript' | 'bookmarks' | 'chapters'
  const [speed,    setSpeed]    = useState(1.0)
  const [bookmarks,setBookmarks]= useState([])
  const [chapters, setChapters] = useState([])
  const [noteText, setNoteText] = useState('')
  const [noteSaved,setNoteSaved]= useState(false)
  const [transcript,setTranscript]=useState(null)
  const [currentSecs, setCurrentSecs] = useState(0)
  const progressInterval = useRef(null)
  const playerRef = useRef(null)
  const topicVideoId = meta?.topic_video_id  // expected from API

  // Load bookmarks, chapters, transcript, notes when video loads
  useEffect(() => {
    if (!topicVideoId) return
    import('../../lib/api').then(({ default: api }) => {
      api.get('/learn/videos/' + topicVideoId + '/bookmarks/').then(({ data }) => setBookmarks(data)).catch(() => {})
      api.get('/learn/videos/' + topicVideoId + '/chapters/').then(({ data }) => setChapters(data)).catch(() => {})
      api.get('/learn/videos/' + topicVideoId + '/transcript/').then(({ data }) => setTranscript(data)).catch(() => {})
      api.get('/learn/notes/?topic_video_id=' + topicVideoId).then(({ data }) => setNoteText(data.content || '')).catch(() => {})
    })
  }, [topicVideoId])

  // Send progress updates every 15s via Bunny player postMessage
  useEffect(() => {
    const handler = (e) => {
      if (!e.data?.type) return
      if (e.data.type === 'timeupdate') {
        const pos = Math.floor(e.data.currentTime || 0)
        const watched = Math.floor(e.data.watchedTime || 0)
        const duration = meta?.duration_secs || 0
        const isCompleted = duration > 0 && pos >= duration * 0.9

        // Debounce — save every 15s
        clearTimeout(progressInterval.current)
        progressInterval.current = setTimeout(() => {
          saveProgress({ positionSecs: pos, watchedSecs: watched, isCompleted })
        }, 15000)
      }
    }
    window.addEventListener('message', handler)
    return () => { window.removeEventListener('message', handler); clearTimeout(progressInterval.current) }
  }, [saveProgress, meta])

  // videoId may be a Bunny GUID or a YouTube ID depending on video_source
  const currentVideo = videos.find(
    v => v.bunny_video_id === bunnyVideoId || v.youtube_video_id === bunnyVideoId
  )

  const blockContext = (e) => { if (e.target.closest?.('.gs-video-protected')) e.preventDefault() }
  const blockKeys = (e) => {
    if ((e.ctrlKey||e.metaKey) && ['c','s','p','a'].includes(e.key.toLowerCase())) e.preventDefault()
  }

  return (
    <div onContextMenu={blockContext} onKeyDown={blockKeys}>
      <Head>
        <title>{meta?.title || 'Watch'} — GRADSKOOL</title>
        <meta name="robots" content="noindex" />
      </Head>

      {/* Top bar */}
      <div style={styles.topBar}>
        <Link href={`/courses/${examSlug}`} style={styles.topBarBack}>
          ← {examSlug?.toUpperCase()}
        </Link>
        <span style={styles.topBarTitle}>{meta?.title || '…'}</span>
        <Link href="/dashboard" style={styles.topBarDash}>Dashboard</Link>
      </div>

      <div style={styles.layout}>
        {/* ── PLAYER PANEL ──────────────────────────────────────────── */}
        <div style={styles.playerPanel}>
          {/* Player */}
          <div style={styles.playerWrap}>
            {streamLoading && (
              <div style={styles.playerShell}>
                <div style={styles.spinner} />
              </div>
            )}

            {streamError && (
              <div style={styles.playerShell}>
                {streamError.type === 'access_denied' ? (
                  <AccessDeniedOverlay examSlug={examSlug} />
                ) : (
                  <ErrorOverlay message={streamError.message} />
                )}
              </div>
            )}

            {/* Bunny player — paid enrolled content */}
            {streamUrl && !meta?.youtube_video_id && (
              <>
                {/* Speed controls */}
      <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", padding:"0.5rem 1rem", background:"#1a1a1a", borderBottom:"1px solid #333" }}>
        <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.68rem", color:"rgba(255,255,255,0.5)" }}>Speed:</span>
        {[0.75, 1.0, 1.25, 1.5, 2.0].map(s => (
          <button key={s} onClick={() => {
            setSpeed(s)
            // Send speed to Bunny iframe via postMessage
            playerRef.current?.contentWindow?.postMessage(JSON.stringify({ event:"speed", speed:s }), "*")
          }}
            style={{ fontFamily:"var(--font-sans)", fontSize:"0.7rem", padding:"0.2rem 0.5rem", borderRadius:"3px", border:"1px solid rgba(255,255,255,0.15)", background:speed===s?"rgba(255,94,95,0.3)":"transparent", color:speed===s?"#ff5e5f":"rgba(255,255,255,0.5)", cursor:"pointer", fontWeight:speed===s?"700":"400" }}>
            {s}×
          </button>
        ))}
        <div style={{ marginLeft:"auto", display:"flex", gap:"0.5rem" }}>
          <button onClick={() => {
            const secs = Math.round(currentSecs)
            const note = prompt("Note for " + Math.floor(secs/60) + ":" + String(secs%60).padStart(2,"0") + " (optional)") || ""
            if (typeof topicVideoId !== "undefined" && topicVideoId) {
              import("../../lib/api").then(({ default: api }) => {
                api.post("/learn/videos/" + topicVideoId + "/bookmarks/", { timestamp_secs: secs, note }).then(({ data }) => {
                  setBookmarks(b => [...b, { id:data.id, timestamp_secs:secs, timestamp_display:Math.floor(secs/60)+":"+String(secs%60).padStart(2,"0"), note }])
                })
              })
            }
          }} style={{ fontFamily:"var(--font-sans)", fontSize:"0.68rem", padding:"0.2rem 0.625rem", borderRadius:"3px", border:"1px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.6)", cursor:"pointer" }}>
            🔖 Bookmark
          </button>
        </div>
      </div>
      <div className="gs-video-protected" style={{ position:'relative' }}>
                <VideoWatermark email={user?.email} name={user?.first_name} />
                <iframe
                  ref={el => {
                    playerRef.current = el
                    // Set src via JS after mount — keeps URL out of static HTML/Elements panel
                    if (el && streamUrl && el.getAttribute('data-loaded') !== streamUrl) {
                      el.setAttribute('data-loaded', streamUrl)
                      el.src = streamUrl
                    }
                  }}
                  style={styles.iframe}
                  allowFullScreen
                  allow="autoplay; fullscreen; picture-in-picture"
                  title={meta?.title || 'Lecture video'}
                />
              </div>
              </>
            )}

            {/* YouTube player — free preview content */}
            {meta?.youtube_video_id && (
              <iframe
                src={`https://www.youtube.com/embed/${meta.youtube_video_id}?rel=0&modestbranding=1&color=white`}
                style={styles.iframe}
                allowFullScreen
                allow="autoplay; fullscreen; picture-in-picture"
                title={meta?.title || 'Lecture video'}
              />
            )}
          </div>

          {/* Video meta */}
          {meta && (
            <div style={styles.videoMeta}>
              <h1 style={styles.videoTitle}>{meta.title}</h1>
              {currentVideo?.duration_display && (
                <span style={styles.duration}>{currentVideo.duration_display}</span>
              )}
            </div>
          )}

          {/* Tabs: Notes | Transcript */}
          <div style={styles.tabs}>
            {['notes', 'transcript'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{ ...styles.tab, ...(activeTab === tab ? styles.tabActive : {}) }}
              >
                {tab === 'notes' ? '📝 Study Notes' : '📄 Transcript'}
              </button>
            ))}
          </div>

          <div style={styles.tabContent}>
            {activeTab === 'notes' && (
              <NotesPanel notes={notes} isLoading={notesLoading} />
            )}
            {activeTab === 'bookmarks' ? (
            <div style={{ padding:"1rem" }}>
              <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.65rem", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.1em", color:"rgba(255,255,255,0.4)", marginBottom:"0.875rem" }}>Bookmarks ({bookmarks.length})</p>
              {!bookmarks.length ? (
                <p style={{ fontFamily:"Georgia,serif", fontSize:"0.82rem", color:"rgba(255,255,255,0.3)", textAlign:"center", padding:"2rem 0" }}>
                  Press 🔖 Bookmark while watching to save a timestamp
                </p>
              ) : bookmarks.map(b => (
                <div key={b.id} style={{ display:"flex", gap:"0.75rem", padding:"0.625rem 0", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.7rem", fontWeight:"700", color:"#ff5e5f", cursor:"pointer", flexShrink:0, marginTop:"2px" }}
                    onClick={() => playerRef.current?.contentWindow?.postMessage(JSON.stringify({event:"seek",time:b.timestamp_secs}),"*")}>
                    ▶ {b.timestamp_display}
                  </span>
                  <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.75rem", color:"rgba(255,255,255,0.7)", flex:1 }}>{b.note || "(no note)"}</span>
                  <button onClick={() => {
                    import("../../lib/api").then(({ default: api }) => api.delete("/learn/videos/" + topicVideoId + "/bookmarks/" + b.id + "/"))
                    setBookmarks(bk => bk.filter(x => x.id !== b.id))
                  }} style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.3)", fontSize:"0.75rem" }}>✕</button>
                </div>
              ))}
            </div>
          ) : activeTab === 'my-notes' ? (
            <div style={{ padding:"1rem", display:"flex", flexDirection:"column", height:"100%" }}>
              <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.65rem", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.1em", color:"rgba(255,255,255,0.4)", marginBottom:"0.875rem" }}>My Notes</p>
              <textarea value={noteText} onChange={e=>setNoteText(e.target.value)}
                placeholder="Write your notes while watching..."
                style={{ flex:1, minHeight:"200px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"4px", color:"rgba(255,255,255,0.85)", fontFamily:"var(--font-sans)", fontSize:"0.82rem", padding:"0.75rem", resize:"none", outline:"none", lineHeight:1.7 }} />
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:"0.625rem" }}>
                {noteSaved && <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.68rem", color:"#22c55e" }}>✓ Saved</span>}
                <button onClick={() => {
                  if (!topicVideoId) return
                  import("../../lib/api").then(({ default: api }) => {
                    api.post("/learn/notes/", { topic_video_id: topicVideoId, content: noteText }).then(() => {
                      setNoteSaved(true); setTimeout(() => setNoteSaved(false), 2000)
                    })
                  })
                }} style={{ marginLeft:"auto", fontFamily:"var(--font-sans)", fontSize:"0.75rem", fontWeight:"700", padding:"0.375rem 0.875rem", background:"#ff5e5f", color:"#fff", border:"none", borderRadius:"4px", cursor:"pointer" }}>
                  Save Notes
                </button>
              </div>
            </div>
          ) : activeTab === 'chapters' && chapters.length > 0 ? (
            <div style={{ padding:"1rem" }}>
              <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.65rem", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.1em", color:"rgba(255,255,255,0.4)", marginBottom:"0.875rem" }}>Chapters</p>
              {chapters.map(ch => (
                <div key={ch.id} onClick={() => playerRef.current?.contentWindow?.postMessage(JSON.stringify({event:"seek",time:ch.timestamp_secs}),"*")}
                  style={{ display:"flex", gap:"0.75rem", padding:"0.625rem 0.75rem", marginBottom:"4px", borderRadius:"4px", cursor:"pointer", background:"rgba(255,255,255,0.04)" }}>
                  <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.68rem", color:"#ff5e5f", fontWeight:"700", flexShrink:0 }}>{ch.timestamp_display}</span>
                  <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.78rem", color:"rgba(255,255,255,0.75)" }}>{ch.title}</span>
                </div>
              ))}
            </div>
          ) : activeTab === 'transcript' && transcript?.available ? (
            <div style={{ padding:"1rem", height:"100%", overflowY:"auto" }}>
              <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.65rem", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.1em", color:"rgba(255,255,255,0.4)", marginBottom:"0.875rem" }}>Transcript</p>
              {transcript.segments?.map((seg, i) => (
                <div key={i} onClick={() => playerRef.current?.contentWindow?.postMessage(JSON.stringify({event:"seek",time:seg.start_secs}),"*")}
                  style={{ display:"flex", gap:"0.75rem", padding:"0.375rem 0", cursor:"pointer", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.62rem", color:"#ff5e5f", flexShrink:0, minWidth:"40px" }}>{Math.floor(seg.start_secs/60)}:{String(seg.start_secs%60).padStart(2,"0")}</span>
                  <span style={{ fontFamily:"var(--font-sans)", fontSize:"0.75rem", color:"rgba(255,255,255,0.65)", lineHeight:1.6 }}>{seg.text}</span>
                </div>
              ))}
            </div>
          ) : activeTab === 'transcript' && !transcript?.available ? (
            <div style={{ padding:"2rem", textAlign:"center" }}>
              <p style={{ fontFamily:"Georgia,serif", fontSize:"0.82rem", color:"rgba(255,255,255,0.3)" }}>Transcript not available yet</p>
            </div>
          ) : activeTab === 'transcript' && (
              <TranscriptPanel notes={notes} isLoading={notesLoading} />
            )}
          </div>
        </div>

        {/* ── VIDEO SIDEBAR ──────────────────────────────────────────── */}
        <div style={styles.sidebar}>
          <p style={styles.sidebarTitle}>Course Videos</p>

          {videosLoading ? (
            <p style={styles.sidebarLoading}>Loading…</p>
          ) : (
            Object.entries(grouped).map(([module, vids]) => (
              <div key={module} style={styles.moduleGroup}>
                <p style={styles.moduleLabel}>{module}</p>
                {vids.map(v => (
                  <VideoSidebarItem
                    key={v.id || v.bunny_video_id || v.youtube_video_id}
                    video={v}
                    isActive={
                      v.bunny_video_id === bunnyVideoId ||
                      v.youtube_video_id === bunnyVideoId
                    }
                    examSlug={examSlug}
                  />
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ── NOTES PANEL ───────────────────────────────────────────────────────────────

function NotesPanel({ notes, isLoading }) {
  if (isLoading) return <PanelSkeleton />

  if (!notes || notes.notes_status === 'pending' || notes.notes_status === 'processing') {
    return (
      <div style={styles.notesEmpty}>
        <div style={styles.notesEmptyIcon}>✍</div>
        <p style={styles.notesEmptyTitle}>AI notes are being generated</p>
        <p style={styles.notesEmptyText}>
          Our AI is processing this lecture. Notes usually appear within 5–10 minutes of publishing.
        </p>
      </div>
    )
  }

  if (!notes.ai_notes) {
    return <div style={styles.notesEmpty}><p style={styles.notesEmptyText}>Notes not available for this video.</p></div>
  }

  // Render notes as structured markdown-like content
  const sections = parseAINotes(notes.ai_notes)

  return (
    <div style={styles.notes}>
      {sections.map((section, i) => (
        <div key={i} style={styles.noteSection}>
          <h3 style={styles.noteSectionTitle}>{section.title}</h3>
          <ul style={styles.noteList}>
            {section.items.map((item, j) => (
              <li key={j} style={styles.noteItem}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

function TranscriptPanel({ notes, isLoading }) {
  if (isLoading) return <PanelSkeleton />
  if (!notes?.raw_transcript) {
    return (
      <div style={styles.notesEmpty}>
        <p style={styles.notesEmptyText}>Transcript not available yet.</p>
      </div>
    )
  }
  return (
    <div style={styles.transcript}>
      <p style={styles.transcriptMeta}>
        {notes.word_count?.toLocaleString('en-IN')} words · AI-generated transcript
      </p>
      <p style={styles.transcriptText}>{notes.raw_transcript}</p>
    </div>
  )
}

function PanelSkeleton() {
  return (
    <div style={styles.skeleton}>
      {[80, 60, 90, 70, 50].map((w, i) => (
        <div key={i} style={{ ...styles.skeletonLine, width: `${w}%` }} />
      ))}
    </div>
  )
}

// ── SIDEBAR ITEM ──────────────────────────────────────────────────────────────

function VideoSidebarItem({ video, isActive, examSlug }) {
  const progress = video.progress
  const pct = progress && video.duration_secs
    ? Math.min(100, Math.round((progress.last_position / video.duration_secs) * 100))
    : 0

  return (
    <Link
      href={`/watch/${examSlug}/${video.video_source === 'youtube' ? video.youtube_video_id : video.bunny_video_id}`}
      style={{
        ...styles.sidebarItem,
        ...(isActive ? styles.sidebarItemActive : {}),
        ...(video.is_locked ? styles.sidebarItemLocked : {}),
      }}
    >
      <div style={styles.sidebarThumb}>
        {video.thumbnail_url ? (
          <img src={video.thumbnail_url} alt="" style={styles.thumbImg} />
        ) : (
          <div style={styles.thumbPlaceholder}>▶</div>
        )}
        {progress?.is_completed && (
          <div style={styles.completedBadge}>✓</div>
        )}
        {video.is_locked && (
          <div style={styles.lockedBadge}>🔒</div>
        )}
        {video.video_source === 'youtube' && (
          <div style={styles.youtubeBadge}>▶ YT</div>
        )}
      </div>
      <div style={styles.sidebarInfo}>
        <p style={{
          ...styles.sidebarVideoTitle,
          ...(isActive ? { color: 'var(--black)', fontWeight: '600' } : {}),
        }}>
          {video.title}
        </p>
        {video.duration_display && (
          <p style={styles.sidebarDuration}>{video.duration_display}</p>
        )}
        {/* Progress bar */}
        {pct > 0 && (
          <div style={styles.progressBarWrap}>
            <div style={{ ...styles.progressBarFill, width: `${pct}%` }} />
          </div>
        )}
      </div>
    </Link>
  )
}

// ── OVERLAYS ──────────────────────────────────────────────────────────────────

function AccessDeniedOverlay({ examSlug }) {
  return (
    <div style={styles.overlay}>
      <div style={styles.overlayIcon}>🔒</div>
      <h3 style={styles.overlayTitle}>Enrolment required</h3>
      <p style={styles.overlaySub}>Purchase a plan to access recorded lectures.</p>
      <Link href={`/checkout/${examSlug}`} style={styles.overlayBtn}>
        View Plans →
      </Link>
    </div>
  )
}

function ErrorOverlay({ message }) {
  return (
    <div style={styles.overlay}>
      <p style={styles.overlaySub}>{message}</p>
    </div>
  )
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

function parseAINotes(text) {
  const sections = []
  let current = null
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (trimmed.startsWith('## ')) {
      if (current) sections.push(current)
      current = { title: trimmed.replace('## ', ''), items: [] }
    } else if (trimmed.startsWith('- ') && current) {
      current.items.push(trimmed.replace('- ', ''))
    }
  }
  if (current) sections.push(current)
  return sections
}

// ── STYLES ────────────────────────────────────────────────────────────────────

const styles = {
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 1.5rem',
    borderBottom: '1px solid var(--gray-200)',
    background: 'var(--white)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  topBarBack: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.8rem',
    color: 'var(--gray-400)',
    textDecoration: 'none',
  },
  topBarTitle: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--black)',
    maxWidth: '400px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  topBarDash: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.8rem',
    color: 'var(--red)',
    textDecoration: 'none',
    borderBottom: '1px solid var(--red-border)',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '1fr 340px',
    height: 'calc(100vh - 49px)',
    overflow: 'hidden',
  },
  playerPanel: {
    overflowY: 'auto',
    borderRight: '1px solid var(--gray-200)',
  },
  playerWrap: {
    position: 'relative',
    width: '100%',
    paddingBottom: '56.25%',  // 16:9
    background: '#000',
  },
  playerShell: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0a0a0a',
  },
  iframe: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    border: 'none',
  },
  spinner: {
    width: '36px', height: '36px',
    border: '3px solid rgba(255,255,255,0.1)',
    borderTop: '3px solid var(--red)',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
  videoMeta: {
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid var(--gray-200)',
    display: 'flex',
    alignItems: 'baseline',
    gap: '1rem',
    justifyContent: 'space-between',
  },
  videoTitle: {
    fontFamily: 'var(--font-serif)',
    fontSize: '1.2rem',
    fontWeight: '500',
    color: 'var(--black)',
    lineHeight: '1.3',
  },
  duration: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.78rem',
    color: 'var(--gray-400)',
    flexShrink: 0,
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid var(--gray-200)',
    padding: '0 1.5rem',
  },
  tab: {
    padding: '0.85rem 1rem',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.8rem',
    fontWeight: '500',
    color: 'var(--gray-400)',
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    transition: 'color 0.15s, border-color 0.15s',
    marginBottom: '-1px',
  },
  tabActive: {
    color: 'var(--black)',
    borderBottomColor: 'var(--red)',
  },
  tabContent: { padding: '1.5rem' },
  // Notes
  notes: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  noteSection: {},
  noteSectionTitle: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.72rem',
    fontWeight: '700',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--red)',
    marginBottom: '0.75rem',
  },
  noteList: { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  noteItem: {
    fontFamily: 'var(--font-serif)',
    fontSize: '0.9rem',
    color: 'var(--gray-700)',
    lineHeight: '1.6',
    paddingLeft: '1rem',
    borderLeft: '2px solid var(--gray-200)',
  },
  notesEmpty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    textAlign: 'center', padding: '3rem 1rem', gap: '0.75rem',
  },
  notesEmptyIcon: { fontSize: '2.5rem' },
  notesEmptyTitle: {
    fontFamily: 'var(--font-serif)',
    fontSize: '1.1rem',
    fontWeight: '500',
    color: 'var(--black)',
  },
  notesEmptyText: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.85rem',
    color: 'var(--gray-400)',
    lineHeight: '1.6',
    maxWidth: '320px',
  },
  transcript: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  transcriptMeta: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.72rem',
    color: 'var(--gray-400)',
    letterSpacing: '0.05em',
  },
  transcriptText: {
    fontFamily: 'var(--font-serif)',
    fontSize: '0.9rem',
    color: 'var(--gray-600)',
    lineHeight: '1.9',
    whiteSpace: 'pre-wrap',
  },
  skeleton: { display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  skeletonLine: {
    height: '14px',
    background: 'var(--gray-100)',
    borderRadius: '2px',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  // Sidebar
  sidebar: {
    overflowY: 'auto',
    background: 'var(--gray-50)',
  },
  sidebarTitle: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.68rem',
    fontWeight: '700',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--gray-400)',
    padding: '1rem 1.25rem 0.5rem',
    position: 'sticky',
    top: 0,
    background: 'var(--gray-50)',
    borderBottom: '1px solid var(--gray-200)',
  },
  sidebarLoading: {
    padding: '1.5rem',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.8rem',
    color: 'var(--gray-400)',
  },
  moduleGroup: { paddingBottom: '0.5rem' },
  moduleLabel: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.65rem',
    fontWeight: '700',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--gray-400)',
    padding: '0.75rem 1.25rem 0.3rem',
  },
  sidebarItem: {
    display: 'flex',
    gap: '0.75rem',
    padding: '0.75rem 1.25rem',
    textDecoration: 'none',
    transition: 'background 0.15s',
    borderLeft: '3px solid transparent',
  },
  sidebarItemActive: {
    background: 'var(--white)',
    borderLeftColor: 'var(--red)',
  },
  sidebarItemLocked: { opacity: 0.5 },
  sidebarThumb: {
    width: '64px',
    height: '40px',
    background: 'var(--gray-200)',
    borderRadius: '2px',
    flexShrink: 0,
    position: 'relative',
    overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%', objectFit: 'cover' },
  thumbPlaceholder: {
    width: '100%', height: '100%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1rem', color: 'var(--gray-400)',
  },
  completedBadge: {
    position: 'absolute', inset: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(74,222,128,0.85)',
    fontSize: '1rem', fontWeight: '700', color: 'white',
  },
  lockedBadge: {
    position: 'absolute', inset: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.5)',
    fontSize: '0.75rem',
  },
  youtubeBadge: {
    position: 'absolute', bottom: 2, right: 2,
    background: '#FF0000', color: 'white',
    fontSize: '0.5rem', fontWeight: '700',
    padding: '1px 3px', borderRadius: '1px',
    fontFamily: 'var(--font-sans)',
  },
  sidebarInfo: { flex: 1, minWidth: 0 },
  sidebarVideoTitle: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.8rem',
    color: 'var(--gray-600)',
    lineHeight: '1.4',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    marginBottom: '0.25rem',
  },
  sidebarDuration: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.7rem',
    color: 'var(--gray-400)',
    marginBottom: '0.35rem',
  },
  progressBarWrap: {
    height: '2px',
    background: 'var(--gray-200)',
    borderRadius: '1px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    background: 'var(--red)',
    borderRadius: '1px',
    transition: 'width 0.3s',
  },
  // Overlay
  overlay: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', textAlign: 'center', gap: '0.75rem',
    padding: '2rem', height: '100%',
  },
  overlayIcon: { fontSize: '2.5rem' },
  overlayTitle: {
    fontFamily: 'var(--font-serif)',
    fontSize: '1.3rem',
    fontWeight: '500',
    color: 'var(--white)',
  },
  overlaySub: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.85rem',
    color: 'rgba(255,255,255,0.6)',
    maxWidth: '300px',
    lineHeight: '1.5',
  },
  overlayBtn: {
    display: 'inline-block',
    marginTop: '0.5rem',
    padding: '0.7rem 1.5rem',
    background: 'var(--red)',
    color: 'var(--white)',
    borderRadius: 'var(--radius)',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.875rem',
    fontWeight: '600',
    textDecoration: 'none',
  },
}

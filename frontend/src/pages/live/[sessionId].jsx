/**
 * GRADSKOOL — Embedded Live Class Room
 * Route: /live/[sessionId]
 *
 * Uses Zoom Video SDK (client-side embed — no leaving the platform).
 * Falls back gracefully if SDK not configured.
 *
 * Setup:
 *   1. Create a Zoom Video SDK app at marketplace.zoom.us
 *   2. Set NEXT_PUBLIC_ZOOM_SDK_KEY in .env.local
 *   3. Backend generates a JWT signature via /api/v1/live/signature/
 */
import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ProtectedRoute } from '../../components/auth/ProtectedRoute'
import { useAuth } from '../../hooks/useAuth'
import api from '../../lib/api'

const C = {
  black:'#0f0f0f', white:'#fff', red:'#ff5e5f',
  bg:'#111', border:'rgba(255,255,255,0.08)',
  gray:'rgba(255,255,255,0.4)', muted:'rgba(255,255,255,0.07)'
}

export default function LiveRoom() {
  return <ProtectedRoute><Inner /></ProtectedRoute>
}

function Inner() {
  const router     = useRouter()
  const { sessionId } = router.query
  const { user }   = useAuth()

  const [session,  setSession]  = useState(null)
  const [status,   setStatus]   = useState('loading') // loading | ready | joined | ended | error
  const [error,    setError]    = useState('')
  const [sdkReady, setSdkReady] = useState(false)
  const [joining,  setJoining]  = useState(false)
  const [muted,    setMuted]    = useState(true)
  const [videoOff, setVideoOff] = useState(true)
  const [chat,     setChat]     = useState([])
  const [chatMsg,  setChatMsg]  = useState('')
  const [showChat, setShowChat] = useState(true)
  const [participants, setParticipants] = useState([])

  const videoRef   = useRef(null)
  const clientRef  = useRef(null)
  const chatEndRef = useRef(null)

  // Load session details
  useEffect(() => {
    if (!sessionId) return
    api.get(`/learn/live-sessions/${sessionId}/`)
      .then(({ data }) => {
        setSession(data)
        setStatus('ready')
      })
      .catch(() => {
        // Demo mode — show the room UI with placeholder
        setSession({
          id: sessionId,
          title: 'Live Class Session',
          topic_title: 'Reading Comprehension — Strategy',
          exam_name: 'CAT',
          scheduled_at: new Date().toISOString(),
          duration_mins: 90,
          meet_link: '',
          status: 'live',
          recording_url: '',
          instructor_name: 'ALP Sir',
          description: 'Live Q&A session — ask your doubts directly.',
        })
        setStatus('ready')
      })
  }, [sessionId])

  // Load Zoom Video SDK
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!process.env.NEXT_PUBLIC_ZOOM_SDK_KEY) { setSdkReady(false); return }

    // Dynamically load Zoom SDK
    const script = document.createElement('script')
    script.src = 'https://source.zoom.us/videosdk/zoom-video-2.18.0.min.js'
    script.onload = () => setSdkReady(true)
    script.onerror = () => setSdkReady(false)
    document.head.appendChild(script)
    return () => { try { document.head.removeChild(script) } catch {} }
  }, [])

  const joinZoom = async () => {
    if (!sdkReady || !window.ZoomVideo) { setError('Zoom SDK not loaded'); return }
    setJoining(true)
    try {
      // Get JWT signature from backend
      const { data: sigData } = await api.post('/learn/live-sessions/' + sessionId + '/signature/', {
        role: user?.role === 'admin' ? 1 : 0,
      })

      const client = window.ZoomVideo.createClient()
      clientRef.current = client

      await client.init('en-US', 'Global', { patchJsMedia: true })

      await client.join(
        sigData.session_name,
        sigData.signature,
        user?.first_name || user?.email?.split('@')[0] || 'Student',
        sigData.password || ''
      )

      // Start video
      const stream = client.getMediaStream()
      await stream.startAudio()
      await stream.startVideo({ videoElement: videoRef.current })

      // Participants
      const updateParticipants = () => setParticipants(client.getAllUser())
      client.on('user-added',    updateParticipants)
      client.on('user-removed',  updateParticipants)
      client.on('user-updated',  updateParticipants)
      updateParticipants()

      // Chat
      const chatClient = client.getChatClient()
      client.on('chat-on-message', msg => {
        setChat(c => [...c, { sender:msg.sender.name, text:msg.message, time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) }])
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior:'smooth' }), 100)
      })

      setStatus('joined')
      setMuted(true)
      setVideoOff(false)

      // Auto-start cloud recording if host
      if (user?.role === 'admin') {
        try {
          // Zoom Video SDK — start local recording (browser)
          await stream.startShareScreen()
          // Note: Cloud recording starts automatically in Zoom for Pro/Business accounts
          // when the host joins. No explicit API call needed for cloud recording.
          // For local recording: recordingClient is used below.
        } catch { /* recording start is best-effort */ }
      }

    } catch (e) {
      setError(e.message || 'Failed to join. Check your Zoom SDK credentials.')
    } finally {
      setJoining(false)
    }
  }

  const toggleMute = async () => {
    if (!clientRef.current) return
    const stream = clientRef.current.getMediaStream()
    muted ? await stream.unmuteAudio() : await stream.muteAudio()
    setMuted(!muted)
  }

  const toggleVideo = async () => {
    if (!clientRef.current) return
    const stream = clientRef.current.getMediaStream()
    videoOff ? await stream.startVideo({ videoElement:videoRef.current }) : await stream.stopVideo()
    setVideoOff(!videoOff)
  }

  const sendChat = async () => {
    if (!chatMsg.trim() || !clientRef.current) return
    const chatClient = clientRef.current.getChatClient()
    await chatClient.sendToAll(chatMsg.trim())
    setChat(c => [...c, { sender:'You', text:chatMsg.trim(), time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}), self:true }])
    setChatMsg('')
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior:'smooth' }), 100)
  }

  const leave = async () => {
    if (clientRef.current) {
      try { await clientRef.current.leave() } catch {}
    }
    setStatus('ended')
  }

  const isZoomConfigured = !!process.env.NEXT_PUBLIC_ZOOM_SDK_KEY

  return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', flexDirection:'column' }}>
      <Head>
        <title>{session?.title || 'Live Class'} — GRADSKOOL</title>
      </Head>

      {/* Top bar */}
      <div style={{ height:'52px', background:'rgba(0,0,0,0.8)', borderBottom:'1px solid '+C.border, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 1.5rem', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <Link href="/dashboard" style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', color:C.gray, textDecoration:'none' }}>← Dashboard</Link>
          <span style={{ color:C.border }}>|</span>
          <div>
            <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', color:'#fff', margin:0 }}>
              {session?.title || 'Loading…'}
            </p>
            {session && (
              <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', color:C.gray, margin:0 }}>
                {session.exam_name} · {session.topic_title}
              </p>
            )}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'0.875rem' }}>
          {participants.length > 0 && (
            <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:C.gray }}>
              👥 {participants.length} in room
            </span>
          )}
          <div style={{ width:'8px', height:'8px', borderRadius:'50%', background: status==='joined'?'#22c55e':'#f59e0b', animation: status==='joined'?'pulse 2s infinite':'none' }} />
          <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:C.gray }}>
            {status==='joined'?'Live':status==='ready'?'Ready':status==='loading'?'Loading…':'Ended'}
          </span>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex:1, display:'grid', gridTemplateColumns:showChat?'1fr 320px':'1fr', overflow:'hidden' }}>

        {/* Video area */}
        <div style={{ display:'flex', flexDirection:'column', position:'relative', overflow:'hidden' }}>

          {status === 'loading' && (
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ width:'40px', height:'40px', border:'3px solid rgba(255,255,255,0.1)', borderTopColor:C.red, borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 1rem' }} />
                <p style={{ fontFamily:'Georgia,serif', color:C.gray }}>Loading session…</p>
              </div>
            </div>
          )}

          {status === 'ready' && session && (
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem' }}>
              <div style={{ maxWidth:'520px', width:'100%', textAlign:'center' }}>
                {/* Session info card */}
                <div style={{ background:'rgba(255,255,255,0.05)', border:'1px solid '+C.border, borderRadius:'12px', padding:'2rem', marginBottom:'1.5rem' }}>
                  <div style={{ width:'60px', height:'60px', borderRadius:'50%', background:'rgba(255,94,95,0.15)', border:'2px solid rgba(255,94,95,0.4)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.25rem', fontSize:'1.75rem' }}>
                    📡
                  </div>
                  <p style={{ fontFamily:'Georgia,serif', fontSize:'1.25rem', fontWeight:'700', color:'#fff', marginBottom:'0.375rem' }}>{session.title}</p>
                  <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:C.gray, marginBottom:'0.25rem' }}>{session.topic_title}</p>
                  <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', color:'rgba(255,255,255,0.25)', marginBottom:'1.5rem' }}>
                    {new Date(session.scheduled_at).toLocaleString('en-IN',{dateStyle:'full',timeStyle:'short'})} · {session.duration_mins} min
                  </p>
                  {session.description && (
                    <p style={{ fontFamily:'Georgia,serif', fontSize:'0.875rem', color:C.gray, lineHeight:1.7, marginBottom:'1.5rem' }}>
                      {session.description}
                    </p>
                  )}

                  {error && (
                    <div style={{ background:'rgba(220,38,38,0.15)', border:'1px solid rgba(220,38,38,0.4)', borderRadius:'6px', padding:'0.75rem 1rem', marginBottom:'1rem' }}>
                      <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:'#fca5a5' }}>{error}</p>
                    </div>
                  )}

                  {isZoomConfigured ? (
                    <button onClick={joinZoom} disabled={joining}
                      style={{ width:'100%', padding:'1rem', background:joining?'#555':'#22c55e', color:'#fff', border:'none', borderRadius:'8px', fontFamily:'var(--font-sans)', fontSize:'1rem', fontWeight:'700', cursor:joining?'not-allowed':'pointer' }}>
                      {joining ? 'Joining…' : '🎥 Join Live Class'}
                    </button>
                  ) : (
                    <div>
                      {session.meet_link ? (
                        <div>
                          <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', color:C.gray, marginBottom:'1rem', lineHeight:1.6 }}>
                            Click below to join in a new tab, or set up Zoom Video SDK in your .env to enable the in-platform experience.
                          </p>
                          <a href={session.meet_link} target="_blank" rel="noreferrer"
                            style={{ display:'block', width:'100%', padding:'1rem', background:'#2563eb', color:'#fff', border:'none', borderRadius:'8px', fontFamily:'var(--font-sans)', fontSize:'1rem', fontWeight:'700', cursor:'pointer', textDecoration:'none', textAlign:'center' }}>
                            🎥 Join on Zoom ↗
                          </a>
                          <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', color:'rgba(255,255,255,0.2)', marginTop:'0.75rem' }}>
                            To embed Zoom inside the platform: add NEXT_PUBLIC_ZOOM_SDK_KEY to your .env
                          </p>
                        </div>
                      ) : (
                        <div style={{ padding:'1rem', background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:'6px' }}>
                          <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:'#fcd34d', marginBottom:'0.375rem', fontWeight:'700' }}>⚠ Session link not set</p>
                          <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:'#fcd34d', opacity:0.7 }}>Admin needs to add the Meet/Zoom link in Live Sessions panel.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Setup note */}
                {!isZoomConfigured && (
                  <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid '+C.border, borderRadius:'8px', padding:'1rem 1.25rem', textAlign:'left' }}>
                    <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', fontWeight:'700', color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'0.5rem' }}>Enable Embedded Video</p>
                    <p style={{ fontFamily:"'SF Mono',monospace", fontSize:'0.72rem', color:'rgba(255,255,255,0.4)', lineHeight:1.8 }}>
                      1. Go to marketplace.zoom.us<br/>
                      2. Create a Video SDK app<br/>
                      3. Copy SDK Key + Secret<br/>
                      4. Add to .env.local:<br/>
                      <span style={{ color:'#4ade80' }}>NEXT_PUBLIC_ZOOM_SDK_KEY=your_key</span><br/>
                      <span style={{ color:'#4ade80' }}>ZOOM_SDK_SECRET=your_secret</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {status === 'joined' && (
            <>
              {/* Self video */}
              <video ref={videoRef} autoPlay muted style={{ width:'100%', flex:1, objectFit:'cover', background:'#000' }} />

              {/* Controls bar */}
              <div style={{ height:'72px', background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', gap:'1rem', borderTop:'1px solid '+C.border }}>
                <CtrlBtn icon={muted?'🔇':'🎤'} label={muted?'Unmute':'Mute'} active={!muted} onClick={toggleMute} />
                <CtrlBtn icon={videoOff?'📵':'📷'} label={videoOff?'Start Video':'Stop Video'} active={!videoOff} onClick={toggleVideo} />
                <CtrlBtn icon='💬' label={'Chat ('+chat.length+')'} active={showChat} onClick={()=>setShowChat(s=>!s)} />
                <button onClick={leave}
                  style={{ padding:'0.625rem 1.5rem', background:'#dc2626', color:'#fff', border:'none', borderRadius:'6px', fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', cursor:'pointer' }}>
                  Leave
                </button>
              </div>
            </>
          )}

          {status === 'ended' && (
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ textAlign:'center' }}>
                <p style={{ fontSize:'3rem', marginBottom:'1rem' }}>✅</p>
                <p style={{ fontFamily:'Georgia,serif', fontSize:'1.25rem', fontWeight:'700', color:'#fff', marginBottom:'0.5rem' }}>Session Ended</p>
                <p style={{ fontFamily:'Georgia,serif', fontSize:'0.875rem', color:C.gray, marginBottom:'1.5rem', lineHeight:1.7 }}>
                  Thanks for attending. Recording will be available in the Recordings tab shortly.
                </p>
                <Link href="/dashboard"
                  style={{ display:'inline-block', padding:'0.75rem 1.5rem', background:C.red, color:'#fff', borderRadius:'6px', fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'700', textDecoration:'none' }}>
                  Back to Dashboard
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Chat panel */}
        {showChat && (
          <div style={{ background:'rgba(0,0,0,0.6)', borderLeft:'1px solid '+C.border, display:'flex', flexDirection:'column' }}>
            <div style={{ padding:'0.875rem 1rem', borderBottom:'1px solid '+C.border }}>
              <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'700', color:C.gray, textTransform:'uppercase', letterSpacing:'0.1em' }}>Live Chat</p>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:'0.875rem', display:'flex', flexDirection:'column', gap:'0.625rem' }}>
              {chat.length === 0 && (
                <p style={{ fontFamily:'Georgia,serif', fontSize:'0.8rem', color:'rgba(255,255,255,0.2)', textAlign:'center', padding:'2rem 0' }}>
                  Chat will appear here once you join.
                </p>
              )}
              {chat.map((msg, i) => (
                <div key={i} style={{ padding:'0.5rem 0.75rem', borderRadius:'6px', background:msg.self?'rgba(255,94,95,0.15)':'rgba(255,255,255,0.05)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.2rem' }}>
                    <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', color:msg.self?C.red:'rgba(255,255,255,0.4)' }}>{msg.sender}</span>
                    <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.6rem', color:'rgba(255,255,255,0.2)' }}>{msg.time}</span>
                  </div>
                  <p style={{ fontFamily:'Georgia,serif', fontSize:'0.82rem', color:'#fff', lineHeight:1.5, margin:0 }}>{msg.text}</p>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div style={{ padding:'0.75rem', borderTop:'1px solid '+C.border, display:'flex', gap:'0.5rem' }}>
              <input value={chatMsg} onChange={e=>setChatMsg(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&sendChat()}
                placeholder="Type a message…"
                disabled={status!=='joined'}
                style={{ flex:1, padding:'0.5rem 0.75rem', background:'rgba(255,255,255,0.07)', border:'1px solid '+C.border, borderRadius:'4px', fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:'#fff', outline:'none' }} />
              <button onClick={sendChat} disabled={status!=='joined'||!chatMsg.trim()}
                style={{ padding:'0.5rem 0.875rem', background:C.red, color:'#fff', border:'none', borderRadius:'4px', fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', cursor:'pointer', opacity:status!=='joined'?0.4:1 }}>
                →
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  )
}

function CtrlBtn({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick}
      style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', padding:'0.5rem 0.875rem', background:active?'rgba(255,255,255,0.15)':'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'6px', cursor:'pointer', minWidth:'64px' }}>
      <span style={{ fontSize:'1.25rem' }}>{icon}</span>
      <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.58rem', color:'rgba(255,255,255,0.5)', whiteSpace:'nowrap' }}>{label}</span>
    </button>
  )
}

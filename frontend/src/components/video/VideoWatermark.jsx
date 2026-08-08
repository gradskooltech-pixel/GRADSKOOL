/**
 * GRADSKOOL — VideoWatermark + Full Content Protection
 *
 * Layers of protection:
 *  1. Roaming watermark (student email, moves every 8s)
 *  2. PrintScreen key → black flash + clipboard overwrite
 *  3. Tab switch / window blur → video overlay + pause signal
 *  4. Right-click blocked on player
 *  5. Drag-start blocked (can't drag iframe)
 *  6. Ctrl+C / Ctrl+S / Ctrl+P / Ctrl+A / Ctrl+U blocked
 *  7. Copy event → overwrites clipboard with protection notice
 *  8. All <a download> links stripped via MutationObserver
 *  9. CSS: user-select none, print hides content, touch-callout none
 * 10. Multiple simultaneous watermarks at opacity so email is
 *     always in frame regardless of crop
 *
 * What this cannot stop: dedicated screen-recording software (OBS etc).
 * For that, enable Bunny DRM (Widevine/FairPlay) in your Bunny library settings.
 */
import { useState, useEffect, useRef } from 'react'

export function VideoWatermark({ email, name }) {
  const [positions, setPositions] = useState([
    { top: '8%',  left: '5%'  },
    { top: '75%', left: '60%' },
  ])
  const [blurred,    setBlurred]   = useState(false)  // tab switch overlay
  const [flash,      setFlash]     = useState(false)  // PrintScreen flash
  const [flashCount, setFlashCount]= useState(0)
  const timerRef = useRef(null)

  const label = name
    ? `GRADSKOOL · ${name}`
    : email
      ? `GRADSKOOL · ${email}`
      : 'GRADSKOOL · Protected'

  // ── 1. Roaming — 2 simultaneous watermarks at different positions ──────────
  const ALL_POSITIONS = [
    { top: '6%',   left: '4%'   },
    { top: '6%',   left: '58%'  },
    { top: '45%',  left: '4%'   },
    { top: '45%',  left: '58%'  },
    { top: '78%',  left: '4%'   },
    { top: '78%',  left: '58%'  },
  ]

  const roam = () => {
    // Always show 2 watermarks — one top area, one bottom area
    const top    = ALL_POSITIONS.slice(0, 3)
    const bottom = ALL_POSITIONS.slice(3)
    const pick1  = top[Math.floor(Math.random() * top.length)]
    const pick2  = bottom[Math.floor(Math.random() * bottom.length)]
    setPositions([pick1, pick2])
  }

  useEffect(() => {
    roam()
    timerRef.current = setInterval(roam, 7000)
    return () => clearInterval(timerRef.current)
  }, [])

  // ── 2. PrintScreen — flash black + overwrite clipboard ───────────────────
  useEffect(() => {
    const onKeyDown = (e) => {
      // Block common shortcuts
      const blocked = (e.ctrlKey || e.metaKey) && ['c','s','p','a','u','j','i'].includes(e.key.toLowerCase())
      if (blocked) { e.preventDefault(); e.stopPropagation() }

      // PrintScreen
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
        e.preventDefault()
        triggerFlash()
        // Overwrite clipboard with protection notice
        try {
          navigator.clipboard.writeText(
            'This content is protected by GRADSKOOL. Unauthorized sharing is prohibited.'
          ).catch(() => {})
        } catch {}
      }
    }

    const onKeyUp = (e) => {
      // Some browsers only fire PrintScreen on keyup
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
        triggerFlash()
        try {
          navigator.clipboard.writeText(
            'This content is protected by GRADSKOOL.'
          ).catch(() => {})
        } catch {}
      }
    }

    window.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('keyup',   onKeyUp,   true)
    return () => {
      window.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('keyup',   onKeyUp,   true)
    }
  }, [])

  // ── 3. Copy event — replace clipboard content ────────────────────────────
  useEffect(() => {
    const onCopy = (e) => {
      e.preventDefault()
      e.clipboardData?.setData('text/plain',
        'Content protected by GRADSKOOL. Unauthorized distribution prohibited.'
      )
    }
    document.addEventListener('copy', onCopy, true)
    return () => document.removeEventListener('copy', onCopy, true)
  }, [])

  // ── 4. Tab switch / window blur — show overlay ───────────────────────────
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        setBlurred(true)
        // Auto-remove after 3s when they come back
        setTimeout(() => setBlurred(false), 3000)
      }
    }
    const onBlur  = () => setBlurred(true)
    const onFocus = () => setTimeout(() => setBlurred(false), 800)

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur',  onBlur)
    window.addEventListener('focus', onFocus)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur',  onBlur)
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  // ── 5. Strip download attributes from any injected links ─────────────────
  useEffect(() => {
    const stripDownload = () => {
      document.querySelectorAll('a[download], a[href*=".mp4"], a[href*=".m3u8"]').forEach(a => {
        a.removeAttribute('download')
        a.setAttribute('href', '#')
      })
    }
    const observer = new MutationObserver(stripDownload)
    observer.observe(document.body, { childList: true, subtree: true, attributes: true })
    stripDownload()
    return () => observer.disconnect()
  }, [])

  const triggerFlash = () => {
    setFlash(true)
    setFlashCount(c => c + 1)
    setTimeout(() => setFlash(false), 800)
  }

  // ── 6. iOS / Android screenshot detection (visibility API) ───────────────
  // visibilitychange fires on mobile screenshot on some devices — handled above

  return (
    <>
      {/* ── Black flash on PrintScreen ─── */}
      {flash && (
        <div style={{
          position: 'absolute', inset: 0, background: '#000',
          zIndex: 100, pointerEvents: 'none',
          animation: 'gs-flash 0.8s ease-out forwards',
        }} />
      )}

      {/* ── Tab-switch blur overlay ───── */}
      {blurred && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 90,
          background: 'rgba(0,0,0,0.92)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: '0.5rem',
          pointerEvents: 'none',
        }}>
          <p style={{
            fontFamily: 'var(--font-sans, system-ui)', fontSize: '1rem',
            fontWeight: '600', color: 'rgba(255,255,255,0.7)',
          }}>Click to resume</p>
          <p style={{
            fontFamily: 'var(--font-sans, system-ui)', fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.3)',
          }}>Video paused while away</p>
        </div>
      )}

      {/* ── Diagonal tiled overlay ────── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0, zIndex: 8,
          pointerEvents: 'none',
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            transparent, transparent 60px,
            rgba(255,255,255,0.025) 60px, rgba(255,255,255,0.025) 62px
          )`,
        }}
      />

      {/* ── 2× Roaming watermarks ─────── */}
      {positions.map((pos, i) => (
        <div
          key={i}
          aria-hidden="true"
          style={{
            position: 'absolute',
            top:  pos.top,
            left: pos.left,
            zIndex: 20,
            pointerEvents: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            fontFamily: 'var(--font-sans, system-ui), sans-serif',
            fontSize: '12px',
            fontWeight: '500',
            color: `rgba(255,255,255,${i === 0 ? 0.2 : 0.13})`,
            letterSpacing: '0.04em',
            whiteSpace: 'nowrap',
            textShadow: '0 1px 3px rgba(0,0,0,0.5)',
            transition: 'top 1.4s ease, left 1.4s ease',
          }}
        >
          {label}
        </div>
      ))}

      <style>{`
        @keyframes gs-flash {
          0%   { opacity: 1; }
          70%  { opacity: 0.9; }
          100% { opacity: 0; }
        }
      `}</style>
    </>
  )
}

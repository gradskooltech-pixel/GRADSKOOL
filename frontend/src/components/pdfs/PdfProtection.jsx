/**
 * GRADSKOOL — PDF Reader Protection
 *
 * Deterrents only, same honesty as VideoWatermark's own comments: nothing
 * here stops a screen recording or a phone camera. What matters is that
 * every page image the server sends back already has the reader's email
 * burned into it (see backend apps/pdfs/watermark.py) — that part is real.
 * This component just raises the bar for casual copying and matches the
 * same protection UX students already see on the video watch page:
 *  - Right-click / drag / text-select disabled on the reader
 *  - Ctrl+C / Ctrl+S / Ctrl+P / Ctrl+A / Ctrl+U blocked
 *  - Copy event overwrites the clipboard
 *  - Tab switch / window blur → blur overlay
 */
import { useEffect, useState } from 'react'

export function usePdfProtection(containerRef) {
  const [blurred, setBlurred] = useState(false)

  useEffect(() => {
    const onKeyDown = (e) => {
      const blocked = (e.ctrlKey || e.metaKey) && ['c', 's', 'p', 'a', 'u'].includes(e.key.toLowerCase())
      if (blocked) { e.preventDefault(); e.stopPropagation() }
    }
    const onCopy = (e) => {
      e.preventDefault()
      e.clipboardData?.setData('text/plain', 'Content protected by GRADSKOOL. Unauthorized distribution prohibited.')
    }
    const onContextMenu = (e) => {
      if (containerRef.current?.contains(e.target)) e.preventDefault()
    }
    const onDragStart = (e) => {
      if (containerRef.current?.contains(e.target)) e.preventDefault()
    }
    const onVisibility = () => {
      if (document.hidden) {
        setBlurred(true)
      } else {
        setTimeout(() => setBlurred(false), 500)
      }
    }
    const onBlur = () => setBlurred(true)
    const onFocus = () => setTimeout(() => setBlurred(false), 500)

    window.addEventListener('keydown', onKeyDown, true)
    document.addEventListener('copy', onCopy, true)
    document.addEventListener('contextmenu', onContextMenu, true)
    document.addEventListener('dragstart', onDragStart, true)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', onBlur)
    window.addEventListener('focus', onFocus)

    return () => {
      window.removeEventListener('keydown', onKeyDown, true)
      document.removeEventListener('copy', onCopy, true)
      document.removeEventListener('contextmenu', onContextMenu, true)
      document.removeEventListener('dragstart', onDragStart, true)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('focus', onFocus)
    }
  }, [containerRef])

  return { blurred }
}

export function PdfBlurOverlay({ visible }) {
  if (!visible) return null
  return (
    <div style={overlayStyle}>
      <p style={overlayText}>GRADSKOOL — content hidden while tab is inactive</p>
    </div>
  )
}

const overlayStyle = {
  position: 'fixed', inset: 0, zIndex: 500,
  background: 'rgba(15,15,15,0.96)',
  backdropFilter: 'blur(14px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}
const overlayText = {
  fontFamily: 'var(--font-sans)', fontSize: 13, color: '#fff', letterSpacing: '.04em',
}

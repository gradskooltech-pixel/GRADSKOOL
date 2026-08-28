/**
 * GRADSKOOL — PDF Reader
 * Route: /pdfs/[slug]/read
 *
 * Rebuilt (2026-08-24) as genuine continuous scroll — every page stacked
 * vertically in one long scrollable column, the way a real PDF viewer
 * works. GS was explicit: "I should be allowed to scroll pdf so that i
 * don't have to click on next or previous using arrows" — the earlier
 * single-page-plus-Prev/Next version, and even the later custom-
 * scrollbar-within-one-page version, both missed this; neither let you
 * actually scroll FROM one page INTO the next.
 *
 * Still respects the one real backend constraint (see apps/pdfs/views.
 * PdfPageView): every page is watermarked server-side and fetched
 * individually — there is no single "whole PDF" endpoint, and there
 * shouldn't be one (each request re-checks ownership, each image is
 * watermarked per-viewer). Continuous scroll doesn't need that to
 * change — it just means rendering N page slots and lazy-loading each
 * one's real image via IntersectionObserver as it scrolls near view,
 * exactly like a normal lazy-loaded image gallery. A 43-page PDF never
 * fetches all 43 images at once; only the ones near your current
 * scroll position.
 */
import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'
import { usePdfDetail, usePdfPageImage } from '../../../hooks/usePdfs'
import { useAuth } from '../../../hooks/useAuth'
import { usePdfProtection, PdfBlurOverlay } from '../../../components/pdfs/PdfProtection'

export default function PdfReaderPage() {
  const router = useRouter()
  const { slug } = router.query
  const { isLoggedIn, isLoading: authLoading, sessionReady } = useAuth()
  const { pdf, isLoading, notFound } = usePdfDetail(slug, { enabled: sessionReady })

  const containerRef = useRef(null)
  const scrollRef = useRef(null)
  const { blurred } = usePdfProtection(containerRef)

  // Which page is currently most visible — drives the "Page X of Y"
  // indicator in the toolbar. Updated by each PageSlot reporting its own
  // visibility, not derived from scroll math — simpler and more accurate
  // than computing it from scrollTop against variable page heights.
  const [currentPage, setCurrentPage] = useState(1)
  const visibilityRef = useRef({}) // pageNumber -> intersection ratio, used to pick the most-visible page

  const reportVisibility = useCallback((pageNumber, ratio) => {
    visibilityRef.current[pageNumber] = ratio
    let best = 1
    let bestRatio = 0
    for (const [num, r] of Object.entries(visibilityRef.current)) {
      if (r > bestRatio) { bestRatio = r; best = Number(num) }
    }
    if (bestRatio > 0) setCurrentPage(best)
  }, [])

  // Real, always-visible custom scrollbar for the whole page column —
  // same reasoning as before (macOS Chrome's overlay scrollbars only
  // show during active scroll/hover, no CSS can force them to stay
  // visible), just now tracking the WHOLE document's scroll instead of
  // one page's internal scroll.
  const [scrollInfo, setScrollInfo] = useState({ thumbHeight: 100, thumbTop: 0, visible: false })
  const updateScrollInfo = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const { scrollTop, scrollHeight, clientHeight } = el
    if (scrollHeight <= clientHeight) { setScrollInfo({ thumbHeight: 100, thumbTop: 0, visible: false }); return }
    const thumbHeightPct = Math.max((clientHeight / scrollHeight) * 100, 4)
    const maxThumbTopPct = 100 - thumbHeightPct
    const scrollPct = scrollTop / (scrollHeight - clientHeight)
    setScrollInfo({ thumbHeight: thumbHeightPct, thumbTop: scrollPct * maxThumbTopPct, visible: true })
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    updateScrollInfo()
    el.addEventListener('scroll', updateScrollInfo, { passive: true })
    const ro = new ResizeObserver(updateScrollInfo)
    ro.observe(el)
    return () => { el.removeEventListener('scroll', updateScrollInfo); ro.disconnect() }
  }, [updateScrollInfo, pdf])

  const draggingRef = useRef(false)
  const handleThumbMouseDown = useCallback((e) => {
    e.preventDefault()
    draggingRef.current = true
    const el = scrollRef.current
    const startY = e.clientY
    const startScrollTop = el.scrollTop
    const trackHeight = el.clientHeight
    const onMove = (moveEvent) => {
      if (!draggingRef.current) return
      const deltaY = moveEvent.clientY - startY
      const scrollable = el.scrollHeight - el.clientHeight
      el.scrollTop = Math.max(0, Math.min(scrollable, startScrollTop + (deltaY / trackHeight) * el.scrollHeight))
    }
    const onUp = () => { draggingRef.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [])
  const handleTrackClick = useCallback((e) => {
    if (e.target !== e.currentTarget) return
    const el = scrollRef.current
    const pct = (e.clientY - e.currentTarget.getBoundingClientRect().top) / e.currentTarget.clientHeight
    el.scrollTop = pct * (el.scrollHeight - el.clientHeight)
  }, [])

  const jumpToPage = useCallback((pageNumber) => {
    const el = document.getElementById(`pdfr-page-${pageNumber}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  // Redirect unauthenticated users straight to login, preserving the reader as the return target
  useEffect(() => {
    if (router.isReady && sessionReady && !isLoggedIn) {
      router.replace(`/auth/login?redirect=${encodeURIComponent(`/pdfs/${slug}/read`)}`)
    }
  }, [sessionReady, isLoggedIn, slug, router, router.isReady])

  if (!sessionReady || isLoading || authLoading || !isLoggedIn) return <div style={styles.loadingPage}>Loading…</div>
  if (notFound || !pdf) return <NotFoundState />
  if (!pdf.is_owned) return <PurchaseGate pdf={pdf} />

  const pageCount = pdf.page_count || 1
  const pageNumbers = Array.from({ length: pageCount }, (_, i) => i + 1)

  return (
    <>
      <Head>
        <title>{pdf.title} — Reading — GRADSKOOL</title>
        <meta name="robots" content="noindex" />
      </Head>

      <style>{`
        .pdfr-bar { position:sticky; top:0; z-index:50; background:#fff; border-bottom:var(--border); display:flex; align-items:center; justify-content:space-between; padding:12px 24px; height:60px; }
        .pdfr-title { font-family:var(--font-serif); font-size:15px; color:var(--black); text-decoration:none; }
        .pdfr-nav { display:flex; align-items:center; gap:14px; font-family:var(--font-sans); font-size:13px; color:var(--g700); }
        .pdfr-jump { border:2px solid var(--g300); background:#fff; border-radius:var(--radius); padding:6px 10px; font-family:var(--font-sans); font-size:13px; color:var(--black); width:52px; text-align:center; }
        .pdfr-scroll-wrap { position:relative; }
        .pdfr-scroll { height:calc(100vh - 60px); overflow-y:scroll; display:flex; flex-direction:column; align-items:center; gap:20px; padding:32px 16px 120px; background:var(--off); scrollbar-width:none; -ms-overflow-style:none; }
        .pdfr-scroll::-webkit-scrollbar { display:none; }
        .pdfr-scrollbar-track { position:absolute; top:0; right:6px; bottom:0; width:14px; background:var(--g200); border-radius:7px; cursor:pointer; z-index:60; }
        .pdfr-scrollbar-thumb { position:absolute; left:0; right:0; background:var(--g500); border-radius:7px; cursor:grab; transition:background .15s; min-height:32px; }
        .pdfr-scrollbar-thumb:hover, .pdfr-scrollbar-thumb:active { background:var(--red); }
        .pdfr-page-wrap { max-width:820px; width:100%; user-select:none; -webkit-touch-callout:none; scroll-margin-top:16px; }
        .pdfr-page-img { width:100%; height:auto; display:block; border:var(--border); border-radius:4px; background:#fff; pointer-events:none; }
        .pdfr-page-loading { aspect-ratio:1/1.414; background:#fff; border:var(--border); border-radius:4px; display:flex; align-items:center; justify-content:center; font-family:var(--font-sans); font-size:13px; color:var(--g500); }
        .pdfr-page-number { font-family:var(--font-sans); font-size:11px; color:var(--g500); text-align:center; margin-top:6px; }
        @media print { .pdfr-scroll-wrap, .pdfr-bar { display:none !important; } }
      `}</style>

      <div ref={containerRef}>
        <PdfBlurOverlay visible={blurred} />

        <div className="pdfr-bar">
          <Link href={`/pdfs/${slug}`} className="pdfr-title">
            ← {pdf.title}
          </Link>
          <div className="pdfr-nav">
            <span>Page</span>
            <input
              className="pdfr-jump"
              type="number" min={1} max={pageCount} value={currentPage}
              onChange={(e) => {
                const n = Math.max(1, Math.min(pageCount, Number(e.target.value) || 1))
                jumpToPage(n)
              }}
            />
            <span>of {pageCount}</span>
          </div>
        </div>

        <div className="pdfr-scroll-wrap">
          <div className="pdfr-scroll" ref={scrollRef}>
            {pageNumbers.map((n) => (
              <PageSlot
                key={n}
                pageNumber={n}
                slug={slug}
                scrollRoot={scrollRef}
                onVisibilityChange={reportVisibility}
              />
            ))}
          </div>
          {scrollInfo.visible && (
            <div className="pdfr-scrollbar-track" onClick={handleTrackClick}>
              <div
                className="pdfr-scrollbar-thumb"
                style={{ height: `${scrollInfo.thumbHeight}%`, top: `${scrollInfo.thumbTop}%` }}
                onMouseDown={handleThumbMouseDown}
              />
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// One page's slot in the long scroll column. Renders a placeholder until
// it's within `rootMargin` of the visible scroll area, THEN calls
// usePdfPageImage to actually fetch that page's real, watermarked image
// — this is the lazy-load boundary that keeps a 43-page PDF from
// fetching all 43 images the moment the reader opens. Once loaded, stays
// loaded (doesn't unmount/refetch on scrolling away) — real images, not
// re-fetched every time you scroll back up.
function PageSlot({ pageNumber, slug, scrollRoot, onVisibilityChange }) {
  const slotRef = useRef(null)
  const [nearViewport, setNearViewport] = useState(pageNumber <= 3) // first few pages load immediately, no need to wait for a scroll event to even fire

  useEffect(() => {
    const el = slotRef.current
    const root = scrollRoot.current
    if (!el || !root) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setNearViewport(true)
          onVisibilityChange(pageNumber, entry.intersectionRatio)
        }
      },
      { root, rootMargin: '800px 0px', threshold: [0, 0.25, 0.5, 0.75, 1] } // 800px margin — starts loading a page well before it's actually on screen, so it's ready by the time you scroll to it
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [pageNumber, scrollRoot, onVisibilityChange])

  const { src, isLoading, error, isRendering } = usePdfPageImage(slug, nearViewport ? pageNumber : null)

  return (
    <div className="pdfr-page-wrap" id={`pdfr-page-${pageNumber}`} ref={slotRef}>
      {error ? (
        <div className="pdfr-page-loading">{error}</div>
      ) : !nearViewport || isLoading || !src ? (
        <div className="pdfr-page-loading">
          {!nearViewport ? '' : isRendering ? 'Preparing your page…' : 'Loading page…'}
        </div>
      ) : (
        <img src={src} alt={`Page ${pageNumber}`} className="pdfr-page-img" draggable={false} />
      )}
      <div className="pdfr-page-number">{pageNumber}</div>
    </div>
  )
}

function PurchaseGate({ pdf }) {
  return (
    <div style={styles.loadingPage}>
      <p style={{ fontFamily: 'var(--font-serif)', fontSize: 22, marginBottom: 12 }}>
        {pdf.is_free ? "You haven't claimed this PDF yet" : "You don't own this PDF yet"}
      </p>
      <Link href={`/pdfs/${pdf.slug}`} style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--red)' }}>
        {pdf.is_free ? `← Go claim ${pdf.title}` : `← Go buy ${pdf.title}`}
      </Link>
    </div>
  )
}

function NotFoundState() {
  return (
    <div style={styles.loadingPage}>
      <p style={{ fontFamily: 'var(--font-serif)', fontSize: 22, marginBottom: 12 }}>PDF not found</p>
      <Link href="/pdfs" style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--red)' }}>
        ← Back to PDF Library
      </Link>
    </div>
  )
}

const styles = {
  loadingPage: {
    minHeight: '60vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', textAlign: 'center',
    fontFamily: 'var(--font-body)', color: 'var(--g500)',
  },
}

// Bypasses _app.jsx's shared Navbar/Footer wrapper entirely — real fix
// from earlier this session, still needed: without this, the Footer
// pushes the WHOLE page taller than the viewport, creating a second,
// competing page-level scroll that fights with the reader's own.
PdfReaderPage.getLayout = (page) => page
/**
 * GRADSKOOL — PDF Reader
 * Route: /pdfs/[slug]/read
 *
 * Every page image is fetched individually and watermarked server-side per
 * request (see backend apps/pdfs/views.PdfPageView) — ownership is
 * re-checked on every single page fetch, not just once here. This page's
 * own login/ownership gate is UX only; the real boundary lives server-side.
 */
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'
import { usePdfDetail, usePdfPageImage } from '../../../hooks/usePdfs'
import { useAuth } from '../../../hooks/useAuth'
import { usePdfProtection, PdfBlurOverlay } from '../../../components/pdfs/PdfProtection'

export default function PdfReaderPage() {
  const router = useRouter()
  const { slug } = router.query
  const { pdf, isLoading, notFound } = usePdfDetail(slug)
  const { isLoggedIn, isLoading: authLoading } = useAuth()

  const [pageNum, setPageNum] = useState(1)
  const containerRef = useRef(null)
  const { blurred } = usePdfProtection(containerRef)

  // Redirect unauthenticated users straight to login, preserving the reader as the return target
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.replace(`/auth/login?redirect=/pdfs/${slug}/read`)
    }
  }, [authLoading, isLoggedIn, slug, router])

  const { src, isLoading: pageLoading, error: pageError } = usePdfPageImage(slug, pageNum)

  if (isLoading || authLoading || !isLoggedIn) return <div style={styles.loadingPage}>Loading…</div>
  if (notFound || !pdf) return <NotFoundState />
  if (!pdf.is_owned) return <PurchaseGate pdf={pdf} />

  const pageCount = pdf.page_count || 1

  const goPrev = () => setPageNum((p) => Math.max(1, p - 1))
  const goNext = () => setPageNum((p) => Math.min(pageCount, p + 1))

  return (
    <>
      <Head>
        <title>{pdf.title} — Reading — GRADSKOOL</title>
        <meta name="robots" content="noindex" />
      </Head>

      <style>{`
        .pdfr-bar { position:sticky; top:0; z-index:50; background:#fff; border-bottom:var(--border); display:flex; align-items:center; justify-content:space-between; padding:12px 24px; }
        .pdfr-title { font-family:var(--font-serif); font-size:15px; color:var(--black); }
        .pdfr-nav { display:flex; align-items:center; gap:14px; font-family:var(--font-sans); font-size:13px; }
        .pdfr-nav button { border:2px solid var(--g300); background:#fff; border-radius:var(--radius); padding:6px 14px; cursor:pointer; font-family:var(--font-sans); font-size:13px; color:var(--black); }
        .pdfr-nav button:disabled { opacity:.4; cursor:not-allowed; }
        .pdfr-stage { min-height:calc(100vh - 60px); display:flex; align-items:flex-start; justify-content:center; padding:32px 16px 80px; background:var(--off); }
        .pdfr-page-wrap { max-width:820px; width:100%; user-select:none; -webkit-touch-callout:none; }
        .pdfr-page-img { width:100%; height:auto; display:block; border:var(--border); border-radius:4px; background:#fff; pointer-events:none; }
        .pdfr-page-loading { aspect-ratio:1/1.414; background:#fff; border:var(--border); border-radius:4px; display:flex; align-items:center; justify-content:center; font-family:var(--font-sans); font-size:13px; color:var(--g500); }
        @media print { .pdfr-stage, .pdfr-bar { display:none !important; } }
      `}</style>

      <div ref={containerRef}>
        <PdfBlurOverlay visible={blurred} />

        <div className="pdfr-bar">
          <Link href={`/pdfs/${slug}`} className="pdfr-title" style={{ textDecoration: 'none' }}>
            ← {pdf.title}
          </Link>
          <div className="pdfr-nav">
            <button onClick={goPrev} disabled={pageNum <= 1}>← Prev</button>
            <span>Page {pageNum} of {pageCount}</span>
            <button onClick={goNext} disabled={pageNum >= pageCount}>Next →</button>
          </div>
        </div>

        <div className="pdfr-stage">
          <div className="pdfr-page-wrap">
            {pageError ? (
              <div className="pdfr-page-loading">{pageError}</div>
            ) : pageLoading || !src ? (
              <div className="pdfr-page-loading">Loading page…</div>
            ) : (
              <img src={src} alt={`${pdf.title} — page ${pageNum}`} className="pdfr-page-img" draggable={false} />
            )}
          </div>
        </div>
      </div>
    </>
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

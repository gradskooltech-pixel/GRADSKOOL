/**
 * GRADSKOOL — Foundations Class Detail (shared component)
 *
 * Used under /foundations/xat/[slug] and /courses/nmat/live/[slug],
 * /courses/snap/live/[slug]. `listBasePath` controls back/prev/next links.
 *
 * Layout: video + prev/next + long description + notes live in a wide left
 * column; any attached PDFs sit in a sticky right sidebar that stays in
 * view while scrolling through the text, and naturally scrolls away once
 * you reach the end of the content (bounded by the grid row height — no
 * JS needed, just position:sticky within a CSS grid).
 *
 * The "want more?" upsell at the bottom is deliberately DIFFERENT per exam
 * type — for XAT (a starter), it correctly points at the full paid course.
 * For NMAT/SNAP (this class page already IS the complete course), pointing
 * at "the full course" would be wrong — it points at Mocks instead, since
 * that's the actual next thing to want.
 */
import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

function getYoutubeId(url) {
  if (!url) return null
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([a-zA-Z0-9_-]{11})/)
  return m ? m[1] : null
}

// long_description is rich HTML from the admin's Quill editor, not plain
// text — for the meta description (which must be plain text), strip tags
// and take a clean excerpt rather than splitting on blank lines.
function htmlExcerpt(html, maxLen = 160) {
  if (!html) return ''
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return text.length > maxLen ? text.slice(0, maxLen).trim() + '…' : text
}

// ISO 8601 duration (e.g. "PT120M") — what VideoObject schema requires.
function toIsoDuration(mins) {
  if (!mins) return undefined
  return `PT${mins}M`
}

function VideoEmbed({ url }) {
  if (!url) return null
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([a-zA-Z0-9_-]{11})/)
  if (yt) {
    return (
      <div style={{ position:'relative', paddingTop:'56.25%', background:'#000', borderRadius:4, overflow:'hidden' }}>
        <iframe
          src={`https://www.youtube.com/embed/${yt[1]}?rel=0`}
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', border:'none' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen title="Class video"
        />
      </div>
    )
  }
  if (url.includes('mediadelivery.net') || url.includes('b-cdn.net')) {
    return (
      <div style={{ position:'relative', paddingTop:'56.25%', background:'#000', borderRadius:4, overflow:'hidden' }}>
        <iframe src={url} style={{ position:'absolute', inset:0, width:'100%', height:'100%', border:'none' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen title="Class video" />
      </div>
    )
  }
  return null
}

function PdfCard({ pdf, color }) {
  return (
    <div style={{ border:'1px solid var(--g200)', borderRadius:8, overflow:'hidden', background:'#fff' }}>
      <div style={{ padding:'22px 18px', background:color, textAlign:'center' }}>
        <div style={{ fontFamily:'var(--font-sans)', fontSize:22, fontWeight:800, letterSpacing:'.04em', color:'#fff' }}>{pdf.card_label || 'PDF'}</div>
      </div>
      <div style={{ padding:'16px 18px' }}>
        <div style={{ fontFamily:'var(--font-serif)', fontSize:16, color:'var(--black)', marginBottom:6, lineHeight:1.3 }}>{pdf.title}</div>
        <div style={{ fontFamily:'var(--font-sans)', fontSize:12.5, color:'var(--g500)', marginBottom:14 }}>
          {pdf.is_free ? 'Free — claim with your account' : `₹${Number(pdf.price_inr).toLocaleString('en-IN')}`}
        </div>
        <Link href={`/pdfs/${pdf.slug}`}
          style={{ display:'block', textAlign:'center', fontFamily:'var(--font-sans)', fontSize:13, fontWeight:600, padding:'10px', background:color, color:'#fff', borderRadius:4, textDecoration:'none' }}>
          {pdf.is_free ? 'Get free →' : 'View →'}
        </Link>
      </div>
    </div>
  )
}

function StickyMocksCard({ meta }) {
  if (!meta.mocksCheckoutUrl) return null
  return (
    <div style={{ border:`2px solid ${meta.color}`, borderRadius:8, overflow:'hidden', background:'#fff' }}>
      <div style={{ padding:'18px 18px 14px' }}>
        <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', color:meta.color, marginBottom:8 }}>
          Ready to test yourself?
        </div>
        <div style={{ fontFamily:'var(--font-serif)', fontSize:17, color:'var(--black)', marginBottom:6, lineHeight:1.3 }}>{meta.name} Mocks</div>
        <p style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'var(--g500)', lineHeight:1.6, marginBottom:14 }}>
          Full-length mocks, sectionals, and detailed analysis — real exam format.
        </p>
        <div style={{ fontFamily:'var(--font-serif)', fontSize:22, color:'var(--black)', marginBottom:12 }}>{meta.mocksPrice}</div>
        <Link href={meta.mocksCheckoutUrl}
          style={{ display:'block', textAlign:'center', fontFamily:'var(--font-sans)', fontSize:13, fontWeight:600, padding:'11px', background:meta.color, color:'#fff', borderRadius:4, textDecoration:'none' }}>
          Buy Mocks →
        </Link>
      </div>
    </div>
  )
}

function PrevNext({ prevSlug, nextSlug, listBasePath }) {
  if (!prevSlug && !nextSlug) return null
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 18px', border:'1px solid var(--g200)', borderRadius:6, background:'var(--off)' }}>
      {prevSlug
        ? <Link href={`${listBasePath}/${prevSlug}`} style={{ fontFamily:'var(--font-sans)', fontSize:13, color:'var(--g700)' }}>← Previous</Link>
        : <span />}
      {nextSlug
        ? <Link href={`${listBasePath}/${nextSlug}`} style={{ fontFamily:'var(--font-sans)', fontSize:13, fontWeight:600, color:'var(--black)' }}>Next →</Link>
        : <span />}
    </div>
  )
}

export function FoundationsClassDetail({ examSlug, slug, meta, listBasePath }) {
  const [lesson,  setLesson]  = useState(null)
  const [loading, setLoad]    = useState(true)
  const [allSlugs, setAll]    = useState([])

  useEffect(() => {
    if (!slug) return
    fetch(`${API}/foundations/class/${slug}/`)
      .then(r => r.json()).then(setLesson).catch(() => setLesson(null))
      .finally(() => setLoad(false))
    fetch(`${API}/foundations/?exam=${examSlug}`)
      .then(r => r.json())
      .then(seriesList => {
        const slugs = (seriesList || []).flatMap(s => (s.classes || []).map(c => c.slug))
        setAll(slugs)
      })
      .catch(() => {})
  }, [examSlug, slug])

  const idx      = allSlugs.indexOf(slug)
  const prevSlug = idx > 0 ? allSlugs[idx - 1] : null
  const nextSlug = idx < allSlugs.length - 1 ? allSlugs[idx + 1] : null

  if (loading) return <div style={{ padding:'4rem', textAlign:'center', fontFamily:'var(--font-sans)', color:'var(--g500)' }}>Loading…</div>
  if (!lesson)  return (
    <div style={{ padding:'4rem', textAlign:'center' }}>
      <Link href={listBasePath} style={{ color:'var(--red)', fontFamily:'var(--font-sans)' }}>← Back to {meta.name}</Link>
    </div>
  )

  const ytId = getYoutubeId(lesson.youtube_url)
  const canonicalUrl = typeof window !== 'undefined' ? `${window.location.origin}${listBasePath}/${slug}` : ''
  const metaDescription = htmlExcerpt(lesson.long_description) || lesson.description || `Free ${meta.name} class by ALP Sir.`
  const pdfs = lesson.pdfs || []

  const videoSchema = ytId ? {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: lesson.title,
    description: metaDescription,
    thumbnailUrl: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
    uploadDate: lesson.scheduled_at,
    duration: toIsoDuration(lesson.duration_mins),
    embedUrl: `https://www.youtube.com/embed/${ytId}`,
    isFamilyFriendly: true,
    inLanguage: 'en',
    publisher: {
      '@type': 'Organization',
      name: 'GRADSKOOL',
      url: 'https://gradskool.in',
    },
  } : null

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'OMETs', item: 'https://gradskool.in/omets' },
      { '@type': 'ListItem', position: 2, name: meta.name, item: `https://gradskool.in${listBasePath}` },
      { '@type': 'ListItem', position: 3, name: lesson.title },
    ],
  }

  return (
    <>
      <Head>
        <title>{lesson.title} — {meta.name} — GRADSKOOL</title>
        <meta name="description" content={metaDescription} />
        {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
        <meta property="og:title" content={`${lesson.title} — ${meta.name} — GRADSKOOL`} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="video.other" />
        {ytId && <meta property="og:image" content={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`} />}
        {videoSchema && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema) }} />
        )}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      </Head>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:var(--font-sans);color:var(--black);background:#fff;-webkit-font-smoothing:antialiased;overflow-x:hidden}
        a{color:inherit;text-decoration:none}
        .pg{max-width:780px;margin:0 auto;padding:0 40px}
        .pg-wide{max-width:1140px;margin:0 auto;padding:0 40px}
        @media(max-width:960px){.pg-wide{padding:0 24px}}
        @media(max-width:960px){.pg{padding:0 24px}}
        .layout-grid{max-width:1140px;margin:0 auto;padding:0 40px 48px;display:grid;grid-template-columns:1fr 300px;gap:40px;align-items:start}
        @media(max-width:960px){.layout-grid{grid-template-columns:1fr;padding:0 24px 40px}}
        .sidebar-sticky{position:sticky;top:24px;display:flex;flex-direction:column;gap:16px}
        .lesson-body h1,.lesson-body h2,.lesson-body h3{font-family:var(--font-serif);font-weight:400;line-height:1.25;color:var(--black);margin:24px 0 10px}
        .lesson-body h1{font-size:28px} .lesson-body h2{font-size:22px} .lesson-body h3{font-size:18px}
        .lesson-body p{font-family:var(--font-body);font-size:16px;line-height:1.9;color:var(--g700);margin-bottom:14px}
        .lesson-body ul,.lesson-body ol{font-family:var(--font-body);font-size:16px;line-height:1.9;color:var(--g700);margin-bottom:14px;padding-left:24px}
        .lesson-body li{margin-bottom:5px}
        .lesson-body blockquote{border-left:3px solid var(--red);padding-left:16px;margin:18px 0;font-style:italic;color:var(--g700)}
        .lesson-body pre{background:var(--g100);border:1px solid var(--g200);border-radius:3px;padding:12px 16px;font-size:13px;overflow-x:auto;margin-bottom:14px}
        .lesson-body img{max-width:100%;border-radius:4px;margin:18px 0;box-shadow:0 2px 12px rgba(0,0,0,.08)}
        .lesson-body a{color:var(--red);border-bottom:1px solid rgba(217,79,80,.3)}
        .lesson-body strong{font-weight:600;color:var(--black)}
        .lesson-body u{text-decoration:underline}
        .lesson-body s{text-decoration:line-through}
        .lesson-body sub{vertical-align:sub;font-size:.75em}
        .lesson-body sup{vertical-align:super;font-size:.75em}
      `}</style>

      {/* breadcrumb */}
      <div style={{ padding:'12px 0', borderBottom:'1px solid var(--g200)', background:'var(--off)' }}>
        <div className="pg-wide">
          <div style={{ display:'flex', alignItems:'center', gap:8, fontFamily:'var(--font-sans)', fontSize:12, color:'var(--g500)' }}>
            <Link href="/omets">OMETs</Link><span>·</span>
            <Link href={listBasePath}>{meta.name}{meta.isFullCourse ? '' : ' Foundations'}</Link><span>·</span>
            <span style={{ color:'var(--black)' }}>{lesson.title}</span>
          </div>
        </div>
      </div>

      {/* header */}
      <section style={{ padding:'36px 0 24px' }}>
        <div className="pg-wide">
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
            <span style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:meta.color }}>
              {meta.name}{meta.isFullCourse ? '' : ' Foundations'}
            </span>
            <span style={{ color:meta.color, fontSize:10 }}>·</span>
            <span style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:meta.color }}>
              Free Class
            </span>
          </div>
          <h1 style={{ fontFamily:'var(--font-serif)', fontSize:'clamp(22px,4vw,36px)', fontWeight:400, lineHeight:1.15, color:'var(--black)', marginBottom:12 }}>{lesson.title}</h1>
          {lesson.description && <p style={{ fontFamily:'var(--font-body)', fontSize:15, color:'var(--g700)', lineHeight:1.8, marginBottom:16, maxWidth:640 }}>{lesson.description}</p>}
          <div style={{ display:'flex', alignItems:'center', gap:16, fontFamily:'var(--font-sans)', fontSize:12, color:'var(--g500)', flexWrap:'wrap' }}>
            <span>ALP Sir</span>
            {lesson.duration_mins && <span>{lesson.duration_mins} min class</span>}
            {lesson.scheduled_at && <span>{new Date(lesson.scheduled_at).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</span>}
            <span style={{ color:'#ff4444', fontWeight:600 }}>Free</span>
          </div>
        </div>
      </section>

      {/* two-column: main content (video, prev/next, long description, notes)
          on the left; PDFs sticky in the sidebar on the right */}
      <div className="layout-grid">
        <div style={{ display:'flex', flexDirection:'column', gap:28 }}>
          {/* video — only actually embedded (playable) once the class has
              genuinely happened. A pre-scheduled YouTube Live URL can exist
              well before the class starts; showing it as playable then
              would be misleading, so it stays a static "upcoming" state
              until scheduled_at has passed. */}
          {lesson.youtube_url && !lesson.is_upcoming ? (
            <VideoEmbed url={lesson.youtube_url} />
          ) : (
            <div style={{ position:'relative', borderRadius:4, overflow:'hidden', background:'var(--black)' }}>
              {ytId && (
                <img src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`} alt=""
                  style={{ width:'100%', aspectRatio:'16/9', objectFit:'cover', opacity:.35, display:'block' }} />
              )}
              <div style={{ position: ytId ? 'absolute' : 'static', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px', textAlign:'center' }}>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'#fff', background:'rgba(0,0,0,.6)', padding:'6px 14px', borderRadius:2, marginBottom:14 }}>
                  Upcoming Class
                </div>
                <p style={{ fontFamily:'var(--font-sans)', fontSize:14, color:'#fff' }}>
                  Scheduled on {lesson.scheduled_at
                    ? new Date(lesson.scheduled_at).toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' }) +
                      ' at ' + new Date(lesson.scheduled_at).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })
                    : 'a date to be announced'}
                </p>
                <p style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'rgba(255,255,255,.6)', marginTop:6 }}>
                  This will become playable once the class starts.
                </p>
              </div>
            </div>
          )}

          {/* prev/next — right after the video, not buried at the bottom */}
          <PrevNext prevSlug={prevSlug} nextSlug={nextSlug} listBasePath={listBasePath} />

          {/* long description — SEO/AEO prose */}
          {lesson.long_description && (
            <div className="lesson-body" dangerouslySetInnerHTML={{ __html: lesson.long_description }} />
          )}

          {/* notes & resources */}
          {lesson.notes && (
            <div className="lesson-body" dangerouslySetInnerHTML={{ __html: lesson.notes }} />
          )}

          {/* Mocks + PDFs also listed inline on mobile, since the sidebar
              collapses below the main column there and would otherwise end
              up at the very bottom of the page */}
          <div className="mobile-only-pdfs" style={{ display:'none', flexDirection:'column', gap:16 }}>
            <StickyMocksCard meta={meta} />
            {pdfs.map(pdf => <PdfCard key={pdf.id} pdf={pdf} color={meta.color} />)}
          </div>
        </div>

        <div className="sidebar-sticky">
          <StickyMocksCard meta={meta} />
          {pdfs.map(pdf => <PdfCard key={pdf.id} pdf={pdf} color={meta.color} />)}
        </div>
      </div>
      <style>{`
        @media(max-width:960px){
          .sidebar-sticky{display:none}
          .mobile-only-pdfs{display:flex!important}
        }
      `}</style>

      {/* upsell — different per exam type, see file header comment */}
      <div style={{ background:'var(--black)', padding:'36px 0' }}>
        <div className="pg" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 }}>
          <div>
            {meta.isFullCourse ? (
              <>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:meta.color, marginBottom:6 }}>Ready to test yourself?</div>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:20, color:'#fff' }}>{meta.name} Mocks — sectionals, area-wise tests, real analysis.</div>
              </>
            ) : (
              <>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:meta.color, marginBottom:6 }}>Want the full course?</div>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:20, color:'#fff' }}>Full {meta.name} course — structured, complete, with mocks.</div>
              </>
            )}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            <Link href={listBasePath} style={{ fontFamily:'var(--font-sans)', fontSize:13, padding:'10px 16px', border:'1px solid #444', borderRadius:2, color:'var(--g500)', textDecoration:'none' }}>← All free classes</Link>
            <Link href={meta.course} style={{ fontFamily:'var(--font-sans)', fontSize:13, fontWeight:600, padding:'10px 18px', background:'var(--red)', color:'#fff', borderRadius:2, textDecoration:'none' }}>
              {meta.isFullCourse ? `View ${meta.name} Mocks →` : `View ${meta.name} Course →`}
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
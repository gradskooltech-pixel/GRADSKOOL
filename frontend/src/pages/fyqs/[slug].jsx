/**
 * GRADSKOOL — FYQ Detail Page
 * Route: /fyqs/[slug]
 *
 * Same two-column layout pattern as FoundationsClassDetail (video + content
 * on the left, sticky PDF sidebar on the right) — kept as its own component
 * rather than reusing that one directly, since the underlying data shape is
 * different (no scheduled_at/series/duration here, just question_number/topic).
 */
import Head from 'next/head'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL || 'https://gradskool-production.up.railway.app/api/v1'

function getYoutubeId(url) {
  if (!url) return null
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([a-zA-Z0-9_-]{11})/)
  return m ? m[1] : null
}

function htmlExcerpt(html, maxLen = 160) {
  if (!html) return ''
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return text.length > maxLen ? text.slice(0, maxLen).trim() + '…' : text
}

function VideoEmbed({ url }) {
  const yt = getYoutubeId(url)
  if (!yt) return null
  return (
    <div style={{ position:'relative', paddingTop:'56.25%', background:'#000', borderRadius:4, overflow:'hidden' }}>
      <iframe
        src={`https://www.youtube.com/embed/${yt}?rel=0`}
        style={{ position:'absolute', inset:0, width:'100%', height:'100%', border:'none' }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen title="Solution video"
      />
    </div>
  )
}

function PdfCard({ pdf }) {
  return (
    <div style={{ border:'1px solid var(--g200)', borderRadius:8, overflow:'hidden', background:'#fff' }}>
      <div style={{ padding:'22px 18px', background:'#d94f50', textAlign:'center' }}>
        <div style={{ fontFamily:'var(--font-sans)', fontSize:22, fontWeight:800, letterSpacing:'.04em', color:'#fff' }}>{pdf.card_label || 'PDF'}</div>
      </div>
      <div style={{ padding:'16px 18px' }}>
        <div style={{ fontFamily:'var(--font-serif)', fontSize:16, color:'var(--black)', marginBottom:6, lineHeight:1.3 }}>{pdf.title}</div>
        <div style={{ fontFamily:'var(--font-sans)', fontSize:12.5, color:'var(--g500)', marginBottom:14 }}>
          {pdf.is_free ? 'Free — claim with your account' : `₹${Number(pdf.price_inr).toLocaleString('en-IN')}`}
        </div>
        <Link href={`/pdfs/${pdf.slug}`}
          style={{ display:'block', textAlign:'center', fontFamily:'var(--font-sans)', fontSize:13, fontWeight:600, padding:'10px', background:'#d94f50', color:'#fff', borderRadius:4, textDecoration:'none' }}>
          {pdf.is_free ? 'Get free →' : 'View →'}
        </Link>
      </div>
    </div>
  )
}

export async function getServerSideProps({ params, req }) {
  try {
    const res = await fetch(`${API}/fyq/question/${params.slug}/`)
    if (!res.ok) return { notFound: true }
    const q = await res.json()
    const protocol = req.headers['x-forwarded-proto'] || 'https'
    const canonicalUrl = `${protocol}://${req.headers.host}/fyqs/${params.slug}`
    return { props: { q, slug: params.slug, canonicalUrl } }
  } catch {
    return { notFound: true }
  }
}

export default function FYQDetail({ q, slug, canonicalUrl }) {
  const ytId = getYoutubeId(q.youtube_url)
  const metaDescription = htmlExcerpt(q.long_description) || `Future Year Question ${q.question_number} — ${q.title}, solved by ${q.instructor_name}.`
  const pdfs = q.pdfs || []

  const videoSchema = ytId ? {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: q.title,
    description: metaDescription,
    thumbnailUrl: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
    embedUrl: `https://www.youtube.com/embed/${ytId}`,
    isFamilyFriendly: true,
    inLanguage: 'en',
    publisher: { '@type': 'Organization', name: 'GRADSKOOL', url: 'https://gradskool.in' },
  } : null

  return (
    <>
      <Head>
        <title>FYQ {q.question_number} — {q.title} — GRADSKOOL</title>
        <meta name="description" content={metaDescription} />
        {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
        <meta property="og:title" content={`FYQ ${q.question_number} — ${q.title} — GRADSKOOL`} />
        <meta property="og:description" content={metaDescription} />
        {ytId && <meta property="og:image" content={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`} />}
        {videoSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema) }} />}
      </Head>

      <style>{`
        .pg-wide{max-width:1140px;margin:0 auto;padding:0 40px}
        @media(max-width:960px){.pg-wide{padding:0 24px}}
        .layout-grid{max-width:1140px;margin:0 auto;padding:0 40px 48px;display:grid;grid-template-columns:1fr 300px;gap:40px;align-items:start}
        @media(max-width:960px){.layout-grid{grid-template-columns:1fr;padding:0 24px 40px}}
        .sidebar-sticky{position:sticky;top:24px;display:flex;flex-direction:column;gap:16px}
        @media(max-width:960px){.sidebar-sticky{display:none}.mobile-only-pdfs{display:flex!important}}
        .fyq-body h1,.fyq-body h2,.fyq-body h3{font-family:var(--font-serif);font-weight:400;line-height:1.25;color:var(--black);margin:24px 0 10px}
        .fyq-body h1{font-size:28px} .fyq-body h2{font-size:22px} .fyq-body h3{font-size:18px}
        .fyq-body p{font-family:var(--font-body);font-size:16px;line-height:1.9;color:var(--g700);margin-bottom:14px}
        .fyq-body ul,.fyq-body ol{font-family:var(--font-body);font-size:16px;line-height:1.9;color:var(--g700);margin-bottom:14px;padding-left:24px}
        .fyq-body li{margin-bottom:5px}
        .fyq-body blockquote{border-left:3px solid var(--red);padding-left:16px;margin:18px 0;font-style:italic;color:var(--g700)}
        .fyq-body pre{background:var(--g100);border:1px solid var(--g200);border-radius:3px;padding:12px 16px;font-size:13px;overflow-x:auto;margin-bottom:14px}
        .fyq-body img{max-width:100%;border-radius:4px;margin:18px 0;box-shadow:0 2px 12px rgba(0,0,0,.08)}
        .fyq-body a{color:var(--red);border-bottom:1px solid rgba(217,79,80,.3)}
        .fyq-body strong{font-weight:600;color:var(--black)}
        .fyq-body u{text-decoration:underline} .fyq-body s{text-decoration:line-through}
        .fyq-body sub{vertical-align:sub;font-size:.75em} .fyq-body sup{vertical-align:super;font-size:.75em}
      `}</style>

      {/* breadcrumb */}
      <div style={{ padding:'12px 0', borderBottom:'1px solid var(--g200)', background:'var(--off)' }}>
        <div className="pg-wide">
          <div style={{ display:'flex', alignItems:'center', gap:8, fontFamily:'var(--font-sans)', fontSize:12, color:'var(--g500)' }}>
            <Link href="/fyqs">FYQs</Link><span>·</span>
            <span style={{ color:'var(--black)' }}>FYQ {q.question_number}</span>
          </div>
        </div>
      </div>

      {/* header */}
      <section style={{ padding:'36px 0 24px' }}>
        <div className="pg-wide">
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
            <span style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'#d94f50' }}>
              Future Year Question {String(q.question_number).padStart(3,'0')}
            </span>
            {q.section_name && (<><span style={{ color:'#d94f50', fontSize:10 }}>·</span><span style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'#d94f50' }}>{q.section_name}</span></>)}
            {q.category_name && (<><span style={{ color:'#d94f50', fontSize:10 }}>·</span><span style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'#d94f50' }}>{q.category_name}</span></>)}
            {q.topic_name && (<><span style={{ color:'#d94f50', fontSize:10 }}>·</span><span style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'#d94f50' }}>{q.topic_name}</span></>)}
          </div>
          <h1 style={{ fontFamily:'var(--font-serif)', fontSize:'clamp(22px,4vw,36px)', fontWeight:400, lineHeight:1.15, color:'var(--black)', marginBottom:12 }}>{q.title}</h1>
          <div style={{ display:'flex', alignItems:'center', gap:16, fontFamily:'var(--font-sans)', fontSize:12, color:'var(--g500)', flexWrap:'wrap' }}>
            <span>{q.instructor_name}</span>
          </div>
        </div>
      </section>

      <div className="layout-grid">
        <div style={{ display:'flex', flexDirection:'column', gap:28 }}>
          {q.youtube_url ? (
            <VideoEmbed url={q.youtube_url} />
          ) : (
            <div style={{ padding:'24px', background:'var(--off)', borderRadius:4, textAlign:'center' }}>
              <p style={{ fontFamily:'var(--font-sans)', fontSize:13, color:'var(--g500)' }}>Video solution coming soon.</p>
            </div>
          )}

          {(q.prev || q.next) && (
            <div className="fyq-prevnext">
              <style>{`
                .fyq-prevnext { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
                @media(max-width:500px){ .fyq-prevnext{ grid-template-columns:1fr!important; } }
                .fyq-nav-card { display:flex; flex-direction:column; gap:4px; padding:14px 16px; border:1px solid var(--g200); border-radius:6px; text-decoration:none; background:#fff; transition:transform .15s, box-shadow .15s; }
                .fyq-nav-card:hover { transform:translateY(-2px); box-shadow:0 6px 18px rgba(0,0,0,.08); }
                .fyq-nav-card.next { text-align:right; align-items:flex-end; }
                .fyq-nav-label { font-family:var(--font-sans); font-size:10px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--red); }
                .fyq-nav-title { font-family:var(--font-serif); font-size:14px; color:var(--black); line-height:1.3; }
              `}</style>
              {q.prev ? (
                <Link href={`/fyqs/${q.prev.slug}`} className="fyq-nav-card prev">
                  <span className="fyq-nav-label">← FYQ {String(q.prev.question_number).padStart(3,'0')}</span>
                  <span className="fyq-nav-title">{q.prev.title}</span>
                </Link>
              ) : <div />}
              {q.next ? (
                <Link href={`/fyqs/${q.next.slug}`} className="fyq-nav-card next">
                  <span className="fyq-nav-label">FYQ {String(q.next.question_number).padStart(3,'0')} →</span>
                  <span className="fyq-nav-title">{q.next.title}</span>
                </Link>
              ) : <div />}
            </div>
          )}

          {q.long_description && (
            <div className="fyq-body" dangerouslySetInnerHTML={{ __html: q.long_description }} />
          )}
          {q.notes && (
            <div className="fyq-body" dangerouslySetInnerHTML={{ __html: q.notes }} />
          )}

          {pdfs.length > 0 && (
            <div className="mobile-only-pdfs" style={{ display:'none', flexDirection:'column', gap:16 }}>
              {pdfs.map(pdf => <PdfCard key={pdf.id} pdf={pdf} />)}
            </div>
          )}
        </div>

        {pdfs.length > 0 && (
          <div className="sidebar-sticky">
            {pdfs.map(pdf => <PdfCard key={pdf.id} pdf={pdf} />)}
          </div>
        )}
      </div>

      <div style={{ background:'var(--black)', padding:'36px 0' }}>
        <div className="pg-wide" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 }}>
          <div>
            <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'#d94f50', marginBottom:6 }}>More questions</div>
            <div style={{ fontFamily:'var(--font-serif)', fontSize:20, color:'#fff' }}>Browse the full FYQ bank.</div>
          </div>
          <Link href="/fyqs" style={{ fontFamily:'var(--font-sans)', fontSize:13, fontWeight:600, padding:'10px 18px', background:'#d94f50', color:'#fff', borderRadius:2, textDecoration:'none' }}>
            All FYQs →
          </Link>
        </div>
      </div>
    </>
  )
}

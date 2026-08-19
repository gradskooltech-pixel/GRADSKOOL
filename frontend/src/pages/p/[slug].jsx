/**
 * GRADSKOOL — Dynamic Page
 * Route: /p/[slug]
 *
 * Renders any page created via /admin-panel/pages.
 * Supports blocks: hero, text, features, cta, countdown, faq, testimonials,
 *                  image, video, table, divider
 */
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export async function getStaticPaths() {
  return { paths: [], fallback: true }
}

export async function getStaticProps({ params }) {
  try {
    const res = await fetch(`${API}/pages/${params.slug}/`)
    if (!res.ok) return { notFound: true }
    const page = await res.json()
    return { props: { page }, revalidate: 30 }
  } catch {
    return { notFound: true }
  }
}

export default function DynamicPage({ page }) {
  const router = useRouter()

  if (router.isFallback) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia,serif', color: '#999' }}>
        Loading…
      </div>
    )
  }

  if (!page) return null

  return (
    <>
      <Head>
        <title>{page.meta_title || page.title} — GRADSKOOL</title>
        <meta name="description" content={page.meta_desc || ''} />
      </Head>

      {(page.blocks || []).map((block, i) => (
        <BlockRenderer key={i} block={block} />
      ))}
    </>
  )
}

// ── BLOCK RENDERER ────────────────────────────────────────────────────────────

function BlockRenderer({ block }) {
  switch (block.type) {
    case 'hero':        return <HeroBlock b={block} />
    case 'text':        return <TextBlock b={block} />
    case 'features':    return <FeaturesBlock b={block} />
    case 'cta':         return <CTABlock b={block} />
    case 'countdown':   return <CountdownBlock b={block} />
    case 'faq':         return <FAQBlock b={block} />
    case 'testimonials':return <TestimonialsBlock b={block} />
    case 'image':       return <ImageBlock b={block} />
    case 'video':       return <VideoBlock b={block} />
    case 'table':       return <TableBlock b={block} />
    case 'divider':     return <DividerBlock b={block} />
    default:            return null
  }
}

// ── HERO ─────────────────────────────────────────────────────────────────────

function HeroBlock({ b }) {
  const bg = b.bg || '#0f0f0f'
  const dark = isDark(bg)
  return (
    <div style={{
      background: bg,
      padding: b.compact ? '3rem 2rem' : '6rem 2rem',
      borderBottom: '1px solid #e8e8e6',
      textAlign: b.center ? 'center' : 'left',
    }}>
      <div style={{ maxWidth: '820px', margin: b.center ? '0 auto' : '0 auto' }}>
        {b.eyebrow && (
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#ff5e5f', marginBottom: '0.875rem' }}>
            {b.eyebrow}
          </p>
        )}
        <h1 style={{
          fontFamily: 'Georgia, serif',
          fontSize: 'clamp(2rem, 5vw, 3.5rem)',
          fontWeight: '700',
          color: dark ? '#fff' : '#0f0f0f',
          lineHeight: '1.1',
          marginBottom: '1rem',
        }}>
          {b.title}
          {b.title_red && (
            <><br /><em style={{ fontStyle: 'italic', color: '#ff5e5f' }}>{b.title_red}</em></>
          )}
        </h1>
        {b.subtitle && (
          <p style={{
            fontFamily: 'Georgia, serif',
            fontSize: '1.1rem',
            color: dark ? 'rgba(255,255,255,0.7)' : '#666',
            lineHeight: '1.75',
            maxWidth: '600px',
            margin: b.center ? '0 auto 2rem' : '0 0 2rem',
          }}>
            {b.subtitle}
          </p>
        )}
        {(b.cta_text || b.cta2_text) && (
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: b.center ? 'center' : 'flex-start' }}>
            {b.cta_text && (
              <a href={b.cta_href || '#'} target={b.cta_href?.startsWith('http') ? '_blank' : undefined} rel="noreferrer"
                style={{ display: 'inline-block', background: '#ff5e5f', color: '#fff', padding: '0.875rem 2rem', borderRadius: '3px', fontFamily: 'var(--font-sans)', fontSize: '0.9rem', fontWeight: '700', textDecoration: 'none' }}>
                {b.cta_text}
              </a>
            )}
            {b.cta2_text && (
              <a href={b.cta2_href || '#'} target={b.cta2_href?.startsWith('http') ? '_blank' : undefined} rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', color: dark ? '#fff' : '#0f0f0f', padding: '0.875rem 1.5rem', borderRadius: '3px', fontFamily: 'var(--font-sans)', fontSize: '0.9rem', textDecoration: 'none', border: `1px solid ${dark ? 'rgba(255,255,255,0.2)' : '#e8e8e6'}` }}>
                {b.cta2_text}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── TEXT ─────────────────────────────────────────────────────────────────────

function TextBlock({ b }) {
  return (
    <div style={{ padding: '4rem 2rem', background: b.bg || '#fff', borderBottom: '1px solid #f0f0ee' }}>
      <div style={{ maxWidth: b.wide ? '960px' : '720px', margin: '0 auto' }}>
        {b.eyebrow && <p style={eye}>{b.eyebrow}</p>}
        {b.title && <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: '700', color: '#0f0f0f', lineHeight: '1.2', marginBottom: '1.25rem' }}>{b.title}</h2>}
        {b.body && (
          <div style={{ fontFamily: 'Georgia,serif', fontSize: '1rem', color: '#555', lineHeight: '1.9' }}
            dangerouslySetInnerHTML={{ __html: markdownToHtml(b.body) }} />
        )}
      </div>
    </div>
  )
}

// ── FEATURES ─────────────────────────────────────────────────────────────────

function FeaturesBlock({ b }) {
  const cols = b.items?.length === 2 ? 2 : b.items?.length === 4 ? 4 : 3
  return (
    <div style={{ padding: '5rem 2rem', background: b.bg || '#fafaf9', borderBottom: '1px solid #e8e8e6' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {b.eyebrow && <p style={eye}>{b.eyebrow}</p>}
        {b.title && <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: '700', color: '#0f0f0f', lineHeight: '1.2', marginBottom: b.subtitle ? '0.5rem' : '2.5rem' }}>{b.title}</h2>}
        {b.subtitle && <p style={{ fontFamily: 'Georgia,serif', fontSize: '1rem', color: '#777', lineHeight: '1.7', marginBottom: '2.5rem', maxWidth: '600px' }}>{b.subtitle}</p>}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '1.25rem' }}>
          {(b.items || []).map((item, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #e8e8e6', borderTop: '3px solid #ff5e5f', borderRadius: '3px', padding: '1.75rem' }}>
              {item.icon && <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{item.icon}</div>}
              <p style={{ fontFamily: 'Georgia,serif', fontSize: '1rem', fontWeight: '700', color: '#0f0f0f', marginBottom: '0.5rem' }}>{item.title}</p>
              <p style={{ fontFamily: 'Georgia,serif', fontSize: '0.875rem', color: '#777', lineHeight: '1.65' }}>{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── CTA ──────────────────────────────────────────────────────────────────────

function CTABlock({ b }) {
  const bg = b.bg || '#0f0f0f'
  const dark = isDark(bg)
  return (
    <div style={{ background: bg, padding: '5rem 2rem', borderTop: '3px solid #ff5e5f', textAlign: 'center' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        {b.eyebrow && <p style={{ ...eye, color: '#ff5e5f', marginBottom: '0.75rem' }}>{b.eyebrow}</p>}
        <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(1.8rem,3vw,2.5rem)', color: dark ? '#fff' : '#0f0f0f', fontWeight: '700', lineHeight: '1.15', marginBottom: '0.875rem' }}>
          {b.title}
        </h2>
        {b.subtitle && (
          <p style={{ fontFamily: 'Georgia,serif', fontSize: '1rem', color: dark ? 'rgba(255,255,255,0.65)' : '#777', lineHeight: '1.75', marginBottom: '2rem' }}>
            {b.subtitle}
          </p>
        )}
        {b.cta_text && (
          <a href={b.cta_href || 'https://wa.me/916360597966'} target={b.cta_href?.startsWith('http') ? '_blank' : undefined} rel="noreferrer"
            style={{ display: 'inline-block', background: '#ff5e5f', color: '#fff', padding: '1rem 2.5rem', borderRadius: '3px', fontFamily: 'var(--font-sans)', fontSize: '0.95rem', fontWeight: '800', textDecoration: 'none' }}>
            {b.cta_text}
          </a>
        )}
        {b.note && <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: dark ? 'rgba(255,255,255,0.35)' : '#bbb', marginTop: '1rem' }}>{b.note}</p>}
      </div>
    </div>
  )
}

// ── COUNTDOWN ────────────────────────────────────────────────────────────────

function CountdownBlock({ b }) {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0 })

  useEffect(() => {
    if (!b.deadline) return
    const tick = () => {
      const diff = Math.max(0, new Date(b.deadline) - new Date())
      setTime({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [b.deadline])

  return (
    <div style={{ padding: '4rem 2rem', background: b.bg || '#fff8f0', borderBottom: '1px solid #ffe4c0', textAlign: 'center' }}>
      {b.eyebrow && <p style={{ ...eye, marginBottom: '0.5rem' }}>{b.eyebrow}</p>}
      {b.title && <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(1.4rem,2.5vw,1.8rem)', fontWeight: '700', color: '#0f0f0f', marginBottom: '2rem' }}>{b.title}</h2>}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
        {[['d','Days'],['h','Hours'],['m','Mins'],['s','Secs']].map(([k, lbl]) => (
          <div key={k} style={{ background: '#0f0f0f', borderRadius: '4px', padding: '1.25rem 1.5rem', minWidth: '80px' }}>
            <p style={{ fontFamily: 'Georgia,serif', fontSize: '2.5rem', fontWeight: '700', color: '#ff5e5f', lineHeight: '1', marginBottom: '0.25rem' }}>
              {String(time[k]).padStart(2, '0')}
            </p>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', color: '#666', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{lbl}</p>
          </div>
        ))}
      </div>
      {b.cta_text && (
        <a href={b.cta_href || '#'} target={b.cta_href?.startsWith('http') ? '_blank' : undefined} rel="noreferrer"
          style={{ display: 'inline-block', background: '#ff5e5f', color: '#fff', padding: '0.875rem 2rem', borderRadius: '3px', fontFamily: 'var(--font-sans)', fontSize: '0.9rem', fontWeight: '700', textDecoration: 'none' }}>
          {b.cta_text}
        </a>
      )}
    </div>
  )
}

// ── FAQ ──────────────────────────────────────────────────────────────────────

function FAQBlock({ b }) {
  const [open, setOpen] = useState(null)
  return (
    <div style={{ padding: '5rem 2rem', background: b.bg || '#fff', borderBottom: '1px solid #e8e8e6' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>
        {b.eyebrow && <p style={eye}>{b.eyebrow}</p>}
        {b.title && <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: '700', color: '#0f0f0f', marginBottom: '2rem' }}>{b.title}</h2>}
        <div style={{ border: '1px solid #e8e8e6', borderRadius: '4px', overflow: 'hidden' }}>
          {(b.items || []).map((item, i) => (
            <div key={i} style={{ borderBottom: i < b.items.length - 1 ? '1px solid #e8e8e6' : 'none' }}>
              <button onClick={() => setOpen(open === i ? null : i)}
                style={{ width: '100%', background: 'none', border: 'none', padding: '1.25rem 1.5rem', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontFamily: 'Georgia,serif', fontSize: '0.95rem', fontWeight: '600', color: '#0f0f0f', lineHeight: '1.4' }}>{item.q}</span>
                <span style={{ color: '#ff5e5f', fontSize: '1.2rem', transform: open === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0, display: 'inline-block' }}>+</span>
              </button>
              {open === i && (
                <div style={{ padding: '0 1.5rem 1.25rem' }}>
                  <p style={{ fontFamily: 'Georgia,serif', fontSize: '0.9rem', color: '#666', lineHeight: '1.8' }}>{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── TESTIMONIALS ─────────────────────────────────────────────────────────────

function TestimonialsBlock({ b }) {
  return (
    <div style={{ padding: '5rem 2rem', background: b.bg || '#fafaf9', borderBottom: '1px solid #e8e8e6' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {b.eyebrow && <p style={eye}>{b.eyebrow}</p>}
        {b.title && <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: '700', color: '#0f0f0f', marginBottom: '2.5rem' }}>{b.title}</h2>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
          {(b.items || []).map((t, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #e8e8e6', borderRadius: '4px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ fontFamily: 'Georgia,serif', fontSize: '0.9rem', color: '#555', lineHeight: '1.8', fontStyle: 'italic', flex: 1 }}>&ldquo;{t.text}&rdquo;</p>
              <div style={{ borderTop: '1px solid #f0f0ee', paddingTop: '1rem' }}>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: '700', color: '#0f0f0f' }}>{t.name}</p>
                {t.detail && <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: '#ff5e5f' }}>{t.detail}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── IMAGE ────────────────────────────────────────────────────────────────────

function ImageBlock({ b }) {
  return (
    <div style={{ padding: b.full ? '0' : '3rem 2rem', background: b.bg || '#fff', borderBottom: '1px solid #e8e8e6' }}>
      <div style={{ maxWidth: b.full ? '100%' : '960px', margin: '0 auto' }}>
        {b.caption && <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: '#999', textAlign: 'center', marginBottom: '0.75rem' }}>{b.caption}</p>}
        <img src={b.src} alt={b.alt || ''} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: b.full ? 0 : '4px' }} />
      </div>
    </div>
  )
}

// ── VIDEO ────────────────────────────────────────────────────────────────────

function VideoBlock({ b }) {
  const id = extractVideoId(b.url || '')
  if (!id) return null
  const embed = b.url?.includes('youtube') || b.url?.includes('youtu.be')
    ? `https://www.youtube.com/embed/${id}`
    : `https://player.vimeo.com/video/${id}`

  return (
    <div style={{ padding: '4rem 2rem', background: b.bg || '#fff', borderBottom: '1px solid #e8e8e6' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        {b.title && <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(1.4rem,2.5vw,1.8rem)', fontWeight: '700', color: '#0f0f0f', marginBottom: '1.5rem' }}>{b.title}</h2>}
        <div style={{ position: 'relative', paddingTop: '56.25%', borderRadius: '4px', overflow: 'hidden', border: '1px solid #e8e8e6' }}>
          <iframe src={embed} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen />
        </div>
      </div>
    </div>
  )
}

// ── TABLE ────────────────────────────────────────────────────────────────────

function TableBlock({ b }) {
  return (
    <div style={{ padding: '4rem 2rem', background: b.bg || '#fff', borderBottom: '1px solid #e8e8e6' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        {b.title && <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(1.4rem,2.5vw,1.8rem)', fontWeight: '700', color: '#0f0f0f', marginBottom: '1.5rem' }}>{b.title}</h2>}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-sans)', fontSize: '0.875rem' }}>
            {b.headers && (
              <thead>
                <tr>
                  {b.headers.map((h, i) => (
                    <th key={i} style={{ padding: '0.75rem 1rem', background: '#0f0f0f', color: '#fff', textAlign: 'left', fontWeight: '700', fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {(b.rows || []).map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafaf9' }}>
                  {row.map((cell, j) => (
                    <td key={j} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e8e8e6', color: j === 0 ? '#0f0f0f' : '#666', fontWeight: j === 0 ? '600' : '400' }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── DIVIDER ──────────────────────────────────────────────────────────────────

function DividerBlock({ b }) {
  return (
    <div style={{ padding: b.thin ? '0' : '2rem 2rem', background: b.bg || '#fff' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', borderTop: `1px solid ${b.color || '#e8e8e6'}` }} />
    </div>
  )
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

const eye = {
  fontFamily: 'var(--font-sans)', fontSize: '0.72rem', fontWeight: '700',
  letterSpacing: '0.12em', textTransform: 'uppercase', color: '#ff5e5f', marginBottom: '0.5rem',
}

function isDark(hex) {
  if (!hex || hex === 'transparent') return false
  const c = hex.replace('#', '')
  if (c.length < 6) return false
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 < 128
}

function extractVideoId(url) {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
  if (ytMatch) return ytMatch[1]
  const vMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vMatch) return vMatch[1]
  return null
}

// Escapes raw HTML special characters BEFORE any markdown transformation
// runs. This is the actual fix, not a sanitizer bolted on afterward —
// a literal <script> tag typed into the source text becomes the inert
// text "&lt;script&gt;" here, before any of the .replace() calls below
// ever run. Every tag markdownToHtml() adds after this point is one of
// its own hardcoded, safe tags — there's no way for the original raw
// input to "become" real markup again once it's already been escaped.
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function markdownToHtml(text) {
  if (!text) return ''
  // (2026-08-19: previously ran DOMPurify — via isomorphic-dompurify, which
  // pulls in jsdom — on the OUTPUT of this function instead of escaping the
  // INPUT first. Broke the production build: one of jsdom's dependencies
  // ships pure ESM, which Next.js's build-time require() can't load, and
  // my own test only ran in a plain `node -e` script, not the actual Next
  // build pipeline, so I didn't catch it before shipping. Escape-then-only-
  // add-known-safe-tags is both simpler and more robust than generate-then-
  // sanitize, and needs no dependency at all.)
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>')
    .replace(/<p><\/p>/g, '')
}

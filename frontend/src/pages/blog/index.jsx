/**
 * GRADSKOOL — Blog Index
 * Route: /blog
 *
 * Matches static HTML exactly:
 * - Hero with eyebrow + title + description
 * - Filter tabs: All / CAT / GMAT / GRE / IPMAT / XAT / Law UG / Mindset / VARC
 * - 3-col grid, cards hover to #fafaf9, editorial serif style
 */
import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'
import { useBlogPosts, useBlogTags } from '../../hooks/useToolsBlogDashboard'

const C = {
  red: '#ff5e5f', black: '#0f0f0f', white: '#ffffff',
  gray50: '#fafaf9', gray400: '#999', gray500: '#666',
  border: '#e8e8e6',
}

const FALLBACK_POSTS = []

const ALL_TAGS = ['All', 'CAT', 'GMAT', 'GRE', 'IPMAT', 'XAT', 'Law UG', 'Mindset', 'VARC']

export default function BlogPage() {
  const [activeTag, setActiveTag] = useState('All')
  const { posts, loading } = useBlogPosts(activeTag !== 'All' ? { tag: activeTag } : {})
  const { tags }           = useBlogTags()

  const displayPosts = (posts || []).filter(p =>
    activeTag === 'All' || (p.tag || p.category || '').toLowerCase().includes(activeTag.toLowerCase())
  )

  return (
    <>
      <Head>
        <title>Blog — Strategy, Insights & Exam Analysis — GRADSKOOL</title>
        <meta name="description" content="CAT strategy, GMAT tips, IIM placement data, exam analysis and preparation guides from Abhishek Leela Pandey." />
        <link rel="canonical" href="https://gradskool.in/blog" />
      </Head>

      {/* HERO */}
      <div style={s.hero}>
        <div style={s.container}>
          <p style={s.eyebrow}>From the GRADSKOOL Team</p>
          <h1 style={s.title}>Strategy. Insights. Exam Intelligence.</h1>
          <p style={s.sub}>
            Preparation guides, score improvement strategies, and exam analysis —
            written by Abhishek Leela Pandey for CAT, GMAT, GRE, IPMAT, XAT,
            Law UG, and every exam GRADSKOOL covers.
          </p>
        </div>
      </div>

      {/* FILTER TABS */}
      <div style={s.tabsWrap}>
        <div style={s.tabsInner}>
          {ALL_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              style={{ ...s.tab, ...(activeTag === tag ? s.tabActive : {}) }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* GRID */}
      <div style={s.gridWrap}>
        <div style={s.container}>
          {loading ? (
            <div style={s.grid}>
              {[0,1,2,3,4,5].map(i => <BlogCardSkel key={i} />)}
            </div>
          ) : displayPosts.length === 0 ? (
            <div style={s.empty}>
              <p style={{ fontSize:'2rem', marginBottom:'0.75rem' }}>✍️</p>
              <p style={s.emptyTitle}>
                {activeTag === 'All'
                  ? 'No articles published yet.'
                  : `No ${activeTag} articles yet.`}
              </p>
              <p style={{ fontFamily:'Georgia,serif', fontSize:'0.875rem', color:'#999', lineHeight:'1.65', marginBottom:'1.25rem' }}>
                {activeTag === 'All'
                  ? 'Articles will appear here once published from the admin panel.'
                  : 'Try viewing all articles or check back later.'}
              </p>
              {activeTag !== 'All' && (
                <button onClick={() => setActiveTag('All')} style={s.emptyBtn}>
                  View all articles →
                </button>
              )}
            </div>
          ) : (
            <div style={s.grid}>
              {displayPosts.map((post, i) => (
                <BlogCard key={post.slug || i} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function BlogCard({ post }) {
  const [hov, setHov] = useState(false)
  const href = `/blog/${post.slug}`

  return (
    <Link
      href={href}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:        'flex',
        flexDirection:  'column',
        gap:            '0.75rem',
        padding:        '2rem',
        borderBottom:   `1px solid ${C.border}`,
        borderRight:    `1px solid ${C.border}`,
        background:     hov ? C.gray50 : C.white,
        textDecoration: 'none',
        transition:     'background 0.2s',
        cursor:         'pointer',
        boxSizing:      'border-box',
      }}
    >
      {/* Tag */}
      <span style={s.cardTag}>{post.tag || post.category}</span>

      {/* Title */}
      <h2 style={{ ...s.cardTitle, color: hov ? C.red : C.black }}>
        {post.title}
      </h2>

      {/* Excerpt */}
      <p style={s.cardExcerpt}>{post.excerpt || post.meta_desc}</p>

      {/* Footer */}
      <div style={s.cardFooter}>
        <span style={s.cardAuthor}>{post.author || 'Abhishek Leela Pandey'}</span>
        <div style={s.cardMeta}>
          {post.date || post.published_at?.slice(0, 7)}
          {post.reading_mins && ` · ${post.reading_mins} min read`}
        </div>
        <span style={{ ...s.cardCta, color: hov ? C.red : C.gray400 }}>
          Read article →
        </span>
      </div>
    </Link>
  )
}

function BlogCardSkel() {
  return (
    <div style={{ padding:'2rem', borderBottom:`1px solid ${C.border}`, borderRight:`1px solid ${C.border}` }}>
      {[80, 120, 60, 40].map((w, i) => (
        <div key={i} style={{ height:'16px', width:`${w}%`, background:'#f0f0ee', borderRadius:'2px', marginBottom:'0.75rem' }} />
      ))}
    </div>
  )
}

const s = {
  hero: { padding:'4rem 2rem 3rem', borderBottom:`1px solid ${C.border}`, background:C.white },
  container: { maxWidth:'1160px', margin:'0 auto', padding:'0 2rem' },
  eyebrow: { fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'500',
    letterSpacing:'0.1em', textTransform:'uppercase', color:C.red, marginBottom:'0.75rem' },
  title: { fontFamily:'Georgia, serif', fontSize:'clamp(2rem, 3.5vw, 2.8rem)',
    fontWeight:'700', color:C.black, lineHeight:'1.15', marginBottom:'0.875rem' },
  sub: { fontFamily:'Georgia, serif', fontSize:'1rem', color:C.gray500,
    lineHeight:'1.75', maxWidth:'600px' },

  tabsWrap: { borderBottom:`1px solid ${C.border}`, background:C.white,
    position:'sticky', top:0, zIndex:50 },
  tabsInner: { maxWidth:'1160px', margin:'0 auto', padding:'0 2rem',
    display:'flex', overflowX:'auto', gap:0 },
  tab: { fontFamily:'var(--font-sans)', fontSize:'0.85rem', fontWeight:'500',
    color:C.gray400, background:'none', border:'none',
    borderBottom:'2px solid transparent', padding:'0.875rem 1rem',
    cursor:'pointer', whiteSpace:'nowrap', marginBottom:'-1px', transition:'color 0.15s' },
  tabActive: { color:C.black, borderBottomColor:C.red, fontWeight:'600' },

  gridWrap: { background:C.white, padding:'0' },
  grid: { display:'grid', gridTemplateColumns:'repeat(3,1fr)',
    border:`1px solid ${C.border}`, borderRight:'none', borderBottom:'none',
    borderRadius:'0' },
  empty: { textAlign:'center', padding:'4rem 2rem' },
  emptyTitle: { fontFamily:'Georgia, serif', fontSize:'1.1rem', color:C.gray500, marginBottom:'1rem' },
  emptyBtn: { fontFamily:'var(--font-sans)', fontSize:'0.875rem', color:C.red,
    background:'none', border:'none', cursor:'pointer', borderBottom:`1px solid #ffd0d0` },

  cardTag: { fontFamily:'var(--font-sans)', fontSize:'0.68rem', fontWeight:'600',
    letterSpacing:'0.1em', textTransform:'uppercase', color:C.red },
  cardTitle: { fontFamily:'Georgia, serif', fontSize:'1.15rem', fontWeight:'700',
    lineHeight:'1.35', transition:'color 0.2s' },
  cardExcerpt: { fontFamily:'Georgia, serif', fontSize:'0.875rem', color:C.gray500,
    lineHeight:'1.75', flex:1 },
  cardFooter: { display:'flex', flexDirection:'column', gap:'0.2rem', marginTop:'auto', paddingTop:'0.75rem',
    borderTop:`1px solid ${C.border}` },
  cardAuthor: { fontFamily:'var(--font-sans)', fontSize:'0.75rem', fontWeight:'600', color:C.black },
  cardMeta:   { fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:C.gray400 },
  cardCta:    { fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:'600',
    marginTop:'0.25rem', transition:'color 0.2s' },
}

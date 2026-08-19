/**
 * GRADSKOOL — Blog Post Page
 * Route: /blog/[slug]
 *
 * Matches static HTML article style:
 * - Header: tag + title + author + date + reading time
 * - Body: prose in Georgia serif, wide container, generous line-height
 * - Sidebar: related posts + CTA
 */
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useBlogPost, useBlogPosts } from '../../hooks/useToolsBlogDashboard'

const C = {
  red: '#ff5e5f', black: '#0f0f0f', white: '#ffffff',
  gray50: '#fafaf9', gray100: '#f5f5f3',
  gray400: '#999', gray500: '#666', gray600: '#555', border: '#e8e8e6',
}

export default function BlogPostPage() {
  const router     = useRouter()
  const { slug }   = router.query
  const { post, loading, error } = useBlogPost(slug)
  const { posts: related }       = useBlogPosts({ limit: 4 })

  if (loading) return <PostShell><Skel /></PostShell>
  if (error || !post) return (
    <PostShell>
      <div style={{ textAlign:'center', padding:'4rem 0' }}>
        <p style={{ fontFamily:'Georgia, serif', fontSize:'1.1rem', color:C.gray500, marginBottom:'1rem' }}>
          Article not found.
        </p>
        <Link href="/blog" style={{ fontFamily:'var(--font-sans)', fontSize:'0.875rem',
          color:C.red, textDecoration:'none', borderBottom:`1px solid #ffd0d0` }}>
          ← Back to Blog
        </Link>
      </div>
    </PostShell>
  )

  const relatedPosts = (related || []).filter(p => p.slug !== slug).slice(0, 3)

  return (
    <PostShell>
      <Head>
        <title>{post.title} — GRADSKOOL Blog</title>
        <meta name="description" content={post.meta_desc || post.excerpt || post.title} />
        <link rel="canonical" href={`https://gradskool.in/blog/${slug}`} />
        {/* og_image_url existed as an admin-panel field but was never
            actually used anywhere on the site — not here, not visually on
            the page. Sharing a blog post on WhatsApp/social got the
            generic site-wide fallback image regardless of what was set. */}
        {post.og_image_url && (
          <>
            <meta property="og:image" content={post.og_image_url} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:image" content={post.og_image_url} />
          </>
        )}
      </Head>

      <div style={s.layout}>
        {/* ── ARTICLE ────────────────────────────────────────────── */}
        <article style={s.article}>
          {/* Article header */}
          <header style={s.articleHeader}>
            {/* Breadcrumb */}
            <p style={s.breadcrumb}>
              <Link href="/" style={s.breadLink}>Home</Link>
              <span style={s.breadSep}>/</span>
              <Link href="/blog" style={s.breadLink}>Blog</Link>
              <span style={s.breadSep}>/</span>
              <span style={{ color:C.black }}>{post.tag || post.category}</span>
            </p>

            {/* Tag */}
            <span style={s.tag}>{post.tag || post.category}</span>

            {/* Title */}
            <h1 style={s.title}>{post.title}</h1>

            {/* Meta */}
            <div style={s.meta}>
              <span style={s.metaAuthor}>{post.author || 'Abhishek Leela Pandey'}</span>
              <span style={s.metaDot}>·</span>
              <span style={s.metaDate}>
                {post.published_at
                  ? new Date(post.published_at).toLocaleDateString('en-IN', { month:'long', year:'numeric' })
                  : post.date || ''}
              </span>
              {post.reading_mins && (
                <>
                  <span style={s.metaDot}>·</span>
                  <span style={s.metaDate}>{post.reading_mins} min read</span>
                </>
              )}
            </div>
          </header>

          {/* Hero image — the OG/Hero Image URL field existed in the admin
              panel already, but nothing on the site actually displayed it
              anywhere until now. */}
          {post.og_image_url && (
            <img
              src={post.og_image_url}
              alt={post.title}
              style={{ width:'100%', maxHeight:'420px', objectFit:'cover', borderRadius:'6px', margin:'0 0 2rem' }}
            />
          )}

          {/* Article body */}
          <div style={s.body}>
            {post.body
              ? <HtmlBody content={post.body} />
              : <p style={s.excerpt}>{post.excerpt || post.meta_desc}</p>
            }
          </div>

          {/* Article footer */}
          <footer style={s.articleFooter}>
            <div style={s.footerLeft}>
              <p style={s.footerLabel}>Written by</p>
              <p style={s.footerAuthor}>{post.author || 'Abhishek Leela Pandey'}</p>
              <p style={s.footerRole}>Founder, GRADSKOOL · 99.93%ile CAT · 770 GMAT</p>
            </div>
            <Link href="/about" style={s.footerLink}>Read profile →</Link>
          </footer>
        </article>

        {/* ── SIDEBAR ────────────────────────────────────────────── */}
        <aside style={s.sidebar}>
          {/* CTA */}
          <div style={s.ctaBox}>
            <p style={s.ctaEyebrow}>Ready to prepare?</p>
            <p style={s.ctaTitle}>Join a GRADSKOOL Cohort</p>
            <p style={s.ctaBody}>
              Live two-way sessions. 27 students per cohort. Taught by ALP Sir himself.
            </p>
            <Link href="/courses" style={s.ctaBtn}>Explore Courses →</Link>
            <a href="https://wa.me/916360597966" target="_blank" rel="noreferrer" style={s.ctaWa}>
              💬 WhatsApp Us
            </a>
          </div>

          {/* Related posts */}
          {relatedPosts.length > 0 && (
            <div style={s.relatedBox}>
              <p style={s.relatedLabel}>More Articles</p>
              {relatedPosts.map(p => (
                <Link key={p.slug} href={`/blog/${p.slug}`} style={s.relatedItem}>
                  <span style={s.relatedTag}>{p.tag || p.category}</span>
                  <span style={s.relatedTitle}>{p.title}</span>
                </Link>
              ))}
            </div>
          )}
        </aside>
      </div>
    </PostShell>
  )
}

// Simple markdown-to-HTML renderer for headings and paragraphs
function HtmlBody({ content }) {
  // Replaces the old MarkdownBody, which line-by-line parsed markdown
  // syntax (## heading, - list item, split on \n). The admin CMS moved to
  // Quill.js (a rich HTML editor) at some point — Quill outputs genuine,
  // continuous HTML (<h2>, <p>, <strong> etc, no meaningful newlines
  // between them) — but this page was never updated to match, so every
  // post rendered as one giant literal-text blob of visible tags instead
  // of actual formatted content. Styling below reproduces the exact same
  // visual design MarkdownBody had (see bodyP/bodyH2/bodyH3/bodyLi/
  // bodyBlockquote in the styles object further down) as scoped CSS
  // targeting the real tags, since inline React styles can't target HTML
  // that arrives as one dangerouslySetInnerHTML blob the way they could
  // when each line was its own separately-styled React element.
  return (
    <>
      <style jsx>{`
        .blog-html-body :global(p) {
          font-family: Georgia, serif; font-size: 1.05rem; color: #3a3a3a;
          line-height: 1.85; margin-bottom: 1.5rem;
        }
        .blog-html-body :global(h1) { display: none; } /* shown in header already, same as MarkdownBody skipped # lines */
        .blog-html-body :global(h2) {
          font-family: Georgia, serif; font-size: 1.5rem; font-weight: 700; color: ${C.black};
          line-height: 1.2; margin-top: 2.5rem; margin-bottom: 1rem;
        }
        .blog-html-body :global(h3) {
          font-family: Georgia, serif; font-size: 1.2rem; font-weight: 700; color: ${C.black};
          line-height: 1.2; margin-top: 2rem; margin-bottom: 0.75rem;
        }
        .blog-html-body :global(ul), .blog-html-body :global(ol) { margin-bottom: 1.5rem; padding-left: 1.25rem; }
        .blog-html-body :global(li) {
          font-family: Georgia, serif; font-size: 1.05rem; color: #3a3a3a;
          line-height: 1.85; margin-bottom: 0.5rem;
        }
        .blog-html-body :global(blockquote) {
          font-family: Georgia, serif; font-size: 1.05rem; color: ${C.gray600};
          font-style: italic; border-left: 3px solid ${C.red}; padding-left: 1.25rem;
          margin: 1.5rem 0; line-height: 1.85;
        }
        .blog-html-body :global(strong) { font-weight: 700; color: ${C.black}; }
        .blog-html-body :global(a) { color: ${C.red}; text-decoration: underline; }
        .blog-html-body :global(img) { max-width: 100%; border-radius: 4px; margin: 1.5rem 0; }
      `}</style>
      <div className="blog-html-body" dangerouslySetInnerHTML={{ __html: content }} />
    </>
  )
}

function PostShell({ children }) {
  return (
    <div style={{ minHeight:'100vh', background:C.white }}>
      {/* Topbar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'0 2rem', height:'56px', background:C.white,
        borderBottom:`1px solid ${C.border}`, position:'sticky', top:0, zIndex:100 }}>
        <Link href="/" style={{ fontFamily:'Georgia, serif', fontSize:'1.3rem',
          fontWeight:'700', letterSpacing:'0.04em', color:C.black, textDecoration:'none' }}>
          GRAD<span style={{ color:C.red }}>SKOOL</span>
        </Link>
        <div style={{ display:'flex', gap:'1.5rem', alignItems:'center' }}>
          <Link href="/blog" style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:C.gray500, textDecoration:'none' }}>← All Articles</Link>
          <Link href="/courses" style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'600', color:C.red, textDecoration:'none' }}>Explore Courses →</Link>
        </div>
      </div>
      <div style={{ maxWidth:'1160px', margin:'0 auto', padding:'0 2rem' }}>
        {children}
      </div>
    </div>
  )
}

function Skel() {
  return (
    <div style={{ padding:'4rem 0', display:'flex', gap:'4rem' }}>
      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:'1rem' }}>
        {[60,90,40,100,80,100,80,100].map((w,i) => (
          <div key={i} style={{ height:'18px', width:`${w}%`, background:C.gray100, borderRadius:'2px' }} />
        ))}
      </div>
      <div style={{ width:'280px', flexShrink:0 }}>
        <div style={{ height:'200px', background:C.gray100, borderRadius:'4px' }} />
      </div>
    </div>
  )
}

const s = {
  layout: { display:'grid', gridTemplateColumns:'1fr 300px', gap:'5rem',
    padding:'4rem 0', alignItems:'start' },

  // Article
  article: {},
  articleHeader: { marginBottom:'3rem', paddingBottom:'2.5rem', borderBottom:`1px solid ${C.border}` },
  breadcrumb: { fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:C.gray400, marginBottom:'1.5rem' },
  breadLink: { color:C.gray400, textDecoration:'none' },
  breadSep: { margin:'0 0.4rem', color:'#ccc' },
  tag: { fontFamily:'var(--font-sans)', fontSize:'0.68rem', fontWeight:'700',
    letterSpacing:'0.12em', textTransform:'uppercase', color:C.red,
    display:'inline-block', marginBottom:'0.875rem' },
  title: { fontFamily:'Georgia, serif', fontSize:'clamp(1.8rem, 3vw, 2.6rem)',
    fontWeight:'700', color:C.black, lineHeight:'1.2', marginBottom:'1.25rem' },
  meta: { display:'flex', alignItems:'center', gap:'0.5rem', flexWrap:'wrap' },
  metaAuthor: { fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'600', color:C.black },
  metaDot: { color:C.gray400 },
  metaDate: { fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:C.gray400 },

  // Body
  body: { maxWidth:'680px' },
  excerpt: { fontFamily:'Georgia, serif', fontSize:'1.05rem', color:C.gray500, lineHeight:'1.85' },
  bodyP: { fontFamily:'Georgia, serif', fontSize:'1.05rem', color:'#3a3a3a', lineHeight:'1.85', marginBottom:'1.5rem' },
  bodyH2: { fontFamily:'Georgia, serif', fontSize:'1.5rem', fontWeight:'700', color:C.black,
    lineHeight:'1.2', marginTop:'2.5rem', marginBottom:'1rem' },
  bodyH3: { fontFamily:'Georgia, serif', fontSize:'1.2rem', fontWeight:'700', color:C.black,
    lineHeight:'1.2', marginTop:'2rem', marginBottom:'0.75rem' },
  bodyLi: { fontFamily:'Georgia, serif', fontSize:'1.05rem', color:'#3a3a3a', lineHeight:'1.85',
    marginBottom:'0.5rem', paddingLeft:'1.25rem', position:'relative',
    listStyle:'none', display:'block' },
  bodyBlockquote: { fontFamily:'Georgia, serif', fontSize:'1.05rem', color:C.gray600,
    fontStyle:'italic', borderLeft:`3px solid ${C.red}`, paddingLeft:'1.25rem',
    margin:'1.5rem 0', lineHeight:'1.85' },

  // Article footer
  articleFooter: { display:'flex', justifyContent:'space-between', alignItems:'center',
    marginTop:'3rem', paddingTop:'2rem', borderTop:`1px solid ${C.border}`,
    gap:'2rem', flexWrap:'wrap' },
  footerLeft: {},
  footerLabel: { fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700',
    letterSpacing:'0.1em', textTransform:'uppercase', color:C.gray400, marginBottom:'0.3rem' },
  footerAuthor: { fontFamily:'Georgia, serif', fontSize:'1rem', fontWeight:'700', color:C.black, marginBottom:'0.2rem' },
  footerRole: { fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:C.gray400 },
  footerLink: { fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'600',
    color:C.red, textDecoration:'none', borderBottom:`1px solid #ffd0d0`,
    paddingBottom:'1px', whiteSpace:'nowrap' },

  // Sidebar
  sidebar: { display:'flex', flexDirection:'column', gap:'1.5rem',
    position:'sticky', top:'80px' },
  ctaBox: { background:C.black, borderRadius:'4px', padding:'2rem',
    display:'flex', flexDirection:'column', gap:'0.75rem' },
  ctaEyebrow: { fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700',
    letterSpacing:'0.1em', textTransform:'uppercase', color:C.red },
  ctaTitle: { fontFamily:'Georgia, serif', fontSize:'1.2rem', fontWeight:'700',
    color:'#fff', lineHeight:'1.25' },
  ctaBody: { fontFamily:'Georgia, serif', fontSize:'0.875rem', color:C.gray400, lineHeight:'1.65' },
  ctaBtn: { display:'block', background:C.red, color:'#fff', padding:'0.75rem 1rem',
    borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.875rem',
    fontWeight:'700', textDecoration:'none', textAlign:'center', marginTop:'0.25rem' },
  ctaWa: { display:'block', textAlign:'center', fontFamily:'var(--font-sans)',
    fontSize:'0.82rem', color:C.gray400, textDecoration:'none', marginTop:'0.25rem' },
  relatedBox: { background:C.gray50, border:`1px solid ${C.border}`,
    borderRadius:'4px', padding:'1.5rem', display:'flex', flexDirection:'column', gap:'1rem' },
  relatedLabel: { fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700',
    letterSpacing:'0.1em', textTransform:'uppercase', color:C.gray400 },
  relatedItem: { display:'flex', flexDirection:'column', gap:'0.3rem',
    textDecoration:'none', paddingBottom:'1rem', borderBottom:`1px solid ${C.border}` },
  relatedTag: { fontFamily:'var(--font-sans)', fontSize:'0.62rem', fontWeight:'700',
    letterSpacing:'0.08em', textTransform:'uppercase', color:C.red },
  relatedTitle: { fontFamily:'Georgia, serif', fontSize:'0.875rem', color:C.black,
    lineHeight:'1.35', fontWeight:'500' },
}
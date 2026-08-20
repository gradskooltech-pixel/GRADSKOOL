/**
 * GRADSKOOL — Dynamic sitemap.xml
 * Route: /sitemap.xml
 *
 * Replaces the old static public/sitemap.xml, which was hand-generated
 * once in June 2026 and never updated since — it still listed pages we've
 * since removed (lrdi-hub, varc-hub) and was missing everything built
 * since (results, FYQs, free classes hub). A static file will always
 * drift out of sync with the live site; this regenerates on every
 * request (with ISR-style caching via the response header below), so it
 * can never go stale the same way again.
 *
 * NOTE: generic /p/[slug] landing pages are NOT included here — there is
 * no working public backend endpoint for them (checked during this
 * build: only an admin-authenticated list exists, and the public detail
 * route the frontend calls doesn't match any actual URL pattern). That's
 * a separate, pre-existing bug outside this fix's scope.
 */
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
const SITE = 'https://gradskool.in'

// Every verified static page worth indexing. Excludes: admin-panel/*,
// auth/*, dashboard/*, checkout/*, learn/*, watch/*, live/[sessionId],
// profile, thank-you, 404, cohorts/[slug] (user-specific), and course
// sub-pages that are pure redirect stubs rather than real destinations.
const STATIC_PAGES = [
  { path: '/',                          priority: '1.0', changefreq: 'weekly' },
  { path: '/about',                     priority: '0.7', changefreq: 'monthly' },
  { path: '/free-classes',              priority: '0.8', changefreq: 'weekly' },
  { path: '/faqs',                      priority: '0.6', changefreq: 'monthly' },
  { path: '/omets',                     priority: '0.8', changefreq: 'monthly' },
  { path: '/results',                   priority: '0.7', changefreq: 'weekly' },
  { path: '/fyqs',                      priority: '0.8', changefreq: 'weekly' },
  { path: '/blog',                      priority: '0.7', changefreq: 'daily' },
  { path: '/pdfs',                      priority: '0.6', changefreq: 'weekly' },
  { path: '/privacy-policy',            priority: '0.3', changefreq: 'yearly' },
  { path: '/refund-policy',             priority: '0.3', changefreq: 'yearly' },
  { path: '/terms',                     priority: '0.3', changefreq: 'yearly' },
  { path: '/courses',                   priority: '0.8', changefreq: 'weekly' },
  { path: '/courses/cat',               priority: '0.95', changefreq: 'weekly' },
  { path: '/courses/cat/cathlete',      priority: '0.9', changefreq: 'weekly' },
  { path: '/courses/cat/catalysis',     priority: '0.9', changefreq: 'weekly' },
  { path: '/courses/cat/alpgebra',      priority: '0.75', changefreq: 'monthly' },
  { path: '/courses/cat/books',         priority: '0.7', changefreq: 'monthly' },
  { path: '/courses/xat',               priority: '0.85', changefreq: 'weekly' },
  { path: '/courses/snap',              priority: '0.85', changefreq: 'weekly' },
  { path: '/courses/nmat',              priority: '0.85', changefreq: 'weekly' },
  { path: '/courses/nmat-snap',         priority: '0.8', changefreq: 'weekly' },
  { path: '/courses/gmat',              priority: '0.8', changefreq: 'monthly' },
  { path: '/courses/gre',               priority: '0.7', changefreq: 'monthly' },
  { path: '/courses/mhcet',             priority: '0.75', changefreq: 'monthly' },
  { path: '/courses/cmat',              priority: '0.6', changefreq: 'monthly' },
  { path: '/courses/cuet',              priority: '0.6', changefreq: 'monthly' },
  { path: '/courses/clat',              priority: '0.6', changefreq: 'monthly' },
  { path: '/courses/ipmat',             priority: '0.6', changefreq: 'monthly' },
  { path: '/courses/pi-wat-gd',         priority: '0.65', changefreq: 'monthly' },
]

// Fetch helper — never throws; a failed content source just contributes
// zero entries rather than breaking the whole sitemap.
async function safeFetchJson(url) {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

function urlEntry(loc, { lastmod, changefreq, priority } = {}) {
  return `  <url>\n    <loc>${loc}</loc>\n` +
    (lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : '') +
    (changefreq ? `    <changefreq>${changefreq}</changefreq>\n` : '') +
    (priority ? `    <priority>${priority}</priority>\n` : '') +
    `  </url>`
}

export async function getServerSideProps({ res }) {
  const entries = STATIC_PAGES.map(p => urlEntry(`${SITE}${p.path}`, p))

  // Blog posts
  const blog = await safeFetchJson(`${API}/blog/posts/?page_size=200`)
  const blogPosts = blog?.results || (Array.isArray(blog) ? blog : [])
  for (const post of blogPosts) {
    entries.push(urlEntry(`${SITE}/blog/${post.slug}`, {
      lastmod: (post.updated_at || post.published_at || '').slice(0, 10) || undefined,
      changefreq: 'monthly', priority: '0.6',
    }))
  }

  // Results
  const results = await safeFetchJson(`${API}/results-wall/public/`)
  for (const r of (results?.results || [])) {
    if (!r.slug) continue // only results with a detail page are indexable
    entries.push(urlEntry(`${SITE}/results/${r.slug}`, { changefreq: 'monthly', priority: '0.55' }))
  }

  // FYQs — paginated, fetch every page
  let fyqPage = 1
  for (;;) {
    const data = await safeFetchJson(`${API}/fyq/?page=${fyqPage}&page_size=100`)
    const results = data?.results || []
    for (const q of results) {
      entries.push(urlEntry(`${SITE}/fyqs/${q.slug}`, {
        lastmod: (q.updated_at || '').slice(0, 10) || undefined,
        changefreq: 'monthly', priority: '0.5',
      }))
    }
    if (!data || fyqPage >= (data.num_pages || 1)) break
    fyqPage++
  }

  // Foundations classes — CAT and XAT (the two exams with genuine
  // foundations-style content; NMAT/SNAP's classes live under
  // /courses/<exam>/live instead, already covered by static pages).
  for (const exam of ['cat', 'xat']) {
    const series = await safeFetchJson(`${API}/foundations/?exam=${exam}`)
    for (const s of (series || [])) {
      for (const c of (s.classes || [])) {
        if (!c.slug) continue
        entries.push(urlEntry(`${SITE}/foundations/${exam}/${c.slug}`, {
          lastmod: (c.updated_at || '').slice(0, 10) || undefined,
          changefreq: 'monthly', priority: '0.45',
        }))
      }
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries.join('\n') + `\n</urlset>`

  res.setHeader('Content-Type', 'application/xml')
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  res.write(xml)
  res.end()
  return { props: {} }
}

export default function Sitemap() { return null }
/**
 * GRADSKOOL — SNAP Class Detail
 * Route: /courses/snap/live/[slug]
 *
 * Server-rendered (getServerSideProps) so lesson data — including the
 * YouTube thumbnail used for og:image — is present in the initial HTML
 * response. Social crawlers (WhatsApp, Facebook, Twitter) don't execute
 * JavaScript, so a client-side-only fetch meant shared links never showed
 * a thumbnail.
 */
import { FoundationsClassDetail } from '../../../../components/foundations/FoundationsClassDetail'

const API = process.env.NEXT_PUBLIC_API_URL || 'https://gradskool-production.up.railway.app/api/v1'
const META = { name:'SNAP', color:'#1a5c8a', course:'/courses/snap', isFullCourse:true }

export async function getServerSideProps({ params, req }) {
  const { slug } = params
  console.log('[SNAP SSR DEBUG] NEXT_PUBLIC_API_URL env value:', process.env.NEXT_PUBLIC_API_URL)
  console.log('[SNAP SSR DEBUG] Using API base:', API)
  console.log('[SNAP SSR DEBUG] Fetching:', `${API}/foundations/class/${slug}/`)
  try {
    const [lessonRes, seriesRes] = await Promise.all([
      fetch(`${API}/foundations/class/${slug}/`),
      fetch(`${API}/foundations/?exam=snap`),
    ])
    console.log('[SNAP SSR DEBUG] lessonRes status:', lessonRes.status, lessonRes.ok)
    if (!lessonRes.ok) {
      const body = await lessonRes.text().catch(() => '')
      console.log('[SNAP SSR DEBUG] lessonRes body:', body.slice(0, 300))
      return { notFound: true }
    }
    const lesson = await lessonRes.json()

    let prevSlug = null, nextSlug = null
    if (seriesRes.ok) {
      const seriesList = await seriesRes.json()
      const allSlugs = (seriesList || []).flatMap(s => (s.classes || []).map(c => c.slug))
      const idx = allSlugs.indexOf(slug)
      prevSlug = idx > 0 ? allSlugs[idx - 1] : null
      nextSlug = idx >= 0 && idx < allSlugs.length - 1 ? allSlugs[idx + 1] : null
    }

    const protocol = req.headers['x-forwarded-proto'] || 'https'
    const canonicalUrl = `${protocol}://${req.headers.host}/courses/snap/live/${slug}`

    return { props: { slug, lesson, prevSlug, nextSlug, canonicalUrl } }
  } catch (err) {
    console.error('[SNAP SSR DEBUG] Caught exception:', err.message)
    return { notFound: true }
  }
}

export default function SNAPLiveClassPage({ slug, lesson, prevSlug, nextSlug, canonicalUrl }) {
  return (
    <FoundationsClassDetail
      examSlug="snap"
      slug={slug}
      meta={META}
      listBasePath="/courses/snap/live"
      lesson={lesson}
      prevSlug={prevSlug}
      nextSlug={nextSlug}
      canonicalUrl={canonicalUrl}
    />
  )
}

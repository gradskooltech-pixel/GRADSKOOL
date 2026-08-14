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

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
const META = { name:'SNAP', color:'#1a5c8a', course:'/courses/snap', isFullCourse:true }

export async function getServerSideProps({ params, req }) {
  const { slug } = params
  try {
    const [lessonRes, seriesRes] = await Promise.all([
      fetch(`${API}/foundations/class/${slug}/`),
      fetch(`${API}/foundations/?exam=snap`),
    ])
    if (!lessonRes.ok) return { notFound: true }
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
  } catch {
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

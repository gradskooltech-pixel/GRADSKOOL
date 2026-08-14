/**
 * GRADSKOOL — NMAT Class Detail
 * Route: /courses/nmat/live/[slug]
 *
 * Server-rendered (getServerSideProps) so lesson data — including the
 * YouTube thumbnail used for og:image — is present in the initial HTML
 * response. Social crawlers (WhatsApp, Facebook, Twitter) don't execute
 * JavaScript, so a client-side-only fetch meant shared links never showed
 * a thumbnail.
 */
import { FoundationsClassDetail } from '../../../../components/foundations/FoundationsClassDetail'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
const META = { name:'NMAT', color:'#1a6e3c', course:'/courses/nmat', isFullCourse:true }

export async function getServerSideProps({ params, req }) {
  const { slug } = params
  try {
    const [lessonRes, seriesRes] = await Promise.all([
      fetch(`${API}/foundations/class/${slug}/`),
      fetch(`${API}/foundations/?exam=nmat`),
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
    const canonicalUrl = `${protocol}://${req.headers.host}/courses/nmat/live/${slug}`

    return { props: { slug, lesson, prevSlug, nextSlug, canonicalUrl } }
  } catch {
    return { notFound: true }
  }
}

export default function NMATLiveClassPage({ slug, lesson, prevSlug, nextSlug, canonicalUrl }) {
  return (
    <FoundationsClassDetail
      examSlug="nmat"
      slug={slug}
      meta={META}
      listBasePath="/courses/nmat/live"
      lesson={lesson}
      prevSlug={prevSlug}
      nextSlug={nextSlug}
      canonicalUrl={canonicalUrl}
    />
  )
}

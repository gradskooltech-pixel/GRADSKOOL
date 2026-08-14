/**
 * GRADSKOOL — Foundations Class Detail Page
 * Route: /foundations/[exam]/[slug]
 *
 * Only genuinely serves XAT now — see [exam].jsx for why. Server-rendered
 * (getServerSideProps) so lesson data — including the YouTube thumbnail
 * used for og:image — is present in the initial HTML response. Social
 * crawlers (WhatsApp, Facebook, Twitter) don't execute JavaScript, so a
 * client-side-only fetch meant shared links never showed a thumbnail.
 * The nmat/snap redirect still happens server-side too, before any fetch.
 */
import { FoundationsClassDetail } from '../../../components/foundations/FoundationsClassDetail'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

const EXAM_META = {
  xat: { name:'XAT', color:'#5b3fa0', course:'/courses/xat', isFullCourse:false },
  cat: { name:'CAT', color:'#d94f50', course:'/courses/cat/cathlete', isFullCourse:false },
}

export async function getServerSideProps({ params, req }) {
  const { exam, slug } = params

  if (exam === 'nmat' || exam === 'snap') {
    return { redirect: { destination: `/courses/${exam}/live/${slug || ''}`, permanent: false } }
  }

  const meta = EXAM_META[exam]
  if (!meta) return { notFound: true }

  try {
    const [lessonRes, seriesRes] = await Promise.all([
      fetch(`${API}/foundations/class/${slug}/`),
      fetch(`${API}/foundations/?exam=${exam}`),
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
    const canonicalUrl = `${protocol}://${req.headers.host}/foundations/${exam}/${slug}`

    return { props: { examSlug: exam, slug, meta, lesson, prevSlug, nextSlug, canonicalUrl } }
  } catch {
    return { notFound: true }
  }
}

export default function FoundationLesson({ examSlug, slug, meta, lesson, prevSlug, nextSlug, canonicalUrl }) {
  if (!examSlug) return null // nmat/snap redirect case — response already sent

  return (
    <FoundationsClassDetail
      examSlug={examSlug}
      slug={slug}
      meta={meta}
      listBasePath={`/foundations/${examSlug}`}
      lesson={lesson}
      prevSlug={prevSlug}
      nextSlug={nextSlug}
      canonicalUrl={canonicalUrl}
    />
  )
}

/**
 * GRADSKOOL — Foundations Class Detail Page
 * Route: /foundations/[exam]/[slug]
 *
 * Only genuinely serves XAT now — see [exam].jsx for why. This page is
 * client-rendered (no getStaticProps), so the nmat/snap redirect happens
 * client-side via router.replace rather than a server redirect.
 */
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { FoundationsClassDetail } from '../../../components/foundations/FoundationsClassDetail'

const EXAM_META = {
  xat: { name:'XAT', color:'#5b3fa0', course:'/courses/xat', isFullCourse:false },
  cat: { name:'CAT', color:'#d94f50', course:'/courses/cat/cathlete', isFullCourse:false },
}

export default function FoundationLesson() {
  const router = useRouter()
  const { exam, slug } = router.query

  useEffect(() => {
    if (exam === 'nmat' || exam === 'snap') {
      router.replace(`/courses/${exam}/live/${slug || ''}`)
    }
  }, [exam, slug, router])

  const meta = EXAM_META[exam]
  if (!exam || !slug || !meta) return null

  return (
    <FoundationsClassDetail
      examSlug={exam}
      slug={slug}
      meta={meta}
      listBasePath={`/foundations/${exam}`}
    />
  )
}
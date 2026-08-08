/**
 * GRADSKOOL — NMAT Class Detail
 * Route: /courses/nmat/live/[slug]
 */
import { useRouter } from 'next/router'
import { FoundationsClassDetail } from '../../../../components/foundations/FoundationsClassDetail'

const META = { name:'NMAT', color:'#1a6e3c', course:'/courses/nmat', isFullCourse:true }

export default function NMATLiveClassPage() {
  const router = useRouter()
  const { slug } = router.query
  if (!slug) return null

  return (
    <FoundationsClassDetail
      examSlug="nmat"
      slug={slug}
      meta={META}
      listBasePath="/courses/nmat/live"
    />
  )
}

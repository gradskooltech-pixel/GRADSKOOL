/**
 * GRADSKOOL — SNAP Class Detail
 * Route: /courses/snap/live/[slug]
 */
import { useRouter } from 'next/router'
import { FoundationsClassDetail } from '../../../../components/foundations/FoundationsClassDetail'

const META = { name:'SNAP', color:'#1a5c8a', course:'/courses/snap', isFullCourse:true }

export default function SNAPLiveClassPage() {
  const router = useRouter()
  const { slug } = router.query
  if (!slug) return null

  return (
    <FoundationsClassDetail
      examSlug="snap"
      slug={slug}
      meta={META}
      listBasePath="/courses/snap/live"
    />
  )
}

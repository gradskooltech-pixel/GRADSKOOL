/**
 * GRADSKOOL — Foundations Listing Page
 * Route: /foundations/[exam]
 *
 * As of the NMAT/SNAP repositioning, this route only genuinely serves XAT —
 * NMAT and SNAP moved to /courses/nmat/live and /courses/snap/live (grouped
 * with their paid Mocks page), since "foundations" undersold what's actually
 * a complete free course for those two. Old /foundations/nmat and
 * /foundations/snap links redirect there instead of 404ing.
 */
import Head from 'next/head'
import PageSEO from '../../components/seo/PageSEO'
import { FoundationsListing } from '../../components/foundations/FoundationsListing'

const EXAM_META = {
  xat: { name:'XAT', full:'Xavier Aptitude Test', color:'#5b3fa0', course:'/courses/xat', courseLabel:'Full XAT Course', isFullCourse:false },
  cat: { name:'CAT', full:'Common Admission Test', color:'#d94f50', course:'/courses/cat/cathlete', courseLabel:'CAThlete — Full CAT Course', isFullCourse:false },
}

export default function FoundationsPage({ exam }) {
  const meta = EXAM_META[exam]
  if (!meta) return null

  return (
    <>
      <Head>
        <title>{meta.name} Foundations — Free Classes by ALP Sir — GRADSKOOL</title>
        <meta name="description" content={`Free ${meta.name} foundation classes by ALP Sir. Live schedule, recordings, and notes — completely free.`} />
      </Head>
      <FoundationsListing examSlug={exam} meta={meta} readBasePath={`/foundations/${exam}`} />
    </>
  )
}

export async function getServerSideProps({ params }) {
  if (params.exam === 'nmat' || params.exam === 'snap') {
    return {
      redirect: {
        destination: `/courses/${params.exam}/live`,
        permanent: true,
      },
    }
  }
  if (!EXAM_META[params.exam]) {
    return { notFound: true }
  }
  return { props: { exam: params.exam } }
}

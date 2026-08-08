/**
 * GRADSKOOL — NMAT Complete Course, Free
 * Route: /courses/nmat/live
 *
 * Grouped under /courses/nmat/* alongside the paid Mocks page at
 * /courses/nmat — this is the free half of the same product line, not a
 * separate "foundations" thing. See PageSEO for the /foundations/nmat →
 * here redirect handled in the old route.
 */
import Head from 'next/head'
import { FoundationsListing } from '../../../components/foundations/FoundationsListing'

const META = { name:'NMAT', full:'NMAT by GMAC', color:'#1a6e3c', course:'/courses/nmat', courseLabel:'NMAT Mocks', isFullCourse:true }

export default function NMATLivePage() {
  return (
    <>
      <Head>
        <title>NMAT — Complete Course, 100% Free — GRADSKOOL</title>
        <meta name="description" content="The complete NMAT course, taught live by ALP Sir — every topic, ground up to exam-day strategy, entirely free." />
      </Head>
      <FoundationsListing examSlug="nmat" meta={META} readBasePath="/courses/nmat/live" />
    </>
  )
}

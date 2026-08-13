/**
 * GRADSKOOL — SNAP Complete Course, Free
 * Route: /courses/snap/live
 *
 * Grouped under /courses/snap/* alongside the paid Mocks page at
 * /courses/snap — this is the free half of the same product line, not a
 * separate "foundations" thing.
 */
import Head from 'next/head'
import { FoundationsListing } from '../../../components/foundations/FoundationsListing'

const META = { name:'SNAP', full:'Symbiosis National Aptitude Test', color:'#1a5c8a', course:'/courses/snap', courseLabel:'SNAP Mocks', isFullCourse:true, requireLogin:true, mocksCheckoutUrl:'/checkout?course=snap', mocksPrice:'₹1,499' }

export default function SNAPLivePage() {
  return (
    <>
      <Head>
        <title>SNAP — Complete Course, 100% Free — GRADSKOOL</title>
        <meta name="description" content="The complete SNAP course, taught live by ALP Sir — every topic, ground up to exam-day strategy, entirely free." />
      </Head>
      <FoundationsListing examSlug="snap" meta={META} readBasePath="/courses/snap/live" />
    </>
  )
}
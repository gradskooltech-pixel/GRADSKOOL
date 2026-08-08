/**
 * GRADSKOOL — ALPgebra
 * Route: /courses/cat/alpgebra
 *
 * DELIBERATELY a placeholder — no real curriculum, pricing, or format
 * details exist yet for this course. Built the page structure and slot
 * for content now so it's ready the moment real details (image/copy)
 * are shared, rather than fabricating specifics that would need to be
 * ripped out and replaced later.
 */
import Head from 'next/head'
import Link from 'next/link'
import { S, WaFloat } from '../../../components/courses/CourseLayout'
import CatTabs from '../../../components/courses/CatTabs'

const R = { color: 'var(--red)' }

export default function AlpgebraPage() {
  return (
    <>
      <Head>
        <title>ALPgebra — by Abhishek Leela Pandey — GRADSKOOL</title>
        <meta name="description" content="ALPgebra — a course by Abhishek Leela Pandey. Details coming soon." />
      </Head>

      <style>{S}</style>
      <CatTabs active="alpgebra" />

      <section style={{ background:'var(--black)', padding:'80px 0 64px', borderBottom:'var(--border)' }}>
        <div className="container" style={{ textAlign:'center' }}>
          <Link href="/courses/cat" style={{ fontFamily:'var(--font-sans)', fontSize:13, color:'var(--g500)', textDecoration:'none' }}>← Back to CAT</Link>
          <div className="eyebrow" style={{ marginTop:24, marginBottom:14, justifyContent:'center' }}><span className="dot" />By Abhishek Leela Pandey</div>
          <h1 className="d-xl" style={{ color:'#fff', marginBottom:20 }}>ALP<em style={R}>gebra.</em></h1>
          <p style={{ fontFamily:'var(--font-body)', fontSize:15, color:'var(--g500)', lineHeight:1.85, maxWidth:480, margin:'0 auto 32px' }}>
            A course by ALP Sir. Full details — curriculum, format, and pricing — are being finalized and will be added here shortly.
          </p>
          <a href="https://wa.me/917838737388?text=Hi%20ALP%20Sir%2C%20I%27d%20like%20to%20know%20more%20about%20ALPgebra"
            target="_blank" rel="noopener noreferrer" className="btn btn-red">
            <span className="wa-dot" />Ask ALP Sir about ALPgebra
          </a>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ textAlign:'center', maxWidth:560, margin:'0 auto' }}>
          <p style={{ fontFamily:'var(--font-body)', fontSize:14, color:'var(--g700)', lineHeight:1.8 }}>
            This page is a placeholder — check back soon, or WhatsApp ALP Sir directly for early details.
          </p>
        </div>
      </section>
      <WaFloat msg="Hi ALP Sir, I'd like to know more about ALPgebra" />
    </>
  )
}
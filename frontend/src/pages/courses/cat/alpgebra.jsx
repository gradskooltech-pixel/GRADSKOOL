/**
 * GRADSKOOL — ALPgebra
 * Route: /courses/cat/alpgebra
 *
 * DELIBERATELY a placeholder — no real curriculum, pricing, or format
 * details exist yet for this course. Restructured to match CATalysis's
 * visual layout (light 2-column hero) for consistency with the other
 * CAT pages, but the right-hand slot stays a "coming soon" notice
 * rather than fabricated pricing/features that would need ripping out
 * and replacing once real details (image/copy) are shared.
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

      <CatTabs active="alpgebra" />

      {/* hero */}
      <section style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr' }} className="alpgebra-hero">
        <style>{`@media(max-width:960px){.alpgebra-hero{grid-template-columns:1fr!important}}`}</style>
        <style>{S}</style>
        <div style={{ padding:'72px 48px 56px' }}>
          <Link href="/courses/cat" style={{ fontFamily:'var(--font-sans)', fontSize:13, color:'var(--g500)', textDecoration:'none' }}>← Back to CAT</Link>
          <div className="eyebrow" style={{ marginTop:20, marginBottom:14 }}><span className="dot" />By Abhishek Leela Pandey</div>
          <h1 className="d-xl" style={{ marginBottom:20, maxWidth:520 }}>ALP<em style={R}>gebra.</em></h1>
          <p style={{ fontFamily:'var(--font-body)', fontSize:15, color:'var(--g700)', lineHeight:1.85, maxWidth:480, marginBottom:32 }}>
            A course by ALP Sir. Full details — curriculum, format, and pricing — are being finalized and will be added here shortly.
          </p>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <a href="https://wa.me/917838737388?text=Hi%20ALP%20Sir%2C%20I%27d%20like%20to%20know%20more%20about%20ALPgebra"
              target="_blank" rel="noopener noreferrer" className="btn btn-red">
              <span className="wa-dot" />Ask ALP Sir about ALPgebra
            </a>
          </div>
        </div>

        <div style={{ background:'var(--off)', display:'flex', flexDirection:'column', justifyContent:'center', padding:'40px 48px' }}>
          <div style={{ background:'#fff', border:'var(--border)', borderRadius:4, padding:'28px 32px', textAlign:'center' }}>
            <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--g500)', marginBottom:14 }}>Coming Soon</div>
            <div style={{ fontFamily:'var(--font-serif)', fontSize:18, color:'var(--black)', lineHeight:1.4, marginBottom:14 }}>Curriculum and pricing are being finalized.</div>
            <p style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--g700)', lineHeight:1.7 }}>Check back soon, or WhatsApp ALP Sir directly for early details.</p>
          </div>
        </div>
      </section>
      <WaFloat msg="Hi ALP Sir, I'd like to know more about ALPgebra" />
    </>
  )
}
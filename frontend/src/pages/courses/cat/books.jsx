/**
 * GRADSKOOL — CAT Books
 * Route: /courses/cat/books
 *
 * A genuinely different product from the PDF Library — curated PHYSICAL
 * books, not digital PDFs. Was previously just a redirect to /pdfs, which
 * was wrong: cat.jsx already had real copy describing this as its own
 * ₹3,999 product (curated reading list + ALP Sir's notes). Built as a
 * real page instead of continuing to conflate the two.
 */
import Head from 'next/head'
import Link from 'next/link'
import { S, WaFloat } from '../../../components/courses/CourseLayout'
import CatTabs from '../../../components/courses/CatTabs'

const R = { color: 'var(--red)' }
const FALLBACK_EXAM_YEAR = 2026

export default function CatBooksPage() {
  const examYear = FALLBACK_EXAM_YEAR

  return (
    <>
      <Head>
        <title>{`CAT Books — Curated Reading List for CAT ${examYear} — GRADSKOOL`}</title>
        <meta name="description" content={`Curated physical books for CAT ${examYear} — a recommended reading list with ALP Sir's own notes. ₹3,999.`} />
      </Head>

      <style>{S}</style>
      <CatTabs active="books" />

      <section style={{ background:'var(--black)', padding:'72px 0 56px', borderBottom:'var(--border)' }}>
        <div className="container">
          <Link href="/courses/cat" style={{ fontFamily:'var(--font-sans)', fontSize:13, color:'var(--g500)', textDecoration:'none' }}>← Back to CAT</Link>
          <div className="eyebrow" style={{ marginTop:20, marginBottom:14 }}><span className="dot" />Physical Books</div>
          <h1 className="d-xl" style={{ color:'#fff', marginBottom:20, maxWidth:560 }}>CAT <em style={R}>Books.</em></h1>
          <p style={{ fontFamily:'var(--font-body)', fontSize:15, color:'var(--g500)', lineHeight:1.85, maxWidth:520, marginBottom:32 }}>
            {`Curated physical books for CAT ${examYear} — a recommended reading list with ALP Sir's own notes in the margins. Not a digital PDF — real books, shipped to you.`}
          </p>

          <div style={{ background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.12)', borderRadius:4, padding:'28px 32px', maxWidth:360, marginBottom:28 }}>
            <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--g500)', marginBottom:10 }}>CAT Books</div>
            <div style={{ fontFamily:'var(--font-serif)', fontSize:36, color:'#fff', lineHeight:1, marginBottom:20 }}>₹3,999</div>
            <Link href="/checkout?course=cat-books&plan=cat-books" className="btn btn-red" style={{ width:'100%', justifyContent:'center' }}>Order Now →</Link>
          </div>

          <a href="https://wa.me/917838737388?text=Hi%20ALP%20Sir%2C%20I%20want%20to%20know%20more%20about%20CAT%20Books"
            target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
            <span className="wa-dot" />WhatsApp ALP Sir about CAT Books
          </a>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth:640 }}>
          <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />What's included</div>
          <h2 className="d-lg" style={{ marginBottom:20 }}>A reading list<br /><em style={R}>you'll actually use.</em></h2>
          {['A curated set of physical books covering CAT\u2019s full syllabus', 'ALP Sir\u2019s own handwritten notes and annotations in the margins', 'Recommended reading order, paced against your prep timeline', 'Shipped directly to your address'].map(item => (
            <div key={item} style={{ fontFamily:'var(--font-body)', fontSize:14, color:'var(--g700)', padding:'10px 0', borderBottom:'var(--border)', display:'flex', gap:10, lineHeight:1.6 }}>
              <span style={R}>—</span><span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <WaFloat msg="Hi ALP Sir, I want to know more about CAT Books" />
    </>
  )
}
/**
 * GRADSKOOL — CAT Books
 * Route: /courses/cat/books
 *
 * A genuinely different product from the PDF Library — curated PHYSICAL
 * books, not digital PDFs. Rebuilt to match CATalysis's structure and
 * visual style: light 2-column hero with a pricing card on the right,
 * for consistency across every CAT page.
 */
import Head from 'next/head'
import Link from 'next/link'
import { S, WaFloat } from '../../../components/courses/CourseLayout'
import CatTabs from '../../../components/courses/CatTabs'

const R = { color: 'var(--red)' }
const FALLBACK_EXAM_YEAR = 2026
const BOOKS_PRICE = 3999

function fmtPrice(n) {
  return `₹${Number(n).toLocaleString('en-IN')}`
}

export default function CatBooksPage() {
  const examYear = FALLBACK_EXAM_YEAR

  return (
    <>
      <Head>
        <title>{`CAT Books — Curated Reading List for CAT ${examYear} — GRADSKOOL`}</title>
        <meta name="description" content={`Curated physical books for CAT ${examYear} — a recommended reading list with ALP Sir's own notes. ${fmtPrice(BOOKS_PRICE)}.`} />
      </Head>

      <CatTabs active="books" />

      {/* hero */}
      <section style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr' }} className="books-hero">
        <style>{`@media(max-width:960px){.books-hero{grid-template-columns:1fr!important}}`}</style>
        <style>{S}</style>
        <div style={{ padding:'72px 48px 56px' }}>
          <Link href="/courses/cat" style={{ fontFamily:'var(--font-sans)', fontSize:13, color:'var(--g500)', textDecoration:'none' }}>← Back to CAT</Link>
          <div className="eyebrow" style={{ marginTop:20, marginBottom:14 }}><span className="dot" />Physical Books</div>
          <h1 className="d-xl" style={{ marginBottom:20, maxWidth:520 }}>CAT <em style={R}>Books.</em></h1>
          <p style={{ fontFamily:'var(--font-body)', fontSize:15, color:'var(--g700)', lineHeight:1.85, maxWidth:480, marginBottom:32 }}>
            {`Curated physical books for CAT ${examYear} — a recommended reading list with ALP Sir's own notes in the margins. Not a digital PDF — real books, shipped to you.`}
          </p>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <Link href="/checkout?course=cat-books&plan=cat-books" className="btn btn-red">Order Now — {fmtPrice(BOOKS_PRICE)} →</Link>
            <a href="https://wa.me/917838737388?text=Hi%20ALP%20Sir%2C%20I%20want%20to%20know%20more%20about%20CAT%20Books"
              target="_blank" rel="noopener noreferrer" className="btn btn-wa">
              <span className="wa-dot" />WhatsApp ALP Sir
            </a>
          </div>
          <div style={{ display:'flex', gap:28, marginTop:44, paddingTop:24, borderTop:'var(--border)', flexWrap:'wrap' }}>
            {[['Physical','Real books, not PDFs'],['Annotated','ALP Sir\u2019s own notes'],['Shipped','Direct to your address']].map(([v,l]) => (
              <div key={l}>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:22, color:'var(--black)', lineHeight:1 }}>{v}</div>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'var(--g500)', marginTop:3 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background:'var(--off)', display:'flex', flexDirection:'column', justifyContent:'center', padding:'40px 48px' }}>
          <div style={{ background:'#fff', border:'var(--border)', borderRadius:4, padding:'28px 32px' }}>
            <div style={{ fontFamily:'var(--font-serif)', fontSize:20, color:'var(--black)', marginBottom:14 }}>CAT Books</div>
            {['A curated set of physical books covering CAT\u2019s full syllabus', 'ALP Sir\u2019s own handwritten notes and annotations in the margins', 'Recommended reading order, paced against your prep timeline', 'Shipped directly to your address'].map(item => (
              <div key={item} style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--g700)', marginBottom:6, display:'flex', gap:8 }}>
                <span style={R}>—</span><span>{item}</span>
              </div>
            ))}
            <div style={{ marginTop:20, display:'flex', alignItems:'baseline', gap:12, borderTop:'var(--border)', paddingTop:16 }}>
              <div style={{ fontFamily:'var(--font-serif)', fontSize:38, color:'var(--black)', lineHeight:1 }}>{fmtPrice(BOOKS_PRICE)}</div>
              <div style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'var(--g500)' }}>+ shipping</div>
            </div>
            <Link href="/checkout?course=cat-books&plan=cat-books" className="btn btn-red" style={{ marginTop:14, width:'100%', justifyContent:'center' }}>Order Now →</Link>
          </div>
        </div>
      </section>

      {/* what's included */}
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
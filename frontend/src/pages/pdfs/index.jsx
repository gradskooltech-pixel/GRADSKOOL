/**
 * GRADSKOOL — PDF Library Hub
 * Route: /pdfs
 *
 * Was a flat grid of every PDF — now organized by exam, since PDFs are
 * genuinely scoped that way: a PDF attached to a SNAP class should live
 * under the SNAP card, not in one big undifferentiated list. "CAT FYQs" is
 * deliberately its own card, not merged into "CAT" — PDFs attached to an
 * FYQ question are a distinct pool worth keeping visually separate.
 */
import Link from 'next/link'
import PageSEO from '../../components/seo/PageSEO'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

const CARDS = [
  { slug:'cat',      label:'CAT',      color:'#d94f50', href:'/pdfs/exam/cat',      fetchExam:'cat',  fetchFyqOnly:false },
  { slug:'xat',      label:'XAT',      color:'#5b3fa0', href:'/pdfs/exam/xat',      fetchExam:'xat',  fetchFyqOnly:false },
  { slug:'snap',     label:'SNAP',     color:'#1a5c8a', href:'/pdfs/exam/snap',     fetchExam:'snap', fetchFyqOnly:false },
  { slug:'nmat',     label:'NMAT',     color:'#1a6e3c', href:'/pdfs/exam/nmat',     fetchExam:'nmat', fetchFyqOnly:false },
  { slug:'cat-fyqs', label:'CAT FYQs', color:'#b45309', href:'/pdfs/exam/cat-fyqs', fetchExam:'cat',  fetchFyqOnly:true  },
]

export async function getStaticProps() {
  const counts = await Promise.all(
    CARDS.map(async (card) => {
      try {
        const params = new URLSearchParams({ exam: card.fetchExam })
        if (card.fetchFyqOnly) params.set('fyq_only', '1')
        const res = await fetch(`${API}/pdfs/?${params.toString()}`)
        if (!res.ok) return 0
        const data = await res.json()
        const list = data.results || data || []
        return Array.isArray(list) ? list.length : (data.count ?? 0)
      } catch { return 0 }
    })
  )
  return {
    props: { cardCounts: CARDS.map((c, i) => ({ ...c, count: counts[i] })) },
    revalidate: 300,
  }
}

export default function PdfLibraryHub({ cardCounts }) {
  return (
    <>
      <PageSEO
        title="PDF Library — Exam Handbooks & Formula Sheets — GRADSKOOL"
        description="Structured CAT, XAT, SNAP and NMAT PDFs, plus FYQ solution sheets — read directly in your account, no downloads, no leaked screenshots."
        canonical="/pdfs"
        breadcrumbs={[{ name: 'Home', url: '/' }, { name: 'PDF Library', url: '/pdfs' }]}
      />

      <style>{`
        .pdf-hero { max-width:1200px; margin:0 auto; padding:64px 40px 32px; text-align:center; }
        .pdf-eyebrow { font-family:var(--font-sans); font-size:11px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:var(--red); margin-bottom:14px; }
        .pdf-h1 { font-family:var(--font-serif); font-size:clamp(32px,4.5vw,48px); font-weight:400; color:var(--black); line-height:1.15; margin-bottom:14px; }
        .pdf-sub { font-family:var(--font-body); font-size:16px; color:var(--g700); max-width:560px; margin:0 auto; line-height:1.6; }
        .pdf-hub-grid { max-width:1000px; margin:0 auto; padding:24px 40px 96px; display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:24px; }
        .pdf-hub-card { border:var(--border); border-radius:var(--radius); overflow:hidden; text-decoration:none; background:#fff; transition:transform var(--t), box-shadow var(--t); display:flex; flex-direction:column; }
        .pdf-hub-card:hover { transform:translateY(-3px); box-shadow:var(--shadow); }
        .pdf-hub-card-top { padding:32px 24px 26px; color:#fff; }
        .pdf-hub-card-name { font-family:var(--font-serif); font-size:26px; }
        .pdf-hub-card-bottom { padding:18px 24px; display:flex; justify-content:space-between; align-items:center; }
        .pdf-hub-stat { font-family:var(--font-sans); font-size:12px; color:var(--g500); }
        .pdf-hub-stat b { color:var(--black); font-weight:700; }
        .pdf-hub-arrow { font-family:var(--font-sans); font-size:13px; font-weight:600; color:var(--red); }
      `}</style>

      <div className="pdf-hero">
        <p className="pdf-eyebrow">Study Material</p>
        <h1 className="pdf-h1">The PDF Library</h1>
        <p className="pdf-sub">
          Formula handbooks, topic-wise question banks and reference PDFs — read straight
          in your account. No downloads, and every page is tied to your account.
        </p>
      </div>

      <div className="pdf-hub-grid">
        {cardCounts.map(card => (
          <Link key={card.slug} href={card.href} className="pdf-hub-card">
            <div className="pdf-hub-card-top" style={{ background: card.color }}>
              <div className="pdf-hub-card-name">{card.label}</div>
            </div>
            <div className="pdf-hub-card-bottom">
              <span className="pdf-hub-stat"><b>{card.count}</b> PDF{card.count === 1 ? '' : 's'}</span>
              <span className="pdf-hub-arrow">Browse →</span>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
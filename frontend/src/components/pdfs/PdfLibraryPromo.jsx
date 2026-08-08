/**
 * GRADSKOOL — PDF Library promo card
 *
 * A drop-in section for /courses/cat.jsx (or the homepage courses grid) —
 * I didn't touch cat.jsx directly since it's 34KB and I don't have full
 * visibility into its current section order; safer to hand you a
 * self-contained block you can import and place wherever it reads best
 * (e.g. right after the CAThlete section, before testimonials).
 *
 * Usage in courses/cat.jsx:
 *   import { PdfLibraryPromo } from '../../components/pdfs/PdfLibraryPromo'
 *   ...
 *   <PdfLibraryPromo examSlug="cat" />
 */
import Link from 'next/link'
import { usePdfList } from '../../hooks/usePdfs'

export function PdfLibraryPromo({ examSlug }) {
  const { pdfs, isLoading } = usePdfList(examSlug)

  if (!isLoading && pdfs.length === 0) return null

  return (
    <section style={{ padding: '64px 40px', borderTop: 'var(--border)' }}>
      <style>{`
        .pdfp-wrap { max-width:1100px; margin:0 auto; }
        .pdfp-head { display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:28px; gap:16px; flex-wrap:wrap; }
        .pdfp-eyebrow { font-family:var(--font-sans); font-size:11px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:var(--red); margin-bottom:8px; }
        .pdfp-title { font-family:var(--font-serif); font-size:clamp(24px,3vw,32px); color:var(--black); font-weight:400; }
        .pdfp-link { font-family:var(--font-sans); font-size:13px; font-weight:600; color:var(--red); text-decoration:none; white-space:nowrap; }
        .pdfp-row { display:flex; gap:18px; overflow-x:auto; padding-bottom:8px; }
        .pdfp-card { flex:0 0 200px; border:var(--border); border-radius:var(--radius); overflow:hidden; text-decoration:none; background:#fff; }
        .pdfp-cover { width:100%; aspect-ratio:3/4; background:var(--off) center/cover no-repeat; }
        .pdfp-body { padding:12px 14px; }
        .pdfp-name { font-family:var(--font-serif); font-size:14px; color:var(--black); line-height:1.3; margin-bottom:6px; }
        .pdfp-price { font-family:var(--font-sans); font-size:12px; font-weight:700; color:var(--red); }
      `}</style>
      <div className="pdfp-wrap">
        <div className="pdfp-head">
          <div>
            <p className="pdfp-eyebrow">Study Material</p>
            <h2 className="pdfp-title">PDF Library for {examSlug ? examSlug.toUpperCase() : 'this exam'}</h2>
          </div>
          <Link href={examSlug ? `/pdfs?exam=${examSlug}` : '/pdfs'} className="pdfp-link">
            View all PDFs →
          </Link>
        </div>
        <div className="pdfp-row">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="pdfp-card" style={{ aspectRatio: '3/4.6' }} />)
            : pdfs.slice(0, 6).map((pdf) => (
                <Link key={pdf.id} href={`/pdfs/${pdf.slug}`} className="pdfp-card">
                  <div className="pdfp-cover" style={pdf.cover_image_url ? { backgroundImage: `url(${pdf.cover_image_url})` } : undefined} />
                  <div className="pdfp-body">
                    <p className="pdfp-name">{pdf.title}</p>
                    <span className="pdfp-price">{pdf.is_free ? 'Free' : `₹${Number(pdf.price_inr).toLocaleString('en-IN')}`}</span>
                  </div>
                </Link>
              ))}
        </div>
      </div>
    </section>
  )
}

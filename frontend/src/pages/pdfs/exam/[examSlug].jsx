/**
 * GRADSKOOL — PDF Library, per exam
 * Route: /pdfs/exam/[examSlug]
 *
 * Handles both the four regular exam cards (cat/xat/snap/nmat) and the
 * special "cat-fyqs" slug, which fetches with fyq_only=1 instead — same
 * page, same card styling, just a different query to the same endpoint.
 *
 * getStaticProps (2026-08-15): `meta` used to be resolved purely client-side
 * from router.query.examSlug, which is empty during the server-rendered
 * pass — social crawlers (WhatsApp, Facebook, etc.) never execute JS, so
 * they saw a version of this page with meta=undefined, which doesn't even
 * render <PageSEO> at all (falls into the early "not found" branch instead).
 * Every share showed a bare domain with no title/image. EXAM_META is a
 * small, fixed, hardcoded lookup — no API call needed — so resolving it at
 * build time via getStaticProps is cheap and makes the title/description/
 * ogImage actually present in the initial HTML crawlers fetch.
 *
 * Bundle buying (2026-08-23): used to have a full tier-picker/dropdown/
 * checkout panel built directly into this page. Moved out to its own
 * page — /checkout/pdfs?exam=<slug> — so the FYQ question page, the
 * individual PDF detail page, and this library page all send people to
 * ONE real checkout flow instead of three different copies of the same
 * logic. This page just links out now.
 */
import Link from 'next/link'
import PageSEO from '../../../components/seo/PageSEO'
import { usePdfList } from '../../../hooks/usePdfs'
import { useAuth } from '../../../hooks/useAuth'

const EXAM_META = {
  cat:      { label:'CAT',      color:'#d94f50', fetchExam:'cat',  fyqOnly:false, ogImage:'/assets/og-cat.jpg' },
  xat:      { label:'XAT',      color:'#5b3fa0', fetchExam:'xat',  fyqOnly:false, ogImage:'/assets/og-xat.jpg' },
  // No og-snap.jpg exists in /public/assets yet (confirmed 2026-08-15 — this
  // is a pre-existing gap, the exams API also references a file that isn't
  // there). Left unset so PageSEO falls back to the generic site OG image
  // instead of pointing at a 404. Add og-snap.jpg to /public/assets and set
  // this to '/assets/og-snap.jpg' once that image exists.
  snap:     { label:'SNAP',     color:'#1a5c8a', fetchExam:'snap', fyqOnly:false },
  nmat:     { label:'NMAT',     color:'#1a6e3c', fetchExam:'nmat', fyqOnly:false, ogImage:'/assets/og-nmat.jpg' },
  // No dedicated FYQs graphic — reuses the CAT exam's own OG image since this
  // page is CAT-specific, rather than falling back to the generic site image.
  'cat-fyqs': { label:'CAT FYQs', color:'#b45309', fetchExam:'cat', fyqOnly:true, ogImage:'/assets/og-cat.jpg' },
}

export async function getStaticPaths() {
  return {
    paths: Object.keys(EXAM_META).map((examSlug) => ({ params: { examSlug } })),
    fallback: false, // any slug not in EXAM_META 404s, same as the old client-side "not found" branch did
  }
}

export async function getStaticProps({ params }) {
  const meta = EXAM_META[params.examSlug]
  if (!meta) return { notFound: true }
  return { props: { examSlug: params.examSlug, meta } }
}

export default function PdfLibraryByExam({ examSlug, meta }) {
  const { pdfs, isLoading } = usePdfList(meta?.fetchExam, meta?.fyqOnly, { enabled: !!meta })
  const { isLoggedIn } = useAuth()

  return (
    <>
      <PageSEO
        title={`${meta.label} PDFs — GRADSKOOL PDF Library`}
        description={`${meta.label} formula handbooks, question banks, and reference PDFs — read directly in your account.`}
        canonical={`/pdfs/exam/${examSlug}`}
        ogImage={meta.ogImage}
        breadcrumbs={[{ name: 'Home', url: '/' }, { name: 'PDF Library', url: '/pdfs' }, { name: meta.label, url: `/pdfs/exam/${examSlug}` }]}
      />

      <style>{`
        .pdf-hero { max-width:1200px; margin:0 auto; padding:56px 40px 24px; text-align:center; }
        .pdf-eyebrow { font-family:var(--font-sans); font-size:11px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; margin-bottom:14px; }
        .pdf-h1 { font-family:var(--font-serif); font-size:clamp(28px,4.5vw,42px); font-weight:400; color:var(--black); line-height:1.15; }
        .pdf-back { font-family:var(--font-sans); font-size:12px; color:var(--g500); text-decoration:none; }
        .pdf-grid { max-width:1200px; margin:0 auto; padding:24px 40px 96px; display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:24px; }
        .pdf-card { border:var(--border); border-radius:var(--radius); background:#fff; overflow:hidden; transition:box-shadow var(--t), transform var(--t); display:flex; flex-direction:column; }
        .pdf-card:hover { box-shadow:var(--shadow); transform:translateY(-2px); }
        .pdf-cover { width:100%; aspect-ratio:3/4; background:var(--off) center/cover no-repeat; border-bottom:var(--border); position:relative; }
        .pdf-badge { position:absolute; top:10px; right:10px; background:var(--black); color:#fff; font-family:var(--font-sans); font-size:10px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; padding:4px 9px; border-radius:3px; }
        .pdf-badge.free { background:var(--red); }
        .pdf-body { padding:18px 20px 20px; display:flex; flex-direction:column; gap:8px; flex:1; }
        .pdf-title { font-family:var(--font-serif); font-size:18px; color:var(--black); line-height:1.3; }
        .pdf-meta { font-family:var(--font-sans); font-size:12px; color:var(--g500); }
        .pdf-cta-row { margin-top:auto; padding-top:12px; display:flex; align-items:center; justify-content:space-between; }
        .pdf-price { font-family:var(--font-sans); font-size:15px; font-weight:700; color:var(--black); }
        .pdf-price.free { color:var(--red); }
        .pdf-btn { font-family:var(--font-sans); font-size:12px; font-weight:600; padding:8px 16px; border-radius:var(--radius); text-decoration:none; border:2px solid var(--red); color:var(--red); transition:all var(--t); }
        .pdf-btn:hover { background:var(--red); color:#fff; }
        .pdf-btn.owned { border-color:var(--black); color:var(--black); }
        .pdf-btn.owned:hover { background:var(--black); color:#fff; }
        .pdf-empty { text-align:center; padding:80px 20px; font-family:var(--font-body); color:var(--g500); }
      `}</style>

      <div className="pdf-hero">
        <Link href="/pdfs" className="pdf-back">← PDF Library</Link>
        <p className="pdf-eyebrow" style={{ color: meta.color, marginTop:16 }}>{meta.fyqOnly ? 'Future Year Questions' : 'Study Material'}</p>
        <h1 className="pdf-h1">{meta.label} PDFs</h1>

        {/* Now just a link to the dedicated checkout page — no in-page
            panel/state here anymore. */}
        {meta.fyqOnly && (
          <Link
            href={`/checkout/pdfs?exam=${meta.fetchExam}`}
            style={{
              display:'inline-block', marginTop: 20, fontFamily:'var(--font-sans)', fontSize:13, fontWeight:600,
              padding:'9px 20px', borderRadius:'var(--radius)', textDecoration:'none',
              border:'2px solid var(--red)', background:'#fff', color:'var(--red)',
            }}
          >
            📦 Buy in bulk — save up to 69%
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="pdf-grid">{Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : pdfs.length === 0 ? (
        <p className="pdf-empty">No {meta.label} PDFs yet — check back soon.</p>
      ) : (
        <div className="pdf-grid">
          {pdfs.map((pdf) => <PdfCard key={pdf.id} pdf={pdf} />)}
        </div>
      )}
    </>
  )
}

function PdfCard({ pdf }) {
  const isFree = pdf.is_free
  const owned = pdf.is_owned
  return (
    <Link href={`/pdfs/${pdf.slug}`} className="pdf-card" style={{ textDecoration: 'none' }}>
      <div className="pdf-cover" style={pdf.cover_image_url ? { backgroundImage: `url(${pdf.cover_image_url})` } : undefined}>
        <span className={`pdf-badge${isFree ? ' free' : ''}`}>
          {isFree ? 'Free' : `${pdf.page_count || ''} pages`.trim()}
        </span>
      </div>
      <div className="pdf-body">
        <h3 className="pdf-title">{pdf.title}</h3>
        <div className="pdf-cta-row">
          <span className={`pdf-price${isFree ? ' free' : ''}`}>
            {isFree ? 'Free' : `₹${Number(pdf.price_inr).toLocaleString('en-IN')}`}
          </span>
          <span className={`pdf-btn${owned ? ' owned' : ''}`}>
            {owned ? 'Read →' : isFree ? 'Get Free →' : 'View →'}
          </span>
        </div>
      </div>
    </Link>
  )
}

function SkeletonCard() {
  return (
    <div className="pdf-card">
      <div className="pdf-cover" style={{ background: 'var(--off)' }} />
      <div className="pdf-body">
        <div style={{ height: 16, width: '80%', background: 'var(--off)', borderRadius: 3 }} />
        <div style={{ height: 12, width: '40%', background: 'var(--off)', borderRadius: 3, marginTop: 8 }} />
      </div>
    </div>
  )
}
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
 */
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/router'
import PageSEO from '../../../components/seo/PageSEO'
import { usePdfList, useCreatePdfBundleOrder, useVerifyPdfPayment, useRazorpay } from '../../../hooks/usePdfs'
import { useAuth } from '../../../hooks/useAuth'

// Fixed bundle tiers — mirrors backend apps.pdfs.models.BUNDLE_TIERS
// exactly. Kept in sync manually since this is plain display/selection
// logic on the frontend; the real charge is always calculated server-side
// in create_pdf_bundle_order regardless of what this shows.
const BUNDLE_TIERS = { 1: 29, 10: 25, 20: 21, 30: 17, 40: 13, 50: 9 }
const TIER_SIZES = Object.keys(BUNDLE_TIERS).map(Number).sort((a, b) => a - b)

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
  const { isLoggedIn, user } = useAuth()
  const router = useRouter()

  // Bundle selection only exists on the FYQ page — matches the real
  // backend restriction (fyq_category=True only, see apps.pdfs.services.
  // create_pdf_bundle_order) exactly. On regular exam pages this whole
  // block of state/UI is simply never rendered.
  const [bundleMode, setBundleMode] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [checkoutState, setCheckoutState] = useState('idle') // idle | loading | error
  const [checkoutError, setCheckoutError] = useState('')

  const { createBundleOrder } = useCreatePdfBundleOrder()
  const { verify } = useVerifyPdfPayment()
  const { loadRazorpay } = useRazorpay()

  const toggleSelect = (pdf) => {
    if (pdf.is_owned) return // already owned — nothing to select
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(pdf.id)) next.delete(pdf.id)
      else next.add(pdf.id)
      return next
    })
  }

  const count = selected.size
  // Real per-PDF rate for the CURRENT selection count — only defined at
  // an exact tier size (1/10/20/30/40/50), matching the backend's exact-
  // match requirement. Anything else shows as invalid, not silently
  // rounded to a nearby tier.
  const rate = BUNDLE_TIERS[count]
  const total = rate ? rate * count : null

  const nextTierUp = TIER_SIZES.find(t => t > count)
  const validSelection = count > 0 && rate !== undefined

  const startBundleCheckout = async () => {
    if (!isLoggedIn) {
      router.push(`/auth/login?redirect=${encodeURIComponent(router.asPath)}`)
      return
    }
    if (!validSelection) return

    const phone = user?.phone
    if (!phone) {
      // Same phone requirement as the single-PDF flow (pages/pdfs/[slug].jsx)
      // — reusing that page's own phone-capture screen would mean leaving
      // this page, so instead this just asks inline via a simple prompt.
      // Genuinely minimal on purpose: this is the one gap versus the
      // single-PDF flow's dedicated phone-capture form, worth upgrading to
      // a real inline form later if bundle checkout sees real usage.
      const entered = window.prompt('Enter your phone number to continue:')
      if (!entered || entered.trim().length < 10) return
      await runCheckout(entered.trim())
      return
    }
    await runCheckout(phone)
  }

  const runCheckout = async (phone) => {
    setCheckoutState('loading')
    setCheckoutError('')

    const orderResult = await createBundleOrder(Array.from(selected), phone)
    if (!orderResult.success) {
      setCheckoutState('error')
      setCheckoutError(orderResult.error)
      return
    }

    let Razorpay
    try {
      Razorpay = await loadRazorpay()
    } catch {
      setCheckoutState('error')
      setCheckoutError('Payment gateway unavailable. Please try again.')
      return
    }

    const rzp = new Razorpay({
      ...orderResult.data,
      handler: async (response) => {
        await verify(response)
        setCheckoutState('idle')
        setSelected(new Set())
        setBundleMode(false)
        router.push('/dashboard?purchased=bundle')
      },
      modal: { ondismiss: () => setCheckoutState('idle') },
    })

    rzp.on('payment.failed', (response) => {
      setCheckoutState('error')
      setCheckoutError(response.error?.description || 'Payment failed. Please try again.')
    })

    rzp.open()
  }

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

        {/* Bundle mode only exists on the FYQ page — matches the real
            backend restriction (fyq_category=True only). */}
        {meta.fyqOnly && (
          <button
            onClick={() => { setBundleMode(v => !v); setSelected(new Set()) }}
            style={{
              marginTop: 20, fontFamily:'var(--font-sans)', fontSize:13, fontWeight:600,
              padding:'9px 20px', borderRadius:'var(--radius)', cursor:'pointer',
              border: bundleMode ? '2px solid var(--black)' : '2px solid var(--red)',
              background: bundleMode ? 'var(--black)' : '#fff',
              color: bundleMode ? '#fff' : 'var(--red)',
            }}
          >
            {bundleMode ? '✕ Cancel bundle selection' : '📦 Buy in bulk — save up to 69%'}
          </button>
        )}
      </div>

      {bundleMode && (
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 40px 24px' }}>
          <div style={{ background:'var(--off)', border:'var(--border)', borderRadius:'var(--radius)', padding:'16px 20px', fontFamily:'var(--font-sans)', fontSize:13, color:'var(--g700)' }}>
            Pick PDFs below — bundles only work at exact sizes: {TIER_SIZES.map(t => `${t}`).join(', ')}.
            Price per PDF drops the bigger your bundle: {TIER_SIZES.map(t => `${t}=₹${BUNDLE_TIERS[t]}`).join(' · ')}.
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="pdf-grid">{Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : pdfs.length === 0 ? (
        <p className="pdf-empty">No {meta.label} PDFs yet — check back soon.</p>
      ) : (
        <div className="pdf-grid" style={bundleMode ? { paddingBottom: 140 } : undefined}>
          {pdfs.map((pdf) => (
            <PdfCard
              key={pdf.id}
              pdf={pdf}
              isLoggedIn={isLoggedIn}
              bundleMode={bundleMode}
              isSelected={selected.has(pdf.id)}
              onToggleSelect={toggleSelect}
            />
          ))}
        </div>
      )}

      {bundleMode && count > 0 && (
        <div style={{
          position:'fixed', bottom:0, left:0, right:0, zIndex:200,
          background:'#fff', borderTop:'var(--border)', boxShadow:'0 -4px 24px rgba(0,0,0,.08)',
          padding:'16px 40px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16,
        }}>
          <div>
            <div style={{ fontFamily:'var(--font-sans)', fontSize:13, color:'var(--g700)' }}>
              {count} PDF{count !== 1 ? 's' : ''} selected
              {!validSelection && (
                <span style={{ color:'var(--red)', fontWeight:600 }}>
                  {' '}— not a valid bundle size{nextTierUp ? `, select ${nextTierUp - count} more to reach ${nextTierUp}` : ''}
                </span>
              )}
            </div>
            {validSelection && (
              <div style={{ fontFamily:'var(--font-serif)', fontSize:22, color:'var(--black)' }}>
                ₹{total.toLocaleString('en-IN')} <span style={{ fontSize:13, fontFamily:'var(--font-sans)', color:'var(--g500)', fontWeight:400 }}>(₹{rate}/PDF)</span>
              </div>
            )}
            {checkoutState === 'error' && (
              <div style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'var(--red)', marginTop:4 }}>{checkoutError}</div>
            )}
          </div>
          <button
            onClick={startBundleCheckout}
            disabled={!validSelection || checkoutState === 'loading'}
            style={{
              fontFamily:'var(--font-sans)', fontSize:14, fontWeight:700, padding:'13px 30px',
              borderRadius:'var(--radius)', border:'none', cursor: validSelection ? 'pointer' : 'not-allowed',
              background: validSelection ? 'var(--red)' : 'var(--g300)', color:'#fff',
            }}
          >
            {checkoutState === 'loading' ? 'Preparing checkout…' : `Buy ${count > 0 ? count : ''} PDFs →`}
          </button>
        </div>
      )}
    </>
  )
}

function PdfCard({ pdf, bundleMode, isSelected, onToggleSelect }) {
  const isFree = pdf.is_free
  const owned = pdf.is_owned

  // In bundle mode, an already-owned or free PDF can't be added to a
  // bundle (nothing to buy) — shown greyed out with an explanatory badge
  // rather than just silently doing nothing on click.
  const selectable = bundleMode && !owned && !isFree

  const cardContent = (
    <>
      <div className="pdf-cover" style={pdf.cover_image_url ? { backgroundImage: `url(${pdf.cover_image_url})` } : undefined}>
        <span className={`pdf-badge${isFree ? ' free' : ''}`}>
          {isFree ? 'Free' : `${pdf.page_count || ''} pages`.trim()}
        </span>
        {bundleMode && selectable && (
          <span style={{
            position:'absolute', top:10, left:10, width:24, height:24, borderRadius:5,
            display:'flex', alignItems:'center', justifyContent:'center',
            border: isSelected ? 'none' : '2px solid #fff',
            background: isSelected ? 'var(--red)' : 'rgba(0,0,0,.35)',
            color:'#fff', fontSize:14, fontWeight:700,
          }}>
            {isSelected ? '✓' : ''}
          </span>
        )}
      </div>
      <div className="pdf-body">
        <h3 className="pdf-title">{pdf.title}</h3>
        <div className="pdf-cta-row">
          <span className={`pdf-price${isFree ? ' free' : ''}`}>
            {isFree ? 'Free' : `₹${Number(pdf.price_inr).toLocaleString('en-IN')}`}
          </span>
          {!bundleMode && (
            <span className={`pdf-btn${owned ? ' owned' : ''}`}>
              {owned ? 'Read →' : isFree ? 'Get Free →' : 'View →'}
            </span>
          )}
          {bundleMode && !selectable && (
            <span style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'var(--g500)' }}>
              {owned ? 'Already owned' : 'Free — no bundle needed'}
            </span>
          )}
        </div>
      </div>
    </>
  )

  if (bundleMode) {
    return (
      <div
        onClick={() => selectable && onToggleSelect(pdf)}
        className="pdf-card"
        style={{
          cursor: selectable ? 'pointer' : 'default',
          opacity: selectable ? 1 : 0.55,
          outline: isSelected ? '2px solid var(--red)' : 'none',
          outlineOffset: -2,
        }}
      >
        {cardContent}
      </div>
    )
  }

  return (
    <Link href={`/pdfs/${pdf.slug}`} className="pdf-card" style={{ textDecoration: 'none' }}>
      {cardContent}
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
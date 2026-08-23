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
        .pdf-layout { max-width:1200px; margin:0 auto; padding:24px 40px 96px; display:flex; gap:32px; align-items:flex-start; }
        .pdf-grid { flex:1; display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:24px; }
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
        /* Bundle side panel */
        .bundle-panel { width:300px; flex-shrink:0; position:sticky; top:88px; border:var(--border); border-radius:var(--radius); background:#fff; display:flex; flex-direction:column; max-height:calc(100vh - 120px); }
        .bundle-panel-head { padding:18px 20px; border-bottom:var(--border); }
        .bundle-panel-list { overflow-y:auto; flex:1; padding:6px 0; }
        .bundle-panel-item { display:flex; align-items:center; gap:10px; padding:11px 20px; cursor:pointer; }
        .bundle-panel-item:hover { background:var(--off); }
        .bundle-panel-item.disabled { opacity:.45; cursor:default; }
        .bundle-panel-foot { padding:16px 20px; border-top:var(--border); background:var(--off); }
        @media(max-width:900px){ .pdf-layout{flex-direction:column} .bundle-panel{position:static; width:100%; max-height:none} }
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
            {bundleMode ? '✕ Close bundle picker' : '📦 Buy in bulk — save up to 69%'}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="pdf-layout"><div className="pdf-grid">{Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}</div></div>
      ) : pdfs.length === 0 ? (
        <p className="pdf-empty">No {meta.label} PDFs yet — check back soon.</p>
      ) : (
        <div className="pdf-layout">
          <div className="pdf-grid">
            {pdfs.map((pdf) => <PdfCard key={pdf.id} pdf={pdf} />)}
          </div>

          {bundleMode && (
            <BundlePanel
              pdfs={pdfs}
              selected={selected}
              onToggleSelect={toggleSelect}
              onResetSelection={() => setSelected(new Set())}
              count={count}
              rate={rate}
              total={total}
              checkoutState={checkoutState}
              checkoutError={checkoutError}
              onCheckout={startBundleCheckout}
            />
          )}
        </div>
      )}
    </>
  )
}

// Genuinely separate right-hand panel — replaces the earlier approach of
// checkbox overlays on every card plus a bottom sticky bar, which read as
// fussy. Selection now lives entirely in one scrollable list; the main
// grid on the left is untouched, browsable exactly like before.
function BundlePanel({ pdfs, selected, onToggleSelect, onResetSelection, count, rate, total, checkoutState, checkoutError, onCheckout }) {
  // Tier-first flow: pick a size, THEN pick exactly that many PDFs — no
  // more "you're between two valid sizes" friction, since the count is
  // locked in from the start. null = no tier chosen yet, dropdown stays
  // closed/disabled.
  const [tier, setTier] = useState(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [search, setSearch] = useState('')

  const selectableList = pdfs
    .filter(p => !p.is_owned && !p.is_free)
    .filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.title.localeCompare(b.title))

  const atCapacity = tier !== null && count >= tier

  const handleTierChange = (newTier) => {
    setTier(newTier)
    onResetSelection()
    setDropdownOpen(true)
  }

  const handleItemClick = (pdf) => {
    const alreadySelected = selected.has(pdf.id)
    // Once at capacity, only allow un-selecting — never silently ignore a
    // click, since a click that visibly does nothing reads as broken.
    if (!alreadySelected && atCapacity) return
    onToggleSelect(pdf)
  }

  return (
    <div className="bundle-panel">
      <div className="bundle-panel-head">
        <div style={{ fontFamily:'var(--font-serif)', fontSize:16, color:'var(--black)', marginBottom:14 }}>Build your bundle</div>

        {/* Step 1 — pick a size. Plain buttons, not a dropdown itself, so
            all six options are visible at once with no extra click. */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {TIER_SIZES.map(t => (
            <button
              key={t}
              onClick={() => handleTierChange(t)}
              style={{
                fontFamily:'var(--font-sans)', fontSize:12.5, fontWeight:600, padding:'7px 13px',
                borderRadius:20, cursor:'pointer',
                border: tier === t ? '2px solid var(--red)' : '1.5px solid var(--g300)',
                background: tier === t ? 'var(--red)' : '#fff',
                color: tier === t ? '#fff' : 'var(--g700)',
              }}
            >
              Buy {t} — ₹{BUNDLE_TIERS[t]}/PDF
            </button>
          ))}
        </div>
      </div>

      {/* Step 2 — only appears once a size is picked. A closed dropdown
          rather than the list sitting permanently open, since with 50
          real items an always-open list is exactly the clutter GS asked
          to avoid — this keeps the panel short until you actually want
          to browse and pick. */}
      {tier !== null && (
        <div style={{ padding:'14px 20px', borderTop:'var(--border)' }}>
          <button
            onClick={() => setDropdownOpen(v => !v)}
            style={{
              width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
              fontFamily:'var(--font-sans)', fontSize:13, padding:'10px 14px', cursor:'pointer',
              border:'var(--border)', borderRadius:'var(--radius)', background: dropdownOpen ? 'var(--off)' : '#fff',
              color:'var(--black)',
            }}
          >
            <span>{count === 0 ? `Choose ${tier} PDF${tier !== 1 ? 's' : ''}` : `${count} of ${tier} selected`}</span>
            <span style={{ color:'var(--g500)', transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition:'transform .15s' }}>▾</span>
          </button>

          {dropdownOpen && (
            <div style={{ border:'var(--border)', borderTop:'none', borderRadius:'0 0 var(--radius) var(--radius)', maxHeight:320, display:'flex', flexDirection:'column' }}>
              <div style={{ padding:'10px 14px', borderBottom:'var(--border)' }}>
                <input
                  type="text"
                  placeholder="Search topics…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ width:'100%', padding:'8px 10px', fontFamily:'var(--font-sans)', fontSize:13, border:'var(--border)', borderRadius:'var(--radius)', outline:'none' }}
                />
              </div>
              <div style={{ overflowY:'auto', flex:1 }}>
                {selectableList.length === 0 ? (
                  <p style={{ padding:'16px', fontFamily:'var(--font-sans)', fontSize:13, color:'var(--g500)' }}>
                    {search ? 'No topics match your search.' : 'Everything here is already free or owned.'}
                  </p>
                ) : (
                  selectableList.map(pdf => {
                    const isSelected = selected.has(pdf.id)
                    const disabled = !isSelected && atCapacity
                    return (
                      <label
                        key={pdf.id}
                        className="bundle-panel-item"
                        style={{ opacity: disabled ? 0.4 : 1, cursor: disabled ? 'default' : 'pointer' }}
                        onClick={(e) => { e.preventDefault(); handleItemClick(pdf) }}
                      >
                        <input type="checkbox" checked={isSelected} readOnly disabled={disabled} style={{ width:17, height:17, flexShrink:0, accentColor:'var(--red)' }} />
                        <span style={{ fontFamily:'var(--font-sans)', fontSize:13.5, color:'var(--black)', lineHeight:1.4 }}>{pdf.title}</span>
                      </label>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bundle-panel-foot">
        {tier === null ? (
          <p style={{ fontFamily:'var(--font-sans)', fontSize:12.5, color:'var(--g500)' }}>Pick a bundle size above to get started.</p>
        ) : (
          <>
            <div style={{ fontFamily:'var(--font-sans)', fontSize:13, color:'var(--g700)', marginBottom:6 }}>
              {count} of {tier} selected
            </div>
            <div style={{ fontFamily:'var(--font-serif)', fontSize:22, color:'var(--black)', marginBottom:12 }}>
              ₹{total ? total.toLocaleString('en-IN') : (rate * tier).toLocaleString('en-IN')} <span style={{ fontSize:12, fontFamily:'var(--font-sans)', color:'var(--g500)', fontWeight:400 }}>(₹{rate ?? BUNDLE_TIERS[tier]}/PDF)</span>
            </div>
            {checkoutState === 'error' && (
              <div style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'var(--red)', marginBottom:10 }}>{checkoutError}</div>
            )}
            <button
              onClick={onCheckout}
              disabled={count !== tier || checkoutState === 'loading'}
              style={{
                width:'100%', fontFamily:'var(--font-sans)', fontSize:14, fontWeight:700, padding:'12px 20px',
                borderRadius:'var(--radius)', border:'none', cursor: count === tier ? 'pointer' : 'not-allowed',
                background: count === tier ? 'var(--red)' : 'var(--g300)', color:'#fff',
              }}
            >
              {checkoutState === 'loading' ? 'Preparing checkout…' : `Buy ${tier} PDFs →`}
            </button>
          </>
        )}
      </div>
    </div>
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
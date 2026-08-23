/**
 * GRADSKOOL — PDF Bundle Checkout
 * Route: /checkout/pdfs?exam=<examSlug>
 *
 * A real, standalone checkout page for FYQ PDF bundles — replaces the
 * in-page right-hand panel that used to live on /pdfs/exam/[examSlug].
 * Every entry point (the FYQ library page's "Buy in bulk" button, an
 * individual PDF detail page's "Buy in bulk" link, and an individual
 * FYQ question page) now sends people here instead of duplicating the
 * tier/selection/checkout logic in three different places.
 *
 * ?exam=cat scopes the PDF list to that exam's FYQs (matches the real
 * backend restriction — fyq_category=True PDFs only, see apps.pdfs.
 * services.create_pdf_bundle_order). Without ?exam=, defaults to 'cat'
 * since that's the only exam with a confirmed-real FYQ library today —
 * update this default if/when other exams get their own FYQ PDFs.
 */
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { usePdfList, useCreatePdfBundleOrder, useVerifyPdfPayment, useRazorpay } from '../../hooks/usePdfs'
import { useAuth } from '../../hooks/useAuth'

// Mirrors backend apps.pdfs.models.BUNDLE_TIERS exactly. Kept in sync
// manually — the real charge is always calculated server-side regardless
// of what this shows.
const BUNDLE_TIERS = { 1: 29, 10: 25, 20: 21, 30: 17, 40: 13, 50: 9 }
const TIER_SIZES = Object.keys(BUNDLE_TIERS).map(Number).sort((a, b) => a - b)

export default function PdfBundleCheckout() {
  const router = useRouter()
  const examSlug = (router.query.exam || 'cat').toString()

  const { pdfs, isLoading } = usePdfList(examSlug, true, { enabled: router.isReady })
  const { isLoggedIn, user } = useAuth()

  const [tier, setTier] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const [search, setSearch] = useState('')
  const [checkoutState, setCheckoutState] = useState('idle')
  const [checkoutError, setCheckoutError] = useState('')

  const { createBundleOrder } = useCreatePdfBundleOrder()
  const { verify } = useVerifyPdfPayment()
  const { loadRazorpay } = useRazorpay()

  const toggleSelect = (pdf) => {
    if (pdf.is_owned) return
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(pdf.id)) next.delete(pdf.id)
      else next.add(pdf.id)
      return next
    })
  }

  const count = selected.size
  const rate = tier ? BUNDLE_TIERS[tier] : undefined
  const total = rate ? rate * count : null
  const atCapacity = tier !== null && count >= tier

  const handleTierChange = (newTier) => {
    setTier(newTier)
    setSelected(new Set())
  }

  const handleItemClick = (pdf) => {
    const alreadySelected = selected.has(pdf.id)
    if (!alreadySelected && atCapacity) return
    toggleSelect(pdf)
  }

  const selectableList = pdfs
    .filter(p => !p.is_owned && !p.is_free)
    .filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.title.localeCompare(b.title))

  const startBundleCheckout = async () => {
    if (!isLoggedIn) {
      router.push(`/auth/login?redirect=${encodeURIComponent(router.asPath)}`)
      return
    }
    if (count !== tier) return

    const phone = user?.phone
    if (!phone) {
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
        setTier(null)
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
      <Head>
        <title>Buy FYQ PDFs in Bulk — GRADSKOOL</title>
        <meta name="robots" content="noindex" />
      </Head>

      <style>{`
        .bco-wrap { max-width: 760px; margin: 0 auto; padding: 56px 24px 96px; }
        .bco-back { font-family:var(--font-sans); font-size:12px; color:var(--g500); text-decoration:none; }
        .bco-h1 { font-family:var(--font-serif); font-size:clamp(26px,3.5vw,34px); font-weight:400; color:var(--black); margin:14px 0 8px; }
        .bco-sub { font-family:var(--font-sans); font-size:14px; color:var(--g700); margin-bottom:32px; }
        .bco-tier-row { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:24px; }
        .bco-tier-btn { font-family:var(--font-sans); font-size:13px; font-weight:600; padding:10px 18px; border-radius:24px; cursor:pointer; border:1.5px solid var(--g300); background:#fff; color:var(--g700); }
        .bco-tier-btn.active { border:2px solid var(--red); background:var(--red); color:#fff; }
        .bco-box { border:var(--border); border-radius:var(--radius); background:#fff; }
        .bco-search { padding:14px 18px; border-bottom:var(--border); }
        .bco-search input { width:100%; padding:10px 12px; font-family:var(--font-sans); font-size:14px; border:var(--border); border-radius:var(--radius); outline:none; }
        .bco-list { max-height:420px; overflow-y:auto; }
        .bco-item { display:flex; align-items:center; gap:12px; padding:13px 18px; cursor:pointer; border-bottom:1px solid var(--g100); }
        .bco-item:last-child { border-bottom:none; }
        .bco-item:hover { background:var(--off); }
        .bco-summary { position:sticky; bottom:0; margin-top:24px; padding:20px 24px; background:var(--off); border:var(--border); border-radius:var(--radius); display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px; }
      `}</style>

      <div className="bco-wrap">
        <Link href={`/pdfs/exam/${examSlug}-fyqs`} className="bco-back">← Back to {examSlug.toUpperCase()} FYQ Library</Link>
        <h1 className="bco-h1">Buy FYQ PDFs in bulk</h1>
        <p className="bco-sub">Pick a bundle size, then choose exactly that many topics. The more you buy, the less each PDF costs.</p>

        <div className="bco-tier-row">
          {TIER_SIZES.map(t => (
            <button key={t} className={`bco-tier-btn${tier === t ? ' active' : ''}`} onClick={() => handleTierChange(t)}>
              Buy {t} — ₹{BUNDLE_TIERS[t]}/PDF
            </button>
          ))}
        </div>

        {tier !== null && (
          <div className="bco-box">
            <div className="bco-search">
              <input type="text" placeholder="Search topics…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="bco-list">
              {isLoading ? (
                <p style={{ padding:20, fontFamily:'var(--font-sans)', fontSize:13, color:'var(--g500)' }}>Loading PDFs…</p>
              ) : selectableList.length === 0 ? (
                <p style={{ padding:20, fontFamily:'var(--font-sans)', fontSize:13, color:'var(--g500)' }}>
                  {search ? 'No topics match your search.' : 'Nothing available to bundle right now.'}
                </p>
              ) : (
                selectableList.map(pdf => {
                  const isSelected = selected.has(pdf.id)
                  const disabled = !isSelected && atCapacity
                  return (
                    <label key={pdf.id} className="bco-item" style={{ opacity: disabled ? 0.4 : 1, cursor: disabled ? 'default' : 'pointer' }}
                      onClick={(e) => { e.preventDefault(); handleItemClick(pdf) }}>
                      <input type="checkbox" checked={isSelected} readOnly disabled={disabled} style={{ width:18, height:18, flexShrink:0, accentColor:'var(--red)' }} />
                      <span style={{ fontFamily:'var(--font-sans)', fontSize:14, color:'var(--black)' }}>{pdf.title}</span>
                    </label>
                  )
                })
              )}
            </div>
          </div>
        )}

        {tier !== null && (
          <div className="bco-summary">
            <div>
              <div style={{ fontFamily:'var(--font-sans)', fontSize:13, color:'var(--g700)', marginBottom:4 }}>{count} of {tier} selected</div>
              <div style={{ fontFamily:'var(--font-serif)', fontSize:24, color:'var(--black)' }}>
                ₹{(total ?? rate * tier).toLocaleString('en-IN')} <span style={{ fontSize:12, fontFamily:'var(--font-sans)', color:'var(--g500)', fontWeight:400 }}>(₹{rate}/PDF)</span>
              </div>
              {checkoutState === 'error' && (
                <div style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'var(--red)', marginTop:6 }}>{checkoutError}</div>
              )}
            </div>
            <button
              onClick={startBundleCheckout}
              disabled={count !== tier || checkoutState === 'loading'}
              style={{
                fontFamily:'var(--font-sans)', fontSize:14, fontWeight:700, padding:'14px 32px',
                borderRadius:'var(--radius)', border:'none', cursor: count === tier ? 'pointer' : 'not-allowed',
                background: count === tier ? 'var(--red)' : 'var(--g300)', color:'#fff',
              }}
            >
              {checkoutState === 'loading' ? 'Preparing checkout…' : `Buy ${tier} PDFs →`}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
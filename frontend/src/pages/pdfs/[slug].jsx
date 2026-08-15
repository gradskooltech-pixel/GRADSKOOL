/**
 * GRADSKOOL — PDF Detail / Purchase Page
 * Route: /pdfs/[slug]
 */
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import PageSEO from '../../components/seo/PageSEO'
import { usePdfDetail, useCreatePdfOrder, useVerifyPdfPayment, useRazorpay, useClaimFreePdf } from '../../hooks/usePdfs'
import { useAuth } from '../../hooks/useAuth'

// Matches the shape of courseSchema/faqSchema etc. in components/seo/PageSEO —
// gives each PDF's own page a shot at rich-result eligibility (price, free/paid,
// in-stock), the same way course pages already do.
function pdfSchema(pdf) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: pdf.title,
    description: pdf.description || `${pdf.title} — GRADSKOOL PDF Library`,
    ...(pdf.cover_image_url ? { image: pdf.cover_image_url } : {}),
    brand: { '@type': 'Brand', name: 'GRADSKOOL' },
    offers: {
      '@type': 'Offer',
      price: pdf.is_free ? '0' : String(pdf.price_inr),
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url: `https://gradskool.in/pdfs/${pdf.slug}`,
    },
  }
}

export default function PdfDetailPage() {
  const router = useRouter()
  const { slug } = router.query
  const { pdf, isLoading, notFound } = usePdfDetail(slug)
  const { isLoggedIn, user, isLoading: authLoading } = useAuth()
  const { loadRazorpay } = useRazorpay()
  const { createOrder } = useCreatePdfOrder()
  const { verify } = useVerifyPdfPayment()
  const { claim, isLoading: claiming } = useClaimFreePdf()

  const [state, setState] = useState('idle') // idle | loading | error
  const [error, setError] = useState('')
  const [phone, setPhone] = useState('')
  const [showPhoneForm, setShowPhoneForm] = useState(false)
  const [pendingAction, setPendingAction] = useState(null) // 'buy' | 'claim' — which flow the phone form continues

  const handleBuy = () => {
    if (!isLoggedIn) {
      router.push(`/auth/login?redirect=${encodeURIComponent(`/pdfs/${slug}`)}`)
      return
    }
    // Same phone requirement as free-PDF claims — captured up front rather
    // than left to Razorpay's own checkout form, which often skips it.
    if (user?.phone) {
      proceedToPurchase(user.phone)
    } else {
      setPendingAction('buy')
      setShowPhoneForm(true)
    }
  }

  const proceedToPurchase = async (phoneValue) => {
    setState('loading')
    setError('')

    const orderResult = await createOrder(slug, phoneValue)
    if (!orderResult.success) {
      setState('error')
      setError(orderResult.error)
      return
    }

    let Razorpay
    try {
      Razorpay = await loadRazorpay()
    } catch {
      setState('error')
      setError('Payment gateway unavailable. Please try again.')
      return
    }

    const rzp = new Razorpay({
      ...orderResult.data,
      prefill: {
        contact: phoneValue || user?.phone || '',
        email: user?.email || '',
        name: [user?.first_name, user?.last_name].filter(Boolean).join(' '),
      },
      handler: async (response) => {
        await verify(response)
        setState('idle')
        router.push(`/pdfs/${slug}/read?purchased=1`)
      },
      modal: { ondismiss: () => setState('idle') },
    })

    rzp.on('payment.failed', (response) => {
      setState('error')
      setError(response.error?.description || 'Payment failed. Please try again.')
    })

    rzp.open()
  }

  // Free PDFs still need login (page redirects below handle that) AND a
  // phone number — this is the one place that captures it.
  const startClaim = () => {
    if (!isLoggedIn) {
      router.push(`/auth/login?redirect=${encodeURIComponent(`/pdfs/${slug}`)}`)
      return
    }
    if (user?.phone) {
      handleClaim(user.phone)
    } else {
      setPendingAction('claim')
      setShowPhoneForm(true)
    }
  }

  const handleClaim = async (phoneValue) => {
    setState('loading')
    setError('')
    const result = await claim(slug, phoneValue)
    if (!result.success) {
      setState('error')
      setError(result.error)
      return
    }
    setState('idle')
    router.push(`/pdfs/${slug}/read?claimed=1`)
  }

  // The phone form is shared between both flows — routes to whichever one
  // triggered it (set in startClaim/handleBuy above).
  const handlePhoneConfirm = () => {
    if (pendingAction === 'buy') proceedToPurchase(phone)
    else handleClaim(phone)
  }

  if (isLoading || authLoading) return <div style={styles.loadingPage}>Loading…</div>
  if (notFound || !pdf) {
    return isLoggedIn ? <NotFoundState /> : <LoginPromptState slug={slug} />
  }

  const isFree = pdf.is_free
  const owned = pdf.is_owned

  return (
    <>
      <PageSEO
        title={`${pdf.title} — GRADSKOOL PDF Library`}
        description={pdf.description || `Read ${pdf.title} directly in your GRADSKOOL account.`}
        canonical={`/pdfs/${pdf.slug}`}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'PDF Library', url: '/pdfs' },
          { name: pdf.title, url: `/pdfs/${pdf.slug}` },
        ]}
        schema={[pdfSchema(pdf)]}
      />

      <style>{`
        .pdfd-wrap { max-width:1000px; margin:0 auto; padding:56px 40px 96px; display:grid; grid-template-columns:280px 1fr; gap:56px; }
        @media(max-width:760px){ .pdfd-wrap{ grid-template-columns:1fr; padding:40px 24px 64px; gap:32px; } }
        .pdfd-cover { width:100%; aspect-ratio:3/4; background:var(--off) center/cover no-repeat; border:var(--border); border-radius:var(--radius); }
        .pdfd-back { font-family:var(--font-sans); font-size:12px; color:var(--g500); text-decoration:none; display:inline-block; margin-bottom:20px; }
        .pdfd-back:hover { color:var(--black); }
        .pdfd-eyebrow { font-family:var(--font-sans); font-size:11px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:var(--red); margin-bottom:10px; }
        .pdfd-title { font-family:var(--font-serif); font-size:clamp(28px,4vw,38px); font-weight:400; color:var(--black); line-height:1.2; margin-bottom:16px; }
        .pdfd-desc { font-family:var(--font-body); font-size:15px; color:var(--g700); line-height:1.7; margin-bottom:24px; white-space:pre-line; }
        .pdfd-meta-row { display:flex; gap:20px; margin-bottom:28px; }
        .pdfd-meta-item { font-family:var(--font-sans); font-size:12px; color:var(--g500); }
        .pdfd-meta-item b { color:var(--black); }
        .pdfd-cta { display:flex; align-items:center; gap:16px; padding:20px; border:var(--border); border-radius:var(--radius); background:var(--off); }
        .pdfd-price { font-family:var(--font-serif); font-size:26px; color:var(--black); }
        .pdfd-price.free { color:var(--red); }
        .pdfd-btn { font-family:var(--font-sans); font-size:14px; font-weight:600; padding:12px 26px; border-radius:var(--radius); border:2px solid var(--red); background:var(--red); color:#fff; cursor:pointer; transition:opacity var(--t); text-decoration:none; display:inline-block; }
        .pdfd-btn:hover { opacity:.9; }
        .pdfd-btn[disabled] { opacity:.6; cursor:not-allowed; }
        .pdfd-error { font-family:var(--font-sans); font-size:13px; color:#b3261e; margin-top:10px; }
        .pdfd-phone-box { margin-top:16px; padding:16px 18px; border:var(--border); border-radius:var(--radius); background:#fff; }
        .pdfd-phone-label { font-family:var(--font-sans); font-size:13px; color:var(--g700); margin-bottom:10px; }
        .pdfd-phone-row { display:flex; gap:10px; }
        .pdfd-phone-input { flex:1; font-family:var(--font-sans); font-size:14px; padding:10px 14px; border:1px solid var(--g300); border-radius:var(--radius); color:var(--black); }
        .pdfd-phone-input:focus { outline:none; border-color:var(--red); }
      `}</style>

      <div className="pdfd-wrap">
        <div>
          <div
            className="pdfd-cover"
            style={pdf.cover_image_url ? { backgroundImage: `url(${pdf.cover_image_url})` } : undefined}
          />
        </div>

        <div>
          <Link href="/pdfs" className="pdfd-back">← Back to PDF Library</Link>
          <p className="pdfd-eyebrow">{pdf.exam_slug ? pdf.exam_slug.toUpperCase() : 'Study Material'}</p>
          <h1 className="pdfd-title">{pdf.title}</h1>
          {pdf.description && <p className="pdfd-desc">{pdf.description}</p>}

          <div className="pdfd-meta-row">
            <span className="pdfd-meta-item"><b>{pdf.page_count || '—'}</b> pages</span>
            <span className="pdfd-meta-item">Read in-browser · No downloads</span>
          </div>

          <div className="pdfd-cta">
            <span className={`pdfd-price${isFree ? ' free' : ''}`}>
              {isFree ? 'Free' : `₹${Number(pdf.price_inr).toLocaleString('en-IN')}`}
            </span>

            {owned ? (
              <Link href={`/pdfs/${pdf.slug}/read`} className="pdfd-btn">Start Reading →</Link>
            ) : isFree ? (
              <button className="pdfd-btn" onClick={startClaim} disabled={state === 'loading'}>
                {state === 'loading' ? 'Processing…' : 'Get Free PDF →'}
              </button>
            ) : (
              <button className="pdfd-btn" onClick={handleBuy} disabled={state === 'loading'}>
                {state === 'loading' ? 'Processing…' : 'Buy & Read →'}
              </button>
            )}
          </div>
          {state === 'error' && error && <p className="pdfd-error">{error}</p>}

          {showPhoneForm && (
            <div className="pdfd-phone-box">
              <p className="pdfd-phone-label">
                {pendingAction === 'buy'
                  ? "One quick thing — we need a phone number before checkout, in case we need to reach you about your order."
                  : `One quick thing — we'll text you when new ${pdf.exam_slug ? pdf.exam_slug.toUpperCase() : ''} PDFs drop.`}
              </p>
              <div className="pdfd-phone-row">
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="10-digit phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, '').slice(0, 10))}
                  className="pdfd-phone-input"
                  disabled={claiming || state === 'loading'}
                />
                <button
                  className="pdfd-btn"
                  onClick={handlePhoneConfirm}
                  disabled={phone.length < 10 || claiming || state === 'loading'}
                >
                  {claiming || state === 'loading' ? (pendingAction === 'buy' ? 'Processing…' : 'Claiming…') : 'Confirm →'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function NotFoundState() {
  return (
    <div style={styles.loadingPage}>
      <p style={{ fontFamily: 'var(--font-serif)', fontSize: 22, marginBottom: 12 }}>PDF not found</p>
      <Link href="/pdfs" style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--red)' }}>
        ← Back to PDF Library
      </Link>
    </div>
  )
}

function LoginPromptState({ slug }) {
  return (
    <div style={styles.loadingPage}>
      <p style={{ fontFamily: 'var(--font-serif)', fontSize: 22, marginBottom: 12 }}>Log in to view this PDF</p>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--g500)', marginBottom: 20, maxWidth: 320 }}>
        Create a free account or log in to see this page.
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <Link href={`/auth/login?redirect=${encodeURIComponent(`/pdfs/${slug}`)}`}
          style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, background: 'var(--red)', color: '#fff', padding: '10px 20px', borderRadius: 2, textDecoration: 'none' }}>
          Log in
        </Link>
        <Link href={`/auth/register?redirect=${encodeURIComponent(`/pdfs/${slug}`)}`}
          style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, border: '1px solid var(--g200)', color: 'var(--black)', padding: '10px 20px', borderRadius: 2, textDecoration: 'none' }}>
          Create account
        </Link>
      </div>
    </div>
  )
}

const styles = {
  loadingPage: {
    minHeight: '50vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', textAlign: 'center',
    fontFamily: 'var(--font-body)', color: 'var(--g500)',
  },
}
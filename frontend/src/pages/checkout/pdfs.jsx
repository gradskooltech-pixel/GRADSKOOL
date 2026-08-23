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
import PageSEO, { faqSchema } from '../../components/seo/PageSEO'
import { usePdfList, useCreatePdfBundleOrder, useVerifyPdfPayment, useRazorpay } from '../../hooks/usePdfs'
import { useAuth } from '../../hooks/useAuth'

// Mirrors backend apps.pdfs.models.BUNDLE_TIERS exactly. Kept in sync
// manually — the real charge is always calculated server-side regardless
// of what this shows.
// Mirrors backend apps.pdfs.models.BUNDLE_TIERS exactly. 34 is the real
// ceiling — the CAT Quant FYQ library has exactly 34 topics total, so
// "Buy 34" means "buy everything." Its rate (₹15) is the straight -₹2/5
// continuation from 30, which does make its total identical to the
// 30-tier's total (both ₹510) — confirmed with GS as an accepted
// consequence of applying the rule uniformly, not a bug.
// Mirrors backend apps.pdfs.models.BUNDLE_TIERS exactly. 34 is the real
// ceiling — the CAT Quant FYQ library has exactly 34 topics total, so
// "Buy 34" means "buy everything." Its rate (₹15) is the straight -₹2/5
// continuation from 30, which does make its total identical to the
// 30-tier's total (both ₹510) — confirmed with GS as an accepted
// consequence of applying the rule uniformly, not a bug.
const BUNDLE_TIERS = { 1: 29, 5: 27, 10: 25, 15: 23, 20: 21, 25: 19, 30: 17, 34: 15 }

// Real CAT Quant category groupings — matches GS's own actual topic tool
// exactly (Number System, Algebra, Arithmetic, Geometry, PnC &
// Probability), same source as apps.pdfs.management.commands.
// seed_upcoming_quant_pdfs's QUANT_TOPICS. Matched against each PDF's
// title with the " — CAT FYQs" suffix stripped, since that's the real,
// consistent naming pattern the seed command uses. A topic that doesn't
// match anything here (shouldn't happen for real CAT Quant PDFs, but a
// genuinely different exam's FYQ PDF could show up if ?exam= is ever
// something other than cat) falls into a plain "Other" group rather than
// being silently dropped.
const TOPIC_CATEGORIES = [
  { name: 'Arithmetic', topics: ['Averages', 'Mixture & Alligations', 'Percentages', 'Profit, Loss & Discount', 'Ratio & Proportion', 'Simple & Compound Interest', 'Time & Work', 'Time, Speed & Distance'] },
  { name: 'Algebra', topics: ['Diophantine Equations', 'Functions', 'Inequalities', 'Linear Equations', 'Logarithms', 'Maxima and Minima', 'Modulus', 'Polynomials', 'Quadratic Equations', 'Sequences and Series', 'Surds & Indices'] },
  { name: 'Number System', topics: ['Base System', 'Classification of Numbers', 'Divisibility Rules', 'Factors and Multiples', 'HCF and LCM', 'Remainders'] },
  { name: 'Geometry', topics: ['Circles', 'Coordinate Geometry', 'Lines and Angles', 'Mensuration', 'Polygons', 'Quadrilaterals', 'Triangles'] },
  { name: 'PnC & Probability', topics: ['Permutation and Combination', 'Probability'] },
]

function topicCategoryFor(pdfTitle) {
  // Matches both the em-dash the seed command uses ("Time and Work —
  // CAT FYQs") AND a plain hyphen — the one real, pre-existing PDF
  // (Percentages) genuinely uses "Percentages - CAT FYQs" with a regular
  // hyphen, not an em-dash. Confirmed by testing this function against
  // all 34 real titles directly before shipping — the em-dash-only
  // version silently mismatched Percentages into "Other."
  const bare = pdfTitle.replace(/\s*[-—]\s*CAT FYQs\s*$/i, '').trim()
  const found = TOPIC_CATEGORIES.find(cat => cat.topics.includes(bare))
  return found ? found.name : 'Other'
}
const TIER_SIZES = Object.keys(BUNDLE_TIERS).map(Number).sort((a, b) => a - b)

// Real Q&A content, not filler — the exact shape AI answer engines
// (ChatGPT, Perplexity, Google AI Overviews) most reliably pull from and
// cite directly, which is what GS meant by AEO/GEO here specifically.
const FAQS = [
  { q: 'What are FYQ PDFs?', a: 'FYQ stands for Future Year Question — GRADSKOOL\'s own topic-wise practice sets for CAT, solved and explained by ALP Sir, going beyond what\'s available in official past papers.' },
  { q: 'How does bundle pricing work?', a: 'Each PDF costs ₹29 on its own. The price per PDF drops by ₹2 for every 5 PDFs in your bundle — down to ₹15/PDF for all 34 CAT Quant FYQ topics.' },
  { q: 'Can I pick which topics I want?', a: 'Yes. After choosing a bundle size, you select exactly that many topics from the full FYQ library — Percentages, Ratios, Time & Work, and more.' },
  { q: 'Do I get access immediately after payment?', a: 'Yes. Once payment is confirmed, every selected PDF becomes available to read in your GRADSKOOL account right away.' },
]

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
    // Selecting the top tier (34 — genuinely all real CAT Quant FYQ
    // topics that exist) skips the "which ones do you want" step
    // entirely and auto-selects every eligible PDF. Asking someone to
    // manually check 34 boxes when the only valid answer is "all of
    // them" is pointless friction — confirmed with GS this is exactly
    // the intent.
    if (newTier === Math.max(...TIER_SIZES)) {
      const allEligible = pdfs.filter(p => !p.is_owned && !p.is_free).map(p => p.id)
      setSelected(new Set(allEligible))
    } else {
      setSelected(new Set())
    }
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

  // Grouped by real CAT Quant category (Number System, Algebra, etc.) —
  // TOPIC_CATEGORIES' own order preserved (not alphabetical by group
  // name), matching the order GS's real topic tool itself uses. Empty
  // groups (e.g. every topic in a category already owned, or filtered
  // out by search) are skipped entirely rather than shown as empty
  // headers.
  const groupedList = [...TOPIC_CATEGORIES.map(c => c.name), 'Other']
    .map(catName => ({
      name: catName,
      items: selectableList.filter(pdf => topicCategoryFor(pdf.title) === catName),
    }))
    .filter(group => group.items.length > 0)

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
      <PageSEO
        title="Buy CAT FYQ PDFs in Bulk — Save up to 69% | GRADSKOOL"
        description="Buy GRADSKOOL's CAT Future Year Question (FYQ) PDFs in bulk. Prices drop from ₹29 to ₹15 per PDF as bundle size increases, up to all 34 CAT Quant FYQ topics."
        canonical={`https://gradskool.in/checkout/pdfs?exam=${examSlug}`}
        breadcrumbs={[{ name:'Home', url:'/' }, { name:'FYQ Library', url:`/pdfs/exam/${examSlug}-fyqs` }, { name:'Buy in Bulk', url:`/checkout/pdfs?exam=${examSlug}` }]}
        schema={[faqSchema(FAQS)]}
        speakableSelectors={['h1', '.bco-sub', '.bco-content']}
      />

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
        .bco-content { margin-top:56px; padding-top:40px; border-top:var(--border); }
        .bco-content h2 { font-family:var(--font-serif); font-size:20px; font-weight:400; color:var(--black); margin-bottom:14px; }
        .bco-content p { font-family:var(--font-sans); font-size:14px; color:var(--g700); line-height:1.75; margin-bottom:16px; }
        .bco-features { display:grid; grid-template-columns:1fr 1fr; gap:10px 24px; margin:16px 0 32px; list-style:none; padding:0; }
        .bco-features li { font-family:var(--font-sans); font-size:13.5px; color:var(--g700); display:flex; gap:8px; align-items:flex-start; }
        .bco-features li::before { content:'✓'; color:var(--red); flex-shrink:0; font-weight:700; }
        .bco-faq-item { border-bottom:var(--border); padding:16px 0; }
        .bco-faq-item h3 { font-family:var(--font-serif); font-size:15px; font-weight:400; color:var(--black); margin-bottom:6px; }
        @media(max-width:600px){ .bco-features{grid-template-columns:1fr} }
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
            {/* When the top tier (34 = everything) is selected, this
                confirms it up front — no need to scroll through 34
                checked rows just to verify nothing's wrong. Genuinely
                helps once all 34 real topics exist (currently only 1 —
                seed_upcoming_quant_pdfs hasn't been run in production
                yet), not just a cosmetic addition. */}
            {tier === Math.max(...TIER_SIZES) && (
              <div style={{ padding:'14px 18px', background:'#f0f9f4', borderBottom:'var(--border)', fontFamily:'var(--font-sans)', fontSize:13, color:'#166534', fontWeight:600 }}>
                ✓ All {tier} CAT Quant FYQ topics selected — nothing more to choose.
              </div>
            )}
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
                groupedList.map(group => (
                  <div key={group.name}>
                    {/* Sticky within the scrollable list so the category
                        stays visible while scrolling through its items —
                        matters once a group has 8+ topics (Algebra,
                        Arithmetic) and you've scrolled past the header. */}
                    <div style={{ position:'sticky', top:0, zIndex:1, padding:'10px 18px', background:'var(--off)', borderBottom:'1px solid var(--g100)', fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase', color:'var(--g500)' }}>
                      {group.name} <span style={{ fontWeight:400, textTransform:'none', letterSpacing:'normal' }}>({group.items.length})</span>
                    </div>
                    {group.items.map(pdf => {
                      const isSelected = selected.has(pdf.id)
                      const disabled = !isSelected && atCapacity
                      return (
                        <label key={pdf.id} className="bco-item" style={{ opacity: disabled ? 0.4 : 1, cursor: disabled ? 'default' : 'pointer' }}
                          onClick={(e) => { e.preventDefault(); handleItemClick(pdf) }}>
                          <input type="checkbox" checked={isSelected} readOnly disabled={disabled} style={{ width:18, height:18, flexShrink:0, accentColor:'var(--red)' }} />
                          <span style={{ fontFamily:'var(--font-sans)', fontSize:14, color:'var(--black)' }}>
                            {pdf.title}
                            {pdf.is_upcoming && (
                              <span style={{ marginLeft:8, fontSize:10, fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', color:'#8a8a85', border:'1px solid #d4d4d1', borderRadius:3, padding:'2px 6px' }}>
                                Upcoming
                              </span>
                            )}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                ))
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

        <div className="bco-content">
          <h2>What's in the CAT FYQ Library</h2>
          <p>
            GRADSKOOL's Future Year Question (FYQ) PDFs are topic-wise CAT practice sets, each solved
            and explained step by step by ALP Sir. Every PDF covers one specific topic in depth — the
            kind of focused practice that's hard to find in generic mock-test bundles.
          </p>
          <ul className="bco-features">
            <li>Topic-wise, not exam-wise — practice exactly what you're weak on</li>
            <li>Every question solved and explained by ALP Sir</li>
            <li>Read directly in your GRADSKOOL account, no downloads needed</li>
            <li>Cheaper per PDF the larger your bundle — down to ₹15/PDF for all 34</li>
            <li>Instant access the moment payment is confirmed</li>
            <li>Same content used inside GRADSKOOL's live cohorts</li>
          </ul>

          <h2>Frequently Asked Questions</h2>
          {FAQS.map(faq => (
            <div key={faq.q} className="bco-faq-item">
              <h3>{faq.q}</h3>
              <p style={{ marginBottom:0 }}>{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
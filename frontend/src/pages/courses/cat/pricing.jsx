/**
 * GRADSKOOL — CAT Pricing Page
 * Route: /courses/cat/pricing
 *
 * CAT has two products (CATalysis full cohort, CAThlete crash course),
 * both currently woven inline throughout /courses/cat rather than shown
 * as a single standalone comparison anywhere. This page consolidates
 * both into one place — same data source, same fallback pattern as the
 * main CAT page, so it can never show different numbers.
 */
import Head from 'next/head'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
const R = { color: 'var(--red)' }

// Same fallback pattern as /courses/cat — see that file's comment for why:
// CAThlete has no Course/PricingPlan record yet, so these hold until admin
// data exists, then this page switches over automatically, no code change.
const FALLBACK = {
  examDate: '2026-11-29',
  catalysisPrice: 17999,
  cathleteBasePrice: 6999,
  cathleteMocksPrice: 9999,
}

function fmtPrice(n) {
  return `₹${Number(n).toLocaleString('en-IN')}`
}

export async function getStaticProps() {
  try {
    const res = await fetch(`${API}/courses/exams/cat/`)
    const examData = res.ok ? await res.json() : null
    return { props: { examData }, revalidate: 300 }
  } catch {
    return { props: { examData: null }, revalidate: 60 }
  }
}

export default function CatPricingPage({ examData }) {
  const plans = examData?.plans || []
  const catalysisPlan = plans.find(p => p.slug === 'live-cat-mocks')
  const cathleteBase  = plans.find(p => p.slug === 'cathlete-no-mocks')
  const cathleteMocks = plans.find(p => p.slug === 'cathlete-with-mocks')

  const catalysisPrice     = catalysisPlan?.price_inr ? Number(catalysisPlan.price_inr) : FALLBACK.catalysisPrice
  const cathleteBasePrice  = cathleteBase?.price_inr  ? Number(cathleteBase.price_inr)  : FALLBACK.cathleteBasePrice
  const cathleteMocksPrice = cathleteMocks?.price_inr ? Number(cathleteMocks.price_inr) : FALLBACK.cathleteMocksPrice

  const examYear = new Date(examData?.exam_date || FALLBACK.examDate).getFullYear()
  const catalysisYear = examYear + 1

  const ADDONS = [
    { name:'CATalysis + OMETs Mocks', price: fmtPrice(catalysisPrice + 1499), strike: fmtPrice(catalysisPrice + 1999), save:'Save ₹500' },
    { name:'CATalysis + XAT Course',  price: fmtPrice(catalysisPrice + 5499), strike: fmtPrice(catalysisPrice + 5999), save:'Save ₹500' },
    { name:'CATalysis + SNAP Mocks',  price: fmtPrice(catalysisPrice + 2499), strike: fmtPrice(catalysisPrice + 2999), save:'Save ₹500' },
    { name:'CATalysis + NMAT Mocks',  price: fmtPrice(catalysisPrice + 2499), strike: fmtPrice(catalysisPrice + 2999), save:'Save ₹500' },
  ]

  return (
    <>
      <Head>
        <title>CAT Pricing — CATalysis &amp; CAThlete — GRADSKOOL</title>
        <meta name="description" content={`CATalysis (CAT ${catalysisYear} full cohort) from ${fmtPrice(catalysisPrice)}, and CAThlete (CAT ${examYear} crash course) from ${fmtPrice(cathleteBasePrice)} — GRADSKOOL.`} />
      </Head>

      <style>{`
        .pr-hero { max-width:800px; margin:0 auto; padding:56px 40px 16px; text-align:center; }
        .pr-eyebrow { font-family:var(--font-sans); font-size:11px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:var(--red); margin-bottom:14px; }
        .pr-h1 { font-family:var(--font-serif); font-size:clamp(28px,4.5vw,42px); font-weight:400; color:var(--black); line-height:1.15; margin-bottom:10px; }
        .pr-sub { font-family:var(--font-body); font-size:15px; color:var(--g700); }
        .pr-back { font-family:var(--font-sans); font-size:13px; color:var(--g500); text-decoration:none; }
        .pr-body { max-width:1100px; margin:0 auto; padding:32px 40px 80px; }
        .pr-section-label { font-family:var(--font-sans); font-size:11px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--red); margin-bottom:16px; }
        .pr-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:20px; margin-bottom:56px; }
        .pr-card { border:1px solid var(--g200); border-radius:6px; padding:28px 26px; background:#fff; display:flex; flex-direction:column; }
        .pr-card.featured { background:var(--black); border-color:var(--black); }
        .pr-card-name { font-family:var(--font-serif); font-size:19px; margin-bottom:8px; }
        .pr-card.featured .pr-card-name { color:#fff; }
        .pr-card-price { font-family:var(--font-serif); font-size:34px; margin:12px 0 4px; }
        .pr-card.featured .pr-card-price { color:#fff; }
        .pr-card-note { font-family:var(--font-sans); font-size:12px; color:var(--g500); margin-bottom:18px; }
        .pr-card.featured .pr-card-note { color:rgba(255,255,255,.6); }
        .pr-card-cta { margin-top:auto; font-family:var(--font-sans); font-size:13px; font-weight:600; padding:11px; text-align:center; background:var(--red); color:#fff; border-radius:3px; text-decoration:none; }
        .pr-addon-row { display:flex; justify-content:space-between; align-items:center; padding:14px 20px; border:1px solid var(--g200); border-radius:4px; margin-bottom:10px; flex-wrap:wrap; gap:10px; }
        .pr-addon-name { font-family:var(--font-sans); font-size:13px; color:var(--black); }
        .pr-addon-price { font-family:var(--font-sans); font-size:13px; }
        .pr-strike { color:var(--g500); text-decoration:line-through; margin-right:8px; }
      `}</style>

      <div className="pr-hero">
        <Link href="/courses/cat" className="pr-back">← Back to CAT</Link>
        <p className="pr-eyebrow" style={{ marginTop:16 }}>Pricing</p>
        <h1 className="pr-h1">CATalysis &amp; CAThlete pricing</h1>
        <p className="pr-sub">Two ways to prepare for CAT — pick what fits your timeline.</p>
      </div>

      <div className="pr-body">
        <div className="pr-section-label">CATalysis — CAT {catalysisYear} full cohort</div>
        <div className="pr-grid">
          <div className="pr-card featured">
            <div className="pr-card-name">CATalysis</div>
            <div className="pr-card-price">{fmtPrice(catalysisPrice)}</div>
            <div className="pr-card-note">400+ hours live · 30 full mocks · 30 sectionals · PI WAT GD included</div>
            <Link href="/checkout?course=cat&plan=live-mocks" className="pr-card-cta">Enrol Now →</Link>
          </div>
        </div>

        <div className="pr-section-label">CATalysis bundles</div>
        <div style={{ marginBottom:56 }}>
          {ADDONS.map(a => (
            <div key={a.name} className="pr-addon-row">
              <span className="pr-addon-name">{a.name}</span>
              <span className="pr-addon-price"><span className="pr-strike">{a.strike}</span>{a.price} <span style={{ color:'var(--red)', fontWeight:600 }}>· {a.save}</span></span>
            </div>
          ))}
        </div>

        <div className="pr-section-label">CAThlete — CAT {examYear} crash course</div>
        <div className="pr-grid">
          <div className="pr-card">
            <div className="pr-card-name">CAThlete</div>
            <div className="pr-card-price">{fmtPrice(cathleteBasePrice)}</div>
            <div className="pr-card-note">Without mocks — intensive final-stretch prep</div>
            <Link href="/checkout?course=cathlete&plan=base" className="pr-card-cta">Enrol Now →</Link>
          </div>
          <div className="pr-card">
            <div className="pr-card-name">CAThlete + Mocks</div>
            <div className="pr-card-price">{fmtPrice(cathleteMocksPrice)}</div>
            <div className="pr-card-note">With 30 full-length CAT mocks</div>
            <Link href="/checkout?course=cathlete&plan=with-mocks" className="pr-card-cta">Enrol Now →</Link>
          </div>
        </div>
      </div>
    </>
  )
}
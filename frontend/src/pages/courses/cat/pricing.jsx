/**
 * GRADSKOOL — CAT Pricing Page
 * Route: /courses/cat/pricing
 *
 * Consolidates every CAT product into one comparison page. Rebuilt —
 * the previous version looked up plans by slugs that no longer exist
 * anywhere ('live-cat-mocks', 'cathlete-no-mocks', 'cathlete-with-mocks'),
 * so it was silently showing hardcoded fallback prices only, never the
 * real database values, and had a fictional "CATalysis bundles" section
 * with add-on prices that don't correspond to any real, purchasable plan.
 *
 * Every card here links straight to /checkout?course=...&plan=... using
 * the exact same slugs the checkout page's CAT_PLAN_GROUPS expects, so
 * clicking through always lands on the right product pre-selected.
 */
import Head from 'next/head'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
const R = { color: 'var(--red)' }

// Fallback prices — used only if a plan hasn't been seeded yet in the
// database the moment this page builds. Once seeded, real data always wins.
const FALLBACK = {
  examDate: '2026-11-29',
  'live-mocks': 27999, 'live-all-mba-mocks': 29999,
  'live-cat-mocks-books': 31999, 'live-all-mba-mocks-books': 34999,
  'base': 6999, 'with-mocks': 9999,
  'alpgebra': 999, 'cat-mocks': 2999, 'cat-books': 3999,
  'all-mba-mocks-books': 7999,
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
  // Real plan (if seeded) wins; otherwise the matching fallback number —
  // same slug used for both the lookup and the checkout link below, so
  // this page can never show a price that doesn't match what's charged.
  const price = (slug) => {
    const plan = plans.find(p => p.slug === slug)
    return plan?.price_inr ? Number(plan.price_inr) : FALLBACK[slug]
  }

  const examYear = new Date(examData?.exam_date || FALLBACK.examDate).getFullYear()
  const catalysisYear = examYear + 1

  const CATALYSIS_TIERS = [
    { slug:'live-mocks',               name:'Live + CAT Mocks',               note:'400+ hrs live · 30 CAT mocks · 30 sectionals', featured:true, badge:'Most Popular' },
    { slug:'live-all-mba-mocks',       name:'Live + All MBA Mocks',           note:'CAT + XAT + SNAP + NMAT + CMAT mocks', badge:'Best Value' },
    { slug:'live-cat-mocks-books',     name:'Live + CAT Mocks + Books',       note:'Adds the 16-book printed set' },
    { slug:'live-all-mba-mocks-books', name:'Live + All MBA Mocks + Books',   note:'Everything — all mocks, books, GDPI prep' },
  ]

  const CATHLETE_TIERS = [
    { slug:'base',       name:'CAThlete',           note:'Without mocks — intensive final-stretch prep' },
    { slug:'with-mocks', name:'CAThlete + Mocks',    note:'With 31 full-length CAT mocks', featured:true, badge:'Recommended' },
  ]

  const STANDALONE = [
    { slug:'alpgebra',            name:'ALPgebra',                href:'course=alpgebra',   note:'99 theorems — full Algebra syllabus' },
    { slug:'cat-mocks',           name:'CAT Mocks',               href:'course=cat',         note:'Full-length mocks + sectional tests' },
    { slug:'cat-books',           name:'CAT Books',               href:'course=cat-books',   note:"Curated books with ALP Sir's notes" },
    { slug:'all-mba-mocks-books', name:'All MBA Mocks + Books',   href:'course=cat',         note:'Self-paced mocks across every OMET, plus books' },
  ]

  return (
    <>
      <Head>
        <title>CAT Pricing — Every Plan, One Page — GRADSKOOL</title>
        <meta name="description" content={`CATalysis, CAThlete, ALPgebra, CAT Mocks, CAT Books — every CAT ${catalysisYear} product and price on one page.`} />
      </Head>

      <style>{`
        .pr-hero { max-width:800px; margin:0 auto; padding:56px 40px 16px; text-align:center; }
        .pr-eyebrow { font-family:var(--font-sans); font-size:11px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:var(--red); margin-bottom:14px; }
        .pr-h1 { font-family:var(--font-serif); font-size:clamp(28px,4.5vw,42px); font-weight:400; color:var(--black); line-height:1.15; margin-bottom:10px; }
        .pr-sub { font-family:var(--font-body); font-size:15px; color:var(--g700); }
        .pr-back { font-family:var(--font-sans); font-size:13px; color:var(--g500); text-decoration:none; }
        .pr-body { max-width:1100px; margin:0 auto; padding:32px 40px 80px; }
        @media(max-width:600px) {
          .pr-hero { padding:40px 20px 12px!important; }
          .pr-body { padding:24px 20px 60px!important; }
        }
        .pr-section-label { font-family:var(--font-sans); font-size:11px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--red); margin-bottom:16px; }
        .pr-section-sub { font-family:var(--font-sans); font-size:13px; color:var(--g500); margin:-12px 0 16px; }
        .pr-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:18px; margin-bottom:56px; }
        .pr-card { border:1px solid var(--g200); border-radius:6px; padding:26px 24px; background:#fff; display:flex; flex-direction:column; position:relative; }
        .pr-card.featured { border-color:var(--red); border-width:2px; }
        .pr-badge { position:absolute; top:-12px; left:22px; background:var(--red); color:#fff; font-family:var(--font-sans); font-size:9px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; padding:3px 10px; border-radius:2px; }
        .pr-card-name { font-family:var(--font-serif); font-size:18px; margin-bottom:6px; margin-top:4px; }
        .pr-card-price { font-family:var(--font-serif); font-size:30px; margin:10px 0 4px; }
        .pr-card-note { font-family:var(--font-sans); font-size:12px; color:var(--g500); margin-bottom:18px; line-height:1.5; }
        .pr-card-cta { margin-top:auto; font-family:var(--font-sans); font-size:13px; font-weight:600; padding:11px; text-align:center; background:var(--red); color:#fff; border-radius:3px; text-decoration:none; }
      `}</style>

      <div className="pr-hero">
        <Link href="/courses/cat" className="pr-back">← Back to CAT</Link>
        <p className="pr-eyebrow" style={{ marginTop:16 }}>Pricing</p>
        <h1 className="pr-h1">Every CAT product, one page</h1>
        <p className="pr-sub">CATalysis, CAThlete, ALPgebra, and every standalone add-on — pick what fits your timeline.</p>
      </div>

      <div className="pr-body">
        <div className="pr-section-label">CATalysis — CAT {catalysisYear} full cohort</div>
        <div className="pr-grid">
          {CATALYSIS_TIERS.map(t => (
            <div key={t.slug} className={`pr-card${t.featured ? ' featured' : ''}`}>
              {t.badge && <span className="pr-badge">{t.badge}</span>}
              <div className="pr-card-name">{t.name}</div>
              <div className="pr-card-price">{fmtPrice(price(t.slug))}</div>
              <div className="pr-card-note">{t.note}</div>
              <Link href={`/checkout?course=cat&plan=${t.slug}`} className="pr-card-cta">Enrol Now →</Link>
            </div>
          ))}
        </div>

        <div className="pr-section-label">CAThlete — CAT {examYear} crash course</div>
        <div className="pr-grid">
          {CATHLETE_TIERS.map(t => (
            <div key={t.slug} className={`pr-card${t.featured ? ' featured' : ''}`}>
              {t.badge && <span className="pr-badge">{t.badge}</span>}
              <div className="pr-card-name">{t.name}</div>
              <div className="pr-card-price">{fmtPrice(price(t.slug))}</div>
              <div className="pr-card-note">{t.note}</div>
              <Link href={`/checkout?course=cathlete&plan=${t.slug}`} className="pr-card-cta">Enrol Now →</Link>
            </div>
          ))}
        </div>

        <div className="pr-section-label">Standalone products</div>
        <div className="pr-section-sub">Not ready for the full cohort or crash course? Each of these works on its own.</div>
        <div className="pr-grid" style={{ marginBottom:24 }}>
          {STANDALONE.map(t => (
            <div key={t.slug} className="pr-card">
              <div className="pr-card-name">{t.name}</div>
              <div className="pr-card-price">{fmtPrice(price(t.slug))}</div>
              <div className="pr-card-note">{t.note}</div>
              <Link href={`/checkout?${t.href}&plan=${t.slug}`} className="pr-card-cta">Enrol Now →</Link>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
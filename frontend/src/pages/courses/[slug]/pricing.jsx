/**
 * GRADSKOOL — Per-Exam Pricing Page (generic)
 * Route: /courses/[slug]/pricing
 *
 * Covers exams that go through the dynamic [slug].jsx course template
 * (SNAP, NMAT, GMAT, MHCET, and any exam added purely via the DB) —
 * fetches the same /courses/{slug}/plans/ endpoint that page already uses,
 * and renders it through the existing PricingGrid component, so this page
 * can never show different numbers than the course page itself.
 *
 * CAT and XAT have their own dedicated pricing pages instead
 * (/courses/cat/pricing, /courses/xat/pricing) — their course pages use
 * bespoke pricing layouts, not this generic plans-API pattern, so a
 * generic page here would've shown the wrong (fallback/empty) numbers
 * for those two specifically. Next.js's static routes for those take
 * priority over this dynamic one automatically.
 */
import Head from 'next/head'
import Link from 'next/link'
import { PricingGrid } from '../../../components/courses/PricingGrid'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export async function getStaticPaths() {
  try {
    const res = await fetch(`${API}/courses/exams/`)
    const data = await res.json()
    // cat and xat are excluded — they resolve to their own dedicated
    // static files instead, this list is just for revalidation coverage.
    const paths = (data.exams || [])
      .filter(e => !['cat', 'xat'].includes(e.slug))
      .map(e => ({ params: { slug: e.slug } }))
    return { paths, fallback: 'blocking' }
  } catch {
    return { paths: [], fallback: 'blocking' }
  }
}

export async function getStaticProps({ params }) {
  try {
    const [examRes, plansRes] = await Promise.all([
      fetch(`${API}/courses/${params.slug}/`),
      fetch(`${API}/courses/${params.slug}/plans/`),
    ])
    if (!examRes.ok) return { notFound: true, revalidate: 60 }
    const exam  = await examRes.json()
    const plansData = await plansRes.json()
    return { props: { exam, plans: plansData.plans || [], examSlug: params.slug }, revalidate: 300 }
  } catch {
    return { props: { exam: null, plans: [], examSlug: params.slug }, revalidate: 60 }
  }
}

export default function ExamPricingPage({ exam, plans, examSlug }) {
  const name = exam?.name || examSlug.toUpperCase()

  return (
    <>
      <Head>
        <title>{name} Pricing — GRADSKOOL</title>
        <meta name="description" content={`${name} course pricing — GRADSKOOL. Live two-way classes, full-length mocks, and structured preparation by ALP Sir.`} />
      </Head>

      <style>{`
        .pr-hero { max-width:800px; margin:0 auto; padding:56px 40px 16px; text-align:center; }
        .pr-eyebrow { font-family:var(--font-sans); font-size:11px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:var(--red); margin-bottom:14px; }
        .pr-h1 { font-family:var(--font-serif); font-size:clamp(28px,4.5vw,42px); font-weight:400; color:var(--black); line-height:1.15; margin-bottom:10px; }
        .pr-sub { font-family:var(--font-body); font-size:15px; color:var(--g700); }
        .pr-back { font-family:var(--font-sans); font-size:13px; color:var(--g500); text-decoration:none; }
        .pr-body { max-width:1000px; margin:0 auto; padding:32px 40px 80px; }
        .pr-empty { text-align:center; padding:60px 20px; font-family:var(--font-sans); color:var(--g500); }
      `}</style>

      <div className="pr-hero">
        <Link href={`/courses/${examSlug}`} className="pr-back">← Back to {name}</Link>
        <p className="pr-eyebrow" style={{ marginTop: 16 }}>Pricing</p>
        <h1 className="pr-h1">{name} — plans &amp; pricing</h1>
        <p className="pr-sub">Live two-way classes, full-length mocks, and structured preparation by ALP Sir.</p>
      </div>

      <div className="pr-body">
        {plans.length === 0 ? (
          <p className="pr-empty">Pricing for {name} is being finalized — check back shortly, or ask on WhatsApp.</p>
        ) : (
          <PricingGrid plans={plans} examSlug={examSlug} />
        )}
      </div>
    </>
  )
}
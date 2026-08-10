/**
 * GRADSKOOL — Checkout bridge
 * Route: /checkout?course=<slug>&plan=<id>
 *
 * The real checkout page lives at /checkout/[examSlug] — it needs the
 * exam as a URL PATH segment, not a query param. But every "Enrol Now"
 * link across the entire site was written as /checkout?course=X&plan=Y
 * (query-param style), which never matched that page at all — every
 * enrollment link on the site was silently 404ing.
 *
 * Rather than rewrite every one of those links (scattered across CAT,
 * XAT, CAThlete, CATalysis, Books, NMAT, SNAP, and more), this bridges
 * the gap in one place: reads the query params, redirects to the real
 * path-based URL.
 *
 * One special case: "cathlete" isn't a real exam in the backend — its
 * plans (cathlete-no-mocks / cathlete-with-mocks) are stored as PLANS
 * under the "cat" exam, not as their own exam. So course=cathlete needs
 * to redirect to examSlug=cat, not examSlug=cathlete (which wouldn't
 * match anything).
 */
import { useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

// course= values that don't map 1:1 to a real backend exam slug —
// their plans are stored under the "cat" exam instead.
const EXAM_SLUG_OVERRIDES = {
  cathlete: 'cat',
  'cat-books': 'cat',
}

export default function CheckoutBridge() {
  const router = useRouter()

  useEffect(() => {
    if (!router.isReady) return
    const { course, plan } = router.query

    if (!course) {
      router.replace('/courses')
      return
    }

    const examSlug = EXAM_SLUG_OVERRIDES[course] || course
    const target = plan ? `/checkout/${examSlug}?plan=${plan}` : `/checkout/${examSlug}`
    router.replace(target)
  }, [router.isReady, router.query])

  return (
    <>
      <Head>
        <title>Redirecting… — GRADSKOOL</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div style={{ minHeight:'60vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <p style={{ fontFamily:'var(--font-sans)', fontSize:14, color:'var(--g500)' }}>Redirecting…</p>
      </div>
    </>
  )
}
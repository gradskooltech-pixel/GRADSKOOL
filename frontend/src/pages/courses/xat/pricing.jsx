/**
 * GRADSKOOL — XAT Pricing Page
 * Route: /courses/xat/pricing
 *
 * XAT's pricing on the main course page is fully hardcoded (no plans API
 * involved at all, unlike CAT or the generic template) — same numbers
 * reused here, just as its own standalone destination.
 */
import Head from 'next/head'
import Link from 'next/link'

export default function XatPricingPage() {
  return (
    <>
      <Head>
        <title>XAT Pricing — GRADSKOOL</title>
        <meta name="description" content="XAT Full Course ₹5,999, XAT Mocks Only ₹1,499 — GRADSKOOL, taught live by ALP Sir." />
      </Head>

      <style>{`
        .pr-hero { max-width:800px; margin:0 auto; padding:56px 40px 16px; text-align:center; }
        .pr-eyebrow { font-family:var(--font-sans); font-size:11px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:var(--red); margin-bottom:14px; }
        .pr-h1 { font-family:var(--font-serif); font-size:clamp(28px,4.5vw,42px); font-weight:400; color:var(--black); line-height:1.15; margin-bottom:10px; }
        .pr-sub { font-family:var(--font-body); font-size:15px; color:var(--g700); }
        .pr-back { font-family:var(--font-sans); font-size:13px; color:var(--g500); text-decoration:none; }
        .pr-body { max-width:900px; margin:0 auto; padding:32px 40px 80px; display:grid; grid-template-columns:1fr 1fr; gap:24px; }
        @media(max-width:760px){ .pr-body{ grid-template-columns:1fr; } }
        .pr-card { border:1px solid var(--g200); border-radius:6px; padding:28px 26px; background:#fff; display:flex; flex-direction:column; }
        .pr-card-name { font-family:var(--font-serif); font-size:19px; margin-bottom:14px; }
        .pr-feature { font-family:var(--font-sans); font-size:13px; color:var(--g700); margin-bottom:8px; display:flex; gap:8px; }
        .pr-card-price { font-family:var(--font-serif); font-size:34px; margin:16px 0 4px; }
        .pr-card-cta { margin-top:16px; font-family:var(--font-sans); font-size:13px; font-weight:600; padding:11px; text-align:center; background:var(--red); color:#fff; border-radius:3px; text-decoration:none; }
        .pr-bundle { max-width:900px; margin:0 auto; padding:0 40px 60px; }
        .pr-bundle-box { padding:14px 20px; background:var(--off); border:1px solid var(--g200); border-radius:4px; font-family:var(--font-sans); font-size:13px; color:var(--g700); }
      `}</style>

      <div className="pr-hero">
        <Link href="/courses/xat" className="pr-back">← Back to XAT</Link>
        <p className="pr-eyebrow" style={{ marginTop:16 }}>Pricing</p>
        <h1 className="pr-h1">Simple, flat pricing</h1>
        <p className="pr-sub">Live two-way classes, full-length tests, and Decision Making specialization.</p>
      </div>

      <div className="pr-body">
        <div className="pr-card">
          <div className="pr-card-name">XAT Full Course</div>
          {['100+ hours of live two-way sessions','6 full-length XAT tests','Post-test strategic analysis','Decision Making special sessions','Session PDFs + cheat sheets','Doubt resolution sessions','PI WAT GD prep for XLRI'].map(item => (
            <div key={item} className="pr-feature"><span style={{ color:'var(--red)' }}>—</span><span>{item}</span></div>
          ))}
          <div className="pr-card-price">₹5,999<span style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'var(--g500)', marginLeft:8 }}>incl. GST</span></div>
          <Link href="/checkout?course=xat" className="pr-card-cta">Enrol Now →</Link>
        </div>

        <div>
          <div className="pr-card" style={{ marginBottom:16 }}>
            <div className="pr-card-name">XAT Mocks Only</div>
            <p style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--g700)', lineHeight:1.7, marginBottom:16 }}>
              Already studying? Just want timed full-length XAT tests with analysis?
            </p>
            <div className="pr-card-price" style={{ fontSize:28 }}>₹1,499</div>
            <Link href="/checkout?course=xat&plan=mocks" className="pr-card-cta" style={{ background:'transparent', border:'2px solid var(--red)', color:'var(--red)' }}>Get XAT Mocks →</Link>
          </div>
          <div className="pr-card">
            <div className="pr-card-name">Not sure yet?</div>
            <p style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--g700)', lineHeight:1.7, marginBottom:16 }}>
              Free XAT Foundations classes, taught live by ALP Sir — no cost, no signup fee.
            </p>
            <Link href="/foundations/xat" className="pr-card-cta">Watch free classes →</Link>
          </div>
        </div>
      </div>

      <div className="pr-bundle">
        <div className="pr-bundle-box">
          <strong style={{ color:'var(--red)' }}>Bundle with CATalysis?</strong> Add XAT at ₹5,499 (save ₹500). Most CAT students also appear for XAT.
        </div>
      </div>
    </>
  )
}
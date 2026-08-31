/**
 * GRADSKOOL — Homepage v2 (review build, rebuild #2)
 * Route: /home-v2 — NOT linked from nav, review-only until approved
 *
 * Full rebuild against the actual mockup (gradskool-homepage-mockup__4_.html)
 * section-by-section — the first pass missed real sections entirely (the
 * ₹2,00,000 One-on-One tier + its justification section, the exam-selector
 * segment in the hero, the founder credentials grid, refund-policy
 * mentions, the mobile sticky bar) and used different testimonials/FAQ
 * content than the mockup specified. This version matches structure and
 * copy directly against the mockup's own HTML, with real GRADSKOOL data
 * substituted wherever the mockup's own numbers were placeholders.
 *
 * FLAGGED DISCREPANCIES — mockup vs real site, resolved in favor of real:
 * 1. ALPgebra: mockup says "99 principles across 9 families" — real site
 *    (pages/courses/cat/alpgebra.jsx) says "99 theorems, 19 chapters,
 *    1,485 curated problems." Used the real description.
 * 2. GMAT Focus Edition: mockup shows one ₹19,999 tier with "9 full mocks."
 *    Real site (data/examData.js) has TWO tiers — ₹34,999 Live+Mocks and
 *    ₹29,999 Live Only — with no "9 mocks" claim anywhere. Used the real
 *    ₹34,999 Live+Mocks tier (matches the mockup's "featured 3rd card"
 *    role most closely) rather than inventing a number.
 * 3. Refund policy: mockup shows unconditional "✓ Refund policy available"
 *    checkmarks. Real policy (pages/refund-policy.jsx) is conditional —
 *    refundable only before access is activated, non-refundable after.
 *    Text says "Refund policy" linking to the real page, not a checkmark
 *    implying unconditional refunds.
 * 4. One-on-One "Apply for 1:1" — real product, confirmed by GS. Hours
 *    (90 total, 3×1.5hr/week) and CAT+GMAT scope confirmed real. The
 *    actual application URL was NOT provided yet — placeholder below is
 *    clearly marked, swap before this ever goes live.
 */
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import PageSEO, { faqSchema, reviewsSchema } from '../components/seo/PageSEO'
import { GMAT_DATA, XAT_DATA, MHCET_DATA } from '../data/examData'

const S = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}
  body{font-family:var(--font-sans);color:var(--black);background:#fff;line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}
  a{text-decoration:none;color:inherit}
  img,video{max-width:100%;display:block}
  button{border:none;background:none;cursor:pointer;font-family:inherit}
  .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
  .d-xl{font-family:var(--font-serif);font-size:clamp(36px,5vw,60px);font-weight:400;line-height:1.03;letter-spacing:-.02em;color:var(--black)}
  .d-lg{font-family:var(--font-serif);font-size:clamp(26px,3.2vw,38px);font-weight:400;line-height:1.12;letter-spacing:-.015em;color:var(--black)}
  .eyebrow{font-family:var(--font-sans);font-size:11px;font-weight:600;letter-spacing:.13em;text-transform:uppercase;color:var(--g500);display:flex;align-items:center;gap:8px}
  .eyebrow .dot{width:5px;height:5px;border-radius:50%;background:var(--red);flex-shrink:0}
  .btn{display:inline-flex;align-items:center;gap:7px;font-family:var(--font-sans);font-size:13px;font-weight:600;letter-spacing:.02em;padding:12px 26px;border-radius:var(--radius);transition:all var(--t);cursor:pointer;white-space:nowrap;border:2px solid transparent;text-decoration:none}
  .btn-red{background:var(--red);color:#fff;border-color:var(--red)}
  .btn-red:hover{background:var(--red-hover);transform:translateY(-1px);box-shadow:0 4px 12px rgba(217,79,80,.3)}
  .btn-ghost{background:transparent;color:#fff;border-color:#444}
  .btn-ghost:hover{border-color:#fff}
  .btn-wa{background:transparent;color:var(--black);border-color:var(--g200)}
  .btn-wa:hover{border-color:#25D366}
  .wa-dot{width:8px;height:8px;border-radius:50%;background:#25D366;flex-shrink:0}
  .container{max-width:1200px;margin:0 auto;padding:0 40px}
  .section{padding:80px 0;border-bottom:var(--border)}
  @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
  @media(prefers-reduced-motion:reduce){#gs-ticker{animation:none}}
  .fi{opacity:0;transform:translateY(18px);transition:opacity .55s ease,transform .55s ease}
  .fi.vis{opacity:1;transform:translateY(0)}
  .seg-row{display:flex;gap:8px;flex-wrap:wrap}
  .seg-btn{font-family:var(--font-sans);font-size:12.5px;font-weight:600;padding:8px 16px;border-radius:20px;border:1.5px solid var(--g300);background:#fff;color:var(--g700);cursor:pointer;transition:all var(--t)}
  .seg-btn.active{background:var(--black);color:#fff;border-color:var(--black)}
  .seg-btn:hover:not(.active){border-color:var(--black)}
  .tv-row{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
  .tv-thumb{aspect-ratio:9/16;background:var(--g200);border-radius:4px;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;margin-bottom:10px}
  .play-sm{width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.92);display:flex;align-items:center;justify-content:center;font-size:13px;color:var(--red)}
  .why-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--g200);border:var(--border);border-radius:4px;overflow:hidden}
  .why-card{background:#fff;padding:28px 24px;position:relative;transition:background var(--t)}
  .why-card:hover{background:var(--off)}
  .why-num{font-family:var(--font-serif);font-size:28px;color:var(--red);line-height:1;margin-bottom:14px}
  .justify-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:rgba(255,255,255,.12);border-radius:4px;overflow:hidden}
  .justify-card{background:var(--black);padding:28px 24px}
  .justify-num{font-family:var(--font-serif);font-size:24px;color:var(--red);margin-bottom:12px}
  .tiers-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--g200);border:var(--border);border-radius:4px;overflow:hidden}
  .tier-card{background:#fff;padding:28px 24px;display:flex;flex-direction:column}
  .tier-card.featured{background:var(--off)}
  .tier-card.premium{background:var(--black);color:#fff}
  .tier-card ul{list-style:none;margin:16px 0;flex:1}
  .tier-card li{font-family:var(--font-sans);font-size:12px;color:var(--g700);padding:5px 0;display:flex;gap:7px;align-items:flex-start}
  .tier-card.premium li{color:#ccc}
  .li-dash{color:var(--red);flex-shrink:0}
  .testi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--g200);border:var(--border);border-radius:4px;overflow:hidden}
  .testi-card{background:#fff;padding:32px;display:flex;flex-direction:column}
  .founder-section{display:grid;grid-template-columns:1fr 360px;border-bottom:var(--border)}
  .founder-l{padding:80px 64px 80px 40px;border-right:var(--border)}
  .founder-r{background:var(--off);display:flex;align-items:center;justify-content:center;padding:48px}
  .creds-row{display:flex;gap:1px;background:var(--g200);border:var(--border);border-radius:3px;overflow:hidden;margin-bottom:24px}
  .cred{background:#fff;padding:18px 22px;flex:1}
  .cred-chip-grid{display:flex;flex-direction:column;gap:1px;background:var(--g200);border:var(--border);border-radius:3px;overflow:hidden}
  .cred-chip{background:#fff;padding:16px 20px;font-family:var(--font-sans);font-size:12.5px;color:var(--g700);line-height:1.6}
  .cred-chip b{display:block;font-family:var(--font-serif);font-size:14px;color:var(--black);margin-bottom:3px}
  .compare-table{width:100%;border-collapse:collapse;font-family:var(--font-sans)}
  .compare-table th,.compare-table td{padding:14px 20px}
  .compare-note{display:block;font-size:11px;color:var(--g500);margin-top:3px;font-weight:400}
  .faq-item{border-bottom:var(--border)}
  .faq-q{width:100%;display:flex;align-items:center;justify-content:space-between;padding:22px 0;text-align:left;font-family:var(--font-serif);font-size:17px;color:var(--black);cursor:pointer}
  .faq-a{font-family:var(--font-body);font-size:14px;color:var(--g700);line-height:1.8;max-width:760px;padding-bottom:22px}
  .mob-sticky{display:none;position:fixed;bottom:0;left:0;right:0;z-index:998;background:#fff;border-top:var(--border);padding:12px 20px;align-items:center;gap:10px;box-shadow:0 -4px 20px rgba(0,0,0,.1)}
  @media(max-width:960px){.mob-sticky{display:flex}}
  .cd-strip{background:var(--black);padding:10px 0;text-align:center;border-bottom:var(--border)}
  .cd-block{display:flex;flex-direction:column;align-items:center;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:3px;padding:4px 10px;min-width:50px}
  @media(max-width:960px){
    .container{padding:0 24px}
    .why-grid{grid-template-columns:repeat(2,1fr)}
    .tiers-grid{grid-template-columns:repeat(2,1fr)}
    .justify-grid{grid-template-columns:repeat(2,1fr)}
    .tv-row{grid-template-columns:repeat(2,1fr)}
    .testi-grid{grid-template-columns:1fr}
    .founder-section{grid-template-columns:1fr}
    .founder-l{padding:48px 24px;border-right:none;border-bottom:var(--border)}
    .founder-r{padding:36px 24px}
  }
  @media(max-width:600px){
    .section{padding:56px 0}
    .why-grid{grid-template-columns:1fr}
    .tiers-grid{grid-template-columns:1fr}
    .justify-grid{grid-template-columns:1fr}
    .tv-row{grid-template-columns:1fr}
  }
`

const WHATSAPP_URL = 'https://wa.me/917838737388?text=Hi%20ALP%20Sir%2C%20I%20want%20to%20know%20more%20about%20GRADSKOOL'
const APPLY_1_1_URL = '/apply-1-1'
// Real per-exam content for the hero's exam selector — each segment's
// featured plan and page link pulled directly from data/examData.js
// (confirmed real, not invented). CAT segment specifically links to
// CAThlete (₹6,999 base price, confirmed against pages/courses/cat/
// cathlete.jsx's own FALLBACK.cathleteBasePrice) rather than the general
// CAT course page — CAThlete isn't one of CAT_DATA's own plans[] entries,
// it's a separate, dedicated crash-course page/product. SNAP and NMAT
// are two genuinely separate segments now (previously combined into one
// "SNAP / NMAT" button before a real dedicated tab for each was asked
// for), each linking to its own real course page with its own real
// featured-plan price.
const SEGMENTS = [
  { key:'CAT',  label:'CAT',  href:'/courses/cat/cat-crash-course-2026',
    featured: { name:'CAThlete', price:'6,999', note:'CAT 2026 crash course · starts September' } },
  { key:'GMAT', label:'GMAT', href:'/courses/gmat',
    featured: GMAT_DATA.plans.find(p => p.featured) },
  { key:'XAT',  label:'XAT',  href:'/courses/xat',
    featured: XAT_DATA.plans.find(p => p.featured) },
  { key:'SNAP', label:'SNAP', href:'/courses/snap/live',
    featured: { name:'SNAP Mocks', price:'1,499', note:'Free live classes + full mock access — real current pricing, not the next-cohort bundle in examData.js' } },
  { key:'NMAT', label:'NMAT', href:'/courses/nmat/live',
    featured: { name:'NMAT Mocks', price:'1,499', note:'Free live classes + full mock access — real current pricing, not the next-cohort bundle in examData.js' } },
  { key:'MHCET', label:'MH CET', href:'/courses/mhcet',
    featured: MHCET_DATA.plans.find(p => p.featured) },
]

export default function HomeV2() {
  const [countdown, setCountdown] = useState({ d:0, h:'00', m:'00', s:'00' })
  const [openFaq, setOpenFaq] = useState(0)
  const [segment, setSegment] = useState(SEGMENTS[0])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const target = new Date('2026-11-29T09:00:00+05:30').getTime()
    const tick = () => {
      const diff = target - Date.now()
      if (diff <= 0) return
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const sec = Math.floor((diff % 60000) / 1000)
      setCountdown({ d, h:String(h).padStart(2,'0'), m:String(m).padStart(2,'0'), s:String(sec).padStart(2,'0') })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      document.querySelectorAll('.fi').forEach(el => el.classList.add('vis'))
      return
    }
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vis'); obs.unobserve(e.target) } })
    }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' })
    document.querySelectorAll('.fi').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  const R = { color:'var(--red)' }

  const FAQS = [
    {q:'Is there a refund policy?', a:'Yes, on CAThlete, CATalysis and GMAT Focus Edition. Refunds apply before course access is activated — once access is shared or a session begins, it is non-refundable. Full terms are on the refund policy page linked in the footer. The 1:1 programme is handled case-by-case — talk to us before enrolling if this matters to your decision.'},
    {q:'What makes GRADSKOOL different from other CAT coaching?', a:"Two-way live sessions, not recorded lectures. Cohorts capped at 27 students, always. And one mentor — Abhishek — teaches all three CAT sections, so your prep doesn't fragment across different teaching styles."},
    {q:'Can I prepare for both CAT and GMAT with GRADSKOOL?', a:'Yes. CATalysis and CAThlete are CAT-focused, and GMAT Focus Edition covers the GMAT syllabus separately. The 1:1 batch covers either exam, tailored to your target.'},
    {q:'How is the 1:1 batch different from CATalysis?', a:'CATalysis is cohort-based — 27 students learning together on a fixed schedule. The 1:1 batch is taught personally by Abhishek at your pace, with unlimited counselling and form-filling guidance built in, for students who want individual attention through the entire admissions process.'},
    {q:'Do you offer mock tests separately, without a full course?', a:"All our paid courses include full mocks as standard. If you're looking for a lighter, mocks-only option, message us on WhatsApp and we'll point you to what fits."},
  ]

  return (
    <>
      <PageSEO
        title="GRADSKOOL — CAThlete CAT Crash Course & GMAT Prep by ALP Sir"
        description="India's most structured CAT and GMAT preparation. ALP Sir — 99.93 percentile CAT, 770 GMAT. Live two-way sessions, 27 students per cohort."
        canonical="https://gradskool.in/home-v2"
        ogImage="/assets/og-image.jpg"
        breadcrumbs={[{name:'Home',url:'/'}]}
        schema={[
          faqSchema(FAQS),
          reviewsSchema([
            {name:'Keshav Mundra', text:'Each class is structured so a topic feels truly completed. ALP Sir explains every topic from multiple perspectives and builds the right way of thinking, not just the right answers.'},
            {name:'Vanshaj Jaiman', text:'The two-way live classes are what make GRADSKOOL stand apart. I could clear every doubt in the session itself. The 27-student limit is not marketing — you feel it in every class.'},
            {name:'Sameer Ansari', text:'From CAT to XAT, ALP Sir stood with us at every step. Mock interviews prepared me for exactly what I faced in the actual B-school interviews. This level of mentorship is genuinely rare.'},
          ]),
        ]}
      />
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <style>{S}</style>

      <div style={{ background:'#111', color:'#fff', textAlign:'center', padding:'10px 16px', fontFamily:'var(--font-sans)', fontSize:12 }}>
        🔍 Review build — not linked from navigation, not indexed. Compare against <Link href="/" style={{ color:'#ff8f8f', textDecoration:'underline' }}>the live homepage</Link>. APPLY_1_1_URL is a placeholder — see top of file.
      </div>

      <div className="cd-strip">
        <div className="container">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:20, flexWrap:'wrap' }}>
            <span style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:500, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--g500)' }}>CAT 2026 Exam</span>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              {[['d','Days'],['h','Hrs'],['m','Min'],['s','Sec']].map(([k,u], i) => (
                <span key={k} style={{ display:'flex', alignItems:'center', gap:6 }}>
                  {i > 0 && <span style={{ fontSize:18, color:'#444', marginBottom:10 }}>:</span>}
                  <div className="cd-block">
                    <span style={{ fontFamily:'var(--font-serif)', fontSize:22, fontWeight:700, color:'#fff', lineHeight:1 }}>{mounted ? countdown[k] : (k === 'd' ? 0 : '00')}</span>
                    <span style={{ fontFamily:'var(--font-sans)', fontSize:9, fontWeight:500, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--g500)', marginTop:2 }}>{u}</span>
                  </div>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main>
        <section style={{ display:'grid', gridTemplateColumns:'600px 1fr', borderBottom:'var(--border)' }} className="hero-grid">
          <style>{`@media(max-width:960px){.hero-grid{grid-template-columns:1fr!important}}.hero-l{padding:64px 56px 48px 40px;border-right:var(--border);display:flex;flex-direction:column;justify-content:space-between}.hero-r{background:var(--off);display:flex;align-items:center;justify-content:center;padding:24px;overflow:hidden}@media(max-width:960px){.hero-l{padding:48px 24px 40px!important;border-right:none!important;border-bottom:var(--border)}.hero-r{padding:40px 24px!important}}`}</style>
          <div className="hero-l">
            <div>
              <div className="eyebrow" style={{ marginBottom:20 }}><span className="dot" /><span>CAThlete — CAT 2026 crash course now open</span></div>
              <h1 className="d-xl" style={{ margin:'0 0 12px' }}>India's most <em style={R}>structured</em><br />CAT and GMAT prep.</h1>
              <p style={{ fontFamily:'var(--font-body)', fontSize:15, color:'var(--g700)', lineHeight:1.85, maxWidth:460, marginBottom:24 }}>
                Founded by Abhishek Leela Pandey — 99.93 percentile CAT, 770 GMAT. Live two-way teaching, not recorded lectures. Every cohort capped at 27 students.
              </p>

              <div style={{ marginBottom:20 }}>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:10.5, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--g500)', marginBottom:8 }}>I'm preparing for</div>
                <div className="seg-row">
                  {SEGMENTS.map(s => (
                    <button key={s.key} className={`seg-btn${segment.key === s.key ? ' active' : ''}`} onClick={() => setSegment(s)}>{s.label}</button>
                  ))}
                </div>
              </div>

              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, padding:'14px 18px', background:'var(--off)', border:'var(--border)', borderRadius:4, marginBottom:20, flexWrap:'wrap' }}>
                <div>
                  <div style={{ fontFamily:'var(--font-serif)', fontSize:24, color:'var(--black)', lineHeight:1 }}>₹{segment.featured.price}</div>
                  <div style={{ fontFamily:'var(--font-sans)', fontSize:11.5, color:'var(--g500)', marginTop:4 }}>{segment.featured.name} — {segment.featured.note}</div>
                </div>
                <Link href="/refund-policy" style={{ fontFamily:'var(--font-sans)', fontSize:11.5, color:'var(--g700)', textDecoration:'underline', whiteSpace:'nowrap' }}>Refund policy</Link>
              </div>

              <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                <Link href={segment.href} className="btn btn-red" style={{ flex:1, justifyContent:'center' }}>Enrol now — {segment.label} →</Link>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="btn btn-wa" style={{ flex:1, justifyContent:'center' }}>
                  <span className="wa-dot" />WhatsApp ALP Sir
                </a>
              </div>
            </div>
          </div>
          <div className="hero-r">
            <div style={{ width:'100%' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:1, background:'var(--g200)', border:'var(--border)', borderRadius:4, overflow:'hidden', marginBottom:16 }}>
                {[['100K+','Students mentored'],['5,000+','IIM & top B-school converts'],['27','Students per cohort, always'],['4.9★','347 student reviews']].map(([n,l]) => (
                  <div key={l} style={{ background:'#fff', padding:'20px 18px' }}>
                    <div style={{ fontFamily:'var(--font-serif)', fontSize:24, color:'var(--black)', lineHeight:1, marginBottom:4 }}>{n}</div>
                    <div style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'var(--g500)' }}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{ width:'100%', aspectRatio:'16/9', borderRadius:4, overflow:'hidden', background:'var(--g200)', boxShadow:'var(--shadow)' }}>
                <video loop playsInline preload="auto" controls style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}>
                  <source src="https://res.cloudinary.com/dz1nitcme/video/upload/q_auto/f_auto/v1780429043/CAT_2023_Hardest_Paper_2_q3k5gk.mp4" type="video/mp4" />
                </video>
              </div>
              <p style={{ fontFamily:'var(--font-sans)', fontSize:11.5, color:'var(--g500)', marginTop:8, textAlign:'center' }}>Watch: CAT 2023's hardest paper, solved live</p>
            </div>
          </div>
        </section>

        <div style={{ background:'var(--black)', padding:'14px 0', textAlign:'center' }}>
          <p style={{ fontFamily:'var(--font-sans)', fontSize:12.5, color:'var(--g500)' }}>
            Trusted by 100,000+ students across India — IIM Kozhikode, IIM Amritsar, NMIMS Mumbai Core, IMT Ghaziabad, IMI Delhi
          </p>
        </div>

        <section className="section" style={{ paddingBottom:0 }}>
          <div className="container">
            <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />In their own words</div>
            <h2 className="d-lg" style={{ marginBottom:36 }}>Toppers, on <em style={R}>what changed.</em></h2>
            <div className="tv-row">
              {[
                ['Sreeja Biswas', 'IIM Kozhikode'],
                ['Devang', 'IIM Amritsar'],
                ['Prathamesh Mulay', 'NMIMS Mumbai Core'],
                ['Shubhayu Das', 'NMIMS · IMI · IMT'],
              ].map(([name, school]) => (
                <div key={name} className="fi">
                  <div className="tv-thumb"><div className="play-sm">▶</div></div>
                  <div style={{ fontFamily:'var(--font-serif)', fontSize:13.5, color:'var(--black)' }}>{name}</div>
                  <div style={{ fontFamily:'var(--font-sans)', fontSize:11.5, color:'var(--g500)' }}>{school}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />Why GRADSKOOL</div>
            <h2 className="d-lg" style={{ marginBottom:48 }}>Built around <em style={R}>outcomes,</em> not scale.</h2>
            <div className="why-grid">
              {[
                ['27','Capped cohorts','Every batch stops at 27 students. Next cohort opens only after the current one finishes.'],
                ['↔','Two-way live sessions','Every doubt gets cleared in class — no waiting on forum replies days later.'],
                ['5','5-stage framework','Intro video, live session, cheat sheet, quiz, doubt resolution — every topic closed the same way.'],
                ['✓','Post-mock analysis','Every mock is followed by a strategic breakdown of what to fix before the next one.'],
              ].map(([num, title, desc]) => (
                <div key={title} className="why-card fi">
                  <div className="why-num">{num}</div>
                  <div style={{ fontFamily:'var(--font-serif)', fontSize:16, color:'var(--black)', marginBottom:8 }}>{title}</div>
                  <p style={{ fontFamily:'var(--font-sans)', fontSize:12.5, color:'var(--g700)', lineHeight:1.7 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />How we compare</div>
            <h2 className="d-lg" style={{ marginBottom:40 }}>GRADSKOOL vs <em style={R}>other coaching.</em></h2>
            <div style={{ border:'var(--border)', borderRadius:4, overflow:'hidden' }}>
              <table className="compare-table">
                <thead>
                  <tr style={{ background:'var(--off)', borderBottom:'var(--border)' }}>
                    <th style={{ textAlign:'left', fontSize:11, fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', color:'var(--g500)' }}>Feature</th>
                    <th style={{ fontSize:11, fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', color:'var(--red)' }}>GRADSKOOL</th>
                    <th style={{ fontSize:11, fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', color:'var(--g500)' }}>Other Coaching</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Two-way interactive live sessions', 'Real-time doubt clearing, not monologue lectures', '✗'],
                    ['Cohort capped at 27 students', 'Verified against enrolment numbers each batch', '✗'],
                    ['Post-mock strategic analysis', 'Individual breakdown after every full mock', '✗'],
                    ['Equal expertise across all sections', 'Quant, VARC and DILR taught by the same mentor', '✗'],
                    ['College counselling', null, 'Few'],
                    ['GRADFLIX essay repository', 'Free structured essay and RC practice platform', 'None'],
                  ].map(([feature, note, them], i) => (
                    <tr key={feature} style={{ borderBottom: i < 5 ? 'var(--border)' : 'none' }}>
                      <td style={{ fontFamily:'var(--font-body)', fontSize:14, color:'var(--black)' }}>
                        {feature}
                        {note && <span className="compare-note">{note}</span>}
                      </td>
                      <td style={{ textAlign:'center', fontSize:16, color:'#1d9e75' }}>✓</td>
                      <td style={{ textAlign:'center', fontSize:14, color:'var(--g500)' }}>{them}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />Student voices</div>
            <h2 className="d-lg" style={{ marginBottom:48 }}>4.9★ across <em style={R}>347 reviews.</em></h2>
            <div className="testi-grid">
              {[
                {name:'Keshav Mundra', role:'GMAT cohort', text:'Each class is structured so a topic feels truly completed. ALP Sir explains every topic from multiple perspectives and builds the right way of thinking, not just the right answers.'},
                {name:'Vanshaj Jaiman', role:'CAT 2026 cohort', text:'The two-way live classes are what make GRADSKOOL stand apart. I could clear every doubt in the session itself. The 27-student limit is not marketing — you feel it in every class.'},
                {name:'Sameer Ansari', role:'CAT & XAT · PI WAT GD', text:'From CAT to XAT, ALP Sir stood with us at every step. Mock interviews prepared me for exactly what I faced in the actual B-school interviews. This level of mentorship is genuinely rare.'},
              ].map(t => (
                <div key={t.name} className="testi-card fi">
                  <div style={{ color:'var(--red)', fontSize:14, marginBottom:14 }}>★★★★★</div>
                  <p style={{ fontFamily:'var(--font-body)', fontSize:14, color:'var(--g700)', lineHeight:1.85, flex:1, marginBottom:20 }}>"{t.text}"</p>
                  <div>
                    <div style={{ fontFamily:'var(--font-serif)', fontSize:14, color:'var(--black)' }}>{t.name}</div>
                    <div style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'var(--g500)', marginTop:2 }}>{t.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section" style={{ background:'var(--black)', paddingBottom:80 }}>
          <div className="container">
            <div className="eyebrow" style={{ marginBottom:14, color:'#999' }}><span className="dot" />One-on-one, explained</div>
            <h2 className="d-lg" style={{ color:'#fff', marginBottom:48 }}>What ₹2,00,000 actually buys you.</h2>
            <div className="justify-grid">
              {[
                ['01','Your pace, not the batch\'s','Sessions move at the speed you need — more time on weak areas, less on what you\'ve already mastered.'],
                ['02','Personal diagnosis','Every mock is broken down against your specific pattern of errors, not a generic class-wide analysis.'],
                ['03','Direct access','Message ALP Sir directly between sessions — no routing through a support queue or teaching assistant.'],
                ['04','Beyond the exam','Unlimited counselling and form-filling guidance carry through to admission, not just test day.'],
              ].map(([num, title, desc]) => (
                <div key={num} className="justify-card fi">
                  <div className="justify-num">{num}</div>
                  <div style={{ fontFamily:'var(--font-serif)', fontSize:15, color:'#fff', marginBottom:8 }}>{title}</div>
                  <p style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'#999', lineHeight:1.7 }}>{desc}</p>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:28 }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:'var(--red)', flexShrink:0 }} />
              <p style={{ fontFamily:'var(--font-sans)', fontSize:12.5, color:'#999' }}>Limited to a handful of students at a time — 1:1 is taught personally by Abhishek, not delegated.</p>
            </div>
          </div>
        </section>

        <section className="section" style={{ background:'var(--off)' }}>
          <div className="container">
            <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />Pick your path</div>
            <h2 className="d-lg" style={{ marginBottom:48 }}>From cohort learning to <em style={R}>one-on-one</em> with ALP Sir.</h2>
            <div className="tiers-grid">
              <div className="tier-card premium fi">
                <span style={{ display:'inline-block', fontFamily:'var(--font-sans)', fontSize:10, fontWeight:600, letterSpacing:'.08em', textTransform:'uppercase', background:'var(--red)', color:'#fff', padding:'3px 10px', borderRadius:1, marginBottom:14, alignSelf:'flex-start' }}>1:1 with ALP Sir</span>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:17, marginBottom:6 }}>One-on-One</div>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:26, marginBottom:6 }}>₹2,00,000</div>
                <p style={{ fontFamily:'var(--font-sans)', fontSize:11.5, color:'#999', marginBottom:14 }}>CAT & GMAT · 90 hours live, 3× 1.5hr sessions/week</p>
                <ul>
                  <li><span className="li-dash">—</span>Taught directly by Abhishek Leela Pandey</li>
                  <li><span className="li-dash">—</span>Full mocks included</li>
                  <li><span className="li-dash">—</span>Unlimited counselling</li>
                  <li><span className="li-dash">—</span>Form-filling guidance</li>
                  <li><span className="li-dash">—</span>Fully personalised pace and focus areas</li>
                </ul>
                <Link href={APPLY_1_1_URL} className="btn btn-red" style={{ justifyContent:'center' }}>Apply for 1:1 →</Link>
              </div>

              <div className="tier-card fi">
                <div style={{ fontFamily:'var(--font-serif)', fontSize:17, color:'var(--black)', marginBottom:6 }}>CAThlete</div>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:26, color:'var(--black)', marginBottom:6 }}>₹6,999</div>
                <p style={{ fontFamily:'var(--font-sans)', fontSize:11.5, color:'var(--g500)', marginBottom:14 }}>CAT 2026 crash course · starts September</p>
                <ul>
                  <li><span className="li-dash">—</span>Live two-way sessions</li>
                  <li><span className="li-dash">—</span>Full mocks included</li>
                  <li><span className="li-dash">—</span>Session PDFs + cheat sheets</li>
                </ul>
                <Link href="/refund-policy" style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'var(--g500)', textDecoration:'underline', marginBottom:14 }}>Refund policy</Link>
                <Link href="/courses/cat/cat-crash-course-2026" className="btn btn-red" style={{ justifyContent:'center' }}>Enrol Now →</Link>
              </div>

              <div className="tier-card featured fi">
                <span style={{ display:'inline-block', fontFamily:'var(--font-sans)', fontSize:10, fontWeight:600, letterSpacing:'.08em', textTransform:'uppercase', background:'var(--red)', color:'#fff', padding:'3px 10px', borderRadius:1, marginBottom:14, alignSelf:'flex-start' }}>Most Popular</span>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:17, color:'var(--black)', marginBottom:6 }}>CATalysis — Live + Mocks</div>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:26, color:'var(--black)', marginBottom:6 }}>₹27,999</div>
                <p style={{ fontFamily:'var(--font-sans)', fontSize:11.5, color:'var(--g500)', marginBottom:14 }}>CAT 2027 flagship cohort · incl. GST</p>
                <ul>
                  <li><span className="li-dash">—</span>400+ hours live two-way sessions</li>
                  <li><span className="li-dash">—</span>30 full mocks + 30 sectional tests</li>
                  <li><span className="li-dash">—</span>Post-test strategic analysis</li>
                  <li><span className="li-dash">—</span>Doubt resolution + cheat sheets</li>
                </ul>
                <Link href="/refund-policy" style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'var(--g500)', textDecoration:'underline', marginBottom:14 }}>Refund policy</Link>
                <Link href="/courses/cat" className="btn btn-red" style={{ justifyContent:'center' }}>Enrol Now →</Link>
              </div>

              <div className="tier-card fi">
                <div style={{ fontFamily:'var(--font-serif)', fontSize:17, color:'var(--black)', marginBottom:6 }}>GMAT Focus Edition</div>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:26, color:'var(--black)', marginBottom:6 }}>₹34,999</div>
                <p style={{ fontFamily:'var(--font-sans)', fontSize:11.5, color:'var(--g500)', marginBottom:14 }}>Live + Mocks · ISB, INSEAD, LBS & global MBA</p>
                <ul>
                  <li><span className="li-dash">—</span>Live two-way GMAT sessions with ALP</li>
                  <li><span className="li-dash">—</span>Quantitative · Verbal · Data Insights</li>
                  <li><span className="li-dash">—</span>Full-length GMAT Focus Edition mocks</li>
                  <li><span className="li-dash">—</span>Post-test strategic analysis</li>
                </ul>
                <Link href="/refund-policy" style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'var(--g500)', textDecoration:'underline', marginBottom:14 }}>Refund policy</Link>
                <Link href="/courses/gmat" className="btn btn-red" style={{ justifyContent:'center' }}>Enrol Now →</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="founder-section">
          <div className="founder-l">
            <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />Founded By</div>
            <h2 className="d-lg" style={{ marginBottom:24 }}>Abhishek Leela Pandey</h2>
            <div className="creds-row">
              {[['99.93','CAT Percentile'],['770','GMAT Score'],['100K+','Students Mentored']].map(([v,l]) => (
                <div key={l} className="cred">
                  <div style={{ fontFamily:'var(--font-serif)', fontSize:22, color:'var(--black)', marginBottom:4 }}>{v}</div>
                  <div style={{ fontFamily:'var(--font-sans)', fontSize:10.5, color:'var(--g500)' }}>{l}</div>
                </div>
              ))}
            </div>
            <div className="cred-chip-grid" style={{ marginBottom:24 }}>
              <div className="cred-chip"><b>Author</b>8 published books spanning fiction, philosophy, mathematics, and strategy.</div>
              <div className="cred-chip"><b>ALPgebra</b>A CAT/GMAT algebra framework — 99 interconnected theorems, 19 chapters, 1,485 curated problems.</div>
              <div className="cred-chip"><b>TradeFlock 40 Under 40</b>Recognised in 2024 among India's top 40 business leaders under 40.</div>
            </div>
            <p style={{ fontFamily:'var(--font-body)', fontSize:14, color:'var(--g700)', lineHeight:1.9, maxWidth:520 }}>
              12 years mentoring MBA aspirants at TIME, Career Launcher, IMS and leading coaching institutions before founding GRADSKOOL.
            </p>
          </div>
          <div className="founder-r">
            <img src="/assets/alp.jpg" alt="Abhishek Leela Pandey — Founder of GRADSKOOL. 99.93 percentile CAT, 770 GMAT." style={{ width:'100%', maxWidth:280, borderRadius:4 }} />
          </div>
        </section>

        <section className="section">
          <div className="container" style={{ maxWidth:820 }}>
            <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />Before You Decide</div>
            <h2 className="d-lg" style={{ marginBottom:32 }}>Frequently asked <em style={R}>questions.</em></h2>
            {FAQS.map((faq, i) => (
              <div key={faq.q} className="faq-item">
                <button className="faq-q" onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                  <span>{faq.q}</span>
                  <span style={{ fontSize:20, color:'var(--red)', flexShrink:0, marginLeft:16, transform: openFaq === i ? 'rotate(45deg)' : 'none', transition:'transform .2s' }}>+</span>
                </button>
                {openFaq === i && <p className="faq-a">{faq.a}</p>}
              </div>
            ))}
          </div>
        </section>

        <section style={{ background:'var(--black)', padding:'72px 0', textAlign:'center' }}>
          <div className="container">
            <h2 className="d-lg" style={{ color:'#fff', marginBottom:24 }}>Ready to prepare the right way?</h2>
            <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
              <Link href="/courses/cat/cat-crash-course-2026" className="btn btn-red">Enrol in CAThlete — ₹6,999</Link>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                <span className="wa-dot" />WhatsApp ALP Sir first
              </a>
            </div>
          </div>
        </section>
      </main>

      <div className="mob-sticky">
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="btn btn-wa" style={{ flex:1, justifyContent:'center' }}>WhatsApp</a>
        <Link href="/courses/cat/cat-crash-course-2026" className="btn btn-red" style={{ flex:1, justifyContent:'center' }}>Enrol · ₹6,999</Link>
      </div>
    </>
  )
}
/**
 * GRADSKOOL — Homepage
 * Matches gradskool.in exactly:
 * Countdown → Hero → Stats → Results Ticker → CATalysis → WhatsApp Results
 * → CAThlete Strip → Other Courses → Self-paced strip → Comparison
 * → Testimonials → Student Stories → Blog → Founder → Final CTA
 */
import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import PageSEO, { faqSchema, reviewsSchema } from '../components/seo/PageSEO'

/* ─── shared styles injected once ─── */
const S = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}
  body{font-family:var(--font-sans);color:var(--black);background:#fff;line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}
  a{text-decoration:none;color:inherit}
  img,video{max-width:100%;display:block}
  button{border:none;background:none;cursor:pointer;font-family:inherit}
  .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
  /* Type */
  .d-xl{font-family:var(--font-serif);font-size:clamp(36px,5vw,60px);font-weight:400;line-height:1.03;letter-spacing:-.02em;color:var(--black)}
  .d-lg{font-family:var(--font-serif);font-size:clamp(26px,3.2vw,38px);font-weight:400;line-height:1.12;letter-spacing:-.015em;color:var(--black)}
  .eyebrow{font-family:var(--font-sans);font-size:11px;font-weight:600;letter-spacing:.13em;text-transform:uppercase;color:var(--g500);display:flex;align-items:center;gap:8px}
  .eyebrow .dot{width:5px;height:5px;border-radius:50%;background:var(--red);flex-shrink:0}
  /* Buttons */
  .btn{display:inline-flex;align-items:center;gap:7px;font-family:var(--font-sans);font-size:13px;font-weight:600;letter-spacing:.02em;padding:12px 26px;border-radius:var(--radius);transition:all var(--t);cursor:pointer;white-space:nowrap;border:2px solid transparent;text-decoration:none}
  .btn-red{background:var(--red);color:#fff;border-color:var(--red)}
  .btn-red:hover{background:var(--red-hover);transform:translateY(-1px);box-shadow:0 4px 12px rgba(217,79,80,.3)}
  .btn-white{background:#fff;color:var(--black);border-color:#fff}
  .btn-white:hover{background:var(--g100)}
  .btn-ghost{background:transparent;color:#fff;border-color:#444}
  .btn-ghost:hover{border-color:#fff}
  .btn-wa{background:transparent;color:var(--black);border-color:var(--g200)}
  .btn-wa:hover{border-color:#25D366}
  .wa-dot{width:8px;height:8px;border-radius:50%;background:#25D366;flex-shrink:0}
  .link-arr{font-family:var(--font-sans);font-size:13px;font-weight:500;color:var(--g700);border-bottom:1px solid var(--g300);padding-bottom:2px;transition:color var(--t),border-color var(--t);text-decoration:none}
  .link-arr:hover{color:var(--black);border-color:var(--black)}
  /* Layout */
  .container{max-width:1200px;margin:0 auto;padding:0 40px}
  .section{padding:80px 0;border-bottom:var(--border)}
  /* Ticker */
  @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
  @media(prefers-reduced-motion:reduce){#gs-ticker{animation:none}}
  /* Fade in */
  .fi{opacity:0;transform:translateY(18px);transition:opacity .55s ease,transform .55s ease}
  .fi.vis{opacity:1;transform:translateY(0)}
  /* Stages */
  .stages{display:grid;grid-template-columns:repeat(5,1fr);gap:1px;background:var(--g200);border:var(--border);border-radius:4px;overflow:hidden}
  .stage-card{background:#fff;padding:28px 20px;position:relative;transition:background var(--t)}
  .stage-card:hover{background:var(--off)}
  .stage-bg{position:absolute;top:10px;right:14px;font-family:var(--font-serif);font-size:52px;font-weight:700;color:var(--g100);line-height:1;user-select:none}
  /* Plan card */
  .plan-card{background:var(--off);border:var(--border);border-radius:4px;padding:32px 36px;display:flex;align-items:flex-start;justify-content:space-between;gap:24px;flex-wrap:wrap;transition:box-shadow var(--t)}
  .plan-card:hover{box-shadow:var(--shadow)}
  /* Courses grid */
  .courses-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--g200);border:var(--border);border-radius:4px;overflow:hidden}
  .course-cell{background:#fff;padding:26px 22px;display:block;transition:background var(--t);text-decoration:none}
  .course-cell:hover{background:var(--off)}
  /* Testimonials */
  .testi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--g200);border:var(--border);border-radius:4px;overflow:hidden}
  .testi-card{background:#fff;padding:32px;display:flex;flex-direction:column}
  /* Founder */
  .founder-section{display:grid;grid-template-columns:1fr 360px;border-bottom:var(--border)}
  .founder-l{padding:80px 64px 80px 40px;border-right:var(--border)}
  .founder-r{background:var(--off);display:flex;align-items:center;justify-content:center;padding:48px}
  .creds-row{display:flex;gap:1px;background:var(--g200);border:var(--border);border-radius:3px;overflow:hidden;margin-bottom:28px}
  .cred{background:#fff;padding:18px 22px;flex:1}
  /* Comparison table */
  .compare-table{width:100%;border-collapse:collapse;font-family:var(--font-sans)}
  .compare-table th,.compare-table td{padding:14px 20px}
  /* Responsive */
  @media(max-width:960px){
    .container{padding:0 24px}
    .stages{grid-template-columns:repeat(2,1fr)}
    .stages .stage-card:last-child{grid-column:span 2}
    .testi-grid{grid-template-columns:1fr}
    .founder-section{grid-template-columns:1fr}
    .founder-l{padding:48px 24px;border-right:none;border-bottom:var(--border)}
    .founder-r{padding:36px 24px}
    .courses-grid{grid-template-columns:repeat(2,1fr)}
    .creds-row{flex-direction:column}
  }
  @media(max-width:600px){
    .section{padding:56px 0}
    .stages{grid-template-columns:1fr}
    .stages .stage-card:last-child{grid-column:span 1}
    .courses-grid{grid-template-columns:1fr}
  }
  /* WA Float */
  .wa-float{position:fixed;bottom:28px;right:28px;z-index:999;display:flex;align-items:center;gap:8px;background:#25D366;color:#fff;font-family:var(--font-sans);font-size:13px;font-weight:600;padding:13px 22px;border-radius:50px;box-shadow:0 4px 20px rgba(37,211,102,.38);transition:transform var(--t),box-shadow var(--t);text-decoration:none}
  .wa-float:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(37,211,102,.48)}
  /* Mobile sticky */
  .mob-sticky{display:none;position:fixed;bottom:0;left:0;right:0;z-index:998;background:#fff;border-top:var(--border);padding:12px 20px;align-items:center;justify-content:space-between;box-shadow:0 -4px 20px rgba(0,0,0,.1)}
  @media(max-width:960px){.mob-sticky{display:flex} .wa-float{bottom:86px;right:16px;padding:11px 18px;font-size:12px}}
  /* Proof popup */
  .proof-popup{position:fixed;bottom:28px;left:28px;z-index:997;background:#fff;border:var(--border);border-radius:6px;padding:14px 18px 14px 14px;box-shadow:var(--shadow);max-width:290px;display:none;align-items:center;gap:12px}
  .proof-popup.visible{display:flex;animation:slideUp .4s ease}
  @keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @media(max-width:960px){.proof-popup{bottom:86px;left:16px}}
  /* Countdown strip */
  .cd-strip{background:var(--black);padding:10px 0;text-align:center;border-bottom:var(--border)}
  .cd-block{display:flex;flex-direction:column;align-items:center;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:3px;padding:4px 10px;min-width:50px}
`

const PROOFS = [
  {name:'Kavya R.',detail:'enrolled in CAThlete',time:'2 min ago',city:'Mumbai'},
  {name:'Arjun S.',detail:'enrolled in CAThlete',time:'11 min ago',city:'Delhi'},
  {name:'Priya M.',detail:'started GMAT preparation',time:'24 min ago',city:'Bangalore'},
  {name:'Rohan K.',detail:'enrolled in CATalysis 2027',time:'38 min ago',city:'Pune'},
  {name:'Sneha T.',detail:'enrolled in CAThlete',time:'1 hr ago',city:'Hyderabad'},
  {name:'Aditya V.',detail:'enrolled in CATalysis 2027',time:'6 min ago',city:'Chennai'},
  {name:'Meera J.',detail:'started ALPgebra',time:'17 min ago',city:'Ahmedabad'},
  {name:'Karan D.',detail:'enrolled in XAT Full Course',time:'29 min ago',city:'Kolkata'},
  {name:'Ishita P.',detail:'started GMAT preparation',time:'44 min ago',city:'Jaipur'},
  {name:'Varun N.',detail:'enrolled in CAThlete',time:'52 min ago',city:'Mumbai'},
  {name:'Ananya B.',detail:'enrolled in SNAP Mocks',time:'8 min ago',city:'Pune'},
  {name:'Siddharth L.',detail:'enrolled in NMAT Mocks',time:'19 min ago',city:'Delhi'},
  {name:'Tanvi G.',detail:'started ALPgebra',time:'33 min ago',city:'Bangalore'},
  {name:'Yash M.',detail:'enrolled in CATalysis 2027',time:'47 min ago',city:'Indore'},
  {name:'Riya K.',detail:'enrolled in CAThlete',time:'1 hr ago',city:'Chandigarh'},
  {name:'Nikhil T.',detail:'enrolled in XAT Full Course',time:'1 hr ago',city:'Lucknow'},
]

const TESTIMONIALS = [
  { text:"Being part of GRADSKOOL has been a completely different learning experience. Each class is structured so a topic feels truly completed. Learning from ALP Sir is something special — he explains every topic from multiple perspectives and builds the right way of thinking, not just the right answers.", name:'Keshav Mundra', detail:'GMAT Cohort' },
  { text:"The structure and execution are unlike anything I have experienced before. The two-way live classes are what make GRADSKOOL stand apart. I could clear every doubt in the session itself — no waiting, no ambiguity. The 27-student limit is not marketing. You feel it in every class.", name:'Vanshaj Jaiman', detail:'CAT 2026 Cohort' },
  { text:"From my CAT journey to XAT, ALP Sir stood with us at every step. The GDPI preparation was perfectly structured. The mock interviews prepared me for exactly what I faced in the actual B-school interviews. This level of mentorship is genuinely rare.", name:'Sameer Ansari', detail:'CAT & XAT · PI WAT GD Cohort' },
]

const WA_RESULTS = [
  { name:'Sreeja Biswas', msg:'hello sir\ni got into iim k\nthank you so much for all your help', college:'IIM Kozhikode', color:'#d94f50' },
  { name:'Prathamesh Mulay', msg:'Grateful to share that I have converted NMIMS Mumbai – Core MBA. This milestone would not have been possible without the constant guidance of ALP Sir and the entire GradSkool team.', college:'NMIMS Mumbai Core', color:'#1a6e3c' },
  { name:'Devang', msg:'Sir Good Morning\nIIM Amritsar convert\nThank you sir', college:'IIM Amritsar', color:'#d94f50' },
  { name:'Avi Krishna', msg:'Grateful to have converted NMIMS Mumbai Core! A big thank you to ALP Sir and the entire team at Gradskool for their constant guidance, mentorship, and belief in me throughout this journey.', college:'NMIMS Mumbai Core', color:'#1a6e3c' },
  { name:'Shubhayu Das', msg:'Balancing studies alongside a full-time job was challenging, but the mentorship of Abhishek Sir made a significant difference. The GDPI guidance was instrumental in building my confidence.', college:'NMIMS · IMI · IMT', color:'#1a5c8a' },
  { name:'Ishan', msg:'Gradskool has really helped me improve my confidence, communication, readiness for NMIMS interview. In just a week I was able to get ready with the help of Gradskool.', college:'NMIMS Competency Test', color:'#1a6e3c' },
]

const STORIES = [
  { href:'/stories/sreeja-biswas-iim-kozhikode', tag:'Student of ALP Sir', tagColor:'var(--red)', name:'Sreeja Biswas', college:'IIM Kozhikode', excerpt:'From maths fear to IIM Kozhikode. Her story is part of why GRADSKOOL was built.' },
  { href:'/stories/prathamesh-mulay-nmims-mumbai', tag:'NMIMS Convert', tagColor:'#1a6e3c', name:'Prathamesh Mulay', college:'NMIMS Mumbai Core MBA', excerpt:'The marathon sessions and Competency Test mock preparation made the difference.' },
  { href:'/stories/avivratta-krishna-nmims-mumbai', tag:'NMIMS Convert', tagColor:'#1a6e3c', name:'Avivratta Krishna', college:'NMIMS Mumbai Core', excerpt:'Constant guidance and belief from the GRADSKOOL team throughout the journey.' },
  { href:'/stories/shubhayu-das-nmims-imi-imt', tag:'Multiple Converts', tagColor:'#1a5c8a', name:'Shubhayu Das', college:'NMIMS · IMI · IMT', excerpt:'Working professional. Three converts. GDPI preparation made the difference.' },
  { href:'/stories/dhruv-jangid-imt-ghaziabad', tag:'IMT Convert', tagColor:'#6b3fa0', name:'Dhruv Jangid', college:'IMT Ghaziabad', excerpt:'Structure and clarity. Rigorous sessions and post-mock feedback that changed everything.' },
]

const BLOGS = [
  { href:'/blog/cat-varc-rc-strategy', tag:'CAT Strategy', title:'CAT VARC — RC strategy that actually works', excerpt:'The RC section separates good scorers from great ones. A systematic approach to reading comprehension that compounds with every passage.' },
  { href:'/blog/gmat-focus-edition', tag:'GMAT', title:'GMAT Focus Edition — what changed and how to prepare', excerpt:'Shorter format, no AWA, new Data Insights section. Here is exactly what the new GMAT means for your preparation strategy.' },
  { href:'/blog/cat-percentile-vs-score', tag:'CAT Strategy', title:'CAT percentile vs score — normalisation explained', excerpt:'Why your raw score is not your percentile, and how the normalisation process works across CAT exam slots.' },
]

export default function Home() {
  const [countdown, setCountdown] = useState({ d:0, h:'00', m:'00', s:'00' })
  const [proof, setProof] = useState(null)
  const [proofVisible, setProofVisible] = useState(false)

  // Countdown to CAT 2026 — 29 Nov 2026 09:00 IST (the actual upcoming exam;
  // CAThlete crash-courses toward this. CATalysis is sold as the 2027 cohort
  // — that's a separate product-year label, not the exam date.)
  useEffect(() => {
    const target = new Date('2026-11-29T09:00:00+05:30').getTime()
    const tick = () => {
      const diff = target - Date.now()
      if (diff <= 0) return
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setCountdown({ d, h:String(h).padStart(2,'0'), m:String(m).padStart(2,'0'), s:String(s).padStart(2,'0') })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // Social proof popup
  useEffect(() => {
    let lastIdx = -1
    const show = () => {
      let idx = Math.floor(Math.random() * PROOFS.length)
      if (idx === lastIdx) idx = (idx + 1) % PROOFS.length
      lastIdx = idx
      setProof(PROOFS[idx])
      setProofVisible(true)
      setTimeout(() => { setProofVisible(false); setTimeout(show, 4000) }, 7000)
    }
    const t = setTimeout(show, 5000)
    return () => clearTimeout(t)
  }, [])

  // Fade-in observer
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
  const G5 = { color:'var(--g500)' }

  return (
    <>
      <PageSEO
        title="GRADSKOOL — CAThlete CAT Crash Course & GMAT Prep by ALP Sir"
        description="India's most structured CAT and GMAT preparation. ALP Sir — 99.93 percentile CAT, 770 GMAT. Live two-way sessions, 27 students per cohort. CAThlete crash course, CATalysis 2027, XAT, NMAT, SNAP, MAHCET, plus free Foundations classes."
        keywords="CAThlete crash course, CAT crash course, GMAT preparation India, CATalysis CAT 2027, Abhishek Leela Pandey, ALP Sir, GRADSKOOL, MBA preparation India, XAT preparation, NMAT coaching, free foundations classes"
        canonical="https://gradskool.in/"
        ogImage="/assets/og-image.jpg"
        breadcrumbs={[{name:'Home',url:'/'}]}
        speakableSelectors={['h1','p.hero-sub']}
        schema={[
          faqSchema([
            {q:'What is CAThlete by GRADSKOOL?',a:'CAThlete is GRADSKOOL\'s intensive CAT crash course for the final months before the exam. Available without mocks for ₹6,999 and with mocks for ₹9,999. Designed for structured, rapid preparation.'},
            {q:'What is CATalysis by GRADSKOOL?',a:"CATalysis 2027 is GRADSKOOL's flagship full-year CAT cohort. It follows a 5-stage learning framework: Intro Video, Live Session with PDF, Cheat Sheet, Quiz, and Doubt Resolution. Every cohort is capped at 27 students for personalised mentorship from ALP Sir."},
            {q:'What makes GRADSKOOL different from other CAT coaching?',a:'GRADSKOOL caps every cohort at 27 students, enabling genuine two-way live teaching. ALP Sir, 99.93 percentile CAT and 770 GMAT, teaches every session. No coordinators. Direct instructor access.'},
            {q:'Who is ALP Sir?',a:'Abhishek Leela Pandey (ALP Sir) scored 99.93 percentile in CAT and 770 in GMAT. He is the founder of GRADSKOOL and has mentored 100,000+ students over 12 years at TIME, Career Launcher, IMS and leading MBA coaching institutions.'},
            {q:'Are there free classes before I commit to a paid course?',a:'Yes — Foundations offers free live and recorded classes for XAT, SNAP, and NMAT, taught by ALP Sir, no cost to watch.'},
          ]),
          reviewsSchema([
            {name:'Keshav Mundra',text:'Learning from ALP Sir is something special. He explains every topic from multiple perspectives and builds the right way of thinking, not just the right answers.'},
            {name:'Vanshaj Jaiman',text:'The structure and execution are unlike anything I have experienced. The two-way live classes are what make GRADSKOOL stand apart.'},
            {name:'Sameer Ansari',text:'From my CAT journey to XAT, ALP Sir stood with us at every step. The GDPI preparation was perfectly structured.'},
          ]),
          {
            "@context":"https://schema.org","@type":"ItemList","name":"GRADSKOOL Courses",
            "numberOfItems":7,
            "itemListElement":[
              {position:1,item:{name:'CAThlete — CAT Crash Course',url:'https://gradskool.in/courses/cat/cathlete',offers:{price:'6999',priceCurrency:'INR'}}},
              {position:2,item:{name:'CATalysis — CAT 2027',url:'https://gradskool.in/courses/cat',offers:{price:'17999',priceCurrency:'INR'}}},
              {position:3,item:{name:'XAT Course',url:'https://gradskool.in/courses/xat',offers:{price:'5999',priceCurrency:'INR'}}},
              {position:4,item:{name:'NMAT Mocks',url:'https://gradskool.in/courses/nmat',offers:{price:'2999',priceCurrency:'INR'}}},
              {position:5,item:{name:'SNAP Mocks',url:'https://gradskool.in/courses/snap',offers:{price:'2999',priceCurrency:'INR'}}},
              {position:6,item:{name:'MAHCET',url:'https://gradskool.in/courses/mhcet',offers:{price:'7999',priceCurrency:'INR'}}},
              {position:7,item:{name:'GMAT Focus Edition',url:'https://gradskool.in/courses/gmat',offers:{price:'19999',priceCurrency:'INR'}}},
            ].map(({position,item}) => ({
              "@type":"ListItem",position,
              "item":{...item,"@type":"Course","provider":{"@id":"https://gradskool.in/#organization"}}
            }))
          }
        ]}
      />
      <style>{S}</style>

      {/* ── COUNTDOWN ── */}
      <div className="cd-strip">
        <div className="container">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:20, flexWrap:'wrap' }}>
            <span style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:500, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--g500)' }}>CAT 2026 Exam</span>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              {[['d','Days'],['h','Hrs'],['m','Min'],['s','Sec']].map(([k,u], i) => (
                <span key={k} style={{ display:'flex', alignItems:'center', gap:6 }}>
                  {i > 0 && <span style={{ fontSize:18, color:'#444', marginBottom:10 }}>:</span>}
                  <div className="cd-block">
                    <span style={{ fontFamily:'var(--font-serif)', fontSize:22, fontWeight:700, color:'#fff', lineHeight:1 }}>{countdown[k]}</span>
                    <span style={{ fontFamily:'var(--font-sans)', fontSize:9, fontWeight:500, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--g500)', marginTop:2 }}>{u}</span>
                  </div>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main>
        {/* ── HERO ── */}
        <section style={{ display:'grid', gridTemplateColumns:'600px 1fr', minHeight:'calc(100vh - 104px)', maxHeight:820, borderBottom:'var(--border)' }}
          className="hero-grid">
          <style>{`@media(max-width:960px){.hero-grid{grid-template-columns:1fr!important;max-height:none!important}.hero-r{min-height:280px}}.hero-l{padding:72px 56px 64px 40px;border-right:var(--border);display:flex;flex-direction:column;justify-content:space-between}.hero-r{background:var(--off);display:flex;align-items:center;justify-content:center;padding:24px;overflow:hidden}@media(max-width:960px){.hero-l{padding:48px 24px 40px!important;border-right:none!important;border-bottom:var(--border)}.hero-r{padding:40px 24px!important}}`}</style>
          <div className="hero-l">
            <div>
              <div className="eyebrow" style={{ marginBottom:22 }}><span className="dot" /><span>CAThlete — Crash Course Now Open</span></div>
              <h1 className="d-xl" style={{ margin:'0 0 22px' }}>India's most<br /><em style={R}>structured</em><br />CAT &amp; GMAT prep.</h1>
              <p style={{ fontFamily:'var(--font-body)', fontSize:15, color:'var(--g700)', lineHeight:1.85, maxWidth:440, marginBottom:36 }}>
                Founded by Abhishek Leela Pandey — 99.93 percentile CAT, 770 GMAT. Live two-way teaching, not recorded lectures. Every cohort capped at 27 students. No exceptions.
              </p>
              <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                <Link href="/courses/cat/cathlete" className="btn btn-red">Explore CAThlete →</Link>
                <a href="https://wa.me/917838737388?text=Hi%20ALP%20Sir%2C%20I%20want%20to%20know%20more%20about%20GRADSKOOL"
                  target="_blank" rel="noopener noreferrer" className="btn btn-wa">
                  <span className="wa-dot" />WhatsApp ALP Sir
                </a>
              </div>
            </div>
            <p style={{ fontFamily:'var(--font-sans)', fontSize:12, fontWeight:500, color:'var(--g500)', marginTop:44, display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ width:20, height:1, background:'var(--g300)', display:'inline-block' }} />
              Trusted by 100,000+ students across India
            </p>
          </div>
          <div className="hero-r">
            <div style={{ width:'100%', maxWidth:'100%', aspectRatio:'16/9', borderRadius:4, overflow:'hidden', background:'var(--g200)', boxShadow:'var(--shadow)' }}>
              <video loop playsInline preload="auto" controls style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}>
                <source src="https://res.cloudinary.com/dz1nitcme/video/upload/q_auto/f_auto/v1780429043/CAT_2023_Hardest_Paper_2_q3k5gk.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
        </section>

        {/* ── STATS ── */}
        <div style={{ background:'var(--black)', borderBottom:'var(--border)' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', maxWidth:1200, margin:'0 auto', padding:'0 40px' }} className="stats-grid">
            <style>{`@media(max-width:700px){.stats-grid{grid-template-columns:repeat(2,1fr)!important;padding:0 20px!important}.stats-grid>div{padding:24px 16px!important}}`}</style>
            {[['100K+','Students Mentored'],['5,000+','IIM & Top B-School Converts'],['27','Students Per Cohort, Always'],['4.9★','347 Student Reviews']].map(([n,l]) => (
              <div key={l} style={{ padding:'32px 36px', borderRight:'1px solid rgba(255,255,255,.08)' }}>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:34, fontWeight:400, color:'#fff', lineHeight:1, marginBottom:5 }}>{n}</div>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:500, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--g500)' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RESULTS TICKER ── */}
        <div style={{ background:'#fff', borderBottom:'var(--border)', overflow:'hidden' }}>
          <div style={{ display:'flex', alignItems:'center' }}>
            <div style={{ background:'var(--red)', padding:'12px 20px', flexShrink:0, fontFamily:'var(--font-sans)', fontSize:10, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color:'#fff', whiteSpace:'nowrap' }}>
              Our Students
            </div>
            <div style={{ overflow:'hidden', flex:1 }}>
              <div id="gs-ticker" style={{ display:'flex', alignItems:'center', whiteSpace:'nowrap', animation:'ticker 28s linear infinite' }}>
                {['Sreeja Biswas — IIM Kozhikode','Prathamesh Mulay — NMIMS Mumbai Core MBA','Avivratta Krishna — NMIMS Mumbai Core','Devang — IIM Amritsar','Sameer Ansari — NMIMS Mumbai','Shubhayu Das — NMIMS · IMI · IMT','Dhruv Jangid — IMT Ghaziabad','Saketh — NMIMS Mumbai General MBA',
                  'Sreeja Biswas — IIM Kozhikode','Prathamesh Mulay — NMIMS Mumbai Core MBA','Avivratta Krishna — NMIMS Mumbai Core','Devang — IIM Amritsar'].map((name,i) => (
                  <span key={i} style={{ padding:'12px 32px', fontFamily:'var(--font-serif)', fontSize:15, color:'var(--black)', borderRight:'var(--border)' }}>{name}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── CATHLETE STRIP ── */}
        <div style={{ background:'linear-gradient(135deg,#1a1a18 55%,#2a2927)', borderTop:'var(--border)', borderBottom:'var(--border)', padding:'40px 0', position:'relative', overflow:'hidden' }}>
          <div className="container">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:32, flexWrap:'wrap' }}>
              <div>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:600, letterSpacing:'.14em', textTransform:'uppercase', color:'var(--red)', marginBottom:8 }}>CAT 2026 · Crash Course · Featured</div>
                <h2 style={{ fontFamily:'var(--font-serif)', fontSize:'clamp(22px,3vw,30px)', fontWeight:400, color:'#fff', lineHeight:1.15, marginBottom:6 }}>CAThlete — <em style={{ fontStyle:'italic', color:'var(--red)' }}>Sprint to CAT 2026.</em></h2>
                <p style={{ fontFamily:'var(--font-sans)', fontSize:13, color:'var(--g500)', lineHeight:1.6 }}>Intensive structured preparation for the final 3 months before CAT 2026.</p>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'var(--g500)', display:'flex', alignItems:'center', gap:6, marginTop:10 }}>
                  <span style={{ width:5, height:5, borderRadius:'50%', background:'var(--red)', flexShrink:0 }} />
                  Starts September 2026 · Limited seats
                </div>
              </div>
              <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                {[['Without Mocks','₹6,999'],['With Mocks','₹9,999']].map(([label,price]) => (
                  <div key={label} style={{ background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.12)', borderRadius:3, padding:'14px 20px', textAlign:'center', minWidth:140 }}>
                    <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:500, letterSpacing:'.07em', textTransform:'uppercase', color:'var(--g500)', marginBottom:6 }}>{label}</div>
                    <div style={{ fontFamily:'var(--font-serif)', fontSize:26, color:'#fff', lineHeight:1 }}>{price}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10, alignItems:'flex-start' }}>
                <Link href="/checkout?course=cathlete" className="btn btn-red">Enrol in CAThlete →</Link>
                <Link href="/courses/cat/cathlete" style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'var(--g500)' }}>Learn more →</Link>
                <a href="https://wa.me/917838737388?text=Hi%20ALP%20Sir%2C%20I%20want%20to%20know%20more%20about%20CAThlete"
                  target="_blank" rel="noopener noreferrer" className="btn btn-ghost"><span className="wa-dot" />Ask about CAThlete</a>
              </div>
            </div>
          </div>
        </div>

        {/* ── CATALYSIS ── */}
        <section className="section">
          <div className="container">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:16, marginBottom:48 }}>
              <div>
                <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />CAT 2027 · Flagship Cohort</div>
                <h2 className="d-lg">CATalysis — <em style={R}>The IIM Route.</em></h2>
                <p style={{ fontFamily:'var(--font-body)', fontSize:15, color:'var(--g700)', marginTop:10, maxWidth:560, lineHeight:1.85 }}>Our flagship CAT 2027 cohort. A 5-stage learning framework that leaves no topic incomplete — from first principles to exam-day strategy.</p>
              </div>
              <Link href="/courses/cat/catalysis" className="link-arr" style={{ flexShrink:0 }}>See full course →</Link>
            </div>

            <div className="stages">
              {[['01','Intro Video','English introduction to every concept. Watch before the live session so no time is lost on basics in class.'],
                ['02','Live Session with PDF','Two-way live teaching with ALP Sir. Questions, challenges, and structured reasoning — not a monologue. Session PDF included.'],
                ['03','Cheat Sheet','A distilled one-pager of every concept, formula, and shortcut. The document you keep open on exam day revision.'],
                ['04','Quiz','Timed practice to test application, not just recall. Immediate explanations for every question.'],
                ['05','Doubt Resolution','Structured doubt sessions so no question goes unanswered. Every concept stays sharp through exam day.'],
              ].map(([num, name, desc]) => (
                <div key={num} className="stage-card fi">
                  <div className="stage-bg">{num}</div>
                  <div style={{ fontFamily:'var(--font-serif)', fontSize:15, color:'var(--black)', lineHeight:1.3, marginBottom:8, position:'relative', zIndex:1 }}>{name}</div>
                  <p style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'var(--g700)', lineHeight:1.6, position:'relative', zIndex:1 }}>{desc}</p>
                </div>
              ))}
            </div>

            {/* Pricing card */}
            <div className="plan-card fi" style={{ marginTop:1 }}>
              <div style={{ flex:1 }}>
                <span style={{ display:'inline-block', fontFamily:'var(--font-sans)', fontSize:10, fontWeight:600, letterSpacing:'.08em', textTransform:'uppercase', background:'var(--red)', color:'#fff', padding:'3px 10px', borderRadius:1, marginBottom:12 }}>Most Popular</span>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:22, color:'var(--black)', marginBottom:14 }}>CATalysis — Live + Mocks</div>
                <div style={{ fontFamily:'var(--font-body)', fontSize:14, color:'var(--g700)', lineHeight:2.1 }}>
                  {['400+ hours of live two-way sessions with ALP Sir','30 full-length CAT mocks + 30 sectional tests','Post-test strategic analysis after every mock','Doubt resolution + session PDFs + cheat sheets'].map(item => (
                    <div key={item}><span style={R}>—</span> {item}</div>
                  ))}
                </div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'var(--g500)', marginBottom:2 }}>Base price</div>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:42, fontWeight:400, color:'var(--black)', lineHeight:1 }}>₹17,999</div>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'var(--g500)', marginBottom:12 }}>+ GST</div>
                <Link href="/checkout?course=cat&plan=live-mocks" className="btn btn-red">Enrol Now →</Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── WHATSAPP RESULTS ── */}
        <section style={{ padding:'80px 0', borderBottom:'var(--border)', background:'var(--off)' }}>
          <div className="container">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:36, flexWrap:'wrap', gap:16 }}>
              <div>
                <div className="eyebrow" style={{ marginBottom:12 }}><span className="dot" />Straight from WhatsApp</div>
                <h2 className="d-lg">What students said<br />when it worked.</h2>
              </div>
              <Link href="/blog" className="link-arr">All student stories →</Link>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}
              className="wa-results-grid">
              <style>{`@media(max-width:960px){.wa-results-grid{grid-template-columns:1fr!important}}`}</style>
              {WA_RESULTS.map((r,i) => (
                <div key={i} style={{ background:'#ece5dd', borderRadius:12, padding:20, display:'flex', flexDirection:'column', gap:10 }}>
                  <div style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, color:'var(--black)', display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ width:8, height:8, borderRadius:'50%', background:'#25D366', flexShrink:0 }} />{r.name}
                  </div>
                  <div style={{ background:'#fff', borderRadius:'0 8px 8px 8px', padding:'12px 14px', fontFamily:'var(--font-sans)', fontSize:13, color:'var(--black)', lineHeight:1.6, boxShadow:'0 1px 2px rgba(0,0,0,.08)', whiteSpace:'pre-line' }}>{r.msg}</div>
                  <div style={{ display:'inline-flex', alignItems:'center', background:r.color, color:'#fff', fontFamily:'var(--font-sans)', fontSize:10, fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', padding:'4px 10px', borderRadius:50, alignSelf:'flex-start' }}>{r.college}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── OTHER COURSES ── */}
        <section className="section">
          <div className="container">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:36, flexWrap:'wrap', gap:16 }}>
              <div>
                <div className="eyebrow" style={{ marginBottom:12 }}><span className="dot" />Also Available</div>
                <h2 className="d-lg">More courses by GRADSKOOL</h2>
              </div>
              <Link href="/courses" className="link-arr">View all →</Link>
            </div>
            <div className="courses-grid">
              {[
                ['/courses/gmat',  'MBA Abroad · Self-Paced',    'GMAT Focus Edition', '₹19,999 · ISB, INSEAD, LBS & global MBA'],
                ['/courses/xat',   'MBA India',                  'XAT',                'XLRI Jamshedpur & XAT B-schools'],
                ['/courses/nmat-snap', 'MBA India · Mocks Bundle',   'SNAP + NMAT',       '₹4,499 · NMIMS · Symbiosis'],
                ['/courses/cat/cathlete', 'CAT 2026 · Crash · Featured', 'CAThlete',    '₹6,999 · Starts September 2026'],
                ['/courses/mhcet', 'MBA Maharashtra',             'MH CET',             'JBIMS, SIMSREE, KJ Somaiya'],
              ].map(([href, tag, name, desc]) => (
                <Link key={href} href={href} className="course-cell">
                  <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--red)', marginBottom:6 }}>{tag}</div>
                  <div style={{ fontFamily:'var(--font-serif)', fontSize:17, color:'var(--black)', marginBottom:5 }}>{name}</div>
                  <div style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'var(--g500)', lineHeight:1.5, marginBottom:12 }}>{desc}</div>
                  <div style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'var(--g500)' }}>Explore →</div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── FOUNDATIONS PROMO ── */}
        <section style={{ padding:'64px 0', background:'var(--off)', borderTop:'var(--border)', borderBottom:'var(--border)' }}>
          <div className="container">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:20, marginBottom:32 }}>
              <div>
                <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />100% Free</div>
                <h2 className="d-lg">Free classes.<br /><em style={{ fontStyle:'italic', color:'var(--red)' }}>Complete free courses.</em></h2>
                <p style={{ fontFamily:'var(--font-body)', fontSize:14, color:'var(--g700)', marginTop:10, maxWidth:480, lineHeight:1.8 }}>
                  CAT and XAT Foundations to get you started, plus the complete NMAT and SNAP courses — every topic, taught live by ALP Sir, entirely free.
                </p>
              </div>
              <Link href="/free" className="btn btn-outline">Explore Free Classes →</Link>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }} className="foundations-promo-grid">
              <style>{`@media(max-width:960px){.foundations-promo-grid{grid-template-columns:1fr!important}}`}</style>
              {[
                ['cat',  'CAT',  '#d94f50', 'Quant, VARC, DILR — the exam everything else is measured against', false],
                ['xat',  'XAT',  '#5b3fa0', 'Decision Making, Verbal & Logical Reasoning, Quant', false],
                ['snap', 'SNAP', '#1a5c8a', 'Quant, VARC, DILR — Symbiosis-pattern practice', true],
                ['nmat', 'NMAT', '#1a6e3c', 'Language Skills, Quant, Logical Reasoning', true],
              ].map(([slug, name, color, tagline, isFullCourse]) => (
                <Link key={slug} href={isFullCourse ? `/courses/${slug}/live` : `/foundations/${slug}`}
                  style={{ background:'#fff', border:'var(--border)', borderRadius:4, padding:'22px 24px', textDecoration:'none', display:'block', transition:'transform var(--t)' }}
                  onMouseEnter={e=>e.currentTarget.style.transform='translateY(-3px)'}
                  onMouseLeave={e=>e.currentTarget.style.transform='none'}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:color, marginBottom:12 }} />
                  <div style={{ fontFamily:'var(--font-serif)', fontSize:19, color:'var(--black)', marginBottom:6 }}>{name}{isFullCourse ? '' : ' Foundations'}</div>
                  <div style={{ fontFamily:'var(--font-sans)', fontSize:12.5, color:'var(--g500)', lineHeight:1.6, marginBottom:14 }}>{tagline}</div>
                  <div style={{ fontFamily:'var(--font-sans)', fontSize:12, fontWeight:600, color:'var(--red)' }}>{isFullCourse ? 'Complete course, free →' : 'Watch free →'}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── FYQ + PDF LIBRARY + GRADSCALE ── */}
        <section style={{ padding:'64px 0', borderBottom:'var(--border)' }}>
          <div className="container">
            <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />More ways to prepare</div>
            <h2 className="d-lg" style={{ marginBottom:32 }}>Beyond the <em style={R}>classroom.</em></h2>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }} className="more-ways-grid">
              <style>{`@media(max-width:900px){.more-ways-grid{grid-template-columns:1fr!important}}`}</style>

              <Link href="/fyqs" style={{ background:'#fff', border:'var(--border)', borderRadius:4, padding:'26px 24px', textDecoration:'none', display:'block', transition:'transform var(--t)' }}
                onMouseEnter={e=>e.currentTarget.style.transform='translateY(-3px)'} onMouseLeave={e=>e.currentTarget.style.transform='none'}>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--red)', marginBottom:10 }}>Question Bank</div>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:20, color:'var(--black)', marginBottom:8 }}>FYQs</div>
                <p style={{ fontFamily:'var(--font-sans)', fontSize:13, color:'var(--g500)', lineHeight:1.7, marginBottom:14 }}>Hundreds of CAT Future Year Questions — real questions, full video solutions, written explanations. Organized by section and topic.</p>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:12, fontWeight:600, color:'var(--red)' }}>Browse FYQs →</div>
              </Link>

              <Link href="/pdfs" style={{ background:'#fff', border:'var(--border)', borderRadius:4, padding:'26px 24px', textDecoration:'none', display:'block', transition:'transform var(--t)' }}
                onMouseEnter={e=>e.currentTarget.style.transform='translateY(-3px)'} onMouseLeave={e=>e.currentTarget.style.transform='none'}>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--red)', marginBottom:10 }}>Study Material</div>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:20, color:'var(--black)', marginBottom:8 }}>PDF Library</div>
                <p style={{ fontFamily:'var(--font-sans)', fontSize:13, color:'var(--g500)', lineHeight:1.7, marginBottom:14 }}>Formula handbooks, topic-wise question banks, and cheat sheets — organized by exam. Read in your account, no downloads.</p>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:12, fontWeight:600, color:'var(--red)' }}>Browse PDF Library →</div>
              </Link>

              <a href="https://www.gradscale.in/" target="_blank" rel="noopener noreferrer" style={{ background:'var(--black)', borderRadius:4, padding:'26px 24px', textDecoration:'none', display:'block', transition:'transform var(--t)' }}
                onMouseEnter={e=>e.currentTarget.style.transform='translateY(-3px)'} onMouseLeave={e=>e.currentTarget.style.transform='none'}>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--red)', marginBottom:10 }}>Daily Practice</div>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:20, color:'#fff', marginBottom:8 }}>GRADSCALE</div>
                <p style={{ fontFamily:'var(--font-sans)', fontSize:13, color:'var(--g500)', lineHeight:1.7, marginBottom:14 }}>GRADSKOOL's dedicated practice platform — daily drills for CAT, XAT, SNAP, and NMAT, between your live sessions.</p>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:12, fontWeight:600, color:'var(--red)' }}>Practice on GRADSCALE →</div>
              </a>
            </div>
          </div>
        </section>

        {/* ── SELF-PACED STRIP ── */}
        <div style={{ background:'var(--g100)', borderTop:'var(--border)', borderBottom:'var(--border)', padding:'20px 0' }}>
          <div className="container">
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
              <span style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--g500)', marginRight:8 }}>Self-Paced</span>
              {[['ALPgebra','/courses/cat/alpgebra'],['CAT Mocks ₹2,999','/courses/cat/mocks'],['Books ₹3,999','/courses/cat/books']].map(([label,href]) => (
                <Link key={href} href={href} style={{ fontFamily:'var(--font-sans)', fontSize:13, color:'var(--black)', padding:'6px 14px', border:'var(--border)', borderRadius:2, background:'#fff', whiteSpace:'nowrap' }}>{label}</Link>
              ))}
              <Link href="/courses" style={{ fontFamily:'var(--font-sans)', fontSize:13, fontWeight:600, color:'var(--red)', padding:'6px 14px', border:'1px solid rgba(217,79,80,.3)', borderRadius:2, background:'#fff', whiteSpace:'nowrap' }}>All Courses →</Link>
            </div>
          </div>
        </div>

        {/* ── COMPARISON TABLE ── */}
        <section style={{ padding:'80px 0', borderBottom:'var(--border)', background:'var(--off)' }}>
          <div className="container">
            <div style={{ marginBottom:36 }}>
              <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />How we compare</div>
              <h2 className="d-lg">GRADSKOOL vs<br /><em style={R}>Other Coaching.</em></h2>
            </div>
            <div style={{ overflowX:'auto' }}>
              <table className="compare-table">
                <thead>
                  <tr>
                    <th style={{ textAlign:'left', fontSize:11, fontWeight:600, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--g500)', borderBottom:'2px solid var(--black)', background:'var(--off)', minWidth:220 }}>Feature</th>
                    <th style={{ textAlign:'center', fontSize:13, fontWeight:700, color:'#fff', background:'var(--black)', borderBottom:'2px solid var(--black)', minWidth:160 }}>GRADSKOOL</th>
                    <th style={{ textAlign:'center', fontSize:13, fontWeight:600, color:'var(--g500)', borderBottom:'2px solid var(--black)', background:'var(--off)', minWidth:160 }}>Other Coaching</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Two-way interactive live sessions','✓','✗'],
                    ['Cohort capped at 27 students','✓','✗'],
                    ['Post-mock strategic analysis','✓','✗'],
                    ['Equal expertise across all sections','✓','✗'],
                    ['Live sessions (not recordings)','✓','✓'],
                    ['Full mocks included','✓','✓'],
                    ['College counselling','✓','Few'],
                    ['CAThlete crash course','✓','Few'],
                    ['GRADSCALE — daily practice drills','✓','Few'],
                    ['GRADFLIX — essay repository','✓','None'],
                  ].map(([feat, gs, other], ri) => (
                    <tr key={feat} style={{ borderBottom:'var(--border)' }}>
                      <td style={{ background:'#fff', fontSize:13, color:'var(--black)', fontWeight:500 }}>{feat}</td>
                      <td style={{ background:'#fff', textAlign:'center' }}>
                        <span style={{ color:'#25a244', fontSize:18, fontWeight:700 }}>{gs === '✓' ? '✓' : gs}</span>
                      </td>
                      <td style={{ background:'var(--off)', textAlign:'center' }}>
                        {other === '✗' ? <span style={{ color:'var(--red)', fontSize:18, fontWeight:700 }}>✗</span>
                         : other === '✓' ? <span style={{ color:'#25a244', fontSize:18, fontWeight:700 }}>✓</span>
                         : <span style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'var(--g500)', fontWeight:500 }}>{other}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section className="section">
          <div className="container">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:36, flexWrap:'wrap', gap:12 }}>
              <div>
                <div className="eyebrow" style={{ marginBottom:12 }}><span className="dot" />Student Voices</div>
                <h2 className="d-lg">What our students say</h2>
              </div>
              <div style={{ fontFamily:'var(--font-sans)', fontSize:13, color:'var(--g700)', fontWeight:500 }}>4.9 ★ · 347 reviews</div>
            </div>
            <div className="testi-grid">
              {TESTIMONIALS.map((t,i) => (
                <article key={i} className="testi-card fi">
                  <div style={{ fontFamily:'var(--font-serif)', fontSize:40, color:'var(--g200)', lineHeight:1, marginBottom:14 }}>"</div>
                  <p style={{ fontFamily:'var(--font-body)', fontSize:14, color:'var(--g700)', lineHeight:1.9, fontStyle:'italic', flex:1, marginBottom:20 }}>{t.text}</p>
                  <div style={{ borderTop:'var(--border)', paddingTop:14 }}>
                    <div style={{ fontFamily:'var(--font-serif)', fontSize:15, color:'var(--black)', marginBottom:2 }}>{t.name}</div>
                    <div style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'var(--g500)' }}>{t.detail}</div>
                    <div style={{ color:'var(--red)', fontSize:12, marginTop:4 }}>★★★★★</div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── STUDENT STORIES ── */}
        <section style={{ padding:'80px 0', borderBottom:'var(--border)' }}>
          <div className="container">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:36, flexWrap:'wrap', gap:16 }}>
              <div>
                <div className="eyebrow" style={{ marginBottom:12 }}><span className="dot" />Topper Interviews</div>
                <h2 className="d-lg">In their own words.</h2>
              </div>
              <a href="https://youtube.com/playlist?list=PL-GT-TifmgFIpQjkQYPWh52i4xWhKQXml" target="_blank" rel="noopener noreferrer" className="link-arr">Watch all interviews ↗</a>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1px', background:'var(--g200)', border:'var(--border)', borderRadius:4, overflow:'hidden' }}
              className="stories-grid">
              <style>{`@media(max-width:960px){.stories-grid{grid-template-columns:1fr!important}}`}</style>
              {STORIES.map((s,i) => (
                <Link key={i} href={s.href} style={{ background:'#fff', padding:24, display:'block', textDecoration:'none', transition:'background var(--t)' }}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--off)'}
                  onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
                  <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', color:s.tagColor, marginBottom:8 }}>{s.tag}</div>
                  <div style={{ fontFamily:'var(--font-serif)', fontSize:18, color:'var(--black)', marginBottom:4 }}>{s.name}</div>
                  <div style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'var(--g500)', marginBottom:12 }}>{s.college}</div>
                  <div style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--g700)', lineHeight:1.7, marginBottom:14 }}>{s.excerpt}</div>
                  <span style={{ fontFamily:'var(--font-sans)', fontSize:12, fontWeight:600, color:'var(--red)', borderBottom:'1px solid rgba(217,79,80,.3)' }}>Read story →</span>
                </Link>
              ))}
              <a href="https://youtube.com/playlist?list=PL-GT-TifmgFIpQjkQYPWh52i4xWhKQXml" target="_blank" rel="noopener noreferrer"
                style={{ background:'var(--black)', padding:24, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'flex-start', gap:10, textDecoration:'none', transition:'background var(--t)' }}
                onMouseEnter={e=>e.currentTarget.style.background='#2a2927'}
                onMouseLeave={e=>e.currentTarget.style.background='var(--black)'}>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--g500)' }}>YouTube</div>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:18, color:'#fff', lineHeight:1.3 }}>Watch all topper<br />interviews</div>
                <span style={{ fontFamily:'var(--font-sans)', fontSize:12, fontWeight:600, color:'var(--red)', borderBottom:'1px solid rgba(217,79,80,.3)' }}>View playlist ↗</span>
              </a>
            </div>
          </div>
        </section>

        {/* ── BLOG ── */}
        <section className="section">
          <div className="container">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:36, flexWrap:'wrap', gap:12 }}>
              <div>
                <div className="eyebrow" style={{ marginBottom:12 }}><span className="dot" />From the Blog</div>
                <h2 className="d-lg">Latest articles</h2>
              </div>
              <Link href="/blog" className="link-arr">All articles →</Link>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:36 }}
              className="blog-grid">
              <style>{`@media(max-width:960px){.blog-grid{grid-template-columns:1fr!important;gap:24px}}`}</style>
              {BLOGS.map((b,i) => (
                <Link key={i} href={b.href} style={{ borderBottom:'var(--border)', paddingBottom:28, display:'block', textDecoration:'none', transition:'opacity var(--t)' }}
                  onMouseEnter={e=>e.currentTarget.style.opacity='.7'}
                  onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
                  <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--red)', marginBottom:10 }}>{b.tag}</div>
                  <h3 style={{ fontFamily:'var(--font-serif)', fontSize:17, lineHeight:1.4, color:'var(--black)', marginBottom:10 }}>{b.title}</h3>
                  <p style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--g700)', lineHeight:1.8, marginBottom:12 }}>{b.excerpt}</p>
                  <div style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'var(--g500)' }}>GRADSKOOL</div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── FOUNDER ── */}
        <section className="founder-section">
          <div className="founder-l">
            <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />Founded by</div>
            <h2 style={{ fontFamily:'var(--font-serif)', fontSize:'clamp(30px,4vw,48px)', fontWeight:400, lineHeight:1.1, margin:'14px 0 20px', color:'var(--black)' }}>Abhishek<br />Leela Pandey</h2>
            <p style={{ fontFamily:'var(--font-body)', fontSize:15, color:'var(--g700)', lineHeight:1.9, maxWidth:560, marginBottom:32 }}>
              GRADSKOOL was built on a single belief — that serious exam preparation requires genuine mentorship, not content delivery. Every cohort, every session, and every platform in the GRADSKOOL ecosystem is designed around that principle. The goal has never been scale. It has always been outcomes.
            </p>
            <div className="creds-row">
              {[['99.93','CAT Percentile'],['770','GMAT Score'],['100K+','Students Mentored']].map(([v,l]) => (
                <div key={l} className="cred">
                  <div style={{ fontFamily:'var(--font-serif)', fontSize:24, color:'var(--red)', lineHeight:1, marginBottom:4 }}>{v}</div>
                  <div style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:500, color:'var(--g500)' }}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
              {[
                ['TradeFlock','40 Under 40 — 2024','https://tradeflock.com/40-under-40-2024-abhishek-leela-pandey/'],
                ['Insights Success','EdTech Leaders Changing Education','https://issuu.com/insightssuccess22/docs/edtech_leaders_who_are_changing_the_face_of_educat'],
                ['Amazon','Published Author','https://www.amazon.com/stores/author/B072N5TSR1/allbooks'],
              ].map(([src, title, href]) => (
                <a key={src} href={href} target="_blank" rel="noopener noreferrer" className="fi"
                  style={{ display:'flex', alignItems:'center', gap:16, padding:'14px 18px', border:'var(--border)', background:'#fff', textDecoration:'none', transition:'background var(--t)' }}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--off)'}
                  onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
                  <span style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:600, letterSpacing:'.09em', textTransform:'uppercase', color:'var(--red)', minWidth:110, flexShrink:0 }}>{src}</span>
                  <span style={{ fontFamily:'var(--font-serif)', fontSize:14, color:'var(--black)', flex:1 }}>{title}</span>
                  <span style={{ fontSize:12, color:'var(--g300)', marginLeft:'auto', flexShrink:0 }}>→</span>
                </a>
              ))}
            </div>
          </div>
          <div className="founder-r">
            <picture>
              <source srcSet="/assets/alp.webp" type="image/webp" />
              <img src="/assets/alp.jpg" alt="Abhishek Leela Pandey — Founder of GRADSKOOL. 99.93 percentile CAT, 770 GMAT."
                style={{ width:'100%', maxWidth:280, aspectRatio:'4/5', objectFit:'cover', borderRadius:3, filter:'grayscale(10%)', boxShadow:'var(--shadow)' }}
                width={280} height={350} loading="lazy" />
            </picture>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section style={{ background:'var(--black)', padding:'88px 0', borderBottom:'var(--border)', textAlign:'center' }}>
          <div className="container">
            <h2 style={{ fontFamily:'var(--font-serif)', fontSize:'clamp(28px,4vw,48px)', fontWeight:400, color:'#fff', lineHeight:1.12, marginBottom:16 }}>
              Ready to prepare<br />the <em style={R}>right</em> way?
            </h2>
            <p style={{ fontFamily:'var(--font-body)', fontSize:15, color:'var(--g500)', lineHeight:1.8, maxWidth:460, margin:'0 auto 36px' }}>
              Seats in every cohort are limited to 27 students. Once full, the next cohort opens only after the current one completes.
            </p>
            <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
              <Link href="/courses/cat/catalysis" className="btn btn-white">Explore CATalysis →</Link>
              <Link href="/courses/cat/cathlete"  className="btn btn-ghost">CAThlete 2026 →</Link>
              <a href="https://wa.me/917838737388?text=Hi%20ALP%20Sir%2C%20I%20want%20to%20know%20more%20about%20GRADSKOOL"
                target="_blank" rel="noopener noreferrer" className="btn btn-ghost"><span className="wa-dot" />WhatsApp us first</a>
            </div>
          </div>
        </section>
      </main>

      {/* ── FLOATING WA ── */}
      <a href="https://wa.me/917838737388?text=Hi%20ALP%20Sir%2C%20I%20want%20to%20know%20more%20about%20GRADSKOOL"
        target="_blank" rel="noopener noreferrer" className="wa-float">
        <svg viewBox="0 0 24 24" fill="currentColor" style={{ width:19, height:19, flexShrink:0 }}>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        WhatsApp ALP Sir
      </a>

      {/* ── MOBILE STICKY ── */}
      <div className="mob-sticky">
        <div>
          <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:600, letterSpacing:'.07em', textTransform:'uppercase', color:'var(--g500)' }}>CAThlete</div>
          <div style={{ fontFamily:'var(--font-serif)', fontSize:19, color:'var(--black)', lineHeight:1.2 }}>₹6,999</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <a href="https://wa.me/917838737388?text=Hi%20ALP%20Sir%2C%20I%20want%20to%20know%20about%20CAT%202026"
            target="_blank" rel="noopener noreferrer"
            style={{ fontFamily:'var(--font-sans)', fontSize:12, fontWeight:600, color:'#25D366', border:'2px solid #25D366', padding:'8px 14px', borderRadius:2, textDecoration:'none' }}>
            WhatsApp
          </a>
          <Link href="/checkout?course=cathlete"
            style={{ fontFamily:'var(--font-sans)', fontSize:12, fontWeight:600, background:'var(--red)', color:'#fff', padding:'8px 18px', borderRadius:2, textDecoration:'none' }}>
            Enrol →
          </Link>
        </div>
      </div>

      {/* ── SOCIAL PROOF POPUP ── */}
      {proof && (
        <div className={`proof-popup${proofVisible ? ' visible' : ''}`}>
          <div style={{ width:38, height:38, borderRadius:'50%', background:'var(--g100)', border:'var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-serif)', fontSize:16, color:'var(--g700)', flexShrink:0 }}>
            {proof.name[0]}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:'var(--font-sans)', fontSize:13, fontWeight:600, color:'var(--black)', lineHeight:1.3 }}>{proof.name}</div>
            <div style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'var(--g500)', marginTop:2 }}>{proof.detail}</div>
            <div style={{ fontFamily:'var(--font-sans)', fontSize:10, color:'var(--g300)', marginTop:4 }}>{proof.time} · {proof.city}</div>
          </div>
          <button onClick={() => setProofVisible(false)} style={{ position:'absolute', top:8, right:10, fontSize:14, color:'var(--g300)', cursor:'pointer', padding:2 }}>✕</button>
        </div>
      )}
    </>
  )
}
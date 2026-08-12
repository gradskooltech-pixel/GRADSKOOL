/**
 * GRADSKOOL — Public Cohort Page
 * Route: /cohorts/[slug]
 *
 * Same design as /courses/[exam] but shows:
 * - Cohort-specific start/end dates
 * - Live seats remaining for this cohort
 * - Same curriculum, pricing, FAQs from the parent exam
 */
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export async function getStaticPaths() {
  return { paths: [], fallback: true }
}

export async function getStaticProps({ params }) {
  try {
    const res    = await fetch(`${API}/courses/cohorts/${params.cohortSlug}/`)
    const cohort = await res.json()
    if (cohort.error) return { notFound: true }
    return { props: { cohort }, revalidate: 60 }
  } catch {
    return { notFound: true }
  }
}

const C = {
  red: '#ff5e5f', redLight: '#fff0f0', black: '#0f0f0f',
  gray600: '#555', gray400: '#999', gray50: '#fafaf9',
  border: '#e8e8e6', white: '#ffffff',
}

export default function CohortPage({ cohort }) {
  const router = useRouter()
  const [openFaq, setOpenFaq] = useState(null)
  const [openMod, setOpenMod] = useState(0)

  if (router.isFallback || !cohort) {
    return (
      <div style={{ padding:'6rem 2rem', textAlign:'center', fontFamily:'var(--font-sans)' }}>
        <p style={{ color:'#999' }}>Loading cohort details…</p>
      </div>
    )
  }

  const exam    = cohort.exam_detail || {}
  const plans   = exam.plans || []
  const faqs    = exam.faqs  || []
  const slug    = cohort.exam_slug

  const seatsRemaining = cohort.remaining
  const isFull         = cohort.is_full

  // Format dates
  const fmtDate = (d) => {
    if (!d) return null
    const dt = new Date(d)
    return dt.toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })
  }

  return (
    <>
      <Head>
        <title>{cohort.title} — GRADSKOOL</title>
        <meta name="description" content={cohort.description || `${cohort.title} — ${cohort.exam_name} preparation cohort. ${seatsRemaining} seats remaining.`} />
        <link rel="canonical" href={`https://gradskool.in/cohorts/${cohort.slug}`} />
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50%       { opacity: 0.5; transform: scale(0.85); }
          }
        `}</style>
      </Head>

      {/* BREADCRUMB */}
      <div style={{ padding:'0.875rem 2rem', borderBottom:`1px solid ${C.border}`, background:C.white }}>
        <div style={{ maxWidth:'1160px', margin:'0 auto', display:'flex', gap:'0.5rem', fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:C.gray400, flexWrap:'wrap' }}>
          <Link href="/" style={{ color:C.gray400, textDecoration:'none' }}>Home</Link>
          <span>/</span>
          <Link href="/courses" style={{ color:C.gray400, textDecoration:'none' }}>Courses</Link>
          <span>/</span>
          <Link href={`/courses/${slug}`} style={{ color:C.gray400, textDecoration:'none' }}>{cohort.exam_name}</Link>
          <span>/</span>
          <span style={{ color:C.black }}>{cohort.cohort_label || cohort.title}</span>
        </div>
      </div>

      {/* HERO */}
      <section style={{ background:C.white, padding:'7rem 2rem 5rem' }}>
        <div style={{ maxWidth:'1160px', margin:'0 auto', display:'grid', gridTemplateColumns:'1.1fr 0.9fr', gap:'5rem', alignItems:'flex-start' }}>

          {/* Left */}
          <div>
            {/* Tags row */}
            <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem', marginBottom:'1.75rem', alignItems:'flex-start' }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', fontFamily:'var(--font-sans)', fontSize:'0.75rem', fontWeight:'500', letterSpacing:'0.09em', textTransform:'uppercase', color:C.red, border:`1px solid #ffd0d0`, background:C.redLight, padding:'0.3rem 0.8rem', borderRadius:'2px' }}>
                <span style={{ width:'6px', height:'6px', background:C.red, borderRadius:'50%', animation: cohort.is_open ? 'pulse 2s infinite' : 'none', flexShrink:0 }} />
                {cohort.is_open ? 'Enrolment Open' : cohort.status === 'active' ? 'Cohort Running' : 'Upcoming Cohort'}
              </div>
              {/* Seats pill */}
              <div style={{ display:'inline-flex', alignItems:'center', gap:'0.4rem', fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'600',
                color: isFull ? '#991b1b' : seatsRemaining <= 5 ? '#991b1b' : '#166534',
                background: isFull ? '#fff5f5' : seatsRemaining <= 5 ? '#fff5f5' : '#f0fdf4',
                border: `1px solid ${isFull || seatsRemaining <= 5 ? '#fca5a5' : '#86efac'}`,
                padding:'0.2rem 0.7rem', borderRadius:'100px' }}>
                <span style={{ width:'5px', height:'5px', borderRadius:'50%', background: isFull || seatsRemaining <= 5 ? '#ef4444' : '#22c55e', flexShrink:0 }} />
                {isFull ? 'Cohort Full — Join Waitlist' : `${seatsRemaining} of ${cohort.batch_size} seats remaining`}
              </div>
            </div>

            <h1 style={{ fontFamily:'Georgia,serif', fontSize:'clamp(2.4rem,4.5vw,3.6rem)', lineHeight:'1.08', color:C.black, marginBottom:'1.25rem', fontWeight:'700' }}>
              {cohort.title}
            </h1>

            {cohort.description && (
              <p style={{ fontFamily:'Georgia,serif', fontSize:'1.05rem', color:C.gray600, lineHeight:'1.75', maxWidth:'480px', marginBottom:'1.5rem' }}>
                {cohort.description}
              </p>
            )}

            {/* Cohort dates */}
            {(cohort.start_date || cohort.end_date) && (
              <div style={{ display:'flex', gap:'2.5rem', marginBottom:'2rem', padding:'1.25rem 1.5rem', background:C.gray50, border:`1px solid ${C.border}`, borderRadius:'4px', flexWrap:'wrap' }}>
                {cohort.start_date && (
                  <div>
                    <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'600', letterSpacing:'0.1em', textTransform:'uppercase', color:C.gray400, marginBottom:'0.3rem' }}>Cohort Starts</p>
                    <p style={{ fontFamily:'Georgia,serif', fontSize:'1rem', fontWeight:'600', color:C.black }}>{fmtDate(cohort.start_date)}</p>
                  </div>
                )}
                {cohort.end_date && (
                  <div>
                    <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'600', letterSpacing:'0.1em', textTransform:'uppercase', color:C.gray400, marginBottom:'0.3rem' }}>Cohort Ends</p>
                    <p style={{ fontFamily:'Georgia,serif', fontSize:'1rem', fontWeight:'600', color:C.black }}>{fmtDate(cohort.end_date)}</p>
                  </div>
                )}
                <div>
                  <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'600', letterSpacing:'0.1em', textTransform:'uppercase', color:C.gray400, marginBottom:'0.3rem' }}>Cohort Size</p>
                  <p style={{ fontFamily:'Georgia,serif', fontSize:'1rem', fontWeight:'600', color:C.black }}>{cohort.batch_size} Students</p>
                </div>
              </div>
            )}

            <div style={{ display:'flex', alignItems:'center', gap:'1.25rem', flexWrap:'wrap' }}>
              <a href="#pricing" style={{ background:C.black, color:'#fff', padding:'0.8rem 1.8rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.88rem', fontWeight:'500', letterSpacing:'0.03em', textDecoration:'none' }}>
                {isFull ? 'Join Waitlist →' : 'View Pricing →'}
              </a>
              <Link href={`/courses/${slug}`} style={{ fontFamily:'var(--font-sans)', color:C.black, fontSize:'0.88rem', borderBottom:`1px solid ${C.border}`, paddingBottom:'2px', textDecoration:'none' }}>
                View full {cohort.exam_short} page ↗
              </Link>
            </div>
          </div>

          {/* Right — Enrol card */}
          <div style={{ position:'sticky', top:'82px', background:C.gray50, border:`1px solid ${C.border}`, borderRadius:'4px', overflow:'hidden' }}>
            <div style={{ background:C.black, padding:'2rem 2rem 1.75rem', position:'relative' }}>
              <div style={{ position:'absolute', top:0, left:0, width:'3px', height:'100%', background:C.red }} />
              <div style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', fontWeight:'500', letterSpacing:'0.1em', textTransform:'uppercase', color:C.gray400, marginBottom:'0.5rem' }}>
                {cohort.cohort_label || 'This Cohort'} — Starting From
              </div>
              <div style={{ fontFamily:'Georgia,serif', fontSize:'2.8rem', color:'#fff', fontWeight:'700', lineHeight:'1', marginBottom:'0.3rem' }}>
                ₹27,999 <sub style={{ fontFamily:'var(--font-sans)', fontSize:'0.9rem', fontWeight:'300', color:C.gray400, verticalAlign:'baseline', marginLeft:'0.25rem' }}>+ GST</sub>
              </div>
              {cohort.start_date && (
                <div style={{ fontFamily:'Georgia,serif', fontSize:'0.82rem', color:C.gray400, fontStyle:'italic' }}>
                  Starts {fmtDate(cohort.start_date)}
                </div>
              )}
            </div>
            <div style={{ padding:'1.75rem 2rem 2rem' }}>
              <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:'0.85rem', marginBottom:'1.75rem' }}>
                {[
                  'Live two-way sessions with ALP Sir',
                  'Daily structured practice sets',
                  '15+ full-length CAT mocks',
                  'Post-test strategic analysis',
                  'VARC, DILR & QA modules',
                  'GDPI preparation included',
                  'Recorded session access',
                  'Doubt resolution every session',
                ].map((f,i) => (
                  <li key={i} style={{ fontFamily:'Georgia,serif', fontSize:'0.875rem', color:C.gray600, display:'flex', alignItems:'flex-start', gap:'0.65rem', lineHeight:'1.5' }}>
                    <span style={{ color:C.red, fontFamily:'var(--font-sans)', fontWeight:'700', flexShrink:0 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={`/checkout/${slug}`}
                style={{ display:'block', width:'100%', textAlign:'center', background: isFull ? C.gray400 : C.red, color:'#fff', padding:'0.9rem 1rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.9rem', fontWeight:'500', letterSpacing:'0.03em', textDecoration:'none', marginBottom:'1rem', pointerEvents: isFull ? 'none' : 'auto' }}>
                {isFull ? 'Cohort Full' : 'Enrol / Enquire →'}
              </Link>
              <p style={{ fontFamily:'Georgia,serif', fontSize:'0.8rem', color:C.gray400, textAlign:'center', lineHeight:'1.5' }}>
                {isFull
                  ? 'This cohort is full. WhatsApp us to join the waitlist.'
                  : `${seatsRemaining} of ${cohort.batch_size} seats remaining.`}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <div style={{ background:C.black, padding:'3rem 2rem' }}>
        <div style={{ maxWidth:'1160px', margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'2rem' }}>
          {[
            { val: cohort.batch_size,   label:'Students in This Cohort' },
            { val:'30',                  label:'Full-Length Mocks' },
            { val:'400+',                label:'Hours Live Teaching' },
            { val: seatsRemaining,       label:'Seats Remaining' },
          ].map((s,i) => (
            <div key={i} style={{ textAlign:'center' }}>
              <span style={{ fontFamily:'Georgia,serif', fontSize:'2.8rem', color: i===3 && seatsRemaining<=5 ? C.red : '#fff', display:'block', lineHeight:'1', marginBottom:'0.5rem', fontWeight:'700' }}>{s.val}</span>
              <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:C.gray400, letterSpacing:'0.06em', textTransform:'uppercase' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CURRICULUM */}
      {exam.curriculum?.length > 0 && (
        <section style={{ background:C.gray50, borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}`, padding:'6rem 2rem' }}>
          <div style={{ maxWidth:'1160px', margin:'0 auto' }}>
            <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'500', letterSpacing:'0.1em', textTransform:'uppercase', color:C.red, marginBottom:'0.6rem' }}>What You'll Learn</p>
            <h2 style={{ fontFamily:'Georgia,serif', fontSize:'clamp(1.9rem,3vw,2.6rem)', color:C.black, lineHeight:'1.15', marginBottom:'2.5rem', fontWeight:'700' }}>Course Curriculum</h2>
            <div style={{ display:'flex', flexDirection:'column', border:`1px solid ${C.border}`, borderRadius:'4px', overflow:'hidden' }}>
              {exam.curriculum.map((mod, i) => (
                <div key={i} style={{ borderBottom:`1px solid ${C.border}`, background:C.white }}>
                  <button onClick={() => setOpenMod(openMod===i ? null : i)}
                    style={{ width:'100%', background: openMod===i ? C.black : C.white, border:'none', padding:'1.5rem 2rem', textAlign:'left', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', gap:'1rem', transition:'background 0.2s' }}>
                    <div>
                      <div style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'600', color: openMod===i ? C.red : C.gray400, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'0.25rem' }}>{mod.number}</div>
                      <div style={{ fontFamily:'Georgia,serif', fontSize:'1.1rem', fontWeight:'500', color: openMod===i ? '#fff' : C.black }}>{mod.title}</div>
                    </div>
                    <span style={{ fontFamily:'var(--font-sans)', fontSize:'1.2rem', color: openMod===i ? C.red : C.gray400, flexShrink:0, transition:'transform 0.25s', lineHeight:'1', transform: openMod===i ? 'rotate(45deg)' : 'none' }}>+</span>
                  </button>
                  {openMod===i && (
                    <div style={{ padding:'1.5rem 2rem 2rem', borderTop:`1px solid ${C.border}` }}>
                      <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:'0.6rem' }}>
                        {mod.topics?.map((t,j) => (
                          <li key={j} style={{ fontFamily:'Georgia,serif', fontSize:'0.9rem', color:C.gray600, display:'flex', alignItems:'flex-start', gap:'0.6rem', lineHeight:'1.6' }}>
                            <span style={{ color:C.red, flexShrink:0 }}>—</span>{t.title || t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* PRICING */}
      {plans.length > 0 && (
        <section style={{ maxWidth:'1160px', margin:'0 auto', padding:'6rem 2rem' }} id="pricing">
          <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'500', letterSpacing:'0.1em', textTransform:'uppercase', color:C.red, marginBottom:'0.6rem' }}>Plans & Pricing</p>
          <h2 style={{ fontFamily:'Georgia,serif', fontSize:'clamp(1.9rem,3vw,2.6rem)', color:C.black, lineHeight:'1.15', marginBottom:'0.9rem', fontWeight:'700' }}>{cohort.exam_short} — Plans & Pricing</h2>
          <p style={{ fontFamily:'Georgia,serif', fontSize:'1rem', color:C.gray600, maxWidth:'520px', lineHeight:'1.75', marginBottom:'2.5rem' }}>
            Same structured preparation. Same live cohort. Same ALP Sir.
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1.5rem' }}>
            {plans.map((plan,i) => (
              <PricingCard key={i} plan={plan} slug={slug} />
            ))}
          </div>
        </section>
      )}

      {/* FAQs */}
      {faqs.length > 0 && (
        <section style={{ background:C.gray50, borderTop:`1px solid ${C.border}`, padding:'6rem 2rem' }}>
          <div style={{ maxWidth:'1160px', margin:'0 auto' }}>
            <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'500', letterSpacing:'0.1em', textTransform:'uppercase', color:C.red, marginBottom:'0.6rem' }}>Common Questions</p>
            <h2 style={{ fontFamily:'Georgia,serif', fontSize:'clamp(1.9rem,3vw,2.6rem)', color:C.black, lineHeight:'1.15', marginBottom:'3rem', fontWeight:'700' }}>FAQs</h2>
            <div style={{ display:'flex', flexDirection:'column', border:`1px solid ${C.border}`, borderRadius:'4px', overflow:'hidden' }}>
              {faqs.map((faq,i) => (
                <div key={i} style={{ borderBottom: i<faqs.length-1 ? `1px solid ${C.border}` : 'none', background:C.white }}>
                  <button onClick={() => setOpenFaq(openFaq===i ? null : i)}
                    style={{ width:'100%', background:'none', border:'none', padding:'1.4rem 1.75rem', textAlign:'left', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', gap:'1rem' }}>
                    <span style={{ fontFamily:'Georgia,serif', fontSize:'0.95rem', fontWeight:'500', color:C.black, lineHeight:'1.5' }}>{faq.question}</span>
                    <span style={{ fontFamily:'var(--font-sans)', fontSize:'1.2rem', color:C.red, flexShrink:0, transition:'transform 0.25s', lineHeight:'1', transform: openFaq===i ? 'rotate(45deg)' : 'none' }}>+</span>
                  </button>
                  {openFaq===i && (
                    <div style={{ padding:'0 1.75rem 1.5rem' }}>
                      <p style={{ fontFamily:'Georgia,serif', fontSize:'0.9rem', color:C.gray600, lineHeight:'1.8' }}>{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <div style={{ background:C.red, padding:'5.5rem 2rem', textAlign:'center' }}>
        <h2 style={{ fontFamily:'Georgia,serif', fontSize:'clamp(2rem,3.5vw,3rem)', color:'#fff', marginBottom:'1rem', lineHeight:'1.15', fontWeight:'700' }}>
          {isFull ? 'This Cohort is Full.' : `Only ${seatsRemaining} Seat${seatsRemaining === 1 ? '' : 's'} Remaining.`}
        </h2>
        <p style={{ fontFamily:'Georgia,serif', fontSize:'1rem', color:'rgba(255,255,255,0.85)', marginBottom:'2.5rem', maxWidth:'460px', margin:'0 auto 2.5rem', lineHeight:'1.7' }}>
          {isFull
            ? 'Join the waitlist and we\'ll notify you when the next cohort opens.'
            : `This cohort is limited to ${cohort.batch_size} students. Once full, the next cohort opens only after this one completes.`}
        </p>
        <div style={{ display:'flex', justifyContent:'center', gap:'1rem', flexWrap:'wrap' }}>
          {isFull ? (
            <a href="https://wa.me/916360597966" target="_blank" rel="noreferrer"
              style={{ background:'#fff', color:C.red, padding:'0.9rem 2.5rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.9rem', fontWeight:'500', display:'inline-block', textDecoration:'none' }}>
              💬 Join Waitlist
            </a>
          ) : (
            <Link href={`/checkout/${slug}`}
              style={{ background:'#fff', color:C.red, padding:'0.9rem 2.5rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.9rem', fontWeight:'500', display:'inline-block', textDecoration:'none' }}>
              Enrol Now →
            </Link>
          )}
          <a href="https://wa.me/916360597966" target="_blank" rel="noreferrer"
            style={{ background:'transparent', color:'#fff', padding:'0.9rem 2rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.9rem', border:'1px solid rgba(255,255,255,0.5)', display:'inline-block', textDecoration:'none' }}>
            💬 WhatsApp Us
          </a>
        </div>
      </div>
    </>
  )
}

function PricingCard({ plan, slug }) {
  const [hov, setHov] = useState(false)
  const C2 = { red:'#ff5e5f', black:'#0f0f0f', gray600:'#555', gray400:'#999', border:'#e8e8e6' }
  return (
    <div style={{ border:`1px solid ${plan.is_featured ? C2.black : hov ? '#bbb' : C2.border}`, borderRadius:'4px', overflow:'hidden', background:'#fff', boxShadow: plan.is_featured ? '0 4px 24px rgba(0,0,0,0.1)' : hov ? '0 4px 24px rgba(0,0,0,0.07)' : 'none', transition:'box-shadow 0.25s, border-color 0.25s' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div style={{ padding:'2rem 2rem 1.5rem', borderBottom:`1px solid ${C2.border}`, background: plan.is_featured ? C2.black : '#fff' }}>
        {plan.badge_text && <div style={{ display:'inline-block', fontFamily:'var(--font-sans)', fontSize:'0.68rem', fontWeight:'500', letterSpacing:'0.07em', textTransform:'uppercase', padding:'0.2rem 0.55rem', borderRadius:'2px', marginBottom:'0.75rem', background: plan.is_featured ? 'rgba(255,94,95,0.2)' : '#fff0f0', color:'#ff5e5f' }}>{plan.badge_text}</div>}
        <div style={{ fontFamily:'Georgia,serif', fontSize:'1.3rem', color: plan.is_featured ? '#fff' : C2.black, marginBottom:'1rem', fontWeight:'500' }}>{plan.name}</div>
        <div style={{ fontFamily:'Georgia,serif', fontSize:'2.8rem', color: plan.is_featured ? '#fff' : C2.black, fontWeight:'700', lineHeight:'1' }}>
          <sup style={{ fontSize:'1.2rem', verticalAlign:'super' }}>₹</sup>
          {Number(plan.price_inr).toLocaleString('en-IN')}
          <sub style={{ fontFamily:'var(--font-sans)', fontSize:'0.85rem', fontWeight:'300', color:C2.gray400, verticalAlign:'baseline', marginLeft:'0.2rem' }}>+ GST</sub>
        </div>
      </div>
      <div style={{ padding:'1.75rem 2rem 2rem' }}>
        <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:'0.75rem', marginBottom:'1.75rem' }}>
          {(plan.features || []).map((f,i) => (
            <li key={i} style={{ fontFamily:'Georgia,serif', fontSize:'0.875rem', color: f[1] ? C2.gray600 : '#ccc', display:'flex', alignItems:'flex-start', gap:'0.65rem', lineHeight:'1.5' }}>
              <span style={{ color: f[1] ? C2.red : '#ccc', fontFamily:'var(--font-sans)', fontWeight:'700', flexShrink:0 }}>{f[1] ? '✓' : '✕'}</span>
              {f[0]}
            </li>
          ))}
        </ul>
        <Link href={`/checkout/${slug}`} style={{ display:'block', width:'100%', textAlign:'center', padding:'0.85rem 1rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.88rem', fontWeight:'500', letterSpacing:'0.03em', textDecoration:'none', ...(plan.is_featured ? { background:'#ff5e5f', color:'#fff' } : { border:`1px solid ${C2.black}`, color:C2.black }) }}>
          Enrol Now →
        </Link>
      </div>
    </div>
  )
}